import { useRef, useCallback, useEffect } from 'preact/hooks';
import { gameStateLogger } from '../../utils/logger';

interface UseIdleTimerOptions {
  isTimerRunning: boolean;
  isSubTimerRunning: boolean;
  onIdleSync: () => void;
}

/**
 * Durable Objectsのハイバネーションを防ぐためのアイドルタイマー
 *
 * タイマーが動作中（メインまたはサブ）の場合、5-10秒のランダムな間隔で
 * GET_GAME_STATEを送信してサーバーをアクティブに保つ。
 *
 * タイマー停止中は通信を行わず、ハイバネーションを許可する。
 *
 * @param isTimerRunning - メインタイマーが動作中かどうか
 * @param isSubTimerRunning - サブタイマーが動作中かどうか
 * @param onIdleSync - アイドル時に実行するコールバック（GET_GAME_STATE送信）
 * @returns resetIdleTimer - アイドルタイマーをリセットする関数
 */
export function useIdleTimer({
  isTimerRunning,
  isSubTimerRunning,
  onIdleSync,
}: UseIdleTimerOptions) {
  const timeoutRef = useRef<number | null>(null);

  const resetIdleTimer = useCallback(() => {
    // 既存のタイマーをクリア
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const anyTimerRunning = isTimerRunning || isSubTimerRunning;

    if (anyTimerRunning) {
      // 5-10秒後に同期（10秒ハイバネーション閾値をカバー）
      const idleDelay = 5000 + Math.random() * 5000;
      gameStateLogger.debug(`[IdleTimer] Timer running - setting idle sync after ${Math.round(idleDelay / 1000)}s`);

      timeoutRef.current = window.setTimeout(() => {
        onIdleSync();
        // 再帰的に次のタイムアウトをスケジュール
        resetIdleTimer();
      }, idleDelay);
    } else {
      gameStateLogger.debug('[IdleTimer] Timer stopped - no idle sync needed (hibernation allowed)');
    }
  }, [isTimerRunning, isSubTimerRunning, onIdleSync]);

  // タイマー状態変更時に再スケジュール
  useEffect(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return { resetIdleTimer };
}
