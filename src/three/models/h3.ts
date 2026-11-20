import { G, M, Swarm, lamps, screen, THREE, type Built } from '../kit';
import { bigTime, dotMatrix, dots, hsl, now } from '../../sims/draw';

/** LED tile: one lamp per pixel, bright enough to read outdoors at noon. */
export function led(): Built {
  const root = G.group();
  const COLS = 32, ROWS = 16, P = 0.07, N = COLS * ROWS;
  const domes = new Swarm(new THREE.SphereGeometry(0.022, 10, 8), M.plastic(0x3a3d41, 0.35), N);
  const light = lamps(new THREE.SphereGeometry(0.027, 10, 8), N);
  const xy = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, ((ROWS - 1) / 2 - Math.floor(i / COLS)) * P];
  for (let i = 0; i < N; i++) { const [x, y] = xy(i); domes.put(i, x, y, 0.02); light.put(i, x, y, 0.024); }
  domes.done(); light.done();
  const W = COLS * P + 0.08, H = ROWS * P + 0.08;
  root.add(domes.mesh, light.mesh, G.box(W, H, 0.05, M.black(), [0, 0, -0.005]), G.box(W - 0.2, H - 0.2, 0.16, M.dark(), [0, 0, -0.11]));
  for (let i = 0; i < 9; i++) root.add(G.box(W - 0.4, 0.012, 0.05, M.steel(), [0, (i - 4) * 0.1, -0.2]));
  for (const x of [-0.8, 0.8]) root.add(G.box(0.06, 0.34, 0.06, M.steel(), [x, -H / 2 - 0.16, -0.08]), G.box(0.1, 0.03, 0.5, M.steel(), [x, -H / 2 - 0.34, -0.02]));
  const col = new THREE.Color();
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0xff9a4a, view: [20, 8],
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
      }
      if (light.mesh.instanceColor) light.mesh.instanceColor.needsUpdate = true;
    },
  };
}

/** OLED: a sheet a few millimetres thick where every pixel is its own lamp, so black is simply off. */
export function oled(): Built {
  const root = G.group();
  const s = screen(640, 360);
  const panel = G.group(G.rbox(2.24, 1.28, 0.016, 0.006, M.black()), G.plane(2.18, 1.22, M.lit(s, 1.5), [0, 0, 0.0095]), G.box(1.0, 0.42, 0.05, M.dark(), [0, -0.38, -0.034]));
  panel.position.set(0, 0.92, 0); panel.rotation.x = -0.1;
  root.add(panel, G.rbox(1.1, 0.03, 0.5, 0.012, M.steel(), [0, 0.015, -0.05]), G.box(0.14, 0.34, 0.03, M.steel(), [0, 0.19, -0.12]));
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

/** MicroLED wall: inorganic LEDs too small to see, built as tiles so a dead one can be swapped. */
export function microled(): Built {
  const root = G.group();
  const s = screen(768, 512);
  const T = 0.74;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const tex = s.tex.clone(); tex.repeat.set(1 / 3, 1 / 2); tex.offset.set(c / 3, 1 - (r + 1) / 2); tex.needsUpdate = true;
    const mat = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.5, roughness: 0.3 });
    const tile = G.group(G.box(T - 0.006, T - 0.006, 0.05, M.black()), G.plane(T - 0.012, T - 0.012, mat, [0, 0, 0.026]));
    tile.position.set((c - 1) * T, 1.24 - r * T, 0);
    if (r === 0 && c === 2) { tile.position.z = 0.34; tile.position.x += 0.1; tile.rotation.y = -0.5; }
    root.add(tile);
  }
  const al = M.steel();
  for (const x of [-T, 0, T]) root.add(G.box(0.05, 1.7, 0.05, al, [x, 0.85, -0.07]));
  root.add(G.box(2.3, 0.05, 0.05, al, [0, 0.5, -0.07]), G.box(2.3, 0.05, 0.05, al, [0, 1.24, -0.07]), G.box(2.4, 0.04, 0.7, al, [0, 0.02, -0.05]));
  return {
    root, inDark: 'glows', glow: 0xffb0d0, view: [26, 8], surface: s.canvas,
    update: ({ t }) => {
      const c = s.ctx;
      const g = c.createLinearGradient(0, 0, 768, 512);
      g.addColorStop(0, hsl(330 + Math.sin(t * 0.3) * 30, 90, 52)); g.addColorStop(1, hsl(215 + Math.cos(t * 0.25) * 30, 95, 48));
      c.fillStyle = g; c.fillRect(0, 0, 768, 512);
      bigTime(c, 768, 512, now().hhmm, '#ffffff', 800, 0.6);
      c.fillStyle = 'rgba(0,0,0,.14)';
      for (let x = 0; x < 768; x += 8) c.fillRect(x, 0, 1.5, 512);
      for (let y = 0; y < 512; y += 8) c.fillRect(0, y, 768, 1.5);
      s.tex.needsUpdate = true;
    },
  };
}

/** Thin-film electroluminescent panel: a yellow glow from zinc sulphide, built for cockpits and cold. */
export function tfel(): Built {
  const root = G.group();
  const s = screen(640, 400);
  const unit = G.group(G.rbox(2.0, 1.36, 0.24, 0.03, M.dark()), G.plane(1.66, 1.04, M.lit(s, 1.5), [0, 0, 0.122]));
  for (const x of [-0.92, 0.92]) for (const y of [-0.6, 0.6]) { const sc = G.cyl(0.03, 0.02, M.steel(), [x, y, 0.122], 12); sc.rotation.x = Math.PI / 2; unit.add(sc); }
  for (const x of [-1.08, 1.08]) unit.add(G.box(0.18, 0.5, 0.03, M.steel(), [x, 0, -0.08]));
  unit.position.set(0, 0.86, 0); unit.rotation.x = -0.22;
  root.add(unit, G.box(1.6, 0.04, 0.8, M.steel(), [0, 0.02, -0.05]), G.box(0.06, 0.5, 0.06, M.steel(), [-0.6, 0.28, -0.25]), G.box(0.06, 0.5, 0.06, M.steel(), [0.6, 0.28, -0.25]));
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

/** Transparent display: light is added to the view behind it. It cannot draw black, only leave things clear. */
export function transparent(): Built {
  const root = G.group();
  const s = screen(512, 448);
  const frame = M.dark();
  root.add(G.box(1.7, 0.1, 1.1, frame, [0, 0.05, 0]), G.box(1.7, 0.06, 1.1, frame, [0, 1.63, 0]));
  for (const x of [-0.82, 0.82]) for (const z of [-0.52, 0.52]) root.add(G.box(0.05, 1.5, 0.05, frame, [x, 0.85, z]));
  const glass = M.glass(0xeaf6ff, 0.1);
  const back = G.plane(1.6, 1.5, glass, [0, 0.85, -0.52]);
  const left = G.plane(1.0, 1.5, glass, [-0.82, 0.85, 0]); left.rotation.y = Math.PI / 2;
  const right = G.plane(1.0, 1.5, glass, [0.82, 0.85, 0]); right.rotation.y = Math.PI / 2;
  root.add(back, left, right, G.plane(1.6, 1.5, M.glass(0xeaf6ff, 0.12), [0, 0.85, 0.52]), G.plane(1.6, 1.4, M.add(s), [0, 0.85, 0.525]));
  // the thing on show, seen through the picture
  root.add(G.cyl(0.3, 0.3, M.ceramic(), [0, 0.25, 0], 40), G.sph(0.3, M.brass(), [0, 0.7, 0], 40), G.cyl(0.05, 0.5, M.brass(), [0.45, 0.35, -0.2], 16), G.sph(0.11, M.enamel(0x1f3fa6), [0.45, 0.68, -0.2]));
  return {
    root, inDark: 'glows', glow: 0x9fe8ff, view: [16, 8], surface: s.canvas,
    update: ({ t }) => {
      const c = s.ctx;
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 448);
      c.strokeStyle = '#8fe9ff'; c.lineWidth = 3; c.shadowColor = '#4fd8ff'; c.shadowBlur = 12;
      c.beginPath(); c.arc(256, 250, 150, t * 0.6, t * 0.6 + 4.6); c.stroke();
      c.beginPath(); c.arc(256, 250, 172, -t * 0.4, -t * 0.4 + 1.4); c.stroke();
      c.save(); c.translate(0, -150); bigTime(c, 512, 448, now().hhmmss, '#e8fbff', 600, 0.22); c.restore();
      c.shadowBlur = 0;
      s.tex.needsUpdate = true;
    },
  };
}

/** Flexible display: the same thin films laid on plastic instead of glass, so the sheet can roll. */
export function flexible(): Built {
  const root = G.group();
  const s = screen(512, 448);
  const geo = new THREE.PlaneGeometry(1.7, 1.5, 1, 56);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = (p.getY(i) + 0.75) / 1.5; // 0 at the roller, 1 at the free edge
    p.setY(i, 0.2 + v * 1.42);
    p.setZ(i, 0.3 * Math.sin(v * Math.PI * 1.25) * (0.35 + v * 0.65) - 0.05);
  }
  geo.computeVertexNormals();
  const front = new THREE.Mesh(geo, M.lit(s, 1.45));
  const backMat = M.plastic(0x1c1d20, 0.5); backMat.side = THREE.BackSide;
  const back = new THREE.Mesh(geo, backMat);
  const roller = G.cyl(0.17, 2.0, M.dark(), [0, 0.18, -0.06], 40); roller.rotation.z = Math.PI / 2;
  root.add(front, back, roller);
  for (const x of [-1.02, 1.02]) { const cap = G.cyl(0.2, 0.06, M.steel(), [x, 0.18, -0.06], 40); cap.rotation.z = Math.PI / 2; root.add(cap, G.box(0.06, 0.2, 0.5, M.steel(), [x, 0.08, -0.06])); }
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
