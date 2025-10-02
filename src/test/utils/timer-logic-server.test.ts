import { describe, it, expect, vi, afterEach } from 'vitest';
import { calculateServerRemainingSeconds } from '../../utils/timer-logic-server';

describe('timer-logic-server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateServerRemainingSeconds', () => {
    it('開始直後は総時間が返される', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const result = calculateServerRemainingSeconds(now, 60);
      expect(result).toBe(60);
    });

    it('10秒経過後は残り50秒が返される', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 10000); // 10秒後

      const result = calculateServerRemainingSeconds(startTime, 60);
      expect(result).toBe(50);
    });

    it('30秒経過後は残り30秒が返される', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 30000); // 30秒後

      const result = calculateServerRemainingSeconds(startTime, 60);
      expect(result).toBe(30);
    });

    it('総時間経過後は0秒が返される', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 60000); // 60秒後

      const result = calculateServerRemainingSeconds(startTime, 60);
      expect(result).toBe(0);
    });

    it('総時間超過後も0秒が返される（負の値にならない）', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 70000); // 70秒後

      const result = calculateServerRemainingSeconds(startTime, 60);
      expect(result).toBe(0);
    });

    it('大きな時間（60分）でも正しく計算される', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 1800000); // 30分後

      const result = calculateServerRemainingSeconds(startTime, 3600);
      expect(result).toBe(1800);
    });

    it('短い時間（30秒）でも正しく計算される', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 15000); // 15秒後

      const result = calculateServerRemainingSeconds(startTime, 30);
      expect(result).toBe(15);
    });

    it('小数点以下の秒数も正しく計算される', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 5500); // 5.5秒後

      const result = calculateServerRemainingSeconds(startTime, 60);
      expect(result).toBe(54.5);
    });

    it('境界値: 残り0.1秒でも0より大きい値が返される', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 59900); // 59.9秒後

      const result = calculateServerRemainingSeconds(startTime, 60);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(0.1, 1);
    });

    it('境界値: 残り時間がちょうど0になる', () => {
      const startTime = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(startTime + 30000); // 30秒後

      const result = calculateServerRemainingSeconds(startTime, 30);
      expect(result).toBe(0);
    });
  });
});