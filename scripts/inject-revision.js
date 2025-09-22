#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Gitリビジョンを取得
  const revision = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

  const outputPath = path.join(__dirname, '..', 'src', 'revision.json');

  // 既存のファイルを確認
  let shouldUpdate = true;
  if (fs.existsSync(outputPath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      if (existingData.revision === revision) {
        shouldUpdate = false;
        console.log(`ℹ️ Revision ${revision} already up to date`);
      }
    } catch (e) {
      // JSONパースエラーの場合は更新する
    }
  }

  if (shouldUpdate) {
    // リビジョン情報をJSONファイルに保存
    const revisionData = {
      revision: revision,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(outputPath, JSON.stringify(revisionData, null, 2));
    console.log(`✅ Revision ${revision} injected successfully`);
  }
} catch (error) {
  console.error('❌ Failed to inject revision:', error.message);
  // Gitが利用できない場合はデフォルト値を使用
  const fallbackData = {
    revision: 'unknown',
    timestamp: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, '..', 'src', 'revision.json');
  fs.writeFileSync(outputPath, JSON.stringify(fallbackData, null, 2));

  console.log('⚠️ Using fallback revision: unknown');
}