/**
 * The addresses of the museum.
 *
 * A place that has words of its own has a folder of its own: the entrance, `hall/2/`, `piece/nixie-tube/`,
 * `person/kenyon-taylor/`, `index/`, `people/`, `about/` and `tour/women/`, the words of a guided tour. The server has a page in each of
 * those folders, so a search engine, a chat and a reader without scripts find the same words there that the museum
 * draws. A language other than English stands in front: `ca/piece/nixie-tube/`. An address without a language
 * opens in the visitor's own.
 *
 * What is a state of the building and no text follows a # at the entrance, as every address once did: the walk
 * through the halls, a guided tour under way, the short visit. An old address such as `#piece-nixie-tube` still
 * opens its piece, and the address bar then shows the new one.
 *
 * The museum is one page that draws all of these itself. A link to a place is followed without loading a page:
 * the address is changed and the place is drawn. The page's `base` points at the museum's folder from wherever
 * the page was loaded, so every link and every file is written from that folder.
 */
import { langNow, offered, type Lang } from './i18n';

/** The museum's folder, as a full address. */
const HOME = new URL(document.baseURI);
/** The places that are a single page with a plain name. */
const PAGES = ['index', 'about', 'people'];
/** What may follow a # and name a place: the older addresses of the pages, and the states of the building. */
const NAMED = /^(?:hall-\d+|piece-[a-z0-9-]+|person-[a-z0-9-]+|words-[a-z0-9-]+|embed-[a-z0-9-]+|index|depot|about|people|walk(?:-[a-z0-9-]+)?|tour-[a-z0-9-]+|visit(?:-[a-z0-9-]+)?|missing|sheet(?:\?.*)?|vista|cutouts)$/;

/** The language at the front of a path, if it names one the museum speaks, and the rest of the path. */
function split(path: string): { lang: Lang | ''; rest: string } {
  const m = /^([a-z]{2}(?:-[a-z]+)?)\/(.*)$/.exec(path);
  return m && m[1] !== 'en' && offered().some((l) => l.code === m[1]) ? { lang: m[1] as Lang, rest: m[2] } : { lang: '', rest: path };
}

/** The name of the place a path stands for: '' is the entrance, and null means it is no place of the museum. */
function nameOfPath(rest: string): string | null {
  const path = rest.replace(/index\.html$/, '');
  if (path === '') return '';
  const m = /^(hall|piece|person|tour)\/([a-z0-9-]+)\/?$/.exec(path);
  if (m) return `${m[1] === 'tour' ? 'words' : m[1]}-${m[2]}`;
  const page = /^([a-z]+)\/?$/.exec(path)?.[1];
  return page && PAGES.includes(page) ? page : null;
}

/**
 * The place an address stands for and the language it names, or null for an address outside the museum and for a
 * file in it. What follows a # names the place, as it always did. Without one, the path does.
 */
export function placeOf(url: URL | Location = location): { name: string; lang: Lang | '' } | null {
  if (url.origin !== HOME.origin || !url.pathname.startsWith(HOME.pathname)) return null;
  const { lang, rest } = split(url.pathname.slice(HOME.pathname.length));
  const name = nameOfPath(rest);
  if (name === null) return null;
  // On the page of a place, a # that names nothing the museum knows is someone else's mark and is passed over.
  // At the entrance it is taken as an address, and the page says there is nothing at it.
  const hash = url.hash.replace(/^#\/?/, '');
  return { name: hash && (name === '' || NAMED.test(hash)) ? hash : name, lang };
}
/** The name of the place the address bar shows: `piece-nixie-tube`, `hall-2`, `index`, `walk`, and '' for the entrance. */
export const nameNow = (): string => placeOf()?.name ?? 'missing';
/** The language the address bar names, or '' where it names none. */
export const langOfAddress = (): Lang | '' =>
  placeOf()?.lang ?? (location.origin === HOME.origin && location.pathname.startsWith(HOME.pathname) ? split(location.pathname.slice(HOME.pathname.length)).lang : '');
/** What the visitor typed after the museum's folder and its language, for an address that is no place: `piece/split-flp`. */
export const typedPath = (): string =>
  location.pathname.startsWith(HOME.pathname) ? split(location.pathname.slice(HOME.pathname.length)).rest.replace(/\/+$/, '') : '';

/**
 * The address of a place, to write in a link or to go to. It is written from the museum's folder, in the language
 * in use: `piece/nixie-tube/`, `ca/hall/2/`, `./#walk`.
 */
export function link(name: string): string {
  const code = langNow().code, pre = code === 'en' ? '' : `${code}/`;
  const m = /^(hall|piece|person|words)-([a-z0-9-]+)$/.exec(name);
  const path = name === '' ? '' : m ? `${m[1] === 'words' ? 'tour' : m[1]}/${m[2]}/` : PAGES.includes(name) ? `${name}/` : null;
  return path === null ? `${pre || './'}#${name}` : pre + path || './';
}

let draw: () => void = () => undefined;
const before: (() => boolean)[] = [];
/** The place that was last drawn, with its language. A change of address that leaves it as it is draws nothing. */
let last = '';
const key = (): string => { const p = placeOf(); return p ? `${p.lang} ${p.name}` : location.href; };

/** Ask `fn` before a new place is drawn. If it answers true it has taken over, and nothing is drawn. */
export const beforePlace = (fn: () => boolean): void => { before.push(fn); };

function changed(): void {
  if (key() === last || before.some((fn) => fn())) return;
  draw();
}

/** Go to a place, as a link to it would: the address changes, the step is added to the browser's history, and the place is drawn. */
export function goTo(href: string): void {
  const url = new URL(href, document.baseURI);
  // what a visitor has asked of this visit in the address, such as `?gl=off`, stays with them
  if (!url.search) url.search = location.search;
  if (url.href === location.href) return;
  history.pushState(null, '', url);
  changed();
}

/** Bring the address to that of a place without drawing anything and without a step in the history: the walk does this as the visitor moves. */
export function setAddress(name: string): void {
  const to = new URL(link(name), document.baseURI);
  try { history.replaceState(history.state, '', to.pathname + location.search + to.hash); } catch { /* the address is a courtesy */ }
  last = key();
}

/**
 * A place has been drawn. If it has an address of its own, the address bar is brought to it: an old address with
 * a # becomes the folder of the place, and a change of language changes the folder in front. `name` is null for
 * a place that does not exist, whose address is left as it was typed.
 */
export function settle(name: string | null): void {
  if (name !== null) {
    const to = new URL(link(name), document.baseURI);
    if (to.pathname !== location.pathname || to.hash !== location.hash) {
      try { history.replaceState(history.state, '', to.pathname + location.search + to.hash); } catch { /* the address is a courtesy */ }
    }
  }
  last = key();
}

/**
 * Wire the addresses to the page. `fn` draws the place the address bar shows. It is called when the visitor steps
 * back or forward, when the part after the # is changed by hand, and when a link to a place of the museum is
 * followed in this window. A link held down for a new tab, a link to a file and a link elsewhere are the browser's.
 */
export function wirePlaces(fn: () => void): void {
  draw = fn;
  window.addEventListener('popstate', changed);
  window.addEventListener('hashchange', changed);
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || !placeOf(new URL(a.href))) return;
    e.preventDefault();
    goTo(a.href);
  });
}
