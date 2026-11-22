import type { Hall } from './schema';

/** The seven halls. */
export const halls: Hall[] = [
  {
    id: 1, name: 'Mechanics',
    intro: 'Here a pixel is an object that you could pick up. Every piece in this hall makes its picture by moving real things: flaps, discs, pins, tiles and drones.',
  },
  {
    id: 2, name: 'Glass and glow',
    intro: 'Every piece in this hall is sealed glass with something glowing inside. The glow comes from a beam of electrons, from a gas lit by electricity or from a hot wire. Each of these needs a vacuum or a gas filling to work.',
  },
  {
    id: 3, name: 'Solid light',
    intro: 'Here the light comes straight out of a solid material. These displays need no vacuum, no gas and no hot wire, which is why they could become thin, cool and, in time, bendable.',
  },
  {
    id: 4, name: 'Light valves',
    intro: 'Nothing in this hall makes its own light. The sun, a lamp or a laser makes the light, and the device blocks it, tilts it or steers it to form a picture. A device that lets light through or blocks it is called a light valve.',
  },
  {
    id: 5, name: 'Paper',
    intro: 'These displays behave like print. They use the light of the room and make none of their own, and most of them keep their picture with the power off. Switch the daylight off to see the cost: in the dark there is nothing to read.',
  },
  {
    id: 6, name: 'Mid-air',
    intro: 'These pictures have no screen that you can point to. Some are stage tricks with glass and fog. Others put real points of light in empty space.',
  },
  {
    id: 7, name: 'Depth',
    intro: 'You have two eyes, and depth needs a picture for each. Some of these pieces give each eye its own view. Others go further and rebuild the light that a real object would send out.',
  },
];

export const hallById = (id: number): Hall => halls[id - 1];
