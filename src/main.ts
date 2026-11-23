import { brief } from './brief';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import { halls, hallById } from './data/halls';
import { inHall, inv, pieceById, pieces } from './data/pieces';
import { NEED_LABEL, PRINCIPLE_LABEL, STATUS_LABEL, type Need, type Piece, type Principle, type SourceKind, type Status } from './data/schema';
import { esc } from './html';
import { byName, comma, count, langNow, rich, said, standIn, t, tx, useLang, wanted } from './i18n';
import { langMenu, wireLangMenu } from './langmenu';
import { facts } from './data/facts';
import { sounds } from './data/sounds';
import { soundSection, wireSounds } from './sound';
import { people, type Entry } from './data/people';
import { portraits } from './data/portraits';
import { personLinks } from './data/person-links';
import { personByName, personBySlug, persons } from './data/persons';
import { bios, personSources } from './data/person-bios';
import { trailById, trails, type Trail } from './data/trails';
import { tourById, tourStops, type Tour } from './data/tours';
import { visit } from './data/visit';
import { findKept, greet, hush, justAsked, keepTrail, preview, resumed, spokenMinutes, tourAt, tourName, tourPageHtml, toursNow } from './tour';
import { goTo, langOfAddress, link, nameNow, settle, typedPath, wirePlaces } from './place';
import { viewsOf } from './data/views';
import { archiveCount, archiveSection, creditsList, wireArchive } from './archive';
import { elsewhereItem, lifeOf, portraitCredit, sourceItems } from './profile';
import { appFoot, appHtml, wireApp } from './app';
import { keepHtml, showKeep, wireKeep } from './keep';
import { AUTHOR, LICENCE, REPO } from './site';
import { markSvg } from './mark';
import { GLASSES, bareKey, daylightKey, fullKey, nameFullKey } from './icons';
import { openBare, onTap } from './bare';
import { calm as lowPower, setCalm, spread, wantsBeyond } from './beyond';
import type { Stage } from './three/stage';

/** Studies for the room a piece is shown in. The original hall, and three colder ones to choose between. */

const app = document.getElementById('app')!;
const root = document.documentElement;
/** The name of a page for the browser tab. */
const titled = (page: string) => t('title.page', { page, site: t('site.name') });
/**
 * The sentence a search engine or a chat shows under the name of a page. A page says its own before it is drawn:
 * the lead of a piece, the introduction of a hall. A page that says nothing gets the sentence of the museum.
 */
let saying = '';
const says = (text: string): void => { saying = text; };
/** The models draw a typed line on a few of their screens. That face is fetched with them, and no page waits for it. */
const typed = () => document.fonts.load('16px "PT Mono"').catch(() => undefined);
const three = () => Promise.all([import('./three/runtime'), typed()]).then(([runtime]) => runtime);
const hallColour = (n: number) => getComputedStyle(root).getPropertyValue(`--h${n}`).trim();

// ---------- daylight: one switch for the whole building, day or night ----------
let lightsOn = true;
try { lightsOn = localStorage.getItem('lights') !== 'off'; } catch { /* storage is optional */ }
const lightListeners = new Set<(on: boolean) => void>();
function setLights(on: boolean): void {
  lightsOn = on;
  root.dataset.lights = on ? 'on' : 'off';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', on ? '#e8e9e3' : '#08101a');
  try { localStorage.setItem('lights', on ? 'on' : 'off'); } catch { /* fine */ }
  for (const sw of document.querySelectorAll<HTMLElement>('[data-lights-switch]')) sw.setAttribute('aria-checked', String(on));
  for (const fn of lightListeners) fn(on);
}
// a place to look from that is meant to be seen in the dark asks for the daylight off, from here or from the walk
document.addEventListener('museum:lights', (e) => setLights((e as CustomEvent<boolean>).detail));
const switchHtml = () => `<button type="button" class="switch" role="switch" aria-checked="${lightsOn}" data-lights-switch><span class="switch__track"><span class="switch__knob"></span></span><span>${tx('switch.daylight')}</span></button>`;
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-lights-switch]')) setLights(!lightsOn);
  // a link into a guided tour, followed in this window: the guide may begin, since only a click lets a page start a voice
  const into = t.closest<HTMLAnchorElement>('a[href*="#tour-"]');
  if (into && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) greet(into.hash);
  // the skip link moves the keyboard and leaves the address alone
  if (t.closest('a[href="#main"]')) { e.preventDefault(); document.getElementById('main')?.focus(); }
});

// ---------- low power: no room behind the page, and a model waits to be asked for ----------
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-calm]')) return;
  setCalm(!lowPower());
  // what is running was started under the other setting: begin the page again
  location.reload();
});

// ---------- the keys, listed for whoever has a keyboard ----------
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-keys]')) return;
  const opener = e.target as HTMLElement, box = document.createElement('dialog');
  const row = (keys: string[], what: string) => `<div><dt>${keys.map((k) => `<kbd>${esc(k)}</kbd>`).join(' ')}</dt><dd>${what}</dd></div>`;
  box.className = 'keys';
  box.setAttribute('aria-labelledby', 'keys-h');
  box.innerHTML = `<div class="keys__head"><h2 class="h-sec" id="keys-h">${tx('keys.title')}</h2><button type="button" class="btn" autofocus>${tx('stage.close')}</button></div>
<h3>${tx('keys.anywhere')}</h3><dl>${row(['\u2190', '\u2192'], tx('keys.step'))}${row(['Tab'], tx('keys.tab'))}${row(['Esc'], tx('keys.esc'))}</dl>
<h3>${tx('keys.model')}</h3><dl>${row(['\u2190', '\u2192', '\u2191', '\u2193'], tx('keys.turn'))}${row(['+', '-'], tx('keys.zoom'))}${row(['R'], tx('stage.home'))}${row(['1', '2', '3'], tx('keys.views'))}${row(['D'], tx('switch.daylight'))}${row(['G'], tx('stage.stereo'))}${row(['F'], tx('keys.full'))}</dl>`;
  document.body.append(box);
  box.addEventListener('click', (ev) => { if (ev.target === box || (ev.target as HTMLElement).closest('button')) box.close(); });
  box.addEventListener('close', () => { box.remove(); opener.focus(); });
  box.showModal();
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
 * Whether this browser can put a piece in the visitor's own room. It asks the browser only: the code that does
 * the work is fetched when the button is pressed. iPhones have no such room view in their browsers and are not offered it.
 */
let roomReady: Promise<boolean> | undefined;
function canShowInRoom(): Promise<boolean> {
  roomReady ??= (async () => {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } }).xr;
    try { return !!xr && (await xr.isSessionSupported('immersive-ar')); } catch { return false; }
  })();
  return roomReady;
}

/**
 * Whether to start a model without being asked. Not when the browser would draw it in software, which is slow enough
 * to freeze a page, not when the visitor has asked to save data, and not in low power. `?gl=force` and `?gl=off` in the
 * address override it.
 */
let hardware: boolean | undefined;
function wants3d(): boolean {
  const asked = new URLSearchParams(location.search).get('gl');
  if (asked === 'force' || asked === 'off') return asked === 'force';
  if (lowPower()) return false;
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
  const tab = (n: number) => `<a href="${link(`hall-${n}`)}" data-hall="${n}"${hall === n ? ' aria-current="true"' : ''}><span class="vh">${tx('nav.hall', { n, name: said.hall(hallById(n)).name })}</span><span aria-hidden="true">${n}</span></a>`;
  const menu = langMenu();
  // behind a page with no model of its own, the hall as a still picture, as faint and as out of focus as the room
  // that a piece's stage draws behind its page. Not in low power, and not for a visitor saving data
  const still = !/id="(stage|walk)"/.test(inner) && !lowPower() && !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  app.innerHTML = `${still ? '<div class="beyond beyond--still is-on" aria-hidden="true" style="--day: url(./room-day-600.webp); --night: url(./room-night-600.webp)"></div>' : ''}
<header class="top">
  <a class="top__name" href="${link('')}">${markSvg('top__mark')}<span>${tx('site.name')}</span></a>
  <div class="top__tools">${menu}${switchHtml()}</div>
  <nav class="tabs" aria-label="${tx('nav.halls')}">${halls.map((x) => tab(x.id)).join('')}<a class="tabs__word" href="${link('index')}"${current === 'depot' ? ' aria-current="true"' : ''}>${tx('nav.depot')}</a><a class="tabs__word tabs__about" href="${link('people')}"${current === 'people' ? ' aria-current="true"' : ''}>${tx('nav.people')}</a><a class="tabs__word tabs__about" href="${link('about')}"${current === 'about' ? ' aria-current="true"' : ''}>${tx('nav.about')}</a></nav>
</header>
<main id="main" class="frame" tabindex="-1"${hall ? ` data-hall="${hall}"` : ''}>${inner}
<footer class="foot"><a href="${link('people')}">${tx('nav.people')}</a><a href="${link('about')}">${tx('foot.sourced')}</a><a href="${REPO}/issues">${tx('foot.repo')}</a><button type="button" class="foot__keys" data-keys>${tx('keys.title')}</button><button type="button" class="foot__calm" data-calm aria-pressed="${lowPower()}" title="${tx('foot.calm.says')}">${tx('foot.calm')}</button>${current === 'about' ? '' : appFoot()}</footer>
</main>`;
  const skip = document.querySelector('body > a.vh');
  if (skip) skip.textContent = t('site.skip');
  document.querySelector('meta[name="description"]')?.setAttribute('content', saying || t('site.description'));
  saying = '';
}

const chip = (s: Status) => `<span class="chip chip--${s}">${esc(said.status(s))}</span>`;
/** The date of a piece as a list shows it: its year, or for a piece from before 1500 the words its label gives, since such a year is only kept for sorting. */
const yearOf = (p: Piece) => esc(p.year < 1500 ? said.piece(p).yearText ?? String(p.year) : String(p.year));

// ---------- entrance ----------
function entrance(): void {
  document.title = t('site.title');
  const cell = (ch: string, cls = '') => `<span class="flap ${cls}" data-ch="${esc(ch)}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`;
  const word = (text: string, n: number) => [...text.toLocaleUpperCase(langNow().tag).padEnd(n, ' ')].slice(0, n).map((c) => cell(c)).join('');
  // a row is as long as the longest hall name in the language in use, and never shorter than the English board
  const wide = Math.max(14, ...halls.map((x) => [...said.hall(x).name].length));
  const rows = halls.map((x) => {
    const n = inHall(x.id).length, name = said.hall(x).name;
    return `<a class="board__row" href="${link(`hall-${x.id}`)}" data-hall="${x.id}"><span class="vh">${tx('board.row', { n: x.id, name, count: count('count.pieces', n) })}</span><span aria-hidden="true" style="display:contents">${cell(String(x.id), 'flap--tag')}<span class="flap flap--gap"></span>${word(name, wide)}<span class="flap flap--gap"></span>${word(String(n).padStart(2, ' '), 2)}</span></a>`;
  }).join('');
  shell(`
<div class="stack entrance">
  <div class="hero">
    <figure class="roompic hero__pic"><img data-room src="${room(1200)}" srcset="${roomSet()}" sizes="${ROOM_SIZES}" width="1200" height="800" alt="${tx('entrance.room.alt')}" fetchpriority="high" decoding="async"><div class="hero__switch">${switchHtml()}</div></figure>
    <div class="hero__words">
      <h1 class="hero__line">${tx('entrance.lead')}</h1>
      <p class="prose">${tx('entrance.intro')}</p>
    </div>
    <section class="board" aria-label="${tx('board.label')}" style="--cells: ${wide + 3}">
      <div class="board__head"><span>${tx('board.hall')}</span><span class="board__clock" id="clock" aria-label="${tx('board.clock')}"></span><span>${tx('board.pieces')}</span></div>
      <div class="board__rows">${rows}</div>
    </section>
    <p class="ways"><a class="btn btn--go" href="${link('hall-1')}">${tx('entrance.start')}</a><a class="btn" href="${link('walk')}">${tx('walk.title')}</a><a class="btn" href="${link('index')}">${tx('entrance.browse')}</a><a class="btn" href="${link('people')}">${tx('nav.people')}</a></p>
  </div>
  <a class="visitcard" href="${link('visit')}"><span class="visitcard__kind">${tx('visit.kind')}</span><strong class="visitcard__title">${tx('visit.title')}</strong><span class="visitcard__lead">${tx('visit.lead')}</span></a>
  ${toursNow().map(tourCard).join('')}
  <section class="hallpic">
    <a class="hallpic__img" href="${link('walk')}" tabindex="-1" aria-hidden="true"><img data-hallpic src="${hallPic(800)}" srcset="${hallPicSet()}" sizes="(min-width: 1240px) 720px, (min-width: 760px) 58vw, 100vw" width="1600" height="900" alt="" loading="lazy" decoding="async"></a>
    <div class="stack" style="--gap: 12px">
      <h2 class="h-sec">${tx('walk.title')}</h2>
      <p class="prose">${tx('walk.lead')}</p>
      <p class="ways"><a class="btn btn--go" href="${link('walk')}">${tx('walk.start')}</a></p>
    </div>
  </section>
  <section class="stack" style="--gap: 12px">
    <h2 class="h-sec">${tx('entrance.room')}</h2>
    <div class="prose"><p>${tx('entrance.room.1')}</p><p>${tx('entrance.room.2')}</p></div>
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
/** How wide the room is drawn at the door. The page that opens this one asks for the picture early with the same words. */
const ROOM_SIZES = '(min-width: 900px) 56vw, 100vw';
/** The long hall of the walk, seen from its door. */
const hallPic = (w: 800 | 1600, on = lightsOn) => `./walk-${on ? 'day' : 'night'}-${w}.webp`;
const hallPicSet = (on = lightsOn) => `${hallPic(800, on)} 800w, ${hallPic(1600, on)} 1600w`;
lightListeners.add((on) => {
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-poster]')) {
    const id = img.dataset.poster!;
    img.srcset = posterSet(id, on); img.src = poster(id, 760, on);
  }
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-room]')) {
    // the room does not jump from day to night: the picture it was stays behind while the picture it becomes comes up over it
    const frame = img.parentElement, was = img.currentSrc;
    if (frame && was && !calm) {
      frame.style.backgroundImage = `url("${was}")`;
      img.style.transition = 'none'; img.style.opacity = '0';
      void img.offsetWidth;
      img.style.transition = '';
    }
    img.srcset = roomSet(on); img.src = room(1200, on);
    const up = () => { img.style.opacity = ''; };
    if (img.decode) img.decode().then(up, up); else up();
  }
  for (const img of document.querySelectorAll<HTMLImageElement>('img[data-hallpic]')) { img.srcset = hallPicSet(on); img.src = hallPic(800, on); }
});

/** How wide a tile's picture is drawn: two to a row on a phone. The page that opens this one asks for the first picture early with the same words. */
const TILE_SIZES = '(max-width: 359px) 92vw, (max-width: 900px) 46vw, 300px';
/** The first tiles of a list are in view when the page opens: they load at once, the rest as they come near. */
function tile(p: Piece, i = 9): string {
  // as on the plate of its block in the halls: the first people named as its makers, and its date
  const who = people[p.id]?.people.find((e) => !e.aside)?.who ?? [];
  const by = [esc(who.length > 2 ? `${who.slice(0, 2).join(comma())} +${who.length - 2}` : who.join(comma())), yearOf(p)].filter(Boolean).join(esc(comma()));
  return `<a class="tile" href="${link(`piece-${p.id}`)}" data-hall="${p.hall}"><div class="tile__img"><img alt="" data-poster="${p.id}" src="${poster(p.id, 760)}" srcset="${posterSet(p.id)}" sizes="${TILE_SIZES}" width="760" height="760" decoding="async" ${i < 2 ? 'fetchpriority="high"' : 'loading="lazy"'}><span class="tile__no">${tx('tile.no', { no: inv(p) })}</span></div><div class="tile__name">${esc(said.piece(p).name)}</div><div class="tile__meta"><span>${by}</span>${chip(p.status)}</div></a>`;
}

function hallView(n: number): void {
  const hall = hallById(n);
  if (!hall) return notFound();
  const words = said.hall(hall), named = (x: typeof hall) => ({ n: x.id, name: said.hall(x).name });
  document.title = titled(t('hall.title', { n, name: words.name }));
  says(brief(words.intro));
  const list = inHall(n);
  const prev = halls[n - 2], next = halls[n];
  shell(`
<div class="stack">
  <div class="hallhead">
    <h1 class="plate"><span class="plate__no">${n}</span><span><span class="plate__title">${esc(words.name)}</span><span class="plate__sub" style="padding-left:0">${esc(count('count.pieces', list.length))}</span></span></h1>
    <div class="stack" style="--gap: 16px"><p class="lead">${esc(words.intro)}</p>${list.length ? `<p class="ways"><a class="btn" href="${link(`walk-${list[0].id}`)}">${tx('walk.hall')}</a></p>` : ''}</div>
  </div>
  <div class="pieces">${list.map((x, i) => tile(x, i)).join('')}</div>
  <nav class="pager" aria-label="${tx('pager.halls')}">${prev ? `<a href="${link(`hall-${prev.id}`)}">${tx('pager.backHall', named(prev))}</a>` : `<a href="${link('')}">${tx('pager.entrance')}</a>`}${next ? `<a href="${link(`hall-${next.id}`)}">${tx('pager.nextHall', named(next))}</a>` : `<a href="${link('index')}">${tx('pager.depot')}</a>`}</nav>
</div>`, n);  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test((document.activeElement as HTMLElement | null)?.tagName ?? '')) return;
    const to = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : undefined;
    if (to) goTo(link(`hall-${to.id}`));
  };
  document.addEventListener('keydown', onKey);
  leave = () => document.removeEventListener('keydown', onKey);
}

// ---------- people ----------
/**
 * A portrait, where one has been added by hand, with its credit (profile.ts). `named` puts the sitter's name under
 * it: a line that credits several people needs it, or a picture could be taken for the wrong one of them.
 */
const portraitHtml = (name: string, named = false): string => {
  const pic = portraits[name];
  if (!pic) return '';
  const credit = portraitCredit(name);
  return `<figure class="person__pic"><img src="./people/small/${esc(pic.file)}" alt="${esc(name)}" width="84" height="105" loading="lazy" decoding="async"><figcaption>${named ? `<span class="person__name">${esc(name)}</span>` : ''}${credit}</figcaption></figure>`;
};
/** A name, as a link to the person's own page in the museum. What is written of them elsewhere is linked from there. */
const personNameHtml = (name: string): string => {
  const who = personByName(name);
  return who ? `<a class="person__bio" href="${link(`person-${who.slug}`)}">${esc(name)}</a>` : esc(name);
};
/** One line of a People section. `main` picks the names to set in bold when the list is narrowed. */
const entryHtml = (pieceId: string, e: Entry, did: string, main?: (name: string) => boolean): string => {
  const pics = e.who.map((n) => portraitHtml(n, e.who.length > 1)).join('');
  return `<li class="person"><div><p class="person__who">${e.who.map((n) => `<span${main && !main(n) ? ' class="person__with"' : ''}>${personNameHtml(n)}</span>`).join(esc(comma()))}</p><p class="person__did"${standIn.people(pieceId)}>${esc(did)}</p></div>${pics ? `<div class="person__pics">${pics}</div>` : ''}</li>`;
};
/**
 * The page of one person: who they were, where an account has been written (data/person-bios.ts), every line the
 * museum has on them with its piece, the sources those rest on, and where to read more outside the museum.
 */
function personView(slug: string): void {
  const who = personBySlug(slug);
  if (!who) return notFound();
  const bio = bios[who.name], out = personLinks[who.name], pic = portraits[who.name];
  const lines = who.on.map(({ piece, k }) => said.credit(piece, people[piece]).did[k]);
  const first = pieceById(who.on[0].piece)!;
  document.title = titled(who.name);
  // the account in the language in use or, where it is not translated yet, in English and marked as English
  const about = bio ? said.bio(who.slug, bio.about) : [], english = bio ? standIn.bio(who.slug, bio.about) : '';
  says(brief(lines[0]));
  const life = lifeOf(bio);
  const told = toursNow();
  // the guided tours that tell of this person, each on the card the entrance shows it on
  const lanes = trails.filter((tr) => who.on.some(({ entry }) => tr.who(entry).includes(who.name)))
    .map((tr) => told.find((x) => x.id === tr.id)).filter((tour): tour is Tour => !!tour).map(tourCard).join('');
  const sources = personSources(who);
  const i = persons.indexOf(who), prev = persons[i - 1], next = persons[i + 1];
  // the picture: the portrait hung on the wall as a framed drawing or, where the museum has none, the piece itself
  const picture = pic
    ? `<figure class="pers__fig"><div class="pers__wall"><img class="pers__portrait" src="./people/${esc(pic.file)}" alt="${esc(who.name)}" decoding="async" fetchpriority="high"></div><figcaption class="pers__credit">${portraitCredit(who.name)}</figcaption></figure>`
    : `<figure class="pers__fig"><a class="pers__wall pers__wall--piece" href="${link(`piece-${first.id}`)}"><img data-poster="${first.id}" src="${poster(first.id, 760)}" srcset="${posterSet(first.id)}" sizes="(min-width: 980px) 44vw, 100vw" width="760" height="760" alt="${tx('stage.poster', { name: said.piece(first).name })}" decoding="async" fetchpriority="high"></a><figcaption class="pers__credit">${esc(said.piece(first).name)}</figcaption></figure>`;
  const rows = who.on.map(({ piece, entry }, n) => {
    const p = pieceById(piece)!, hall = hallById(p.hall), withThem = entry.who.filter((name) => name !== who.name);
    return `<li class="pers__on" data-hall="${p.hall}"><a class="pers__thumb" href="${link(`piece-${p.id}`)}" tabindex="-1" aria-hidden="true"><img data-poster="${p.id}" src="${poster(p.id, 380)}" alt="" width="380" height="380" loading="lazy" decoding="async"></a><div class="pers__what"><a class="crumb" href="${link(`hall-${hall.id}`)}"><b>${hall.id}</b><span>${esc(said.hall(hall).name)}</span></a><h3 class="pers__piece"><a href="${link(`piece-${p.id}`)}">${esc(said.piece(p).name)}</a></h3><p${standIn.people(piece)}>${esc(lines[n])}</p>${withThem.length ? `<p class="pers__with">${tx('person.with', { names: '\u0001' }).replace('\u0001', withThem.map(personNameHtml).join(esc(comma())))}</p>` : ''}</div></li>`;
  }).join('');
  shell(`
<article class="pers" data-hall="${first.hall}">
  ${picture}
  <div class="stack">
    <p class="crumbs"><a class="crumb pers__back" href="${link('people')}">${tx('people.more')}</a></p>
    <h1 class="plate" style="display:block"><span class="plate__title">${esc(who.name)}</span>${life ? `<span class="plate__sub">${life}</span>` : ''}</h1>
    ${about.length ? `<p class="lead pers__lead"${english}>${esc(about[0])}</p>${about.length > 1 ? `<div class="prose"${english}>${about.slice(1).map((line) => `<p>${esc(line)}</p>`).join('')}</div>` : ''}` : ''}
    <section class="pers__sec"><h2 class="h-sec">${tx('person.in')}</h2><ul class="pers__list">${rows}</ul></section>
    ${lanes ? `<div class="pers__tours">${lanes}</div>` : ''}
    ${sources.length ? `<section class="pers__sec"><h2 class="h-sec">${tx('piece.sources')}</h2><ol class="sources">${sourceItems(sources)}</ol></section>` : ''}
    ${out ? `<section class="pers__sec"><h2 class="h-sec">${tx('person.elsewhere')}</h2><ol class="sources">${elsewhereItem(out)}</ol></section>` : ''}
    <nav class="pager" aria-label="${tx('nav.people')}">${prev ? `<a href="${link(`person-${prev.slug}`)}">${tx('pager.back', { name: prev.name })}</a>` : `<a href="${link('people')}">${tx('people.more')}</a>`}${next ? `<a href="${link(`person-${next.slug}`)}">${tx('pager.next', { name: next.name })}</a>` : ''}</nav>
  </div>
</article>`, undefined, 'people');
}

/** The trail whose people the People page is narrowed to, or nothing for everyone. */
let peopleOnly: '' | Trail['id'] = '';
function peopleView(): void {
  const asked = new URLSearchParams(location.search).get('who');
  if (asked !== null) peopleOnly = trailById(asked)?.id ?? '';
  document.title = titled(t('nav.people'));
  says(t('people.lead'));
  const pill = (value: string, label: string) => `<label class="pill"><input type="radio" name="who" value="${value}"${peopleOnly === value ? ' checked' : ''}><span>${label}</span></label>`;
  shell(`
<div class="stack">
  <div class="pagehead"><h1 class="title">${tx('nav.people')}</h1><p class="lead">${tx('people.lead')}</p></div>
  <form class="filters" id="who"><fieldset><legend>${tx('people.show')}</legend><div class="filters__keys">${pill('', tx('people.all'))}${trails.map((tr) => pill(tr.id, tx(`trail.${tr.id}`))).join('')}</div></fieldset></form>
  <p class="ways jump" id="who-jump" role="group" aria-label="${tx('people.jump')}"><span class="jump__word" aria-hidden="true">${tx('people.jump')}</span>${halls.map((h) => `<button type="button" class="btn" data-jump="${h.id}" aria-label="${tx('nav.hall', { n: h.id, name: said.hall(h).name })}">${h.id}</button>`).join('')}</p>
  <p class="count" id="who-count" role="status"></p>
  <p class="ways" id="who-walk" hidden></p>
  <div class="stack" id="who-rows" style="--gap: 44px"></div>
  <section class="stack" id="who-list" style="--gap: 6px" hidden></section>
</div>`, undefined, 'people');
  const rows = document.getElementById('who-rows')!, tally = document.getElementById('who-count')!;
  const walk = document.getElementById('who-walk')!, written = document.getElementById('who-list')!;
  const draw = () => {
    const tr = trailById(peopleOnly), names = new Set<string>();
    rows.innerHTML = halls.map((h) => {
      const blocks = inHall(h.id).map((p) => {
        const c = people[p.id];
        if (!c) return '';
        const told = said.credit(p.id, c);
        const list = c.people.map((e, k) => ({ e, did: told.did[k] })).filter(({ e }) => !tr || tr.who(e).length);
        if (!list.length) return '';
        for (const { e } of list) for (const n of tr ? tr.who(e) : e.who) names.add(n);
        return `<section class="who"><h3 class="who__piece"><a href="${link(`piece-${p.id}`)}">${esc(said.piece(p).name)}</a></h3><ul class="people__list">${list.map(({ e, did }) => entryHtml(p.id, e, did, tr ? (n) => tr.who(e).includes(n) : undefined)).join('')}</ul></section>`;
      }).join('');
      return blocks ? `<section class="stack" style="--gap: 4px" data-hall="${h.id}"><h2 class="h-sec who__hall"><b class="who__no" aria-hidden="true">${h.id}</b><span>${tx('hall.title', { n: h.id, name: said.hall(h).name })}</span></h2><div class="who__grid">${blocks}</div></section>` : '';
    }).join('');
    tally.textContent = t('people.count', { n: names.size });
    // a hall with nobody to show under this choice cannot be gone to
    for (const b of document.querySelectorAll<HTMLButtonElement>('#who-jump [data-jump]')) b.disabled = !rows.querySelector(`[data-hall="${b.dataset.jump}"]`);
    // the way into the halls along the trail: its guided tour where the language tells one, or the trail itself
    const tour = tr ? toursNow().find((x) => x.id === tr.id) : undefined;
    walk.hidden = !tr;
    walk.innerHTML = !tr ? '' : tour ? `<a class="btn btn--go" href="${link(tourName(tour))}">${tx('tour.take')}</a><a class="btn" href="${link(`words-${tour.id}`)}">${tx('tour.whole')}</a>` : `<a class="btn btn--go" href="${link(`walk-${tr.stops[0] ?? ''}`)}" data-trail="${tr.id}">${tx('trail.walk')}</a>`;
    // a trail whose people are written down by name shows the source that each name rests on
    const list = tr?.list?.filter((x) => names.has(x.name)) ?? [];
    written.hidden = !list.length;
    written.innerHTML = list.length ? `<h2 class="h-sec">${tx('trail.list')}</h2><p class="prose">${tr?.id === 'black' ? tx('trail.list.black') : ''}</p><ol class="sources">${list.map((x) => `<li><span class="kind">${esc(x.name)}</span><a href="${esc(x.source.url)}" rel="noopener">${esc(x.source.label)}</a></li>`).join('')}</ol>` : '';
  };
  walk.addEventListener('click', keepTrail);
  document.getElementById('who-jump')!.addEventListener('click', (ev) => {
    const to = (ev.target as Element).closest<HTMLElement>('[data-jump]')?.dataset.jump;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (to) rows.querySelector(`[data-hall="${to}"]`)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  });
  document.getElementById('who')!.addEventListener('change', (ev) => {
    peopleOnly = trailById((ev.target as HTMLInputElement).value)?.id ?? '';
    // the choice is written in the address, so that a reload or a link sent on opens the same list
    const url = new URL(location.href);
    if (peopleOnly) url.searchParams.set('who', peopleOnly); else url.searchParams.delete('who');
    try { history.replaceState(history.state, '', url.pathname + url.search + url.hash); } catch { /* the address is a courtesy */ }
    draw();
  });
  draw();
}

// ---------- a guided tour on the main page ----------

const HEADPHONES = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v5a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H6a6 6 0 0 1 12 0h-1a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a2 2 0 0 0 2-2v-5a8 8 0 1 0-16 0z"/></svg>';

/**
 * A guided tour, offered on the main page in every language that tells it: the band of the walk, with the line
 * and its stops, what the tour is, and how long the guide speaks where she has been recorded in that language.
 * The whole of it is one link. Following it is the click that lets the guide begin.
 */
function tourCard(tour: Tour): string {
  const own = said.tour(tour)!, minutes = spokenMinutes(tour);
  return `<a class="tourcard" href="${link(tourName(tour))}" style="--trail: ${trailById(tour.id)?.colour ?? '#1f9d55'}; --stops: ${tourStops(tour).length}">
    <span class="tourcard__line" aria-hidden="true"></span>
    <span class="tourcard__kind">${tx('tour.label')}</span>
    <strong class="tourcard__title">${esc(own.title)}</strong>
    <span class="tourcard__lead">${esc(own.lead)}</span>
    <span class="tourcard__foot"><span class="tourcard__go">${tx('tour.take')}</span>${minutes ? `<span class="tourcard__audio">${HEADPHONES}${tx('tour.spoken', { n: minutes })}</span>` : ''}</span>
  </a>
  <p class="tourcard__more"><a href="${link(`words-${tour.id}`)}">${tx('tour.whole')}</a></p>`;
}

// ---------- the words of a guided tour, on one page ----------
function wordsView(id: string): void {
  const tour = tourById(id);
  if (!tour || !said.tour(tour)) return notFound();
  if (tour.draft) preview();
  document.title = titled(said.tour(tour)!.title);
  says(said.tour(tour)!.lead);
  shell(tourPageHtml(tour));
}

// ---------- piece ----------
/** The day of the last change to the museum, put in by the build. Empty when the build could not tell. */
declare const __CHANGED__: string;
/** That day in the visitor's language, as a line for the About page. */
function changedOn(): string {
  const day = typeof __CHANGED__ === 'string' && /^\d{4}-\d\d-\d\d$/.test(__CHANGED__) ? new Date(`${__CHANGED__}T12:00:00Z`) : null;
  if (!day) return '';
  const date = new Intl.DateTimeFormat(langNow().tag, { dateStyle: 'long', timeZone: 'UTC' }).format(day);
  return `<p class="small muted"><time datetime="${__CHANGED__}">${tx('about.changed', { date })}</time></p>`;
}
/** The trails a piece is a stop of, each with the colour of its line on the floor and the way onto it: its guided tour where the language tells one, or the walk. */
function linesHtml(id: string): string {
  const on = trails.filter((tr) => tr.stops.includes(id));
  if (!on.length) return '';
  return `<p class="lines">${on.map((tr) => {
    const tour = toursNow().find((x) => x.id === tr.id);
    return `<a class="line" style="--trail: ${tr.colour}" href="${link(tour ? tourName(tour, id) : `walk-${id}`)}" data-trail="${tr.id}"><span class="line__mark" aria-hidden="true"></span>${tx('piece.line', { name: t(`trail.${tr.id}`) })}</a>`;
  }).join('')}</p>`;
}

// ---------- the short visit: three pieces, each with a note above it ----------
const VISIT_NOTES = ['visit.note.1', 'visit.note.2', 'visit.note.3'] as const;
/** The band above a piece that is a stop of the short visit: where the visitor is, what to notice, and the way on. */
function visitBand(step: number): string {
  const next = visit[step + 1], to = next ? pieceById(next) : undefined;
  return `<aside class="visit" aria-label="${tx('visit.kind')}">
  <p class="visit__step">${tx('visit.step', { n: step + 1, of: visit.length })}</p>
  <p class="visit__note">${tx(VISIT_NOTES[step])}</p>
  <p class="visit__go"><a class="btn" href="${link(`visit-${to ? to.id : 'end'}`)}">${to ? tx('visit.next', { name: said.piece(to).name }) : tx('visit.finish')}</a><a href="${link(`piece-${visit[step]}`)}">${tx('visit.leave')}</a></p>
</aside>`;
}
/** `#visit` is the first stop, `#visit-<piece>` a stop, and `#visit-end` the page after the last one. */
function visitView(at?: string): void {
  if (at === 'end') return visitEnd();
  const step = at ? visit.indexOf(at) : 0;
  if (step < 0) return notFound();
  pieceView(visit[step], step);
}
function visitEnd(): void {
  document.title = titled(t('visit.kind'));
  shell(`
<div class="stack">
  <div class="stack prose" style="--gap: 12px">
    <h1 class="title">${tx('visit.end.title')}</h1>
    <p>${tx('visit.end.1')}</p>
    <p>${tx('visit.end.2')}</p>
  </div>
  <p class="ways"><a class="btn btn--go" href="${link('walk')}">${tx('walk.title')}</a><a class="btn" href="${link('hall-1')}">${tx('entrance.start')}</a><a class="btn" href="${link('index')}">${tx('entrance.browse')}</a></p>
  ${toursNow().map(tourCard).join('')}
</div>`);
}

/** The hall whose pieces are about depth. Only there does a piece offer red and cyan glasses. */
const DEPTH = 7;
function pieceView(id: string, step?: number): void {
  const p = pieceById(id);
  if (!p) return notFound();
  const hall = hallById(p.hall), x = said.piece(p);
  const all = pieces, i = all.indexOf(p), prev = all[i - 1], next = all[i + 1];
  // a piece made to be looked into or sat in front of gets a button that puts the visitor there, in place of the plain front view
  const places = viewsOf(p.id).map((v) => ({ ...v, ...said.view(p.id, v) }));
  // the name a search engine lists the page under says what the page answers
  document.title = titled(t('title.piece', { name: x.name }));
  says(x.lead);
  // one thing worth repeating, with the source it rests on. That source joins the list at the foot of the page
  const fact = facts[p.id];
  // the people behind the piece, and the sources that name them
  const credit = people[p.id], told = credit ? said.credit(p.id, credit) : undefined;
  const sources = [...p.sources];
  for (const extra of [...(fact ? [fact.source] : []), ...(credit?.sources ?? [])]) if (!sources.some((src) => src.url === extra.url)) sources.push(extra);
  const row = (k: string, v: string) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  shell(`
${step === undefined ? '' : visitBand(step)}
<article class="piece">
  <div class="stage" id="stage">
    <!-- the keys over the picture come first, so the keyboard meets them in the order the eye does -->
    <div class="stage__tools">${daylightKey(lightsOn, tx('switch.daylight'))}<button type="button" class="btn btn--icon" data-act="stereo" aria-pressed="false" aria-label="${tx('stage.stereo')}" title="${tx('stage.stereo')}" disabled${p.hall === DEPTH ? '' : ' hidden'}>${GLASSES}</button>${bareKey('data-act="bare"', tx('stage.clear'))}${fullKey('data-act="full"', tx('stage.expand'))}</div>
    <div class="stage__box" id="stage-box"><img class="stage__poster" id="stage-poster" data-poster="${p.id}" src="${poster(p.id, 760)}" srcset="${posterSet(p.id)}" sizes="(min-width: 900px) 50vw, 100vw" width="760" height="760" alt="${tx('stage.poster', { name: x.name })}" fetchpriority="high" decoding="async"><button type="button" class="btn stage__start" data-act="start" hidden>${tx('stage.start')}</button></div>
    <p class="stage__hint" id="stage-hint"></p>
    <p class="stage__note" id="stage-note" role="status"></p>
    <div class="stage__views" id="stage-views" role="group" aria-label="${tx('stage.views')}"><button type="button" class="btn" data-act="home">${tx('stage.home')}</button>${places.some((v) => v.kind === 'person') ? '' : `<button type="button" class="btn" data-act="front">${tx('stage.front')}</button>`}${places.map((v) => `<button type="button" class="btn" data-view="${v.id}" aria-pressed="false">${esc(v.label)}</button>`).join('')}<button type="button" class="btn" data-act="ar" disabled hidden>${tx('stage.ar')}</button></div>
    <p class="stage__say" id="stage-say" aria-live="polite"></p>
    <p class="bare__hint" id="stage-bare" aria-live="polite"></p>
  </div>
  <div class="stack">
    <p class="crumbs"><a class="crumb" href="${link(`hall-${hall.id}`)}"><b>${hall.id}</b><span>${esc(said.hall(hall).name)}</span></a><a class="crumbs__walk" href="${link(`walk-${p.id}`)}">${tx('walk.piece')}</a><button type="button" class="btn crumbs__share" data-share="${link(`piece-${p.id}`)}" data-title="${esc(x.name)}">${tx('piece.share')}</button><button type="button" class="btn crumbs__share" data-embed="${p.id}" data-title="${esc(x.name)}" aria-expanded="false" aria-controls="embed-code">${tx('embed.button')}</button></p>
    <div class="embed-code" id="embed-code" hidden><p>${tx('embed.says')}</p><textarea readonly rows="3" aria-label="${tx('embed.button')}"></textarea><button type="button" class="btn" data-embed-copy>${tx('embed.copy')}</button></div>
    <h1 class="plate" style="display:block"><span class="plate__title">${esc(x.name)}</span>${x.aka ? `<span class="plate__sub">${tx('piece.aka', { names: x.aka })}</span>` : ''}</h1>
    <p class="lead">${esc(x.lead)}</p>
    <section class="stack" style="--gap: 10px"><h2 class="h-sec">${tx('piece.look')}</h2><p class="prose">${esc(x.look)}</p><div id="surface"></div></section>
    ${soundSection(sounds[p.id])}
    ${fact ? `<section class="fact stack" style="--gap: 8px"><h2 class="h-sec">${tx('piece.fact')}</h2><p class="fact__text"${standIn.fact(p.id)}>${esc(said.fact(p.id, fact.text))}</p><p class="small muted">${rich('piece.fact.source', { a: fact.source.url }, { label: fact.source.label })}</p></section>` : ''}
    <dl class="card">
      ${row(tx('card.no'), inv(p))}
      ${row(tx('card.year'), esc(x.yearText ?? String(p.year)))}
      ${row(tx('card.origin'), esc(x.origin))}
      ${row(tx('card.status'), `${esc(said.status(p.status))}. ${esc(x.statusNote)}`)}
      ${row(tx('card.principle'), esc(said.principle(p.principle)))}
      ${p.needs.length ? row(tx('card.properties'), esc(p.needs.map((n) => said.need(n)).join('. '))) : ''}
    </dl>
    ${credit && told ? `<section class="people stack" style="--gap: 8px"><h2 class="h-sec">${tx('piece.people')}</h2><ul class="people__list">${credit.people.map((e, k) => entryHtml(p.id, e, told.did[k])).join('')}</ul>${linesHtml(p.id)}${told.note ? `<p class="people__note"${standIn.people(p.id)}>${esc(told.note)}</p>` : ''}<p class="small"><a href="${link('people')}">${tx('people.more')}</a></p></section>` : ''}
    ${archiveSection(p.id)}
    <section class="stack" style="--gap: 10px"><h2 class="h-sec">${tx('piece.how')}</h2><div class="prose">${x.how.map((par) => `<p>${esc(par)}</p>`).join('')}</div></section>
    <div class="duo">
      <section><h3>${tx('piece.good')}</h3><ul>${x.good.map((li) => `<li>${esc(li)}</li>`).join('')}</ul></section>
      <section><h3>${tx('piece.bad')}</h3><ul>${x.bad.map((li) => `<li>${esc(li)}</li>`).join('')}</ul></section>
    </div>
    <section class="stack" style="--gap: 6px"><h2 class="h-sec">${tx('piece.sources')}</h2><ol class="sources">${sources.map((src) => `<li><span class="kind">${esc(said.sourceKind(src.kind))}</span><a href="${esc(src.url)}" rel="noopener">${esc(src.label)}</a></li>`).join('')}</ol></section>
    <nav class="pager" aria-label="${tx('pager.pieces')}">${prev ? `<a href="${link(`piece-${prev.id}`)}">${tx('pager.back', { name: said.piece(prev).name })}</a>` : `<a href="${link('')}">${tx('pager.entrance')}</a>`}${next ? `<a href="${link(`piece-${next.id}`)}">${tx('pager.next', { name: said.piece(next).name })}</a>` : `<a href="${link('index')}">${tx('pager.depot')}</a>`}</nav>
  </div>
</article>`, p.hall);

  const box = document.getElementById('stage-box')!, wrap = document.getElementById('stage')!;
  const note = document.getElementById('stage-note')!, hint = document.getElementById('stage-hint')!;
  const views = document.getElementById('stage-views')!, still = document.getElementById('stage-poster') as HTMLImageElement;
  const act = (name: string) => wrap.querySelector<HTMLButtonElement>(`[data-act="${name}"]`)!;
  const startBtn = act('start'), fullBtn = act('full'), stereoBtn = act('stereo'), arBtn = act('ar');
  const HINT = { turn: t('stage.hint.turn'), person: t('stage.hint.person'), detail: t('stage.hint.detail') };
  // alive: this page is still the one on screen. live: its model is running. seen: the stage is in the window.
  let alive = true, live = false, begun = false, seen = true, wantFocus = false;
  const tell = (text: string) => { hint.textContent = text; hint.style.opacity = '1'; };
  const caption = document.getElementById('stage-say')!;
  const say = (on: boolean) => {
    const d = live ? stage?.inDark : undefined;
    note.textContent = !on && d === 'vanishes' ? t('stage.note.vanishes') : on && d === 'better' ? t('stage.note.better') : '';
  };
  /** Look from one of the piece's own places. The same button again, or null, goes back to the whole piece. */
  let darkened = false;
  const setView = (id: string | null) => {
    if (!stage || !live) return;
    const v = id && stage.inView !== id ? places.find((x) => x.id === id) : undefined;
    if (v) stage.goView(v.id, v.kind === 'detail'); else stage.goHome();
    // a view meant for the dark switches the daylight off, and leaving it puts the daylight back if it took it away
    if (v?.dark && lightsOn) { setLights(false); darkened = true; } else if (!v?.dark && darkened) { darkened = false; if (!lightsOn) setLights(true); }
    for (const b of views.querySelectorAll<HTMLElement>('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === v?.id));
    // how to move goes over the picture and fades at the first touch. What the view shows stays, under the buttons
    tell(v ? HINT[v.kind] : HINT.turn);
    caption.textContent = v?.hint ?? '';
    if (v && standIn.view(p.id, v.id)) caption.lang = 'en'; else caption.removeAttribute('lang');
  };
  // Full view takes one step in the browser's history, so the back button of a phone closes it and stays on the page.
  let stepped = false;
  const setFull = (full: boolean, byBack = false) => {
    if (full === wrap.classList.contains('is-full')) return;
    if (full) { try { history.pushState({ full: true }, ''); stepped = true; } catch { stepped = false; } }
    else if (stepped) { stepped = false; if (!byBack) history.back(); }
    wrap.classList.toggle('is-full', full);
    nameFullKey(fullBtn, full, t(full ? 'stage.close' : 'stage.expand'));
    document.body.style.overflow = full ? 'hidden' : '';
    // while the stage covers the page, nothing behind it can be reached by key or by screen reader
    for (const el of document.querySelectorAll<HTMLElement>('body > .vh, .top, .piece > :not(.stage), .foot')) el.inert = full;
    stage?.setFree(full);
    stage?.resize();
  };
  const press = (name: string) => { const b = wrap.querySelector<HTMLButtonElement>(`[data-act="${name}"]`); if (b && !b.disabled) b.click(); };
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape' && wrap.classList.contains('is-full')) return setFull(false);
    const on = document.activeElement as HTMLElement | null, inStage = !!on?.closest('#stage');
    if (on === stageCanvas && stage && live) {
      const k: Record<string, [number, number, number]> = { ArrowLeft: [-12, 0, 1], ArrowRight: [12, 0, 1], ArrowUp: [0, 8, 1], ArrowDown: [0, -8, 1], '+': [0, 0, 0.88], '=': [0, 0, 0.88], '-': [0, 0, 1.14] };
      if (k[e.key]) { e.preventDefault(); return stage.nudge(...k[e.key]); }
    }
    if (inStage) {
      // with the stage in focus, one key does what its button does. Only there, so that typing elsewhere is never hijacked
      const key = e.key.toLowerCase();
      const act = ({ d: 'daylight', f: 'full', g: 'stereo', r: 'home', '0': 'home' } as Record<string, string>)[key];
      if (act === 'daylight') setLights(!lightsOn); else if (act) press(act);
      else if (/^[1-9]$/.test(key)) [...views.querySelectorAll<HTMLButtonElement>('button')].filter((b) => !b.disabled)[Number(key) - 1]?.click();
      return;
    }
    // anywhere else on the page, left and right step through the collection
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(on?.tagName ?? '')) return;
    const to = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : undefined;
    if (to) goTo(link(`piece-${to.id}`));
  };
  // without the model there is nowhere to look from, so the row of places goes too
  const fail = (why: string) => { hint.textContent = ''; note.textContent = why; startBtn.hidden = true; views.hidden = true; caption.textContent = ''; };
  /** A place the visitor asked for before the model was running. It is taken up as soon as the model is. */
  let askedFor: string | null = null;

  /** Bring the model to life over its still picture. Only this needs three.js. */
  let unspread: (() => void) | null = null;
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
      if (wantsBeyond(hardware === false)) { unspread?.(); unspread = spread(stage, box); }
      // the first frame is drawn: let it come up over the still picture, then take the picture away
      requestAnimationFrame(() => { cv.classList.add('is-live'); window.setTimeout(() => { if (alive) still.hidden = true; }, 420); });
      for (const b of views.querySelectorAll<HTMLButtonElement>('button')) b.disabled = !!b.dataset.view && !stage.hasView(b.dataset.view);
      arBtn.hidden = !(await canShowInRoom());
      if (import.meta.env.DEV) for (const v of places) if (!stage.hasView(v.id)) console.warn(`${p.id}: the view "${v.id}" has words but the model gives it no place`);
      stereoBtn.disabled = false;
      // the glasses are offered in the hall about depth only: a stage that comes from there with them on takes them off
      if (p.hall !== DEPTH && stage.isStereo) stage.setStereo(false);
      stereoBtn.setAttribute('aria-pressed', String(stage.isStereo));
      tell(HINT.turn);
      say(lightsOn);
      if (askedFor === '@front') stage.goFront(); else if (askedFor && stage.hasView(askedFor)) setView(askedFor);
      askedFor = null;
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
    // a place to look from starts the model if it is not running yet, and goes there once it is
    if (el.dataset.view) { if (live) setView(el.dataset.view); else { askedFor = el.dataset.view; void go(); } }
    if (name === 'start') { wantFocus = true; void go(); }
    if ((name === 'front' || name === 'home') && !live) { askedFor = name === 'front' ? '@front' : null; void go(); }
    else if (name === 'front') { setView(null); stage?.goFront(); }
    else if (name === 'home') setView(null);
    if (name === 'stereo' && stage && live && p.hall === DEPTH) {
      stage.setStereo(!stage.isStereo);
      stereoBtn.setAttribute('aria-pressed', String(stage.isStereo));
      if (stage.isStereo) tell(t('stage.stereo.on')); else tell(HINT.turn);
    }
    if (name === 'ar' && live) {
      // the piece is built a second time, table sized, and stands in the visitor's own room for as long as they look
      arBtn.disabled = true;
      tell(t('stage.ar.preparing'));
      void import('./three/ar').then(({ showInRoom }) => showInRoom(p.id, { hint: t('stage.ar.hint'), placed: t('stage.ar.placed'), close: t('stage.close') }))
        .then(() => tell(HINT.turn), () => { hint.textContent = ''; note.textContent = t('stage.ar.fail'); })
        .finally(() => { arBtn.disabled = false; });
    }
    if (name === 'full') setFull(!wrap.classList.contains('is-full'));
    if (name === 'bare') bare.set(!bare.on);
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

  // The still picture stands for a scene that can be turned, and nothing on it says so. Until the model runs,
  // whatever a hand or a mouse does to the picture brings the model up and does nothing else: a press, the start
  // of a drag, a tap, or a mouse that comes to rest on it. A mouse that only crosses the picture starts nothing,
  // and neither does one on a device that has asked to save data: there a press is what asks.
  let resting = 0;
  const wake = (e: Event) => {
    if (begun || !alive || (e.target as Element).closest('button')) return;
    e.preventDefault();
    void go();
  };
  still.draggable = false;
  box.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') wake(e); });
  box.addEventListener('click', wake);
  box.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || begun || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    resting = window.setTimeout(() => void go(), 160);
  });
  box.addEventListener('pointerleave', () => window.clearTimeout(resting));

  // The still picture comes first. The model follows by itself where the device draws 3D with its graphics chip
  // and the visitor has not asked to save data. Anywhere else it waits for the button.
  if (stage) void go();
  else afterPicture(still, () => whenIdle(() => { if (!alive) return; if (wants3d()) void go(); else startBtn.hidden = false; }));

  const unwire = wireArchive(app, p.id, x.name);
  // a sideways swipe across the text steps to the next piece or the one before. Rows that scroll sideways keep their own gesture
  const words = app.querySelector<HTMLElement>('.piece > .stack')!;
  let x0 = 0, y0 = 0, free = false;
  words.addEventListener('touchstart', (e) => { x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY; free = !(e.target as HTMLElement).closest('.archive__row, a, button'); }, { passive: true });
  words.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (!free || Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 2.2) return;
    const to = dx < 0 ? next : prev;
    if (to) goTo(link(`piece-${to.id}`));
  }, { passive: true });

  const unsound = wireSounds(document.querySelector('.piece')!);
  // picture only: the piece on its stand, and nothing else on it
  const bare = openBare({
    root: wrap, hint: document.getElementById('stage-bare')!,
    keys: () => [act('bare')],
    canvas: () => wrap.querySelector<HTMLElement>('canvas.gl'),
    active: () => alive && seen,
  });
  const untap = onTap(box, () => { if (bare.on) bare.set(false); });
  leave = () => {
    alive = false; live = false;
    unsound(); bare.close(); untap();
    window.clearTimeout(resting);
    unwire();
    window.removeEventListener('popstate', onBack);
    setFull(false, true);
    watch.disconnect();
    document.removeEventListener('keydown', onKey);
    lightListeners.delete(relight);
    unspread?.(); unspread = null;
    stage?.stop();
    stageCanvas?.remove();
  };
}

// ---------- depot ----------
type Sort = 'hall' | 'year' | 'name';
const depotState: { principle: Principle | ''; status: Status | ''; needs: Set<Need>; sort: Sort } = { principle: '', status: '', needs: new Set(), sort: 'hall' };

function depot(): void {
  document.title = titled(t('depot.head'));
  says(t('depot.says'));
  const pill = (group: string, value: string, label: string, type: 'radio' | 'checkbox', checked: boolean) =>
    `<label class="pill"><input type="${type}" name="${group}" value="${value}" id="f-${group}-${value || 'any'}"${checked ? ' checked' : ''}><span>${label}</span></label>`;
  const s = depotState;
  shell(`
<div class="stack">
  <div class="pagehead"><h1 class="title">${tx('depot.title')}</h1><p class="lead">${tx('depot.lead')}</p></div>
  <form class="filters" id="filters">
    <fieldset><legend>${tx('depot.light')}</legend><div class="filters__keys">${pill('principle', '', tx('depot.any'), 'radio', s.principle === '')}${(Object.keys(PRINCIPLE_LABEL) as Principle[]).map((k) => pill('principle', k, esc(said.principle(k)), 'radio', s.principle === k)).join('')}</div></fieldset>
    <fieldset><legend>${tx('depot.must')}</legend><div class="filters__keys">${(Object.keys(NEED_LABEL) as Exclude<Need, 'dark'>[]).filter((k) => (k as Need) !== 'dark').map((k) => pill('needs', k, tx(`depot.must.${k}`), 'checkbox', s.needs.has(k))).join('')}</div></fieldset>
    <fieldset><legend>${tx('depot.status')}</legend><div class="filters__keys">${pill('status', '', tx('depot.any'), 'radio', s.status === '')}${(Object.keys(STATUS_LABEL) as Status[]).map((k) => pill('status', k, esc(said.status(k)), 'radio', s.status === k)).join('')}</div></fieldset>
    <fieldset><legend>${tx('depot.order')}</legend><div class="filters__keys">${pill('sort', 'hall', tx('depot.sort.hall'), 'radio', s.sort === 'hall')}${pill('sort', 'year', tx('depot.sort.year'), 'radio', s.sort === 'year')}${pill('sort', 'name', tx('depot.sort.name'), 'radio', s.sort === 'name')}</div></fieldset>
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
    document.getElementById('count')!.textContent = list.length === pieces.length ? t('depot.count.all') : list.length ? t('depot.count.some', { n: list.length, total: pieces.length }) : t('depot.count.none');
    document.getElementById('rows')!.innerHTML = list.map((p) => `<a class="row" href="${link(`piece-${p.id}`)}" data-hall="${p.hall}"><span class="row__hall" aria-hidden="true">${p.hall}</span><span><span class="row__name">${esc(said.piece(p).name)}</span><br><span class="small muted">${esc(said.piece(p).lead)}</span></span><span style="text-align:right"><span class="row__year">${yearOf(p)}</span><br>${chip(p.status)}</span></a>`).join('');
  };
  form.addEventListener('change', draw);
  form.addEventListener('submit', (e) => e.preventDefault());
  draw();
}

// ---------- about ----------
function about(): void {
  document.title = titled(t('nav.about'));
  says(t('about.says'));
  const kinds = new Map<SourceKind, number>();
  for (const p of pieces) {
    const own = facts[p.id]?.source;
    for (const src of own && !p.sources.some((q) => q.url === own.url) ? [...p.sources, own] : p.sources) kinds.set(src.kind, (kinds.get(src.kind) ?? 0) + 1);
  }
  const total = [...kinds.values()].reduce((a, b) => a + b, 0);
  const byKind = [...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${said.sourceKind(k)}`).join(comma());
  const held = archiveCount();
  shell(`
<div class="stack">
  <div class="pagehead"><h1 class="title">${tx('nav.about')}</h1><p class="lead">${tx('about.lead')}</p></div>
  <div class="split">
    <section class="stack prose" style="--gap: 12px">
      <h2 class="h-sec">${tx('about.piece')}</h2>
      <p>${tx('about.piece.1')}</p>
      <h2 class="h-sec">${tx('about.sourced')}</h2>
      <p>${tx('about.sourced.1')}</p>
      <p>${tx('about.sourced.2', { links: total, kinds: byKind })}</p>
      <p>${tx('about.sourced.3')}</p>
      <h2 class="h-sec">${tx('about.pictures')}</h2>
      <p>${tx('about.pictures.1')}</p>
      <p>${tx('about.pictures.2')}</p>
      ${held ? `<p>${tx('about.pictures.archive')}</p>` : ''}
      ${Object.keys(portraits).length ? `<p>${tx('about.portraits')}</p>` : ''}
      ${toursNow().length ? `<p>${tx('about.tour')}</p>` : ''}
      ${held ? `<h2 class="h-sec">${tx('about.credits')}</h2><p>${tx('about.credits.1', { n: held })}</p>${creditsList()}` : ''}
      <h2 class="h-sec">${tx('about.corrections')}</h2>
      <p>${rich('about.corrections.1', { a: `${REPO}/issues`, b: REPO })}</p>
      <h2 class="h-sec">${tx('about.licence')}</h2>
      <p>${rich('about.licence.1', { a: LICENCE }, { name: AUTHOR })}</p>
      <p>${tx('about.licence.2')}</p>
      <p class="small muted">${rich('about.thanks', { a: 'https://blair-neal.gitbook.io/survey-of-alternative-displays' })}</p>
      <p class="small muted">${tx('about.author', { name: AUTHOR })}</p>
      ${changedOn()}
    </section>
    <section class="stack prose" style="--gap: 12px">
      <h2 class="h-sec">${tx('about.room')}</h2>
      <p>${tx('about.room.1')}</p>
      <p>${tx('about.room.2')}</p>
      <p>${tx('about.room.3')}</p>
      ${appHtml()}
      ${keepHtml()}
    </section>
  </div>
</div>`, undefined, 'about');
  void showKeep();
}

// ---------- walk: the whole museum in one hall ----------
/**
 * `toured` is a guided tour to take up in the halls, at one of its parts. In a language that does not tell the
 * tour, its address opens the walk on the tour's trail.
 */
/**
 * A piece inside someone else's page, in an iframe: the stage alone, filling the frame, with the name of the piece
 * and a way into the museum. It is the piece's own page with everything but the stage put away, so it works as the
 * stage does, in every language: `?embed#embed-nixie-tube`, `ca/?embed#embed-nixie-tube`.
 */
function embedView(id: string): void {
  const p = pieces.find((x) => x.id === id);
  if (!p) return notFound();
  document.documentElement.classList.add('embedded');
  pieceView(id);
  const own = new URL(link(`piece-${p.id}`), document.baseURI).href;
  document.getElementById('stage')?.insertAdjacentHTML('beforeend', `<a class="embed__name" href="${own}" target="_blank" rel="noopener">${esc(said.piece(p).name)}<span>${tx('site.name')}</span></a>`);
}

/** The code that puts a piece into another page. */
const embedCode = (id: string, name: string): string => {
  const at = new URL(`./${langNow().code === 'en' ? '' : `${langNow().code}/`}?embed#embed-${id}`, new URL('./', document.baseURI)).href;
  return `<iframe src="${at}" title="${esc(name)}" width="640" height="480" style="border:0;max-width:100%" allow="fullscreen; xr-spatial-tracking" loading="lazy"></iframe>`;
};
document.addEventListener('click', (e) => {
  const open = (e.target as Element).closest<HTMLButtonElement>('[data-embed]');
  if (open) {
    const box = document.getElementById('embed-code');
    if (!box) return;
    box.hidden = !box.hidden;
    open.setAttribute('aria-expanded', String(!box.hidden));
    const area = box.querySelector('textarea')!;
    area.value = embedCode(open.dataset.embed!, open.dataset.title ?? '');
    if (!box.hidden) { area.focus(); area.select(); }
    return;
  }
  const copy = (e.target as Element).closest<HTMLButtonElement>('[data-embed-copy]');
  if (copy) {
    const area = copy.parentElement!.querySelector('textarea')!;
    void navigator.clipboard?.writeText(area.value).then(() => { copy.textContent = t('embed.copied'); setTimeout(() => { if (copy.isConnected) copy.textContent = t('embed.copy'); }, 2200); }, () => { area.select(); });
  }
});

/** Whether the visitor has started the walk before, in this tab. */
const walkedHere = (): boolean => { try { return sessionStorage.getItem('walked') === '1'; } catch { return false; } };

function walkView(start?: string, toured?: { tour: Tour; part: string }): void {
  if (toured) {
    if (toured.tour.draft) preview();
    const stops = tourStops(toured.tour);
    start = toured.part === 'start' ? (said.tour(toured.tour) ? undefined : stops[0]?.id) : toured.part === 'end' ? stops[stops.length - 1]?.id : toured.part;
  }
  const title = (tour?: string) => { document.title = titled(tour ?? t('walk.title')); };
  title(toured ? said.tour(toured.tour)?.title : undefined);
  const from = start ? pieceById(start) : undefined;
  // the walk starts by itself where a mouse says the device can carry it, and for a visitor who has just asked for a tour
  const asked = !!toured && justAsked(), auto = wants3d() && (asked || walkedHere() || !matchMedia('(pointer: coarse)').matches);
  shell(`
<div class="walkpage">
  <div class="hallhead walk__lead"><h1 class="title">${tx('walk.title')}</h1><p class="lead">${tx('walk.lead')}</p></div>
  <div class="walk" id="walk" data-hall="${from?.hall ?? 1}"><div class="walk__view"><img class="walk__still" src="${hallPic(800)}" srcset="${hallPicSet()}" sizes="100vw" width="1600" height="900" alt="" fetchpriority="high" decoding="async"></div><div class="walk__wait"></div></div>
</div>`, undefined, 'walk');
  const host = document.getElementById('walk')!;
  let hall: { setLights(on: boolean): void; close(): void } | null = null, gone = false;
  const relight = (on: boolean) => hall?.setLights(on);
  lightListeners.add(relight);
  // a closer look at a piece in the hall is taken on the stand that the pages of the pieces share
  const lend = async (into: HTMLElement) => {
    const { Stage, builders } = await three();
    if (!stageCanvas) { stageCanvas = document.createElement('canvas'); stageCanvas.className = 'gl'; stageCanvas.tabIndex = 0; }
    const cv = stageCanvas;
    into.append(cv);
    try { stage ??= new Stage(cv, true); } catch (e) { cv.remove(); throw e; }
    stage.attach();
    return { stage, canvas: cv, build: (id: string) => builders[id]() };
  };
  void typed();
  void import('./walk').then(({ openWalk }) => { if (!gone) hall = openWalk(host, { start: from?.id, lights: lightsOn, auto, asked, switchHtml: daylightKey(lightsOn, t('switch.daylight')), tour: toured && { id: toured.tour.id, part: toured.part }, onTour: title, stage: lend }); })
    .catch(() => { hush(); host.innerHTML = `<p class="prose">${tx('walk.fail')}</p>`; });
  leave = () => { gone = true; lightListeners.delete(relight); hall?.close(); hush(); };
}

function notFound(): void {
  lost = true;
  document.title = titled(t('missing.page'));
  // one letter off a piece or a person, and the page names the place the visitor most likely meant
  const typed = typedPath(), m = /^(piece|person)\/([a-z0-9-]+)$/.exec(typed);
  const near = m ? closest(m[2], m[1] === 'piece' ? pieces.map((p) => p.id) : persons.map((x) => x.slug)) : undefined;
  const meant = near ? `<p class="prose">${rich('missing.near', { a: link(`${m![1]}-${near}`) }, { name: m![1] === 'piece' ? said.piece(pieces.find((p) => p.id === near)!).name : personBySlug(near)!.name })}</p>` : '';
  shell(`<div class="pagehead"><h1 class="title">${tx('missing.title')}</h1>${meant}<p class="prose">${rich('missing.text', { a: link(''), b: link('index') })}</p></div>`);
}

/** The word in `list` fewest edits away from `word`, if it is no more than two edits and a third of the word away. */
function closest(word: string, list: string[]): string | undefined {
  const far = (a: string, b: string) => {
    let row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      row = next;
    }
    return row[b.length];
  };
  let best: string | undefined, least = Math.min(2, Math.ceil(word.length / 3));
  for (const w of list) { const d = far(word, w); if (d <= least) { best = w; least = d - 1; } }
  return best;
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
    // every named view of every piece, each beside the whole piece: `#sheet?view=*`
    if (q.get('view') === '*') {
      for (const v of [undefined, ...viewsOf(p.id)]) {
        const url = await thumb(p.id, hallColour(p.hall), on, size, { view: v?.id, az: v ? undefined : 24, el: v ? undefined : 10, zoom: v ? undefined : 1, no: p.hall, w, h });
        grid.insertAdjacentHTML('beforeend', `<figure style="margin:0"><img src="${url}" width="${w}" height="${h}" alt=""><figcaption style="font:600 11px var(--text)">${inv(p)} ${p.id} ${v ? `${v.kind}: ${v.id}` : ''}</figcaption></figure>`);
      }
      continue;
    }
    // a named view: only the pieces that have it
    if (view && 'view' in view && !viewsOf(p.id).some((v) => v.id === view.view)) continue;
    const shot = view || q.has('w') ? { ...view, no: p.hall, w, h } : undefined;
    const url = await thumb(p.id, hallColour(p.hall), on, size, shot);
    grid.insertAdjacentHTML('beforeend', `<figure style="margin:0"><img src="${url}" width="${w}" height="${h}" alt=""><figcaption style="font:600 11px var(--text)">${inv(p)} ${p.id}</figcaption></figure>`);
  }
  document.body.dataset.ready = '1';
}

// ---------- router ----------
/**
 * The visitor's place. Each entry of the browser's history that the museum has drawn carries a number, its seat,
 * and how far down the page was scrolled is kept by seat while the page stays open.
 */
let seat = 0, newest = Date.now();
const places = new Map<number, number>();
window.addEventListener('scroll', () => { places.set(seat, window.scrollY); }, { passive: true });
window.addEventListener('pagehide', () => { try { sessionStorage.setItem(`y ${seat}`, String(Math.round(window.scrollY))); } catch { /* the place is not kept */ } });
const keptY = (n: number): number | undefined => { try { const v = sessionStorage.getItem(`y ${n}`); return v === null ? undefined : Number(v); } catch { return undefined; } };

/** Set by the page that says there is nothing at an address. */
let lost = false;
function route(): void {
  leave?.(); leave = null;
  // the place the address names: hall-2, piece-nixie-tube, index, about, walk, and nothing at all for the entrance
  const [name, query] = nameNow().split('?');
  lost = false;
  const hall = /^hall-(\d)$/.exec(name), piece = /^piece-([a-z0-9-]+)$/.exec(name), walk = /^walk(?:-([a-z0-9-]+))?$/.exec(name), words = /^words-([a-z0-9-]+)$/.exec(name), visited = /^visit(?:-([a-z0-9-]+))?$/.exec(name), toured = tourAt(name);
  const person = /^person-([a-z0-9-]+)$/.exec(name);
  if (name === 'sheet') { void sheet(new URLSearchParams(query ?? '')); return; }
  if (name === 'vista') { void import('./three/vista').then(({ landscape }) => landscape()).then(({ land, lights }) => { app.innerHTML = ''; for (const cv of [land, lights]) { cv.style.cssText = 'display:block;width:4096px;background:#cfd6dc;margin-bottom:8px'; app.append(cv); } lights.style.background = '#0a1020'; document.body.dataset.ready = '1'; }); return; }
  // the workshop that photographs the pieces for the walk: `scripts/cutouts.mjs` drives it
  if (name === 'cutouts') { void import('./three/walk/photo').then(({ workshop }) => workshop(app)); return; }
  const embedded = /^embed-([a-z0-9-]+)$/.exec(name);
  if (embedded) { embedView(embedded[1]); return; }
  if (!name) entrance();
  else if (hall) hallView(Number(hall[1]));
  else if (piece) pieceView(piece[1]);
  else if (name === 'index' || name === 'depot') depot();
  else if (name === 'about') about();
  else if (name === 'people') peopleView();
  else if (person) personView(person[1]);
  else if (walk) walkView(walk[1]);
  else if (toured) walkView(undefined, resumed(toured));
  else if (words) wordsView(words[1]);
  else if (visited) visitView(visited[1]);
  else notFound();
  // The address bar is brought to the address this place is written with: an old address with a # becomes the
  // folder of the place, and the language in use stands in front. An address with nothing behind it is left alone.
  const place = name === 'depot' ? 'index' : name;
  settle(lost ? null : place);
  // A place with words of its own has a page of its own on the server. That is the address a search engine should
  // take for it. The walk, a tour under way and the short visit are states of the entrance.
  const own = !lost && !link(place).includes('#');
  const canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canon) canon.href = new URL(link(own ? place : ''), document.baseURI).href;
  // what the page as the server sent it says of itself to a search engine is true of that place only
  for (const data of document.querySelectorAll<HTMLElement>('script[type="application/ld+json"]')) if (data.dataset.place !== `${langOfAddress()} ${place}`) data.remove();
  fitPlates();
  // A new place opens at its top. A place the visitor comes back to, with Back or Forward, or that is drawn again
  // in another language, opens where they left it.
  const st = history.state as { seat?: number } | null;
  // a page reloaded into a newer build, or by the visitor, comes back where it was read: the place is kept for the tab
  if (typeof st?.seat === 'number') { seat = st.seat; window.scrollTo(0, places.get(seat) ?? keptY(seat) ?? 0); }
  else {
    seat = ++newest;
    try { history.replaceState({ ...(history.state as object | null ?? {}), seat }, ''); } catch { /* the place is not kept */ }
    window.scrollTo(0, 0);
  }
  // After a step inside the site the link that was pressed is gone, and focus with it. A screen reader or a
  // keyboard then starts at the new page's heading, as it would on a page fresh from the server. The first page
  // and the walk keep the browser's own start.
  const was = document.activeElement;
  if (shown !== '' && !walk && !toured && !visited && (!was || was === document.body || !was.isConnected)) {
    const h = app.querySelector<HTMLElement>('h1');
    if (h) { if (!h.hasAttribute('tabindex')) h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  document.body.dataset.ready = '1';
  shown = name;
}

/**
 * From one page to the next, the way a visitor steps from the hall up to a piece: the picture they chose is carried
 * from its place in the list to the stand, and on the way back from the stand to its place. The rest of the page
 * changes under it in a short fade. Where the browser cannot do this, or the visitor has asked for stillness, the
 * page simply changes.
 */
let shown = '';
function go(): void {
  if (calm || typeof document.startViewTransition !== 'function') return route();
  const pictureOf = (name: string) => (/^piece-[a-z0-9-]+$/.test(name) ? document.querySelector<HTMLElement>(`a.tile[href="${link(name)}"] img`) : null);
  const carry = (img: HTMLElement | null) => img?.style.setProperty('view-transition-name', 'stage');
  const from = shown;
  carry(pictureOf(nameNow()));
  const change = document.startViewTransition(() => { route(); carry(pictureOf(from)); });
  const settle = () => { for (const img of document.querySelectorAll<HTMLElement>('a.tile img')) img.style.removeProperty('view-transition-name'); };
  change.finished.then(settle, settle);
  // a visitor who steps on before the change is over cuts it short, and that is no error
  change.ready.catch(() => undefined);
}

/**
 * The name of a hall is a single long word in some languages, and a plate cannot break a word. Where a plate would
 * be wider than the page, its lettering is made smaller until it fits. The plate of a piece is as wide as its column
 * and cannot grow: there a word too long for it would stick out of the plate, and is made smaller in the same way.
 */
function fitPlates(): void {
  for (const title of document.querySelectorAll<HTMLElement>('.plate .plate__title')) {
    title.style.fontSize = '';
    const plate = title.closest<HTMLElement>('.plate')!, within = plate.parentElement!;
    for (let i = 0; i < 6; i++) {
      const box = getComputedStyle(title), spill = title.scrollWidth - title.clientWidth;
      if (spill > 0.5) {
        const left = parseFloat(box.paddingLeft), room = title.clientWidth - left - parseFloat(box.paddingRight);
        title.style.fontSize = `${Math.max(15, (parseFloat(box.fontSize) * (room - 1)) / (title.scrollWidth - left))}px`;
        continue;
      }
      const over = plate.getBoundingClientRect().right - within.getBoundingClientRect().right, wide = title.getBoundingClientRect().width;
      if (over < 0.5 || wide < 40) break;
      title.style.fontSize = `${Math.max(15, (parseFloat(getComputedStyle(title).fontSize) * (wide - over - 1)) / wide)}px`;
    }
  }
}
let fitting = 0;
window.addEventListener('resize', () => { cancelAnimationFrame(fitting); fitting = requestAnimationFrame(fitPlates); });

root.dataset.lights = lightsOn ? 'on' : 'off';
// the museum as an app: wired before the router, so that a newer build can answer a change of page before the router does
wireApp();
wireKeep();
// a link onto a trail takes the trail with it, wherever the link stands
document.addEventListener('click', keepTrail);
// Share: the address of a piece's own page goes to the device's share sheet, or to the clipboard where there is none
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-share]');
  if (!btn) return;
  const url = new URL(btn.dataset.share ?? './', document.baseURI).href, title = btn.dataset.title ?? document.title;
  if (typeof navigator.share === 'function') { void navigator.share({ title, url }).catch(() => undefined); return; }
  void navigator.clipboard?.writeText(url).then(() => {
    btn.textContent = t('piece.copied');
    setTimeout(() => { if (btn.isConnected) btn.textContent = t('piece.share'); }, 2200);
  }, () => undefined);
});
void findKept();
// a link to a place of the museum, a step back or forward, a new name after the #: the place is drawn
wirePlaces(go);
/** A short word to the visitor at the top of the page, read out by a screen reader, gone after a few seconds. */
function note(text: string): void {
  const el = document.createElement('p');
  el.className = 'pagenote'; el.setAttribute('role', 'status');
  document.querySelector('.top')?.after(el);
  // a status said into a box that is already there is read; one that arrives with its words may not be
  requestAnimationFrame(() => { el.textContent = text; });
  window.setTimeout(() => el.remove(), 7000);
}
// choosing a language draws the same page again in it, and leaves the keyboard where it was: on the menu
wireLangMenu((code) => {
  const y = window.scrollY;
  void useLang(code, true).then((got) => {
    route(); window.scrollTo({ top: y, behavior: 'instant' }); document.getElementById('lang')?.focus();
    if (!got) note(t('lang.offline'));
  });
});
// the two faces every page is set in. The page that opens this one has already asked for them
const faces = () => Promise.all([document.fonts.load('800 40px "Sofia Sans Extra Condensed Variable"'), document.fonts.load('500 16px "Sofia Sans Variable"')]).catch(() => undefined);
// The faces are asked for early and are often here before this script is. The first page is then drawn in a turn
// of its own, and not in the turn that read the script: two short pieces of work, where one long one would hold
// up a slow phone.
// the language the address names, and for an address that names none the visitor's own
void Promise.all([useLang(langOfAddress() || wanted()), faces()]).then(breathe).then(route);
