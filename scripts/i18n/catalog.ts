/**
 * Every sentence of the museum that a translator meets, in one list.
 *
 * English is the source and lives with the data: the interface in src/i18n/en.ts, the labels in src/data. This
 * file walks all of it in the order a visitor would, and gives each sentence a name that stays the same when the
 * sentence is reworded. The PO files in po/ are written from this list, and a language is built back from them
 * through the same list, so the two directions cannot drift apart.
 */
import { en, type UiKey } from '../../src/i18n/en';
import { facts } from '../../src/data/facts';
import { halls } from '../../src/data/halls';
import { media } from '../../src/data/media';
import { people } from '../../src/data/people';
import { pieces } from '../../src/data/pieces';
import { NEED_LABEL, PRINCIPLE_LABEL, STATUS_LABEL } from '../../src/data/schema';
import { tours } from '../../src/data/tours';
import { views } from '../../src/data/views';
import { SOURCE_KIND, type CreditText, type Locale, type MediaText, type PieceText, type TourText, type ViewText } from '../../src/i18n/types';

export interface Slot {
  /** The name of the sentence: the msgctxt of its entry. */
  key: string;
  /** The English: the msgid. */
  en: string;
  /** The English for more than one, where the sentence counts something. */
  plural?: string;
  /** What it is, for the translator. */
  note: string;
  /** The most characters it may have, where the page has room for no more. */
  max?: number;
  /** Where on the site it shows. */
  where: string;
}

const MARKS = 'Keep the words in curly brackets as they are.';
const UI_NOTE: [RegExp, string][] = [
  [/^site\./, 'Name and description of the site.'], [/^title\./, 'Title of the browser tab.'], [/^nav\./, 'Menu at the top.'],
  [/^switch\./, 'Switch at the top that turns day into night in the halls.'], [/^lang\./, 'Language menu.'], [/^foot\./, 'Foot of the page.'],
  [/^keys\./, 'List of keyboard shortcuts.'], [/^entrance\./, 'Entrance page.'], [/^board\./, 'Board at the entrance that lists the halls.'],
  [/^hall\./, 'Page of a hall.'], [/^pager\./, 'Links to the page before and the page after.'], [/^tile\./, 'Tile of a piece in a hall.'],
  [/^stage\./, 'The 3D viewer of a piece.'], [/^card\./, 'Table of facts on the page of a piece.'], [/^piece\./, 'Headings on the page of a piece.'],
  [/^people\./, 'People page.'], [/^archive\./, 'Archive pictures and films.'], [/^depot\./, 'Index page and its filters.'],
  [/^about\./, 'About page.'], [/^walk\./, 'The walk through the halls in 3D.'], [/^trail\./, 'A trail is a route through the halls.'],
  [/^missing\./, 'Page shown for an address that does not exist.'],
];
const marked = (text: string, note: string) => (/\{\/?\w+\}/.test(text) ? `${note} ${MARKS}` : note);

/** The pattern of a line that says what was done to an archive picture: the same words whatever the number in them. */
export const changePattern = (changes: string): { pattern: string; n: string } => ({ pattern: changes.replace(/\d+/g, '{n}'), n: /\d+/.exec(changes)?.[0] ?? '' });
const changePatterns = (): string[] => [...new Set(Object.values(media).flat().map((m) => changePattern(m.credit.changes).pattern))];
const ABOUT = 'about {n}', YEAR = '{n}';

/** The whole list, in the order of the PO files. */
export function slots(): Slot[] {
  const out: Slot[] = [];
  for (const k of Object.keys(en) as UiKey[]) {
    const note = UI_NOTE.find(([test]) => test.test(k))?.[1] ?? 'Interface.';
    if (k === 'count.pieces.other') continue;
    if (k === 'count.pieces.one') { out.push({ key: 'ui.count.pieces', en: en[k], plural: en['count.pieces.other'], note: `A number of pieces. Give every form your language has for a number. ${MARKS}`, where: 'interface' }); continue; }
    out.push({ key: `ui.${k}`, en: en[k], note: marked(en[k], note), where: 'interface' });
  }
  const sets: [string, Record<string, string>, string][] = [
    ['status', STATUS_LABEL, 'Whether a kind of display is still made. Shown in the table of facts and in the index.'],
    ['principle', PRINCIPLE_LABEL, 'How a piece makes its picture. Shown in the table of facts and in the index.'],
    ['need', NEED_LABEL, 'A property of a piece. Shown in the table of facts and in the index.'],
    ['sourceKind', SOURCE_KIND, 'Kind of source, shown as a small tag beside a source. One word, lower case.'],
  ];
  for (const [name, set, note] of sets) for (const [k, v] of Object.entries(set)) out.push({ key: `${name}.${k}`, en: v, note, where: 'interface' });
  for (const h of halls) {
    out.push({ key: `hall.${h.id}.name`, en: h.name, note: 'Name of a hall. It must fit a board on a small phone.', max: 16, where: `hall-${h.id}` });
    out.push({ key: `hall.${h.id}.intro`, en: h.intro, note: 'Introduction at the top of the page of a hall.', where: `hall-${h.id}` });
  }
  for (const h of halls) for (const p of pieces.filter((x) => x.hall === h.id)) {
    const where = `hall-${h.id}/${p.id}`, k = `piece.${p.id}`;
    const add = (key: string, text: string | undefined, note: string, max?: number) => { if (text) out.push({ key: `${k}.${key}`, en: text, note, where, ...(max ? { max } : {}) }); };
    add('name', p.name, 'Name of a piece.');
    add('aka', p.aka, 'Other names the piece goes by.');
    add('yearText', p.yearText, 'The date of the piece, as its label gives it.');
    add('origin', p.origin, 'Who made it first, and where. No full stop at the end.');
    add('statusNote', p.statusNote, 'Where this kind of display stands today.');
    add('lead', p.lead, 'First sentence of the label.');
    p.how.forEach((t, i) => add(`how.${i + 1}`, t, `How it works, paragraph ${i + 1} of ${p.how.length}.`));
    p.good.forEach((t, i) => add(`good.${i + 1}`, t, `What it is good at, point ${i + 1} of ${p.good.length}. No full stop at the end.`));
    p.bad.forEach((t, i) => add(`bad.${i + 1}`, t, `Where it fails, point ${i + 1} of ${p.bad.length}. No full stop at the end.`));
    add('look', p.look, 'What to look for in the 3D model. Where it names a button, use the words you gave that button.');
    add('fact', facts[p.id]?.text, 'A short story about the piece, under the heading Worth knowing.');
    const c = people[p.id];
    c?.people.forEach((e, i) => add(`people.${i + 1}`, e.did, `People section: what ${e.who.join(', ')} did. The names stand above this line.`));
    add('note', c?.note, 'Note under the People section.');
    for (const v of views[p.id] ?? []) {
      add(`view.${v.id}.label`, v.label, 'Button that moves the visitor to a place in the 3D model.', 28);
      add(`view.${v.id}.hint`, v.hint, 'Line shown while the visitor is at that place.');
    }
    for (const m of media[p.id] ?? []) {
      add(`media.${m.id}.caption`, m.caption, 'Caption of a picture or film from an archive.');
      add(`media.${m.id}.alt`, m.alt, 'The same picture described for someone who cannot see it.');
    }
  }
  changePatterns().forEach((pattern, i) => out.push({ key: `changes.${i + 1}`, en: pattern, note: marked(pattern, 'What was done to an archive picture or film before it was put on the site.'), where: 'archive' }));
  out.push({ key: 'year', en: YEAR, note: `A year standing alone under an archive picture, as in "1930". Most languages leave it as it is, and some add a word to it. ${MARKS}`, where: 'archive' });
  out.push({ key: 'about', en: ABOUT, note: `Before a year that is not certain, as in "about 1930". ${MARKS}`, where: 'archive' });
  for (const tour of tours) {
    const k = `tour.${tour.id}`, where = `tour-${tour.id}`;
    out.push({ key: `${k}.title`, en: tour.title, note: 'Title of a guided tour.', where });
    out.push({ key: `${k}.lead`, en: tour.lead, note: 'One sentence under the title of the tour, saying what it is.', where });
    for (const part of tour.parts) {
      const at = part.id === 'start' ? 'before the first stop' : part.id === 'end' ? 'after the last stop' : `at the piece ${pieces.find((p) => p.id === part.id)?.name ?? part.id}`;
      out.push({ key: `${k}.${part.id}.title`, en: part.title, note: `Guided tour, ${at}: the title of this part.`, where });
      part.text.forEach((t, i) => out.push({ key: `${k}.${part.id}.text.${i + 1}`, en: t, note: `Guided tour, ${at}: what the guide says, paragraph ${i + 1} of ${part.text.length}. It is read aloud, so keep the sentences short and write years as figures. The parts call back to each other, so use the same words for the same thing throughout.`, where }));
    }
  }
  return out;
}

/** What a language says, by the names of the list. A sentence that counts something has one text for each form. */
export type Said = Map<string, string[]>;

/** How many forms a language has for a number, in the order gettext lists them, and the rule as PO files state it. */
export function plurals(code: string): { forms: Intl.LDMLPluralRule[]; rule: string } {
  if (['ja', 'ko', 'zh', 'zh-hant'].includes(code)) return { forms: ['other'], rule: 'nplurals=1; plural=0;' };
  if (code === 'ru') return { forms: ['one', 'few', 'many'], rule: 'nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);' };
  if (code === 'pl') return { forms: ['one', 'few', 'many'], rule: 'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);' };
  if (['fr', 'pt'].includes(code)) return { forms: ['one', 'other'], rule: 'nplurals=2; plural=(n > 1);' };
  return { forms: ['one', 'other'], rule: 'nplurals=2; plural=(n != 1);' };
}

/** Take a language apart into the sentences of the list. Used once for each language that was written as a file of its own. */
export function fromLocale(loc: Locale, code: string): { said: Said; notes: string[] } {
  const said: Said = new Map(), notes: string[] = [];
  const put = (key: string, text: string | undefined) => { if (text?.trim()) said.set(key, [text]); };
  for (const k of Object.keys(en) as UiKey[]) if (!k.startsWith('count.pieces.')) put(`ui.${k}`, loc.ui?.[k]);
  const one = loc.ui?.['count.pieces.one'], other = loc.ui?.['count.pieces.other'];
  if (one?.trim() && other?.trim()) {
    const n = plurals(code).forms.length;
    if (n === 1 && one !== other) notes.push(`count.pieces: this language has one form, and the file had two different ones ("${one}", "${other}"). The second is kept.`);
    said.set('ui.count.pieces', n === 1 ? [other] : n === 2 ? [one, other] : [one, other, other]);
  }
  for (const [name, set] of [['status', STATUS_LABEL], ['principle', PRINCIPLE_LABEL], ['need', NEED_LABEL], ['sourceKind', SOURCE_KIND]] as const) for (const k of Object.keys(set)) put(`${name}.${k}`, (loc[name] as Record<string, string> | undefined)?.[k]);
  for (const h of halls) { put(`hall.${h.id}.name`, loc.halls?.[h.id]?.name); put(`hall.${h.id}.intro`, loc.halls?.[h.id]?.intro); }
  const patterns = changePatterns(), changes = new Map<string, Map<string, number>>(), abouts = new Map<string, number>(), years = new Map<string, number>();
  for (const p of pieces) {
    const k = `piece.${p.id}`, x = loc.pieces?.[p.id];
    if (x) {
      put(`${k}.name`, x.name); put(`${k}.aka`, x.aka); put(`${k}.yearText`, x.yearText); put(`${k}.origin`, x.origin); put(`${k}.statusNote`, x.statusNote); put(`${k}.lead`, x.lead); put(`${k}.look`, x.look);
      for (const f of ['how', 'good', 'bad'] as const) x[f]?.forEach((t, i) => put(`${k}.${f}.${i + 1}`, t));
    }
    put(`${k}.fact`, loc.facts?.[p.id]);
    loc.people?.[p.id]?.did.forEach((t, i) => put(`${k}.people.${i + 1}`, t));
    put(`${k}.note`, loc.people?.[p.id]?.note);
    for (const v of views[p.id] ?? []) { put(`${k}.view.${v.id}.label`, loc.views?.[p.id]?.[v.id]?.label); put(`${k}.view.${v.id}.hint`, loc.views?.[p.id]?.[v.id]?.hint); }
    for (const m of media[p.id] ?? []) {
      const own = loc.media?.[p.id]?.[m.id];
      if (!own) continue;
      put(`${k}.media.${m.id}.caption`, own.caption); put(`${k}.media.${m.id}.alt`, own.alt);
      // the line of changes and the uncertain year were written out in full for each picture: find the words behind them
      const { pattern, n } = changePattern(m.credit.changes);
      if (own.changes?.trim()) { const words = n ? own.changes.replace(n, '{n}') : own.changes, tally = changes.get(pattern) ?? new Map<string, number>(); tally.set(words, (tally.get(words) ?? 0) + 1); changes.set(pattern, tally); }
      const y = /^about (\d+)$/.exec(m.year ?? '');
      if (y && own.year?.includes(y[1])) { const words = own.year.replace(y[1], '{n}'); abouts.set(words, (abouts.get(words) ?? 0) + 1); }
      if (m.year && /^\d{4}$/.test(m.year) && own.year?.includes(m.year)) { const words = own.year.replace(m.year, '{n}'); years.set(words, (years.get(words) ?? 0) + 1); }
    }
  }
  for (const tour of tours) {
    const own = loc.tours?.[tour.id], k = `tour.${tour.id}`;
    if (!own) continue;
    put(`${k}.title`, own.title); put(`${k}.lead`, own.lead);
    for (const part of tour.parts) { put(`${k}.${part.id}.title`, own.parts[part.id]?.title); own.parts[part.id]?.text.forEach((t, i) => put(`${k}.${part.id}.text.${i + 1}`, t)); }
  }
  const most = (tally: Map<string, number>) => [...tally].sort((a, b) => b[1] - a[1])[0]?.[0];
  patterns.forEach((pattern, i) => {
    const tally = changes.get(pattern);
    if (!tally) return;
    if (tally.size > 1) notes.push(`changes "${pattern}": said in ${tally.size} ways (${[...tally.keys()].map((w) => `"${w}"`).join(', ')}). The commonest is kept.`);
    put(`changes.${i + 1}`, most(tally));
  });
  if (abouts.size > 1) notes.push(`about: said in ${abouts.size} ways (${[...abouts.keys()].join(', ')}). The commonest is kept.`);
  if (years.size > 1) notes.push(`year: said in ${years.size} ways (${[...years.keys()].join(', ')}). The commonest is kept.`);
  put('year', most(years) ?? YEAR);
  put('about', most(abouts));
  return { said, notes };
}

/**
 * Put a language together from its sentences. A sentence it lacks is left to the English: the interface and the label
 * of a piece take the English sentence in its place, and a fact, a People section, a view or an archive caption is
 * left out, which makes the site show the English one and mark it as English.
 */
export function toLocale(said: Said, code: string): { locale: Locale; english: string[] } {
  const english: string[] = [];
  const get = (key: string): string | undefined => said.get(key)?.[0]?.trim() ? said.get(key)![0] : undefined;
  const or = (key: string, fallback: string): string => get(key) ?? (english.push(key), fallback);
  const ui = {} as Record<UiKey, string>;
  for (const k of Object.keys(en) as UiKey[]) if (!k.startsWith('count.pieces.')) ui[k] = or(`ui.${k}`, en[k]);
  const { forms } = plurals(code), counted = (said.get('ui.count.pieces') ?? []).map((s) => s?.trim() ? s : undefined);
  const plural: Record<string, Partial<Record<Intl.LDMLPluralRule, string>>> = {};
  if (counted.length >= forms.length && counted.slice(0, forms.length).every(Boolean)) {
    plural['count.pieces'] = Object.fromEntries(forms.map((f, i) => [f, counted[i]!]));
    plural['count.pieces'].other ??= counted[forms.length - 1]!;
    ui['count.pieces.one'] = counted[0]!; ui['count.pieces.other'] = counted[forms.length - 1]!;
  } else { english.push('ui.count.pieces'); ui['count.pieces.one'] = en['count.pieces.one']; ui['count.pieces.other'] = en['count.pieces.other']; }
  const set = <K extends string>(name: string, source: Record<K, string>) => Object.fromEntries((Object.keys(source) as K[]).map((k) => [k, or(`${name}.${k}`, source[k])])) as Record<K, string>;
  const locale: Locale = {
    ui, status: set('status', STATUS_LABEL), principle: set('principle', PRINCIPLE_LABEL), need: set('need', NEED_LABEL), sourceKind: set('sourceKind', SOURCE_KIND),
    halls: Object.fromEntries(halls.map((h) => [h.id, { name: or(`hall.${h.id}.name`, h.name), intro: or(`hall.${h.id}.intro`, h.intro) }])),
    pieces: {}, facts: {}, views: {}, media: {}, people: {},
  };
  if (forms.length > 2) locale.plural = plural;
  const patterns = changePatterns();
  for (const p of pieces) {
    const k = `piece.${p.id}`;
    const text: PieceText = {
      name: or(`${k}.name`, p.name), ...(p.aka ? { aka: or(`${k}.aka`, p.aka) } : {}), ...(p.yearText ? { yearText: or(`${k}.yearText`, p.yearText) } : {}),
      origin: or(`${k}.origin`, p.origin), statusNote: or(`${k}.statusNote`, p.statusNote), lead: or(`${k}.lead`, p.lead),
      how: p.how.map((t, i) => or(`${k}.how.${i + 1}`, t)), good: p.good.map((t, i) => or(`${k}.good.${i + 1}`, t)), bad: p.bad.map((t, i) => or(`${k}.bad.${i + 1}`, t)),
      look: or(`${k}.look`, p.look),
    };
    locale.pieces[p.id] = text;
    if (facts[p.id]) { const f = get(`${k}.fact`); if (f) locale.facts[p.id] = f; else english.push(`${k}.fact`); }
    const c = people[p.id];
    if (c) {
      const did = c.people.map((_, i) => get(`${k}.people.${i + 1}`)), note = c.note ? get(`${k}.note`) : undefined;
      if (did.every(Boolean) && (!c.note || note)) { const credit: CreditText = { did: did as string[], ...(note ? { note } : {}) }; locale.people![p.id] = credit; }
      else english.push(`${k}.people`);
    }
    for (const v of views[p.id] ?? []) {
      const label = get(`${k}.view.${v.id}.label`), hint = v.hint ? get(`${k}.view.${v.id}.hint`) : undefined;
      if (label && (!v.hint || hint)) { const view: ViewText = { label, ...(hint ? { hint } : {}) }; (locale.views[p.id] ??= {})[v.id] = view; }
      else english.push(`${k}.view.${v.id}`);
    }
    for (const m of media[p.id] ?? []) {
      const caption = get(`${k}.media.${m.id}.caption`), alt = get(`${k}.media.${m.id}.alt`);
      const { pattern, n } = changePattern(m.credit.changes), changes = get(`changes.${patterns.indexOf(pattern) + 1}`)?.replace('{n}', n);
      if (!caption || !alt || !changes) { english.push(`${k}.media.${m.id}`); continue; }
      const y = /^about (\d+)$/.exec(m.year ?? ''), about = get('about'), plain = get('year') ?? YEAR;
      const year = !m.year ? undefined : y && about ? about.replace('{n}', y[1]) : /^\d{4}$/.test(m.year) ? plain.replace('{n}', m.year) : m.year;
      const own: MediaText = { caption, alt, ...(year ? { year } : {}), changes };
      (locale.media[p.id] ??= {})[m.id] = own;
    }
  }
  for (const tour of tours) {
    const k = `tour.${tour.id}`, title = get(`${k}.title`), lead = get(`${k}.lead`);
    const parts = tour.parts.map((part) => ({ id: part.id, title: get(`${k}.${part.id}.title`), text: part.text.map((_, i) => get(`${k}.${part.id}.text.${i + 1}`)) }));
    // a tour is a story told from end to end: a language has all of it or none of it
    if (title && lead && parts.every((x) => x.title && x.text.every(Boolean))) {
      const own: TourText = { title, lead, parts: Object.fromEntries(parts.map((x) => [x.id, { title: x.title!, text: x.text as string[] }])) };
      (locale.tours ??= {})[tour.id] = own;
    } else english.push(k);
  }
  return { locale, english };
}
