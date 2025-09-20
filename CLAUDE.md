# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

カバディ用のリアルタイムタイマー・スコアボードアプリケーション。Cloudflare Workers + Durable Objectsを使用してWebSocketによる同期機能を提供。

## 開発コマンド

### 必須コマンド
- **開発サーバー起動**: `npm run dev` - Cloudflare Workersローカル開発環境
- **ビルド**: `npm run build` - TypeScriptコンパイル
- **型チェック**: `npm run typecheck` - 型エラーのチェック
- **デプロイ**: `wrangler deploy` - Cloudflare Workersへのデプロイ

### フロントエンド開発用
- **フロントエンド開発サーバー**: `npm run dev:frontend` - Vite開発サーバー（ポート3000）
- **フロントエンド ビルド**: `npm run build:frontend` - 静的アセットのビルド

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
- **レスポンシブデザイン**: タブレット表示（md以上）とスマホ表示に対応
- **WebSocket通信**: リアルタイムゲーム状態同期

### データ永続化
- **Durable Objects Storage**: ゲーム状態の永続化
- **時刻同期**: サーバー・クライアント間のタイマー同期機能
- **エラーハンドリング**: 状態検証・修復・リトライ機能

## 重要な技術的詳細

### タイマー同期システム
- サーバーサイドで開始時刻を管理し、クライアントで経過時間を計算
- 60秒ごとの自動時刻同期でドリフト防止
- WebSocket接続断・再接続時の状態復元

### Durable Objects設定
- `wrangler.toml`でGameSessionクラスをバインディング
- `compatibility_date: 2024-11-01`
- マイグレーション設定済み（v1）

### 開発時の注意点
- WebSocket接続は`/ws/{gameId}`経由でDurable Objectに転送
- ゲーム状態は自動的に永続化され、接続断後も復元される
- 型安全性を重視（strictモード有効）