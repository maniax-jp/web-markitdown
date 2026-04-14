/**
 * ErrorHandler - エラーハンドリングクラス
 * エラーをログに記録し、ユーザーに分かりやすい日本語メッセージを表示します。
 */
export class ErrorHandler {
    /**
     * エラーを処理し、ユーザーに通知します。
     * @param {Error} error - 発生したエラーオブジェクト
     * @param {Function} [notify] - ユーザーに通知するためのコールバック関数 (オプション)
     */
    handle(error, notify) {
        console.error('[ErrorHandler] Error caught:', error);

        const message = this.getFriendlyMessage(error);

        if (notify) {
            notify(message);
        } else {
            alert(message);
        }
    }

    /**
     * エラーオブジェクトからユーザー向けのフレンドリーなメッセージを生成します。
     * @param {Error} error
     * @returns {string} 日本語のエラーメッセージ
     */
    getFriendlyMessage(error) {
        const msg = error.message || '';

        // Pyodideのロード失敗
        if (msg.includes('Pyodide') || msg.includes('load') || msg.includes('fetch')) {
            return 'Pyodideのロードに失敗しました。インターネット接続を確認して、ページをリロードしてください。';
        }

        // markitdownの変換失敗
        if (msg.includes('markitdown') || msg.includes('convert') || msg.includes('PythonError')) {
            return 'ファイルの変換に失敗しました。ファイルが破損しているか、サポートされていない形式の可能性があります。';
        }

        // ファイルシステムエラー
        if (msg.includes('FS') || msg.includes('file system') || msg.includes('ENOENT')) {
            return 'ファイルシステムの操作に失敗しました。';
        }

        // 一般的なエラー
        return '予期せぬエラーが発生しました。時間を置いてもう一度お試しください。';
    }
}
