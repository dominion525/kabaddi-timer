interface Props {
  onTimerStart: () => void;
  onTimerPause: () => void;
  onTimerReset: () => void;
  onSubTimerStart: () => void;
  onSubTimerPause: () => void;
  onSubTimerReset: () => void;
}

export function SimpleTimerControl({
  onTimerStart,
  onTimerPause,
  onTimerReset,
  onSubTimerStart,
  onSubTimerPause,
  onSubTimerReset,
}: Props) {
  return (
    <div data-testid="simple-timer-control" className="bg-gray-50 p-2 rounded-lg">
      <div className="flex gap-1">
        {/* メインタイマー */}
        <div className="flex gap-1 flex-1">
          <button
            data-testid="main-timer-start"
            onClick={onTimerStart}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            開始
          </button>
          <button
            data-testid="main-timer-pause"
            onClick={onTimerPause}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            停止
          </button>
          <button
            data-testid="main-timer-reset"
            onClick={onTimerReset}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1 whitespace-nowrap"
          >
            リセット
          </button>
        </div>

        {/* セパレーター */}
        <div className="w-px bg-gray-300 mx-1"></div>

        {/* サブタイマー */}
        <div className="flex gap-1 flex-1">
          <button
            data-testid="sub-timer-start"
            onClick={onSubTimerStart}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            30秒<br />開始
          </button>
          <button
            data-testid="sub-timer-pause"
            onClick={onSubTimerPause}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            30秒<br />停止
          </button>
          <button
            data-testid="sub-timer-reset"
            onClick={onSubTimerReset}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-1 rounded text-xs font-bold transition-colors flex-1"
          >
            30秒<br />リセット
          </button>
        </div>
      </div>
    </div>
  );
}
