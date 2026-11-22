import { tx } from './i18n';
import { link, beforePlace } from './place';
import { justAsked, voice } from './tour';

/**
 * The museum as an app. A browser that can install a site finds what it needs for that in `index.html` and in
 * `public/manifest.webmanifest`. This is the page's share of the rest.
 *
 * It starts the worker that keeps the museum on the device (`sw.ts`). Only a built copy has one: a development
 * server runs without. It asks for a newer build whenever the page comes back into view, because an installed
 * app is more often brought back than opened. When a newer build has taken over, the page reloads by itself and
 * says nothing: at once if the visitor has not touched it yet, and otherwise at their next change of page. It
 * never reloads while the guide is speaking, while the walk or a model fills the window, or while a closer look
 * or a dialog is open.
 *
 * It also offers the installing, on the About page: a button where the browser hands the page its own prompt,
 * and on an iPhone or iPad a line that says where Safari keeps it. An installed copy offers nothing.
 */

/** The browser's offer to install the site, handed to the page to be made when the visitor asks. Not in the types yet. */
interface InstallOffer extends Event { prompt(): Promise<unknown>; readonly userChoice: Promise<unknown> }

/** The mark of the build this page belongs to, as the build wrote it into `index.html`. */
const BUILD = document.querySelector<HTMLMetaElement>('meta[name="build"]')?.content ?? '';

// ---------- installing ----------
const ua = navigator.userAgent;
/** Running as an installed app: in a window of its own, or from the home screen of an iPhone. */
let installed = matchMedia('(display-mode: standalone), (display-mode: minimal-ui), (display-mode: window-controls-overlay)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
/** Safari on an iPhone or iPad, which installs a site from its Share menu and hands the page no prompt. An iPad may call itself a Mac. */
const iosSafari = (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) && /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua);
let offer: InstallOffer | undefined;

const inner = (): string => {
  const how = offer ? `<p class="ways"><button type="button" class="btn" data-install>${tx('about.app.install')}</button></p>` : iosSafari ? `<p>${tx('about.app.ios')}</p>` : '';
  return how && !installed ? `<h2 class="h-sec">${tx('about.app')}</h2><p>${tx('about.app.1')}</p>${how}` : '';
};
/** Whether there is a way to install that this page can offer: the browser's own prompt, or Safari's Share menu. */
const offered = (): boolean => !installed && (!!offer || iosSafari);
/**
 * The way to install at the foot of every page. Where the browser has handed over its prompt, the link makes it.
 * Where it has not, on an iPhone or iPad, the link leads to the About page, which says where Safari keeps it.
 */
export const appFoot = (): string => `<a href="${link('about')}" data-install data-app-foot${offered() ? '' : ' hidden'}>${tx('about.app.install')}</a>`;
/** What the About page says about installing. It is empty until there is a way to install, and is filled in when one turns up. */
export function appHtml(): string {
  const html = inner();
  return `<div class="stack" style="--gap: 12px" data-app${html ? '' : ' hidden'}>${html}</div>`;
}
const show = (): void => {
  const html = inner();
  for (const el of document.querySelectorAll<HTMLElement>('[data-app]')) { el.innerHTML = html; el.hidden = !html; }
  for (const el of document.querySelectorAll<HTMLElement>('[data-app-foot]')) el.hidden = !offered();
};

/** Start all of it. Called before the router is wired: see `hashchange` below. */
export function wireApp(): void {
  // The browser's own banner is held back. Its prompt is kept for the button on the About page.
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); offer = e as InstallOffer; show(); });
  window.addEventListener('appinstalled', () => { offer = undefined; installed = true; show(); });
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-install]'), asked = offer;
    if (!btn || !asked) return;
    // the link at the foot of a page leads to the About page only where there is no prompt to make
    e.preventDefault();
    // an offer can be made once: the browser hands over another if this one is turned down
    offer = undefined;
    void asked.prompt().then(() => asked.userChoice).catch(() => undefined).then(() => {
      const held = document.activeElement === btn;
      show();
      // the button has gone: the keyboard is not left on nothing
      if (held && !btn.isConnected) document.getElementById('main')?.focus({ preventScroll: true });
    });
  });
  // A browser may know of workers and still have none to give, in a private window for one. The museum works without.
  const sw = navigator.serviceWorker as ServiceWorkerContainer | undefined;
  if (import.meta.env.PROD && sw) try { keepCurrent(sw); } catch { /* the page goes on as a plain page */ }
}

// ---------- the worker, and a newer build ----------
function keepCurrent(sw: ServiceWorkerContainer): void {
  /** The address of the museum, down to its last slash. */
  const home = new URL('./', location.href).href;
  let reg: ServiceWorkerRegistration | undefined, checked = Date.now();
  /** Whether a worker stood behind this page when it opened, whether the visitor has touched the page, and whether a newer build has taken over since. */
  let had = !!sw.controller, touched = false, stale = false, going = false;

  // The page and the worker tell each other one thing: which build they are. Either sends `{ build }` and gets the
  // other's mark back on the line that came with it.
  const tell = (worker: ServiceWorker) => new Promise<string>((done) => {
    const line = new MessageChannel();
    line.port1.onmessage = (e) => { line.port1.close(); done(String(e.data)); };
    worker.postMessage({ build: BUILD }, [line.port2]);
  });
  sw.addEventListener('message', (e) => { if (typeof (e.data as { build?: unknown } | null)?.build === 'string') e.ports[0]?.postMessage(BUILD); });
  sw.startMessages();
  // told when the page opens, the worker clears out what older builds left behind
  if (sw.controller) void tell(sw.controller);

  /** Whether a reload now would take something from the visitor. */
  const busy = (): boolean => {
    const sounding = (a: HTMLMediaElement) => !a.paused && !a.ended;
    return sounding(voice()) || [...document.querySelectorAll('audio')].some(sounding) || !!document.querySelector('.walk.is-full, .stage.is-full, .walk.is-near, dialog[open]');
  };
  /** Reload into the newer build, if there is one and this is a good moment. The address stays as it is. Says whether it did. */
  const renew = (): boolean => {
    if (!stale || going || busy()) return false;
    going = true;
    location.reload();
    return true;
  };
  for (const name of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(name, () => { touched = true; }, { capture: true, passive: true, once: true });

  sw.addEventListener('controllerchange', () => {
    const now = sw.controller;
    if (!now) return;
    if (!had) {
      // The first worker this page has had. What the page fetched before it is asked for once more, so that the
      // worker keeps it too. The browser still has it all at hand, so nothing crosses the network.
      had = true;
      for (const r of performance.getEntriesByType('resource')) if (r.name.startsWith(home) && !/\.(?:mp3|mp4|webm)$/.test(r.name)) void fetch(r.name).catch(() => undefined);
    }
    // a page of the same build has nothing to gain from a reload
    void tell(now).then((build) => { if (build === BUILD) return; stale = true; if (!touched) renew(); });
  });
  // Asked before a new place is drawn. A change of page is the moment that costs nothing: the address has
  // changed already, and the new page is drawn by the newer build. Not when the visitor has just asked for a
  // guided tour, because the click that asked is what lets the guide speak, and a reload would throw it away.
  beforePlace(() => !justAsked() && renew());

  // Coming back into view, or back onto the network, is a time to look for a newer build, and for the worker to
  // clear out if it could not before. Not more than once a minute.
  const check = (): void => {
    if (!reg || Date.now() - checked < 60_000) return;
    checked = Date.now();
    if (sw.controller) void tell(sw.controller);
    void reg.update().catch(() => undefined);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('online', check);

  // The worker is started once the page has loaded and has come to rest: when first installed it fetches the whole building.
  const start = (): void => { void sw.register('./sw.js', { updateViaCache: 'none' }).then((r) => { reg = r; }, () => undefined); };
  const rested = (): void => { if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 4000 }); else setTimeout(start, 1500); };
  if (document.readyState === 'complete') rested(); else window.addEventListener('load', rested, { once: true });
}
