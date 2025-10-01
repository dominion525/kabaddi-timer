import { h } from 'preact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { MobileHandleSection } from './MobileHandleSection';

describe('MobileHandleSection', () => {
  const mockOnClose = vi.fn();
  const mockOnToggleSimpleMode = vi.fn();
  const mockOnToggleScrollLock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(
        <MobileHandleSection
          simpleMode={false}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      expect(screen.getByTestId('mobile-handle-section')).toBeInTheDocument();
    });

    it('クローズハンドルが常に表示される', () => {
      render(
        <MobileHandleSection
          simpleMode={false}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      expect(screen.getByTestId('close-handle')).toBeInTheDocument();
    });

    it('シンプルモードトグルが常に表示される', () => {
      render(
        <MobileHandleSection
          simpleMode={false}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      expect(screen.getByTestId('simple-mode-toggle')).toBeInTheDocument();
    });
  });

  describe('スクロールロックトグルの条件付き表示', () => {
    it('simpleModeがfalseの時、スクロールロックトグルが表示されない', () => {
      render(
        <MobileHandleSection
          simpleMode={false}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      expect(screen.queryByTestId('scroll-lock-toggle')).not.toBeInTheDocument();
    });

    it('simpleModeがtrueの時、スクロールロックトグルが表示される', () => {
      render(
        <MobileHandleSection
          simpleMode={true}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      expect(screen.getByTestId('scroll-lock-toggle')).toBeInTheDocument();
    });
  });

  describe('ボタン動作', () => {
    it('クローズハンドルクリック時にonCloseが呼ばれる', () => {
      render(
        <MobileHandleSection
          simpleMode={false}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      const handle = screen.getByTestId('close-handle');
      fireEvent.click(handle);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('シンプルモードトグルクリック時にonToggleSimpleModeが呼ばれる', () => {
      render(
        <MobileHandleSection
          simpleMode={false}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      const toggle = screen.getByTestId('simple-mode-toggle');
      fireEvent.click(toggle);
      expect(mockOnToggleSimpleMode).toHaveBeenCalledTimes(1);
    });

    it('スクロールロックトグルクリック時にonToggleScrollLockが呼ばれる', () => {
      render(
        <MobileHandleSection
          simpleMode={true}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      const toggle = screen.getByTestId('scroll-lock-toggle');
      fireEvent.click(toggle);
      expect(mockOnToggleScrollLock).toHaveBeenCalledTimes(1);
    });
  });

  describe('トグルスタイル', () => {
    it('simpleModeがtrueの時、シンプルモードトグルにbg-blue-500が適用される', () => {
      render(
        <MobileHandleSection
          simpleMode={true}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      const toggle = screen.getByTestId('simple-mode-toggle');
      expect(toggle).toHaveClass('bg-blue-500');
    });

    it('simpleModeがfalseの時、シンプルモードトグルにbg-gray-300が適用される', () => {
      render(
        <MobileHandleSection
          simpleMode={false}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      const toggle = screen.getByTestId('simple-mode-toggle');
      expect(toggle).toHaveClass('bg-gray-300');
    });

    it('scrollLockEnabledがtrueの時、スクロールロックトグルにbg-blue-500が適用される', () => {
      render(
        <MobileHandleSection
          simpleMode={true}
          scrollLockEnabled={true}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      const toggle = screen.getByTestId('scroll-lock-toggle');
      expect(toggle).toHaveClass('bg-blue-500');
    });

    it('scrollLockEnabledがfalseの時、スクロールロックトグルにbg-gray-300が適用される', () => {
      render(
        <MobileHandleSection
          simpleMode={true}
          scrollLockEnabled={false}
          onClose={mockOnClose}
          onToggleSimpleMode={mockOnToggleSimpleMode}
          onToggleScrollLock={mockOnToggleScrollLock}
        />
      );
      const toggle = screen.getByTestId('scroll-lock-toggle');
      expect(toggle).toHaveClass('bg-gray-300');
    });
  });
});
