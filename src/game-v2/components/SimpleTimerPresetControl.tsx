import { TimerPresetButtons } from './TimerPresetButtons';

interface Props {
  onTimerSet: (minutes: number, seconds: number) => void;
  onTimerAdjust: (seconds: number) => void;
  onCourtChange: () => void;
}

export function SimpleTimerPresetControl({ onTimerSet, onTimerAdjust, onCourtChange }: Props) {
  return (
    <div data-testid="simple-timer-preset-control" className="bg-blue-50 p-2 rounded-lg border border-blue-200">
      <div className="flex gap-1">
        {/* 左側プリセット */}
        <TimerPresetButtons size="mobile-simple" onSetTimer={onTimerSet} />

        {/* セパレーター */}
        <div className="w-px bg-blue-300 mx-1"></div>

        {/* 右側操作ボタン */}
        <div className="flex gap-1 flex-1">
          <button
            data-testid="adjust-plus-1"
            onClick={() => onTimerAdjust(1)}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            +1秒
          </button>
          <button
            data-testid="adjust-minus-1"
            onClick={() => onTimerAdjust(-1)}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            -1秒
          </button>
          <button
            data-testid="court-change-button"
            onClick={onCourtChange}
            className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            コート<br />チェンジ
          </button>
        </div>
      </div>
    </div>
  );
}
