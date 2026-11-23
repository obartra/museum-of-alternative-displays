import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

export type V3 = [number, number, number];
/** A point on a turning profile: radius and height. A third value of 1 marks a hard corner. */
export type P2 = [number, number] | [number, number, 1];

/** What the stage tells a model on every frame. */
export interface Env {
  /** Seconds since the piece was put on the plinth. */
  t: number;
  /** Hall lights, 0 (off) to 1 (on). */
  lights: number;
  camera: THREE.Camera;
}

/** How the piece behaves when the hall lights go off. */
export type InDark = 'glows' | 'vanishes' | 'better';

/**
 * A place to look from, offered as a button beside the stand. Its words (the button, and a line about what to notice)
 * are in src/data/views.ts under the same id, with the rest of the text. Here are only the camera's two points.
 *
 * `at` and `to` are in the model's own coordinates, the ones its parts are built in, before the stage scales it to fit.
 * With `room` set, `at` is a place in the room instead, in metres: the stand's axis is x = 0, z = 0, its top is at
 * y = 0.22 and the floor at y = -0.95, so a standing eye is near y = 0.65 and a seated one near y = 0.25. The visitor
 * first sees the piece from +z. The room runs from x = -5.4 (the east windows) to 8.2 and from z = -1.5 (the south
 * windows, behind the piece) to 8.5. `to` is always a point on the model.
 */
export interface Spot {
  at: V3;
  to: V3;
  room?: boolean;
  /** Vertical field of view in degrees. A person view defaults to 38, a detail view to 32. */
  fov?: number;
  /** How far the camera may swing about `to`, in radians. A person view defaults to 0.1, a detail view to 0.5. */
  play?: number;
}

export interface Built {
  root: THREE.Group;
  update?: (env: Env) => void;
  /** Colour of the light the piece throws on its surroundings in the dark. */
  glow?: number;
  inDark: InDark;
  /** Camera azimuth and elevation in degrees for the opening view. */
  view?: [number, number];
  /** Extra zoom for small or flat pieces. 1 is the default framing. */
  zoom?: number;
  /** A live canvas worth showing flat as a close-up of the lit surface. */
  surface?: HTMLCanvasElement;
  /** Places to look from, by the id they have in src/data/views.ts. */
  views?: Record<string, Spot>;
  /**
   * For a piece whose picture is worked out afresh for every pixel: the share of the usual pixels across that the
   * stand draws it with on a phone or a tablet. 0.5 is half as many each way, a quarter of the work.
   */
  thrift?: number;
}

export interface Screen {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
}

const v = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], p?: V3): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  if (p) m.position.set(p[0], p[1], p[2]);
  return m;
}

// ---------- surfaces ----------

/** Value noise in GLSL, for anything that should not look perfectly even. */
export const NOISE = /* glsl */ `
float h31(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`;

const FINISHES = ['paint', 'metal', 'wood', 'matte'] as const;
type Finish = (typeof FINISHES)[number];

/**
 * Nothing in a workshop is perfectly even. This gives a surface the small variation that
 * tells paint from brushed metal from wood, worked out from where the point sits on the object.
 */
function finish<T extends THREE.MeshStandardMaterial>(m: T, kind: Finish, axis = 0): T {
  m.defines = { ...(m.defines ?? {}), FINISH: FINISHES.indexOf(kind), GRAIN: axis, GRAIN_B: (axis + 1) % 3 };
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vObj;\n${NOISE}`)
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
        #if FINISH == 2
          vec3 gq = vObj * 9.0; gq[GRAIN] *= 0.1;
          float gn = vnoise(gq) * 0.65 + vnoise(gq * 2.7 + 7.3) * 0.35;
          float gring = 0.5 + 0.5 * sin((gq[GRAIN_B] * 1.6 + gn * 5.0) * 6.2831);
          vec3 gf = vObj * 110.0; gf[GRAIN] *= 0.018;
          float gfibre = vnoise(gf);
          diffuseColor.rgb *= 0.74 + 0.22 * gn + 0.12 * gring - 0.14 * gfibre;
        #elif FINISH == 1
          diffuseColor.rgb *= 0.95 + 0.1 * vnoise(vObj * 4.0);
        #else
          diffuseColor.rgb *= 0.955 + 0.09 * vnoise(vObj * 3.3 + 5.0);
        #endif`)
      .replace('#include <roughnessmap_fragment>', /* glsl */ `#include <roughnessmap_fragment>
        #if FINISH == 2
          roughnessFactor = clamp(roughnessFactor + 0.2 * (gfibre - 0.5), 0.2, 1.0);
        #elif FINISH == 1
          vec3 gb = vObj * 46.0; gb[GRAIN] *= 0.05;
          roughnessFactor = clamp(roughnessFactor * (0.92 + 0.16 * vnoise(gb)), 0.03, 1.0);
        #elif FINISH == 0
          roughnessFactor = clamp(roughnessFactor * (0.8 + 0.4 * vnoise(vObj * 8.0)), 0.04, 1.0);
        #endif`)
      .replace('#include <normal_fragment_maps>', /* glsl */ `#include <normal_fragment_maps>
        #if FINISH == 0
          vec3 gp = vObj * 60.0;
          normal = normalize(normal + 0.03 * (vec3(vnoise(gp), vnoise(gp + 17.0), vnoise(gp + 31.0)) - 0.5));
        #endif`);
  };
  m.customProgramCacheKey = () => 'finish';
  return m;
}

const std = (color: number, roughness: number, metalness: number, kind: Finish, axis = 0) =>
  finish(new THREE.MeshStandardMaterial({ color, roughness, metalness }), kind, axis);

/**
 * Clear glass, the way it shows against a bright wall: almost nothing face on,
 * a dark line where the wall of the vessel turns away, and the lamps mirrored on top.
 */
function glassy(m: THREE.MeshPhysicalMaterial, rim: number, glow: number): THREE.MeshPhysicalMaterial {
  const u = { uRim: { value: rim }, uGlow: { value: new THREE.Color(glow) } };
  m.premultipliedAlpha = true;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uRim;\nuniform vec3 uGlow;')
      .replace('#include <opaque_fragment>', /* glsl */ `
        float gNdv = abs(dot(normalize(normal), normalize(vViewPosition)));
        float gRim = pow(1.0 - gNdv, 2.4);
        float gEdge = gRim * uRim;
        float gA = clamp(diffuseColor.a + gEdge, 0.0, 1.0);
        // the wall of the vessel seen edge on is dark, never milky
        gl_FragColor = vec4(totalDiffuse * (diffuseColor.a + 0.26 * gEdge) + totalSpecular * (1.0 - 0.7 * gRim) + uGlow * (0.06 + gRim), gA);`)
      .replace('#include <premultiplied_alpha_fragment>', '');
  };
  m.customProgramCacheKey = () => 'glassy';
  return m;
}

/** Materials. Each call returns a fresh material so a model can be disposed without touching another. */
export const M = {
  steel: (axis = 0) => std(0x9aa0a6, 0.34, 0.9, 'metal', axis),
  dark: (axis = 0) => std(0x23262a, 0.46, 0.55, 'metal', axis),
  black: () => std(0x0b0c0d, 0.62, 0.05, 'matte'),
  brass: (axis = 0) => std(0xb08d4a, 0.3, 0.9, 'metal', axis),
  copper: (axis = 0) => std(0xb5693a, 0.38, 0.9, 'metal', axis),
  chrome: () => new THREE.MeshStandardMaterial({ color: 0xe8ecef, roughness: 0.06, metalness: 1 }),
  enamel: (c: number) => std(c, 0.3, 0.02, 'paint'),
  plastic: (c: number, rough = 0.55) => std(c, rough, 0, 'paint'),
  paper: (c = 0xf1eee4) => std(c, 0.95, 0, 'matte'),
  /** Wood with grain running along one axis of the part: 0 is x, 1 is y, 2 is z. */
  wood: (c = 0xa2713f, axis = 0) => std(c, 0.7, 0, 'wood', axis),
  pcb: () => std(0x1d5236, 0.55, 0.1, 'paint'),
  ceramic: () => std(0xe3dfd4, 0.42, 0, 'paint'),
  rubber: () => std(0x151515, 0.9, 0, 'matte'),
  cloth: (c: number) => { const m = std(c, 1, 0, 'matte'); m.side = THREE.DoubleSide; return m; },
  /** A flat pane or solid block of glass. Drawn after what it contains. */
  glass: (tint = 0xb9c9c6, opacity = 0.1, rim = 0.6) => glassy(new THREE.MeshPhysicalMaterial({
    color: tint, roughness: 0.03, metalness: 0, transparent: true, opacity, depthWrite: false, envMapIntensity: 1.5, side: THREE.DoubleSide,
  }), rim, 0),
  /** A blown glass envelope: only the near wall is drawn, so what is inside stays crisp. `glow` is light from inside caught in the wall. */
  bulb: (tint = 0x9fb1ae, rim = 0.72, glow = 0x000000) => glassy(new THREE.MeshPhysicalMaterial({
    color: tint, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.045, depthWrite: false, envMapIntensity: 1.5, side: THREE.FrontSide,
  }), rim, glow),
  /** Something that makes light. Unaffected by the hall lights. */
  glow: (c: number, intensity = 1.5) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: c, emissiveIntensity: intensity, roughness: 1 }),
  /** A surface that shows a live canvas by emitting light, behind a sheet of glass that mirrors the room. */
  lit: (s: Screen, intensity = 1.25, gloss = 0.7) => new THREE.MeshPhysicalMaterial({
    color: 0x050505, emissive: 0xffffff, emissiveMap: s.tex, emissiveIntensity: intensity, roughness: 0.42, clearcoat: gloss, clearcoatRoughness: 0.05,
  }),
  /** A surface that shows a live canvas by reflecting the hall lights, like print. */
  printed: (s: Screen, rough = 0.92) => new THREE.MeshStandardMaterial({ map: s.tex, roughness: rough, metalness: 0 }),
  /** Light added on top of whatever is behind: beams, ghosts, images on fog. */
  add: (s: Screen | null, color = 0xffffff, opacity = 1) => new THREE.MeshBasicMaterial({
    map: s ? s.tex : null, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }),
};

// ---------- shapes ----------

function rrect<T extends THREE.Path>(path: T, w: number, h: number, r: number): T {
  const x = -w / 2, y = -h / 2, q = Math.PI / 2;
  r = Math.max(0.0005, Math.min(r, w / 2, h / 2));
  path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.absarc(x + w - r, y + r, r, -q, 0, false);
  path.lineTo(x + w, y + h - r); path.absarc(x + w - r, y + h - r, r, 0, q, false);
  path.lineTo(x + r, y + h); path.absarc(x + r, y + h - r, r, q, 2 * q, false);
  path.lineTo(x, y + r); path.absarc(x + r, y + r, r, 2 * q, 3 * q, false);
  return path;
}

function extrude(shape: THREE.Shape, t: number, b: number, curve = 10): THREE.BufferGeometry {
  b = Math.min(b, t * 0.45);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t - 2 * b, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 2, curveSegments: curve });
  geo.translate(0, 0, -(t - 2 * b) / 2);
  return toCreasedNormals(geo, 0.7);
}

/** Smooth a turning profile through its points, keeping the corners marked hard. */
export function spline(pts: P2[], sub = 6): [number, number][] {
  const out: [number, number][] = [];
  let run: P2[] = [];
  const flush = () => {
    if (run.length < 3) for (const p of run) out.push([p[0], p[1]]);
    else {
      const c = new THREE.CatmullRomCurve3(run.map((p) => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal');
      for (const p of c.getPoints((run.length - 1) * sub)) out.push([Math.max(0, p.x), p.y]);
    }
  };
  pts.forEach((p, i) => {
    run.push(p);
    if (p[2] === 1 && i > 0 && i < pts.length - 1) { flush(); run = [p]; }
  });
  flush();
  return out;
}

/** A turned part with eased edges: flat ends, straight side, a small round where they meet. */
function turned(rb: number, rt: number, h: number, seg: number): THREE.BufferGeometry {
  const y0 = -h / 2, y1 = h / 2, n = 3;
  const cb = Math.min(0.014, Math.min(rb, h) * 0.2), ct = Math.min(0.014, Math.min(rt, h) * 0.2);
  const p: THREE.Vector2[] = [new THREE.Vector2(0, y0)];
  const dup = (x: number, y: number) => { p.push(new THREE.Vector2(x, y), new THREE.Vector2(x, y)); };
  if (cb > 0.0008) {
    dup(rb - cb, y0);
    for (let i = 1; i < n; i++) { const a = -Math.PI / 2 + (i / n) * (Math.PI / 2); p.push(new THREE.Vector2(rb - cb + Math.cos(a) * cb, y0 + cb + Math.sin(a) * cb)); }
    dup(rb, y0 + cb);
  } else dup(rb, y0);
  if (ct > 0.0008) {
    dup(rt, y1 - ct);
    for (let i = 1; i < n; i++) { const a = (i / n) * (Math.PI / 2); p.push(new THREE.Vector2(rt - ct + Math.cos(a) * ct, y1 - ct + Math.sin(a) * ct)); }
    dup(rt - ct, y1);
  } else dup(rt, y1);
  p.push(new THREE.Vector2(0, y1));
  return new THREE.LatheGeometry(p, seg);
}

export const G = {
  /** A block with eased edges, as anything cast, moulded or sawn has. Pass `r = 0` for a razor edge. */
  box: (w: number, h: number, d: number, mat: THREE.Material | THREE.Material[], p?: V3, r?: number) => {
    const least = Math.min(w, h, d), rr = r ?? Math.min(0.016, least * 0.16);
    return mesh(least < 0.02 || rr <= 0 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 2, rr), mat, p);
  },
  rbox: (w: number, h: number, d: number, r: number, mat: THREE.Material, p?: V3) => mesh(new RoundedBoxGeometry(w, h, d, r > 0.045 ? 5 : 3, r), mat, p),
  cyl: (r: number, h: number, mat: THREE.Material | THREE.Material[], p?: V3, seg = 48, rTop = r) =>
    mesh(Array.isArray(mat) || Math.min(r, rTop) < 0.004 ? new THREE.CylinderGeometry(rTop, r, h, seg) : turned(r, rTop, h, seg), mat, p),
  sph: (r: number, mat: THREE.Material, p?: V3, seg = 40) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat, p),
  plane: (w: number, h: number, mat: THREE.Material, p?: V3) => mesh(new THREE.PlaneGeometry(w, h), mat, p),
  torus: (r: number, tube: number, mat: THREE.Material, p?: V3, arc = Math.PI * 2) => mesh(new THREE.TorusGeometry(r, tube, 20, 84, arc), mat, p),
  /** Solid of revolution about the Y axis from [radius, y] pairs. With `smooth`, the profile is a curve through the points. */
  lathe: (pts: P2[], mat: THREE.Material, seg = 72, smooth = false) =>
    mesh(new THREE.LatheGeometry((smooth ? spline(pts) : pts).map(([r, y]) => new THREE.Vector2(r, y)), seg), mat),
  /** A straight rod between two points. */
  rod: (a: V3, b: V3, r: number, mat: THREE.Material, seg = 12) => {
    const A = v(a), B = v(b);
    const len = A.distanceTo(B);
    const m = mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    m.position.copy(A).lerp(B, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return m;
  },
  /** A smooth bent wire through the points. */
  wire: (pts: V3[], r: number, mat: THREE.Material, closed = false, radial = 8) =>
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v), closed, 'catmullrom', 0.35), Math.max(16, pts.length * 8), r, radial, closed), mat),
  /** A round face that bulges towards +z, like the front of an early picture tube. The picture is mapped flat across it. */
  dish: (r: number, sag: number, mat: THREE.Material, p?: V3) => {
    const geo = new THREE.RingGeometry(0.0001, r, 72, 14), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const q = (pos.getX(i) ** 2 + pos.getY(i) ** 2) / (r * r); pos.setZ(i, sag * (1 - q)); }
    geo.computeVertexNormals();
    return mesh(geo, mat, p);
  },
  /** A screen face that bulges like the end of a tube. The picture runs corner to corner. */
  bulge: (w: number, h: number, depth: number, mat: THREE.Material, p?: V3) => {
    const geo = new THREE.PlaneGeometry(w, h, 30, 24), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) / (w / 2), y = pos.getY(i) / (h / 2); pos.setZ(i, depth * (1 - (x * x + y * y) / 2)); }
    geo.computeVertexNormals();
    return mesh(geo, mat, p);
  },
  /** A plate with a rounded window cut out of it: a bezel, a mask, a mount. It faces +z. */
  bezel: (w: number, h: number, ow: number, oh: number, or: number, t: number, mat: THREE.Material, p?: V3, r = 0.03, b = 0.012) => {
    const shape = rrect(new THREE.Shape(), w, h, r);
    shape.holes.push(rrect(new THREE.Path(), ow, oh, or));
    return mesh(extrude(shape, t, b), mat, p);
  },
  /** A flat shape with rounded corners and some thickness: a card, a tile, a tray. It faces +z. */
  slab: (w: number, h: number, r: number, t: number, mat: THREE.Material, p?: V3, b = 0.008) => mesh(extrude(rrect(new THREE.Shape(), w, h, r), t, b), mat, p),
  /** A rounded plate with round holes through it: a lens board, a flange. It faces +z. */
  cut: (w: number, h: number, r: number, holes: [number, number, number][], t: number, mat: THREE.Material, p?: V3, b = 0.008) => {
    const shape = rrect(new THREE.Shape(), w, h, r);
    for (const [x, y, hr] of holes) { const path = new THREE.Path(); path.absarc(x, y, hr, 0, Math.PI * 2, true); shape.holes.push(path); }
    return mesh(extrude(shape, t, b, 24), mat, p);
  },
  /** Any flat outline given some thickness along z. */
  extruded: (shape: THREE.Shape, t: number, mat: THREE.Material, p?: V3, b = 0.008) => mesh(extrude(shape, t, b, 16), mat, p),
  /** A side view pushed across a width: wedges, hoods, brackets. Points are [z, y], width runs along x. */
  profile: (pts: [number, number][], width: number, mat: THREE.Material, p?: V3, b = 0.012) => {
    const geo = extrude(new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y))), width, b, 16);
    geo.rotateY(-Math.PI / 2);
    return mesh(geo, mat, p);
  },
  /** A sheet of glass with ground edges, which is how you can tell that it is there. It faces +z. */
  pane: (w: number, h: number, t: number, p?: V3, tint = 0xb9c9c6, opacity = 0.08) => {
    const edge = new THREE.MeshPhysicalMaterial({ color: 0x3f7f6e, roughness: 0.3, transparent: true, opacity: 0.6, depthWrite: false });
    const face = M.glass(tint, opacity);
    return mesh(new THREE.BoxGeometry(w, h, t), [edge, edge, edge, edge, face, face], p);
  },
  group: (...kids: THREE.Object3D[]) => { const g = new THREE.Group(); if (kids.length) g.add(...kids); return g; },
  merge: (geos: THREE.BufferGeometry[]) => mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g)), false) as THREE.BufferGeometry,
};

/** A typewriter keyboard: staggered rows of sculpted caps and a space bar. Back row first; the front edge is at +z. */
export function keyboard(rows: number[], pitch: number, cap: THREE.Material, space = 0): THREE.Group {
  const k = pitch * 0.84, h = pitch * 0.42;
  const geo = new RoundedBoxGeometry(k, h, k, 2, pitch * 0.09);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) { pos.setX(i, pos.getX(i) * 0.8); pos.setZ(i, pos.getZ(i) * 0.8 - pitch * 0.03); }
  const total = rows.reduce((a, b) => a + b, 0);
  const keys = new Swarm(geo, cap, total);
  const stagger = [0, 0.5, 0.75, 1.25, 0.5];
  let i = 0;
  rows.forEach((n, r) => {
    const x0 = -((rows[0] - 1) / 2) * pitch + ((stagger[r] ?? 0) - 0.5) * pitch * 0.9;
    for (let c = 0; c < n; c++) keys.put(i++, x0 + c * pitch, h / 2 - r * pitch * 0.04, (r - (rows.length - 1) / 2) * pitch);
  });
  keys.done();
  const g = G.group(keys.mesh);
  if (space > 0) g.add(G.rbox(space * pitch, h * 0.9, k, pitch * 0.09, cap, [0, h * 0.4 - rows.length * pitch * 0.04, ((rows.length + 1) / 2) * pitch]));
  return g;
}

/** A canvas that a model draws on and wears as a texture. */
export function screen(w: number, h: number): Screen {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { canvas, ctx, tex };
}

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();
const _v2 = new THREE.Vector2();

/** Many copies of one shape, each placed, turned and scaled on its own. */
export class Swarm {
  mesh: THREE.InstancedMesh;
  constructor(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], public count: number) {
    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
  }
  put(i: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx): void {
    _q.setFromEuler(_e.set(rx, ry, rz));
    _m4.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
    this.mesh.setMatrixAt(i, _m4);
  }
  /** Place a copy turned by `angle` about any axis. */
  spin(i: number, x: number, y: number, z: number, axis: THREE.Vector3, angle: number, s = 1): void {
    _m4.compose(_p.set(x, y, z), _q.setFromAxisAngle(axis, angle), _s.set(s, s, s));
    this.mesh.setMatrixAt(i, _m4);
  }
  tint(i: number, r: number, g: number, b: number): void {
    this.mesh.setColorAt(i, _c.setRGB(r, g, b));
  }
  done(): void {
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    this.mesh.computeBoundingBox();
    this.mesh.computeBoundingSphere();
  }
}

/** Points of light that add to the scene, one brightness and colour each: lamps, LEDs, drones. */
export function lamps(geo: THREE.BufferGeometry, count: number): Swarm {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new Swarm(geo, mat, count);
  for (let i = 0; i < count; i++) s.tint(i, 0, 0, 0);
  return s;
}

export interface Glows { points: THREE.Points; pos: Float32Array; col: Float32Array; flush: (moved?: boolean) => void }

/**
 * Small lights seen from far enough away that each is only a bright core and a soft halo.
 * `size` is the width of the halo in the model's own units.
 */
export function glows(n: number, size: number): Glows {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uSize: { value: size }, uHalf: { value: 300 } },
    vertexShader: /* glsl */ `
      uniform float uSize; uniform float uHalf; attribute vec3 color; varying vec3 vCol;
      void main() {
        vCol = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.5, uSize * length(modelMatrix[0].xyz) * projectionMatrix[1][1] * uHalf / -mv.z);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vCol;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float k = smoothstep(0.34, 0.06, d) * 1.5 + pow(max(0.0, 1.0 - d), 2.6) * 0.55;
        gl_FragColor = vec4(vCol * k, 1.0);
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.onBeforeRender = (renderer) => { mat.uniforms.uHalf.value = renderer.getDrawingBufferSize(_v2).y / 2; };
  return { points, pos, col, flush: (moved = false) => { geo.attributes.color.needsUpdate = true; if (moved) geo.attributes.position.needsUpdate = true; } };
}

/** A cloud of fixed points of light with per-point colour. */
export function voxels(positions: V3[], size: number): Glows {
  const g = glows(positions.length, size);
  positions.forEach((p, i) => g.pos.set(p, i * 3));
  g.points.geometry.computeBoundingBox();
  g.points.geometry.computeBoundingSphere();
  return g;
}

let haloTex: THREE.CanvasTexture | null = null;
/** A soft bloom round a single lamp, always turned to face whoever is looking. */
export function halo(color: number, size: number, p?: V3, strength = 1): THREE.Sprite {
  if (!haloTex) {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d')!, grad = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.18, 'rgba(255,255,255,.55)'); grad.addColorStop(0.5, 'rgba(255,255,255,.13)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 96, 96);
    haloTex = new THREE.CanvasTexture(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color, opacity: strength, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.scale.setScalar(size);
  if (p) s.position.set(p[0], p[1], p[2]);
  return s;
}

/** A glowing trail in the air: the path one fast point draws for a slow eye. */
export class Trail {
  line: THREE.Line;
  private pos: Float32Array;
  private col: Float32Array;
  private head = 0;
  constructor(private n: number) {
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.line.frustumCulled = false;
  }
  /** Fill the whole trail from a path function so the figure is complete on the first frame. */
  trace(path: (u: number) => V3, colour: (u: number) => V3, phase: number): void {
    for (let i = 0; i < this.n; i++) {
      const u = i / (this.n - 1);
      const [x, y, z] = path(u);
      this.pos.set([x, y, z], i * 3);
      // brightness falls away behind the moving point
      const age = (((u - phase) % 1) + 1) % 1;
      const k = 0.25 + 0.75 * Math.pow(1 - age, 3);
      const [r, g, b] = colour(u);
      this.col.set([r * k, g * k, b * k], i * 3);
    }
    this.head = phase;
    const g = this.line.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
  }
  get phase(): number { return this.head; }
}

/** A straight beam of light between two points that can be re-aimed every frame. */
export function beam(color: number, opacity = 0.9): { line: THREE.Line; aim: (a: V3, b: V3) => void } {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(6);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  line.frustumCulled = false;
  return { line, aim: (a, b) => { pos.set(a, 0); pos.set(b, 3); geo.attributes.position.needsUpdate = true; } };
}

// ---------- things seen through other things ----------

/** The matrix that mirrors space in the plane through `point` with normal `normal`. */
export function mirror(point: V3, normal: V3): THREE.Matrix4 {
  const n = v(normal).normalize(), d = -n.dot(v(point));
  return new THREE.Matrix4().set(
    1 - 2 * n.x * n.x, -2 * n.x * n.y, -2 * n.x * n.z, -2 * n.x * d,
    -2 * n.x * n.y, 1 - 2 * n.y * n.y, -2 * n.y * n.z, -2 * n.y * d,
    -2 * n.x * n.z, -2 * n.y * n.z, 1 - 2 * n.z * n.z, -2 * n.z * d,
    0, 0, 0, 1);
}

const TRI = new THREE.BufferGeometry();
TRI.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));

function through<T extends THREE.Material>(m: T, ref: number): T {
  m.stencilWrite = true; m.stencilRef = ref; m.stencilFunc = THREE.EqualStencilFunc;
  m.stencilFail = m.stencilZFail = m.stencilZPass = THREE.KeepStencilOp;
  return m;
}

/** A window with nothing in it: an invisible shape that only marks where a portal can be seen through. */
export function opening(geo: THREE.BufferGeometry, p?: V3): THREE.Mesh {
  const m = mesh(geo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false }), p);
  m.userData.noShadow = true;
  return m;
}

export interface PortalOptions {
  /** A number no other window on the same piece uses. */
  ref?: number;
  /** The contents are light added to the view (a reflection, a projected symbol) and not solid things. */
  additive?: boolean;
  /** For additive contents that should still hide their own far side, as a lit figure does. */
  solid?: boolean;
  side?: THREE.Side;
}

/**
 * Things that can only be seen through a window: a reflection in a pane, a scene behind a lens.
 * The window marks the pixels it covers and the contents are drawn on those pixels alone, over
 * whatever really lies behind. Move your head and they shift the way the real thing would.
 */
export function portal(windows: THREE.Mesh[], contents: THREE.Object3D, opts: PortalOptions = {}): void {
  const ref = opts.ref ?? 1, late = opts.additive ?? false;
  const mark = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: opts.side ?? THREE.FrontSide });
  mark.stencilWrite = true; mark.stencilRef = ref; mark.stencilFunc = THREE.AlwaysStencilFunc; mark.stencilZPass = THREE.ReplaceStencilOp;
  for (const w of windows) {
    const m = new THREE.Mesh(w.geometry, mark);
    m.renderOrder = 900; m.userData.noShadow = true;
    w.add(m);
  }
  const drawn: (THREE.Mesh | THREE.Points | THREE.Line | THREE.Sprite)[] = [];
  contents.traverse((o) => { if ((o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints || (o as THREE.Line).isLine || (o as THREE.Sprite).isSprite) drawn.push(o as THREE.Mesh); });
  for (const o of drawn) {
    o.userData.noShadow = true;
    o.renderOrder = 903;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) through(m, ref);
    if (late && opts.solid && (o as THREE.Mesh).isMesh) {
      // lay down the figure's own depth first, so only its near surface adds light
      const twin = new THREE.Mesh((o as THREE.Mesh).geometry, through(new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true }), ref));
      twin.renderOrder = 902; twin.userData.noShadow = true;
      o.add(twin);
      for (const m of mats) { m.depthTest = true; m.depthFunc = THREE.LessEqualDepth; m.side = THREE.FrontSide; m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -4; }
    }
  }
  // forget the depth of what lies behind the window, so it cannot hide the contents
  const reset = new THREE.Mesh(TRI, through(new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }',
    fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }',
    colorWrite: false, depthFunc: THREE.AlwaysDepth, transparent: late,
  }), ref));
  reset.frustumCulled = false; reset.renderOrder = 901; reset.userData.noShadow = true;
  contents.add(reset);
  contents.userData.noFit = true;
}

export { THREE };
