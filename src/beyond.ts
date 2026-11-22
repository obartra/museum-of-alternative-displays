// The hall carried on past the frame of a piece. A small canvas lies behind the page around the stage, faint and out
// of focus, and the stage draws the rest of the room into it (Stage.beyond). Turning the piece then moves the light
// of the room across the whole page. Low power, at the foot of every page, turns it off.
import type { Stage } from './three/stage';

const KEY = 'calm';
/** Low power, as the visitor set it at the foot of a page: no room behind the page, and a model waits to be asked for. */
export const calm = (): boolean => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export function setCalm(on: boolean): void { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* a browser that keeps nothing */ } }

/**
 * Whether to carry the room on behind the page. Not in low power, not for a visitor who asks for less motion or is
 * saving data, and not where the browser draws in software (`software`). `?surround=1` and `?surround=0` in the
 * address override all of that, to compare the two.
 */
export function wantsBeyond(software: boolean): boolean {
  const asked = new URLSearchParams(location.search).get('surround');
  if (asked === '1' || asked === '0') return asked === '1';
  return !software && !calm() && !matchMedia('(prefers-reduced-motion: reduce)').matches
    && !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
}

/** Lay the canvas behind the page around the frame and have the stage draw into it. Returns how to take it away. */
export function spread(stage: Stage, frame: HTMLElement): () => void {
  const cv = document.createElement('canvas');
  cv.className = 'beyond'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const place = () => {
    const r = frame.getBoundingClientRect(), top0 = r.top + scrollY;
    // as far above and below the frame as fills a window with the frame in its middle, and a little more
    const extra = Math.max(160, (innerHeight - r.height) / 2 + 120);
    const top = Math.max(0, top0 - extra), bottom = top0 + r.height + extra;
    cv.style.top = `${top}px`; cv.style.height = `${bottom - top}px`;
    // a fifth of the size each way: it is seen out of focus, and costs the graphics card a twenty-fifth of the page
    const w = Math.max(32, Math.round(document.documentElement.clientWidth / 5)), h = Math.max(32, Math.round((bottom - top) / 5));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    stage.beyond(cv);
  };
  place();
  const ro = new ResizeObserver(place);
  ro.observe(document.body);
  requestAnimationFrame(() => cv.classList.add('is-on'));
  return () => { ro.disconnect(); stage.beyond(); cv.remove(); };
}
