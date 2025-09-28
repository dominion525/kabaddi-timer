interface Props {
  seconds: number;
  isRunning: boolean;
}

export function SubTimer({ seconds, isRunning }: Props) {
  return (
    <div className="text-center">
      <div
        className="font-bold font-mono text-yellow-400 md:text-[12rem] text-[4rem]"
        style={{ lineHeight: 1 }}
      >
        {seconds}
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