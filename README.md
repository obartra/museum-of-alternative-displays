# Museum of Alternative Displays

A museum of fifty display technologies, from split-flap boards to holograms, in seven
halls. Each one is a 3D model you can turn and zoom, with its lit surface running live, a
plain account of how it works, what it is good at, where it fails, and the sources. Nothing
is for sale.

Live at https://obartra.github.io/museum-of-alternative-displays/

Every piece is shown in the same room. It has a polished concrete floor that mirrors what
stands on it, white walls, a cast concrete block for a stand, and tall windows that look
across a Catalan town to Montserrat. Nothing lights it but those windows. One switch turns
day into night. A hall is not a room: it is a group of pieces that make a picture in the
same way.

The museum can also be walked through. It is a building of seven halls in a row, one for each
hall of the collection, with a doorway between each and the next and the same windows down one
side. Every piece stands in its own hall. Arrow keys walk and turn, a click or a tap on a piece
goes to it, and a plan of the building shows where the visitor is. On a phone the walk waits to
be started, and runs a lighter version.

## Rules of the collection

- A piece is a principle, never a product. A product is named only when it was the first
  of its kind or is the example everyone means.
- No adverts, no affiliate links, no video players from other sites, no links to shops.
- Every piece states its limits. A piece with no stated limits is an advert.
- Every date and name comes from a source that was opened and read. Sources are listed per
  piece and labelled by kind (paper, patent, archive, lab, maker, press, reference).
- Where sources disagree or say nothing, the piece carries a note saying so.
- Every object on a stand is a model built in code. Real photographs, drawings and films
  appear only under "From the archive", only when free to reuse, and always with a credit.

`npm run validate` enforces the checkable parts of this and CI fails the build if a piece
breaks them.

## Working on it

```sh
npm install
npm run dev        # local server
npm run check      # typecheck and validate the collection
npm run build      # static site in dist/
npm run posters    # re-render the still pictures (dev server running, Playwright installed)
npm run cutouts    # re-photograph the pieces for the walk, and the hall from its door (the same)
```

Node 22 or newer.

## Where things are

| Path | What |
| --- | --- |
| `src/data/pieces/h1.ts` to `h7.ts` | The catalogue, one file per hall. Text, dates, sources. |
| `src/data/halls.ts`, `schema.ts` | Halls and the shape of a piece. |
| `src/data/views.ts` | The words for each piece's own places to look from: the button and a line about what to notice. |
| `src/data/media.ts`, `public/media/` | Archive photographs, engravings and films, most from Wikimedia Commons, with captions and full credits. |
| `src/data/media-patents.ts` | Drawings from United States patents, one or two for most pieces. `scripts/patents.mjs` cuts them from the sheets listed in `scripts/patents.json`. |
| `src/archive.ts` | The "From the archive" row on a piece page, its viewer, and the credits list. |
| `src/i18n/en.ts` | Every word of the interface, in English. The list a translation has to cover. |
| `src/i18n/locales/` | One file per language, with the interface and the whole collection in that language. Loaded on demand. |
| `public/posters/` | A still picture of every piece by day and by night, in two sizes. Lists show these, and a piece page shows one until its model is running. Made by `scripts/posters.mjs`. |
| `src/three/models/h1.ts` to `h7.ts` | One model builder per piece. |
| `src/three/kit.ts` | Materials and shapes shared by every model: glass, finishes, eased edges, glow, and portals for things seen through other things. |
| `src/three/parts.ts` | Small hardware: screws, louvres, knobs, feet, lenses, posts, breadboards. |
| `src/three/stage.ts` | The renderer, the camera and the piece on show. |
| `src/three/room.ts` | The room around the piece: glazed walls, the mirroring floor, the cast block, and the sun and moon that light it. |
| `src/walk.ts` | The page round the walk: the plan of the hall, the line that says where the visitor is, the buttons that do what the keys do. |
| `src/three/walk/` | The long hall and the visitor in it. `plan.ts` is the floor plan and the way round the blocks, `hall.ts` the building, `stands.ts` the blocks and what stands on them, `gallery.ts` the renderer and the walking, `vr.ts` the headset. |
| `public/cutouts/` | Each piece photographed alone on its block from three sides, by day and by night, and a sheet of the same pictures small. In the walk only the few pieces nearest the visitor are models. The rest are these pictures, stood upright and turned to the visitor. Made by `scripts/cutouts.mjs`, with `public/walk-*.webp`, the hall from its door. |
| `src/three/ar.ts` | A piece in the visitor's own room: built again at table size and shown through the browser's own room view (WebXR), where there is one. |
| `src/three/vista.ts` | What the windows look out on: the sky, and a painted panorama of Montserrat over a town, by day and by night. The eastern three quarters of the ridge are traced from a photograph taken from the north. |
| `src/sims/draw.ts` | The shared test signal: the time of day as digits, dots and segments. |
| `src/main.ts` | Pages and routing. |
| `scripts/validate.ts` | The collection's rules as code. |
| `docs/model-review.md` | Every model rated for accuracy and fit, with what was changed. |
| `docs/design-review.md` | A review of the interface on phone and desktop: what was looked at, what was changed, what was left. |

## Languages

English is the source and lives with the data. Spanish, Catalan, French, German and
Simplified Chinese each live in one file in `src/i18n/locales/`, named by its code, that
default-exports a `Locale` (see `src/i18n/types.ts`): the interface words, the labels, and
the text of every hall, piece, fact, view and archive picture. A language loads only when a
visitor picks it.

`npm run check` fails if a language lacks an interface string, a label, a hall or a piece,
or if a piece has a different number of paragraphs than the English. A fact, a view or an
archive caption that was added after a translation shows in English until it is translated.
The check lists how many of those each language still owes, and it does not stop the build.
It also prints any figure that the English has and the translation lacks, so a dropped date
gets a second look. It reads "10,197", "10.197" and "10 197" as one figure, and it knows
that "130 million" and "1.3亿" are the same.

The header shows the language menu. A first visit follows the browser's language. The
choice is remembered.

## Archive pictures

Only public domain, CC0, CC BY and CC BY-SA files from open archives, hosted here at web
sizes. Most photographs and films come from Wikimedia Commons. Each entry carries its
author, licence, source page and what was changed, and `npm run check` refuses an entry
without them, a licence outside that list, a source that is not one of the archives it
knows, or a file that is missing or too heavy. No portraits, and no pictures whose subject
is someone else's copyrighted work.

The patent drawings are figures from United States patents, whose text and drawings are not
subject to copyright unless the patent itself carries a notice, and none of these does.
`scripts/patents.json` names each sheet at Google Patents and the box to cut from it, and
`node scripts/patents.mjs` downloads the sheet once, cuts the figure, paints out anything
listed as `blank` (an attorney's signature, the edge of a neighbouring figure), turns it
upright and writes the two sizes. It needs the `sharp` package. The credit of each drawing
says which of those things was done to it.

## Adding a piece

1. Add an entry to the right `src/data/pieces/hN.ts`. Write the limits before the strengths.
   List the sources you actually read.
2. Add a builder to `src/three/models/hN.ts` and register it under the same id in
   `src/three/models/index.ts`. A builder returns a `Built`: a group, an optional per-frame
   `update`, and how the piece behaves when day turns to night. If the piece was made to
   be looked into or sat in front of, or has a part worth going close to, give it `views`:
   the camera's two points under an id, with the words for that id in `src/data/views.ts`.
   The page then offers a button that puts the visitor there.
3. Run `npm run posters` so the new piece has its still pictures, and `npm run cutouts` so
   it has its place in the walk.
4. `npm run check`.

To look at every model at once, open `#sheet` on the dev server, or `#sheet?lights=off`.
To see the painted landscape on its own, open `#vista`. `#cutouts` is the workshop that
`scripts/cutouts.mjs` drives: it photographs the pieces for the walk and has nothing to look at.
Add `&ids=a,b` for a few pieces, `&size=420` for bigger tiles, `&view=seat` for a named view, `&view=*` for every named view of each piece beside the whole piece,
or `&az=40&el=60` to look from any angle.

In the walk, a phone runs three models at once and a desk machine up to eight. Every other
piece is a picture of itself, cut out and stood on its block. A picture from the front would
be wrong for someone coming down the hall, who sees each piece ahead from round its side, so
every piece has three pictures and the one nearest the visitor's angle is shown. The pictures
are taken in the hall, in its own light and shadow, by `scripts/cutouts.mjs`. The same run
writes `src/three/walk/glows.ts`, the colour of every piece that glows, which at night
becomes a pool of light on the floor in front of it.

A piece page shows its still picture first and starts the model by itself only where the
device draws 3D with its graphics chip and the visitor has not asked to save data. Anywhere
else it waits for the Start 3D button. `?gl=force` or `?gl=off` before the `#` overrides that,
which is how the software-rendered test browser is made to run the model.

Models are built from code, with no mesh files. What makes them read as objects is in the
kit: edges are eased by default, glass shows a dark line where it turns away, and a lamp is a
bright core with a halo. A reflection, a scene behind a lens or a symbol in a combiner is
drawn with `portal()`, which shows its contents only through a window and so behaves like the
real thing when the visitor moves.

## Known gaps

- 28 of the 50 pieces still rest only on encyclopedia articles. Replacing those with primary
  sources is the main open job. `npm run validate` prints the current count.
- Not yet in the collection: falling-water curtains, aerial imaging plates, grating light
  valves, switchable privacy glass, ferrofluid, light-activated paints.
- The models were reviewed against text sources, not against photographs. See
  `docs/model-review.md` for the scores and what is still open.
- The walk has been run in a test browser that draws in software and once on a desk
  machine's graphics chip. How fast it runs on a phone has not been measured.
- The headset view of the walk and the room view of a piece (`src/three/ar.ts`) have been
  tried in an emulated headset ([IWER](https://github.com/meta-quest/immersive-web-emulation-runtime)),
  not on a real one and not on a phone. In the emulator there are no surfaces to find, so the
  ring that marks a table or the floor has never been seen working. iPhones have no such room
  view in their browsers and are not offered the button.
- Archive film is thin: most pieces have photographs or patent drawings and no moving picture.
- Routes are hash links (`#hall-2`, `#piece-nixie-tube`), so pieces are not separate pages for
  search engines.

## Deployment

`.github/workflows/deploy.yml` typechecks, validates, builds and publishes `dist/` to GitHub
Pages on every push to `main`. In the repository settings, Pages must be set to build from
GitHub Actions.

## Licence

No licence has been chosen yet. Until one is added, the code and text are all rights reserved
by the repository owner. Typefaces are Sofia Sans and Sofia Sans Extra Condensed (Lettersoup)
and PT Mono (ParaType), each under the SIL Open Font License.
