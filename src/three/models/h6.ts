import { G, M, Swarm, Trail, beam, screen, voxels, THREE, type Built, type V3 } from '../kit';
import { bigTime, dotMatrix, now } from '../../sims/draw';

const figureBody = (mat: THREE.Material) => {
  const g = G.group(G.cyl(0.11, 0.5, mat, [0, 0.25, 0], 20, 0.06), G.sph(0.1, mat, [0, 0.62, 0], 20), G.box(0.42, 0.06, 0.08, mat, [0, 0.4, 0]));
  return g;
};

/** Pepper's ghost: a sheet of glass across the stage reflects a lit figure hidden in a pit. */
export function peppersGhost(): Built {
  const root = G.group();
  const black = M.black(), curtain = M.plastic(0x5a1414, 0.9);
  root.add(G.box(2.4, 0.5, 1.5, M.wood(0x3a2a1c), [0, 0.25, -0.1]), G.box(2.4, 1.5, 0.05, black, [0, 1.25, -0.82]), G.box(0.3, 1.5, 1.45, curtain, [-1.05, 1.25, -0.1]), G.box(0.3, 1.5, 1.45, curtain, [1.05, 1.25, -0.1]), G.box(2.4, 0.2, 1.5, curtain, [0, 2.08, -0.1]));
  // the pit in front of the stage, open at the top, hidden from the audience by its front wall
  root.add(G.box(2.4, 0.04, 0.9, black, [0, 0.02, 1.1]), G.box(2.4, 0.62, 0.05, M.wood(0x3a2a1c), [0, 0.31, 1.55]), G.box(0.05, 0.5, 0.9, black, [-1.18, 0.25, 1.1]), G.box(0.05, 0.5, 0.9, black, [1.18, 0.25, 1.1]));
  const actor = figureBody(M.glow(0xeaf6ff, 1.5));
  actor.rotation.x = Math.PI / 2; actor.position.set(0, 0.12, 0.75);
  const lampGlow = G.box(1.6, 0.03, 0.05, M.glow(0xfff2c0, 1.2), [0, 0.42, 1.5]);
  const glass = G.plane(1.8, 1.75, M.glass(0xe6f4ff, 0.1), [0, 1.12, 0.03]); glass.rotation.x = -Math.PI / 4;
  const ghostMat = M.add(null, 0x9fdcff, 0.6);
  const ghost = figureBody(ghostMat); ghost.position.set(0, 0.5, -0.38); ghost.scale.setScalar(1.25);
  // real furniture on the stage, so the ghost has something to stand behind
  root.add(actor, lampGlow, glass, ghost, G.box(0.3, 0.3, 0.3, M.wood(), [0.5, 0.65, -0.45]), G.box(0.3, 0.4, 0.04, M.wood(), [0.5, 1.0, -0.6]));
  return {
    root, inDark: 'better', glow: 0x9fdcff, view: [20, 12],
    update: ({ t, lights }) => {
      const sway = Math.sin(t * 0.8) * 0.35;
      actor.position.x = sway; ghost.position.x = sway;
      ghost.rotation.y = Math.sin(t * 0.5) * 0.3;
      ghostMat.opacity = 0.75 - 0.6 * lights; // a reflection only shows against a dark stage
    },
  };
}

/** Fog screen: a thin sheet of fog held flat by air curtains, lit from behind by a projector. You can walk through it. */
export function fogScreen(): Built {
  const root = G.group();
  const dark = M.dark();
  root.add(G.box(2.3, 0.24, 0.42, dark, [0, 2.0, 0]), G.box(0.08, 1.9, 0.08, M.steel(), [-1.08, 0.95, 0]), G.box(0.08, 1.9, 0.08, M.steel(), [1.08, 0.95, 0]), G.box(2.3, 0.04, 0.5, dark, [0, 0.02, 0]));
  const fog = screen(128, 128), img = screen(512, 448);
  const fogMat = new THREE.MeshStandardMaterial({ map: fog.tex, transparent: true, opacity: 0.55, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  const imgMat = M.add(img, 0xffffff, 0.9);
  root.add(G.plane(1.95, 1.84, fogMat, [0, 0.96, 0]), G.plane(1.95, 1.84, imgMat, [0, 0.96, 0.004]));
  const proj = G.group(G.rbox(0.5, 0.2, 0.4, 0.03, M.plastic(0x232528, 0.5)), G.plane(0.1, 0.1, M.glow(0xffffff, 2.5), [0, 0, 0.205]));
  proj.position.set(0, 0.9, -1.6);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 1.5, 32, 1, true), M.add(null, 0xffffff, 0.05));
  cone.rotation.x = -Math.PI / 2; cone.position.set(0, 0.92, -0.7);
  root.add(proj, cone, G.box(0.06, 0.8, 0.06, M.steel(), [0, 0.4, -1.6]), G.box(0.5, 0.03, 0.4, M.steel(), [0, 0.015, -1.6]));
  return {
    root, inDark: 'better', glow: 0xcfe8ff, view: [22, 10], surface: img.canvas,
    update: ({ t, lights }) => {
      const f = fog.ctx;
      f.clearRect(0, 0, 128, 128);
      for (let x = 0; x < 128; x += 2) {
        const a = 0.42 + 0.22 * Math.sin(x * 0.31 + t * 1.7) + 0.16 * Math.sin(x * 0.83 - t * 2.6);
        const g = f.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, `rgba(255,255,255,${a * 0.45})`);
        f.fillStyle = g; f.fillRect(x, 0, 2, 128);
      }
      fog.tex.needsUpdate = true;
      const c = img.ctx;
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 448);
      bigTime(c, 512, 448, now().hhmmss, '#dff1ff', 800, 0.36);
      // turbulence smears the picture more the further the fog has fallen
      c.fillStyle = 'rgba(0,0,0,.55)';
      for (let x = 0; x < 512; x += 9) { const h = 40 + 30 * Math.sin(x * 0.2 + t * 3); c.fillRect(x + 4 * Math.sin(t * 2 + x), 448 - h * 3, 3, h * 3); }
      img.tex.needsUpdate = true;
      imgMat.opacity = 1 - 0.8 * lights;
      (cone.material as THREE.MeshBasicMaterial).opacity = 0.07 - 0.05 * lights;
    },
  };
}

/** Persistence of vision: one bar of LEDs, spun fast enough that the eye fills in the disc. */
export function pov(): Built {
  const root = G.group();
  root.add(G.cyl(0.6, 0.06, M.dark(), [0, 0.03, -0.25], 40), G.box(0.1, 1.25, 0.1, M.steel(), [0, 0.65, -0.25]));
  const hub = G.cyl(0.13, 0.26, M.dark(), [0, 1.25, -0.1], 28); hub.rotation.x = Math.PI / 2;
  const rotor = G.group(); rotor.position.set(0, 1.25, 0.05);
  const armMat = M.plastic(0x1a1b1d, 0.5); armMat.transparent = true;
  const ledMat = M.glow(0x9fe0ff, 2);
  for (const s of [1, -1]) {
    rotor.add(G.box(0.07, 0.98, 0.015, armMat, [0, s * 0.5, 0]));
    for (let i = 0; i < 18; i++) rotor.add(G.sph(0.016, ledMat, [0, s * (0.08 + i * 0.051), 0.012], 8));
  }
  const s = screen(512, 512);
  const imgMat = M.add(s, 0xffffff, 0);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 64), imgMat); disc.position.set(0, 1.25, 0.062);
  root.add(hub, rotor, disc);
  const c = s.ctx;
  let angle = 0, last = 0;
  return {
    root, inDark: 'glows', glow: 0x7fd0ff, view: [16, 6], surface: s.canvas,
    update: ({ t }) => {
      const dt = Math.min(0.1, t - last); last = t;
      // spin up, hold, spin down: at low speed you can see it is only a bar
      const u = (t + 3.2) % 14;
      const speed = u < 2 ? 0.12 : u < 4 ? 0.12 + ((u - 2) / 2) * 0.88 : u < 12 ? 1 : 1 - ((u - 12) / 2) * 0.88;
      angle += dt * speed * 42; rotor.rotation.z = angle;
      const k = Math.max(0, (speed - 0.35) / 0.65);
      imgMat.opacity = k; armMat.opacity = 1 - 0.8 * k;
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
      c.strokeStyle = '#59c8ff'; c.lineWidth = 6;
      for (const r of [236, 150]) { c.beginPath(); c.arc(256, 256, r, t * 0.5, t * 0.5 + 5.2); c.stroke(); }
      c.save(); c.translate(0, 176); dotMatrix(c, 512, 160, now().hhmm, '#e4f7ff', null, true, 0.8, 0); c.restore();
      // the picture is made of concentric tracks, one per LED
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 3;
      for (let r = 14; r < 256; r += 13) { c.beginPath(); c.arc(256, 256, r, 0, 7); c.stroke(); }
      s.tex.needsUpdate = true;
    },
  };
}

const helix: V3[] = [];
for (let i = 0; i < 620; i++) {
  const u = i / 620, a = u * Math.PI * 7, y = 0.42 + u * 0.82;
  if (i % 31 < 9) { const k = (i % 31) / 8; helix.push([Math.cos(a) * 0.36 * (1 - 2 * k), y, Math.sin(a) * 0.36 * (1 - 2 * k)]); }
  else helix.push(i % 2 ? [Math.cos(a) * 0.36, y, Math.sin(a) * 0.36] : [-Math.cos(a) * 0.36, y, -Math.sin(a) * 0.36]);
}

/** Swept volume: a screen spins inside a dome and a fast projector lights each point as the screen passes through it. */
export function sweptVolume(): Built {
  const root = G.group();
  const vox = voxels(helix, 0.034);
  const scr = G.plane(1.5, 0.95, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.13, roughness: 1, side: THREE.DoubleSide, depthWrite: false }), [0, 0.83, 0]);
  const dome = G.lathe([[0.9, 0.3], [0.9, 0.75], [0.84, 1.05], [0.66, 1.3], [0.36, 1.46], [0, 1.52]], M.bulb(0xeaf6ff), 56);
  root.add(G.cyl(0.98, 0.3, M.dark(), [0, 0.15, 0], 56), G.cyl(0.9, 0.02, M.black(), [0, 0.31, 0], 56), scr, vox.points, dome, G.cyl(0.05, 0.1, M.steel(), [0, 0.34, 0], 16));
  return {
    root, inDark: 'glows', glow: 0x8fd0ff, view: [24, 14],
    update: ({ t }) => {
      const th = t * 3.2;
      scr.rotation.y = -th;
      const col = new THREE.Color();
      helix.forEach((p, i) => {
        const d = Math.abs(Math.sin(Math.atan2(p[2], p[0]) - th)); // 0 when the screen is passing this point
        const k = 0.22 + 0.78 * Math.exp(-d * 5);
        col.setHSL(0.52 + ((p[1] - 0.4) / 0.85) * 0.3, 0.9, 0.6);
        vox.col.set([col.r * k, col.g * k, col.b * k], i * 3);
      });
      vox.flush();
    },
  };
}

/** Static volume: a stack of liquid crystal sheets. One at a time turns milky and catches its slice of the picture. */
export function staticVolume(): Built {
  const root = G.group();
  const LAYERS = 12, S = 1.3;
  const pts: V3[] = [], layerOf: number[] = [];
  for (let i = 0; i < 900; i++) {
    const a = (i / 900) * Math.PI * 2 * 3, b = (i / 900) * Math.PI * 2 * 2;
    const r = 0.36 + 0.14 * Math.cos(a);
    const z = 0.14 * Math.sin(a) * 3.2;
    const k = Math.max(0, Math.min(LAYERS - 1, Math.round((z / (S * 0.9) + 0.5) * (LAYERS - 1))));
    pts.push([r * Math.cos(b), 0.95 + r * Math.sin(b), (k / (LAYERS - 1) - 0.5) * S * 0.9]); layerOf.push(k);
  }
  const vox = voxels(pts, 0.032);
  const sheets = Array.from({ length: LAYERS }, (_, k) => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, roughness: 1, side: THREE.DoubleSide, depthWrite: false });
    root.add(G.plane(S, S, m, [0, 0.95, (k / (LAYERS - 1) - 0.5) * S * 0.9]));
    return m;
  });
  const fr = M.steel(), h = S / 2 + 0.02;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) root.add(G.rod([sx * h, 0.95 + sy * h, -h], [sx * h, 0.95 + sy * h, h], 0.012, fr, 6));
  for (const sz of [-1, 1]) for (const s2 of [-1, 1]) root.add(G.rod([-h, 0.95 + s2 * h, sz * h], [h, 0.95 + s2 * h, sz * h], 0.012, fr, 6), G.rod([s2 * h, 0.95 - h, sz * h], [s2 * h, 0.95 + h, sz * h], 0.012, fr, 6));
  root.add(vox.points, G.box(S + 0.2, 0.06, S + 1.0, M.dark(), [0, 0.2, -0.4]), G.rbox(0.5, 0.3, 0.4, 0.03, M.plastic(0x232528, 0.5), [0, 0.6, -1.1]), G.box(0.1, 0.3, 0.1, M.dark(), [0, 0.35, -1.1]));
  return {
    root, inDark: 'glows', glow: 0xffb070, view: [32, 12],
    update: ({ t }) => {
      const live = Math.floor(t * 7) % LAYERS; // slowed far down: the real stack cycles every sheet about fifty times a second
      sheets.forEach((m, k) => { m.opacity = k === live ? 0.3 : 0.035; });
      const col = new THREE.Color();
      pts.forEach((_, i) => { const k = layerOf[i] === live ? 1 : 0.3; col.setHSL(0.06 + (layerOf[i] / LAYERS) * 0.12, 1, 0.6); vox.col.set([col.r * k, col.g * k, col.b * k], i * 3); });
      vox.flush();
    },
  };
}

const knot = (cx: number, cy: number, cz: number, s: number) => (u: number): V3 => {
  const a = u * Math.PI * 2;
  return [cx + s * (Math.sin(a) + 2 * Math.sin(2 * a)) / 3, cy + s * (Math.cos(a) - 2 * Math.cos(2 * a)) / 3, cz + s * -Math.sin(3 * a) / 2.4];
};
const rainbow = (u: number): V3 => { const c = new THREE.Color().setHSL(u, 1, 0.6); return [c.r, c.g, c.b]; };

/** Optical trap display: one speck of cellulose held in a laser beam, dragged around and lit in colour as it goes. */
export function opticalTrap(): Built {
  const root = G.group();
  root.add(G.box(2.3, 0.08, 1.4, M.black(), [0, 0.2, 0]));
  for (const x of [-1, 1]) for (const z of [-0.55, 0.55]) root.add(G.cyl(0.06, 0.16, M.rubber(), [x, 0.08, z], 12));
  const laser = G.cyl(0.08, 0.7, M.steel(), [-0.7, 0.42, 0], 20); laser.rotation.z = Math.PI / 2;
  const fold = G.box(0.02, 0.22, 0.22, M.chrome(), [0.25, 0.42, 0]); fold.rotation.z = Math.PI / 4;
  const lens = G.torus(0.14, 0.022, M.dark(), [0.25, 0.72, 0]); lens.rotation.x = Math.PI / 2;
  const glassLens = G.cyl(0.13, 0.03, M.glass(0xd8ecff, 0.3), [0.25, 0.72, 0], 28);
  root.add(laser, fold, lens, glassLens, G.box(0.1, 0.14, 0.1, M.dark(), [-0.7, 0.3, 0]), G.rod([0.42, 0.24, 0], [0.42, 0.72, 0], 0.02, M.steel(), 8), G.rod([0.42, 0.72, 0], [0.38, 0.72, 0], 0.02, M.steel(), 8));
  const rgbBox = G.rbox(0.3, 0.2, 0.3, 0.03, M.dark(), [-0.3, 0.6, -0.5]);
  root.add(rgbBox, G.sph(0.03, M.glow(0xff3020, 2), [-0.25, 0.66, -0.36], 10), G.sph(0.03, M.glow(0x30ff50, 2), [-0.3, 0.6, -0.35], 10), G.sph(0.03, M.glow(0x3060ff, 2), [-0.35, 0.66, -0.36], 10), G.box(0.06, 0.3, 0.06, M.dark(), [-0.3, 0.38, -0.5]));
  const path = knot(0.25, 1.35, 0, 0.42);
  const trail = new Trail(360);
  const speck = G.sph(0.022, M.glow(0xffffff, 3), undefined, 10);
  const b0 = beam(0xa070ff, 0.5), b1 = beam(0xa070ff, 0.5);
  b0.aim([-0.35, 0.42, 0], [0.25, 0.42, 0]);
  root.add(trail.line, speck, b0.line, b1.line);
  return {
    root, inDark: 'better', glow: 0xb090ff, view: [26, 12],
    update: ({ t }) => {
      const ph = (t * 0.35) % 1;
      trail.trace(path, rainbow, ph);
      const p = path(ph);
      speck.position.set(p[0], p[1], p[2]);
      b1.aim([0.25, 0.42, 0], p);
    },
  };
}

/** Acoustic levitation display: ultrasound from two arrays holds a bead in the air and throws it around a figure. */
export function acousticLev(): Built {
  const root = G.group();
  const N = 64;
  for (const [y, flip] of [[0.2, 1], [1.72, -1]] as const) {
    const tr = new Swarm(new THREE.CylinderGeometry(0.058, 0.058, 0.09, 14), M.plastic(0x18191b, 0.4), N);
    const tops = new Swarm(new THREE.CylinderGeometry(0.044, 0.044, 0.012, 14), M.steel(), N);
    for (let i = 0; i < N; i++) { const x = ((i % 8) - 3.5) * 0.15, z = (Math.floor(i / 8) - 3.5) * 0.15; tr.put(i, x, y + flip * 0.085, z); tops.put(i, x, y + flip * 0.135, z); }
    tr.done(); tops.done();
    root.add(tr.mesh, tops.mesh, G.box(1.3, 0.08, 1.3, M.pcb(), [0, y, 0]));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.rod([sx * 0.6, 0.2, sz * 0.6], [sx * 0.6, 1.72, sz * 0.6], 0.02, M.steel(), 8));
  root.add(G.box(1.4, 0.12, 1.4, M.dark(), [0, 0.1, 0]));
  const path = (u: number): V3 => { const a = u * Math.PI * 2; return [0.34 * Math.sin(a), 0.96 + 0.26 * Math.sin(2 * a), 0.34 * Math.cos(a) * Math.cos(a * 0.5 + 0.4)]; };
  const trail = new Trail(320);
  const beadMat = M.glow(0xffffff, 2.6);
  const bead = G.sph(0.03, beadMat, undefined, 12);
  root.add(trail.line, bead);
  return {
    root, inDark: 'better', glow: 0xff9ad0, view: [28, 10],
    update: ({ t }) => {
      const ph = (t * 0.45) % 1;
      trail.trace(path, rainbow, ph);
      const p = path(ph); bead.position.set(p[0], p[1], p[2]);
      beadMat.emissive.setHSL(ph, 1, 0.6);
    },
  };
}

/** Laser plasma: a pulsed laser focused so tightly that the air itself flashes at the focal point. */
export function laserPlasma(): Built {
  const root = G.group();
  root.add(G.box(2.2, 0.06, 1.1, M.black(), [0, 0.03, 0]), G.rbox(1.0, 0.3, 0.4, 0.03, M.plastic(0x2a2c30, 0.5), [-0.5, 0.25, 0]), G.rbox(0.36, 0.36, 0.36, 0.03, M.dark(), [0.45, 0.28, 0]));
  const lens = G.torus(0.2, 0.03, M.dark(), [0.45, 0.62, 0]); lens.rotation.x = Math.PI / 2;
  root.add(lens, G.cyl(0.19, 0.04, M.glass(0xd8ecff, 0.3), [0.45, 0.62, 0], 32), G.rod([0.7, 0.4, 0], [0.7, 0.62, 0], 0.02, M.steel(), 8), G.rod([0.7, 0.62, 0], [0.65, 0.62, 0], 0.02, M.steel(), 8));
  const b = beam(0xff6060, 0.35); b.aim([0, 0.25, 0], [0.3, 0.25, 0]); root.add(b.line);
  // the figure: a small cube drawn corner to corner in points of plasma
  const pts: V3[] = [];
  const corners: V3[] = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) for (let k = 0; k <= 10; k++) {
    const u = k / 10; pts.push([0.45 + (corners[i][0] + (corners[j][0] - corners[i][0]) * u) * 0.24, 1.3 + (corners[i][1] + (corners[j][1] - corners[i][1]) * u) * 0.24, (corners[i][2] + (corners[j][2] - corners[i][2]) * u) * 0.24]);
  }
  const vox = voxels(pts, 0.04);
  const c1 = beam(0xa8c8ff, 0.5), c2 = beam(0xa8c8ff, 0.5);
  root.add(vox.points, c1.line, c2.line);
  const spin = new THREE.Matrix4();
  return {
    root, inDark: 'better', glow: 0xa8c8ff, view: [24, 10],
    update: ({ t }) => {
      vox.points.rotation.y = t * 0.4; vox.points.position.set(0.45 - 0.45 * Math.cos(t * 0.4), 0, 0.45 * Math.sin(t * 0.4));
      // one voxel exists at a time; the rest are afterimage
      const hot = Math.floor(t * 240) % pts.length;
      for (let i = 0; i < pts.length; i++) { const age = (hot - i + pts.length) % pts.length, k = 0.3 + 0.7 * Math.exp(-age / 14); vox.col.set([0.62 * k, 0.78 * k, k], i * 3); }
      vox.flush();
      spin.makeRotationY(t * 0.4);
      const p = new THREE.Vector3(pts[hot][0] - 0.45, pts[hot][1], pts[hot][2]).applyMatrix4(spin);
      c1.aim([0.29, 0.62, 0], [p.x + 0.45, p.y, p.z]); c2.aim([0.61, 0.62, 0], [p.x + 0.45, p.y, p.z]);
    },
  };
}
