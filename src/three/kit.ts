import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type V3 = [number, number, number];

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

const std = (color: number, roughness: number, metalness: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

/** Materials. Each call returns a fresh material so a model can be disposed without touching another. */
export const M = {
  steel: () => std(0x9aa0a6, 0.32, 0.9),
  dark: () => std(0x202326, 0.45, 0.55),
  black: () => std(0x0b0c0d, 0.62, 0.05),
  brass: () => std(0xb08d4a, 0.3, 0.9),
  copper: () => std(0xb5693a, 0.38, 0.9),
  chrome: () => std(0xe8ecef, 0.06, 1),
  enamel: (c: number) => std(c, 0.32, 0.02),
  plastic: (c: number, rough = 0.55) => std(c, rough, 0),
  paper: (c = 0xf1eee4) => std(c, 0.95, 0),
  wood: (c = 0xa2713f) => std(c, 0.78, 0),
  pcb: () => std(0x1d5236, 0.6, 0.1),
  ceramic: () => std(0xe3dfd4, 0.5, 0),
  rubber: () => std(0x151515, 0.9, 0),
  /** Clear glass: mostly reflection. Drawn after what it contains. */
  glass: (tint = 0xffffff, opacity = 0.14) => {
    const m = new THREE.MeshPhysicalMaterial({
      color: tint, roughness: 0.03, metalness: 0, transparent: true, opacity, depthWrite: false,
      clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.2, side: THREE.DoubleSide,
    });
    return m;
  },
  /** A blown glass envelope: only the near wall is drawn, so what is inside stays crisp. */
  bulb: (tint = 0xffffff) => new THREE.MeshPhysicalMaterial({
    color: tint, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.07, depthWrite: false,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.1, side: THREE.FrontSide,
  }),
  /** Something that makes light. Unaffected by the hall lights. */
  glow: (c: number, intensity = 1.5) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: c, emissiveIntensity: intensity, roughness: 1 }),
  /** A surface that shows a live canvas by emitting light. */
  lit: (s: Screen, intensity = 1.25) => new THREE.MeshStandardMaterial({ color: 0x050505, emissive: 0xffffff, emissiveMap: s.tex, emissiveIntensity: intensity, roughness: 0.28 }),
  /** A surface that shows a live canvas by reflecting the hall lights, like print. */
  printed: (s: Screen, rough = 0.92) => new THREE.MeshStandardMaterial({ map: s.tex, roughness: rough, metalness: 0 }),
  /** Light added on top of whatever is behind: beams, ghosts, images on fog. */
  add: (s: Screen | null, color = 0xffffff, opacity = 1) => new THREE.MeshBasicMaterial({
    map: s ? s.tex : null, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }),
};

export const G = {
  box: (w: number, h: number, d: number, mat: THREE.Material | THREE.Material[], p?: V3) => mesh(new THREE.BoxGeometry(w, h, d), mat, p),
  rbox: (w: number, h: number, d: number, r: number, mat: THREE.Material, p?: V3) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, p),
  cyl: (r: number, h: number, mat: THREE.Material | THREE.Material[], p?: V3, seg = 40, rTop = r) => mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat, p),
  sph: (r: number, mat: THREE.Material, p?: V3, seg = 28) => mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), mat, p),
  plane: (w: number, h: number, mat: THREE.Material, p?: V3) => mesh(new THREE.PlaneGeometry(w, h), mat, p),
  torus: (r: number, tube: number, mat: THREE.Material, p?: V3) => mesh(new THREE.TorusGeometry(r, tube, 14, 48), mat, p),
  /** Solid of revolution about the Y axis from [radius, y] pairs. */
  lathe: (pts: [number, number][], mat: THREE.Material, seg = 56) => mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat),
  /** A straight rod between two points. */
  rod: (a: V3, b: V3, r: number, mat: THREE.Material, seg = 8) => {
    const A = v(a), B = v(b);
    const len = A.distanceTo(B);
    const m = mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
    m.position.copy(A).lerp(B, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    return m;
  },
  /** A smooth bent wire through the points. */
  wire: (pts: V3[], r: number, mat: THREE.Material, closed = false) =>
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(v), closed, 'catmullrom', 0.35), Math.max(12, pts.length * 5), r, 5, closed), mat),
  group: (...kids: THREE.Object3D[]) => { const g = new THREE.Group(); if (kids.length) g.add(...kids); return g; },
  merge: (geos: THREE.BufferGeometry[]) => mergeGeometries(geos, false) as THREE.BufferGeometry,
};

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

/** A cloud of voxels with per-point colour. */
export function voxels(positions: V3[], size: number): { points: THREE.Points; col: Float32Array; flush: () => void } {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(positions.length * 3);
  positions.forEach((p, i) => pos.set(p, i * 3));
  const col = new Float32Array(positions.length * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ size, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  points.frustumCulled = false;
  return { points, col, flush: () => { geo.attributes.color.needsUpdate = true; } };
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

export { THREE };
