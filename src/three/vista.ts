import { NOISE, THREE } from './kit';

/**
 * What the windows look out on: Montserrat across the roofs of a Catalan town, by day and by night.
 * Painted here, not photographed. The eastern three quarters of the ridge follow a photograph of the
 * massif taken from the north; the western end is drawn from the same hand to finish it.
 * The south windows frame the mountain. The east windows let the sun in, and later the moon.
 */

type RGB = [number, number, number];

const rad = (d: number) => (d * Math.PI) / 180;
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

/** Directions are compass bearings: north is +z, east is -x, so that the mountain stands to the south, behind the stand. */
const AZ0 = 20, AZ1 = 262, SPLIT = 112, USPLIT = 0.2;
const EL0 = -19, EL1 = 7.5;
/** The stage is looked at from a little above, so the land is hung low: the mountain then stands in the window and not above it. */
const RADIUS = 90, DIP = 5.2, EYE = 1.7 - 90 * Math.tan(rad(DIP));
const SUN_AZ = 70, SUN_EL = 14;

/** Where the light comes from: low in the east-north-east, as on an early summer morning. The moon keeps the same place. */
export const SUN = new THREE.Vector3(-Math.sin(rad(SUN_AZ)) * Math.cos(rad(SUN_EL)), Math.sin(rad(SUN_EL)), Math.cos(rad(SUN_AZ)) * Math.cos(rad(SUN_EL)));

/** The skyline of Montserrat from the north, east to west, as a fraction of its height. Measured off a photograph. */
const RIDGE = [3, 8, 13, 16, 16, 17, 18, 19, 21, 23, 26, 27, 27, 31, 33, 35, 35, 38, 38, 39, 40, 41, 43, 44, 45, 47, 52, 54, 57, 60, 67, 69, 70, 70, 71, 71, 66, 64, 61, 62, 60, 62, 66, 67, 66, 61, 58, 58, 58, 60, 62, 63, 65, 66, 68, 70, 71, 70, 74, 78, 77, 75, 72, 79, 80, 78, 76, 74, 74, 81, 84, 89, 93, 92, 89, 88, 87, 86, 89, 92, 93, 93, 93, 98, 99, 93, 84, 79, 78, 81, 84, 76, 73, 78, 85, 95, 98, 98, 96, 94, 97, 94, 95, 92, 91, 91, 91, 94, 88, 86, 83, 81, 82, 80, 75, 75, 75, 72, 68, 68, 69, 71, 71, 71, 72, 72, 73, 74, 74, 75, 83, 86, 92, 93, 91, 88, 89, 93, 91, 92, 84, 85, 86, 85, 83, 82, 80, 79, 77, 77, 77, 84, 87, 88, 84, 86, 87, 84, 84, 86, 81, 78, 79, 81, 80, 68, 61, 58, 54, 52, 50];
/** The western end, past the edge of that photograph: the needles, then the fall to the pass. */
const WEST = [50, 46, 53, 63, 55, 49, 66, 75, 61, 54, 70, 82, 67, 57, 62, 73, 60, 49, 55, 44, 37, 41, 31, 24, 19, 13, 8, 4, 0];
const M_EAST = 121, M_WEST = 153, M_END = 165, M_BASE = -0.35, M_TALL = 4.3;

/** A smooth curve through evenly spaced samples, so that towers have round heads and not points. */
function through(v: number[], f: number): number {
  const i = Math.min(v.length - 2, Math.max(0, Math.floor(f))), t = f - i;
  const p0 = v[Math.max(0, i - 1)], p1 = v[i], p2 = v[i + 1], p3 = v[Math.min(v.length - 1, i + 2)];
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t) / 100;
}

function ridge(az: number): number {
  if (az < M_EAST - 3 || az > M_END) return 0;
  if (az < M_EAST) return (0.03 * (az - (M_EAST - 3))) / 3;
  if (az <= M_WEST) return Math.max(0, through(RIDGE, ((az - M_EAST) / (M_WEST - M_EAST)) * (RIDGE.length - 1)));
  return Math.max(0, through(WEST, ((az - M_WEST) / (M_END - M_WEST)) * (WEST.length - 1)));
}

function noise1(seed: number): (x: number) => number {
  const r = rng(seed), v = Array.from({ length: 512 }, () => r());
  const n = (x: number) => { const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return v[i & 511] * (1 - s) + v[(i + 1) & 511] * s; };
  return (x) => n(x) * 0.52 + n(x * 2.03 + 17) * 0.26 + n(x * 4.1 + 31) * 0.14 + n(x * 8.3 + 5) * 0.08;
}

/** The land from the window, far to near. The sky is left clear: it is drawn behind, by the dome. */
function paint(night: boolean, W: number, H: number): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d')!;
  const t0 = Math.tan(rad(EL0)), t1 = Math.tan(rad(EL1));
  const X = (az: number) => W * (az < SPLIT ? ((az - AZ0) / (SPLIT - AZ0)) * USPLIT : USPLIT + ((az - SPLIT) / (AZ1 - SPLIT)) * (1 - USPLIT));
  const AZ = (x: number) => { const u = x / W; return u < USPLIT ? AZ0 + (u / USPLIT) * (SPLIT - AZ0) : SPLIT + ((u - USPLIT) / (1 - USPLIT)) * (AZ1 - SPLIT); };
  const Y = (el: number) => H * (1 - (Math.tan(rad(el)) - t0) / (t1 - t0));
  const k = H / 704;                               // every size below was chosen at 704 rows
  /** The east end of the picture is squeezed sideways; things drawn there are squeezed to match. */
  const squeeze = (x: number) => (x < USPLIT * W ? (USPLIT / (SPLIT - AZ0)) / ((1 - USPLIT) / (AZ1 - SPLIT)) : 1);
  const HAZE: RGB = [208, 212, 212];
  // by night nothing is lit but by the moon: everything falls to a few blues
  const tone = (d: RGB): RGB => (night ? [d[0] * 0.075 + 3, d[1] * 0.1 + 5, d[2] * 0.19 + 11] : d);
  const col = (d: RGB, a = 1) => css(tone(d), a);
  const under = (f: (az: number) => number, top: RGB, bottom: RGB, depth: number) => {
    c.beginPath(); c.moveTo(0, H);
    let hi = H;
    for (let x = 0; x <= W; x += 2) { const y = Y(f(AZ(x))); hi = Math.min(hi, y); c.lineTo(x, y); }
    c.lineTo(W, H); c.closePath();
    const g = c.createLinearGradient(0, hi, 0, hi + depth * k);
    g.addColorStop(0, col(top)); g.addColorStop(1, col(bottom));
    c.fillStyle = g; c.fill();
  };

  // ---- ranges a long way off, the last blue before the sky
  const far1 = noise1(3), far2 = noise1(4);
  under((az) => 0.2 + 1.1 * far1(az * 0.045), [190, 200, 212], [200, 208, 215], 30);
  under((az) => -0.1 + 0.8 * far2(az * 0.08 + 9), [170, 183, 199], [188, 198, 208], 30);

  // ---- the mountain
  const rough = noise1(7), long = noise1(8);
  const top = (az: number) => { const r = ridge(az); return r <= 0 ? -9 : M_BASE + M_TALL * r * (1 + 0.03 * (rough(az * 6) - 0.5)); };
  const x0 = X(M_EAST - 3), x1 = X(M_END), yBase = Y(M_BASE);
  c.save();
  c.beginPath(); c.moveTo(x0, yBase);
  for (let x = x0; x <= x1; x += 1) c.lineTo(x, Y(Math.max(M_BASE, top(AZ(x)))));
  c.lineTo(x1, yBase); c.lineTo(x1, Y(M_BASE - 1.2)); c.lineTo(x0, Y(M_BASE - 1.2)); c.closePath();
  const body = c.createLinearGradient(0, Y(M_BASE + M_TALL), 0, Y(M_BASE - 0.4));
  body.addColorStop(0, col([126, 137, 156])); body.addColorStop(0.55, col([140, 151, 168])); body.addColorStop(1, col([166, 175, 187]));
  c.fillStyle = body; c.fill(); c.clip();
  // the towers: where the crest climbs to the west a tower shows its eastern flank to the low sun, where it falls the flank is in shade
  const r = rng(21);
  for (let x = x0; x < x1; x += 2 * k) {
    const az = AZ(x), h = top(az), slope = (top(az + 0.1) - top(az - 0.1)) / 0.2;
    if (h < M_BASE + 0.15) continue;
    const yt = Y(h), len = (yBase - yt) * (0.5 + 0.4 * long(az * 1.7)), a = Math.min(0.55, Math.abs(slope) * 0.34) * (0.75 + 0.25 * r());
    if (a < 0.03) continue;
    const tint: RGB = slope > 0 ? (night ? [170, 190, 235] : [204, 208, 214]) : [94, 106, 130];
    const g = c.createLinearGradient(0, yt, 0, yt + len);
    g.addColorStop(0, col(tint, a)); g.addColorStop(0.6, col(tint, a * 0.45)); g.addColorStop(1, col(tint, 0));
    c.fillStyle = g; c.fillRect(x, yt, 2 * k + 0.5, len);
  }
  // clefts between towers, and the bedding of the conglomerate
  for (let i = 0; i < 300; i++) {
    const az = M_EAST + r() * (M_END - M_EAST), h = top(az); if (h < M_BASE + 0.5) continue;
    const x = X(az), yt = Y(h) + r() * 10 * k;
    c.strokeStyle = col([80, 94, 124], 0.1 + r() * 0.2); c.lineWidth = (0.5 + r() * 1.0) * k;
    c.beginPath(); c.moveTo(x, yt); c.bezierCurveTo(x + (r() - 0.5) * 4 * k, yt + 16 * k, x + (r() - 0.5) * 6 * k, yt + 30 * k, x + (r() - 0.5) * 8 * k, yt + (26 + r() * 46) * k); c.stroke();
  }
  for (let i = 0; i < 8; i++) { const y = Y(M_BASE + M_TALL * (0.2 + i * 0.09)) + (r() - 0.5) * 4; c.fillStyle = col([96, 110, 138], 0.05 + r() * 0.05); c.fillRect(x0, y, x1 - x0, (1 + r() * 1.4) * k); }
  // pinewoods on the lower slopes, climbing unevenly
  const wood = noise1(9);
  c.beginPath(); c.moveTo(x0, Y(M_BASE - 1.2));
  for (let x = x0; x <= x1; x += 2) { const az = AZ(x); c.lineTo(x, Y(M_BASE + Math.min(top(az) - M_BASE, M_TALL * (0.12 + 0.3 * wood(az * 0.7))) * 0.92)); }
  c.lineTo(x1, Y(M_BASE - 1.2)); c.closePath();
  const pine = c.createLinearGradient(0, Y(M_BASE + M_TALL * 0.4), 0, yBase);
  pine.addColorStop(0, col([108, 124, 134], 0.7)); pine.addColorStop(1, col([134, 147, 152], 0.92));
  c.fillStyle = pine; c.fill();
  c.restore();

  // ---- hills between: pine and holm oak, a few fields, a farmhouse here and there
  const hills: [(az: number) => number, RGB, RGB, number][] = [
    [((n, m) => (az: number) => -0.9 + 0.5 * n(az * 0.1 + 3) + 0.6 * Math.pow(m(az * 0.03 + 5), 2))(noise1(11), noise1(15)), [132, 144, 150], [146, 156, 158], 0.5],
    [((n, m) => (az: number) => -2.0 + 0.7 * n(az * 0.15 + 11) + 1.0 * Math.pow(m(az * 0.04 + 1), 2))(noise1(12), noise1(16)), [110, 124, 122], [128, 139, 134], 0.72],
    [((n, m) => (az: number) => -3.3 + 0.8 * n(az * 0.2 + 29) + 1.2 * Math.pow(m(az * 0.05 + 8), 2))(noise1(13), noise1(17)), [90, 106, 94], [112, 124, 110], 1],
    [((n, m) => (az: number) => -4.9 + 0.9 * n(az * 0.27 + 41) + 1.3 * Math.pow(m(az * 0.06 + 3), 2))(noise1(14), noise1(18)), [74, 92, 76], [100, 114, 96], 1.35],
  ];
  hills.forEach(([f, a, b, near], hi) => {
    under(f, a, b, 60);
    const hr = rng(40 + hi);
    // the lit and the shaded side of every rise
    for (let x = 0; x < W; x += 3 * k) {
      const az = AZ(x), slope = (f(az + 0.4) - f(az - 0.4)) / 0.8, y = Y(f(az));
      const g = c.createLinearGradient(0, y, 0, y + 40 * k * near);
      const tint: RGB = slope > 0 ? [206, 208, 190] : [50, 64, 60], al = Math.min(0.3, Math.abs(slope) * 0.9);
      g.addColorStop(0, col(tint, al)); g.addColorStop(1, col(tint, 0));
      c.fillStyle = g; c.fillRect(x, y, 3 * k + 0.5, 40 * k * near);
    }
    // crowns along the crest and through the woods below it
    for (let x = 0; x < W; x += (2 + hr() * 3) * k * squeeze(x)) {
      const az = AZ(x), y = Y(f(az)), s = (1.2 + hr() * 2.2) * k * near;
      c.fillStyle = col(mix(a, [44, 60, 50], 0.25 + hr() * 0.3), 0.55); c.beginPath(); c.ellipse(x, y + s * 0.35, s * squeeze(x), s * 0.8, 0, 0, 7); c.fill();
    }
    for (let i = 0; i < 900 * near; i++) {
      const x = hr() * W, az = AZ(x), y = Y(f(az)) + (3 + hr() * 46) * k, s = (1.5 + hr() * 4) * k * near;
      c.fillStyle = hr() > 0.35 ? col(mix(a, [44, 60, 50], 0.4), 0.22) : col(mix(a, [196, 200, 188], 0.45), 0.16);
      c.beginPath(); c.ellipse(x, y, s * 1.7 * squeeze(x), s * 0.55, 0, 0, 7); c.fill();
    }
    // fields and farmhouses on the two nearer ranges
    if (hi > 0) for (let i = 0; i < 34; i++) {
      const x = hr() * W, az = AZ(x), y = Y(f(az)) + (12 + hr() * 30) * k, w = (12 + hr() * 30) * k * near * squeeze(x);
      c.fillStyle = col(hr() > 0.5 ? [188, 180, 144] : [156, 164, 124], 0.55);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y - 1.5 * k); c.lineTo(x + w * 1.15, y + 3.5 * k); c.lineTo(x + w * 0.1, y + 5 * k); c.closePath(); c.fill();
      if (hr() > 0.4) {
        const hx = x + w * hr(), hw = (3 + hr() * 3) * k * near * squeeze(x), hh = (2 + hr() * 1.6) * k * near;
        c.fillStyle = col([228, 222, 208]); c.fillRect(hx, y - hh, hw, hh);
        c.fillStyle = col([172, 108, 86]); c.fillRect(hx - 0.6 * k, y - hh - 1.4 * k, hw + 1.2 * k, 1.6 * k);
        if (night && hr() > 0.4) { c.fillStyle = 'rgba(255,206,140,.95)'; c.fillRect(hx + hw * 0.4, y - hh * 0.6, Math.max(1, k), Math.max(1, k)); }
      }
    }
  });
  if (night) {
    // villages at the foot of the mountain, and the road between them
    const vr = rng(77);
    for (const [az0, n, spread] of [[126, 40, 4], [141, 60, 5], [156, 30, 3], [176, 46, 4], [203, 40, 5], [232, 36, 5], [92, 26, 9], [56, 22, 10]] as const) for (let i = 0; i < n; i++) {
      const az = az0 + (vr() + vr() - 1) * spread, x = X(az), y = Y(-0.95 - vr() * 1.2 - Math.abs(az - az0) * 0.03);
      c.fillStyle = vr() > 0.25 ? `rgba(255,${190 + vr() * 40},${110 + vr() * 50},${0.5 + vr() * 0.5})` : `rgba(220,232,255,${0.5 + vr() * 0.4})`;
      const s = (0.9 + vr() * 0.9) * k; c.fillRect(x, y, s, s);
    }
  } else {
    // morning haze lying in the valley
    const hz = c.createLinearGradient(0, Y(1.6), 0, Y(-7.5));
    hz.addColorStop(0, css(HAZE, 0)); hz.addColorStop(0.3, css(HAZE, 0.3)); hz.addColorStop(1, css(HAZE, 0));
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = hz; c.fillRect(0, Y(1.6), W, Y(-7.5) - Y(1.6)); c.globalCompositeOperation = 'source-over';
  }

  // ---- the town, street behind street, down to the roofs under the window
  const tr = rng(101);
  const WALLS: RGB[] = [[224, 212, 190], [206, 190, 166], [232, 226, 212], [214, 184, 156], [196, 174, 150], [222, 202, 166], [236, 232, 222], [208, 196, 180], [190, 150, 126]];
  const ROOFS: RGB[] = [[186, 112, 84], [170, 100, 76], [198, 130, 102], [178, 118, 94], [158, 96, 76]];
  const BLIND: RGB[] = [[214, 206, 190], [126, 144, 122], [180, 168, 150], [150, 96, 78]];
  const pick = <T,>(v: T[]) => v[Math.floor(tr() * v.length)];
  const lamps: [number, number, number, boolean][] = [];
  const crown = (x: number, y: number, s: number, fade: number) => {
    const tall = tr() > 0.9, green = mix(pick<RGB>([[66, 88, 62], [52, 74, 56], [84, 102, 70], [58, 80, 66]]), HAZE, fade), q = squeeze(x);
    const n = tall ? 1 : 2 + Math.floor(tr() * 3);
    for (let i = 0; i < n; i++) {
      const cx = x + (tall ? 0 : (tr() - 0.5) * s * 1.4 * q), cy = y - s * (tall ? 1.5 : 0.5 + tr() * 0.5), rx = s * (tall ? 0.26 : 0.6 + tr() * 0.4) * q, ry = s * (tall ? 1.6 : 0.5 + tr() * 0.3);
      c.fillStyle = col(green); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fill();
      c.fillStyle = col(mix(green, [176, 182, 132], 0.4), 0.55); c.beginPath(); c.ellipse(cx - rx * 0.3, cy - ry * 0.3, rx * 0.55, ry * 0.5, 0, 0, 7); c.fill();
      c.fillStyle = col(mix(green, [24, 36, 34], 0.5), 0.45); c.beginPath(); c.ellipse(cx + rx * 0.3, cy + ry * 0.35, rx * 0.6, ry * 0.45, 0, 0, 7); c.fill();
    }
  };
  const ROWS = 28;
  for (let row = 0; row < ROWS; row++) {
    const d = row / (ROWS - 1), fade = Math.pow(1 - d, 1.15) * 0.72;
    const el = -5.9 - 12.8 * Math.pow(d, 1.5), base = Y(el);
    const storey = (1.7 + 31 * Math.pow(d, 1.75)) * k;
    const thin = row < 4 ? 0.55 - row * 0.1 : 0;       // the first streets straggle up the hill
    for (let x = -tr() * 60 * k; x < W;) {
      const q = squeeze(x), kind = tr();
      if (tr() < thin || kind < 0.13) { const s = storey * (1 + tr() * 1.6); crown(x + s * q, base + tr() * storey, s, fade); x += s * 2.2 * q; continue; }
      const y = base + (tr() - 0.5) * storey * 1.7;
      // the faces we see look north and stand in their own shade; the sun is on the roofs and the east gables
      let wall = pick(WALLS); wall = mix([wall[0] * 0.84, wall[1] * 0.84, wall[2] * 0.87], HAZE, fade);
      const glass: RGB = mix(mix([74, 82, 92], wall, 0.22), HAZE, fade * 0.6);
      const home = tr();                                 // how many people are in tonight
      const windows = (x: number, top: number, w: number, bays: number, floors: number, balcony: boolean) => {
        if (storey < 2.4 * k) return;
        const ww = (w / bays) * (0.36 + tr() * 0.1), wh = storey * 0.52;
        for (let f = 0; f < floors; f++) for (let b = 0; b < bays; b++) {
          const wx = x + (b + 0.5) * (w / bays) - ww / 2, wy = top + f * storey + storey * 0.24;
          const lit = night && tr() < home * 0.3, blind = !lit && tr() < 0.32;
          if (balcony && storey > 5 * k && b % 2 === 0) { c.fillStyle = col(mix(wall, [30, 34, 40], 0.34)); c.fillRect(wx - ww * 0.5, wy - storey * 0.04, ww * 2, storey * 0.62); }
          if (lit) { c.fillStyle = tr() > 0.2 ? `rgb(255,${196 + Math.round(tr() * 34)},${124 + Math.round(tr() * 50)})` : 'rgb(214,230,255)'; if (storey > 5 * k) lamps.push([wx + ww / 2, wy + wh / 2, storey * 0.7, false]); }
          else c.fillStyle = blind ? col(mix(pick(BLIND), HAZE, fade)) : col(glass);
          c.fillRect(wx, wy, ww, wh);
          if (storey > 9 * k && !lit && !blind) { c.fillStyle = col([156, 170, 184], 0.3); c.fillRect(wx, wy, ww, wh * 0.28); }
          if (balcony && storey > 5 * k && b % 2 === 0) { c.fillStyle = col(mix(wall, [255, 255, 255], 0.12)); c.fillRect(wx - ww * 0.55, wy + wh * 0.62, ww * 2.1, storey * 0.3); c.fillStyle = col(mix(wall, [30, 34, 40], 0.45)); c.fillRect(wx - ww * 0.55, wy + wh * 0.62 + storey * 0.3, ww * 2.1, Math.max(1, storey * 0.05)); }
        }
      };
      const face = (x: number, top: number, w: number, h: number) => {
        const g = c.createLinearGradient(0, top, 0, top + h);
        g.addColorStop(0, col(mix(wall, [255, 250, 240], 0.08))); g.addColorStop(1, col(mix(wall, [60, 60, 66], 0.12)));
        c.fillStyle = g; c.fillRect(x, top, w, h + storey);
        if (tr() < 0.6) { c.fillStyle = col(mix(mix(wall, [255, 238, 208], 0.55), HAZE, fade * 0.4)); c.fillRect(x, top, Math.max(1.2, w * (0.05 + tr() * 0.09)), h + storey); }
      };
      let w = 0;
      if (kind < 0.42) {
        // a block of flats: a flat roof, a penthouse, balconies in stacks
        const floors = 3 + Math.floor(tr() * 5), bays = 3 + Math.floor(tr() * 4), h = floors * storey; w = bays * storey * (1.15 + tr() * 0.3) * q;
        face(x, y - h, w, h); windows(x, y - h, w, bays, floors, tr() > 0.35);
        c.fillStyle = col(mix([198, 194, 186], HAZE, fade)); c.fillRect(x - k, y - h - storey * 0.18, w + 2 * k, storey * 0.22);
        if (tr() > 0.35) { const bw = w * (0.2 + tr() * 0.25), bx = x + tr() * (w - bw); c.fillStyle = col(mix([210, 200, 184], HAZE, fade)); c.fillRect(bx, y - h - storey * 0.85, bw, storey * 0.7); c.fillStyle = col(mix([176, 108, 84], HAZE, fade)); c.fillRect(bx - k, y - h - storey * 0.97, bw + 2 * k, storey * 0.14); }
        if (storey > 6 * k && tr() > 0.4) { c.strokeStyle = col([80, 84, 90], 0.8); c.lineWidth = Math.max(0.8, k); const ax = x + tr() * w; c.beginPath(); c.moveTo(ax, y - h - storey * 0.1); c.lineTo(ax, y - h - storey * 1.4); c.moveTo(ax - storey * 0.22, y - h - storey * 1.2); c.lineTo(ax + storey * 0.22, y - h - storey * 1.2); c.moveTo(ax - storey * 0.15, y - h - storey * 1.05); c.lineTo(ax + storey * 0.15, y - h - storey * 1.05); c.stroke(); }
      } else if (kind < 0.93) {
        // an older house: two to four floors under a low tiled roof, seen along its eaves or end on
        const floors = 2 + Math.floor(tr() * 3), bays = 2 + Math.floor(tr() * 3), h = floors * storey; w = bays * storey * (1.1 + tr() * 0.4) * q;
        const roof = mix(pick(ROOFS), HAZE, fade), eave = storey * 0.14 * q, rh = storey * (0.4 + tr() * 0.35);
        face(x, y - h, w, h); windows(x, y - h, w, bays, floors, false);
        if (tr() < 0.3) {
          c.fillStyle = col(wall); c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w / 2, y - h - rh * 1.2); c.lineTo(x + w, y - h); c.closePath(); c.fill();
          c.strokeStyle = col(roof); c.lineWidth = Math.max(1.2, storey * 0.16); c.beginPath(); c.moveTo(x - eave, y - h + storey * 0.06); c.lineTo(x + w / 2, y - h - rh * 1.2); c.lineTo(x + w + eave, y - h + storey * 0.06); c.stroke();
        } else {
          const hip = rh * (0.3 + tr() * 0.5) * q;
          c.fillStyle = col(roof); c.beginPath(); c.moveTo(x - eave, y - h); c.lineTo(x + hip, y - h - rh); c.lineTo(x + w - hip, y - h - rh); c.lineTo(x + w + eave, y - h); c.closePath(); c.fill();
          c.fillStyle = col(mix(roof, [255, 226, 190], 0.36)); c.beginPath(); c.moveTo(x - eave, y - h); c.lineTo(x + hip, y - h - rh); c.lineTo(x + hip + w * 0.1, y - h - rh); c.lineTo(x + w * 0.16, y - h); c.closePath(); c.fill();
          c.fillStyle = col(mix(roof, [60, 40, 36], 0.45)); c.fillRect(x - eave, y - h - Math.max(1, storey * 0.04), w + eave * 2, Math.max(1, storey * 0.08));
          if (rh > 9 * k) { c.strokeStyle = col(mix(roof, [70, 44, 38], 0.5), 0.3); c.lineWidth = Math.max(0.7, 0.8 * k); for (let ty = y - h - rh + 2.5 * k; ty < y - h; ty += 3 * k) { const u = (ty - (y - h - rh)) / rh; c.beginPath(); c.moveTo(x + hip * (1 - u) - eave * u, ty); c.lineTo(x + w - hip * (1 - u) + eave * u, ty); c.stroke(); } }
          if (tr() > 0.45) { const cx = x + w * (0.25 + tr() * 0.5); c.fillStyle = col(mix([196, 182, 164], HAZE, fade)); c.fillRect(cx, y - h - rh - storey * 0.3, storey * 0.28 * q, storey * 0.5); }
        }
      } else if (kind < 0.988 || d < 0.12 || d > 0.6) {
        // a mill: long, low, lit from a saw-tooth roof
        const teeth = 3 + Math.floor(tr() * 5), h = storey * (1.5 + tr()); w = teeth * storey * 1.5 * q;
        wall = mix([wall[0] * 0.93, wall[1] * 0.88, wall[2] * 0.84], HAZE, fade * 0.3);
        face(x, y - h, w, h); windows(x, y - h + storey * 0.2, w, teeth * 2, 1, false);
        for (let i = 0; i < teeth; i++) {
          const tx = x + (i * w) / teeth, tw = w / teeth;
          c.fillStyle = col(mix([204, 204, 198], HAZE, fade)); c.beginPath(); c.moveTo(tx, y - h); c.lineTo(tx + tw * 0.3, y - h - storey * 0.7); c.lineTo(tx + tw, y - h); c.closePath(); c.fill();
          c.fillStyle = night && home > 0.8 ? 'rgb(255,214,150)' : col(mix([90, 100, 110], HAZE, fade)); c.beginPath(); c.moveTo(tx, y - h); c.lineTo(tx + tw * 0.3, y - h - storey * 0.7); c.lineTo(tx + tw * 0.3, y - h); c.closePath(); c.fill();
        }
      } else {
        // a church: a nave and a square tower
        const tw = storey * 2.4 * q, th = storey * 9; w = storey * 7 * q;
        wall = mix([186, 172, 152], HAZE, fade);
        face(x, y - storey * 4, w, storey * 4);
        c.fillStyle = col(mix(ROOFS[0], HAZE, fade)); c.beginPath(); c.moveTo(x - storey * 0.2, y - storey * 4); c.lineTo(x + w * 0.5, y - storey * 5.3); c.lineTo(x + w + storey * 0.2, y - storey * 4); c.closePath(); c.fill();
        face(x + w, y - th, tw, th);
        c.fillStyle = col(mix([52, 56, 64], wall, 0.2)); for (const s of [0.28, 0.62]) c.fillRect(x + w + tw * s, y - th + storey * 0.8, tw * 0.14, storey * 1.3);
        c.fillStyle = col(mix(ROOFS[1], HAZE, fade)); c.beginPath(); c.moveTo(x + w - storey * 0.15, y - th); c.lineTo(x + w + tw / 2, y - th - storey * 1.6); c.lineTo(x + w + tw + storey * 0.15, y - th); c.closePath(); c.fill();
        w += tw;
      }
      if (night && d > 0.1 && tr() > 0.5) lamps.push([x + w + storey * 0.3 * q, y + storey * 0.4, storey * 1.1, true]);
      if (tr() < 0.5) { const s = storey * (0.9 + tr() * 1.5); crown(x + w + s * 0.8 * q, y + storey * 0.6, s, fade); x += s * 1.4 * q; }
      x += w + storey * tr() * 0.5 * q;
    }
  }
  if (night) {
    // street lamps, and the little light that windows throw
    c.globalCompositeOperation = 'lighter';
    for (const [x, y, s, street] of lamps) {
      const rr = Math.max(1.5 * k, s);
      const g = c.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, street ? 'rgba(255,186,104,.7)' : 'rgba(255,206,140,.16)'); g.addColorStop(0.25, street ? 'rgba(255,176,96,.22)' : 'rgba(255,196,130,.08)'); g.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      if (street) { c.fillStyle = 'rgba(255,236,200,.95)'; c.fillRect(x - 0.6 * k, y - 0.6 * k, Math.max(1, 1.2 * k), Math.max(1, 1.2 * k)); }
    }
    c.globalCompositeOperation = 'source-over';
  }

  // ---- the grain of a photograph, so that no patch of colour is quite flat
  if (!night) {
    const mask = document.createElement('canvas'); mask.width = W; mask.height = H; mask.getContext('2d')!.drawImage(cv, 0, 0);
    const g = document.createElement('canvas'); g.width = g.height = 256;
    const gc = g.getContext('2d')!, gi = gc.createImageData(256, 256), gr = rng(303);
    for (let i = 0; i < 256 * 256; i++) { const v = 128 + (gr() + gr() - 1) * 70; gi.data[i * 4] = gi.data[i * 4 + 1] = gi.data[i * 4 + 2] = v; gi.data[i * 4 + 3] = 255; }
    gc.putImageData(gi, 0, 0);
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.16; c.fillStyle = c.createPattern(g, 'repeat')!; c.fillRect(0, 0, W, H); c.restore();
    // overlay paints the clear sky too: take that back
    c.globalCompositeOperation = 'destination-in'; c.drawImage(mask, 0, 0); c.globalCompositeOperation = 'source-over';
  }

  // ---- let the ends melt into the distance
  c.globalCompositeOperation = 'destination-out';
  for (const [a, b] of [[0, 0.03], [1, 0.975]]) { const g = c.createLinearGradient(a * W, 0, b * W, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(Math.min(a, b) * W, 0, Math.abs(b - a) * W, H); }
  c.globalCompositeOperation = 'source-over';
  return cv;
}

let painted: { day: HTMLCanvasElement; night: HTMLCanvasElement } | undefined;
/** Both pictures, painted once however many stages ask. */
export function pictures(): { day: HTMLCanvasElement; night: HTMLCanvasElement } {
  painted ??= { day: paint(false, 4096, 704), night: paint(true, 2048, 352) };
  return painted;
}

export interface Vista { group: THREE.Group; set: (L: number) => void }

/** The sky and the land beyond the walls. `set` moves it between day (1) and night (0). */
export function vista(): Vista {
  const group = new THREE.Group();
  const uL = { value: 1 };
  const { day, night } = pictures();
  const tex = (cv: HTMLCanvasElement) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  // the land: a tall band standing in a part circle well beyond the walls
  const N = 120, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const yBot = EYE + RADIUS * Math.tan(rad(EL0)), yTop = EYE + RADIUS * Math.tan(rad(EL1));
  for (let i = 0; i <= N; i++) {
    const az = AZ0 + ((AZ1 - AZ0) * i) / N, u = az < SPLIT ? ((az - AZ0) / (SPLIT - AZ0)) * USPLIT : USPLIT + ((az - SPLIT) / (AZ1 - SPLIT)) * (1 - USPLIT);
    const x = -Math.sin(rad(az)) * RADIUS, z = Math.cos(rad(az)) * RADIUS;
    pos.push(x, yBot, z, x, yTop, z); uv.push(u, 0, u, 1);
    if (i < N) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  }
  const band = new THREE.BufferGeometry();
  band.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); band.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); band.setIndex(idx);
  const land = new THREE.Mesh(band, new THREE.ShaderMaterial({
    uniforms: { tDay: { value: tex(day) }, tNight: { value: tex(night) }, uL },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D tDay, tNight; uniform float uL; varying vec2 vUv;
      void main() {
        // a camera set for the room leaves the far distance a touch soft
        vec4 d = texture2D(tDay, vUv, 0.7), n = texture2D(tNight, vUv);
        // seen from a room the outside is always a little overexposed
        gl_FragColor = vec4(mix(n.rgb * 1.5, d.rgb * 1.22, uL), d.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }));
  land.renderOrder = -19; land.frustumCulled = false;

  // the sky: one big ball, shaded by direction
  const sky = new THREE.Mesh(new THREE.SphereGeometry(260, 48, 24), new THREE.ShaderMaterial({
    uniforms: { uL, uSun: { value: SUN.clone() }, uDip: { value: rad(DIP) } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform float uL, uDip; uniform vec3 uSun; varying vec3 vDir;
      ${NOISE}
      float fbm(vec3 p) { return vnoise(p) * 0.55 + vnoise(p * 2.1 + 3.0) * 0.28 + vnoise(p * 4.3 + 9.0) * 0.17; }
      void main() {
        vec3 d = normalize(vDir);
        float el = asin(clamp(d.y, -1.0, 1.0)) + uDip, up = clamp(el / 1.3, 0.0, 1.0), s = max(dot(d, uSun), 0.0);
        // day: a pale sky, whiter towards the horizon, with high thin cloud and the sun as a blur in it
        vec3 day = mix(vec3(0.83, 0.85, 0.85), vec3(0.52, 0.65, 0.82), pow(up, 0.55));
        float cloud = fbm(vec3(d.xz / (abs(d.y) + 0.22) * 1.3, 2.0));
        day = mix(day, vec3(0.92, 0.92, 0.91), smoothstep(0.38, 0.75, cloud) * 0.6);
        day += vec3(1.0, 0.84, 0.62) * (pow(s, 5.0) * 0.3 + pow(s, 40.0) * 0.7 + pow(s, 700.0) * 5.0);
        day = mix(vec3(0.62, 0.65, 0.64), day, smoothstep(-0.03, 0.012, el));
        // night: deep blue, the glow of the town along the horizon, the moon where the sun was, and stars
        vec3 night = mix(vec3(0.05, 0.065, 0.11), vec3(0.008, 0.014, 0.034), pow(up, 0.45));
        night += vec3(0.2, 0.11, 0.05) * exp(-max(el, 0.0) * 13.0) * 0.4;
        night += vec3(0.75, 0.82, 1.0) * (pow(s, 3.0) * 0.03 + pow(s, 300.0) * 0.25 + smoothstep(0.99990, 0.99996, s) * 3.0);
        vec3 q = d * 230.0, qi = floor(q), qf = fract(q) - 0.5;
        night += vec3(0.8, 0.86, 1.0) * step(0.9972, h31(qi)) * smoothstep(0.24, 0.0, length(qf)) * (0.3 + 0.7 * h31(qi + 7.0)) * smoothstep(0.03, 0.25, el) * (1.0 - smoothstep(0.3, 0.6, cloud) * 0.6);
        night = mix(vec3(0.012, 0.014, 0.022), night, smoothstep(-0.03, 0.012, el));
        gl_FragColor = vec4(mix(night, day * 1.18, uL), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false,
  }));
  sky.renderOrder = -20; sky.frustumCulled = false;
  group.add(sky, land);
  return { group, set: (L) => { uL.value = L; } };
}
