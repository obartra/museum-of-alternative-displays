import audio from './data/tour-audio.json';
import { captions, type Caption } from './data/captions';
import { pieceById } from './data/pieces';
import { mark, spoken, tourStops, tours, type Tour } from './data/tours';
import { esc } from './html';
import { langNow, said, tx } from './i18n';

/**
 * The guided tours on the page. A tour is offered only in a language that tells all of it. Its words are always
 * there to read. A recording is offered beside them where one was made from those very words. On the page of a
 * tour's words nothing plays by itself. In the walk the guide speaks when the visitor asks for a stop, and the
 * visitor can switch her voice off.
 */
type Recorded = Record<string, Record<string, Record<string, { file: string; mark: string; seconds?: number; cues?: number[]; rests?: number[] }>>>;

/** Whether this visitor has opened a tour that is not announced yet. Kept for the visit only. */
const previewing = (): boolean => { try { return sessionStorage.getItem('tour-preview') === '1'; } catch { return false; } };
export const preview = (): void => { try { sessionStorage.setItem('tour-preview', '1'); } catch { /* the page still opens */ } };
/** The tours that the language in use tells, and that are announced or have been opened by this visitor. */
export const toursNow = (): Tour[] => tours.filter((tour) => said.tour(tour) && (!tour.draft || previewing()));

/** The address of the recording of one part, if there is one for the words as they now stand. */
export function recording(tour: Tour, partId: string, text: string[]): string {
  const code = langNow().code, kept = (audio as Recorded)[tour.id]?.[code]?.[partId];
  return kept && kept.mark === mark(spoken(text)) ? `./tour/${tour.id}/${code}/${kept.file}` : '';
}

/**
 * How long the guide speaks for the whole of a tour in the language in use, in minutes. Nothing, unless every part
 * has a recording of the words as they now stand.
 */
export function spokenMinutes(tour: Tour): number {
  const own = said.tour(tour), kept = (audio as Recorded)[tour.id]?.[langNow().code];
  if (!own || !kept) return 0;
  let seconds = 0;
  for (const part of tour.parts) {
    const k = kept[part.id];
    if (!k || !k.seconds || k.mark !== mark(spoken(own.parts[part.id].text))) return 0;
    seconds += k.seconds;
  }
  return Math.max(1, Math.round(seconds / 60));
}

/**
 * The address of a tour in the halls, at one of its parts: `#tour-women`, `#tour-women-microled`.
 * The opening words have the plain address.
 */
export const tourHash = (tour: Tour, partId = 'start'): string => `#tour-${tour.id}${partId === 'start' ? '' : `-${partId}`}`;
/**
 * In full view the address of a tour stays as it was when the visitor entered, so that the step back out lands on
 * the same page. A phone tours in full view, and a reload there would begin the tour again. So the stop is also
 * kept for the visit, and a page that is loaded again at the tour's own address goes on at that stop.
 */
export const keepStop = (tour: Tour, partId: string): void => { try { sessionStorage.setItem('tour-at', tourHash(tour, partId)); } catch { /* a reload begins again */ } };
export function resumed(to: { tour: Tour; part: string }): { tour: Tour; part: string } {
  if (to.part !== 'start') return to;
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const kept = sessionStorage.getItem('tour-at') ?? '';
    if (nav?.type !== 'reload' || again) return to;
    again = true;                                   // once: after that, the tour's own address means its beginning
    return tourAt(kept.slice(1))?.tour === to.tour ? tourAt(kept.slice(1))! : to;
  } catch { return to; }
}
let again = false;
/** The tour and the part that the name of an address stands for, if it stands for one. */
export function tourAt(name: string): { tour: Tour; part: string } | undefined {
  for (const tour of tours) {
    if (name === `tour-${tour.id}`) return { tour, part: 'start' };
    const part = name.startsWith(`tour-${tour.id}-`) ? name.slice(tour.id.length + 6) : '';
    if (part && tour.parts.some((p) => p.id === part)) return { tour, part };
  }
  return undefined;
}

// ---------- the guide's voice ----------

/**
 * One player for the whole site. A browser lets a page start a sound only from a click, and remembers that for
 * the player it was started on, so the same player says every part: the click that takes up a tour opens the way
 * for the stops that follow, also the ones the visitor walks to.
 */
let player: HTMLAudioElement | undefined;
export const voice = (): HTMLAudioElement => (player ??= Object.assign(new Audio(), { preload: 'metadata' }));
/** Whether the visitor wants to hear the guide. They do until they say otherwise, and it is kept between visits. */
export const wantsVoice = (): boolean => { try { return localStorage.getItem('guide-voice') !== 'off'; } catch { return true; } };
export const keepVoice = (on: boolean): void => { try { if (on) localStorage.removeItem('guide-voice'); else localStorage.setItem('guide-voice', 'off'); } catch { /* it holds for this visit */ } };
/** Whether the visitor wants to read what the guide says while she says it. They do not until they ask, and it is kept between visits. */
export const wantsCaptions = (): boolean => { try { return localStorage.getItem('guide-captions') === 'on'; } catch { return false; } };
export const keepCaptions = (on: boolean): void => { try { if (on) localStorage.setItem('guide-captions', 'on'); else localStorage.removeItem('guide-captions'); } catch { /* it holds for this visit */ } };
/** The captions of the parts already asked for, with the time each begins and the time each paragraph ends. */
const timed = new Map<string, { lines: Caption[]; cues: number[]; rests: number[] } | null>();
/**
 * What the guide is saying at a moment of a part's recording, in seconds from its start: one caption, or nothing in
 * the silences she leaves between paragraphs. Nothing either where the recording has no times, or was made from
 * other words than the ones now shown.
 */
export function captionAt(tour: Tour, partId: string, at: number): string {
  const code = langNow().code, key = `${tour.id}/${code}/${partId}`;
  let own = timed.get(key);
  if (own === undefined) {
    const part = said.tour(tour)?.parts[partId], kept = (audio as Recorded)[tour.id]?.[code]?.[partId];
    const lines = part ? captions(part.text) : [];
    own = part && kept?.cues && kept.mark === mark(spoken(part.text)) && kept.cues.length === lines.length ? { lines, cues: kept.cues, rests: kept.rests ?? [] } : null;
    timed.set(key, own);
  }
  if (!own) return '';
  let i = -1;
  while (i + 1 < own.cues.length && own.cues[i + 1] <= at + 0.08) i++;
  if (i < 0) return '';
  // the last caption of a paragraph goes when she has finished the paragraph, and the next comes when she speaks again
  const last = i + 1 >= own.lines.length || own.lines[i + 1].p !== own.lines[i].p, rest = own.rests[own.lines[i].p];
  return last && rest !== undefined && at > rest + 0.3 ? '' : own.lines[i].text;
}
/** The recording of one part in the language in use, as a whole address, or nothing. */
export function clipOf(tour: Tour, partId: string): string {
  const part = said.tour(tour)?.parts[partId], src = part ? recording(tour, partId, part.text) : '';
  return src ? onDevice(new URL(src, document.baseURI).href) : '';
}

/**
 * The recordings a visitor has asked to keep on the device (`keep.ts`). The worker leaves sound to the network,
 * so a kept recording is handed to the player as an address of the copy itself, which needs no connection.
 * The copies are looked up when the page opens and again when more have been kept: a player must be given its
 * address in the same breath as the click that starts it, with no waiting in between.
 */
const copies = new Map<string, string>();
const onDevice = (url: string): string => copies.get(url) ?? url;
export async function findKept(): Promise<void> {
  try {
    if (!('caches' in window)) return;
    const name = `museum ${new URL('./', document.baseURI).pathname} sound`;
    if (!(await caches.has(name))) return;
    const store = await caches.open(name);
    for (const asked of await store.keys()) {
      if (copies.has(asked.url)) continue;
      const got = await store.match(asked);
      if (got) copies.set(asked.url, URL.createObjectURL(await got.blob()));
    }
  } catch { /* the recordings come from the network, as before */ }
}
/**
 * Have the guide say one part, from where she left off in it, or from its beginning if she had finished or was
 * saying another. Resolves to whether she is speaking: a browser may refuse a voice that no click asked for.
 */
export function speak(tour: Tour, partId: string): Promise<boolean> {
  const url = clipOf(tour, partId);
  if (!url) return Promise.resolve(false);
  const a = voice();
  if (a.src !== url) a.src = url; else if (a.ended) a.currentTime = 0;
  return a.play().then(() => true, () => false);
}
/**
 * Have the guide ready to say one part, without a sound: she is started and stopped in the same breath. Done in a
 * click, this is what lets her begin by herself a moment later, when the visitor has reached the stop.
 */
export function ready(tour: Tour, partId: string): void {
  const url = clipOf(tour, partId);
  if (!url) return;
  const a = voice();
  if (a.src !== url) a.src = url; else if (a.currentTime > 0) a.currentTime = 0;
  void a.play().catch(() => undefined);
  a.pause();
}
/** Stop the guide. */
export const hush = (): void => { player?.pause(); };

/** When a link into a tour was last followed. The walk starts by itself for a visitor who has just asked for the tour. */
let asked = -1e9;
export const justAsked = (): boolean => performance.now() - asked < 2500;
/**
 * A link into a tour was clicked. The opening words are said at once, while the hall opens. What is said at a stop
 * waits until the visitor stands there, and is only made ready. Either has to be done here, in the click: a phone
 * will not let a voice start once the click is over.
 */
export function greet(hash: string): void {
  const to = tourAt(hash.replace(/^#\/?/, ''));
  if (!to || !said.tour(to.tour)) return;
  asked = performance.now();
  if (!wantsVoice()) return;
  if (to.part === 'start') void speak(to.tour, to.part); else ready(to.tour, to.part);
}

/** One part of a tour on the page of its words: where it is told, its title, the recording if there is one, and what the guide says. */
export function partHtml(tour: Tour, partId: string): string {
  const told = said.tour(tour), part = told?.parts[partId];
  if (!told || !part) return '';
  const stops = tourStops(tour), n = stops.findIndex((s) => s.id === partId) + 1, piece = n ? pieceById(partId) : undefined;
  const at = recording(tour, partId, part.text), src = at ? onDevice(new URL(at, document.baseURI).href) : '';
  const place = piece ? `<p class="tour__at"><a href="#piece-${piece.id}">${tx('tour.at', { piece: said.piece(piece).name, n: piece.hall })}</a> <a class="tour__see" href="${tourHash(tour, piece.id)}">${tx('walk.piece')}</a></p>` : '';
  return `${n ? `<p class="tour__no">${tx('tour.stop', { n, total: stops.length })}</p>` : ''}<h2 class="tour__title">${esc(part.title)}</h2>${place}`
    + (src ? `<audio class="tour__audio" controls preload="none" src="${esc(src)}" aria-label="${tx('tour.listen')}: ${esc(part.title)}"></audio>` : '')
    + `<div class="tour__words">${part.text.map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
}

/** The words of a whole tour on one page, to read or to hear from beginning to end. */
export function tourPageHtml(tour: Tour): string {
  const told = said.tour(tour)!;
  return `
<div class="stack">
  <div class="pagehead"><h1 class="title">${esc(told.title)}</h1><p class="lead">${esc(told.lead)}</p></div>
  <p class="ways"><a class="btn btn--go" href="${tourHash(tour)}">${tx('tour.follow')}</a></p>
  <ol class="tour">${tour.parts.map((part) => `<li class="tour__part" id="part-${part.id}">${partHtml(tour, part.id)}</li>`).join('')}</ol>
</div>`;
}

/** Remember the trail of a link that leads into the walk, so that the walk opens on it. */
export function keepTrail(ev: Event): void {
  const id = (ev.target as HTMLElement).closest<HTMLElement>('[data-trail]')?.dataset.trail;
  try { if (id) localStorage.setItem('trail', id); } catch { /* the walk opens without it */ }
}
