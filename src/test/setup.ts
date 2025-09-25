import { vi } from 'vitest';

// windowオブジェクトのモック（jsdomで提供されるが、一部追加設定）
Object.defineProperty(global, 'window', {
  value: global,
  writable: true
});

// グローバルなwindowオブジェクトを設定
(global as any).window = global;

// 必要に応じて追加のモックを設定
// 例: localStorage, sessionStorageなど
if (typeof (global as any).localStorage === 'undefined') {
  (global as any).localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
}