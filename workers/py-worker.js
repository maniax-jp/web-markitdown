/**
 * Web-MarkItDown - py-worker.js
 * Pyodideの実行環境をメインスレッドから分離し、Web Workerで動作させる。
 */

importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js');

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
            // Worker環境では self.loadPyodide を使用
            this.pyodide = await self.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
            });

            // micropipをロードしてmarkitdownをインストール
            await this.pyodide.loadPackage('micropip');
            const micropip = this.pyodide.pyimport('micropip');

            // markitdownをインストール
            await micropip.install('markitdown');

            this.isInitialized = true;
            console.log('[Worker] Pyodide environment initialized and markitdown installed.');
        } catch (error) {
            console.error('[Worker] Failed to initialize Pyodide environment:', error);
            throw error;
        }
    }
}

class FSHandler {
    /**
     * バッファデータ(Uint8Array)をPyodideの仮想ファイルシステムに書き込む。
     * @param {string} fileName - ファイル名
     * @param {Uint8Array} data - 書き込むデータ
     * @param {any} pyodide - Pyodideインスタンス
     * @returns {Promise<string>} 仮想FS上のファイルパス
     */
    async writeFileFromBuffer(fileName, data, pyodide) {
        if (!pyodide) {
            throw new Error('仮想ファイルシステムへの書き込みにはPyodideインスタンスが必要です。');
        }
        const filePath = `/tmp/${fileName}`;
        try {
            pyodide.FS.writeFile(filePath, data);
            return filePath;
        } catch (error) {
            console.error(`[Worker] VFSへのバッファ書き込みエラー ${fileName}:`, error);
            throw new Error(`仮想システムへのファイル保存に失敗しました: ${error.message}`);
        }
    }

    /**
     * 仮想ファイルシステムからファイルを削除する。
     * @param {string} filePath - 削除するファイルのパス
     * @param {any} pyodide - Pyodideインスタンス
     */
    deleteFile(filePath, pyodide) {
        if (!pyodide || !filePath) return;
        try {
            pyodide.FS.unlink(filePath);
        } catch (error) {
            console.warn(`[Worker] 警告: 仮想ファイル ${filePath} の削除に失敗しました:`, error);
        }
    }
}

class PyConverter {
    /**
     * 仮想FS上のファイルをマークダウンに変換する。
     * @param {any} pyodide - Pyodideインスタンス
     * @param {string} filePath - 仮想FS上のファイルパス
     * @returns {Promise<string>} 変換後のマークダウン
     */
    async convert(pyodide, filePath) {
        try {
            pyodide.globals.set('filePath', filePath);

            const pythonCode = `
from markitdown import MarkItDown
md = MarkItDown()
result = md.convert(filePath)
result.markdown
            `;

            const markdown = pyodide.runPython(pythonCode);
            return markdown;
        } catch (error) {
            console.error('[Worker] Conversion error in PyConverter:', error);
            throw error;
        }
    }
}

// インスタンス化
const pyEnv = new PyodideEnv();
const fsHandler = new FSHandler();
const converter = new PyConverter();

/**
 * メインスレッドからのメッセージ処理
 */
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

                // 1. ファイルを仮想FSに書き込み
                const filePath = await fsHandler.writeFileFromBuffer(fileName, fileData, pyEnv.pyodide);

                // 2. 変換実行
                const markdown = await converter.convert(pyEnv.pyodide, filePath);

                // 3. クリーンアップ
                fsHandler.deleteFile(filePath, pyEnv.pyodide);

                self.postMessage({
                    type: 'CONVERT_SUCCESS',
                    payload: { markdown }
                });
                break;

            default:
                self.postMessage({
                    type: 'ERROR',
                    payload: { message: `未知のコマンドです: ${type}` }
                });
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: { message: error.message }
        });
    }
};
