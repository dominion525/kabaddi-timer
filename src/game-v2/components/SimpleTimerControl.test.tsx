import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { SimpleTimerControl } from './SimpleTimerControl';

describe('SimpleTimerControl', () => {
  const mockOnTimerStart = vi.fn();
  const mockOnTimerPause = vi.fn();
  const mockOnTimerReset = vi.fn();
  const mockOnSubTimerStart = vi.fn();
  const mockOnSubTimerPause = vi.fn();
  const mockOnSubTimerReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      expect(screen.getByTestId('simple-timer-control')).toBeInTheDocument();
    });
  });

  describe('メインタイマーボタン存在確認', () => {
    it('メインタイマー開始ボタンが表示される', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      expect(screen.getByTestId('main-timer-start')).toBeInTheDocument();
      expect(screen.getByText('開始')).toBeInTheDocument();
    });

    it('メインタイマー停止ボタンが表示される', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      expect(screen.getByTestId('main-timer-pause')).toBeInTheDocument();
      expect(screen.getByText('停止')).toBeInTheDocument();
    });

    it('メインタイマーリセットボタンが表示される', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      expect(screen.getByTestId('main-timer-reset')).toBeInTheDocument();
      expect(screen.getByText('リセット')).toBeInTheDocument();
    });
  });

  describe('サブタイマーボタン存在確認', () => {
    it('サブタイマー開始ボタンが表示される', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      expect(screen.getByTestId('sub-timer-start')).toBeInTheDocument();
    });

    it('サブタイマー停止ボタンが表示される', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      expect(screen.getByTestId('sub-timer-pause')).toBeInTheDocument();
    });

    it('サブタイマーリセットボタンが表示される', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      expect(screen.getByTestId('sub-timer-reset')).toBeInTheDocument();
    });
  });

  describe('メインタイマーボタン動作', () => {
    it('開始ボタンクリック時にonTimerStartが呼ばれる', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      const button = screen.getByTestId('main-timer-start');
      fireEvent.click(button);
      expect(mockOnTimerStart).toHaveBeenCalledTimes(1);
    });

    it('停止ボタンクリック時にonTimerPauseが呼ばれる', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      const button = screen.getByTestId('main-timer-pause');
      fireEvent.click(button);
      expect(mockOnTimerPause).toHaveBeenCalledTimes(1);
    });

    it('リセットボタンクリック時にonTimerResetが呼ばれる', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      const button = screen.getByTestId('main-timer-reset');
      fireEvent.click(button);
      expect(mockOnTimerReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('サブタイマーボタン動作', () => {
    it('開始ボタンクリック時にonSubTimerStartが呼ばれる', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      const button = screen.getByTestId('sub-timer-start');
      fireEvent.click(button);
      expect(mockOnSubTimerStart).toHaveBeenCalledTimes(1);
    });

    it('停止ボタンクリック時にonSubTimerPauseが呼ばれる', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      const button = screen.getByTestId('sub-timer-pause');
      fireEvent.click(button);
      expect(mockOnSubTimerPause).toHaveBeenCalledTimes(1);
    });

    it('リセットボタンクリック時にonSubTimerResetが呼ばれる', () => {
      render(
        <SimpleTimerControl
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onSubTimerStart={mockOnSubTimerStart}
          onSubTimerPause={mockOnSubTimerPause}
          onSubTimerReset={mockOnSubTimerReset}
        />
      );
      const button = screen.getByTestId('sub-timer-reset');
      fireEvent.click(button);
      expect(mockOnSubTimerReset).toHaveBeenCalledTimes(1);
    });
  });
});
