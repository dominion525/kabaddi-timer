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