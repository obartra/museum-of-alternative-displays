/**
 * The museum kept on the visitor's device. The build turns this file into `sw.js`, a service worker: a script
 * that the browser runs beside the pages of the site, between them and the network.
 *
 * It keeps the building: the page, its scripts, its stylesheet and its typefaces, all fetched when the worker is
 * installed. The names of those files change with their contents, so `vite.config.ts` writes the list in here at
 * every build, with a mark that stands for the build. A language is kept from the first time it is used, and a
 * picture from the first time it is shown. With these the museum opens without a connection: every label and
 * every model, and each picture the visitor has seen. A visitor can ask for every picture at once, and for the
 * recordings of the guide (`keep.ts`). The worker serves no sound and no film: a player asks for them a part at a
 * time, and is left to ask the network itself.
 *
 * A new build of the site brings a new worker, and it takes over at once. The page is asked for from the network
 * first, so a visitor with a connection opens the museum as it now is. A page that was open when the new worker
 * took over reloads when that costs the visitor nothing (`app.ts`). Until then the files of its own build are
 * kept for it, and they are removed once no open page is of an older build.
 */

// This project loads the types of a page. The few that only a worker has are written out here.
interface Lasting extends Event { waitUntil(work: Promise<unknown>): void }
interface Asking extends Lasting { readonly request: Request; readonly preloadResponse?: Promise<Response | undefined>; respondWith(answer: Promise<Response>): void }
interface OpenPage { readonly id: string; readonly url: string; postMessage(message: unknown, transfer: Transferable[]): void }
interface Telling extends Lasting { readonly data: unknown; readonly ports: readonly MessagePort[]; readonly source: Partial<OpenPage> | null }
interface Keeper {
  readonly registration: ServiceWorkerRegistration;
  readonly clients: { matchAll(which: { type: 'window'; includeUncontrolled: true }): Promise<OpenPage[]>; claim(): Promise<void> };
  skipWaiting(): Promise<void>;
  addEventListener(type: 'install' | 'activate', fn: (e: Lasting) => void): void;
  addEventListener(type: 'fetch', fn: (e: Asking) => void): void;
  addEventListener(type: 'message', fn: (e: Telling) => void): void;
}
declare const self: Keeper;
/**
 * Written in by the build: its mark, the files of the building, the few of them that the first page cannot do
 * without, and the files of the languages, which are fetched when a visitor chooses one.
 */
declare const __BUILD__: string, __SHELL__: string[], __CORE__: string[], __LANGUAGES__: string[];

const BUILD = __BUILD__;
/** The address of the museum, down to its last slash. Everything the worker keeps lies under it. */
const HOME = self.registration.scope;
// Other sites at the same origin have stores of their own, so the names of these begin with the museum's path.
const MINE = `museum ${new URL(HOME).pathname} `, SHELL = `${MINE}building ${BUILD}`, PICTURES = `${MINE}pictures`;
/** The recordings a visitor asked to keep (`keep.ts`). The page fills this store and reads it: the worker only leaves it alone. */
const SOUND = `${MINE}sound`;
const PICTURE = /\.(?:webp|png|jpe?g|gif|svg|avif|ico)$/i;
/** The folder of a place with words, with or without a language in front, as `src/place.ts` writes them. */
const PLACE = /^(?:[a-z]{2}(?:-[a-z]+)?\/)?(?:(?:piece|hall|person|tour)\/[a-z0-9-]+\/|(?:index|people|about)\/)?(?:index\.html)?$/;
/** How long the network may take to hand over the page before the kept one is shown instead, in milliseconds. */
const PATIENCE = 2500;
/** The most pictures kept. The collection has far fewer today, so everything a visitor has seen or asked to keep stays. */
const MOST = 2400;

const wait = (ms: number) => new Promise<undefined>((done) => setTimeout(done, ms));
/** The name of a built file without the mark of its contents: what stays the same from one build to the next. */
const plain = (path: string) => path.replace(/-[\w-]{8}(?=\.\w+$)/, '');

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    // The page comes straight from the server. If the server still hands out the page of another build, this
    // worker is not installed, and the browser tries again at its next check.
    const got = await fetch(HOME, { cache: 'reload' }), page = await got.text();
    if (!got.ok || !page.includes(BUILD)) throw new Error('the page on the server is of another build');
    await shell.put(HOME, new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    // A visitor who has asked to save data gets what the first page needs, and the rest as it is used. Whatever an
    // older build already keeps for this visitor is fetched in its new form as well: the language they read in, above all.
    const saving = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const had = new Set<string>();
    for (const name of await caches.keys()) {
      if (name.startsWith(MINE) && name !== PICTURES && name !== SOUND) for (const file of await (await caches.open(name)).keys()) had.add(plain(file.url.slice(HOME.length)));
    }
    const wanted = new Set([...(saving ? __CORE__ : __SHELL__), ...[...__SHELL__, ...__LANGUAGES__].filter((path) => had.has(plain(path)))]);
    await Promise.all([...wanted].map(async (path) => {
      const url = HOME + path;
      if (await shell.match(url)) return;
      // a file that has kept its name has kept its contents: the copy an older build holds is taken over
      const held = await caches.match(url);
      await (held ? shell.put(url, held) : shell.add(url));
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // the browser may ask the network for the page while this worker is still starting
    await self.registration.navigationPreload?.enable().catch(() => undefined);
    await self.clients.claim();
    await thin(await caches.open(PICTURES), MOST);
  })());
});

/**
 * The page and the worker tell each other one thing: which build they are. Either sends `{ build }` and gets the
 * other's mark back on the line that came with it. A page says so when it opens and when a new worker has taken
 * over, and each time is a good moment to clear out.
 */
self.addEventListener('message', (e) => {
  const theirs = (e.data as { build?: unknown } | null)?.build;
  if (typeof theirs !== 'string') return;
  e.ports[0]?.postMessage(BUILD);
  if (theirs === BUILD) e.waitUntil(tidy(e.source?.id));
});

/**
 * Remove what older builds kept, unless a page of an older build is still open: it may yet ask for a file of its
 * own. `sure` is a page known to be of this build. The others are asked, and one that does not answer in time
 * counts as an older one.
 */
async function tidy(sure?: string): Promise<void> {
  const old = (await caches.keys()).filter((name) => name.startsWith(MINE) && name !== SHELL && name !== PICTURES && name !== SOUND);
  if (!old.length) return;
  const pages = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter((p) => p.url.startsWith(HOME) && p.id !== sure);
  const builds = await Promise.all(pages.map((p) => new Promise<string>((done) => {
    const line = new MessageChannel(), over = (build: string) => { line.port1.close(); done(build); };
    line.port1.onmessage = (answer) => over(String(answer.data));
    setTimeout(() => over(''), 3000);
    p.postMessage({ build: BUILD }, [line.port2]);
  })));
  if (builds.every((build) => build === BUILD)) await Promise.all(old.map((name) => caches.delete(name)));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Other sites, anything that is not a plain request, and anything asked for a part at a time are the network's affair.
  if (!req.url.startsWith(HOME) || req.method !== 'GET' || req.headers.has('range')) return;
  const path = req.url.slice(HOME.length).split(/[?#]/)[0];
  if (req.mode === 'navigate') {
    // Every place with words has a page of its own on the server, in a folder of its own, and each language has a
    // folder in front of those: `piece/nixie-tube/`, `ca/hall/2/`, `index/`, `tour/women/`.
    if (PLACE.test(path)) e.respondWith(page(e, path !== '' && path !== 'index.html'));
  }
  else if (path.startsWith('assets/')) e.respondWith(built(e));
  else if (PICTURE.test(path)) e.respondWith(picture(e));
  // What is left goes to the network untouched: the recordings of the guide and the archive films among it.
});

/**
 * A page: from the network if it answers soon, and otherwise the page this worker was installed with. That page is
 * the entrance's, and the museum draws any place from it by the address. `deep` says the address lies in a folder
 * further in. The kept page says its files are in "this folder", which is only true at the entrance, so the
 * museum's folder is written into it in full.
 */
async function page(e: Asking, deep: boolean): Promise<Response> {
  const fresh = Promise.resolve(e.preloadResponse).then((early) => early ?? fetch(e.request));
  // a slow answer is still waited for, or the browser complains that its early request was thrown away
  e.waitUntil(fresh.catch(() => undefined));
  const got = await Promise.race([fresh.catch(() => undefined), wait(PATIENCE)]);
  // a redirect is the browser's to follow
  if (got && (got.ok || got.type === 'opaqueredirect')) return got;
  const kept = await (await caches.open(SHELL)).match(HOME);
  if (!kept) return fresh;
  if (!deep) return kept;
  return new Response((await kept.text()).replace('<base href="./">', `<base href="${HOME}">`), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

/** A file of the building: its name says what is in it, so a kept copy is always right, whichever build kept it. */
async function built(e: Asking): Promise<Response> {
  const held = await caches.match(e.request.url, { ignoreVary: true });
  if (held) return held;
  const got = await fetch(e.request);
  if (got.status === 200) {
    const copy = got.clone();
    e.waitUntil(caches.open(SHELL).then((shell) => shell.put(e.request.url, copy)).catch(() => undefined));
  }
  return got;
}

/**
 * A picture: the kept one at once, where there is one. It is fetched again behind the visitor's back, so a
 * picture that was changed on the server is the new one the next time it is shown.
 */
async function picture(e: Asking): Promise<Response> {
  const pictures = await caches.open(PICTURES), url = e.request.url;
  const held = await pictures.match(url, { ignoreVary: true });
  const fresh = fetch(e.request).then((got) => {
    if (got.status === 200) e.waitUntil(keep(pictures, url, got.clone()));
    return got;
  });
  if (!held) return fresh;
  e.waitUntil(fresh.catch(() => undefined));
  return held;
}

let kept = 0;
async function keep(pictures: Cache, url: string, picture: Response): Promise<void> {
  try {
    await pictures.put(url, picture);
    if (kept++ % 40 === 0) await thin(pictures, MOST);
  } catch {
    // the device has no room left: make some
    await thin(pictures, MOST / 2).catch(() => undefined);
  }
}

/** Keep the newest pictures only. The store lists them in the order they were last fetched, so the first have gone longest unseen. */
async function thin(pictures: Cache, most: number): Promise<void> {
  const all = await pictures.keys();
  await Promise.all(all.slice(0, Math.max(0, all.length - most)).map((old) => pictures.delete(old)));
}

export {};
