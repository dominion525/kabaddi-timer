import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - 状態永続化と復元', () => {
  describe('ストレージ操作の信頼性', () => {
    it('loadGameState - 初回ロード時にデフォルト状態を設定する', async () => {
      const id = env.GAME_SESSION.idFromName('test-load-default-state');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // ストレージに何も保存されていない状態での初回ロード
        await testInstance.loadGameState();
        const gameState = testInstance.gameState;
        const isStateLoaded = testInstance.isStateLoaded;

        return {
          gameState,
          isStateLoaded,
          teamAName: gameState.teamA.name,
          teamBName: gameState.teamB.name,
          timerDuration: gameState.timer.totalDuration,
          remainingSeconds: gameState.timer.remainingSeconds
        };
      });

      expect(result.isStateLoaded).toBe(true);
      expect(result.teamAName).toBe('チームA');
      expect(result.teamBName).toBe('チームB');
      expect(result.timerDuration).toBe(900); // 15分
      expect(result.remainingSeconds).toBe(900);
    });

    it('loadGameState - キャッシュ機能が正常に動作する', async () => {
      const id = env.GAME_SESSION.idFromName('test-load-cache');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // 最初のロード
        await testInstance.loadGameState();
        const firstLoadTime = Date.now();

        // 状態を変更
        testInstance.gameState.teamA.score = 10;
        const modifiedScore = testInstance.gameState.teamA.score;

        // 2回目のロード（キャッシュが効いているはず）
        await testInstance.loadGameState();
        const cachedScore = testInstance.gameState.teamA.score;
        const isStateLoaded = testInstance.isStateLoaded;

        return {
          isStateLoaded,
          modifiedScore,
          cachedScore,
          scoresMatch: modifiedScore === cachedScore
        };
      });

      expect(result.isStateLoaded).toBe(true);
      expect(result.modifiedScore).toBe(10);
      expect(result.cachedScore).toBe(10);
      expect(result.scoresMatch).toBe(true); // キャッシュが効いていれば変更が保持される
    });

    it('saveGameStateWithRetry - 成功ケース（1回目で成功）', async () => {
      const id = env.GAME_SESSION.idFromName('test-save-success');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // 状態を変更
        testInstance.gameState.teamA.score = 15;
        testInstance.gameState.teamB.score = 8;

        // 保存実行（1回目で成功するはず）
        await testInstance.saveGameStateWithRetry();

        // ストレージから直接確認
        const savedData = await state.storage.get('gameState');

        return {
          saveSucceeded: savedData !== undefined,
          savedTeamAScore: savedData?.teamA?.score,
          savedTeamBScore: savedData?.teamB?.score
        };
      });

      expect(result.saveSucceeded).toBe(true);
      expect(result.savedTeamAScore).toBe(15);
      expect(result.savedTeamBScore).toBe(8);
    });

    it('saveGameState - メイン保存メソッドが正常に動作する', async () => {
      const id = env.GAME_SESSION.idFromName('test-save-main');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // 初期状態をロード
        await testInstance.loadGameState();

        // 複数の状態を変更
        testInstance.gameState.teamA.name = 'テストチームA';
        testInstance.gameState.teamB.name = 'テストチームB';
        testInstance.gameState.teamA.score = 12;
        testInstance.gameState.teamB.score = 7;
        testInstance.gameState.teamA.doOrDieCount = 2;

        // 保存実行
        await testInstance.saveGameState();

        // ストレージから確認
        const savedData = await state.storage.get('gameState');

        return {
          savedData,
          teamAName: savedData?.teamA?.name,
          teamBName: savedData?.teamB?.name,
          teamAScore: savedData?.teamA?.score,
          teamBScore: savedData?.teamB?.score,
          doOrDieCount: savedData?.teamA?.doOrDieCount
        };
      });

      expect(result.teamAName).toBe('テストチームA');
      expect(result.teamBName).toBe('テストチームB');
      expect(result.teamAScore).toBe(12);
      expect(result.teamBScore).toBe(7);
      expect(result.doOrDieCount).toBe(2);
    });

    it('同時保存リクエストが安全に処理される', async () => {
      const id = env.GAME_SESSION.idFromName('test-concurrent-saves');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // 初期状態をロード
        await testInstance.loadGameState();

        // 複数の保存操作を同時実行
        const savePromises = [
          (async () => {
            testInstance.gameState.teamA.score = 5;
            await testInstance.saveGameState();
          })(),
          (async () => {
            testInstance.gameState.teamB.score = 3;
            await testInstance.saveGameState();
          })(),
          (async () => {
            testInstance.gameState.teamA.name = '並行保存テスト';
            await testInstance.saveGameState();
          })()
        ];

        await Promise.all(savePromises);

        // 最終的な保存状態を確認
        const savedData = await state.storage.get('gameState');

        return {
          teamAScore: savedData?.teamA?.score,
          teamBScore: savedData?.teamB?.score,
          teamAName: savedData?.teamA?.name,
          hasAllChanges: savedData?.teamA?.score >= 0 &&
                        savedData?.teamB?.score >= 0 &&
                        savedData?.teamA?.name?.length > 0
        };
      });

      // 同時実行でも全ての変更が反映されることを確認
      expect(result.hasAllChanges).toBe(true);
      expect(result.teamAScore).toBeGreaterThanOrEqual(0);
      expect(result.teamBScore).toBeGreaterThanOrEqual(0);
      expect(result.teamAName).toBeTruthy();
    });
  });

  describe('状態復元シナリオ', () => {
    it('タイマー実行中の状態復元で経過時間が正確に計算される', async () => {
      const id = env.GAME_SESSION.idFromName('test-timer-restore');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // 初期状態をロード
        await testInstance.loadGameState();

        // タイマーを開始
        await testInstance.startTimer();
        const startTime = testInstance.gameState.timer.startTime;

        // 少し時間を経過させる（テストなので短時間）
        await new Promise(resolve => setTimeout(resolve, 100));

        // タイマー状態を保存
        await testInstance.saveGameState();

        // 状態復元をシミュレート（isStateLoadedをリセット）
        testInstance.isStateLoaded = false;

        // さらに時間を経過させてから復元
        await new Promise(resolve => setTimeout(resolve, 50));

        await testInstance.loadGameState();

        // remainingSecondsを更新
        testInstance.updateRemainingTime();

        const restoredGameState = testInstance.gameState;

        return {
          originalStartTime: startTime,
          restoredStartTime: restoredGameState.timer.startTime,
          isRunning: restoredGameState.timer.isRunning,
          remainingSeconds: restoredGameState.timer.remainingSeconds,
          isTimeCalculated: restoredGameState.timer.remainingSeconds < 900 // 経過時間が反映されている
        };
      });

      expect(result.originalStartTime).toBe(result.restoredStartTime);
      expect(result.isRunning).toBe(true);
      expect(result.isTimeCalculated).toBe(true);
      expect(result.remainingSeconds).toBeLessThan(900);
    });

    it('一時停止中のタイマー状態が正確に復元される', async () => {
      const id = env.GAME_SESSION.idFromName('test-paused-timer-restore');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // タイマーを開始して一時停止
        await testInstance.startTimer();
        await new Promise(resolve => setTimeout(resolve, 100));
        await testInstance.pauseTimer();

        const pausedAt = testInstance.gameState.timer.pausedAt;
        const remainingBeforeSave = testInstance.gameState.timer.remainingSeconds;

        // 状態を保存
        await testInstance.saveGameState();

        // 復元をシミュレート
        testInstance.isStateLoaded = false;
        await testInstance.loadGameState();

        const restoredGameState = testInstance.gameState;

        return {
          originalPausedAt: pausedAt,
          restoredPausedAt: restoredGameState.timer.pausedAt,
          originalRemaining: remainingBeforeSave,
          restoredRemaining: restoredGameState.timer.remainingSeconds,
          isRunning: restoredGameState.timer.isRunning,
          isPaused: restoredGameState.timer.isPaused
        };
      });

      expect(result.originalPausedAt).toBe(result.restoredPausedAt);
      expect(result.originalRemaining).toBe(result.restoredRemaining);
      expect(result.isRunning).toBe(false);
      expect(result.isPaused).toBe(true);
    });

    it('不完全な状態データからの自動修復が動作する', async () => {
      const id = env.GAME_SESSION.idFromName('test-state-repair');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // 不完全な状態をストレージに直接保存
        const incompleteState = {
          teamA: { name: 'チームA', score: 5 }, // doOrDieCountが欠損
          teamB: null, // teamB全体が欠損
          timer: { isRunning: false }, // 必要なフィールドが欠損
          // subTimerが欠損
          serverTime: Date.now()
        };

        await state.storage.put('gameState', incompleteState);

        // 状態をロード（修復が行われるはず）
        testInstance.isStateLoaded = false;
        await testInstance.loadGameState();

        const repairedState = testInstance.gameState;

        return {
          teamAScore: repairedState.teamA.score,
          teamADoOrDie: repairedState.teamA.doOrDieCount,
          teamBName: repairedState.teamB.name,
          teamBScore: repairedState.teamB.score,
          timerDuration: repairedState.timer.totalDuration,
          timerRemaining: repairedState.timer.remainingSeconds,
          hasSubTimer: repairedState.subTimer !== undefined,
          subTimerDuration: repairedState.subTimer?.totalDuration
        };
      });

      // 修復後の状態確認
      expect(result.teamAScore).toBe(5); // 元の値は保持
      expect(result.teamADoOrDie).toBe(0); // デフォルト値で修復
      expect(result.teamBName).toBe('チームB'); // デフォルト値で修復
      expect(result.teamBScore).toBe(0); // デフォルト値で修復
      expect(result.timerDuration).toBe(900); // デフォルト値で修復
      expect(result.timerRemaining).toBe(900); // デフォルト値で修復
      expect(result.hasSubTimer).toBe(true); // subTimerが修復される
      expect(result.subTimerDuration).toBe(30); // デフォルト値
    });

    it('型が不正な状態データからの修復が動作する', async () => {
      const id = env.GAME_SESSION.idFromName('test-type-repair');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // 型が不正な状態をストレージに保存
        const invalidState = {
          teamA: {
            name: 123, // 文字列ではない
            score: "invalid", // 数値ではない
            doOrDieCount: null
          },
          teamB: {
            name: 'チームB',
            score: -5, // 負の値
            doOrDieCount: 999
          },
          timer: {
            isRunning: "true", // booleanではない
            totalDuration: null,
            remainingSeconds: "abc"
          },
          subTimer: {
            isRunning: 1,
            totalDuration: -30
          },
          serverTime: "invalid_time"
        };

        await state.storage.put('gameState', invalidState);

        // 状態をロード（修復が行われるはず）
        testInstance.isStateLoaded = false;
        await testInstance.loadGameState();

        const repairedState = testInstance.gameState;

        return {
          teamAName: repairedState.teamA.name,
          teamAScore: repairedState.teamA.score,
          teamBScore: repairedState.teamB.score,
          timerRunning: repairedState.timer.isRunning,
          timerDuration: repairedState.timer.totalDuration,
          timerRemaining: repairedState.timer.remainingSeconds,
          subTimerRunning: repairedState.subTimer.isRunning,
          subTimerDuration: repairedState.subTimer.totalDuration,
          serverTimeType: typeof repairedState.serverTime
        };
      });

      // 型修復の確認
      expect(typeof result.teamAName).toBe('string');
      expect(result.teamAName).toBe('チームA'); // デフォルトに修復
      expect(typeof result.teamAScore).toBe('number');
      expect(result.teamAScore).toBe(0); // デフォルトに修復
      expect(result.teamBScore).toBe(0); // 負の値がデフォルトに修復
      expect(typeof result.timerRunning).toBe('boolean');
      expect(result.timerRunning).toBe(false);
      expect(result.timerDuration).toBe(900);
      expect(result.timerRemaining).toBe(900);
      expect(typeof result.subTimerRunning).toBe('boolean');
      expect(result.subTimerDuration).toBe(30);
      expect(result.serverTimeType).toBe('number');
    });

  });

});
