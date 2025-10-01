import indexHTML from './index.html';

// リビジョン情報を取得する関数
function getRevision(): string {
  try {
    const revisionData = require('../revision.json');
    return revisionData.revision || 'unknown';
  } catch (error) {
    // ファイルが存在しない場合はunknownを返す
    return 'unknown';
  }
}

export function indexTemplate(): string {
  // リビジョン情報を取得
  const fullRevision = getRevision();
  const shortRevision = fullRevision.substring(0, 7);

  return indexHTML
    .replace(/{{REVISION}}/g, shortRevision)
    .replace(/{{FULL_REVISION}}/g, fullRevision);
}