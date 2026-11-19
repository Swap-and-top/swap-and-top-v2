/**
 * What the live chat app (apps/chat) needs from the API: who a request is
 * signed in as, their user record, and chat's rules. One import, so the
 * chat app and the API never disagree.
 */

export { verify } from './auth';
export { personFor } from './routes/me';
export * from './chat';
