import type { Source } from './schema';
import { src } from './pieces/src';

/**
 * One line of a label's People section: the people who share one deed, and the deed.
 * `she` names the women among them, for the trail on the People page.
 */
export interface Entry { who: string[]; did: string; she?: string[] }

/** The people of one piece. `note` says where credit is shared or contested. `sources` are added to the piece's own. */
export interface Credit { people: Entry[]; note?: string; sources?: Source[] }

/** Who made each piece. A piece with no named maker has no entry. */
export const people: Record<string, Credit> = {
  'split-flap': {
    people: [
      { who: ['Gino Valle'], did: 'Designer credited with the form of the boards made by Solari.' },
      { who: ['John Myer'], did: 'Belgian inventor credited, with Valle, for the Solari board.' },
    ],
    note: 'No inventor is recorded for the mechanism itself. The earliest board on record went up at Liège station in 1956.',
  },
  'flip-disc': { people: [{ who: ['Kenyon Taylor'], did: 'Devised the flip-disc at Ferranti-Packard in Canada, for Trans-Canada Air Lines.' }] },
  'mechanical-television': {
    people: [
      { who: ['Paul Nipkow'], did: 'Patented the scanning disc in Germany in the 1880s.' },
      { who: ['John Logie Baird'], did: 'Gave the first public demonstration of television, in London in 1926.' },
    ],
  },
  'kinetic-mirror': {
    people: [{ who: ['Daniel Rozin'], did: 'Artist, born in Jerusalem. He built Wooden Mirror in 1999 and has since made mirrors of chrome balls, pegs and toy penguins.' }],
    sources: [src('reference', 'Daniel Rozin, Wikidata', 'https://www.wikidata.org/wiki/Q5220788')],
  },
  'shape-display': {
    people: [
      { who: ['Daniel Leithinger', 'Sean Follmer'], did: 'Built the pin table inFORM in the Tangible Media Group at the MIT Media Lab.' },
      { who: ['Hiroshi Ishii'], did: 'Leads the Tangible Media Group, where the pin tables Relief and inFORM were built.' },
    ],
  },
  'braille-display': {
    people: [
      { who: ['Oleg Tretiakoff', 'Andrée Tretiakoff'], she: ['Andrée Tretiakoff'], did: 'Patented braille dots raised by piezoelectric reeds. They filed first in France, in 1974.' },
      { who: ['Klaus Peter Schönherr'], did: 'Invented a piezoelectric braille module in Germany in 1975.' },
      { who: ['James Bryce'], did: 'Developed the earliest working braille display on record, at IBM around 1950.' },
    ],
    sources: [
      src('patent', 'Tretiakoff and Tretiakoff, US patent 4,044,350', 'https://patents.google.com/patent/US4044350'),
      src('archive', 'A Brief History of the Refreshable Braille Display, American Printing House for the Blind', 'https://aph.org/blog/blindness-history-basics-a-brief-history-of-the-refreshable-braille-display/'),
      src('archive', 'A timeline of braille, Future Reflections, National Federation of the Blind', 'https://nfb.org/images/nfb/publications/fr/fr45/2/fr450210.htm'),
    ],
  },
  'drone-show': {
    people: [{ who: ['Horst Hörtner'], did: 'Director of the Ars Electronica Futurelab in Linz. His team and Intel flew 100 lit drones near Hamburg in November 2015.' }],
    sources: [
      src('archive', 'Most drones airborne simultaneously, Guinness World Records (2016)', 'https://guinnessworldrecords.com/news/2016/1/intel-stuns-during-ces-keynote-with-record-for-most-drones-airborne-simultaneousl-411677'),
      src('lab', 'Drone 100: A World Record with 100 Points, Ars Electronica', 'https://ars.electronica.art/aeblog/?p=20615'),
    ],
  },
  'cathode-ray-tube': {
    people: [
      { who: ['Ferdinand Braun'], did: 'Built the first cathode ray tube, in Germany in 1897.' },
      { who: ['Kenjiro Takayanagi'], did: 'Showed a television receiver built on a cathode ray tube, in Japan in 1926.' },
      { who: ['Philo Farnsworth'], did: 'Sent the first all-electronic television picture, in San Francisco in 1927.' },
      { who: ['Elma Farnsworth'], she: ['Elma Farnsworth'], did: 'Known as Pem. She worked beside Philo Farnsworth in his laboratories, and her face was among the first that his system sent.' },
    ],
    sources: [src('press', 'Woman who helped invent TV dies at 98, Associated Press (2006)', 'https://www.nbcnews.com/id/wbna12596707')],
  },
  'storage-tube': {
    people: [
      { who: ['Robert H. Anderson'], did: 'Developed the storage tube at Tektronix.' },
      { who: ['Andrew Haeff'], did: 'Built the Memory Tube in the 1940s, the ancestor that Tektronix turned into a screen.' },
    ],
  },
  'nixie-tube': {
    people: [{ who: ['David Hagelbarger'], did: 'The engineer most often named as its inventor.' }],
    note: 'Credit for the invention is not clear. National Union sold a similar tube, the Inditron, in 1954, and patents for numerals in glow lamps go back to the 1930s.',
  },
  'vacuum-fluorescent': {
    people: [
      { who: ['Tadashi Nakamura'], did: 'Founder of Ise Electronics in Japan. He invented the display and put it on sale in 1967.' },
      { who: ['Tadashi Sasaki'], did: 'Led calculator development at Hayakawa Electric, now Sharp, and asked Nakamura for a low-voltage display.' },
    ],
  },
  'plasma-panel': {
    people: [
      { who: ['Donald Bitzer', 'Gene Slottow', 'Robert Willson'], did: 'Invented the panel at the University of Illinois in 1964, for the PLATO teaching system. Willson was a graduate student.' },
      { who: ['Tsutae Shinoda'], did: 'Led the team at Fujitsu in Japan that made the colour plasma panel practical. Its 21-inch colour television went on sale in 1993.' },
    ],
    sources: [src('archive', 'Milestones: Color Plasma Television, 1993, Engineering and Technology History Wiki', 'https://ethw.org/Milestones:Color_Plasma_Television,_1993')],
  },
  'field-emission': { people: [{ who: ['Charles Spindt', 'Kenneth Shoulders', 'Louis Heynick'], did: 'Patented the way of making the microscopic tips, at Stanford Research Institute.' }] },
  'led-display': {
    people: [
      { who: ['Howard Borden', 'Gerald Pighini'], did: 'Designed the Hewlett-Packard numeric indicator of 1969.' },
      { who: ['Isamu Akasaki', 'Hiroshi Amano', 'Shuji Nakamura'], did: 'Made efficient blue LEDs in Japan. Full-colour screens followed, and so did the 2014 Nobel Prize in Physics.' },
    ],
    sources: [src('archive', 'The Nobel Prize in Physics 2014', 'https://www.nobelprize.org/prizes/physics/2014/summary/')],
  },
  'oled': { people: [{ who: ['Ching Wan Tang', 'Steven Van Slyke'], did: 'Made the first efficient OLED at Eastman Kodak, published in 1987. Tang, born in Hong Kong, had set out to make solar cells.' }] },
  'microled': { people: [{ who: ['Hongxing Jiang', 'Jingyu Lin'], she: ['Jingyu Lin'], did: 'Physicists and a married couple. They made the first microLEDs at Kansas State University in 2000.' }] },
  'thin-film-el': { people: [{ who: ['Tuomo Suntola'], did: 'Finnish physicist. In 1974 he devised atomic layer deposition, which grows a film one layer of atoms at a time, to make these panels.' }] },
  'flexible-display': { people: [{ who: ['Nicholas Sheridon'], did: 'Made Gyricon, the first flexible electronic paper, at the Xerox Palo Alto Research Center.' }] },
  'liquid-crystal': {
    people: [
      { who: ['Martin Schadt', 'Wolfgang Helfrich'], did: 'Filed the patent for the twisted cell at Hoffmann-La Roche in Switzerland on 4 December 1970.' },
      { who: ['James Fergason'], did: 'Filed a similar patent in the United States in 1971. The dispute over who came first was settled out of court.' },
      { who: ['George Heilmeier'], did: 'Built an earlier kind of liquid crystal display at RCA in the 1960s, which worked by scattering light.' },
    ],
  },
  'micromirror': { people: [{ who: ['Larry Hornbeck'], did: 'Invented the mirror chip at Texas Instruments in 1987.' }] },
  'eidophor': { people: [{ who: ['Fritz Fischer'], did: 'Conceived the projector at ETH Zurich in 1939. A prototype was shown in 1943.' }] },
  'scanned-laser': {
    people: [
      { who: ['Joseph Ostoja-Kotkowski'], did: 'Staged an early laser show, Sound and Image, at the Adelaide Festival of Arts in 1968.' },
      { who: ['Elsa Garmire'], she: ['Elsa Garmire'], did: 'Physicist at the California Institute of Technology. Her laser images, filmed in 1972, became the model for Laserium.' },
      { who: ['Ivan Dryer'], did: 'Filmmaker who worked with Garmire and opened Laserium at Griffith Observatory in Los Angeles in 1973.' },
    ],
    sources: [src('press', 'Hecht, Elsa Garmire, SPIE Photonics Focus (2021)', 'https://lux.spie.org/news/photonics-focus/novdec-2021/elsa-garmire-pioneering-laser-physicist-helped-launch-laser-light-shows')],
  },
  'projection-mapping': {
    people: [
      { who: ['Leota Toombs'], she: ['Leota Toombs'], did: 'Artist at WED Enterprises, the Disney design workshop. Her filmed face is projected onto a blank head inside the crystal ball of the Haunted Mansion.' },
      { who: ['Michael Naimark'], did: 'Artist. For Displacements he filmed a room, painted it white and projected the film back onto it.' },
      { who: ['Ramesh Raskar', 'Greg Welch', 'Kok-Lim Low', 'Deepak Bandyopadhyay'], did: 'Described the technique in 2001 under the name shader lamps.' },
    ],
    sources: [src('archive', 'Leota Toombs Thomas, Disney Legends, D23', 'https://d23.com/walt-disney-legend/leota-toombs-thomas/')],
  },
  'gyricon': { people: [{ who: ['Nicholas Sheridon'], did: 'Invented the sheet of turning beads at the Xerox Palo Alto Research Center in the 1970s.' }] },
  'electrophoretic-ink': { people: [{ who: ['Barrett Comiskey', 'J. D. Albert', 'Joseph Jacobson'], did: 'Developed the ink in capsules at the MIT Media Lab in 1996.' }] },
  'cholesteric-lcd': { people: [{ who: ['Deng-Ke Yang', 'J. William Doane'], did: 'Made the reflective display that keeps its picture, at the Liquid Crystal Institute of Kent State University.' }] },
  'electrowetting': {
    people: [
      { who: ['Gerardo Beni', 'Susan Hackwood'], she: ['Susan Hackwood'], did: 'Proposed the display at Bell Laboratories in 1981 and gave the effect its name. Beni was born in Florence and Hackwood in England.' },
      { who: ['Robert Hayes', 'Johan Feenstra'], did: 'Made it work at video speed at Philips Research in Eindhoven in 2003.' },
    ],
    sources: [
      src('patent', 'Beni and Hackwood, US patent 4,417,786', 'https://patents.google.com/patent/US4417786'),
      src('reference', 'Susan Hackwood (Wikipedia)', 'https://en.wikipedia.org/wiki/Susan_Hackwood'),
      src('reference', 'Gerardo Beni, Wikidata', 'https://www.wikidata.org/wiki/Q5550233'),
    ],
  },
  'interferometric-modulator': { people: [{ who: ['Mark Miles'], did: 'Invented the modulator and founded Etalon, then Iridigm, to develop it. Qualcomm bought Iridigm in 2004.' }] },
  'electrochromic': { people: [{ who: ['S. K. Deb'], did: 'Published the work on tungsten oxide films, in 1969, from which electrochromic displays grew.' }] },
  'peppers-ghost': {
    people: [
      { who: ['Henry Dircks'], did: 'Engineer who devised the illusion.' },
      { who: ['John Henry Pepper'], did: 'Staged it at the Royal Polytechnic Institution in London in 1862, and it took his name.' },
    ],
  },
  'fog-screen': {
    people: [{ who: ['Karri Palovuori', 'Ismo Rakkolainen'], did: 'Developed the fog screen that people can walk through, at Tampere University of Technology in 2002.' }],
    note: 'Projection onto fountains and curtains of water is older. A patent for an ornamental fountain screen dates from 1899.',
  },
  'persistence-of-vision': {
    people: [{ who: ['Joseph Plateau'], did: 'Used the effect in his spinning picture discs of 1832.' }],
    note: 'Persistence of vision is the traditional name, not a full explanation. The way the eye and brain merge flicker and perceive motion is more complex. No first maker of the spinning LED kind is agreed.',
  },
  'swept-volume': {
    people: [
      { who: ['Max Hirsch'], did: 'Patented a swept-screen display in 1961. He called it a generescope and had air traffic control in mind.' },
      { who: ['Gregg Favalora'], did: 'Founder of Actuality Systems, which put the Perspecta display on sale in 2002.' },
    ],
  },
  'static-volume': { people: [{ who: ['Elizabeth Downing', 'Lambertus Hesselink', 'John Ralston', 'Roger Macfarlane'], she: ['Elizabeth Downing'], did: 'Drew coloured points of light inside a block of glass with crossed infrared beams. The work was published from Stanford University in 1996, with Downing as first author.' }] },
  'optical-trap': { people: [{ who: ['Daniel Smalley'], did: 'Leads the group at Brigham Young University that built the display, published in 2018.' }] },
  'acoustic-levitation': { people: [{ who: ['Ryuji Hirayama', 'Diego Martinez Plasencia', 'Nobuyuki Masuda', 'Sriram Subramanian'], did: 'Built the display at the University of Sussex and published it in 2019.' }] },
  'laser-plasma': { people: [{ who: ['Yoichi Ochiai'], did: 'Led the version of 2015, which uses far shorter laser pulses.' }] },
  'stereoscope': { people: [{ who: ['Charles Wheatstone'], did: 'Published the stereoscope in London in 1838, months before photography was announced.' }] },
  'parallax-barrier': {
    people: [
      { who: ['Frederic Ives'], did: 'Made the first parallax stereogram, in the United States in 1901.' },
      { who: ['Auguste Berthier'], did: 'Described the principle in 1896.' },
    ],
  },
  'lenticular': { people: [{ who: ['Walter Hess'], did: 'Patented a sheet of cylindrical lenses in 1912.' }] },
  'integral-imaging': { people: [{ who: ['Gabriel Lippmann'], did: 'Proposed it in France in 1908 and called it integral photography.' }] },
  'holography': {
    people: [
      { who: ['Dennis Gabor'], did: 'Invented holography in 1948 at British Thomson-Houston in Rugby, England.' },
      { who: ['Emmett Leith', 'Juris Upatnieks'], did: 'Published the off-axis method of recording holograms in 1962.' },
      { who: ['Margaret Benyon'], she: ['Margaret Benyon'], did: 'Painter, born in Birmingham and raised in Kenya. She made holograms as art from 1968 and showed them a year later.' },
      { who: ['Stephen Benton', 'Mary Lou Jepsen'], she: ['Mary Lou Jepsen'], did: "The first holographic video display was built in Benton's group at the MIT Media Lab in 1989. Jepsen's thesis of that year sets out its design." },
    ],
    sources: [
      src('paper', 'Jepsen, Holographic Video: Design and Implementation of a Display System, MIT (1989)', 'http://hdl.handle.net/1721.1/14173'),
      src('lab', 'The Mark-I Holographic Video Display, MIT Media Lab', 'https://www.media.mit.edu/spi/HVmark1.htm'),
      src('archive', 'Margaret Benyon, Center for the Holographic Arts', 'https://holocenter.org/margaret-benyon'),
      src('reference', 'Margaret Benyon (Wikipedia)', 'https://en.wikipedia.org/wiki/Margaret_Benyon'),
    ],
  },
  'head-mounted': { people: [{ who: ['Ivan Sutherland', 'Bob Sproull'], did: 'Built the first headset driven by computer graphics, at Harvard University in 1968.' }] },
  'retinal-display': { people: [{ who: ['Kazuo Yoshinaka'], did: 'Proposed the display at Nippon Electric in Japan in 1986.' }] },
  'head-up': { people: [{ who: ['J. M. Naish'], did: 'Worked out the system first called a head-up display, at Farnborough from 1956.' }] },
};

/** Every name in the collection, each once, with the first piece it appears on. */
export const everyone = (): { name: string; piece: string; she: boolean }[] => {
  const seen = new Map<string, { name: string; piece: string; she: boolean }>();
  for (const [piece, c] of Object.entries(people)) for (const e of c.people) for (const name of e.who) {
    if (!seen.has(name)) seen.set(name, { name, piece, she: !!e.she?.includes(name) });
  }
  return [...seen.values()];
};
