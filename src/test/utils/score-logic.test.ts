import { describe, it, expect } from 'vitest';
import {
  generateDoOrDieIndicators,
  formatScore,
  isValidScore,
  isValidDoOrDieCount,
  isValidTeamName,
  clampScore,
  clampDoOrDieCount,
  SCORE_MIN,
  SCORE_MAX,
  DO_OR_DIE_MIN,
  DO_OR_DIE_MAX,
} from '../../utils/score-logic';

describe('ScoreLogic', () => {
  describe('generateDoOrDieIndicators', () => {
    it('count が 0 の場合、全て false の配列を返す', () => {
      const result = generateDoOrDieIndicators(0);
      expect(result).toEqual([false, false, false]);
    });

    it('count が 1 の場合、最初だけ true の配列を返す', () => {
      const result = generateDoOrDieIndicators(1);
      expect(result).toEqual([true, false, false]);
    });

    it('count が 2 の場合、最初の2つが true の配列を返す', () => {
      const result = generateDoOrDieIndicators(2);
      expect(result).toEqual([true, true, false]);
    });

    it('count が 3 の場合、全て true の配列を返す', () => {
      const result = generateDoOrDieIndicators(3);
      expect(result).toEqual([true, true, true]);
    });

    it('count が max を超える場合、全て true の配列を返す', () => {
      const result = generateDoOrDieIndicators(5);
      expect(result).toEqual([true, true, true]);
    });

    it('max パラメータを指定した場合、指定された長さの配列を返す', () => {
      const result = generateDoOrDieIndicators(2, 5);
      expect(result).toEqual([true, true, false, false, false]);
    });

    it('count が null の場合、全て false の配列を返す', () => {
      const result = generateDoOrDieIndicators(null as any);
      expect(result).toEqual([false, false, false]);
    });

    it('count が undefined の場合、全て false の配列を返す', () => {
      const result = generateDoOrDieIndicators(undefined as any);
      expect(result).toEqual([false, false, false]);
    });

    it('負の count の場合、全て false の配列を返す', () => {
      const result = generateDoOrDieIndicators(-1);
      expect(result).toEqual([false, false, false]);
    });
  });

  describe('formatScore', () => {
    it('正の整数を文字列に変換する', () => {
      expect(formatScore(42)).toBe('42');
    });

    it('0を文字列に変換する', () => {
      expect(formatScore(0)).toBe('0');
    });

    it('999を文字列に変換する', () => {
      expect(formatScore(999)).toBe('999');
    });

    it('null の場合、"0" を返す', () => {
      expect(formatScore(null as any)).toBe('0');
    });

    it('undefined の場合、"0" を返す', () => {
      expect(formatScore(undefined as any)).toBe('0');
    });

    it('負の数値も文字列に変換する', () => {
      expect(formatScore(-5)).toBe('-5');
    });

    it('小数点数も文字列に変換する', () => {
      expect(formatScore(3.14)).toBe('3.14');
    });
  });

  describe('isValidScore', () => {
    it('0は有効なスコア', () => {
      expect(isValidScore(0)).toBe(true);
    });

    it('正の整数は有効なスコア', () => {
      expect(isValidScore(42)).toBe(true);
    });

    it('999は有効なスコア（上限）', () => {
      expect(isValidScore(999)).toBe(true);
    });

    it('1000は無効なスコア（上限を超える）', () => {
      expect(isValidScore(1000)).toBe(false);
    });

    it('負の数は無効なスコア', () => {
      expect(isValidScore(-1)).toBe(false);
    });

    it('小数点数は無効なスコア', () => {
      expect(isValidScore(3.14)).toBe(false);
    });

    it('NaNは無効なスコア', () => {
      expect(isValidScore(NaN)).toBe(false);
    });

    it('Infinityは無効なスコア', () => {
      expect(isValidScore(Infinity)).toBe(false);
    });

    it('文字列は無効なスコア', () => {
      expect(isValidScore('42' as any)).toBe(false);
    });

    it('nullは無効なスコア', () => {
      expect(isValidScore(null as any)).toBe(false);
    });

    it('undefinedは無効なスコア', () => {
      expect(isValidScore(undefined as any)).toBe(false);
    });
  });

  describe('isValidDoOrDieCount', () => {
    it('0は有効なカウント', () => {
      expect(isValidDoOrDieCount(0)).toBe(true);
    });

    it('1は有効なカウント', () => {
      expect(isValidDoOrDieCount(1)).toBe(true);
    });

    it('2は有効なカウント', () => {
      expect(isValidDoOrDieCount(2)).toBe(true);
    });

    it('3は有効なカウント（上限）', () => {
      expect(isValidDoOrDieCount(3)).toBe(true);
    });

    it('4は無効なカウント（上限を超える）', () => {
      expect(isValidDoOrDieCount(4)).toBe(false);
    });

    it('負の数は無効なカウント', () => {
      expect(isValidDoOrDieCount(-1)).toBe(false);
    });

    it('小数点数は無効なカウント', () => {
      expect(isValidDoOrDieCount(1.5)).toBe(false);
    });

    it('NaNは無効なカウント', () => {
      expect(isValidDoOrDieCount(NaN)).toBe(false);
    });

    it('Infinityは無効なカウント', () => {
      expect(isValidDoOrDieCount(Infinity)).toBe(false);
    });

    it('文字列は無効なカウント', () => {
      expect(isValidDoOrDieCount('1' as any)).toBe(false);
    });

    it('nullは無効なカウント', () => {
      expect(isValidDoOrDieCount(null as any)).toBe(false);
    });

    it('undefinedは無効なカウント', () => {
      expect(isValidDoOrDieCount(undefined as any)).toBe(false);
    });
  });

  describe('clampScore', () => {
    it('範囲内の値はそのまま返す', () => {
      expect(clampScore(0)).toBe(0);
      expect(clampScore(500)).toBe(500);
      expect(clampScore(999)).toBe(999);
    });

    it('最小値未満は0にクランプ', () => {
      expect(clampScore(-1)).toBe(0);
      expect(clampScore(-100)).toBe(0);
    });

    it('最大値超過は999にクランプ', () => {
      expect(clampScore(1000)).toBe(999);
      expect(clampScore(9999)).toBe(999);
    });

    it('境界値が正しく処理される', () => {
      expect(clampScore(SCORE_MIN)).toBe(SCORE_MIN);
      expect(clampScore(SCORE_MAX)).toBe(SCORE_MAX);
    });
  });

  describe('clampDoOrDieCount', () => {
    it('範囲内の値はそのまま返す', () => {
      expect(clampDoOrDieCount(0)).toBe(0);
      expect(clampDoOrDieCount(1)).toBe(1);
      expect(clampDoOrDieCount(2)).toBe(2);
      expect(clampDoOrDieCount(3)).toBe(3);
    });

    it('最小値未満は0にクランプ', () => {
      expect(clampDoOrDieCount(-1)).toBe(0);
      expect(clampDoOrDieCount(-5)).toBe(0);
    });

    it('最大値超過は3にクランプ', () => {
      expect(clampDoOrDieCount(4)).toBe(3);
      expect(clampDoOrDieCount(10)).toBe(3);
    });

    it('境界値が正しく処理される', () => {
      expect(clampDoOrDieCount(DO_OR_DIE_MIN)).toBe(DO_OR_DIE_MIN);
      expect(clampDoOrDieCount(DO_OR_DIE_MAX)).toBe(DO_OR_DIE_MAX);
    });
  });

  describe('定数', () => {
    it('SCORE定数が正しい値', () => {
      expect(SCORE_MIN).toBe(0);
      expect(SCORE_MAX).toBe(999);
    });

    it('DO_OR_DIE定数が正しい値', () => {
      expect(DO_OR_DIE_MIN).toBe(0);
      expect(DO_OR_DIE_MAX).toBe(3);
    });
  });

  describe('isValidTeamName', () => {
    it('通常の文字列は有効なチーム名', () => {
      expect(isValidTeamName('チームA')).toBe(true);
    });

    it('英数字は有効なチーム名', () => {
      expect(isValidTeamName('Team1')).toBe(true);
    });

    it('1文字のチーム名は有効', () => {
      expect(isValidTeamName('A')).toBe(true);
    });

    it('20文字のチーム名は有効（上限）', () => {
      const longName = 'A'.repeat(20);
      expect(isValidTeamName(longName)).toBe(true);
    });

    it('21文字のチーム名は無効（上限を超える）', () => {
      const tooLongName = 'A'.repeat(21);
      expect(isValidTeamName(tooLongName)).toBe(false);
    });

    it('空文字列は無効なチーム名', () => {
      expect(isValidTeamName('')).toBe(false);
    });

    it('空白のみの文字列は無効なチーム名', () => {
      expect(isValidTeamName('   ')).toBe(false);
    });

    it('前後に空白がある場合、トリムした結果で判定する', () => {
      expect(isValidTeamName('  チームA  ')).toBe(true);
    });

    it('トリムした結果が空になる場合は無効', () => {
      expect(isValidTeamName('     ')).toBe(false);
    });

    it('トリムした結果が20文字を超える場合は無効', () => {
      const longNameWithSpaces = '  ' + 'A'.repeat(19) + '  ';
      expect(isValidTeamName(longNameWithSpaces)).toBe(true);
    });

    it('トリムした結果が21文字以上の場合は無効', () => {
      const tooLongNameWithSpaces = '  ' + 'A'.repeat(21) + '  ';
      expect(isValidTeamName(tooLongNameWithSpaces)).toBe(false);
    });

    it('数値は無効なチーム名', () => {
      expect(isValidTeamName(123 as any)).toBe(false);
    });

    it('nullは無効なチーム名', () => {
      expect(isValidTeamName(null as any)).toBe(false);
    });

    it('undefinedは無効なチーム名', () => {
      expect(isValidTeamName(undefined as any)).toBe(false);
    });

    it('オブジェクトは無効なチーム名', () => {
      expect(isValidTeamName({} as any)).toBe(false);
    });

    it('配列は無効なチーム名', () => {
      expect(isValidTeamName([] as any)).toBe(false);
    });

    it('特殊文字を含むチーム名も有効', () => {
      expect(isValidTeamName('チーム★☆')).toBe(true);
    });

    it('改行文字を含むチーム名（トリム後も有効な長さ）', () => {
      expect(isValidTeamName('チーム\nA')).toBe(true);
    });
  });
});