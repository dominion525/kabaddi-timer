// HTMLファイルのインポートを可能にする型定義
declare module "*.html" {
  const content: string;
  export default content;
}