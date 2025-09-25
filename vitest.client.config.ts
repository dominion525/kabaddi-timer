import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/test/client/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: 'jsdom',  // ブラウザ環境のシミュレーション
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage-client',
      reportOnFailure: true,
      include: ['src/client/**/*.ts'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/test/**'
      ]
    }
  },
  esbuild: {
    target: 'es2022'
  }
});