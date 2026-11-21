import { esc } from '../html';
import type { Media } from '../data/media';
import { NEED_LABEL, PRINCIPLE_LABEL, STATUS_LABEL, type Hall, type Need, type Piece, type Principle, type SourceKind, type Status } from '../data/schema';
import type { Credit } from '../data/people';
import type { ViewInfo } from '../data/views';
import type { Tour } from '../data/tours';
import { en, type UiKey } from './en';
import { LANGS, SOURCE_KIND, type CreditText, type HallText, type Lang, type LangInfo, type Locale, type PieceText, type TourText, type ViewText } from './types';

export * from './types';

const files = import.meta.glob<{ default: Locale }>('./locales/*.ts');
const fileOf = (code: Lang) => files[`./locales/${code}.ts`];
let lang: Lang = 'en';
let loc: Locale | null = null;

/** The languages there is a file for, and English, which needs none. */
export const offered = (): LangInfo[] => LANGS.filter((l) => l.code === 'en' || fileOf(l.code));
export const langNow = (): LangInfo => LANGS.find((l) => l.code === lang)!;

/** The language to open in: the one chosen before, or the first of the browser's own that is offered. */
export function wanted(): Lang {
  const codes = offered().map((l) => l.code);
  try {
    const kept = localStorage.getItem('lang') as Lang | null;
    if (kept && codes.includes(kept)) return kept;
  } catch { /* storage is optional */ }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const low = tag.toLowerCase(), code = low.split('-')[0] as Lang;
    // Chinese is two languages on the page: the traditional characters of Taiwan, Hong Kong and Macau, and the simplified
    if (code === 'zh' && /hant|-tw|-hk|-mo/.test(low) && codes.includes('zh-hant')) return 'zh-hant';
    if (codes.includes(code)) return code;
  }
  return 'en';
}

export async function useLang(code: Lang, keep = false): Promise<void> {
  const load = code === 'en' ? undefined : fileOf(code);
  try { loc = load ? (await load()).default : null; lang = load ? code : 'en'; } catch { loc = null; lang = 'en'; }
  document.documentElement.lang = langNow().tag;
  if (keep) try { localStorage.setItem('lang', lang); } catch { /* fine */ }
}

/** A word or sentence of the interface, with its values put in. */
export function t(key: UiKey, vars?: Record<string, string | number>): string {
  const s = loc?.ui[key] ?? en[key];
  return vars ? s.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all)) : s;
}
/** The same, safe to put in HTML. */
export const tx = (key: UiKey, vars?: Record<string, string | number>): string => esc(t(key, vars));
/** A sentence with links in it: `{a}words{/a}` becomes a link to `links.a`. */
export function rich(key: UiKey, links: Record<string, string>, vars?: Record<string, string | number>): string {
  return tx(key, vars).replace(/\{(\w+)\}(.*?)\{\/\1\}/g, (_, k: string, words: string) => `<a href="${esc(links[k] ?? '#')}"${/^https?:/.test(links[k] ?? '') ? ' rel="noopener"' : ''}>${words}</a>`);
}
/** "1 piece", "7 pieces": the form each language uses for that number. */
export function count(key: 'count.pieces', n: number): string {
  const form = new Intl.PluralRules(langNow().tag).select(n);
  // Russian and Polish have a form for a few and a form for many
  const own = loc?.plural?.[key]?.[form];
  return own ? own.replace(/\{n\}/g, String(n)) : t(`${key}.${form === 'one' ? 'one' : 'other'}`, { n });
}
/** What separates the items of a short list: a comma and a space, the full-width comma of Chinese or the comma of Japanese. */
export const comma = (): string => (lang === 'zh' || lang === 'zh-hant' ? '，' : lang === 'ja' ? '、' : ', ');
/** Compare two names the way the language in use sorts them. */
export const byName = (a: string, b: string): number => a.localeCompare(b, langNow().tag);

/** The text of the collection in the language in use. Where a language lacks something, the English stands in. */
export const said = {
  piece: (p: Piece): PieceText => loc?.pieces[p.id] ?? p,
  hall: (hall: Hall): HallText => loc?.halls[hall.id] ?? hall,
  fact: (pieceId: string, text: string): string => loc?.facts?.[pieceId] ?? text,
  view: (pieceId: string, v: ViewInfo): ViewText => loc?.views[pieceId]?.[v.id] ?? v,
  media: <M extends Media>(pieceId: string, m: M): M => {
    const own = loc?.media[pieceId]?.[m.id];
    return own ? { ...m, caption: own.caption, alt: own.alt, year: own.year ?? m.year, credit: { ...m.credit, changes: own.changes } } : m;
  },
  /** The People section of a piece. A translation counts only when it has a line for every line of the English. */
  credit: (pieceId: string, c: Credit): CreditText => {
    const own = loc?.people?.[pieceId];
    return own && own.did.length === c.people.length ? own : { did: c.people.map((e) => e.did), note: c.note };
  },
  /** A guided tour. A language that does not tell it has none: the tour is offered only where it is told. */
  tour: (tour: Tour): TourText | undefined => (loc ? loc.tours?.[tour.id] : { title: tour.title, lead: tour.lead, parts: Object.fromEntries(tour.parts.map((p) => [p.id, { title: p.title, text: p.text }])) }),
  status: (s: Status): string => loc?.status[s] ?? STATUS_LABEL[s],
  principle: (p: Principle): string => loc?.principle[p] ?? PRINCIPLE_LABEL[p],
  need: (n: Need): string => loc?.need[n] ?? NEED_LABEL[n],
  sourceKind: (k: SourceKind): string => loc?.sourceKind[k] ?? SOURCE_KIND[k],
};

/**
 * ` lang="en"` for a text that stands in for a translation that does not exist yet, and nothing otherwise.
 * It goes on the element that holds the text, so that a screen reader reads the English as English.
 */
export const standIn = {
  fact: (pieceId: string): string => (loc && !loc.facts?.[pieceId] ? ' lang="en"' : ''),
  people: (pieceId: string): string => (loc && !loc.people?.[pieceId] ? ' lang="en"' : ''),
  view: (pieceId: string, id: string): string => (loc && !loc.views?.[pieceId]?.[id] ? ' lang="en"' : ''),
  media: (pieceId: string, id: string): string => (loc && !loc.media?.[pieceId]?.[id] ? ' lang="en"' : ''),
};
