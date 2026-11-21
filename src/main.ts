import '@fontsource-variable/sofia-sans/wght.css';
import '@fontsource-variable/sofia-sans-extra-condensed/wght.css';
import '@fontsource/pt-mono/400.css';
import './styles/tokens.css';
import './styles/base.css';
import { halls, hallById } from './data/halls';
import { inHall, inv, pieceById, pieces } from './data/pieces';
import { NEED_LABEL, PRINCIPLE_LABEL, STATUS_LABEL, type Need, type Piece, type Principle, type Status } from './data/schema';
import { planSvg } from './art/plan';
import { axoSvg, elevationSvg } from './art/building';
import type { Stage } from './three/stage';
import type { Look } from './three/room';

/** Studies for the room a piece is shown in. The original hall, and three colder ones to choose between. */
const ROOMS: [Look, string][] = [['works', 'Works'], ['betong', 'Betong'], ['tehdas', 'Tehdas'], ['ljus', 'Ljus']];
let room: Look = 'works';
try { const saved = localStorage.getItem('room') as Look | null; if (saved && ROOMS.some(([id]) => id === saved)) room = saved; } catch { /* no storage */ }

const REPO = 'https://github.com/obartra/museum-of-alternative-displays';
const app = document.getElementById('app')!;
const root = document.documentElement;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const three = () => import('./three/runtime');
const hallColour = (n: number) => getComputedStyle(root).getPropertyValue(`--h${n}`).trim();

// ---------- hall lights: one switch for the whole building ----------
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
const switchHtml = (label = 'Hall lights') => `<button type="button" class="switch" role="switch" aria-checked="${lightsOn}" data-lights-switch><span class="switch__track"><span class="switch__knob"></span></span><span>${label}</span></button>`;
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

function shell(inner: string, hall?: number, current?: string): void {
  const tab = (n: number) => `<a href="#hall-${n}" data-hall="${n}" aria-label="Hall ${n}, ${esc(hallById(n).name)}"${hall === n ? ' aria-current="true"' : ''}>${n}</a>`;
  app.innerHTML = `
<header class="top">
  <a class="top__name" href="#">Museum of Alternative Displays<small lang="cs">Muzeum alternativních displejů</small></a>
  ${switchHtml()}
  <nav class="tabs" aria-label="Halls">${halls.map((h) => tab(h.id)).join('')}<a class="tabs__word" href="#depot"${current === 'depot' ? ' aria-current="true"' : ''}>Depot</a><a class="tabs__word tabs__about" href="#about"${current === 'about' ? ' aria-current="true"' : ''}>About</a></nav>
</header>
<main id="main" class="frame" tabindex="-1"${hall ? ` data-hall="${hall}"` : ''}>${inner}
<footer class="foot"><span>Every piece is drawn in code. No photographs, no adverts, no vendor links.</span><a href="#about">How the collection is sourced</a><a href="${REPO}">Corrections and source code</a></footer>
</main>`;
}

const chip = (s: Status) => `<span class="chip chip--${s}">${STATUS_LABEL[s]}</span>`;

// ---------- entrance ----------
function entrance(): void {
  document.title = 'Museum of Alternative Displays';
  const cell = (ch: string, cls = '') => `<span class="flap ${cls}" data-ch="${esc(ch)}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`;
  const word = (s: string, n: number) => [...s.toUpperCase().padEnd(n, ' ').slice(0, n)].map((c) => cell(c)).join('');
  const rows = halls.map((h) => {
    const n = inHall(h.id).length;
    return `<a class="board__row" href="#hall-${h.id}" data-hall="${h.id}" aria-label="Hall ${h.id}, ${esc(h.name)}, ${n} pieces"><span aria-hidden="true" style="display:contents">${cell(String(h.id), 'flap--tag')}<span class="flap flap--gap"></span>${word(h.cz, 12)}<span class="board__en"><span class="flap flap--gap"></span>${word(h.name, 14)}</span><span class="flap flap--gap"></span>${word(String(n).padStart(2, ' '), 2)}</span></a>`;
  }).join('');
  const counts = Object.fromEntries(halls.map((h) => [h.id, inHall(h.id).length]));
  shell(`
<div class="stack">
  <p class="lead" style="max-width: 30ch; font-size: clamp(1.45rem, 5.4vw, 2.3rem); line-height: 1.16; font-weight: 600">${pieces.length} ways to make a picture that are not the screen you are holding.</p>
  <p class="prose">Turn each one around. Switch the hall lights off and see which ones survive. Read how it works, what it is good at and where it fails, with the sources.</p>
  <section class="board" aria-label="Directory of halls">
    <div class="board__head"><span>Hall</span><span class="board__clock" id="clock" aria-label="Time now"></span><span>Pieces</span></div>
    <div class="board__rows">${rows}</div>
  </section>
  <div class="split">
    <section class="stack" style="--gap: 12px"><h2 class="h-sec">Plan of the works</h2>${planSvg((t) => `#${t.replace('/', '-')}`, counts)}</section>
    <section class="stack" style="--gap: 14px">
      <h2 class="h-sec">The building</h2>
      <div class="prose"><p>The museum is imagined in a former picture-tube works: five north-light bays where tubes were once blown, pumped and tested, a windowless block that was the test darkroom, and a water tower. Each department kept its name over the door.</p><p>The route starts at the gatehouse and runs north through the shed, across to the darkroom and down past the tower. The depot holds everything in one sortable list.</p></div>
      ${axoSvg().replace('<svg ', '<svg class="drawing" ')}
      <p class="small muted">The building is a drawing. The fifty technologies are real.</p>
    </section>
  </div>
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
    flaps.forEach((f, i) => {
      f.textContent = glyphs[(i * 11) % glyphs.length];
      f.addEventListener('animationend', () => f.classList.remove('is-flipping'));
    });
    flipper = window.setInterval(() => {
      let busy = false;
      flaps.forEach((f, i) => {
        if (left[i] <= 0) return;
        left[i]--; busy = true;
        f.textContent = left[i] === 0 ? f.dataset.ch! : glyphs[(i * 5 + left[i] * 3) % glyphs.length];
        f.classList.remove('is-flipping'); void f.offsetWidth; f.classList.add('is-flipping');
      });
      if (!busy) clearInterval(flipper);
    }, 95);
  }
  leave = () => { clearInterval(timer); clearInterval(flipper); };
}

// ---------- hall ----------
function tile(p: Piece): string {
  return `<a class="tile" href="#piece-${p.id}" data-hall="${p.hall}"><div class="tile__img"><img alt="" data-thumb="${p.id}" width="420" height="420" loading="lazy"><span class="tile__no">inv. č. ${inv(p)}</span></div><div class="tile__name">${esc(p.name)}</div><div class="tile__meta">${p.year} ${chip(p.status)}</div></a>`;
}

function fillThumbs(): void {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('img[data-thumb]')];
  if (!imgs.length) return;
  const on = lightsOn;
  three().then(async ({ thumb }) => {
    for (const img of imgs) {
      if (!img.isConnected || on !== lightsOn) return;
      const p = pieceById(img.dataset.thumb!)!;
      const url = await thumb(p.id, hallColour(p.hall), on, 360);
      if (url && img.isConnected) img.src = url;
    }
  });
}

function hallView(n: number): void {
  const h = hallById(n);
  if (!h) return notFound();
  document.title = `Hall ${n}, ${h.name} | Museum of Alternative Displays`;
  const list = inHall(n);
  const prev = halls[n - 2], next = halls[n];
  shell(`
<div class="stack">
  <div class="hallhead">
    <h1 class="plate"><span class="plate__no">${n}</span><span><span class="plate__title">${esc(h.name)}</span><span class="plate__sub" style="padding-left:0"><span lang="cs">${esc(h.cz)}</span>, once ${esc(h.was)}</span></span></h1>
    <p class="lead">${esc(h.intro)}</p>
  </div>
  <div class="pieces">${list.map(tile).join('')}</div>
  <nav class="pager" aria-label="Halls">${prev ? `<a href="#hall-${prev.id}">Back to hall ${prev.id}, ${esc(prev.name)}</a>` : '<a href="#">Back to the entrance</a>'}${next ? `<a href="#hall-${next.id}">On to hall ${next.id}, ${esc(next.name)}</a>` : '<a href="#depot">On to the depot</a>'}</nav>
</div>`, n);
  fillThumbs();
  const relight = () => fillThumbs();
  lightListeners.add(relight);
  leave = () => lightListeners.delete(relight);
}

// ---------- piece ----------
function pieceView(id: string): void {
  const p = pieceById(id);
  if (!p) return notFound();
  const h = hallById(p.hall);
  const all = pieces, i = all.indexOf(p), prev = all[i - 1], next = all[i + 1];
  document.title = `${p.name} | Museum of Alternative Displays`;
  const row = (k: string, v: string) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  shell(`
<article class="piece">
  <div class="stage" id="stage">
    <div class="stage__box" id="stage-box"></div>
    <p class="stage__hint" id="stage-hint">Drag to turn. Pinch or scroll to zoom.</p>
    <p class="stage__note" id="stage-note" role="status"></p>
    <div class="stage__bar">${switchHtml('Lights')}<span class="gap"></span><button type="button" class="btn" data-act="eye" aria-pressed="false" hidden></button><button type="button" class="btn" data-act="front">Front</button><button type="button" class="btn" data-act="home">Reset</button><button type="button" class="btn" data-act="full" aria-pressed="false">Expand</button></div>
    <div class="rooms" role="group" aria-label="Room study"><span>Room study</span>${ROOMS.map(([id, name]) => `<button type="button" class="chip-btn" data-room="${id}" aria-pressed="${id === room}">${name}</button>`).join('')}</div>
  </div>
  <div class="stack">
    <a class="crumb" href="#hall-${h.id}"><b>${h.id}</b><span>${esc(h.name)}, <span lang="cs">${esc(h.cz)}</span></span></a>
    <h1 class="plate" style="display:block"><span class="plate__title">${esc(p.name)}</span>${p.aka ? `<span class="plate__sub">${esc(p.aka)}</span>` : ''}</h1>
    <p class="lead">${esc(p.lead)}</p>
    <dl class="card">
      ${row('inv. č.', inv(p))}
      ${row('First shown', String(p.year))}
      ${row('Origin', esc(p.origin))}
      ${row('Status', `${STATUS_LABEL[p.status]}. ${esc(p.statusNote)}`)}
      ${row('Light', PRINCIPLE_LABEL[p.principle])}
      ${p.needs.length ? row('Notes', p.needs.map((n) => NEED_LABEL[n]).join('. ')) : ''}
    </dl>
    <section class="stack" style="--gap: 10px"><h2 class="h-sec">How it makes an image</h2><div class="prose">${p.how.map((t) => `<p>${esc(t)}</p>`).join('')}</div></section>
    <div class="duo">
      <section><h3>Good at</h3><ul>${p.good.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
      <section><h3>Fails at</h3><ul>${p.bad.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>
    </div>
    <section class="stack" style="--gap: 10px"><h2 class="h-sec">On the plinth</h2><p class="prose">${esc(p.look)}</p><div id="surface"></div></section>
    ${p.dispute ? `<p class="flag"><strong>The record is not settled.</strong> ${esc(p.dispute)}</p>` : ''}
    <section class="stack" style="--gap: 6px"><h2 class="h-sec">Provenance</h2><ol class="sources">${p.sources.map((s) => `<li><span class="kind">${s.kind}</span><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ol></section>
    <nav class="pager" aria-label="Pieces">${prev ? `<a href="#piece-${prev.id}">Back: ${esc(prev.name)}</a>` : `<a href="#">Back to the entrance</a>`}${next ? `<a href="#piece-${next.id}">Next: ${esc(next.name)}</a>` : `<a href="#depot">On to the depot</a>`}</nav>
  </div>
</article>`, p.hall);

  const box = document.getElementById('stage-box')!, wrap = document.getElementById('stage')!;
  const note = document.getElementById('stage-note')!, hint = document.getElementById('stage-hint')!;
  const fullBtn = wrap.querySelector<HTMLButtonElement>('[data-act="full"]')!;
  const eyeBtn = wrap.querySelector<HTMLButtonElement>('[data-act="eye"]')!, frontBtn = wrap.querySelector<HTMLButtonElement>('[data-act="front"]')!;
  const setEye = (on: boolean) => {
    if (!stage?.eye) return;
    if (on) stage.goEye(); else stage.goHome();
    eyeBtn.setAttribute('aria-pressed', String(on));
    eyeBtn.textContent = on ? 'Back' : stage.eye.label;
    hint.textContent = on ? 'Drag to move your head.' : 'Drag to turn. Pinch or scroll to zoom.';
    hint.style.opacity = '1';
  };
  let alive = true;
  const say = (on: boolean) => {
    const d = stage?.inDark;
    note.textContent = !on && d === 'vanishes' ? 'The hall is dark and this piece makes no light of its own.' : on && d === 'better' ? 'Stronger in the dark. Try the hall lights.' : '';
  };
  const setFull = (full: boolean) => {
    wrap.classList.toggle('is-full', full);
    fullBtn.setAttribute('aria-pressed', String(full));
    fullBtn.textContent = full ? 'Close' : 'Expand';
    document.body.style.overflow = full ? 'hidden' : '';
    stage?.setFree(full);
    stage?.resize();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && wrap.classList.contains('is-full')) setFull(false);
    if (document.activeElement !== stageCanvas || !stage) return;
    const k: Record<string, [number, number, number]> = { ArrowLeft: [-12, 0, 1], ArrowRight: [12, 0, 1], ArrowUp: [0, 8, 1], ArrowDown: [0, -8, 1], '+': [0, 0, 0.88], '=': [0, 0, 0.88], '-': [0, 0, 1.14] };
    if (k[e.key]) { e.preventDefault(); stage.nudge(...k[e.key]); }
  };
  wrap.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    const pick = (e.target as HTMLElement).closest<HTMLElement>('[data-room]')?.dataset.room as Look | undefined;
    if (pick) {
      room = pick;
      try { localStorage.setItem('room', room); } catch { /* a private window: the choice lasts for the visit */ }
      stage?.setLook(room);
      wrap.querySelectorAll<HTMLElement>('[data-room]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.room === room)));
    }
    if (act === 'eye') setEye(!stage?.inEye);
    if (act === 'front') { setEye(false); stage?.goFront(); }
    if (act === 'home') { setEye(false); stage?.goHome(); }
    if (act === 'full') setFull(!wrap.classList.contains('is-full'));
  });
  document.addEventListener('keydown', onKey);
  const relight = (on: boolean) => { stage?.setLights(on); say(on); };
  lightListeners.add(relight);

  three().then(({ Stage, builders }) => {
    if (!alive) return;
    if (!stageCanvas) { stageCanvas = document.createElement('canvas'); stageCanvas.className = 'gl'; stageCanvas.tabIndex = 0; }
    stageCanvas.setAttribute('aria-label', `3D model of ${p.name}. Drag or use the arrow keys to turn it, plus and minus to zoom.`);
    box.append(stageCanvas);
    try {
      stage ??= new Stage(stageCanvas, true, room);
      stage.setLook(room);
    } catch {
      box.innerHTML = '<p style="padding:24px">This browser could not start 3D graphics, so the model cannot be shown. The text below is complete without it.</p>';
      return;
    }
    stage.attach();
    stage.onTouch = () => { hint.style.opacity = '0'; };
    stage.setPiece(builders[p.id](), hallColour(p.hall), p.hall);
    stage.setLights(lightsOn, true);
    stage.start();
    say(lightsOn);
    // a piece made to be looked into gets a button that puts your eye there, in place of the plain front view
    if (stage.eye) { eyeBtn.hidden = false; eyeBtn.textContent = stage.eye.label; frontBtn.hidden = true; }
    const surf = stage.surface;
    if (surf) {
      const holder = document.getElementById('surface')!;
      holder.className = 'surface';
      holder.append(surf);
      surf.setAttribute('role', 'img');
      surf.setAttribute('aria-label', `The lit surface of the ${p.name}, shown flat.`);
    }
  }).catch(() => { box.innerHTML = '<p style="padding:24px">The 3D viewer did not load. Check the connection and reload. The text below is complete without it.</p>'; });

  leave = () => {
    alive = false;
    setFull(false);
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
  document.title = 'Depot | Museum of Alternative Displays';
  const pill = (group: string, value: string, label: string, type: 'radio' | 'checkbox', checked: boolean) =>
    `<label class="pill"><input type="${type}" name="${group}" value="${value}" id="f-${group}-${value || 'any'}"${checked ? ' checked' : ''}><span>${label}</span></label>`;
  const s = depotState;
  shell(`
<div class="stack">
  <div class="hallhead"><h1 class="plate" style="--hall: var(--ink); --hall-ink: var(--wash)"><span class="plate__title" style="padding: 6px 14px 2px">Depot</span><span class="plate__sub" lang="cs">Depozitář</span></h1><p class="lead">Every piece in one list. Filter by what you need the display to do.</p></div>
  <form class="filters" id="filters">
    <fieldset><legend>Where the light comes from</legend>${pill('principle', '', 'Any', 'radio', s.principle === '')}${(Object.keys(PRINCIPLE_LABEL) as Principle[]).map((k) => pill('principle', k, PRINCIPLE_LABEL[k], 'radio', s.principle === k)).join('')}</fieldset>
    <fieldset><legend>It has to</legend>${(Object.keys(NEED_LABEL) as Need[]).filter((k) => k !== 'dark').map((k) => pill('needs', k, NEED_LABEL[k].replace(/^Readable/, 'Be readable').replace(/^Holds/, 'Hold').replace(/^See-through/, 'Be see-through').replace(/^Depth/, 'Give depth').replace(/^Image/, 'Put the image'), 'checkbox', s.needs.has(k))).join('')}</fieldset>
    <fieldset><legend>Can you still get one</legend>${pill('status', '', 'Any', 'radio', s.status === '')}${(Object.keys(STATUS_LABEL) as Status[]).map((k) => pill('status', k, STATUS_LABEL[k], 'radio', s.status === k)).join('')}</fieldset>
    <fieldset><legend>Order</legend>${pill('sort', 'hall', 'By hall', 'radio', s.sort === 'hall')}${pill('sort', 'year', 'Oldest first', 'radio', s.sort === 'year')}${pill('sort', 'name', 'A to Z', 'radio', s.sort === 'name')}</fieldset>
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
    if (s.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    document.getElementById('count')!.textContent = list.length === pieces.length ? `All ${list.length} pieces` : list.length ? `${list.length} of ${pieces.length} pieces` : 'Nothing in the collection does all of that. Remove a requirement.';
    document.getElementById('rows')!.innerHTML = list.map((p) => `<a class="row" href="#piece-${p.id}" data-hall="${p.hall}"><span class="row__hall" aria-hidden="true">${p.hall}</span><span><span class="row__name">${esc(p.name)}</span><br><span class="small muted">${esc(p.lead)}</span></span><span style="text-align:right"><span class="row__year">${p.year}</span><br>${chip(p.status)}</span></a>`).join('');
  };
  form.addEventListener('change', draw);
  form.addEventListener('submit', (e) => e.preventDefault());
  draw();
}

// ---------- about ----------
function about(): void {
  document.title = 'About | Museum of Alternative Displays';
  const kinds = new Map<string, number>();
  for (const p of pieces) for (const s of p.sources) kinds.set(s.kind, (kinds.get(s.kind) ?? 0) + 1);
  const total = [...kinds.values()].reduce((a, b) => a + b, 0);
  const flagged = pieces.filter((p) => p.dispute).length;
  shell(`
<div class="stack">
  <div class="hallhead"><h1 class="plate" style="--hall: var(--ink); --hall-ink: var(--wash)"><span class="plate__title" style="padding: 6px 14px 2px">Gatehouse</span><span class="plate__sub" lang="cs">Vrátnice</span></h1><p class="lead">What this is, how it was put together, and what is missing.</p></div>
  <div class="split">
    <section class="stack prose" style="--gap: 12px">
      <h2 class="h-sec">What counts as a piece</h2>
      <p>A piece is a principle: one physical way of putting a picture in front of an eye. It is never a product. A product is named only when it was the first of its kind or is the example everyone means.</p>
      <p>There are no adverts, no affiliate links, no embedded videos and no links to anyone selling anything.</p>
      <h2 class="h-sec">How it is sourced</h2>
      <p>Every date and name on a registry card was checked against a source that was opened and read while the collection was assembled. Sources are listed on each piece under Provenance, labelled by kind: first publications and patents, museum and university records, the maker's own pages, journalism, and encyclopedia articles used as cross-checks.</p>
      <p>The collection has ${pieces.length} pieces and ${total} source links: ${[...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(', ')}. Too many of them are still encyclopedia articles. Replacing those with primary sources is the main open job.</p>
      <p>${flagged} pieces carry a note that the record is not settled, where sources disagree about a date or an inventor or simply do not say. The note stays until someone supplies better evidence.</p>
      <h2 class="h-sec">The pictures</h2>
      <p>Nothing here is a photograph. Each object is modelled in code and drawn live, which is why you can turn it, and why its lit surface is running: every working piece shows the time of day, so that the same information can be compared across fifty kinds of physics.</p>
      <p>The models are simplified and not to scale. Where a piece is shown magnified or slowed down, the text says so.</p>
      <h2 class="h-sec">Not yet in the collection</h2>
      <p>Falling-water curtains, aerial imaging plates, grating light valves, switchable privacy glass, ferrofluid, and light-activated paints and pigments. Each needs sources of the same standard before it gets a plinth.</p>
      <h2 class="h-sec">Corrections</h2>
      <p>If something is wrong, or you hold a better source, <a href="${REPO}/issues">open an issue</a>. The data for every piece is a plain file in the <a href="${REPO}">repository</a>.</p>
      <p class="small muted">The idea of surveying alternative displays is Blair Neal's, whose <a href="https://blair-neal.gitbook.io/survey-of-alternative-displays">guide of that name</a> has run since 2015. This collection shares none of its text. Typefaces: Sofia Sans and Sofia Sans Extra Condensed by Lettersoup, PT Mono by ParaType.</p>
    </section>
    <section class="stack" style="--gap: 14px">
      <h2 class="h-sec">The works</h2>
      ${elevationSvg().replace('<svg ', '<svg class="drawing" ')}
      ${axoSvg().replace('<svg ', '<svg class="drawing" ')}
      <p class="prose small muted">Concept drawings for the museum as a physical place. Halls 1 to 5 fill the old production shed from south to north. Hall 6 is the former test darkroom and hall 7 the water tower. The department names over the doors are Czech: Strojovna, machine room. Sklárna, glassworks. Polovodiče, semiconductors. Optika, optics. Tiskárna, print shop. Temná komora, darkroom. Věž, tower.</p>
    </section>
  </div>
</div>`, undefined, 'about');
}

function notFound(): void {
  document.title = 'Not found | Museum of Alternative Displays';
  shell(`<div class="stack"><h1 class="h-sec">That door does not open</h1><p class="prose">There is no hall or piece at this address. <a href="#">Go back to the entrance</a> or <a href="#depot">look in the depot</a>.</p></div>`);
}

// ---------- contact sheet, for checking every model at once ----------
async function sheet(q: URLSearchParams): Promise<void> {
  const on = q.get('lights') !== 'off';
  const size = Number(q.get('size') ?? 240);
  const only = q.get('ids')?.split(',');
  const num = (k: string) => (q.has(k) ? Number(q.get(k)) : undefined);
  const look = (q.get('look') ?? undefined) as Look | undefined;
  const view = q.has('eye') ? { eye: true } : q.has('az') ? { az: num('az'), el: num('el'), zoom: num('zoom') } : undefined;
  root.dataset.lights = on ? 'on' : 'off';
  app.innerHTML = `<div id="grid" style="display:grid;grid-template-columns:repeat(auto-fill,${size}px);gap:4px;padding:4px"></div>`;
  const grid = document.getElementById('grid')!;
  const { thumb, builders } = await three();
  for (const p of pieces) {
    if (only && !only.includes(p.id)) continue;
    if (view?.eye && !builders[p.id]().eye) continue;
    const shot = view || look ? { ...view, look, no: p.hall } : undefined;
    const url = await thumb(p.id, hallColour(p.hall), on, size, shot);
    grid.insertAdjacentHTML('beforeend', `<figure style="margin:0"><img src="${url}" width="${size}" height="${size}" alt=""><figcaption style="font:600 11px var(--text)">${inv(p)} ${p.id}</figcaption></figure>`);
  }
  document.body.dataset.ready = '1';
}

// ---------- router ----------
function route(): void {
  leave?.(); leave = null;
  // plain names only, so a link survives being embedded: #hall-2, #piece-nixie-tube, #depot, #about
  const [name, query] = location.hash.replace(/^#\/?/, '').split('?');
  const hall = /^hall-(\d)$/.exec(name), piece = /^piece-([a-z0-9-]+)$/.exec(name);
  if (name === 'sheet') { void sheet(new URLSearchParams(query ?? '')); return; }
  if (!name) entrance();
  else if (hall) hallView(Number(hall[1]));
  else if (piece) pieceView(piece[1]);
  else if (name === 'depot') depot();
  else if (name === 'about') about();
  else notFound();
  window.scrollTo(0, 0);
  document.body.dataset.ready = '1';
}

root.dataset.lights = lightsOn ? 'on' : 'off';
window.addEventListener('hashchange', route);
Promise.all([document.fonts.load('800 40px "Sofia Sans Extra Condensed Variable"'), document.fonts.load('500 16px "Sofia Sans Variable"'), document.fonts.load('16px "PT Mono"')]).catch(() => undefined).then(route);
