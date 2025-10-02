import { Hono } from 'hono';
import { GameSession } from './durable-objects';
import { Env } from './types/game';
import websocketRouter from './routes/websocket';
import gameV2Router from './routes/game-v2';
import homeRouter from './routes/home';

const app = new Hono<{ Bindings: Env }>();

// ルーターを統合
app.route('/', websocketRouter);
app.route('/', gameV2Router);
app.route('/', homeRouter);

// Cloudflare Workers標準の静的ファイル配信
app.get('/js/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

app.get('/css/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// 画像配信
app.get('/images/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// 汎用的な静的アセット配信（必要に応じて）
app.get('/assets/*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// Durable Objects のエクスポート
export { GameSession };

// アプリケーションのエクスポート
export default app;