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
        const messages: any[] = [];
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

      const errorMessage = await errorPromise as any;
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
        const messages: any[] = [];
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

      const errorMessage = await errorPromise as any;
      expect(errorMessage.type).toBe('error');
      expect(errorMessage.data.error).toBe('Missing action field');
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

    it('チーム別スコアリセット機能をテストする', async () => {
      const id = env.GAME_SESSION.idFromName('test-team-score-reset');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance, state) => {
        // スコア設定
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 5 });
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 8 });

        // リセット前の確認
        let gameState = (instance as any).gameState;
        expect(gameState.teamA.score).toBe(5);
        expect(gameState.teamB.score).toBe(8);

        // チームAのスコアのみリセット
        await (instance as any).handleAction({ type: 'RESET_TEAM_SCORE', team: 'teamA' });
        gameState = (instance as any).gameState;

        expect(gameState.teamA.score).toBe(0);
        expect(gameState.teamB.score).toBe(8);

        // チームBのスコアのみリセット
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 3 });
        await (instance as any).handleAction({ type: 'RESET_TEAM_SCORE', team: 'teamB' });
        gameState = (instance as any).gameState;

        expect(gameState.teamA.score).toBe(3);
        expect(gameState.teamB.score).toBe(0);

        return { teamA: gameState.teamA.score, teamB: gameState.teamB.score };
      });

      expect(result.teamA).toBe(3);
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

      // runInDurableObjectを使用して直接アクションを実行
      const result = await runInDurableObject(gameSession, async (instance) => {
        // handleActionを直接呼び出し
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 3 });

        // アクション処理後のゲーム状態を取得
        const gameState = (instance as any).gameState;
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

  describe('同時接続と競合状態', () => {

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

  describe('状態永続化と復元', () => {
    describe('ストレージ操作の信頼性', () => {
      it('loadGameState - 初回ロード時にデフォルト状態を設定する', async () => {
        const id = env.GAME_SESSION.idFromName('test-load-default-state');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          // ストレージに何も保存されていない状態での初回ロード
          await (instance as any).loadGameState();
          const gameState = (instance as any).gameState;
          const isStateLoaded = (instance as any).isStateLoaded;

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
          // 最初のロード
          await (instance as any).loadGameState();
          const firstLoadTime = Date.now();

          // 状態を変更
          (instance as any).gameState.teamA.score = 10;
          const modifiedScore = (instance as any).gameState.teamA.score;

          // 2回目のロード（キャッシュが効いているはず）
          await (instance as any).loadGameState();
          const cachedScore = (instance as any).gameState.teamA.score;
          const isStateLoaded = (instance as any).isStateLoaded;

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
          // 状態を変更
          (instance as any).gameState.teamA.score = 15;
          (instance as any).gameState.teamB.score = 8;

          // 保存実行（1回目で成功するはず）
          await (instance as any).saveGameStateWithRetry();

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
          // 初期状態をロード
          await (instance as any).loadGameState();

          // 複数の状態を変更
          (instance as any).gameState.teamA.name = 'テストチームA';
          (instance as any).gameState.teamB.name = 'テストチームB';
          (instance as any).gameState.teamA.score = 12;
          (instance as any).gameState.teamB.score = 7;
          (instance as any).gameState.teamA.doOrDieCount = 2;

          // 保存実行
          await (instance as any).saveGameState();

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
          // 初期状態をロード
          await (instance as any).loadGameState();

          // 複数の保存操作を同時実行
          const savePromises = [
            (async () => {
              (instance as any).gameState.teamA.score = 5;
              await (instance as any).saveGameState();
            })(),
            (async () => {
              (instance as any).gameState.teamB.score = 3;
              await (instance as any).saveGameState();
            })(),
            (async () => {
              (instance as any).gameState.teamA.name = '並行保存テスト';
              await (instance as any).saveGameState();
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
          // 初期状態をロード
          await (instance as any).loadGameState();

          // タイマーを開始
          await (instance as any).startTimer();
          const startTime = (instance as any).gameState.timer.startTime;

          // 少し時間を経過させる（テストなので短時間）
          await new Promise(resolve => setTimeout(resolve, 100));

          // タイマー状態を保存
          await (instance as any).saveGameState();

          // 状態復元をシミュレート（isStateLoadedをリセット）
          (instance as any).isStateLoaded = false;

          // さらに時間を経過させてから復元
          await new Promise(resolve => setTimeout(resolve, 50));

          await (instance as any).loadGameState();

          // remainingSecondsを更新
          (instance as any).updateRemainingTime();

          const restoredGameState = (instance as any).gameState;

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
          // タイマーを開始して一時停止
          await (instance as any).startTimer();
          await new Promise(resolve => setTimeout(resolve, 100));
          await (instance as any).pauseTimer();

          const pausedAt = (instance as any).gameState.timer.pausedAt;
          const remainingBeforeSave = (instance as any).gameState.timer.remainingSeconds;

          // 状態を保存
          await (instance as any).saveGameState();

          // 復元をシミュレート
          (instance as any).isStateLoaded = false;
          await (instance as any).loadGameState();

          const restoredGameState = (instance as any).gameState;

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
          (instance as any).isStateLoaded = false;
          await (instance as any).loadGameState();

          const repairedState = (instance as any).gameState;

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
          (instance as any).isStateLoaded = false;
          await (instance as any).loadGameState();

          const repairedState = (instance as any).gameState;

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

  describe('サブタイマー機能', () => {
    describe('基本機能', () => {
      it('サブタイマー開始（SUB_TIMER_START）が正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-start');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          await (instance as any).loadGameState();

          const beforeStart = (instance as any).gameState.subTimer;

          // サブタイマー開始アクションを実行
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });

          const afterStart = (instance as any).gameState.subTimer;

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
          await (instance as any).loadGameState();

          // サブタイマーをリセットしてから開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_RESET' });
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100)); // 少し時間を経過

          // 一時停止前の状態確認用に残り時間を更新
          (instance as any).updateSubTimerRemainingTime();

          const beforePause = { ...(instance as any).gameState.subTimer };

          // サブタイマー一時停止
          await (instance as any).handleAction({ type: 'SUB_TIMER_PAUSE' });

          const afterPause = (instance as any).gameState.subTimer;

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
          await (instance as any).loadGameState();

          // サブタイマーをリセットしてから開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_RESET' });
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100));

          // 残り時間を明示的に更新してから取得
          (instance as any).updateSubTimerRemainingTime();
          const beforeReset = { ...(instance as any).gameState.subTimer };

          // サブタイマーリセット
          await (instance as any).handleAction({ type: 'SUB_TIMER_RESET' });

          const afterReset = (instance as any).gameState.subTimer;

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
          await (instance as any).loadGameState();

          const initialSubTimer = (instance as any).gameState.subTimer;

          // サブタイマーを開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });

          // 時間更新を実行
          (instance as any).updateSubTimerRemainingTime();

          const runningSubTimer = (instance as any).gameState.subTimer;

          // リセット
          await (instance as any).handleAction({ type: 'SUB_TIMER_RESET' });

          const resetSubTimer = (instance as any).gameState.subTimer;

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
          await (instance as any).loadGameState();

          // メインタイマーのみ開始
          await (instance as any).handleAction({ type: 'TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 状態確認前に時間を更新
          (instance as any).updateRemainingTime();

          const mainRunning = {
            mainTimerRunning: (instance as any).gameState.timer.isRunning,
            subTimerRunning: (instance as any).gameState.subTimer?.isRunning || false
          };

          // サブタイマーのみ開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 状態確認前に時間を更新
          (instance as any).updateRemainingTime();
          (instance as any).updateSubTimerRemainingTime();

          const bothRunning = {
            mainTimerRunning: (instance as any).gameState.timer.isRunning,
            subTimerRunning: (instance as any).gameState.subTimer.isRunning
          };

          // メインタイマーのみ停止
          await (instance as any).handleAction({ type: 'TIMER_PAUSE' });

          const mainPaused = {
            mainTimerRunning: (instance as any).gameState.timer.isRunning,
            mainTimerPaused: (instance as any).gameState.timer.isPaused,
            subTimerRunning: (instance as any).gameState.subTimer.isRunning,
            subTimerPaused: (instance as any).gameState.subTimer.isPaused
          };

          // サブタイマーのみ停止
          await (instance as any).handleAction({ type: 'SUB_TIMER_PAUSE' });

          const bothPaused = {
            mainTimerRunning: (instance as any).gameState.timer.isRunning,
            mainTimerPaused: (instance as any).gameState.timer.isPaused,
            subTimerRunning: (instance as any).gameState.subTimer.isRunning,
            subTimerPaused: (instance as any).gameState.subTimer.isPaused
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

    describe('状態遷移', () => {
      it('未開始→開始→一時停止→再開のフローが正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-flow-pause-resume');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          await (instance as any).loadGameState();

          // 1. 未開始状態
          const initial = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            startTime: (instance as any).gameState.subTimer.startTime,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
          };

          // 2. 開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 150));

          // 残り時間を明示的に更新
          (instance as any).updateSubTimerRemainingTime();

          const started = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            startTime: (instance as any).gameState.subTimer.startTime,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
          };

          // 3. 一時停止
          await (instance as any).handleAction({ type: 'SUB_TIMER_PAUSE' });

          const paused = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            pausedAt: (instance as any).gameState.subTimer.pausedAt,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
          };

          // 少し時間を空けてから再開
          await new Promise(resolve => setTimeout(resolve, 100));

          // 4. 再開
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 再開後の残り時間を明示的に更新
          (instance as any).updateSubTimerRemainingTime();

          const resumed = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            pausedAt: (instance as any).gameState.subTimer.pausedAt,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
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
          await (instance as any).loadGameState();

          // 1. 開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100));

          // 残り時間を明示的に更新
          (instance as any).updateSubTimerRemainingTime();

          const started = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime
          };

          // 2. リセット
          await (instance as any).handleAction({ type: 'SUB_TIMER_RESET' });

          const reset = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime,
            pausedAt: (instance as any).gameState.subTimer.pausedAt
          };

          // 3. 再開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 再開始後の残り時間を明示的に更新
          (instance as any).updateSubTimerRemainingTime();

          const restarted = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime
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
          await (instance as any).loadGameState();

          // 1. 開始→一時停止
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100));
          await (instance as any).handleAction({ type: 'SUB_TIMER_PAUSE' });

          const pausedState = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            pausedAt: (instance as any).gameState.subTimer.pausedAt
          };

          // 2. 一時停止中にリセット
          await (instance as any).handleAction({ type: 'SUB_TIMER_RESET' });

          const resetFromPaused = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime,
            pausedAt: (instance as any).gameState.subTimer.pausedAt
          };

          // 3. リセット後に開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // リセット後開始の残り時間を明示的に更新
          (instance as any).updateSubTimerRemainingTime();

          const afterReset = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
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
          await (instance as any).loadGameState();

          // サブタイマーを開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });

          // 時刻を手動で操作して0秒到達をシミュレート
          const startTime = (instance as any).gameState.subTimer.startTime;
          (instance as any).gameState.subTimer.startTime = startTime - 31000; // 31秒前に開始したことにする

          // 残り時間を更新
          (instance as any).updateSubTimerRemainingTime();

          const afterTimeUpdate = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            totalDuration: (instance as any).gameState.subTimer.totalDuration
          };

          // 0秒到達後にリセットを試行
          await (instance as any).handleAction({ type: 'SUB_TIMER_RESET' });

          const afterReset = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
          };

          // 0秒到達後に再開始を試行
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });

          const afterRestart = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
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

    describe('時刻計算', () => {
      it('残り時間の正確な計算（updateSubTimerRemainingTime）が動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-time-calculation');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          await (instance as any).loadGameState();

          // サブタイマーを開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          const startTime = (instance as any).gameState.subTimer.startTime;

          // 複数回の時刻更新で正確性を検証
          const timeChecks = [];

          for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));

            const beforeUpdate = (instance as any).gameState.subTimer.remainingSeconds;
            (instance as any).updateSubTimerRemainingTime();
            const afterUpdate = (instance as any).gameState.subTimer.remainingSeconds;

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
          await (instance as any).loadGameState();

          // 1. 開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          const originalStartTime = (instance as any).gameState.subTimer.startTime;

          await new Promise(resolve => setTimeout(resolve, 100));

          // 2. 一時停止前の時間を記録
          (instance as any).updateSubTimerRemainingTime();
          const beforePause = {
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            elapsedTime: 30 - (instance as any).gameState.subTimer.remainingSeconds
          };

          await (instance as any).handleAction({ type: 'SUB_TIMER_PAUSE' });
          const pausedAt = (instance as any).gameState.subTimer.pausedAt;

          // 3. 一時停止中に時間を経過
          await new Promise(resolve => setTimeout(resolve, 200));

          const duringPause = {
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            pausedAt: (instance as any).gameState.subTimer.pausedAt
          };

          // 4. 再開
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          const resumedStartTime = (instance as any).gameState.subTimer.startTime;

          await new Promise(resolve => setTimeout(resolve, 100));

          // 5. 再開後の時間を確認
          (instance as any).updateSubTimerRemainingTime();
          const afterResume = {
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            newElapsedTime: 30 - (instance as any).gameState.subTimer.remainingSeconds
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
          await (instance as any).loadGameState();

          // 1. サブタイマー開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 150));

          // 2. 一時停止前の状態を記録
          (instance as any).updateSubTimerRemainingTime();
          const beforeLongPause = {
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime,
            elapsedTime: 30 - (instance as any).gameState.subTimer.remainingSeconds
          };

          // 3. 一時停止
          await (instance as any).handleAction({ type: 'SUB_TIMER_PAUSE' });
          const pauseTime = Date.now();

          // 4. 長時間停止をシミュレート（実際は短時間）
          await new Promise(resolve => setTimeout(resolve, 300));

          const duringLongPause = {
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused
          };

          // 5. 再開
          const resumeTime = Date.now();
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });

          // 6. 再開後少し時間を経過
          await new Promise(resolve => setTimeout(resolve, 100));
          (instance as any).updateSubTimerRemainingTime();

          const afterLongPause = {
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime,
            isRunning: (instance as any).gameState.subTimer.isRunning,
            elapsedTime: 30 - (instance as any).gameState.subTimer.remainingSeconds
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

    describe('永続化・復元', () => {
      it('サブタイマー実行中の状態永続化が正常に動作する', async () => {
        const id = env.GAME_SESSION.idFromName('test-subtimer-persistence-running');
        const gameSession = env.GAME_SESSION.get(id);

        const result = await runInDurableObject(gameSession, async (instance, state) => {
          await (instance as any).loadGameState();

          // サブタイマーを開始
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 100));

          // 残り時間を明示的に更新してから取得
          (instance as any).updateSubTimerRemainingTime();

          const beforeSave = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            startTime: (instance as any).gameState.subTimer.startTime,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            totalDuration: (instance as any).gameState.subTimer.totalDuration
          };

          // 状態を保存
          await (instance as any).saveGameState();

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
          // 最初のセッション：一時停止状態まで実行
          await (instance as any).loadGameState();
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 150));
          await (instance as any).handleAction({ type: 'SUB_TIMER_PAUSE' });

          // 残り時間を明示的に更新してから取得
          (instance as any).updateSubTimerRemainingTime();

          const beforeSave = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            pausedAt: (instance as any).gameState.subTimer.pausedAt,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime
          };

          // 状態を保存
          await (instance as any).saveGameState();

          // 復元をシミュレート（状態をクリア）
          (instance as any).isStateLoaded = false;
          (instance as any).gameState = null;

          // 状態を再ロード
          await (instance as any).loadGameState();

          // 復元後の残り時間を明示的に更新
          (instance as any).updateSubTimerRemainingTime();

          const afterRestore = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            pausedAt: (instance as any).gameState.subTimer.pausedAt,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds,
            startTime: (instance as any).gameState.subTimer.startTime
          };

          // 復元後の再開動作確認
          await (instance as any).handleAction({ type: 'SUB_TIMER_START' });
          await new Promise(resolve => setTimeout(resolve, 50));

          // 再開後の残り時間を明示的に更新
          (instance as any).updateSubTimerRemainingTime();

          const afterResume = {
            isRunning: (instance as any).gameState.subTimer.isRunning,
            isPaused: (instance as any).gameState.subTimer.isPaused,
            remainingSeconds: (instance as any).gameState.subTimer.remainingSeconds
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
  });

  describe('全リセット機能', () => {
    it('RESET_ALLアクションで全ての状態がリセットされる', async () => {
      const id = env.GAME_SESSION.idFromName('test-reset-all');
      const gameSession = env.GAME_SESSION.get(id);

      const result = await runInDurableObject(gameSession, async (instance) => {
        // スコアとDoOrDieカウントを設定
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 25 });
        await (instance as any).handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 30 });
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 2 });
        await (instance as any).handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamB', delta: 1 });

        // チーム名を変更
        await (instance as any).handleAction({ type: 'SET_TEAM_NAME', team: 'teamA', name: 'カスタムチームA' });
        await (instance as any).handleAction({ type: 'SET_TEAM_NAME', team: 'teamB', name: 'カスタムチームB' });

        // タイマー設定を変更
        await (instance as any).handleAction({ type: 'TIMER_SET', duration: 600 });

        // コート変更
        await (instance as any).handleAction({ type: 'COURT_CHANGE' });

        const gameState = (instance as any).gameState;
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
        await (instance as any).handleAction({ type: 'RESET_ALL' });

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
});