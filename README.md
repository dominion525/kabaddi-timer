# Kabaddi-timer
カバディ用のリアルタイムタイマー・スコアボードアプリケーション。

## 技術スタック
- **Cloudflare Workers** + **Durable Objects**
- **TypeScript** (IIFE形式)
- **Alpine.js** + **Tailwind CSS**
- **WebSocket** リアルタイム通信

## 開発
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# デプロイ
wrangler deploy
```

## アクセス
- スコアボード: `http://localhost:8787/game/{gameId}`
