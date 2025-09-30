import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['src/durable-objects/**/*.test.ts', 'src/test/utils/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/routes/**'],
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
    testTimeout: 3000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    coverage: {
      enabled: true,
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/templates/**',
        'src/test/**'
      ]
    }
  },
  esbuild: {
    target: 'es2022'
  }
});