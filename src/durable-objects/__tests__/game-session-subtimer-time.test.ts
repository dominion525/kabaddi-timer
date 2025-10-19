import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - サブタイマー時刻計算', () => {
      it('残り時間の正確な計算（updateSubTimerRemainingTime）が動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-time-calculation');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // サブタイマーを開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          const startTime = testInstance.gameState.subTimer.startTime;

          // 複数回の時刻更新で正確性を検証
          const timeChecks = [];

          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));

            const beforeUpdate = testInstance.gameState.subTimer.remainingSeconds;
            testInstance.updateSubTimerRemainingTime();
            const afterUpdate = testInstance.gameState.subTimer.remainingSeconds;

            const currentTime = Date.now();
            const expectedElapsed = (currentTime - startTime) / 1000;
            const expectedRemaining = Math.max(0, 30 - expectedElapsed);

            timeChecks.push({
              beforeUpdate,
              afterUpdate,
              expectedRemaining,
              actualElapsed: 30 - afterUpdate,
              expectedElapsed,
              timeDifference: Math.abs(afterUpdate - expectedRemaining),
              isAccurate: Math.abs(afterUpdate - expectedRemaining) < 0.1 // 100ms以内の誤差
            });
          }

          return {
            startTime,
            timeChecks,
            allAccurate: timeChecks.every(check => check.isAccurate),
            timeProgression: timeChecks.map(check => check.afterUpdate)
          };
        });

        expect(result.startTime).not.toBeNull();
        expect(result.allAccurate).toBe(true);

        // 時間が順次減少していることを確認
        const timeProgression = result.timeProgression;
        for (let i = 1; i < timeProgression.length; i++) {
          expect(timeProgression[i]).toBeLessThanOrEqual(timeProgression[i - 1]);
        }

        // 各時刻計算の精度を個別確認
        result.timeChecks.forEach((check, index) => {
          expect(check.timeDifference).toBeLessThan(0.1); // 100ms以内の誤差
          expect(check.afterUpdate).toBeLessThanOrEqual(30);
          expect(check.afterUpdate).toBeGreaterThanOrEqual(0);
        });
      });

      it('一時停止・再開時の経過時間保持が正確に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-pause-resume-time');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // 1. 開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          const originalStartTime = testInstance.gameState.subTimer.startTime;

          await new Promise(resolve => setTimeout(resolve, 100));

          // 2. 一時停止前の時間を記録
          testInstance.updateSubTimerRemainingTime();
          const beforePause = {
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            elapsedTime: 30 - testInstance.gameState.subTimer.remainingSeconds
          };

          await testInstance.handleAction({ type: 'SUB_TIMER_PAUSE' });
          const pausedAt = testInstance.gameState.subTimer.pausedAt;

          // 3. 一時停止中に時間を経過
          await new Promise(resolve => setTimeout(resolve, 200));

          const duringPause = {
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            pausedAt: testInstance.gameState.subTimer.pausedAt
          };

          // 4. 再開
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          const resumedStartTime = testInstance.gameState.subTimer.startTime;

          await new Promise(resolve => setTimeout(resolve, 100));

          // 5. 再開後の時間を確認
          testInstance.updateSubTimerRemainingTime();
          const afterResume = {
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            newElapsedTime: 30 - testInstance.gameState.subTimer.remainingSeconds
          };

          return {
            originalStartTime,
            beforePause,
            duringPause,
            afterResume,
            resumedStartTime,
            pausedAt,
            timePreservedDuringPause: duringPause.remainingSeconds === beforePause.remainingSeconds,
            timeAdvancedAfterResume: afterResume.remainingSeconds < beforePause.remainingSeconds,
            startTimeAdjusted: resumedStartTime !== originalStartTime,
            totalElapsedConsistent: afterResume.newElapsedTime > beforePause.elapsedTime
          };
        });

        // 一時停止中は時間が進まない
        expect(result.timePreservedDuringPause).toBe(true);

        // 再開後は時間が進む
        expect(result.timeAdvancedAfterResume).toBe(true);

        // 開始時刻が調整される（一時停止時間を補正）
        expect(result.startTimeAdjusted).toBe(true);

        // 総経過時間の一貫性
        expect(result.totalElapsedConsistent).toBe(true);
        expect(result.afterResume.remainingSeconds).toBeLessThanOrEqual(result.beforePause.remainingSeconds);
      });

      it('長時間一時停止後の再開で時刻計算が正確に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-long-pause');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // 1. サブタイマー開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 150));

          // 2. 一時停止前の状態を記録
          testInstance.updateSubTimerRemainingTime();
          const beforeLongPause = {
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime,
            elapsedTime: 30 - testInstance.gameState.subTimer.remainingSeconds
          };

          // 3. 一時停止
          await testInstance.handleAction({ type: 'SUB_TIMER_PAUSE' });
          const pauseTime = Date.now();

          // 4. 長時間停止をシミュレート（実際は短時間）
          await new Promise(resolve => setTimeout(resolve, 300));

          const duringLongPause = {
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused
          };

          // 5. 再開
          const resumeTime = Date.now();
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });

          // 6. 再開後少し時間を経過
          await new Promise(resolve => setTimeout(resolve, 100));
          testInstance.updateSubTimerRemainingTime();

          const afterLongPause = {
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime,
            isRunning: testInstance.gameState.subTimer.isRunning,
            elapsedTime: 30 - testInstance.gameState.subTimer.remainingSeconds
          };

          // 7. 開始時刻の調整量を計算
          const pauseDuration = resumeTime - pauseTime;
          const startTimeAdjustment = afterLongPause.startTime - beforeLongPause.startTime;

          return {
            beforeLongPause,
            duringLongPause,
            afterLongPause,
            pauseDuration,
            startTimeAdjustment,
            timePreservedDuringPause: duringLongPause.remainingSeconds === beforeLongPause.remainingSeconds,
            properlyResumed: afterLongPause.isRunning && !afterLongPause.isPaused,
            timeAdvancedAfterResume: afterLongPause.remainingSeconds < beforeLongPause.remainingSeconds,
            startTimeAdjustedProperly: Math.abs(startTimeAdjustment - pauseDuration) < 100 // 100ms以内の誤差
          };
        });

        // 長時間停止中も時間が保持される
        expect(result.timePreservedDuringPause).toBe(true);
        expect(result.duringLongPause.isRunning).toBe(false);
        expect(result.duringLongPause.isPaused).toBe(true);

        // 再開後の状態確認
        expect(result.properlyResumed).toBe(true);
        expect(result.timeAdvancedAfterResume).toBe(true);

        // 開始時刻の調整（一時停止時間分だけ遅らせる）
        expect(result.startTimeAdjustedProperly).toBe(true);
        expect(result.pauseDuration).toBeGreaterThan(200); // 最低300ms停止
        expect(result.startTimeAdjustment).toBeGreaterThan(200);

        // 時間の一貫性
        expect(result.afterLongPause.remainingSeconds).toBeLessThanOrEqual(result.beforeLongPause.remainingSeconds);
        expect(result.afterLongPause.elapsedTime).toBeGreaterThan(result.beforeLongPause.elapsedTime);
      });
});
