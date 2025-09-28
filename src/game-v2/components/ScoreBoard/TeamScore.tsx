import { DoOrDieIndicator } from './DoOrDieIndicator';

interface Team {
  name: string;
  score: number;
  doOrDieCount: number;
  color: string;
}

interface Props {
  team: Team;
}

export function TeamScore({ team }: Props) {
  // チーム色に応じた背景色を決定
  const getBackgroundColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600';
      case 'red':
        return 'bg-red-600';
      case 'green':
        return 'bg-green-600';
      case 'purple':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className={`text-white flex flex-col ${getBackgroundColor(team.color)}`}>
      <div className="flex-1 flex items-center justify-center md:py-1 md:px-4 py-0 px-1">
        <div
          className="font-bold font-mono text-white md:text-[12rem] text-[4rem]"
          style={{ lineHeight: 1 }}
        >
          {team.score}
        </div>
      </div>
      {/* Do or Dieインジケーター */}
      <DoOrDieIndicator count={team.doOrDieCount} teamColor={team.color} />
    </div>
  );
}