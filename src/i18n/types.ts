import type { Media } from '../data/media';
import type { Hall, Need, Piece, Principle, SourceKind, Status } from '../data/schema';
import type { ViewInfo } from '../data/views';
import type { UiKey } from './en';

/**
 * Languages. English is the source and lives with the data. Every other language is one file in ./locales that
 * carries the same words, loaded only when a visitor asks for it.
 */
export type Lang = 'en' | 'es' | 'ca' | 'fr' | 'de' | 'zh' | 'pt' | 'eo' | 'it' | 'ja' | 'ko' | 'nl' | 'pl' | 'ru' | 'zh-hant';
export interface LangInfo { code: Lang; name: string; short: string; tag: string }
/**
 * Each language under its own name, as its speakers write it, in the order the menu lists them: those in Latin
 * letters by the alphabet, then the others. A language is offered once its file exists.
 */
export const LANGS: LangInfo[] = [
  { code: 'ca', name: 'Català', short: 'CA', tag: 'ca' },
  { code: 'de', name: 'Deutsch', short: 'DE', tag: 'de' },
  { code: 'en', name: 'English', short: 'EN', tag: 'en' },
  { code: 'es', name: 'Español', short: 'ES', tag: 'es' },
  { code: 'eo', name: 'Esperanto', short: 'EO', tag: 'eo' },
  { code: 'fr', name: 'Français', short: 'FR', tag: 'fr' },
  { code: 'it', name: 'Italiano', short: 'IT', tag: 'it' },
  { code: 'nl', name: 'Nederlands', short: 'NL', tag: 'nl' },
  { code: 'pl', name: 'Polski', short: 'PL', tag: 'pl' },
  { code: 'pt', name: 'Português', short: 'PT', tag: 'pt-BR' },
  { code: 'ru', name: 'Русский', short: 'РУ', tag: 'ru' },
  { code: 'ja', name: '日本語', short: '日本語', tag: 'ja' },
  { code: 'ko', name: '한국어', short: '한국어', tag: 'ko' },
  { code: 'zh', name: '简体中文', short: '简体', tag: 'zh-Hans' },
  { code: 'zh-hant', name: '繁體中文', short: '繁體', tag: 'zh-Hant' },
];

export type PieceText = Pick<Piece, 'name' | 'aka' | 'yearText' | 'origin' | 'statusNote' | 'lead' | 'how' | 'good' | 'bad' | 'look'>;
export type HallText = Pick<Hall, 'name' | 'intro'>;
export type ViewText = Pick<ViewInfo, 'label' | 'hint'>;
export interface CreditText { did: string[]; note?: string }
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
  /** The People section of each piece: what each line says, in the order of the English, and the note under them. */
  people?: Record<string, CreditText>;
}

export const SOURCE_KIND: Record<SourceKind, string> = { paper: 'paper', patent: 'patent', archive: 'archive', lab: 'lab', maker: 'maker', press: 'press', reference: 'reference' };
