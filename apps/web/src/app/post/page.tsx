'use client';

/**
 * Post, step one — what do you want to do?
 *
 * Three outcomes from one entry point, so a user never has to classify their own
 * intent before they start. The screen states plainly that posting is free and
 * the listing goes live straight away; both reduce hesitation.
 *
 * Wireframe artboard: `PostType`.
 *
 * Started from a store (`/post?as=<store id>`), it posts as that store,
 * said in a fixed line at the top; from anywhere else, as the person.
 *
 * The listing limit is told here, before any work, not at the end
 * (Hillary, 2026-11-25): at 2 of 3 live listings for sale or swap, a line
 * that the next is the last; at 3, a note with My listings and Open a store,
 * and Sell and Swap faded; a free store the same at 4 and 5 of 5. Looking
 * for something never counts. The API still checks at the end.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePostDraftStore, useSessionStore, type PostKind } from '@snt/core';
import {
  AppHeader,
  Body,
  Bone,
  ButtonLink,
  Note,
  Screen,
  ScreenBody,
  startPageLoad,
  StepBar,
} from '@snt/ui';
import {
  ChevronRightIcon,
  InfoIcon,
  SearchIcon,
  StoreIcon,
  SwapIcon,
} from '@snt/ui/icons';
import { PostingAs, usePostAs, usePostSteps } from '@/components/PostAs';
import { apiGet } from '@/lib/query';
import styles from './page.module.css';

interface Option {
  kind: PostKind;
  title: string;
  description: string;
  /** Its colour: blue for what is for sale, green for what is wanted, the
      swap in the teal between them. Its title, icon and arrow take it. */
  tone: 'sale' | 'swap' | 'wanted';
  glyph: React.ReactNode;
}

const OPTIONS: Option[] = [
  {
    kind: 'sale',
    title: 'Sell something',
    description: 'Set a price. Buyers call or message you directly.',
    tone: 'sale',
    glyph: <StoreIcon size={21} weight={1.8} />,
  },
  {
    kind: 'swap',
    title: 'Swap & top',
    description:
      'Swap what you have towards what you want, adding or receiving cash.',
    tone: 'swap',
    glyph: <SwapIcon size={21} weight={2} />,
  },
  {
    kind: 'request',
    title: 'Looking for something',
    description: 'Say what you want and your budget. Stores come to you.',
    tone: 'wanted',
    glyph: <SearchIcon size={21} weight={1.8} />,
  },
];

export default function PostTypePage() {
  // The address says who it goes up as, read in the browser.
  return (
    <Suspense>
      <PostType />
    </Suspense>
  );
}

function PostType() {
  const router = useRouter();
  const setKind = usePostDraftStore((state) => state.setKind);
  const setPostAs = usePostDraftStore((state) => state.setPostAs);
  /** A store's Add a listing: `?as=<store id>`. Anywhere else: themselves. */
  const as = useSearchParams().get('as');
  useEffect(() => setPostAs(as), [as, setPostAs]);
  const steps = usePostSteps();
  const signedIn = useSessionStore((state) => state.signedIn);
  /** Whether this browser's sign in has been read yet: before that (and in
      the page built ahead on the server) it is not known who this is. */
  const restored = useSessionStore((state) => state.restored);
  const viewer = useSessionStore((state) => state.viewer);
  const postAs = usePostAs();
  /** Still settling who it goes up as: the address and the draft agree. */
  const settling = (as ?? null) !== usePostDraftStore((state) => state.postAs ?? null);
  const storeName = viewer?.stores.find((store) => store.id === postAs)?.name;
  /** Live listings for sale or swap against the limit, theirs or the
      store's: read afresh each time this page opens, one quick count, so
      the choices never show as open when they are not. */
  const limit = useQuery({
    queryKey: ['me', viewer?.id, 'listing-limit', postAs],
    queryFn: () =>
      apiGet<{ live: number; limit: number | null }>(
        `/me/listing-limit${postAs ? `?storeId=${encodeURIComponent(postAs)}` : ''}`,
      ),
    enabled: Boolean(viewer) && !settling,
    refetchOnMount: 'always',
  });
  /** Waiting to know who they are and the count, so the line at the top,
      any note and the choices come together (if it cannot be read, the
      choices show: the API still checks at the end). */
  const waiting =
    !restored ||
    (signedIn && (!viewer || settling || (!limit.isError && !limit.isFetchedAfterMount)));
  const live = limit.data?.live ?? null;
  const max = limit.data?.limit ?? null;
  const atLimit = live !== null && max !== null && live >= max;
  const lastOne = live !== null && max !== null && live === max - 1;

  const choose = (kind: PostKind) => {
    setKind(kind);
    startPageLoad();
    router.push('/post/details');
  };

  return (
    <Screen surface>
      {/* The feed's own header: the site does not change face on the way
          into posting. The steps sit in the body, under it. */}
      <AppHeader />

      <ScreenBody>
        <StepBar current={1} steps={steps} />
        {/* Posting as a store: said, never chosen here. */}
        {waiting ? null : <PostingAs />}
        <h1 className={styles.heading}>What do you want to do?</h1>
        <Body className={styles.intro}>
          Posting is free. Your listing goes live straight away.
        </Body>

        {waiting ? null : atLimit && postAs ? (
          <div className={styles.limit}>
            <p className={styles.limitTitle}>Listing limit reached</p>
            <p>A free store can have {max} live listings at a time, and {storeName} has {live}.</p>
            <p>For unlimited listings, get a store pass. Or mark one as sold to make room.</p>
            <p className={styles.limitSmall}>Looking for something doesn&apos;t count towards the limit.</p>
            <div className={styles.limitActions}>
              <ButtonLink href={`/me/stores/${postAs}`} variant="secondary">
                Get a store pass
              </ButtonLink>
            </div>
          </div>
        ) : atLimit ? (
          <div className={styles.limit}>
            <p className={styles.limitTitle}>Listing limit reached</p>
            <p>
              A personal account can only have up to {max} live listings at a time.{' '}
              {viewer?.stores.length ? (
                'To post more listings, add them from your store, or mark a live listing as sold.'
              ) : (
                <>
                  To post more listings, create a <strong>free</strong> store account, or mark a live
                  listing as sold.
                </>
              )}
            </p>
            <p className={styles.limitSmall}>"Looking for something" doesn&apos;t count towards the limit.</p>
            <div className={styles.limitActions}>
              <ButtonLink href="/me/listings" variant="secondary">
                My listings
              </ButtonLink>
              {viewer?.stores.length ? (
                <ButtonLink href="/me/stores" variant="secondary">
                  My stores
                </ButtonLink>
              ) : (
                <ButtonLink href="/store/new" variant="secondary">
                  Create a store
                </ButtonLink>
              )}
            </div>
          </div>
        ) : lastOne ? (
          <p className={styles.heads}>
            {postAs
              ? `This will be the store's last listing for sale or swap: a free store keeps ${max} live.`
              : `This will be your last listing for sale or swap: a personal account keeps ${max} live.`}
          </p>
        ) : null}

        {waiting ? (
          // Until their count is in: the three choices as bones, the same
          // size, so nothing can be chosen before it is known.
          <div className={styles.options} aria-busy>
            {OPTIONS.map((option) => (
              <Bone key={option.kind} shape="block" height="" className={styles.optionBone} />
            ))}
          </div>
        ) : (
        <div className={styles.options}>
          {OPTIONS.map((option) => {
            /** At the limit, only Looking for something is open. */
            const closed = atLimit && option.kind !== 'request';
            return (
            <button
              key={option.kind}
              type="button"
              onClick={() => choose(option.kind)}
              disabled={closed}
              className={[
                styles.option,
                styles[option.tone],
                closed ? styles.closed : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={styles.glyph}>{option.glyph}</span>

              <span className={styles.optionBody}>
                <span className={styles.optionTitle}>{option.title}</span>
                <span className={styles.optionDescription}>
                  {option.description}
                </span>
              </span>

              <span className={styles.chevron}>
                <ChevronRightIcon size={18} />
              </span>
            </button>
            );
          })}
        </div>
        )}

        {/* Only for someone with no store, and not beside the limit note,
            which already says to create one. */}
        {waiting || postAs || atLimit || viewer?.stores.length ? null : (
          <Note
            icon={<InfoIcon size={17} />}
            tone="subtle"
            className={styles.storeNote}
          >
            Selling a lot? Open a store for a store page, bulk stock upload
            and lead alerts.
          </Note>
        )}
      </ScreenBody>
    </Screen>
  );
}
