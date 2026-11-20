import { G, M, Swarm, lamps, screen, THREE, type Built, type V3 } from '../kit';
import { SEG, SEG_LINES, bigTime, clockStrokes, dotMatrix, dots, now, segClock } from '../../sims/draw';

/** Cathode ray tube: a bare picture tube on a cradle. One beam paints the whole face, line by line. */
export function crt(): Built {
  const root = G.group();
  const tube = G.group();
  tube.add(G.lathe([[0, 0], [0.55, 0.02], [0.92, 0.1], [1, 0.24], [0.98, 0.36], [0.78, 0.9], [0.5, 1.45], [0.24, 1.86], [0.15, 2], [0.15, 2.85], [0.17, 2.9], [0.17, 3.0], [0, 3.0]], M.bulb(0xe4f4ff)));
  const dag = M.black(); dag.side = THREE.DoubleSide;
  tube.add(G.lathe([[0.95, 0.42], [0.76, 0.92], [0.49, 1.46], [0.235, 1.87], [0.148, 2]], dag));
  const face = screen(512, 512);
  const phosphor = new THREE.Mesh(new THREE.CircleGeometry(0.93, 56), M.lit(face, 1.5));
  phosphor.rotation.x = Math.PI / 2; phosphor.position.y = 0.11;
  const yoke = G.torus(0.3, 0.12, M.copper(), [0, 1.98, 0]); yoke.rotation.x = Math.PI / 2;
  tube.add(phosphor, yoke, G.cyl(0.085, 0.5, M.steel(), [0, 2.5, 0], 20), G.cyl(0.1, 0.04, M.brass(), [0, 2.24, 0], 20), G.cyl(0.19, 0.12, M.plastic(0x16181a), [0, 3.04, 0], 24));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; tube.add(G.rod([Math.cos(a) * 0.12, 3.08, Math.sin(a) * 0.12], [Math.cos(a) * 0.12, 3.2, Math.sin(a) * 0.12], 0.012, M.brass(), 6)); }
  tube.add(G.cyl(0.07, 0.05, M.rubber(), [0.66, 1.16, 0], 16), G.wire([[0.7, 1.16, 0], [0.95, 1.5, 0.1], [0.8, 2.3, 0.2], [0.3, 2.9, 0.25]], 0.018, M.plastic(0xa3231a, 0.5)));
  tube.rotation.x = -Math.PI / 2; tube.position.set(0, 1.12, 1.4);
  const steel = M.dark();
  root.add(tube, G.box(2.3, 0.08, 3.5, steel, [0, 0.04, 0]));
  for (const s of [-1, 1]) root.add(G.box(0.08, 0.7, 0.3, steel, [s * 0.74, 0.4, 1.05]), G.box(0.08, 1.0, 0.2, steel, [s * 0.2, 0.5, -1.2]));
  root.add(G.box(1.56, 0.08, 0.3, steel, [0, 0.14, 1.05]), G.box(0.48, 0.08, 0.2, steel, [0, 0.96, -1.2]));
  return {
    root, inDark: 'glows', glow: 0xbfd8ff, view: [30, 12], surface: face.canvas,
    update: ({ t }) => {
      const c = face.ctx, n = now();
      c.fillStyle = '#020303'; c.fillRect(0, 0, 512, 512);
      const X = 82, Y = 126, W = 348, H = 260;
      c.save(); c.beginPath(); c.roundRect(X, Y, W, H, 30); c.clip();
      c.fillStyle = '#0a1016'; c.fillRect(X, Y, W, H);
      c.save(); c.translate(X, Y); bigTime(c, W, H, n.hhmmss, '#e6f1ff', 800, 0.46); c.restore();
      // the raster: dark gaps between lines, and a band the beam has just refreshed
      c.fillStyle = 'rgba(0,0,0,.34)';
      for (let y = Y; y < Y + H; y += 4) c.fillRect(X, y + 2, W, 2);
      const by = Y + ((t * 0.8) % 1) * (H + 80) - 40;
      const band = c.createLinearGradient(0, by - 70, 0, by);
      band.addColorStop(0, 'rgba(190,220,255,0)'); band.addColorStop(1, 'rgba(190,220,255,.32)');
      c.fillStyle = band; c.fillRect(X, by - 70, W, 70);
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(X + ((t * 37) % 1) * W, by, 26, 2);
      c.restore();
      face.tex.needsUpdate = true;
    },
  };
}

/** Vector display: a console whose beam draws lines directly, like a pen. */
export function vector(): Built {
  const root = G.group();
  const body = M.enamel(0x70857b);
  root.add(G.box(2.1, 1.7, 1.3, body, [0, 0.85, -0.2]), G.box(2.1, 0.5, 0.75, body, [0, 0.25, 0.82]), G.box(2.2, 0.06, 0.8, M.dark(), [0, 0.53, 0.82]));
  const scope = screen(512, 512);
  scope.ctx.fillStyle = '#010502'; scope.ctx.fillRect(0, 0, 512, 512);
  const tubeFace = new THREE.Mesh(new THREE.CircleGeometry(0.6, 56), M.lit(scope, 1.5));
  tubeFace.position.set(-0.28, 1.0, 0.452);
  const bezel = G.torus(0.62, 0.05, M.dark(), [-0.28, 1.0, 0.455]);
  root.add(tubeFace, bezel, G.box(0.56, 1.25, 0.02, M.dark(), [0.72, 1.0, 0.455]));
  for (let i = 0; i < 4; i++) { const k = G.cyl(0.075, 0.08, M.black(), [0.72, 1.45 - i * 0.26, 0.5], 20); k.rotation.x = Math.PI / 2; root.add(k); }
  for (let i = 0; i < 3; i++) root.add(G.rod([0.56 + i * 0.16, 0.47, 0.47], [0.56 + i * 0.16, 0.5, 0.56], 0.016, M.chrome(), 8));
  root.add(G.plane(0.1, 0.04, M.glow(0xff3b1e, 1.2), [0.72, 0.36, 0.468]));
  return {
    root, inDark: 'glows', glow: 0x58ff8a, view: [22, 10], zoom: 0.86, surface: scope.canvas,
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
  const putty = M.enamel(0xd9d4c3);
  root.add(G.box(0.95, 1.25, 0.95, putty, [0, 0.625, -0.15]), G.rbox(1.6, 1.15, 1.35, 0.06, putty, [0, 1.82, -0.1]), G.box(1.6, 0.14, 0.62, putty, [0, 1.22, 0.72]));
  const s = screen(512, 384);
  root.add(G.box(1.25, 0.95, 0.04, M.black(), [0, 1.86, 0.565]), G.plane(1.12, 0.84, M.lit(s, 1.15), [0, 1.86, 0.59]));
  const keys = new Swarm(new THREE.BoxGeometry(0.075, 0.04, 0.075), M.plastic(0x3a3d40, 0.5), 56);
  for (let i = 0; i < 56; i++) keys.put(i, ((i % 14) - 6.5) * 0.098, 1.31, 0.56 + Math.floor(i / 14) * 0.098);
  keys.done(); root.add(keys.mesh);
  const BG = '#0d2a17', FG = '#a9ffbd';
  let cycle = -1, done = 0;
  return {
    root, inDark: 'glows', glow: 0x4dff86, view: [24, 8], surface: s.canvas,
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

function nixieDigit(d: number, mat: THREE.Material, r: number): THREE.Object3D {
  const to3 = (p: [number, number]): V3 => [(p[0] - 0.5) * 0.36, 0.2 + p[1] * 0.56, 0];
  if (d === 0) return G.wire(ring(0.5, 0.8, 0.4, 0.8, 16).map(to3), r, mat, true);
  if (d === 8) return G.group(G.wire(ring(0.5, 1.22, 0.33, 0.38).map(to3), r, mat, true), G.wire(ring(0.5, 0.42, 0.42, 0.42).map(to3), r, mat, true));
  return G.wire(NIXIE[d].map(to3), r, mat);
}

const envelope = (r: number, h: number) => G.lathe([[0, 0], [r, 0], [r, h * 0.8], [r * 0.9, h * 0.92], [r * 0.52, h], [r * 0.16, h * 1.03], [r * 0.1, h * 1.1], [0, h * 1.1]], M.bulb(0xfff4e8), 40);

/** Nixie tubes: ten shaped cathodes stacked in neon. The one that is energised glows. */
export function nixie(): Built {
  const root = G.group();
  const on = M.glow(0xff5208, 1.9);
  const off = new THREE.MeshStandardMaterial({ color: 0x7c8085, metalness: 0.7, roughness: 0.4, transparent: true, opacity: 0.2 });
  const order = [1, 0, 2, 9, 3, 8, 4, 7, 5, 6];
  const xs = [-1.75, -1.1, -0.325, 0.325, 1.1, 1.75];
  const tubes = xs.map((x) => {
    const g = G.group(); g.position.set(x, 0.3, 0);
    const hot: THREE.Object3D[] = [];
    order.forEach((d, k) => {
      const z = (4.5 - k) * 0.032;
      const ghost = nixieDigit(d, off, 0.007); ghost.position.z = z;
      hot[d] = nixieDigit(d, on, 0.026); hot[d].position.z = z; hot[d].visible = false;
      g.add(ghost, hot[d]);
    });
    // the anode: a cage of fine wire round the back of the stack
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.62 + i * 0.22); g.add(G.rod([Math.sin(a) * 0.235, 0.16, Math.cos(a) * 0.235], [Math.sin(a) * 0.235, 1.16, Math.cos(a) * 0.235], 0.004, M.steel(), 4)); }
    g.add(envelope(0.29, 1.3), G.cyl(0.3, 0.07, M.plastic(0x111213), [0, 0.02, 0], 32));
    root.add(g);
    return { hot, lit: -1 };
  });
  root.add(G.rbox(4.3, 0.3, 0.9, 0.04, M.wood(0x4b2f1b), [0, 0.15, 0]), G.box(4.1, 0.012, 0.74, M.brass(), [0, 0.302, 0]));
  for (const x of [-0.71, 0.71]) for (const y of [0.62, 0.9]) root.add(G.sph(0.03, M.glow(0xff6a1a, 2.2), [x, y, 0], 12));
  return {
    root, inDark: 'glows', glow: 0xff6a1a, view: [20, 9],
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

/** Vacuum fluorescent display: hot filaments in front, phosphor segments behind, all in a flat glass box. */
export function vfd(): Built {
  const root = G.group();
  const s = screen(768, 256);
  root.add(G.box(3.1, 1.25, 0.04, M.pcb(), [0, 0.72, -0.16]), G.rbox(2.8, 0.95, 0.24, 0.04, M.glass(0xdffff6, 0.14), [0, 0.74, 0]));
  root.add(G.box(2.62, 0.8, 0.02, M.black(), [0, 0.74, -0.09]), G.plane(2.56, 0.76, M.lit(s, 1.6), [0, 0.74, -0.075]));
  const fil = M.glow(0xff5b2a, 0.35);
  for (let i = 0; i < 4; i++) root.add(G.rod([-1.3, 0.5 + i * 0.16, 0.06], [1.3, 0.5 + i * 0.16, 0.06], 0.004, fil, 5));
  const grid = M.steel();
  for (let i = 0; i < 27; i++) root.add(G.rod([-1.28 + i * 0.0985, 0.37, 0.01], [-1.28 + i * 0.0985, 1.11, 0.01], 0.0028, grid, 4));
  for (let i = 0; i < 24; i++) root.add(G.rod([-1.26 + i * 0.11, 0.3, -0.02], [-1.26 + i * 0.11, 0.2, -0.14], 0.012, M.steel(), 5));
  const tip = G.cyl(0.04, 0.16, M.glass(0xdffff6, 0.2), [-1.47, 0.74, 0], 14); tip.rotation.z = Math.PI / 2;
  root.add(tip, G.box(3.1, 0.1, 0.5, M.dark(), [0, 0.05, -0.1]), G.box(0.1, 0.2, 0.1, M.dark(), [-1.3, 0.13, -0.16]), G.box(0.1, 0.2, 0.1, M.dark(), [1.3, 0.13, -0.16]));
  return {
    root, inDark: 'glows', glow: 0x58ffd8, view: [18, 8], surface: s.canvas,
    update: () => {
      s.ctx.fillStyle = '#040807'; s.ctx.fillRect(0, 0, 768, 256);
      segClock(s.ctx, 768, 256, now(), '#7dffe6', '#0d2a26', true, 14);
      s.tex.needsUpdate = true;
    },
  };
}

/** Numitron: seven tiny lamp filaments in a tube, laid out as a seven segment figure. */
export function numitron(): Built {
  const root = G.group();
  const on = M.glow(0xff9a38, 1.6), off = M.dark();
  const tubes = [-1.05, -0.35, 0.35, 1.05].map((x) => {
    const g = G.group(); g.position.set(x, 0.24, 0);
    const segs: Record<string, THREE.Mesh> = {};
    for (const k of 'abcdefg') {
      const [x0, y0, x1, y1] = SEG_LINES[k];
      segs[k] = G.rod([(x0 - 0.5) * 0.26, 0.28 + y0 * 0.26, 0.02], [(x1 - 0.5) * 0.26, 0.28 + y1 * 0.26, 0.02], 0.02, off, 6);
      g.add(segs[k]);
    }
    for (const [px, py] of [[-0.16, 0.28], [0.16, 0.28], [-0.16, 0.8], [0.16, 0.8], [-0.16, 0.54], [0.16, 0.54]]) g.add(G.rod([px, py, -0.07], [px, py, 0.03], 0.006, M.steel(), 4));
    g.add(G.box(0.4, 0.66, 0.012, M.black(), [0, 0.54, -0.075]), envelope(0.29, 0.95), G.cyl(0.3, 0.06, M.plastic(0x111213), [0, 0.02, 0], 32));
    root.add(g);
    return { segs, shown: -1 };
  });
  root.add(G.rbox(3.0, 0.24, 0.85, 0.03, M.dark(), [0, 0.12, 0]), G.box(2.85, 0.012, 0.7, M.steel(), [0, 0.242, 0]));
  return {
    root, inDark: 'glows', glow: 0xffc98a, view: [20, 9],
    update: () => {
      const d = now().digits;
      tubes.forEach((tb, i) => {
        if (tb.shown === d[i]) return;
        tb.shown = d[i];
        for (const k of 'abcdefg') tb.segs[k].material = SEG[d[i]].includes(k) ? on : off;
      });
    },
  };
}

/** Plasma panel: the flat orange terminal screen of the early 1970s. Every dot is a tiny neon discharge. */
export function plasma(): Built {
  const root = G.group();
  const putty = M.enamel(0xcdc6b2);
  const s = screen(512, 512);
  const head = G.group(G.rbox(2.0, 2.0, 0.55, 0.07, putty), G.box(1.5, 1.5, 0.03, M.black(), [0, 0.03, 0.27]), G.plane(1.4, 1.4, M.lit(s, 1.4), [0, 0.03, 0.29]));
  head.position.set(0, 1.25, -0.25); head.rotation.x = -0.14;
  root.add(head, G.box(1.2, 0.3, 0.7, putty, [0, 0.15, -0.3]), G.rbox(2.0, 0.14, 0.75, 0.04, putty, [0, 0.07, 0.6]));
  const keys = new Swarm(new THREE.BoxGeometry(0.09, 0.05, 0.09), M.plastic(0x2c2e31, 0.5), 60);
  for (let i = 0; i < 60; i++) keys.put(i, ((i % 15) - 7) * 0.118, 0.16, 0.38 + Math.floor(i / 15) * 0.118);
  keys.done(); root.add(keys.mesh);
  const noise = Array.from({ length: 9 }, (_, r) => Array.from({ length: 30 }, (_, c) => Math.sin(r * 91.7 + c * 37.3) > 0.1));
  return {
    root, inDark: 'glows', glow: 0xff7a22, view: [24, 10], surface: s.canvas,
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

/** Field emission display, opened up: a cold cathode tip under every dot of phosphor. The flat tube that never shipped. */
export function fed(): Built {
  const root = G.group();
  const COLS = 13, ROWS = 7, P = 0.15;
  const tips = new Swarm(new THREE.ConeGeometry(0.035, 0.1, 12), M.chrome(), COLS * ROWS);
  const xz = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, (Math.floor(i / COLS) - (ROWS - 1) / 2) * P];
  for (let i = 0; i < COLS * ROWS; i++) { const [x, z] = xz(i); tips.put(i, x, 0.08, z); }
  tips.done();
  const gate = screen(416, 224);
  gate.ctx.fillStyle = '#8a8f96'; gate.ctx.fillRect(0, 0, 416, 224);
  gate.ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < COLS * ROWS; i++) { gate.ctx.beginPath(); gate.ctx.arc(16 + (i % COLS) * 32, 16 + Math.floor(i / COLS) * 32, 9, 0, 7); gate.ctx.fill(); }
  gate.tex.needsUpdate = true;
  const gateMat = new THREE.MeshStandardMaterial({ map: gate.tex, alphaTest: 0.5, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide });
  const gatePlate = G.plane(COLS * P, ROWS * P, gateMat, [0, 0.17, 0]); gatePlate.rotation.x = -Math.PI / 2;
  const ph = screen(416, 224);
  const phMat = M.lit(ph, 1.6); phMat.side = THREE.DoubleSide;
  const phosphor = G.plane(COLS * P, ROWS * P, phMat, [0, 0.92, 0]); phosphor.rotation.x = -Math.PI / 2;
  root.add(tips.mesh, gatePlate, phosphor, G.box(COLS * P + 0.2, 0.06, ROWS * P + 0.2, M.black(), [0, 0, 0]), G.box(COLS * P + 0.2, 0.05, ROWS * P + 0.2, M.glass(0xe8f6ff, 0.2), [0, 0.96, 0]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.cyl(0.02, 0.9, M.glass(0xffffff, 0.3), [sx * (COLS * P / 2 + 0.03), 0.48, sz * (ROWS * P / 2 + 0.03)], 10));
  // electron beams from tip to phosphor
  const pos = new Float32Array(COLS * ROWS * 6), col = new Float32Array(COLS * ROWS * 6);
  for (let i = 0; i < COLS * ROWS; i++) { const [x, z] = xz(i); pos.set([x, 0.13, z, x, 0.915, z], i * 6); }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const beams = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(beams);
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9db8ff, view: [28, 24],
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
  const bulbs = new Swarm(new THREE.SphereGeometry(0.05, 14, 10), M.plastic(0x7d776a, 0.3), N);
  const light = lamps(new THREE.SphereGeometry(0.058, 12, 9), N);
  at.forEach(([x, y], i) => { bulbs.put(i, x, y, 0); light.put(i, x, y, 0.004); });
  bulbs.done(); light.done();
  const wall = M.black();
  cx.forEach((x0) => {
    root.add(G.box(CW + 0.1, CH + 0.1, 0.3, wall, [x0, 0, -0.2]));
    for (let i = 0; i <= 5; i++) root.add(G.box(0.012, CH, 0.12, wall, [x0 + (i - 2.5) * P, 0, 0.0]));
    for (let j = 0; j <= 7; j++) root.add(G.box(CW, 0.012, 0.12, wall, [x0, (j - 3.5) * P, 0.0]));
  });
  root.add(bulbs.mesh, light.mesh, G.box(0.3, CH + 0.1, 0.3, wall, [0, 0, -0.2]), G.box(4.2, 0.1, 0.5, M.steel(), [0, -CH / 2 - 0.1, -0.15]));
  for (const x of [-1.9, 1.9]) root.add(G.box(0.08, 0.5, 0.08, M.steel(), [x, -CH / 2 - 0.35, -0.15]), G.box(0.3, 0.04, 0.6, M.steel(), [x, -CH / 2 - 0.6, -0.1]));
  const level = new Float32Array(N);
  return {
    root, inDark: 'glows', glow: 0xffc070, view: [18, 6],
    update: () => {
      const n = now();
      const text = n.hhmm.replace(':', '');
      for (let i = 0; i < N; i++) {
        let lit: boolean;
        if (i >= 140) lit = n.s % 2 === 0;
        else lit = dots(text[Math.floor(i / 35)]).on(i % 5, Math.floor((i % 35) / 5));
        // filaments take a moment to heat and cool, which is the eggcrate's whole look
        level[i] += ((lit ? 1 : 0) - level[i]) * (lit ? 0.16 : 0.09);
        light.tint(i, level[i], level[i] * 0.74, level[i] * 0.38);
      }
      if (light.mesh.instanceColor) light.mesh.instanceColor.needsUpdate = true;
    },
  };
}
