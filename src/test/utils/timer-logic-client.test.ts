import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  calculateRemainingSeconds,
  calculateSubTimerRemainingSeconds,
  formatTimer,
  formatSubTimer,
  shouldUpdateDisplay,
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
      vi.spyOn(performance, 'now').mockReturnValue(mockNow);

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
      vi.spyOn(performance, 'now').mockReturnValue(mockNow);

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
      vi.spyOn(performance, 'now').mockReturnValue(mockNow);

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
      vi.spyOn(performance, 'now').mockReturnValue(mockNow);

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

  describe('shouldUpdateDisplay', () => {
    describe('1秒超のズレ', () => {
      it('1.5秒のズレで即座に補正する', () => {
        const result = shouldUpdateDisplay(10.0, 11.5);
        expect(result).toBe(true);
      });

      it('2秒のズレで即座に補正する', () => {
        const result = shouldUpdateDisplay(10.0, 8.0);
        expect(result).toBe(true);
      });
    });

    describe('増加方向（タイマー逆行）', () => {
      it('50ms（0.05秒）の増加は無視してちらつき防止', () => {
        const result = shouldUpdateDisplay(10.0, 10.05);
        expect(result).toBe(false);
      });

      it('90ms（0.09秒）の増加は無視してちらつき防止', () => {
        const result = shouldUpdateDisplay(10.0, 10.09);
        expect(result).toBe(false);
      });

      it('100ms（0.1秒）の増加は補正する', () => {
        const result = shouldUpdateDisplay(10.0, 10.1);
        expect(result).toBe(true);
      });

      it('150ms（0.15秒）の増加は補正する', () => {
        const result = shouldUpdateDisplay(10.0, 10.15);
        expect(result).toBe(true);
      });

      it('500ms（0.5秒）の増加は補正する', () => {
        const result = shouldUpdateDisplay(10.0, 10.5);
        expect(result).toBe(true);
      });
    });

    describe('減少方向：表示値が変わらない場合', () => {
      it('10.48→10.03（表示11→11）で補正する', () => {
        const result = shouldUpdateDisplay(10.48, 10.03);
        expect(result).toBe(true);
        // Math.ceil(10.48) = 11, Math.ceil(10.03) = 11
      });

      it('9.98→9.60（表示10→10）で補正する', () => {
        const result = shouldUpdateDisplay(9.98, 9.60);
        expect(result).toBe(true);
        // Math.ceil(9.98) = 10, Math.ceil(9.60) = 10
      });

      it('59.99→59.01（表示60→60）で補正する', () => {
        const result = shouldUpdateDisplay(59.99, 59.01);
        expect(result).toBe(true);
        // Math.ceil(59.99) = 60, Math.ceil(59.01) = 60
      });
    });

    describe('減少方向：表示値が変わる場合', () => {
      it('10.48→9.97（表示11→10）で補正する（510ms > 300ms）', () => {
        const result = shouldUpdateDisplay(10.48, 9.97);
        expect(result).toBe(true);
        // 差が510ms > 300msなので即座補正（大きなズレを防止）
      });

      it('60.01→59.99（表示61→60）で補正しない', () => {
        const result = shouldUpdateDisplay(60.01, 59.99);
        expect(result).toBe(false);
        // Math.ceil(60.01) = 61, Math.ceil(59.99) = 60 → 表示が変わる
      });

      it('1.01→0.99（表示2→1）で補正しない', () => {
        const result = shouldUpdateDisplay(1.01, 0.99);
        expect(result).toBe(false);
        // Math.ceil(1.01) = 2, Math.ceil(0.99) = 1 → 表示が変わる
      });
    });

    describe('境界値テスト', () => {
      it('差が0の場合、表示を更新する（同値）', () => {
        const result = shouldUpdateDisplay(10.0, 10.0);
        expect(result).toBe(true);
        // Math.ceil(10.0) = 10, Math.ceil(10.0) = 10 → 同じ
      });

      it('差がちょうど1.0秒の場合、補正する（1000ms > 300ms）', () => {
        const result = shouldUpdateDisplay(10.0, 9.0);
        expect(result).toBe(true);
        // diff = 1000ms > 300ms → 即座に補正
      });

      it('差が1.01秒の場合、即座に補正する', () => {
        const result = shouldUpdateDisplay(10.0, 8.99);
        expect(result).toBe(true);
        // diff = 1010ms > 300ms → 即座に補正
      });
    });
  });
});