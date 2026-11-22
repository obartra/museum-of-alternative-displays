/**
 * What the guide says, cut into captions: one sentence at a time, and a long sentence in pieces, so that a caption
 * fits on two lines of a phone. The list of a recording's times (src/data/tour-audio.json, "cues") follows this
 * order, one time for each caption, so the cutting must give the same pieces wherever it runs.
 */
export interface Caption {
  /** Which paragraph of the part it belongs to, from 0. */
  p: number;
  text: string;
  /** Whether it opens a sentence. The other pieces go on with one. */
  opens: boolean;
}

/** Scripts written without spaces, where a letter is twice as wide. */
const WIDE = /[぀-ヿ㐀-鿿＀-￯]/;
/** The most letters of a caption: two lines of a narrow phone. */
export const captionRoom = (text: string): number => (WIDE.test(text) ? 36 : 80);

/** The sentences of a paragraph. An initial such as the D. of J. D. Albert ends none. */
function sentences(text: string): string[] {
  const out: string[] = [];
  let from = 0;
  const re = /[.?!…]+["”’»)\]]*\s+|[。？！]+[」』”）]*/g;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const end = m.index + m[0].length, said = text.slice(from, end);
    if (/(^|[\s(])\p{Lu}\.\s+$/u.test(said) && /^\p{Lu}/u.test(text.slice(end))) continue;
    if (!text.slice(end).trim()) break;
    out.push(said.trim());
    from = end;
  }
  const rest = text.slice(from).trim();
  if (rest) out.push(rest);
  return out;
}

/** One sentence in pieces that fit: cut after the comma, semicolon or colon nearest its middle, or else between two words. */
function pieces(sentence: string, room: number): string[] {
  if (sentence.length <= room) return [sentence];
  const wide = WIDE.test(sentence), mid = sentence.length / 2;
  const best = (re: RegExp): number => {
    let at = -1;
    for (let m = re.exec(sentence); m; m = re.exec(sentence)) {
      const end = m.index + m[0].length;
      if (end < 8 || sentence.length - end < 8) continue;
      if (at < 0 || Math.abs(end - mid) < Math.abs(at - mid)) at = end;
    }
    return at;
  };
  let at = best(wide ? /[、，；：]/g : /[,;:]\s+/g);
  // a cut far from the middle leaves one piece too long to be worth it: then the words decide
  if (at < 0 || Math.abs(at - mid) > sentence.length * 0.3) {
    const word = wide ? Math.round(mid) : best(/\s+/g);
    if (at < 0 || (word > 0 && Math.max(word, sentence.length - word) <= room)) at = word > 0 ? word : at;
  }
  if (at <= 0 || at >= sentence.length) return [sentence];
  return [...pieces(sentence.slice(0, at).trim(), room), ...pieces(sentence.slice(at).trim(), room)];
}

export function captions(paragraphs: string[]): Caption[] {
  const out: Caption[] = [];
  paragraphs.forEach((text, p) => {
    const room = captionRoom(text);
    for (const s of sentences(text)) pieces(s, room).forEach((piece, i) => out.push({ p, text: piece, opens: i === 0 }));
  });
  return out;
}
