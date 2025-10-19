import { h } from 'preact';
import { buttonSizeStyles } from '../utils/button-styles';

interface ScoreButtonProps {
  teamId: 'teamA' | 'teamB';
  teamColor: 'red' | 'blue';
  onUpdate: (team: 'teamA' | 'teamB', points: number) => void;
  size?: 'desktop' | 'mobile-basic' | 'mobile-simple';
}

interface ScoreResetButtonProps {
  teamId: 'teamA' | 'teamB';
  onReset: (team: 'teamA' | 'teamB') => void;
  size?: 'desktop' | 'mobile-basic' | 'mobile-simple';
}

// +1ボタン
export function ScoreIncrementButton({ teamId, teamColor, onUpdate, size = 'desktop' }: ScoreButtonProps) {
  const colorStyles = {
    red: {
      desktop: 'bg-red-600 hover:bg-red-700',
      'mobile-basic': 'bg-red-500 hover:bg-red-600',
      'mobile-simple': 'bg-red-500 hover:bg-red-600',
    },
    blue: {
      desktop: 'bg-blue-600 hover:bg-blue-700',
      'mobile-basic': 'bg-blue-500 hover:bg-blue-600',
      'mobile-simple': 'bg-blue-500 hover:bg-blue-600',
    },
  };

  return (
    <button
      onClick={() => onUpdate(teamId, 1)}
      className={`${buttonSizeStyles[size]} ${colorStyles[teamColor][size]} text-white transition-colors active:scale-95`}
      data-testid="score-increment">
      +1
    </button>
  );
}

// -1ボタン
export function ScoreDecrementButton({ teamId, teamColor, onUpdate, size = 'desktop' }: ScoreButtonProps) {
  const colorStyles = {
    red: {
      desktop: 'bg-red-100 hover:bg-red-200 text-red-600',
      'mobile-basic': 'bg-red-300 hover:bg-red-400 text-red-800',
      'mobile-simple': 'bg-red-300 hover:bg-red-400 text-red-800',
    },
    blue: {
      desktop: 'bg-blue-100 hover:bg-blue-200 text-blue-600',
      'mobile-basic': 'bg-blue-300 hover:bg-blue-400 text-blue-800',
      'mobile-simple': 'bg-blue-300 hover:bg-blue-400 text-blue-800',
    },
  };

  return (
    <button
      onClick={() => onUpdate(teamId, -1)}
      className={`${buttonSizeStyles[size]} ${colorStyles[teamColor][size]} transition-colors active:scale-95`}
      data-testid="score-decrement">
      -1
    </button>
  );
}

// スコアリセットボタン
export function ScoreResetButton({ teamId, onReset, size = 'desktop' }: ScoreResetButtonProps) {
  return (
    <button
      onClick={() => onReset(teamId)}
      className={`${buttonSizeStyles[size]} bg-gray-500 hover:bg-gray-600 text-white text-xs transition-colors active:scale-95`}
      data-testid="score-reset">
      スコア<br />リセット
    </button>
  );
}
