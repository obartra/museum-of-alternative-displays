# A mark for the museum: a study

Asked on 22 November 2026: a made-up logo in the museum's own style, four letters on four squares
(AD on one row, MU on the next), each letter on a hall colour. One board argues for that idea as
strongly as it can be argued. A second sets it beside three other marks and gives a verdict.

Nothing here is on the site yet. The app icon is still `public/icons/icon.svg`.

![Four plates: AD over MU](logo-1-four-plates.jpg)

![Which mark? A designer's pass](logo-2-designers-pass.jpg)

## The idea, at its strongest

Four enamel plates, of one family with the hall numbers, in red lead, cobalt, turquoise and chrome
yellow. Together they read as one pixel of the museum with four sub-pixels. The letters are set in
the display face. Under 28 pixels the letters are dropped and the four colours stay, so the mark
holds as a favicon. It works at night and in one ink.

## The verdict

Keep the plates and the colours, and put the rows in the order of the name: **MU over AD**.

| Mark | For | Against |
| --- | --- | --- |
| 1. AD over MU | Bold, simple, of one family with the hall numbers | Reads ADMU, which is not the order of the name, and ADMU is the initialism of Ateneo de Manila University [1] |
| 2. MU over AD | The same plates in the order of the name: the top row says museum, the bottom row says what kind | Four hall colours of seven. A search for MUAD found no museum of that name; the nearest are MAD in New York [2] and MUAC in Mexico City [3] |
| 3. Seven segments | Seven segments for seven halls, and the mark is itself a display. It can light one segment for the hall a visitor is in | At a glance it is a figure 8 in a rainbow. Muddy at 16 pixels |
| 4. The M of today | Already the app icon, with all seven halls on it | An M on a dark plate is what many apps have. The seven squares vanish at 16 pixels |

The seven colours stay with the halls. The seven-segment figure is better kept as something inside
the museum (a hall indicator, a loading figure) than as the logo.

## To carry it out

Once a mark is chosen: `public/icons/icon.svg` and the sizes made from it, the favicon, the header
beside the name, the picture shared with a link, and the web app manifest.

## Making the boards again

`marks.py` holds the marks as SVG. `board.py` writes the two boards as HTML; photograph them at
1080 pixels wide and twice the size.

    python3 docs/brand/board.py /tmp

## Sources

1. OneLook, "ADMU", quoting Wiktionary: https://www.onelook.com/?w=ADMU
2. Britannica, "Museum of Arts & Design (MAD)": https://www.britannica.com/topic/Museum-of-Arts-and-Design
3. Ocula, "Museo Universitario Arte Contemporáneo (MUAC)": https://ocula.com/institutions/university-museum-of-contemporary-art-mexico/
