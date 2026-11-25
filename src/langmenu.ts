import { esc } from './html';
import { langNow, offered, tx, type Lang, type LangInfo } from './i18n';

/**
 * The language menu: a plate in the header that names the language in use, and under it a directory of every
 * language the museum speaks. Each is listed under the name its own speakers give it, with its name in the
 * language now in use beside it, so a visitor can find theirs and can also tell what the others are.
 *
 * It is a button that opens a list of buttons. Tab walks through it as through anything else on the page, the
 * arrow keys move about in it, a letter jumps to the next language that begins with it and Escape shuts it.
 */

/** A globe: the one sign for "language" that needs no language to read. */
const GLOBE = '<svg class="lang__globe" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6.3"/><ellipse cx="8" cy="8" rx="2.7" ry="6.3"/><path d="M1.9 8h12.2"/></svg>';

/** The menu as it goes into the header, shut. Nothing at all where only one language is offered. */
export function langMenu(): string {
  const langs = offered(), now = langNow();
  if (langs.length < 2) return '';
  // what the browser calls each language in the language in use. Left out where it cannot say, or says the same
  let names: Intl.DisplayNames | undefined;
  try { names = new Intl.DisplayNames([now.tag], { type: 'language' }); } catch { names = undefined; }
  const here = (l: LangInfo): string => {
    let n = '';
    try { n = names?.of(l.tag) ?? ''; } catch { n = ''; }
    return n && n !== l.tag && n.toLocaleLowerCase(now.tag) !== l.name.toLocaleLowerCase(now.tag) ? n : '';
  };
  const row = (l: LangInfo) => {
    const other = here(l);
    return `<li><button type="button" class="lang__pick" data-lang="${l.code}"${l.code === now.code ? ' aria-current="true"' : ''}><span class="lang__own" lang="${l.tag}">${esc(l.name)}</span>${other ? `<span class="lang__other">${esc(other)}</span>` : ''}</button></li>`;
  };
  // the plate is named by what is written on it: "Language", which only a screen reader is told, then the name in
  // full, then its short form where the plate is too small for the name. On a phone the full name is still told
  const rows = Math.ceil(langs.length / 2);
  return `<div class="lang">
<button type="button" class="lang__now" id="lang" aria-expanded="false" aria-controls="lang-list">${GLOBE}<span class="vh">${tx('lang.label')}: </span><span class="lang__long" lang="${now.tag}">${esc(now.name)}</span>${now.short !== now.name ? `<span class="lang__short" lang="${now.tag}"> ${esc(now.short)}</span>` : ''}</button>
<div class="lang__list" id="lang-list" data-own-keys hidden><p class="lang__title" id="lang-title">${tx('lang.label')}</p><ul aria-labelledby="lang-title" style="--rows:${rows}">${langs.map(row).join('')}</ul></div>
</div>`;
}

/** Make the menu work, wherever on the page it is drawn and however often it is drawn again. `pick` is told the language chosen. */
export function wireLangMenu(pick: (code: Lang) => void): void {
  const parts = () => {
    const btn = document.getElementById('lang') as HTMLButtonElement | null, list = document.getElementById('lang-list');
    return btn && list ? { btn, list, picks: [...list.querySelectorAll<HTMLButtonElement>('[data-lang]')] } : undefined;
  };
  const isOpen = () => parts()?.btn.getAttribute('aria-expanded') === 'true';
  let typed = '', typedAt = 0;
  const set = (open: boolean, focus?: 'current' | 'button') => {
    const p = parts();
    if (!p) return;
    typed = '';
    p.list.hidden = !open;
    p.btn.setAttribute('aria-expanded', String(open));
    if (open && focus === 'current') (p.picks.find((b) => b.hasAttribute('aria-current')) ?? p.picks[0])?.focus();
    if (!open && focus === 'button') p.btn.focus();
  };
  document.addEventListener('click', (e) => {
    const el = e.target as Element, choice = el.closest<HTMLElement>('[data-lang]');
    if (choice) { set(false); if (!choice.hasAttribute('aria-current')) pick(choice.dataset.lang as Lang); else parts()?.btn.focus(); return; }
    if (el.closest('#lang')) return set(!isOpen());
    if (isOpen() && !el.closest('#lang-list')) set(false);
  });
  // the keyboard walking on past the last language, or back before the plate, shuts it behind itself
  document.addEventListener('focusin', (e) => { if (isOpen() && !(e.target as Element).closest('.lang')) set(false); });
  document.addEventListener('keydown', (e) => {
    const p = parts(), at = document.activeElement as HTMLElement | null;
    if (!p || !at?.closest('.lang') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') { if (isOpen()) { e.preventDefault(); set(false, 'button'); } return; }
    if (at === p.btn) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); set(true, 'current'); } return; }
    const i = p.picks.indexOf(at as HTMLButtonElement);
    if (i < 0) return;
    // the list runs down its first column and then down its second, so a step sideways is a column's worth of names
    const rows = Number(getComputedStyle(p.list.querySelector('ul')!).getPropertyValue('--rows')) || p.picks.length, last = p.picks.length - 1;
    const to = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowRight' ? i + rows : e.key === 'ArrowLeft' ? i - rows : e.key === 'Home' ? 0 : e.key === 'End' ? last : undefined;
    if (to !== undefined) { e.preventDefault(); if (to >= 0 && to <= last) p.picks[to].focus(); return; }
    if (e.key.length !== 1 || e.key === ' ') return;
    // letters typed close together spell the start of a name
    const now = performance.now();
    typed = typed && now - typedAt < 700 ? typed + e.key : e.key; typedAt = now;
    const want = typed.toLocaleLowerCase(), begins = (b: HTMLButtonElement) => [...b.querySelectorAll('span')].some((s) => (s.textContent ?? '').toLocaleLowerCase().startsWith(want));
    const next = [...p.picks.slice(i + (typed.length > 1 ? 0 : 1)), ...p.picks.slice(0, i + (typed.length > 1 ? 0 : 1))].find(begins);
    if (next) { e.preventDefault(); next.focus(); }
  });
}
