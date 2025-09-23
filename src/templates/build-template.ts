import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES modules対応: __dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * HTMLテンプレートの各パーツを読み込んで結合する
 */
export function buildGameTemplate(): string {
  const templateDir = path.join(__dirname, 'partials');

  // 各パーツのファイルパスを定義
  const headFile = path.join(templateDir, 'head.html');
  const desktopFile = path.join(templateDir, 'desktop.html');
  const mobileFile = path.join(templateDir, 'mobile.html');
  const modalsFile = path.join(templateDir, 'modals.html');
  const scriptsFile = path.join(templateDir, 'scripts.html');

  try {
    // 各ファイルを読み込み
    const headContent = fs.readFileSync(headFile, 'utf-8');
    const desktopContent = fs.readFileSync(desktopFile, 'utf-8');
    const mobileContent = fs.readFileSync(mobileFile, 'utf-8');
    const modalsContent = fs.readFileSync(modalsFile, 'utf-8');
    const scriptsContent = fs.readFileSync(scriptsFile, 'utf-8');

    // HTMLテンプレートを結合
    const combinedHtml = [
      headContent,
      desktopContent,
      mobileContent,
      modalsContent,
      scriptsContent
    ].join('\n');

    return combinedHtml;
  } catch (error) {
    console.error('Error building template:', error);
    throw new Error(`Failed to build template: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * ビルド時にテンプレートを生成してファイルに保存する
 */
export function buildAndSaveTemplate(): void {
  const outputPath = path.join(__dirname, 'game.html');
  const template = buildGameTemplate();

  try {
    fs.writeFileSync(outputPath, template, 'utf-8');
    console.log(`✅ Template built successfully: ${outputPath}`);
  } catch (error) {
    console.error('Error saving template:', error);
    throw new Error(`Failed to save template: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ES modules対応: コマンドライン実行時の処理
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAndSaveTemplate();
}