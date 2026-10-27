/**
 * Loads the repo's root `.env` (git ignores it) when there is one, wherever
 * the API is started from: its own server, the seed, or the web app. On
 * Vercel there is no file; the settings come from the project instead.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

let dir = process.cwd();
while (!existsSync(join(dir, 'pnpm-workspace.yaml')) && dirname(dir) !== dir) {
  dir = dirname(dir);
}
const file = join(dir, '.env');
if (existsSync(file)) process.loadEnvFile(file);
