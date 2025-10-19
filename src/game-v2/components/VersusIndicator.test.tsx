import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { VersusIndicator } from './VersusIndicator';

describe('VersusIndicator', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('vsテキストが表示される', () => {
      render(<VersusIndicator />);
      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    it('onClickが指定されていない場合、クリックできない', () => {
      const { container } = render(<VersusIndicator />);
      const element = container.firstChild as HTMLElement;

      expect(element.className).not.toContain('cursor-pointer');
      expect(element.className).not.toContain('hover:bg-gray-600');
    });

    it('onClickが指定されている場合、クリック可能なスタイルが適用される', () => {
      const { container } = render(<VersusIndicator onClick={mockOnClick} />);
      const element = container.firstChild as HTMLElement;

      expect(element.className).toContain('cursor-pointer');
      expect(element.className).toContain('hover:bg-gray-600');
    });
  });

  describe('クリックイベント', () => {
    it('onClickが指定されている場合、クリック時にonClickが呼ばれる', () => {
      render(<VersusIndicator onClick={mockOnClick} />);
      const element = screen.getByText('vs').parentElement;

      fireEvent.click(element!);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('onClickが指定されていない場合、クリックしてもエラーが起きない', () => {
      render(<VersusIndicator />);
      const element = screen.getByText('vs').parentElement;

      expect(() => fireEvent.click(element!)).not.toThrow();
    });
  });

  describe('classNameプロパティ', () => {
    it('classNameが指定されている場合、追加のクラスが適用される', () => {
      const { container } = render(<VersusIndicator className="custom-class" />);
      const element = container.firstChild as HTMLElement;

      expect(element.className).toContain('custom-class');
      expect(element.className).toContain('bg-gray-700'); // 基本クラスも含まれる
    });

    it('classNameが空文字列の場合、基本クラスのみ適用される', () => {
      const { container } = render(<VersusIndicator className="" />);
      const element = container.firstChild as HTMLElement;

      expect(element.className).toContain('bg-gray-700');
      expect(element.className).toContain('flex');
    });
  });

  describe('displayFlippedプロパティ', () => {
    it('displayFlipped=falseの場合、反転インジケーターが表示されない', () => {
      const { container } = render(<VersusIndicator displayFlipped={false} />);
      const svg = container.querySelector('svg');

      expect(svg).not.toBeInTheDocument();
    });

    it('displayFlipped=trueの場合、反転インジケーターが表示される', () => {
      const { container } = render(<VersusIndicator displayFlipped={true} />);
      const svg = container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg?.classList.contains('w-6')).toBe(true);
      expect(svg?.classList.contains('h-3')).toBe(true);
      expect(svg?.classList.contains('text-gray-400')).toBe(true);
    });

    it('displayFlippedが指定されていない場合（デフォルト）、反転インジケーターが表示されない', () => {
      const { container } = render(<VersusIndicator />);
      const svg = container.querySelector('svg');

      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('複数プロパティの組み合わせ', () => {
    it('onClick、className、displayFlippedを同時に指定した場合、すべて正しく動作する', () => {
      const { container } = render(
        <VersusIndicator
          onClick={mockOnClick}
          className="test-class"
          displayFlipped={true}
        />
      );

      const element = container.firstChild as HTMLElement;

      // className確認
      expect(element.className).toContain('test-class');
      expect(element.className).toContain('cursor-pointer');

      // displayFlipped確認
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // onClick確認
      fireEvent.click(element);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });
});
