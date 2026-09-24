'use client';

/**
 * Post, step two — details.
 *
 * Fields follow the chosen outcome and the chosen category. Two things matter
 * here more than they look:
 *
 *  - **Specifications are structured**, because free text cannot be filtered
 *    and specification search is the platform's main advantage.
 *  - **The cash direction control shows all three states**, and the amount
 *    field's label changes with it, so nobody has to infer the direction from
 *    context. A dropdown would hide the choice that explains the whole flow.
 *
 * Wireframe artboard: `PostDetails`.
 */

import Link from 'next/link';
import {
  CASH_AMOUNT_LABELS,
  CASH_DIRECTION_LABELS,
  CATEGORY_LABELS,
  usePostDraftStore,
  type CashDirection,
  type Category,
} from '@snt/core';
import {
  ButtonLink,
  Chip,
  ChipRow,
  Eyebrow,
  Field,
  FieldRow,
  ImagePlaceholder,
  ScreenBody,
  Screen,
  ScreenFooter,
  Segmented,
  StepHeader,
} from '@snt/ui';
import { CloseIcon, PlusIcon, SwapIcon } from '@snt/ui/icons';
import styles from './page.module.css';

const CATEGORIES: Category[] = [
  'laptops',
  'phones',
  'desktops',
  'consoles',
  'parts',
];

const CASH_OPTIONS: { value: CashDirection; label: string }[] = (
  ['i-add', 'they-add', 'straight'] as CashDirection[]
).map((value) => ({ value, label: CASH_DIRECTION_LABELS[value] }));

export default function PostDetailsPage() {
  const draft = usePostDraftStore();
  const kind = draft.kind ?? 'swap';

  const kindLabel =
    kind === 'swap'
      ? 'Swap & top'
      : kind === 'sale'
        ? 'Sell something'
        : 'Looking for something';

  return (
    <Screen surface>
      <StepHeader step={2} backHref="/post" />

      <ScreenBody>
        <div className={styles.kindStrip}>
          <SwapIcon size={15} weight={2.1} />
          <span className={styles.kindLabel}>{kindLabel}</span>
          <Link href="/post" className={styles.change}>
            Change
          </Link>
        </div>

        <div className={styles.group}>
          <Eyebrow className={styles.groupLabel}>Category</Eyebrow>
          <ChipRow label="Choose a category">
            {CATEGORIES.map((value) => (
              <Chip
                key={value}
                selected={draft.category === value}
                onClick={() => draft.setCategory(value)}
              >
                {CATEGORY_LABELS[value]}
              </Chip>
            ))}
          </ChipRow>
        </div>

        {/* Requests need no photographs — the poster does not own the thing. */}
        {kind !== 'request' ? (
          <div className={styles.group}>
            <Eyebrow>
              Photos of what you have — {draft.photoCount} of 8
            </Eyebrow>
            <div className={styles.photos}>
              {Array.from({ length: draft.photoCount }).map((_, index) => (
                <div key={index} className={styles.photoThumb}>
                  <ImagePlaceholder height={68} width={68} small />
                  <button
                    type="button"
                    aria-label={`Remove photo ${index + 1}`}
                    className={styles.removePhoto}
                    onClick={draft.removePhoto}
                  >
                    <CloseIcon size={13} weight={2.2} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                aria-label="Add photo"
                className={styles.addPhoto}
                onClick={draft.addPhoto}
                disabled={draft.photoCount >= 8}
              >
                <PlusIcon size={21} />
              </button>
            </div>
          </div>
        ) : null}

        <div className={styles.fields}>
          <Field
            label={kind === 'request' ? 'What you are looking for' : 'What you have'}
            value={kind === 'request' ? draft.wantTitle : draft.haveTitle}
            onChange={(event) =>
              draft.setField(
                kind === 'request' ? 'wantTitle' : 'haveTitle',
                event.target.value,
              )
            }
          />

          {kind !== 'request' ? (
            <>
              <FieldRow>
                <Field
                  label="Processor"
                  size="sm"
                  value={draft.processor}
                  onChange={(event) =>
                    draft.setField('processor', event.target.value)
                  }
                />
                <Field
                  label="RAM"
                  size="sm"
                  value={draft.ram}
                  onChange={(event) => draft.setField('ram', event.target.value)}
                />
              </FieldRow>

              <FieldRow>
                <Field
                  label="Storage"
                  size="sm"
                  value={draft.storage}
                  onChange={(event) =>
                    draft.setField('storage', event.target.value)
                  }
                />
                <Field
                  label="Condition"
                  size="sm"
                  value={draft.condition}
                  onChange={(event) =>
                    draft.setField('condition', event.target.value)
                  }
                />
              </FieldRow>
            </>
          ) : null}

          {kind === 'swap' ? (
            <Field
              label="What you want"
              hint="Loose is fine — “any i7, 16GB, SSD” matches more than one exact model."
              value={draft.wantTitle}
              onChange={(event) =>
                draft.setField('wantTitle', event.target.value)
              }
            />
          ) : null}

          {kind === 'sale' ? (
            <Field
              label="Price"
              strong
              inputMode="numeric"
              placeholder="$0"
              value={draft.price}
              onChange={(event) => draft.setField('price', event.target.value)}
            />
          ) : null}

          {kind === 'request' ? (
            <Field
              label="Budget"
              strong
              inputMode="numeric"
              placeholder="$0"
              value={draft.budget}
              onChange={(event) => draft.setField('budget', event.target.value)}
            />
          ) : null}
        </div>

        {kind === 'swap' ? (
          <div className={styles.cash}>
            <Eyebrow>The cash</Eyebrow>
            <div className={styles.cashSegments}>
              <Segmented
                label="Which way does the cash go?"
                options={CASH_OPTIONS}
                value={draft.cashDirection}
                onChange={draft.setCashDirection}
              />
            </div>

            {draft.cashDirection !== 'straight' ? (
              <div className={styles.cashAmount}>
                <Field
                  label={CASH_AMOUNT_LABELS[draft.cashDirection]}
                  strong
                  inputMode="numeric"
                  value={draft.cashAmount}
                  onChange={(event) =>
                    draft.setField('cashAmount', event.target.value)
                  }
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </ScreenBody>

      <ScreenFooter>
        <ButtonLink href="/post/review" size="lg" block>
          Next: review
        </ButtonLink>
      </ScreenFooter>
    </Screen>
  );
}
