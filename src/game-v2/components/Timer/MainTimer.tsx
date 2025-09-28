interface Props {
  minutes: number;
  seconds: number;
  isRunning: boolean;
}

export function MainTimer({ minutes, seconds, isRunning }: Props) {
  // 時間を MM:SS 形式でフォーマット
  const formatTime = (min: number, sec: number) => {
    const formattedMin = min.toString().padStart(2, '0');
    const formattedSec = sec.toString().padStart(2, '0');
    return `${formattedMin}:${formattedSec}`;
  };

  return (
    <div className="text-center">
      <div
        className="font-bold font-mono text-white"
        style={{ fontSize: '13.5rem', lineHeight: 0.7 }}
      >
        {formatTime(minutes, seconds)}
      </div>
      <div className="text-xl opacity-75 mt-4">
        {isRunning ? (
          <span className="text-green-400">● 動作中</span>
        ) : (
          <span className="text-gray-400">● 停止</span>
        )}
      </div>
    </div>
  );
}