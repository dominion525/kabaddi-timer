/** @jsxImportSource preact */

import { App } from './components/App';

interface TemplateProps {
  revision: string;
  fullRevision: string;
}

export function IndexPageTemplate({ revision, fullRevision }: TemplateProps) {
  return (
    <html lang="ja" prefix="og: https://ogp.me/ns#">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>カバディタイマー - スコアボードアプリケーション</title>
        <meta name="description" content="カバディ用のリアルタイムタイマー・スコアボードアプリケーション。複数デバイスで同期、QRコード共有対応。" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kabaddi.dominion525.com/" />
        <meta property="og:title" content="カバディタイマー - スコアボードアプリケーション" />
        <meta property="og:description" content="カバディ用のリアルタイムタイマー・スコアボードアプリケーション。複数デバイスで同期、QRコード共有対応。" />
        <meta property="og:image" content="https://kabaddi.dominion525.com/images/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="カバディタイマー アプリケーションアイコン" />
        <meta property="og:site_name" content="カバディタイマー" />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://kabaddi.dominion525.com/" />
        <meta name="twitter:title" content="カバディタイマー - スコアボードアプリケーション" />
        <meta name="twitter:description" content="カバディ用のリアルタイムタイマー・スコアボードアプリケーション。複数デバイスで同期、QRコード共有対応。" />
        <meta name="twitter:image" content="https://kabaddi.dominion525.com/images/og-image-large.png" />
        <meta name="twitter:creator" content="@dominion525" />

        <link rel="icon" href="/images/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/images/favicon.ico" type="image/x-icon" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
      </head>
      <body class="bg-gray-100 min-h-screen">
        <App revision={revision} fullRevision={fullRevision} />
        <script src="/js/index-page-client.js"></script>
      </body>
    </html>
  );
}
