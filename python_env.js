/**
 * Web-MarkItDown - python_env.js
 * Pyodideの初期化とPythonパッケージの管理を行う。
 */

export class PyodideEnv {
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
            // 1. Pyodideスクリプトを読み込む
            if (typeof window !== 'undefined') {
                if (!window.loadPyodide) {
                    await this.loadPyodideScript();
                }
                this.pyodide = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
                });
            } else {
                // Worker環境では importScripts を使用するか、既にロード済みであることを期待する
                // worker.js 側で importScripts('...') を呼ぶ想定
                this.pyodide = await self.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
                });
            }

            // 2. micropipをロードしてmarkitdownをインストール
            await this.pyodide.loadPackage('micropip');
            const micropip = this.pyodide.pyimport('micropip');

            // markitdownをインストール
            await micropip.install('markitdown');

            this.isInitialized = true;
            console.log('Pyodide environment initialized and markitdown installed.');
        } catch (error) {
            console.error('Failed to initialize Pyodide environment:', error);
            throw error;
        }
    }

    /**
     * PyodideのJSライブラリをHTMLに注入して読み込む (Main Thread用)。
     */
    async loadPyodideScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}
