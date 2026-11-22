// Makes every file that carries the museum's mark from the one drawing in src/mark.ts:
//   public/icons/icon.svg                 the icon of the museum as an app
//   public/icons/icon-192.png, -512.png   the same with rounded corners, for a desk
//   public/icons/icon-maskable-512.png    for an Android phone, which cuts it to a circle or a rounded square
//   public/icons/apple-touch-icon.png     for an iPhone, which rounds the corners itself
//   public/icons/favicon.svg, -48.png     the first plate alone, for the tab of a browser
//   public/og.jpg                         the picture shared with a link: docs/brand/og-base.jpg with the name plate
// public/manifest.webmanifest and index.html name these files.
// Run it again after changing the drawing:
//   npx tsx scripts/icons.ts        (needs Playwright: npm i -D playwright, or set PLAYWRIGHT to its path)
// CHROME points it at a browser to use.
import { readFileSync, writeFileSync } from 'node:fs';
import { faviconSvg, iconSvg, markSvg } from '../src/mark';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const root = new URL('../', import.meta.url).pathname;
const dir = `${root}public/icons/`;
const drawing = iconSvg();
writeFileSync(`${dir}icon.svg`, drawing);
writeFileSync(`${dir}favicon.svg`, faviconSvg());

const icons: { file: string; size: number; letters?: number }[] = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  // an Android phone may show no more than the circle in the middle, four fifths of the width: the letters are
  // drawn smaller and nearer the middle to stay inside it, and the enamels run on to the edges
  { file: 'icon-maskable-512.png', size: 512, letters: 0.76 },
  // an iPhone rounds the corners itself, and paints black whatever is see-through
  { file: 'apple-touch-icon.png', size: 180, letters: 1 },
];
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--allow-file-access-from-files'] });
for (const { file, size, letters } of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${drawing}</body>`);
  await page.evaluate(([px, scale]: readonly [number, number]) => {
    const svg = document.querySelector('svg')!;
    svg.setAttribute('width', String(px)); svg.setAttribute('height', String(px)); svg.style.display = 'block';
    if (!scale) return;
    svg.getElementById('plate')!.setAttribute('rx', '0');
    svg.getElementById('letters')!.setAttribute('transform', `translate(256 256) scale(${scale}) translate(-256 -256)`);
  }, [size, letters ?? 0] as const);
  writeFileSync(dir + file, await page.locator('svg').screenshot({ omitBackground: true }));
  console.log(file, size);
  await page.close();
}

// the tab of a browser that does not draw an SVG there
{
  const page = await browser.newPage({ viewport: { width: 48, height: 48 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${faviconSvg().replace('<svg ', '<svg width="48" height="48" style="display:block" ')}</body>`);
  writeFileSync(`${dir}favicon-48.png`, await page.locator('svg').screenshot({ omitBackground: true }));
  console.log('favicon-48.png', 48);
  await page.close();
}

// the picture shared with a link: the hall, and a white enamel plate on the floor at the right with the mark and the name
{
  const face = `data:font/woff2;base64,${readFileSync(`${root}node_modules/@fontsource-variable/sofia-sans-extra-condensed/files/sofia-sans-extra-condensed-latin-wght-normal.woff2`).toString('base64')}`;
  const base = `data:image/jpeg;base64,${readFileSync(`${root}docs/brand/og-base.jpg`).toString('base64')}`;
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>
    @font-face { font-family: Sign; src: url("${face}") format("woff2"); font-weight: 1 1000; }
    body { margin: 0; width: 1200px; height: 630px; background: url("${base}") center / cover; position: relative; }
    .plate { position: absolute; right: 30px; bottom: 28px; display: flex; align-items: center; gap: 14px; padding: 14px 22px 14px 16px;
      background: #f7f6f0; border-radius: 8px; box-shadow: inset 0 0 0 4px #f7f6f0, inset 0 0 0 5.5px #14171a, 0 0 0 1px rgba(20, 23, 26, .5), 0 3px 0 rgba(20, 23, 26, .45); }
    .plate svg { width: 68px; height: 68px; display: block; margin: 2px 0 2px 2px; }
    .plate div { font: 800 33px/.94 Sign, sans-serif; text-transform: uppercase; letter-spacing: .012em; color: #14171a; }
  </style><div class="plate">${markSvg()}<div>Museum of<br>Alternative Displays</div></div>`);
  await page.evaluate(() => document.fonts.load('800 33px Sign'));
  await page.waitForTimeout(300);
  if (!(await page.evaluate(() => document.fonts.check('800 33px Sign')))) throw new Error('the display face did not load for the share picture');
  writeFileSync(`${root}public/og.jpg`, await page.screenshot({ type: 'jpeg', quality: 86 }));
  console.log('og.jpg', 1200, 630);
  await page.close();
}
await browser.close();
