import { render as originalRender, RenderOptions } from '@testing-library/preact';
import { ComponentChildren } from 'preact';

// カスタムレンダー関数の型定義
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // 必要に応じて追加のオプションを定義
}

// Preact用のカスタムレンダー関数
export function render(
  ui: ComponentChildren,
  options?: CustomRenderOptions
) {
  return originalRender(ui, {
    ...options,
  });
}

// testing-libraryの他の関数をそのままエクスポート
export * from '@testing-library/preact';
export { userEvent } from '@testing-library/user-event';

// カスタムマッチャー用のユーティリティ
export const createMockGameState = () => ({
  teamA: {
    name: 'チームA',
    score: 0,
    doOrDieCount: 0,
  },
  teamB: {
    name: 'チームB',
    score: 0,
    doOrDieCount: 0,
  },
  timer: {
    totalDuration: 3600,
    startTime: null,
    isRunning: false,
    isPaused: false,
    pausedAt: null,
    remainingSeconds: 3600,
  },
  subTimer: {
    totalDuration: 30,
    startTime: null,
    isRunning: false,
    isPaused: false,
    pausedAt: null,
    remainingSeconds: 30,
  },
  leftSideTeam: 'teamA' as const,
  serverTime: Date.now(),
  lastUpdated: Date.now(),
});

// WebSocketメッセージのファクトリー関数
export const createGameMessage = (type: string, data?: any) => ({
  type,
  data,
  timestamp: Date.now(),
});

// よく使用するテスト用の定数
export const TEST_GAME_ID = 'test-game-123';
export const TEST_WS_URL = 'ws://localhost/ws/test-game-123';