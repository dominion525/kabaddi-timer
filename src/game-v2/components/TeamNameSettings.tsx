interface Props {
  size: 'desktop' | 'mobile';
  teamAName: string;
  teamBName: string;
  onTeamNameChange: (team: 'teamA' | 'teamB', name: string) => void;
}

const getStyles = (size: Props['size']) => {
  const styleMap = {
    desktop: {
      container: 'p-4',
      titleSize: 'text-lg',
      titleMargin: 'mb-4',
      showPlaceholder: false,
      addFontSizeStyle: false,
    },
    mobile: {
      container: 'p-3',
      titleSize: 'text-base',
      titleMargin: 'mb-3',
      showPlaceholder: true,
      addFontSizeStyle: true,
    },
  };

  return styleMap[size];
};

export function TeamNameSettings({ size, teamAName, teamBName, onTeamNameChange }: Props) {
  const styles = getStyles(size);

  return (
    <div className={`bg-gray-50 ${styles.container} rounded-lg`}>
      <h3 className={`font-bold ${styles.titleSize} ${styles.titleMargin}`}>チーム名設定</h3>
      <div className="space-y-3">
        <div>
          <input
            type="text"
            data-team="teamA"
            data-testid="team-name-input-teamA"
            value={teamAName}
            onInput={(e) => {
              const value = e.currentTarget.value;
              onTeamNameChange('teamA', value);
            }}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder={styles.showPlaceholder ? 'チームA' : undefined}
            style={styles.addFontSizeStyle ? { fontSize: '16px' } : undefined}
            maxLength={20}
          />
        </div>
        <div>
          <input
            type="text"
            data-team="teamB"
            data-testid="team-name-input-teamB"
            value={teamBName}
            onInput={(e) => {
              const value = e.currentTarget.value;
              onTeamNameChange('teamB', value);
            }}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={styles.showPlaceholder ? 'チームB' : undefined}
            style={styles.addFontSizeStyle ? { fontSize: '16px' } : undefined}
            maxLength={20}
          />
        </div>
      </div>
    </div>
  );
}
