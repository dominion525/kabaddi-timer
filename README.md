# Kabaddi-timer
カバディ用のリアルタイムタイマー・スコアボードアプリケーション。

## 技術スタック
- **Cloudflare Workers** + **Durable Objects**
- **TypeScript** (IIFE形式)
- **Alpine.js** + **Tailwind CSS**
- **WebSocket** リアルタイム通信

## 開発

### 初回セットアップ
```bash
# 依存関係のインストール
npm install

# クライアントサイドJavaScriptの初回ビルド
npm run build:client
```

### 開発コマンド
```bash
# 開発サーバー起動（開発モード: 個別JSファイル）
npm run dev

# ビルド - 開発モード（デバッグ可能）
npm run build

# ビルド - 本番モード（バンドル+ミニファイ）
npm run build:prod

# デプロイ（本番ビルド自動実行）
npm run deploy
```

## HTMLテンプレート
- ビルド時インポートパターン採用（`import html from './file.html'`）
- Cloudflare Workers対応（Node.js API不使用）

## アクセス
- スコアボード: `http://localhost:8787/game/{gameId}`
