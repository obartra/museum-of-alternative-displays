import { people } from './data/people';
import { bios, personSources } from './data/person-bios';
import { personLinks } from './data/person-links';
import { personByName, personBySlug } from './data/persons';
import { pieceById } from './data/pieces';
import { portraits } from './data/portraits';
import { esc } from './html';
import { link } from './place';
import { elsewhereItem, lifeOf, portraitCredit, sourceItems } from './profile';
import { said, standIn, tx } from './i18n';

/**
 * The people of a piece, in the walk. A plate in a corner of the picture names them, with a face where the museum
 * has a portrait. Each name is a key that opens the museum's own profile of that person on a sheet over the
 * picture: their portrait, their years, what the label of this piece says of them, the account the museum has
 * written, its sources, and the one place outside the museum where more is written. From the sheet the visitor
 * goes on to the person's full page, or closes it and is back where they stood. A guide who is speaking goes on.
 *
 * Nothing on the plate leads out of the museum. The links to other sites are on the sheet, with the profile.
 */
export interface WhoOptions {
  /** The sheet has opened. */
  onOpen(): void;
  /** The visitor has closed the sheet, by its key, by Escape or by a tap beside it. */
  onClose(): void;
}
export interface Who {
  /** Name the people of a piece on the plate, or with no piece take the plate down. `trail` is the colour of a tour. */
  show(piece: string, names: string[], trail?: string): void;
  /** The sheet is open. */
  readonly open: boolean;
  /** Close the sheet. `quiet` leaves the focus where it is and does not count as the visitor closing it. */
  shut(quiet?: boolean): void;
  close(): void;
}

/** The plate shows this many people at most. The others are counted, and the count opens the list of all of them. */
const FEW = 4;
const CROSS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 4.6L12 10.2l5.6-5.6 1.8 1.8-5.6 5.6 5.6 5.6-1.8 1.8-5.6-5.6-5.6 5.6-1.8-1.8 5.6-5.6-5.6-5.6z"/></svg>';
const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 5L3.5 12l7 7v-4.6h10V9.6h-10z"/></svg>';

/** The first letters of the first and the last word of a name: Greg Dawe is GD, Mozi is M. */
const initials = (name: string): string => {
  const words = name.replace(/[.,]/g, ' ').split(/\s+/).filter((w) => /\p{L}/u.test(w));
  const first = words[0]?.[0] ?? '', last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
};

/** The people of the label of a piece, each once and in the label's order, without those of a line set aside. */
export const labelPeople = (piece: string): string[] =>
  [...new Set((people[piece]?.people ?? []).filter((e) => !e.aside).flatMap((e) => e.who))];

/** A link to another site opens beside the walk, so that the hall and a guide who is speaking stay where they are. */
const beside = (html: string) => html.replace(/ rel="noopener"/g, ' rel="noopener" target="_blank"');

export function openWho(card: HTMLElement, sheet: HTMLDialogElement, o: WhoOptions): Who {
  let piece = '', names: string[] = [], drawn = '';
  /** What the sheet shows: the list of all the people, or one person, and whether that person was chosen from the list. */
  let opener: HTMLElement | null = null, fromList = false, current = '', overflow = '';

  const face = (name: string) => {
    const who = personByName(name), pic = portraits[name];
    // a face where the museum has a portrait, the initials where it has none. The name is there for a screen
    // reader, and under the pointer
    const inner = `${pic ? `<img src="./people/${esc(pic.file)}" alt="" width="84" height="105" decoding="async">` : `<i class="walk__ini" aria-hidden="true">${esc(initials(name))}</i>`}<span>${esc(name)}</span>`;
    return who ? `<button type="button" class="walk__face" data-who="${who.slug}" aria-haspopup="dialog" title="${esc(name)}">${inner}</button>` : `<span class="walk__face" title="${esc(name)}">${inner}</span>`;
  };

  const bar = (back: boolean) => `<div class="sheet__bar">${back ? `<button type="button" class="btn sheet__back" data-sheet="list">${BACK}<span>${tx('walk.who.back')}</span></button>` : ''}<button type="button" class="walk__key sheet__close" data-sheet="close" aria-label="${tx('stage.close')}" title="${tx('stage.close')}">${CROSS}</button></div>`;

  /** All the people of the piece, each a key to their profile. */
  const listHtml = () => {
    const p = pieceById(piece)!;
    const rows = names.map((name) => {
      const who = personByName(name), pic = portraits[name], life = lifeOf(bios[name]);
      const inner = `${pic ? `<img src="./people/${esc(pic.file)}" alt="" width="84" height="105" loading="lazy" decoding="async">` : '<i aria-hidden="true"></i>'}<span><b>${esc(name)}</b>${life ? `<small>${life}</small>` : ''}</span>`;
      return `<li>${who ? `<button type="button" class="sheet__person" data-who="${who.slug}">${inner}</button>` : `<span class="sheet__person">${inner}</span>`}</li>`;
    }).join('');
    return `${bar(false)}<div class="sheet__body" data-hall="${p.hall}"><h2 class="sheet__title" id="walk-sheet-title" tabindex="-1">${tx('walk.who')}</h2><p class="sheet__piece"><b class="walk__no" aria-hidden="true">${p.hall}</b><span>${esc(said.piece(p).name)}</span></p><ul class="sheet__list">${rows}</ul></div>`;
  };

  /** The profile of one person, as their own page gives it, with what the label of this piece says of them. */
  const personHtml = (slug: string) => {
    const who = personBySlug(slug)!, p = pieceById(piece)!, credit = people[piece];
    const bio = bios[who.name], out = personLinks[who.name], pic = portraits[who.name], life = lifeOf(bio);
    const did = credit ? said.credit(piece, credit).did : [];
    const lines = credit ? credit.people.map((e, k) => (e.who.includes(who.name) ? did[k] : '')).filter(Boolean) : [];
    // the account in the language in use or, where it is not translated yet, in English and marked as English
    const about = bio ? said.bio(who.slug, bio.about) : [], english = bio ? standIn.bio(who.slug, bio.about) : '';
    const sources = personSources(who);
    return `${bar(fromList)}<div class="sheet__body" data-hall="${p.hall}">
  ${pic ? `<figure class="pers__fig sheet__fig"><div class="pers__wall"><img class="pers__portrait" src="./people/${esc(pic.file)}" alt="${esc(who.name)}" decoding="async"></div><figcaption class="pers__credit">${beside(portraitCredit(who.name))}</figcaption></figure>` : ''}
  <h2 class="plate sheet__plate" id="walk-sheet-title" tabindex="-1"><span class="plate__title">${esc(who.name)}</span>${life ? `<span class="plate__sub">${life}</span>` : ''}</h2>
  ${lines.length ? `<section class="sheet__here"><h3 class="sheet__piece"><b class="walk__no" aria-hidden="true">${p.hall}</b><span>${esc(said.piece(p).name)}</span></h3>${lines.map((line) => `<p${standIn.people(piece)}>${esc(line)}</p>`).join('')}</section>` : ''}
  ${about.length ? `<div class="sheet__about"><p class="lead pers__lead"${english}>${esc(about[0])}</p>${about.length > 1 ? `<div class="prose"${english}>${about.slice(1).map((line) => `<p>${esc(line)}</p>`).join('')}</div>` : ''}</div>` : ''}
  ${sources.length ? `<section class="pers__sec"><h3 class="h-sec">${tx('piece.sources')}</h3><ol class="sources">${beside(sourceItems(sources))}</ol></section>` : ''}
  ${out ? `<section class="pers__sec"><h3 class="h-sec">${tx('person.elsewhere')}</h3><ol class="sources">${beside(elsewhereItem(out))}</ol></section>` : ''}
  <p class="sheet__page"><a class="btn btn--go" href="${link(`person-${who.slug}`)}">${tx('walk.who.page')}</a></p>
</div>`;
  };

  /** Show the list or a person on the sheet, opening it if it is shut, and put the focus on what it now shows. */
  const view = (what: string, focus?: string) => {
    current = what;
    sheet.innerHTML = what === '' ? listHtml() : personHtml(what);
    sheet.dataset.hall = String(pieceById(piece)!.hall);
    if (!sheet.open) {
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      sheet.showModal();
      o.onOpen();
    }
    const to = focus ? sheet.querySelector<HTMLElement>(`[data-who="${focus}"]`) : null;
    (to ?? sheet.querySelector<HTMLElement>('#walk-sheet-title'))?.focus({ preventScroll: true });
    sheet.querySelector('.sheet__body')?.scrollTo(0, 0);
  };

  let quietly = false;
  const shut = (quiet = false) => {
    if (!sheet.open) return;
    quietly = quiet;
    sheet.close();
  };
  const onClosed = () => {
    document.body.style.overflow = overflow;
    const quiet = quietly;
    quietly = false;
    sheet.innerHTML = '';
    if (quiet) return;
    o.onClose();
    // back to the key that opened the sheet or, where the plate has changed meanwhile, to the plate
    const back = opener?.isConnected && !card.hidden ? opener : card.querySelector<HTMLElement>('button');
    back?.focus({ preventScroll: true });
  };

  const onCard = (e: MouseEvent) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-who], [data-who-all]');
    if (!el || !piece) return;
    opener = el;
    fromList = false;
    view(el.dataset.who ?? '');
  };
  const onSheet = (e: MouseEvent) => {
    // a tap on the dim ground beside the sheet closes it
    if (e.target === sheet) return shut();
    const el = (e.target as Element).closest<HTMLElement>('[data-sheet], [data-who]');
    if (!el) return;
    if (el.dataset.sheet === 'close') return shut();
    if (el.dataset.sheet === 'list') { fromList = false; return view('', current); }
    if (el.dataset.who) { fromList = true; view(el.dataset.who); }
  };
  // Escape closes the dialog by itself: it goes through the same door as the key
  const onCancel = (e: Event) => { e.preventDefault(); shut(); };

  card.addEventListener('click', onCard);
  sheet.addEventListener('click', onSheet);
  sheet.addEventListener('cancel', onCancel);
  sheet.addEventListener('close', onClosed);

  return {
    show(id, list, trail) {
      const key = `${id}|${list.join('|')}|${trail ?? ''}`;
      if (key === drawn) return;
      drawn = key;
      piece = id && list.length ? id : '';
      names = piece ? list : [];
      card.hidden = !piece;
      // the edge of the plate: the colour of the tour, or off a tour the colour of the piece's hall
      card.style.setProperty('--trail', trail ?? 'var(--hall)');
      const few = names.length > FEW ? names.slice(0, FEW) : names, rest = names.length - few.length;
      card.classList.toggle('walk__who--many', few.length + (rest ? 1 : 0) > 2);
      card.innerHTML = few.map(face).join('') + (rest ? `<button type="button" class="walk__face walk__more" data-who-all aria-haspopup="dialog" title="${tx('walk.who.more', { n: rest })}"><b aria-hidden="true">+${rest}</b><span>${tx('walk.who.more', { n: rest })}</span></button>` : '');
      if (piece) card.dataset.hall = String(pieceById(piece)!.hall); else delete card.dataset.hall;
    },
    get open() { return sheet.open; },
    shut,
    close() {
      shut(true);
      card.removeEventListener('click', onCard);
      sheet.removeEventListener('click', onSheet);
      sheet.removeEventListener('cancel', onCancel);
      sheet.removeEventListener('close', onClosed);
      card.hidden = true; card.innerHTML = '';
    },
  };
}
