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
        className="font-bold font-mono text-white md:text-[13.5rem] text-[6rem] md:leading-[0.7] leading-[0.6]"
      >
        {formatTime(minutes, seconds)}
      </div>
      <div className="md:text-xl text-sm opacity-75 md:mt-4 mt-2">
        {isRunning ? (
          <span className="text-green-400">● 動作中</span>
        ) : (
          <span className="text-gray-400">● 停止</span>
        )}
      </div>
    </div>
  );
}