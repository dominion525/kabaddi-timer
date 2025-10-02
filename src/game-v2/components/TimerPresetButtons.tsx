interface Props {
  size: 'desktop' | 'mobile' | 'mobile-simple';
  onSetTimer: (minutes: number, seconds: number) => void;
}

const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'flex space-x-1',
      buttonBg: 'bg-gray-600 hover:bg-gray-700',
      buttonPadding: 'p-2',
      buttonText: 'text-sm',
      buttonRounded: 'rounded',
      buttonFont: '',
    },
    mobile: {
      container: 'flex space-x-2',
      buttonBg: 'bg-gray-600 hover:bg-gray-700',
      buttonPadding: 'p-3',
      buttonText: '',
      buttonRounded: 'rounded-lg',
      buttonFont: '',
    },
    'mobile-simple': {
      container: 'flex gap-1 flex-1',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      buttonPadding: 'py-2 px-1',
      buttonText: 'text-xs',
      buttonRounded: 'rounded',
      buttonFont: 'font-bold',
    },
  };

  return styleMap[size];
};

export function TimerPresetButtons({ size, onSetTimer }: Props) {
  const styles = getStyles(size);

  return (
    <div data-testid="timer-preset-buttons" className={styles.container}>
      <button
        data-testid="preset-20min"
        onClick={() => onSetTimer(20, 0)}
        className={`flex-1 ${styles.buttonBg} text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonText} ${styles.buttonFont} transition-colors`}
      >
        20分
      </button>
      <button
        data-testid="preset-15min"
        onClick={() => onSetTimer(15, 0)}
        className={`flex-1 ${styles.buttonBg} text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonText} ${styles.buttonFont} transition-colors`}
      >
        15分
      </button>
      <button
        data-testid="preset-3min"
        onClick={() => onSetTimer(3, 0)}
        className={`flex-1 ${styles.buttonBg} text-white ${styles.buttonPadding} ${styles.buttonRounded} ${styles.buttonText} ${styles.buttonFont} transition-colors`}
      >
        3分
      </button>
    </div>
  );
}
