/**
 * Worksheets for a class: one per hall, at `teach/2/`, and a page that lists them, at `teach/`.
 *
 * Every question is asked of what the museum already says, and every answer is taken from it: the lead of the
 * piece, a line of its label, the first of its strengths and of its limits. So a worksheet is as right as the
 * labels are, in every language the labels are in, and nothing on it needs checking twice. The last question at
 * each piece is something to do in its 3D model, and has no answer.
 *
 * The same words are drawn by the museum and written into the page the server sends, so both pass the words of a
 * language in: `Words` is what each of them knows how to say.
 */
import type { Hall, Piece } from './data/schema';
import type { HallText, PieceText } from './i18n/types';
import { people, type Credit } from './data/people';
import { halls } from './data/halls';
import { inHall } from './data/pieces';

export interface Words {
  ui: (key: string, vars?: Record<string, string | number>) => string;
  piece: (p: Piece) => PieceText;
  hall: (h: Hall) => HallText;
  credit: (pieceId: string, c: Credit) => { did: string[] };
  /** The address of a place, from the museum's folder: `piece/nixie-tube/`. */
  href: (path: string) => string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** A text ending as a sentence does, in its own script: the strengths and limits of a piece are written without a full stop. */
const stop = (text: string) => (/[.!?。！？]$/u.test(text) ? text : /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]$/u.test(text) ? `${text}。` : `${text}.`);
/** The first sentence of a text, in any script. */
const first = (text: string) => (/^.+?[.!?。！？](?=\s|$)/u.exec(text)?.[0] ?? text).trim();

/** The person a question asks about: the first on the label who is not an aside, with what the label says they did. */
function asked(p: Piece, w: Words): { name: string; did: string } | undefined {
  const c = people[p.id];
  if (!c) return undefined;
  const i = c.people.findIndex((e) => !e.aside && e.did);
  if (i < 0) return undefined;
  return { name: c.people[i].who.join(' and '), did: w.credit(p.id, c).did[i] };
}

/** The worksheet of a hall: the questions, piece by piece, and the answers on a page of their own. */
export function worksheet(hallId: number, w: Words): string {
  const hall = halls.find((h) => h.id === hallId)!, them = inHall(hallId);
  const questions = them.map((p) => {
    const x = w.piece(p), who = asked(p, w);
    return `<section class="ws__piece">
<h2><a href="${w.href(`piece/${p.id}/`)}">${esc(x.name)}</a></h2>
<ol>
<li>${esc(w.ui('teach.q.how', { name: x.name }))}</li>
${who ? `<li>${esc(w.ui('teach.q.who', { name: who.name }))}</li>` : ''}
<li>${esc(w.ui('teach.q.trade', { name: x.name }))}</li>
<li class="ws__try">${esc(w.ui('teach.q.try'))} ${esc(first(x.look))}</li>
</ol>
</section>`;
  }).join('\n');
  const answers = them.map((p) => {
    const x = w.piece(p), who = asked(p, w);
    return `<section class="ws__piece">
<h3>${esc(x.name)}</h3>
<ol>
<li>${esc(x.lead)}</li>
${who ? `<li>${esc(who.did)}</li>` : ''}
<li>${esc(stop(x.good[0]))} ${esc(w.ui('teach.but'))} ${esc(stop(x.bad[0]))}</li>
</ol>
</section>`;
  }).join('\n');
  return `<div class="ws">
<h1>${esc(w.ui('teach.title', { n: hall.id, name: w.hall(hall).name }))}</h1>
<p class="ws__lead">${esc(w.ui('teach.lead', { n: them.length }))}</p>
<p class="ws__keys"><a href="${w.href(`hall/${hall.id}/`)}">${esc(w.ui('teach.hall'))}</a> <a href="${w.href('teach/')}">${esc(w.ui('teach.all'))}</a></p>
<p class="ws__name">${esc(w.ui('teach.name'))} ____________________</p>
${questions}
<div class="ws__answers">
<h2>${esc(w.ui('teach.answers'))}</h2>
<p>${esc(w.ui('teach.source'))}</p>
${answers}
</div>
</div>`;
}

/** The page that lists the worksheets, one for each hall. */
export function sheets(w: Words): string {
  return `<div class="ws">
<h1>${esc(w.ui('teach.head'))}</h1>
<p class="ws__lead">${esc(w.ui('teach.says'))}</p>
<ul class="ws__halls">${halls.map((h) => `<li><a href="${w.href(`teach/${h.id}/`)}">${esc(w.ui('teach.title', { n: h.id, name: w.hall(h).name }))}</a>, ${esc(w.ui('teach.count', { n: inHall(h.id).length }))}</li>`).join('')}</ul>
</div>`;
}
