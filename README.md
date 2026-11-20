# Museum of Alternative Displays

A vendor-neutral museum of display technologies that are not the screen you are holding.
Fifty pieces in seven halls. Each one is a 3D model you can turn and zoom, with its lit
surface running live, a plain account of how it makes an image, what it is good at, where
it fails, and the sources.

Muzeum alternativních displejů is imagined as a physical place first, a former picture-tube
works, and the website follows that building: a floor plan, halls with enamel door plates,
pieces on steel plinths, and one switch for the hall lights.

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
```

Node 22 or newer.

## Where things are

| Path | What |
| --- | --- |
| `src/data/pieces/h1.ts` to `h7.ts` | The catalogue, one file per hall. Text, dates, sources. |
| `src/data/halls.ts`, `schema.ts` | Halls and the shape of a piece. |
| `src/three/models/h1.ts` to `h7.ts` | One model builder per piece. |
| `src/three/kit.ts` | Materials and shapes shared by every model. |
| `src/three/stage.ts` | The plinth, the hall, the lights and the camera. |
| `src/sims/draw.ts` | The shared test signal: the time of day as digits, dots and segments. |
| `src/art/` | The floor plan and the building drawings, generated as SVG. |
| `src/main.ts` | Pages and routing. |
| `scripts/validate.ts` | The collection's rules as code. |
| `scripts/mock.ts` | Regenerates the concept sheets and mockups from before the build. |

## Adding a piece

1. Add an entry to the right `src/data/pieces/hN.ts`. Write the limits before the strengths.
   List the sources you actually read.
2. Add a builder to `src/three/models/hN.ts` and register it under the same id in
   `src/three/models/index.ts`. A builder returns a `Built`: a group, an optional per-frame
   `update`, and how the piece behaves when the hall lights go off.
3. `npm run check`.

To look at every model at once, open `#sheet` on the dev server, or `#sheet?lights=off`.

## Known gaps

- 28 of the 50 pieces still rest only on encyclopedia articles. Replacing those with primary
  sources is the main open job. `npm run validate` prints the current count.
- Not yet in the collection: falling-water curtains, aerial imaging plates, grating light
  valves, switchable privacy glass, ferrofluid, light-activated paints.
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
