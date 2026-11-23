import type { Source } from './schema';
import { src } from './pieces/src';
import { auditSources } from './label-sources';

/**
 * One line of a label's People section: the people who share one deed, and the deed.
 * `she` names the women among them, for the trail of the women.
 * `aside` marks a line whose people did not make the piece: what came before it, or those who described or
 * used a thing that has no known maker, or someone whose part in it the sources dispute. The plate on its block
 * in the walk does not carry their names.
 */
export interface Entry { who: string[]; did: string; she?: string[]; aside?: boolean }

/** The people of one piece. `note` says where credit is shared or contested. `sources` are added to the piece's own. */
export interface Credit { people: Entry[]; note?: string; sources?: Source[] }

/** Who made each piece. A piece with no named maker has no entry. */
export const people: Record<string, Credit> = {
  'split-flap': {
    people: [
      { who: ['Gino Valle'], did: 'Designer credited with the form of the boards made by Solari.' },
      { who: ['John Myer'], did: 'Worked with Valle on the Cifra 5, Solari\'s flap clock of the mid 1950s. Finestre sull\'Arte calls him a Belgian inventor and gives him the idea of its two numbered rollers.' },
    ],
    note: 'No inventor is recorded for the mechanism itself. The earliest board on record went up at Liège station in 1956. Finestre sull\'Arte says Solari\'s numerals first changed in station clocks, such as one at Florence\'s Santa Maria Novella from the 1930s. The sources found tie Valle and Myer to the clock and Valle to the later boards. None ties either of them to Liège.',
    sources: [
      src('archive', 'Cifra 5 Electro-mechanical clock, ADI Design Museum', 'https://www.adidesignmuseum.org/en/collection/cifra-5-electro-mechanical-clock/'),
      src('press', 'The Cifra 5 electromechanical clock: the Solari revolution, Finestre sull\'Arte', 'https://www.finestresullarte.info/en/works-and-artists/the-cifra-5-electromechanical-clock-the-solari-revolution'),
      src('archive', 'Gino Valle, clocks, and the fusion of technology and design, Fondazione Pirelli', 'https://www.fondazionepirelli.org/en/activities/exhibitions/gino-valle-clocks-and-the-fusion-of-technology-and-design/'),
    ],
  },
  'flip-disc': { people: [{ who: ['Kenyon Taylor'], did: 'Devised the flip-disc at Ferranti-Packard in Canada, as John Vardalas tells it in a history for IEEE Canada. His first patent on it claims a Canadian application of 1960.' }] },
  'water-curtain': {
    people: [
      { who: ['Julius Popp'], did: 'Artist in Leipzig. He began bit.fall in 2001 with eight nozzles. The version shown in Paris in 2005 had 128 valves and spelled words taken from news websites.' },
    ],
  },
  'mechanical-television': {
    people: [
      { who: ['Paul Nipkow'], did: 'Patented the scanning disc in Germany in the 1880s.' },
      { who: ['John Logie Baird'], did: 'Showed television to members of the Royal Institution at his laboratory in Soho, London, on 26 January 1926. IEEE Spectrum notes an earlier showing of silhouettes at Selfridges in March 1925.' },
    ],
  },
  'kinetic-mirror': {
    people: [{ who: ['Daniel Rozin'], did: 'Artist. He built Wooden Mirror in 1999, the first of his mechanical mirrors by his own account, and has since made them of chrome balls, wooden pegs and plush penguins.' }],
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
      { who: ['Oleg Tretiakoff', 'Andrée Tretiakoff'], she: ['Andrée Tretiakoff'], did: 'Patented braille dots raised by bending piezoelectric reeds, in a United States patent filed in 1975 and granted in 1977. A later patent of theirs claims a French application of August 1974.' },
      { who: ['Klaus Peter Schönherr'], did: 'Invented in 1975 a braille element that could show and erase characters, by a collector\'s history; piezoelectric, by the National Federation of the Blind. His firm\'s terminal served Tübingen University from 1976.' },
      { who: ['James Bryce'], did: 'Began at IBM a working braille display. It is the earliest in the files of the American Printing House for the Blind, which dates it around 1950. Bryce died in 1949.' },
    ],
    sources: [
      src('patent', 'Tretiakoff and Tretiakoff, US patent 4,044,350', 'https://patents.google.com/patent/US4044350'),
      src('archive', 'The Information Age Braille Technology Timeline, National Federation of the Blind, Future Reflections', 'https://nfb.org/images/nfb/publications/fr/fr45/2/fr450210.htm'),
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
      { who: ['Ferdinand Braun'], did: 'Built a cathode ray oscillograph at Strasbourg in 1897, the Braun tube. Britannica calls it the first oscilloscope.' },
      { who: ['Kenjiro Takayanagi'], did: 'Showed a television receiver built on a cathode ray tube, in Japan in 1926.' },
      { who: ['Philo Farnsworth'], did: 'His team at 202 Green Street, San Francisco, sent its first television picture on 7 September 1927. California Historical Landmark 941 calls it the first all-electronic television image.' },
      { who: ['Elma Farnsworth'], she: ['Elma Farnsworth'], did: 'Known as Pem. On the laboratory team she kept the logbooks, made drawings and spot welded tube elements. Hers was among the first faces it sent, the Associated Press reported, citing Donald G. Godfrey.' },
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
      { who: ['A. Frankenstein', 'W. von Jaworski'], aside: true, did: 'Named on German patent 172 376: selenium cells, mirrors and turning discs of red, blue and yellow glass. Histoire de la télévision dates it 20 August 1904, the VDE their proposals 1903.' },
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
    people: [{ who: ['David Hagelbarger'], aside: true, did: 'Researcher at Bell Laboratories. He gave the Computer Museum a prototype Nixie tube with its patent papers, and the museum\'s Report of winter 1987 to 1988 names him its inventor. Other records credit Burroughs.' }],
    note: 'Credit for the invention is not settled. The Computer Museum in Boston recorded a prototype made at Bell Laboratories as the gift of its inventor, David Hagelbarger. The Computer History Museum, which holds that prototype now, says the Nixie was invented at Burroughs. A donor\'s note there gives the design to the Haydu brothers, about 1948, who sold the patent to Burroughs in 1952. National Union sold a similar tube, the Inditron, in 1954, and patents for numerals in glow lamps go back to the 1930s.',
    sources: [
      src('archive', 'The Collection, The Computer Museum Report, volume 21, winter 1987 to 1988, page 3', 'https://tcm.computerhistory.org/reports/TCMReportWinter1987-88.pdf'),
      src('archive', 'Nixie Tube Prototype, catalogue number X672.86, Computer History Museum', 'https://www.computerhistory.org/collections/catalog/X672.86'),
      src('archive', 'Nixie tube, catalogue number X1588.99, Computer History Museum', 'https://www.computerhistory.org/collections/catalog/X1588.99A'),
    ],
  },
  'vacuum-fluorescent': {
    people: [
      { who: ['Tadashi Nakamura'], did: 'Founder of Ise Electronics in Japan. The IEEE credits him with inventing the display in 1967, a single digit tube for Hayakawa Electric calculators. The Philips DM160 indicator was registered in 1957.' },
      { who: ['Tadashi Sasaki'], did: 'Led calculator development at Hayakawa Electric, now Sharp, and urged Tadashi Nakamura, who had worked under him at Kobe Industry, to develop a low voltage display tube.' },
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
      { who: ['Donald Bitzer', 'Gene Slottow', 'Robert Willson'], did: 'The University of Illinois credits them with inventing the panel there in 1964, for the PLATO teaching system. By Bitzer\'s account, Willson, their graduate student, worked out how to build the original panels.' },
      { who: ['Tsutae Shinoda'], did: 'Led the team at Fujitsu in Japan that made the colour plasma panel practical. Fujitsu\'s 21-inch colour television went on sale in 1993.' },
    ],
    sources: [src('archive', 'Milestones: Color Plasma Television, 1993, Engineering and Technology History Wiki', 'https://ethw.org/Milestones:Color_Plasma_Television,_1993')],
  },
  'field-emission': {
    people: [
      { who: ['Charles Spindt', 'Kenneth Shoulders', 'Louis Heynick'], did: 'Patented the microscopic tip arrays at Stanford Research Institute, and in a second patent, granted in 1974, the way of making them. Both rest on an application of February 1970.' },
      { who: ['Akintunde Akinwande'], did: 'Educated in Nigeria and at Stanford. At Honeywell from 1986 he worked on thin-film field emission and displays, and at MIT, with Luis Fernando Velásquez-García, on emitters each controlled by its own transistor.' },
    ],
    sources: [
      src('lab', 'Akintunde Akinwande, MIT Center for International Studies', 'https://cis.mit.edu/our-people/akintunde-akinwande'),
      src('lab', 'Akintunde Ibitayo Akinwande, MIT Technology Licensing Office', 'https://tlo.mit.edu/industry-entrepreneurs/researchers/akintunde-ibitayo-akinwande'),
    ],
  },
  'led-display': {
    people: [
      { who: ['Howard Borden', 'Gerald Pighini'], did: 'Managed solid-state displays at HP Associates and described the Hewlett-Packard numeric indicator in the company\'s journal in February 1969. The journal credits its development to John Atalla\'s laboratory and others.' },
      { who: ['Isamu Akasaki', 'Hiroshi Amano', 'Shuji Nakamura'], did: 'Made efficient blue LEDs in Japan. Full-colour screens followed, and so did the 2014 Nobel Prize in Physics.' },
    ],
    sources: [src('archive', 'The Nobel Prize in Physics 2014', 'https://www.nobelprize.org/prizes/physics/2014/summary/')],
  },
  'oled': { people: [{ who: ['Ching Wan Tang', 'Steven Van Slyke'], did: 'Made at Eastman Kodak a diode of two thin organic layers that gave light efficiently at low voltage, published in 1987. Tang, born in Hong Kong, had been assigned to work on solar cells.' }] },
  'microled': { people: [{ who: ['Hongxing Jiang', 'Jingyu Lin'], she: ['Jingyu Lin'], did: 'Physicists at Kansas State University. With their team they saw blue light from a gallium nitride microLED in August 1999, by their own account, and published it in 2000.' }] },
  'quantum-dot': {
    people: [
      { who: ['Vicki Colvin', 'M. C. Schlamp', 'Paul Alivisatos'], she: ['Vicki Colvin'], did: 'Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994.' },
      { who: ['Aleksey Yekimov'], did: 'Russian physicist. He showed in coloured glass that the size of a tiny crystal sets its colour.' },
      { who: ['Louis Brus'], did: 'Proved the same effect in particles floating freely in a liquid.' },
      { who: ['Moungi Bawendi'], did: 'Chemist at MIT, born in Paris. In 1993 he and his students found how to make quantum dots that the Nobel announcement called almost perfect. The three shared the 2023 Nobel Prize in Chemistry.' },
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
      { who: ['Tuomo Suntola'], did: 'Finnish physicist. He filed a patent on atomic layer deposition, which grows a film one layer of atoms at a time, in 1974. His one goal then, he said, was flat electroluminescent panels.' },
      { who: ['Dawon Kahng'], did: 'Born in Seoul. At Bell Laboratories in 1968 he reported light from molecules of rare earth and transition metals set in compounds such as zinc sulphide, excited by the impact of electrons.' },
    ],
    sources: [
      src('paper', 'Kahng, Electroluminescence of rare-earth and transition metal molecules in II-VI compounds via impact excitation, Applied Physics Letters (1968)', 'https://doi.org/10.1063/1.1652574'),
      src('paper', 'Chase, Hepplewhite, Krupka and Kahng, Electroluminescence of ZnS Lumocen devices containing rare-earth and transition-metal fluorides, Journal of Applied Physics (1969)', 'https://doi.org/10.1063/1.1658025'),
      src('archive', 'Dawon Kahng, National Inventors Hall of Fame', 'https://www.invent.org/inductees/dawon-kahng'),
    ],
  },
  'flexible-display': { people: [{ who: ['Nicholas Sheridon'], aside: true, did: 'Made Gyricon at the Xerox Palo Alto Research Center in the 1970s, a sheet of tiny turning balls. MIT Technology Review says the circuit board that drove it was rigid.' }] },
  'camera-obscura': {
    people: [
      { who: ['Mozi'], aside: true, did: 'Taught in China about 430 BCE, and the Mohist school is named after him. Its later members wrote the Canons, which hold an early account of a picture turned over by a small hole.' },
      { who: ['Ibn al-Haytham'], aside: true, did: 'Born in Basra about 965, died in Cairo about 1040. In a dark chamber he studied how light passes through an opening, and how the sun in eclipse looks through a small hole.' },
      { who: ['Gemma Frisius'], aside: true, did: 'Physician and instrument maker. He watched the solar eclipse of 24 January 1544 at Leuven in a darkened room, and described the method in his book of 1545, with a drawing.' },
      { who: ['Daniele Barbaro'], aside: true, did: 'Venetian nobleman. His book on perspective, dated 1568 or 1569, describes a spectacle lens set in the hole, and a cover over part of the lens to make the picture clearer.' },
      { who: ['Johannes Kepler'], aside: true, did: 'The 1911 Encyclopaedia Britannica calls him the first to use the name camera obscura. A letter of 1620 tells of his portable dark tent with a lens, for sketching landscapes.' },
    ],
    note: 'No inventor is known. The Mohist text speaks of the turned shadow and the crossing light, and does not describe a chamber.',
    sources: [
      src('reference', 'Mohism, Stanford Encyclopedia of Philosophy', 'https://plato.stanford.edu/entries/mohism/'),
      src('reference', 'Ibn al-Haytham (Wikipedia)', 'https://en.wikipedia.org/wiki/Ibn_al-Haytham'),
      src('archive', 'Daniele Barbaro, biography, Museo Galileo, Florence', 'https://catalogue.museogalileo.it/biography/DanieleBarbaro.html'),
    ],
  },
  'shadow-play': {
    people: [
      { who: ['Ibn Daniyal'], aside: true, did: 'Eye doctor, born in Mosul in 1248. He settled in Cairo and wrote three shadow plays there. A study in Muqarnas calls them the only plays of that era to survive in writing.' },
      { who: ['François Dominique Séraphin'], aside: true, did: 'Opened a shadow theatre at Versailles and moved it to Paris in 1784, though Britannica starts him in Paris in 1776. His French plays were billed as ombres chinoises, Chinese shadows, a trade name.' },
      { who: ['Henri Rivière'], aside: true, did: 'Worked with up to twenty assistants on the shadow plays of the cabaret Le Chat Noir in Paris, which staged 45 of them between 1885 and 1896. From 1887 the figures were of zinc.' },
      { who: ['Lotte Reiniger'], she: ['Lotte Reiniger'], aside: true, did: 'Made The Adventures of Prince Achmed in 1926, the oldest surviving animated feature, from figures of black card and lead with wire-hinged limbs. The second act on this cloth is cut in her manner.' },
      { who: ['Kara Walker'], she: ['Kara Walker'], aside: true, did: 'American artist, known for silhouettes cut from black paper. Since 2004 she has made films in which jointed paper puppets, worked by hand on sticks, play out stories of slavery in America.' },
    ],
    note: 'No inventor is recorded for wayang, for the Chinese shadow theatre or for Karagöz. In Java the craft has been handed down within families of puppeteers, musicians and puppet makers.',
    sources: [
      src('reference', 'Ibn Daniel, World Encyclopedia of Puppetry Arts, UNIMA', 'https://wepa.unima.org/en/?p=773'),
      src('reference', 'Séraphin, World Encyclopedia of Puppetry Arts, UNIMA', 'https://wepa.unima.org/en/?p=6310'),
      src('reference', 'Dominique Séraphin, Encyclopaedia Britannica', 'https://www.britannica.com/biography/Dominique-Seraphin'),
      src('reference', 'Muḥammad Ibn Dāniyāl (Wikipedia)', 'https://en.wikipedia.org/wiki/Mu%E1%B8%A5ammad_Ibn_D%C4%81niy%C4%81l'),
      src('archive', 'Lotte Reiniger: Animation Innovator, Library of Congress, Inside Adams', 'https://blogs.loc.gov/inside_adams/2025/04/lotte-reiniger/'),
      src('press', 'Scissors make films: Lotte Reiniger on creating her magical animations (1936), BFI, Sight and Sound', 'https://www.bfi.org.uk/news-opinion/sight-sound-magazine/archives/lotte-reiniger-scissors-make-films-cut-out-animation-process-description-1936'),
      src('archive', 'Kara Walker, Shadow puppet from Testimony: Narrative of a Negress Burdened by Good Intentions (2004), Museum of Modern Art', 'https://www.moma.org/collection/works/97669'),
      src('archive', 'Kara Walker, Fall Frum Grace, Miss Pipi\'s Blue Tale (2011), Sammlung Goetz', 'https://online.sammlung-goetz.de/en/work/fall-frum-grace-miss-pipis-blue-tale/'),
    ],
  },
  'switchable-glass': {
    people: [
      { who: ['James Fergason'], did: 'Patented liquid crystal sealed in tiny capsules of polymer in 1984, the kind of film that switchable glass is made of.' },
      { who: ['John West'], did: 'Worked on switchable windows at the Liquid Crystal Institute of Kent State University from 1984, by the university\'s account.' },
    ],
  },
  'liquid-crystal': {
    people: [
      { who: ['Martin Schadt', 'Wolfgang Helfrich'], did: 'Filed the patent for the twisted cell at Hoffmann-La Roche in Switzerland on 4 December 1970.' },
      { who: ['James Fergason'], did: 'Filed a similar patent in the United States in 1971. The dispute over who came first was settled out of court.' },
      { who: ['George Heilmeier'], did: 'With a group at RCA Laboratories, he built liquid crystal displays in the 1960s that worked by scattering light. Its members included Nunzio Luce, Louis Zanoni, Joel Goldmacher, Joseph Castellano and Lucian Barton.' },
      { who: ['Sivaramakrishna Chandrasekhar', 'B. K. Sadashiva', 'K. A. Suresh'], did: 'In 1977 at the Raman Research Institute in Bangalore they found liquid crystals whose molecules are discs, not rods. Films of such liquid crystals later widened the angle a screen can be read from.' },
      { who: ['Mohamed Atalla', 'Dawon Kahng'], did: 'Made the MOS transistor at Bell Laboratories in 1959, the Computer History Museum says, and announced it in 1960. Every cell\'s thin-film transistor works alike. Atalla was born in Port Said, Kahng in Seoul.' },
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
  'micromirror': { people: [{ who: ['Larry Hornbeck'], did: 'The National Inventors Hall of Fame says he invented the mirror chip at Texas Instruments in 1987, after a decade on analogue mirrors. A team he led from 1977 built it.' }] },
  'eidophor': { people: [{ who: ['Fritz Fischer'], did: 'Applied for a patent on the projector at ETH Zurich in November 1939. An account of 1953 has the first prototype running in 1944.' }] },
  'scanned-laser': {
    people: [
      { who: ['Joseph Ostoja-Kotkowski'], did: 'Staged an early laser show, Sound and Image, at the Adelaide Festival of Arts in 1968.' },
      { who: ['Elsa Garmire'], she: ['Elsa Garmire'], did: 'Physicist at the California Institute of Technology. Ivan Dryer filmed her laser images from late 1970, and the two started the company that made Laserium, with her as its president.' },
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
  'gyricon': { people: [{ who: ['Nicholas Sheridon'], did: 'By his own account he invented the sheet of turning beads at the Xerox Palo Alto Research Center in the 1970s.' }] },
  'electrophoretic-ink': {
    people: [
      { who: ['Barrett Comiskey', 'J. D. Albert', 'Joseph Jacobson'], did: 'Developed the ink in capsules at the MIT Media Lab from the middle of the 1990s. On 23 January 1997, by Comiskey\'s account, Comiskey and Albert moved particles inside a capsule.' },
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
      { who: ['Gerardo Beni', 'Susan Hackwood'], she: ['Susan Hackwood'], did: 'Proposed electrowetting displays at Bell Laboratories in a paper of 1981, the year they filed their patent. Cambridge\'s Centre for Science and Policy credits Hackwood with naming the effect.' },
      { who: ['Robert Hayes', 'Johan Feenstra'], did: 'Made it work at video speed at Philips Research in Eindhoven in 2003.' },
    ],
    sources: [
      src('patent', 'Beni and Hackwood, US patent 4,417,786', 'https://patents.google.com/patent/US4417786'),
      src('reference', 'Susan Hackwood (Wikipedia)', 'https://en.wikipedia.org/wiki/Susan_Hackwood'),
      src('reference', 'Gerardo Beni, Wikidata', 'https://www.wikidata.org/wiki/Q5550233'),
    ],
  },
  'interferometric-modulator': { people: [{ who: ['Mark Miles'], did: 'By his speaker biography of 2006 he invented the modulator. He founded Etalon, co-founded Iridigm in 1997 to develop it, and Qualcomm bought Iridigm in 2004.' }], sources: [src('archive', 'Mark Miles, speaker biography, Hilton Head Workshop, Transducer Research Foundation (2006)', 'https://www.transducer-research-foundation.org/archive/hh2006/general/speakers/miles.html')] },
  'electrochromic': {
    people: [
      { who: ['S. K. Deb'], did: 'Showed, in work begun in the 1960s, that thin films of tungsten oxide colour and bleach under a voltage alone. His NREL biography calls this the discovery of electrochromism in such oxides.' },
      { who: ['Paula Hammond', 'Dean DeLongchamp'], she: ['Paula Hammond'], did: 'At MIT, Hammond supervised DeLongchamp, who built electrochromic films one molecular layer at a time. His thesis of 2003 found them generally better in contrast and switching than films made otherwise.' },
    ],
    sources: [
      src('paper', 'DeLongchamp, Engineering the electrochromism and ion conduction of layer-by-layer assembled films, thesis supervised by Paula Hammond, Massachusetts Institute of Technology (2003)', 'https://dspace.mit.edu/handle/1721.1/29995'),
      src('archive', 'Paula Hammond, Science History Institute', 'https://www.sciencehistory.org/education/scientific-biographies/paula-hammond/'),
    ],
  },
  'peppers-ghost': {
    people: [
      { who: ['Henry Dircks'], did: 'Engineer who devised the illusion.' },
      { who: ['John Henry Pepper'], did: 'Staged it at the Royal Polytechnic Institution in London, and it took his name. By his own account the first showing was just before Christmas 1862.' },
    ],
    sources: [
      src('archive', 'John Henry Pepper, Scientist of the Day, Linda Hall Library', 'https://www.lindahall.org/about/news/scientist-of-the-day/john-henry-pepper/'),
      src('paper', 'John Henry Pepper, The True History of the Ghost (1890)', 'https://cuny.manifoldapp.org/read/the-true-history-of-the-ghost/section/c430b376-bfb6-48a0-9b78-0b2bc98a369f'),
    ],
  },
  'illusion-transmitter': {
    people: [{ who: ['Valerie Thomas'], she: ['Valerie Thomas'], did: 'Majored in physics at Morgan State University, by Lemelson-MIT\'s account one of only two women in her class to do so. She joined NASA as a data analyst and patented the illusion transmitter.' }],
    sources: [src('press', 'Valerie Thomas, Biography.com', 'https://www.biography.com/scientists/valerie-thomas')],
  },
  'fog-screen': {
    people: [{ who: ['Karri Palovuori', 'Ismo Rakkolainen'], did: 'Developed the fog screen that people can walk through, at Tampere University of Technology. Rakkolainen built early prototypes at home in the 1990s, and Lemelson-MIT dates its first showing to 2002.' }],
    note: 'Projection onto fountains and curtains of water is older. A patent for an ornamental fountain screen dates from 1899.',
  },
  'persistence-of-vision': {
    people: [{ who: ['Joseph Plateau'], did: 'Used the effect in his spinning picture discs of 1832. The Museum of the History of Science at Oxford says Simon Stampfer in Vienna made the same disc independently, and patented it first.' }],
    sources: [src('archive', 'Phenakistiscope, History of Science Museum, University of Oxford', 'https://www.mhs.ox.ac.uk/exhibits/fancy-names-and-fun-toys/phenakistiscopes/index.html')],
    note: 'Persistence of vision is the traditional name, not a full explanation. The way the eye and brain merge flicker and perceive motion is more complex. No first maker of the spinning LED kind is agreed.',
  },
  'swept-volume': {
    people: [
      { who: ['Max Hirsch'], did: 'Patented a swept-screen display in 1961. He called it a generescope and had air traffic control in mind.' },
      { who: ['Gregg Favalora'], did: 'Co-founded Actuality Systems with two Harvard students. Its Perspecta display was priced at 40,000 dollars in 2002, and NASA Ames bought one early in 2003.' },
    ],
  },
  'static-volume': { people: [{ who: ['Elizabeth Downing', 'Lambertus Hesselink', 'John Ralston', 'Roger Macfarlane'], she: ['Elizabeth Downing'], did: 'Drew coloured points of light inside a block of glass with crossed infrared beams. Downing, the first author, and Hesselink of Stanford, Ralston of SDL and Macfarlane of IBM published in Science in 1996.' }] },
  'optical-trap': { people: [{ who: ['Daniel Smalley'], did: 'Leads the group at Brigham Young University that built the display, published in 2018.' }] },
  'acoustic-levitation': { people: [{ who: ['Ryuji Hirayama', 'Diego Martinez Plasencia', 'Nobuyuki Masuda', 'Sriram Subramanian'], did: 'Published the display in Nature in 2019. Hirayama, Martinez Plasencia and Subramanian developed it at the University of Sussex, and Masuda was at Tokyo University of Science.' }] },
  'laser-plasma': { people: [{ who: ['Yoichi Ochiai'], did: 'Led the version of 2015, which uses far shorter laser pulses.' }] },
  'stereoscope': {
    people: [
      { who: ['Charles Wheatstone'], did: 'Published the stereoscope in London in 1838, months before photography was announced.' },
      { who: ['Kenneth Dunkley'], did: 'Physicist in Pennsylvania. His patent of 1989 is for viewing glasses with no lenses: two pinholes and two empty frames. It says they give an ordinary flat picture the look of depth.' },
      { who: ['Charles Harrison'], did: 'Industrial designer in Chicago. In 1957 or 1958 he redesigned the View-Master, a stereoscope for the hand, in light moulded plastic. Sold from 1962, it went from a photographer\'s accessory to a children\'s toy.' },
    ],
    sources: [
      src('patent', 'Dunkley, US patent 4,810,057', 'https://patents.google.com/patent/US4810057'),
      src('archive', 'Kenneth Dunkley, National Business League', 'https://nationalbusinessleague.org/kenneth-dunkley/'),
      src('archive', 'Charles Harrison, View-Master (model G), Museum of Modern Art', 'https://www.moma.org/collection/works/205547'),
      src('archive', 'Remembering Charles Harrison, Cooper Hewitt, Smithsonian Design Museum (2018)', 'https://www.cooperhewitt.org/2018/12/11/remembering-charles-harrison-1931-2018/'),
      src('archive', 'Expanding Views: Charles Harrison\'s Redesign of the View-Master, The Henry Ford', 'https://www.thehenryford.org/collections/explore/articles/expanding-views-charles-harrisons-redesign-of-the-view-master'),
    ],
  },
  'stereo-glasses': {
    people: [
      { who: ['Wilhelm Rollmann'], did: 'Described in 1853 how two pictures in two colours, seen through glasses of the same two colours, give each eye its own.' },
      { who: ['Louis Ducos du Hauron'], did: 'Printed stereoscopic photographs in red and blue in 1891, and named them anaglyphs.' },
      { who: ['Laurens Hammond'], did: 'Showed films through shutters that opened for each eye in turn, at the Selwyn Theatre in New York from December 1922.' },
      { who: ['Edwin H. Land'], did: 'Made sheet polarisers and showed films in polarised light in New York in 1936, by the account of a newspaper of that year.' },
    ],
    sources: [
      src('archive', 'Wilhelm Rollmann and the anaglyph, Stereoscopic Pictures', 'https://stereoscopictures.com/anaglyph/anaglyphs/'),
      src('archive', 'Commercialization of the polarizer, Polaroid Corporation collection, Harvard Business School', 'https://www.library.hbs.edu/hc/polaroid/a-research-and-manufacturing-company/commercialization-of-the-polarizer'),
      src('press', 'Rownd, Early 3D: a case study, the Teleview and The Man from M.A.R.S., Bright Lights Film Journal', 'https://brightlightsfilm.com/early-3d-a-case-study-the-teleview-and-the-man-from-mars/'),
    ],
  },
  'parallax-barrier': {
    people: [
      { who: ['Frederic Ives'], did: 'Made parallax stereograms in Philadelphia. His United States patent was filed in 1902 and granted in 1903. An encyclopedia, citing his paper of 1902, has him showing one in 1901.' },
      { who: ['Auguste Berthier'], did: 'Suggested the principle in 1896, in the French journal Cosmos. A paper of 1952 says the parallax barrier is generally attributed to him.' },
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
      { who: ['Dennis Gabor'], did: 'Conceived holography at Easter 1947 at British Thomson-Houston in Rugby, England, by his Nobel lecture, and published it in 1948. The Nobel Prize credits him with its invention.' },
      { who: ['Emmett Leith', 'Juris Upatnieks'], did: 'Published the off-axis method of recording holograms in 1962.' },
      { who: ['Margaret Benyon'], she: ['Margaret Benyon'], did: 'Painter, born in Birmingham and raised in Kenya. She made holograms as art from 1968 and showed them a year later.' },
      { who: ['Stephen Benton', 'Mary Lou Jepsen'], she: ['Mary Lou Jepsen'], did: 'Jepsen\'s master\'s thesis of 1989, supervised by Benton at the MIT Media Lab, set out the design and implementation of a holographic video display.' },
      { who: ['Ali Javan'], did: 'Born in Tehran. With William Bennett and Don Herriott he ran a helium neon laser at Bell Laboratories in 1960, by MIT News the first gas laser. Holograms are recorded with laser light.' },
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
      { who: ['Ivan Sutherland', 'Bob Sproull'], did: 'Built a headset that showed graphics drawn by a computer, at Harvard University in 1968. The ACM calls it the first virtual reality headset, the Computer History Museum an early one.' },
      { who: ['Samuel Achilefu'], did: 'Born in Nigeria. A team he led at Washington University in St. Louis built goggles that show surgeons cancer cells glowing with a dye. The university dates their first use in surgery to 2014.' },
    ],
    sources: [
      src('press', 'Special glasses help surgeons ‘see’ cancer, Washington University in St. Louis (2014)', 'https://source.washu.edu/2014/02/special-glasses-help-surgeons-ee-cancer/'),
      src('press', 'Washington People: Samuel Achilefu, Washington University in St. Louis (2016)', 'https://source.washu.edu/2016/02/washington-people-samuel-achilefu/'),
    ],
  },
  'cave': {
    people: [
      { who: ['Carolina Cruz-Neira', 'Daniel Sandin', 'Thomas DeFanti'], she: ['Carolina Cruz-Neira'], did: 'Wrote both papers that set out the CAVE, in 1992 and 1993, with Cruz-Neira as first author. Their laboratory showed it at SIGGRAPH in Chicago in July 1992.' },
      { who: ['Carolina Cruz-Neira'], she: ['Carolina Cruz-Neira'], did: 'Made its design and implementation her doctoral research, by a SIGGRAPH biography of 1997. A SIGGRAPH biography of 2022 says she invented it, and UCF says she created it.' },
      { who: ['Daniel Sandin', 'Thomas DeFanti'], did: 'Conceived the CAVE in 1991, by the account of the Electronic Visualization Laboratory, which the two set up in 1973.' },
      { who: ['Greg Dawe'], did: 'Staff member of the laboratory. The laboratory\'s retrospective of 2024 says Dawe designed and built its CAVE, and a portable one for SIGGRAPH 92.' },
    ],
    note: 'The sources share the credit differently. The laboratory credits Sandin and DeFanti with conceiving the CAVE, with graduate students. SIGGRAPH and university biographies credit Cruz-Neira with inventing or creating it. The laboratory\'s retrospective says its staff member Greg Dawe designed and built the room. The paper of 1992 has two more authors, Robert Kenyon and John Hart.',
    sources: [
      src('archive', 'Carolina Cruz-Neira, ACM SIGGRAPH History Archives', 'https://history.siggraph.org/?p=47669'),
      src('lab', 'Acclaimed computer scientist and virtual reality pioneer joins UCF faculty, University of Central Florida (2020)', 'https://www.ucf.edu/news/acclaimed-computer-scientist-and-virtual-reality-pioneer-joins-ucf-faculty/'),
      src('lab', 'Daniel J. Sandin, biography, Electronic Visualization Laboratory', 'https://www.evl.uic.edu/dan/bio.html'),
      src('lab', 'Tom DeFanti, Electronic Visualization Laboratory', 'https://legacy.evl.uic.edu/tom/'),
      src('archive', 'Dan Sandin, biography, Electronic Arts Intermix', 'https://eai.org/artists/dan-sandin/biography'),
      src('paper', 'Johnson and others, Electronic Visualization Laboratory\'s 50th Anniversary Retrospective, PRESENCE (2024)', 'https://www.evl.uic.edu/documents/evl_50th.pdf'),
    ],
  },
  'retinal-display': { people: [{ who: ['Kazuo Yoshinaka'], did: 'Named as inventor on a Japanese patent application for a display that scans light onto the retina, filed by NEC in 1985 and published in 1986.' }] },
  'head-up': { people: [{ who: ['J. M. Naish'], did: 'Worked out at Farnborough from 1956 the system that, by his own account of 1979, was first called a head-up display.' }] },
};

// the sources found in the audit of the label lines join the sources each People section already has
for (const [id, found] of Object.entries(auditSources)) {
  const c = people[id];
  if (!c) continue;
  const have = new Set((c.sources ?? []).map((x) => x.url));
  c.sources = [...(c.sources ?? []), ...found.filter((x) => !have.has(x.url))];
}

/** Every name in the collection, each once, with the first piece it appears on. */
export const everyone = (): { name: string; piece: string; she: boolean }[] => {
  const seen = new Map<string, { name: string; piece: string; she: boolean }>();
  for (const [piece, c] of Object.entries(people)) for (const e of c.people) for (const name of e.who) {
    if (!seen.has(name)) seen.set(name, { name, piece, she: !!e.she?.includes(name) });
  }
  return [...seen.values()];
};
