import { G, M, Swarm, lamps, screen, THREE, type Built, type V3 } from '../kit';
import { dots, now } from '../../sims/draw';

const FONT = '"Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';

/** Split-flap: six digit modules, HH MM SS. The top leaf of each falls forward to show the next numeral. */
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
  const leaf = (t: THREE.Texture) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
  const xs = [-1.62, -1.06, -0.28, 0.28, 1.06, 1.62];
  const mods = xs.map((x) => {
    const tex = { top: half(true), bot: half(false), front: half(true), back: half(false) };
    const top = G.plane(W, H / 2, leaf(tex.top), [x, H / 4, 0]);
    const bot = G.plane(W, H / 2, leaf(tex.bot), [x, -H / 4, 0]);
    const pivot = G.group();
    pivot.position.set(x, 0, 0.004);
    const front = G.plane(W, H / 2, leaf(tex.front), [0, H / 4, 0]);
    const back = G.plane(W, H / 2, leaf(tex.back), [0, H / 4, -0.002]);
    back.rotation.x = Math.PI;
    pivot.add(front, back);
    // housing: back, sides and floor, open at the top so the leaf wheel shows
    const dark = M.dark();
    root.add(G.box(0.6, 1.04, 0.03, dark, [x, 0, -0.34]), G.box(0.03, 1.04, 0.36, dark, [x - 0.285, 0, -0.16]), G.box(0.03, 1.04, 0.36, dark, [x + 0.285, 0, -0.16]), G.box(0.6, 0.03, 0.36, dark, [x, -0.52, -0.16]));
    root.add(G.rod([x - 0.27, 0, -0.14], [x + 0.27, 0, -0.14], 0.02, M.steel()));
    const wheel = new Swarm(new THREE.BoxGeometry(W, 0.34, 0.004).translate(0, 0.21, 0), M.plastic(0x1b1d1f, 0.7), 22);
    // the waiting leaves fan out behind the two that face the hall
    for (let i = 0; i < 22; i++) wheel.put(i, x, 0, -0.14, -(0.42 + (i / 21) * (Math.PI - 0.84)), 0, 0);
    wheel.done();
    root.add(top, bot, pivot, wheel.mesh);
    return { tex, pivot, shown: -1, next: -1, p: 1 };
  });
  root.add(G.box(4.0, 0.08, 0.5, M.steel(), [0, -0.58, -0.14]));
  for (const x of [-0.67, 0.67]) for (const y of [0.16, -0.16]) root.add(G.cyl(0.035, 0.02, M.plastic(0xf3f1e9), [x, y, -0.3], 16).rotateX(Math.PI / 2));

  const set = (t: THREE.Texture, d: number) => { t.offset.x = d / 10; };
  let last = 0;
  return {
    root, inDark: 'vanishes', view: [24, 12],
    update: ({ t }) => {
      const dt = Math.min(0.1, t - last); last = t;
      const d = now().digits;
      mods.forEach((m, i) => {
        if (m.shown < 0) { m.shown = m.next = d[i]; for (const k of ['top', 'bot', 'front', 'back'] as const) set(m.tex[k], d[i]); }
        if (m.p >= 1 && d[i] !== m.shown) {
          m.next = d[i]; m.p = 0;
          set(m.tex.top, m.next); set(m.tex.back, m.next); set(m.tex.front, m.shown); set(m.tex.bot, m.shown);
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

/** Flip-disc: a board of two-faced discs, each turned by a magnetic pulse and then left alone. */
export function flipDisc(): Built {
  const root = G.group();
  const COLS = 29, ROWS = 9, P = 0.1;
  const geo = new THREE.CylinderGeometry(0.043, 0.043, 0.008, 18).rotateX(Math.PI / 2);
  const discs = new Swarm(geo, [M.plastic(0x101112, 0.8), M.plastic(0xf2d21b, 0.6), M.plastic(0x101112, 0.8)], COLS * ROWS);
  const ang = new Float32Array(COLS * ROWS).fill(Math.PI);
  const tgt = new Float32Array(COLS * ROWS).fill(Math.PI);
  const pos = (c: number, r: number): V3 => [(c - (COLS - 1) / 2) * P, ((ROWS - 1) / 2 - r) * P, 0];
  for (let i = 0; i < COLS * ROWS; i++) { const [x, y] = pos(i % COLS, Math.floor(i / COLS)); discs.put(i, x, y, 0, 0, Math.PI, 0); }
  discs.done();
  root.add(discs.mesh, G.box(COLS * P + 0.06, ROWS * P + 0.06, 0.03, M.black(), [0, 0, -0.03]));
  const al = M.steel();
  root.add(G.box(COLS * P + 0.16, 0.05, 0.1, al, [0, ROWS * P / 2 + 0.055, -0.01]), G.box(COLS * P + 0.16, 0.05, 0.1, al, [0, -ROWS * P / 2 - 0.055, -0.01]));
  root.add(G.box(0.05, ROWS * P + 0.16, 0.1, al, [-COLS * P / 2 - 0.055, 0, -0.01]), G.box(0.05, ROWS * P + 0.16, 0.1, al, [COLS * P / 2 + 0.055, 0, -0.01]));
  for (const x of [-1, 1]) root.add(G.box(0.06, 0.3, 0.06, al, [x, -ROWS * P / 2 - 0.2, -0.02]), G.box(0.1, 0.03, 0.5, al, [x, -ROWS * P / 2 - 0.36, 0]));
  let last = 0;
  return {
    root, inDark: 'vanishes', view: [20, 8],
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
        const dlt = tgt[i] - ang[i];
        if (Math.abs(dlt) > 0.001) {
          // discs snap over quickly, columns a moment apart, the way a real board ripples
          const step = Math.sign(dlt) * Math.min(Math.abs(dlt), dt * (9 + (c % 5)));
          ang[i] += step; moved = true;
          const [x, y] = pos(c, r);
          discs.put(i, x, y, 0, 0, ang[i], 0);
        }
      }
      if (moved) discs.mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Mechanical television: a spinning disc with thirty holes in a spiral, a neon lamp behind and a lens in front. */
export function nipkow(): Built {
  const root = G.group();
  const face = screen(512, 512);
  const g = face.ctx;
  g.fillStyle = '#9ba1a6'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(0,0,0,.12)';
  for (let r = 30; r < 256; r += 9) { g.beginPath(); g.arc(256, 256, r, 0, 7); g.stroke(); }
  g.fillStyle = '#0a0a0a';
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2, r = 236 - i * 2.3;
    g.fillRect(256 + Math.cos(a) * r - 2.6, 256 + Math.sin(a) * r - 2.6, 5.2, 5.2);
  }
  g.fillStyle = '#3a3d40'; g.beginPath(); g.arc(256, 256, 34, 0, 7); g.fill();
  face.tex.needsUpdate = true;
  const cap = M.printed(face, 0.4); cap.metalness = 0.7;
  const disc = G.cyl(1, 0.016, [M.steel(), cap, cap], [0, 1.2, 0], 72);
  disc.geometry.rotateX(Math.PI / 2);
  root.add(disc);
  root.add(G.box(2.5, 0.14, 0.95, M.wood(0x6e4a2a), [0, 0.07, -0.05]));
  const motor = G.cyl(0.24, 0.42, M.dark(), [0, 1.2, -0.26]); motor.rotation.x = Math.PI / 2;
  root.add(motor, G.box(0.34, 1.0, 0.3, M.dark(), [0, 0.62, -0.28]), G.rod([0, 1.2, -0.05], [0, 1.2, 0.05], 0.035, M.brass()));
  // neon lamp behind the right-hand edge, viewing hood and lens in front
  const img = screen(120, 280);
  root.add(G.box(0.42, 0.78, 0.26, M.dark(), [0.82, 1.2, -0.2]), G.plane(0.3, 0.66, M.glow(0xff5a1e, 0.55), [0.82, 1.2, -0.065]));
  root.add(G.plane(0.27, 0.63, M.lit(img, 1.5), [0.82, 1.2, 0.012]));
  const hood = M.wood(0x4a321d);
  root.add(G.box(0.05, 0.86, 0.4, hood, [0.63, 1.2, 0.22]), G.box(0.05, 0.86, 0.4, hood, [1.01, 1.2, 0.22]), G.box(0.43, 0.05, 0.4, hood, [0.82, 1.63, 0.22]), G.box(0.43, 0.05, 0.4, hood, [0.82, 0.77, 0.22]));
  root.add(G.box(0.12, 0.7, 0.2, hood, [0.82, 0.42, 0.22]));
  const lens = G.sph(0.3, M.glass(0xffffff, 0.2), [0.82, 1.2, 0.4]); lens.scale.set(0.62, 1.2, 0.25);
  root.add(lens);
  return {
    root, inDark: 'glows', glow: 0xff5a1e, view: [32, 10], surface: img.canvas,
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
  const N = 20, P = 0.1;
  const tiles = new Swarm(new THREE.BoxGeometry(0.092, 0.092, 0.02), M.wood(0xb98a55), N * N);
  const tilt = new Float32Array(N * N);
  root.add(tiles.mesh, G.box(N * P + 0.04, N * P + 0.04, 0.05, M.black(), [0, 0, -0.07]));
  const wood = M.wood(0x5b3d22);
  const s = N * P / 2 + 0.07;
  root.add(G.box(N * P + 0.28, 0.12, 0.16, wood, [0, s, -0.03]), G.box(N * P + 0.28, 0.12, 0.16, wood, [0, -s, -0.03]), G.box(0.12, N * P + 0.28, 0.16, wood, [-s, 0, -0.03]), G.box(0.12, N * P + 0.28, 0.16, wood, [s, 0, -0.03]));
  const cam = G.cyl(0.03, 0.05, M.black(), [0, 0, 0.03], 16); cam.rotation.x = Math.PI / 2;
  root.add(cam, G.box(0.9, 0.06, 0.6, wood, [0, -s - 0.2, -0.03]), G.box(0.1, 0.24, 0.1, wood, [0, -s - 0.1, -0.03]));
  const put = (i: number) => { const c = i % N, r = Math.floor(i / N); tiles.put(i, (c - (N - 1) / 2) * P, ((N - 1) / 2 - r) * P, 0, tilt[i], 0, 0); };
  for (let i = 0; i < N * N; i++) put(i);
  tiles.done();
  return {
    root, inDark: 'vanishes', view: [18, 6],
    update: ({ t }) => {
      const cx = 0.3 * Math.sin(t * 0.55);
      for (let i = 0; i < N * N; i++) {
        const x = ((i % N) - (N - 1) / 2) * P, y = ((N - 1) / 2 - Math.floor(i / N)) * P;
        const head = Math.hypot(x - cx, y - 0.32) < 0.25;
        const body = ((x - cx) / 0.55) ** 2 + ((y + 0.55) / 0.5) ** 2 < 1;
        const want = head || body ? 0.62 : -0.5;
        tilt[i] += (want - tilt[i]) * 0.14;
        put(i);
      }
      tiles.mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Shape display: a table of motorised pins that rise into whatever form is asked for. */
export function shapeDisplay(): Built {
  const root = G.group();
  const N = 22, P = 0.075;
  const pins = new Swarm(new THREE.BoxGeometry(0.064, 1, 0.064).translate(0, 0.5, 0), M.plastic(0xf4f4f1, 0.5), N * N);
  root.add(pins.mesh, G.box(N * P + 0.3, 0.5, N * P + 0.3, M.plastic(0x2a2d31, 0.5), [0, -0.25, 0]), G.box(N * P + 0.36, 0.04, N * P + 0.36, M.steel(), [0, -0.52, 0]));
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
  return { root, inDark: 'vanishes', view: [34, 22], zoom: 0.82, update: ({ t }) => { draw(t); pins.mesh.instanceMatrix.needsUpdate = true; } };
}

const BRAILLE: Record<string, number[]> = {
  '#': [3, 4, 5, 6], ':': [2, 5], '1': [1], '2': [1, 2], '3': [1, 4], '4': [1, 4, 5], '5': [1, 5], '6': [1, 2, 4], '7': [1, 2, 4, 5], '8': [1, 2, 5], '9': [2, 4], '0': [2, 4, 5],
};

/** Refreshable braille: a line of cells whose pins rise and fall. It spells the time, numeric sign first. */
export function braille(): Built {
  const root = G.group();
  const CELLS = 11, CP = 0.4, DP = 0.1;
  const pin = new THREE.CapsuleGeometry(0.03, 0.08, 4, 10);
  const pins = new Swarm(pin, M.plastic(0xf5f3ec, 0.4), CELLS * 8);
  const hgt = new Float32Array(CELLS * 8);
  const W = CELLS * CP + 0.5;
  root.add(pins.mesh, G.rbox(W, 0.26, 1.15, 0.05, M.plastic(0x2b2e33, 0.55), [0, 0, 0]));
  root.add(G.box(CELLS * CP + 0.1, 0.02, 0.56, M.plastic(0x15171a, 0.4), [0, 0.125, -0.1]));
  const key = M.plastic(0x4d535a, 0.5);
  for (let c = 0; c < CELLS; c++) root.add(G.cyl(0.06, 0.03, key, [(c - (CELLS - 1) / 2) * CP, 0.14, -0.46], 16));
  root.add(G.rbox(1.6, 0.05, 0.16, 0.02, key, [0, 0.14, 0.42]), G.rbox(0.3, 0.05, 0.16, 0.02, key, [-W / 2 + 0.45, 0.14, 0.42]), G.rbox(0.3, 0.05, 0.16, 0.02, key, [W / 2 - 0.45, 0.14, 0.42]));
  const xyz = (i: number): V3 => {
    const c = Math.floor(i / 8), d = i % 8; // dots 1..3 and 7 down the left, 4..6 and 8 down the right
    const col = d < 3 || d === 6 ? 0 : 1, row = d === 6 || d === 7 ? 3 : d % 3;
    return [(c - (CELLS - 1) / 2) * CP + (col - 0.5) * DP, 0.08, -0.1 + (row - 1.5) * DP];
  };
  const place = () => { for (let i = 0; i < CELLS * 8; i++) { const [x, y, z] = xyz(i); pins.put(i, x, y + hgt[i], z); } };
  place(); pins.done();
  return {
    root, inDark: 'vanishes', view: [14, 32], zoom: 1.3,
    update: () => {
      const n = now();
      const text = `#${n.hhmm.slice(0, 2)}:#${n.hhmm.slice(3)}:#${n.hhmmss.slice(6)}`;
      for (let c = 0; c < CELLS; c++) {
        const up = BRAILLE[text[c]] ?? [];
        for (let d = 0; d < 8; d++) { const i = c * 8 + d; hgt[i] += ((up.includes(d + 1) ? 0.085 : 0.01) - hgt[i]) * 0.3; }
      }
      place(); pins.mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** Drone show: every pixel is an aircraft with a lamp. Here they hold the time, then regroup as a globe. */
export function droneShow(): Built {
  const root = G.group();
  const N = 150;
  const bodies = new Swarm(new THREE.BoxGeometry(0.035, 0.012, 0.035), M.plastic(0x1a1c1e, 0.6), N);
  const lights = lamps(new THREE.SphereGeometry(0.03, 10, 8), N);
  root.add(bodies.mesh, lights.mesh, G.cyl(1.7, 0.03, M.plastic(0x2c3a2f, 0.9), [0, -0.015, 0], 64));
  for (let i = 0; i < 5; i++) root.add(G.box(3.0, 0.002, 0.012, M.paper(), [0, 0.003, (i - 2) * 0.3]));
  const globe: V3[] = [];
  for (let i = 0; i < N; i++) { const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996; globe.push([Math.cos(a) * r * 0.62, 1.15 + y * 0.62, Math.sin(a) * r * 0.62]); }
  const cur: V3[] = globe.map(([x, , z], i) => [x * 2, 0.02, z * 2 + (i % 2) * 0.01]);
  let stamp = '', word: V3[] = [];
  const draw = (t: number) => {
    const n = now();
    if (n.hhmm !== stamp) {
      stamp = n.hhmm; word = [];
      const d = dots(stamp);
      for (let y = 0; y < 7; y++) for (let x = 0; x < d.w; x++) if (d.on(x, y)) word.push([(x - (d.w - 1) / 2) * 0.115, 1.62 - y * 0.115, 0]);
    }
    const phase = (t % 16) / 16;
    const asGlobe = phase > 0.62;
    const spin = t * 0.5;
    for (let i = 0; i < N; i++) {
      let tx: number, ty: number, tz: number, lit = 1;
      if (asGlobe) {
        const [x, y, z] = globe[i];
        tx = x * Math.cos(spin) - z * Math.sin(spin); ty = y; tz = x * Math.sin(spin) + z * Math.cos(spin);
      } else if (i < word.length) [tx, ty, tz] = word[i];
      else { tx = ((i % 14) - 6.5) * 0.2; ty = 0.03; tz = (Math.floor(i / 14) - 5) * 0.2; lit = 0; }
      const p = cur[i];
      const k = 0.035 + (i % 7) * 0.004;
      p[0] += (tx - p[0]) * k; p[1] += (ty - p[1]) * k; p[2] += (tz - p[2]) * k;
      const bob = Math.sin(t * 2 + i) * 0.006;
      bodies.put(i, p[0], p[1] + bob, p[2]);
      lights.put(i, p[0], p[1] + bob - 0.02, p[2]);
      const hue = asGlobe ? i / N : 0.11;
      const col = new THREE.Color().setHSL(hue, asGlobe ? 0.9 : 0.35, 0.6);
      lights.tint(i, col.r * lit, col.g * lit, col.b * lit);
    }
    bodies.mesh.instanceMatrix.needsUpdate = true; lights.mesh.instanceMatrix.needsUpdate = true;
    if (lights.mesh.instanceColor) lights.mesh.instanceColor.needsUpdate = true;
  };
  for (let i = 0; i < 90; i++) draw(i * 0.05);
  bodies.done(); lights.done();
  return { root, inDark: 'better', glow: 0xfff0d0, view: [16, 6], update: ({ t }) => draw(t) };
}
