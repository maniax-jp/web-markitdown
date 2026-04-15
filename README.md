# Web-MarkItDown

Web-MarkItDown は、Microsoft の [MarkItDown](https://github.com/microsoft/markitdown) をブラウザ上で動作させることで、様々な形式のドキュメントをサーバーに送信することなく、クライアントサイドのみで Markdown に変換するツールです。

## 🚀 デモ
以下の URL から直接ご利用いただけます：
**[https://maniax-jp.github.io/web-markitdown/](https://maniax-jp.github.io/web-markitdown/)**

## ✨ 特徴
- **プライバシー重視**: ファイルはすべてブラウザ内で処理され、サーバーにアップロードされることはありません。
- **多様な形式をサポート**: MarkItDown の強力な変換能力をそのままブラウザで利用できます。
- **簡単操作**: ファイルをドラッグ＆ドロップするだけで、即座に Markdown 形式に変換されます。
- **サーバーレス**: Pyodide を利用して Python 環境をブラウザに構築しているため、専用のバックエンドサーバーを必要としません。

## 🛠 技術スタック
- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **Runtime**: [Pyodide](https://pyodide.org/) (WebAssembly 版 Python)
- **Core Engine**: [MarkItDown](https://github.com/microsoft/markitdown)
- **Performance**: Web Workers によるバックグラウンド処理で UI のフリーズを防止

## 📖 使い方
1. [デモページ](https://maniax-jp.github.io/web-markitdown/) にアクセスします。
2. 変換したいファイルをドラッグ＆ドロップするか、クリックしてファイルを選択します。
3. Pyodide のロードと変換処理が完了するまでお待ちください。
4. 変換された Markdown が表示されます。「Markdownを保存」ボタンでファイルとして保存可能です。

## 💻 ローカルでの実行方法
このプロジェクトは ES Modules を使用しているため、単純に HTML ファイルを開くだけでは動作しません。ローカルサーバーが必要です。

```bash
# 例: Python を使用する場合
python -m http.server 8000
```
その後、 `http://localhost:8000` にアクセスしてください。
