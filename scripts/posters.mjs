// Renders the still picture of every piece on its stand, by day and by night, into public/posters.
// List pages show these and never start 3D graphics, and a piece page shows one until its model is running.
// Run it again after changing a model or the room:
//   npm run dev            (in one terminal)
//   npm run posters        (in another; needs Playwright: npm i -D playwright, or set PLAYWRIGHT to its path)
// SITE points it at another address, CHROME at a browser to use, and IDS limits it to some pieces.
import { mkdirSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const out = new URL('../public/posters/', import.meta.url).pathname, base = process.env.SITE ?? 'http://localhost:5173/';
const BIG = 760, SMALL = 380, only = process.env.IDS ? `&ids=${process.env.IDS}` : '';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const when of ['day', 'night']) {
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(`${base}#sheet?size=${BIG}${when === 'night' ? '&lights=off' : ''}${only}`, { waitUntil: 'load' });
  await page.waitForSelector('body[data-ready="1"]', { timeout: 1500000 });
  // the small one is the large one halved, which is smoother than rendering it small
  const shots = await page.evaluate(async (small) => {
    const half = document.createElement('canvas');
    half.width = half.height = small;
    const g = half.getContext('2d');
    g.imageSmoothingQuality = 'high';
    const all = [];
    for (const f of document.querySelectorAll('figure')) {
      const img = f.querySelector('img');
      await img.decode();
      g.drawImage(img, 0, 0, small, small);
      all.push([f.querySelector('figcaption').textContent.split(' ')[1], img.src, half.toDataURL('image/webp', 0.84)]);
    }
    return all;
  }, SMALL);
  for (const [id, big, small] of shots) {
    writeFileSync(`${out}${id}-${when}-${BIG}.webp`, Buffer.from(big.split(',')[1], 'base64'));
    writeFileSync(`${out}${id}-${when}-${SMALL}.webp`, Buffer.from(small.split(',')[1], 'base64'));
  }
  console.log(when, shots.length, 'posters');
  await page.close();
}
await browser.close();
