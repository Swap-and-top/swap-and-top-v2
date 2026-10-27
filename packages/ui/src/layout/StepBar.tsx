'use client';

/**
 * StepBar — where you are in a flow of steps, at the top of the page body.
 *
 * The posting flow keeps the feed's own header, so the site does not change
 * face on the way in; the steps sit under it instead, as numbered circles
 * joined by lines: done steps ticked and filled, the current one filled
 * with its number, the ones to come pale. Each has its name under it. A
 * step already done is a link back to it.
 *
 * Each step is its own page, so the bar mounts afresh on every move. It
 * remembers the step it last showed and, on mount, draws that one first,
 * then eases to the new one: the line between fills on the way forward and
 * draws back on the way back.
 */

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { CheckIcon } from '../icons';
import styles from './StepBar.module.css';

export interface Step {
  label: string;
  /** A page of its own: a step already done links back to it. Without one
      (steps on one page) a done step is just ticked. */
  href?: string;
}

/** The step each flow's bar last showed, keyed by the flow's first page. It
    lives as long as the app does in the tab, so a fresh load starts still. */
const lastShown = new Map<string, number>();

export function StepBar({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number;
  className?: string;
}) {
  const flow = steps[0]?.href ?? steps[0]?.label ?? '';
  const [shown, setShown] = useState(() => lastShown.get(flow) ?? current);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  useEffect(() => {
    lastShown.set(flow, current);
    if (shown === current) return;
    setDirection(current > shown ? 'forward' : 'back');
    // Two frames, so the old step is painted before the move begins.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setShown(current));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, current]);

  return (
    <nav
      className={[styles.bar, direction === 'back' ? styles.back : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      aria-label={`Step ${current} of ${steps.length}`}
    >
      <ol className={styles.steps}>
        {steps.map((step, index) => {
          const number = index + 1;
          const done = number < shown;
          const here = number === shown;
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
                  className={[styles.line, number <= shown ? styles.lineDone : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-hidden
                />
              ) : null}
              <li className={[styles.step, state].join(' ')}>
                {done && step.href ? (
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
