import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { SimpleTimerPresetControl } from './SimpleTimerPresetControl';

describe('SimpleTimerPresetControl', () => {
  const mockOnTimerSet = vi.fn();
  const mockOnTimerAdjust = vi.fn();
  const mockOnCourtChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      expect(screen.getByTestId('simple-timer-preset-control')).toBeInTheDocument();
    });
  });

  describe('子コンポーネント・ボタン存在確認', () => {
    it('TimerPresetButtonsが表示される', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      expect(screen.getByTestId('timer-preset-buttons')).toBeInTheDocument();
    });

    it('+1秒ボタンが表示される', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      expect(screen.getByTestId('adjust-plus-1')).toBeInTheDocument();
      expect(screen.getByText('+1秒')).toBeInTheDocument();
    });

    it('-1秒ボタンが表示される', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      expect(screen.getByTestId('adjust-minus-1')).toBeInTheDocument();
      expect(screen.getByText('-1秒')).toBeInTheDocument();
    });

    it('コートチェンジボタンが表示される', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      expect(screen.getByTestId('court-change-button')).toBeInTheDocument();
    });
  });

  describe('ボタン動作', () => {
    it('+1秒ボタンクリック時にonTimerAdjustが+1で呼ばれる', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      const button = screen.getByTestId('adjust-plus-1');
      fireEvent.click(button);
      expect(mockOnTimerAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnTimerAdjust).toHaveBeenCalledWith(1);
    });

    it('-1秒ボタンクリック時にonTimerAdjustが-1で呼ばれる', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      const button = screen.getByTestId('adjust-minus-1');
      fireEvent.click(button);
      expect(mockOnTimerAdjust).toHaveBeenCalledTimes(1);
      expect(mockOnTimerAdjust).toHaveBeenCalledWith(-1);
    });

    it('コートチェンジボタンクリック時にonCourtChangeが呼ばれる', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      const button = screen.getByTestId('court-change-button');
      fireEvent.click(button);
      expect(mockOnCourtChange).toHaveBeenCalledTimes(1);
    });

    it('プリセットボタン（20分）クリック時にonTimerSetが呼ばれる', () => {
      render(
        <SimpleTimerPresetControl
          onTimerSet={mockOnTimerSet}
          onTimerAdjust={mockOnTimerAdjust}
          onCourtChange={mockOnCourtChange}
        />
      );
      const button = screen.getByTestId('preset-20min');
      fireEvent.click(button);
      expect(mockOnTimerSet).toHaveBeenCalledTimes(1);
      expect(mockOnTimerSet).toHaveBeenCalledWith(20, 0);
    });
  });
});
