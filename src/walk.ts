import { halls } from './data/halls';
import { people } from './data/people';
import { trailById, trails } from './data/trails';
import type { Stand } from './data/tours';
import { openGuide } from './guide';
import { hush, tourHash, toursNow } from './tour';
import { pieceById, pieces } from './data/pieces';
import { comma, said, t, tx } from './i18n';
import * as plan from './three/walk/plan';

/**
 * Walk the museum: seven halls in a row, every piece on its block in the hall it belongs to, to stroll through
 * or jump across. This is the page round the picture: where the visitor is, what the hall they are in is about,
 * the plan of the building, the buttons that do what the keys do. The building itself, and the visitor in it,
 * live in `three/walk` and load only when the walk starts.
 * The address follows the visitor from piece to piece, so the back button of a piece's page returns to its block.
 *
 * A trail that has a guided tour in the language in use is walked as that tour: the band under the picture
 * (`guide.ts`) takes the place of the Next and Previous buttons, and the address is the tour's, at its stop.
 * In a tour the visitor is carried from stop to stop, so the picture is left to the piece: the words on how to
 * walk go after a few seconds, and under a finger the walking buttons fold behind one key.
 */
export interface WalkOptions {
  /** Piece to start in front of. Without one the walk starts at the door. */
  start?: string;
  /** Day or night, as the building's one switch stands. */
  lights: boolean;
  /** Start without being asked. Not where the picture would be drawn in software, or the visitor is saving data. */
  auto: boolean;
  /** The daylight switch, as the rest of the site draws it. */
  switchHtml: string;
  /** A guided tour to take up as the walk opens, and the part of it to be at. */
  tour?: { id: string; part: string };
  /** The visitor has just asked for that tour by a link: a small screen gives it the whole screen. */
  asked?: boolean;
  /** A tour was taken up or put down: its title, or nothing. For the title of the page. */
  onTour?: (title: string | undefined) => void;
}
export interface Walk {
  /** Day turned to night, or back. */
  setLights(on: boolean): void;
  /** The visitor has left the page: stop drawing and let go of everything. */
  close(): void;
}

const hallCss = (n: number, name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}${n}`).trim();
/** The ink that reads on each hall's enamel, as the stylesheet has it. */
const INK: Record<number, string> = { 4: '#14171a', 5: '#14171a' };
const still = (on: boolean, w: 800 | 1600) => `./walk-${on ? 'day' : 'night'}-${w}.webp`;

export function openWalk(host: HTMLElement, o: WalkOptions): Walk {
  let lightsOn = o.lights, closed = false;
  const coarse = matchMedia('(pointer: coarse)').matches, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const names = Object.fromEntries(pieces.map((p) => [p.id, said.piece(p).name]));
  // the second line of each plate: the first people named for the piece, and its year
  const makers = Object.fromEntries(pieces.map((p) => {
    const who = people[p.id]?.people[0]?.who ?? [], year = said.piece(p).yearText ?? String(p.year);
    return [p.id, [who.length > 3 ? `${who.slice(0, 2).join(comma())} +${who.length - 2}` : who.join(comma()), year].filter(Boolean).join(comma())];
  }));
  const hallName = (n: number) => said.hall(halls[n - 1]).name;

  host.innerHTML = `
<div class="walk__view" id="walk-view">
  <img class="walk__still" id="walk-still" src="${still(lightsOn, 800)}" srcset="${still(lightsOn, 800)} 800w, ${still(lightsOn, 1600)} 1600w" sizes="100vw" width="1600" height="900" alt="${tx('walk.still')}" fetchpriority="high" decoding="async">
  <button type="button" class="btn walk__start" id="walk-start"${o.auto ? ' hidden' : ''}>${tx('walk.start')}</button>
  <p class="walk__hint" id="walk-hint"></p>
  <p class="walk__note" id="walk-note" role="status"></p>
  <a class="walk__who" id="walk-who" hidden></a>
  <button type="button" class="walk__key walk__fold" id="walk-fold" aria-controls="walk-pad" aria-expanded="false" aria-label="${tx('walk.pad')}" title="${tx('walk.pad')}" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.5 4.5H13V11h4.5V8.5L22 12l-4.5 3.5V13H13v4.5h2.5L12 22l-3.5-4.5H11V13H6.5v2.5L2 12l4.5-3.5V11H11V6.5H8.5z"/></svg></button>
  <div class="walk__pad" id="walk-pad" role="group" aria-label="${tx('walk.pad')}" hidden>
    <button type="button" class="walk__key" data-go="1" data-turn="0" aria-label="${tx('walk.go.forward')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l7 9H5z"/></svg></button>
    <button type="button" class="walk__key" data-go="0" data-turn="1" aria-label="${tx('walk.go.left')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l9-7v14z"/></svg></button>
    <button type="button" class="walk__key" data-go="-1" data-turn="0" aria-label="${tx('walk.go.back')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19l-7-9h14z"/></svg></button>
    <button type="button" class="walk__key" data-go="0" data-turn="-1" aria-label="${tx('walk.go.right')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12l-9 7V5z"/></svg></button>
  </div>
</div>
<section class="guide" id="walk-guide" aria-label="${tx('tour.label')}" hidden></section>
<p class="walk__where" id="walk-where" aria-live="polite"></p>
<div class="walk__plan" id="walk-plan" role="group" aria-label="${tx('walk.plan')}" style="--long: ${plan.LENGTH}; --wide: ${2 * plan.HALF}">
  ${halls.map((h) => { const b = plan.bayOf(h.id), long = b.to - b.from, clear = (h.id === 1 ? 2 : 1) * plan.PITCH - plan.BLOCK / 2; return `<button type="button" class="walk__bay" data-hall="${h.id}" data-bay="${h.id}" style="flex-grow: ${long}; --at: ${(((h.id === 1 ? 0.62 : 0.5) * clear / long) * 100).toFixed(2)}%" disabled><span aria-hidden="true">${h.id}</span><span class="vh">${tx('nav.hall', { n: h.id, name: hallName(h.id) })}</span></button>`; }).join('')}
  <svg class="walk__blocks" viewBox="0 ${-plan.HALF} ${plan.LENGTH} ${2 * plan.HALF}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    ${plan.walls.map((x) => [-1, 1].map((side) => `<rect class="walk__wall" x="${x - 0.4}" y="${side < 0 ? -plan.HALF : plan.GATE / 2}" width="0.8" height="${plan.HALF - plan.GATE / 2}"/>`).join('')).join('')}
    ${trails.map((tr) => {
      const stops = tr.stops.map((id) => plan.placeOf(id)).filter((p) => !!p);
      if (!stops.length) return '';
      const end = (p: plan.Place) => p.z - p.side * (plan.BLOCK / 2 + 0.34);
      const d = `M${plan.DOOR.x} ${tr.lane}H${Math.max(...stops.map((p) => p.x))}` + stops.map((p) => `M${p.x} ${tr.lane}V${end(p)}`).join('');
      return `<path class="walk__trail walk__trail--under" data-trail="${tr.id}" d="${d}"/><path class="walk__trail" data-trail="${tr.id}" d="${d}" stroke="${tr.colour}"/><path class="walk__trail walk__stops" data-trail="${tr.id}" d="${stops.map((p) => `M${p.x} ${end(p)}h0`).join('')}" stroke="${tr.colour}"/>`;
    }).join('')}
    ${plan.places.map((p) => `<rect class="walk__block" data-piece="${p.id}" x="${p.x - plan.BLOCK / 2}" y="${p.z - plan.BLOCK / 2}" width="${plan.BLOCK}" height="${plan.BLOCK}" fill="${INK[p.hall] ?? '#ffffff'}"><title>${names[p.id]}</title></rect>`).join('')}
  </svg>
  <span class="walk__me" id="walk-me" aria-hidden="true"><svg viewBox="-10 -10 20 20" focusable="false"><path d="M9 0L-7 7.5L-3.5 0L-7 -7.5Z"/></svg></span>
</div>
<div class="walk__bar">
  <label class="pickbox walk__goto walk__pick"><span aria-hidden="true">${tx('trail.label')}</span><select id="walk-trail" aria-label="${tx('trail.label')}"><option value="">${tx('trail.none')}</option>${trails.map((tr) => `<option value="${tr.id}">${tx(`trail.${tr.id}`)}</option>`).join('')}</select></label>
  <button type="button" class="btn" data-walk="prev" disabled>${tx('walk.prev')}</button>
  <button type="button" class="btn" data-walk="next" disabled>${tx('walk.next')}</button>
  <label class="pickbox walk__goto"><span aria-hidden="true">${tx('walk.goto')}</span><select id="walk-goto" aria-label="${tx('walk.goto')}" disabled><option value="">${tx('walk.goto')}</option>${halls.map((h) => `<optgroup label="${tx('nav.hall', { n: h.id, name: hallName(h.id) })}">${plan.places.filter((p) => p.hall === h.id).map((p) => `<option value="${p.id}">${names[p.id]}</option>`).join('')}</optgroup>`).join('')}</select></label>
  <span class="gap"></span>
  ${o.switchHtml}
  <button type="button" class="btn" data-walk="pause" disabled>${tx(calm ? 'stage.play' : 'stage.pause')}</button>
  <button type="button" class="btn" data-walk="vr" hidden>${tx('walk.vr')}</button>
  <button type="button" class="btn" data-walk="full">${tx('stage.expand')}</button>
</div>
<p class="walk__intro" id="walk-intro"></p>
<p class="walk__keys small muted">${tx(coarse ? 'walk.hint.touch' : 'walk.keys')}</p>`;

  const view = document.getElementById('walk-view')!, stillImg = document.getElementById('walk-still') as HTMLImageElement;
  const startBtn = document.getElementById('walk-start') as HTMLButtonElement, hint = document.getElementById('walk-hint')!, note = document.getElementById('walk-note')!;
  const where = document.getElementById('walk-where')!, planEl = document.getElementById('walk-plan')!, me = document.getElementById('walk-me')!, pad = document.getElementById('walk-pad')!;
  const intro = document.getElementById('walk-intro')!, fold = document.getElementById('walk-fold') as HTMLButtonElement;
  let introFor = 0;
  const btn = (name: string) => host.querySelector<HTMLButtonElement>(`[data-walk="${name}"]`)!;
  const pauseBtn = btn('pause'), fullBtn = btn('full'), vrBtn = btn('vr'), goto = document.getElementById('walk-goto') as HTMLSelectElement;
  const fine = matchMedia('(pointer: fine)').matches;

  type Gallery = import('./three/walk/gallery').Gallery;
  let gallery: Gallery | null = null, canvas: HTMLCanvasElement | null = null, begun = false, raf = 0, trailNow: string[] | undefined;
  /** The piece the visitor last stood in front of: where the address points. */
  let last = o.start && plan.placeOf(o.start) ? o.start : '';
  /**
   * Keep the address on the piece in front of the visitor, or in a tour on the stop the tour is at.
   * Nothing is added to the browser's history. In full view the address is left alone, as the step back out of
   * full view has to land on this very page: `anyway` is for the moment that step has been taken.
   */
  const mark = (anyway = false) => {
    if (closed || (!anyway && host.classList.contains('is-full')) || !/^#(walk|tour)/.test(location.hash)) return;
    const to = guide.tour ? tourHash(guide.tour, guide.part) : last ? `#walk-${last}` : location.hash.startsWith('#tour') ? '#walk' : '';
    if (!to || location.hash === to) return;
    try { history.replaceState(history.state, '', to); } catch { /* the address is a courtesy */ }
  };

  /** Say where the visitor is: the hall, and the piece in front of them if there is one, with the way to its page. */
  const tell = (w: { hall: number; piece?: string }) => {
    const p = w.piece ? pieceById(w.piece) : undefined;
    host.dataset.hall = String(w.hall || 1);
    where.innerHTML = w.hall
      ? `<b class="walk__no" aria-hidden="true">${w.hall}</b><span>${tx('nav.hall', { n: w.hall, name: hallName(w.hall) })}</span>${p ? `<a class="btn walk__open" href="#piece-${p.id}">${tx('walk.open', { name: names[p.id] })}</a>` : ''}`
      : '';
    for (const b of planEl.querySelectorAll<HTMLElement>('[data-bay]')) b.setAttribute('aria-current', String(Number(b.dataset.bay) === w.hall));
    // what the hall the visitor has walked into is about, as its own page says it
    if (w.hall && w.hall !== introFor) { introFor = w.hall; intro.textContent = said.hall(halls[w.hall - 1]).intro; }
    for (const b of planEl.querySelectorAll<SVGElement>('[data-piece]')) b.classList.toggle('is-here', b.dataset.piece === w.piece);
    goto.value = w.piece ?? '';
    if (w.piece) { last = w.piece; mark(); }
    guide.arrive(w.piece);
  };
  /** Where the tour wants the visitor stood, asked for before the hall was there to stand in. */
  let waiting: { piece: string; stand?: Stand } | undefined, failed = false;
  const small = () => matchMedia('(max-width: 619px)').matches;
  /** The words on how to walk leave the picture: at once, or after a while. */
  let quieting = 0;
  const quiet = (after = 0) => {
    window.clearTimeout(quieting);
    if (after) quieting = window.setTimeout(() => { hint.style.opacity = '0'; }, after); else hint.style.opacity = '0';
  };
  /** The walking buttons are for a finger. In a tour they wait behind one key until the visitor asks for them. */
  let padOpen = false;
  const layPad = () => {
    const live = !!gallery && coarse, folded = live && !!guide.tour;
    fold.hidden = !folded;
    fold.setAttribute('aria-expanded', String(folded && padOpen));
    pad.hidden = !live || (folded && !padOpen);
  };
  const guide = openGuide(document.getElementById('walk-guide')!, document.getElementById('walk-who')!, {
    goTo: (piece, stand) => {
      if (gallery) { gallery.goPiece(piece, false, stand); return 'soon'; }
      waiting = { piece, stand };
      return failed ? 'never' : 'later';
    },
    moving: () => !!gallery?.gliding,
    // a tour asked for with a click: the guide begins, the walk starts if it had not, and a phone gives it the whole screen
    enter: (id) => { follow(id, { say: true }); if (guide.tour && small()) setFull(true); else void go(); },
    leave: () => { follow(''); (host.querySelector<HTMLElement>('.guide__start') ?? canvas)?.focus({ preventScroll: true }); },
    onPart: () => mark(),
    onKey: () => { if (gallery) quiet(); void go(); },
  });
  const fail = (text: string) => { hint.textContent = ''; note.textContent = text; startBtn.hidden = true; failed = true; guide.stranded(); };

  /** Keep the mark on the plan under the visitor's feet, pointing the way they face. */
  let marked = '';
  const track = () => {
    raf = requestAnimationFrame(track);
    if (!gallery) return;
    const pc = (v: number) => Math.max(0, Math.min(100, v * 100)).toFixed(2);
    // on the plan the hall runs to the right and the windows are along the top
    const at = `${pc(gallery.x / plan.LENGTH)}|${pc(gallery.z / (2 * plan.HALF) + 0.5)}|${Math.round((Math.atan2(-Math.cos(gallery.yaw), -Math.sin(gallery.yaw)) * 180) / Math.PI)}`;
    if (at === marked) return;
    marked = at;
    const [x, y, turn] = at.split('|');
    me.style.left = `${x}%`; me.style.top = `${y}%`; me.style.setProperty('--turn', `${turn}deg`);
  };

  const go = async () => {
    if (begun || closed) return;
    begun = true;
    startBtn.hidden = true;
    window.clearTimeout(quieting); hint.style.opacity = '';
    hint.textContent = t('walk.loading');
    try {
      const { Gallery } = await import('./three/walk/gallery');
      if (closed) return;
      canvas = document.createElement('canvas');
      canvas.className = 'walk__gl'; canvas.tabIndex = 0;
      canvas.setAttribute('aria-label', t('walk.canvas'));
      view.prepend(canvas);
      const display = getComputedStyle(document.documentElement).getPropertyValue('--display').trim();
      try {
        gallery = new Gallery(canvas, {
          lights: lightsOn, start: o.start, lite: coarse || innerWidth < 760, calm, fixed: false,
          signs: halls.map((h) => ({ no: h.id, name: hallName(h.id), ground: hallCss(h.id, 'h'), ink: INK[h.id] ?? '#ffffff' })),
          names, makers, display, text: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || undefined,
          onWhere: tell,
          onOpen: (id) => leaveTo(`#piece-${id}`),
          onRelease: () => { if (host.classList.contains('is-full')) setFull(false); else ((guide.tour ? host.querySelector<HTMLElement>('[data-guide="next"]:not(:disabled)') : null) ?? where.querySelector('a') ?? btn('next')).focus(); },
          onTouch: () => { hint.style.opacity = '0'; },
          onStep: (by) => guide.step(by),
        });
      } catch {
        canvas.remove(); canvas = null;
        return fail(t('stage.fail.graphics'));
      }
      for (const b of planEl.querySelectorAll<HTMLButtonElement>('[data-bay]')) b.disabled = false;
      planEl.classList.add('is-live'); goto.disabled = false;
      if (waiting) { gallery.goPiece(waiting.piece, true, waiting.stand); waiting = undefined; }
      tell(gallery.where);
      gallery.follow(trailNow);
      gallery.start();
      track();
      requestAnimationFrame(() => { canvas!.classList.add('is-live'); window.setTimeout(() => { if (!closed) stillImg.hidden = true; }, 500); });
      for (const b of host.querySelectorAll<HTMLButtonElement>('[data-walk]')) b.disabled = false;
      pauseBtn.textContent = t(gallery.isPaused ? 'stage.play' : 'stage.pause');
      layPad();
      hint.textContent = t(coarse ? 'walk.hint.touch' : 'walk.hint.keys');
      if (guide.tour) quiet(4500);
      if (!coarse) canvas.focus({ preventScroll: true });
      // a headset, where there is one
      const xr = (navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } }).xr;
      void xr?.isSessionSupported('immersive-vr').then((yes) => { if (yes && !closed) vrBtn.hidden = false; }, () => undefined);
    } catch {
      fail(t('walk.fail'));
    }
  };

  // Full view takes one step in the browser's history, so the back button of a phone closes it and stays on the page.
  let stepped = false;
  const setFull = (full: boolean, byBack = false) => {
    if (full === host.classList.contains('is-full')) return;
    // closing by the button takes the step back, and the browser tells us when it has: `onPop` then sees to the address
    let pending = false;
    if (full) { try { history.pushState({ full: true }, ''); stepped = true; } catch { stepped = false; } }
    else if (stepped) { stepped = false; if (!byBack) { pending = true; history.back(); } }
    host.classList.toggle('is-full', full);
    for (const el of document.querySelectorAll<HTMLElement>('body > .vh, .top, .foot, .walk__lead')) el.inert = full;
    fullBtn.textContent = t(full ? 'stage.close' : 'stage.expand');
    document.body.style.overflow = full ? 'hidden' : '';
    gallery?.setFree(full);
    gallery?.resize();
    if (full && !begun) void go();
    if (!full && !pending) mark();
  };
  /**
   * Leave the walk for another page of the site. Out of full view, its step in the history is taken back first,
   * so that the way back from that page leads straight to this piece or this stop, and not through a page twice.
   */
  let leaving = '';
  const leaveTo = (href: string) => {
    if (host.classList.contains('is-full') && stepped) { stepped = false; leaving = href; history.back(); }
    else { mark(true); location.hash = href; }
  };
  // the step back out of full view lands on this page again: only then is the address brought up to date
  const onPop = () => {
    if (leaving) { const to = leaving; leaving = ''; mark(true); location.hash = to; return; }
    if (host.classList.contains('is-full')) { stepped = false; setFull(false, true); } else mark();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && host.classList.contains('is-full') && document.activeElement !== canvas) setFull(false); };

  const onClick = (e: MouseEvent) => {
    // a link to another page, followed out of full view
    const out = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (out && host.classList.contains('is-full') && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); return leaveTo(out.getAttribute('href')!); }
    const el = (e.target as Element).closest<HTMLElement | SVGElement>('[data-walk], [data-bay], [data-piece], #walk-start, #walk-fold');
    if (!el) return;
    // the button on the picture: in a tour the guide begins once the visitor stands at the stop, and a phone gives the tour the whole screen
    if (el.id === 'walk-start') { if (guide.tour) { guide.begin(); if (small()) return setFull(true); } return void go(); }
    if (el.id === 'walk-fold') { padOpen = !padOpen; return layPad(); }
    const name = el.dataset.walk;
    if (el.dataset.piece) gallery?.goPiece(el.dataset.piece);
    if (el.dataset.bay && gallery) {
      // with a mouse the plan is a map: go to the very place. From the keyboard, or under a finger, go into that bay
      const r = planEl.getBoundingClientRect();
      if (fine && e.detail > 0 && r.width > 0) {
        const [x, z] = plan.free(((e.clientX - r.left) / r.width) * plan.LENGTH, ((e.clientY - r.top) / r.height - 0.5) * 2 * plan.HALF);
        const far = Math.hypot(x - gallery.x, z - gallery.z);
        gallery.goTo({ x, z, yaw: far > 1.5 ? Math.atan2(gallery.x - x, gallery.z - z) : gallery.yaw });
      } else gallery.goHall(Number(el.dataset.bay));
    }
    if (name === 'prev') gallery?.next(-1);
    if (name === 'next') gallery?.next(1);
    if (name === 'pause' && gallery) { gallery.setPaused(!gallery.isPaused); pauseBtn.textContent = t(gallery.isPaused ? 'stage.play' : 'stage.pause'); }
    if (name === 'full') setFull(!host.classList.contains('is-full'));
    if (name === 'vr' && gallery) {
      vrBtn.disabled = true;
      void gallery.enterVR(() => { vrBtn.disabled = false; }).catch(() => { vrBtn.disabled = false; note.textContent = t('walk.vr.fail'); });
    }
  };
  // a walking button works for as long as it is held, under a finger or under the space bar
  const hold = (e: Event, on: boolean) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.walk__key');
    if (!el && on) return;
    gallery?.hold(on && el ? Number(el.dataset.go) : 0, on && el ? Number(el.dataset.turn) : 0);
  };
  const padDown = (e: Event) => { e.preventDefault(); hold(e, true); };
  const padUp = (e: Event) => hold(e, false);
  const padKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hold(e, e.type === 'keydown'); } };
  const onHide = () => { if (document.hidden) gallery?.stop(); else if (!closed) gallery?.start(); };

  const onGoto = () => { if (goto.value) gallery?.goPiece(goto.value); };
  /**
   * The trail being followed: shown on the plan, and what Next and Previous stop at. A trail is kept from one visit
   * to the next. Where the language tells a guided tour of the trail, following it is taking that tour, from the
   * stop the visitor stands at or from its opening words, and a tour is not kept: it is taken up by asking for it.
   */
  const pick = document.getElementById('walk-trail') as HTMLSelectElement;
  const follow = (id: string, how: { step?: boolean; say?: boolean; part?: string } = {}) => {
    const tr = trailById(id), tour = tr ? toursNow().find((x) => x.id === tr.id) : undefined;
    pick.value = tr ? tr.id : '';
    if (tr) planEl.dataset.trail = tr.id; else delete planEl.dataset.trail;
    try { if (tr && !tour) localStorage.setItem('trail', tr.id); else localStorage.removeItem('trail'); } catch { /* remembering is a courtesy */ }
    trailNow = tr?.stops;
    gallery?.follow(trailNow);
    host.classList.toggle('is-toured', !!tour);
    layPad();
    if (tour && gallery) quiet(4500);
    startBtn.textContent = t(tour ? 'tour.start' : 'walk.start');
    const here = gallery ? gallery.where.piece : o.start;
    guide.take(tour, how.part ?? (here && tr?.stops.includes(here) ? here : 'start'), how.say);
    o.onTour?.(tour ? said.tour(tour)?.title : undefined);
    if (!tour) { mark(); if (how.step && tr && gallery) gallery.next(1); }
  };
  // chosen from the list: a click, so a tour may begin to speak
  pick.addEventListener('change', () => { follow(pick.value, { step: true, say: true }); if (guide.tour) { if (small()) setFull(true); else void go(); } });
  let kept = '';
  try { kept = localStorage.getItem('trail') ?? ''; } catch { /* fine */ }
  // a visitor who has just asked for a stop of a tour hears the guide there once the hall has opened. The link made her ready
  if (o.tour) follow(o.tour.id, { part: o.tour.part, say: !!o.asked && o.auto && o.tour.part !== 'start' });
  else follow(toursNow().some((x) => x.id === kept) ? '' : kept);
  // a voice that a link began belongs to the tour it led to
  if (!guide.tour) hush();
  host.addEventListener('click', onClick);
  goto.addEventListener('change', onGoto);
  pad.addEventListener('pointerdown', padDown); pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp); pad.addEventListener('pointerleave', padUp);
  pad.addEventListener('keydown', padKey); pad.addEventListener('keyup', padKey);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('popstate', onPop);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onHide);

  tell({ hall: o.start ? pieceById(o.start)?.hall ?? 1 : 1 });
  if (o.auto) { if (guide.tour && o.asked && small()) setFull(true); else void go(); }

  return {
    setLights(on) {
      lightsOn = on;
      gallery?.setLights(on);
      if (!stillImg.hidden) { stillImg.src = still(on, 800); stillImg.srcset = `${still(on, 800)} 800w, ${still(on, 1600)} 1600w`; }
      for (const s of host.querySelectorAll('[data-lights-switch]')) s.setAttribute('aria-checked', String(on));
    },
    close() {
      closed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(quieting);
      if (host.classList.contains('is-full')) { host.classList.remove('is-full'); document.body.style.overflow = ''; for (const el of document.querySelectorAll<HTMLElement>('body > .vh, .top, .foot')) el.inert = false; }
      host.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
      guide.close();
      gallery?.dispose(); gallery = null;
    },
  };
}
