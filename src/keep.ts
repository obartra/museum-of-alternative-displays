import { tx } from './i18n';
import { findKept } from './tour';

/**
 * The whole museum on the device, when the visitor asks for it. The worker (`sw.ts`) keeps each picture a visitor
 * has seen. Here every picture is fetched at once, into the same store, so that every page opens without a
 * connection. The recordings of the guided tour are kept apart, a language at a time, in a store of their own:
 * a player asks for sound a part at a time, which the worker leaves to the network, so the page hands a kept
 * recording to the player itself (`tour.ts`). Archive films are not kept.
 *
 * The build writes the list of what there is into `offline.json`, with what it weighs (`vite.config.ts`).
 * The control is on the About page, and only where a worker stands behind the page: without one nothing kept
 * would be served.
 */
interface Offline { pictures: string[]; bytes: number; sound: Record<string, Record<string, { files: string[]; bytes: number }>> }

/** The address of the museum, down to its last slash, and the stores as `sw.ts` names them. */
const HOME = new URL('./', document.baseURI).href;
const MINE = `museum ${new URL(HOME).pathname} `, PICTURES = `${MINE}pictures`, SOUND = `${MINE}sound`;

let list: Promise<Offline | undefined> | undefined;
const offline = (): Promise<Offline | undefined> => (list ??= fetch(`${HOME}offline.json`, { cache: 'no-cache' }).then((got) => (got.ok ? (got.json() as Promise<Offline>) : undefined)).catch(() => { list = undefined; return undefined; }));
const worked = (): boolean => 'caches' in window && !!(navigator.serviceWorker as ServiceWorkerContainer | undefined)?.controller;
const megabytes = (bytes: number): number => Math.max(1, Math.round(bytes / 1e6));
/** The recordings there are in the language in use, every tour together. */
const spokenHere = (all: Offline): { files: string[]; bytes: number } => {
  const lang = document.documentElement.lang.toLowerCase().split('-')[0], files: string[] = [];
  let bytes = 0;
  for (const tour of Object.values(all.sound)) { const own = tour[lang]; if (own) { files.push(...own.files); bytes += own.bytes; } }
  return { files, bytes };
};
/** Which of these addresses a store does not hold yet. */
async function missing(store: string, urls: string[]): Promise<string[]> {
  const have = new Set((await (await caches.open(store)).keys()).map((r) => r.url));
  return urls.filter((url) => !have.has(url));
}

/** The place on the About page. It is empty until the list of what can be kept has arrived, and stays so without a worker. */
export const keepHtml = (): string => '<div class="stack" style="--gap: 12px" data-keep hidden></div>';

let busy = false;
/** Fill the place in: what can be kept, what it weighs, and what is already here. */
export async function showKeep(): Promise<void> {
  const place = document.querySelector<HTMLElement>('[data-keep]');
  if (!place || !worked() || busy) return;
  const all = await offline();
  if (!all || !place.isConnected) return;
  const pictures = all.pictures.map((p) => HOME + p), sound = spokenHere(all), spoken = sound.files.map((p) => HOME + p);
  const [noPicture, noSound] = await Promise.all([missing(PICTURES, pictures), missing(SOUND, spoken)]);
  const row = (what: 'pictures' | 'sound', open: boolean, bytes: number) => open
    ? `<button type="button" class="btn" data-keep-go="${what}">${tx(`about.keep.${what}`, { mb: megabytes(bytes) })}</button>`
    : `<span class="kept">${tx(`about.keep.${what}.done`)}</span>`;
  place.innerHTML = `<h2 class="h-sec">${tx('about.keep')}</h2><p>${tx('about.keep.1')}</p>
<p class="ways">${row('pictures', noPicture.length > 0, all.bytes)}${spoken.length ? row('sound', noSound.length > 0, sound.bytes) : ''}</p>
<p class="small" data-keep-says role="status"></p>`;
  place.hidden = false;
}

/** Fetch what is missing, a few files at a time, and say how far it has come. */
async function keep(what: 'pictures' | 'sound'): Promise<void> {
  const all = await offline(), says = () => document.querySelector<HTMLElement>('[data-keep-says]');
  if (!all || busy) return;
  busy = true;
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-keep-go]')) b.disabled = true;
  // ask the browser not to clear these stores when the device runs short. It may say no, and nothing depends on it
  void navigator.storage?.persist?.().catch(() => undefined);
  const name = what === 'pictures' ? PICTURES : SOUND, wanted = (what === 'pictures' ? all.pictures : spokenHere(all).files).map((p) => HOME + p);
  let failed = 0, done = 0;
  try {
    const store = await caches.open(name), todo = await missing(name, wanted), of = todo.length;
    const say = () => { const el = says(); if (el) el.textContent = tx('about.keep.going', { n: done, of }); };
    say();
    const one = async (): Promise<void> => {
      for (let url = todo.pop(); url; url = todo.pop()) {
        try {
          const got = await fetch(url);
          if (got.status === 200) await store.put(url, got); else failed++;
        } catch { failed++; }
        done++;
        say();
      }
    };
    await Promise.all(Array.from({ length: 6 }, one));
    if (what === 'sound') {
      // a recording that has been made again has a new name: the old one is of no use to anybody
      const current = new Set(Object.values(all.sound).flatMap((tour) => Object.values(tour).flatMap((own) => own.files.map((p) => HOME + p))));
      for (const old of await store.keys()) if (!current.has(old.url)) await store.delete(old);
      await findKept();
    }
  } catch { failed = failed || 1; }
  busy = false;
  await showKeep();
  const el = says();
  if (el) el.textContent = failed ? tx('about.keep.failed', { n: failed }) : '';
}

/** Wire the control once. The About page calls `showKeep` each time it is drawn. */
export function wireKeep(): void {
  document.addEventListener('click', (e) => {
    const what = (e.target as Element).closest<HTMLElement>('[data-keep-go]')?.dataset.keepGo;
    if (what === 'pictures' || what === 'sound') void keep(what);
  });
  // a worker that takes over while the About page is open makes the offer possible
  (navigator.serviceWorker as ServiceWorkerContainer | undefined)?.addEventListener('controllerchange', () => { void showKeep(); });
}
