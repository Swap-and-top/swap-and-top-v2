/**
 * Terms of use. The text of the first app's terms, for now, lightly tidied:
 * the date written out, "swap" for an exchange, links to this app's pages.
 */

import type { Metadata } from 'next';
import { COMPANY } from '@snt/core';
import { InfoLink, InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = {
  title: 'Terms of use · Swap & Top',
  description: 'The terms of use of the Swap & Top platform.',
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of use"
      updated="1 January 2024"
      sections={[
        {
          title: '1. Introduction',
          body: (
            <p>
              Welcome to Swap &amp; Top&apos;s terms of use. This page sets out
              the official terms of use for the Swap &amp; Top platform. By
              accessing and using our platform, you agree to these terms and
              conditions. For details on how we collect, handle, process and
              store user data, please see our{' '}
              <InfoLink href="/privacy">Privacy policy</InfoLink>. For tips on
              how to use our platform safely, see{' '}
              <InfoLink href="/help">Safety and how to swap</InfoLink>.
            </p>
          ),
        },
        {
          title: '2. User agreement',
          body: (
            <>
              <p>
                By visiting and using the platform, users agree to these terms
                of service. If you do not agree with these terms, you should not
                use the platform. For any concerns about the terms, please
                contact us.
              </p>
              <p>
                If you are using the platform on behalf of another person,
                group or organisation, you alone are responsible for accepting
                these terms. By agreeing to these terms, you confirm that you
                are 18 years of age or older, the legal age to use the
                platform.
              </p>
            </>
          ),
        },
        {
          title: '3. Users',
          body: (
            <>
              <p>Users on Swap &amp; Top fall into one of these groups:</p>
              <h3>a) Guest user</h3>
              <ul>
                <li>A guest user visits the website without creating an account.</li>
                <li>
                  Guest users can view other users&apos; posts, contact sellers
                  and deal with sellers directly.
                </li>
                <li>
                  Guest users do not have access to features such as posting
                  items or tracking posts.
                </li>
              </ul>
              <h3>b) Account holder</h3>
              <ul>
                <li>
                  An account holder creates a user account and can post any
                  number of items on the platform.
                </li>
                <li>
                  Account holders have access to more features, including
                  posting items and tracking posts.
                </li>
              </ul>
              <p>Users are also buyers or sellers:</p>
              <ul>
                <li>Guest users can only be buyers.</li>
                <li>Account holders can both sell and buy items.</li>
              </ul>
              <p>
                We collect personal information and details about users and the
                items being sold when users create accounts and when they post
                the items they wish to sell. For more on how data is handled,
                please see our <InfoLink href="/privacy">Privacy policy</InfoLink>.
              </p>
            </>
          ),
        },
        {
          title: '4. User conduct',
          body: (
            <>
              <p>Users must not:</p>
              <ul>
                <li>
                  Provide services or software that interact or work with Swap
                  &amp; Top without a separate agreement.
                </li>
                <li>
                  Collect or copy content or data from Swap &amp; Top by robots,
                  spiders, scripts, scrapers, crawlers, screen scrapers, data
                  gathering tools, manual copying, or anything automated or
                  manual that does the same.
                </li>
              </ul>
              <p>Account holders agree that:</p>
              <ul>
                <li>
                  The personal information they provide, including their first
                  name, surname, phone number, email address and location, is
                  accurate.
                </li>
                <li>
                  The information posted about items is correct to the best of
                  their knowledge.
                </li>
                <li>
                  The items posted are owned by them or the organisation they
                  represent, and are not stolen or borrowed.
                </li>
                <li>They can provide proof of ownership if a dispute arises.</li>
                <li>
                  The items posted follow the content guidelines in section 5
                  of these terms of use.
                </li>
              </ul>
              <p>A user may open no more than two accounts.</p>
            </>
          ),
        },
        {
          title: '5. Content guidelines',
          body: (
            <>
              <p>Users agree that:</p>
              <ul>
                <li>
                  The pictures they post do not contain harmful content that
                  may be explicit, offensive or illegal.
                </li>
                <li>
                  The pictures posted of what they have are of the exact item
                  being offered, not a similar one.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: '6. Account suspension and termination',
          body: (
            <>
              <p>
                We reserve the right to restrict access to, suspend or close
                accounts:
              </p>
              <ul>
                <li>If a user is under 18 years old.</li>
                <li>If a user breaks the content guidelines.</li>
                <li>
                  If a user does not keep to the expected behaviour set out in
                  User conduct.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: '7. Limited liability',
          body: (
            <>
              <p>
                Swap &amp; Top provides a platform for users to advertise items
                they wish to sell or swap, and is not responsible for the actual
                items or the details posted. Users should take care to make sure
                items meet their expectations before buying or making
                arrangements. Swap &amp; Top is not responsible for any damage
                or loss from transactions made on our platform. Users are
                encouraged to report any abuse of the platform: a report button
                is on every listing, and reports can also be sent to our
                customer care.
              </p>
              <p>
                For tips on lowering the risks when dealing on our platform,
                see <InfoLink href="/help">Safety and how to swap</InfoLink>.
              </p>
            </>
          ),
        },
        {
          title: '8. Indemnity',
          body: (
            <p>
              Users agree to defend and compensate Swap &amp; Top for any legal
              issues arising from a user&apos;s negligence or breach of these
              terms of use.
            </p>
          ),
        },
        {
          title: '9. Updates',
          body: (
            <p>
              We regularly review and update these terms of use. Users are
              encouraged to check for changes regularly. While we will try to
              tell users of updates by email, we may not always do so.
            </p>
          ),
        },
        {
          title: '10. Governing law',
          body: (
            <>
              <p>
                Swap &amp; Top is run by {COMPANY.legalName} and is governed by
                the laws of Zimbabwe. These terms of use are regulated by the
                relevant Acts and laws under Zimbabwean jurisdiction.
              </p>
              <p>
                These terms of use were written for swapandtop.com by{' '}
                {COMPANY.name} on 1 January 2024.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
