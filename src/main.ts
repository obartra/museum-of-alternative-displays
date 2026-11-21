import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import { halls, hallById } from './data/halls';
import { inHall, inv, pieceById, pieces } from './data/pieces';
import { NEED_LABEL, PRINCIPLE_LABEL, STATUS_LABEL, type Need, type Piece, type Principle, type SourceKind, type Status } from './data/schema';
import { esc } from './html';
import { byName, count, langNow, offered, rich, said, t, tx, useLang, wanted, type Lang } from './i18n';
import { facts } from './data/facts';
import { viewsOf } from './data/views';
import { archiveCount, archiveSection, creditsList, wireArchive } from './archive';
import type { Stage } from './three/stage';

/** Studies for the room a piece is shown in. The original hall, and three colder ones to choose between. */

const REPO = 'https://github.com/obartra/museum-of-alternative-displays';
const app = document.getElementById('app')!;
const root = document.documentElement;
/** The name of a page for the browser tab. */
const titled = (page: string) => t('title.page', { page, site: t('site.name') });
const three = () => import('./three/runtime');
const hallColour = (n: number) => getComputedStyle(root).getPropertyValue(`--h${n}`).trim();

// ---------- daylight: one switch for the whole building, day or night ----------
let lightsOn = true;
try { lightsOn = localStorage.getItem('lights') !== 'off'; } catch { /* storage is optional */ }
const lightListeners = new Set<(on: boolean) => void>();
function setLights(on: boolean): void {
  lightsOn = on;
  root.dataset.lights = on ? 'on' : 'off';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', on ? '#e8e9e3' : '#000000');
  try { localStorage.setItem('lights', on ? 'on' : 'off'); } catch { /* fine */ }
  for (const sw of document.querySelectorAll<HTMLElement>('[data-lights-switch]')) sw.setAttribute('aria-checked', String(on));
  for (const fn of lightListeners) fn(on);
}
const switchHtml = () => `<button type="button" class="switch" role="switch" aria-checked="${lightsOn}" data-lights-switch><span class="switch__track"><span class="switch__knob"></span></span><span>${tx('switch.daylight')}</span></button>`;
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-lights-switch]')) setLights(!lightsOn);
  // the skip link shares the address bar with the router, so handle it here
  if (t.closest('a[href="#main"]')) { e.preventDefault(); document.getElementById('main')?.focus(); }
});

// ---------- the one live 3D stage, kept between pieces ----------
let stage: Stage | null = null;
let stageCanvas: HTMLCanvasElement | null = null;
let leave: (() => void) | null = null;

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const breathe = () => new Promise<void>((done) => setTimeout(done, 0));
const whenIdle = (fn: () => void) => { if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1200 }); else setTimeout(fn, 200); };
const afterPicture = (img: HTMLImageElement, fn: () => void) => {
  if (img.complete) return fn();
  img.addEventListener('load', fn, { once: true });
  img.addEventListener('error', fn, { once: true });
};
/**
 * Whether to start a model without being asked. Not when the browser would draw it in software, which is slow enough
 * to freeze a page, and not when the visitor has asked to save data. `?gl=force` and `?gl=off` in the address override it.
 */
let hardware: boolean | undefined;
function wants3d(): boolean {
  const asked = new URLSearchParams(location.search).get('gl');
  if (asked === 'force' || asked === 'off') return asked === 'force';
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return false;
  if (hardware === undefined) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
      // some browsers hand over a software renderer without calling it a caveat: ask it for its name as well
      const info = gl?.getExtension('WEBGL_debug_renderer_info');
      const name = gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
      hardware = !!gl && !/swiftshader|llvmpipe|software|basic render/i.test(name);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch { hardware = false; }
  }
  return hardware;
}

function shell(inner: string, hall?: number, current?: string): void {
  const tab = (n: number) => `<a href="#hall-${n}" data-hall="${n}"${hall === n ? ' aria-current="true"' : ''}><span class="vh">${tx('nav.hall', { n, name: said.hall(hallById(n)).name })}</span><span aria-hidden="true">${n}</span></a>`;
  // the menu shows the language in use by its short name, and lists every language under the name its speakers give it
  const langs = offered(), now = langNow();
  const menu = langs.length > 1 ? `<label class="lang"><span class="lang__now" aria-hidden="true">${now.short}</span><select id="lang" aria-label="${tx('lang.label')}">${langs.map((l) => `<option value="${l.code}" lang="${l.tag}"${l.code === now.code ? ' selected' : ''}>${l.name}</option>`).join('')}</select></label>` : '';
  app.innerHTML = `
<header class="top">
  <a class="top__name" href="#">${tx('site.name')}</a>
  <div class="top__tools">${menu}${switchHtml()}</div>
  <nav class="tabs" aria-label="${tx('nav.halls')}">${halls.map((x) => tab(x.id)).join('')}<a class="tabs__word" href="#index"${current === 'depot' ? ' aria-current="true"' : ''}>${tx('nav.depot')}</a><a class="tabs__word tabs__about" href="#about"${current === 'about' ? ' aria-current="true"' : ''}>${tx('nav.about')}</a></nav>
</header>
<main id="main" class="frame" tabindex="-1"${hall ? ` data-hall="${hall}"` : ''}>${inner}
<footer class="foot"><span>${tx('foot.claim')}</span><a href="#about">${tx('foot.sourced')}</a><a href="${REPO}">${tx('foot.repo')}</a></footer>
</main>`;
  const skip = document.querySelector('body > a.vh');
  if (skip) skip.textContent = t('site.skip');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('site.description'));
}

const chip = (s: Status) => `<span class="chip chip--${s}">${esc(said.status(s))}</span>`;

// ---------- entrance ----------
function entrance(): void {
  document.title = t('site.name');
  const cell = (ch: string, cls = '') => `<span class="flap ${cls}" data-ch="${esc(ch)}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`;
  const word = (text: string, n: number) => [...text.toLocaleUpperCase(langNow().tag).padEnd(n, ' ')].slice(0, n).map((c) => cell(c)).join('');
  // a row is as long as the longest hall name in the language in use, and never shorter than the English board
  const wide = Math.max(14, ...halls.map((x) => [...said.hall(x).name].length));
  const rows = halls.map((x) => {
    const n = inHall(x.id).length, name = said.hall(x).name;
    return `<a class="board__row" href="#hall-${x.id}" data-hall="${x.id}"><span class="vh">${tx('board.row', { n: x.id, name, count: count('count.pieces', n) })}</span><span aria-hidden="true" style="display:contents">${cell(String(x.id), 'flap--tag')}<span class="flap flap--gap"></span>${word(name, wide)}<span class="flap flap--gap"></span>${word(String(n).padStart(2, ' '), 2)}</span></a>`;
  }).join('');
  shell(`
<div class="stack">
  <h1 class="lead" style="max-width: 30ch; font-size: clamp(1.45rem, 5.4vw, 2.3rem); line-height: 1.16; font-weight: 600">${tx('entrance.lead', { n: pieces.length })}</h1>
  <p class="prose">${tx('entrance.intro')}</p>
  <div class="split">
    <section class="board" aria-label="${tx('board.label')}" style="--cells: ${wide + 3}">
      <div class="board__head"><span>${tx('board.hall')}</span><span class="board__clock" id="clock" aria-label="${tx('board.clock')}"></span><span>${tx('board.pieces')}</span></div>
      <div class="board__rows">${rows}</div>
    </section>
    <figure class="roompic"><img data-room src="${room(1200)}" srcset="${roomSet()}" sizes="(min-width: 760px) 46vw, 92vw" width="1200" height="800" alt="${tx('entrance.room.alt')}" decoding="async"></figure>
  </div>
  <section class="stack" style="--gap: 14px">
    <h2 class="h-sec">${tx('entrance.room')}</h2>
    <div class="prose"><p>${tx('entrance.room.1')}</p><p>${tx('entrance.room.2')}</p><p>${tx('entrance.room.3', { n: pieces.length })}</p></div>
    <p class="small muted">${tx('entrance.room.note', { n: pieces.length })}</p>
  </section>
</div>`);
  // the board settles into place the way a real one does, one flap at a time
  const clock = document.getElementById('clock')!;
  const tick = () => { const d = new Date(); clock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  tick();
  const timer = window.setInterval(tick, 10_000);
  let flipper = 0;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const flaps = [...document.querySelectorAll<HTMLElement>('.board .flap[data-ch]')].filter((f) => f.dataset.ch !== ' ');
    const left = flaps.map((_, i) => 2 + ((i * 7) % 9));
    const glyphs = 'ABCDEFGHIJKLMNOPRSTUVZ0123456789';
    const flip: Keyframe[] = [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)', filter: 'brightness(.6)' }, { transform: 'scaleY(1)' }];
    flaps.forEach((f, i) => { f.textContent = glyphs[(i * 11) % glyphs.length]; });
    flipper = window.setInterval(() => {
      let busy = false;
      flaps.forEach((f, i) => {
        if (left[i] <= 0) return;
        left[i]--; busy = true;
        f.textContent = left[i] === 0 ? f.dataset.ch! : glyphs[(i * 5 + left[i] * 3) % glyphs.length];
        f.animate(flip, { duration: 90 });
      });
      if (!busy) clearInterval(flipper);
    }, 95);
  }
  leave = () => { clearInterval(timer); clearInterval(flipper); };
}

// ---------- hall ----------
// Still pictures of every piece on its stand, made ahead of time by scripts/posters.mjs, so a list never starts 3D graphics.
const poster = (id: string, w: 380 | 760, on = lightsOn) => `./posters/${id}-${on ? 'day' : 'night'}-${w}.webp`;
const posterSet = (id: string, on = lightsOn) => `${poster(id, 380, on)} 380w, ${poster(id, 760, on)} 760w`;
/** The room itself, in one wide picture for the entrance. */
const room = (w: 600 | 1200, on = lightsOn) => `./room-${on ? 'day' : 'night'}-${w}.webp`;
const roomSet = (on = lightsOn) => `${room(600, on)} 600w, ${room(1200, on)} 1200w`;
lightListeners.add((on) => {
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-poster]')) {
    const id = img.dataset.poster!;
    img.srcset = posterSet(id, on); img.src = poster(id, 760, on);
  }
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-room]')) { img.srcset = roomSet(on); img.src = room(1200, on); }
});

/** The first tiles of a list are in view when the page opens: they load at once, the rest as they come near. */
function tile(p: Piece, i = 9): string {
  return `<a class="tile" href="#piece-${p.id}" data-hall="${p.hall}"><div class="tile__img"><img alt="" data-poster="${p.id}" src="${poster(p.id, 760)}" srcset="${posterSet(p.id)}" sizes="(max-width: 560px) 92vw, (max-width: 900px) 46vw, 300px" width="760" height="760" decoding="async" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'}><span class="tile__no">${tx('tile.no', { no: inv(p) })}</span></div><div class="tile__name">${esc(said.piece(p).name)}</div><div class="tile__meta">${p.year} ${chip(p.status)}</div></a>`;
}

function hallView(n: number): void {
  const hall = hallById(n);
  if (!hall) return notFound();
  const words = said.hall(hall), named = (x: typeof hall) => ({ n: x.id, name: said.hall(x).name });
  document.title = titled(t('hall.title', { n, name: words.name }));
  const list = inHall(n);
  const prev = halls[n - 2], next = halls[n];
  shell(`
<div class="stack">
  <div class="hallhead">
    <h1 class="plate"><span class="plate__no">${n}</span><span><span class="plate__title">${esc(words.name)}</span><span class="plate__sub" style="padding-left:0">${esc(count('count.pieces', list.length))}</span></span></h1>
    <p class="lead">${esc(words.intro)}</p>
  </div>
  <div class="pieces">${list.map((x, i) => tile(x, i)).join('')}</div>
  <nav class="pager" aria-label="${tx('pager.halls')}">${prev ? `<a href="#hall-${prev.id}">${tx('pager.backHall', named(prev))}</a>` : `<a href="#">${tx('pager.entrance')}</a>`}${next ? `<a href="#hall-${next.id}">${tx('pager.nextHall', named(next))}</a>` : `<a href="#index">${tx('pager.depot')}</a>`}</nav>
</div>`, n);
}

// ---------- piece ----------
function pieceView(id: string): void {
  const p = pieceById(id);
  if (!p) return notFound();
  const hall = hallById(p.hall), x = said.piece(p);
  const all = pieces, i = all.indexOf(p), prev = all[i - 1], next = all[i + 1];
  // a piece made to be looked into or sat in front of gets a button that puts the visitor there, in place of the plain front view
  const places = viewsOf(p.id).map((v) => ({ ...v, ...said.view(p.id, v) }));
  document.title = titled(x.name);
  // one thing worth repeating, with the source it rests on. That source joins the list at the foot of the page
  const fact = facts[p.id];
  const sources = fact && !p.sources.some((src) => src.url === fact.source.url) ? [...p.sources, fact.source] : p.sources;
  const row = (k: string, v: string) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  shell(`
<article class="piece">
  <div class="stage" id="stage">
    <div class="stage__box" id="stage-box"><img class="stage__poster" id="stage-poster" data-poster="${p.id}" src="${poster(p.id, 760)}" srcset="${posterSet(p.id)}" sizes="(min-width: 900px) 50vw, 100vw" width="760" height="760" alt="${tx('stage.poster', { name: x.name })}" fetchpriority="high" decoding="async"><button type="button" class="btn stage__start" data-act="start" hidden>${tx('stage.start')}</button></div>
    <p class="stage__hint" id="stage-hint"></p>
    <p class="stage__note" id="stage-note" role="status"></p>
    <div class="stage__views" id="stage-views" role="group" aria-label="${tx('stage.views')}"><button type="button" class="btn" data-act="home" disabled>${tx('stage.home')}</button>${places.some((v) => v.kind === 'person') ? '' : `<button type="button" class="btn" data-act="front" disabled>${tx('stage.front')}</button>`}${places.map((v) => `<button type="button" class="btn" data-view="${v.id}" aria-pressed="false" disabled>${esc(v.label)}</button>`).join('')}</div>
    <div class="stage__bar">${switchHtml()}<span class="gap"></span><button type="button" class="btn" data-act="stereo" aria-pressed="false" disabled>${tx('stage.stereo')}</button><button type="button" class="btn" data-act="pause" disabled>${tx(calm ? 'stage.play' : 'stage.pause')}</button><button type="button" class="btn" data-act="full">${tx('stage.expand')}</button></div>
  </div>
  <div class="stack">
    <a class="crumb" href="#hall-${hall.id}"><b>${hall.id}</b><span>${esc(said.hall(hall).name)}</span></a>
    <h1 class="plate" style="display:block"><span class="plate__title">${esc(x.name)}</span>${x.aka ? `<span class="plate__sub">${tx('piece.aka', { names: x.aka })}</span>` : ''}</h1>
    <p class="lead">${esc(x.lead)}</p>
    <section class="stack" style="--gap: 10px"><h2 class="h-sec">${tx('piece.look')}</h2><p class="prose">${esc(x.look)}</p><div id="surface"></div></section>
    ${fact ? `<section class="fact stack" style="--gap: 8px"><h2 class="h-sec">${tx('piece.fact')}</h2><p class="fact__text">${esc(said.fact(p.id, fact.text))}</p><p class="small muted">${rich('piece.fact.source', { a: fact.source.url }, { label: fact.source.label })}</p></section>` : ''}
    <dl class="card">
      ${row(tx('card.no'), inv(p))}
      ${row(tx('card.year'), esc(x.yearText ?? String(p.year)))}
      ${row(tx('card.origin'), esc(x.origin))}
      ${row(tx('card.status'), `${esc(said.status(p.status))}. ${esc(x.statusNote)}`)}
      ${row(tx('card.principle'), esc(said.principle(p.principle)))}
      ${p.needs.length ? row(tx('card.properties'), esc(p.needs.map((n) => said.need(n)).join('. '))) : ''}
    </dl>
    ${archiveSection(p.id)}
    <section class="stack" style="--gap: 10px"><h2 class="h-sec">${tx('piece.how')}</h2><div class="prose">${x.how.map((par) => `<p>${esc(par)}</p>`).join('')}</div></section>
    <div class="duo">
      <section><h3>${tx('piece.good')}</h3><ul>${x.good.map((li) => `<li>${esc(li)}</li>`).join('')}</ul></section>
      <section><h3>${tx('piece.bad')}</h3><ul>${x.bad.map((li) => `<li>${esc(li)}</li>`).join('')}</ul></section>
    </div>
    ${x.dispute ? `<p class="flag"><strong>${tx('piece.dispute')}</strong> ${esc(x.dispute)}</p>` : ''}
    <section class="stack" style="--gap: 6px"><h2 class="h-sec">${tx('piece.sources')}</h2><ol class="sources">${sources.map((src) => `<li><span class="kind">${esc(said.sourceKind(src.kind))}</span><a href="${esc(src.url)}" rel="noopener">${esc(src.label)}</a></li>`).join('')}</ol></section>
    <nav class="pager" aria-label="${tx('pager.pieces')}">${prev ? `<a href="#piece-${prev.id}">${tx('pager.back', { name: said.piece(prev).name })}</a>` : `<a href="#">${tx('pager.entrance')}</a>`}${next ? `<a href="#piece-${next.id}">${tx('pager.next', { name: said.piece(next).name })}</a>` : `<a href="#index">${tx('pager.depot')}</a>`}</nav>
  </div>
</article>`, p.hall);

  const box = document.getElementById('stage-box')!, wrap = document.getElementById('stage')!;
  const note = document.getElementById('stage-note')!, hint = document.getElementById('stage-hint')!;
  const views = document.getElementById('stage-views')!, still = document.getElementById('stage-poster') as HTMLImageElement;
  const act = (name: string) => wrap.querySelector<HTMLButtonElement>(`[data-act="${name}"]`)!;
  const startBtn = act('start'), fullBtn = act('full'), pauseBtn = act('pause'), stereoBtn = act('stereo');
  const HINT = { turn: t('stage.hint.turn'), person: t('stage.hint.person'), detail: t('stage.hint.detail') };
  // alive: this page is still the one on screen. live: its model is running. seen: the stage is in the window.
  let alive = true, live = false, begun = false, seen = true, wantFocus = false;
  const tell = (text: string) => { hint.textContent = text; hint.style.opacity = '1'; };
  const say = (on: boolean) => {
    const d = live ? stage?.inDark : undefined;
    note.textContent = !on && d === 'vanishes' ? t('stage.note.vanishes') : on && d === 'better' ? t('stage.note.better') : '';
  };
  /** Look from one of the piece's own places. The same button again, or null, goes back to the whole piece. */
  const setView = (id: string | null) => {
    if (!stage || !live) return;
    const v = id && stage.inView !== id ? places.find((x) => x.id === id) : undefined;
    if (v) stage.goView(v.id, v.kind === 'detail'); else stage.goHome();
    for (const b of views.querySelectorAll<HTMLElement>('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === v?.id));
    tell(v ? v.hint ?? HINT[v.kind] : HINT.turn);
  };
  // Full view takes one step in the browser's history, so the back button of a phone closes it and stays on the page.
  let stepped = false;
  const setFull = (full: boolean, byBack = false) => {
    if (full === wrap.classList.contains('is-full')) return;
    if (full) { try { history.pushState({ full: true }, ''); stepped = true; } catch { stepped = false; } }
    else if (stepped) { stepped = false; if (!byBack) history.back(); }
    wrap.classList.toggle('is-full', full);
    fullBtn.textContent = t(full ? 'stage.close' : 'stage.expand');
    document.body.style.overflow = full ? 'hidden' : '';
    // while the stage covers the page, nothing behind it can be reached by key or by screen reader
    for (const el of document.querySelectorAll<HTMLElement>('body > .vh, .top, .piece > :not(.stage), .foot')) el.inert = full;
    stage?.setFree(full);
    stage?.resize();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && wrap.classList.contains('is-full')) setFull(false);
    if (document.activeElement !== stageCanvas || !stage || !live) return;
    const k: Record<string, [number, number, number]> = { ArrowLeft: [-12, 0, 1], ArrowRight: [12, 0, 1], ArrowUp: [0, 8, 1], ArrowDown: [0, -8, 1], '+': [0, 0, 0.88], '=': [0, 0, 0.88], '-': [0, 0, 1.14] };
    if (k[e.key]) { e.preventDefault(); stage.nudge(...k[e.key]); }
  };
  const fail = (why: string) => { hint.textContent = ''; note.textContent = why; startBtn.hidden = true; };

  /** Bring the model to life over its still picture. Only this needs three.js. */
  const go = async () => {
    if (begun || !alive) return;
    begun = true;
    startBtn.hidden = true;
    tell(t('stage.loading'));
    try {
      const { Stage, builders } = await three();
      if (!alive) return;
      if (!stageCanvas) { stageCanvas = document.createElement('canvas'); stageCanvas.className = 'gl'; stageCanvas.tabIndex = 0; }
      const cv = stageCanvas;
      cv.classList.remove('is-live');
      cv.setAttribute('aria-label', t('stage.canvas', { name: x.name }));
      box.append(cv);
      try {
        stage ??= new Stage(cv, true);
      } catch {
        cv.remove();
        return fail(t('stage.fail.graphics'));
      }
      stage.attach();
      stage.onTouch = () => { hint.style.opacity = '0'; };
      await breathe();
      if (!alive) return;
      stage.setPiece(builders[p.id](), hallColour(p.hall), p.hall);
      stage.setLights(lightsOn, true);
      await stage.warm();
      if (!alive) return;
      live = true;
      stage.start();
      if (!seen) stage.stop();
      // the first frame is drawn: let it come up over the still picture, then take the picture away
      requestAnimationFrame(() => { cv.classList.add('is-live'); window.setTimeout(() => { if (alive) still.hidden = true; }, 420); });
      for (const b of views.querySelectorAll<HTMLButtonElement>('button')) b.disabled = !!b.dataset.view && !stage.hasView(b.dataset.view);
      if (import.meta.env.DEV) for (const v of places) if (!stage.hasView(v.id)) console.warn(`${p.id}: the view "${v.id}" has words but the model gives it no place`);
      pauseBtn.disabled = stereoBtn.disabled = false;
      stereoBtn.setAttribute('aria-pressed', String(stage.isStereo));
      pauseBtn.textContent = t(stage.isPaused ? 'stage.play' : 'stage.pause');
      tell(HINT.turn);
      say(lightsOn);
      if (wantFocus) cv.focus();
      const surf = stage.surface;
      if (surf) {
        const holder = document.getElementById('surface')!;
        holder.className = 'surface';
        holder.append(surf);
        surf.setAttribute('role', 'img');
        surf.setAttribute('aria-label', t('stage.surface', { name: x.name }));
      }
    } catch {
      fail(t('stage.fail.load'));
    }
  };

  wrap.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act], [data-view]');
    if (!el) return;
    const name = el.dataset.act;
    if (el.dataset.view) setView(el.dataset.view);
    if (name === 'start') { wantFocus = true; void go(); }
    if (name === 'front') { setView(null); stage?.goFront(); }
    if (name === 'home') setView(null);
    if (name === 'pause' && stage && live) { stage.setPaused(!stage.isPaused); pauseBtn.textContent = t(stage.isPaused ? 'stage.play' : 'stage.pause'); }
    if (name === 'stereo' && stage && live) {
      stage.setStereo(!stage.isStereo);
      stereoBtn.setAttribute('aria-pressed', String(stage.isStereo));
      if (stage.isStereo) tell(t('stage.stereo.on')); else tell(HINT.turn);
    }
    if (name === 'full') setFull(!wrap.classList.contains('is-full'));
  });
  document.addEventListener('keydown', onKey);
  const onBack = () => setFull(false, true);
  window.addEventListener('popstate', onBack);
  const relight = (on: boolean) => { if (live) stage?.setLights(on); say(on); };
  lightListeners.add(relight);
  // nothing is drawn while the stage is scrolled out of the window
  const watch = new IntersectionObserver(([e]) => {
    seen = e.isIntersecting;
    if (live) { if (seen) stage?.start(); else stage?.stop(); }
  });
  watch.observe(box);

  // The still picture comes first. The model follows by itself where the device draws 3D with its graphics chip
  // and the visitor has not asked to save data. Anywhere else it waits for the button.
  if (stage) void go();
  else afterPicture(still, () => whenIdle(() => { if (!alive) return; if (wants3d()) void go(); else startBtn.hidden = false; }));

  const unwire = wireArchive(app, p.id, x.name);

  leave = () => {
    alive = false; live = false;
    unwire();
    window.removeEventListener('popstate', onBack);
    setFull(false, true);
    watch.disconnect();
    document.removeEventListener('keydown', onKey);
    lightListeners.delete(relight);
    stage?.stop();
    stageCanvas?.remove();
  };
}

// ---------- depot ----------
type Sort = 'hall' | 'year' | 'name';
const depotState: { principle: Principle | ''; status: Status | ''; needs: Set<Need>; sort: Sort } = { principle: '', status: '', needs: new Set(), sort: 'hall' };

function depot(): void {
  document.title = titled(t('depot.title'));
  const pill = (group: string, value: string, label: string, type: 'radio' | 'checkbox', checked: boolean) =>
    `<label class="pill"><input type="${type}" name="${group}" value="${value}" id="f-${group}-${value || 'any'}"${checked ? ' checked' : ''}><span>${label}</span></label>`;
  const s = depotState;
  shell(`
<div class="stack">
  <div class="hallhead"><h1 class="plate" style="--hall: var(--ink); --hall-ink: var(--wash)"><span class="plate__title" style="padding: 6px 14px 2px">${tx('depot.title')}</span></h1><p class="lead">${tx('depot.lead')}</p></div>
  <form class="filters" id="filters">
    <fieldset><legend>${tx('depot.light')}</legend>${pill('principle', '', tx('depot.any'), 'radio', s.principle === '')}${(Object.keys(PRINCIPLE_LABEL) as Principle[]).map((k) => pill('principle', k, esc(said.principle(k)), 'radio', s.principle === k)).join('')}</fieldset>
    <fieldset><legend>${tx('depot.must')}</legend>${(Object.keys(NEED_LABEL) as Exclude<Need, 'dark'>[]).filter((k) => (k as Need) !== 'dark').map((k) => pill('needs', k, tx(`depot.must.${k}`), 'checkbox', s.needs.has(k))).join('')}</fieldset>
    <fieldset><legend>${tx('depot.status')}</legend>${pill('status', '', tx('depot.any'), 'radio', s.status === '')}${(Object.keys(STATUS_LABEL) as Status[]).map((k) => pill('status', k, esc(said.status(k)), 'radio', s.status === k)).join('')}</fieldset>
    <fieldset><legend>${tx('depot.order')}</legend>${pill('sort', 'hall', tx('depot.sort.hall'), 'radio', s.sort === 'hall')}${pill('sort', 'year', tx('depot.sort.year'), 'radio', s.sort === 'year')}${pill('sort', 'name', tx('depot.sort.name'), 'radio', s.sort === 'name')}</fieldset>
  </form>
  <p class="count" id="count" role="status"></p>
  <div class="rows" id="rows"></div>
</div>`, undefined, 'depot');
  const form = document.getElementById('filters') as HTMLFormElement;
  const draw = () => {
    const f = new FormData(form);
    s.principle = (f.get('principle') as Principle | '') ?? '';
    s.status = (f.get('status') as Status | '') ?? '';
    s.sort = (f.get('sort') as Sort) ?? 'hall';
    s.needs = new Set(f.getAll('needs') as Need[]);
    let list = pieces.filter((p) => (!s.principle || p.principle === s.principle) && (!s.status || p.status === s.status) && [...s.needs].every((n) => p.needs.includes(n)));
    if (s.sort === 'year') list = [...list].sort((a, b) => a.year - b.year);
    if (s.sort === 'name') list = [...list].sort((a, b) => byName(said.piece(a).name, said.piece(b).name));
    document.getElementById('count')!.textContent = list.length === pieces.length ? t('depot.count.all', { n: list.length }) : list.length ? t('depot.count.some', { n: list.length, total: pieces.length }) : t('depot.count.none');
    document.getElementById('rows')!.innerHTML = list.map((p) => `<a class="row" href="#piece-${p.id}" data-hall="${p.hall}"><span class="row__hall" aria-hidden="true">${p.hall}</span><span><span class="row__name">${esc(said.piece(p).name)}</span><br><span class="small muted">${esc(said.piece(p).lead)}</span></span><span style="text-align:right"><span class="row__year">${p.year}</span><br>${chip(p.status)}</span></a>`).join('');
  };
  form.addEventListener('change', draw);
  form.addEventListener('submit', (e) => e.preventDefault());
  draw();
}

// ---------- about ----------
function about(): void {
  document.title = titled(t('nav.about'));
  const kinds = new Map<SourceKind, number>();
  for (const p of pieces) {
    const own = facts[p.id]?.source;
    for (const src of own && !p.sources.some((q) => q.url === own.url) ? [...p.sources, own] : p.sources) kinds.set(src.kind, (kinds.get(src.kind) ?? 0) + 1);
  }
  const total = [...kinds.values()].reduce((a, b) => a + b, 0);
  const flagged = pieces.filter((p) => p.dispute).length;
  const byKind = [...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${said.sourceKind(k)}`).join(', ');
  const held = archiveCount();
  shell(`
<div class="stack">
  <div class="hallhead"><h1 class="plate" style="--hall: var(--ink); --hall-ink: var(--wash)"><span class="plate__title" style="padding: 6px 14px 2px">${tx('nav.about')}</span></h1><p class="lead">${tx('about.lead')}</p></div>
  <div class="split">
    <section class="stack prose" style="--gap: 12px">
      <h2 class="h-sec">${tx('about.piece')}</h2>
      <p>${tx('about.piece.1')}</p>
      <p>${tx('about.piece.2')}</p>
      <h2 class="h-sec">${tx('about.sourced')}</h2>
      <p>${tx('about.sourced.1')}</p>
      <p>${tx('about.sourced.2', { pieces: pieces.length, links: total, kinds: byKind })}</p>
      <p>${tx('about.sourced.3', { n: flagged })}</p>
      <h2 class="h-sec">${tx('about.pictures')}</h2>
      <p>${tx('about.pictures.1', { n: pieces.length })}</p>
      <p>${tx('about.pictures.2')}</p>
      ${held ? `<p>${tx('about.pictures.archive')}</p>` : ''}
      <h2 class="h-sec">${tx('about.missing')}</h2>
      <p>${tx('about.missing.1')}</p>
      ${held ? `<h2 class="h-sec">${tx('about.credits')}</h2><p>${tx('about.credits.1', { n: held })}</p>${creditsList()}` : ''}
      <h2 class="h-sec">${tx('about.corrections')}</h2>
      <p>${rich('about.corrections.1', { a: `${REPO}/issues`, b: REPO })}</p>
      <p class="small muted">${rich('about.thanks', { a: 'https://blair-neal.gitbook.io/survey-of-alternative-displays' })}</p>
    </section>
    <section class="stack prose" style="--gap: 12px">
      <h2 class="h-sec">${tx('about.room')}</h2>
      <p>${tx('about.room.1')}</p>
      <p>${tx('about.room.2')}</p>
      <p>${tx('about.room.3')}</p>
    </section>
  </div>
</div>`, undefined, 'about');
}

// ---------- walk: the whole museum in one hall ----------
function walkView(start?: string): void {
  document.title = titled(t('walk.title'));
  shell(`<div class="walk" id="walk"><p class="walk__wait" role="status">${tx('walk.loading')}</p></div>`, undefined, 'walk');
  const host = document.getElementById('walk')!;
  let hall: { setLights(on: boolean): void; close(): void } | null = null, gone = false;
  const relight = (on: boolean) => hall?.setLights(on);
  lightListeners.add(relight);
  void import('./walk').then(({ openWalk }) => { if (!gone) hall = openWalk(host, { start, lights: lightsOn }); })
    .catch(() => { host.innerHTML = `<p class="prose">${tx('walk.fail')}</p>`; });
  leave = () => { gone = true; lightListeners.delete(relight); hall?.close(); };
}

function notFound(): void {
  document.title = titled(t('missing.page'));
  shell(`<div class="stack"><h1 class="h-sec">${tx('missing.title')}</h1><p class="prose">${rich('missing.text', { a: '#', b: '#index' })}</p></div>`);
}

// ---------- contact sheet, for checking every model at once ----------
async function sheet(q: URLSearchParams): Promise<void> {
  const on = q.get('lights') !== 'off';
  const size = Number(q.get('size') ?? 240);
  const only = q.get('ids')?.split(',');
  const num = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
  const view = q.has('view') ? { view: q.get('view')! } : q.has('az') ? { az: num('az'), el: num('el'), zoom: num('zoom') } : undefined;
  const w = num('w') ?? size, h = num('h') ?? size;
  root.dataset.lights = on ? 'on' : 'off';
  app.innerHTML = `<div id="grid" style="display:grid;grid-template-columns:repeat(auto-fill,${q.has('w') ? Number(q.get('w')) : size}px);gap:4px;padding:4px"></div>`;
  const grid = document.getElementById('grid')!;
  const { thumb } = await three();
  for (const p of pieces) {
    if (only && !only.includes(p.id)) continue;
    // a named view: only the pieces that have it
    if (view && 'view' in view && !viewsOf(p.id).some((v) => v.id === view.view)) continue;
    const shot = view || q.has('w') ? { ...view, no: p.hall, w, h } : undefined;
    const url = await thumb(p.id, hallColour(p.hall), on, size, shot);
    grid.insertAdjacentHTML('beforeend', `<figure style="margin:0"><img src="${url}" width="${w}" height="${h}" alt=""><figcaption style="font:600 11px var(--text)">${inv(p)} ${p.id}</figcaption></figure>`);
  }
  document.body.dataset.ready = '1';
}

// ---------- router ----------
function route(): void {
  leave?.(); leave = null;
  // plain names only, so a link survives being embedded: #hall-2, #piece-nixie-tube, #index, #about
  const [name, query] = location.hash.replace(/^#\/?/, '').split('?');
  const hall = /^hall-(\d)$/.exec(name), piece = /^piece-([a-z0-9-]+)$/.exec(name), walk = /^walk(?:-([a-z0-9-]+))?$/.exec(name);
  if (name === 'sheet') { void sheet(new URLSearchParams(query ?? '')); return; }
  if (name === 'vista') { void import('./three/vista').then(({ landscape }) => landscape()).then(({ land, lights }) => { app.innerHTML = ''; for (const cv of [land, lights]) { cv.style.cssText = 'display:block;width:4096px;background:#cfd6dc;margin-bottom:8px'; app.append(cv); } lights.style.background = '#0a1020'; document.body.dataset.ready = '1'; }); return; }
  if (!name) entrance();
  else if (hall) hallView(Number(hall[1]));
  else if (piece) pieceView(piece[1]);
  else if (name === 'index' || name === 'depot') depot();
  else if (name === 'about') about();
  else if (walk) walkView(walk[1]);
  else notFound();
  window.scrollTo(0, 0);
  document.body.dataset.ready = '1';
}

root.dataset.lights = lightsOn ? 'on' : 'off';
window.addEventListener('hashchange', route);
// choosing a language draws the same page again in it, and leaves the keyboard where it was: on the menu
document.addEventListener('change', (e) => {
  const menu = e.target as HTMLSelectElement;
  if (menu.id !== 'lang') return;
  const y = window.scrollY;
  void useLang(menu.value as Lang, true).then(() => { route(); window.scrollTo({ top: y, behavior: 'instant' }); document.getElementById('lang')?.focus(); });
});
const faces = () => Promise.all([document.fonts.load('800 40px "Sofia Sans Extra Condensed Variable"'), document.fonts.load('500 16px "Sofia Sans Variable"'), document.fonts.load('16px "PT Mono"')]).catch(() => undefined);
void Promise.all([useLang(wanted()), faces()]).then(route);
