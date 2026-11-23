# Portraits

The labels name 147 people, and 130 of them have a portrait on the site. Each person has a place for one, and the place stays empty until a picture is added by hand. Nothing in the build fetches a picture. `PORTRAITS-TODO.md` lists everyone still waiting, sorted by what each one needs.

The portraits on the site are pen drawings made with an AI image model. There are two kinds, and the line beside each one says which.

**After a picture.** The drawing follows one photograph or earlier portrait: the same head angle, the same clothing. It is shown only when that picture is in the public domain or under an open licence, and its author and licence stand beside it.

**A study.** For a person whose photographs all belong to somebody. The face is drawn from photographs that named pages have published, at least two where two exist. The pose and the clothing are the drawing's own. The source photographs are not shown on the site. The pages are named beside the drawing. A new pose and clothing do not clear copyright or permission rights. Reference-only studies retain an uncertain-rights flag in the source records.

Either kind is shown only when the check of who it shows has passed: every page used names the person together with a fact from the label. A drawing is also compared with its photographs for hair, glasses, facial hair, age, and for a study a pose and clothing that differ from every one of them. Whether a face is a good likeness is judged by the people who make the drawings, not by that check.

A drawing whose photographs are small or soft is shown only at the size of a label (`small` in the data): it is not hung on the wall of the walk, and its file is no larger than a label needs.

Each portrait also has a small copy, 168 by 210, in `public/people/small/`, for the rows of faces and the walk on a phone. Run `python3 scripts/small-portraits.py` and `python3 scripts/og.py` after adding one: the first makes the small copy (the check fails until it is there), the second the picture a link to the person shows.

## Adding a portrait

1. Check that the picture shows the right person. See the next section.
2. Save the drawing in `public/people/` under the file name in the table below.
3. Add one line to `src/data/portraits.ts`, under the name exactly as the table spells it. After a free picture:

   ```ts
   'Jingyu Lin': { file: 'jingyu-lin.webp', by: 'Name of the photographer', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Example.jpg' },
   ```

   A study, with every page a photograph came from:

   ```ts
   'Elsa Garmire': { file: 'elsa-garmire.webp', study: [{ by: 'Optica', source: 'https://example.org/her-page' }] },
   ```

The page shows every portrait the same way: one crop, black and white, one frame, with its credit beside it.

Not everyone here has a portrait. A person without one keeps a label with no picture.

## The right person

Several of these names belong to more than one person. A portrait counts as the right one only when the page it comes from names this person together with a fact from the third column: the field, the employer, the place or the year. A matching name alone is not enough, and neither is a face that looks plausible.

Take the picture from the person's own article or file page, where the caption says who it is. Keep the address of that page in `source`. With that address the pairing can be checked later against the caption, without anyone having to judge a face.

## Hall 1, Mechanics

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Gino Valle | Split-flap board | Designer credited with the form of the boards made by Solari. | yes | `public/people/gino-valle.webp` |
| John Myer | Split-flap board | The Belgian inventor linked to Solari. A common name. |  | `public/people/john-myer.jpg` |
| Kenyon Taylor | Flip-disc display | Devised the flip-disc at Ferranti-Packard in Canada, for Trans-Canada Air Lines. |  | `public/people/kenyon-taylor.jpg` |
| Paul Nipkow | Mechanical television | Patented the scanning disc in Germany in the 1880s. | yes | `public/people/paul-nipkow.webp` |
| John Logie Baird | Mechanical television | Gave the first public demonstration of television, in London in 1926. | yes | `public/people/john-logie-baird.webp` |
| Daniel Rozin | Kinetic mirror | Artist, born in Jerusalem. He built Wooden Mirror in 1999 and has since made mirrors of chrome balls, pegs and toy penguins. | yes | `public/people/daniel-rozin.webp` |
| Daniel Leithinger | Shape display | Built the pin table inFORM in the Tangible Media Group at the MIT Media Lab. | yes | `public/people/daniel-leithinger.webp` |
| Sean Follmer | Shape display | Built the pin table inFORM in the Tangible Media Group at the MIT Media Lab. | yes | `public/people/sean-follmer.webp` |
| Hiroshi Ishii | Shape display | Leads the Tangible Media Group, where the pin tables Relief and inFORM were built. | yes | `public/people/hiroshi-ishii.webp` |
| Oleg Tretiakoff | Refreshable braille display | Patented braille dots raised by piezoelectric reeds. They filed first in France, in 1974. |  | `public/people/oleg-tretiakoff.jpg` |
| Andrée Tretiakoff | Refreshable braille display | Patented braille dots raised by piezoelectric reeds. They filed first in France, in 1974. |  | `public/people/andree-tretiakoff.jpg` |
| Klaus Peter Schönherr | Refreshable braille display | Invented a piezoelectric braille module in Germany in 1975. | yes | `public/people/klaus-peter-schonherr.webp` |
| James Bryce | Refreshable braille display | The IBM engineer. A British statesman, Viscount Bryce, shares the name. | yes | `public/people/james-bryce.webp` |
| Horst Hörtner | Drone light show | Director of the Ars Electronica Futurelab in Linz. His team and Intel flew 100 lit drones near Hamburg in November 2015. | yes | `public/people/horst-hortner.webp` |

## Hall 2, Glass and glow

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Ferdinand Braun | Cathode ray tube | Built the first cathode ray tube, in Germany in 1897. | yes | `public/people/ferdinand-braun.webp` |
| Kenjiro Takayanagi | Cathode ray tube | Showed a television receiver built on a cathode ray tube, in Japan in 1926. | yes | `public/people/kenjiro-takayanagi.webp` |
| Philo Farnsworth | Cathode ray tube | Sent the first all-electronic television picture, in San Francisco in 1927. | yes | `public/people/philo-farnsworth.webp` |
| Elma Farnsworth | Cathode ray tube | Known as Pem. She worked in Philo Farnsworth's laboratories, where she made the technical drawings for his experiments. Her face was among the first that his system sent. | yes | `public/people/elma-farnsworth.webp` |
| Marie Van Brittan Brown | Cathode ray tube | A nurse in New York and her husband, an electronics technician. Their home security system of 1966 showed the caller on a television monitor, through a camera sliding between four peepholes. Patented in 1969. | yes | `public/people/marie-van-brittan-brown.webp` |
| Albert Brown | Cathode ray tube | The electronics technician in New York, husband of Marie Van Brittan Brown and joint holder of the 1969 patent. A very common name. | yes | `public/people/albert-brown.webp` |
| Mark Dean | Cathode ray tube | The IBM engineer and inventor, born in 1957. A common name. | yes | `public/people/mark-dean.webp` |
| Guillermo González Camarena | Colour-wheel television | Mexican electrical engineer. He patented the adapter in Mexico in 1940, at the age of 23, and in the United States two years later. | yes | `public/people/guillermo-gonzalez-camarena.webp` |
| A. Frankenstein | Colour-wheel television | Applied in Germany in 1904 for a patent on a colour system with a filter wheel. |  | `public/people/a-frankenstein.jpg` |
| W. von Jaworski | Colour-wheel television | Applied in Germany in 1904 for a patent on a colour system with a filter wheel. |  | `public/people/w-von-jaworski.jpg` |
| Peter Goldmark | Colour-wheel television | Engineer at the Columbia Broadcasting System, which built its own colour-wheel television in the same years. | yes | `public/people/peter-goldmark.webp` |
| Robert H. Anderson | Storage tube terminal | The Tektronix engineer. A common name. | yes | `public/people/robert-h-anderson.webp` |
| Andrew Haeff | Storage tube terminal | Built the Memory Tube in the 1940s, the ancestor that Tektronix turned into a screen. | yes | `public/people/andrew-haeff.webp` |
| David Hagelbarger | Nixie tube | The engineer most often named as its inventor. | yes | `public/people/david-hagelbarger.webp` |
| Tadashi Nakamura | Vacuum fluorescent display | The founder of Ise Electronics. Not Shuji Nakamura, who is listed under the LED display. | yes | `public/people/tadashi-nakamura.webp` |
| Tadashi Sasaki | Vacuum fluorescent display | The engineer of Hayakawa Electric, later Sharp. | yes | `public/people/tadashi-sasaki.webp` |
| Lewis Latimer | Numitron | Not a maker of this display. The lamp filament came first, and in 1882 he patented a way of making the carbon filaments of early electric lamps so that fewer broke in the furnace. | yes | `public/people/lewis-latimer.webp` |
| Donald Bitzer | Plasma display panel | Invented the panel at the University of Illinois in 1964, for the PLATO teaching system. Willson was a graduate student. | yes | `public/people/donald-bitzer.webp` |
| Gene Slottow | Plasma display panel | Invented the panel at the University of Illinois in 1964, for the PLATO teaching system. Willson was a graduate student. | yes | `public/people/gene-slottow.webp` |
| Robert Willson | Plasma display panel | The Illinois graduate student of 1964. A common name. | yes | `public/people/robert-willson.webp` |
| Tsutae Shinoda | Plasma display panel | Led the team at Fujitsu in Japan that made the colour plasma panel practical. Its 21-inch colour television went on sale in 1993. | yes | `public/people/tsutae-shinoda.webp` |
| Charles Spindt | Field emission display | Patented the way of making the microscopic tips, at Stanford Research Institute. | yes | `public/people/charles-spindt.webp` |
| Kenneth Shoulders | Field emission display | Patented the way of making the microscopic tips, at Stanford Research Institute. | yes | `public/people/kenneth-shoulders.webp` |
| Louis Heynick | Field emission display | Patented the way of making the microscopic tips, at Stanford Research Institute. | yes | `public/people/louis-heynick.webp` |
| Akintunde Akinwande | Field emission display | Engineer, educated in Nigeria and at Stanford. He joined Honeywell in 1986 and worked there on thin-film field emitters and displays, and at MIT on arrays of emitters switched one by one. | yes | `public/people/akintunde-akinwande.webp` |

## Hall 3, Solid light

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Howard Borden | LED display | Designed the Hewlett-Packard numeric indicator of 1969. | yes | `public/people/howard-borden.webp` |
| Gerald Pighini | LED display | Designed the Hewlett-Packard numeric indicator of 1969. | yes | `public/people/gerald-pighini.webp` |
| Isamu Akasaki | LED display | Made efficient blue LEDs in Japan. Full-colour screens followed, and so did the 2014 Nobel Prize in Physics. | yes | `public/people/isamu-akasaki.webp` |
| Hiroshi Amano | LED display | Made efficient blue LEDs in Japan. Full-colour screens followed, and so did the 2014 Nobel Prize in Physics. | yes | `public/people/hiroshi-amano.webp` |
| Shuji Nakamura | LED display | The Nobel laureate of 2014. Not Tadashi Nakamura of Ise Electronics. | yes | `public/people/shuji-nakamura.webp` |
| Ching Wan Tang | OLED | Made the first efficient OLED at Eastman Kodak, published in 1987. Tang, born in Hong Kong, had set out to make solar cells. | yes | `public/people/ching-wan-tang.webp` |
| Steven Van Slyke | OLED | Made the first efficient OLED at Eastman Kodak, published in 1987. Tang, born in Hong Kong, had set out to make solar cells. | yes | `public/people/steven-van-slyke.webp` |
| Hongxing Jiang | MicroLED | Physicists and a married couple. They made the first microLEDs at Kansas State University in 2000. | yes | `public/people/hongxing-jiang.webp` |
| Jingyu Lin | MicroLED | Physicists and a married couple. They made the first microLEDs at Kansas State University in 2000. | yes | `public/people/jingyu-lin.webp` |
| Vicki Colvin | Quantum-dot display | Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994. | yes | `public/people/vicki-colvin.webp` |
| M. C. Schlamp | Quantum-dot display | Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994. |  | `public/people/m-c-schlamp.jpg` |
| Paul Alivisatos | Quantum-dot display | Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994. | yes | `public/people/paul-alivisatos.webp` |
| Aleksey Yekimov | Quantum-dot display | Russian physicist. He showed in coloured glass that the size of a tiny crystal sets its colour. | yes | `public/people/aleksey-yekimov.webp` |
| Louis Brus | Quantum-dot display | Proved the same effect in particles floating freely in a liquid. | yes | `public/people/louis-brus.webp` |
| Moungi Bawendi | Quantum-dot display | American, French and Tunisian chemist. In 1993 he found the way to make dots of almost perfect quality. The three shared the 2023 Nobel Prize in Chemistry. | yes | `public/people/moungi-bawendi.webp` |
| Xiaogang Peng | Quantum-dot display | The chemist of Zhejiang University, an author of the 2014 Nature paper. Several researchers share the name. | yes | `public/people/xiaogang-peng.webp` |
| Yizheng Jin | Quantum-dot display | At Zhejiang University in 2014 they made a quantum-dot diode from liquids, layer on layer. It glowed deep red, turned a fifth of its electrons into light and was rated for over 100,000 hours. | yes | `public/people/yizheng-jin.webp` |
| Tuomo Suntola | Thin-film electroluminescent panel | Finnish physicist. In 1974 he devised atomic layer deposition, which grows a film one layer of atoms at a time, to make these panels. | yes | `public/people/tuomo-suntola.webp` |
| Dawon Kahng | Thin-film electroluminescent panel | Born in Seoul. In 1968 at Bell Laboratories he showed that thin films of compounds like zinc sulphide glow when fast electrons strike metal atoms placed in them. These panels make light that way. | yes | `public/people/dawon-kahng.webp` |
| Nicholas Sheridon | Flexible display | Made Gyricon, the first flexible electronic paper, at the Xerox Palo Alto Research Center. | yes | `public/people/nicholas-sheridon.webp` |

## Hall 4, Light valves

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Mozi | Camera obscura | Taught in China about 430 BCE, and the Mohist school is named after him. Its later members wrote the Canons, which hold an early account of a picture turned over by a small hole. |  | `public/people/mozi.jpg` |
| Ibn al-Haytham | Camera obscura | Born in Basra about 965, died in Cairo about 1040. In a dark chamber he studied how light passes through an opening, and how the sun in eclipse looks through a small hole. |  | `public/people/ibn-al-haytham.jpg` |
| Gemma Frisius | Camera obscura | Physician and instrument maker. He watched the solar eclipse of 24 January 1544 at Leuven in a darkened room. His book of 1545 has the oldest known printed drawing of one. | yes | `public/people/gemma-frisius.webp` |
| Daniele Barbaro | Camera obscura | Venetian nobleman. In 1568 he described a spectacle lens set in the hole, and a cover over part of the lens to make the picture clearer. | yes | `public/people/daniele-barbaro.webp` |
| Johannes Kepler | Camera obscura | Was the first to use the name camera obscura, in 1604. He made himself a portable dark tent with a lens, for sketching landscapes. | yes | `public/people/johannes-kepler.webp` |
| Ibn Daniyal | Shadow play | Eye doctor, born in Mosul in 1248. He settled in Cairo and wrote three shadow plays there, the oldest texts that survive for the Arabic shadow theatre. |  | `public/people/ibn-daniyal.jpg` |
| François Dominique Séraphin | Shadow play | Showed shadow plays at Versailles from 1771 and moved his theatre to Paris in 1784. In France such shows were advertised as ombres chinoises, Chinese shadows. | yes | `public/people/francois-dominique-seraphin.webp` |
| Henri Rivière | Shadow play | Worked with up to twenty assistants on the shadow plays of the cabaret Le Chat Noir in Paris, which staged 45 of them between 1885 and 1896. From 1887 the figures were of zinc. | yes | `public/people/henri-riviere.webp` |
| Kara Walker | Shadow play | American artist, known for silhouettes cut from black paper. Since 2004 she has made films in which jointed paper puppets, worked by hand on sticks, play out stories of slavery in America. | yes | `public/people/kara-walker.webp` |
| Martin Schadt | Liquid crystal display | Filed the patent for the twisted cell at Hoffmann-La Roche in Switzerland on 4 December 1970. | yes | `public/people/martin-schadt.webp` |
| Wolfgang Helfrich | Liquid crystal display | Filed the patent for the twisted cell at Hoffmann-La Roche in Switzerland on 4 December 1970. | yes | `public/people/wolfgang-helfrich.webp` |
| James Fergason | Liquid crystal display | Filed a similar patent in the United States in 1971. The dispute over who came first was settled out of court. | yes | `public/people/james-fergason.webp` |
| George Heilmeier | Liquid crystal display | Built an earlier kind of liquid crystal display at RCA in the 1960s, which worked by scattering light. | yes | `public/people/george-heilmeier.webp` |
| Sivaramakrishna Chandrasekhar | Liquid crystal display | The liquid crystal physicist of the Raman Research Institute in Bangalore, 1930 to 2004. Not Subrahmanyan Chandrasekhar, the astrophysicist. | yes | `public/people/sivaramakrishna-chandrasekhar.webp` |
| B. K. Sadashiva | Liquid crystal display | In 1977 at the Raman Research Institute in Bangalore they found liquid crystals whose molecules are discs, not rods. Films of such liquid crystals later widened the angle a screen can be read from. | yes | `public/people/b-k-sadashiva.webp` |
| K. A. Suresh | Liquid crystal display | The liquid crystal physicist of the Raman Research Institute in Bangalore, an author of the 1977 paper. A common name. | yes | `public/people/k-a-suresh.webp` |
| Mohamed Atalla | Liquid crystal display | The Bell Laboratories engineer, born in Port Said, 1924 to 2009. Also written Martin M. Atalla and John Atalla. | yes | `public/people/mohamed-atalla.webp` |
| Larry Hornbeck | Digital micromirror device | Invented the mirror chip at Texas Instruments in 1987. | yes | `public/people/larry-hornbeck.webp` |
| Fritz Fischer | Eidophor | The Swiss engineer at ETH Zurich. A German historian and a biathlete share the name. | yes | `public/people/fritz-fischer.webp` |
| Joseph Ostoja-Kotkowski | Scanned laser | Staged an early laser show, Sound and Image, at the Adelaide Festival of Arts in 1968. | yes | `public/people/joseph-ostoja-kotkowski.webp` |
| Elsa Garmire | Scanned laser | Physicist at the California Institute of Technology. Her laser images, filmed in 1972, became the model for Laserium. | yes | `public/people/elsa-garmire.webp` |
| Ivan Dryer | Scanned laser | Filmmaker who worked with Garmire and opened Laserium at Griffith Observatory in Los Angeles in 1973. | yes | `public/people/ivan-dryer.webp` |
| Leota Toombs | Projection mapping | Artist at WED Enterprises, the Disney design workshop. Her filmed face is projected onto a blank head inside the crystal ball of the Haunted Mansion. | yes | `public/people/leota-toombs.webp` |
| Michael Naimark | Projection mapping | Artist. For Displacements he filmed a room, painted it white and projected the film back onto it. | yes | `public/people/michael-naimark.webp` |
| Ramesh Raskar | Projection mapping | Described the technique in 2001 under the name shader lamps. | yes | `public/people/ramesh-raskar.webp` |
| Greg Welch | Projection mapping | The computer scientist, co-author of the 2001 shader lamps paper. A common name. | yes | `public/people/greg-welch.webp` |
| Kok-Lim Low | Projection mapping | Described the technique in 2001 under the name shader lamps. | yes | `public/people/kok-lim-low.webp` |
| Deepak Bandyopadhyay | Projection mapping | Described the technique in 2001 under the name shader lamps. | yes | `public/people/deepak-bandyopadhyay.webp` |
| Lanny Smoot | Projection mapping | Disney research fellow with more than 100 patents. He is credited with making Madame Leota, the head in the crystal ball of the Haunted Mansion, float in her séance room. | yes | `public/people/lanny-smoot.webp` |

## Hall 5, Paper

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Barrett Comiskey | Electrophoretic ink | Developed the ink in capsules at the MIT Media Lab in 1996. | yes | `public/people/barrett-comiskey.webp` |
| J. D. Albert | Electrophoretic ink | Developed the ink in capsules at the MIT Media Lab in 1996. | yes | `public/people/j-d-albert.webp` |
| Joseph Jacobson | Electrophoretic ink | Developed the ink in capsules at the MIT Media Lab in 1996. | yes | `public/people/joseph-jacobson.webp` |
| John Rogers | Electrophoretic ink | John A. Rogers, first author of the 2001 paper on electronic paper that bends. A very common name. | yes | `public/people/john-rogers.webp` |
| Zhenan Bao | Electrophoretic ink | At Bell Laboratories in 2001 they stamped 256 plastic transistors onto a plastic sheet, one for each dot, and laid this ink over them: electronic paper that bends. Bao, a chemist, designs conducting plastics. | yes | `public/people/zhenan-bao.webp` |
| Deng-Ke Yang | Cholesteric display | Made the reflective display that keeps its picture, at the Liquid Crystal Institute of Kent State University. | yes | `public/people/deng-ke-yang.webp` |
| J. William Doane | Cholesteric display | Made the reflective display that keeps its picture, at the Liquid Crystal Institute of Kent State University. | yes | `public/people/j-william-doane.webp` |
| Gerardo Beni | Electrowetting display | Proposed the display at Bell Laboratories in 1981 and gave the effect its name. Beni was born in Florence and Hackwood in England. | yes | `public/people/gerardo-beni.webp` |
| Susan Hackwood | Electrowetting display | Proposed the display at Bell Laboratories in 1981 and gave the effect its name. Beni was born in Florence and Hackwood in England. | yes | `public/people/susan-hackwood.webp` |
| Robert Hayes | Electrowetting display | The Philips researcher, co-author of the 2003 Nature paper. A common name. | yes | `public/people/robert-hayes.webp` |
| Johan Feenstra | Electrowetting display | Made it work at video speed at Philips Research in Eindhoven in 2003. | yes | `public/people/johan-feenstra.webp` |
| Mark Miles | Interferometric modulator | The display engineer who founded Etalon and Iridigm. A motor racing executive shares the name. | yes | `public/people/mark-miles.webp` |
| S. K. Deb | Electrochromic display | Published the work on tungsten oxide films, in 1969, from which electrochromic displays grew. | yes | `public/people/s-k-deb.webp` |
| Paula Hammond | Electrochromic display | At MIT they built electrochromic films one molecular layer at a time, which switched faster and with more contrast than films made in other ways. DeLongchamp's thesis of 2003 points to a full-colour display. | yes | `public/people/paula-hammond.webp` |
| Dean DeLongchamp | Electrochromic display | At MIT they built electrochromic films one molecular layer at a time, which switched faster and with more contrast than films made in other ways. DeLongchamp's thesis of 2003 points to a full-colour display. | yes | `public/people/dean-delongchamp.webp` |

## Hall 6, Mid-air

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Henry Dircks | Pepper's ghost | Engineer who devised the illusion. | yes | `public/people/henry-dircks.webp` |
| John Henry Pepper | Pepper's ghost | Staged it at the Royal Polytechnic Institution in London in 1862, and it took his name. | yes | `public/people/john-henry-pepper.webp` |
| Valerie Thomas | Illusion transmitter | Born in Maryland in 1943. One of only two women to major in physics at Morgan State University, she joined NASA as a data analyst and invented the illusion transmitter there. | yes | `public/people/valerie-thomas.webp` |
| Karri Palovuori | Fog screen | Developed the fog screen that people can walk through, at Tampere University of Technology in 2002. | yes | `public/people/karri-palovuori.webp` |
| Ismo Rakkolainen | Fog screen | Developed the fog screen that people can walk through, at Tampere University of Technology in 2002. | yes | `public/people/ismo-rakkolainen.webp` |
| Joseph Plateau | Persistence of vision display | Used the effect in his spinning picture discs of 1832. | yes | `public/people/joseph-plateau.webp` |
| Max Hirsch | Swept-volume display | The holder of the 1961 display patent. A German economist of the 1800s shares the name. |  | `public/people/max-hirsch.jpg` |
| Gregg Favalora | Swept-volume display | Founder of Actuality Systems, which put the Perspecta display on sale in 2002. | yes | `public/people/gregg-favalora.webp` |
| Elizabeth Downing | Static-volume display | The first author of the 1996 Science paper from Stanford. A common name. | yes | `public/people/elizabeth-downing.webp` |
| Lambertus Hesselink | Static-volume display | Drew coloured points of light inside a block of glass with crossed infrared beams. The work was published from Stanford University in 1996, with Downing as first author. | yes | `public/people/lambertus-hesselink.webp` |
| John Ralston | Static-volume display | A co-author of the 1996 Science paper from Stanford. A common name. | withdrawn on 22 November 2026: no source read ties the man in the study photograph to the author at SDL | none |
| Roger Macfarlane | Static-volume display | Drew coloured points of light inside a block of glass with crossed infrared beams. The work was published from Stanford University in 1996, with Downing as first author. | yes | `public/people/roger-macfarlane.webp` |
| Daniel Smalley | Optical trap display | The Brigham Young University professor. A common name. | yes | `public/people/daniel-smalley.webp` |
| Ryuji Hirayama | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. | yes | `public/people/ryuji-hirayama.webp` |
| Diego Martinez Plasencia | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. | yes | `public/people/diego-martinez-plasencia.webp` |
| Nobuyuki Masuda | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. | yes | `public/people/nobuyuki-masuda.webp` |
| Sriram Subramanian | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. | yes | `public/people/sriram-subramanian.webp` |
| Yoichi Ochiai | Laser plasma display | Led the version of 2015, which uses far shorter laser pulses. | yes | `public/people/yoichi-ochiai.webp` |

## Hall 7, Depth

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Charles Wheatstone | Stereoscope and 3D glasses | Published the stereoscope in London in 1838, months before photography was announced. | yes | `public/people/charles-wheatstone.webp` |
| Kenneth Dunkley | Stereoscope and 3D glasses | Physicist in Pennsylvania. His patent of 1989 is for viewing glasses with no lenses: two pinholes and two empty frames. It says they give an ordinary flat picture the look of depth. |  | `public/people/kenneth-dunkley.jpg` |
| Charles Harrison | Stereoscope and 3D glasses | The industrial designer of Chicago, 1931 to 2018, who redesigned the View-Master in 1958. A common name. | yes | `public/people/charles-harrison.webp` |
| Frederic Ives | Parallax barrier | Frederic Eugene Ives, the father. His son Herbert Ives also worked on 3D pictures. | yes | `public/people/frederic-ives.webp` |
| Auguste Berthier | Parallax barrier | Described the principle in 1896. |  | `public/people/auguste-berthier.jpg` |
| Walter Hess | Lenticular display | Walter Rudolf Hess, the eye doctor of Rapperswil who filed the 1912 patent and later won a Nobel Prize. | yes | `public/people/walter-hess.webp` |
| Hank Willis Thomas | Lenticular display | Artist in New York. His lenticular prints carry text that changes as the visitor walks past. In one, Black Imitates White becomes White Imitates Black. | yes | `public/people/hank-willis-thomas.webp` |
| Gabriel Lippmann | Integral imaging | Proposed it in France in 1908 and called it integral photography. | yes | `public/people/gabriel-lippmann.webp` |
| Dennis Gabor | Holography | Invented holography in 1948 at British Thomson-Houston in Rugby, England. | yes | `public/people/dennis-gabor.webp` |
| Emmett Leith | Holography | Published the off-axis method of recording holograms in 1962. | yes | `public/people/emmett-leith.webp` |
| Juris Upatnieks | Holography | Published the off-axis method of recording holograms in 1962. | yes | `public/people/juris-upatnieks.webp` |
| Margaret Benyon | Holography | Painter, born in Birmingham and raised in Kenya. She made holograms as art from 1968 and showed them a year later. | yes | `public/people/margaret-benyon.webp` |
| Stephen Benton | Holography | The first holographic video display was built in Benton's group at the MIT Media Lab in 1989. Jepsen's thesis of that year sets out its design. | yes | `public/people/stephen-benton.webp` |
| Mary Lou Jepsen | Holography | The first holographic video display was built in Benton's group at the MIT Media Lab in 1989. Jepsen's thesis of that year sets out its design. | yes | `public/people/mary-lou-jepsen.webp` |
| Ali Javan | Holography | Born in Tehran. At Bell Laboratories in 1960 he, William Bennett and Don Herriott ran the first gas laser, the first to give a steady beam. Laser light is what holograms are made with. | yes | `public/people/ali-javan.webp` |
| Nasser Peyghambarian | Holography | At the University of Arizona in 2010 their group showed a rewritable hologram: a sheet of polymer took a new colour picture every two seconds. In 2008 it took four minutes. | yes | `public/people/nasser-peyghambarian.webp` |
| Pierre-Alexandre Blanche | Holography | At the University of Arizona in 2010 their group showed a rewritable hologram: a sheet of polymer took a new colour picture every two seconds. In 2008 it took four minutes. | yes | `public/people/pierre-alexandre-blanche.webp` |
| Ivan Sutherland | Head-mounted display | Built the first headset driven by computer graphics, at Harvard University in 1968. | yes | `public/people/ivan-sutherland.webp` |
| Bob Sproull | Head-mounted display | Built the first headset driven by computer graphics, at Harvard University in 1968. | yes | `public/people/bob-sproull.webp` |
| Samuel Achilefu | Head-mounted display | Born in Nigeria. His team at Washington University in St. Louis built goggles with a screen for surgeons: a dye makes cancer cells glow on it. First worn in an operation in 2014. | yes | `public/people/samuel-achilefu.webp` |
| Carolina Cruz-Neira | CAVE | Computer scientist and first author of the CAVE papers, with a UIC doctorate in 1995; now UCF Agere Chair. | yes | `public/people/carolina-cruz-neira.webp` |
| Daniel Sandin | CAVE | Daniel J. Sandin, artist and co-founder of UIC’s Electronic Visualization Laboratory, named on the CAVE papers. | yes | `public/people/daniel-sandin.webp` |
| Thomas DeFanti | CAVE | Thomas A. DeFanti, computer scientist and co-founder of UIC’s Electronic Visualization Laboratory, named on the CAVE papers. | yes | `public/people/thomas-defanti.webp` |
| Greg Dawe | CAVE | EVL staff member credited in its retrospective with designing and building the CAVE room and its portable SIGGRAPH 92 version. |  | `public/people/greg-dawe.jpg` |
| Kazuo Yoshinaka | Virtual retinal display | Proposed the display at Nippon Electric in Japan in 1986. |  | `public/people/kazuo-yoshinaka.jpg` |
| J. M. Naish | Head-up display | Worked out the system first called a head-up display, at Farnborough from 1956. |  | `public/people/j-m-naish.jpg` |

The CAVE supplement and its photo evidence are in [docs/portraits/cave/](docs/portraits/cave/README.md). Its three drawings are on the site.
