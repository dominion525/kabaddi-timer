import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { TimerPresetButtons } from './TimerPresetButtons';

describe('TimerPresetButtons', () => {
  const mockOnSetTimer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      expect(screen.getByTestId('timer-preset-buttons')).toBeInTheDocument();
    });

    it('20分ボタンが表示される', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      expect(screen.getByTestId('preset-20min')).toBeInTheDocument();
      expect(screen.getByText('20分')).toBeInTheDocument();
    });

    it('15分ボタンが表示される', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      expect(screen.getByTestId('preset-15min')).toBeInTheDocument();
      expect(screen.getByText('15分')).toBeInTheDocument();
    });

    it('3分ボタンが表示される', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      expect(screen.getByTestId('preset-3min')).toBeInTheDocument();
      expect(screen.getByText('3分')).toBeInTheDocument();
    });
  });

  describe('ボタン動作 - デスクトップ', () => {
    it('20分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(20, 0);
    });

    it('15分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-15min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(15, 0);
    });

    it('3分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-3min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(3, 0);
    });
  });

  describe('ボタン動作 - モバイル', () => {
    it('20分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="mobile" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(20, 0);
    });

    it('15分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="mobile" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-15min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(15, 0);
    });

    it('3分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="mobile" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-3min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(3, 0);
    });
  });

  describe('ボタン動作 - モバイルシンプル', () => {
    it('20分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="mobile-simple" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(20, 0);
    });

    it('15分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="mobile-simple" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-15min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(15, 0);
    });

    it('3分ボタンクリック時にonSetTimerが呼ばれる', () => {
      render(<TimerPresetButtons size="mobile-simple" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-3min');
      fireEvent.click(button);
      expect(mockOnSetTimer).toHaveBeenCalledTimes(1);
      expect(mockOnSetTimer).toHaveBeenCalledWith(3, 0);
    });
  });

  describe('スタイル検証 - デスクトップ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      const container = screen.getByTestId('timer-preset-buttons');
      expect(container.className).toContain('space-x-1');
    });

    it('グレー背景ボタンスタイルが適用される', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      expect(button.className).toContain('bg-gray-600');
      expect(button.className).toContain('hover:bg-gray-700');
    });

    it('適切なボタンサイズが適用される', () => {
      render(<TimerPresetButtons size="desktop" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      expect(button.className).toContain('p-2');
      expect(button.className).toContain('text-sm');
    });
  });

  describe('スタイル検証 - モバイル', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TimerPresetButtons size="mobile" onSetTimer={mockOnSetTimer} />);
      const container = screen.getByTestId('timer-preset-buttons');
      expect(container.className).toContain('space-x-2');
    });

    it('グレー背景ボタンスタイルが適用される', () => {
      render(<TimerPresetButtons size="mobile" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      expect(button.className).toContain('bg-gray-600');
      expect(button.className).toContain('hover:bg-gray-700');
    });

    it('適切なボタンサイズが適用される', () => {
      render(<TimerPresetButtons size="mobile" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      expect(button.className).toContain('p-3');
      expect(button.className).toContain('rounded-lg');
    });
  });

  describe('スタイル検証 - モバイルシンプル', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TimerPresetButtons size="mobile-simple" onSetTimer={mockOnSetTimer} />);
      const container = screen.getByTestId('timer-preset-buttons');
      expect(container.className).toContain('gap-1');
      expect(container.className).toContain('flex-1');
    });

    it('青背景ボタンスタイルが適用される', () => {
      render(<TimerPresetButtons size="mobile-simple" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      expect(button.className).toContain('bg-blue-500');
      expect(button.className).toContain('hover:bg-blue-600');
    });

    it('適切なボタンサイズとフォントが適用される', () => {
      render(<TimerPresetButtons size="mobile-simple" onSetTimer={mockOnSetTimer} />);
      const button = screen.getByTestId('preset-20min');
      expect(button.className).toContain('py-2');
      expect(button.className).toContain('px-1');
      expect(button.className).toContain('text-xs');
      expect(button.className).toContain('font-bold');
    });
  });
});
