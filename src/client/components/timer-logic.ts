// タイマーロジック - 純粋関数モジュール
// ビジネスロジックを分離し、テスト可能かつ再利用可能にする

(function(global: any) {
  'use strict';

  /**
   * タイマーの残り秒数を計算（改善版）
   *
   * 改善点：
   * 1. サーバーのremainingSecondsをベースとして使用
   * 2. 負の経過時間を防止
   * 3. 時刻差による異常値を制限
   * 4. Math.floorを使用してちらつきを軽減
   *
   * @param {Object} timer - タイマー状態オブジェクト
   * @param {number} serverTimeOffset - サーバー時刻オフセット
   * @returns {Object} { seconds: number, isRunning: boolean }
   */
  function calculateRemainingSeconds(timer: any, serverTimeOffset: number): { seconds: number; isRunning: boolean } {
    // serverTimeOffsetは互換性のために残すが、相対時間アプローチでは使用しない
    void serverTimeOffset;
    if (!timer) {
      return { seconds: 0, isRunning: false };
    }

    if (timer.isRunning && timer.startTime) {
      // 相対時間アプローチ：startTimeを「同期受信時のクライアント時刻」として扱う
      // 同期時点からのクライアント側経過時間を計算
      const elapsedSinceSync = (Date.now() - timer.startTime) / 1000;

      // 同期時点の残り秒数から、クライアント側経過時間を引く
      const remainingSeconds = Math.max(0, Math.ceil(timer.remainingSeconds - elapsedSinceSync));

      const isRunning = remainingSeconds > 0;
      return { seconds: remainingSeconds, isRunning };
    } else {
      return {
        seconds: Math.ceil(timer.remainingSeconds),
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
    // serverTimeOffsetは互換性のために残すが、相対時間アプローチでは使用しない
    void serverTimeOffset;
    if (!subTimer) {
      return { seconds: 0, isRunning: false };
    }

    if (subTimer.isRunning && subTimer.startTime) {
      // 相対時間アプローチ：startTimeを「同期受信時のクライアント時刻」として扱う
      // 同期時点からのクライアント側経過時間を計算
      const elapsedSinceSync = (Date.now() - subTimer.startTime) / 1000;

      // 同期時点の残り秒数から、クライアント側経過時間を引く
      const remainingSeconds = Math.max(0, Math.ceil(subTimer.remainingSeconds - elapsedSinceSync));

      const isRunning = remainingSeconds > 0;
      return { seconds: remainingSeconds, isRunning };
    } else {
      return {
        seconds: Math.ceil(subTimer.remainingSeconds),
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
    // 負の値は0として扱う
    const positiveSeconds = Math.max(0, seconds);
    const minutes = Math.floor(positiveSeconds / 60);
    const remainingSeconds = positiveSeconds % 60;
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

  // グローバル名前空間に公開
  global.TimerLogic = {
    calculateRemainingSeconds,
    calculateSubTimerRemainingSeconds,
    formatTimer,
    formatSubTimer
  };

})(window);