# Museum of Alternative Displays

A vendor-neutral museum of display technologies that are not the screen you are holding.
Fifty pieces in seven halls. Each one is a 3D model you can turn and zoom, with its lit
surface running live, a plain account of how it makes an image, what it is good at, where
it fails, and the sources.

The museum is imagined as a physical place first, and the website follows that building:
a floor plan, halls with door plates, and one room that every piece is shown in. The room
has a polished concrete floor that mirrors what stands on it, white walls, a cast concrete
block for a stand, and tall windows that look across a Catalan town to Montserrat. Nothing
lights it but those windows. One switch turns day into night.

## Rules of the collection

- A piece is a principle, never a product. A product is named only when it was the first
  of its kind or is the example everyone means.
- No adverts, no affiliate links, no video embeds, no links to shops.
- Every piece states its limits. A piece with no stated limits is an advert.
- Every date and name comes from a source that was opened and read. Sources are listed per
  piece and labelled by kind (paper, patent, archive, lab, maker, press, reference).
- Where sources disagree or say nothing, the piece carries a note saying so.
- Nothing is a photograph. Every object is built in code, so there are no image rights to
  clear and nothing to go stale.

`npm run validate` enforces the checkable parts of this and CI fails the build if a piece
breaks them.

## Working on it

```sh
npm install
npm run dev        # local server
npm run check      # typecheck and validate the collection
npm run build      # static site in dist/
npm run posters    # re-render the still pictures (dev server running, Playwright installed)
```

Node 22 or newer.

## Where things are

| Path | What |
| --- | --- |
| `src/data/pieces/h1.ts` to `h7.ts` | The catalogue, one file per hall. Text, dates, sources. |
| `src/data/halls.ts`, `schema.ts` | Halls and the shape of a piece. |
| `src/data/views.ts` | The words for each piece's own places to look from: the button and a line about what to notice. |
| `public/posters/` | A still picture of every piece by day and by night, in two sizes. Lists show these, and a piece page shows one until its model is running. Made by `scripts/posters.mjs`. |
| `src/three/models/h1.ts` to `h7.ts` | One model builder per piece. |
| `src/three/kit.ts` | Materials and shapes shared by every model: glass, finishes, eased edges, glow, and portals for things seen through other things. |
| `src/three/parts.ts` | Small hardware: screws, louvres, knobs, feet, lenses, posts, breadboards. |
| `src/three/stage.ts` | The renderer, the camera and the piece on show. |
| `src/three/room.ts` | The room around the piece: glazed walls, the mirroring floor, the cast block, and the sun and moon that light it. |
| `src/three/vista.ts` | What the windows look out on: the sky, and a painted panorama of Montserrat over a town, by day and by night. The eastern three quarters of the ridge are traced from a photograph taken from the north. |
| `src/sims/draw.ts` | The shared test signal: the time of day as digits, dots and segments. |
| `src/art/` | The floor plan and the building drawings, generated as SVG. |
| `src/main.ts` | Pages and routing. |
| `scripts/validate.ts` | The collection's rules as code. |
| `docs/model-review.md` | Every model rated for accuracy and fit, with what was changed. |
| `scripts/mock.ts` | Regenerates the concept sheets and mockups from before the build. |

## Adding a piece

1. Add an entry to the right `src/data/pieces/hN.ts`. Write the limits before the strengths.
   List the sources you actually read.
2. Add a builder to `src/three/models/hN.ts` and register it under the same id in
   `src/three/models/index.ts`. A builder returns a `Built`: a group, an optional per-frame
   `update`, and how the piece behaves when day turns to night. If the piece was made to
   be looked into or sat in front of, or has a part worth going close to, give it `views`:
   the camera's two points under an id, with the words for that id in `src/data/views.ts`.
   The page then offers a button that puts the visitor there.
3. Run `npm run posters` so the new piece has its still pictures.
4. `npm run check`.

To look at every model at once, open `#sheet` on the dev server, or `#sheet?lights=off`.
To see the painted landscape on its own, open `#vista`.
Add `&ids=a,b` for a few pieces, `&size=420` for bigger tiles, `&view=seat` for a named view,
or `&az=40&el=60` to look from any angle.

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
- No photographs or archive film. If added, they should be public domain or openly licensed,
  hosted here, and credited on the piece.
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
