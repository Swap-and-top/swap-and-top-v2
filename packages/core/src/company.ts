/**
 * Who runs Swap & Top and how to reach them: the menu's Contact us, the help
 * pages and anything else that names the company read it from here, so a
 * number changes in one place.
 *
 * For now, the details from the first app, unchanged. The social links point
 * at each site's home page until the real profiles are set.
 */

export const COMPANY = {
  name: 'Greta Works Inc.',
  /** As the terms and the privacy policy name it. */
  legalName: 'Greta Works Incorporated (Pvt) Ltd',
  phones: ['+263 774 689 010', '+263 784 224 614', '+263 719 217 717'],
  address: ['4442 Ceres Ave', 'Waterfalls', 'Harare'],
  /** The general address, as on the first app's footer. */
  email: 'mail@swapandtop.co.zw',
  feedbackEmail: 'feedback@swapandtop.co.zw',
  socials: [
    { name: 'Facebook', href: 'https://www.facebook.com' },
    { name: 'X', href: 'https://www.twitter.com' },
    { name: 'YouTube', href: 'https://www.youtube.com' },
    { name: 'Instagram', href: 'https://www.instagram.com' },
    { name: 'LinkedIn', href: 'https://www.linkedin.com' },
  ],
} as const;

export type SocialName = (typeof COMPANY.socials)[number]['name'];

/** A phone number as a link dials it: digits and the plus only. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
