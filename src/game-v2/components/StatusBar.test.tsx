import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { StatusBar } from './StatusBar';

describe('StatusBar', () => {
  const mockOnQRClick = vi.fn();
  const mockOnHomeClick = vi.fn();
  const mockOnCreditsClick = vi.fn();
  const mockOnTimeSyncClick = vi.fn();
  const mockOnControlPanelClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('接続ステータス表示', () => {
    it('connected + timeSyncStatus=good の場合、緑色で「接続中」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connected"
          timeSyncStatus="good"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/接続中/);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toContain('text-green-400');
    });

    it('connected + timeSyncStatus=warning の場合、黄色で「接続中 (同期注意)」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connected"
          timeSyncStatus="warning"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/接続中 \(同期注意\)/);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toContain('text-yellow-400');
    });

    it('connected + timeSyncStatus=error の場合、オレンジ色で「接続中 (同期問題)」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connected"
          timeSyncStatus="error"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/接続中 \(同期問題\)/);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toContain('text-orange-400');
    });

    it('connected + timeSyncStatus=unknown の場合、青色で「接続中 (同期中...)」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connected"
          timeSyncStatus="unknown"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/接続中 \(同期中\.\.\.\)/);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toContain('text-blue-400');
    });

    it('connectionStatus=connecting の場合、黄色で「接続中...」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connecting"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/接続中\.\.\./);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toContain('text-yellow-400');
    });

    it('connectionStatus=reconnecting の場合、オレンジ色で「再接続中...」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="reconnecting"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/再接続中\.\.\./);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toContain('text-orange-400');
      expect(statusElement.className).toContain('animate-pulse');
    });

    it('connectionStatus=disconnected の場合、赤色で「切断」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="disconnected"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/切断/);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement.className).toContain('text-red-400');
    });
  });

  describe('通信アニメーション表示', () => {
    it('sendingData=true の場合、ドットが黄色になる', () => {
      const { container } = render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connected"
          sendingData={true}
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const dot = container.querySelector('.text-yellow-300');
      expect(dot).toBeInTheDocument();
    });

    it('receivingData=true の場合、ドットがオレンジ色になる', () => {
      const { container } = render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connected"
          receivingData={true}
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const dot = container.querySelector('.text-orange-400');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('ボタンクリック', () => {
    it('QRボタンクリック時にonQRClickが呼ばれる', () => {
      render(
        <StatusBar
          gameId="test-game"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const qrButton = screen.getByText('QR').closest('button');
      expect(qrButton).toBeInTheDocument();
      fireEvent.click(qrButton!);
      expect(mockOnQRClick).toHaveBeenCalledTimes(1);
    });

    it('クレジットボタンクリック時にonCreditsClickが呼ばれる', () => {
      render(
        <StatusBar
          gameId="test-game"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      // hammer iconを持つbutton要素を探す
      const buttons = screen.getAllByRole('button');
      const creditsButton = buttons.find(btn => btn.querySelector('[data-lucide="hammer"]'));
      expect(creditsButton).toBeInTheDocument();
      fireEvent.click(creditsButton!);
      expect(mockOnCreditsClick).toHaveBeenCalledTimes(1);
    });

    it('コントロールパネルボタンクリック時にonControlPanelClickが呼ばれる', () => {
      render(
        <StatusBar
          gameId="test-game"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const controlPanelButton = screen.getByText(/コントロール/).closest('button');
      expect(controlPanelButton).toBeInTheDocument();
      fireEvent.click(controlPanelButton!);
      expect(mockOnControlPanelClick).toHaveBeenCalledTimes(1);
    });

    it('接続中かつonTimeSyncClickが設定されている場合、接続ステータスクリックでonTimeSyncClickが呼ばれる', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="connected"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/接続中/).closest('div');
      expect(statusElement).toBeInTheDocument();
      fireEvent.click(statusElement!);
      expect(mockOnTimeSyncClick).toHaveBeenCalledTimes(1);
    });

    it('切断中の場合、接続ステータスクリックしてもonTimeSyncClickは呼ばれない', () => {
      render(
        <StatusBar
          gameId="test-game"
          connectionStatus="disconnected"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      const statusElement = screen.getByText(/切断/).closest('div');
      expect(statusElement).toBeInTheDocument();
      fireEvent.click(statusElement!);
      expect(mockOnTimeSyncClick).not.toHaveBeenCalled();
    });
  });

  describe('controlPanelButtonTextプロパティ', () => {
    it('controlPanelButtonTextが指定されている場合、そのテキストが表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          controlPanelButtonText="カスタムテキスト"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      expect(screen.getByText(/カスタムテキスト/)).toBeInTheDocument();
    });

    it('controlPanelButtonTextが指定されていない場合、デフォルトで「コントロール」と表示される', () => {
      render(
        <StatusBar
          gameId="test-game"
          onQRClick={mockOnQRClick}
          onHomeClick={mockOnHomeClick}
          onCreditsClick={mockOnCreditsClick}
          onTimeSyncClick={mockOnTimeSyncClick}
          onControlPanelClick={mockOnControlPanelClick}
        />
      );

      expect(screen.getByText(/コントロール/)).toBeInTheDocument();
    });
  });
});
