interface Props {
  seconds: number;
  isRunning: boolean;
}

export function SubTimer({ seconds, isRunning }: Props) {
  // V1と同じフォーマット: ゼロパディング（例: 5 → "05"）
  const formattedSeconds = seconds.toString().padStart(2, '0');

  return (
    <div className="text-center">
      <div
        className="font-bold font-mono text-yellow-400 md:text-[12rem] text-[4rem]"
        style={{ lineHeight: 1 }}
      >
        {formattedSeconds}
      </div>
      <div className="text-xs opacity-75 mt-1">
        {isRunning ? (
          <span className="text-green-400">● 動作中</span>
        ) : (
          <span className="text-gray-400">● 停止</span>
        )}
      </div>
    </div>
  );
}