import { Hono } from 'hono';
import indexHtml from '../../generated/index.html';

const homeRouter = new Hono();

homeRouter.get('/', async (c) => {
  return c.html(indexHtml);
});

export default homeRouter;