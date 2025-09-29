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

  return (
    <div className="md:h-8 h-6 flex md:space-x-2 space-x-1 md:px-4 px-2 md:mb-2 md:pb-0 pb-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex-1 transition-colors duration-200 md:rounded rounded-sm ${
            count >= i ? 'bg-yellow-400' : getInactiveColor(teamColor)
          }`}
        />
      ))}
    </div>
  );
}