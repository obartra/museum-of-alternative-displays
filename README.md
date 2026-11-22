# Museum of Alternative Displays

A museum of fifty-five display technologies, from split-flap boards to holograms, in seven
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

English is the source and lives with the data. Every other language is one file in `po/`,
in the gettext PO format that translation tools share: `po/es.po`, `po/ja.po` and so on.
Each entry holds a sentence in English, its translation, and a note that says where it
shows. `po/museum.pot` is the same list with no translation, for starting a new language.
`TRANSLATING.md` says how to add or improve one.

`npm run i18n` turns the PO files into what the site loads, `src/i18n/locales/<code>.ts`,
which are written fresh on every build and are not kept in the repository. It runs by
itself before `npm run dev`, `npm run check` and `npm run build`. A language goes on the
site when its file is named in `po/LINGUAS` and it has a line in `src/i18n/types.ts`, which
gives the menu its name. A language loads only when a visitor picks it. A sentence that is
not translated yet shows in English.

After a change to the English, `npm run i18n:sync` writes `po/museum.pot` again and brings
every PO file up to date. A sentence whose English changed is marked fuzzy, which
translation tools show as "needs review", and keeps its old translation until someone
looks at it.

`npm run check` reads each built language against the English. It fails on a sentence that
lost a `{mark}`, a button or a hall name that is too long, or a different number of
paragraphs. It also prints any figure that the English has and the translation lacks, so a
dropped date gets a second look. It reads "10,197", "10.197" and "10 197" as one figure,
and it knows that "130 million" and "1.3亿" are the same.

## Guided tours

A guided tour is a story told along a trail. `src/data/tours.ts` holds it: a few words
before the first stop, a part for each stop of the trail, and a few words at the end. It is
written to be spoken, and it adds no facts to the labels: everything in it is on the label
of the piece it is told at. What it adds is the thread from one stop to the next.

A stop has three paragraphs. The first says what to look at. The second is about the
people: one person or one pair, and one year, and where the plate on the block names
someone else, the guide says why. The third hands over to the next stop. `who` names the
people a stop is about, and `npm run check` holds the numbers the tour gives about the
collection to the data.

A tour is taken in the walk. Its address is `#tour-women`, or `#tour-women-microled` for
one of its stops, and following the trail in the walk takes up the tour too. A band under
the picture (`src/guide.ts`) shows the stops along the line and carries the visitor to the
stop before or after. The guide speaks once the visitor stands there, and not on the way.
The person the stop is about is shown in a corner of the picture, with a portrait where
there is one. The visitor can switch her voice off and read the same words, and can leave
the tour and go on walking. A phone gives a tour the whole screen, and folds the walking
buttons behind one key. The words of the whole tour are also on one page, `#words-women`.

A stop may say where the tour stands the visitor (`stand` in the tour's data), when the
usual place in front of the block is too far back to show what the guide points at. The
tour is written for the walk: it names only what a visitor in the halls can see or press.

A language offers a tour only when it tells all of it, and the translations are in the PO
files with everything else. In the other languages the tour's address opens the walk on its
trail. A tour marked `draft` is not linked from anywhere. Its own address opens it, and
shows that visitor the rest.

### Having a tour spoken

`scripts/tour-audio.ts` has ElevenLabs speak each part, in each language that tells the
tour and that the model can speak. The workflow **Tour audio** runs it:

1. Add the key of the ElevenLabs account as a repository secret called
   `ELEVENLABS_API_KEY` (Settings, Secrets and variables, Actions). A key that may only
   make speech is enough to record. Listing the voices also needs the permission to read
   voices, and checking beforehand which languages the model speaks needs the permission
   to read models. Without that one the check is skipped.
2. Run the workflow with "List the voices to choose from". Its summary lists the women's
   voices of the account, each with a sample to listen to.
3. Put the id of the voice in `tour/voices.json`: under `default` for one guide in every
   language, or under a language code for a voice of its own. `leaveOut` names the
   languages that get no recording because the model does not speak them. `waiting` holds
   voices that are chosen and not yet in use. The script names them in its summary,
   records nothing with them, and passes over a language whose only voice waits. To use one, move its id up to `voices`: the next recording
   then speaks every part of that language again.
4. Run it with "Say how many characters it would send", then with "Record what is missing
   or out of date". The recordings are kept in `public/tour/` and the site is deployed.

A part is spoken in one piece. ElevenLabs says when each character was spoken, and the
script cuts the recording where its paragraphs meet, in the pause that is there, and puts
it together again as `delivery` in `tour/voices.json` says: a silence before the first
word, a longer one after the paragraph that says what to look at, one between the other
paragraphs and one at the end. The voice is asked to speak at `speed` of its own pace, and
a part that still runs faster than `pace` words a minute is stretched to it, by a tenth at
most. Every part is brought to the same loudness, with its peaks under a limit. This needs
`ffmpeg`, which the workflow installs. Where the times cannot be had, each paragraph is
spoken by itself.

With each recording the script keeps the time at which each caption of its words begins
(`cues`) and the time at which the voice ends each paragraph (`rests`). The captions are the
sentences of a part, a long one in pieces that fit on two lines (`src/data/captions.ts`). The
times come from where the script put the paragraphs and from the pauses of the voice inside
them (`scripts/tour/cues.ts`). `npx tsx scripts/tour-cues.ts` works them out for recordings
that are already there. It needs `ffmpeg` and no key.

The site offers a recording only beside the very words it was made from. When a part is
reworded it falls silent until the workflow is run again, and only that part is recorded
again. A change to the voice, the model or the delivery records every part again. The words
are always there to read, so the tour works without sound.

One player says every part (`voice` in `src/tour.ts`). A browser lets a page start a sound
only from a click, and remembers it for the player the sound was started on. So the click
that takes up a tour, on a link or on a button, starts the opening words then and there,
and the click that asks for a stop makes the guide ready, without a sound, so that she can
begin by herself when the visitor has arrived.

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

## People

`src/data/people.ts` names the people behind each piece: who they were and what they did for it, in one
line each, with any extra sources. A piece with no named maker has no entry. Where credit is shared or
contested, the entry carries a note, which the page prints under the names. The page for a piece shows its
people under the registry card, and `#people` lists everyone, with a filter for the women among them.
The lines are translated in each language file under `people`. Until a language has them, the English
stands in and `npm run validate` says how many sections are still owed.

Portraits are added by hand, and nothing in the build fetches one. They are pen drawings made with an AI
image model, of two kinds. A drawing after a picture follows a photograph that is free to reuse, and carries
its author, licence and source page. A study is for a person whose photographs all belong to somebody: the
face comes from photographs that named pages published, the pose and the clothing are the drawing's own, and
the pages are named beside it. `PORTRAITS.md` has the rules and lists every name with the file its picture
is expected under: a file in `public/people/` and one line in `src/data/portraits.ts`. `PORTRAITS-TODO.md`
lists who is still waiting and why. Every portrait is shown the same way, cropped alike and in black and
white, with its credit beside it. One marked `small` is kept to the size of a label and off the walls of
the walk, because its photographs are small or soft.

## The museum as an app

The site can be installed, on a phone and on a desk machine. `public/manifest.webmanifest` gives the app
its name, its colours and its icons, and `index.html` carries the tags an iPhone reads. Under its icon the
app is called Museum. A browser that installs sites has its own control for it. The About page adds a
button, Install the app, wherever the browser hands the page its prompt, which Chrome, Edge and the other
browsers built on Chromium do. Safari on an iPhone or iPad hands over nothing, so there the About page says
where to tap: Share, then Add to Home Screen. A copy that is already installed offers neither.

A worker, `src/sw.ts`, built into `sw.js`, keeps the museum on the device. It serves a plain tab as well as
an installed copy. It keeps three things:

- The building: the page, its scripts, its stylesheet and its typefaces, with every model and every label
  in English. It is fetched once, when the first page has loaded and come to rest, and today adds about
  340 KB to that first visit.
- A language, from the first time a visitor reads in it.
- Each picture, from the first time it is shown, up to 800 of them. A kept picture is shown at once and
  fetched again behind it, so a picture that changed on the server is the new one the second time.

With these the museum opens without a connection. The recordings of the guide and the archive films are
not kept: a player asks for them a part at a time, and the worker leaves that to the network. A visitor who
has asked the browser to save data gets only what the first page needs, and the rest as it is used.

### How a new build reaches an installed copy

The visitor does nothing, and is asked nothing. Every build has a mark, made from its page and the names of
its files and written into both the page and the worker (`keeper` in `vite.config.ts`). A build that changes
nothing keeps its mark.

1. The page is asked for from the network first, so a visitor with a connection opens the newest build. If
   the network has not answered within two and a half seconds, the kept page opens.
2. The browser looks for a new `sw.js` whenever a page of the site opens. `src/app.ts` has it look again
   when the page comes back into view, because an installed app is more often brought back than opened.
3. A new worker fetches the files whose names have changed, takes the others over from the worker before
   it, and takes over at once.
4. A page that was open at that moment is of the older build. It reloads by itself, at the same address,
   when that costs the visitor nothing: at once if they have not touched the page yet, and otherwise at
   their next change of page. It never reloads while the guide is speaking, while the walk or a model fills
   the window, or while a closer look or a dialog is open.
5. Until that page has reloaded, the files of its own build are kept for it. They are removed once no open
   page is of an older build.

The development server has no worker. To try the app, build the site and serve `dist/`: `npm run build`,
then `npm run preview`.

The icon is one drawing, `public/icons/icon.svg`: an enamel plate with the M of the name and the colours of
the seven halls. `node scripts/icons.mjs` makes the PNG files from it, and needs Playwright as the posters
do. A phone cuts an icon to a shape of its own, so two of the files run the plate out to the edges.

All of this has been run in a test browser on a desk machine. It has not been tried on a phone. On an
iPhone in particular, how the bar at the top of an installed copy looks by night is not known.

## Known gaps

- 28 of the 55 pieces still rest only on encyclopedia articles. Replacing those with primary
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

The museum's own texts and models are under
[Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/):
the labels, hall texts and tour in `src/data` and `po`, and the models in `src/three/models`.
Credit the Museum of Alternative Displays with a link, say what you changed, and share your
version under the same licence.

The licence does not cover the portraits in `public/people`, the recordings in `public/tour`,
or the archive pictures and films in `public/media`, each of which keeps the licence named in
its credit. No licence has been chosen yet for the rest of the code, which stays all rights
reserved by the repository owner until one is added. Typefaces are Sofia Sans and Sofia Sans
Extra Condensed (Lettersoup) and PT Mono (ParaType), each under the SIL Open Font License.
