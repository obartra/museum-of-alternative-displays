# Waiting

This folder holds what is settled and not yet on the site. The recordings of a guided tour belong to the words and to the voice they were made with, and the site offers a recording only beside those very words. So new words for a language that has recordings wait here, as a PO file, until the tour is recorded again.

Nothing waits at the moment. The Spanish of the tour "Women in the museum", as an older Argentine guide says it, waited here until 22 November 2026 and is on the site now.

## Putting waiting words on the site

Do these in one go, because between the first step and the end of the recording the tour has no sound in that language.

1. `npx tsx scripts/i18n.ts merge <code> tour/waiting/<code>.po`, then `npm run check`. A sentence whose English has changed since it was written is left alone and named: write it again first.
2. In `tour/voices.json`, move the ids of the voices that are to be used from `waiting` up to `voices`.
3. Commit and push. Run the workflow **Tour audio** with "Say how many characters it would send", and then with "Record what is missing or out of date".
4. Delete from this folder what has been put on the site.
