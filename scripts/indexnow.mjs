// Tells the search engines that share IndexNow (Bing, Yandex, Naver, Seznam and others) which pages changed.
//
//   node scripts/indexnow.mjs hashes dist                 write dist/pages.json: every page and a hash of what it says
//   node scripts/indexnow.mjs send old.json new.json      send the addresses of the pages that are new or say something new
//
// The hash leaves out the names of the script and style files, which change with every build, so that a page counts
// as changed only when its words or pictures do. The key is public by design: IndexNow reads it from the site itself,
// at <site>/<key>.txt, to know the request came from the site's owner.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://obartra.github.io/museum-of-alternative-displays/';
const KEY = readdirSync(new URL('../public/', import.meta.url)).find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, 32);
const [mode, a, b] = process.argv.slice(2);

if (mode === 'hashes') {
  const pages = {};
  const walk = (dir, at) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path, `${at}${name}/`);
      else if (name === 'index.html') {
        const said = readFileSync(path, 'utf8').replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<link\b[^>]*>/g, '').replace(/\.\/assets\/[^"')\s]+/g, '');
        pages[at] = createHash('sha1').update(said).digest('hex').slice(0, 16);
      }
    }
  };
  walk(a, '');
  writeFileSync(join(a, 'pages.json'), JSON.stringify(pages));
  console.log(`${Object.keys(pages).length} pages hashed`);
} else if (mode === 'send') {
  const read = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return {}; } };
  const old = read(a), now = read(b);
  const changed = Object.keys(now).filter((p) => old[p] !== now[p]).map((p) => SITE + p);
  if (!KEY) { console.error('no key file in public/'); process.exit(1); }
  if (!changed.length) { console.log('no page changed'); process.exit(0); }
  // one request takes at most 10,000 addresses
  for (let i = 0; i < changed.length; i += 10000) {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}${KEY}.txt`, urlList: changed.slice(i, i + 10000) }),
    });
    console.log(`IndexNow answered ${res.status} for ${Math.min(10000, changed.length - i)} pages`);
    if (res.status >= 400) console.log(await res.text());
  }
} else {
  console.error('use: hashes <dist> | send <old.json> <new.json>');
  process.exit(1);
}
