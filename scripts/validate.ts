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
  if (p.year < 1500 || p.year > new Date().getFullYear()) fail(p.id, `implausible year ${p.year}`);
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
  const text = [p.name, p.aka ?? '', p.origin, p.statusNote, p.lead, ...p.how, ...p.good, ...p.bad, p.look, p.dispute ?? ''].join('\n');
  if (DASH.test(text)) fail(p.id, 'house style: no em dashes or double hyphens');
}
for (const id of Object.keys(builders)) if (!seen.has(id)) errors.push(`${id}: a model with no piece in the data`);

// every piece has its still pictures, which is what a list shows and what a piece page shows first
for (const p of pieces) for (const when of ['day', 'night']) for (const w of [380, 760]) {
  if (!existsSync(new URL(`../public/posters/${p.id}-${when}-${w}.webp`, import.meta.url))) fail(p.id, `no still picture for ${when} at ${w} px. Run npm run posters`);
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
/** What a word after a figure multiplies it by, in the six languages. The longer words come first. */
const UNITS: [string, number][] = [
  ['mil millones', 1e9], ['mil milions', 1e9], ['milliards', 1e9], ['milliard', 1e9], ['milliarden', 1e9], ['milliarde', 1e9], ['mrd.', 1e9], ['billion', 1e9], ['十亿', 1e9],
  ['millones', 1e6], ['millón', 1e6], ['milions', 1e6], ['milió', 1e6], ['millionen', 1e6], ['millions', 1e6], ['million', 1e6], ['mio.', 1e6], ['百万', 1e6],
  ['千万', 1e7], ['亿', 1e8], ['万', 1e4],
  ['thousand', 1e3], ['tausend', 1e3], ['mille', 1e3], ['mil', 1e3], ['千', 1e3],
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
  const comma = !['en', 'zh'].includes(lang); // these languages write the decimal mark as a comma
  for (const m of x.matchAll(/\d+(?:[.,]\d+)*/g)) {
    const after = x.slice(m.index + m[0].length).replace(/^[\s  ]+/, '').toLowerCase();
    // a unit word counts only when it ends there: not the "mil" of "mil·lisegons", and not the 千 of 千克, a kilogram
    const unit = UNITS.find(([word]) => after.startsWith(word) && (/[\u4e00-\u9fff]/.test(word) ? !(word === '千' && /^[克米瓦赫伏卡帕焦欧安牛升]/.test(after.slice(1))) : !/^[\p{L}·]/u.test(after.slice(word.length))));
    if (unit) {
      const plain = comma ? m[0].replace(/\./g, '').replace(',', '.') : m[0].replace(/,/g, '');
      found.add(String(Math.round(parseFloat(plain) * unit[1])));
    } else found.add(m[0].replace(/[.,]/g, ''));
  }
  const century = (n: number) => { found.add(String(n)); found.add(`${n - 1}00`); };
  for (const m of x.matchAll(/(?:siglo|segle)[\s ]+([IVXL]+)\b|\b([IVXL]+)e[\s  ]*siècle/g)) century(roman(m[1] ?? m[2]!));
  for (const m of x.matchAll(/(\d{1,2})\.[\s ]*Jahrhundert|(\d{1,2})\s*世纪/g)) century(Number(m[1] ?? m[2]));
  for (const m of x.matchAll(/(\d{2})\s*世纪\s*(\d{2})\s*年代/g)) found.add(`${Number(m[1]) - 1}${m[2]}`);
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
    if (!!p.dispute !== !!x.dispute?.trim()) say(`${p.id}.dispute ${p.dispute ? 'is missing' : 'is not in the English'}`);
    for (const f of ['how', 'good', 'bad'] as const) {
      if (x[f]?.length !== p[f].length || x[f].some((line) => !line?.trim())) say(`${p.id}.${f} should have ${p[f].length} entries, as the English has`);
    }
    if (!!p.yearText !== !!x.yearText?.trim()) say(`${p.id}.yearText ${p.yearText ? 'is missing' : 'is not in the English'}`);
    const whole = (q: typeof x) => [q.name, q.aka ?? '', q.yearText ?? '', q.origin, q.statusNote, q.lead, ...(q.how ?? []), ...(q.good ?? []), ...(q.bad ?? []), q.look, q.dispute ?? ''].join('\n');
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
  const wait = owed[code] ?? [];
  const kindsOwed = ['fact', 'view', 'archive picture'].map((k) => [k, wait.filter((w) => w.startsWith(k + ' ')).length] as const).filter(([, n]) => n);
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
