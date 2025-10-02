import { useState, useEffect, useRef } from 'preact/hooks';
import type { GameState } from '../../types/game';
import { calculateRemainingSeconds, calculateSubTimerRemainingSeconds } from '../../utils/timer-logic-client';

interface UseTimerAnimationResult {
  mainTimerSeconds: number;
  subTimerSeconds: number;
  subTimerIsRunning: boolean;
}

/**
 * スマート補正ロジック: ちらつきを防止しつつ時刻同期を行う
 *
 * ルール:
 * - 500ms超のズレ → 即座に補正（明らかなズレは直す）
 * - 500ms以下のズレ → 表示値が変わらない場合のみ補正
 *   例: 9.98秒→10.03秒は両方「10秒」表示なので補正OK
 *   例: 10.48秒→10.03秒は表示が11→10に変わるので補正しない（ちらつき防止）
 */
function shouldUpdateDisplay(currentSeconds: number, newSeconds: number): boolean {
  const diff = Math.abs(newSeconds - currentSeconds);

  // 500ms超 → 即座に補正
  if (diff > 0.5) {
    return true;
  }

  // 500ms以下 → 表示値（Math.ceil後）が変わらなければ補正
  const currentDisplay = Math.ceil(currentSeconds);
  const newDisplay = Math.ceil(newSeconds);

  return currentDisplay === newDisplay;
}

/**
 * V1と同じタイマーアニメーションアーキテクチャを実装
 * requestAnimationFrameで毎フレーム更新し、サーバーからの状態更新で自動補正
 *
 * 改善点:
 * - useRefでgameStateを保持し、アニメーションループを再起動しない
 * - スマート補正ロジックでちらつきを防止
 */
export function useTimerAnimation(
  gameState: GameState | null
): UseTimerAnimationResult {
  const [mainTimerSeconds, setMainTimerSeconds] = useState(0);
  const [subTimerSeconds, setSubTimerSeconds] = useState(0);
  const [subTimerIsRunning, setSubTimerIsRunning] = useState(false);

  const animationIdRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const prevMainSecondsRef = useRef(0);
  const prevSubSecondsRef = useRef(0);

  // gameState更新時にrefに保存（アニメーションループは再起動しない）
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // アニメーションループ（初回のみ起動、以降は継続）
  useEffect(() => {
    const updateLoop = () => {
      const currentGameState = gameStateRef.current;

      if (!currentGameState) {
        // ゲーム状態がない場合は次フレームで再チェック
        animationIdRef.current = requestAnimationFrame(updateLoop);
        return;
      }

      try {
        // メインタイマー計算（相対時間アプローチでserverTimeOffsetは不要）
        const mainResult = calculateRemainingSeconds(currentGameState.timer, 0);
        const newMainSeconds = mainResult.seconds;

        // スマート補正: ちらつき防止
        if (shouldUpdateDisplay(prevMainSecondsRef.current, newMainSeconds)) {
          setMainTimerSeconds(newMainSeconds);
          prevMainSecondsRef.current = newMainSeconds;
        }

        // サブタイマー計算（相対時間アプローチでserverTimeOffsetは不要）
        if (currentGameState.subTimer) {
          const subResult = calculateSubTimerRemainingSeconds(currentGameState.subTimer, 0);
          const newSubSeconds = subResult.seconds;

          // スマート補正: ちらつき防止
          if (shouldUpdateDisplay(prevSubSecondsRef.current, newSubSeconds)) {
            setSubTimerSeconds(newSubSeconds);
            prevSubSecondsRef.current = newSubSeconds;
          }
          setSubTimerIsRunning(subResult.isRunning);
        }

        // 次フレームをスケジュール
        animationIdRef.current = requestAnimationFrame(updateLoop);
      } catch (error) {
        console.error('Timer animation error:', error);
        // エラー時はアニメーションを停止
        if (animationIdRef.current !== null) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }
      }
    };

    // アニメーションループを開始
    animationIdRef.current = requestAnimationFrame(updateLoop);

    // クリーンアップ: コンポーネントアンマウント時のみ
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, []); // 空配列 = 初回のみ実行、以降はアニメーションループが継続

  return {
    mainTimerSeconds,
    subTimerSeconds,
    subTimerIsRunning,
  };
}