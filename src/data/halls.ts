import type { Hall } from './schema';

/** The seven halls. */
export const halls: Hall[] = [
  {
    id: 1, name: 'Mechanics', was: 'the machine room',
    intro: 'Pixels you could pick up. In this hall an image is made by moving real matter: flaps, discs, pins, tiles and drones.',
  },
  {
    id: 2, name: 'Glass and glow', was: 'the glassworks',
    intro: 'Sealed glass with something glowing inside. Electron beams, cold plasmas and hot filaments, all of them needing a vacuum or a gas fill to work.',
  },
  {
    id: 3, name: 'Solid light', was: 'the semiconductor floor',
    intro: 'Light straight out of a solid. No vacuum, no gas and no filament, which is why these could become thin, cold and eventually bendable.',
  },
  {
    id: 4, name: 'Light valves', was: 'the optical shop',
    intro: 'Nothing in this hall makes light. A lamp or a laser does that, and the device gates it, tilts it or steers it into a picture.',
  },
  {
    id: 5, name: 'Paper', was: 'the print shop',
    intro: 'Displays that behave like print. They borrow the light in the room, and most of them keep their image with the power off. Switch the daylight off to see what that costs.',
  },
  {
    id: 6, name: 'Thin air', was: 'the darkroom',
    intro: 'Images with no screen you can point to. Some are stage tricks with glass and fog. Others put real points of light in open space.',
  },
  {
    id: 7, name: 'Depth', was: 'the tower',
    intro: 'Two eyes, two pictures. These either hand each eye its own view or go further and rebuild the light itself.',
  },
];

export const hallById = (id: number): Hall => halls[id - 1];
