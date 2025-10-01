interface DoOrDieButtonProps {
  teamId: 'teamA' | 'teamB';
  onUpdate: (team: 'teamA' | 'teamB', delta: number) => void;
  size?: 'desktop' | 'tablet' | 'mobile';
}

interface DoOrDieResetButtonProps extends DoOrDieButtonProps {
  currentCount: number;
}

// +1ボタン
export function DoOrDieIncrementButton({ teamId, onUpdate, size = 'desktop' }: DoOrDieButtonProps) {
  const sizeStyles = {
    desktop: 'aspect-square font-bold rounded-lg',
    tablet: 'h-12 font-bold text-base rounded-lg',
    mobile: 'h-8 font-bold text-xs rounded',
  };

  return (
    <button
      onClick={() => onUpdate(teamId, 1)}
      className={`${sizeStyles[size]} bg-orange-400 hover:bg-orange-500 text-white transition-colors active:scale-95`}
      data-testid="dod-increment">
      +1
    </button>
  );
}

// -1ボタン
export function DoOrDieDecrementButton({ teamId, onUpdate, size = 'desktop' }: DoOrDieButtonProps) {
  const sizeStyles = {
    desktop: 'aspect-square font-bold rounded-lg',
    tablet: 'h-12 font-bold text-base rounded-lg',
    mobile: 'h-8 font-bold text-xs rounded',
  };

  return (
    <button
      onClick={() => onUpdate(teamId, -1)}
      className={`${sizeStyles[size]} bg-orange-200 hover:bg-orange-300 text-orange-800 transition-colors active:scale-95`}
      data-testid="dod-decrement">
      -1
    </button>
  );
}

// リセットボタン
export function DoOrDieResetButton({ teamId, currentCount, onUpdate, size = 'desktop' }: DoOrDieResetButtonProps) {
  const sizeStyles = {
    desktop: { button: 'h-12', text: 'text-xs', rounded: 'rounded-lg' },
    tablet: { button: 'h-12', text: 'text-base', rounded: 'rounded-lg' },
    mobile: { button: 'h-8', text: 'text-xs', rounded: 'rounded' },
  };

  const styles = sizeStyles[size];

  return (
    <button
      onClick={() => onUpdate(teamId, -currentCount)}
      className={`${styles.button} bg-gray-400 hover:bg-gray-500 text-white ${styles.rounded} font-bold ${styles.text} transition-colors active:scale-95`}
      data-testid="dod-reset">
      リセット
    </button>
  );
}
