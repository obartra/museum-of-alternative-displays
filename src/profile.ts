import type { Bio } from './data/person-bios';
import type { PersonLink } from './data/person-links';
import { portraits } from './data/portraits';
import type { Source } from './data/schema';
import { esc } from './html';
import { comma, creditWords, said, tx } from './i18n';

/**
 * The parts of a person's profile that the person page and the sheet in the walk both show, written once so that
 * the two say the same thing in the same words.
 */

/**
 * The credit of a portrait, where one has been added by hand. A drawing after a picture names the picture's
 * author and its licence, as the licence asks. A study names who published the photographs it was drawn from,
 * each as a link to the page.
 */
export const portraitCredit = (name: string): string => {
  const pic = portraits[name];
  if (!pic) return '';
  if ('study' in pic) {
    // each publisher once, with the first of its pages
    const once = pic.study.filter((x, i) => pic.study.findIndex((y) => y.by === x.by) === i);
    return tx('people.study', { by: '\u0001' }).replace('\u0001', once.map((x) => `<a href="${esc(x.source)}" rel="noopener">${esc(x.by)}</a>`).join(esc(comma())));
  }
  return `<a href="${esc(pic.source)}" rel="noopener">${pic.by ? tx('people.portrait', { by: creditWords(pic.by), licence: creditWords(pic.licence) }) : tx('people.portrait.anon', { licence: creditWords(pic.licence) })}</a>`;
};

/** The years of a life, where the museum has them: both, or the year of birth alone. */
export const lifeOf = (bio: Bio | undefined): string =>
  bio?.born ? (bio.died ? tx('person.life', { born: bio.born, died: Array.isArray(bio.died) ? tx('person.either', { a: bio.died[0], b: bio.died[1] }) : bio.died }) : tx('person.born', { born: bio.born })) : '';

/** The items of a list of sources, each with its kind. */
export const sourceItems = (sources: Source[]): string =>
  sources.map((src) => `<li><span class="kind">${esc(said.sourceKind(src.kind))}</span><a href="${esc(src.url)}" rel="noopener">${esc(src.label)}</a></li>`).join('');

/** The one place outside the museum where more is written of a person. */
export const elsewhereItem = (out: PersonLink): string =>
  `<li><span class="kind">${tx(`person.kind.${out.kind}`)}</span><a href="${esc(out.url)}" rel="noopener">${esc(out.label)}</a></li>`;
