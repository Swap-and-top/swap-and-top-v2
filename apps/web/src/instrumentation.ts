/**
 * Runs once as the server starts. On our own server (Dokploy) it applies
 * any table changes that came with this version of the code, before the
 * first request (apps/api/src/db/migrate.ts, which does nothing where
 * MIGRATIONS_DIR is not set). If they fail the server does not start, and
 * the version before keeps running.
 */

export async function register() {
  // Only in the Node server: written this way so the import is left out
  // of the build for any other runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { applyMigrations } = await import('@snt/api/migrate');
    await applyMigrations();
  }
}
