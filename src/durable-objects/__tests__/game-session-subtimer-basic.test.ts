import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - サブタイマー基本機能', () => {
  it('サブタイマー開始（SUB_TIMER_START）が正常に動作する', async () => {
    const id = env.GAME_SESSION.idFromName('test-subtimer-start');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      await testInstance.loadGameState();

      const beforeStart = testInstance.gameState.subTimer;

      // サブタイマー開始アクションを実行
      await testInstance.handleAction({ type: 'SUB_TIMER_START' });

      const afterStart = testInstance.gameState.subTimer;

      return {
        beforeIsRunning: beforeStart.isRunning,
        afterIsRunning: afterStart.isRunning,
        beforeStartTime: beforeStart.startTime,
        afterStartTime: afterStart.startTime,
        beforeIsPaused: beforeStart.isPaused,
        afterIsPaused: afterStart.isPaused,
        totalDuration: afterStart.totalDuration,
        remainingSeconds: afterStart.remainingSeconds,
        startTimeSet: afterStart.startTime !== null
      };
    });

    // 修復ロジックによりデフォルト状態でもisRunning=trueになることがある
    expect(result.afterIsRunning).toBe(true);
    expect(result.startTimeSet).toBe(true);
    expect(result.afterIsPaused).toBe(false);
    expect(result.totalDuration).toBe(30); // 30秒固定
    expect(Math.abs(result.remainingSeconds - 30)).toBeLessThanOrEqual(0.03);
  });

  it('サブタイマー一時停止（SUB_TIMER_PAUSE）が正常に動作する', async () => {
    const id = env.GAME_SESSION.idFromName('test-subtimer-pause');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      await testInstance.loadGameState();

      // サブタイマーをリセットしてから開始
      await testInstance.handleAction({ type: 'SUB_TIMER_RESET' });
      await testInstance.handleAction({ type: 'SUB_TIMER_START' });
      await new Promise(resolve => setTimeout(resolve, 100)); // 少し時間を経過

      // 一時停止前の状態確認用に残り時間を更新
      testInstance.updateSubTimerRemainingTime();

      const beforePause = { ...testInstance.gameState.subTimer };

      // サブタイマー一時停止
      await testInstance.handleAction({ type: 'SUB_TIMER_PAUSE' });

      const afterPause = testInstance.gameState.subTimer;

      return {
        beforeIsRunning: beforePause.isRunning,
        afterIsRunning: afterPause.isRunning,
        beforeIsPaused: beforePause.isPaused,
        afterIsPaused: afterPause.isPaused,
        pausedAtSet: afterPause.pausedAt !== null,
        remainingSeconds: afterPause.remainingSeconds,
        timePassed: afterPause.remainingSeconds < 30
      };
    });

    expect(result.beforeIsRunning).toBe(true);
    expect(result.afterIsRunning).toBe(false);
    expect(result.beforeIsPaused).toBe(false);
    expect(result.afterIsPaused).toBe(true);
    expect(result.pausedAtSet).toBe(true);
    expect(result.timePassed).toBe(true); // 時間が経過している
    expect(result.remainingSeconds).toBeLessThan(30);
  });

  it('サブタイマーリセット（SUB_TIMER_RESET）が正常に動作する', async () => {
    const id = env.GAME_SESSION.idFromName('test-subtimer-reset');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      await testInstance.loadGameState();

      // サブタイマーをリセットしてから開始
      await testInstance.handleAction({ type: 'SUB_TIMER_RESET' });
      await testInstance.handleAction({ type: 'SUB_TIMER_START' });
      await new Promise(resolve => setTimeout(resolve, 100));

      // 残り時間を明示的に更新してから取得
      testInstance.updateSubTimerRemainingTime();
      const beforeReset = { ...testInstance.gameState.subTimer };

      // サブタイマーリセット
      await testInstance.handleAction({ type: 'SUB_TIMER_RESET' });

      const afterReset = testInstance.gameState.subTimer;

      return {
        beforeIsRunning: beforeReset.isRunning,
        afterIsRunning: afterReset.isRunning,
        beforeIsPaused: beforeReset.isPaused,
        afterIsPaused: afterReset.isPaused,
        beforeStartTime: beforeReset.startTime,
        afterStartTime: afterReset.startTime,
        beforePausedAt: beforeReset.pausedAt,
        afterPausedAt: afterReset.pausedAt,
        remainingSeconds: afterReset.remainingSeconds,
        totalDuration: afterReset.totalDuration
      };
    });

    expect(result.beforeIsRunning).toBe(true);
    expect(result.afterIsRunning).toBe(false);
    expect(result.afterIsPaused).toBe(false);
    expect(result.beforeStartTime).not.toBeNull();
    expect(result.afterStartTime).toBeNull();
    expect(result.afterPausedAt).toBeNull();
    expect(Math.abs(result.remainingSeconds - 30)).toBeLessThanOrEqual(0.03); // リセット後は30秒
    expect(result.totalDuration).toBe(30);
  });

  it('サブタイマーが30秒固定時間で動作する', async () => {
    const id = env.GAME_SESSION.idFromName('test-subtimer-duration');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      await testInstance.loadGameState();

      const initialSubTimer = testInstance.gameState.subTimer;

      // サブタイマーを開始
      await testInstance.handleAction({ type: 'SUB_TIMER_START' });

      // 時間更新を実行
      testInstance.updateSubTimerRemainingTime();

      const runningSubTimer = testInstance.gameState.subTimer;

      // リセット
      await testInstance.handleAction({ type: 'SUB_TIMER_RESET' });

      const resetSubTimer = testInstance.gameState.subTimer;

      return {
        initialDuration: initialSubTimer.totalDuration,
        initialRemaining: initialSubTimer.remainingSeconds,
        runningDuration: runningSubTimer.totalDuration,
        resetDuration: resetSubTimer.totalDuration,
        resetRemaining: resetSubTimer.remainingSeconds,
        durationConsistent: initialSubTimer.totalDuration === runningSubTimer.totalDuration &&
                           runningSubTimer.totalDuration === resetSubTimer.totalDuration
      };
    });

    expect(result.initialDuration).toBe(30);
    expect(result.initialRemaining).toBe(30);
    expect(result.runningDuration).toBe(30);
    expect(result.resetDuration).toBe(30);
    expect(result.resetRemaining).toBe(30);
    expect(result.durationConsistent).toBe(true);
  });

  it('メインタイマーとサブタイマーが独立して動作する', async () => {
    const id = env.GAME_SESSION.idFromName('test-timer-independence');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      await testInstance.loadGameState();

      // メインタイマーのみ開始
      await testInstance.handleAction({ type: 'TIMER_START' });
      await new Promise(resolve => setTimeout(resolve, 50));

      // 状態確認前に時間を更新
      testInstance.updateRemainingTime();

      const mainRunning = {
        mainTimerRunning: testInstance.gameState.timer.isRunning,
        subTimerRunning: testInstance.gameState.subTimer?.isRunning || false
      };

      // サブタイマーのみ開始
      await testInstance.handleAction({ type: 'SUB_TIMER_START' });
      await new Promise(resolve => setTimeout(resolve, 50));

      // 状態確認前に時間を更新
      testInstance.updateRemainingTime();
      testInstance.updateSubTimerRemainingTime();

      const bothRunning = {
        mainTimerRunning: testInstance.gameState.timer.isRunning,
        subTimerRunning: testInstance.gameState.subTimer.isRunning
      };

      // メインタイマーのみ停止
      await testInstance.handleAction({ type: 'TIMER_PAUSE' });

      const mainPaused = {
        mainTimerRunning: testInstance.gameState.timer.isRunning,
        mainTimerPaused: testInstance.gameState.timer.isPaused,
        subTimerRunning: testInstance.gameState.subTimer.isRunning,
        subTimerPaused: testInstance.gameState.subTimer.isPaused
      };

      // サブタイマーのみ停止
      await testInstance.handleAction({ type: 'SUB_TIMER_PAUSE' });

      const bothPaused = {
        mainTimerRunning: testInstance.gameState.timer.isRunning,
        mainTimerPaused: testInstance.gameState.timer.isPaused,
        subTimerRunning: testInstance.gameState.subTimer.isRunning,
        subTimerPaused: testInstance.gameState.subTimer.isPaused
      };

      return {
        mainRunning,
        bothRunning,
        mainPaused,
        bothPaused
      };
    });

    // メインタイマーのみ実行時
    expect(result.mainRunning.mainTimerRunning).toBe(true);
    expect(result.mainRunning.subTimerRunning).toBe(false);

    // 両方実行時
    expect(result.bothRunning.mainTimerRunning).toBe(true);
    expect(result.bothRunning.subTimerRunning).toBe(true);

    // メインタイマーのみ停止時
    expect(result.mainPaused.mainTimerRunning).toBe(false);
    expect(result.mainPaused.mainTimerPaused).toBe(true);
    expect(result.mainPaused.subTimerRunning).toBe(true);
    expect(result.mainPaused.subTimerPaused).toBe(false);

    // 両方停止時
    expect(result.bothPaused.mainTimerRunning).toBe(false);
    expect(result.bothPaused.mainTimerPaused).toBe(true);
    expect(result.bothPaused.subTimerRunning).toBe(false);
    expect(result.bothPaused.subTimerPaused).toBe(true);
  });
});
