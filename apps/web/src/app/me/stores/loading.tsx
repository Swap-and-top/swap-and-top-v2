/**
 * Loading: My stores, its own, so the Me page's skeleton does not show
 * while it comes. The title and the button never change; the rows wait in
 * bones.
 */

import { AppHeader, Bone, ButtonLink, ListGroup, Screen, ScreenBody, Stack } from '@snt/ui';
import styles from './page.module.css';

export default function Loading() {
  return (
    <Screen>
      <AppHeader>
        <h1 className={styles.title}>My stores</h1>
      </AppHeader>
      <ScreenBody>
        <Stack gap={6}>
          <ListGroup>
            {[0, 1].map((n) => (
              <div key={n} className={styles.boneRow}>
                <Bone shape="circle" width={32} height={32} />
                <Bone width="45%" height={14} />
              </div>
            ))}
          </ListGroup>
          <ButtonLink href="/me" variant="secondary" block>
            Back to my profile
          </ButtonLink>
        </Stack>
      </ScreenBody>
    </Screen>
  );
}
