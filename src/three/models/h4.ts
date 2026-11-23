import { G, M, Swarm, pace, beam, halo, screen, spline, voxels, THREE, type Built, type P2, type V3 } from '../kit';
import { breadboard, lens, screws, toggle, vents } from '../parts';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { bigTime, clockStrokes, dots, hsl, now, segClock } from '../../sims/draw';

// ---------- the bench hardware this hall shares ----------

type Axis = 'x' | 'y' | 'z';
const UP = new THREE.Vector3(0, 1, 0);
const lay = (geo: THREE.BufferGeometry, axis: Axis): THREE.BufferGeometry => (axis === 'x' ? geo.rotateZ(-Math.PI / 2) : axis === 'z' ? geo.rotateX(Math.PI / 2) : geo);

/**
 * A plain cylinder along an axis, without the eased edges of the kit: for hardware too small for them to show.
 * `rTop` is the radius of the end towards the positive side.
 */
function can(r: number, h: number, mat: THREE.Material, p: V3, seg = 10, axis: Axis = 'y', rTop = r): THREE.Mesh {
  const m = new THREE.Mesh(lay(new THREE.CylinderGeometry(rTop, r, h, seg), axis), mat);
  m.position.set(p[0], p[1], p[2]);
  return m;
}

/** A part off the lathe, by its profile from the bottom up, with its corners left crisp. */
function turned(pts: [number, number][], mat: THREE.Material, seg = 18, axis: Axis = 'y'): THREE.Mesh {
  return new THREE.Mesh(lay(toCreasedNormals(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), 0.7), axis), mat);
}

/** A lead or a hose through the points: a thin tube, frugal with triangles. */
function lead(pts: V3[], r: number, mat: THREE.Material, seg = 16, radial = 5): THREE.Mesh {
  const path = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.5);
  return new THREE.Mesh(new THREE.TubeGeometry(path, seg, r, radial, false), mat);
}

/**
 * Everything that never moves, baked into one mesh for each material. A frame draws a model up to three times
 * (the shadow, the mirror of the floor, the picture), so a bench of small hardware made of separate meshes costs
 * hundreds of draw calls, and welded it costs a handful. The parts must already stand where they belong. Only
 * meshes survive: lines, points and sprites are added to the model directly.
 */
function weld(...parts: THREE.Object3D[]): THREE.Group {
  const from = G.group(...parts), by = new Map<THREE.Material, THREE.BufferGeometry[]>(), m4 = new THREE.Matrix4();
  from.updateMatrixWorld(true);
  from.traverse((o) => {
    const m = o as THREE.Mesh, many = o as THREE.InstancedMesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    const list = by.get(m.material) ?? [];
    by.set(m.material, list);
    for (let i = 0, n = many.isInstancedMesh ? many.count : 1; i < n; i++) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      if (many.isInstancedMesh) { many.getMatrixAt(i, m4); g.applyMatrix4(m4.premultiply(m.matrixWorld)); } else g.applyMatrix4(m.matrixWorld);
      list.push(g);
    }
  });
  const out = G.group();
  for (const [mat, geos] of by) {
    // parts of one material may carry different extras (a colour for each corner, say): keep what all of them have
    const keep = Object.keys(geos[0].attributes).filter((k) => geos.every((g) => g.attributes[k]));
    for (const g of geos) for (const k of Object.keys(g.attributes)) if (!keep.includes(k)) g.deleteAttribute(k);
    out.add(new THREE.Mesh(mergeGeometries(geos, false), mat));
  }
  return out;
}

/** Give every corner of a shape one colour, for a material that takes its colour from the corners. */
function dyed<T extends THREE.BufferGeometry>(geo: T, hex: number, gain = 1): T {
  const n = geo.attributes.position.count, col = new Float32Array(n * 3), c = new THREE.Color(hex).multiplyScalar(gain);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

/** The stuff of small things that shine by themselves, each in the colour its shape was dyed: lamps, apertures, pilot lights. */
/** A stock part shown smaller than it comes, scaled about its own base. */
const small = <T extends THREE.Object3D>(o: T, k: number): T => { o.scale.setScalar(k); return o; };
const shining = (): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({ vertexColors: true });

/** A post in its holder on a slotted base, the way a part stands on an optical table. `top` is where the part sits. */
function stand(top: V3, floor: number, steel: THREE.Material, dark: THREE.Material, brass: THREE.Material, turn = 0): THREE.Group {
  const [x, ty, z] = top, hold = Math.min(0.15, (ty - floor) * 0.62);
  const g = G.group(
    G.box(0.16, 0.016, 0.075, dark, [0.035, floor + 0.008, 0], 0),
    can(0.015, 0.012, steel, [0.085, floor + 0.022, 0], 8),
    can(0.036, hold, dark, [0, floor + 0.016 + hold / 2, 0], 14),
    can(0.021, ty - floor - 0.016 - hold, steel, [0, (ty + floor + 0.016 + hold) / 2, 0], 10),
    can(0.011, 0.034, brass, [0, floor + hold - 0.012, 0.05], 8, 'z'),
  );
  g.position.set(x, 0, z); g.rotation.y = turn;
  return g;
}

const SHEATH = 0.3;
const sheath = (vertexColors: boolean, color = 0xffffff): THREE.MeshBasicMaterial =>
  new THREE.MeshBasicMaterial({ color, vertexColors, transparent: true, opacity: SHEATH, blending: THREE.AdditiveBlending, depthWrite: false });

/**
 * Beams that stay where they are, each in its own colour. A beam is the hair line of the kit for its core, and
 * round it a thin tube of added light for its body, so that it still reads when the line is a hair on a phone.
 */
function rays(list: [V3, V3, number][], r = 0.006, opacity = 0.9): THREE.Group {
  const pos = new Float32Array(list.length * 6), col = new Float32Array(list.length * 6), c = new THREE.Color();
  const a = new THREE.Vector3(), d = new THREE.Vector3(), q = new THREE.Quaternion();
  const tubes = list.map(([from, to, hex], i) => {
    pos.set(from, i * 6); pos.set(to, i * 6 + 3);
    c.set(hex); col.set([c.r, c.g, c.b, c.r, c.g, c.b], i * 6);
    a.set(from[0], from[1], from[2]); d.set(to[0], to[1], to[2]).sub(a);
    const len = d.length(), tube = dyed(new THREE.CylinderGeometry(r, r, len, 6, 1, true).toNonIndexed(), hex);
    return tube.applyQuaternion(q.setFromUnitVectors(UP, d.divideScalar(len))).translate(a.x + d.x * len / 2, a.y + d.y * len / 2, a.z + d.z * len / 2);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  return G.group(lines, new THREE.Mesh(mergeGeometries(tubes, false), sheath(true)));
}

/** One beam that is aimed again on every frame: the line of the kit inside its tube of added light. */
function ray(color: number, from: V3, to: V3, r = 0.006, opacity = 0.9): { obj: THREE.Group; aim: (a: V3, b: V3) => void } {
  const core = beam(color, opacity), tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 6, 1, true), sheath(false, color));
  tube.frustumCulled = false;
  const p = new THREE.Vector3(), d = new THREE.Vector3();
  const aim = (a: V3, b: V3): void => {
    core.aim(a, b);
    p.set(a[0], a[1], a[2]); d.set(b[0], b[1], b[2]).sub(p);
    const len = Math.max(1e-6, d.length());
    tube.position.copy(p).addScaledVector(d, 0.5);
    tube.quaternion.setFromUnitVectors(UP, d.divideScalar(len));
    tube.scale.set(1, len, 1);
  };
  aim(from, to);
  return { obj: G.group(core.line, tube), aim };
}

/** A machined block with its edges broken by one cut: lighter than the rounded box of the kit, for parts that come by the dozen. */
function chunk(w: number, h: number, d: number, mat: THREE.Material, p: V3, r = 0.012): THREE.Mesh {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(r, Math.min(w, h, d) * 0.3)), mat);
  m.position.set(p[0], p[1], p[2]);
  return m;
}

/** A flat frame with a square-cornered window and eased edges, facing +z: the carrier of a sheet, a seal, a bezel. */
function frame(w: number, h: number, ow: number, oh: number, t: number, mat: THREE.Material, p: V3, r = 0.02, b = 0.005): THREE.Mesh {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2, q = Math.PI / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -q, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, q, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, q, 2 * q, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, 2 * q, 3 * q, false);
  s.holes.push(new THREE.Path([[-ow / 2, -oh / 2], [-ow / 2, oh / 2], [ow / 2, oh / 2], [ow / 2, -oh / 2]].map(([a, c]) => new THREE.Vector2(a, c))));
  const geo = new THREE.ExtrudeGeometry(s, { depth: t - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 1, curveSegments: 3 });
  geo.translate(0, 0, -(t - 2 * b) / 2);
  const m = new THREE.Mesh(toCreasedNormals(geo, 0.7), mat);
  m.position.set(p[0], p[1], p[2]);
  return m;
}

/** The ground edge of a sheet of glass: the green you see when you look into it sideways. */
const groundEdge = (): THREE.MeshPhysicalMaterial => new THREE.MeshPhysicalMaterial({ color: 0x3f7f6e, roughness: 0.3, transparent: true, opacity: 0.6, depthWrite: false });

/**
 * A sheet of glass facing +z, as two meshes that weld with others like them: its face and its ground edges.
 * The pane of the kit is one mesh with six surfaces, and each surface is a draw call of its own.
 */
function sheet(w: number, h: number, t: number, face: THREE.Material, edge: THREE.Material, p: V3): THREE.Group {
  const rim = new THREE.BoxGeometry(w, h, t).toNonIndexed();
  for (const k of ['position', 'normal', 'uv']) { const a = rim.attributes[k]; rim.setAttribute(k, new THREE.BufferAttribute((a.array as Float32Array).slice(0, 24 * a.itemSize), a.itemSize)); }
  const g = G.group(new THREE.Mesh(new THREE.PlaneGeometry(w, h), face), new THREE.Mesh(rim, edge));
  g.position.set(p[0], p[1], p[2]);
  return g;
}

/** Liquid crystal display, pulled apart on a rail: lamp, polariser, the crystal between glass, colour filter, second polariser. */
export function lcd(): Built {
  const root = G.group();
  const W = 1.8, H = 1.15, y = 0.86, TOP = y + H / 2, RAIL = y - H / 2 - 0.16;
  const steel = M.steel(), dark = M.dark(), brass = M.brass(), rubber = M.rubber(), flex = M.plastic(0xc87b2a, 0.5), glass = M.glass(0xb9c9c6, 0.08), edge = groundEdge();
  const fixed: THREE.Object3D[] = [];
  const film = (draw: (c: CanvasRenderingContext2D) => void, opacity: number, k = 1) => {
    const s = screen(256 * k, 160 * k); s.ctx.scale(k, k); draw(s.ctx); s.tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: s.tex, transparent: true, opacity, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false });
  };
  const lines = (vertical: boolean, col: string) => (c: CanvasRenderingContext2D) => {
    c.fillStyle = '#6f7782'; c.fillRect(0, 0, 256, 160); c.fillStyle = col;
    if (vertical) for (let x = 0; x < 256; x += 7) c.fillRect(x, 0, 1.5, 160);
    else for (let yy = 0; yy < 160; yy += 7) c.fillRect(0, yy, 256, 1.5);
  };
  // the colour filter: stripes of red, green and blue dye, parted into cells by a black matrix
  const stripes = (c: CanvasRenderingContext2D) => {
    c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, 256, 160);
    ['#ff3b30', '#34d058', '#2f6bff'].forEach((col, k) => { c.fillStyle = col; for (let x = k * 4; x < 256; x += 12) c.fillRect(x, 0, 3.4, 160); });
    c.fillStyle = '#0a0a0a'; for (let yy = 0; yy < 160; yy += 12) c.fillRect(0, yy - 0.75, 256, 1.5);
  };
  const cell = screen(384, 240), final = screen(384, 240);
  const cellMat = new THREE.MeshStandardMaterial({ map: cell.tex, transparent: true, opacity: 0.7, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const finalMat = M.lit(final, 1.3, 0.6); finalMat.transparent = true; finalMat.opacity = 0.95; finalMat.side = THREE.DoubleSide;
  // every layer rides in its own carrier on two rails, in the order the light meets them
  const Z = [-0.86, -0.44, -0.04, 0.4, 0.84];
  for (const z of Z) {
    fixed.push(frame(W + 0.12, H + 0.12, W, H, 0.03, steel, [0, y, z]));
    for (const sx of [-1, 1]) {
      // a saddle on each rail with its clamp screw, and black screws at the corners of the frame
      fixed.push(chunk(0.1, 0.16, 0.08, dark, [sx * 0.7, y - H / 2 - 0.12, z]), can(0.017, 0.034, brass, [sx * 0.766, RAIL, z], 8, 'x'));
      for (const sy of [-1, 1]) fixed.push(can(0.011, 0.006, rubber, [sx * (W / 2 + 0.03), y + sy * (H / 2 + 0.03), z + 0.0165], 8, 'z'));
    }
  }
  for (const x of [-0.7, 0.7]) {
    fixed.push(G.rod([x, RAIL, -1.0], [x, RAIL, 0.98], 0.022, steel, 14));
    for (const z of [-0.96, 0.94]) fixed.push(chunk(0.1, 0.14, 0.09, dark, [x, 0.12, z]), can(0.014, 0.01, steel, [x, 0.194, z], 8));
  }
  fixed.push(G.box(W + 0.3, 0.05, 2.16, dark, [0, 0.025, 0], 0.012));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(can(0.05, 0.03, rubber, [sx * 0.93, -0.015, sz * 0.96], 10));

  // 1, the lamp: a pressed tray with ribs across its back, and a diffuser over rows of small lamps
  const spots = screen(160, 100);
  spots.ctx.fillStyle = '#dcdcdc'; spots.ctx.fillRect(0, 0, 160, 100);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) {
    const cx = 8 + i * 16, cy = 10 + j * 16, g = spots.ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    spots.ctx.fillStyle = g; spots.ctx.fillRect(cx - 9, cy - 9, 18, 18);
  }
  spots.tex.needsUpdate = true;
  const lampMat = M.glow(0xf4f8ff, 1.0); lampMat.emissiveMap = spots.tex;
  const BACK = Z[0] - 0.09;
  fixed.push(G.box(W + 0.12, H + 0.12, 0.08, dark, [0, y, Z[0] - 0.05], 0.014), G.box(0.26, 0.11, 0.004, steel, [0.58, y - 0.4, BACK - 0.002], 0), can(0.022, 0.03, rubber, [-0.45, y - 0.44, BACK - 0.012], 8, 'z'));
  for (let k = -1; k < 2; k++) fixed.push(G.box(1.56, 0.04, 0.012, dark, [0, y + k * 0.34, BACK - 0.006], 0));
  for (const sx of [-1, 0, 1]) for (const sy of [-1, 1]) fixed.push(can(0.013, 0.006, steel, [sx * 0.9, y + sy * 0.57, BACK - 0.003], 8, 'z'));
  // its lead goes down into the base, and the cord of the base leaves at the back
  fixed.push(lead([[-0.45, y - 0.44, BACK - 0.03], [-0.45, y - 0.5, BACK - 0.07], [-0.45, 0.2, BACK - 0.09], [-0.45, 0.075, BACK - 0.085]], 0.011, rubber, 10), chunk(0.07, 0.03, 0.06, rubber, [-0.45, 0.065, BACK - 0.085], 0.006));
  fixed.push(chunk(0.1, 0.034, 0.012, rubber, [0.45, 0.027, -1.084], 0.004), lead([[0.45, 0.027, -1.088], [0.45, 0.02, -1.108], [0.45, -0.012, -1.104], [0.46, -0.02, -1.04], [0.5, -0.02, -0.95]], 0.01, rubber, 10));
  // 2, the first polariser, with the mark of its axis on the carrier
  fixed.push(G.box(0.09, 0.05, 0.004, rubber, [0, TOP + 0.03, Z[1] + 0.017], 0), G.box(0.008, 0.036, 0.002, steel, [0, TOP + 0.03, Z[1] + 0.02], 0));
  // 3, the liquid crystal: two sheets of glass with a seal round the edge and the crystal in the few thousandths of a
  // millimetre between them. This is the layer the voltage reaches: flex tabs with a driver chip each, a strip of board, a flat cable
  // (glass is drawn in order of distance, so the glass of each layer stays a mesh of its own)
  const cellGlass = weld(sheet(W, H, 0.016, glass, edge, [0, y, Z[2] - 0.014]), sheet(W, H, 0.016, glass, edge, [0, y, Z[2] + 0.014]));
  fixed.push(frame(W, H, W - 0.05, H - 0.05, 0.012, rubber, [0, y, Z[2]], 0.004, 0));
  const pcb = M.pcb();
  fixed.push(G.box(1.62, 0.07, 0.012, pcb, [0, TOP + 0.1, Z[2] - 0.012], 0), G.box(0.1, 0.03, 0.022, rubber, [0.72, TOP + 0.1, Z[2] - 0.029], 0), G.box(0.09, 0.03, 0.03, rubber, [0.975, 0.065, Z[2] - 0.03], 0));
  for (let k = 0; k < 6; k++) fixed.push(G.box(0.17, 0.11, 0.003, flex, [(k - 2.5) * 0.24 - 0.12, TOP + 0.04, Z[2] - 0.02], 0), G.box(0.1, 0.014, 0.005, rubber, [(k - 2.5) * 0.24 - 0.12, TOP + 0.073, Z[2] - 0.024], 0));
  const ribbon = M.plastic(0xdcdad2, 0.6);
  fixed.push(G.box(0.25, 0.036, 0.002, ribbon, [0.868, TOP + 0.1, Z[2] - 0.03], 0), G.box(0.036, TOP + 0.118 - 0.08, 0.002, ribbon, [0.975, (TOP + 0.118 + 0.08) / 2, Z[2] - 0.03], 0));
  // 4, the colour filter on its own sheet of glass
  const filterGlass = sheet(W, H, 0.02, glass, edge, [0, y, Z[3] - 0.012]);
  // 5, the second polariser, crosswise to the first: its mark lies flat
  fixed.push(G.box(0.09, 0.05, 0.004, rubber, [0, TOP + 0.03, Z[4] + 0.017], 0), G.box(0.06, 0.008, 0.002, steel, [0, TOP + 0.03, Z[4] + 0.02], 0));
  // the grey map is laid on the front of the cell, where the glare of the glass does not hide it
  root.add(weld(...fixed), cellGlass, filterGlass, G.plane(W, H, lampMat, [0, y, Z[0] + 0.004]), G.plane(W, H, film(lines(true, '#4d545d'), 0.5), [0, y, Z[1]]), G.plane(W, H, cellMat, [0, y, Z[2] + 0.0225]), G.plane(W, H, film(stripes, 0.55, 2), [0, y, Z[3]]), G.plane(W, H, finalMat, [0, y, Z[4]]));
  let stamp = -1;
  return {
    root, views: { front: { at: [0, 1.1, 4.8], to: [0, 0.86, 0], fov: 34, play: 0.2 }, layers: { at: [1.5, 1.2, 0.3], to: [0.25, 0.86, -0.1], fov: 32 } }, inDark: 'glows', glow: 0xdde8ff, view: [38, 12], surface: final.canvas,
    update: ({ t }) => {
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      // the crystal layer only sets how much each cell twists the light: a grey map with no colour in it
      cell.ctx.fillStyle = '#c9ced6'; cell.ctx.fillRect(0, 0, 384, 240);
      bigTime(cell.ctx, 384, 240, n.hhmmss, '#3b4048', 800, 0.5);
      cell.tex.needsUpdate = true;
      const c = final.ctx;
      const g = c.createLinearGradient(0, 0, 384, 240); g.addColorStop(0, hsl(205 + t, 60, 30)); g.addColorStop(1, hsl(260 + t, 55, 22));
      c.fillStyle = g; c.fillRect(0, 0, 384, 240);
      bigTime(c, 384, 240, n.hhmmss, '#ffe9a8', 800, 0.5);
      final.tex.needsUpdate = true;
    },
  };
}

/** Digital micromirror device: the chip, and a corner of its mirror field enlarged. Each mirror tips one way for light, the other for dark. */
export function dmd(): Built {
  const root = G.group();
  const brass = M.brass(), black = M.black(), steel = M.steel();
  const fixed: THREE.Object3D[] = [];
  const flat = <T extends THREE.Object3D>(o: T): T => { o.rotation.x = -Math.PI / 2; return o; };
  // the chip in its ceramic carrier: gold lands along two edges, a seal ring with a lip, and the die under a thick window.
  // A dark border on the glass leaves only the mirror field in view
  fixed.push(G.rbox(1.7, 0.13, 1.2, 0.02, M.ceramic(), [0, 0.065, 0]), G.box(1.0, 0.03, 0.68, black, [0, 0.145, 0], 0));
  for (let i = 0; i < 26; i++) for (const s of [-1, 1]) fixed.push(G.box(0.032, 0.012, 0.07, brass, [(i - 12.5) * 0.058, 0.132, s * 0.55], 0));
  fixed.push(flat(frame(1.2, 0.84, 1.02, 0.7, 0.07, brass, [0, 0.165, 0], 0.03, 0.006)), flat(frame(1.2, 0.84, 0.97, 0.65, 0.014, brass, [0, 0.207, 0], 0.03, 0.004)), flat(frame(1.02, 0.7, 0.89, 0.55, 0.003, black, [0, 0.176, 0], 0.004, 0)));
  // the mark of the first contact, and two holes that locate the chip in its socket
  fixed.push(can(0.022, 0.003, brass, [-0.79, 0.1315, -0.52], 12), can(0.032, 0.003, black, [-0.73, 0.1315, 0], 14), can(0.032, 0.003, black, [0.73, 0.1315, 0], 14));
  // hundreds of thousands of mirrors, too small to see one by one: together they look like a mirror with a sheen of colour
  const field = new THREE.MeshPhysicalMaterial({ color: 0xdfe4e8, metalness: 1, roughness: 0.14, iridescence: 0.7, iridescenceIOR: 1.35 });
  fixed.push(G.box(0.86, 0.004, 0.52, field, [0, 0.162, 0], 0));
  const win = flat(sheet(1.02, 0.7, 0.03, M.glass(0xb9c9c6, 0.08), groundEdge(), [0, 0.19, 0]));

  // a few mirrors enlarged several thousand times. Each stands by a hollow post, which shows as a pit in its middle, on a
  // yoke. The yoke hangs on a thin hinge between two posts at opposite corners, and the hinge is the diagonal the mirror rocks
  // on. Under the other two corners lie the two electrodes that pull it one way or the other
  const COLS = 13, ROWS = 7, P = 0.13, N = COLS * ROWS, LIFT = 0.032, FLOOR = -0.03;
  const rotor = mergeGeometries([
    dyed(new RoundedBoxGeometry(0.118, 0.008, 0.118, 1, 0.003).toNonIndexed().translate(0, LIFT, 0), 0xffffff),
    dyed(new THREE.CircleGeometry(0.009, 8).rotateX(-Math.PI / 2).translate(0, LIFT + 0.0045, 0).toNonIndexed(), 0x1c1e21),
    dyed(new THREE.BoxGeometry(0.018, LIFT, 0.018).translate(0, LIFT / 2, 0).toNonIndexed(), 0x7c8288),
    dyed(new THREE.BoxGeometry(0.062, 0.004, 0.062).rotateY(Math.PI / 4).toNonIndexed(), 0x7c8288),
  ], false);
  const silver = M.chrome(); silver.vertexColors = true;
  const mirrors = new Swarm(rotor, silver, N);
  const under = mergeGeometries([
    dyed(new THREE.BoxGeometry(0.014, -FLOOR, 0.014).translate(0.056, FLOOR / 2, 0.056).toNonIndexed(), 0x9aa0a6),
    dyed(new THREE.BoxGeometry(0.014, -FLOOR, 0.014).translate(-0.056, FLOOR / 2, -0.056).toNonIndexed(), 0x9aa0a6),
    dyed(new THREE.BoxGeometry(0.158, 0.003, 0.007).rotateY(-Math.PI / 4).toNonIndexed(), 0x9aa0a6),
    dyed(new THREE.BoxGeometry(0.05, 0.004, 0.05).translate(0.034, FLOOR + 0.002, -0.034).toNonIndexed(), 0xb08d4a),
    dyed(new THREE.BoxGeometry(0.05, 0.004, 0.05).translate(-0.034, FLOOR + 0.002, 0.034).toNonIndexed(), 0xb08d4a),
  ], false);
  const metal = M.steel(); metal.color.set(0xffffff); metal.vertexColors = true;
  const works = new Swarm(under, metal, N);
  const DIAG = new THREE.Vector3(1, 0, 1).normalize();
  const tilt = new Float32Array(N);
  const at = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, (Math.floor(i / COLS) - (ROWS - 1) / 2) * P];
  for (let i = 0; i < N; i++) { const [x, z] = at(i); works.put(i, x, 0, z); mirrors.spin(i, x, 0, z, DIAG, 0); mirrors.tint(i, 1, 1, 1); }
  works.done(); mirrors.done();
  // the slice of silicon they stand on, with the line that carries the common voltage along every row
  const slice = G.group(G.box(COLS * P + 0.08, 0.05, ROWS * P + 0.08, M.plastic(0x23262b, 0.4), [0, FLOOR - 0.025, 0], 0.006));
  for (let r = 0; r < ROWS; r++) slice.add(G.box(COLS * P + 0.02, 0.002, 0.012, brass, [0, FLOOR + 0.001, (r - (ROWS - 1) / 2) * P], 0));
  const lifted = G.group(mirrors.mesh, works.mesh, weld(slice));
  lifted.position.set(0, 1.08, 0.05); lifted.rotation.x = 0.62;
  // the patch is held over the spot it was taken from: four rods spring from a small ring on the window
  const a = COLS * P / 2, b = ROWS * P / 2;
  lifted.updateMatrixWorld(true);
  fixed.push(turned([[0.016, 0.205], [0.026, 0.205], [0.026, 0.213], [0.016, 0.213]], brass, 14));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const top = new THREE.Vector3(sx * a, FLOOR - 0.05, sz * b).applyMatrix4(lifted.matrixWorld);
    fixed.push(G.rod([sx * 0.016, 0.21, sz * 0.016], [top.x, top.y, top.z], 0.005, steel, 6));
  }
  root.add(weld(...fixed), win, lifted);
  const eye = new THREE.Vector3();
  let first = true;
  const pc = pace();
  return {
    root, views: { chip: { at: [0.65, 0.75, 1.3], to: [0, 0.25, 0], fov: 32, play: 0.1 }, mirrors: { at: [0.6, 1.6, 1.1], to: [0, 1.1, 0.05], fov: 30 } }, inDark: 'vanishes', view: [24, 16],
    update: (env) => { const { camera } = env; pc.at(env.t);
      const d = dots(now().hhmmss.slice(6));
      // from which side the patch is looked at, across its hinges. A mirror is bright when it tips towards the eye: from the far
      // side it is the other mirrors that tip that way, and the numeral turns into its negative
      lifted.worldToLocal(eye.setFromMatrixPosition(camera.matrixWorld)).normalize();
      const side = THREE.MathUtils.smoothstep((eye.z - eye.x) * Math.SQRT1_2, -0.62, -0.22);
      for (let i = 0; i < N; i++) {
        const on = d.on((i % COLS) - 1, Math.floor(i / COLS));
        tilt[i] += ((on ? 0.21 : -0.21) - tilt[i]) * (first ? 1 : pc.k(0.3));
        const [x, z] = at(i);
        mirrors.spin(i, x, 0, z, DIAG, tilt[i]);
        const v = 0.3 + 0.7 * (on ? side : 1 - side);
        mirrors.tint(i, v, v, v * 1.08);
      }
      first = false;
      mirrors.mesh.instanceMatrix.needsUpdate = true;
      if (mirrors.mesh.instanceColor) mirrors.mesh.instanceColor.needsUpdate = true;
    },
  };
}

/** Liquid crystal on silicon: a mirror-backed liquid crystal chip under a splitter cube, a lamp beside it, and above it a mirror that turns the picture into the lens. */
export function lcos(): Built {
  const root = G.group();
  const s = screen(320, 240);
  const B = 0.08, AX = 0.62, CX = -0.1, MY = 1.14;
  const steel = M.steel(1), dark = M.dark(), brass = M.brass(), rubber = M.rubber(), chrome = M.chrome(), pcb = M.pcb(), flex = M.plastic(0xc87b2a, 0.5), lamp = shining();
  const fixed: THREE.Object3D[] = [];
  const flat = <T extends THREE.Object3D>(o: T): T => { o.rotation.x = -Math.PI / 2; return o; };
  const base = breadboard(2.6, 1.3, B);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(can(0.06, 0.06, rubber, [sx * 1.204, -0.03, sz * 0.554], 12, 'y', 0.051));
  // the chip: a silicon die whose top is both the mirror and the pixel electrodes, under a cover glass in a ceramic carrier.
  // Gold lands along two sides, a board under it, and a flex that brings the picture from the driver board
  fixed.push(G.box(0.9, 0.03, 0.7, pcb, [CX, B + 0.015, 0], 0), G.rbox(0.62, 0.06, 0.48, 0.012, M.ceramic(), [CX, B + 0.06, 0]), flat(frame(0.6, 0.46, 0.54, 0.4, 0.003, rubber, [CX, B + 0.0915, 0], 0.004, 0)));
  for (let i = 0; i < 14; i++) for (const sz of [-1, 1]) fixed.push(G.box(0.02, 0.004, 0.03, brass, [CX + (i - 6.5) * 0.04, B + 0.03, sz * 0.275], 0));
  fixed.push(G.box(0.3, 0.028, 0.05, rubber, [CX, B + 0.044, 0.318], 0), G.box(0.26, 0.004, 0.09, flex, [CX, B + 0.002, 0.395], 0), G.box(0.85, 0.004, 0.1, flex, [0.195, B + 0.002, 0.49], 0));
  for (const [x, z] of [[-0.42, -0.27], [-0.3, -0.29], [0.2, -0.29], [-0.44, 0.1]]) fixed.push(G.box(0.07, 0.014, 0.05, rubber, [CX + x, B + 0.037, z], 0));
  const face = G.plane(0.54, 0.4, M.lit(s, 1.3, 0.9), [CX, B + 0.092, 0]); face.rotation.x = -Math.PI / 2;
  const cover = flat(sheet(0.58, 0.44, 0.014, M.glass(0xb9c9c6, 0.06), groundEdge(), [CX, B + 0.101, 0]));
  // the driver board the flex comes from, and the lead that brings it the picture
  fixed.push(G.box(0.44, 0.012, 0.3, pcb, [0.84, B + 0.056, 0.45], 0), G.box(0.03, 0.02, 0.14, rubber, [0.64, B + 0.072, 0.49], 0), G.box(0.03, 0.05, 0.1, flex, [0.622, B + 0.03, 0.49], 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(can(0.012, 0.05, brass, [0.84 + sx * 0.195, B + 0.025, 0.45 + sz * 0.125], 6), can(0.011, 0.006, steel, [0.84 + sx * 0.195, B + 0.065, 0.45 + sz * 0.125], 8));
  fixed.push(G.box(0.12, 0.016, 0.12, rubber, [0.82, B + 0.07, 0.45], 0), G.box(0.06, 0.012, 0.04, rubber, [0.95, B + 0.068, 0.38], 0), G.box(0.06, 0.012, 0.04, rubber, [0.95, B + 0.068, 0.5], 0), G.box(0.1, 0.03, 0.035, steel, [0.9, B + 0.077, 0.578], 0));
  for (const x of [0.7, 0.75]) fixed.push(can(0.018, 0.04, rubber, [x, B + 0.082, 0.36], 8));
  fixed.push(lead([[0.9, B + 0.077, 0.6], [0.91, B + 0.06, 0.64], [0.93, B + 0.02, 0.672], [0.95, B - 0.04, 0.67], [0.96, -0.045, 0.62]], 0.013, rubber, 12));

  // polarising beam splitter: two prisms cemented on the diagonal. The coating on the diagonal mirrors one polarisation and passes
  // the other, so it turns the lamp's light down, and lets what the chip has twisted straight through to the top
  const cube = G.box(0.5, 0.5, 0.5, M.glass(0x9fb6b8, 0.07, 0.5), [CX, AX, 0], 0.008);
  const coat = G.plane(0.7, 0.49, new THREE.MeshPhysicalMaterial({ color: 0x9fd0e8, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), [CX, AX, 0]);
  coat.rotation.order = 'ZXY'; coat.rotation.x = Math.PI / 2; coat.rotation.z = -Math.PI / 4;
  for (const sz of [-1, 1]) { const seam = G.box(0.7, 0.004, 0.003, rubber, [CX, AX, sz * 0.2495], 0); seam.rotation.z = -Math.PI / 4; fixed.push(seam); }
  // its table: a frame with an opening for the light, on four pillars that stand on the chip's board, and a tab at each side
  fixed.push(flat(frame(0.6, 0.6, 0.46, 0.46, 0.02, dark, [CX, AX - 0.26, 0], 0.02, 0.004)));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(can(0.014, AX - 0.3 - B, steel, [CX + sx * 0.27, (AX - 0.24 + B) / 2, sz * 0.27], 8), can(0.02, 0.01, steel, [CX + sx * 0.27, AX - 0.245, sz * 0.27], 8));
  for (const sd of [-1, 1]) fixed.push(G.box(0.12, 0.04, 0.012, dark, [CX, AX - 0.23, sd * 0.257], 0), G.box(0.012, 0.04, 0.12, dark, [CX + sd * 0.257, AX - 0.23, 0], 0));
  // the mirror over the cube turns the picture level. It hangs on an arm from the back of the lens, as in the head of an overhead projector
  const fold = G.group(G.box(0.3, 0.012, 0.3, chrome, [0, -0.006, 0], 0), G.box(0.32, 0.016, 0.32, dark, [0, 0.008, 0], 0));
  fold.position.set(CX + 0.02, MY, 0); fold.rotation.z = Math.PI / 4;
  fixed.push(fold, G.box(0.45, 0.03, 0.012, dark, [0.125, MY, -0.172], 0), chunk(0.04, 0.05, 0.05, dark, [0.33, MY, -0.155], 0.006), can(0.018, 0.03, brass, [CX + 0.02, MY, -0.186], 8, 'z'));

  // lamp: the light source behind a short lens tube, a finned heat sink at its back, a lead over the edge of the bench
  fixed.push(G.rbox(0.34, 0.36, 0.36, 0.03, dark, [-1.0, AX, 0]), new THREE.Mesh(dyed(new THREE.CircleGeometry(0.1, 20).rotateY(Math.PI / 2).translate(-0.8285, AX, 0), 0xffffff, 2.2), lamp));
  const hood = turned([[0.1, 0], [0.125, 0], [0.125, 0.06], [0.105, 0.06], [0.105, 0.045]], dark, 20, 'x'); hood.position.set(-0.83, AX, 0);
  fixed.push(hood, stand([-1.0, AX - 0.18, 0], B, steel, dark, brass, -0.6));
  for (let k = 0; k < 7; k++) fixed.push(G.box(0.07, 0.3, 0.012, dark, [-1.205, AX, (k - 3) * 0.05], 0));
  fixed.push(can(0.02, 0.03, rubber, [-1.06, AX - 0.19, -0.1], 8), lead([[-1.06, AX - 0.2, -0.1], [-1.07, 0.3, -0.16], [-1.1, B + 0.03, -0.36], [-1.14, B + 0.012, -0.56], [-1.16, B - 0.01, -0.668], [-1.17, -0.04, -0.66], [-1.15, -0.045, -0.6]], 0.012, rubber, 16));
  // projection lens in a ring on its post, and the card it throws the picture on
  const barrel = turned([[0.11, 0], [0.15, 0], [0.15, 0.04], [0.19, 0.05], [0.19, 0.2], [0.2, 0.205], [0.2, 0.3], [0.19, 0.305], [0.19, 0.44], [0.205, 0.45], [0.205, 0.5], [0.165, 0.5], [0.155, 0.485]], M.plastic(0x15171a, 0.35), 32, 'x');
  barrel.position.set(0.31, MY, 0);
  const ring = turned([[0.19, 0], [0.218, 0], [0.218, 0.05], [0.19, 0.05]], steel, 28, 'x'); ring.position.set(0.535, MY, 0);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.155, 20, 10).scale(0.3, 1, 1).translate(0.795, MY, 0), M.glass(0x9fb6b8, 0.07, 0.75));
  fixed.push(barrel, ring, stand([0.56, MY - 0.215, 0], B, steel, dark, brass, 0.5), can(0.012, 0.03, brass, [0.56, MY + 0.228, 0], 8));
  const shot = screen(320, 240), thrown = M.add(shot);
  const card = G.group(G.box(0.74, 0.58, 0.02, M.paper(0xe9e6dc), undefined, 0.004), chunk(0.2, 0.06, 0.05, dark, [0, -0.31, 0], 0.008), can(0.012, 0.03, brass, [0.06, -0.31, 0.035], 8, 'z'));
  card.position.set(1.12, MY + 0.02, -0.3); card.rotation.y = -0.95;
  const shown = G.group(G.plane(0.7, 0.54, thrown, [0, 0, 0.012])); shown.position.copy(card.position); shown.rotation.copy(card.rotation);
  fixed.push(card, stand([1.12, MY - 0.32, -0.3], B, steel, dark, brass, 2.2));
  root.add(base, weld(...fixed), face, cover, cube, coat, glass, shown);
  root.add(rays([[[-0.82, AX, 0], [CX, AX, 0], 0xffffff], [[CX, AX, 0], [CX, B + 0.1, 0], 0xffffff], [[CX + 0.02, B + 0.1, 0], [CX + 0.02, MY, 0], 0xffd27a], [[CX + 0.02, MY, 0], [0.82, MY, 0], 0xffd27a], [[0.82, MY, 0], [1.02, MY + 0.2, -0.2], 0xffd27a], [[0.82, MY, 0], [1.2, MY - 0.16, -0.4], 0xffd27a]], 0.006, 0.7));
  return {
    root, views: { chip: { at: [0.35, 0.42, 0.6], to: [-0.08, 0.22, 0], fov: 36, play: 0.1 }, cube: { at: [0.62, 1.12, 1.15], to: [-0.08, 0.56, 0], fov: 36 } }, inDark: 'glows', glow: 0xffe2b0, view: [28, 16], zoom: 1.08, surface: s.canvas,
    update: ({ lights }) => {
      const hhmm = now().hhmm;
      s.ctx.fillStyle = '#10131a'; s.ctx.fillRect(0, 0, 320, 240); bigTime(s.ctx, 320, 240, hhmm, '#ffd27a', 800, 0.6); s.tex.needsUpdate = true;
      shot.ctx.fillStyle = '#000'; shot.ctx.fillRect(0, 0, 320, 240); bigTime(shot.ctx, 320, 240, hhmm, '#ffd27a', 800, 0.6); shot.tex.needsUpdate = true;
      thrown.opacity = 1 - 0.6 * lights;
    },
  };
}

/** Eidophor: an electron beam dimples a film of oil on a mirror, and a grille of bars turns the dimples into light. The machine with its panels off. */
export function eidophor(): Built {
  const root = G.group();
  const dark = M.dark(), grey = M.enamel(0x6f777c), steel = M.steel(1), brass = M.brass(), rubber = M.rubber(), chrome = M.chrome(), copper = M.copper(), black = M.plastic(0x15171a, 0.5), lamp = shining();
  const fixed: THREE.Object3D[] = [];
  const FLOOR = -0.04, LX = -1.15;
  // frame and what is left of the cabinet: back and one side. The side has a port for the light of the lamp and one for the vacuum line
  fixed.push(G.rbox(1.9, 0.1, 1.3, 0.03, dark, [0, 0.05, 0]), G.box(0.24, 0.036, 0.004, steel, [-0.55, 0.05, 0.651], 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(can(0.07, 0.04, rubber, [sx * 0.838, -0.02, sz * 0.538], 12, 'y', 0.06), chunk(0.06, 2.3, 0.06, steel, [sx * 0.6, 1.25, sz * 0.52], 0.008));
  const side = G.cut(1.1, 2.3, 0.008, [[0, -0.05, 0.15], [0.12, -1.05, 0.05]], 0.03, grey, [-0.63, 1.25, 0], 0.006); side.rotation.y = Math.PI / 2;
  fixed.push(chunk(1.26, 2.3, 0.03, grey, [0, 1.25, -0.56], 0.008), side, chunk(1.3, 0.05, 1.14, grey, [0, 2.42, 0], 0.012));
  for (let k = 0; k < 9; k++) fixed.push(G.box(0.7, 0.023, 0.012, rubber, [0, 2.0 + (k - 4) * 0.0556, -0.576], 0));
  for (const sy of [0.22, 0.86, 1.5, 2.28]) for (const s of [-1, 1]) fixed.push(can(0.014, 0.008, steel, [s * 0.56, sy, -0.579], 8, 'z'), can(0.014, 0.008, steel, [-0.649, sy, s * 0.47], 8, 'x'));
  // the catches of the panels that have been taken off
  for (const sy of [0.4, 1.25, 2.1]) fixed.push(G.box(0.022, 0.022, 0.003, rubber, [-0.6, sy, 0.5505], 0), G.box(0.022, 0.022, 0.003, rubber, [0.6, sy, 0.5505], 0), G.box(0.003, 0.022, 0.022, rubber, [0.6305, sy, 0.52], 0), G.box(0.003, 0.022, 0.022, rubber, [0.6305, sy, -0.52], 0));
  // two decks, each with an opening where the light passes
  for (const [yy, hole] of [[0.82, 0.17], [1.6, 0.13]]) { const deck = G.cut(1.2, 1.04, 0.006, [[0, 0, hole]], 0.03, dark, [0, yy, 0], 0.006); deck.rotation.x = -Math.PI / 2; fixed.push(deck); }
  fixed.push(turned([[0.17, 0.835], [0.2, 0.835], [0.2, 0.842], [0.17, 0.842]], steel, 28));

  // lower deck: the vacuum vessel. A glass bell on a steel plate with a window in its crown for the light, and a side neck
  // for the gun, because the electrons need the same vacuum as the oil
  const glassy = M.bulb(0x9fb1ae, 0.6);
  fixed.push(turned([[0, 0.1], [0.53, 0.1], [0.53, 0.132], [0.52, 0.138], [0, 0.138]], steel, 40), turned([[0.44, 0.138], [0.48, 0.138], [0.48, 0.152], [0.44, 0.152]], rubber, 40));
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.26; fixed.push(can(0.014, 0.012, dark, [Math.cos(a) * 0.505, 0.144, Math.sin(a) * 0.505], 6)); }
  fixed.push(G.lathe([[0.46, 0.145], [0.46, 0.48], [0.42, 0.63], [0.3, 0.735], [0.15, 0.772]], glassy, 48, true), can(0.125, 0.012, glassy, [0, 0.782, 0], 24), turned([[0.125, 0.764], [0.165, 0.764], [0.165, 0.796], [0.125, 0.796]], steel, 28));
  // the mirror: a concave disc in a cell on a spindle, with the film of oil on it. Three clips hold it, and show that it turns
  const oil = new THREE.MeshPhysicalMaterial({ color: 0xcfd8e2, metalness: 1, roughness: 0.08, iridescence: 1, iridescenceIOR: 1.6, side: THREE.DoubleSide });
  const R = 0.9, CY = 1.12, level = (x: number, z: number): number => CY - Math.sqrt(R * R - x * x - z * z);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 10, 0, Math.PI * 2, Math.PI - 0.36, 0.36), oil);
  dish.position.set(0, CY, 0);
  const clips = G.group();
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2, clip = G.box(0.055, 0.012, 0.03, steel, [Math.cos(a) * 0.32, 0.29, Math.sin(a) * 0.32], 0); clip.rotation.y = -a; clips.add(clip); }
  const table = G.group(dish, weld(clips));
  fixed.push(turned([[0.06, 0.138], [0.06, 0.2], [0.345, 0.2], [0.345, 0.284], [0.32, 0.284], [0.318, 0.277]], dark, 40));
  // the rake that smooths the film before it comes round to the picture again, on an arm from a pillar beside the mirror
  const RAKE = 3.58, rc = Math.cos(RAKE), rs = Math.sin(RAKE);
  const blade = new THREE.BoxGeometry(0.16, 0.03, 0.004, 6, 1, 1).translate(0.2, 0, 0);
  for (let i = 0, pos = blade.attributes.position; i < pos.count; i++) pos.setY(i, level(pos.getX(i), 0) + 0.019 + pos.getY(i));
  blade.rotateY(-RAKE).computeVertexNormals();
  fixed.push(new THREE.Mesh(blade, steel), can(0.012, 0.2, steel, [rc * 0.4, 0.238, rs * 0.4], 8), G.rod([rc * 0.41, 0.33, rs * 0.41], [rc * 0.2, 0.33, rs * 0.2], 0.007, steel, 6), G.rod([rc * 0.2, 0.335, rs * 0.2], [rc * 0.2, level(0.2, 0) + 0.03, rs * 0.2], 0.006, steel, 6));
  // the gun: its electrodes inside the neck, the coils that steer and focus the beam round it, the base with its pins at the far end.
  // The hot cathode at the back is the one part of it that glows
  const neck = new THREE.Mesh(new THREE.LatheGeometry([[0.118, 0.02], [0.09, 0.12], [0.09, 0.345], [0.075, 0.372], [0, 0.38]].map(([r, y]) => new THREE.Vector2(r, y)), 20), glassy);
  const gun = G.group(
    neck, can(0.045, 0.32, steel, [0, -0.09, 0], 14), can(0.056, 0.016, steel, [0, -0.242, 0], 14), can(0.056, 0.1, steel, [0, 0.145, 0], 14), can(0.05, 0.08, steel, [0, 0.275, 0], 14),
    turned([[0.094, 0.135], [0.128, 0.142], [0.138, 0.17], [0.128, 0.198], [0.094, 0.205]], copper, 20),
    turned([[0.093, 0.235], [0.114, 0.235], [0.114, 0.247], [0.106, 0.247], [0.106, 0.293], [0.114, 0.293], [0.114, 0.305], [0.093, 0.305]], dark, 20),
    new THREE.Mesh(dyed(new THREE.CylinderGeometry(0.022, 0.022, 0.024, 8).translate(0, 0.332, 0), 0xff7a2a, 1.3), lamp),
    can(0.078, 0.05, black, [0, 0.398, 0], 16),
  );
  for (let k = 0; k < 6; k++) gun.add(can(0.007, 0.03, brass, [Math.cos(k * 1.047) * 0.045, 0.436, Math.sin(k * 1.047) * 0.045], 6));
  gun.rotation.z = -0.82; gun.position.set(0.38, 0.52, 0);
  fixed.push(gun, lead([[0.705, 0.825, 0], [0.76, 0.85, 0.02], [0.83, 0.74, 0.1], [0.85, 0.36, 0.2], [0.82, 0.14, 0.25], [0.8, 0.1, 0.25]], 0.014, rubber, 16), can(0.024, 0.03, rubber, [0.8, 0.112, 0.25], 8));

  // middle deck: the bar mirror. Light comes in from the lamp house, drops to the oil, and only what a dimple has bent gets back up
  // between the bars. The bars are set into two cheeks, which stand on the deck at the low end and hang from the next at the high end
  const bars = G.group();
  for (let i = 0; i < 7; i++) bars.add(G.box(0.016, 0.07, 0.5, chrome, [0, (i - 3) * 0.12, 0], 0));
  for (const s of [-1, 1]) bars.add(chunk(0.05, 0.86, 0.014, dark, [0, 0, s * 0.237], 0.004));
  bars.position.set(0, 1.2, 0); bars.rotation.z = Math.PI / 4;
  fixed.push(bars);
  for (const s of [-1, 1]) fixed.push(chunk(0.07, 0.075, 0.03, dark, [0.3, 0.8725, s * 0.237], 0.006), can(0.02, 0.016, brass, [0.3, 0.878, s * 0.26], 10, 'z'), G.box(0.03, 0.1, 0.014, dark, [-0.3, 1.54, s * 0.237], 0));

  // the lamp house, outside the cabinet: an arc behind a condenser lens, a dark window to watch the arc through, a flue for the heat.
  // Under it, as in the machine itself, the supply of the lamp and the pump that keeps the vessel empty
  const lensGlass = M.glass(0x9fb6b8, 0.07, 0.75);
  fixed.push(G.rbox(0.5, 0.6, 0.5, 0.04, grey, [LX, 1.2, 0]), new THREE.Mesh(dyed(new THREE.CircleGeometry(0.1, 20).rotateY(Math.PI / 2).translate(LX + 0.252, 1.2, 0), 0xeaf2ff, 2.4), lamp));
  const tube = turned([[0.105, 0], [0.155, 0], [0.155, 0.13], [0.135, 0.13], [0.135, 0.11]], dark, 24, 'x'); tube.position.set(LX + 0.245, 1.2, 0);
  const port = turned([[0.15, 0], [0.19, 0], [0.19, 0.012], [0.15, 0.012]], steel, 24, 'x'); port.position.set(-0.657, 1.2, 0);
  fixed.push(tube, port, new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 10).scale(0.3, 1, 1).translate(-0.8, 1.2, 0), lensGlass));
  fixed.push(G.box(0.4, 0.5, 0.012, grey, [LX, 1.2, 0.254], 0.004), G.box(0.03, 0.07, 0.014, steel, [LX + 0.17, 1.2, 0.266], 0), frame(0.13, 0.1, 0.1, 0.07, 0.006, dark, [LX - 0.02, 1.32, 0.262], 0.006, 0));
  fixed.push(new THREE.Mesh(dyed(new THREE.PlaneGeometry(0.1, 0.07).translate(LX - 0.02, 1.32, 0.2612), 0x2fa860, 0.3), lamp));
  for (const s of [-1, 1]) fixed.push(can(0.012, 0.07, steel, [LX - 0.2, 1.2 + s * 0.17, 0.264], 8));
  fixed.push(turned([[0.07, 1.495], [0.07, 1.57], [0.098, 1.575], [0.098, 1.59], [0, 1.6]], dark, 20).translateX(LX).translateZ(-0.08));
  for (let k = 0; k < 5; k++) fixed.push(G.box(0.3, 0.004, 0.016, rubber, [LX, 1.501, 0.08 + k * 0.03], 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(chunk(0.04, 0.94, 0.04, dark, [LX + sx * 0.21, 0.43, sz * 0.21], 0.006));
  fixed.push(G.box(0.5, 0.024, 0.5, dark, [LX, FLOOR + 0.012, 0], 0.006), G.box(0.5, 0.03, 0.5, dark, [LX, 0.885, 0], 0.006), G.box(0.46, 0.016, 0.46, dark, [LX, 0.552, 0], 0), G.box(0.36, 0.22, 0.36, grey, [LX, 0.67, 0], 0.012));
  for (let k = 0; k < 4; k++) fixed.push(G.box(0.24, 0.012, 0.006, rubber, [LX, 0.63 + k * 0.03, 0.181], 0));
  fixed.push(lead([[LX - 0.1, 0.93, -0.2], [LX - 0.13, 0.86, -0.22], [LX - 0.13, 0.8, -0.2], [LX - 0.1, 0.76, -0.17]], 0.012, rubber, 8));
  // the pump: a motor and a rotary pump on one bed, its intake piped through the side of the cabinet to the plate of the vessel
  fixed.push(G.box(0.42, 0.02, 0.2, dark, [LX, -0.006, 0.02], 0), can(0.085, 0.2, grey, [LX - 0.09, 0.09, 0.02], 16, 'x'), can(0.062, 0.03, dark, [LX - 0.2, 0.09, 0.02], 12, 'x'), G.box(0.07, 0.04, 0.07, dark, [LX - 0.09, 0.19, 0.02], 0.006));
  fixed.push(chunk(0.17, 0.2, 0.19, dark, [LX + 0.12, 0.1, 0.02], 0.02), can(0.022, 0.006, brass, [LX + 0.12, 0.07, 0.117], 10, 'z'), can(0.035, 0.03, steel, [LX + 0.1, 0.212, -0.02], 10), can(0.024, 0.05, steel, [LX + 0.17, 0.22, 0.06], 8));
  fixed.push(lead([[LX + 0.1, 0.22, -0.02], [LX + 0.1, 0.3, -0.04], [-0.9, 0.34, -0.09], [-0.75, 0.27, -0.115], [-0.63, 0.2, -0.12], [-0.57, 0.15, -0.105], [-0.525, 0.12, -0.09]], 0.026, steel, 22, 6), can(0.032, 0.04, steel, [-0.538, 0.12, -0.092], 8, 'x'));

  // top deck: projection lens, the mirror that turns the light out of the cabinet, and the picture on a screen across the room
  fixed.push(turned([[0.13, 1.615], [0.21, 1.615], [0.21, 1.635], [0.16, 1.64], [0.16, 1.74], [0.172, 1.745], [0.172, 1.83], [0.16, 1.835], [0.16, 1.95], [0.175, 1.955], [0.175, 1.99], [0.14, 1.99], [0.13, 1.975]], dark, 32));
  fixed.push(new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 10).scale(1, 0.3, 1).translate(0, 1.975, 0), lensGlass), can(0.012, 0.045, steel, [0.19, 1.79, 0], 6, 'x'));
  const fold = G.group(G.box(0.34, 0.012, 0.34, chrome, [0, -0.006, 0], 0), G.box(0.36, 0.016, 0.36, dark, [0, 0.008, 0], 0));
  fold.position.set(0.04, 2.16, 0); fold.rotation.z = Math.PI / 4;
  fixed.push(fold);
  for (const s of [-1, 1]) fixed.push(G.box(0.03, 0.25, 0.012, dark, [0.04, 2.275, s * 0.188], 0), can(0.02, 0.02, brass, [0.04, 2.16, s * 0.2], 10, 'z'));
  const s = screen(320, 240);
  const picture = M.add(s);
  const scr = G.group(G.box(0.86, 0.66, 0.02, M.paper(0xe9e6dc), undefined, 0.004), frame(0.86, 0.66, 0.8, 0.6, 0.006, rubber, [0, 0, 0.0115], 0.004, 0));
  scr.position.set(1.12, 2.16, 0.12); scr.rotation.y = -Math.PI / 2 + 0.85;
  const shown = G.plane(0.8, 0.6, picture, [0, 0, 0.012]);
  const face = G.group(shown); face.position.copy(scr.position); face.rotation.copy(scr.rotation);
  fixed.push(scr, G.rod([1.16, FLOOR + 0.03, 0.1], [1.16, 1.86, 0.1], 0.024, steel, 10), can(0.22, 0.03, dark, [1.16, FLOOR + 0.015, 0.1], 20, 'y', 0.2), chunk(0.07, 0.09, 0.06, dark, [1.16, 1.815, 0.1], 0.008));

  // what the beam has written, as far as it shows: the film is rippled where the picture is bright, and rippled oil scatters the light
  const field = new THREE.PlaneGeometry(0.267, 0.2, 6, 4).rotateX(-Math.PI / 2);
  for (let i = 0, pos = field.attributes.position; i < pos.count; i++) pos.setY(i, level(pos.getX(i), pos.getZ(i)) + 0.003);
  const written = M.add(s, 0xbfd4ff, 0.5), ripples = new THREE.Mesh(field, written);
  const MUZZLE: V3 = [0.2, 0.34, 0], E: V3 = [0, level(0, 0) + 0.003, 0];
  const eb = ray(0x7fb0ff, MUZZLE, E, 0.004, 0.5);
  root.add(weld(...fixed), table, face, ripples, eb.obj, halo(0xeaf2ff, 0.4, [-0.88, 1.2, 0], 0.5));
  root.add(rays([[[-0.78, 1.2, 0], [0, 1.2, 0], 0xffffff], [[0, 1.2, 0], [0, level(0, 0) + 0.003, 0], 0xffffff], [[0.04, level(0.04, 0) + 0.003, 0], [0.04, 2.16, 0], 0xcfe0ff], [[0.04, 2.16, 0], [1.08, 2.16, 0.12], 0xcfe0ff]], 0.006, 0.6));
  return {
    root, views: { screen: { at: [0.25, 2.2, 1.25], to: [1.12, 2.16, 0.12], fov: 38, play: 0.1 }, oil: { at: [0.5, 0.85, 1.2], to: [0, 0.3, 0], fov: 30 } }, inDark: 'glows', glow: 0xdde8ff, view: [30, 8], surface: s.canvas,
    update: ({ t, lights }) => {
      table.rotation.y = t * 0.25;
      s.ctx.fillStyle = '#000'; s.ctx.fillRect(0, 0, 320, 240);
      bigTime(s.ctx, 320, 240, now().hhmmss, '#e9eef7', 800, 0.44);
      s.ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let yy = 0; yy < 240; yy += 3) s.ctx.fillRect(0, yy, 320, 1);
      s.tex.needsUpdate = true;
      picture.opacity = 1 - 0.6 * lights;
      written.opacity = 0.3 + 0.25 * lights;
      E[0] = 0.12 * Math.sin(t * 9); E[2] = 0.1 * Math.sin(t * 2.3); E[1] = level(E[0], E[2]) + 0.003;
      eb.aim(MUZZLE, E);
    },
  };
}

/** Scanned laser: two small mirrors on fast motors steer one beam. The eye sees the path, not the dot. */
export function laserScan(): Built {
  const root = G.group();
  const B = 0.08, y = 0.4, Y2 = y + 0.28, GX = 0.6, GZ = 0.1, PX = -0.25, WALL = -0.595;
  const steel = M.steel(), dark = M.dark(), rubber = M.rubber(), brass = M.brass(), chrome = M.chrome(), grey = M.enamel(0x7b8287), lamp = shining();
  const base = breadboard(2.3, 1.5, B); base.position.z = 0.3;
  const fixed: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(can(0.06, 0.06, rubber, [sx * 1.054, -0.03, 0.3 + sz * 0.654], 12, 'y', 0.051));

  // the yellow label every laser carries: a black triangle with a starburst in it, and a few lines of small print
  const lab = screen(96, 64), lc = lab.ctx;
  lc.fillStyle = '#f0c419'; lc.fillRect(0, 0, 96, 64);
  lc.strokeStyle = lc.fillStyle = '#151515'; lc.lineWidth = 3; lc.lineJoin = 'round'; lc.strokeRect(2.5, 2.5, 91, 59);
  lc.beginPath(); lc.moveTo(23, 11); lc.lineTo(40, 42); lc.lineTo(6, 42); lc.closePath(); lc.stroke();
  lc.lineWidth = 1.6;
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; lc.beginPath(); lc.moveTo(23, 31); lc.lineTo(23 + Math.cos(a) * (k % 2 ? 5 : 8), 31 + Math.sin(a) * (k % 2 ? 5 : 8)); lc.stroke(); }
  lc.fillRect(47, 12, 40, 7); lc.fillRect(47, 24, 33, 4); lc.fillRect(47, 32, 38, 4); lc.fillRect(8, 49, 80, 5);
  lab.tex.center.set(0.5, 0.5); lab.tex.rotation = Math.PI / 2; lab.tex.needsUpdate = true;
  const label = new THREE.MeshStandardMaterial({ map: lab.tex, roughness: 0.6 });

  // three laser heads: a finned heat sink at the back, the barrel and its aperture at the front, held in a split block on a post
  const SINK: [number, number][] = [[0, -0.25], [0.05, -0.25], [0.056, -0.244]];
  for (let k = 0; k < 5; k++) { const f = -0.236 + k * 0.036; SINK.push([0.056, f], [0.093, f], [0.093, f + 0.016], [0.056, f + 0.016]); }
  SINK.push([0.056, -0.07]);
  const BARREL: [number, number][] = [[0.05, -0.07], [0.062, -0.07], [0.062, 0.125], [0.067, 0.13], [0.067, 0.185], [0.062, 0.19], [0.058, 0.19], [0.058, 0.236], [0.052, 0.25], [0.026, 0.25], [0.026, 0.238], [0, 0.238]];
  const cols = [0xff2a1a, 0x2aff5a, 0x2a6bff], zs = cols.map((_, i) => 0.55 + (i - 1) * 0.3);
  // dichroic plates are clear glass with a coating that mirrors one colour: here each is tinted with the colour it turns
  const tint = M.glass(0xffffff, 0.3, 0.3); tint.vertexColors = true;
  const edge = new THREE.MeshPhysicalMaterial({ color: 0x3f7f6e, roughness: 0.3, transparent: true, opacity: 0.6, depthWrite: false });
  const rim = new THREE.BoxGeometry(0.014, 0.18, 0.18).toNonIndexed();
  rim.setAttribute('position', new THREE.BufferAttribute((rim.attributes.position.array as Float32Array).slice(36), 3));
  rim.setAttribute('normal', new THREE.BufferAttribute((rim.attributes.normal.array as Float32Array).slice(36), 3));
  rim.setAttribute('uv', new THREE.BufferAttribute((rim.attributes.uv.array as Float32Array).slice(24), 2));
  cols.forEach((col, i) => {
    const z = zs[i], cx = -0.795;
    const head = G.group(turned(SINK, steel, 24), turned(BARREL, steel, 24), can(0.0685, 0.05, dark, [0, 0.1575, 0], 20), new THREE.Mesh(new THREE.CylinderGeometry(0.0628, 0.0628, 0.09, 6, 1, true, -Math.PI / 4 - 0.5, 1).translate(0, 0.08, 0), label));
    head.rotation.z = -Math.PI / 2; head.position.set(-0.78, y, z);
    fixed.push(head, new THREE.Mesh(dyed(new THREE.CircleGeometry(0.024, 12).rotateY(Math.PI / 2).translate(-0.5415, y, z), col, 2), lamp));
    fixed.push(G.box(0.09, 0.196, 0.18, dark, [cx, y - 0.012, z], 0.012), G.box(0.091, 0.03, 0.004, rubber, [cx, y + 0.0716, z], 0), can(0.012, 0.19, steel, [cx, y + 0.066, z + 0.004], 8, 'z'));
    fixed.push(stand([cx, y - 0.11, z], B, steel, dark, brass, 0.5 - i * 0.5));
    // its lead leaves through a boot at the back and runs along the edge of the board to the supply
    const lane = -1.128 + (2 - i) * 0.022, gland = -1.04 + (2 - i) * 0.04;
    fixed.push(can(0.013, 0.05, rubber, [-1.055, y, z], 8, 'x', 0.022), can(0.017, 0.024, rubber, [gland, B + 0.055, -0.133], 8, 'z'));
    fixed.push(lead([[-1.07, y, z], [-1.105, y - 0.025, z], [-1.126, y - 0.15, z - 0.02], [lane, B + 0.03, z - 0.1], [lane, B + 0.011, z - 0.22], [lane, B + 0.011, 0.02], [(lane + gland) / 2, B + 0.02, -0.07], [gland, B + 0.055, -0.125]], 0.009, rubber, 22));
    // the plate that turns this colour into the common path and lets the colours behind it through:
    // a square of glass clamped by its lower edge on a small platform with two adjusting screws
    const plate = G.group(
      new THREE.Mesh(dyed(new THREE.PlaneGeometry(0.18, 0.18).rotateY(Math.PI / 2), col), tint), new THREE.Mesh(rim, edge),
      G.box(0.034, 0.03, 0.2, dark, [0, -0.1, 0], 0), can(0.007, 0.012, steel, [0.018, -0.1, 0.06], 6, 'x'), can(0.007, 0.012, steel, [0.018, -0.1, -0.06], 6, 'x'),
      G.box(0.13, 0.012, 0.13, dark, [0, -0.121, 0], 0), G.box(0.13, 0.012, 0.13, dark, [0, -0.146, 0], 0), can(0.012, 0.014, steel, [-0.045, -0.1335, -0.045], 6),
      can(0.015, 0.022, brass, [0.045, -0.104, -0.045], 8), can(0.015, 0.022, brass, [-0.045, -0.104, 0.045], 8),
      stand([0, -0.152, 0], B - y, steel, dark, brass, Math.PI / 4),
    );
    plate.rotation.y = -Math.PI / 4; plate.position.set(PX, y, z);
    fixed.push(plate);
  });
  // the supply for the three heads, with the key switch and the emission lamp the safety rules ask for
  fixed.push(G.box(0.5, 0.18, 0.27, grey, [-0.86, B + 0.09, -0.28], 0.016));
  for (let k = 0; k < 5; k++) fixed.push(G.box(0.22, 0.004, 0.014, rubber, [-0.86, B + 0.181, -0.34 + k * 0.03], 0));
  fixed.push(can(0.024, 0.016, steel, [-0.8, B + 0.1, -0.137], 12, 'z'), G.box(0.008, 0.036, 0.04, steel, [-0.8, B + 0.1, -0.11], 0), can(0.019, 0.01, steel, [-0.7, B + 0.1, -0.14], 12, 'z'));
  fixed.push(new THREE.Mesh(dyed(new THREE.CircleGeometry(0.012, 10).translate(-0.7, B + 0.1, -0.1345), 0xffa53a, 1.6), lamp), G.box(0.11, 0.04, 0.004, steel, [-0.72, B + 0.04, -0.1445], 0));
  fixed.push(can(0.018, 0.02, rubber, [-0.66, B + 0.06, -0.42], 8, 'z'), lead([[-0.66, B + 0.06, -0.43], [-0.64, B + 0.045, -0.465], [-0.62, B - 0.03, -0.478], [-0.62, -0.035, -0.45], [-0.66, -0.045, -0.36]], 0.012, rubber, 12));

  // the turning mirror, in a mount with two brass adjusters, sends the merged beam on to the scanner
  const turn = G.group(
    can(0.085, 0.01, chrome, [-0.005, 0, 0], 20, 'x'), G.box(0.03, 0.2, 0.2, dark, [-0.025, 0, 0], 0.006), G.box(0.028, 0.2, 0.2, dark, [-0.07, 0, 0], 0),
    can(0.024, 0.04, brass, [-0.104, 0.068, -0.068], 10, 'x'), can(0.024, 0.04, brass, [-0.104, -0.068, 0.068], 10, 'x'),
    can(0.007, 0.05, steel, [-0.045, 0.068, -0.068], 6, 'x'), can(0.007, 0.05, steel, [-0.045, -0.068, 0.068], 6, 'x'), can(0.01, 0.05, steel, [-0.045, 0.068, 0.068], 6, 'x'),
    stand([-0.07, -0.1, 0], B - y, steel, dark, brass, -Math.PI / 4),
  );
  turn.rotation.y = -Math.PI / 4; turn.position.set(PX, y, GZ);
  fixed.push(turn);

  // the scanner: two galvanometers on one machined base, each clamped under a cap, their axes at right angles. The first
  // mirror turns about an axis that points at the wall and leans the beam sideways, the second turns about an axis along
  // the bench and tips it up and down. The second is the longer one, because the beam walks along it.
  fixed.push(G.box(0.54, 0.024, 0.5, dark, [0.69, B + 0.012, 0.05], 0.006), G.box(0.22, y - 0.044 - B, 0.12, dark, [GX, (y - 0.02 + B + 0.024) / 2, -0.11], 0.01), G.box(0.22, 0.114, 0.06, dark, [GX, y + 0.043, -0.11], 0.01));
  fixed.push(G.box(0.12, Y2 - 0.044 - B, 0.22, dark, [0.86, (Y2 - 0.02 + B + 0.024) / 2, GZ], 0.01), G.box(0.06, 0.114, 0.22, dark, [0.86, Y2 + 0.043, GZ], 0.01));
  for (const [x, z] of [[0.45, -0.17], [0.93, -0.17], [0.45, 0.27], [0.93, 0.27]]) fixed.push(can(0.016, 0.014, steel, [x, B + 0.031, z], 8));
  for (const s of [-1, 1]) fixed.push(can(0.014, 0.014, steel, [GX + s * 0.085, y + 0.107, -0.11], 8), can(0.014, 0.014, steel, [0.86, Y2 + 0.107, GZ + s * 0.085], 8));
  // each motor: a bright body, a black housing for the position sensor behind it, and the lead to the driver
  const along = (m: THREE.Mesh, axis: Axis): THREE.Mesh => { if (axis === 'x') m.rotation.z = -Math.PI / 2; else m.rotation.x = Math.PI / 2; return m; };
  fixed.push(can(0.04, 0.03, steel, [GX, y, -0.005], 12, 'z'), along(G.cyl(0.078, 0.18, steel, [GX, y, -0.11], 24), 'z'), along(G.cyl(0.07, 0.13, rubber, [GX, y, -0.265], 20), 'z'), can(0.012, 0.04, rubber, [GX, y, -0.35], 6, 'z', 0.02));
  fixed.push(can(0.04, 0.03, steel, [0.775, Y2, GZ], 12, 'x'), along(G.cyl(0.078, 0.18, steel, [0.88, Y2, GZ], 24), 'x'), along(G.cyl(0.07, 0.13, rubber, [1.035, Y2, GZ], 20), 'x'), can(0.02, 0.04, rubber, [1.12, Y2, GZ], 6, 'x', 0.012));
  fixed.push(lead([[GX, y, -0.37], [GX + 0.02, y - 0.05, -0.405], [GX + 0.1, B + 0.07, -0.41], [0.9, B + 0.012, -0.37], [1.04, B + 0.012, -0.25], [1.075, B + 0.012, 0.1], [1.07, B + 0.012, 0.36], [1.035, B + 0.045, 0.46], [1.02, B + 0.075, 0.51]], 0.009, rubber, 28));
  fixed.push(lead([[1.14, Y2, GZ], [1.146, Y2 - 0.05, GZ + 0.01], [1.13, Y2 - 0.3, GZ + 0.07], [1.1, B + 0.08, 0.3], [1.0, B + 0.07, 0.44], [0.97, B + 0.075, 0.51]], 0.009, rubber, 18));
  const blade = (len: number, wide: number): THREE.BufferGeometry => {
    // a galvanometer mirror: a sliver of coated glass with its far corners clipped off to save weight
    const s = new THREE.Shape([[-wide / 2, 0], [wide / 2, 0], [wide / 2, len - wide * 0.3], [wide / 2 - wide * 0.3, len], [-wide / 2 + wide * 0.3, len], [-wide / 2, len - wide * 0.3]].map(([a, b]) => new THREE.Vector2(a, b)));
    return new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false });
  };
  const rotor1 = G.group(weld(can(0.012, 0.07, steel, [0, 0, -0.085], 6, 'z'), can(0.024, 0.04, steel, [0, 0, -0.06], 10, 'z')), new THREE.Mesh(blade(0.14, 0.11).rotateX(Math.PI / 2).translate(0, 0, -0.07), chrome));
  rotor1.position.set(GX, y, GZ); rotor1.rotation.z = Math.PI / 4;
  const rotor2 = G.group(weld(can(0.012, 0.07, steel, [0.135, 0, 0], 6, 'x'), can(0.024, 0.04, steel, [0.115, 0, 0], 10, 'x')), new THREE.Mesh(blade(0.215, 0.12).rotateX(Math.PI / 2).rotateY(-Math.PI / 2).translate(0.105, 0.006, 0), chrome));
  rotor2.position.set(GX, Y2, GZ); rotor2.rotation.x = Math.PI / 4;

  // the driver of the two motors: a servo board on standoffs, a trimmer for every setting, a heat sink for the output stages
  const pcb = M.pcb(), blue = M.plastic(0x2f5fd0, 0.4), PT = B + 0.062;
  fixed.push(G.box(0.44, 0.012, 0.32, pcb, [0.84, PT - 0.006, 0.66], 0), G.box(0.2, 0.014, 0.1, dark, [0.94, PT + 0.007, 0.755], 0), G.box(0.11, 0.032, 0.035, steel, [0.74, PT + 0.016, 0.808], 0), G.box(0.07, 0.014, 0.03, rubber, [0.94, PT + 0.007, 0.6], 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) fixed.push(can(0.012, 0.05, brass, [0.84 + sx * 0.195, B + 0.025, 0.66 + sz * 0.135], 6), can(0.011, 0.006, steel, [0.84 + sx * 0.195, PT + 0.003, 0.66 + sz * 0.135], 8));
  for (let k = 0; k < 6; k++) fixed.push(G.box(0.2, 0.05, 0.006, dark, [0.94, PT + 0.039, 0.712 + k * 0.0172], 0), G.box(0.03, 0.03, 0.03, blue, [0.665 + k * 0.045, PT + 0.015, 0.6], 0), can(0.006, 0.004, brass, [0.657 + k * 0.045, PT + 0.032, 0.592], 6));
  for (const x of [0.67, 0.73]) fixed.push(can(0.022, 0.055, rubber, [x, PT + 0.0275, 0.74], 10), can(0.019, 0.003, steel, [x, PT + 0.0565, 0.74], 10));
  for (const x of [0.97, 1.02]) fixed.push(G.box(0.04, 0.026, 0.03, rubber, [x, PT + 0.013, 0.52], 0));
  // the signal that says where the beam should be comes in from the computer, under the board
  fixed.push(lead([[0.74, PT + 0.016, 0.83], [0.745, PT, 0.93], [0.76, B + 0.02, 1.03], [0.775, B - 0.03, 1.07], [0.78, -0.04, 1.03], [0.76, -0.045, 0.93]], 0.014, rubber, 16));

  // the wall the figure lands on: a stage flat painted black, its timber frame braced from behind and weighted
  const s = screen(512, 384);
  s.ctx.fillStyle = '#000'; s.ctx.fillRect(0, 0, 512, 384);
  const railWood = M.wood(0xb39a72, 0), postWood = M.wood(0xb39a72, 1), footWood = M.wood(0xb39a72, 2);
  fixed.push(G.box(2.3, 1.6, 0.02, M.plastic(0x2b2d30, 0.95), [0, 1.0, WALL - 0.01], 0.004));
  for (const yy of [0.235, 1.0, 1.765]) fixed.push(G.box(2.16, 0.07, 0.045, railWood, [0, yy, WALL - 0.0425], 0));
  for (const sx of [-1, 1]) {
    const x = sx * 0.8, slope = Math.atan2(0.27, 0.97);
    fixed.push(G.box(0.07, 1.86, 0.045, postWood, [sx * 1.115, 0.87, WALL - 0.0425], 0), G.box(0.045, 1.1, 0.06, postWood, [x, 0.49, WALL - 0.095], 0), G.box(0.045, 0.045, 0.3, footWood, [x, -0.0375, WALL - 0.245], 0));
    const strut = G.box(0.045, 1.0, 0.035, postWood, [x, 0.465, WALL - 0.24], 0); strut.rotation.x = slope;
    fixed.push(strut, G.box(0.13, 0.06, 0.16, dark, [x, 0.015, WALL - 0.275], 0.014));
  }
  const figure = G.plane(2.2, 1.5, M.add(s), [0, 1.0, WALL + 0.005]);

  // the beams. Blue meets green and then red: the common path is blue, then blue-green, then white
  const still = cols.map((col, i): [V3, V3, number] => [[-0.54, y, zs[i]], [PX, y, zs[i]], col]);
  still.push([[PX, y, zs[2]], [PX, y, zs[1]], cols[2]], [[PX, y, zs[1]], [PX, y, zs[0]], 0x40ffff], [[PX, y, zs[0]], [PX, y, GZ], 0xffffff], [[PX, y, GZ], [GX, y, GZ], 0xffffff]);
  const A: V3 = [GX, y, GZ], P: V3 = [GX, Y2, GZ], T: V3 = [0, 1, WALL + 0.01];
  const up = ray(0xffffff, A, P), out = ray(0x9dffb0, P, T);
  // every surface a beam meets scatters a little of it: a point of light on each plate and mirror
  const hits = voxels([...zs.map((z): V3 => [PX, y, z]), [PX + 0.004, y, GZ + 0.004], [GX - 0.004, y + 0.004, GZ], [GX, Y2 - 0.005, GZ - 0.005]], 0.05);
  cols.forEach((col, i) => hits.col.set(new THREE.Color(col).multiplyScalar(0.8).toArray(), i * 3));
  hits.col.fill(0.8, 9); hits.flush();
  const spot = halo(0xffffff, 0.12, [0, 1, WALL + 0.015]);
  root.add(base, weld(...fixed), rotor1, rotor2, figure, rays(still), up.obj, out.obj, hits.points, spot);
  return {
    root, views: { galvos: { at: [0.01, 1.03, 1.11], to: [0.66, 0.54, 0.05], fov: 32 } }, inDark: 'better', glow: 0x40ff70, view: [24, 12], surface: s.canvas,
    update: ({ t }) => {
      const strokes = clockStrokes(now());
      const c = s.ctx;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, 512, 384);
      c.lineWidth = 3; c.lineCap = 'round'; c.shadowBlur = 9;
      strokes.forEach(([x0, y0, x1, y1], i) => {
        const col = i < 12 ? '#3dff6e' : i === 12 ? '#ff4a3a' : i === 13 ? '#5a8bff' : '#ffffff';
        c.strokeStyle = c.shadowColor = col;
        c.beginPath(); c.moveTo(256 + x0 * 165, 192 - y0 * 165); c.lineTo(256 + x1 * 165, 192 - y1 * 165); c.stroke();
      });
      c.shadowBlur = 0;
      s.tex.needsUpdate = true;
      // where the beam happens to be this instant
      const k = Math.floor(t * 47) % strokes.length, u = (t * 13) % 1;
      const [x0, y0, x1, y1] = strokes[k];
      const px = (x0 + (x1 - x0) * u) * 0.71, py = 1.0 + (y0 + (y1 - y0) * u) * 0.71;
      // the first mirror leans the beam along the second, and each mirror stands at half the angle it turns the beam through
      P[0] = GX + px * 0.12; T[0] = px; T[1] = py;
      up.aim(A, P); out.aim(P, T);
      hits.pos[15] = P[0]; hits.flush(true);
      spot.position.set(px, py, WALL + 0.015);
      rotor1.rotation.z = Math.PI / 4 - Math.atan2(P[0] - GX, Y2 - y) / 2;
      rotor2.rotation.x = Math.PI / 4 + Math.atan2(py - Y2, Math.hypot(GZ - T[2], px - P[0])) / 2;
    },
  };
}

/** Projection mapping: an ordinary projector, and a picture cut to fit the plaster shapes it lands on. */
export function projectionMapping(): Built {
  const root = G.group();
  const FW = 512, FH = 384;
  const frame = screen(FW, FH);
  const plaster = M.plastic(0xd9d6cd, 0.95), dark = M.dark(), steel = M.steel(1), rubber = M.rubber(), shell = M.plastic(0x232528, 0.5), lamp = shining();
  const fixed: THREE.Object3D[] = [], v3 = (v: THREE.Vector3): V3 => [v.x, v.y, v.z];
  // the floor is a stage deck, boards stained black on battens: anything the projector spilled on it would show
  const deck = M.wood(0x211f1e, 2);
  for (let k = 0; k < 8; k++) fixed.push(G.box(0.321, 0.025, 3.6, deck, [(k - 3.5) * 0.325, 0.0475, 0.65], 0));
  for (const z of [-1.0, 0.1, 1.2, 2.3]) fixed.push(G.box(2.56, 0.035, 0.07, deck, [0, 0.0175, z], 0));
  // a still life in white plaster, as a drawing class has them: a blank head on a pedestal, a cube, a column, a step
  const pedestal = new THREE.Mesh(G.merge(([[0.7, 0.09, 0.105], [0.6, 0.63, 0.465], [0.7, 0.09, 0.825]] as const).map(([w, h, at]) => new RoundedBoxGeometry(w, h, w, 2, 0.02).translate(0, at, 0))), plaster);
  pedestal.position.set(-0.52, 0, -0.5);
  // the head has no face of its own: that is the projector's work. It stands low enough for the face to fall inside the picture
  const HEAD: P2[] = [[0.17, 0], [0.17, 0.028, 1], [0.125, 0.04], [0.112, 0.075], [0.118, 0.115], [0.15, 0.16], [0.195, 0.235], [0.228, 0.33], [0.24, 0.43], [0.23, 0.52], [0.19, 0.59], [0.115, 0.635], [0, 0.65]], CHIN = 0.15;
  const bust = new THREE.Mesh(new THREE.LatheGeometry(spline(HEAD, 2).map(([r, y]) => new THREE.Vector2(r, y)), 32), plaster);
  bust.position.set(-0.52, 0.87, -0.5); bust.scale.set(0.9, 1, 1);
  const COLUMN: [number, number][] = [[0.3, 0], [0.3, 0.07], [0.27, 0.075], [0.288, 0.095], [0.288, 0.125], [0.262, 0.15], [0.248, 0.16], [0.226, 1.11], [0.24, 1.12], [0.24, 1.14], [0.226, 1.15], [0.228, 1.17], [0.262, 1.215], [0.3, 1.23], [0.3, 1.3], [0, 1.3]];
  const column = turned(COLUMN, plaster, 44); column.position.set(0.74, 0.06, -0.65);
  const solids: THREE.Mesh[] = [pedestal, bust, G.box(0.5, 0.5, 0.5, plaster, [0.18, 0.31, -0.3], 0.02), column, G.box(0.9, 0.2, 0.4, plaster, [0.3, 0.16, 0.25], 0.016)];
  solids[2].rotation.y = 0.5;

  // an ordinary projector: the lens to one side of the front with its focus ring, the exhaust grille beside it, buttons and a
  // pilot light on the lid, sockets at the back. It is built looking along -z with the front of the lens at the origin, and
  // then set down exactly where the picture is worked out from.
  const eye = new THREE.Vector3(0.1, 1.0, 1.75);
  const cam = new THREE.PerspectiveCamera(36, FW / FH, 0.1, 10);
  cam.position.copy(eye); cam.lookAt(0.08, 0.72, -0.4); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const LENS: [number, number][] = [[0.066, 0.006], [0.066, -0.008], [0.08, -0.008], [0.086, 0], [0.086, 0.03], [0.093, 0.032], [0.093, 0.076], [0.086, 0.078], [0.086, 0.1]];
  const proj = G.group(
    G.rbox(0.56, 0.19, 0.44, 0.04, shell, [-0.1, 0, 0.32]), turned(LENS, dark, 24, 'z'), G.box(0.5, 0.012, 0.36, dark, [-0.1, -0.104, 0.32], 0),
    new THREE.Mesh(dyed(new THREE.CircleGeometry(0.066, 20).rotateY(Math.PI).translate(0, 0, 0.004), 0xffffff, 2.6), lamp),
    new THREE.Mesh(dyed(new THREE.CircleGeometry(0.008, 8).rotateX(-Math.PI / 2).translate(-0.31, 0.0956, 0.4), 0x49ff7a, 1.6), lamp),
    G.box(0.1, 0.004, 0.03, rubber, [0, 0.0955, 0.15], 0), G.box(0.045, 0.012, 0.016, steel, [0.015, 0.098, 0.15], 0), can(0.017, 0.006, steel, [-0.2, 0.097, 0.4], 10),
    G.box(0.36, 0.09, 0.006, steel, [-0.1, -0.01, 0.5405], 0), G.box(0.07, 0.045, 0.008, rubber, [0.03, -0.01, 0.5445], 0),
  );
  for (let k = 0; k < 8; k++) proj.add(G.box(0.014, 0.11, 0.006, rubber, [-0.33 + k * 0.028, 0, 0.0985], 0));
  for (let k = 0; k < 6; k++) proj.add(G.box(0.006, 0.012, 0.26, rubber, [-0.3805, -0.05 + k * 0.02, 0.34], 0));
  for (let k = 0; k < 4; k++) proj.add(can(0.012, 0.006, steel, [-0.2 + Math.cos(k * Math.PI / 2) * 0.04, 0.097, 0.4 + Math.sin(k * Math.PI / 2) * 0.04], 8));
  for (let k = 0; k < 3; k++) proj.add(G.box(0.05, 0.02, 0.008, rubber, [-0.23 + k * 0.075, 0, 0.5445], 0));
  proj.position.copy(eye); proj.quaternion.copy(cam.quaternion); proj.updateMatrixWorld(true);
  const from = (x: number, y: number, z: number): V3 => v3(proj.localToWorld(new THREE.Vector3(x, y, z)));
  // its stand: a tray on a tilting head, a column through the crown, three legs in two sections, and a spreader that keeps them from splaying
  const [hx, hy, hz] = from(-0.1, -0.11, 0.32), crown = hy - 0.27, hub = crown - 0.24;
  fixed.push(proj, can(0.05, 0.05, dark, [hx, hy - 0.025, hz], 12), can(0.018, 0.12, steel, [hx, hy - 0.03, hz], 8, 'x'), can(0.05, 0.07, dark, [hx, crown, hz], 12), can(0.03, 0.03, dark, [hx, hub, hz], 10));
  fixed.push(G.rod([hx, hub - 0.03, hz], [hx, hy - 0.05, hz], 0.017, steel, 10), can(0.016, 0.04, rubber, [hx + 0.066, crown, hz], 8, 'x'));
  fixed.push(G.rod([hx, hy - 0.03, hz], [hx + 0.1, hy - 0.11, hz + 0.26], 0.008, steel, 6), G.rod([hx + 0.1, hy - 0.11, hz + 0.26], [hx + 0.14, hy - 0.142, hz + 0.364], 0.015, rubber, 8));
  // tape on the boards marks where every foot and every solid stands: nothing may move once the picture has been fitted
  const tape = M.paper(0xe6dfb0), TAPE = 0.0612;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5, c = Math.cos(a), s = Math.sin(a);
    const top = new THREE.Vector3(hx + c * 0.045, crown - 0.01, hz + s * 0.045), foot = new THREE.Vector3(hx + c * 0.44, 0.085, hz + s * 0.44);
    const on = (u: number): V3 => v3(top.clone().lerp(foot, u));
    fixed.push(G.rod(on(0), on(0.56), 0.017, dark, 8), G.rod(on(0.5), on(0.58), 0.023, dark, 8), G.rod(on(0.56), on(1), 0.012, steel, 8), can(0.028, 0.03, rubber, [foot.x, 0.075, foot.z], 8));
    fixed.push(G.rod([hx + c * 0.03, hub, hz + s * 0.03], on(0.46), 0.006, steel, 6));
    const cross = G.group(G.box(0.13, 0.002, 0.016, tape, undefined, 0), G.box(0.016, 0.002, 0.13, tape, undefined, 0));
    cross.position.set(foot.x, TAPE, foot.z); cross.rotation.y = -a;
    fixed.push(cross);
  }
  for (const [cx, cz, w, d, ry] of [[-0.52, -0.5, 0.7, 0.7, 0], [0.18, -0.3, 0.5, 0.5, 0.5], [0.3, 0.25, 0.9, 0.4, 0]]) {
    const marks = G.group();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) marks.add(G.box(0.09, 0.002, 0.016, tape, [sx * (w / 2 - 0.031), 0, sz * (d / 2 + 0.014)], 0), G.box(0.016, 0.002, 0.09, tape, [sx * (w / 2 + 0.014), 0, sz * (d / 2 - 0.031)], 0));
    marks.position.set(cx, TAPE, cz); marks.rotation.y = ry;
    fixed.push(marks);
  }
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.6, m = G.box(0.1, 0.002, 0.016, tape, [0.74 + Math.cos(a) * 0.322, TAPE, -0.65 + Math.sin(a) * 0.322], 0); m.rotation.y = Math.PI / 2 - a; fixed.push(m); }
  // mains and picture leave by two leads, taped down across the boards and gone under the edge of the deck
  const mains = from(0.03, -0.01, 0.55), signal = from(-0.155, 0, 0.55);
  fixed.push(lead([mains, [mains[0] + 0.01, mains[1] - 0.09, mains[2] + 0.07], [mains[0] + 0.05, 0.45, 2.38], [mains[0] + 0.12, 0.085, 2.34], [0.7, 0.071, 2.37], [1.22, 0.071, 2.39], [1.315, 0.05, 2.39], [1.318, 0.012, 2.385], [1.25, 0.011, 2.38]], 0.011, rubber, 26));
  fixed.push(lead([signal, [signal[0], signal[1] - 0.1, signal[2] + 0.06], [signal[0] + 0.1, 0.4, 2.36], [signal[0] + 0.25, 0.085, 2.3], [0.7, 0.069, 2.34], [1.22, 0.069, 2.362], [1.313, 0.05, 2.362], [1.316, 0.012, 2.357], [1.25, 0.011, 2.352]], 0.009, rubber, 26));
  fixed.push(G.box(0.05, 0.022, 0.1, tape, [0.7, 0.072, 2.355], 0), G.box(0.05, 0.022, 0.1, tape, [1.1, 0.072, 2.372], 0));

  // work out, for every point on the plaster, which part of the projector's picture lands there
  const light = M.add(frame, 0xffffff, 1); light.vertexColors = true; light.side = THREE.FrontSide; light.polygonOffset = true; light.polygonOffsetFactor = -2; light.polygonOffsetUnits = -4;
  const rects: [number, number, number, number][] = [], outlines: Path2D[] = [], far: number[] = [], lit: THREE.Mesh[] = [];
  const p = new THREE.Vector3(), nrm = new THREE.Vector3(), nm = new THREE.Matrix3(), to = new THREE.Vector3();
  solids.forEach((m, i) => {
    m.updateMatrixWorld(true);
    const geo = m.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal;
    const uv = new Float32Array(pos.count * 2), col = new Float32Array(pos.count * 3), seen: [number, number][] = [];
    nm.getNormalMatrix(m.matrixWorld);
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0, away = 0;
    for (let k = 0; k < pos.count; k++) {
      // the face is laid out on the head alone, not on the neck under it
      const part = i !== 1 || pos.getY(k) > CHIN;
      p.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld);
      nrm.fromBufferAttribute(nor, k).applyMatrix3(nm).normalize();
      const facing = Math.max(0, nrm.dot(to.copy(eye).sub(p).normalize()));
      away += p.distanceTo(eye) / pos.count;
      p.project(cam);
      const u = p.x * 0.5 + 0.5, v = p.y * 0.5 + 0.5;
      // past the edge of the picture a solid is given the picture's last row, so its outline is held to the edge too
      uv.set([u, v], k * 2); seen.push([Math.min(FW, Math.max(0, u * FW)), Math.min(FH, Math.max(0, (1 - v) * FH))]);
      const f = Math.pow(facing, 0.7); col.set([f, f, f], k * 3);
      if (facing > 0.05 && part) { x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const twin = new THREE.Mesh(geo, light);
    twin.position.copy(m.position); twin.rotation.copy(m.rotation); twin.scale.copy(m.scale);
    lit.push(twin); far.push(away);
    rects.push([x0 * FW, (1 - y1) * FH, (x1 - x0) * FW, (y1 - y0) * FH]);
    // the outline of the solid as the lens sees it. Every solid here bulges outwards, so that is the hull of its corners
    seen.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const turn = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (list: [number, number][]) => { const h: [number, number][] = []; for (const q of list) { while (h.length > 1 && turn(h[h.length - 2], h[h.length - 1], q) <= 0) h.pop(); h.push(q); } h.pop(); return h; };
    const path = new Path2D();
    [...half(seen), ...half(seen.reverse())].forEach(([x, y], k) => (k ? path.lineTo(x, y) : path.moveTo(x, y)));
    path.closePath(); outlines.push(path);
  });
  // the picture is painted from the farthest solid to the nearest, so that each keeps only what the lens sees of it.
  // A second, fixed sheet records which solid owns each part of the picture: light meant for a near solid is not
  // laid on the one behind it as well, and the far one is left with a shadow, as it would be
  const order = solids.map((_, i) => i).sort((a, b) => far[b] - far[a]);
  const owner = screen(FW, FH);
  owner.ctx.fillStyle = '#000'; owner.ctx.fillRect(0, 0, FW, FH);
  order.forEach((i, rank) => {
    owner.ctx.fillStyle = `rgb(${(rank + 1) * 40},${(rank + 1) * 40},${(rank + 1) * 40})`; owner.ctx.fill(outlines[i]);
    const id = new Float32Array(lit[i].geometry.attributes.position.count).fill(rank + 1);
    lit[i].geometry.setAttribute('aSolid', new THREE.BufferAttribute(id, 1));
  });
  owner.tex.colorSpace = THREE.NoColorSpace; owner.tex.generateMipmaps = false; owner.tex.minFilter = THREE.LinearFilter; owner.tex.needsUpdate = true;
  // kept on the material so that it is let go of with it
  Object.assign(light, { ownerMap: owner.tex });
  light.onBeforeCompile = (sh) => {
    sh.uniforms.tOwner = { value: owner.tex };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSolid;\nvarying float vSolid;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSolid = aSolid;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tOwner;\nvarying float vSolid;')
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= step(texture2D(tOwner, vMapUv).r * 6.375, vSolid + 0.5);');
  };
  light.customProgramCacheKey = () => 'cut-to-fit';
  const throwGeo = new THREE.BufferGeometry();
  const ends = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, yy]) => new THREE.Vector3(x, yy, 0.93).unproject(cam));
  throwGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 2, 3].flatMap((i) => [eye.x, eye.y, eye.z, ends[i].x, ends[i].y, ends[i].z, ends[(i + 1) % 4].x, ends[(i + 1) % 4].y, ends[(i + 1) % 4].z]), 3));
  const throwMat = M.add(null, 0xffffff, 0.04);
  const [gx, gy, gz] = from(0, 0, -0.015);
  root.add(weld(...fixed, ...solids), weld(...lit), new THREE.Mesh(throwGeo, throwMat), halo(0xfff6e6, 0.4, [gx, gy, gz], 0.5));
  return {
    root, views: { shapes: { at: [-0.45, 1, 1.45], to: [-0.3, 0.6, -0.4], fov: 34, play: 0.1 }, lens: { at: [0.1, 1.42, 2.2], to: [0.1, 0.75, -0.45], fov: 40, play: 0.12 } }, inDark: 'better', glow: 0x6a5f55, view: [-24, 14], surface: frame.canvas,
    update: ({ t, lights }) => {
      const c = frame.ctx;
      // black wherever there is nothing to hit: the picture is cut to the outline of each solid
      c.fillStyle = '#000'; c.fillRect(0, 0, FW, FH);
      for (const i of order) {
        const [x, yy, w, h] = rects[i];
        c.save(); c.clip(outlines[i]);
        // whatever a farther solid was given here is hidden from the lens by this one
        c.fillStyle = '#000'; c.fillRect(0, 0, FW, FH);
        if (i === 0) { for (let k = 0; k < 9; k++) { c.fillStyle = hsl(k * 40 + t * 40, 90, 55); c.fillRect(x, yy + ((t * 30 + k * 30) % (h + 30)) - 30, w, 16); } }
        else if (i === 1) { c.fillStyle = hsl(t * 50, 80, 60); c.fillRect(0, 0, FW, FH); c.fillStyle = '#111'; c.beginPath(); c.arc(x + w * 0.36, yy + h * 0.42, w * 0.08, 0, 7); c.arc(x + w * 0.64, yy + h * 0.42, w * 0.08, 0, 7); c.fill(); c.fillRect(x + w * 0.34, yy + h * 0.66, w * 0.32, h * 0.05); }
        else if (i === 2) { c.fillStyle = '#10204a'; c.fillRect(x, yy, w, h); c.save(); c.translate(x, yy); segClock(c, w, h, now(), '#ffffff', null, false, 4); c.restore(); }
        else if (i === 3) { for (let k = 0; k < 14; k++) { c.fillStyle = k % 2 ? '#ff5d5d' : '#ffd166'; c.fillRect(x, yy + ((k * 22 + t * 26) % (h + 22)) - 22, w, 11); } }
        else { c.fillStyle = '#19e0b0'; for (let k = 0; k < 12; k++) c.fillRect(x + ((k * 24 + t * 30) % (w + 24)) - 24, yy, 12, h); }
        c.restore();
      }
      frame.tex.needsUpdate = true;
      // a projected image is only as strong as the room is dark
      light.opacity = 1 - 0.7 * lights;
      throwMat.opacity = 0.05 - 0.04 * lights;
    },
  };
}

/**
 * Hidden-image screen: a liquid-crystal monitor with its front polariser peeled off. Every dot lets out the same
 * light, so the screen looks white. A round polarising filter on a stand in front of it turns slowly: through it the
 * picture comes back, and a quarter turn later it shows in its opposite colours.
 */
export function hiddenLcd(): Built {
  const root = G.group();
  const W = 1.5, H = 0.94, y = 1.02, T = Math.PI / 2;
  const s = screen(512, 320), seen = screen(512, 320);
  const dark = M.dark(), black = M.black(), steel = M.steel(), shell = M.plastic(0x1d1f22, 0.5);
  // the monitor: a thin panel in its bezel, a deeper chin with a power lamp, its screen an even white
  root.add(G.bezel(W + 0.07, H + 0.07, W, H, 0.006, 0.04, dark, [0, y, -0.012], 0.014, 0.006), G.plane(W, H, M.lit(s, 1.05, 0.2), [0, y, -0.008]));
  root.add(G.rbox(W + 0.07, 0.07, 0.045, 0.012, dark, [0, y - H / 2 - 0.068, -0.02]), G.box(0.012, 0.006, 0.004, M.glow(0xf0f4ff, 1.4), [W / 2 - 0.06, y - H / 2 - 0.068, 0.003], 0));
  s.ctx.fillStyle = '#f4f6f6'; s.ctx.fillRect(0, 0, 512, 320); s.tex.needsUpdate = true;
  // behind: the housing over the electronics, with louvres and screws, a neck down to a foot, and the lead along the neck
  root.add(G.rbox(W - 0.2, H - 0.2, 0.05, 0.02, shell, [0, y, -0.06]), vents(0.7, 0.22, 8, [0, y + 0.18, -0.0855]));
  const back = screws([[-0.6, y + 0.3, 0.0865], [0.6, y + 0.3, 0.0865], [-0.6, y - 0.3, 0.0865], [0.6, y - 0.3, 0.0865]], 0.012); back.rotation.y = Math.PI; root.add(back);
  root.add(G.rbox(0.2, 0.2, 0.02, 0.008, steel, [0, y - 0.05, -0.09]), G.box(0.08, y - 0.04 - 0.08, 0.05, M.steel(1), [0, 0.04 + (y - 0.12) / 2, -0.13]));
  root.add(G.rbox(0.56, 0.03, 0.34, 0.014, dark, [0, 0.015, -0.1]), G.cyl(0.05, 0.01, steel, [0, 0.035, -0.13], 24));
  root.add(G.wire([[0.12, y - 0.3, -0.09], [0.08, y - 0.4, -0.16], [0.045, 0.6, -0.16], [0.045, 0.1, -0.16], [0.08, 0.03, -0.26], [0.2, 0.02, -0.34]], 0.009, M.rubber(), false, 5));
  // the film that was peeled off the front of the panel, lying curled on the plinth beside the foot
  const peel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 32, 1, true, 0, Math.PI * 1.6), new THREE.MeshStandardMaterial({ color: 0x3c4248, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
  peel.rotation.set(0, 0.35, T); peel.position.set(-0.62, 0.06, 0.18);
  root.add(peel);
  // the filter: a disc of grey film in a ring that turns inside a fixed dial marked every fifteen degrees
  const R = 0.3, fx = 0, fy = y, fz = 0.06;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshBasicMaterial({ map: seen.tex, transparent: true, opacity: 1 }));
  disc.position.set(fx, fy, fz);
  const film = new THREE.Mesh(new THREE.CircleGeometry(R, 64), new THREE.MeshPhysicalMaterial({ color: 0x40464b, transparent: true, opacity: 0.16, roughness: 0.08, clearcoat: 1 }));
  film.position.set(fx, fy, fz + 0.002);
  const annulus = (r0: number, r1: number) => { const sh = new THREE.Shape(); sh.absarc(0, 0, r1, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, r0, 0, Math.PI * 2, true); sh.holes.push(h); return sh; };
  const DIAL = R + 0.075;
  root.add(disc, film, G.extruded(annulus(R + 0.03, DIAL), 0.02, black, [fx, fy, fz - 0.004], 0.004));
  const ticks = new Swarm(new THREE.BoxGeometry(0.005, 1, 0.003), M.paper(0xe8e4da), 24);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, long = i % 6 === 0 ? 0.03 : 0.016, rr = DIAL - 0.006 - long / 2; ticks.put(i, fx + Math.sin(a) * rr, fy + Math.cos(a) * rr, fz + 0.0075, 0, 0, -a, 1, long, 1); }
  ticks.done(); ticks.mesh.userData.noShadow = true; root.add(ticks.mesh);
  // the turning ring: knurled at its rim, with a lit mark that shows the angle of the filter against the dial
  const turner = G.group(G.extruded(annulus(R - 0.004, R + 0.028), 0.024, M.plastic(0x16181a, 0.35), [0, 0, 0], 0.004));
  const knurl = new Swarm(new THREE.BoxGeometry(0.008, 0.008, 0.02), M.plastic(0x16181a, 0.35), 72);
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; knurl.put(i, Math.sin(a) * (R + 0.03), Math.cos(a) * (R + 0.03), 0, 0, 0, -a); }
  knurl.done(); turner.add(knurl.mesh, G.box(0.008, 0.026, 0.004, M.glow(0xffd060, 1.3), [0, R + 0.014, 0.013], 0));
  turner.position.set(fx, fy, fz + 0.012); root.add(turner);
  // what turns it: a small geared motor under the dial, its rubber wheel against the knurled rim
  const my = fy - R - 0.1;
  root.add(G.rbox(0.12, 0.08, 0.07, 0.01, M.enamel(0x2a3a46), [fx, my, fz - 0.03]), G.cyl(0.026, 0.026, M.rubber(), [fx, fy - R - 0.056, fz + 0.012], 20).rotateX(T));
  root.add(G.box(0.05, 0.06, 0.02, steel, [fx - 0.07, fy - R - 0.05, fz - 0.01]), G.box(0.05, 0.06, 0.02, steel, [fx + 0.07, fy - R - 0.05, fz - 0.01]));
  // the dial stands on a post in a heavy round foot, with a clamp where the two meet
  root.add(G.cyl(0.016, my - 0.06, M.steel(1), [fx, 0.03 + (my - 0.06) / 2, fz - 0.03], 16), G.cyl(0.03, 0.05, dark, [fx, my - 0.065, fz - 0.03], 20));
  root.add(G.cyl(0.15, 0.03, dark, [fx, 0.015, fz - 0.03], 40, 0.14), small(toggle([fx + 0.09, 0.03, fz - 0.03], true, 'y'), 0.6));

  /** The picture as the panel writes it, in the angle of its light: a clock on a coloured field. */
  const draw = (c: CanvasRenderingContext2D, flip: boolean) => {
    c.fillStyle = flip ? '#1d5f8f' : '#f0b56a'; c.fillRect(0, 0, 512, 320);
    bigTime(c, 512, 320, now().hhmm, flip ? '#fff0dc' : '#16222c', 800, 0.2);
  };
  let shown = '';
  return {
    root, views: {
      front: { at: [0, 1.05, 3.0], to: [0, 1.0, 0], fov: 34, play: 0.2 },
      close: { at: [0.1, 1.04, 1.1], to: [0, 1.02, 0], fov: 40, play: 0.1 },
    },
    inDark: 'glows', glow: 0xf4f6f6, view: [16, 4],
    update: (env) => {
      // a full turn every twenty seconds: the picture is darkest-on-light at 0° and 180°, and reversed at 90° and 270° (set back a little, so a still taken at 2.8 seconds finds it nearly square)
      const a = ((env.t - 2.25) / 20) * Math.PI * 2, c2 = Math.cos(a) ** 2;
      turner.rotation.z = -a;
      const key = `${now().hhmm}${c2 > 0.5}`;
      if (key !== shown) { shown = key; draw(seen.ctx, c2 < 0.5); seen.tex.needsUpdate = true; }
      // the disc shows the part of the screen behind it, strongest when the filter is square to the panel
      const u = seen.tex;
      u.repeat.set((2 * R) / W, (2 * R) / H); u.offset.set(0.5 - R / W, 0.5 - R / H);
      (disc.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.65 * Math.abs(c2 - 0.5) * 2;
    },
  };
}

/**
 * Switchable glass: a pane in a frame, frosted white with the power off and clear with it on. Behind it on the stand
 * a small clock face is seen only while the pane is clear. The pane switches every five seconds, and a lamp on the
 * frame shows when it is powered.
 */
export function switchableGlass(): Built {
  const root = G.group();
  const W = 1.3, H = 1.5, y = 1.05, T = Math.PI / 2;
  const dark = M.dark(), metal = M.steel(1), shell = M.plastic(0x2a2d31, 0.5), copper = M.copper();
  const face = screen(256, 256);
  // the frame: an aluminium surround with a screw in each corner, on two uprights with long feet
  root.add(G.bezel(W + 0.1, H + 0.1, W - 0.02, H - 0.02, 0.006, 0.05, metal, [0, y, 0], 0.01, 0.004));
  root.add(screws([[-W / 2 - 0.025, y + H / 2 + 0.025, 0.026], [W / 2 + 0.025, y + H / 2 + 0.025, 0.026], [-W / 2 - 0.025, y - H / 2 - 0.025, 0.026], [W / 2 + 0.025, y - H / 2 - 0.025, 0.026]], 0.008));
  const leg = y - H / 2 - 0.05;
  for (const sx of [-1, 1]) {
    root.add(G.box(0.06, leg, 0.05, metal, [sx * (W / 2 - 0.12), leg / 2 + 0.02, 0]), G.rbox(0.08, 0.03, 0.46, 0.01, dark, [sx * (W / 2 - 0.12), 0.035, 0]));
    for (const sz of [-1, 1]) root.add(G.cyl(0.025, 0.02, M.rubber(), [sx * (W / 2 - 0.12), 0.01, sz * 0.19], 16));
  }
  // the pane: two sheets of glass with the liquid-crystal film between, and a copper bus bar along each side that feeds it
  root.add(G.pane(W, H, 0.006, [0, y, 0.008]), G.pane(W, H, 0.006, [0, y, -0.008]));
  for (const sx of [-1, 1]) root.add(G.box(0.012, H - 0.02, 0.002, copper, [sx * (W / 2 - 0.02), y, 0.001], 0));
  // two leads leave the bottom corner through a gland and run to the driver on the plinth
  const DX = W / 2 + 0.3, DY = 0.09;
  root.add(G.cyl(0.016, 0.03, M.black(), [W / 2 - 0.05, y - H / 2 - 0.055, 0], 12));
  root.add(G.wire([[W / 2 - 0.05, y - H / 2 - 0.07, 0], [W / 2 - 0.02, y - H / 2 - 0.2, 0.02], [W / 2 + 0.1, 0.3, 0.06], [DX - 0.1, DY + 0.02, 0.06]], 0.008, M.rubber(), false, 5));
  // the driver: a box with louvres that turns mains into the alternating voltage the film needs, a switch, a pilot lamp
  root.add(G.rbox(0.24, 0.12, 0.16, 0.014, shell, [DX, DY, 0.06]), vents(0.12, 0.06, 5, [DX + 0.03, DY, 0.1405]));
  root.add(small(toggle([DX - 0.08, DY + 0.06, 0.06], true, 'y'), 0.6), screws([[DX - 0.105, DY + 0.045, 0.141], [DX + 0.105, DY + 0.045, 0.141], [DX - 0.105, DY - 0.045, 0.141], [DX + 0.105, DY - 0.045, 0.141]], 0.006));
  const lamp = M.glow(0x50e070, 1.6);
  root.add(G.cyl(0.013, 0.008, M.chrome(), [DX - 0.07, DY, 0.142], 20).rotateX(T), G.sph(0.009, lamp, [DX - 0.07, DY, 0.147], 16));
  root.add(G.wire([[DX + 0.1, DY - 0.02, -0.02], [DX + 0.14, 0.03, -0.12], [DX + 0.1, 0.02, -0.35]], 0.007, M.rubber(), false, 5));
  // behind the pane, a small desk clock on its foot, to be seen through it
  const cy = y - 0.1, cz = -0.55;
  root.add(G.rbox(0.56, 0.56, 0.07, 0.02, dark, [0, cy, cz - 0.04]), G.plane(0.5, 0.5, M.lit(face, 1.0, 0.25), [0, cy, cz - 0.004]));
  root.add(G.box(0.05, cy - 0.3, 0.04, metal, [0, (cy - 0.3) / 2 + 0.02, cz - 0.06]), G.rbox(0.36, 0.03, 0.26, 0.012, dark, [0, 0.015, cz - 0.06]));
  // the film: milky with the power off, its haze falling away when the voltage lines up the crystals
  const haze = new THREE.MeshStandardMaterial({ color: 0xf3f4f2, roughness: 0.9, transparent: true, opacity: 0.95, side: THREE.DoubleSide });
  const film = G.plane(W - 0.01, H - 0.01, haze, [0, y, 0]);
  root.add(film);
  const pilot = { material: lamp };
  let shown = '';
  return {
    root, views: {
            close: { at: [1.2, 0.74, 1.05], to: [0.78, 0.34, 0.05], fov: 42, play: 0.1 },
    },
    inDark: 'vanishes', view: [-18, 4],
    update: (env) => {
      // five seconds frosted, five clear, switching in a fifth of a second as the molecules turn (a still taken at 2.8 seconds finds it clear)
      const at = (env.t + 3) % 10, on = at >= 5, edge = Math.min(1, Math.abs(at - (on ? 5 : 0)) / 0.2);
      haze.opacity = on ? 0.95 - 0.9 * edge : at < 0.2 ? 0.05 + 0.9 * edge : 0.95;
      (pilot.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 1.6 : 0.05;
      const hhmm = now().hhmm;
      if (hhmm !== shown) {
        shown = hhmm;
        const c = face.ctx;
        c.fillStyle = '#f2ede2'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#1c2024'; c.lineWidth = 8; c.strokeRect(8, 8, 240, 240);
        bigTime(c, 256, 256, hhmm, '#1c2024', 800, 0.36);
        face.tex.needsUpdate = true;
      }
    },
  };
}

/**
 * Scanning fibre display, enlarged many times and slowed many thousand times. Laser light in three colours is
 * joined into one fibre, which runs through a tube of piezoelectric ceramic and sticks out of its end. Driven at its
 * resonance, the free end swings in growing circles. The spot leaving it goes through a lens to a screen, where it
 * paints the time ring by ring; then the swinging is stopped and the tip comes back to the centre.
 */
export function scanningFiber(): Built {
  const root = G.group();
  const B = 0.08, Y = 0.62, dark = M.dark(), steel = M.steel(), brass = M.brass(), rubber = M.rubber();
  const base = breadboard(2.2, 1.2, B); base.position.z = 0.1;
  root.add(base);
  // the three lasers at the back, their fibres joined in a coupler box and running on as one
  const cols = [0xff3020, 0x30ff60, 0x3070ff];
  cols.forEach((c, i) => {
    const z = -0.3 + i * 0.16;
    root.add(G.rbox(0.26, 0.1, 0.1, 0.012, dark, [-0.85, B + 0.05, z]), G.box(0.006, 0.03, 0.03, M.glow(c, 1.4), [-0.718, B + 0.05, z], 0));
    root.add(G.wire([[-0.715, B + 0.05, z], [-0.6, B + 0.06, z], [-0.5, B + 0.06, -0.14], [-0.44, B + 0.06, -0.14]], 0.006, M.plastic(c, 0.5), false, 6));
  });
  root.add(G.rbox(0.12, 0.08, 0.1, 0.012, M.enamel(0x2a3a46), [-0.38, B + 0.06, -0.14]));
  root.add(G.wire([[-0.32, B + 0.06, -0.14], [-0.2, B + 0.08, -0.14], [-0.1, Y - 0.1, 0], [-0.52, Y, 0.1]], 0.007, M.plastic(0xe0c020, 0.5), false, 6));
  // the scanner: a clear housing on two posts, and inside it the ceramic tube with four gold electrodes
  const AX = -0.5, TL = 0.5, FL = 0.32; // tube from AX to AX + TL along x; the fibre sticks out FL beyond it
  root.add(G.cyl(0.085, TL + 0.1, M.glass(0xcfe0e0, 0.12, 0.6), [AX + TL / 2, Y, 0.1], 32).rotateZ(Math.PI / 2));
  for (const x of [AX + 0.05, AX + TL - 0.05]) root.add(G.box(0.05, Y - B - 0.06, 0.05, steel, [x, (Y + B) / 2 - 0.03, 0.1], 0.004), G.cyl(0.095, 0.03, dark, [x, Y, 0.1], 32).rotateZ(Math.PI / 2));
  root.add(G.cyl(0.04, TL, M.ceramic(), [AX + TL / 2, Y, 0.1], 24).rotateZ(Math.PI / 2));
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; root.add(G.box(TL - 0.04, 0.004, 0.03, M.brass(0), [AX + TL / 2, Y + Math.cos(a) * 0.041, 0.1 + Math.sin(a) * 0.041], 0).rotateX(a)); }
  // the leads that carry the drive to the electrodes
  root.add(G.wire([[AX + 0.15, Y + 0.05, 0.1], [AX + 0.1, Y + 0.25, 0.25], [AX - 0.1, B + 0.1, 0.45], [-0.9, B + 0.05, 0.45]], 0.008, rubber, false, 5));
  root.add(G.rbox(0.3, 0.12, 0.2, 0.012, M.enamel(0x3a4148), [-0.92, B + 0.06, 0.45]), vents(0.18, 0.06, 4, [-0.92, B + 0.06, 0.551]));
  // the free end of the fibre: short pieces that bend as a beam held at one end bends
  const SEGS = 28, fib = new Swarm(new THREE.CylinderGeometry(0.0055, 0.0055, (FL / SEGS) * 1.4, 8).rotateZ(Math.PI / 2), M.glass(0xe8f4f4, 0.5, 0.7), SEGS);
  fib.mesh.userData.noShadow = true;
  root.add(fib.mesh);
  const tipGlow = halo(0xffffff, 0.08, [0, 0, 0], 0.9);
  root.add(tipGlow);
  // a lens in a ring on a post, and the screen it throws the picture on
  const LX = AX + TL + FL + 0.12;
  root.add(lens(0.1, [LX, Y, 0.1], 0.35, brass), G.cyl(0.014, Y - B - 0.1, steel, [LX, (Y + B) / 2 - 0.05, 0.1], 10), G.cyl(0.05, 0.02, dark, [LX, B + 0.01, 0.1], 16));
  const SX = 0.85, SW = 0.7;
  const screenGroup = G.group(G.box(0.03, SW + 0.06, SW + 0.06, dark, [0, 0, 0], 0.006), G.plane(SW, SW, M.plastic(0x1a1c1e, 0.9), [-0.016, 0, 0]).rotateY(-Math.PI / 2));
  const paint = screen(256, 256), pc = paint.ctx;
  pc.fillStyle = '#000'; pc.fillRect(0, 0, 256, 256); paint.tex.needsUpdate = true;
  screenGroup.add(G.plane(SW, SW, M.add(paint, 0xffffff, 1), [-0.018, 0, 0]).rotateY(-Math.PI / 2));
  screenGroup.position.set(SX, Y, 0.1);
  root.add(screenGroup, G.box(0.05, Y - B - SW / 2, 0.05, steel, [SX + 0.03, (Y + B - SW / 2) / 2, 0.1], 0.004), G.rbox(0.3, 0.03, 0.3, 0.01, dark, [SX + 0.03, B + 0.015, 0.1]));
  // the ray from the tip through the lens to the spot on the screen
  const ray = beam(0xffffff, 0.8);
  root.add(ray.line);
  // what the spot is to draw: the time, read from a small canvas
  const glyph = screen(96, 96), gc = glyph.ctx;
  let shown = '', mask = new Uint8ClampedArray(0);
  const FRAME = 9, OUT = 7.8, TURNS = 26, RMAX = 0.05;
  /** Where the tip is at a moment of its frame: swinging outward in a spiral, then stopped and brought back to the centre. */
  const swing = (ph: number): [number, number] => {
    const r = ph < OUT ? ph / OUT : Math.max(0, 1 - ((ph - OUT) / (FRAME - OUT)) * 3);
    const a = ph < OUT ? (ph / OUT) * TURNS * Math.PI * 2 : (ph - OUT) * 40;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };
  const lit = (u: number, v: number) => { const px = Math.round(48 - u * 46), py = Math.round(48 - v * 46); return mask.length > 0 && mask[(py * 96 + px) * 4] > 100; };
  /** Paint the spot's path between two moments, in small steps, so that a slow frame does not cut across the spiral. */
  const paintSpan = (p0: number, p1: number, alpha: number) => {
    const X = (q: number) => 128 + q * 118;
    pc.strokeStyle = `rgba(230,245,255,${alpha})`; pc.lineWidth = 3; pc.lineCap = 'round';
    const steps = Math.max(1, Math.ceil((Math.min(p1, OUT) - p0) / 0.004));
    let [pu, pv] = swing(p0);
    for (let i = 1; i <= steps; i++) {
      const ph = p0 + ((Math.min(p1, OUT) - p0) * i) / steps, [u, v] = swing(ph);
      if (ph < OUT && lit(u, v)) { pc.beginPath(); pc.moveTo(X(-pu), X(-pv)); pc.lineTo(X(-u), X(-v)); pc.stroke(); }
      pu = u; pv = v;
    }
  };
  let steady = false;
  let last = -1;
  return {
    root, inDark: 'glows', glow: 0xd8f0ff, view: [20, 10], surface: paint.canvas,
    views: {
      tip: { at: [AX + TL + 0.45, Y + 0.3, 0.85], to: [AX + TL + FL * 0.5, Y, 0.1], fov: 32, play: 0.12 },
      picture: { at: [-0.2, Y + 0.25, 1.4], to: [SX, Y, 0.1], fov: 34, play: 0.12 },
      speed: { at: [-0.2, Y + 0.25, 1.4], to: [SX, Y, 0.1], fov: 34 },
    },
    update: (env) => {
      const n = now();
      if (n.hhmm !== shown) {
        shown = n.hhmm;
        gc.fillStyle = '#000'; gc.fillRect(0, 0, 96, 96);
        bigTime(gc, 96, 96, n.hhmm, '#fff', 800, 0.34);
        mask = gc.getImageData(0, 0, 96, 96).data;
      }
      // At its real rate the fibre swings thousands of times a second and draws dozens of pictures in that time:
      // the eye sees a still picture, and the fibre as a blur. Each frame catches it somewhere in its swing.
      if (env.view === 'speed') {
        if (!steady) { pc.fillStyle = '#000'; pc.fillRect(0, 0, 256, 256); paintSpan(0, OUT, 0.95); paint.tex.needsUpdate = true; steady = true; }
        const [u, v] = swing(Math.random() * OUT);
        for (let i = 0; i < SEGS; i++) { const s = (i + 0.5) / SEGS, k = s * s; fib.put(i, AX + TL + s * FL, Y + v * RMAX * k, 0.1 + u * RMAX * k); }
        fib.done();
        tipGlow.position.set(AX + TL + FL, Y + v * RMAX, 0.1 + u * RMAX); tipGlow.material.opacity = 0.6;
        (ray.line.material as THREE.LineBasicMaterial).opacity = 0;
        last = env.t;
        return;
      }
      steady = false;
      const ph = env.t % FRAME;
      // the first time round, the trace of the last whole picture is already on the screen, fading
      if (last < 0) { paintSpan(0, OUT, 0.45); last = env.t - Math.min(ph, 0.05); }
      const dt = Math.min(0.1, Math.max(0, env.t - last)), ph0 = Math.max(0, ph - dt);
      last = env.t;
      const [u, v] = swing(ph);
      // the fibre bends most near its free end, as a rod held at one end does
      for (let i = 0; i < SEGS; i++) {
        const s = (i + 0.5) / SEGS, k = s * s;
        fib.put(i, AX + TL + s * FL, Y + v * RMAX * k, 0.1 + u * RMAX * k);
      }
      fib.done();
      const tip: V3 = [AX + TL + FL, Y + v * RMAX, 0.1 + u * RMAX];
      tipGlow.position.set(...tip);
      // the lens turns the swing of the tip upside down and makes it larger on the screen
      const hit: V3 = [SX - 0.02, Y - v * (SW * 0.46), 0.1 - u * (SW * 0.46)];
      // the lasers are lit only where the spot is over a part of a figure, and the ring down is dark
      const on = ph < OUT && lit(u, v);
      ray.aim(tip, on ? hit : tip);
      (ray.line.material as THREE.LineBasicMaterial).opacity = on ? 0.85 : 0;
      tipGlow.material.opacity = on ? 0.9 : 0.25;
      // the screen keeps a fading trace, as the eye would of a picture drawn faster than this
      pc.fillStyle = `rgba(0,0,0,${1 - Math.exp(-dt * 0.22)})`; pc.fillRect(0, 0, 256, 256);
      if (ph0 < ph) paintSpan(ph0, ph, 0.95);
      paint.tex.needsUpdate = true;
    },
  };
}
