# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-10-19

### Fixed
- タイマーリセット時に初期設定時間に戻らない不具合を修正
  - `initialDuration`フィールドを追加してリセット先時間を保持
  - 時間調整後も正しくリセットできるように改善
- コントロールパネルの時間設定表示で小数点が表示される不具合を修正
  - `Math.ceil()`を使用して自然な整数表示を実現

### Changed
- モバイルコントロールの初期設定をシンプルモードに変更
  - 初回ユーザー向けに操作が簡単なUIをデフォルトに設定
- デスクトップコントロールのボタン高さを調整
  - +1/-1ボタンを`h-12`（48px）に変更してコンパクト化

### Added
- テストカバレッジを大幅に向上（+6.48% branch, +2.26% lines）
  - StatusBar.test.tsx (28テスト)
  - VersusIndicator.test.tsx (11テスト)
  - DoOrDieIndicator.test.tsx (12テスト)
  - TeamScore.test.tsx (10テスト)
  - 全体カバレッジ: 84.87% statements, 72.92% branch, 86.64% lines

### Documentation
- CLAUDE.mdにタイマー状態管理の詳細を追加
- テストカバレッジ情報をドキュメントに記載

## [0.1.0] - 2025-10-18

### Added
- 初回リリース
- カバディ用リアルタイムタイマー・スコアボード機能
- WebSocketによる複数デバイス間同期
- Cloudflare Workers + Durable Objects構成
- Preact + TSX + Tailwind CSSによるUI
