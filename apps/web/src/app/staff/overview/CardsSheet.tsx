'use client';

/**
 * Customize my overview: the sheet behind My overview's gear button, set as Android's
 * quick settings tiles are edited (Hillary, 2026-11-03). Your cards, the
 * ones chosen, two to a row in the order they show; and every card this
 * person may add, by the part of the team it is from, two to a row, each
 * with a tick box (ticked, it joins the end of Your cards). Save, on once
 * something has changed, keeps them
 * (PUT /api/staff/overview/cards), reads the Overview again and opens My
 * overview with them.
 *
 * A card is moved by dragging it (with a mouse, anywhere on it; with a
 * finger, by its grip at the right end, so the hand does not hide the card,
 * and the sheet still scrolls): a faded copy follows
 * the pointer, the card's place turns to a dashed slot where it will land,
 * moving to the nearest place as it goes, the others making room; let go
 * and it drops there. On the keyboard, the grip and the arrow keys.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Button, Sheet, Stack } from '@snt/ui';
import { apiSend } from '@/lib/query';
import { staffKeys } from '../sections';
import styles from './page.module.css';

export interface Choice {
  key: string;
  label: string;
  /** The part of the team it is from: "Trust and safety". */
  section: string;
}

/** Set on the sheet's dialog while a card is dragged: a closed hand. */
const GRABBING = styles.grabbing ?? '';

/** How far a mouse moves before a press becomes a drag, so a click is not. */
const DRAG_AFTER = 4;

/** Six dots: the grip a card is dragged by. */
function Grip() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      {[3, 7, 11].map((y) => (
        <g key={y}>
          <circle cx="5" cy={y} r="1.3" fill="currentColor" />
          <circle cx="9" cy={y} r="1.3" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/** The card being dragged: which, where the pointer is, and where on the
    card it was taken hold of, so the copy keeps that spot under it. */
interface Drag {
  key: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
}

export function CardsSheet({
  choices,
  chosen,
  onSaved,
  onClose,
}: {
  choices: Choice[];
  chosen: string[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const ids = useId();
  const [cards, setCards] = useState<string[]>(chosen);
  const [drag, setDrag] = useState<Drag | null>(null);
  /** A press not yet a drag: where it began. */
  const press = useRef<{ key: string; x: number; y: number; el: HTMLElement } | null>(null);
  const tiles = useRef(new Map<string, HTMLLIElement>());
  /** Where the copy that follows the pointer is drawn: the sheet's own
      dialog, which the browser keeps above everything on the page. */
  const host = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();

  /** Anything changed since the sheet opened (cards or their order): Save
      is off until then. */
  const changed = cards.length !== chosen.length || cards.some((key, n) => key !== chosen[n]);

  const labelOf = (key: string) => choices.find((choice) => choice.key === key)?.label ?? key;
  const groups = [...new Set(choices.map((choice) => choice.section))];

  /** Moves a card to a place in the list. */
  const move = (key: string, to: number) =>
    setCards((now) => {
      const without = now.filter((each) => each !== key);
      without.splice(Math.max(0, Math.min(to, without.length)), 0, key);
      return without;
    });

  const begin = (key: string, x: number, y: number, el: HTMLElement) => {
    const tile = tiles.current.get(key);
    const box = (tile ?? el).getBoundingClientRect();
    host.current = el.closest('dialog') ?? document.body;
    // A closed hand the whole way, over the other cards too, which offer
    // an open one.
    host.current.classList.add(GRABBING);
    setDrag({ key, x, y, dx: x - box.left, dy: y - box.top, width: box.width, height: box.height });
  };

  // The dragged card's slot goes to the place whose tile is nearest the
  // pointer, the others closing up behind it.
  const follow = (key: string, x: number, y: number) => {
    let nearest = cards.indexOf(key);
    let best = Infinity;
    cards.forEach((each, n) => {
      const box = tiles.current.get(each)?.getBoundingClientRect();
      if (!box) return;
      const far = Math.hypot(x - (box.left + box.width / 2), y - (box.top + box.height / 2));
      if (far < best) {
        best = far;
        nearest = n;
      }
    });
    if (nearest !== cards.indexOf(key)) move(key, nearest);
    setDrag((now) => (now ? { ...now, x, y } : now));
  };

  /** A press on a card or its grip. A finger drags at once from the grip;
      a mouse once it has moved a little, so a click stays a click. */
  const onDown = (key: string, grip: boolean) => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    if (event.pointerType !== 'mouse' && !grip) return;
    event.preventDefault();
    // The pointer stays with this card while it is dragged, wherever it
    // goes (it cannot be held for a pointer that is not a real one).
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Not a real pointer: the card follows while the pointer is over it.
    }
    if (grip && event.pointerType !== 'mouse') {
      begin(key, event.clientX, event.clientY, event.currentTarget);
    } else {
      press.current = { key, x: event.clientX, y: event.clientY, el: event.currentTarget };
    }
  };
  const onMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (drag) {
      follow(drag.key, event.clientX, event.clientY);
      return;
    }
    const held = press.current;
    if (held && Math.hypot(event.clientX - held.x, event.clientY - held.y) > DRAG_AFTER) {
      begin(held.key, event.clientX, event.clientY, held.el);
      press.current = null;
    }
  };
  const onUp = () => {
    press.current = null;
    host.current?.classList.remove(GRABBING);
    setDrag(null);
  };

  const save = useMutation({
    // Saved, then the Overview read again before the sheet closes, so it
    // closes onto the new cards (Save spins meanwhile).
    mutationFn: async () => {
      await apiSend<{ cards: string[] }>('/staff/overview/cards', 'PUT', { cards });
      await queryClient.invalidateQueries({ queryKey: staffKeys.overview });
    },
    onSuccess: () => {
      toast.success(cards.length ? 'Your cards are saved.' : 'My overview is empty again.');
      onSaved();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Sheet title="Customize my overview" onClose={onClose}>
      <Stack gap={8}>
        <section>
          <h3 className={styles.sheetHeading}>Your cards</h3>
          {cards.length === 0 ? (
            <p className={styles.lead}>None yet. Tick the cards you want below.</p>
          ) : (
            <>
              <p className={styles.lead}>Drag a card to change where it shows.</p>
              <ol className={styles.order}>
                {cards.map((key, n) => (
                  <li
                    key={key}
                    ref={(tile) => {
                      if (tile) tiles.current.set(key, tile);
                      else tiles.current.delete(key);
                    }}
                    className={[styles.orderTile, drag?.key === key ? styles.orderSlot : ''].filter(Boolean).join(' ')}
                    onPointerDown={onDown(key, false)}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                  >
                    <button
                      type="button"
                      className={styles.grip}
                      aria-label={`Move ${labelOf(key)}, now number ${n + 1} of ${cards.length}`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        onDown(key, true)(event);
                      }}
                      onPointerMove={onMove}
                      onPointerUp={onUp}
                      onPointerCancel={onUp}
                      onKeyDown={(event) => {
                        // Two to a row: left and right step one, up and down a row.
                        const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 }[event.key];
                        if (step) {
                          event.preventDefault();
                          move(key, n + step);
                        }
                      }}
                    >
                      <Grip />
                    </button>
                    <span className={styles.orderNumber}>{n + 1}</span>
                    <span className={styles.orderLabel}>{labelOf(key)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>

        {groups.map((group) => (
          <section key={group}>
            <h3 className={styles.sheetHeading}>{group}</h3>
            <div className={styles.choiceGrid}>
              {choices
                .filter((choice) => choice.section === group)
                .map((choice) => {
                  const on = cards.includes(choice.key);
                  return (
                    <label
                      key={choice.key}
                      htmlFor={`${ids}${choice.key}`}
                      className={[styles.choice, on ? styles.choiceOn : ''].filter(Boolean).join(' ')}
                    >
                      <input
                        id={`${ids}${choice.key}`}
                        type="checkbox"
                        className={styles.choiceBox}
                        checked={on}
                        onChange={(event) =>
                          setCards((now) =>
                            event.target.checked ? [...now, choice.key] : now.filter((each) => each !== choice.key),
                          )
                        }
                      />
                      <span>{choice.label}</span>
                    </label>
                  );
                })}
            </div>
          </section>
        ))}

        <Stack gap={4}>
          <Button size="lg" block disabled={!changed} loading={save.isPending} onClick={() => save.mutate()}>
            Save
          </Button>
          <Button variant="secondary" size="lg" block onClick={onClose}>
            Cancel
          </Button>
        </Stack>
      </Stack>

      {/* The faded copy that follows the pointer, in the dialog itself, over
          the sheet (whose own parts move, so a copy in them would be
          thrown off). */}
      {drag && host.current
        ? createPortal(
            <div
              className={[styles.orderTile, styles.orderGhost].join(' ')}
              style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.width, height: drag.height }}
              aria-hidden
            >
              <span className={styles.grip}>
                <Grip />
              </span>
              <span className={styles.orderNumber}>{cards.indexOf(drag.key) + 1}</span>
              <span className={styles.orderLabel}>{labelOf(drag.key)}</span>
            </div>,
            host.current,
          )
        : null}
    </Sheet>
  );
}
