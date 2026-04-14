# 実装タスクリスト: Web-MarkItDown

## タスク一覧

| ID | タスク名 | 詳細 | 成功基準 | 範囲 |
| :--- | :--- | :--- | :--- | :--- |
| T1 | Pyodide基盤の実装 | Pyodideのロードと基本実行環境の構築。 | `pyodide.runPython` が動作すること。 | `index.html`, `main.js` |
| T2 | markitdown環境の構築 | `micropip` による `markitdown` および依存関係のインストール。 | `import markitdown` がPython内で成功すること。 | `main.js`, `python_env.js` |
| T3 | ファイル受け渡し機構の実装 | JS File API $\rightarrow$ Pyodide FS の書き込み。 | 仮想ファイルシステムにファイルが存在すること。 | `utils/fs-handler.js` |
| T4 | 変換パイプラインの実装 | `markitdown.convert()` の呼び出しと結果返却。 | 任意のファイルからMD文字列が返ること。 | `converters/py-converter.js` |
| T5 | UI/UX実装（非同期処理） | ロード中・変換中のプログレス表示実装。 | UIがフリーズせず、状態が可視化されること。 | `index.html`, `style.css`, `main.js` |
| T6 | Markdown出力・保存機能 | Blobを用いた `.md` ファイルのダウンロード。 | 保存したファイルの内容が正しいこと。 | `utils/downloader.js` |
| T7 | パフォーマンス最適化 | Web Workerへの移行とキャッシュ設定。 | メインスレッドが完全に解放されていること。 | `workers/py-worker.js` |
| T8 | 例外処理とフォールバック | エラーハンドリングとユーザー通知の実装。 | 異常系ケースで適切にエラー表示されること。 | `main.js`, `utils/error-handler.js` |
