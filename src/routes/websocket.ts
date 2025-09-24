import { Hono } from 'hono';
import { Env } from '../types/game';

const websocketRouter = new Hono<{ Bindings: Env }>();

websocketRouter.get('/ws/:gameId', async (c) => {
  const gameId = c.req.param('gameId');

  if (!gameId) {
    return c.text('Game ID is required', 400);
  }

  const id = c.env.GAME_SESSION.idFromName(gameId);
  const stub = c.env.GAME_SESSION.get(id);

  const url = new URL(c.req.url);
  url.pathname = '/websocket';

  return stub.fetch(url.toString(), {
    headers: c.req.header(),
  });
});

export default websocketRouter;