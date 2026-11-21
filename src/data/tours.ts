import { trailById, type Trail } from './trails';

/**
 * A guided tour is a story told along a trail: a few words before the first stop, a passage at each stop and a
 * few words at the end. It is written to be spoken, so the sentences are short and the years are in figures.
 * It adds no facts to the labels. Everything in it is on the label of the piece it is told at, and has its
 * source there. What the tour adds is the thread from one stop to the next.
 *
 * `parts` begins with `start`, ends with `end`, and has one part for each stop of the trail, in order, under
 * the id of the piece. The check holds it to that.
 */
export interface TourPart { id: string; title: string; text: string[] }
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
        'Welcome to the museum. Follow the green line on the floor. It runs through all seven halls and stops at ten displays. Each has at least one woman among its inventors or contributors.',
        'The picture is made of something different at every stop. It starts with pins, at the braille display in hall 1.',
      ] },
      { id: 'braille-display', title: 'Read by touch', text: [
        'This display is read by touch. Rows of pins rise and fall to spell a line of braille. The model is spelling the time. Watch the cells on the right: they change every second.',
        'Under each dot is a crystal that bends when a voltage reaches it, and a lever turns that small bend into the rise of a pin. Oleg and Andrée Tretiakoff patented this way of raising the dots. They filed first in France, in 1974.',
        'It is the only piece in the museum that needs no light at all. Every other display on the green line works with light. The next is the cathode ray tube in hall 2, where a beam of electrons makes a screen glow.',
      ] },
      { id: 'cathode-ray-tube', title: 'A beam that draws', text: [
        'Press the button marked Sit in front. The bright band moving down the screen is where one beam of electrons has just drawn its lines. The model slows it about 60 times. From the side you can see the copper coils that steer the beam.',
        'In 1927, in San Francisco, Philo Farnsworth sent the first television picture made entirely by electronics. Elma Farnsworth, known as Pem, worked beside him in his laboratories. Her face was among the first that his system sent.',
        'In hall 1 the picture was made of pins. Here one beam draws all of it. The next stop is the MicroLED wall in hall 3, where the picture is made of lamps.',
      ] },
      { id: 'microled', title: 'A question at dinner', text: [
        'The wall in front of you is made of LEDs, each too small to see. One tile is out and leans against the stand, with the suction lifter still on it. A wall like this is repaired one square at a time.',
        'Hongxing Jiang and Jingyu Lin are physicists and a married couple. The idea began as a question at their dinner table: what would happen to an LED shrunk to thousandths of a millimetre? In 2000, at Kansas State University, they made the first microLEDs.',
        'Stay in hall 3. The next stop, the quantum-dot display, works with crystals far smaller than these lamps.',
      ] },
      { id: 'quantum-dot', title: 'Colour from size', text: [
        'This is one pixel, cut open and greatly enlarged. Blue light rises from the lamps on the board. In the left well, large crystals turn it red. In the middle well, small ones turn it green. The right well has no crystals, and the blue passes through. The size of a crystal alone sets its colour.',
        'The crystals are called quantum dots. The model shows what most screens do with them. In 1994, at Berkeley, Vicki Colvin, M. C. Schlamp and Paul Alivisatos took another route: they made a layer of dots glow by passing a current through it. Colvin is the first author of the paper.',
        'The cathode ray tube, the LED wall and this pixel all make their own light. In hall 4 a lamp or a laser makes it, and the display shapes it. Go to the scanned laser.',
      ] },
      { id: 'scanned-laser', title: 'Drawing with a laser', text: [
        'Follow the beams from left to right. Three lasers merge into one white beam. Two small mirrors on fast motors steer it, and your eye joins the moving dot into a drawing on the wall.',
        'The laser images of Elsa Garmire, a physicist at the California Institute of Technology, were filmed in 1972, and they became the model for Laserium. Ivan Dryer, a filmmaker who worked with her, opened Laserium at Griffith Observatory in Los Angeles in 1973.',
        'In hall 2 a beam of electrons drew the picture inside a tube. This beam is light, and it can draw on anything: clouds, buildings, smoke. A few steps on, in the same hall, a picture is cut to fit a set of white plaster shapes.',
      ] },
      { id: 'projection-mapping', title: 'A picture cut to fit', text: [
        'Find the switch marked Daylight and turn it off. By day this picture is barely visible. The projector on the tripod is an ordinary one. The work is in the picture, which is cut to fit the shapes it lands on. Each shape gets its own pattern, and no light falls on the floor.',
        'In 1969 the Haunted Mansion at Disneyland used this for its singing busts. The faces of singers were filmed, and the film was projected onto plaster busts of the same faces. The Haunted Mansion also has a crystal ball with a blank head inside. The face projected onto it is the filmed face of Leota Toombs, an artist at the Disney design workshop.',
        'The next stop is in hall 5, at the electrowetting display. The displays there behave like print: they use the light of the room.',
      ] },
      { id: 'electrowetting', title: 'Oil and water', text: [
        'These are 12 cells, greatly enlarged. Each holds a drop of dyed oil under water. With no voltage, the oil spreads out and the cell shows its colour. With a voltage, the water pushes the oil into a corner. Watch one cell switch. The oil does not disappear. It gathers in the corner and stands higher.',
        'At the first stop a voltage bent a crystal and lifted a pin. Here a voltage makes water push oil aside. Gerardo Beni and Susan Hackwood proposed this display at Bell Laboratories in 1981, and they gave the effect its name: electrowetting. In 2003, at Philips Research in Eindhoven, Robert Hayes and Johan Feenstra made it work at video speed.',
        'Next is hall 6, Mid-air. Go to the illusion transmitter, where a picture hangs in the air.',
      ] },
      { id: 'illusion-transmitter', title: 'A bulb that is not there', text: [
        'Look at the two boxes. On the left, a real bulb hangs hidden under the socket, and a curved mirror stands its picture in the empty socket above. On the right there is no bulb, only the picture, sent across by a camera and a second mirror. Watch the left bulb go dark. The picture on the right follows.',
        'In hall 3 a question was asked at a dinner table. Another was asked at an exhibition in 1976. Valerie Thomas saw a curved mirror make a bulb seem to glow after it had been taken out of its socket, and she asked whether the picture could be sent. She had joined NASA as a data analyst. When she invented the illusion transmitter, she was managing the image-processing systems for Landsat. Her patent was granted on 21 October 1980.',
        'Stay in hall 6 for the static-volume display, where a stack of clear sheets catches the picture.',
      ] },
      { id: 'static-volume', title: 'Drawing inside glass', text: [
        'The figure is a knot. In the stack of clear sheets, one sheet at a time turns milky and catches its slice of the picture. Look along the stack from the side to see the knot in slices. Nothing moves.',
        'There is another way to fill a volume, with no sheets: a block of special glass that glows only where two invisible beams cross. The model does not show it. A beam of electrons drew in hall 2, and a laser in hall 4. In that block the point where the two beams cross does the drawing, in three dimensions.',
        'Elizabeth Downing, Lambertus Hesselink, John Ralston and Roger Macfarlane drew coloured points of light inside glass in this way. Their work was published from Stanford University in 1996. Downing is the first author. The last stop is holography, in hall 7.',
      ] },
      { id: 'holography', title: 'The light itself', text: [
        'Look through the glass plate. A toy engine seems to stand behind it. Turn the model, and you see around the engine. It is not behind the glass. A hologram records the light itself. In hall 4 a laser drew the picture. Here a laser only lights the plate, and the plate sends out the same light waves that the engine did.',
        'Dennis Gabor invented holography in 1948. Margaret Benyon, a painter, made holograms as art from 1968 and showed them a year later. A hologram like this one is static. In 1989 the first holographic video display was built in the group of Stephen Benton at the MIT Media Lab. Mary Lou Jepsen set out its design in her thesis of that year.',
      ] },
      { id: 'end', title: 'The end of the green line', text: [
        'That is the end of the green line. It began with pins that are read by touch. It ends with a toy engine that is not there.',
        'Every piece in these halls has its people, and their names are on the labels. Thank you for taking the tour.',
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
