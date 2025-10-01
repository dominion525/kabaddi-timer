import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/index-page/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: 'node',  // ユーティリティ関数のテストなのでNode環境で十分
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage-index-page',
      reportOnFailure: true,
      include: ['src/index-page/**/*.ts', 'src/index-page/**/*.tsx'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
      ]
    }
  },
  esbuild: {
    target: 'es2022'
  }
});
