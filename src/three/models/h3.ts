import { G, M, Swarm, glows, lamps, screen, THREE, type Built, type V3 } from '../kit';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { bigTime, dotMatrix, dots, hsl, now } from '../../sims/draw';

// ---------- small parts at a small cost, shared with hall 5 ----------

/**
 * A whole assembly baked into one mesh for each material it uses, in the place it was built in. A housing with its
 * ribs, screws and feet is then a single draw call, which is what lets a model carry small parts on a phone.
 * Pass plain meshes and groups of them, built from shared materials. Anything else (a Swarm, a pane with two
 * materials, a sprite, a lamp) is kept as it is.
 */
export function fused(...parts: THREE.Object3D[]): THREE.Group {
  const by = new Map<THREE.Material, THREE.BufferGeometry[]>(), kept: THREE.Object3D[] = [];
  const walk = (o: THREE.Object3D): void => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material) && !o.children.length) {
      const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
      for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') geo.deleteAttribute(k);
      const list = by.get(m.material);
      if (list) list.push(geo); else by.set(m.material, [geo]);
    } else if (o.type === 'Group') for (const k of [...o.children]) walk(k);
    else kept.push(o);
  };
  for (const p of parts) { p.updateMatrixWorld(true); walk(p); }
  const out = G.group();
  for (const [mat, geos] of by) out.add(new THREE.Mesh(G.merge(geos), mat));
  for (const o of kept) { const w = o.matrixWorld.clone(); o.removeFromParent(); w.decompose(o.position, o.quaternion, o.scale); out.add(o); }
  return out;
}

/** Put a thing in its place and hand it back. */
export const put = <T extends THREE.Object3D>(o: T, p?: V3): T => { if (p) o.position.set(p[0], p[1], p[2]); return o; };

/** A block with its edges only just broken: a third of the triangles of the kit's box, for parts a finger wide. */
export const block = (w: number, h: number, d: number, mat: THREE.Material, p?: V3, r = Math.min(w, h, d) * 0.16): THREE.Mesh =>
  put(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, r), mat), p);

/** A plain turned part with few sides, its axis along y: a boss, a can, a foot. */
export const can = (r: number, h: number, mat: THREE.Material, p?: V3, seg = 14, rTop = r): THREE.Mesh =>
  put(new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat), p);

/** A lead through the given points, with a third of the triangles of the kit's wire. */
export const lead = (pts: V3[], r: number, mat: THREE.Material, steps = pts.length * 5, sides = 6): THREE.Mesh =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.5), steps, r, sides, false), mat);

/** A flat rectangle facing +z that shows one part of a picture, from (u0, v0) at its lower left to (u1, v1). */
export function patch(w: number, h: number, mat: THREE.Material, p: V3, u0: number, v0: number, u1: number, v1: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
  return put(new THREE.Mesh(geo, mat), p);
}

/** Pan-head screws as plain geometry, to be fused with what they hold. The heads face along `dir`. */
export function heads(at: V3[], r: number, mat: THREE.Material, dir: V3 = [0, 0, 1]): THREE.Group {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dir[0], dir[1], dir[2]).normalize());
  return G.group(...at.map((p) => { const m = put(new THREE.Mesh(new THREE.SphereGeometry(r, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1), mat), p); m.quaternion.copy(q); return m; }));
}

/** A length of slotted aluminium profile, the kind that frames and stands are bolted together from. */
export function slotted(size: number, len: number, mat: THREE.Material, p: V3, along: 'x' | 'y' | 'z' = 'y'): THREE.Mesh {
  const a = size / 2, w = size * 0.13, d = size * 0.22, shape = new THREE.Shape();
  for (let k = 0; k < 4; k++) {
    const c = Math.round(Math.cos((k * Math.PI) / 2)), s = Math.round(Math.sin((k * Math.PI) / 2));
    for (const [x, y] of [[a, -a], [a, -w], [a - d, -w], [a - d, w], [a, w]]) { if (k === 0 && y === -a) shape.moveTo(x, y); else shape.lineTo(x * c - y * s, x * s + y * c); }
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false }).translate(0, 0, -len / 2);
  if (along === 'y') geo.rotateX(-Math.PI / 2); else if (along === 'x') geo.rotateY(Math.PI / 2);
  return put(new THREE.Mesh(geo, mat), p);
}

/** A rectangle with rounded corners about (cx, cy), as an outline or as a hole in one. */
export function roundedRect<T extends THREE.Path>(path: T, w: number, h: number, r: number, cx = 0, cy = 0): T {
  const x = cx - w / 2, y = cy - h / 2, q = Math.PI / 2;
  path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.absarc(x + w - r, y + r, r, -q, 0, false);
  path.lineTo(x + w, y + h - r); path.absarc(x + w - r, y + h - r, r, 0, q, false);
  path.lineTo(x + r, y + h); path.absarc(x + r, y + h - r, r, q, 2 * q, false);
  path.lineTo(x, y + r); path.absarc(x + r, y + r, r, 2 * q, 3 * q, false);
  return path;
}

/**
 * A flat lead with a copper track for every conductor: a strip `w` wide through the points of its side view, given as
 * [z, y] pairs. It is centred on `x`.
 */
export function flatLead(side: [number, number][], w: number, x = 0, tracks = 14): THREE.Mesh {
  const s = screen(128, 8), steps = 14;
  s.ctx.fillStyle = '#a87a36'; s.ctx.fillRect(0, 0, 128, 8);
  s.ctx.fillStyle = '#7c4f1e';
  for (let k = 0; k < tracks; k++) s.ctx.fillRect(6 + (k * 118) / tracks, 0, 66 / tracks, 8);
  s.tex.needsUpdate = true;
  const line = new THREE.CatmullRomCurve3(side.map(([z, y]) => new THREE.Vector3(0, y, z)), false, 'catmullrom', 0.5).getPoints(steps);
  const strip = new THREE.PlaneGeometry(w, 1, 1, steps);
  for (let k = 0; k <= steps; k++) for (const e of [0, 1]) strip.attributes.position.setXYZ(k * 2 + e, x + (e ? w / 2 : -w / 2), line[k].y, line[k].z);
  strip.computeVertexNormals();
  return new THREE.Mesh(strip, new THREE.MeshStandardMaterial({ map: s.tex, roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide }));
}

/** The stuff a ground glass edge is made of: the green of the glass, seen through its whole width. */
export const groundEdge = (): THREE.Material => new THREE.MeshPhysicalMaterial({ color: 0x3f7f6e, roughness: 0.3, transparent: true, opacity: 0.6, depthWrite: false });

/**
 * A sheet of glass with ground edges, which is how it can be seen to be there. It faces +z. Unlike the kit's pane it is
 * made of plain parts in two materials, so that all the glass of a model fuses into two meshes.
 */
export function sheetOfGlass(w: number, h: number, t: number, face: THREE.Material, edge: THREE.Material, p?: V3): THREE.Group {
  const g = put(G.group(), p);
  for (const s of [-1, 1]) {
    const f = G.plane(w, h, face, [0, 0, (s * t) / 2]), a = G.plane(w, t, edge, [0, (s * h) / 2, 0]), b = G.plane(t, h, edge, [(s * w) / 2, 0, 0]);
    if (s < 0) f.rotation.y = Math.PI;
    a.rotation.x = (-s * Math.PI) / 2; b.rotation.y = (s * Math.PI) / 2;
    g.add(f, a, b);
  }
  return g;
}

/** A plain type plate: a name, and one or two lines of ratings under it. Twice as wide as it is high, nearly. */
export function typePlate(name: string, lines: string[]): THREE.MeshStandardMaterial {
  const s = screen(256, 96), c = s.ctx;
  c.fillStyle = '#c5c8cb'; c.fillRect(0, 0, 256, 96);
  c.strokeStyle = '#33363a'; c.lineWidth = 2; c.strokeRect(5, 5, 246, 86);
  c.fillStyle = '#1b1d1f'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '700 30px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'; c.fillText(name, 15, 40);
  c.font = '15px "PT Mono", monospace';
  lines.forEach((line, i) => c.fillText(line, 15, 62 + i * 18));
  s.tex.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map: s.tex, roughness: 0.6, metalness: 0.1 });
}

/** LED sign: a red, a green and a blue lamp to every pixel, bright enough to read outdoors at noon. */
export function led(): Built {
  const root = G.group(), made = G.group();
  const COLS = 32, ROWS = 16, P = 0.07, N = COLS * ROWS;
  // A lamp is a bullet: a short barrel standing out of the mask and a domed end. Oval, taller than wide, which throws
  // its light wide to the sides and keeps it off the sky. Only what stands clear of the mask is built.
  const bullet = (r: number) => new THREE.LatheGeometry([[1, 0], [1, 0.6], [0.8, 1.2], [0.42, 1.55], [0, 1.65]].map(([x, y]) => new THREE.Vector2(x * r, y * r)), 14).rotateX(Math.PI / 2).scale(1, 1.3, 1);
  // side by side, as on an outdoor tile: from across the hall the three merge into one colour
  const domes = new Swarm(bullet(0.0088), M.plastic(0xffffff, 0.25), N * 3);
  const light = lamps(bullet(0.0102), N * 3);
  const bloom = glows(N, 0.13);
  const xy = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, ((ROWS - 1) / 2 - Math.floor(i / COLS)) * P];
  const LENS = [[0.075, 0.022, 0.02], [0.02, 0.06, 0.028], [0.022, 0.03, 0.085]];
  for (let i = 0; i < N; i++) {
    const [x, y] = xy(i);
    for (let k = 0; k < 3; k++) { const j = i * 3 + k, lx = x + (k - 1) * 0.0205; domes.put(j, lx, y, 0.0185); domes.tint(j, LENS[k][0], LENS[k][1], LENS[k][2]); light.put(j, lx, y, 0.0185); }
    bloom.pos.set([x, y, 0.06], i * 3);
  }
  domes.done(); light.done(); bloom.flush(true); bloom.points.geometry.computeBoundingBox();
  // the lamps never move, so they can be left out of any picture they are not in, the floor's mirror above all
  domes.mesh.frustumCulled = light.mesh.frustumCulled = true;
  const W = COLS * P + 0.08, H = ROWS * P + 0.08;
  const black = M.black(), tin = M.dark(), steel = M.steel(1), zinc = M.steel(0), rubber = M.rubber();
  // the mask the lamps look through, black so that an unlit pixel is as dark as can be
  root.add(domes.mesh, light.mesh, bloom.points);
  made.add(G.box(W, H, 0.05, black, [0, 0, -0.005], 0.006));
  // a shade over every row keeps the sun off the lamps. It slopes down a little, to shed the rain
  for (let r = 0; r < ROWS; r++) { const fin = G.box(COLS * P, 0.005, 0.04, black, [0, ((ROWS - 1) / 2 - r) * P + P * 0.46 - 0.002, 0.036], 0); fin.rotation.x = 0.1; made.add(fin); }
  // the screws that hold the mask, between the pixels
  made.add(heads([-8, 0, 8].flatMap((k) => [3.5, -4.5].map((j) => [k * P, j * P, 0.02] as V3)), 0.0052, tin));
  // cabinet: sheet steel, with a door at the back on three hinges and two turn catches, and slots to lose heat
  made.add(G.rbox(W + 0.1, H + 0.1, 0.24, 0.02, tin, [0, 0, -0.14]), block(W - 0.3, H - 0.14, 0.014, tin, [0, 0, -0.262], 0.004));
  made.add(heads([[-W / 2, H / 2, -0.02], [W / 2, H / 2, -0.02], [-W / 2, -H / 2, -0.02], [W / 2, -H / 2, -0.02], [0, H / 2, -0.02], [0, -H / 2, -0.02]].map(([x, y, z]) => [x * 0.99, y * 0.97, z] as V3), 0.016, zinc));
  for (const y of [-0.36, 0, 0.36]) made.add(can(0.013, 0.1, zinc, [-(W - 0.3) / 2 - 0.004, y, -0.268], 8));
  for (const y of [-0.3, 0.3]) made.add(G.rod([(W - 0.3) / 2 - 0.07, y, -0.266], [(W - 0.3) / 2 - 0.07, y, -0.278], 0.03, zinc, 14), G.box(0.008, 0.04, 0.004, black, [(W - 0.3) / 2 - 0.07, y, -0.279], 0));
  for (let i = 0; i < 7; i++) for (const y of [0.3, -0.22]) made.add(G.box(1.1, 0.013, 0.008, black, [-0.2, y + i * 0.03, -0.268], 0));
  const plate = patch(0.3, 0.1125, typePlate('OUTDOOR TILE  32 × 16', ['1536 LAMPS  RED GREEN BLUE', '230 V ~  50 Hz  400 W']), [0.62, -0.44, -0.2695], 0, 0, 1, 1);
  plate.rotation.y = Math.PI;
  made.add(plate);
  // two eyes on top to lift it by
  for (const x of [-0.8, 0.8]) { const eye = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.009, 6, 14), zinc); eye.position.set(x, H / 2 + 0.094, -0.14); made.add(eye, can(0.014, 0.03, zinc, [x, H / 2 + 0.06, -0.14], 8), can(0.026, 0.008, zinc, [x, H / 2 + 0.054, -0.14], 6)); }
  // it stands on two galvanised posts, each with a plate under the cabinet and a flange bolted down
  for (const x of [-0.8, 0.8]) {
    made.add(G.cyl(0.04, 0.4, steel, [x, -H / 2 - 0.23, -0.14], 18), G.box(0.22, 0.016, 0.17, steel, [x, -H / 2 - 0.058, -0.14], 0), G.cyl(0.14, 0.03, steel, [x, -H / 2 - 0.43, -0.14], 28));
    made.add(heads([0, 1, 2, 3].map((k) => [x + Math.cos(k * 1.5708 + 0.7854) * 0.1, -H / 2 - 0.415, -0.14 + Math.sin(k * 1.5708 + 0.7854) * 0.1] as V3), 0.014, zinc, [0, 1, 0]));
  }
  // the mains comes up the right-hand post in a hose and into the cabinet from below, through a gland
  made.add(can(0.024, 0.03, zinc, [0.6, -H / 2 - 0.064, -0.2], 8), lead([[0.6, -H / 2 - 0.07, -0.2], [0.62, -H / 2 - 0.15, -0.2], [0.735, -H / 2 - 0.2, -0.165], [0.752, -H / 2 - 0.32, -0.16], [0.752, -H / 2 - 0.415, -0.16]], 0.013, rubber, 20));
  root.add(fused(made));
  const col = new THREE.Color(), eye = new THREE.Vector3(), mixed = new Float32Array(N * 3);
  let stamp = -1, merge = -1;
  return {
    root, inDark: 'glows', glow: 0xff9a4a, view: [20, 8], zoom: 1.05,
    views: {
      below: { room: true, at: [-2.3, 0.1, 2.2], to: [-0.3, 0.05, 0], fov: 50 },
      lamps: { at: [-0.75, 0.35, 0.5], to: [-0.6, 0.22, 0.02], play: 0.4 },
      // from across the street to arm's length and back
      walk: { at: [0.2, 0.3, 6], to: [0, 0.2, 0], fov: 40, walk: { period: 18, near: 0.1 } },
    },
    update: ({ camera }) => {
      const n = now();
      // The eye merges the three lamps of a pixel from a distance and tells them apart from close to.
      // The halo round each pixel is the merged light: it gives way to the lamps as the visitor comes near.
      root.worldToLocal(eye.copy(camera.position));
      const away = Math.hypot(Math.max(0, Math.abs(eye.x) - W / 2), Math.max(0, Math.abs(eye.y) - H / 2), eye.z);
      const m = Math.round(THREE.MathUtils.smoothstep(away, 0.9, 2.6) * 25) / 25;
      if (n.s === stamp && m === merge) return;
      if (n.s !== stamp) {
        const d = dots(n.hhmm);
        for (let i = 0; i < N; i++) {
          const c = i % COLS, r = Math.floor(i / COLS);
          if (r >= 2 && r <= 8 && d.on(c - 4, r - 2)) col.setHSL(0.02 + (c / COLS) * 0.1, 1, 0.55);
          else if (r >= 11 && r <= 13 && c >= 1 && c <= 30 && c - 1 < n.s / 2) col.setHSL((c - 1) / 30 * 0.8, 1, 0.5);
          else col.setRGB(0, 0, 0);
          mixed[i * 3] = col.r; mixed[i * 3 + 1] = col.g; mixed[i * 3 + 2] = col.b;
        }
      }
      stamp = n.s; merge = m;
      const lamp = 1.5 - 1.0 * m, halo = 0.42 + 0.76 * m;
      for (let i = 0; i < N * 3; i++) {
        // each lamp gives only its own colour, as much of it as the pixel's colour calls for
        const v = mixed[i] * lamp, k = i % 3;
        light.tint(i, k === 0 ? v : 0, k === 1 ? v : 0, k === 2 ? v : 0);
        bloom.col[i] = mixed[i] * halo;
      }
      if (light.mesh.instanceColor) light.mesh.instanceColor.needsUpdate = true;
      bloom.flush();
    },
  };
}

/** The rating label on the back of the set. */
function setLabel(): THREE.CanvasTexture {
  const s = screen(128, 64), c = s.ctx;
  c.fillStyle = '#d9dadb'; c.fillRect(0, 0, 128, 64);
  c.fillStyle = '#1b1d1f'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '700 17px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'; c.fillText('OLED TELEVISION', 6, 18);
  c.font = '9px "PT Mono", monospace'; c.fillText('230 V ~ 50 Hz 120 W', 6, 31);
  for (let i = 0, x = 6; x < 120; i++) { const w = 1 + ((i * 7) % 3); c.fillRect(x, 40, w, 16); x += w + 1 + ((i * 5) % 3); }
  s.tex.needsUpdate = true;
  return s.tex;
}

/** OLED: a sheet a few millimetres thick where every pixel is its own lamp, so black is simply off. */
export function oled(): Built {
  const root = G.group(), made = G.group();
  const s = screen(640, 360);
  const skin = M.dark(), shell = M.plastic(0x0d0e10, 0.5), black = M.black(), steel = M.steel(1), zinc = M.steel(0);
  const TILT = 0.09, cs = Math.cos(TILT), sn = Math.sin(TILT);
  // the sheet itself: glass in front, black right out to its rounded corners, and a skin of metal behind
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.05 });
  const panel = G.group(G.slab(2.26, 1.3, 0.03, 0.018, skin), G.slab(2.252, 1.292, 0.027, 0.0016, glass, [0, 0, 0.0098], 0));
  // the electronics do not fit in a sheet this thin, so they ride in a shell low on the back, with slots along its top,
  // a bay of sockets, the label, and the plate that the stand is screwed to
  panel.add(G.rbox(1.5, 0.56, 0.07, 0.025, shell, [0, -0.33, -0.044]));
  for (let i = 0; i < 8; i++) for (const y of [-0.105, -0.135]) panel.add(G.box(0.13, 0.011, 0.006, black, [(i - 3.5) * 0.17, y, -0.0795], 0));
  panel.add(G.box(0.36, 0.17, 0.006, black, [0.5, -0.43, -0.0795], 0), G.rod([0.62, -0.4, -0.08], [0.62, -0.4, -0.094], 0.014, zinc, 10));
  for (let k = 0; k < 3; k++) panel.add(G.box(0.062, 0.022, 0.008, zinc, [0.39 + k * 0.085, -0.4, -0.083], 0), G.box(0.046, 0.01, 0.002, black, [0.39 + k * 0.085, -0.4, -0.0875], 0));
  panel.add(G.box(0.07, 0.05, 0.008, black, [0.4, -0.47, -0.083], 0));
  const label = patch(0.2, 0.1, new THREE.MeshStandardMaterial({ map: setLabel(), roughness: 0.7 }), [-0.5, -0.45, -0.0795], 0, 0, 1, 1);
  label.rotation.y = Math.PI;
  panel.add(label, block(0.34, 0.34, 0.014, steel, [0, -0.33, -0.085], 0.004), heads([[-0.13, -0.2, -0.092], [0.13, -0.2, -0.092], [-0.13, -0.46, -0.092], [0.13, -0.46, -0.092]], 0.014, zinc, [0, 0, -1]));
  // under the bottom edge, the small window of the remote control's receiver
  panel.add(block(0.1, 0.02, 0.016, shell, [0, -0.658, 0], 0.004));
  panel.position.set(0, 0.95, 0); panel.rotation.x = -TILT;
  root.add(G.plane(2.2, 1.24, M.lit(s, 1.5, 1), [0, 0.95 + 0.0108 * sn, 0.0108 * cs]).rotateX(-TILT));
  // the stand: a plate, and a flat neck up to the plate on the back of the shell
  const foot = new THREE.Vector3(0, 0.035, -0.15), head = new THREE.Vector3(0, 0.95 - 0.2 * cs - 0.099 * sn, 0.2 * sn - 0.099 * cs);
  const neck = block(0.16, foot.distanceTo(head), 0.03, steel, undefined, 0.006);
  neck.position.copy(foot).lerp(head, 0.5); neck.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), head.clone().sub(foot).normalize());
  made.add(panel, neck, G.rbox(1.15, 0.035, 0.52, 0.016, steel, [0, 0.0175, -0.04]), block(0.24, 0.012, 0.1, steel, [0, 0.041, -0.15], 0.003));
  // the mains lead comes out of the socket bay, is clipped to the neck and leaves under the back of the plate
  made.add(lead([[0.4, 0.95 - 0.48 * cs, 0.48 * sn - 0.085], [0.37, 0.4, -0.13], [0.11, 0.3, -0.135], [0.1, 0.07, -0.19], [0.14, 0.012, -0.27], [0.2, 0.012, -0.29]], 0.011, black, 24));
  made.add(G.box(0.2, 0.03, 0.012, zinc, [0.02, 0.27, -0.14], 0));
  root.add(fused(made));
  return {
    root, inDark: 'glows', glow: 0xb8a0ff, view: [28, 8], surface: s.canvas,
    views: { edge: { at: [2, 1.25, 1.1], to: [0.7, 0.95, 0], fov: 40, play: 0.1 }, seat: { at: [0, 1, 3.6], to: [0, 0.95, 0] } },
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

/** The board behind a tile of the wall, which the tile plugs into: tracks, and rows of contacts down both sides. */
function backplane(): THREE.CanvasTexture {
  const s = screen(1024, 1024), c = s.ctx;
  c.fillStyle = '#17432b'; c.fillRect(0, 0, 1024, 1024);
  // the copper of the ground plane shows through the green as a lighter field, cut back from the edge of the board
  c.fillStyle = '#1d5236'; c.fillRect(18, 18, 988, 988);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the board is the same on both sides of its middle: everything is drawn once and once mirrored
  for (const m of [1, -1]) {
    const X = (x: number) => 512 + m * (x - 512);
    const run = (pts: [number, number][], w = 3) => { c.strokeStyle = '#2f774e'; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), y) : c.moveTo(X(x), y))); c.stroke(); };
    const pad = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(X(x) - w / 2, y - h / 2, w, h); };
    // tracks fan out from the pins along both long sides of the data socket to the contact rows, each with one dog-leg
    for (let i = 0; i < 9; i++) { const x = 400 + i * 10, y = 472 - i * 26, a = 390 - i * 6; run([[x, 505], [x, y + x - a], [a, y], [201, y]]); }
    for (let i = 0; i < 6; i++) { const x = 400 + i * 12, y = 602 + i * 26, a = 390 - i * 6; run([[x, 579], [x, y - x + a], [a, y], [201, y]]); }
    [498, 524, 550, 576].forEach((y, j) => { const y0 = 515 + j * 17; run([[393, y0], [362, y0], [362 - Math.abs(y - y0), y], [201, y]]); });
    // the driver chip talks to the top row of contacts and to the socket below it
    run([[449, 238], [201, 238]]);
    for (const x of [490, 501, 512]) run([[x, 322], [x, 505]]);
    // power: a broad track from the socket out to a rail beside the contacts, and a stub to every second one
    run([[386, 810], [142, 810], [110, 778], [110, 238]], 13);
    for (let k = 0; k < 22; k += 2) run([[110, 238 + k * 26], [150, 238 + k * 26]], 6);
    for (const y of [758, 784]) run([[110, y], [201, y]], 6);
    // contacts in two rows down each side, gold on the green, each with the dimple a spring pin leaves
    for (const x of [155, 192]) for (let k = 0; k < 22; k++) { pad(x, 238 + k * 26, 19, 14, '#c9a23f'); pad(x, 238 + k * 26, 6, 5, '#8a6c24'); }
    // tinned pads under the legs of the socket and the chip, and small parts beside the chip
    for (let i = 0; i < 12; i++) { pad(400 + i * 10, 500, 5, 12, '#cfd3d0'); pad(400 + i * 10, 584, 5, 12, '#cfd3d0'); }
    for (let i = 0; i < 6; i++) { pad(459 + i * 10.6, 191, 5, 14, '#cfd3d0'); pad(459 + i * 10.6, 327, 5, 14, '#cfd3d0'); pad(444, 206 + i * 21.2, 14, 5, '#cfd3d0'); pad(444, 216.6 + i * 21.2, 14, 5, '#cfd3d0'); }
    for (let i = 0; i < 3; i++) { pad(462 + i * 22, 160, 16, 9, '#cfd3d0'); pad(462 + i * 22, 160, 8, 9, '#a98f66'); pad(340 + i * 26, 208, 9, 16, '#cfd3d0'); pad(340 + i * 26, 208, 9, 8, '#26282a'); }
    // plated holes: one under every board screw, and a row stitching the ground plane along the edges
    c.fillStyle = '#c9a23f';
    for (const y of [65, 959]) { c.beginPath(); c.arc(X(304), y, 26, 0, 7); c.fill(); }
    c.fillStyle = '#9fb3a2';
    for (let k = 0; k < 13; k++) for (const [x, y] of [[212 + k * 50, 34], [212 + k * 50, 990], [34, 212 + k * 50]]) { c.beginPath(); c.arc(X(x), y, 3.4, 0, 7); c.fill(); }
    // printed in white: where the magnets and pegs sit, and the outline of each part
    c.strokeStyle = '#d9d6c7'; c.lineWidth = 3;
    for (const y of [103, 921]) { c.beginPath(); c.arc(X(103), y, 68, 0, 7); c.stroke(); }
    c.beginPath(); c.arc(X(58), 512, 40, 0, 7); c.stroke();
    c.beginPath(); c.arc(X(281), 877, 31, 0, 7); c.stroke();
  }
  c.strokeStyle = '#d9d6c7'; c.lineWidth = 3;
  c.strokeRect(380, 758, 264, 104); c.strokeRect(388, 494, 248, 96); c.strokeRect(438, 185, 148, 148);
  c.fillStyle = '#d9d6c7'; c.beginPath(); c.arc(430, 180, 5, 0, 7); c.fill();
  c.font = '26px "PT Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText('POWER', 512, 750); c.fillText('DATA', 512, 622); c.fillText('ROW 1  COLUMN 3', 512, 978);
  c.font = '17px "PT Mono", monospace';
  c.fillText('U1', 606, 178); c.fillText('C1', 226, 884); c.fillText('C2', 788, 884); c.fillText('J1', 664, 852); c.fillText('J2', 658, 584);
  s.tex.needsUpdate = true;
  return s.tex;
}

/** The lettering the wall carries: the plate on the pedestal, and the paper label on the back of every bay and tile. */
function wallLabels(): THREE.CanvasTexture {
  const s = screen(256, 256), c = s.ctx;
  c.fillStyle = '#c5c8cb'; c.fillRect(0, 0, 256, 80);
  c.strokeStyle = '#33363a'; c.lineWidth = 2; c.strokeRect(5, 5, 246, 70);
  c.fillStyle = '#1b1d1f'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.font = '700 30px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'; c.fillText('VIDEO WALL  3 × 2 TILES', 15, 38);
  c.font = '15px "PT Mono", monospace'; c.fillText('230 V ~  50 Hz  900 W', 15, 62);
  c.fillStyle = '#eceae2'; c.fillRect(0, 96, 160, 96);
  c.fillStyle = '#1b1d1f'; c.font = '700 26px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'; c.fillText('LED TILE', 10, 124);
  for (let i = 0; i < 3; i++) c.fillRect(10, 134 + i * 9, [132, 96, 118][i], 3);
  // a row of bars of no meaning, as on any label
  for (let i = 0, x = 10; x < 148; i++) { const w = 1 + ((i * 7) % 4); c.fillRect(x, 164, w, 20); x += w + 1 + ((i * 5) % 3); }
  s.tex.needsUpdate = true;
  return s.tex;
}

/** MicroLED wall: inorganic LEDs too small to see, built as tiles so a dead one can be lifted out and swapped. */
export function microled(): Built {
  const root = G.group(), made = G.group();
  const s = screen(768, 512);
  // tile pitch, the height of the pedestal, the middle of the upper row, and how far back the face of a backplane lies
  const T = 0.74, PH = 0.33, top = PH + 0.035 + T * 1.5, ZB = -0.0812;
  const shell = M.plastic(0x0c0d0e, 0.4), cast = M.dark(), al = M.steel(1), across = M.steel(0), paint = M.plastic(0x3d4147, 0.62);
  // the trays and carriers are die castings left bare: a duller, darker grey than the drawn profiles of the frame
  cast.color.set(0x62676d); cast.roughness = 0.6;
  const nickel = M.chrome(), brass = M.brass(), nylon = M.plastic(0xe9e6dc, 0.5), rubber = M.rubber(), orange = M.plastic(0xd1481f, 0.4), blue = M.plastic(0x2a5a9a, 0.5);
  // the LEDs sit under a dark resin made to swallow room light: lit or not, a tile is nearly matt
  const lit = new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: s.tex, emissiveIntensity: 1.5, roughness: 0.7 });
  const dead = new THREE.MeshStandardMaterial({ color: 0x06070a, roughness: 0.74 });
  const board = new THREE.MeshStandardMaterial({ map: backplane(), roughness: 0.5, metalness: 0.15 });
  const print = new THREE.MeshStandardMaterial({ map: wallLabels(), roughness: 0.6, metalness: 0.1 });
  const stud = (x: number, y: number, z0: number, z1: number, r: number, mat: THREE.Material, seg = 12) => G.rod([x, y, z0], [x, y, z1], r, mat, seg);
  const label = (p: V3) => { const l = patch(0.2, 0.12, print, p, 0, 0.25, 0.625, 0.625); l.rotation.y = Math.PI; return l; };
  // a tile: the board that carries the LEDs, on a cast carrier a little smaller than itself
  const tile = (face: THREE.Mesh) => G.group(G.box(T - 0.004, T - 0.004, 0.012, shell, [0, 0, 0.019], 0), block(T - 0.024, T - 0.024, 0.043, cast, [0, 0, -0.0085], 0.005), face);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const bay = G.group();
    bay.position.set((c - 1) * T, top - r * T, 0);
    // the back of a bay: a cover with its label, and sockets for the leads that chain one bay to the next
    bay.add(block(0.5, 0.36, 0.014, cast, [0, 0.07, -0.121], 0.004), heads([[-0.22, 0.22, -0.128], [0.22, 0.22, -0.128], [-0.22, -0.08, -0.128], [0.22, -0.08, -0.128]], 0.011, nickel, [0, 0, -1]), label([0.1, 0.12, -0.1284]));
    for (const sx of [-1, 1]) bay.add(stud(sx * 0.24, -0.27, -0.113, -0.152, 0.024, rubber, 10), stud(sx * 0.15, -0.27, -0.113, -0.146, 0.017, nickel, 10));
    made.add(bay);
    if (r > 0 || c < 2) {
      // a cast tray bolted to the frame, with the backplane inside it and a tile held on by its magnets
      bay.add(block(T - 0.012, T - 0.012, 0.079, cast, [0, 0, -0.0755], 0.006), tile(patch(T - 0.01, T - 0.01, lit, [0, 0, 0.0256], c / 3, 1 - (r + 1) / 2, (c + 1) / 3, 1 - r / 2)));
      continue;
    }
    // the empty socket: the tray open to the front, and in it the backplane with all that a tile meets
    bay.add(G.box(T - 0.012, T - 0.012, 0.033, cast, [0, 0, -0.0985], 0), G.plane(0.69, 0.69, board, [0, 0, ZB]), G.bezel(T - 0.012, T - 0.012, 0.688, 0.688, 0.012, 0.046, cast, [0, 0, -0.059], 0.006, 0.003));
    // four magnets on bosses, each a nickel-plated disc held down by a screw through its middle
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const magnet = G.lathe([[0.035, 0], [0.037, 0.002], [0.037, 0.013], [0.034, 0.016], [0.013, 0.016], [0.009, 0.011], [0, 0.011]], nickel, 28);
      magnet.rotation.x = Math.PI / 2; magnet.position.set(sx * 0.275, sy * 0.275, -0.046);
      bay.add(stud(sx * 0.275, sy * 0.275, ZB, -0.046, 0.041, cast, 20), magnet, stud(sx * 0.275, sy * 0.275, -0.04, -0.0345, 0.009, shell, 8));
    }
    // two pegs, longer than the magnets are tall, steer a tile on to its contacts before the magnets take it
    for (const sx of [-1, 1]) { const peg = G.lathe([[0.024, 0], [0.024, 0.006], [0.013, 0.008], [0.013, 0.056], [0.007, 0.075], [0, 0.076]], brass, 14); peg.rotation.x = Math.PI / 2; peg.position.set(sx * 0.305, 0, ZB); bay.add(peg); }
    // the power socket in white nylon with its eight cavities, and the data socket with two rows of gold contacts
    bay.add(block(0.17, 0.062, 0.036, nylon, [0, -0.2, ZB + 0.018], 0.004), G.box(0.05, 0.01, 0.024, nylon, [0, -0.164, ZB + 0.012], 0));
    for (let i = 0; i < 4; i++) for (const sy of [-1, 1]) bay.add(G.box(0.024, 0.018, 0.002, shell, [(i - 1.5) * 0.038, -0.2 + sy * 0.014, ZB + 0.0362], 0));
    bay.add(block(0.16, 0.05, 0.03, shell, [0, -0.02, ZB + 0.015], 0.003), G.box(0.132, 0.008, 0.002, brass, [0, -0.012, ZB + 0.0302], 0), G.box(0.132, 0.008, 0.002, brass, [0, -0.028, ZB + 0.0302], 0));
    // the chip that drives the tile, two capacitors, and the screws that hold the board down
    bay.add(G.box(0.085, 0.085, 0.009, shell, [0, 0.17, ZB + 0.0045], 0), stud(-0.155, -0.245, ZB, ZB + 0.034, 0.017, al, 14), stud(0.155, -0.245, ZB, ZB + 0.034, 0.017, al, 14));
    bay.add(heads([[-0.14, 0.3, ZB], [0.14, 0.3, ZB], [-0.14, -0.3, ZB], [0.14, -0.3, ZB]], 0.012, nickel));
  }
  // the frame: slotted aluminium, uprights at the seams and the ends, rails between them where the rows meet
  const ZF = -0.146, rails = [PH + 0.07, top - T / 2, top + T / 2 - 0.045];
  for (const x of [-1.07, -0.37, 0.37, 1.07]) {
    made.add(slotted(0.06, 1.5, al, [x, PH + 0.75, ZF]), G.box(0.12, 0.012, 0.12, al, [x, PH + 0.006, ZF], 0), heads(rails.map((y) => [x, y, ZF - 0.03] as V3), 0.012, nickel, [0, 0, -1]));
  }
  for (const y of rails) for (const [x0, x1] of [[-1.04, -0.4], [-0.34, 0.34], [0.4, 1.04]]) made.add(slotted(0.06, x1 - x0, across, [(x0 + x1) / 2, y, ZF], 'x'));
  // two struts carry the wall's lean back to the pedestal
  for (const x of [-1.07, 1.07]) {
    const a = new THREE.Vector3(x, top - 0.2, ZF - 0.05), b = new THREE.Vector3(x, PH + 0.012, -0.43), strut = slotted(0.045, a.distanceTo(b), al, [0, 0, 0]);
    strut.position.copy(a).lerp(b, 0.5); strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    made.add(strut, G.box(0.1, 0.012, 0.1, al, [x, PH + 0.006, -0.43], 0), G.box(0.07, 0.1, 0.03, al, [x, top - 0.2, ZF - 0.04], 0));
  }
  // the pedestal holds the power supply and the controller: painted sheet steel, slots for air, a plain plate
  made.add(G.rbox(2.34, PH, 0.88, 0.03, paint, [0, PH / 2, -0.06]), patch(0.2, 0.0625, print, [0.16, 0.235, 0.3806], 0, 0.6875, 1, 1));
  made.add(heads([[0.05, 0.235, 0.38], [0.27, 0.235, 0.38]], 0.006, nickel));
  for (const x of [-1.05, 1.05]) for (const z of [-0.4, 0.28]) made.add(can(0.05, 0.03, rubber, [x, -0.015, z], 14, 0.044));
  for (let i = 0; i < 6; i++) made.add(G.box(0.9, 0.013, 0.01, shell, [-0.56, 0.09 + i * 0.03, 0.378], 0), G.box(0.7, 0.013, 0.01, shell, [0.2, 0.09 + i * 0.03, -0.498], 0));
  // at the back: the mains inlet with its switch and lead, and the bush where the leads to the wall come out of the top
  made.add(G.box(0.1, 0.075, 0.012, shell, [-0.86, 0.13, -0.503], 0), block(0.036, 0.05, 0.016, orange, [-0.72, 0.13, -0.504], 0.004), can(0.05, 0.016, rubber, [-T - 0.195, PH + 0.006, -0.37], 14));
  made.add(lead([[-0.86, 0.125, -0.505], [-0.86, 0.1, -0.56], [-0.86, 0.0, -0.565], [-0.84, -0.017, -0.5], [-0.8, -0.018, -0.4]], 0.012, rubber, 20));
  // power and data are chained from bay to bay: up from the pedestal, along the lower row, and back along the upper one
  const low = top - T - 0.27, high = top - 0.27;
  for (const [dx, r, mat, zo] of [[0.24, 0.013, rubber, -0.225], [0.15, 0.008, blue, -0.205]] as const) {
    const x0 = -T - dx;
    made.add(lead([[x0 + (dx - 0.195) * 0.5, PH, -0.37], [x0, PH + 0.1, -0.31], [x0, low + 0.01, zo], [x0, low, -0.15]], r, mat, 14));
    for (const y of [low, high]) for (const c of [-1, 0]) {
      const a = c * T + dx, b = (c + 1) * T - dx;
      made.add(lead([[a, y, -0.15], [a + 0.006, y - 0.045, zo + 0.012], [(a + b) / 2, y - 0.06 - (b - a) * 0.1, zo], [b - 0.006, y - 0.045, zo + 0.012], [b, y, -0.15]], r, mat, 16));
    }
    const x1 = T + dx;
    made.add(lead([[x1, low, -0.15], [x1 + 0.02, low + 0.05, zo + 0.01], [x1 + 0.03, (low + high) / 2, zo], [x1 + 0.02, high - 0.05, zo + 0.01], [x1, high, -0.15]], r, mat, 18));
  }
  // the tile that came out, dark, set down in front with the suction lifter still on it. It stands on the plinth
  // and leans back until the carrier touches the rounded front edge of the pedestal, a little above its own middle.
  const lean = 0.44, cs = Math.cos(lean), sn = Math.sin(lean);
  const sy = -0.029 + (T / 2 - 0.012) * cs + 0.03 * sn, ty = PH - 0.03 + 0.03 * sn, sz = 0.35 + 0.06 * cs + (sn * (ty - sy + 0.03 * sn)) / cs;
  const spare = tile(G.plane(T - 0.01, T - 0.01, dead, [0, 0, 0.0256]));
  spare.position.set(0.7, sy, sz); spare.rotation.x = -lean;
  // on its back, all flush with the carrier: the steel discs the magnets take hold of, the two plugs, and its label
  for (const sx of [-1, 1]) for (const sy2 of [-1, 1]) spare.add(stud(sx * 0.275, sy2 * 0.275, -0.03, -0.033, 0.037, nickel, 16));
  spare.add(G.box(0.15, 0.05, 0.004, nylon, [0, -0.2, -0.0305], 0), G.box(0.14, 0.04, 0.004, shell, [0, -0.02, -0.0305], 0), label([0.14, 0.17, -0.0304]));
  // the lifter: a rubber cup under a pressed dish, a handle across it, and the lever that pulls the middle of the cup up
  const cup = G.lathe([[0, 0.012], [0.075, 0.012], [0.112, 0.007], [0.134, 0], [0.137, 0.004], [0.12, 0.016], [0.096, 0.028], [0, 0.028]], rubber, 28);
  const dish = G.lathe([[0.098, 0.025], [0.101, 0.032], [0.097, 0.04], [0.06, 0.05], [0, 0.052]], orange, 28);
  const lifter = G.group(cup, dish);
  lifter.rotation.x = Math.PI / 2; lifter.position.z = 0.0256;
  spare.add(lifter, lead([[-0.088, 0, 0.06], [-0.088, 0, 0.125], [-0.06, 0, 0.154], [0.06, 0, 0.154], [0.088, 0, 0.125], [0.088, 0, 0.06]], 0.015, al, 22, 8));
  spare.add(G.rod([0, 0, 0.07], [0, 0, 0.1], 0.012, nickel, 10), block(0.11, 0.03, 0.012, orange, [0.036, 0, 0.104], 0.004), G.rod([0, -0.022, 0.1], [0, 0.022, 0.1], 0.006, nickel, 8));
  made.add(spare);
  root.add(fused(made));
  return {
    root, inDark: 'glows', glow: 0xffb0d0, view: [26, 8], surface: s.canvas,
    views: { wall: { at: [0, 1.2, 5], to: [0, 1, 0], fov: 34, play: 0.2 }, socket: { at: [1.35, top + 0.25, 1.05], to: [0.74, top, -0.06], play: 0.4 } },
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
  const root = G.group(), made = G.group();
  const s = screen(1280, 800);
  s.ctx.setTransform(2, 0, 0, 2, 0, 0);
  const TILT = 0.22, cs = Math.cos(TILT), sn = Math.sin(TILT);
  const cast = M.dark(), face = M.plastic(0x1a1c1f, 0.5), black = M.black(), steel = M.steel(1), zinc = M.steel(0), rubber = M.rubber();
  // a point of the unit, as it stands in the room once the unit is leant back
  const at = (x: number, y: number, z: number): V3 => [x, 0.9 + y * cs + z * sn, -y * sn + z * cs];
  const unit = G.group(
    G.rbox(2.0, 1.36, 0.22, 0.03, cast, [0, 0, -0.02]),
    G.bezel(2.0, 1.36, 1.68, 1.06, 0.02, 0.05, face, [0, 0, 0.1], 0.03, 0.012),
    G.plane(1.7, 1.08, M.lit(s, 1.5, 0.8), [0, 0, 0.094]),
  );
  // the glass sits in a rubber seal, and the frame is held by four slotted screws
  for (const k of [-1, 1]) unit.add(G.box(1.68, 0.03, 0.01, rubber, [0, k * 0.515, 0.099], 0), G.box(0.03, 1.0, 0.01, rubber, [k * 0.825, 0, 0.099], 0));
  for (const x of [-0.92, 0.92]) for (const y of [-0.6, 0.6]) unit.add(heads([[x, y, 0.125]], 0.026, zinc), G.box(0.04, 0.007, 0.004, black, [x, y, 0.1385], 0).rotateZ(x * y > 0 ? 0.5 : -0.9));
  // one control: the brightness
  unit.add(G.rod([0.62, -0.605, 0.125], [0.62, -0.605, 0.137], 0.05, face, 20), can(0.042, 0.04, face, [0.62, -0.605, 0.157], 20, 0.036).rotateX(Math.PI / 2), G.box(0.008, 0.03, 0.003, zinc, [0.62, -0.587, 0.1775], 0));
  // at the back: slots, the round plug that brings supply and signals, a plate
  for (let i = 0; i < 6; i++) unit.add(G.box(1.4, 0.033, 0.01, black, [0, 0.06 + i * 0.078, -0.131], 0));
  unit.add(G.rod([0.55, -0.38, -0.13], [0.55, -0.38, -0.2], 0.085, zinc, 20), G.rod([0.55, -0.38, -0.165], [0.55, -0.38, -0.215], 0.1, black, 20), G.rod([0.55, -0.38, -0.215], [0.55, -0.38, -0.27], 0.066, zinc, 14));
  const plate = patch(0.36, 0.135, typePlate('EL PANEL UNIT', ['ZINC SULPHIDE THIN FILM', '28 V =  12 W']), [-0.5, -0.42, -0.1306], 0, 0, 1, 1);
  plate.rotation.y = Math.PI;
  unit.add(plate);
  // flanges for bolting it into a console. Here they are bolted to two lengths of steel angle that stand in for one
  for (const k of [-1, 1]) {
    unit.add(G.box(0.16, 0.6, 0.02, steel, [k * 1.07, 0, -0.06], 0.004), heads([[k * 1.1, 0.2, -0.05], [k * 1.1, -0.2, -0.05]], 0.02, cast));
    unit.add(G.box(0.1, 1.19, 0.008, steel, [k * 1.09, -0.255, -0.074], 0), G.box(0.008, 1.19, 0.06, steel, [k * 1.136, -0.255, -0.104], 0));
  }
  unit.position.set(0, 0.9, 0); unit.rotation.x = -TILT;
  made.add(unit, G.rbox(2.3, 0.05, 0.85, 0.02, zinc, [0, 0.025, -0.05]));
  for (const k of [-1, 1]) {
    const foot = at(k * 1.09, -0.85, -0.1);
    made.add(block(0.2, 0.034, 0.22, steel, [foot[0], 0.067, foot[2]], 0.006), G.rod(at(k * 1.136, 0.25, -0.13), [k * 1.136, 0.06, -0.41], 0.018, steel, 8), block(0.07, 0.03, 0.1, steel, [k * 1.136, 0.065, -0.41], 0.006));
  }
  // the supply stands on the base: the panel needs a high alternating voltage, and this box makes it
  made.add(block(0.34, 0.12, 0.2, cast, [0.4, 0.11, -0.3], 0.012), heads([[0.26, 0.171, -0.36], [0.54, 0.171, -0.36], [0.26, 0.171, -0.24], [0.54, 0.171, -0.24]], 0.012, zinc, [0, 1, 0]));
  made.add(lead([at(0.55, -0.38, -0.27), at(0.55, -0.42, -0.36), [0.56, 0.36, -0.44], [0.5, 0.22, -0.4], [0.47, 0.17, -0.33]], 0.026, rubber, 20, 8));
  root.add(fused(made));
  return {
    root, inDark: 'glows', glow: 0xffb21a, view: [22, 10], surface: s.canvas,
    views: { side: { at: [2.6, 0.7, 1.6], to: [0, 0.95, 0], fov: 34, play: 0.12 }, dots: { at: [-1.15, 1.5, 0.8], to: [-0.6, 1.05, 0.06], play: 0.35 } },
    update: () => {
      const c = s.ctx, n = now();
      c.fillStyle = '#060400'; c.fillRect(0, 0, 640, 400);
      // the two sets of electrode strips, seen as fine lines between the dots: a dot is one crossing
      const cell = 640 / 41, ox = cell, oy = 30 + (210 - 7 * cell) / 2;
      c.fillStyle = 'rgba(255,178,26,.085)';
      for (let x = ox % cell; x < 640; x += cell) c.fillRect(x - 0.4, 0, 0.8, 400);
      for (let y = oy % cell; y < 400; y += cell) c.fillRect(0, y - 0.4, 640, 0.8);
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
  const root = G.group(), made = G.group();
  const s = screen(512, 448);
  const frame = M.dark(1), paint = M.plastic(0x1b1d20, 0.6), black = M.black(), chrome = M.chrome(), steel = M.steel(), brass = M.brass(), red = M.enamel(0xb5281d);
  const W = 1.7, D = 1.1, H = 1.5, y0 = 0.36;
  // plinth cabinet on a recessed kick, glass on three sides and the top, the screen as the fourth
  made.add(G.box(W - 0.04, 0.05, D - 0.04, black, [0, 0.025, 0], 0), G.rbox(W + 0.04, y0 - 0.04, D + 0.04, 0.03, paint, [0, 0.04 + (y0 - 0.04) / 2, 0]), G.box(W - 0.06, 0.02, D - 0.06, M.cloth(0x2c2f3a), [0, y0 + 0.01, 0], 0));
  made.add(G.box(W + 0.04, 0.07, D + 0.04, frame, [0, y0 + H + 0.035, 0]));
  for (const x of [-1, 1]) for (const z of [-1, 1]) made.add(G.box(0.04, H, 0.04, frame, [x * (W / 2), y0 + H / 2, z * (D / 2)], 0.006));
  const glass = M.glass(0xb9c9c6, 0.08), ground = groundEdge();
  const left = sheetOfGlass(D - 0.04, H, 0.012, glass, ground, [-W / 2, y0 + H / 2, 0]); left.rotation.y = Math.PI / 2;
  const right = sheetOfGlass(D - 0.04, H, 0.012, glass, ground, [W / 2, y0 + H / 2, 0]); right.rotation.y = Math.PI / 2;
  made.add(left, right, sheetOfGlass(W - 0.04, H, 0.012, glass, ground, [0, y0 + H / 2, -D / 2]));
  // the screen is a pane like the others, a shade greyer, with the dark border every panel has: narrow on three
  // sides and wider along the bottom, where its conductors leave for the plinth
  const border = roundedRect(new THREE.Shape(), W - 0.04, H, 0.004);
  border.holes.push(roundedRect(new THREE.Path(), W - 0.07, H - 0.06, 0.004, 0, 0.012));
  made.add(sheetOfGlass(W - 0.04, H, 0.016, M.glass(0x8fa4b4, 0.12), ground, [0, y0 + H / 2, D / 2]), G.extruded(border, 0.002, black, [0, y0 + H / 2, D / 2 + 0.0092], 0));
  root.add(G.plane(W - 0.08, H - 0.06, M.add(s), [0, y0 + H / 2, D / 2 + 0.0106]), G.box(W - 0.2, 0.02, 0.1, M.glow(0xfff4e0, 1.2), [0, y0 + H - 0.01, 0.2], 0));
  // the plinth holds what drives the pane: a door at the back with a lock and two hinges, slots for air on both ends,
  // a plate, and the mains lead
  made.add(block(1.0, 0.22, 0.012, paint, [0, 0.2, -D / 2 - 0.022], 0.004), G.rod([0.4, 0.2, -D / 2 - 0.026], [0.4, 0.2, -D / 2 - 0.038], 0.022, chrome, 12), G.box(0.006, 0.02, 0.003, black, [0.4, 0.2, -D / 2 - 0.039], 0));
  for (const x of [-0.3, 0.3]) made.add(can(0.01, 0.07, steel, [x, 0.316, -D / 2 - 0.026], 8).rotateZ(Math.PI / 2));
  for (const k of [-1, 1]) for (let i = 0; i < 5; i++) made.add(G.box(0.006, 0.012, 0.5, black, [k * (W / 2 + 0.019), 0.12 + i * 0.03, 0], 0));
  const plate = patch(0.26, 0.0975, typePlate('DISPLAY CASE', ['SEE-THROUGH FRONT PANE', '230 V ~  50 Hz  150 W']), [-0.3, 0.2, -D / 2 - 0.0284], 0, 0, 1, 1);
  plate.rotation.y = Math.PI;
  made.add(plate, can(0.02, 0.02, black, [-0.7, 0.09, -D / 2 - 0.025], 8).rotateX(Math.PI / 2), lead([[-0.7, 0.09, -D / 2 - 0.03], [-0.7, 0.07, -D / 2 - 0.06], [-0.71, 0.014, -D / 2 - 0.05], [-0.76, 0.012, -D / 2 - 0.02]], 0.011, black, 12));
  // the thing on show: a twin-bell alarm clock, keeping the same time as the picture in front of it
  const dial = screen(256, 256);
  const cy = y0 + 0.58;
  const clock = G.group();
  // a painted drum with a rolled back edge, a chromed bezel, the dial behind a domed glass
  const drum = G.lathe([[0, -0.09], [0.272, -0.09], [0.292, -0.082], [0.3, -0.062], [0.3, 0.09]], red, 44);
  const bezel = G.lathe([[0.3, 0.07], [0.322, 0.078], [0.328, 0.096], [0.318, 0.112], [0.298, 0.118], [0.275, 0.094]], chrome, 44);
  const dome = G.lathe([[0.285, 0], [0.25, 0.02], [0.18, 0.032], [0.09, 0.038], [0, 0.04]], M.glass(0x9fb6b8, 0.05, 0.6), 28);
  for (const part of [drum, bezel, dome]) part.rotation.x = Math.PI / 2;
  dome.position.z = 0.094;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.275, 44), M.printed(dial, 0.6)); face.position.z = 0.092;
  clock.add(drum, bezel, dome, face);
  // on the back: the cover, a key each for the going and the alarm, and a knob each to set the hands
  clock.add(G.rod([0, 0, -0.09], [0, 0, -0.098], 0.24, steel, 32));
  for (const sx of [-1, 1]) {
    clock.add(G.rod([sx * 0.1, -0.06, -0.098], [sx * 0.1, -0.06, -0.128], 0.008, brass, 6), block(0.075, 0.034, 0.006, brass, [sx * 0.1, -0.06, -0.131], 0.003).rotateZ(sx * 0.6));
    clock.add(G.rod([sx * 0.07, 0.11, -0.098], [sx * 0.07, 0.11, -0.124], 0.016, brass, 10));
  }
  for (const sx of [-1, 1]) {
    // a bell is a pressed cup with a rolled lip, on a post, held by a nut. The handle springs from the two nuts
    const cup = G.lathe([[0, 0.124], [0.062, 0.108], [0.1, 0.078], [0.12, 0.04], [0.124, 0.006], [0.13, 0], [0.133, 0.012], [0.126, 0.046], [0.105, 0.086], [0.068, 0.117], [0.03, 0.131], [0, 0.133]], chrome, 24);
    const bell = G.group(cup, can(0.018, 0.03, chrome, [0, 0.146, 0], 8), G.rod([0, -0.07, 0], [0, 0.13, 0], 0.01, steel, 6));
    bell.position.set(sx * 0.19, 0.3, 0); bell.rotation.z = -sx * 0.5;
    clock.add(bell, G.rod([sx * 0.14, -0.2, 0], [sx * 0.24, -0.36, 0.02], 0.022, chrome, 8), G.sph(0.03, chrome, [sx * 0.24, -0.36, 0.02], 10));
  }
  clock.add(G.rod([0, 0.29, 0], [0, 0.4, 0], 0.012, steel, 6), G.sph(0.034, steel, [0, 0.42, 0], 10));
  clock.add(lead([[-0.262, 0.435, 0], [-0.21, 0.52, 0], [-0.1, 0.572, 0], [0.1, 0.572, 0], [0.21, 0.52, 0], [0.262, 0.435, 0]], 0.011, chrome, 20, 8));
  clock.position.set(0, cy, -0.05);
  made.add(clock, G.cyl(0.42, 0.2, M.cloth(0x1c2030), [0, y0 + 0.1, -0.05], 40));
  root.add(fused(made));
  // the case lights its own contents, so the clock can still be seen when the hall goes dark
  const lamp = new THREE.PointLight(0xfff0dc, 1.6, 4, 1.6); lamp.position.set(0, y0 + H - 0.15, 0.25);
  root.add(lamp);
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9fe8ff, view: [16, 8], surface: s.canvas,
    // a standing visitor square to the pane: from this height the ring on the glass sits round the clock behind it
    views: { pane: { at: [0.8, 1.2, 1.8], to: [0.1, 1, 0.3], fov: 34, play: 0.1 }, window: { room: true, at: [0, 0.62, 3], to: [0, 0.94, -0.05], fov: 42, play: 0.14 } },
    update: ({ t }) => {
      const n = now();
      if (n.s !== stamp) {
        stamp = n.s;
        const d = dial.ctx;
        d.fillStyle = '#f6f1e2'; d.beginPath(); d.arc(128, 128, 128, 0, 7); d.fill();
        d.fillStyle = '#17191c'; d.font = '700 30px "Sofia Sans Extra Condensed Variable", sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle';
        for (let h = 1; h <= 12; h++) { const a = (h / 12) * Math.PI * 2; d.fillText(String(h), 128 + Math.sin(a) * 98, 130 - Math.cos(a) * 98); }
        // a tick for every minute round the edge, a longer one at every fifth
        d.strokeStyle = '#17191c'; d.lineCap = 'butt';
        for (let m = 0; m < 60; m++) { const a = (m / 60) * Math.PI * 2, r0 = m % 5 ? 119 : 115; d.lineWidth = m % 5 ? 1.2 : 2.6; d.beginPath(); d.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0); d.lineTo(128 + Math.sin(a) * 124, 128 - Math.cos(a) * 124); d.stroke(); }
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
  const root = G.group(), made = G.group();
  const s = screen(512, 448);
  // the drum, where the sheet leaves it (at the front, going straight up), and the bar that holds its free edge
  const YC = 0.25, ZC = -0.06, R = 0.15, RS = R + 0.003, ZF = ZC + RS, TOP = 1.66, ZT = -0.243, WRAP = 1.0, ROWS = 72;
  // The line of the sheet seen from the side, in small steps: the last of a turn still on the drum, then up from the
  // front of the drum, forward in a belly, and back to the bar. It stands upright at both ends, which makes the S.
  const side: [number, number][] = [];
  for (let i = 0; i < 30; i++) { const a = -WRAP * (1 - i / 30); side.push([YC + RS * Math.sin(a), ZC + RS * Math.cos(a)]); }
  for (let i = 0; i <= 200; i++) { const v = i / 200; side.push([YC + v * (TOP - YC), ZF + (0.2 * v * v * (1 - v) ** 3) / 0.03456 - (ZF - ZT) * (3 - 2 * v) * v * v]); }
  const run = [0];
  for (let i = 1; i < side.length; i++) run.push(run[i - 1] + Math.hypot(side[i][0] - side[i - 1][0], side[i][1] - side[i - 1][1]));
  const total = run[run.length - 1], wound = RS * WRAP;
  // rows at equal steps along that line, so that the picture is not stretched where the sheet leans
  const rows: [number, number][] = [];
  for (let k = 0, j = 1; k <= ROWS; k++) {
    const at = (total * k) / ROWS;
    while (j < run.length - 1 && run[j] < at) j++;
    const f = (at - run[j - 1]) / Math.max(1e-6, run[j] - run[j - 1]);
    rows.push([side[j - 1][0] + (side[j][0] - side[j - 1][0]) * f, side[j - 1][1] + (side[j][1] - side[j - 1][1]) * f]);
  }
  const geo = new THREE.PlaneGeometry(1.7, 1.5, 1, ROWS), p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const k = Math.round(((p.getY(i) + 0.75) / 1.5) * ROWS); // 0 on the drum, ROWS at the free edge
    p.setY(i, rows[k][0]); p.setZ(i, rows[k][1]);
    // the picture begins where the sheet leaves the drum. What is still wound on wears the picture's lowest line.
    uv.setY(i, ((total * k) / ROWS - wound) / (total - wound));
  }
  geo.computeVertexNormals();
  const front = new THREE.Mesh(geo, M.lit(s, 1.45, 0.5));
  const backMat = M.plastic(0x1c1d20, 0.5); backMat.side = THREE.BackSide;
  const back = new THREE.Mesh(geo, backMat);
  const steel = M.steel(1), plate = M.steel(), dark = M.dark(), black = M.black(), rubber = M.rubber();
  // the sheet winds on to a drum that lies in a housing open to the front and the top
  const drum = can(R, 1.98, M.plastic(0x0e0f10, 0.35), [0, YC, ZC], 40); drum.rotation.z = Math.PI / 2;
  const shell: [number, number][] = [];
  for (let k = 0; k <= 11; k++) { const a = ((-30 - k * 20) * Math.PI) / 180; shell.push([ZC + 0.2 * Math.cos(a), YC + 0.2 * Math.sin(a)]); }
  for (let k = 11; k >= 0; k--) { const a = ((-30 - k * 20) * Math.PI) / 180; shell.push([ZC + 0.184 * Math.cos(a), YC + 0.184 * Math.sin(a)]); }
  made.add(drum, G.profile(shell, 1.98, dark, undefined, 0.003), G.rbox(2.3, 0.05, 0.7, 0.02, dark, [0, 0.025, -0.06]));
  for (const x of [-1.03, 1.03]) {
    const end = can(0.215, 0.08, plate, [x, YC, ZC], 40); end.rotation.z = Math.PI / 2;
    made.add(end, G.box(0.08, 0.2, 0.44, steel, [x, 0.14, ZC]), can(0.05, 0.1, dark, [x + Math.sign(x) * 0.02, YC, ZC], 16).rotateZ(Math.PI / 2));
    made.add(heads([[x + Math.sign(x) * 0.04, YC + 0.15, ZC], [x + Math.sign(x) * 0.04, YC - 0.075, ZC + 0.13], [x + Math.sign(x) * 0.04, YC - 0.075, ZC - 0.13]], 0.014, dark, [Math.sign(x), 0, 0]));
  }
  // a knob on the right-hand end turns the drum, and the lead to the sheet goes in through the axle on the left
  made.add(can(0.07, 0.03, dark, [1.125, YC, ZC], 18).rotateZ(Math.PI / 2), can(0.022, 0.012, rubber, [-1.1, 0.056, ZC - 0.17], 8));
  made.add(lead([[-1.1, YC, ZC], [-1.13, YC - 0.03, ZC - 0.01], [-1.128, 0.13, ZC - 0.08], [-1.1, 0.062, ZC - 0.17]], 0.01, black, 14));
  // a bar clamps the free edge and keeps it flat across the width. It hangs between two posts that stand beside the
  // sheet and not behind it
  made.add(G.rbox(2.24, 0.05, 0.03, 0.012, plate, [0, TOP + 0.01, ZT]));
  for (const x of [-1.1, 1.1]) {
    made.add(G.rod([x, 0.05, ZT], [x, TOP + 0.01, ZT], 0.014, steel, 10), can(0.042, 0.014, plate, [x, 0.057, ZT], 14), block(0.06, 0.075, 0.056, dark, [x, TOP + 0.01, ZT], 0.006));
    made.add(G.rod([x, TOP + 0.01, ZT - 0.028], [x, TOP + 0.01, ZT - 0.05], 0.013, plate, 8));
  }
  for (const x of [-1.05, 1.05]) for (const z of [-0.33, 0.21]) made.add(can(0.05, 0.03, rubber, [x, -0.015, z], 14, 0.044));
  root.add(front, back, fused(made));
  return {
    root, inDark: 'glows', glow: 0x7fe0c0, view: [34, 10], surface: s.canvas,
    views: { back: { at: [1.2, 1.3, -3.2], to: [0, 0.9, 0], fov: 38, play: 0.12 }, edge: { at: [1.95, 0.75, 0.95], to: [0.9, 0.6, 0] } },
    update: ({ t }) => {
      const c = s.ctx;
      for (let y = 0; y < 448; y += 8) { c.fillStyle = hsl(160 + 70 * Math.sin(y / 70 + t * 0.9), 85, 30 + 14 * Math.sin(y / 31 - t)); c.fillRect(0, y, 512, 8); }
      bigTime(c, 512, 448, now().hhmm, '#ffffff', 800, 0.42);
      s.tex.needsUpdate = true;
    },
  };
}

/** The four upright sides of a box, mapped from bottom to top: a shaft of light wears a picture that fades as it rises. */
function shaft(w: number, h: number, d: number, mat: THREE.Material, p: V3): THREE.Mesh {
  const sides = [0, 1, 2, 3].map((k) => new THREE.PlaneGeometry(k % 2 ? d : w, h).translate(0, 0, (k % 2 ? w : d) / 2).rotateY((k * Math.PI) / 2));
  return put(new THREE.Mesh(G.merge(sides), mat), p);
}

/** The top of the board under the cut pixel: two gold pads under every lamp, tracks to a common rail, a row of plated holes. */
function lampBoard(): THREE.CanvasTexture {
  const s = screen(512, 128), c = s.ctx;
  c.fillStyle = '#1d5236'; c.fillRect(0, 0, 512, 128);
  c.fillStyle = '#2f774e'; c.fillRect(0, 5, 512, 8);
  for (const x of [110, 256, 402]) {
    c.fillStyle = '#2f774e'; c.fillRect(x - 44, 9, 9, 14); c.fillRect(x + 35, 9, 9, 14);
    c.fillStyle = '#c9a23f'; c.fillRect(x - 64, 12, 60, 106); c.fillRect(x + 4, 12, 60, 106);
    c.strokeStyle = '#d9d6c7'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 82, 22); c.lineTo(x - 70, 22); c.moveTo(x - 76, 16); c.lineTo(x - 76, 28); c.stroke();
  }
  c.fillStyle = '#9fb3a2';
  for (let x = 12; x < 512; x += 24) { c.beginPath(); c.arc(x, 122, 2.6, 0, 7); c.fill(); }
  s.tex.needsUpdate = true;
  return s.tex;
}

/**
 * Quantum dots. In front, one pixel of a screen cut open and enlarged: blue lamps below, a film with three wells
 * above them. Large dots turn the blue light red, small dots turn it green, and the third well lets it through.
 * Behind stands the screen the pixel belongs to, showing the time.
 */
export function quantumDots(): Built {
  const root = G.group(), made = G.group();
  const s = screen(512, 288), W = 512, H = 288;
  const dark = M.dark(), black = M.black(), steel = M.steel(1), brass = M.brass(), ceramic = M.ceramic();
  const FILM = 0.42, TALL = 0.28, Z = 0.25, XS = [-0.6, 0, 0.6], COLOURS = [0xff2b1c, 0x22e04a, 0x2a5cff];
  made.add(G.rbox(2.6, 0.06, 1.7, 0.02, M.wood(0x3a2a1c), [0, 0.03, -0.1]));
  // the screen the pixel is taken from: a thin panel with its electronics in a swelling on the back, on a foot with a slim neck
  made.add(G.slab(2.2, 1.32, 0.035, 0.07, dark, [0, 1.4, -0.72], 0.012), G.rbox(1.25, 0.62, 0.09, 0.03, dark, [0, 1.3, -0.79]));
  made.add(block(0.14, 1.18, 0.03, steel, [0, 0.675, -0.855], 0.006), block(0.9, 0.025, 0.36, steel, [0, 0.0725, -0.74], 0.008), block(0.3, 0.3, 0.014, steel, [0, 1.2, -0.84], 0.004));
  made.add(heads([[-0.11, 1.31, -0.847], [0.11, 1.31, -0.847], [-0.11, 1.09, -0.847], [0.11, 1.09, -0.847]], 0.012, brass, [0, 0, -1]));
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) made.add(G.box(0.3, 0.012, 0.006, black, [sx * 0.4, 1.42 + i * 0.032, -0.8365], 0));
  // its lead leaves a recess on the back and goes down through the board the whole model stands on
  made.add(G.box(0.24, 0.1, 0.006, black, [0.42, 1.12, -0.8365], 0), can(0.03, 0.008, M.rubber(), [0.34, 0.064, -0.87], 10));
  made.add(lead([[0.42, 1.1, -0.838], [0.42, 1.0, -0.89], [0.36, 0.5, -0.905], [0.34, 0.14, -0.9], [0.34, 0.06, -0.87]], 0.012, black, 22));
  root.add(G.plane(2.08, 1.17, M.lit(s, 1.35), [0, 1.4, -0.6845]));
  // the slice: a board of blue lamps, a sheet of glass, the film with its three wells, and a sheet of glass on top.
  // The layers are held apart on brass pillars so that the light can be seen on its way up.
  const boardTop = G.plane(2.1, 0.5, new THREE.MeshStandardMaterial({ map: lampBoard(), roughness: 0.5, metalness: 0.15 }), [0, 0.1606, Z]);
  boardTop.rotation.x = -Math.PI / 2;
  made.add(G.box(2.1, 0.08, 0.5, M.pcb(), [0, 0.12, Z], 0), boardTop);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) made.add(can(0.036, 0.02, brass, [sx * 0.95, 0.07, Z + sz * 0.18], 8), can(0.019, 0.225, brass, [sx * 1.0, 0.2725, Z + sz * 0.2], 6), can(0.032, 0.014, brass, [sx * 1.0, 0.167, Z + sz * 0.2], 6));
  const pane = M.glass(0xb9c9c6, 0.16), ground = groundEdge();
  for (const y of [FILM - 0.02, FILM + TALL + 0.015]) { const sheet = sheetOfGlass(2.1, 0.5, 0.03, pane, ground, [0, y, Z]); sheet.rotation.x = -Math.PI / 2; made.add(sheet); }
  // the film: black walls with sloping sides stand round every well. The front one is cut away to show what is in them
  const wall = new THREE.Shape([new THREE.Vector2(-0.06, 0), new THREE.Vector2(0.06, 0), new THREE.Vector2(0.04, TALL), new THREE.Vector2(-0.04, TALL)]);
  for (const x of [-0.9, -0.3, 0.3, 0.9]) made.add(G.extruded(wall, 0.46, black, [x, FILM, Z], 0.004));
  made.add(G.box(1.84, TALL, 0.04, black, [0, FILM + TALL / 2, Z - 0.21], 0));
  // the lamps: a blue chip on a white tile, with the gold fingers that spread the current over it and the wire that brings it
  const lampsLit = XS.map((x) => {
    const m = M.glow(0x2a5cff, 2);
    root.add(G.box(0.4, 0.026, 0.3, m, [x, 0.195, Z], 0));
    made.add(block(0.46, 0.022, 0.36, ceramic, [x, 0.171, Z], 0.004), G.box(0.34, 0.003, 0.014, brass, [x, 0.2094, Z - 0.125], 0), can(0.028, 0.004, brass, [x + 0.15, 0.2098, Z + 0.105], 10));
    for (const k of [-1, 0, 1]) made.add(G.box(0.012, 0.003, 0.2, brass, [x + k * 0.1, 0.2094, Z - 0.02], 0));
    made.add(lead([[x + 0.15, 0.211, Z + 0.105], [x + 0.185, 0.25, Z + 0.125], [x + 0.214, 0.186, Z + 0.15]], 0.004, brass, 8, 5));
    return m;
  });
  // light on its way: blue from each lamp up to its well, and whatever colour the well gives off above it
  const fade = screen(4, 64), grade = fade.ctx.createLinearGradient(0, 64, 0, 0);
  grade.addColorStop(0, '#ffffff'); grade.addColorStop(1, '#3c3c3c');
  fade.ctx.fillStyle = grade; fade.ctx.fillRect(0, 0, 4, 64); fade.tex.needsUpdate = true;
  const rising = XS.map((x, i) => {
    const m = M.add(fade, 0x2a5cff, 0.2);
    root.add(shaft(0.4, 0.175, 0.3, m, [x, 0.2975, Z]));
    // in the well with no dots the blue goes straight on through
    if (i === 2) root.add(shaft(0.4, TALL, 0.3, m, [x, FILM + TALL / 2, Z]));
    return m;
  });
  const leaving = XS.map((x, i) => { const m = M.add(fade, COLOURS[i], 0.2); root.add(shaft(0.46, 0.5, 0.4, m, [x, FILM + TALL + 0.28, Z])); return m; });
  // the resin that fills the wells takes a little of the colour of the dots stirred into it
  [0xff9a7c, 0xb4ff8a, 0xe6f0ff].forEach((tint, i) => root.add(G.box(0.5, TALL - 0.004, 0.41, M.glass(tint, i < 2 ? 0.15 : 0.07), [XS[i], FILM + TALL / 2, Z + 0.025], 0)));
  // the dots themselves, as the crystals they are: few and large for red, many and small for green, none where the blue passes
  const sown = (count: number, r: number, colour: number, x0: number) => {
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colour).multiplyScalar(0.3), emissive: colour, emissiveIntensity: 1.8, roughness: 0.35, flatShading: true });
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(r, 0), mat, count);
    const at = new THREE.Matrix4(), turn = new THREE.Quaternion(), tilt = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), placed: number[] = [];
    let seed = count * 7919 + 13;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i++) {
      // a few tries at a place clear of the dots already there: crystals held in a resin do not pass through each other
      for (let k = 0; k < 6; k++) {
        p.set(x0 + (rnd() - 0.5) * (0.44 - 2 * r), FILM + r + 0.008 + rnd() * (TALL - 2 * r - 0.016), Z + 0.025 + (rnd() - 0.5) * (0.39 - 2 * r));
        let clear = true;
        for (let j = 0; j < placed.length && clear; j += 3) clear = (p.x - placed[j]) ** 2 + (p.y - placed[j + 1]) ** 2 + (p.z - placed[j + 2]) ** 2 > 4.2 * r * r;
        if (clear) break;
      }
      placed.push(p.x, p.y, p.z);
      mesh.setMatrixAt(i, at.compose(p, turn.setFromEuler(tilt.set(rnd() * 6.3, rnd() * 6.3, rnd() * 6.3)), one));
    }
    // they glow, and they sit inside a well: their shadows would not be seen
    mesh.userData.noShadow = true;
    root.add(mesh);
    return mat;
  };
  const dotsLit = [sown(46, 0.034, COLOURS[0], XS[0]), sown(118, 0.019, COLOURS[1], XS[1])];
  // where the three colours meet again: one pixel, as the eye sees it. A strip of opal plastic clamped between two posts
  const mixed = M.glow(0xffffff, 1.5);
  root.add(block(1.96, 0.04, 0.46, mixed, [0, FILM + TALL + 0.56, Z], 0.008));
  for (const sx of [-1, 1]) {
    made.add(G.rod([sx * 1.12, 0.06, Z], [sx * 1.12, 1.31, Z], 0.013, steel, 10), can(0.045, 0.012, steel, [sx * 1.12, 0.066, Z], 14), block(0.2, 0.052, 0.08, dark, [sx * 1.05, FILM + TALL + 0.56, Z], 0.006));
    made.add(G.rod([sx * 1.12, FILM + TALL + 0.56, Z + 0.04], [sx * 1.12, FILM + TALL + 0.56, Z + 0.066], 0.014, brass, 8));
  }
  root.add(fused(made));
  const hue = new THREE.Color();
  let drawn = '', due = 0;
  return {
    views: { screen: { at: [0, 1.45, 3.4], to: [0, 1.35, -0.4], fov: 36, play: 0.2 }, pixel: { at: [0.45, 1, 1.45], to: [0, 0.45, 0.15], fov: 34, play: 0.1 } },
    root, inDark: 'glows', glow: 0x9db4ff, view: [22, 14], surface: s.canvas,
    update: ({ t }) => {
      hue.setHSL((t * 0.045) % 1, 1, 0.5);
      const level = [hue.r, hue.g, hue.b];
      level.forEach((v, i) => { lampsLit[i].emissiveIntensity = 0.25 + 2.3 * v; rising[i].opacity = 0.04 + 0.24 * v; leaving[i].opacity = 0.03 + 0.3 * v; });
      // no brighter than the picture can hold without paling: the purity of the two colours is the point of the dots
      dotsLit[0].emissiveIntensity = 0.1 + 1.3 * level[0]; dotsLit[1].emissiveIntensity = 0.1 + 1.15 * level[1];
      mixed.emissive.copy(hue);
      const text = now().hhmm;
      if (text !== drawn || t > due) {
        const { ctx } = s, band = ctx.createLinearGradient(0, 0, W, H);
        for (let i = 0; i <= 6; i++) band.addColorStop(i / 6, hsl((t * 16 + i * 60) % 360, 96, 46));
        ctx.fillStyle = band; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.fillRect(0, H * 0.24, W, H * 0.52);
        bigTime(ctx, W, H, text, '#ffffff', 800, 0.5);
        s.tex.needsUpdate = true; drawn = text; due = t + 0.2;
      }
    },
  };
}
