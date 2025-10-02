/**
 * Index page SSG (Static Site Generation) builder
 *
 * Preactコンポーネントを静的HTMLにレンダリングして
 * src/generated/index.htmlに保存します
 */

import render from 'preact-render-to-string';
import { h } from 'preact';
import { IndexPageTemplate } from '../src/index-page/template';
import * as fs from 'fs';
import * as path from 'path';

// リビジョン情報を取得
function getRevision(): { revision: string; fullRevision: string } {
  try {
    const revisionPath = path.join(__dirname, '../src/revision.json');
    const revisionData = JSON.parse(fs.readFileSync(revisionPath, 'utf-8'));
    const fullRevision = revisionData.revision || 'unknown';
    const revision = fullRevision.substring(0, 7);
    return { revision, fullRevision };
  } catch (error) {
    console.warn('⚠️ revision.json not found, using "unknown"');
    return { revision: 'unknown', fullRevision: 'unknown' };
  }
}

async function buildIndexPage() {
  console.log('🔨 Building index page (SSG)...');

  // リビジョン情報を取得
  const { revision, fullRevision } = getRevision();
  console.log(`📦 Revision: ${revision} (${fullRevision})`);

  // Preactコンポーネントを静的HTMLにレンダリング
  const html = render(
    h(IndexPageTemplate, { revision, fullRevision })
  );

  // DOCTYPE付きの完全なHTMLを生成
  const completeHtml = `<!DOCTYPE html>\n${html}`;

  // 出力ディレクトリを作成
  const outputDir = path.join(__dirname, '../generated');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // HTMLファイルを保存
  const outputPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(outputPath, completeHtml, 'utf-8');

  console.log(`✅ Index page built successfully: ${outputPath}`);
  console.log(`📊 Size: ${(completeHtml.length / 1024).toFixed(2)} KB`);
}

// ビルドを実行
buildIndexPage().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
