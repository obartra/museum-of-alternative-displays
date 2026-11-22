/**
 * Everyone named on a label, each once: the address of their page and the lines the museum has on them. A short
 * sourced account of a person, where one has been written, is in person-bios.ts.
 */
import { people, type Entry } from './people';
import { pieces } from './pieces';

export interface Person { name: string; slug: string; on: { piece: string; k: number; entry: Entry }[] }

/** The folder of a person's page, from their name: `Andrée Tretiakoff` is `andree-tretiakoff`. */
export const slugOf = (name: string): string => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const found = new Map<string, Person>();
for (const p of pieces) (people[p.id]?.people ?? []).forEach((entry, k) => {
  for (const name of entry.who) {
    let who = found.get(name);
    if (!who) found.set(name, who = { name, slug: slugOf(name), on: [] });
    who.on.push({ piece: p.id, k, entry });
  }
});
/** In the order of the halls and of the pieces in them. */
export const persons: Person[] = [...found.values()];
export const personByName = (name: string): Person | undefined => found.get(name);
const bySlug = new Map(persons.map((who) => [who.slug, who]));
export const personBySlug = (slug: string): Person | undefined => bySlug.get(slug);
