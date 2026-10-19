/**
 * A page of reading: the terms, the privacy policy, how to swap safely. The
 * feed's header, then one white card with the title in the bold blue, a line
 * of when it was last updated, and its sections, each under a thin line.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppHeader, Screen, ScreenBody } from '@snt/ui';
import styles from './InfoPage.module.css';

export interface InfoSection {
  title: string;
  body: ReactNode;
}

export function InfoPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  /** e.g. "1 January 2024". */
  updated?: string;
  intro?: ReactNode;
  sections: InfoSection[];
}) {
  return (
    <Screen>
      <AppHeader />
      <ScreenBody>
        <article className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {updated ? <p className={styles.updated}>Last updated {updated}</p> : null}
          {intro ? <div className={styles.intro}>{intro}</div> : null}
          {sections.map((section) => (
            <section key={section.title} className={styles.section}>
              <h2 className={styles.heading}>{section.title}</h2>
              <div className={styles.body}>{section.body}</div>
            </section>
          ))}
        </article>
      </ScreenBody>
    </Screen>
  );
}

/** A link to another page of the app, inside the text. */
export function InfoLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.link}>
      {children}
    </Link>
  );
}
