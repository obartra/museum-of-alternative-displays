import { trailById, type Trail } from './trails';

/**
 * A guided tour is a story told along a trail: a few words before the first stop, a passage at each stop and a
 * few words at the end. It is written to be spoken, so the sentences are short and the years are in figures.
 * It adds no facts to the labels. Everything in it is on the label of the piece it is told at, and has its
 * source there. What the tour adds is the thread from one stop to the next.
 *
 * A stop has three paragraphs. The first says what to look at, and the guide leaves a silence after it for the
 * looking. The second is about the people: one person or one pair, and one year. Where the plate on the block
 * names someone else or another year, the guide says why. The third hands over to the next stop.
 *
 * `parts` begins with `start`, ends with `end`, and has one part for each stop of the trail, in order, under
 * the id of the piece. The check holds it to that.
 */
/**
 * Where the tour stands the visitor in the walk, for a stop whose usual place in front of the block is too far
 * back to show what the guide points at. `wide` is how much of the block's width to fill the picture with, in
 * metres: the block is 2.2 across, and less than that is a nearer look. `aim` is how far above the top of the block
 * to look, in metres.
 */
export interface Stand { wide?: number; aim?: number }
/**
 * One part of a tour. `who` names the people a stop is about, as the label spells them: the walk shows them in a
 * corner of the picture while the guide speaks, with a portrait where there is one.
 */
export interface TourPart { id: string; title: string; text: string[]; stand?: Stand; who?: string[] }
export interface Tour {
  id: Trail['id']; title: string; lead: string; parts: TourPart[];
  /** Not announced yet: no page links to it. Its own address opens it, and from then on that visitor is shown the rest. */
  draft?: boolean;
}

export const tours: Tour[] = [
  {
    id: 'women',
    draft: true,
    title: 'The green line',
    lead: 'A guided walk through all seven halls. Ten displays, from braille pins to a hologram, each with at least one woman among its inventors or contributors.',
    parts: [
      { id: 'start', title: 'Before the first stop', text: [
        'Welcome to the museum. This tour follows the green line on the floor. It runs through all seven halls and stops at ten displays. Each has at least one woman among its inventors or contributors.',
        'The tour waits at each stop. Press the key for the next stop when you are ready. The first is the braille display in hall 1, where the picture is made of pins.',
      ] },
      { id: 'braille-display', title: 'Read by touch', stand: { wide: 2.1, aim: 0.2 }, who: ['Andrée Tretiakoff'], text: [
        'This display is read by touch. Rows of pins rise and fall to spell a line of braille. The model is spelling the time. Watch the cells on the right. They change every second.',
        'Under each dot is a crystal that bends when a voltage reaches it, and a lever turns that small bend into the rise of a pin. Andrée Tretiakoff and Oleg Tretiakoff patented this way of raising the dots. They filed first in France, in 1974.',
        'It is the only piece in the museum that needs no light at all. Every other stop on the green line works with light. The next is the cathode ray tube in hall 2, where a beam of electrons makes a screen glow.',
      ] },
      { id: 'cathode-ray-tube', title: 'A beam that draws', who: ['Elma Farnsworth'], text: [
        'Look at the screen. The bright band moving down it is where one beam of electrons has just drawn its lines. The model slows it about 60 times. From the side you can see the copper coils that steer the beam.',
        'The plate on the block names Ferdinand Braun, who built the first tube of this kind in 1897. Thirty years later, in San Francisco, Philo Farnsworth sent the first television picture made entirely by electronics. Elma Farnsworth, known as Pem, worked in his laboratories and made the technical drawings for the experiments. Her face was among the first that the system sent.',
        'In hall 1 the picture was made of pins. Here one beam draws all of it. The next stop is the MicroLED wall in hall 3, where the picture is made of lamps.',
      ] },
      { id: 'microled', title: 'A question at dinner', who: ['Jingyu Lin'], text: [
        'The wall in front of you is made of LEDs, each too small to see. One tile is out and leans against the stand, with the suction lifter still on it. A wall like this is repaired one square at a time.',
        'Jingyu Lin and Hongxing Jiang are physicists. In 2000, at Kansas State University, they made the first microLEDs. They are also a married couple, and the idea began as a question at their dinner table: what would happen to an LED shrunk to thousandths of a millimetre?',
        'Stay in hall 3. The next stop, the quantum-dot display, works with crystals far smaller than these lamps.',
      ] },
      { id: 'quantum-dot', title: 'Colour from size', stand: { wide: 1.6, aim: 0.45 }, who: ['Vicki Colvin'], text: [
        'This is one pixel, cut open and greatly enlarged. Blue light rises from the lamps on the board. In the left well, large crystals turn it red. In the middle well, small ones turn it green. The right well has no crystals, and the blue passes through. The size of a crystal alone sets its colour.',
        'The crystals are called quantum dots. Most screens use them as this model does, to turn blue light into red and green. In 1994, at Berkeley, Vicki Colvin and two colleagues took another route. They made a layer of dots glow by passing a current through it. Colvin is the first author of the paper.',
        'The cathode ray tube, the LED wall and this pixel all make their own light. In hall 4 a lamp or a laser makes the light, and the display shapes it. Go to the scanned laser.',
      ] },
      { id: 'scanned-laser', title: 'Drawing with a laser', who: ['Elsa Garmire'], text: [
        'Follow the beams from left to right. Three lasers merge into one white beam. Two small mirrors on fast motors steer it, and your eye joins the moving dot into a drawing on the wall.',
        'The plate names Joseph Ostoja-Kotkowski, who staged an early laser show in Adelaide. Elsa Garmire, a physicist at the California Institute of Technology, made laser images. They were filmed in 1972, and they became the model for Laserium, the laser show that opened at Griffith Observatory in Los Angeles.',
        'In hall 2 a beam of electrons drew the picture inside a tube. This beam is light, and it can draw on anything: clouds, buildings, smoke. A few steps on, in the same hall, a picture is cut to fit a set of white plaster shapes.',
      ] },
      { id: 'projection-mapping', title: 'A picture cut to fit', who: ['Leota Toombs'], text: [
        'Find the switch marked Daylight and turn it off. By day this picture is barely visible. The projector on the tripod is an ordinary one. The work is in the picture, which is cut to fit the shapes it lands on. Each shape gets its own pattern, and no light falls on the floor.',
        'In 1969 the Haunted Mansion at Disneyland used this for its singing busts. The faces of singers were filmed, and the film was projected onto plaster busts of the same faces. In the same house a crystal ball holds a blank head. Leota Toombs, an artist at the Disney design workshop, gave it her face: the film projected onto that head is of her.',
        'Before you go on, turn the daylight back on. The next stop is the electrowetting display in hall 5. The displays there behave like print: they need the light of the room.',
      ] },
      { id: 'electrowetting', title: 'Oil and water', who: ['Susan Hackwood'], text: [
        'These are 12 cells, greatly enlarged. Each holds a drop of dyed oil under water. With no voltage, the oil spreads out and the cell shows its colour. With a voltage, the water pushes the oil into a corner. Watch one cell switch. The oil does not disappear. It gathers in the corner and stands higher.',
        'At the first stop a voltage bent a crystal and lifted a pin. Here a voltage makes water push oil aside. Susan Hackwood and Gerardo Beni proposed this display at Bell Laboratories in 1981, and they gave the effect its name: electrowetting. The year on the plate, 2003, is when a laboratory in the Netherlands made it fast enough for video.',
        'Next is hall 6, Mid-air. Go to the illusion transmitter, where a picture hangs in the air.',
      ] },
      { id: 'illusion-transmitter', title: 'A bulb that is not there', who: ['Valerie Thomas'], text: [
        'Look at the two boxes. On the left, a real bulb hangs hidden under the socket, and a curved mirror stands its picture in the empty socket above. On the right there is no bulb, only the picture, sent across by a camera and a second mirror. Watch the left bulb go dark. The picture on the right follows.',
        'In hall 3 a question was asked at a dinner table. This one was asked at an exhibition, in 1976. Valerie Thomas saw a curved mirror make a bulb seem to glow after it had been taken out of its socket, and she asked whether the picture could be sent. When she invented the illusion transmitter, she was managing the image-processing systems for Landsat at NASA. The patent was granted to her four years after that exhibition.',
        'Stay in hall 6 for the static-volume display, where the picture fills a block of space.',
      ] },
      { id: 'static-volume', title: 'Drawing inside glass', who: ['Elizabeth Downing'], text: [
        'Start with the stack of clear sheets. The figure in it is a knot. One sheet at a time turns milky and catches its slice of the picture. Nothing moves.',
        'Now look beside the stack, at the block of glass. It glows only where two invisible beams cross, and the model draws them in red. A beam of electrons drew in hall 2, and a laser in hall 4. Here the point where two beams cross does the drawing, in three dimensions.',
        'Elizabeth Downing and three colleagues drew coloured points of light inside glass in this way. Their work was published from Stanford University in 1996, with Downing as first author. The prototype was a cube about 15 millimetres on each side, and the model shows it many times that size. The last stop is holography, in hall 7.',
      ] },
      { id: 'holography', title: 'The light itself', who: ['Margaret Benyon', 'Mary Lou Jepsen'], text: [
        'Look through the glass plate. A toy engine seems to stand behind it. Move to one side, and you see around the engine. It is not behind the glass. A hologram records the light itself. In hall 4 a laser drew the picture. Here a laser only lights the plate, and the plate sends out the same light waves that the engine did.',
        'Dennis Gabor invented holography in 1948. Twenty years later Margaret Benyon, a painter, began to make holograms as art. A hologram like this one is static. The first holographic video display was built at the MIT Media Lab in 1989, and the thesis that Mary Lou Jepsen wrote there that year sets out its design.',
      ] },
      { id: 'end', title: 'The end of the green line', text: [
        'That is the end of the green line. It began with pins that are read by touch. It ends with a toy engine that is not there.',
        'Eleven women are named on the labels in these halls, one in ten of all the people named there. You have now stood at the work of all eleven.',
        'The line passed 43 other displays on the way. Leave the tour, and the halls are yours to walk. Every piece has its label, and its people are named on it. Thank you for taking the tour.',
      ] },
    ],
  },
];

export const tourById = (id: string): Tour | undefined => tours.find((t) => t.id === id);
/** The stops of a tour: its parts without the words before the first and after the last. */
export const tourStops = (tour: Tour): TourPart[] => tour.parts.filter((p) => p.id !== 'start' && p.id !== 'end');
/** What goes wrong when a tour and its trail no longer agree, or nothing. */
export function tourFault(tour: Tour): string | undefined {
  const stops = trailById(tour.id)?.stops ?? [], told = tourStops(tour).map((p) => p.id);
  if (tour.parts[0]?.id !== 'start' || tour.parts[tour.parts.length - 1]?.id !== 'end') return 'a tour begins with a part called start and ends with one called end';
  if (told.join() !== stops.join()) return `the tour stops at ${told.join(', ')} and the trail at ${stops.join(', ')}`;
  return undefined;
}

/**
 * A short mark of a text, the same in the browser and in the script that has the tour spoken. A recording is
 * played only beside the very words it was made from.
 */
export function mark(text: string): string {
  let h = 0x811c9dc5;
  for (const c of new TextEncoder().encode(text)) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
/** What the guide says at one part, as one text: the paragraphs with an empty line between them. */
export const spoken = (text: string[]): string => text.join('\n\n');
