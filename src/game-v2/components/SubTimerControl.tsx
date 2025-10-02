interface Props {
  size: 'desktop' | 'mobile';
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'p-4',
      titleSize: 'text-lg',
      titleMargin: 'mb-4',
      buttonPadding: 'p-3',
      buttonTextSize: '',
    },
    mobile: {
      container: 'p-4',
      titleSize: 'text-lg',
      titleMargin: 'mb-4',
      buttonPadding: 'p-4',
      buttonTextSize: 'text-lg',
    },
  };

  return styleMap[size];
};

export function SubTimerControl({ size, onStart, onPause, onReset }: Props) {
  const styles = getStyles(size);

  return (
    <div data-testid="sub-timer-control" className={`bg-yellow-50 ${styles.container} rounded-lg border border-yellow-200`}>
      <h3 className={`font-bold ${styles.titleSize} ${styles.titleMargin} text-yellow-800`}>サブタイマー操作 (30秒レイドタイマー)</h3>

      <div className="flex space-x-2">
        <button
          data-testid="sub-timer-start"
          onClick={onStart}
          className={`flex-1 bg-yellow-500 hover:bg-yellow-600 text-white ${styles.buttonPadding} rounded-lg font-bold ${styles.buttonTextSize} transition-colors`}
        >
          スタート
        </button>
        <button
          data-testid="sub-timer-pause"
          onClick={onPause}
          className={`flex-1 bg-red-500 hover:bg-red-600 text-white ${styles.buttonPadding} rounded-lg font-bold ${styles.buttonTextSize} transition-colors`}
        >
          ストップ
        </button>
        <button
          data-testid="sub-timer-reset"
          onClick={onReset}
          className={`flex-1 bg-orange-500 hover:bg-orange-600 text-white ${styles.buttonPadding} rounded-lg font-bold ${styles.buttonTextSize} transition-colors`}
        >
          リセット
        </button>
      </div>
    </div>
  );
}
