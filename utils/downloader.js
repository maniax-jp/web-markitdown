/**
 * Web-MarkItDown - downloader.js
 * Markdownテキストをファイルとしてダウンロードさせるためのユーティリティクラス。
 */

export class Downloader {
    /**
     * 指定されたコンテンツをファイルとしてダウンロードさせる。
     * @param {string} content - ダウンロードさせるテキスト内容。
     * @param {string} filename - 保存時のファイル名。
     */
    download(content, filename) {
        // 1. Blobオブジェクトの作成 (text/markdown)
        const blob = new Blob([content], { type: 'text/markdown' });

        // 2. 一時的なURLの生成
        const url = URL.createObjectURL(blob);

        // 3. 非表示の <a> 要素を作成してクリックイベントをトリガー
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();

        // 4. 後片付け: 要素の削除とURLの解放
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
