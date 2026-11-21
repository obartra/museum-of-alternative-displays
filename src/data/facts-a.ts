import type { Fact } from './facts';

/** Worth knowing: one fact per piece for halls 1, 2 and 3. Each comes from the source beside it, which was opened and read. */
export const factsA: Record<string, Fact> = {
  // hall 1, mechanics
  'split-flap': {
    text: 'When Boston\'s transit authority planned an electronic board to replace the flap board at South Station, it chose to keep the noise. The new board was to play the old ticking sound at every change.',
    source: { label: 'Nostalgia for noise at South Station, The Boston Globe (2006), as reposted by the Brotherhood of Locomotive Engineers and Trainmen', url: 'https://ble-t.org/news/nostalgia-for-noise-at-south-station/', kind: 'press' },
  },
  'flip-disc': {
    text: 'Some highway signs had discs faced with the same retroreflective coating as an ordinary road sign. At night their message was lit by the headlamps of the cars driving towards it.',
    source: { label: 'Current VMS Technologies and Applications, U.S. Access Board', url: 'https://www.access-board.gov/research/communication/variable-message-signing/current-vms-technologies/', kind: 'paper' },
  },
  'mechanical-television': {
    text: 'In his experiments Baird televised the head of a ventriloquist\'s dummy, known as Stooky Bill, because the lights he needed were too hot for a person. The head is kept in the Science Museum Group collection.',
    source: { label: 'John Logie Baird\'s test subject \'Stookie Bill\', Science Museum Group Collection', url: 'https://collection.sciencemuseumgroup.org.uk/objects/co8067247/john-logie-bairds-test-subject-stookie-bill', kind: 'archive' },
  },
  'kinetic-mirror': {
    text: 'One of Rozin\'s later mirrors, made in 2015, is a crowd of 450 motorised toy penguins. When someone walks up, the penguins turn, and their black and white plush draws that person\'s silhouette.',
    source: { label: 'Penguins Mirror, Daniel Rozin, bitforms gallery', url: 'https://www.bitforms.art/artwork/penguins-mirror', kind: 'maker' },
  },
  'shape-display': {
    text: 'The lab\'s earlier pin table, Relief, raised each of its 120 pins with a motorised slider of the kind used on audio mixing desks. The 900 pins of inFORM are moved by the same type of slider, through nylon rods.',
    source: { label: 'Leithinger and Ishii, Relief: A Scalable Actuated Shape Display (2010)', url: 'https://trackr-media.tangiblemedia.org/publishedmedia/Papers/432-Relief%20A%20Scalable%20Actuated/Published/PDF', kind: 'paper' },
  },
  'braille-display': {
    text: 'By 1985 the United States tax service employed more than 100 blind and partially sighted staff to answer taxpayers\' telephone questions. Their tax publications were supplied on cassette tape, to be read as braille on a 20-cell display.',
    source: { label: 'VersaBraille System, Museum of the American Printing House for the Blind', url: 'https://sites.aph.org/museum-virtual-exhibit/vex2/286E106F-D949-4BC7-9205-236819347798.htm', kind: 'archive' },
  },
  'drone-show': {
    text: 'The record flight shown at the opening of the 2018 Winter Olympics was a recording made in advance. A live flight for the crowd in the stadium was planned and then cancelled at the last minute.',
    source: { label: 'Winter Olympics 2018: Inside the Opening Ceremonies Drone Show, Wired (2018)', url: 'https://www.wired.com/story/olympics-opening-ceremony-drone-show/', kind: 'press' },
  },

  // hall 2, glass and glow
  'cathode-ray-tube': {
    text: 'A picture tube gives off X-rays while it runs, and the glass contains lead to stop them. The United States Environmental Protection Agency said in 2002 that a typical computer monitor could hold up to eight pounds of lead, about 3.6 kilograms.',
    source: { label: 'EPA Proposes Easing Barriers to Encourage Recycling of Computers, Televisions and Mercury-Containing Equipment, U.S. Environmental Protection Agency (2002)', url: 'https://www.epa.gov/archive/epapages/newsroom_archive/newsreleases/c414f152eb0f1abf85256bc80055308a.html', kind: 'archive' },
  },
  'colour-wheel-television': {
    text: 'The original patent of 1940 is kept in the national archive of Mexico, the Archivo General de la Nación. In it González Camarena calls his invention a simple and novel adapter that could be fitted to any black-and-white television of the day.',
    source: { label: 'The Original Patent For Color Television Explained, Archivo General de la Nación', url: 'https://artsandculture.google.com/story/qQVxulIPRfmyJw', kind: 'archive' },
  },
  'vector-display': {
    text: 'The Vectrex home console of 1982 had a vector tube built in. Its screen was black and white, so colour came from plastic sheets laid over the glass.',
    source: { label: 'Vectrex Game Console, Computer History Museum', url: 'https://www.computerhistory.org/revolution/computer-games/16/210/873', kind: 'archive' },
  },
  'storage-tube': {
    text: 'Its ancestor, Andrew Haeff\'s Memory Tube of the 1940s, was designed as computer memory, to store numbers and read them out again. Computers adopted a rival tube instead, and the design survived as a screen, read by a person looking at the glass.',
    source: { label: 'Screen History: The Haeff Memory and Graphics Tube of 1940s Opened a New Era of Computing, IEEE Computer Society (2017)', url: 'https://www.computer.org/publications/tech-news/research/the-haeff-memory-and-graphics-tube', kind: 'press' },
  },
  'nixie-tube': {
    text: 'The first prototype at Burroughs lasted one night: by morning so much metal from the numerals had settled inside the glass that they could no longer be seen. A little mercury vapour solved the problem, and later tubes ran for more than 200,000 hours.',
    source: { label: 'The Nixie Tube Story: The Neon Display Tech That Engineers Can\'t Quit, IEEE Spectrum (2018)', url: 'https://spectrum.ieee.org/nixie-tube', kind: 'press' },
  },
  'vacuum-fluorescent': {
    text: 'Japanese calculator makers owed Burroughs high patent fees for the nixie tube, so the head of calculator development at the firm now called Sharp asked a tube engineer he knew for a cheaper, low-voltage display. Prototypes of the VFD were ready in two months.',
    source: { label: 'Milestones: Vacuum Fluorescent Displays, 1967, Engineering and Technology History Wiki', url: 'https://ethw.org/Milestones:Vacuum_Fluorescent_Displays,_1967', kind: 'archive' },
  },
  'numitron': {
    text: 'In March 1970 the editors of Popular Electronics called the new tube so simple that they wondered why no one had thought of it before. It ran on 5 volts or less and was expected to last more than 100,000 hours.',
    source: { label: 'Wood, Numitron Readout, Popular Electronics, March 1970', url: 'https://www.worldradiohistory.com/Archive-Poptronics/70s/1970/Poptronics-1970-03.pdf', kind: 'press' },
  },
  'plasma-panel': {
    text: 'The classroom plasma panel was clear enough to see through. Behind it the terminal carried a projector and a sheet of film holding up to 256 tiny pictures, and the computer could project any one of them onto the back of the screen.',
    source: { label: 'Kirby and others, Design of a Computer-Controlled, Random-Access Slide Projector Interface, Air Force Human Resources Laboratory (1975)', url: 'https://files.eric.ed.gov/fulltext/ED114073.pdf', kind: 'paper' },
  },
  'field-emission': {
    text: 'Nobody sharpens the tips. In the method patented at Stanford Research Institute, metal is deposited into holes two thousandths of a millimetre wide while a second material slowly closes each hole from its edge, and the shrinking opening shapes the metal into a cone.',
    source: { label: 'Spindt, Shoulders and Heynick, US patent 3,755,704', url: 'https://patents.google.com/patent/US3755704A/en', kind: 'patent' },
  },
  'eggcrate': {
    text: 'An older lamp sign, the news strip that wrapped round the Times Tower in New York from 1928, had 14,800 bulbs. An operator set each headline by hand in thin letter slabs, and a chain pulled them across contacts that switched the lamps.',
    source: { label: 'Nov. 6, 1928: All the News That\'s Lit, Wired (2008)', url: 'https://www.wired.com/2008/11/nov-6-1928-all-the-news-thats-lit/', kind: 'press' },
  },

  // hall 3, solid light
  'led-display': {
    text: 'The Pulsar watch of 1972 showed the time in LEDs and cost $2,100, about as much as a small car. The diodes used so much power that the face stayed dark until the wearer pushed a button.',
    source: { label: 'Pulsar Electronic Wristwatch, National Museum of American History', url: 'https://www.si.edu/object/pulsar-electronic-wristwatch%3Anmah_1173538', kind: 'archive' },
  },
  'oled': {
    text: 'Ching Tang\'s job at Kodak was to make solar cells, and by his own account he failed. Two thin layers of his solar cell material gave off light instead, though the first device worked for only a few seconds at a time.',
    source: { label: 'Homage for a humble icon of science, University of Rochester (2019)', url: 'https://www.hajim.rochester.edu/che/news-events/news/archive/2019/2019_06_25_tang_reception.html', kind: 'press' },
  },
  'microled': {
    text: 'The inventors are a married couple, and the idea began as a question at their dinner table: what would happen to an LED shrunk to the scale of micrometres? Their first patent expired just as the first microLED screens reached consumers.',
    source: { label: 'Jiang and Lin, How we made the microLED, Nature Electronics (2023)', url: 'https://www.depts.ttu.edu/ece/Nanophotonics/papers/2023How%20we%20made%20the%20microLED_Nature%20electronics.pdf', kind: 'paper' },
  },
  'quantum-dot': {
    text: 'The colour of quantum dots was first seen in glass. Aleksey Yekimov coloured glass with tiny crystals of copper chloride and showed that the colour depended on the size of the crystals. He shared the 2023 Nobel Prize in Chemistry for it.',
    source: { label: 'The Nobel Prize in Chemistry 2023, press release', url: 'https://www.nobelprize.org/prizes/chemistry/2023/press-release/', kind: 'archive' },
  },
  'thin-film-el': {
    text: 'Atomic layer deposition, which builds a film one layer of atoms at a time and now helps to make computer chips, was devised by a Finnish physicist in 1974 for one purpose: to make these panels. The first panel showed flights at Helsinki Airport.',
    source: { label: 'Finnish physicist Tuomo Suntola wins Millennium Technology Prize, thisisFINLAND (2018)', url: 'https://finland.fi/business-innovation/finnish-physicist-tuomo-suntola-wins-millennium-technology-prize/', kind: 'press' },
  },
  'transparent-display': {
    text: 'In 2020 metro trains on one line in Beijing and one in Shenzhen were given 55-inch transparent OLED screens in their windows. The screens showed passengers train times, transfers, flights, weather and news.',
    source: { label: 'LG Display offers world\'s first transparent OLEDs for subway train windows in China, LG press release (2020)', url: 'https://www.lgcorp.com/media/release/22310', kind: 'maker' },
  },
  'flexible-display': {
    text: 'A flexible OLED screen is made on a sheet of rigid glass. Plastic is coated onto the glass, the display is built on top, and at the end an ultraviolet laser shines through the glass and frees the finished screen.',
    source: { label: 'The Lasers That Make Your Screen, Optics & Photonics News (2026)', url: 'https://www.optica-opn.org/home/articles/volume_37/may_2026/features/the_lasers_that_make_your_screen/', kind: 'press' },
  },
};
