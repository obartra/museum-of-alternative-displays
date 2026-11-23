import { t } from './i18n';

/**
 * Picture only. One key clears everything off a 3D picture, and in full view the bands round it as well, so that only
 * the piece or the hall is left. Dragging, pinching and scrolling still turn and zoom. A tap or a click on the
 * picture, Escape, Space or Enter brings everything back, and so does H, which also clears it from the keyboard.
 * Whoever owns the picture can bring the controls back by itself, as a tour does when a stop has been told.
 */
export interface Bare {
  readonly on: boolean;
  set(on: boolean): void;
  close(): void;
}
export interface BareOptions {
  /** What is cleared: it carries the class is-bare. */
  root: HTMLElement;
  /** Where the line that says how to come back is shown for a moment. */
  hint: HTMLElement;
  /** The keys that switch it, which say whether it is on. */
  keys(): HTMLElement[];
  /** Where the focus goes when the key that had it is cleared away. */
  canvas(): HTMLElement | null;
  /** The picture is on screen and the keyboard may switch it. */
  active(): boolean;
  /** Bring the picture into the window, where the key that cleared it lies outside it. */
  show?(): void;
}

const EDITABLE = 'input, select, textarea, [contenteditable="true"], dialog[open] *';

export function openBare(o: BareOptions): Bare {
  let on = false, fade = 0;
  const say = () => {
    o.hint.textContent = t('stage.clear.back');
    o.hint.classList.add('is-shown');
    window.clearTimeout(fade);
    fade = window.setTimeout(() => o.hint.classList.remove('is-shown'), 2200);
  };
  const set = (to: boolean) => {
    if (to === on) return;
    on = to;
    o.root.classList.toggle('is-bare', on);
    for (const k of o.keys()) k.setAttribute('aria-pressed', String(on));
    if (on) {
      o.show?.();
      say();
      // the key itself may now be out of sight: the keyboard goes on with the picture
      const a = document.activeElement as HTMLElement | null;
      if (a && o.root.contains(a) && !a.checkVisibility?.()) o.canvas()?.focus({ preventScroll: true });
    } else {
      window.clearTimeout(fade);
      o.hint.classList.remove('is-shown');
    }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !o.active()) return;
    const inField = (e.target as Element | null)?.closest?.(EDITABLE);
    if (inField) return;
    const k = e.key;
    // Escape anywhere. Space and Enter only where they would do nothing else: on the picture or the page itself,
    // not on a link or a key, which keep their own work
    const t = e.target as HTMLElement | null, bare = !t || t === document.body || t.tagName === 'CANVAS' || t.tagName === 'MAIN';
    if (on && (k === 'Escape' || ((k === ' ' || k === 'Enter') && bare))) { e.preventDefault(); e.stopImmediatePropagation(); set(false); return; }
    if ((k === 'h' || k === 'H') && !e.repeat) { e.preventDefault(); set(!on); }
  };
  window.addEventListener('keydown', onKey, true);
  return {
    get on() { return on; },
    set,
    close() { window.removeEventListener('keydown', onKey, true); window.clearTimeout(fade); },
  };
}

/** Call `fn` on a tap or a click on `el` that did not move: a drag, a pinch or a long press is not one. */
export function onTap(el: HTMLElement, fn: (e: PointerEvent) => void): () => void {
  let x = 0, y = 0, t0 = 0, id = -1, many = false;
  const down = (e: PointerEvent) => { if (id !== -1) { many = true; return; } id = e.pointerId; x = e.clientX; y = e.clientY; t0 = performance.now(); many = false; };
  const up = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = -1;
    if (!many && Math.hypot(e.clientX - x, e.clientY - y) < 8 && performance.now() - t0 < 500) fn(e);
  };
  const cancel = (e: PointerEvent) => { if (e.pointerId === id) id = -1; };
  el.addEventListener('pointerdown', down, true);
  el.addEventListener('pointerup', up, true);
  el.addEventListener('pointercancel', cancel, true);
  return () => { el.removeEventListener('pointerdown', down, true); el.removeEventListener('pointerup', up, true); el.removeEventListener('pointercancel', cancel, true); };
}
