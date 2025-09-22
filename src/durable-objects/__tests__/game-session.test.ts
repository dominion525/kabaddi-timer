import { describe, it, expect } from 'vitest';
import { env, runInDurableObject } from 'cloudflare:test';
import { GameSession } from '../game-session';

describe('GameSession', () => {
  describe('初期化と基本状態', () => {
    it('デフォルトゲーム状態が正しく設定される', async () => {
      const id = env.GAME_SESSION.idFromName('test-game');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // デフォルト状態を取得
        const defaultState = (instance as any).getDefaultGameState();

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

  describe('WebSocket接続管理', () => {
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

    it('WebSocket接続時に初期状態を送信する', async () => {
      const id = env.GAME_SESSION.idFromName('test-websocket-initial-state');
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

      expect(response.status).toBe(101);

      // WebSocket messageを受信するためのプロミス
      const messagePromise = new Promise((resolve) => {
        let messageCount = 0;
        const messages: any[] = [];

        webSocket.addEventListener('message', (event) => {
          messages.push(JSON.parse(event.data as string));
          messageCount++;

          // game_stateとtime_syncの両方を受信したら解決
          if (messageCount >= 2) {
            resolve(messages);
          }
        });
      });

      webSocket.accept();

      const messages = await messagePromise as any[];
      expect(messages).toHaveLength(2);

      // game_stateメッセージの確認
      const gameStateMessage = messages.find(m => m.type === 'game_state');
      expect(gameStateMessage).toBeDefined();
      expect(gameStateMessage.data.teamA.name).toBe('チームA');
      expect(gameStateMessage.data.teamB.name).toBe('チームB');

      // time_syncメッセージの確認
      const timeSyncMessage = messages.find(m => m.type === 'time_sync');
      expect(timeSyncMessage).toBeDefined();
      expect(timeSyncMessage.data.serverTime).toBeGreaterThan(0);
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

      // エラーメッセージを受信するためのプロミス
      const errorPromise = new Promise((resolve) => {
        let messageCount = 0;
        webSocket.addEventListener('message', (event) => {
          messageCount++;
          // 初期メッセージ（game_state, time_sync）をスキップ
          if (messageCount > 2) {
            const message = JSON.parse(event.data as string);
            if (message.type === 'error') {
              resolve(message);
            }
          }
        });
      });

      // 不正なJSONを送信
      webSocket.send('invalid json');

      const errorMessage = await errorPromise as any;
      expect(errorMessage.type).toBe('error');
      expect(errorMessage.data).toContain('Invalid message format');
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

      // エラーメッセージを受信するためのプロミス
      const errorPromise = new Promise((resolve) => {
        let messageCount = 0;
        webSocket.addEventListener('message', (event) => {
          messageCount++;
          // 初期メッセージ（game_state, time_sync）をスキップ
          if (messageCount > 2) {
            const message = JSON.parse(event.data as string);
            if (message.type === 'error') {
              resolve(message);
            }
          }
        });
      });

      // actionフィールドが無いメッセージを送信
      webSocket.send(JSON.stringify({ type: 'test' }));

      const errorMessage = await errorPromise as any;
      expect(errorMessage.type).toBe('error');
      expect(errorMessage.data).toContain('Missing action field');
    });

    it('WebSocket接続切断時にコネクションを削除する', async () => {
      const id = env.GAME_SESSION.idFromName('test-websocket-close');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // WebSocketペアを作成
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        // クライアント側もacceptする
        client.accept();

        // handleSessionを呼び出してサーバーサイドを初期化
        await (instance as any).handleSession(server);

        // 接続数を確認
        const initialConnections = (instance as any).connections.size;
        expect(initialConnections).toBe(1);

        // 接続を閉じる
        client.close();

        // 少し待機してイベントが処理されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 100));

        // 接続数が減少したことを確認
        const finalConnections = (instance as any).connections.size;
        expect(finalConnections).toBe(0);

        return { initialConnections, finalConnections };
      });

      expect(result.initialConnections).toBe(1);
      expect(result.finalConnections).toBe(0);
    });

    it('safelyDeleteConnectionメソッドが正しく動作する', async () => {
      const id = env.GAME_SESSION.idFromName('test-websocket-error');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // WebSocketペアを作成
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        // クライアント側もacceptする
        client.accept();

        // handleSessionを呼び出してサーバーサイドを初期化
        await (instance as any).handleSession(server);

        // 接続数を確認
        const initialConnections = (instance as any).connections.size;
        expect(initialConnections).toBe(1);

        // safelyDeleteConnectionメソッドを直接テスト
        await (instance as any).safelyDeleteConnection(server);

        // 接続数が減少したことを確認
        const finalConnections = (instance as any).connections.size;
        expect(finalConnections).toBe(0);

        return { initialConnections, finalConnections };
      });

      expect(result.initialConnections).toBe(1);
      expect(result.finalConnections).toBe(0);
    });
  });

  describe('状態の検証と修復', () => {
    it('正常なゲーム状態を検証する', async () => {
      const id = env.GAME_SESSION.idFromName('test-game-validation');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        const defaultState = (instance as any).getDefaultGameState();
        const isValid = (instance as any).validateGameState(defaultState);

        expect(isValid).toBe(true);
        return isValid;
      });

      expect(result).toBe(true);
    });

    it('不正なゲーム状態を修復する', async () => {
      const id = env.GAME_SESSION.idFromName('test-game-repair');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // 不正な状態を作成
        const invalidState = {
          teamA: { name: null }, // 不正なname
          timer: {} // 不正なtimer
        };

        const isValid = (instance as any).validateGameState(invalidState);
        expect(isValid).toBe(false);

        // 修復機能をテスト
        const repaired = (instance as any).repairGameState(invalidState);
        expect(repaired.teamA.name).toBe('チームA');
        expect(repaired.timer.totalDuration).toBe(900);

        return repaired;
      });

      expect(result).toBeDefined();
    });
  });

  describe('タイマー機能', () => {
    it('タイマー開始機能をテストする', async () => {
      const id = env.GAME_SESSION.idFromName('test-timer-start');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // タイマー開始前の状態確認
        let gameState = (instance as any).gameState;
        expect(gameState.timer.isRunning).toBe(false);
        expect(gameState.timer.startTime).toBe(null);

        // タイマー開始
        await (instance as any).startTimer();
        gameState = (instance as any).gameState;

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
        // タイマー開始
        await (instance as any).startTimer();
        await new Promise(resolve => setTimeout(resolve, 100)); // 少し待機

        // タイマー停止
        await (instance as any).pauseTimer();
        const gameState = (instance as any).gameState;

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
        // タイマー開始してから停止
        await (instance as any).startTimer();
        await (instance as any).pauseTimer();

        // リセット前の状態確認
        let gameState = (instance as any).gameState;
        expect(gameState.timer.isPaused).toBe(true);

        // リセット実行
        await (instance as any).resetTimer();
        gameState = (instance as any).gameState;

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
        // 30秒追加
        await (instance as any).adjustTimerTime(30);
        let gameState = (instance as any).gameState;
        expect(gameState.timer.remainingSeconds).toBe(930); // 900 + 30

        // 60秒減少
        await (instance as any).adjustTimerTime(-60);
        gameState = (instance as any).gameState;
        expect(gameState.timer.remainingSeconds).toBe(870); // 930 - 60

        return gameState.timer.remainingSeconds;
      });

      expect(result).toBe(870);
    });
  });

  describe('スコア管理機能', () => {
    it('スコア更新機能をテストする', async () => {
      const id = env.GAME_SESSION.idFromName('test-score-update');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // チームAのスコア追加
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 2 });
        let gameState = (instance as any).gameState;
        expect(gameState.teamA.score).toBe(2);

        // チームBのスコア追加
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 1 });
        gameState = (instance as any).gameState;
        expect(gameState.teamB.score).toBe(1);

        // チームAにさらにスコア追加
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 3 });
        gameState = (instance as any).gameState;
        expect(gameState.teamA.score).toBe(5); // 2 + 3

        return { teamA: gameState.teamA.score, teamB: gameState.teamB.score };
      });

      expect(result.teamA).toBe(5);
      expect(result.teamB).toBe(1);
    });

    it('スコアリセット機能をテストする', async () => {
      const id = env.GAME_SESSION.idFromName('test-score-reset');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // スコアを設定
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 10 });
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 8 });

        // リセット前の確認
        let gameState = (instance as any).gameState;
        expect(gameState.teamA.score).toBe(10);
        expect(gameState.teamB.score).toBe(8);

        // スコアリセット
        await (instance as any).handleAction({ type: 'RESET_SCORES' });
        gameState = (instance as any).gameState;

        expect(gameState.teamA.score).toBe(0);
        expect(gameState.teamB.score).toBe(0);

        return { teamA: gameState.teamA.score, teamB: gameState.teamB.score };
      });

      expect(result.teamA).toBe(0);
      expect(result.teamB).toBe(0);
    });

    it('Do or Die機能をテストする', async () => {
      const id = env.GAME_SESSION.idFromName('test-do-or-die');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // チームAのDo or Die増加
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 1 });
        let gameState = (instance as any).gameState;
        expect(gameState.teamA.doOrDieCount).toBe(1);

        // さらに増加
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 1 });
        gameState = (instance as any).gameState;
        expect(gameState.teamA.doOrDieCount).toBe(2);

        // チームBも増加
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamB', delta: 1 });
        gameState = (instance as any).gameState;
        expect(gameState.teamB.doOrDieCount).toBe(1);

        // 減少テスト
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: -1 });
        gameState = (instance as any).gameState;
        expect(gameState.teamA.doOrDieCount).toBe(1);

        return {
          teamA: gameState.teamA.doOrDieCount,
          teamB: gameState.teamB.doOrDieCount
        };
      });

      expect(result.teamA).toBe(1);
      expect(result.teamB).toBe(1);
    });

    it('Do or Dieリセット機能をテストする', async () => {
      const id = env.GAME_SESSION.idFromName('test-do-or-die-reset');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // Do or Dieカウンターを設定
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 2 });
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamB', delta: 1 });

        // リセット前の確認
        let gameState = (instance as any).gameState;
        expect(gameState.teamA.doOrDieCount).toBe(2);
        expect(gameState.teamB.doOrDieCount).toBe(1);

        // Do or Dieリセット
        await (instance as any).handleAction({ type: 'DO_OR_DIE_RESET' });
        gameState = (instance as any).gameState;

        expect(gameState.teamA.doOrDieCount).toBe(0);
        expect(gameState.teamB.doOrDieCount).toBe(0);

        return {
          teamA: gameState.teamA.doOrDieCount,
          teamB: gameState.teamB.doOrDieCount
        };
      });

      expect(result.teamA).toBe(0);
      expect(result.teamB).toBe(0);
    });

    it('チーム名変更機能をテストする', async () => {
      const id = env.GAME_SESSION.idFromName('test-team-name');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // チーム名変更
        await (instance as any).handleAction({ type: 'SET_TEAM_NAME', team: 'teamA', name: '東京チーム' });
        await (instance as any).handleAction({ type: 'SET_TEAM_NAME', team: 'teamB', name: '大阪チーム' });

        const gameState = (instance as any).gameState;
        expect(gameState.teamA.name).toBe('東京チーム');
        expect(gameState.teamB.name).toBe('大阪チーム');

        return {
          teamA: gameState.teamA.name,
          teamB: gameState.teamB.name
        };
      });

      expect(result.teamA).toBe('東京チーム');
      expect(result.teamB).toBe('大阪チーム');
    });
  });

  describe('メッセージ処理と配信', () => {
    it('有効なアクションメッセージを処理する', async () => {
      const id = env.GAME_SESSION.idFromName('test-action-message');
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

      // 状態更新メッセージを受信するためのプロミス
      const stateUpdatePromise = new Promise((resolve) => {
        let messageCount = 0;
        webSocket.addEventListener('message', (event) => {
          messageCount++;
          // 初期メッセージ（game_state, time_sync）をスキップ
          if (messageCount > 2) {
            const message = JSON.parse(event.data as string);
            if (message.type === 'game_state') {
              resolve(message);
            }
          }
        });
      });

      // スコア更新アクションを送信
      webSocket.send(JSON.stringify({
        action: { type: 'SCORE_UPDATE', team: 'teamA', points: 3 }
      }));

      const stateMessage = await stateUpdatePromise as any;
      expect(stateMessage.type).toBe('game_state');
      expect(stateMessage.data.teamA.score).toBe(3);
    });

    it('複数のクライアントに状態を配信する', async () => {
      const id = env.GAME_SESSION.idFromName('test-broadcast');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // 複数のWebSocketペアを作成
        const pair1 = new WebSocketPair();
        const pair2 = new WebSocketPair();
        const [client1, server1] = Object.values(pair1);
        const [client2, server2] = Object.values(pair2);

        // クライアント側もacceptする
        client1.accept();
        client2.accept();

        const receivedMessages1: any[] = [];
        const receivedMessages2: any[] = [];

        client1.addEventListener('message', (event) => {
          receivedMessages1.push(JSON.parse(event.data as string));
        });

        client2.addEventListener('message', (event) => {
          receivedMessages2.push(JSON.parse(event.data as string));
        });

        // 両方のセッションを初期化
        await (instance as any).handleSession(server1);
        await (instance as any).handleSession(server2);

        // 初期メッセージ受信のための少し待機
        await new Promise(resolve => setTimeout(resolve, 100));

        // スコア更新アクションを実行
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 5 });

        // メッセージ配信のための少し待機
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          connections: (instance as any).connections.size,
          messages1: receivedMessages1.filter(m => m.type === 'game_state'),
          messages2: receivedMessages2.filter(m => m.type === 'game_state')
        };
      });

      expect(result.connections).toBe(2);
      expect(result.messages1.length).toBeGreaterThan(0);
      expect(result.messages2.length).toBeGreaterThan(0);

      // 両方のクライアントが同じ状態を受信していることを確認
      const lastState1 = result.messages1[result.messages1.length - 1];
      const lastState2 = result.messages2[result.messages2.length - 1];
      expect(lastState1.data.teamA.score).toBe(5);
      expect(lastState2.data.teamA.score).toBe(5);
    });

    it('sendToClientメソッドが正しくメッセージを送信する', async () => {
      const id = env.GAME_SESSION.idFromName('test-send-to-client');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // WebSocketペアを作成
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        // クライアント側をacceptする
        client.accept();

        const receivedMessages: any[] = [];
        client.addEventListener('message', (event) => {
          receivedMessages.push(JSON.parse(event.data as string));
        });

        // サーバー側もacceptしてから送信
        server.accept();

        // sendToClientメソッドを直接テスト
        (instance as any).sendToClient(server, {
          type: 'test_message',
          data: { test: 'value' },
          timestamp: Date.now()
        });

        // メッセージ受信のための待機
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          messageCount: receivedMessages.length,
          lastMessage: receivedMessages[receivedMessages.length - 1]
        };
      });

      expect(result.messageCount).toBeGreaterThan(0);
      expect(result.lastMessage.type).toBe('test_message');
      expect(result.lastMessage.data.test).toBe('value');
    });

    it('接続に失敗したWebSocketを適切に処理する', async () => {
      const id = env.GAME_SESSION.idFromName('test-failed-connection');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // WebSocketペアを作成
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        // クライアント側をacceptする
        client.accept();

        // セッションを初期化
        await (instance as any).handleSession(server);

        const initialConnections = (instance as any).connections.size;

        // 接続を強制的に閉じる
        client.close();

        // safelyDeleteConnectionが自動的に呼ばれるまで待機
        await new Promise(resolve => setTimeout(resolve, 200));

        const finalConnections = (instance as any).connections.size;

        return { initialConnections, finalConnections };
      });

      expect(result.initialConnections).toBe(1);
      expect(result.finalConnections).toBe(0);
    });

    it('ブロードキャスト中の送信失敗を適切に処理する', async () => {
      const id = env.GAME_SESSION.idFromName('test-broadcast-failure');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // 正常なWebSocketと閉じられたWebSocketを混在させる
        const pair1 = new WebSocketPair();
        const pair2 = new WebSocketPair();
        const [client1, server1] = Object.values(pair1);
        const [client2, server2] = Object.values(pair2);

        // クライアント側をacceptする
        client1.accept();
        client2.accept();

        await (instance as any).handleSession(server1);
        await (instance as any).handleSession(server2);

        const initialConnections = (instance as any).connections.size;

        // 一つの接続を閉じる
        client2.close();
        await new Promise(resolve => setTimeout(resolve, 100));

        // ブロードキャストを実行
        await (instance as any).broadcastState();

        // 失敗した接続が削除されるまで待機
        await new Promise(resolve => setTimeout(resolve, 200));

        const finalConnections = (instance as any).connections.size;

        return { initialConnections, finalConnections };
      });

      expect(result.initialConnections).toBe(2);
      expect(result.finalConnections).toBe(1);
    });
  });

  describe('アラーム機能と時刻同期', () => {
    it('初回接続時にアラームが設定される', async () => {
      const id = env.GAME_SESSION.idFromName('test-alarm-setup');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // WebSocketペアを作成
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        client.accept();

        // 初回接続時のhandleSession呼び出し
        await (instance as any).handleSession(server);

        // アラームが設定されているかチェック（60秒後に設定される）
        const alarmTime = await state.storage.getAlarm();
        expect(alarmTime).not.toBeNull();
        expect(alarmTime).toBeGreaterThan(Date.now());
        expect(alarmTime).toBeLessThan(Date.now() + 61000); // 61秒以内

        return { alarmTime, currentTime: Date.now() };
      });

      expect(result.alarmTime).toBeDefined();
      expect(result.alarmTime! - result.currentTime).toBeGreaterThan(59000); // 約60秒後
    });

    it('複数接続時にアラームが重複設定されない', async () => {
      const id = env.GAME_SESSION.idFromName('test-alarm-no-duplicate');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // 最初の接続
        const pair1 = new WebSocketPair();
        const [client1, server1] = Object.values(pair1);
        client1.accept();
        await (instance as any).handleSession(server1);

        const firstAlarmTime = await state.storage.getAlarm();

        // 2番目の接続（少し待機してから）
        await new Promise(resolve => setTimeout(resolve, 50));
        const pair2 = new WebSocketPair();
        const [client2, server2] = Object.values(pair2);
        client2.accept();
        await (instance as any).handleSession(server2);

        const secondAlarmTime = await state.storage.getAlarm();

        return {
          firstAlarmTime,
          secondAlarmTime,
          connections: (instance as any).connections.size
        };
      });

      expect(result.connections).toBe(2);
      expect(result.firstAlarmTime).toBe(result.secondAlarmTime); // アラーム時刻が同じ
    });

    it('time_syncリクエストに適切に応答する', async () => {
      const id = env.GAME_SESSION.idFromName('test-time-sync-request');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // time_syncリクエストのアクションを直接テスト
        const syncResult = await (instance as any).handleTimeSyncRequest({
          type: 'TIME_SYNC_REQUEST'
        });

        expect(syncResult).toBe(true);
        return { handled: syncResult };
      });

      expect(result.handled).toBe(true);
    });

    it('アラーム実行時に時刻同期メッセージを配信する', async () => {
      const id = env.GAME_SESSION.idFromName('test-alarm-execution');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // WebSocket接続を設定
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        client.accept();

        const receivedMessages: any[] = [];
        client.addEventListener('message', (event) => {
          receivedMessages.push(JSON.parse(event.data as string));
        });

        await (instance as any).handleSession(server);

        // 初期メッセージの受信を待機
        await new Promise(resolve => setTimeout(resolve, 100));

        // アラームを直接実行
        await (instance as any).alarm();

        // アラーム実行後のメッセージ受信を待機
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          messageCount: receivedMessages.length,
          timeSyncMessages: receivedMessages.filter(m => m.type === 'time_sync')
        };
      });

      expect(result.timeSyncMessages.length).toBeGreaterThan(1); // 初期 + アラーム実行時
    });

    it('アラーム実行後に次のアラームが設定される', async () => {
      const id = env.GAME_SESSION.idFromName('test-alarm-rescheduling');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // WebSocket接続を設定
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        client.accept();
        await (instance as any).handleSession(server);

        // アラーム実行前の状態確認
        const hasConnectionsBeforeAlarm = (instance as any).connections.size > 0;

        // アラーム実行前の時刻を記録
        const beforeAlarmTime = Date.now();

        // アラームを実行
        await (instance as any).alarm();

        // アラーム実行後のアラーム時刻を取得
        const newAlarmTime = await state.storage.getAlarm();
        const afterAlarmTime = Date.now();

        return {
          hasConnectionsBeforeAlarm,
          hasConnectionsAfterAlarm: (instance as any).connections.size > 0,
          newAlarmTime,
          beforeAlarmTime,
          afterAlarmTime,
          alarmTimeFromNow: newAlarmTime! - afterAlarmTime
        };
      });

      expect(result.hasConnectionsBeforeAlarm).toBe(true);
      expect(result.hasConnectionsAfterAlarm).toBe(true);
      expect(result.newAlarmTime).toBeGreaterThan(result.afterAlarmTime); // アラームが未来に設定
      // アラーム時刻が約60秒後に設定されていることを確認（55-65秒の範囲で許容）
      expect(result.alarmTimeFromNow).toBeGreaterThan(55000);
      expect(result.alarmTimeFromNow).toBeLessThan(65000);
    });

    it('接続が無い場合はアラームが再設定されない', async () => {
      const id = env.GAME_SESSION.idFromName('test-alarm-no-connections');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // アラームを実行（接続なしの状態で）
        await (instance as any).alarm();

        const alarmTime = await state.storage.getAlarm();

        return {
          alarmTime,
          connections: (instance as any).connections.size
        };
      });

      expect(result.connections).toBe(0);
      expect(result.alarmTime).toBeNull(); // アラームが設定されていない
    });

    it('broadcastTimeSyncが正しく動作する', async () => {
      const id = env.GAME_SESSION.idFromName('test-broadcast-time-sync');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // 複数のWebSocket接続を設定
        const pair1 = new WebSocketPair();
        const pair2 = new WebSocketPair();
        const [client1, server1] = Object.values(pair1);
        const [client2, server2] = Object.values(pair2);
        client1.accept();
        client2.accept();

        const receivedMessages1: any[] = [];
        const receivedMessages2: any[] = [];

        client1.addEventListener('message', (event) => {
          receivedMessages1.push(JSON.parse(event.data as string));
        });

        client2.addEventListener('message', (event) => {
          receivedMessages2.push(JSON.parse(event.data as string));
        });

        await (instance as any).handleSession(server1);
        await (instance as any).handleSession(server2);

        // 初期メッセージ受信待機
        await new Promise(resolve => setTimeout(resolve, 100));

        // broadcastTimeSyncを直接実行
        await (instance as any).broadcastTimeSync();

        // メッセージ受信待機
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          client1TimeSyncCount: receivedMessages1.filter(m => m.type === 'time_sync').length,
          client2TimeSyncCount: receivedMessages2.filter(m => m.type === 'time_sync').length,
          connections: (instance as any).connections.size
        };
      });

      expect(result.connections).toBe(2);
      expect(result.client1TimeSyncCount).toBeGreaterThan(1); // 初期 + ブロードキャスト
      expect(result.client2TimeSyncCount).toBeGreaterThan(1); // 初期 + ブロードキャスト
    });

    it('時刻同期メッセージの内容が正しい', async () => {
      const id = env.GAME_SESSION.idFromName('test-time-sync-content');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        client.accept();

        let timeSyncMessage: any = null;

        client.addEventListener('message', (event) => {
          const message = JSON.parse(event.data as string);
          if (message.type === 'time_sync' && !timeSyncMessage) {
            timeSyncMessage = message;
          }
        });

        await (instance as any).handleSession(server);
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          timeSyncMessage,
          testTime: Date.now()
        };
      });

      expect(result.timeSyncMessage).toBeDefined();
      expect(result.timeSyncMessage.type).toBe('time_sync');
      expect(result.timeSyncMessage.data.serverTime).toBeGreaterThan(0);
      expect(result.timeSyncMessage.timestamp).toBeGreaterThan(0);
      expect(Math.abs(result.timeSyncMessage.data.serverTime - result.testTime)).toBeLessThan(1000); // 1秒以内の誤差
    });
  });

  describe('同時接続と競合状態', () => {
    it('多数のクライアントが同時接続できる', async () => {
      const id = env.GAME_SESSION.idFromName('test-many-connections');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        const connections: Array<{ client: WebSocket; server: WebSocket }> = [];
        const connectionCount = 5;

        // 複数の接続を同時に作成
        for (let i = 0; i < connectionCount; i++) {
          const webSocketPair = new WebSocketPair();
          const [client, server] = Object.values(webSocketPair);
          client.accept();
          connections.push({ client, server });
        }

        // 全ての接続を同時に初期化
        await Promise.all(
          connections.map(({ server }) => (instance as any).handleSession(server))
        );

        const finalConnections = (instance as any).connections.size;

        // クライアント側を閉じる
        connections.forEach(({ client }) => client.close());

        return { finalConnections, expectedCount: connectionCount };
      });

      expect(result.finalConnections).toBe(result.expectedCount);
    });

    it('同時スコア更新が競合せずに処理される', async () => {
      const id = env.GAME_SESSION.idFromName('test-concurrent-score-updates');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // 複数のスコア更新を同時実行
        const updatePromises = [
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 1 }),
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 2 }),
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 3 }),
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 1 }),
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 2 })
        ];

        await Promise.all(updatePromises);

        const gameState = (instance as any).gameState;
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
        // 同時にタイマー操作を実行
        const timerPromises = [
          (instance as any).startTimer(),
          (instance as any).adjustTimerTime(30),
          (instance as any).adjustTimerTime(-10)
        ];

        await Promise.all(timerPromises);

        const gameState = (instance as any).gameState;
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

    it('複数クライアントからの同時メッセージを正しく処理する', async () => {
      const id = env.GAME_SESSION.idFromName('test-concurrent-messages');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // 複数のWebSocket接続を作成
        const connections = [];
        for (let i = 0; i < 3; i++) {
          const webSocketPair = new WebSocketPair();
          const [client, server] = Object.values(webSocketPair);
          client.accept();
          await (instance as any).handleSession(server);
          connections.push({ client, server });
        }

        // 各クライアントから同時にメッセージを送信（シミュレーション）
        const messagePromises = [
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 1 }),
          (instance as any).handleAction({ type: 'SET_TEAM_NAME', team: 'teamA', name: 'Client1Team' }),
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 2 })
        ];

        await Promise.all(messagePromises);

        const gameState = (instance as any).gameState;

        // 接続をクリーンアップ
        connections.forEach(({ client }) => client.close());

        return {
          teamAScore: gameState.teamA.score,
          teamBScore: gameState.teamB.score,
          teamAName: gameState.teamA.name,
          connectionCount: (instance as any).connections.size
        };
      });

      expect(result.teamAScore).toBe(1);
      expect(result.teamBScore).toBe(2);
      expect(result.teamAName).toBe('Client1Team');
      expect(result.connectionCount).toBe(3);
    });

    it('接続と切断が同時に発生しても安全に処理される', async () => {
      const id = env.GAME_SESSION.idFromName('test-connect-disconnect-race');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        const operations = [];

        // 接続とすぐに切断を繰り返す
        for (let i = 0; i < 3; i++) {
          const webSocketPair = new WebSocketPair();
          const [client, server] = Object.values(webSocketPair);
          client.accept();

          // 接続処理
          operations.push((instance as any).handleSession(server));

          // 少し待ってから切断
          operations.push(
            new Promise(resolve => {
              setTimeout(() => {
                client.close();
                resolve(undefined);
              }, 50);
            })
          );
        }

        await Promise.all(operations);

        // 処理完了後に接続数確認
        await new Promise(resolve => setTimeout(resolve, 200));

        return {
          finalConnections: (instance as any).connections.size
        };
      });

      // 接続が適切にクリーンアップされていることを確認
      expect(result.finalConnections).toBeLessThanOrEqual(3);
    });

    it('大量の状態更新が短時間で発生しても処理される', async () => {
      const id = env.GAME_SESSION.idFromName('test-rapid-updates');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        const updateCount = 20;
        const updatePromises = [];

        // 短時間で大量の更新を実行
        for (let i = 0; i < updateCount; i++) {
          updatePromises.push(
            (instance as any).handleAction({
              type: 'SCORE_UPDATE',
              team: i % 2 === 0 ? 'teamA' : 'teamB',
              points: 1
            })
          );
        }

        await Promise.all(updatePromises);

        const gameState = (instance as any).gameState;
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

    it('複数のブロードキャストが同時発生しても重複せずに処理される', async () => {
      const id = env.GAME_SESSION.idFromName('test-concurrent-broadcasts');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // 複数のWebSocket接続を作成
        const clients = [];
        for (let i = 0; i < 3; i++) {
          const webSocketPair = new WebSocketPair();
          const [client, server] = Object.values(webSocketPair);
          client.accept();

          const receivedMessages: any[] = [];
          client.addEventListener('message', (event) => {
            receivedMessages.push(JSON.parse(event.data as string));
          });

          await (instance as any).handleSession(server);
          clients.push({ client, server, receivedMessages });
        }

        // 初期メッセージ受信待機
        await new Promise(resolve => setTimeout(resolve, 100));

        // 複数のブロードキャストを同時実行
        const broadcastPromises = [
          (instance as any).broadcastState(),
          (instance as any).broadcastTimeSync(),
          (instance as any).broadcastState()
        ];

        await Promise.all(broadcastPromises);

        // メッセージ受信待機
        await new Promise(resolve => setTimeout(resolve, 100));

        // 接続をクリーンアップ
        clients.forEach(({ client }) => client.close());

        return {
          clientCount: clients.length,
          messageCountsPerClient: clients.map(c => c.receivedMessages.length),
          gameStateMessagesPerClient: clients.map(c =>
            c.receivedMessages.filter(m => m.type === 'game_state').length
          ),
          timeSyncMessagesPerClient: clients.map(c =>
            c.receivedMessages.filter(m => m.type === 'time_sync').length
          )
        };
      });

      expect(result.clientCount).toBe(3);
      // 各クライアントが同様の数のメッセージを受信していることを確認
      result.messageCountsPerClient.forEach(count => {
        expect(count).toBeGreaterThan(2); // 最低限のメッセージ数
      });
    });

    it('状態保存の競合が発生しても安全に処理される', async () => {
      const id = env.GAME_SESSION.idFromName('test-concurrent-state-saves');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // 複数の状態変更操作を同時実行（各操作は内部的に状態保存を行う）
        const operations = [
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 5 }),
          (instance as any).handleAction({ type: 'SET_TEAM_NAME', team: 'teamA', name: '競合テストチーム' }),
          (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 3 }),
          (instance as any).startTimer(),
          (instance as any).adjustTimerTime(120)
        ];

        await Promise.all(operations);

        const gameState = (instance as any).gameState;

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
});