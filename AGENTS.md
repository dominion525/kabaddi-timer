# Repository Guidelines

## プロジェクト構成とモジュール配置
- `src/` は Worker エントリ (`index.ts`)、Durable Object ロジック (`durable-objects/`)、GameV2実装 (`game-v2/`)、インデックスページ (`index-page/`)、共有コンポーネント (`shared/`)、型定義 (`types/`) を含みます。
- `public/` はビルド済みの JS/CSS と静的アセット（`images/`）を提供します。
- `generated/` はビルド時生成ファイル（インデックスページHTML等）でありコミット対象外です。
- `scripts/` はビルド補助スクリプト（`inject-revision.js`、`build-index-page.ts`等）を保持します。
- `tests/` はテスト設定を保持し、テスト本体は各モジュール配下に `.test.ts` サフィックスで配置します。

## ビルド・テスト・開発コマンド
- `npm run dev`: Cloudflare Workersローカル開発環境を起動（バックグラウンド実行推奨）
- `npm run build`: 全体ビルド（クライアント + GameV2 + インデックスページ + Worker）
  - `npm run build:client:dev`: レガシークライアント開発用ビルド
  - `npm run build:client:prod`: レガシークライアント本番用（esbuild、ミニファイ）
  - `npm run build:v2`: GameV2ビルド（Vite）
  - `npm run build:index-page`: インデックスページビルド（Preact SSG）
  - `npm run build:worker`: ワーカーサイドTypeScriptビルド
- `npm run build:prod`: 本番用ビルド（全体最適化）
- `npm run deploy`: 本番ビルド後にCloudflare Workersへデプロイ
- `npm test` / `npm run test:client`: Durable ObjectsとクライアントのVitestスイート実行（`:coverage`でカバレッジ収集）
- `npm run typecheck`: TypeScript型チェック（`--noEmit`）

## コーディングスタイルと命名規約
- TypeScript を第一言語とし `strict` 設定を維持します。`any` の使用は避け、公開関数には戻り値型を明示してください。
- インデントは 2 スペース、可能な限りトップレベルで `const` を公開します。
- Worker バインディングや Durable Object クラスは `types/` と `durable-objects/` に配置し、ファイル名はケバブケースにします。
- GameV2およびインデックスページはPreact + TSXを使用し、Tailwind CSSでスタイリングします。

## テスト指針
- テストは各モジュール配下に `.test.ts` サフィックスで配置します。
- Worker 向けには `@cloudflare/vitest-pool-workers`、DOM 操作には `jsdom` を活用します。
- 新しい状態遷移、時間制御境界、WebSocket フローをカバーし、API 形状が変わる場合はモックも更新します。

## コミットとプルリクエスト運用
- コミットメッセージは `feat:`, `fix:`, `chore:`, `docs:` などの Conventional Commits を踏襲し、範囲を簡潔に日本語で記述します。
- コミットは粒度を絞り、挙動変更時は再現手順や実行したテストを本文に記載します。
- PR では関連 Issue のリンク、影響の概要、UI 変更ならスクリーンショット、ローカル検証コマンドを提示します。
- レビュー依頼前に `npm test`、`npm run typecheck`、該当ビルドコマンドを完走させてください。

## 設定メモ
- Cloudflare バインディングは `wrangler.toml` で定義し、`worker-configuration.d.ts` で型付けします。環境変数を追加する場合は両方を更新してください。
- テンプレートやアセットを更新したら `npm run build` を再実行し、キャッシュされたリビジョンを再生成します。
- OGP画像は `og-image*.png` 命名規則を使用します（OG標準準拠）。
