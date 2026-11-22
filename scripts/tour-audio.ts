/**
 * Has the guided tours spoken by ElevenLabs: one recording for each part of a tour, in each language that tells it.
 *
 *   tsx scripts/tour-audio.ts --dry            say what would be recorded and how many characters that is. Needs no key.
 *   tsx scripts/tour-audio.ts --voices         list the women's voices of the account, to choose from. Needs the key.
 *   tsx scripts/tour-audio.ts [--langs en,es]  record what is missing or out of date. Needs the key, and ffmpeg.
 *
 * The key is read from the environment, as ELEVENLABS_API_KEY, and is written nowhere.
 * tour/voices.json names the model, the sound format and the voice for each language. "default" is the voice of
 * every language that has none of its own. A language the model cannot speak is left out, and so is a language
 * that does not tell the tour yet.
 *
 * A part is spoken in one piece, so that it is one voice in one mood from its first word to its last. ElevenLabs
 * says when each character was spoken, and the recording is cut where its paragraphs meet, in the pause that is
 * really there. Where the times cannot be had, each paragraph is spoken by itself. The paragraphs are then put
 * together here, as "delivery" in tour/voices.json says, so that every part is delivered alike whatever the voice did:
 *   - a silence stands before the first word, between the paragraphs and after the last word. The longest follows
 *     the first paragraph of a stop, which says what to look at: that is the time for looking;
 *   - the voice is asked to speak a little slower, and a part that still runs faster than the pace named is
 *     stretched to it, by a tenth at most;
 *   - every part is brought to the same loudness, with its peaks held under a limit.
 * A part is recorded again only when its words, its voice, the model or this delivery changed.
 *
 * The recordings go to public/tour/<tour>/<language>/ and the list of them to src/data/tour-audio.json, with the
 * length of each, from which the site says how long a tour is. The site offers a recording only beside the very
 * words it was made from.
 */
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { mark, spoken, tours } from '../src/data/tours';
import { LANGS, type Locale } from '../src/i18n/types';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// ELEVENLABS_API_URL is for an account kept in another region, and for trying the script against a stand-in
const API = (process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io').replace(/\/+$/, '');
const args = process.argv.slice(2), dry = args.includes('--dry'), listVoices = args.includes('--voices');
const only = (args[args.indexOf('--langs') + 1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const wanted = args.includes('--langs') && only.length ? only : null;
const key = process.env.ELEVENLABS_API_KEY ?? '';
interface Delivery {
  /** Speak a part in one piece and cut it where its paragraphs meet. Without this, each paragraph is spoken by itself. */
  whole?: boolean;
  /** How fast the voice is asked to speak: 1 is its own pace. Left out for a model that will not be told. */
  speed?: number;
  /** The most words a minute for any part. A faster one is stretched to this, by a tenth at most. */
  pace: number;
  /** Seconds of silence: before the first word, after the paragraph that says what to look at, between the other paragraphs, after the last word. */
  lead: number; afterLook: number; between: number; tail: number;
  /** How loud every part is, in LUFS, and the level no peak passes, in dBFS. */
  loudness: number; peak: number;
}
const config = JSON.parse(readFileSync(`${ROOT}tour/voices.json`, 'utf8')) as { model: string; format: string; voices: Record<string, string>; leaveOut?: string[]; delivery: Delivery };
const D = config.delivery;
/** What ElevenLabs is asked for. It is worked on here and then written in the format the site serves, so it is asked for at a better quality than that. */
const SOURCE = 'mp3_44100_128';
const served = /^mp3_(\d+)_(\d+)$/.exec(config.format);
if (!served) { console.error(`tour/voices.json: the format ${config.format} is not one this script writes. It writes mp3, named like mp3_44100_64.`); process.exit(1); }
/** A mark of the way the paragraphs are put together. When it changes, every part is made again. */
const recipe = mark(`4 ${SOURCE} ${JSON.stringify(D)}`);
const listFile = `${ROOT}src/data/tour-audio.json`;
type Kept = { file: string; mark: string; voice: string; model: string; recipe?: string; seconds?: number };
const list = (existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')) : {}) as Record<string, Record<string, Record<string, Kept>>>;
/** The code ElevenLabs uses for a language of the site. */
const spokenAs = (code: string) => (code === 'zh-hant' ? 'zh' : code);
const note = (line: string) => { console.log(line); if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line + '\n'); };

async function ask(path: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    // a line that went dead between two requests is tried again: nothing was spoken, so nothing is paid for twice
    try { res = await fetch(API + path, { ...init, headers: { 'xi-api-key': key, ...(init?.headers ?? {}) } }); }
    catch (err) { if (attempt >= 3) throw err; await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); continue; }
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
const told: { tour: string; lang: string; part: string; n: number; stop: boolean; text: string[] }[] = [];
for (const tour of tours) {
  const stop = (id: string) => id !== 'start' && id !== 'end';
  tour.parts.forEach((part, i) => told.push({ tour: tour.id, lang: 'en', part: part.id, n: i, stop: stop(part.id), text: part.text }));
  for (const l of LANGS) {
    const file = `${ROOT}src/i18n/locales/${l.code}.ts`;
    if (l.code === 'en' || !existsSync(file)) continue;
    const own = ((await import(file)) as { default: Locale }).default.tours?.[tour.id];
    if (own) tour.parts.forEach((part, i) => told.push({ tour: tour.id, lang: l.code, part: part.id, n: i, stop: stop(part.id), text: own.parts[part.id].text }));
  }
}
let langs = [...new Set(told.map((x) => x.lang))].filter((l) => !wanted || wanted.includes(l));
// tour/voices.json may name languages that get no recording, because the model does not speak them
const left = langs.filter((l) => (config.leaveOut ?? []).includes(l));
if (left.length) note(`Left out, as tour/voices.json says: ${left.join(', ')}.`);
langs = langs.filter((l) => !left.includes(l));

// ---------- the sound ----------

/** Run ffmpeg or ffprobe, without holding up the line to ElevenLabs meanwhile. What ffmpeg reports is on the error stream. */
const tool = (name: 'ffmpeg' | 'ffprobe', argv: string[]): Promise<string> => new Promise((done, fail) => {
  execFile(name, name === 'ffmpeg' ? ['-hide_banner', '-nostdin', '-y', ...argv] : argv, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (err) fail(new Error(`${name} failed: ${(stderr || err.message).trim().split('\n').slice(-3).join(' | ')}`)); else done(name === 'ffmpeg' ? stderr : stdout);
  });
});
const seconds = async (file: string) => Number((await tool('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file])).trim());
/** How loud a recording is as a whole, in LUFS, and its highest peak, in dBFS. */
async function level(file: string): Promise<{ loud: number; peak: number }> {
  const said = await tool('ffmpeg', ['-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const last = (re: RegExp) => { const all = [...said.matchAll(re)]; return all.length ? Number(all[all.length - 1][1]) : NaN; };
  return { loud: last(/\bI:\s+(-?[\d.]+) LUFS/g), peak: last(/\bPeak:\s+(-?[\d.]+) dBFS/g) };
}
const words = (text: string) => text.trim().split(/\s+/).length;
/** The silence that follows paragraph `i` of a part that has `of` paragraphs. */
const gap = (i: number, of: number, stop: boolean) => (i === of - 1 ? D.tail : i === 0 && stop ? D.afterLook : D.between);
/** Both ends cut back to the voice, leaving a breath of the stillness that was there. */
const TRIM = 'silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:start_silence=0.03';

/**
 * Put the paragraphs of one part together: each cut back to the voice, slowed if it ran, brought to the loudness
 * asked for, and set between the silences. Returns what was made, for the report.
 */
async function assemble(raw: string[], texts: string[], stop: boolean, out: string, work: string): Promise<{ long: number; spoken: number; pace: number; tempo: number; loud: number; peak: number }> {
  const cut: string[] = [], clean: string[] = [], gains: number[] = [];
  const count = texts.reduce((n, t) => n + words(t), 0);
  let before = 0, speech = 0;
  for (const [i, file] of raw.entries()) {
    cut.push(`${work}/cut-${i}.wav`);
    await tool('ffmpeg', ['-i', file, '-af', `aformat=channel_layouts=mono,aresample=${served![1]},${TRIM},areverse,${TRIM},areverse,highpass=f=70`, cut[i]]);
    before += await seconds(cut[i]);
  }
  // a part spoken faster than the pace asked for is stretched to it, all of it alike, and its pitch stays where it was
  const spokenAt = (count / before) * 60, tempo = Math.max(0.9, Math.min(1, D.pace / spokenAt));
  for (const [i, file] of cut.entries()) {
    const done = `${work}/clean-${i}.wav`;
    if (tempo < 0.985) await tool('ffmpeg', ['-i', file, '-af', `atempo=${tempo.toFixed(4)}`, done]); else writeFileSync(done, readFileSync(file));
    const heard = (await level(done)).loud;
    if (!Number.isFinite(heard) || heard < -60) throw new Error(`paragraph ${i + 1} came back silent`);
    clean.push(done); gains.push(D.loudness - heard);
    speech += await seconds(done);
  }
  const limit = (10 ** (D.peak / 20)).toFixed(4);
  const build = async (more: number) => {
    const chains = clean.map((_, i) => `[${i}:a]volume=${(gains[i] + more).toFixed(2)}dB${i === 0 ? `,adelay=${Math.round(D.lead * 1000)}:all=1` : ''},apad=pad_dur=${gap(i, clean.length, stop)}[p${i}]`).join(';');
    await tool('ffmpeg', [...clean.flatMap((f) => ['-i', f]), '-filter_complex', `${chains};${clean.map((_, i) => `[p${i}]`).join('')}concat=n=${clean.length}:v=0:a=1,alimiter=limit=${limit}:level=false:attack=5:release=80[out]`,
      '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', `${served![2]}k`, '-ar', served![1], '-ac', '1', '-id3v2_version', '0', '-write_xing', '1', out]);
    return level(out);
  };
  // holding the peaks down takes a little loudness away: what is missing is put back, once
  let got = await build(0);
  if (Math.abs(got.loud - D.loudness) > 0.4) got = await build(Math.max(-3, Math.min(3, D.loudness - got.loud)));
  return { long: await seconds(out), spoken: spokenAt, pace: (count / speech) * 60, tempo: tempo < 0.985 ? tempo : 1, loud: got.loud, peak: got.peak };
}

if (!dry) {
  needKey();
  try { await tool('ffmpeg', ['-version']); await tool('ffprobe', ['-version']); }
  catch { console.error('ffmpeg and ffprobe are needed to put the recordings together, and they are not here. Install ffmpeg and run this again.'); process.exit(1); }
  // Which languages the model speaks is asked first, so that none is sent in vain. A key that may only make speech
  // cannot ask (it lacks the permission models_read). Then nothing is checked here, and ElevenLabs itself refuses
  // a model or a language it does not have when the first part is sent.
  const res = await ask('/v1/models');
  const refused = res.ok ? '' : (await res.text()).slice(0, 400);
  if (!res.ok && !(res.status === 401 && /missing_permissions/.test(refused))) { console.error(`ElevenLabs answered ${res.status}: ${refused}`); process.exit(1); }
  if (!res.ok) note(`This key may not read the list of models, so the languages that ${config.model} speaks are not checked first.`);
  else {
    const models = (await res.json()) as { model_id: string; can_do_text_to_speech?: boolean; languages?: { language_id: string }[] }[];
    const model = models.find((m) => m.model_id === config.model);
    if (!model) { console.error(`This account has no model called ${config.model}. It has: ${models.filter((m) => m.can_do_text_to_speech).map((m) => m.model_id).join(', ')}`); process.exit(1); }
    const speaks = new Set((model.languages ?? []).map((x) => x.language_id.toLowerCase().split('-')[0]));
    const cannot = langs.filter((l) => !speaks.has(spokenAs(l)));
    if (cannot.length) note(`${config.model} does not speak: ${cannot.join(', ')}. They get no recording.`);
    langs = langs.filter((l) => !cannot.includes(l));
  }
}

let sent = 0, spent = 0, made = 0, same = 0, asked = 0, total = 0;
const missingVoice = new Set<string>(), refusedFor: string[] = [];
// The newer models are told which language the words are in, so that Catalan is not read as Spanish. The older ones refuse the field.
const namesLanguage = /^eleven_(v[3-9]|turbo_v2_5|flash_v2_5)/.test(config.model);
/** Whether the voice is asked to speak slower. A model that refuses to be told is not asked again. */
let slower = typeof D.speed === 'number' && D.speed !== 1;
/** Whether a part is asked for in one piece, with the times of its characters. A model that gives no times is not asked again. */
let timed = D.whole === true;
const work = dry ? '' : mkdtempSync(`${tmpdir()}/tour-audio-`);

/** Ask for one text to be spoken. Returns the answer, or as a string why it was refused. */
async function speak(voice: string, lang: string, text: string, withTimes: boolean): Promise<Response | string> {
  const send = () => ask(`/v1/text-to-speech/${encodeURIComponent(voice)}${withTimes ? '/with-timestamps' : ''}?output_format=${SOURCE}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: config.model, ...(namesLanguage ? { language_code: spokenAs(lang) } : {}), ...(slower ? { voice_settings: { speed: D.speed } } : {}) }) });
  let res = await send(); asked++;
  if (!res.ok && slower && (res.status === 400 || res.status === 422)) {
    const why = (await res.text()).slice(0, 400);
    if (!/speed|voice_settings/i.test(why)) return `${res.status}: ${why}`;
    note(`${config.model} will not be told how fast to speak (${why.replace(/\s+/g, ' ').slice(0, 160)}). The pace is set here instead.`);
    slower = false; res = await send(); asked++;
  }
  return res.ok ? res : `${res.status}: ${(await res.text()).slice(0, 400)}`;
}

/** The pauses in a recording, as ffmpeg hears them: from when to when, in seconds. */
async function pauses(file: string): Promise<[number, number][]> {
  const said = await tool('ffmpeg', ['-i', file, '-af', 'silencedetect=noise=-45dB:d=0.1', '-f', 'null', '-']), found: [number, number][] = [];
  let from = NaN;
  for (const m of said.matchAll(/silence_(start|end): (-?[\d.]+)/g)) { if (m[1] === 'start') from = Number(m[2]); else if (Number.isFinite(from)) { found.push([Math.max(0, from), Number(m[2])]); from = NaN; } }
  if (Number.isFinite(from)) found.push([Math.max(0, from), await seconds(file)]);
  return found;
}

/**
 * One part spoken in one piece and cut where its paragraphs meet. ElevenLabs says when each character was spoken:
 * that points to the pause between two paragraphs, and the cut is made in the middle of the pause that ffmpeg
 * finds there. Says `cannot` when this part has to be spoken paragraph by paragraph after all.
 */
async function inOnePiece(voice: string, lang: string, x: { n: number; text: string[] }): Promise<{ clips: string[] } | { refusal: string } | { cannot: string }> {
  const text = spoken(x.text);
  const res = await speak(voice, lang, text, true);
  if (typeof res === 'string') {
    // a model or a plan that gives no times says so with the request itself: nothing was spoken
    if (/^(400|404|405|422):/.test(res) && /timestamp|alignment|not (supported|available)|unsupported/i.test(res)) { timed = false; return { cannot: `${config.model} gives no times with its speech (${res.replace(/\s+/g, ' ').slice(0, 160)}).` }; }
    return { refusal: res };
  }
  spent += text.length;
  const got = (await res.json()) as { audio_base64?: string; alignment?: { characters?: string[]; character_start_times_seconds?: number[]; character_end_times_seconds?: number[] } | null };
  if (!got.audio_base64) { timed = false; return { cannot: 'The answer held no sound.' }; }
  const file = `${work}/${lang}-${x.n}.mp3`;
  writeFileSync(file, Buffer.from(got.audio_base64, 'base64'));
  if (x.text.length === 1) return { clips: [file] };
  const ch = got.alignment?.characters ?? [], t0 = got.alignment?.character_start_times_seconds ?? [], t1 = got.alignment?.character_end_times_seconds ?? [];
  // from here on, whatever cannot be done for this part is not tried for the others: each try that fails is paid for
  const giveUp = (why: string) => { timed = false; return { cannot: why }; };
  if (!ch.length || t0.length !== ch.length || t1.length !== ch.length) return giveUp(`${config.model} gave no times with its speech.`);
  // Where one paragraph ends and the next begins. The characters come back as they were sent, but what stands
  // between two paragraphs may have been made into something else, so each paragraph is looked for by its first words
  const entry: number[] = [];
  let joined = '';
  ch.forEach((c, i) => { for (let k = 0; k < c.length; k++) entry.push(i); joined += c; });
  const meets: [number, number][] = [];
  let from = 0;
  for (let k = 1; k < x.text.length; k++) {
    const at = joined.indexOf(x.text[k].slice(0, 24), Math.max(0, from + x.text[k - 1].length - 8));
    let last = at < 0 ? -1 : entry[at] - 1;
    while (last >= 0 && !ch[last].trim()) last--;
    if (last < 0 || !Number.isFinite(t1[last]) || !Number.isFinite(t0[entry[at]])) return giveUp(`The times of the characters do not show where paragraph ${k + 1} begins.`);
    meets.push([t1[last], t0[entry[at]]]);
    from = at;
  }
  const still = await pauses(file), long = await seconds(file), cuts: number[] = [];
  for (const [end, start] of meets) {
    const overlap = (p: [number, number], a: number, b: number) => Math.min(p[1], b) - Math.max(p[0], a);
    const near = still.filter((p) => overlap(p, end - 0.35, start + 0.35) > 0.05 && p[1] - p[0] >= 0.12);
    if (!near.length) return giveUp(`No pause was found where two paragraphs meet, ${end.toFixed(1)} s in.`);
    const best = near.reduce((a, b) => (overlap(b, end - 0.05, start + 0.05) > overlap(a, end - 0.05, start + 0.05) ? b : a));
    cuts.push((best[0] + best[1]) / 2);
  }
  if (cuts.some((c, i) => c <= (cuts[i - 1] ?? 0) + 0.5 || c >= long - 0.5)) return giveUp('The pauses between the paragraphs were not found in their order.');
  const clips: string[] = [];
  for (let i = 0; i < x.text.length; i++) {
    const clip = `${work}/${lang}-${x.n}-${i}.wav`, from = i ? cuts[i - 1] : 0, to = i < cuts.length ? cuts[i] : long + 1;
    await tool('ffmpeg', ['-i', file, '-af', `atrim=start=${from.toFixed(3)}:end=${to.toFixed(3)},asetpts=PTS-STARTPTS`, clip]);
    clips.push(clip);
  }
  return { clips };
}
const rows: string[] = [];
for (const lang of langs) {
  const voice = config.voices[lang] || config.voices.default || '';
  let chars = 0, parts = 0, pieces = 0;
  for (const x of told.filter((t) => t.lang === lang)) {
    if (refusedFor.includes(lang)) break;
    const was = list[x.tour]?.[lang]?.[x.part], m = mark(spoken(x.text));
    const dir = `${ROOT}public/tour/${x.tour}/${lang}`;
    if (was && was.mark === m && was.voice === voice && was.model === config.model && was.recipe === recipe && existsSync(`${dir}/${was.file}`)) { same++; continue; }
    const size = x.text.reduce((n, p) => n + p.length, 0);
    chars += size; parts++; pieces += x.text.length;
    if (dry) continue;
    if (!voice) { missingVoice.add(lang); continue; }
    // A refusal ends this language and not the run: the others may still be recorded, and what was made is kept
    let raw: string[] = [], refusal = '';
    if (timed) {
      const got = await inOnePiece(voice, lang, x);
      if ('clips' in got) raw = got.clips; else if ('refusal' in got) refusal = got.refusal; else note(`${lang}, ${x.part}: ${got.cannot} Its paragraphs are spoken one by one.`);
    }
    if (!raw.length && !refusal) {
      for (const [i, text] of x.text.entries()) {
        const res = await speak(voice, lang, text, false);
        if (typeof res === 'string') { refusal = res; break; }
        const file = `${work}/${lang}-${x.n}-${i}.mp3`;
        writeFileSync(file, Buffer.from(await res.arrayBuffer()));
        raw.push(file); spent += text.length;
      }
    }
    if (refusal) { note(`${lang}, ${x.part}: ElevenLabs answered ${refusal}`); refusedFor.push(lang); chars -= size; parts--; pieces -= x.text.length; continue; }
    // the name of the file changes with what is in it, so that no browser plays an older take under the same name
    const file = `${String(x.n).padStart(2, '0')}-${x.part}.${mark(`${m} ${voice} ${config.model} ${recipe}`).slice(0, 6)}.mp3`;
    mkdirSync(dir, { recursive: true });
    let got;
    try { got = await assemble(raw, x.text, x.stop, `${dir}/${file}`, work); }
    catch (err) { note(`${lang}, ${x.part}: ${(err as Error).message}`); refusedFor.push(lang); rmSync(`${dir}/${file}`, { force: true }); continue; }
    if (was && was.file !== file) rmSync(`${dir}/${was.file}`, { force: true });
    ((list[x.tour] ??= {})[lang] ??= {})[x.part] = { file, mark: m, voice, model: config.model, recipe, seconds: Math.round(got.long * 10) / 10 };
    writeFileSync(listFile, JSON.stringify(list, null, 1) + '\n');
    made++;
    rows.push(`| ${lang} | ${x.part} | ${x.text.length} | ${got.long.toFixed(1)} s | ${Math.round(got.spoken)} | ${got.tempo < 1 ? got.tempo.toFixed(2) : ''} | ${Math.round(got.pace)} | ${got.loud.toFixed(1)} | ${got.peak.toFixed(1)} |`);
    total += got.long;
  }
  sent += chars;
  note(`${lang}: ${parts} parts to record in ${pieces} paragraphs, ${chars.toLocaleString('en')} characters${dry ? '' : voice ? '' : '  (no voice chosen)'}`);
}
if (work) rmSync(work, { recursive: true, force: true });
if (rows.length) note(`\n| Language | Part | Paragraphs | Length | Spoken at, words a minute | Stretched to | Heard at | LUFS | Peak, dBFS |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\nThe recordings made are ${Math.floor(total / 60)} min ${Math.round(total % 60)} s long together.`);
note(`${dry ? `Would send ${sent.toLocaleString('en')}` : `Sent ${spent.toLocaleString('en')}`} characters in all${dry ? '' : `, in ${asked} requests`}. ${made} recordings made, ${same} already up to date.`);
if (!dry && made) note(`Delivery: ${slower ? `the voice was asked to speak at ${D.speed} of its pace` : 'the voice spoke at its own pace'}, no part faster than ${D.pace} words a minute unless that took more than a tenth, ${D.afterLook} s of silence after what to look at, ${D.loudness} LUFS, peaks under ${D.peak} dBFS.`);
if (missingVoice.size) { console.error(`No voice is chosen for: ${[...missingVoice].join(', ')}. Run with --voices, listen, and put an id in tour/voices.json, under the language or under "default".`); process.exit(1); }
if (refusedFor.length) { console.error(`Stopped early for: ${refusedFor.join(', ')}. What was recorded before that is kept.`); process.exit(1); }
