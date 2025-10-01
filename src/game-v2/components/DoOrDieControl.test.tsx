import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import {
  DoOrDieIncrementButton,
  DoOrDieDecrementButton,
  DoOrDieResetButton,
} from './DoOrDieControl';

describe('DoOrDieIncrementButton', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボタンが正しくレンダリングされる', () => {
    render(<DoOrDieIncrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('data-testid属性が存在する', () => {
    render(<DoOrDieIncrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    expect(screen.getByTestId('dod-increment')).toBeInTheDocument();
  });

  it('teamAのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<DoOrDieIncrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-increment');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamA', 1);
  });

  it('teamBのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<DoOrDieIncrementButton teamId="teamB" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-increment');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamB', 1);
  });

  it('desktopサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieIncrementButton teamId="teamA" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('dod-increment');
    expect(button.className).toContain('aspect-square');
    expect(button.className).toContain('font-bold');
    expect(button.className).toContain('rounded-lg');
  });

  it('tabletサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieIncrementButton teamId="teamA" onUpdate={mockOnUpdate} size="tablet" />);
    const button = screen.getByTestId('dod-increment');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('text-base');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobileサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieIncrementButton teamId="teamA" onUpdate={mockOnUpdate} size="mobile" />);
    const button = screen.getByTestId('dod-increment');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('text-xs');
    expect(button.className).toContain('rounded');
  });

  it('適切な背景色が適用される', () => {
    render(<DoOrDieIncrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-increment');
    expect(button.className).toContain('bg-orange-400');
    expect(button.className).toContain('hover:bg-orange-500');
  });
});

describe('DoOrDieDecrementButton', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボタンが正しくレンダリングされる', () => {
    render(<DoOrDieDecrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('data-testid属性が存在する', () => {
    render(<DoOrDieDecrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    expect(screen.getByTestId('dod-decrement')).toBeInTheDocument();
  });

  it('teamAのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<DoOrDieDecrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-decrement');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamA', -1);
  });

  it('teamBのクリック時にonUpdateが正しく呼ばれる', () => {
    render(<DoOrDieDecrementButton teamId="teamB" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-decrement');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamB', -1);
  });

  it('desktopサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieDecrementButton teamId="teamA" onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('dod-decrement');
    expect(button.className).toContain('aspect-square');
    expect(button.className).toContain('font-bold');
    expect(button.className).toContain('rounded-lg');
  });

  it('tabletサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieDecrementButton teamId="teamA" onUpdate={mockOnUpdate} size="tablet" />);
    const button = screen.getByTestId('dod-decrement');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('text-base');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobileサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieDecrementButton teamId="teamA" onUpdate={mockOnUpdate} size="mobile" />);
    const button = screen.getByTestId('dod-decrement');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('text-xs');
    expect(button.className).toContain('rounded');
  });

  it('適切な背景色が適用される', () => {
    render(<DoOrDieDecrementButton teamId="teamA" onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-decrement');
    expect(button.className).toContain('bg-orange-200');
    expect(button.className).toContain('hover:bg-orange-300');
    expect(button.className).toContain('text-orange-800');
  });
});

describe('DoOrDieResetButton', () => {
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ボタンが正しくレンダリングされる', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={2} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('リセット')).toBeInTheDocument();
  });

  it('data-testid属性が存在する', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={2} onUpdate={mockOnUpdate} />);
    expect(screen.getByTestId('dod-reset')).toBeInTheDocument();
  });

  it('currentCount=0の場合、クリック時にonUpdate(teamId, 0)が呼ばれる', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={0} onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-reset');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamA', 0);
  });

  it('currentCount=2の場合、クリック時にonUpdate(teamId, -2)が呼ばれる', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={2} onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-reset');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamA', -2);
  });

  it('currentCount=3の場合、クリック時にonUpdate(teamId, -3)が呼ばれる', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={3} onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-reset');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamA', -3);
  });

  it('teamBでクリック時にonUpdateが正しく呼ばれる', () => {
    render(<DoOrDieResetButton teamId="teamB" currentCount={1} onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-reset');
    fireEvent.click(button);
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith('teamB', -1);
  });

  it('desktopサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={2} onUpdate={mockOnUpdate} size="desktop" />);
    const button = screen.getByTestId('dod-reset');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('text-xs');
    expect(button.className).toContain('rounded-lg');
  });

  it('tabletサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={2} onUpdate={mockOnUpdate} size="tablet" />);
    const button = screen.getByTestId('dod-reset');
    expect(button.className).toContain('h-12');
    expect(button.className).toContain('text-base');
    expect(button.className).toContain('rounded-lg');
  });

  it('mobileサイズで適切なスタイルが適用される', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={2} onUpdate={mockOnUpdate} size="mobile" />);
    const button = screen.getByTestId('dod-reset');
    expect(button.className).toContain('h-8');
    expect(button.className).toContain('text-xs');
    expect(button.className).toContain('rounded');
  });

  it('適切な背景色が適用される', () => {
    render(<DoOrDieResetButton teamId="teamA" currentCount={2} onUpdate={mockOnUpdate} />);
    const button = screen.getByTestId('dod-reset');
    expect(button.className).toContain('bg-gray-400');
    expect(button.className).toContain('hover:bg-gray-500');
  });
});
