// Makes the icons of the museum as an app from the one drawing, public/icons/icon.svg, and writes them beside it.
// public/manifest.webmanifest and index.html name these files.
// The drawing is a plate with rounded corners and nothing round it. A phone cuts an icon to a shape of its own,
// so for a phone the plate runs out to the edges, its line is left off, and what stands on it is drawn smaller,
// to stay inside the cut.
// Run it again after changing the drawing:
//   node scripts/icons.mjs        (needs Playwright: npm i -D playwright, or set PLAYWRIGHT to its path)
// CHROME points it at a browser to use.
import { readFileSync, writeFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const dir = new URL('../public/icons/', import.meta.url).pathname;
const drawing = readFileSync(`${dir}icon.svg`, 'utf8');
const icons = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  // an Android phone cuts this one to a circle or a rounded square, and may show no more than its middle four fifths
  { file: 'icon-maskable-512.png', size: 512, mark: 0.84 },
  // an iPhone rounds the corners itself, and paints black whatever is see-through
  { file: 'apple-touch-icon.png', size: 180, mark: 1.06 },
];
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
for (const { file, size, mark } of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${drawing}</body>`);
  await page.evaluate(([px, scale]) => {
    const svg = document.querySelector('svg');
    svg.setAttribute('width', px); svg.setAttribute('height', px); svg.style.display = 'block';
    if (!scale) return;
    for (const id of ['plate', 'gloss']) svg.getElementById(id).setAttribute('rx', 0);
    svg.getElementById('line').remove();
    svg.getElementById('mark').setAttribute('transform', `translate(256 256) scale(${scale}) translate(-256 -256)`);
  }, [size, mark]);
  writeFileSync(dir + file, await page.locator('svg').screenshot({ omitBackground: true }));
  console.log(file, size);
  await page.close();
}
await browser.close();
