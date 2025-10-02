import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { LoadingModal } from './LoadingModal';

type ConnectionStatus = 'connecting' | 'reconnecting' | 'error' | 'connected';

describe('LoadingModal', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('connectingステータス', () => {
    it('「接続中...」が表示される', () => {
      render(<LoadingModal connectionStatus="connecting" />);

      expect(screen.getByText('接続中...')).toBeInTheDocument();
      expect(screen.getByText('サーバーに接続しています')).toBeInTheDocument();
    });

    it('スピナーが表示される', () => {
      const { container } = render(<LoadingModal connectionStatus="connecting" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('リトライボタンは表示されない', () => {
      render(<LoadingModal connectionStatus="connecting" onRetry={mockOnRetry} />);

      expect(screen.queryByRole('button', { name: /再試行/ })).not.toBeInTheDocument();
    });
  });

  describe('reconnectingステータス', () => {
    it('「再接続中...」が表示される', () => {
      render(
        <LoadingModal
          connectionStatus="reconnecting"
          reconnectAttempts={3}
          maxReconnectAttempts={10}
        />
      );

      expect(screen.getByText('再接続中...')).toBeInTheDocument();
      expect(screen.getByText('サーバーに再接続中（3/10）')).toBeInTheDocument();
    });

    it('スピナーが表示される', () => {
      const { container } = render(<LoadingModal connectionStatus="reconnecting" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('再接続プログレスバーが表示される', () => {
      const { container } = render(
        <LoadingModal
          connectionStatus="reconnecting"
          reconnectAttempts={5}
          maxReconnectAttempts={10}
        />
      );

      const progressBar = container.querySelector('.bg-orange-400');
      expect(progressBar).toBeInTheDocument();
      // プログレスバーのwidthは計算されるため、存在確認のみ
    });

    it('再接続試行回数が表示される', () => {
      render(
        <LoadingModal
          connectionStatus="reconnecting"
          reconnectAttempts={7}
          maxReconnectAttempts={10}
        />
      );

      expect(screen.getByText('再接続試行中... (7/10)')).toBeInTheDocument();
    });

    it('リトライボタンは表示されない', () => {
      render(<LoadingModal connectionStatus="reconnecting" onRetry={mockOnRetry} />);

      expect(screen.queryByRole('button', { name: /再試行/ })).not.toBeInTheDocument();
    });
  });

  describe('errorステータス', () => {
    it('「接続エラー」が表示される', () => {
      render(<LoadingModal connectionStatus="error" />);

      expect(screen.getByText('接続エラー')).toBeInTheDocument();
    });

    it('デフォルトのエラーメッセージが表示される', () => {
      render(<LoadingModal connectionStatus="error" />);

      expect(screen.getByText('サーバーへの接続に失敗しました')).toBeInTheDocument();
    });

    it('カスタムエラーメッセージが表示される', () => {
      render(<LoadingModal connectionStatus="error" errorMessage="ネットワークエラー" />);

      expect(screen.getByText('ネットワークエラー')).toBeInTheDocument();
    });

    it('スピナーは表示されず、警告アイコンが表示される', () => {
      const { container } = render(<LoadingModal connectionStatus="error" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).not.toBeInTheDocument();

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('onRetryが渡された場合、リトライボタンが表示される', () => {
      render(<LoadingModal connectionStatus="error" onRetry={mockOnRetry} />);

      expect(screen.getByRole('button', { name: /再試行/ })).toBeInTheDocument();
    });

    it('リトライボタンをクリックするとonRetryが呼ばれる', () => {
      render(<LoadingModal connectionStatus="error" onRetry={mockOnRetry} />);

      const retryButton = screen.getByRole('button', { name: /再試行/ });
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('onRetryが渡されない場合、リトライボタンは表示されない', () => {
      render(<LoadingModal connectionStatus="error" />);

      expect(screen.queryByRole('button', { name: /再試行/ })).not.toBeInTheDocument();
    });
  });

  describe('connectedステータス（デフォルト）', () => {
    it('「読み込み中...」が表示される', () => {
      render(<LoadingModal connectionStatus="connected" />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
      expect(screen.getByText('ゲームデータを読み込んでいます')).toBeInTheDocument();
    });

    it('スピナーが表示される', () => {
      const { container } = render(<LoadingModal connectionStatus="connected" />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('共通要素', () => {
    it('「カバディタイマー」ロゴが常に表示される', () => {
      render(<LoadingModal connectionStatus="connecting" />);

      expect(screen.getByText('カバディタイマー')).toBeInTheDocument();
    });
  });

  describe('デフォルト値', () => {
    it('reconnectAttemptsのデフォルト値は0', () => {
      render(<LoadingModal connectionStatus="reconnecting" />);

      expect(screen.getByText('サーバーに再接続中（0/10）')).toBeInTheDocument();
    });

    it('maxReconnectAttemptsのデフォルト値は10', () => {
      render(<LoadingModal connectionStatus="reconnecting" reconnectAttempts={5} />);

      expect(screen.getByText('サーバーに再接続中（5/10）')).toBeInTheDocument();
    });
  });

  describe('プログレスバーの表示', () => {
    it('reconnectingステータスの場合、プログレスバーが存在する', () => {
      const { container } = render(
        <LoadingModal
          connectionStatus="reconnecting"
          reconnectAttempts={5}
          maxReconnectAttempts={10}
        />
      );

      const progressBar = container.querySelector('.bg-orange-400');
      expect(progressBar).toBeInTheDocument();
    });

    it('connecting/error/connectedステータスの場合、プログレスバーは表示されない', () => {
      const { container: containerConnecting } = render(
        <LoadingModal connectionStatus="connecting" />
      );
      expect(containerConnecting.querySelector('.bg-orange-400')).not.toBeInTheDocument();

      const { container: containerError } = render(
        <LoadingModal connectionStatus="error" />
      );
      expect(containerError.querySelector('.bg-orange-400')).not.toBeInTheDocument();

      const { container: containerConnected } = render(
        <LoadingModal connectionStatus="connected" />
      );
      expect(containerConnected.querySelector('.bg-orange-400')).not.toBeInTheDocument();
    });
  });
});
