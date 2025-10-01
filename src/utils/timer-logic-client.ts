// タイマーロジック - 純粋関数モジュール
// ビジネスロジックを分離し、テスト可能かつ再利用可能にする

export interface TimerState {
  isRunning: boolean;
  remainingSeconds: number;
  totalDuration: number;
  startTime: number | null;
  isPaused?: boolean;
  pausedAt?: number | null;
}

export interface TimerResult {
  seconds: number;
  isRunning: boolean;
}

/**
 * タイマーの残り秒数を計算（改善版）
 *
 * 改善点：
 * 1. サーバーのremainingSecondsをベースとして使用
 * 2. 負の経過時間を防止
 * 3. 時刻差による異常値を制限
 * 4. 小数点2桁切り捨て + Math.ceil（10ms未満の端数を無視）でちらつきを防止
 *
 * @param timer - タイマー状態オブジェクト
 * @param serverTimeOffset - サーバー時刻オフセット
 * @returns { seconds: number, isRunning: boolean }
 */
export function calculateRemainingSeconds(
  timer: TimerState | null | undefined,
  serverTimeOffset: number
): TimerResult {
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
    // 10ミリ秒未満の端数は切り捨ててちらつきを防止
    const rawSeconds = timer.remainingSeconds - elapsedSinceSync;
    const truncated = Math.floor(rawSeconds * 100) / 100;
    const remainingSeconds = Math.max(0, Math.ceil(truncated));

    const isRunning = remainingSeconds > 0;
    return { seconds: remainingSeconds, isRunning };
  } else {
    const truncated = Math.floor(timer.remainingSeconds * 100) / 100;
    return {
      seconds: Math.ceil(truncated),
      isRunning: timer.isRunning,
    };
  }
}

/**
 * サブタイマーの残り秒数を計算
 * @param subTimer - サブタイマー状態オブジェクト
 * @param serverTimeOffset - サーバー時刻オフセット
 * @returns { seconds: number, isRunning: boolean }
 */
export function calculateSubTimerRemainingSeconds(
  subTimer: TimerState | null | undefined,
  serverTimeOffset: number
): TimerResult {
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
    // 10ミリ秒未満の端数は切り捨ててちらつきを防止
    const rawSeconds = subTimer.remainingSeconds - elapsedSinceSync;
    const truncated = Math.floor(rawSeconds * 100) / 100;
    const remainingSeconds = Math.max(0, Math.ceil(truncated));

    const isRunning = remainingSeconds > 0;
    return { seconds: remainingSeconds, isRunning };
  } else {
    const truncated = Math.floor(subTimer.remainingSeconds * 100) / 100;
    return {
      seconds: Math.ceil(truncated),
      isRunning: subTimer.isRunning,
    };
  }
}

/**
 * タイマーを MM:SS 形式でフォーマット
 * @param seconds - 秒数
 * @returns MM:SS形式の文字列
 */
export function formatTimer(seconds: number): string {
  // 負の値は0として扱う
  const positiveSeconds = Math.max(0, seconds);
  const minutes = Math.floor(positiveSeconds / 60);
  const remainingSeconds = positiveSeconds % 60;
  return (
    minutes.toString().padStart(2, '0') +
    ':' +
    remainingSeconds.toString().padStart(2, '0')
  );
}

/**
 * サブタイマーを SS 形式でフォーマット
 * @param seconds - 秒数
 * @returns SS形式の文字列
 */
export function formatSubTimer(seconds: number): string {
  return seconds.toString().padStart(2, '0');
}