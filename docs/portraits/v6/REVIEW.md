# Review of the round 6 portraits

Written on 22 November 2026, after pull request 4 was merged. It covers the 42 drawings that round added:
8 drawings after a picture, 19 studies from two or more pages and 15 studies from a single page.

## What was looked at, and what was not

Looked at: every one of the 42 drawings, at full size and at the size a label shows it. Their pixel sizes
and the `small` mark on each. Their entries in `src/data/portraits.ts` against the entries that were there
before. The People page and a label on a phone and on a desk: all 128 portraits load, all 143 names are
links, nothing overflows, no errors. `npm run check`, the build and `npm run crawl` pass.

Not looked at: the 42 source pages. They could not be opened from the session that wrote this, so who each
drawing shows rests on the records in this folder. And no drawing was compared with a photograph of its
sitter: this review says nothing about likeness. It is about the drawing as a drawing, the set as a set,
and the records.

## The set

1. **The label-size drawings are soft on a phone.** The 22 new drawings marked `small` are 84 by 105
   pixels. A label shows a portrait 72 by 90 CSS pixels, which is 216 by 270 real pixels on a current
   phone. Twelve of the sixteen earlier `small` drawings are 168 by 210. Please export label-size drawings
   at 168 by 210 at least. They can stay off the walls of the walk as they are now.

2. **Two hands.** The 600 by 750 drawings are pen work with clear hatching. The 84 by 105 ones read as
   soft pencil. Some of that is the size. After a larger export, check that the hatching is still there.

3. **How dark the line is.** Albert Brown and Louis Heynick are much paler than the rest, close to an
   outline. Gregg Favalora, James Bryce and Robert H. Anderson have faces with almost no modelling, so they
   look unfinished beside Stephen Benton or Nasser Peyghambarian. Bring these five to the tonal range of the
   others.

4. **One sweater for nearly everyone.** Most studies wear the same dark crew-neck. As a mark of a study
   that is fine. But it puts people of another time into present-day dress: James Bryce of the Mark I team,
   Marie Van Brittan Brown, Guillermo González Camarena. A plain garment of the sitter's own decade would
   sit better, as Lewis Latimer has.

5. **Room above the head.** In Kenneth Shoulders and Marie Van Brittan Brown the hair touches or is cut by
   the top edge. The others leave air there.

## Single drawings

- **David Hagelbarger** is drawn from the side and behind: mostly hair and an ear. At label size it does
  not read as a portrait. A front or three-quarter view if a reference allows one, or leave him pending.
- **B. K. Sadashiva** has his head bowed and his eyes lowered. **Henri Rivière** looks down in profile.
  Eyes that can be seen would be better, as was said of Comiskey, Albert and Jacobson in round 5.
- **Hank Willis Thomas**: the two eyes look in different directions.
- **Robert Hayes**: a long neck, a narrow face and heavy spectacles. Beside the others it reads as a
  caricature.
- **Gemma Frisius** carries a great deal of costume ornament for 72 by 90 pixels. It holds, but only just.
- The eight drawings after a picture (Barbaro, Séraphin, Frisius, Kepler, Latimer, Hammond, Bao,
  DeLongchamp) are the strongest of the round.

## The records

- **Akintunde Akinwande.** `entries.json`, `inventory.json`, `manifest.json` (twice) and `CREDITS.md`
  credit the page at cis.mit.edu to the "MIT Center for Integrated Circuits and Systems". That address is
  the MIT Center for International Studies, and the source on his label says so. `src/data/portraits.ts`
  has been put right on main. The records here have not, because `SHA256SUMS.txt` covers them.
- **Dean DeLongchamp** is entered as a drawing after a picture, with the licence "NIST public-information
  reuse policy". The rule for that kind is a picture in the public domain or under an open licence. Either
  record what the page itself says about that photograph, or enter him as a study.
- **Charles Spindt.** His name now links to the member profile of a retirees' club. The page of SRI
  International on the Spindt cathode, already a source of his portrait, is about his work and suits a
  name link better.
- **Fifteen studies rest on a single page.** That is within the rule as it now reads, and it was so in
  round 5. It is also where a study comes closest to following one photograph, which the rule says a study
  does not do. Worth a second page wherever one exists.
- The entries added to `src/data/portraits.ts` quote their keys and drop the spaces the file uses
  elsewhere. Harmless, and easy to bring in line the next time the file is written.
