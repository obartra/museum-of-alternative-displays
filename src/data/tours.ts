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
    title: 'Eleven names',
    lead: 'A guided walk along the green line: ten pieces, eleven women, and how each name came to be written down.',
    parts: [
      { id: 'start', title: 'Before the first stop', text: [
        'Welcome to the museum. I am your guide along the green line on the floor. It stops at every piece whose label names a woman: ten stops, eleven names.',
        'I will not read you the labels. They are there if you want them. Listen for something else: how each of these names came to be written down. Sometimes it is a patent. Sometimes a paper, a thesis or a film. And twice, before there is a name at all, there is a face.',
        'Follow the line into hall 1.',
      ] },
      { id: 'braille-display', title: 'Two names, one patent', text: [
        'This display shows nothing. It is read with the fingertips, so it works as well in the dark as in the sun. Under every dot lies a sliver of crystal that bends when a voltage reaches it, and the bend lifts a pin. Watch the cells on the right. They change every second.',
        'In 1974, in France, a patent was filed for raising braille dots this way. It carries two names with one surname: Oleg and Andrée Tretiakoff.',
        'A patent does not say who had the idea and who made it work. It gives two names, side by side. Remember that picture. On this walk it comes back, and it changes.',
      ] },
      { id: 'cathode-ray-tube', title: 'A face on the screen', text: [
        'Here a single beam of electrons draws the whole picture, line by line. The bright band moving down the glass is that beam at work, slowed so that you can see it.',
        'In 1927, in San Francisco, Philo Farnsworth sent the first television picture made entirely by electronics. His wife Elma, known as Pem, worked beside him in his laboratories. When the system could show a person, hers was among the first faces it sent.',
        'So the record holds her in two ways: as a colleague at the bench, and as the picture itself. The patents carry his name. Keep her face in mind. Another one is waiting in hall 4.',
      ] },
      { id: 'microled', title: 'A question at dinner', text: [
        'Some seventy years later, another laboratory and another married couple: the physicists Hongxing Jiang and Jingyu Lin. This piece began as a question at their dinner table. What would happen to an LED if you shrank it to a few thousandths of a millimetre? In 2000, at Kansas State University, they made the first ones.',
        'The wall in front of you is built from such lamps, each too small to see. One tile is out, leaning against the stand. That is how a wall is repaired.',
        'Now think back to the Farnsworths. Again two people share a life and a laboratory. This time the invention is recorded as theirs together.',
      ] },
      { id: 'quantum-dot', title: 'First author', text: [
        'Stay in this hall and find the three small wells: red, green and blue. The colour comes from crystals so small that their size alone decides it. Small ones glow green, larger ones red.',
        'Three people shared a Nobel Prize in 2023 for those crystals. The step that turned them into a lamp came in 1994, at Berkeley, when a layer of them was made to glow by passing a current through it. The paper has three authors. The first is Vicki Colvin.',
        'In her field, the first name on a paper is usually the person who did most of the work at the bench. It is a small thing, a position in a list. But it is in print, and no name stands before hers.',
      ] },
      { id: 'scanned-laser', title: 'A reel of film', text: [
        'Three lasers on the left merge into one white beam. Two small mirrors on fast motors throw that beam about, and your eye joins the moving dot into a drawing on the wall.',
        'Elsa Garmire was a physicist at the California Institute of Technology, and she made images with laser light. In 1972 they were filmed. The filmmaker who worked with her, Ivan Dryer, opened Laserium a year later at Griffith Observatory in Los Angeles. Her images were its model.',
        'Here the record is a reel of film, and a show that people queued for. Not every contribution ends in a patent. Some end in an audience.',
      ] },
      { id: 'projection-mapping', title: 'A face in a crystal ball', text: [
        'A few steps on: white plaster shapes, and a projector on a tripod. By day you will hardly see the picture, so switch the daylight off. The whole trick is in the picture. It is cut and bent to fit the object it lands on, until the object itself seems to change.',
        'In 1969, at the Haunted Mansion in Disneyland, the faces of singers were filmed and projected onto plaster busts of the same faces. And inside a crystal ball, a blank head received the filmed face of Leota Toombs.',
        'This is the second face on our walk. Pem Farnsworth was sent as a television picture. Leota Toombs was laid over a blank head. But she was not a visitor who happened to be there. She was an artist in the workshop that built the ride.',
      ] },
      { id: 'electrowetting', title: 'A word', text: [
        'In this hall the displays behave like paper. Each cell here holds a drop of dyed oil under water. With no voltage, the oil lies flat and shows its colour. With a voltage, the water pushes it into a corner. Watch one cell switch. The oil does not vanish. It gathers, and stands higher.',
        'In 1981, at Bell Laboratories, Gerardo Beni and Susan Hackwood proposed a display built on this effect, and they gave the effect its name: electrowetting. He was born in Florence, she in England.',
        'The display had to wait. It ran at video speed only in 2003, in another laboratory, in other hands. What stayed from 1981 is the word. Everyone who has worked on this since uses a name that two people chose.',
      ] },
      { id: 'illusion-transmitter', title: 'One name', text: [
        'Look at the two boxes. On the left a real bulb hangs hidden below, and its picture stands in the empty socket above it. On the right there is no bulb at all. When the left one goes dark, the right one follows.',
        'In 1976, at an exhibition, Valerie Thomas saw a curved mirror make a bulb seem to glow after it had been taken out of its socket. She asked a question: could that picture be sent somewhere else? She worked at NASA. She had started there as a data analyst, and by then she managed the image systems for the Landsat satellite. At Morgan State University she had been one of only two women to major in physics.',
        'Her patent was granted on 21 October 1980. At our first stop, a patent carried two names side by side. This one carries a single name, and it is hers.',
      ] },
      { id: 'static-volume', title: 'First author, again', text: [
        'Stay in this hall. The knot in front of you is cut into slices, and a lit sheet runs through them from front to back. Nothing moves but the light.',
        'There is an earlier way to do this, with no sheets at all: a block of special glass that glows only at the point where two invisible beams cross. Steer that point, and you draw inside the solid, in colour. The work came out of Stanford University in 1996. The paper has four authors, and the first is Elizabeth Downing.',
        'You have heard that phrase before, in the hall of solid light. First author. Valerie Thomas stood a picture in the air. Elizabeth Downing drew one inside a block of glass.',
      ] },
      { id: 'holography', title: 'A painter and a thesis', text: [
        'The last hall, and the last stop. Behind the glass plate there seems to be a toy locomotive. Move, and you see round it. There is no locomotive. The plate holds the light that one once sent out.',
        'Two names wait here, twenty-one years apart. Margaret Benyon was a painter, born in Birmingham and raised in Kenya. From 1968 she made holograms as art, and a year later she showed them. Then, in 1989, the first holographic video display was built in the group of Stephen Benton at the MIT Media Lab. The thesis that sets out its design is by Mary Lou Jepsen.',
        'A painter who took up a laboratory technique, and a student who wrote down how to make a hologram move.',
      ] },
      { id: 'end', title: 'At the end of the line', text: [
        'That is the end of the line. Look back along it. Two names on a patent. A face on a screen. A question at a dinner table. First author. A reel of film. A face in a crystal ball. A word. A patent in one name. First author again. A painter, and a thesis.',
        'Eleven names, among more than a hundred on the labels of this museum. The list is short. Part of that is history, and part of it is the record, which has not always written down who did the work. When we find another name, the green line gets another stop.',
        'Thank you for walking it with me.',
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
