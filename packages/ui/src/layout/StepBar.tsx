'use client';

/**
 * StepBar — where you are in a flow of steps, at the top of the page body.
 *
 * The posting flow keeps the feed's own header, so the site does not change
 * face on the way in; the steps sit under it instead, as numbered circles
 * joined by lines: done steps ticked and filled, the current one filled
 * with its number, the ones to come pale. Each has its name under it. A
 * step already done is a link back to it.
 */

import Link from 'next/link';
import { Fragment } from 'react';
import { CheckIcon } from '../icons';
import styles from './StepBar.module.css';

export interface Step {
  label: string;
  href: string;
}

export function StepBar({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <nav className={styles.bar} aria-label={`Step ${current} of ${steps.length}`}>
      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const number = index + 1;
          const done = number < current;
          const here = number === current;
          const state = done ? styles.done : here ? styles.here : styles.ahead;

          const mark = (
            <>
              <span className={styles.circle}>
                {done ? <CheckIcon size={14} weight={3} /> : number}
              </span>
              <span className={styles.label}>{step.label}</span>
            </>
          );

          return (
            <Fragment key={step.label}>
              {/* The line before each step after the first: filled once the
                  flow has reached that step. */}
              {index > 0 ? (
                <li
                  className={[styles.line, number <= current ? styles.lineDone : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden
                />
              ) : null}
              <li className={[styles.step, state].join(' ')}>
                {done ? (
                  <Link href={step.href} className={styles.stepLink}>
                    {mark}
                  </Link>
                ) : (
                  <span
                    className={styles.stepLink}
                    aria-current={here ? 'step' : undefined}
                  >
                    {mark}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/** The posting flow's three steps. */
export const POST_STEPS: Step[] = [
  { label: 'Choose', href: '/post' },
  { label: 'Details', href: '/post/details' },
  { label: 'Review', href: '/post/review' },
];
