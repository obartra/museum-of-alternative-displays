import { G, M, Swarm, glows, halo, keyboard, lamps, screen, THREE, type Built, type P2, type V3 } from '../kit';
import { feet, jewel, knob, meshMat, meshTexture, pins, screws, toggle, vents } from '../parts';
import { SEG, SEG_LINES, bigTime, clockStrokes, dotMatrix, dots, now, segClock } from '../../sims/draw';

/** Cathode ray tube: a bare picture tube on a cradle. One beam paints the whole face, line by line. */
export function crt(): Built {
  const root = G.group();
  const tube = G.group();
  // turned face down: faceplate, funnel, neck
  const bulb: P2[] = [[0, 0], [0.45, 0.028], [0.8, 0.1], [0.96, 0.2], [1.0, 0.33], [0.97, 0.46], [0.8, 0.9], [0.52, 1.42], [0.27, 1.82], [0.16, 2.0, 1], [0.16, 2.86, 1], [0.14, 2.96], [0, 2.98]];
  tube.add(G.lathe(bulb, M.bulb(0x9fb1ae, 0.78), 80, true));
  // the funnel is painted with graphite, which is why you cannot see in from the side
  const dag = M.black(); dag.side = THREE.DoubleSide;
  tube.add(G.lathe([[0.972, 0.5], [0.806, 0.9], [0.526, 1.42], [0.276, 1.82], [0.172, 1.97]], dag, 80, true));
  // drawn at twice the size it is laid out in, so that the lines of the raster hold up from close to
  const face = screen(1024, 1024);
  const phosphor = G.dish(0.935, 0.17, M.lit(face, 1.5, 0.9), [0, 0.2, 0]);
  phosphor.rotation.x = Math.PI / 2;
  const band = G.lathe([[1.004, 0.27], [1.018, 0.285], [1.018, 0.4], [1.004, 0.415]], M.steel(), 80);
  tube.add(phosphor, band);
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; const lug = G.box(0.16, 0.03, 0.12, M.steel(), [Math.cos(a) * 1.07, 0.34, Math.sin(a) * 1.07]); lug.rotation.y = -a; tube.add(lug); }
  // deflection yoke: copper wound on a ferrite ring, clamped round the neck
  const yoke = G.torus(0.3, 0.1, M.copper(), [0, 1.96, 0]); yoke.rotation.x = Math.PI / 2;
  const ears = G.torus(0.37, 0.05, M.copper(), [0, 1.84, 0]); ears.rotation.x = Math.PI / 2;
  tube.add(yoke, ears, G.cyl(0.25, 0.1, M.plastic(0x1a1c1e, 0.5), [0, 2.1, 0], 40, 0.22), G.cyl(0.2, 0.035, M.steel(), [0, 2.18, 0], 32));
  // the gun, seen through the clear neck
  for (const [y, h, r] of [[2.34, 0.1, 0.085], [2.48, 0.14, 0.09], [2.66, 0.16, 0.085]] as const) tube.add(G.cyl(r, h, M.steel(), [0, y, 0], 28));
  for (const a of [0, 2.09, 4.19]) tube.add(G.rod([Math.cos(a) * 0.115, 2.26, Math.sin(a) * 0.115], [Math.cos(a) * 0.115, 2.78, Math.sin(a) * 0.115], 0.012, M.ceramic(), 8));
  // the cathode at the back of the gun, kept hot by its heater: the one part of the works that glows
  tube.add(G.cyl(0.034, 0.09, M.glow(0xff7a2a, 1.5), [0, 2.82, 0], 16), halo(0xff6a20, 0.42, [0, 2.84, 0], 0.55));
  tube.add(G.cyl(0.19, 0.13, M.plastic(0x16181a, 0.45), [0, 3.02, 0], 32));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; tube.add(G.rod([Math.cos(a) * 0.12, 3.08, Math.sin(a) * 0.12], [Math.cos(a) * 0.12, 3.2, Math.sin(a) * 0.12], 0.012, M.brass(1), 8)); }
  // anode cap and its lead
  const cap = G.cyl(0.09, 0.04, M.rubber(), [0.69, 1.14, 0], 24, 0.05); cap.rotation.z = -1.02;
  tube.add(cap, G.wire([[0.72, 1.16, 0], [0.98, 1.5, 0.1], [0.84, 2.3, 0.22], [0.32, 2.92, 0.26]], 0.018, M.plastic(0xa3231a, 0.5)));
  tube.rotation.x = -Math.PI / 2; tube.position.set(0, 1.14, 1.4);
  // cradle: a steel plate, two posts to the rim band and a saddle under the neck
  const steel = M.dark(2);
  root.add(tube, G.box(2.3, 0.08, 3.5, steel, [0, 0.04, 0], 0.02), feet(2.3, 3.5, 0.07, 0.04, -0.04));
  for (const s of [-1, 1]) {
    root.add(G.box(0.1, 1.16, 0.26, steel, [s * 1.1, 0.66, 1.06]), G.box(0.34, 0.06, 0.4, steel, [s * 1.1, 0.11, 1.06]));
    root.add(G.box(0.08, 0.9, 0.16, steel, [s * 0.21, 0.5, -1.2]));
  }
  root.add(screws([[-1.045, 1.14, 1.06], [1.045, 1.14, 1.06]].map(([x, y, z]) => [x, y, z] as V3), 0.035, 'x'));
  const saddle = G.torus(0.2, 0.045, M.rubber(), [0, 1.14, -1.2], Math.PI); saddle.rotation.z = Math.PI;
  root.add(saddle, G.box(0.5, 0.08, 0.16, steel, [0, 0.9, -1.2]));
  return {
    root, inDark: 'glows', glow: 0xbfd8ff, view: [30, 12], surface: face.canvas,
    views: {
      // far enough back that the whole face fits a narrow frame
      seat: { at: [0, 1.2, 6.6], to: [0, 1.14, 1.4] },
      raster: { at: [0.45, 1.25, 2.3], to: [0.1, 1.14, 1.38], play: 0.4 },
      // from behind and to one side, clear of the anode lead
      gun: { at: [-0.9, 1.45, -1.9], to: [0, 1.14, -1.15] },
    },
    update: ({ t }) => {
      const c = face.ctx, n = now();
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.fillStyle = '#020303'; c.fillRect(0, 0, 512, 512);
      const X = 82, Y = 126, W = 348, H = 260;
      c.save(); c.beginPath(); c.roundRect(X, Y, W, H, 30); c.clip();
      c.fillStyle = '#0a1016'; c.fillRect(X, Y, W, H);
      c.save(); c.translate(X, Y); bigTime(c, W, H, n.hhmmss, '#e6f1ff', 800, 0.46); c.restore();
      // the raster: dark gaps between lines, and a band the beam has just refreshed
      c.fillStyle = 'rgba(0,0,0,.34)';
      for (let y = Y; y < Y + H; y += 4) c.fillRect(X, y + 2, W, 2);
      const by = Y + ((t * 0.8) % 1) * (H + 80) - 40;
      const bandLight = c.createLinearGradient(0, by - 70, 0, by);
      bandLight.addColorStop(0, 'rgba(190,220,255,0)'); bandLight.addColorStop(1, 'rgba(190,220,255,.32)');
      c.fillStyle = bandLight; c.fillRect(X, by - 70, W, 70);
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(X + ((t * 37) % 1) * W, by, 26, 2);
      c.restore();
      face.tex.needsUpdate = true;
    },
  };
}

/** Vector display: a laboratory console whose beam draws lines directly, like a pen. A light pen lies on the shelf. */
export function vector(): Built {
  const root = G.group();
  const shell = M.enamel(0x6f857b), panel = M.plastic(0x1f2225, 0.5);
  root.add(G.rbox(2.2, 1.7, 1.5, 0.07, shell, [0, 0.97, -0.25]), G.box(2.02, 1.52, 0.05, panel, [0, 0.97, 0.49], 0.012), feet(2.2, 1.5, 0.08, 0.12, 0));
  const cx = -0.34, cy = 1.0;
  const scope = screen(1024, 1024);
  scope.ctx.setTransform(2, 0, 0, 2, 0, 0);
  scope.ctx.fillStyle = '#010502'; scope.ctx.fillRect(0, 0, 512, 512);
  // a deep hood keeps room light off the phosphor
  const hood = G.lathe([[0.8, 0], [0.8, 0.05], [0.73, 0.33], [0.7, 0.35], [0.66, 0.33], [0.615, 0.02]], M.plastic(0x15171a, 0.6), 72);
  hood.rotation.x = Math.PI / 2; hood.position.set(cx, cy, 0.51);
  root.add(hood, G.dish(0.61, 0.06, M.lit(scope, 1.5, 0.9), [cx, cy, 0.52]));
  // controls: intensity, focus, X and Y position, then the switches
  const px = 0.72;
  root.add(G.box(0.5, 1.36, 0.02, M.steel(1), [px, 0.97, 0.52], 0.006));
  ['INT', 'FOC', 'X', 'Y'].forEach((_, i) => root.add(knob(0.075, [px, 1.48 - i * 0.25, 0.53], 'z', 0.6 + i * 1.1)));
  for (let i = 0; i < 3; i++) root.add(toggle([px - 0.14 + i * 0.14, 0.5, 0.53], i !== 1));
  root.add(jewel(0xff3b1e, 0.03, [px, 0.36, 0.53]), screws([[px - 0.21, 1.6, 0.53], [px + 0.21, 1.6, 0.53], [px - 0.21, 0.34, 0.53], [px + 0.21, 0.34, 0.53]], 0.016));
  const side = vents(0.9, 0.5, 9, [1.101, 1.3, -0.25]); side.rotation.y = Math.PI / 2;
  const side2 = vents(0.9, 0.5, 9, [-1.101, 1.3, -0.25]); side2.rotation.y = Math.PI / 2;
  root.add(side, side2);
  // writing shelf with the light pen on its cord
  root.add(G.profile([[0.45, 0.12], [1.3, 0.12], [1.3, 0.2], [0.45, 0.36]], 2.2, shell), G.box(2.0, 0.02, 0.74, M.plastic(0x2b3a34, 0.8), [0, 0.292, 0.88], 0.004).rotateX(0.186));
  const pen = G.group(G.cyl(0.03, 0.5, M.steel(1), undefined, 20), G.cyl(0.022, 0.08, M.plastic(0x101112, 0.4), [0, 0.28, 0], 16, 0.012));
  pen.rotation.set(0.186, 0, Math.PI / 2 - 0.2); pen.position.set(0.3, 0.33, 0.95);
  root.add(pen, G.wire([[0.06, 0.3, 0.9], [-0.3, 0.33, 0.82], [-0.7, 0.36, 0.66], [-0.86, 0.4, 0.52]], 0.012, M.rubber()));
  return {
    root, inDark: 'glows', glow: 0x58ff8a, view: [24, 10], zoom: 0.9, surface: scope.canvas,
    views: {
      seat: { at: [-0.25, 1.3, 3], to: [cx, cy, 0.52], fov: 46 },
      trace: { at: [-0.05, 1.22, 1.5], to: [-0.3, 1.02, 0.55], play: 0.4 },
    },
    update: ({ t }) => {
      const c = scope.ctx, n = now();
      // phosphor persistence: old strokes fade instead of vanishing
      c.fillStyle = 'rgba(1,6,2,.3)'; c.fillRect(0, 0, 512, 512);
      c.save(); c.beginPath(); c.arc(256, 256, 250, 0, 7); c.clip();
      c.strokeStyle = '#7dffa2'; c.lineWidth = 3.4; c.lineCap = 'round'; c.shadowColor = '#3cff7a'; c.shadowBlur = 10;
      for (const [x0, y0, x1, y1] of clockStrokes(n)) { c.beginPath(); c.moveTo(256 + x0 * 210, 256 - y0 * 210); c.lineTo(256 + x1 * 210, 256 - y1 * 210); c.stroke(); }
      // a bouncing ball, after the first program most people saw on such a screen
      const u = (t * 0.22) % 1, bx = 70 + u * 372, by = 440 - Math.abs(Math.sin(u * Math.PI * 4)) * 150 * (1 - u * 0.75);
      c.fillStyle = '#c8ffd6'; c.beginPath(); c.arc(bx, by, 5, 0, 7); c.fill();
      c.restore();
      scope.tex.needsUpdate = true;
    },
  };
}

/** Storage tube terminal: lines stay lit on the screen itself until the whole face is flashed clean. */
export function storageTube(): Built {
  const root = G.group();
  const putty = M.enamel(0xd6d0bd), dark = M.plastic(0x24272a, 0.6);
  // pedestal on a plinth, with louvres for the power supply
  root.add(G.rbox(1.2, 0.07, 1.15, 0.03, dark, [0, 0.035, -0.1]), G.rbox(0.92, 1.24, 0.86, 0.04, putty, [0, 0.69, -0.15]));
  for (const s of [-1, 1]) { const v = vents(0.56, 0.5, 10, [s * 0.461, 0.5, -0.15]); v.rotation.y = Math.PI / 2; root.add(v); }
  root.add(G.box(0.9, 0.012, 0.012, dark, [0, 1.0, 0.281], 0), G.box(0.1, 0.03, 0.01, M.steel(), [0, 1.12, 0.281], 0));
  // the head: a deep shell, because the tube inside is as long as the screen is wide
  root.add(G.rbox(1.72, 1.2, 1.5, 0.09, putty, [0, 1.92, -0.1]));
  const s = screen(512, 384);
  root.add(G.bezel(1.56, 1.06, 1.14, 0.88, 0.1, 0.1, dark, [0, 1.94, 0.66], 0.05, 0.02), G.bulge(1.22, 0.96, 0.035, M.lit(s, 1.15, 0.9), [0, 1.94, 0.656]));
  for (const sx of [-1, 1]) { const v = vents(0.9, 0.36, 8, [sx * 0.861, 2.2, -0.2]); v.rotation.y = Math.PI / 2; root.add(v); }
  // keyboard console
  const tilt = Math.atan2(0.2, 0.62);
  root.add(G.profile([[0.6, 1.24], [1.38, 1.24], [1.38, 1.3], [0.76, 1.5], [0.6, 1.5]], 1.72, putty));
  const deck = G.group(G.box(1.56, 0.012, 0.56, dark, [0, 0, 0], 0), keyboard([14, 14, 13, 12], 0.092, M.plastic(0x3b3f43, 0.45), 7).translateY(0.006).translateX(-0.1));
  // two thumbwheels steer the crosshair
  for (const z of [-0.08, 0.1]) { const w = G.cyl(0.07, 0.028, M.plastic(0x15171a, 0.7), [0.68, 0.02, z], 40); w.rotation.z = Math.PI / 2; deck.add(w); }
  for (let i = 0; i < 3; i++) deck.add(G.box(0.05, 0.025, 0.08, M.plastic(0xb8b2a0, 0.5), [0.56 + i * 0.075, 0.012, -0.22]));
  deck.rotation.x = tilt; deck.position.set(0, 1.41, 1.07);
  root.add(deck, jewel(0xffa62b, 0.018, [-0.72, 1.36, 1.381], 'z', 1.2));
  root.add(G.wire([[0.3, 1.5, -0.85], [0.34, 0.9, -1.0], [0.3, 0.2, -0.8], [0.5, 0.05, -0.6]], 0.02, M.rubber()));
  const BG = '#0d2a17', FG = '#a9ffbd';
  let cycle = -1, done = 0;
  return {
    root, inDark: 'glows', glow: 0x4dff86, view: [26, 9], surface: s.canvas,
    views: { seat: { at: [0, 2.25, 3.9], to: [0, 1.85, 0.66], fov: 42 } },
    update: ({ t }) => {
      const c = s.ctx, T = 14, k = Math.floor(t / T), u = (t % T);
      if (k !== cycle) { cycle = k; done = 0; }
      if (u < 0.5) { // the erase flash
        const f = 1 - u / 0.5;
        c.fillStyle = `rgb(${13 + 150 * f},${42 + 213 * f},${23 + 160 * f})`; c.fillRect(0, 0, 512, 384);
      } else {
        if (done === 0) { c.fillStyle = BG; c.fillRect(0, 0, 512, 384); }
        c.strokeStyle = FG; c.fillStyle = FG; c.lineWidth = 2; c.shadowColor = FG; c.shadowBlur = 4;
        const want = Math.min(400, Math.floor((u - 0.5) * 70));
        for (; done < want; done++) {
          if (done === 0) { c.beginPath(); c.moveTo(40, 30); c.lineTo(40, 300); c.lineTo(480, 300); c.stroke(); }
          const x0 = 40 + done * 1.1, x1 = x0 + 1.1;
          const f = (x: number) => 170 - 100 * Math.sin((x - 40) / 44) * Math.exp(-(x - 40) / 520);
          c.beginPath(); c.moveTo(x0, f(x0)); c.lineTo(x1, f(x1)); c.stroke();
          if (done % 40 === 0) { c.beginPath(); c.moveTo(x0, 296); c.lineTo(x0, 304); c.stroke(); }
          if (done === 399) { c.font = '26px "PT Mono", monospace'; c.fillText(`T = ${now().hhmmss}`, 56, 350); }
        }
        c.shadowBlur = 0;
      }
      s.tex.needsUpdate = true;
    },
  };
}

const NIXIE: Record<number, [number, number][]> = {
  1: [[0.34, 1.3], [0.56, 1.6], [0.56, 0.8], [0.56, 0]],
  2: [[0.1, 1.2], [0.24, 1.5], [0.5, 1.6], [0.76, 1.5], [0.9, 1.22], [0.8, 0.9], [0.45, 0.45], [0.1, 0], [0.5, 0], [0.92, 0]],
  3: [[0.12, 1.6], [0.88, 1.6], [0.46, 1.0], [0.72, 0.94], [0.9, 0.68], [0.9, 0.36], [0.7, 0.1], [0.45, 0], [0.22, 0.08], [0.1, 0.28]],
  4: [[0.72, 0], [0.72, 0.8], [0.72, 1.6], [0.4, 1.05], [0.1, 0.5], [0.5, 0.5], [0.95, 0.5]],
  5: [[0.86, 1.6], [0.22, 1.6], [0.16, 0.94], [0.44, 1.04], [0.7, 1.0], [0.9, 0.74], [0.9, 0.36], [0.7, 0.1], [0.45, 0], [0.22, 0.08], [0.1, 0.28]],
  6: [[0.76, 1.6], [0.42, 1.2], [0.17, 0.72], [0.12, 0.4], [0.25, 0.12], [0.5, 0], [0.75, 0.12], [0.88, 0.4], [0.8, 0.74], [0.55, 0.92], [0.3, 0.84], [0.16, 0.6]],
  7: [[0.1, 1.6], [0.5, 1.6], [0.9, 1.6], [0.66, 0.8], [0.4, 0]],
};
NIXIE[9] = NIXIE[6].map(([x, y]) => [1 - x, 1.6 - y]);
const ring = (cx: number, cy: number, rx: number, ry: number, n = 14): [number, number][] => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);

/** The pen strokes of a numeral in a box 1 wide and 1.6 high. Shared with anything that writes digits by hand. */
export function strokesOf(d: number): [number, number][][] {
  if (d === 0) { const r = ring(0.5, 0.8, 0.4, 0.8, 16); return [[...r, r[0]]]; }
  if (d === 8) { const a = ring(0.5, 1.22, 0.33, 0.38), b = ring(0.5, 0.42, 0.42, 0.42); return [[...a, a[0]], [...b, b[0]]]; }
  return [NIXIE[d]];
}

function nixieDigit(d: number, mat: THREE.Material, r: number, radial: number): THREE.Object3D {
  const to3 = (p: [number, number]): V3 => [(p[0] - 0.5) * 0.36, 0.2 + p[1] * 0.5, 0];
  if (d === 0) return G.wire(ring(0.5, 0.8, 0.4, 0.8, 16).map(to3), r, mat, true, radial);
  if (d === 8) return G.group(G.wire(ring(0.5, 1.22, 0.33, 0.38).map(to3), r, mat, true, radial), G.wire(ring(0.5, 0.42, 0.42, 0.42).map(to3), r, mat, true, radial));
  return G.wire(NIXIE[d].map(to3), r, mat, false, radial);
}

/** A small glass valve envelope: straight wall, domed top, the pip where it was sealed off the pump. */
const envelope = (r: number, h: number, glow: number) => G.lathe(
  [[0, 0], [r * 0.93, 0, 1], [r, 0.03], [r, h * 0.8], [r * 0.94, h * 0.9], [r * 0.7, h * 0.975], [r * 0.3, h], [r * 0.16, h * 1.03], [r * 0.1, h * 1.09], [0, h * 1.1]],
  M.bulb(0x9fb1ae, 0.72, glow), 56, true);

/** Nixie tubes: ten shaped cathodes stacked in neon behind a mesh anode. The one that is energised glows. */
export function nixie(): Built {
  const root = G.group();
  const on = M.glow(0xff6418, 3);
  const off = new THREE.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.8, roughness: 0.4, transparent: true, opacity: 0.32 });
  const aura = M.add(null, 0xff4a08, 0.3);
  const gauze = meshTexture(40, 26);
  const mica = new THREE.MeshStandardMaterial({ color: 0xa89a7c, roughness: 0.5, transparent: true, opacity: 0.55 });
  const order = [1, 0, 2, 9, 3, 8, 4, 7, 5, 6];
  const xs = [-1.78, -1.12, -0.33, 0.33, 1.12, 1.78];
  const tubes = xs.map((x) => {
    const g = G.group(); g.position.set(x, 0.36, 0);
    const hot: THREE.Object3D[] = [];
    order.forEach((d, k) => {
      const z = (4.5 - k) * 0.03;
      const ghost = nixieDigit(d, off, 0.0045, 5); ghost.position.z = z;
      // the glow is a sheath of excited neon a little way off the metal, so the lit numeral looks fatter than its wire
      hot[d] = G.group(nixieDigit(d, on, 0.021, 14), nixieDigit(d, aura, 0.05, 14)); hot[d].position.z = z; hot[d].visible = false;
      g.add(ghost, hot[d]);
    });
    // mesh anode wrapped round the stack, mica spacers above and below, leads down into the socket
    const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.98, 48, 1, true), meshMat(gauze, 0.26));
    cage.position.y = 0.62;
    // behind the stack, a dark screen so the lit numeral has something to stand against
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.228, 0.96, 32, 1, true, Math.PI * 0.62, Math.PI * 0.76), new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.7, metalness: 0.3, side: THREE.DoubleSide }));
    back.position.y = 0.62; g.add(back);
    g.add(cage, G.cyl(0.25, 0.01, mica, [0, 0.12, 0], 40), G.cyl(0.25, 0.01, mica, [0, 1.12, 0], 40));
    g.add(envelope(0.29, 1.3, 0x3a1200), halo(0xff5a10, 1.3, [0, 0.62, 0.05], 0.5));
    g.add(G.cyl(0.33, 0.1, M.plastic(0x15130f, 0.35), [0, -0.03, 0], 40, 0.31), G.cyl(0.345, 0.03, M.brass(), [0, -0.075, 0], 40));
    root.add(g);
    return { hot, lit: -1 };
  });
  // a neon pip in its own little bulb for each dot of the colons
  for (const x of [-0.725, 0.725]) for (const y of [0.74, 1.04]) {
    const dot = G.group(G.sph(0.03, M.glow(0xff6a1a, 2.4), undefined, 14), G.lathe([[0, -0.07], [0.05, -0.07, 1], [0.055, 0.02], [0.03, 0.07], [0, 0.08]], M.bulb(0x9fb1ae, 0.7, 0x3a1200), 24, true), halo(0xff5a10, 0.22, undefined, 0.6));
    dot.position.set(x, y, 0);
    root.add(dot, G.rod([x, 0.3, 0], [x, y - 0.07, 0], 0.012, M.brass(1), 8));
  }
  root.add(G.rbox(4.5, 0.3, 1.0, 0.05, M.wood(0x4b2f1b), [0, 0.15, 0]), G.box(4.3, 0.014, 0.82, M.brass(), [0, 0.302, 0], 0.004), feet(4.5, 1.0, 0.07, 0.04, -0.04));
  root.add(screws([[-2.08, 0.31, 0.34], [2.08, 0.31, 0.34], [-2.08, 0.31, -0.34], [2.08, 0.31, -0.34]], 0.026, 'y', M.brass()));
  return {
    root, inDark: 'glows', glow: 0xff6a1a, view: [20, 9], zoom: 1.12,
    // the tube that counts seconds, from far enough round that the stack shows as a stack
    views: { stack: { at: [2.55, 1.3, 1.35], to: [1.78, 0.98, 0], play: 0.6 } },
    update: () => {
      const d = now().digits;
      tubes.forEach((tb, i) => {
        if (tb.lit === d[i]) return;
        if (tb.lit >= 0) tb.hot[tb.lit].visible = false;
        tb.hot[d[i]].visible = true; tb.lit = d[i];
      });
    },
  };
}

/** Vacuum fluorescent display: hot filaments in front, mesh grids, phosphor segments behind, all in a flat glass box. */
export function vfd(): Built {
  const root = G.group();
  const s = screen(768, 256);
  const y = 0.82;
  root.add(G.box(3.2, 1.36, 0.045, M.pcb(), [0, y - 0.04, -0.2], 0.008));
  // the envelope: two plates and a frit seal
  root.add(G.rbox(2.84, 0.98, 0.26, 0.04, M.glass(0x8fa9a4, 0.06, 0.7), [0, y, 0]), G.bezel(2.86, 1.0, 2.7, 0.84, 0.03, 0.05, M.ceramic(), [0, y, 0], 0.04, 0.01));
  root.add(G.box(2.66, 0.82, 0.02, M.black(), [0, y, -0.1], 0), G.plane(2.58, 0.76, M.lit(s, 1.7, 0.2), [0, y, -0.088]));
  const grid = G.plane(2.58, 0.76, meshMat(meshTexture(120, 36), 0.32), [0, y, -0.03]);
  root.add(grid);
  // filaments: hair-thin, just hot enough to give off electrons, strung on springs
  const fil = M.glow(0xff5b2a, 0.5);
  for (let i = 0; i < 4; i++) {
    const fy = y - 0.27 + i * 0.18;
    root.add(G.rod([-1.3, fy, 0.05], [1.3, fy, 0.05], 0.003, fil, 5));
    for (const sx of [-1, 1]) root.add(G.box(0.03, 0.05, 0.05, M.steel(), [sx * 1.32, fy, 0.03], 0));
  }
  // lead frame: every anode and grid comes out along the bottom edge
  root.add(pins([-1.26, y - 0.49, -0.02], [-1.26, y - 0.62, -0.02], 30, [0.087, 0, 0], 0.009), pins([-1.26, y - 0.62, -0.02], [-1.26, y - 0.66, -0.18], 30, [0.087, 0, 0], 0.009));
  const tip = G.lathe([[0, 0], [0.045, 0, 1], [0.045, 0.08], [0.02, 0.15], [0, 0.17]], M.glass(0x8fa9a4, 0.1, 0.7), 20, true); tip.rotation.z = Math.PI / 2; tip.position.set(-1.42, y, 0);
  root.add(tip, G.rbox(3.2, 0.1, 0.6, 0.03, M.dark(), [0, 0.05, -0.12]));
  for (const x of [-1.3, 1.3]) root.add(G.box(0.12, 0.24, 0.1, M.dark(), [x, 0.2, -0.2]));
  return {
    root, inDark: 'glows', glow: 0x58ffd8, view: [18, 8], zoom: 1.08, surface: s.canvas,
    views: { grid: { at: [-1.75, 1, 0.75], to: [-0.95, 0.78, 0], play: 0.3 } },
    update: () => {
      s.ctx.fillStyle = '#040807'; s.ctx.fillRect(0, 0, 768, 256);
      segClock(s.ctx, 768, 256, now(), '#7dffe6', '#0d2a26', true, 14);
      s.tex.needsUpdate = true;
    },
  };
}

/** Numitron: seven lamp filaments in a small valve envelope, laid out as a seven segment figure. */
export function numitron(): Built {
  const root = G.group();
  const on = M.glow(0xffb45a, 3), off = M.dark(1);
  const tubes = [-1.14, -0.42, 0.42, 1.14].map((x) => {
    const g = G.group(); g.position.set(x, 0.42, 0);
    const segs: Record<string, { wire: THREE.Mesh; bloom: THREE.Group }> = {};
    for (const k of 'abcdefg') {
      const [x0, y0, x1, y1] = SEG_LINES[k];
      const a: V3 = [(x0 - 0.5) * 0.25, 0.3 + y0 * 0.25, 0.04], b: V3 = [(x1 - 0.5) * 0.25, 0.3 + y1 * 0.25, 0.04];
      const wire = G.rod(a, b, 0.008, off, 6);
      // a lit filament is too bright to see as a wire: it reads as a soft bar of light
      const bloom = G.group(G.rod(a, b, 0.02, M.add(null, 0xff9a3a, 0.5), 16), G.rod(a, b, 0.036, M.add(null, 0xff8a2a, 0.22), 16)); bloom.visible = false;
      segs[k] = { wire, bloom };
      g.add(wire, bloom);
    }
    // each filament hangs between two posts over a dull metal backplate
    for (const [px, py] of [[-0.15, 0.3], [0.15, 0.3], [-0.15, 0.55], [0.15, 0.55], [-0.15, 0.8], [0.15, 0.8]]) g.add(G.rod([px, py, -0.05], [px, py, 0.05], 0.007, M.steel(), 6));
    g.add(G.box(0.42, 0.68, 0.014, M.plastic(0x2a2c2f, 0.8), [0, 0.55, -0.06], 0), G.cyl(0.26, 0.012, M.ceramic(), [0, 0.13, 0], 36), G.cyl(0.05, 0.06, M.steel(), [0, 0.96, -0.02], 16));
    g.add(envelope(0.29, 0.98, 0x2a1500));
    g.add(pins([-0.16, -0.1, 0], [-0.16, 0.02, 0], 5, [0.08, 0, 0], 0.012, M.steel(1)), G.cyl(0.33, 0.09, M.ceramic(), [0, -0.045, 0], 40, 0.31));
    root.add(g);
    return { segs, shown: -1 };
  });
  // a pair of pilot lamps for the colon
  for (const y of [0.78, 1.04]) root.add(G.sph(0.028, M.glow(0xffb45a, 2.4), [0, y, 0.04], 12), halo(0xff9a3a, 0.2, [0, y, 0.05], 0.6), G.rod([0, 0.36, 0.04], [0, y, 0.04], 0.008, M.steel(1), 6));
  root.add(G.rbox(3.1, 0.36, 0.95, 0.04, M.steel(), [0, 0.18, 0]), feet(3.1, 0.95, 0.06, 0.04, -0.04));
  root.add(vents(1.2, 0.16, 5, [0, 0.19, 0.476]), screws([[-1.42, 0.3, 0.476], [1.42, 0.3, 0.476], [-1.42, 0.07, 0.476], [1.42, 0.07, 0.476]], 0.02));
  return {
    root, inDark: 'glows', glow: 0xffc98a, view: [20, 9], zoom: 1.1,
    views: { filaments: { at: [1.75, 1.15, 0.95], to: [1.14, 0.97, 0.02] } },
    update: () => {
      const d = [...now().digits.slice(0, 4)];
      tubes.forEach((tb, i) => {
        if (tb.shown === d[i]) return;
        tb.shown = d[i];
        for (const k of 'abcdefg') { const lit = SEG[d[i]].includes(k); tb.segs[k].wire.material = lit ? on : off; tb.segs[k].bloom.visible = lit; }
      });
    },
  };
}

/** Plasma panel: the flat orange terminal screen of the early 1970s. Every dot is a tiny neon discharge. */
export function plasma(): Built {
  const root = G.group();
  const putty = M.enamel(0xcbc4af), dark = M.plastic(0x1d1f22, 0.6);
  const s = screen(1024, 1024);
  s.ctx.setTransform(2, 0, 0, 2, 0, 0);
  // the cabinet is deep only to hold the electronics: the panel itself is a sandwich of two glass plates
  root.add(G.rbox(2.1, 2.0, 1.4, 0.08, putty, [0, 1.2, -0.45]), G.rbox(1.5, 0.2, 1.1, 0.04, dark, [0, 0.1, -0.45]));
  root.add(G.bezel(1.86, 1.8, 1.42, 1.42, 0.02, 0.1, dark, [0, 1.22, 0.27], 0.05, 0.02), G.plane(1.46, 1.46, M.lit(s, 1.4, 0.9), [0, 1.22, 0.256]));
  // the touch frame: sixteen infrared beams each way across the face
  for (let i = 0; i < 16; i++) { const o = (i - 7.5) * 0.086; root.add(G.box(0.03, 0.03, 0.012, M.plastic(0x3a0d0d, 0.3), [o, 1.975, 0.323], 0), G.box(0.012, 0.03, 0.03, M.plastic(0x3a0d0d, 0.3), [-0.752, 1.22 + o, 0.3], 0)); }
  for (const sx of [-1, 1]) { const v = vents(0.9, 0.5, 9, [sx * 1.051, 1.6, -0.5]); v.rotation.y = Math.PI / 2; root.add(v); }
  // keyboard on its own lead
  const kb = G.group(G.profile([[-0.36, 0], [0.36, 0], [0.36, 0.06], [-0.36, 0.19]], 1.9, putty), keyboard([15, 15, 14, 13], 0.1, M.plastic(0x2c2e31, 0.45), 7).translateY(0.13).rotateX(0.178).translateZ(-0.02));
  kb.position.set(0, 0, 0.82);
  root.add(kb, G.wire([[0.7, 0.1, 0.5], [0.95, 0.03, 0.2], [0.8, 0.03, -0.1], [0.5, 0.1, -0.2]], 0.02, M.rubber()));
  const noise = Array.from({ length: 9 }, (_, r) => Array.from({ length: 30 }, (_, c) => Math.sin(r * 91.7 + c * 37.3) > 0.1));
  return {
    root, inDark: 'glows', glow: 0xff7a22, view: [24, 10], surface: s.canvas,
    views: {
      seat: { at: [0, 1.75, 3.6], to: [0, 1.15, 0.26], fov: 44 },
      dots: { at: [-0.85, 1.5, 1], to: [-0.45, 1.38, 0.26], play: 0.4 },
    },
    update: ({ t }) => {
      const c = s.ctx;
      c.fillStyle = '#070301'; c.fillRect(0, 0, 512, 512);
      c.save(); c.translate(0, 110); dotMatrix(c, 512, 180, now().hhmmss, '#ff8a2a', '#2a1105', true, 0.74, 6); c.restore();
      c.fillStyle = '#ff8a2a';
      noise.forEach((row, r) => row.forEach((dot, col) => { if (dot && (r < 3 || r > 5)) { c.beginPath(); c.arc(52 + col * 14, 60 + r * 14 + (r > 5 ? 250 : 0), 4, 0, 7); c.fill(); } }));
      if (Math.floor(t * 2) % 2) c.fillRect(48, 448, 12, 16);
      s.tex.needsUpdate = true;
    },
  };
}

/** Field emission display, a corner of one enlarged a few thousand times: a cold cathode tip under every dot of phosphor. */
export function fed(): Built {
  const root = G.group();
  const COLS = 13, ROWS = 7, P = 0.15, W = COLS * P, D = ROWS * P;
  const tips = new Swarm(new THREE.ConeGeometry(0.036, 0.11, 20), M.chrome(), COLS * ROWS);
  const xz = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, (Math.floor(i / COLS) - (ROWS - 1) / 2) * P];
  for (let i = 0; i < COLS * ROWS; i++) { const [x, z] = xz(i); tips.put(i, x, 0.115, z); }
  tips.done();
  // gate: a metal film with a hole over every tip
  const gateMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.85, roughness: 0.3 });
  const gatePlate = G.cut(W, D, 0.004, Array.from({ length: COLS * ROWS }, (_, i) => [xz(i)[0], xz(i)[1], 0.042]), 0.012, gateMat, [0, 0.2, 0], 0);
  gatePlate.rotation.x = -Math.PI / 2;
  const ph = screen(832, 448);
  ph.ctx.setTransform(2, 0, 0, 2, 0, 0);
  const phMat = M.lit(ph, 1.7, 0); phMat.side = THREE.DoubleSide;
  const phosphor = G.plane(W, D, phMat, [0, 0.94, 0]); phosphor.rotation.x = -Math.PI / 2;
  const face = G.pane(W + 0.24, D + 0.24, 0.09, [0, 0.99, 0]); face.rotation.x = -Math.PI / 2;
  root.add(tips.mesh, gatePlate, phosphor, face, G.box(W + 0.24, 0.06, D + 0.24, M.plastic(0x101214, 0.4), [0, 0.03, 0], 0.01), G.box(W, 0.012, D, M.plastic(0x3a2f1c, 0.5), [0, 0.066, 0], 0));
  // glass ribs hold the plates apart against the air outside
  for (const z of [-D / 2 - 0.06, D / 2 + 0.06]) root.add(G.pane(W + 0.2, 0.86, 0.03, [0, 0.5, z]));
  // electron beams from tip to phosphor
  const pos = new Float32Array(COLS * ROWS * 6), col = new Float32Array(COLS * ROWS * 6);
  for (let i = 0; i < COLS * ROWS; i++) { const [x, z] = xz(i); pos.set([x, 0.17, z, x, 0.935, z], i * 6); }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const beams = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(beams);
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9db8ff, view: [28, 20],
    // from the open side, low enough to see under the gate and up to the phosphor
    views: { tips: { at: [1.75, 0.62, 0.55], to: [0.2, 0.32, 0], play: 0.35 } },
    update: () => {
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      const d = dots(n.hhmmss.slice(6));
      const c = ph.ctx; c.fillStyle = '#05060a'; c.fillRect(0, 0, 416, 224);
      for (let i = 0; i < COLS * ROWS; i++) {
        const x = i % COLS, y = Math.floor(i / COLS), lit = d.on(x - 1, y);
        ['#ff4a3a', '#4dff6a', '#4a7bff'].forEach((hue, k) => { c.fillStyle = lit ? hue : '#11131a'; c.fillRect(4 + x * 32 + k * 8.4, 5 + y * 32, 6.4, 22); });
        const v = lit ? 0.5 : 0;
        col.set([v * 0.5, v * 0.6, v, v * 0.5, v * 0.6, v], i * 6);
      }
      ph.tex.needsUpdate = true; bg.attributes.color.needsUpdate = true;
    },
  };
}

/** Eggcrate: a matrix of ordinary lamps, each in its own cell of a baffle so its light does not spill. */
export function eggcrate(): Built {
  const root = G.group();
  const P = 0.15, CW = 5 * P, CH = 7 * P;
  const cx = [-1.5, -0.62, 0.62, 1.5];
  const N = 4 * 35 + 2;
  const at: V3[] = [];
  cx.forEach((x0) => { for (let i = 0; i < 35; i++) at.push([x0 + ((i % 5) - 2) * P, (3 - Math.floor(i / 5)) * P, 0]); });
  at.push([0, P, 0], [0, -P, 0]);
  // small clear lamps: glass globe, brass cap
  const bulbs = new Swarm(new THREE.SphereGeometry(0.05, 20, 14), M.plastic(0x8f897a, 0.18), N);
  const caps = new Swarm(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 12).rotateX(Math.PI / 2), M.brass(), N);
  const light = lamps(new THREE.SphereGeometry(0.056, 16, 12), N);
  const bloom = glows(N, 0.3);
  at.forEach(([x, y], i) => { bulbs.put(i, x, y, 0); caps.put(i, x, y, -0.06); light.put(i, x, y, 0.004); bloom.pos.set([x, y, 0.06], i * 3); });
  bulbs.done(); caps.done(); light.done(); bloom.flush(true);
  bloom.points.geometry.computeBoundingBox();
  const wall = M.black(), tin = M.dark();
  cx.forEach((x0) => {
    root.add(G.box(CW + 0.12, CH + 0.12, 0.34, tin, [x0, 0, -0.2]), G.box(CW + 0.01, CH + 0.01, 0.02, M.plastic(0xc9c2ad, 0.6), [x0, 0, -0.045], 0));
    for (let i = 0; i <= 5; i++) root.add(G.box(0.012, CH, 0.13, wall, [x0 + (i - 2.5) * P, 0, 0.02], 0));
    for (let j = 0; j <= 7; j++) root.add(G.box(CW, 0.012, 0.13, wall, [x0, (j - 3.5) * P, 0.02], 0));
    // a visor against the studio lights
    root.add(G.box(CW + 0.16, 0.02, 0.26, tin, [x0, CH / 2 + 0.075, 0.03], 0.004));
  });
  root.add(bulbs.mesh, caps.mesh, light.mesh, bloom.points, G.box(0.34, CH + 0.12, 0.34, tin, [0, 0, -0.2]), G.box(4.3, 0.1, 0.5, M.steel(), [0, -CH / 2 - 0.11, -0.2]));
  for (const x of [-1.9, 1.9]) root.add(G.cyl(0.04, 0.5, M.steel(1), [x, -CH / 2 - 0.4, -0.2], 20), G.cyl(0.24, 0.04, M.steel(), [x, -CH / 2 - 0.66, -0.2], 32));
  const level = new Float32Array(N);
  return {
    root, inDark: 'glows', glow: 0xffc070, view: [18, 6], zoom: 1.08,
    views: {
      below: { room: true, at: [2.5, 0.25, 2.2], to: [0.5, 0, 0], fov: 50 },
      lamps: { at: [1, 0.25, 0.75], to: [0.62, 0.1, 0] },
    },
    update: () => {
      const n = now();
      const text = n.hhmm.replace(':', '');
      for (let i = 0; i < N; i++) {
        let lit: boolean;
        if (i >= 140) lit = n.s % 2 === 0;
        else lit = dots(text[Math.floor(i / 35)]).on(i % 5, Math.floor((i % 35) / 5));
        // filaments take a moment to heat and cool, which is the eggcrate's whole look
        level[i] += ((lit ? 1 : 0) - level[i]) * (lit ? 0.16 : 0.09);
        const v = level[i];
        light.tint(i, v, v * 0.74, v * 0.38);
        bloom.col.set([v * 0.9, v * 0.6, v * 0.26], i * 3);
      }
      if (light.mesh.instanceColor) light.mesh.instanceColor.needsUpdate = true;
      bloom.flush();
    },
  };
}

/**
 * Colour-wheel television. A black-and-white tube shows the red, green and blue parts of a picture in turn, and a
 * wheel of filters turning in front of it colours each one. The model runs slowly first, so that the three
 * separate pictures can be seen, and then at speed, where they merge.
 */
export function colourWheel(): Built {
  const root = G.group();
  const s = screen(384, 288), tube = M.lit(s, 1.5, 0.5);
  const walnut = M.wood(0x5a3b22), trim = M.wood(0x2e1e12);
  // SY: the height of the middle of the screen. AXLE: the height of the wheel's axle. R: the size of the wheel. FACE: the front of the cabinet.
  const SY = 1.04, AXLE = 0.62, R = 0.62, FACE = 0.3, W = 384, H = 288;
  root.add(G.rbox(0.92, 0.05, 0.64, 0.015, trim, [0, 0.025, 0]), G.rbox(0.86, 1.3, 0.56, 0.03, walnut, [0, 0.7, 0]));
  root.add(G.bezel(0.52, 0.44, 0.36, 0.28, 0.05, 0.03, trim, [0, SY, FACE - 0.02]), G.bulge(0.37, 0.29, 0.03, tube, [0, SY, FACE - 0.03]));
  root.add(G.box(0.5, 0.26, 0.012, M.cloth(0x6b5a3a), [0, 0.36, FACE - 0.014], 0), knob(0.034, [-0.32, 0.66, FACE - 0.02]), knob(0.034, [0.32, 0.66, FACE - 0.02]));
  // the wheel: six filters, two of each colour, on an axle below the screen, driven by a motor on the cabinet's face
  const COLOURS = [0xff2a1a, 0x1fd13a, 0x2a4bff];
  const wheel = G.group(), filters: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.MeshStandardMaterial({ color: COLOURS[i % 3], transparent: true, opacity: 0.4, roughness: 0.15, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
    filters.push(m);
    wheel.add(new THREE.Mesh(new THREE.CircleGeometry(R, 20, (i * Math.PI) / 3, Math.PI / 3), m));
    wheel.add(G.rod([0, 0, 0], [R * Math.cos((i * Math.PI) / 3), R * Math.sin((i * Math.PI) / 3), 0], 0.006, M.steel()));
  }
  const blur = new THREE.MeshStandardMaterial({ color: 0xa9a2b4, transparent: true, opacity: 0, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  wheel.add(new THREE.Mesh(new THREE.CircleGeometry(R, 48), blur), G.torus(R, 0.01, M.steel(), [0, 0, 0]), G.cyl(0.05, 0.035, M.dark(), [0, 0, 0], 24).rotateX(Math.PI / 2));
  wheel.position.set(0, AXLE, FACE + 0.07);
  root.add(wheel, G.cyl(0.08, 0.09, M.dark(1), [0, AXLE, FACE + 0.02], 28).rotateX(Math.PI / 2), G.box(0.3, 0.05, 0.03, M.steel(), [0, AXLE - 0.09, FACE + 0.005], 0));
  // the picture: colour bars above the time. One field of it is that colour's share, shown in white light
  const BARS: [number, number, number][] = [[1, 1, 1], [1, 1, 0], [0, 1, 1], [0, 1, 0], [1, 0, 1], [1, 0, 0], [0, 0, 1]];
  const INK: [number, number, number] = [1, 0.62, 0.12];
  const paint = (field: number, text: string) => {
    const { ctx } = s;
    const tone = (c: [number, number, number]) => {
      if (field === 3) return `rgb(${c.map((x) => Math.round(255 * x)).join(',')})`;
      const g = Math.round(255 * c[field]);
      return `rgb(${g},${g},${g})`;
    };
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
    BARS.forEach((c, i) => { ctx.fillStyle = tone(c); ctx.fillRect(Math.round((i * W) / 7), 0, Math.ceil(W / 7), H * 0.5); });
    ctx.save(); ctx.translate(0, H * 0.5); bigTime(ctx, W, H * 0.5, text, tone(INK), 800, 0.8); ctx.restore();
    s.tex.needsUpdate = true;
  };
  let angle = 0, before = 0, shown = -1, label = '';
  return {
    root, inDark: 'glows', glow: 0xcfd6ff, view: [20, 8], surface: s.canvas,
    update: ({ t }) => {
      const fast = t % 16 >= 8; // eight seconds slowly, then eight at speed
      angle += (fast ? 11 : 0.85) * Math.min(0.1, Math.max(0, t - before)); before = t;
      wheel.rotation.z = -angle;
      // the filter that stands in front of the screen, which is straight above the axle
      const k = Math.floor((((Math.PI / 2 + angle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (Math.PI / 3)) % 3;
      const field = fast ? 3 : k, text = now().hhmm;
      if (field !== shown || text !== label) { paint(field, text); shown = field; label = text; }
      tube.emissive.setHex(fast ? 0xffffff : COLOURS[k]);
      for (const m of filters) m.opacity = fast ? 0.13 : 0.4;
      blur.opacity = fast ? 0.2 : 0;
    },
  };
}
