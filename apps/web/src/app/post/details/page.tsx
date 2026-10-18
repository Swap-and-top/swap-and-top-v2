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

import { useId } from 'react';
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
  ButtonLink,
  Chip,
  ChipRow,
  Dropdown,
  Field,
  ImagePlaceholder,
  POST_STEPS,
  Screen,
  ScreenBody,
  specFieldsFor,
  StepBar,
  TickTile,
} from '@snt/ui';
import { CloseIcon, PlusIcon } from '@snt/ui/icons';
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

export default function PostDetailsPage() {
  const draft = usePostDraftStore();
  const kind = draft.kind ?? 'swap';
  const { label: kindLabel, tone } = KINDS[kind];
  // No category yet: no details to ask for until one is picked.
  const fields = draft.category ? specFieldsFor(draft.category) : [];
  const conditionLabel = useId();

  return (
    <Screen surface>
      {/* The feed's own header: the site does not change face on the way
          into posting. The steps sit in the body, under it. */}
      <AppHeader />

      <ScreenBody>
        <StepBar current={2} steps={POST_STEPS} />

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
              thing. */}
          {kind !== 'request' ? (
            <div className={styles.group}>
              <span className={[styles.label, styles.flush].join(' ')}>
                Photos of what you have{' '}
                <span className={styles.optional}>
                  ({draft.photoCount} of 8)
                </span>
              </span>
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
                      <CloseIcon size={12} weight={2.4} />
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

          <Field
            label={
              kind === 'request' ? 'What you are looking for' : 'What you have'
            }
            placeholder={
              kind === 'request' ? 'e.g. Any Core i7, 16GB' : 'e.g. MacBook Air 2017'
            }
            value={kind === 'request' ? draft.wantTitle : draft.haveTitle}
            onChange={(event) =>
              draft.setField(
                kind === 'request' ? 'wantTitle' : 'haveTitle',
                event.target.value,
              )
            }
          />

          {/* The details this category asks for, two to a row, with the
              condition among them. Other has none: it is described in
              words. A wanted post is described by its title alone. */}
          {kind !== 'request' ? (
            <div className={styles.specs}>
              {fields.map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  placeholder={`e.g. ${field.example}`}
                  value={draft.specs[field.key] ?? ''}
                  onChange={(event) =>
                    draft.setSpec(field.key, event.target.value)
                  }
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
                />
              ) : null}
              {draft.category === 'other' ? (
                <Field
                  className={styles.wide}
                  label="Details"
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
              placeholder="e.g. Any i7, 16GB, SSD"
              value={draft.wantTitle}
              onChange={(event) =>
                draft.setField('wantTitle', event.target.value)
              }
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
            />
          ) : null}

          {/* On to the review, under the last thing to fill in. */}
          <ButtonLink href="/post/review" size="lg" block className={styles.next}>
            Next: review
          </ButtonLink>
        </div>
      </ScreenBody>
    </Screen>
  );
}
