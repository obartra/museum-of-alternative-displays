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
    title: 'Women in the museum',
    lead: 'A guided walk through all seven halls. Fourteen displays, from braille pins to a room of screens, each with at least one woman among its inventors or contributors.',
    parts: [
      { id: 'start', title: 'Before the first stop', text: [
        'Welcome to the museum. This tour follows the green line on the floor. It runs through all seven halls and stops at fourteen displays. Each has at least one woman among its inventors or contributors.',
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
        'The cathode ray tube, the LED wall and this pixel all make their own light. In hall 4 the sun, a lamp or a laser makes the light, and the display shapes it. Go to the shadow play, where the lamp is a flame behind a cloth.',
      ] },
      { id: 'shadow-play', title: 'A flame and a cloth', who: ['Kara Walker'], text: [
        'Look at the cloth. A flame burns behind it, and three flat figures stand between the flame and the cloth: a tree, a deer and a bird. What you see are their shadows. Watch the bird. When it flies towards the lamp, its shadow grows and its edge goes soft.',
        'Nobody knows who first did this. It is recorded in Java and in China about a thousand years ago, and it is performed today. Holes cut through a figure let the light pass and draw an eye or a feather inside the shadow. Kara Walker, an American artist known for silhouettes cut from black paper, has made films this way since 2004. Her jointed paper puppets, worked by hand on sticks, play out stories of slavery in America.',
        'The first stop needed no light at all. This one needs only a flame. The next stop, in this hall, draws with a beam of light. Go to the scanned laser.',
      ] },
      { id: 'scanned-laser', title: 'Drawing with a laser', who: ['Elsa Garmire'], text: [
        'Follow the beams from left to right. Three lasers merge into one white beam. Two small mirrors on fast motors steer it, and your eye joins the moving dot into a drawing on the wall.',
        'The plate names Joseph Ostoja-Kotkowski, who staged an early laser show in Adelaide. Elsa Garmire, a physicist at the California Institute of Technology, made laser images. They were filmed in 1972, and they became the model for Laserium, the laser show that opened at Griffith Observatory in Los Angeles.',
        'In hall 2 a beam of electrons drew the picture inside a tube. This beam is light, and it can draw on anything: clouds, buildings, smoke. A few steps on, in the same hall, a picture is cut to fit a set of white plaster shapes.',
      ] },
      { id: 'projection-mapping', title: 'A picture cut to fit', who: ['Leota Toombs'], text: [
        'Find the switch marked Daylight and turn it off. By day this picture is barely visible. The projector on the tripod is an ordinary one. The work is in the picture, which is cut to fit the shapes it lands on. Each shape gets its own pattern, and no light falls on the floor.',
        'In 1969 the Haunted Mansion at Disneyland used this for its singing busts. The faces of singers were filmed, and the film was projected onto plaster busts of the same faces. In the same house a crystal ball holds a blank head. Leota Toombs, an artist at the Disney design workshop, gave it her face: the film projected onto that head is of her.',
        'Before you go on, turn the daylight back on. The next stop is in hall 5, where the displays behave like print: they need the light of the room. Go to the electrophoretic ink, the page of an e-reader.',
      ] },
      { id: 'electrophoretic-ink', title: 'A page that bends', who: ['Zhenan Bao'], text: [
        'This is the page of an e-reader. It makes no light. Millions of capsules hold black and white pigment, and a voltage pulls one colour to the top. Watch the page for a moment. Every 15 seconds it resets, with a flash of black and then of white. In between, it holds the page with no power.',
        'The plate names Barrett Comiskey, J. D. Albert and Joseph Jacobson, who developed this ink at the MIT Media Lab in 1996. Five years later, at Bell Laboratories, John Rogers and Zhenan Bao laid it on a sheet of plastic. Bao is a chemist who designs plastics that carry a current. With a rubber stamp they printed 256 plastic transistors on the sheet, one for each dot of the picture. The page could bend.',
        'The ink is slow, which suits a page. The next stop, in this hall, is a display of the same kind that became fast enough for video. Go to the electrowetting display.',
      ] },
      { id: 'electrowetting', title: 'Oil and water', who: ['Susan Hackwood'], text: [
        'These are 12 cells, greatly enlarged. Each holds a drop of dyed oil under water. With no voltage, the oil spreads out and the cell shows its colour. With a voltage, the water pushes the oil into a corner. Watch one cell switch. The oil does not disappear. It gathers in the corner and stands higher.',
        'At the first stop a voltage bent a crystal and lifted a pin. Here a voltage makes water push oil aside. Susan Hackwood and Gerardo Beni proposed this display at Bell Laboratories in 1981, and they gave the effect its name: electrowetting. The year on the plate, 2003, is when a laboratory in the Netherlands made it fast enough for video.',
        'There is one more stop in this hall. Go to the electrochromic display, a printed label that shows the minutes.',
      ] },
      { id: 'electrochromic', title: 'Layer by layer', who: ['Paula Hammond'], text: [
        'This printed label shows the minutes past the hour. In this hall a voltage has moved pigment, and then oil. Here it moves atoms. It pushes charged atoms into the printed film, and the film darkens. Wait for the minute to change. The old numeral fades, and the new one darkens over several seconds. The pane of glass behind the label carries the same film.',
        'The plate names S. K. Deb, whose work on films of tungsten oxide, in 1969, is where these displays began. At the Massachusetts Institute of Technology, Paula Hammond and Dean DeLongchamp built such films in another way: one molecular layer at a time. Their films changed colour faster, and with more contrast, than films made in other ways. The thesis that sets the work out is from 2003, and it points to a display in full colour.',
        'That was the last display that works like print. Next is hall 6, Mid-air. Go to the illusion transmitter, where a picture hangs in the air.',
      ] },
      { id: 'illusion-transmitter', title: 'A bulb that is not there', who: ['Valerie Thomas'], text: [
        'Look at the two boxes. On the left, a real bulb hangs hidden under the socket, and a curved mirror stands its picture in the empty socket above. On the right there is no bulb, only the picture, sent across by a camera and a second mirror. Watch the left bulb go dark. The picture on the right follows.',
        'In hall 3 a question was asked at a dinner table. This one was asked at an exhibition, in 1976. Valerie Thomas saw a curved mirror make a bulb seem to glow after it had been taken out of its socket, and she asked whether the picture could be sent. When she invented the illusion transmitter, she was managing the image-processing systems for Landsat at NASA. The patent was granted to her four years after that exhibition.',
        'Stay in hall 6 for the static-volume display, where the picture fills a block of space.',
      ] },
      { id: 'static-volume', title: 'Drawing inside glass', who: ['Elizabeth Downing'], text: [
        'Start with the stack of clear sheets. The figure in it is a knot. One sheet at a time turns milky and catches its slice of the picture. Nothing moves.',
        'Now look beside the stack, at the block of glass. It glows only where two invisible beams cross, and the model draws them in red. A beam of electrons drew in hall 2, and a laser in hall 4. Here the point where two beams cross does the drawing, in three dimensions.',
        'Elizabeth Downing and three colleagues drew coloured points of light inside glass in this way. Their work was published from Stanford University in 1996, with Downing as first author. The prototype was a cube about 15 millimetres on each side, and the model shows it many times that size. The next stop is holography, in hall 7.',
      ] },
      { id: 'holography', title: 'The light itself', who: ['Margaret Benyon', 'Mary Lou Jepsen'], text: [
        'Look through the glass plate. A toy engine seems to stand behind it. Move to one side, and you see around the engine. It is not behind the glass. A hologram records the light itself. In hall 4 a laser drew the picture. Here a laser only lights the plate, and the plate sends out the same light waves that the engine did.',
        'Dennis Gabor invented holography in 1948. Twenty years later Margaret Benyon, a painter, began to make holograms as art. A hologram like this one is static. The first holographic video display was built at the MIT Media Lab in 1989, and the thesis that Mary Lou Jepsen wrote there that year sets out its design.',
        'This hologram needs no glasses. The last stop, in the same hall, puts screens all round the visitor. Go to the CAVE.',
      ] },
      { id: 'cave', title: 'A room drawn for one head', who: ['Carolina Cruz-Neira'], text: [
        'Stand at the open side of the room. Three walls and the floor are screens. The figure inside wears shutter glasses, and the picture is drawn for its eyes. So from where you stand, the scene breaks at the corners. Press the Take the figure\'s place button, and it joins up.',
        'The plate names four people of the Electronic Visualization Laboratory, at the University of Illinois at Chicago. Carolina Cruz-Neira is the first author of both papers that set out the room, and its design and implementation were her doctoral research. Her laboratory showed it at SIGGRAPH in Chicago in 1992.',
        'A headset, nearby in this hall, turns its screens with the head. Here the screens stay still, and the visitor walks among them. That was the last stop of the green line.',
      ] },
      { id: 'end', title: 'The end of the green line', text: [
        'That is the end of the green line. It began with pins that are read by touch. It ends with a room whose walls are screens.',
        'Sixteen women are named at these fourteen stops, and you have now stood at the work of each. In all, the labels in these halls name more than a hundred people.',
        'The line passed more than forty other displays on the way. Leave the tour, and the halls are yours to walk. Every piece has its label, and its people are named on it. Thank you for taking the tour.',
      ] },
    ],
  },
  {
    id: 'black',
    title: 'Black inventors and artists',
    lead: 'A guided walk through five halls. Ten displays, from a television tube to a headset, each with a Black inventor or artist on its label.',
    parts: [
      { id: 'start', title: 'Before the first stop', text: [
        'This tour follows the blue line on the floor. It stops at ten displays in five halls. At each one the label names a Black inventor or a Black artist.',
        'Some of them made the display. Some made a part that it could not do without. Some put it to a new use, or made art with it. At each stop I will say which.',
        'The first stop is in hall 2. Go to the cathode ray tube.',
      ] },
      { id: 'cathode-ray-tube', title: 'A camera at the door', who: ['Marie Van Brittan Brown', 'Mark Dean'], text: [
        'Look at the screen. The bright band moving down it is where one beam of electrons has just drawn its lines. The model slows it about 60 times.',
        'The plate on the block names Ferdinand Braun, who built the first tube of this kind in 1897. Two people on this label put the tube to work. Marie Van Brittan Brown was a nurse in New York, and her husband Albert was an electronics technician. In 1966 they built a security system for their home. A camera slid between four peepholes in the door, and a television monitor showed who was calling. They patented it in 1969. Mark Dean was an engineer at IBM. Two of his three patents on the IBM personal computer are for the adapters that drove its monitors, one monochrome and one colour.',
        'The next stop is in this hall as well. Go to the Numitron, the glass bulb with seven small filaments.',
      ] },
      { id: 'numitron', title: 'The filament came first', who: ['Lewis Latimer'], text: [
        'Look at the glass bulb. Inside are seven tiny lamp filaments, arranged as the seven bars that form a digit. Current through the right filaments makes them glow in the shape of a numeral.',
        'Lewis Latimer did not make this display. It is from 1970, and he worked nearly ninety years earlier. But a display made of filaments needs filaments that last. In 1882 Latimer patented a way of making the carbon filaments of early electric lamps so that fewer broke in the furnace.',
        'Here the filament is the light. At the next stop, also in this hall, the light comes from a coating that is struck by electrons. Go to the field emission display.',
      ] },
      { id: 'field-emission', title: 'A tube made flat', who: ['Akintunde Akinwande'], text: [
        'The model shows one corner of a panel, opened and greatly enlarged. Follow the layers upward. First come the tips, then the gate with a hole over each tip. Above them is the front plate with its glowing coating. The lit dots count seconds.',
        'This display is a cathode ray tube flattened to a few millimetres, with a tiny source of electrons behind every dot. The way of making the tips was patented at Stanford Research Institute. Akintunde Akinwande was educated in Nigeria and at Stanford. He joined Honeywell in 1986 and worked there on thin-film field emitters and displays. At MIT he worked on arrays of emitters that are switched one by one.',
        'These three displays made their own light. The next one needs only a flame. Walk on to hall 4 and go to the shadow play.',
      ] },
      { id: 'shadow-play', title: 'Cut from black paper', who: ['Kara Walker'], text: [
        'Look at the cloth. A flame burns behind it, and three flat figures stand between the flame and the cloth: a tree, a deer and a bird. What you see are their shadows. Switch the daylight off to see them well.',
        'Nobody knows who first did this. It is recorded in Java and in China about a thousand years ago. Kara Walker is an American artist, known for silhouettes cut from black paper. Since 2004 she has made films this way. Her jointed paper puppets, worked by hand on sticks, play out stories of slavery in America.',
        'A shadow is a picture made by holding light back. The next stop, in this hall, sends a picture out with the light. Go to the projection mapping.',
      ] },
      { id: 'projection-mapping', title: 'A head in a crystal ball', who: ['Lanny Smoot'], text: [
        'Look at the white plaster shapes and the projector on its tripod. Each shape receives its own pattern, and no light falls on the floor. By day the picture is barely visible, so switch the daylight off.',
        'The year on the plate, 1969, belongs to the Haunted Mansion at Disneyland. There a filmed face is projected onto a blank head inside a crystal ball. The head is called Madame Leota. Lanny Smoot is a Disney research fellow with more than 100 patents. He is credited with making Madame Leota float in her séance room.',
        'So far every picture needed a lamp or a flame, or made its own light. In hall 5 the pictures use the light of the room. Go to the electrochromic display.',
      ] },
      { id: 'electrochromic', title: 'One layer at a time', who: ['Paula Hammond'], text: [
        'Look at the printed label that shows the minutes in bars. Wait for the minute to change. The old digit fades and the new digit darkens slowly, over several seconds. The window pane behind the label is the same film on glass.',
        'The plate names S. K. Deb. In 1969 he published the work on tungsten oxide films from which these displays grew. Paula Hammond worked at MIT with Dean DeLongchamp. They built electrochromic films one molecular layer at a time. Their films switched faster and with more contrast than films made in other ways. DeLongchamp\'s thesis of 2003 points to a full-colour display.',
        'This film keeps its colour with the power off. The next picture is not on a surface at all. Go to hall 6 and find the illusion transmitter.',
      ] },
      { id: 'illusion-transmitter', title: 'A picture standing in the air', who: ['Valerie Thomas'], text: [
        'On the left a real bulb hangs hidden under the socket, and its picture stands in the empty socket above. On the right there is no bulb at all. Watch the left bulb go dark: the picture on the right follows a moment later.',
        'Here the plate names the person this tour came for. Valerie Thomas was born in Maryland in 1943. She was one of only two women to major in physics at Morgan State University. She joined NASA as a data analyst and invented the illusion transmitter there. The plate gives the year 1980.',
        'A curved mirror gave that picture its depth. In hall 7 depth comes from giving each eye its own picture. Go to the stereoscope.',
      ] },
      { id: 'stereoscope', title: 'Two pictures, two eyes', who: ['Charles Harrison', 'Kenneth Dunkley'], text: [
        'A hand-held viewer stands on a post, with a stereo card in its holder. Press the Look in button to put an eye to the lens: the flat card becomes a scene with depth. The red and cyan glasses in front do the same job with colour.',
        'The plate names Charles Wheatstone, who published the stereoscope in London in 1838. Two people on this label came much later. Charles Harrison was an industrial designer in Chicago. In 1958 he redesigned the View-Master, a stereoscope for the hand, in light moulded plastic. It went from a photographer\'s accessory to a children\'s toy. Kenneth Dunkley is a physicist in Pennsylvania. His patent of 1989 is for viewing glasses with no lenses: two pinholes and two empty frames. The patent says that they give an ordinary flat picture the look of depth.',
        'The stereoscope needs a viewer in front of the eyes. The next stop does without one. Stay in this hall and go to the lenticular display.',
      ] },
      { id: 'lenticular', title: 'Words that change as you walk', who: ['Hank Willis Thomas'], text: [
        'Look at the card. It shows an eye, printed in nine views. Turn the model: the eye follows you across the room and jumps from one view to the next.',
        'A sheet of tiny ribbed lenses lies over a picture made of strips, and each rib shows a different strip depending on where you stand. The plate names Walter Hess, who filed his patent in 1912. Hank Willis Thomas is an artist in New York. His lenticular prints carry text that changes as the visitor walks past. In one of them, Black Imitates White becomes White Imitates Black.',
        'One stop is left, in this hall. Go to the head-mounted display.',
      ] },
      { id: 'head-mounted', title: 'Goggles for a surgeon', who: ['Samuel Achilefu'], text: [
        'The model shows a headset on a dummy head. Beside it are the parts for one eye: a lens and the small screen behind it. Press the Put it on button to see what the wearer sees.',
        'The plate names Ivan Sutherland and Bob Sproull, who built the first headset driven by computer graphics, at Harvard University in 1968. Samuel Achilefu was born in Nigeria. His team at Washington University in St. Louis built goggles with a screen for surgeons. A dye makes cancer cells glow on that screen. The goggles were first worn in an operation in 2014.',
        'That was the last stop of the blue line.',
      ] },
      { id: 'end', title: 'The end of the blue line', text: [
        'That is the end of the blue line. It began with a camera at a front door. It ends with goggles in an operating theatre.',
        'Twelve people are named at these ten stops. Each of them is on this line because a source describes that person as Black, as African American, or as born and raised in an African country. The People page gives the source for every name.',
        'The green line on the floor is another tour, about the women in the museum. Leave this tour, and the halls are yours to walk. Thank you for taking it.',
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
