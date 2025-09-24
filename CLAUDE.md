# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

カバディ用のリアルタイムタイマー・スコアボードアプリケーション。Cloudflare Workers + Durable Objectsを使用してWebSocketによる同期機能を提供。

## 開発コマンド

### 必須コマンド
- **開発サーバー起動**: `npm run dev` - Cloudflare Workersローカル開発環境
  - **重要**: 開発サーバーは必ずバックグラウンドで実行すること（`run_in_background: true`）
- **ビルド**: `npm run build` - TypeScriptコンパイル（クライアント+ワーカー）
  - `npm run build:client:dev` - 開発用個別ファイル出力
  - `npm run build:client:prod` - 本番用バンドル+ミニファイ（esbuild）
  - `npm run build:worker` - ワーカーサイドTypeScriptのビルド
- **型チェック**: `npm run typecheck` - 型エラーのチェック
- **デプロイ**: `npm run deploy` - 本番ビルド + Cloudflare Workersへのデプロイ

## アーキテクチャ構成

### バックエンド (Cloudflare Workers + Durable Objects)
- **`src/index.ts`**: Honoを使用したメインWorkerハンドラー
  - `/game/{gameId}`: スコアボード画面（HTML配信）
  - `/ws/{gameId}`: WebSocket接続エンドポイント
- **`src/durable-objects/game-session.ts`**: GameSession Durable Object
  - ゲーム状態の永続化とWebSocket接続管理
  - リアルタイム同期機能（60秒ごとの時刻同期アラーム）
  - 状態検証・修復機能付き
- **`src/types/game.ts`**: TypeScript型定義

### フロントエンド
- **単一ファイルSPA**: `/game/{gameId}`エンドポイントでHTML+JavaScript配信
- **フレームワーク**: Alpine.js（CDN）、Tailwind CSS（CDN）
- **静的アセット**: `public/js/` からJavaScriptファイルを配信
- **TypeScript**: IIFE形式でコンパイル（`src/client/components/` → `public/js/`）
- **ビルド最適化**:
  - 開発: 13個の個別JSファイル（デバッグ可能）
  - 本番: 1つのバンドル+ミニファイ（esbuild、82KB→21KB）
- **レスポンシブデザイン**: タブレット表示（md以上）とスマホ表示に対応
- **WebSocket通信**: リアルタイムゲーム状態同期

### データ永続化
- **SQLiteバックエンド**: 新しいSQLite Durable Objects（10GB容量）
- **永続化メカニズム**:
  - 全状態変更時に`this.state.storage.put()`で自動保存
  - 初期化時に`loadGameState()`でストレージから復元
  - リトライ機能付き保存（`saveGameStateWithRetry`）
- **状態検証・修復**: `validateGameState()`と`repairGameState()`で整合性保証
- **時刻同期**: サーバー・クライアント間のタイマー同期機能（60秒間隔）
- **接続管理**: WebSocket切断時も状態を永続化し、再接続時に復元

## 重要な技術的詳細

### タイマー同期システム
- サーバーサイドで開始時刻を管理し、クライアントで経過時間を計算
- 60秒ごとの自動時刻同期でドリフト防止
- WebSocket接続断・再接続時の状態復元
- **タイマー表示計算**: `Math.ceil()`を使用して自然なカウントダウン表示を実現
  - 開始時に設定時間を維持（60秒タイマーなら「60」を表示）
  - 0.1秒残っていても「1」と表示（0表示を避ける）
  - `timer-logic.ts`で実装（メインタイマー・サブタイマー両方に適用）

### Durable Objects設定
- `wrangler.toml`でGameSessionクラスをバインディング
- `compatibility_date: 2024-11-01`
- **SQLiteバックエンド**: `new_sqlite_classes = [ "GameSession" ]`で有効化
- マイグレーション設定済み（v1）
- 10GB容量制限、Point-in-Time Recovery対応

### TypeScriptビルド設定
- **`tsconfig.json`**: ワーカー（サーバーサイド）用設定
- **`tsconfig.client.json`**: クライアントサイド用設定
  - `module: "None"`: CommonJS出力を無効化
  - `moduleDetection: "legacy"`: IIFE形式での出力
  - `target: "ES2020"`: ブラウザ互換性確保

### HTMLテンプレート管理方針
- HTMLは必ず別ファイルでimport文を使ってインポートする標準的なビルド時インポートパターンを使用
- `import htmlContent from './template.html'` 形式で読み込み
- 文字列埋め込みやfs.readFileSync()は使用禁止

### 開発時の注意点
- WebSocket接続は`/ws/{gameId}`経由でDurable Objectに転送
- ゲーム状態は自動的に永続化され、接続断後も復元される
- 型安全性を重視（strictモード有効）

## コード品質改善

### 定数管理システム
- **`src/client/components/constants.ts`**: アプリケーション全体の定数を一元管理
  - `DEFAULT_VALUES`: ゲーム初期化値
  - `TEAM_CONFIG`: チーム色・スタイル設定
  - `ACTIONS`: サーバー通信アクション
  - `VALIDATION_CONSTRAINTS`: 入力値制限
  - `UI_CONSTANTS`、`STORAGE_KEYS`: UI・ストレージ関連
- **マジックストリング排除**: 文字列リテラルを定数化し、タイポやメンテナンス性の問題を解決
- **型安全性向上**: 定数の型チェックにより実行時エラーを防止

### WebSocket接続状態フィードバック
- **視覚的インジケーター**: ステータスバーに接続状態を表示
  - 緑色●: 接続済み
  - 黄色●: 接続中
  - オレンジ●（点滅）: 再接続中
  - 赤色●: 切断
- **`connectionStatus`プロパティ**: Alpine.jsで状態管理
- **適切な状態遷移**: 接続断→再接続中→接続済みの流れを正確に表示