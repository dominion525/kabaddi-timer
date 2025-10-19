import { h } from 'preact';
import { buttonSizeStyles } from '../utils/button-styles';

interface DoOrDieButtonProps {
  teamId: 'teamA' | 'teamB';
  onUpdate: (team: 'teamA' | 'teamB', delta: number) => void;
  size?: 'desktop' | 'mobile-basic' | 'mobile-simple';
}

interface DoOrDieResetButtonProps extends DoOrDieButtonProps {
  currentCount: number;
}

// +1ボタン
export function DoOrDieIncrementButton({ teamId, onUpdate, size = 'desktop' }: DoOrDieButtonProps) {
  return (
    <button
      onClick={() => onUpdate(teamId, 1)}
      className={`${buttonSizeStyles[size]} bg-orange-400 hover:bg-orange-500 text-white transition-colors active:scale-95`}
      data-testid="dod-increment">
      +1
    </button>
  );
}

// -1ボタン
export function DoOrDieDecrementButton({ teamId, onUpdate, size = 'desktop' }: DoOrDieButtonProps) {
  return (
    <button
      onClick={() => onUpdate(teamId, -1)}
      className={`${buttonSizeStyles[size]} bg-orange-200 hover:bg-orange-300 text-orange-800 transition-colors active:scale-95`}
      data-testid="dod-decrement">
      -1
    </button>
  );
}

// リセットボタン
export function DoOrDieResetButton({ teamId, currentCount, onUpdate, size = 'desktop' }: DoOrDieResetButtonProps) {
  // desktopサイズの場合のみtext-xsを追加（mobile-basic/simpleはbuttonSizeStylesに含まれている）
  const additionalTextSize = size === 'desktop' ? 'text-xs' : '';

  return (
    <button
      onClick={() => onUpdate(teamId, currentCount === 0 ? 0 : -currentCount)}
      className={`${buttonSizeStyles[size]} ${additionalTextSize} bg-gray-400 hover:bg-gray-500 text-white transition-colors active:scale-95`}
      data-testid="dod-reset">
      リセット
    </button>
  );
}
