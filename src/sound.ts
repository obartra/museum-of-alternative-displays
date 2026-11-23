import type { Sound } from './data/sounds';
import { esc } from './html';
import { rich, tx } from './i18n';

/**
 * The sound of the machine, on the page of a piece: a key for each recording, which plays it and stops it again.
 * One plays at a time, and leaving the page stops it. Under each key, who made the recording and under what licence.
 */
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6z"/></svg>';
const stem = (file: string) => file.replace(/\.[a-z0-9]+$/, '');

export const soundSection = (list: Sound[] | undefined): string => !list?.length ? '' : `
<section class="sound stack" style="--gap: 10px"><h2 class="h-sec">${tx('piece.sound')}</h2><ul class="sound__list">${list.map((s) => `
  <li><button type="button" class="btn sound__key" data-sound="${esc(s.file)}" aria-pressed="false"><span class="sound__sign">${PLAY}${STOP}</span><span>${tx(`sound.${stem(s.file)}` as Parameters<typeof tx>[0])}</span><small>${s.seconds} s</small></button>
  <p class="small muted">${rich('piece.sound.credit', { a: s.url }, { title: s.title, by: s.by, licence: s.licence })}</p></li>`).join('')}
</ul></section>`;

/** Make the keys of a page play. Returns how to stop and let go of them. */
export function wireSounds(root: HTMLElement): () => void {
  let audio: HTMLAudioElement | null = null, on: HTMLButtonElement | null = null;
  const stop = () => {
    audio?.pause(); audio = null;
    on?.setAttribute('aria-pressed', 'false'); on = null;
  };
  const onClick = (e: MouseEvent) => {
    const key = (e.target as Element).closest<HTMLButtonElement>('[data-sound]');
    if (!key || !root.contains(key)) return;
    const again = key === on;
    stop();
    if (again) return;
    const a = new Audio();
    a.addEventListener('ended', () => { if (audio === a) stop(); });
    a.addEventListener('error', () => { if (audio === a) stop(); });
    audio = a; on = key;
    key.setAttribute('aria-pressed', 'true');
    void kept(`./sounds/${key.dataset.sound}`).then((src) => { if (audio !== a) return; a.src = src; return a.play(); }).catch(() => { if (audio === a) stop(); });
  };
  root.addEventListener('click', onClick);
  return () => { stop(); root.removeEventListener('click', onClick); };
}

/**
 * A machine's sound, from the copy kept on this device if there is one. A sound heard once is kept, so that it plays
 * again without a connection; the button that keeps the museum's pictures for offline keeps these as well.
 */
async function kept(path: string): Promise<string> {
  const url = new URL(path, document.baseURI).href;
  if (!('caches' in window)) return url;
  try {
    const store = await caches.open(`museum ${new URL('./', document.baseURI).pathname} sound`);
    let got = await caches.match(url);
    if (!got) { const fresh = await fetch(url); if (!fresh.ok) return url; await store.put(url, fresh.clone()); got = fresh; }
    return URL.createObjectURL(await got.blob());
  } catch { return url; }
}
