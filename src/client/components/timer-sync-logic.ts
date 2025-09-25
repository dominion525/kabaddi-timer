// タイマー時刻同期ロジック - TDD用純粋関数モジュール
// 現在のtimer-logic.tsから抽出し、テスト可能な形に変更

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  totalDuration: number;
  remainingSeconds: number;
  isPaused?: boolean;
}

export interface TimerResult {
  seconds: number;
  isRunning: boolean;
}

/**
 * 現状のタイマー残り秒数計算ロジック（timer-logic.tsからの抽出）
 * Date.now()を引数として受け取るようにテスト可能にした版
 *
 * @param timer - タイマー状態オブジェクト
 * @param serverTimeOffset - サーバー時刻オフセット
 * @param currentClientTime - クライアントの現在時刻（テスト用）
 * @returns { seconds: number, isRunning: boolean }
 */
export function calculateRemainingSecondsOriginal(
  timer: TimerState,
  serverTimeOffset: number,
  currentClientTime: number = Date.now()
): TimerResult {
  if (!timer) {
    return { seconds: 0, isRunning: false };
  }

  if (timer.isRunning && timer.startTime) {
    const serverNow = currentClientTime - serverTimeOffset;
    const elapsed = (serverNow - timer.startTime) / 1000;
    const remainingSeconds = Math.max(0, Math.ceil(timer.totalDuration - elapsed));
    // タイマーが0になったら停止状態として扱う
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
 * 現状のサブタイマー残り秒数計算ロジック（timer-logic.tsからの抽出）
 *
 * @param subTimer - サブタイマー状態オブジェクト
 * @param serverTimeOffset - サーバー時刻オフセット
 * @param currentClientTime - クライアントの現在時刻（テスト用）
 * @returns { seconds: number, isRunning: boolean }
 */
export function calculateSubTimerRemainingSecondsOriginal(
  subTimer: TimerState,
  serverTimeOffset: number,
  currentClientTime: number = Date.now()
): TimerResult {
  if (!subTimer) {
    return { seconds: 0, isRunning: false };
  }

  if (subTimer.isRunning && subTimer.startTime) {
    const serverNow = currentClientTime - serverTimeOffset;
    const elapsed = (serverNow - subTimer.startTime) / 1000;
    const remainingSeconds = Math.max(0, Math.ceil(subTimer.totalDuration - elapsed));
    // サブタイマーが0になったら停止状態として扱う
    const isRunning = remainingSeconds > 0;
    return { seconds: remainingSeconds, isRunning };
  } else {
    return {
      seconds: Math.ceil(subTimer.remainingSeconds),
      isRunning: subTimer.isRunning
    };
  }
}

// ===== 改善版ロジック =====

// 同期時点の状態を保持するためのインターフェース
export interface SyncPoint {
  serverTime: number;      // 同期時のサーバー時刻
  clientTime: number;      // 同期時のクライアント時刻
  remainingSeconds: number; // 同期時のサーバーの残り秒数
}

/**
 * 改善版タイマー残り秒数計算ロジック（相対時間ベース）
 *
 * 改善点：
 * 1. 相対時間ベース：同期時点からの経過時間を計算
 * 2. 絶対時刻差を使わず、クライアント側の経過時間のみを使用
 * 3. サーバー時刻とクライアント時刻の差に影響されない
 * 4. Math.ceilを維持（UX：0.1秒でも1秒表示）
 *
 * @param timer - タイマー状態オブジェクト（同期時点のサーバー状態）
 * @param serverTimeOffset - サーバー時刻オフセット（未使用だが互換性のため残す）
 * @param currentClientTime - クライアントの現在時刻（テスト用）
 * @returns { seconds: number, isRunning: boolean }
 */
export function calculateRemainingSecondsImproved(
  timer: TimerState,
  serverTimeOffset: number,
  currentClientTime: number = Date.now()
): TimerResult {
  // serverTimeOffsetは互換性のために残すが、相対時間アプローチでは使用しない
  void serverTimeOffset;
  if (!timer) {
    return { seconds: 0, isRunning: false };
  }

  if (timer.isRunning && timer.startTime) {
    // 真の相対時間アプローチ：
    // startTimeを「同期受信時のクライアント時刻」として扱う
    // remainingSecondsを「その同期時点での残り秒数」として扱う

    // 同期時点からのクライアント側経過時間を計算
    const elapsedSinceSync = (currentClientTime - timer.startTime) / 1000;

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
 * 真の改善版：同期時点を明示的に管理する版
 *
 * @param timer - タイマー状態（サーバーから受信した状態）
 * @param syncPoint - 最後の同期時点の情報
 * @param currentClientTime - 現在のクライアント時刻
 * @returns { seconds: number, isRunning: boolean }
 */
export function calculateRemainingSecondsRelative(
  timer: TimerState,
  syncPoint: SyncPoint,
  currentClientTime: number = Date.now()
): TimerResult {
  if (!timer) {
    return { seconds: 0, isRunning: false };
  }

  if (timer.isRunning) {
    // 同期時点からのクライアント側経過時間を計算
    const clientElapsedSinceSync = (currentClientTime - syncPoint.clientTime) / 1000;

    // 同期時点の残り秒数から、クライアント側経過時間を引く
    const remainingSeconds = Math.max(0, Math.ceil(syncPoint.remainingSeconds - clientElapsedSinceSync));

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
 * 改善版サブタイマー残り秒数計算ロジック
 *
 * @param subTimer - サブタイマー状態オブジェクト
 * @param serverTimeOffset - サーバー時刻オフセット
 * @param currentClientTime - クライアントの現在時刻（テスト用）
 * @returns { seconds: number, isRunning: boolean }
 */
export function calculateSubTimerRemainingSecondsImproved(
  subTimer: TimerState,
  serverTimeOffset: number,
  currentClientTime: number = Date.now()
): TimerResult {
  // サブタイマーも同じロジックを使用
  return calculateRemainingSecondsImproved(subTimer, serverTimeOffset, currentClientTime);
}

/**
 * 真の改善版サブタイマー：同期時点を明示的に管理する版
 */
export function calculateSubTimerRemainingSecondsRelative(
  subTimer: TimerState,
  syncPoint: SyncPoint,
  currentClientTime: number = Date.now()
): TimerResult {
  return calculateRemainingSecondsRelative(subTimer, syncPoint, currentClientTime);
}