import { h } from 'preact';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { DoOrDieIndicator } from './DoOrDieIndicator';

describe('DoOrDieIndicator', () => {
  describe('Do or Die状態の表示', () => {
    it('count=0の場合、非アクティブ状態で表示される', () => {
      const { container } = render(<DoOrDieIndicator count={0} teamColor="blue" />);

      const indicator = container.querySelector('.bg-blue-900');
      expect(indicator).toBeInTheDocument();

      const text = container.querySelector('.text-gray-500');
      expect(text).toBeInTheDocument();
      expect(text?.textContent).toBe('Do or Die');
    });

    it('count=1の場合、非アクティブ状態で表示される', () => {
      const { container } = render(<DoOrDieIndicator count={1} teamColor="red" />);

      const indicator = container.querySelector('.bg-red-900');
      expect(indicator).toBeInTheDocument();

      const text = container.querySelector('.text-gray-500');
      expect(text).toBeInTheDocument();
    });

    it('count=2の場合、非アクティブ状態で表示される', () => {
      const { container } = render(<DoOrDieIndicator count={2} teamColor="blue" />);

      const indicator = container.querySelector('.bg-blue-900');
      expect(indicator).toBeInTheDocument();

      const text = container.querySelector('.text-gray-500');
      expect(text).toBeInTheDocument();
    });

    it('count=3の場合、アクティブ状態（黄色）で表示される', () => {
      const { container } = render(<DoOrDieIndicator count={3} teamColor="blue" />);

      const indicator = container.querySelector('.bg-yellow-400');
      expect(indicator).toBeInTheDocument();

      const text = container.querySelector('.text-gray-900');
      expect(text).toBeInTheDocument();
      expect(text?.textContent).toBe('Do or Die');
    });
  });

  describe('チームカラーによる非アクティブ色', () => {
    it('blue チームの場合、非アクティブ時は bg-blue-900 が適用される', () => {
      const { container } = render(<DoOrDieIndicator count={0} teamColor="blue" />);

      const indicator = container.querySelector('.bg-blue-900');
      expect(indicator).toBeInTheDocument();
    });

    it('red チームの場合、非アクティブ時は bg-red-900 が適用される', () => {
      const { container } = render(<DoOrDieIndicator count={0} teamColor="red" />);

      const indicator = container.querySelector('.bg-red-900');
      expect(indicator).toBeInTheDocument();
    });

    it('green チームの場合、非アクティブ時は bg-gray-900 が適用される（デフォルト）', () => {
      const { container } = render(<DoOrDieIndicator count={0} teamColor="green" />);

      const indicator = container.querySelector('.bg-gray-900');
      expect(indicator).toBeInTheDocument();
    });

    it('purple チームの場合、非アクティブ時は bg-gray-900 が適用される（デフォルト）', () => {
      const { container } = render(<DoOrDieIndicator count={0} teamColor="purple" />);

      const indicator = container.querySelector('.bg-gray-900');
      expect(indicator).toBeInTheDocument();
    });

    it('未知のチームカラーの場合、非アクティブ時は bg-gray-900 が適用される（デフォルト）', () => {
      const { container } = render(<DoOrDieIndicator count={0} teamColor="unknown" />);

      const indicator = container.querySelector('.bg-gray-900');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('アクティブ状態（count=3）のチームカラー', () => {
    it('blue チームでもアクティブ時は bg-yellow-400 が適用される', () => {
      const { container } = render(<DoOrDieIndicator count={3} teamColor="blue" />);

      const indicator = container.querySelector('.bg-yellow-400');
      expect(indicator).toBeInTheDocument();

      const text = container.querySelector('.text-gray-900');
      expect(text).toBeInTheDocument();
    });

    it('red チームでもアクティブ時は bg-yellow-400 が適用される', () => {
      const { container } = render(<DoOrDieIndicator count={3} teamColor="red" />);

      const indicator = container.querySelector('.bg-yellow-400');
      expect(indicator).toBeInTheDocument();

      const text = container.querySelector('.text-gray-900');
      expect(text).toBeInTheDocument();
    });
  });

  describe('境界値テスト', () => {
    it('count が負の値の場合、非アクティブ状態で表示される', () => {
      const { container } = render(<DoOrDieIndicator count={-1} teamColor="blue" />);

      const indicator = container.querySelector('.bg-blue-900');
      expect(indicator).toBeInTheDocument();
    });

    it('count が 3 を超える場合、アクティブ状態で表示される', () => {
      const { container } = render(<DoOrDieIndicator count={5} teamColor="blue" />);

      const indicator = container.querySelector('.bg-yellow-400');
      expect(indicator).toBeInTheDocument();
    });
  });
});
