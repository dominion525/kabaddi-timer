/**
 * Game ID generation and validation utilities
 */

/**
 * 数値をBase36エンコード（0-9, a-z）
 */
export function base36Encode(num: number): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  let current = num;

  while (current > 0) {
    result = chars[current % 36] + result;
    current = Math.floor(current / 36);
  }

  return result || '0';
}

/**
 * 短縮ゲームIDを生成（5-6文字のBase36文字列）
 */
export function generateShortId(): string {
  // UUID v4を生成
  const uuid = crypto.randomUUID();

  // ハイフンを削除して最初の12文字を取得
  const hex = uuid.replace(/-/g, '').substring(0, 12);

  // 16進数を10進数に変換
  const num = parseInt(hex, 16);

  // Base36エンコード（最大8文字程度）
  const shortId = base36Encode(num).substring(0, 6);

  // 最低5文字を保証
  return shortId.length >= 5 ? shortId : shortId.padStart(5, '0');
}

/**
 * ゲームIDのバリデーション結果
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * ゲームIDが有効かチェック
 */
export function validateGameId(gameId: string): ValidationResult {
  if (!gameId) {
    return { valid: false, error: 'タイマーIDを入力してください' };
  }

  // 安全な文字のみ許可（英数字とハイフン）
  const safePattern = /^[a-zA-Z0-9-]+$/;
  if (!safePattern.test(gameId)) {
    return { valid: false, error: 'タイマーIDは英数字とハイフンのみ使用できます' };
  }

  // 長さ制限
  if (gameId.length > 50) {
    return { valid: false, error: 'タイマーIDが長すぎます（最大50文字）' };
  }

  // パストラバーサル対策
  if (gameId.includes('..') || gameId.includes('//')) {
    return { valid: false, error: '不正なタイマーIDです' };
  }

  return { valid: true };
}
