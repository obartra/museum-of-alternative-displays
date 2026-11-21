/** Archive pictures and film for a piece: real objects, period drawings, the thing running. All from Wikimedia Commons. */
export interface MediaCredit {
  /** Who made it, as the source states it, in plain text. "Unknown" only when the source says so. */
  author: string;
  /** Short licence name: "Public domain", "CC0 1.0", "CC BY 4.0", "CC BY-SA 3.0" ... */
  licence: string;
  /** Link to the licence deed. Left out only for the public domain. */
  licenceUrl?: string;
  /** The Commons file page. */
  source: string;
  /** The file's title on Commons, without the "File:" prefix. */
  title: string;
  /** What was done to it: "Resized", "Cropped and resized", "Cut to 12 seconds, sound removed, re-encoded". */
  changes: string;
}
export interface MediaBase {
  id: string;
  kind: 'photo' | 'drawing' | 'film';
  /** What it shows and why it is here. One or two sentences, at most 40 words. */
  caption: string;
  /** What is visible, for someone who cannot see it. At most 30 words. Not a repeat of the caption. */
  alt: string;
  /** When it was made, as the source gives it: "1862", "about 1930". Left out when the source does not say. */
  year?: string;
  /** Pixel size of the large file, or of the film. */
  width: number;
  height: number;
  credit: MediaCredit;
}
export interface Still extends MediaBase { kind: 'photo' | 'drawing'; small: string; large: string }
export interface Film extends MediaBase { kind: 'film'; mp4: string; webm: string; poster: string; seconds: number }
export type Media = Still | Film;

export const media: Record<string, Media[]> = {
  // piece id: items in the order they should be shown, strongest first
};
