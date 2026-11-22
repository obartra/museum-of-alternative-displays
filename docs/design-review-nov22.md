# Museum of Alternative Displays: design review and a new design

> The design review of 22 November 2026, kept as it was written. Its design was merged the same day on top of the phone layouts, and the parts it lists as newer than its patch (the short visit's card and band, Share, the visit's end page) were restyled to match. The pictures it names by file were taken for the review and are not in the repository.

Reviewer "design", 22 November 2026.

The patch is against commit `da0411c`. The live site served exactly that build at 12:04 today (build mark `b7aee6909af1`, the same as my untouched build) and has moved on since. So that a pair of pictures differs by the design and by nothing else, "before" is my untouched build of `da0411c` and "after" is the same commit with the patch.

Pictures are in `shots/`: `before-*.png`, `after-*.png`, and `pair-*.jpg` with both side by side. Open `before-after.png` first.

## Part A. The critique

I looked in Chrome at 390 x 844, 320 x 568, 844 x 390, 820 x 1180 and 1440 x 900, by day and by night, in English, German and Japanese. Counts come from a script that measures every control and every run of text. Load times are medians on a phone profile: processor four times slower, 1.6 Mbit/s, 150 ms round trip.

Ranked by what each costs a visitor.

**1. The entrance shows no museum.** On a phone the first screen is a header 126 px tall, two paragraphs, four outlined buttons and the top of a dark band. The first picture starts 1,090 px down. On a desk the room starts at 580 of 900 px. In the first five seconds a visitor takes this for an article about displays, and reads or leaves. The owner asked for "heavy emphasis on visuals". (`pair-entrance-390-day.jpg`)

**2. On a desk, Expand folds the model away.** At 980 px and wider, the key marked Expand on a piece page leaves a strip of keys and no picture (`pair-stagefull3d-1440-day.jpg`). The rule that pins the stage beside the label beats the rule that lets it fill the window. This is a fault, not a matter of taste.

**3. Night is a black page round blue pictures.** The page is #000000. The corners of the night pictures measure #0c101a to #111c2d, so every picture shows as a box, and the hall plates glare beside them. Night is the museum's own idea, and here it looks like any dark mode. (`pair-hall2-1440-night.jpg`)

**4. The switch that makes the museum is the smallest thing on the page.** Daylight is a rocker 52 x 28 px in the header, and under 520 px its label is hidden. Nothing at the door invites a visitor to press it.

**5. Controls are too small for a thumb.** At 390 px, 25 of 28 controls on the entrance are under 44 px in one direction, 26 of 31 on a piece, and 40 of 41 on the page of the tour's words, where 29 are under 24 px. Footer links are 20 px tall. Rows of the board are 24 px tall and 4 px apart.

**6. Three pages are too long on a phone.** Hall 2 is 5,137 px for ten pieces, one picture to a row. On the index the list starts 909 px down, under the filters: a visitor who opens the index sees no index. People is 21,441 px with nothing to say which hall a visitor has reached, and its portrait credits sit in a column 84 px wide at 10.9 px.

**7. Type has no system.** A piece page uses 20 sizes, from 10.9 to 35.2 px, in three families. Condensed capitals letter the plates, which is right, and also every heading inside a label. The black plate is spent on "Index", "People" and "About", which are not signs. PT Mono sets the small data, weighs 27 KB, and every page waits for it.

**8. Controls and marks fall back on defaults.** Every button is a 1.5 px outline with 13 px lettering. The four ways in at the door look alike. Whether a piece is still made is a coloured outlined chip. The keys on the 3D picture are styled three ways, and none like the keys of the pages.

**9. Hall 5 has no edge.** Its ivory (#efe8d2) on the wall (#e8e9e3) is 1.0 to 1. Its door plate, the strip under its pictures and its number in the index dissolve into the page.

**10. The first paint waits in a queue.** The script arrives, then asks for three fonts, then draws. Another language adds a file of about 60 KB that is asked for only after the script has run.

What holds up. Layout shift is 0 on every page. The still picture hands over to the live model in a 0.35 s fade and nothing jumps. A piece is staged well: its block with the cast numeral, the window, the mountain. Loading, no 3D and failure are each said in plain words on the picture (`pair-fail3d-390-day.jpg`). With text at 200% nothing is cut off, and with reduced motion nothing animates. axe finds one fault: the stops on the tour's line are 19 px wide at 320 px and 23.9 px at 390 px, under the 24 px that WCAG 2.2 asks.

In the walk on a phone the picture is held to 62% of the height of the screen, with five rows of controls under it. Their positions are another agent's work, so I judge only their look.

The budget I would hold the site to, on the phone profile: largest paint under 2.0 s; layout shift 0; blocking time under 200 ms; the first load of the entrance or a piece under 270 KB before any 3D. No third typeface. Over the 3D picture: no blur, no filter, no soft shadow.

## Part B. The direction

What is already this museum's, and stays: the enamel plates with their rivets and inner line, the split-flap board, the rocker switch with its red knob, the seven hall colours, the block with its cast numeral, the tour's line with its stops, and the plain voice of the labels.

The idea is three materials, each with one job. Enamel says. Concrete carries. Glass shows.

| Name | Day | Night | Role |
|:-|:-|:-|:-|
| Limewash | #e8e9e3 | #08101a | the wall: the ground of every page |
| Cast concrete | #c9cbc4 | #131d2c | what a picture stands on |
| Frame black | #14171a | #dde3ea | lettering and the edges of keys |
| White enamel | #f7f6f0 | #182435 | the faces of keys and plain plates |
| Red lead | #d1481f | #e2603a | what is switched on, and where the keyboard is |
| Graphite | #4c5356 | #97a3b3 | small print |

The seven hall enamels and the colours of the trails stay. Hall 6 is one shade deeper (#13827a) so that white on it reaches 4.66 to 1. The night wall is measured from the night pictures, so a picture has no edge at night.

Type. Two families, down from three. Sofia Sans Extra Condensed, weight 800, in capitals, letters signs and nothing else: plates, door numbers, the names in a list of pieces, the board, the band of the tour. Sofia Sans sets the rest in sentence case. Labels use 13, 15, 17, 20 and 26 to 40 px. Signs use 22, 28, 35 to 67 and 80 to 176 px.

Layout. The picture comes first and runs from edge to edge. Signs are fixed in place. Labels flow under them.

```
ENTRANCE, PHONE              ENTRANCE, DESK
+========================+   +===========================================+
| MUSEUM OF ..  [EN] (0|)|   | MUSEUM OF ..  [EN] (0|)    [1]..[7] Index |
| [1][2][3][4][5][6][7]  |   +===========================================+
+========================+   | 55 ways to make    |                      |
|                        |   | a picture.         |      the room,       |
|   the room,            |   | two lines of text  |      as tall as      |
|   edge to edge         |   | +================+ |      the words and   |
|        [(0|) Daylight] |   | | the board      | |      the board       |
+========================+   | +================+ |                      |
| 55 ways to make        |   | [Start] Walk Index |      [(0|) Daylight] |
| a picture.             |   +===========================================+
| +====================+ |   | the band of the guided tour               |
| | the board of halls | |
| +====================+ |   PIECE, PHONE              PIECE, DESK
| [Start in hall 1] Walk |   +====================+    +================+
| the band of the tour   |   | the picture,       |    | picture | plate|
                             | edge to edge       |    | (stays) | label|
HALL, PHONE                  +::: concrete :::::::+    | ::keys::| ...  |
plate with numeral, then     | [views >>>]        |    +================+
two pictures to a row        | (0|)  [Pause][Exp] |
                             +====================+    INDEX, PHONE
PEOPLE                       | [1] Hall     walk  |    four questions, each
the hall's plate stays at    | PLATE: THE NAME    |    one row of keys that
the top while its people     | label ...          |    scrolls sideways,
pass under it                | Back        Next   |    then the list
```

Motion. Four things move. The room at the door fades from day to night in 0.7 s when the switch is pressed. The board's flaps settle once, as now. The picture of a piece is carried from its place in the hall to its stand and back (0.36 s, the browser's own page transition, no library). A key goes down 2 px when pressed. Reduced motion stops all four.

Three principles.

1. A sign is enamel, a label is print. Condensed capitals stand only on what would be a sign in the building.
2. One switch lights everything. Day and night are the same hall, and the switch stands at the door beside the room it lights.
3. Whatever does something is a key: a white enamel face with a black line, on a 2 px black edge that it goes down onto. What is on is black. Red lead is kept for the switch and for focus.

The boldness is spent at the door. Everything else is quiet.

What I revised after checking the plan against the brief.

- I had kept the typed inventory card. A monospace face for small data is on the brief's list of looks nobody chose, and here it cost 27 KB. The record is now in the text face.
- I had drawn night as near-black with the red knob as its one accent, the second look on that list. Night is now the measured blue of the night pictures.
- I had set the "Worth knowing" fact behind a red bar, as I would for any museum. It is now only a size larger.
- I had kept coloured status chips. They are now a pilot lamp, lit for what is made and an empty ring for what is not, as on the panels these pieces sat in.
- I had four equal keys at the door. The board is the way in, so one key stays and the rest are plain links.
- Black plates on Index, People and About are gone: a plate that names no hall and no piece is not a sign.
- Hairline rules stay only in lists of records, where a rule parts one entry from the next. The heavy rules above each part of a label are gone.

## Part C. What I built

It is in `src/styles/`, `src/main.ts`, `src/tour.ts`, `index.html` and `vite.config.ts`, on the real content. No id, class or data attribute that a script uses was renamed.

- **Header.** Door plates 44 px tall, each with an edge, so hall 5 shows. Language and Daylight are keys.
- **Entrance.** The room first, with the building's switch on a plate beside it. Then the sentence, the board with rows 44 px tall, one key and three links, the tour's band, the walk.
- **Hall.** Two pictures to a row on a phone. Under each name: who made it and when, as on the plate of its block in the walk. A lamp for its status.
- **Piece.** The picture runs edge to edge on a phone and stands on concrete that holds its keys. Portrait credits run under the words. Source links are 44 px tall. Expand works on a desk.
- **Index.** Each question is one row of keys on a phone.
- **People.** Each hall's plate stays at the top of the window while its people pass.
- **Walk and guide.** Every key on the picture has the one face and edge. The band's keys, the name plate, the plan and the words are restyled. Positions are untouched. The blur behind keys over the 3D picture is gone.
- **Night** on every page, with plates dimmed by 12%.
- **Footer.** Links 44 px tall. The owner's Install control is a key: last in the row on a desk, on a row of its own on a phone (`pair-foot-390-day.jpg`).
- **Speed.** The two fonts and the visitor's language are asked for at once, beside the script. PT Mono loads only with 3D, which still uses it. The first page is drawn in a turn of its own.

### Numbers

Phone is 390 x 844. Both columns are builds of `da0411c`. Times and weights are medians of three loads on the phone profile, served with gzip. Lighthouse is the median of three with its throttling applied.

| | Before | After |
|:-|:-|:-|
| Entrance: first picture starts at | 1,090 px | 116 px |
| Entrance: largest paint is | a paragraph | the room |
| Controls under 44 px: entrance | 25 of 28 | 8 of 29 |
| Controls under 44 px: piece | 26 of 31 | 8 of 31 |
| Controls under 44 px: tour's words | 40 of 41 | 8 of 41 |
| Controls under 24 px, but for the tour's stops | up to 29 | 0 |
| Sizes of type on a piece page | 20 | 9 |
| Typefaces a page waits for | 3 | 2 |
| Hall 2, height | 5,137 px | 2,358 px |
| Index: the list starts at | 909 px | 636 px |
| People, height on a phone, on a desk | 21,441, 11,789 px | 21,700, 8,889 px |
| Largest paint: entrance, piece, hall | 1.78, 1.98, 1.94 s | 1.78, 1.71, 1.60 s |
| Blocking time: entrance, piece, hall | 21, 64, 69 ms | 14, 79, 79 ms |
| First load: entrance, piece, hall | 287, 272, 369 KB | 262, 247, 326 KB |
| Layout shift | 0 | 0 |
| Lighthouse performance: entrance, piece | 85, 83 | 91, 89 |
| Lighthouse largest paint: entrance, piece | 3.38, 3.59 s | 2.76, 3.05 s |
| axe faults | 1, the tour's stops | the same 1 |

Five loads each on the builds of an earlier commit agreed, and put the entrance in Japanese at 2.29 s before and 2.12 s after.

One number may have got worse. Blocking time on a piece is 15 to 30 ms higher in the medians (64 to 79 ms here, 74 to 106 ms in the earlier set), and Lighthouse's on the entrance rose from 49 to 80 ms. The runs overlap and all are far under 200 ms, but I do not call it noise.

Still under 44 px on a phone: the seven door plates (39 px wide, 44 tall), one short footer link, and the tour's stops. On a desk a key is 36 px under a mouse and 44 under a finger.

### Checks

All on the final build, on port 4193.

- `npm run check`: types clean, collection valid, 55 pieces.
- `axe.mjs`, 13 routes at three widths by day and by night: one fault, the tour's stops, the same on the untouched build.
- `overflow.mjs` at 320 px in ten languages on seven routes: no page is wider than the window.
- `widths.mjs`: the header and the language menu fit at 15 widths in ten languages.
- `home.mjs` in English, Japanese and German: the tour's band is in place.
- `near.mjs`: 18 of 18 steps pass. `backstop.mjs`: the same four states as the untouched build. `stagecheck.mjs`: axe clean in full view, the keyboard stays in the stage, Escape closes it. None reports an error.
- Text at 200%: nothing cut. Reduced motion: no animation runs.

## Left for later, and why

- **Positions in the walk** belong to the agent rearranging the phone layouts. The tour now has thirteen stops, and the fifteen marks of its line are under 24 px each at 390 px and below. The line needs a second row, or to give way to the Previous and Next keys at that width. In a tour on a phone my band and the row of keys under it are about 25 px taller than before, taken from the picture: the price of keys and rows 44 px tall.
- **The tour's band at the door** now starts 1,147 px down on a phone, where it used to show in the first screen. If the tour matters more than the halls, one line of CSS puts it above the board. That is the owner's call.
- **Install on the About page** shows twice, in its own part and in the footer just under it. I would hide the footer's there.
- **People on a phone** is no shorter. It needs a way to jump to a hall or a letter, which is a product decision.
- **The door plates** are 39 px wide at 390 px and 29 px at 320 px. To make them 44 px wide takes two rows or a row that scrolls.
- **Merging.** The patch applies cleanly to `da0411c`. The shared working copy holds unfinished changes to the same stylesheet, and there the walk's part needs merging by hand. My changes in that part are colours, corners, edges and sizes of type, never positions.
- **Not measured.** Frames per second in the walk on a real phone, since 3D is drawn in software here. Safari and Firefox: every check ran in Chrome. Firefox has no page transition yet and changes page at once.

### What main has gained since `da0411c`

The patch does not cover these. To match the design:

- **The short visit's card at the door** (`.visitcard`): a plain plate of white enamel with the key's edge. Its first line in the text face at 13 px, not in mono, which pages no longer load. Its title in sentence case, since a visit is not a sign.
- **The visit's band above a piece** (`.visit`): the band's two colours from the tokens, so that it is right at night. Its step line in the text face, and its key like the keys of the tour's band.
- **Share**, in the row above a piece's plate: a key like the others, with the site's red focus ring.
- **The page at the end of the visit**: its heading like the plain page titles.
- **Licence, the author's line and "keep the whole museum"** on About use existing parts and need nothing.
