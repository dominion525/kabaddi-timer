import { describe, it, expect, env, runInDurableObject, type GameSessionTestAccess } from './test-helpers';

describe('GameSession - スコア管理機能', () => {
  it('スコア更新機能をテストする', async () => {
    const id = env.GAME_SESSION.idFromName('test-score-update');
    const gameSession = env.GAME_SESSION.get(id);

    const result = await runInDurableObject(gameSession, async (instance, state) => {
      const testInstance = instance as unknown as GameSessionTestAccess;

      // チームAのスコア追加
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 2 });
      let gameState = testInstance.gameState;
      expect(gameState.teamA.score).toBe(2);

      // チームBのスコア追加
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 1 });
      gameState = testInstance.gameState;
      expect(gameState.teamB.score).toBe(1);

      // チームAにさらにスコア追加
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 3 });
      gameState = testInstance.gameState;
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
      const testInstance = instance as unknown as GameSessionTestAccess;

      // スコアを設定
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 10 });
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 8 });

      // リセット前の確認
      let gameState = testInstance.gameState;
      expect(gameState.teamA.score).toBe(10);
      expect(gameState.teamB.score).toBe(8);

      // スコアリセット
      await testInstance.handleAction({ type: 'RESET_SCORES' });
      gameState = testInstance.gameState;

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
      const testInstance = instance as unknown as GameSessionTestAccess;

      // スコア設定
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 5 });
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamB', points: 8 });

      // リセット前の確認
      let gameState = testInstance.gameState;
      expect(gameState.teamA.score).toBe(5);
      expect(gameState.teamB.score).toBe(8);

      // チームAのスコアのみリセット
      await testInstance.handleAction({ type: 'RESET_TEAM_SCORE', team: 'teamA' });
      gameState = testInstance.gameState;

      expect(gameState.teamA.score).toBe(0);
      expect(gameState.teamB.score).toBe(8);

      // チームBのスコアのみリセット
      await testInstance.handleAction({ type: 'SCORE_UPDATE', team: 'teamA', points: 3 });
      await testInstance.handleAction({ type: 'RESET_TEAM_SCORE', team: 'teamB' });
      gameState = testInstance.gameState;

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
      const testInstance = instance as unknown as GameSessionTestAccess;

      // チームAのDo or Die増加
      await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 1 });
      let gameState = testInstance.gameState;
      expect(gameState.teamA.doOrDieCount).toBe(1);

      // さらに増加
      await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 1 });
      gameState = testInstance.gameState;
      expect(gameState.teamA.doOrDieCount).toBe(2);

      // チームBも増加
      await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamB', delta: 1 });
      gameState = testInstance.gameState;
      expect(gameState.teamB.doOrDieCount).toBe(1);

      // 減少テスト
      await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: -1 });
      gameState = testInstance.gameState;
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
      const testInstance = instance as unknown as GameSessionTestAccess;

      // Do or Dieカウンターを設定
      await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamA', delta: 2 });
      await testInstance.handleAction({ type: 'DO_OR_DIE_UPDATE', team: 'teamB', delta: 1 });

      // リセット前の確認
      let gameState = testInstance.gameState;
      expect(gameState.teamA.doOrDieCount).toBe(2);
      expect(gameState.teamB.doOrDieCount).toBe(1);

      // Do or Dieリセット
      await testInstance.handleAction({ type: 'DO_OR_DIE_RESET' });
      gameState = testInstance.gameState;

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
      const testInstance = instance as unknown as GameSessionTestAccess;

      // チーム名変更
      await testInstance.handleAction({ type: 'SET_TEAM_NAME', team: 'teamA', name: '東京チーム' });
      await testInstance.handleAction({ type: 'SET_TEAM_NAME', team: 'teamB', name: '大阪チーム' });

      const gameState = testInstance.gameState;
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
