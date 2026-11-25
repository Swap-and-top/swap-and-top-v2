'use client';

/**
 * Post, step two — details.
 *
 * Set as the offer form is: one white card, sentence-case bold blue labels
 * set in over pale rounded boxes, choices as tiles, and the button that
 * moves on at the foot of the form rather than pinned to the screen.
 *
 * Fields follow the chosen outcome and the chosen category. Two things matter
 * here more than they look:
 *
 *  - **Specifications are structured**, because free text cannot be filtered
 *    and specification search is the platform's main advantage.
 *  - **The cash direction shows all three choices**, and the amount box's
 *    label changes with it, so nobody has to infer the direction from
 *    context. A dropdown would hide the choice that explains the whole flow.
 *
 * Wireframe artboard: `PostDetails`.
 */

import { useId, useState } from 'react';
import {
  CASH_AMOUNT_LABELS,
  CASH_DIRECTION_LABELS,
  CATEGORY_LABELS,
  CONDITION_LABELS,
  usePostDraftStore,
  type CashDirection,
  type Category,
  type Condition,
} from '@snt/core';
import {
  AppHeader,
  Button,
  ButtonLink,
  Chip,
  ChipRow,
  Dropdown,
  Field,
  Screen,
  ScreenBody,
  specFieldsFor,
  Stack,
  StepBar,
  TickTile,
  withUnit,
} from '@snt/ui';
import { MAX_PHOTOS, PhotoPicker, usePhotoPicker } from '@/components/PhotoPicker';
import { PostingAs, postStart, usePostAs, usePostSteps } from '@/components/PostAs';
import styles from './page.module.css';

const CATEGORIES: Category[] = [
  'laptops',
  'phones',
  'desktops',
  'consoles',
  'parts',
  'accessories',
  'other',
];

const CASH_DIRECTIONS: CashDirection[] = ['i-add', 'they-add', 'straight'];

/** Each kind of post in its own colour, as on the first step. */
const KINDS = {
  sale: { label: 'Sell something', tone: 'sale' },
  swap: { label: 'Swap & top', tone: 'swap' },
  request: { label: 'Looking for something', tone: 'wanted' },
} as const;

/** The examples in the title boxes, for the category chosen. */
const HAVE: Record<Category, string> = {
  laptops: 'MacBook Air 2017',
  phones: 'Samsung Galaxy A54 128GB',
  desktops: 'HP EliteDesk 800 G4',
  consoles: 'PlayStation 4 Slim 1TB',
  parts: '8GB DDR4 laptop RAM',
  accessories: 'AirPods Pro',
  other: 'Canon EOS 200D camera',
};
const LOOKING_FOR: Record<Category, string> = {
  laptops: 'Any Core i7, 16GB',
  phones: 'Any iPhone 11 or newer',
  desktops: 'Any Core i5 with 16GB',
  consoles: 'PS5 with two controllers',
  parts: '512GB SSD',
  accessories: 'Original Samsung charger',
  other: 'A Canon camera',
};
const WANT: Record<Category, string> = {
  laptops: 'Any i7, 16GB, SSD',
  phones: 'Any iPhone 12 or newer',
  desktops: 'A gaming PC with a GTX 1660',
  consoles: 'Xbox Series S',
  parts: '1TB SSD',
  accessories: 'JBL speaker',
  other: 'A Bluetooth speaker',
};

export default function PostDetailsPage() {
  const draft = usePostDraftStore();
  const kind = draft.kind ?? 'swap';
  const { label: kindLabel, tone } = KINDS[kind];
  // No category yet: no details to ask for until one is picked.
  const fields = draft.category ? specFieldsFor(draft.category) : [];
  const conditionLabel = useId();
  const picking = usePhotoPicker(draft.photos, draft.setPhotos);
  const steps = usePostSteps();
  const postAs = usePostAs();
  /** What is still needed, each with what to say beside it. */
  const missing = missingDetails(draft, kind);
  const ready = Object.keys(missing).length === 0;
  /** Next was pressed with something missing: those parts show in red, and
      clear one by one as they are filled in. */
  const [checked, setChecked] = useState(false);
  const errorFor = (key: string) => (checked ? missing[key] : undefined);

  /** Next with something missing: mark it, and bring the first into view. */
  function showMissing() {
    setChecked(true);
    window.setTimeout(() => {
      document
        .querySelector('[aria-invalid="true"], [data-missing]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }

  return (
    <Screen surface>
      {/* The feed's own header: the site does not change face on the way
          into posting. The steps sit in the body, under it. */}
      <AppHeader />

      <ScreenBody>
        <StepBar current={2} steps={steps} />
        <PostingAs />

        <div className={styles.form}>
          {/* What is being posted, in its own colour. To choose again,
              the browser's back, or the Choose step above. */}
          <h1 className={[styles.kind, styles[tone]].join(' ')}>{kindLabel}</h1>

          <div className={styles.group}>
            <span className={[styles.label, styles.flush].join(' ')}>
              Category
            </span>
            {/* Scrolls sideways within the card, cut at its edges. */}
            <div className={styles.chips}>
            <ChipRow fill label="Choose a category">
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
          </div>

          {/* Requests need no photographs: the poster does not own the
              thing. Each goes up as it is chosen. */}
          {kind !== 'request' ? (
            <div className={styles.group}>
              <span className={[styles.label, styles.flush].join(' ')}>
                Photos of what you have{' '}
                <span className={styles.optional}>
                  ({draft.photos.length} of {MAX_PHOTOS}, upload at least {MIN_PHOTOS})
                </span>
              </span>
              <PhotoPicker picking={picking} />
              {errorFor('photos') ? (
                <span className={styles.missing} data-missing="">
                  {errorFor('photos')}
                </span>
              ) : null}
            </div>
          ) : null}

          <Field
            label={
              kind === 'request' ? 'What you are looking for' : 'What you have'
            }
            placeholder={`e.g. ${
              (kind === 'request' ? LOOKING_FOR : HAVE)[draft.category ?? 'laptops']
            }`}
            value={kind === 'request' ? draft.wantTitle : draft.haveTitle}
            onChange={(event) =>
              draft.setField(
                kind === 'request' ? 'wantTitle' : 'haveTitle',
                event.target.value,
              )
            }
            error={errorFor('title')}
          />

          {/* The details this category asks for, two to a row, with the
              condition among them. Other has none: it is described in
              words. A wanted post is described by its title alone. */}
          {kind !== 'request' ? (
            <div className={styles.specs}>
              {fields.map((field) => (
                <Field
                  key={field.key}
                  label={field.optional ? `${field.label} (optional)` : field.label}
                  placeholder={`e.g. ${field.example}`}
                  value={draft.specs[field.key] ?? ''}
                  onChange={(event) =>
                    draft.setSpec(field.key, event.target.value)
                  }
                  error={errorFor(`spec:${field.key}`)}
                  onBlur={(event) => {
                    const done = withUnit(field, event.target.value);
                    if (done !== event.target.value) draft.setSpec(field.key, done);
                  }}
                />
              ))}
              {/* The same four conditions as everywhere, in the same
                  dropdown as the offer form. */}
              <div className={styles.field}>
                <span id={conditionLabel} className={styles.label}>
                  Condition
                </span>
                <Dropdown<Condition>
                  labelledBy={conditionLabel}
                  value={
                    draft.condition in CONDITION_LABELS
                      ? (draft.condition as Condition)
                      : undefined
                  }
                  onChange={(value) => draft.setField('condition', value)}
                  placeholder="e.g. Used good"
                  options={(Object.keys(CONDITION_LABELS) as Condition[]).map(
                    (value) => ({ value, label: CONDITION_LABELS[value] }),
                  )}
                />
              </div>
              {/* A sale's price sits beside the condition, a box like the
                  rest. */}
              {kind === 'sale' ? (
                <Field
                  label="Price"
                  strong
                  inputMode="numeric"
                  placeholder="e.g. $250"
                  value={draft.price}
                  onChange={(event) =>
                    draft.setField('price', event.target.value)
                  }
                  error={errorFor('price')}
                />
              ) : null}
              {draft.category === 'other' ? (
                <Field
                  className={styles.wide}
                  label="Details (optional)"
                  placeholder="e.g. Canon EOS 200D, with its lens and charger"
                  value={draft.specs.details ?? ''}
                  onChange={(event) =>
                    draft.setSpec('details', event.target.value)
                  }
                />
              ) : null}
            </div>
          ) : null}

          {kind === 'swap' ? (
            <Field
              label="What you want"
              hint="Loose is fine: it matches more than one exact model."
              placeholder={`e.g. ${WANT[draft.category ?? 'laptops']}`}
              value={draft.wantTitle}
              onChange={(event) =>
                draft.setField('wantTitle', event.target.value)
              }
              error={errorFor('want')}
            />
          ) : null}

          {kind === 'swap' ? (
            <fieldset className={styles.group}>
              <legend className={[styles.label, styles.flush].join(' ')}>
                Payment
              </legend>
              {/* All three ways, side by side as tiles, so the choice that
                  explains the whole flow is never hidden. */}
              <div className={styles.tiles}>
                {CASH_DIRECTIONS.map((direction) => (
                  <label key={direction} className={styles.tile}>
                    <input
                      type="radio"
                      name="cash-direction"
                      checked={draft.cashDirection === direction}
                      onChange={() => draft.setCashDirection(direction)}
                    />
                    <span>{CASH_DIRECTION_LABELS[direction]}</span>
                  </label>
                ))}
              </div>

              {draft.cashDirection && draft.cashDirection !== 'straight' ? (
                // The amount and, when they pay, "This is my maximum", side
                // by side; one above the other on a narrow phone.
                <div className={styles.payment}>
                  <Field
                    label={CASH_AMOUNT_LABELS[draft.cashDirection]}
                    strong
                    inputMode="numeric"
                    placeholder="e.g. $50"
                    value={draft.cashAmount}
                    onChange={(event) =>
                      draft.setField('cashAmount', event.target.value)
                    }
                    error={errorFor('cash')}
                  />
                  {/* When they pay, it can be a ceiling: "+ up to $600", for
                      someone who knows what they will spend. */}
                  {draft.cashDirection === 'i-add' ? (
                    <TickTile
                      checked={draft.cashUpTo}
                      onChange={draft.setCashUpTo}
                      label="This is my maximum"
                      hint="Shown as “up to”."
                    />
                  ) : null}
                </div>
              ) : null}
            </fieldset>
          ) : null}

          {kind === 'sale' ? (
            <>
              {/* A gentle way into swaps, at the moment it is useful: the
                  listing says "Swaps accepted", and buyers can offer a
                  swap. */}
              <TickTile
                checked={draft.acceptsSwaps}
                onChange={draft.setAcceptsSwaps}
                label="Accept swaps"
                hint="Buyers can offer something they have, with cash on top."
              />
            </>
          ) : null}

          {kind === 'request' ? (
            <Field
              label="Budget"
              strong
              inputMode="numeric"
              placeholder="e.g. $300"
              value={draft.budget}
              onChange={(event) => draft.setField('budget', event.target.value)}
              error={errorFor('budget')}
            />
          ) : null}

          {/* Back to Choose beside Next, as Edit details sits beside Post
              listing (the draft is kept). Next is always on, but while
              photos are still going up: pressed with something missing,
              the missing parts turn red and say what is needed. */}
          <Stack gap={4} className={styles.next}>
            <div className={styles.actions}>
              <ButtonLink href={postStart(postAs)} variant="secondary" size="lg" block>
                Back
              </ButtonLink>
              {picking.busy ? (
                <Button size="lg" block loading disabled>
                  Next
                </Button>
              ) : !ready ? (
                <Button size="lg" block onClick={showMissing}>
                  Next
                </Button>
              ) : (
                <ButtonLink href="/post/review" size="lg" block>
                  Next
                </ButtonLink>
              )}
            </div>
            {checked && !ready ? (
              <p className={[styles.nextNote, styles.nextNoteMissing].join(' ')}>
                Fill in the parts marked in red to carry on.
              </p>
            ) : null}
          </Stack>
        </div>
      </ScreenBody>
    </Screen>
  );
}

/** The fewest photos a sale or a swap goes up with (Hillary, 2026-11-06). */
const MIN_PHOTOS = 2;

/** A typed amount: "$250" → 250; nothing or nonsense → 0. */
const amountOf = (typed: string) => Number(typed.replace(/[^0-9.]/g, '')) || 0;

/**
 * What the listing still needs, each with the line shown under it in red once Next is pressed (Hillary, 2026-11-06 and 2026-11-25):
 * what they have, the details its category asks for but those marked
 * optional (Other's description is optional too), and the price; for a swap,
 * what they want and, unless it is straight, how much; for a Wanted
 * listing, what they are looking for and the budget; and, but for a Wanted
 * listing, at least two photos. Condition always has one chosen.
 */
function missingDetails(
  draft: ReturnType<typeof usePostDraftStore.getState>,
  kind: 'sale' | 'swap' | 'request',
): Record<string, string> {
  const missing: Record<string, string> = {};
  if (kind === 'request') {
    if (!draft.wantTitle.trim()) missing.title = 'Say what you are looking for.';
    if (!(amountOf(draft.budget) > 0)) missing.budget = 'Enter your budget.';
    return missing;
  }
  if (draft.photos.length < MIN_PHOTOS) missing.photos = `Add at least ${MIN_PHOTOS} photos.`;
  if (!draft.haveTitle.trim()) missing.title = 'Say what you have.';
  for (const field of draft.category ? specFieldsFor(draft.category) : []) {
    if (!field.optional && !draft.specs[field.key]?.trim()) {
      missing[`spec:${field.key}`] = `Enter the ${field.label.toLowerCase()}.`;
    }
  }
  if (kind === 'sale') {
    if (!(amountOf(draft.price) > 0)) missing.price = 'Enter a price.';
    return missing;
  }
  if (!draft.wantTitle.trim()) missing.want = 'Say what you want.';
  const direction = draft.cashDirection ?? 'straight';
  if (direction !== 'straight' && !(amountOf(draft.cashAmount) > 0)) missing.cash = 'Enter the amount.';
  return missing;
}
