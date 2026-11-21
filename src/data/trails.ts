import { people } from './people';
import { pieces } from './pieces';

/**
 * A trail is a route through the halls for visitors who want to follow one thread of the collection.
 * Its stops are pieces, in the order of the halls. In the walk it is a painted line on the floor, with a spur
 * and a dot at each stop. Its name is in the interface text, under `trail.<id>`.
 *
 * The colours are wayfinding colours and mean nothing. `lane` is how far from the middle of the aisle the
 * line runs, in metres, so that two trails do not lie on top of each other.
 */
export interface Trail { id: 'women'; colour: string; lane: number; stops: string[] }

export const trails: Trail[] = [
  // every piece whose People section names a woman
  { id: 'women', colour: '#1f9d55', lane: 0.34, stops: pieces.filter((p) => people[p.id]?.people.some((e) => e.she?.length)).map((p) => p.id) },
];

export const trailById = (id: string): Trail | undefined => trails.find((t) => t.id === id);
