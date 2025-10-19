import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - 基本機能', () => {
  describe('初期化と基本状態', () => {
    it('デフォルトゲーム状態が正しく設定される', async () => {
      const id = env.GAME_SESSION.idFromName('test-game');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // デフォルト状態を取得
        const testInstance = instance as unknown as GameSessionTestAccess;
        const defaultState = testInstance.getDefaultGameState();

        expect(defaultState.teamA.name).toBe('チームA');
        expect(defaultState.teamB.name).toBe('チームB');
        expect(defaultState.timer.totalDuration).toBe(900); // 15分
        expect(defaultState.timer.remainingSeconds).toBe(900);
        expect(defaultState.subTimer.totalDuration).toBe(30);

        return defaultState;
      });

      expect(result).toBeDefined();
    });

    it('新しいGameSessionインスタンスが初期化される', async () => {
      const id = env.GAME_SESSION.idFromName('unique-game-1');
      const gameSession = env.GAME_SESSION.get(id);
      expect(gameSession).toBeDefined();
    });
  });

  describe('状態の検証と修復', () => {
    it('正常なゲーム状態を検証する', async () => {
      const id = env.GAME_SESSION.idFromName('test-game-validation');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;
        const defaultState = testInstance.getDefaultGameState();
        const isValid = testInstance.validateGameState(defaultState);

        expect(isValid).toBe(true);
        return isValid;
      });

      expect(result).toBe(true);
    });

    it('不正なゲーム状態を修復する', async () => {
      const id = env.GAME_SESSION.idFromName('test-game-repair');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const testInstance = instance as unknown as GameSessionTestAccess;
        // 不正な状態を作成
        const invalidState = {
          teamA: { name: null }, // 不正なname
          timer: {} // 不正なtimer
        };

        const isValid = testInstance.validateGameState(invalidState);
        expect(isValid).toBe(false);

        // 修復機能をテスト
        const repaired = testInstance.repairGameState(invalidState);
        expect(repaired.teamA.name).toBe('チームA');
        expect(repaired.timer.totalDuration).toBe(900);

        return repaired;
      });

      expect(result).toBeDefined();
    });
  });

  describe('全リセット機能', () => {
    it('RESET_ALLアクションで全ての状態がリセットされる', async () => {
      const id = env.GAME_SESSION.idFromName('test-reset-all');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        // スコアとDoOrDieカウントを設定
        await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 25 });
        await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 30 });
        await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 2 });
        await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamB', delta: 1 });

        // チーム名を変更
        await testInstance.handleAction({ type: 'SET_TEAM_NAME', team: 'teamA', name: 'カスタムチームA' });
        await testInstance.handleAction({ type: 'SET_TEAM_NAME', team: 'teamB', name: 'カスタムチームB' });

        // タイマー設定を変更
        await testInstance.handleAction({ type: 'TIMER_SET', duration: 600 });

        // コート変更
        await testInstance.handleAction({ type: 'COURT_CHANGE' });

        const gameState = testInstance.gameState;
        const beforeReset = {
          teamAName: gameState.teamA.name,
          teamBName: gameState.teamB.name,
          teamAScore: gameState.teamA.score,
          teamBScore: gameState.teamB.score,
          teamADoOrDie: gameState.teamA.doOrDieCount,
          teamBDoOrDie: gameState.teamB.doOrDieCount,
          timerRemaining: gameState.timer.remainingSeconds,
          subTimerRemaining: gameState.subTimer.remainingSeconds,
          leftSideTeam: gameState.leftSideTeam,
        };

        // RESET_ALLを実行
        await testInstance.handleAction({ type: 'RESET_ALL' });

        const afterReset = {
          teamAName: gameState.teamA.name,
          teamBName: gameState.teamB.name,
          teamAScore: gameState.teamA.score,
          teamBScore: gameState.teamB.score,
          teamADoOrDie: gameState.teamA.doOrDieCount,
          teamBDoOrDie: gameState.teamB.doOrDieCount,
          timerRemaining: gameState.timer.remainingSeconds,
          timerTotalDuration: gameState.timer.totalDuration,
          subTimerRemaining: gameState.subTimer.remainingSeconds,
          subTimerTotalDuration: gameState.subTimer.totalDuration,
          leftSideTeam: gameState.leftSideTeam,
        };

        return { beforeReset, afterReset };
      });

      // リセット前は変更された値
      expect(result.beforeReset.teamAName).toBe('カスタムチームA');
      expect(result.beforeReset.teamBName).toBe('カスタムチームB');
      expect(result.beforeReset.teamAScore).toBe(25);
      expect(result.beforeReset.teamBScore).toBe(30);
      expect(result.beforeReset.teamADoOrDie).toBe(2);
      expect(result.beforeReset.teamBDoOrDie).toBe(1);
      expect(result.beforeReset.timerRemaining).toBe(600);
      expect(result.beforeReset.leftSideTeam).toBe('teamB');

      // リセット後はデフォルト値に戻る
      expect(result.afterReset.teamAName).toBe('チームA');
      expect(result.afterReset.teamBName).toBe('チームB');
      expect(result.afterReset.teamAScore).toBe(0);
      expect(result.afterReset.teamBScore).toBe(0);
      expect(result.afterReset.teamADoOrDie).toBe(0);
      expect(result.afterReset.teamBDoOrDie).toBe(0);
      expect(result.afterReset.timerRemaining).toBe(result.afterReset.timerTotalDuration);
      expect(result.afterReset.subTimerRemaining).toBe(result.afterReset.subTimerTotalDuration);
      expect(result.afterReset.leftSideTeam).toBe('teamA');
    });
  });

  describe('エラーハンドリング', () => {
    it('無効なパスを拒否する', async () => {
      const id = env.GAME_SESSION.idFromName('test-game-invalid-path');
      const gameSession = env.GAME_SESSION.get(id);

      const request = new Request('http://localhost/invalid-path');
      const response = await gameSession.fetch(request);

      expect(response.status).toBe(404);
      const text = await response.text();
      expect(text).toBe('Not found');
    });
  });

  describe('GET_GAME_STATE アクション', () => {
    it('リクエストしたクライアントにのみ応答する', async () => {
      const id = env.GAME_SESSION.idFromName('test-get-game-state');
      const gameSession = env.GAME_SESSION.get(id);

      // WebSocket接続を2つ作成
      const request1 = new Request('http://localhost/websocket', {
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
          'Sec-WebSocket-Key': 'test-key-1',
          'Sec-WebSocket-Version': '13'
        }
      });
      const response1 = await gameSession.fetch(request1);
      const ws1 = response1.webSocket!;
      ws1.accept();

      const request2 = new Request('http://localhost/websocket', {
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
          'Sec-WebSocket-Key': 'test-key-2',
          'Sec-WebSocket-Version': '13'
        }
      });
      const response2 = await gameSession.fetch(request2);
      const ws2 = response2.webSocket!;
      ws2.accept();

      // メッセージ受信を記録
      const ws1Messages: unknown[] = [];
      const ws2Messages: unknown[] = [];

      ws1.addEventListener('message', (event) => {
        ws1Messages.push(JSON.parse(event.data as string));
      });

      ws2.addEventListener('message', (event) => {
        ws2Messages.push(JSON.parse(event.data as string));
      });

      // 初期化メッセージを待つ（両方のWebSocketが受信）
      await new Promise(resolve => setTimeout(resolve, 100));

      // カウンタをリセット
      ws1Messages.length = 0;
      ws2Messages.length = 0;

      // ws1からGET_GAME_STATEをリクエスト
      ws1.send(JSON.stringify({
        action: { type: 'GET_GAME_STATE' }
      }));

      // メッセージ処理を待つ
      await new Promise(resolve => setTimeout(resolve, 100));

      // ws1にのみ応答が送信されることを確認
      expect(ws1Messages.length).toBe(1);
      expect(ws2Messages.length).toBe(0);

      // 応答内容の確認
      const message = ws1Messages[0];
      expect(message.type).toBe('game_state');
      expect(message.data).toBeDefined();
      expect(message.data.serverTime).toBeGreaterThan(0);
      expect(message.timestamp).toBeGreaterThan(0);
    });

    it('WebSocketがない場合はエラーを起こさない（テスト用）', async () => {
      const id = env.GAME_SESSION.idFromName('test-get-game-state-no-ws');
      const gameSession = env.GAME_SESSION.get(id);

      // WebSocketなしでhandleActionを直接呼び出し
      await runInDurableObject(gameSession, async (instance) => {
        const testInstance = instance as unknown as GameSessionTestAccess;

        await testInstance.handleAction({ type: 'GET_GAME_STATE' });
        // エラーが発生しないことを確認（正常に完了すればOK）
      });
    });
  });

});
