// Rebuilds the patent drawings in public/media from the list in scripts/patents.json.
// Each item names a piece, the patent, the address of one full-size drawing sheet at Google Patents
// and the box to cut from it, in pixels of that sheet. The sheet is downloaded once into a cache outside
// the repository. Anything listed under "blank" is painted white first (an attorney's signature block, or the
// edge of a neighbouring figure). The box is then cut out, turned by "rotate" degrees clockwise if the figure
// lies on its side, and written as two WebP files: long side 480 and 1280.
//
// Needs: Node 18 or later (for fetch), the sharp package (resolved from node_modules, from NODE_PATH,
// or from the path in SHARP), and network access to patentimages.storage.googleapis.com for sheets
// that are not in the cache yet.
//
//   node scripts/patents.mjs                 every item
//   IDS=nixie-tube,oled node scripts/patents.mjs   only these pieces
//   PATENT_CACHE=/some/dir                   where downloads are kept (default ~/patent-cache)
//
// It prints one line per item with the pixel size and weight of the large file. Those sizes are the
// width and height that src/data/media-patents.ts has to carry.
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP ?? 'sharp');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = process.env.PATENT_CACHE ?? join(homedir(), 'patent-cache');
const items = JSON.parse(readFileSync(join(root, 'scripts/patents.json'), 'utf8'));
const only = process.env.IDS ? new Set(process.env.IDS.split(',')) : null;
const AGENT = 'museum-of-alternative-displays-picture-research/1.0 (patent drawings for a museum site; node)';
const PAUSE = 3000, LARGE = 1280, SMALL = 480, TARGET = 160_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let last = 0;
/** One request at a time, a pause between them, and a longer wait when the host says slow down. */
async function download(url, to) {
  if (existsSync(to) && statSync(to).size > 0) return;
  mkdirSync(dirname(to), { recursive: true });
  for (let wait = 20_000, tries = 0; tries < 5; tries++, wait *= 2) {
    const gap = Date.now() - last;
    if (gap < PAUSE) await sleep(PAUSE - gap);
    const res = await fetch(url, { headers: { 'user-agent': AGENT } });
    last = Date.now();
    if (res.ok) {
      writeFileSync(`${to}.part`, Buffer.from(await res.arrayBuffer()));
      renameSync(`${to}.part`, to);
      return;
    }
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status} for ${url}`);
    console.log(`HTTP ${res.status} for ${url}, waiting ${wait / 1000} s`);
    await sleep(wait);
  }
  throw new Error(`gave up on ${url}`);
}

/** The cut figure, black on white, upright, with its long side at most `side` pixels. Never enlarged. */
async function figure(file, item, side) {
  let sheet = sharp(file).flatten({ background: '#ffffff' }).greyscale();
  // a signature block or the edge of a neighbouring figure inside the box is painted out
  if (item.blank) {
    const patches = item.blank.map((b) => ({ input: { create: { width: b.width, height: b.height, channels: 3, background: '#ffffff' } }, left: b.left, top: b.top }));
    sheet = sharp(await sheet.composite(patches).png().toBuffer()).greyscale();
  }
  let img = sharp(await sheet.extract(item.crop).png().toBuffer());
  if (item.rotate) img = img.rotate(item.rotate);
  return img.resize({ width: side, height: side, fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' });
}

let made = 0;
for (const item of items) {
  if (only && !only.has(item.piece)) continue;
  const file = join(cache, 'sheets', item.patent, basename(new URL(item.sheet).pathname));
  await download(item.sheet, file);
  const dir = join(root, 'public/media', item.piece);
  mkdirSync(dir, { recursive: true });
  // the large file steps its quality down until it is light enough to carry
  let large, quality = 82;
  for (; ; quality -= 6) {
    large = await (await figure(file, item, LARGE)).webp({ quality, effort: 6 }).toBuffer({ resolveWithObject: true });
    if (large.data.length <= TARGET || quality <= 58) break;
  }
  const small = await (await figure(file, item, SMALL)).webp({ quality: 82, effort: 6 }).toBuffer();
  writeFileSync(join(dir, `${item.id}-${LARGE}.webp`), large.data);
  writeFileSync(join(dir, `${item.id}-${SMALL}.webp`), small);
  console.log(`${item.piece}/${item.id} ${item.patent} ${large.info.width}x${large.info.height} ${large.data.length} bytes q${quality}, small ${small.length} bytes`);
  made++;
}
console.log(`${made} drawings written to public/media`);
