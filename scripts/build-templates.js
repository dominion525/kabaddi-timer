const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building templates and client scripts...');

// テンプレートファイルの情報
const templates = [
  {
    name: 'index',
    inputFile: 'src/templates/index.html',
    outputFile: 'src/generated/index-template.ts',
    exportName: 'indexTemplate'
  },
  {
    name: 'game',
    inputFile: 'src/templates/game.html',
    outputFile: 'src/generated/game-template.ts',
    exportName: 'gameTemplate'
  }
];

// クライアントTypeScriptファイルの情報
const clientScripts = [
  {
    name: 'websocket-manager',
    inputFile: 'src/client/components/websocket-manager.ts',
    outputFile: 'src/client/websocket-manager.ts',
    exportName: 'websocketManagerScript'
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

// クライアントTypeScriptファイルをコンパイルして文字列化
clientScripts.forEach(script => {
  try {
    // 一時的なJavaScriptファイルにコンパイル
    const tempJsFile = `temp_${script.name}.js`;
    console.log(`Compiling ${script.inputFile}...`);

    // TypeScriptをJavaScriptにコンパイル（ブラウザ用設定）
    execSync(`npx tsc ${script.inputFile} --target es2020 --module none --outFile ${tempJsFile} --skipLibCheck --lib ES2020,DOM`, { stdio: 'inherit' });

    // コンパイル済みJavaScriptを読み込み
    const jsContent = fs.readFileSync(tempJsFile, 'utf-8');

    // TypeScriptファイルとして出力（バッククォートをエスケープ）
    const tsContent = `// This file is auto-generated from ${script.inputFile}. Do not edit manually.
export const ${script.exportName} = \`${jsContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;

    // 既存ファイルがある場合は内容を比較
    let existingContent = '';
    if (fs.existsSync(script.outputFile)) {
      existingContent = fs.readFileSync(script.outputFile, 'utf-8');
    }

    // 内容が変わった場合のみファイルを書き出し
    if (existingContent !== tsContent) {
      fs.writeFileSync(script.outputFile, tsContent);
      console.log(`✓ Generated ${script.outputFile}`);
    } else {
      console.log(`○ No changes for ${script.outputFile}`);
    }

    // 一時ファイルを削除
    if (fs.existsSync(tempJsFile)) {
      fs.unlinkSync(tempJsFile);
    }
  } catch (error) {
    console.error(`✗ Failed to generate ${script.outputFile}:`, error.message);
    process.exit(1);
  }
});

console.log('Templates and client scripts built successfully!');