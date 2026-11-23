/**
 * A page on the server for every place of the museum that has words, in every language the museum speaks.
 *
 * The museum is one page that draws everything itself. A search engine, a chat and a reader without scripts see
 * what the server sends for an address and little else. So each place that has words has a folder with a page in
 * it: the entrance, `hall/<n>/`, `piece/<id>/`, `index/`, `people/`, `about/` and `tour/<id>/`, the words of a
 * guided tour. English lies at the top, and every other language in a folder of its own: `ca/piece/<id>/`.
 *
 * Each page is the museum's own page with four changes. A `base` points every file it loads back at the museum's
 * folder. The head names the place: its title, its sentence, its picture, its address, and the same place in the
 * other languages. A block of data says the same to a search engine in its own terms. And the body holds the words
 * of the place as plain HTML, with links to the places around it. In a browser the museum draws the place over
 * those words at once, and the address stays as it is.
 *
 * `sitemap.xml` lists every page. `404.html` is what the server sends for an address it does not have.
 */
import { readFileSync } from 'node:fs';
import { brief } from '../src/brief';
import { news } from '../src/data/news';
import { sheets, worksheet, type Words } from '../src/teach';
import { halls } from '../src/data/halls';
import { media, type Media } from '../src/data/media';
import { inHall, pieces } from '../src/data/pieces';
import { people, type Credit } from '../src/data/people';
import { personLinks } from '../src/data/person-links';
import type { Hall, Piece, Principle, SourceKind } from '../src/data/schema';
import { PRINCIPLE_LABEL } from '../src/data/schema';
import type { ViewInfo } from '../src/data/views';
import { tours, type Tour } from '../src/data/tours';
import { en, type UiKey } from '../src/i18n/en';
import { LANGS, SOURCE_KIND, type CreditText, type HallText, type Lang, type Locale, type PieceText, type TourText, type ViewText } from '../src/i18n/types';
import { AUTHOR, LICENCE, REPO } from '../src/site';
import { personByName, persons } from '../src/data/persons';
import { bios, personSources } from '../src/data/person-bios';
import { portraits } from '../src/data/portraits';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A person in the data for a search engine. An encyclopedia article about them says which person of that name is meant. */
const person = (name: string): Record<string, string> => {
  const link = personLinks[name];
  return { '@type': 'Person', name, ...(link && /^https:\/\/[a-z]+\.wikipedia\.org\//.test(link.url) ? { sameAs: link.url } : {}) };
};
/** A name in the plain words, as a link to the person's own page in the museum. `pre` is the folder of the language. */
const personName = (name: string, pre = ''): string => {
  const who = personByName(name);
  return who ? `<a href="${pre}person/${who.slug}/">${esc(name)}</a>` : esc(name);
};

/** The words of one language, as the museum's own pages find them: where a language lacks something, the English stands in. */
interface Speech {
  code: Lang;
  /** The language as a page declares it: `ca`, `pt-BR`, `zh-Hans`. */
  tag: string;
  /** The folder of the language, in front of every address: nothing for English, `ca/` for Catalan. */
  pre: string;
  ui: (key: UiKey, vars?: Record<string, string | number>) => string;
  piece: (p: Piece) => PieceText;
  hall: (hall: Hall) => HallText;
  credit: (pieceId: string, c: Credit) => CreditText;
  tour: (tour: Tour) => TourText | undefined;
  /** The account of a person and whether it is the language's own: English stands in until it is translated. */
  bio: (slug: string, about: string[]) => { about: string[]; own: boolean };
  /** What an archive picture shows, and what stands in for it for someone who cannot see it. */
  media: (pieceId: string, m: Media) => { caption: string; alt: string; year?: string };
  view: (pieceId: string, v: ViewInfo) => ViewText;
  principle: (p: Principle) => string;
  kind: (k: SourceKind) => string;
}
function speech(code: Lang, loc?: Locale): Speech {
  const put = (s: string, vars?: Record<string, string | number>) => (vars ? s.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all)) : s);
  return {
    code, tag: LANGS.find((l) => l.code === code)!.tag, pre: code === 'en' ? '' : `${code}/`,
    ui: (key, vars) => put(loc?.ui[key] ?? en[key], vars),
    piece: (p) => loc?.pieces[p.id] ?? p,
    hall: (hall) => loc?.halls[hall.id] ?? hall,
    credit: (pieceId, c) => {
      const own = loc?.people?.[pieceId];
      return own && own.did.length === c.people.length ? own : { did: c.people.map((e) => e.did), note: c.note };
    },
    bio: (slug, about) => { const own = loc?.bios?.[slug]; return !loc ? { about, own: true } : own && own.length === about.length ? { about: own, own: true } : { about, own: false }; },
    tour: (tour) => (loc ? loc.tours?.[tour.id] : { title: tour.title, lead: tour.lead, parts: Object.fromEntries(tour.parts.map((p) => [p.id, { title: p.title, text: p.text }])) }),
    view: (pieceId, v) => loc?.views[pieceId]?.[v.id] ?? v,
    principle: (p) => loc?.principle[p] ?? PRINCIPLE_LABEL[p],
    kind: (k) => loc?.sourceKind[k] ?? SOURCE_KIND[k],
    media: (pieceId, m) => {
      const own = loc?.media[pieceId]?.[m.id];
      return own ? { caption: own.caption, alt: own.alt, year: own.year ?? m.year } : m;
    },
  };
}

/** One page: the place it stands for, its folder, what its head says and the plain words of its body. */
interface Own {
  /** The name the museum knows the place by: '', `hall-2`, `piece-nixie-tube`, `index`, `words-women`. */
  name: string;
  /** Its folder, under the folder of the language. */
  path: string;
  /** The title of the browser tab, whole. */
  title: string;
  /** The name of the place alone, for a chat's card. */
  short: string;
  says: string;
  picture?: { file: string; wide: number; high: number; alt: string };
  body: string;
  /** What kind of page it is to a search engine, and what else it should know. */
  kind: string;
  more?: Record<string, unknown>;
  /** The way here from the entrance, as name and folder: a search engine shows it in place of the address. */
  crumbs: [string, string][];
  /** The pictures on the page, written from the museum's folder, for the sitemap. */
  pictures?: string[];
}

/** A sentence with links in it: `{a}words{/a}` becomes a link to `links.a`. */
const rich = (text: string, links: Record<string, string>): string =>
  esc(text).replace(/\{(\w+)\}(.*?)\{\/\1\}/g, (_, k: string, words: string) => `<a href="${esc(links[k] ?? './')}"${/^https?:/.test(links[k] ?? '') ? ' rel="noopener"' : ''}>${words}</a>`);

/** The pages of one language. Addresses in them are written from the museum's folder: the `base` of the page points there. */
function pagesOf(w: Speech, site: string): Own[] {
  const out: Own[] = [];
  const titled = (page: string) => w.ui('title.page', { page, site: w.ui('site.name') });
  const hallName = (hall: Hall) => w.ui('nav.hall', { n: hall.id, name: w.hall(hall).name });
  const year = (p: Piece) => w.piece(p).yearText ?? String(p.year);
  const list = (items: string[]) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const told = tours.filter((tour) => !tour.draft && w.tour(tour));
  // the way on from every page, for a reader and for a search engine that follows links
  const ways = `<p><a href="${w.pre || './'}">${esc(w.ui('site.name'))}</a> / <a href="${w.pre}index/">${esc(w.ui('nav.depot'))}</a> / <a href="${w.pre}people/">${esc(w.ui('nav.people'))}</a> / <a href="${w.pre}about/">${esc(w.ui('nav.about'))}</a> / <a href="${w.pre}teach/">${esc(w.ui('nav.teach'))}</a>${told.map((tour) => ` / <a href="${w.pre}tour/${tour.id}/">${esc(w.tour(tour)!.title)}</a>`).join('')}</p>`;
  const home: [string, string] = [w.ui('site.name'), ''];

  // the entrance
  out.push({
    name: '', path: '', title: w.ui('site.title', { n: pieces.length }), short: w.ui('site.name'), says: w.ui('site.description', { n: pieces.length }), kind: 'CollectionPage', crumbs: [],
    body: `<h1>${esc(w.ui('site.name'))}</h1>
<p>${esc(w.ui('site.description', { n: pieces.length }))}</p>
<p>${esc(w.ui('entrance.intro', { n: pieces.length }))}</p>
${halls.map((hall) => `<h2><a href="${w.pre}hall/${hall.id}/">${esc(hallName(hall))}</a></h2>
<p>${esc(w.hall(hall).intro)}</p>
<ul>${inHall(hall.id).map((p) => `<li><a href="${w.pre}piece/${p.id}/">${esc(w.piece(p).name)}</a>, ${esc(year(p))}</li>`).join('')}</ul>`).join('\n')}
${ways}`,
  });

  for (const hall of halls) {
    const name = hallName(hall), near = [halls[hall.id - 2], halls[hall.id]].filter((x) => !!x);
    out.push({
      name: `hall-${hall.id}`, path: `hall/${hall.id}/`, title: titled(w.ui('hall.title', { n: hall.id, name: w.hall(hall).name })), short: name, says: brief(w.hall(hall).intro), picture: { file: `og/hall-${hall.id}.jpg`, wide: 1200, high: 630, alt: name }, kind: 'CollectionPage', crumbs: [home, [name, `hall/${hall.id}/`]],
      body: `<h1>${esc(name)}</h1>
<p>${esc(w.hall(hall).intro)}</p>
<ul>${inHall(hall.id).map((p) => `<li><a href="${w.pre}piece/${p.id}/">${esc(w.piece(p).name)}</a>, ${esc(year(p))}. ${esc(w.piece(p).lead)}</li>`).join('')}</ul>
<p>${near.map((x) => `<a href="${w.pre}hall/${x.id}/">${esc(hallName(x))}</a>`).join(' / ')}</p>
${ways}`,
    });
  }

  for (const p of pieces) {
    const words = (text: string) => text.replace(/^Public domain$/, w.ui('credit.pd')).replace(/\bUnknown artist\b/, w.ui('credit.unknown'));
    const x = w.piece(p), hall = halls.find((h) => h.id === p.hall)!, credit = people[p.id], did = credit ? w.credit(p.id, credit) : undefined;
    const sources = [...p.sources, ...(credit?.sources ?? []).filter((s) => !p.sources.some((own) => own.url === s.url))];
    const i = pieces.indexOf(p), near = [pieces[i - 1], pieces[i + 1]].filter((q) => !!q);
    const alt = w.ui('stage.poster', { name: x.name });
    // From the archive: real photographs, drawings and films, each with its credit and its licence
    const held = (media[p.id] ?? []).map((m) => ({ m, own: w.media(p.id, m), file: (m.kind === 'film' ? m.mp4 : m.large).replace(/^\.\//, '') }));
    const stills = held.filter(({ m }) => m.kind !== 'film');
    out.push({
      name: `piece-${p.id}`, path: `piece/${p.id}/`, title: titled(w.ui('title.piece', { name: x.name })), short: x.name, says: x.lead, kind: 'ItemPage',
      crumbs: [home, [hallName(hall), `hall/${hall.id}/`], [x.name, `piece/${p.id}/`]],
      picture: { file: `og/${p.id}.jpg`, wide: 760, high: 760, alt },
      pictures: [`posters/${p.id}-day-760.webp`, ...stills.map(({ file }) => file)],
      more: {
        about: { '@type': 'Thing', name: x.name, ...(x.aka ? { alternateName: x.aka } : {}), description: x.lead },
        ...(credit ? { mentions: [...new Set(credit.people.flatMap((e) => e.who))].map(person) } : {}),
        citation: sources.map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.url })),
        // each archive picture with who made it, its licence and the page it came from: what a picture search shows beside it
        ...(stills.length ? { image: stills.map(({ m, own, file }) => ({ '@type': 'ImageObject', contentUrl: file, caption: own.caption, description: own.alt, width: m.width, height: m.height, creditText: m.credit.author, ...(m.credit.licenceUrl ? { license: m.credit.licenceUrl } : {}), acquireLicensePage: m.credit.source })) } : {}),
      },
      body: `<p><a href="${w.pre}hall/${hall.id}/">${esc(hallName(hall))}</a></p>
<h1>${esc(x.name)}</h1>
<p>${esc(year(p))}. ${esc(x.origin)}.</p>
${x.aka ? `<p>${esc(w.ui('piece.aka', { names: x.aka }))}</p>` : ''}
<p><img src="posters/${p.id}-day-760.webp" width="760" height="760" alt="${esc(alt)}" style="max-width: 100%; height: auto"></p>
<p>${esc(x.lead)}</p>
<h2>${esc(w.ui('piece.how'))}</h2>${x.how.map((line) => `<p>${esc(line)}</p>`).join('')}
<h2>${esc(w.ui('piece.look'))}</h2><p>${esc(x.look)}</p>
<h2>${esc(w.ui('piece.good'))}</h2>${list(x.good)}
<h2>${esc(w.ui('piece.bad'))}</h2>${list(x.bad)}
<p>${esc(x.statusNote)}</p>
${credit && did ? `<h2>${esc(w.ui('piece.people'))}</h2>${credit.people.map((e, k) => `<p><strong>${e.who.map((n) => personName(n, w.pre)).join(', ')}.</strong> ${esc(did.did[k])}</p>`).join('')}${did.note ? `<p>${esc(did.note)}</p>` : ''}` : ''}
${held.length ? `<h2>${esc(w.ui('archive.title'))}</h2><ul>${held.map(({ m, own, file }) => `<li><a href="${esc(file)}">${esc(own.caption)}</a>${own.year ? ` ${esc(own.year)}.` : ''} ${esc(w.ui(`archive.kind.${m.kind}`))}, ${esc(w.ui('archive.by', { author: words(m.credit.author) }))}. ${esc(words(m.credit.licence))}. <a href="${esc(m.credit.source)}" rel="noopener">${esc(m.credit.archive ?? w.ui('archive.commons'))}</a></li>`).join('')}</ul>` : ''}
<h2>${esc(w.ui('piece.sources'))}</h2><ul>${sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
<p>${near.map((q) => `<a href="${w.pre}piece/${q.id}/">${esc(w.piece(q).name)}</a>`).join(' / ')}</p>
${ways}`,
    });
  }

  // the index: the whole collection in one list
  out.push({
    name: 'index', path: 'index/', title: titled(w.ui('depot.head', { n: pieces.length })), short: w.ui('depot.title'), says: w.ui('depot.says', { n: pieces.length }), kind: 'CollectionPage', crumbs: [home, [w.ui('depot.title'), 'index/']],
    more: { mainEntity: { '@type': 'ItemList', numberOfItems: pieces.length, itemListElement: pieces.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: w.piece(p).name, url: `${w.pre}piece/${p.id}/` })) } },
    body: `<h1>${esc(w.ui('depot.title'))}</h1>
<p>${esc(w.ui('depot.says', { n: pieces.length }))}</p>
<ul>${pieces.map((p) => `<li><a href="${w.pre}piece/${p.id}/">${esc(w.piece(p).name)}</a>, ${esc(year(p))}. ${esc(w.piece(p).lead)}</li>`).join('')}</ul>
${ways}`,
  });

  // the people: everyone named on a label, under the piece they worked on
  // worksheets for a class: the list, and one for each hall (src/teach.ts writes both, here and in the museum)
  const taught: Words = { ui: (key, vars) => w.ui(key as UiKey, vars), piece: w.piece, hall: w.hall, credit: w.credit, view: w.view, principle: w.principle, kind: w.kind, href: (path) => w.pre + path, full: (path) => `${site}${w.pre}${path}` };
  out.push({
    name: 'teach', path: 'teach/', title: titled(w.ui('teach.head')), short: w.ui('nav.teach'), says: w.ui('teach.says'), kind: 'WebPage', crumbs: [home, [w.ui('nav.teach'), 'teach/']],
    body: `${sheets(taught)}\n${ways}`,
  });
  for (const hall of halls) {
    const head = w.ui('teach.title', { n: hall.id, name: w.hall(hall).name });
    out.push({
      name: `teach-${hall.id}`, path: `teach/${hall.id}/`, title: titled(head), short: head, says: w.ui('teach.lead'), picture: { file: `og/hall-${hall.id}.jpg`, wide: 1200, high: 630, alt: hallName(hall) }, kind: 'WebPage', crumbs: [home, [w.ui('nav.teach'), 'teach/'], [head, `teach/${hall.id}/`]],
      body: `${worksheet(hall.id, taught)}\n${ways}`,
    });
  }

  out.push({
    name: 'people', path: 'people/', title: titled(w.ui('nav.people')), short: w.ui('nav.people'), says: w.ui('people.lead'), kind: 'WebPage', crumbs: [home, [w.ui('nav.people'), 'people/']],
    more: { mentions: [...new Set(pieces.flatMap((p) => people[p.id]?.people.flatMap((e) => e.who) ?? []))].map(person) },
    body: `<h1>${esc(w.ui('nav.people'))}</h1>
<p>${esc(w.ui('people.lead'))}</p>
${pieces.filter((p) => people[p.id]).map((p) => {
    const credit = people[p.id], did = w.credit(p.id, credit);
    return `<h2><a href="${w.pre}piece/${p.id}/">${esc(w.piece(p).name)}</a></h2><ul>${credit.people.map((e, k) => `<li><strong>${e.who.map((n) => personName(n, w.pre)).join(', ')}.</strong> ${esc(did.did[k])}</li>`).join('')}</ul>`;
  }).join('\n')}
${ways}`,
  });

  // a page for each person: who they were, where an account has been written, their lines, and the sources
  for (const who of persons) {
    const bio = bios[who.name], outside = personLinks[who.name], pic = portraits[who.name];
    const lines = who.on.map(({ piece, k }) => w.credit(piece, people[piece]).did[k]);
    const sources = personSources(who);
    const told = bio ? w.bio(who.slug, bio.about) : undefined;
    const life = bio?.born ? (bio.died ? w.ui('person.life', { born: bio.born, died: Array.isArray(bio.died) ? w.ui('person.either', { a: bio.died[0], b: bio.died[1] }) : bio.died }) : w.ui('person.born', { born: bio.born })) : '';
    const path = `person/${who.slug}/`;
    out.push({
      name: `person-${who.slug}`, path, title: titled(who.name), short: who.name, says: brief(lines[0]), kind: 'ProfilePage',
      crumbs: [home, [w.ui('nav.people'), 'people/'], [who.name, path]],
      ...(pic ? { pictures: [`people/${pic.file}`] } : {}),
      // a link to a person shows their portrait, or else the first piece they are on
      picture: faceSize(pic?.file) ? { file: `og/people/${pic!.file.replace(/\.webp$/, '.jpg')}`, wide: faceSize(pic!.file)![0], high: faceSize(pic!.file)![1], alt: who.name } : { file: `og/${who.on[0].piece}.jpg`, wide: 760, high: 760, alt: w.ui('stage.poster', { name: w.piece(pieces.find((p) => p.id === who.on[0].piece)!).name }) },
      more: {
        mainEntity: { ...person(who.name), description: told?.own ? told.about.join(' ') : lines[0], ...(bio?.born ? { birthDate: String(bio.born) } : {}), ...(bio?.died && !Array.isArray(bio.died) ? { deathDate: String(bio.died) } : {}) },
        citation: sources.map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.url })),
      },
      body: `<p><a href="${w.pre}people/">${esc(w.ui('people.more'))}</a></p>
<h1>${esc(who.name)}</h1>
${life ? `<p>${esc(life)}</p>` : ''}
${pic ? `<p><img src="people/${esc(pic.file)}" alt="${esc(who.name)}" style="max-width: 168px; height: auto"></p>` : ''}
${told ? told.about.map((line) => `<p${told.own ? '' : ' lang="en"'}>${esc(line)}</p>`).join('') : ''}
<h2>${esc(w.ui('person.in'))}</h2><ul>${who.on.map(({ piece, entry }, i) => { const p = pieces.find((q) => q.id === piece)!, others = entry.who.filter((n) => n !== who.name); return `<li><a href="${w.pre}piece/${p.id}/">${esc(w.piece(p).name)}</a>. ${esc(lines[i])}${others.length ? ` ${w.ui('person.with', { names: '\u0001' }).split('\u0001').map(esc).join(others.map((n) => personName(n, w.pre)).join(', '))}.` : ''}</li>`; }).join('')}</ul>
${sources.length ? `<h2>${esc(w.ui('piece.sources'))}</h2><ul>${sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>` : ''}
${outside ? `<h2>${esc(w.ui('person.elsewhere'))}</h2><p>${esc(w.ui(`person.kind.${outside.kind}`))}: <a href="${esc(outside.url)}" rel="noopener">${esc(outside.label)}</a></p>` : ''}
${ways}`,
    });
  }

  // about the museum
  out.push({
    name: 'about', path: 'about/', title: titled(w.ui('nav.about')), short: w.ui('nav.about'), says: w.ui('about.says'), kind: 'AboutPage', crumbs: [home, [w.ui('nav.about'), 'about/']],
    body: `<h1>${esc(w.ui('nav.about'))}</h1>
<p>${esc(w.ui('about.lead'))}</p>
<h2>${esc(w.ui('about.piece'))}</h2><p>${esc(w.ui('about.piece.1'))}</p>
<h2>${esc(w.ui('about.sourced'))}</h2><p>${esc(w.ui('about.sourced.1'))}</p><p>${esc(w.ui('about.sourced.3'))}</p>
<h2>${esc(w.ui('about.pictures'))}</h2><p>${esc(w.ui('about.pictures.1', { n: pieces.length }))}</p><p>${esc(w.ui('about.pictures.2'))}</p><p>${esc(w.ui('about.pictures.archive'))}</p>
<h2>${esc(w.ui('about.room'))}</h2><p>${esc(w.ui('about.room.1'))}</p><p>${esc(w.ui('about.room.2'))}</p><p>${esc(w.ui('about.room.3'))}</p>
<h2>${esc(w.ui('about.corrections'))}</h2><p>${rich(w.ui('about.corrections.1'), { a: `${REPO}/issues`, b: REPO })}</p>
<h2>${esc(w.ui('about.licence'))}</h2><p>${rich(w.ui('about.licence.1', { name: AUTHOR }), { a: LICENCE })}</p><p>${esc(w.ui('about.licence.2'))}</p>
<p>${rich(w.ui('about.thanks'), { a: 'https://blair-neal.gitbook.io/survey-of-alternative-displays' })}</p>
<p>${esc(w.ui('about.author', { name: AUTHOR }))}</p>
${ways}`,
  });

  // the words of each guided tour this language tells
  for (const tour of told) {
    const text = w.tour(tour)!;
    out.push({
      name: `words-${tour.id}`, path: `tour/${tour.id}/`, title: titled(text.title), short: text.title, says: text.lead, kind: 'WebPage', crumbs: [home, [text.title, `tour/${tour.id}/`]],
      body: `<p>${esc(w.ui('tour.label'))}</p>
<h1>${esc(text.title)}</h1>
<p>${esc(text.lead)}</p>
${tour.parts.map((part) => {
    const piece = pieces.find((p) => p.id === part.id), say = text.parts[part.id];
    return `<h2>${esc(say.title)}</h2>${piece ? `<p><a href="${w.pre}piece/${piece.id}/">${esc(w.ui('tour.at', { piece: w.piece(piece).name, n: piece.hall }))}</a></p>` : ''}${say.text.map((line) => `<p>${esc(line)}</p>`).join('')}`;
  }).join('\n')}
${ways}`,
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
 * The page the server sends for an address it does not have, at whatever depth that address lies. It finds the
 * museum's folder for itself: the address the museum is published at if the page is under it, and otherwise the
 * first folder of the address, where a project's pages live. Then it is the museum's own page, at the place that
 * says a page is missing. A reader without scripts gets one sentence and the way to the entrance, and a search
 * engine is told to keep the page out of its list.
 */
function missing(page: string, site: string): string {
  const find = `<script>(function(){var site=${JSON.stringify(site)},root=location.href.indexOf(site)===0?site:location.origin+'/'+(location.pathname.split('/')[1]||'')+'/';if(root.slice(-2)==='//')root=location.origin+'/';document.write('<base href="'+root+'">');document.documentElement.classList.add('js')})()</script>`;
  let html = swap(page, /<base href="\.\/">\s*<script>[^<]*<\/script>/, find);
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(en['title.page'].replace('{page}', en['missing.title']).replace('{site}', en['site.name']))}</title>\n<meta name="robots" content="noindex">`);
  html = swap(html, /<link rel="canonical" href="[^"]*">/, '');
  // the browser looks ahead for the page's own files before the base is set, so those are written from the museum's folder
  html = html.replace(/(href|src)="\.\/(assets|fonts|icons|favicon)/g, `$1="${new URL(site).pathname}$2`);
  return swap(html, /<div id="app"><\/div>/, `<div id="app"><main id="main" data-plain class="stack prose" style="max-width: 70ch; margin: 0 auto; padding: 24px 16px"><h1>${esc(en['missing.title'])}</h1><p><a href="${site}">${esc(en['site.name'])}</a></p></main></div>`);
}

/**
 * The pages, made from the museum's own page as the build leaves it, and the sitemap. `page` is that page,
 * `locales` the languages other than English under their codes, and `changed` the day of the last change.
 * The address of the museum is read from the page's canonical link. `root` is the entrance in English: the page
 * itself, with its words written in.
 */

/** The size of a person's portrait as a link shows it, made by scripts/og.py; none for a portrait too small to stand alone. */
const faceSizes = JSON.parse(readFileSync(new URL('../public/og/people/sizes.json', import.meta.url), 'utf8')) as Record<string, [number, number]>;
const faceSize = (file?: string): [number, number] | undefined => (file ? faceSizes[file.replace(/\.webp$/, '')] : undefined);

export function staticPages(page: string, locales: Record<string, Locale>, changed: string): { root: string; files: { fileName: string; source: string }[] } {
  const site = /<link rel="canonical" href="([^"]+)">/.exec(page)?.[1];
  if (!site) throw new Error('static pages: the page names no canonical address');
  const speeches = [speech('en'), ...Object.keys(locales).sort().map((code) => speech(code as Lang, locales[code]))];
  const all = speeches.map((w) => ({ w, pages: pagesOf(w, site) }));
  // the same place in the other languages: only those that have a page for it, since a tour is not told in all of them
  const others = (name: string) => all.filter(({ pages }) => pages.some((o) => o.name === name)).map(({ w, pages }) => ({ w, path: pages.find((o) => o.name === name)!.path }));
  const files: { fileName: string; source: string }[] = [];
  const listed: { url: string; pictures: string[] }[] = [];
  let root = '';
  for (const { w, pages } of all) {
    for (const o of pages) {
      const folder = w.pre + o.path, url = site + folder, up = '../'.repeat(folder.split('/').length - 1) || './';
      const same = others(o.name);
      const alternates = same.map((x) => `<link rel="alternate" hreflang="${x.w.tag}" href="${site}${x.w.pre}${x.path}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${site}${o.path}">`;
      const museum = { '@type': 'WebSite', '@id': `${site}#museum`, url: site, name: en['site.name'], ...(w.ui('site.name') !== en['site.name'] ? { alternateName: w.ui('site.name') } : {}), author: { '@type': 'Person', name: AUTHOR }, license: LICENCE };
      const data = {
        '@context': 'https://schema.org',
        '@graph': [
          museum,
          {
            '@type': o.kind, '@id': url, url, name: o.short, description: o.says, inLanguage: w.tag, isPartOf: { '@id': `${site}#museum` },
            ...(changed ? { dateModified: changed } : {}),
            ...(o.picture ? { primaryImageOfPage: { '@type': 'ImageObject', url: site + o.picture.file, width: o.picture.wide, height: o.picture.high } } : {}),
            ...(o.crumbs.length ? { breadcrumb: { '@type': 'BreadcrumbList', itemListElement: o.crumbs.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site + w.pre + path })) } } : {}),
            ...absolute(o.more ?? {}, site),
          },
        ],
      };
      let html = swap(page, /<html lang="en"/, `<html lang="${w.tag}"`);
      html = swap(html, /<base href="\.\/">/, `<base href="${up}">`);
      html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(o.title)}</title>`);
      html = swap(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(o.says)}">`);
      html = swap(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">\n${alternates}`);
      html = swap(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(o.short)}">`);
      html = swap(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(o.says)}">`);
      html = swap(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
      html = swap(html, /<meta property="og:site_name" content="[^"]*">/, `<meta property="og:site_name" content="${esc(w.ui('site.name'))}">`);
      html = swap(html, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${esc(w.ui('entrance.room.alt'))}">`);
      if (o.picture) {
        html = swap(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${site}${o.picture.file}">`);
        html = swap(html, /<meta property="og:image:width" content="[^"]*">/, `<meta property="og:image:width" content="${o.picture.wide}">`);
        html = swap(html, /<meta property="og:image:height" content="[^"]*">/, `<meta property="og:image:height" content="${o.picture.high}">`);
        html = swap(html, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${esc(o.picture.alt)}">`);
        html = swap(html, /<meta name="twitter:card" content="[^"]*">/, `<meta name="twitter:card" content="${o.picture.wide > o.picture.high * 1.5 ? 'summary_large_image' : 'summary'}">`);
      }
      // the name of the place and its language go with the data, so that the museum can tell when it has drawn another place over it
      html = swap(html, /<\/head>/, `<script type="application/ld+json" data-place="${w.code === 'en' ? '' : w.code} ${o.name}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>\n</head>`);
      // the same place in the other languages, each under its own name
      const tongues = `<p>${same.map((x) => `<a href="${x.w.pre + x.path || './'}" hreflang="${x.w.tag}" lang="${x.w.tag}">${esc(LANGS.find((l) => l.code === x.w.code)!.name)}</a>`).join(' / ')}</p>`;
      html = swap(html, /<div id="app"><\/div>/, `<div id="app"><main id="main" data-plain class="stack prose" style="max-width: 70ch; margin: 0 auto; padding: 24px 16px">\n${o.body}\n${tongues}\n</main></div>`);
      listed.push({ url, pictures: (o.pictures ?? []).map((file) => site + file) });
      if (folder === '') root = html; else files.push({ fileName: `${folder}index.html`, source: html });
    }
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${listed.map(({ url, pictures }) => `  <url><loc>${esc(url)}</loc>${changed ? `<lastmod>${changed}</lastmod>` : ''}${pictures.map((file) => `<image:image><image:loc>${esc(file)}</image:loc></image:image>`).join('')}</url>`).join('\n')}
</urlset>
`;
  // what is new, as an Atom feed, in English: feed readers and the sites that gather them find the museum here
  const x = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>Museum of Alternative Displays</title>
<subtitle>What is new in the museum</subtitle>
<link href="${site}"/>
<link rel="self" href="${site}feed.xml"/>
<id>${site}</id>
<updated>${news[0].date}T12:00:00Z</updated>
<author><name>Museum of Alternative Displays</name></author>
${news.map((n) => `<entry><title>${x(n.title)}</title><link href="${site}${n.link}"/><id>${site}${n.link}#${n.date}</id><updated>${n.date}T12:00:00Z</updated><summary>${x(n.says)}</summary></entry>`).join('\n')}
</feed>
`;
  return { root, files: [...files, { fileName: 'feed.xml', source: feed }, { fileName: 'sitemap.xml', source: sitemap }, { fileName: '404.html', source: missing(page, site) }] };
}

/** In the data for a search engine, an address written from the folder of the museum is written out in full. */
function absolute(more: Record<string, unknown>, site: string): Record<string, unknown> {
  const fix = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(fix) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, (k === 'url' || k === 'contentUrl') && typeof x === 'string' && !/^https?:/.test(x) ? site + x : fix(x)])) : v;
  return fix(more) as Record<string, unknown>;
}
