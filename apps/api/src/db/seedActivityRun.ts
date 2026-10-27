/** Runs seedActivity on its own: `pnpm --filter @snt/api db:seed-activity`. */

import '../loadEnv';
import { sql } from './client';
import { seedActivity } from './seedActivity';

try {
  await seedActivity();
} finally {
  await sql.end();
}
