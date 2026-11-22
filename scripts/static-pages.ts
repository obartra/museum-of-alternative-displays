/**
 * A page of its own for every piece and every hall, written at build time beside the one page of the museum.
 *
 * The museum is one page that draws everything itself, and it tells its places apart by what follows the # in the
 * address. A chat, a search engine and a reader without scripts never see that part: to them every address of the
 * museum is the same page, with one name and one picture. These pages give each piece and each hall an address
 * that says what it is: `piece/<id>/` and `hall/<n>/`, with its own title, sentence and picture in the head, and
 * the words of its label in the body.
 *
 * Each is the museum's own page with three changes. A `base` points every file it loads back at the museum. The
 * head names the piece. And the body holds the label as plain HTML, for whoever reads without scripts. In a
 * browser the page hands over to the museum at the same place at once: the address becomes the museum's, with
 * `#piece-<id>` on it, and the museum draws the piece. The old addresses with # work as they always did.
 *
 * `sitemap.xml` lists the pages for search engines. The pages are in English, the language the museum opens in.
 */
import { halls } from '../src/data/halls';
import { inHall, pieces } from '../src/data/pieces';
import { people } from '../src/data/people';
import type { Piece } from '../src/data/schema';
import { en } from '../src/i18n/en';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NAME = en['site.name'];

interface Own { path: string; route: string; title: string; says: string; picture?: { file: string; wide: number; high: number; alt: string }; body: string }

/** The label of a piece as plain HTML. Addresses in it are written from the museum's own folder: the `base` of the page points there. */
function label(p: Piece): string {
  const hall = halls.find((h) => h.id === p.hall)!, credit = people[p.id];
  const list = (items: string[]) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const sources = [...p.sources, ...(credit?.sources ?? []).filter((s) => !p.sources.some((own) => own.url === s.url))];
  return `<main id="main" data-plain class="stack prose" style="max-width: 70ch; margin: 0 auto; padding: 24px 16px">
<p><a href="./">${esc(NAME)}</a> / <a href="./hall/${hall.id}/">${esc(en['nav.hall'].replace('{n}', String(hall.id)).replace('{name}', hall.name))}</a></p>
<h1>${esc(p.name)}</h1>
<p>${esc(p.yearText ?? String(p.year))}. ${esc(p.origin)}.</p>
<p><img src="./posters/${p.id}-day-760.webp" width="760" height="760" alt="${esc(en['stage.poster'].replace('{name}', p.name))}" style="max-width: 100%; height: auto"></p>
<p>${esc(p.lead)}</p>
<h2>${esc(en['piece.how'])}</h2>${p.how.map((x) => `<p>${esc(x)}</p>`).join('')}
<h2>${esc(en['piece.good'])}</h2>${list(p.good)}
<h2>${esc(en['piece.bad'])}</h2>${list(p.bad)}
<p>${esc(p.statusNote)}</p>
${credit ? `<h2>${esc(en['piece.people'])}</h2>${credit.people.map((e) => `<p><strong>${esc(e.who.join(', '))}.</strong> ${esc(e.did)}</p>`).join('')}${credit.note ? `<p>${esc(credit.note)}</p>` : ''}` : ''}
<h2>${esc(en['piece.sources'])}</h2><ul>${sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
</main>`;
}

function own(): Own[] {
  const out: Own[] = [];
  for (const hall of halls) {
    const name = en['nav.hall'].replace('{n}', String(hall.id)).replace('{name}', hall.name);
    out.push({
      path: `hall/${hall.id}/`, route: `hall-${hall.id}`, title: name, says: hall.intro,
      body: `<main id="main" data-plain class="stack prose" style="max-width: 70ch; margin: 0 auto; padding: 24px 16px">
<p><a href="./">${esc(NAME)}</a></p>
<h1>${esc(name)}</h1>
<p>${esc(hall.intro)}</p>
<ul>${inHall(hall.id).map((p) => `<li><a href="./piece/${p.id}/">${esc(p.name)}</a>. ${esc(p.lead)}</li>`).join('')}</ul>
</main>`,
    });
  }
  for (const p of pieces) {
    out.push({
      path: `piece/${p.id}/`, route: `piece-${p.id}`, title: p.name, says: p.lead, body: label(p),
      picture: { file: `og/${p.id}.jpg`, wide: 760, high: 760, alt: en['stage.poster'].replace('{name}', p.name) },
    });
  }
  return out;
}

/** Put one tag of the head in place of another. The build fails if the page no longer has the tag: the pages would say the wrong thing. */
function swap(page: string, find: RegExp, put: string): string {
  if (!find.test(page)) throw new Error(`static pages: the page has no ${find}`);
  return page.replace(find, () => put);
}

/**
 * The pages, made from the museum's own page as the build leaves it, and the sitemap. `page` is that page.
 * The address of the museum is read from its canonical link.
 */
export function staticPages(page: string): { fileName: string; source: string }[] {
  const site = /<link rel="canonical" href="([^"]+)">/.exec(page)?.[1];
  if (!site) throw new Error('static pages: the page names no canonical address');
  const files = own().map((o) => {
    const up = '../'.repeat(o.path.split('/').length - 1), title = en['title.page'].replace('{page}', o.title).replace('{site}', NAME);
    // The base comes first, before any address in the head is read, and is then fixed at its full address, so
    // that it still points at the museum when the address of the page has become the museum's own.
    // With scripts running, the plain label is hidden while the museum starts, so that it does not show for a moment first.
    const handover = `<base href="${up}"><meta name="route" content="${o.route}"><script>(function(){var b=document.querySelector('base');b.href=b.href;try{history.replaceState(null,'',b.href+(location.hash||'#${o.route}'))}catch(e){}document.documentElement.classList.add('js')})()</script><style>.js [data-plain]{visibility:hidden}</style>`;
    let html = swap(page, /<meta charset="utf-8">/, `<meta charset="utf-8">\n${handover}`);
    html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    html = swap(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(o.says)}">`);
    html = swap(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${site}${o.path}">`);
    html = swap(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(o.title)}">`);
    html = swap(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(o.says)}">`);
    html = swap(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${site}${o.path}">`);
    if (o.picture) {
      html = swap(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${site}${o.picture.file}">`);
      html = swap(html, /<meta property="og:image:width" content="[^"]*">/, `<meta property="og:image:width" content="${o.picture.wide}">`);
      html = swap(html, /<meta property="og:image:height" content="[^"]*">/, `<meta property="og:image:height" content="${o.picture.high}">`);
      html = swap(html, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${esc(o.picture.alt)}">`);
      html = swap(html, /<meta name="twitter:card" content="[^"]*">/, '<meta name="twitter:card" content="summary">');
    }
    html = swap(html, /<div id="app"><\/div>/, `<div id="app">${o.body}</div>`);
    return { fileName: `${o.path}index.html`, source: html };
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[site, ...own().map((o) => site + o.path)].map((url) => `  <url><loc>${esc(url)}</loc></url>`).join('\n')}
</urlset>
`;
  return [...files, { fileName: 'sitemap.xml', source: sitemap }];
}
