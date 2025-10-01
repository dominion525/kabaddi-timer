# Kabaddi Timer

カバディ用のリアルタイムタイマー・スコアボードアプリケーション。複数デバイス間でWebSocketによるリアルタイム同期を実現。

## 主要機能

- **リアルタイムスコアボード**: WebSocketによる多デバイス同期
- **メインタイマー**: カスタム設定可能な試合タイマー
- **サブタイマー**: 30秒固定のアクションタイマー
- **スコア管理**: チーム別スコア・Do or Dieカウント
- **コートチェンジ機能**: チーム位置の切り替え
- **オペレーター向け表示反転**: ローカル表示の上下反転機能
- **接続状態表示**: WebSocket接続状況の視覚的フィードバック
- **QRコード共有**: 他デバイスへの簡単共有

## 技術スタック

### バックエンド
- **Cloudflare Workers** + **Durable Objects**
- **TypeScript**
- **Hono** (ルーティングフレームワーク)
- **WebSocket** リアルタイム通信

### フロントエンド
- **Preact** + **TSX** + **Tailwind CSS**
- **Preact SSG** (インデックスページ静的生成)

### ビルド・テスト
- **esbuild**: バンドル+ミニファイ
- **Vitest**: ユニットテスト
- **TypeScript Compiler**: 型チェック

## アーキテクチャ

### エンドポイント構成
- `/` - インデックスページ（静的HTML）
- `/game-v2/{gameId}` - スコアボード（Preact）
- `/ws/{gameId}` - WebSocket接続

### ディレクトリ構造
```
src/
├── game-v2/              # GameV2実装 (Preact + TSX)
│   ├── components/      # UIコンポーネント
│   ├── hooks/           # カスタムフック
│   ├── lib/             # ユーティリティ
│   └── types/           # 型定義
├── index-page/          # インデックスページ (Preact SSG)
│   ├── components/      # ページコンポーネント
│   ├── utils/           # ユーティリティ
│   ├── client.ts        # クライアントサイドJS
│   └── template.tsx     # HTMLテンプレート
├── shared/              # 共有コンポーネント
│   └── components/      # CreditsModal等
├── durable-objects/     # Durable Objects実装
├── types/               # 共通型定義
└── index.ts             # メインWorkerハンドラー

public/
└── images/              # アイコン・OG画像
    ├── ICON-BASIC.svg  # マスターアイコン
    └── *.png           # 生成アイコン各種
```

## 技術的特徴

### リアルタイム同期
- WebSocket接続による即時状態同期
- 接続断時の自動再接続

### 状態永続化
- Durable Objectsによる自動保存と復元

## 開発

### 初回セットアップ
```bash
# 依存関係のインストール
npm install

# 初回ビルド
npm run build
```

### 開発コマンド
```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run typecheck

# ビルド
npm run build

# テスト
npm run test                # Durable Objectsテスト
npm run test:client         # クライアントテスト
npm run test:coverage       # カバレッジ付き

# デプロイ
npm run deploy
```

### デプロイに必要な設定
- `wrangler.toml`: Durable Objects設定
- Cloudflareアカウント + API Token

## ライセンス

MIT License

## 開発者

[@dominion525](https://twitter.com/dominion525) / [Dominion525.com](https://dominion525.com)

## Special Thanks

東京レイズ and other kabaddi teams
