import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/game-v2/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: 'jsdom',  // ブラウザ環境のシミュレーション（Preactコンポーネント用）
    setupFiles: ['./src/game-v2/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage-game-v2',
      reportOnFailure: true,
      include: ['src/game-v2/**/*.ts', 'src/game-v2/**/*.tsx'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/game-v2/test/**'
      ]
    }
  },
  esbuild: {
    target: 'es2022'
  },
  // Preactのエイリアス設定
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat'
    }
  }
});