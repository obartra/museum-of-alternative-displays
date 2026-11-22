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
