interface Props {
  size: 'desktop' | 'mobile';
  onAdjust: (seconds: number) => void;
}

const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'space-y-2',
      buttonRow: 'flex space-x-1',
      buttonPadding: 'p-2',
      buttonTextSize: 'text-sm',
      buttonRounded: 'rounded',
    },
    mobile: {
      container: 'space-y-3',
      buttonRow: 'flex space-x-2',
      buttonPadding: 'p-3',
      buttonTextSize: '',
      buttonRounded: 'rounded-lg',
    },
  };

  return styleMap[size];
};

export function TimerAdjustButtons({ size, onAdjust }: Props) {
  const styles = getStyles(size);

  return (
    <div data-testid="timer-adjust-buttons" className={styles.container}>
      <div className={styles.buttonRow}>
        <button
          data-testid="adjust-plus-60"
          onClick={() => onAdjust(60)}
          className={`flex-1 bg-blue-500 hover:bg-blue-600 text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonTextSize} transition-colors`}
        >
          +1分
        </button>
        <button
          data-testid="adjust-plus-10"
          onClick={() => onAdjust(10)}
          className={`flex-1 bg-blue-500 hover:bg-blue-600 text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonTextSize} transition-colors`}
        >
          +10秒
        </button>
        <button
          data-testid="adjust-plus-1"
          onClick={() => onAdjust(1)}
          className={`flex-1 bg-blue-500 hover:bg-blue-600 text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonTextSize} transition-colors`}
        >
          +1秒
        </button>
      </div>
      <div className={styles.buttonRow}>
        <button
          data-testid="adjust-minus-60"
          onClick={() => onAdjust(-60)}
          className={`flex-1 bg-gray-500 hover:bg-gray-600 text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonTextSize} transition-colors`}
        >
          -1分
        </button>
        <button
          data-testid="adjust-minus-10"
          onClick={() => onAdjust(-10)}
          className={`flex-1 bg-gray-500 hover:bg-gray-600 text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonTextSize} transition-colors`}
        >
          -10秒
        </button>
        <button
          data-testid="adjust-minus-1"
          onClick={() => onAdjust(-1)}
          className={`flex-1 bg-gray-500 hover:bg-gray-600 text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonTextSize} transition-colors`}
        >
          -1秒
        </button>
      </div>
    </div>
  );
}
