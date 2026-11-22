import audio from './data/tour-audio.json';
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
type Recorded = Record<string, Record<string, Record<string, { file: string; mark: string }>>>;

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
 * The address of a tour in the halls, at one of its parts: `#tour-women`, `#tour-women-microled`.
 * The opening words have the plain address.
 */
export const tourHash = (tour: Tour, partId = 'start'): string => `#tour-${tour.id}${partId === 'start' ? '' : `-${partId}`}`;
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
/** The recording of one part in the language in use, as a whole address, or nothing. */
export function clipOf(tour: Tour, partId: string): string {
  const part = said.tour(tour)?.parts[partId], src = part ? recording(tour, partId, part.text) : '';
  return src ? new URL(src, document.baseURI).href : '';
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
  const src = recording(tour, partId, part.text);
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
  <div class="hallhead"><h1 class="plate" style="--hall: var(--ink); --hall-ink: var(--wash)"><span class="plate__title" style="padding: 6px 14px 2px">${esc(told.title)}</span></h1><p class="lead">${esc(told.lead)}</p></div>
  <p class="ways"><a class="btn btn--go" href="${tourHash(tour)}">${tx('tour.follow')}</a></p>
  <ol class="tour">${tour.parts.map((part) => `<li class="tour__part" id="part-${part.id}">${partHtml(tour, part.id)}</li>`).join('')}</ol>
</div>`;
}

/** Remember the trail of a link that leads into the walk, so that the walk opens on it. */
export function keepTrail(ev: Event): void {
  const id = (ev.target as HTMLElement).closest<HTMLElement>('[data-trail]')?.dataset.trail;
  try { if (id) localStorage.setItem('trail', id); } catch { /* the walk opens without it */ }
}
