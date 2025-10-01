import { ScoreIncrementButton, ScoreDecrementButton, ScoreResetButton } from './ScoreControl';
import { DoOrDieIncrementButton, DoOrDieDecrementButton, DoOrDieResetButton } from './DoOrDieControl';

interface TeamData {
  name: string;
  score: number;
  doOrDieCount: number;
  color: 'red' | 'blue';
}

interface Props {
  size: 'desktop' | 'mobile-basic' | 'mobile-simple';
  leftTeam: TeamData;
  rightTeam: TeamData;
  leftTeamId: 'teamA' | 'teamB';
  rightTeamId: 'teamA' | 'teamB';
  gameState: any;
  scoreUpdate: (team: 'teamA' | 'teamB', points: number) => void;
  doOrDieUpdate: (team: 'teamA' | 'teamB', delta: number) => void;
  resetTeamScore: (team: 'teamA' | 'teamB') => void;
}

// sizeに応じたスタイルを返すヘルパー
const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'p-4',
      separator: 'inset-y-4',
      headerMargin: 'mb-4',
      teamNameSize: 'text-lg',
      teamNameColor: '600',
      teamNameMargin: 'mb-2',
      gridGap: 'gap-x-8',
      columnGap: 'gap-x-2',
      rowSpacing: 'space-y-3',
    },
    'mobile-basic': {
      container: 'p-4',
      separator: 'inset-y-4',
      headerMargin: 'mb-4',
      teamNameSize: 'text-base',
      teamNameColor: '700',
      teamNameMargin: 'mb-2',
      gridGap: 'gap-x-6',
      columnGap: 'gap-x-1',
      rowSpacing: 'space-y-2',
    },
    'mobile-simple': {
      container: 'p-2',
      separator: 'inset-y-2',
      headerMargin: 'mb-2',
      teamNameSize: 'text-xs',
      teamNameColor: '700',
      teamNameMargin: 'mb-1',
      gridGap: 'gap-x-3',
      columnGap: 'gap-x-1',
      rowSpacing: 'space-y-1',
    },
  };

  return styleMap[size];
};

export function TeamOperationGrid({
  size,
  leftTeam,
  rightTeam,
  leftTeamId,
  rightTeamId,
  gameState,
  scoreUpdate,
  doOrDieUpdate,
  resetTeamScore,
}: Props) {
  const styles = getStyles(size);

  return (
    <div data-testid="team-operation-grid" className={`bg-gradient-to-r from-red-50 via-gray-50 to-blue-50 ${styles.container} rounded-lg border border-gray-200 relative`}>
      {/* 中央セパレーター */}
      <div className={`absolute ${styles.separator} left-1/2 w-px bg-gray-300 transform -translate-x-px`}></div>

      {/* ヘッダー行 */}
      <div className={`${styles.headerMargin} relative z-10`}>
        {/* チーム名行 */}
        <div className={`flex justify-between ${styles.gridGap} ${styles.teamNameMargin}`}>
          <div className="text-center flex-1">
            <div className={`${styles.teamNameSize} font-bold ${leftTeam.color === 'red' ? `text-red-${styles.teamNameColor}` : `text-blue-${styles.teamNameColor}`}`}>
              {leftTeam.name}
            </div>
          </div>
          <div className="text-center flex-1">
            <div className={`${styles.teamNameSize} font-bold ${rightTeam.color === 'red' ? `text-red-${styles.teamNameColor}` : `text-blue-${styles.teamNameColor}`}`}>
              {rightTeam.name}
            </div>
          </div>
        </div>
        {/* カテゴリー行 */}
        <div className={`flex justify-between ${styles.gridGap}`}>
          <div className={`flex-1 grid grid-cols-2 ${styles.columnGap}`}>
            <div className="text-center">
              <div className={`text-xs ${leftTeam.color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>得点</div>
            </div>
            <div className="text-center">
              <div className={`text-xs ${leftTeam.color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>Do or Die</div>
            </div>
          </div>
          <div className={`flex-1 grid grid-cols-2 ${styles.columnGap}`}>
            <div className="text-center">
              <div className={`text-xs ${rightTeam.color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>Do or Die</div>
            </div>
            <div className="text-center">
              <div className={`text-xs ${rightTeam.color === 'red' ? 'text-red-600' : 'text-blue-600'}`}>得点</div>
            </div>
          </div>
        </div>
      </div>

      {/* ボタングリッド */}
      <div className={`flex justify-between ${styles.gridGap} relative z-10`}>
        {/* 左側表示チーム */}
        <div className={`flex-1 ${styles.rowSpacing}`}>
          {/* +1ボタン行 */}
          <div className={`grid grid-cols-2 ${styles.columnGap}`}>
            <ScoreIncrementButton
              teamId={leftTeamId}
              teamColor={leftTeam.color}
              onUpdate={scoreUpdate}
              size={size}
            />
            <DoOrDieIncrementButton
              teamId={leftTeamId}
              onUpdate={doOrDieUpdate}
              size={size}
            />
          </div>
          {/* -1ボタン行 */}
          <div className={`grid grid-cols-2 ${styles.columnGap}`}>
            <ScoreDecrementButton
              teamId={leftTeamId}
              teamColor={leftTeam.color}
              onUpdate={scoreUpdate}
              size={size}
            />
            <DoOrDieDecrementButton
              teamId={leftTeamId}
              onUpdate={doOrDieUpdate}
              size={size}
            />
          </div>
          {/* リセットボタン行 */}
          <div className={`grid grid-cols-2 ${styles.columnGap}`}>
            <ScoreResetButton
              teamId={leftTeamId}
              onReset={resetTeamScore}
              size={size}
            />
            <DoOrDieResetButton
              teamId={leftTeamId}
              currentCount={leftTeamId === 'teamA' ? gameState.teamA.doOrDieCount : gameState.teamB.doOrDieCount}
              onUpdate={doOrDieUpdate}
              size={size}
            />
          </div>
        </div>

        {/* 右側表示チーム */}
        <div className={`flex-1 ${styles.rowSpacing}`}>
          {/* +1ボタン行 */}
          <div className={`grid grid-cols-2 ${styles.columnGap}`}>
            <DoOrDieIncrementButton
              teamId={rightTeamId}
              onUpdate={doOrDieUpdate}
              size={size}
            />
            <ScoreIncrementButton
              teamId={rightTeamId}
              teamColor={rightTeam.color}
              onUpdate={scoreUpdate}
              size={size}
            />
          </div>
          {/* -1ボタン行 */}
          <div className={`grid grid-cols-2 ${styles.columnGap}`}>
            <DoOrDieDecrementButton
              teamId={rightTeamId}
              onUpdate={doOrDieUpdate}
              size={size}
            />
            <ScoreDecrementButton
              teamId={rightTeamId}
              teamColor={rightTeam.color}
              onUpdate={scoreUpdate}
              size={size}
            />
          </div>
          {/* リセットボタン行 */}
          <div className={`grid grid-cols-2 ${styles.columnGap}`}>
            <DoOrDieResetButton
              teamId={rightTeamId}
              currentCount={rightTeamId === 'teamA' ? gameState.teamA.doOrDieCount : gameState.teamB.doOrDieCount}
              onUpdate={doOrDieUpdate}
              size={size}
            />
            <ScoreResetButton
              teamId={rightTeamId}
              onReset={resetTeamScore}
              size={size}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
