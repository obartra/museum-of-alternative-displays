import { G, M, NOISE, Swarm, beam, glows, halo, mirror, opening, portal, screen, spline, voxels, THREE, type Built, type P2, type V3 } from '../kit';
import { breadboard, feet, jewel, post, screws, vents } from '../parts';
import { bigTime, dotMatrix, now } from '../../sims/draw';

/**
 * Bakes the still, solid parts of a model into one mesh for each kind of material, so that a hundred small parts
 * cost a handful of draw calls. Glass, light, instanced parts and what is seen through a window stay as they are.
 * So does anything that moves: name it in `keep`, or mark it with `userData.moves`.
 */
function fuse(root: THREE.Object3D, keep: THREE.Object3D[] = []): void {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), turn = new THREE.Matrix3(), grain = new THREE.Vector3();
  const lots = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; from: THREE.Mesh[]; quiet: boolean }>();
  const walk = (o: THREE.Object3D): void => {
    if (keep.includes(o) || o.userData.moves || o.userData.noFit) return;
    const m = o as THREE.Mesh, mat = m.material as THREE.MeshStandardMaterial;
    if (m.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(mat) && mat.isMeshStandardMaterial && !mat.transparent && !o.children.length && !o.renderOrder) {
      const at = inv.clone().multiply(m.matrixWorld), kind = mat.defines?.FINISH as number | undefined, own = (mat.defines?.GRAIN ?? 0) as number;
      let axis = own;
      if (kind === 2) {
        // wood keeps its grain along the part, so find which way the part now lies. One that lies askew is left alone
        grain.set(own === 0 ? 1 : 0, own === 1 ? 1 : 0, own === 2 ? 1 : 0).applyMatrix3(turn.setFromMatrix4(at)).normalize();
        axis = [Math.abs(grain.x), Math.abs(grain.y), Math.abs(grain.z)].findIndex((c) => c > 0.96);
        if (axis < 0) return;
      }
      // two materials that were made alike are one kind. A lamp or a picture is only ever itself
      const plain = kind !== undefined || (!mat.map && !mat.emissiveMap && mat.emissive.getHex() === 0);
      const quiet = !!o.userData.noShadow, key = (plain ? [mat.color.getHex(), mat.roughness, mat.metalness, kind, axis, mat.side].join() : mat.uuid) + (quiet ? 'q' : '');
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(g.attributes.position.count * 2, 2));
      g.applyMatrix4(at);
      // a mirrored part comes out inside out: turn every triangle over
      if (at.determinant() < 0) for (const a of Object.values(g.attributes)) {
        const v = a.array, n = a.itemSize;
        for (let i = 0; i < v.length; i += 3 * n) for (let k = 0; k < n; k++) { const t = v[i + n + k]; v[i + n + k] = v[i + 2 * n + k]; v[i + 2 * n + k] = t; }
      }
      let lot = lots.get(key);
      if (!lot) lots.set(key, lot = { mat: kind === 2 && axis !== own ? M.wood(mat.color.getHex(), axis) : mat, geos: [], from: [], quiet });
      lot.geos.push(g); lot.from.push(m);
    }
    for (const kid of [...o.children]) walk(kid);
  };
  walk(root);
  for (const lot of lots.values()) {
    if (lot.geos.length < 2) continue;
    const all = new THREE.Mesh(G.merge(lot.geos), lot.mat);
    all.userData.noShadow = lot.quiet;
    root.add(all);
    for (const m of lot.from) { m.removeFromParent(); m.geometry.dispose(); }
  }
}

/** A plain cylinder for a small part: a tenth of the triangles of a turned one with eased edges. */
const stub = (r: number, h: number, mat: THREE.Material, p?: V3, seg = 12, rTop = r): THREE.Mesh => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat);
  if (p) m.position.set(p[0], p[1], p[2]);
  return m;
};

/** For a part too small for its shadow to be missed: it is drawn once, not twice. */
const hush = <T extends THREE.Object3D>(o: T): T => { o.traverse((k) => { k.userData.noShadow = true; }); return o; };
/** A pilot lamp seen from across a room: a lit lens in a dark bezel, its top along +y. */
const pilot = (color: number, r: number, p: V3): THREE.Group => { const g = hush(G.group(stub(r * 1.5, r * 0.5, M.black(), undefined, 10), stub(r, r * 0.8, M.glow(color, 1.6), undefined, 10))); g.position.set(p[0], p[1], p[2]); return g; };

/** A draped figure one unit tall with its feet at the origin, facing +z. A single mesh, so that it can be mirrored whole. */
function shroud(): THREE.BufferGeometry {
  const NU = 60, NV = 64;
  const key = (v: number, pts: [number, number][]): number => {
    for (let i = 1; i < pts.length; i++) if (v <= pts[i][0]) { const [v0, a] = pts[i - 1], [v1, b] = pts[i], t = (v - v0) / (v1 - v0); return a + (b - a) * t * t * (3 - 2 * t); }
    return pts[pts.length - 1][1];
  };
  const R: [number, number][] = [[0, 0.3], [0.12, 0.27], [0.34, 0.2], [0.55, 0.17], [0.68, 0.19], [0.75, 0.2], [0.81, 0.15], [0.86, 0.135], [0.92, 0.125], [0.97, 0.08], [1, 0]];
  const SX: [number, number][] = [[0, 1], [0.5, 1.05], [0.72, 1.32], [0.8, 1.05], [1, 1]];
  const SZ: [number, number][] = [[0, 1.08], [0.5, 0.9], [0.72, 0.72], [0.82, 0.95], [1, 1]];
  const pos: number[] = [], shade: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * Math.PI * 2 - Math.PI / 2; // the seam runs down the back
      const fold = v < 0.62 ? 0.17 * Math.pow(1 - v / 0.62, 1.4) * Math.cos(9 * u + 2.2 * Math.sin(3 * u + 1)) : 0;
      const r = key(v, R) * (1 + fold);
      const x = Math.cos(u) * r * key(v, SX);
      let z = Math.sin(u) * r * key(v, SZ) + 0.03 * Math.sin(v * Math.PI);
      // the open front of the hood, with nothing in it
      const du = Math.atan2(Math.sin(u - Math.PI / 2), Math.cos(u - Math.PI / 2)) / 0.8, dv = (v - 0.885) / 0.06, f = du * du + dv * dv;
      let sh = 1;
      if (f < 1) { z -= 0.07 * (1 - f); sh = 1 - 0.97 * Math.min(1, (1 - f) * 2.4); }
      pos.push(x, v + (j === 0 ? 0.012 * Math.sin(7 * u) : 0), z); shade.push(sh);
    }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1; idx.push(a, c, b, b, c, c + 1); }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  body.setAttribute('shade', new THREE.Float32BufferAttribute(shade, 1));
  body.setIndex(idx); body.computeVertexNormals();
  const plain = (g: THREE.BufferGeometry) => { g.deleteAttribute('uv'); g.setAttribute('shade', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(1), 1)); return g; };
  // a sleeve that widens to the cuff, and a hand
  const sleeve = (a: V3, b: V3, c: V3) => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b), new THREE.Vector3(...c)), T = 22, RS = 16;
    const g = new THREE.TubeGeometry(curve, T, 1, RS, false), p = g.attributes.position, at = new THREE.Vector3();
    for (let i = 0; i <= T; i++) {
      curve.getPointAt(i / T, at);
      const rr = 0.07 + 0.045 * Math.pow(i / T, 1.6);
      for (let k = 0; k <= RS; k++) { const n = i * (RS + 1) + k; p.setXYZ(n, at.x + (p.getX(n) - at.x) * rr, at.y + (p.getY(n) - at.y) * rr - 0.03 * Math.pow(i / T, 2), at.z + (p.getZ(n) - at.z) * rr); }
    }
    g.computeVertexNormals();
    curve.getPointAt(0.93, at);
    const hand = new THREE.SphereGeometry(0.052, 16, 12).scale(0.8, 1.15, 0.7).translate(at.x, at.y - 0.03, at.z);
    return [plain(g), plain(hand)];
  };
  return G.merge([body, ...sleeve([0.21, 0.73, 0.02], [0.36, 0.6, 0.18], [0.3, 0.74, 0.5]), ...sleeve([-0.21, 0.73, 0.02], [-0.35, 0.52, 0.06], [-0.3, 0.36, 0.2])]);
}

/** A figure in limelight. It does not care about the hall lights: in the pit it has a lamp of its own. */
function limelit(additive: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uGain: { value: 1 }, uTint: { value: new THREE.Color(0xd4e6ff) } },
    vertexShader: /* glsl */ `attribute float shade; varying vec3 vN; varying float vS;
      void main() { vN = normal; vS = shade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uGain; uniform vec3 uTint; varying vec3 vN; varying float vS;
      void main() {
        float d = max(dot(normalize(vN), normalize(vec3(0.45, 0.55, 1.0))), 0.0);
        gl_FragColor = vec4(uTint * (0.08 + 0.92 * pow(d, 0.85)) * vS * uGain, 1.0);
        #include <colorspace_fragment>
      }`,
    ...(additive ? { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } : {}),
  });
}

/** Cloth hung in folds. */
function drape(w: number, h: number, folds: number, depth: number, scallop = 0): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h, folds * 10, scallop ? 8 : 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), a = (x / w) * folds * Math.PI * 2;
    p.setZ(i, depth * Math.sin(a + 0.6 * Math.sin(a * 0.37)));
    if (scallop) { const low = 0.5 - p.getY(i) / h; p.setY(i, p.getY(i) - scallop * low * Math.abs(Math.sin(a * 0.25))); }
  }
  g.computeVertexNormals();
  return g;
}

/** Pepper's ghost: a sheet of glass leans out over a pit in front of the stage and mirrors a lit figure lying hidden in it. */
export function peppersGhost(): Built {
  const root = G.group();
  const FLOOR = 0.6, FRONT = 0.1, BACK = -1.0, APRON = 1.3;
  const black = M.black(), pitch = M.cloth(0x0b0b0d), timber = M.wood(0x3a2a1c);
  // the stage: boards running up and down stage, black drops behind and at the sides
  root.add(G.box(2.44, FLOOR - 0.03, 1.1, timber, [0, (FLOOR - 0.03) / 2, -0.45], 0.01), G.box(2.4, 0.03, 1.1, M.wood(0x7a5632, 2), [0, FLOOR - 0.015, -0.45], 0.004));
  root.add(G.box(2.44, 1.5, 0.03, pitch, [0, FLOOR + 0.75, BACK], 0), G.box(0.03, 1.5, 1.1, pitch, [-1.205, FLOOR + 0.75, -0.45], 0), G.box(0.03, 1.5, 1.1, pitch, [1.205, FLOOR + 0.75, -0.45], 0));
  // seen from behind, scenery is cloth on frames of bare deal: stiles, rails and toggles
  const deal = M.wood(0xa88a5c), dealUp = M.wood(0xa88a5c, 1), dealZ = M.wood(0xa88a5c, 2);
  for (const x of [-1.19, -0.4, 0.4, 1.19]) root.add(G.box(0.06, 1.5, 0.022, dealUp, [x, FLOOR + 0.75, BACK - 0.026], 0));
  for (const y of [0.03, 0.75, 1.47]) root.add(G.box(2.44, 0.06, 0.022, deal, [0, FLOOR + y, BACK - 0.026], 0));
  for (const sx of [-1, 1]) {
    for (const z of [-0.97, 0.07]) root.add(G.box(0.022, 1.5, 0.06, dealUp, [sx * 1.231, FLOOR + 0.75, z], 0));
    for (const y of [0.03, 0.75, 1.47]) root.add(G.box(0.022, 0.06, 1.1, dealZ, [sx * 1.231, FLOOR + y, -0.45], 0));
    for (const y of [0.4, 1.1, 1.89]) root.add(G.box(0.022, 0.06, 1.16, dealZ, [sx * 1.231, y, 0.72], 0));
    root.add(G.box(0.022, 1.55, 0.06, dealUp, [sx * 1.231, 1.145, 0.17], 0));
  }
  // real furniture, so the ghost has a room to walk into
  const oak = M.wood(0x8a5a30), oakY = M.wood(0x8a5a30, 1);
  const table = G.group(G.rbox(0.52, 0.035, 0.36, 0.012, oak, [0, 0.42, 0]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) table.add(G.cyl(0.02, 0.4, oakY, [sx * 0.22, 0.2, sz * 0.14], 16, 0.014));
  table.add(G.cyl(0.05, 0.012, M.brass(), [0.1, 0.444, 0], 20), G.cyl(0.016, 0.16, M.ceramic(), [0.1, 0.53, 0], 14), G.sph(0.018, M.glow(0xffc070, 2.4), [0.1, 0.63, 0], 10).rotateX(0), halo(0xffb060, 0.3, [0.1, 0.63, 0], 0.7));
  table.position.set(0.7, FLOOR, -0.62);
  const chair = G.group(G.rbox(0.26, 0.03, 0.26, 0.01, oak, [0, 0.25, 0]));
  for (const sx of [-1, 1]) { chair.add(G.cyl(0.016, 0.25, oakY, [sx * 0.11, 0.125, 0.11], 12), G.cyl(0.016, 0.62, oakY, [sx * 0.11, 0.31, -0.11], 12)); }
  chair.add(G.rbox(0.26, 0.07, 0.022, 0.008, oak, [0, 0.56, -0.11]), G.rbox(0.26, 0.04, 0.02, 0.008, oak, [0, 0.43, -0.11]));
  chair.position.set(0.5, FLOOR, -0.25); chair.rotation.y = 2.5;
  root.add(table, chair);
  // the pit: lined in black, open to the glass above, hidden from the house by the front wall
  root.add(G.box(2.44, 0.03, APRON - FRONT, black, [0, 0.015, (APRON + FRONT) / 2], 0), G.box(2.4, FLOOR - 0.04, 0.01, pitch, [0, FLOOR / 2, FRONT + 0.006], 0));
  // masking flats at the sides: from the house you must not see past the glass into the wings
  for (const sx of [-1, 1]) root.add(G.box(0.04, 1.92, APRON - FRONT + 0.1, black, [sx * 1.2, 0.96, (APRON + FRONT) / 2 + 0.05], 0));
  root.add(G.box(2.44, 0.78, 0.06, timber, [0, 0.39, APRON + 0.03]), G.box(0.66, 0.025, 1.14, black, [0, 0.045, 0.68], 0));
  // towards the house the pit wall is panelled, with a capping rail and a skirting
  for (let i = 0; i < 5; i++) root.add(G.box(0.4, 0.5, 0.012, timber, [(i - 2) * 0.46, 0.4, APRON + 0.066], 0), G.box(0.31, 0.41, 0.012, timber, [(i - 2) * 0.46, 0.4, APRON + 0.076], 0));
  root.add(G.box(2.44, 0.03, 0.1, timber, [0, 0.765, APRON + 0.045], 0.008), G.box(2.44, 0.09, 0.02, timber, [0, 0.045, APRON + 0.07], 0));
  // the limelight that makes the hidden figure bright enough to show in the glass: a lantern of blacked tin with a
  // chimney for the heat and a lens in a barrel, turned down at the figure. Two rubber tubes bring it its two gases
  const tin = M.plastic(0x101112, 0.35), steel = M.steel(), brass = M.brass(), T = Math.PI / 2;
  const barrel = G.lathe([[0.07, 0], [0.07, 0.05], [0.078, 0.054], [0.078, 0.075], [0.066, 0.075], [0.06, 0.056], [0, 0.05]], tin, 24); barrel.rotation.x = T; barrel.position.z = 0.085;
  const cowl = G.lathe([[0.04, 0.1], [0.04, 0.17], [0.062, 0.176], [0.05, 0.196], [0, 0.206]], tin, 16); cowl.position.z = -0.02;
  const lime = G.group(G.rbox(0.2, 0.22, 0.17, 0.012, tin), barrel, cowl, stub(0.06, 0.004, M.glow(0xfff2d0, 2.2), [0, 0, 0.143], 20).rotateX(T), stub(0.012, 0.03, brass, [-0.04, -0.06, -0.1], 8).rotateX(T), stub(0.012, 0.03, brass, [0.04, -0.06, -0.1], 8).rotateX(T));
  lime.position.set(0.82, 0.5, APRON - 0.12); lime.lookAt(-0.2, 0.2, 0.55); lime.updateMatrixWorld(true);
  const from = (x: number, y: number, z: number): V3 => { const q = lime.localToWorld(new THREE.Vector3(x, y, z)); return [q.x, q.y, q.z]; };
  root.add(lime, halo(0xfff2d0, 0.5, from(0, 0, 0.17), 0.6), G.rod([0.82, 0.04, APRON - 0.12], [0.82, 0.4, APRON - 0.12], 0.014, steel, 8), stub(0.09, 0.02, tin, [0.82, 0.04, APRON - 0.12], 16));
  for (const [sx, hue] of [[-1, 0x7a2a22], [1, 0x16181a]]) root.add(G.wire([from(sx * 0.04, -0.06, -0.115), from(sx * 0.04, -0.09, -0.16), [1.0 + sx * 0.02, 0.2, APRON - 0.06], [1.08 + sx * 0.02, 0.045, APRON - 0.16], [1.14, 0.045, 0.9 + sx * 0.03]], 0.011, M.plastic(hue, 0.8), false, 5));
  const geo = shroud();
  const actor = new THREE.Mesh(geo, limelit(false));
  const LIE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
  root.add(actor);
  // the glass: bottom edge on the stage front, top edge leaning out towards the house
  const L = Math.hypot(APRON - FRONT, APRON - FRONT);
  const glass = G.pane(2.36, L, 0.014, [0, FLOOR + (APRON - FRONT) / 2, (APRON + FRONT) / 2], 0xb9c9c6, 0.05); glass.rotation.x = Math.PI / 4;
  const win = opening(new THREE.PlaneGeometry(2.36, L), [0, FLOOR + (APRON - FRONT) / 2 - 0.006, (APRON + FRONT) / 2 + 0.006]); win.rotation.x = Math.PI / 4;
  // what the house sees: the same figure, mirrored in the plane of the glass, and only where the glass is
  const MIRROR = mirror([0, FLOOR, FRONT], [0, -1, 1]);
  const ghostMat = limelit(true);
  const ghost = new THREE.Mesh(geo, ghostMat); ghost.matrixAutoUpdate = false; ghost.frustumCulled = false;
  const image = G.group(ghost);
  portal([win], image, { additive: true, solid: true });
  root.add(glass, win, image);
  // the plate stands in a sill on the edge of the stage, and a beam between the flats carries its top edge
  const head = G.box(2.36, 0.07, 0.045, timber, [0, FLOOR + (APRON - FRONT) + 0.008, APRON + 0.008], 0.006); head.rotation.x = Math.PI / 4;
  root.add(head, G.box(2.36, 0.035, 0.06, timber, [0, FLOOR + 0.0175, FRONT - 0.012], 0.006));
  // proscenium, curtains and float
  const plaster = M.enamel(0xd8d2c0), velvet = M.cloth(0x6e1616);
  for (const sx of [-1, 1]) {
    const px = sx * 1.33, pz = APRON + 0.14;
    // a pilaster each side: plinth and base, a sunk panel up its face, necking, capital and abacus
    root.add(G.box(0.22, 2.12, 0.22, plaster, [px, 1.06, pz]), G.box(0.28, 0.2, 0.28, plaster, [px, 0.1, pz]), G.box(0.25, 0.035, 0.25, plaster, [px, 0.2175, pz], 0.012));
    for (const s of [-1, 1]) root.add(G.box(0.025, 1.44, 0.01, plaster, [px + s * 0.0675, 1.0, pz + 0.113], 0), G.box(0.11, 0.025, 0.01, plaster, [px, 1.0 + s * 0.7075, pz + 0.113], 0));
    root.add(G.box(0.25, 0.03, 0.25, plaster, [px, 1.78, pz], 0.012), G.box(0.28, 0.08, 0.28, plaster, [px, 1.86, pz]), G.box(0.3, 0.02, 0.3, plaster, [px, 1.91, pz], 0));
    const c = new THREE.Mesh(drape(0.34, 1.12, 3, 0.03), velvet); c.position.set(sx * 1.04, 1.34, APRON + 0.07); root.add(c);
  }
  const valance = new THREE.Mesh(drape(2.44, 0.2, 14, 0.022, 0.09), velvet); valance.position.set(0, 1.84, APRON + 0.09);
  // the beam across: a gilt bead along its foot, a row of dentils under the cornice
  root.add(valance, G.box(2.9, 0.22, 0.24, plaster, [0, 2.03, APRON + 0.14]), G.box(3.0, 0.05, 0.3, plaster, [0, 2.16, APRON + 0.14]), G.box(2.95, 0.025, 0.27, plaster, [0, 2.123, APRON + 0.14], 0), G.box(2.9, 0.02, 0.012, plaster, [0, 1.97, APRON + 0.262], 0), G.box(2.44, 0.014, 0.014, brass, [0, 1.94, APRON + 0.263], 0));
  const dentils = new Swarm(new THREE.BoxGeometry(0.032, 0.034, 0.02), plaster, 44);
  for (let i = 0; i < 44; i++) dentils.put(i, (i - 21.5) * 0.066, 2.093, APRON + 0.268);
  dentils.done(); dentils.mesh.userData.noShadow = true;
  root.add(dentils.mesh);
  // the float: a trough of lamps along the front of the stage, each behind a brass hood that keeps its glare off the house
  root.add(G.box(2.2, 0.05, 0.07, brass, [0, 0.805, APRON + 0.02], 0.01), G.box(2.1, 0.02, 0.006, M.glow(0xffd9a0, 1.4), [0, 0.81, APRON - 0.018], 0));
  const shade = M.brass(); shade.side = THREE.DoubleSide;
  const hoods = new Swarm(new THREE.SphereGeometry(0.036, 10, 5, 0, Math.PI), shade, 13);
  for (let i = 0; i < 13; i++) hoods.put(i, (i - 6) * 0.165, 0.832, APRON + 0.02);
  hoods.done(); hoods.mesh.userData.noShadow = true;
  root.add(hoods.mesh);
  // border lights: the room on stage is lit whether or not the hall is
  // hung behind the glass: a lamp in front of it would show as a bright spot in the pane
  const foot = new THREE.PointLight(0xffe2b8, 1.5, 4.5, 1.5); foot.position.set(0, 1.85, -0.1);
  root.add(foot);
  fuse(root);
  const turn = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  return {
    root, inDark: 'better', view: [16, 11], views: { pit: { at: [0.6, 1.75, 2.1], to: [0, 0.1, 0.7], fov: 40, play: 0.1 }, seat: { at: [0, 1.22, 5.4], to: [0, 1.16, -0.3], fov: 26, play: 0.11 } },
    update: ({ t, lights }) => {
      actor.position.set(-0.22 + Math.sin(t * 0.45) * 0.36, 0.2, FRONT + 0.025 + 0.012 * Math.sin(t * 1.3));
      actor.quaternion.copy(LIE).multiply(turn.setFromAxisAngle(UP, Math.sin(t * 0.6) * 0.45));
      actor.updateMatrix();
      ghost.matrix.multiplyMatrices(MIRROR, actor.matrix); ghost.matrixWorldNeedsUpdate = true;
      ghostMat.uniforms.uGain.value = 0.95 - 0.45 * lights; // a reflection shows best against a dark stage
    },
  };
}

/** Fog screen: a thin sheet of fog falls between two curtains of air and a projector lights it from behind. You can walk through it. */
export function fogScreen(): Built {
  const root = G.group();
  const W = 2.0, H = 1.86, TOP = 2.02, cy = TOP - H / 2 - 0.01;
  const shell = M.plastic(0x1d1f22, 0.5), dark = M.dark(), black = M.black(), steel = M.steel(), rubber = M.rubber(), T = Math.PI / 2;
  // the unit overhead: two moulded halves with a seam between them. Fans draw air in through the top
  root.add(G.rbox(2.42, 0.32, 0.52, 0.07, shell, [0, TOP + 0.16, 0]), G.slab(2.426, 0.526, 0.071, 0.008, black, [0, TOP + 0.16, 0], 0).rotateX(T));
  const grille = vents(1.9, 0.34, 16, [0, TOP + 0.321, 0], true); grille.rotation.x = -T; grille.userData.noShadow = true;
  // underneath, the nozzle: the fog leaves by the slot in the middle, between two bands of honeycomb that comb the air smooth
  const comb = screen(1024, 88), cc = comb.ctx;
  cc.fillStyle = '#5c6268'; cc.fillRect(0, 0, 1024, 88);
  cc.fillStyle = '#0c0d0e';
  for (let row = 0; row < 11; row++) if (row < 4 || row > 6) for (let x = row % 2 ? 4 : 0; x < 1024; x += 8) { cc.beginPath(); cc.arc(x + 4, row * 8 + 4, 3.1, 0, 7); cc.fill(); }
  cc.fillStyle = '#18191b'; cc.fillRect(0, 32, 1024, 24); cc.fillStyle = '#000'; cc.fillRect(0, 38, 1024, 12);
  comb.tex.needsUpdate = true;
  const nozzle = G.plane(2.08, 0.18, new THREE.MeshStandardMaterial({ map: comb.tex, roughness: 0.6, metalness: 0.4 }), [0, TOP - 0.0285, 0]);
  nozzle.rotation.x = T; nozzle.userData.noShadow = true;
  root.add(grille, nozzle, G.box(2.12, 0.03, 0.2, dark, [0, TOP - 0.013, 0], 0.006), pilot(0x40d070, 0.012, [1.0, TOP + 0.08, 0.261]).rotateX(T));
  // two stands: a tube that slides in a wider one and is pinned, on a weighted foot
  for (const sx of [-1, 1]) {
    root.add(G.cyl(0.04, TOP, M.steel(1), [sx * 1.15, TOP / 2, 0], 20), G.cyl(0.3, 0.04, dark, [sx * 1.15, 0.02, 0], 40));
    root.add(stub(0.05, 0.9, dark, [sx * 1.15, 0.49, 0], 16), hush(stub(0.06, 0.05, black, [sx * 1.15, 0.93, 0], 16)), hush(stub(0.018, 0.05, black, [sx * 1.22, 0.93, 0], 8).rotateZ(T)), hush(stub(0.075, 0.02, dark, [sx * 1.15, TOP - 0.01, 0], 16)), hush(stub(0.09, 0.03, dark, [sx * 1.15, 0.055, 0], 16)));
  }
  // the fog is made from water: a hose runs down one stand to a can, and the mains lead down the other
  // the can is a muted blue, so that by day it does not outshine the picture that is seen past it
  const can = M.plastic(0x4a7096, 0.5);
  root.add(G.rbox(0.3, 0.34, 0.2, 0.04, can, [1.15, 0.17, -0.48]), hush(stub(0.04, 0.03, M.plastic(0xe6e4dc, 0.5), [1.07, 0.355, -0.48], 12)), hush(G.box(0.12, 0.03, 0.05, can, [1.2, 0.355, -0.48], 0)));
  root.add(hush(G.wire([[1.07, 0.37, -0.48], [1.07, 0.5, -0.42], [1.12, 0.8, -0.1], [1.15, 1.2, -0.05], [1.15, 1.8, -0.05], [1.15, TOP + 0.02, -0.07], [1.16, TOP + 0.1, -0.2], [1.17, TOP + 0.14, -0.262]], 0.014, M.plastic(0x6f93b5, 0.5), false, 5)));
  root.add(hush(G.wire([[-1.17, TOP + 0.14, -0.262], [-1.16, TOP + 0.08, -0.2], [-1.15, TOP - 0.03, -0.055], [-1.15, 1.5, -0.05], [-1.15, 0.4, -0.05], [-1.15, 0.06, -0.12], [-1.0, 0.014, -0.5], [-0.75, 0.014, -1.1], [-0.62, 0.03, -1.38]], 0.012, rubber, false, 5)));
  for (const y of [0.5, 1.3]) for (const sx of [-1, 1]) root.add(hush(stub(0.018, 0.03, black, [sx * 1.15, y, -0.048], 8)));
  const uT = { value: 0 };
  const fogMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.62, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  fogMat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uT;\nvarying vec3 vObj;\n${NOISE}`).replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
      float fn = vnoise(vec3(vObj.x * 2.6, vObj.y * 1.5 + uT * 0.9, uT * 0.2)) * 0.6 + vnoise(vec3(vObj.x * 9.0, vObj.y * 3.6 + uT * 1.8, 3.0)) * 0.4;
      float fall = (vObj.y + ${(H / 2).toFixed(3)}) / ${H.toFixed(3)};
      // even at the slot, ragged by the time it reaches the floor
      diffuseColor.a *= mix(0.25 + 0.95 * fn, 0.75, fall * fall) * smoothstep(0.0, 0.14, ${(W / 2).toFixed(3)} - abs(vObj.x)) * (0.5 + 0.5 * fall);`);
  };
  fogMat.customProgramCacheKey = () => 'fog';
  const img = screen(512, 448);
  const imgMat = M.add(img, 0xffffff, 0.9);
  root.add(G.plane(W, H, fogMat, [0, cy, 0]), G.plane(W, H, imgMat, [0, cy, 0.004]));
  // the projector stands behind and shines through
  const pz = -1.7, py = 0.95;
  // its lens stands out of the case in a barrel with a focusing ring, and the lit glass sits back inside
  const barrel = G.lathe([[0.1, 0], [0.1, 0.02], [0.088, 0.03], [0.088, 0.07], [0.094, 0.074], [0.094, 0.11], [0.085, 0.118], [0.076, 0.118], [0.07, 0.1], [0, 0.098]], dark, 28);
  barrel.rotation.x = T; barrel.position.set(0.12, 0, 0.23);
  const proj = G.group(G.rbox(0.56, 0.24, 0.46, 0.035, M.plastic(0x25272b, 0.5)), barrel, stub(0.07, 0.004, M.glow(0xffffff, 2.6), [0.12, 0, 0.331], 24).rotateX(T), halo(0xdfeeff, 0.5, [0.12, 0, 0.36], 0.6));
  const side = vents(0.3, 0.14, 6, [0.281, 0, 0]); side.rotation.y = T; side.userData.noShadow = true;
  // keys and a lamp on top, sockets at the back, and a plate under it for the stand
  proj.add(side, hush(G.box(0.16, 0.006, 0.1, black, [-0.12, 0.121, -0.08], 0)), pilot(0x40d070, 0.008, [-0.21, 0.12, 0.1]), hush(G.box(0.3, 0.1, 0.006, steel, [0, -0.02, -0.231], 0)), G.box(0.26, 0.02, 0.24, dark, [0, -0.13, 0], 0.004));
  for (let i = 0; i < 4; i++) proj.add(hush(stub(0.012, 0.008, M.plastic(0x4a4d52, 0.4), [-0.165 + i * 0.03, 0.125, -0.08], 8)));
  for (const x of [-0.1, -0.03, 0.08]) proj.add(hush(stub(0.014, 0.02, black, [x, -0.02, -0.24], 8).rotateX(T)));
  proj.position.set(-0.12, py, pz);
  // a block of sockets on the floor feeds the unit and the projector
  root.add(G.box(0.3, 0.05, 0.08, M.plastic(0xe6e4dc, 0.5), [-0.5, 0.025, -1.42], 0.012).rotateY(0.45), hush(G.wire([[-0.15, py - 0.02, pz - 0.25], [-0.16, py - 0.12, pz - 0.29], [-0.2, 0.3, pz - 0.2], [-0.3, 0.02, -1.6], [-0.4, 0.035, -1.47]], 0.011, rubber, false, 5)));
  const cone = new THREE.BufferGeometry();
  const a: V3 = [0, py, pz + 0.36], c: V3[] = [[-W / 2, cy - H / 2, 0], [W / 2, cy - H / 2, 0], [W / 2, cy + H / 2, 0], [-W / 2, cy + H / 2, 0]];
  cone.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 2, 3].flatMap((i) => [...a, ...c[i], ...c[(i + 1) % 4]]), 3));
  const throwMat = M.add(null, 0xffffff, 0.04);
  root.add(proj, new THREE.Mesh(cone, throwMat), post([-0.12, py - 0.12, pz], 0, 0.03), G.cyl(0.24, 0.03, dark, [-0.12, 0.015, pz], 32));
  fuse(root);
  return {
    root, views: { slot: { at: [0.5, 1.45, 1.6], to: [0, 2, 0], fov: 50, play: 0.1 }, fog: { at: [0.1, 1.3, 1.9], to: [0, 1.05, 0], fov: 46, play: 0.12 } }, inDark: 'better', glow: 0xcfe8ff, view: [22, 10], surface: img.canvas,
    update: ({ t, lights, camera }) => {
      uT.value = t;
      const c2 = img.ctx;
      c2.fillStyle = '#000'; c2.fillRect(0, 0, 512, 448);
      bigTime(c2, 512, 448, now().hhmmss, '#dff1ff', 800, 0.36);
      // turbulence smears the picture more the further the fog has fallen
      c2.fillStyle = 'rgba(0,0,0,.5)';
      for (let x = 0; x < 512; x += 9) { const h = 40 + 30 * Math.sin(x * 0.2 + t * 3); c2.fillRect(x + 4 * Math.sin(t * 2 + x), 448 - h * 3, 3, h * 3); }
      img.tex.needsUpdate = true;
      // fog throws light forward, so the picture is brightest when you face the projector through it
      const p = root.worldToLocal(camera.position.clone()), facing = Math.max(0, p.z / Math.hypot(p.x, p.z, 0.001));
      imgMat.opacity = (1 - 0.78 * lights) * (0.4 + 0.6 * facing);
      throwMat.opacity = 0.06 - 0.045 * lights;
    },
  };
}

/** Persistence of vision: one bar of LEDs, spun fast enough that the eye fills in the disc. */
export function pov(): Built {
  const root = G.group();
  const dark = M.dark(), black = M.black(), steel = M.steel(), T = Math.PI / 2;
  // a weighted foot, a column, and a saddle that clamps the motor to it
  root.add(G.lathe([[0, 0], [0.62, 0], [0.62, 0.035], [0.6, 0.055], [0.56, 0.06], [0.12, 0.064], [0.09, 0.09], [0.09, 0.15], [0.07, 0.16], [0, 0.16]], dark, 56).translateZ(-0.25), G.cyl(0.05, 1.0, M.steel(1), [0, 0.63, -0.25], 20));
  root.add(G.box(0.15, 0.09, 0.22, dark, [0, 1.085, -0.24], 0.012), hush(stub(0.03, 0.03, black, [0.09, 1.085, -0.24], 10).rotateZ(T)), hush(screws([[0.035, 0.151, -0.2], [-0.035, 0.151, -0.2], [0.035, 0.151, -0.3], [-0.035, 0.151, -0.3]], 0.012, 'y')));
  // the motor: a round can with cooling fins turned into it, a bearing boss in front and the lead out of the back
  const can: P2[] = [[0, -0.17], [0.11, -0.17], [0.14, -0.15], [0.14, -0.105]];
  for (let k = 0; k < 6; k++) { const y = -0.1 + k * 0.034; can.push([0.158, y], [0.158, y + 0.014], [0.14, y + 0.018], [0.14, y + 0.03]); }
  can.push([0.14, 0.12], [0.128, 0.14], [0.07, 0.14], [0.065, 0.17], [0, 0.17]);
  const motor = G.lathe(can, M.plastic(0x1d1f22, 0.5), 28); motor.rotation.x = T; motor.position.set(0, 1.25, -0.22);
  root.add(motor, stub(0.035, 0.1, steel, [0, 1.25, -0.01], 14).rotateX(T), hush(stub(0.024, 0.04, black, [0, 1.19, -0.4], 8).rotateX(T)));
  root.add(hush(G.wire([[0, 1.19, -0.42], [0, 1.15, -0.45], [0, 1.0, -0.33], [0.02, 0.6, -0.31], [0, 0.2, -0.32], [0.05, 0.075, -0.42], [0.25, 0.068, -0.62], [0.42, 0.045, -0.74]], 0.011, M.rubber(), false, 5)));
  const rotor = G.group(); rotor.position.set(0, 1.25, 0.05);
  // the blade is a strip of circuit board: a pad under every lamp, a driver chip for each group of six, two supply tracks
  const board = screen(64, 512), bc = board.ctx;
  bc.fillStyle = '#17191c'; bc.fillRect(0, 0, 64, 512);
  bc.fillStyle = '#2b3036'; bc.fillRect(8, 0, 2, 512); bc.fillRect(54, 0, 2, 512);
  for (let i = 0; i < 18; i++) {
    const y = 512 - ((0.07 + i * 0.051) / 0.98) * 512;
    bc.fillStyle = '#8f949a'; bc.fillRect(18, y - 9, 28, 18);
    bc.fillStyle = '#e9e6dc'; bc.fillRect(21, y - 7, 22, 14);
    if (i % 6 === 2) { bc.fillStyle = '#060607'; bc.fillRect(46, y + 8, 12, 11); bc.fillStyle = '#9aa0a6'; for (let k = 0; k < 4; k++) bc.fillRect(44, y + 9 + k * 3, 2, 1.5); }
  }
  board.tex.needsUpdate = true;
  const armMat = M.plastic(0xffffff, 0.5); armMat.map = board.tex; armMat.transparent = true;
  const ledMat = M.glow(0x9fe0ff, 2);
  // the hub that carries the blade, with the cap that clamps it
  rotor.add(G.cyl(0.09, 0.04, dark, undefined, 24).rotateX(T), stub(0.05, 0.012, steel, [0, 0, 0.026], 16).rotateX(T), hush(screws([[0.03, 0.03, 0.03], [-0.03, 0.03, 0.03], [0.03, -0.03, 0.03], [-0.03, -0.03, 0.03]], 0.009)));
  const bulbs: THREE.BufferGeometry[] = [];
  for (const s of [1, -1]) {
    const arm = G.rbox(0.075, 0.98, 0.016, 0.006, armMat, [0, s * 0.5, 0]); arm.rotation.z = s > 0 ? 0 : Math.PI;
    rotor.add(arm);
    // eighteen lamps each side of the hub, all one piece of light
    for (let i = 0; i < 18; i++) bulbs.push(new THREE.SphereGeometry(0.016, 8, 6).translate(0, s * (0.08 + i * 0.051), 0.012));
  }
  rotor.add(hush(new THREE.Mesh(G.merge(bulbs), ledMat)));
  fuse(root, [rotor]);
  const s = screen(512, 512);
  const imgMat = M.add(s, 0xffffff, 0);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 72), imgMat); disc.position.set(0, 1.25, 0.062);
  root.add(rotor, disc);
  const c = s.ctx;
  let angle = 0, last = 0;
  return {
    root, views: { front: { at: [0, 1.35, 3.4], to: [0, 1.25, 0], fov: 34, play: 0.2 }, bar: { at: [0.85, 1.6, 1.6], to: [0.25, 1.35, 0.05], fov: 32 } }, inDark: 'glows', glow: 0x7fd0ff, view: [16, 6], surface: s.canvas,
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
for (let i = 0; i < 900; i++) {
  const u = i / 900, a = u * Math.PI * 7, y = 0.46 + u * 0.8;
  if (i % 45 < 13) { const k = (i % 45) / 12; helix.push([Math.cos(a) * 0.34 * (1 - 2 * k), y, Math.sin(a) * 0.34 * (1 - 2 * k)]); }
  else helix.push(i % 2 ? [Math.cos(a) * 0.34, y, Math.sin(a) * 0.34] : [-Math.cos(a) * 0.34, y, -Math.sin(a) * 0.34]);
}

/** Swept volume: a screen spins inside a dome and a fast projector lights each point as the screen passes through it. */
export function sweptVolume(): Built {
  const root = G.group();
  const vox = voxels(helix, 0.05);
  const scr = new THREE.Mesh(new THREE.CircleGeometry(0.62, 56), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, roughness: 1, side: THREE.DoubleSide, depthWrite: false }));
  scr.position.y = 0.86;
  const dome = G.lathe([[0.9, 0.34], [0.9, 0.7], [0.86, 1.0], [0.7, 1.28], [0.4, 1.46], [0, 1.52]], M.bulb(0x9fb1ae, 0.6), 80, true);
  const shell = M.plastic(0x1d1f22, 0.45), dark = M.dark(), black = M.black(), steel = M.steel(), T = Math.PI / 2;
  // the pedestal holds the projector and the motor. The dome stands in a rubber seating on its deck
  root.add(G.cyl(1.0, 0.34, shell, [0, 0.17, 0], 72), G.cyl(1.01, 0.03, steel, [0, 0.3, 0], 72), G.cyl(0.9, 0.012, black, [0, 0.346, 0], 72), stub(1.01, 0.03, dark, [0, 0.015, 0], 72), vox.points, dome);
  root.add(hush(new THREE.Mesh(new THREE.TorusGeometry(0.905, 0.014, 6, 72).rotateX(T), M.rubber())).translateY(0.354));
  for (let i = 0; i < 6; i++) { const v = vents(0.3, 0.14, 5, [Math.sin(i * 1.047) * 1.001, 0.15, Math.cos(i * 1.047) * 1.001]); v.rotation.y = i * 1.047; v.userData.noShadow = true; root.add(v); }
  // between two of the louvres, a panel with the switch and its lamp. At the back, the mains lead and the cable for the picture
  const panel = G.group(G.slab(0.3, 0.11, 0.012, 0.012, steel, undefined, 0), hush(stub(0.026, 0.014, black, [-0.08, 0, 0.01], 14).rotateX(T)), pilot(0x40d070, 0.011, [0.0, 0, 0.008]).rotateX(T), hush(screws([[-0.135, 0.04, 0.006], [0.135, 0.04, 0.006], [-0.135, -0.04, 0.006], [0.135, -0.04, 0.006]], 0.007)));
  panel.position.set(Math.sin(0.5236) * 0.997, 0.16, Math.cos(0.5236) * 0.997); panel.rotation.y = 0.5236;
  const back = G.group(G.slab(0.26, 0.1, 0.01, 0.012, steel, undefined, 0), hush(stub(0.022, 0.03, black, [-0.06, 0, 0.018], 10).rotateX(T)), hush(G.box(0.07, 0.03, 0.03, black, [0.06, 0, 0.018], 0)));
  back.position.set(Math.sin(3.665) * 0.998, 0.13, Math.cos(3.665) * 0.998); back.rotation.y = 3.665;
  root.add(panel, back);
  // what turns: a platter, the screen standing in a slotted rail across it, and a mirror at its edge. The projector
  // shines up through a window in the platter, and the mirror throws its picture on the screen. A weight opposite balances it
  const glassy = G.group(G.box(0.2, 0.2, 0.004, M.chrome(), [0, 0, 0.002], 0), G.box(0.215, 0.215, 0.008, dark, [0, 0, -0.004], 0));
  glassy.position.set(0, 0.5, 0.7); glassy.rotation.x = 2.593;
  const spin = hush(G.group(
    stub(0.85, 0.012, dark, [0, 0.359, 0], 56), G.box(0.78, 0.036, 0.05, black, [0, 0.383, 0], 0), stub(0.07, 0.012, steel, [0, 0.371, 0.16], 16),
    stub(0.062, 0.008, black, [0, 0.368, 0.7], 18), stub(0.05, 0.004, M.glow(0xcfe6ff, 1.3), [0, 0.373, 0.7], 18), glassy,
    G.rod([0, 0.36, 0.8], [0, 0.5, 0.8], 0.012, steel, 8), G.rod([0, 0.5, 0.8], [0, 0.5, 0.71], 0.009, steel, 6), G.box(0.22, 0.05, 0.1, steel, [0, 0.39, -0.72], 0.008),
  ));
  fuse(spin);
  spin.add(scr);
  for (const to of [[-0.32, 0.86, 0], [0.32, 0.86, 0], [0, 0.52, 0], [0, 1.2, 0], [0, 0.375, 0.7]] as V3[]) { const ray = beam(0xcfe6ff, 0.14); ray.aim([0, 0.5, 0.7], to); spin.add(ray.line); }
  root.add(spin);
  fuse(root, [spin]);
  const col = new THREE.Color();
  return {
    root, views: { round: { at: [0, 1.2, 3], to: [0, 0.8, 0], fov: 34, play: 0.3 }, dome: { at: [0.95, 1.25, 1.55], to: [0, 0.9, 0], fov: 30 } }, inDark: 'glows', glow: 0x8fd0ff, view: [24, 14],
    update: ({ t }) => {
      const th = t * 3.2;
      spin.rotation.y = -th;
      helix.forEach((p, i) => {
        const d = Math.abs(Math.sin(Math.atan2(p[2], p[0]) - th)); // 0 when the screen is passing this point
        const k = 0.2 + 0.8 * Math.exp(-d * 5);
        col.setHSL(0.52 + ((p[1] - 0.4) / 0.85) * 0.3, 0.9, 0.6);
        vox.col.set([col.r * k, col.g * k, col.b * k], i * 3);
      });
      vox.flush();
    },
  };
}

/**
 * Static volume, both ways. A stack of liquid crystal sheets: one at a time turns milky and catches its slice of
 * the picture. And beside it a block of glass in three layers, which glows where two infrared beams cross.
 */
export function staticVolume(): Built {
  const root = G.group();
  const LAYERS = 12, S = 1.3, cy = 1.0;
  const pts: V3[] = [], layerOf: number[] = [];
  for (let i = 0; i < 1300; i++) {
    const a = (i / 1300) * Math.PI * 2 * 3, b = (i / 1300) * Math.PI * 2 * 2;
    const r = 0.36 + 0.14 * Math.cos(a);
    const z = 0.14 * Math.sin(a) * 3.2;
    const k = Math.max(0, Math.min(LAYERS - 1, Math.round((z / (S * 0.9) + 0.5) * (LAYERS - 1))));
    pts.push([r * Math.cos(b), cy + r * Math.sin(b), (k / (LAYERS - 1) - 0.5) * S * 0.9]); layerOf.push(k);
  }
  const vox = voxels(pts, 0.045);
  const sheets = Array.from({ length: LAYERS }, (_, k) => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.03, roughness: 1, side: THREE.DoubleSide, depthWrite: false });
    root.add(G.plane(S, S, m, [0, cy, (k / (LAYERS - 1) - 0.5) * S * 0.9]));
    return m;
  });
  // the cabinet: a frame round the stack, the projector in a box behind
  const shell = M.plastic(0x1d1f22, 0.5), fr = M.dark(1), dark = M.dark(), black = M.black(), steel = M.steel(), rubber = M.rubber(), h = S / 2 + 0.03, T = Math.PI / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.box(0.05, S + 0.12, 0.05, fr, [sx * h, cy, sz * h]));
  for (const sy of [-1, 1]) root.add(G.box(S + 0.11, 0.05, S + 0.11, shell, [0, cy + sy * (h + 0.025), 0]));
  // every sheet stands in a slotted rail and hangs in another. While it is clear, its ground edges are all that shows of it
  const rails = new Swarm(new THREE.BoxGeometry(S, 0.03, 0.026), black, LAYERS * 2);
  const edges = new Swarm(new THREE.BoxGeometry(0.004, S, 0.007), new THREE.MeshPhysicalMaterial({ color: 0x3f7f6e, roughness: 0.3, transparent: true, opacity: 0.34, depthWrite: false }), LAYERS * 2);
  for (let k = 0; k < LAYERS; k++) for (const s of [-1, 1]) {
    const i = k * 2 + (s + 1) / 2, z = (k / (LAYERS - 1) - 0.5) * S * 0.9;
    rails.put(i, 0, cy + s * (S / 2 + 0.015), z); edges.put(i, s * S / 2, cy, z);
  }
  rails.done(); edges.done(); rails.mesh.userData.noShadow = true;
  root.add(rails.mesh, edges.mesh, vox.points, G.rbox(S + 0.11, S + 0.16, 0.9, 0.04, shell, [0, cy, -h - 0.47]));
  // the projector looks out of its box through a lens in a hood
  const hood = G.lathe([[0.135, 0], [0.135, 0.012], [0.118, 0.02], [0.118, 0.055], [0.108, 0.06], [0.1, 0.06], [0.094, 0.036]], dark, 32);
  hood.rotation.x = T; hood.position.set(0, cy, -h - 0.02);
  root.add(hood, stub(0.094, 0.004, M.glow(0xfff2e0, 1.6), [0, cy, -h + 0.014], 28).rotateX(T));
  // louvres at the back and on one side, and the mains inlet with its switch
  const back = vents(0.9, 0.5, 9, [0, cy, -h - 0.921]), side = vents(0.5, 0.36, 8, [-(S + 0.11) / 2 - 0.001, cy + 0.3, -h - 0.47]), bolts = screws([[-0.62, cy + 0.65, h + 0.92], [0.62, cy + 0.65, h + 0.92], [-0.62, cy - 0.65, h + 0.92], [0.62, cy - 0.65, h + 0.92]], 0.016);
  side.rotation.y = T; bolts.rotation.y = Math.PI; back.userData.noShadow = side.userData.noShadow = bolts.userData.noShadow = true;
  root.add(back, side, bolts, G.box(0.3, 0.14, 0.006, steel, [0.42, cy - 0.55, -h - 0.922], 0), G.box(0.09, 0.07, 0.008, black, [0.36, cy - 0.55, -h - 0.925], 0), G.box(0.04, 0.06, 0.014, M.plastic(0xa3231a, 0.4), [0.5, cy - 0.55, -h - 0.926], 0));
  // the whole stands on a welded frame with levelling feet
  for (const sx of [-1, 1]) {
    root.add(G.box(0.05, 0.05, 2.19, fr, [sx * 0.63, 0.245, -0.45], 0.006));
    for (const z of [0.62, -1.52]) root.add(G.box(0.06, 0.25, 0.06, fr, [sx * 0.63, 0.125, z], 0.006), stub(0.05, 0.02, rubber, [sx * 0.63, 0.01, z]));
  }
  for (const z of [0.62, -1.52]) root.add(G.box(1.21, 0.05, 0.05, fr, [0, 0.245, z], 0.006));

  // the other way, to the right of the projector: the block of glass of 1996, many times its size. It is built in
  // three layers, one for each colour. One beam comes up from the cabinet under it and one out of the housing at
  // its side, and a black card stands behind it, so that the light shows by day. It stands back there so that the
  // look along the sheets, from the right, has nothing lit behind it
  const GX = 1.28, GZ = -0.9, C = 0.56, y0 = 0.585, yc = y0 + C / 2, tall = C + 0.14;
  const tints = [0xdcc3bd, 0xc2d8c4, 0xbfc8de];
  const grille = vents(0.44, 0.2, 5, [GX - 0.08, 0.3, GZ + 0.341]); grille.userData.noShadow = true;
  root.add(G.rbox(0.8, 0.5, 0.74, 0.03, shell, [GX - 0.08, 0.31, GZ - 0.03]), grille, jewel(0xff3020, 0.014, [GX + 0.22, 0.47, GZ + 0.34]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(stub(0.05, 0.06, rubber, [GX - 0.08 + sx * 0.32, 0.03, GZ - 0.03 + sz * 0.29], 12, 0.043));
  // the card stands in a channel, and the block is held down on its plate by an angle at each corner
  root.add(G.box(C + 0.06, 0.025, C + 0.06, dark, [GX, 0.5725, GZ]), G.box(C + 0.24, tall, 0.03, black, [GX - 0.06, 0.56 + tall / 2, GZ - C / 2 - 0.06]), G.box(C + 0.26, 0.04, 0.05, dark, [GX - 0.06, 0.58, GZ - C / 2 - 0.06], 0), G.rbox(0.14, tall, C + 0.12, 0.03, shell, [GX - C / 2 - 0.11, 0.56 + tall / 2, GZ - 0.02]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.box(0.06, 0.034, 0.012, steel, [GX + sx * (C / 2 - 0.03), y0 + 0.017, GZ + sz * (C / 2 + 0.006)], 0), G.box(0.012, 0.034, 0.06, steel, [GX + sx * (C / 2 + 0.006), y0 + 0.017, GZ + sz * (C / 2 - 0.03)], 0));
  const pan = screws([[0.845, 0.62, GZ + 0.32], [0.935, 0.62, GZ + 0.32], [0.845, 1.2, GZ + 0.32], [0.935, 1.2, GZ + 0.32], [0.84, 0.52, GZ + 0.34], [1.56, 0.52, GZ + 0.34], [0.84, 0.1, GZ + 0.34], [1.56, 0.1, GZ + 0.34]], 0.012); pan.userData.noShadow = true;
  // each beam leaves through a lens in a ring: one let into the plate under the block, one in a short barrel at its side
  const from1: V3 = [GX, y0 + 0.001, GZ], from2: V3 = [GX - C / 2 - 0.038, yc, GZ], lit = M.glow(0xff4030, 0.9);
  const ring = G.lathe([[0.064, 0], [0.064, 0.004], [0.05, 0.008], [0.043, 0.002]], dark, 24), barrel = G.lathe([[0.066, 0], [0.066, 0.02], [0.054, 0.036], [0.044, 0.036], [0.042, 0.004]], dark, 24);
  ring.position.set(GX, y0 - 0.001, GZ); barrel.rotation.z = -T; barrel.position.set(GX - C / 2 - 0.04, yc, GZ);
  const eyes = [stub(0.04, 0.004, lit, from1, 20), stub(0.04, 0.004, lit, from2, 20).rotateZ(T)];
  for (const e of eyes) e.userData.noShadow = true;
  root.add(pan, ring, barrel, ...eyes);
  tints.forEach((tint, k) => root.add(G.box(C, C / 3 - 0.003, C, M.glass(tint, 0.07, 0.5), [GX, y0 + (k + 0.5) * (C / 3), GZ])));
  const path = knot(GX, yc + 0.038, GZ, 0.243);
  const HUE: V3[] = [[1, 0.2, 0.14], [0.22, 1, 0.36], [0.28, 0.48, 1]];
  const hue = (y: number): V3 => HUE[Math.max(0, Math.min(2, Math.floor((y - y0) / (C / 3))))];
  const trail = airTrail(340, 0.05, path, (u) => hue(path(u)[1]));
  const spark = halo(0xffffff, 0.18);
  const up = ray(0xff3a24, 0.0055, 0.55), across = ray(0xff3a24, 0.0055, 0.55);
  // from the first moment they lie inside the block, so that the model is measured as it stands
  up.aim(from1, [GX, y0 + C, GZ]); across.aim(from2, [GX + C / 2, yc, GZ]);
  spark.position.set(...path(0));
  root.add(trail.points, spark, up.mesh, across.mesh);
  fuse(root);

  const col = new THREE.Color();
  return {
    root, views: { sheets: { at: [1.8, 1.25, 0.55], to: [0, 1.0, 0], fov: 32 }, glass: { at: [GX + 0.5, 1.14, GZ + 1.5], to: [GX - 0.03, yc - 0.02, GZ], fov: 30 } }, inDark: 'glows', glow: 0xffb070, view: [32, 12],
    update: ({ t }) => {
      const live = Math.floor(t * 7) % LAYERS; // slowed far down: the real stack cycles every sheet about fifty times a second
      sheets.forEach((m, k) => { m.opacity = k === live ? 0.3 : 0.025; });
      pts.forEach((_, i) => { const k = layerOf[i] === live ? 1 : 0.3; col.setHSL(0.06 + (layerOf[i] / LAYERS) * 0.12, 1, 0.6); vox.col.set([col.r * k, col.g * k, col.b * k], i * 3); });
      vox.flush();
      // the crossing point is steered round the figure. Each beam goes on through the block: only the crossing glows
      const ph = (t * 0.22) % 1, at = path(ph), c = hue(at[1]);
      trail.trace(ph);
      spark.position.set(at[0], at[1], at[2]);
      (spark.material as THREE.SpriteMaterial).color.setRGB(c[0], c[1], c[2]);
      const k1 = (y0 + C - from1[1]) / (at[1] - from1[1]), k2 = (GX + C / 2 - from2[0]) / (at[0] - from2[0]);
      up.aim(from1, [from1[0] + (at[0] - from1[0]) * k1, y0 + C, from1[2] + (at[2] - from1[2]) * k1]);
      across.aim(from2, [GX + C / 2, from2[1] + (at[1] - from2[1]) * k2, from2[2] + (at[2] - from2[2]) * k2]);
    },
  };
}

/** A beam that is turned while it shines: a thin rod of light from one point to another. */
function ray(color: number, r: number, opacity: number): { mesh: THREE.Mesh; aim: (a: V3, b: V3) => void } {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8, 1, true), M.add(null, color, opacity));
  const along = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  return {
    mesh,
    aim: (a, b) => {
      along.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const len = along.length() || 1e-6;
      mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      mesh.scale.set(1, len, 1);
      mesh.quaternion.setFromUnitVectors(Y, along.divideScalar(len));
    },
  };
}

const knot = (cx: number, cy: number, cz: number, s: number) => (u: number): V3 => {
  const a = u * Math.PI * 2;
  return [cx + s * (Math.sin(a) + 2 * Math.sin(2 * a)) / 3, cy + s * (Math.cos(a) - 2 * Math.cos(2 * a)) / 3, cz + s * -Math.sin(3 * a) / 2.4];
};
const rainbow = (u: number): V3 => { const c = new THREE.Color().setHSL(u, 1, 0.6); return [c.r, c.g, c.b]; };

/** A figure drawn in the air by one moving point: every place it has just been is still fading in the eye. */
function airTrail(n: number, size: number, path: (u: number) => V3, colour: (u: number) => V3) {
  const g = glows(n, size);
  const trace = (phase: number) => {
    for (let i = 0; i < n; i++) {
      const u = i / n, age = (((phase - u) % 1) + 1) % 1, k = 0.14 + 0.86 * Math.pow(1 - age, 3), c = colour(u);
      g.pos.set(path(u), i * 3); g.col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
    }
    g.flush(true);
  };
  trace(0); g.points.geometry.computeBoundingBox();
  return { points: g.points, trace };
}

/** Optical trap display: one speck of cellulose held in a laser beam, dragged around and lit in colour as it goes. */
export function opticalTrap(): Built {
  const root = G.group();
  root.add(breadboard(2.3, 1.4, 0.08), feet(2.3, 1.4, 0.06, 0.06, -0.06));
  const Y = 0.46, T = Math.PI / 2, dark = M.dark(), black = M.black(), steel = M.steel(), rubber = M.rubber(), shell = M.plastic(0x1d1f22, 0.5);
  // the trapping laser: violet and nearly invisible. Its tube lies in two clamps, with the lead out of the back and a small nose where the beam leaves
  const laser = G.group(G.cyl(0.09, 0.74, M.steel(1), undefined, 28), stub(0.095, 0.06, dark, [0, 0.36, 0], 28), stub(0.095, 0.06, dark, [0, -0.36, 0], 28), stub(0.03, 0.04, black, [0, 0.4, 0], 12), stub(0.026, 0.05, black, [0, -0.4, 0], 10));
  laser.rotation.z = -T; laser.position.set(-0.68, Y, 0);
  for (const x of [-0.9, -0.46]) root.add(G.box(0.07, 0.07, 0.24, dark, [x, Y - 0.085, 0], 0.006), hush(new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.012, 6, 24, Math.PI).rotateY(T), black)).translateX(x).translateY(Y), hush(screws([[x, Y - 0.048, 0.105], [x, Y - 0.048, -0.105]], 0.012, 'y')));
  // the mirror that folds the beam upward and steers it: glass in a mount that two small motors tip
  const fold = G.group(stub(0.11, 0.012, M.chrome(), undefined, 28), G.box(0.26, 0.03, 0.26, dark, [0, -0.022, 0], 0.006), stub(0.03, 0.09, black, [0.09, -0.08, 0.09], 10), stub(0.03, 0.09, black, [-0.09, -0.08, -0.09], 10), hush(stub(0.014, 0.02, steel, [0.09, -0.135, 0.09], 8)), hush(stub(0.014, 0.02, steel, [-0.09, -0.135, -0.09], 8)));
  fold.rotation.z = -Math.PI / 4; fold.position.set(0.25, Y, 0);
  // the lens that brings the beam to the point where the speck is held, in a ring on an arm
  const glass = G.sph(0.14, M.glass(0x9fb6b8, 0.07, 0.75), [0.25, 0.78, 0], 32); glass.scale.y = 0.32;
  root.add(laser, fold, glass, new THREE.Mesh(new THREE.TorusGeometry(0.143, 0.016, 8, 36).rotateX(T).translate(0.25, 0.78, 0), dark), hush(stub(0.014, 0.03, steel, [0.25, 0.78, 0.168], 8).rotateX(T)));
  root.add(post([-0.9, Y - 0.12, 0], 0.08), post([-0.46, Y - 0.12, 0], 0.08), post([0.25, Y - 0.09, 0], 0.08), post([0.44, 0.78, 0], 0.08), G.rod([0.44, 0.78, 0], [0.39, 0.78, 0], 0.02, steel, 10), stub(0.034, 0.05, dark, [0.44, 0.78, 0], 12));
  // three small lasers colour the speck as it passes: red, green and blue, side by side in one head that is tipped up at the figure
  const head = G.group(G.rbox(0.34, 0.2, 0.3, 0.03, shell), hush(G.box(0.3, 0.004, 0.2, black, [0, 0.101, -0.02], 0)), hush(stub(0.024, 0.04, black, [0, -0.02, -0.165], 10).rotateX(T)));
  [0xff3020, 0x30ff50, 0x3060ff].forEach((hue, i) => {
    const tube = G.lathe([[0.042, 0], [0.042, 0.05], [0.036, 0.06], [0.03, 0.06], [0.028, 0.03]], dark, 14); tube.rotation.x = T; tube.position.set(-0.08 + i * 0.08, 0.01, 0.15);
    head.add(tube, hush(stub(0.028, 0.004, M.glow(hue, 2.2), [-0.08 + i * 0.08, 0.01, 0.182], 12).rotateX(T)), halo(hue, 0.16, [-0.08 + i * 0.08, 0.01, 0.215], 0.5));
  });
  head.position.set(-0.3, 0.62, -0.48); head.lookAt(0.25, 1.36, 0);
  root.add(head, post([-0.3, 0.5, -0.48], 0.08), stub(0.05, 0.06, dark, [-0.3, 0.5, -0.48], 14));
  // the supply that drives the lasers, with its key switch, and the leads
  const supply = G.group(G.rbox(0.42, 0.17, 0.3, 0.02, shell, [0, 0.085, 0]), hush(G.box(0.36, 0.12, 0.004, steel, [0, 0.085, 0.151], 0)), pilot(0x40d070, 0.012, [0.13, 0.11, 0.153]).rotateX(T), hush(stub(0.024, 0.02, black, [-0.1, 0.085, 0.16], 12).rotateX(T)), hush(stub(0.018, 0.016, steel, [0.03, 0.085, 0.158], 10).rotateX(T)));
  const louvres = vents(0.3, 0.2, 7, [0, 0.1705, 0], true); louvres.rotation.x = -T; louvres.userData.noShadow = true;
  supply.add(louvres);
  supply.position.set(-0.82, 0.08, -0.46);
  root.add(supply, hush(G.wire([[-1.08, Y, 0], [-1.13, Y - 0.02, -0.02], [-1.12, 0.2, -0.2], [-1.06, 0.1, -0.4], [-1.03, 0.16, -0.46]], 0.012, rubber, false, 5)), hush(G.wire([[-0.34, 0.56, -0.64], [-0.36, 0.5, -0.7], [-0.45, 0.14, -0.66], [-0.55, 0.1, -0.56], [-0.61, 0.16, -0.5]], 0.012, rubber, false, 5)));
  const path = knot(0.25, 1.36, 0, 0.42);
  const trail = airTrail(520, 0.07, path, rainbow);
  const speck = halo(0xffffff, 0.2);
  const b0 = beam(0xa070ff, 0.5), b1 = beam(0xa070ff, 0.5);
  b0.aim([-0.26, Y, 0], [0.25, Y, 0]);
  root.add(trail.points, speck, b0.line, b1.line);
  fuse(root);
  return {
    root, views: { front: { at: [0, 1.4, 4.3], to: [0, 1.15, 0], fov: 34, play: 0.2 }, speck: { at: [1.1, 1.6, 1.5], to: [0.25, 1.5, 0], fov: 32 } }, inDark: 'better', glow: 0xb090ff, view: [26, 12],
    update: ({ t }) => {
      const ph = (t * 0.35) % 1;
      trail.trace(ph);
      const p = path(ph);
      speck.position.set(p[0], p[1], p[2]);
      b1.aim([0.25, Y, 0], p);
    },
  };
}

/** Acoustic levitation display: ultrasound from two arrays holds a bead in the air and throws it around a figure. */
export function acousticLev(): Built {
  const root = G.group();
  const K = 12, N = K * K, P = 0.105;
  for (const [y, flip] of [[0.22, 1], [1.76, -1]] as const) {
    const can = new Swarm(new THREE.CylinderGeometry(0.046, 0.046, 0.09, 20), M.steel(1), N);
    const tops = new Swarm(new THREE.CylinderGeometry(0.036, 0.036, 0.008, 20), M.plastic(0x0d0e0f, 0.7), N);
    for (let i = 0; i < N; i++) { const x = ((i % K) - (K - 1) / 2) * P, z = (Math.floor(i / K) - (K - 1) / 2) * P; can.put(i, x, y + flip * 0.075, z); tops.put(i, x, y + flip * 0.122, z); }
    can.done(); tops.done();
    root.add(can.mesh, tops.mesh, G.box(K * P + 0.12, 0.03, K * P + 0.12, M.pcb(), [0, y + flip * 0.015, 0], 0.004), G.box(K * P + 0.18, 0.06, K * P + 0.18, M.dark(), [0, y - flip * 0.03, 0]));
  }
  const half = (K * P) / 2 + 0.04;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.cyl(0.024, 1.6, M.steel(1), [sx * half, 0.99, sz * half], 16));
  // the lower array stands on the box that holds the driving electronics: every speaker has its own timing
  const shell = M.plastic(0x1d1f22, 0.5), dark = M.dark(), black = M.black(), steel = M.steel(), T = Math.PI / 2;
  root.add(G.rbox(1.38, 0.13, 1.38, 0.02, shell, [0, 0.085, 0]), G.box(1.24, 0.02, 1.24, black, [0, 0.155, 0], 0), hush(G.box(0.5, 0.08, 0.006, steel, [0.3, 0.085, 0.691], 0)), pilot(0x40d070, 0.012, [0.46, 0.085, 0.694]).rotateX(T), hush(stub(0.022, 0.016, black, [0.34, 0.085, 0.698], 12).rotateX(T)), hush(G.box(0.07, 0.03, 0.012, black, [0.18, 0.085, 0.694], 0)));
  for (const sx of [-1, 1]) {
    const slots = vents(0.6, 0.07, 12, [sx * 0.691, 0.085, 0], true); slots.rotation.y = T; slots.userData.noShadow = true;
    root.add(slots);
    for (const sz of [-1, 1]) {
      const x = sx * half, z = sz * half;
      // each post is clamped to the boards by a nut, and the box stands on four low feet
      root.add(hush(stub(0.05, 0.02, M.rubber(), [sx * 0.6, 0.01, sz * 0.6], 12)), hush(stub(0.042, 0.03, steel, [x, 0.265, z], 6)), hush(stub(0.042, 0.03, steel, [x, 1.715, z], 6)));
    }
  }
  // a flat cable carries the timing up the back to the upper array, at the corner where it is not behind the picture
  const flat = M.plastic(0x6a6e74, 0.7);
  root.add(hush(G.box(0.09, 1.44, 0.004, flat, [0.57, 0.99, -0.712], 0)), hush(G.box(0.09, 0.004, 0.03, flat, [0.57, 1.712, -0.699], 0)), hush(G.box(0.09, 0.004, 0.03, flat, [0.57, 0.268, -0.699], 0)), hush(G.box(0.12, 0.03, 0.03, black, [0.57, 1.715, -0.675], 0)), hush(G.box(0.12, 0.03, 0.03, black, [0.57, 0.265, -0.675], 0)));
  // the coloured light that shines on the bead: a small head on two of the posts, each with a red, a green and a blue lamp
  for (const [x, z] of [[-half, half], [half, -half]]) {
    const head = G.group(G.box(0.12, 0.07, 0.06, dark, undefined, 0.006), hush(G.box(0.05, 0.05, 0.05, dark, [0, 0, -0.05], 0)));
    [0xff3020, 0x30ff50, 0x3060ff].forEach((hue, i) => head.add(hush(stub(0.012, 0.004, M.glow(hue, 2), [(i - 1) * 0.034, 0, 0.032], 10).rotateX(T))));
    head.position.set(x * 0.9, 1.5, z * 0.9); head.lookAt(0, 0.99, 0);
    root.add(head);
  }
  // the figure the bead draws: a butterfly, flown fast enough that the whole outline is seen at once
  const path = (u: number): V3 => { const a = u * Math.PI * 2, r = 0.36 * (0.55 + 0.45 * Math.cos(4 * a)) * (1 - 0.35 * Math.sin(a) ** 2); return [r * Math.sin(a) * 1.25, 0.99 + r * Math.cos(a) * 0.9, 0.16 * Math.sin(2 * a)]; };
  const trail = airTrail(480, 0.065, path, rainbow);
  const bead = G.sph(0.022, M.plastic(0xffffff, 0.6), undefined, 14);
  const spark = halo(0xffffff, 0.16);
  root.add(trail.points, bead, spark);
  fuse(root, [bead]);
  return {
    root, views: { front: { at: [0, 1.15, 3], to: [0, 0.95, 0], fov: 34, play: 0.2 }, bead: { at: [0.9, 1.2, 1.6], to: [0, 0.99, 0], fov: 30 } }, inDark: 'better', glow: 0xff9ad0, view: [28, 10],
    update: ({ t }) => {
      const ph = (t * 0.45) % 1;
      trail.trace(ph);
      const p = path(ph); bead.position.set(p[0], p[1], p[2]); spark.position.copy(bead.position);
      (spark.material as THREE.SpriteMaterial).color.setHSL(ph, 1, 0.65);
    },
  };
}

/** Laser plasma: a pulsed laser focused so tightly that the air itself flashes at the focal point. */
export function laserPlasma(): Built {
  const root = G.group();
  root.add(breadboard(2.3, 1.2, 0.08), feet(2.3, 1.2, 0.06, 0.06, -0.06));
  const dark = M.dark(), black = M.black(), steel = M.steel(), rubber = M.rubber(), T = Math.PI / 2;
  // the laser head, with fins: nearly all of the power ends up as heat. It is bolted down by a foot at each corner
  root.add(G.rbox(1.05, 0.3, 0.42, 0.04, M.plastic(0x2a2c30, 0.5), [-0.52, 0.27, 0]), G.lathe([[0.075, 0], [0.075, 0.02], [0.05, 0.03], [0.05, 0.075], [0.03, 0.075], [0.026, 0.04]], dark, 20).rotateZ(-T).translateY(0.005).translateX(-0.27));
  const fins = vents(0.9, 0.34, 14, [-0.52, 0.421, 0], true); fins.rotation.x = -T; fins.userData.noShadow = true;
  root.add(fins);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.box(0.1, 0.02, 0.07, steel, [-0.52 + sx * 0.4, 0.09, sz * 0.24], 0), hush(stub(0.018, 0.014, black, [-0.52 + sx * 0.4, 0.107, sz * 0.25], 8)));
  // a laser this strong carries a warning and a lamp that burns whenever it can fire
  const sign = screen(128, 64), sc = sign.ctx;
  sc.fillStyle = '#f2c81a'; sc.fillRect(0, 0, 128, 64); sc.strokeStyle = sc.fillStyle = '#111'; sc.lineWidth = 3; sc.strokeRect(2, 2, 124, 60);
  sc.lineJoin = 'round'; sc.beginPath(); sc.moveTo(32, 10); sc.lineTo(56, 52); sc.lineTo(8, 52); sc.closePath(); sc.stroke();
  sc.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; sc.beginPath(); sc.moveTo(32, 38); sc.lineTo(32 + Math.cos(a) * (k % 2 ? 6 : 10), 38 + Math.sin(a) * (k % 2 ? 6 : 10)); sc.stroke(); }
  for (const y of [18, 28, 38, 48]) sc.fillRect(66, y - 3, y === 18 ? 52 : 44, 5);
  sign.tex.needsUpdate = true;
  root.add(hush(G.plane(0.2, 0.1, M.printed(sign, 0.6), [-0.2, 0.25, 0.2105])), pilot(0xffb030, 0.014, [-0.02, 0.36, 0.211]).rotateX(T), hush(stub(0.02, 0.02, steel, [-0.92, 0.3, 0.215], 10).rotateX(T)));
  // its umbilical: power and cooling water in one ribbed hose, out of the back and off the table
  const hose = G.wire([[-1.045, 0.25, 0], [-1.1, 0.25, 0], [-1.14, 0.2, -0.06], [-1.13, 0.13, -0.3], [-1.1, 0.115, -0.56]], 0.034, rubber, false, 8);
  root.add(hose, stub(0.045, 0.04, dark, [-1.06, 0.25, 0], 12).rotateZ(T));
  // scanner: two mirrors steer the beam, a lens that changes focus sets the height. The two motors that turn the mirrors stand out of the case
  root.add(G.rbox(0.38, 0.38, 0.38, 0.04, dark, [0.48, 0.31, 0]), hush(screws([[0.34, 0.44, 0.191], [0.62, 0.44, 0.191], [0.34, 0.18, 0.191], [0.62, 0.18, 0.191]], 0.016)));
  root.add(stub(0.055, 0.12, black, [0.73, 0.33, 0], 16).rotateZ(T), hush(stub(0.03, 0.03, steel, [0.8, 0.33, 0], 10).rotateZ(T)), stub(0.055, 0.12, black, [0.48, 0.25, -0.25], 16).rotateX(T), hush(stub(0.03, 0.03, steel, [0.48, 0.25, -0.32], 10).rotateX(T)));
  root.add(hush(G.wire([[0.81, 0.33, 0], [0.86, 0.3, -0.02], [0.86, 0.12, -0.2], [0.7, 0.095, -0.45], [0.5, 0.095, -0.52]], 0.011, rubber, false, 5)), hush(G.wire([[0.48, 0.25, -0.335], [0.48, 0.2, -0.38], [0.5, 0.1, -0.45], [0.5, 0.095, -0.52]], 0.011, rubber, false, 5)), G.box(0.2, 0.06, 0.12, M.plastic(0x2a2c30, 0.5), [0.42, 0.11, -0.52], 0.008));
  // between laser and scanner, the lens that changes focus, in a tube that shuts the beam in
  root.add(G.lathe([[0.04, 0], [0.04, 0.05], [0.056, 0.055], [0.056, 0.115], [0.04, 0.12], [0.04, 0.175]], dark, 20).rotateZ(-T).translateY(0.115).translateX(-0.27), hush(stub(0.014, 0.03, steel, [0.2, 0.33, 0], 8)), G.rod([0.2, 0.08, 0], [0.2, 0.22, 0], 0.014, steel, 8));
  // the lens that brings the beam to a point above the table
  const glass = G.sph(0.2, M.glass(0x9fb6b8, 0.07, 0.75), [0.48, 0.64, 0], 32); glass.scale.y = 0.3;
  root.add(glass, G.lathe([[0.22, 0.5], [0.22, 0.585], [0.232, 0.59], [0.232, 0.635], [0.222, 0.65], [0.206, 0.65], [0.2, 0.636]], dark, 40).translateX(0.48));
  const b = beam(0xff5050, 0.3); b.aim([0.12, 0.27, 0], [0.13, 0.27, 0]); root.add(b.line);
  // the figure: a small cube drawn corner to corner in points of plasma
  const pts: V3[] = [];
  const corners: V3[] = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) for (let k = 0; k <= 12; k++) {
    const u = k / 12; pts.push([0.48 + (corners[i][0] + (corners[j][0] - corners[i][0]) * u) * 0.24, 1.32 + (corners[i][1] + (corners[j][1] - corners[i][1]) * u) * 0.24, (corners[i][2] + (corners[j][2] - corners[i][2]) * u) * 0.24]);
  }
  const vox = voxels(pts, 0.075);
  const c1 = beam(0xa8c8ff, 0.4), c2 = beam(0xa8c8ff, 0.4);
  const flash = halo(0xcfe0ff, 0.26);
  root.add(vox.points, c1.line, c2.line, flash);
  fuse(root);
  const spin = new THREE.Matrix4(), p = new THREE.Vector3();
  return {
    root, views: { front: { at: [0, 1.3, 3.2], to: [0, 1.1, 0], fov: 34, play: 0.2 }, points: { at: [1.6, 1.75, 1.5], to: [0.48, 1.32, 0], fov: 28 } }, inDark: 'better', glow: 0xa8c8ff, view: [24, 10],
    update: ({ t }) => {
      vox.points.rotation.y = t * 0.4; vox.points.position.set(0.48 - 0.48 * Math.cos(t * 0.4), 0, 0.48 * Math.sin(t * 0.4));
      // one point of plasma exists at a time; the rest is afterimage
      const hot = Math.floor(t * 240) % pts.length;
      for (let i = 0; i < pts.length; i++) { const age = (hot - i + pts.length) % pts.length, k = 0.26 + 0.74 * Math.exp(-age / 14); vox.col.set([0.62 * k, 0.78 * k, k], i * 3); }
      vox.flush();
      spin.makeRotationY(t * 0.4);
      p.set(pts[hot][0] - 0.48, pts[hot][1], pts[hot][2]).applyMatrix4(spin);
      flash.position.set(p.x + 0.48, p.y, p.z);
      c1.aim([0.32, 0.66, 0], [p.x + 0.48, p.y, p.z]); c2.aim([0.64, 0.66, 0], [p.x + 0.48, p.y, p.z]);
    },
  };
}

/**
 * A light bulb one unit tall, the tip of its cap at the origin and the glass above. With `image` set it is the
 * picture of a bulb, made of light alone. `set` takes how bright it burns, from 0 to 1.
 */
function lampBulb(image = false): { bulb: THREE.Group; set: (on: number) => void } {
  const air = new THREE.MeshBasicMaterial({ color: 0xffe2ae, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const flame = new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const hot = M.glow(0xffd28a, 2.6);
  const turn = (pts: P2[], seg: number, sub = 0) => new THREE.LatheGeometry((sub ? spline(pts, sub) : pts).map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const rod = (a: V3, b: V3) => { const m = G.rod(a, b, 0.006, air, 5); m.updateMatrix(); return m.geometry.applyMatrix4(m.matrix); };
  // the envelope, and inside it the glass stem that carries the wires up to the filament
  const glass = G.merge([turn([[0.13, 0.27], [0.135, 0.33], [0.19, 0.46], [0.3, 0.6], [0.345, 0.72], [0.32, 0.85], [0.2, 0.955], [0.001, 1]], 32, 4), turn([[0.1, 0.28], [0.055, 0.36], [0.032, 0.46], [0.03, 0.57], [0.045, 0.6], [0.001, 0.615]], 12)]);
  // the cap: a brass shell with a thread rolled into it, and the contact at its tip
  const shell: P2[] = [[0, 0], [0.04, 0.002], [0.06, 0.025], [0.1, 0.05]];
  for (let k = 0; k <= 16; k++) shell.push([0.126 + 0.011 * Math.sin((k / 16) * Math.PI * 8), 0.07 + (k / 16) * 0.16]);
  shell.push([0.14, 0.25], [0.14, 0.3]);
  const cap = turn(shell, 24);
  // the filament: a coil bent round most of a circle, between two lead wires and a support
  const ring = (a: number): V3 => [0.075 * Math.cos(a), 0.68, 0.075 * Math.sin(a)];
  const wires = G.merge([rod([0.02, 0.58, 0], ring(0)), rod([-0.005, 0.58, -0.018], ring(5.2)), rod([0, 0.61, 0], ring(2.6))]);
  const coil = new THREE.TorusGeometry(0.075, 0.011, 6, 20, 5.2).rotateX(Math.PI / 2).translate(0, 0.68, 0);
  // the glare round a burning filament, which swells and shrinks with it. With the lamp out, the wire itself is seen
  const core = G.sph(0.075, image ? flame : hot, [0, 0.68, 0], 14);
  core.userData.moves = core.userData.noShadow = true;
  const shine = halo(0xffc878, 0.95, [0, 0.68, 0], 0.8);
  const bulb = G.group(core, shine);
  if (image) bulb.add(new THREE.Mesh(G.merge([glass, cap, wires, coil]), air));
  else {
    const wire = new THREE.Mesh(coil, hot); wire.userData.noShadow = true;
    bulb.add(new THREE.Mesh(glass, M.bulb(0xd6dedc, 0.62)), new THREE.Mesh(cap, M.brass()), new THREE.Mesh(wires, M.steel()), wire);
  }
  return {
    bulb,
    set: (on) => {
      hot.emissiveIntensity = 0.12 + 2.5 * on; air.opacity = 0.1 + 0.42 * on; flame.opacity = 0.08 + 0.87 * on;
      core.scale.setScalar(Math.max(0.001, on));
      shine.material.opacity = (image ? 0.7 : 0.85) * on;
    },
  };
}

/**
 * Valerie Thomas's illusion transmitter. On the left a concave mirror stands a picture of a hidden bulb in an empty
 * socket, and a camera watches it. On the right a projector, hidden in the same way, is aimed at a second mirror,
 * and the picture hangs in the air with nothing behind it.
 */
export function illusionTransmitter(): Built {
  const root = G.group();
  const black = M.black(), dark = M.dark(), steel = M.steel(), brass = M.brass(), chrome = M.chrome(), rubber = M.rubber(), china = M.ceramic();
  const oak = M.wood(0x7a5632), oakUp = M.wood(0x7a5632, 1), walnut = M.wood(0x3a2a1c);
  // AX: the height of each mirror's axis. C: where its centre of curvature lies. FACE: the middle of the mirror. RIM: its edge. S: the size of the bulb.
  const AX = 0.76, C = 0.24, FACE = -0.46, RIM = FACE + 0.13, S = 0.36, LEFT = -0.8, RIGHT = 0.8;
  /** Lay a turned part along z: its top towards the visitor, or away. */
  const along = <T extends THREE.Object3D>(o: T, p: V3, away = false): T => { o.rotation.x = away ? -Math.PI / 2 : Math.PI / 2; o.position.set(p[0], p[1], p[2]); return o; };
  // screw heads, all in one piece of brass: where, which way the head is turned, how big
  const heads: number[][] = [];
  root.add(G.rbox(3.0, 0.06, 2.6, 0.02, walnut, [0, 0.03, 0.42]));
  for (const cx of [LEFT, RIGHT]) {
    root.add(
      // a cabinet of oak board with a lid, screwed together and open at the front above the axis
      G.box(0.04, 1.36, 1.12, oakUp, [cx - 0.54, 0.74, 0], 0.008), G.box(0.04, 1.36, 1.12, oakUp, [cx + 0.54, 0.74, 0], 0.008),
      G.box(1.04, 1.36, 0.04, oakUp, [cx, 0.74, -0.54], 0.008), G.rbox(1.18, 0.04, 1.18, 0.014, oak, [cx, 1.44, 0]),
      // the front wall hides whatever stands below the axis: the real bulb on one side, the projector on the other
      G.box(1.04, AX - 0.1, 0.04, oak, [cx, 0.06 + (AX - 0.1) / 2, 0.54], 0.008),
      // lined with black flock, so that the mirror has nothing to show but the picture
      G.box(0.006, 1.32, 1.076, black, [cx - 0.517, 0.76, 0.02], 0), G.box(0.006, 1.32, 1.076, black, [cx + 0.517, 0.76, 0.02], 0),
      G.box(1.034, 1.32, 0.006, black, [cx, 0.76, -0.517], 0), G.box(1.034, 0.006, 1.076, black, [cx, 1.417, 0.02], 0),
      G.box(1.034, 0.04, 1.034, black, [cx, 0.08, 0], 0), G.box(1.034, AX - 0.14, 0.006, black, [cx, 0.1 + (AX - 0.14) / 2, 0.517], 0),
      // the mirror in its cell: a drum on the back board, and a brass ring screwed down over the edge of the glass
      along(G.lathe([[0.48, 0], [0.48, 0.176]], black, 72), [cx, AX, -0.517]),
      along(G.lathe([[0.486, -0.012], [0.486, 0.016], [0.476, 0.026], [0.455, 0.026], [0.44, 0.02], [0.434, 0.004]], brass, 72), [cx, AX, RIM]),
    );
    const glass = G.dish(0.44, -0.13, chrome, [cx, AX, RIM]); glass.userData.noShadow = true;
    root.add(glass);
    for (let k = 0; k < 6; k++) heads.push([cx + 0.4655 * Math.cos(k * 1.047 + 0.52), AX + 0.4655 * Math.sin(k * 1.047 + 0.52), RIM + 0.026, Math.PI / 2, 0, 0.011]);
    // three screws through the back board tilt the mirror: any tilt bends the picture
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + k * 2.094, x = cx + 0.3 * Math.cos(a), y = AX + 0.3 * Math.sin(a);
      root.add(along(stub(0.05, 0.006, steel), [x, y, -0.563], true), along(stub(0.036, 0.03, brass, undefined, 12, 0.03), [x, y, -0.581], true));
    }
    for (const sx of [-1, 1]) for (const s of [-1, 1]) heads.push([cx + sx * 0.54, 1.46, s * 0.54, 0, 0, 0.012], [cx + sx * 0.49, 0.39 + s * 0.26, 0.56, Math.PI / 2, 0, 0.012]);
    // slots in the lid behind the mirror let the heat out and no light in
    const slots = vents(0.46, 0.1, 9, [cx, 1.4545, -0.42], true); slots.rotation.x = -Math.PI / 2; slots.userData.noShadow = true;
    root.add(slots);
  }
  // the sender: one block of porcelain with a socket at each end, held out from the wall on a steel arm.
  // The lower socket holds the bulb. The upper one is empty: a brass screw shell with nothing in it
  const holder = G.lathe([[0, -0.03], [0.05, -0.03], [0.052, -0.112], [0.058, -0.12], [0.07, -0.12], [0.078, -0.105], [0.078, -0.07], [0.068, -0.05], [0.068, 0.05], [0.078, 0.07], [0.078, 0.105], [0.07, 0.12], [0.058, 0.12], [0.052, 0.112], [0.05, 0.03], [0, 0.03]], china, 32);
  const liner = G.lathe([[0.049, 0.108], [0.049, 0.034], [0, 0.034]], brass, 24);
  holder.position.set(LEFT, AX, C); liner.position.set(LEFT, AX, C);
  root.add(holder, liner, stub(0.072, 0.03, steel, [LEFT, AX, C], 24), G.box(0.45, 0.012, 0.04, steel, [LEFT - 0.295, AX, C], 0), G.box(0.012, 0.1, 0.06, steel, [LEFT - 0.508, AX, C], 0));
  heads.push([LEFT - 0.502, AX + 0.032, C, 0, -Math.PI / 2, 0.009], [LEFT - 0.502, AX - 0.032, C, 0, -Math.PI / 2, 0.009]);
  // its flex runs back along the arm and down the wall
  const flex = G.wire([[LEFT - 0.03, AX, C - 0.066], [LEFT - 0.1, AX + 0.012, C - 0.045], [LEFT - 0.3, AX + 0.014, C - 0.03], [LEFT - 0.47, AX + 0.01, C - 0.03], [LEFT - 0.505, AX - 0.06, C - 0.03], [LEFT - 0.506, 0.4, C - 0.03], [LEFT - 0.506, 0.11, C - 0.03]], 0.008, M.plastic(0x6a4526, 0.9), false, 5);
  flex.userData.noShadow = true;
  const real = lampBulb(), seen = lampBulb(true), sent = lampBulb(true);
  real.bulb.scale.setScalar(S); real.bulb.rotation.z = Math.PI; real.bulb.position.set(LEFT, AX - 0.03, C);
  seen.bulb.scale.setScalar(S); seen.bulb.position.set(LEFT, AX + 0.03, C);
  sent.bulb.scale.setScalar(S); sent.bulb.position.set(RIGHT, AX + 0.03, C);
  root.add(flex, real.bulb, seen.bulb, sent.bulb);
  // the camera that looks at the picture: a tube camera in a long case, with a plate at each end
  const CAM: V3 = [LEFT, AX + 0.22, 1.42];
  const cam = G.group(
    G.rbox(0.2, 0.17, 0.34, 0.02, dark), G.slab(0.186, 0.156, 0.02, 0.02, steel, [0, 0, -0.171], 0.004), G.slab(0.186, 0.156, 0.02, 0.02, steel, [0, 0, 0.171], 0.004),
    // its lens: mount, focusing ring, iris ring and hood, with the front glass set well back
    along(G.lathe([[0.04, 0], [0.04, 0.018], [0.058, 0.022], [0.058, 0.058], [0.05, 0.062], [0.05, 0.076], [0.056, 0.08], [0.056, 0.098], [0.064, 0.11], [0.064, 0.15], [0.057, 0.15], [0.05, 0.116], [0, 0.11]], black, 28), [0, 0, -0.181], true),
    along(G.cyl(0.049, 0.006, M.glass(0x9fb1ff, 0.5), undefined, 20), [0, 0, -0.301], true),
    // at the back, the socket for the picture signal and a pilot lamp
    along(stub(0.016, 0.02, steel), [-0.05, -0.05, 0.191]), along(stub(0.014, 0.04, rubber, undefined, 10, 0.01), [-0.05, -0.05, 0.221]),
    jewel(0xff3020, 0.014, [0.06, 0.045, 0.181]),
  );
  cam.position.set(CAM[0], CAM[1], CAM[2]);
  // a pan head with its handle, on three legs that slide out and lock
  const HEAD = CAM[1] - 0.135;
  root.add(cam, G.box(0.13, 0.016, 0.22, dark, [CAM[0], CAM[1] - 0.093, CAM[2]], 0), stub(0.034, 0.034, steel, [CAM[0], CAM[1] - 0.118, CAM[2]], 16), G.cyl(0.05, 0.06, dark, [CAM[0], HEAD - 0.03, CAM[2]], 16));
  root.add(G.rod([CAM[0] + 0.02, CAM[1] - 0.118, CAM[2] + 0.02], [CAM[0] + 0.15, CAM[1] - 0.2, CAM[2] + 0.24], 0.007, steel, 8), G.rod([CAM[0] + 0.1, CAM[1] - 0.168, CAM[2] + 0.148], [CAM[0] + 0.15, CAM[1] - 0.2, CAM[2] + 0.24], 0.013, rubber, 10));
  root.add(G.rod([CAM[0], 0.5, CAM[2]], [CAM[0], HEAD - 0.05, CAM[2]], 0.013, steel, 8));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5, top: V3 = [CAM[0] + Math.cos(a) * 0.03, HEAD - 0.04, CAM[2] + Math.sin(a) * 0.03], foot: V3 = [CAM[0] + Math.cos(a) * 0.34, 0.08, CAM[2] + Math.sin(a) * 0.34];
    const at = (u: number): V3 => [top[0] + (foot[0] - top[0]) * u, top[1] + (foot[1] - top[1]) * u, top[2] + (foot[2] - top[2]) * u];
    root.add(G.rod(top, at(0.56), 0.017, dark, 10), G.rod(at(0.5), at(0.99), 0.011, steel, 8), G.rod(at(0.53), at(0.58), 0.022, black, 10), G.sph(0.026, rubber, foot, 12), G.rod(at(0.42), [CAM[0], 0.52, CAM[2]], 0.006, steel, 6));
  }
  // the cable that carries what the camera sees: plugged in at the back, and through a bush into the far cabinet
  root.add(G.wire([[CAM[0] - 0.05, CAM[1] - 0.05, CAM[2] + 0.235], [CAM[0] - 0.05, CAM[1] - 0.08, CAM[2] + 0.262], [CAM[0] - 0.03, 0.55, CAM[2] + 0.25], [CAM[0] + 0.04, 0.15, CAM[2] + 0.25], [LEFT + 0.32, 0.075, CAM[2] + 0.245], [0, 0.075, 1.0], [RIGHT - 0.2, 0.075, 0.75], [RIGHT, 0.2, 0.555]], 0.013, rubber));
  root.add(along(stub(0.03, 0.014, rubber, undefined, 14), [RIGHT, 0.2, 0.563]), G.wire([[RIGHT, 0.2, 0.53], [RIGHT, 0.21, 0.5], [RIGHT, 0.262, 0.478]], 0.013, rubber, false, 6));
  // the receiver: a projector below the axis, tilted up at the mirror in a cradle
  const eye = M.glow(0xfff0c8, 2);
  const beamer = G.group(
    G.rbox(0.3, 0.15, 0.36, 0.02, M.plastic(0x2a2d30, 0.4)),
    along(G.lathe([[0.05, 0], [0.05, 0.02], [0.06, 0.026], [0.06, 0.09], [0.053, 0.09], [0.046, 0.076], [0, 0.074]], black, 24), [0, 0.01, -0.18], true),
    along(stub(0.044, 0.006, eye, undefined, 20), [0, 0.01, -0.258], true), along(stub(0.016, 0.02, steel), [0, -0.02, 0.19]),
  );
  const louvres = vents(0.2, 0.06, 6, [0, 0.0695, 0.05]); louvres.rotation.x = -Math.PI / 2; louvres.userData.noShadow = true;
  beamer.add(louvres);
  beamer.position.set(RIGHT, 0.36, C + 0.06); beamer.rotation.x = 0.42;
  root.add(beamer, G.box(0.38, 0.016, 0.3, dark, [RIGHT, 0.108, C + 0.06], 0));
  for (const sx of [-1, 1]) root.add(G.profile([[C - 0.06, 0.116], [C + 0.18, 0.116], [C + 0.085, 0.4], [C + 0.035, 0.4]], 0.012, dark, [RIGHT + sx * 0.166, 0, 0], 0.003), stub(0.028, 0.022, black, [RIGHT + sx * 0.183, 0.36, C + 0.06]).rotateZ(Math.PI / 2));
  const studs = new Swarm(new THREE.SphereGeometry(1, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1), brass, heads.length);
  heads.forEach(([x, y, z, rx, rz, r], i) => studs.put(i, x, y, z, rx, 0, rz, r));
  studs.done(); studs.mesh.userData.noShadow = true;
  root.add(studs.mesh);
  // the path of the light: from the bulb or the projector to the mirror, and back to the place where the picture stands
  const rays: { line: THREE.Line; aim: (a: V3, b: V3) => void; side: number }[] = [];
  for (const [cx, from] of [[LEFT, AX - 0.03 - 0.68 * S], [RIGHT, 0.44]] as [number, number][]) for (const dy of [0.17, -0.12]) {
    const hit: V3 = [cx, AX + dy, FACE + 0.02], a = beam(0xffd9a0, 0.3), b = beam(0xffd9a0, 0.3);
    a.aim([cx, from, C], hit); b.aim(hit, [cx, AX + 0.03 + 0.68 * S, C]);
    rays.push({ ...a, side: cx }, { ...b, side: cx }); root.add(a.line, b.line);
  }
  fuse(root);
  // the bulb burns, fades and comes back. What the far side shows is the same, a moment late
  const burn = (t: number) => { const u = ((t % 9) + 9) % 9; return u < 6 ? 1 : u < 6.6 ? 1 - (u - 6) / 0.6 : u < 8.4 ? 0 : (u - 8.4) / 0.6; };
  return {
    views: { front: { at: [0, 1, 3.4], to: [0, 0.8, 0.5], fov: 34, play: 0.2 }, mirror: { at: [-0.25, 0.95, 2], to: [-0.55, 0.7, 0.6], fov: 34, play: 0.1 } },
    root, inDark: 'better', glow: 0xffd9a0, view: [22, 13],
    update: ({ t, lights }) => {
      const here = burn(t), there = burn(t - 0.4), flick = 1 - 0.04 * Math.sin(t * 37);
      real.set(here); seen.set(here * (1 - 0.3 * lights)); sent.set(there * flick * (1 - 0.3 * lights));
      eye.emissiveIntensity = 0.2 + 2.2 * there;
      for (const r of rays) (r.line.material as THREE.LineBasicMaterial).opacity = 0.3 * (r.side === LEFT ? here : there);
    },
  };
}
