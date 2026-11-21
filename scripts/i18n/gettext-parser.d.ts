/** The part of gettext-parser that scripts/i18n.ts uses. The package ships no types of its own. */
declare module 'gettext-parser' {
  export interface PoComments { translator?: string; reference?: string; extracted?: string; flag?: string; previous?: string }
  export interface PoEntry { msgctxt?: string; msgid: string; msgid_plural?: string; msgstr: string[]; comments?: PoComments }
  export interface PoData { charset: string; headers: Record<string, string>; translations: Record<string, Record<string, PoEntry>> }
  export const po: {
    parse(source: Buffer | string): PoData;
    compile(data: PoData, options?: { foldLength?: number; sort?: boolean }): Buffer;
  };
}
