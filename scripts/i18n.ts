/**
 * The translations, kept as gettext PO files in po/ and turned into what the site loads.
 *
 *   tsx scripts/i18n.ts build            write src/i18n/locales/<code>.ts for every language named in po/LINGUAS
 *   tsx scripts/i18n.ts build --drafts   the same, and also the languages in po/ that are not named there yet
 *   tsx scripts/i18n.ts sync             after the English changed: write po/museum.pot again and bring every
 *                                        PO file up to date. A sentence whose English changed is marked fuzzy,
 *                                        which translation tools show as "needs review".
 *   tsx scripts/i18n.ts import <code>    take a language written as src/i18n/locales/<code>.ts into po/
 *   tsx scripts/i18n.ts merge <code> <file.po>
 *                                        take the translations of another PO file into po/, sentence by sentence,
 *                                        wherever the English is still the one they were made from
 *
 * English is the source and is not in po/: it lives with the data. TRANSLATING.md explains the rest.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { po, type PoEntry } from 'gettext-parser';
import { LANGS, type Locale } from '../src/i18n/types';
import { fromLocale, plurals, slots, toLocale, type Said, type Slot } from './i18n/catalog';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PO = `${ROOT}po`, OUT = `${ROOT}src/i18n/locales`;
/** The name of a language's file, where the usual name for it differs from the code the site uses. */
const STEM: Record<string, string> = { pt: 'pt_BR', zh: 'zh_Hans', 'zh-hant': 'zh_Hant' };
const stemOf = (code: string) => STEM[code] ?? code;
const codeOf = (stem: string) => Object.entries(STEM).find(([, s]) => s === stem)?.[0] ?? stem;

interface Entry { msgid: string; str: string[]; fuzzy: boolean; comment?: string; previous?: string }
interface Book { head: string; entries: Map<string, Entry> }

function read(file: string): Book {
  const data = po.parse(readFileSync(file));
  const entries = new Map<string, Entry>();
  for (const [ctx, group] of Object.entries(data.translations)) for (const e of Object.values(group)) {
    if (!ctx) continue;
    entries.set(ctx, { msgid: e.msgid, str: e.msgstr ?? [], fuzzy: /\bfuzzy\b/.test(e.comments?.flag ?? ''), comment: e.comments?.translator || undefined, previous: e.comments?.previous || undefined });
  }
  return { head: data.translations['']?.['']?.comments?.translator ?? '', entries };
}

function write(file: string, code: string | null, list: Slot[], book: Book): void {
  const lang = code ? LANGS.find((l) => l.code === code) : undefined;
  const translations: Record<string, Record<string, PoEntry>> = { '': { '': { msgid: '', msgstr: [''], comments: { translator: book.head } } } };
  for (const s of list) {
    const e = book.entries.get(s.key), n = s.plural ? (code ? plurals(code).forms.length : 2) : 1;
    const str = Array.from({ length: n }, (_, i) => e?.str[i] ?? '');
    const fuzzy = !!e?.fuzzy && str.some(Boolean);
    translations[s.key] = { [s.en]: {
      msgctxt: s.key, msgid: s.en, ...(s.plural ? { msgid_plural: s.plural } : {}), msgstr: str,
      comments: { ...(e?.comment ? { translator: e.comment } : {}), extracted: s.note + (s.max ? ` At most ${s.max} characters.` : ''), reference: s.where, ...(fuzzy ? { flag: 'fuzzy' } : {}), ...(fuzzy && e?.previous ? { previous: e.previous } : {}) },
    } };
  }
  const headers: Record<string, string> = {
    'Project-Id-Version': 'Museum of Alternative Displays',
    'Report-Msgid-Bugs-To': 'https://github.com/obartra/museum-of-alternative-displays/issues',
    'Language': code ? stemOf(code) : '',
    ...(lang ? { 'Language-Team': lang.name } : {}),
    'MIME-Version': '1.0', 'Content-Type': 'text/plain; charset=UTF-8', 'Content-Transfer-Encoding': '8bit',
    ...(code ? { 'Plural-Forms': plurals(code).rule } : {}),
  };
  writeFileSync(file, po.compile({ charset: 'utf-8', headers, translations }, { foldLength: 0, sort: false }));
}

const linguas = (): string[] => (existsSync(`${PO}/LINGUAS`) ? readFileSync(`${PO}/LINGUAS`, 'utf8').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean) : []);
const stems = (): string[] => (existsSync(PO) ? readdirSync(PO).filter((f) => f.endsWith('.po')).map((f) => f.slice(0, -3)).sort() : []);
const HEAD = (code: string) => `Translation of the Museum of Alternative Displays into ${LANGS.find((l) => l.code === code)?.name ?? code}.\nHow to work on this file: TRANSLATING.md at the top of the repository.`;

function build(drafts: boolean): void {
  const list = slots(), listed = linguas(), all = stems();
  mkdirSync(OUT, { recursive: true });
  const made = new Set<string>();
  for (const stem of all) {
    const code = codeOf(stem), book = read(`${PO}/${stem}.po`), said: Said = new Map();
    let review = 0, missing = 0;
    for (const s of list) {
      const e = book.entries.get(s.key);
      if (!e || !e.str.some((x) => x.trim())) { missing++; continue; }
      if (e.fuzzy || e.msgid !== s.en) review++;
      said.set(s.key, e.str);
    }
    const share = Math.floor(((list.length - missing) / list.length) * 100);
    const known = LANGS.some((l) => l.code === code);
    const goes = known && (listed.includes(stem) || drafts);
    console.log(`  ${stem.padEnd(8)} ${String(share).padStart(3)}% of ${list.length} sentences` + (missing ? `, ${missing} still in English` : '') + (review ? `, ${review} to review` : '') + (goes ? '' : known ? '  (not in po/LINGUAS, so not on the site)' : '  (no entry in src/i18n/types.ts, so not on the site)'));
    if (!goes) continue;
    const { locale } = toLocale(said, code);
    writeFileSync(`${OUT}/${code}.ts`, `// Written by scripts/i18n.ts from po/${stem}.po. Change that file, not this one.\nimport type { Locale } from '../types';\n\nconst locale: Locale = ${JSON.stringify(locale, null, 1)};\n\nexport default locale;\n`);
    made.add(`${code}.ts`);
  }
  for (const stem of listed) if (!all.includes(stem)) throw new Error(`po/LINGUAS names ${stem}, and there is no po/${stem}.po`);
  for (const f of readdirSync(OUT)) if (f.endsWith('.ts') && !made.has(f)) rmSync(`${OUT}/${f}`);
}

function sync(): void {
  const list = slots();
  mkdirSync(PO, { recursive: true });
  write(`${PO}/museum.pot`, null, list, { head: 'Every sentence of the Museum of Alternative Displays, in English.\nTo start a language, copy this file to <code>.po and fill in the msgstr lines. TRANSLATING.md has the details.', entries: new Map() });
  for (const stem of stems()) {
    const code = codeOf(stem), book = read(`${PO}/${stem}.po`);
    let changed = 0, added = 0;
    for (const s of list) {
      const e = book.entries.get(s.key);
      if (!e) { added++; continue; }
      if (e.msgid !== s.en && e.str.some((x) => x.trim())) { if (!e.fuzzy) changed++; e.previous = `msgid ${JSON.stringify(e.msgid)}`; e.fuzzy = true; }
    }
    const gone = [...book.entries.keys()].filter((k) => !list.some((s) => s.key === k)).length;
    write(`${PO}/${stem}.po`, code, list, { head: book.head || HEAD(code), entries: book.entries });
    console.log(`  ${stem.padEnd(8)} ${added} new, ${changed} changed in English and marked for review, ${gone} no longer used`);
  }
  console.log(`  museum.pot: ${list.length} sentences`);
}

async function take(code: string, from?: string): Promise<void> {
  const file = from ?? `${OUT}/${code}.ts`, source = readFileSync(file, 'utf8');
  const loc = ((await import(file)) as { default: Locale }).default;
  const { said, notes } = fromLocale(loc, code);
  // the notes a translator left at the head of the file are worth keeping where the next one will read them
  const lead = /\/\*\*\n([\s\S]*?)\n \*\/\nconst locale/.exec(source)?.[1].split('\n').map((l) => l.replace(/^ \* ?/, '')).join('\n').trim();
  const list = slots(), entries = new Map<string, Entry>();
  for (const s of list) { const str = said.get(s.key); if (str) entries.set(s.key, { msgid: s.en, str, fuzzy: false }); }
  mkdirSync(PO, { recursive: true });
  write(`${PO}/${stemOf(code)}.po`, code, list, { head: [HEAD(code), lead].filter(Boolean).join('\n\n'), entries });
  console.log(`  ${code}: ${entries.size} of ${list.length} sentences into po/${stemOf(code)}.po`);
  for (const n of notes) console.log(`    note: ${n}`);
}

/** Takes what another PO file says into a language's own. A sentence whose English has changed since is left alone and named. */
function merge(code: string, from: string): void {
  const list = slots(), stem = stemOf(code), book = read(`${PO}/${stem}.po`), other = read(from);
  const taken: string[] = [], stale: string[] = [], unknown: string[] = [];
  for (const [key, e] of other.entries) {
    const s = list.find((x) => x.key === key);
    if (!e.str.some((x) => x.trim())) continue;
    if (!s) { unknown.push(key); continue; }
    if (e.msgid !== s.en) { stale.push(key); continue; }
    const was = book.entries.get(key);
    if (was && !was.fuzzy && was.msgid === s.en && was.str.join('\n') === e.str.join('\n')) continue;
    book.entries.set(key, { msgid: s.en, str: e.str, fuzzy: false, comment: was?.comment });
    taken.push(key);
  }
  write(`${PO}/${stem}.po`, code, list, { head: book.head || HEAD(code), entries: book.entries });
  console.log(`  ${stem}: ${taken.length} sentences taken from ${from}`);
  if (stale.length) console.log(`    left alone, because the English has changed since: ${stale.join(', ')}`);
  if (unknown.length) console.log(`    not sentences of the site: ${unknown.join(', ')}`);
  if (stale.length || unknown.length) process.exitCode = 1;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'build') build(rest.includes('--drafts') || process.env.I18N_DRAFTS === '1');
else if (cmd === 'sync') sync();
else if (cmd === 'import' && rest[0]) await take(rest[0], rest[1]);
else if (cmd === 'merge' && rest[0] && rest[1]) merge(rest[0], rest[1]);
else { console.error('usage: tsx scripts/i18n.ts build [--drafts] | sync | import <code> [file] | merge <code> <file.po>'); process.exit(1); }
