import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - WebSocket接続管理', () => {
  it('WebSocket接続リクエストを正しく処理する', async () => {
    const id = env.GAME_SESSION.idFromName('test-game-websocket');
    const gameSession = env.GAME_SESSION.get(id);

    const request = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key',
        'Sec-WebSocket-Version': '13'
      }
    });

    const response = await gameSession.fetch(request);
    expect(response.status).toBe(101);
    expect(response.webSocket).toBeDefined();
  });

  it('非WebSocketリクエストを拒否する', async () => {
    const id = env.GAME_SESSION.idFromName('test-game-non-ws');
    const gameSession = env.GAME_SESSION.get(id);

    const request = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'not-websocket'
      }
    });

    const response = await gameSession.fetch(request);
    expect(response.status).toBe(426);

    const text = await response.text();
    expect(text).toBe('Expected Upgrade: websocket');
  });

  it('Upgradeヘッダーが無いリクエストを拒否する', async () => {
    const id = env.GAME_SESSION.idFromName('test-game-no-upgrade');
    const gameSession = env.GAME_SESSION.get(id);

    const request = new Request('http://localhost/websocket');
    const response = await gameSession.fetch(request);

    expect(response.status).toBe(426);
  });


  it('不正なメッセージフォーマットを処理する', async () => {
    const id = env.GAME_SESSION.idFromName('test-invalid-message');
    const gameSession = env.GAME_SESSION.get(id);

    const request = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key',
        'Sec-WebSocket-Version': '13'
      }
    });

    const response = await gameSession.fetch(request);
    const webSocket = response.webSocket!;
    webSocket.accept();

    // エラーメッセージを受信するためのプロミス（タイムアウト付き）
    const errorPromise = new Promise((resolve, reject) => {
      const messages: unknown[] = [];
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for error message')), 1000);

      webSocket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data as string);
        messages.push(message);

        // errorメッセージが来たら即座にresolve
        if (message.type === 'error') {
          clearTimeout(timeout);
          resolve(message);
        }
      });
    });

    // 不正なJSONを送信
    webSocket.send('invalid json');

    const errorMessage = await errorPromise as unknown as { type: string; data: { error: string } };
    expect(errorMessage.type).toBe('error');
    expect(errorMessage.data.error).toBeDefined();
    // JSONパースエラーなので、エラーメッセージに "Unexpected" または "JSON" が含まれることを確認
    expect(errorMessage.data.error).toMatch(/Unexpected|JSON|valid/i);
  });

  it('actionフィールドが無いメッセージを処理する', async () => {
    const id = env.GAME_SESSION.idFromName('test-no-action-message');
    const gameSession = env.GAME_SESSION.get(id);

    const request = new Request('http://localhost/websocket', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': 'test-key',
        'Sec-WebSocket-Version': '13'
      }
    });

    const response = await gameSession.fetch(request);
    const webSocket = response.webSocket!;
    webSocket.accept();

    // エラーメッセージを受信するためのプロミス（タイムアウト付き）
    const errorPromise = new Promise((resolve, reject) => {
      const messages: unknown[] = [];
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for error message')), 1000);

      webSocket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data as string);
        messages.push(message);

        // errorメッセージが来たら即座にresolve
        if (message.type === 'error') {
          clearTimeout(timeout);
          resolve(message);
        }
      });
    });

    // actionフィールドが無いメッセージを送信
    webSocket.send(JSON.stringify({ type: 'test' }));

    const errorMessage = await errorPromise as unknown as { type: string; data: { error: string } };
    expect(errorMessage.type).toBe('error');
    expect(errorMessage.data.error).toBe('Missing action field');
  });

});

describe('GameSession - メッセージ処理と配信', () => {
  it('有効なアクションメッセージを処理する', async () => {
    const id = env.GAME_SESSION.idFromName('test-action-message');
    const gameSession = env.GAME_SESSION.get(id);

    // runInDurableObjectを使用して直接アクションを実行
    const result = await runInDurableObject(gameSession, async (instance) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // handleActionを直接呼び出し
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 3 });

      // アクション処理後のゲーム状態を取得
      const gameState = testInstance.gameState;
      return {
        teamAScore: gameState.teamA.score,
        teamBScore: gameState.teamB.score
      };
    });

    // スコアが正しく更新されていることを確認
    expect(result.teamAScore).toBe(3);
    expect(result.teamBScore).toBe(0);
  });



});

describe('GameSession - 同時接続と競合状態', () => {

  it('同時スコア更新が競合せずに処理される', async () => {
    const id = env.GAME_SESSION.idFromName('test-concurrent-score-updates');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // 複数のスコア更新を同時実行
      const updatePromises = [
        testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 1 }),
        testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 2 }),
        testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 3 }),
        testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 1 }),
        testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 2 })
      ];

      await Promise.all(updatePromises);

      const gameState = testInstance.gameState;
      return {
        teamAScore: gameState.teamA.score,
        teamBScore: gameState.teamB.score
      };
    });

    // 期待されるスコア: チームA = 1+2+1 = 4, チームB = 3+2 = 5
    expect(result.teamAScore).toBe(4);
    expect(result.teamBScore).toBe(5);
  });

  it('同時タイマー操作が適切に処理される', async () => {
    const id = env.GAME_SESSION.idFromName('test-concurrent-timer-ops');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // 同時にタイマー操作を実行
      const timerPromises = [
        testInstance.startTimer(),
        testInstance.adjustTimerTime(30),
        testInstance.adjustTimerTime(-10)
      ];

      await Promise.all(timerPromises);

      const gameState = testInstance.gameState;
      return {
        isRunning: gameState.timer.isRunning,
        remainingSeconds: gameState.timer.remainingSeconds,
        hasStartTime: gameState.timer.startTime !== null
      };
    });

    expect(result.isRunning).toBe(true);
    expect(result.hasStartTime).toBe(true);
    // 調整時間の結果: 900 + 30 - 10 = 920（浮動小数点誤差を考慮）
    expect(result.remainingSeconds).toBeGreaterThan(919);
    expect(result.remainingSeconds).toBeLessThanOrEqual(920);
  });



  it('大量の状態更新が短時間で発生しても処理される', async () => {
    const id = env.GAME_SESSION.idFromName('test-rapid-updates');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance) => {
      const testInstance = instance as unknown as GameSessionTestAccess;
      const updateCount = 20;
      const updatePromises = [];

      // 短時間で大量の更新を実行
      for (let i = 0; i < updateCount; i++) {
        updatePromises.push(
          testInstance.handleAction({
            type: 'SCORE_UPDATE',
            team: i % 2 === 0 ? 'teamA' : 'teamB',
            points: 1
          })
        );
      }

      await Promise.all(updatePromises);

      const gameState = testInstance.gameState;
      const totalScore = gameState.teamA.score + gameState.teamB.score;

      return {
        teamAScore: gameState.teamA.score,
        teamBScore: gameState.teamB.score,
        totalScore,
        expectedTotal: updateCount
      };
    });

    expect(result.totalScore).toBe(result.expectedTotal);
    expect(result.teamAScore).toBe(10); // 偶数インデックス（0,2,4...）
    expect(result.teamBScore).toBe(10); // 奇数インデックス（1,3,5...）
  });


  it('状態保存の競合が発生しても安全に処理される', async () => {
    const id = env.GAME_SESSION.idFromName('test-concurrent-state-saves');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // 複数の状態変更操作を同時実行（各操作は内部的に状態保存を行う）
      const operations = [
        testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 5 }),
        testInstance.handleAction({ type: 'SET_TEAM_NAME', team: 'teamA', name: '競合テストチーム' }),
        testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 3 }),
        testInstance.startTimer(),
        testInstance.adjustTimerTime(120)
      ];

      await Promise.all(operations);

      const gameState = testInstance.gameState;

      return {
        teamAScore: gameState.teamA.score,
        teamBScore: gameState.teamB.score,
        teamAName: gameState.teamA.name,
        timerRunning: gameState.timer.isRunning,
        remainingSeconds: gameState.timer.remainingSeconds
      };
    });

    expect(result.teamAScore).toBe(5);
    expect(result.teamBScore).toBe(3);
    expect(result.teamAName).toBe('競合テストチーム');
    expect(result.timerRunning).toBe(true);
    // 浮動小数点誤差を考慮して範囲チェック: 900 + 120 = 1020前後
    expect(result.remainingSeconds).toBeGreaterThan(1019);
    expect(result.remainingSeconds).toBeLessThanOrEqual(1020);
  });
});
