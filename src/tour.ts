import audio from './data/tour-audio.json';
import { pieceById } from './data/pieces';
import { mark, spoken, tourStops, tours, type Tour } from './data/tours';
import { esc } from './html';
import { langNow, said, tx } from './i18n';

/**
 * The guided tours on the page. A tour is offered only in a language that tells all of it. Its words are always
 * shown. A recording is offered beside them where one was made from those very words, and nothing plays by itself.
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
 * One part of a tour: where it is told, its title, the recording if there is one, and what the guide says.
 * `fold` tucks the words away under a line to open, for the walk, where the hall is the thing to look at.
 */
export function partHtml(tour: Tour, partId: string, o: { heading: 'h2' | 'h3'; fold?: boolean; open?: boolean; walk?: boolean }): string {
  const told = said.tour(tour), part = told?.parts[partId];
  if (!told || !part) return '';
  const stops = tourStops(tour), n = stops.findIndex((s) => s.id === partId) + 1, piece = n ? pieceById(partId) : undefined;
  const src = recording(tour, partId, part.text);
  const words = part.text.map((p) => `<p>${esc(p)}</p>`).join('');
  const place = piece ? `<p class="tour__at"><a href="#piece-${piece.id}">${tx('tour.at', { piece: said.piece(piece).name, n: piece.hall })}</a>${o.walk ? '' : ` <a class="tour__see" href="#walk-${piece.id}" data-trail="${tour.id}">${tx('walk.piece')}</a>`}</p>` : '';
  return `${n ? `<p class="tour__no">${tx('tour.stop', { n, total: stops.length })}</p>` : ''}<${o.heading} class="tour__title">${esc(part.title)}</${o.heading}>${place}`
    + (src ? `<audio class="tour__audio" controls preload="none" src="${esc(src)}" aria-label="${tx('tour.listen')}: ${esc(part.title)}"></audio>` : '')
    + (o.fold ? `<details class="tour__words"${o.open ? ' open' : ''}><summary>${tx('tour.words')}</summary>${words}</details>` : `<div class="tour__words">${words}</div>`);
}

/** A whole tour on one page, to read or to hear from beginning to end. */
export function tourPageHtml(tour: Tour): string {
  const told = said.tour(tour)!, first = tourStops(tour)[0]?.id ?? '';
  return `
<div class="stack">
  <div class="hallhead"><h1 class="plate" style="--hall: var(--ink); --hall-ink: var(--wash)"><span class="plate__title" style="padding: 6px 14px 2px">${esc(told.title)}</span></h1><p class="lead">${esc(told.lead)}</p></div>
  <p class="ways"><a class="btn btn--go" href="#walk-${first}" data-trail="${tour.id}">${tx('tour.follow')}</a></p>
  <ol class="tour">${tour.parts.map((part) => `<li class="tour__part" id="tour-${part.id}">${partHtml(tour, part.id, { heading: 'h2' })}</li>`).join('')}</ol>
</div>`;
}

/** Remember the trail of a link that leads into the walk, so that the walk opens on it. */
export function keepTrail(ev: Event): void {
  const id = (ev.target as HTMLElement).closest<HTMLElement>('[data-trail]')?.dataset.trail;
  try { if (id) localStorage.setItem('trail', id); } catch { /* the walk opens without it */ }
}
