// タイマーロジック - 純粋関数モジュール
// ビジネスロジックを分離し、テスト可能かつ再利用可能にする

(function(global: any) {
  'use strict';

  /**
   * タイマーの残り秒数を計算
   * @param {Object} timer - タイマー状態オブジェクト
   * @param {number} serverTimeOffset - サーバー時刻オフセット
   * @returns {Object} { seconds: number, isRunning: boolean }
   */
  function calculateRemainingSeconds(timer: any, serverTimeOffset: number): { seconds: number; isRunning: boolean } {
    if (!timer) {
      return { seconds: 0, isRunning: false };
    }

    if (timer.isRunning && timer.startTime) {
      const serverNow = Date.now() - serverTimeOffset;
      const elapsed = (serverNow - timer.startTime) / 1000;
      const remainingSeconds = Math.max(0, Math.floor(timer.totalDuration - elapsed));
      // タイマーが0になったら停止状態として扱う
      const isRunning = remainingSeconds > 0;
      return { seconds: remainingSeconds, isRunning };
    } else {
      return {
        seconds: Math.floor(timer.remainingSeconds),
        isRunning: timer.isRunning
      };
    }
  }

  /**
   * サブタイマーの残り秒数を計算
   * @param {Object} subTimer - サブタイマー状態オブジェクト
   * @param {number} serverTimeOffset - サーバー時刻オフセット
   * @returns {Object} { seconds: number, isRunning: boolean }
   */
  function calculateSubTimerRemainingSeconds(subTimer: any, serverTimeOffset: number): { seconds: number; isRunning: boolean } {
    if (!subTimer) {
      return { seconds: 0, isRunning: false };
    }

    if (subTimer.isRunning && subTimer.startTime) {
      const serverNow = Date.now() - serverTimeOffset;
      const elapsed = (serverNow - subTimer.startTime) / 1000;
      const remainingSeconds = Math.max(0, Math.floor(subTimer.totalDuration - elapsed));
      // サブタイマーが0になったら停止状態として扱う
      const isRunning = remainingSeconds > 0;
      return { seconds: remainingSeconds, isRunning };
    } else {
      return {
        seconds: Math.floor(subTimer.remainingSeconds),
        isRunning: subTimer.isRunning
      };
    }
  }

  /**
   * タイマーを MM:SS 形式でフォーマット
   * @param {number} seconds - 秒数
   * @returns {string} MM:SS形式の文字列
   */
  function formatTimer(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
  }

  /**
   * サブタイマーを SS 形式でフォーマット
   * @param {number} seconds - 秒数
   * @returns {string} SS形式の文字列
   */
  function formatSubTimer(seconds: number): string {
    return seconds.toString().padStart(2, '0');
  }

  /**
   * Do or Die インジケーター配列を生成
   * @param {number} count - 現在のカウント
   * @param {number} max - 最大値（デフォルト3）
   * @returns {boolean[]} インジケーター状態の配列
   */
  function generateDoOrDieIndicators(count: number, max: number = 3): boolean[] {
    return Array(max).fill(0).map((_, i) => i < (count || 0));
  }

  // グローバル名前空間に公開
  global.TimerLogic = {
    calculateRemainingSeconds,
    calculateSubTimerRemainingSeconds,
    formatTimer,
    formatSubTimer,
    generateDoOrDieIndicators
  };

})(window);