interface Props {
  size: 'desktop' | 'mobile';
  minutes: number;
  seconds: number;
  onMinutesChange: (value: number) => void;
  onSecondsChange: (value: number) => void;
  onSet: () => void;
}

const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'flex space-x-2 mb-3',
      inputWidth: 'w-16',
      inputPadding: 'p-2',
      inputRounded: 'rounded',
      inputFontSize: undefined,
      inputPlaceholder: { minutes: undefined, seconds: undefined },
      labelSize: 'text-sm',
      buttonPadding: 'px-3 py-2',
      buttonTextSize: 'text-sm',
      buttonRounded: 'rounded',
    },
    mobile: {
      container: 'flex space-x-2 mb-3',
      inputWidth: 'w-18',
      inputPadding: 'p-3',
      inputRounded: 'rounded-lg',
      inputFontSize: '16px',
      inputPlaceholder: { minutes: '60', seconds: '00' },
      labelSize: '',
      buttonPadding: 'px-4 py-3',
      buttonTextSize: '',
      buttonRounded: 'rounded-lg',
    },
  };

  return styleMap[size];
};

export function TimerInputField({ size, minutes, seconds, onMinutesChange, onSecondsChange, onSet }: Props) {
  const styles = getStyles(size);

  return (
    <div data-testid="timer-input-field" className={styles.container}>
      <input
        data-testid="minutes-input"
        type="number"
        min="0"
        max="99"
        value={minutes}
        onInput={(e) => onMinutesChange(Number(e.currentTarget.value))}
        className={`${styles.inputWidth} ${styles.inputPadding} border ${styles.inputRounded} focus:ring-2 focus:ring-blue-500 text-center`}
        style={styles.inputFontSize ? { fontSize: styles.inputFontSize } : undefined}
        placeholder={styles.inputPlaceholder.minutes}
      />
      <span className={`flex items-center ${styles.labelSize}`}>分</span>
      <input
        data-testid="seconds-input"
        type="number"
        min="0"
        max="59"
        value={String(seconds).padStart(2, '0')}
        onInput={(e) => onSecondsChange(Number(e.currentTarget.value))}
        className={`${styles.inputWidth} ${styles.inputPadding} border ${styles.inputRounded} focus:ring-2 focus:ring-blue-500 text-center`}
        style={styles.inputFontSize ? { fontSize: styles.inputFontSize } : undefined}
        placeholder={styles.inputPlaceholder.seconds}
      />
      <span className={`flex items-center ${styles.labelSize}`}>秒</span>
      <button
        data-testid="set-button"
        onClick={onSet}
        className={`bg-blue-500 hover:bg-blue-600 text-white ${styles.buttonPadding} ${styles.buttonRounded} transition-colors ${styles.buttonTextSize}`}
      >
        設定
      </button>
    </div>
  );
}
