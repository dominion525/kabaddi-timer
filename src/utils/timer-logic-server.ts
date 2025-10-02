// サーバー側タイマーロジック - 純粋関数モジュール
// 絶対時間ベースの計算（totalDurationから経過時間を減算）

/**
 * サーバー側のタイマー残り秒数を計算
 *
 * 計算方式：
 * - 絶対時間ベース：totalDuration - elapsed
 * - ちらつき防止なし（サーバー側では不要）
 * - isRunning判定なし（別途管理）
 *
 * @param startTime - タイマー開始時刻（Date.now()のミリ秒）
 * @param totalDuration - タイマーの総時間（秒）
 * @returns 残り秒数（0以上）
 */
export function calculateServerRemainingSeconds(
  startTime: number,
  totalDuration: number
): number {
  const elapsed = (Date.now() - startTime) / 1000;
  return Math.max(0, totalDuration - elapsed);
}