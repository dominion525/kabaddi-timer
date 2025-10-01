import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useIdleTimer } from './useIdleTimer';

describe('useIdleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本的な動作', () => {
    it('タイマー停止中はコールバックが呼ばれない', () => {
      const mockOnIdleSync = vi.fn();

      renderHook(() =>
        useIdleTimer({
          isTimerRunning: false,
          isSubTimerRunning: false,
          onIdleSync: mockOnIdleSync,
        })
      );

      // 10秒経過
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnIdleSync).not.toHaveBeenCalled();
    });

    it('メインタイマー動作中は5-10秒でコールバックが呼ばれる', () => {
      const mockOnIdleSync = vi.fn();

      renderHook(() =>
        useIdleTimer({
          isTimerRunning: true,
          isSubTimerRunning: false,
          onIdleSync: mockOnIdleSync,
        })
      );

      // 5秒経過（最小遅延）
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // まだ呼ばれていないかもしれない（ランダム性があるため）
      const calledAt5s = mockOnIdleSync.mock.calls.length;

      // さらに5秒経過（最大10秒）
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // 10秒以内に必ず呼ばれているはず
      expect(mockOnIdleSync).toHaveBeenCalledTimes(1);
    });

    it('サブタイマー動作中は5-10秒でコールバックが呼ばれる', () => {
      const mockOnIdleSync = vi.fn();

      renderHook(() =>
        useIdleTimer({
          isTimerRunning: false,
          isSubTimerRunning: true,
          onIdleSync: mockOnIdleSync,
        })
      );

      // 10秒経過
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnIdleSync).toHaveBeenCalledTimes(1);
    });

    it('両方のタイマー動作中は5-10秒でコールバックが呼ばれる', () => {
      const mockOnIdleSync = vi.fn();

      renderHook(() =>
        useIdleTimer({
          isTimerRunning: true,
          isSubTimerRunning: true,
          onIdleSync: mockOnIdleSync,
        })
      );

      // 10秒経過
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnIdleSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('再帰的な動作', () => {
    it('コールバック後に次のタイムアウトがスケジュールされる', () => {
      const mockOnIdleSync = vi.fn();

      renderHook(() =>
        useIdleTimer({
          isTimerRunning: true,
          isSubTimerRunning: false,
          onIdleSync: mockOnIdleSync,
        })
      );

      // 1回目の呼び出し（10秒）
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(mockOnIdleSync).toHaveBeenCalledTimes(1);

      // 2回目の呼び出し（さらに10秒）
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(mockOnIdleSync).toHaveBeenCalledTimes(2);

      // 3回目の呼び出し（さらに10秒）
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(mockOnIdleSync).toHaveBeenCalledTimes(3);
    });

    it('タイマー停止時は再帰的な呼び出しが止まる', () => {
      const mockOnIdleSync = vi.fn();

      const { rerender } = renderHook(
        ({ isTimerRunning }: { isTimerRunning: boolean }) =>
          useIdleTimer({
            isTimerRunning,
            isSubTimerRunning: false,
            onIdleSync: mockOnIdleSync,
          }),
        { initialProps: { isTimerRunning: true } }
      );

      // 1回目の呼び出し
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(mockOnIdleSync).toHaveBeenCalledTimes(1);

      // タイマーを停止
      rerender({ isTimerRunning: false });

      // さらに時間を進めても呼ばれない
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(mockOnIdleSync).toHaveBeenCalledTimes(1); // 1回のまま
    });
  });

  describe('resetIdleTimer関数', () => {
    it('resetIdleTimer呼び出しで既存のタイマーがクリアされて再スケジュールされる', () => {
      const mockOnIdleSync = vi.fn();

      const { result } = renderHook(() =>
        useIdleTimer({
          isTimerRunning: true,
          isSubTimerRunning: false,
          onIdleSync: mockOnIdleSync,
        })
      );

      // 3秒経過（コールバックはまだ呼ばれない）
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(mockOnIdleSync).not.toHaveBeenCalled();

      // resetIdleTimerを呼び出し
      act(() => {
        result.current.resetIdleTimer();
      });

      // さらに3秒経過（合計6秒）
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      // リセット前の6秒ではなく、リセット後の3秒なのでまだ呼ばれていない可能性が高い

      // さらに7秒経過（リセット後10秒）
      act(() => {
        vi.advanceTimersByTime(7000);
      });
      // リセット後10秒経過したので呼ばれているはず
      expect(mockOnIdleSync).toHaveBeenCalledTimes(1);
    });

    it('resetIdleTimerをタイマー停止中に呼んでもコールバックはスケジュールされない', () => {
      const mockOnIdleSync = vi.fn();

      const { result } = renderHook(() =>
        useIdleTimer({
          isTimerRunning: false,
          isSubTimerRunning: false,
          onIdleSync: mockOnIdleSync,
        })
      );

      // resetIdleTimerを呼び出し
      act(() => {
        result.current.resetIdleTimer();
      });

      // 時間を進める
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnIdleSync).not.toHaveBeenCalled();
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にタイマーがクリアされる', () => {
      const mockOnIdleSync = vi.fn();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = renderHook(() =>
        useIdleTimer({
          isTimerRunning: true,
          isSubTimerRunning: false,
          onIdleSync: mockOnIdleSync,
        })
      );

      // アンマウント
      unmount();

      // clearTimeoutが呼ばれたことを確認
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('アンマウント後はコールバックが呼ばれない', () => {
      const mockOnIdleSync = vi.fn();

      const { unmount } = renderHook(() =>
        useIdleTimer({
          isTimerRunning: true,
          isSubTimerRunning: false,
          onIdleSync: mockOnIdleSync,
        })
      );

      // アンマウント
      unmount();

      // 時間を進める
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockOnIdleSync).not.toHaveBeenCalled();
    });
  });
});
