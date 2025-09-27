# Repository Guidelines

## プロジェクト構成とモジュール配置
- `src/` は Worker エントリ (`index.ts`)、Durable Object ロジック (`durable-objects/`)、HTTP/WebSocket ルーター (`routes/`)、クライアントバンドル (`client/`)、再利用可能な HTML 断片 (`templates/`) を含みます。
- `public/` はビルド済みの JS/CSS と静的アセットを提供し、`dist/` は型付き Worker 出力でありコミット対象外です。
- `scripts/inject-revision.js` はリリースフローでビルドメタデータを埋め込みます。
- `tests/` は Worker/クライアント向けの Vitest 設定を保持し、テスト本体・ヘルパー・モックは `src/test/` 配下に配置します。

## ビルド・テスト・開発コマンド
- `npm run dev`: クライアントスタブをビルド後に `wrangler dev` を起動し、Worker と WebSocket をローカル実行します。
- `npm run build`: リビジョンを書き込み、デバッグモードでクライアント資産と Worker を `dist/` に出力します。
- `npm run build:prod`: esbuild でクライアントを最小化し、厳格設定で Worker をビルドします。
- `npm run deploy`: 本番ビルド後に Wrangler でデプロイします。
- `npm test` / `npm run test:client`: Worker とクライアントの Vitest スイートを実行します。`:coverage` 付きでカバレッジ収集。
- `npm run typecheck`: TypeScript コンパイラを `--noEmit` で実行し、型崩れを即時検出します。

## コーディングスタイルと命名規約
- TypeScript を第一言語とし `strict` 設定を維持します。`any` の使用は避け、公開関数には戻り値型を明示してください。
- インデントは 2 スペース、クォートはシングル、可能な限りトップレベルで `const` を公開します。
- Worker バインディングや Durable Object クラスは `types/` と `durable-objects/` に配置し、ファイル名はインポート経路と揃えたケバブケースにします。
- UI には Tailwind クラスを利用し、共通 HTML 断片は重複防止のため `templates/` に追加します。

## テスト指針
- テストは `src/test/{client,helpers}` に `.test.ts` サフィックスで配置します。
- Worker 向けには `@cloudflare/vitest-pool-workers`、DOM 操作には `jsdom` を活用します。
- 新しい状態遷移、時間制御境界、WebSocket フローをカバーし、API 形状が変わる場合は `src/test/mocks` のモックも更新します。

## コミットとプルリクエスト運用
- コミットメッセージは `feat:`, `fix:`, `chore:` などの Conventional Commits を踏襲し、範囲を簡潔に記述します（日本語・英語どちらでも可）。
- コミットは粒度を絞り、挙動変更時は再現手順や実行したテストを本文に記載します。
- PR では関連 Issue のリンク、オペレーター向け影響の概要、UI 変更ならスクリーンショット、ローカル検証コマンドを提示します。
- レビュー依頼前に `npm test`、`npm run typecheck`、該当ビルドコマンドを完走させてください。

## 設定メモ
- Cloudflare バインディングは `wrangler.toml` で定義し、`worker-configuration.d.ts` で型付けします。環境変数を追加する場合は両方を更新してください。
- テンプレートやアセットを更新したら `npm run build` を再実行し、キャッシュされたリビジョンを再生成します。
