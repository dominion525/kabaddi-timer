import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useTimerAnimation } from './useTimerAnimation';
import type { GameState } from '../../types/game';
import { createMockGameState } from '../test/test-utils';

describe('useTimerAnimation', () => {
  let animationFrameCallbacks: FrameRequestCallback[] = [];
  let animationFrameId = 0;

  beforeEach(() => {
    animationFrameCallbacks = [];
    animationFrameId = 0;

    // requestAnimationFrameをモック
    global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = ++animationFrameId;
      animationFrameCallbacks.push(callback);
      return id;
    });

    // cancelAnimationFrameをモック
    global.cancelAnimationFrame = vi.fn((id: number) => {
      // 実装は省略（テストには不要）
    });

    // Date.nowをモック
    vi.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const executeAnimationFrame = () => {
    const callback = animationFrameCallbacks[animationFrameCallbacks.length - 1];
    if (callback) {
      callback(performance.now());
    }
  };

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useTimerAnimation(null));

    expect(result.current.mainTimerSeconds).toBe(0);
    expect(result.current.subTimerSeconds).toBe(0);
    expect(result.current.subTimerIsRunning).toBe(false);
  });

  it('gameStateがnullの場合でもrequestAnimationFrameが継続する', () => {
    renderHook(() => useTimerAnimation(null));

    // 初回のrequestAnimationFrameが呼ばれる
    expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);

    // アニメーションフレームを実行
    act(() => {
      executeAnimationFrame();
    });

    // 次のrequestAnimationFrameが呼ばれる
    expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it('タイマーが停止中の場合、remainingSecondsが表示される', () => {
    const gameState = createMockGameState();
    gameState.timer.isRunning = false;
    gameState.timer.remainingSeconds = 3600;

    const { result } = renderHook(() => useTimerAnimation(gameState));

    act(() => {
      executeAnimationFrame();
    });

    expect(result.current.mainTimerSeconds).toBe(3600);
  });

  it('タイマーが実行中の場合、経過時間を計算して表示する', () => {
    const gameState = createMockGameState();
    gameState.timer.isRunning = true;
    gameState.timer.startTime = 1000000; // Date.now()と同じ
    gameState.timer.remainingSeconds = 100;

    const { result } = renderHook(() => useTimerAnimation(gameState));

    act(() => {
      executeAnimationFrame();
    });

    // 経過時間0秒なので残り100秒
    expect(result.current.mainTimerSeconds).toBe(100);

    // 時刻を5秒進める
    vi.spyOn(Date, 'now').mockReturnValue(1005000);

    act(() => {
      executeAnimationFrame();
    });

    // 経過時間5秒なので残り95秒
    expect(result.current.mainTimerSeconds).toBe(95);
  });

  describe('useLayoutEffectによる同期的更新', () => {
    it('gameStateの変更がrequestAnimationFrame実行前に反映される', () => {
      const initialGameState = createMockGameState();
      initialGameState.timer.isRunning = false;
      initialGameState.timer.remainingSeconds = 100;

      const { result, rerender } = renderHook(
        ({ gameState }) => useTimerAnimation(gameState),
        { initialProps: { gameState: initialGameState } }
      );

      act(() => {
        executeAnimationFrame();
      });

      expect(result.current.mainTimerSeconds).toBe(100);

      // gameStateを更新（タイマーを開始）
      const updatedGameState = createMockGameState();
      updatedGameState.timer.isRunning = true;
      updatedGameState.timer.startTime = 1000000;
      updatedGameState.timer.remainingSeconds = 90;

      // rerenderを同期的に実行
      rerender({ gameState: updatedGameState });

      // 時刻を3秒進める
      vi.spyOn(Date, 'now').mockReturnValue(1003000);

      // 次のアニメーションフレームで新しいgameStateが使われる
      act(() => {
        executeAnimationFrame();
      });

      // 残り90秒 - 3秒 = 87秒
      expect(result.current.mainTimerSeconds).toBe(87);
    });

    it('複数回の連続したgameState更新を正しく処理する', () => {
      const gameState1 = createMockGameState();
      gameState1.timer.isRunning = false;
      gameState1.timer.remainingSeconds = 100;

      const { result, rerender } = renderHook(
        ({ gameState }) => useTimerAnimation(gameState),
        { initialProps: { gameState: gameState1 } }
      );

      act(() => {
        executeAnimationFrame();
      });

      expect(result.current.mainTimerSeconds).toBe(100);

      // 1回目の更新
      const gameState2 = createMockGameState();
      gameState2.timer.isRunning = false;
      gameState2.timer.remainingSeconds = 90;

      rerender({ gameState: gameState2 });

      act(() => {
        executeAnimationFrame();
      });

      expect(result.current.mainTimerSeconds).toBe(90);

      // 2回目の更新
      const gameState3 = createMockGameState();
      gameState3.timer.isRunning = false;
      gameState3.timer.remainingSeconds = 80;

      rerender({ gameState: gameState3 });

      act(() => {
        executeAnimationFrame();
      });

      expect(result.current.mainTimerSeconds).toBe(80);
    });
  });

  describe('スマート補正ロジック', () => {
    it('表示値が変わらない場合は更新する', () => {
      const gameState = createMockGameState();
      gameState.timer.isRunning = false;
      gameState.timer.remainingSeconds = 10.8;

      const { result, rerender } = renderHook(
        ({ gameState }) => useTimerAnimation(gameState),
        { initialProps: { gameState } }
      );

      act(() => {
        executeAnimationFrame();
      });

      // Math.ceil(10.8) = 11
      expect(result.current.mainTimerSeconds).toBe(11);

      // 表示値が変わらない範囲で更新
      const updatedGameState = createMockGameState();
      updatedGameState.timer.isRunning = false;
      updatedGameState.timer.remainingSeconds = 10.3;

      rerender({ gameState: updatedGameState });

      act(() => {
        executeAnimationFrame();
      });

      // Math.ceil(10.3) = 11、表示値が変わらないので更新される
      expect(result.current.mainTimerSeconds).toBe(11);
    });

    it('300ms超のズレは即座に補正される', () => {
      const gameState = createMockGameState();
      gameState.timer.isRunning = false;
      gameState.timer.remainingSeconds = 10.0;

      const { result, rerender } = renderHook(
        ({ gameState }) => useTimerAnimation(gameState),
        { initialProps: { gameState } }
      );

      act(() => {
        executeAnimationFrame();
      });

      expect(result.current.mainTimerSeconds).toBe(10);

      // 500ms（0.5秒）のズレ
      const updatedGameState = createMockGameState();
      updatedGameState.timer.isRunning = false;
      updatedGameState.timer.remainingSeconds = 9.5;

      rerender({ gameState: updatedGameState });

      act(() => {
        executeAnimationFrame();
      });

      // 300ms超なので即座に補正
      expect(result.current.mainTimerSeconds).toBe(10);
    });
  });

  describe('サブタイマー', () => {
    it('サブタイマーの状態を正しく計算する', () => {
      const gameState = createMockGameState();
      gameState.subTimer.isRunning = true;
      gameState.subTimer.startTime = 1000000;
      gameState.subTimer.remainingSeconds = 30;

      const { result } = renderHook(() => useTimerAnimation(gameState));

      act(() => {
        executeAnimationFrame();
      });

      expect(result.current.subTimerSeconds).toBe(30);
      expect(result.current.subTimerIsRunning).toBe(true);

      // 時刻を10秒進める
      vi.spyOn(Date, 'now').mockReturnValue(1010000);

      act(() => {
        executeAnimationFrame();
      });

      expect(result.current.subTimerSeconds).toBe(20);
      expect(result.current.subTimerIsRunning).toBe(true);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にrequestAnimationFrameがキャンセルされる', () => {
      const gameState = createMockGameState();
      const { unmount } = renderHook(() => useTimerAnimation(gameState));

      // アニメーションフレームが開始される
      expect(global.requestAnimationFrame).toHaveBeenCalled();

      unmount();

      // cancelAnimationFrameが呼ばれる
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });
});
