import { useState, useEffect, useRef } from 'preact/hooks';
import type { GameState } from '../../types/game';
import { calculateRemainingSeconds, calculateSubTimerRemainingSeconds, shouldUpdateDisplay } from '../../utils/timer-logic-client';

interface UseTimerAnimationResult {
  mainTimerSeconds: number;
  subTimerSeconds: number;
  subTimerIsRunning: boolean;
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