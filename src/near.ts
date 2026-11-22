import { pieceById } from './data/pieces';
import { viewsOf } from './data/views';
import { esc } from './html';
import { said, standIn, t, tx } from './i18n';
import type { Built } from './three/kit';
import type { Stage } from './three/stage';

/**
 * A closer look at a piece, without leaving the hall. The piece comes up on the stand that its own page shows it
 * on, over the picture of the hall, to be turned, zoomed and looked into from its own places. Nothing else on
 * the page changes: a guided tour goes on being told, the daylight switch is the same switch, and one key leads
 * back to where the visitor stood.
 *
 * The stand is the one stage of the site, lent by the page for as long as the look lasts. The hall stops drawing
 * while it is covered.
 */
export interface Lent {
  stage: Stage;
  canvas: HTMLCanvasElement;
  /** Make the model of a piece. */
  build(id: string): Built;
}
export interface NearOptions {
  /** Hand over the stage, with its canvas put into the box given. Fails where 3D cannot start. */
  lend(into: HTMLElement): Promise<Lent>;
  /** The colour of a hall, as the stylesheet has it. */
  colour(hall: number): string;
  /** The still picture of a piece on its stand, shown until its model runs. */
  poster(id: string, lights: boolean): string;
  /** Day or night, and whether what moves by itself has been stopped, at this moment. */
  lights(): boolean;
  paused(): boolean;
  /** The look covers the hall, or has uncovered it again. */
  onOpen(): void;
  onShut(): void;
}
export interface Near {
  /** The piece being looked at, or nothing. */
  readonly piece: string;
  open(id: string): void;
  shut(): void;
  setLights(on: boolean): void;
  setPaused(paused: boolean): void;
  /** Full view hands every gesture to the stand. Inline, a vertical swipe belongs to the page. */
  setFree(free: boolean): void;
  /** The page has gone out of sight, or come back. */
  rest(hidden: boolean): void;
  close(): void;
}

const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 5L3.5 12l7 7v-4.6h10V9.6h-10z"/></svg>';

export const nearHtml = (): string => `
<div class="near" id="walk-near" hidden>
  <div class="near__box"><img class="near__poster" alt="" decoding="async" hidden></div>
  <button type="button" class="walk__key near__back" aria-label="${tx('walk.near.back')}" title="${tx('walk.near.back')}">${BACK}<span class="near__short" aria-hidden="true">${tx('board.hall')}</span><span class="near__long" aria-hidden="true">${tx('walk.near.back')}</span></button>
  <p class="near__hint"></p>
  <div class="near__foot">
    <p class="near__say" aria-live="polite"></p>
    <div class="near__views" role="group" aria-label="${tx('stage.views')}"></div>
  </div>
</div>`;

export function openNear(root: HTMLElement, o: NearOptions): Near {
  const box = root.querySelector<HTMLElement>('.near__box')!, still = root.querySelector<HTMLImageElement>('.near__poster')!;
  const hint = root.querySelector<HTMLElement>('.near__hint')!, say = root.querySelector<HTMLElement>('.near__say')!, views = root.querySelector<HTMLElement>('.near__views')!;
  const HINT = { turn: t('stage.hint.turn'), person: t('stage.hint.person'), detail: t('stage.hint.detail') };
  let piece = '', lent: Lent | undefined, live = false, turn = 0, free = false, hidden = false;
  const tell = (text: string) => { hint.textContent = text; hint.style.opacity = text ? '1' : '0'; };
  const places = () => viewsOf(piece).map((v) => ({ ...v, ...said.view(piece, v) }));

  /** Look from one of the piece's own places. The same button again, or null, goes back to the whole piece. */
  const setView = (id: string | null) => {
    const stage = lent?.stage;
    if (!stage || !live) return;
    const v = id && stage.inView !== id ? places().find((x) => x.id === id) : undefined;
    if (v) stage.goView(v.id, v.kind === 'detail'); else stage.goHome();
    for (const b of views.querySelectorAll<HTMLElement>('[data-view]')) b.setAttribute('aria-pressed', String(b.dataset.view === v?.id));
    tell(v ? HINT[v.kind] : HINT.turn);
    say.textContent = v?.hint ?? '';
    if (v && standIn.view(piece, v.id)) say.lang = 'en'; else say.removeAttribute('lang');
  };

  const run = async (id: string, mine: number) => {
    const p = pieceById(id)!;
    try {
      lent = await o.lend(box);
      if (mine !== turn) return;
      const { stage, canvas } = lent;
      canvas.classList.remove('is-live');
      canvas.setAttribute('aria-label', t('stage.canvas', { name: said.piece(p).name }));
      stage.onTouch = () => { hint.style.opacity = '0'; };
      stage.setFree(free);
      // the picture for red and cyan glasses is switched on and off on the page of a piece, not here
      stage.setStereo(false);
      // the hall has drawn its last frame: let the page show the still picture before the model is made
      await new Promise<void>((done) => setTimeout(done, 0));
      if (mine !== turn) return;
      stage.setPiece(lent.build(id), o.colour(p.hall), p.hall);
      stage.setLights(o.lights(), true);
      stage.setPaused(o.paused());
      await stage.warm();
      if (mine !== turn) return;
      live = true;
      if (!hidden) stage.start();
      requestAnimationFrame(() => { canvas.classList.add('is-live'); window.setTimeout(() => { if (mine === turn) still.hidden = true; }, 420); });
      for (const b of views.querySelectorAll<HTMLButtonElement>('button')) b.disabled = !!b.dataset.view && !stage.hasView(b.dataset.view);
      tell(HINT.turn);
    } catch {
      if (mine !== turn) return;
      tell('');
      say.textContent = t('stage.fail.load');
    }
  };

  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-view], [data-act], .near__back');
    if (!el || !root.contains(el)) return;
    if (el.classList.contains('near__back')) return near.shut();
    const stage = lent?.stage;
    if (!stage || !live) return;
    if (el.dataset.view) setView(el.dataset.view);
    else if (el.dataset.act === 'front') { setView(null); stage.goFront(); }
    else setView(null);
  };
  // with the stand in focus the keys turn it, as on the page of a piece
  const onKey = (e: KeyboardEvent) => {
    const stage = lent?.stage;
    if (!piece || !stage || !live || e.altKey || e.ctrlKey || e.metaKey || e.target !== lent?.canvas) return;
    const k: Record<string, [number, number, number]> = { ArrowLeft: [-12, 0, 1], ArrowRight: [12, 0, 1], ArrowUp: [0, 8, 1], ArrowDown: [0, -8, 1], '+': [0, 0, 0.88], '=': [0, 0, 0.88], '-': [0, 0, 1.14] };
    if (k[e.key]) { e.preventDefault(); e.stopPropagation(); return stage.nudge(...k[e.key]); }
    const key = e.key.toLowerCase();
    if (key === 'r' || key === '0') { e.preventDefault(); return setView(null); }
    if (/^[1-9]$/.test(key)) { e.preventDefault(); [...views.querySelectorAll<HTMLButtonElement>('button')].filter((b) => !b.disabled)[Number(key) - 1]?.click(); }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey);

  const near: Near = {
    get piece() { return piece; },
    open(id) {
      const p = pieceById(id);
      if (!p || piece === id) return;
      const mine = ++turn;
      lent?.stage.stop();
      piece = id; live = false;
      const list = places();
      views.innerHTML = `<button type="button" class="btn" data-act="home" disabled>${tx('stage.home')}</button>${list.some((v) => v.kind === 'person') ? '' : `<button type="button" class="btn" data-act="front" disabled>${tx('stage.front')}</button>`}${list.map((v) => `<button type="button" class="btn" data-view="${v.id}" aria-pressed="false" disabled>${esc(v.label)}</button>`).join('')}`;
      say.textContent = ''; say.removeAttribute('lang');
      still.src = o.poster(id, o.lights()); still.hidden = false;
      lent?.canvas.classList.remove('is-live');
      root.hidden = false;
      tell(t('stage.loading'));
      o.onOpen();
      void run(id, mine);
    },
    shut() {
      if (!piece) return;
      turn++; piece = ''; live = false;
      lent?.stage.stop();
      if (lent) { lent.stage.onTouch = undefined; lent.canvas.classList.remove('is-live'); lent.canvas.remove(); }
      root.hidden = true;
      views.innerHTML = ''; say.textContent = ''; tell('');
      o.onShut();
    },
    setLights(on) {
      if (!piece) return;
      if (!still.hidden) still.src = o.poster(piece, on);
      if (live) lent?.stage.setLights(on);
    },
    setPaused(paused) { if (live) lent?.stage.setPaused(paused); },
    setFree(to) { free = to; if (piece) lent?.stage.setFree(to); },
    rest(away) {
      hidden = away;
      if (!live) return;
      if (away) lent?.stage.stop(); else lent?.stage.start();
    },
    close() {
      turn++; piece = ''; live = false;
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKey);
      if (lent) { lent.stage.onTouch = undefined; lent.stage.stop(); lent.canvas.classList.remove('is-live'); lent.canvas.remove(); }
    },
  };
  return near;
}
