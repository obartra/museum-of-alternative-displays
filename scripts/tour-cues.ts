/**
 * Gives the recordings of the guided tours the times of their captions.
 *
 *   tsx scripts/tour-cues.ts            the recordings that have no times yet. Needs ffmpeg, and no key.
 *   tsx scripts/tour-cues.ts --all      every recording again
 *   tsx scripts/tour-cues.ts --report   say what would be written, and write nothing
 *
 * The times go into src/data/tour-audio.json, as "cues" and "rests" beside each recording. scripts/tour-audio.ts
 * does the same for a recording it has just made, so this is for the recordings made before captions, and for
 * after a change to the way captions are cut. A recording whose words have changed since is left alone.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mark, spoken, tours } from '../src/data/tours';
import { captions } from '../src/data/captions';
import { LANGS, type Locale } from '../src/i18n/types';
import { cuesOf, listText } from './tour/cues';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2), every = args.includes('--all'), report = args.includes('--report');
const listFile = `${ROOT}src/data/tour-audio.json`;
interface Kept { file: string; mark: string; seconds: number; cues?: number[]; rests?: number[]; [more: string]: unknown }
const list = JSON.parse(readFileSync(listFile, 'utf8')) as Record<string, Record<string, Record<string, Kept>>>;

let made = 0, kept = 0, stale = 0, found = 0, shared = 0;
const odd: string[] = [];
for (const tour of tours) for (const l of LANGS) {
  const recorded = list[tour.id]?.[l.code];
  if (!recorded) continue;
  const file = `${ROOT}src/i18n/locales/${l.code}.ts`;
  const own = l.code === 'en' ? undefined : existsSync(file) ? ((await import(file)) as { default: Locale }).default.tours?.[tour.id] : undefined;
  if (l.code !== 'en' && !own) continue;
  let f = 0, s = 0, n = 0;
  for (const part of tour.parts) {
    const rec = recorded[part.id], text = own ? own.parts[part.id].text : part.text;
    if (!rec) continue;
    if (rec.mark !== mark(spoken(text))) { stale++; continue; }
    const want = captions(text).length;
    if (!every && rec.cues?.length === want && rec.rests?.length === text.length) { kept++; continue; }
    const got = await cuesOf(`${ROOT}public/tour/${tour.id}/${l.code}/${rec.file}`, text, rec.seconds);
    if (!got.whole) odd.push(`${l.code} ${part.id}: its silences do not match its paragraphs, so its captions go by their share of the letters`);
    if (got.cues.length !== want) throw new Error(`${l.code} ${part.id}: ${got.cues.length} times for ${want} captions`);
    rec.cues = got.cues; rec.rests = got.rests;
    made++; f += got.found; s += got.shared; n += want;
  }
  found += f; shared += s;
  if (n) console.log(`  ${tour.id} ${l.code.padEnd(7)} ${n} captions: ${f} begin at a pause that was found, ${s} by their share of the letters`);
}
for (const line of odd) console.log(`  ${line}`);
console.log(`${made} recordings given times, ${kept} had them already${stale ? `, ${stale} left alone because their words have changed` : ''}.`);
if (!report && made) writeFileSync(listFile, listText(list));
