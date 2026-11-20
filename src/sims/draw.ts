/**
 * The museum's shared test signal is the time of day. Every working piece shows it in its own physics,
 * so these helpers turn "now" into digits, dots and segments.
 */

export interface Now { h: number; m: number; s: number; ms: number; hhmm: string; hhmmss: string; digits: number[] }

export function now(): Now {
  const d = new Date();
  const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
  const p = (n: number) => String(n).padStart(2, '0');
  return { h, m, s, ms: d.getMilliseconds(), hhmm: `${p(h)}:${p(m)}`, hhmmss: `${p(h)}:${p(m)}:${p(s)}`, digits: [...p(h), ...p(m), ...p(s)].map(Number) };
}

/** 5 by 7 dot patterns, one string per row. */
const FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['0', '0', '1', '0', '1', '0', '0'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
};

/** A string as a grid of dots, 7 rows high, one blank column between characters. */
export function dots(text: string): { w: number; h: number; on: (x: number, y: number) => boolean } {
  const rows: string[] = ['', '', '', '', '', '', ''];
  [...text].forEach((ch, i) => {
    const g = FONT[ch] ?? FONT[' '];
    for (let r = 0; r < 7; r++) rows[r] += (i ? '0' : '') + g[r];
  });
  return { w: rows[0].length, h: 7, on: (x, y) => rows[y]?.[x] === '1' };
}

/** Which of the seven segments (a to g, clockwise from the top, g in the middle) are lit for each digit. */
export const SEG: Record<number, string> = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };

/** Segment end points in a unit box 1 wide and 2 high, y up. */
export const SEG_LINES: Record<string, [number, number, number, number]> = {
  a: [0.12, 2, 0.88, 2], b: [1, 1.88, 1, 1.12], c: [1, 0.88, 1, 0.12], d: [0.12, 0, 0.88, 0],
  e: [0, 0.88, 0, 0.12], f: [0, 1.88, 0, 1.12], g: [0.12, 1, 0.88, 1],
};

/** Draw a seven segment digit into a box. `off` may be null to leave unlit segments out. */
export function seg7(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, digit: number, on: string, off: string | null, thick = 0.16): void {
  const lit = SEG[digit] ?? '';
  const t = thick * w;
  ctx.lineCap = 'round';
  ctx.lineWidth = t;
  for (const k of 'abcdefg') {
    const isOn = lit.includes(k);
    if (!isOn && !off) continue;
    const [x0, y0, x1, y1] = SEG_LINES[k];
    ctx.strokeStyle = isOn ? on : off!;
    ctx.beginPath();
    ctx.moveTo(x + t / 2 + x0 * (w - t), y + t / 2 + (1 - y0 / 2) * (h - t));
    ctx.lineTo(x + t / 2 + x1 * (w - t), y + t / 2 + (1 - y1 / 2) * (h - t));
    ctx.stroke();
  }
}

/** HH:MM or HH:MM:SS in seven segment digits, centred in the canvas. */
export function segClock(ctx: CanvasRenderingContext2D, W: number, H: number, n: Now, on: string, off: string | null, withSeconds: boolean, glow = 0): void {
  const groups = withSeconds ? 3 : 2;
  const dw = Math.min(W / (groups * 2.55 + 0.4), H * 0.36);
  const dh = dw * 1.85;
  const total = groups * 2 * dw * 1.18 + (groups - 1) * dw * 0.55;
  let x = (W - total) / 2 + dw * 0.09;
  const y = (H - dh) / 2;
  ctx.shadowColor = on; ctx.shadowBlur = glow;
  for (let g = 0; g < groups; g++) {
    for (let i = 0; i < 2; i++) { seg7(ctx, x, y, dw, dh, n.digits[g * 2 + i], on, off); x += dw * 1.18; }
    if (g < groups - 1) {
      if (n.s % 2 === 0 || !withSeconds) {
        ctx.fillStyle = on;
        ctx.beginPath(); ctx.arc(x + dw * 0.14, y + dh * 0.32, dw * 0.08, 0, 7); ctx.arc(x + dw * 0.14, y + dh * 0.68, dw * 0.08, 0, 7); ctx.fill();
      }
      x += dw * 0.55;
    }
  }
  ctx.shadowBlur = 0;
}

/** A dot-matrix rendering of a string. Returns the cell size used. */
export function dotMatrix(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, on: string, off: string | null, round = true, fill = 0.78, glow = 0): number {
  const d = dots(text);
  const cell = Math.min(W / (d.w + 2), H / (d.h + 2));
  const ox = (W - d.w * cell) / 2, oy = (H - d.h * cell) / 2;
  const r = (cell * fill) / 2;
  ctx.shadowColor = on; ctx.shadowBlur = glow;
  for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
    const lit = d.on(x, y);
    if (!lit && !off) continue;
    ctx.fillStyle = lit ? on : off!;
    const cx = ox + (x + 0.5) * cell, cy = oy + (y + 0.5) * cell;
    if (round) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); } else ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.shadowBlur = 0;
  return cell;
}

/** Big friendly numerals for full-colour panels. */
export function bigTime(ctx: CanvasRenderingContext2D, W: number, H: number, text: string, color: string | CanvasGradient, weight = 800, size = 0.42): void {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${Math.round(H * size)}px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2);
}

export const hsl = (h: number, s: number, l: number) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;

/** Analogue clock hands as line segments in a unit circle, for vector displays and lasers. */
export function clockStrokes(n: Now): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 0.8 : 0.9;
    out.push([Math.sin(a) * r0, Math.cos(a) * r0, Math.sin(a), Math.cos(a)]);
  }
  const hand = (frac: number, len: number) => { const a = frac * Math.PI * 2; out.push([0, 0, Math.sin(a) * len, Math.cos(a) * len]); };
  hand(((n.h % 12) + n.m / 60) / 12, 0.5);
  hand((n.m + n.s / 60) / 60, 0.78);
  hand((n.s + n.ms / 1000) / 60, 0.88);
  return out;
}
