# Portraits

The labels name 96 people. Each one has a place for a portrait, and the place stays empty until a picture is added by hand. Nothing in the build fetches a picture.

## Adding a portrait

1. Find a picture that is free to reuse. The person's Wikipedia article usually shows one, and its file page on Wikimedia Commons states the author and the licence.
2. Save it in `public/people/` under the file name in the table below. A JPEG about 600 pixels wide is enough.
3. Add one line to `src/data/portraits.ts`, under the name exactly as the table spells it:

   ```ts
   'Elsa Garmire': { file: 'elsa-garmire.jpg', by: 'Name of the photographer', licence: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Example.jpg' },
   ```

The page shows every portrait the same way: one crop, black and white, one frame, with its author, licence and source beside it.

Not everyone here has a freely licensed portrait. A person without one keeps a label with no picture.

## Hall 1, Mechanics

| Person | Piece | Save the picture as |
|---|---|---|
| Gino Valle | Split-flap board | `public/people/gino-valle.jpg` |
| John Myer | Split-flap board | `public/people/john-myer.jpg` |
| Kenyon Taylor | Flip-disc display | `public/people/kenyon-taylor.jpg` |
| Paul Nipkow | Mechanical television | `public/people/paul-nipkow.jpg` |
| John Logie Baird | Mechanical television | `public/people/john-logie-baird.jpg` |
| Daniel Rozin | Kinetic mirror | `public/people/daniel-rozin.jpg` |
| Daniel Leithinger | Shape display | `public/people/daniel-leithinger.jpg` |
| Sean Follmer | Shape display | `public/people/sean-follmer.jpg` |
| Hiroshi Ishii | Shape display | `public/people/hiroshi-ishii.jpg` |
| Oleg Tretiakoff | Refreshable braille display | `public/people/oleg-tretiakoff.jpg` |
| Andrée Tretiakoff | Refreshable braille display | `public/people/andree-tretiakoff.jpg` |
| Klaus Peter Schönherr | Refreshable braille display | `public/people/klaus-peter-schonherr.jpg` |
| James Bryce | Refreshable braille display | `public/people/james-bryce.jpg` |
| Horst Hörtner | Drone light show | `public/people/horst-hortner.jpg` |

## Hall 2, Glass and glow

| Person | Piece | Save the picture as |
|---|---|---|
| Ferdinand Braun | Cathode ray tube | `public/people/ferdinand-braun.jpg` |
| Kenjiro Takayanagi | Cathode ray tube | `public/people/kenjiro-takayanagi.jpg` |
| Philo Farnsworth | Cathode ray tube | `public/people/philo-farnsworth.jpg` |
| Elma Farnsworth | Cathode ray tube | `public/people/elma-farnsworth.jpg` |
| Robert H. Anderson | Storage tube terminal | `public/people/robert-h-anderson.jpg` |
| Andrew Haeff | Storage tube terminal | `public/people/andrew-haeff.jpg` |
| David Hagelbarger | Nixie tube | `public/people/david-hagelbarger.jpg` |
| Tadashi Nakamura | Vacuum fluorescent display | `public/people/tadashi-nakamura.jpg` |
| Tadashi Sasaki | Vacuum fluorescent display | `public/people/tadashi-sasaki.jpg` |
| Donald Bitzer | Plasma display panel | `public/people/donald-bitzer.jpg` |
| Gene Slottow | Plasma display panel | `public/people/gene-slottow.jpg` |
| Robert Willson | Plasma display panel | `public/people/robert-willson.jpg` |
| Charles Spindt | Field emission display | `public/people/charles-spindt.jpg` |
| Kenneth Shoulders | Field emission display | `public/people/kenneth-shoulders.jpg` |
| Louis Heynick | Field emission display | `public/people/louis-heynick.jpg` |

## Hall 3, Solid light

| Person | Piece | Save the picture as |
|---|---|---|
| Howard Borden | LED display | `public/people/howard-borden.jpg` |
| Gerald Pighini | LED display | `public/people/gerald-pighini.jpg` |
| Isamu Akasaki | LED display | `public/people/isamu-akasaki.jpg` |
| Hiroshi Amano | LED display | `public/people/hiroshi-amano.jpg` |
| Shuji Nakamura | LED display | `public/people/shuji-nakamura.jpg` |
| Ching Wan Tang | OLED | `public/people/ching-wan-tang.jpg` |
| Steven Van Slyke | OLED | `public/people/steven-van-slyke.jpg` |
| Hongxing Jiang | MicroLED | `public/people/hongxing-jiang.jpg` |
| Jingyu Lin | MicroLED | `public/people/jingyu-lin.jpg` |
| Tuomo Suntola | Thin-film electroluminescent panel | `public/people/tuomo-suntola.jpg` |
| Nicholas Sheridon | Flexible display | `public/people/nicholas-sheridon.jpg` |

## Hall 4, Light valves

| Person | Piece | Save the picture as |
|---|---|---|
| Martin Schadt | Liquid crystal display | `public/people/martin-schadt.jpg` |
| Wolfgang Helfrich | Liquid crystal display | `public/people/wolfgang-helfrich.jpg` |
| James Fergason | Liquid crystal display | `public/people/james-fergason.jpg` |
| George Heilmeier | Liquid crystal display | `public/people/george-heilmeier.jpg` |
| Larry Hornbeck | Digital micromirror device | `public/people/larry-hornbeck.jpg` |
| Fritz Fischer | Eidophor | `public/people/fritz-fischer.jpg` |
| Joseph Ostoja-Kotkowski | Scanned laser | `public/people/joseph-ostoja-kotkowski.jpg` |
| Elsa Garmire | Scanned laser | `public/people/elsa-garmire.jpg` |
| Ivan Dryer | Scanned laser | `public/people/ivan-dryer.jpg` |
| Leota Toombs | Projection mapping | `public/people/leota-toombs.jpg` |
| Michael Naimark | Projection mapping | `public/people/michael-naimark.jpg` |
| Ramesh Raskar | Projection mapping | `public/people/ramesh-raskar.jpg` |
| Greg Welch | Projection mapping | `public/people/greg-welch.jpg` |
| Kok-Lim Low | Projection mapping | `public/people/kok-lim-low.jpg` |
| Deepak Bandyopadhyay | Projection mapping | `public/people/deepak-bandyopadhyay.jpg` |

## Hall 5, Paper

| Person | Piece | Save the picture as |
|---|---|---|
| Barrett Comiskey | Electrophoretic ink | `public/people/barrett-comiskey.jpg` |
| J. D. Albert | Electrophoretic ink | `public/people/j-d-albert.jpg` |
| Joseph Jacobson | Electrophoretic ink | `public/people/joseph-jacobson.jpg` |
| Deng-Ke Yang | Cholesteric display | `public/people/deng-ke-yang.jpg` |
| J. William Doane | Cholesteric display | `public/people/j-william-doane.jpg` |
| Gerardo Beni | Electrowetting display | `public/people/gerardo-beni.jpg` |
| Susan Hackwood | Electrowetting display | `public/people/susan-hackwood.jpg` |
| Robert Hayes | Electrowetting display | `public/people/robert-hayes.jpg` |
| Johan Feenstra | Electrowetting display | `public/people/johan-feenstra.jpg` |
| Mark Miles | Interferometric modulator | `public/people/mark-miles.jpg` |
| S. K. Deb | Electrochromic display | `public/people/s-k-deb.jpg` |

## Hall 6, Mid-air

| Person | Piece | Save the picture as |
|---|---|---|
| Henry Dircks | Pepper's ghost | `public/people/henry-dircks.jpg` |
| John Henry Pepper | Pepper's ghost | `public/people/john-henry-pepper.jpg` |
| Karri Palovuori | Fog screen | `public/people/karri-palovuori.jpg` |
| Ismo Rakkolainen | Fog screen | `public/people/ismo-rakkolainen.jpg` |
| Joseph Plateau | Persistence of vision display | `public/people/joseph-plateau.jpg` |
| Max Hirsch | Swept-volume display | `public/people/max-hirsch.jpg` |
| Gregg Favalora | Swept-volume display | `public/people/gregg-favalora.jpg` |
| Elizabeth Downing | Static-volume display | `public/people/elizabeth-downing.jpg` |
| Lambertus Hesselink | Static-volume display | `public/people/lambertus-hesselink.jpg` |
| John Ralston | Static-volume display | `public/people/john-ralston.jpg` |
| Roger Macfarlane | Static-volume display | `public/people/roger-macfarlane.jpg` |
| Daniel Smalley | Optical trap display | `public/people/daniel-smalley.jpg` |
| Ryuji Hirayama | Acoustic levitation display | `public/people/ryuji-hirayama.jpg` |
| Diego Martinez Plasencia | Acoustic levitation display | `public/people/diego-martinez-plasencia.jpg` |
| Nobuyuki Masuda | Acoustic levitation display | `public/people/nobuyuki-masuda.jpg` |
| Sriram Subramanian | Acoustic levitation display | `public/people/sriram-subramanian.jpg` |
| Yoichi Ochiai | Laser plasma display | `public/people/yoichi-ochiai.jpg` |

## Hall 7, Depth

| Person | Piece | Save the picture as |
|---|---|---|
| Charles Wheatstone | Stereoscope and 3D glasses | `public/people/charles-wheatstone.jpg` |
| Frederic Ives | Parallax barrier | `public/people/frederic-ives.jpg` |
| Auguste Berthier | Parallax barrier | `public/people/auguste-berthier.jpg` |
| Walter Hess | Lenticular display | `public/people/walter-hess.jpg` |
| Gabriel Lippmann | Integral imaging | `public/people/gabriel-lippmann.jpg` |
| Dennis Gabor | Holography | `public/people/dennis-gabor.jpg` |
| Emmett Leith | Holography | `public/people/emmett-leith.jpg` |
| Juris Upatnieks | Holography | `public/people/juris-upatnieks.jpg` |
| Margaret Benyon | Holography | `public/people/margaret-benyon.jpg` |
| Ivan Sutherland | Head-mounted display | `public/people/ivan-sutherland.jpg` |
| Bob Sproull | Head-mounted display | `public/people/bob-sproull.jpg` |
| Kazuo Yoshinaka | Virtual retinal display | `public/people/kazuo-yoshinaka.jpg` |
| J. M. Naish | Head-up display | `public/people/j-m-naish.jpg` |
