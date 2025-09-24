import { describe, it, expect, beforeEach, vi } from 'vitest';

// グローバル window オブジェクトをモック
const globalWindow = global as any;

// timer-logic.ts を読み込み
import '../../client/components/timer-logic';

describe('TimerLogic', () => {
  let TimerLogic: any;

  beforeEach(() => {
    // window.TimerLogic からテスト対象を取得
    TimerLogic = globalWindow.TimerLogic;
  });

  describe('calculateRemainingSeconds', () => {
    it('timer が null の場合、0秒と停止状態を返す', () => {
      const result = TimerLogic.calculateRemainingSeconds(null, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('timer が undefined の場合、0秒と停止状態を返す', () => {
      const result = TimerLogic.calculateRemainingSeconds(undefined, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('タイマーが停止中の場合、remainingSeconds をそのまま返す', () => {
      const timer = {
        isRunning: false,
        remainingSeconds: 300.5,
        totalDuration: 900,
        startTime: null
      };

      const result = TimerLogic.calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 300, isRunning: false });
    });

    it('タイマーが動作中の場合、経過時間を計算して残り秒数を返す', () => {
      // 現在時刻を固定
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const timer = {
        isRunning: true,
        remainingSeconds: 900,
        totalDuration: 900, // 15分
        startTime: mockNow - 300000 // 5分前に開始
      };

      // サーバー時刻オフセット 0
      const result = TimerLogic.calculateRemainingSeconds(timer, 0);

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
        startTime: mockNow - 300000 // 5分前に開始（時間切れ）
      };

      const result = TimerLogic.calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('サーバー時刻オフセットを考慮して計算する', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const timer = {
        isRunning: true,
        remainingSeconds: 900,
        totalDuration: 900,
        startTime: mockNow - 100000 // サーバー時刻で100秒前に開始
      };

      // サーバーがクライアントより50秒進んでいる場合
      const serverTimeOffset = -50000;
      const result = TimerLogic.calculateRemainingSeconds(timer, serverTimeOffset);

      // 実際の経過時間: 100 + 50 = 150秒
      // 残り時間: 900 - 150 = 750秒
      expect(result).toEqual({ seconds: 750, isRunning: true });
    });

    it('startTime がないが isRunning が true の場合、remainingSeconds を返す', () => {
      const timer = {
        isRunning: true,
        remainingSeconds: 600.7,
        totalDuration: 900,
        startTime: null
      };

      const result = TimerLogic.calculateRemainingSeconds(timer, 0);
      expect(result).toEqual({ seconds: 600, isRunning: true });
    });
  });

  describe('calculateSubTimerRemainingSeconds', () => {
    it('subTimer が null の場合、0秒と停止状態を返す', () => {
      const result = TimerLogic.calculateSubTimerRemainingSeconds(null, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });

    it('サブタイマーが動作中の場合、正しく残り秒数を計算する', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const subTimer = {
        isRunning: true,
        remainingSeconds: 30,
        totalDuration: 30, // 30秒
        startTime: mockNow - 10000 // 10秒前に開始
      };

      const result = TimerLogic.calculateSubTimerRemainingSeconds(subTimer, 0);
      expect(result).toEqual({ seconds: 20, isRunning: true });
    });

    it('サブタイマーが時間切れの場合、0秒と停止状態を返す', () => {
      const mockNow = 1000000;
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);

      const subTimer = {
        isRunning: true,
        remainingSeconds: 30,
        totalDuration: 30,
        startTime: mockNow - 35000 // 35秒前に開始（時間切れ）
      };

      const result = TimerLogic.calculateSubTimerRemainingSeconds(subTimer, 0);
      expect(result).toEqual({ seconds: 0, isRunning: false });
    });
  });

  describe('formatTimer', () => {
    it('0秒を正しくフォーマットする', () => {
      const result = TimerLogic.formatTimer(0);
      expect(result).toBe('00:00');
    });

    it('59秒を正しくフォーマットする', () => {
      const result = TimerLogic.formatTimer(59);
      expect(result).toBe('00:59');
    });

    it('60秒（1分）を正しくフォーマットする', () => {
      const result = TimerLogic.formatTimer(60);
      expect(result).toBe('01:00');
    });

    it('125秒（2分5秒）を正しくフォーマットする', () => {
      const result = TimerLogic.formatTimer(125);
      expect(result).toBe('02:05');
    });

    it('3600秒（60分）を正しくフォーマットする', () => {
      const result = TimerLogic.formatTimer(3600);
      expect(result).toBe('60:00');
    });

    it('3661秒（61分1秒）を正しくフォーマットする', () => {
      const result = TimerLogic.formatTimer(3661);
      expect(result).toBe('61:01');
    });

    it('負の値は0として扱われる', () => {
      const result = TimerLogic.formatTimer(-30);
      expect(result).toBe('00:00');
    });
  });

  describe('formatSubTimer', () => {
    it('0秒を正しくフォーマットする', () => {
      const result = TimerLogic.formatSubTimer(0);
      expect(result).toBe('00');
    });

    it('5秒を正しくフォーマットする', () => {
      const result = TimerLogic.formatSubTimer(5);
      expect(result).toBe('05');
    });

    it('30秒を正しくフォーマットする', () => {
      const result = TimerLogic.formatSubTimer(30);
      expect(result).toBe('30');
    });

    it('99秒を正しくフォーマットする', () => {
      const result = TimerLogic.formatSubTimer(99);
      expect(result).toBe('99');
    });

    it('負の値も文字列として扱われる', () => {
      const result = TimerLogic.formatSubTimer(-5);
      expect(result).toBe('-5');
    });
  });

});