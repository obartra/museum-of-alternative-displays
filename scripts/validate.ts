/**
 * The collection's rules, enforced. A piece that breaks one fails the build.
 * usage: tsx scripts/validate.ts
 */
import { halls } from '../src/data/halls';
import { NEED_LABEL, PRINCIPLE_LABEL, STATUS_LABEL } from '../src/data/schema';
import { en, type UiKey } from '../src/i18n/en';
import { LANGS, SOURCE_KIND, type Locale } from '../src/i18n/types';
import { pieces } from '../src/data/pieces';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { facts } from '../src/data/facts';
import { people } from '../src/data/people';
import { portraits } from '../src/data/portraits';
import { personLinks } from '../src/data/person-links';
import { persons } from '../src/data/persons';
import { bios } from '../src/data/person-bios';
import { tourFault, tours } from '../src/data/tours';
import { trails } from '../src/data/trails';
import { visit } from '../src/data/visit';
import { media } from '../src/data/media';
import { views } from '../src/data/views';
import { builders } from '../src/three/models';

const errors: string[] = [];
const fail = (id: string, msg: string) => errors.push(`${id}: ${msg}`);

// nobody selling anything, and nothing that plays a video
const BANNED_HOSTS = /(^|\.)(amazon|ebay|aliexpress|alibaba|etsy|youtube|youtu|vimeo|tiktok|instagram|facebook)\./i;
const DASH = /—|--/;

const seen = new Set<string>();
for (const p of pieces) {
  if (seen.has(p.id)) fail(p.id, 'duplicate id');
  seen.add(p.id);
  if (!/^[a-z0-9-]+$/.test(p.id)) fail(p.id, 'id must be lower case letters, digits and hyphens');
  if (!halls.some((h) => h.id === p.hall)) fail(p.id, `unknown hall ${p.hall}`);
  if (!builders[p.id]) fail(p.id, 'no 3D model registered in src/three/models/index.ts');
  if (!Number.isInteger(p.year) || p.year === 0 || p.year > new Date().getFullYear()) fail(p.id, `implausible year ${p.year}`);
  // an old piece has no date that one number can state: a negative year is a year BCE, kept for sorting, and the label gives the date in words
  if (p.year < 1500 && !p.yearText) fail(p.id, 'a year before 1500 needs its date in words, in yearText');
  if (p.lead.length < 30 || p.lead.length > 230) fail(p.id, `lead should be one sentence of 30 to 230 characters, got ${p.lead.length}`);
  if (p.how.length < 1) fail(p.id, 'needs at least one paragraph on how it makes an image');
  if (p.good.length < 2) fail(p.id, 'needs at least two things it is good at');
  if (p.bad.length < 2) fail(p.id, 'needs at least two limits. A piece with no stated limits is an advert');
  if (!p.look) fail(p.id, 'needs a note on what to try in the viewer');
  if (p.sources.length < 1) fail(p.id, 'needs at least one source');
  for (const s of p.sources) {
    let host = '';
    try { host = new URL(s.url).hostname; } catch { fail(p.id, `bad source URL ${s.url}`); }
    if (!/^https?:$/.test(s.url.slice(0, s.url.indexOf('/')))) fail(p.id, `source must be http(s): ${s.url}`);
    if (BANNED_HOSTS.test(host)) fail(p.id, `shops and video hosts are not sources: ${host}`);
  }
  const text = [p.name, p.aka ?? '', p.origin, p.statusNote, p.lead, ...p.how, ...p.good, ...p.bad, p.look].join('\n');
  if (DASH.test(text)) fail(p.id, 'house style: no em dashes or double hyphens');
}
for (const id of Object.keys(builders)) if (!seen.has(id)) errors.push(`${id}: a model with no piece in the data`);

// every piece has its still pictures, which is what a list shows and what a piece page shows first
for (const p of pieces) for (const when of ['day', 'night']) for (const w of [380, 760]) {
  if (!existsSync(new URL(`../public/posters/${p.id}-${when}-${w}.webp`, import.meta.url))) fail(p.id, `no still picture for ${when} at ${w} px. Run npm run posters`);
}

// every piece has the picture a chat shows beside a link to its own page
for (const p of pieces) if (!existsSync(new URL(`../public/og/${p.id}.jpg`, import.meta.url))) fail(p.id, 'no picture for link previews in public/og. Run python3 scripts/og.py');

// people: every entry belongs to a piece, names someone, says what they did, and marks as women only people it names
for (const [id, c] of Object.entries(people)) {
  if (!seen.has(id)) errors.push(`${id}: people for a piece that is not in the data`);
  if (!c.people.length) fail(id, 'a People section with nobody in it');
  for (const e of c.people) {
    if (!e.who.length || e.who.some((n) => !n.trim())) fail(id, 'a People line with no name');
    const n = e.did.trim().split(/\s+/).length;
    if (n < 3 || n > 34) fail(id, `the line for ${e.who[0]} is ${n} words, it should be 3 to 34`);
    for (const she of e.she ?? []) if (!e.who.includes(she)) fail(id, `${she} is marked but not named`);
  }
  if (DASH.test(c.people.map((e) => e.did).join('\n') + (c.note ?? ''))) fail(id, 'house style: no em dashes or double hyphens in People');
  for (const s of c.sources ?? []) {
    let host = '';
    try { host = new URL(s.url).hostname; } catch { fail(id, `bad source URL ${s.url}`); }
    if (BANNED_HOSTS.test(host)) fail(id, `shops and video hosts are not sources: ${host}`);
  }
}
// the short visit stops at pieces of the collection, in the order of the halls, and has a note for each stop
{
  const at = visit.map((id) => pieces.find((p) => p.id === id));
  for (const [n, p] of at.entries()) if (!p) errors.push(`short visit: ${visit[n]} is not a piece`);
  for (let n = 1; n < at.length; n++) if (at[n] && at[n - 1] && at[n]!.hall < at[n - 1]!.hall) errors.push(`short visit: ${visit[n]} comes after a piece of a later hall`);
  if (new Set(visit).size !== visit.length) errors.push('short visit: a piece is a stop twice');
  if (visit.some((_, n) => !(`visit.note.${n + 1}` in en)) || `visit.note.${visit.length + 1}` in en) errors.push('short visit: there must be one sentence visit.note.N for each stop, and no more');
}
// a guided tour stops where its trail stops, and is written without the dashes the site does not use
for (const tour of tours) {
  const fault = tourFault(tour);
  if (fault) errors.push(`tour ${tour.id}: ${fault}`);
  for (const part of tour.parts) if (DASH.test(part.title + part.text.join(' '))) errors.push(`tour ${tour.id}, ${part.id}: no em dashes or double hyphens`);
  // whoever a stop is said to be about is named on the label of that piece, spelled as the label spells them
  for (const part of tour.parts) for (const name of part.who ?? []) if (!people[part.id]?.people.some((e) => e.who.includes(name))) errors.push(`tour ${tour.id}, ${part.id}: ${name} is not named on the label of the piece`);
}
// a trail has stops and a line of its own on the floor. A trail whose people are written down by name names only
// people who are on a label, each once, and each with a source that has an https address
{
  const named = new Set(Object.values(people).flatMap((c) => c.people.flatMap((e) => e.who)));
  for (const tr of trails) {
    if (!tr.stops.length) errors.push(`trail ${tr.id}: it has no stops`);
    const once = new Set<string>();
    for (const x of tr.list ?? []) {
      if (!named.has(x.name)) errors.push(`trail ${tr.id}: ${x.name} is on its list, and no label spells a name that way`);
      if (once.has(x.name)) errors.push(`trail ${tr.id}: ${x.name} is on its list twice`);
      once.add(x.name);
      let host = '';
      try { host = new URL(x.source.url).hostname; } catch { /* reported below */ }
      if (!host || !/^https:\/\//.test(x.source.url) || !x.source.label.trim()) errors.push(`trail ${tr.id}: ${x.name} needs a source with a label and an https address`);
      if (BANNED_HOSTS.test(host)) errors.push(`trail ${tr.id}: shops and video hosts are not sources: ${host}`);
    }
    for (const other of trails.slice(0, trails.indexOf(tr))) {
      if (other.lane === tr.lane) errors.push(`trails ${other.id} and ${tr.id}: both run in the same lane of the aisle`);
      // a dot on the floor is 0.32 m across: two trails that stop at one piece need their dots further apart than that
      if (Math.abs(other.spur - tr.spur) < 0.4 && other.stops.some((id) => tr.stops.includes(id))) errors.push(`trails ${other.id} and ${tr.id}: where both stop at a piece, their dots lie on top of each other`);
    }
  }
}
// what the green line says in numbers about the collection is counted here, and not remembered. It is said so that
// it stays true while people and pieces are added elsewhere in the halls
{
  const tour = tours.find((t) => t.id === 'women'), said = tour ? tour.parts.flatMap((p) => p.text).join(' ') : '';
  const stops = tour ? tour.parts.map((p) => p.id).filter((id) => people[id]) : [];
  const named = new Set(Object.values(people).flatMap((c) => c.people.flatMap((e) => e.who)));
  const women = new Set(stops.flatMap((id) => people[id].people.flatMap((e) => e.she ?? [])));
  const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen'];
  const at = /\b([A-Za-z]+) women are named at these ([a-z]+) stops\b/.exec(said);
  if (tour && !at) errors.push('tour women: its closing words no longer count the women at its stops, so nothing here holds them to the labels');
  if (at && WORDS[women.size] !== at[1].toLowerCase()) errors.push(`tour women: it says ${at[1].toLowerCase()} women are named at its stops, and the labels there name ${women.size}`);
  if (at && WORDS[stops.length] !== at[2]) errors.push(`tour women: it says it has ${at[2]} stops, and it has ${stops.length}`);
  if (/\bmore than a hundred people\b/.test(said) && named.size <= 100) errors.push(`tour women: it says the labels name more than a hundred people, and they name ${named.size}`);
  if (/\bmore than forty other displays\b/.test(said) && pieces.length - stops.length <= 40) errors.push(`tour women: it says the line passed more than forty other displays, and it is ${pieces.length - stops.length}`);
}
// a portrait is a file that is really there, under a name that a label uses, with its credit filled in
{
  const named = new Set(Object.values(people).flatMap((c) => c.people.flatMap((e) => e.who)));
  for (const name of named) if (!personLinks[name]) errors.push(`person ${name}: needs a biography, profile or identifying record`);
  // every person has a page, and its address is theirs alone
  const folders = new Map<string, string>();
  for (const who of persons) {
    if (!who.slug) errors.push(`person ${who.name}: the name gives no address`);
    if (folders.has(who.slug)) errors.push(`person ${who.name}: the address person/${who.slug}/ is also that of ${folders.get(who.slug)}`);
    folders.set(who.slug, who.name);
  }
  // the accounts of people are held to one voice: docs/people/VOICE.md says why each rule is there
  const LOUD = /\b(pioneer\w*|legend\w*|genius|visionar\w*|revolution\w*|father of|mother of|iconic|famous\w*|renowned|brilliant|ground-?breaking|world-class|greatest|best known|celebrated|remarkable|extraordinar\w*)\b/i;
  const VOUCHED = /\b(credit\w*|says|said|dates|according to|records?|calls?|names?)\b/i;
  for (const [name, bio] of Object.entries(bios)) {
    const at = `account of ${name}`;
    if (!persons.some((who) => who.name === name)) errors.push(`${at}: nobody of that name is on a label`);
    if (!bio.about.length || bio.about.length > 4) errors.push(`${at}: one to four short paragraphs, not ${bio.about.length}`);
    if (!bio.sources.length) errors.push(`${at}: needs the sources it rests on`);
    if (bio.sources.every((s) => s.kind === 'reference')) errors.push(`${at}: needs a source that is not an encyclopedia`);
    if (bio.born && bio.died && bio.died <= bio.born) errors.push(`${at}: died before being born`);
    if (bio.died && !bio.born) errors.push(`${at}: a year of death without a year of birth`);
    for (const line of bio.about) {
      const words = line.split(/\s+/).length;
      if (words > 45) errors.push(`${at}: a paragraph of ${words} words; keep each under 45`);
      if (!/\.$/.test(line)) errors.push(`${at}: "${line.slice(-30)}" should end with a full stop`);
      if (/[\u2013\u2014]| - |--/.test(line)) errors.push(`${at}: no dashes`);
      if (/[!?;]/.test(line)) errors.push(`${at}: plain statements only, without ! ? or ;`);
      const loud = LOUD.exec(line);
      if (loud) errors.push(`${at}: "${loud[0]}" is praise, not a fact`);
      for (const sentence of line.split(/(?<=\.)\s+/)) if (/\b(first|earliest|invented|inventor of)\b/i.test(sentence) && !VOUCHED.test(sentence) && !/\bamong the\b/i.test(sentence)) errors.push(`${at}: "${sentence.slice(0, 50)}" claims a first or an invention: say who says so`);
    }
  }
  for (const [name, link] of Object.entries(personLinks)) {
    if (!named.has(name)) errors.push(`person link ${name}: no label spells a name that way`);
    if (!/^https:\/\//.test(link.url) || !link.label.trim() || !['biography', 'profile', 'record'].includes(link.kind)) errors.push(`person link ${name}: needs an HTTPS source, description and valid kind`);
  }
  for (const [name, pic] of Object.entries(portraits)) {
    if (!named.has(name)) errors.push(`portrait of ${name}: no label spells a name that way`);
    if (!existsSync(new URL(`../public/people/${pic.file}`, import.meta.url))) errors.push(`portrait of ${name}: public/people/${pic.file} is not there`);
    if ('study' in pic) {
      // a study names every page its photographs are on, and who published each
      if (!pic.study.length || pic.study.some((x) => !x.by.trim() || !/^https?:\/\//.test(x.source))) errors.push(`portrait of ${name}: a study needs the page of each photograph and who published it`);
    } else if (!pic.licence.trim() || !/^https?:\/\//.test(pic.source)) errors.push(`portrait of ${name}: needs its licence and the address of its source page`);
  }
}

// worth knowing: one fact a piece, short, and resting on a source like everything else
for (const [id, f] of Object.entries(facts)) {
  if (!seen.has(id)) errors.push(`${id}: a fact for a piece that is not in the data`);
  const n = f.text.trim().split(/\s+/).length;
  if (n < 8 || n > 45) fail(id, `the fact is ${n} words, it should be 8 to 45`);
  if (DASH.test(f.text)) fail(id, 'house style: no em dashes or double hyphens in the fact');
  let host = '';
  try { host = new URL(f.source.url).hostname; } catch { fail(id, `bad source URL for the fact: ${f.source.url}`); }
  if (!/^https?:\/\//.test(f.source.url)) fail(id, 'the source of the fact must be http(s)');
  if (BANNED_HOSTS.test(host)) fail(id, `shops and video hosts are not sources: ${host}`);
  if (!f.source.label.trim()) fail(id, 'the source of the fact needs a label');
}

// archive pictures: free to reuse, credited in full, and small enough to carry
const LICENCE = /^(Public domain|No known copyright restrictions|CC0 1\.0|CC BY(-SA)? [1-4]\.[05]( [A-Za-z-]+)?)$/;
// the open archives a picture may come from, by the host of its page there
const ARCHIVES = /(^|\.)(commons\.wikimedia\.org|archive\.org|nasa\.gov|patents\.google\.com|flickr\.com|rijksmuseum\.nl|wellcomecollection\.org|nypl\.org|loc\.gov|si\.edu|europeana\.eu)$/;
const words = (t: string) => t.trim().split(/\s+/).length;
const here = (path: string) => new URL(`../public/${path.replace(/^\.\//, '')}`, import.meta.url);
const bytes = (path: string) => (existsSync(here(path)) ? statSync(here(path)).size : -1);
let mediaBytes = 0;
for (const [id, list] of Object.entries(media)) {
  if (!seen.has(id)) errors.push(`${id}: archive pictures for a piece that is not in the data`);
  if (list.length > 6) fail(id, 'at most six archive pictures');
  const ids = new Set<string>();
  for (const m of list) {
    const at = `${id}/${m.id}`;
    if (ids.has(m.id)) fail(at, 'two archive pictures with this id');
    ids.add(m.id);
    if (!/^[a-z0-9-]+$/.test(m.id)) fail(at, 'id must be lower case letters, digits and hyphens');
    if (!LICENCE.test(m.credit.licence)) fail(at, `licence "${m.credit.licence}" is not public domain, CC0, CC BY or CC BY-SA`);
    if (/^CC/.test(m.credit.licence) && !/^https:\/\/creativecommons\.org\//.test(m.credit.licenceUrl ?? '')) fail(at, 'a Creative Commons picture needs the link to its licence');
    let from = '';
    try { from = new URL(m.credit.source).hostname; } catch { /* reported below */ }
    if (!/^https:\/\//.test(m.credit.source) || !ARCHIVES.test(from)) fail(at, `the source must be the item's page at one of the open archives, not ${m.credit.source}`);
    if (!m.credit.archive && from !== 'commons.wikimedia.org') fail(at, 'name the archive when it is not Wikimedia Commons');
    if (!m.credit.author.trim() || !m.credit.title.trim() || !m.credit.changes.trim()) fail(at, 'the credit needs an author, a title and what was changed');
    if (words(m.caption) > 40) fail(at, `caption is ${words(m.caption)} words, at most 40`);
    if (words(m.alt) > 30 || m.alt.trim().length < 12) fail(at, 'the text alternative should be 12 characters to 30 words');
    if (m.alt.trim() === m.caption.trim()) fail(at, 'the text alternative repeats the caption');
    if (DASH.test([m.caption, m.alt, m.credit.author, m.credit.changes].join('\n'))) fail(at, 'house style: no em dashes or double hyphens');
    if (!(m.width > 0 && m.height > 0)) fail(at, 'needs its pixel size');
    const files = m.kind === 'film' ? [m.mp4, m.webm, m.poster, m.poster.replace(/-poster\.webp$/, '-poster-480.webp')] : [m.small, m.large];
    for (const f of files) {
      const n = bytes(f);
      if (n < 0) fail(at, `missing file ${f}`); else mediaBytes += n;
      if (!f.startsWith(`./media/${id}/`)) fail(at, `${f} should be under ./media/${id}/`);
      // a dense engraving needs more than a photograph does. The large file only loads when someone opens it
      if (n > (/\.(mp4|webm)$/.test(f) ? 1_600_000 : /-480\.webp$/.test(f) ? 90_000 : 520_000)) fail(at, `${f} is ${Math.round(n / 1000)} KB, too heavy`);
    }
    if (m.kind === 'film' && (m.seconds < 2 || m.seconds > 20)) fail(at, 'a film runs 2 to 20 seconds');
  }
}
if (mediaBytes > 20_000_000) errors.push(`archive pictures weigh ${Math.round(mediaBytes / 1e6)} MB in all, at most 20`);

// places to look from: the words are data, the camera positions are in the model under the same id
for (const [id, list] of Object.entries(views)) {
  if (!seen.has(id)) errors.push(`${id}: views for a piece that is not in the data`);
  const ids = new Set<string>();
  for (const v of list) {
    if (ids.has(v.id)) fail(id, `two views called ${v.id}`);
    ids.add(v.id);
    if (!/^[a-z][a-z0-9-]*$/.test(v.id)) fail(id, `view id ${v.id} must be lower case letters, digits and hyphens`);
    if (v.label.length < 3 || v.label.length > 24) fail(id, `the button for view ${v.id} should be 3 to 24 characters, got ${v.label.length}`);
    if (v.hint && v.hint.length > 120) fail(id, `the line for view ${v.id} should be at most 120 characters, got ${v.hint.length}`);
    if (DASH.test(v.label + (v.hint ?? ''))) fail(id, 'house style: no em dashes or double hyphens');
  }
  if (list.filter((v) => v.kind === 'person').length > 2) fail(id, 'at most two person views, so the row of buttons stays short');
  if (list.length > 4) fail(id, 'at most four views');
}

// languages: every file in src/i18n/locales says everything the English says, in the same shape
const localeDir = new URL('../src/i18n/locales/', import.meta.url);
const doubts: string[] = [];
const marks = (x: string) => (x.match(/\{\/?\w+\}/g) ?? []).sort().join(' ');
/** What a word after a figure multiplies it by, in the languages of the museum. The longer words come first. */
const UNITS: [string, number][] = [
  ['mil millones', 1e9], ['mil milions', 1e9], ['milliards', 1e9], ['milliard', 1e9], ['milliarden', 1e9], ['milliarde', 1e9], ['mrd.', 1e9], ['billion', 1e9], ['十亿', 1e9], ['十億', 1e9], ['십억', 1e9],
  ['bilhões', 1e9], ['bilhão', 1e9], ['miliardi', 1e9], ['miliardoj', 1e9], ['miliardów', 1e9], ['miliardy', 1e9], ['miliardo', 1e9], ['miliard', 1e9], ['miljard', 1e9], ['mld', 1e9], ['миллиардов', 1e9], ['миллиарда', 1e9], ['миллиард', 1e9], ['млрд', 1e9],
  ['millones', 1e6], ['millón', 1e6], ['milions', 1e6], ['milió', 1e6], ['millionen', 1e6], ['millions', 1e6], ['million', 1e6], ['mio.', 1e6], ['百万', 1e6], ['百萬', 1e6], ['백만', 1e6],
  ['milhões', 1e6], ['milhão', 1e6], ['milioni', 1e6], ['milionoj', 1e6], ['milionów', 1e6], ['miliony', 1e6], ['milione', 1e6], ['miliono', 1e6], ['milion', 1e6], ['miljoen', 1e6], ['mln', 1e6], ['миллионов', 1e6], ['миллиона', 1e6], ['миллион', 1e6], ['млн', 1e6],
  ['千万', 1e7], ['千萬', 1e7], ['천만', 1e7], ['亿', 1e8], ['億', 1e8], ['억', 1e8], ['万', 1e4], ['萬', 1e4], ['만', 1e4],
  ['thousand', 1e3], ['tausend', 1e3], ['mille', 1e3], ['mila', 1e3], ['mil', 1e3], ['duizend', 1e3], ['тысячи', 1e3], ['тысяча', 1e3], ['тысяч', 1e3], ['тыс.', 1e3], ['tysięcy', 1e3], ['tysiące', 1e3], ['tysiąc', 1e3], ['tys.', 1e3], ['千', 1e3],
];
const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50 };
const roman = (x: string) => [...x].reduce((sum, c, i, all) => sum + (ROMAN[c]! < (ROMAN[all[i + 1] ?? ''] ?? 0) ? -ROMAN[c]! : ROMAN[c]!), 0);
/**
 * The figures in a text, each in one spelling, so that two languages can be compared. "10,197", "10.197" and "10 197" are one
 * figure. So are "130 million", "130 Millionen" and "1.3亿". A century also counts as its first year, so that "the 1500s",
 * "siglo XVI", "16. Jahrhundert" and "16世纪" agree. Figures of one digit are left out, because languages spell them as words.
 */
const figures = (text: string, lang: string) => {
  const found = new Set<string>();
  const x = text.replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1');
  const comma = !['en', 'zh', 'zh-hant', 'ja', 'ko'].includes(lang); // the others write the decimal mark as a comma
  for (const m of x.matchAll(/\d+(?:[.,]\d+)*/g)) {
    const after = x.slice(m.index + m[0].length).replace(/^[\s  ]+/, '').toLowerCase();
    // a unit word counts only when it ends there: not the "mil" of "mil·lisegons", and not the 千 of 千克, a kilogram
    const unit = UNITS.find(([word]) => after.startsWith(word) && (/[\u4e00-\u9fff\uac00-\ud7af]/.test(word) ? !(word === '千' && /^[克米瓦赫伏卡帕焦欧歐安牛升]/.test(after.slice(1))) : !/^[\p{L}·]/u.test(after.slice(word.length))));
    if (unit) {
      const plain = comma ? m[0].replace(/\./g, '').replace(',', '.') : m[0].replace(/,/g, '');
      found.add(String(Math.round(parseFloat(plain) * unit[1])));
    } else found.add(m[0].replace(/[.,]/g, ''));
  }
  const century = (n: number) => { found.add(String(n)); found.add(`${n - 1}00`); };
  for (const m of x.matchAll(/(?:siglo|segle|século|secolo)[\s ]+([IVXL]+)\b|\b([IVXL]+)e[\s  ]*siècle|\b([IVXL]+)[\s\u00a0]+(?:secolo|wiek|век)/g)) century(roman(m[1] ?? m[2] ?? m[3]!));
  for (const m of x.matchAll(/(\d{1,2})\.[\s ]*Jahrhundert|(\d{1,2})\s*世[纪紀]|(\d{1,2})\s*세기|(\d{1,2})-a[\s\u00a0]+jarcento|(\d{1,2})e[\s\u00a0]+eeuw/g)) century(Number(m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5]));
  for (const m of x.matchAll(/(\d{2})\s*世[纪紀]\s*(\d{2})\s*年代/g)) found.add(`${Number(m[1]) - 1}${m[2]}`);
  return new Set([...found].filter((n) => n.length > 1));
};
/** What a language still shows in English: a fact, a view or an archive caption added after its translation. It is listed, and it does not stop the build. */
const owed: Record<string, string[]> = {};
for (const file of existsSync(localeDir) ? readdirSync(localeDir).filter((f) => f.endsWith('.ts')) : []) {
  const code = file.replace(/\.ts$/, '');
  const loc = ((await import(new URL(file, localeDir).href)) as { default: Locale }).default;
  const say = (msg: string) => errors.push(`${code}: ${msg}`);
  const clean = (where: string, text: string) => { if (DASH.test(text)) say(`${where}: no em dashes or double hyphens`); };
  /** A figure in the English that the translation does not carry is worth a second look, though it may be right. */
  const sameFigures = (where: string, from: string, to: string) => { const there = figures(to, code); for (const n of figures(from, 'en')) if (!there.has(n)) doubts.push(`${code} ${where}: the English has ${n}, the translation does not`); };
  const later = (what: string) => (owed[code] ??= []).push(what);
  if (!LANGS.some((l) => l.code === code)) say('this file is not one of the languages listed in src/i18n/index.ts');
  for (const k of Object.keys(en) as UiKey[]) {
    const v = loc.ui?.[k];
    if (typeof v !== 'string' || !v.trim()) { say(`ui "${k}" is missing`); continue; }
    if (marks(v) !== marks(en[k])) say(`ui "${k}" must keep the marks of the English: ${marks(en[k]) || 'none'}`);
    clean(`ui "${k}"`, v);
  }
  for (const k of Object.keys(loc.ui ?? {})) if (!(k in en)) say(`ui "${k}" is not in the English list`);
  const sets: [keyof Locale & string, Record<string, string>][] = [['status', STATUS_LABEL], ['principle', PRINCIPLE_LABEL], ['need', NEED_LABEL], ['sourceKind', SOURCE_KIND]];
  for (const [name, source] of sets) for (const k of Object.keys(source)) if (!(loc[name] as Record<string, string> | undefined)?.[k]?.trim()) say(`${name} "${k}" is missing`);
  for (const h of halls) {
    const x = loc.halls?.[h.id];
    if (!x?.name?.trim() || !x.intro?.trim()) say(`hall ${h.id} is missing or incomplete`);
    else { clean(`hall ${h.id}`, x.name + x.intro); if ([...x.name].length > 16) say(`hall ${h.id}: the name must fit the board on a small phone, at most 16 characters`); }
  }
  for (const p of pieces) {
    const x = loc.pieces?.[p.id];
    if (!x) { say(`piece ${p.id} is missing`); continue; }
    for (const f of ['name', 'origin', 'statusNote', 'lead', 'look'] as const) if (!x[f]?.trim()) say(`${p.id}.${f} is missing`);
    if (!!p.aka !== !!x.aka?.trim()) say(`${p.id}.aka ${p.aka ? 'is missing' : 'is not in the English'}`);
    for (const f of ['how', 'good', 'bad'] as const) {
      if (x[f]?.length !== p[f].length || x[f].some((line) => !line?.trim())) say(`${p.id}.${f} should have ${p[f].length} entries, as the English has`);
    }
    if (!!p.yearText !== !!x.yearText?.trim()) say(`${p.id}.yearText ${p.yearText ? 'is missing' : 'is not in the English'}`);
    const whole = (q: typeof x) => [q.name, q.aka ?? '', q.yearText ?? '', q.origin, q.statusNote, q.lead, ...(q.how ?? []), ...(q.good ?? []), ...(q.bad ?? []), q.look].join('\n');
    clean(p.id, whole(x));
    sameFigures(p.id, whole(p), whole(x));
  }
  for (const id of Object.keys(loc.pieces ?? {})) if (!seen.has(id)) say(`piece ${id} is not in the collection`);
  for (const [id, f] of Object.entries(facts)) {
    const said = loc.facts?.[id];
    if (!said?.trim()) { later(`fact ${id}`); continue; }
    clean(`fact ${id}`, said);
    sameFigures(`fact ${id}`, f.text, said);
  }
  for (const [id, c] of Object.entries(people)) {
    const x = loc.people?.[id];
    if (!x) { later(`People section ${id}`); continue; }
    if (x.did?.length !== c.people.length || x.did.some((line) => !line?.trim())) { say(`people ${id} should have ${c.people.length} lines, as the English has`); continue; }
    if (!!c.note !== !!x.note?.trim()) say(`people ${id}: the note ${c.note ? 'is missing' : 'is not in the English'}`);
    clean(`people ${id}`, x.did.join('\n') + (x.note ?? ''));
    sameFigures(`people ${id}`, c.people.map((e) => e.did).join('\n') + (c.note ?? ''), x.did.join('\n') + (x.note ?? ''));
  }
  for (const [id, list] of Object.entries(views)) for (const v of list) {
    const x = loc.views?.[id]?.[v.id];
    if (!x?.label?.trim()) { later(`view ${id}/${v.id}`); continue; }
    if ([...x.label].length > 28) say(`view ${id}/${v.id}: the button should be at most 28 characters`);
    if (!!v.hint !== !!x.hint?.trim()) say(`view ${id}/${v.id}: the line ${v.hint ? 'is missing' : 'is not in the English'}`);
    clean(`view ${id}/${v.id}`, x.label + (x.hint ?? ''));
  }
  for (const [id, list] of Object.entries(media)) for (const m of list) {
    const x = loc.media?.[id]?.[m.id];
    if (!x) { later(`archive picture ${id}/${m.id}`); continue; }
    if (!x.caption?.trim() || !x.alt?.trim() || !x.changes?.trim()) { say(`archive picture ${id}/${m.id} is incomplete`); continue; }
    if (!!m.year !== !!x.year?.trim()) say(`archive picture ${id}/${m.id}: the year ${m.year ? 'is missing' : 'is not in the English'}`);
    clean(`archive picture ${id}/${m.id}`, x.caption + x.alt + x.changes);
    sameFigures(`${id}/${m.id}`, m.caption + (m.year ?? ''), x.caption + (x.year ?? ''));
  }
  for (const tour of tours) {
    const own = loc.tours?.[tour.id];
    if (!own) { later(`tour ${tour.id}`); continue; }
    for (const part of tour.parts) {
      const x = own.parts[part.id];
      if (!x?.title?.trim() || x.text?.length !== part.text.length || x.text.some((line) => !line?.trim())) { say(`tour ${tour.id}, ${part.id}: should have a title and ${part.text.length} paragraphs, as the English has`); continue; }
      clean(`tour ${tour.id}, ${part.id}`, x.title + x.text.join('\n'));
      sameFigures(`tour ${tour.id}, ${part.id}`, part.text.join('\n'), x.text.join('\n'));
    }
  }
  const wait = owed[code] ?? [];
  const kindsOwed = ['fact', 'People section', 'view', 'archive picture', 'tour'].map((k) => [k, wait.filter((w) => w.startsWith(k + ' ')).length] as const).filter(([, n]) => n);
  console.log(`language ${code}: ${Object.keys(loc.ui ?? {}).length} interface strings, ${Object.keys(loc.pieces ?? {}).length} pieces` + (wait.length ? `, still in English: ${kindsOwed.map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}`).join(', ')}` : ''));
}
if (doubts.length) console.log(`\n${doubts.length} figure(s) to look at in the translations:\n` + doubts.slice(0, 40).map((d) => '  ' + d).join('\n'));

const kinds: Record<string, number> = {};
for (const p of pieces) for (const s of p.sources) kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;
console.log(`${pieces.length} pieces in ${halls.length} halls`);
console.log(halls.map((h) => `  hall ${h.id} ${h.name}: ${pieces.filter((p) => p.hall === h.id).length}`).join('\n'));
console.log('sources by kind:', Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', '));
console.log(`pieces whose only sources are encyclopedia articles: ${pieces.filter((p) => p.sources.every((s) => s.kind === 'reference')).length}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.map((e) => '  ' + e).join('\n'));
  process.exit(1);
}
console.log('collection is valid');
