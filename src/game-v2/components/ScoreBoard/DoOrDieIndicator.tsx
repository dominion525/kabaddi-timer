import { generateDoOrDieIndicators } from '../../../utils/score-logic';

interface Props {
  count: number;
  teamColor: string;
}

export function DoOrDieIndicator({ count, teamColor }: Props) {
  // チーム色に応じた非アクティブ色を決定（V1と同じ）
  const getInactiveColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-900';
      case 'red':
        return 'bg-red-900';
      default:
        return 'bg-gray-900';
    }
  };

  // スコアロジックを使用してインジケーター配列を生成
  const indicators = generateDoOrDieIndicators(count, 3);
  // 3番目（3rdレイド）のインジケータの状態
  const isThirdActive = indicators[2];

  return (
    <div className="md:h-12 h-10 md:px-4 px-2 md:mb-2 md:pb-0 pb-3">
      <div
        className={`w-full h-full transition-colors duration-200 md:rounded rounded-sm flex items-center justify-center ${
          isThirdActive ? 'bg-yellow-400' : getInactiveColor(teamColor)
        }`}
      >
        <span className={`font-bold md:text-base text-sm ${
          isThirdActive ? 'text-gray-900' : 'text-gray-500'
        }`}>
          Do or Die
        </span>
      </div>
    </div>
  );
}