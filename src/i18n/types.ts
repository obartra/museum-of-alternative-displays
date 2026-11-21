import type { Media } from '../data/media';
import type { Hall, Need, Piece, Principle, SourceKind, Status } from '../data/schema';
import type { ViewInfo } from '../data/views';
import type { UiKey } from './en';

/**
 * Languages. English is the source and lives with the data. Every other language is one file in ./locales that
 * carries the same words, loaded only when a visitor asks for it.
 */
export type Lang = 'en' | 'es' | 'ca' | 'fr' | 'de' | 'zh';
export interface LangInfo { code: Lang; name: string; short: string; tag: string }
/** Each language under its own name, as its speakers write it. */
export const LANGS: LangInfo[] = [
  { code: 'en', name: 'English', short: 'EN', tag: 'en' },
  { code: 'es', name: 'Español', short: 'ES', tag: 'es' },
  { code: 'ca', name: 'Català', short: 'CA', tag: 'ca' },
  { code: 'fr', name: 'Français', short: 'FR', tag: 'fr' },
  { code: 'de', name: 'Deutsch', short: 'DE', tag: 'de' },
  { code: 'zh', name: '中文', short: '中文', tag: 'zh-Hans' },
];

export type PieceText = Pick<Piece, 'name' | 'aka' | 'yearText' | 'origin' | 'statusNote' | 'lead' | 'how' | 'good' | 'bad' | 'look' | 'dispute'>;
export type HallText = Pick<Hall, 'name' | 'was' | 'intro'>;
export type ViewText = Pick<ViewInfo, 'label' | 'hint'>;
export type MediaText = Pick<Media, 'caption' | 'alt' | 'year'> & { changes: string };

/** Everything a language has to say. The build checks each one against the English. */
export interface Locale {
  ui: Record<UiKey, string>;
  status: Record<Status, string>;
  principle: Record<Principle, string>;
  need: Record<Need, string>;
  sourceKind: Record<SourceKind, string>;
  halls: Record<number, HallText>;
  pieces: Record<string, PieceText>;
  /** The "Worth knowing" fact of each piece. */
  facts: Record<string, string>;
  views: Record<string, Record<string, ViewText>>;
  media: Record<string, Record<string, MediaText>>;
}

export const SOURCE_KIND: Record<SourceKind, string> = { paper: 'paper', patent: 'patent', archive: 'archive', lab: 'lab', maker: 'maker', press: 'press', reference: 'reference' };
