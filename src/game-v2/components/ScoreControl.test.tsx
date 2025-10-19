import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import {
  ScoreIncrementButton,
  ScoreDecrementButton,
  ScoreResetButton,
} from './ScoreControl';

describe('ScoreIncrementButton', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボタンが正しくレンダリングされる', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('data-testid属性が存在する', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} />);
    expect(screen.getByTestId('score-increment')).toBeInTheDocument();
  });

  it('teamAのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('score-increment');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamA', 1);
  });

  it('teamBのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<ScoreIncrementButton teamId="teamB" teamColor="blue" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('score-increment');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamB', 1);
  });

  it('desktopサイズで適切なスタイルが適用される', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('score-increment');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('font-bold');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobile-basicサイズで適切なスタイルが適用される', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="mobile-basic" />);
    const button = screen.getByTestId('score-increment');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('text-base');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobile-simpleサイズで適切なスタイルが適用される', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="mobile-simple" />);
    const button = screen.getByTestId('score-increment');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('text-xs');
    expect(button.className).toContain('rounded');
  });

  it('赤チーム（desktop）で適切な背景色が適用される', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('score-increment');
    expect(button.className).toContain('bg-red-600');
    expect(button.className).toContain('hover:bg-red-700');
  });

  it('青チーム（desktop）で適切な背景色が適用される', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="blue" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('score-increment');
    expect(button.className).toContain('bg-blue-600');
    expect(button.className).toContain('hover:bg-blue-700');
  });

  it('赤チーム（tablet）で適切な背景色が適用される', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="mobile-basic" />);
    const button = screen.getByTestId('score-increment');
    expect(button.className).toContain('bg-red-500');
    expect(button.className).toContain('hover:bg-red-600');
  });

  it('青チーム（mobile）で適切な背景色が適用される', () => {
    render(<ScoreIncrementButton teamId="teamA" teamColor="blue" onUpdate={mockOnUpdate} size="mobile-simple" />);
    const button = screen.getByTestId('score-increment');
    expect(button.className).toContain('bg-blue-500');
    expect(button.className).toContain('hover:bg-blue-600');
  });
});

describe('ScoreDecrementButton', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボタンが正しくレンダリングされる', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} />);
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('data-testid属性が存在する', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} />);
    expect(screen.getByTestId('score-decrement')).toBeInTheDocument();
  });

  it('teamAのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('score-decrement');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamA', -1);
  });

  it('teamBのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<ScoreDecrementButton teamId="teamB" teamColor="blue" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('score-decrement');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamB', -1);
  });

  it('desktopサイズで適切なスタイルが適用される', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('score-decrement');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('font-bold');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobile-basicサイズで適切なスタイルが適用される', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="mobile-basic" />);
    const button = screen.getByTestId('score-decrement');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('text-base');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobile-simpleサイズで適切なスタイルが適用される', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="mobile-simple" />);
    const button = screen.getByTestId('score-decrement');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('text-xs');
    expect(button.className).toContain('rounded');
  });

  it('赤チーム（desktop）で適切な背景色が適用される', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('score-decrement');
    expect(button.className).toContain('bg-red-100');
    expect(button.className).toContain('hover:bg-red-200');
    expect(button.className).toContain('text-red-600');
  });

  it('青チーム（desktop）で適切な背景色が適用される', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="blue" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('score-decrement');
    expect(button.className).toContain('bg-blue-100');
    expect(button.className).toContain('hover:bg-blue-200');
    expect(button.className).toContain('text-blue-600');
  });

  it('赤チーム（tablet）で適切な背景色が適用される', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="red" onUpdate={mockOnUpdate} size="mobile-basic" />);
    const button = screen.getByTestId('score-decrement');
    expect(button.className).toContain('bg-red-300');
    expect(button.className).toContain('hover:bg-red-400');
    expect(button.className).toContain('text-red-800');
  });

  it('青チーム（mobile）で適切な背景色が適用される', () => {
    render(<ScoreDecrementButton teamId="teamA" teamColor="blue" onUpdate={mockOnUpdate} size="mobile-simple" />);
    const button = screen.getByTestId('score-decrement');
    expect(button.className).toContain('bg-blue-300');
    expect(button.className).toContain('hover:bg-blue-400');
    expect(button.className).toContain('text-blue-800');
  });
});

describe('ScoreResetButton', () => {
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボタンが正しくレンダリングされる', () => {
    render(<ScoreResetButton teamId="teamA" onReset={mockOnReset} />);
    expect(screen.getByText(/スコア/)).toBeInTheDocument();
    expect(screen.getByText(/リセット/)).toBeInTheDocument();
  });

  it('data-testid属性が存在する', () => {
    render(<ScoreResetButton teamId="teamA" onReset={mockOnReset} />);
    expect(screen.getByTestId('score-reset')).toBeInTheDocument();
  });

  it('teamAのクリック時にonResetが正しく呼ばれる', () => {
    render(<ScoreResetButton teamId="teamA" onReset={mockOnReset} />);
    const button = screen.getByTestId('score-reset');
    fireEvent.click(button);
    expect(mockOnReset).toHaveBeenCalledTimes(1);
    expect(mockOnReset).toHaveBeenCalledWith('teamA');
  });

  it('teamBのクリック時にonResetが正しく呼ばれる', () => {
    render(<ScoreResetButton teamId="teamB" onReset={mockOnReset} />);
    const button = screen.getByTestId('score-reset');
    fireEvent.click(button);
    expect(mockOnReset).toHaveBeenCalledTimes(1);
    expect(mockOnReset).toHaveBeenCalledWith('teamB');
  });

  it('desktopサイズで適切なスタイルが適用される', () => {
    render(<ScoreResetButton teamId="teamA" onReset={mockOnReset} size="desktop" />);
    const button = screen.getByTestId('score-reset');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobile-basicサイズで適切なスタイルが適用される', () => {
    render(<ScoreResetButton teamId="teamA" onReset={mockOnReset} size="mobile-basic" />);
    const button = screen.getByTestId('score-reset');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobile-simpleサイズで適切なスタイルが適用される', () => {
    render(<ScoreResetButton teamId="teamA" onReset={mockOnReset} size="mobile-simple" />);
    const button = screen.getByTestId('score-reset');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('rounded');
  });

  it('適切な背景色が適用される', () => {
    render(<ScoreResetButton teamId="teamA" onReset={mockOnReset} />);
    const button = screen.getByTestId('score-reset');
    expect(button.className).toContain('bg-gray-500');
    expect(button.className).toContain('hover:bg-gray-600');
  });
});
