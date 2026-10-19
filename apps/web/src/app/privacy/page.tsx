/**
 * Privacy policy. The text of the first app's policy, for now, lightly
 * tidied: the date written out, "swap" for an exchange, links to this app's
 * pages.
 */

import type { Metadata } from 'next';
import { COMPANY } from '@snt/core';
import { InfoLink, InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = {
  title: 'Privacy policy · Swap & Top',
  description: 'How Swap & Top collects, uses and keeps your data.',
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      updated="1 January 2024"
      sections={[
        {
          title: '1. Introduction',
          body: (
            <p>
              Welcome to the privacy policy for Swap &amp; Top. This page sets
              out how we collect, handle, process and store user data. For
              more, please see our{' '}
              <InfoLink href="/terms">Terms of use</InfoLink>. For tips on how
              to use our platform safely, see{' '}
              <InfoLink href="/help">Safety and how to swap</InfoLink>.
            </p>
          ),
        },
        {
          title: '2. Information we collect, and how',
          body: (
            <>
              <p>We collect the following information from our users:</p>
              <h3>Personal information</h3>
              <ul>
                <li>
                  Account holders: first name, surname, phone number, email
                  address, user pictures and physical location.
                </li>
                <li>
                  Pictures of items posted, and details about those items,
                  including their names, specs, features and the date they
                  were posted on Swap &amp; Top.
                </li>
              </ul>
              <h3>How we collect it</h3>
              <ul>
                <li>
                  What users enter when creating an account, when posting
                  items, and when changing this data.
                </li>
                <li>Location data, IP address and device information, through cookies.</li>
              </ul>
            </>
          ),
        },
        {
          title: '3. How we use information, and why',
          body: (
            <ul>
              <li>
                Personal information and data about items posted on Swap &amp;
                Top are collected to make swaps, sales and conversations
                between users possible.
              </li>
              <li>
                Location and other information are collected to order posts by
                location, so users see posts near them first.
              </li>
            </ul>
          ),
        },
        {
          title: '4. Sharing of information',
          body: (
            <ul>
              <li>
                We do not store this information locally. It is stored on
                remote servers in the USA, so it is shared with our hosting
                provider.
              </li>
              <li>
                We may share relevant data with law enforcement when required
                under Zimbabwean law.
              </li>
              <li>We do not share data with third parties for marketing.</li>
            </ul>
          ),
        },
        {
          title: '5. User control',
          body: (
            <ul>
              <li>
                Users have full control over their data and can change it, as
                long as the changes follow the content guidelines in section 5
                of the <InfoLink href="/terms">Terms of use</InfoLink>.
              </li>
              <li>
                Account holders must fill in the required fields when creating
                an account, posting items and entering payment details.
              </li>
            </ul>
          ),
        },
        {
          title: '6. Security',
          body: (
            <p>
              We follow current security standards for handling and protecting
              data, including secure passwords and encryption. However, data
              sent over the internet can never be completely secure.
            </p>
          ),
        },
        {
          title: '7. How long we keep data',
          body: (
            <ul>
              <li>We keep user data for as long as the user has an open account on Swap &amp; Top.</li>
              <li>
                We keep user data for no more than 6 months after an account is
                deleted, after which we permanently remove it from our servers.
              </li>
            </ul>
          ),
        },
        {
          title: '8. User rights',
          body: (
            <ul>
              <li>Users have the right to see, edit and delete their posts.</li>
              <li>Users decide what data they enter in the fields for their account and posts.</li>
            </ul>
          ),
        },
        {
          title: '9. Children’s privacy',
          body: (
            <ul>
              <li>Swap &amp; Top is not intended for anyone under 18 years old.</li>
              <li>
                We do not knowingly collect data from children. If you become
                aware of data collected from a child, please tell us straight
                away so we can act.
              </li>
            </ul>
          ),
        },
        {
          title: '10. Updates',
          body: (
            <p>
              We regularly review and update this privacy policy. Users are
              encouraged to check for changes regularly. While we will try to
              tell users of updates by email, we may not always do so.
            </p>
          ),
        },
        {
          title: '11. Governing law',
          body: (
            <>
              <p>
                Swap &amp; Top is run by {COMPANY.legalName} and is governed by
                the laws of Zimbabwe. This privacy policy is regulated by the
                relevant Acts and laws under Zimbabwean jurisdiction.
              </p>
              <p>
                This privacy policy was written for swapandtop.com by{' '}
                {COMPANY.name} on 1 January 2024.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
