// スコアロジックモジュール
// スコア表示とDo or Die関連のロジックを担当
// 責務の分離によりタイマーロジックから独立

// ===== 定数定義 =====
/** スコアの最小値 */
export const SCORE_MIN = 0;

/** スコアの最大値 */
export const SCORE_MAX = 999;

/** Do or Dieカウントの最小値 */
export const DO_OR_DIE_MIN = 0;

/** Do or Dieカウントの最大値 */
export const DO_OR_DIE_MAX = 3;

// ===== クランプ関数 =====
/**
 * スコアを有効範囲内にクランプ（制限）する
 * @param score - クランプするスコア値
 * @returns 0-999の範囲内に収められたスコア値
 */
export function clampScore(score: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, score));
}

/**
 * Do or Dieカウントを有効範囲内にクランプ（制限）する
 * @param count - クランプするカウント値
 * @returns 0-3の範囲内に収められたカウント値
 */
export function clampDoOrDieCount(count: number): number {
  return Math.max(DO_OR_DIE_MIN, Math.min(DO_OR_DIE_MAX, count));
}

// ===== ユーティリティ関数 =====
/**
 * Do or Die インジケーター配列を生成
 * @param count - 現在のカウント
 * @param max - 最大値（デフォルト3）
 * @returns インジケーター状態の配列
 */
export function generateDoOrDieIndicators(count: number, max: number = DO_OR_DIE_MAX): boolean[] {
  return Array(max).fill(0).map((_, i) => i < (count || 0));
}

/**
 * スコア表示のフォーマット
 * @param score - スコア値
 * @returns フォーマットされたスコア文字列
 */
export function formatScore(score: number): string {
  return String(score || 0);
}

// ===== バリデーション関数 =====
/**
 * スコアの妥当性検証
 * @param score - 検証するスコア値
 * @returns 有効なスコアの場合true
 */
export function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= SCORE_MIN && score <= SCORE_MAX;
}

/**
 * Do or Dieカウントの妥当性検証
 * @param count - 検証するカウント値
 * @returns 有効なカウントの場合true
 */
export function isValidDoOrDieCount(count: number): boolean {
  return Number.isInteger(count) && count >= DO_OR_DIE_MIN && count <= DO_OR_DIE_MAX;
}

/**
 * チーム名の妥当性検証
 * @param name - 検証するチーム名
 * @returns 有効なチーム名の場合true
 */
export function isValidTeamName(name: string): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 20;
}