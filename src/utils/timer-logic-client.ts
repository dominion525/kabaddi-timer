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
    const elapsedSinceSync = (performance.now() - timer.startTime) / 1000;

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
    const elapsedSinceSync = (performance.now() - subTimer.startTime) / 1000;

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

/**
 * スマート補正ロジック: ちらつきを防止しつつ時刻同期を行う
 *
 * タイマーの性質（必ず減少）を活用した補正判定:
 * - 300ms超のズレ → 即座に補正（明らかな異常）
 * - 増加方向（タイマーが逆行）:
 *   - 100ms未満 → 無視（ちらつき防止）
 *   - 100ms以上 → 補正（異常な増加）
 * - 減少方向:
 *   - 表示値が変わらない範囲で補正
 *
 * @param currentSeconds - 現在の秒数
 * @param newSeconds - 新しい秒数
 * @returns 表示を更新すべきかどうか
 */
export function shouldUpdateDisplay(currentSeconds: number, newSeconds: number): boolean {
  // ミリ秒単位に変換して丸め（浮動小数点精度問題を回避）
  const diffMs = Math.round(Math.abs((newSeconds - currentSeconds) * 1000));

  // 300ms超のズレ → 即座に補正
  if (diffMs > 300) {
    return true;
  }

  // タイマーは減少するはず
  // 増加する場合（逆行）は、小さなズレは無視
  if (newSeconds > currentSeconds) {
    // 100ms以上の増加は異常なので補正
    if (diffMs >= 100) {
      return true;
    }
    // 100ms未満の増加は無視（ちらつき防止）
    return false;
  }

  // 減少方向: 表示値が変わらなければ補正OK
  const currentDisplay = Math.ceil(currentSeconds);
  const newDisplay = Math.ceil(newSeconds);

  return currentDisplay === newDisplay;
}