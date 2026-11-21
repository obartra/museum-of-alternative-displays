# Portraits

The labels name 110 people, and 32 of them have a portrait on the site. Each person has a place for one, and the place stays empty until a picture is added by hand. Nothing in the build fetches a picture. `PORTRAITS-TODO.md` lists everyone still waiting, sorted by what each one needs.

The portraits on the site are pen drawings made with an AI image model from a photograph or an earlier portrait. One is shown only when two things hold: its source is in the public domain or under an open licence, and the check of who it shows and how closely it follows its source has passed. A drawing made from a picture whose rights are not confirmed stays off the site, and so does one that still needs a second look.

## Adding a portrait

1. Find a picture that is free to reuse. The person's Wikipedia article usually shows one, and its file page on Wikimedia Commons states the author and the licence.
2. Check that it is the right person. See the next section.
3. Save it in `public/people/` under the file name in the table below. A JPEG about 600 pixels wide is enough.
4. Add one line to `src/data/portraits.ts`, under the name exactly as the table spells it:

   ```ts
   'Elsa Garmire': { file: 'elsa-garmire.jpg', by: 'Name of the photographer', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Example.jpg' },
   ```

The page shows every portrait the same way: one crop, black and white, one frame, with its author, licence and source beside it.

Not everyone here has a freely licensed portrait. A person without one keeps a label with no picture.

## The right person

Several of these names belong to more than one person. A portrait counts as the right one only when the page it comes from names this person together with a fact from the third column: the field, the employer, the place or the year. A matching name alone is not enough, and neither is a face that looks plausible.

Take the picture from the person's own article or file page, where the caption says who it is. Keep the address of that page in `source`. With that address the pairing can be checked later against the caption, without anyone having to judge a face.

## Hall 1, Mechanics

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Gino Valle | Split-flap board | Designer credited with the form of the boards made by Solari. |  | `public/people/gino-valle.jpg` |
| John Myer | Split-flap board | The Belgian inventor linked to Solari. A common name. |  | `public/people/john-myer.jpg` |
| Kenyon Taylor | Flip-disc display | Devised the flip-disc at Ferranti-Packard in Canada, for Trans-Canada Air Lines. |  | `public/people/kenyon-taylor.jpg` |
| Paul Nipkow | Mechanical television | Patented the scanning disc in Germany in the 1880s. | yes | `public/people/paul-nipkow.webp` |
| John Logie Baird | Mechanical television | Gave the first public demonstration of television, in London in 1926. | yes | `public/people/john-logie-baird.webp` |
| Daniel Rozin | Kinetic mirror | Artist, born in Jerusalem. He built Wooden Mirror in 1999 and has since made mirrors of chrome balls, pegs and toy penguins. |  | `public/people/daniel-rozin.jpg` |
| Daniel Leithinger | Shape display | Built the pin table inFORM in the Tangible Media Group at the MIT Media Lab. |  | `public/people/daniel-leithinger.jpg` |
| Sean Follmer | Shape display | Built the pin table inFORM in the Tangible Media Group at the MIT Media Lab. |  | `public/people/sean-follmer.jpg` |
| Hiroshi Ishii | Shape display | Leads the Tangible Media Group, where the pin tables Relief and inFORM were built. | yes | `public/people/hiroshi-ishii.webp` |
| Oleg Tretiakoff | Refreshable braille display | Patented braille dots raised by piezoelectric reeds. They filed first in France, in 1974. |  | `public/people/oleg-tretiakoff.jpg` |
| Andrée Tretiakoff | Refreshable braille display | Patented braille dots raised by piezoelectric reeds. They filed first in France, in 1974. |  | `public/people/andree-tretiakoff.jpg` |
| Klaus Peter Schönherr | Refreshable braille display | Invented a piezoelectric braille module in Germany in 1975. |  | `public/people/klaus-peter-schonherr.jpg` |
| James Bryce | Refreshable braille display | The IBM engineer. A British statesman, Viscount Bryce, shares the name. |  | `public/people/james-bryce.jpg` |
| Horst Hörtner | Drone light show | Director of the Ars Electronica Futurelab in Linz. His team and Intel flew 100 lit drones near Hamburg in November 2015. |  | `public/people/horst-hortner.jpg` |

## Hall 2, Glass and glow

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Ferdinand Braun | Cathode ray tube | Built the first cathode ray tube, in Germany in 1897. | yes | `public/people/ferdinand-braun.webp` |
| Kenjiro Takayanagi | Cathode ray tube | Showed a television receiver built on a cathode ray tube, in Japan in 1926. | yes | `public/people/kenjiro-takayanagi.webp` |
| Philo Farnsworth | Cathode ray tube | Sent the first all-electronic television picture, in San Francisco in 1927. | yes | `public/people/philo-farnsworth.webp` |
| Elma Farnsworth | Cathode ray tube | Known as Pem. She worked beside Philo Farnsworth in his laboratories, and her face was among the first that his system sent. |  | `public/people/elma-farnsworth.jpg` |
| Guillermo González Camarena | Colour-wheel television | Mexican electrical engineer. He patented the adapter in Mexico in 1940, at the age of 23, and in the United States two years later. |  | `public/people/guillermo-gonzalez-camarena.jpg` |
| A. Frankenstein | Colour-wheel television | Applied in Germany in 1904 for a patent on a colour system with a filter wheel. |  | `public/people/a-frankenstein.jpg` |
| Werner von Jaworski | Colour-wheel television | Applied in Germany in 1904 for a patent on a colour system with a filter wheel. |  | `public/people/werner-von-jaworski.jpg` |
| Peter Goldmark | Colour-wheel television | Engineer at the Columbia Broadcasting System, which built its own colour-wheel television in the same years. |  | `public/people/peter-goldmark.jpg` |
| Robert H. Anderson | Storage tube terminal | The Tektronix engineer. A common name. |  | `public/people/robert-h-anderson.jpg` |
| Andrew Haeff | Storage tube terminal | Built the Memory Tube in the 1940s, the ancestor that Tektronix turned into a screen. |  | `public/people/andrew-haeff.jpg` |
| David Hagelbarger | Nixie tube | The engineer most often named as its inventor. |  | `public/people/david-hagelbarger.jpg` |
| Tadashi Nakamura | Vacuum fluorescent display | The founder of Ise Electronics. Not Shuji Nakamura, who is listed under the LED display. |  | `public/people/tadashi-nakamura.jpg` |
| Tadashi Sasaki | Vacuum fluorescent display | The engineer of Hayakawa Electric, later Sharp. |  | `public/people/tadashi-sasaki.jpg` |
| Donald Bitzer | Plasma display panel | Invented the panel at the University of Illinois in 1964, for the PLATO teaching system. Willson was a graduate student. |  | `public/people/donald-bitzer.jpg` |
| Gene Slottow | Plasma display panel | Invented the panel at the University of Illinois in 1964, for the PLATO teaching system. Willson was a graduate student. |  | `public/people/gene-slottow.jpg` |
| Robert Willson | Plasma display panel | The Illinois graduate student of 1964. A common name. |  | `public/people/robert-willson.jpg` |
| Tsutae Shinoda | Plasma display panel | Led the team at Fujitsu in Japan that made the colour plasma panel practical. Its 21-inch colour television went on sale in 1993. |  | `public/people/tsutae-shinoda.jpg` |
| Charles Spindt | Field emission display | Patented the way of making the microscopic tips, at Stanford Research Institute. |  | `public/people/charles-spindt.jpg` |
| Kenneth Shoulders | Field emission display | Patented the way of making the microscopic tips, at Stanford Research Institute. |  | `public/people/kenneth-shoulders.jpg` |
| Louis Heynick | Field emission display | Patented the way of making the microscopic tips, at Stanford Research Institute. |  | `public/people/louis-heynick.jpg` |

## Hall 3, Solid light

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Howard Borden | LED display | Designed the Hewlett-Packard numeric indicator of 1969. |  | `public/people/howard-borden.jpg` |
| Gerald Pighini | LED display | Designed the Hewlett-Packard numeric indicator of 1969. |  | `public/people/gerald-pighini.jpg` |
| Isamu Akasaki | LED display | Made efficient blue LEDs in Japan. Full-colour screens followed, and so did the 2014 Nobel Prize in Physics. | yes | `public/people/isamu-akasaki.webp` |
| Hiroshi Amano | LED display | Made efficient blue LEDs in Japan. Full-colour screens followed, and so did the 2014 Nobel Prize in Physics. | yes | `public/people/hiroshi-amano.webp` |
| Shuji Nakamura | LED display | The Nobel laureate of 2014. Not Tadashi Nakamura of Ise Electronics. | yes | `public/people/shuji-nakamura.webp` |
| Ching Wan Tang | OLED | Made the first efficient OLED at Eastman Kodak, published in 1987. Tang, born in Hong Kong, had set out to make solar cells. |  | `public/people/ching-wan-tang.jpg` |
| Steven Van Slyke | OLED | Made the first efficient OLED at Eastman Kodak, published in 1987. Tang, born in Hong Kong, had set out to make solar cells. | yes | `public/people/steven-van-slyke.webp` |
| Hongxing Jiang | MicroLED | Physicists and a married couple. They made the first microLEDs at Kansas State University in 2000. | yes | `public/people/hongxing-jiang.webp` |
| Jingyu Lin | MicroLED | Physicists and a married couple. They made the first microLEDs at Kansas State University in 2000. |  | `public/people/jingyu-lin.jpg` |
| Vicki Colvin | Quantum-dot display | Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994. |  | `public/people/vicki-colvin.jpg` |
| M. C. Schlamp | Quantum-dot display | Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994. |  | `public/people/m-c-schlamp.jpg` |
| Paul Alivisatos | Quantum-dot display | Made an LED from quantum dots and a plastic that conducts, at the University of California, Berkeley. Colvin is the first author of the paper of 1994. |  | `public/people/paul-alivisatos.jpg` |
| Aleksey Yekimov | Quantum-dot display | Russian physicist. He showed in coloured glass that the size of a tiny crystal sets its colour. |  | `public/people/aleksey-yekimov.jpg` |
| Louis Brus | Quantum-dot display | Proved the same effect in particles floating freely in a liquid. |  | `public/people/louis-brus.jpg` |
| Moungi Bawendi | Quantum-dot display | American, French and Tunisian chemist. In 1993 he found the way to make dots of almost perfect quality. The three shared the 2023 Nobel Prize in Chemistry. |  | `public/people/moungi-bawendi.jpg` |
| Tuomo Suntola | Thin-film electroluminescent panel | Finnish physicist. In 1974 he devised atomic layer deposition, which grows a film one layer of atoms at a time, to make these panels. | yes | `public/people/tuomo-suntola.webp` |
| Nicholas Sheridon | Flexible display | Made Gyricon, the first flexible electronic paper, at the Xerox Palo Alto Research Center. |  | `public/people/nicholas-sheridon.jpg` |

## Hall 4, Light valves

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Martin Schadt | Liquid crystal display | Filed the patent for the twisted cell at Hoffmann-La Roche in Switzerland on 4 December 1970. | yes | `public/people/martin-schadt.webp` |
| Wolfgang Helfrich | Liquid crystal display | Filed the patent for the twisted cell at Hoffmann-La Roche in Switzerland on 4 December 1970. | yes | `public/people/wolfgang-helfrich.webp` |
| James Fergason | Liquid crystal display | Filed a similar patent in the United States in 1971. The dispute over who came first was settled out of court. |  | `public/people/james-fergason.jpg` |
| George Heilmeier | Liquid crystal display | Built an earlier kind of liquid crystal display at RCA in the 1960s, which worked by scattering light. | yes | `public/people/george-heilmeier.webp` |
| Larry Hornbeck | Digital micromirror device | Invented the mirror chip at Texas Instruments in 1987. |  | `public/people/larry-hornbeck.jpg` |
| Fritz Fischer | Eidophor | The Swiss engineer at ETH Zurich. A German historian and a biathlete share the name. | yes | `public/people/fritz-fischer.webp` |
| Joseph Ostoja-Kotkowski | Scanned laser | Staged an early laser show, Sound and Image, at the Adelaide Festival of Arts in 1968. |  | `public/people/joseph-ostoja-kotkowski.jpg` |
| Elsa Garmire | Scanned laser | Physicist at the California Institute of Technology. Her laser images, filmed in 1972, became the model for Laserium. |  | `public/people/elsa-garmire.jpg` |
| Ivan Dryer | Scanned laser | Filmmaker who worked with Garmire and opened Laserium at Griffith Observatory in Los Angeles in 1973. |  | `public/people/ivan-dryer.jpg` |
| Leota Toombs | Projection mapping | Artist at WED Enterprises, the Disney design workshop. Her filmed face is projected onto a blank head inside the crystal ball of the Haunted Mansion. |  | `public/people/leota-toombs.jpg` |
| Michael Naimark | Projection mapping | Artist. For Displacements he filmed a room, painted it white and projected the film back onto it. | yes | `public/people/michael-naimark.webp` |
| Ramesh Raskar | Projection mapping | Described the technique in 2001 under the name shader lamps. | yes | `public/people/ramesh-raskar.webp` |
| Greg Welch | Projection mapping | The computer scientist, co-author of the 2001 shader lamps paper. A common name. |  | `public/people/greg-welch.jpg` |
| Kok-Lim Low | Projection mapping | Described the technique in 2001 under the name shader lamps. |  | `public/people/kok-lim-low.jpg` |
| Deepak Bandyopadhyay | Projection mapping | Described the technique in 2001 under the name shader lamps. |  | `public/people/deepak-bandyopadhyay.jpg` |

## Hall 5, Paper

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Barrett Comiskey | Electrophoretic ink | Developed the ink in capsules at the MIT Media Lab in 1996. |  | `public/people/barrett-comiskey.jpg` |
| J. D. Albert | Electrophoretic ink | Developed the ink in capsules at the MIT Media Lab in 1996. |  | `public/people/j-d-albert.jpg` |
| Joseph Jacobson | Electrophoretic ink | Developed the ink in capsules at the MIT Media Lab in 1996. |  | `public/people/joseph-jacobson.jpg` |
| Deng-Ke Yang | Cholesteric display | Made the reflective display that keeps its picture, at the Liquid Crystal Institute of Kent State University. |  | `public/people/deng-ke-yang.jpg` |
| J. William Doane | Cholesteric display | Made the reflective display that keeps its picture, at the Liquid Crystal Institute of Kent State University. |  | `public/people/j-william-doane.jpg` |
| Gerardo Beni | Electrowetting display | Proposed the display at Bell Laboratories in 1981 and gave the effect its name. Beni was born in Florence and Hackwood in England. |  | `public/people/gerardo-beni.jpg` |
| Susan Hackwood | Electrowetting display | Proposed the display at Bell Laboratories in 1981 and gave the effect its name. Beni was born in Florence and Hackwood in England. |  | `public/people/susan-hackwood.jpg` |
| Robert Hayes | Electrowetting display | The Philips researcher, co-author of the 2003 Nature paper. A common name. |  | `public/people/robert-hayes.jpg` |
| Johan Feenstra | Electrowetting display | Made it work at video speed at Philips Research in Eindhoven in 2003. |  | `public/people/johan-feenstra.jpg` |
| Mark Miles | Interferometric modulator | The display engineer who founded Etalon and Iridigm. A motor racing executive shares the name. |  | `public/people/mark-miles.jpg` |
| S. K. Deb | Electrochromic display | Published the work on tungsten oxide films, in 1969, from which electrochromic displays grew. |  | `public/people/s-k-deb.jpg` |

## Hall 6, Mid-air

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Henry Dircks | Pepper's ghost | Engineer who devised the illusion. | yes | `public/people/henry-dircks.webp` |
| John Henry Pepper | Pepper's ghost | Staged it at the Royal Polytechnic Institution in London in 1862, and it took his name. | yes | `public/people/john-henry-pepper.webp` |
| Valerie Thomas | Illusion transmitter | Born in Maryland in 1943. One of only two women to major in physics at Morgan State University, she joined NASA as a data analyst and invented the illusion transmitter there. |  | `public/people/valerie-thomas.jpg` |
| Karri Palovuori | Fog screen | Developed the fog screen that people can walk through, at Tampere University of Technology in 2002. |  | `public/people/karri-palovuori.jpg` |
| Ismo Rakkolainen | Fog screen | Developed the fog screen that people can walk through, at Tampere University of Technology in 2002. |  | `public/people/ismo-rakkolainen.jpg` |
| Joseph Plateau | Persistence of vision display | Used the effect in his spinning picture discs of 1832. | yes | `public/people/joseph-plateau.webp` |
| Max Hirsch | Swept-volume display | The holder of the 1961 display patent. A German economist of the 1800s shares the name. |  | `public/people/max-hirsch.jpg` |
| Gregg Favalora | Swept-volume display | Founder of Actuality Systems, which put the Perspecta display on sale in 2002. |  | `public/people/gregg-favalora.jpg` |
| Elizabeth Downing | Static-volume display | The first author of the 1996 Science paper from Stanford. A common name. |  | `public/people/elizabeth-downing.jpg` |
| Lambertus Hesselink | Static-volume display | Drew coloured points of light inside a block of glass with crossed infrared beams. The work was published from Stanford University in 1996, with Downing as first author. |  | `public/people/lambertus-hesselink.jpg` |
| John Ralston | Static-volume display | A co-author of the 1996 Science paper from Stanford. A common name. |  | `public/people/john-ralston.jpg` |
| Roger Macfarlane | Static-volume display | Drew coloured points of light inside a block of glass with crossed infrared beams. The work was published from Stanford University in 1996, with Downing as first author. |  | `public/people/roger-macfarlane.jpg` |
| Daniel Smalley | Optical trap display | The Brigham Young University professor. A common name. |  | `public/people/daniel-smalley.jpg` |
| Ryuji Hirayama | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. |  | `public/people/ryuji-hirayama.jpg` |
| Diego Martinez Plasencia | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. |  | `public/people/diego-martinez-plasencia.jpg` |
| Nobuyuki Masuda | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. |  | `public/people/nobuyuki-masuda.jpg` |
| Sriram Subramanian | Acoustic levitation display | Built the display at the University of Sussex and published it in 2019. | yes | `public/people/sriram-subramanian.webp` |
| Yoichi Ochiai | Laser plasma display | Led the version of 2015, which uses far shorter laser pulses. | yes | `public/people/yoichi-ochiai.webp` |

## Hall 7, Depth

| Person | Piece | The right person | On the site | Save the picture as |
|---|---|---|---|---|
| Charles Wheatstone | Stereoscope and 3D glasses | Published the stereoscope in London in 1838, months before photography was announced. | yes | `public/people/charles-wheatstone.webp` |
| Frederic Ives | Parallax barrier | Frederic Eugene Ives, the father. His son Herbert Ives also worked on 3D pictures. | yes | `public/people/frederic-ives.webp` |
| Auguste Berthier | Parallax barrier | Described the principle in 1896. |  | `public/people/auguste-berthier.jpg` |
| Walter Hess | Lenticular display | Walter Rudolf Hess, the eye doctor of Rapperswil who filed the 1912 patent and later won a Nobel Prize. | yes | `public/people/walter-hess.webp` |
| Gabriel Lippmann | Integral imaging | Proposed it in France in 1908 and called it integral photography. | yes | `public/people/gabriel-lippmann.webp` |
| Dennis Gabor | Holography | Invented holography in 1948 at British Thomson-Houston in Rugby, England. | yes | `public/people/dennis-gabor.webp` |
| Emmett Leith | Holography | Published the off-axis method of recording holograms in 1962. | yes | `public/people/emmett-leith.webp` |
| Juris Upatnieks | Holography | Published the off-axis method of recording holograms in 1962. | yes | `public/people/juris-upatnieks.webp` |
| Margaret Benyon | Holography | Painter, born in Birmingham and raised in Kenya. She made holograms as art from 1968 and showed them a year later. |  | `public/people/margaret-benyon.jpg` |
| Stephen Benton | Holography | The first holographic video display was built in Benton's group at the MIT Media Lab in 1989. Jepsen's thesis of that year sets out its design. |  | `public/people/stephen-benton.jpg` |
| Mary Lou Jepsen | Holography | The first holographic video display was built in Benton's group at the MIT Media Lab in 1989. Jepsen's thesis of that year sets out its design. |  | `public/people/mary-lou-jepsen.jpg` |
| Ivan Sutherland | Head-mounted display | Built the first headset driven by computer graphics, at Harvard University in 1968. | yes | `public/people/ivan-sutherland.webp` |
| Bob Sproull | Head-mounted display | Built the first headset driven by computer graphics, at Harvard University in 1968. | yes | `public/people/bob-sproull.webp` |
| Kazuo Yoshinaka | Virtual retinal display | Proposed the display at Nippon Electric in Japan in 1986. |  | `public/people/kazuo-yoshinaka.jpg` |
| J. M. Naish | Head-up display | Worked out the system first called a head-up display, at Farnborough from 1956. |  | `public/people/j-m-naish.jpg` |
