import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - サブタイマー状態遷移', () => {
      it('未開始→開始→一時停止→再開のフローが正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-flow-pause-resume');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // 1. 未開始状態
          const initial = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            startTime: testInstance.gameState.subTimer.startTime,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          // 2. 開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 150));

          // 残り時間を明示的に更新
          testInstance.updateSubTimerRemainingTime();

          const started = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            startTime: testInstance.gameState.subTimer.startTime,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          // 3. 一時停止
          await testInstance.handleAction({ type: 'SUB_TIMER_PAUSE' });

          const paused = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            pausedAt: testInstance.gameState.subTimer.pausedAt,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          // 少し時間を空けてから再開
          await new Promise(resolve => setTimeout(resolve, 100));

          // 4. 再開
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 再開後の残り時間を明示的に更新
          testInstance.updateSubTimerRemainingTime();

          const resumed = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            pausedAt: testInstance.gameState.subTimer.pausedAt,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          return {
            initial,
            started,
            paused,
            resumed,
            timeContinuedAfterResume: resumed.remainingSeconds < paused.remainingSeconds
          };
        });

        // 1. 未開始状態の確認
        expect(result.initial.isRunning).toBe(false);
        expect(result.initial.isPaused).toBe(false);
        expect(result.initial.startTime).toBeNull();
        expect(Math.abs(result.initial.remainingSeconds - 30)).toBeLessThanOrEqual(0.03);

        // 2. 開始状態の確認
        expect(result.started.isRunning).toBe(true);
        expect(result.started.isPaused).toBe(false);
        expect(result.started.startTime).not.toBeNull();
        expect(result.started.remainingSeconds).toBeLessThan(30);

        // 3. 一時停止状態の確認
        expect(result.paused.isRunning).toBe(false);
        expect(result.paused.isPaused).toBe(true);
        expect(result.paused.pausedAt).not.toBeNull();
        expect(result.paused.remainingSeconds).toBeLessThanOrEqual(result.started.remainingSeconds);

        // 4. 再開状態の確認
        expect(result.resumed.isRunning).toBe(true);
        expect(result.resumed.isPaused).toBe(false);
        expect(result.resumed.pausedAt).toBeNull();
        expect(result.timeContinuedAfterResume).toBe(true);
      });

      it('開始→リセット→再開始のフローが正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-flow-reset-restart');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // 1. 開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100));

          // 残り時間を明示的に更新
          testInstance.updateSubTimerRemainingTime();

          const started = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime
          };

          // 2. リセット
          await testInstance.handleAction({ type: 'SUB_TIMER_RESET' });

          const reset = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime,
            pausedAt: testInstance.gameState.subTimer.pausedAt
          };

          // 3. 再開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 再開始後の残り時間を明示的に更新
          testInstance.updateSubTimerRemainingTime();

          const restarted = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime
          };

          return {
            started,
            reset,
            restarted,
            timeResetProperly: reset.remainingSeconds === 30,
            timeRunningAfterRestart: restarted.remainingSeconds < 30
          };
        });

        // 1. 開始状態
        expect(result.started.isRunning).toBe(true);
        expect(result.started.remainingSeconds).toBeLessThan(30);
        expect(result.started.startTime).not.toBeNull();

        // 2. リセット状態
        expect(result.reset.isRunning).toBe(false);
        expect(result.reset.isPaused).toBe(false);
        expect(Math.abs(result.reset.remainingSeconds - 30)).toBeLessThanOrEqual(0.03);
        expect(result.reset.startTime).toBeNull();
        expect(result.reset.pausedAt).toBeNull();
        expect(result.timeResetProperly).toBe(true);

        // 3. 再開始状態
        expect(result.restarted.isRunning).toBe(true);
        expect(result.restarted.isPaused).toBe(false);
        expect(result.restarted.startTime).not.toBeNull();
        expect(result.timeRunningAfterRestart).toBe(true);
      });

      it('一時停止中のリセット処理が正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-reset-while-paused');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // 1. 開始→一時停止
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100));
          await testInstance.handleAction({ type: 'SUB_TIMER_PAUSE' });

          const pausedState = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            pausedAt: testInstance.gameState.subTimer.pausedAt
          };

          // 2. 一時停止中にリセット
          await testInstance.handleAction({ type: 'SUB_TIMER_RESET' });

          const resetFromPaused = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime,
            pausedAt: testInstance.gameState.subTimer.pausedAt
          };

          // 3. リセット後に開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // リセット後開始の残り時間を明示的に更新
          testInstance.updateSubTimerRemainingTime();

          const afterReset = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          return {
            pausedState,
            resetFromPaused,
            afterReset,
            wasProperlyPaused: pausedState.isPaused && !pausedState.isRunning,
            resetClearedPausedState: !resetFromPaused.isPaused && resetFromPaused.pausedAt === null,
            timeResetCorrectly: resetFromPaused.remainingSeconds === 30
          };
        });

        // 一時停止状態の確認
        expect(result.wasProperlyPaused).toBe(true);
        expect(result.pausedState.remainingSeconds).toBeLessThan(30);
        expect(result.pausedState.pausedAt).not.toBeNull();

        // リセット状態の確認
        expect(result.resetFromPaused.isRunning).toBe(false);
        expect(result.resetFromPaused.isPaused).toBe(false);
        expect(Math.abs(result.resetFromPaused.remainingSeconds - 30)).toBeLessThanOrEqual(0.03);
        expect(result.resetFromPaused.startTime).toBeNull();
        expect(result.resetFromPaused.pausedAt).toBeNull();
        expect(result.resetClearedPausedState).toBe(true);
        expect(result.timeResetCorrectly).toBe(true);

        // リセット後の開始確認
        expect(result.afterReset.isRunning).toBe(true);
        expect(result.afterReset.remainingSeconds).toBeLessThan(30);
      });

      it('カウントダウン完了（0秒到達）時の動作を検証する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-countdown-complete');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // サブタイマーを開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });

          // 時刻を手動で操作して0秒到達をシミュレート
          const startTime = testInstance.gameState.subTimer.startTime;
          testInstance.gameState.subTimer.startTime = startTime - 31000; // 31秒前に開始したことにする

          // 残り時間を更新
          testInstance.updateSubTimerRemainingTime();

          const afterTimeUpdate = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            totalDuration: testInstance.gameState.subTimer.totalDuration
          };

          // 0秒到達後にリセットを試行
          await testInstance.handleAction({ type: 'SUB_TIMER_RESET' });

          const afterReset = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          // 0秒到達後に再開始を試行
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });

          const afterRestart = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          return {
            afterTimeUpdate,
            afterReset,
            afterRestart,
            countdownCompleted: afterTimeUpdate.remainingSeconds <= 0,
            resetWorksAfterCompletion: afterReset.remainingSeconds === 30,
            restartWorksAfterReset: afterRestart.isRunning === true
          };
        });

        // 0秒到達の確認
        expect(result.countdownCompleted).toBe(true);
        expect(result.afterTimeUpdate.remainingSeconds).toBe(0);
        expect(result.afterTimeUpdate.totalDuration).toBe(30); // 総時間は変わらない

        // 0秒到達後のリセット動作
        expect(result.afterReset.isRunning).toBe(false);
        expect(Math.abs(result.afterReset.remainingSeconds - 30)).toBeLessThanOrEqual(0.03);
        expect(result.resetWorksAfterCompletion).toBe(true);

        // リセット後の再開始動作
        expect(result.afterRestart.isRunning).toBe(true);
        expect(result.restartWorksAfterReset).toBe(true);
      });
});
