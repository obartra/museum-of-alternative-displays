import { G, M, Swarm, glows, lamps, screen, THREE, type Built, type V3 } from '../kit';
import { feet, screws, vents } from '../parts';
import { bigTime, dotMatrix, dots, hsl, now } from '../../sims/draw';

/** LED sign: one lamp per pixel, bright enough to read outdoors at noon. */
export function led(): Built {
  const root = G.group();
  const COLS = 32, ROWS = 16, P = 0.07, N = COLS * ROWS;
  const dome = new THREE.SphereGeometry(0.023, 12, 9).scale(1, 1, 1.35);
  const domes = new Swarm(dome, M.plastic(0x3a3d41, 0.3), N);
  const light = lamps(new THREE.SphereGeometry(0.027, 10, 8).scale(1, 1, 1.3), N);
  const bloom = glows(N, 0.13);
  const xy = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, ((ROWS - 1) / 2 - Math.floor(i / COLS)) * P];
  for (let i = 0; i < N; i++) { const [x, y] = xy(i); domes.put(i, x, y, 0.02); light.put(i, x, y, 0.026); bloom.pos.set([x, y, 0.06], i * 3); }
  domes.done(); light.done(); bloom.flush(true); bloom.points.geometry.computeBoundingBox();
  const W = COLS * P + 0.08, H = ROWS * P + 0.08;
  root.add(domes.mesh, light.mesh, bloom.points, G.box(W, H, 0.05, M.black(), [0, 0, -0.005], 0.006));
  // a shade over every row keeps the sun off the lamps
  const fins = new Swarm(new THREE.BoxGeometry(COLS * P, 0.005, 0.04), M.black(), ROWS);
  for (let r = 0; r < ROWS; r++) fins.put(r, 0, ((ROWS - 1) / 2 - r) * P + P * 0.46, 0.036);
  fins.done();
  // cabinet: sheet steel with a door at the back and fins to lose heat
  const tin = M.dark();
  root.add(fins.mesh, G.rbox(W + 0.1, H + 0.1, 0.24, 0.02, tin, [0, 0, -0.14]), vents(W - 0.5, H - 0.4, 12, [0, 0, -0.262]));
  root.add(screws([[-W / 2, H / 2, -0.02], [W / 2, H / 2, -0.02], [-W / 2, -H / 2, -0.02], [W / 2, -H / 2, -0.02]].map(([x, y, z]) => [x * 0.99, y * 0.97, z] as V3), 0.016));
  for (const x of [-0.8, 0.8]) root.add(G.cyl(0.035, 0.4, M.steel(1), [x, -H / 2 - 0.23, -0.14], 20), G.cyl(0.14, 0.03, M.steel(), [x, -H / 2 - 0.43, -0.14], 28));
  const col = new THREE.Color();
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0xff9a4a, view: [20, 8], zoom: 1.05,
    update: () => {
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      const d = dots(n.hhmm);
      for (let i = 0; i < N; i++) {
        const c = i % COLS, r = Math.floor(i / COLS);
        if (r >= 2 && r <= 8 && d.on(c - 4, r - 2)) col.setHSL(0.02 + (c / COLS) * 0.1, 1, 0.55);
        else if (r >= 11 && r <= 13 && c >= 1 && c <= 30 && c - 1 < n.s / 2) col.setHSL((c - 1) / 30 * 0.8, 1, 0.5);
        else col.setRGB(0, 0, 0);
        light.tint(i, col.r, col.g, col.b);
        bloom.col.set([col.r * 0.5, col.g * 0.5, col.b * 0.5], i * 3);
      }
      if (light.mesh.instanceColor) light.mesh.instanceColor.needsUpdate = true;
      bloom.flush();
    },
  };
}

/** OLED: a sheet a few millimetres thick where every pixel is its own lamp, so black is simply off. */
export function oled(): Built {
  const root = G.group();
  const s = screen(640, 360);
  const panel = G.group(
    G.slab(2.26, 1.3, 0.03, 0.018, M.plastic(0x08090a, 0.25)),
    G.plane(2.2, 1.24, M.lit(s, 1.5, 1), [0, 0, 0.0096]),
    // the electronics do not fit in a sheet this thin, so they ride in a box low on the back
    G.rbox(1.2, 0.5, 0.07, 0.02, M.dark(), [0, -0.36, -0.044]),
  );
  panel.position.set(0, 0.95, 0); panel.rotation.x = -0.09;
  root.add(panel, G.rbox(1.15, 0.035, 0.52, 0.016, M.steel(), [0, 0.0175, -0.04]), G.box(0.16, 0.42, 0.035, M.steel(1), [0, 0.23, -0.13]));
  return {
    root, inDark: 'glows', glow: 0xb8a0ff, view: [28, 8], surface: s.canvas,
    update: ({ t }) => {
      const c = s.ctx, n = now();
      c.fillStyle = '#000'; c.fillRect(0, 0, 640, 360);
      const g = c.createLinearGradient(120, 0, 520, 360);
      g.addColorStop(0, hsl(t * 20, 95, 62)); g.addColorStop(0.5, hsl(t * 20 + 70, 95, 60)); g.addColorStop(1, hsl(t * 20 + 150, 95, 62));
      bigTime(c, 640, 360, n.hhmmss, g, 300, 0.58);
      for (let i = 0; i < 5; i++) { const a = t * 0.7 + i * 1.26; c.fillStyle = hsl(i * 72 + t * 30, 100, 60); c.beginPath(); c.arc(320 + Math.cos(a) * 285, 180 + Math.sin(a) * 150, 5, 0, 7); c.fill(); }
      s.tex.needsUpdate = true;
    },
  };
}

/** MicroLED wall: inorganic LEDs too small to see, built as tiles so a dead one can be lifted out and swapped. */
export function microled(): Built {
  const root = G.group();
  const s = screen(768, 512);
  const T = 0.74, top = 1.3;
  const shell = M.plastic(0x0c0d0e, 0.4), al = M.steel(1);
  const module = (mat: THREE.Material) => G.group(
    G.box(T - 0.008, T - 0.008, 0.05, shell, undefined, 0.006), G.plane(T - 0.014, T - 0.014, mat, [0, 0, 0.0256]),
    G.box(T - 0.2, T - 0.2, 0.05, M.dark(), [0, 0, -0.05]),
  );
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const at: V3 = [(c - 1) * T, top - r * T, 0];
    if (r === 0 && c === 2) {
      // the empty socket: backplane, power and data sockets, four magnets that hold a tile
      root.add(G.box(T - 0.04, T - 0.04, 0.012, M.pcb(), [at[0], at[1], -0.07], 0), G.box(0.16, 0.06, 0.03, M.plastic(0xe9e6dc, 0.5), [at[0] - 0.12, at[1], -0.055]), G.box(0.1, 0.1, 0.03, M.plastic(0x16181a, 0.5), [at[0] + 0.14, at[1] - 0.05, -0.055]));
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) root.add(G.cyl(0.03, 0.03, M.steel(), [at[0] + sx * 0.27, at[1] + sy * 0.27, -0.055], 20).rotateX(Math.PI / 2));
      continue;
    }
    const tex = s.tex.clone(); tex.repeat.set(1 / 3, 1 / 2); tex.offset.set(c / 3, 1 - (r + 1) / 2); tex.needsUpdate = true;
    const tile = module(new THREE.MeshPhysicalMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.5, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.08 }));
    tile.position.set(...at);
    root.add(tile);
  }
  // the tile that came out, dark, leaning against the stand with the suction lifter still on it
  const spare = module(new THREE.MeshPhysicalMaterial({ color: 0x06070a, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 }));
  spare.position.set(1.02, 0.38, 0.62); spare.rotation.set(-0.42, -0.5, 0);
  const lifter = G.group(G.cyl(0.11, 0.035, M.rubber(), [0, 0, 0.045], 32).rotateX(Math.PI / 2), G.torus(0.075, 0.016, M.plastic(0xd1481f, 0.4), [0, 0, 0.06], Math.PI).rotateX(Math.PI / 2));
  spare.add(lifter);
  root.add(spare);
  // aluminium frame
  for (const x of [-T, 0, T]) root.add(G.box(0.06, 1.74, 0.06, al, [x, 0.87, -0.11]));
  for (const y of [top - T, top, top - T / 2]) root.add(G.box(2.32, 0.05, 0.05, al, [0, y, -0.11]));
  root.add(G.box(2.5, 0.05, 0.8, M.dark(), [0, 0.025, 0.05]), feet(2.5, 0.8, 0.06, 0.03, -0.03));
  for (const x of [-T, T]) root.add(G.box(0.05, 0.05, 0.6, al, [x, 0.3, -0.38]).rotateX(0.5));
  return {
    root, inDark: 'glows', glow: 0xffb0d0, view: [26, 8], surface: s.canvas,
    update: ({ t }) => {
      const c = s.ctx;
      const g = c.createLinearGradient(0, 0, 768, 512);
      g.addColorStop(0, hsl(330 + Math.sin(t * 0.3) * 30, 90, 52)); g.addColorStop(1, hsl(215 + Math.cos(t * 0.25) * 30, 95, 48));
      c.fillStyle = g; c.fillRect(0, 0, 768, 512);
      c.save(); c.translate(-128, 0); bigTime(c, 768, 512, now().hhmm, '#ffffff', 800, 0.5); c.restore();
      s.tex.needsUpdate = true;
    },
  };
}

/** Thin-film electroluminescent panel: a yellow glow from zinc sulphide, built for cockpits, cold and vibration. */
export function tfel(): Built {
  const root = G.group();
  const s = screen(640, 400);
  const unit = G.group(
    G.rbox(2.0, 1.36, 0.22, 0.03, M.dark(), [0, 0, -0.02]),
    G.bezel(2.0, 1.36, 1.68, 1.06, 0.02, 0.05, M.plastic(0x1a1c1f, 0.5), [0, 0, 0.1], 0.03, 0.012),
    G.plane(1.7, 1.08, M.lit(s, 1.5, 0.8), [0, 0, 0.094]),
    screws([[-0.92, 0.6, 0.126], [0.92, 0.6, 0.126], [-0.92, -0.6, 0.126], [0.92, -0.6, 0.126]], 0.026),
    vents(1.5, 0.7, 9, [0, 0, -0.132]),
  );
  // flanges for bolting it into a console
  for (const x of [-1.07, 1.07]) unit.add(G.box(0.16, 0.6, 0.02, M.steel(1), [x, 0, -0.06], 0.004), screws([[x + Math.sign(x) * 0.03, 0.2, -0.048], [x + Math.sign(x) * 0.03, -0.2, -0.048]], 0.02, 'z', M.dark()));
  unit.position.set(0, 0.9, 0); unit.rotation.x = -0.22;
  root.add(unit, G.rbox(1.6, 0.05, 0.85, 0.02, M.steel(), [0, 0.025, -0.05]));
  for (const x of [-0.6, 0.6]) root.add(G.box(0.06, 0.62, 0.06, M.steel(1), [x, 0.33, -0.3]).rotateX(-0.12));
  return {
    root, inDark: 'glows', glow: 0xffb21a, view: [22, 10], surface: s.canvas,
    update: () => {
      const c = s.ctx, n = now();
      c.fillStyle = '#060400'; c.fillRect(0, 0, 640, 400);
      c.save(); c.translate(0, 30); dotMatrix(c, 640, 210, n.hhmmss, '#ffb21a', null, false, 0.86, 4); c.restore();
      c.strokeStyle = c.fillStyle = '#ffb21a'; c.lineWidth = 2;
      c.strokeRect(30, 280, 580, 34); c.fillRect(34, 284, (572 * (n.s + n.ms / 1000)) / 60, 26);
      for (let i = 0; i <= 12; i++) c.fillRect(30 + (580 * i) / 12, 320, 2, i % 3 === 0 ? 16 : 8);
      s.tex.needsUpdate = true;
    },
  };
}

/** Transparent display: a shop case whose front pane is the screen. It adds light to the view of the thing behind it and cannot draw black. */
export function transparent(): Built {
  const root = G.group();
  const s = screen(512, 448);
  const frame = M.dark(1);
  const W = 1.7, D = 1.1, H = 1.5, y0 = 0.36;
  // plinth cabinet, glass on three sides and the top, the screen as the fourth
  root.add(G.rbox(W + 0.04, y0, D + 0.04, 0.03, M.plastic(0x1b1d20, 0.6), [0, y0 / 2, 0]), G.box(W - 0.06, 0.02, D - 0.06, M.cloth(0x2c2f3a), [0, y0 + 0.01, 0], 0));
  root.add(G.box(W + 0.04, 0.07, D + 0.04, frame, [0, y0 + H + 0.035, 0]), G.box(W - 0.2, 0.02, 0.1, M.glow(0xfff4e0, 1.2), [0, y0 + H - 0.01, 0.2], 0));
  for (const x of [-1, 1]) for (const z of [-1, 1]) root.add(G.box(0.04, H, 0.04, frame, [x * (W / 2), y0 + H / 2, z * (D / 2)], 0.006));
  const back = G.pane(W - 0.04, H, 0.012, [0, y0 + H / 2, -D / 2]);
  const left = G.pane(D - 0.04, H, 0.012, [-W / 2, y0 + H / 2, 0]); left.rotation.y = Math.PI / 2;
  const right = G.pane(D - 0.04, H, 0.012, [W / 2, y0 + H / 2, 0]); right.rotation.y = Math.PI / 2;
  const front = G.pane(W - 0.04, H, 0.016, [0, y0 + H / 2, D / 2], 0x8fa4b4, 0.12);
  root.add(back, left, right, front, G.plane(W - 0.08, H - 0.06, M.add(s), [0, y0 + H / 2, D / 2 + 0.01]));
  // the thing on show: a twin-bell alarm clock, keeping the same time as the picture in front of it
  const dial = screen(256, 256);
  const cy = y0 + 0.58;
  const clock = G.group();
  const body = G.cyl(0.3, 0.18, M.enamel(0xb5281d), undefined, 56); body.rotation.x = Math.PI / 2;
  const rim = G.torus(0.3, 0.026, M.chrome(), [0, 0, 0.09]);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.275, 56), M.printed(dial, 0.6)); face.position.z = 0.092;
  const glassFront = G.sph(0.285, M.glass(0x9fb6b8, 0.05, 0.6), [0, 0, 0.09], 32); glassFront.scale.z = 0.14;
  clock.add(body, rim, face, glassFront);
  for (const sx of [-1, 1]) {
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.chrome());
    bell.position.set(sx * 0.19, 0.3, 0); bell.rotation.z = -sx * 0.5;
    clock.add(bell, G.cyl(0.018, 0.05, M.chrome(), [sx * 0.19 + sx * 0.06, 0.42, 0], 12), G.rod([sx * 0.14, -0.2, 0], [sx * 0.24, -0.36, 0.02], 0.022, M.chrome(), 12), G.sph(0.03, M.chrome(), [sx * 0.24, -0.36, 0.02], 14));
  }
  clock.add(G.rod([0, 0.3, 0], [0, 0.4, 0], 0.012, M.steel(), 8), G.sph(0.034, M.steel(), [0, 0.42, 0], 14), G.torus(0.09, 0.012, M.chrome(), [0, 0.47, 0], Math.PI));
  clock.position.set(0, cy, -0.05);
  root.add(clock, G.cyl(0.42, 0.2, M.cloth(0x1c2030), [0, y0 + 0.1, -0.05], 48));
  // the case lights its own contents, so the clock can still be seen when the hall goes dark
  const lamp = new THREE.PointLight(0xfff0dc, 1.6, 4, 1.6); lamp.position.set(0, y0 + H - 0.15, 0.25);
  root.add(lamp);
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9fe8ff, view: [16, 8], surface: s.canvas,
    update: ({ t }) => {
      const n = now();
      if (n.s !== stamp) {
        stamp = n.s;
        const d = dial.ctx;
        d.fillStyle = '#f6f1e2'; d.beginPath(); d.arc(128, 128, 128, 0, 7); d.fill();
        d.fillStyle = '#17191c'; d.font = '700 30px "Sofia Sans Extra Condensed Variable", sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle';
        for (let h = 1; h <= 12; h++) { const a = (h / 12) * Math.PI * 2; d.fillText(String(h), 128 + Math.sin(a) * 98, 130 - Math.cos(a) * 98); }
        const hand = (a: number, len: number, w: number, col: string) => { d.strokeStyle = col; d.lineWidth = w; d.lineCap = 'round'; d.beginPath(); d.moveTo(128 - Math.sin(a) * 14, 128 + Math.cos(a) * 14); d.lineTo(128 + Math.sin(a) * len, 128 - Math.cos(a) * len); d.stroke(); };
        hand(((n.h % 12) + n.m / 60) / 12 * Math.PI * 2, 56, 9, '#17191c'); hand((n.m + n.s / 60) / 60 * Math.PI * 2, 84, 6, '#17191c'); hand(n.s / 60 * Math.PI * 2, 90, 2.5, '#b5281d');
        d.fillStyle = '#17191c'; d.beginPath(); d.arc(128, 128, 7, 0, 7); d.fill();
        dial.tex.needsUpdate = true;
      }
      const c = s.ctx;
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 448);
      c.strokeStyle = '#8fe9ff'; c.fillStyle = '#e8fbff'; c.lineWidth = 3; c.shadowColor = '#4fd8ff'; c.shadowBlur = 12;
      // a ring that sits round the clock behind the glass, a leader line, and the same time in figures
      c.beginPath(); c.arc(256, 296, 118, t * 0.6, t * 0.6 + 4.9); c.stroke();
      c.beginPath(); c.moveTo(340, 214); c.lineTo(404, 132); c.lineTo(470, 132); c.stroke();
      c.save(); c.translate(0, -166); bigTime(c, 512, 448, n.hhmmss, '#e8fbff', 600, 0.2); c.restore();
      c.font = '18px "PT Mono", monospace'; c.textAlign = 'right'; c.fillText('same time, two ways', 470, 122);
      c.shadowBlur = 0;
      s.tex.needsUpdate = true;
    },
  };
}

/** Flexible display: the same thin films laid on plastic instead of glass, so the sheet can roll. */
export function flexible(): Built {
  const root = G.group();
  const s = screen(512, 448);
  const geo = new THREE.PlaneGeometry(1.7, 1.5, 1, 64);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = (p.getY(i) + 0.75) / 1.5; // 0 at the roller, 1 at the free edge
    p.setY(i, 0.24 + v * 1.42);
    p.setZ(i, 0.3 * Math.sin(v * Math.PI * 1.25) * (0.35 + v * 0.65) - 0.05);
  }
  geo.computeVertexNormals();
  const front = new THREE.Mesh(geo, M.lit(s, 1.45, 0.5));
  const backMat = M.plastic(0x1c1d20, 0.5); backMat.side = THREE.BackSide;
  const back = new THREE.Mesh(geo, backMat);
  // the sheet winds on to a drum; a bar along its free edge keeps it flat across the width
  const roller = G.cyl(0.17, 1.96, M.plastic(0x0e0f10, 0.35), [0, 0.22, -0.06], 56); roller.rotation.z = Math.PI / 2;
  const bar = G.rbox(1.76, 0.05, 0.03, 0.012, M.steel(), [0, 1.67, -0.243]);
  root.add(front, back, roller, bar, G.rbox(2.3, 0.05, 0.7, 0.02, M.dark(), [0, 0.025, -0.06]));
  for (const x of [-1.03, 1.03]) { const cap = G.cyl(0.21, 0.08, M.steel(), [x, 0.22, -0.06], 48); cap.rotation.z = Math.PI / 2; root.add(cap, G.box(0.08, 0.2, 0.44, M.steel(1), [x, 0.14, -0.06]), G.cyl(0.05, 0.1, M.dark(), [x + Math.sign(x) * 0.02, 0.22, -0.06], 20).rotateZ(Math.PI / 2)); }
  return {
    root, inDark: 'glows', glow: 0x7fe0c0, view: [34, 10], surface: s.canvas,
    update: ({ t }) => {
      const c = s.ctx;
      for (let y = 0; y < 448; y += 8) { c.fillStyle = hsl(160 + 70 * Math.sin(y / 70 + t * 0.9), 85, 30 + 14 * Math.sin(y / 31 - t)); c.fillRect(0, y, 512, 8); }
      bigTime(c, 512, 448, now().hhmm, '#ffffff', 800, 0.42);
      s.tex.needsUpdate = true;
    },
  };
}
