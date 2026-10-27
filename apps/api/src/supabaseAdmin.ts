/**
 * Supabase Auth's admin calls, made with the secret key (SUPABASE_SECRET_KEY,
 * server only). Used to make accounts without sending email and to mark an
 * email or phone verified while the codes are mock ones (see MOCK_CODE).
 */

/**
 * The code that verifies an email or a phone until real email and SMS are
 * set up: no message is sent, and this code is taken for any address or
 * number. Remove it once they are.
 */
export const MOCK_CODE = '123456';

export interface AdminResult {
  ok: boolean;
  status: number;
  /** Supabase's error code, such as email_exists or phone_exists. */
  code?: string;
  body: Record<string, unknown>;
}

export async function supabaseAdmin(
  path: string,
  method: 'POST' | 'PUT',
  payload: Record<string, unknown>,
): Promise<AdminResult> {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY are needed for accounts.');
  }
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: response.ok,
    status: response.status,
    code: typeof body.error_code === 'string' ? body.error_code : undefined,
    body,
  };
}
