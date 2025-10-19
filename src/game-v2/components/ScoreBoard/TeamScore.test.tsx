import { h } from 'preact';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { TeamScore } from './TeamScore';

describe('TeamScore', () => {
  describe('スコア表示', () => {
    it('スコアが正しく表示される', () => {
      const team = {
        name: 'チームA',
        score: 42,
        doOrDieCount: 0,
        color: 'blue',
      };

      render(<TeamScore team={team} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('スコアが0の場合、0が表示される', () => {
      const team = {
        name: 'チームA',
        score: 0,
        doOrDieCount: 0,
        color: 'red',
      };

      render(<TeamScore team={team} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('スコアが99の場合、99が表示される', () => {
      const team = {
        name: 'チームB',
        score: 99,
        doOrDieCount: 3,
        color: 'green',
      };

      render(<TeamScore team={team} />);

      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });

  describe('チームカラーによる背景色', () => {
    it('blue チームの場合、bg-blue-600 が適用される', () => {
      const team = {
        name: 'チームA',
        score: 10,
        doOrDieCount: 0,
        color: 'blue',
      };

      const { container } = render(<TeamScore team={team} />);

      const scoreElement = container.querySelector('.bg-blue-600');
      expect(scoreElement).toBeInTheDocument();
    });

    it('red チームの場合、bg-red-600 が適用される', () => {
      const team = {
        name: 'チームB',
        score: 20,
        doOrDieCount: 1,
        color: 'red',
      };

      const { container } = render(<TeamScore team={team} />);

      const scoreElement = container.querySelector('.bg-red-600');
      expect(scoreElement).toBeInTheDocument();
    });

    it('green チームの場合、bg-green-600 が適用される', () => {
      const team = {
        name: 'チームC',
        score: 30,
        doOrDieCount: 2,
        color: 'green',
      };

      const { container } = render(<TeamScore team={team} />);

      const scoreElement = container.querySelector('.bg-green-600');
      expect(scoreElement).toBeInTheDocument();
    });

    it('purple チームの場合、bg-purple-600 が適用される', () => {
      const team = {
        name: 'チームD',
        score: 40,
        doOrDieCount: 3,
        color: 'purple',
      };

      const { container } = render(<TeamScore team={team} />);

      const scoreElement = container.querySelector('.bg-purple-600');
      expect(scoreElement).toBeInTheDocument();
    });

    it('未知のカラーの場合、bg-gray-600 が適用される（デフォルト）', () => {
      const team = {
        name: 'チームE',
        score: 50,
        doOrDieCount: 0,
        color: 'unknown',
      };

      const { container } = render(<TeamScore team={team} />);

      const scoreElement = container.querySelector('.bg-gray-600');
      expect(scoreElement).toBeInTheDocument();
    });
  });

  describe('Do or Die インジケーター', () => {
    it('DoOrDieIndicatorコンポーネントが表示される', () => {
      const team = {
        name: 'チームA',
        score: 10,
        doOrDieCount: 2,
        color: 'blue',
      };

      const { container } = render(<TeamScore team={team} />);

      // "Do or Die"テキストが含まれているか確認
      expect(screen.getByText('Do or Die')).toBeInTheDocument();
    });

    it('doOrDieCount=0の場合、非アクティブ状態のDoOrDieIndicatorが表示される', () => {
      const team = {
        name: 'チームA',
        score: 10,
        doOrDieCount: 0,
        color: 'blue',
      };

      const { container } = render(<TeamScore team={team} />);

      // 非アクティブ背景色（bg-blue-900）が適用されているか確認
      const indicator = container.querySelector('.bg-blue-900');
      expect(indicator).toBeInTheDocument();
    });

    it('doOrDieCount=3の場合、アクティブ状態のDoOrDieIndicatorが表示される', () => {
      const team = {
        name: 'チームA',
        score: 10,
        doOrDieCount: 3,
        color: 'blue',
      };

      const { container } = render(<TeamScore team={team} />);

      // アクティブ背景色（bg-yellow-400）が適用されているか確認
      const indicator = container.querySelector('.bg-yellow-400');
      expect(indicator).toBeInTheDocument();
    });
  });
});
