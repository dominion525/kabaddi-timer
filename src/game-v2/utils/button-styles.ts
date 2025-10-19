/**
 * ボタンコンポーネントで共通して使用されるサイズスタイル定義
 */
export const buttonSizeStyles = {
  desktop: 'h-12 font-bold rounded-lg',
  'mobile-basic': 'h-12 font-bold text-base rounded-lg',
  'mobile-simple': 'h-8 font-bold text-xs rounded',
} as const;

export type ButtonSize = keyof typeof buttonSizeStyles;
