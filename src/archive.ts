import { media, type Media } from './data/media';
import { pieces } from './data/pieces';
import { esc } from './html';
import { comma, said, standIn, t, tx } from './i18n';

/**
 * "From the archive": real photographs, drawings and short films beside the model, each with its credit.
 * A row of mounted pictures on the piece page, and a viewer that shows one large with its full record.
 */

/** "Photograph, 1936" or "Film, 12 seconds, silent, 2019": what kind of thing it is, as an archive card would put it. */
const kindLine = (m: Media) => [t(`archive.kind.${m.kind}`), m.kind === 'film' ? t('archive.film.length', { n: Math.round(m.seconds) }) : '', m.year ?? ''].filter(Boolean).join(comma());
const licence = (m: Media) => (m.credit.licenceUrl ? `<a href="${esc(m.credit.licenceUrl)}" rel="noopener license">${esc(m.credit.licence)}</a>` : esc(m.credit.licence));
/** The small picture for the row. A film is shown by one frame of it. */
const small = (m: Media) => (m.kind === 'film' ? m.poster.replace(/-poster\.webp$/, '-poster-480.webp') : m.small);

/** The archive pictures of a piece, with their words in the language in use. */
export const archiveOf = (pieceId: string): Media[] => (media[pieceId] ?? []).map((m) => said.media(pieceId, m));

export function archiveSection(pieceId: string): string {
  const list = archiveOf(pieceId);
  if (!list.length) return '';
  const mount = (m: Media, i: number) => `<li class="mount">
  <button type="button" class="mount__open" data-media="${i}"><span class="vh">${tx(m.kind === 'film' ? 'archive.playFilm' : 'archive.enlarge')}. </span><img src="${esc(small(m))}" alt="${esc(m.alt)}"${standIn.media(pieceId, m.id)} width="${m.width}" height="${m.height}" loading="lazy" decoding="async">${m.kind === 'film' ? `<span class="mount__play" aria-hidden="true">${tx('archive.film.badge', { n: Math.round(m.seconds) })}</span>` : ''}</button>
  <p class="mount__kind">${esc(kindLine(m))}</p>
  <p class="mount__cap"${standIn.media(pieceId, m.id)}>${esc(m.caption)}</p>
  <p class="mount__credit">${esc(m.credit.author)}${comma()}${licence(m)}</p>
</li>`;
  return `<section class="archive stack" style="--gap: 12px" aria-labelledby="archive-h">
  <h2 class="h-sec" id="archive-h">${tx('archive.title')}</h2>
  <ul class="archive__row${list.length === 1 ? ' archive__row--one' : ''}">${list.map(mount).join('')}</ul>
</section>`;
}

/** Make the mounts in `root` open the viewer. Returns what to call when the page is left. */
export function wireArchive(root: HTMLElement, pieceId: string, pieceName: string): () => void {
  const list = archiveOf(pieceId);
  if (!list.length) return () => undefined;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dialog = document.createElement('dialog');
  dialog.className = 'viewer';
  dialog.setAttribute('aria-label', t('archive.viewer', { name: pieceName }));
  document.body.append(dialog);
  let at = 0, opener: HTMLElement | null = null, pushed = false;

  const show = (i: number) => {
    at = (i + list.length) % list.length;
    const m = list[at];
    const en = standIn.media(pieceId, m.id);
    const picture = m.kind === 'film'
      ? `<video class="viewer__film" controls muted loop playsinline preload="metadata" poster="${esc(m.poster)}" width="${m.width}" height="${m.height}" aria-label="${esc(m.alt)}"${en}${calm ? '' : ' autoplay'}><source src="${esc(m.webm)}" type="video/webm"><source src="${esc(m.mp4)}" type="video/mp4"></video>`
      : `<img src="${esc(m.large)}" alt="${esc(m.alt)}"${en} width="${m.width}" height="${m.height}" decoding="async">`;
    const row = (k: string, v: string) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
    dialog.innerHTML = `
<div class="viewer__media">${picture}</div>
<div class="viewer__side">
  <div class="viewer__head"><p class="viewer__kind">${esc(kindLine(m))}</p><button type="button" class="btn" data-v="close" autofocus>${tx('stage.close')}</button></div>
  <p class="viewer__cap"${en}>${esc(m.caption)}</p>
  <dl class="card">
    ${row(tx('archive.madeBy'), esc(m.credit.author))}
    ${row(tx('archive.licence'), licence(m))}
    ${row(tx('archive.source'), `<a href="${esc(m.credit.source)}" rel="noopener">${esc(m.credit.title)}</a>${comma()}${esc(m.credit.archive ?? t('archive.commons'))}`)}
    ${row(tx('archive.changes'), `<span${en}>${esc(m.credit.changes)}</span>`)}
  </dl>
  ${list.length > 1 ? `<div class="viewer__nav"><button type="button" class="btn" data-v="prev">${tx('archive.previous')}</button><span aria-live="polite">${tx('archive.of', { n: at + 1, total: list.length })}</span><button type="button" class="btn" data-v="next">${tx('archive.next')}</button></div>` : ''}
</div>`;
  };
  const shut = () => {
    if (!dialog.open) return;
    dialog.close();
    dialog.innerHTML = '';
    document.body.style.overflow = '';
    opener?.focus();
  };
  /** Close, by way of the browser's history when the viewer put an entry there, so that Back and Close agree. */
  const close = () => { if (pushed) history.back(); else shut(); };
  const onPop = () => { pushed = false; shut(); };
  const onClick = (e: Event) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-media]');
    if (!el) return;
    opener = el;
    show(Number(el.dataset.media));
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    // one step in the history, so the back button of a phone closes the picture and not the page
    try { history.pushState({ viewer: true }, ''); pushed = true; } catch { pushed = false; }
  };
  const step = (by: number) => {
    const focus = dialog.querySelector<HTMLElement>(by < 0 ? '[data-v="prev"]' : '[data-v="next"]') ? (by < 0 ? 'prev' : 'next') : 'close';
    show(at + by);
    dialog.querySelector<HTMLElement>(`[data-v="${focus}"]`)?.focus();
  };
  dialog.addEventListener('click', (e) => {
    const v = (e.target as HTMLElement).closest<HTMLElement>('[data-v]')?.dataset.v;
    // the bare ground round the picture closes it too, as people expect of an enlarged picture
    if (v === 'close' || (e.target as HTMLElement).classList.contains('viewer__media')) close();
    if (v === 'prev') step(-1);
    if (v === 'next') step(1);
  });
  // a sideways swipe on the picture turns to the next one. A film keeps its own gestures
  let x0 = 0, y0 = 0;
  dialog.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; }, { passive: true });
  dialog.addEventListener('touchend', (e) => {
    const on = e.target as HTMLElement;
    if (list.length < 2 || !on.closest('.viewer__media') || on.tagName === 'VIDEO') return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  }, { passive: true });
  dialog.addEventListener('keydown', (e) => {
    if (list.length < 2 || (e.target as HTMLElement).tagName === 'VIDEO') return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  // Escape closes a dialog by itself: route it through the same door
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  root.addEventListener('click', onClick);
  window.addEventListener('popstate', onPop);
  return () => {
    root.removeEventListener('click', onClick);
    window.removeEventListener('popstate', onPop);
    if (dialog.open) { dialog.close(); document.body.style.overflow = ''; }
    dialog.remove();
  };
}

/** Every archive picture in the museum with its full credit, for the about page. */
export function creditsList(): string {
  const rows: string[] = [];
  for (const p of pieces) for (const m of archiveOf(p.id)) {
    rows.push(`<li><a href="#piece-${p.id}">${esc(said.piece(p).name)}</a>: <a href="${esc(m.credit.source)}" rel="noopener">${esc(m.credit.title)}</a>${comma()}${tx('archive.by', { author: m.credit.author })}. ${esc(m.credit.archive ?? t('archive.commons'))}. ${licence(m)}. ${esc(m.credit.changes)}.</li>`);
  }
  return rows.length ? `<ul class="credits">${rows.join('')}</ul>` : '';
}

export const archiveCount = (): number => Object.values(media).reduce((n, list) => n + list.length, 0);
