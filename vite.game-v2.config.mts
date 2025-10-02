import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  publicDir: false,  // Cloudflare Workersが直接public/を配信するため無効化
  build: {
    lib: {
      entry: 'src/game-v2/main.tsx',
      name: 'GameV2',
      formats: ['iife'],  // 即時実行関数形式
      fileName: () => 'game-v2.js'
    },
    outDir: 'public/js',
    emptyOutDir: false,  // 既存ファイルを消さない
    sourcemap: process.env.NODE_ENV !== 'production'
  }
});