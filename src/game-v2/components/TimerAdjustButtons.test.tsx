import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { TimerAdjustButtons } from './TimerAdjustButtons';

describe('TimerAdjustButtons', () => {
  const mockOnAdjust = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      expect(screen.getByTestId('timer-adjust-buttons')).toBeInTheDocument();
    });

    it('+1分ボタンが表示される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      expect(screen.getByTestId('adjust-plus-60')).toBeInTheDocument();
      expect(screen.getByText('+1分')).toBeInTheDocument();
    });

    it('+10秒ボタンが表示される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      expect(screen.getByTestId('adjust-plus-10')).toBeInTheDocument();
      expect(screen.getByText('+10秒')).toBeInTheDocument();
    });

    it('+1秒ボタンが表示される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      expect(screen.getByTestId('adjust-plus-1')).toBeInTheDocument();
      expect(screen.getByText('+1秒')).toBeInTheDocument();
    });

    it('-1分ボタンが表示される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      expect(screen.getByTestId('adjust-minus-60')).toBeInTheDocument();
      expect(screen.getByText('-1分')).toBeInTheDocument();
    });

    it('-10秒ボタンが表示される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      expect(screen.getByTestId('adjust-minus-10')).toBeInTheDocument();
      expect(screen.getByText('-10秒')).toBeInTheDocument();
    });

    it('-1秒ボタンが表示される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      expect(screen.getByTestId('adjust-minus-1')).toBeInTheDocument();
      expect(screen.getByText('-1秒')).toBeInTheDocument();
    });
  });

  describe('ボタン動作 - デスクトップ', () => {
    it('+1分ボタンクリック時にonAdjustが+60で呼ばれる', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-60');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(60);
    });

    it('+10秒ボタンクリック時にonAdjustが+10で呼ばれる', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-10');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(10);
    });

    it('+1秒ボタンクリック時にonAdjustが+1で呼ばれる', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-1');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(1);
    });

    it('-1分ボタンクリック時にonAdjustが-60で呼ばれる', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-60');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(-60);
    });

    it('-10秒ボタンクリック時にonAdjustが-10で呼ばれる', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-10');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(-10);
    });

    it('-1秒ボタンクリック時にonAdjustが-1で呼ばれる', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-1');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(-1);
    });
  });

  describe('ボタン動作 - モバイル', () => {
    it('+1分ボタンクリック時にonAdjustが+60で呼ばれる', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-60');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(60);
    });

    it('+10秒ボタンクリック時にonAdjustが+10で呼ばれる', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-10');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(10);
    });

    it('+1秒ボタンクリック時にonAdjustが+1で呼ばれる', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-1');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(1);
    });

    it('-1分ボタンクリック時にonAdjustが-60で呼ばれる', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-60');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(-60);
    });

    it('-10秒ボタンクリック時にonAdjustが-10で呼ばれる', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-10');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(-10);
    });

    it('-1秒ボタンクリック時にonAdjustが-1で呼ばれる', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-1');
      fireEvent.click(button);
      expect(mockOnAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnAdjust).toHaveBeenCalledWith(-1);
    });
  });

  describe('スタイル検証 - デスクトップ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const container = screen.getByTestId('timer-adjust-buttons');
      expect(container.className).toContain('space-y-2');
    });

    it('+ボタンに青色スタイルが適用される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-60');
      expect(button.className).toContain('bg-blue-500');
      expect(button.className).toContain('hover:bg-blue-600');
    });

    it('-ボタンに灰色スタイルが適用される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-60');
      expect(button.className).toContain('bg-gray-500');
      expect(button.className).toContain('hover:bg-gray-600');
    });

    it('適切なボタンサイズが適用される', () => {
      render(<TimerAdjustButtons size="desktop" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-60');
      expect(button.className).toContain('p-2');
      expect(button.className).toContain('text-sm');
    });
  });

  describe('スタイル検証 - モバイル', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const container = screen.getByTestId('timer-adjust-buttons');
      expect(container.className).toContain('space-y-3');
    });

    it('+ボタンに青色スタイルが適用される', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-60');
      expect(button.className).toContain('bg-blue-500');
      expect(button.className).toContain('hover:bg-blue-600');
    });

    it('-ボタンに灰色スタイルが適用される', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-minus-60');
      expect(button.className).toContain('bg-gray-500');
      expect(button.className).toContain('hover:bg-gray-600');
    });

    it('適切なボタンサイズが適用される', () => {
      render(<TimerAdjustButtons size="mobile" onAdjust={mockOnAdjust} />);
      const button = screen.getByTestId('adjust-plus-60');
      expect(button.className).toContain('p-3');
      expect(button.className).toContain('rounded-lg');
    });
  });
});
