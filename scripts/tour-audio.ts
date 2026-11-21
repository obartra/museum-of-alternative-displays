/**
 * Has the guided tours spoken by ElevenLabs: one recording for each part of a tour, in each language that tells it.
 *
 *   tsx scripts/tour-audio.ts --dry            say what would be recorded and how many characters that is. Needs no key.
 *   tsx scripts/tour-audio.ts --voices         list the women's voices of the account, to choose from. Needs the key.
 *   tsx scripts/tour-audio.ts [--langs en,es]  record what is missing or out of date. Needs the key.
 *
 * The key is read from the environment, as ELEVENLABS_API_KEY, and is written nowhere.
 * tour/voices.json names the model, the sound format and the voice for each language. "default" is the voice of
 * every language that has none of its own. A language the model cannot speak is left out, and so is a language
 * that does not tell the tour yet. A part is recorded again only when its words, its voice or the model changed.
 *
 * The recordings go to public/tour/<tour>/<language>/ and the list of them to src/data/tour-audio.json. The site
 * offers a recording only beside the very words it was made from.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mark, spoken, tours } from '../src/data/tours';
import { LANGS, type Locale } from '../src/i18n/types';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const API = 'https://api.elevenlabs.io';
const args = process.argv.slice(2), dry = args.includes('--dry'), listVoices = args.includes('--voices');
const only = (args[args.indexOf('--langs') + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const wanted = args.includes('--langs') && only.length ? only : null;
const key = process.env.ELEVENLABS_API_KEY ?? '';
const config = JSON.parse(readFileSync(`${ROOT}tour/voices.json`, 'utf8')) as { model: string; format: string; voices: Record<string, string> };
const listFile = `${ROOT}src/data/tour-audio.json`;
type Kept = { file: string; mark: string; voice: string; model: string };
const list = (existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')) : {}) as Record<string, Record<string, Record<string, Kept>>>;
/** The code ElevenLabs uses for a language of the site. */
const spokenAs = (code: string) => (code === 'zh-hant' ? 'zh' : code);
const note = (line: string) => { console.log(line); if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + '\n'); };

async function ask(path: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API + path, { ...init, headers: { 'xi-api-key': key, ...(init?.headers ?? {}) } });
    if (res.status !== 429 || attempt >= 3) return res;
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
  }
}
const needKey = () => { if (!key) { console.error('ELEVENLABS_API_KEY is not set. Run with --dry to see what would be recorded.'); process.exit(1); } };

if (listVoices) {
  needKey();
  const res = await ask('/v2/voices?page_size=100');
  if (!res.ok) { console.error(`ElevenLabs answered ${res.status}: ${(await res.text()).slice(0, 400)}`); process.exit(1); }
  const voices = ((await res.json()) as { voices: { voice_id: string; name: string; category?: string; labels?: Record<string, string>; preview_url?: string }[] }).voices;
  const women = voices.filter((v) => /female|woman/i.test(v.labels?.gender ?? ''));
  note(`## Voices to choose from\n\n${women.length} of the ${voices.length} voices of this account are marked as women's voices. Listen to the samples, then put the id of the one you choose in \`tour/voices.json\`.\n`);
  note('| Name | Id | Accent | Age | Described as | Use | Sample |\n| --- | --- | --- | --- | --- | --- | --- |');
  for (const v of women) note(`| ${v.name} | \`${v.voice_id}\` | ${v.labels?.accent ?? ''} | ${v.labels?.age ?? ''} | ${v.labels?.description ?? v.labels?.descriptive ?? ''} | ${v.labels?.use_case ?? ''} | ${v.preview_url ? `[listen](${v.preview_url})` : ''} |`);
  process.exit(0);
}

// every language that tells a tour: English from the data, the others from the files the site loads
const told: { tour: string; lang: string; part: string; n: number; text: string }[] = [];
for (const tour of tours) {
  tour.parts.forEach((part, i) => told.push({ tour: tour.id, lang: 'en', part: part.id, n: i, text: spoken(part.text) }));
  for (const l of LANGS) {
    const file = `${ROOT}src/i18n/locales/${l.code}.ts`;
    if (l.code === 'en' || !existsSync(file)) continue;
    const own = ((await import(file)) as { default: Locale }).default.tours?.[tour.id];
    if (own) tour.parts.forEach((part, i) => told.push({ tour: tour.id, lang: l.code, part: part.id, n: i, text: spoken(own.parts[part.id].text) }));
  }
}
let langs = [...new Set(told.map((x) => x.lang))].filter((l) => !wanted || wanted.includes(l));

if (!dry) {
  needKey();
  const res = await ask('/v1/models');
  if (!res.ok) { console.error(`ElevenLabs answered ${res.status}: ${(await res.text()).slice(0, 400)}`); process.exit(1); }
  const models = (await res.json()) as { model_id: string; can_do_text_to_speech?: boolean; languages?: { language_id: string }[] }[];
  const model = models.find((m) => m.model_id === config.model);
  if (!model) { console.error(`This account has no model called ${config.model}. It has: ${models.filter((m) => m.can_do_text_to_speech).map((m) => m.model_id).join(', ')}`); process.exit(1); }
  const speaks = new Set((model.languages ?? []).map((x) => x.language_id.toLowerCase().split('-')[0]));
  const cannot = langs.filter((l) => !speaks.has(spokenAs(l)));
  if (cannot.length) note(`${config.model} does not speak: ${cannot.join(', ')}. They get no recording.`);
  langs = langs.filter((l) => !cannot.includes(l));
}

let sent = 0, made = 0, same = 0;
const missingVoice = new Set<string>();
for (const lang of langs) {
  const voice = config.voices[lang] || config.voices.default || '';
  let chars = 0, parts = 0;
  for (const x of told.filter((t) => t.lang === lang)) {
    const was = list[x.tour]?.[lang]?.[x.part], m = mark(x.text);
    const file = `${String(x.n).padStart(2, '0')}-${x.part}.mp3`, dir = `${ROOT}public/tour/${x.tour}/${lang}`;
    if (was && was.mark === m && was.voice === voice && was.model === config.model && existsSync(`${dir}/${was.file}`)) { same++; continue; }
    chars += x.text.length; parts++;
    if (dry) continue;
    if (!voice) { missingVoice.add(lang); continue; }
    const res = await ask(`/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=${encodeURIComponent(config.format)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: x.text, model_id: config.model }) });
    if (!res.ok) { console.error(`${lang}, ${x.part}: ElevenLabs answered ${res.status}: ${(await res.text()).slice(0, 400)}`); process.exit(1); }
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/${file}`, Buffer.from(await res.arrayBuffer()));
    ((list[x.tour] ??= {})[lang] ??= {})[x.part] = { file, mark: m, voice, model: config.model };
    writeFileSync(listFile, JSON.stringify(list, null, 1) + '\n');
    made++;
  }
  sent += chars;
  note(`${lang}: ${parts} parts to record, ${chars.toLocaleString('en')} characters${dry ? '' : voice ? '' : '  (no voice chosen)'}`);
}
note(`${dry ? 'Would send' : 'Sent'} ${sent.toLocaleString('en')} characters in all. ${made} recordings made, ${same} already up to date.`);
if (missingVoice.size) { console.error(`No voice is chosen for: ${[...missingVoice].join(', ')}. Run with --voices, listen, and put an id in tour/voices.json, under the language or under "default".`); process.exit(1); }
