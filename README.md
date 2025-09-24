# Kabaddi-timer
カバディ用のリアルタイムタイマー・スコアボードアプリケーション。

## 主要機能
- **リアルタイムスコアボード**: WebSocketによる同期機能
- **メインタイマー**: カスタム設定可能な試合タイマー（デフォルト15分）
- **サブタイマー**: 30秒固定のアクションタイマー
- **スコア管理**: チーム別スコア・Do or Dieカウント
- **コートチェンジ機能**: チーム位置の切り替え（色は固定）
- **オペレーター向け表示反転**: ローカル表示の上下反転機能
- **接続状態表示**: WebSocket接続状況の視覚的フィードバック

## 技術スタック
- **Cloudflare Workers** + **Durable Objects** (SQLiteバックエンド)
- **TypeScript** (IIFE形式)
- **Alpine.js** + **Tailwind CSS**
- **WebSocket** リアルタイム通信

## 技術的特徴
- **リアルタイム同期**: 60秒ごとの時刻同期アラーム
- **状態永続化**: Durable Objectsによる自動復元

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
