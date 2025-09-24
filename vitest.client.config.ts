import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/client/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: 'jsdom',  // ブラウザ環境のシミュレーション
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000
  },
  esbuild: {
    target: 'es2022'
  }
});