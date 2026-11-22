# Waiting

What is in this folder is settled and not yet on the site. The recordings of a guided tour belong to the words and to the voice they were made with, and the site offers a recording only beside those very words. So new words for a language that has recordings wait here until the tour is recorded again.

- `es.po`: the Spanish of the tour "Women in the museum" as an older Argentine guide says it, 38 sentences. It is written for the Spanish voice that waits in `../voices.json`. The guide says "vos" to the visitor and uses the everyday words of Buenos Aires where Spain has others (piso, acá, lamparita, video, tungsteno). The names of the pieces and of the halls are the ones on the labels, and the facts and their order are unchanged. The rest of the site keeps the Spanish it has, and the language is still called Español.

## Putting it on the site

Do these in one go, because between the first step and the end of the recording the tour has no sound in that language.

1. `npx tsx scripts/i18n.ts merge es tour/waiting/es.po`, then `npm run check`. A sentence whose English has changed since it was written is left alone and named: write it again first.
2. In `tour/voices.json`, move the ids of the voices that are to be used from `waiting` up to `voices`.
3. Commit and push. Run the workflow **Tour audio** with "Say how many characters it would send", and then with "Record what is missing or out of date".
4. Delete from this folder what has been put on the site.
