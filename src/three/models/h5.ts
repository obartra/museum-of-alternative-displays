import { G, M, Swarm, screen, THREE, type Built, type V3 } from '../kit';
import { block, can, flatLead, fused, groundEdge, heads, lead, patch, put, roundedRect, sheetOfGlass } from './h3';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SEG, SEG_LINES, bigTime, dots, now } from '../../sims/draw';
import { strokesOf } from './h2';

/** Gyricon, magnified: beads that are black on one half and white on the other, turning over in oil-filled pockets in a rubber sheet. */
export function gyricon(): Built {
  const root = G.group(), made = G.group();
  const COLS = 13, ROWS = 7, P = 0.16, N = COLS * ROWS, y = 0.78;
  const two = screen(8, 32);
  two.ctx.fillStyle = '#f4f2ea'; two.ctx.fillRect(0, 0, 8, 16); two.ctx.fillStyle = '#0e0f10'; two.ctx.fillRect(0, 16, 8, 16);
  two.tex.needsUpdate = true;
  const beads = new Swarm(new THREE.SphereGeometry(0.072, 20, 12), new THREE.MeshStandardMaterial({ map: two.tex, roughness: 0.5 }), N);
  // every bead in its own pocket of oil: a round hollow in the rubber, a little wider than the bead, seen by its rim
  const hollow = M.bulb(0xb6ad90, 0.6);
  // oil and rubber bend light almost alike: the wall of a pocket shows where it turns away, and does not glint
  hollow.specularIntensity = 0;
  const pockets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.081, 16, 10), hollow, N), place = new THREE.Matrix4();
  const ang = new Float32Array(N).fill(-Math.PI / 2);
  const xy = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, y + ((ROWS - 1) / 2 - Math.floor(i / COLS)) * P];
  for (let i = 0; i < N; i++) { const [x, yy] = xy(i); beads.put(i, x, yy, 0, ang[i], 0, 0); pockets.setMatrixAt(i, place.makeTranslation(x, yy, 0)); }
  beads.done();
  // The beads turn where they are, so they can be left out of any picture they are not in. They cast no shadows:
  // behind them is only the dark plate, where a shadow could not be seen.
  beads.mesh.frustumCulled = true; beads.mesh.userData.noShadow = true;
  const W = COLS * P + 0.14, H = ROWS * P + 0.14, low = y - H / 2;
  const dark = M.dark(), steel = M.steel(1), brass = M.brass(), rubber = M.rubber(), red = M.plastic(0xb5281d, 0.5);
  // the sheet, between a clear electrode in front and a plain one behind
  root.add(beads.mesh, pockets, G.rbox(W, H, 0.19, 0.03, M.glass(0xb6ad90, 0.07, 0.5), [0, y, 0]));
  made.add(sheetOfGlass(W + 0.04, H + 0.04, 0.014, M.glass(0xb9c9c6, 0.08), groundEdge(), [0, y, 0.104]), G.box(W + 0.08, H + 0.08, 0.03, dark, [0, y, -0.115], 0.008));
  // two clamps hold the three layers together by their lower edge, each closed by a thumbscrew, each on a short foot
  made.add(G.rbox(W + 0.3, 0.06, 0.6, 0.02, dark, [0, 0.03, 0]));
  for (const x of [-0.8, 0.8]) {
    made.add(block(0.12, low - 0.08, 0.12, steel, [x, 0.06 + (low - 0.08) / 2, -0.01], 0.008), block(0.16, 0.03, 0.34, steel, [x, low - 0.035, -0.01], 0.006));
    made.add(block(0.16, 0.16, 0.028, steel, [x, low + 0.04, 0.13], 0.006), block(0.16, 0.16, 0.028, steel, [x, low + 0.04, -0.15], 0.006));
    made.add(G.rod([x, low + 0.05, 0.14], [x, low + 0.05, 0.162], 0.012, brass, 8), G.rod([x, low + 0.05, 0.162], [x, low + 0.05, 0.19], 0.032, dark, 12));
  }
  // the two leads that set the field across the sheet, each from a terminal on the base to a clip on its electrode
  for (const [z, ze, lead0, cap] of [[0.2, 0.104, red, red], [-0.22, -0.115, rubber, dark]] as const) {
    made.add(can(0.012, 0.07, brass, [W / 2 - 0.02, 0.095, z], 8), can(0.03, 0.04, cap, [W / 2 - 0.02, 0.125, z], 12), can(0.036, 0.008, brass, [W / 2 - 0.02, 0.064, z], 12));
    made.add(block(0.05, 0.07, 0.04, brass, [W / 2 + 0.026, y - 0.3, ze], 0.006));
    made.add(lead([[W / 2 + 0.04, y - 0.31, ze], [W / 2 + 0.1, y - 0.42, ze + Math.sign(z) * 0.03], [W / 2 + 0.07, 0.3, z * 0.8], [W / 2 - 0.01, 0.15, z], [W / 2 - 0.02, 0.105, z]], 0.012, lead0, 22));
  }
  root.add(fused(made));
  let first = true, sec = -1, d = dots('00');
  return {
    root, views: { beads: { at: [0.6, 1.05, 1.0], to: [0.1, 0.8, 0], fov: 28 } }, inDark: 'vanishes', view: [20, 6],
    update: () => {
      const n = now();
      if (n.s !== sec) { sec = n.s; d = dots(n.hhmmss.slice(6)); }
      let turned = false;
      for (let i = 0; i < N; i++) {
        const want = d.on((i % COLS) - 1, Math.floor(i / COLS)) ? Math.PI / 2 : -Math.PI / 2;
        if (Math.abs(want - ang[i]) < 0.001) continue;
        ang[i] = first ? want : ang[i] + (want - ang[i]) * 0.14;
        beads.put(i, ((i % COLS) - (COLS - 1) / 2) * P, y + ((ROWS - 1) / 2 - Math.floor(i / COLS)) * P, 0, ang[i], 0, 0);
        turned = true;
      }
      first = false;
      if (turned) beads.mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** The label moulded and printed on the back of the reader. */
function readerLabel(): THREE.CanvasTexture {
  const s = screen(128, 64), c = s.ctx;
  c.fillStyle = '#4a4c4f'; c.fillRect(0, 0, 128, 64);
  c.fillStyle = '#9a9c9f'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.font = '700 17px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'; c.fillText('ELECTRONIC READER', 64, 20);
  c.font = '9px "PT Mono", monospace'; c.fillText('5 V =  1 A', 64, 33);
  for (let i = 0; i < 3; i++) c.fillRect(14 + i * 6, 42 + i * 6, 100 - i * 12, 2);
  s.tex.needsUpdate = true;
  return s.tex;
}

/** Electrophoretic ink: a reader that looks printed, flashes when the page changes, and is unreadable in the dark. */
export function eink(): Built {
  const root = G.group(), made = G.group();
  // drawn at twice the size it is laid out in: sharp letters are what this kind of screen is known for
  const s = screen(768, 1024);
  s.ctx.setTransform(2, 0, 0, 2, 0, 0);
  const TILT = 0.2, cs = Math.cos(TILT), sn = Math.sin(TILT);
  // the frame is whiter than the page: the white of this ink is the light grey of its pigment
  const shell = M.plastic(0xe9e7e0, 0.55), soft = M.plastic(0x55585c, 0.85), key = M.plastic(0xc9c6be, 0.5), dark = M.dark(), black = M.black();
  // the case is two mouldings: a pale frame with the window for the page, on a back of soft dark plastic
  const frame = roundedRect(new THREE.Shape(), 1.5, 2.0, 0.11);
  frame.holes.push(roundedRect(new THREE.Path(), 1.27, 1.69, 0.012, 0, 0.06));
  const dev = G.group(
    G.slab(1.5, 2.0, 0.11, 0.05, soft, [0, 0, -0.01], 0.016), G.extruded(frame, 0.022, shell, [0, 0, 0.026], 0.005),
    G.plane(1.27, 1.69, M.printed(s, 0.96), [0, 0.06, 0.0265]),
    // page keys down both edges, a long one for the next page and a short one for the last, and one round key below
    can(0.05, 0.008, key, [0, -0.9, 0.039], 24).rotateX(Math.PI / 2),
  );
  for (const k of [-1, 1]) dev.add(block(0.045, 0.36, 0.008, key, [k * 0.69, 0.32, 0.039], 0.003), block(0.045, 0.2, 0.008, key, [k * 0.69, -0.02, 0.039], 0.003));
  // the power slide on the top edge. On the back, the label and two groups of slots for the loudspeaker
  dev.add(block(0.14, 0.014, 0.022, key, [0.42, 1.002, -0.004], 0.004));
  const label = patch(0.5, 0.25, new THREE.MeshStandardMaterial({ map: readerLabel(), roughness: 0.85 }), [0, -0.5, -0.0353], 0, 0, 1, 1);
  label.rotation.y = Math.PI;
  dev.add(label);
  for (const k of [-1, 1]) for (let i = 0; i < 4; i++) dev.add(G.box(0.12, 0.012, 0.004, black, [k * 0.42, -0.8 + i * 0.03, -0.0355], 0));
  dev.position.set(0, 1.1, 0); dev.rotation.x = -TILT;
  // a point of the reader as it stands in the room, from its own height and depth
  const at = (y: number, z: number): [number, number] => [-y * sn + z * cs, 1.1 + y * cs + z * sn];
  // the easel: a rest cut to the reader's lower edge with a low lip in front, and an arm with a rubber pad behind
  const heel = at(-1, -0.035), toe = at(-1, 0.041), lip = at(-0.953, 0.041);
  made.add(dev, G.rbox(1.0, 0.05, 0.75, 0.02, dark, [0, 0.025, -0.08]));
  made.add(G.profile([[heel[0] - 0.04, 0.05], [toe[0] + 0.045, 0.05], [lip[0] + 0.034, lip[1] + 0.004], [lip[0], lip[1]], [toe[0] + 0.002, toe[1] - 0.002], [heel[0] - 0.008, heel[1] - 0.004]], 0.9, dark, undefined, 0.006));
  const a = new THREE.Vector3(0, 0.05, -0.34), rest = at(0.3, -0.035), b = new THREE.Vector3(0, rest[1], rest[0] - 0.02);
  const arm = block(0.09, a.distanceTo(b), 0.014, dark, undefined, 0.004);
  arm.position.copy(a).lerp(b, 0.5); arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  made.add(arm, block(0.16, 0.03, 0.1, dark, [0, 0.064, -0.34], 0.006), block(0.09, 0.07, 0.014, M.rubber(), [0, rest[1] - 0.01, rest[0] - 0.008], 0.004));
  root.add(fused(made));
  const bars = Array.from({ length: 9 }, (_, i) => 0.55 + 0.45 * Math.abs(Math.sin(i * 7.3)));
  const page = (c: CanvasRenderingContext2D, stamp: string, ink: string, paper: string) => {
    c.fillStyle = paper; c.fillRect(0, 0, 384, 512);
    c.save(); c.translate(0, -150); bigTime(c, 384, 512, stamp.slice(0, 5), ink, 800, 0.3); c.restore();
    c.fillStyle = ink; c.fillRect(40, 200, 304, 3);
    bars.forEach((w, i) => c.fillRect(40, 232 + i * 26, 304 * w, 9));
    c.font = '16px "PT Mono", monospace'; c.textAlign = 'left'; c.fillText(`page set at ${stamp}`, 40, 484);
  };
  let slot = -1, stamp = '', flashAt = -9, shown = -1;
  return {
    root, views: { night: { at: [0, 1.45, 3.0], to: [0, 1.1, 0], fov: 38, play: 0.1 }, page: { at: [0.15, 1.3, 1.7], to: [0, 1.15, 0], fov: 32, play: 0.1 }, read: { at: [0, 1.45, 3.0], to: [0, 1.1, 0], fov: 38, play: 0.1 } }, inDark: 'vanishes', view: [22, 8], surface: s.canvas,
    update: ({ t }) => {
      const n = now(), q = Math.floor((n.h * 3600 + n.m * 60 + n.s) / 15);
      if (q !== slot) { if (slot >= 0) flashAt = t; slot = q; stamp = `${n.hhmm}:${String(Math.floor(n.s / 15) * 15).padStart(2, '0')}`; shown = -1; }
      // the full refresh: drive every capsule black, then white, then to the new page. The page is drawn once and then
      // left alone, as the real one is: it costs nothing to keep
      const dt = t - flashAt, phase = dt < 0.2 ? 0 : dt < 0.4 ? 1 : 2;
      if (phase === shown) return;
      shown = phase;
      if (phase === 0) page(s.ctx, stamp, '#d9d6cb', '#1b1b1a');
      else if (phase === 1) { s.ctx.fillStyle = '#dedbd0'; s.ctx.fillRect(0, 0, 384, 512); }
      else page(s.ctx, stamp, '#1b1b1a', '#d9d6cb');
      s.tex.needsUpdate = true;
    },
  };
}

/** Cholesteric writing tablet: pressure flips the crystal to its reflecting state and the stroke stays, unpowered. */
export function chlcd(): Built {
  const root = G.group(), made = G.group();
  const s = screen(512, 340);
  const TILT = 0.95, cs = Math.cos(TILT), sn = Math.sin(TILT);
  const shell = M.plastic(0xd1481f, 0.5), pale = M.plastic(0xf2efe6, 0.4), ink = M.plastic(0x1c1d20, 0.4), dark = M.dark(), steel = M.steel(1), rubber = M.rubber();
  // the case: one flat moulding with round corners, and a frame round the writing film with the window where it belongs
  const frame = roundedRect(new THREE.Shape(), 1.8, 1.25, 0.09);
  frame.holes.push(roundedRect(new THREE.Path(), 1.57, 1.03, 0.03, 0, 0.03));
  const tab = G.group(
    G.slab(1.8, 1.25, 0.09, 0.05, shell, [0, 0, 0], 0.014), G.extruded(frame, 0.014, shell, [0, 0, 0.031], 0.004), G.plane(1.57, 1.03, M.printed(s, 0.4), [0, 0.03, 0.0265]),
    // one button: it sends the pulse that wipes the sheet
    can(0.05, 0.012, pale, [0, -0.555, 0.04], 28).rotateX(Math.PI / 2), put(new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.004, 6, 28), ink), [0, -0.555, 0.0385]),
  );
  // two clips on the right-hand edge keep the stylus when no one is writing
  for (const y of [-0.22, 0.24]) tab.add(block(0.07, 0.06, 0.056, shell, [0.916, y, 0.004], 0.008));
  // on the back: the round door of the coin cell with its slot, and four rubber feet
  tab.add(G.rod([-0.55, 0.3, -0.025], [-0.55, 0.3, -0.03], 0.08, pale, 20), G.box(0.09, 0.012, 0.002, ink, [-0.55, 0.3, -0.0305], 0));
  for (const x of [-0.75, 0.75]) for (const y of [-0.5, 0.5]) tab.add(G.rod([x, y, -0.025], [x, y, -0.031], 0.035, rubber, 12));
  // the rest holds it by two hooks under its lower edge, clear of the button
  for (const x of [-0.55, 0.55]) tab.add(block(0.22, 0.024, 0.1, dark, [x, -0.639, 0.01], 0.004), block(0.22, 0.07, 0.016, dark, [x, -0.616, 0.052], 0.004));
  tab.position.set(0, 0.68, 0); tab.rotation.x = -TILT;
  // the stylus: a pen without ink, with a hard point. It is built point down, at the point
  const pen = fused(G.group(
    can(0.004, 0.05, pale, [0, 0.025, 0], 10, 0.012), can(0.012, 0.06, ink, [0, 0.08, 0], 12, 0.024), can(0.024, 0.6, ink, [0, 0.41, 0], 14), can(0.025, 0.03, steel, [0, 0.725, 0], 14),
    block(0.012, 0.2, 0.008, steel, [0, 0.62, 0.028], 0.003), block(0.016, 0.02, 0.012, steel, [0, 0.715, 0.022], 0.003),
  ));
  // it is moved in the tablet's own plane: a holder that leans as the tablet does
  const hand = G.group(pen);
  hand.position.copy(tab.position); hand.rotation.copy(tab.rotation);
  const park = () => { pen.position.set(0.916, -0.37, 0.004); pen.rotation.set(0, 0, 0); };
  park();
  // a point of the tablet as it lies in the room, from its own height and depth
  const at = (y: number, z: number): [number, number] => [-y * sn + z * cs, 0.68 + y * cs + z * sn];
  const low = at(-0.66, -0.029), high = at(0.5, -0.029);
  made.add(tab, G.rbox(1.9, 0.05, 1.15, 0.02, dark, [0, 0.025, 0]));
  // the console under it: folded sheet steel, its top cut to the lean of the tablet
  made.add(G.profile([[low[0] + 0.05, 0.05], [low[0] + 0.05, low[1] - 0.04], low, high, [high[0] - 0.06, high[1] - 0.06], [high[0] - 0.06, 0.05]], 1.6, dark, undefined, 0.012));
  root.add(fused(made), hand);
  // every stroke as a list of points in screen pixels, and the length of them all with the lifts of the pen between
  let path: [number, number][][] = [], total = 0, cycle = -1, shown = 0;
  const plan = (text: string) => {
    path = []; total = 0;
    [...text].forEach((ch, i) => {
      if (ch === ':') { path.push([[258, 130], [258, 134]], [[254, 216], [254, 220]]); return; }
      const x0 = [52, 142, 0, 292, 382][i];
      for (const st of strokesOf(Number(ch))) path.push(st.map(([x, y]) => [x0 + x * 76, 256 - y * 108]));
    });
    for (const p of path) { for (let i = 1; i < p.length; i++) total += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); total += 30; }
  };
  return {
    root, views: { stroke: { at: [0.3, 1.05, 0.65], to: [0, 0.75, 0.05], fov: 34, play: 0.1 }, slate: { at: [0, 2.2, 1.12], to: [0, 0.7, 0.02], fov: 38, play: 0.1 } }, inDark: 'vanishes', view: [18, 18], surface: s.canvas,
    update: ({ t }) => {
      const T = 13, u = t % T, k = Math.floor(t / T);
      if (k !== cycle || !path.length) { cycle = k; plan(now().hhmm); shown = 0; }
      // what the sheet has to show now: 1 the blink that wipes it, 2 blank, 3 being written, 4 written and left alone
      const budget = Math.max(0, (u - 0.5) / 7) * total, state = u < 0.25 ? 1 : u < 0.5 ? 2 : budget < total ? 3 : 4;
      const writing = u > 0.5 && u < 7.6;
      if (state === shown && state !== 3) { if (!writing && pen.position.x < 0.9) park(); return; }
      shown = state;
      const c = s.ctx;
      c.fillStyle = state === 1 ? '#3a4a2a' : '#0b0e0c'; c.fillRect(0, 0, 512, 340); // erase is one blink of the whole sheet
      let left = budget, tx = path[0][0][0], ty = path[0][0][1];
      c.strokeStyle = '#c4f060'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let j = 0; j < path.length && left > 0; j++) {
        const p = path[j];
        c.beginPath(); c.moveTo(p[0][0], p[0][1]); tx = p[0][0]; ty = p[0][1];
        for (let i = 1; i < p.length && left > 0; i++) {
          const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]), f = Math.min(1, left / Math.max(seg, 0.001));
          tx = p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f; ty = p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f;
          c.lineTo(tx, ty); left -= seg;
        }
        c.stroke(); left -= 30;
      }
      s.tex.needsUpdate = true;
      if (writing) { pen.position.set((tx / 512 - 0.5) * 1.57, 0.03 + (0.5 - ty / 340) * 1.03, 0.028); pen.rotation.set(0.5, 0, -0.45); } else park();
    },
  };
}

/** The floor of the cells: white, with the faint outline of the clear electrode that lies under each one. */
function cellFloor(cols: number, rows: number): THREE.CanvasTexture {
  const s = screen(cols * 256, rows * 256), c = s.ctx;
  c.fillStyle = '#f7f6f1'; c.fillRect(0, 0, s.canvas.width, s.canvas.height);
  c.fillStyle = 'rgba(190,210,224,.2)'; c.strokeStyle = 'rgba(108,132,150,.36)'; c.lineWidth = 2;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = i * 256, y = j * 256;
    c.fillRect(x + 22, y + 22, 212, 212); c.strokeRect(x + 22, y + 22, 212, 212);
  }
  s.tex.needsUpdate = true;
  return s.tex;
}

/**
 * The oil of one cell as a skin with two shapes: a film from wall to wall, and the same oil drawn up into a drop in
 * one corner. Every copy carries a number that says how far it has gathered, and the two shapes are blended by it.
 */
function oilSkin(span: number, film: number, drop: number, tall: number): THREE.BufferGeometry {
  const T = [0, 0.015, 0.04, 0.09, 0.18, 0.3, 0.42, 0.5, 0.58, 0.7, 0.82, 0.91, 0.96, 0.985, 1], n = T.length;
  const flat = new Float32Array(n * n * 3), heap = new Float32Array(n * n * 3), index: number[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u = T[i], v = T[j], p = j * n + i;
    // the film: level, and rounded over where it meets the walls
    const rim = Math.min(1, Math.min(u, 1 - u, v, 1 - v) / 0.04);
    flat.set([u * span, film * Math.sqrt(1 - (1 - rim) ** 2), v * span], p * 3);
    // the drop: the same square drawn in to a rounded heap that touches the two walls of its corner
    const a = 2 * u - 1, b = 2 * v - 1, r = Math.max(Math.abs(a), Math.abs(b)), q = r > 0 ? 0.25 + (0.75 * r) / Math.hypot(a, b) : 1;
    heap.set([drop * (1 + a * q), tall * (1 - r ** 2.4) ** 0.55, drop * (1 + b * q)], p * 3);
    if (i < n - 1 && j < n - 1) index.push(p, p + n, p + 1, p + n, p + n + 1, p + 1);
  }
  const shaped = (at: Float32Array) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(at, 3)); g.setIndex(index); g.computeVertexNormals(); return g; };
  const geo = shaped(flat), gathered = shaped(heap);
  geo.setAttribute('aDrop', gathered.attributes.position); geo.setAttribute('aDropN', gathered.attributes.normal);
  return geo;
}

/** Electrowetting, magnified: a film of dyed oil covers each cell until a voltage makes the water push it into a corner. */
export function electrowetting(): Built {
  const root = G.group(), made = G.group(), tray = G.group();
  const COLS = 4, ROWS = 3, C = 0.5, N = COLS * ROWS, TW = COLS * C, TD = ROWS * C;
  // how far the tray leans toward the visitor, where its middle is, and how high the water stands over the floor
  const TILT = 0.62, CY = 0.66, DEEP = 0.2, cs = Math.cos(TILT), sn = Math.sin(TILT), half = TD / 2 + 0.07;
  const dark = M.dark(), wall = M.plastic(0x101112, 0.6), steel = M.steel(0), rubber = M.rubber();
  // the floor: a white sheet on its carrier, coated so that water will not wet it
  const floor = G.plane(TW, TD, new THREE.MeshStandardMaterial({ map: cellFloor(COLS, ROWS), roughness: 0.45 }), [0, 0.0304, 0]);
  floor.rotation.x = -Math.PI / 2;
  tray.add(block(TW + 0.14, 0.06, TD + 0.14, M.plastic(0xf4f3ee, 0.5), [0, 0, 0], 0.008), floor);
  // low walls part the cells: no higher than the film of oil is thick, so a gathered drop stands well clear of them
  for (let i = 0; i <= COLS; i++) tray.add(G.box(0.03, 0.022, TD + 0.03, wall, [(i - COLS / 2) * C, 0.041, 0], 0));
  for (let j = 0; j <= ROWS; j++) tray.add(G.box(TW + 0.03, 0.022, 0.03, wall, [0, 0.041, (j - ROWS / 2) * C], 0));
  // the oil
  const state = new Float32Array(N), gathered = new THREE.InstancedBufferAttribute(state, 1);
  const skin = oilSkin(C - 0.034, 0.016, 0.115, 0.105);
  skin.setAttribute('aState', gathered);
  const blend = (sh: { vertexShader: string }) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aState;\nattribute vec3 aDrop;\nattribute vec3 aDropN;')
      // dye in a heap looks darker than the same dye spread thin
      .replace('#include <color_vertex>', '#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\n  vColor.rgb *= 1.0 - 0.3 * aState;\n#endif')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = normalize(mix(objectNormal, aDropN, aState));')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = mix(transformed, aDrop, aState);');
  };
  const dyed = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.16, clearcoat: 0.5, clearcoatRoughness: 0.08, shadowSide: THREE.FrontSide });
  dyed.onBeforeCompile = blend; dyed.customProgramCacheKey = () => 'oil';
  // the shadow has to follow the oil as it gathers, so the shadow pass is given the same two shapes
  const shade = new THREE.MeshDepthMaterial();
  shade.onBeforeCompile = blend; shade.customProgramCacheKey = () => 'oil';
  dyed.addEventListener('dispose', () => shade.dispose());
  const oil = new THREE.InstancedMesh(skin, dyed, N), at = new THREE.Matrix4(), dye = new THREE.Color();
  oil.customDepthMaterial = shade;
  const hue = [[0.0, 0.42, 0.6], [0.62, 0.03, 0.36], [0.74, 0.56, 0.0], [0.05, 0.05, 0.06]];
  for (let i = 0; i < N; i++) {
    const c = i % COLS, r = Math.floor(i / COLS);
    oil.setMatrixAt(i, at.makeTranslation((c - COLS / 2) * C + 0.017, 0.031, (r - ROWS / 2) * C + 0.017));
    oil.setColorAt(i, dye.setRGB(hue[c][0], hue[c][1], hue[c][2]));
  }
  tray.add(oil);
  // sealed under water: glass all round on a black seal, and a cover plate that carries the second electrode,
  // clamped down by a steel frame on four studs
  const glass = M.glass(0xb9c9c6, 0.08), ground = groundEdge();
  const lid = sheetOfGlass(TW + 0.13, TD + 0.13, 0.024, glass, ground, [0, 0.03 + DEEP + 0.012, 0]); lid.rotation.x = -Math.PI / 2;
  tray.add(lid);
  for (const s of [-1, 1]) {
    const pane = sheetOfGlass(TD + 0.1, DEEP, 0.014, glass, ground, [s * (TW / 2 + 0.057), 0.03 + DEEP / 2, 0]); pane.rotation.y = Math.PI / 2;
    tray.add(pane, sheetOfGlass(TW + 0.128, DEEP, 0.014, glass, ground, [0, 0.03 + DEEP / 2, s * (TD / 2 + 0.057)]));
  }
  const water = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.09, DEEP - 0.004, TD + 0.09), new THREE.MeshLambertMaterial({ color: 0x8fd0de, transparent: true, opacity: 0.07, depthWrite: false }));
  water.position.y = 0.03 + DEEP / 2;
  tray.add(water);
  const seal = G.bezel(TW + 0.14, TD + 0.14, TW + 0.07, TD + 0.07, 0.004, 0.012, rubber, [0, 0.036, 0], 0.006, 0.003); seal.rotation.x = -Math.PI / 2;
  const clamp = G.bezel(TW + 0.15, TD + 0.15, TW + 0.03, TD + 0.03, 0.008, 0.014, steel, [0, 0.03 + DEEP + 0.031, 0], 0.012, 0.004); clamp.rotation.x = -Math.PI / 2;
  tray.add(seal, clamp);
  const yTop = 0.03 + DEEP + 0.038;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tray.add(G.rod([sx * (TW / 2 + 0.048), 0.03, sz * (TD / 2 + 0.048)], [sx * (TW / 2 + 0.048), yTop, sz * (TD / 2 + 0.048)], 0.009, steel, 8));
  const bolts: V3[] = [];
  for (const s of [-1, 1]) { for (const k of [-1, 0, 1]) bolts.push([s * (TW / 2 + 0.048), yTop, k * (TD / 2 + 0.048)]); for (const x of [-0.5, 0.5]) bolts.push([x, yTop, s * (TD / 2 + 0.048)]); }
  tray.add(heads(bolts, 0.013, dark, [0, 1, 0]));
  tray.position.set(0, CY, 0); tray.rotation.x = TILT;
  // a point of the tray's side view, as [z, y] in the room: the console is cut to carry the tray at its lean
  const side = (z: number, y: number): [number, number] => [y * sn + z * cs, CY + y * cs - z * sn];
  const back = side(-half - 0.02, -0.032);
  made.add(tray, G.rbox(2.3, 0.05, 1.6, 0.02, dark, [0, 0.025, 0]));
  // the console: folded sheet steel with a lip along the front that the tray rests against
  made.add(G.profile([[0.74, 0.05], [0.74, 0.12], side(half + 0.05, 0.035), side(half + 0.004, 0.035), side(half + 0.004, -0.032), back, [-0.74, back[1] - 0.05], [-0.74, 0.05]], 2.2, dark, undefined, 0.012));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) made.add(can(0.055, 0.02, rubber, [sx * 1.0, -0.01, sz * 0.66], 14, 0.048));
  made.add(heads([[-1.0, 0.16, -0.74], [1.0, 0.16, -0.74], [-1.0, back[1] - 0.16, -0.74], [1.0, back[1] - 0.16, -0.74], [0, 0.16, -0.74]], 0.014, steel, [0, 0, -1]));
  // out of the back edge of the floor comes the flat lead with a track for every cell, and from the clamp the one
  // lead of the cover. Both go into the back of the console, where the voltages are made.
  made.add(flatLead([side(-half + 0.01, -0.012), side(-half - 0.03, -0.03), [-0.778, back[1] - 0.17], [-0.774, 0.88], [-0.742, 0.8]], 0.7));
  made.add(G.box(0.78, 0.036, 0.012, wall, [0, 0.8, -0.742], 0), can(0.026, 0.014, rubber, [0.92, 0.8, -0.742], 10).rotateX(Math.PI / 2));
  const tag: V3 = [TW / 2 + 0.048, CY + yTop * cs + (TD / 2 + 0.048) * sn, yTop * sn - (TD / 2 + 0.048) * cs];
  made.add(lead([tag, [tag[0] + 0.03, tag[1] + 0.03, tag[2] - 0.05], [0.98, back[1] - 0.1, -0.8], [0.93, 0.9, -0.79], [0.92, 0.8, -0.745]], 0.011, M.plastic(0xb5281d, 0.5), 18));
  root.add(fused(made));
  let first = true;
  return {
    root, views: { oil: { at: [1.8, 0.95, 0.6], to: [0, 0.75, 0.1], fov: 32, play: 0.1 }, cells: { at: [0.5, 1.6, 1.2], to: [0, 0.85, 0.15], fov: 30 } }, inDark: 'vanishes', view: [22, 16],
    update: ({ t }) => {
      for (let i = 0; i < N; i++) {
        const want = Math.sin(t * 1.3 + (i % COLS) * 1.1 + Math.floor(i / COLS) * 2.3) > 0.1 ? 1 : 0;
        state[i] += (want - state[i]) * (first ? 1 : 0.25); // tens of milliseconds in the real thing: fast enough for video
      }
      first = false;
      gathered.needsUpdate = true;
    },
  };
}

/** Interferometric modulator, magnified: a mirror on springs behind glass. The gap picks the colour, collapsing it gives black. */
export function imod(): Built {
  const root = G.group(), made = G.group();
  const COLS = 6, ROWS = 3, C = 0.32, N = COLS * ROWS, TILT = 0.12, cs = Math.cos(TILT), sn = Math.sin(TILT);
  const AW = COLS * C, AH = ROWS * C;
  const gaps = [0.2, 0.14, 0.09];
  const rgb = [[0.72, 0.06, 0.04], [0.05, 0.56, 0.14], [0.05, 0.14, 0.72]];
  const xy = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * C, ((ROWS - 1) / 2 - Math.floor(i / COLS)) * C];
  const dark = M.dark(), steel = M.steel(1), rubber = M.rubber();
  // what the eye sees from the front: structural colour, like a soap film or a beetle's back
  const colour = new Swarm(new THREE.BoxGeometry(C - 0.02, C - 0.02, 0.004), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2, iridescence: 0.6, iridescenceIOR: 1.8 }), N);
  // The mirrors and their springs are one mesh, built with every mirror standing off at its full gap. Each mirror hangs
  // by four flat arms, one from each post along a side of its cell. A number for each cell says how far it is pulled
  // toward the glass: the mirror goes all the way, an arm by as much as its distance from its post.
  const pull = { value: new Float32Array(N) }, works: THREE.BufferGeometry[] = [];
  const tagged = (geo: THREE.BufferGeometry, cell: number, moves: (x: number) => number, to: THREE.Matrix4) => {
    const g = geo.toNonIndexed(), n = g.attributes.position.count, where = new Float32Array(n).fill(cell), far = new Float32Array(n);
    for (let v = 0; v < n; v++) far[v] = moves(g.attributes.position.getX(v));
    g.setAttribute('aCell', new THREE.BufferAttribute(where, 1)); g.setAttribute('aMove', new THREE.BufferAttribute(far, 1));
    works.push(g.applyMatrix4(to));
  };
  const half = C / 2, mirror = 0.135, lane = 0.1475, to = new THREE.Matrix4(), turn = new THREE.Matrix4();
  for (let i = 0; i < N; i++) {
    const [x, y] = xy(i), z = -0.012 - gaps[i % 3];
    colour.put(i, x, y, 0);
    tagged(new RoundedBoxGeometry(mirror * 2, mirror * 2, 0.012, 1, 0.003), i, () => 1, to.makeTranslation(x, y, z));
    for (let k = 0; k < 4; k++) {
      to.makeTranslation(x, y, z).multiply(turn.makeRotationZ((k * Math.PI) / 2));
      // an arm from its post to the middle of the side, and the tab that joins its end to the mirror
      tagged(new THREE.BoxGeometry(half + 0.004, 0.011, 0.004).translate(-(half - 0.004) / 2 - 0.002, -lane, 0), i, (px) => THREE.MathUtils.clamp((px + half - 0.012) / (half - 0.012), 0, 1), to);
      tagged(new THREE.BoxGeometry(0.014, lane - mirror + 0.012, 0.004).translate(-0.004, -(lane + mirror) / 2 + 0.002, 0), i, () => 1, to);
    }
  }
  colour.done();
  // the tiles of colour stay where they are and only change their tint
  colour.mesh.frustumCulled = true;
  const drawn = (sh: { uniforms: Record<string, unknown>; vertexShader: string }) => {
    sh.uniforms.uPull = pull;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\nuniform float uPull[${N}];\nattribute float aCell;\nattribute float aMove;`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.z += aMove * uPull[int(aCell + 0.5)];');
  };
  // aluminium, bright but not a perfect mirror: a perfect one would show only the dark plate behind it
  const silver = new THREE.MeshStandardMaterial({ color: 0xe4e8ec, roughness: 0.3, metalness: 0.7 }), shade = new THREE.MeshDepthMaterial();
  silver.onBeforeCompile = drawn; silver.customProgramCacheKey = () => 'imod';
  shade.onBeforeCompile = drawn; shade.customProgramCacheKey = () => 'imod';
  silver.addEventListener('dispose', () => shade.dispose());
  const sprung = new THREE.Mesh(G.merge(works), silver);
  sprung.customDepthMaterial = shade;
  // the glass in front, the posts that set the gaps, and the plate behind
  const arr = G.group(sheetOfGlass(AW + 0.08, AH + 0.08, 0.04, M.glass(0xb9c9c6, 0.08), groundEdge(), [0, 0, 0.024]), G.box(AW + 0.12, AH + 0.12, 0.03, dark, [0, 0, -0.3], 0.008));
  for (let c = 0; c <= COLS; c++) for (let r = 0; r <= ROWS; r++) arr.add(G.rod([(c - COLS / 2) * C, (r - ROWS / 2) * C, 0.004], [(c - COLS / 2) * C, (r - ROWS / 2) * C, -0.285], 0.012, dark, 10));
  // two saddles hold glass and plate by their lower edges
  for (const x of [-0.75, 0.75]) arr.add(block(0.14, 0.03, 0.42, steel, [x, -AH / 2 - 0.078, -0.135], 0.006), block(0.14, 0.09, 0.016, steel, [x, -AH / 2 - 0.02, 0.054], 0.005), block(0.14, 0.09, 0.016, steel, [x, -AH / 2 - 0.02, -0.325], 0.005), block(0.14, 0.023, 0.05, rubber, [x, -AH / 2 - 0.0515, 0.024], 0.004));
  const hold = G.group(sprung, colour.mesh);
  for (const g of [arr, hold]) { g.position.set(0, 0.74, 0); g.rotation.x = -TILT; }
  // a point of the array as it stands in the room, from its own height and depth
  const at = (y: number, z: number): [number, number] => [-y * sn + z * cs, 0.74 + y * cs + z * sn];
  const seat = at(-AH / 2 - 0.093, -0.135), edge = at(-AH / 2 - 0.04, 0.0);
  made.add(arr, G.rbox(2.3, 0.05, 0.75, 0.02, dark, [0, 0.025, -0.1]));
  for (const x of [-0.75, 0.75]) made.add(block(0.1, seat[1] - 0.045, 0.2, steel, [x, 0.05 + (seat[1] - 0.05) / 2, seat[0]], 0.008));
  for (const x of [-1.0, 1.0]) for (const z of [-0.36, 0.16]) made.add(can(0.05, 0.03, rubber, [x, -0.015, z], 14, 0.044));
  // the flat lead that carries a voltage to every row and column, from the edge of the glass to a socket on the base
  made.add(flatLead([edge, [edge[0] + 0.05, edge[1] - 0.05], [0.17, 0.12], [0.16, 0.06]], 0.5, 0, 9), G.box(0.56, 0.03, 0.05, M.black(), [0, 0.065, 0.16], 0));
  root.add(fused(made), hold);
  const palette = [[1, 1, 1], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1], [1, 0, 1], [0, 0, 0]], open = new Float32Array(N).fill(1);
  let first = true;
  return {
    // from above the top row: the eye goes in behind the glass and finds a mirror at a different depth behind each colour
    root, views: { gaps: { at: [1.08, 2.07, 0.59], to: [0.56, 1.12, -0.08], fov: 30 } }, inDark: 'vanishes', view: [40, 10],
    update: ({ t }) => {
      for (let i = 0; i < N; i++) {
        const k = i % 3, pixel = Math.floor((i % COLS) / 3) + Math.floor(i / COLS) * 2;
        const want = palette[(Math.floor(t * 0.7) + pixel) % palette.length][k];
        open[i] += (want - open[i]) * (first ? 1 : 0.3);
        const v = open[i];
        pull.value[i] = gaps[k] * (1 - v);
        colour.tint(i, 0.02 + rgb[k][0] * v, 0.02 + rgb[k][1] * v, 0.02 + rgb[k][2] * v);
      }
      first = false;
      if (colour.mesh.instanceColor) colour.mesh.instanceColor.needsUpdate = true;
    },
  };
}

/** Electrochromic: ions soak into a printed film and darken it. Slow, cheap, and it keeps its state. */
export function electrochromic(): Built {
  const root = G.group(), made = G.group();
  // the label is drawn at twice the size it is laid out in, so that its bars keep clean edges from close to
  const s = screen(768, 512);
  s.ctx.setTransform(2, 0, 0, 2, 0, 0);
  const TILT = 0.35, cs = Math.cos(TILT), sn = Math.sin(TILT), CX = -0.38;
  const frame = M.dark(), sash = M.enamel(0xe9e6dc), black = M.black(), zinc = M.steel(0), print = M.printed(s, 0.72);
  // What is printed once and never changes: a silver track from every bar to the top edge, and the words.
  const blank = document.createElement('canvas');
  blank.width = 768; blank.height = 512;
  const printBlank = () => {
    const b = blank.getContext('2d')!;
    b.setTransform(2, 0, 0, 2, 0, 0);
    b.fillStyle = '#f1efe6'; b.fillRect(0, 0, 384, 256);
    b.strokeStyle = '#b3b7bb'; b.lineWidth = 1.6; b.lineJoin = 'round';
    const track = (...at: number[]) => { b.beginPath(); b.moveTo(at[0], at[1]); for (let i = 2; i < at.length; i += 2) b.lineTo(at[i], at[i + 1]); b.stroke(); };
    for (const x of [70, 200]) {
      // top bar straight up, the three on the left out to the left, the bottom one round underneath, the two on the right out to the right
      track(x + 48, 40, x + 48, 0); track(x + 8, 81, x - 4, 81, x - 4, 0); track(x + 12, 119, x - 9, 119, x - 9, 0); track(x + 8, 157, x - 14, 157, x - 14, 0);
      track(x + 48, 198, x + 48, 211, x - 19, 211, x - 19, 0); track(x + 88, 81, x + 100, 81, x + 100, 0); track(x + 88, 157, x + 104.5, 157, x + 104.5, 0);
    }
    // the printer's register marks in the corners
    for (const x of [16, 368]) for (const y of [18, 240]) { track(x - 6, y, x + 6, y); track(x, y - 6, x, y + 6); b.beginPath(); b.arc(x, y, 3.2, 0, 7); b.stroke(); }
    b.fillStyle = '#1c3f9e'; b.font = '600 22px "Sofia Sans Variable", sans-serif'; b.textAlign = 'left'; b.fillText('minutes past the hour', 70, 236);
  };
  printBlank();
  // a printed label: plastic film on a card, a coin cell, nothing else. The film goes over the top of the card and
  // takes its tracks to the back, where a strip of driver chips and the cell are stuck to it.
  const over: [number, number][] = [[0.46, 0.0087], [0.498, 0.0087], [0.511, 0.004], [0.5135, -0.002], [0.511, -0.0085], [0.498, -0.0125], [0.12, -0.0125]];
  const film = new THREE.PlaneGeometry(1.4, 1, 1, over.length - 1);
  over.forEach(([y, z], k) => { for (const e of [0, 1]) { film.attributes.position.setXYZ(k * 2 + e, e ? -0.7 : 0.7, y, z); film.attributes.uv.setXY(k * 2 + e, e ? 0 : 1, 0.994 - k * 0.003); } });
  film.computeVertexNormals();
  const card = G.group(G.slab(1.5, 1.0, 0.04, 0.016, M.paper(0xf4f2ea)), G.plane(1.4, 0.92, print, [0, 0, 0.0087]), new THREE.Mesh(film, print));
  card.add(G.box(1.3, 0.04, 0.012, black, [0, 0.1, -0.0185], 0), G.rod([0.45, -0.1, -0.0125], [0.45, -0.1, -0.034], 0.085, zinc, 24), G.box(0.24, 0.03, 0.005, zinc, [0.45, -0.1, -0.0365], 0));
  for (const x of [0.39, 0.51]) card.add(G.box(0.014, 0.2, 0.002, zinc, [x, -0.01, -0.009], 0), G.box(0.03, 0.03, 0.03, black, [x + (x < 0.45 ? -0.075 : 0.075), -0.1, -0.022], 0));
  card.position.set(CX, 0.58, 0.32); card.rotation.x = -TILT;
  // a point of the card as it stands in the room, from its own height and depth
  const at = (y: number, z: number): [number, number] => [0.32 - y * sn + z * cs, 0.58 + y * cs + z * sn];
  // its rest: a block cut to the lean of the card, with a low lip in front of its lower edge
  const heel = at(-0.5, -0.008), toe = at(-0.5, 0.012), lip = at(-0.46, 0.012), top = at(0, -0.01);
  made.add(card, G.rbox(2.3, 0.05, 1.35, 0.02, frame, [0, 0.025, 0]));
  made.add(G.profile([[heel[0] - 0.25, 0.05], [toe[0] + 0.04, 0.05], [lip[0] + 0.03, lip[1] + 0.003], [lip[0], lip[1]], [toe[0] + 0.002, toe[1] - 0.002], [heel[0] - 0.004, heel[1] - 0.003], [top[0], top[1]], [top[0] - 0.035, top[1] - 0.012]], 0.5, frame, [CX, 0, 0], 0.006));
  // and at the other end of the scale: a window that tints itself. Two panes with a spacer bar between them and the
  // film on one of them, in a painted sash with its handle. Below the glass, the two keys that darken and clear it.
  const tint = new THREE.MeshStandardMaterial({ color: 0x1c3f9e, transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  const glass = M.glass(0xb9c9c6, 0.08), ground = groundEdge(), WX = 0.62, WY = 0.84, WZ = -0.35;
  root.add(G.box(0.93, 1.38, 0.004, tint, [WX, WY, WZ], 0));
  made.add(sheetOfGlass(0.95, 1.4, 0.012, glass, ground, [WX, WY, WZ + 0.02]), sheetOfGlass(0.95, 1.4, 0.012, glass, ground, [WX, WY, WZ - 0.02]));
  for (const k of [-1, 1]) made.add(G.box(0.93, 0.014, 0.026, zinc, [WX, WY + k * 0.683, WZ], 0), G.box(0.014, 1.38, 0.026, zinc, [WX + k * 0.458, WY, WZ], 0));
  made.add(G.bezel(1.13, 1.58, 0.93, 1.38, 0.01, 0.09, sash, [WX, WY, WZ], 0.02, 0.012), G.box(1.25, 0.05, 0.2, sash, [WX, 0.035, WZ + 0.02]));
  made.add(block(0.036, 0.14, 0.012, zinc, [WX + 0.515, WY, WZ + 0.051], 0.004), G.rod([WX + 0.515, WY, WZ + 0.05], [WX + 0.515, WY, WZ + 0.08], 0.012, zinc, 10), block(0.026, 0.2, 0.018, zinc, [WX + 0.515, WY - 0.085, WZ + 0.08], 0.006));
  made.add(G.box(0.16, 0.05, 0.008, black, [WX, 0.1, WZ + 0.049], 0), G.rod([WX - 0.04, 0.1, WZ + 0.05], [WX - 0.04, 0.1, WZ + 0.058], 0.016, zinc, 12), G.rod([WX + 0.04, 0.1, WZ + 0.05], [WX + 0.04, 0.1, WZ + 0.058], 0.016, zinc, 12));
  root.add(fused(made));
  const level = new Float32Array(14).fill(-1), BARS = 'abcdefg';
  let minute = -1, settled = false;
  // the words are printed again once their typeface has arrived
  void document.fonts?.ready.then(() => { printBlank(); settled = false; });
  return {
    root, views: { label: { at: [-0.1, 1.15, 1.75], to: [-0.38, 0.62, 0.32], fov: 30 } }, inDark: 'vanishes', view: [20, 12], surface: s.canvas,
    update: ({ t }) => {
      tint.opacity = 0.42 + 0.36 * Math.sin(t * 0.5);
      const n = now();
      // nothing is drawn while no bar is changing: the label keeps its picture, as the real one does
      if (settled && n.m === minute) return;
      minute = n.m; settled = true;
      const c = s.ctx;
      c.drawImage(blank, 0, 0, 384, 256);
      for (let k = 0; k < 2; k++) {
        const digit = k ? n.m % 10 : Math.floor(n.m / 10);
        for (let j = 0; j < 7; j++) {
          const i = k * 7 + j, want = SEG[digit].includes(BARS[j]) ? 1 : 0;
          // the film takes seconds to colour and to bleach, not milliseconds
          level[i] = level[i] < 0 || Math.abs(want - level[i]) < 0.004 ? want : level[i] + (want - level[i]) * 0.012;
          if (level[i] !== want) settled = false;
          c.globalAlpha = 0.07 + 0.93 * level[i];
          segment(c, 70 + k * 130, 34, 96, 170, BARS[j]);
        }
      }
      c.globalAlpha = 1;
      s.tex.needsUpdate = true;
    },
  };
}

function segment(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seg: string): void {
  const t = 0.18 * w, [x0, y0, x1, y1] = SEG_LINES[seg];
  c.strokeStyle = '#1c3f9e'; c.lineCap = 'round'; c.lineWidth = t;
  c.beginPath(); c.moveTo(x + t / 2 + x0 * (w - t), y + t / 2 + (1 - y0 / 2) * (h - t)); c.lineTo(x + t / 2 + x1 * (w - t), y + t / 2 + (1 - y1 / 2) * (h - t)); c.stroke();
}
