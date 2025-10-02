import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { MainTimerControl } from './MainTimerControl';

describe('MainTimerControl', () => {
  const mockOnTimerInputMinutesChange = vi.fn();
  const mockOnTimerInputSecondsChange = vi.fn();
  const mockOnTimerSet = vi.fn();
  const mockOnTimerStart = vi.fn();
  const mockOnTimerPause = vi.fn();
  const mockOnTimerReset = vi.fn();
  const mockOnTimerAdjust = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('desktop版でコンポーネントが正しくレンダリングされる', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('main-timer-control')).toBeInTheDocument();
      expect(screen.getByText('タイマー操作')).toBeInTheDocument();
    });

    it('mobile版でコンポーネントが正しくレンダリングされる', () => {
      render(
        <MainTimerControl
          size="mobile"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('main-timer-control')).toBeInTheDocument();
      expect(screen.getByText('タイマー操作')).toBeInTheDocument();
    });
  });

  describe('子コンポーネントの存在確認', () => {
    it('TimerInputFieldが表示される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('timer-input-field')).toBeInTheDocument();
    });

    it('TimerPresetButtonsが表示される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('timer-preset-buttons')).toBeInTheDocument();
    });

    it('TimerAdjustButtonsが表示される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('timer-adjust-buttons')).toBeInTheDocument();
    });
  });

  describe('制御ボタンの存在確認', () => {
    it('スタートボタンが表示される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('timer-start-button')).toBeInTheDocument();
      expect(screen.getByText('スタート')).toBeInTheDocument();
    });

    it('ストップボタンが表示される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('timer-pause-button')).toBeInTheDocument();
      expect(screen.getByText('ストップ')).toBeInTheDocument();
    });

    it('リセットボタンが表示される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      expect(screen.getByTestId('timer-reset-button')).toBeInTheDocument();
      expect(screen.getByText('リセット')).toBeInTheDocument();
    });
  });

  describe('コールバック動作 - デスクトップ', () => {
    it('スタートボタンクリック時にonTimerStartが呼ばれる', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('timer-start-button');
      fireEvent.click(button);
      expect(mockOnTimerStart).toHaveBeenCalledTimes(1);
    });

    it('ストップボタンクリック時にonTimerPauseが呼ばれる', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('timer-pause-button');
      fireEvent.click(button);
      expect(mockOnTimerPause).toHaveBeenCalledTimes(1);
    });

    it('リセットボタンクリック時にonTimerResetが呼ばれる', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('timer-reset-button');
      fireEvent.click(button);
      expect(mockOnTimerReset).toHaveBeenCalledTimes(1);
    });

    it('設定ボタンクリック時にonTimerSetが呼ばれる', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={20}
          timerInputSeconds={30}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('set-button');
      fireEvent.click(button);
      expect(mockOnTimerSet).toHaveBeenCalledTimes(1);
      expect(mockOnTimerSet).toHaveBeenCalledWith(20, 30);
    });
  });

  describe('コールバック動作 - モバイル', () => {
    it('スタートボタンクリック時にonTimerStartが呼ばれる', () => {
      render(
        <MainTimerControl
          size="mobile"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('timer-start-button');
      fireEvent.click(button);
      expect(mockOnTimerStart).toHaveBeenCalledTimes(1);
    });

    it('ストップボタンクリック時にonTimerPauseが呼ばれる', () => {
      render(
        <MainTimerControl
          size="mobile"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('timer-pause-button');
      fireEvent.click(button);
      expect(mockOnTimerPause).toHaveBeenCalledTimes(1);
    });

    it('リセットボタンクリック時にonTimerResetが呼ばれる', () => {
      render(
        <MainTimerControl
          size="mobile"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('timer-reset-button');
      fireEvent.click(button);
      expect(mockOnTimerReset).toHaveBeenCalledTimes(1);
    });

    it('設定ボタンクリック時にonTimerSetが呼ばれる', () => {
      render(
        <MainTimerControl
          size="mobile"
          timerInputMinutes={10}
          timerInputSeconds={45}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const button = screen.getByTestId('set-button');
      fireEvent.click(button);
      expect(mockOnTimerSet).toHaveBeenCalledTimes(1);
      expect(mockOnTimerSet).toHaveBeenCalledWith(10, 45);
    });
  });

  describe('スタイル検証 - デスクトップ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const container = screen.getByTestId('main-timer-control');
      expect(container.className).toContain('p-4');
    });

    it('適切なボタンスタイルが適用される', () => {
      render(
        <MainTimerControl
          size="desktop"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const startButton = screen.getByTestId('timer-start-button');
      expect(startButton.className).toContain('p-3');
      expect(startButton.className).toContain('bg-green-500');
    });
  });

  describe('スタイル検証 - モバイル', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(
        <MainTimerControl
          size="mobile"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const container = screen.getByTestId('main-timer-control');
      expect(container.className).toContain('p-3');
    });

    it('適切なボタンスタイルが適用される', () => {
      render(
        <MainTimerControl
          size="mobile"
          timerInputMinutes={15}
          timerInputSeconds={0}
          onTimerInputMinutesChange={mockOnTimerInputMinutesChange}
          onTimerInputSecondsChange={mockOnTimerInputSecondsChange}
          onTimerSet={mockOnTimerSet}
          onTimerStart={mockOnTimerStart}
          onTimerPause={mockOnTimerPause}
          onTimerReset={mockOnTimerReset}
          onTimerAdjust={mockOnTimerAdjust}
        />
      );
      const startButton = screen.getByTestId('timer-start-button');
      expect(startButton.className).toContain('p-4');
      expect(startButton.className).toContain('text-lg');
      expect(startButton.className).toContain('bg-green-500');
    });
  });
});
