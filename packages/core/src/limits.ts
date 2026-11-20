/**
 * How many live listings for sale or swap an account keeps (Wanted
 * listings never count). The API holds the same numbers and refuses past
 * them (apps/api/src/passes.ts, routes/post.ts); these are for what the
 * pages say. A store with a pass has no limit.
 */
export const FREE_STORE_LIMIT = 5;
/** A user's own, outside any store. */
export const PERSON_LIMIT = 3;
