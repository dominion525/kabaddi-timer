import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateRemainingSeconds,
  calculateSubTimerRemainingSeconds,
  formatTimer,
  formatSubTimer,
} from '../../utils/timer-logic-client';

describe('timer-logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateRemainingSeconds', () => {
    it('timer が null の場合、0秒と停止状態を返す', () => {
      const result = calculateRemainingSeconds(null, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('timer が undefined の場合、0秒と停止状態を返す', () => {
      const result = calculateRemainingSeconds(undefined, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('タイマーが停止中の場合、remainingSeconds をMath.ceilで切り上げて返す', () => {
      const timer = {
        isRunning: false,
        remainingSeconds: 300.5,
        totalDuration: 900,
        startTime: null,
      };

      const result = calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 301, isRunning: false });
    });

    it('タイマーが動作中の場合、経過時間を計算して残り秒数を返す', () => {
      // 現在時刻を固定
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const timer = {
        isRunning: true,
        remainingSeconds: 900,
        totalDuration: 900, // 15分
        startTime: mockNow - 300000, // 5分前に開始
      };

      // サーバー時刻オフセット 0
      const result = calculateRemainingSeconds(timer, 0);

      // 900秒 - 300秒 = 600秒が残り
      expect(result).toEqual({ seconds: 600, isRunning: true });
    });

    it('タイマーが0になった場合、0秒と停止状態を返す', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const timer = {
        isRunning: true,
        remainingSeconds: 300,
        totalDuration: 300, // 5分
        startTime: mockNow - 300000, // 5分前に開始（時間切れ）
      };

      const result = calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('相対時間アプローチで経過時間を計算する（serverTimeOffsetは無視）', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const timer = {
        isRunning: true,
        remainingSeconds: 900,
        totalDuration: 900,
        startTime: mockNow - 100000, // 100秒前に開始
      };

      // serverTimeOffsetは相対時間アプローチでは無視される
      const serverTimeOffset = -50000;
      const result = calculateRemainingSeconds(timer, serverTimeOffset);

      // 相対時間アプローチ：クライアント時刻ベースで100秒経過
      // 残り時間: 900 - 100 = 800秒
      expect(result).toEqual({ seconds: 800, isRunning: true });
    });

    it('startTime がないが isRunning が true の場合、remainingSeconds をMath.ceilで切り上げて返す', () => {
      const timer = {
        isRunning: true,
        remainingSeconds: 600.7,
        totalDuration: 900,
        startTime: null,
      };

      const result = calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 601, isRunning: true });
    });

    it('Math.ceilにより60秒タイマーで「60」が表示される', () => {
      const timer = {
        isRunning: false,
        remainingSeconds: 60,
        totalDuration: 60,
        startTime: null,
      };

      const result = calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 60, isRunning: false });
    });

    it('Math.ceilにより0.1秒残りでも「1」が表示される', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const timer = {
        isRunning: true,
        remainingSeconds: 60,
        totalDuration: 60,
        startTime: mockNow - 59900, // 59.9秒経過
      };

      const result = calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 1, isRunning: true });
    });
  });

  describe('calculateSubTimerRemainingSeconds', () => {
    it('subTimer が null の場合、0秒と停止状態を返す', () => {
      const result = calculateSubTimerRemainingSeconds(null, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('サブタイマーが動作中の場合、正しく残り秒数を計算する', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const subTimer = {
        isRunning: true,
        remainingSeconds: 30,
        totalDuration: 30, // 30秒
        startTime: mockNow - 10000, // 10秒前に開始
      };

      const result = calculateSubTimerRemainingSeconds(subTimer, 0);
      expect(result).toEqual({ seconds: 20, isRunning: true });
    });

    it('サブタイマーが時間切れの場合、0秒と停止状態を返す', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const subTimer = {
        isRunning: true,
        remainingSeconds: 30,
        totalDuration: 30,
        startTime: mockNow - 35000, // 35秒前に開始（時間切れ）
      };

      const result = calculateSubTimerRemainingSeconds(subTimer, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('Math.ceilにより30秒タイマーで「30」が表示される', () => {
      const subTimer = {
        isRunning: false,
        remainingSeconds: 30,
        totalDuration: 30,
        startTime: null,
      };

      const result = calculateSubTimerRemainingSeconds(subTimer, 0);
      expect(result).toEqual({ seconds: 30, isRunning: false });
    });
  });

  describe('formatTimer', () => {
    it('0秒を正しくフォーマットする', () => {
      const result = formatTimer(0);
      expect(result).toBe('00:00');
    });

    it('59秒を正しくフォーマットする', () => {
      const result = formatTimer(59);
      expect(result).toBe('00:59');
    });

    it('60秒（1分）を正しくフォーマットする', () => {
      const result = formatTimer(60);
      expect(result).toBe('01:00');
    });

    it('125秒（2分5秒）を正しくフォーマットする', () => {
      const result = formatTimer(125);
      expect(result).toBe('02:05');
    });

    it('3600秒（60分）を正しくフォーマットする', () => {
      const result = formatTimer(3600);
      expect(result).toBe('60:00');
    });

    it('3661秒（61分1秒）を正しくフォーマットする', () => {
      const result = formatTimer(3661);
      expect(result).toBe('61:01');
    });

    it('負の値は0として扱われる', () => {
      const result = formatTimer(-30);
      expect(result).toBe('00:00');
    });
  });

  describe('formatSubTimer', () => {
    it('0秒を正しくフォーマットする', () => {
      const result = formatSubTimer(0);
      expect(result).toBe('00');
    });

    it('5秒を正しくフォーマットする', () => {
      const result = formatSubTimer(5);
      expect(result).toBe('05');
    });

    it('30秒を正しくフォーマットする', () => {
      const result = formatSubTimer(30);
      expect(result).toBe('30');
    });

    it('99秒を正しくフォーマットする', () => {
      const result = formatSubTimer(99);
      expect(result).toBe('99');
    });

    it('負の値も文字列として扱われる', () => {
      const result = formatSubTimer(-5);
      expect(result).toBe('-5');
    });
  });
});