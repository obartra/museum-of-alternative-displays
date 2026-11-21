import { halls } from './data/halls';
import { people } from './data/people';
import { pieceById, pieces } from './data/pieces';
import { comma, said, t, tx } from './i18n';
import * as plan from './three/walk/plan';

/**
 * Walk the museum: seven halls in a row, every piece on its block in the hall it belongs to, to stroll through
 * or jump across. This is the page round the picture: where the visitor is, what the hall they are in is about,
 * the plan of the building, the buttons that do what the keys do. The building itself, and the visitor in it,
 * live in `three/walk` and load only when the walk starts.
 * The address follows the visitor from piece to piece, so the back button of a piece's page returns to its block.
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
  <div class="walk__pad" id="walk-pad" role="group" aria-label="${tx('walk.pad')}" hidden>
    <button type="button" class="walk__key" data-go="1" data-turn="0" aria-label="${tx('walk.go.forward')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5l7 9H5z"/></svg></button>
    <button type="button" class="walk__key" data-go="0" data-turn="1" aria-label="${tx('walk.go.left')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l9-7v14z"/></svg></button>
    <button type="button" class="walk__key" data-go="-1" data-turn="0" aria-label="${tx('walk.go.back')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19l-7-9h14z"/></svg></button>
    <button type="button" class="walk__key" data-go="0" data-turn="-1" aria-label="${tx('walk.go.right')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12l-9 7V5z"/></svg></button>
  </div>
</div>
<p class="walk__where" id="walk-where" aria-live="polite"></p>
<div class="walk__plan" id="walk-plan" role="group" aria-label="${tx('walk.plan')}" style="--long: ${plan.LENGTH}; --wide: ${2 * plan.HALF}">
  ${halls.map((h) => { const b = plan.bayOf(h.id), long = b.to - b.from, clear = (h.id === 1 ? 2 : 1) * plan.PITCH - plan.BLOCK / 2; return `<button type="button" class="walk__bay" data-hall="${h.id}" data-bay="${h.id}" style="flex-grow: ${long}; --at: ${(((h.id === 1 ? 0.62 : 0.5) * clear / long) * 100).toFixed(2)}%" disabled><span aria-hidden="true">${h.id}</span><span class="vh">${tx('nav.hall', { n: h.id, name: hallName(h.id) })}</span></button>`; }).join('')}
  <svg class="walk__blocks" viewBox="0 ${-plan.HALF} ${plan.LENGTH} ${2 * plan.HALF}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    ${plan.walls.map((x) => [-1, 1].map((side) => `<rect class="walk__wall" x="${x - 0.4}" y="${side < 0 ? -plan.HALF : plan.GATE / 2}" width="0.8" height="${plan.HALF - plan.GATE / 2}"/>`).join('')).join('')}
    ${plan.places.map((p) => `<rect class="walk__block" data-piece="${p.id}" x="${p.x - plan.BLOCK / 2}" y="${p.z - plan.BLOCK / 2}" width="${plan.BLOCK}" height="${plan.BLOCK}" fill="${INK[p.hall] ?? '#ffffff'}"><title>${names[p.id]}</title></rect>`).join('')}
  </svg>
  <span class="walk__me" id="walk-me" aria-hidden="true"><svg viewBox="-10 -10 20 20" focusable="false"><path d="M9 0L-7 7.5L-3.5 0L-7 -7.5Z"/></svg></span>
</div>
<div class="walk__bar">
  <button type="button" class="btn" data-walk="prev" disabled>${tx('walk.prev')}</button>
  <button type="button" class="btn" data-walk="next" disabled>${tx('walk.next')}</button>
  <label class="lang walk__goto"><span aria-hidden="true">${tx('walk.goto')}</span><select id="walk-goto" aria-label="${tx('walk.goto')}" disabled><option value="">${tx('walk.goto')}</option>${halls.map((h) => `<optgroup label="${tx('nav.hall', { n: h.id, name: hallName(h.id) })}">${plan.places.filter((p) => p.hall === h.id).map((p) => `<option value="${p.id}">${names[p.id]}</option>`).join('')}</optgroup>`).join('')}</select></label>
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
  const intro = document.getElementById('walk-intro')!;
  let introFor = 0;
  const btn = (name: string) => host.querySelector<HTMLButtonElement>(`[data-walk="${name}"]`)!;
  const pauseBtn = btn('pause'), fullBtn = btn('full'), vrBtn = btn('vr'), goto = document.getElementById('walk-goto') as HTMLSelectElement;
  const fine = matchMedia('(pointer: fine)').matches;

  type Gallery = import('./three/walk/gallery').Gallery;
  let gallery: Gallery | null = null, canvas: HTMLCanvasElement | null = null, begun = false, raf = 0;
  /** The piece the visitor last stood in front of: where the address points. */
  let last = o.start && plan.placeOf(o.start) ? o.start : '';
  /** Keep the address on the piece in front of the visitor. Nothing is added to the browser's history. */
  const mark = () => {
    if (!last || closed || host.classList.contains('is-full') || !location.hash.startsWith('#walk') || location.hash === `#walk-${last}`) return;
    try { history.replaceState(history.state, '', `#walk-${last}`); } catch { /* the address is a courtesy */ }
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
  };
  const fail = (text: string) => { hint.textContent = ''; note.textContent = text; startBtn.hidden = true; };

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
          onOpen: (id) => { location.hash = `#piece-${id}`; },
          onRelease: () => { if (host.classList.contains('is-full')) setFull(false); else (where.querySelector('a') ?? btn('next')).focus(); },
          onTouch: () => { hint.style.opacity = '0'; },
        });
      } catch {
        canvas.remove(); canvas = null;
        return fail(t('stage.fail.graphics'));
      }
      for (const b of planEl.querySelectorAll<HTMLButtonElement>('[data-bay]')) b.disabled = false;
      planEl.classList.add('is-live'); goto.disabled = false;
      tell(gallery.where);
      gallery.start();
      track();
      requestAnimationFrame(() => { canvas!.classList.add('is-live'); window.setTimeout(() => { if (!closed) stillImg.hidden = true; }, 500); });
      for (const b of host.querySelectorAll<HTMLButtonElement>('[data-walk]')) b.disabled = false;
      pauseBtn.textContent = t(gallery.isPaused ? 'stage.play' : 'stage.pause');
      pad.hidden = !coarse;
      hint.textContent = t(coarse ? 'walk.hint.touch' : 'walk.hint.keys');
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
  // the step back out of full view lands on this page again: only then is the address brought up to date
  const onPop = () => { if (host.classList.contains('is-full')) { stepped = false; setFull(false, true); } else mark(); };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && host.classList.contains('is-full') && document.activeElement !== canvas) setFull(false); };

  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement | SVGElement>('[data-walk], [data-bay], [data-piece], #walk-start');
    if (!el) return;
    if (el.id === 'walk-start') return void go();
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
  host.addEventListener('click', onClick);
  goto.addEventListener('change', onGoto);
  pad.addEventListener('pointerdown', padDown); pad.addEventListener('pointerup', padUp); pad.addEventListener('pointercancel', padUp); pad.addEventListener('pointerleave', padUp);
  pad.addEventListener('keydown', padKey); pad.addEventListener('keyup', padKey);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('popstate', onPop);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onHide);

  tell({ hall: o.start ? pieceById(o.start)?.hall ?? 1 : 1 });
  if (o.auto) void go();

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
      if (host.classList.contains('is-full')) { host.classList.remove('is-full'); document.body.style.overflow = ''; for (const el of document.querySelectorAll<HTMLElement>('body > .vh, .top, .foot')) el.inert = false; }
      host.removeEventListener('click', onClick);
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
      gallery?.dispose(); gallery = null;
    },
  };
}
