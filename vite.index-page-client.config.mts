import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,  // Cloudflare Workersが直接public/を配信するため無効化
  build: {
    lib: {
      entry: 'src/index-page/client.ts',
      name: 'IndexPageClient',
      formats: ['iife'],  // 即時実行関数形式
      fileName: () => 'index-page-client.js'
    },
    outDir: 'public/js',
    emptyOutDir: false,  // 既存ファイルを消さない
    minify: true,  // ミニファイを有効化（~2KB gzipターゲット）
    target: 'es2020',
    sourcemap: process.env.NODE_ENV !== 'production'
  }
});
