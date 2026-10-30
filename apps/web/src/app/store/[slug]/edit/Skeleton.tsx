/**
 * Edit store details while it loads: the form's own shape in bones (a
 * label over each pale pill box, the larger About box, the half width pair,
 * Save), the Verified store panel and Close store, so nothing shifts when
 * the store's details come.
 */

import { Bone, FieldRow, Panel, Stack } from '@snt/ui';
import styles from './page.module.css';

/** A line of text in bones: a bar as tall as the text's line, so the
    rows below sit where the real ones will. */
function TextBone({ width, line = 16 }: { width: number | string; line?: number }) {
  return (
    <div className={styles.textBone} style={{ height: line }}>
      <Bone width={width} height={Math.min(12, line - 4)} />
    </div>
  );
}

/** A label over a text box, as a Field is, with its hint line if it has
    one; the About box is taller. */
function FieldBone({ tall = false, hint = false }: { tall?: boolean; hint?: boolean }) {
  return (
    <div className={styles.field}>
      <TextBone width={110} />
      {hint ? <TextBone width="60%" /> : null}
      <Bone shape="pill" height={tall ? 76 : 44} />
    </div>
  );
}

/** The Verified store panel, waiting, in its usual shape: the heading, a
    line, the kind of business and its number, and the button. */
export function VerifyPanelSkeleton() {
  return (
    <Panel padded>
      <Stack gap={4}>
        <TextBone width={130} line={20} />
        <Stack gap={5}>
          <TextBone width="80%" line={17} />
          <FieldBone />
          <FieldBone />
          <Bone shape="pill" height={48} />
        </Stack>
      </Stack>
    </Panel>
  );
}

export function StoreFormSkeleton() {
  return (
    <>
      <Panel padded>
        <Stack gap={5}>
          <TextBone width="55%" line={17} />
          <FieldBone />
          <FieldBone hint />
          <FieldBone tall />
          <FieldBone />
          <FieldRow>
            <FieldBone />
            <FieldBone />
          </FieldRow>
          <Bone shape="pill" height={48} />
        </Stack>
      </Panel>
      <VerifyPanelSkeleton />
      <Bone shape="pill" height={44} />
    </>
  );
}
