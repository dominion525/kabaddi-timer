import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { TeamOperationGrid } from './TeamOperationGrid';

describe('TeamOperationGrid', () => {
  const mockScoreUpdate = vi.fn();
  const mockDoOrDieUpdate = vi.fn();
  const mockResetTeamScore = vi.fn();

  const mockGameState = {
    teamA: {
      name: 'テストチームA',
      score: 10,
      doOrDieCount: 2,
    },
    teamB: {
      name: 'テストチームB',
      score: 15,
      doOrDieCount: 1,
    },
  };

  const defaultProps = {
    leftTeam: {
      name: 'テストチームA',
      score: 10,
      doOrDieCount: 2,
      color: 'red' as const,
    },
    rightTeam: {
      name: 'テストチームB',
      score: 15,
      doOrDieCount: 1,
      color: 'blue' as const,
    },
    leftTeamId: 'teamA' as const,
    rightTeamId: 'teamB' as const,
    gameState: mockGameState,
    scoreUpdate: mockScoreUpdate,
    doOrDieUpdate: mockDoOrDieUpdate,
    resetTeamScore: mockResetTeamScore,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      expect(screen.getByTestId('team-operation-grid')).toBeInTheDocument();
    });

    it('左側チーム名が表示される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      expect(screen.getByText('テストチームA')).toBeInTheDocument();
    });

    it('右側チーム名が表示される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      expect(screen.getByText('テストチームB')).toBeInTheDocument();
    });

    it('得点カテゴリーラベルが表示される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const labels = screen.getAllByText('得点');
      expect(labels.length).toBeGreaterThan(0);
    });

    it('Do or Dieカテゴリーラベルが表示される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const labels = screen.getAllByText('Do or Die');
      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('ボタンのレンダリング', () => {
    it('スコア+1ボタンがレンダリングされる', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const buttons = screen.getAllByTestId('score-increment');
      expect(buttons.length).toBe(2); // 左右各1つ
    });

    it('スコア-1ボタンがレンダリングされる', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const buttons = screen.getAllByTestId('score-decrement');
      expect(buttons.length).toBe(2);
    });

    it('スコアリセットボタンがレンダリングされる', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const buttons = screen.getAllByTestId('score-reset');
      expect(buttons.length).toBe(2);
    });

    it('Do or Die +1ボタンがレンダリングされる', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const buttons = screen.getAllByTestId('dod-increment');
      expect(buttons.length).toBe(2);
    });

    it('Do or Die -1ボタンがレンダリングされる', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const buttons = screen.getAllByTestId('dod-decrement');
      expect(buttons.length).toBe(2);
    });

    it('Do or Dieリセットボタンがレンダリングされる', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const buttons = screen.getAllByTestId('dod-reset');
      expect(buttons.length).toBe(2);
    });
  });

  describe('デスクトップサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const container = screen.getByTestId('team-operation-grid');
      expect(container.className).toContain('p-4');
    });

    it('適切なチーム名スタイルが適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const teamNameElement = screen.getByText('テストチームA');
      expect(teamNameElement.className).toContain('text-lg');
    });
  });

  describe('mobile-basicサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="mobile-basic" />);
      const container = screen.getByTestId('team-operation-grid');
      expect(container.className).toContain('p-4');
    });

    it('適切なチーム名スタイルが適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="mobile-basic" />);
      const teamNameElement = screen.getByText('テストチームA');
      expect(teamNameElement.className).toContain('text-base');
    });
  });

  describe('mobile-simpleサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="mobile-simple" />);
      const container = screen.getByTestId('team-operation-grid');
      expect(container.className).toContain('p-2');
    });

    it('適切なチーム名スタイルが適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="mobile-simple" />);
      const teamNameElement = screen.getByText('テストチームA');
      expect(teamNameElement.className).toContain('text-xs');
    });
  });

  describe('チーム色の適用', () => {
    it('赤チームの名前に適切な色が適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const redTeamName = screen.getByText('テストチームA');
      expect(redTeamName.className).toContain('text-red');
    });

    it('青チームの名前に適切な色が適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const blueTeamName = screen.getByText('テストチームB');
      expect(blueTeamName.className).toContain('text-blue');
    });

    it('左右が逆転しても正しい色が適用される', () => {
      const reversedProps = {
        ...defaultProps,
        leftTeam: defaultProps.rightTeam,
        rightTeam: defaultProps.leftTeam,
        leftTeamId: defaultProps.rightTeamId,
        rightTeamId: defaultProps.leftTeamId,
      };
      render(<TeamOperationGrid {...reversedProps} size="desktop" />);
      const blueTeamName = screen.getByText('テストチームB');
      const redTeamName = screen.getByText('テストチームA');
      expect(blueTeamName.className).toContain('text-blue');
      expect(redTeamName.className).toContain('text-red');
    });
  });

  describe('レイアウト構造', () => {
    it('中央セパレーターが存在する', () => {
      const { container } = render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const separator = container.querySelector('.bg-gray-300');
      expect(separator).toBeInTheDocument();
    });

    it('グラデーション背景が適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const grid = screen.getByTestId('team-operation-grid');
      expect(grid.className).toContain('bg-gradient-to-r');
      expect(grid.className).toContain('from-red-50');
      expect(grid.className).toContain('via-gray-50');
      expect(grid.className).toContain('to-blue-50');
    });

    it('ボーダーとroundedが適用される', () => {
      render(<TeamOperationGrid {...defaultProps} size="desktop" />);
      const grid = screen.getByTestId('team-operation-grid');
      expect(grid.className).toContain('rounded-lg');
      expect(grid.className).toContain('border');
      expect(grid.className).toContain('border-gray-200');
    });
  });

  describe('異なるチーム構成', () => {
    it('両チームが赤色でも正しくレンダリングされる', () => {
      const bothRedProps = {
        ...defaultProps,
        leftTeam: { ...defaultProps.leftTeam, color: 'red' as const },
        rightTeam: { ...defaultProps.rightTeam, color: 'red' as const },
      };
      render(<TeamOperationGrid {...bothRedProps} size="desktop" />);
      expect(screen.getByTestId('team-operation-grid')).toBeInTheDocument();
    });

    it('両チームが青色でも正しくレンダリングされる', () => {
      const bothBlueProps = {
        ...defaultProps,
        leftTeam: { ...defaultProps.leftTeam, color: 'blue' as const },
        rightTeam: { ...defaultProps.rightTeam, color: 'blue' as const },
      };
      render(<TeamOperationGrid {...bothBlueProps} size="desktop" />);
      expect(screen.getByTestId('team-operation-grid')).toBeInTheDocument();
    });

    it('スコアとDo or Dieカウントが0でも正しくレンダリングされる', () => {
      const zeroScoreProps = {
        ...defaultProps,
        leftTeam: { ...defaultProps.leftTeam, score: 0, doOrDieCount: 0 },
        rightTeam: { ...defaultProps.rightTeam, score: 0, doOrDieCount: 0 },
        gameState: {
          teamA: { ...mockGameState.teamA, score: 0, doOrDieCount: 0 },
          teamB: { ...mockGameState.teamB, score: 0, doOrDieCount: 0 },
        },
      };
      render(<TeamOperationGrid {...zeroScoreProps} size="desktop" />);
      expect(screen.getByTestId('team-operation-grid')).toBeInTheDocument();
    });

    it('長いチーム名でも正しくレンダリングされる', () => {
      const longNameProps = {
        ...defaultProps,
        leftTeam: { ...defaultProps.leftTeam, name: 'とても長いチーム名のテストチームA' },
        rightTeam: { ...defaultProps.rightTeam, name: 'とても長いチーム名のテストチームB' },
      };
      render(<TeamOperationGrid {...longNameProps} size="desktop" />);
      expect(screen.getByText('とても長いチーム名のテストチームA')).toBeInTheDocument();
      expect(screen.getByText('とても長いチーム名のテストチームB')).toBeInTheDocument();
    });
  });
});
