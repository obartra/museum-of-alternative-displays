import { people, type Entry } from './people';
import { pieces } from './pieces';
import { src } from './pieces/src';
import type { Source } from './schema';

/** One name on a trail that is a written list: the name as the labels spell it, and the source that describes the person in words. */
export interface Listed { name: string; source: Source }

/**
 * A trail is a route through the halls for visitors who want to follow one thread of the collection.
 * Its stops are pieces, in the order of the halls. In the walk it is a painted line on the floor, with a spur
 * and a dot at each stop. Its name is in the interface text, under `trail.<id>`.
 *
 * The colours are wayfinding colours and mean nothing. `lane` is how far from the middle of the aisle the
 * line runs, in metres, so that two trails do not lie on top of each other. `spur` is how far along the hall
 * from the middle of a block the spur and the dot of a stop lie, so that two trails that stop at the same piece
 * do not paint over each other there. A block is 2.2 m wide, and a spur ends in front of it.
 *
 * `who` picks, from one line of a label, the people who are on the trail. The stops follow from it: every piece
 * whose People section has such a line. A trail whose people are written down by name carries the names in `list`.
 */
export interface Trail {
  id: 'women' | 'black'; colour: string; lane: number; spur: number;
  who: (e: Entry) => string[]; list?: Listed[]; stops: string[];
}

/**
 * Who is on the blue line. It is not worked out from anything about a person: it is this list. Each name is
 * spelled as the labels spell it, and each has a source that describes the person as Black, as African American,
 * or as born and raised in an African country. A person without such a source is not on the list.
 */
const black: Listed[] = [
  { name: 'Marie Van Brittan Brown', source: src('archive', 'Marie Van Brittan Brown, Lemelson-MIT Program', 'https://lemelson.mit.edu/resources/marie-van-brittan-brown') },
  { name: 'Mark Dean', source: src('maker', 'Mark Dean, IBM', 'https://www.ibm.com/history/mark-dean') },
  { name: 'Lewis Latimer', source: src('archive', 'Bringing light for all, United States Patent and Trademark Office (2024)', 'https://www.uspto.gov/learning-and-resources/journeys-innovation/historical-stories/bringing-light-all') },
  { name: 'Akintunde Akinwande', source: src('archive', "MTL's Akintunde Ibitayo Akinwande, MIT Black History Project (2015)", 'https://mitblackhistory.blogspot.com/2015/10/mtls-akintunde-ibitayo-akinwande.html') },
  { name: 'Lanny Smoot', source: src('press', 'Black Disney Imagineer Inducted Into Inventors Hall Of Fame, Black Enterprise', 'https://www.blackenterprise.com/black-disney-imagineer-inducted-inventors-hall-of-fame/') },
  { name: 'Paula Hammond', source: src('press', 'Paula Hammond, The EDU Ledger (2021)', 'https://www.theeduledger.com/home/article/15109532/paula-hammond') },
  { name: 'Valerie Thomas', source: src('press', 'Valerie Thomas, Biography.com', 'https://www.biography.com/scientists/valerie-thomas') },
  { name: 'Kenneth Dunkley', source: src('archive', 'Kenneth Dunkley, National Business League', 'https://nationalbusinessleague.org/kenneth-dunkley/') },
  { name: 'Charles Harrison', source: src('archive', 'Charles Harrison: The Black Industrial Designer Who Revamped View-Master, The Strong National Museum of Play', 'https://www.museumofplay.org/blog/charles-harrison-the-black-industrial-designer-who-revamped-view-master/') },
  { name: 'Hank Willis Thomas', source: src('archive', 'Hank Willis Thomas, North Carolina Museum of Art', 'https://learn.ncartmuseum.org/artist/hank-willis-thomas/') },
  { name: 'Samuel Achilefu', source: src('press', 'Washington People: Samuel Achilefu, Washington University in St. Louis (2016)', 'https://source.washu.edu/2016/02/washington-people-samuel-achilefu/') },
];

/** A trail, with its stops worked out: every piece whose People section has a line with someone on the trail. */
const lay = (t: Omit<Trail, 'stops'>): Trail => ({ ...t, stops: pieces.filter((p) => people[p.id]?.people.some((e) => t.who(e).length)).map((p) => p.id) });
const listed = new Set(black.map((x) => x.name));

export const trails: Trail[] = [
  // the green line: every piece whose People section names a woman
  lay({ id: 'women', colour: '#1f9d55', lane: 0.34, spur: 0, who: (e) => e.she ?? [] }),
  // the blue line: every piece whose People section names someone on the list above. It runs on the window side of the aisle
  lay({ id: 'black', colour: '#2a86f0', lane: -0.34, spur: -0.6, who: (e) => e.who.filter((n) => listed.has(n)), list: black }),
];

export const trailById = (id: string): Trail | undefined => trails.find((t) => t.id === id);
