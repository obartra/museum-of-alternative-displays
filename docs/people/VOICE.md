# The museum's voice for people

Every person named on a label has a page (`person/<name>/`). The page always shows the lines the museum has on
them, the pieces those lines belong to, and the sources. Where an account of the person has been written
(`src/data/person-bios.ts`), it stands at the top. This page sets down how such an account is written, so that
143 of them read as one museum speaking.

## What an account is

Two to four short paragraphs. Who the person was, where they worked, what they did that bears on the piece, and
what became of them or of the work. Years of birth and death go in the `born` and `died` fields, not in the prose.

## The rules, and why

1. **Only what a listed source says.** Each account carries its sources, and at least one of them is not an
   encyclopedia. If two sources disagree, say so or leave the point out.
2. **Facts, not praise.** No "pioneer", "legendary", "visionary", "father of", "famous", "brilliant". A label that
   praises tells the visitor what to think and gives them nothing to check.
3. **A first needs a witness.** "First", "earliest" and "invented" appear only with who says so: "The Science
   Museum Group credits him with the first…". Priority is the thing most often wrong in the history of displays.
4. **Past tense, plain statements.** No questions, exclamations or semicolons. No dashes.
5. **Short.** Under 45 words a paragraph. One fact a sentence where it can be done.
6. **Names in full once**, then the family name or "he", "she", "they" as the source has it. Institutions by the
   name they had at the time.
7. **Nothing about a person's private life** that does not bear on the work. Nothing about race, religion or
   health unless the person or a cited source makes it part of the story the museum is telling, as the guided
   tours do.
8. **The label line is not repeated.** The account adds to the line on the piece. It does not restate it.

`npm run check` enforces 1 to 5 mechanically (`scripts/validate.ts`). Rules 6 to 8 are for the curator's reading.

Two allowances, both for want of a better way to say a true thing. The post a living person holds today may stand
in the present tense. And where the year of a person's death is known but the year of birth is not, the death is
given in the prose, since the plate shows the two years only as a pair.

## The curator's reading

After a batch of accounts is written, all of them are read together, old and new, against this page, and
`CURATOR.md` records the date, what was read and what was changed. The reading looks for what a machine cannot:
two accounts that tell one event differently, a sentence that claims more than its source, a change of tone.

## When sources disagree

This holds for the label of a piece as much as for the account of a person. Where reliable sources give different
dates, or one bare year would hide which event is meant, the museum shows it the way a museum label does, in the
piece's `yearText`:

- **about 1968**, where the date is not established.
- **the 1970s**, where the sources agree on no single year: an interview with the inventor of Gyricon gives 1974,
  and MIT Technology Review has him joining the laboratory in 1975.
- **1957 to 1959**, where two records date one thing differently. The line of origin then says that the sources
  differ, and both are listed.
- **first flown 1958, in service 1961** and **1963 in an oscilloscope, 1968 as a display**, where two events are
  both the answer and a visitor should know which is which.

The year used to sort the pieces (`year`) stays a single number. Nothing is settled by choosing the source one
likes better.

## Whose deed it is, and care in telling it

Added on 22 November 2026, after the adversarial review recorded in `CURATOR.md`. These rules hold for a label line
as much as for an account.

- **A shared deed is told the same way wherever it is told.** Co-inventors, co-authors and co-founders get the same
  verb in every account. No account gives its own subject the larger part unless a source does. Where priority was
  disputed, each account names the witness for its own claim and says that the other side claimed it too.
- **The person who did the work is the subject of the sentence.** Not the group, the supervisor, the employer or the
  husband. "Was built in his group" hides the builder. A woman is not introduced through a marriage. Work is not
  called help, assistance or support unless the source calls it that, and then the source is named.
- **Emphasis is substance.** Where a source records a barrier, an exclusion, a credit withheld or the community a
  thing was made for, the account says so plainly and names the source. It adds no adjective. Praise words stay
  out for everyone, by the same rule.
- **No identity without a source.** The museum states nobody's race, ethnicity, religion, nationality, disability,
  sexuality or gender identity unless a cited source states it, and never infers one from a name, a face or a
  place. A birthplace is given where a reliable source gives it, and left out where none does. A "first" of
  identity needs its witness like any other first.
- **Nothing private about the living.** Health, family and belief stay out unless they bear on the work and the
  person has made them public.
- **Names as their bearers write them.** Marks and hyphens are kept for every language alike. A name from outside
  Europe is not given in a colonial or a Latinised form where the person or the scholarship uses another. Where the
  sources themselves spell a name two ways, the account says so once.
- **One institution, one name**, as the cited source gives it for that date. A place keeps its own name: Leuven.
- **A reader abroad.** A war is named in full on first mention. Distances are in kilometres. A place a reader could
  mistake gets its city or country. An abbreviation is spelled out or left out.
- **Counts.** No counts of papers or of scholarly citations. A count of patents a person held may stand where a
  source gives it.
- **The plate.** Years go on the plate where a source gives them. Where every source says "about", or two reliable
  sources give different years, the plate stays empty and the prose or the label says what is known.
