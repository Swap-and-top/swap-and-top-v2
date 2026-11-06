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

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  requireVerifiedPhone,
  usePostDraftStore,
  useSessionStore,
  type Condition,
  type ContactChannel,
  type Item,
  type Listing,
  type ListingBase,
} from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  ListingCard,
  POST_STEPS,
  Screen,
  ScreenBody,
  specFieldsFor,
  startPageLoad,
  StepBar,
  TickTile,
} from '@snt/ui';
import {
  MailIcon,
  MessengerIcon,
  PhoneIcon,
  WhatsAppIcon,
} from '@snt/ui/icons';
import { ApiError, apiSend } from '@/lib/query';
import { stockKey } from '@/app/console/stock/useConsoleStock';
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

  const viewer = useSessionStore((state) => state.viewer);
  const previewListing = draftListing(draft, postAs, viewer);

  /** At a listing limit: the API's message, shown in the limit sheet. */
  const [limit, setLimit] = useState<string | null>(null);

  const queryClient = useQueryClient();

  /** Posted: the draft is emptied when this page closes. */
  const posted = useRef(false);
  useEffect(
    () => () => {
      if (posted.current) usePostDraftStore.getState().reset();
    },
    [],
  );

  /** Saves it (POST /api/listings), then opens it: it is live at once. */
  const post = useMutation({
    mutationFn: async () => {
      const data = await apiSend<{ slug: string }>('/listings', 'POST', listingBody());
      await refreshListing(data.slug);
      return data;
    },
    onSuccess: (data) => {
      // Theirs, and their store's stock when posted as it, read again.
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      if (postAs) void queryClient.invalidateQueries({ queryKey: stockKey(postAs) });
      // Emptied once this page has closed, not now: the listing's page takes
      // a moment to open, and this one would meanwhile redraw as a blank
      // form (Hillary, 2026-11-06).
      posted.current = true;
      toast.success('Your listing is live');
      startPageLoad();
      router.push(`/listing/${data.slug}`);
    },
    onError: (error) => {
      // At a limit, the limit sheet says why and what to do.
      if (error instanceof ApiError && error.code === 'limit') setLimit(error.message);
      else toast.error(error.message || 'We could not post it. Try again in a minute.');
    },
  });

  /** What is sent: the draft, as the API takes a listing. */
  function listingBody() {
    const amount = (typed: string) => Number(typed.replace(/[^0-9.]/g, '')) || undefined;
    const category = draft.category ?? 'other';
    return {
        kind,
        storeId: postAs ?? undefined,
        category,
        haveTitle: kind === 'request' ? undefined : draft.haveTitle.trim(),
        images: kind === 'request' ? undefined : draft.photos,
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
    };
  }

  return (
    <Screen surface>
      {/* The feed's own header: the site does not change face on the way
          into posting. The steps sit in the body, under it. */}
      <AppHeader />

      <ScreenBody>
        <StepBar current={3} steps={POST_STEPS} />

        <span className={styles.label}>How it will look in the feed</span>

        {/* The feed's own card, filled from the draft, as others will see
            it: their name, or the store's, as the seller. Its photos slide
            and open as in the feed; its links and buttons do nothing here,
            as the listing is not up yet. */}
        <div
          className={styles.preview}
          onClickCapture={(event) => {
            const target = event.target as HTMLElement;
            // The full screen photo viewer sits at the top of the page, not
            // in the card, but its clicks still pass through here (React
            // carries a portal's events to where it was drawn): leave them,
            // so its close button and backdrop work.
            if (!event.currentTarget.contains(target)) return;
            if (target.closest('[aria-roledescription="carousel"]')) return;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <ListingCard listing={previewListing} />
        </div>

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

          {/* Post it, under the last thing to choose, with Edit details
              beside it to go back and change something first (the draft is
              kept). */}
          <div className={styles.actions}>
            <ButtonLink href="/post/details" variant="secondary" size="lg" block>
              Edit details
            </ButtonLink>
            <Button
              size="lg"
              block
              // Held on until the listing opens, so it cannot be posted twice.
              loading={post.isPending || post.isSuccess}
              onClick={() =>
                requireVerifiedPhone(
                  {
                    signIn: 'Sign in to post a listing.',
                    phone: 'Verify your phone number to post listings.',
                  },
                  () => post.mutate(),
                )
              }
            >
              Post listing
            </Button>
          </div>
          {limit ? (
            <LimitSheet message={limit} storeId={postAs ?? null} onClose={() => setLimit(null)} />
          ) : null}
        </div>
      </ScreenBody>
    </Screen>
  );
}

/** "Kopje Computers" → "KC", as the API makes a store's initials. */
function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word));
  const letters = words.length > 1 ? `${words[0]![0]}${words[1]![0]}` : (words[0] ?? 'ST').slice(0, 2);
  return letters.toUpperCase();
}

/**
 * The draft as a listing, for the feed's card: what it will say once
 * posted, seen by someone else (so none of the poster's own counts show),
 * with the person, or the store it goes up as, as the seller.
 */
function draftListing(
  draft: ReturnType<typeof usePostDraftStore.getState>,
  postAs: string | null,
  viewer: ReturnType<typeof useSessionStore.getState>['viewer'],
): Listing {
  const amount = (typed: string) => Number(typed.replace(/[^0-9.]/g, '')) || 0;
  const category = draft.category ?? 'other';
  const specs = Object.fromEntries(
    specFieldsFor(category)
      .map((field) => [field.key, (draft.specs[field.key] ?? '').trim()])
      .filter(([, value]) => value),
  );
  const store = postAs ? viewer?.stores.find((each) => each.id === postAs) : undefined;
  const base: ListingBase = {
    id: 'preview',
    slug: 'preview',
    type: draft.kind ?? 'swap',
    // Not theirs, as anyone else sees it.
    ownerId: 'preview-owner',
    storeId: store?.id,
    poster: {
      id: 'preview-owner',
      displayName: viewer?.displayName || 'You',
      joinedAt: '',
      confirmedDeals: 0,
      hasUpheldReports: false,
    },
    store: store
      ? {
          id: store.id,
          slug: store.slug,
          name: store.name,
          initials: initialsOf(store.name),
          logo: store.logo,
          verified: store.verified ?? false,
          stockCount: 0,
        }
      : undefined,
    category,
    title: draft.haveTitle || draft.wantTitle,
    // Where it shows, as the API sets it: the store's neighbourhood, else
    // theirs, else Harare.
    location: (store?.location ?? viewer?.location)?.split(',')[0]?.trim() || 'Harare',
    status: 'live',
    createdAt: '',
    expiresAt: '',
    postedLabel: 'Just now',
    contactChannels: draft.contactChannels,
    allowStoreOffers: draft.allowStoreOffers,
    viewCount: 0,
    revealCount: 0,
    promotion: 'organic',
    tags: [],
  };
  const have: Item = {
    id: 'preview-have',
    category,
    name: draft.haveTitle.trim() || 'What you have',
    condition: draft.condition as Condition,
    specs,
    images: draft.photos,
    wanted: false,
  };
  const want: Item = {
    id: 'preview-want',
    category,
    name: draft.wantTitle.trim() || 'What you want',
    specs: {},
    images: [],
    wanted: true,
  };
  if (base.type === 'sale') {
    return { ...base, type: 'sale', item: have, price: amount(draft.price), negotiable: false, acceptsSwaps: draft.acceptsSwaps };
  }
  if (base.type === 'request') {
    return { ...base, type: 'request', wants: want, budget: amount(draft.budget), responseCount: 0 };
  }
  const direction = draft.cashDirection ?? 'straight';
  return {
    ...base,
    type: 'swap',
    title: `${have.name} for ${want.name}`,
    has: have,
    wants: want,
    cashDirection: direction,
    cashAmount: direction === 'straight' ? undefined : amount(draft.cashAmount) || undefined,
    cashUpTo: direction === 'i-add' && draft.cashUpTo,
    offerCount: 0,
  };
}
