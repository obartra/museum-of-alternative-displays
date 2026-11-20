/**
 * The collection's rules, enforced. A piece that breaks one fails the build.
 * usage: tsx scripts/validate.ts
 */
import { halls } from '../src/data/halls';
import { pieces } from '../src/data/pieces';
import { builders } from '../src/three/models';

const errors: string[] = [];
const fail = (id: string, msg: string) => errors.push(`${id}: ${msg}`);

// nobody selling anything, and nothing that plays a video
const BANNED_HOSTS = /(^|\.)(amazon|ebay|aliexpress|alibaba|etsy|youtube|youtu|vimeo|tiktok|instagram|facebook)\./i;
const DASH = /—|--/;

const seen = new Set<string>();
for (const p of pieces) {
  if (seen.has(p.id)) fail(p.id, 'duplicate id');
  seen.add(p.id);
  if (!/^[a-z0-9-]+$/.test(p.id)) fail(p.id, 'id must be lower case letters, digits and hyphens');
  if (!halls.some((h) => h.id === p.hall)) fail(p.id, `unknown hall ${p.hall}`);
  if (!builders[p.id]) fail(p.id, 'no 3D model registered in src/three/models/index.ts');
  if (p.year < 1500 || p.year > new Date().getFullYear()) fail(p.id, `implausible year ${p.year}`);
  if (p.lead.length < 30 || p.lead.length > 230) fail(p.id, `lead should be one sentence of 30 to 230 characters, got ${p.lead.length}`);
  if (p.how.length < 1) fail(p.id, 'needs at least one paragraph on how it makes an image');
  if (p.good.length < 2) fail(p.id, 'needs at least two things it is good at');
  if (p.bad.length < 2) fail(p.id, 'needs at least two limits. A piece with no stated limits is an advert');
  if (!p.look) fail(p.id, 'needs a note on what to try in the viewer');
  if (p.sources.length < 1) fail(p.id, 'needs at least one source');
  for (const s of p.sources) {
    let host = '';
    try { host = new URL(s.url).hostname; } catch { fail(p.id, `bad source URL ${s.url}`); }
    if (!/^https?:$/.test(s.url.slice(0, s.url.indexOf('/')))) fail(p.id, `source must be http(s): ${s.url}`);
    if (BANNED_HOSTS.test(host)) fail(p.id, `shops and video hosts are not sources: ${host}`);
  }
  const text = [p.name, p.aka ?? '', p.origin, p.statusNote, p.lead, ...p.how, ...p.good, ...p.bad, p.look, p.dispute ?? ''].join('\n');
  if (DASH.test(text)) fail(p.id, 'house style: no em dashes or double hyphens');
}
for (const id of Object.keys(builders)) if (!seen.has(id)) errors.push(`${id}: a model with no piece in the data`);

const kinds: Record<string, number> = {};
for (const p of pieces) for (const s of p.sources) kinds[s.kind] = (kinds[s.kind] ?? 0) + 1;
console.log(`${pieces.length} pieces in ${halls.length} halls`);
console.log(halls.map((h) => `  hall ${h.id} ${h.name}: ${pieces.filter((p) => p.hall === h.id).length}`).join('\n'));
console.log('sources by kind:', Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', '));
console.log(`pieces whose only sources are encyclopedia articles: ${pieces.filter((p) => p.sources.every((s) => s.kind === 'reference')).length}`);

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.map((e) => '  ' + e).join('\n'));
  process.exit(1);
}
console.log('collection is valid');
