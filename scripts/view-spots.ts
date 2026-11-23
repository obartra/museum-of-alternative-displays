/**
 * Every place a label offers (`src/data/views.ts`) must be a place its 3D model can stand the camera
 * (`views` in the model's builder), and every place a model has must be offered. The models need a browser to run,
 * so this reads their source: it finds each piece's builder from `models/index.ts` and the keys of its `views`.
 */
import { readFileSync } from 'node:fs';
import { views } from '../src/data/views';

const dir = new URL('../src/three/models/', import.meta.url);
const index = readFileSync(new URL('index.ts', dir), 'utf8');
const files = new Map<string, string>();
for (const m of index.matchAll(/import \* as (\w+) from '\.\/(\w+)'/g)) files.set(m[1], readFileSync(new URL(`${m[2]}.ts`, dir), 'utf8'));

/** The keys of the object literal that opens at `at` (just after its `{`), at its own depth only. */
function keys(src: string, at: number): string[] {
  const out: string[] = [];
  let depth = 0, i = at, token = '';
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '{' || c === '[' || c === '(') { depth++; token = ''; continue; }
    if (c === '}' || c === ']' || c === ')') { if (depth === 0) break; depth--; token = ''; continue; }
    if (depth > 0) continue;
    if (c === ':') { const k = token.trim().replace(/^['"]|['"]$/g, ''); if (/^[\w-]+$/.test(k)) out.push(k); token = ''; continue; }
    if (c === ',') { token = ''; continue; }
    token += c;
  }
  return out;
}

const wrong: string[] = [];
let seen = 0;
for (const m of index.matchAll(/^\s*'?([\w-]+)'?: (\w+)\.(\w+),/gm)) {
  const [, id, mod, fn] = m;
  const src = files.get(mod);
  if (!src) continue;
  const start = src.search(new RegExp(`export (?:function|const) ${fn}\\b`));
  if (start < 0) { wrong.push(`${id}: no builder ${mod}.${fn}`); continue; }
  const next = src.slice(start + 10).search(/\nexport (?:function|const) /);
  const body = src.slice(start, next < 0 ? undefined : start + 10 + next);
  const v = /\bviews: \{/.exec(body);
  const has = v ? keys(body, v.index + v[0].length) : [];
  seen++;
  const offered = (views[id] ?? []).map((x) => x.id);
  for (const o of offered) if (!has.includes(o)) wrong.push(`${id}: the label offers "${o}", and the model has no such place`);
  for (const h of has) if (!offered.includes(h)) wrong.push(`${id}: the model has a place "${h}" that no label offers`);
}
for (const id of Object.keys(views)) if (!new RegExp(`^\\s*'?${id}'?: \\w+\\.\\w+,`, 'm').test(index)) wrong.push(`${id}: views for a piece with no model`);
console.log(wrong.length ? wrong.join('\n') : `every place offered is a place in its model (${seen} pieces)`);
process.exit(wrong.length ? 1 : 0);
