/**
 * Worksheets for a class: one per hall, at `teach/2/`, and a page that lists them, at `teach/`.
 *
 * A teacher chooses three or four displays of the hall (`?p=nixie-tube,plasma-panel`), and the sheet asks of each:
 * how it makes its picture, what to notice from one of its views in the 3D model, and who is named on its label and
 * how we know. Then it asks the class to compare the displays chosen (a grid of three facts, an order by year, a
 * sort by how each makes light) and ends on one open question for the hall.
 *
 * Every answer in the key is taken from what the museum already says, so a sheet is as right as the labels are, in
 * every language the labels are in. Where more than one answer is right, the key says so.
 *
 * The museum draws a sheet, and the page the server sends carries the same words, so both pass the words of a
 * language in: `Words` is what each of them knows how to say.
 */
import qrcode from 'qrcode-generator';
import type { Hall, Need, Piece, Principle, SourceKind, Status } from './data/schema';
import type { HallText, PieceText, ViewText } from './i18n/types';
import { people, type Credit } from './data/people';
import { halls } from './data/halls';
import { inHall } from './data/pieces';
import { views, type ViewInfo } from './data/views';

export interface Words {
  ui: (key: string, vars?: Record<string, string | number>) => string;
  piece: (p: Piece) => PieceText;
  hall: (h: Hall) => HallText;
  credit: (pieceId: string, c: Credit) => { did: string[] };
  view: (pieceId: string, v: ViewInfo) => ViewText;
  principle: (p: Principle) => string;
  kind: (k: SourceKind) => string;
  /** The address of a place, from the museum's folder: `piece/nixie-tube/`. */
  href: (path: string) => string;
  /** The same, whole, for a QR code on paper. */
  full: (path: string) => string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** The first sentence of a text, in any script. */
const first = (text: string) => (/^.+?[.!?。！？](?=\s|$)/u.exec(text)?.[0] ?? text).trim();

/** How many displays a sheet asks about unless the teacher says otherwise. */
const SOME = 4;

/** The displays of a hall a sheet asks about: those named, in the hall's order, or the first few. */
export function chosen(hallId: number, ids?: string[]): Piece[] {
  const all = inHall(hallId), named = ids?.length ? all.filter((p) => ids.includes(p.id)) : [];
  return named.length ? named : all.slice(0, SOME);
}

/** The person a question asks about: the first named in the first line of the label that is not an aside, with what that line says. */
function asked(p: Piece, w: Words): { name: string; did: string } | undefined {
  const c = people[p.id];
  if (!c) return undefined;
  const i = c.people.findIndex((e) => !e.aside && e.did);
  return i < 0 ? undefined : { name: c.people[i].who[0], did: w.credit(p.id, c).did[i] };
}

/** The kinds of record the sources of a piece are, as the label's list of sources shows them: patent, paper, press. */
function records(p: Piece, w: Words): string {
  const kinds = new Set<SourceKind>([...p.sources, ...(people[p.id]?.sources ?? [])].map((s) => s.kind));
  return [...kinds].map((k) => w.kind(k)).join(', ');
}

/** The view of a piece with something to notice, if it has one. */
const looked = (p: Piece): ViewInfo | undefined => (views[p.id] ?? []).find((v) => v.hint);

const STATUS_ANSWER: Record<Status, string> = { production: 'teach.yes', niche: 'teach.yes', extinct: 'teach.no', lab: 'teach.lab' };
const tick = (yes: boolean, w: Words) => w.ui(yes ? 'teach.yes' : 'teach.no');
const needs = (p: Piece, n: Need) => p.needs.includes(n);

/** A QR code for a piece's page, for a sheet on paper. */
function qr(url: string): string {
  const code = qrcode(0, 'M');
  code.addData(url);
  code.make();
  return code.createSvgTag({ cellSize: 2, margin: 0, scalable: true });
}

/** The worksheet of a hall, for the displays chosen. */
export function worksheet(hallId: number, w: Words, ids?: string[]): string {
  const hall = halls.find((h) => h.id === hallId)!, them = chosen(hallId, ids), all = inHall(hallId);
  const name = (p: Piece) => esc(w.piece(p).name);

  const look = them.map((p) => {
    const x = w.piece(p), who = asked(p, w), v = looked(p);
    const task = v ? w.ui('teach.q.view', { view: w.view(p.id, v).label }) : `${w.ui('teach.q.try')} ${first(x.look)}`;
    return `<section class="ws__piece">
<div class="ws__qr" aria-hidden="true">${qr(w.full(`piece/${p.id}/`))}</div>
<h3><a href="${w.href(`piece/${p.id}/`)}">${name(p)}</a></h3>
<ol>
<li>${esc(w.ui('teach.q.how'))}</li>
<li>${esc(task)}</li>
${who ? `<li>${esc(w.ui('teach.q.who', { name: who.name }))}</li>` : ''}
</ol>
</section>`;
  }).join('\n');

  const grid = `<table class="ws__grid"><thead><tr><th></th><th>${esc(w.ui('teach.g.day'))}</th><th>${esc(w.ui('teach.g.off'))}</th><th>${esc(w.ui('teach.g.made'))}</th></tr></thead>
<tbody>${them.map((p) => `<tr><th>${name(p)}</th><td></td><td></td><td></td></tr>`).join('')}</tbody></table>`;
  const kinds = [...new Set(them.map((p) => p.principle))];

  const key = them.map((p) => {
    const x = w.piece(p), who = asked(p, w), v = looked(p);
    return `<section class="ws__piece">
<h4>${name(p)}</h4>
<ol>
<li>${esc(x.lead)} <i>${esc(w.ui('teach.k.own'))}</i></li>
<li>${esc(v ? w.view(p.id, v).hint ?? '' : first(x.look))}</li>
${who ? `<li>${esc(who.did)} ${esc(w.ui('teach.k.records', { kinds: records(p, w) }))}</li>` : ''}
</ol>
</section>`;
  }).join('\n');
  const byYear = [...them].sort((a, b) => a.year - b.year);

  const chooser = `<form class="ws__choose" data-choose>
<fieldset><legend>${esc(w.ui('teach.choose', { n: all.length }))}</legend>
${all.map((p) => `<label><input type="checkbox" name="p" value="${p.id}"${them.includes(p) ? ' checked' : ''}> ${name(p)}</label>`).join('\n')}
</fieldset>
<button type="submit" class="btn">${esc(w.ui('teach.update'))}</button>
</form>`;

  return `<div class="ws">
<h1>${esc(w.ui('teach.title', { n: hall.id, name: w.hall(hall).name }))}</h1>
<aside class="ws__teacher">
<h2>${esc(w.ui('teach.box'))}</h2>
<p><b>${esc(w.ui('teach.who.k'))}</b> ${esc(w.ui('teach.who'))}</p>
<p><b>${esc(w.ui('teach.goal.k'))}</b> ${esc(w.ui('teach.goal'))}</p>
<p><b>${esc(w.ui('teach.use.k'))}</b> ${esc(w.ui('teach.use'))}</p>
${chooser}
<p class="ws__keys"><a href="${w.href(`hall/${hall.id}/`)}">${esc(w.ui('teach.hall'))}</a> <a href="${w.href('teach/')}">${esc(w.ui('teach.all'))}</a></p>
</aside>
<p class="ws__name">${esc(w.ui('teach.name'))} ____________________ ${esc(w.ui('teach.date'))} __________</p>
<h2>${esc(w.ui('teach.a'))}</h2>
<p class="ws__lead">${esc(w.ui('teach.a.says'))}</p>
${look}
<h2>${esc(w.ui('teach.b'))}</h2>
<ol class="ws__compare">
<li>${esc(w.ui('teach.b.grid'))}${grid}</li>
<li>${esc(w.ui('teach.b.order'))}<p class="ws__names">${them.map(name).join(' / ')}</p></li>
${kinds.length > 1 ? `<li>${esc(w.ui('teach.b.sort'))}<p class="ws__names">${kinds.map((k) => esc(w.principle(k))).join(' / ')}</p></li>` : ''}
</ol>
<h2>${esc(w.ui('teach.c'))}</h2>
<p class="ws__open">${esc(w.ui(`teach.open.${hall.id}`))}</p>
<div class="ws__answers">
<h2>${esc(w.ui('teach.answers'))}</h2>
<p>${esc(w.ui('teach.source'))}</p>
<h3>${esc(w.ui('teach.a'))}</h3>
${key}
<h3>${esc(w.ui('teach.b'))}</h3>
<ol>
<li><table class="ws__grid"><thead><tr><th></th><th>${esc(w.ui('teach.g.day'))}</th><th>${esc(w.ui('teach.g.off'))}</th><th>${esc(w.ui('teach.g.made'))}</th></tr></thead>
<tbody>${them.map((p) => `<tr><th>${name(p)}</th><td>${esc(tick(needs(p, 'daylight'), w))}</td><td>${esc(tick(needs(p, 'unpowered'), w))}</td><td>${esc(w.ui(STATUS_ANSWER[p.status]))}</td></tr>`).join('')}</tbody></table>
<i>${esc(w.ui('teach.k.grid'))}</i></li>
<li>${byYear.map((p) => `${name(p)} (${esc(w.piece(p).yearText ?? String(p.year))})`).join(', ')}</li>
${kinds.length > 1 ? `<li>${kinds.map((k) => `<b>${esc(w.principle(k))}:</b> ${them.filter((p) => p.principle === k).map(name).join(', ')}`).join('<br>')}</li>` : ''}
</ol>
<h3>${esc(w.ui('teach.c'))}</h3>
<p><i>${esc(w.ui('teach.k.open'))}</i></p>
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

