/**
 * Web-MarkItDown - main.js
 * エントリーポイント。UIイベント管理とPyodideオーケストレーションを行う。
 */

import { Downloader } from './utils/downloader.js';
import { ErrorHandler } from './utils/error-handler.js';

class App {
    constructor() {
        this.worker = new Worker('./workers/py-worker.js');
        this.downloader = new Downloader();
        this.errorHandler = new ErrorHandler();

        this.initUI();
    }

    initUI() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.statusContainer = document.getElementById('status-container');
        this.statusText = document.getElementById('status-text');
        this.resultContainer = document.getElementById('result-container');
        this.markdownOutput = document.getElementById('markdown-output');
        this.downloadBtn = document.getElementById('download-btn');
        this.clearBtn = document.getElementById('clear-btn');

        // ファイル選択イベント
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // ドラッグ&ドロップイベント
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // ダウンロードボタン
        this.downloadBtn.addEventListener('click', () => {
            const content = this.markdownOutput.value;
            this.downloader.download(content, 'converted.md');
        });

        // クリアボタン
        this.clearBtn.addEventListener('click', () => {
            this.resultContainer.classList.add('hidden');
            this.markdownOutput.value = '';
        });
    }

    /**
     * Workerにメッセージを送信し、レスポンスを待機する。
     */
    async requestWorker(type, payload = {}) {
        return new Promise((resolve, reject) => {
            const handleMessage = (e) => {
                const { type: responseType, payload: responsePayload } = e.data;

                if (responseType === 'INIT_SUCCESS' && type === 'INIT') {
                    this.worker.removeEventListener('message', handleMessage);
                    resolve(responsePayload);
                } else if (responseType === 'CONVERT_SUCCESS' && type === 'CONVERT') {
                    this.worker.removeEventListener('message', handleMessage);
                    resolve(responsePayload);
                } else if (responseType === 'ERROR') {
                    this.worker.removeEventListener('message', handleMessage);
                    reject(new Error(responsePayload.message));
                }
            };

            this.worker.addEventListener('message', handleMessage);
            this.worker.postMessage({ type, payload });
        });
    }

    async handleFiles(files) {
        if (files.length === 0) return;
        const file = files[0];

        try {
            this.showStatus(true, `ファイルを処理中: ${file.name}...`);

            // 1. Pyodide環境の準備 (Worker側で初期化)
            await this.requestWorker('INIT');

            // 2. ファイルデータを読み込み
            const arrayBuffer = await file.arrayBuffer();
            const fileData = new Uint8Array(arrayBuffer);

            // 3. 変換実行 (Worker側でFS書き込み -> 変換 -> 削除を一括して行う)
            const result = await this.requestWorker('CONVERT', {
                fileName: file.name,
                fileData: fileData
            });

            // 4. 結果表示
            this.displayResult(result.markdown);
            this.showStatus(false);
        } catch (error) {
            this.errorHandler.handle(error, (msg) => this.showStatus(true, msg));
        }
    }

    showStatus(show, text = '処理中...') {
        this.statusContainer.classList.toggle('hidden', !show);
        this.statusText.textContent = text;
    }

    displayResult(content) {
        this.resultContainer.classList.remove('hidden');
        this.markdownOutput.value = content;
    }
}

new App();
