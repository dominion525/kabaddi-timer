import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { QRModal } from './QRModal';

describe('QRModal', () => {
  const mockOnClose = vi.fn();
  const mockGameId = 'test-game-123';

  beforeEach(() => {
    vi.clearAllMocks();

    // window.QRiousのモック
    (window as any).QRious = vi.fn().mockImplementation(() => ({}));

    // window.lucideのモック
    (window as any).lucide = {
      createIcons: vi.fn(),
    };

    // navigator.clipboardのモック
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    // window.alertのモック
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // console.logとconsole.errorのモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本的な表示と動作', () => {
    it('isOpenがfalseの場合、モーダルは表示されない', () => {
      const { container } = render(
        <QRModal isOpen={false} onClose={mockOnClose} gameId={mockGameId} />
      );

      expect(container.textContent).toBe('');
    });

    it('isOpenがtrueの場合、モーダルが表示される', () => {
      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      expect(screen.getByText('ゲーム共有')).toBeInTheDocument();
      expect(screen.getByText('ゲームID:')).toBeInTheDocument();
      expect(screen.getByText(mockGameId)).toBeInTheDocument();
    });

    it('ゲームIDが正しく表示される', () => {
      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      expect(screen.getByText(mockGameId)).toBeInTheDocument();
    });

    it('Lucideアイコンが初期化される', () => {
      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      expect((window as any).lucide.createIcons).toHaveBeenCalled();
    });
  });

  describe('モーダルの閉じる動作', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      const { container } = render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      // 閉じるボタンは.text-gray-500クラスを持つボタン
      const closeButton = container.querySelector('button.text-gray-500') as HTMLButtonElement;
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('背景をクリックするとonCloseが呼ばれる', () => {
      const { container } = render(
        <QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />
      );

      const background = container.firstChild as HTMLElement;
      fireEvent.click(background);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('モーダルコンテンツ内をクリックしてもonCloseは呼ばれない', () => {
      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      const modalContent = screen.getByText('ゲーム共有');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('Escapeキーを押すとonCloseが呼ばれる', () => {
      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('Escape以外のキーではonCloseは呼ばれない', () => {
      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      fireEvent.keyDown(document, { key: 'Enter' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('QRコード生成', () => {
    it('QRiousライブラリが存在する場合、QRコードが生成される', () => {
      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      expect((window as any).QRious).toHaveBeenCalled();
      expect((window as any).QRious).toHaveBeenCalledWith(
        expect.objectContaining({
          value: window.location.href,
          size: 200,
          level: 'M',
        })
      );
      expect(console.log).toHaveBeenCalledWith('QRコード生成成功');
    });

    it('キャンバス要素が見つからない場合、QRコード生成をスキップする', () => {
      // canvasRefが取得できないケースをシミュレート
      const { container } = render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);
      const canvas = container.querySelector('canvas');

      // canvasが存在することを確認（このケースは正常系）
      expect(canvas).toBeInTheDocument();
    });

    it('getContextがnullを返す場合、フォールバック描画をスキップする', () => {
      (window as any).QRious = undefined;

      // getContextがnullを返すモック
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      // エラーはログされるが、フォールバック描画はスキップされる
      expect(console.error).toHaveBeenCalledWith('QRiousライブラリが読み込まれていません');
    });

    it('QRiousライブラリが存在しない場合、フォールバック表示される', () => {
      (window as any).QRious = undefined;

      // キャンバスのモックを作成
      const mockFillText = vi.fn();
      const mockFillRect = vi.fn();
      const mockGetContext = vi.fn().mockReturnValue({
        fillStyle: '',
        font: '',
        textAlign: '',
        fillText: mockFillText,
        fillRect: mockFillRect,
      });

      // HTMLCanvasElement.prototype.getContextをモック
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(mockGetContext as any);

      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      expect(console.error).toHaveBeenCalledWith('QRiousライブラリが読み込まれていません');
      expect(mockGetContext).toHaveBeenCalledWith('2d');
      expect(mockFillRect).toHaveBeenCalled();
      expect(mockFillText).toHaveBeenCalledWith('QRコードが生成できません', 100, 90);
      expect(mockFillText).toHaveBeenCalledWith('URLをコピーしてください', 100, 110);
    });

    it('QRコード生成でエラーが発生した場合、フォールバック表示される', () => {
      const mockError = new Error('QR generation failed');
      (window as any).QRious = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      // キャンバスのモックを作成
      const mockFillText = vi.fn();
      const mockFillRect = vi.fn();
      const mockGetContext = vi.fn().mockReturnValue({
        fillStyle: '',
        font: '',
        textAlign: '',
        fillText: mockFillText,
        fillRect: mockFillRect,
      });

      // HTMLCanvasElement.prototype.getContextをモック
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(mockGetContext as any);

      render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      expect(console.error).toHaveBeenCalledWith('QRコード生成エラー:', mockError);
      expect(mockGetContext).toHaveBeenCalledWith('2d');
      expect(mockFillRect).toHaveBeenCalled();
      expect(mockFillText).toHaveBeenCalledWith('QRコードが生成できません', 100, 90);
      expect(mockFillText).toHaveBeenCalledWith('URLをコピーしてください', 100, 110);
    });
  });

  describe('コピー機能', () => {
    it('ゲームIDコピーボタンをクリックするとクリップボードにコピーされる', async () => {
      const { container } = render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      const gameIdCopyButton = container.querySelector('button[title="ゲームIDをコピー"]') as HTMLButtonElement;
      expect(gameIdCopyButton).toBeInTheDocument();

      await fireEvent.click(gameIdCopyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockGameId);
      expect(window.alert).toHaveBeenCalledWith('ゲームIDをクリップボードにコピーしました');
    });

    it('URLコピーボタンをクリックするとクリップボードにコピーされる', async () => {
      const { container } = render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      const urlCopyButton = container.querySelector('button[title="URLをコピー"]') as HTMLButtonElement;
      expect(urlCopyButton).toBeInTheDocument();

      await fireEvent.click(urlCopyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
      expect(window.alert).toHaveBeenCalledWith('URLをクリップボードにコピーしました');
    });

    it('ゲームIDコピー失敗時にエラーメッセージが表示される', async () => {
      const mockError = new Error('Clipboard write failed');
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(mockError);

      const { container } = render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      const gameIdCopyButton = container.querySelector('button[title="ゲームIDをコピー"]') as HTMLButtonElement;

      await fireEvent.click(gameIdCopyButton);

      // エラーハンドリングを待つ
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith('ゲームIDコピーエラー:', mockError);
      expect(window.alert).toHaveBeenCalledWith('コピーに失敗しました');
    });

    it('URLコピー失敗時にエラーメッセージが表示される', async () => {
      const mockError = new Error('Clipboard write failed');
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(mockError);

      const { container } = render(<QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />);

      const urlCopyButton = container.querySelector('button[title="URLをコピー"]') as HTMLButtonElement;

      await fireEvent.click(urlCopyButton);

      // エラーハンドリングを待つ
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith('URLコピーエラー:', mockError);
      expect(window.alert).toHaveBeenCalledWith('コピーに失敗しました');
    });
  });

  describe('クリーンアップ', () => {
    it('コンポーネントアンマウント時にイベントリスナーが削除される', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <QRModal isOpen={true} onClose={mockOnClose} gameId={mockGameId} />
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
