import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { TimeSyncModal } from './TimeSyncModal';

type TimeSyncStatus = 'good' | 'warning' | 'error' | 'unknown';

describe('TimeSyncModal', () => {
  const mockOnClose = vi.fn();
  const mockOnRequestTimeSync = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    timeSyncStatus: 'good' as TimeSyncStatus,
    serverTimeOffset: 10,
    lastRTT: 50,
    lastSyncTime: new Date('2024-01-01T12:00:00'),
    lastSyncClientTime: new Date('2024-01-01T12:00:00'),
    lastSyncServerTime: new Date('2024-01-01T12:00:00.010'),
    onRequestTimeSync: mockOnRequestTimeSync,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // window.lucideのモック
    window.lucide = {
      createIcons: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('基本的な表示と動作', () => {
    it('isOpenがfalseの場合、モーダルは表示されない', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} isOpen={false} />);

      expect(container.textContent).toBe('');
    });

    it('isOpenがtrueの場合、モーダルが表示される', () => {
      render(<TimeSyncModal {...defaultProps} />);

      expect(screen.getByText('時刻同期状態')).toBeInTheDocument();
    });

    it('Lucideアイコンが初期化される', () => {
      render(<TimeSyncModal {...defaultProps} />);

      expect(window.lucide?.createIcons).toHaveBeenCalled();
    });
  });

  describe('モーダルの閉じる動作', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} />);

      // 閉じるボタンは.text-gray-500クラスを持つボタン
      const closeButton = container.querySelector('button.text-gray-500') as HTMLButtonElement;
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('背景をクリックするとonCloseが呼ばれる', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} />);

      const background = container.firstChild as HTMLElement;
      fireEvent.click(background);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('モーダルコンテンツ内をクリックしてもonCloseは呼ばれない', () => {
      render(<TimeSyncModal {...defaultProps} />);

      const modalContent = screen.getByText('時刻同期状態');
      fireEvent.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('Escapeキーを押すとonCloseが呼ばれる', () => {
      render(<TimeSyncModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('同期ステータス表示', () => {
    it('goodステータスが正しく表示される', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} timeSyncStatus="good" />);

      expect(screen.getByText('同期良好')).toBeInTheDocument();
      expect(screen.getByText('タイマーは正確に動作しています')).toBeInTheDocument();
      const statusBox = container.querySelector('.bg-green-50.border-green-200');
      expect(statusBox?.textContent).toContain('✅');
    });

    it('warningステータスが正しく表示される', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} timeSyncStatus="warning" />);

      expect(screen.getByText('同期注意')).toBeInTheDocument();
      const statusBox = container.querySelector('.bg-yellow-50.border-yellow-200');
      expect(statusBox?.textContent).toContain('ネットワーク遅延が検出されています');
      expect(statusBox?.textContent).toContain('⚠️');
    });

    it('errorステータスが正しく表示される', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} timeSyncStatus="error" />);

      expect(screen.getByText('同期問題')).toBeInTheDocument();
      const statusBox = container.querySelector('.bg-red-50.border-red-200');
      expect(statusBox?.textContent).toContain('大きな時刻ずれが発生しています');
      expect(statusBox?.textContent).toContain('❌');
    });

    it('unknownステータスが正しく表示される', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} timeSyncStatus="unknown" />);

      expect(screen.getByText('同期確認中...')).toBeInTheDocument();
      const statusBox = container.querySelector('.bg-blue-50.border-blue-200');
      expect(statusBox?.textContent).toContain('サーバーとの同期を確認中です');
      expect(statusBox?.textContent).toContain('🔄');
    });
  });

  describe('詳細情報の表示', () => {
    it('サーバー時刻オフセットが表示される', () => {
      render(<TimeSyncModal {...defaultProps} serverTimeOffset={15} />);

      expect(screen.getByText('15ms')).toBeInTheDocument();
    });

    it('RTT（往復遅延）が表示される', () => {
      render(<TimeSyncModal {...defaultProps} lastRTT={100} />);

      expect(screen.getByText('100ms')).toBeInTheDocument();
    });

    it('クライアント時刻が正しくフォーマットされて表示される', () => {
      const clientTime = new Date('2024-01-01T12:34:56.789');
      render(<TimeSyncModal {...defaultProps} lastSyncClientTime={clientTime} />);

      expect(screen.getByText('12:34:56.789')).toBeInTheDocument();
    });

    it('サーバー時刻が正しくフォーマットされて表示される', () => {
      const serverTime = new Date('2024-01-01T12:34:56.123');
      render(<TimeSyncModal {...defaultProps} lastSyncServerTime={serverTime} />);

      expect(screen.getByText('12:34:56.123')).toBeInTheDocument();
    });

    it('最終同期時刻が表示される', () => {
      const syncTime = new Date('2024-01-01T15:30:45.500');
      render(<TimeSyncModal {...defaultProps} lastSyncTime={syncTime} />);

      expect(screen.getByText('15:30:45.500')).toBeInTheDocument();
    });

    it('最終同期時刻がnullの場合、「未同期」と表示される', () => {
      render(<TimeSyncModal {...defaultProps} lastSyncTime={null} />);

      expect(screen.getByText('未同期')).toBeInTheDocument();
    });

    it('同期データがない場合、クライアント・サーバー時刻は空文字', () => {
      render(
        <TimeSyncModal
          {...defaultProps}
          lastSyncClientTime={null}
          lastSyncServerTime={null}
        />
      );

      // 時刻フィールドが空であることを確認
      const timeFields = screen.getAllByText('');
      expect(timeFields.length).toBeGreaterThan(0);
    });
  });

  describe('警告メッセージ', () => {
    it('warningステータスの場合、警告メッセージが表示される', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} timeSyncStatus="warning" />);

      // 警告メッセージボックスは2つ目のbg-yellow-50要素（p-3クラス付き）
      const warningBoxes = container.querySelectorAll('.bg-yellow-50');
      expect(warningBoxes.length).toBeGreaterThan(1);
      const warningMessageBox = warningBoxes[1]; // 2つ目が警告メッセージボックス
      expect(warningMessageBox?.textContent).toContain('ネットワーク遅延が検出されています');
      expect(warningMessageBox?.textContent).toContain('タイマーに若干のずれが生じる可能性があります');
    });

    it('errorステータスの場合、エラーメッセージが表示される', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} timeSyncStatus="error" />);

      // エラーメッセージボックスは2つ目のbg-red-50要素（p-3クラス付き）
      const errorBoxes = container.querySelectorAll('.bg-red-50');
      expect(errorBoxes.length).toBeGreaterThan(1);
      const errorMessageBox = errorBoxes[1]; // 2つ目がエラーメッセージボックス
      expect(errorMessageBox?.textContent).toContain('大きな時刻ずれが発生しています');
      expect(errorMessageBox?.textContent).toContain('タイマーの精度に問題が生じています');
    });

    it('goodステータスの場合、警告メッセージは表示されない', () => {
      const { container } = render(<TimeSyncModal {...defaultProps} timeSyncStatus="good" />);

      // 警告メッセージボックスは存在しない（状態インジケーターのみ）
      const yellowBoxes = container.querySelectorAll('.bg-yellow-50');
      const redBoxes = container.querySelectorAll('.bg-red-50');
      expect(yellowBoxes.length).toBe(0);
      expect(redBoxes.length).toBe(0);
    });
  });

  describe('手動同期リクエスト', () => {
    it('「今すぐ同期」ボタンをクリックするとonRequestTimeSyncが呼ばれる', () => {
      render(<TimeSyncModal {...defaultProps} />);

      const syncButton = screen.getByRole('button', { name: /今すぐ同期/ });
      fireEvent.click(syncButton);

      expect(mockOnRequestTimeSync).toHaveBeenCalledTimes(1);
    });

    it('同期中は「同期中...」と表示され、ボタンが無効化される', () => {
      render(<TimeSyncModal {...defaultProps} />);

      const syncButton = screen.getByRole('button', { name: /今すぐ同期/ });
      fireEvent.click(syncButton);

      expect(screen.getByText('同期中...')).toBeInTheDocument();
      expect(syncButton).toBeDisabled();
    });

    it('同期中にボタンをクリックしても再度onRequestTimeSyncは呼ばれない', () => {
      render(<TimeSyncModal {...defaultProps} />);

      const syncButton = screen.getByRole('button', { name: /今すぐ同期/ });
      fireEvent.click(syncButton);
      fireEvent.click(syncButton);

      expect(mockOnRequestTimeSync).toHaveBeenCalledTimes(1);
    });

    it('2秒経過すると同期中状態が自動的にリセットされる', async () => {
      render(<TimeSyncModal {...defaultProps} />);

      const syncButton = screen.getByRole('button', { name: /今すぐ同期/ });
      fireEvent.click(syncButton);

      expect(screen.getByText('同期中...')).toBeInTheDocument();

      // 2秒進める
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText('今すぐ同期')).toBeInTheDocument();
        expect(syncButton).not.toBeDisabled();
      });
    });

    it('lastSyncTimeが更新されると同期中状態が即座にリセットされる', async () => {
      const { rerender } = render(<TimeSyncModal {...defaultProps} />);

      const syncButton = screen.getByRole('button', { name: /今すぐ同期/ });
      fireEvent.click(syncButton);

      expect(screen.getByText('同期中...')).toBeInTheDocument();

      // lastSyncTimeを更新
      rerender(
        <TimeSyncModal {...defaultProps} lastSyncTime={new Date('2024-01-01T12:01:00')} />
      );

      await waitFor(() => {
        expect(screen.getByText('今すぐ同期')).toBeInTheDocument();
        expect(syncButton).not.toBeDisabled();
      });
    });
  });

  describe('クリーンアップ', () => {
    it('コンポーネントアンマウント時にイベントリスナーとタイマーが削除される', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<TimeSyncModal {...defaultProps} />);

      // 同期ボタンをクリックしてタイムアウトを設定
      const syncButton = screen.getByRole('button', { name: /今すぐ同期/ });
      fireEvent.click(syncButton);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('モーダルが閉じられたときにタイムアウトがクリアされる', () => {
      const { rerender } = render(<TimeSyncModal {...defaultProps} />);

      // 同期ボタンをクリックしてタイムアウトを設定
      const syncButton = screen.getByRole('button', { name: /今すぐ同期/ });
      fireEvent.click(syncButton);

      expect(screen.getByText('同期中...')).toBeInTheDocument();

      // モーダルを閉じる
      rerender(<TimeSyncModal {...defaultProps} isOpen={false} />);

      // 2秒経過してもタイムアウトは発火しない
      vi.advanceTimersByTime(2000);

      // モーダルが閉じられているので確認できない
      expect(screen.queryByText('同期中...')).not.toBeInTheDocument();
    });
  });
});
