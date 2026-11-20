/**
 * Whether people can sign in with a phone and a code. Off until real SMS is
 * set up (apps/api/src/messages.ts, `smsReady`): until then everyone signs
 * in with an email. The phone forms are kept, only hidden; turn this on
 * with SMS and they come back.
 */
export const PHONE_SIGN_IN = false;
