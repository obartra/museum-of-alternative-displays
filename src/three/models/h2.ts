import { G, M, glows, halo, lamps, screen, spline, THREE, type Built, type P2, type V3 } from '../kit';
import { feet, jewel, meshMat, meshTexture, screws, vents } from '../parts';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SEG, SEG_LINES, bigTime, clockStrokes, dotMatrix, dots, now, segClock } from '../../sims/draw';

const UP = new THREE.Vector3(0, 1, 0);

/** A colour to build a part in when the part is going to be welded: only the colour of its material is kept. */
const ink = (c: number) => new THREE.MeshBasicMaterial({ color: c });
const put = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => { o.position.set(x, y, z); return o; };
/** A bent wire through the points, with only as many sides as a thin lead needs. */
const cord = (pts: V3[], r: number, mat: THREE.Material, seg = 24, sides = 5) =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.35), seg, r, sides), mat);
/** The outline of a plate with rounded corners, for cutting or extruding. */
function rounded(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r, q = Math.PI / 2;
  s.absarc(x, -y, r, -q, 0, false); s.absarc(x, y, r, 0, q, false); s.absarc(-x, y, r, q, 2 * q, false); s.absarc(-x, -y, r, 2 * q, 3 * q, false);
  return s;
}
/** A flat plate with rounded corners and square edges, facing +z. Far lighter than the kit's bevelled slab. */
const sheetOf = (w: number, h: number, r: number, t: number, mat: THREE.Material, corner = 4) =>
  new THREE.Mesh(new THREE.ExtrudeGeometry(rounded(w, h, r), { depth: t, bevelEnabled: false, curveSegments: corner }).translate(0, 0, -t / 2), mat);
/** Small domed screw heads standing along +y, made to be welded. */
function studs(at: V3[], r: number, mat: THREE.Material): THREE.Group {
  const geo = new THREE.SphereGeometry(r, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1);
  return G.group(...at.map((p) => put(new THREE.Mesh(geo, mat), p[0], p[1], p[2])));
}
/** A ring of round section about the y axis, lighter than the kit's: for grommets, bails and getters. */
const hoop = (r: number, tube: number, mat: THREE.Material, arc = Math.PI * 2) => new THREE.Mesh(new THREE.TorusGeometry(r, tube, 6, Math.max(8, Math.round(arc * 5)), arc).rotateX(Math.PI / 2), mat);

/**
 * One mesh from many parts. Each part keeps the colour of the material it was built with, carried on its vertices,
 * so a whole assembly of one finish costs a single draw call. The parts are welded where they stand.
 */
function weld(mat: THREE.MeshStandardMaterial, ...parts: THREE.Object3D[]): THREE.Mesh {
  const geos: THREE.BufferGeometry[] = [], m4 = new THREE.Matrix4();
  const take = (src: THREE.BufferGeometry, to: THREE.Matrix4, c: THREE.Color) => {
    const g = (src.index ? src.toNonIndexed() : src.clone()).applyMatrix4(to);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    const col = new Float32Array(g.attributes.position.count * 3);
    for (let i = 0; i < col.length; i += 3) { col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geos.push(g);
  };
  for (const p of parts) {
    p.updateMatrixWorld(true);
    p.traverse((o) => {
      const m = o as THREE.InstancedMesh;
      if (!m.isMesh) return;
      const c = ((Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial).color;
      if (m.isInstancedMesh) for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, m4); take(m.geometry, m4.premultiply(m.matrixWorld), c); }
      else take(m.geometry, m.matrixWorld, c);
    });
  }
  mat.color.set(0xffffff); mat.vertexColors = true;
  return new THREE.Mesh(G.merge(geos), mat);
}

/** Hexagon bolt heads on their washers, standing out along `face` (or against it, with `sign` -1). Made to be welded. */
function bolts(at: V3[], r: number, face: 'x' | 'y' | 'z' = 'y', sign = 1, c = 0xb9bcc0): THREE.Group {
  const out = G.group(), mat = ink(c);
  for (const p of at) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(r, r, r * 0.7, 6), mat); head.position.y = r * 0.5;
    const washer = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.5, r * 0.16, 14), mat); washer.position.y = r * 0.08;
    const g = G.group(head, washer);
    if (face === 'x') g.rotation.z = (-sign * Math.PI) / 2; else if (face === 'z') g.rotation.x = (sign * Math.PI) / 2; else if (sign < 0) g.rotation.x = Math.PI;
    g.position.set(p[0], p[1], p[2]);
    out.add(g);
  }
  return out;
}

/** Enamelled copper wire wound turn beside turn, as a colour and a relief: `turns` of them across one unit of u. */
function winding(turns: number): THREE.MeshStandardMaterial {
  const s = screen(64, 4), c = s.ctx;
  for (let x = 0; x < 64; x++) { const v = Math.round(60 + 195 * Math.sin((((x % 16) + 0.5) / 16) * Math.PI)); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(x, 0, 1, 4); }
  s.tex.wrapS = s.tex.wrapT = THREE.RepeatWrapping; s.tex.repeat.set(turns / 4, 1); s.tex.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ color: 0xcf7d46, map: s.tex, bumpMap: s.tex, bumpScale: 0.7, metalness: 0.7, roughness: 0.36 });
}

/**
 * The mirror a getter leaves on the glass when it is fired: bright metal in the middle, thinning to brown at the edge.
 * It is the mark of a sealed vacuum. The shape given is the patch of glass it covers.
 */
function getterFlash(patch: THREE.BufferGeometry): THREE.Mesh {
  const s = screen(64, 64), c = s.ctx, g = c.createRadialGradient(32, 32, 4, 32, 32, 32);
  g.addColorStop(0, 'rgba(226,230,232,.96)'); g.addColorStop(0.55, 'rgba(196,198,196,.9)'); g.addColorStop(0.8, 'rgba(120,98,72,.55)'); g.addColorStop(1, 'rgba(90,66,40,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64); s.tex.needsUpdate = true;
  const m = new THREE.Mesh(patch,
    new THREE.MeshStandardMaterial({ map: s.tex, transparent: true, depthWrite: false, metalness: 1, roughness: 0.1, side: THREE.DoubleSide }));
  m.renderOrder = -1;
  return m;
}

/** Cathode ray tube: a bare picture tube on a cradle, wired up and running. One beam paints the whole face, line by line. */
export function crt(): Built {
  const root = G.group(), tube = G.group();
  // AX is the height of the tube's axis, ZT where its face stands. The tube is built face down along y, then laid over.
  const AX = 1.14, ZT = 1.55;
  tube.rotation.x = -Math.PI / 2; tube.position.set(0, AX, ZT);
  const lay = (kids: THREE.Object3D[]) => { const g = G.group(...kids); g.rotation.copy(tube.rotation); g.position.copy(tube.position); return g; };
  const at = (x: number, y: number, z: number): V3 => [x, AX + z, ZT - y];
  // Parts by finish, to be welded: those built in the tube's own space, and those built where they stand. The parts on
  // the neck are welded apart from the rest: a small mesh is left out of the floor's mirror when it is out of sight.
  const tGun: THREE.Object3D[] = [], tNeck: THREE.Object3D[] = [], tMetal: THREE.Object3D[] = [], tPaint: THREE.Object3D[] = [], tSoft: THREE.Object3D[] = [];
  const metal: THREE.Object3D[] = [], paint: THREE.Object3D[] = [], soft: THREE.Object3D[] = [];
  const nickel = ink(0xc6cace), steel = ink(0x9aa0a6), brass = ink(0xb08d4a), grey = ink(0x5d6668), china = ink(0xe6e3d8);
  const black = ink(0x17181a), bakelite = ink(0x1b140f), felt = ink(0x202020);

  // the glass: faceplate, funnel, neck
  const bulb: P2[] = [[0, 0], [0.45, 0.028], [0.8, 0.1], [0.96, 0.2], [1.0, 0.33], [0.97, 0.46], [0.8, 0.9], [0.52, 1.42], [0.27, 1.82], [0.16, 2.0, 1], [0.16, 2.86, 1], [0.14, 2.96], [0, 2.98]];
  const wall = spline(bulb, 4);
  const rAt = (y: number): number => {
    let i = 1; while (i < wall.length - 1 && wall[i][1] < y) i++;
    const [r0, y0] = wall[i - 1], [r1, y1] = wall[i];
    return r0 + (r1 - r0) * Math.min(1, Math.max(0, (y - y0) / (y1 - y0 || 1)));
  };
  // a skin that follows the wall from y0 to y1, `off` outside it
  const skin = (y0: number, y1: number, off: number, n: number): P2[] => Array.from({ length: n + 1 }, (_, i) => { const y = y0 + ((y1 - y0) * i) / n; return [rAt(y) + off, y]; });
  tube.add(G.lathe(wall, M.bulb(0x9fb1ae, 0.78), 80));
  // Inside, the wall is coated: aluminium over the back of the screen and the first of the funnel, graphite from there
  // to the gun. Through the bare glass behind the rim the aluminium shows as a mirror.
  const alu = new THREE.MeshStandardMaterial({ color: 0xc9cdd0, metalness: 1, roughness: 0.2, side: THREE.DoubleSide });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x08090a, roughness: 0.12, metalness: 0, side: THREE.DoubleSide });
  tube.add(G.lathe([[0.94, 0.21], ...skin(0.27, 0.6, -0.026, 6)], alu, 64), G.lathe([...skin(0.6, 2.0, -0.026, 14), [0.134, 2.14]], graphite, 56));
  // Outside, a coat of graphite is painted on between the rim and the yoke, and left off round the anode button.
  const PHI = 0.96, AY = 1.14, C0 = 0.66, C1 = 1.67;
  const dag = screen(512, 128), dc = dag.ctx;
  dc.fillStyle = '#343637'; dc.fillRect(0, 0, 512, 128);
  // it went on with a brush while the bulb turned, and the strokes still show
  for (let i = 0; i < 90; i++) { dc.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.14)'; dc.fillRect(0, (i * 53) % 128, 512, 1 + (i % 3)); }
  dc.globalCompositeOperation = 'destination-out'; dc.fillStyle = '#000';
  for (let x = 0; x < 512; x += 3) { dc.fillRect(x, 0, 3, 2 + 5 * Math.abs(Math.sin(x * 1.7) * Math.sin(x * 0.31))); dc.fillRect(x, 126 - 4 * Math.abs(Math.sin(x * 2.3 + 1)), 3, 8); }
  dc.beginPath(); dc.ellipse((PHI / (2 * Math.PI)) * 512, (1 - (AY - C0) / (C1 - C0)) * 128, 36, 33, 0, 0, 7); dc.fill();
  dc.globalCompositeOperation = 'source-over'; dag.tex.needsUpdate = true;
  tube.add(G.lathe(skin(C0, C1, 0.004, 20), new THREE.MeshStandardMaterial({ map: dag.tex, alphaTest: 0.5, roughness: 0.94, metalness: 0.1, side: THREE.DoubleSide }), 72));

  // The screen. By day an unlit screen is grey, not black: white powder behind tinted glass, and the picture is light
  // added to that grey. Drawn at twice the size it is laid out in, so that the lines of the raster hold up from close to.
  const face = screen(1024, 1024);
  const powder = M.lit(face, 1.5, 0.9); powder.color.set(0x4a4d4b); powder.roughness = 0.7;
  const phosphor = G.dish(0.94, 0.17, powder, [0, 0.21, 0]);
  phosphor.rotation.x = Math.PI / 2;
  tube.add(phosphor);

  // the rim band: a steel strap on a felt liner, drawn tight by one bolt, with an ear each side for the posts
  tMetal.push(G.lathe([[1.004, 0.27], [1.02, 0.285], [1.02, 0.4], [1.004, 0.415]], steel, 80));
  tSoft.push(G.lathe([[0.985, 0.245], [1.01, 0.25], [1.01, 0.435], [0.975, 0.44]], felt, 80));
  for (const s of [-1, 1]) tMetal.push(G.box(0.07, 0.13, 0.17, steel, [s * 1.045, 0.3425, 0], 0), G.box(0.024, 0.11, 0.11, steel, [s * 0.05, 0.3425, 1.065], 0));
  tMetal.push(G.rod([-0.1, 0.3425, 1.08], [0.1, 0.3425, 1.08], 0.014, nickel, 8), bolts([[-0.062, 0.3425, 1.08]], 0.03, 'x', -1), bolts([[0.062, 0.3425, 1.08]], 0.03, 'x'));

  // The anode button, where the high voltage goes in through the glass, under its rubber suction cap.
  const k = (rAt(AY + 0.02) - rAt(AY - 0.02)) / 0.04, kn = Math.hypot(1, k);
  const out = new THREE.Vector3(Math.sin(PHI) / kn, -k / kn, Math.cos(PHI) / kn);
  const cap = G.lathe(spline([[0.172, -0.035], [0.17, 0.004], [0.12, 0.022], [0.075, 0.05], [0.055, 0.085], [0.03, 0.098], [0, 0.1]], 3), ink(0x8a2a1c), 24);
  cap.position.set(Math.sin(PHI) * rAt(AY), AY, Math.cos(PHI) * rAt(AY)); cap.quaternion.setFromUnitVectors(UP, out);
  tSoft.push(cap);
  const tip = cap.position.clone().addScaledVector(out, 0.07);

  // Deflection yoke. The saddle coils that sweep the lines lie against the glass, and their end turns swell out in front
  // and behind. Round their middle sits a ferrite ring wound with the coils that move the beam down the screen.
  const front = spline([[rAt(1.7) + 0.012, 1.7], [0.405, 1.7], [0.445, 1.73], [0.45, 1.785], [0.42, 1.835], [0.395, 1.855]], 4);
  const core = spline([[0.395, 1.855], [0.418, 1.87], [0.415, 1.905], [0.375, 2.0], [0.355, 2.04], [0.342, 2.05]], 4);
  const rear = spline([[0.342, 2.05], [0.352, 2.07], [0.346, 2.115], [0.31, 2.145], [0.24, 2.15]], 4);
  // a piece of a turned shape, from a0 to a1 round the axis. `along` is how many turns of wire lie along the profile:
  // given, the wire runs round the axis, as in an end turn. Left out, it runs along the profile, as on the ring.
  const arc = (pts: [number, number][], a0: number, a1: number, along?: number): THREE.BufferGeometry => {
    const geo = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), Math.round((a1 - a0) * 10), a0, a1 - a0), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); if (along) uv.setXY(i, (v * along) / 220, u); else uv.setXY(i, (u * (a1 - a0)) / (2 * Math.PI), v); }
    return geo;
  };
  const Q = Math.PI / 2;
  tube.add(new THREE.Mesh(G.merge([arc(front, -1.48, 1.48, 22), arc(front, Math.PI - 1.48, Math.PI + 1.48, 22), arc(rear, -1.48, 1.48, 12), arc(rear, Math.PI - 1.48, Math.PI + 1.48, 12),
    arc(core, -1.2, 1.2), arc(core, Math.PI - 1.2, Math.PI + 1.2)]), winding(220)));
  // under the wire, the moulded body that carries it, ending in the collar that clamps the yoke to the neck
  tNeck.push(G.lathe([...front, ...core.slice(1), ...rear.slice(1)].filter((_, i) => i % 2 === 0).map(([r, y]) => [r - 0.012, y] as P2).concat([[0.222, 2.15], [0.222, 2.22], [0.166, 2.22]]), black, 40));
  // the two halves of the ring are held together by a spring clip on each side, and the tag strip sits by one of them
  for (const s of [-1, 1]) { const clip = G.box(0.02, 0.2, 0.07, steel, [s * 0.403, 1.95, 0], 0); clip.rotation.z = s * 0.4; tGun.push(clip); }
  // the tag strip stands on the clip of one side, tilted with the ring: [radius, y] of each of its four tags
  const board = G.box(0.02, 0.2, 0.12, ink(0x6b4426), [-0.428, 1.95, 0], 0); board.rotation.set(0, Math.PI, 0.4);
  tNeck.push(board);
  const tags = [-1.5, -0.5, 0.5, 1.5].map((i): [number, number] => [0.446 - i * 0.045 * 0.39, 1.95 + i * 0.045 * 0.92]);
  for (const [r, y] of tags) tGun.push(G.box(0.024, 0.02, 0.03, brass, [-r, y, 0], 0));
  // behind the yoke, two magnet rings with finger tabs, turned by hand to centre the picture
  [2.236, 2.258].forEach((y, i) => {
    const a = i ? -0.6 : 0.5, tab = G.box(0.04, 0.012, 0.07, ink(0xa4a8ac), [Math.sin(a) * 0.25, y + 0.006, Math.cos(a) * 0.25], 0); tab.rotation.y = a;
    tGun.push(G.lathe([[0.168, y], [0.226, y], [0.226, y + 0.012], [0.168, y + 0.012]], ink(0xa4a8ac), 28), tab);
  });

  // The gun, seen through the clear neck. From the base: the heater in its cathode, the control grid, the screen grid,
  // the focus cylinder and the anode, all strapped to three glass rods. Springs on the anode touch the coating of the wall.
  for (const [y, h, r] of [[2.3, 0.2, 0.086], [2.5, 0.12, 0.07], [2.44, 0.014, 0.09], [2.56, 0.014, 0.09], [2.625, 0.05, 0.086], [2.745, 0.11, 0.086]] as const) tGun.push(G.cyl(r, h, nickel, [0, y, 0], 20));
  for (const a of [0, 2.09, 4.19]) {
    const c = Math.cos(a), s = Math.sin(a), c2 = Math.cos(a + 1.05), s2 = Math.sin(a + 1.05);
    tPaint.push(G.rod([c * 0.118, 2.26, s * 0.118], [c * 0.118, 2.84, s * 0.118], 0.015, china, 8));
    for (const y of [2.36, 2.47, 2.53, 2.625, 2.72, 2.77]) { const strap = G.box(0.05, 0.012, 0.022, nickel, [c * 0.102, y, s * 0.102], 0); strap.rotation.y = -a; tGun.push(strap); }
    tGun.push(cord([[c2 * 0.086, 2.26, s2 * 0.086], [c2 * 0.124, 2.3, s2 * 0.124], [c2 * 0.134, 2.34, s2 * 0.134], [c2 * 0.112, 2.385, s2 * 0.112]], 0.006, nickel, 10, 4));
  }
  // the leads come up through the glass of the stem from the pins. Only seven of the twelve places on the base are used.
  const PINS = [0, 1, 2, 5, 9, 10, 11].map((n) => (n / 12) * Math.PI * 2);
  const ends: [number, number][] = [[0.086, 2.8], [0.016, 2.875], [0.03, 2.86], [0.086, 2.65], [0.09, 2.567], [0.086, 2.8], [0.016, 2.875]];
  PINS.forEach((a, i) => {
    const c = Math.cos(a), s = Math.sin(a), [r, y] = ends[i];
    tGun.push(G.rod([c * 0.1, 2.95, s * 0.1], [c * r, y, s * r], 0.006, nickel, 5), G.rod([c * 0.12, 3.06, s * 0.12], [c * 0.12, 3.17, s * 0.12], 0.013, nickel, 8));
  });
  // the getter, a ring of barium fired once the tube was sealed, and the mirror it left on the glass below
  tGun.push(put(hoop(0.03, 0.006, nickel).rotateX(Q), 0, 2.36, -0.116), G.rod([0, 2.34, -0.084], [0.03, 2.36, -0.116], 0.005, nickel, 5));
  tube.add(put(getterFlash(new THREE.CylinderGeometry(0.148, 0.148, 0.3, 24, 1, true, Math.PI - 1.1, 2.2)), 0, 2.4, 0));
  tPaint.push(put(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.012, 16), china), 0, 2.803, 0));
  // the cathode at the back of the gun, kept hot by its heater: the one part of the works that glows
  tube.add(G.cyl(0.032, 0.08, M.glow(0xff7a2a, 1.5), [0, 2.835, 0], 16), halo(0xff6a20, 0.42, [0, 2.85, 0], 0.55));
  // base and socket
  tNeck.push(G.cyl(0.19, 0.13, bakelite, [0, 3.005, 0], 24), put(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), bakelite), 0, 3.12, 0), G.cyl(0.17, 0.06, ink(0x5a341d), [0, 3.17, 0], 24));

  // The cradle: a plate, a post each side bolted to the ears of the rim band, and a bracket that takes the yoke.
  const PZ = ZT - 0.3425, BZ = ZT - 2.185;
  const plate = G.slab(2.3, 3.5, 0.09, 0.08, grey, [0, 0.04, 0], 0.012); plate.rotation.x = -Q;
  paint.push(plate);
  for (const s of [-1, 1]) {
    const web = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-s * 0.19, 0), new THREE.Vector2(0, 0.4)]);
    paint.push(G.profile([[-0.27, 0.08], [0.27, 0.08], [0.13, 1.3], [-0.13, 1.3]], 0.06, grey, [s * 1.1, 0, PZ], 0.014), G.box(0.22, 0.04, 0.62, grey, [s * 0.975, 0.1, PZ], 0.008), G.extruded(web, 0.03, grey, [s * 1.07, 0.12, PZ], 0.004));
    metal.push(bolts([[s * 0.95, 0.12, PZ - 0.21], [s * 0.95, 0.12, PZ + 0.21]], 0.034), bolts([[s * 1.13, AX, PZ]], 0.05, 'x', s));
  }
  const yokeRest = new THREE.Shape();
  yokeRest.moveTo(-0.2, 0.08); yokeRest.lineTo(0.2, 0.08); yokeRest.lineTo(0.15, 0.7); yokeRest.lineTo(0.31, 0.98); yokeRest.lineTo(0.31, AX + 0.03); yokeRest.lineTo(0.232, AX + 0.03);
  yokeRest.absarc(0, AX, 0.232, 0, Math.PI, true); yokeRest.lineTo(-0.232, AX + 0.03); yokeRest.lineTo(-0.31, AX + 0.03); yokeRest.lineTo(-0.31, 0.98); yokeRest.lineTo(-0.15, 0.7);
  paint.push(G.extruded(yokeRest, 0.07, grey, [0, 0, BZ], 0.012), G.box(0.66, 0.04, 0.3, grey, [0, 0.1, BZ], 0.008));
  metal.push(bolts([[-0.26, 0.12, BZ], [0.26, 0.12, BZ]], 0.034), bolts([[-0.271, AX + 0.03, BZ], [0.271, AX + 0.03, BZ]], 0.024));
  // a wire bail over the yoke's collar holds it down in the bracket
  metal.push(put(hoop(0.238, 0.011, steel, Math.PI).rotateX(-Q), 0, AX, BZ));

  // Wiring. The high voltage comes up through a porcelain bushing to the anode cap. The yoke's four leads and the
  // leads of the socket go down through grommets in the plate.
  const HV: V3 = [0.93, 0.08, -0.2], start = at(tip.x, tip.y, tip.z);
  paint.push(put(G.lathe(spline([[0.1, 0], [0.1, 0.022, 1], [0.06, 0.03], [0.086, 0.07], [0.06, 0.11], [0.086, 0.15], [0.06, 0.19], [0.086, 0.23], [0.055, 0.27], [0.04, 0.32, 1], [0, 0.32]], 3), china, 20), ...HV));
  metal.push(G.cyl(0.018, 0.09, brass, [HV[0], 0.44, HV[2]], 8), bolts([[HV[0], 0.4, HV[2]]], 0.03, 'y', 1, 0xb08d4a));
  soft.push(cord([start, [start[0] + 0.2, start[1] + 0.03, start[2] - 0.1], [1.03, 1.42, 0.1], [1.07, 0.95, -0.08], [1.03, 0.6, -0.17], [HV[0] + 0.02, 0.455, HV[2]]], 0.02, ink(0xa3231a), 44, 6));
  const GY: V3 = [-0.74, 0.08, ZT - 1.93], GS: V3 = [0, 0.08, -1.58];
  tags.forEach(([r, y], i) => {
    const p = at(-r - 0.01, y, 0), o = (i - 1.5) * 0.022;
    soft.push(cord([p, [p[0] - 0.12, p[1] + 0.02, p[2]], [-0.76, 0.8, GY[2] + o], [GY[0] + o, 0.08, GY[2] + o]], 0.011, ink([0xb02a20, 0x2a57b0, 0xd9b21c, 0x2f8a3a][i]), 24, 4));
  });
  [0xd9b21c, 0x2f8a3a, 0xd8d8d0, 0x6a4024, 0x2a57b0, 0xb02a20].forEach((c, i) => {
    const a = (i - 2.5) * 0.42, o = (i - 2.5) * 0.016;
    soft.push(cord([[Math.sin(a) * 0.13, AX - Math.cos(a) * 0.13, ZT - 3.19], [Math.sin(a) * 0.14, AX - Math.cos(a) * 0.2, ZT - 3.25], [o * 2, 0.62, -1.69], [o, 0.08, GS[2]]], 0.011, ink(c), 24, 4));
  });
  for (const p of [GY, GS]) soft.push(put(hoop(0.055, 0.02, ink(0x151515)), ...p));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) soft.push(put(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.04, 12), ink(0x151515)), sx * 1.03, -0.02, sz * 1.63));

  root.add(tube, weld(M.steel(), lay(tGun)), weld(M.steel(), lay(tMetal), ...metal), weld(M.enamel(0xffffff), lay(tPaint), ...paint),
    weld(M.plastic(0xffffff, 0.6), lay(tNeck)), weld(M.plastic(0xffffff, 0.6), lay(tSoft), ...soft));
  // the light the beam has just laid down, fading upwards: drawn once, and stretched across the raster on every frame
  const wake = document.createElement('canvas'); wake.width = 1; wake.height = 70;
  const wc = wake.getContext('2d')!, fade = wc.createLinearGradient(0, 0, 0, 70);
  fade.addColorStop(0, 'rgba(190,220,255,0)'); fade.addColorStop(1, 'rgba(190,220,255,.32)');
  wc.fillStyle = fade; wc.fillRect(0, 0, 1, 70);
  return {
    root, inDark: 'glows', glow: 0xbfd8ff, view: [30, 12], surface: face.canvas,
    views: {
      // far enough back that the whole face fits a narrow frame
      seat: { at: [0, 1.2, ZT + 5.2], to: [0, AX, ZT] },
      raster: { at: [0.45, 1.25, ZT + 0.9], to: [0.1, AX, ZT - 0.02], play: 0.4 },
      // from behind and to one side, on the side the yoke's leads come down
      gun: { at: [-1.45, 1.62, ZT - 3.2], to: [0, AX, ZT - 2.42] },
    },
    update: ({ t }) => {
      const c = face.ctx, n = now();
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.fillStyle = '#020303'; c.fillRect(0, 0, 512, 512);
      const X = 82, Y = 126, W = 348, H = 260;
      c.save(); c.beginPath(); c.roundRect(X, Y, W, H, 30); c.clip();
      c.fillStyle = '#0a1016'; c.fillRect(X, Y, W, H);
      c.save(); c.translate(X, Y); bigTime(c, W, H, n.hhmmss, '#e6f1ff', 800, 0.46); c.restore();
      // the raster: dark gaps between lines, and a band the beam has just refreshed
      c.fillStyle = 'rgba(0,0,0,.34)';
      for (let y = Y; y < Y + H; y += 4) c.fillRect(X, y + 2, W, 2);
      const by = Y + ((t * 0.8) % 1) * (H + 80) - 40;
      c.drawImage(wake, X, by - 70, W, 70);
      c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(X + ((t * 37) % 1) * W, by, 26, 2);
      c.restore();
      face.tex.needsUpdate = true;
    },
  };
}

/** A turned control knob with a skirt and a pointer line, shaft along +z, turned to `angle`. Light enough to weld by the dozen. */
function dial(r: number, x: number, y: number, z: number, angle: number, body: THREE.Material, mark: THREE.Material): THREE.Group {
  const k = G.lathe([[r * 1.25, 0], [r * 1.25, r * 0.12, 1], [r * 1.02, r * 0.3, 1], [r * 0.88, r * 1.1], [r * 0.8, r * 1.18, 1], [0, r * 1.18]], body, 18);
  k.rotation.x = Math.PI / 2;
  const g = G.group(k, G.box(r * 0.12, r * 0.62, r * 0.05, mark, [0, r * 0.52, r * 1.19], 0));
  g.rotation.z = angle; g.position.set(x, y, z);
  return g;
}

/** A toggle switch on a hexagon nut, its bat up or down, standing out along +z. Made to be welded. */
function lever(x: number, y: number, z: number, up: boolean, mat: THREE.Material): THREE.Group {
  const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.013, 0.1, 8).translate(0, 0.065, 0), mat); bat.rotation.x = up ? -0.45 : 0.45;
  const g = G.group(new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.02, 6).translate(0, 0.01, 0), mat), new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 8).translate(0, 0.03, 0), mat), bat);
  g.rotation.x = Math.PI / 2; g.position.set(x, y, z);
  return g;
}

/** Vector display: a laboratory console whose beam draws lines directly, like a pen. A light pen lies on the shelf. */
export function vector(): Built {
  const root = G.group();
  const green = ink(0x6f857b), black = ink(0x1f2225), chrome = ink(0xd9dde0), rubber = ink(0x151515);
  const paint: THREE.Object3D[] = [], soft: THREE.Object3D[] = [], metal: THREE.Object3D[] = [];
  const Q = Math.PI / 2;
  // the cabinet: an enamelled cover over a black front panel held by four screws
  paint.push(G.rbox(2.2, 1.7, 1.455, 0.07, green, [0, 0.97, -0.2275]));
  soft.push(G.box(2.02, 1.52, 0.05, black, [0, 0.97, 0.49], 0.012));
  metal.push(bolts([[-0.95, 1.67, 0.515], [0.95, 1.67, 0.515], [-0.95, 0.27, 0.515], [0.95, 0.27, 0.515]], 0.02, 'z'));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) soft.push(G.cyl(0.08, 0.12, rubber, [sx * 0.97, 0.06, sz * 0.62], 14, 0.068));
    metal.push(bolts([-0.8, -0.25, 0.3].map((z): V3 => [sx * 1.1, 0.24, z]), 0.016, 'x', sx));
  }
  const cx = -0.31, cy = 1.0;
  const scope = screen(1024, 1024);
  scope.ctx.setTransform(2, 0, 0, 2, 0, 0);
  scope.ctx.fillStyle = '#010502'; scope.ctx.fillRect(0, 0, 512, 512);
  // A deep hood keeps room light off the phosphor, which by day is a pale powder and not black. A chromed ring and
  // four screws hold the hood to the panel.
  const hood = G.lathe([[0.668, 0], [0.668, 0.04], [0.662, 0.3], [0.65, 0.335], [0.634, 0.31], [0.615, 0.02]], ink(0x15171a), 64);
  hood.rotation.x = Q; hood.position.set(cx, cy, 0.51);
  soft.push(hood);
  const ring = G.lathe([[0.668, 0], [0.696, 0], [0.696, 0.012], [0.688, 0.022], [0.668, 0.022]], chrome, 64); ring.rotation.x = Q; ring.position.set(cx, cy, 0.515);
  metal.push(ring, bolts([0.785, 2.356, 3.927, 5.498].map((a): V3 => [cx + Math.cos(a) * 0.682, cy + Math.sin(a) * 0.682, 0.537]), 0.009, 'z'));
  const face = M.lit(scope, 1.5, 0.9); face.color.set(0x2a322c); face.roughness = 0.6;
  root.add(G.dish(0.61, 0.06, face, [cx, cy, 0.52]));
  // Controls on a brushed plate: intensity, focus, X and Y position, then the switches. Their legends are engraved.
  const px = 0.72;
  metal.push(G.box(0.5, 1.36, 0.02, ink(0xb6babd), [px, 0.97, 0.52], 0.006), bolts([[px - 0.21, 1.6, 0.53], [px + 0.21, 1.6, 0.53], [px - 0.21, 0.34, 0.53], [px + 0.21, 0.34, 0.53]], 0.012, 'z'));
  const NAMES = ['INT', 'FOC', 'X', 'Y'];
  const plate = screen(256, 696), pc = plate.ctx;
  pc.clearRect(0, 0, 256, 696);
  pc.strokeStyle = pc.fillStyle = 'rgba(16,17,18,.9)'; pc.textAlign = 'center'; pc.textBaseline = 'middle'; pc.font = '600 26px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';
  // the plate is 0.5 by 1.36: 512 dots to the unit, and its middle is at (px, 0.97)
  const U = (x: number) => 128 + (x - px) * 512, V = (v: number) => 348 - (v - 0.97) * 512;
  NAMES.forEach((name, i) => {
    const ky = 1.48 - i * 0.25;
    for (let k = 0; k <= 10; k++) { const a = Math.PI * (1.25 - k * 0.15), r0 = 0.105, r1 = k % 5 ? 0.118 : 0.128; pc.lineWidth = k % 5 ? 1.6 : 2.6; pc.beginPath(); pc.moveTo(U(px + Math.cos(a) * r0), V(ky + Math.sin(a) * r0)); pc.lineTo(U(px + Math.cos(a) * r1), V(ky + Math.sin(a) * r1)); pc.stroke(); }
    pc.fillText(name, U(px + 0.185), V(ky + 0.085));
    soft.push(dial(0.075, px, ky, 0.53, -(0.6 + i * 1.1), ink(0x16181a), ink(0xe9e6dc)));
  });
  for (let i = 0; i < 3; i++) { const tx = px - 0.14 + i * 0.14; pc.fillRect(U(tx) - 1.5, V(0.585) - 5, 3, 10); pc.beginPath(); pc.arc(U(tx), V(0.415), 3, 0, 7); pc.fill(); metal.push(lever(tx, 0.5, 0.53, i !== 1, chrome)); }
  plate.tex.needsUpdate = true;
  const legends = G.plane(0.5, 1.36, new THREE.MeshStandardMaterial({ map: plate.tex, transparent: true, roughness: 0.6 }), [px, 0.97, 0.5306]); legends.userData.noShadow = true;
  root.add(legends, jewel(0xff3b1e, 0.03, [px, 0.36, 0.53]));
  const side = vents(0.9, 0.5, 9, [1.101, 1.3, -0.25]); side.rotation.y = Q;
  const side2 = vents(0.9, 0.5, 9, [-1.101, 1.3, -0.25]); side2.rotation.y = Q;
  root.add(side, side2);
  // The back: three coaxial sockets for the X, Y and brightness signals, a fuse, the rating plate, louvres, and the
  // mains lead, which goes down and away under the cabinet.
  const rear = screen(512, 392), rc = rear.ctx;
  rc.clearRect(0, 0, 512, 392);
  const RU = (x: number) => 256 - x * 232.7, RV = (v: number) => 196 - (v - 0.97) * 232.7;    // 2.2 by 1.7, seen from behind
  rc.fillStyle = 'rgba(10,11,12,.92)'; for (let i = 0; i < 9; i++) rc.fillRect(RU(0.55), RV(1.62 - i * 0.06), 1.1 * 232.7, 7);
  rc.fillStyle = '#c9ccc8'; rc.fillRect(RU(-0.25), RV(0.88), 0.6 * 232.7, 0.22 * 232.7);
  rc.fillStyle = rc.strokeStyle = 'rgba(20,21,22,.9)'; rc.lineWidth = 1.5; rc.strokeRect(RU(-0.25) + 4, RV(0.88) + 4, 0.6 * 232.7 - 8, 0.22 * 232.7 - 8);
  rc.textAlign = 'center'; rc.textBaseline = 'middle'; rc.font = '600 17px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';
  rc.fillText('DISPLAY UNIT', RU(-0.55), RV(0.815)); rc.fillText('115 V  60 CPS', RU(-0.55), RV(0.73));
  rc.fillStyle = 'rgba(240,240,232,.9)'; rc.font = '600 20px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';
  ['X', 'Y', 'Z'].forEach((name, i) => rc.fillText(name, RU(0.75 - i * 0.26), RV(0.93)));
  rc.fillText('FUSE', RU(0.75), RV(0.56));
  rear.tex.needsUpdate = true;
  const backFace = G.plane(2.2, 1.7, new THREE.MeshStandardMaterial({ map: rear.tex, transparent: true, roughness: 0.6 }), [0, 0.97, -0.9556]); backFace.rotation.y = Math.PI; backFace.userData.noShadow = true;
  root.add(backFace);
  for (let i = 0; i < 3; i++) metal.push(G.cyl(0.05, 0.016, chrome, [0.75 - i * 0.26, 0.8, -0.962], 6).rotateX(Q), G.cyl(0.03, 0.05, chrome, [0.75 - i * 0.26, 0.8, -0.975], 12).rotateX(Q));
  soft.push(G.cyl(0.04, 0.04, black, [0.75, 0.44, -0.972], 10).rotateX(Q), put(hoop(0.04, 0.016, rubber).rotateX(Q), -0.75, 0.42, -0.958));
  soft.push(cord([[-0.75, 0.42, -0.935], [-0.75, 0.39, -0.975], [-0.74, 0.12, -0.978], [-0.7, 0.03, -0.92], [-0.62, 0.025, -0.75]], 0.02, rubber, 20, 6));
  // writing shelf with a dark top
  paint.push(G.profile([[0.45, 0.12], [1.3, 0.12], [1.3, 0.2], [0.45, 0.36]], 2.2, green));
  soft.push(G.box(2.0, 0.02, 0.74, ink(0x2b3a34), [0, 0.292, 0.88], 0.004).rotateX(0.186));
  // The light pen lies on the shelf: an aluminium barrel with a lens at its tip, a knurled grip, and a cord from its
  // tail to a socket on the panel.
  const along = new THREE.Vector3(Math.cos(0.2), -0.185 * Math.sin(0.2), 0.983 * Math.sin(0.2)).normalize(), at = new THREE.Vector3(0.3, 0.322, 0.95);
  const pen = G.group(G.lathe([[0.012, -0.3], [0.024, -0.26], [0.03, -0.22, 1], [0.03, 0.2, 1], [0.02, 0.27], [0.013, 0.3, 1], [0, 0.3]], ink(0xb9bdc1), 14, true), G.cyl(0.033, 0.13, ink(0x101112), [0, 0.06, 0], 12));
  pen.quaternion.setFromUnitVectors(UP, along); pen.position.copy(at);
  const tail = at.clone().addScaledVector(along, -0.3);
  metal.push(pen, G.cyl(0.05, 0.014, chrome, [-0.86, 0.4, 0.522], 6).rotateX(Q));
  soft.push(G.cyl(0.026, 0.07, rubber, [-0.86, 0.4, 0.55], 10).rotateX(Q), cord([[tail.x, tail.y, tail.z], [tail.x - 0.12, tail.y + 0.012, tail.z - 0.03], [-0.36, 0.35, 0.8], [-0.74, 0.37, 0.7], [-0.86, 0.39, 0.6], [-0.86, 0.4, 0.57]], 0.012, rubber, 30, 6));
  root.add(weld(M.enamel(0xffffff), ...paint), weld(M.plastic(0xffffff, 0.5), ...soft), weld(M.steel(1), ...metal));
  return {
    root, inDark: 'glows', glow: 0x58ff8a, view: [24, 10], zoom: 0.9, surface: scope.canvas,
    views: {
      seat: { at: [-0.25, 1.3, 3], to: [cx, cy, 0.52], fov: 46 },
      trace: { at: [-0.05, 1.22, 1.5], to: [-0.3, 1.02, 0.55], play: 0.4 },
    },
    update: ({ t }) => {
      const c = scope.ctx, n = now();
      // phosphor persistence: old strokes fade instead of vanishing
      c.fillStyle = 'rgba(1,6,2,.3)'; c.fillRect(0, 0, 512, 512);
      c.save(); c.beginPath(); c.arc(256, 256, 250, 0, 7); c.clip();
      c.strokeStyle = '#7dffa2'; c.lineWidth = 3.4; c.lineCap = 'round'; c.shadowColor = '#3cff7a'; c.shadowBlur = 10;
      for (const [x0, y0, x1, y1] of clockStrokes(n)) { c.beginPath(); c.moveTo(256 + x0 * 210, 256 - y0 * 210); c.lineTo(256 + x1 * 210, 256 - y1 * 210); c.stroke(); }
      // a bouncing ball, after the first program most people saw on such a screen
      const u = (t * 0.22) % 1, bx = 70 + u * 372, by = 440 - Math.abs(Math.sin(u * Math.PI * 4)) * 150 * (1 - u * 0.75);
      c.fillStyle = '#c8ffd6'; c.beginPath(); c.arc(bx, by, 5, 0, 7); c.fill();
      c.restore();
      scope.tex.needsUpdate = true;
    },
  };
}

/** A knurled wheel: a disc with a toothed edge, its axis along z. */
function knurled(r: number, w: number, teeth: number, mat: THREE.Material): THREE.Mesh {
  const s = new THREE.Shape();
  for (let i = 0; i < teeth * 2; i++) { const a = (i / teeth) * Math.PI, q = i % 2 ? r : r * 0.93; if (i) s.lineTo(Math.cos(a) * q, Math.sin(a) * q); else s.moveTo(q, 0); }
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false }).translate(0, 0, -w / 2), mat);
}

/** What is engraved on the keys of a terminal, back row first. A space stands for a key with no letter or figure. */
const KEYS = ['1234567890:-', ' QWERTYUIOP', ' ASDFGHJKL;', ' ZXCVBNM,./'];
const keyX = (rows: number[], pitch: number, r: number, c: number) => (c - (rows[0] - 1) / 2) * pitch + (([0, 0.5, 0.75, 1.25, 0.5][r] ?? 0) - 0.5) * pitch * 0.9;

/**
 * The caps of a typewriter keyboard, made to be welded: staggered rows of tapered caps and a space bar, laid out as
 * the kit's keyboard is, back row first and the front edge at +z. Letter and figure keys are `cap`, the rest `other`.
 */
function keyCaps(rows: number[], pitch: number, space: number, cap: THREE.Material, other: THREE.Material): THREE.Group {
  const k = pitch * 0.84, h = pitch * 0.42, g = G.group();
  const geo = new RoundedBoxGeometry(k, h, k, 1, pitch * 0.09), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) { pos.setX(i, pos.getX(i) * 0.8); pos.setZ(i, pos.getZ(i) * 0.8 - pitch * 0.03); }
  rows.forEach((n, r) => { for (let c = 0; c < n; c++) g.add(put(new THREE.Mesh(geo, (KEYS[r]?.[c] ?? ' ') === ' ' ? other : cap), keyX(rows, pitch, r, c), h / 2 - r * pitch * 0.04, (r - (rows.length - 1) / 2) * pitch)); });
  if (space > 0) g.add(put(new THREE.Mesh(new RoundedBoxGeometry(space * pitch, h * 0.9, k, 1, pitch * 0.09), cap), 0, h * 0.4 - rows.length * pitch * 0.04, ((rows.length + 1) / 2) * pitch));
  return g;
}

/** The legends of those keys: one sheet of letters and figures lying on the tops of the caps. */
function keyLegends(rows: number[], pitch: number): THREE.Mesh {
  const W = (rows[0] + 1.5) * pitch, D = rows.length * pitch, s = screen(1024, Math.round((1024 * D) / W)), c = s.ctx, H = s.canvas.height;
  c.clearRect(0, 0, 1024, H);
  c.fillStyle = '#ece9df'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `600 ${Math.round((0.52 * pitch * 1024) / W)}px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif`;
  rows.forEach((n, r) => { for (let col = 0; col < n; col++) { const ch = KEYS[r]?.[col] ?? ' '; if (ch !== ' ') c.fillText(ch, (keyX(rows, pitch, r, col) / W + 0.5) * 1024, ((r + 0.5) / rows.length) * H); } });
  s.tex.needsUpdate = true;
  const m = G.plane(W, D, new THREE.MeshStandardMaterial({ map: s.tex, transparent: true, roughness: 0.6 }), [0, pitch * 0.42 - ((rows.length - 1) / 2) * pitch * 0.04 + 0.0015, -pitch * 0.03]);
  // the rows step down towards the front, so the sheet leans with them
  m.rotation.x = -Math.PI / 2 + 0.04; m.userData.noShadow = true;
  return m;
}

/** Storage tube terminal: lines stay lit on the screen itself until the whole face is flashed clean. */
export function storageTube(): Built {
  const root = G.group();
  const putty = ink(0xd6d0bd), dark = ink(0x24272a), black = ink(0x0b0c0d), Q = Math.PI / 2;
  const paint: THREE.Object3D[] = [], soft: THREE.Object3D[] = [];
  // pedestal on a plinth, with louvres for the power supply and a blank plate where a maker would put a name
  soft.push(G.box(1.2, 0.07, 1.15, dark, [0, 0.035, -0.1], 0.02), G.box(0.9, 0.012, 0.012, dark, [0, 1.0, 0.281], 0), G.box(0.1, 0.03, 0.01, ink(0xb9bdc1), [0, 1.12, 0.281], 0));
  paint.push(G.rbox(0.92, 1.24, 0.86, 0.04, putty, [0, 0.69, -0.15]));
  for (const sx of [-1, 1]) for (let i = 0; i < 10; i++) soft.push(G.box(0.012, 0.021, 0.56, black, [sx * 0.461, 0.5 + (i - 4.5) * 0.05, -0.15], 0));
  // the head: a deep shell, because the tube inside is as long as the screen is wide. It is slotted at the sides
  // and over the neck of the tube, where the heat comes off.
  paint.push(G.rbox(1.72, 1.2, 1.5, 0.09, putty, [0, 1.92, -0.1]));
  const s = screen(512, 384);
  soft.push(G.bezel(1.56, 1.06, 1.14, 0.88, 0.1, 0.1, dark, [0, 1.94, 0.66], 0.05, 0.02));
  root.add(G.bulge(1.22, 0.96, 0.035, M.lit(s, 1.15, 0.9), [0, 1.94, 0.656]));
  for (let i = 0; i < 8; i++) {
    for (const sx of [-1, 1]) soft.push(G.box(0.012, 0.019, 0.9, black, [sx * 0.861, 2.2 + (i - 3.5) * 0.045, -0.2], 0));
    soft.push(G.box(0.9, 0.012, 0.022, black, [0, 2.521, -0.3 - i * 0.05], 0));
  }
  // the back: a fan grille, the rating plate, the socket for the line to the computer, and the mains lead
  const rear = screen(512, 358), rc = rear.ctx;
  rc.clearRect(0, 0, 512, 358);
  const RU = (x: number) => 256 - x * 297.7, RV = (v: number) => 179 - (v - 1.92) * 297.7;      // 1.72 by 1.2, seen from behind
  rc.fillStyle = 'rgba(12,13,14,.9)';
  for (let ring = 0; ring < 6; ring++) for (let k = 0; k < Math.max(1, ring * 6); k++) { const a = (k / Math.max(1, ring * 6)) * Math.PI * 2; rc.beginPath(); rc.arc(RU(0.42 + Math.cos(a) * ring * 0.052), RV(1.98 + Math.sin(a) * ring * 0.052), 4.6, 0, 7); rc.fill(); }
  rc.fillStyle = '#c9ccc8'; rc.fillRect(RU(-0.15), RV(2.3), 0.56 * 297.7, 0.2 * 297.7);
  rc.fillStyle = rc.strokeStyle = 'rgba(20,21,22,.9)'; rc.lineWidth = 1.5; rc.strokeRect(RU(-0.15) + 4, RV(2.3) + 4, 0.56 * 297.7 - 8, 0.2 * 297.7 - 8);
  rc.textAlign = 'center'; rc.textBaseline = 'middle'; rc.font = '600 19px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';
  rc.fillText('DISPLAY TERMINAL', RU(-0.43), RV(2.235)); rc.fillText('115 V  60 HZ', RU(-0.43), RV(2.155));
  for (const u of [14, 498]) for (const v of [14, 344]) { rc.fillStyle = '#8f9390'; rc.beginPath(); rc.arc(u, v, 5, 0, 7); rc.fill(); }
  rear.tex.needsUpdate = true;
  const backFace = G.plane(1.72, 1.2, new THREE.MeshStandardMaterial({ map: rear.tex, transparent: true, roughness: 0.6 }), [0, 1.92, -0.8506]); backFace.rotation.y = Math.PI; backFace.userData.noShadow = true;
  root.add(backFace);
  soft.push(G.box(0.34, 0.1, 0.03, dark, [-0.45, 1.62, -0.862], 0), G.cyl(0.045, 0.07, black, [0.3, 1.5, -0.87], 10).rotateX(Q));
  soft.push(cord([[0.3, 1.5, -0.86], [0.31, 1.3, -0.97], [0.34, 0.9, -0.99], [0.3, 0.2, -0.82], [0.5, 0.05, -0.62]], 0.02, black, 28, 6));
  // keyboard console
  const tilt = Math.atan2(0.2, 0.62);
  paint.push(G.profile([[0.6, 1.24], [1.38, 1.24], [1.38, 1.3], [0.76, 1.5], [0.6, 1.5]], 1.72, putty));
  const ROWS = [14, 14, 13, 12], caps = keyCaps(ROWS, 0.092, 7, ink(0x3b3f43), ink(0x74777a)), legends = keyLegends(ROWS, 0.092);
  caps.position.set(-0.1, 0.006, 0); legends.position.x = -0.1; legends.position.y += 0.006;
  const onDeck: THREE.Object3D[] = [G.box(1.56, 0.012, 0.56, dark, [0, 0, 0], 0), caps];
  // Two thumbwheels steer the crosshair. They stand at right angles in one housing: one rolls it up and down the
  // screen, the other from side to side.
  onDeck.push(G.box(0.19, 0.03, 0.36, ink(0x17191c), [0.68, 0.015, 0.01], 0.006), put(knurled(0.07, 0.03, 22, ink(0x2b2e31)), 0.68, 0.022, 0.1), put(knurled(0.07, 0.03, 22, ink(0x2b2e31)), 0.68, 0.022, -0.08).rotateY(Q));
  // three rocker switches, each resting on one end
  for (let i = 0; i < 3; i++) { const rocker = G.box(0.05, 0.022, 0.08, ink(0xb8b2a0), [0.56 + i * 0.075, 0.014, -0.22], 0.005); rocker.rotation.x = i === 1 ? -0.16 : 0.16; onDeck.push(rocker, G.box(0.062, 0.012, 0.094, ink(0x17191c), [0.56 + i * 0.075, 0.006, -0.22], 0)); }
  const deck = G.group(weld(M.plastic(0xffffff, 0.5), ...onDeck), legends);
  deck.rotation.x = tilt; deck.position.set(0, 1.41, 1.07);
  root.add(deck, jewel(0xffa62b, 0.018, [-0.72, 1.36, 1.381], 'z', 1.2), weld(M.enamel(0xffffff), ...paint), weld(M.plastic(0xffffff, 0.6), ...soft));
  const BG = '#0d2a17', FG = '#a9ffbd';
  let cycle = -1, done = 0;
  return {
    root, inDark: 'glows', glow: 0x4dff86, view: [26, 9], surface: s.canvas,
    views: { seat: { at: [0, 2.25, 3.9], to: [0, 1.85, 0.66], fov: 42 } },
    update: ({ t }) => {
      const c = s.ctx, T = 14, k = Math.floor(t / T), u = (t % T);
      if (k !== cycle) { cycle = k; done = 0; }
      if (u < 0.5) { // the erase flash
        const f = 1 - u / 0.5;
        c.fillStyle = `rgb(${13 + 150 * f},${42 + 213 * f},${23 + 160 * f})`; c.fillRect(0, 0, 512, 384);
      } else {
        if (done === 0) { c.fillStyle = BG; c.fillRect(0, 0, 512, 384); }
        c.strokeStyle = FG; c.fillStyle = FG; c.lineWidth = 2; c.shadowColor = FG; c.shadowBlur = 4;
        const want = Math.min(400, Math.floor((u - 0.5) * 70));
        for (; done < want; done++) {
          if (done === 0) { c.beginPath(); c.moveTo(40, 30); c.lineTo(40, 300); c.lineTo(480, 300); c.stroke(); }
          const x0 = 40 + done * 1.1, x1 = x0 + 1.1;
          const f = (x: number) => 170 - 100 * Math.sin((x - 40) / 44) * Math.exp(-(x - 40) / 520);
          c.beginPath(); c.moveTo(x0, f(x0)); c.lineTo(x1, f(x1)); c.stroke();
          if (done % 40 === 0) { c.beginPath(); c.moveTo(x0, 296); c.lineTo(x0, 304); c.stroke(); }
          if (done === 399) { c.font = '26px "PT Mono", monospace'; c.fillText(`T = ${now().hhmmss}`, 56, 350); }
        }
        c.shadowBlur = 0;
      }
      s.tex.needsUpdate = true;
    },
  };
}

const NIXIE: Record<number, [number, number][]> = {
  1: [[0.34, 1.3], [0.56, 1.6], [0.56, 0.8], [0.56, 0]],
  2: [[0.1, 1.2], [0.24, 1.5], [0.5, 1.6], [0.76, 1.5], [0.9, 1.22], [0.8, 0.9], [0.45, 0.45], [0.1, 0], [0.5, 0], [0.92, 0]],
  3: [[0.12, 1.6], [0.88, 1.6], [0.46, 1.0], [0.72, 0.94], [0.9, 0.68], [0.9, 0.36], [0.7, 0.1], [0.45, 0], [0.22, 0.08], [0.1, 0.28]],
  4: [[0.72, 0], [0.72, 0.8], [0.72, 1.6], [0.4, 1.05], [0.1, 0.5], [0.5, 0.5], [0.95, 0.5]],
  5: [[0.86, 1.6], [0.22, 1.6], [0.16, 0.94], [0.44, 1.04], [0.7, 1.0], [0.9, 0.74], [0.9, 0.36], [0.7, 0.1], [0.45, 0], [0.22, 0.08], [0.1, 0.28]],
  6: [[0.76, 1.6], [0.42, 1.2], [0.17, 0.72], [0.12, 0.4], [0.25, 0.12], [0.5, 0], [0.75, 0.12], [0.88, 0.4], [0.8, 0.74], [0.55, 0.92], [0.3, 0.84], [0.16, 0.6]],
  7: [[0.1, 1.6], [0.5, 1.6], [0.9, 1.6], [0.66, 0.8], [0.4, 0]],
};
NIXIE[9] = NIXIE[6].map(([x, y]) => [1 - x, 1.6 - y]);
const ring = (cx: number, cy: number, rx: number, ry: number, n = 14): [number, number][] => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * rx, cy + Math.sin((i / n) * Math.PI * 2) * ry]);

/** The pen strokes of a numeral in a box 1 wide and 1.6 high. Shared with anything that writes digits by hand. */
export function strokesOf(d: number): [number, number][][] {
  if (d === 0) { const r = ring(0.5, 0.8, 0.4, 0.8, 16); return [[...r, r[0]]]; }
  if (d === 8) { const a = ring(0.5, 1.22, 0.33, 0.38), b = ring(0.5, 0.42, 0.42, 0.42); return [[...a, a[0]], [...b, b[0]]]; }
  return [NIXIE[d]];
}

/** The line a numeral follows inside a tube: one curve, or two for an 8. */
function numeralCurves(d: number): THREE.CatmullRomCurve3[] {
  const curve = (pts: [number, number][], closed: boolean) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3((p[0] - 0.5) * 0.36, 0.2 + p[1] * 0.5, 0)), closed, 'catmullrom', 0.35);
  if (d === 0) return [curve(ring(0.5, 0.8, 0.4, 0.8, 16), true)];
  if (d === 8) return [curve(ring(0.5, 1.22, 0.33, 0.38), true), curve(ring(0.5, 0.42, 0.42, 0.42), true)];
  return [curve(NIXIE[d], false)];
}

/**
 * A numeral etched from sheet metal, standing in the plane `z`: a flat strip `w` wide along its line, with a leg down
 * to `foot`. A hairline along the middle stands for the thickness of the sheet, so that the strip does not vanish
 * when it is seen edge on.
 */
function sheetNumeral(d: number, z: number, w: number, foot: number): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], E = 0.004;
  const quad = (a: number[], b: number[], c: number[], e: number[], n: number[]) => { for (const p of [a, b, c, a, c, e]) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); } };
  const P = new THREE.Vector3(), T = new THREE.Vector3(), low = new THREE.Vector3(0, 9, 0);
  for (const c of numeralCurves(d)) {
    const n = c.points.length * 7;
    let was: number[][] | null = null;
    for (let i = 0; i <= n; i++) {
      c.getPointAt(i / n, P); c.getTangentAt(i / n, T);
      if (P.y < low.y) low.copy(P);
      const nx = (-T.y * w) / 2, ny = (T.x * w) / 2;
      const cur = [[P.x - nx, P.y - ny, z], [P.x + nx, P.y + ny, z], [P.x, P.y, z - E], [P.x, P.y, z + E], [-T.y, T.x, 0]];
      if (was) { quad(was[0], was[1], cur[1], cur[0], [0, 0, 1]); quad(was[2], was[3], cur[3], cur[2], cur[4]); }
      was = cur;
    }
  }
  quad([low.x - w / 3, foot, z], [low.x + w / 3, foot, z], [low.x + w / 3, low.y, z], [low.x - w / 3, low.y, z], [0, 0, 1]);
  quad([low.x, foot, z - E], [low.x, foot, z + E], [low.x, low.y, z + E], [low.x, low.y, z - E], [1, 0, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return geo;
}

/**
 * A small glass valve envelope: straight wall, heavy bottom, domed top, and the pip where it was sealed off the pump.
 * Both surfaces of the wall are drawn, one inside the other, and that is what shows that the glass has thickness.
 */
function envelopeGeo(r: number, h: number, seg = 52): THREE.BufferGeometry {
  const q = r - 0.024;
  const outer = spline([[0, 0], [r * 0.93, 0, 1], [r, 0.03], [r, h * 0.8], [r * 0.94, h * 0.9], [r * 0.7, h * 0.975], [r * 0.3, h], [r * 0.16, h * 1.03], [r * 0.1, h * 1.09], [0, h * 1.1]], 4);
  const inner = spline([[0, 0.05], [q * 0.9, 0.05, 1], [q, 0.085], [q, h * 0.8], [q * 0.93, h * 0.89], [q * 0.68, h * 0.957], [q * 0.3, h * 0.98], [0, h * 0.984]], 4);
  return G.merge([outer, inner].map((p) => new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x, y)), seg)));
}

/** Nixie tubes: ten shaped cathodes stacked in neon behind a mesh anode. The one that is energised glows. */
export function nixie(): Built {
  const root = G.group();
  const on = M.glow(0xff6418, 3), aura = M.add(null, 0xff4a08, 0.3);
  const sheet = new THREE.MeshStandardMaterial({ color: 0x6d7277, metalness: 0.5, roughness: 0.55, side: THREE.DoubleSide });
  const gauze = meshMat(meshTexture(40, 26), 0.26), glass = M.bulb(0x9fb1ae, 0.72, 0x3a1200);
  const mica = new THREE.MeshStandardMaterial({ color: 0xa89a7c, roughness: 0.5, transparent: true, opacity: 0.55 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.7, metalness: 0.3, side: THREE.DoubleSide });
  const nickel = ink(0xb4b8bc), brass = ink(0xb08d4a);
  // From the front of the tube to the back. This is the usual order: it lets the numerals in front hide the lit one least.
  const ORDER = [6, 7, 5, 8, 4, 3, 9, 2, 0, 1], zOf = (d: number) => (4.5 - ORDER.indexOf(d)) * 0.03;
  // All six tubes are alike inside, so every shape is made once and shared.
  const stack = G.merge(ORDER.map((d) => sheetNumeral(d, zOf(d), 0.009, 0.125)));
  const glowing = (d: number, r: number) => G.merge(numeralCurves(d).map((c) => new THREE.TubeGeometry(c, Math.max(16, c.points.length * 6), r, 12, c.closed).translate(0, 0, zOf(d))));
  const core = ORDER.map((_, d) => glowing(d, 0.021)), sheath = ORDER.map((_, d) => glowing(d, 0.05));
  const shell = envelopeGeo(0.29, 1.3);
  const cage = new THREE.CylinderGeometry(0.235, 0.235, 0.98, 48, 1, true).translate(0, 0.62, 0);
  const back = new THREE.CylinderGeometry(0.228, 0.228, 0.96, 28, 1, true, Math.PI * 0.62, Math.PI * 0.76).translate(0, 0.62, 0);
  const micas = G.merge([0.12, 1.12].map((y) => new THREE.CylinderGeometry(0.25, 0.25, 0.01, 36).translate(0, y, 0)));
  const xs = [-1.78, -1.12, -0.33, 0.33, 1.12, 1.78];
  const metal: THREE.Object3D[] = [], sockets: THREE.Object3D[] = [];
  const tubes = xs.map((x) => {
    const g = G.group(); g.position.set(x, 0.36, 0);
    // the numerals themselves throw no shadow worth drawing through glass and gauze, and a glow throws none at all
    const numerals = new THREE.Mesh(stack, sheet); numerals.userData.noShadow = true;
    g.add(numerals);
    // the glow is a sheath of excited neon a little way off the metal, so the lit numeral looks fatter than its strip
    const hot = ORDER.map((_, d) => { const lit = new THREE.Mesh(core[d], on); lit.userData.noShadow = true; const h = G.group(lit, new THREE.Mesh(sheath[d], aura)); h.visible = false; g.add(h); return h; });
    // mesh anode wrapped round the stack, with a dark screen behind it so that the lit numeral has something to stand
    // against, and a mica disc above and below that keeps the numerals apart
    g.add(new THREE.Mesh(back, dark), new THREE.Mesh(cage, gauze), new THREE.Mesh(micas, mica), new THREE.Mesh(shell, glass), halo(0xff5a10, 1.3, [0, 0.62, 0.05], 0.5));
    root.add(g);
    // the frame of the anode: a hoop round each end of the gauze and a strip down each edge of the screen
    for (const y of [0.14, 1.1]) metal.push(put(new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.238, 0.024, 36, 1, true), nickel), x, 0.36 + y, 0));
    for (const s of [-1, 1]) metal.push(G.box(0.03, 0.98, 0.012, nickel, [x + s * 0.216, 0.98, -0.088], 0));
    // a lead for every numeral and one for the anode, up through the glass of the base
    for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; metal.push(G.rod([x + Math.cos(a) * 0.17, 0.37, Math.sin(a) * 0.17], [x + Math.cos(a) * 0.17, 0.485, Math.sin(a) * 0.17], 0.006, nickel, 5)); }
    // the socket: a bakelite ring in a brass ferrule
    sockets.push(G.cyl(0.33, 0.1, ink(0x15130f), [x, 0.33, 0], 32, 0.31));
    metal.push(G.cyl(0.345, 0.03, brass, [x, 0.324, 0], 32));
    return { hot, lit: -1 };
  });
  // A small neon lamp for each dot of the colons, on a brass stalk: two wires in a bulb, and the glow sits on them.
  const lampGlass: THREE.BufferGeometry[] = [], lampGlow: THREE.BufferGeometry[] = [];
  const bulbShape = spline([[0, -0.07], [0.05, -0.07, 1], [0.055, 0.02], [0.03, 0.07], [0, 0.08]], 4).map(([r, y]) => new THREE.Vector2(r, y));
  for (const x of [-0.725, 0.725]) for (const y of [0.74, 1.04]) {
    lampGlass.push(new THREE.LatheGeometry(bulbShape, 20).translate(x, y, 0));
    lampGlow.push(new THREE.SphereGeometry(0.024, 12, 8).scale(1, 1.5, 1).translate(x, y, 0));
    root.add(halo(0xff5a10, 0.22, [x, y, 0], 0.6));
    for (const s of [-1, 1]) metal.push(G.rod([x + s * 0.014, y - 0.07, 0], [x + s * 0.014, y + 0.02, 0], 0.005, nickel, 5));
    metal.push(G.rod([x, y - 0.08, -0.08], [x, y - 0.08, 0], 0.008, brass, 6), G.cyl(0.05, 0.012, brass, [x, y - 0.074, 0], 16));
    if (y > 1) metal.push(G.rod([x, 0.3, -0.08], [x, y - 0.07, -0.08], 0.012, brass, 8));
  }
  const pips = new THREE.Mesh(G.merge(lampGlow), M.glow(0xff6a1a, 2.4)); pips.userData.noShadow = true;
  root.add(pips, new THREE.Mesh(G.merge(lampGlass), M.bulb(0x9fb1ae, 0.7, 0x3a1200)));
  // the base: a block of dark wood under a brass plate
  metal.push(G.box(4.3, 0.014, 0.82, brass, [0, 0.302, 0], 0.004), screws([[-2.08, 0.31, 0.34], [2.08, 0.31, 0.34], [-2.08, 0.31, -0.34], [2.08, 0.31, -0.34]], 0.026, 'y', brass));
  sockets.push(feet(4.5, 1.0, 0.07, 0.04, -0.04));
  root.add(G.rbox(4.5, 0.3, 1.0, 0.05, M.wood(0x4b2f1b), [0, 0.15, 0]), weld(M.brass(), ...metal), weld(M.plastic(0xffffff, 0.4), ...sockets));
  return {
    root, inDark: 'glows', glow: 0xff6a1a, view: [20, 9], zoom: 1.12,
    // the tube that counts seconds, from far enough round that the stack shows as a stack, and far enough back that a
    // square frame holds the whole numeral between its two micas
    views: { stack: { at: [2.7, 1.3, 1.65], to: [1.78, 0.99, 0], play: 0.6 } },
    update: () => {
      const d = now().digits;
      tubes.forEach((tb, i) => {
        if (tb.lit === d[i]) return;
        if (tb.lit >= 0) tb.hot[tb.lit].visible = false;
        tb.hot[d[i]].visible = true; tb.lit = d[i];
      });
    },
  };
}

/** Vacuum fluorescent display: hot filaments in front, mesh grids, phosphor segments behind, all in a flat glass box. */
export function vfd(): Built {
  const root = G.group();
  const s = screen(768, 256);
  const y = 0.82, PW = 2.58, PH = 0.76, Q = Math.PI / 2;
  const metal: THREE.Object3D[] = [], body: THREE.Object3D[] = [];
  const tin = ink(0xc2c5c8), steel = ink(0x9aa0a6), dark = ink(0x23262a);
  // where the clock puts its six digits and two colons, in the units of the lit plane
  const dw = Math.min(768 / (3 * 2.55 + 0.4), 256 * 0.36), K = PW / 768;
  const digits: number[] = [], colons: number[] = [];
  for (let g = 0, px = (768 - (6 * dw * 1.18 + 2 * dw * 0.55)) / 2 + dw * 0.09; g < 3; g++) {
    for (let i = 0; i < 2; i++) { digits.push((px + dw / 2 - 384) * K); px += dw * 1.18; }
    if (g < 2) { colons.push((px + dw * 0.14 - 384) * K); px += dw * 0.55; }
  }

  // The envelope: a glass tray sealed face down on a glass plate with a line of frit. The inside of the tray is drawn
  // as well as the outside, which is what gives the glass its thickness.
  const glass = M.glass(0x8fa9a4, 0.04, 0.7);
  root.add(put(new THREE.Mesh(G.merge([G.rbox(3.04, 0.98, 0.26, 0.04, tin).geometry, new THREE.BoxGeometry(2.92, 0.86, 0.165).translate(0, 0, -0.0075)]), glass), 0, y, 0));
  const frit = ink(0x747975);
  for (const sg of [-1, 1]) body.push(G.box(3.07, 0.035, 0.024, frit, [0, y + sg * 0.484, -0.086], 0), G.box(0.035, 0.94, 0.024, frit, [sg * 1.5175, y, -0.086], 0));
  // the tip where the tube was sealed off the pump
  const tip = G.lathe(spline([[0, 0], [0.04, 0, 1], [0.04, 0.05], [0.018, 0.09], [0, 0.1]], 3), glass, 12); tip.rotation.z = Q; tip.position.set(-1.52, y, 0);
  root.add(tip);

  // The anodes. By day the phosphor of every segment shows, pale against the black of the plate, with the printed
  // tracks that lead each one down to the bottom edge. The lit segments are light added to that.
  const day = screen(768, 256), dc = day.ctx;
  dc.fillStyle = '#050606'; dc.fillRect(0, 0, 768, 256);
  dc.strokeStyle = '#232825'; dc.lineWidth = 1.5;
  for (const x of digits) for (let i = 0; i < 8; i++) { const px = x / K + 384 + (i - 3.5) * 9; dc.beginPath(); dc.moveTo(px, 216); dc.lineTo(px + (i - 3.5) * 2, 256); dc.stroke(); }
  segClock(dc, 768, 256, { h: 0, m: 0, s: 0, ms: 0, hhmm: '', hhmmss: '', digits: [8, 8, 8, 8, 8, 8] }, '#3b443e', null, true, 0);
  day.tex.needsUpdate = true;
  const lit = M.lit(s, 1.7, 0.2); lit.color.set(0xffffff); lit.map = day.tex;
  const phosphor = G.plane(PW, PH, lit, [0, y, -0.088]); phosphor.userData.noShadow = true;
  root.add(phosphor);
  body.push(G.box(2.7, 0.82, 0.02, ink(0x0b0c0d), [0, y, -0.1], 0));

  // One etched mesh grid over each digit, in its own frame on two feet, and a narrow one over each colon.
  const cells: THREE.BufferGeometry[] = [];
  const gridAt = (x: number, w: number, h: number) => {
    const geo = new THREE.PlaneGeometry(w, h).translate(x, 0, 0), pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / PW + 0.5, pos.getY(i) / PH + 0.5);
    cells.push(geo);
    for (const sg of [-1, 1]) {
      metal.push(G.box(w + 0.014, 0.014, 0.012, steel, [x, y + (sg * h) / 2, -0.03], 0), G.box(0.014, h, 0.012, steel, [x + (sg * w) / 2, y, -0.03], 0));
      metal.push(G.box(0.014, 0.012, 0.06, steel, [x + sg * (w / 2 - 0.03), y - h / 2 - 0.006, -0.06], 0));
    }
  };
  for (const x of digits) gridAt(x, 0.33, 0.6);
  for (const x of colons) gridAt(x, 0.1, 0.42);
  root.add(put(new THREE.Mesh(G.merge(cells), meshMat(meshTexture(120, 36), 0.4)), 0, y, -0.03));

  // Filaments: hair-thin wires stretched across the front between two pressed supports, one of which carries the
  // feather springs that keep them taut. They run too cool for their glow to be seen by day.
  const fil = new THREE.MeshStandardMaterial({ color: 0x8d8a84, roughness: 0.6, emissive: 0xff4a1c, emissiveIntensity: 0.05 });
  const wires: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const fy = y - 0.27 + i * 0.18;
    wires.push(new THREE.CylinderGeometry(0.003, 0.003, 2.7, 5).rotateZ(Q).translate(0, fy, 0.05));
    const spring = G.box(0.075, 0.008, 0.022, steel, [1.322, fy + 0.012, 0.05], 0); spring.rotation.z = 0.33;
    metal.push(G.box(0.04, 0.014, 0.014, steel, [-1.338, fy, 0.05], 0), spring);
  }
  for (const sx of [-1, 1]) for (const sy of [-1, 0, 1]) metal.push(sy ? G.box(0.024, 0.05, 0.13, steel, [sx * 1.356, y + sy * 0.345, -0.02], 0) : G.box(0.024, 0.74, 0.012, steel, [sx * 1.356, y, 0.044], 0));
  const hot = new THREE.Mesh(G.merge(wires), fil); hot.userData.noShadow = true;
  root.add(hot);
  // The getter sits beside the screen at one end. Fired once the tube was sealed, it left its mirror on the glass.
  metal.push(put(hoop(0.03, 0.007, tin).rotateX(Q), 1.412, y + 0.2, -0.045), G.box(0.012, 0.012, 0.045, tin, [1.412, y + 0.2, -0.07], 0));
  root.add(put(getterFlash(new THREE.CircleGeometry(1, 20).scale(0.045, 0.17, 1)), 1.412, y + 0.2, 0.072));
  // Lead frame: flat tinned strips. Every anode and grid comes out through the frit along the bottom edge and turns
  // back into the board.
  for (let i = 0; i < 30; i++) { const x = -1.26 + i * 0.087; metal.push(G.box(0.03, 0.17, 0.008, tin, [x, y - 0.56, -0.085], 0), G.box(0.03, 0.008, 0.1, tin, [x, y - 0.641, -0.135], 0)); }

  // The board behind. Its two faces are drawn: lands and tracks, the outline of each part, a joint for every lead.
  const face = (back: boolean) => {
    const b = screen(640, 272), c = b.ctx, X = (x: number) => (back ? 1.6 - x : x + 1.6) * 200, Y = (v: number) => (1.46 - v) * 200;
    c.fillStyle = '#1b4d33'; c.fillRect(0, 0, 640, 272);
    c.strokeStyle = '#27674a'; c.lineWidth = 2.2; c.lineJoin = 'round';
    for (let i = 0; i < 30; i++) { const x = -1.26 + i * 0.087, t = 0.2 + (i - 14.5) * 0.0285; c.beginPath(); c.moveTo(X(x), Y(0.18)); c.lineTo(X(x), Y(0.27 + 0.011 * Math.abs(i - 14.5))); c.lineTo(X(t), Y(0.56)); c.lineTo(X(t), Y(0.6)); c.stroke(); }
    for (let i = 0; i < 30; i++) { c.fillStyle = back ? '#d9dbd7' : '#b9bdb8'; c.beginPath(); c.arc(X(-1.26 + i * 0.087), Y(0.18), back ? 4.6 : 3.8, 0, 7); c.fill(); if (!back) { c.fillStyle = '#101211'; c.beginPath(); c.arc(X(-1.26 + i * 0.087), Y(0.18), 1.4, 0, 7); c.fill(); } }
    for (const hx of [-1.47, 1.47]) for (const hy of [0.24, 1.33]) { c.fillStyle = '#b79d57'; c.beginPath(); c.arc(X(hx), Y(hy), 9, 0, 7); c.fill(); c.fillStyle = '#0c0d0d'; c.beginPath(); c.arc(X(hx), Y(hy), 4.5, 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(236,238,230,.85)'; c.fillStyle = 'rgba(236,238,230,.85)'; c.lineWidth = 1.4; c.font = '13px "PT Mono", monospace'; c.textBaseline = 'middle';
    const mark = (x: number, v: number, w: number, h: number, name: string) => { c.strokeRect(X(x) - w * 100, Y(v) - h * 100, w * 200, h * 200); c.fillText(name, X(x) - w * 100 + 3, Y(v) - h * 100 - 9); };
    if (!back) mark(0, y, 3.1, 1.04, 'DS1');
    else {
      mark(0.2, 0.72, 0.94, 0.28, 'U1'); mark(-1.0, 0.42, 0.56, 0.16, 'J1');
      for (let i = 0; i < 4; i++) mark(1.05, 1.2 - i * 0.1, 0.2, 0.06, i ? '' : 'R1');
      for (const cx of [-0.95, -0.62]) { c.beginPath(); c.arc(X(cx), Y(1.1), 17, 0, 7); c.stroke(); }
      c.fillText('C1', X(-0.95) - 38, Y(1.1) - 22);
      for (let i = 0; i < 40; i++) { c.fillStyle = '#d9dbd7'; c.beginPath(); c.arc(X(0.2 + ((i % 20) - 9.5) * 0.0445), Y(0.72 + (i < 20 ? 0.13 : -0.13)), 2.6, 0, 7); c.fill(); }
    }
    b.tex.needsUpdate = true;
    const p = G.plane(3.2, 1.36, new THREE.MeshStandardMaterial({ map: b.tex, roughness: 0.5, metalness: 0.15 }), [0, y - 0.04, -0.2 + (back ? -0.0232 : 0.0232)]);
    if (back) p.rotation.y = Math.PI;
    p.userData.noShadow = true;
    return p;
  };
  root.add(face(false), face(true));
  body.push(G.box(3.2, 1.36, 0.045, ink(0x1d5236), [0, y - 0.04, -0.2], 0));
  // on the back of the board: the driver chip, two capacitors, a row of resistors, and the plug the cable leaves by
  body.push(G.box(0.9, 0.24, 0.06, ink(0x141516), [0.2, 0.72, -0.2525], 0), G.box(0.5, 0.12, 0.1, ink(0xd8d4c8), [-1.0, 0.42, -0.2725], 0), G.box(0.42, 0.3, 0.012, ink(0x8a8d90), [-1.0, 0.25, -0.31], 0));
  for (const sg of [-1, 1]) metal.push(G.box(0.86, 0.012, 0.04, tin, [0.2, 0.72 + sg * 0.13, -0.243], 0));
  for (const cx of [-0.95, -0.62]) body.push(G.cyl(0.075, 0.17, ink(0x262c52), [cx, 1.1, -0.3075], 12).rotateX(Q));
  for (let i = 0; i < 4; i++) body.push(put(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.13, 6).rotateZ(Q), ink(0xb39a6e)), 1.05, 1.2 - i * 0.1, -0.2445));

  // the stand: a bar with a slotted bracket at each end of the board
  metal.push(G.box(3.2, 0.1, 0.6, dark, [0, 0.05, -0.12], 0.02));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) metal.push(G.box(0.14, 0.22, 0.03, dark, [sx * 1.46, 0.21, -0.2 + sz * 0.0385], 0), put(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.03, 10), ink(0x101010)), sx * 1.45, -0.015, -0.12 + sz * 0.22));
    metal.push(bolts([[sx * 1.46, 0.22, -0.1465]], 0.022, 'z'));
  }
  root.add(weld(M.steel(), ...metal), weld(M.plastic(0xffffff, 0.55), ...body));
  return {
    root, inDark: 'glows', glow: 0x58ffd8, view: [18, 8], zoom: 1.08, surface: s.canvas,
    views: { grid: { at: [-1.75, 1, 0.75], to: [-0.95, 0.78, 0], play: 0.3 } },
    update: ({ lights }) => {
      s.ctx.fillStyle = '#040807'; s.ctx.fillRect(0, 0, 768, 256);
      segClock(s.ctx, 768, 256, now(), '#7dffe6', '#0d2a26', true, 14);
      s.tex.needsUpdate = true;
      fil.emissiveIntensity = 0.03 + 0.22 * (1 - lights);
    },
  };
}

/** A coil of wire lying along x: `turns` turns of radius `r` over the length `len`. */
class Coil extends THREE.Curve<THREE.Vector3> {
  constructor(private len: number, private r: number, private turns: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = t * this.turns * Math.PI * 2;
    return target.set((t - 0.5) * this.len, Math.cos(a) * this.r, Math.sin(a) * this.r);
  }
}

/** Numitron: seven lamp filaments in a small valve envelope, laid out as a seven segment figure. */
export function numitron(): Built {
  const root = G.group();
  const on = M.glow(0xffb45a, 3), off = new THREE.MeshStandardMaterial({ color: 0x5a5d61, metalness: 0.6, roughness: 0.5 });
  const haze = M.add(null, 0xff9236, 0.5); haze.vertexColors = true;
  const glass = M.bulb(0x9fb1ae, 0.72, 0x2a1500), shell = envelopeGeo(0.29, 0.98, 44);
  const nickel = ink(0xb9bdc1), steel = ink(0x9aa0a6), china = ink(0xe3dfd4);
  // One filament: a fine coil of tungsten wire. All twenty-eight are this one shape, lying along x or stood on end.
  const LEN = 0.19, Q = Math.PI / 2;
  const coil = new THREE.TubeGeometry(new Coil(LEN, 0.009, 10), 70, 0.0036, 4);
  // A lit filament is too bright to see as a wire from any distance: it reads as a soft bar of light. Three shells of
  // glow round the coil, each fainter than the one inside it.
  const glare = G.merge([[0.015, 1], [0.025, 0.5], [0.037, 0.24]].map(([r, k]) => {
    const geo = new THREE.CapsuleGeometry(r, LEN - 0.012, 2, 12).rotateZ(Q).toNonIndexed();
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(k), 3));
    return geo;
  }));
  const metal: THREE.Object3D[] = [], dull: THREE.Object3D[] = [], paint: THREE.Object3D[] = [];
  const Y0 = 0.42;
  const tubes = [-1.14, -0.42, 0.42, 1.14].map((x) => {
    const g = G.group(); g.position.set(x, Y0, 0);
    const segs: Record<string, { wire: THREE.Mesh; bloom: THREE.Mesh }> = {};
    const ends: [number, number][] = [];
    for (const k of 'abcdefg') {
      const [x0, y0, x1, y1] = SEG_LINES[k];
      const ax = (x0 - 0.5) * 0.25, ay = 0.3 + y0 * 0.25, bx = (x1 - 0.5) * 0.25, by = 0.3 + y1 * 0.25;
      const wire = put(new THREE.Mesh(coil, off), (ax + bx) / 2, (ay + by) / 2, 0.04), bloom = put(new THREE.Mesh(glare, haze), (ax + bx) / 2, (ay + by) / 2, 0.04);
      if (x0 === x1) { wire.rotation.z = Q; bloom.rotation.z = Q; }
      wire.userData.noShadow = true; bloom.visible = false;
      segs[k] = { wire, bloom };
      g.add(wire, bloom);
      ends.push([ax, ay], [bx, by]);
    }
    // each filament is strung between its own two posts, which stand in a dark plate behind it
    for (const [px, py] of ends) metal.push(G.rod([x + px, Y0 + py, -0.06], [x + px, Y0 + py, 0.047], 0.006, nickel, 6));
    dull.push(put(sheetOf(0.4, 0.68, 0.05, 0.02, ink(0x1f2123)), x, Y0 + 0.55, -0.066));
    // Behind the plate the posts are gathered to nine leads, which go down through the glass of the base to the pins:
    // one for each filament, one they all share, and one spare.
    for (let i = 0; i < 9; i++) {
      const a = ((i + 1) / 10) * Math.PI * 2 + Q, px = Math.cos(a) * 0.16;
      metal.push(G.rod([x + px, Y0 + 0.01, Math.sin(a) * 0.16 - 0.02], [x + px * 0.8, Y0 + 0.27 + 0.05 * Math.abs(Math.sin(a)), -0.082], 0.006, nickel, 5));
    }
    g.add(new THREE.Mesh(shell, glass));
    root.add(g);
    // the socket: a ceramic ring on a steel saddle held down by two screws
    paint.push(G.cyl(0.33, 0.09, china, [x, Y0 - 0.045, 0], 24, 0.31));
    const saddle = put(sheetOf(0.52, 0.88, 0.2, 0.012, steel, 6), x, 0.365, 0); saddle.rotation.x = -Q;
    metal.push(saddle, studs([[x, 0.371, 0.375], [x, 0.371, -0.375]], 0.022, nickel));
    return { segs, shown: -1 };
  });
  // A pair of pilot lamps for the colon, on a stalk that runs up behind them.
  const lampGlass: THREE.BufferGeometry[] = [], lampGlow: THREE.BufferGeometry[] = [];
  const bulbShape = spline([[0, -0.06], [0.036, -0.06, 1], [0.042, 0.01], [0.026, 0.055], [0, 0.066]], 4).map(([r, y]) => new THREE.Vector2(r, y));
  for (const y of [0.78, 1.04]) {
    lampGlass.push(new THREE.LatheGeometry(bulbShape, 18).translate(0, y, 0.04));
    lampGlow.push(new THREE.SphereGeometry(0.016, 10, 8).translate(0, y, 0.04));
    root.add(halo(0xff9a3a, 0.2, [0, y, 0.05], 0.6));
    metal.push(G.cyl(0.04, 0.014, nickel, [0, y - 0.066, 0.04], 14), G.rod([0, y - 0.07, -0.05], [0, y - 0.07, 0.04], 0.007, steel, 6));
  }
  const lit = new THREE.Mesh(G.merge(lampGlow), M.glow(0xffb45a, 2.4)); lit.userData.noShadow = true;
  root.add(lit, new THREE.Mesh(G.merge(lampGlass), M.bulb(0x9fb1ae, 0.7, 0x2a1500)));
  metal.push(G.rod([0, 0.36, -0.05], [0, 0.97, -0.05], 0.009, steel, 8), screws([[-1.42, 0.3, 0.476], [1.42, 0.3, 0.476], [-1.42, 0.07, 0.476], [1.42, 0.07, 0.476]], 0.02, 'z', nickel));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) dull.push(put(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.04, 12), ink(0x151515)), sx * 1.45, -0.02, sz * 0.38));
  root.add(G.rbox(3.1, 0.36, 0.95, 0.04, M.steel(), [0, 0.18, 0]), vents(1.2, 0.16, 5, [0, 0.19, 0.476]));
  root.add(weld(M.steel(), ...metal), weld(M.plastic(0xffffff, 0.85), ...dull), weld(M.ceramic(), ...paint));
  return {
    root, inDark: 'glows', glow: 0xffc98a, view: [20, 9], zoom: 1.1,
    // far enough back that a square frame holds the whole figure
    views: { filaments: { at: [1.82, 1.17, 1.08], to: [1.14, 0.97, 0.02] } },
    update: () => {
      const d = now().digits;
      tubes.forEach((tb, i) => {
        if (tb.shown === d[i]) return;
        tb.shown = d[i];
        for (const k of 'abcdefg') { const hot = SEG[d[i]].includes(k); tb.segs[k].wire.material = hot ? on : off; tb.segs[k].bloom.visible = hot; }
      });
    },
  };
}

/** Plasma panel: the flat orange terminal screen of the early 1970s. Every dot is a tiny neon discharge. */
export function plasma(): Built {
  const root = G.group();
  const putty = ink(0xcbc4af), dark = ink(0x1d1f22), black = ink(0x0b0c0d), Q = Math.PI / 2;
  const paint: THREE.Object3D[] = [], soft: THREE.Object3D[] = [];
  const s = screen(1024, 1024);
  s.ctx.setTransform(2, 0, 0, 2, 0, 0);
  // the cabinet is deep only to hold the electronics: the panel itself is a sandwich of two glass plates
  paint.push(G.rbox(2.1, 2.0, 1.4, 0.08, putty, [0, 1.2, -0.45]));
  soft.push(G.box(1.5, 0.2, 1.1, dark, [0, 0.1, -0.45], 0.03), G.bezel(1.86, 1.8, 1.42, 1.42, 0.02, 0.1, dark, [0, 1.22, 0.27], 0.05, 0.02));
  const panel = G.plane(1.46, 1.46, M.lit(s, 1.4, 0.9), [0, 1.22, 0.256]); panel.userData.noShadow = true;
  root.add(panel);
  // The touch frame: a raised rim round the screen with sixteen infrared lamps along the top and down one side, and
  // the sixteen cells that watch each row of them along the bottom and down the other side.
  soft.push(G.bezel(1.62, 1.62, 1.42, 1.42, 0.02, 0.03, ink(0x141517), [0, 1.22, 0.335], 0.04, 0.008));
  const lamps: V3[] = [], cells: V3[] = [];
  for (let i = 0; i < 16; i++) { const o = (i - 7.5) * 0.086; lamps.push([o, 0.35, -(1.22 + 0.758)], [-0.758, 0.35, -(1.22 + o)]); cells.push([o, 0.35, -(1.22 - 0.758)], [0.758, 0.35, -(1.22 + o)]); }
  // built lying down, then stood to face the room
  const eyes = G.group(studs(lamps, 0.011, ink(0x4c1010)), studs(cells, 0.011, ink(0x101014))); eyes.rotation.x = Q;
  soft.push(eyes);
  for (let i = 0; i < 9; i++) {
    for (const sx of [-1, 1]) soft.push(G.box(0.012, 0.023, 0.9, black, [sx * 1.051, 1.6 + (i - 4) * 0.0556, -0.5], 0));
    if (i < 8) soft.push(G.box(1.1, 0.012, 0.024, black, [0, 2.201, -0.55 - i * 0.055], 0));
  }
  // the back: a fan grille, the rating plate, the socket for the line to the computer, and the mains lead
  const rear = screen(512, 488), rc = rear.ctx;
  rc.clearRect(0, 0, 512, 488);
  const RU = (x: number) => 256 - x * 243.8, RV = (v: number) => 244 - (v - 1.2) * 243.8;      // 2.1 by 2.0, seen from behind
  rc.fillStyle = 'rgba(12,13,14,.9)';
  for (let ring = 0; ring < 7; ring++) for (let k = 0; k < Math.max(1, ring * 6); k++) { const a = (k / Math.max(1, ring * 6)) * Math.PI * 2; rc.beginPath(); rc.arc(RU(0.5 + Math.cos(a) * ring * 0.055), RV(1.55 + Math.sin(a) * ring * 0.055), 4.2, 0, 7); rc.fill(); }
  rc.fillStyle = '#c9ccc8'; rc.fillRect(RU(-0.2), RV(1.9), 0.6 * 243.8, 0.22 * 243.8);
  rc.fillStyle = rc.strokeStyle = 'rgba(20,21,22,.9)'; rc.lineWidth = 1.5; rc.strokeRect(RU(-0.2) + 4, RV(1.9) + 4, 0.6 * 243.8 - 8, 0.22 * 243.8 - 8);
  rc.textAlign = 'center'; rc.textBaseline = 'middle'; rc.font = '600 18px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif';
  rc.fillText('PLASMA TERMINAL', RU(-0.5), RV(1.83)); rc.fillText('115 V  60 HZ', RU(-0.5), RV(1.745));
  for (const u of [14, 498]) for (const v of [14, 474]) { rc.fillStyle = '#8f9390'; rc.beginPath(); rc.arc(u, v, 5, 0, 7); rc.fill(); }
  rear.tex.needsUpdate = true;
  const backFace = G.plane(2.1, 2.0, new THREE.MeshStandardMaterial({ map: rear.tex, transparent: true, roughness: 0.6 }), [0, 1.2, -1.1506]); backFace.rotation.y = Math.PI; backFace.userData.noShadow = true;
  root.add(backFace);
  soft.push(G.box(0.34, 0.1, 0.02, dark, [-0.5, 0.75, -1.152], 0), put(hoop(0.04, 0.016, black).rotateX(Q), 0.6, 0.55, -1.152));
  soft.push(cord([[0.6, 0.55, -1.14], [0.6, 0.5, -1.17], [0.6, 0.2, -1.172], [0.58, 0.04, -1.12], [0.5, 0.03, -1.0]], 0.02, black, 20, 6));
  // keyboard on its own lead: letter keys dark, the keys that steer a lesson lighter
  const ROWS = [15, 15, 14, 13], lie = (o: THREE.Object3D) => { const g = G.group(o); g.translateY(0.13).rotateX(0.178).translateZ(-0.02); const at = G.group(g); at.position.set(0, 0, 0.82); return at; };
  paint.push(G.profile([[-0.36, 0], [0.36, 0], [0.36, 0.06], [-0.36, 0.19]], 1.9, putty, [0, 0, 0.82]));
  soft.push(lie(G.group(keyCaps(ROWS, 0.1, 7, ink(0x2c2e31), ink(0x777a7d)), G.box(1.7, 0.01, 0.56, ink(0x15171a), [0, -0.002, 0.05], 0))));
  root.add(lie(keyLegends(ROWS, 0.1)));
  soft.push(cord([[0.7, 0.1, 0.5], [0.95, 0.03, 0.2], [0.8, 0.03, -0.1], [0.5, 0.1, -0.2]], 0.02, black, 24, 6), G.cyl(0.035, 0.06, black, [0.7, 0.1, 0.49], 10).rotateX(Q));
  root.add(weld(M.enamel(0xffffff), ...paint), weld(M.plastic(0xffffff, 0.55), ...soft));
  const noise = Array.from({ length: 9 }, (_, r) => Array.from({ length: 30 }, (_, c) => Math.sin(r * 91.7 + c * 37.3) > 0.1));
  return {
    root, inDark: 'glows', glow: 0xff7a22, view: [24, 10], surface: s.canvas,
    views: {
      seat: { at: [0, 1.75, 3.6], to: [0, 1.15, 0.26], fov: 44 },
      dots: { at: [-0.85, 1.5, 1], to: [-0.45, 1.38, 0.26], play: 0.4 },
    },
    update: ({ t }) => {
      const c = s.ctx;
      c.fillStyle = '#070301'; c.fillRect(0, 0, 512, 512);
      c.save(); c.translate(0, 110); dotMatrix(c, 512, 180, now().hhmmss, '#ff8a2a', '#2a1105', true, 0.74, 6); c.restore();
      c.fillStyle = '#ff8a2a';
      noise.forEach((row, r) => row.forEach((dot, col) => { if (dot && (r < 3 || r > 5)) { c.beginPath(); c.arc(52 + col * 14, 60 + r * 14 + (r > 5 ? 250 : 0), 4, 0, 7); c.fill(); } }));
      if (Math.floor(t * 2) % 2) c.fillRect(48, 448, 12, 16);
      s.tex.needsUpdate = true;
    },
  };
}

/** Field emission display, a corner of one enlarged a few thousand times: a cold cathode tip under every dot of phosphor. */
export function fed(): Built {
  const root = G.group();
  const COLS = 13, ROWS = 7, P = 0.15, W = COLS * P, D = ROWS * P, N = COLS * ROWS;
  const xz = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, (Math.floor(i / COLS) - (ROWS - 1) / 2) * P];
  // The cathode plate, from the bottom up. Row lines of metal on a resistive layer. A tip on the line for every dot.
  // An insulator with a well round each tip. Over that the gate: column lines of metal film, with a hole over every tip.
  const metal: THREE.BufferGeometry[] = [];
  for (let r = 0; r < ROWS; r++) metal.push(new THREE.BoxGeometry(W + 0.1, 0.006, P * 0.72).translate(-0.05, 0.075, (r - (ROWS - 1) / 2) * P));
  const cone = new THREE.ConeGeometry(0.036, 0.11, 16);
  for (let i = 0; i < N; i++) { const [x, z] = xz(i); metal.push(cone.clone().translate(x, 0.133, z)); }
  for (let c = 0; c < COLS; c++) {
    const strip = new THREE.Shape(), x = (c - (COLS - 1) / 2) * P, hw = P / 2 - 0.011;
    strip.moveTo(x - hw, -D / 2); strip.lineTo(x + hw, -D / 2); strip.lineTo(x + hw, D / 2); strip.lineTo(x - hw, D / 2);
    for (let r = 0; r < ROWS; r++) { const hole = new THREE.Path(); hole.absarc(x, (r - (ROWS - 1) / 2) * P, 0.042, 0, Math.PI * 2, true); strip.holes.push(hole); }
    metal.push(new THREE.ExtrudeGeometry(strip, { depth: 0.012, bevelEnabled: false, curveSegments: 14 }).rotateX(Math.PI / 2).translate(0, 0.206, 0));
  }
  root.add(new THREE.Mesh(G.merge(metal), new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.85, roughness: 0.3 })));
  // the insulator is clear, so the tips show in their wells from the side where the panel has been cut open
  const clear: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(1, 1, 0.116, 4, 1, true).rotateY(Math.PI / 4).scale(W / Math.SQRT2, 1, D / Math.SQRT2).translate(0, 0.136, 0)];
  for (let i = 0; i < N; i++) { const [x, z] = xz(i); clear.push(new THREE.CylinderGeometry(0.052, 0.052, 0.116, 14, 1, true).translate(x, 0.136, z)); }
  root.add(new THREE.Mesh(G.merge(clear), M.glass(0xd8cba6, 0.08, 0.45)));
  // The face plate. By day its phosphor shows as pale stripes in a black surround, three to a dot. Lit, they glow.
  const ph = screen(832, 448);
  ph.ctx.setTransform(2, 0, 0, 2, 0, 0);
  const day = screen(832, 448), dc = day.ctx, HUES = ['#ff4a3a', '#4dff6a', '#4a7bff'];
  dc.setTransform(2, 0, 0, 2, 0, 0);
  dc.fillStyle = '#060608'; dc.fillRect(0, 0, 416, 224);
  for (let i = 0; i < N; i++) ['#8f7d78', '#7f8f7b', '#7a8294'].forEach((tint, k) => { dc.fillStyle = tint; dc.fillRect(4 + (i % COLS) * 32 + k * 8.4, 5 + Math.floor(i / COLS) * 32, 6.4, 22); });
  day.tex.needsUpdate = true;
  const phMat = M.lit(ph, 1.7, 0); phMat.side = THREE.DoubleSide; phMat.color.set(0xffffff); phMat.map = day.tex;
  const phosphor = G.plane(W, D, phMat, [0, 0.94, 0]); phosphor.rotation.x = -Math.PI / 2; phosphor.userData.noShadow = true;
  const face = G.pane(W + 0.24, D + 0.24, 0.09, [0, 0.99, 0]); face.rotation.x = -Math.PI / 2;
  root.add(phosphor, face, weld(M.plastic(0xffffff, 0.45), G.box(W + 0.24, 0.06, D + 0.24, ink(0x101214), [0, 0.03, 0], 0.01), G.box(W, 0.012, D, ink(0x3a2f1c), [0, 0.066, 0], 0)));
  // glass ribs hold the plates apart against the air outside
  for (const z of [-D / 2 - 0.06, D / 2 + 0.06]) root.add(G.pane(W + 0.2, 0.86, 0.03, [0, 0.5, z]));
  // electron beams from tip to phosphor
  const pos = new Float32Array(N * 6), col = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) { const [x, z] = xz(i); pos.set([x, 0.188, z, x, 0.935, z], i * 6); }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const beams = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(beams);
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9db8ff, view: [28, 20],
    // from the open side, low enough to see the tips in their wells at the cut edge, and up to the phosphor
    views: { tips: { at: [1.8, 0.56, 0.55], to: [0.42, 0.3, 0], play: 0.35 } },
    update: () => {
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      const d = dots(n.hhmmss.slice(6));
      const c = ph.ctx; c.fillStyle = '#05060a'; c.fillRect(0, 0, 416, 224);
      for (let i = 0; i < N; i++) {
        const x = i % COLS, y = Math.floor(i / COLS), lit = d.on(x - 1, y);
        for (let k = 0; k < 3; k++) { c.fillStyle = lit ? HUES[k] : '#11131a'; c.fillRect(4 + x * 32 + k * 8.4, 5 + y * 32, 6.4, 22); }
        const v = lit ? 0.5 : 0, o = i * 6;
        col[o] = col[o + 3] = v * 0.5; col[o + 1] = col[o + 4] = v * 0.6; col[o + 2] = col[o + 5] = v;
      }
      ph.tex.needsUpdate = true; bg.attributes.color.needsUpdate = true;
    },
  };
}

/** Eggcrate: a matrix of ordinary lamps, each in its own cell of a baffle so its light does not spill. */
export function eggcrate(): Built {
  const root = G.group();
  const P = 0.15, CW = 5 * P, CH = 7 * P, Q = Math.PI / 2;
  const cx = [-1.5, -0.62, 0.62, 1.5];
  const N = 4 * 35 + 2;
  const at: V3[] = [];
  cx.forEach((x0) => { for (let i = 0; i < 35; i++) at.push([x0 + ((i % 5) - 2) * P, (3 - Math.floor(i / 5)) * P, 0]); });
  at.push([0, P, 0], [0, -P, 0]);
  // One lamp, screwed into its holder at the back of a cell: a clear glass globe, and inside it the filament on two
  // wires that rise from a glass stem. All the lamps are welded into two meshes, the glass and the rest.
  const globe = new THREE.LatheGeometry([[0.027, -0.052], [0.034, -0.04], [0.045, -0.024], [0.05, -0.004], [0.048, 0.014], [0.037, 0.034], [0.02, 0.046], [0, 0.05]].map(([r, y]) => new THREE.Vector2(r, y)), 20).rotateX(Q);
  const brass = ink(0xb08d4a), wire = ink(0x6a6d71), stem = ink(0xd6d3c8);
  const works = G.group(
    new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.036, 12).rotateX(Q).translate(0, 0, -0.068), brass),
    new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.01, 0.034, 10).rotateX(Q).translate(0, 0, -0.034), stem),
    new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.03).translate(-0.016, 0, -0.002), wire), new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.03).translate(0.016, 0, -0.002), wire),
    new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.005, 0.005).translate(0, 0, 0.013), wire),
  );
  const insides = at.map(([x, y]) => put(works.clone(), x, y, 0));
  root.add(weld(M.brass(), ...insides), new THREE.Mesh(G.merge(at.map(([x, y]) => globe.clone().translate(x, y, 0))), M.bulb(0x9fb1ae, 0.7)));
  // the light of each lamp, and the glare round it. The lamps stand still, so the floor's mirror may leave them out.
  const light = lamps(new THREE.SphereGeometry(0.056, 22, 14), N);
  const bloom = glows(N, 0.3);
  at.forEach(([x, y], i) => { light.put(i, x, y, 0.004); bloom.pos.set([x, y, 0.06], i * 3); });
  light.done(); bloom.flush(true);
  light.mesh.frustumCulled = true;
  bloom.points.geometry.computeBoundingBox();
  root.add(light.mesh, bloom.points);
  // The baffle. Its walls are thin at the front edge and thick at the back, so that each lamp sits at the bottom of
  // a cup, as an egg does in its tray. Everything round the lamps is black, so that a lamp that is off shows dark.
  const black = ink(0x0b0c0d), tin = ink(0x23262a), steel = ink(0x9aa0a6);
  const wall = (len: number, upright: boolean, x: number, y: number) => {
    const geo = new THREE.BoxGeometry(upright ? 0.012 : len, upright ? len : 0.012, 0.13), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) < 0) { if (upright) p.setX(i, p.getX(i) * 3.6); else p.setY(i, p.getY(i) * 3.6); }
    geo.computeVertexNormals();
    return put(new THREE.Mesh(geo, black), x, y, 0.02);
  };
  const dull: THREE.Object3D[] = [], box: THREE.Object3D[] = [], bright: THREE.Object3D[] = [];
  // one character, or the colon: its cells, the plate the lamp holders are fixed in, and the sheet-metal case round them
  const unit = (x0: number, cols: number, rows: number, hood: boolean) => {
    const w = cols * P, h = rows * P;
    for (let i = 0; i <= cols; i++) dull.push(wall(h, true, x0 + (i - cols / 2) * P, 0));
    for (let j = 0; j <= rows; j++) dull.push(wall(w, false, x0, (j - rows / 2) * P));
    dull.push(G.box(w + 0.01, h + 0.01, 0.02, ink(0x121212), [x0, 0, -0.045], 0));
    for (const sg of [-1, 1]) {
      box.push(G.box(w + 0.12, 0.054, 0.145, tin, [x0, sg * (h / 2 + 0.033), 0.0225], 0.006), G.box(0.054, h + 0.012, 0.145, tin, [x0 + sg * (w / 2 + 0.033), 0, 0.0225], 0.006));
      bright.push(bolts([[x0 + sg * (w / 2 + 0.033), h / 2 + 0.033, 0.095], [x0 + sg * (w / 2 + 0.033), -h / 2 - 0.033, 0.095]], 0.011, 'z'));
    }
    // a visor against the studio lights
    if (hood) box.push(G.box(w + 0.16, 0.02, 0.26, tin, [x0, h / 2 + 0.075, 0.03], 0.004));
  };
  cx.forEach((x0) => {
    unit(x0, 5, 7, true);
    box.push(G.box(CW + 0.12, CH + 0.12, 0.3, tin, [x0, 0, -0.2], 0.012));
    // the case is slotted behind, to let the heat of thirty-five lamps out
    for (let i = 0; i < 6; i++) dull.push(G.box(0.5, 0.016, 0.006, black, [x0, 0.3 - i * 0.055, -0.351], 0));
    bright.push(G.rod([x0, -CH / 2 + 0.04, -0.35], [x0, -CH / 2 + 0.04, -0.39], 0.03, steel, 10));
  });
  unit(0, 1, 3, false);
  box.push(G.box(0.34, CH + 0.12, 0.3, tin, [0, 0, -0.2], 0.012));
  // one conduit along the back carries the wiring from case to case
  bright.push(G.rod([-1.5, -CH / 2 + 0.04, -0.39], [1.5, -CH / 2 + 0.04, -0.39], 0.026, steel, 10));
  // the stand: a rail on two posts
  bright.push(G.box(4.3, 0.1, 0.5, steel, [0, -CH / 2 - 0.11, -0.2], 0.012));
  for (const x of [-1.9, 1.9]) bright.push(G.cyl(0.04, 0.5, steel, [x, -CH / 2 - 0.4, -0.2], 14), G.cyl(0.24, 0.04, steel, [x, -CH / 2 - 0.66, -0.2], 24), G.cyl(0.075, 0.03, steel, [x, -CH / 2 - 0.175, -0.2], 14));
  root.add(weld(M.plastic(0xffffff, 0.75), ...dull), weld(M.dark(), ...box), weld(M.steel(), ...bright));
  const level = new Float32Array(N);
  // the pattern of each character, worked out again only when the minute changes
  let shown = '', shapes = [dots(' '), dots(' '), dots(' '), dots(' ')];
  return {
    root, inDark: 'glows', glow: 0xffc070, view: [18, 6], zoom: 1.08,
    views: {
      below: { room: true, at: [2.5, 0.25, 2.2], to: [0.5, 0, 0], fov: 50 },
      lamps: { at: [1, 0.25, 0.75], to: [0.62, 0.1, 0] },
    },
    update: () => {
      const n = now();
      if (n.hhmm !== shown) { shown = n.hhmm; shapes = [...n.hhmm.replace(':', '')].map((ch) => dots(ch)); }
      for (let i = 0; i < N; i++) {
        const lit = i >= 140 ? n.s % 2 === 0 : shapes[Math.floor(i / 35)].on(i % 5, Math.floor((i % 35) / 5));
        // filaments take a moment to heat and cool, which is the eggcrate's whole look
        level[i] += ((lit ? 1 : 0) - level[i]) * (lit ? 0.16 : 0.09);
        const v = level[i], o = i * 3;
        light.tint(i, v, v * 0.74, v * 0.38);
        bloom.col[o] = v * 0.9; bloom.col[o + 1] = v * 0.6; bloom.col[o + 2] = v * 0.26;
      }
      if (light.mesh.instanceColor) light.mesh.instanceColor.needsUpdate = true;
      bloom.flush();
    },
  };
}

/**
 * Colour-wheel television. A black-and-white tube shows the red, green and blue parts of a picture in turn, and a
 * wheel of filters turning in front of it colours each one. The model runs slowly first, so that the three
 * separate pictures can be seen, and then at speed, where they merge.
 */
export function colourWheel(): Built {
  const root = G.group();
  const s = screen(384, 288), tube = M.lit(s, 1.5, 0.5);
  const walnut = ink(0x5a3b22), trim = ink(0x2e1e12), steel = ink(0x9aa0a6), bakelite = ink(0x1a130d);
  // SY: the height of the middle of the screen. AXLE: the height of the wheel's axle. R: the size of the wheel. FACE: the front of the cabinet.
  const SY = 1.04, AXLE = 0.62, R = 0.62, FACE = 0.3, W = 384, H = 288, Q = Math.PI / 2;
  const wood: THREE.Object3D[] = [], metal: THREE.Object3D[] = [], soft: THREE.Object3D[] = [];
  // the receiver: a veneered cabinet with rounded shoulders on a darker plinth, a moulded mask round the screen
  const front = new THREE.Shape();
  front.moveTo(-0.43, 0.05); front.lineTo(0.43, 0.05); front.lineTo(0.43, 1.28); front.absarc(0.36, 1.28, 0.07, 0, Q, false); front.lineTo(-0.36, 1.35); front.absarc(-0.36, 1.28, 0.07, Q, Math.PI, false);
  wood.push(G.extruded(front, 0.56, walnut, undefined, 0.012), G.box(0.92, 0.05, 0.64, trim, [0, 0.025, 0], 0.012));
  wood.push(G.bezel(0.52, 0.44, 0.36, 0.28, 0.05, 0.03, trim, [0, SY, FACE - 0.02]), G.bezel(0.58, 0.34, 0.5, 0.26, 0.02, 0.02, trim, [0, 0.36, FACE - 0.014], 0.03, 0.006));
  root.add(G.bulge(0.37, 0.29, 0.03, tube, [0, SY, FACE - 0.03]));
  // the loudspeaker behind its woven cloth and three slats
  const weave = screen(32, 32), wc = weave.ctx;
  wc.fillStyle = '#6b5a3a'; wc.fillRect(0, 0, 32, 32);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { wc.fillStyle = (i + j) % 2 ? 'rgba(255,236,190,.2)' : 'rgba(0,0,0,.22)'; wc.fillRect(i * 4, j * 4, 3, 3); }
  weave.tex.wrapS = weave.tex.wrapT = THREE.RepeatWrapping; weave.tex.repeat.set(14, 7); weave.tex.needsUpdate = true;
  root.add(G.plane(0.52, 0.28, new THREE.MeshStandardMaterial({ map: weave.tex, roughness: 1 }), [0, 0.36, FACE - 0.019]));
  for (const dy of [-0.065, 0, 0.065]) wood.push(G.box(0.5, 0.016, 0.014, trim, [0, 0.36 + dy, FACE - 0.012], 0));
  // two knobs, turned from bakelite, each with a pointer line
  for (const sx of [-1, 1]) {
    const dial = G.lathe([[0.046, 0], [0.046, 0.008], [0.036, 0.014], [0.033, 0.04], [0.028, 0.046], [0, 0.046]], bakelite, 20);
    dial.rotation.x = Q; dial.position.set(sx * 0.32, 0.66, FACE - 0.02);
    soft.push(dial, G.box(0.006, 0.026, 0.004, ink(0xd8d0bc), [sx * 0.32, 0.676, FACE + 0.026], 0));
  }
  // the back: a perforated board with a paper label, and the two aerial terminals
  const board = screen(256, 384), bc = board.ctx;
  bc.fillStyle = '#4b3524'; bc.fillRect(0, 0, 256, 384);
  bc.fillStyle = '#17100a';
  for (let v = 40; v < 240; v += 14) for (let u = 31; u < 230; u += 14) { bc.beginPath(); bc.arc(u, v, 3.2, 0, 7); bc.fill(); }
  for (const u of [12, 244]) for (const v of [12, 372]) { bc.fillStyle = '#9a8f78'; bc.beginPath(); bc.arc(u, v, 4.5, 0, 7); bc.fill(); }
  bc.fillStyle = '#d9d0b8'; bc.fillRect(60, 276, 136, 70);
  bc.fillStyle = 'rgba(40,36,30,.55)'; for (let i = 0; i < 6; i++) bc.fillRect(70, 288 + i * 9, i % 3 === 2 ? 70 : 116, 2);
  board.tex.needsUpdate = true;
  const rear = G.plane(0.78, 1.17, new THREE.MeshStandardMaterial({ map: board.tex, roughness: 0.9 }), [0, 0.7, -0.2806]); rear.rotation.y = Math.PI;
  root.add(rear);
  soft.push(G.box(0.16, 0.05, 0.02, bakelite, [-0.24, 1.16, -0.29], 0));
  metal.push(bolts([[-0.28, 1.16, -0.3], [-0.2, 1.16, -0.3]], 0.012, 'z', -1, 0xb08d4a));

  // The adapter. A small motor on a plate screwed to the face of the cabinet turns the wheel on its shaft: six
  // filters, two of each colour, held between the spokes of a light steel frame.
  metal.push(put(sheetOf(0.3, 0.22, 0.03, 0.012, steel), 0, AXLE, FACE - 0.014), bolts([[-0.12, AXLE + 0.08, FACE - 0.008], [0.12, AXLE + 0.08, FACE - 0.008], [-0.12, AXLE - 0.08, FACE - 0.008], [0.12, AXLE - 0.08, FACE - 0.008]], 0.012, 'z'));
  const can = G.lathe([[0.085, 0], [0.085, 0.045, 1], [0.078, 0.055], [0.04, 0.06, 1], [0.04, 0.07]], ink(0x1b1c1e), 28, true); can.rotation.x = Q; can.position.set(0, AXLE, FACE - 0.008);
  soft.push(can, cord([[0.07, AXLE - 0.05, FACE + 0.02], [0.115, AXLE - 0.1, FACE + 0.03], [0.13, AXLE - 0.145, FACE + 0.012], [0.125, AXLE - 0.155, FACE - 0.02]], 0.008, ink(0x3a2a1a), 12, 5), put(hoop(0.014, 0.006, ink(0x151515)).rotateX(Q), 0.125, AXLE - 0.155, FACE - 0.02));
  metal.push(G.rod([0, AXLE, FACE + 0.06], [0, AXLE, FACE + 0.1], 0.012, steel, 10));
  const COLOURS = [0xff2a1a, 0x1fd13a, 0x2a4bff];
  const wheel = G.group(), frame: THREE.Object3D[] = [];
  const filters = COLOURS.map((c, i) => {
    const m = new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.4, roughness: 0.15, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
    wheel.add(new THREE.Mesh(G.merge([i, i + 3].map((k) => new THREE.CircleGeometry(R, 20, (k * Math.PI) / 3, Math.PI / 3))), m));
    return m;
  });
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3, c = Math.cos(a), sn = Math.sin(a);
    const spoke = G.box(R - 0.04, 0.022, 0.006, steel, [(c * (R + 0.04)) / 2, (sn * (R + 0.04)) / 2, 0], 0); spoke.rotation.z = a;
    // rivets hold the edges of the two filters that meet on each spoke. Built lying down, then stood to face the hall.
    const rivets = studs([0.16, 0.3, 0.44, 0.57].map((r): V3 => [c * r, 0.003, -sn * r]), 0.009, steel); rivets.rotation.x = Q;
    frame.push(spoke, rivets);
  }
  const rim = G.lathe([[R - 0.012, -0.012], [R + 0.006, -0.012], [R + 0.006, 0.012], [R - 0.012, 0.012]], steel, 64); rim.rotation.x = Q;
  const hub = G.lathe([[0.075, -0.006], [0.075, 0.006, 1], [0.042, 0.008, 1], [0.042, 0.03, 1], [0, 0.03]], steel, 24, true); hub.rotation.x = Q;
  const nuts = studs(Array.from({ length: 6 }, (_, i): V3 => [Math.cos(i * 1.047 + 0.52) * 0.058, 0.006, Math.sin(i * 1.047 + 0.52) * 0.058]), 0.008, steel); nuts.rotation.x = Q;
  frame.push(rim, hub, nuts);
  const blur = new THREE.MeshStandardMaterial({ color: 0xa9a2b4, transparent: true, opacity: 0, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  wheel.add(new THREE.Mesh(new THREE.CircleGeometry(R, 48), blur), weld(M.steel(), ...frame));
  wheel.position.set(0, AXLE, FACE + 0.07);
  root.add(wheel, weld(M.wood(0xffffff), ...wood), weld(M.steel(), ...metal), weld(M.plastic(0xffffff, 0.4), ...soft));
  // the picture: colour bars above the time. One field of it is that colour's share, shown in white light
  const BARS: [number, number, number][] = [[1, 1, 1], [1, 1, 0], [0, 1, 1], [0, 1, 0], [1, 0, 1], [1, 0, 0], [0, 0, 1]];
  const INK: [number, number, number] = [1, 0.62, 0.12];
  const paint = (field: number, text: string) => {
    const { ctx } = s;
    const tone = (c: [number, number, number]) => {
      if (field === 3) return `rgb(${c.map((x) => Math.round(255 * x)).join(',')})`;
      const g = Math.round(255 * c[field]);
      return `rgb(${g},${g},${g})`;
    };
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
    BARS.forEach((c, i) => { ctx.fillStyle = tone(c); ctx.fillRect(Math.round((i * W) / 7), 0, Math.ceil(W / 7), H * 0.5); });
    ctx.save(); ctx.translate(0, H * 0.5); bigTime(ctx, W, H * 0.5, text, tone(INK), 800, 0.8); ctx.restore();
    s.tex.needsUpdate = true;
  };
  let angle = 0, before = 0, shown = -1, label = '';
  return {
    root, inDark: 'glows', glow: 0xcfd6ff, view: [20, 8], surface: s.canvas,
    update: ({ t }) => {
      const fast = t % 16 >= 8; // eight seconds slowly, then eight at speed
      angle += (fast ? 11 : 0.85) * Math.min(0.1, Math.max(0, t - before)); before = t;
      wheel.rotation.z = -angle;
      // the filter that stands in front of the screen, which is straight above the axle
      const k = Math.floor((((Math.PI / 2 + angle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (Math.PI / 3)) % 3;
      const field = fast ? 3 : k, text = now().hhmm;
      if (field !== shown || text !== label) { paint(field, text); shown = field; label = text; }
      tube.emissive.setHex(fast ? 0xffffff : COLOURS[k]);
      for (const m of filters) m.opacity = fast ? 0.13 : 0.4;
      blur.opacity = fast ? 0.2 : 0;
    },
  };
}
