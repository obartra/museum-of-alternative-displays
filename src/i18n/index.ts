import { esc } from '../html';
import type { Media } from '../data/media';
import { NEED_LABEL, PRINCIPLE_LABEL, STATUS_LABEL, type Hall, type Need, type Piece, type Principle, type SourceKind, type Status } from '../data/schema';
import type { ViewInfo } from '../data/views';
import { en, type UiKey } from './en';
import { LANGS, SOURCE_KIND, type HallText, type Lang, type LangInfo, type Locale, type PieceText, type ViewText } from './types';

export * from './types';

const files = import.meta.glob<{ default: Locale }>('./locales/*.ts');
const fileOf = (code: Lang) => files[`./locales/${code}.ts`];
let lang: Lang = 'en';
let loc: Locale | null = null;

/** The languages there is a file for, English first. */
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
    const code = tag.toLowerCase().split('-')[0] as Lang;
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
  const form = new Intl.PluralRules(langNow().tag).select(n) === 'one' ? 'one' : 'other';
  return t(`${key}.${form}`, { n });
}
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
  status: (s: Status): string => loc?.status[s] ?? STATUS_LABEL[s],
  principle: (p: Principle): string => loc?.principle[p] ?? PRINCIPLE_LABEL[p],
  need: (n: Need): string => loc?.need[n] ?? NEED_LABEL[n],
  sourceKind: (k: SourceKind): string => loc?.sourceKind[k] ?? SOURCE_KIND[k],
};
