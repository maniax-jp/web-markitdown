# 技術設計書: Web-MarkItDown

## 1. アーキテクチャ概略
本システムは、Pyodideを用いてブラウザ上にPython実行環境を構築し、その中で `markitdown` を動作させるシングルページアプリケーション (SPA) として設計する。

## 2. 技術スタック
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Python Runtime**: Pyodide (WebAssembly)
- **Core Library**: `markitdown`
- **Dependency Management**: `micropip` (Pyodide内でのパッケージインストール)

## 3. データフロー
1. **ファイル入力**: ユーザーがファイルをアップロード $\rightarrow$ JSの `File API` でバイナリデータを取得。
2. **仮想ファイルシステムへの書き込み**: Pyodideの `FS` (File System) API を使用して、取得したバイナリを仮想ディレクトリに保存。
3. **変換実行**: Pyodide経由で Python コードを実行し、`markitdown.MarkItDown().convert("path/to/file")` を呼び出し。
4. **結果取得**: Python側で生成されたMarkdown文字列を JS 側に返却。
5. **出力**: JS側で画面表示および `Blob` オブジェクトを用いたファイルダウンロード処理を実行。

## 4. コンポーネント設計
- `main.js`: 全体のオーケストレーション、UIイベント制御。
- `python_env.js`: Pyodideの初期化、`markitdown` のインストール、Pythonコードの実行管理。
- `fs-handler.js`: Pyodide仮想ファイルシステムへのファイル書き込み/削除。
- `downloader.js`: Markdownテキストのファイル化とダウンロード処理。

## 5. パフォーマンス・メモリ対策
- **Web Workerの活用**: Pyodideのロードと変換処理を Web Worker で実行し、メインスレッド（UI）のブロッキングを回避する。
- **キャッシュ**: Pyodideのランタイムファイルをブラウザキャッシュに保持させ、2回目以降の起動を高速化する。
