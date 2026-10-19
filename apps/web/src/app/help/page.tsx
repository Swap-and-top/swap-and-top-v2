/**
 * Safety and how to swap. Written from the app's own guidance (see
 * docs/product/trust-and-safety.md); the first app's tips page was empty.
 */

import type { Metadata } from 'next';
import { COMPANY } from '@snt/core';
import { InfoLink, InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = {
  title: 'Safety and how to swap · Swap & Top',
  description: 'How buying, selling and swapping work on Swap & Top, and how to do it safely.',
};

export default function HelpPage() {
  return (
    <InfoPage
      title="Safety and how to swap"
      intro={
        <p>
          Swap &amp; Top puts buyers and sellers in touch. The deal itself
          happens between you, in person, so a few habits keep it safe.
        </p>
      }
      sections={[
        {
          title: 'How it works',
          body: (
            <ul>
              <li>Find something in the feed, or post what you are looking for in Wanted.</li>
              <li>
                Contact the seller by WhatsApp or a call. You do not need an
                account to buy.
              </li>
              <li>
                To swap, send an offer from the listing: pick what you have,
                and add cash on top if the values differ.
              </li>
              <li>Agree on a time and a place, then meet to finish the deal.</li>
            </ul>
          ),
        },
        {
          title: 'Meeting',
          body: (
            <ul>
              <li>Meet in a busy public place, in daylight if you can.</li>
              <li>Tell someone where you are going, or bring a friend.</li>
              <li>Never go to a private address you do not know.</li>
            </ul>
          ),
        },
        {
          title: 'Checking the item',
          body: (
            <ul>
              <li>Check the item works before any money or devices change hands.</li>
              <li>
                Make sure a phone or laptop is signed out of iCloud or Google,
                so it is not locked to its old owner.
              </li>
              <li>Ask for the box, receipt or other proof of ownership where there is one.</li>
              <li>A price far below what similar items sell for is a warning sign.</li>
            </ul>
          ),
        },
        {
          title: 'Paying',
          body: (
            <ul>
              <li>Never send money before you have seen the item.</li>
              <li>Swap &amp; Top never holds money, and never asks you to pay through us.</li>
              <li>Count cash, or confirm a transfer has arrived, before you hand anything over.</li>
            </ul>
          ),
        },
        {
          title: 'After the deal',
          body: (
            <p>
              When a deal is done, both of you confirm it in the app. Confirmed
              deals show on your profile, so others can see you follow through.
            </p>
          ),
        },
        {
          title: 'Reporting',
          body: (
            <p>
              Every listing has a report button. Use it for anything that looks
              stolen, misleading or unsafe, and we will review it. You can also
              email us at{' '}
              <InfoLink href={`mailto:${COMPANY.feedbackEmail}`}>{COMPANY.feedbackEmail}</InfoLink>.
              See the <InfoLink href="/terms">Terms of use</InfoLink> for the rules.
            </p>
          ),
        },
      ]}
    />
  );
}
