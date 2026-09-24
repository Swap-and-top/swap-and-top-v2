'use client';

/**
 * Post, step three — review.
 *
 * Three jobs on this screen:
 *
 *  1. **Show the card exactly as it will appear.** Not decoration — it is how a
 *     seller checks their own work, and it teaches them what a good listing
 *     looks like.
 *  2. **Contact preferences**, including the dealer-offers consent. Default on,
 *     but visible and easy to change: it keeps the platform from feeling like a
 *     dealer channel and makes the lead product defensible.
 *  3. **Say what happens next** — live immediately, taken down on report,
 *     expires in 30 days.
 *
 * Wireframe artboard: `PostReview`.
 */

import { useRouter } from 'next/navigation';
import {
  usePostDraftStore,
  type ContactChannel,
} from '@snt/core';
import {
  Button,
  CheckboxField,
  Eyebrow,
  ImagePlaceholder,
  Note,
  Panel,
  Price,
  Screen,
  ScreenBody,
  ScreenFooter,
  StepHeader,
} from '@snt/ui';
import { InfoIcon, SwapIcon } from '@snt/ui/icons';
import styles from './page.module.css';

const CHANNELS: { value: ContactChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Phone call' },
  { value: 'sms', label: 'SMS' },
];

export default function PostReviewPage() {
  const router = useRouter();
  const draft = usePostDraftStore();
  const kind = draft.kind ?? 'swap';

  return (
    <Screen>
      <StepHeader step={3} backHref="/post/details" />

      <ScreenBody>
        <Eyebrow className={styles.previewLabel}>
          How it will look in the feed
        </Eyebrow>

        <Panel xl clip className={styles.card}>
          {kind === 'swap' ? (
            <>
              <div className={styles.strip}>
                <SwapIcon size={14} weight={2} />
                Swap &amp; Top
              </div>
              <div className={styles.tiles}>
                <div className={styles.tile}>
                  <ImagePlaceholder height={72} small />
                  <Eyebrow tight className={styles.tileEyebrow}>
                    Has
                  </Eyebrow>
                  <div className={styles.tileName}>
                    {draft.haveTitle || 'Your item'}
                  </div>
                </div>

                <div className={styles.middle}>
                  <span className={styles.arrows}>
                    <SwapIcon size={17} weight={2.1} />
                  </span>
                  {draft.cashDirection !== 'straight' && draft.cashAmount ? (
                    <span>
                      <Price
                        amount={Number(draft.cashAmount.replace(/[^0-9]/g, '')) || 0}
                        size="sm"
                      />
                    </span>
                  ) : null}
                </div>

                <div className={styles.tile}>
                  <ImagePlaceholder height={72} small wanted glyph="search" />
                  <Eyebrow tight accent className={styles.tileEyebrow}>
                    Wants
                  </Eyebrow>
                  <div className={styles.tileName}>
                    {draft.wantTitle || 'What you want'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <ImagePlaceholder height={122} flush />
              <div className={styles.saleBody}>
                <Price
                  amount={
                    Number(
                      (kind === 'sale' ? draft.price : draft.budget).replace(
                        /[^0-9]/g,
                        '',
                      ),
                    ) || 0
                  }
                />
                <div className={styles.saleTitle}>
                  {kind === 'sale'
                    ? draft.haveTitle || 'Your item'
                    : draft.wantTitle || 'What you want'}
                </div>
              </div>
            </>
          )}
        </Panel>

        <Panel padded className={styles.contact}>
          <Eyebrow>How people can reach you</Eyebrow>

          <div className={styles.checks}>
            {CHANNELS.map((channel) => (
              <CheckboxField
                key={channel.value}
                label={channel.label}
                checked={draft.contactChannels.includes(channel.value)}
                onChange={() => draft.toggleChannel(channel.value)}
              />
            ))}

            {/* Consent, not a surprise. Keeps the lead product honest. */}
            <CheckboxField
              divided
              label="Let dealers send me offers"
              checked={draft.allowDealerOffers}
              onChange={draft.setAllowDealerOffers}
            />
          </div>

          <p className={styles.disclosure}>
            Your number is hidden until someone taps Show number. You will see
            how many people did.
          </p>
        </Panel>

        <Note
          icon={<InfoIcon size={17} />}
          tone="subtle"
          className={styles.lifecycle}
        >
          Goes live immediately. Listings that break the rules are taken down
          when reported. Expires in 30 days.
        </Note>
      </ScreenBody>

      <ScreenFooter>
        <Button
          size="lg"
          block
          onClick={() => {
            draft.reset();
            router.push('/');
          }}
        >
          Post listing
        </Button>
      </ScreenFooter>
    </Screen>
  );
}
