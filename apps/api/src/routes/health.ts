/** Health check, for monitoring: is the API up, and can it reach the database? */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { sql } from '../db/client';

export const healthRoutes = new OpenAPIHono();

const health = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Monitoring'],
  summary: 'Health check',
  responses: {
    200: {
      description: 'The API and the database are up',
      content: {
        'application/json': {
          schema: z.object({ ok: z.boolean(), database: z.boolean() }),
        },
      },
    },
  },
});

healthRoutes.openapi(health, async (c) => {
  const database = await sql`select 1`.then(
    () => true,
    () => false,
  );
  return c.json({ ok: true, database }, 200);
});
