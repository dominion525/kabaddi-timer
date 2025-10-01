import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { OverallControlSection } from './OverallControlSection';

describe('OverallControlSection', () => {
  const mockOnCourtChange = vi.fn();
  const mockOnResetAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      expect(screen.getByTestId('overall-control-section')).toBeInTheDocument();
    });

    it('タイトルが表示される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      expect(screen.getByText('全体コントロール')).toBeInTheDocument();
    });

    it('コートチェンジボタンが表示される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      expect(screen.getByTestId('court-change-btn')).toBeInTheDocument();
      expect(screen.getByText('コートチェンジ')).toBeInTheDocument();
    });

    it('全リセットボタンが表示される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      expect(screen.getByTestId('reset-all-btn')).toBeInTheDocument();
      expect(screen.getByText('全リセット')).toBeInTheDocument();
    });
  });

  describe('ボタン動作', () => {
    it('コートチェンジボタンクリック時にonCourtChangeが呼ばれる', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const button = screen.getByTestId('court-change-btn');
      fireEvent.click(button);
      expect(mockOnCourtChange).toHaveBeenCalledTimes(1);
      expect(mockOnResetAll).not.toHaveBeenCalled();
    });

    it('全リセットボタンクリック時にonResetAllが呼ばれる', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const button = screen.getByTestId('reset-all-btn');
      fireEvent.click(button);
      expect(mockOnResetAll).toHaveBeenCalledTimes(1);
      expect(mockOnCourtChange).not.toHaveBeenCalled();
    });

    it('複数回クリックが正しく処理される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const courtChangeBtn = screen.getByTestId('court-change-btn');
      const resetAllBtn = screen.getByTestId('reset-all-btn');

      fireEvent.click(courtChangeBtn);
      fireEvent.click(resetAllBtn);
      fireEvent.click(courtChangeBtn);

      expect(mockOnCourtChange).toHaveBeenCalledTimes(2);
      expect(mockOnResetAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('デスクトップサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const container = screen.getByTestId('overall-control-section');
      expect(container.className).toContain('p-4');
      expect(container.className).toContain('lg:col-span-2');
    });

    it('適切なタイトルスタイルが適用される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const title = screen.getByText('全体コントロール');
      expect(title.className).toContain('text-lg');
      expect(title.className).toContain('mb-4');
    });

    it('flexレイアウトが適用される', () => {
      const { container } = render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const layout = container.querySelector('.flex');
      expect(layout?.className).toContain('space-x-4');
      expect(layout?.className).toContain('justify-center');
    });

    it('ボタンに適切なスタイルが適用される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const courtChangeBtn = screen.getByTestId('court-change-btn');
      const resetAllBtn = screen.getByTestId('reset-all-btn');

      expect(courtChangeBtn.className).toContain('px-3');
      expect(courtChangeBtn.className).toContain('py-1');
      expect(courtChangeBtn.className).toContain('text-lg');

      expect(resetAllBtn.className).toContain('px-3');
      expect(resetAllBtn.className).toContain('py-1');
      expect(resetAllBtn.className).toContain('text-lg');
    });
  });

  describe('モバイルサイズ', () => {
    it('適切なコンテナスタイルが適用される', () => {
      render(
        <OverallControlSection
          size="mobile"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const container = screen.getByTestId('overall-control-section');
      expect(container.className).toContain('p-3');
      expect(container.className).not.toContain('lg:col-span-2');
    });

    it('適切なタイトルスタイルが適用される', () => {
      render(
        <OverallControlSection
          size="mobile"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const title = screen.getByText('全体コントロール');
      expect(title.className).toContain('text-base');
      expect(title.className).toContain('mb-3');
    });

    it('gridレイアウトが適用される', () => {
      const { container } = render(
        <OverallControlSection
          size="mobile"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const layout = container.querySelector('.grid');
      expect(layout?.className).toContain('grid-cols-2');
      expect(layout?.className).toContain('gap-3');
    });

    it('ボタンに適切なスタイルが適用される', () => {
      render(
        <OverallControlSection
          size="mobile"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const courtChangeBtn = screen.getByTestId('court-change-btn');
      const resetAllBtn = screen.getByTestId('reset-all-btn');

      expect(courtChangeBtn.className).toContain('px-4');
      expect(courtChangeBtn.className).toContain('py-1');
      expect(courtChangeBtn.className).toContain('text-base');

      expect(resetAllBtn.className).toContain('px-4');
      expect(resetAllBtn.className).toContain('py-1');
      expect(resetAllBtn.className).toContain('text-base');
    });
  });

  describe('ボタンスタイル', () => {
    it('コートチェンジボタンにオレンジ色が適用される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const button = screen.getByTestId('court-change-btn');
      expect(button.className).toContain('bg-orange-500');
      expect(button.className).toContain('hover:bg-orange-600');
    });

    it('全リセットボタンに赤色が適用される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const button = screen.getByTestId('reset-all-btn');
      expect(button.className).toContain('bg-red-600');
      expect(button.className).toContain('hover:bg-red-700');
    });

    it('共通のボタンスタイルが適用される', () => {
      render(
        <OverallControlSection
          size="desktop"
          onCourtChange={mockOnCourtChange}
          onResetAll={mockOnResetAll}
        />
      );
      const courtChangeBtn = screen.getByTestId('court-change-btn');
      const resetAllBtn = screen.getByTestId('reset-all-btn');

      expect(courtChangeBtn.className).toContain('text-white');
      expect(courtChangeBtn.className).toContain('rounded-lg');
      expect(courtChangeBtn.className).toContain('font-bold');
      expect(courtChangeBtn.className).toContain('transition-colors');

      expect(resetAllBtn.className).toContain('text-white');
      expect(resetAllBtn.className).toContain('rounded-lg');
      expect(resetAllBtn.className).toContain('font-bold');
      expect(resetAllBtn.className).toContain('transition-colors');
    });
  });
});
