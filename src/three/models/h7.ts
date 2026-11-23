import { G, M, Swarm, beam, halo, opening, portal, screen, THREE, type Built, type Env, type P2, type V3 } from '../kit';
import { jewel, post, screws, toggle, vents } from '../parts';
import { bigTime, now } from '../../sims/draw';

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

/** Every mesh under a group as one shape, in the group's own coordinates: for a figure that is all of one material. */
function weld(g: THREE.Object3D): THREE.BufferGeometry {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), geos: THREE.BufferGeometry[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') geo.deleteAttribute(name);
    geos.push(geo.applyMatrix4(inv.clone().multiply(m.matrixWorld)));
  });
  return G.merge(geos);
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
/** Screw heads on the back of something: the same as `screws`, turned to face -z. */
const backScrews = (at: V3[], r: number): THREE.InstancedMesh => { const m = screws(at.map(([x, y, z]) => [-x, y, -z] as V3), r); m.rotation.y = Math.PI; m.userData.noShadow = true; return m; };

/** A flat plate with round holes sawn through it, facing +z: toy work, with square edges. */
function sawn(w: number, h: number, holes: [number, number, number][], t: number, mat: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape([new THREE.Vector2(-w / 2, -h / 2), new THREE.Vector2(w / 2, -h / 2), new THREE.Vector2(w / 2, h / 2), new THREE.Vector2(-w / 2, h / 2)]);
  for (const [x, y, r] of holes) { const path = new THREE.Path(); path.absarc(x, y, r, 0, Math.PI * 2, true); shape.holes.push(path); }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 14 }).translate(0, 0, -t / 2), mat);
}

/** Where the visitor's eye is, as seen from the piece: azimuth and elevation in radians. */
function gaze(root: THREE.Object3D, env: Env, centreY = 0.9): [number, number] {
  const p = root.worldToLocal(env.camera.position.clone());
  p.y -= centreY;
  return [Math.atan2(p.x, p.z), Math.atan2(p.y, Math.hypot(p.x, p.z))];
}

/** A small scene with depth, drawn for an eye that has moved sideways by `dx` and up by `dy`. Far things move least. */
function depthScene(c: CanvasRenderingContext2D, W: number, H: number, dx: number, dy: number, ink: string, mono = false): void {
  const layers: [number, (x: number, y: number) => void][] = [
    [-0.55, (x, y) => { c.strokeStyle = mono ? ink : '#6f8cff'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x, y, 60 + i * 34, 0, 7); c.stroke(); } }],
    [-0.2, (x, y) => { c.strokeStyle = mono ? ink : '#ffd166'; c.lineWidth = 5; c.strokeRect(x - 70, y - 70, 140, 140); c.beginPath(); c.moveTo(x - 70, y - 70); c.lineTo(x + 70, y + 70); c.moveTo(x + 70, y - 70); c.lineTo(x - 70, y + 70); c.stroke(); }],
    [0.3, (x, y) => { c.fillStyle = mono ? ink : '#ff5d5d'; c.beginPath(); c.arc(x - 60, y + 30, 26, 0, 7); c.fill(); c.beginPath(); c.arc(x + 74, y - 44, 16, 0, 7); c.fill(); }],
  ];
  for (const [z, draw] of layers) draw(W / 2 + dx * z * W * 0.55, H / 2 - dy * z * H * 0.55);
}

// ---------- the view on the stereo card: the works, as cut-out layers at five distances ----------

/** How many times further than the card each layer lies. */
const DEPTH = [7, 3.2, 2.0, 1.55, 1.2];
const LAYER = 640, FRAME = 512, EDGE = (LAYER - FRAME) / 2;

function stereoLayers(): HTMLCanvasElement[] {
  const ink = ['#efe3c8', '#bfa27c', '#7a563c', '#553726', '#2c1b12'];
  return DEPTH.map((_, k) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = LAYER;
    const c = cv.getContext('2d')!;
    c.translate(EDGE, EDGE);
    if (k === 0) { // sky and sun
      const g = c.createLinearGradient(0, -EDGE, 0, FRAME); g.addColorStop(0, '#cdbb94'); g.addColorStop(1, '#f1e6cd');
      c.fillStyle = g; c.fillRect(-EDGE, -EDGE, LAYER, LAYER);
      c.fillStyle = '#fbf5e4'; c.beginPath(); c.arc(372, 118, 36, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,250,235,.55)'; for (const [x, y, w] of [[60, 90, 150], [250, 190, 210], [-20, 230, 120]]) { c.beginPath(); c.ellipse(x + w / 2, y, w / 2, 9, 0, 0, 7); c.fill(); }
    } else if (k === 1) { // far hills, a town on the horizon
      c.fillStyle = ink[1]; c.beginPath(); c.moveTo(-EDGE, 330);
      for (let x = -EDGE; x <= FRAME + EDGE; x += 16) c.lineTo(x, 318 - 16 * Math.sin(x / 90) - 9 * Math.sin(x / 37 + 1));
      c.lineTo(FRAME + EDGE, FRAME + EDGE); c.lineTo(-EDGE, FRAME + EDGE); c.fill();
      for (const [x, h] of [[90, 26], [118, 40], [300, 30], [430, 44]]) c.fillRect(x, 318 - h, 5, h);
    } else if (k === 2) { // the works: saw-tooth sheds and the tower
      c.fillStyle = ink[2];
      c.fillRect(40, 286, 360, 150);
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(40 + i * 60, 286); c.lineTo(40 + i * 60, 248); c.lineTo(100 + i * 60, 286); c.fill(); }
      c.fillRect(386, 176, 74, 260);
      c.fillStyle = '#d2bb92'; for (let i = 0; i < 9; i++) c.fillRect(58 + i * 38, 318, 20, 34);
      for (let j = 0; j < 5; j++) c.fillRect(402, 196 + j * 44, 42, 20);
      c.fillStyle = ink[1]; c.fillRect(-EDGE, 430, LAYER, 6);
    } else if (k === 3) { // the chimney, nearer, and the gatehouse
      c.fillStyle = ink[3];
      c.beginPath(); c.moveTo(196, 60); c.lineTo(224, 60); c.lineTo(234, 440); c.lineTo(186, 440); c.fill();
      c.fillRect(190, 54, 40, 12);
      c.fillRect(20, 356, 120, 86); c.beginPath(); c.moveTo(10, 356); c.lineTo(80, 318); c.lineTo(150, 356); c.fill();
      c.fillStyle = 'rgba(74,56,38,.34)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(232 + i * 34, 44 - i * 9, 26 + i * 7, 13 + i * 2, -0.2, 0, 7); c.fill(); }
      c.fillStyle = '#c8b68e'; c.fillRect(62, 386, 34, 56);
    } else { // foreground: railings, a lamp, someone on the way to work
      c.fillStyle = ink[4];
      c.fillRect(-EDGE, 470, LAYER, 110);
      for (let x = -EDGE; x < FRAME + EDGE; x += 26) c.fillRect(x, 420, 5, 56);
      c.fillRect(-EDGE, 430, LAYER, 5);
      c.fillRect(436, 250, 7, 226); c.beginPath(); c.arc(439, 246, 13, 0, 7); c.fill();
      c.beginPath(); c.arc(128, 350, 14, 0, 7); c.fill(); c.fillRect(112, 340, 32, 6);
      c.beginPath(); c.moveTo(112, 366); c.lineTo(146, 366); c.lineTo(152, 476); c.lineTo(104, 476); c.fill();
    }
    return cv;
  });
}

const arch = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w * 0.32); c.quadraticCurveTo(x, y, x + w / 2, y); c.quadraticCurveTo(x + w, y, x + w, y + w * 0.32); c.lineTo(x + w, y + h); c.closePath();
};

/** Stereoscope: two photographs taken a few centimetres apart, one for each eye, and a pair of lenses to fuse them. */
export function stereoscope(): Built {
  const root = G.group();
  const walnut = M.wood(0x5d3a20, 2), walnutX = M.wood(0x5d3a20, 0);
  const layers = stereoLayers();
  const CZ = -0.55, LZ = 0.5, PW = 0.52, PH = 0.5;
  // the card: one mount, two prints that differ only in how far each thing has shifted
  const card = screen(1024, 530), c = card.ctx;
  c.fillStyle = '#e6dcc4'; c.fillRect(0, 0, 1024, 530);
  const px = PW / 1.2 * 1024, py = PH / 0.62 * 530;
  for (const side of [-1, 1]) {
    const x0 = 512 + side * (0.3 / 1.2) * 1024 - px / 2, y0 = (530 - py) / 2;
    c.save(); arch(c, x0, y0, px, py); c.clip();
    layers.forEach((cv, k) => c.drawImage(cv, x0 + (-EDGE + side * 15 * (1 - 1 / DEPTH[k])) * (px / FRAME), y0 - EDGE * (py / FRAME), LAYER * (px / FRAME), LAYER * (py / FRAME)));
    c.restore();
    c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 2; arch(c, x0, y0, px, py); c.stroke();
  }
  c.fillStyle = '#6b573c'; c.font = '500 17px "PT Mono", monospace'; c.textAlign = 'center';
  c.fillText('The works from the east gate', 512, 520);
  card.tex.needsUpdate = true;

  const v = G.group(), brass = M.brass(), T = Math.PI / 2;
  // the tongue: a slat that carries everything. A brass screw at the far end stops the slide from coming off
  v.add(G.box(0.07, 0.045, 1.5, walnut, [0, -0.36, -0.08]), stub(0.014, 0.012, brass, [0, -0.334, -0.8], 10));
  // the lens board stands on the end of the tongue, with the two lenses in its upper half
  v.add(G.cut(0.9, 0.54, 0.05, [[-0.2, 0.08, 0.115], [0.2, 0.08, 0.115]], 0.045, walnutX, [0, -0.08, LZ]));
  // the hood that shuts the room out: thin sheet bent over the board, wider towards the face, scooped for the brow,
  // cut away below for the cheeks, and bound in velvet along the edge that touches the skin
  const NU = 28, NV = 5, bent: number[] = [], tri: number[] = [], rim: V3[] = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const t = j / NV, w = 0.46 + 0.06 * t ** 1.5, r = 0.12 + 0.03 * t, top = 0.21 + 0.012 * t, low = -0.34 + 0.2 * t;
    const z = LZ + 0.022 + t * (0.34 - 0.045 * Math.max(0, 1 - ((i - 14) / 5) ** 2));
    let x = w, y = top - r - (top - r - low) * ((i - 21) / 7);
    if (i <= 7) { x = -w; y = low + (top - r - low) * (i / 7); }
    else if (i <= 11) { const a = Math.PI - ((i - 7) / 4) * T; x = -w + r + r * Math.cos(a); y = top - r + r * Math.sin(a); }
    else if (i <= 17) { x = -w + r + 2 * (w - r) * ((i - 11) / 6); y = top; }
    else if (i <= 21) { const a = T - ((i - 17) / 4) * T; x = w - r + r * Math.cos(a); y = top - r + r * Math.sin(a); }
    bent.push(x, y, z);
    if (j === NV && i % 2 === 0) rim.push([x, y, z]);
    if (j < NV && i < NU) { const k = j * (NU + 1) + i; tri.push(k, k + NU + 1, k + 1, k + 1, k + NU + 1, k + NU + 2); }
  }
  const sheet = new THREE.BufferGeometry(), tin = M.plastic(0x2a211b, 0.7);
  sheet.setAttribute('position', new THREE.Float32BufferAttribute(bent, 3)); sheet.setIndex(tri); sheet.computeVertexNormals();
  tin.side = THREE.DoubleSide;
  v.add(new THREE.Mesh(sheet, tin), G.wire(rim, 0.009, M.cloth(0x4a1218), false, 5), G.box(0.012, 0.49, 0.42, walnut, [0, -0.0925, LZ - 0.23], 0.003));
  for (const x of [-0.2, 0.2]) {
    const glass = G.sph(0.115, M.glass(0x9fb6b8, 0.07, 0.75), [x, 0, LZ], 32), ring = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.0127, 8, 40), brass);
    glass.scale.z = 0.26; ring.position.set(x, 0, LZ);
    v.add(glass, ring);
  }
  // the card slides along the tongue until the picture is sharp. Its back is plain board
  const pulp = M.paper(0xe6dcc4);
  v.add(G.box(1.26, 0.04, 0.06, walnutX, [0, -0.325, CZ]), G.box(0.12, 0.07, 0.1, walnut, [0, -0.36, CZ]), G.box(1.2, 0.62, 0.008, [pulp, pulp, pulp, pulp, M.printed(card, 0.85), pulp], [0, 0, CZ], 0));
  for (const x of [-0.5, 0.5]) v.add(G.wire([[x, -0.33, CZ + 0.02], [x, -0.24, CZ + 0.026], [x + 0.03, -0.2, CZ + 0.026], [x + 0.06, -0.24, CZ + 0.026], [x + 0.06, -0.33, CZ + 0.02]], 0.006, brass, false, 6));
  // the handle folds on a brass plate under the tongue
  const turned: P2[] = [[0, -0.47], [0.04, -0.465], [0.046, -0.43], [0.04, -0.4], [0.052, -0.3], [0.05, -0.16], [0.034, -0.06], [0.03, 0, 1], [0, 0]];
  const handle = G.lathe(turned, M.wood(0x5d3a20, 1), 24, true);
  handle.position.set(0, -0.385, 0.22);
  v.add(handle, stub(0.036, 0.03, brass, [0, -0.4, 0.22], 16, 0.033), G.box(0.06, 0.008, 0.13, brass, [0, -0.3865, 0.22], 0));
  // where the viewer rests on the post: a brass saddle that grips the tongue, with a thumbscrew
  v.add(G.box(0.13, 0.014, 0.2, brass, [0, -0.39, 0], 0), G.box(0.014, 0.07, 0.2, brass, [-0.049, -0.362, 0], 0), G.box(0.014, 0.07, 0.2, brass, [0.049, -0.362, 0], 0), stub(0.02, 0.03, brass, [0.07, -0.362, 0]).rotateZ(T));
  // wood keeps its grain along the part: the parts are joined while the viewer still lies square
  fuse(v);
  v.position.set(0, 1.26, 0); v.rotation.set(-0.06, 0.78, 0);

  // through each lens: the same view with real depth, the way the two prints fuse in the head
  const mount = screen(1024, 1024), m = mount.ctx;
  const build = (side: number, ref: number) => {
    const E = new THREE.Vector3(side * 0.2, 0, LZ), C = new THREE.Vector3(side * 0.3, 0, CZ);
    const g = G.group();
    layers.forEach((cv, k) => {
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const pl = G.plane(PW * (LAYER / FRAME) * DEPTH[k], PH * (LAYER / FRAME) * DEPTH[k], new THREE.MeshStandardMaterial({ map: tex, color: 0xb9b2a8, alphaTest: k ? 0.5 : 0, roughness: 1 }));
      pl.position.copy(E).addScaledVector(C.clone().sub(E), DEPTH[k]);
      g.add(pl);
    });
    const mask = G.plane(2.4, 2.4, new THREE.MeshStandardMaterial({ map: mount.tex, color: 0xb9b2a8, alphaTest: 0.5, roughness: 1 }), [side * 0.3, 0, CZ + 0.002]);
    g.add(mask);
    const hole = opening(new THREE.CircleGeometry(0.11, 40), [side * 0.2, 0, LZ + 0.03]);
    v.add(hole, g);
    portal([hole], g, { ref });
  };
  m.fillStyle = '#0c0a08'; m.fillRect(0, 0, 1024, 1024);
  m.fillStyle = '#e6dcc4'; m.fillRect(512 - 256 - 20, 512 - 132, 552, 264);
  m.globalCompositeOperation = 'destination-out';
  arch(m, 512 - (PW / 2.4) * 512, 512 - (PH / 2.4) * 512, (PW / 2.4) * 1024, (PH / 2.4) * 1024); m.fill();
  mount.tex.needsUpdate = true;
  build(-1, 1); build(1, 2);

  // red and cyan spectacles of card, standing on their arms: the same idea, with colour doing the job of the lenses.
  // They face the visitor, so the red filter of the left eye is on the right
  const face = new THREE.Shape(), paper = M.paper();
  face.moveTo(-0.39, -0.14); face.lineTo(-0.085, -0.14); face.quadraticCurveTo(-0.07, -0.06, 0, -0.055); face.quadraticCurveTo(0.07, -0.06, 0.085, -0.14); face.lineTo(0.39, -0.14);
  face.absarc(0.39, -0.11, 0.03, -T, 0, false); face.lineTo(0.42, 0.11); face.absarc(0.39, 0.11, 0.03, 0, T, false); face.lineTo(-0.39, 0.14); face.absarc(-0.39, 0.11, 0.03, T, Math.PI, false); face.lineTo(-0.42, -0.11); face.absarc(-0.39, -0.11, 0.03, Math.PI, 3 * T, false);
  for (const x of [-0.21, 0.21]) {
    const win = new THREE.Path(), w = 0.13, h = 0.085, r = 0.04;
    win.moveTo(x - w + r, -h); win.absarc(x - w + r, -h + r, r, -T, -Math.PI, true); win.lineTo(x - w, h - r); win.absarc(x - w + r, h - r, r, Math.PI, T, true);
    win.lineTo(x + w - r, h); win.absarc(x + w - r, h - r, r, T, 0, true); win.lineTo(x + w, -h + r); win.absarc(x + w - r, -h + r, r, 0, -T, true);
    face.holes.push(win);
  }
  const arm: [number, number][] = [[0, 0.06], [-0.26, 0.055], [-0.36, 0.03], [-0.42, -0.04], [-0.43, -0.14], [-0.395, -0.14], [-0.385, -0.05], [-0.33, -0.01], [-0.24, 0], [0, -0.04]];
  const specs = G.group(
    new THREE.Mesh(new THREE.ExtrudeGeometry(face, { depth: 0.008, bevelEnabled: false, curveSegments: 8 }), paper), G.profile(arm, 0.006, paper, [-0.417, 0, 0], 0), G.profile(arm, 0.006, paper, [0.417, 0, 0], 0),
    G.box(0.28, 0.19, 0.003, M.glass(0xd62a1a, 0.6, 0.1), [0.21, 0, -0.002], 0), G.box(0.28, 0.19, 0.003, M.glass(0x12b6c6, 0.6, 0.1), [-0.21, 0, -0.002], 0),
  );
  specs.position.set(-0.16, 0.2, 0.62); specs.rotation.y = -0.15;
  // the stand: a post turned from brass bar with a cup for the saddle, on a turned wooden foot
  const post: P2[] = [[0.17, 0.058], [0.17, 0.072], [0.15, 0.084], [0.1, 0.096], [0.06, 0.13], [0.042, 0.2], [0.036, 0.27], [0.046, 0.285], [0.046, 0.3], [0.035, 0.315], [0.035, 0.74], [0.046, 0.755], [0.046, 0.77], [0.04, 0.785], [0.066, 0.82], [0.074, 0.9], [0.06, 0.912], [0, 0.912]];
  const foot: P2[] = [[0, 0], [0.9, 0], [0.9, 0.022], [0.885, 0.034], [0.868, 0.04], [0.852, 0.052], [0.836, 0.06], [0, 0.06]];
  const base = G.lathe(foot, M.wood(0x3b2616), 72); base.position.z = 0.1;
  root.add(v, specs, G.lathe(post, brass, 28), base);
  fuse(root);
  v.updateMatrixWorld(true);
  const at = v.localToWorld(new THREE.Vector3(0.212, 0, LZ + 0.17)), to = v.localToWorld(new THREE.Vector3(0.3, 0, CZ));
  return { root, inDark: 'vanishes', view: [-8, 14], views: { card: { at: [-0.3, 1.6, 1.4], to: [-0.6, 1.25, 0], fov: 34, play: 0.1 }, eyepiece: { at: [at.x, at.y, at.z], to: [to.x, to.y, to.z], fov: 33, play: 0.045 } } };
}

/** Parallax barrier: a mask of slits in front of the pixels. Each eye sees through the slits to a different set of columns. */
export function parallaxBarrier(): Built {
  const root = G.group();
  const s = screen(512, 320);
  const c = s.ctx;
  // two pictures cut into strips and interleaved: an L for the left eye, an R for the right
  const strip = (letter: string, bg: string, fg: string, odd: number) => {
    const t = document.createElement('canvas'); t.width = 512; t.height = 320;
    const g = t.getContext('2d')!;
    g.fillStyle = bg; g.fillRect(0, 0, 512, 320);
    g.fillStyle = fg; g.font = '900 300px "Sofia Sans Extra Condensed Variable", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, 256, 172);
    for (let x = odd * 8; x < 512; x += 16) c.drawImage(t, x, 0, 8, 320, x, 0, 8, 320);
  };
  strip('L', '#3a0a06', '#ff5a44', 0); strip('R', '#04303a', '#4fe6f5', 1);
  s.tex.needsUpdate = true;
  const mask = screen(512, 4);
  for (let x = 0; x < 512; x += 16) { mask.ctx.fillStyle = '#050505'; mask.ctx.fillRect(x + 4, 0, 8, 4); }
  mask.tex.magFilter = THREE.NearestFilter; mask.tex.needsUpdate = true;
  const maskMat = new THREE.MeshStandardMaterial({ map: mask.tex, alphaTest: 0.5, transparent: false, roughness: 0.8, side: THREE.DoubleSide });
  const W = 1.8, H = 1.12, y = 0.9;
  const dark = M.dark(), black = M.black(), steel = M.steel(), shell = M.plastic(0x1d1f22, 0.5), T = Math.PI / 2;
  root.add(G.rbox(W + 0.14, H + 0.14, 0.07, 0.02, dark, [0, y, -0.04]), G.plane(W, H, M.lit(s, 1.3, 0.2), [0, y, 0]), G.plane(W, H, maskMat, [0, y, 0.085]), G.pane(W + 0.06, H + 0.06, 0.012, [0, y, 0.093]));
  // the mask and its glass stand off the screen on four pillars, each with a spacer behind the glass and a thumb nut in front
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const x = sx * (W / 2 + 0.01), yy = y + sy * (H / 2 + 0.01);
    root.add(G.rod([x, yy, -0.01], [x, yy, 0.112], 0.014, M.steel(2), 10), hush(stub(0.024, 0.08, steel, [x, yy, 0.044], 10).rotateX(T)), hush(stub(0.03, 0.016, steel, [x, yy, 0.108], 10).rotateX(T)));
  }
  // behind the panel: a cover over the electronics, with louvres, a screw at each corner and a plain plate
  const louvres = vents(0.8, 0.3, 8, [0, y + 0.12, -0.1065]); louvres.userData.noShadow = true;
  root.add(G.rbox(1.3, 0.78, 0.03, 0.012, shell, [0, y, -0.09]), louvres, backScrews([[-0.6, y + 0.34, -0.105], [0.6, y + 0.34, -0.105], [-0.6, y - 0.34, -0.105], [0.6, y - 0.34, -0.105]], 0.014), hush(G.box(0.22, 0.08, 0.004, steel, [0.36, y - 0.26, -0.106], 0)));
  // its lead leaves through a bush and runs down the back of one upright
  root.add(hush(stub(0.024, 0.02, black, [-0.5, y - 0.3, -0.113], 10).rotateX(T)), hush(G.wire([[-0.5, y - 0.3, -0.12], [-0.52, y - 0.36, -0.15], [-0.76, 0.3, -0.1], [-0.8, 0.2, -0.085], [-0.8, 0.06, -0.085], [-0.86, 0.06, -0.24], [-0.9, 0.06, -0.3]], 0.011, M.rubber(), false, 5)));
  // the stand: a slab on four feet, two uprights bolted to it and to the back of the panel
  root.add(G.rbox(W + 0.3, 0.05, 0.6, 0.02, dark, [0, 0.025, 0]), G.box(0.06, 0.32, 0.06, M.steel(1), [-0.8, 0.19, -0.04]), G.box(0.06, 0.32, 0.06, M.steel(1), [0.8, 0.19, -0.04]));
  for (const sx of [-1, 1]) {
    root.add(G.box(0.16, 0.012, 0.16, steel, [sx * 0.8, 0.056, -0.04], 0), hush(screws([[sx * 0.8 - 0.055, 0.062, 0.015], [sx * 0.8 + 0.055, 0.062, 0.015], [sx * 0.8 - 0.055, 0.062, -0.095], [sx * 0.8 + 0.055, 0.062, -0.095]], 0.011, 'y')));
    for (const sz of [-1, 1]) root.add(hush(stub(0.04, 0.012, M.rubber(), [sx * 0.95, -0.006, sz * 0.22], 10)));
  }
  // a lamp in the frame shows that it is on
  root.add(pilot(0x40d070, 0.008, [W / 2 + 0.035, y - H / 2 - 0.02, -0.004]).rotateX(T));
  fuse(root);
  return { root, views: { slits: { at: [0.4, 1.05, 1.4], to: [0, 0.9, 0], fov: 30, play: 0.1 }, spot: { at: [0, 0.95, 3.0], to: [0, 0.9, 0], fov: 34, play: 0.2 } }, inDark: 'glows', glow: 0xff8fb0, view: [9, 4] };
}

/** Lenticular sheet: ribs of plastic lens over a striped print. Which stripe each rib shows depends on where you stand. */
export function lenticular(): Built {
  const root = G.group();
  const s = screen(512, 340);
  const W = 1.8, H = 1.2, y = 0.92, RIBS = 60;
  const ribs = new Swarm(new THREE.CylinderGeometry(W / RIBS / 2, W / RIBS / 2, H, 10, 1, false, -Math.PI / 2, Math.PI), M.bulb(0xb9c6c4, 0.22), RIBS);
  for (let i = 0; i < RIBS; i++) ribs.put(i, (i - (RIBS - 1) / 2) * (W / RIBS), y, 0.012);
  ribs.done();
  // the print is mounted on card with rounded corners. The ribbed sheet covers the picture and leaves a white border
  const tilt = G.group(G.slab(W + 0.1, H + 0.1, 0.035, 0.03, M.paper(0xf4f2ea), [0, y, -0.016], 0.006), G.plane(W, H, M.printed(s, 0.6), [0, y, 0.001]), ribs.mesh);
  tilt.rotation.x = -0.16;
  // a small easel, as a print would stand on a shop counter: a ledge with a lip, two legs joined by a rail,
  // and a back leg on a brass hinge, held from sliding out by a cord
  const easel = M.wood(0x8a5a30, 1), rail = M.wood(0x8a5a30), brass = M.brass(), T = Math.PI / 2;
  root.add(tilt, G.box(1.3, 0.04, 0.08, rail, [0, 0.3, 0.02]), G.box(1.3, 0.03, 0.014, rail, [0, 0.335, 0.053], 0.004), G.box(0.05, 1.3, 0.05, easel, [-0.5, 0.66, -0.22]).rotateX(-0.2), G.box(0.05, 1.3, 0.05, easel, [0.5, 0.66, -0.22]).rotateX(-0.2), G.box(0.05, 1.2, 0.05, easel, [0, 0.58, -0.52]).rotateX(0.36), G.box(1.1, 0.04, 0.05, rail, [0, 1.0, -0.3]));
  root.add(hush(G.box(0.07, 0.05, 0.006, brass, [0, 1.0, -0.328], 0)), hush(G.box(0.05, 0.07, 0.006, brass, [0, 1.055, -0.345], 0).rotateX(0.36)), hush(stub(0.007, 0.08, brass, [0, 1.028, -0.332], 6).rotateZ(T)), hush(screws([[-0.5, 1.0, -0.274], [0.5, 1.0, -0.274], [-0.5, 0.3, 0.061], [0.5, 0.3, 0.061]], 0.011, 'z', brass)));
  root.add(hush(G.wire([[0, 0.29, -0.02], [0, 0.24, -0.2], [0, 0.22, -0.4], [0, 0.27, -0.6], [0, 0.33, -0.625]], 0.005, M.plastic(0xd8cfb8, 0.9), false, 4)));
  fuse(root);
  let shown = -99;
  return {
    root, views: { ribs: { at: [0.4, 1, 1.4], to: [0, 0.92, -0.12], fov: 30, play: 0.1 }, pass: { at: [0, 1.05, 3.0], to: [0, 0.92, 0], fov: 34, play: 0.45, sway: { rate: 4.2, reach: 0.28 } } }, inDark: 'vanishes', view: [-20, 8], surface: s.canvas,
    update: (env) => {
      const [az] = gaze(root, env);
      const frame = Math.round(Math.max(-1, Math.min(1, az / 0.7)) * 4); // nine views behind every rib
      if (frame === shown) return; shown = frame;
      const c = s.ctx;
      c.fillStyle = '#f4f2ea'; c.fillRect(0, 0, 512, 340);
      // an eye that follows you round the room
      c.fillStyle = '#ffffff'; c.strokeStyle = '#14171a'; c.lineWidth = 8;
      c.beginPath(); c.ellipse(256, 170, 190, 112, 0, 0, 7); c.fill(); c.stroke();
      const px = 256 + frame * 26;
      c.fillStyle = '#1f3fa6'; c.beginPath(); c.arc(px, 170, 74, 0, 7); c.fill();
      c.fillStyle = '#0b0c0d'; c.beginPath(); c.arc(px + frame * 4, 170, 34, 0, 7); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px + frame * 4 - 14, 152, 10, 0, 7); c.fill();
      c.fillStyle = '#14171a'; c.font = '20px "PT Mono", monospace'; c.textAlign = 'center'; c.fillText(`view ${frame + 5} of 9`, 256, 322);
      s.tex.needsUpdate = true;
    },
  };
}

/** Integral imaging: a sheet of tiny round lenses, each showing a slightly different view. Depth works up and down as well as sideways. */
export function integral(): Built {
  const root = G.group();
  const s = screen(512, 384);
  const W = 1.7, H = 1.27, y = 0.9, NX = 26, NY = 19;
  const lenslets = new Swarm(new THREE.SphereGeometry(W / NX / 2, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.bulb(0xb9c6c4, 0.2), NX * NY);
  for (let i = 0; i < NX * NY; i++) lenslets.put(i, ((i % NX) - (NX - 1) / 2) * (W / NX), y + (Math.floor(i / NX) - (NY - 1) / 2) * (H / NY), 0.008);
  lenslets.done();
  const dark = M.dark(), black = M.black(), steel = M.steel(), shell = M.plastic(0x1d1f22, 0.5), T = Math.PI / 2;
  // the lens sheet lies in a rebate: a low rim round it, so that the lenses can still be seen from the side
  root.add(G.rbox(W + 0.14, H + 0.14, 0.1, 0.025, dark, [0, y, -0.055]), G.plane(W, H, M.lit(s, 1.3, 0), [0, y, 0]), lenslets.mesh, G.bezel(W + 0.14, H + 0.14, W + 0.012, H + 0.012, 0.012, 0.022, dark, [0, y, 0.004], 0.025, 0.005), pilot(0x40d070, 0.008, [W / 2 + 0.035, y - H / 2 - 0.035, 0.016]).rotateX(T));
  // behind, the electronics that draw a small picture under every lens: a deeper cover with louvres, screws and a plain plate
  const louvres = vents(1.0, 0.44, 8, [0, y + 0.08, -0.1515]); louvres.userData.noShadow = true;
  root.add(G.rbox(1.3, 0.9, 0.05, 0.02, shell, [0, y, -0.125]), louvres, backScrews([[-0.6, y + 0.4, -0.15], [0.6, y + 0.4, -0.15], [-0.6, y - 0.4, -0.15], [0.6, y - 0.4, -0.15]], 0.014), hush(G.box(0.22, 0.08, 0.004, steel, [0.38, y - 0.33, -0.151], 0)));
  root.add(hush(G.box(0.1, 0.035, 0.02, black, [-0.4, y - 0.34, -0.155], 0)), hush(stub(0.022, 0.02, black, [-0.22, y - 0.34, -0.158], 10).rotateX(T)), hush(G.wire([[-0.22, y - 0.34, -0.165], [-0.22, y - 0.4, -0.2], [-0.12, 0.3, -0.16], [-0.06, 0.1, -0.13], [-0.1, 0.06, -0.2], [-0.3, 0.06, -0.28]], 0.011, M.rubber(), false, 5)));
  // the stand: a slab on four feet, a column, and a bracket with a pivot that takes the back of the panel
  root.add(G.rbox(1.2, 0.05, 0.6, 0.02, dark, [0, 0.025, 0]), G.cyl(0.045, 0.34, M.steel(1), [0, 0.19, -0.13], 20), stub(0.09, 0.02, dark, [0, 0.06, -0.13], 20), G.box(0.2, 0.12, 0.05, dark, [0, 0.34, -0.128], 0.008), stub(0.03, 0.26, steel, [0, 0.34, -0.13], 12).rotateZ(T), hush(stub(0.04, 0.03, black, [0.14, 0.34, -0.13], 10).rotateZ(T)));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(hush(stub(0.04, 0.012, M.rubber(), [sx * 0.5, -0.006, sz * 0.22], 10)));
  fuse(root);
  let key = '';
  return {
    root, views: { lenses: { at: [0.3, 1, 0.55], to: [0, 0.9, 0], fov: 30, play: 0.1 }, round: { at: [0, 0.98, 2.8], to: [0, 0.9, 0], fov: 34, play: 0.35, sway: { rate: 1.6, reach: 0.12, up: 0.8 } } }, inDark: 'glows', glow: 0xffd9a0, view: [-16, 10], surface: s.canvas,
    update: (env) => {
      const [az, el] = gaze(root, env, y);
      // a lens array gives a limited number of views, so the picture moves in small steps
      const qa = Math.round(Math.max(-0.7, Math.min(0.7, az)) / 0.09), qe = Math.round(Math.max(-0.5, Math.min(0.5, el)) / 0.09);
      if (`${qa},${qe}` === key) return; key = `${qa},${qe}`;
      s.ctx.fillStyle = '#090a10'; s.ctx.fillRect(0, 0, 512, 384);
      depthScene(s.ctx, 512, 384, Math.tan(qa * 0.09), Math.tan(qe * 0.09), '#fff');
      s.tex.needsUpdate = true;
    },
  };
}

/** Something lit by one colour of laser light: a single hue, bright where it faces the beam, and grainy with speckle. */
function laserLit(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uGain: { value: 1 }, uTint: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */ `varying vec3 vN; void main() { vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uGain; uniform vec3 uTint; varying vec3 vN;
      float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main() {
        float d = max(dot(normalize(vN), normalize(vec3(-0.45, 0.6, 0.65))), 0.0);
        float speckle = 0.55 + 0.9 * h21(floor(gl_FragCoord.xy / 2.0));
        gl_FragColor = vec4(uTint * (0.14 + 0.86 * d) * speckle * uGain, 1.0);
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

/** A wooden toy engine on a length of track, about one unit long, its wheels on the rails at the origin and its front towards +x. */
function toyEngine(mat: THREE.Material): THREE.BufferGeometry {
  const T = Math.PI / 2, g = G.group();
  const lie = <O extends THREE.Object3D>(o: O, p: V3): O => { o.rotation.z = -T; o.position.set(p[0], p[1], p[2]); return o; };
  const block = (w: number, h: number, d: number, p: V3) => G.box(w, h, d, mat, p, 0);
  // the boiler, turned in one piece: three bands, a wider smokebox and its domed door
  g.add(lie(G.lathe([[0, 0], [0.126, 0], [0.126, 0.1], [0.132, 0.104], [0.132, 0.116], [0.126, 0.12], [0.126, 0.22], [0.132, 0.224], [0.132, 0.236], [0.126, 0.24], [0.126, 0.36], [0.138, 0.365], [0.138, 0.5], [0.13, 0.512], [0.09, 0.535], [0, 0.545]], mat, 32), [-0.2, 0.2, 0]), G.sph(0.016, mat, [0.35, 0.2, 0], 8));
  // chimney with a lip, steam dome, sand dome and a headlamp
  const stack = G.lathe([[0.064, 0.325], [0.05, 0.345], [0.042, 0.36], [0.046, 0.47], [0.062, 0.485], [0.062, 0.5], [0.05, 0.505], [0.04, 0.5], [0.04, 0.47]], mat, 18); stack.position.x = 0.235;
  const dome = G.lathe([[0.06, 0.315], [0.06, 0.36], [0.05, 0.385], [0.03, 0.398], [0, 0.402]], mat, 16); dome.position.x = 0.02;
  const sand = G.lathe([[0.04, 0.315], [0.04, 0.35], [0.03, 0.366], [0, 0.372]], mat, 12); sand.position.x = -0.1;
  g.add(stack, dome, sand, lie(stub(0.028, 0.06, mat), [0.315, 0.362, 0]));
  // the cab: sawn boards with drilled windows, open at the back, under a bowed roof
  for (const sz of [-1, 1]) { const side = sawn(0.27, 0.32, [[0.02, 0.05, 0.055]], 0.02, mat); side.position.set(-0.325, 0.25, sz * 0.115); g.add(side); }
  const front = sawn(0.25, 0.32, [[-0.085, 0.085, 0.034], [0.085, 0.085, 0.034]], 0.02, mat); front.rotation.y = T; front.position.set(-0.2, 0.25, 0);
  const bow: [number, number][] = [];
  for (let i = 0; i <= 8; i++) { const z = -0.17 + i * 0.0425; bow.push([z, 0.425 + 0.04 * (1 - (z / 0.17) ** 2)]); }
  for (let i = 8; i >= 0; i--) bow.push([bow[i][0], bow[i][1] - 0.02]);
  g.add(front, block(0.02, 0.14, 0.25, [-0.455, 0.17, 0]), G.profile(bow, 0.34, mat, [-0.325, 0, 0], 0));
  // footplate on a frame, a beam at each end and a wedge in front to clear the line
  g.add(block(0.9, 0.025, 0.25, [-0.06, 0.0875, 0]), block(0.8, 0.05, 0.2, [-0.06, 0.055, 0]), block(0.025, 0.06, 0.32, [0.385, 0.07, 0]), block(0.025, 0.06, 0.32, [-0.505, 0.07, 0]));
  g.add(G.profile([[0, 0.02], [0.15, 0.02], [0, 0.105]], 0.3, mat, [0.395, 0, 0], 0).rotateY(T));
  // wheels with a tyre, a flange and a hub: two coupled pairs under the cab and the boiler, a small pair in front
  for (const [x, R] of [[-0.3, 0.1], [-0.07, 0.1], [0.24, 0.062]]) for (const sz of [-1, 1]) {
    const wheel = G.lathe([[0, -0.012], [1.1 * R, -0.012], [1.1 * R, -0.004], [R, 0], [R, 0.014], [0.78 * R, 0.014], [0.72 * R, 0.008], [0.26 * R, 0.008], [0.22 * R, 0.016], [0, 0.016]], mat, 24);
    wheel.rotation.x = sz * T; wheel.position.set(x, R + 0.012, sz * 0.143);
    g.add(wheel);
    if (R > 0.07) g.add(stub(0.012, 0.014, mat, [x, R + 0.012 - 0.045, sz * 0.166], 8).rotateX(T));
  }
  // a cylinder each side, and the rod that turns both driving wheels
  for (const sz of [-1, 1]) g.add(lie(stub(0.034, 0.1, mat), [0.1, 0.085, sz * 0.15]), block(0.4, 0.014, 0.008, [-0.14, 0.067, sz * 0.174]));
  // the track: two rails spiked to sleepers
  g.add(block(1.5, 0.012, 0.03, [0, 0.006, 0.15]), block(1.5, 0.012, 0.03, [0, 0.006, -0.15]));
  for (let i = 0; i < 13; i++) g.add(block(0.05, 0.01, 0.42, [-0.72 + i * 0.12, 0.001, 0]));
  return weld(g);
}

/** Hologram: a glass plate that bends laser light back into the wavefront of the object, so the view changes smoothly as you move. */
export function hologram(): Built {
  const root = G.group();
  const y = 1.05, RED = 0xff2412, T = Math.PI / 2;
  const dark = M.dark(), black = M.black(), steel = M.steel(), brass = M.brass(), rubber = M.rubber();
  const plate = G.pane(1.3, 1.1, 0.02, [0, y, 0], 0x9aa89a, 0.1);
  const hole = opening(new THREE.PlaneGeometry(1.26, 1.06), [0, y, 0.012]);
  // plate holder: a channelled frame that the plate drops into, pinched at each side by two thumbscrews
  root.add(plate, hole, G.box(1.5, 0.07, 0.14, dark, [0, y - 0.58, 0]), G.box(0.07, 1.21, 0.1, dark, [-0.68, y - 0.01, 0]), G.box(0.07, 1.21, 0.1, dark, [0.68, y - 0.01, 0]), G.box(1.5, 0.045, 0.1, dark, [0, y + 0.5725, 0]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) root.add(stub(0.022, 0.03, brass, [sx * 0.73, y + sy * 0.34, 0]).rotateZ(T));
  const pan = screws([[-0.68, y - 0.58, 0.07], [0.68, y - 0.58, 0.07], [-0.68, y + 0.5725, 0.05], [0.68, y + 0.5725, 0.05]], 0.014); pan.userData.noShadow = true;
  // an optical bench: laser, lens and plate stand in one line on a dovetail rail, each on a saddle that slides and clamps
  const A = 0.864, on = (s: number): [number, number] => [s * Math.cos(A), s * Math.sin(A)];
  const rail = G.profile([[-0.11, 0], [0.11, 0], [0.11, 0.018], [0.058, 0.03], [0.085, 0.075], [-0.085, 0.075], [-0.058, 0.03], [-0.11, 0.018]], 2.22, steel, [on(-0.89)[0], 0, on(-0.89)[1]], 0.004);
  rail.rotation.y = -A;
  // a scale is engraved along the rail, so that a set-up can be written down and put back
  const ticks = screen(1024, 16);
  ticks.ctx.fillStyle = '#c4c8cc'; ticks.ctx.fillRect(0, 0, 1024, 16);
  ticks.ctx.fillStyle = '#16181a';
  for (let i = 1; i < 110; i++) ticks.ctx.fillRect(Math.round((i / 110) * 1024), 0, i % 5 ? 1 : 2, i % 10 ? (i % 5 ? 6 : 9) : 13);
  ticks.tex.needsUpdate = true;
  const rule = G.plane(2.2, 0.024, M.printed(ticks, 0.5), [on(-0.89)[0] - 0.068 * Math.sin(A), 0.0756, on(-0.89)[1] + 0.068 * Math.cos(A)]);
  rule.rotation.set(-T, -A, 0, 'YXZ'); rule.userData.noShadow = true;
  const saddle = (s: number, top: number, r = 0.022): THREE.Group => {
    const g = G.group(
      G.box(0.14, 0.08, 0.26, dark, [0, 0.085, 0]), stub(0.03, 0.035, black, [0, 0.085, 0.147]).rotateX(T),
      stub(0.042, 0.13, dark, [0, 0.19, 0], 16), stub(0.012, 0.035, brass, [0, 0.22, 0.055]).rotateX(T), G.rod([0, 0.14, 0], [0, top, 0], r, steel, 12),
    );
    g.position.set(on(s)[0], 0, on(s)[1]); g.rotation.y = -A;
    return g;
  };
  root.add(pan, rail, rule, saddle(0, y - 0.61, 0.032));
  // the scene the plate remembers: a toy engine, standing where it stood when the plate was exposed
  const mat = laserLit(RED);
  const train = new THREE.Mesh(toyEngine(mat), mat);
  train.position.set(0.05, y - 0.42, -0.62); train.rotation.y = 0.55;
  const image = G.group(train);
  portal([hole], image, { additive: true, solid: true });
  root.add(image);
  // a transmission hologram is lit from behind, at the angle the reference beam came from
  const src: V3 = [-0.86, y + 0.12, -1.02], head: V3 = [src[0] - 0.33, src[1] + 0.02, src[2] - 0.36];
  // the laser: a gas tube in an aluminium housing, strapped into a cradle. The beam leaves through a small hole in the front
  const tube = G.group(
    G.cyl(0.07, 0.7, M.steel(1), undefined, 28), stub(0.075, 0.05, dark, [0, -0.33, 0], 28), stub(0.022, 0.04, black, [0, -0.375, 0], 10),
    G.lathe([[0.075, 0.3], [0.075, 0.352], [0.066, 0.36], [0.034, 0.36], [0.03, 0.347], [0, 0.347]], dark, 28), stub(0.03, 0.004, M.glow(RED, 2.6), [0, 0.348, 0], 16),
    stub(0.08, 0.035, dark, [0, 0.19, 0], 28), stub(0.08, 0.035, dark, [0, -0.19, 0], 28), G.box(0.06, 0.46, 0.02, dark, [0, 0, 0.088], 0),
  );
  tube.position.set(head[0], head[1], head[2]); tube.lookAt(src[0], src[1], src[2]); tube.rotateX(T);
  // the lens that spreads the beam over the whole plate
  const spread = G.group(new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16).scale(1, 1, 0.4), M.glass(0x9fb6b8, 0.07, 0.75)), new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 32), dark));
  spread.position.set(src[0], src[1], src[2]); spread.lookAt(0, y, 0);
  root.add(tube, spread, saddle(-1.822, head[1] - 0.098, 0.028), saddle(-1.334, src[1] - 0.066, 0.016), halo(RED, 0.2, src, 0.5));
  // its power supply stands apart, with the switch and a lamp that burns while the laser does
  const supply = G.group(G.rbox(0.34, 0.14, 0.26, 0.016, M.plastic(0x2a2c30, 0.5), [0, 0.085, 0]), G.slab(0.31, 0.11, 0.01, 0.008, steel, [0, 0.085, 0.131], 0.002), jewel(0xff3020, 0.014, [0.09, 0.085, 0.135]));
  const key = toggle([-0.08, 0.085, 0.135]); key.scale.setScalar(0.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) supply.add(stub(0.022, 0.016, rubber, [sx * 0.13, 0.008, sz * 0.09], 10));
  supply.add(key, stub(0.02, 0.03, black, [-0.182, 0.1, 0], 10).rotateZ(T));
  supply.position.set(-0.79, 0, -1.49); supply.rotation.y = -0.35;
  // the lead from the back of the tube hangs down, passes the end of the rail and goes into the side of the supply
  const lead = G.wire([[-1.452, 1.206, -1.666], [-1.462, 1.17, -1.674], [-1.455, 0.7, -1.66], [-1.43, 0.13, -1.64], [-1.3, 0.014, -1.6], [-1.1, 0.03, -1.585], [-0.978, 0.1, -1.558]], 0.012, rubber, false, 6);
  root.add(supply, lead);
  for (const [tx, ty] of [[-0.6, 0.5], [0.6, 0.5], [-0.6, -0.5], [0.6, -0.5]]) { const b = beam(RED, 0.2); b.aim(src, [tx, y + ty, -0.012]); root.add(b.line); }
  fuse(root);
  return {
    root, views: { bench: { at: [-2, 1.7, 1.2], to: [-0.4, 0.7, -0.5], fov: 40, play: 0.1 }, plate: { at: [0.2, 1.12, 2.3], to: [0, 1.0, -0.3], fov: 34, play: 0.3, sway: { rate: 1.4, reach: 0.12, up: 0.7 } } }, inDark: 'better', glow: 0x7a140c, view: [-18, 8],
    update: ({ lights }) => { mat.uniforms.uGain.value = 1 - 0.5 * lights; },
  };
}

/** Head-mounted display: one small screen and one lens for each eye, and nothing else in view. */
export function hmd(): Built {
  const root = G.group();
  const EY = 1.04;
  const head = G.lathe([[0.5, 0], [0.5, 0.05, 1], [0.36, 0.2], [0.2, 0.3], [0.17, 0.44], [0.21, 0.56], [0.36, 0.72], [0.425, 0.95], [0.4, 1.2], [0.28, 1.4], [0.1, 1.5], [0, 1.52]], M.ceramic(), 72, true);
  head.scale.z = 1.06;
  root.add(head);
  const shell = M.plastic(0x1b1d20, 0.4), gloss = M.plastic(0x050506, 0.1), dark = M.dark(), black = M.black(), steel = M.steel(), webbing = M.cloth(0x34363a);
  const FZ = 0.44, T = Math.PI / 2;
  // visor and face gasket. The front is a glossy plate with a tracking camera looking out of each corner
  root.add(G.rbox(0.84, 0.4, 0.32, 0.1, shell, [0, EY, FZ + 0.2]), G.bezel(0.78, 0.36, 0.62, 0.24, 0.1, 0.1, M.rubber(), [0, EY, FZ + 0.02], 0.12, 0.02), G.slab(0.62, 0.2, 0.05, 0.012, gloss, [0, EY, FZ + 0.361], 0.003));
  for (const [x, yy] of [[-0.33, 0.13], [0.33, 0.13], [-0.33, -0.13], [0.33, -0.13]]) {
    const ring = G.lathe([[0.038, 0], [0.038, 0.006], [0.031, 0.011], [0.027, 0.005]], shell, 16); ring.rotation.x = T; ring.position.set(x, EY + yy, FZ + 0.357);
    root.add(ring, stub(0.028, 0.012, gloss, [x, EY + yy, FZ + 0.358], 16).rotateX(T));
  }
  // on top: slots that let the heat of the electronics out, the volume rocker and the power button. At the side, the charging socket
  const slots = vents(0.32, 0.05, 10, [0, EY + 0.1995, FZ + 0.22], true); slots.rotation.x = -T; slots.userData.noShadow = true;
  root.add(slots, G.rbox(0.11, 0.012, 0.028, 0.006, M.plastic(0x2e3136, 0.4), [0.25, EY + 0.202, FZ + 0.22]), stub(0.016, 0.008, M.plastic(0x2e3136, 0.4), [-0.25, EY + 0.202, FZ + 0.22]), G.box(0.004, 0.014, 0.034, black, [-0.42, EY - 0.06, FZ + 0.24], 0));
  // a strip of a ring seen from above, given some height: a strap that lies round the back of the head
  const band = (rx: number, rz: number, t: number, hgt: number, a0: number, a1: number, n: number, mat: THREE.Material) => {
    const sh = new THREE.Shape();
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; if (i) sh.lineTo(rx * Math.cos(a), -rz * Math.sin(a)); else sh.moveTo(rx * Math.cos(a), -rz * Math.sin(a)); }
    for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; sh.lineTo((rx - t) * Math.cos(a), -(rz - t) * Math.sin(a)); }
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: hgt, bevelEnabled: false }).rotateX(T).translate(0, hgt / 2, 0), mat);
    m.position.y = EY + 0.02;
    return m;
  };
  // a stiff arm on a pivot at each side of the visor, webbing from arm to arm, and at the back a padded cradle with the wheel that tightens it
  for (const sx of [-1, 1]) root.add(G.rbox(0.022, 0.075, 0.6, 0.01, shell, [sx * 0.452, EY + 0.02, 0.24]), stub(0.05, 0.036, shell, [sx * 0.437, EY + 0.02, FZ + 0.1], 20).rotateZ(T), stub(0.02, 0.04, steel, [sx * 0.437, EY + 0.02, FZ + 0.1], 12).rotateZ(T));
  root.add(band(0.45, 0.475, 0.012, 0.07, 0.1, Math.PI - 0.1, 36, webbing), band(0.468, 0.497, 0.022, 0.16, 1.0, Math.PI - 1.0, 14, shell), band(0.446, 0.475, 0.016, 0.14, 1.05, Math.PI - 1.05, 14, M.rubber()));
  root.add(G.cyl(0.062, 0.034, shell, [0, EY + 0.02, -0.512], 24).rotateX(T), stub(0.03, 0.006, steel, [0, EY + 0.02, -0.531], 16).rotateX(T));
  // the strap over the top of the head takes the weight off the face
  const arc = new THREE.Shape();
  arc.absarc(0, 0, 0.474, 0.2, Math.PI, false); arc.absarc(0, 0, 0.464, Math.PI, 0.2, true);
  const over = new THREE.Mesh(new THREE.ExtrudeGeometry(arc, { depth: 0.06, bevelEnabled: false, curveSegments: 28 }).rotateY(-T).translate(0.03, 0, 0), webbing);
  over.position.y = EY + 0.04;
  root.add(over, G.box(0.08, 0.04, 0.05, shell, [0, EY + 0.135, FZ + 0.05], 0.006), G.box(0.07, 0.03, 0.03, shell, [0, EY + 0.06, -0.482], 0.006));
  // the world inside: it exists only for an eye behind the lens
  const world = G.group();
  const flat = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  const sky = screen(8, 256), sg = sky.ctx.createLinearGradient(0, 0, 0, 256);
  sg.addColorStop(0, '#070b24'); sg.addColorStop(0.5, '#2a1b5e'); sg.addColorStop(0.62, '#ff7a59'); sg.addColorStop(0.66, '#12142e'); sg.addColorStop(1, '#070818');
  sky.ctx.fillStyle = sg; sky.ctx.fillRect(0, 0, 8, 256); sky.tex.needsUpdate = true;
  world.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 24), new THREE.MeshBasicMaterial({ map: sky.tex, side: THREE.BackSide })));
  const grid = screen(256, 256), gc = grid.ctx;
  gc.fillStyle = '#0a0c22'; gc.fillRect(0, 0, 256, 256); gc.strokeStyle = '#49e0ff'; gc.lineWidth = 5; gc.strokeRect(0, 0, 256, 256);
  grid.tex.wrapS = grid.tex.wrapT = THREE.RepeatWrapping; grid.tex.repeat.set(60, 60); grid.tex.needsUpdate = true;
  const floor = G.plane(120, 120, new THREE.MeshBasicMaterial({ map: grid.tex }), [0, EY - 1.2, 0]); floor.rotation.x = -Math.PI / 2;
  const sign = screen(512, 160);
  const board = G.plane(3.2, 1.0, new THREE.MeshBasicMaterial({ map: sign.tex, transparent: true }), [0, EY + 0.25, 5.2]); board.rotation.y = Math.PI;
  world.add(floor, board);
  const things: THREE.Mesh[] = [];
  [[-1.3, 0.1, 3.2, 0xff5d5d], [1.5, -0.3, 4.2, 0xffd166], [0.5, 0.9, 7, 0x6f8cff], [-2.6, 0.6, 8, 0x7dffa2], [2.8, 0.4, 10, 0xff8fd0]].forEach(([x, dy, z, hue], i) => {
    const mesh = new THREE.Mesh(i % 2 ? new THREE.IcosahedronGeometry(0.42, 0) : new THREE.TorusKnotGeometry(0.3, 0.09, 80, 12), new THREE.MeshNormalMaterial());
    mesh.position.set(x, EY + dy, z); world.add(mesh, new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), flat(hue)).translateX(x).translateY(EY + dy - 1.5).translateZ(z));
    things.push(mesh);
  });
  const holes = [-1, 1].map((sx) => { const hole = opening(new THREE.CircleGeometry(0.1, 40), [sx * 0.09, EY, FZ + 0.03]); hole.rotation.y = Math.PI; return hole; });
  portal(holes, world, { ref: 3 });
  root.add(...holes, world);
  // beside it, the works of one eye taken out: a lens, and the little screen it looks at
  const s = screen(256, 256);
  const glass = G.sph(0.13, M.glass(0x9fb6b8, 0.07, 0.75), [0, 0, 0.16], 32); glass.scale.z = 0.34;
  // the lens sits in a cell with four lugs, the panel on a backing plate, and four rods hold the two at the right distance
  const cell = G.lathe([[0.128, -0.014], [0.15, -0.014], [0.15, 0.014], [0.128, 0.014], [0.128, -0.014]], dark, 32); cell.rotation.x = T; cell.position.z = 0.16;
  const kit = G.group(glass, cell, G.rbox(0.34, 0.34, 0.03, 0.02, shell, [0, 0, -0.07]), G.plane(0.29, 0.29, M.lit(s, 1.5, 0.6), [0, 0, -0.054]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    kit.add(G.rod([sx * 0.15, sy * 0.15, -0.085], [sx * 0.15, sy * 0.15, 0.176], 0.008, steel, 8), G.box(0.08, 0.03, 0.012, dark, [sx * 0.13, sy * 0.13, 0.16], 0).rotateZ(Math.atan2(sy, sx)), stub(0.015, 0.01, steel, [sx * 0.15, sy * 0.15, 0.171], 6).rotateX(T));
    kit.add(stub(0.008, 0.016, steel, [sx * 0.11, sy * 0.08 + 0.02, -0.093], 6).rotateX(T));
  }
  // behind the panel, the board that drives it, and the flat cable that folds round from the panel's lower edge
  const amber = M.plastic(0xc47a1e, 0.5);
  kit.add(G.box(0.26, 0.2, 0.01, M.pcb(), [0, 0.02, -0.106], 0), G.box(0.07, 0.07, 0.012, black, [-0.05, 0.045, -0.117], 0), G.box(0.04, 0.05, 0.01, black, [0.07, 0.05, -0.116], 0), G.box(0.13, 0.022, 0.014, M.ceramic(), [0, -0.055, -0.118], 0));
  kit.add(G.box(0.12, 0.003, 0.056, amber, [0, -0.173, -0.098], 0), G.box(0.12, 0.11, 0.003, amber, [0, -0.118, -0.1245], 0), G.box(0.33, 0.03, 0.05, dark, [0, -0.165, 0.04], 0));
  kit.position.set(0.86, 0.34, 0.5); kit.rotation.y = -0.5;
  root.add(kit, G.rod([0.86, 0.02, 0.5], [0.86, 0.165, 0.5], 0.02, steel, 12), G.cyl(0.1, 0.022, dark, [0.86, 0.011, 0.5], 24));
  fuse(root);
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9fc0ff, view: [28, 8],
    views: { kit: { at: [1.35, 0.75, 1.3], to: [0.86, 0.36, 0.5], fov: 32, play: 0.1 }, worn: { at: [0.09, EY, FZ - 0.09], to: [0.09, EY, FZ + 0.5], fov: 62, play: 0.1 } },
    update: ({ t }) => {
      things.forEach((mesh, i) => { mesh.rotation.set(t * 0.4 + i, t * 0.3, 0); });
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      sign.ctx.clearRect(0, 0, 512, 160); bigTime(sign.ctx, 512, 160, n.hhmmss, '#ffffff', 800, 0.8); sign.tex.needsUpdate = true;
      // the picture on the panel is drawn bulging, so that the lens, which pinches, shows it straight
      const c = s.ctx; c.fillStyle = '#070912'; c.fillRect(0, 0, 256, 256);
      c.strokeStyle = '#49e0ff'; c.lineWidth = 1.5;
      const warp = (x: number, yy: number): [number, number] => { const r2 = x * x + yy * yy, k = 1 - 0.2 * r2; return [128 + x * k * 122, 128 + yy * k * 122]; };
      for (let i = -4; i <= 4; i++) for (const flip of [0, 1]) { c.beginPath(); for (let j = -20; j <= 20; j++) { const a = i / 4, b = j / 20, [X, Y] = flip ? warp(a, b) : warp(b, a); if (j === -20) c.moveTo(X, Y); else c.lineTo(X, Y); } c.stroke(); }
      c.fillStyle = '#fff'; c.font = '700 34px "Sofia Sans Extra Condensed Variable", sans-serif'; c.textAlign = 'center'; c.fillText(n.hhmmss, 128, 140);
      s.tex.needsUpdate = true;
    },
  };
}

/** Retinal display: no screen at all. A scanned beam goes in through the pupil and paints the picture on the retina. */
export function retinal(): Built {
  const root = G.group();
  const y = 1.05, R = 0.72;
  const s = screen(256, 256);
  s.ctx.fillStyle = '#2a0c08'; s.ctx.fillRect(0, 0, 256, 256);
  // a classroom eye, with a quarter cut away
  const cut: [number, number] = [Math.PI * 1.25, Math.PI * 1.5];
  const white = M.ceramic(), inside = M.plastic(0x9c3a2a, 0.6); inside.side = THREE.BackSide;
  const eye = G.group(
    new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40, cut[0], cut[1], 0.42, Math.PI - 0.42).rotateX(Math.PI / 2), white),
    new THREE.Mesh(new THREE.SphereGeometry(R - 0.03, 64, 40, cut[0], cut[1], 0.42, Math.PI - 0.42).rotateX(Math.PI / 2), inside),
  );
  const T = Math.PI / 2, brass = M.brass(), dark = M.dark(), black = M.black(), shell = M.plastic(0x1d1f22, 0.5);
  // where the wall has been cut it shows its coats: the white one outside, and inside it the dark one that carries the blood
  const rim = M.ceramic(), coat = M.plastic(0x5a1f18, 0.6), flesh = M.plastic(0xb5584a, 0.6), muscle = M.plastic(0xa8402f, 0.55);
  rim.side = coat.side = flesh.side = muscle.side = THREE.DoubleSide;
  for (const a of [-Math.PI / 4, Math.PI / 4]) {
    const out = new THREE.Vector3(Math.cos(a), Math.sin(a), 0), Z = new THREE.Vector3(0, 0, 1), face = new THREE.Matrix4().makeBasis(Z, out, Z.clone().cross(out));
    eye.add(hush(new THREE.Mesh(new THREE.RingGeometry(R - 0.014, R, 40, 1, 0.42, Math.PI - 0.42).applyMatrix4(face), rim)), hush(new THREE.Mesh(new THREE.RingGeometry(R - 0.03, R - 0.014, 40, 1, 0.42, Math.PI - 0.42).applyMatrix4(face), coat)));
  }
  // two of the muscles that turn the eye, cut short as on every such model: the upper one and the one on the side of the nose
  const strap = (dx: number, dy: number): THREE.Mesh => {
    const N = 14, K = 6, at: number[] = [], tri: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, th = 0.72 + t * 1.75, r = R + 0.014 + 0.2 * Math.max(0, t - 0.72) ** 1.6, w = 0.05 + 0.06 * Math.sin(Math.PI * Math.min(1, t * 1.15));
      for (let k = 0; k < K; k++) {
        const a = (k / K) * Math.PI * 2, u = Math.cos(a) * w, v = Math.sin(a) * 0.014;
        at.push(dx * Math.sin(th) * (r + v) - dy * u, dy * Math.sin(th) * (r + v) + dx * u, Math.cos(th) * (r + v));
      }
    }
    for (let i = 0; i < N; i++) for (let k = 0; k < K; k++) { const p = i * K + k, q = i * K + ((k + 1) % K); tri.push(p, q, p + K, q, q + K, p + K); }
    for (let k = 1; k < K - 1; k++) tri.push(N * K, N * K + k, N * K + k + 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(at, 3)); geo.setIndex(tri); geo.computeVertexNormals();
    return hush(new THREE.Mesh(geo, muscle));
  };
  eye.add(strap(0, 1), strap(-1, 0));
  // cornea, iris and lens at the front
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.4, 40, 20, 0, Math.PI * 2, 0, 0.82).rotateX(T), M.bulb(0x9fb1ae, 0.6));
  cornea.position.z = R - 0.3;
  // the iris is a ring of fine muscle: fibres run from the pupil to a darker edge
  const fibres = screen(256, 256), ic = fibres.ctx;
  ic.fillStyle = '#3d6f8f'; ic.fillRect(0, 0, 256, 256); ic.translate(128, 128); ic.lineWidth = 1.6;
  for (let k = 0; k < 96; k++) {
    const a = (k / 96) * Math.PI * 2 + 0.03 * Math.sin(k * 7.1);
    ic.strokeStyle = k % 3 ? 'rgba(18,48,78,.5)' : 'rgba(176,210,228,.55)';
    ic.beginPath(); ic.moveTo(Math.cos(a) * 46, Math.sin(a) * 46); ic.lineTo(Math.cos(a) * 124, Math.sin(a) * 124); ic.stroke();
  }
  ic.strokeStyle = 'rgba(12,30,52,.8)'; ic.lineWidth = 9; ic.beginPath(); ic.arc(0, 0, 123, 0, 7); ic.stroke();
  ic.strokeStyle = 'rgba(205,228,238,.45)'; ic.lineWidth = 4; ic.beginPath(); ic.arc(0, 0, 66, 0, 7); ic.stroke();
  fibres.tex.needsUpdate = true;
  const iris = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.285, 48), new THREE.MeshStandardMaterial({ map: fibres.tex, roughness: 0.5, side: THREE.DoubleSide })); iris.position.z = R - 0.08;
  const crystalline = G.sph(0.2, M.glass(0xcfc49a, 0.25, 0.6), [0, 0, R - 0.2], 28); crystalline.scale.z = 0.5;
  // the ring of muscle that holds the lens and changes its shape, and the edge where the clear front joins the white
  const ciliary = hush(new THREE.Mesh(new THREE.RingGeometry(0.2, 0.455, 36, 1, Math.PI / 4, Math.PI * 1.5), flesh)); ciliary.position.z = R - 0.2;
  const limbus = hush(new THREE.Mesh(new THREE.TorusGeometry(R * Math.sin(0.42), 0.014, 6, 48), white)); limbus.position.z = R * Math.cos(0.42);
  // the picture lands on the back wall, upside down, as every image in an eye does
  const retina = G.dish(0.42, -0.13, M.lit(s, 1.3, 0), [0, 0, -R + 0.17]); retina.rotation.z = Math.PI;
  // the nerve leaves at the back, a little to one side. Its cut end shows the artery and the vein that run up its middle
  const nerve = G.group(G.cyl(0.1, 0.36, M.plastic(0xd9c47a, 0.6), undefined, 24), hush(stub(0.112, 0.05, M.plastic(0xcdb56a, 0.6), [0, 0.13, 0], 20)), hush(stub(0.02, 0.006, M.plastic(0xb8322a, 0.5), [-0.03, -0.181, 0], 10)), hush(stub(0.02, 0.006, M.plastic(0x3a5fa8, 0.5), [0.03, -0.181, 0], 10)));
  nerve.position.set(0.22, -0.04, -R - 0.1); nerve.rotation.x = T - 0.25;
  eye.add(cornea, iris, crystalline, ciliary, limbus, retina, nerve);
  eye.position.y = y;
  // the stand: a turned wooden foot, a brass rod, and a cup that takes the eye
  root.add(eye, G.cyl(0.035, y - R + 0.06, M.brass(1), [0, (y - R + 0.06) / 2, 0], 20), G.lathe([[0, 0], [0.42, 0], [0.42, 0.02], [0.405, 0.034], [0.385, 0.038], [0.37, 0.05], [0, 0.05]], M.wood(0x3b2616), 56), G.cyl(0.1, 0.04, brass, [0, 0.07, 0], 32));
  root.add(G.lathe([[0.036, y - R - 0.07], [0.05, y - R - 0.06], [0.09, y - R - 0.01], [0.13, y - R + 0.012], [0.12, y - R + 0.014]], brass, 24));
  // the projector: a laser and a mirror the size of a pinhead, worn at the temple. The mirror sits in a window in its face
  const bezel = G.lathe([[0.075, 0], [0.075, 0.012], [0.062, 0.02], [0.052, 0.006]], dark, 20); bezel.rotation.x = -T; bezel.position.set(-0.12, 0, -0.15);
  const mod = G.group(G.rbox(0.42, 0.24, 0.3, 0.035, shell), bezel, hush(stub(0.05, 0.004, M.chrome(), [-0.12, 0, -0.153], 20).rotateX(T)), hush(screws([[0.16, 0.08, 0.151], [0.16, -0.08, 0.151], [-0.16, 0.08, 0.151], [-0.16, -0.08, 0.151]], 0.014)), hush(G.box(0.34, 0.004, 0.22, black, [0, 0.121, 0], 0)), hush(stub(0.022, 0.03, black, [0.1, -0.04, 0.16], 10).rotateX(T)));
  mod.position.set(-0.8, y - 0.12, 1.5); mod.rotation.y = 0.5; mod.scale.x = -1;
  root.add(mod, post([-0.8, y - 0.25, 1.5], 0, 0.022), G.rbox(0.5, 0.04, 0.4, 0.015, dark, [-0.8, 0.02, 1.5]), stub(0.04, 0.05, dark, [-0.8, y - 0.25, 1.5], 12));
  root.add(hush(G.wire([[-0.81, y - 0.16, 1.69], [-0.8, y - 0.2, 1.73], [-0.82, 0.5, 1.6], [-0.83, 0.12, 1.56], [-0.75, 0.05, 1.62], [-0.62, 0.05, 1.65]], 0.011, M.rubber(), false, 5)));
  fuse(root);
  const b1 = beam(0xff4030, 0.9), b2 = beam(0xff4030, 0.7);
  root.add(b1.line, b2.line);
  let lastRow = -1;
  return {
    root, views: { retina: { at: [1.25, 1.35, 0.95], to: [0, 1.05, -0.5], fov: 30 } }, inDark: 'glows', glow: 0xff5040, view: [38, 10], zoom: 1.05, surface: s.canvas,
    update: ({ t }) => {
      const n = now(), c = s.ctx;
      const row = Math.floor((t * 22) % 32), u = (t * 9) % 1;
      if (row !== lastRow) {
        lastRow = row;
        // one line of the raster at a time; what was drawn a moment ago is still fading
        c.fillStyle = 'rgba(42,12,8,.12)'; c.fillRect(0, 0, 256, 256);
        c.save(); c.beginPath(); c.rect(48, 48 + row * 5, 160, 5); c.clip();
        c.fillStyle = '#3a1410'; c.fillRect(48, 48, 160, 160);
        bigTime(c, 256, 256, n.hhmm, '#ffd9c8', 800, 0.3);
        c.restore();
      }
      s.tex.needsUpdate = true;
      const hit: V3 = [-(0.5 - u) * 0.52, y - (0.5 - row / 32) * 0.52, -R + 0.07];
      b1.aim([-0.74, y - 0.12, 1.37], [0, y, R - 0.08]); b2.aim([0, y, R - 0.08], hit);
    },
  };
}

/** Head-up display: symbols reflected in a sloping sheet of glass, focused far away so they sit on the world outside. */
export function hud(): Built {
  const root = G.group();
  const s = screen(512, 400);
  const dark = M.dark(), black = M.black(), steel = M.steel(), cover = M.plastic(0x191a1c, 0.85), GY = 1.42, GZ = -0.05, T = Math.PI / 2;
  // glareshield, and the projector let into the top of it. Its edge overhangs the instruments to keep the sky off them
  root.add(G.rbox(2.0, 0.34, 1.0, 0.07, cover, [0, 0.52, -0.2]), G.rbox(2.0, 0.07, 0.24, 0.032, cover, [0, 0.655, 0.3]), G.box(1.3, 0.36, 0.7, dark, [0, 0.18, -0.2]), G.rbox(0.56, 0.2, 0.46, 0.04, dark, [0, 0.77, -0.05]));
  // the lens that makes the light of each point parallel looks straight up out of the housing
  const glass = G.sph(0.17, M.glass(0x9fb6b8, 0.07, 0.75), [0, 0.875, -0.05], 32); glass.scale.y = 0.22;
  root.add(glass, G.lathe([[0.2, 0.845], [0.2, 0.872], [0.19, 0.884], [0.176, 0.884], [0.17, 0.872]], dark, 40).translateZ(-0.05), hush(screws([[-0.24, 0.87, 0.13], [0.24, 0.87, 0.13], [-0.24, 0.87, -0.23], [0.24, 0.87, -0.23]], 0.012, 'y')));
  // on the face towards the pilot, the brightness knob and three keys
  root.add(hush(G.box(0.42, 0.11, 0.006, steel, [0, 0.765, 0.182], 0)), stub(0.032, 0.03, black, [-0.13, 0.765, 0.198], 14).rotateX(T), hush(G.box(0.004, 0.024, 0.004, M.paper(), [-0.13, 0.782, 0.214], 0)));
  for (let i = 0; i < 3; i++) root.add(hush(G.box(0.05, 0.036, 0.012, M.plastic(0x2e3136, 0.4), [0.02 + i * 0.07, 0.765, 0.188], 0)));
  // an instrument or two, for scale: a dial behind glass in a bezel, held by four screws
  const dial = screen(128, 128), dc = dial.ctx;
  dc.fillStyle = '#0b0c0d'; dc.fillRect(0, 0, 128, 128); dc.translate(64, 64); dc.strokeStyle = dc.fillStyle = '#e8e6dc';
  for (let k = 0; k < 36; k++) { const a = (k / 36) * Math.PI * 2; dc.lineWidth = k % 3 ? 1.5 : 3; dc.beginPath(); dc.moveTo(Math.cos(a) * (k % 3 ? 52 : 45), Math.sin(a) * (k % 3 ? 52 : 45)); dc.lineTo(Math.cos(a) * 58, Math.sin(a) * 58); dc.stroke(); }
  dc.lineWidth = 4; dc.lineCap = 'round'; dc.beginPath(); dc.moveTo(-8, 6); dc.lineTo(32, -28); dc.stroke(); dc.beginPath(); dc.arc(0, 0, 6, 0, 7); dc.fill();
  dial.tex.needsUpdate = true;
  const face = M.printed(dial, 0.25);
  root.add(G.box(1.84, 0.25, 0.01, M.plastic(0x2c2f33, 0.6), [0, 0.49, 0.302], 0));
  [-0.62, 0.62].forEach((x, i) => {
    const bezel = G.lathe([[0.155, 0], [0.155, 0.012], [0.146, 0.02], [0.132, 0.02], [0.126, 0.008]], black, 32); bezel.rotation.x = T; bezel.position.set(x, 0.49, 0.306);
    const hand = hush(new THREE.Mesh(new THREE.CircleGeometry(0.128, 32), face)); hand.position.set(x, 0.49, 0.315); hand.rotation.z = i * 2.2;
    root.add(bezel, hand, hush(screws([[x - 0.125, 0.595, 0.307], [x + 0.125, 0.595, 0.307], [x - 0.125, 0.385, 0.307], [x + 0.125, 0.385, 0.307]], 0.011)));
  });
  // the combiner: plain glass with a coating that mirrors only the green of the tube
  // it leans towards the pilot at the top, so that light coming up from below is turned back along the line of sight
  const slope = Math.PI / 4;
  const frame = G.group(G.pane(1.0, 1.1, 0.016, undefined, 0x86a892, 0.04));
  for (const sx of [-1, 1]) frame.add(G.box(0.02, 1.14, 0.03, M.steel(1), [sx * 0.51, 0, 0], 0.004));
  // a channel along its lower edge carries the glass
  frame.add(G.box(1.04, 0.02, 0.03, steel, [0, -0.56, 0], 0));
  const hole = opening(new THREE.PlaneGeometry(0.98, 1.08), [0, 0, 0.01]);
  frame.add(hole);
  frame.position.set(0, GY, GZ); frame.rotation.x = slope;
  root.add(frame);
  // two struts each side, pinned to the frame and bolted to the glareshield
  for (const x of [-0.52, 0.52]) {
    root.add(G.rod([x, 0.67, -0.52], [x, GY - 0.39, GZ - 0.39], 0.016, M.steel(1), 10), G.rod([x, 0.67, 0.2], [x, GY - 0.2, GZ - 0.2], 0.012, M.steel(1), 10));
    root.add(hush(stub(0.024, 0.036, dark, [x, GY - 0.39, GZ - 0.39], 10).rotateZ(T)), hush(stub(0.02, 0.032, dark, [x, GY - 0.2, GZ - 0.2], 10).rotateZ(T)), hush(G.box(0.06, 0.016, 0.1, steel, [x, 0.697, -0.52], 0)), hush(G.box(0.06, 0.016, 0.1, steel, [x, 0.697, 0.19], 0)));
  }
  // the symbols are focused at infinity: they stay put against the far wall however the head moves, and vanish outside the glass
  // the seat is near enough that the glass holds the whole of the symbols, down to the clock at their foot
  const eyeAt = new THREE.Vector3(0, GY + 0.04, 2.1), centre = new THREE.Vector3(0, GY, GZ), far = 36;
  const dir = centre.clone().sub(eyeAt).normalize();
  const symMat = M.add(s, 0xffffff, 1);
  const sym = G.plane(far * 0.44, far * 0.345, symMat);
  sym.position.copy(centre).addScaledVector(dir, far); sym.lookAt(eyeAt);
  const image = G.group(sym);
  portal([hole], image, { additive: true });
  root.add(image);
  for (const [tx, tz] of [[-0.3, 0.2], [0.3, 0.2], [0, -0.05]]) { const b = beam(0x40ff70, 0.16); b.aim([0, 0.89, -0.05], [tx, GY + tz * 0.7, GZ + tz * 0.7]); root.add(b.line); }
  fuse(root);
  return {
    root, inDark: 'glows', glow: 0x40ff70, view: [7, 4], surface: s.canvas,
    views: { lens: { at: [0.45, 1.45, 0.6], to: [0, 0.88, -0.05], fov: 34, play: 0.1 }, seat: { at: [eyeAt.x, eyeAt.y, eyeAt.z], to: [0, GY, GZ], fov: 30, play: 0.12 } },
    update: ({ t, lights }) => {
      const c = s.ctx, n = now();
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 400);
      c.strokeStyle = c.fillStyle = '#5dff86'; c.lineWidth = 3; c.shadowColor = '#30ff60'; c.shadowBlur = 8;
      const roll = Math.sin(t * 0.4) * 0.16, pitch = Math.sin(t * 0.27) * 26;
      c.save(); c.translate(256, 210); c.rotate(roll);
      c.beginPath(); c.moveTo(-230, pitch); c.lineTo(-50, pitch); c.moveTo(50, pitch); c.lineTo(230, pitch); c.stroke();
      for (const k of [-2, -1, 1, 2]) { c.beginPath(); c.moveTo(-70, pitch - k * 52); c.lineTo(-24, pitch - k * 52); c.moveTo(24, pitch - k * 52); c.lineTo(70, pitch - k * 52); c.stroke(); }
      c.restore();
      c.beginPath(); c.arc(256, 210, 12, 0, 7); c.moveTo(232, 210); c.lineTo(244, 210); c.moveTo(268, 210); c.lineTo(280, 210); c.moveTo(256, 198); c.lineTo(256, 188); c.stroke();
      c.strokeRect(22, 180, 86, 40); c.strokeRect(404, 180, 86, 40);
      c.font = '26px "PT Mono", monospace'; c.textAlign = 'center';
      c.fillText(String(240 + Math.round(Math.sin(t * 0.3) * 6)), 65, 209); c.fillText(String(9500 + Math.round(Math.sin(t * 0.2) * 40)), 447, 209);
      c.fillText(n.hhmmss, 256, 380);
      for (let i = 0; i < 9; i++) { const x = 96 + i * 40; c.beginPath(); c.moveTo(x, 34); c.lineTo(x, i % 2 ? 44 : 52); c.stroke(); }
      c.shadowBlur = 0;
      s.tex.needsUpdate = true;
      symMat.opacity = 1 - 0.35 * lights;
    },
  };
}

/**
 * Glasses that pick an eye: one picture on the screen for both eyes, and three ways for glasses to let each eye
 * see only its own half of it. The screen and the pair in use take turns: by colour (red and cyan filters, as
 * Rollmann described in 1853), by time (shutters that close in turn, as in Hammond's Teleview of 1922) and by
 * polarised light (filters at right angles, as Land showed in 1936). Each act lasts eight seconds.
 */
export function stereoGlasses(): Built {
  const root = G.group();
  const s = screen(512, 320);
  const W = 1.7, H = 1.06, y = 1.02, T = Math.PI / 2;
  const dark = M.dark(), black = M.black(), steel = M.steel(), shell = M.plastic(0x1d1f22, 0.5);
  // the screen in its bezel, with a cover over the electronics behind, a lead and a lamp, as the other screens here have
  root.add(G.rbox(W + 0.12, H + 0.12, 0.06, 0.02, dark, [0, y, -0.04]), G.plane(W, H, M.lit(s, 1.2, 0.25), [0, y, 0]));
  const louvres = vents(0.8, 0.28, 8, [0, y + 0.12, -0.1065]); louvres.userData.noShadow = true;
  root.add(G.rbox(1.24, 0.74, 0.03, 0.012, shell, [0, y, -0.09]), louvres, backScrews([[-0.57, y + 0.32, -0.105], [0.57, y + 0.32, -0.105], [-0.57, y - 0.32, -0.105], [0.57, y - 0.32, -0.105]], 0.014));
  root.add(hush(stub(0.024, 0.02, black, [0.48, y - 0.28, -0.113], 10).rotateX(T)), hush(G.wire([[0.48, y - 0.28, -0.12], [0.5, y - 0.34, -0.15], [0.74, 0.32, -0.1], [0.78, 0.2, -0.085], [0.78, 0.06, -0.085], [0.84, 0.06, -0.24], [0.88, 0.06, -0.3]], 0.011, M.rubber(), false, 5)));
  root.add(pilot(0x40d070, 0.008, [W / 2 + 0.03, y - H / 2 - 0.025, -0.004]).rotateX(T));
  // on top of the bezel, the box that tells the shutter glasses when to switch, its dark red window facing the room
  const sync = M.glow(0xff3040, 0.1);
  root.add(G.rbox(0.16, 0.05, 0.06, 0.01, shell, [0, y + H / 2 + 0.085, -0.03]), G.box(0.1, 0.026, 0.006, sync, [0, y + H / 2 + 0.085, 0.001], 0), G.box(0.05, 0.03, 0.04, dark, [0, y + H / 2 + 0.05, -0.04]));
  // the stand: a slab on rubber feet, two uprights bolted to it and to the back of the panel
  const up = y - H / 2 - 0.05;
  root.add(G.rbox(W + 0.2, 0.05, 0.56, 0.02, dark, [0, 0.025, -0.06]));
  for (const sx of [-1, 1]) {
    root.add(G.box(0.06, up - 0.04, 0.06, M.steel(1), [sx * 0.62, 0.05 + (up - 0.04) / 2, -0.08]), G.box(0.16, 0.012, 0.16, steel, [sx * 0.62, 0.056, -0.08], 0));
    root.add(hush(screws([[sx * 0.62 - 0.055, 0.062, -0.025], [sx * 0.62 + 0.055, 0.062, -0.025], [sx * 0.62 - 0.055, 0.062, -0.135], [sx * 0.62 + 0.055, 0.062, -0.135]], 0.011, 'y')));
    for (const sz of [-1, 1]) root.add(hush(stub(0.04, 0.012, M.rubber(), [sx * 0.88, -0.006, -0.06 + sz * 0.2], 10)));
  }

  // a low table in front: a top on an apron, four tapered legs, and a felt mat under each pair
  const top = 0.4, TZ = 0.9, oak = M.wood(0x7a5634), oakUp = M.wood(0x7a5634, 1);
  root.add(G.rbox(1.64, 0.035, 0.5, 0.012, oak, [0, top - 0.0175, TZ]));
  root.add(G.box(1.48, 0.07, 0.02, oak, [0, top - 0.07, TZ + 0.2]), G.box(1.48, 0.07, 0.02, oak, [0, top - 0.07, TZ - 0.2]));
  for (const sx of [-1, 1]) root.add(G.box(0.02, 0.07, 0.38, oak, [sx * 0.74, top - 0.07, TZ]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.cyl(0.018, top - 0.035, oakUp, [sx * 0.74, (top - 0.035) / 2, TZ + sz * 0.2], 12, 0.026));
  const felt = M.cloth(0x2b3136);
  for (const x of [-0.5, 0, 0.5]) root.add(G.slab(0.42, 0.3, 0.02, 0.004, felt, [x, top + 0.002, TZ]).rotateX(-T));

  /** A rounded rectangle as a path, centred on (cx, cy). */
  const rr = <P extends THREE.Path>(p: P, cx: number, cy: number, w: number, h: number, r: number): P => {
    const x = cx - w / 2, yy = cy - h / 2;
    p.moveTo(x + r, yy); p.lineTo(x + w - r, yy); p.absarc(x + w - r, yy + r, r, -T, 0, false); p.lineTo(x + w, yy + h - r); p.absarc(x + w - r, yy + h - r, r, 0, T, false);
    p.lineTo(x + r, yy + h); p.absarc(x + r, yy + h - r, r, T, Math.PI, false); p.lineTo(x, yy + r); p.absarc(x + r, yy + r, r, Math.PI, 1.5 * Math.PI, false);
    return p;
  };
  // sizes of a real pair, in metres; each pair is shown at one and three quarter times life, so it reads from a seat
  const FW = 0.146, FH = 0.05, LW = 0.052, LH = 0.036, LX = 0.035, LR = 0.012, ARM = 0.135, BIG = 1.75;
  /**
   * One pair standing on its open arms on the table, facing the room: a front with two lens openings and a bridge,
   * hinges at the corners, arms running back with their ends bent down. Returns the two lens meshes.
   */
  const pair = (x: number, frame: THREE.Material, t: number, left: THREE.Material, right: THREE.Material, extra?: (g: THREE.Group) => void): [THREE.Mesh, THREE.Mesh] => {
    const g = G.group();
    const front = rr(new THREE.Shape(), 0, 0, FW, FH, 0.016);
    for (const sx of [-1, 1]) front.holes.push(rr(new THREE.Path(), sx * LX, 0.002, LW, LH, LR));
    g.add(G.extruded(front, t, frame, [0, 0, 0], Math.min(0.0012, t * 0.3)));
    const lensGeo = new THREE.ShapeGeometry(rr(new THREE.Shape(), 0, 0, LW + 0.002, LH + 0.002, LR), 8);
    const l = new THREE.Mesh(lensGeo, left), r = new THREE.Mesh(lensGeo, right);
    l.position.set(-LX, 0.002, 0); r.position.set(LX, 0.002, 0);
    g.add(l, r);
    for (const sx of [-1, 1]) {
      const hx = sx * (FW / 2 - 0.003);
      g.add(G.box(0.004, 0.009, ARM, frame, [hx, 0.012, -ARM / 2 - t / 2], 0), G.box(0.004, 0.009, 0.04, frame, [hx, -0.004, -ARM - t / 2 - 0.012], 0).rotateX(-0.9));
      g.add(hush(stub(0.0022, 0.012, M.steel(), [hx, 0.012, -t / 2 - 0.002], 8)));
    }
    extra?.(g);
    // the arms rest on the table and the lower rim of the front just touches it, so the pair leans back a little
    g.rotation.x = -0.08; g.scale.setScalar(BIG);
    g.position.set(x, top + 0.004 + (FH / 2) * BIG, TZ + 0.08);
    root.add(g);
    return [l, r];
  };
  const lens = (color: number, opacity = 0.75) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, transparent: true, opacity, roughness: 0.15, side: THREE.DoubleSide });
  // colour: red for the left eye, cyan for the right, in a frame of printed card
  const colour = pair(-0.5, M.paper(0xf1ede2), 0.0016, lens(0xff2a2a), lens(0x22e2ff));
  // time: dark lenses that clear and close in turn, in a heavier plastic frame with a receiver on the bridge and a battery in one arm
  const shutL = lens(0x111316, 0.92), shutR = lens(0x111316, 0.92);
  const shutter = pair(0, M.plastic(0x202326, 0.4), 0.007, shutL, shutR, (g) => {
    g.add(G.rbox(0.03, 0.012, 0.012, 0.004, M.plastic(0x202326, 0.4), [0, FH / 2 + 0.001, -0.002]), G.box(0.016, 0.006, 0.002, M.plastic(0x3a0a0e, 0.1), [0, FH / 2 + 0.002, 0.0045], 0));
    g.add(G.rbox(0.008, 0.016, 0.04, 0.003, M.plastic(0x202326, 0.4), [-(FW / 2 - 0.003), 0.012, -0.03]));
  });
  // polarised: grey lenses whose filters stand at right angles, drawn as fine lines that cross
  const lines = (deg: number) => {
    const p = screen(64, 64), c = p.ctx;
    c.fillStyle = '#7d8286'; c.fillRect(0, 0, 64, 64); c.strokeStyle = 'rgba(30,32,36,.55)'; c.lineWidth = 2;
    c.translate(32, 32); c.rotate((deg * Math.PI) / 180);
    for (let i = -64; i < 64; i += 6) { c.beginPath(); c.moveTo(i, -64); c.lineTo(i, 64); c.stroke(); }
    p.tex.needsUpdate = true;
    p.tex.repeat.set(1 / (LW + 0.002), 1 / (LH + 0.002));
    return new THREE.MeshStandardMaterial({ map: p.tex, transparent: true, opacity: 0.8, roughness: 0.2, side: THREE.DoubleSide });
  };
  const polar = pair(0.5, M.plastic(0x2b2f33, 0.5), 0.004, lines(45), lines(-45));
  const pairs = [colour, shutter, polar];
  fuse(root, [...pairs.flat()]);

  /** A cube in perspective, as one eye sees it: shifted left or right. */
  const cube = (c: CanvasRenderingContext2D, dx: number, stroke: string) => {
    c.strokeStyle = stroke; c.lineWidth = 9; c.lineJoin = 'round';
    const x = 256 + dx, yy = 170, a = 70, d = 34;
    c.strokeRect(x - a, yy - a + d / 2, a * 2, a * 2);
    c.strokeRect(x - a + d, yy - a - d / 2, a * 2, a * 2);
    c.beginPath();
    for (const [px, py] of [[-a, -a + d / 2], [a, -a + d / 2], [-a, a + d / 2], [a, a + d / 2]]) { c.moveTo(x + px, yy + py); c.lineTo(x + px + d, yy + py - d); }
    c.stroke();
  };
  let shown = '';
  return {
    root, views: {
      front: { at: [0, 1.05, 3.2], to: [0, 0.95, 0], fov: 34, play: 0.2 },
      table: { at: [0, 1.05, 2.3], to: [0, 0.42, 0.9], fov: 52, play: 0.15 },
    },
    inDark: 'glows', glow: 0xbfe8ff, view: [12, 6], surface: s.canvas,
    update: (env: Env) => {
      const at = env.t % 24, act = Math.floor(at / 8), flip = Math.floor(env.t * 6) % 2;
      // the pair in use stands out, the others sit back
      pairs.forEach(([l, r], i) => { for (const m of [l, r]) ((m.material as THREE.MeshStandardMaterial).emissiveIntensity = i === act ? 0.6 : 0.05); });
      // the shutters close in turn while their act plays, and stay dark otherwise
      shutL.opacity = act === 1 && flip === 0 ? 0.2 : 0.92;
      shutR.opacity = act === 1 && flip === 1 ? 0.2 : 0.92;
      sync.emissiveIntensity = act === 1 ? 0.9 + 0.5 * flip : 0.08;
      const key = `${act}${act === 1 ? flip : ''}`;
      if (key === shown) return;
      shown = key;
      const c = s.ctx;
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#f2f0ea'; c.fillRect(0, 0, 512, 320);
      if (act === 0) {
        // both pictures at once, one in red, one in cyan: through the glasses each eye sees only its own
        c.globalCompositeOperation = 'multiply';
        cube(c, -14, '#ff3b30'); cube(c, 14, '#14d8ff');
      } else if (act === 1) {
        // one picture at a time, many times a second: first the left eye's, then the right eye's
        cube(c, flip === 0 ? -14 : 14, '#24282c');
      } else {
        // both pictures at once in grey, their light polarised at right angles: without glasses they look doubled
        c.globalAlpha = 0.6; cube(c, -14, '#24282c'); cube(c, 14, '#24282c'); c.globalAlpha = 1;
      }
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#24282c'; c.font = '22px "PT Mono", monospace'; c.textAlign = 'center';
      c.fillText(['red + cyan', 'left / right', '45° / 135°'][act], 256, 300);
      s.tex.needsUpdate = true;
    },
  };
}
