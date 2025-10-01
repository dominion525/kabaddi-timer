import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { SubTimerControl } from './SubTimerControl';

describe('SubTimerControl', () => {
  const mockOnStart = vi.fn();
  const mockOnPause = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      expect(screen.getByTestId('sub-timer-control')).toBeInTheDocument();
    });

    it('タイトルが表示される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      expect(screen.getByText('サブタイマー操作 (30秒レイドタイマー)')).toBeInTheDocument();
    });

    it('スタートボタンが表示される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      expect(screen.getByTestId('sub-timer-start')).toBeInTheDocument();
      expect(screen.getByText('スタート')).toBeInTheDocument();
    });

    it('ストップボタンが表示される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      expect(screen.getByTestId('sub-timer-pause')).toBeInTheDocument();
      expect(screen.getByText('ストップ')).toBeInTheDocument();
    });

    it('リセットボタンが表示される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      expect(screen.getByTestId('sub-timer-reset')).toBeInTheDocument();
      expect(screen.getByText('リセット')).toBeInTheDocument();
    });
  });

  describe('ボタン動作', () => {
    it('スタートボタンクリック時にonStartが呼ばれる', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const button = screen.getByTestId('sub-timer-start');
      fireEvent.click(button);
      expect(mockOnStart).toHaveBeenCalledTimes(1);
      expect(mockOnPause).not.toHaveBeenCalled();
      expect(mockOnReset).not.toHaveBeenCalled();
    });

    it('ストップボタンクリック時にonPauseが呼ばれる', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const button = screen.getByTestId('sub-timer-pause');
      fireEvent.click(button);
      expect(mockOnPause).toHaveBeenCalledTimes(1);
      expect(mockOnStart).not.toHaveBeenCalled();
      expect(mockOnReset).not.toHaveBeenCalled();
    });

    it('リセットボタンクリック時にonResetが呼ばれる', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const button = screen.getByTestId('sub-timer-reset');
      fireEvent.click(button);
      expect(mockOnReset).toHaveBeenCalledTimes(1);
      expect(mockOnStart).not.toHaveBeenCalled();
      expect(mockOnPause).not.toHaveBeenCalled();
    });

    it('複数回クリックが正しく処理される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const startBtn = screen.getByTestId('sub-timer-start');
      const pauseBtn = screen.getByTestId('sub-timer-pause');
      const resetBtn = screen.getByTestId('sub-timer-reset');

      fireEvent.click(startBtn);
      fireEvent.click(pauseBtn);
      fireEvent.click(resetBtn);
      fireEvent.click(startBtn);

      expect(mockOnStart).toHaveBeenCalledTimes(2);
      expect(mockOnPause).toHaveBeenCalledTimes(1);
      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('デスクトップサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const container = screen.getByTestId('sub-timer-control');
      expect(container.className).toContain('p-4');
    });

    it('適切なタイトルスタイルが適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const title = screen.getByText('サブタイマー操作 (30秒レイドタイマー)');
      expect(title.className).toContain('text-lg');
      expect(title.className).toContain('mb-4');
    });

    it('ボタンに適切なスタイルが適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const startBtn = screen.getByTestId('sub-timer-start');
      const pauseBtn = screen.getByTestId('sub-timer-pause');
      const resetBtn = screen.getByTestId('sub-timer-reset');

      expect(startBtn.className).toContain('p-3');
      expect(startBtn.className).not.toContain('text-lg');

      expect(pauseBtn.className).toContain('p-3');
      expect(pauseBtn.className).not.toContain('text-lg');

      expect(resetBtn.className).toContain('p-3');
      expect(resetBtn.className).not.toContain('text-lg');
    });
  });

  describe('モバイルサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(
        <SubTimerControl
          size="mobile"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const container = screen.getByTestId('sub-timer-control');
      expect(container.className).toContain('p-4');
    });

    it('適切なタイトルスタイルが適用される', () => {
      render(
        <SubTimerControl
          size="mobile"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const title = screen.getByText('サブタイマー操作 (30秒レイドタイマー)');
      expect(title.className).toContain('text-lg');
      expect(title.className).toContain('mb-4');
    });

    it('ボタンに適切なスタイルが適用される', () => {
      render(
        <SubTimerControl
          size="mobile"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const startBtn = screen.getByTestId('sub-timer-start');
      const pauseBtn = screen.getByTestId('sub-timer-pause');
      const resetBtn = screen.getByTestId('sub-timer-reset');

      expect(startBtn.className).toContain('p-4');
      expect(startBtn.className).toContain('text-lg');

      expect(pauseBtn.className).toContain('p-4');
      expect(pauseBtn.className).toContain('text-lg');

      expect(resetBtn.className).toContain('p-4');
      expect(resetBtn.className).toContain('text-lg');
    });
  });

  describe('ボタンスタイル', () => {
    it('スタートボタンに黄色が適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const button = screen.getByTestId('sub-timer-start');
      expect(button.className).toContain('bg-yellow-500');
      expect(button.className).toContain('hover:bg-yellow-600');
    });

    it('ストップボタンに赤色が適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const button = screen.getByTestId('sub-timer-pause');
      expect(button.className).toContain('bg-red-500');
      expect(button.className).toContain('hover:bg-red-600');
    });

    it('リセットボタンにオレンジ色が適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const button = screen.getByTestId('sub-timer-reset');
      expect(button.className).toContain('bg-orange-500');
      expect(button.className).toContain('hover:bg-orange-600');
    });

    it('共通のボタンスタイルが適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const startBtn = screen.getByTestId('sub-timer-start');
      const pauseBtn = screen.getByTestId('sub-timer-pause');
      const resetBtn = screen.getByTestId('sub-timer-reset');

      expect(startBtn.className).toContain('text-white');
      expect(startBtn.className).toContain('rounded-lg');
      expect(startBtn.className).toContain('font-bold');
      expect(startBtn.className).toContain('transition-colors');

      expect(pauseBtn.className).toContain('text-white');
      expect(pauseBtn.className).toContain('rounded-lg');
      expect(pauseBtn.className).toContain('font-bold');
      expect(pauseBtn.className).toContain('transition-colors');

      expect(resetBtn.className).toContain('text-white');
      expect(resetBtn.className).toContain('rounded-lg');
      expect(resetBtn.className).toContain('font-bold');
      expect(resetBtn.className).toContain('transition-colors');
    });
  });

  describe('コンテナスタイル', () => {
    it('黄色背景が適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const container = screen.getByTestId('sub-timer-control');
      expect(container.className).toContain('bg-yellow-50');
      expect(container.className).toContain('border-yellow-200');
    });

    it('タイトルに黄色テキストが適用される', () => {
      render(
        <SubTimerControl
          size="desktop"
          onStart={mockOnStart}
          onPause={mockOnPause}
          onReset={mockOnReset}
        />
      );
      const title = screen.getByText('サブタイマー操作 (30秒レイドタイマー)');
      expect(title.className).toContain('text-yellow-800');
    });
  });
});
