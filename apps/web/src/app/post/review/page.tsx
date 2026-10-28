'use client';

/**
 * Post, step three — review.
 *
 * Three jobs on this screen:
 *
 *  1. **Show the card exactly as it will appear.** Not decoration — it is how a
 *     seller checks their own work, and it teaches them what a good listing
 *     looks like.
 *  2. **Contact preferences**: the ways to reach them, a toggle to share
 *     them only with people whose offer they accept, and the store offers
 *     consent. Store offers default on, but visible and easy to
 *     change: it keeps the platform from feeling like a store channel and
 *     makes the lead product defensible.
 *  3. **Say what happens next** — live immediately, taken down on report,
 *     expires in 30 days.
 *
 * "Post listing" saves it to the database (POST /api/listings, which needs a
 * verified phone, asked for first if missing) and opens the new listing.
 *
 * Wireframe artboard: `PostReview`.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  requireVerifiedPhone,
  usePostDraftStore,
  type ContactChannel,
} from '@snt/core';
import {
  AppHeader,
  Button,
  ImagePlaceholder,
  Panel,
  POST_STEPS,
  Price,
  Screen,
  ScreenBody,
  specFieldsFor,
  startPageLoad,
  StepBar,
  SwapTiles,
  TickTile,
} from '@snt/ui';
import {
  MailIcon,
  MessengerIcon,
  PhoneIcon,
  WhatsAppIcon,
} from '@snt/ui/icons';
import { apiAsViewer } from '@/lib/supabase';
import { LimitSheet } from '@/components/LimitSheet';
import { usePostAs } from '@/components/PostAs';
import { refreshListing } from '@/lib/refresh';
import styles from './page.module.css';

/** How people can reach you, as pills, as on the offer form. */
const CHANNELS: { value: ContactChannel; label: string; Icon: typeof PhoneIcon }[] = [
  { value: 'whatsapp', label: 'WhatsApp', Icon: WhatsAppIcon },
  { value: 'call', label: 'Calls', Icon: PhoneIcon },
  { value: 'email', label: 'Email', Icon: MailIcon },
  { value: 'messenger', label: 'Messenger', Icon: MessengerIcon },
];

export default function PostReviewPage() {
  /** Posting: the button shows the spinner until the feed opens. */
  const [posting, setPosting] = useState(false);
  const router = useRouter();
  const draft = usePostDraftStore();
  const kind = draft.kind ?? 'swap';
  /** The store it goes up as, or null for themselves (see Post as). */
  const postAs = usePostAs();
  const chosen = CHANNELS.filter((channel) =>
    draft.contactChannels.includes(channel.value),
  );
  /** Contact details only for people whose offer they accept. */
  const afterOffer = draft.contactShownTo === 'offers';

  /** At a listing limit: the API's message, shown in the limit sheet. */
  const [limit, setLimit] = useState<string | null>(null);

  /** Saves it (POST /api/listings), then opens it: it is live at once. */
  async function post() {
    const amount = (typed: string) => Number(typed.replace(/[^0-9.]/g, '')) || undefined;
    const category = draft.category ?? 'other';
    setPosting(true);
    const { data, error, code } = await apiAsViewer<{ slug: string }>('/listings', {
      method: 'POST',
      body: {
        kind,
        storeId: postAs ?? undefined,
        category,
        haveTitle: kind === 'request' ? undefined : draft.haveTitle.trim(),
        // Only the details its category asks for, and only those filled in.
        specs: Object.fromEntries(
          specFieldsFor(category)
            .map((field) => [field.key, (draft.specs[field.key] ?? '').trim()])
            .filter(([, value]) => value),
        ),
        condition: kind === 'request' ? undefined : draft.condition,
        wantTitle: kind === 'sale' ? undefined : draft.wantTitle.trim(),
        price: kind === 'sale' ? amount(draft.price) : undefined,
        acceptsSwaps: kind === 'sale' ? draft.acceptsSwaps : undefined,
        budget: kind === 'request' ? amount(draft.budget) : undefined,
        cashDirection: kind === 'swap' ? (draft.cashDirection ?? 'straight') : undefined,
        cashAmount:
          kind === 'swap' && draft.cashDirection !== 'straight' ? amount(draft.cashAmount) : undefined,
        cashUpTo: kind === 'swap' ? draft.cashUpTo : undefined,
        contactChannels: draft.contactChannels,
        allowStoreOffers: draft.allowStoreOffers,
        contactSignedInOnly: draft.contactSignedInOnly,
        contactShownTo: draft.contactShownTo,
        contactToStores: draft.contactToStores,
      },
    });
    if (error || !data) {
      setPosting(false);
      if (code === 'limit' && error) setLimit(error);
      else toast.error(error ?? 'We could not post it. Try again in a minute.');
      return;
    }
    await refreshListing(data.slug);
    draft.reset();
    toast.success('Your listing is live');
    startPageLoad();
    router.push(`/listing/${data.slug}`);
  }

  return (
    <Screen surface>
      {/* The feed's own header: the site does not change face on the way
          into posting. The steps sit in the body, under it. */}
      <AppHeader />

      <ScreenBody>
        <StepBar current={3} steps={POST_STEPS} />

        <span className={styles.label}>How it will look in the feed</span>

        <Panel xl clip className={styles.card}>
          {kind === 'swap' ? (
            <div className={styles.swapPreview}>
              <SwapTiles
                has={{
                  name: draft.haveTitle || 'Your item',
                  category: draft.category ?? 'other',
                  // Only the details its category asks for.
                  specs: Object.fromEntries(
                    (draft.category ? specFieldsFor(draft.category) : []).map((field) => [
                      field.key,
                      draft.specs[field.key] ?? '',
                    ]),
                  ),
                }}
                wants={{
                  name: draft.wantTitle || 'What you want',
                  category: draft.category ?? 'other',
                  specs: {},
                }}
                cashDirection={draft.cashDirection ?? undefined}
                cashAmount={
                  draft.cashDirection && draft.cashDirection !== 'straight'
                    ? Number(draft.cashAmount.replace(/[^0-9]/g, '')) || undefined
                    : undefined
                }
                cashUpTo={draft.cashDirection === 'i-add' && draft.cashUpTo}
              />
            </div>
          ) : (
            <>
              {kind === 'sale' ? <ImagePlaceholder height={142} flush /> : null}
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

        {/* The rest is one white card, set as the offer form is, with the
            button at its foot. */}
        <div className={styles.form}>
          <div className={styles.group}>
            <span className={[styles.label, styles.flush].join(' ')}>
              They can reach you on{' '}
              <span className={styles.optional}>
                ({chosen.length} selected)
              </span>
            </span>
            <div className={styles.pills}>
              {CHANNELS.map(({ value, label, Icon }) => {
                const on = draft.contactChannels.includes(value);
                // At least one way stays on: a listing must lead somewhere.
                const last = on && chosen.length === 1;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    disabled={last}
                    className={[styles.pill, on ? styles.pillOn : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => draft.toggleChannel(value)}
                  >
                    <Icon size={16} weight={24 / 16} />
                    {label}
                  </button>
                );
              })}
            </div>
            <p className={styles.small}>
              Your details stay hidden until someone taps Show contacts. You
              will see how many people did.
            </p>
          </div>

          {/* Consent, not a surprise. Keeps the lead product honest. */}
          <TickTile
            checked={draft.allowStoreOffers}
            onChange={draft.setAllowStoreOffers}
            label="Let stores send me offers"
            hint="Stores that stock what you want can make you an offer."
          />

          {/* The toggle: show the details to anyone who asks, or only to
              people whose offer they accept. Off by default. */}
          <TickTile
            checked={afterOffer}
            onChange={(on) =>
              draft.setContactShownTo(on ? 'offers' : 'everyone')
            }
            label="Only share my contact details after I accept an offer"
            hint="People make an offer first. Only those you accept see your number."
          />

          {afterOffer ? (
            // Offers first, but stores may still reach them from a lead.
            draft.allowStoreOffers ? (
              <TickTile
                checked={draft.contactToStores}
                onChange={draft.setContactToStores}
                label="Let stores see my contact details"
                hint="Stores that get your listing as a lead can reach you before you accept an offer."
              />
            ) : null
          ) : (
            // The seller's own choice; off unless they ask for it.
            <TickTile
              checked={draft.contactSignedInOnly}
              onChange={draft.setContactSignedInOnly}
              label="Only show my details to signed in users"
              hint="Guests are asked to sign in first."
            />
          )}

          <p className={styles.small}>
            Goes live straight away. Listings that break the rules are taken
            down when reported. Expires in 30 days.
          </p>

          {/* Post it, under the last thing to choose. */}
          <Button
            size="lg"
            block
            loading={posting}
            onClick={() =>
              requireVerifiedPhone(
                {
                  signIn: 'Sign in to post a listing.',
                  phone: 'Verify your phone number to post listings.',
                },
                () => void post(),
              )
            }
          >
            Post listing
          </Button>
          {limit ? (
            <LimitSheet message={limit} storeId={postAs ?? null} onClose={() => setLimit(null)} />
          ) : null}
        </div>
      </ScreenBody>
    </Screen>
  );
}
