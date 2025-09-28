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
    <div className="h-8 flex space-x-2 px-6 mb-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex-1 transition-colors duration-200 rounded ${
            count >= i ? 'bg-yellow-400' : getInactiveColor(teamColor)
          }`}
        />
      ))}
    </div>
  );
}