/**
 * What the museum says of a person beyond the line on a label: a few sentences, each resting on the sources listed
 * with it, in the voice set down in docs/people/VOICE.md. `scripts/validate.ts` holds every account to that voice,
 * and docs/people/CURATOR.md records each reading of the whole set.
 *
 * Written in English. A person without an account here has a page all the same, with their lines and sources.
 */
import { people } from './people';
import type { Person } from './persons';
import type { Source } from './schema';

export interface Bio { born?: number; died?: number; about: string[]; sources: Source[] }

const s = (kind: Source['kind'], label: string, url: string): Source => ({ kind, label, url });

export const bios: Record<string, Bio> = {
  "Kenyon Taylor": {
    about: [
      "John Vardalas, in a history of Ferranti Canada published by IEEE Canada, calls him the man who first directed its electronics group. In 1954 he was the group's manager.",
      "The same history credits him with the flip-disc display, devised at Ferranti Canada. Its discs were black on one side and white on the other, and each flipped magnetically where two electrical pulses met.",
      "A United States patent for magnetically operated signs, granted in 1967 and assigned to Ferranti Packard Electric of Toronto, names him as Maurice Kenyon Taylor, with Donald Winrow. Both inventors lived in Ontario.",
    ],
    sources: [
      s("patent", "Taylor and Winrow, US patent 3,303,494, Magnetically operated signs, Ferranti-Packard", "https://patents.google.com/patent/US3303494"),
      s("paper", "John Vardalas, From DATAR to the FP-6000 Computer: Technological Change in a Canadian Industrial Context, IEEE Canada", "https://ewh.ieee.org/reg/7/millennium/fp6000/fp6000_datar.html"),
    ],
  },
  "Ferdinand Braun": {
    born: 1850, died: 1918, about: [
      "Born in Fulda, he studied at Marburg and Berlin and taught physics at Karlsruhe, Tübingen and Strasbourg. In 1897 he built a cathode ray oscillograph, which Britannica calls the first oscilloscope, or Braun tube.",
      "He shared the Nobel Prize in Physics of 1909 with Guglielmo Marconi, for work on wireless telegraphy.",
      "The Nobel Foundation says he went to New York as a witness in a patent case. Britannica says he was detained there as a German citizen after the United States entered the First World War. He died in Brooklyn.",
    ],
    sources: [
      s("archive", "Ferdinand Braun, Biographical, The Nobel Prize", "https://www.nobelprize.org/prizes/physics/1909/braun/biographical/"),
      s("reference", "Ferdinand Braun, Encyclopaedia Britannica", "https://www.britannica.com/biography/Ferdinand-Braun"),
    ],
  },
  "Robert H. Anderson": {
    born: 1925, about: [
      "A physicist born in Jersey City, New Jersey, he joined Tektronix in 1959, in the research group led by Dick Ropiequet.",
      "Before storage tubes, engineers caught a passing signal by photographing the oscilloscope screen. He set himself the task of a simple storage tube, one that holds the trace on its screen. It had no internal storage target, which earlier tubes had used.",
      "The IEEE Annals of the History of Computing says he simplified Andrew Haeff's design into a direct viewing bistable storage tube.",
      "The Type 564 oscilloscope of 1963 was built around his tube, and Tektronix later used such tubes in its 4000 series of computer terminals. He left Tektronix in 1969.",
    ],
    sources: [
      s("press", "Robert H. Anderson: Putting The \"Storage\" In Oscilloscopes, Electronic Design (2011)", "https://www.electronicdesign.com/technologies/displays/article/21795615/robert-h-anderson-putting-the-storage-in-oscilloscopes"),
      s("paper", "The Haeff Memory and Graphics Tube of 1940s Opened a New Era of Computing, IEEE Annals of the History of Computing (2017)", "https://publications.computer.org/annals/2017/06/05/the-haeff-memory-and-graphics-tube/"),
    ],
  },
  "Donald Bitzer": {
    about: [
      "He took bachelor's and master's degrees in electrical engineering at the University of Illinois in 1955 and 1956, and a doctorate there in 1960.",
      "In 1963, needing a display for PLATO, the university's teaching network, he set the graduate student Robert Willson to explore the problem. Gene Slottow joined about a year later, and the three made the plasma display panel.",
      "Each cell of the panel stayed lit until new information was called for. The university says this let PLATO work without costly magnetic memory.",
      "The three received an Emmy Award from the National Academy of Television Arts and Sciences in 2002. He later became a Distinguished University Research Professor at North Carolina State University.",
    ],
    sources: [
      s("lab", "Plasma Display, Hall of Fame, Electrical and Computer Engineering, University of Illinois", "https://ece.illinois.edu/about/history/hall-of-fame/plasmas"),
      s("lab", "ECE alumni win Emmy for inventing the flat-panel plasma display, University of Illinois (2002)", "https://ece.illinois.edu/news/2541"),
    ],
  },
  "Gene Slottow": {
    about: [
      "H. Gene Slottow received his doctorate at the University of Illinois in 1964 and became a professor there.",
      "He joined Donald Bitzer and the graduate student Robert Willson about a year after Willson began work on a display for PLATO, the university's teaching network, in 1963. The three made the plasma display panel, which kept its picture without constant refreshing.",
      "He died in 1989, three years after retiring from the university's electrical and computer engineering faculty. The Emmy Award the three received in 2002 came after his death.",
    ],
    sources: [
      s("lab", "Plasma Display, Hall of Fame, Electrical and Computer Engineering, University of Illinois", "https://ece.illinois.edu/about/history/hall-of-fame/plasmas"),
      s("lab", "ECE alumni win Emmy for inventing the flat-panel plasma display, University of Illinois (2002)", "https://ece.illinois.edu/news/2541"),
    ],
  },
  "Robert Willson": {
    about: [
      "A graduate student of Donald Bitzer and Gene Slottow at the University of Illinois, he took his doctorate there in 1966.",
      "In 1963 Bitzer set him to explore a display for PLATO, the university's teaching network, that could show images laid over each other. Slottow joined the discussion of his results about a year later, and the three made the plasma display panel.",
      "He shared the Emmy Award of 2002 with them, and later worked as an engineer with Analex Corporation in Alexandria, Virginia.",
    ],
    sources: [
      s("lab", "Plasma Display, Hall of Fame, Electrical and Computer Engineering, University of Illinois", "https://ece.illinois.edu/about/history/hall-of-fame/plasmas"),
      s("lab", "ECE alumni inducted into the National Inventors Hall of Fame, University of Illinois", "https://ece.illinois.edu/news/3099"),
      s("lab", "ECE alumni win Emmy for inventing the flat-panel plasma display, University of Illinois (2002)", "https://ece.illinois.edu/news/2541"),
    ],
  },
  "Nicholas Sheridon": {
    about: [
      "Nicholas Sheridon, a physicist, joined the Xerox Palo Alto Research Center in 1975. Instead of replacing paper with the computer monitor, he proposed replacing the monitor with something like paper, and soon had a crude working model.",
      "He called it Gyricon, from the Greek for rotating image. Thousands of tiny plastic spheres, each with a black half carrying a small charge, sat in a clear sheet of silicone rubber and turned when an electric field came near.",
      "MIT Technology Review records that the circuit boards behind his prototype were stiff, so it was more like a rigid electronic clipboard than a sheet of paper. In 1977 Xerox stopped his work on electronic paper.",
      "Xerox returned him to electronic paper in the mid 1990s, and he refined the way the spheres were made. By 2001 he was head of research at Gyricon Media, a company Xerox had spun off.",
    ],
    sources: [
      s("press", "Electronic Paper Turns the Page, MIT Technology Review (2001)", "https://www.technologyreview.com/s/400901/electronic-paper-turns-the-page/"),
      s("press", "Startups Struggle in the e-Paper Chase, MIT Technology Review (2001)", "https://www.technologyreview.com/2001/03/06/235986/startups-struggle-in-the-e-paper-chase/"),
    ],
  },
  "Martin Schadt": {
    about: [
      "A physicist, he was by his own account among the first physicists hired at the research laboratories of Hoffmann-La Roche in Basel, together with Wolfgang Helfrich.",
      "He wrote that in the autumn of 1970 he and Helfrich studied twisted layers of liquid crystal there. They filed a patent that December and published in February 1971. Kent State University dates James Fergason's finding of the same effect to 1969.",
      "In 1972 he built a prototype of a display that used the effect.",
    ],
    sources: [
      s("paper", "Schadt, How we made the liquid crystal display, Nature Electronics (2018)", "https://www.nature.com/articles/s41928-018-0119-8"),
      s("lab", "James Fergason passes away at 74 (1934-2008), Kent State University", "https://www.kent.edu/node/718356"),
    ],
  },
  "Wolfgang Helfrich": {
    about: [
      "A physicist at Hoffmann-La Roche in Basel, he studied twisted layers of liquid crystal with Martin Schadt from the autumn of 1970, by Schadt's account. They filed a patent that December. Kent State University dates James Fergason's finding of the same effect to 1969.",
      "He left for the Freie Universität Berlin after Roche temporarily stopped its liquid crystal research.",
    ],
    sources: [
      s("paper", "Schadt, How we made the liquid crystal display, Nature Electronics (2018)", "https://www.nature.com/articles/s41928-018-0119-8"),
      s("lab", "James Fergason passes away at 74 (1934-2008), Kent State University", "https://www.kent.edu/node/718356"),
    ],
  },
  "Fritz Fischer": {
    born: 1898, died: 1947, about: [
      "A physicist, he took up the new chair of technical physics at ETH Zurich, the Swiss Federal Institute of Technology, in 1933. The Neue Deutsche Biographie gives his birthplace as Oberdiessbach in the Emmental, Switzerland.",
      "He applied for a patent on the Eidophor, a projector for television pictures on a large screen, in November 1939. According to Baumann, writing in 1953, Fischer built the first prototype, which first ran in 1944.",
      "The Neue Deutsche Biographie says others completed the work after his death and developed it further for colour television.",
    ],
    sources: [
      s("paper", "Baumann, The Fischer Large-Screen Projection System, Journal of the SMPTE (1953)", "https://lantern.mediahist.org/catalog/journalofsociety60socirich_0353"),
      s("reference", "Fischer, Fritz, Historical Dictionary of Switzerland", "https://hls-dhs-dss.ch/it/articles/031341/"),
      s("reference", "Fritz Borgnis, Fischer, Fritz, Neue Deutsche Biographie 5 (1961)", "https://www.deutsche-biographie.de/sfz16222.html"),
    ],
  },
  "Joseph Ostoja-Kotkowski": {
    born: 1922, died: 1994, about: [
      "Born in Golub, Poland, he studied under Olgierd Vetesko in Poland and at the art academy of Düsseldorf in Germany. He migrated to Melbourne in 1949 and moved to South Australia in 1954, living at Stirling in the Adelaide Hills from 1955.",
      "The History Trust of South Australia says that work in the outback at the Leigh Creek coalfields in 1954 and 1955 set his artistic direction. On a Churchill Fellowship at Stanford University in 1967 he came across the laser.",
      "Back in Adelaide the Weapons Research Laboratory at Salisbury helped him make a laser beam that swept in time with voices or electronic music. The History Trust says Sound and Image may have been the first use of a laser in a theatre.",
      "In 1971 he designed a chromasonic tower at the Australian National University in Canberra. He later staged a laser kinetic show at Ballarat in 1984, and Synchronos '91 in Warsaw in 1991.",
    ],
    sources: [
      s("archive", "Josef Stanislaus Ostoja-Kotkowski, SA History Hub, History Trust of South Australia", "https://sahistoryhub.history.sa.gov.au/?p=18782"),
      s("archive", "Productions created by J. S. Ostoja-Kotkowski, PRG 919/29, State Library of South Australia", "https://collections.slsa.sa.gov.au/resource/PRG+919/29"),
    ],
  },
  "Joseph Plateau": {
    born: 1801, died: 1883, about: [
      "He was a Belgian, born in Brussels.",
      "The Science Museum Group credits him with the first demonstration of the illusion of a moving picture, with the phenakistoscope of 1832.",
    ],
    sources: [
      s("archive", "Joseph Plateau, Science Museum Group Collection", "https://collection.sciencemuseumgroup.org.uk/people/cp100187/joseph-plateau"),
    ],
  },
  "Gabriel Lippmann": {
    born: 1845, died: 1921, about: [
      "He received the Nobel Prize in Physics of 1908 for a way of photographing colours by the interference of light.",
      "In the same year he published his idea of integral photography in the Journal de Physique.",
    ],
    sources: [
      s("archive", "Gabriel Lippmann, Nobel Lecture, The Nobel Prize", "https://www.nobelprize.org/prizes/physics/1908/lippmann/lecture/"),
      s("paper", "Lippmann, Épreuves réversibles donnant la sensation du relief, Journal de Physique Théorique et Appliquée (1908)", "https://doi.org/10.1051/jphystap:019080070082100"),
      s("archive", "Gabriel Lippmann, Facts, The Nobel Prize", "https://www.nobelprize.org/prizes/physics/1908/lippmann/facts/"),
    ],
  },
  // ---- researched and written in batches on 22 November 2026, then read by the curator ----
  "Gino Valle": {
    born: 1923, died: 2003, about: [
      "An architect and industrial designer from Udine, he graduated from the University Institute of Architecture in Venice in 1948 and held a Fulbright scholarship at the Harvard Graduate School of Design in 1951. He taught architecture in Venice from 1954 to 2001.",
      "For Solari he designed the Cifra 5 clock of 1954 and 1955, which won the Compasso d'Oro in 1956. Finestre sull'Arte says he enlisted John Myer, who suggested the two numbered rollers inside it.",
      "His alphanumeric boards for airports and stations won a second Compasso d'Oro in 1962. His Cifra 3 clock of 1966, with lettering by Massimo Vignelli, entered the permanent collection of the Museum of Modern Art in New York in 1968.",
    ],
    sources: [
      s("archive", "Gino Valle, biography, Cooper Hewitt, Smithsonian Design Museum", "https://www-4.collection.cooperhewitt.org/people/1142028959/bio"),
      s("archive", "Gino Valle, clocks, and the fusion of technology and design, Fondazione Pirelli", "https://www.fondazionepirelli.org/en/activities/exhibitions/gino-valle-clocks-and-the-fusion-of-technology-and-design/"),
      s("press", "The Cifra 5 electromechanical clock: the Solari revolution, Finestre sull'Arte", "https://www.finestresullarte.info/en/works-and-artists/the-cifra-5-electromechanical-clock-the-solari-revolution"),
    ],
  },
  "John Myer": {
    about: [
      "The ADI Design Museum lists him among the four designers of the Cifra 5 clock, with Gino Valle, Nani Valle and Michele Provinciali.",
      "According to Finestre sull'Arte, more than fifty flaps for the minutes could not be fitted into the clock. Valle enlisted Myer, who suggested two numbered rollers, to make use of the combinations of their numbers.",
    ],
    sources: [
      s("archive", "Cifra 5 Electro-mechanical clock, ADI Design Museum", "https://www.adidesignmuseum.org/en/collection/cifra-5-electro-mechanical-clock/"),
      s("press", "The Cifra 5 electromechanical clock: the Solari revolution, Finestre sull'Arte", "https://www.finestresullarte.info/en/works-and-artists/the-cifra-5-electromechanical-clock-the-solari-revolution"),
    ],
  },
  "Paul Nipkow": {
    born: 1860, died: 1940, about: [
      "Born in Lauenburg in Pomerania, he began studying natural sciences in Berlin in 1882, where Adolf Slaby and Hermann Helmholtz were among his teachers. Lack of money ended his studies.",
      "His patent for an electric telescope took effect from 6 January 1884. The German Patent and Trade Mark Office says he probably never tried to build it, and that it could hardly have worked at the time.",
      "He worked as an engineer of railway signals for Zimmermann & Buchloh near Berlin. After 1933 the Nazi government used him in its propaganda, and the patent office records that the world's first regular television station was named after him.",
    ],
    sources: [
      s("archive", "The Nipkow disc, Inventions that made history, Deutsches Patent- und Markenamt", "https://www.dpma.de/en/explore/milestones/inventions-that-made-history/nipkow-disc"),
    ],
  },
  "John Logie Baird": {
    born: 1888, died: 1946, about: [
      "Born in Helensburgh, he studied at the Glasgow and West of Scotland Technical College. The Science Museum Group says the First World War interrupted his course and he never graduated. In 1915 he joined the Clyde Valley Electrical Power Company.",
      "Working in Hastings, he transmitted the silhouette of a Maltese cross in 1924. In 1927 he sent a picture about 705 kilometres from London to Glasgow by telephone line, and in 1928 to New York by short-wave radio.",
      "The BBC tried his mechanical system against the electronic one of Marconi-EMI and had dropped his by 1937. In the 1940s he worked on colour and stereoscopic television.",
    ],
    sources: [
      s("archive", "John Logie Baird 1888 to 1946, Science Museum Group Collection", "https://collection.sciencemuseumgroup.org.uk/people/cp3684/john-logie-baird"),
    ],
  },
  "Daniel Rozin": {
    born: 1961, about: [
      "He took a degree at the Bezalel Academy of Art and Design in Jerusalem and then spent about ten years as an industrial designer for a large company in Israel.",
      "He came to the Interactive Telecommunications Program at New York University for a master's degree, stayed on after graduating, and teaches there as an arts professor in the Tisch School of the Arts.",
      "In an interview for the Interactive Telecommunications Program he said Wooden Mirror took close to a year to build and one afternoon to program. A camera and hundreds of motors make its wooden pieces follow the movement of the person in front of it.",
      "His work has been shown at the Victoria and Albert Museum in London and the Israel Museum in Jerusalem. His awards include the Prix Ars Electronica and the Rothschild Prize.",
    ],
    sources: [
      s("lab", "Daniel Rozin, Adjacent, ITP, New York University", "https://itp.nyu.edu/adjacent/?p=104"),
      s("archive", "Daniel Rozin, artist page, bitforms gallery", "https://bitforms.art/artist/daniel-rozin/"),
    ],
  },
  "Daniel Leithinger": {
    about: [
      "He took bachelor's and master's degrees at the Upper Austria University of Applied Sciences in Hagenberg in 2005 and 2007, and his doctorate at the MIT Media Lab in 2015.",
      "The Tangible Media Group credits inFORM, a shape display that renders three-dimensional content physically, to him, Sean Follmer and Hiroshi Ishii, and marks him and Follmer as equal contributors. He wrote its paper of 2013 with Follmer, Ishii and two others.",
      "From 2018 to 2023 he was an assistant professor of computer science at the University of Colorado Boulder, where he led the THING Lab at the ATLAS Institute. He then became a Design Tech Innovation Fellow at Cornell University.",
      "In 2015 he co-founded Lumii, now Fathom Optics, to develop 3D displays that need no glasses.",
    ],
    sources: [
      s("lab", "Daniel Leithinger, College of Architecture, Art, and Planning, Cornell University", "https://www.aap.cornell.edu/people/daniel-leithinger"),
      s("lab", "inFORM, Tangible Media Group, MIT Media Lab", "https://tangible.media.mit.edu/project/inform"),
    ],
  },
  "Sean Follmer": {
    about: [
      "He took a degree in engineering at Stanford University in 2009, then a master's in 2011 and a doctorate in 2015 at the MIT Media Lab.",
      "The Tangible Media Group credits inFORM, a shape display that renders three-dimensional content physically, to him, Daniel Leithinger and Hiroshi Ishii, and marks him and Leithinger as equal contributors.",
      "He returned to Stanford, where he is an associate professor of mechanical engineering and directs the Shape Lab. His research includes haptics, shape-changing interfaces and interfaces for people who are blind or visually impaired.",
    ],
    sources: [
      s("lab", "Sean Follmer, Stanford Profiles, Stanford University", "https://profiles.stanford.edu/sean-follmer"),
      s("lab", "inFORM, Tangible Media Group, MIT Media Lab", "https://tangible.media.mit.edu/project/inform"),
    ],
  },
  "Hiroshi Ishii": {
    about: [
      "He took degrees in electronic and computer engineering at Hokkaido University, ending with a doctorate in 1992. From 1988 to 1994 he led a research group at NTT Human Interface Laboratories, whose team built TeamWorkStation and ClearBoard.",
      "He joined the MIT Media Lab in October 1995 and set up the Tangible Media Group to pursue an idea he called Tangible Bits, in which people handle digital information through physical objects.",
      "In 2006 the Association for Computing Machinery's group on computer and human interaction elected him to its CHI Academy, for creating tangible user interfaces as a field. He became an associate director of the Media Lab in May 2008.",
    ],
    sources: [
      s("lab", "Hiroshi Ishii, biography, MIT Media Lab", "https://web.media.mit.edu/~ishii/bio.html"),
    ],
  },
  "Oleg Tretiakoff": {
    about: [
      "With Andrée Tretiakoff, both of Sceaux in France, he filed a United States patent in 1975, granted in 1977, for a braille panel. Each dot was a rod that a thin piezoelectric strip pushed up or drew down as it bent.",
      "The American Printing House for the Blind credits the pair with the first commercially available paperless braille machine, the Digicassette, introduced in Paris in 1976. It kept text on cassette tape and raised one line of braille at a time.",
      "A later patent of theirs, granted in 1981, was assigned to Triformation Systems. The American Printing House says braille displays of the following decades largely refined the Tretiakoff design.",
      "Their patent of 1981 said braille books were heavy, bulky and expensive to produce, which limited blind people's access to written information. It claims the priority of a French application of 22 August 1974, for a pocket electronic calculator for blind users.",
    ],
    sources: [
      s("patent", "Oleg Tretiakoff and Andree Tretiakoff, Electromechanical transducer for relief display panel, US patent 4,044,350 (1977)", "https://patents.justia.com/patent/4044350"),
      s("patent", "Oleg Tretiakoff and Andree Tretiakoff, Electromechanical transducer for relief display panel, US patent 4,305,067 (1981)", "https://patents.google.com/patent/US4305067"),
      s("archive", "Blindness History Basics: A Brief History of the Refreshable Braille Display, American Printing House for the Blind", "https://aph.org/blog/blindness-history-basics-a-brief-history-of-the-refreshable-braille-display/"),
    ],
  },
  "Andrée Tretiakoff": {
    about: [
      "She and Oleg Tretiakoff, both of Sceaux in France, filed a United States patent in 1975, granted in 1977. In it, six rods per braille cell were raised and lowered by bending piezoelectric strips.",
      "The American Printing House for the Blind credits the pair with the first commercially available paperless braille machine, the Digicassette, introduced in Paris in 1976. It stored text on cassette tape and raised one line of braille at a time.",
      "Their second United States patent, granted in 1981, was assigned to Triformation Systems and also covered braille data on magnetic tape. The American Printing House, which spells her name Andie, says braille displays of the following decades largely refined the Tretiakoff design.",
      "Their patent of 1981 said braille books were heavy, bulky and expensive to produce, which limited blind people's access to written information. It claims the priority of a French application of 22 August 1974, for a pocket electronic calculator for blind users.",
    ],
    sources: [
      s("patent", "Oleg Tretiakoff and Andree Tretiakoff, Electromechanical transducer for relief display panel, US patent 4,044,350 (1977)", "https://patents.justia.com/patent/4044350"),
      s("patent", "Oleg Tretiakoff and Andree Tretiakoff, Electromechanical transducer for relief display panel, US patent 4,305,067 (1981)", "https://patents.google.com/patent/US4305067"),
      s("archive", "Blindness History Basics: A Brief History of the Refreshable Braille Display, American Printing House for the Blind", "https://aph.org/blog/blindness-history-basics-a-brief-history-of-the-refreshable-braille-display/"),
    ],
  },
  "Klaus Peter Schönherr": {
    about: [
      "He founded Schoenherr GmbH in 1974, according to a collector's history of the Braillotron calculator. The same history says that in 1975 he invented a patented braille element able to show and erase characters.",
      "In 1977 Computerwoche reported a braille terminal from the firm, in use at the computing centre of the University of Tübingen since December 1976. The terminal widened the braille cell to eight dots, to cover a set of 96 characters.",
      "The collector's history says he received the Louis Braille Prize in 1980 and died in an accident in 1981. The American Printing House for the Blind says his company later became Handy Tech.",
    ],
    sources: [
      s("press", "Spezialtastatur mit Braille-Zeichen, Computerwoche (1977)", "https://www.computerwoche.de/article/2853120/spezialtastatur-mit-braille-zeichen.html"),
      s("press", "Bildschirm-Textsystem für Blinde, Computerwoche (1981)", "https://www.computerwoche.de/article/2879306/bildschirm-textsystem-fuer-blinde.html"),
      s("archive", "Blindness History Basics: A Brief History of the Refreshable Braille Display, American Printing House for the Blind", "https://aph.org/blog/blindness-history-basics-a-brief-history-of-the-refreshable-braille-display/"),
      s("reference", "TI history: Braillotron TI-30, facele.eu, after datamath.org", "https://facele.eu/index.php/history-and-curiosity/786-ti-history-13"),
    ],
  },
  "James Bryce": {
    born: 1880, died: 1949, about: [
      "He joined the Computing-Tabulating-Recording Company in 1917, became its chief engineer in 1923, and in 1926 organised the IBM Patent Department. He held more than 500 patents in the United States and abroad.",
      "His work included an automatic multiplying punch and the use of electron tubes for arithmetic. In 1936 the US Patent Office named him among ten living inventors at its centenary.",
      "The American Printing House for the Blind records a braille display begun by Bryce at IBM. It read text from perforated paper tape and raised the characters on a moving plastic belt. Arnold Grunwald later took it up at Argonne National Laboratory.",
    ],
    sources: [
      s("maker", "A legacy of invention, IBM History", "https://ibm.com/history/early-inventors"),
      s("archive", "James Wares Bryce, IT History Society", "https://ithistory.org/honoree/james-wares-bryce"),
      s("archive", "Blindness History Basics: A Brief History of the Refreshable Braille Display, American Printing House for the Blind", "https://aph.org/blog/blindness-history-basics-a-brief-history-of-the-refreshable-braille-display/"),
    ],
  },
  "Horst Hörtner": {
    about: [
      "In 1990 he co-founded the media art group x-space in Graz. He joined Ars Electronica in 1995 as technical director to help set up the Ars Electronica Center, which opened in 1996.",
      "With Gerfried Stocker he founded the Futurelab, which he ran as managing director from 1996 to 2024 and has since served as senior director. He has also been chief technology officer of Ars Electronica since 2020.",
      "He was granted patents on drone swarm flight. Ars Electronica names him as inventor of the spaxel, or space pixel, a lit drone of its swarm, which made its debut at the Cloud of Sound event, Klangwolke, in Linz in 2012.",
    ],
    sources: [
      s("lab", "Horst Hörtner, Ars Electronica Futurelab", "https://ars.electronica.art/futurelab/en/hoertner-horst/"),
      s("archive", "Drone 100: A World Record with 100 Points, Ars Electronica Blog (2016)", "https://ars.electronica.art/aeblog/?p=20615"),
    ],
  },
  "Kenjiro Takayanagi": {
    born: 1899, died: 1990, about: [
      "Born in what is now Hamamatsu, he trained at the teacher training school of the Tokyo Higher Technical School. In 1924 he became an assistant professor at the new Hamamatsu Higher Technical College and began his television research there.",
      "The picture he sent on 25 December 1926 was the Japanese character イ, read i. The IEEE records that in 1935 he made an Iconoscope and showed a television system that was electronic in both camera and receiver.",
      "At NHK his group set up a television station in 1939. In the Second World War he worked on radar and night vision equipment. He joined the Victor Company of Japan. Hayakawa Electric, now Sharp, made and sold his team's television set in 1953.",
      "The IEEE dedicated a Milestone to his work at Hamamatsu in 2009. He received the Order of Culture in 1981.",
    ],
    sources: [
      s("lab", "Kenjiro Takayanagi, Tokyo Institute of Technology", "https://www.titech.ac.jp/english/public-relations/about/stories/kenjiro-takayanagi"),
      s("archive", "Milestones: Development of Electronic Television, 1924 to 1941, IEEE, Engineering and Technology History Wiki (2009)", "https://ethw.org/Milestones%3ADevelopment_of_Electronic_Television%2C_1924-1941"),
    ],
  },
  "Philo Farnsworth": {
    born: 1906, died: 1971, about: [
      "Born in Beaver City, Utah, he sketched an electronic camera tube for his school science teacher, Justin Tolman, in 1922. He enrolled briefly at Brigham Young University and left for lack of money.",
      "Backed by the fundraisers George Everson and Leslie Gorrell, he set up a laboratory on the second floor of 202 Green Street, San Francisco. On 7 September 1927 it sent the image of a line drawn on a slide.",
      "The Radio Corporation of America challenged his patent in 1932. His lawyers produced Tolman's copy of the 1922 sketch, the court ruled in his favour in 1935, and in 1939 the company agreed to pay him royalties.",
      "He bought a radio plant at Fort Wayne, Indiana, hoping to make television receivers. It was sold to International Telephone and Telegraph in 1949. He was that company's consultant until 1967 and later worked on nuclear fusion as a source of power.",
    ],
    sources: [
      s("archive", "Philo Farnsworth, Linda Hall Library", "https://www.lindahall.org/philo-farnsworth"),
    ],
  },
  "Elma Farnsworth": {
    about: [
      "In Philo Farnsworth's laboratory in San Francisco she kept the logbooks. The Television Academy says she learned to use precision tools to construct the elements of the first tubes, and spot welded them.",
      "The Associated Press, citing a biography by Donald G. Godfrey, reported that Philo Farnsworth gave her equal credit in his invention. After he died in 1971 she spent decades pressing for his place in the history of television.",
      "The Television Academy credits her efforts in part for his entry to the National Inventors Hall of Fame. In 1990 she published Distant Vision, a book about her husband and his work.",
      "In 1996 the Academy's Archive of American Television recorded a seven hour interview with her. The Academy gives her year of birth as 1907, the Associated Press as 1908. She died in Bountiful, Utah, in 2006.",
    ],
    sources: [
      s("archive", "Elma Farnsworth passes at 98, Television Academy (2006)", "https://www.televisionacademy.com/news/elma-farnsworth-passes-98"),
      s("press", "Woman who helped invent TV dies at 98, Associated Press via NBC News (2006)", "https://www.nbcnews.com/news/amp/wbna12596707"),
    ],
  },
  "Marie Van Brittan Brown": {
    born: 1922, died: 1999, about: [
      "Born in Jamaica, in Queens, New York City, she worked long hours as a nurse and came home late at night. The Lemelson-MIT Program says she feared she was vulnerable in a neighbourhood with high crime, and wanted to see who was knocking.",
      "She and her husband, Albert Brown, filed a patent for their home security system as joint inventors on 1 August 1966. The Lemelson-MIT Program credits the invention to her, with his assistance.",
      "Besides the camera and monitors, the system had two-way microphones for speaking to the caller, a remote control to unlock the door from a distance, and an emergency button that raised an alarm with police or security.",
      "The New York Times reported on it, and she received an award from the National Scientists Committee. The Lemelson-MIT Program counts 32 later patent applications that cite the patent.",
    ],
    sources: [
      s("lab", "Marie Van Brittan Brown, Lemelson-MIT Program, Massachusetts Institute of Technology", "https://lemelson.mit.edu/resources/marie-van-brittan-brown"),
      s("patent", "Marie Van Brittan Brown and Albert L. Brown, Home security system utilizing television surveillance, US 3,482,037 (1969)", "https://patents.google.com/patent/US3482037A"),
    ],
  },
  "Albert Brown": {
    about: [
      "He and Marie Van Brittan Brown filed United States patent 3,482,037 as joint inventors on 1 August 1966. It was granted on 2 December 1969. Both were listed as living in Jamaica, in Queens, New York City.",
      "The patent describes a control unit with a microphone and loudspeaker, and a door fitted with a radio-controlled lock. The Lemelson-MIT Program says his wife made the invention with his assistance.",
    ],
    sources: [
      s("patent", "Marie Van Brittan Brown and Albert L. Brown, Home security system utilizing television surveillance, US 3,482,037 (1969)", "https://patents.google.com/patent/US3482037A"),
      s("lab", "Marie Van Brittan Brown, Lemelson-MIT Program, Massachusetts Institute of Technology", "https://lemelson.mit.edu/resources/marie-van-brittan-brown"),
    ],
  },
  "Mark Dean": {
    about: [
      "He studied at the University of Tennessee on its Minority Engineering Scholarship Program, graduated in 1979 and joined IBM at Boca Raton, Florida, that year. He also took a master's degree at Florida Atlantic University and a doctorate in electrical engineering at Stanford.",
      "He developed the IBM PC AT, according to the University of Tennessee Libraries. In 1997 the National Inventors Hall of Fame elected him and Dennis Moeller for the ISA bus, which IBM describes as a way of connecting printers, video cards and disk drives.",
      "IBM named him a Fellow in 1995 and records him as the first Black American to hold the title. His team built an experimental processor running at a billion cycles a second, dated 1994 by the University of Tennessee Libraries and 1998 by IBM.",
      "He became director of IBM's Almaden Research Center and then IBM's chief technology officer for the Middle East and Africa. He left IBM in 2013 to join the University of Tennessee College of Engineering as John Fisher Distinguished Professor.",
    ],
    sources: [
      s("maker", "Mark Dean, IBM History", "https://www.ibm.com/history/mark-dean"),
      s("lab", "Mark Dean, Volopedia, University of Tennessee Libraries", "https://volopedia.lib.utk.edu/entries/mark-dean/"),
    ],
  },
  "Guillermo González Camarena": {
    born: 1917, died: 1965, about: [
      "Born in Guadalajara, he built a radio transmitter at the age of eight. He graduated in 1939 from the Escuela Superior de Ingeniería Mecánica y Eléctrica of the Instituto Politécnico Nacional in Mexico City.",
      "He called his colour method the Sistema Tricromático Secuencial de Campos, Spanish for trichromatic field sequential system. The Gaceta UNAM says he launched colour television in Mexico years before the NTSC standard was adopted there.",
      "The NTSC standard used in the United States prevailed over his, and in the 1960s he devised a simpler two colour system.",
      "The Mexico City station XHGC, Channel 5, carries his initials, G and C.",
    ],
    sources: [
      s("lab", "Guillermo González Camarena, el color en la televisión, Gaceta UNAM, Universidad Nacional Autónoma de México", "https://www.gaceta.unam.mx/guillermo-gonzalez-camarena-el-color-en-la-television/"),
      s("archive", "Mexico's Color TV Pioneer: The Legacy of Guillermo González Camarena, Pavek Museum", "https://pavekmuseum.org/?p=2066"),
    ],
  },
  "A. Frankenstein": {
    about: [
      "According to Histoire de la télévision, A. Frankenstein was named with W. von Jaworski on German patent 172 376, dated 20 August 1904. The listing describes selenium cells, three colour filters and mirrors that split the picture into groups of points.",
      "The VDE, the German association of electrical engineers, places television proposals by Jaworsky and Frankenstein, among others, in 1903. Jaworsky is its spelling of the same co-applicant's name.",
    ],
    sources: [
      s("archive", "1900 to 1909, Histoire de la télévision (histv.net)", "https://www.histv.net/1900-1909"),
      s("archive", "Fernsehen und Bildübertragung, chronicle, VDE", "https://www.vde.com/de/geschichte/chronik/fernsehen-und-bilduebertragung"),
    ],
  },
  "W. von Jaworski": {
    about: [
      "Histoire de la télévision lists W. von Jaworski, ahead of A. Frankenstein, on German patent 172 376, dated 20 August 1904. Its title spoke of making pictures and objects visible at a distance with selenium cells, three colour filters and mirrors.",
      "The VDE, the German association of electrical engineers, places television proposals by Jaworsky and Frankenstein, among others, in 1903, spelling his name with a final y. Neither source gives his first name.",
    ],
    sources: [
      s("archive", "1900 to 1909, Histoire de la télévision (histv.net)", "https://www.histv.net/1900-1909"),
      s("archive", "Fernsehen und Bildübertragung, chronicle, VDE", "https://www.vde.com/de/geschichte/chronik/fernsehen-und-bilduebertragung"),
    ],
  },
  "Peter Goldmark": {
    born: 1906, died: 1977, about: [
      "Born in Budapest, he studied at the universities of Berlin and Vienna and moved to the United States in 1933. In 1936 he joined CBS as chief engineer of its television department.",
      "In 1940 he tested his colour system from the top of the Chrysler Building. The Federal Communications Commission approved it. It served in closed circuit work such as surgery, and sent pictures back from Apollo 15.",
      "The Museum of Broadcast Communications records that the CBS station in New York broadcast regularly in colour from 25 June 1951 and stopped on 19 October 1951, citing too few colour receivers. Lemelson-MIT says the system was never commercially used.",
      "The National Inventors Hall of Fame credits him with the long playing record of 1948 and records 77 patents. Lemelson-MIT credits Goldmark and his team. He received the National Medal of Science in 1977 and entered the Hall of Fame in 2007.",
    ],
    sources: [
      s("archive", "Peter C. Goldmark, National Inventors Hall of Fame (2007)", "https://invent.org/inductees/peter-c-goldmark"),
      s("lab", "Peter Goldmark, Lemelson-MIT Program, Massachusetts Institute of Technology", "https://lemelson.mit.edu/resources/peter-goldmark"),
      s("archive", "Color Television, Encyclopedia of Television, Museum of Broadcast Communications", "https://museum.tv/tv-encyclopedia-4/color-television"),
    ],
  },
  "Andrew Haeff": {
    born: 1904, about: [
      "Born in Moscow, he qualified as an engineer at the Russian Polytechnic Institute in Harbin in 1928 and took master's and doctoral degrees at the California Institute of Technology in 1929 and 1932. He worked at the RCA research laboratories from 1934 to 1941.",
      "He then joined the Naval Research Laboratory as a consultant in electronics. He was granted a patent for the Memory Tube in August 1947, and a tube of his type was used in the Whirlwind computer at the Massachusetts Institute of Technology.",
      "In 1950 he moved to Hughes Aircraft, where he set up its Electron Tube Laboratory, developed the Typotron for computer output, and became vice president and director of research. The IEEE History Center records him as first to receive the Harry Diamond Memorial Award.",
      "IEEE Spectrum calls him Andrei Haeff. The IEEE Annals of the History of Computing says Robert H. Anderson of Tektronix later simplified his design into a direct viewing storage tube.",
    ],
    sources: [
      s("archive", "Andrew V. Haeff, Engineering and Technology History Wiki, IEEE History Center", "https://ethw.org/Andrew_V._Haeff"),
      s("paper", "The Haeff Memory and Graphics Tube of 1940s Opened a New Era of Computing, IEEE Annals of the History of Computing (2017)", "https://publications.computer.org/annals/2017/06/05/the-haeff-memory-and-graphics-tube/"),
      s("press", "Andrei Haeff and the Amazing Microwave Amplifier, IEEE Spectrum", "https://spectrum.ieee.org/tech-history/dawn-of-electronics/andrei-haeff-and-the-amazing-microwave-amplifier"),
    ],
  },
  "David Hagelbarger": {
    about: [
      "He was a researcher at Bell Telephone Laboratories. The Computer Museum in Boston, in its report for winter 1987 to 1988, recorded his gift of a prototype Nixie tube made at AT&T Bell Laboratories and called him its inventor.",
      "The Computer History Museum now holds it as a gift of AT&T Bell Labs. Its catalogue says the Nixie was invented at Burroughs, and a donor's note gives the design to the Haydu brothers, about 1948, who sold the patent to Burroughs in 1952.",
      "A 1987 profile of Claude Shannon in Omni says Hagelbarger invented a machine that tried to guess whether a player would choose heads or tails. Shannon built a simpler version that beat it.",
    ],
    sources: [
      s("paper", "A. Michael Noll, Memories: A Personal History of Bell Telephone Laboratories (2015)", "https://worrydream.com/refs/Noll_2015_-_Memories,_A_Personal_History_of_Bell_Telephone_Laboratories.pdf"),
      s("press", "Anthony Liversidge, Profile of Claude Shannon, Omni (1987)", "https://gwern.net/doc/cs/algorithm/information/1987-liversidge.pdf"),
      s("archive", "The Computer Museum Report, volume 21, winter 1987 to 1988, The Collection", "https://tcm.computerhistory.org/reports/TCMReportWinter1987-88.pdf"),
      s("archive", "Nixie Tube Prototype, X672.86, Computer History Museum", "https://www.computerhistory.org/collections/catalog/X672.86"),
      s("archive", "Burroughs Nixie tube, X1588.99A, Computer History Museum", "https://www.computerhistory.org/collections/catalog/X1588.99A"),
    ],
  },
  "Tadashi Nakamura": {
    born: 1923, about: [
      "Born in Ise City, he set up Ise Electronics Corporation there in September 1966, to make and sell display devices. The company dates the basic structure of the display to 1966 and a single digit tube to 1967.",
      "He began delivering prototype samples to Hayakawa Electric, now Sharp, in March 1967, and the DG12B tube, made in quantity by Ise Electronics, went into Sharp's CS-16A. The patents were licensed to NEC and Futaba to meet demand.",
      "The Society for Information Display gave him a Special Recognition Award in 1979 and the Karl Ferdinand Braun Prize in 1991, shared with Kentaro Kiyozumi.",
      "On 4 November 2025 the Institute of Electrical and Electronics Engineers named the display one of its Milestones in engineering history, with a plaque at the company's main building in Taiki, Mie Prefecture. Its citation says he invented the display in 1967.",
    ],
    sources: [
      s("archive", "Milestones: Vacuum Fluorescent Displays, 1967, IEEE, Engineering and Technology History Wiki (2025)", "https://ethw.org/Milestones%3AVacuum_Fluorescent_Displays%2C_1967"),
      s("maker", "History of Noritake, Noritake Itron", "https://www.noritake-elec.com/about/history"),
    ],
  },
  "Tadashi Sasaki": {
    born: 1915, died: 2018, about: [
      "Born in Shimane Prefecture, he graduated in electrical engineering from Kyoto Imperial University in 1938. At Kawanishi Machine Works he researched and produced vacuum tubes, and he worked on radar during the Second World War.",
      "He moved to Hayakawa Electric, now Sharp, in 1964 at the request of its management. The Semiconductor History Museum of Japan says he took the lead in its calculator development.",
      "With North American Rockwell the company put the QT-8D microCompet, built on large-scale integrated circuits, on the market in 1969. He then worked on calculators that combined CMOS logic chips with liquid crystal displays, which reached mass production in 1973.",
      "He became senior managing director and executive vice president of the company, and later served it as an adviser. In 1994 he founded the International Center for Materials Research. The Institute of Electrical and Electronics Engineers made him an honorary member in 2003.",
    ],
    sources: [
      s("archive", "Tadashi Sasaki, Japanese Pioneers, Semiconductor History Museum of Japan", "https://shmj.or.jp/english/pioneers/pnr16.html"),
      s("press", "Katsuyuki Okawara, on the death of Tadashi Sasaki of Sharp, PC Watch, Impress (5 February 2018)", "https://pc.watch.impress.co.jp/docs/column/gyokai/1104807.html"),
    ],
  },
  "Lewis Latimer": {
    born: 1848, died: 1928, about: [
      "Born in Chelsea, Massachusetts, to parents who had escaped enslavement in Virginia, he left school at about nine, by the account of the United States Patent and Trademark Office. He served in the United States Navy during the American Civil War.",
      "At a Boston patent law firm he taught himself drafting, and the partners made him their draftsman at $5 less than his predecessor. The National Inventors Hall of Fame says he drew the plans for Alexander Graham Bell's first telephone patent application, of 1876.",
      "In 1880 he became assistant manager and mechanical draftsman to Hiram Maxim, and oversaw the installation of lighting plants in the United States, Canada and England. The patent office says Maxim took credit for his filament work, and many workers resented a Black supervisor.",
      "He then worked for Thomas Edison as a patent investigator and expert witness. He patented a railroad car toilet with Charles W. Brown in 1874 and a cooling and disinfecting apparatus in 1886, and taught drawing and English to immigrants in New York.",
    ],
    sources: [
      s("archive", "Bringing light for all, United States Patent and Trademark Office (2024)", "https://www.uspto.gov/learning-and-resources/journeys-innovation/historical-stories/bringing-light-all"),
      s("archive", "Lewis Latimer, National Inventors Hall of Fame", "https://www.invent.org/inductees/lewis-latimer"),
    ],
  },
  "Tsutae Shinoda": {
    about: [
      "He entered the engineering faculty of Hiroshima University in 1968, where his graduation research on protective layers for plasma panels was supervised by Heiju Uchiike. He joined Fujitsu Laboratories in 1973 and worked on AC plasma panels.",
      "After colour trials begun in 1979, he separated the electrodes that chose a cell from those that lit it, in 1982. In 1988 he put the phosphor layer behind the discharge. In 1990 he devised ribs in stripes on one of the two plates.",
      "The 21-inch model used his stripe rib structure, which eased the way to larger, sharper panels. The Society for Information Display gave him its Karl Ferdinand Braun Award in 2003 for the 21-inch and 42-inch colour panels.",
      "The Institute of Electrical and Electronics Engineers made him an honorary member in 2007, and recognised the colour plasma display as one of its Milestones in engineering history in May 2025.",
    ],
    sources: [
      s("archive", "Milestones: Color Plasma Television, 1993, Engineering and Technology History Wiki", "https://ethw.org/Milestones:Color_Plasma_Television,_1993"),
      s("maker", "Full-color Plasma Display (1992), Fujitsu museum", "https://global.fujitsu/en-global/about/corporate/museum/products/products/electroniccomponents-others-pdp"),
    ],
  },
  "Charles Spindt": {
    born: 1931, about: [
      "Born in San Jose, California, he left architecture studies at Berkeley for the United States Air Force and flew as an all-weather fighter interceptor pilot. He then took a degree in electrical engineering at San Jose State.",
      "He joined Stanford Research Institute, now SRI International, in 1959, hired by Kenneth Shoulders. The conference says that in 1966 he worked out how to make the cathode named after him, an array of microscopic tips that emit electrons at under 100 volts.",
      "He published it in the Journal of Applied Physics in 1968. SRI's own history dates the cathode to 1973. He, Shoulders and Louis Heynick were named on patents for its structures, granted in 1973, and for methods of making them, granted in 1974.",
      "He co-founded the vacuum microelectronics conference of the Institute of Electrical and Electronics Engineers in 1988 and won the Jan Rajchman Prize of the Society for Information Display in 1996. He retired from SRI in 2002. The conference reported his death at 92.",
    ],
    sources: [
      s("archive", "Charles A. Capp Spindt dies at 92, International Vacuum Nanoelectronics Conference", "https://www.vacuumnanoelectronics.org/?p=7802"),
      s("press", "Member profile, Capp Spindt, Sons in Retirement Branch 35 (2015)", "https://www.sirinc2.org/branch35/wp-content/uploads/2016/02/Member-Profile-Jun-2015.pages.pdf"),
      s("lab", "Spindt cold cathode for displays, SRI International", "https://www.sri.com/hoi/spindt-cold-cathode-for-displays/"),
      s("patent", "Spindt, Shoulders and Heynick, US patent 3,755,704 (1973)", "https://patents.google.com/patent/US3755704A/en"),
      s("patent", "Spindt, Shoulders and Heynick, methods of producing field emission cathode structures, US patent 3,789,471 (1974)", "https://patents.google.com/patent/US3789471A"),
    ],
  },
  "Kenneth Shoulders": {
    born: 1927, died: 2013, about: [
      "Born in Texas, he was on the research staff of the Massachusetts Institute of Technology from 1955 to 1958. There he studied microfabrication for field emission amplifiers and magnetic film memories, often working with Dudley A. Buck.",
      "Stanford Research Institute hired him in 1958 as a senior research engineer. He worked on very small devices, field emission elements among them, and built the vacuum systems for evaporation and multi beam exposure used to develop the Spindt cathode array.",
      "With Charles Spindt and Louis Heynick he was named on United States patents for field emission cathode structures, granted in 1973, and for methods of producing them, granted in 1974.",
      "He hired Charles Spindt at the institute in 1959. After leaving it he studied charge clusters at a private laboratory in Bodega, California. His papers are held by the Science History Institute in Philadelphia.",
    ],
    sources: [
      s("archive", "Kenneth R. Shoulders papers, Science History Institute, finding aid (2015)", "https://findingaids.library.upenn.edu/records/legacy/SCIHIST_2015003USpaphchf"),
      s("archive", "Kenneth Radford Shoulders, International Vacuum Nanoelectronics Conference", "https://www.vacuumnanoelectronics.org/?p=3617"),
      s("patent", "Spindt, Shoulders and Heynick, US patent 3,755,704 (1973)", "https://patents.google.com/patent/US3755704A/en"),
      s("patent", "Spindt, Shoulders and Heynick, methods of producing field emission cathode structures, US patent 3,789,471 (1974)", "https://patents.google.com/patent/US3789471A"),
    ],
  },
  "Louis Heynick": {
    about: [
      "Louis N. Heynick was named with Charles Spindt and Kenneth Shoulders on the United States patent for field emission cathode structures with a cellular array of emission sites. It was filed in February 1970 and issued in August 1973, assigned to Stanford Research Institute.",
      "The same three were named on a second patent, granted in 1974, for methods of producing such structures.",
      "In March 1983, with Peter Polson, he wrote a review of the biological effects of radiofrequency radiation for the United States Air Force School of Aerospace Medicine, as a project of SRI International, the later name of Stanford Research Institute.",
    ],
    sources: [
      s("patent", "Spindt, Shoulders and Heynick, Field emission cathode structures, US patent 3,755,704 (1973)", "https://patents.google.com/patent/US3755704A/en"),
      s("paper", "Heynick and Polson, Bioeffects of radiofrequency radiation, SAM-TR-83-1, SRI International (1983)", "https://apps.dtic.mil/sti/pdfs/ADA128515.pdf"),
      s("patent", "Spindt, Shoulders and Heynick, methods of producing field emission cathode structures, US patent 3,789,471 (1974)", "https://patents.google.com/patent/US3789471A"),
    ],
  },
  "Akintunde Akinwande": {
    about: [
      "He took a bachelor's degree in electrical and electronic engineering at the University of Ife, Nigeria, in 1978, and a master's in 1981 and a doctorate in 1986 in electrical engineering at Stanford University.",
      "At Honeywell he began with research on complementary field effect transistors in gallium arsenide. He then moved to its silicon microstructures group, where he worked on pressure sensors, accelerometers, and thin-film field emission and display devices.",
      "He moved to the Microsystems Technology Laboratories at the Massachusetts Institute of Technology in January 1995. There his research has covered vacuum microelectronics, flat panel displays, large area electronics, field emission and field ionisation devices, mass spectrometry and electric propulsion.",
      "He received a National Science Foundation CAREER award in 1996. At MIT he is the Thomas and Gerd Perkins Professor of Electrical Engineering and Computer Science. He directs Empowering the Teachers, a teaching fellowship for young Nigerian faculty in science and engineering.",
    ],
    sources: [
      s("lab", "Akintunde Akinwande, MIT Center for International Studies", "https://cis.mit.edu/our-people/akintunde-akinwande"),
      s("lab", "Akintunde Ibitayo Akinwande, MIT Microsystems Technology Laboratories", "https://mtlsites.mit.edu/users/akinwand/"),
      s("archive", "MTL's Akintunde Ibitayo Akinwande, MIT Black History Project (2015)", "https://mitblackhistory.blogspot.com/2015/10/mtls-akintunde-ibitayo-akinwande.html"),
    ],
  },
  "Howard Borden": {
    about: [
      "Howard C. Borden began work as a mechanical engineer in 1939. He studied mechanical engineering at the Massachusetts Institute of Technology and electronics at the United States Navy Radio Materiel School, and took a BA in economics at Stanford University in 1961.",
      "After Navy service and more engineering work he bought an appliance store, added television to its trade and saw it grow. He joined Hewlett-Packard in 1966. By 1969 he had spent 11 years in electro optical and mechanical research and development.",
      "In February 1969 he and Gerald Pighini wrote the Hewlett-Packard Journal article on the company's 5082-7000 solid-state display. Both were managers of solid-state displays at HP Associates, whose group made the light emitting diodes and tested and assembled the displays.",
      "The article credits the development work to John Atalla's solid-state laboratory at Hewlett-Packard Laboratories.",
    ],
    sources: [
      s("maker", "Solid-State Displays, contributed-author biography, Hewlett-Packard Journal (1969)", "https://worldradiohistory.com/Archive-Company-Publications/HP-Journal/60s/HPJ-1969-02.pdf"),
    ],
  },
  "Gerald Pighini": {
    about: [
      "Gerald P. Pighini took a bachelor's degree in metallurgical engineering at the Brooklyn Polytechnic Institute in 1955 and worked in solid-state electronics from then on. Before Hewlett-Packard he was chief manufacturing engineer for a maker of semiconductor devices.",
      "He joined Hewlett-Packard in 1965 as chief engineer of Hewlett-Packard Associates and became its production manager for semiconductors. He then managed solid-state displays, and co-wrote a paper on growing large wafers of gallium arsenide phosphide for making LEDs.",
      "With Howard Borden he wrote the article in the Hewlett-Packard Journal of February 1969 that introduced the company's Model 5082-7000 numeric indicator, built from gallium arsenide phosphide LEDs and an integrated circuit. The article credits the development work to colleagues.",
    ],
    sources: [
      s("maker", "Solid-State Displays, contributed-author biography, Hewlett-Packard Journal (1969)", "https://worldradiohistory.com/Archive-Company-Publications/HP-Journal/60s/HPJ-1969-02.pdf"),
    ],
  },
  "Isamu Akasaki": {
    born: 1929, died: 2021, about: [
      "He graduated from Kyoto University in 1952 and joined the research staff of Kobe Kogyo Corporation. From 1959 he taught in the electronics department of Nagoya University, which awarded him a doctorate in engineering in 1964.",
      "From 1964 he headed a fundamental research laboratory at Matsushita Research Institute Tokyo, and later its semiconductor department. He returned to Nagoya University as professor of electronics in 1981, and from 1992 was also a professor at Meijo University.",
      "At Nagoya in the 1980s he and Hiroshi Amano grew thin films of gallium nitride crystal of high quality by metal organic vapour phase epitaxy. From 1987 to 1990 he led a project to develop gallium nitride blue LEDs.",
    ],
    sources: [
      s("archive", "Isamu Akasaki, Biographical, The Nobel Prize", "https://nobelprize.org/prizes/physics/2014/akasaki/biographical"),
      s("archive", "Isamu Akasaki, Facts, The Nobel Prize", "https://www.nobelprize.org/prizes/physics/2014/akasaki/facts/"),
      s("press", "Japanese Nobel-prize-winning semiconductor pioneer Isamu Akasaki dies aged 92, Physics World (2021)", "https://physicsworld.com/a/japanese-nobel-prize-winning-semiconductor-pioneer-isamu-akasaki-dies-aged-92/"),
    ],
  },
  "Hiroshi Amano": {
    born: 1960, about: [
      "Born in Hamamatsu, he studied electrical engineering at Nagoya University and joined the nitride semiconductor group of Isamu Akasaki as an undergraduate in 1982. He took his degrees there in 1983, 1985 and 1989.",
      "In 1985, in Akasaki's group, he grew smooth gallium nitride crystal on sapphire over a low temperature buffer layer. There in 1989 he made a gallium nitride LED with a p-n junction, which the Lindau Nobel Laureate Meetings records as the first.",
      "He was a research associate at Nagoya University from 1988 and became a professor at Meijo University in 2002. He returned to Nagoya University in 2010, and in 2015 became director of its Center for Integrated Research of Future Electronics.",
    ],
    sources: [
      s("archive", "Hiroshi Amano, Facts, The Nobel Prize", "https://www.nobelprize.org/prizes/physics/2014/amano/facts/"),
      s("archive", "Hiroshi Amano, curriculum vitae, Lindau Nobel Laureate Meetings Mediatheque", "https://mediatheque.lindau-nobel.org/laureates/amano/cv"),
    ],
  },
  "Shuji Nakamura": {
    born: 1954, about: [
      "Born in Ehime, he studied electrical engineering at the University of Tokushima, taking degrees in 1977 and 1979 and a doctorate in 1994. He joined Nichia Chemical Industries in 1979 and spent 1988 at the University of Florida as a visiting research associate.",
      "In 1989 he began work on blue LEDs made of gallium nitride and related nitrides. In 1990 he built a system for growing gallium nitride, called Two-Flow MOCVD, and in 1991 he made p-type gallium nitride films by heat treatment.",
      "Nichia began selling white LEDs based on his blue LEDs in 1996, and violet laser diodes for Blu-ray discs in 1999. From 2000 he was a professor of materials and of electrical and computer engineering at the University of California, Santa Barbara.",
    ],
    sources: [
      s("lab", "Shuji Nakamura, Solid State Lighting and Energy Electronics Center, University of California, Santa Barbara", "https://ssleec.ucsb.edu/nakamura"),
    ],
  },
  "Ching Wan Tang": {
    born: 1947, about: [
      "He took a science degree at the University of British Columbia in 1970 and a doctorate in chemistry at Cornell University in 1975.",
      "He joined Eastman Kodak as a research scientist in 1975. With Steven Van Slyke he found a metal chelate that gave a lasting glow. The National Inventors Hall of Fame lists US patent 4,356,429 for the OLED and inducted him in 2018.",
      "He retired from Kodak in 2006 as a Distinguished Fellow of the Kodak Research Laboratories and joined the chemical engineering department of the University of Rochester. He received the Wolf Prize in Chemistry in 2011 and the Kyoto Prize in 2019.",
    ],
    sources: [
      s("archive", "Ching Wan Tang, National Inventors Hall of Fame", "https://invent.org/inductees/ching-wan-tang"),
      s("lab", "Ching Tang, emeritus faculty, Department of Chemical Engineering, University of Rochester", "https://hajim.rochester.edu/che/people/emeritus_faculty/tang_ching/index.html"),
      s("lab", "Ching Tang award, University of Rochester News Center", "https://www.rochester.edu/newscenter/ching-tang-award"),
      s("lab", "Kyoto Prize for Ching Tang, University of Rochester News Center (2019)", "https://www.rochester.edu/newscenter/kyoto-prize-ching-tang-oled-technology-387032/"),
    ],
  },
  "Steven Van Slyke": {
    born: 1956, about: [
      "He studied chemistry at Ithaca College, graduating in 1978, and took a master's degree in materials science at the Rochester Institute of Technology. Kodak was his first job after college, and the National Inventors Hall of Fame dates his start there to 1979.",
      "With Ching Wan Tang he searched Kodak's chemical library and found a metal chelate that gave a lasting glow. He then spent about fifteen years on the basic science of electroluminescence.",
      "In the mid 1990s he moved to process engineering and helped license the technology for a car audio display of 1996. The Hall of Fame records 40 patents of his on OLED materials and device design, and inducted him with Tang in 2018.",
      "Kodak sold its OLED intellectual property in 2009. He then joined Kateeva, a start-up in Silicon Valley that worked on inkjet printing of OLED panels, as chief technology officer.",
    ],
    sources: [
      s("archive", "Steven Van Slyke, National Inventors Hall of Fame", "https://invent.org/inductees/steven-van-slyke"),
      s("lab", "Alumnus Inducted into National Inventors Hall of Fame, Ithaca College (2018)", "https://www.ithaca.edu/news/alumnus-inducted-national-inventors-hall-fame"),
      s("archive", "Ching Wan Tang, National Inventors Hall of Fame", "https://invent.org/inductees/ching-wan-tang"),
    ],
  },
  "Hongxing Jiang": {
    about: [
      "He took a degree at Fudan University in Shanghai and a doctorate in physics at Syracuse University in 1986. After two years as a research associate at Michigan State University he joined the physics faculty of Kansas State University in 1988.",
      "At Kansas State, by their own account, he and Jingyu Lin saw blue light from a gallium nitride microLED 12 micrometres across in August 1999. In November 2000 they built a microdisplay of 10 by 10 microLEDs.",
      "He directed the Kansas Advanced Semiconductor Coordinated Laboratory from 1998 to 2008, when he and Lin moved their group to Texas Tech University. His Texas Tech CV dates a microdisplay of 640 by 480 pixels, driven by a silicon chip, to 2009.",
      "The pair's own account dates their report of an actively driven microdisplay to July 2011. Both held Horn professorships at Texas Tech. In 2021 the International SSL Alliance gave him an award citing the invention of the microLED.",
    ],
    sources: [
      s("lab", "Hongxing Jiang, curriculum vitae, Texas Tech University (2023)", "https://www.depts.ttu.edu/ece/faculty/hongxing_jiang/hongxing_jiang_2023.pdf"),
      s("lab", "MicroLED: Small Size, Big Impact, Texas Tech University (2018)", "https://www.depts.ttu.edu/research/discoveries/posts/fall-2018/LED.php"),
      s("paper", "Jiang and Lin, How we made the microLED, Nature Electronics (2023)", "https://www.depts.ttu.edu/ece/Nanophotonics/papers/2023How%20we%20made%20the%20microLED_Nature%20electronics.pdf"),
    ],
  },
  "Jingyu Lin": {
    about: [
      "She studied physics at the State University of New York College at Oneonta and at Syracuse University, where she took a doctorate in 1989. She was then a professor of physics at Kansas State University.",
      "There, by their own account, she and Hongxing Jiang saw blue light from a gallium nitride microLED 12 micrometres across in August 1999. Everybody else was working on normal size LEDs, she told Texas Tech, so they thought smaller ones would have many uses.",
      "They filed a patent together and in November 2000 built a 10 by 10 microdisplay. They wrote that no funding agency would then pay for a display driven by a silicon chip, until their company III-N Technology won funding from the United States Army.",
      "In 2008 she and Jiang moved their group to Texas Tech University. There she held a Horn professorship and the Linda F. Whitacre Chair in Electrical and Computer Engineering, and co-directed the Nano-Photonics Center. She became a National Academy of Inventors fellow in 2018.",
    ],
    sources: [
      s("lab", "Jingyu Lin, PhD, Department of Electrical and Computer Engineering, Texas Tech University", "https://www.depts.ttu.edu/ece/faculty/jingyu_lin/index.php"),
      s("lab", "Research Spotlight on Women Faculty: Su Shin and Jingyu Lin, Texas Tech University (2020)", "https://www.depts.ttu.edu/research/research-discoveries/posts/2020/03/6-shin-lin.php"),
      s("lab", "MicroLED: Small Size, Big Impact, Texas Tech University (2018)", "https://www.depts.ttu.edu/research/discoveries/posts/fall-2018/LED.php"),
      s("paper", "Jiang and Lin, How we made the microLED, Nature Electronics (2023)", "https://www.depts.ttu.edu/ece/Nanophotonics/papers/2023How%20we%20made%20the%20microLED_Nature%20electronics.pdf"),
    ],
  },
  "Vicki Colvin": {
    about: [
      "She took a degree in chemistry and physics at Stanford University in 1988 and a doctorate in chemistry at the University of California, Berkeley, in 1994. Louisiana State University says she developed there the original technology for using colloidal quantum dots in displays.",
      "In 1994 she, M. C. Schlamp and Paul Alivisatos reported in Nature that the colour of their diode ran from red to yellow with the size of its nanocrystals, at only 4 volts.",
      "At Rice University she was a professor of chemistry and vice provost for research, and directed the National Science Foundation's Center for Biological and Environmental Nanotechnology.",
      "She moved to Brown University, where she was provost from July 2015 to July 2016 and directed the Center for Biomedical Engineering. In 2024 Louisiana State University named her dean of its College of Engineering.",
    ],
    sources: [
      s("lab", "Vicki Colvin, PRIME programme, Brown University", "https://prime.brown.edu/people/vicki-colvin"),
      s("lab", "LSU Names Vicki Colvin New Dean of the College of Engineering, Louisiana State University (2024)", "https://www.lsu.edu/mediacenter/news/2024/05/6_engineering_dean.php"),
      s("paper", "Colvin, Schlamp and Alivisatos, Light-emitting diodes made from cadmium selenide nanocrystals and a semiconducting polymer, Nature (1994)", "https://www.nature.com/articles/370354a0"),
    ],
  },
  "M. C. Schlamp": {
    about: [
      "Schlamp worked with Paul Alivisatos in the Department of Chemistry at the University of California, Berkeley, the affiliation given on their papers of 1994 and 1997.",
      "In 1994 Schlamp, Vicki Colvin and Alivisatos reported in Nature a diode that paired cadmium selenide nanocrystals with the semiconducting polymer PPV. Its colour ran from red to yellow with the size of the nanocrystals, at only 4 volts.",
      "In 1997 Schlamp, Xiaogang Peng and Alivisatos reported diodes in the Journal of Applied Physics that paired PPV with cadmium selenide nanocrystals in cadmium sulphide shells. They glowed red to green, from as little as 4 volts.",
    ],
    sources: [
      s("paper", "Colvin, Schlamp and Alivisatos, Light-emitting diodes made from cadmium selenide nanocrystals and a semiconducting polymer, Nature (1994)", "https://www.nature.com/articles/370354a0"),
      s("archive", "Improved efficiencies in light emitting diodes made with CdSe(CdS) core/shell type nanocrystals and a semiconducting polymer, Journal of Applied Physics, record at OSTI (1997)", "https://www.osti.gov/biblio/552972"),
      s("archive", "Schlamp, Peng and Alivisatos, Improved efficiencies in light emitting diodes, AIP record at KOBV (1997)", "https://ilse.kobv.de/KobvIndexRecord/nat_lic_papers_NLZ218473621"),
    ],
  },
  "Paul Alivisatos": {
    about: [
      "He studied chemistry at the University of Chicago, graduating in 1981, and took a doctorate at the University of California, Berkeley, in 1986. He taught at Berkeley from 1988 to 2021, latterly as executive vice chancellor and provost.",
      "From 2009 to 2016 he directed the Lawrence Berkeley National Laboratory. His group worked on controlling the size and shape of nanocrystals, and he was a founder of two companies, Quantum Dot Corp and Nanosys.",
      "In 1994 he, Vicki Colvin and M. C. Schlamp reported in Nature a diode of cadmium selenide nanocrystals and a semiconducting polymer, its colour set by the size of the nanocrystals. The University of Chicago says his inventions are used in QLED television displays.",
      "He became the fourteenth president of the University of Chicago on 1 September 2021.",
    ],
    sources: [
      s("lab", "About President Alivisatos, University of Chicago", "https://president.uchicago.edu/biography"),
      s("lab", "Nanocrystals, Research Review, Lawrence Berkeley National Laboratory (2001)", "https://www2.lbl.gov/Science-Articles/Research-Review/Magazine/2001/Fall/features/02Nanocrystals.html"),
      s("paper", "Colvin, Schlamp and Alivisatos, Light-emitting diodes made from cadmium selenide nanocrystals and a semiconducting polymer, Nature (1994)", "https://www.nature.com/articles/370354a0"),
    ],
  },
  "Aleksey Yekimov": {
    born: 1945, about: [
      "He graduated in physics from Leningrad State University in 1967 and took a doctorate at the Ioffe Physical-Technical Institute in 1974. He then did research at the Vavilov State Optical Institute in Leningrad.",
      "With his doctoral student Alexei Onushchenko he tinted silicate glass with copper chloride. The temperature of the process set the size of the crystals, from a few to tens of nanometres. In 1981 he traced the effect to quantum confinement.",
      "From 1999 he was chief scientist at Nanocrystals Technology Inc. in New York. He shared the Nobel Prize in Chemistry of 2023 with Louis Brus and Moungi Bawendi, for the discovery and synthesis of quantum dots.",
      "Optica and Britannica spell his name Ekimov.",
    ],
    sources: [
      s("archive", "Aleksey Ekimov, biography, Optica", "https://optica.org/History/Biographies/bios/Aleksey_Ekimov"),
      s("press", "Makers of quantum dots share Nobel Prize in Chemistry, Physics Today (2023)", "https://physicstoday.aip.org/news/makers-of-quantum-dots-share-nobel-prize-in-chemistry"),
      s("press", "TASS (2023)", "https://tass.com/science/1684603"),
      s("reference", "Alexey Ekimov, Encyclopaedia Britannica", "https://www.britannica.com/print/article/2233151"),
    ],
  },
  "Louis Brus": {
    born: 1943, died: 2026, about: [
      "Born in Cleveland, he studied at Rice University on a Navy scholarship and took a doctorate in physical chemistry at Columbia University in 1969. He then served as a scientific staff officer at the Naval Research Laboratory in Washington.",
      "He worked at Bell Laboratories from 1973 to 1996. There, in 1983, he made the nanocrystals later known as quantum dots.",
      "In 1996 he joined the chemistry department at Columbia University. He shared the Nobel Prize in Chemistry of 2023 with Aleksey Yekimov and Moungi Bawendi.",
    ],
    sources: [
      s("maker", "In memoriam: Louis E. Brus, Nokia Bell Labs (2026)", "https://www.nokia.com/blog/in-memoriam-louis-e-brus-nobel-prize-winner-and-inventor-of-quantum-dots/"),
      s("archive", "Louis Brus, Facts, The Nobel Prize (2023)", "https://www.nobelprize.org/prizes/chemistry/2023/brus/facts"),
    ],
  },
  "Moungi Bawendi": {
    about: [
      "He took an undergraduate degree at Harvard University in 1982 and a doctorate at the University of Chicago in 1988. As a postdoctoral researcher he worked with Louis Brus at AT&T Bell Laboratories.",
      "He joined the faculty of the Massachusetts Institute of Technology in 1990 and became the Lester Wolfe Professor of Chemistry. His group grew dots of a chosen size by varying the conditions under which they crystallised.",
      "He later found ways to control how efficiently the dots gave off light and to curb their habit of blinking on and off.",
    ],
    sources: [
      s("lab", "MIT chemist Moungi Bawendi shares Nobel Prize in Chemistry, MIT News (2023)", "https://news.mit.edu/index%2Ephp/2023/mit-chemist-moungi-bawendi-shares-nobel-prize-chemistry-1004"),
    ],
  },
  "Xiaogang Peng": {
    about: [
      "With M. C. Schlamp and Paul Alivisatos at the University of California, Berkeley, the chemist Xiaogang Peng reported in 1997 diodes made with nanocrystals that had a core and a shell.",
      "At the University of Arkansas he held the Scharlau professorship of chemistry and biochemistry and worked on ways to grow nanocrystals of high quality in solution. In 2002 he and colleagues founded NN-Labs to sell nanocrystals.",
      "He later moved to the Department of Chemistry at Zhejiang University. There he, Yizheng Jin and others reported in Nature in 2014 a red diode with a thin insulating layer between the dots and the oxide layer that carried electrons.",
      "The paper says that he and Jin designed the experiments and supervised the work.",
    ],
    sources: [
      s("archive", "Schlamp, Peng and Alivisatos, Improved efficiencies in light emitting diodes, AIP record at KOBV (1997)", "https://ilse.kobv.de/KobvIndexRecord/nat_lic_papers_NLZ218473621"),
      s("archive", "Improved efficiencies in light emitting diodes made with CdSe(CdS) core/shell type nanocrystals, record at OSTI (1997)", "https://www.osti.gov/biblio/552972"),
      s("lab", "Spin-off Company Helps Customers See the Light, University of Arkansas (2005)", "https://news.uark.edu/articles/11471/spin-off-company-helps-customers-see-the-light"),
      s("lab", "ZJU Newsroom, Zhejiang University (2019)", "https://www.zju.edu.cn/english/_t874/2019/0624/c19573a1270668/page.htm"),
      s("paper", "Dai, Zhang, Jin and others, Solution-processed, high-performance light-emitting diodes based on quantum dots, Nature (2014)", "https://www.nature.com/articles/nature13829"),
      s("archive", "Dai, Zhang, Jin, Niu, Cao, Liang, Chen, Wang and Peng, Nature 515 (2014), record at IDEAS RePEc", "https://ideas.repec.org/a/nat/nature/v515y2014i7525d10.1038_nature13829.html"),
    ],
  },
  "Yizheng Jin": {
    about: [
      "A chemist, he was a tenured professor at Zhejiang University and directed the Institute of Advanced Materials Chemistry in its Department of Chemistry. His work covered light-emitting diodes made from solutions, with quantum dots or perovskites, and the oxide layers used in them.",
      "In 2014 he, Xiaogang Peng and others reported in Nature a red diode in which an insulating layer about 6 nanometres thick, between the dots and the oxide, balanced the charge. The paper says he and Peng designed the experiments and supervised the work.",
      "A speaker profile for ICDT, a conference of the Society for Information Display, says his research achievements were among the Top 10 Scientific Progresses in China of 2014. China's Ministry of Education named him a Chang Jiang Scholar Distinguished Professor in 2023.",
    ],
    sources: [
      s("archive", "Yizheng Jin, speaker profile, SID ICDT", "https://www.sidicdt.org/nd.jsp?id=2218"),
      s("paper", "Dai, Zhang, Jin and others, Solution-processed, high-performance light-emitting diodes based on quantum dots, Nature (2014)", "https://www.nature.com/articles/nature13829"),
      s("press", "Chinese team report best solution-processed red LED, Compound Semiconductor (2014)", "https://compoundsemiconductor.net/article/95512/Chinese_team_report_best_solution-processed_red_LED"),
      s("archive", "Dai, Zhang, Jin, Niu, Cao, Liang, Chen, Wang and Peng, Nature 515 (2014), record at IDEAS RePEc", "https://ideas.repec.org/a/nat/nature/v515y2014i7525d10.1038_nature13829.html"),
    ],
  },
  "Tuomo Suntola": {
    born: 1943, about: [
      "Born in Tampere, he took a doctorate at Helsinki University of Technology. When the medical instrument company Instrumentarium asked him for product ideas, he proposed atomic layer deposition, and he filed a patent on it in 1974.",
      "According to thisisFINLAND, the first panel made this way showed arriving and departing flights at Helsinki Airport, and commercial production followed in the 1980s. He later worked on the method at Microchemistry, a subsidiary of the energy company Neste.",
      "Intel began to use the method in its chips in 2007. Suntola received the Millennium Technology Prize in 2018. He co-owned the ALD company Picosun until it was sold to Applied Materials in 2022.",
    ],
    sources: [
      s("press", "Finnish physicist Tuomo Suntola wins Millennium Technology Prize, thisisFINLAND (2018)", "https://finland.fi/business-innovation/finnish-physicist-tuomo-suntola-wins-millennium-technology-prize/"),
      s("archive", "How ALD technology made the world lighter, Millennium Technology Prize", "https://millenniumprize.org/news-articles/news/how-ald-technology-made-the-world-lighter/"),
      s("lab", "Millennium Technology Prize for Tuomo Suntola, alumnus of Aalto, Aalto University (2018)", "https://aalto.fi/en/news/millennium-technology-prize-for-tuomo-suntola-alumnus-of-aalto"),
      s("lab", "Developer of atomic layer deposition Tuomo Suntola receives Millennium Technology Prize, University of Helsinki (2018)", "https://www.helsinki.fi/en/news/science/developer-of-atomic-layer-deposition-tuomo-suntola-receives-millennium-technology-prize"),
    ],
  },
  "Dawon Kahng": {
    born: 1931, died: 1992, about: [
      "He took a bachelor's degree at Seoul National University in 1955 and his master's and doctoral degrees at Ohio State University. He joined Bell Telephone Laboratories in 1959.",
      "He and Mohamed Atalla built a working transistor of metal, oxide and silicon, using Atalla's method of coating silicon with an insulating layer of silicon oxide. The National Inventors Hall of Fame says they announced the device, now called the MOSFET, in 1960.",
      "He retired from Bell Laboratories in 1988. The Hall of Fame says he then founded the NEC Research Institute, for basic research in computing and communications. It inducted him in 2009.",
    ],
    sources: [
      s("archive", "Dawon Kahng, National Inventors Hall of Fame", "https://www.invent.org/inductees/dawon-kahng"),
      s("press", "National Inventors Hall of Fame 2009 inductees, EurekAlert news release (2009)", "https://www.eurekalert.org/news-releases/765891"),
    ],
  },
  "Ibn al-Haytham": {
    about: [
      "Abu Ali al-Hasan ibn al-Haytham was born in Basra, in what is now Iraq. In the medieval accounts MacTutor follows, he trained for an official career, was made a minister for Basra and its region, and then turned to science, reading Aristotle above all.",
      "The Fatimid caliph al-Hakim, ruler of Egypt, set him to regulate the Nile. Ibn al-Haytham travelled upriver with a team of engineers, judged the plan unworkable and said so. MacTutor and Britannica record that he later feigned madness and was confined to his house.",
      "His Kitab al-Manazir, the Book of Optics, ran to seven books and rested on experiment. MacTutor dates its Latin translation to 1270, Britannica to the early thirteenth century. Latin readers knew him as Alhazen. In Cairo he lived by writing, teaching and copying texts.",
      "Britannica says his treatise On the Shape of the Eclipse discusses the camera obscura. It also reports an argument that the medieval records merge two men of this name, a mathematician who wrote on optics and an astronomer and philosopher who wrote the autobiography.",
    ],
    sources: [
      s("lab", "J. J. O'Connor and E. F. Robertson, Abu Ali al-Hasan ibn al-Haytham, MacTutor History of Mathematics, University of St Andrews", "https://mathshistory.st-andrews.ac.uk/Biographies/Al-Haytham/"),
      s("reference", "Ibn al-Haytham, Encyclopaedia Britannica", "https://www.britannica.com:443/biography/Ibn-al-Haytham"),
    ],
  },
  "Gemma Frisius": {
    born: 1508, died: 1555, about: [
      "Born in Dokkum in Friesland, he entered the University of Leuven in 1526 as a student without money. He studied medicine but stayed on for mathematics and astronomy, practised as a physician in Leuven, and became professor of medicine and mathematics there.",
      "With the goldsmith Gaspard van der Heyden, and Gerardus Mercator as engraver, he made a terrestrial globe in 1536 and a celestial globe in 1537. In 1530 he proposed finding longitude by comparing local time with a carried clock.",
      "MacTutor credits his tract of 1533 with the first proposal to fix places by triangulation. His De radio astronomico of 1545 described a cross staff about one and a half metres long. He died at Leuven.",
    ],
    sources: [
      s("lab", "J. J. O'Connor and E. F. Robertson, Regnier Gemma Frisius, MacTutor History of Mathematics, University of St Andrews", "https://mathshistory.st-andrews.ac.uk/Biographies/Gemma_Frisius/"),
      s("archive", "Gemma Frisius in Louvain, History of Science Museum, University of Oxford", "https://www.mhs.ox.ac.uk/exhibits/the-renaissance-in-astronomy/panels/6-frisius-in-louvain/"),
    ],
  },
  "Daniele Barbaro": {
    about: [
      "Born in Venice, in 1513 by the Museo Galileo and in 1514 by the Online Books Page, he studied philosophy, mathematics and optics at the University of Padua. He served the Venetian state as ambassador in London.",
      "He was named patriarch elect of Aquileia in 1550 and died with that title in 1570. In 1561 he represented Venice at the Council of Trent.",
      "In 1556 he published an Italian translation of Vitruvius on architecture with a long commentary, and a Latin edition in 1567. He was a friend of the architect Andrea Palladio.",
      "His treatise on perspective, La pratica della perspettiva, appeared in Venice. The Museo Galileo dates it to 1569 and calls it a treatise on the science of painting. The Online Books Page lists printings of 1568 and 1569.",
    ],
    sources: [
      s("archive", "Daniele Barbaro, biography, Museo Galileo, Florence", "https://catalogue.museogalileo.it/biography/DanieleBarbaro.html"),
      s("archive", "Barbaro, Daniel, 1514-1570, The Online Books Page, University of Pennsylvania", "https://onlinebooks.library.upenn.edu/webbin/who/Barbaro%2c%20Daniel%2c%201514%2d1570"),
      s("reference", "Daniele Matteo Alvise Barbaro, Catholic-Hierarchy", "https://catholic-hierarchy.org/bishop/bbarbd.html"),
    ],
  },
  "Johannes Kepler": {
    born: 1571, died: 1630, about: [
      "Born in Weil der Stadt near Stuttgart, he studied at Tübingen under the Copernican Michael Maestlin and taught at Graz from 1594.",
      "He joined Tycho Brahe in Prague in 1600 and after Brahe died in 1601 succeeded him as mathematician to Emperor Rudolf II. His Astronomiae pars optica of 1604 used reflection and refraction to explain eclipses.",
      "Astronomia nova of 1609 set out elliptical orbits and the law of equal areas. His Dioptrice of 1611 described a telescope with two convex lenses. He moved to Linz in 1612. Harmonice mundi of 1619 gave a third law.",
    ],
    sources: [
      s("archive", "Johannes Kepler, biography, Museo Galileo, Florence", "https://catalogue.museogalileo.it/biography/JohannesKepler.html"),
      s("archive", "Astronomiae pars optica, National Library of Scotland", "https://nls.uk/treasures/explore/astronomiae-pars-optica"),
    ],
  },
  "Ibn Daniyal": {
    born: 1248, about: [
      "Doctor and poet as well as a man of the theatre, he came from Iraq and settled in Cairo in the years after the Mongols took Baghdad in 1258. He wrote his plays as dialogue with verse and music, and directed the shows himself.",
      "The plays are Ṭayf al-Khayāl, which the World Encyclopedia of Puppetry Arts renders as The Shadow Spirit, and two others it calls Strange and Bizarre and The Lover.",
      "The opening play seems to praise Sultan Baybars and his laws against vice, but the encyclopedia reads it as satire on the Mamluk sultanate that ruled from Cairo.",
      "The texts survive in four manuscripts, the oldest of 1425 in the Süleymaniye Library in Istanbul. Paul Kahle edited two of the plays between 1910 and 1912 and found Mamluk leather figures now in the Islamic Museum in Berlin.",
    ],
    sources: [
      s("archive", "Ibn Daniel, World Encyclopedia of Puppetry Arts, UNIMA", "https://wepa.unima.org/en/?p=773"),
      s("paper", "Ahmed Shafik, Ibn Dāniyāl's shadow plays in Egypt: the character of Ṭayf al-Khayāl, Al-Andalus Magreb 21 (2014)", "https://revistas.uca.es/index.php/aam/article/view/7428"),
    ],
  },
  "François Dominique Séraphin": {
    about: [
      "The World Encyclopedia of Puppetry Arts says that at twenty three he opened a theatre behind an inn in the Lannion garden at Versailles, showing shadows with changing scenery. He was called to play for the court three times a week in carnival.",
      "In Paris he settled in the new galleries of the Palais Royal. His bill mixed comic pieces by Dorvigny and Guillemain with fairy tales such as Cendrillon, or Cinderella.",
      "In 1790, a year after the fall of the Bastille, he staged La Démonseigneurisation, a title the encyclopedia renders roughly as Bringing Down the Aristocrat. His descendants kept the Séraphin shows going until 1870, moving the theatre to the Passage Jouffroy in 1859.",
    ],
    sources: [
      s("archive", "Séraphin, World Encyclopedia of Puppetry Arts, UNIMA", "https://wepa.unima.org/en/?p=6310"),
      s("reference", "Dominique Séraphin, Encyclopaedia Britannica", "https://www.britannica.com/biography/Dominique-Seraphin"),
    ],
  },
  "Henri Rivière": {
    born: 1864, died: 1951, about: [
      "Born in Paris, he went to the Collège Rollin, came to drawing by copying illustrations by Doré and Vierge, and trained for a short time in the studio of Émile Bin.",
      "He frequented the Chat Noir from about eighteen and helped start its journal. In 1886 Rodolphe Salis gave him artistic and technical charge of the cabaret's shadow theatre.",
      "In the 1890s he made woodcuts after Japanese models, and in 1902 published lithographs, Trente six vues de la Tour Eiffel, as a tribute to Hokusai. He collected about 800 Japanese objects and gave up printmaking for watercolour in 1916.",
    ],
    sources: [
      s("archive", "Rivière, Henri, AGORHA, Institut national d'histoire de l'art", "https://agorha.inha.fr/detail/731"),
      s("archive", "Henri Rivière, Van Gogh Museum", "https://www.vangoghmuseum.com/en/prints/person/4789"),
    ],
  },
  "Kara Walker": {
    born: 1969, about: [
      "From Stockton, California, she took a bachelor's degree at the Atlanta College of Art and a master's degree at the Rhode Island School of Design. In 1994 the Drawing Center in New York showed Gone, her wall installation of black paper silhouettes.",
      "The Walker Art Center says her work exposes the ongoing psychological injury caused by the legacy of slavery and examines racial and gender stereotypes. She received a MacArthur Fellowship in 1997 and represented the United States at the Bienal de São Paulo in 2002.",
      "In 2004 she made Testimony, a silent film on 16mm in which shadow puppets and title cards tell a story of masters and slaves. The Museum of Modern Art holds a puppet from it, of cut black paper with pencil, tape and metal fasteners.",
      "In 2014 she showed A Subtlety, a sphinx-like woman of polystyrene coated with white sugar, in a warehouse on the former Domino Sugar site in Brooklyn. The Walker Art Center ties it to sugar harvested by enslaved people on Caribbean plantations.",
    ],
    sources: [
      s("archive", "Kara Walker, Walker Art Center", "https://walkerart.org/collections/artists/kara-walker"),
      s("archive", "Kara Walker, Shadow puppet from Testimony: Narrative of a Negress Burdened by Good Intentions (2004), Museum of Modern Art", "https://www.moma.org/collection/works/97669"),
    ],
  },
  "James Fergason": {
    born: 1934, died: 2008, about: [
      "Born in Wakenda, Missouri, he took a degree in physics at the University of Missouri in 1956. The Lemelson-MIT Program says he organised the first American research team on liquid crystals, at Westinghouse Research Labs from 1957.",
      "His patent of 1963 used cholesteric liquid crystals to sense temperature. In 1966 he joined the Liquid Crystal Institute at Kent State University, later as associate director. The Lemelson-MIT Program dates his discovery of the twisted nematic effect to 1967, Kent State to 1969.",
      "Kent State notes that Martin Schadt and Wolfgang Helfrich patented similar technology in Europe. He founded ILIXCO to make displays, as early as 1968 by Kent State's account and in 1970 by the Lemelson-MIT Program's.",
      "He held more than 125 United States patents, entered the National Inventors Hall of Fame in 1998 and received the Lemelson-MIT Prize in 2006.",
    ],
    sources: [
      s("archive", "James Fergason, Lemelson-MIT Program", "https://lemelson.mit.edu/resources/james-fergason"),
      s("lab", "James Fergason passes away at 74 (1934-2008), Kent State University", "https://www.kent.edu/node/718356"),
    ],
  },
  "George Heilmeier": {
    born: 1936, died: 2014, about: [
      "He studied electrical engineering at the University of Pennsylvania and took a PhD in electronics at Princeton in 1962. He joined RCA Laboratories in 1958 and came to direct its solid state device research.",
      "In 1964 he found that a voltage changed the colour of a nematic liquid crystal doped with dye. RCA showed prototype liquid crystal displays in 1968.",
      "He became a White House Fellow in 1970. The Kyoto Prize dates his appointment as director of the Defense Advanced Research Projects Agency to 1974, the Lemelson-MIT Program to 1975.",
      "He joined Texas Instruments in 1977 and from 1991 led Bell Communications Research, known as Bellcore. He received the Kyoto Prize in Advanced Technology in 2005.",
    ],
    sources: [
      s("archive", "George H. Heilmeier, 2005 Kyoto Prize Laureate, Inamori Foundation", "https://www.kyotoprize.org/en/laureates/george_h_heilmeier/"),
      s("archive", "George Heilmeier, Lemelson-MIT Program", "https://lemelson.mit.edu/resources/george-heilmeier"),
    ],
  },
  "Sivaramakrishna Chandrasekhar": {
    born: 1930, died: 2004, about: [
      "After postgraduate study at the University of Cambridge he joined the University of Mysore with the task of building a school of physics. After a further spell in Britain he moved to the Raman Research Institute in Bangalore in 1971.",
      "There he set up and led a liquid crystal laboratory. In 1977 he, B. K. Sadashiva and K. A. Suresh reported in the journal Pramana compounds called benzene hexa n alkanoates, whose disc molecules stacked into columns set in a hexagonal array.",
      "Suresh recalls that Chandrasekhar took up the disc project, set Suresh to study the samples by X-ray and asked Sadashiva to prepare pure ones.",
      "SciDev.Net records that he never ceased to promote science in India, and that he won international recognition for advancing science in developing countries.",
    ],
    sources: [
      s("press", "John W. Goody, A tribute to S. Chandrasekhar (1930-2004), SciDev.Net (2004)", "https://www.scidev.net/global/?p=31930"),
      s("paper", "S. Chandrasekhar, B. K. Sadashiva and K. A. Suresh, Liquid crystals of disc-like molecules, Pramana (1977)", "https://www.ias.ac.in/article/fulltext/pram/009/05/0471-0480"),
      s("paper", "K. A. Suresh, Ground-breaking discoveries in liquid crystals, Nature India (2024)", "https://www.nature.com/articles/d44151-023-00176-z"),
    ],
  },
  "B. K. Sadashiva": {
    about: [
      "A chemist, he took a master's degree in organic chemistry at Bangalore University and a PhD under Sivaramakrishna Chandrasekhar at the Raman Research Institute, where he spent his whole career and retired as a senior professor in 2008.",
      "K. A. Suresh recalls that Shyam Singh, a scientist at the institute, took up the synthesis of the disc compounds in 1976, and that the samples proved somewhat impure. Chandrasekhar then asked Sadashiva, a doctoral student, to continue, and Sadashiva prepared pure samples.",
      "With Chandrasekhar and Suresh he wrote the report of 1977 on these liquid crystals in the journal Pramana. He later worked on metallomesogens, liquid crystals that contain metals, and on chiral layered liquid crystals.",
      "The obituary in Liquid Crystals records the G. W. Gray Medal of the British Liquid Crystal Society and a fellowship of the National Academy of Sciences. He died in 2020.",
    ],
    sources: [
      s("paper", "Sandeep Kumar, obituary of B. K. Sadashiva, Liquid Crystals", "https://informahealthcare.com/doi/abs/10.1080/02678292.2020.1850223"),
      s("paper", "K. A. Suresh, Ground-breaking discoveries in liquid crystals, Nature India (2024)", "https://www.nature.com/articles/d44151-023-00176-z"),
      s("paper", "S. Chandrasekhar, B. K. Sadashiva and K. A. Suresh, Liquid crystals of disc-like molecules, Pramana (1977)", "https://www.ias.ac.in/article/fulltext/pram/009/05/0471-0480"),
    ],
  },
  "K. A. Suresh": {
    about: [
      "Kattera A. Suresh took his doctorate at the Raman Research Institute in Bangalore in 1979.",
      "Set by Sivaramakrishna Chandrasekhar to study the new compounds, he examined them by X-ray diffraction and proposed a model of discs stacked in columns, which became accepted as the hexagonal columnar structure.",
      "He held a fellowship at the Collège de France in Paris in 1983, then worked for Dowell Schlumberger in France and at Carnegie Mellon University before returning to the institute in 1989.",
      "He became a senior professor there in 2004 and from 2010 was Scientist of Eminence at the Centre for Nano and Soft Matter Sciences in Bangalore.",
    ],
    sources: [
      s("lab", "Kattera A. Suresh, Centre for Nano and Soft Matter Sciences", "https://cens.res.in/faculty/suresh"),
      s("press", "K. A. Suresh, Ground-breaking discoveries in liquid crystals, Nature India (2024)", "https://www.nature.com/articles/d44151-023-00176-z"),
    ],
  },
  "Mohamed Atalla": {
    born: 1924, died: 2009, about: [
      "Born in Port Said, Egypt, he took a master's degree and a doctorate in mechanical engineering at Purdue University in 1947 and 1949, then joined Bell Laboratories. The National Inventors Hall of Fame lists him as Martin (John) M. Atalla, Purdue as John Atalla.",
      "There he studied the surface of silicon and grew a layer of silicon dioxide on the wafer to overcome the surface states that blocked current. He proposed a metal, oxide and silicon transistor and assigned it to Dawon Kahng.",
      "The National Inventors Hall of Fame says he and Kahng built the working device and announced it in 1960.",
      "In 1962 he co-founded Hewlett-Packard Associates, and in 1972 he founded the Atalla Corporation, whose Atalla Box encrypted PIN and cash machine messages. The National Inventors Hall of Fame inducted him in 2009.",
    ],
    sources: [
      s("archive", "Martin (John) M. Atalla, National Inventors Hall of Fame", "https://www.invent.org/inductees/martin-john-m-atalla"),
      s("lab", "Created the most frequently manufactured device in history, Purdue University College of Engineering", "https://engineering.purdue.edu/150/Consequential-Stories/150th-john-atalla"),
    ],
  },
  "Larry Hornbeck": {
    born: 1943, about: [
      "Born in St. Louis, he joined Texas Instruments in 1973 and took a doctorate in physics at Case Western Reserve University in 1974.",
      "At the company's Central Research Laboratories he began in 1977 on analogue deformable mirrors, and spent about a decade on them before turning to hinged digital ones.",
      "By the count of the University of Texas at Dallas he came to hold 38 United States patents, 34 of them on the mirror device.",
      "He received an Engineering Emmy in 1998 and an Academy Award of Merit in 2015 for the cinema projectors built on the chip. He joined the faculty of the University of Texas at Dallas in 2017.",
    ],
    sources: [
      s("archive", "Larry Hornbeck, National Inventors Hall of Fame", "https://www.invent.org/inductees/larry-hornbeck"),
      s("maker", "Texas Instruments Fellow Larry J. Hornbeck, PhD, Wins the Oscar, Texas Instruments (2015)", "https://www.ti.com/about-ti/newsroom/news-releases/2015/2015-02-09-texas-instruments-fellow-larry-j--hornbeck--phd--wins-the-oscar-.html"),
      s("lab", "Larry Hornbeck, Materials Science and Engineering, University of Texas at Dallas", "https://mse.utdallas.edu/ourteam/faculty/hornbeck-l"),
    ],
  },
  "Elsa Garmire": {
    born: 1939, about: [
      "Born in Buffalo, New York, she took degrees in physics at Harvard and at MIT, where the optics society SPIE says she was Charles Townes's first graduate student, working on nonlinear effects of strong laser beams.",
      "She came to Caltech in 1966 as a postdoctoral researcher with Amnon Yariv and was a senior research fellow there until 1973. SPIE records that she was the only woman working as a technical professional in Caltech's electrical engineering building.",
      "For Experiments in Art and Technology, a project on how light and technology could help artists, she designed the large Mylar mirror of the Pepsi pavilion at Expo 70 in Osaka. She also made new optics for laser shows.",
      "SPIE says she and Ivan Dryer started Laser Images, with her as president. Dryer recalled that she had it incorporated in February 1971. She gave it to him in 1973, then taught at the University of Southern California and Dartmouth College.",
    ],
    sources: [
      s("press", "Elsa Garmire: pioneering laser physicist helped launch laser light shows, SPIE Photonics Focus (2021)", "https://lux.spie.org/news/photonics-focus/novdec-2021/elsa-garmire-pioneering-laser-physicist-helped-launch-laser-light-shows"),
      s("lab", "Elsa Garmire, Thayer School of Engineering, Dartmouth College", "https://engineering.dartmouth.edu/people/faculty/elsa-garmire"),
      s("archive", "Elsa Garmire, Optica History", "https://optica.org/history/biographies/bios/elsa-garmire"),
      s("archive", "Ivan Dryer (1939 to 2017), IMERSA", "https://www.imersa.org/speakers/item/ivan-dryer"),
    ],
  },
  "Ivan Dryer": {
    born: 1939, died: 2017, about: [
      "From 1956 to 1968 he worked at intervals as a guide at Griffith Observatory in Los Angeles. He also worked as a filmmaker, including as documentary editor on the feature film Executive Action.",
      "In November 1970 he and the filmmaker Dale Pelton saw Elsa Garmire show her laser art at a conference at the University of Southern California, and she invited them to film it. He recalled that she had them incorporated in February 1971.",
      "The optics society SPIE says Garmire and Dryer started the company, Laser Images, with her as president. She gave it to him in 1973, and he always credited her for her part in the technology and the business, SPIE adds.",
      "Laserium ran at Griffith until January 2002. His company took shows to 46 planetariums and other venues. According to Live Design, the International Laser Display Association gave him its first Career Achievement Award in 1989.",
    ],
    sources: [
      s("archive", "Ivan Dryer (1939 to 2017), IMERSA", "https://www.imersa.org/speakers/item/ivan-dryer"),
      s("press", "Ivan Dryer, Laserium Founder And Laser Show Pioneer, Dies At 78, Live Design (2017)", "https://www.livedesignonline.com/business-people-news/ivan-dryer-laserium-founder-and-laser-show-pioneer-dies-at-78"),
      s("press", "Elsa Garmire: pioneering laser physicist helped launch laser light shows, SPIE Photonics Focus (2021)", "https://lux.spie.org/news/photonics-focus/novdec-2021/elsa-garmire-pioneering-laser-physicist-helped-launch-laser-light-shows"),
    ],
  },
  "Leota Toombs": {
    about: [
      "She began at the Walt Disney Studios in 1940 in the Ink and Paint department and moved to animation. She returned in 1962 to join WED Enterprises.",
      "She worked on It's a Small World, Great Moments with Mr. Lincoln and Ford's Magic Skyway for the 1964 to 1965 New York World's Fair, then on Pirates of the Caribbean and the Haunted Mansion.",
      "Recalling Madame Leota, she said her eyes were the right distance apart to fit the test model when the work began. She also voiced the bride known as Little Leota at the end of the ride.",
      "In 1971 she moved to Walt Disney World to set up the team that kept its shows running. From 1979 she trained figure finishers and artisans for Disneyland in California. She died in December 1991.",
    ],
    sources: [
      s("maker", "Leota Toombs Thomas, Disney Legends, D23", "https://d23.com/walt-disney-legend/leota-toombs-thomas/"),
    ],
  },
  "Michael Naimark": {
    about: [
      "He made Displacements three times between 1980 and 1984, the third at the San Francisco Museum of Modern Art. A 16mm camera on a slow turntable filmed two performers in a living room. Projected back onto the whitened room, the unpainted performers looked ghostlike.",
      "His Ars Electronica biography puts him on the original design team of the MIT Media Lab in 1980. He was a founding member of the Atari Research Lab, the Apple Multimedia Lab and Lucasfilm Interactive, and joined Interval Research in 1992.",
      "The same biography listed his art projects in the permanent collections of the Exploratorium in San Francisco, the American Museum of the Moving Image in New York and the Zentrum für Kunst und Medientechnologie in Karlsruhe, Germany.",
    ],
    sources: [
      s("archive", "Michael Naimark, Displacements, Archive of Digital Art", "https://digitalartarchive.at/database/work/313"),
      s("archive", "Michael Naimark, biography, Ars Electronica", "https://webarchive.ars.electronica.art/nyc/bio_naimark.htm"),
    ],
  },
  "Ramesh Raskar": {
    born: 1970, about: [
      "He studied engineering in Pune, India, and took his doctorate at the University of North Carolina at Chapel Hill. His research at Mitsubishi Electric Research Laboratories produced 40 patents.",
      "The shader lamps paper, which he wrote at Mitsubishi with Greg Welch, Kok-Lim Low and Deepak Bandyopadhyay, names him first among its authors. It covered a plain object with images from several projectors so that it took on its own or another appearance.",
      "In 2008 he founded the Camera Culture group at the MIT Media Lab. In 2016 he received the Lemelson-MIT Prize for his body of inventive work, including femto-photography, which the Lemelson-MIT Program says gives the sense of peering around corners.",
    ],
    sources: [
      s("archive", "Ramesh Raskar, Lemelson-MIT Program (2016)", "https://lemelson.mit.edu/resources/ramesh-raskar"),
      s("lab", "Shader Lamps, TR2001-21, Mitsubishi Electric Research Laboratories (2001)", "https://merl.com/publications/TR2001-21"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps: Animating Real Objects With Image-Based Illumination, Eurographics Workshop on Rendering (2001)", "https://diglib.eg.org/handle/10.2312/EGWR.EGWR01.089-101"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps, author copy, MIT Media Lab (2001)", "https://web.media.mit.edu/~raskar/RaskarPapers/shaderlampsRaskar01.pdf"),
    ],
  },
  "Greg Welch": {
    about: [
      "He worked at NASA's Jet Propulsion Laboratory and at the Defense Systems Division of Northrop Grumman, and was a research professor at the University of North Carolina at Chapel Hill.",
      "With Ramesh Raskar, Kok-Lim Low and Deepak Bandyopadhyay he wrote the shader lamps paper of 2001, which gives his affiliation as Chapel Hill. It covered a plain object with images from several projectors.",
      "He moved to the University of Central Florida, where he became a Pegasus Professor, holder of the AdventHealth Endowed Chair in Healthcare Simulation and co-director of the Synthetic Reality Lab.",
      "A 2026 article from the university says his patented work ranges from projection mapping, of the kind used on Cinderella Castle at Walt Disney World, to tactile telepresence for isolated patients.",
    ],
    sources: [
      s("lab", "Gregory Welch, Institute for Simulation and Training, University of Central Florida", "https://www.ist.ucf.edu/faculty/gregory-welch/"),
      s("lab", "IEEE 2026 awardee Gregory Welch, UCF College of Nursing (2026)", "https://nursing.ucf.edu/news/ieee-2026-awardee-gregory-welch/"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps: Animating Real Objects With Image-Based Illumination, Eurographics Workshop on Rendering (2001)", "https://diglib.eg.org/handle/10.2312/EGWR.EGWR01.089-101"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps, author copy, MIT Media Lab (2001)", "https://web.media.mit.edu/~raskar/RaskarPapers/shaderlampsRaskar01.pdf"),
    ],
  },
  "Kok-Lim Low": {
    about: [
      "With Ramesh Raskar, Greg Welch and Deepak Bandyopadhyay he wrote the shader lamps paper of 2001, which gives his affiliation as the University of North Carolina at Chapel Hill. He took his doctorate in computer science there in 2006.",
      "He joined the School of Computing of the National University of Singapore, where he became a senior lecturer. His work there covered computer graphics, real-time rendering and the automated design of papercraft.",
    ],
    sources: [
      s("lab", "Kok-Lim Low, School of Computing, National University of Singapore", "https://www.comp.nus.edu.sg/cs/bio/lowkl/"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps: Animating Real Objects With Image-Based Illumination, Eurographics Workshop on Rendering (2001)", "https://diglib.eg.org/handle/10.2312/EGWR.EGWR01.089-101"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps, author copy, MIT Media Lab (2001)", "https://web.media.mit.edu/~raskar/RaskarPapers/shaderlampsRaskar01.pdf"),
    ],
  },
  "Deepak Bandyopadhyay": {
    about: [
      "With Ramesh Raskar, Greg Welch and Kok-Lim Low he wrote the shader lamps paper of 2001, which gives his affiliation as the University of North Carolina at Chapel Hill.",
      "He took his doctorate there in 2006 under Jack Snoeyink, with a thesis on a geometric framework for nearest neighbour analysis of protein structure and function.",
    ],
    sources: [
      s("archive", "Deepak Bandyopadhyay, Mathematics Genealogy Project", "https://mathgenealogy.org/id.php?id=106573"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps: Animating Real Objects With Image-Based Illumination, Eurographics Workshop on Rendering (2001)", "https://diglib.eg.org/handle/10.2312/EGWR.EGWR01.089-101"),
      s("paper", "Raskar, Welch, Low and Bandyopadhyay, Shader Lamps, author copy, MIT Media Lab (2001)", "https://web.media.mit.edu/~raskar/RaskarPapers/shaderlampsRaskar01.pdf"),
    ],
  },
  "Lanny Smoot": {
    born: 1955, about: [
      "Born in New York City, he took degrees in electrical engineering at Columbia University. From 1978 to 1998 he was at Bell Laboratories and Bellcore, with patents in fibre optics, video on demand and video conferencing.",
      "He joined Disney in 1998 and worked as a research fellow and head of Imagineering research and development. His work included an extendable lightsaber and the HoloTile floor for shared virtual reality. Disney counts 74 of his patents from his 25 years there.",
      "Disney credits him with inventing the Magic Playfloor game on the Disney Cruise Line and designing interactive koi ponds for the Hong Kong Disneyland Hotel. He also patented ways of creating free floating images. The National Inventors Hall of Fame inducted him in 2024.",
    ],
    sources: [
      s("archive", "2024 Fact Sheet, Lanny Smoot, National Inventors Hall of Fame (2024)", "https://www.invent.org/sites/default/files/2024-01/2024_Fact_Sheet_Lanny_Smoot.pdf"),
      s("maker", "Lanny Smoot to Be the First Disney Imagineer Inducted into the National Inventors Hall of Fame, The Walt Disney Company (2024)", "https://thewaltdisneycompany.com/lanny-smoot-to-be-the-first-disney-imagineer-inducted-into-the-national-inventors-hall-of-fame/"),
    ],
  },
  "Barrett Comiskey": {
    born: 1975, about: [
      "He studied mathematics at MIT and worked nights and weekends in its Media Lab. Joseph Jacobson, who came to MIT in 1995 with the idea of a book whose content could change at the push of a button, challenged him to build it.",
      "With J. D. Albert he showed on 23 January 1997 that an electric field could move particles inside a microcapsule. He co-founded E Ink in 1997 and worked with the company for eight years in Cambridge, Massachusetts, and Shanghai, China.",
      "He later took an MBA at Stanford and has worked in Asia since 2004. The National Inventors Hall of Fame inducted him in 2016.",
    ],
    sources: [
      s("archive", "Barrett O. Comiskey, National Inventors Hall of Fame", "https://invent.org/inductees/barrett-o-comiskey"),
      s("press", "How Electronic Ink Was Invented, Science Friday", "https://www.sciencefriday.com/articles/how-electronic-ink-was-invented/"),
    ],
  },
  "J. D. Albert": {
    born: 1975, about: [
      "Jonathan Albert was a mechanical engineering student at MIT when Joseph Jacobson recruited him to his laboratory. With Barrett Comiskey he worked on Jacobson's idea of a book whose pages could be changed electronically, and they had a working prototype in January 1997.",
      "Later in 1997 he co-founded E Ink with Comiskey, Jacobson, Russ Wilcox and Jerome Rubin, and he developed the methods used to make electronic ink displays in volume. The National Inventors Hall of Fame inducted him in 2016.",
      "He became director of engineering at Bresslergroup, a product design firm, and taught product design, engineering and entrepreneurship in the Integrated Product Design programme at the University of Pennsylvania.",
    ],
    sources: [
      s("archive", "Jonathan D. Albert, National Inventors Hall of Fame (2016)", "https://www.invent.org/inductees/jonathan-d-albert"),
      s("lab", "Faculty member JD Albert named to National Inventors Hall of Fame, Weitzman School of Design, University of Pennsylvania (2016)", "https://www.design.upenn.edu/news/post/faculty-member-jd-albert-named-national-inventors-hall-fame"),
    ],
  },
  "Joseph Jacobson": {
    born: 1965, about: [
      "He took a bachelor's degree at Brown University and a doctorate in physics at MIT, and was then a postdoctoral fellow in physics at Stanford University.",
      "In the mid-1990s he proposed a display of black and white particles held in tiny spheres. At the MIT Media Lab he recruited two students, Barrett Comiskey and J. D. Albert, to build it. In 1997 the three co-founded E Ink with others.",
      "As a professor at the MIT Media Lab he later headed its Molecular Machines group, which works on synthetic biology. The National Inventors Hall of Fame inducted him in 2016.",
    ],
    sources: [
      s("archive", "Joseph M. Jacobson, National Inventors Hall of Fame (2016)", "https://invent.org/inductees/joseph-m-jacobson"),
      s("lab", "Joseph M. Jacobson, MIT Media Lab", "https://www.media.mit.edu/people/jacobson.html"),
      s("press", "How Electronic Ink Was Invented, Science Friday", "https://www.sciencefriday.com/articles/how-electronic-ink-was-invented/"),
    ],
  },
  "John Rogers": {
    about: [
      "He studied chemistry and physics at the University of Texas at Austin, graduating in 1989, and took a doctorate in physical chemistry at MIT in 1995. He was then a Junior Fellow of the Harvard Society of Fellows until 1997.",
      "He joined Bell Laboratories in 1997 as a member of technical staff in condensed matter physics research, and directed that department from late 2000 to 2002. He was the lead author of the paper of 2001 in the Proceedings of the National Academy of Sciences.",
      "He spent thirteen years on the faculty of the University of Illinois, then moved to Northwestern University in 2016 as professor of materials science and engineering and director of the Querrey Simpson Institute for Bioelectronics. He received a MacArthur Fellowship in 2009.",
    ],
    sources: [
      s("lab", "John A. Rogers, Querrey Simpson Institute for Bioelectronics, Northwestern University", "https://bioelectronics.northwestern.edu/people/rogers-john.html"),
      s("paper", "Rogers, Bao and others, Paper-like electronic displays, Proceedings of the National Academy of Sciences (2001), record at University of Illinois", "https://experts.illinois.edu/en/publications/paper-like-electronic-displays-large-area-rubber-stamped-plastic-/"),
      s("lab", "Paper-like electronic displays, Nokia Bell Labs publications (2001)", "https://www.nokia.com/bell-labs/publications-and-media/publications/paper-like-electronic-displays-large-area-rubber-stamped-plastic-sheets-of-electronics-and-microencapsulated-electrophoretic-inks"),
    ],
  },
  "Zhenan Bao": {
    about: [
      "She took her doctorate in chemistry at the University of Chicago in 1995 and joined Bell Labs, then part of Lucent Technologies. She became a Distinguished Member of Technical Staff there in 2001, and was second author of that year's paper on the bendable display.",
      "She moved to Stanford University in 2004, where she became K.K. Lee Professor and chaired the Department of Chemical Engineering from 2018 to 2022 and in 2025. She founded the Stanford Wearable Electronics Initiative, and her group works on electronics modelled on skin.",
      "She co-founded C3 Nano, later acquired by DuPont, and PyrAmes. She became a member of the National Academy of Sciences and the National Academy of Engineering.",
    ],
    sources: [
      s("lab", "Zhenan Bao, Stanford Engineering, Stanford University", "https://engineering.stanford.edu/people/zhenan-bao"),
      s("paper", "Rogers, Bao and others, Paper-like electronic displays, Proceedings of the National Academy of Sciences (2001), record at University of Illinois", "https://experts.illinois.edu/en/publications/paper-like-electronic-displays-large-area-rubber-stamped-plastic-/"),
    ],
  },
  "Deng-Ke Yang": {
    about: [
      "He took a physics degree at Tsinghua University in China in 1984 and a doctorate in physics at the University of Hawaii in 1989, when he joined Kent State University. In 1994 he published on cholesteric reflective displays with J. William Doane and others.",
      "Kent State gave him its Excellence Award in Invention in 2000 for the bistable reflective cholesteric display and polymer stabilised devices. The Society for Information Display recognised that work in 2005, and made him a Fellow in 2007.",
      "With S. T. Wu he wrote Reflective Liquid Crystal Displays of 2001 and Fundamentals of Liquid Crystal Devices of 2006. The Society gave him its Slottow-Owaki Prize in 2017 for education and training in liquid crystal displays.",
    ],
    sources: [
      s("lab", "Deng-Ke Yang, Advanced Materials and Liquid Crystal Institute, Kent State University", "https://www.kent.edu/materials-science/deng-ke-yang"),
    ],
  },
  "J. William Doane": {
    about: [
      "Bill Doane took a doctorate in physics at the University of Missouri-Columbia in 1965 and joined the Kent State University faculty that year.",
      "He became director of the Liquid Crystal Institute in 1983, and in 1991 was the founding director of the ALCOM Center for liquid crystalline optical materials. In 1995 and 1996 he published on reflective cholesteric displays in the SID Digest and Information Display.",
      "He co-founded Kent Displays, Inc., where he served as vice president for research and development and chief science officer. He retired from the university in 1996 and was a Fellow of the American Physical Society.",
    ],
    sources: [
      s("lab", "William Doane, Advanced Materials and Liquid Crystal Institute, Kent State University", "https://www.kent.edu/amlci/william-doane"),
      s("lab", "The Friends of J. William Doane Fellowship Fund, Kent State University", "https://www.kent.edu/amlci/friends-j-william-doane-fellowship-fund"),
    ],
  },
  "Gerardo Beni": {
    about: [
      "He took a degree in physics at the University of Florence, Italy, in 1970 and a doctorate in physics at the University of California, Los Angeles, in 1974.",
      "At Bell Telephone Laboratories he and Susan Hackwood filed a patent in June 1981 on devices that change the surface tension between two fluids with a voltage. Granted in November 1983, it noted that fluids of different colours give a colour change.",
      "In 1981 the two also published a paper on electrowetting displays in Applied Physics Letters, which the Philips paper of 2003 on video-speed electrowetting cites.",
      "He co-founded the Journal of Robotic Systems in 1982 and joined the faculty of electrical and computer engineering at the University of California, Riverside. He later wrote on swarm intelligence and swarm robotics.",
    ],
    sources: [
      s("patent", "Beni and Hackwood, Devices based on surface tension changes, US patent 4,417,786 (1983)", "https://uspto.report/patent/grant/4417786"),
      s("lab", "Gerardo Beni, Center for Robotics and Intelligent Systems, University of California, Riverside", "https://www.cris.ucr.edu/people/gerardo-beni"),
      s("lab", "Gerardo Beni's Home Page, Electrical and Computer Engineering, University of California, Riverside", "https://intra.ece.ucr.edu/~beni/"),
      s("paper", "Hayes and Feenstra, Video-speed electronic paper based on electrowetting, Nature (2003)", "https://www.nature.com/articles/nature01988.pdf"),
    ],
  },
  "Susan Hackwood": {
    about: [
      "She took a doctorate in solid state ionics in the United Kingdom. At Bell Telephone Laboratories she and Gerardo Beni filed a patent in June 1981 on using a voltage to change the surface tension between two fluids.",
      "That year the two published a paper on electrowetting displays in Applied Physics Letters. Her biography for the Centre for Science and Policy at Cambridge says she invented and named the electrowetting effect at the laboratory, where she headed device robotics technology research.",
      "In 1984 she joined the University of California, Santa Barbara, as a professor of electrical and computer engineering. There she founded and directed the National Science Foundation Engineering Research Center for Robotic Systems in Microelectronics.",
      "In 1990 she became founding dean of the Bourns College of Engineering, University of California, Riverside. The same biography calls her the first woman dean of a major American research university. She later directed the California Council on Science and Technology.",
    ],
    sources: [
      s("lab", "Susan Hackwood, Centre for Science and Policy, University of Cambridge", "https://www.csap.cam.ac.uk/network/susan-hackwood"),
      s("patent", "Beni and Hackwood, Devices based on surface tension changes, US patent 4,417,786 (1983)", "https://uspto.report/patent/grant/4417786"),
      s("paper", "Hayes and Feenstra, Video-speed electronic paper based on electrowetting, Nature (2003)", "https://www.nature.com/articles/nature01988.pdf"),
    ],
  },
  "Robert Hayes": {
    about: [
      "A physicist at Philips Research in Eindhoven, he wrote with Johan Feenstra the paper Video-speed electronic paper based on electrowetting, published in Nature in 2003.",
      "In each pixel a voltage made water push aside a coloured oil film about 10 micrometres thick, uncovering a white surface beneath. Physics World reported that a pixel switched in less than 10 milliseconds.",
      "The paper said its colour design was four times brighter than reflective liquid crystal displays, with reflectivity and contrast close to those of paper.",
    ],
    sources: [
      s("paper", "Hayes and Feenstra, Video-speed electronic paper based on electrowetting, Nature (2003)", "https://www.nature.com/articles/nature01988.pdf"),
      s("press", "Electronic paper reaches video speeds, Physics World (2003)", "https://physicsworld.com/a/electronic-paper-reaches-video-speeds/"),
    ],
  },
  "Johan Feenstra": {
    about: [
      "He took a doctorate in solid state physics at the Rijksuniversiteit Groningen in 1997. At Philips Research in the Netherlands he wrote the Nature paper of 2003 on video-speed electrowetting displays with Robert Hayes.",
      "He co-founded Liquavista, spun out of Philips in 2006, and served as its chief executive and chief technology officer. Samsung Electronics bought the company in 2011, and it was later sold to Amazon.",
      "He joined SMART Photonics, a maker of photonic chips, as chief executive in 2019.",
    ],
    sources: [
      s("archive", "Johan Feenstra, TNO Fast Track", "https://fasttrack.tno.nl/en/@8454/johan-feenstra"),
      s("press", "Electronic paper reaches video speeds, Physics World (2003)", "https://physicsworld.com/a/electronic-paper-reaches-video-speeds/"),
      s("press", "Samsung applies itself to Liquavista, Global Corporate Venturing (2011)", "https://globalventuring.com/blog/2011/01/23/samsung-applies-itself-to-liquavista/"),
    ],
  },
  "Mark Miles": {
    about: [
      "He took a degree in electrical engineering at MIT and spent more than twelve years on development work for clients including the Advanced Research Projects Agency and the National Science Foundation. He founded Etalon, a firm working on MEMS devices and thin film processes.",
      "His 2006 conference biography calls him the inventor of the interferometric modulator, a MEMS device meant for flat panel displays in portable products.",
      "He co-founded Iridigm Display Corporation in 1997 to develop it and, as chief technology officer, led its technology development for more than five years.",
      "By 2006, after Qualcomm bought Iridigm in 2004, he was advising Qualcomm MEMS Technologies, the subsidiary formed to sell displays built on the modulator. He also ran Mark Miles Consulting in San Francisco and held eleven patents.",
    ],
    sources: [
      s("archive", "Mark Miles, speaker biography, Solid-State Sensors, Actuators and Microsystems Workshop, Hilton Head, Transducer Research Foundation (2006)", "https://www.transducer-research-foundation.org/archive/hh2006/general/speakers/miles.html"),
      s("press", "Mark Miles, Board Member, Green City Force", "https://greencityforce.org/person/mark-miles/"),
    ],
  },
  "S. K. Deb": {
    about: [
      "Satyen Deb studied at Dacca University, graduating in 1953 and 1955, and took a doctorate in solid state physics at the Cavendish Laboratory of Cambridge University.",
      "He was a corporate research fellow at American Cyanamid in Stamford, Connecticut. His biography at the National Renewable Energy Laboratory says that he discovered the electrochromic phenomenon in transition metal oxides.",
      "A 1995 paper recalling the discovery sets it in the 1960s, in work on thin oxide films for recording information. It says the films could be coloured and bleached by an electric field alone, by reversing the polarity.",
      "He joined what is now the National Renewable Energy Laboratory in 1978, managed its in-house photovoltaic research and directed its Center for Basic Sciences. He was a Fellow of the American Physical Society.",
    ],
    sources: [
      s("lab", "Satyen K. Deb, Center Director Emeritus, National Renewable Energy Laboratory, archived in the govdocs1 corpus", "https://corpora.tika.apache.org/base/docs/govdocs1/210/210482.html"),
      s("paper", "Reminiscences on the Discovery of Electrochromic Phenomena in Transition Metal Oxides, Solar Energy Materials and Solar Cells (1995), NREL Research Hub", "https://research-hub.nrel.gov/en/publications/reminiscences-on-the-discovery-of-electrochromic-phenomena-in-tra/"),
    ],
  },
  "Paula Hammond": {
    born: 1963, about: [
      "She studied chemical engineering at the Massachusetts Institute of Technology, graduating in 1984, took a master's degree at Georgia Tech in 1988 and returned to MIT for her doctorate in 1993. She then held a National Science Foundation postdoctoral fellowship in chemistry at Harvard.",
      "She supervised Dean DeLongchamp's doctoral thesis of 2003 on films built layer by layer from materials that change colour with voltage. Combining several such materials gave films with higher contrast, faster switching and more than one colour.",
      "In 2002 she co-founded MIT's Institute for Soldier Nanotechnologies. Her group's work has included polymers for solar cells, nanoparticles that carry chemotherapy drugs and a spray coating that helps blood clot.",
      "She was appointed head of MIT's Department of Chemical Engineering in 2015. The Science History Institute says she was the first woman and the first person of colour to hold that post. It gave her its Othmer Gold Medal in 2024.",
    ],
    sources: [
      s("archive", "Paula Hammond, Scientific Biographies, Science History Institute", "https://www.sciencehistory.org/education/scientific-biographies/paula-hammond/"),
      s("paper", "DeLongchamp, Engineering the electrochromism and ion conduction of layer-by-layer assembled films, PhD thesis supervised by Paula T. Hammond, Massachusetts Institute of Technology (2003)", "https://dspace.mit.edu/handle/1721.1/29995"),
      s("lab", "Army selects MIT for $50 million institute to use nanomaterials to clothe, equip soldiers, MIT News (2002)", "https://news.mit.edu/2002/isn"),
    ],
  },
  "Dean DeLongchamp": {
    born: 1975, about: [
      "A chemical engineer, he took his doctorate at the Massachusetts Institute of Technology in 2003, with Paula Hammond as adviser.",
      "His thesis also built polymer electrolyte films layer by layer that conducted ions well and held together mechanically, and it used nanocrystals of the Prussian blue family as electrochromic layers.",
      "He moved to the National Institute of Standards and Technology as a postdoctoral fellow in 2003. He later led its Polymer Processing Group and specialised in soft X-ray spectroscopy and scattering. He received a Presidential Early Career Award in 2009.",
    ],
    sources: [
      s("lab", "Dean DeLongchamp, National Institute of Standards and Technology", "https://www.nist.gov/node/1154396"),
      s("paper", "DeLongchamp, Engineering the electrochromism and ion conduction of layer-by-layer assembled films, Massachusetts Institute of Technology (2003)", "https://dspace.mit.edu/handle/1721.1/29995"),
    ],
  },
  "Henry Dircks": {
    born: 1806, died: 1873, about: [
      "Born in Liverpool, he was apprenticed to a merchant house, worked as an engineer on railways, canals and mines, and then set up as a consulting engineer. He took out several patents between 1840 and 1857.",
      "Grace's Guide dates his design of the ghost illusion to 1858. Theatre owners declined his models because their stages would have needed rebuilding. John Henry Pepper acquired one around 1862 and adapted it.",
      "Pepper's book dates his first showing to just before Christmas 1862, the Linda Hall Library to late 1862 or early 1863. By Pepper's account he then had a provisional patent taken out in both their names. The letters patent were dated 5 February 1863.",
      "The library says they agreed that Pepper would take the profits and Dircks the credit, and that Pepper named only himself in public. Pepper wrote that he named Dircks daily as co-inventor. Dircks defended his claim in a book of 1863.",
    ],
    sources: [
      s("archive", "Henry Dircks, Grace's Guide to British Industrial History", "https://gracesguide.co.uk/Henry_Dircks"),
      s("archive", "John Henry Pepper, Scientist of the Day, Linda Hall Library", "https://www.lindahall.org/about/news/scientist-of-the-day/john-henry-pepper/"),
      s("paper", "John Henry Pepper, The True History of the Ghost (1890)", "https://cuny.manifoldapp.org/read/the-true-history-of-the-ghost/section/c430b376-bfb6-48a0-9b78-0b2bc98a369f"),
      s("press", "Curiosities from 150 years of The Engineer archive, The Engineer", "https://www.theengineer.co.uk/content/news/curiosities-from-150-years-of-the-engineer-archive-2"),
      s("reference", "Henry Dircks, Wikipedia", "https://en.wikipedia.org/wiki/Henry_Dircks"),
    ],
  },
  "John Henry Pepper": {
    born: 1821, died: 1900, about: [
      "A chemist and lecturer on popular science, he joined the staff of the Royal Polytechnic Institution in 1848 and was its director within ten years. He also wrote books, among them The Playbook of Metals.",
      "Around 1862 he acquired one of Henry Dircks's models and adapted it, hiding the second actor in the orchestra pit. By his own account he took out a provisional patent the day after his first showing, naming them both at his request.",
      "The letters patent were dated 5 February 1863. The Linda Hall Library dates the first showing to late 1862 or early 1863. It says the two agreed that Pepper would take the profits and Dircks the credit.",
      "The library says Pepper used only his own name in public. Pepper wrote that he named Dircks as co-inventor every morning and evening. Dircks protested, the library says, and in 1863 published a book in his own defence.",
    ],
    sources: [
      s("archive", "John Henry Pepper, Scientist of the Day, Linda Hall Library", "https://www.lindahall.org/about/news/scientist-of-the-day/john-henry-pepper/"),
      s("paper", "John Henry Pepper, The True History of the Ghost (1890)", "https://cuny.manifoldapp.org/read/the-true-history-of-the-ghost/section/c430b376-bfb6-48a0-9b78-0b2bc98a369f"),
    ],
  },
  "Valerie Thomas": {
    born: 1943, about: [
      "The Lemelson-MIT Program writes that her all-girls high school did not treat science as a subject for women, and that no one there encouraged her to take the advanced mathematics classes on offer.",
      "In 1976 she saw an exhibit where a concave mirror made a light bulb appear to glow in an empty socket. She wondered whether such an image could be transmitted, and began experiments with concave mirrors that year.",
      "At NASA she managed the development of image processing systems for Landsat satellite data. She filed her patent for the illusion transmitter in December 1978, and it was granted in 1980. It used a parabolic mirror at each end.",
      "She was later project manager of the Space Physics Analysis Network, and retired from NASA in 1995. NASA gave her its Equal Opportunity Medal. She also mentored young students through the National Technical Association.",
    ],
    sources: [
      s("lab", "Valerie Thomas, Lemelson-MIT Program, Massachusetts Institute of Technology", "https://lemelson.mit.edu/resources/valerie-thomas"),
      s("patent", "Valerie L. Thomas, Illusion transmitter, US 4,229,761 (1980)", "https://patents.google.com/patent/US4229761"),
    ],
  },
  "Karri Palovuori": {
    about: [
      "A professor at Tampere University of Technology, he worked with Ismo Rakkolainen on the fog screen. The two had described a walk-through virtual environment at the IEEE Virtual Reality conference in Orlando in 2002.",
      "At Tampere University he worked in electronics and embedded systems, including the design of custom integrated circuits. His profile there lists more than ten patents.",
    ],
    sources: [
      s("lab", "Ismo Rakkolainen, Lemelson-MIT Program, Massachusetts Institute of Technology", "https://lemelson.mit.edu/resources/ismo-rakkolainen"),
      s("archive", "Rakkolainen, Landkammer, Piiro and Palovuori, The Walk-thru Fog Screen Experience, ACM SIGGRAPH History Archives", "https://history.siggraph.org/experience/the-walk-thru-fog-screen-experience-by-rakkolainen-landkammer-piiro-and-palovuori/"),
      s("lab", "Karri Palovuori, FutureChips supervisors, Tampere University", "https://projects.tuni.fi/futurechips/supervisors/karri-palovuori/"),
    ],
  },
  "Ismo Rakkolainen": {
    about: [
      "A senior researcher in the Technology Signal Processing Laboratory at Tampere University of Technology, he worked with Karri Palovuori to create the fog screen.",
      "During the 1990s he built early prototypes in his living room from plastic drinking straws, with air pushed up through small nozzles from below.",
      "The Lemelson-MIT Program dates the first showing to the Turku Science Exhibition in Finland in autumn 2002. The screen was shown at the SIGGRAPH computer graphics conference in San Diego in 2003. FogScreen Inc was founded in 2003 to make and sell it.",
      "He stayed at Tampere University as a university research fellow and adjunct professor in the TAUCHI Research Center, working on user interfaces, virtual reality and new displays.",
    ],
    sources: [
      s("lab", "Ismo Rakkolainen, Lemelson-MIT Program, Massachusetts Institute of Technology", "https://lemelson.mit.edu/resources/ismo-rakkolainen"),
      s("lab", "Ismo Rakkolainen, home page, Tampere University", "https://homepages.tuni.fi/ismo.rakkolainen/"),
    ],
  },
  "Max Hirsch": {
    about: [
      "He filed the patent in January 1958 in his own name, with no company named as assignee. A cathode-ray tube and its lenses and mirrors turned together with a rear-projection screen, spun by a motor at more than twenty turns a second.",
      "A second patent, filed in November 1958 and granted in April 1961, let the tube stay still while circuits turned the picture on its face in step with the screen.",
    ],
    sources: [
      s("patent", "Max Hirsch, Three dimensional display apparatus, US 2,967,905 (1961)", "https://patents.google.com/patent/US2967905A/en"),
      s("patent", "Max Hirsch, Three dimensional display apparatus, US 2,979,561 (1961)", "https://patents.google.com/patent/US2979561A/en"),
    ],
  },
  "Gregg Favalora": {
    about: [
      "He built his display as his final year project at Yale University in 1996, with laser beams reflected onto a fast rotating screen. He developed it further as a doctoral student in electrical engineering at Harvard, and was on leave by 1998.",
      "He co-founded Actuality Systems with two Harvard students, Michael J. Giovinco and Shawn T. Samuel, and won the MIT $50K Entrepreneurship Competition in 1997. MIT Technology Review named him among its innovators under 35 in 1999.",
      "In 2009 he joined Optics for Hire, an optical design consultancy in Arlington, Massachusetts. By 2011 he was named on nine United States patents.",
    ],
    sources: [
      s("press", "Students Get Sneak Preview of 3-D TV, The Harvard Crimson (1998)", "https://www.thecrimson.com/article/1998/4/23/students-get-sneak-preview-of-3-d/"),
      s("press", "Gregg Favalora, Innovators Under 35, MIT Technology Review (1999)", "https://innovatorsunder35.com/the-list/gregg-favalora"),
      s("press", "LED engineering firm adds display veteran Gregg Favalora, LEDs Magazine (2009)", "https://www.ledsmagazine.com/company-newsfeed/article/16688859/led-engineering-firm-adds-display-veteran-gregg-favalora"),
      s("press", "Optics inventor has eye for new, Boston.com (2011)", "https://www.boston.com/news/jobs/2011/01/18/optics_inventor_has_eye_for_ne/"),
    ],
  },
  "Elizabeth Downing": {
    about: [
      "Before Stanford she worked as an engineer on laser equipment at the FMC Corporation Technology Center in Santa Clara, California.",
      "As a graduate student she spent eight years on the display, with borrowed laboratory space and donated lasers. It had a United States Navy grant of 350,000 dollars. The prototype cube was a stack of three doped glass layers, one for each primary colour.",
      "She set up 3D Technology Laboratories in Mountain View, California, to sell the patented device, and by 1997 was planning a larger cube of many thin layers.",
    ],
    sources: [
      s("paper", "Downing, Hesselink, Ralston and Macfarlane, A three-color, solid-state, three-dimensional display, Science (1996)", "https://research.ibm.com/publications/a-three-color-solid-state-three-dimensional-display"),
      s("press", "John Drake, An added dimension in display technology, MIT Technology Review (1997)", "https://www.technologyreview.com/1997/05/01/237287/an-added-dimension-in-display-technology/amp/"),
      s("press", "Inside 3-D, Los Angeles Times in The Roanoke Times (1996)", "https://scholar.lib.vt.edu/VA-news/ROA-Times/issues/1996/rt9608/960830/08300057.htm"),
    ],
  },
  "Lambertus Hesselink": {
    about: [
      "He studied applied physics and mechanics at Twente University and took his doctorate at the California Institute of Technology in 1977. At Stanford University he became professor of electrical engineering. Elizabeth Downing continued her display research with him there from 1988.",
      "His research covered ultra high density optical data storage, nonlinear optics and nanophotonics. He founded Siros Technologies in 1997 and co-founded Senvid in 1999. The National Academy of Inventors made him a fellow in 2022.",
    ],
    sources: [
      s("lab", "Lambertus Hesselink, Stanford Profiles, Stanford University", "https://profiles.stanford.edu/lambertus-hesselink"),
      s("lab", "Lambertus Hesselink, Hesselink Group, Stanford University", "https://hesselinkgroup.stanford.edu/people/lambertus-hesselink"),
      s("press", "John Drake, An added dimension in display technology, MIT Technology Review (1997)", "https://www.technologyreview.com/1997/05/01/237287/an-added-dimension-in-display-technology/amp/"),
    ],
  },
  "John Ralston": {
    about: [
      "In 1996 he worked at SDL, a laser maker in San Jose, California, which supplied the small high power lasers used to draw points inside the glass. He was one of the four authors of the paper in Science.",
    ],
    sources: [
      s("press", "Inside 3-D, Los Angeles Times in The Roanoke Times (1996)", "https://scholar.lib.vt.edu/VA-news/ROA-Times/issues/1996/rt9608/960830/08300057.htm"),
      s("paper", "Downing, Hesselink, Ralston and Macfarlane, A three-color, solid-state, three-dimensional display, Science (1996)", "https://research.ibm.com/publications/a-three-color-solid-state-three-dimensional-display"),
    ],
  },
  "Roger Macfarlane": {
    about: [
      "A physicist at the IBM Almaden Research Center, he studied how atoms and molecules behave in solids, with a view to storing data at very high density.",
      "He was one of the four authors of the paper in Science of 1996 on the three colour display, which drew its light from glass doped with rare earth elements. IBM Research lists the paper among its publications.",
      "His papers included laser spectroscopy of rare earth ions in crystals, and in 1985 a report of spectral hole burning in such a crystal. He was still publishing on rare earth doped materials in 2013.",
    ],
    sources: [
      s("lab", "Applications of Laser Spectroscopy, What Physicists Do, Sonoma State University (1986)", "https://phys-astro.a7prd.sonoma.edu/public-events/what-physicists-do/1986-fall/applications-laser-spectroscopy"),
      s("press", "Inside 3-D, Los Angeles Times in The Roanoke Times (1996)", "https://scholar.lib.vt.edu/VA-news/ROA-Times/issues/1996/rt9608/960830/08300057.htm"),
      s("paper", "Winnacker, Shelby and Macfarlane, Photon-gated hole burning, Optics Letters (1985)", "https://research.ibm.com/publications/photon-gated-hole-burning-a-new-mechanism-using-two-step-photoionization"),
      s("paper", "Cone, Thiel, Sun, Böttger and Macfarlane, Quantum information, laser frequency stabilization, and optical signal processing with rare-earth doped materials, Frontiers in Optics (2013)", "https://research.ibm.com/publications/quantum-information-laser-frequency-stabilization-and-optical-signal-processing-with-rare-earth-doped-materials"),
      s("paper", "Downing, Hesselink, Ralston and Macfarlane, A three-color, solid-state, three-dimensional display, Science (1996)", "https://research.ibm.com/publications/a-three-color-solid-state-three-dimensional-display"),
    ],
  },
  "Daniel Smalley": {
    about: [
      "He studied at the Massachusetts Institute of Technology, with a degree in electrical engineering in 2005 and a doctorate in holography in 2013. At MIT he worked on a low cost holographic video monitor.",
      "At Brigham Young University he became professor of electrical and computer engineering. In the display, lasers trapped and heated a single cellulose particle and steered it through the air while red, green and blue light lit it.",
    ],
    sources: [
      s("lab", "Daniel Smalley, About, Electrical and Computer Engineering, Brigham Young University", "https://ece.byu.edu/daniel-smalley-about"),
      s("lab", "Daniel E. Smalley Thesis Defense, MIT Media Lab (2013)", "https://www.media.mit.edu/events/daniel-e-smalley-thesis-defense/"),
      s("lab", "Better than a hologram, BYU News (2018)", "https://news.byu.edu/news/better-hologram-byu-study-produces-3d-images-float-thin-air"),
    ],
  },
  "Ryuji Hirayama": {
    about: [
      "He studied engineering at Chiba University in Japan and took his doctorate there in 2017, with a thesis on volumetric displays that hold several flat images. He then held research fellowships from the Japan Society for the Promotion of Science.",
      "One of those fellowships took him in 2018 to the laboratory of Nobuyuki Masuda at Tokyo University of Science. In 2019 he joined the Interact Lab at the University of Sussex as a Rutherford Fellow, and was lead author of the paper in Nature.",
      "He moved to the computer science department of University College London in 2020, became a lecturer in 2022 and an associate professor in 2026. He leads FabDisp, a project on acoustic holography for display and fabrication, and co-founded the company AcoustoFab in 2023.",
    ],
    sources: [
      s("lab", "Ryuji Hirayama, curriculum vitae", "https://ryujihirayama.github.io/web/documents/CV_Hirayama.pdf"),
      s("lab", "Research news, University of Sussex (2019)", "https://www.sussex.ac.uk/news/research?id=50264"),
      s("paper", "Hirayama, Martinez Plasencia, Masuda and Subramanian, A volumetric display for visual, tactile and audio presentation using acoustic trapping, Nature (2019)", "https://ryujihirayama.github.io/web/projects/matd.html"),
    ],
  },
  "Diego Martinez Plasencia": {
    about: [
      "He was an assistant lecturer at a university in Spain and a research associate at the University of Bristol before becoming a lecturer in interactive 3D graphics at the University of Sussex. He later moved to University College London as an associate professor.",
      "The University of Sussex named him co-creator of the Multimodal Acoustic Trap Display. He explained that it directed and focused ultrasound, which could stimulate the ears for sound or the skin for touch.",
      "At University College London he co-founded the Multi-Sensory Devices Group with Marianna Obrist and Sriram Subramanian. He worked on 3D displays, from tabletop systems with several views to displays made of moving particles.",
    ],
    sources: [
      s("archive", "Keynotes, ACM Symposium on Virtual Reality Software and Technology (2021)", "https://vrst.acm.org/vrst2021/keynotes/"),
      s("lab", "Research news, University of Sussex (2019)", "https://www.sussex.ac.uk/news/research?id=50264"),
    ],
  },
  "Nobuyuki Masuda": {
    about: [
      "He was a professor of applied electronics at Tokyo University of Science, where his laboratory designed special purpose computing circuits on programmable chips (FPGAs) and used graphics processors to speed up numerical work, much of it for computer generated holograms.",
      "From 2018 to 2021 he led a project that built a dedicated FPGA computer for digital holography, which his team reported to be faster than a PC. Ryuji Hirayama worked in his laboratory as a research fellow in 2018 before going to Sussex.",
    ],
    sources: [
      s("lab", "Nobuyuki Masuda, researcher profile, Tokyo University of Science", "https://tus.elsevierpure.com/ja/persons/nobuyuki-masuda/"),
      s("archive", "Special purpose computer system for digital holography technology using FPGA, KAKEN grant record, National Institute of Informatics (2018 to 2021)", "https://kaken.nii.ac.jp/en/grant/KAKENHI-PROJECT-18K11328"),
      s("lab", "Ryuji Hirayama, curriculum vitae", "https://ryujihirayama.github.io/web/documents/CV_Hirayama.pdf"),
    ],
  },
  "Sriram Subramanian": {
    about: [
      "When the display was published he was Professor of Informatics at Sussex and held a Royal Academy of Engineering Chair in Emerging Technologies. The university named him as leader of the project.",
      "He moved to University College London, where he leads the Multi-Sensory Devices Group, co-founded with Diego Martinez Plasencia and Marianna Obrist. It works on touch in mid air, levitation and contactless control by ultrasound.",
      "UCL says his early hardware designs led to the company Ultrahaptics, now Ultraleap. He founded Metasonixx and co-founded AcoustoFab. UCL reported his election as a Fellow of the Royal Academy of Engineering in 2025.",
    ],
    sources: [
      s("lab", "Research news, University of Sussex (2019)", "https://www.sussex.ac.uk/news/research?id=50264"),
      s("lab", "Professor Sriram Subramanian elected Fellow of the Royal Academy of Engineering, UCL Engineering (2025)", "https://www.ucl.ac.uk/engineering/news/2025/sep/professor-sriram-subramanian-elected-fellow-royal-academy-engineering"),
      s("archive", "Keynotes, ACM Symposium on Virtual Reality Software and Technology (2021)", "https://vrst.acm.org/vrst2021/keynotes/"),
    ],
  },
  "Yoichi Ochiai": {
    about: [
      "He studied information media at the University of Tsukuba and took a doctorate in applied computer science at the University of Tokyo in 2015. He then joined Tsukuba's Institute of Library, Information and Media Science, as assistant professor and from 2017 associate professor.",
      "The femtosecond display, called Fairy Lights in Femtoseconds, was shown at SIGGRAPH 2015 with colleagues from Utsunomiya University, the Nagoya Institute of Technology, the University of Tokyo and Sony CSL. The team argued that plasma from femtosecond pulses was safer than from nanosecond pulses.",
      "He was also chief executive of Pixie Dust Technologies from 2015 and director of Tsukuba's Research and Development Center for Digital Nature from 2020. MIT Technology Review listed him among its Innovators Under 35 for Japan in 2020.",
    ],
    sources: [
      s("lab", "Fairy Lights in Femtoseconds, Digital Nature Group, University of Tsukuba (2015)", "https://digitalnature.slis.tsukuba.ac.jp/2015/06/fairy-lights-in-femtoseconds/"),
      s("lab", "OCHIAI Yoichi, Tsukuba Researcher Information System, University of Tsukuba", "https://trios.tsukuba.ac.jp/en/researcher/3783"),
      s("press", "Yoichi Ochiai, Innovators Under 35, MIT Technology Review (2020)", "https://www.innovatorsunder35.com/the-list/yoichi-ochiai/"),
    ],
  },
  "Charles Wheatstone": {
    born: 1802, died: 1875, about: [
      "Born near Gloucester, he moved with his family to London and was apprenticed to his uncle's firm of musical instrument makers. In 1834 King's College London made him Professor of Experimental Philosophy.",
      "His paper on the stereoscope, Contributions to the Physiology of Vision, appeared in the Philosophical Transactions of the Royal Society. He drew simple line figures to view in it and, in 1840, asked William Henry Fox Talbot for stereoscopic photographs.",
      "With William Fothergill Cooke he worked on the electric telegraph, and the Royal Society dates its installation on the Great Western Railway to 1838. He also gave his name to the Wheatstone Bridge for measuring electrical resistance, and was knighted in 1868.",
    ],
    sources: [
      s("archive", "Wheatstone, life, King's College London Archives", "https://kingscollections.org/exhibitions/archives/wheatstone/life"),
      s("archive", "180 years of 3D, Royal Society blog (2018)", "https://royalsociety.org/blog/2018/08/180-years-of-3d"),
    ],
  },
  "Kenneth Dunkley": {
    about: [
      "He took a master's degree in physics and became president of Holospace Laboratories in Camp Hill, Pennsylvania. For several years he ran visual effects workshops at the Museum of Scientific Discovery in Harrisburg, and worked on holography, lasers and electro optics.",
      "The National Business League says the idea came while he was demonstrating holography at the Franklin Institute, when tubes with pinholes gave a flat photograph depth. He filed the patent in April 1986. Its pinholes and frames can be moved apart or together.",
    ],
    sources: [
      s("press", "Kenneth Dunkley, The National Business League", "https://nationalbusinessleague.org/kenneth-dunkley/"),
      s("patent", "Kenneth J. Dunkley, Three-dimensional viewing glasses, US patent 4,810,057 (1989)", "https://patents.google.com/patent/US4810057"),
    ],
  },
  "Charles Harrison": {
    born: 1931, died: 2018, about: [
      "Born in Shreveport, Louisiana, he took a degree in industrial design at the School of the Art Institute of Chicago in 1954, served in the United States Army as a mapmaker in Germany, and later earned a master's in art education at night.",
      "He took the View-Master job as a freelance designer through Robert Podall Associates, for the maker Sawyer's. He said moulding it in thermoplastic rather than Bakelite would make units ten times faster. The Henry Ford says it took him under two weeks.",
      "The Henry Ford records that the design manager at Sears, Roebuck and Company told him of an unwritten policy against hiring Black people, and hired him as a freelancer instead. In 1961 Sears made him a staff designer.",
      "The Henry Ford calls him the first Black executive at Sears headquarters. He became chief of design, and Cooper Hewitt credits him with over 750 products. He retired in 1993, taught in Chicago, and won the National Design Award for Lifetime Achievement in 2008.",
    ],
    sources: [
      s("archive", "Remembering Charles Harrison (1931 to 2018), Cooper Hewitt, Smithsonian Design Museum (2018)", "https://www.cooperhewitt.org/2018/12/11/remembering-charles-harrison-1931-2018/"),
      s("archive", "Expanding Views: Charles Harrison's Redesign of the View-Master, The Henry Ford", "https://www.thehenryford.org/collections/explore/articles/expanding-views-charles-harrisons-redesign-of-the-view-master"),
    ],
  },
  "Frederic Ives": {
    born: 1856, died: 1937, about: [
      "Born in Litchfield, Connecticut, he was apprenticed as a boy to a printer and, with no formal schooling, was put in charge of the photographic laboratory at Cornell University while still a teenager.",
      "There he worked out a halftone process for printing photographs, in commercial use by 1881, and a crossline screen. He later made the Kromskop, for colour stereo pictures from three pairs of filtered negatives. He held about seventy patents.",
      "Living in Philadelphia, he filed his patent for the parallax stereogram in September 1902 and was granted it in April 1903. A screen of opaque lines with clear spaces, set at a calculated distance, let each eye see only its own picture.",
    ],
    sources: [
      s("archive", "Frederic Ives, Scientist of the Day, Linda Hall Library", "https://www.lindahall.org/about/news/scientist-of-the-day/frederic-ives"),
      s("patent", "Frederic E. Ives, Parallax stereogram and process of making same, US patent 725,567 (1903)", "https://patents.google.com/patent/US725567"),
      s("reference", "Frederic Eugene Ives, Encyclopaedia Britannica", "https://britannica.com/biography/Frederic-Eugene-Ives"),
    ],
  },
  "Walter Hess": {
    born: 1881, died: 1973, about: [
      "Born in Frauenfeld, Switzerland, he studied medicine at Lausanne, Berlin, Kiel and Zurich and qualified in 1906. He trained in ophthalmology for two years under Otto Haab in Zurich before opening his practice.",
      "His patent described two stereoscopic negatives printed in strips behind a celluloid plate of cylindrical ribs, so no stereoscope or spectacles were needed. C. W. Hess says his plans to sell it came to nothing when the First World War broke out.",
      "In 1912 he joined the Physiological Institute of the University of Zurich, and in 1917 became its professor and head, until 1951. He shared the Nobel Prize with Egas Moniz, for work on the diencephalon as a centre coordinating the internal organs.",
    ],
    sources: [
      s("patent", "Walter Hess, Stereoscopic picture, US patent 1,128,979 (1915)", "https://patents.google.com/patent/US1128979"),
      s("paper", "C. W. Hess, Walter R. Hess, Schweizer Archiv für Neurologie und Psychiatrie (2008)", "https://mdpi-res.com/d_attachment/sanpp/sanpp-159-00255/article_deploy/sanpp-159-00255.pdf"),
      s("lab", "Walter Rudolf Hess, brochure, University Hospital Zurich (2021)", "https://www.usz.ch/app/uploads/2021/03/Hess-Broschu%CC%88re_final.pdf"),
    ],
  },
  "Hank Willis Thomas": {
    born: 1976, about: [
      "He took a degree in fine art at New York University in 1998 and a master's at California College of the Arts in 2004. He began as a photographer and later made sculpture and installations.",
      "Art21 says his work turns on perception and perspective and on brands, logos and icons, and honours the history of Black Americans. In Freedom Riders on Colors for a Large Wall, of 2021, he printed portraits of civil rights activists on coloured retroreflective vinyl.",
      "Two of his lenticular prints of 2017, They are Us, Us is Them and Impossibly, hang in Harvey Milk Terminal 1 at San Francisco International Airport. In the second, the words possible, possibly and impossible take turns as the viewer moves.",
    ],
    sources: [
      s("archive", "Hank Willis Thomas, Art21", "https://art21.org/artist/hank-willis-thomas/"),
      s("archive", "They are Us, Us is Them and Impossibly, SFO Museum", "https://www.sfomuseum.org/public-art/public-collection/they-are-us-us-them-and-impossibly"),
    ],
  },
  "Dennis Gabor": {
    born: 1900, died: 1979, about: [
      "Born in Budapest, he studied electrical engineering in Berlin, taking a doctorate in 1927, and then worked in research at Siemens and Halske. In 1934 he joined the British Thomson-Houston Company at Rugby.",
      "In his Nobel lecture he said the aim was a better electron microscope, sharp enough to resolve atomic lattices. His early optical trials used a mercury lamp, whose short coherence kept objects small. He dated the method's revival, with the laser, to 1963.",
      "From 1949 to 1967 he taught at Imperial College London, where he became professor of applied electron physics. The Nobel Prize in Physics of 1971 credits him with the invention and development of the holographic method.",
    ],
    sources: [
      s("archive", "Dennis Gabor, Facts, The Nobel Prize", "https://www.nobelprize.org/prizes/physics/1971/gabor/facts"),
      s("paper", "Dennis Gabor, Holography, 1948 to 1971, Nobel Lecture (1971)", "https://nobelprize.org/uploads/2018/06/gabor-lecture-1.pdf"),
      s("archive", "Dennis Gabor, Physics History Network, American Institute of Physics", "https://history.aip.org/phn/11710001.html"),
    ],
  },
  "Emmett Leith": {
    born: 1927, died: 2005, about: [
      "Born in Detroit, he studied physics at Wayne State University. In 1952 he joined the Radar Laboratory of the University of Michigan's Willow Run Laboratories, where he worked on synthetic aperture radar.",
      "He brought Juris Upatnieks onto the holography work in 1960. They called their method lensless photography, and showed a hologram of a toy train at a meeting of the Optical Society of America in 1964.",
      "He became a full professor at Michigan in 1968 and received the National Medal of Science in 1979. The Optical Society of America named a medal after him in 2006.",
    ],
    sources: [
      s("archive", "Emmett N. Leith, Biographies, Optica", "https://www.optica.org/History/Biographies/bios/Emmett_N_Leith"),
      s("lab", "It Happened at Michigan: The first practical holograms, University of Michigan Record (2024)", "https://record.umich.edu/articles/it-happened-at-michigan-the-first-practical-holograms"),
    ],
  },
  "Juris Upatnieks": {
    born: 1936, about: [
      "Born in Riga, he left Latvia in 1944 and reached the United States in 1951. He took a degree in electrical engineering at the University of Akron in 1960.",
      "Emmett Leith recruited him that year to Willow Run Laboratories at the University of Michigan. The two patented their holography work jointly as Wavefront Reconstruction Using a Coherent Reference Beam.",
      "From 1973 to 1993 he worked at the University of Michigan, at the Environmental Research Institute and then in electrical and computer engineering. He held 19 United States patents and received the Emmett N. Leith Medal in 2010.",
    ],
    sources: [
      s("archive", "Juris Upatnieks, Biographies, Optica", "https://optica.org/History/Biographies/bios/Juris_Upatnieks"),
      s("lab", "The Trailblazer of Holography: Juris Upatnieks, Akadēmiskā Dzīve, University of Latvia", "https://www.lu.lv/par-mums/lu-mediji/zurnali/akademiska-dzive/arhivs/45-numurs/holografijas-celmlauzis-juris-upatnieks"),
      s("lab", "It Happened at Michigan: The first practical holograms, University of Michigan Record (2024)", "https://record.umich.edu/articles/it-happened-at-michigan-the-first-practical-holograms"),
    ],
  },
  "Margaret Benyon": {
    born: 1940, died: 2016, about: [
      "Trained as a painter, she began making holograms in 1968, when, the Center for the Holographic Arts says, holography was available only to scientists. Her stated aim was to take it out of the science laboratory and widen what counted as fine art.",
      "She lived in Australia in the 1970s. After she returned to Britain in 1980, her holograms dealt with the human body. For 23 years she made most of them in a simple home studio on the south coast of England.",
      "Tigirl, of 1985, set a holographic self portrait against a photograph of a tiger. In 1994 the Royal College of Art in London awarded her a doctorate for research in art holography.",
      "She was appointed MBE in the New Year Honours of 2000, for services to art, and her work is in the Victoria and Albert Museum and the Australian National Gallery. She was an honorary visiting fellow at the University of New South Wales.",
    ],
    sources: [
      s("archive", "Margaret Benyon (1940 to 2016), Center for the Holographic Arts", "https://holocenter.org/margaret-benyon"),
    ],
  },
  "Stephen Benton": {
    born: 1941, died: 2003, about: [
      "Born in San Francisco, he studied electrical engineering at MIT, working with Harold Edgerton, and as a student worked in Edwin Land's vision research laboratory at Polaroid. He took his doctorate at Harvard in 1968.",
      "MIT News credits him with inventing rainbow holography, which lets a hologram be seen in ordinary white light.",
      "He returned to MIT in 1980, founded its Spatial Imaging Group in 1982 and was on the founding faculty of the Media Lab in 1984.",
      "In 1989 he supervised Mary Lou Jepsen's master's thesis on the design and building of a holographic video display. He later directed the Center for Advanced Visual Studies.",
    ],
    sources: [
      s("lab", "Stephen Benton, holography pioneer, MIT News (2003)", "https://news.mit.edu/2003/benton-1119"),
      s("lab", "Holography pioneer Stephen Benton dies at 62, MIT Media Lab (2003)", "https://www.media.mit.edu/articles/holography-pioneer-stephen-benton-dies-at-62/"),
      s("paper", "Jepsen, Holographic video: design and implementation of a display system, master's thesis supervised by Stephen A. Benton, Massachusetts Institute of Technology (1989)", "https://dspace.mit.edu/entities/publication/e4d4f9f7-4453-46a3-83c4-7ba31526e0af"),
    ],
  },
  "Mary Lou Jepsen": {
    about: [
      "She studied electrical engineering and took a doctorate in optical physics at Brown University. As an artist she worked mainly in large scale holography.",
      "Her master's degree at the MIT Media Lab was in computational holography. Her thesis of 1989, supervised by Stephen Benton, was titled Holographic Video: Design and Implementation of a Display System.",
      "She was chief technology officer and chief architect of the One Laptop per Child laptop, and chief technology officer of the display division at Intel. She also ran a display company based in Taipei.",
      "She directed engineering at Google X, where she founded and led two programmes, and at Facebook, where her work included virtual reality at Oculus. She founded Openwater, to put imaging of MRI quality into a wearable device.",
    ],
    sources: [
      s("archive", "Mary Lou Jepsen, Computer History Museum", "https://computerhistory.org/profile/mary-lou-jepsen/"),
      s("paper", "Jepsen, Holographic video: design and implementation of a display system, master's thesis supervised by Stephen A. Benton, Massachusetts Institute of Technology (1989)", "https://dspace.mit.edu/entities/publication/e4d4f9f7-4453-46a3-83c4-7ba31526e0af"),
    ],
  },
  "Ali Javan": {
    born: 1926, died: 2016, about: [
      "He came to the United States in 1949 and took his doctorate in physics at Columbia University in 1954, under Charles Townes, without a bachelor's or master's degree.",
      "He worked out the principle of the helium and neon laser in 1958. At Bell Laboratories, with his colleague William Bennett, he had the laser running on 12 December 1960. The next day it carried a telephone conversation.",
      "He joined the Massachusetts Institute of Technology in 1961 and held the Francis Wright Davis chair of physics from 1978 to 1996. He was inducted into the National Inventors Hall of Fame in 2006.",
    ],
    sources: [
      s("lab", "Physics professor emeritus Ali Javan dies at 89, MIT News (2016)", "https://news.mit.edu/2016/physics-professor-emeritus-ali-javan-dies-0929"),
    ],
  },
  "Nasser Peyghambarian": {
    about: [
      "He took his doctorate in solid state physics at Indiana University in 1982 and came to the Optical Sciences Center at the University of Arizona as a postdoctoral fellow.",
      "A professor of optical sciences and of materials science and engineering, he directed a National Science Foundation research centre for integrated access networks and founded two companies, NP Photonics and TIPD.",
      "He led the team behind the 2010 telepresence display, a 17 inch screen fed by sixteen cameras, and said it could help in surgery. He was named a fellow of the National Academy of Inventors in 2016.",
    ],
    sources: [
      s("lab", "Nasser Peyghambarian, University of Arizona Profiles", "https://profiles.arizona.edu/person/nnp"),
      s("press", "Star Wars telepresence tantalisingly close, Physics World (2010)", "https://physicsworld.com/a/star-wars-telepresence-tantalisingly-close/"),
    ],
  },
  "Pierre-Alexandre Blanche": {
    about: [
      "At the University of Arizona's optical sciences college he worked in diffractive optics and holography. He was lead author of the 2010 report on holographic telepresence from the group.",
      "In that system one computer turned the views of sixteen cameras into data for hogels, which Physics World calls holographic pixels. It sent the data over Ethernet to a second computer, which had a laser write them onto the polymer screen.",
      "In 2021 he won an Optimax grant toward a curved head-up display built on a waveguide. Optica made him a fellow, citing holographic 3D displays and augmented reality combiners.",
    ],
    sources: [
      s("lab", "Dr. Pierre-Alexandre Blanche named Fellow Member of Optica, University of Arizona Wyant College of Optical Sciences (2021)", "https://www.optics.arizona.edu/news-events/news/quicknews/dr-pierre-alexandre-blanche-named-fellow-member-optica"),
      s("lab", "Pierre-Alexandre Blanche selected as 2021 Optimax research grant winner, University of Arizona Wyant College of Optical Sciences (2021)", "https://www.optics.arizona.edu/news-events/news/quicknews/pierre-alexandre-blanche-selected-2021-optimax-research-grant-winner"),
      s("press", "Star Wars telepresence tantalisingly close, Physics World (2010)", "https://physicsworld.com/a/star-wars-telepresence-tantalisingly-close/"),
    ],
  },
  "Ivan Sutherland": {
    born: 1938, about: [
      "Born in Hastings, Nebraska, he studied at the Carnegie Institute of Technology and Caltech and took his doctorate at MIT in 1963 under Claude Shannon, with a thesis on Sketchpad, a graphical system for drawing with a computer.",
      "In 1964 he succeeded J. C. R. Licklider as head of the Information Processing Techniques Office of the Advanced Research Projects Agency, in the United States Department of Defense. From 1965 to 1968 he was an associate professor at Harvard University.",
      "In 1968, with the help of the student Bob Sproull, he built a headset that hung from the ceiling and was nicknamed the Sword of Damocles. The Association for Computing Machinery calls it the first head-mounted display for virtual and augmented reality.",
      "He taught at the University of Utah from 1968 to 1974 and co-founded Evans and Sutherland with David Evans. He received the Turing Award in 1988. In 1990 Sun Microsystems bought Sutherland, Sproull and Associates, the consulting firm he founded in 1980.",
    ],
    sources: [
      s("archive", "Ivan Sutherland, A.M. Turing Award, Association for Computing Machinery", "https://amturing.acm.org/award_recipient/sutherland_3467412"),
    ],
  },
  "Bob Sproull": {
    about: [
      "According to the Association for Computing Machinery, he was the student who helped Ivan Sutherland build the head-mounted display of 1968 nicknamed the Sword of Damocles.",
      "He worked at the Xerox Palo Alto Research Center and was an associate professor of computer science at Carnegie Mellon University, then a principal of Sutherland, Sproull and Associates. He joined Sun Microsystems in 1990.",
      "By 1992 he was a vice president and fellow of Sun Microsystems Laboratories, setting up a section of it in Billerica, Massachusetts. He retired as vice president and director of Oracle Labs, a research group that began at Sun, which Oracle bought in 2010.",
      "With William Newman he wrote the textbook Principles of Interactive Computer Graphics. He built clipping hardware, a graphics package independent of any one device and laser printing software, and worked on asynchronous circuits. He was elected to the National Academy of Engineering.",
    ],
    sources: [
      s("archive", "Bob Sproull, Computer History Museum", "https://computerhistory.org/profile/bob-sproull/"),
      s("archive", "Robert F. Sproull, ACM SIGGRAPH History Archives", "https://history.siggraph.org/?p=46414"),
      s("archive", "Ivan Sutherland, A.M. Turing Award, Association for Computing Machinery", "https://amturing.acm.org/award_recipient/sutherland_3467412"),
    ],
  },
  "Samuel Achilefu": {
    about: [
      "After college in Nigeria, a French government scholarship took him to the University of Nancy, where he took a doctorate in molecular and materials chemistry. He trained at Oxford, then joined the discovery research department of Mallinckrodt Medical in St. Louis in 1993.",
      "At Washington University he was professor of radiology and of biomedical engineering. A team he led developed the goggles, with help from Viktor Gruev of the engineering school and Ron Liang of the University of Arizona. The National Cancer Institute funded the work.",
      "In 2016 he was installed as Michel M. Ter-Pogossian Professor of Radiology. In February 2022 he moved to UT Southwestern Medical Center to chair its department of biomedical engineering.",
    ],
    sources: [
      s("lab", "Washington People: Samuel Achilefu, Washington University in St. Louis (2016)", "https://source.washu.edu/2016/02/washington-people-samuel-achilefu/"),
      s("lab", "Special glasses help surgeons see cancer, Washington University in St. Louis (2014)", "https://source.washu.edu/2014/02/special-glasses-help-surgeons-ee-cancer/"),
      s("lab", "Samuel Achilefu, UT Southwestern Medical Center profile", "https://profiles.utsouthwestern.edu/profile/209730"),
    ],
  },
  "J. M. Naish": {
    about: [
      "He worked at the Royal Aircraft Establishment, Farnborough. A technical note of 1962 set out the form of the steering information his head-up display gave the pilot, and weighed how bright it must be against a desert sky.",
      "In a paper of 1965 he reported that the display could be learned easily and used accurately. He proposed it as a monitor for automatic landing, and for the directed take-off.",
      "By 1979 he was at NASA Ames Research Center as a research associate of the National Research Council. His review of head-up display formats there found neither of the two main kinds fully adequate.",
    ],
    sources: [
      s("paper", "J. M. Naish, Display research and its application to civil aircraft, Aeronautical Journal (1965)", "https://www.cambridge.org/core/journals/aeronautical-journal/article/display-research-and-its-application-to-civil-aircraft/C0CB347B8C409A420A8F2D4BBEFC463D"),
      s("paper", "Kelley, Ketchel and Strudwick, Experimental Evaluation of Head-Up Display High Brightness Requirements, Kaiser Aerospace and Electronics (1965)", "https://apps.dtic.mil/sti/pdfs/AD0626657.pdf"),
      s("paper", "J. M. Naish, A Review of Some Head-Up Display Formats, NASA Technical Paper 1499 (1979)", "https://ntrs.nasa.gov/api/citations/19790025030/downloads/19790025030.pdf"),
    ],
  },
  "Mozi": {
    about: [
      "Scholars call him Mozi, Master Mo, and give his full name as Mo Di. Chris Fraser, in the Stanford Encyclopedia of Philosophy, writes that little is known of him, not even the state he came from.",
      "His dates are uncertain. Matthias Schemmel and William G. Boltz report the traditional dates of about 479 to 381 BCE and say there is little solid record for them. They allow that Mozi may have been an epithet rather than a name.",
      "Fraser writes that the Shi Ji records only that he was an official of the state of Song. He conjectures that Mozi began as a craftsman, probably a carpenter.",
      "The Canon makes up chapters 40 to 43 of the book Mozi. Schemmel and Boltz say it was put together by an indeterminate number of hands. It explains an inverted image by light running in straight lines and crossing at a pinhole.",
    ],
    sources: [
      s("reference", "Chris Fraser, Mohism, Stanford Encyclopedia of Philosophy (revised 2024)", "https://plato.stanford.edu/entries/mohism/"),
      s("reference", "Chris Fraser, Mohist Canons, Stanford Encyclopedia of Philosophy (revised 2024)", "https://plato.stanford.edu/entries/mohist-canons/"),
      s("paper", "Matthias Schemmel and William G. Boltz, Theoretical Knowledge in the Mohist Canon, Springer (2022)", "https://link.springer.com/content/pdf/10.1007/978-3-031-08797-4.pdf"),
      s("paper", "Matthias Schemmel and William G. Boltz, The Mohist Canon and Alternative Origins of Theoretical Science, in Theoretical Knowledge in the Mohist Canon, Springer (2022)", "https://link.springer.com/chapter/10.1007/978-3-031-08797-4_2"),
    ],
  },
  "Kazuo Yoshinaka": {
    about: [
      "Kazuo Yoshinaka is the inventor named on Japanese patent application JPS61198892A, Display device, with NEC as applicant. The record gives a filing date of 27 February 1985 and publication on 3 September 1986.",
      "The application describes a beam of light swept across the retina by a scanner, guided by a detector of eye movement, with no intermediate screen. Two such units could show each eye a different picture for stereoscopic viewing.",
      "A 2017 review by Lin and colleagues in Frontiers of Optoelectronics cites the application in its history of retinal projection displays. Google Patents lists it among documents cited by University of Washington patents for a virtual retinal display.",
    ],
    sources: [
      s("patent", "Kazuo Yoshinaka, Display device, Japanese patent application JPS61198892A, NEC (filed 1985, published 1986)", "https://patents.google.com/patent/JPS61198892A/en"),
      s("paper", "Lin, Cheng, Yao and Wang, Retinal projection head-mounted display, Frontiers of Optoelectronics (2017)", "https://journal.hep.com.cn/foe/EN/10.1007/s12200-016-0662-8"),
    ],
  },
  "Auguste Berthier": {
    about: [
      "Sam H. Kaplan, in the Journal of the Society of Motion Picture Engineers in 1952, said the parallax barrier was generally attributed to Berthier of France, who suggested it in 1896. He wrote that Frederic Ives applied it to stereoscopic still pictures in 1904.",
    ],
    sources: [
      s("paper", "Sam H. Kaplan, Theory of Parallax Barriers, Journal of the Society of Motion Picture Engineers, vol. 59 (1952)", "https://lantern.mediahist.org/catalog/journalofsociety59socirich_0020"),
      s("reference", "Barrier-grid animation and stereography, Wikipedia", "https://en.wikipedia.org/wiki/Barrier-grid_animation_and_stereography"),
    ],
  },
};

/**
 * The sources a person's page lists: those of their account, and those of the pieces they are named on that name
 * them. A piece keeps one list of sources for all its people, so a source is taken for this person when its title
 * carries their family name. Where none does and there is no account, the piece's whole list stands.
 */
export function personSources(who: Person): Source[] {
  const own = bios[who.name]?.sources ?? [], family = who.name.split(' ').pop() ?? who.name;
  const ofPieces = who.on.flatMap(({ piece }) => people[piece].sources ?? []);
  const naming = ofPieces.filter((src) => src.label.includes(family));
  const all = [...own, ...(naming.length || own.length ? naming : ofPieces)];
  return all.filter((src, i) => all.findIndex((x) => x.url === src.url) === i);
}
