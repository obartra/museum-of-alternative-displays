/**
 * Portraits of the people named on the labels. This list is filled in by hand: put the picture in public/people,
 * then add one line here under the person's name exactly as the label spells it. PORTRAITS.md has the names
 * and the file name each one expects. Nothing in the build fetches a picture.
 *
 * `by` is the photographer or the archive that holds the picture, `licence` its licence as the source page
 * states it, and `source` the address of that page. All three are shown beside the picture.
 */
export interface Portrait { file: string; by: string; licence: string; source: string }

export const portraits: Record<string, Portrait> = {
  // 'Elsa Garmire': { file: 'elsa-garmire.jpg', by: 'Name of the photographer', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Example.jpg' },
};

/** The file name a portrait is expected under: the name in plain lower-case letters, joined by hyphens. */
export const portraitFile = (name: string): string => name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.jpg';
