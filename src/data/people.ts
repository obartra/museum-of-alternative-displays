import type { Source } from './schema';
import { src } from './pieces/src';

/**
 * One line of a label's People section: the people who share one deed, and the deed.
 * `she` names the women among them, for the trail of the women.
 * `aside` marks a line whose people did not make the piece: what came before it, or those who described or
 * used a thing that has no known maker. The plate on its block in the walk does not carry their names.
 */
export interface Entry { who: string[]; did: string; she?: string[]; aside?: boolean }

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
      { who: ['Elma Farnsworth'], she: ['Elma Farnsworth'], did: 'Known as Pem. She worked in Philo Farnsworth\'s laboratories, where she made the technical drawings for his experiments. Her face was among the first that his system sent.' },
      { who: ['Marie Van Brittan Brown', 'Albert Brown'], she: ['Marie Van Brittan Brown'], did: 'A nurse in New York and her husband, an electronics technician. Their home security system of 1966 showed the caller on a television monitor, through a camera sliding between four peepholes. Patented in 1969.' },
      { who: ['Mark Dean'], did: 'Engineer at IBM. Two of his three patents on the IBM personal computer are for the adapters that drove its monochrome and its colour monitor.' },
    ],
    sources: [
      src('press', 'Woman who helped invent TV dies at 98, Associated Press (2006)', 'https://www.nbcnews.com/id/wbna12596707'), src('press', 'Obituary of Elma Farnsworth, TWICE (2006)', 'https://www.twice.com/?p=75873'),
      src('archive', 'Marie Van Brittan Brown, Lemelson-MIT Program', 'https://lemelson.mit.edu/resources/marie-van-brittan-brown'),
      src('maker', 'Mark Dean, IBM', 'https://www.ibm.com/history/mark-dean'), src('archive', 'Mark Dean, National Inventors Hall of Fame', 'https://www.invent.org/inductees/mark-dean'),
    ],
  },
  'colour-wheel-television': {
    people: [
      { who: ['Guillermo González Camarena'], did: 'Mexican electrical engineer. He patented the adapter in Mexico in 1940, at the age of 23, and in the United States two years later.' },
      { who: ['A. Frankenstein', 'Werner von Jaworski'], did: 'Applied in Germany in 1904 for a patent on a colour system with a filter wheel.' },
      { who: ['Peter Goldmark'], did: 'Engineer at the Columbia Broadcasting System, which built its own colour-wheel television in the same years.' },
    ],
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
  'numitron': {
    people: [{ who: ['Lewis Latimer'], aside: true, did: 'Not a maker of this display. The lamp filament came first, and in 1882 he patented a way of making the carbon filaments of early electric lamps so that fewer broke in the furnace.' }],
    sources: [
      src('patent', 'Latimer, US patent 252,386', 'https://patents.google.com/patent/US252386'),
      src('archive', 'Bringing light for all, United States Patent and Trademark Office (2024)', 'https://www.uspto.gov/learning-and-resources/journeys-innovation/historical-stories/bringing-light-all'),
    ],
  },
  'plasma-panel': {
    people: [
      { who: ['Donald Bitzer', 'Gene Slottow', 'Robert Willson'], did: 'Invented the panel at the University of Illinois in 1964, for the PLATO teaching system. Willson was a graduate student.' },
      { who: ['Tsutae Shinoda'], did: 'Led the team at Fujitsu in Japan that made the colour plasma panel practical. Its 21-inch colour television went on sale in 1993.' },
    ],
    sources: [src('archive', 'Milestones: Color Plasma Television, 1993, Engineering and Technology History Wiki', 'https://ethw.org/Milestones:Color_Plasma_Television,_1993')],
  },
  'field-emission': {
    people: [
      { who: ['Charles Spindt', 'Kenneth Shoulders', 'Louis Heynick'], did: 'Patented the way of making the microscopic tips, at Stanford Research Institute.' },
      { who: ['Akintunde Akinwande'], did: 'Engineer, educated in Nigeria and at Stanford. He joined Honeywell in 1986 and worked there on thin-film field emitters and displays, and at MIT on arrays of emitters switched one by one.' },
    ],
    sources: [
      src('lab', 'Akintunde Akinwande, MIT Center for International Studies', 'https://cis.mit.edu/our-people/akintunde-akinwande'),
      src('lab', 'Akintunde Ibitayo Akinwande, MIT Technology Licensing Office', 'https://tlo.mit.edu/industry-entrepreneurs/researchers/akintunde-ibitayo-akinwande'),
    ],
  },
  'led-display': {
    people: [
      { who: ['Howard Borden', 'Gerald Pighini'], did: 'Designed the Hewlett-Packard numeric indicator of 1969.' },
      { who: ['Isamu Akasaki', 'Hiroshi Amano', 'Shuji Nakamura'], did: 'Made efficient blue LEDs in Japan. Full-colour screens followed, and so did the 2014 Nobel Prize in Physics.' },
    ],
    sources: [src('archive', 'The Nobel Prize in Physics 2014', 'https://www.nobelprize.org/prizes/physics/2014/summary/')],
  },
  'oled': { people: [{ who: ['Ching Wan Tang', 'Steven Van Slyke'], did: 'Made the first efficient OLED at Eastman Kodak, published in 1987. Tang, born in Hong Kong, had set out to make solar cells.' }] },
  'microled': { people: [{ who: ['Hongxing Jiang', 'Jingyu Lin'], she: ['Jingyu Lin'], did: 'Physicists and a married couple. They made the first microLEDs at Kansas State University in 2000.' }] },
  'quantum-dot': {
    people: [
      { who: ['Vicki Colvin', 'M. C. Schlamp', 'Paul Alivisatos'], she: ['Vicki Colvin'], did: 'Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994.' },
      { who: ['Aleksey Yekimov'], did: 'Russian physicist. He showed in coloured glass that the size of a tiny crystal sets its colour.' },
      { who: ['Louis Brus'], did: 'Proved the same effect in particles floating freely in a liquid.' },
      { who: ['Moungi Bawendi'], did: 'American, French and Tunisian chemist. In 1993 he found the way to make dots of almost perfect quality. The three shared the 2023 Nobel Prize in Chemistry.' },
      { who: ['Xiaogang Peng', 'Yizheng Jin'], did: 'At Zhejiang University in 2014 they made a quantum-dot diode from liquids, layer on layer. It glowed deep red, turned a fifth of its electrons into light and was rated for over 100,000 hours.' },
    ],
    sources: [
      src('press', 'Nobel Chemistry Prize 2023, Tecnológico de Monterrey', 'https://tecscience.tec.mx/en/tech/nobel-chemistry-prize-2023/'),
      src('paper', 'Dai, Jin, Peng and others, Solution-processed, high-performance light-emitting diodes based on quantum dots, Nature (2014)', 'https://www.nature.com/articles/nature13829'),
      src('press', 'Stender, Insulator triggered charge balance for high-performance QLEDs, MRS Bulletin (2015)', 'https://link.springer.com/article/10.1557/mrs.2014.314'),
    ],
  },
  'thin-film-el': {
    people: [
      { who: ['Tuomo Suntola'], did: 'Finnish physicist. In 1974 he devised atomic layer deposition, which grows a film one layer of atoms at a time, to make these panels.' },
      { who: ['Dawon Kahng'], did: 'Born in Seoul. In 1968 at Bell Laboratories he showed that thin films of compounds like zinc sulphide glow when fast electrons strike metal atoms placed in them. These panels make light that way.' },
    ],
    sources: [
      src('paper', 'Kahng, Electroluminescence of rare-earth and transition metal molecules in II-VI compounds via impact excitation, Applied Physics Letters (1968)', 'https://doi.org/10.1063/1.1652574'),
      src('paper', 'Chase, Hepplewhite, Krupka and Kahng, Electroluminescence of ZnS Lumocen devices containing rare-earth and transition-metal fluorides, Journal of Applied Physics (1969)', 'https://doi.org/10.1063/1.1658025'),
      src('archive', 'Dawon Kahng, National Inventors Hall of Fame', 'https://www.invent.org/inductees/dawon-kahng'),
    ],
  },
  'flexible-display': { people: [{ who: ['Nicholas Sheridon'], did: 'Made Gyricon, the first flexible electronic paper, at the Xerox Palo Alto Research Center.' }] },
  'camera-obscura': {
    people: [
      { who: ['Mozi'], aside: true, did: 'Taught in China about 430 BCE, and the Mohist school is named after him. Its later members wrote the Canons, which hold an early account of a picture turned over by a small hole.' },
      { who: ['Ibn al-Haytham'], aside: true, did: 'Born in Basra about 965, died in Cairo about 1040. In a dark chamber he studied how light passes through an opening, and how the sun in eclipse looks through a small hole.' },
      { who: ['Gemma Frisius'], aside: true, did: 'Physician and instrument maker. He watched the solar eclipse of 24 January 1544 at Leuven in a darkened room. His book of 1545 has the oldest known printed drawing of one.' },
      { who: ['Daniele Barbaro'], aside: true, did: 'Venetian nobleman. In 1568 he described a spectacle lens set in the hole, and a cover over part of the lens to make the picture clearer.' },
      { who: ['Johannes Kepler'], aside: true, did: 'Was the first to use the name camera obscura, in 1604. He made himself a portable dark tent with a lens, for sketching landscapes.' },
    ],
    note: 'No inventor is known. The Mohist text speaks of the turned shadow and the crossing light, and does not describe a chamber.',
    sources: [
      src('reference', 'Mohism, Stanford Encyclopedia of Philosophy', 'https://plato.stanford.edu/entries/mohism/'),
      src('reference', 'Ibn al-Haytham (Wikipedia)', 'https://en.wikipedia.org/wiki/Ibn_al-Haytham'),
    ],
  },
  'shadow-play': {
    people: [
      { who: ['Ibn Daniyal'], aside: true, did: 'Eye doctor, born in Mosul in 1248. He settled in Cairo and wrote three shadow plays there, the oldest texts that survive for the Arabic shadow theatre.' },
      { who: ['François Dominique Séraphin'], aside: true, did: 'Showed shadow plays at Versailles from 1771 and moved his theatre to Paris in 1784. In France such shows were advertised as ombres chinoises, Chinese shadows.' },
      { who: ['Henri Rivière'], aside: true, did: 'Worked with up to twenty assistants on the shadow plays of the cabaret Le Chat Noir in Paris, which staged 45 of them between 1885 and 1896. From 1887 the figures were of zinc.' },
      { who: ['Kara Walker'], she: ['Kara Walker'], aside: true, did: 'American artist, known for silhouettes cut from black paper. Since 2004 she has made films in which jointed paper puppets, worked by hand on sticks, play out stories of slavery in America.' },
    ],
    note: 'No inventor is recorded for wayang, for the Chinese shadow theatre or for Karagöz. In Java the craft has been handed down within families of puppeteers, musicians and puppet makers.',
    sources: [
      src('reference', 'Ibn Daniel, World Encyclopedia of Puppetry Arts, UNIMA', 'https://wepa.unima.org/en/?p=773'),
      src('reference', 'Muḥammad Ibn Dāniyāl (Wikipedia)', 'https://en.wikipedia.org/wiki/Mu%E1%B8%A5ammad_Ibn_D%C4%81niy%C4%81l'),
      src('archive', 'Kara Walker, Shadow puppet from Testimony: Narrative of a Negress Burdened by Good Intentions (2004), Museum of Modern Art', 'https://www.moma.org/collection/works/97669'),
      src('archive', 'Kara Walker, Fall Frum Grace, Miss Pipi\'s Blue Tale (2011), Sammlung Goetz', 'https://online.sammlung-goetz.de/en/work/fall-frum-grace-miss-pipis-blue-tale/'),
    ],
  },
  'liquid-crystal': {
    people: [
      { who: ['Martin Schadt', 'Wolfgang Helfrich'], did: 'Filed the patent for the twisted cell at Hoffmann-La Roche in Switzerland on 4 December 1970.' },
      { who: ['James Fergason'], did: 'Filed a similar patent in the United States in 1971. The dispute over who came first was settled out of court.' },
      { who: ['George Heilmeier'], did: 'Built an earlier kind of liquid crystal display at RCA in the 1960s, which worked by scattering light.' },
      { who: ['Sivaramakrishna Chandrasekhar', 'B. K. Sadashiva', 'K. A. Suresh'], did: 'In 1977 at the Raman Research Institute in Bangalore they found liquid crystals whose molecules are discs, not rods. Films of such liquid crystals later widened the angle a screen can be read from.' },
      { who: ['Mohamed Atalla', 'Dawon Kahng'], did: 'Showed the first working MOS transistor at Bell Laboratories in 1960. The thin-film transistor behind every cell works in a similar way. Atalla was born in Port Said, Kahng in Seoul.' },
    ],
    sources: [
      src('paper', 'Chandrasekhar, Sadashiva and Suresh, Liquid crystals of disc-like molecules, Pramana (1977)', 'https://www.ias.ac.in/article/fulltext/pram/009/05/0471-0480'),
      src('press', 'Suresh, Ground-breaking discoveries in liquid crystals, Nature India (2024)', 'https://www.nature.com/articles/d44151-023-00176-z'),
      src('paper', 'Shinagawa, Novel Optical Compensation Film for TFT-LCDs Using Discotic Liquid Crystal Aligned Obliquely, Hyomen Kagaku (1998)', 'https://www.jstage.jst.go.jp/article/jsssj1980/19/5/19_5_333/_article/-char/ja'),
      src('archive', '1960: Metal Oxide Semiconductor (MOS) Transistor Demonstrated, Computer History Museum', 'https://www.computerhistory.org/siliconengine/metal-oxide-semiconductor-mos-transistor-demonstrated/'),
      src('archive', 'Martin (John) M. Atalla, National Inventors Hall of Fame', 'https://www.invent.org/inductees/martin-john-m-atalla'),
      src('reference', 'Mohamed M. Atalla (Wikipedia)', 'https://en.wikipedia.org/wiki/Mohamed_M._Atalla'),
      src('archive', 'Dawon Kahng, National Inventors Hall of Fame', 'https://www.invent.org/inductees/dawon-kahng'),
      src('paper', 'Kuo, Thin Film Transistor Technology: Past, Present, and Future, The Electrochemical Society Interface (2013)', 'https://www.electrochem.org/dl/interface/spr/spr13/spr13_p055_061.pdf'),
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
    sources: [src('press', 'When Laser Science Was Far Out, Science Friday (2016)', 'https://www.sciencefriday.com/segments/when-laser-science-was-far-out/'), src('archive', 'Laserimage (1972), Science on Screen', 'https://scienceonscreen.org/films/laserimage')],
  },
  'projection-mapping': {
    people: [
      { who: ['Leota Toombs'], she: ['Leota Toombs'], did: 'Artist at WED Enterprises, the Disney design workshop. Her filmed face is projected onto a blank head inside the crystal ball of the Haunted Mansion.' },
      { who: ['Michael Naimark'], did: 'Artist. For Displacements he filmed a room, painted it white and projected the film back onto it.' },
      { who: ['Ramesh Raskar', 'Greg Welch', 'Kok-Lim Low', 'Deepak Bandyopadhyay'], did: 'Described the technique in 2001 under the name shader lamps.' },
      { who: ['Lanny Smoot'], did: 'Disney research fellow with more than 100 patents. He is credited with making Madame Leota, the head in the crystal ball of the Haunted Mansion, float in her séance room.' },
    ],
    sources: [
      src('archive', 'Leota Toombs Thomas, Disney Legends, D23', 'https://d23.com/walt-disney-legend/leota-toombs-thomas/'),
      src('maker', 'Lanny Smoot to Be the First Disney Imagineer Inducted into the National Inventors Hall of Fame, The Walt Disney Company (2024)', 'https://thewaltdisneycompany.com/news/lanny-smoot-to-be-the-first-disney-imagineer-inducted-into-the-national-inventors-hall-of-fame/'),
      src('archive', 'Lanny Smoot, National Inventors Hall of Fame', 'https://www.invent.org/inductees/lanny-smoot'),
    ],
  },
  'gyricon': { people: [{ who: ['Nicholas Sheridon'], did: 'Invented the sheet of turning beads at the Xerox Palo Alto Research Center in the 1970s.' }] },
  'electrophoretic-ink': {
    people: [
      { who: ['Barrett Comiskey', 'J. D. Albert', 'Joseph Jacobson'], did: 'Developed the ink in capsules at the MIT Media Lab in 1996.' },
      { who: ['John Rogers', 'Zhenan Bao'], she: ['Zhenan Bao'], did: 'At Bell Laboratories in 2001 they stamped 256 plastic transistors onto a plastic sheet, one for each dot, and laid this ink over them: electronic paper that bends. Bao, a chemist, designs conducting plastics.' },
    ],
    sources: [
      src('paper', 'Rogers, Bao and others, Paper-like electronic displays: large-area rubber-stamped plastic sheets of electronics and microencapsulated electrophoretic inks, Proceedings of the National Academy of Sciences (2001)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC33123/'),
      src('lab', 'Zhenan Bao, Stanford University', 'https://profiles.stanford.edu/zhenan-bao'),
    ],
  },
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
  'electrochromic': {
    people: [
      { who: ['S. K. Deb'], did: 'Published the work on tungsten oxide films, in 1969, from which electrochromic displays grew.' },
      { who: ['Paula Hammond', 'Dean DeLongchamp'], she: ['Paula Hammond'], did: 'At MIT they built electrochromic films one molecular layer at a time, which switched faster and with more contrast than films made in other ways. DeLongchamp\'s thesis of 2003 points to a full-colour display.' },
    ],
    sources: [
      src('paper', 'DeLongchamp, Engineering the electrochromism and ion conduction of layer-by-layer assembled films, thesis supervised by Paula Hammond, Massachusetts Institute of Technology (2003)', 'https://dspace.mit.edu/handle/1721.1/29995'),
      src('archive', 'Paula Hammond, Science History Institute', 'https://www.sciencehistory.org/education/scientific-biographies/paula-hammond/'),
    ],
  },
  'peppers-ghost': {
    people: [
      { who: ['Henry Dircks'], did: 'Engineer who devised the illusion.' },
      { who: ['John Henry Pepper'], did: 'Staged it at the Royal Polytechnic Institution in London in 1862, and it took his name.' },
    ],
  },
  'illusion-transmitter': {
    people: [{ who: ['Valerie Thomas'], she: ['Valerie Thomas'], did: 'Born in Maryland in 1943. One of only two women to major in physics at Morgan State University, she joined NASA as a data analyst and invented the illusion transmitter there.' }],
    sources: [src('press', 'Valerie Thomas, Biography.com', 'https://www.biography.com/scientists/valerie-thomas')],
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
  'stereoscope': {
    people: [
      { who: ['Charles Wheatstone'], did: 'Published the stereoscope in London in 1838, months before photography was announced.' },
      { who: ['Kenneth Dunkley'], did: 'Physicist in Pennsylvania. His patent of 1989 is for viewing glasses with no lenses: two pinholes and two empty frames. It says they give an ordinary flat picture the look of depth.' },
      { who: ['Charles Harrison'], did: 'Industrial designer in Chicago. In 1958 he redesigned the View-Master, a stereoscope for the hand, in light moulded plastic, and it went from a photographer\'s accessory to a children\'s toy.' },
    ],
    sources: [
      src('patent', 'Dunkley, US patent 4,810,057', 'https://patents.google.com/patent/US4810057'),
      src('archive', 'Kenneth Dunkley, National Business League', 'https://nationalbusinessleague.org/kenneth-dunkley/'),
      src('archive', 'Charles Harrison, View-Master (model G), Museum of Modern Art', 'https://www.moma.org/collection/works/205547'),
      src('archive', 'Remembering Charles Harrison, Cooper Hewitt, Smithsonian Design Museum (2018)', 'https://www.cooperhewitt.org/2018/12/11/remembering-charles-harrison-1931-2018/'),
    ],
  },
  'parallax-barrier': {
    people: [
      { who: ['Frederic Ives'], did: 'Made the first parallax stereogram, in the United States in 1901.' },
      { who: ['Auguste Berthier'], did: 'Described the principle in 1896.' },
    ],
  },
  'lenticular': {
    people: [
      { who: ['Walter Hess'], did: 'Eye doctor in Rapperswil, Switzerland. He filed his patent for stereoscopic pictures under a sheet of small lenses in 1912, and in 1949 won a Nobel Prize for his work on the brain.' },
      { who: ['Hank Willis Thomas'], did: 'Artist in New York. His lenticular prints carry text that changes as the visitor walks past. In one, Black Imitates White becomes White Imitates Black.' },
    ],
    sources: [
      src('patent', 'Hess, US patent 1,128,979', 'https://patents.google.com/patent/US1128979'),
      src('paper', 'C. W. Hess, Walter R. Hess, Schweizer Archiv für Neurologie und Psychiatrie (2008)', 'https://mdpi-res.com/d_attachment/sanpp/sanpp-159-00255/article_deploy/sanpp-159-00255.pdf'),
      src('archive', 'Hank Willis Thomas, They are Us, Us is Them and Impossibly, SFO Museum', 'https://www.sfomuseum.org/public-art/public-collection/left-they-are-us-us-them-and-right-impossibly'),
      src('archive', 'Docent\'s Corner: Hank Willis Thomas, Blowing Rock Art and History Museum', 'https://www.blowingrockmuseum.org/athome/docent-corner-hank-willis-thomas'),
      src('archive', 'Hank Willis Thomas, Art21', 'https://art21.org/artist/hank-willis-thomas/'),
    ],
  },
  'integral-imaging': { people: [{ who: ['Gabriel Lippmann'], did: 'Proposed it in France in 1908 and called it integral photography.' }] },
  'holography': {
    people: [
      { who: ['Dennis Gabor'], did: 'Invented holography in 1948 at British Thomson-Houston in Rugby, England.' },
      { who: ['Emmett Leith', 'Juris Upatnieks'], did: 'Published the off-axis method of recording holograms in 1962.' },
      { who: ['Margaret Benyon'], she: ['Margaret Benyon'], did: 'Painter, born in Birmingham and raised in Kenya. She made holograms as art from 1968 and showed them a year later.' },
      { who: ['Stephen Benton', 'Mary Lou Jepsen'], she: ['Mary Lou Jepsen'], did: "The first holographic video display was built in Benton's group at the MIT Media Lab in 1989. Jepsen's thesis of that year sets out its design." },
      { who: ['Ali Javan'], did: 'Born in Tehran. At Bell Laboratories in 1960 he, William Bennett and Don Herriott ran the first gas laser, the first to give a steady beam. Laser light is what holograms are made with.' },
      { who: ['Nasser Peyghambarian', 'Pierre-Alexandre Blanche'], did: 'At the University of Arizona in 2010 their group showed a rewritable hologram: a sheet of polymer took a new colour picture every two seconds. In 2008 it took four minutes.' },
    ],
    sources: [
      src('paper', 'Jepsen, Holographic Video: Design and Implementation of a Display System, MIT (1989)', 'http://hdl.handle.net/1721.1/14173'),
      src('lab', 'The Mark-I Holographic Video Display, MIT Media Lab', 'https://www.media.mit.edu/spi/HVmark1.htm'),
      src('archive', 'Margaret Benyon, Center for the Holographic Arts', 'https://holocenter.org/margaret-benyon'),
      src('reference', 'Margaret Benyon (Wikipedia)', 'https://en.wikipedia.org/wiki/Margaret_Benyon'),
      src('archive', 'Ali Javan, Lemelson-MIT Program', 'https://lemelson.mit.edu/resources/ali-javan'),
      src('archive', 'Hologram, Toy Train, National Museum of American History', 'https://www.si.edu/object/hologram-toy-train%3Anmah_1448340'),
      src('paper', 'Blanche, Peyghambarian and others, Holographic three-dimensional telepresence using large-area photorefractive polymer, Nature (2010)', 'https://www.nature.com/articles/nature09521'),
      src('press', 'Star Wars telepresence tantalisingly close, Physics World (2010)', 'https://physicsworld.com/a/star-wars-telepresence-tantalisingly-close/'),
    ],
  },
  'head-mounted': {
    people: [
      { who: ['Ivan Sutherland', 'Bob Sproull'], did: 'Built the first headset driven by computer graphics, at Harvard University in 1968.' },
      { who: ['Samuel Achilefu'], did: 'Born in Nigeria. His team at Washington University in St. Louis built goggles with a screen for surgeons: a dye makes cancer cells glow on it. First worn in an operation in 2014.' },
    ],
    sources: [
      src('press', 'Special glasses help surgeons ‘see’ cancer, Washington University in St. Louis (2014)', 'https://source.washu.edu/2014/02/special-glasses-help-surgeons-ee-cancer/'),
      src('press', 'Washington People: Samuel Achilefu, Washington University in St. Louis (2016)', 'https://source.washu.edu/2016/02/washington-people-samuel-achilefu/'),
    ],
  },
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
