/**
 * What the museum says of a person beyond the line on a label: a few sentences, each resting on the sources listed
 * with it, in the voice set down in docs/people/VOICE.md. `scripts/validate.ts` holds every account to that voice,
 * and docs/people/CURATOR.md records each reading of the whole set.
 *
 * Written in English. A person without an account here has a page all the same, with their lines and sources.
 */
import { people } from './people';
import type { Person } from './persons';
import type { Source } from './schema';

export interface Bio { born?: number; died?: number; about: string[]; sources: Source[] }

const s = (kind: Source['kind'], label: string, url: string): Source => ({ kind, label, url });
const ILLINOIS = s('lab', 'Plasma Display, Hall of Fame, Electrical and Computer Engineering, University of Illinois', 'https://ece.illinois.edu/about/history/hall-of-fame/plasmas');
const EMMY = s('lab', 'ECE alumni win Emmy for inventing the flat-panel plasma display, University of Illinois (2002)', 'https://ece.illinois.edu/news/2541');
const SCHADT = s('paper', 'Schadt, How we made the liquid crystal display, Nature Electronics (2018)', 'https://www.nature.com/articles/s41928-018-0119-8');

export const bios: Record<string, Bio> = {
  'Kenyon Taylor': {
    about: ['His name stands on the patents of Ferranti-Packard for magnetically operated signs, one of them with Donald Winrow.'],
    sources: [s('patent', 'Taylor and Winrow, US patent 3,303,494, Magnetically operated signs, Ferranti-Packard', 'https://patents.google.com/patent/US3303494')],
  },
  'Ferdinand Braun': {
    born: 1850, died: 1918,
    about: [
      'Born in Fulda, he studied at Marburg and Berlin and taught physics at Karlsruhe, Tübingen and Strasbourg.',
      'In 1897 he built a cathode-ray oscillograph.',
      'He shared the Nobel Prize in Physics of 1909 with Guglielmo Marconi, for work on wireless telegraphy.',
      'He died in Brooklyn, held in the United States as a German citizen during the war.',
    ],
    sources: [
      s('archive', 'Ferdinand Braun, Biographical, The Nobel Prize', 'https://www.nobelprize.org/prizes/physics/1909/braun/biographical/'),
      s('reference', 'Ferdinand Braun, Encyclopaedia Britannica', 'https://www.britannica.com/biography/Ferdinand-Braun'),
    ],
  },
  'Robert H. Anderson': {
    about: [
      'A physicist, he joined Tektronix in 1959, in the research group led by Dick Ropiequet.',
      'He set himself the task of a storage tube of simple build, and arrived at one with no separate storage target inside it.',
      'The Type 564 oscilloscope of 1963 was built around it. He left Tektronix in 1969.',
    ],
    sources: [s('press', 'Robert H. Anderson: Putting The "Storage" In Oscilloscopes, Electronic Design (2011)', 'https://www.electronicdesign.com/technologies/displays/article/21795615/robert-h-anderson-putting-the-storage-in-oscilloscopes')],
  },
  'Donald Bitzer': {
    about: [
      'He took three degrees in electrical engineering at the University of Illinois, the last a doctorate in 1960.',
      'In 1964, with Gene Slottow and the student Robert Willson, he made the plasma display panel for PLATO, the teaching network of the university.',
      'The three received an Emmy Award for it in 2002.',
    ],
    sources: [ILLINOIS, EMMY],
  },
  'Gene Slottow': {
    about: [
      'He received his doctorate at the University of Illinois in 1964.',
      'In the same year he, Donald Bitzer and Robert Willson made the plasma display panel there, and in 2002 the three received an Emmy Award for it.',
    ],
    sources: [ILLINOIS, EMMY],
  },
  'Robert Willson': {
    about: [
      'A graduate student of Donald Bitzer and Gene Slottow at the University of Illinois, he took his doctorate there in 1966.',
      'With them he made the plasma display panel in 1964, and shared the Emmy Award of 2002.',
    ],
    sources: [ILLINOIS, s('lab', 'ECE alumni inducted into the National Inventors Hall of Fame, University of Illinois', 'https://ece.illinois.edu/news/3099'), EMMY],
  },
  'Nicholas Sheridon': {
    about: [
      'A physicist at the Xerox Palo Alto Research Center, he proposed replacing the monitor with something like paper, and soon had a crude working model.',
      'Xerox took him off the work in 1977.',
      'By 2001 he was head of research at Gyricon Media, a company Xerox had spun off.',
    ],
    sources: [
      s('press', 'Electronic Paper Turns the Page, MIT Technology Review (2001)', 'https://www.technologyreview.com/s/400901/electronic-paper-turns-the-page/'),
      s('press', 'Startups Struggle in the e-Paper Chase, MIT Technology Review (2001)', 'https://www.technologyreview.com/2001/03/06/235986/startups-struggle-in-the-e-paper-chase/'),
    ],
  },
  'Martin Schadt': {
    about: [
      'A physicist, he was among the earliest hired at the research laboratories of Hoffmann-La Roche in Basel.',
      'In the autumn of 1970 he and Wolfgang Helfrich studied twisted layers of liquid crystal there. They filed a patent that December and published in February 1971.',
      'In 1972 he built a prototype of a display that used the effect.',
    ],
    sources: [SCHADT],
  },
  'Wolfgang Helfrich': {
    about: [
      'A physicist at Hoffmann-La Roche in Basel, he worked out the twisted nematic effect with Martin Schadt in 1970.',
      'He left the company soon afterwards for the Freie Universität Berlin.',
    ],
    sources: [SCHADT],
  },
  'Fritz Fischer': {
    born: 1898, died: 1947,
    about: [
      'Born in Signau, Switzerland, he worked at the institute of technical physics of ETH Zurich.',
      'He applied for a patent on the Eidophor in November 1939. When he died his second prototype was not yet running.',
      'His collaborators carried the work on, and the Historical Dictionary of Switzerland dates its full working order to 1959.',
    ],
    sources: [
      s('paper', 'Baumann, The Fischer Large-Screen Projection System, Journal of the SMPTE (1953)', 'https://lantern.mediahist.org/catalog/journalofsociety60socirich_0353'),
      s('reference', 'Fischer, Fritz, Historical Dictionary of Switzerland', 'https://hls-dhs-dss.ch/it/articles/031341/'),
    ],
  },
  'Joseph Ostoja-Kotkowski': {
    born: 1922, died: 1994,
    about: [
      'Born in Golub, Poland, he lived and worked in South Australia.',
      'The History Trust of South Australia says that his Sound and Image of 1968, at the Adelaide Festival of Arts, may have been the first use of a laser in a theatre.',
      'He went on to stage works of laser light and sound in Canberra, Ballarat, Brisbane and Warsaw.',
    ],
    sources: [
      s('archive', 'Josef Stanislaus Ostoja-Kotkowski, SA History Hub, History Trust of South Australia', 'https://sahistoryhub.history.sa.gov.au/?p=18782'),
      s('archive', 'Productions created by J. S. Ostoja-Kotkowski, PRG 919/29, State Library of South Australia', 'https://collections.slsa.sa.gov.au/resource/PRG+919/29'),
    ],
  },
  'Joseph Plateau': {
    born: 1801, died: 1883,
    about: [
      'A Belgian, born in Brussels.',
      'The Science Museum Group credits him with the first demonstration of the illusion of a moving picture, with the phenakistoscope of 1832.',
    ],
    sources: [s('archive', 'Joseph Plateau, Science Museum Group Collection', 'https://collection.sciencemuseumgroup.org.uk/people/cp100187/joseph-plateau')],
  },
  'Gabriel Lippmann': {
    about: [
      'He received the Nobel Prize in Physics of 1908 for a way of photographing colours by the interference of light.',
      'In the same year he published his idea of integral photography in the Journal de Physique.',
    ],
    sources: [
      s('archive', 'Gabriel Lippmann, Nobel Lecture, The Nobel Prize', 'https://www.nobelprize.org/prizes/physics/1908/lippmann/lecture/'),
      s('paper', 'Lippmann, Épreuves réversibles donnant la sensation du relief, Journal de Physique Théorique et Appliquée (1908)', 'https://doi.org/10.1051/jphystap:019080070082100'),
    ],
  },
};

/**
 * The sources a person's page lists: those of their account, and those of the pieces they are named on that name
 * them. A piece keeps one list of sources for all its people, so a source is taken for this person when its title
 * carries their family name. Where none does and there is no account, the piece's whole list stands.
 */
export function personSources(who: Person): Source[] {
  const own = bios[who.name]?.sources ?? [], family = who.name.split(' ').pop() ?? who.name;
  const ofPieces = who.on.flatMap(({ piece }) => people[piece].sources ?? []);
  const naming = ofPieces.filter((src) => src.label.includes(family));
  const all = [...own, ...(naming.length || own.length ? naming : ofPieces)];
  return all.filter((src, i) => all.findIndex((x) => x.url === src.url) === i);
}
