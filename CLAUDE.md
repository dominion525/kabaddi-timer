# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

カバディ用のリアルタイムタイマー・スコアボードアプリケーション。Cloudflare Workers + Durable Objectsを使用してWebSocketによる同期機能を提供。

## 開発コマンド

### 必須コマンド
- **開発サーバー起動**: `npm run dev` - Cloudflare Workersローカル開発環境
  - **重要**: 開発サーバーは必ずバックグラウンドで実行すること（`run_in_background: true`）
- **ビルド**: `npm run build` - TypeScriptコンパイル（全体）
  - `npm run build:v2` - GameV2ビルド（Vite）
  - `npm run build:index-page` - インデックスページビルド（Preact SSG）
  - `npm run build:worker` - ワーカーサイドTypeScriptのビルド
- **型チェック**: `npm run typecheck` - 型エラーのチェック
- **テスト**:
  - `npm run test` - Durable Objectsテスト
  - `npm run test:game-v2` - GameV2テスト
  - `npm run test:index-page` - インデックスページテスト
- **デプロイ**: `npm run deploy` - 本番ビルド + Cloudflare Workersへのデプロイ

## アーキテクチャ構成

### エンドポイント
- `/` - インデックスページ（Preact SSG、静的HTML）
- `/game-v2/{gameId}` - スコアボード（Preact + TSX）
- `/ws/{gameId}` - WebSocket接続エンドポイント

### バックエンド (Cloudflare Workers + Durable Objects)
- **`src/index.ts`**: Honoを使用したメインWorkerハンドラー
  - ルーティング、静的ファイル配信、WebSocket接続管理
- **`src/durable-objects/game-session.ts`**: GameSession Durable Object
  - ゲーム状態の永続化（SQLiteバックエンド）
  - WebSocket接続管理
  - 状態検証・修復機能（`validateGameState()`, `repairGameState()`）
- **`src/types/game.ts`**: 共通TypeScript型定義

### フロントエンド

#### GameV2 (メイン実装)
- **技術スタック**: Preact + TSX + Tailwind CSS
- **ビルド**: Vite (`vite.game-v2.config.ts`)
- **出力**: `public/js/game-v2.js` (77KB、gzip: 21KB)
- **ディレクトリ**: `src/game-v2/`
  - `components/` - UIコンポーネント（ScoreBoard、Timer等）
  - `hooks/` - カスタムフック（useWebSocket、useGameState等）
  - `lib/` - ユーティリティ関数
  - `types/` - 型定義

#### インデックスページ
- **技術スタック**: Preact SSG（静的生成）
- **ビルド**:
  - クライアントJS: Vite (`vite.index-page-client.config.ts`)
  - HTML生成: `scripts/build-index-page.ts`
- **出力**: `generated/index.html` (9KB)
- **ディレクトリ**: `src/index-page/`
  - `components/App.tsx` - メインコンポーネント
  - `template.tsx` - HTMLテンプレート
  - `client.ts` - クライアントサイドJS
  - `utils/` - ユーティリティ

#### 共有コンポーネント
- **ディレクトリ**: `src/shared/components/`
  - `CreditsModal.tsx` - クレジット表示モーダル（Preact）

### データ永続化
- **SQLiteバックエンド**: Durable Objects SQLiteバックエンド使用
  - `wrangler.toml`で`new_sqlite_classes = ["GameSession"]`設定
  - 10GB容量、Point-in-Time Recovery対応
- **永続化メカニズム**:
  - 全状態変更時に`this.state.storage.put()`で自動保存
  - 初期化時に`loadGameState()`でストレージから復元
  - リトライ機能付き保存（`saveGameStateWithRetry`）
- **状態検証・修復**: `validateGameState()`と`repairGameState()`で整合性保証
- **接続管理**: WebSocket切断時も状態を永続化し、再接続時に復元

## 重要な技術的詳細

### タイマー表示計算
- **`Math.ceil()`を使用**: 自然なカウントダウン表示を実現
  - 開始時に設定時間を維持（60秒タイマーなら「60」を表示）
  - 0.1秒残っていても「1」と表示（0表示を避ける）
- **実装場所**: GameV2の各タイマーコンポーネント、コントロールパネル時間設定表示

### タイマー状態管理
- **`TimerState`型定義** (`src/types/game.ts`):
  - `totalDuration`: タイマー実行の基準時間（秒）
    - タイマー開始/再開時に更新される
    - クライアント側の経過時間計算に使用: `totalDuration - elapsed`
  - `initialDuration`: リセット時に戻る時間（秒）※オプショナル
    - プリセット設定時のみ更新される
    - リセット時に`resetTimer()`で使用: `remainingSeconds = initialDuration ?? totalDuration`
    - 後方互換性のため省略可能（古いデータでも動作）
  - `remainingSeconds`: 現在の残り時間（秒）
    - タイマー調整時に更新される
- **用途の分離**:
  - タイマー実行: `totalDuration`を基準とした相対時間計算
  - タイマーリセット: `initialDuration`に戻す
  - 時間調整: `remainingSeconds`のみ変更、`initialDuration`は保持
- **コントロールパネル表示**: `initialDuration ?? totalDuration`を表示（リセット先の時間）

### コントロールパネル設定
- **モバイル版初期設定**: シンプルモードがデフォルト（`STORAGE_KEY_SIMPLE_MODE: true`）
  - 初回ユーザー向けに操作が簡単なUIを優先
  - ユーザーはいつでも通常モードに切り替え可能
- **デスクトップ版ボタンサイズ**: +1/-1ボタンは`h-12`（48px高さ）
  - コンパクトで視認性の良いレイアウト

### TypeScriptビルド設定
- **`tsconfig.json`**: ワーカー（サーバーサイド）用設定
- **`tsconfig.index-page.json`**: インデックスページ用設定（Preact SSG）

### OGP（Open Graph Protocol）設定
- **HTML構造**: `<html lang="ja" prefix="og: https://ogp.me/ns#">`
  - `prefix`属性が必須（OGP仕様準拠）
- **必須メタタグ**: og:title, og:type, og:url, og:image
- **画像ファイル命名**: `og-image*.png`（OG標準に準拠）
  - `og-image.png` (1200x630) - 標準
  - `og-image-large.png` (1920x1005) - Twitter Large Card
  - `og-image-square.png` (1200x1200) - Square版
- **構造化プロパティ**: og:image:width, og:image:height, og:image:type, og:image:alt を追加

### アイコン管理
- **マスターファイル**:
  - `ICON-BASIC.svg` - ソースSVG
  - `ICON-BASIC.png` - SVGから生成した1024x1024 PNG
  - `ICON-BASIC-LARGER.png` - 中心部クロップ版（各種アイコン生成元）
- **生成フロー**:
  1. `ICON-BASIC.svg` → `ICON-BASIC.png` (ImageMagick、1024x1024)
  2. `ICON-BASIC.png` → `ICON-BASIC-LARGER.png` (中心850x850クロップ→1024x1024拡大)
  3. `ICON-BASIC-LARGER.png` → 各サイズPWAアイコン、Favicon、OG画像

## ディレクトリ構造

```
src/
├── game-v2/              # GameV2実装（Preact + TSX）
│   ├── components/      # UIコンポーネント
│   ├── hooks/           # カスタムフック
│   └── test/            # テストユーティリティ
├── index-page/          # インデックスページ（Preact SSG）
│   ├── components/      # ページコンポーネント
│   ├── utils/           # ユーティリティ
│   ├── client.ts        # クライアントサイドJS
│   └── template.tsx     # HTMLテンプレート
├── shared/              # 共有コンポーネント
│   └── components/      # CreditsModal等
├── durable-objects/     # Durable Objects実装
├── routes/              # ルーター定義
├── types/               # 共通型定義
└── index.ts             # メインWorkerハンドラー

public/
├── js/                  # ビルド済みJavaScript
│   ├── game-v2.js      # GameV2バンドル
│   └── index-page-client.js  # インデックスページJS
└── images/              # アイコン・OG画像
    ├── ICON-BASIC.svg  # マスターアイコンSVG
    ├── ICON-BASIC.png  # 中間PNG
    ├── ICON-BASIC-LARGER.png  # アイコン生成元
    ├── og-image*.png   # OG画像
    └── kabaddi-timer-app-icon*.png  # PWAアイコン

generated/
└── index.html           # ビルド済みインデックスページ（SSG）
```

## 開発時の注意点

### WebSocket接続
- エンドポイント: `/ws/{gameId}`
- Durable Objectに転送され、永続的な状態管理
- 接続断時も状態は保持され、再接続時に復元

### ビルドシステム
- **GameV2**: Viteでバンドル（`vite.game-v2.config.ts`）
- **インデックスページ**:
  - クライアントJS: Vite (`vite.index-page-client.config.ts`)
  - HTML: Preact SSG (`scripts/build-index-page.ts`)
- **ワーカー**: TypeScript Compiler

### 型安全性
- 全設定でstrictモード有効
- 共通型定義は`src/types/`に配置

### デプロイフロー
1. `npm run deploy`実行
2. 本番ビルド自動実行（`npm run build:prod`）
3. Cloudflare Workersへデプロイ
4. アセットファイルアップロード

## コード品質改善

### WebSocket接続状態フィードバック
- **視覚的インジケーター**: 接続状態を色で表示
  - 緑色●: 接続済み
  - 黄色●: 接続中
  - オレンジ●（点滅）: 再接続中
  - 赤色●: 切断

### テストカバレッジ
- **全体カバレッジ** (2025-10-19時点):
  - Statements: 84.87%
  - Branch: 72.92%
  - Functions: 80.1%
  - Lines: 86.64%
- **主要コンポーネント**: 多くのコンポーネントで100%カバレッジを達成
  - StatusBar: 94.73%
  - ScoreBoard関連: 100%
  - Timer関連: 100%
  - Control関連: 100%
- **テスト実行**: `npm run test:game-v2:run -- --coverage`
