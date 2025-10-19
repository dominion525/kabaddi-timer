import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { CreditsModal } from './CreditsModal';

describe('CreditsModal', () => {
  const mockOnClose = vi.fn();
  const mockRevision = 'abc1234';
  const mockFullRevision = 'abc1234567890abcdef1234567890abcdef';

  beforeEach(() => {
    vi.clearAllMocks();

    // window.lucideのモック
    window.lucide = {
      createIcons: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本的な表示と動作', () => {
    it('isOpenがfalseの場合、モーダルは表示されない', () => {
      const { container } = render(
        <CreditsModal
          isOpen={false}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      // isOpenがfalseの時は.hiddenクラスが適用される
      const modal = container.querySelector('#creditsModal');
      expect(modal).toHaveClass('hidden');
    });

    it('isOpenがtrueの場合、モーダルが表示される', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('Lucideアイコンが初期化される', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      expect(window.lucide?.createIcons).toHaveBeenCalled();
    });

    it('モーダルが閉じているときはLucideアイコンは初期化されない', () => {
      render(
        <CreditsModal
          isOpen={false}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      expect(window.lucide?.createIcons).not.toHaveBeenCalled();
    });
  });

  describe('モーダルの閉じる動作', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('背景をクリックするとonCloseが呼ばれる', () => {
      const { container } = render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      const background = container.querySelector('#creditsModal') as HTMLElement;
      fireEvent.click(background);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('モーダルコンテンツ内をクリックしてもonCloseは呼ばれない', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      const modalContent = screen.getByText('About');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('Escapeキーを押すとonCloseが呼ばれる', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('Escape以外のキーではonCloseは呼ばれない', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('リビジョン情報', () => {
    it('短縮リビジョン（先頭7文字）が表示される', () => {
      const revision = 'abcdefg1234567890';
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={revision}
          fullRevision={revision}
        />
      );

      expect(screen.getByText('abcdefg')).toBeInTheDocument();
    });

    it('GitHubコミットURLが正しく生成される', () => {
      const fullRevision = 'abc123def456';
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={fullRevision}
        />
      );

      const commitLink = screen.getByRole('link', { name: /abc1234/ });
      expect(commitLink).toHaveAttribute(
        'href',
        `https://github.com/dominion525/kabaddi-timer/commit/${fullRevision}`
      );
    });

    it('GitHubリポジトリへのリンクが表示される', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      const repoLink = screen.getByRole('link', {
        name: /dominion525\/kabaddi-timer/,
      });
      expect(repoLink).toHaveAttribute(
        'href',
        'https://github.com/dominion525/kabaddi-timer'
      );
    });
  });

  describe('コンテンツ表示', () => {
    beforeEach(() => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );
    });

    it('アプリケーション名が表示される', () => {
      expect(screen.getByText('Kabaddi Timer')).toBeInTheDocument();
    });

    it('アプリケーション説明が表示される', () => {
      expect(
        screen.getByText('カバディ用リアルタイムタイマー・スコアボード')
      ).toBeInTheDocument();
    });

    it('開発者名が表示される', () => {
      expect(screen.getByText('Dominion525')).toBeInTheDocument();
    });

    it('技術スタック情報が表示される', () => {
      expect(screen.getByText('Built with Cloudflare Workers')).toBeInTheDocument();
      expect(screen.getByText('TypeScript, Tailwind CSS, WebSocket')).toBeInTheDocument();
    });

    it('Special Thanksが表示される', () => {
      expect(screen.getByText('Special Thanks to')).toBeInTheDocument();
      expect(screen.getByText('東京レイズ and other teams')).toBeInTheDocument();
    });

    it('Kababdi Communityメッセージが表示される', () => {
      expect(screen.getByText('Made with ❤️ for Kabaddi Community')).toBeInTheDocument();
    });

    it('Twitterリンクが表示される', () => {
      const twitterLink = screen.getByRole('link', { name: /Twitter/i });
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/dominion525');
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('画像パス', () => {
    it('アプリアイコンのパスが正しい', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      const appIcon = screen.getByAltText('Kabaddi Timer Icon');
      expect(appIcon).toHaveAttribute('src', '/images/kabaddi-timer-app-icon.png');
    });

    it('開発者アバターのパスが正しい', () => {
      render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      const devAvatar = screen.getByAltText('Developer Avatar');
      expect(devAvatar).toHaveAttribute('src', '/images/depra6.png');
    });
  });

  describe('クリーンアップ', () => {
    it('コンポーネントアンマウント時にイベントリスナーが削除される', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('isOpenがfalseに変わったときにイベントリスナーが削除される', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { rerender } = render(
        <CreditsModal
          isOpen={true}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      rerender(
        <CreditsModal
          isOpen={false}
          onClose={mockOnClose}
          revision={mockRevision}
          fullRevision={mockFullRevision}
        />
      );

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
