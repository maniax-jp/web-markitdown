/**
 * Web-MarkItDown - fs-handler.js
 * Pyodideの仮想ファイルシステム (VFS) へのファイル操作を管理する。
 */

export class FSHandler {
    /**
     * JavaScriptのFileオブジェクトをPyodideの仮想ファイルシステムに書き込む。
     * @param {File} file - 書き込むFileオブジェクト
     * @param {any} pyodide - Pyodideインスタンス
     * @returns {Promise<string>} 仮想FS上のファイルパス
     * @throws {Error} 書き込み失敗時にスロー
     */
    /**
     * JavaScriptのFileオブジェクトをPyodideの仮想ファイルシステムに書き込む。
     * @param {File} file - 書き込むFileオブジェクト
     * @param {any} pyodide - Pyodideインスタンス
     * @returns {Promise<string>} 仮想FS上のファイルパス
     * @throws {Error} 書き込み失敗時にスロー
     */
    async writeFile(file, pyodide) {
        if (!pyodide) {
            throw new Error('仮想ファイルシステムへの書き込みにはPyodideインスタンスが必要です。');
        }

        // ファイル名の衝突を避けるため、ユニークなIDを付与
        const uniqueId = Date.now() + Math.random().toString(36).substring(2, 9);
        const fileName = `${uniqueId}_${file.name}`;
        const filePath = `/tmp/${fileName}`;

        try {
            // File (Blob) を Uint8Array に変換してPyodideのFSに書き込む
            const arrayBuffer = await file.arrayBuffer();
            return this.writeFileFromBuffer(fileName, new Uint8Array(arrayBuffer), pyodide);
        } catch (error) {
            console.error(`VFSへのファイル書き込みエラー ${file.name}:`, error);
            throw new Error(`仮想システムへのファイル保存に失敗しました: ${error.message}`);
        }
    }

    /**
     * バッファデータ(Uint8Array)をPyodideの仮想ファイルシステムに書き込む。
     * @param {string} fileName - ファイル名
     * @param {Uint8Array} data - 書き込むデータ
     * @param {any} pyodide - Pyodideインスタンス
     * @returns {Promise<string>} 仮想FS上のファイルパス
     */
    async writeFileFromBuffer(fileName, data, pyodide) {
        const filePath = `/tmp/${fileName}`;
        try {
            pyodide.FS.writeFile(filePath, data);
            return filePath;
        } catch (error) {
            console.error(`VFSへのバッファ書き込みエラー ${fileName}:`, error);
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
            console.warn(`警告: 仮想ファイル ${filePath} の削除に失敗しました:`, error);
        }
    }
}
