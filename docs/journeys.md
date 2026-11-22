# Museum of Alternative Displays: journeys and product review

> A review of the live site as it stood on the morning of 22 November 2026, kept as it was written. Several of its findings have been acted on since: a short visit, a page of its own for every piece with a picture a chat can show, the whole museum kept on request, an author and a licence on About. The pictures it names by file were taken for the review and are not in the repository.

Reviewer "pm", 22 November 2026. Rests on the live site, walked with Playwright on a phone (390 x 844, touch) and a desk (1440 x 900), and on the source as cloned today. Pictures are in `shots/`. Numbers are in Appendix A.

The live site was redeployed twice while I worked, at 15:06 and at 15:59 GMT. The first of those added the app manifest and a service worker. The findings on the entrance, the phone header, Back, the Index, printing, the link preview and the tour's card and words were checked again on the 15:59 build (78cb17c615a6) and still hold. The offline and no-3D findings, the tour's address on a phone, coming back to the walk and the walk's weight were measured on the 15:06 build. The pictures of the tour on a phone are from the build before that.

## 1. The curator's view

Written first, from the data and not the screens: the hall introductions, sixteen labels in full, the 48 People sections, the trail, the tour, About and docs/.

**The argument.** A display is a choice about where a picture's light comes from, and every choice costs something. The museum sorts 53 pieces by physics, not by date or brand: move real objects, glow inside glass, glow from a solid, shape a lamp's light, reflect the room, hang in the air, give each eye its own view. Three devices carry this. Every working piece shows the time of day, so pieces can be compared. Every label sets "Fails at" beside "Good at". One switch turns day into night and shows which pictures survive. A visitor should leave knowing that the screen in their hand is one answer out of 53, what it gave up, and that named people made each answer, many of them not the name on the plate.

**Who it is for.**

1. The passer-by with a phone and a few minutes: one thing that moves, one surprise.
2. The maker who needs a display that reads in sun, holds without power or floats, and wants the limits first.
3. The reader who wants a date, a name and the source behind it.
4. The teacher and class: twenty to forty minutes on light, or on who gets credit.
5. The visitor who follows people: fourteen women on the green line, a second trail soon.

**What it offers each, and where it is thin.**

- Passer-by: live models and the Daylight switch. Thin: no short visit is named.
- Maker: the Index asks the right questions. Thin: no figures, and an answer cannot be kept or sent.
- Reader: 179 source links marked by kind. Thin: for 28 of 53 labels the label text itself rests on encyclopedia articles alone (the README says so), and no label has a date.
- Teacher: seven halls are seven lessons. Thin: no questions, nothing to print, no word on level.
- People: 117 names, notes where credit is disputed, 74 portraits. Thin: one tour.

**What a curator would insist on and a product person might cut.** Sources on every label, with their kind. "Fails at" at the same weight as "Good at". The notes on disputed credit. The people who are not on the plate. The plain statements that models are simplified or slowed, that the building is imagined, that portraits are AI drawings and the voice is synthetic. No products, no shops. The tour's words on a page of their own. None of this should be folded away to shorten a page.

## 2. The journeys

### J1. Three minutes on a phone

- **Who, how:** the passer-by, sent the address by the owner.
- **Steps:** entrance `#`, "Start in hall 1" `#hall-1`, first tile `#piece-split-flap`, the Daylight switch, "Next".
- **Moments:** the first picture, the first running model, the first picture that vanishes at night.
- **Ends** when time is up. **Worked if** a piece runs within two taps and the switch is used once.

Walked: two taps reach a running piece, a third the switch, and "Next" stays at the foot of the screen. Three faults.

1. The first screen of a phone has no picture: 16 links and buttons, a tour card over a third of it, and the first picture 1.3 screens down (`j1-entrance-phone.png`). A desk shows a picture at once.
2. The text says "switch the daylight off". The switch in the phone header has no word on it, and the halls are seven bare numbers (`nav-header-phone.png`).
3. Back from a piece lands at the top of the hall list: 1,774 px before, 0 after.

"Next" keeps this visitor in hall 1. They never see paper vanish at night. No short route exists.

### J2. The guided tour, with sound

- **Who, how:** follows people, has headphones and twenty minutes. Entrance, or `#tour-women`.
- **Steps:** tour card `#tour-women`, "Next stop" twelve times, closing words, "Leave the tour".
- **Moments:** the first sentence, seeing what the guide names, stop 6 and its Daylight switch, the end.
- **Worked if** stop 12 is reached and a break resumes at the same stop.

Walked: one tap opens the walk in full view and the guide speaks from that tap. Faults:

1. On a phone the address stays `#tour-women` from stop to stop. A reload returns to "Before the first stop" (`j2-tour-phone-10-reload-from-full.png`). A desk resumes at the stop.
2. At stop 1 on an upright phone the guide says "watch the cells on the right" and the picture shows the display edge-on (`j2-tour-phone-3-stop1.png`).
3. The card says "about 13 minutes". That is the speech alone.
4. The end leads nowhere: not to the fourteen women, the words, or a way to send the tour on (`j2-tour-phone-6-end.png`).
5. A piece on the green line does not say so on its own page.

### J3. The reader: facts and sources behind one piece

- **Who, how:** student, writer, editor. Would arrive by search. Today that cannot happen (J4).
- **Steps:** `#index`, "A to Z", the row, `#piece-electrowetting`, registry card, People, Sources, out to a source.
- **Moments:** the year and the name, the note on credit, the source opening.
- **Ends** on the source's own site. **Worked if** the sources are reached in a minute and every link opens.

Walked: three taps and seven screens of scrolling. The Index has no box for a name. On a phone its filters fill the first screen, so tapping one changes nothing in view: count and rows are below (`j5-index-filtered-phone.png`). Sources sit 4.1 screens down a label with nothing to jump there. They are marked by kind, which is right.

Of 179 source links, five failed from here. Two stand behind women on the tour (Farnsworth, Garmire).

### J4. Arrives by a link to one piece

- **Who, how:** was sent `#piece-illusion-transmitter` in a chat. Never saw the entrance.
- **Steps:** the preview, the piece, its model, then "Next", the hall, or the museum's name.
- **Moments:** the preview, the first picture, the way on.
- **Worked if** the preview shows this piece, and a second page is opened.

Walked: the page does well. Picture in 0.45 s, then the model, a note that "This piece is clearer in the dark", and Back and Next at the foot (`j4-deeplink-phone-live.png`).

The preview is the fault, and it is the largest gap in the product. The server sends one page for every address: one title, no `og:` tags, no picture, no label text. All 53 pieces look alike in a chat. A search engine gets one page with an empty body and no sitemap, so the reader of J3 never arrives.

Smaller: "Next" crosses from hall 1 into hall 2 without the hall's introduction, where the argument is made.

### J5. The return visit

- **Who, how:** the maker, back with a question, by bookmark or the installed app.
- **Steps:** entrance, `#index`, two filters, "8 of 53", a piece, Back.
- **Moments:** what is new, where they stopped, an answer they can keep.
- **Worked if** resuming takes one tap and the answer has an address.

Walked: the filters answer at once. The answer survives Back but not a reload, and the address stays `#index`. The site remembers day or night, language, trail and voice. It does not remember what was seen or where the tour stopped, and nothing is marked new.

With the new service worker the site opens offline and a model starts offline. But pictures not seen before are broken with no word (`j5-offline-hall2-phone.png`), an unused language silently stays English, and the tour's recordings fail silently.

### J6. Reads another language

- **Who, how:** a Japanese or Catalan reader, by any link.
- **Steps:** the site opens in the browser's language, then entrance, a piece, the tour.
- **Worked if** nothing falls back to English without saying so.

Walked: the strongest journey. A browser set to Japanese gets Japanese unasked, the label checked has no English left in its text, and nothing overflows at 320 px. Two faults. The Japanese tour card does not say the tour is to be read. In French, `#words-women` says "Rien à cette adresse" for a page that exists in English (`j6-words-fr-notfound-phone.png`).

### J7. Without 3D, sight or hearing

- **Who, how:** an old phone, a screen reader, a deaf visitor on the tour.
- **Steps:** a piece with its still picture and text. Or `#words-women`.
- **Worked if** every journey can be finished on the pages alone, and the visitor is told so.

Walked: the pages hold up. axe found nothing on four routes, day and night. Without 3D a piece keeps its still and the Daylight switch still works on it. Faults:

1. The walk without 3D is a dead end: a still, one sentence, no word that every hall is also a page (`j7-nogl-walk-phone.png`). The tour speaks on over a still of hall 1.
2. `#words-women`, the page made for these visitors, is linked only from inside the walk.
3. With sound on, the guide's words are folded shut. Captions are on their way.

### J8. A teacher and a class

- **Who, how:** a teacher with a projector and thirty phones, planning one lesson.
- **Steps:** `#hall-5` projected, Daylight off, each student opens a piece and reads "Fails at".
- **Worked if** the lesson can be planned from one page and handed out on paper.

Walked: hall 5 at night is a lesson in one picture (`j8-hall5-night-desk.png`). Nothing else is there for a teacher. A label prints on four sheets, with the menu, the buttons and "Next" printed too (`j8-piece-print-sheet.png`). Night cannot be put in a link. About does not say who made the museum, when, or how its words may be reused. A correction needs a GitHub account.

## 3. The product as a whole

**First screen.** The opening sentence is exact. On a phone, five ways in follow it and no picture. The owner asked for "heavy emphasis on visuals".

**The way round.** Eight phrases lead into the same 3D building, from "Walk the museum" to "See it in its hall" to "Take the tour in the halls". "Start in hall 1" leads to a page instead. A new visitor cannot tell a hall from the walk until both are tried. The header never links to the walk or the tour, and on a phone not to People or About.

**Pages and walk.** Two museums joined by one link each way. In the walk a visitor sees a piece and its plate. The label is a page away. On a phone the way back costs a restart: Back shows the door of hall 1 and "Start the walk" while the line beneath says hall 3 (`j9-walk-phone-4-back.png`). The walk fetches 2.2 MB before it is live on a phone, 1.2 MB of it portraits for walls not yet reached.

**Links and search.** Hash routes cost one preview for all pages, one page for a search engine, and no language or night in an address.

**Speed.** Pages without 3D are light: Lighthouse mobile 97 to 98, main picture at about 2 s on a simulated slow phone. Keep this.

**What is measured.** Nothing about visitors: no cookie, no request to another host. Keep that too. Worth knowing: which door is taken at the entrance, how long the first model takes on real phones, where the tour is abandoned. Ways to learn it without tracking people: Search Console once pages have addresses, three real phones and a stopwatch, five people watched on J1 and J2, counts of events with no visitor attached.

**Cut.** Two of the four entrance buttons (the halls are offered three times there). The second telling of the building. "3D glasses" outside hall 7. Greyed buttons that cannot work yet.

## 4. What to do

### Now

1. **A picture and a name in every preview.** J4. Add `og:` tags and one picture to the page the server sends. Check: `curl` finds them. Small.
2. **Keep the visitor's place.** J1, J2, J5. Back returns to the same place in a list. The tour's address follows the stop on a phone. Back to the walk shows the hall that was left. Check: scroll to 1,700 px, open, go Back, expect 1,700. Reload at stop 6, expect stop 6. Small to middling.
3. **Say what is not there.** J5, J6, J7. Offline, a missing picture, language or recording says so. Without 3D, the walk points to the halls and the tour to its words. `#words-women` shows English where a language lacks it. A text tour says it is text. Check: a test finds each sentence. Small.
4. **Link what exists.** J2, J3, J7. `#words-women` from the tour card and People. Walk, People and About in the phone header. A piece names its trail. Jump links on a label. Check: the words page is one tap from the entrance. Small.
5. **Mend the sources.** J3. Replace five links. Check them weekly in CI. Small.
6. **Name the phone header.** J1. The switch says Daylight, and a hall's name can be read before its number is tapped. Check at 390 and 320 px. Small.

### Next

7. **An address the server can answer.** J3, J4. A static page per piece, hall and list, with its own title, picture and label text. Hash links keep working. Check: `curl` of a piece returns its lead sentence. Middling to large. Owner decides.
8. **A piece on a phone's first screen.** J1. One piece, the opening sentence, one main way in. Check: a loaded picture lies wholly inside the first screen. The look belongs to the design review. Small to middling.
9. **A short visit.** J1, J8. Three pieces that carry the argument, as a route with an end. Check: four of five people reach the third in three minutes. Small. Owner chooses the pieces.
10. **The label inside the walk.** J2. One tap at a piece shows its lead sentence and "What to look for", and the address still begins `#walk`. Middling.
11. **Finish the tour.** J2, J7. An end that leads on. Each stop shows what the guide names on an upright phone. The card gives the whole time. Check: twelve pictures, looked at. Middling.
12. **Paper and permission.** J8. Print rules. A line in About on who, when and reuse. Check: a label prints on two sheets, no buttons. Small to middling. Owner picks the licence.
13. **An Index that remembers.** J3, J5. A box for a name, filters in the address, the count in view on a phone. Check: one address opens 8 rows. Small to middling.
14. **A lighter walk.** J2. Portraits hall by hall. Check: under 1 MB before the walk is live. Small.

### Later

15. **The second visit.** J5. On the device only: pieces seen, the tour's last stop, what is new. Middling.
16. **A page for teachers.** J8. Three lessons with time, level and questions. Mostly writing.
17. **Deeper sources.** J3. First publications for the 28 labels, and a "last checked" date. Large.
18. **The whole museum offline.** J5. About 18 MB, and 6 MB for one tour. Middling.

### What I would not do

- Accounts, a newsletter box, a cookie banner, or analytics that follows a person.
- A tour that moves on by itself. The visitor is looking.
- Limits, people or sources behind tabs. Jump links are enough.
- New languages before the tour is told in the ten there are.
- Headset and room views. No journey depends on them.
- Dropping the pages for the walk. The pages are the fast, accessible museum.

### Decisions for the owner

| Decision | Choices |
|:---|:---|
| Addresses | Hash routes with one shared picture. A static page per piece (my choice). Path routes with a fallback page. |
| Measuring | Nothing on the site. A cookieless counter named in About. Own event counts. |
| Licence | CC BY. CC BY-SA, like most archive pictures. All rights reserved, with leave for classrooms. |
| Offline | What was seen, and say so. Or the whole museum on request. |
| "3D glasses" | Every piece, or hall 7 only. |
| Home-screen name | "Museum", or a name that says which. |

## Appendix A. Numbers

| What | Phone 390 x 844 | Desk 1440 x 900 |
|:---|:---|:---|
| Entrance: links and buttons on the first screen | 16 | 25 |
| Entrance: first picture | 1,090 px down (1.3 screens) | 580 px down (first screen) |
| Entrance: tour card | 295 of 844 px | 233 of 900 px |
| Taps from the entrance to a running piece | 2 | 2 |
| Hall 1: first picture after the tap | 0.65 s | 0.62 s |
| Piece: still picture after the tap | 0.17 s | 0.33 s |
| More script for the first model | 228 KB | 228 KB |
| Way on from a piece | fixed at the foot | 3.4 screens down, or the arrow keys |
| Back to the hall list | 1,774 px becomes 0 | 308 px becomes 0 |
| Label: "How it works", Sources | 3.2 and 4.1 screens down | Sources 3.1 screens down |
| Index: first row | 909 px, below the first screen | not measured |
| Walk before it is live | 2.2 MB, 87 requests | not measured |

The times come over a data centre line. They show order, not what a phone on a mobile network gets.

**Lighthouse, mobile, simulated slow phone:** entrance 98, hall 98, piece with its still 97, Index 98, People 98. Main picture at 1.8 to 2.1 s. Page weight 237 to 483 KB. Accessibility 100 on all five. One earlier run of the entrance gave 80 while the shared machine was overloaded.

**The walk on a phone, before it is live:** 60 portraits 1,216 KB, 13 cut-out pictures 483 KB, scripts 337 KB, fonts 106 KB.

**The eight phrases into the walk:** "Walk the museum", "Start the walk", "Walk this hall", "See it in its hall", "Take the guided tour", "Start the tour", "Take the tour in the halls", "Walk this trail".

**The tour:** 14 parts, 1,841 words, 12.8 minutes of speech in English. On a phone the address was `#tour-women` at stops 1, 3, 6 and the end. One Back closes the full view, and only then does the address name the stop.

**The reader's route:** the Index row for "Electrowetting display" is 2.8 screens down in A to Z. All source links open in the same tab.

**Sources:** 179 links, 65 of them Wikipedia. Failed from here:

- split-flap: adidesignmuseum.org, Cifra 5 clock (404)
- cholesteric-lcd: archive.aps.org/mar/2017/v29/4 (404)
- cathode-ray-tube: newatlas.com/go/5575 (410), the source for Elma Farnsworth
- scanned-laser: lux.spie.org (certificate does not match the host), the source for Elsa Garmire
- swept-volume: greggandjenny.com (host not found from here)

Twenty-one more answered 403, 429 or 503 to a script and need checking by hand.

**The tour by language:**

| Language | Tour |
|:---|:---|
| English | spoken, 13 minutes |
| Catalan, Spanish | spoken, 14 minutes |
| German, Portuguese, Japanese, Chinese | text |
| French, Korean, Esperanto | none, and `#words-women` is "not found" |

A browser set to Japanese, Catalan or Portuguese opens in that language. Italian opens in English. A browser set to Chinese for Taiwan gets simplified characters.

**Addresses that are nearly right:** `#piece-Nixie-Tube` and `#piece-nixie-tube/` are "Nothing at this address".

**Offline, with the service worker:** hall 2, not seen before, 4 of 10 pictures broken and 6 never loaded. Catalan asked for: the page stays English and "en" is stored as the choice. The tour's first recording: media error 4.

**Without 3D:** a piece shows "This browser could not start 3D graphics, so the picture stays still." The walk shows the same sentence and nothing else.

**Print:** no print rules in the stylesheet. A label is 4 sheets, the tour's words 7.

**Kept on the device:** `lights`, `lang`, `trail`, `guide-voice`. No cookie. No request to another host on eight pages.

**About:** no author, no date, no licence for the museum's own words. The README says none has been chosen.

## Appendix B. On its way: what each must get right

- **The blue line.** A piece must say which lines pass it. People needs a second filter, and each filter an address. A second tour card at the entrance would push the first picture on a phone a further 295 px down. The thirteen new lines need sources marked by kind.
- **Camera obscura and shadow play.** Returning visitors must be told they are new. The opening sentence counts from the data, but the README still says fifty. "Oldest first" and "Is it still made?" must cope with a piece from antiquity.
- **The installed app.** Live since 15:06 GMT. It must say what is on the device and what is not (J5). It opens at the entrance every time, and offers no way to send a link from inside it. An update must not throw a visitor out of the tour in the middle of a sentence.
- **Phone layouts.** Keep "Next" in reach. Name the switch. On its side, the picture and its controls must fit one screen: today the header takes 118 of 390 px and the picture is cut (`sizes-piece-side-en.png`).
- **More detail on the models.** Hold the weight: 228 KB for the first model, and less than today's 2.2 MB for the walk.
- **Captions.** Offered before the first sentence, not inside a fold. Kept between visits, as the voice is. They must not cover what the guide points at, and they must be there in a phone's full view.
- **The tour in more languages.** The card must say whether the tour is heard or read. A language without it must show the English and say so.

## Appendix C. Pictures

- `j1-entrance-phone.png`, `j1-entrance-desk.png`: the first screen.
- `nav-header-phone.png`: seven numbers and a switch with no word.
- `j1-hall1-phone.png`, `j1-piece-live-phone.png`, `j1-piece-night-phone.png`: the three-minute route.
- `j2-tour-phone-2-start-live.png`, `j2-tour-phone-3-stop1.png`, `j2-tour-phone-5-stop6.png`, `j2-tour-phone-6-end.png`, `j2-tour-phone-10-reload-from-full.png`: the tour on a phone.
- `j2-tour-desk-2-stop2.png`, `j2-tour-desk-4-sound-off.png`: the tour on a desk, with and without the voice.
- `j3-index-phone.png`, `j5-index-filtered-phone.png`, `j3-piece-sources-phone.png`: the reader and the maker.
- `j4-deeplink-phone-live.png`, `j4-notfound-phone.png`: the shared link.
- `j5-offline-hall2-phone.png`: offline.
- `j6-entrance-ja-phone.png`, `j6-langmenu-ja-phone.png`, `j6-words-fr-notfound-phone.png`: languages.
- `j7-nogl-walk-phone.png`, `j7-nogl-tour-phone.png`: without 3D.
- `j8-hall5-night-desk.png`, `j8-piece-print-sheet.png`, `j8-people-women-desk.png`: the classroom.
- `j9-walk-phone-3-oled.png`, `j9-walk-phone-4-back.png`: the walk, and coming back to it.

## Appendix D. What I could not check

- Speed of the models and the walk on a real phone. Headless Chrome draws 3D in software.
- Safari on an iPhone, and the app once it is on a home screen.
- The guide's voice by ear. I saw the player run and did not hear it.
- A screen reader speaking. I checked names, headings and axe.
- How the site appears in a search engine. A search for its name on 22 November did not return it.
- The 21 source links that refused a script.
- Headset and room views.
- The tour at stops other than 1, 2, 3, 6 and the end. Journeys on a tablet or a phone on its side, beyond pictures.
- The 3D, offline and no-3D findings on the build of 15:59 GMT. The shared machine was too loaded to walk them a second time.
- Print from a browser other than Chrome.
