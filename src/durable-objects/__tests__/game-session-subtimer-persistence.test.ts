import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - サブタイマー永続化・復元', () => {
      it('サブタイマー実行中の状態永続化が正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-persistence-running');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          await testInstance.loadGameState();

          // サブタイマーを開始
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100));

          // 残り時間を明示的に更新してから取得
          testInstance.updateSubTimerRemainingTime();

          const beforeSave = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            startTime: testInstance.gameState.subTimer.startTime,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            totalDuration: testInstance.gameState.subTimer.totalDuration
          };

          // 状態を保存
          await testInstance.saveGameState();

          // ストレージから直接確認
          const savedData = await state.storage.get('gameState');
          const savedSubTimer = savedData?.subTimer;

          // remainingSecondsの比較では、実行中のタイマーなので多少の誤差を許容
          const remainingSecondsWithinRange = Math.abs((savedSubTimer?.remainingSeconds || 0) - beforeSave.remainingSeconds) <= 0.03;

          return {
            beforeSave,
            savedSubTimer,
            saveSucceeded: savedSubTimer !== undefined,
            isRunningPreserved: savedSubTimer?.isRunning === beforeSave.isRunning,
            startTimePreserved: savedSubTimer?.startTime === beforeSave.startTime,
            remainingSecondsPreserved: remainingSecondsWithinRange,
            totalDurationPreserved: savedSubTimer?.totalDuration === beforeSave.totalDuration
          };
        });

        expect(result.saveSucceeded).toBe(true);
        expect(result.isRunningPreserved).toBe(true);
        expect(result.startTimePreserved).toBe(true);
        expect(result.remainingSecondsPreserved).toBe(true);
        expect(result.totalDurationPreserved).toBe(true);
        expect(result.beforeSave.isRunning).toBe(true);
        expect(result.beforeSave.startTime).not.toBeNull();
        expect(result.beforeSave.remainingSeconds).toBeLessThan(30);
      });

      it('一時停止中のサブタイマー状態復元が正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-restore-paused');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          const testInstance = instance as unknown as GameSessionTestAccess;

          // 最初のセッション：一時停止状態まで実行
          await testInstance.loadGameState();
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 150));
          await testInstance.handleAction({ type: 'SUB_TIMER_PAUSE' });

          // 残り時間を明示的に更新してから取得
          testInstance.updateSubTimerRemainingTime();

          const beforeSave = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            pausedAt: testInstance.gameState.subTimer.pausedAt,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime
          };

          // 状態を保存
          await testInstance.saveGameState();

          // 復元をシミュレート（状態をクリア）
          testInstance.isStateLoaded = false;
          testInstance.gameState = null;

          // 状態を再ロード
          await testInstance.loadGameState();

          // 復元後の残り時間を明示的に更新
          testInstance.updateSubTimerRemainingTime();

          const afterRestore = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            pausedAt: testInstance.gameState.subTimer.pausedAt,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds,
            startTime: testInstance.gameState.subTimer.startTime
          };

          // 復元後の再開動作確認
          await testInstance.handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 再開後の残り時間を明示的に更新
          testInstance.updateSubTimerRemainingTime();

          const afterResume = {
            isRunning: testInstance.gameState.subTimer.isRunning,
            isPaused: testInstance.gameState.subTimer.isPaused,
            remainingSeconds: testInstance.gameState.subTimer.remainingSeconds
          };

          return {
            beforeSave,
            afterRestore,
            afterResume,
            isRunningRestored: beforeSave.isRunning === afterRestore.isRunning,
            isPausedRestored: beforeSave.isPaused === afterRestore.isPaused,
            pausedAtRestored: beforeSave.pausedAt === afterRestore.pausedAt,
            remainingSecondsRestored: beforeSave.remainingSeconds === afterRestore.remainingSeconds,
            startTimeRestored: beforeSave.startTime === afterRestore.startTime,
            resumeWorksAfterRestore: afterResume.isRunning && !afterResume.isPaused
          };
        });

        // 一時停止状態の復元確認
        expect(result.isRunningRestored).toBe(true);
        expect(result.isPausedRestored).toBe(true);
        expect(result.pausedAtRestored).toBe(true);
        expect(result.remainingSecondsRestored).toBe(true);
        expect(result.startTimeRestored).toBe(true);

        // 復元された状態の値確認
        expect(result.afterRestore.isRunning).toBe(false);
        expect(result.afterRestore.isPaused).toBe(true);
        expect(result.afterRestore.pausedAt).not.toBeNull();
        expect(result.afterRestore.remainingSeconds).toBeLessThan(30);
        expect(result.afterRestore.startTime).not.toBeNull();

        // 復元後の再開確認
        expect(result.resumeWorksAfterRestore).toBe(true);
        expect(result.afterResume.remainingSeconds).toBeLessThan(result.afterRestore.remainingSeconds);
      });
});
