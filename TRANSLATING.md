# Translating the museum

The museum is written in English and translated by hand. Every other language is one file
in `po/`, in the gettext PO format. Each entry looks like this:

```po
#: hall-1/split-flap
#. Button that moves the visitor to a place in the 3D model. At most 28 characters.
msgctxt "piece.split-flap.view.hall.label"
msgid "Wait on the concourse"
msgstr "Espera en el vestíbulo"
```

`msgid` is the English. `msgstr` is yours. The line that starts with `#.` says what the
sentence is and where it shows. Leave `msgctxt` and `msgid` as they are.

## Fix or improve a sentence

1. Open the file of the language: `po/es.po`, `po/ja.po` and so on. You can do it on
   GitHub with the pencil button, in [Poedit](https://poedit.net), which is free, or in
   any text editor.
2. Find the sentence and change its `msgstr`.
3. Send a pull request. A check runs on it and says if something does not fit.

## Start a new language

1. Copy `po/museum.pot` to `po/<code>.po`. Use the usual code of the language: `it`, `nl`,
   `pt_BR`.
2. Translate. You do not have to finish. A file that is partly done is welcome, and
   someone else can carry on from it.
3. Send a pull request. When the interface and the labels are done, a maintainer names the
   file in `po/LINGUAS` and gives the language a line in `src/i18n/types.ts`, and it goes
   on the site.

## What to keep in mind

- **Curly brackets.** `{n}`, `{name}` and pairs like `{a}words{/a}` are filled in by the
  site. Keep them, and move them to where your sentence needs them.
- **Length.** A button has room for 28 characters and the name of a hall for 16. The note
  above the entry says so.
- **Figures.** Every date and number of the English should be in your sentence. Write it
  the way your language does: `10.197`, `1,3 millones`, `1.3亿`.
- **Voice.** A museum label: plain words, short sentences, no selling. Speak to the
  visitor directly where the English does.
- **Buttons named in a text.** The entries called "What to look for" sometimes name a
  button. Use the same words you gave that button.
- **Names.** People keep the spelling of the English label, unless your language has a
  firm custom of its own for them. Product names and titles of works stay as they are.
- **Dashes.** The site uses no em dashes and no double hyphens. Use a comma, a colon or a
  new sentence.
- **Counting.** One entry, `ui.count.pieces`, has a line for each form your language has
  for a number: `msgstr[0]`, `msgstr[1]` and so on.
- **Fuzzy.** An entry marked `#, fuzzy` had its English changed after it was translated.
  The old English stands above it after `#|`. Check the translation and remove the mark.
- **Notes for the next translator.** The comment at the top of each file holds the choices
  made for that language, such as the word used for a hall or a piece. Add yours.

## See it before you send it

```sh
npm ci
I18N_DRAFTS=1 npm run dev     # also builds the PO files that are not on the site yet
npm run check                 # the same check that runs on a pull request
```

A language shows in the menu only if it has a line in `src/i18n/types.ts`. For a new one,
add its code to the `Lang` type and a line to `LANGS` there.

## For maintainers

- After a change to the English, run `npm run i18n:sync`. It writes `po/museum.pot` again
  and brings every PO file up to date. Sentences whose English changed are marked fuzzy.
- `po/LINGUAS` names the files that are built into the site.
- The layout, one PO file to a language beside one POT file, is the one that Weblate,
  Crowdin and Transifex read. None of them is connected yet.
