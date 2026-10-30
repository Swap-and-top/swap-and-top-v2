/**
 * Opening the Staff console with the account's password (see staffPass.ts):
 * `POST /api/staff/unlock` gives the device its staff pass. For anyone on
 * the team (in a department, or the super admin). After five wrong
 * passwords in 15 minutes it stops trying for a while. Each unlock, and
 * each wrong password, is in the Activity log.
 *
 * The sealed super admin (people.sealed), kept for emergencies, may open it
 * too; but each time it does, the log says so (`staff.sealed-use`) and
 * every other super admin is told at once, so its use is always noticed.
 */

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { and, count, eq, gte } from 'drizzle-orm';
import { requireAuth, type AuthUser } from '../auth';
import { db } from '../db/client';
import * as t from '../db/schema';
import { ErrorSchema } from '../schemas';
import { notify } from './notifications';
import { staffOf } from '../staff';
import { issueStaffPass, passwordIsRight } from '../staffPass';
import { personFor } from './me';

export const staffUnlockRoutes = new OpenAPIHono<{ Variables: { authUser: AuthUser } }>();

/** Wrong passwords allowed in `WINDOW_MINUTES` before it stops trying. */
const TRIES = 5;
const WINDOW_MINUTES = 15;

const unlock = createRoute({
  method: 'post',
  path: '/staff/unlock',
  tags: ['Staff'],
  summary: 'Open the Staff console',
  description:
    'Checks the account\'s password (the one it signs in with by email, or by phone when it has no email) and gives this device a staff pass for 12 hours, to send as `X-Staff-Key` with every other staff request. Anyone on the team. After 5 wrong passwords in 15 minutes, refused for a while.',
  security: [{ Bearer: [] }],
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: {
        'application/json': { schema: z.object({ password: z.string().min(1, 'Enter your password').max(200) }) },
      },
    },
  },
  responses: {
    200: {
      description: 'The pass',
      content: {
        'application/json': {
          schema: z.object({
            key: z.string(),
            until: z.number().describe('When it ends, in milliseconds'),
            /** Opened with the sealed super admin account: the console says so. */
            sealed: z.boolean(),
          }),
        },
      },
    },
    400: { description: 'Not the right password', content: { 'application/json': { schema: ErrorSchema } } },
    401: { description: 'No valid sign in', content: { 'application/json': { schema: ErrorSchema } } },
    403: { description: 'Not on the team', content: { 'application/json': { schema: ErrorSchema } } },
    429: { description: 'Too many wrong passwords', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

staffUnlockRoutes.openapi(unlock, async (c) => {
  const { password } = c.req.valid('json');
  const user = c.get('authUser');
  const person = await personFor(user);
  const onTeam = person.role === 'super_admin' || (await staffOf(person)).length > 0;
  if (!onTeam) return c.json({ error: 'The Staff console is for our team.' }, 403);

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
  const [tried] = await db
    .select({ wrong: count() })
    .from(t.staffLog)
    .where(
      and(
        eq(t.staffLog.actorId, person.id),
        eq(t.staffLog.action, 'staff.unlock-failed'),
        gte(t.staffLog.createdAt, since),
      ),
    );
  if ((tried?.wrong ?? 0) >= TRIES) {
    return c.json({ error: `Too many wrong passwords. Wait ${WINDOW_MINUTES} minutes, then try again.`, code: 'wait' }, 429);
  }

  if (!(await passwordIsRight({ email: user.email, phone: user.phone }, password))) {
    await db.insert(t.staffLog).values({ actorId: person.id, action: 'staff.unlock-failed', detail: {} });
    return c.json({ error: 'That is not your password.', code: 'wrong-password' }, 400);
  }

  if (person.sealed) {
    // Never quietly: logged as such, and every other super admin told.
    await db.insert(t.staffLog).values({ actorId: person.id, action: 'staff.sealed-use', detail: {} });
    const others = await db
      .select({ id: t.people.id })
      .from(t.people)
      .where(and(eq(t.people.role, 'super_admin'), eq(t.people.sealed, false)));
    await Promise.all(
      others.map((other) =>
        notify(
          other.id,
          'account',
          'The sealed super admin account just opened the Staff console. If that was not planned, act now.',
          '/staff/activity',
        ),
      ),
    );
  } else {
    await db.insert(t.staffLog).values({ actorId: person.id, action: 'staff.unlock', detail: {} });
  }
  return c.json({ ...issueStaffPass(person.id), sealed: person.sealed }, 200);
});
