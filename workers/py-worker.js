/**
 * Web-MarkItDown - py-worker.js
 * Pyodideの実行環境をメインスレッドから分離し、Web Workerで動作させる。
 * ONNX Runtime Web を使用して、Magikaによるファイル形式判定をブラウザで動作させる。
 */

importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js');
importScripts('https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js');

class PyodideEnv {
    constructor() {
        this.pyodide = null;
        this.isInitialized = false;
    }

    /**
     * Pyodideをロードし、必要なパッケージをインストールする。
     */
    async init() {
        if (this.isInitialized) return;

        try {
            this.pyodide = await self.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
            });

            await this.pyodide.loadPackage('micropip');
            const micropip = this.pyodide.pyimport('micropip');

            // 1. ローカルソースコードを VFS にロード
            console.log('[Worker] Loading local markitdown source...');
            const response = await fetch('/markitdown_manifest.json');
            const manifest = await response.json();

            const srcRoot = '/home/pyodide/markitdown_src';
            for (const file of manifest) {
                const filePath = `${srcRoot}/${file.path}`;
                const pathParts = filePath.split('/');
                let currentPath = '';
                for (let i = 1; i < pathParts.length - 1; i++) {
                    currentPath += `/${pathParts[i]}`;
                    try { this.pyodide.FS.mkdir(currentPath); } catch(e) {}
                }
                this.pyodide.FS.writeFile(filePath, file.content);
            }

            // sys.path にソースルートを追加
            await this.pyodide.runPythonAsync(`
import sys
sys.path.append('/home/pyodide/markitdown_src')
            `);

            // 2. 依存ライブラリのインストール (純粋Pythonのみ)
            // Pyodide 公式パッケージを優先的にロード
            const officialPackages = ['numpy', 'pillow', 'cryptography'];
            for (const pkg of officialPackages) {
                try {
                    await this.pyodide.loadPackage(pkg);
                } catch (e) {
                    console.warn(`[Worker] Official package ${pkg} load failed:`, e);
                }
            }

            const deps = [
                'requests', 'beautifulsoup4', 'markdownify', 'defusedxml',
                'certifi', 'charset-normalizer', 'click', 'flatbuffers',
                'idna', 'mpmath', 'packaging', 'python-dotenv',
                'six', 'soupsieve', 'sympy', 'typing-extensions', 'urllib3',
                'pdfminer.six', 'pdfplumber'
            ];
            for (const dep of deps) {
                try {
                    await micropip.install(dep);
                } catch (e) {
                    console.warn(`[Worker] ${dep} install failed:`, e);
                }
            }

            // 3. ONNX Runtime Web Bridge & Async Patch
            await this.pyodide.runPythonAsync(`
import sys
from types import ModuleType
import js

# onnxruntime モック
ort_mock = ModuleType('onnxruntime')
sys.modules['onnxruntime'] = ort_mock

class JSInferenceSession:
    def __init__(self, model_path):
        self.model_path = model_path
        self.session = None

    async def _ensure_session(self):
        if self.session is None:
            self.session = await js.ort.InferenceSession.create(self.model_path)

    async def run(self, inputs):
        await self._ensure_session()
        return await self.session.run(inputs)

ort_mock.InferenceSession = JSInferenceSession

# magika モック
magika_mock = ModuleType('magika')
sys.modules['magika'] = magika_mock
class MockMagika:
    def __init__(self):
        pass
    def detect_file(self, path):
        class PredictionOutput:
            def __init__(self):
                self.label = "unknown"
                self.is_text = False
                self.mime_type = "application/octet-stream"
                self.extensions = []
        class Prediction:
            def __init__(self):
                self.output = PredictionOutput()
        class Result:
            def __init__(self):
                self.status = "ok"
                self.prediction = Prediction()
        return Result()

    def identify_stream(self, stream):
        class PredictionOutput:
            def __init__(self):
                self.label = "unknown"
                self.is_text = False
                self.mime_type = "application/octet-stream"
                self.extensions = []
        class Prediction:
            def __init__(self):
                self.output = PredictionOutput()
        class Result:
            def __init__(self):
                self.status = "ok"
                self.prediction = Prediction()
        return Result()
magika_mock.Magika = MockMagika

# PDF依存関係チェックのバイパス
import markitdown.converters._pdf_converter as pdf_conv
pdf_conv._dependency_exc_info = None

# MarkItDown の初期化
import markitdown
            `);

            // MarkItDownインスタンスを作成
            this.pyodide.runPython(`
from markitdown import MarkItDown
global_md = MarkItDown()
            `);

            this.isInitialized = true;
            console.log('[Worker] Pyodide環境の初期化 (ソースロード方式) が完了しました。');
        } catch (error) {
            console.error('[Worker] Pyodide環境の初期化に失敗しました:', error);
            throw error;
        }
    }
}

class FSHandler {
    async writeFileFromBuffer(fileName, data, pyodide) {
        if (!pyodide) throw new Error('Pyodideインスタンスが必要です。');
        const filePath = `/tmp/${fileName}`;
        try {
            pyodide.FS.writeFile(filePath, data);
            return filePath;
        } catch (error) {
            console.error(`[Worker] VFS書き込みエラー ${fileName}:`, error);
            throw new Error(`ファイル保存に失敗しました: ${error.message}`);
        }
    }

    deleteFile(filePath, pyodide) {
        if (!pyodide || !filePath) return;
        try {
            pyodide.FS.unlink(filePath);
        } catch (error) {
            console.warn(`[Worker] 警告: ファイル削除に失敗しました:`, error);
        }
    }
}

class PyConverter {
    async convert(pyodide, filePath) {
        try {
            pyodide.globals.set('filePath', filePath);

            // 同期的に convert を実行し、結果の markdown を取得
            const pythonCode = `
result = global_md.convert(filePath)
result.markdown
            `;

            const markdown = await pyodide.runPythonAsync(pythonCode);
            return markdown;
        } catch (error) {
            console.error('[Worker] PyConverterでの変換エラー:', error);
            throw error;
        }
    }
}

const pyEnv = new PyodideEnv();
const fsHandler = new FSHandler();
const converter = new PyConverter();

self.onmessage = async (e) => {
    const { type, payload } = e.data;
    try {
        switch (type) {
            case 'INIT':
                await pyEnv.init();
                self.postMessage({ type: 'INIT_SUCCESS' });
                break;
            case 'CONVERT':
                const { fileName, fileData } = payload;
                const filePath = await fsHandler.writeFileFromBuffer(fileName, fileData, pyEnv.pyodide);
                const markdown = await converter.convert(pyEnv.pyodide, filePath);
                fsHandler.deleteFile(filePath, pyEnv.pyodide);
                self.postMessage({ type: 'CONVERT_SUCCESS', payload: { markdown } });
                break;
            default:
                self.postMessage({ type: 'ERROR', payload: { message: `未知のコマンドです: ${type}` } });
        }
    } catch (error) {
        self.postMessage({ type: 'ERROR', payload: { message: error.message } });
    }
};
