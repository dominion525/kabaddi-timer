import { useState, useEffect, useRef } from 'preact/hooks';
import type { GameState } from '../../types/game';
import { calculateRemainingSeconds, calculateSubTimerRemainingSeconds } from '../../utils/timer-logic-client';

interface UseTimerAnimationResult {
  mainTimerSeconds: number;
  subTimerSeconds: number;
  subTimerIsRunning: boolean;
}

/**
 * V1と同じタイマーアニメーションアーキテクチャを実装
 * requestAnimationFrameで毎フレーム更新し、サーバーからの状態更新で自動補正
 */
export function useTimerAnimation(
  gameState: GameState | null,
  serverTimeOffset: number
): UseTimerAnimationResult {
  const [mainTimerSeconds, setMainTimerSeconds] = useState(0);
  const [subTimerSeconds, setSubTimerSeconds] = useState(0);
  const [subTimerIsRunning, setSubTimerIsRunning] = useState(false);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!gameState) {
      // ゲーム状態がない場合はアニメーションを停止
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      return;
    }

    // アニメーションループ: V1のstartTimerUpdate()と同等
    const updateLoop = () => {
      try {
        // メインタイマー計算
        const mainResult = calculateRemainingSeconds(gameState.timer, serverTimeOffset);
        setMainTimerSeconds(mainResult.seconds);

        // サブタイマー計算
        if (gameState.subTimer) {
          const subResult = calculateSubTimerRemainingSeconds(gameState.subTimer, serverTimeOffset);
          setSubTimerSeconds(subResult.seconds);
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

    // 既存のアニメーションをクリア（V1のupdateTimerDisplay()と同等）
    if (animationIdRef.current !== null) {
      cancelAnimationFrame(animationIdRef.current);
    }

    // アニメーションループを開始
    animationIdRef.current = requestAnimationFrame(updateLoop);

    // クリーンアップ: コンポーネントアンマウント時またはgameState変更時
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [gameState, serverTimeOffset]);

  return {
    mainTimerSeconds,
    subTimerSeconds,
    subTimerIsRunning,
  };
}