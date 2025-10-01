import { TimerInputField } from './TimerInputField';
import { TimerPresetButtons } from './TimerPresetButtons';
import { TimerAdjustButtons } from './TimerAdjustButtons';

interface Props {
  size: 'desktop' | 'mobile';
  timerInputMinutes: number;
  timerInputSeconds: number;
  onTimerInputMinutesChange: (value: number) => void;
  onTimerInputSecondsChange: (value: number) => void;
  onTimerSet: (minutes: number, seconds: number) => void;
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerReset: () => void;
  onTimerAdjust: (seconds: number) => void;
}

const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'bg-gray-50 p-4 rounded-lg',
      heading: 'font-bold text-lg mb-4',
      timeSetting: 'mb-4',
      label: 'block text-sm font-medium text-gray-700 mb-2',
      controlButtons: 'mb-4 flex space-x-2',
      startButton: 'flex-1 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-bold transition-colors',
      pauseButton: 'flex-1 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold transition-colors',
      resetButton: 'flex-1 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg font-bold transition-colors',
    },
    mobile: {
      container: 'bg-gray-50 p-3 rounded-lg',
      heading: 'font-bold text-base mb-3',
      timeSetting: 'mb-4',
      label: 'block text-sm font-medium text-gray-700 mb-2',
      controlButtons: 'mb-4 flex space-x-2',
      startButton: 'flex-1 bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg font-bold text-lg transition-colors',
      pauseButton: 'flex-1 bg-red-500 hover:bg-red-600 text-white p-4 rounded-lg font-bold text-lg transition-colors',
      resetButton: 'flex-1 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-lg font-bold text-lg transition-colors',
    },
  };

  return styleMap[size];
};

export function MainTimerControl({
  size,
  timerInputMinutes,
  timerInputSeconds,
  onTimerInputMinutesChange,
  onTimerInputSecondsChange,
  onTimerSet,
  onTimerStart,
  onTimerPause,
  onTimerReset,
  onTimerAdjust,
}: Props) {
  const styles = getStyles(size);

  return (
    <div data-testid="main-timer-control" className={styles.container}>
      <h3 className={styles.heading}>タイマー操作</h3>

      {/* 時間設定 */}
      <div className={styles.timeSetting}>
        <label className={styles.label}>時間設定</label>
        <TimerInputField
          size={size}
          minutes={timerInputMinutes}
          seconds={timerInputSeconds}
          onMinutesChange={onTimerInputMinutesChange}
          onSecondsChange={onTimerInputSecondsChange}
          onSet={() => onTimerSet(timerInputMinutes, timerInputSeconds)}
        />
        {/* プリセット */}
        <TimerPresetButtons size={size} onSetTimer={onTimerSet} />
      </div>

      {/* スタート/ストップ/リセット */}
      <div className={styles.controlButtons}>
        <button
          data-testid="timer-start-button"
          onClick={onTimerStart}
          className={styles.startButton}
        >
          スタート
        </button>
        <button
          data-testid="timer-pause-button"
          onClick={onTimerPause}
          className={styles.pauseButton}
        >
          ストップ
        </button>
        <button
          data-testid="timer-reset-button"
          onClick={onTimerReset}
          className={styles.resetButton}
        >
          リセット
        </button>
      </div>

      {/* 時間調整ボタン */}
      <TimerAdjustButtons size={size} onAdjust={onTimerAdjust} />
    </div>
  );
}
