import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE } from './kit';

/**
 * The room a piece is shown in: walls, floor, the stand it sits on and the light that falls on it.
 * `works` is the original hall. The other three are studies for a colder, Nordic house:
 * cast concrete, white paint, steel, and one considered source of light each.
 */
export type Look = 'works' | 'betong' | 'tehdas' | 'ljus';
export const LOOKS: { id: Look; name: string }[] = [
  { id: 'works', name: 'Works' }, { id: 'betong', name: 'Betong' }, { id: 'tehdas', name: 'Tehdas' }, { id: 'ljus', name: 'Ljus' },
];

export interface Room {
  group: THREE.Group;
  /** Hall lights, 0 to 1. */
  light: (L: number, scene: THREE.Scene) => void;
  /** Whatever in the room carries the hall's colour and number. */
  hall: (colour: string, no?: number) => void;
  /** Height the camera looks at, and how far back it stands compared with the original hall. */
  targetY: number;
  reach: number;
  /** A room with real walls: the camera can pass through them, so nothing turns by itself. */
  walled: boolean;
  /** Told where the camera is, so that what hangs on a wall can go when the wall is looked through from behind. */
  seenFrom?: (camera: THREE.Camera) => void;
}

/** Top of every stand. Pieces are set down here. */
export const TOP = 0.22;
const FLOOR = -0.95, BACK = -1.5;

// ---------- surfaces, drawn rather than photographed ----------

type Ctx = CanvasRenderingContext2D;
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const sheet = (w: number, h: number): [HTMLCanvasElement, Ctx] => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')!]; };
const grey = (v: number, a = 1) => `rgba(${v},${v},${v},${a})`;

/** Random greys at a given coarseness, blown up smooth and laid over what is there: cloud, mottle, grain. */
function mottle(c: Ctx, w: number, h: number, r: () => number, cells: number[], alpha: number, amp = 44, mode: GlobalCompositeOperation = 'overlay', stretch = 1): void {
  for (const n of cells) {
    const cw = Math.max(2, Math.round(n / stretch)), ch = Math.max(2, Math.round((n * h) / w));
    const [s, sc] = sheet(cw, ch), img = sc.createImageData(cw, ch);
    for (let i = 0; i < cw * ch; i++) { const v = 128 + (r() - 0.5) * 2 * amp; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
    sc.putImageData(img, 0, 0);
    c.save(); c.globalAlpha = alpha; c.globalCompositeOperation = mode; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(s, 0, 0, w, h); c.restore();
  }
}

function tex(canvas: HTMLCanvasElement, colour = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  if (colour) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
  t.anisotropy = 8;
  return t;
}

interface Skin { map: HTMLCanvasElement; bump: HTMLCanvasElement; rough?: HTMLCanvasElement }

/** In-situ concrete cast against boards: board lines, grain, tie holes, the stains below them, and bug holes. */
function castConcrete(w: number, h: number, metres: number, seed: number, boards = 0.14, base = 150): Skin {
  const r = rng(seed), ppm = w / metres;
  const [map, c] = sheet(w, h), [bump, b] = sheet(w, h);
  c.fillStyle = `rgb(${base - 3},${base},${base - 1})`; c.fillRect(0, 0, w, h);
  b.fillStyle = grey(128); b.fillRect(0, 0, w, h);
  mottle(c, w, h, r, [4, 9, 22], 0.5, 26); mottle(c, w, h, r, [60, 160, w / 3], 0.45, 30);
  mottle(b, w, h, r, [40, 140], 0.4, 50);
  if (boards > 0) {
    const [g, gc] = sheet(256, 24), gi = gc.createImageData(256, 24);
    for (let i = 0; i < 256 * 24; i++) { const v = 70 + r() * 120; gi.data[i * 4] = gi.data[i * 4 + 1] = gi.data[i * 4 + 2] = v; gi.data[i * 4 + 3] = 255; }
    gc.putImageData(gi, 0, 0);
    for (let y = 0; y < h; y += boards * ppm) {
      const bh = boards * ppm, tone = r();
      c.fillStyle = tone > 0.5 ? `rgba(255,255,255,${(tone - 0.5) * 0.09})` : `rgba(0,0,0,${(0.5 - tone) * 0.11})`; c.fillRect(0, y, w, bh);
      // the grain of the board, printed into the face
      for (const ctx of [c, b]) { ctx.save(); ctx.globalAlpha = ctx === c ? 0.2 : 0.42; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(g, r() * 100, 0, 150, 24, 0, y, w, bh); ctx.restore(); }
      c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, y, w, 1.2); c.fillStyle = 'rgba(255,255,255,.13)'; c.fillRect(0, y + 1.2, w, 1.2);
      b.fillStyle = grey(40, 0.75); b.fillRect(0, y, w, 1.6); b.fillStyle = grey(220, 0.5); b.fillRect(0, y + 1.6, w, 1.4);
      for (let x = r() * 3 * ppm; x < w; x += (2.2 + r() * 2.4) * ppm) { c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(x, y, 1.2, bh); b.fillStyle = grey(50, 0.6); b.fillRect(x, y, 1.5, bh); }
    }
  } else {
    // smooth shutter: only the seams between panels
    for (let x = 1.2 * ppm; x < w; x += 1.2 * ppm) { c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(x, 0, 1.2, h); b.fillStyle = grey(60, 0.6); b.fillRect(x, 0, 1.6, h); }
  }
  // tie holes on a grid, and what the rain of fifty years would have done under them if this were outdoors
  const tx = 0.9 * ppm, ty = 0.7 * ppm, hr = Math.max(2.2, 0.018 * ppm);
  for (let y = ty * 0.55; y < h; y += ty) for (let x = tx * 0.5; x < w; x += tx) {
    const drip = c.createLinearGradient(0, y, 0, y + ty * (0.5 + r() * 0.5));
    drip.addColorStop(0, 'rgba(30,34,34,.07)'); drip.addColorStop(1, 'rgba(30,34,34,0)');
    c.fillStyle = drip; c.fillRect(x - hr * (0.8 + r()), y, hr * (1.6 + r() * 2), ty);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(x, y, hr * 1.5, 0, 7); c.fill();
    c.fillStyle = 'rgba(28,30,30,.82)'; c.beginPath(); c.arc(x, y, hr, 0, 7); c.fill();
    b.fillStyle = grey(10); b.beginPath(); b.arc(x, y, hr, 0, 7); b.fill();
  }
  for (let i = 0; i < (w * h) / 900; i++) { const x = r() * w, y = r() * h, pr = 0.5 + r() * r() * 2.2; c.fillStyle = `rgba(40,42,42,${0.25 + r() * 0.4})`; c.beginPath(); c.arc(x, y, pr, 0, 7); c.fill(); b.fillStyle = grey(30, 0.9); b.beginPath(); b.arc(x, y, pr, 0, 7); b.fill(); }
  mottle(b, w, h, r, [w / 2.5], 0.3, 70);
  return { map, bump };
}

/** A wall under white paint. What is under the paint (block, brick or plaster) still shows in a raking light. */
function painted(w: number, h: number, metres: number, seed: number, under: 'block' | 'brick' | 'plaster'): Skin {
  const r = rng(seed), ppm = w / metres;
  const [map, c] = sheet(w, h), [bump, b] = sheet(w, h);
  c.fillStyle = '#e6e8e7'; c.fillRect(0, 0, w, h);
  b.fillStyle = grey(150); b.fillRect(0, 0, w, h);
  mottle(c, w, h, r, [3, 9], 0.3, 14);
  // roller lanes
  for (let x = 0; x < w;) { const lane = (0.2 + r() * 0.12) * ppm; c.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * 0.05})` : `rgba(0,0,0,${r() * 0.025})`; c.fillRect(x, 0, lane, h); x += lane; }
  const joint = (x: number, y: number, jw: number, jh: number) => {
    for (const [grow, a] of [[2.4, 0.22], [1.2, 0.5], [0, 0.95]] as const) { b.fillStyle = grey(52, a); b.fillRect(x - grow, y - grow, jw + grow * 2, jh + grow * 2); }
    c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(x, y, jw, jh);
  };
  if (under !== 'plaster') {
    const uw = (under === 'block' ? 0.6 : 0.225) * ppm, uh = (under === 'block' ? 0.2 : 0.075) * ppm, j = Math.max(1.6, 0.011 * ppm);
    let row = 0;
    for (let y = h; y > -uh; y -= uh, row++) {
      const off = row % 2 ? uw / 2 : 0;
      for (let x = -off; x < w; x += uw) {
        // no two units sit quite flush, and each took the paint a little differently
        const lift = 136 + r() * 34, tone = r();
        b.fillStyle = grey(lift); b.fillRect(x, y - uh, uw, uh);
        c.fillStyle = tone > 0.5 ? `rgba(255,255,255,${(tone - 0.5) * 0.07})` : `rgba(0,0,0,${(0.5 - tone) * 0.045})`; c.fillRect(x, y - uh, uw, uh);
        joint(x, y - uh, j, uh);
      }
      joint(0, y - j / 2, w, j);
    }
    mottle(b, w, h, r, [w / 2.2], under === 'brick' ? 0.6 : 0.4, 80);
  } else {
    mottle(b, w, h, r, [6, 20, 70], 0.5, 40); mottle(b, w, h, r, [w / 3], 0.3, 60);
    // the sweep of the float
    for (let i = 0; i < 60; i++) { b.strokeStyle = grey(r() > 0.5 ? 190 : 110, 0.07); b.lineWidth = 6 + r() * 20; b.beginPath(); b.arc(r() * w, r() * h, (0.4 + r() * 0.9) * ppm, r() * 6, r() * 6 + 1.6); b.stroke(); }
  }
  // scuffs and the grey that creeps up from a floor that gets mopped
  const grime = c.createLinearGradient(0, h - 0.35 * ppm, 0, h); grime.addColorStop(0, 'rgba(60,64,64,0)'); grime.addColorStop(1, 'rgba(60,64,64,.1)');
  c.fillStyle = grime; c.fillRect(0, h - 0.35 * ppm, w, 0.35 * ppm);
  for (let i = 0; i < 14; i++) { c.strokeStyle = `rgba(50,52,54,${0.03 + r() * 0.05})`; c.lineWidth = 1 + r() * 3; const x = r() * w, y = h - (0.1 + r() * 1.0) * ppm; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.3) * 0.5 * ppm, y + (r() - 0.5) * 6); c.stroke(); }
  return { map, bump };
}

/** A power-floated concrete floor: clouded, burnished in patches, cut into bays. */
function slab(w: number, metres: number, seed: number, base = 132, chips = false): Skin {
  const r = rng(seed), ppm = w / metres;
  const [map, c] = sheet(w, w), [bump, b] = sheet(w, w), [rough, q] = sheet(w / 2, w / 2);
  c.fillStyle = `rgb(${base - 2},${base},${base})`; c.fillRect(0, 0, w, w);
  b.fillStyle = grey(128); b.fillRect(0, 0, w, w);
  q.fillStyle = grey(chips ? 132 : 158); q.fillRect(0, 0, w / 2, w / 2);
  mottle(c, w, w, r, [3, 7, 16, 40], 0.55, 30); mottle(c, w, w, r, [120, w / 3], 0.4, 26);
  mottle(q, w / 2, w / 2, r, [4, 10, 26], 0.7, 30);
  // the arcs the trowel left
  for (let i = 0; i < 90; i++) { c.strokeStyle = r() > 0.5 ? `rgba(255,255,255,${0.015 + r() * 0.03})` : `rgba(0,0,0,${0.015 + r() * 0.035})`; c.lineWidth = (0.06 + r() * 0.3) * ppm; c.beginPath(); c.arc(r() * w, r() * w, (0.5 + r() * 1.4) * ppm, r() * 6, r() * 6 + 1 + r() * 1.5); c.stroke(); }
  if (chips) for (let i = 0; i < w * 7; i++) { const v = r(); c.fillStyle = v > 0.6 ? `rgba(250,250,246,${0.3 + r() * 0.4})` : v > 0.25 ? `rgba(70,74,76,${0.25 + r() * 0.4})` : `rgba(150,128,104,${0.3 + r() * 0.3})`; const s = 0.8 + r() * r() * 3.4; c.fillRect(r() * w, r() * w, s, s * (0.6 + r() * 0.8)); }
  mottle(b, w, w, r, [w / 2.5], 0.2, 60);
  // saw cuts
  const bay = 3 * ppm;
  for (let p = bay / 2; p < w; p += bay) for (const upright of [true, false]) {
    for (const [ctx, k] of [[c, 1], [b, 1], [q, 0.5]] as const) { ctx.fillStyle = ctx === q ? grey(235) : ctx === b ? grey(20) : 'rgba(22,24,24,.7)'; if (upright) ctx.fillRect(p * k - 1.2 * k, 0, 2.4 * k, w * k); else ctx.fillRect(0, p * k - 1.2 * k, w * k, 2.4 * k); }
    c.fillStyle = 'rgba(255,255,255,.1)'; if (upright) c.fillRect(p + 1.3, 0, 1.2, w); else c.fillRect(0, p + 1.3, w, 1.2);
  }
  // hairline cracks, and a few things that were spilled
  for (let i = 0; i < 3; i++) { let x = r() * w, y = r() * w; c.strokeStyle = 'rgba(30,32,32,.3)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 40; k++) { x += (r() - 0.3) * 26; y += (r() - 0.5) * 22; c.lineTo(x, y); } c.stroke(); }
  for (let i = 0; i < 9; i++) { const x = r() * w, y = r() * w, rad = (0.1 + r() * 0.3) * ppm, g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, 'rgba(40,44,44,.1)'); g.addColorStop(1, 'rgba(40,44,44,0)'); c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  return { map, bump, rough };
}

/** Wear the surface with the skin. `across` and `up` are how many metres of wall one copy of the picture covers. */
function wear(skin: Skin, size: [number, number], covers: [number, number], o: { bump?: number; rough?: number; metal?: number; tint?: number; fromFloor?: boolean } = {}): THREE.MeshStandardMaterial {
  const rep: [number, number] = [size[0] / covers[0], size[1] / covers[1]];
  const fit = (canvas: HTMLCanvasElement, colour: boolean) => { const t = tex(canvas, colour); t.repeat.set(rep[0], rep[1]); t.offset.set(0.5 * (1 - rep[0]), o.fromFloor ? 0 : 0.5 * (1 - rep[1])); return t; };
  return new THREE.MeshStandardMaterial({
    map: fit(skin.map, true), bumpMap: fit(skin.bump, false), bumpScale: o.bump ?? 2.4, roughness: o.rough ?? 0.93, metalness: o.metal ?? 0,
    roughnessMap: skin.rough ? fit(skin.rough, false) : null, color: o.tint ?? 0xffffff,
  });
}

function wall(mat: THREE.Material, w: number, h: number, x: number, z: number, turn: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, FLOOR + h / 2, z); m.rotation.y = turn; m.receiveShadow = true;
  return m;
}

/** The box every Nordic study starts from: a floor, a picture wall behind the stand and three walls you rarely see. */
function shell(g: THREE.Group, back: THREE.Material, others: THREE.Material, floor: THREE.Material): void {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), floor);
  f.rotation.x = -Math.PI / 2; f.position.set(0, FLOOR, 2); f.receiveShadow = true;
  g.add(f, wall(back, 16, 7, 0, BACK, 0), wall(others, 16, 7, -8, 2, Math.PI / 2), wall(others, 16, 7, 8, 2, -Math.PI / 2), wall(others, 16, 7, 0, 10, Math.PI));
  // a shadow gap where the wall meets the floor
  const gap = new THREE.Mesh(new THREE.BoxGeometry(16, 0.045, 0.02), new THREE.MeshStandardMaterial({ color: 0x0c0d0d, roughness: 1 }));
  gap.position.set(0, FLOOR + 0.0225, BACK + 0.011);
  g.add(gap, contact(18, 2.6, 0, BACK + 0.3, 0.3, 0.42));
}

/** The darkening where two surfaces meet, which a rendered room otherwise lacks: a soft-edged patch laid on the floor. */
function contact(w: number, d: number, x: number, z: number, strength: number, edge = 0.3): THREE.Mesh {
  const [small, sc] = sheet(32, 32), [big, bc] = sheet(128, 128), m = Math.round(16 * edge);
  sc.fillStyle = '#000'; sc.fillRect(m, m, 32 - 2 * m, 32 - 2 * m);
  bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high'; bc.drawImage(small, 0, 0, 128, 128);
  const t = new THREE.CanvasTexture(big);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: strength, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  p.rotation.x = -Math.PI / 2; p.position.set(x, FLOOR + 0.0015, z);
  return p;
}

const steel = (c = 0x33373b, rough = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0.35 });
const solid = (m: THREE.Mesh): THREE.Mesh => { m.castShadow = m.receiveShadow = true; return m; };

/** Surface wiring: galvanised conduit clipped to the wall, dropping to a socket. */
function conduit(g: THREE.Group, y: number, boxX: number): THREE.Group {
  const out = new THREE.Group();
  const zinc = new THREE.MeshStandardMaterial({ color: 0xa9aeb1, roughness: 0.42, metalness: 0.75 });
  const run = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 16, 12), zinc)); run.rotation.z = Math.PI / 2; run.position.set(0, y, BACK + 0.03);
  const drop = solid(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, y - FLOOR - 0.42, 12), zinc)); drop.position.set(boxX, (y + FLOOR + 0.42) / 2, BACK + 0.03);
  const box = solid(new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.16, 0.07, 2, 0.012), new THREE.MeshStandardMaterial({ color: 0x8f9497, roughness: 0.55, metalness: 0.4 }))); box.position.set(boxX, FLOOR + 0.36, BACK + 0.036);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), new THREE.MeshStandardMaterial({ color: 0x1a1c1d, roughness: 0.6 })); face.position.set(boxX, FLOOR + 0.36, BACK + 0.072);
  out.add(run, drop, box, face);
  for (let x = -7.6; x < 8; x += 0.8) { const clip = solid(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.036), zinc)); clip.position.set(x, y, BACK + 0.02); out.add(clip); }
  g.add(out);
  return out;
}

const behindWall = (camera: THREE.Camera, root: THREE.Object3D): boolean => root.worldToLocal(camera.position.clone()).z < BACK + 0.05;

function spot(colour: number, from: [number, number, number], to: [number, number, number], angle: number, penumbra: number, soft: number, size = 2048): THREE.SpotLight {
  const s = new THREE.SpotLight(colour, 0, 0, angle, penumbra, 0);
  s.position.set(...from); s.target.position.set(...to);
  s.castShadow = true; s.shadow.mapSize.set(size, size); s.shadow.radius = soft; s.shadow.blurSamples = 16;
  s.shadow.bias = -0.0004; s.shadow.normalBias = 0.03; s.shadow.camera.near = 2; s.shadow.camera.far = 30;
  return s;
}

/** A picture of what the light comes through, for a lamp to throw: window bars, or a long slot. */
function gobo(draw: (c: Ctx) => void): THREE.CanvasTexture {
  const [small, sc] = sheet(96, 96), [big, bc] = sheet(512, 512);
  sc.fillStyle = '#000'; sc.fillRect(0, 0, 96, 96); draw(sc);
  bc.imageSmoothingEnabled = true; bc.imageSmoothingQuality = 'high'; bc.drawImage(small, 0, 0, 512, 512);
  const t = new THREE.CanvasTexture(big); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- the rooms ----------

/** Betong: board-marked concrete, a white-painted block wall, a cast block for a stand, cold daylight through a factory window. */
function betong(): Room {
  const g = new THREE.Group();
  const conc = castConcrete(1024, 512, 9, 11), white = painted(2048, 1024, 9, 12, 'block'), ground = slab(2048, 8, 13);
  shell(g, wear(white, [16, 7], [9, 4.5], { bump: 3, rough: 0.9, fromFloor: true }), wear(conc, [16, 7], [9, 4.5], { fromFloor: true }), wear(ground, [24, 24], [8, 8], { bump: 1.2, rough: 1 }));
  // the stand: one cast block, a steel plate floating a finger's width above it
  const cast = castConcrete(1024, 512, 2.6, 21, 0, 166);
  const block = solid(new THREE.Mesh(new RoundedBoxGeometry(2.2, TOP - 0.03 - FLOOR, 2.2, 2, 0.018), wear(cast, [1, 1], [1, 1], { bump: 2 })));
  block.position.y = (TOP - 0.03 + FLOOR) / 2;
  const spacer = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.014, 2.0), new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1 })); spacer.position.y = TOP - 0.023;
  const plate = solid(new THREE.Mesh(new RoundedBoxGeometry(2.1, 0.016, 2.1, 1, 0.004), steel())); plate.position.y = TOP - 0.008;
  // the hall number, stencilled on the wall the way a bay is numbered in a works
  const [nc, nx] = sheet(512, 640);
  const numeral = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(nc), transparent: true, roughness: 0.95, depthWrite: false }));
  (numeral.material.map as THREE.Texture).colorSpace = THREE.SRGBColorSpace;
  numeral.position.set(-2.45, 1.3, BACK + 0.004); numeral.receiveShadow = true;
  g.add(block, spacer, plate, numeral, contact(3.3, 3.3, 0, 0, 0.5));
  const wiring = conduit(g, 2.62, 3.3);
  // light: a tall window out of sight to the left
  const sun = spot(0xf6f8ff, [-7.5, 7.6, 6.2], [0.35, 0.3, -0.7], 0.42, 0.25, 5);
  sun.map = gobo((c) => { c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c.fillRect(19 + i * 20, 18 + j * 21, 17, 18); });
  const sky = new THREE.HemisphereLight(0xe3ecf6, 0x7e827f, 0), bounce = new THREE.DirectionalLight(0xe8eef6, 0);
  bounce.position.set(5, 2.5, 6);
  g.add(sun, sun.target, sky, bounce);
  const r = rng(5);
  return {
    group: g, targetY: 0.42, reach: 1.3, walled: true,
    seenFrom: (camera) => { wiring.visible = numeral.visible = !behindWall(camera, g); },
    light: (L, scene) => { sun.intensity = 3.9 * L; sky.intensity = 0.02 + 0.44 * L; bounce.intensity = 0.3 * L; scene.environmentIntensity = 0.03 + 0.3 * L; },
    hall: (_colour, no) => {
      nx.clearRect(0, 0, 512, 640);
      if (!no) { (numeral.material.map as THREE.Texture).needsUpdate = true; return; }
      nx.fillStyle = '#2b2e30'; nx.font = '800 700px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'; nx.textAlign = 'center'; nx.textBaseline = 'alphabetic';
      nx.fillText(String(no), 256, 560);
      // the bridges of the stencil, and paint that has started to let go
      nx.globalCompositeOperation = 'destination-out';
      nx.fillRect(0, 300, 512, 12); nx.fillRect(250, 0, 12, 640);
      for (let i = 0; i < 2600; i++) { nx.fillStyle = `rgba(0,0,0,${r() * 0.7})`; nx.fillRect(r() * 512, r() * 640, 1 + r() * 3, 1 + r() * 2); }
      nx.globalCompositeOperation = 'source-over';
      (numeral.material.map as THREE.Texture).needsUpdate = true;
    },
  };
}

/** Tehdas: a mill wall painted white over the brick, a ground floor, a steel table on a concrete foot, one lamp on a track. */
function tehdas(): Room {
  const g = new THREE.Group();
  const brick = painted(2048, 1024, 7, 31, 'brick'), conc = castConcrete(1024, 512, 9, 32, 0, 142), ground = slab(2048, 8, 33, 118);
  shell(g, wear(brick, [16, 7], [7, 3.5], { bump: 5, rough: 0.88, fromFloor: true }), wear(conc, [16, 7], [9, 4.5], { fromFloor: true, tint: 0xd9dcdc }), wear(ground, [24, 24], [8, 8], { bump: 1.2, rough: 0.82 }));
  // the stand: a concrete foot, a square steel post, a round steel table
  const cast = castConcrete(512, 512, 1.6, 41, 0, 160);
  const foot = solid(new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.2, 1.5, 2, 0.018), wear(cast, [1, 1], [1, 1], { bump: 2 }))); foot.position.y = FLOOR + 0.1;
  // the post is the one painted thing in the room: it takes the colour of the hall
  const coat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.45, metalness: 0.1 });
  const post = solid(new THREE.Mesh(new RoundedBoxGeometry(0.16, TOP - 0.06 - (FLOOR + 0.2), 0.16, 1, 0.012), coat)); post.position.y = (TOP - 0.06 + FLOOR + 0.2) / 2;
  const shoe = solid(new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.02, 0.4, 1, 0.004), steel())); shoe.position.y = FLOOR + 0.21;
  const table = solid(new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.03, 96), steel(0x303438, 0.46))); table.position.y = TOP - 0.015;
  g.add(foot, post, shoe, table, contact(2.3, 2.3, 0, 0, 0.5));
  for (const a of [0, Math.PI / 2]) { const rib = solid(new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.02), steel())); rib.position.y = TOP - 0.055; rib.rotation.y = a + Math.PI / 4; g.add(rib); }
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) { const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 6), steel(0x8a8f94, 0.3)); bolt.position.set(x * 0.28, FLOOR + 0.226, z * 0.28); g.add(bolt); }
  const wiring = conduit(g, FLOOR + 0.52, -3.4);
  // light: a single spot on a track, a pool on wall and floor, and not much else
  const lamp = spot(0xf2f6ff, [1.9, 7.4, 4.6], [0, 0.35, -0.6], 0.3, 0.42, 6);
  const side = new THREE.DirectionalLight(0xdfe8f4, 0); side.position.set(-6, 3, 3);
  const sky = new THREE.HemisphereLight(0xdfe6ee, 0x6f7374, 0);
  g.add(lamp, lamp.target, side, sky);
  return {
    group: g, targetY: 0.42, reach: 1.3, walled: true,
    seenFrom: (camera) => { wiring.visible = !behindWall(camera, g); },
    light: (L, scene) => { lamp.intensity = 5.2 * L; side.intensity = 0.22 * L; sky.intensity = 0.02 + 0.2 * L; scene.environmentIntensity = 0.03 + 0.2 * L; },
    hall: (colour) => { coat.color.set(colour); },
  };
}

/** Ljus: plaster, a pale ground floor, one long cast bench along the wall, and daylight falling down the wall from a slot in the roof. */
function ljus(): Room {
  const g = new THREE.Group();
  const plaster = painted(2048, 1024, 9, 51, 'plaster'), ground = slab(2048, 8, 53, 176, true);
  const white = wear(plaster, [16, 7], [9, 4.5], { bump: 4, rough: 0.94, fromFloor: true });
  shell(g, white, wear(plaster, [16, 7], [9, 4.5], { bump: 3, fromFloor: true, tint: 0xe9ecec }), wear(ground, [24, 24], [8, 8], { bump: 0.8, rough: 0.7 }));
  // the stand: a bench cast in one length, standing off the floor on a recessed foot
  const cast = castConcrete(2048, 512, 9.4, 61, 0, 176);
  const bench = solid(new THREE.Mesh(new RoundedBoxGeometry(9.4, TOP - (FLOOR + 0.07), 2.3, 2, 0.018), wear(cast, [1, 1], [1, 1], { bump: 1.6, rough: 0.8 })));
  bench.position.set(0, (TOP + FLOOR + 0.07) / 2, -0.33);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(9.1, 0.07, 2.0), new THREE.MeshStandardMaterial({ color: 0x0c0d0d, roughness: 1 })); foot.position.set(0, FLOOR + 0.035, -0.33);
  // where the piece stands: a square of steel let flush into the top, edged with the colour of the hall
  const inlay = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 2.04), steel(0x33373b, 0.5)); inlay.rotation.x = -Math.PI / 2; inlay.position.y = TOP + 0.0012; inlay.receiveShadow = true;
  const edge = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 0.014), edge); mark.position.set(0, TOP - 0.07, 0.821); mark.receiveShadow = true;
  g.add(bench, foot, inlay, mark, contact(10.2, 3.0, 0, -0.33, 0.45, 0.2));
  // light: a roof slot just in front of the wall
  const slot = spot(0xf4f7ff, [0, 8.6, 0.25], [0, -0.2, -1.2], 0.66, 0.5, 8);
  slot.map = gobo((c) => { const gr = c.createLinearGradient(0, 30, 0, 66); gr.addColorStop(0, '#000'); gr.addColorStop(0.25, '#fff'); gr.addColorStop(0.75, '#fff'); gr.addColorStop(1, '#000'); c.fillStyle = gr; c.fillRect(2, 30, 92, 36); });
  const front = new THREE.DirectionalLight(0xeef2f8, 0); front.position.set(1.5, 5, 7);
  const sky = new THREE.HemisphereLight(0xeef3f8, 0xb9bbb6, 0);
  g.add(slot, slot.target, front, sky);
  return {
    group: g, targetY: 0.42, reach: 1.3, walled: true,
    light: (L, scene) => { slot.intensity = 4.6 * L; front.intensity = 0.45 * L; sky.intensity = 0.02 + 0.36 * L; scene.environmentIntensity = 0.03 + 0.3 * L; },
    hall: (colour) => { edge.color.set(colour); },
  };
}

/** The original hall: a steel turntable in front of a drum of whitewashed wall with a painted dado. */
function works(): Room {
  const g = new THREE.Group();
  const WASH = '#e4e5df';
  const [wc, wx] = sheet(4, 512);
  const wallTex = new THREE.CanvasTexture(wc); wallTex.colorSpace = THREE.SRGBColorSpace;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 10, 72, 1, true), new THREE.MeshStandardMaterial({ map: wallTex, side: THREE.BackSide, roughness: 0.95 }));
  drum.position.y = 5;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 72), new THREE.MeshStandardMaterial({ color: 0xc4c6be, roughness: 0.82 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const plinth = solid(new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.16, TOP, 96), new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.42, metalness: 0.6 })));
  plinth.position.y = TOP / 2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.012, 10, 128), new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: 0.3, metalness: 0.9 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = TOP;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8d8f89, 0), key = new THREE.DirectionalLight(0xfff3e2, 0), fill = new THREE.DirectionalLight(0xdfe8ff, 0);
  key.position.set(3.4, 6, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 3;
  const sc = key.shadow.camera;
  sc.left = -2.4; sc.right = 2.4; sc.top = 2.6; sc.bottom = -2.2; sc.near = 1; sc.far = 16;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  fill.position.set(-4.5, 2.6, 2.5);
  g.add(drum, floor, plinth, ring, hemi, key, fill);
  return {
    group: g, targetY: TOP + 0.54, reach: 1, walled: false,
    light: (L, scene) => { hemi.intensity = 0.025 + 0.6 * L; key.intensity = 2.4 * L; fill.intensity = 0.55 * L; scene.environmentIntensity = 0.035 + 0.5 * L; },
    hall: (colour) => {
      // whitewash, a little greyer towards the roof, over a painted dado kept low behind the plinth
      const grad = wx.createLinearGradient(0, 0, 0, 470);
      grad.addColorStop(0, '#b9bbb4'); grad.addColorStop(0.55, '#d6d8d1'); grad.addColorStop(1, WASH);
      wx.fillStyle = grad; wx.fillRect(0, 0, 4, 512);
      wx.fillStyle = colour; wx.fillRect(0, 470, 4, 42);
      wx.fillStyle = 'rgba(0,0,0,.45)'; wx.fillRect(0, 468, 4, 3);
      wallTex.needsUpdate = true;
    },
  };
}

export function buildRoom(look: Look): Room {
  return look === 'betong' ? betong() : look === 'tehdas' ? tehdas() : look === 'ljus' ? ljus() : works();
}

/** What you see past the walls, by look and by how much light is on. */
export const OUTSIDE: Record<Look, string> = { works: '#e4e5df', betong: '#8f9391', tehdas: '#6f7374', ljus: '#d9dbd8' };
