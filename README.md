# Kabaddi Timer

カバディ用のリアルタイムタイマー・スコアボードアプリケーション。複数デバイス間でWebSocketによるリアルタイム同期を実現。

## 主要機能

- **リアルタイムスコアボード**: WebSocketによる多デバイス同期
- **メインタイマー**: カスタム設定可能な試合タイマー（デフォルト15分）
- **サブタイマー**: 30秒固定のアクションタイマー
- **スコア管理**: チーム別スコア・Do or Dieカウント
- **コートチェンジ機能**: チーム位置の切り替え（色は固定）
- **オペレーター向け表示反転**: ローカル表示の上下反転機能
- **接続状態表示**: WebSocket接続状況の視覚的フィードバック
- **QRコード共有**: 他デバイスへの簡単共有

## 技術スタック

### バックエンド
- **Cloudflare Workers** + **Durable Objects** (SQLiteバックエンド)
- **TypeScript** (厳格モード)
- **Hono** (ルーティングフレームワーク)
- **WebSocket** リアルタイム通信

### フロントエンド
- **GameV2** (新実装): Preact + TSX + Tailwind CSS
- **インデックスページ**: Preact SSG (静的生成)
- **レガシー**: Alpine.js + Tailwind CSS (IIFE形式TypeScript)

### ビルド・テスト
- **esbuild**: バンドル+ミニファイ
- **Vitest**: ユニットテスト（Durable Objects + クライアント）
- **TypeScript Compiler**: 型チェック

## アーキテクチャ

### エンドポイント構成
- `/` - インデックスページ（静的HTML）
- `/game-v2/{gameId}` - GameV2スコアボード（Preact）
- `/game/{gameId}` - レガシースコアボード（Alpine.js）
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
├── client/components/   # レガシークライアントTS
├── durable-objects/     # Durable Objects実装
├── templates/           # レガシーHTMLテンプレート
├── types/               # 共通型定義
└── index.ts             # メインWorkerハンドラー

public/
└── images/              # アイコン・OGP画像
    ├── ICON-BASIC.svg  # マスターアイコン
    └── *.png           # 生成アイコン各種
```

## 技術的特徴

### リアルタイム同期
- 60秒ごとの時刻同期アラーム（タイマードリフト防止）
- WebSocket接続による即時状態同期
- 接続断時の自動再接続

### 状態永続化
- SQLite Durable Objectsによる10GB容量
- 全状態変更時の自動保存
- Point-in-Time Recovery対応

### タイマー表示
- `Math.ceil()`による自然なカウントダウン表示
- 開始時に設定時間を維持（60秒→「60」表示）
- 0.1秒残りでも「1」表示（0表示回避）

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
# 開発サーバー起動（バックグラウンド推奨）
npm run dev

# 型チェック
npm run typecheck

# ビルド（全体）
npm run build

# ビルド（個別）
npm run build:client:dev    # 開発用（デバッグ可能）
npm run build:client:prod   # 本番用（バンドル+ミニファイ）
npm run build:worker        # ワーカーサイドのみ

# テスト
npm run test                # Durable Objectsテスト
npm run test:client         # クライアントテスト
npm run test:coverage       # カバレッジ付き

# デプロイ（本番ビルド自動実行）
npm run deploy
```

## アイコン管理

### マスターファイル
- `public/images/ICON-BASIC.svg` - アイコン再生成用SVG

### 生成アイコン
- PWAアイコン: 512, 192, 144, 96, 48px
- Favicon: ico, 32x32, 16x16
- Apple Touch Icon: 180x180
- OGP画像: ogp-image.png (1200x630), ogp-large.png (1920x1005), ogp-square.png (1200x1200)

### アイコン再生成
```bash
# ImageMagickを使用してSVGからPNG生成
magick public/images/ICON-BASIC.svg -resize 512x512 output.png
```

## デプロイ

### Cloudflare Workersへデプロイ
```bash
npm run deploy
```

### 必要な設定
- `wrangler.toml`: Durable Objects設定
- Cloudflareアカウント + API Token
- SQLiteバックエンド有効化（`new_sqlite_classes`）

## ライセンス

MIT License

## 開発者

[@dominion525](https://twitter.com/dominion525) / [Dominion525.com](https://dominion525.com)

## Special Thanks

東京レイズ and other kabaddi teams
