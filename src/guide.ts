import { pieceById } from './data/pieces';
import { tourStops, type Stand, type Tour } from './data/tours';
import { trailById } from './data/trails';
import { esc } from './html';
import { link } from './place';
import { said, t, tx } from './i18n';
import { captionAt, clipOf, hush, keepCaptions, keepVoice, ready, speak, toursNow, voice, wantsCaptions, wantsVoice } from './tour';

/**
 * The guided tour in the walk: a dark band under the picture. On it are the stops of the tour along its line, the
 * stop the tour is at, the keys that go to the stop before and the stop after, the switch for the guide's voice
 * and the way out of the tour.
 *
 * The visitor moves the tour on. Asking for a stop carries them to it, and the guide begins when they are there:
 * she does not tell them what to look at while they are still on the way. The guide is never cut off by walking:
 * a visitor who strolls to another stop while she speaks hears her out, and she takes up that stop when she has
 * finished. With her voice switched off, or where a language has no recording, the tour is the same tour to read.
 *
 * The walk shows the people a stop is about in a corner of the picture (who.ts), from the tour's `who`.
 *
 * While no tour is being taken and the language tells one, the band is a single quiet row that offers it.
 */
export interface GuideHooks {
  /**
   * Carry the visitor to a stop, to the place the tour stands them at. Says when they will be there: `soon`, at
   * the end of a short walk, `later`, once the hall has opened, or `never`, where there is no hall to stand in.
   */
  goTo(piece: string, stand?: Stand): 'soon' | 'later' | 'never';
  /** The visitor is being carried somewhere at this moment. */
  moving(): boolean;
  /** The visitor asked for a tour, with a click. */
  enter(tour: string): void;
  /** The visitor asked to leave the tour. */
  leave(): void;
  /** The tour is at another part, or there is no tour any more. */
  onPart(): void;
  /** A key of the band was pressed: the walk starts if it had not. */
  onKey(): void;
}
export interface Guide {
  /** The tour being taken, if one is, and the part it is at. */
  readonly tour: Tour | undefined;
  readonly part: string;
  /**
   * Take up a tour at one of its parts, or put the tour down. `say` has the guide speak, which the first time only
   * a click may let her do. At a stop she waits until the visitor stands there.
   */
  take(tour: Tour | undefined, part?: string, say?: boolean): void;
  /** The visitor is in front of another piece, or of none. */
  arrive(piece?: string): void;
  /** One stop on or back, from a key of the keyboard. Says whether a tour took the step. */
  step(by: 1 | -1): boolean;
  /** The button that starts the walk was pressed in a tour: the guide speaks the part the tour is at, once the visitor stands at its stop. */
  begin(): void;
  /** No hall will open: whatever the guide was waiting to say, she says. */
  stranded(): void;
  close(): void;
}

const ICON = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 5H8v14H5.5zM19 5v14l-9.5-7z"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2.5v14H16zM5 5l9.5 7L5 19z"/></svg>',
  play: '<svg class="guide__ic-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 4.5v15L20 12z"/></svg>',
  pause: '<svg class="guide__ic-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>',
};
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** How long the guide waits for a visitor on the way to a stop before she begins anyway, in milliseconds. */
const WAIT = { soon: 4500, later: 20000 };
/** The breath between arriving and her first word. */
const BREATH = 400;

export function openGuide(root: HTMLElement, hooks: GuideHooks): Guide {
  const a = voice();
  let tour: Tour | undefined, at = 'start', here = '', closed = false;
  /** The stop a key has just sent the visitor to. Until they are there, the pieces they pass are not arrivals. */
  let aiming = '', aimed = 0;
  /** The part whose words wait for the visitor to reach its stop, and the clocks that end the wait. */
  let waiting = '', held = 0, breath = 0;
  let sound = wantsVoice();
  /** Whether what she says is also shown at the foot of the picture, a sentence at a time. */
  let cc = wantsCaptions();
  /** Whether the visitor has opened or shut the guide's words themselves. Until they do, the words are open when there is nothing to hear. */
  let words: boolean | undefined, setting = false;
  const fetched = new Set<string>();

  const told = () => said.tour(tour!)!;
  const index = () => tour!.parts.findIndex((p) => p.id === at);
  const clip = () => (tour ? clipOf(tour, at) : '');
  /** The player holds the recording of the part the tour is at. */
  const mine = () => { const url = clip(); return !!url && a.src === url; };
  /** The guide is in the middle of this part: about to speak, speaking, or stopped part of the way through it. */
  const busy = () => sound && (!!waiting || (mine() && !a.ended && (!a.paused || a.currentTime > 0)));
  /** The stop at which a part is told: its own, and for the closing words the last one. */
  const stopOf = (part: string) => { const stops = tourStops(tour!); return stops.find((x) => x.id === part) ?? (part === 'end' ? stops[stops.length - 1] : undefined); };
  /** Stop waiting for the visitor: nothing is about to be said. */
  const drop = () => { waiting = ''; window.clearTimeout(held); window.clearTimeout(breath); };
  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;

  /** Draw the band for the tour being taken, or the row that offers one, or nothing. */
  const draw = () => {
    root.classList.toggle('is-on', !!tour);
    if (!tour) {
      const offer = toursNow().find((x) => trailById(x.id));
      root.hidden = !offer;
      for (const name of ['data-playing', 'data-told', 'data-last', 'data-voice', 'data-voices']) root.removeAttribute(name);
      root.style.removeProperty('--trail');
      root.innerHTML = offer
        ? `<div class="guide__invite"><p class="guide__name"><span>${tx('tour.label')}</span><b>${esc(said.tour(offer)!.title)}</b></p><button type="button" class="btn guide__start" data-guide="enter" data-tour="${offer.id}">${tx('tour.start')}</button></div>`
        : '';
      return;
    }
    const stops = tourStops(tour), any = tour.parts.some((p) => clipOf(tour!, p.id));
    root.hidden = false;
    root.style.setProperty('--trail', trailById(tour.id)?.colour ?? '#1f9d55');
    root.dataset.voices = any ? 'some' : 'none';
    // the line is told how many parts it has: a phone on its side folds it into two rows, and needs the number to do so
    root.innerHTML = `
<div class="guide__line" role="group" aria-label="${tx('tour.line')}" style="--parts: ${tour.parts.length}">${tour.parts.map((p) => { const n = stops.indexOf(p) + 1, title = told().parts[p.id].title; return `<button type="button" class="guide__dot${n ? '' : ' guide__dot--cap'}" data-guide="part" data-part="${p.id}" aria-label="${esc(n ? `${n}. ${title}` : title)}" title="${esc(n ? `${n}. ${title}` : title)}"><i></i></button>`; }).join('')}</div>
<div class="guide__now">
  <div class="guide__what">
    <p class="guide__no" aria-live="polite"></p>
    <h2 class="guide__title" aria-live="polite"></h2>
    <p class="guide__place"></p>
  </div>
  <div class="guide__side">
    <div class="guide__keys">
      <button type="button" class="guide__key" data-guide="prev" aria-label="${tx('tour.prev')}" title="${tx('tour.prev')}">${ICON.prev}</button>
      <button type="button" class="guide__key guide__key--play" data-guide="play">${ICON.play}${ICON.pause}</button>
      <button type="button" class="guide__key guide__key--next" data-guide="next" aria-label="${tx('tour.next')}" title="${tx('tour.next')}"><span aria-hidden="true">${tx('tour.next')}</span>${ICON.next}</button>
    </div>
    <p class="guide__time" aria-hidden="true"></p>
  </div>
</div>
<div class="guide__more">
  <button type="button" class="switch" role="switch" data-guide="sound" aria-checked="${sound}"><span class="switch__track"><span class="switch__knob"></span></span><span>${tx('tour.sound')}</span></button>
  <button type="button" class="switch" role="switch" data-guide="cc" aria-checked="${cc}"><span class="switch__track"><span class="switch__knob"></span></span><span>${tx('tour.captions')}</span></button>
  <button type="button" class="btn guide__leave" data-guide="leave">${tx('tour.leave')}</button>
</div>
<details class="guide__words"><summary>${tx('tour.words')}</summary><div class="guide__text"></div><p class="guide__whole"><a href="${link(`words-${tour.id}`)}">${tx('tour.whole')}</a></p></details>`;
  };

  /** Show the part the tour is at. */
  const show = () => {
    if (!tour) return;
    const stops = tourStops(tour), part = told().parts[at], n = stops.findIndex((s) => s.id === at) + 1, piece = n ? pieceById(at) : undefined, i = index();
    $('.guide__no').textContent = n ? t('tour.stop', { n, total: stops.length }) : `${t('tour.label')}: ${told().title}`;
    $('.guide__title').textContent = part.title;
    $('.guide__place').innerHTML = piece ? `<a href="${link(`piece-${piece.id}`)}">${tx('tour.at', { piece: said.piece(piece).name, n: piece.hall })}</a>` : '';
    $('.guide__text').innerHTML = part.text.map((p) => `<p>${esc(p)}</p>`).join('');
    root.querySelectorAll<HTMLButtonElement>('.guide__dot').forEach((dot, k) => {
      dot.classList.toggle('is-past', k < i); dot.classList.toggle('is-now', k === i);
      if (k === i) dot.setAttribute('aria-current', 'step'); else dot.removeAttribute('aria-current');
      dot.style.removeProperty('--played');
    });
    $<HTMLButtonElement>('[data-guide="prev"]').disabled = i <= 0;
    $<HTMLButtonElement>('[data-guide="next"]').disabled = i >= tour.parts.length - 1;
    root.toggleAttribute('data-last', i >= tour.parts.length - 1);
    // the player is given the recording of this part, so that its length shows before it is played
    const url = clip();
    if (sound && url && !mine() && a.paused) a.src = url;
    sync();
    const box = $<HTMLDetailsElement>('.guide__words'), open = words ?? !(sound && url);
    if (box.open !== open) { setting = true; box.open = open; }
  };

  /** Bring the keys, the time left and the line up to date with the player. */
  /** The caption at the foot of the walk's picture. It is the walk's element: the guide only writes in it. */
  const caption = (text: string) => {
    const line = document.getElementById('walk-cc');
    if (!line) return;
    if (line.textContent !== text) line.textContent = text;
    line.hidden = !text;
    // in the closer look the foot of the picture belongs to the views of the piece: the caption stands on top of them
    const foot = text ? document.querySelector<HTMLElement>('.walk.is-near .near__foot') : null;
    if (foot) line.style.setProperty('--lift', `${foot.offsetHeight}px`); else line.style.removeProperty('--lift');
  };
  const sync = () => {
    if (!tour || closed) return caption('');
    // while she waits for the visitor to arrive she counts as speaking: the key that would stop her shows
    const has = !!clip(), on = !!waiting || (mine() && !a.paused && !a.ended);
    root.dataset.voice = !has ? 'none' : sound ? 'on' : 'off';
    caption(cc && sound && has && mine() && !a.ended && (!a.paused || a.currentTime > 0) ? captionAt(tour, at, a.currentTime) : '');
    root.toggleAttribute('data-playing', on);
    root.toggleAttribute('data-told', mine() && a.ended);
    const key = root.querySelector<HTMLButtonElement>('[data-guide="play"]');
    if (!key) return;
    key.setAttribute('aria-label', t(on ? 'tour.pause' : 'tour.play')); key.title = t(on ? 'tour.pause' : 'tour.play');
    const long = mine() && Number.isFinite(a.duration) ? a.duration : 0, done = mine() ? a.currentTime : 0;
    $('.guide__time').textContent = long && sound ? `−${clock(Math.max(0, long - done))}` : '';
    // while she speaks, the line grows from this stop towards the next. How far is kept on the line itself, where both stops read it
    root.querySelector<HTMLElement>('.guide__line')?.style.setProperty('--played', long ? (a.ended ? 1 : Math.min(1, done / long)).toFixed(3) : '0');
  };

  const say = () => {
    drop();
    if (!tour || !sound || !clip()) return;
    const part = told().parts[at];
    void speak(tour, at).then(() => sync());
    sync();
    try {
      if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: part.title, album: told().title, artist: t('site.name') });
    } catch { /* the lock screen goes without */ }
  };

  /**
   * Have the guide ready for the part the tour is at, and hold her until the visitor stands at its stop. Where
   * this runs inside a click, it is what lets her begin by herself when the walk there is over. She does not wait
   * for ever: a visitor who turns off on the way hears her all the same.
   */
  const cue = (when: 'soon' | 'later') => {
    drop();
    ready(tour!, at);
    waiting = at;
    held = window.setTimeout(say, WAIT[when]);
    sync();
  };
  /** The visitor is at the stop: once they have come to a stand, and after a breath, she speaks. */
  const release = () => {
    const part = waiting;
    if (!part) return;
    window.clearTimeout(breath);
    const stood = () => {
      if (waiting !== part || closed) return;
      if (hooks.moving()) breath = window.setTimeout(stood, 100);
      else breath = window.setTimeout(() => { if (waiting === part && !closed) say(); }, BREATH);
    };
    stood();
  };
  /**
   * Have the guide say the part the tour is at: now, or once the visitor has been carried to its stop. A visitor
   * who is in front of the stop already has only to be stood in the tour's place.
   */
  const tell = (when: 'now' | 'soon' | 'later' | 'never') => {
    if (!sound || !clip()) { drop(); hush(); return; }
    if (when === 'now' || when === 'never') return say();
    cue(when);
    if (here && here === stopOf(at)?.id) release();
  };

  /** Go to a part because the visitor asked for it: the tour moves there, they are carried to its stop, and the guide begins when they arrive. */
  const go = (id: string) => {
    if (!tour || !tour.parts.some((p) => p.id === id)) return;
    drop();
    at = id;
    const stops = tourStops(tour), last = stops[stops.length - 1];
    // the closing words are said at the last stop, and leave alone a visitor who is looking round it
    const stop = stops.find((s) => s.id === id) ?? (id === 'end' && here !== last?.id ? last : undefined);
    let when: 'now' | 'soon' | 'later' | 'never' = 'now';
    if (stop) {
      aiming = stop.id; window.clearTimeout(aimed); aimed = window.setTimeout(() => { aiming = ''; }, WAIT.soon + 200);
      when = hooks.goTo(stop.id, stop.stand);
    }
    show();
    tell(when);
    hooks.onPart();
  };
  /** One part back. As on any player: well into a part, the key goes back to its beginning, and from its beginning to the part before. */
  const back = () => {
    if (!tour) return;
    const i = index();
    if (sound && !waiting && mine() && !a.ended && a.currentTime > 3) { a.currentTime = 0; say(); }
    else if (i > 0) go(tour.parts[i - 1].id);
  };

  /** The visitor has walked up to another stop: the tour goes with them, unless the guide is in the middle of a part. */
  const keepUp = () => {
    if (!tour || !here || here === at || aiming || busy()) return;
    const stops = tourStops(tour);
    if (!stops.some((s) => s.id === here) || (at === 'end' && here === stops[stops.length - 1].id)) return;
    at = here;
    show(); tell('soon');
    hooks.onPart();
  };

  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-guide]');
    if (!el || !root.contains(el)) return;
    const what = el.dataset.guide;
    if (what === 'enter') return hooks.enter(el.dataset.tour!);
    if (!tour) return;
    if (what === 'leave') return hooks.leave();
    if (what === 'cc') { cc = !cc; keepCaptions(cc); el.setAttribute('aria-checked', String(cc)); sync(); return; }
    if (what === 'sound') {
      sound = !sound; keepVoice(sound);
      el.setAttribute('aria-checked', String(sound));
      if (sound) { show(); say(); } else { drop(); hush(); show(); keepUp(); }
      return;
    }
    hooks.onKey();
    const i = index();
    if (what === 'prev') back();
    if (what === 'next' && i < tour.parts.length - 1) go(tour.parts[i + 1].id);
    if (what === 'part') go(el.dataset.part!);
    if (what === 'play') { if (waiting || (mine() && !a.paused && !a.ended)) { drop(); hush(); sync(); } else say(); }
  };
  const onToggle = (e: Event) => {
    const box = e.target as HTMLDetailsElement;
    if (!box.matches?.('details.guide__words')) return;
    if (setting) setting = false; else words = box.open;
  };
  const onEnded = () => { sync(); keepUp(); };
  /** Once she is speaking, the recording of the next part is fetched, so that it starts without a wait. */
  const onPlaying = () => {
    sync();
    if (!tour || !mine() || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    const next = tour.parts[index() + 1], url = next ? clipOf(tour, next.id) : '';
    if (url && !fetched.has(url)) { fetched.add(url); void fetch(url).catch(() => undefined); }
  };

  root.addEventListener('click', onClick);
  root.addEventListener('toggle', onToggle, true);
  for (const name of ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'error', 'emptied'] as const) a.addEventListener(name, sync);
  a.addEventListener('ended', onEnded);
  a.addEventListener('playing', onPlaying);
  try {
    navigator.mediaSession?.setActionHandler('previoustrack', () => { guide.step(-1); });
    navigator.mediaSession?.setActionHandler('nexttrack', () => { guide.step(1); });
  } catch { /* a headset's keys go without */ }

  const guide: Guide = {
    get tour() { return tour; },
    get part() { return at; },
    take(next, part = 'start', speakNow = false) {
      if (closed) return;
      if (!next || !said.tour(next)) {
        if (tour) hush();
        tour = undefined; aiming = ''; window.clearTimeout(aimed); drop();
        draw();
        return;
      }
      const fresh = next !== tour;
      drop();
      tour = next; at = next.parts.some((p) => p.id === part) ? part : 'start';
      if (fresh) { words = undefined; draw(); }
      const stops = tourStops(next), last = stops[stops.length - 1];
      const stop = stops.find((s) => s.id === at) ?? (at === 'end' ? last : undefined);
      // at a stop, the visitor is stood where the tour stands them
      let when: 'now' | 'soon' | 'later' | 'never' = 'now';
      if (stop && (stop.stand || here !== stop.id)) when = hooks.goTo(stop.id, stop.stand);
      show();
      if (speakNow) tell(when);
      hooks.onPart();
    },
    arrive(piece) {
      here = piece ?? '';
      if (aiming) { if (here !== aiming) return; aiming = ''; window.clearTimeout(aimed); }
      if (waiting) { if (tour && here === stopOf(waiting)?.id) release(); return; }
      keepUp();
    },
    step(by) {
      if (!tour) return false;
      hooks.onKey();
      if (by < 0) back(); else { const to = tour.parts[index() + 1]; if (to) go(to.id); }
      return true;
    },
    begin() {
      if (!tour || closed) return;
      const stop = stopOf(at);
      tell(stop && here !== stop.id ? hooks.goTo(stop.id, stop.stand) : 'now');
    },
    stranded() { if (waiting) say(); },
    close() {
      closed = true;
      drop(); hush();
      window.clearTimeout(aimed);
      caption('');
      root.removeEventListener('click', onClick);
      root.removeEventListener('toggle', onToggle, true);
      for (const name of ['play', 'pause', 'timeupdate', 'loadedmetadata', 'durationchange', 'error', 'emptied'] as const) a.removeEventListener(name, sync);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('playing', onPlaying);
      try {
        navigator.mediaSession?.setActionHandler('previoustrack', null);
        navigator.mediaSession?.setActionHandler('nexttrack', null);
      } catch { /* nothing was set */ }
    },
  };
  draw();
  return guide;
}
