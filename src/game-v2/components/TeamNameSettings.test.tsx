import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { TeamNameSettings } from './TeamNameSettings';

describe('TeamNameSettings', () => {
  const mockOnTeamNameChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName="チームA"
          teamBName="チームB"
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      expect(screen.getByText('チーム名設定')).toBeInTheDocument();
    });

    it('チームAの入力フィールドが存在する', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName="チームA"
          teamBName="チームB"
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      expect(screen.getByTestId('team-name-input-teamA')).toBeInTheDocument();
    });

    it('チームBの入力フィールドが存在する', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName="チームA"
          teamBName="チームB"
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      expect(screen.getByTestId('team-name-input-teamB')).toBeInTheDocument();
    });

    it('チームAの初期値が正しく表示される', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName="テストチームA"
          teamBName="チームB"
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamA') as HTMLInputElement;
      expect(input.value).toBe('テストチームA');
    });

    it('チームBの初期値が正しく表示される', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName="チームA"
          teamBName="テストチームB"
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamB') as HTMLInputElement;
      expect(input.value).toBe('テストチームB');
    });
  });

  describe('入力動作', () => {
    it('チームAの入力時にonTeamNameChangeが正しく呼ばれる', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamA');
      fireEvent.input(input, { target: { value: '新チームA' } });
      expect(mockOnTeamNameChange).toHaveBeenCalledTimes(1);
      expect(mockOnTeamNameChange).toHaveBeenCalledWith('teamA', '新チームA');
    });

    it('チームBの入力時にonTeamNameChangeが正しく呼ばれる', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamB');
      fireEvent.input(input, { target: { value: '新チームB' } });
      expect(mockOnTeamNameChange).toHaveBeenCalledTimes(1);
      expect(mockOnTeamNameChange).toHaveBeenCalledWith('teamB', '新チームB');
    });

    it('複数回の入力が正しく処理される', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamA');
      fireEvent.input(input, { target: { value: 'A' } });
      fireEvent.input(input, { target: { value: 'AB' } });
      fireEvent.input(input, { target: { value: 'ABC' } });
      expect(mockOnTeamNameChange).toHaveBeenCalledTimes(3);
      expect(mockOnTeamNameChange).toHaveBeenNthCalledWith(1, 'teamA', 'A');
      expect(mockOnTeamNameChange).toHaveBeenNthCalledWith(2, 'teamA', 'AB');
      expect(mockOnTeamNameChange).toHaveBeenNthCalledWith(3, 'teamA', 'ABC');
    });
  });

  describe('デスクトップサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      const { container } = render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const div = container.querySelector('.bg-gray-50');
      expect(div?.className).toContain('p-4');
    });

    it('適切なタイトルサイズが適用される', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const title = screen.getByText('チーム名設定');
      expect(title.className).toContain('text-lg');
      expect(title.className).toContain('mb-4');
    });

    it('placeholderが表示されない', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const inputA = screen.getByTestId('team-name-input-teamA') as HTMLInputElement;
      const inputB = screen.getByTestId('team-name-input-teamB') as HTMLInputElement;
      expect(inputA.placeholder).toBe('');
      expect(inputB.placeholder).toBe('');
    });

    it('fontSizeスタイルが適用されない', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const inputA = screen.getByTestId('team-name-input-teamA') as HTMLInputElement;
      const inputB = screen.getByTestId('team-name-input-teamB') as HTMLInputElement;
      expect(inputA.style.fontSize).toBe('');
      expect(inputB.style.fontSize).toBe('');
    });
  });

  describe('モバイルサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      const { container } = render(
        <TeamNameSettings
          size="mobile"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const div = container.querySelector('.bg-gray-50');
      expect(div?.className).toContain('p-3');
    });

    it('適切なタイトルサイズが適用される', () => {
      render(
        <TeamNameSettings
          size="mobile"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const title = screen.getByText('チーム名設定');
      expect(title.className).toContain('text-base');
      expect(title.className).toContain('mb-3');
    });

    it('placeholderが表示される', () => {
      render(
        <TeamNameSettings
          size="mobile"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const inputA = screen.getByTestId('team-name-input-teamA') as HTMLInputElement;
      const inputB = screen.getByTestId('team-name-input-teamB') as HTMLInputElement;
      expect(inputA.placeholder).toBe('チームA');
      expect(inputB.placeholder).toBe('チームB');
    });

    it('fontSizeスタイルが適用される（iOS zoom prevention）', () => {
      render(
        <TeamNameSettings
          size="mobile"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const inputA = screen.getByTestId('team-name-input-teamA') as HTMLInputElement;
      const inputB = screen.getByTestId('team-name-input-teamB') as HTMLInputElement;
      expect(inputA.style.fontSize).toBe('16px');
      expect(inputB.style.fontSize).toBe('16px');
    });
  });

  describe('入力制限', () => {
    it('maxLengthが20に設定されている（チームA）', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamA') as HTMLInputElement;
      expect(input.maxLength).toBe(20);
    });

    it('maxLengthが20に設定されている（チームB）', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamB') as HTMLInputElement;
      expect(input.maxLength).toBe(20);
    });
  });

  describe('スタイル適用', () => {
    it('チームAの入力フィールドに赤色のfocusスタイルが適用される', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamA');
      expect(input.className).toContain('focus:ring-red-500');
      expect(input.className).toContain('focus:border-red-500');
    });

    it('チームBの入力フィールドに青色のfocusスタイルが適用される', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const input = screen.getByTestId('team-name-input-teamB');
      expect(input.className).toContain('focus:ring-blue-500');
      expect(input.className).toContain('focus:border-blue-500');
    });

    it('共通スタイルが適用される', () => {
      render(
        <TeamNameSettings
          size="desktop"
          teamAName=""
          teamBName=""
          onTeamNameChange={mockOnTeamNameChange}
        />
      );
      const inputA = screen.getByTestId('team-name-input-teamA');
      const inputB = screen.getByTestId('team-name-input-teamB');

      expect(inputA.className).toContain('w-full');
      expect(inputA.className).toContain('p-3');
      expect(inputA.className).toContain('border');
      expect(inputA.className).toContain('rounded-lg');

      expect(inputB.className).toContain('w-full');
      expect(inputB.className).toContain('p-3');
      expect(inputB.className).toContain('border');
      expect(inputB.className).toContain('rounded-lg');
    });
  });
});
