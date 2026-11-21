// Photographs what the walk needs, into public/cutouts and public:
//   <id>-<day|night>.webp      one piece on its block, alone, from three sides, each with its cover beside it
//   far-<day|night>.webp       the same for every piece, small, in one sheet
//   walk-<day|night>-<800|1600>.webp   the hall from the door, shown before the hall itself has started
// and writes src/three/walk/glows.ts: the colour of every piece that glows in the dark, read from its model.
// Pieces a visitor is not near are shown as these pictures and not as models: see src/three/walk/stands.ts.
// Run it again after changing a model, the hall or its light:
//   npm run dev            (in one terminal)
//   npm run cutouts        (in another; needs Playwright: npm i -D playwright, or set PLAYWRIGHT to its path)
// SITE points it at another address, CHROME at a browser to use, IDS limits it to some pieces,
// and ONLY=pieces|sheets|stills does one part of the work.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const pub = new URL('../public/', import.meta.url).pathname, out = `${pub}cutouts/`, base = process.env.SITE ?? 'http://localhost:5173/';
const only = process.env.ONLY, wanted = process.env.IDS?.split(',');
mkdirSync(out, { recursive: true });
const save = (path, url) => writeFileSync(path, Buffer.from(url.split(',')[1], 'base64'));
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const open = async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto(`${base}#cutouts`, { waitUntil: 'load' });
  await page.waitForSelector('body[data-ready="1"]', { timeout: 120000 });
  return page;
};

if (!only || only === 'pieces') {
  let page = await open();
  const ids = (await page.evaluate(() => window.cutouts.ids)).filter((id) => !wanted || wanted.includes(id));
  // the glows already written down stay, unless this run photographs their piece again
  const table = new URL('../src/three/walk/glows.ts', import.meta.url).pathname, glows = {};
  for (const m of readFileSync(table, 'utf8').matchAll(/'([a-z0-9-]+)': (0x[0-9a-f]{6})/g)) glows[m[1]] = Number(m[2]);
  for (const [n, id] of ids.entries()) {
    for (const day of [true, false]) {
      // a browser drawing in software tires: after a failure, start a fresh page and try the piece once more
      let shot;
      try { shot = await page.evaluate(([id, day]) => window.cutouts.shoot(id, day), [id, day]); }
      catch (err) { console.log('again:', id, String(err).slice(0, 120)); await page.close().catch(() => undefined); page = await open(); shot = await page.evaluate(([id, day]) => window.cutouts.shoot(id, day), [id, day]); }
      save(`${out}${id}-${day ? 'day' : 'night'}.webp`, shot[0]);
      if (shot[1] === null) delete glows[id]; else glows[id] = shot[1];
    }
    console.log(`${n + 1}/${ids.length}`, id);
  }
  const all = await page.evaluate(() => window.cutouts.ids);
  writeFileSync(table, `// Written by scripts/cutouts.mjs from the models themselves. Do not edit: run \`npm run cutouts\` again.
/** The colour each glowing piece throws round it in the dark. A piece that is not here does not glow. */
export const glows: Record<string, number> = {
${all.filter((id) => id in glows).map((id) => `  '${id}': 0x${glows[id].toString(16).padStart(6, '0')},`).join('\n')}
};
`);
  await page.close();
}
if (!only || only === 'sheets') {
  const page = await open();
  for (const day of [true, false]) save(`${out}far-${day ? 'day' : 'night'}.webp`, await page.evaluate((day) => window.cutouts.sheet(day), day));
  console.log('sheets');
  await page.close();
}
if (!only || only === 'stills') {
  for (const day of [true, false]) {
    // a picture that comes back black, which a browser drawing in software sometimes gives, is far smaller than a real one
    let shot;
    for (let go = 0; go < 6 && !shot; go++) {
      const page = await open();
      try {
        const pair = await page.evaluate((day) => window.cutouts.still(day), day);
        if (pair[0].length > 12000) shot = pair; else console.log('blank picture, again');
      } catch (err) { console.log('again:', String(err).slice(0, 120)); }
      await page.close().catch(() => undefined);
    }
    if (!shot) throw new Error(`no picture of the hall by ${day ? 'day' : 'night'}`);
    save(`${pub}walk-${day ? 'day' : 'night'}-1600.webp`, shot[0]);
    save(`${pub}walk-${day ? 'day' : 'night'}-800.webp`, shot[1]);
    console.log('still', day ? 'day' : 'night');
  }
}
await browser.close();
