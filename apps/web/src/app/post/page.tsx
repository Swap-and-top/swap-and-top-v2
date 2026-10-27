'use client';

/**
 * Post, step one — what do you want to do?
 *
 * Three outcomes from one entry point, so a user never has to classify their own
 * intent before they start. The screen states plainly that posting is free and
 * the listing goes live straight away; both reduce hesitation.
 *
 * Wireframe artboard: `PostType`.
 */

import { useRouter } from 'next/navigation';
import { usePostDraftStore, type PostKind } from '@snt/core';
import {
  AppHeader,
  Body,
  Note,
  POST_STEPS,
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
  const router = useRouter();
  const setKind = usePostDraftStore((state) => state.setKind);

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
        <StepBar current={1} steps={POST_STEPS} />
        <h1 className={styles.heading}>What do you want to do?</h1>
        <Body className={styles.intro}>
          Posting is free. Your listing goes live straight away.
        </Body>

        <div className={styles.options}>
          {OPTIONS.map((option) => (
            <button
              key={option.kind}
              type="button"
              onClick={() => choose(option.kind)}
              className={[
                styles.option,
                styles[option.tone],
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
          ))}
        </div>

        <Note
          icon={<InfoIcon size={17} />}
          tone="subtle"
          className={styles.storeNote}
        >
          Selling a lot? Open a store for a store page, bulk stock upload
          and lead alerts.
        </Note>
      </ScreenBody>
    </Screen>
  );
}
