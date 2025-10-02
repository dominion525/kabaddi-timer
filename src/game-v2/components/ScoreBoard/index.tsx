import { TeamScore } from './TeamScore';

interface Team {
  name: string;
  score: number;
  doOrDieCount: number;
  color: string;
}

interface Props {
  team: Team;
  position: 'left' | 'right';
}

export function ScoreBoard({ team, position }: Props) {
  return <TeamScore team={team} />;
}