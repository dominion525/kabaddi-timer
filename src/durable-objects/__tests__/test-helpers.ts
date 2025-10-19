import { describe, it, expect } from 'vitest';
import { env, runInDurableObject } from 'cloudflare:test';
import { GameSession } from '../game-session';
import type { GameState, GameAction } from '../../types/game';

/**
 * GameSessionのprivateメンバーにテストからアクセスするための型定義
 */
export type GameSessionTestAccess = {
  gameState: GameState;
  loadGameState: () => Promise<void>;
  saveGameState: () => Promise<void>;
  saveGameStateWithRetry: () => Promise<void>;
  handleAction: (action: GameAction) => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  adjustTimerTime: (seconds: number) => Promise<void>;
  updateRemainingTime: () => void;
  updateSubTimerRemainingTime: () => void;
  getDefaultGameState: () => GameState;
  validateGameState: (state: unknown) => state is GameState;
  repairGameState: (state: unknown) => GameState;
  isStateLoaded: boolean;
};

// 共通のエクスポート
export { describe, it, expect, env, runInDurableObject, GameSession };
export type { GameState, GameAction };
