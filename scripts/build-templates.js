const fs = require('fs');
const path = require('path');

console.log('Building templates...');

// テンプレートファイルの情報
const templates = [
  {
    name: 'index',
    inputFile: 'src/templates/index.html',
    outputFile: 'src/generated/index-template.ts',
    exportName: 'indexTemplate'
  }
];

// 出力ディレクトリが存在しない場合は作成
const outputDir = 'src/generated';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

templates.forEach(template => {
  try {
    // HTMLファイルを読み込み
    const htmlContent = fs.readFileSync(template.inputFile, 'utf-8');

    // TypeScriptファイルとして出力（バッククォートをエスケープ）
    const tsContent = `// This file is auto-generated. Do not edit manually.
export const ${template.exportName} = \`${htmlContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;

    // 既存ファイルがある場合は内容を比較
    let existingContent = '';
    if (fs.existsSync(template.outputFile)) {
      existingContent = fs.readFileSync(template.outputFile, 'utf-8');
    }

    // 内容が変わった場合のみファイルを書き出し
    if (existingContent !== tsContent) {
      fs.writeFileSync(template.outputFile, tsContent);
      console.log(`✓ Generated ${template.outputFile}`);
    } else {
      console.log(`○ No changes for ${template.outputFile}`);
    }
  } catch (error) {
    console.error(`✗ Failed to generate ${template.outputFile}:`, error.message);
    process.exit(1);
  }
});

console.log('Templates built successfully!');