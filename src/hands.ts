/**
 * On a page with a 3D picture, what a hand or a key does goes to the picture unless something else on the page has a
 * use for it. Two things serve that. A key pressed anywhere is the picture's when no field, list or dialog wants it.
 * And a press that began on the still picture, before the model was there to feel it, is handed to the model when it
 * comes up, so that the drag that woke it also turns it.
 */

/** A press that is still down: as much of it as a picture needs to take it over. */
export interface Held { pointerId: number; pointerType: string; clientX: number; clientY: number }

/** Where keys have work of their own. `data-own-keys` marks a part of the page that reads them itself, as the list of languages reads letters. */
const WANTS_KEYS = 'input, select, textarea, audio, video, [contenteditable]:not([contenteditable="false"]), [role="menu"], [role="listbox"], [role="slider"], [role="radiogroup"], [role="tablist"], [data-own-keys]';

/**
 * Whether a key already has work to do where it was pressed: with a modifier, in a field or a list, under an open
 * dialog, or, for Shift and an arrow, on words the visitor has marked, which that key marks further.
 */
export function keyTaken(e: KeyboardEvent): boolean {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return true;
  if (e.shiftKey && e.key.startsWith('Arrow') && getSelection()?.isCollapsed === false) return true;
  const el = e.target instanceof Element ? e.target : null;
  return !!el?.closest(WANTS_KEYS) || !!document.querySelector('dialog[open]');
}

/** Whether something between `from` and the page itself scrolls the way this arrow points: a row of keys, a column of words. */
function scrollsNear(from: Node | null, upDown: boolean): boolean {
  for (let el = from instanceof Element ? from : from?.parentElement ?? null; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    const cs = getComputedStyle(el), how = upDown ? cs.overflowY : cs.overflowX;
    if ((how === 'auto' || how === 'scroll') && (upDown ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1)) return true;
  }
  return false;
}
/**
 * Whether an arrow key belongs to the page and not to the picture, because it scrolls something. While the picture
 * has the focus (`focused`) every arrow is its own. Without it, a part of the page that scrolls keeps its arrows
 * when the key is pressed in it, or, with the focus on nothing, when the visitor last clicked in it, which is where
 * a browser scrolls. And the arrows are the page's as far as the page itself moves: up and down where it scrolls,
 * left and right where it is wider than the window, and all four where it has been pinched larger.
 */
export function arrowScrolls(e: KeyboardEvent, focused: boolean): boolean {
  if (focused || !e.key.startsWith('Arrow')) return false;
  const upDown = e.key === 'ArrowUp' || e.key === 'ArrowDown';
  const from = e.target === document.body || !(e.target instanceof Node) ? getSelection()?.anchorNode ?? null : e.target;
  if (scrollsNear(from, upDown)) return true;
  if ((window.visualViewport?.scale ?? 1) > 1.01) return true;
  const el = document.scrollingElement, body = getComputedStyle(document.body);
  if (!el) return false;
  return upDown ? el.scrollHeight > el.clientHeight + 1 && body.overflowY !== 'hidden' : el.scrollWidth > el.clientWidth + 1 && body.overflowX !== 'hidden';
}
/** Whether any of `el` is in the window. */
export const inWindow = (el: Element): boolean => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
};

/**
 * Follow a press on `el` for as long as it is held. `swipe` is called once when a finger has plainly begun to drag
 * sideways, which on a still picture is a wish to turn what it shows. `skip` leaves a press alone, as one on a button.
 */
export function pressOn(el: HTMLElement, o: { skip?: (e: PointerEvent) => boolean; swipe?: (e: PointerEvent) => void } = {}): { held(): Held | undefined; close(): void } {
  let h: Held | undefined, x0 = 0, y0 = 0, swiped = false;
  const down = (e: PointerEvent) => {
    // a press the page made up to hand a drag on is not a new one
    if (!e.isTrusted || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0) || o.skip?.(e)) return;
    h = { pointerId: e.pointerId, pointerType: e.pointerType, clientX: e.clientX, clientY: e.clientY };
    x0 = e.clientX; y0 = e.clientY; swiped = false;
  };
  // Another pointer coming down ends it. A second finger makes it a pinch, which is the page's and not a drag. And a
  // new first finger means the one that was followed has gone, even if nothing said so.
  const other = (e: PointerEvent) => { if (h && e.isTrusted && e.pointerId !== h.pointerId) h = undefined; };
  const move = (e: PointerEvent) => {
    if (!h || e.pointerId !== h.pointerId) return;
    // a mouse that moves with no button down was let go where nothing told us: there is no press left to hand on
    if (e.pointerType === 'mouse' && !(e.buttons & 1)) { h = undefined; return; }
    h.clientX = e.clientX; h.clientY = e.clientY;
    const dx = Math.abs(e.clientX - x0), dy = Math.abs(e.clientY - y0);
    if (!swiped && e.pointerType === 'touch' && dx > 10 && dx > dy * 1.5) { swiped = true; o.swipe?.(e); }
  };
  const up = (e: PointerEvent) => { if (h?.pointerId === e.pointerId) h = undefined; };
  const away = () => { h = undefined; };
  window.addEventListener('pointerdown', other, true);
  el.addEventListener('pointerdown', down);
  // the pointer may leave the picture while it is held: it is followed wherever it goes
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  // a menu that opens over the page swallows the release
  window.addEventListener('contextmenu', away);
  window.addEventListener('blur', away);
  return {
    held: () => h && { ...h },
    close() {
      h = undefined;
      window.removeEventListener('pointerdown', other, true);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('contextmenu', away);
      window.removeEventListener('blur', away);
    },
  };
}
