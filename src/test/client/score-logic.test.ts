import { describe, it, expect, beforeEach } from 'vitest';

// グローバル window オブジェクトをモック
const globalWindow = global as any;

// score-logic.ts を読み込み
import '../../client/components/score-logic';

describe('ScoreLogic', () => {
  let ScoreLogic: any;

  beforeEach(() => {
    // window.ScoreLogic からテスト対象を取得
    ScoreLogic = globalWindow.ScoreLogic;
  });

  describe('generateDoOrDieIndicators', () => {
    it('count が 0 の場合、全て false の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(0);
      expect(result).toEqual([false, false, false]);
    });

    it('count が 1 の場合、最初だけ true の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(1);
      expect(result).toEqual([true, false, false]);
    });

    it('count が 2 の場合、最初の2つが true の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(2);
      expect(result).toEqual([true, true, false]);
    });

    it('count が 3 の場合、全て true の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(3);
      expect(result).toEqual([true, true, true]);
    });

    it('count が max を超える場合、全て true の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(5);
      expect(result).toEqual([true, true, true]);
    });

    it('max パラメータを指定した場合、指定された長さの配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(2, 5);
      expect(result).toEqual([true, true, false, false, false]);
    });

    it('count が null の場合、全て false の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(null as any);
      expect(result).toEqual([false, false, false]);
    });

    it('count が undefined の場合、全て false の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(undefined as any);
      expect(result).toEqual([false, false, false]);
    });

    it('負の count の場合、全て false の配列を返す', () => {
      const result = ScoreLogic.generateDoOrDieIndicators(-1);
      expect(result).toEqual([false, false, false]);
    });
  });

  describe('formatScore', () => {
    it('正の整数を文字列に変換する', () => {
      expect(ScoreLogic.formatScore(42)).toBe('42');
    });

    it('0を文字列に変換する', () => {
      expect(ScoreLogic.formatScore(0)).toBe('0');
    });

    it('999を文字列に変換する', () => {
      expect(ScoreLogic.formatScore(999)).toBe('999');
    });

    it('null の場合、"0" を返す', () => {
      expect(ScoreLogic.formatScore(null)).toBe('0');
    });

    it('undefined の場合、"0" を返す', () => {
      expect(ScoreLogic.formatScore(undefined)).toBe('0');
    });

    it('負の数値も文字列に変換する', () => {
      expect(ScoreLogic.formatScore(-5)).toBe('-5');
    });

    it('小数点数も文字列に変換する', () => {
      expect(ScoreLogic.formatScore(3.14)).toBe('3.14');
    });
  });

  describe('isValidScore', () => {
    it('0は有効なスコア', () => {
      expect(ScoreLogic.isValidScore(0)).toBe(true);
    });

    it('正の整数は有効なスコア', () => {
      expect(ScoreLogic.isValidScore(42)).toBe(true);
    });

    it('999は有効なスコア（上限）', () => {
      expect(ScoreLogic.isValidScore(999)).toBe(true);
    });

    it('1000は無効なスコア（上限を超える）', () => {
      expect(ScoreLogic.isValidScore(1000)).toBe(false);
    });

    it('負の数は無効なスコア', () => {
      expect(ScoreLogic.isValidScore(-1)).toBe(false);
    });

    it('小数点数は無効なスコア', () => {
      expect(ScoreLogic.isValidScore(3.14)).toBe(false);
    });

    it('NaNは無効なスコア', () => {
      expect(ScoreLogic.isValidScore(NaN)).toBe(false);
    });

    it('Infinityは無効なスコア', () => {
      expect(ScoreLogic.isValidScore(Infinity)).toBe(false);
    });

    it('文字列は無効なスコア', () => {
      expect(ScoreLogic.isValidScore('42' as any)).toBe(false);
    });

    it('nullは無効なスコア', () => {
      expect(ScoreLogic.isValidScore(null as any)).toBe(false);
    });

    it('undefinedは無効なスコア', () => {
      expect(ScoreLogic.isValidScore(undefined as any)).toBe(false);
    });
  });

  describe('isValidDoOrDieCount', () => {
    it('0は有効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(0)).toBe(true);
    });

    it('1は有効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(1)).toBe(true);
    });

    it('2は有効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(2)).toBe(true);
    });

    it('3は有効なカウント（上限）', () => {
      expect(ScoreLogic.isValidDoOrDieCount(3)).toBe(true);
    });

    it('4は無効なカウント（上限を超える）', () => {
      expect(ScoreLogic.isValidDoOrDieCount(4)).toBe(false);
    });

    it('負の数は無効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(-1)).toBe(false);
    });

    it('小数点数は無効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(1.5)).toBe(false);
    });

    it('NaNは無効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(NaN)).toBe(false);
    });

    it('Infinityは無効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(Infinity)).toBe(false);
    });

    it('文字列は無効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount('1' as any)).toBe(false);
    });

    it('nullは無効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(null as any)).toBe(false);
    });

    it('undefinedは無効なカウント', () => {
      expect(ScoreLogic.isValidDoOrDieCount(undefined as any)).toBe(false);
    });
  });

  describe('isValidTeamName', () => {
    it('通常の文字列は有効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName('チームA')).toBe(true);
    });

    it('英数字は有効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName('Team1')).toBe(true);
    });

    it('1文字のチーム名は有効', () => {
      expect(ScoreLogic.isValidTeamName('A')).toBe(true);
    });

    it('20文字のチーム名は有効（上限）', () => {
      const longName = 'A'.repeat(20);
      expect(ScoreLogic.isValidTeamName(longName)).toBe(true);
    });

    it('21文字のチーム名は無効（上限を超える）', () => {
      const tooLongName = 'A'.repeat(21);
      expect(ScoreLogic.isValidTeamName(tooLongName)).toBe(false);
    });

    it('空文字列は無効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName('')).toBe(false);
    });

    it('空白のみの文字列は無効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName('   ')).toBe(false);
    });

    it('前後に空白がある場合、トリムした結果で判定する', () => {
      expect(ScoreLogic.isValidTeamName('  チームA  ')).toBe(true);
    });

    it('トリムした結果が空になる場合は無効', () => {
      expect(ScoreLogic.isValidTeamName('     ')).toBe(false);
    });

    it('トリムした結果が20文字を超える場合は無効', () => {
      const longNameWithSpaces = '  ' + 'A'.repeat(19) + '  ';
      expect(ScoreLogic.isValidTeamName(longNameWithSpaces)).toBe(true);
    });

    it('トリムした結果が21文字以上の場合は無効', () => {
      const tooLongNameWithSpaces = '  ' + 'A'.repeat(21) + '  ';
      expect(ScoreLogic.isValidTeamName(tooLongNameWithSpaces)).toBe(false);
    });

    it('数値は無効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName(123 as any)).toBe(false);
    });

    it('nullは無効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName(null as any)).toBe(false);
    });

    it('undefinedは無効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName(undefined as any)).toBe(false);
    });

    it('オブジェクトは無効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName({} as any)).toBe(false);
    });

    it('配列は無効なチーム名', () => {
      expect(ScoreLogic.isValidTeamName([] as any)).toBe(false);
    });

    it('特殊文字を含むチーム名も有効', () => {
      expect(ScoreLogic.isValidTeamName('チーム★☆')).toBe(true);
    });

    it('改行文字を含むチーム名（トリム後も有効な長さ）', () => {
      expect(ScoreLogic.isValidTeamName('チーム\nA')).toBe(true);
    });
  });
});