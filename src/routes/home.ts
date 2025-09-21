import { Hono } from 'hono';
import { indexTemplate } from '../generated/index-template';

const homeRouter = new Hono();

homeRouter.get('/', async (c) => {
  return c.html(indexTemplate);
});

export default homeRouter;