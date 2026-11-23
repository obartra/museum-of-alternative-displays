// The few signs the museum uses in place of a word, on keys that sit on a picture: daylight, full view, glasses.
// Each key that carries one also carries its word, as a label for a screen reader and as a tip under the pointer.
const sign = (d: string, kind = ''): string => `<svg class="ico${kind ? ` ico--${kind}` : ''}" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const SUN = sign('<circle cx="10" cy="10" r="3.6"/><path d="M10 1.6v2.3M10 16.1v2.3M1.6 10h2.3M16.1 10h2.3M4.1 4.1l1.6 1.6M14.3 14.3l1.6 1.6M4.1 15.9l1.6-1.6M14.3 5.7l1.6-1.6"/>', 'day');
const MOON = sign('<path d="M16.6 12.1A7 7 0 0 1 7.9 3.4a7 7 0 1 0 8.7 8.7Z"/>', 'night');
const OPEN = sign('<path d="M7.6 2.6h-5v5M12.4 2.6h5v5M7.6 17.4h-5v-5M12.4 17.4h5v-5"/>', 'open');
const SHUT = sign('<path d="M4.6 4.6l10.8 10.8M15.4 4.6L4.6 15.4"/>', 'shut');
const EYE = sign('<path d="M1.8 10s3-5.6 8.2-5.6S18.2 10 18.2 10s-3 5.6-8.2 5.6S1.8 10 1.8 10Z"/><circle cx="10" cy="10" r="2.6"/>');

/** Picture only: the key that clears the picture of every control, and says whether it has. */
export const bareKey = (attr: string, word: string): string =>
  `<button type="button" class="btn btn--icon" ${attr} aria-pressed="false" aria-label="${word}" title="${word} (H)">${EYE}</button>`;
export const GLASSES = sign('<path d="M2 7.6h16v4.4a1.7 1.7 0 0 1-1.7 1.7h-3a1.7 1.7 0 0 1-1.6-1.1L11 10.8H9l-.7 1.8a1.7 1.7 0 0 1-1.6 1.1h-3A1.7 1.7 0 0 1 2 12Z"/><path d="M2 7.6l2.2-3M18 7.6l-2.2-3"/>');

/** The daylight switch as one key: a sun while the daylight is on, a moon while it is off. It works as every daylight switch does. */
export const daylightKey = (on: boolean, word: string): string =>
  `<button type="button" class="btn btn--icon" role="switch" aria-checked="${on}" data-lights-switch aria-label="${word}" title="${word}">${SUN}${MOON}</button>`;

/** The key that opens the full view. `attr` is what the page finds it by. In full view it shows a cross: see nameFullKey. */
export const fullKey = (attr: string, word: string): string =>
  `<button type="button" class="btn btn--icon" ${attr} aria-label="${word}" title="${word}">${OPEN}${SHUT}</button>`;

/** Say on the key what it does now: open the full view, or close it. */
export function nameFullKey(key: HTMLElement, full: boolean, word: string): void {
  key.setAttribute('aria-label', word); key.title = word;
  key.classList.toggle('is-shut', full);
}
