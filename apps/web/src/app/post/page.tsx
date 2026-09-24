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
  Body,
  Note,
  PageHeading,
  Screen,
  ScreenBody,
  StepHeader,
} from '@snt/ui';
import {
  ChevronRightIcon,
  InfoIcon,
  SearchIcon,
  ShopIcon,
  SwapIcon,
} from '@snt/ui/icons';
import styles from './page.module.css';

interface Option {
  kind: PostKind;
  title: string;
  description: string;
  featured?: boolean;
  glyph: React.ReactNode;
}

const OPTIONS: Option[] = [
  {
    kind: 'sale',
    title: 'Sell something',
    description: 'Set a price. Buyers call or message you directly.',
    glyph: <ShopIcon size={21} weight={1.8} />,
  },
  {
    kind: 'swap',
    title: 'Swap & top',
    description:
      'Trade what you have towards what you want, adding or receiving cash.',
    featured: true,
    glyph: <SwapIcon size={21} weight={2} />,
  },
  {
    kind: 'request',
    title: 'Looking for something',
    description: 'Say what you want and your budget. Dealers come to you.',
    glyph: <SearchIcon size={21} weight={1.8} />,
  },
];

export default function PostTypePage() {
  const router = useRouter();
  const setKind = usePostDraftStore((state) => state.setKind);

  const choose = (kind: PostKind) => {
    setKind(kind);
    router.push('/post/details');
  };

  return (
    <Screen surface>
      <StepHeader step={1} backHref="/" closeInstead />

      <ScreenBody>
        <PageHeading>What do you want to do?</PageHeading>
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
                option.featured ? styles.optionFeatured : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  styles.glyph,
                  option.featured ? styles.glyphFeatured : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {option.glyph}
              </span>

              <span className={styles.optionBody}>
                <span className={styles.optionHead}>
                  <span className={styles.optionTitle}>{option.title}</span>
                  {option.featured ? (
                    <span className={styles.ourThing}>Our thing</span>
                  ) : null}
                </span>
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
          className={styles.dealerNote}
        >
          Selling a lot? A dealer account gives you a shopfront, bulk stock
          upload and lead alerts.
        </Note>
      </ScreenBody>
    </Screen>
  );
}
