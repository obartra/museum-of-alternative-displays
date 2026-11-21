import { G, M, Swarm, glows, screen, THREE, type Built, type V3 } from '../kit';
import { feet, lens, screws, vents } from '../parts';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { dots, now } from '../../sims/draw';

const FONT = '"Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';

/** Split-flap: six digit modules, HH MM SS, in one steel case. The top leaf of each falls forward to show the next numeral. */
export function splitFlap(): Built {
  const root = G.group();
  const CW = 96, CH = 160;
  const atlas = screen(CW * 10, CH);
  const g = atlas.ctx;
  g.fillStyle = '#17191b'; g.fillRect(0, 0, CW * 10, CH);
  g.fillStyle = '#f3f1e9'; g.font = `800 ${CH * 0.98}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < 10; i++) g.fillText(String(i), CW * (i + 0.5), CH * 0.55);
  g.fillStyle = '#000'; g.fillRect(0, CH / 2 - 1.5, CW * 10, 3);
  atlas.tex.needsUpdate = true;

  const W = 0.5, H = 0.84;
  const half = (top: boolean) => {
    const t = atlas.tex.clone();
    t.repeat.set(0.1, 0.5); t.offset.set(0, top ? 0.5 : 0); t.needsUpdate = true;
    return t;
  };
  const leaf = (t: THREE.Texture) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.62 });
  const xs = [-1.5, -0.97, -0.265, 0.265, 0.97, 1.5];
  const dark = M.dark(), pin = M.steel();
  // Twenty leaves to a drum, each on two pins in the rim of the end plates. Two face the hall. Of the rest, the next six
  // stand in a sheaf behind the top one and lean on it, and the others hang where they fell. [height, depth] of each
  // hinge, and which way its leaf points from there.
  const RIM = 0.105, AXLE = -0.14, LEAF = H / 2 - 0.01, STOOD = 6;
  const hinge = (k: number): [number, number] => [RIM * Math.sin((k / 20) * Math.PI * 2), AXLE + RIM * Math.cos((k / 20) * Math.PI * 2)];
  const waiting = Array.from({ length: 18 }, (_, i) => {
    const k = i + 1, [hy, hz] = hinge(k);
    // a hanging leaf whose hinge is still high on the back of the drum lies against the ones hinged below it
    const tip: [number, number] = k <= STOOD ? [0.41, -0.006 - 0.012 * k] : [hy - LEAF, k < 10 ? hz + 0.0025 + 0.0045 * (10 - k) : hz];
    const len = Math.hypot(tip[0] - hy, tip[1] - hz);
    return { k, hy, hz, uy: (tip[0] - hy) / len, uz: (tip[1] - hz) / len };
  });
  // What is printed on them: the top half of a numeral on the face, the bottom half of the next on the back.
  const printed = (() => {
    const pos: number[] = [], nor: number[] = [], uv: number[] = [];
    for (const { k, hy, hz, uy, uz } of waiting) {
      for (const side of [1, -1]) {
        const ny = -uz * side, nz = uy * side, y0 = hy + ny * 0.0026, z0 = hz + nz * 0.0026, y1 = y0 + uy * LEAF, z1 = z0 + uz * LEAF;
        const u0 = ((side > 0 ? k : k + 1) % 10) / 10, v1 = side > 0 ? 1 : 0;
        const a = [-W / 2, y0, z0, u0, 0.5], b = [W / 2, y0, z0, u0 + 0.1, 0.5], c = [W / 2, y1, z1, u0 + 0.1, v1], d = [-W / 2, y1, z1, u0, v1];
        for (const p of side > 0 ? [a, b, c, a, c, d] : [a, d, c, a, c, b]) { pos.push(p[0], p[1], p[2]); nor.push(0, ny, nz); uv.push(p[3], p[4]); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geo;
  })();
  const pins = new Swarm(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 8).rotateZ(Math.PI / 2), pin, xs.length * 40);
  const mods = xs.map((x, n) => {
    const tex = { top: half(true), bot: half(false), front: half(true), back: half(false), fan: atlas.tex.clone() };
    tex.fan.wrapS = THREE.RepeatWrapping; tex.fan.needsUpdate = true;
    const top = G.plane(W, H / 2, leaf(tex.top), [x, H / 4, 0]);
    const bot = G.plane(W, H / 2, leaf(tex.bot), [x, -H / 4, 0]);
    const pivot = G.group();
    pivot.position.set(x, 0, 0.004);
    const front = G.plane(W, H / 2, leaf(tex.front), [0, H / 4, 0]);
    const back = G.plane(W, H / 2, leaf(tex.back), [0, H / 4, -0.002]);
    back.rotation.x = Math.PI;
    pivot.add(front, back);
    // the drum: a spindle between two end plates
    root.add(G.rod([x - 0.262, 0, AXLE], [x + 0.262, 0, AXLE], 0.022, pin), G.cyl(0.12, 0.012, pin, [x - 0.256, 0, AXLE], 28).rotateZ(Math.PI / 2), G.cyl(0.12, 0.012, pin, [x + 0.256, 0, AXLE], 28).rotateZ(Math.PI / 2));
    const wheel = new Swarm(new THREE.BoxGeometry(W, LEAF, 0.004).translate(0, LEAF / 2, 0), M.plastic(0x1b1d1f, 0.7), waiting.length);
    waiting.forEach((l, i) => wheel.put(i, x, l.hy, l.hz, Math.atan2(l.uz, l.uy), 0, 0));
    wheel.done();
    const prints = new THREE.Mesh(printed, leaf(tex.fan));
    prints.position.x = x;
    for (let k = 0; k < 20; k++) for (const end of [0, 1]) { const [hy, hz] = hinge(k); pins.put(n * 40 + k * 2 + end, x + (end ? 0.256 : -0.256), hy, hz); }
    // the two pips that catch each leaf as it comes over the top
    root.add(G.box(0.02, 0.016, 0.03, pin, [x - 0.22, H / 2 + 0.006, 0.006], 0), G.box(0.02, 0.016, 0.03, pin, [x + 0.22, H / 2 + 0.006, 0.006], 0));
    root.add(top, bot, pivot, wheel.mesh, prints);
    return { tex, pivot, shown: -1, next: -1, p: 1 };
  });
  pins.done();
  root.add(pins.mesh);
  // one case: open above so the drums show, a painted frame round the windows, partitions between the modules
  const CWID = 3.72, CHT = 1.06;
  root.add(G.box(CWID, CHT, 0.03, dark, [0, 0, -0.36]), G.box(CWID, 0.03, 0.44, dark, [0, -CHT / 2, -0.15]), G.box(CWID + 0.06, 0.05, 0.5, M.steel(), [0, -CHT / 2 - 0.04, -0.15]));
  for (const x of [-CWID / 2, -1.235, -0.6175, 0, 0.6175, 1.235, CWID / 2]) root.add(G.box(0.03, CHT, 0.44, dark, [x, 0, -0.15]));
  for (const x of [-0.6175, 0.6175]) for (const y of [0.16, -0.16]) root.add(G.cyl(0.036, 0.016, M.plastic(0xf3f1e9, 0.5), [x, y, 0.075], 20).rotateX(Math.PI / 2));
  for (const x of [-1.3, 1.3]) root.add(G.box(0.07, 0.4, 0.07, M.steel(1), [x, -CHT / 2 - 0.26, -0.15]), G.rbox(0.36, 0.04, 0.6, 0.015, M.steel(), [x, -CHT / 2 - 0.47, -0.1]));
  root.add(screws([[-CWID / 2 + 0.06, 0.45, -0.343], [CWID / 2 - 0.06, 0.45, -0.343]], 0.02));

  const set = (t: THREE.Texture, d: number) => { t.offset.x = d / 10; };
  let last = 0;
  return {
    root, inDark: 'vanishes', view: [22, 12], zoom: 1.12,
    views: {
      // a seat in the hall, low and to one side, so that the board is overhead as it is in a station
      hall: { room: true, at: [2.3, 0, 2.1], to: [0.4, 0.2, 0], fov: 52 },
      flaps: { at: [2.3, 1.25, 1.05], to: [1.4, 0.15, -0.05] },
    },
    update: ({ t }) => {
      const dt = Math.min(0.1, t - last); last = t;
      const d = now().digits;
      mods.forEach((m, i) => {
        if (m.shown < 0) { m.shown = m.next = d[i]; for (const k of ['top', 'bot', 'front', 'back', 'fan'] as const) set(m.tex[k], d[i]); }
        if (m.p >= 1 && d[i] !== m.shown) {
          m.next = d[i]; m.p = 0;
          // every leaf that is waiting is now one place nearer the front
          set(m.tex.top, m.next); set(m.tex.back, m.next); set(m.tex.front, m.shown); set(m.tex.bot, m.shown); set(m.tex.fan, m.next);
        }
        if (m.p < 1) {
          m.p = Math.min(1, m.p + dt / 0.3);
          m.pivot.rotation.x = Math.PI * m.p * m.p;
          if (m.p >= 1) { m.shown = m.next; set(m.tex.bot, m.shown); set(m.tex.front, m.shown); m.pivot.rotation.x = 0; }
        }
      });
    },
  };
}

/** Flip-disc: a board of two-faced discs, each turned over by a magnetic pulse and then left alone. */
export function flipDisc(): Built {
  const root = G.group();
  const COLS = 29, ROWS = 9, P = 0.1, N = COLS * ROWS;
  const geo = new THREE.CylinderGeometry(0.044, 0.044, 0.006, 24).rotateX(Math.PI / 2);
  const discs = new Swarm(geo, [M.plastic(0x101112, 0.8), M.plastic(0xf2d21b, 0.55), M.plastic(0x101112, 0.8)], N);
  const ang = new Float32Array(N).fill(Math.PI);
  const tgt = new Float32Array(N).fill(Math.PI);
  // each disc turns on a diagonal axle between two pole pieces
  const AXLE = new THREE.Vector3(1, 1, 0).normalize();
  const pos = (c: number, r: number): V3 => [(c - (COLS - 1) / 2) * P, ((ROWS - 1) / 2 - r) * P, 0];
  const poles = new Swarm(new THREE.CylinderGeometry(0.007, 0.007, 0.02, 8).rotateX(Math.PI / 2), M.steel(), N * 2);
  // the coil that kicks the disc over is wound on the pole pieces, and a wire axle runs between them
  const coils = new Swarm(new THREE.CylinderGeometry(0.0115, 0.0115, 0.011, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8a4a26, roughness: 0.5, metalness: 0.7 }), N * 2);
  const axles = new Swarm(new THREE.CylinderGeometry(0.0016, 0.0016, 0.105, 5).rotateZ(-Math.PI / 4), M.steel(), N);
  for (let i = 0; i < N; i++) {
    const [x, y] = pos(i % COLS, Math.floor(i / COLS));
    discs.spin(i, x, y, 0, AXLE, Math.PI);
    axles.put(i, x, y, 0);
    for (const [k, o] of [[0, -0.037], [1, 0.037]]) { poles.put(i * 2 + k, x + o, y + o, -0.006); coils.put(i * 2 + k, x + o, y + o, -0.0095); }
  }
  discs.done(); poles.done(); coils.done(); axles.done();
  const BW = COLS * P, BH = ROWS * P;
  root.add(discs.mesh, poles.mesh, coils.mesh, axles.mesh, G.box(BW + 0.06, BH + 0.06, 0.03, M.black(), [0, 0, -0.03], 0.004));
  // weatherproof housing, as on the front of a bus
  root.add(G.bezel(BW + 0.26, BH + 0.26, BW + 0.04, BH + 0.04, 0.012, 0.14, M.steel(), [0, 0, 0.01], 0.04, 0.014), G.rbox(BW + 0.22, BH + 0.22, 0.2, 0.03, M.dark(), [0, 0, -0.14]), vents(1.6, 0.4, 8, [0, 0, -0.242]));
  for (const x of [-1, 1]) root.add(G.cyl(0.035, 0.36, M.steel(1), [x, -BH / 2 - 0.3, -0.12], 20), G.cyl(0.2, 0.035, M.steel(), [x, -BH / 2 - 0.49, -0.12], 32));
  let last = 0, first = true;
  return {
    root, inDark: 'vanishes', view: [20, 8], zoom: 1.06,
    views: {
      kerb: { room: true, at: [-2.3, 0, 2.1], to: [-0.4, 0.15, 0], fov: 52 },
      discs: { at: [-1.5, -0.62, 0.62], to: [-1, -0.28, 0] },
    },
    update: ({ t }) => {
      const dt = Math.min(0.1, t - last); last = t;
      const n = now();
      const d = dots(n.hhmm);
      const bar = Math.round((n.s / 59) * COLS);
      let moved = false;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const lit = r === ROWS - 1 ? c < bar : r >= 1 && d.on(c - 2, r - 1);
        tgt[i] = lit ? 0 : Math.PI;
        if (first) ang[i] = tgt[i] + 0.002; // the board is already showing the time when the visitor arrives
        const dlt = tgt[i] - ang[i];
        if (Math.abs(dlt) > 0.001) {
          // discs snap over quickly, columns a moment apart, the way a real board ripples
          const step = Math.sign(dlt) * Math.min(Math.abs(dlt), dt * (9 + (c % 5)));
          ang[i] += step; moved = true;
          const [x, y] = pos(c, r);
          discs.spin(i, x, y, 0, AXLE, ang[i]);
        }
      }
      if (moved) discs.mesh.instanceMatrix.needsUpdate = true;
      first = false;
    },
  };
}

/** Mechanical television: a spinning disc with thirty holes in a spiral, a neon lamp behind it and a lens in front. */
export function nipkow(): Built {
  const root = G.group();
  const CY = 1.3;
  const face = screen(1024, 1024);
  const g = face.ctx;
  g.fillStyle = '#a4aab0'; g.fillRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1;
  for (let r = 60; r < 512; r += 7) { g.beginPath(); g.arc(512, 512, r, 0, 7); g.stroke(); }
  face.tex.needsUpdate = true;
  // The holes are cut through the sheet, so they stay square however close the visitor comes.
  // Thirty of them, each one hole's width nearer the centre than the last: one turn of the disc is one picture.
  const sheet = new THREE.Shape(); sheet.absarc(0, 0, 0.996, 0, Math.PI * 2, false);
  for (let i = 0; i < 30; i++) {
    const a = -(i / 30) * Math.PI * 2, r = (474 - i * 4.4) / 512, h = 4.4 / 512, hole = new THREE.Path();
    // each hole is square to its own radius
    [[-h, -h], [h, -h], [h, h], [-h, h]].forEach(([u, v], n) => { const x = (r + u) * Math.cos(a) - v * Math.sin(a), y = (r + u) * Math.sin(a) + v * Math.cos(a); if (n) hole.lineTo(x, y); else hole.moveTo(x, y); });
    hole.closePath(); sheet.holes.push(hole);
  }
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, hole = new THREE.Path(); hole.absarc(Math.cos(a) * 0.371, Math.sin(a) * 0.371, 0.121, 0, Math.PI * 2, true); sheet.holes.push(hole); }
  const cut = new THREE.ShapeGeometry(sheet, 72), uv = cut.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5 + 0.5, uv.getY(i) * 0.5 + 0.5);
  const plate = new THREE.MeshStandardMaterial({ map: face.tex, metalness: 0.8, roughness: 0.34, side: THREE.DoubleSide });
  const disc = G.group(new THREE.Mesh(cut, plate), G.cyl(0.11, 0.05, M.dark(), undefined, 28).rotateX(Math.PI / 2), G.torus(1.0, 0.006, M.steel()));
  disc.position.set(0, CY, 0);
  root.add(disc);
  // base, motor and its cradle
  const oak = M.wood(0x6e4a2a);
  root.add(G.rbox(2.6, 0.12, 1.1, 0.03, oak, [0, 0.06, -0.05]), feet(2.6, 1.1, 0.07, 0.04, -0.04));
  root.add(G.cyl(0.24, 0.46, M.dark(), [0, CY, -0.3], 48).rotateX(Math.PI / 2), G.cyl(0.25, 0.06, M.steel(), [0, CY, -0.1], 48).rotateX(Math.PI / 2), G.rod([0, CY, -0.08], [0, CY, 0.04], 0.03, M.brass(2)), G.box(0.3, CY - 0.3, 0.34, M.dark(1), [0, (CY - 0.3) / 2 + 0.12, -0.3]), G.box(0.5, 0.05, 0.44, M.dark(), [0, 0.145, -0.3]));
  // the neon lamp glows behind the right-hand edge; its brightness is the picture signal
  const LX = 0.84;
  const img = screen(120, 280);
  root.add(G.rbox(0.44, 0.84, 0.3, 0.03, M.plastic(0x1d1f22, 0.6), [LX, CY, -0.24]), G.plane(0.32, 0.7, M.glow(0xff5a1e, 0.6), [LX, CY, -0.085]), G.box(0.1, CY - 0.5, 0.1, M.dark(1), [LX, (CY - 0.42) / 2 + 0.12, -0.24]));
  root.add(G.plane(0.27, 0.63, M.lit(img, 1.6, 0), [LX, CY, 0.012]));
  // viewing hood with its magnifier: the picture is the size of a postage stamp
  const hood = M.wood(0x4a321d, 2);
  root.add(G.bezel(0.52, 0.94, 0.3, 0.66, 0.02, 0.03, M.black(), [LX, CY, 0.05], 0.02, 0.006));
  root.add(G.box(0.04, 0.94, 0.44, hood, [LX - 0.24, CY, 0.27]), G.box(0.04, 0.94, 0.44, hood, [LX + 0.24, CY, 0.27]), G.box(0.52, 0.04, 0.44, hood, [LX, CY + 0.45, 0.27]), G.box(0.52, 0.04, 0.44, hood, [LX, CY - 0.45, 0.27]));
  root.add(G.box(0.12, CY - 0.57, 0.16, M.wood(0x4a321d, 1), [LX, (CY - 0.45) / 2 + 0.11, 0.27]));
  const magnifier = lens(0.21, [LX, CY, 0.5], 0.3, M.brass()); magnifier.scale.y = 1.5;
  root.add(magnifier);
  return {
    root, inDark: 'glows', glow: 0xff5a1e, view: [30, 10], surface: img.canvas,
    views: {
      eyepiece: { at: [LX, CY, 1.5], to: [LX, CY, 0.01], fov: 30, play: 0.04 },
      disc: { at: [-1.3, 1.7, 1.3], to: [-0.35, 1.4, 0] },
    },
    update: ({ t }) => {
      disc.rotation.z = -t * 9;
      const n = now();
      const c = img.ctx;
      c.fillStyle = '#060201'; c.fillRect(0, 0, 120, 280);
      // thirty vertical lines, about twelve pictures a second
      const top = dots(n.hhmm.slice(0, 2)), bottom = dots(n.hhmm.slice(3));
      const sweep = (t * 12.5) % 1;
      for (let line = 0; line < 30; line++) {
        const fresh = 1 - ((((line / 30 - sweep) % 1) + 1) % 1);
        for (let y = 0; y < 70; y++) {
          const gx = Math.floor((line - 4) / 2), gy = y < 35 ? Math.floor((y - 6) / 3.4) : Math.floor((y - 41) / 3.4);
          const lit = (y < 35 ? top : bottom).on(gx, gy);
          const v = (lit ? 1 : 0.12) * (0.55 + 0.45 * fresh);
          c.fillStyle = `rgba(255,${90 + Math.round(60 * v)},30,${v})`;
          c.fillRect(line * 4, y * 4, 3, 4);
        }
      }
      img.tex.needsUpdate = true;
    },
  };
}

/** Kinetic mirror: wooden tiles on servos. Tilted up they catch the light, tilted down they go dark. */
export function kineticMirror(): Built {
  const root = G.group();
  const K = 24, P = 0.1, R = (K * P) / 2;
  // an eight-sided field of tiles
  const cells: [number, number][] = [];
  for (let r = 0; r < K; r++) for (let c = 0; c < K; c++) { const x = (c - (K - 1) / 2) * P, y = ((K - 1) / 2 - r) * P; if (Math.abs(x) + Math.abs(y) < R * 1.42) cells.push([x, y]); }
  const N = cells.length;
  const tiles = new Swarm(new RoundedBoxGeometry(0.09, 0.09, 0.022, 1, 0.006), M.wood(0xc19460, 0), N);
  const tilt = new Float32Array(N);
  const walnut = M.wood(0x4f3420, 0);
  // behind every tile, the axle it tips on between two posts, and the servo that tips it
  const mounts = new Swarm(G.merge([new THREE.CylinderGeometry(0.003, 0.003, 0.092, 6).rotateZ(Math.PI / 2).translate(0, 0, -0.014), new THREE.BoxGeometry(0.006, 0.008, 0.034).translate(-0.043, 0, -0.03), new THREE.BoxGeometry(0.006, 0.008, 0.034).translate(0.043, 0, -0.03)]), M.steel(), N);
  const servos = new Swarm(new THREE.BoxGeometry(0.04, 0.024, 0.022).translate(0, -0.026, -0.034), M.plastic(0x1f3a63, 0.5), N);
  cells.forEach(([x, y], i) => { mounts.put(i, x, y, 0); servos.put(i, x, y, 0); });
  mounts.done(); servos.done();
  root.add(tiles.mesh, mounts.mesh, servos.mesh);
  const back = new THREE.Shape(), ring = new THREE.Shape(), hole = new THREE.Path();
  const oct = (path: THREE.Path, rad: number) => { for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + (i * Math.PI) / 4, x = Math.cos(a) * rad, y = Math.sin(a) * rad; if (i) path.lineTo(x, y); else path.moveTo(x, y); } path.closePath(); };
  oct(back, R * 1.1); oct(ring, R * 1.2); oct(hole, R * 1.075); ring.holes.push(hole);
  root.add(G.extruded(back, 0.05, M.black(), [0, 0, -0.07], 0.004), G.extruded(ring, 0.2, walnut, [0, 0, -0.02], 0.014));
  // the camera that watches the visitor looks out through the middle
  root.add(G.cyl(0.035, 0.05, M.black(), [0, 0, 0.03], 24).rotateX(Math.PI / 2), G.cyl(0.02, 0.006, M.plastic(0x1a2a44, 0.1), [0, 0, 0.057], 20).rotateX(Math.PI / 2));
  root.add(G.rbox(1.1, 0.07, 0.7, 0.02, walnut, [0, -R * 1.2 - 0.3, -0.03]), G.box(0.12, 0.34, 0.12, M.wood(0x4f3420, 1), [0, -R * 1.2 - 0.12, -0.03]));
  const put = (i: number) => tiles.put(i, cells[i][0], cells[i][1], 0, tilt[i], 0, 0);
  for (let i = 0; i < N; i++) put(i);
  tiles.done();
  let first = true;
  const eye = new THREE.Vector3();
  return {
    root, inDark: 'vanishes', view: [18, 6],
    views: {
      // level with the middle, as a mirror is met, and free to move the head a good way
      stand: { at: [0, 0.3, 4.5], to: [0, 0, 0], play: 0.3 },
      tiles: { at: [0.85, -0.6, 0.7], to: [0.2, -0.1, 0] },
    },
    update: ({ t, camera }) => {
      // from across the room it shows a visitor passing. Stand close in front and the visitor is you
      root.worldToLocal(eye.copy(camera.position));
      const near = eye.z > 0 ? THREE.MathUtils.smoothstep(5.3 - Math.hypot(eye.x, eye.z), 0, 0.7) : 0;
      const cx = THREE.MathUtils.lerp(0.34 * Math.sin(t * 0.55), THREE.MathUtils.clamp(eye.x, -0.55, 0.55), near);
      for (let i = 0; i < N; i++) {
        const [x, y] = cells[i];
        const head = Math.hypot(x - cx, y - 0.36) < 0.27;
        const body = ((x - cx) / 0.62) ** 2 + ((y + 0.62) / 0.56) ** 2 < 1;
        const want = head || body ? 0.62 : -0.5;
        tilt[i] += (want - tilt[i]) * (first ? 1 : 0.14);
        put(i);
      }
      tiles.mesh.instanceMatrix.needsUpdate = true;
      first = false;
    },
  };
}

/** Shape display: a table of motorised pins that rise into whatever form is asked for. */
export function shapeDisplay(): Built {
  const root = G.group();
  const N = 24, P = 0.07, S = N * P;
  const pins = new Swarm(new RoundedBoxGeometry(0.062, 1, 0.062, 1, 0.008).translate(0, 0.5, 0), M.plastic(0xf4f4f1, 0.45), N * N);
  // the table: every pin is pushed by its own motor underneath, which is why the cabinet is so deep
  const cab = M.plastic(0x2a2d31, 0.5);
  root.add(pins.mesh, G.rbox(S + 0.32, 0.62, S + 0.32, 0.04, cab, [0, -0.31, 0]), G.bezel(S + 0.34, S + 0.34, S + 0.012, S + 0.012, 0.004, 0.03, M.steel(), [0, 0.012, 0], 0.045, 0.008).rotateX(-Math.PI / 2), feet(S + 0.32, S + 0.32, 0.07, 0.08, -0.7));
  for (let i = 0; i < 4; i++) { const v = vents(S * 0.7, 0.3, 7, [Math.sin(i * Math.PI / 2) * (S / 2 + 0.161), -0.34, Math.cos(i * Math.PI / 2) * (S / 2 + 0.161)]); v.rotation.y = i * Math.PI / 2; root.add(v); }
  const ball = G.sph(0.09, M.enamel(0xd1481f));
  root.add(ball);
  const height = (x: number, z: number, cx: number, cz: number, t: number) => {
    const d2 = (x - cx) ** 2 + (z - cz) ** 2;
    return 0.03 + 0.34 * Math.exp(-d2 / 0.05) + 0.035 * Math.sin(Math.sqrt(d2) * 16 - t * 4) * Math.exp(-d2 * 1.6);
  };
  const draw = (t: number) => {
    const cx = 0.42 * Math.sin(t * 0.7), cz = 0.42 * Math.sin(t * 0.47 + 1);
    for (let i = 0; i < N * N; i++) {
      const x = ((i % N) - (N - 1) / 2) * P, z = (Math.floor(i / N) - (N - 1) / 2) * P;
      pins.put(i, x, 0, z, 0, 0, 0, 1, height(x, z, cx, cz, t), 1);
    }
    ball.position.set(cx, height(cx, cz, cx, cz, t) + 0.09, cz);
  };
  draw(0); pins.done();
  return {
    root, inDark: 'vanishes', view: [34, 24], zoom: 0.9,
    views: {
      table: { at: [0, 1, 2], to: [0, 0.1, 0], fov: 42 },
      // high enough that turning the view never takes it down among the pins
      pins: { at: [0.9, 0.62, 0.7], to: [0.15, 0.1, 0.05] },
    },
    update: ({ t }) => { draw(t); pins.mesh.instanceMatrix.needsUpdate = true; },
  };
}

const BRAILLE: Record<string, number[]> = {
  '#': [3, 4, 5, 6], ':': [2, 5], '1': [1], '2': [1, 2], '3': [1, 4], '4': [1, 4, 5], '5': [1, 5], '6': [1, 2, 4], '7': [1, 2, 4, 5], '8': [1, 2, 5], '9': [2, 4], '0': [2, 4, 5],
};

/** Refreshable braille: a line of cells whose pins rise and fall. It spells the time, numeric sign first. */
export function braille(): Built {
  const root = G.group();
  const CELLS = 11, CP = 0.4, DP = 0.1;
  const pin = new THREE.CapsuleGeometry(0.03, 0.08, 6, 14);
  const pins = new Swarm(pin, M.plastic(0xf5f3ec, 0.4), CELLS * 8);
  const hgt = new Float32Array(CELLS * 8);
  const W = CELLS * CP + 0.5;
  const body = M.plastic(0x2b2e33, 0.55), key = M.plastic(0x4d535a, 0.5);
  // a low wedge that the hands rest on, the reading line let into the top
  root.add(pins.mesh, G.profile([[-0.6, -0.13], [0.62, -0.13], [0.62, 0.02], [0.2, 0.13], [-0.6, 0.13]], W, body, undefined, 0.03));
  root.add(G.bezel(CELLS * CP + 0.14, 0.6, CELLS * CP + 0.04, 0.5, 0.03, 0.02, M.plastic(0x15171a, 0.4), [0, 0.135, -0.1], 0.05, 0.006).rotateX(-Math.PI / 2), G.box(CELLS * CP + 0.04, 0.012, 0.5, M.plastic(0x0e0f11, 0.5), [0, 0.118, -0.1], 0));
  // a routing key behind every cell, thumb keys in front
  for (let c = 0; c < CELLS; c++) root.add(G.cyl(0.055, 0.03, key, [(c - (CELLS - 1) / 2) * CP, 0.145, -0.47], 24));
  const front = G.group(G.rbox(1.6, 0.05, 0.16, 0.02, key, [0, 0, 0]), G.rbox(0.3, 0.05, 0.16, 0.02, key, [-W / 2 + 0.45, 0, 0]), G.rbox(0.3, 0.05, 0.16, 0.02, key, [W / 2 - 0.45, 0, 0]));
  front.position.set(0, 0.085, 0.42); front.rotation.x = 0.256;
  root.add(front, feet(W, 1.22, 0.06, 0.03, -0.16), G.wire([[W / 2 - 0.3, -0.05, -0.6], [W / 2 - 0.2, -0.1, -0.85], [W / 2 - 0.5, -0.12, -1.0]], 0.02, M.rubber()));
  const xyz = (i: number): V3 => {
    const c = Math.floor(i / 8), d = i % 8; // dots 1..3 and 7 down the left, 4..6 and 8 down the right
    const col = d < 3 || d === 6 ? 0 : 1, row = d === 6 || d === 7 ? 3 : d % 3;
    return [(c - (CELLS - 1) / 2) * CP + (col - 0.5) * DP, 0.075, -0.1 + (row - 1.5) * DP];
  };
  const place = () => { for (let i = 0; i < CELLS * 8; i++) { const [x, y, z] = xyz(i); pins.put(i, x, y + hgt[i], z); } };
  place(); pins.done();
  // Behind it, the last cell taken out, enlarged and turned on its side: eight strips of piezo crystal, each fixed at
  // one end to a board. A strip bends when it is charged and its free end lifts a pin through the cap.
  const REED = 0.93, TRAVEL = 0.13;
  const cell = G.group(G.rbox(0.5, 0.05, 1.95, 0.02, body, [0, 0.025, -0.45]), G.rbox(0.44, 0.06, 0.86, 0.02, M.plastic(0x15171a, 0.4), [0, 0.93, 0]), G.box(0.02, 0.76, 0.86, M.pcb(), [0, 0.48, -0.88], 0.004));
  for (const sx of [-1, 1]) for (const z of [-0.38, 0.38]) cell.add(G.rod([sx * 0.19, 0.05, z], [sx * 0.19, 0.9, z], 0.012, M.steel(1), 8));
  const crystal = M.ceramic(), shim = M.brass(2), white = M.plastic(0xf5f3ec, 0.4), bore = M.black();
  const works = Array.from({ length: 8 }, (_, d) => {
    const col = d < 3 || d === 6 ? 0 : 1, row = d === 6 || d === 7 ? 3 : d % 3;
    // the strip for the row nearest the board is the top one, so that the pins of the rows beyond it can pass its end
    const x = (col - 0.5) * 0.2, z = (row - 1.5) * 0.2, y = 0.74 - row * 0.15;
    const reed = G.group(G.box(0.12, 0.006, REED, shim, [0, 0, REED / 2], 0), G.box(0.12, 0.02, REED - 0.14, crystal, [0, 0, REED / 2 + 0.07], 0.003));
    reed.position.set(x, y, z + 0.04 - REED);
    const pin = G.group(G.cyl(0.036, 0.97 - y, white, [0, (0.97 + y) / 2 + 0.012, 0], 20), G.sph(0.045, white, [0, 0.985, 0], 20));
    pin.position.set(x, 0, z);
    // soldered to the board at its fixed end
    cell.add(reed, pin, G.box(0.05, 0.03, 0.1, shim, [x * 0.45, y, z + 0.09 - REED], 0.004), G.cyl(0.062, 0.004, bore, [x, 0.961, z], 24));
    return { reed, pin };
  });
  cell.position.set(1.1, -0.16, -1.5); cell.rotation.y = Math.PI / 2;
  root.add(cell);
  let settled = false;
  return {
    root, inDark: 'vanishes', view: [14, 32], zoom: 1.3,
    views: {
      // low over the cells that count seconds, where a reading finger would be
      touch: { at: [1.45, 0.38, 0.5], to: [1.8, 0.1, -0.1], play: 0.4 },
      cell: { at: [1.9, 0.9, 0.2], to: [0.75, 0.42, -1.5] },
    },
    update: () => {
      const n = now();
      const text = `#${n.hhmm.slice(0, 2)}:#${n.hhmm.slice(3)}:#${n.hhmmss.slice(6)}`;
      for (let c = 0; c < CELLS; c++) {
        const up = BRAILLE[text[c]] ?? [];
        for (let d = 0; d < 8; d++) { const i = c * 8 + d; hgt[i] += ((up.includes(d + 1) ? 0.085 : 0.01) - hgt[i]) * (settled ? 0.3 : 1); }
      }
      place(); pins.mesh.instanceMatrix.needsUpdate = true;
      works.forEach(({ reed, pin }, d) => {
        const lift = ((hgt[(CELLS - 1) * 8 + d] - 0.01) / 0.075) * TRAVEL;
        pin.position.y = lift; reed.rotation.x = -Math.asin(lift / REED);
      });
      settled = true;
    },
  };
}

/** Drone show: every pixel is an aircraft with a lamp. A diorama of a night field: they write the time, then regroup as a globe. */
export function droneShow(): Built {
  const root = G.group();
  const N = 300;
  // one quadcopter: two crossed arms and four rotor discs, far smaller than the light it carries
  const quad = G.merge([
    new THREE.BoxGeometry(0.03, 0.003, 0.004).rotateY(Math.PI / 4), new THREE.BoxGeometry(0.03, 0.003, 0.004).rotateY(-Math.PI / 4), new THREE.BoxGeometry(0.008, 0.005, 0.008),
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => new THREE.CylinderGeometry(0.007, 0.007, 0.001, 10).translate(a * 0.0105, 0.003, b * 0.0105)),
  ]);
  const bodies = new Swarm(quad, M.plastic(0x101214, 0.5), N);
  const lights = glows(N, 0.075);
  // painted backdrop: dusk over a town, a field in front
  const sky = screen(1024, 512), c = sky.ctx;
  const grad = c.createLinearGradient(0, 0, 0, 512); grad.addColorStop(0, '#050816'); grad.addColorStop(0.62, '#141c3c'); grad.addColorStop(0.86, '#3b2a4a'); grad.addColorStop(1, '#5a3a40');
  c.fillStyle = grad; c.fillRect(0, 0, 1024, 512);
  c.fillStyle = '#dfe6ff'; for (let i = 0; i < 170; i++) { const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, q = Math.abs(Math.sin(i * 78.233) * 12543.21) % 1; c.globalAlpha = 0.25 + 0.6 * r; c.fillRect(q * 1024, r * 330, 1.6, 1.6); }
  c.globalAlpha = 1; c.fillStyle = '#05060c';
  for (let x = 0; x < 1024; x += 18) { const h = 18 + (Math.abs(Math.sin(x * 0.37) * 43.7) % 1) * 46; c.fillRect(x, 512 - h, 16, h); }
  c.fillRect(470, 380, 14, 132); c.fillRect(462, 372, 30, 10);
  c.fillStyle = '#ffd98a'; for (let i = 0; i < 90; i++) { const q = Math.abs(Math.sin(i * 3.7) * 9731.1) % 1, r = Math.abs(Math.sin(i * 9.1) * 3113.7) % 1; c.fillRect(q * 1024, 512 - 8 - r * 34, 2, 2); }
  sky.tex.needsUpdate = true;
  // tall enough that someone standing on the field sees the whole figure against it
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 2.62, 64, 1, true, Math.PI * 0.5, Math.PI), new THREE.MeshStandardMaterial({ map: sky.tex, side: THREE.BackSide, roughness: 1 }));
  wall.position.y = 1.31;
  const wallBack = new THREE.Mesh(new THREE.CylinderGeometry(1.735, 1.735, 2.62, 64, 1, true, Math.PI * 0.5, Math.PI), M.plastic(0x1d1f22, 0.7));
  wallBack.position.y = 1.31;
  root.add(bodies.mesh, lights.points, wall, wallBack, G.cyl(1.75, 0.05, M.plastic(0x1b241d, 0.95), [0, -0.025, 0], 72));
  // take-off grid and the control tent
  const pads = new Swarm(new THREE.BoxGeometry(0.03, 0.002, 0.03), M.paper(0xb9b6aa), N);
  const padAt = (i: number): V3 => [((i % 25) - 12) * 0.07, 0.002, 0.55 + Math.floor(i / 25) * 0.07];
  for (let i = 0; i < N; i++) { const p = padAt(i); pads.put(i, p[0], p[1], p[2]); }
  pads.done();
  root.add(pads.mesh, G.box(0.16, 0.08, 0.12, M.paper(0xe9e6dc), [-1.15, 0.04, 1.0], 0.01), G.box(0.06, 0.03, 0.03, M.plastic(0x8a1f16, 0.5), [-0.98, 0.015, 1.05], 0.004));

  const globe: V3[] = [];
  for (let i = 0; i < N; i++) { const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996; globe.push([Math.cos(a) * r * 0.66, 1.25 + y * 0.66, Math.sin(a) * r * 0.66]); }
  const cur: V3[] = Array.from({ length: N }, (_, i) => padAt(i));
  let stamp = '', word: V3[] = [];
  const col = new THREE.Color();
  const draw = (t: number) => {
    const n = now();
    if (n.hhmm !== stamp) {
      stamp = n.hhmm; word = [];
      const d = dots(stamp);
      // two aircraft to every dot of the figure, so the strokes read as lines of light
      for (let y = 0; y < 7; y++) for (let x = 0; x < d.w; x++) if (d.on(x, y)) for (const o of [-0.25, 0.25]) word.push([(x - (d.w - 1) / 2) * 0.078, 1.56 - (y + o) * 0.084, 0]);
      word.length = Math.min(word.length, N - 60);
    }
    const phase = (t % 18) / 18, asGlobe = phase > 0.6, spin = t * 0.45;
    const ringN = N - word.length;
    for (let i = 0; i < N; i++) {
      let tx: number, ty: number, tz: number, hue: number, sat = 1, lum = 0.56;
      if (asGlobe) {
        const [x, y, z] = globe[i];
        tx = x * Math.cos(spin) - z * Math.sin(spin); ty = y; tz = x * Math.sin(spin) + z * Math.cos(spin);
        hue = 0.52 + 0.3 * ((y - 0.6) / 1.3);
      } else if (i < word.length) { [tx, ty, tz] = word[i]; hue = 0.1; sat = 0.55; lum = 0.7; }
      else { const a = ((i - word.length) / ringN) * Math.PI * 2 + t * 0.12; tx = Math.cos(a) * 1.4; ty = 1.31 + Math.sin(a) * 0.6; tz = 0; hue = 0.55 + 0.08 * Math.sin(a * 3); }
      const p = cur[i], k = 0.03 + (i % 7) * 0.004;
      p[0] += (tx - p[0]) * k; p[1] += (ty - p[1]) * k; p[2] += (tz - p[2]) * k;
      // no aircraft holds perfectly still
      const wx = Math.sin(t * 1.7 + i * 1.3) * 0.004, wy = Math.sin(t * 2.1 + i) * 0.005;
      bodies.put(i, p[0] + wx, p[1] + wy, p[2], 0, i, 0);
      lights.pos.set([p[0] + wx, p[1] + wy - 0.004, p[2]], i * 3);
      col.setHSL(hue, sat, lum);
      lights.col.set([col.r, col.g, col.b], i * 3);
    }
    bodies.mesh.instanceMatrix.needsUpdate = true;
    lights.flush(true);
  };
  for (let i = 0; i < 160; i++) draw(i * 0.05);
  bodies.done();
  return {
    root, inDark: 'better', glow: 0x8fb4ff, view: [10, 5],
    views: {
      // at the edge of the field, a little above the grass
      field: { at: [0, 0.12, 3.5], to: [0, 1.2, 0], fov: 56 },
      // the colon of the time: there are always aircraft here while the figures are up
      close: { at: [0.2, 1.25, 0.35], to: [0, 1.31, 0] },
    },
    update: ({ t }) => draw(t),
  };
}
