interface Props {
  size: 'desktop' | 'mobile';
  onCourtChange: () => void;
  onResetAll: () => void;
}

const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'p-4 lg:col-span-2',
      titleSize: 'text-lg',
      titleMargin: 'mb-4',
      layout: 'flex space-x-4 justify-center',
      buttonPadding: 'px-3 py-1',
      buttonTextSize: 'text-lg',
    },
    mobile: {
      container: 'p-3',
      titleSize: 'text-base',
      titleMargin: 'mb-3',
      layout: 'grid grid-cols-2 gap-3',
      buttonPadding: 'px-4 py-1',
      buttonTextSize: 'text-base',
    },
  };

  return styleMap[size];
};

export function OverallControlSection({ size, onCourtChange, onResetAll }: Props) {
  const styles = getStyles(size);

  return (
    <div data-testid="overall-control-section" className={`bg-gray-50 ${styles.container} rounded-lg`}>
      <h3 className={`font-bold ${styles.titleSize} ${styles.titleMargin}`}>全体コントロール</h3>
      <div className={styles.layout}>
        <button
          data-testid="court-change-btn"
          onClick={onCourtChange}
          className={`bg-orange-500 hover:bg-orange-600 text-white ${styles.buttonPadding} rounded-lg font-bold ${styles.buttonTextSize} transition-colors`}
        >
          コートチェンジ
        </button>
        <button
          data-testid="reset-all-btn"
          onClick={onResetAll}
          className={`bg-red-600 hover:bg-red-700 text-white ${styles.buttonPadding} rounded-lg font-bold ${styles.buttonTextSize} transition-colors`}
        >
          全リセット
        </button>
      </div>
    </div>
  );
}
