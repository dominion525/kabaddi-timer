import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['src/durable-objects/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/client/**', '**/routes/**'],
    poolOptions: {
      workers: {
        singleWorker: true,
        isolatedStorage: false,
        wrangler: {
          configPath: './wrangler.toml'
        },
        main: './src/durable-objects/index.ts'
      }
    },
    globals: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000
  },
  esbuild: {
    target: 'es2022'
  }
});