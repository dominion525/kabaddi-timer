import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - タイマー機能', () => {
  it('タイマー開始機能をテストする', async () => {
    const id = env.GAME_SESSION.idFromName('test-timer-start');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // タイマー開始前の状態確認
      let gameState = testInstance.gameState;
      expect(gameState.timer.isRunning).toBe(false);
      expect(gameState.timer.startTime).toBe(null);

      // タイマー開始
      await testInstance.startTimer();
      gameState = testInstance.gameState;

      expect(gameState.timer.isRunning).toBe(true);
      expect(gameState.timer.startTime).toBeGreaterThan(0);
      expect(gameState.timer.isPaused).toBe(false);

      return gameState.timer;
    });

    expect(result.isRunning).toBe(true);
  });

  it('タイマー停止機能をテストする', async () => {
    const id = env.GAME_SESSION.idFromName('test-timer-pause');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // タイマー開始
      await testInstance.startTimer();
      await new Promise(resolve => setTimeout(resolve, 100)); // 少し待機

      // タイマー停止
      await testInstance.pauseTimer();
      const gameState = testInstance.gameState;

      expect(gameState.timer.isRunning).toBe(false);
      expect(gameState.timer.isPaused).toBe(true);
      expect(gameState.timer.pausedAt).toBeGreaterThan(0);

      return gameState.timer;
    });

    expect(result.isRunning).toBe(false);
    expect(result.isPaused).toBe(true);
  });

  it('タイマーリセット機能をテストする', async () => {
    const id = env.GAME_SESSION.idFromName('test-timer-reset');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // タイマー開始してから停止
      await testInstance.startTimer();
      await testInstance.pauseTimer();

      // リセット前の状態確認
      let gameState = testInstance.gameState;
      expect(gameState.timer.isPaused).toBe(true);

      // リセット実行
      await testInstance.resetTimer();
      gameState = testInstance.gameState;

      expect(gameState.timer.isRunning).toBe(false);
      expect(gameState.timer.isPaused).toBe(false);
      expect(gameState.timer.startTime).toBe(null);
      expect(gameState.timer.pausedAt).toBe(null);
      expect(gameState.timer.remainingSeconds).toBe(900); // デフォルトの15分

      return gameState.timer;
    });

    expect(result.remainingSeconds).toBe(900);
  });

  it('タイマー調整機能をテストする', async () => {
    const id = env.GAME_SESSION.idFromName('test-timer-adjust');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // 30秒追加
      await testInstance.adjustTimerTime(30);
      let gameState = testInstance.gameState;
      expect(gameState.timer.remainingSeconds).toBe(930); // 900 + 30

      // 60秒減少
      await testInstance.adjustTimerTime(-60);
      gameState = testInstance.gameState;
      expect(gameState.timer.remainingSeconds).toBe(870); // 930 - 60

      return gameState.timer.remainingSeconds;
    });

    expect(result).toBe(870);
  });
});
