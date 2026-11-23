import { G, M, Swarm, glows, screen, THREE, type Built, type V3 } from '../kit';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { dots, now } from '../../sims/draw';

const FONT = '"Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';

// ---------- what the pieces of this hall share ----------

type P = [number, number];

/** A closed outline with its corners eased. `r` is how far along each side the curve starts: one value, or one for each corner. */
function eased(pts: P[], r: number | number[], n = 4): P[] {
  const out: P[] = [];
  pts.forEach((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const t = Math.min(Array.isArray(r) ? r[i] : r, la * 0.45, lb * 0.45);
    if (t <= 0) { out.push(p); return; }
    const p0: P = [p[0] + ((a[0] - p[0]) / la) * t, p[1] + ((a[1] - p[1]) / la) * t], p1: P = [p[0] + ((b[0] - p[0]) / lb) * t, p[1] + ((b[1] - p[1]) / lb) * t];
    for (let k = 0; k <= n; k++) { const u = k / n, v = 1 - u; out.push([v * v * p0[0] + 2 * u * v * p[0] + u * u * p1[0], v * v * p0[1] + 2 * u * v * p[1] + u * u * p1[1]]); }
  });
  return out;
}

const turns = (pts: P[]): number => pts.reduce((sum, p, i) => { const q = pts[(i + 1) % pts.length]; return sum + p[0] * q[1] - q[0] * p[1]; }, 0);

/** A convex outline with every side moved inwards by `d`, or outwards if `d` is negative. */
function inset(pts: P[], d: number): P[] {
  const s = turns(pts) > 0 ? 1 : -1, n = pts.length;
  const sides = pts.map((p, i) => { const q = pts[(i + 1) % n], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy); return { x: p[0] - (dy / l) * s * d, y: p[1] + (dx / l) * s * d, dx, dy }; });
  return sides.map((b, i) => { const a = sides[(i + n - 1) % n], t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / (a.dx * b.dy - a.dy * b.dx); return [a.x + a.dx * t, a.y + a.dy * t] as P; });
}

const blankUv = (geo: THREE.BufferGeometry): THREE.BufferGeometry => geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));

/**
 * A skin over a row of outlines, each a list of [z, y] at its own x and all of the same length, closed at both ends.
 * This is how a moulded shell is drawn: the outline shrinks towards the end and the corner comes out round.
 */
function loft(rows: { x: number; pts: P[] }[]): THREE.BufferGeometry {
  if (rows[0].x > rows[rows.length - 1].x) rows = [...rows].reverse();
  const n = rows[0].pts.length, ccw = turns(rows[0].pts) > 0, pos: number[] = [], idx: number[] = [];
  for (const r of rows) for (const [z, y] of r.pts) pos.push(r.x, y, z);
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = i * n + ((j + 1) % n), c = a + n, d = b + n;
    if (ccw) idx.push(a, d, b, a, c, d); else idx.push(a, b, d, a, d, c);
  }
  // the two ends are fans about their middles, on corners of their own so that the edge stays crisp
  [rows[0], rows[rows.length - 1]].forEach((r, end) => {
    const base = pos.length / 3;
    pos.push(r.x, r.pts.reduce((s, p) => s + p[1], 0) / n, r.pts.reduce((s, p) => s + p[0], 0) / n);
    for (const [z, y] of r.pts) pos.push(r.x, y, z);
    for (let j = 0; j < n; j++) { const a = base + 1 + j, b = base + 1 + ((j + 1) % n); if (ccw === (end === 0)) idx.push(base, a, b); else idx.push(base, b, a); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx); geo.computeVertexNormals();
  return blankUv(geo);
}

/**
 * A moulded plate lying flat with its top at y = 0, and round holes through it whose rims are eased.
 * Only what can be seen is made: the top, the walls of the holes and the edge.
 */
function holed(w: number, d: number, t: number, holes: P[], rh: number, c: number, seg = 20): THREE.BufferGeometry {
  const edge = (i: number) => eased([[-w / 2 + i, -d / 2 + i], [w / 2 - i, -d / 2 + i], [w / 2 - i, d / 2 - i], [-w / 2 + i, d / 2 - i]], 0.02, 2);
  const top = edge(c), rim = edge(0), n = top.length;
  const shape = new THREE.Shape(top.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const [x, z] of holes) { const path = new THREE.Path(); path.absarc(x, -z, rh + c, 0, Math.PI * 2, true); shape.holes.push(path); }
  const parts: THREE.BufferGeometry[] = [new THREE.ShapeGeometry(shape, seg / 2).rotateX(-Math.PI / 2)];
  // a wall drawn from the top down faces inwards
  for (const [x, z] of holes) parts.push(new THREE.LatheGeometry([new THREE.Vector2(rh + c, 0), new THREE.Vector2(rh, -c), new THREE.Vector2(rh, -t)], seg).translate(x, 0, z));
  const pos: number[] = [], idx: number[] = [];
  for (const [ring, y] of [[top, 0], [rim, -c], [rim, -t]] as const) for (const [x, z] of ring) pos.push(x, y, z);
  for (let r = 0; r < 2; r++) for (let j = 0; j < n; j++) { const a = r * n + j, b = r * n + ((j + 1) % n); idx.push(a, b, a + n, b, b + n, a + n); }
  const skirt = new THREE.BufferGeometry();
  skirt.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  skirt.setIndex(idx); skirt.computeVertexNormals();
  parts.push(blankUv(skirt));
  return G.merge(parts);
}

/** Flat faces, each a list of its corners in order, counter-clockwise as seen from outside. */
function faceted(faces: V3[][]): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const f of faces) for (let i = 1; i < f.length - 1; i++) pos.push(...f[0], ...f[i], ...f[i + 1]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return blankUv(geo);
}

/**
 * A finish from the kit worked out from somewhere else than the plain position of each point: `glsl` says where, in
 * terms of `position`. This is how grain is made to run along a slanted part, or to differ between copies of one.
 */
function regrain<T extends THREE.MeshStandardMaterial>(m: T, glsl: string, key: string): T {
  const base = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => { base.call(m, sh, r); sh.vertexShader = sh.vertexShader.replace('vObj = position;', `vObj = ${glsl};`); };
  m.customProgramCacheKey = () => `finish-${key}`;
  return m;
}

/** One colour for a whole shape, for parts of different stuff that are drawn as one. */
function tinted(geo: THREE.BufferGeometry, colour: number): THREE.BufferGeometry {
  const c = new THREE.Color(colour), n = geo.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  return geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
}

/**
 * Everything fixed under `root` becomes one mesh for each material it is made of, with its place baked in, so that a
 * model of two hundred parts is a dozen things to draw. Whatever moves is kept out with `userData.loose`, on itself
 * or on a group above it. Wood keeps its grain along the axes of the whole model, not of the part.
 */
function fuse(root: THREE.Object3D): void {
  root.updateMatrixWorld(true);
  const home = new THREE.Matrix4().copy(root.matrixWorld).invert(), m4 = new THREE.Matrix4();
  const found: THREE.Mesh[] = [];
  const visit = (o: THREE.Object3D): void => {
    if (o.userData.loose || o.userData.noFit) return;
    const m = o as THREE.Mesh;
    if (m.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material) && !m.material.transparent && !m.children.length && !m.renderOrder) found.push(m);
    else for (const kid of o.children) visit(kid);
  };
  visit(root);
  const lots = new Map<string, { mat: THREE.Material; bare: boolean; geos: THREE.BufferGeometry[] }>();
  for (const m of found) {
    const mat = m.material as THREE.Material, bare = !!m.userData.noShadow, key = mat.uuid + (bare ? '-' : '+');
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) blankUv(g);
    g.applyMatrix4(m4.multiplyMatrices(home, m.matrixWorld));
    // a part that was mirrored into place has its faces the wrong way round
    if (m4.determinant() < 0) for (const a of Object.values(g.attributes)) { const arr = a.array, s = a.itemSize; for (let i = 0; i < arr.length; i += 3 * s) for (let k = 0; k < s; k++) { const t = arr[i + s + k]; arr[i + s + k] = arr[i + 2 * s + k]; arr[i + 2 * s + k] = t; } }
    if (!lots.has(key)) lots.set(key, { mat, bare, geos: [] });
    lots.get(key)!.geos.push(g);
    m.removeFromParent(); m.geometry.dispose();
  }
  for (const { mat, bare, geos } of lots.values()) {
    const one = new THREE.Mesh(geos.length > 1 ? G.merge(geos) : geos[0], mat);
    if (bare) one.userData.noShadow = true;
    root.add(one);
  }
}

/** A spur gear lying in the plane of y and z, turning about x. `first` is where one of its teeth points, as an angle from +z towards +y. */
function gear(teeth: number, pitch: number, deep: number, thick: number, first = 0): THREE.BufferGeometry {
  const pts: P[] = [], tau = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) for (const [k, r] of [[-0.29, pitch - deep / 2], [-0.14, pitch + deep / 2], [0.14, pitch + deep / 2], [0.29, pitch - deep / 2]]) { const a = first + (i + k) * tau; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
  // teeth are cut, not moulded: every face flat
  const geo = loft([{ x: -thick / 2, pts }, { x: thick / 2, pts }]).toNonIndexed();
  geo.computeVertexNormals();
  return geo;
}

/** Split-flap: six digit modules, HH MM SS, in one steel case. The top leaf of each falls forward to show the next numeral. */
export function splitFlap(): Built {
  const root = G.group();
  // The ten numerals are printed in five columns and two rows, and the next numeral is always one column on and one
  // row on, round the edges. Sliding the whole sheet by one place then moves every waiting leaf one numeral forward.
  const CW = 204, CH = 340, atlas = screen(CW * 5, CH * 2), g = atlas.ctx;
  g.fillStyle = '#17191b'; g.fillRect(0, 0, CW * 5, CH * 2);
  g.font = `800 ${CH * 0.98}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let n = 0; n < 10; n++) {
    const x = (n % 5) * CW, y = (1 - (n % 2)) * CH;
    g.save(); g.beginPath(); g.rect(x, y, CW, CH); g.clip();
    g.fillStyle = '#f3f1e9'; g.fillText(String(n), x + CW / 2, y + CH * 0.55);
    // the lower leaf hangs a little behind the upper one, in its shadow
    const shade = g.createLinearGradient(0, y + CH / 2, 0, y + CH * 0.56); shade.addColorStop(0, 'rgba(0,0,0,.34)'); shade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = shade; g.fillRect(x, y + CH / 2, CW, CH * 0.06);
    g.fillStyle = '#000'; g.fillRect(x, y + CH / 2 - 2.5, CW, 5);
    g.restore();
  }
  atlas.tex.needsUpdate = true;

  const W = 0.5, H = 0.84, L = H / 2;
  const half = () => { const t = atlas.tex.clone(); t.repeat.set(0.2, 0.25); t.needsUpdate = true; return t; };
  const leaf = (t: THREE.Texture) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.62 });
  // A leaf is a rectangle with two round corners at its free edge and, at the hinge, a notch in each side that leaves
  // a small ear. The ears are the pivots: they sit in holes in the rims of the drum.
  const flap = (pose: 'up' | 'down' | 'behind') => {
    const o = eased([[-W / 2, 0], [W / 2, 0], [W / 2, 0.012], [W / 2 - 0.03, 0.012], [W / 2 - 0.03, 0.058], [W / 2, 0.058], [W / 2, L], [-W / 2, L], [-W / 2, 0.058], [-W / 2 + 0.03, 0.058], [-W / 2 + 0.03, 0.012], [-W / 2, 0.012]], [0, 0, 0, 0, 0, 0, 0.024, 0.024, 0, 0, 0, 0], 3);
    const geo = new THREE.ShapeGeometry(new THREE.Shape(o.map(([x, y]) => new THREE.Vector2(x, y))));
    if (pose === 'down') geo.rotateZ(Math.PI); else if (pose === 'behind') geo.rotateY(Math.PI);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pose === 'up' ? pos.getY(i) / L : pose === 'down' ? 1 + pos.getY(i) / L : 1 - pos.getY(i) / L);
    return geo;
  };
  const xs = [-1.5, -0.97, -0.265, 0.265, 0.97, 1.5];
  const dark = M.dark(), pin = M.steel(), brass = M.brass(0), white = M.plastic(0xf3f1e9, 0.5);
  // Twenty leaves to a drum, each on two pins in the rim of the end plates. Two face the hall. Of the rest, the next six
  // stand in a sheaf behind the top one and lean on it, and the others hang where they fell. [height, depth] of each
  // hinge, and which way its leaf points from there.
  const RIM = 0.105, AXLE = -0.14, LEAF = L - 0.01, STOOD = 6;
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
        const n = (side > 0 ? k : k + 1) % 10, u0 = (n % 5) / 5, v0 = (n % 2) / 2 + 0.25, v1 = v0 + side * 0.25;
        const a = [-W / 2, y0, z0, u0, v0], b = [W / 2, y0, z0, u0 + 0.2, v0], c = [W / 2, y1, z1, u0 + 0.2, v1], d = [-W / 2, y1, z1, u0, v1];
        for (const p of side > 0 ? [a, b, c, a, c, d] : [a, d, c, a, c, b]) { pos.push(p[0], p[1], p[2]); nor.push(0, ny, nz); uv.push(p[3], p[4]); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return geo;
  })();
  // What turns the drum: a small motor above and behind it, where it can be seen from the hall side, and a train of
  // three wheels down the outer side of the module, where there is room: a pinion on the motor, an idler on a stub
  // in the partition and a wheel on the spindle. The pinion turns three times for one turn of the drum.
  const MESH = 1.83, R1 = 0.1275, R2 = 0.1133, R3 = 0.0425, at = (r: number): [number, number] => [r * Math.sin(MESH), AXLE + r * Math.cos(MESH)];
  const IDLER = at(R1 + R2), MOTOR = at(R1 + 2 * R2 + R3);
  const wheels = new Swarm(G.merge([gear(18, R1, 0.016, 0.018, MESH), new THREE.CylinderGeometry(0.032, 0.032, 0.05, 14).rotateZ(Math.PI / 2)]), brass, xs.length);
  const idlers = new Swarm(gear(16, R2, 0.016, 0.018, MESH + Math.PI + Math.PI / 16), brass, xs.length);
  const pinions = new Swarm(gear(6, R3, 0.016, 0.022, MESH + Math.PI), brass, xs.length);
  const pins = new Swarm(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6).rotateZ(Math.PI / 2), pin, xs.length * 40);
  const sheaf = new Swarm(new THREE.BoxGeometry(W, LEAF, 0.004).translate(0, LEAF / 2, 0), M.plastic(0x1b1d1f, 0.7), xs.length * waiting.length);
  const leaves = G.group();
  leaves.userData.loose = true;
  const up = flap('up'), down = flap('down'), behind = flap('behind');
  const mods = xs.map((x, n) => {
    const tex = { top: half(), bot: half(), front: half(), back: half(), fan: atlas.tex.clone() };
    tex.fan.wrapS = tex.fan.wrapT = THREE.RepeatWrapping; tex.fan.needsUpdate = true;
    const top = new THREE.Mesh(up, leaf(tex.top)), bot = new THREE.Mesh(down, leaf(tex.bot));
    top.position.x = bot.position.x = x;
    const pivot = G.group(new THREE.Mesh(up, leaf(tex.front)), new THREE.Mesh(behind, leaf(tex.back)));
    pivot.children[1].position.z = -0.002;
    pivot.position.set(x, 0, 0.004);
    const prints = new THREE.Mesh(printed, leaf(tex.fan));
    prints.position.x = x;
    leaves.add(top, bot, pivot, prints);
    // the drum: a spindle between two end plates
    root.add(G.rod([x - 0.262, 0, AXLE], [x + 0.262, 0, AXLE], 0.022, pin), new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 28).rotateZ(Math.PI / 2).translate(x - 0.256, 0, AXLE), pin), new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 28).rotateZ(Math.PI / 2).translate(x + 0.256, 0, AXLE), pin));
    waiting.forEach((l, i) => sheaf.put(n * waiting.length + i, x, l.hy, l.hz, Math.atan2(l.uz, l.uy), 0, 0));
    for (let k = 0; k < 20; k++) for (const end of [0, 1]) { const [hy, hz] = hinge(k); pins.put(n * 40 + k * 2 + end, x + (end ? 0.256 : -0.256), hy, hz); }
    // the two fingers that hold each leaf up until the drum has carried its hinge far enough round
    root.add(G.box(0.022, 0.06, 0.016, pin, [x - 0.2, 0.427, 0.015], 0.004), G.box(0.022, 0.06, 0.016, pin, [x + 0.2, 0.427, 0.015], 0.004));
    const o = n % 2 ? 1 : -1, gx = x + o * 0.292;
    root.add(G.cyl(0.045, 0.19, pin, [x + o * 0.13, MOTOR[0], MOTOR[1]], 16).rotateZ(Math.PI / 2), G.cyl(0.047, 0.03, dark, [x + o * 0.03, MOTOR[0], MOTOR[1]], 16).rotateZ(Math.PI / 2), G.rod([x + o * 0.22, MOTOR[0], MOTOR[1]], [x + o * 0.305, MOTOR[0], MOTOR[1]], 0.01, pin, 8));
    // the motor lies on a shelf folded out of the back, and the idler runs on a stub from the partition
    root.add(G.box(0.2, 0.012, MOTOR[1] + 0.385, dark, [x + o * 0.13, MOTOR[0] - 0.051, (MOTOR[1] - 0.305) / 2], 0), G.rod([gx - o * 0.02, IDLER[0], IDLER[1]], [x + o * 0.34, IDLER[0], IDLER[1]], 0.012, pin, 8));
    root.add(G.box(0.012, 0.03, 0.02, brass, [x + o * 0.01, MOTOR[0] + 0.02, MOTOR[1]], 0), G.box(0.012, 0.03, 0.02, brass, [x + o * 0.01, MOTOR[0] - 0.02, MOTOR[1]], 0));
    return { tex, pivot, gx, shown: -1, next: -1, p: 1, steps: 0 };
  });
  // `leavesOn` is how many leaves the drum has turned past, and may be part of one
  const turn = (i: number, gx: number, leavesOn: number) => {
    const a = (leavesOn % 20) * (Math.PI / 10);
    wheels.put(i, gx, 0, AXLE, a, 0, 0); idlers.put(i, gx, IDLER[0], IDLER[1], -a * 1.125, 0, 0); pinions.put(i, gx, MOTOR[0], MOTOR[1], 3 * a, 0, 0);
  };
  mods.forEach((m, i) => turn(i, m.gx, 0));
  pins.done(); sheaf.done(); wheels.done(); idlers.done(); pinions.done();
  root.add(leaves, pins.mesh, sheaf.mesh, wheels.mesh, idlers.mesh, pinions.mesh);
  // One case of folded steel, open above so that the drums show: a back, a floor, a partition between every two
  // modules, and a frame round the windows. The bar across the top of the windows carries the fingers, and is kept
  // slim so that the sheaves can be seen over it.
  const CWID = 3.72, CHT = 1.06;
  root.add(G.box(CWID, CHT, 0.03, dark, [0, 0, -0.36]), G.box(CWID, 0.03, 0.44, dark, [0, -CHT / 2, -0.15]), G.box(CWID + 0.06, 0.05, 0.5, pin, [0, -CHT / 2 - 0.04, -0.15]));
  for (const x of [-CWID / 2, -1.235, -0.6175, 0, 0.6175, 1.235, CWID / 2]) root.add(G.box(0.03, CHT, 0.44, dark, [x, 0, -0.15]));
  for (const x of [-CWID / 2, -0.6175, 0.6175, CWID / 2]) root.add(G.box(0.075, CHT, 0.02, dark, [x, 0, 0.065], 0.006));
  root.add(G.box(CWID, 0.04, 0.03, dark, [0, 0.447, 0.036], 0.006), G.box(CWID + 0.03, 0.075, 0.055, dark, [0, -CHT / 2 + 0.0375, 0.0475], 0.008));
  for (const x of [-0.6175, 0.6175]) for (const y of [0.16, -0.16]) root.add(G.cyl(0.036, 0.016, white, [x, y, 0.083], 20).rotateX(Math.PI / 2));
  // the back comes off for service: a pressed cover on ten screws, and the maker's plate
  root.add(G.box(CWID - 0.3, CHT - 0.24, 0.014, dark, [0, 0, -0.38], 0.006), G.box(0.34, 0.13, 0.006, pin, [1.3, -0.24, -0.389], 0));
  for (const x of [-1.62, -0.81, 0, 0.81, 1.62]) for (const y of [-0.36, 0.36]) root.add(G.cyl(0.02, 0.01, pin, [x, y, -0.39], 10).rotateX(Math.PI / 2));
  // the ends are screwed to the folded edges of the back and the floor
  for (const s of [-1, 1]) for (const [y, z] of [[0.46, -0.3], [-0.46, -0.3], [-0.46, 0], [0, -0.3]]) root.add(G.cyl(0.018, 0.01, pin, [s * (CWID / 2 + 0.017), y, z], 10).rotateZ(Math.PI / 2));
  // two tubes carry it, flanged under the shelf and bolted down through their foot plates
  for (const x of [-1.3, 1.3]) {
    root.add(G.cyl(0.042, 0.4, pin, [x, -CHT / 2 - 0.26, -0.15], 20), G.cyl(0.085, 0.022, pin, [x, -CHT / 2 - 0.076, -0.15], 20), G.cyl(0.07, 0.03, pin, [x, -CHT / 2 - 0.44, -0.15], 20), G.rbox(0.36, 0.04, 0.6, 0.015, pin, [x, -CHT / 2 - 0.47, -0.1]));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.cyl(0.022, 0.016, pin, [x + sx * 0.13, -CHT / 2 - 0.445, -0.1 + sz * 0.24], 6));
  }
  fuse(root);

  const set = (t: THREE.Texture, d: number, top = false) => { t.offset.set((d % 5) / 5, (d % 2) / 2 + (top ? 0.25 : 0)); };
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
        if (m.shown < 0) { m.shown = m.next = d[i]; set(m.tex.top, d[i], true); set(m.tex.front, d[i], true); set(m.tex.bot, d[i]); set(m.tex.back, d[i]); set(m.tex.fan, d[i]); }
        if (m.p >= 1 && d[i] !== m.shown) {
          m.next = d[i]; m.p = 0; m.steps++;
          // every leaf that is waiting is now one place nearer the front
          set(m.tex.top, m.next, true); set(m.tex.back, m.next); set(m.tex.front, m.shown, true); set(m.tex.bot, m.shown); set(m.tex.fan, m.next);
        }
        if (m.p < 1) {
          m.p = Math.min(1, m.p + dt / 0.3);
          m.pivot.rotation.x = Math.PI * m.p * m.p;
          if (m.p >= 1) { m.shown = m.next; set(m.tex.bot, m.shown); set(m.tex.front, m.shown, true); m.pivot.rotation.x = 0; }
          // the motor turns the drum one leaf on
          turn(i, m.gx, m.steps - 1 + m.p);
          wheels.mesh.instanceMatrix.needsUpdate = idlers.mesh.instanceMatrix.needsUpdate = pinions.mesh.instanceMatrix.needsUpdate = true;
        }
      });
    },
  };
}

/** Flip-disc: a board of two-faced discs, each turned over by a magnetic pulse and then left alone. */
export function flipDisc(): Built {
  const root = G.group();
  const COLS = 29, ROWS = 9, P = 0.1, N = COLS * ROWS, D = Math.SQRT1_2;
  // One disc, drawn as one thing in four colours: a yellow face, a black back and rim, the ends of the wire it turns
  // on, and across the back the small magnet it carries, set square to the wire.
  const YELLOW = 0xf2d21b, BLACK = 0x101112, FERRITE = 0x2b2d30, WIRE = 0x9aa0a6;
  const face = new THREE.CircleGeometry(0.044, 24);
  const disc = G.merge([
    tinted(face.clone().translate(0, 0, 0.003), YELLOW), tinted(face.clone().rotateY(Math.PI).translate(0, 0, -0.003), BLACK),
    tinted(new THREE.CylinderGeometry(0.044, 0.044, 0.006, 24, 1, true).rotateX(Math.PI / 2), BLACK),
    tinted(new THREE.BoxGeometry(0.034, 0.012, 0.003).rotateZ(-Math.PI / 4).translate(0, 0, -0.0045), FERRITE),
    ...[-1, 1].map((s) => tinted(new THREE.CylinderGeometry(0.0018, 0.0018, 0.014, 4, 1, true).rotateZ(-Math.PI / 4).translate(s * 0.048 * D, s * 0.048 * D, 0), WIRE)),
  ]);
  const paint = M.plastic(0xffffff, 0.6); paint.vertexColors = true;
  const discs = new Swarm(disc, paint, N);
  const ang = new Float32Array(N).fill(Math.PI);
  const tgt = new Float32Array(N).fill(Math.PI);
  // Each disc turns on a wire that runs corner to corner, in two small bearing posts. On the other two corners, just
  // off its rim, stand the two ends of an iron core, each wound with its coil. A pulse through the coils magnetises
  // the core one way or the other, the magnet on the disc is drawn over to match, and the core stays magnetised.
  const AXLE = new THREE.Vector3(1, 1, 0).normalize();
  const pos = (c: number, r: number): V3 => [(c - (COLS - 1) / 2) * P, ((ROWS - 1) / 2 - r) * P, 0];
  const turned = (pts: P[]) => new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), 8).rotateX(Math.PI / 2);
  const stator = G.merge([-1, 1].flatMap((s) => [
    tinted(turned([[0.0115, -0.015], [0.0115, -0.004]]), 0x8a4a26), tinted(turned([[0.0115, -0.004], [0.007, -0.004]]), 0x8a4a26),
    tinted(turned([[0.007, -0.004], [0.007, 0.004]]), WIRE), tinted(new THREE.CircleGeometry(0.007, 8).translate(0, 0, 0.004), WIRE),
  ].map((g) => g.translate(s * 0.037, -s * 0.037, 0)).concat(tinted(new THREE.BoxGeometry(0.012, 0.012, 0.02).rotateZ(Math.PI / 4).translate(s * 0.038, s * 0.038, -0.005), 0x33363a))));
  const works = new Swarm(stator, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.7 }), N);
  for (let i = 0; i < N; i++) {
    const [x, y] = pos(i % COLS, Math.floor(i / COLS));
    discs.spin(i, x, y, 0, AXLE, Math.PI);
    works.put(i, x, y, 0);
  }
  discs.done(); works.done();
  const BW = COLS * P, BH = ROWS * P;
  const steel = M.steel(), dark = M.dark(), black = M.black(), rubber = M.rubber();
  const bare = (geo: THREE.BufferGeometry, mat: THREE.Material, p: V3) => { const m = new THREE.Mesh(geo, mat); m.position.set(p[0], p[1], p[2]); return m; };
  root.add(discs.mesh, works.mesh, G.box(BW + 0.06, BH + 0.06, 0.03, black, [0, 0, -0.03], 0.004));
  // Weatherproof housing, as on the front of a bus: a frame of aluminium section screwed to a steel box.
  root.add(G.bezel(BW + 0.26, BH + 0.26, BW + 0.04, BH + 0.04, 0.012, 0.14, steel, [0, 0, 0.01], 0.04, 0.014), G.rbox(BW + 0.22, BH + 0.22, 0.2, 0.03, dark, [0, 0, -0.14]));
  for (const x of [-1.525, -0.55, 0.55, 1.525]) for (const y of [-0.525, 0.525]) root.add(bare(new THREE.CylinderGeometry(0.017, 0.017, 0.006, 10).rotateX(Math.PI / 2), dark, [x, y, 0.082]));
  // The back opens for service: a door on two hinges with two quarter-turn catches, louvres to let the damp out,
  // the maker's plate, and the lead out through a gland underneath and down into the foot of one post.
  root.add(G.box(2.3, 0.8, 0.012, M.enamel(0x4a5056), [0, 0, -0.246], 0.004), G.box(0.3, 0.1, 0.004, steel, [0.35, -0.3, -0.254], 0));
  for (let i = 0; i < 6; i++) root.add(G.box(1.1, 0.022, 0.008, black, [-0.3, 0.2 - i * 0.056, -0.254], 0));
  for (const x of [-0.8, 0.8]) {
    root.add(bare(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 8).rotateZ(Math.PI / 2), steel, [x, 0.408, -0.25]), bare(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 12).rotateX(Math.PI / 2), steel, [x, -0.34, -0.256]), G.box(0.012, 0.05, 0.01, steel, [x, -0.34, -0.264], 0));
  }
  root.add(bare(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 10), steel, [0.84, -BH / 2 - 0.13, -0.17]), G.wire([[0.84, -BH / 2 - 0.15, -0.17], [0.84, -BH / 2 - 0.27, -0.2], [0.9, -BH / 2 - 0.4, -0.2], [0.93, -BH / 2 - 0.475, -0.16]], 0.018, rubber), bare(new THREE.CylinderGeometry(0.03, 0.03, 0.016, 10), rubber, [0.93, -BH / 2 - 0.468, -0.16]));
  for (const x of [-1, 1]) {
    root.add(bare(new THREE.CylinderGeometry(0.035, 0.035, 0.37, 16, 1, true), steel, [x, -BH / 2 - 0.295, -0.12]), bare(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 16), steel, [x, -BH / 2 - 0.12, -0.12]));
    root.add(bare(new THREE.LatheGeometry([[0.2, 0], [0.2, 0.024], [0.19, 0.034], [0, 0.034]].map(([r, y]) => new THREE.Vector2(r, y)), 32), steel, [x, -BH / 2 - 0.5075, -0.12]));
    for (let k = 0; k < 4; k++) root.add(bare(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 6), steel, [x + Math.cos(k * Math.PI / 2 + 0.785) * 0.15, -BH / 2 - 0.468, -0.12 + Math.sin(k * Math.PI / 2 + 0.785) * 0.15]));
  }
  fuse(root);
  let last = 0, first = true, stamp = '', d = dots('');
  return {
    root, inDark: 'vanishes', view: [20, 8], zoom: 1.06,
    views: {
      kerb: { room: true, at: [-2.3, 0, 2.1], to: [-0.4, 0.15, 0], fov: 52 },
      discs: { at: [-1.5, -0.62, 0.62], to: [-1, -0.28, 0] },
    },
    update: ({ t }) => {
      const dt = Math.min(0.1, t - last); last = t;
      const n = now();
      if (n.hhmm !== stamp) { stamp = n.hhmm; d = dots(stamp); }
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
          discs.spin(i, (c - (COLS - 1) / 2) * P, ((ROWS - 1) / 2 - r) * P, 0, AXLE, ang[i]);
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
  const steel = M.steel(), brass = M.brass(2), black = M.black(), japan = M.enamel(0x15171a), bakelite = M.plastic(0x2b1c14, 0.32), copper = M.copper(0), fibre = M.plastic(0x6b4a30, 0.8);
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, p?: V3) => { const m = new THREE.Mesh(geo, mat); if (p) m.position.set(p[0], p[1], p[2]); return m; };
  // a shape turned about the shaft, which runs front to back: [radius, distance along the shaft]
  const spun = (pts: P[], seg: number) => new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg).rotateX(Math.PI / 2);
  // What turns: the sheet with its rolled edge, clamped by six screws between the flanges of a brass boss, and behind
  // it on the same shaft an iron wheel with thirty teeth, one for each line of the picture.
  const disc = G.group(
    new THREE.Mesh(cut, plate), part(new THREE.TorusGeometry(1.0, 0.006, 6, 72), steel),
    part(spun([[0.05, -0.075], [0.09, -0.075], [0.09, -0.012], [0.16, -0.012], [0.16, 0.012], [0.075, 0.012], [0.075, 0.035], [0.05, 0.045], [0.05, -0.075]], 32), brass),
    part(gear(30, 0.2, 0.034, 0.03).rotateY(Math.PI / 2), steel, [0, 0, -0.13]),
  );
  for (let k = 0; k < 6; k++) disc.add(part(new THREE.CylinderGeometry(0.013, 0.013, 0.008, 6).rotateX(Math.PI / 2), steel, [Math.cos(k * Math.PI / 3) * 0.125, Math.sin(k * Math.PI / 3) * 0.125, 0.016]));
  fuse(disc);
  disc.userData.loose = true;
  disc.position.set(0, CY, 0);
  root.add(disc);
  // baseboard and feet
  const oak = M.wood(0x6e4a2a), rubber = M.rubber();
  root.add(G.rbox(2.6, 0.12, 1.1, 0.03, oak, [0, 0.06, -0.05]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(part(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 14), rubber, [sx * 1.19, -0.02, -0.05 + sz * 0.44]));
  // The motor: a japanned shell between two end bells, brush caps at the back, on a cast pedestal bolted to the board.
  // Its speed is set by hand. The toothed wheel on its shaft runs between two coils fed with the picture signal, which
  // pull it into step with the disc at the sending end: that is all that holds the picture still.
  const shell = part(spun([[0, -0.56], [0.1, -0.56], [0.165, -0.535], [0.185, -0.48], [0.185, -0.47], [0.2, -0.47], [0.2, -0.22], [0.185, -0.22], [0.185, -0.21], [0.165, -0.165], [0.1, -0.14], [0.06, -0.14], [0.06, -0.1], [0, -0.1]], 40), japan, [0, CY, 0]);
  root.add(shell, G.rod([0, CY, -0.1], [0, CY, 0.07], 0.03, steel, 16), part(spun([[0.03, 0.045], [0.05, 0.045], [0.05, 0.065], [0.035, 0.08], [0, 0.08]], 6), steel, [0, CY, 0]));
  root.add(G.profile(eased([[-0.54, 0.17], [-0.14, 0.17], [-0.14, 0.21], [-0.22, 0.27], [-0.26, 0.9], [-0.21, CY - 0.13], [-0.47, CY - 0.13], [-0.42, 0.9], [-0.46, 0.27], [-0.54, 0.21]], [0.01, 0.01, 0.01, 0.05, 0.1, 0, 0, 0.1, 0.05, 0.01], 3), 0.26, japan, undefined, 0.02), G.box(0.5, 0.05, 0.46, japan, [0, 0.145, -0.34], 0.012));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) root.add(part(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 6), steel, [sx * 0.2, 0.18, -0.34 + sz * 0.18]));
    root.add(part(new THREE.CylinderGeometry(0.036, 0.036, 0.06, 12).rotateZ(Math.PI / 2), bakelite, [sx * 0.2, CY, -0.5]));
    // one coil of the synchroniser: copper on a fibre bobbin, on an iron core that ends just short of the teeth
    root.add(G.box(0.2, 0.05, 0.05, steel, [sx * 0.335, CY, -0.13], 0.004), part(new THREE.CylinderGeometry(0.068, 0.068, 0.1, 18).rotateZ(Math.PI / 2), copper, [sx * 0.34, CY, -0.13]));
    for (const e of [0.285, 0.395]) root.add(part(new THREE.CylinderGeometry(0.084, 0.084, 0.012, 18).rotateZ(Math.PI / 2), fibre, [sx * e, CY, -0.13]));
    root.add(G.box(0.03, 0.05, 0.11, steel, [sx * 0.43, CY, -0.17], 0.004));
  }
  // the coils hang from a band clamped round the nose of the motor, and the maker's plate follows the shell
  root.add(part(new THREE.CylinderGeometry(0.206, 0.206, 0.034, 32, 1, true).rotateX(Math.PI / 2), steel, [0, CY, -0.24]), part(new THREE.CylinderGeometry(0.2025, 0.2025, 0.08, 6, 1, true, Math.PI - 0.32, 0.64).rotateX(Math.PI / 2), brass, [0, CY, -0.37]));
  for (const sx of [-1, 1]) root.add(G.box(0.26, 0.05, 0.022, steel, [sx * 0.32, CY, -0.215], 0.004));
  // The neon lamp stands behind the right-hand edge of the disc. Its cathode is a flat plate that glows all over,
  // and the brightness of that glow is the picture signal. A wire frame in front of the plate is the anode.
  const LX = 0.84, LZ = -0.27;
  const img = screen(120, 280);
  const bulb = G.lathe([[0.075, -0.56], [0.085, -0.5], [0.14, -0.42], [0.195, -0.33], [0.2, -0.2], [0.2, 0.3], [0.185, 0.39], [0.13, 0.46], [0.06, 0.495], [0, 0.5]], M.bulb(0xa9bab6, 0.75, 0x2a0e04), 40, true);
  bulb.position.set(LX, CY, LZ);
  root.add(bulb, G.plane(0.32, 0.7, M.glow(0xff5a1e, 0.6), [LX, CY, -0.17]), G.box(0.33, 0.71, 0.008, steel, [LX, CY, -0.176], 0));
  root.add(G.wire([[LX - 0.148, CY - 0.36, -0.156], [LX + 0.148, CY - 0.36, -0.156], [LX + 0.148, CY + 0.36, -0.156], [LX - 0.148, CY + 0.36, -0.156]], 0.006, steel, true, 4));
  for (const sx of [-1, 1]) root.add(G.rod([LX + sx * 0.05, CY - 0.36, -0.176 + (sx > 0 ? 0.026 : 0)], [LX + sx * 0.04, CY - 0.56, LZ], 0.006, steel, 5));
  root.add(part(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 12), M.glass(0xb9c9c6, 0.3, 0.6), [LX, CY - 0.49, LZ]));
  // its cap, the holder it plugs into, and a pillar from the board
  root.add(G.cyl(0.09, 0.1, bakelite, [LX, CY - 0.6, LZ], 24), part(new THREE.CylinderGeometry(0.093, 0.093, 0.022, 24), brass, [LX, CY - 0.565, LZ]), G.cyl(0.125, 0.07, bakelite, [LX, CY - 0.685, LZ], 24, 0.11));
  root.add(G.rod([LX, 0.12, LZ], [LX, CY - 0.72, LZ], 0.028, steel, 14), part(new THREE.CylinderGeometry(0.075, 0.085, 0.03, 16), steel, [LX, 0.135, LZ]));
  root.add(G.plane(0.27, 0.63, M.lit(img, 1.6, 0), [LX, CY, 0.012]));
  // The viewing hood: a mask close to the disc, a tunnel to keep the room out, and a round reading lens in a brass
  // cell on the front board. The picture is the size of a postage stamp and the lens makes it worth looking at.
  const hood = M.wood(0x4a321d, 2), board = M.wood(0x4a321d, 1), HW = 0.72, HH = 0.9;
  root.add(G.bezel(HW, HH, 0.266, 0.626, 0.012, 0.03, black, [LX, CY, 0.05], 0.02, 0.006));
  for (const s of [-1, 1]) root.add(G.box(0.035, HH, 0.44, hood, [LX + s * (HW / 2 - 0.0175), CY, 0.27]), G.box(HW - 0.07, 0.035, 0.44, hood, [LX, CY + s * (HH / 2 - 0.0175), 0.27]));
  const front = new THREE.Shape(eased([[-HW / 2, -HH / 2], [HW / 2, -HH / 2], [HW / 2, HH / 2], [-HW / 2, HH / 2]], 0.02, 2).map(([x, y]) => new THREE.Vector2(x, y)));
  const eye = new THREE.Path(); eye.absarc(0, 0, 0.3, 0, Math.PI * 2, true); front.holes.push(eye);
  root.add(part(blankUv(new THREE.ExtrudeGeometry(front, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 22 })), board, [LX, CY, 0.492]));
  root.add(part(spun([[0.292, 0], [0.335, 0], [0.335, 0.012], [0.312, 0.012], [0.312, 0.034], [0.292, 0.034], [0.292, 0]], 48), brass, [LX, CY, 0.52]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) root.add(part(new THREE.CylinderGeometry(0.014, 0.014, 0.008, 8).rotateX(Math.PI / 2), brass, [LX + sx * 0.31, CY + sy * 0.4, 0.528]));
  const glass = part(new THREE.SphereGeometry(0.296, 32, 12).scale(1, 1, 0.16), M.glass(0x9fb6b8, 0.07, 0.75), [LX, CY, 0.53]);
  root.add(glass, G.box(0.12, CY - HH / 2 - 0.12, 0.16, board, [LX, (CY - HH / 2 + 0.12) / 2, 0.27]), G.box(0.3, 0.04, 0.3, board, [LX, 0.14, 0.27], 0.01));
  // On the board in front: the speed control, a ring of resistance wire swept by an arm under a knob, and four
  // terminals for the signal and the supply. Flex runs from them to the motor, the coils and the lamp.
  const RX = -0.82, RZ = 0.2, flex = M.plastic(0x5b2019, 0.9);
  root.add(G.cyl(0.165, 0.05, bakelite, [RX, 0.145, RZ], 32), part(new THREE.TorusGeometry(0.13, 0.024, 6, 30, 5.2).rotateX(Math.PI / 2).rotateY(-0.54), steel, [RX, 0.176, RZ]));
  root.add(G.box(0.14, 0.008, 0.026, brass, [RX + 0.05, 0.207, RZ + 0.045], 0).rotateY(-0.73), part(new THREE.LatheGeometry([[0.02, 0], [0.02, 0.05], [0.058, 0.05], [0.064, 0.06], [0.05, 0.1], [0.04, 0.108], [0, 0.11]].map(([r, y]) => new THREE.Vector2(r, y)), 20), bakelite, [RX, 0.17, RZ]));
  root.add(G.box(0.58, 0.035, 0.11, bakelite, [-0.15, 0.1375, 0.38], 0.006));
  for (let i = 0; i < 4; i++) root.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.075, 8), brass, [-0.36 + i * 0.14, 0.19, 0.38]), part(new THREE.CylinderGeometry(0.032, 0.032, 0.022, 10), brass, [-0.36 + i * 0.14, 0.2, 0.38]));
  root.add(G.wire([[-0.36, 0.165, 0.37], [-0.5, 0.135, 0.3], [-0.66, 0.135, 0.27], [RX + 0.12, 0.16, RZ + 0.03]], 0.011, flex, false, 5));
  root.add(G.wire([[RX - 0.02, 0.16, RZ - 0.15], [-0.7, 0.135, -0.1], [-0.36, 0.135, -0.3], [-0.2, 0.2, -0.4], [-0.15, 0.6, -0.44], [-0.19, CY - 0.1, -0.5]], 0.011, flex, false, 5));
  root.add(G.wire([[-0.22, 0.165, 0.37], [-0.2, 0.135, 0.1], [-0.17, 0.135, -0.2], [-0.155, 0.3, -0.3], [-0.155, 0.95, -0.3], [-0.25, CY - 0.06, -0.235], [-0.42, CY - 0.035, -0.232]], 0.011, flex, false, 5));
  root.add(G.wire([[0.06, 0.165, 0.37], [0.3, 0.135, 0.2], [0.6, 0.135, -0.1], [LX - 0.05, 0.15, LZ + 0.02], [LX - 0.045, 0.4, LZ + 0.03], [LX - 0.11, CY - 0.7, LZ + 0.02]], 0.011, flex, false, 5));
  fuse(root);
  // the neon's orange at sixteen strengths, for a lit line and for an unlit one
  const tone = (lit: number) => Array.from({ length: 16 }, (_, k) => { const v = lit * (0.55 + 0.45 * (k / 15)); return `rgba(255,${90 + Math.round(60 * v)},30,${v})`; });
  const bright = tone(1), dim = tone(0.12);
  let stamp = '', top = dots('00'), bottom = dots('00');
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
      if (n.hhmm !== stamp) { stamp = n.hhmm; top = dots(stamp.slice(0, 2)); bottom = dots(stamp.slice(3)); }
      const sweep = (t * 12.5) % 1;
      for (let line = 0; line < 30; line++) {
        const fresh = Math.round((1 - ((((line / 30 - sweep) % 1) + 1) % 1)) * 15);
        for (let y = 0; y < 70; y++) {
          const gx = Math.floor((line - 4) / 2), gy = y < 35 ? Math.floor((y - 6) / 3.4) : Math.floor((y - 41) / 3.4);
          c.fillStyle = ((y < 35 ? top : bottom).on(gx, gy) ? bright : dim)[fresh];
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
  // Every tile is its own piece of wood: sawn square, its front edges eased, no two of quite the same colour or
  // figure. It is glued to a small block, the block is screwed to the horn of a servo, and so the tile swings about
  // the servo's shaft, which lies a little behind it.
  const H = 0.045, T = 0.014, C = 0.0035, OFF = 0.018, ZP = -OFF, zf = OFF + T / 2, zb = OFF - T / 2, zc = zf - C;
  const tile = G.merge([faceted([
    [[-H + C, -H + C, zf], [H - C, -H + C, zf], [H - C, H - C, zf], [-H + C, H - C, zf]],
    [[-H, -H, zc], [H, -H, zc], [H - C, -H + C, zf], [-H + C, -H + C, zf]], [[H, -H, zc], [H, H, zc], [H - C, H - C, zf], [H - C, -H + C, zf]],
    [[H, H, zc], [-H, H, zc], [-H + C, H - C, zf], [H - C, H - C, zf]], [[-H, H, zc], [-H, -H, zc], [-H + C, -H + C, zf], [-H + C, H - C, zf]],
    [[-H, -H, zb], [H, -H, zb], [H, -H, zc], [-H, -H, zc]], [[H, -H, zb], [H, H, zb], [H, H, zc], [H, -H, zc]],
    [[H, H, zb], [-H, H, zb], [-H, H, zc], [H, H, zc]], [[-H, H, zb], [-H, -H, zb], [-H, -H, zc], [-H, H, zc]],
    [[-H, -H, zb], [-H, H, zb], [H, H, zb], [H, -H, zb]],
  ]), new THREE.BoxGeometry(0.012, 0.016, zb + 0.004).translate(0, 0, (zb - 0.004) / 2)]);
  const tiles = new Swarm(tile, regrain(M.wood(0xc19460, 0), 'position + vec3(instanceMatrix[3].y * 17.3, instanceMatrix[3].x * 23.7 + instanceMatrix[3].y * 5.3, instanceMatrix[3].x * 7.1 + instanceMatrix[3].y * 3.3)', 'tile'), N);
  const horns = new Swarm(new THREE.CylinderGeometry(0.011, 0.011, 0.0035, 8).rotateZ(Math.PI / 2).translate(-0.00775, 0, 0), M.plastic(0xefeee6, 0.5), N);
  horns.mesh.instanceMatrix = tiles.mesh.instanceMatrix;
  const tilt = new Float32Array(N);
  // Behind every tile, its servo: a small blue case lying on its side, the shaft along the row, screwed by a flange
  // to a rail. Its three-wire lead drops into the loom that runs under the row.
  const BLUE = 0x1f3a63;
  const servo = G.merge([
    tinted(new THREE.BoxGeometry(0.03, 0.02, 0.044).translate(-0.0275, 0, -0.016), BLUE), tinted(new THREE.BoxGeometry(0.036, 0.032, 0.003).translate(-0.0275, 0, -0.0395), BLUE),
    tinted(new THREE.CylinderGeometry(0.0062, 0.0062, 0.003, 8, 1, true).rotateZ(Math.PI / 2).translate(-0.011, 0, 0), 0xefeee6),
    ...[0x5a3a1c, 0xb3261e, 0xe08a1e].map((c, k) => tinted(new THREE.PlaneGeometry(0.0024, 0.036).translate(-0.031 + k * 0.0028, -0.028, -0.03), c)),
  ]);
  const servos = new Swarm(servo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }), N);
  for (let i = 0; i < N; i++) {
    const [x, y] = cells[i], h = Math.abs(Math.sin(i * 12.9898 + 4.1) * 43758.5453) % 1, q = Math.abs(Math.sin(i * 78.233 + 1.7) * 12543.21) % 1, v = 0.8 + 0.32 * h;
    servos.put(i, x, y, ZP);
    tiles.tint(i, v * (1 + 0.05 * q), v, v * (1 - 0.1 * q));
  }
  servos.done();
  root.add(tiles.mesh, horns.mesh, servos.mesh);
  // The rails the servos are screwed to, one to a row, on uprights between the top and bottom of the frame, and the
  // loom under each row. Rails and back board are black, so that the gaps between the tiles stay dark.
  const alu = M.steel(0); alu.color.set(0xb3b7bb); alu.roughness = 0.5;
  const black = M.black(), rubber = M.rubber(), rail = M.dark();
  for (let r = 0; r < K; r++) {
    const y = ((K - 1) / 2 - r) * P, n = cells.filter((c) => Math.abs(c[1] - y) < 0.001).length;
    root.add(G.box(n * P - 0.01, 0.03, 0.0125, rail, [0, y, ZP - 0.04725], 0), G.rod([-n * P / 2 + 0.01, y - 0.046, ZP - 0.03], [n * P / 2 - 0.01, y - 0.046, ZP - 0.03], 0.005, rubber, 5));
  }
  const IN = 1.21, DIN = 1.812, WIDE = 0.125, octagon = (flat: number, diag: number): P[] => { const s = diag - flat; return [[-s, -flat], [s, -flat], [flat, -s], [flat, s], [s, flat], [-s, flat], [-flat, s], [-flat, -s]]; };
  for (const [x, len] of [[-0.4, 2 * IN], [0.4, 2 * IN], [-0.95, 2 * (DIN - 0.95)], [0.95, 2 * (DIN - 0.95)]]) root.add(G.box(0.03, len, 0.0135, rail, [x, 0, ZP - 0.06025], 0));
  const board = (flat: number, diag: number) => new THREE.Shape(octagon(flat, diag).map(([x, y]) => new THREE.Vector2(x, y)));
  root.add(G.extruded(board(IN + 0.01, DIN + 0.014), 0.02, black, [0, 0, -0.095], 0));
  // The frame: eight lengths of walnut moulding, mitred. The grain runs along each length, as it must.
  const walnut = M.wood(0x4f3420, 0), upright = M.wood(0x4f3420, 1);
  const slant = (s: string) => regrain(M.wood(0x4f3420, 0), `vec3((position.x ${s} position.y) * 0.7071, (position.y ${s === '+' ? '-' : '+'} position.x) * 0.7071, position.z)`, `slant${s}`);
  const woods = [walnut, slant('+'), upright, slant('-')];
  const section = eased([[0, -0.12], [WIDE, -0.12], [WIDE, 0.08], [0.034, 0.08], [0.034, 0.062], [0, 0.062]], [0, 0.004, 0.024, 0.006, 0.004, 0.007], 3);
  const inner = octagon(IN, DIN), outer = octagon(IN + WIDE, DIN + WIDE * Math.SQRT2);
  for (let k = 0; k < 8; k++) {
    const a = inner[k], b = inner[(k + 1) % 8], a1 = outer[k], b1 = outer[(k + 1) % 8];
    const at = (p: P, q: P, [u, z]: P): V3 => [p[0] + (q[0] - p[0]) * (u / WIDE), p[1] + (q[1] - p[1]) * (u / WIDE), z];
    root.add(new THREE.Mesh(toCreasedNormals(faceted(section.map((s, j) => { const s1 = section[(j + 1) % section.length]; return [at(a, a1, s), at(b, b1, s), at(b, b1, s1), at(a, a1, s1)]; })), 0.7), woods[k % 4]));
  }
  // the camera that watches the visitor looks out through the middle, on a stalk between four tiles
  root.add(G.rod([0, 0, -0.085], [0, 0, 0.032], 0.004, alu, 6), G.cyl(0.022, 0.026, black, [0, 0, 0.043], 20).rotateX(Math.PI / 2), G.cyl(0.013, 0.004, M.plastic(0x1a2a44, 0.1), [0, 0, 0.057], 16).rotateX(Math.PI / 2));
  // The back comes off to reach the works: a hardboard panel on screws, slots to let the heat of five hundred
  // motors out, a plain plate, and the mains lead down to the foot.
  const hard = M.paper(0x5e4c3a), bolt = (p: V3) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.005, 8).rotateX(Math.PI / 2), alu); m.position.set(p[0], p[1], p[2]); return m; };
  root.add(G.extruded(board(IN + 0.01, DIN + 0.014), 0.01, hard, [0, 0, -0.11], 0), G.box(0.26, 0.1, 0.004, alu, [-0.45, -0.95, -0.116], 0), G.box(0.12, 0.08, 0.02, black, [0.35, -0.95, -0.12], 0.004));
  for (const [x, y] of octagon(IN - 0.05, DIN - 0.07)) root.add(bolt([x, y, -0.1165]));
  for (const s of [-1, 1]) { root.add(bolt([0, s * (IN - 0.05), -0.1165]), bolt([s * (IN - 0.05), 0, -0.1165])); for (let k = 0; k < 5; k++) root.add(G.box(0.36, 0.018, 0.004, black, [s * 0.5, 0.72 + k * 0.045, -0.1155], 0)); }
  root.add(G.wire([[0.35, -0.99, -0.128], [0.35, -1.15, -0.16], [0.3, -1.45, -0.17], [0.22, -1.64, -0.2], [0.26, -1.7, -0.27]], 0.014, rubber, false, 6), G.cyl(0.026, 0.012, rubber, [0.26, -1.699, -0.275], 12));
  // the stand: a post braced to its foot, and a steel plate under the frame
  const brace = (s: number) => new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(s * 0.26, 0), new THREE.Vector2(0, 0.25)]);
  root.add(G.rbox(1.1, 0.07, 0.7, 0.02, walnut, [0, -R * 1.2 - 0.3, -0.03]), G.box(0.16, 0.358, 0.14, upright, [0, -1.526, -0.03]), G.box(0.34, 0.012, 0.2, alu, [0, -1.341, -0.02], 0.003));
  for (const s of [-1, 1]) root.add(G.extruded(brace(s), 0.04, walnut, [s * 0.08, -1.705, -0.03], 0.004), bolt([s * 0.13, -1.3495, 0.03]).rotateX(Math.PI / 2), bolt([s * 0.13, -1.3495, -0.07]).rotateX(Math.PI / 2));
  fuse(root);
  const put = (i: number) => tiles.put(i, cells[i][0], cells[i][1], ZP, tilt[i], 0, 0);
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
  // Thirty pins by thirty, as on the table at MIT. A pin is a long square rod, four fifths as wide as its place,
  // so there is a gap round every one. It does not grow: it slides up through the top, and what is not above the
  // table hangs below it.
  const N = 30, S = 1.68, P = S / N, LEN = 0.44, DECK = -0.455, HALF = S / 2 + 0.16, DEEP = 0.62, h = P * 0.4, C = 0.004;
  const pin = faceted([
    [[-h + C, 0, h - C], [h - C, 0, h - C], [h - C, 0, -h + C], [-h + C, 0, -h + C]],
    [[-h, -C, h], [h, -C, h], [h - C, 0, h - C], [-h + C, 0, h - C]], [[h, -C, h], [h, -C, -h], [h - C, 0, -h + C], [h - C, 0, h - C]],
    [[h, -C, -h], [-h, -C, -h], [-h + C, 0, -h + C], [h - C, 0, -h + C]], [[-h, -C, -h], [-h, -C, h], [-h + C, 0, h - C], [-h + C, 0, -h + C]],
    [[-h, -LEN, h], [h, -LEN, h], [h, -C, h], [-h, -C, h]], [[h, -LEN, h], [h, -LEN, -h], [h, -C, -h], [h, -C, h]],
    [[h, -LEN, -h], [-h, -LEN, -h], [-h, -C, -h], [h, -C, -h]], [[-h, -LEN, -h], [-h, -LEN, h], [-h, -C, h], [-h, -C, -h]],
  ]);
  const pins = new Swarm(pin, M.plastic(0xf4f4f1, 0.45), N * N);
  // Under each pin a nylon rod in its yellow sleeve goes down through a plate to a motorised slider, the kind found on
  // a mixing desk. The sliders stand six to a board in banks at the bottom, which is why the cabinet is so deep.
  const rods = new Swarm(new THREE.CylinderGeometry(0.007, 0.007, 1, 4, 1, true).translate(0, 0.5, 0), M.plastic(0xd8b64a, 0.5), N * N);
  const at = new Float32Array(N * N * 2);
  for (let i = 0; i < N * N; i++) {
    const x = ((i % N) - (N - 1) / 2) * P, z = (Math.floor(i / N) - (N - 1) / 2) * P;
    at[i * 2] = x; at[i * 2 + 1] = z;
    pins.put(i, x, 0.03, z); rods.put(i, x, DECK, z, 0, 0, 0, 1, 0.04, 1);
  }
  root.add(pins.mesh, rods.mesh);
  // The cabinet: a frame of aluminium section. The back is a steel panel with louvres. The other three sides are
  // clear sheet, so that the works can be watched.
  const alu = M.steel(1); alu.color.set(0xb7bbbf); alu.roughness = 0.45;
  const cab = M.plastic(0x2a2d31, 0.5), black = M.black(), steel = M.steel(), rubber = M.rubber();
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, p: V3) => { const m = new THREE.Mesh(geo, mat); m.position.set(p[0], p[1], p[2]); return m; };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.box(0.06, DEEP, 0.06, alu, [sx * (HALF - 0.03), -DEEP / 2, sz * (HALF - 0.03)], 0.006), part(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 16), rubber, [sx * (HALF - 0.11), -DEEP - 0.04, sz * (HALF - 0.11)]));
  for (const s of [-1, 1]) for (const y of [-0.029, -DEEP + 0.025]) root.add(G.box(2 * HALF - 0.12, 0.05, 0.06, alu, [0, y, s * (HALF - 0.03)], 0.006), G.box(0.06, 0.05, 2 * HALF - 0.12, alu, [s * (HALF - 0.03), y, 0], 0.006));
  root.add(G.box(2 * HALF - 0.04, 0.012, 2 * HALF - 0.04, cab, [0, -0.01, 0], 0), G.box(2 * HALF - 0.04, 0.012, 2 * HALF - 0.04, cab, [0, -DEEP + 0.006, 0], 0), G.box(2 * HALF - 0.1, 0.01, 2 * HALF - 0.1, cab, [0, DECK - 0.005, 0], 0));
  root.add(G.bezel(S + 0.34, S + 0.34, S + 0.012, S + 0.012, 0.004, 0.03, steel, [0, 0.012, 0], 0.045, 0.008).rotateX(-Math.PI / 2));
  for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4, r = k % 2 ? (S / 2 + 0.09) * Math.SQRT2 : S / 2 + 0.09; root.add(part(new THREE.CylinderGeometry(0.016, 0.016, 0.006, 10), black, [Math.cos(a) * r, 0.029, Math.sin(a) * r])); }
  root.add(G.box(2 * HALF - 0.12, DEEP - 0.1, 0.012, cab, [0, -DEEP / 2, -HALF + 0.02], 0), G.box(0.14, 0.09, 0.02, black, [0.62, -DEEP + 0.13, -HALF + 0.008], 0.004));
  for (let k = 0; k < 7; k++) root.add(G.box(S * 0.6, 0.018, 0.006, black, [-0.2, -0.2 - k * 0.042, -HALF + 0.013], 0));
  // the three sheets are one thing to draw: their edges are out of sight in the frame
  const sheet = () => new THREE.BoxGeometry(2 * HALF - 0.12, DEEP - 0.1, 0.012);
  root.add(part(G.merge([sheet().translate(0, 0, HALF - 0.02), sheet().rotateY(Math.PI / 2).translate(HALF - 0.02, 0, 0), sheet().rotateY(Math.PI / 2).translate(-HALF + 0.02, 0, 0)]), M.glass(0xb9c9c6, 0.08), [0, -DEEP / 2, 0]));
  // the mains lead, from its inlet in the back down to a plug that lies on the stand under the overhang, and a plain plate
  root.add(G.wire([[0.62, -DEEP + 0.13, -HALF + 0.004], [0.62, -DEEP + 0.02, -HALF + 0.012], [0.6, -DEEP - 0.05, -HALF + 0.03], [0.5, -DEEP - 0.066, -HALF + 0.05], [0.3, -DEEP - 0.066, -HALF + 0.045]], 0.013, rubber, false, 6));
  root.add(G.rbox(0.13, 0.05, 0.08, 0.012, rubber, [0.24, -DEEP - 0.055, -HALF + 0.045]), G.box(0.06, 0.03, 0.06, steel, [0.15, -DEEP - 0.055, -HALF + 0.045], 0.003), G.box(0.26, 0.09, 0.004, steel, [-0.62, -DEEP + 0.13, -HALF + 0.012], 0));
  // the banks, seen from outside: ten boards to a side, six sliders standing on each, a small motor at the foot of every one
  const bank = screen(1024, 128), b = bank.ctx;
  b.fillStyle = '#0c0d0e'; b.fillRect(0, 0, 1024, 128);
  for (let n = 0; n < 10; n++) {
    const x0 = n * 102.4 + 2;
    b.fillStyle = '#1c5637'; b.fillRect(x0, 3, 98, 122);
    for (let k = 0; k < 6; k++) {
      const x = x0 + 5 + k * 15.4, up = ((n * 7 + k * 5) % 9) * 7;
      b.fillStyle = '#c8a64a'; b.fillRect(x + 2, 6, 5, 5);
      b.fillStyle = '#0d0e10'; b.fillRect(x, 14, 10, 82);
      b.fillStyle = '#34373c'; b.fillRect(x + 4, 18, 2, 74);
      b.fillStyle = '#d5d8db'; b.fillRect(x + 1, 22 + up, 8, 6);
      b.fillStyle = '#8f949a'; b.fillRect(x - 1, 98, 12, 22);
      b.fillStyle = '#5c6066'; b.fillRect(x + 3, 120, 4, 3);
    }
  }
  bank.tex.needsUpdate = true;
  const boards = new THREE.MeshStandardMaterial({ map: bank.tex, roughness: 0.6, metalness: 0.1 });
  for (const [x, z, ry] of [[0, 0.9, 0], [0.9, 0, Math.PI / 2], [-0.9, 0, -Math.PI / 2]]) { const m = part(new THREE.PlaneGeometry(1.8, DEEP + DECK - 0.022), boards, [x, (DECK - DEEP) / 2 - 0.005, z]); m.rotation.y = ry; root.add(m); }
  fuse(root);
  const ball = G.sph(0.09, M.enamel(0xd1481f));
  root.add(ball);
  const height = (x: number, z: number, cx: number, cz: number, t: number) => {
    const d2 = (x - cx) ** 2 + (z - cz) ** 2;
    return 0.03 + 0.34 * Math.exp(-d2 / 0.05) + 0.035 * Math.sin(Math.sqrt(d2) * 16 - t * 4) * Math.exp(-d2 * 1.6);
  };
  const up = pins.mesh.instanceMatrix.array, reach = rods.mesh.instanceMatrix.array;
  const draw = (t: number) => {
    const cx = 0.42 * Math.sin(t * 0.7), cz = 0.42 * Math.sin(t * 0.47 + 1);
    // a pin only goes up and down and a rod only grows and shrinks: one number of each is all that changes
    for (let i = 0; i < N * N; i++) { const y = height(at[i * 2], at[i * 2 + 1], cx, cz, t); up[i * 16 + 13] = y; reach[i * 16 + 5] = y - LEN - DECK; }
    ball.position.set(cx, height(cx, cz, cx, cz, t) + 0.09, cz);
  };
  draw(0); pins.done(); rods.done();
  return {
    root, inDark: 'vanishes', view: [34, 24], zoom: 0.9,
    views: {
      table: { at: [0, 1, 2], to: [0, 0.1, 0], fov: 42 },
      // high enough that turning the view never takes it down among the pins
      pins: { at: [0.9, 0.62, 0.7], to: [0.15, 0.1, 0.05] },
    },
    update: ({ t }) => { draw(t); pins.mesh.instanceMatrix.needsUpdate = true; rods.mesh.instanceMatrix.needsUpdate = true; },
  };
}

const BRAILLE: Record<string, number[]> = {
  '#': [3, 4, 5, 6], ':': [2, 5], '1': [1], '2': [1, 2], '3': [1, 4], '4': [1, 4, 5], '5': [1, 5], '6': [1, 2, 4], '7': [1, 2, 4, 5], '8': [1, 2, 5], '9': [2, 4], '0': [2, 4, 5],
};

/** Refreshable braille: a line of cells whose pins rise and fall. It spells the time, numeric sign first. */
export function braille(): Built {
  const root = G.group();
  // Braille is tight: the dots of one cell are 2.5 mm apart and the next cell begins 6.4 mm on. The model keeps that
  // proportion, at about forty times the size, so that the eleven cells sit shoulder to shoulder as real ones do.
  const CELLS = 11, CP = 0.26, DP = 0.1, ROW = -0.1, TOP = 0.145, EXT = 3.0;
  const white = M.plastic(0xf5f3ec, 0.4), shell = M.plastic(0x2b2e33, 0.55), jet = M.plastic(0x101113, 0.36), key = M.plastic(0x4d535a, 0.5);
  const steel = M.steel(), rubber = M.rubber(), brass = M.brass(2);
  const alu = M.steel(0); alu.color.set(0xb9bdc1); alu.roughness = 0.46; alu.metalness = 0.82;
  const colOf = (d: number) => (d < 3 || d === 6 ? 0 : 1), rowOf = (d: number) => (d === 6 || d === 7 ? 3 : d % 3); // dots 1..3 and 7 down the left, 4..6 and 8 down the right
  const cx = (c: number) => (c - (CELLS - 1) / 2) * CP;

  // The housing is a length of aluminium extrusion, which is why its section is the same from end to end: a deck with
  // a channel for the cells and a slope for the thumbs. A moulded cap, a little proud of the metal, closes each end.
  const HULL: P[] = [[-0.6, -0.13], [0.62, -0.13], [0.62, 0.035], [0.24, 0.13], [-0.6, 0.13]], SOFT = [0.038, 0.038, 0.038, 0.068, 0.033];
  root.add(G.profile(eased([HULL[0], HULL[1], HULL[2], HULL[3], [0.2, 0.13], [0.2, 0.086], [-0.54, 0.086], [-0.54, 0.13], HULL[4]], [0.03, 0.03, 0.03, 0.06, 0, 0, 0, 0, 0.025]), EXT, alu, undefined, 0));
  for (const s of [-1, 1]) {
    const R = 0.07, rows = [{ x: s * (EXT / 2 - 0.03), pts: eased(inset(HULL, -0.008), SOFT) }];
    for (let k = 0; k <= 5; k++) { const a = (k / 5) * Math.PI / 2, d = R * (1 - Math.cos(a)); rows.push({ x: s * (EXT / 2 + 0.15 + R * Math.sin(a)), pts: eased(inset(HULL, d - 0.008), SOFT.map((r) => Math.max(0.006, r - d))) }); }
    root.add(new THREE.Mesh(loft(rows), shell), G.cyl(0.03, 0.012, steel, [s * (EXT / 2 + 0.218), -0.02, -0.3], 12).rotateZ(Math.PI / 2), G.cyl(0.03, 0.012, steel, [s * (EXT / 2 + 0.218), -0.03, 0.34], 12).rotateZ(Math.PI / 2));
  }
  // In the channel: a strip of routing keys, one behind every cell, then the cells themselves. Each cell is a module
  // of its own under its own cap, so a line is a row of caps with a seam between every two.
  const holes: P[] = Array.from({ length: 8 }, (_, d) => [(colOf(d) - 0.5) * DP, (rowOf(d) - 1.5) * DP]);
  const cap = holed(CP - 0.01, 0.56, 0.044, holes, 0.036, 0.006, 20);
  const button = new THREE.LatheGeometry([[0.05, -0.02], [0.05, 0.006], [0.046, 0.016], [0.036, 0.022], [0.02, 0.025], [0, 0.026]].map(([r, y]) => new THREE.Vector2(r, y)), 24);
  const all = Array.from({ length: CELLS }, (_, c) => c);
  root.add(G.box(EXT, 0.016, 0.72, jet, [0, 0.094, -0.17], 0), G.box(EXT, 0.042, 0.15, shell, [0, 0.109, -0.463], 0.004));
  root.add(new THREE.Mesh(G.merge(all.map((c) => cap.clone().translate(cx(c), TOP, ROW))), jet), new THREE.Mesh(G.merge(all.map((c) => button.clone().translate(cx(c), 0.13, -0.463))), key));
  for (const s of [-1, 1]) root.add(G.box(0.066, 0.04, 0.56, shell, [s * (CELLS * CP / 2 + 0.035), TOP - 0.024, ROW], 0.004));
  // thumb keys on the slope, each in its own opening: a long bar to move along the text, and a key at either end
  const thumbs = G.group();
  for (const [x, w] of [[0, 1.1], [-1.2, 0.26], [1.2, 0.26]]) thumbs.add(G.rbox(w, 0.05, 0.15, 0.02, key, [x, 0.012, 0]), G.rbox(w + 0.04, 0.02, 0.19, 0.008, jet, [x, -0.006, 0]));
  thumbs.position.set(0, 0.0825, 0.43); thumbs.rotation.x = 0.245;
  root.add(thumbs);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.cyl(0.06, 0.03, rubber, [sx * 1.45, -0.145, 0.01 + sz * 0.5], 20, 0.051));
  // at the back: the power switch, and the lead through its ribbed sleeve to a plug that lies on the stand
  const sleeve = G.lathe([[0.055, 0], [0.055, 0.03], [0.045, 0.036], [0.045, 0.06], [0.04, 0.066], [0.04, 0.09], [0.034, 0.096], [0.034, 0.13], [0.025, 0.14]], rubber, 20);
  sleeve.rotation.x = -Math.PI / 2; sleeve.position.set(-1.15, -0.03, -0.6);
  root.add(sleeve, G.wire([[-1.15, -0.03, -0.72], [-1.16, -0.05, -0.9], [-1.25, -0.125, -1.08], [-1.42, -0.137, -1.3], [-1.4, -0.137, -1.56], [-1.2, -0.137, -1.66], [-1.02, -0.137, -1.64]], 0.023, rubber));
  root.add(G.rbox(0.17, 0.075, 0.13, 0.02, rubber, [-0.95, -0.122, -1.64]), G.box(0.11, 0.045, 0.1, steel, [-0.82, -0.122, -1.64], 0.004));
  root.add(G.box(0.2, 0.08, 0.012, jet, [-0.75, 0, -0.602], 0), G.box(0.07, 0.045, 0.024, key, [-0.78, 0, -0.608], 0.004));

  // the pins: round at the tip, and long enough that the foot never comes up through the cap
  const tip: THREE.Vector2[] = [new THREE.Vector2(0.03, -0.15)];
  for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI / 2; tip.push(new THREE.Vector2(0.03 * Math.cos(a), -0.03 + 0.03 * Math.sin(a))); }
  const pins = new Swarm(new THREE.LatheGeometry(tip, 24), white, CELLS * 8);
  const hgt = new Float32Array(CELLS * 8).fill(0.01);
  const place = () => { for (let i = 0; i < CELLS * 8; i++) { const d = i % 8; pins.put(i, cx((i - d) / 8) + (colOf(d) - 0.5) * DP, TOP + hgt[i], ROW + (rowOf(d) - 1.5) * DP); } };
  place(); pins.done();
  root.add(pins.mesh);

  // Behind it, the last cell taken out, made twice the size and turned on its side. Eight strips of piezo crystal
  // lie in two stacks of four, one stack on each side of a small circuit board. Each strip is two plates of crystal
  // on a brass leaf. The leaf is soldered to the board at one end, where a spring clip and a steel pin also grip
  // the strip, and the other end is free. Charged, the strip curls and its free end lifts a pin through the cap.
  const REED = 1.2, PLATE = 0.1, CLAMP = 0.21, TRAVEL = 0.15, CAP = 0.96, PARTS = 8, LEN = (REED - PLATE) / PARTS;
  const cell = G.group();
  cell.add(G.rbox(0.62, 0.05, 2.34, 0.02, shell, [0, 0.025, -0.5]), new THREE.Mesh(cap.clone().scale(2, 2, 2).translate(0, CAP, 0), jet));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cell.add(G.cyl(0.015, CAP - 0.08, steel, [sx * 0.212, (CAP - 0.08) / 2 + 0.05, sz * 0.5], 10), G.cyl(0.027, 0.012, steel, [sx * 0.212, CAP + 0.005, sz * 0.5], 12));
  // the board stands in a socket, as a cell stands in the frame of the display, and carries a chip on each face that switches the four strips of that side
  const ZB = -1.07, fr = screen(512, 432), b = fr.ctx;
  const bu = (z: number) => (ZB + 0.5 - z) * 512, bv = (y: number) => ((0.86 - y) / 0.76) * 432;
  const track = (pts: P[], w: number) => { b.lineWidth = w; b.beginPath(); pts.forEach(([z, y], i) => { if (i) b.lineTo(bu(z), bv(y)); else b.moveTo(bu(z), bv(y)); }); b.stroke(); };
  b.fillStyle = '#1c5637'; b.fillRect(0, 0, 512, 432);
  b.lineCap = 'round'; b.lineJoin = 'round'; b.strokeStyle = '#2f7d52';
  // a track from the pad of each strip to its leg of the chip, and three from the chip round the edge to the socket
  for (let r = 0; r < 4; r++) { const y = 0.56 - r * 0.12, zp = (r - 1.5) * 0.2 + 0.09 - REED, run = 0.645 - r * 0.025, leg = -0.96 + r * 0.04; track([[zp, y], [zp, run], [leg, run], [leg, 0.68]], 5); }
  for (let i = 0; i < 3; i++) { const o = i * 0.016; track([[-0.96 + i * 0.04, 0.76], [-0.96 + i * 0.04, 0.8 + o], [-1.5 - o, 0.8 + o], [-1.5 - o, 0.19 - o], [-1.03 - i * 0.07, 0.19 - o], [-1.03 - i * 0.07, 0.14]], 4); }
  b.fillStyle = '#c8a64a';
  for (let r = 0; r < 4; r++) b.fillRect(bu((r - 1.5) * 0.2 + 0.09 - REED) - 34, bv(0.56 - r * 0.12) - 12, 68, 24);
  for (let i = 0; i < 10; i++) { b.beginPath(); b.arc(bu(-0.75 - i * 0.07), bv(0.135), 6, 0, 7); b.fill(); }
  b.fillStyle = '#c9ccce'; for (let i = 0; i < 6; i++) for (const y of [0.775, 0.665]) b.fillRect(bu(-0.96 + i * 0.04) - 4, bv(y) - 6, 8, 12);
  b.fillStyle = '#b39b6c'; b.fillRect(bu(-1.3) - 13, bv(0.72) - 7, 26, 14); b.fillRect(bu(-0.72) - 7, bv(0.42) - 13, 14, 26);
  b.strokeStyle = 'rgba(238,238,228,.7)'; b.lineWidth = 2; b.strokeRect(bu(-0.715), bv(0.785), bu(-1.005) - bu(-0.715), bv(0.655) - bv(0.785));
  fr.tex.needsUpdate = true;
  const boardGeo = new THREE.BoxGeometry(0.02, 0.76, 1), buv = boardGeo.attributes.uv;
  // the same layout on both faces, so that the pads on either side lie under their own strips
  for (let i = 4; i < 8; i++) buv.setX(i, 1 - buv.getX(i));
  const board = new THREE.Mesh(boardGeo, new THREE.MeshStandardMaterial({ map: fr.tex, roughness: 0.5, metalness: 0.1 }));
  board.position.set(0, 0.48, ZB);
  cell.add(board, G.box(0.09, 0.075, 0.84, jet, [0, 0.0875, ZB], 0.008), G.box(0.016, 0.1, 0.26, jet, [-0.018, 0.72, -0.86], 0.003), G.box(0.016, 0.1, 0.26, jet, [0.018, 0.72, -0.86], 0.003));
  const strip = G.merge([tinted(new THREE.BoxGeometry(0.12, 0.01, LEN * 1.02).translate(0, 0.008, 0), 0xe3dfd4), tinted(new THREE.BoxGeometry(0.12, 0.006, LEN * 1.02), 0xa8843f), tinted(new THREE.BoxGeometry(0.12, 0.01, LEN * 1.02).translate(0, -0.008, 0), 0xe3dfd4)]);
  const crystal = M.plastic(0xffffff, 0.42); crystal.vertexColors = true;
  const reeds = new Swarm(strip, crystal, 8 * PARTS);
  const head: THREE.Vector2[] = [[0.03, -0.3], [0.085, -0.3], [0.085, -0.3], [0.085, -0.272], [0.085, -0.272], [0.06, -0.272], [0.06, -0.272], [0.06, -0.06]].map(([r, y]) => new THREE.Vector2(r, y));
  for (let k = 1; k <= 5; k++) { const a = (k / 5) * Math.PI / 2; head.push(new THREE.Vector2(0.06 * Math.cos(a), -0.06 + 0.06 * Math.sin(a))); }
  // each pin has a collar that meets the underside of the cap when it is up, and a thin stem down to its own strip
  const heads = new Swarm(new THREE.LatheGeometry(head, 20), white, 8), stems = new Swarm(new THREE.CylinderGeometry(0.03, 0.03, 1, 12, 1, true).translate(0, -0.5, 0), white, 8);
  const at = Array.from({ length: 8 }, (_, d) => {
    // the strip for the row nearest the board is the top one, so that the pins of the rows beyond it can pass its end
    const x = (colOf(d) - 0.5) * 0.2, z = (rowOf(d) - 1.5) * 0.2, y = 0.56 - rowOf(d) * 0.12, zf = z + 0.04 - REED, s = Math.sign(x);
    cell.add(G.box(0.12, 0.006, PLATE + 0.02, brass, [x, y, zf + PLATE / 2 + 0.01], 0), G.box(0.15, 0.02, 0.07, brass, [s * 0.085, y - 0.023, zf + CLAMP - 0.03], 0.003));
    cell.add(G.rod([s * 0.01, y + 0.021, zf + CLAMP], [s * 0.172, y + 0.021, zf + CLAMP], 0.008, steel, 8), G.sph(0.021, steel, [s * 0.03, y, zf + 0.045], 10));
    return { x, y, z, zf };
  });
  const work = () => {
    for (let d = 0; d < 8; d++) {
      const { x, y, z, zf } = at[d], lift = ((hgt[(CELLS - 1) * 8 + d] - 0.01) / 0.075) * TRAVEL;
      heads.put(d, x, CAP + 0.02 + lift, z);
      stems.put(d, x, CAP - 0.28 + lift, z, 0, 0, 0, 1, CAP - 0.28 - y - 0.013, 1);
      // the strip is held at the clip and curls from there on: eight stiff lengths laid along the curve
      for (let k = 0; k < PARTS; k++) {
        const along = (k + 0.5) * LEN, s = Math.max(0, along - (CLAMP - PLATE)) / (REED - CLAMP);
        reeds.put(d * PARTS + k, x, y + lift * s * s, zf + PLATE + along, -Math.atan((2 * lift * s) / (REED - CLAMP)), 0, 0);
      }
    }
  };
  work(); heads.done(); stems.done(); reeds.done();
  cell.add(heads.mesh, stems.mesh, reeds.mesh);
  cell.position.set(1.02, -0.16, -1.4); cell.rotation.y = Math.PI / 2;
  root.add(cell);
  fuse(root);
  let settled = false;
  return {
    root, inDark: 'vanishes', view: [14, 32], zoom: 1.3,
    views: {
      // low over the cells that count seconds, where a reading finger would be
      touch: { at: [0.84, 0.4, 0.46], to: [1.17, 0.14, -0.1], play: 0.4 },
      cell: { at: [1.95, 1.1, 0.3], to: [0.5, 0.4, -1.4] },
    },
    update: () => {
      const n = now();
      const text = `#${n.hhmm.slice(0, 2)}:#${n.hhmm.slice(3)}:#${n.hhmmss.slice(6)}`;
      for (let c = 0; c < CELLS; c++) {
        const up = BRAILLE[text[c]] ?? [];
        for (let d = 0; d < 8; d++) { const i = c * 8 + d; hgt[i] += ((up.includes(d + 1) ? 0.085 : 0.01) - hgt[i]) * (settled ? 0.3 : 1); }
      }
      place(); pins.mesh.instanceMatrix.needsUpdate = true;
      work(); heads.mesh.instanceMatrix.needsUpdate = true; stems.mesh.instanceMatrix.needsUpdate = true; reeds.mesh.instanceMatrix.needsUpdate = true;
      settled = true;
    },
  };
}

/** Drone show: every pixel is an aircraft with a lamp. A diorama of a night field: they write the time, then regroup as a globe. */
export function droneShow(): Built {
  const root = G.group();
  const N = 300, R = 1.75;
  const rnd = (i: number, s: number) => Math.abs(Math.sin(i * s) * 43758.5453) % 1;
  const part = (geo: THREE.BufferGeometry, mat: THREE.Material, p: V3) => { const m = new THREE.Mesh(geo, mat); m.position.set(p[0], p[1], p[2]); return m; };
  const block = (w: number, h: number, d: number, mat: THREE.Material, p: V3) => part(new THREE.BoxGeometry(w, h, d), mat, p);
  // One quadcopter, far smaller than the light it carries: a pale pod on two crossed arms, a motor at the end of
  // each with its propeller a haze above it, four legs to stand on, a stub of an aerial for the satellites, and under
  // the belly the dome of the lamp. They are too small to throw a shadow worth working out.
  const SHELL = 0xd5d8da, DARK = 0x1b1d20, MOTOR = 0x474a50, LENS = 0xf4f3ee, Q = 0.0106, FOUR = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const can = (r: number, h: number, seg: number) => G.merge([new THREE.CylinderGeometry(r, r, h, seg, 1, true), new THREE.CircleGeometry(r, seg).rotateX(-Math.PI / 2).translate(0, h / 2, 0)]);
  const quad = G.merge([
    tinted(new THREE.BoxGeometry(0.03, 0.0013, 0.0019).rotateY(Math.PI / 4), DARK), tinted(new THREE.BoxGeometry(0.03, 0.0013, 0.0019).rotateY(-Math.PI / 4), DARK),
    tinted(new THREE.SphereGeometry(1, 8, 3).scale(0.0046, 0.0025, 0.0068).translate(0, 0.0006, 0), SHELL),
    tinted(new THREE.SphereGeometry(0.0032, 6, 3, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(0, -0.0012, 0), LENS),
    tinted(can(0.0009, 0.0036, 5).translate(0, 0.0042, -0.004), DARK),
    ...FOUR.flatMap(([a, b]) => [tinted(can(0.0021, 0.0028, 6).translate(a * Q, 0.002, b * Q), MOTOR), tinted(new THREE.CylinderGeometry(0.0005, 0.0005, 0.0052, 3, 1, true).translate(a * Q, -0.0032, b * Q), DARK)]),
  ]);
  const skin = M.plastic(0xffffff, 0.5); skin.vertexColors = true;
  const bodies = new Swarm(quad, skin, N);
  bodies.mesh.userData.noShadow = true;
  // a turning propeller is a pale haze, thickest at the hub and at the tips
  const blur = screen(64, 64), haze = blur.ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  haze.addColorStop(0, 'rgba(255,255,255,.8)'); haze.addColorStop(0.2, 'rgba(255,255,255,.5)'); haze.addColorStop(0.8, 'rgba(255,255,255,.26)'); haze.addColorStop(0.93, 'rgba(255,255,255,.45)'); haze.addColorStop(1, 'rgba(255,255,255,0)');
  blur.ctx.fillStyle = haze; blur.ctx.fillRect(0, 0, 64, 64); blur.tex.needsUpdate = true;
  const rotors = new Swarm(G.merge(FOUR.map(([a, b]) => new THREE.CircleGeometry(0.0092, 10).rotateX(-Math.PI / 2).translate(a * Q, 0.0038, b * Q))), new THREE.MeshStandardMaterial({ map: blur.tex, color: 0xc9cdd1, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.6 }), N);
  // the hazes go wherever the aircraft go
  rotors.mesh.instanceMatrix = bodies.mesh.instanceMatrix;
  const lights = glows(N, 0.075);
  // Painted backdrop: dusk over a town. Stars thin out towards the glow on the horizon, a few bars of cloud catch
  // the last light, and in front of a far ridge stand the blocks of the town with some windows lit, and one mast.
  const sky = screen(1024, 512), c = sky.ctx;
  const grad = c.createLinearGradient(0, 0, 0, 512); grad.addColorStop(0, '#050816'); grad.addColorStop(0.6, '#141c3c'); grad.addColorStop(0.84, '#3b2a4a'); grad.addColorStop(0.95, '#6a4046'); grad.addColorStop(1, '#8a5540');
  c.fillStyle = grad; c.fillRect(0, 0, 1024, 512);
  c.fillStyle = '#dfe6ff';
  for (let i = 0; i < 220; i++) { const y = rnd(i, 12.9898) * 360, s = rnd(i, 3.31) < 0.12 ? 2.4 : 1.5; c.globalAlpha = (0.25 + 0.6 * rnd(i, 7.77)) * (1 - y / 420); c.fillRect(rnd(i, 78.233) * 1024, y, s, s); }
  c.globalAlpha = 1;
  for (let i = 0; i < 7; i++) {
    const x = rnd(i, 5.1) * 1024, y = 330 + rnd(i, 9.7) * 90, w = 120 + rnd(i, 2.3) * 200, bar = c.createLinearGradient(x, 0, x + w, 0);
    bar.addColorStop(0, 'rgba(150,96,110,0)'); bar.addColorStop(0.5, 'rgba(150,96,110,.3)'); bar.addColorStop(1, 'rgba(150,96,110,0)');
    c.fillStyle = bar; c.fillRect(x, y, w, 3 + rnd(i, 1.9) * 4);
  }
  c.fillStyle = '#0c1024'; c.beginPath(); c.moveTo(0, 512);
  for (let x = 0; x <= 1024; x += 32) c.lineTo(x, 452 - 16 * Math.sin(x * 0.011) - 9 * Math.sin(x * 0.037 + 2));
  c.lineTo(1024, 512); c.fill();
  for (let x = 0, k = 0; x < 1024; k++) {
    const w = 12 + rnd(k, 12.9898) * 26, h = 20 + rnd(k, 78.233) ** 2 * 62;
    c.fillStyle = '#05060c'; c.fillRect(x, 512 - h, w, h);
    if (rnd(k, 5.5) < 0.3) c.fillRect(x + w * 0.3, 512 - h - 5, w * 0.4, 5);
    for (let wy = 512 - h + 4; wy < 498; wy += 6) for (let wx = x + 2.5; wx < x + w - 3; wx += 5) { const r = rnd(wx * 7 + wy, 9.1); if (r < 0.2) { c.fillStyle = r < 0.04 ? '#cfe0ff' : '#ffd98a'; c.fillRect(wx, wy, 2, 2.6); } }
    x += w + (rnd(k, 3.7) < 0.35 ? 3 : 0);
  }
  c.fillStyle = '#05060c'; c.fillRect(473, 392, 5, 120); c.fillRect(466, 384, 19, 9); c.fillRect(474.5, 356, 2, 30);
  c.fillStyle = '#ff5a4a'; c.fillRect(474, 353, 3, 3);
  // a hedge along the far side of the field hides where the painting meets the ground
  c.fillStyle = '#0a120c'; c.beginPath(); c.moveTo(0, 512);
  for (let x = 0; x <= 1024; x += 8) c.lineTo(x, 503 - 4 * rnd(x, 1.7));
  c.lineTo(1024, 512); c.fill();
  sky.tex.needsUpdate = true;
  // The backdrop is a sheet of hardboard bent to a half round and held to four ribs behind. It is tall enough that
  // someone standing on the field sees the whole figure against it.
  const hard = M.paper(0x5e4c3a), ply = M.wood(0xb89868, 1);
  const wall = part(new THREE.CylinderGeometry(1.72, 1.72, 2.62, 64, 1, true, Math.PI * 0.5, Math.PI), new THREE.MeshStandardMaterial({ map: sky.tex, side: THREE.BackSide, roughness: 1 }), [0, 1.31, 0]);
  root.add(wall, part(new THREE.CylinderGeometry(1.745, 1.745, 2.62, 64, 1, true, Math.PI * 0.5, Math.PI), hard, [0, 1.31, 0]), part(new THREE.RingGeometry(1.72, 1.745, 64, 1, 0, Math.PI).rotateX(-Math.PI / 2), hard, [0, 2.62, 0]));
  for (const s of [-1, 1]) root.add(block(0.025, 2.62, 0.004, hard, [s * 1.7325, 1.31, 0.002]));
  for (const deg of [-65, -25, 25, 65]) { const a = (deg * Math.PI) / 180, rib = block(0.03, 2.6, 0.06, ply, [Math.sin(a) * 1.775, 1.3, -Math.cos(a) * 1.775]); rib.rotation.y = Math.PI - a; root.add(rib); }
  // The field, on a black base: grass mown in stripes, and on it the take-off grid, a marked square for every
  // aircraft inside a sprayed line. The ground is trodden round the tent, and a lead runs to it from the base station.
  const padAt = (i: number): V3 => [((i % 25) - 12) * 0.07, 0.002, 0.55 + Math.floor(i / 25) * 0.07];
  const turf = screen(1024, 1024), g = turf.ctx, px = (v: number) => (v / (2 * R) + 0.5) * 1024;
  g.fillStyle = '#1c281b'; g.fillRect(0, 0, 1024, 1024);
  g.fillStyle = 'rgba(70,96,58,.2)'; for (let s = 0; s < 1024; s += 82) g.fillRect(s, 0, 41, 1024);
  for (let i = 0; i < 1400; i++) { const r = rnd(i, 3.7); g.fillStyle = r < 0.5 ? 'rgba(8,14,8,.1)' : 'rgba(96,120,70,.07)'; g.beginPath(); g.ellipse(rnd(i, 12.9898) * 1024, rnd(i, 78.233) * 1024, 3 + r * 12, 2 + r * 6, r * 6, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(88,82,60,.28)'; g.beginPath(); g.ellipse(px(-1.12), px(1.0), 48, 36, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(214,211,196,.5)'; g.lineWidth = 2; g.strokeRect(px(-0.9), px(0.49), px(0.9) - px(-0.9), px(1.38) - px(0.49));
  g.fillStyle = '#b9b6aa'; for (let i = 0; i < N; i++) { const p = padAt(i); g.fillRect(px(p[0]) - 4.5, px(p[2]) - 4.5, 9, 9); }
  g.strokeStyle = '#0b0c0d'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(px(-0.93), px(0.82)); g.quadraticCurveTo(px(-1.0), px(0.93), px(-1.1), px(0.98)); g.stroke();
  g.strokeStyle = '#111213'; g.lineWidth = 9; g.beginPath(); g.arc(512, 512, 508, 0, 7); g.stroke();
  turf.tex.needsUpdate = true;
  root.add(part(new THREE.CircleGeometry(R, 72).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: turf.tex, roughness: 1 }), [0, 0, 0]), part(new THREE.CylinderGeometry(R, R, 0.05, 72, 1, true), M.plastic(0x141516, 0.6), [0, -0.025, 0]));
  // The control point at the edge of the field: an open tent over the pilot's table and laptop, two flight cases and
  // a generator beside it, and on a tripod the base station. It listens to the same satellites as the aircraft from a
  // place that is known, and sends them the difference: that is the correction from the ground.
  const TX = -1.15, TZ = 1.0, cloth = M.cloth(0xe9e6dc), pole = M.steel(1), dark = M.plastic(0x1d1f22, 0.6), white = M.plastic(0xecebe4, 0.5), cone = M.plastic(0xe0601c, 0.6);
  for (const [sx, sz] of FOUR) root.add(block(0.006, 0.1, 0.006, pole, [TX + sx * 0.094, 0.05, TZ + sz * 0.074]));
  root.add(part(new THREE.ConeGeometry(Math.SQRT1_2, 0.05, 4, 1, true).rotateY(Math.PI / 4).scale(0.2, 1, 0.16), cloth, [TX, 0.125, TZ]), part(new THREE.CylinderGeometry(Math.SQRT1_2, Math.SQRT1_2, 0.016, 4, 1, true).rotateY(Math.PI / 4).scale(0.2, 1, 0.16), cloth, [TX, 0.093, TZ]));
  root.add(block(0.05, 0.004, 0.12, white, [TX - 0.02, 0.042, TZ]), block(0.044, 0.04, 0.004, pole, [TX - 0.02, 0.02, TZ - 0.05]), block(0.044, 0.04, 0.004, pole, [TX - 0.02, 0.02, TZ + 0.05]));
  root.add(block(0.016, 0.0016, 0.022, dark, [TX - 0.02, 0.0448, TZ]), part(new THREE.BoxGeometry(0.0012, 0.015, 0.022).translate(0, 0.0075, 0).rotateZ(-0.25), dark, [TX - 0.012, 0.0456, TZ]));
  root.add(G.rod([TX + 0.094, 0.1, TZ - 0.074], [TX + 0.094, 0.21, TZ - 0.074], 0.0018, pole, 4), part(new THREE.CylinderGeometry(0.004, 0.004, 0.028, 5), white, [TX + 0.094, 0.224, TZ - 0.074]));
  root.add(block(0.055, 0.03, 0.035, dark, [-0.97, 0.015, 1.13]), block(0.056, 0.003, 0.036, pole, [-0.97, 0.021, 1.13]), block(0.05, 0.028, 0.035, dark, [-0.974, 0.044, 1.132]), block(0.051, 0.003, 0.036, pole, [-0.974, 0.05, 1.132]));
  root.add(block(0.06, 0.03, 0.03, M.plastic(0x8a1f16, 0.5), [-0.98, 0.017, 1.05]), block(0.064, 0.004, 0.034, dark, [-0.98, 0.002, 1.05]), block(0.05, 0.003, 0.006, dark, [-0.98, 0.036, 1.05]));
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4; root.add(G.rod([-0.93, 0.085, 0.82], [-0.93 + Math.cos(a) * 0.032, 0, 0.82 + Math.sin(a) * 0.032], 0.0022, pole, 4)); }
  root.add(part(new THREE.CylinderGeometry(0.015, 0.015, 0.007, 10), white, [-0.93, 0.0905, 0.82]));
  // two of the crew, as plain figures for scale
  const figure = G.merge([new THREE.LatheGeometry([[0.0055, 0], [0.007, 0.03], [0.0095, 0.054], [0.004, 0.061]].map(([r, y]) => new THREE.Vector2(r, y)), 6), new THREE.SphereGeometry(0.0065, 6, 4).translate(0, 0.069, 0)]);
  const grey = M.plastic(0x8f9498, 0.8);
  root.add(part(figure, grey, [TX - 0.062, 0, TZ + 0.01]), part(figure.clone(), grey, [-0.99, 0, 0.9]));
  for (const x of [-0.9, 0.9]) for (const z of [0.49, 1.38]) root.add(part(new THREE.ConeGeometry(0.009, 0.024, 6, 1, true), cone, [x, 0.014, z]), block(0.022, 0.002, 0.022, cone, [x, 0.001, z]));
  fuse(root);
  root.add(bodies.mesh, rotors.mesh, lights.points);

  const globe = new Float32Array(N * 3), cur = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), a = i * 2.39996; globe.set([Math.cos(a) * r * 0.66, 1.25 + y * 0.66, Math.sin(a) * r * 0.66], i * 3); cur.set(padAt(i), i * 3); }
  let stamp = '', word: V3[] = [];
  const col = new THREE.Color();
  // One step of every aircraft towards where it should be at this moment, or as far as `steps` of them would bring it.
  const fly = (t: number, steps = 1) => {
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
      const j = i * 3;
      let tx: number, ty: number, tz: number, hue: number, sat = 1, lum = 0.56;
      if (asGlobe) {
        const x = globe[j], z = globe[j + 2];
        tx = x * Math.cos(spin) - z * Math.sin(spin); ty = globe[j + 1]; tz = x * Math.sin(spin) + z * Math.cos(spin);
        hue = 0.52 + 0.3 * ((ty - 0.6) / 1.3);
      } else if (i < word.length) { const w = word[i]; tx = w[0]; ty = w[1]; tz = w[2]; hue = 0.1; sat = 0.55; lum = 0.7; }
      else { const a = ((i - word.length) / ringN) * Math.PI * 2 + t * 0.12; tx = Math.cos(a) * 1.4; ty = 1.31 + Math.sin(a) * 0.6; tz = 0; hue = 0.55 + 0.08 * Math.sin(a * 3); }
      const k = 1 - (1 - (0.03 + (i % 7) * 0.004)) ** steps;
      cur[j] += (tx - cur[j]) * k; cur[j + 1] += (ty - cur[j + 1]) * k; cur[j + 2] += (tz - cur[j + 2]) * k;
      // no aircraft holds perfectly still
      const x = cur[j] + Math.sin(t * 1.7 + i * 1.3) * 0.004, y = cur[j + 1] + Math.sin(t * 2.1 + i) * 0.005;
      bodies.put(i, x, y, cur[j + 2], 0, i, 0);
      lights.pos[j] = x; lights.pos[j + 1] = y - 0.004; lights.pos[j + 2] = cur[j + 2];
      col.setHSL(hue, sat, lum);
      lights.col[j] = col.r; lights.col[j + 1] = col.g; lights.col[j + 2] = col.b;
    }
    bodies.mesh.instanceMatrix.needsUpdate = true; lights.flush(true);
  };
  // the show is already under way when the visitor arrives: eight seconds in, with the aircraft nearly on station
  fly(7.95, 160);
  bodies.done();
  return {
    root, inDark: 'better', glow: 0x8fb4ff, view: [10, 5],
    views: {
      // at the edge of the field, a little above the grass
      field: { at: [0, 0.12, 3.5], to: [0, 1.2, 0], fov: 56 },
      // the colon of the time: there are always aircraft here while the figures are up
      close: { at: [0.2, 1.25, 0.35], to: [0, 1.31, 0] },
    },
    update: ({ t }) => fly(t),
  };
}

/** Five by seven dots for the digits and the colon, row by row from the top: the time is spelled in falling water. */
const DROP_FONT: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['0', '1', '1', '0', '1', '1', '0'],
};

/**
 * Water curtain display: a bar of valves over a basin. Each valve lets a drop fall when its dot of the picture is
 * dark, row after row from the bottom of the picture up, so the drops fall in the shape of the picture and it lasts
 * as long as the fall. Here the picture is the time, released every two and a half seconds, and the fall is slowed
 * to about a second, as long as the words of Julius Popp's bit.fall last.
 */
export function waterCurtain(): Built {
  const root = G.group();
  const COLS = 32, PITCH = 0.05, W = COLS * PITCH, TOP = 2.05, FLOOR = 0.16, ROWS = 7;
  const metal = M.steel(1), dark = M.dark();
  // the frame: two posts on feet and a beam across, with the bar of valves under it
  for (const sx of [-1, 1]) root.add(G.box(0.07, TOP + 0.12, 0.07, metal, [sx * (W / 2 + 0.16), (TOP + 0.12) / 2, 0]), G.box(0.3, 0.03, 0.4, metal, [sx * (W / 2 + 0.16), 0.015, 0]));
  root.add(G.box(W + 0.42, 0.08, 0.1, metal, [0, TOP + 0.16, 0]), G.rbox(W + 0.06, 0.07, 0.07, 0.015, dark, [0, TOP + 0.06, 0]));
  // a valve on every nozzle: small black cylinders in a row, each with its brass tip
  const valves = new Swarm(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 8), M.black(), COLS);
  const tips = new Swarm(new THREE.CylinderGeometry(0.006, 0.003, 0.02, 6), M.brass(), COLS);
  for (let i = 0; i < COLS; i++) { const x = (i - (COLS - 1) / 2) * PITCH; valves.put(i, x, TOP + 0.005, 0); tips.put(i, x, TOP - 0.03, 0); }
  valves.done(); tips.done();
  root.add(valves.mesh, tips.mesh);
  // the supply: a pipe from the basin's pump up one post to the bar
  root.add(G.wire([[W / 2 + 0.05, 0.12, 0.2], [W / 2 + 0.24, 0.12, 0.08], [W / 2 + 0.24, TOP + 0.06, 0.06], [W / 2, TOP + 0.06, 0.04]], 0.016, M.rubber(), false, 6));
  // the basin: a long shallow trough with water in it, and lamps under the water that light the drops
  root.add(G.rbox(W + 0.3, 0.14, 0.5, 0.03, dark, [0, 0.07, 0]));
  const pool = new THREE.MeshStandardMaterial({ color: 0x2c4c5c, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85 });
  root.add(G.plane(W + 0.22, 0.42, pool, [0, FLOOR - 0.005, 0]).rotateX(-Math.PI / 2));
  const glow = M.glow(0xbfe6ff, 1.2);
  for (let i = 0; i < 6; i++) root.add(G.box(0.12, 0.01, 0.06, glow, [(i - 2.5) * (W / 6), FLOOR - 0.02, 0.12], 0));
  fuse(root);

  // two pictures can be in the air at once: one falling, the next just leaving the valves
  const MAX = COLS * ROWS * 2;
  const drops = new Swarm(new THREE.SphereGeometry(0.015, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe6f6ff, emissive: 0x9fd6ff, emissiveIntensity: 0.5, roughness: 0.05, transparent: true, opacity: 0.9 }), MAX);
  drops.mesh.userData.noShadow = true;
  root.add(drops.mesh);
  /** The dots of the time, as columns and rows, centred on the bar. */
  const bitmap = (text: string): [number, number][] => {
    const glyphs = [...text].map((ch) => DROP_FONT[ch] ?? DROP_FONT['0']);
    const wide = glyphs.reduce((n, g) => n + g[0].length + 1, -1);
    let x0 = Math.floor((COLS - wide) / 2);
    const dots: [number, number][] = [];
    for (const g of glyphs) { g.forEach((row, r) => [...row].forEach((b, c) => { if (b === '1') dots.push([x0 + c, r]); })); x0 += g[0].length + 1; }
    return dots;
  };
  const EVERY = 2.5, FALL = 1.05, G2 = (2 * (TOP - FLOOR)) / (FALL * FALL);
  const away = new THREE.Matrix4().makeTranslation(0, -10, 0);
  return {
    root, views: {
      across: { at: [0, 1.35, 4.2], to: [0, 1.15, 0], fov: 36, play: 0.25 },
      under: { at: [0.3, 1.6, 0.9], to: [0, 2.0, 0], fov: 42, play: 0.15 },
    },
    inDark: 'glows', glow: 0xbfe6ff, view: [-14, 4],
    update: (env) => {
      let k = 0;
      for (const back of [0, 1]) {
        const start = (Math.floor(env.t / EVERY) - back) * EVERY, age = env.t - start;
        if (age < 0 || age > FALL + ROWS * 0.09) continue;
        for (const [c, r] of bitmap(now().hhmm)) {
          // the bottom row leaves first; each row above leaves a moment later, so the picture keeps its shape
          const tau = age - (ROWS - 1 - r) * 0.09;
          if (tau < 0) continue;
          const yy = TOP - 0.04 - 0.5 * G2 * tau * tau;
          if (yy < FLOOR) continue;
          drops.put(k++, (c - (COLS - 1) / 2) * PITCH, yy, 0, 0, 0, 0, 1, 1 + Math.min(1.6, tau * 2.2), 1);
          if (k >= MAX) break;
        }
      }
      for (let i = k; i < MAX; i++) drops.mesh.setMatrixAt(i, away);
      drops.done();
    },
  };
}
