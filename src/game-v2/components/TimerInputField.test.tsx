import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { TimerInputField } from './TimerInputField';

describe('TimerInputField', () => {
  const mockOnMinutesChange = vi.fn();
  const mockOnSecondsChange = vi.fn();
  const mockOnSet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      expect(screen.getByTestId('timer-input-field')).toBeInTheDocument();
    });

    it('分入力フィールドが表示される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      expect(screen.getByTestId('minutes-input')).toBeInTheDocument();
      expect(screen.getByText('分')).toBeInTheDocument();
    });

    it('秒入力フィールドが表示される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      expect(screen.getByTestId('seconds-input')).toBeInTheDocument();
      expect(screen.getByText('秒')).toBeInTheDocument();
    });

    it('設定ボタンが表示される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      expect(screen.getByTestId('set-button')).toBeInTheDocument();
      expect(screen.getByText('設定')).toBeInTheDocument();
    });
  });

  describe('入力値の表示', () => {
    it('分の初期値が正しく表示される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const input = screen.getByTestId('minutes-input') as HTMLInputElement;
      expect(input.value).toBe('10');
    });

    it('秒の初期値が正しく表示される（ゼロパディング）', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={5}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const input = screen.getByTestId('seconds-input') as HTMLInputElement;
      expect(input.value).toBe('05');
    });
  });

  describe('入力動作', () => {
    it('分の入力時にonMinutesChangeが呼ばれる', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const input = screen.getByTestId('minutes-input');
      fireEvent.input(input, { target: { value: '20' } });
      expect(mockOnMinutesChange).toHaveBeenCalledTimes(1);
      expect(mockOnMinutesChange).toHaveBeenCalledWith(20);
    });

    it('秒の入力時にonSecondsChangeが呼ばれる', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const input = screen.getByTestId('seconds-input');
      fireEvent.input(input, { target: { value: '45' } });
      expect(mockOnSecondsChange).toHaveBeenCalledTimes(1);
      expect(mockOnSecondsChange).toHaveBeenCalledWith(45);
    });

    it('設定ボタンクリック時にonSetが呼ばれる', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const button = screen.getByTestId('set-button');
      fireEvent.click(button);
      expect(mockOnSet).toHaveBeenCalledTimes(1);
    });
  });

  describe('デスクトップサイズ', () => {
    it('適切な入力フィールド幅が適用される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const minutesInput = screen.getByTestId('minutes-input');
      const secondsInput = screen.getByTestId('seconds-input');
      expect(minutesInput.className).toContain('w-16');
      expect(secondsInput.className).toContain('w-16');
    });

    it('適切な入力フィールドパディングが適用される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const minutesInput = screen.getByTestId('minutes-input');
      expect(minutesInput.className).toContain('p-2');
    });

    it('適切なボタンスタイルが適用される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const button = screen.getByTestId('set-button');
      expect(button.className).toContain('px-3');
      expect(button.className).toContain('py-2');
      expect(button.className).toContain('text-sm');
    });

    it('placeholderが設定されていない', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const minutesInput = screen.getByTestId('minutes-input') as HTMLInputElement;
      const secondsInput = screen.getByTestId('seconds-input') as HTMLInputElement;
      expect(minutesInput.placeholder).toBe('');
      expect(secondsInput.placeholder).toBe('');
    });
  });

  describe('モバイルサイズ', () => {
    it('適切な入力フィールド幅が適用される', () => {
      render(
        <TimerInputField
          size="mobile"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const minutesInput = screen.getByTestId('minutes-input');
      const secondsInput = screen.getByTestId('seconds-input');
      expect(minutesInput.className).toContain('w-18');
      expect(secondsInput.className).toContain('w-18');
    });

    it('適切な入力フィールドパディングが適用される', () => {
      render(
        <TimerInputField
          size="mobile"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const minutesInput = screen.getByTestId('minutes-input');
      expect(minutesInput.className).toContain('p-3');
      expect(minutesInput.className).toContain('rounded-lg');
    });

    it('fontSizeスタイルが適用される（iOS zoom prevention）', () => {
      render(
        <TimerInputField
          size="mobile"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const minutesInput = screen.getByTestId('minutes-input') as HTMLInputElement;
      const secondsInput = screen.getByTestId('seconds-input') as HTMLInputElement;
      expect(minutesInput.style.fontSize).toBe('16px');
      expect(secondsInput.style.fontSize).toBe('16px');
    });

    it('placeholderが設定されている', () => {
      render(
        <TimerInputField
          size="mobile"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const minutesInput = screen.getByTestId('minutes-input') as HTMLInputElement;
      const secondsInput = screen.getByTestId('seconds-input') as HTMLInputElement;
      expect(minutesInput.placeholder).toBe('60');
      expect(secondsInput.placeholder).toBe('00');
    });

    it('適切なボタンスタイルが適用される', () => {
      render(
        <TimerInputField
          size="mobile"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const button = screen.getByTestId('set-button');
      expect(button.className).toContain('px-4');
      expect(button.className).toContain('py-3');
      expect(button.className).toContain('rounded-lg');
    });
  });

  describe('入力制限', () => {
    it('分の入力範囲が0-99に制限される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const input = screen.getByTestId('minutes-input') as HTMLInputElement;
      expect(input.min).toBe('0');
      expect(input.max).toBe('99');
    });

    it('秒の入力範囲が0-59に制限される', () => {
      render(
        <TimerInputField
          size="desktop"
          minutes={10}
          seconds={30}
          onMinutesChange={mockOnMinutesChange}
          onSecondsChange={mockOnSecondsChange}
          onSet={mockOnSet}
        />
      );
      const input = screen.getByTestId('seconds-input') as HTMLInputElement;
      expect(input.min).toBe('0');
      expect(input.max).toBe('59');
    });
  });
});
