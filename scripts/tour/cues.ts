/**
 * When each caption of a recording begins, worked out from the recording itself.
 *
 * A recording is put together by scripts/tour-audio.ts with a long silence after each paragraph, so the paragraphs
 * are found by those silences. Inside a paragraph the voice pauses between sentences and, more briefly, at commas.
 * Where a caption should begin by its share of the letters, the nearest fitting pause is taken, and a caption with
 * no pause near it begins by its share between the two found on either side of it.
 */
import { execFile } from 'node:child_process';
import { captions, type Caption } from '../../src/data/captions';

export interface Cues {
  /** When each caption begins, in seconds, in the order captions() gives them. */
  cues: number[];
  /** When the voice ends each paragraph, in seconds: its last caption is taken away then. */
  rests: number[];
  /** How many captions begin at a pause that was found, and how many by their share of the letters. */
  found: number; shared: number;
  /** Whether the paragraphs themselves were found by their silences. */
  whole: boolean;
}

type Span = [from: number, to: number];

/** The list of recordings as it is kept in src/data/tour-audio.json: a list of times on one line. */
export const listText = (list: unknown): string => JSON.stringify(list, null, 1).replace(/\[\n\s+([-\d.,\s]+?)\n\s+\]/g, (_m, times: string) => `[${times.split(/,\s*/).join(', ')}]`) + '\n';

function quiet(file: string, noise: number, least: number, total: number): Promise<Span[]> {
  return new Promise((done, fail) => {
    execFile('ffmpeg', ['-hide_banner', '-nostdin', '-nostats', '-i', file, '-af', `silencedetect=noise=${noise}dB:d=${least}`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }, (err, _out, said) => {
      if (err) { fail(new Error(`ffmpeg could not read ${file}`)); return; }
      const from = [...said.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
      const to = [...said.matchAll(/silence_end: (-?[\d.]+)/g)].map((m) => Number(m[1]));
      done(from.map((f, i) => [f, to[i] ?? total] as Span));
    });
  });
}

/** How much of a paragraph's time a caption takes: its letters, and the breath after it. */
const weight = (c: Caption, next: Caption | undefined) => c.text.length + (!next || next.opens ? 6 : 2);

/** The beginnings of the captions of one paragraph that is spoken from `a` to `b`, given the pauses inside it. */
function inside(caps: Caption[], a: number, b: number, pauses: Span[]): { at: number[]; found: number } {
  const w = caps.map((c, i) => weight(c, caps[i + 1])), all = w.reduce((n, x) => n + x, 0);
  const n = caps.length - 1;
  if (n < 1) return { at: [a], found: 0 };
  // where each caption after the first would begin by its share, and how far from there a pause may lie
  const due: number[] = []; let run = 0;
  for (let k = 0; k < n; k++) { run += w[k]; due.push(a + (b - a) * (run / all)); }
  const reach = Math.max(0.9, 0.12 * (b - a));
  const cost = (k: number, p: Span): number => {
    const far = Math.abs((p[0] + p[1]) / 2 - due[k]);
    if (far > reach) return Infinity;
    const long = Math.min(p[1] - p[0], 0.7) / 0.7;
    return far / reach - (caps[k + 1].opens ? 0.9 : 0.3) * long;
  };
  const alone = (k: number) => (caps[k + 1].opens ? 0.9 : 0.35);
  // the cheapest way to give the beginnings pauses in their order, some of them none
  const m = pauses.length;
  const best: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(Infinity));
  const took: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(-2));
  best[0].fill(0);
  for (let k = 1; k <= n; k++) for (let j = 0; j <= m; j++) {
    // beginning k-1 with the pauses before j to choose from
    let c = best[k - 1][j] + alone(k - 1), t = -1;
    if (j > 0) {
      if (best[k][j - 1] < c) { c = best[k][j - 1]; t = took[k][j - 1]; }
      const with_ = best[k - 1][j - 1] + cost(k - 1, pauses[j - 1]);
      if (with_ < c) { c = with_; t = j - 1; }
    }
    best[k][j] = c; took[k][j] = t;
  }
  const chosen = new Array<number>(n).fill(-1);
  for (let k = n, j = m; k >= 1; k--) {
    const t = took[k][j];
    if (t >= 0) { chosen[k - 1] = t; j = t; }
  }
  // a caption comes up a moment before its first word
  const at: number[] = [a];
  let found = 0;
  for (let k = 0; k < n; k++) at.push(chosen[k] >= 0 ? (found++, pauses[chosen[k]][1] - 0.1) : NaN);
  // the ones with no pause of their own: by their share between the two found on either side
  for (let i = 1; i < at.length; i++) {
    if (!Number.isNaN(at[i])) continue;
    let j = i; while (j < at.length && Number.isNaN(at[j])) j++;
    const from = at[i - 1], to = j < at.length ? at[j] : b;
    const span = w.slice(i - 1, j).reduce((x, y) => x + y, 0);
    let part = 0;
    for (let k = i; k < j; k++) { part += w[k - 1]; at[k] = from + (to - from) * (part / span); }
    i = j;
  }
  for (let i = 1; i < at.length; i++) at[i] = Math.max(at[i], at[i - 1] + 0.3);
  return { at, found };
}

/**
 * `known` is where each paragraph is spoken, from the script that has just put the recording together. Without it
 * the paragraphs are found by the silences between them.
 */
export async function cuesOf(file: string, paragraphs: string[], total: number, known?: Span[]): Promise<Cues> {
  const caps = captions(paragraphs);
  const short = await quiet(file, -35, 0.14, total);
  // where the voice begins and ends in the whole recording
  const first = short.find((s) => s[0] < 0.05)?.[1] ?? 0, last = short.filter((s) => s[1] > total - 0.05).pop()?.[0] ?? total;
  // the silences between paragraphs are the longest there are: a voice may also stop for nearly a second inside one
  const between = (await quiet(file, -45, 0.9, total)).filter((s) => s[0] > 0.3 && s[1] < total - 0.05);
  const long = [...between].sort((x, y) => (y[1] - y[0]) - (x[1] - x[0])).slice(0, paragraphs.length - 1).sort((x, y) => x[0] - y[0]);
  const whole = !!known || long.length === paragraphs.length - 1;
  let spans: Span[];
  if (known) spans = known;
  else if (whole) {
    const edges = [first, ...long.flatMap((s) => [s[0], s[1]]), last];
    spans = paragraphs.map((_, i) => [edges[i * 2], edges[i * 2 + 1]] as Span);
  } else {
    // the silences do not match the paragraphs: every paragraph gets its share of the whole
    const letters = paragraphs.map((p) => p.length), sum = letters.reduce((n, x) => n + x, 0);
    let run = 0;
    spans = paragraphs.map((_, i) => { const from = first + (last - first) * (run / sum); run += letters[i]; return [from, first + (last - first) * (run / sum)] as Span; });
  }
  const cues: number[] = [], rests: number[] = [];
  let found = 0, shared = 0;
  paragraphs.forEach((_, p) => {
    const mine = caps.filter((c) => c.p === p), [a, b] = spans[p];
    const pauses = short.filter((s) => s[0] > a + 0.25 && s[1] < b - 0.25);
    const got = inside(mine, a, b, pauses);
    got.at.forEach((t, i) => cues.push(Math.round(Math.max(0, i === 0 ? t - 0.1 : t) * 100) / 100));
    rests.push(Math.round(b * 100) / 100);
    found += got.found; shared += mine.length - 1 - got.found;
  });
  for (let i = 1; i < cues.length; i++) if (cues[i] <= cues[i - 1]) cues[i] = Math.round((cues[i - 1] + 0.3) * 100) / 100;
  return { cues, rests, found, shared, whole };
}
