import { G, M, Swarm, screen, THREE, type Built } from '../kit';
import { feet, screws } from '../parts';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SEG, SEG_LINES, bigTime, dots, now } from '../../sims/draw';
import { strokesOf } from './h2';

/** Gyricon, magnified: beads that are black on one half and white on the other, turning over in oil-filled pockets in a rubber sheet. */
export function gyricon(): Built {
  const root = G.group();
  const COLS = 13, ROWS = 7, P = 0.16, N = COLS * ROWS, y = 0.78;
  const two = screen(8, 32);
  two.ctx.fillStyle = '#f4f2ea'; two.ctx.fillRect(0, 0, 8, 16); two.ctx.fillStyle = '#0e0f10'; two.ctx.fillRect(0, 16, 8, 16);
  two.tex.needsUpdate = true;
  const beads = new Swarm(new THREE.SphereGeometry(0.072, 28, 20), new THREE.MeshStandardMaterial({ map: two.tex, roughness: 0.3 }), N);
  const ang = new Float32Array(N).fill(-Math.PI / 2);
  const xy = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, y + ((ROWS - 1) / 2 - Math.floor(i / COLS)) * P];
  for (let i = 0; i < N; i++) { const [x, yy] = xy(i); beads.put(i, x, yy, 0, ang[i], 0, 0); }
  beads.done();
  const W = COLS * P + 0.14, H = ROWS * P + 0.14;
  // the sheet, between a clear electrode in front and a plain one behind
  root.add(beads.mesh, G.rbox(W, H, 0.19, 0.03, M.glass(0xb6ad90, 0.07, 0.5), [0, y, 0]), G.pane(W + 0.04, H + 0.04, 0.014, [0, y, 0.104]), G.box(W + 0.08, H + 0.08, 0.03, M.dark(), [0, y, -0.115], 0.008));
  root.add(G.rbox(W + 0.3, 0.06, 0.6, 0.02, M.dark(), [0, 0.03, 0]), G.box(0.06, y - H / 2, 0.06, M.steel(1), [-W / 2 + 0.1, (y - H / 2) / 2 + 0.03, -0.1]), G.box(0.06, y - H / 2, 0.06, M.steel(1), [W / 2 - 0.1, (y - H / 2) / 2 + 0.03, -0.1]));
  // the two leads that set the field across the sheet
  root.add(G.wire([[W / 2, y - 0.3, 0.104], [W / 2 + 0.16, y - 0.5, 0.1], [W / 2 + 0.1, 0.1, 0.16]], 0.012, M.plastic(0xb5281d, 0.5)), G.wire([[W / 2, y - 0.2, -0.115], [W / 2 + 0.2, y - 0.5, -0.14], [W / 2 + 0.16, 0.1, -0.1]], 0.012, M.rubber()));
  let first = true;
  return {
    root, inDark: 'vanishes', view: [20, 6],
    update: () => {
      const d = dots(now().hhmmss.slice(6));
      for (let i = 0; i < N; i++) {
        const want = d.on((i % COLS) - 1, Math.floor(i / COLS)) ? Math.PI / 2 : -Math.PI / 2;
        if (Math.abs(want - ang[i]) < 0.001) continue;
        ang[i] = first ? want : ang[i] + (want - ang[i]) * 0.14;
        const [x, yy] = xy(i); beads.put(i, x, yy, 0, ang[i], 0, 0);
      }
      first = false;
      beads.mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Electrophoretic ink: a reader that looks printed, flashes when the page changes, and is unreadable in the dark. */
export function eink(): Built {
  const root = G.group();
  const s = screen(384, 512);
  const shell = M.plastic(0xd7d4cc, 0.6);
  const dev = G.group(
    G.rbox(1.5, 2.0, 0.07, 0.035, shell), G.bezel(1.5, 2.0, 1.26, 1.68, 0.012, 0.012, shell, [0, 0.06, 0.036], 0.035, 0.004), G.plane(1.26, 1.68, M.printed(s, 0.96), [0, 0.06, 0.0365]),
    G.cyl(0.05, 0.012, M.plastic(0xb9b6ae, 0.5), [0, -0.9, 0.036], 28).rotateX(Math.PI / 2),
    // page keys down both edges
    G.rbox(0.03, 0.34, 0.03, 0.01, M.plastic(0xb9b6ae, 0.5), [-0.752, 0.2, 0]), G.rbox(0.03, 0.34, 0.03, 0.01, M.plastic(0xb9b6ae, 0.5), [0.752, 0.2, 0]),
  );
  dev.position.set(0, 1.1, 0); dev.rotation.x = -0.2;
  root.add(dev, G.rbox(1.0, 0.05, 0.75, 0.02, M.dark(), [0, 0.025, -0.1]), G.box(0.9, 0.04, 0.06, M.dark(), [0, 0.07, 0.2]), G.box(0.08, 1.0, 0.04, M.dark(1), [0, 0.52, -0.3]).rotateX(-0.1));
  const bars = Array.from({ length: 9 }, (_, i) => 0.55 + 0.45 * Math.abs(Math.sin(i * 7.3)));
  const page = (c: CanvasRenderingContext2D, stamp: string, ink: string, paper: string) => {
    c.fillStyle = paper; c.fillRect(0, 0, 384, 512);
    c.save(); c.translate(0, -150); bigTime(c, 384, 512, stamp.slice(0, 5), ink, 800, 0.3); c.restore();
    c.fillStyle = ink; c.fillRect(40, 200, 304, 3);
    bars.forEach((w, i) => c.fillRect(40, 232 + i * 26, 304 * w, 9));
    c.font = '16px "PT Mono", monospace'; c.textAlign = 'left'; c.fillText(`page set at ${stamp}`, 40, 484);
  };
  let stamp = '', flashAt = -9;
  return {
    root, inDark: 'vanishes', view: [22, 8], surface: s.canvas,
    update: ({ t }) => {
      const n = now();
      const mark = `${n.hhmm}:${String(Math.floor(n.s / 15) * 15).padStart(2, '0')}`;
      if (mark !== stamp) { if (stamp) flashAt = t; stamp = mark; }
      const dt = t - flashAt;
      if (dt > 0.6 && dt < 0.7) return;
      // the full refresh: drive every capsule black, then white, then to the new page
      if (dt < 0.2) page(s.ctx, stamp, '#d9d6cb', '#1b1b1a');
      else if (dt < 0.4) { s.ctx.fillStyle = '#dedbd0'; s.ctx.fillRect(0, 0, 384, 512); }
      else page(s.ctx, stamp, '#1b1b1a', '#d9d6cb');
      s.tex.needsUpdate = true;
    },
  };
}

/** Cholesteric writing tablet: pressure flips the crystal to its reflecting state and the stroke stays, unpowered. */
export function chlcd(): Built {
  const root = G.group();
  const s = screen(512, 340);
  const shell = M.plastic(0xd1481f, 0.5);
  const tab = G.group(
    G.rbox(1.8, 1.25, 0.06, 0.05, shell), G.bezel(1.8, 1.25, 1.56, 1.02, 0.03, 0.012, shell, [0, 0.03, 0.031], 0.05, 0.004), G.plane(1.56, 1.02, M.printed(s, 0.4), [0, 0.03, 0.031]),
    // one button: it sends the pulse that wipes the sheet
    G.cyl(0.05, 0.014, M.plastic(0xf2efe6, 0.4), [0, -0.555, 0.033], 28).rotateX(Math.PI / 2),
  );
  const pen = G.group(G.cyl(0.024, 0.7, M.plastic(0x1c1d20, 0.4), [0, 0.4, 0], 20), G.cyl(0.005, 0.07, M.plastic(0x1c1d20, 0.4), [0, 0.02, 0], 16, 0.024), G.cyl(0.025, 0.03, M.steel(), [0, 0.76, 0], 20));
  pen.rotation.set(0.5, 0, -0.45);
  tab.add(pen);
  tab.position.set(0, 0.68, 0); tab.rotation.x = -0.95;
  root.add(tab, G.rbox(1.9, 0.05, 1.15, 0.02, M.dark(), [0, 0.025, 0]), G.profile([[-0.5, 0.05], [0.42, 0.05], [-0.42, 0.62], [-0.5, 0.62]], 1.6, M.dark(), undefined, 0.01));
  // every stroke as a list of points in screen pixels
  let path: [number, number][][] = [], stamp = '';
  const plan = (text: string) => {
    path = [];
    [...text].forEach((ch, i) => {
      if (ch === ':') { path.push([[258, 130], [258, 134]], [[254, 216], [254, 220]]); return; }
      const x0 = [52, 142, 0, 292, 382][i];
      for (const st of strokesOf(Number(ch))) path.push(st.map(([x, y]) => [x0 + x * 76, 256 - y * 108]));
    });
  };
  const len = (p: [number, number][]) => p.reduce((sum, q, i) => (i ? sum + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
  return {
    root, inDark: 'vanishes', view: [18, 18], surface: s.canvas,
    update: ({ t }) => {
      const T = 13, u = t % T;
      if (u < 0.3 || !path.length) { const h = now().hhmm; if (h !== stamp || u < 0.3) { stamp = h; plan(h); } }
      const c = s.ctx;
      c.fillStyle = u < 0.25 ? '#3a4a2a' : '#0b0e0c'; c.fillRect(0, 0, 512, 340); // erase is one blink of the whole sheet
      const total = path.reduce((sum, p) => sum + len(p) + 30, 0);
      let budget = Math.max(0, (u - 0.5) / 7) * total;
      let tip: [number, number] = path[0]?.[0] ?? [0, 0];
      c.strokeStyle = '#c4f060'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const p of path) {
        if (budget <= 0) break;
        c.beginPath(); c.moveTo(p[0][0], p[0][1]); tip = p[0];
        for (let i = 1; i < p.length && budget > 0; i++) {
          const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
          const k = Math.min(1, budget / Math.max(seg, 0.001));
          tip = [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * k, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * k];
          c.lineTo(tip[0], tip[1]); budget -= seg;
        }
        c.stroke(); budget -= 30;
      }
      s.tex.needsUpdate = true;
      pen.position.set((tip[0] / 512 - 0.5) * 1.56, 0.03 + (0.5 - tip[1] / 340) * 1.02, 0.04);
      pen.visible = u > 0.5 && u < 7.6;
    },
  };
}

/** Electrowetting, magnified: a film of dyed oil covers each cell until a voltage makes the water push it into a corner. */
export function electrowetting(): Built {
  const root = G.group();
  const COLS = 4, ROWS = 3, C = 0.5, N = COLS * ROWS, TW = COLS * C, TD = ROWS * C;
  const tray = G.group();
  const oil = new Swarm(new RoundedBoxGeometry(1, 1, 1, 4, 0.22).translate(0.5, 0.5, 0.5), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.16, clearcoat: 0.5, clearcoatRoughness: 0.08 }), N);
  const state = new Float32Array(N);
  const hue = [[0.0, 0.42, 0.6], [0.62, 0.03, 0.36], [0.74, 0.56, 0.0], [0.05, 0.05, 0.06]];
  const put = (i: number) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    // the same oil, spread thin over the whole cell or heaped in one corner
    const w = 0.45 - 0.29 * state[i], h = 0.0026 / (w * w);
    oil.put(i, (c - COLS / 2) * C + 0.025, 0.031, (r - ROWS / 2) * C + 0.025, 0, 0, 0, w, h, w);
  };
  for (let i = 0; i < N; i++) { put(i); oil.tint(i, ...(hue[i % COLS] as [number, number, number])); }
  oil.done();
  tray.add(oil.mesh, G.box(TW + 0.06, 0.06, TD + 0.06, M.paper(0xf7f6f1), [0, 0, 0], 0.01));
  const wall = M.plastic(0x101112, 0.6);
  for (let i = 0; i <= COLS; i++) tray.add(G.box(0.024, 0.09, TD + 0.024, wall, [(i - COLS / 2) * C, 0.075, 0], 0.004));
  for (let j = 0; j <= ROWS; j++) tray.add(G.box(TW + 0.024, 0.09, 0.024, wall, [0, 0.075, (j - ROWS / 2) * C], 0.004));
  // sealed under water: glass all round and a cover plate carrying the second electrode
  const lid = G.pane(TW + 0.08, TD + 0.08, 0.03, [0, 0.36, 0]); lid.rotation.x = -Math.PI / 2;
  tray.add(lid, G.pane(TW + 0.08, 0.3, 0.014, [0, 0.19, TD / 2 + 0.035]), G.pane(TW + 0.08, 0.3, 0.014, [0, 0.19, -TD / 2 - 0.035]));
  for (const sx of [-1, 1]) { const side = G.pane(TD + 0.08, 0.3, 0.014, [sx * (TW / 2 + 0.035), 0.19, 0]); side.rotation.y = Math.PI / 2; tray.add(side); }
  tray.position.set(0, 0.66, 0); tray.rotation.x = 0.62;
  root.add(tray, G.rbox(2.3, 0.05, 1.6, 0.02, M.dark(), [0, 0.025, 0]), G.profile([[-0.62, 0.05], [0.5, 0.05], [-0.5, 0.86], [-0.62, 0.86]], 1.9, M.dark(), undefined, 0.012));
  let first = true;
  return {
    root, inDark: 'vanishes', view: [22, 16],
    update: ({ t }) => {
      for (let i = 0; i < N; i++) {
        const want = Math.sin(t * 1.3 + (i % COLS) * 1.1 + Math.floor(i / COLS) * 2.3) > 0.1 ? 1 : 0;
        state[i] += (want - state[i]) * (first ? 1 : 0.25); // tens of milliseconds in the real thing: fast enough for video
        put(i);
      }
      first = false;
      oil.mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Interferometric modulator, magnified: a mirror on springs behind glass. The gap picks the colour, collapsing it gives black. */
export function imod(): Built {
  const root = G.group();
  const COLS = 6, ROWS = 3, C = 0.32, N = COLS * ROWS;
  const arr = G.group();
  const membrane = new Swarm(new RoundedBoxGeometry(C - 0.04, C - 0.04, 0.012, 1, 0.004), M.chrome(), N);
  // what the eye sees from the front: structural colour, like a soap film or a beetle's back
  const colour = new Swarm(new THREE.BoxGeometry(C - 0.02, C - 0.02, 0.004), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2, iridescence: 0.6, iridescenceIOR: 1.8 }), N);
  const posts = new Swarm(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 10).rotateX(Math.PI / 2), M.dark(), (COLS + 1) * (ROWS + 1));
  const open = new Float32Array(N).fill(1);
  const gaps = [0.2, 0.14, 0.09];
  const rgb = [[0.72, 0.06, 0.04], [0.05, 0.56, 0.14], [0.05, 0.14, 0.72]];
  const xy = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * C, ((ROWS - 1) / 2 - Math.floor(i / COLS)) * C];
  const put = (i: number) => {
    const [x, y] = xy(i), k = i % 3;
    membrane.put(i, x, y, -0.012 - gaps[k] * open[i]);
    colour.put(i, x, y, 0);
    const v = open[i];
    colour.tint(i, 0.02 + rgb[k][0] * v, 0.02 + rgb[k][1] * v, 0.02 + rgb[k][2] * v);
  };
  for (let i = 0; i < N; i++) put(i);
  let pi = 0;
  for (let c = 0; c <= COLS; c++) for (let r = 0; r <= ROWS; r++) posts.put(pi++, (c - COLS / 2) * C, (r - ROWS / 2) * C, -0.14);
  membrane.done(); colour.done(); posts.done();
  const AW = COLS * C, AH = ROWS * C;
  arr.add(membrane.mesh, colour.mesh, posts.mesh, G.pane(AW + 0.08, AH + 0.08, 0.04, [0, 0, 0.024]), G.box(AW + 0.12, AH + 0.12, 0.03, M.dark(), [0, 0, -0.3], 0.008));
  arr.position.set(0, 0.74, 0); arr.rotation.x = -0.12;
  root.add(arr, G.rbox(2.3, 0.05, 0.75, 0.02, M.dark(), [0, 0.025, -0.1]), G.box(0.06, 0.22, 0.06, M.steel(1), [-0.9, 0.14, -0.15]), G.box(0.06, 0.22, 0.06, M.steel(1), [0.9, 0.14, -0.15]), feet(2.3, 0.75, 0.05, 0.03, -0.03).translateZ(-0.1));
  const palette = [[1, 1, 1], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1], [1, 0, 1], [0, 0, 0]];
  let first = true;
  return {
    root, inDark: 'vanishes', view: [40, 10],
    update: ({ t }) => {
      for (let i = 0; i < N; i++) {
        const pixel = Math.floor((i % COLS) / 3) + Math.floor(i / COLS) * 2;
        const want = palette[(Math.floor(t * 0.7) + pixel) % palette.length][i % 3];
        open[i] += (want - open[i]) * (first ? 1 : 0.3);
        put(i);
      }
      first = false;
      membrane.mesh.instanceMatrix.needsUpdate = true;
      if (colour.mesh.instanceColor) colour.mesh.instanceColor.needsUpdate = true;
    },
  };
}

/** Electrochromic: ions soak into a printed film and darken it. Slow, cheap, and it keeps its state. */
export function electrochromic(): Built {
  const root = G.group();
  const s = screen(384, 256);
  // a printed label: plastic film, a coin cell, nothing else
  const card = G.group(G.slab(1.5, 1.0, 0.04, 0.016, M.paper(0xf4f2ea)), G.plane(1.4, 0.92, M.printed(s, 0.9), [0, 0, 0.0085]), G.cyl(0.07, 0.02, M.steel(), [0.6, -0.36, -0.016], 28).rotateX(Math.PI / 2));
  card.position.set(-0.38, 0.58, 0.32); card.rotation.x = -0.35;
  const tint = new THREE.MeshStandardMaterial({ color: 0x1c3f9e, transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  const frame = M.dark(), sash = M.enamel(0xe9e6dc);
  root.add(card, G.profile([[-0.14, 0.05], [0.2, 0.05], [-0.1, 0.52], [-0.14, 0.52]], 0.5, frame, [-0.38, 0, 0.1], 0.008), G.rbox(2.3, 0.05, 1.35, 0.02, frame, [0, 0.025, 0]));
  // and at the other end of the scale: a window that tints itself
  root.add(G.box(0.93, 1.38, 0.012, tint, [0.62, 0.84, -0.35], 0), G.pane(0.95, 1.4, 0.024, [0.62, 0.84, -0.35]), G.bezel(1.13, 1.58, 0.93, 1.38, 0.01, 0.09, sash, [0.62, 0.84, -0.35], 0.02, 0.012), G.box(1.25, 0.05, 0.2, sash, [0.62, 0.035, -0.33]));
  root.add(screws([[0.12, 1.58, -0.3], [1.12, 1.58, -0.3]], 0.014));
  const level = new Float32Array(14).fill(-1);
  return {
    root, inDark: 'vanishes', view: [20, 12], surface: s.canvas,
    update: ({ t }) => {
      const n = now(), c = s.ctx;
      c.fillStyle = '#f1efe6'; c.fillRect(0, 0, 384, 256);
      [Math.floor(n.m / 10), n.m % 10].forEach((digit, k) => {
        [...'abcdefg'].forEach((seg, j) => {
          const i = k * 7 + j, want = SEG[digit].includes(seg) ? 1 : 0;
          // the film takes seconds to colour and to bleach, not milliseconds
          level[i] = level[i] < 0 ? want : level[i] + (want - level[i]) * 0.012;
          c.globalAlpha = 0.07 + 0.93 * level[i];
          segment(c, 70 + k * 130, 34, 96, 170, seg);
        });
      });
      c.globalAlpha = 1;
      c.fillStyle = '#1c3f9e'; c.font = '600 22px "Sofia Sans Variable", sans-serif'; c.textAlign = 'left'; c.fillText('minutes past the hour', 70, 236);
      s.tex.needsUpdate = true;
      tint.opacity = 0.42 + 0.36 * Math.sin(t * 0.5);
    },
  };
}

function segment(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seg: string): void {
  const t = 0.18 * w, [x0, y0, x1, y1] = SEG_LINES[seg];
  c.strokeStyle = '#1c3f9e'; c.lineCap = 'round'; c.lineWidth = t;
  c.beginPath(); c.moveTo(x + t / 2 + x0 * (w - t), y + t / 2 + (1 - y0 / 2) * (h - t)); c.lineTo(x + t / 2 + x1 * (w - t), y + t / 2 + (1 - y1 / 2) * (h - t)); c.stroke();
}
