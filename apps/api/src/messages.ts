/**
 * Email and SMS we send: the codes that verify an email or a phone, and the
 * link that resets a password.
 *
 * Email goes through Resend once RESEND_API_KEY and EMAIL_FROM are set
 * (EMAIL_FROM as "Swap & Top <noreply@our domain>"). SMS has no sender yet.
 * Until each is set up nothing is sent and the code is MOCK_CODE: for any
 * email, to verify it and nothing else, and for our test phone numbers
 * (077 000 0001 to 0999) only, so a real number cannot be signed in to
 * with it.
 */

/** The code taken while email or SMS is not set up. */
export const MOCK_CODE = '123456';

/** Whether real email can be sent. */
export const emailReady = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/** Whether real SMS can be sent: not yet. */
export const smsReady = false;

/** Our test numbers, which take MOCK_CODE and are sent nothing. */
const TEST_PHONE = /^\+263770000\d{3}$/;
export const isTestPhone = (phone: string) => TEST_PHONE.test(phone);

const LIVE = process.env.APP_ENV === 'production' || process.env.VERCEL_ENV === 'production';

/**
 * Sends an email, or says it could not. With no sender set up it sends
 * nothing; off the live site it writes the message to the server's log
 * instead, so a reset link can still be followed while testing.
 */
export async function sendEmail(message: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!emailReady) {
    if (!LIVE) console.info(`Email not set up. To ${message.to}: ${message.subject}\n${message.text}`);
    return false;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  }).catch(() => null);
  if (!response?.ok) console.warn(`An email could not be sent (${response?.status ?? 'no answer'}).`);
  return Boolean(response?.ok);
}
