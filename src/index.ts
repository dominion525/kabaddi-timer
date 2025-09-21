import { Hono } from 'hono';
import { GameSession } from './durable-objects/game-session';
import { Env } from './types/game';
import websocketRouter from './routes/websocket';
import gameRouter from './routes/game';
import homeRouter from './routes/home';

const app = new Hono<{ Bindings: Env }>();

// ルーターを統合
app.route('/', websocketRouter);
app.route('/', gameRouter);
app.route('/', homeRouter);

// 静的ファイル配信用のルート（簡易実装）
app.get('/client/*', async (c) => {
  const path = c.req.path;

  // セキュリティチェック
  if (path.includes('..') || path.includes('//')) {
    return c.text('Invalid path', 400);
  }

  // 開発時は適切な Content-Type を設定（将来の実装用）
  // const contentType = path.endsWith('.js') ? 'application/javascript' :
  //                     path.endsWith('.css') ? 'text/css' : 'text/plain';

  // 実際のファイル配信（開発環境用の簡易実装）
  // 本番環境では Cloudflare Workers の静的ファイル配信機能を使用
  return c.text('Static file serving not implemented', 404);
});

app.get('/styles/*', async (c) => {
  const path = c.req.path;

  // セキュリティチェック
  if (path.includes('..') || path.includes('//')) {
    return c.text('Invalid path', 400);
  }

  // CSS ファイル配信（開発環境用の簡易実装）
  return c.text('CSS file serving not implemented', 404);
});

// Durable Objects のエクスポート
export { GameSession };

// アプリケーションのエクスポート
export default app;