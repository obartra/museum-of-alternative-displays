import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE, type Built } from '../kit';
import { builders } from '../models';
import { TOP, contact, fairFaced, once, sheet, wear } from '../room';
import { BLOCK, FLOOR, places, type Place } from './plan';
import { glows } from './glows';
import type { Sign } from './hall';

/**
 * The fifty blocks and what stands on them. A phone could not run fifty models at once, and nobody can look
 * at fifty at once. So each block carries a still picture of its piece, cut out and stood upright, which
 * turns to face the visitor. Only the few pieces nearest the visitor are the real models, running.
 * A picture taken from the front would be wrong for someone coming down the hall, who sees every piece ahead
 * from well round its side. So each piece has three pictures, and the one nearest the visitor's angle is shown.
 */

/** The upright rectangle over a block that a cut-out covers, and how far in front of the block it was taken from. */
export const CARD = { w: 2.6, h: 1.95, y0: TOP - 0.1, back: 9 };
/**
 * The sides a piece is photographed from, as turns about the upright away from straight in front of it:
 * straight on, and from 72 degrees round to either side, which is how a piece further down the hall is seen.
 */
export const VIEWS = [0, 72, -72].map((deg) => (deg * Math.PI) / 180);
/** Between which angles one picture gives way to the next. */
const TURNING = [(30 * Math.PI) / 180, (42 * Math.PI) / 180];
/** How the small pictures of every piece are laid out in the one sheet used for those far away: once for each side, one set under another. */
export const SHEET = { cols: 5, rows: 10 };
/**
 * Where the pictures are kept: one file a piece for day and for night, and the sheet of small ones.
 * In a piece's own file the three sides are one under another. Every picture is twice as wide as it is: colour, then cover.
 */
export const cutout = (id: string, day: boolean) => `./cutouts/${id}-${day ? 'day' : 'night'}.webp`;
export const sheetOf = (day: boolean) => `./cutouts/far-${day ? 'day' : 'night'}.webp`;

/**
 * Scale a model to the top of its block and set it down there. The same rule as the stand of the single
 * room, so a piece is the same size in both. Keep in step with `Stage.setPiece`.
 */
export function seat(b: Built): void {
  const root = b.root;
  // what is only seen through a window (a reflection, a scene behind a lens) takes up no room on the block
  const aside: [THREE.Object3D, THREE.Object3D][] = [];
  root.traverse((o) => { if (o.userData.noFit && o.parent) aside.push([o, o.parent]); });
  for (const [o] of aside) o.removeFromParent();
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  for (const [o, parent] of aside) parent.add(o);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const s = Math.min(1.95 / Math.max(size.x, size.z, 0.001), 1.5 / Math.max(size.y, 0.001));
  root.scale.setScalar(s);
  root.position.set(-c.x * s, -box.min.y * s + TOP, -c.z * s);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
    const solid = !mat.transparent && mat.blending === THREE.NormalBlending && mat.colorWrite && !m.userData.noShadow;
    m.castShadow = solid; m.receiveShadow = solid;
  });
}

/** Let go of everything a model holds on the graphics card. Keep in step with `Stage.clear`. */
export function shed(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose?.();
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
    for (const mat of mats as THREE.Material[]) {
      for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
      mat.dispose();
    }
  });
}

/** Flat rectangles gathered into one mesh, each with its own corner of one picture. */
class Quads {
  private pos: number[] = []; private nor: number[] = []; private uv: number[] = []; private idx: number[] = [];
  /** A rectangle `w` by `h` centred at `at`, turned by `ry` about the upright, showing the part of the picture from (u0, v0) to (u1, v1). */
  add(at: THREE.Vector3, ry: number, w: number, h: number, u0: number, v0: number, u1: number, v1: number): void {
    const n = this.pos.length / 3, cx = Math.cos(ry), sx = Math.sin(ry);
    for (const [a, b, u, v] of [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]]) {
      this.pos.push(at.x + (a * w * cx) / 2, at.y + (b * h) / 2, at.z - (a * w * sx) / 2);
      this.nor.push(sx, 0, cx); this.uv.push(u, v);
    }
    this.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  mesh(mat: THREE.Material): THREE.Mesh {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setIndex(this.idx);
    return new THREE.Mesh(g, mat);
  }
}

const VERT = /* glsl */ 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
/**
 * A cut-out is two pictures side by side: the piece as it shows against black, and beside it how much of
 * what is behind it the piece hides. Kept apart like this, a glow can add its light to the hall and hide nothing.
 */
const FRAG = /* glsl */ `
  uniform sampler2D tDay, tNight; uniform vec4 cDay, cNight, cDay2, cNight2; uniform float uL, uShow, uMix; varying vec2 vUv;
  // the colour of one picture, and in the fourth place how much it hides
  vec4 look(sampler2D t, vec4 c) { vec2 a = c.xy + vUv * c.zw; return vec4(texture2D(t, a).rgb, texture2D(t, a + vec2(c.z, 0.0)).g); }
  // one side of the piece, or two while the visitor passes from one to the next
  vec4 seen(sampler2D t, vec4 c, vec4 c2) { vec4 one = look(t, c); if (uMix > 0.0) one = mix(one, look(t, c2), uMix); return one; }
  void main() {
    vec4 px;
    if (uL >= 1.0) px = seen(tDay, cDay, cDay2);
    else if (uL <= 0.0) px = seen(tNight, cNight, cNight2);
    else px = mix(seen(tNight, cNight, cNight2), seen(tDay, cDay, cDay2), uL);
    gl_FragColor = px * uShow;
    #include <colorspace_fragment>
  }`;

type Cell = THREE.Vector4;
interface Stand {
  place: Place;
  /** Where the model goes: the middle of the block, turned to face the aisle. */
  anchor: THREE.Group;
  card: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  /** The same cut-out, turned to the sun and seen by nothing but the shadow map. */
  shade: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  /** Its number in the collection, which is its place in the sheet of small pictures. */
  no: number;
  near: { day?: THREE.Texture; night?: THREE.Texture; asked: { day?: boolean; night?: boolean } };
  /** Whether the picture now shown for day, and for night, is the piece's own file or a corner of the sheet. */
  own: { day: boolean; night: boolean };
  built?: Built;
  /** The model is being made, is on its block, or is on its way out. */
  state: 'still' | 'making' | 'live' | 'leaving';
  /** 1 shows the picture, 0 the model. */
  fade: number;
  born: number;
  dist: number;
}

export interface Viewer {
  /** Where the visitor's eye is. */
  eye: THREE.Vector3;
  /** Where the visitor is, or is on the way to: models are made ready there. */
  focus: { x: number; z: number };
  /** Daylight now, 0 to 1, and where the switch stands. */
  L: number;
  day: boolean;
  /** Seconds of the pieces' own time, which stands still when paused. */
  clock: number;
  camera: THREE.Camera;
}

export interface StandsOptions {
  lite: boolean;
  /** How many models may run at once. */
  cap: number;
  names: Record<string, string>;
  signs: Sign[];
  display: string;
  sunward: THREE.Vector3;
}

export class Stands {
  readonly group = new THREE.Group();
  /** Where each running model stands. Kept apart from the blocks, so one can be shown without them. */
  readonly models = new THREE.Group();
  private stands: Stand[];
  private byId = new Map<string, Stand>();
  private uL = { value: 1 };
  private far: { day?: THREE.Texture; night?: THREE.Texture } = {};
  private blank: THREE.Texture;
  private loader = new THREE.TextureLoader();
  /** At night, the pools of their own colour that glowing pieces throw on the floor in front of them. */
  private pools?: THREE.InstancedMesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private since = 1;
  private busy = false;
  private gone = false;
  private lastDay = true;
  private settled = 0;
  /** Set when shadows have to be worked out again. */
  stale = true;
  /** Set when something has arrived that changes the picture. */
  fresh = true;

  constructor(private renderer: THREE.WebGLRenderer, private scene: THREE.Scene, private camera: THREE.Camera, private o: StandsOptions) {
    const n = places.length, tall = TOP - 0.03 - FLOOR;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), at = new THREE.Vector3();
    const UPRIGHT = new THREE.Vector3(0, 1, 0), flat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

    // the blocks, as in the single room: cast concrete, and a steel plate floating a finger's width above
    const cast = once('fair', () => fairFaced(21, BLOCK, tall));
    const many = (geo: THREE.BufferGeometry, mat: THREE.Material, y: number, shadows = true) => {
      const im = new THREE.InstancedMesh(geo, mat, n);
      places.forEach((p, i) => im.setMatrixAt(i, m4.compose(at.set(p.x, y, p.z), q.setFromAxisAngle(UPRIGHT, p.side < 0 ? 0 : Math.PI), one)));
      im.instanceMatrix.needsUpdate = true; im.castShadow = im.receiveShadow = shadows; im.frustumCulled = false;
      this.group.add(im);
      return im;
    };
    many(new RoundedBoxGeometry(BLOCK, tall, BLOCK, 3, 0.014), wear(cast, [1, 1], [1, 1], { bump: 0.9, rough: 0.82 }), (TOP - 0.03 + FLOOR) / 2);
    many(new THREE.BoxGeometry(2.0, 0.014, 2.0), new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1 }), TOP - 0.023, false);
    many(new RoundedBoxGeometry(2.1, 0.016, 2.1, 1, 0.004), new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.4, metalness: 0.55 }), TOP - 0.008);
    // the darkening of the floor where a block meets it
    const patch = contact(3.2, 3.2, 0, 0, 0.42), under = new THREE.InstancedMesh(patch.geometry, patch.material, n);
    places.forEach((p, i) => under.setMatrixAt(i, m4.compose(at.set(p.x, FLOOR + 0.0015, p.z), flat, one)));
    under.instanceMatrix.needsUpdate = true; under.frustumCulled = false;
    this.group.add(under);

    // cast into each block, the number of its hall; fixed to it, a small enamel plate with the name of the piece
    const [nc, nx] = sheet(256 * o.signs.length, 320);
    o.signs.forEach((s, i) => {
      nx.font = `700 300px ${o.display}`; nx.textAlign = 'center'; nx.textBaseline = 'alphabetic';
      // the sun is to the left: the left wall of the cut is in shade, the right one catches the light
      nx.fillStyle = 'rgba(255,255,255,.5)'; nx.fillText(String(s.no), i * 256 + 130.5, 262);
      nx.fillStyle = 'rgba(40,42,44,.62)'; nx.fillText(String(s.no), i * 256 + 126, 260);
      nx.fillStyle = 'rgba(118,120,118,.9)'; nx.fillText(String(s.no), i * 256 + 128, 261);
    });
    const cut = new THREE.CanvasTexture(nc); cut.colorSpace = THREE.SRGBColorSpace; cut.anisotropy = 4;
    const numerals = new Quads(), labels = new Quads();
    const COLS = 4, ROWS = Math.ceil(n / COLS), CW = o.lite ? 256 : 512, CH = o.lite ? 56 : 112, [lc, lx] = sheet(COLS * CW, ROWS * CH);
    const face = new THREE.Vector3();
    places.forEach((p, i) => {
      const s = o.signs[p.hall - 1], turn = p.side < 0 ? 0 : Math.PI, u = (p.hall - 1) / o.signs.length;
      // on the face towards the aisle and on the one behind, as the single room has them
      for (const [fx, fz, ry] of [[-0.55, 1.1004, 0], [0.55, -1.1004, Math.PI]] as const) {
        numerals.add(face.set(fx, TOP - 0.03 - 0.51 * tall, fz).applyAxisAngle(UPRIGHT, turn).add(at.set(p.x, 0, p.z)), ry + turn, 0.36, 0.45, u, 0, u + 1 / o.signs.length, 1);
        labels.add(face.set(-fx * 0.92, TOP - 0.03 - 0.19, fz * 1.004).applyAxisAngle(UPRIGHT, turn).add(at.set(p.x, 0, p.z)), ry + turn, 0.94, 0.94 * (CH / CW), (i % COLS) / COLS, 1 - (Math.floor(i / COLS) + 1) / ROWS, ((i % COLS) + 1) / COLS, 1 - Math.floor(i / COLS) / ROWS);
      }
      this.label(lx, (i % COLS) * CW, Math.floor(i / COLS) * CH, CW, CH, o.names[p.id] ?? p.id, s);
    });
    const cutMesh = numerals.mesh(new THREE.MeshStandardMaterial({ map: cut, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    cutMesh.receiveShadow = true;
    const names = new THREE.CanvasTexture(lc); names.colorSpace = THREE.SRGBColorSpace; names.anisotropy = 8;
    const nameMesh = labels.mesh(new THREE.MeshStandardMaterial({ map: names, roughness: 0.36, alphaTest: 0.5 }));
    nameMesh.receiveShadow = true;
    this.group.add(cutMesh, nameMesh);

    // the pictures: nothing to show until the sheet of small ones has come
    const [bc] = sheet(2, 2);
    this.blank = new THREE.CanvasTexture(bc);
    const plane = new THREE.PlaneGeometry(CARD.w, CARD.h), sunYaw = Math.atan2(o.sunward.x, o.sunward.z);
    this.stands = places.map((p, i) => {
      const anchor = new THREE.Group();
      anchor.position.set(p.x, 0, p.z); anchor.rotation.y = p.side < 0 ? 0 : Math.PI;
      this.models.add(anchor);
      const corner = () => ({ value: new THREE.Vector4(0, 0, 0.5, 1) });
      const card = new THREE.Mesh(plane, new THREE.ShaderMaterial({
        uniforms: { tDay: { value: this.blank }, tNight: { value: this.blank }, cDay: corner(), cNight: corner(), cDay2: corner(), cNight2: corner(), uMix: { value: 0 }, uL: this.uL, uShow: { value: 0 } },
        vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true,
      }));
      card.position.set(p.x, CARD.y0 + CARD.h / 2, p.z); card.visible = false;
      const shade = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, alphaTest: 0.5, side: THREE.DoubleSide }));
      shade.position.copy(card.position); shade.rotation.y = sunYaw; shade.castShadow = true; shade.visible = false;
      this.group.add(card, shade);
      const stand: Stand = { place: p, anchor, card, shade, no: i, near: { asked: {} }, own: { day: false, night: false }, state: 'still', fade: 1, born: 0, dist: 0 };
      this.byId.set(p.id, stand);
      return stand;
    });

    // what the pieces that glow throw on the floor at night: a soft pool of their own colour in front of each, the whole length of the hall.
    // They are painted on the floor and are not lamps: a lamp is worked out for every surface in the building, and its glint slides about the polish
    const lit = places.filter((p) => glows[p.id] !== undefined);
    if (lit.length) {
      const [gc, gx] = sheet(128, 128), soft = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
      soft.addColorStop(0, 'rgba(255,255,255,1)'); soft.addColorStop(0.3, 'rgba(255,255,255,.5)'); soft.addColorStop(0.65, 'rgba(255,255,255,.12)'); soft.addColorStop(1, 'rgba(255,255,255,0)');
      gx.fillStyle = soft; gx.fillRect(0, 0, 128, 128);
      const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(5.4, 4.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), lit.length);
      const tint = new THREE.Color();
      lit.forEach((p, i) => {
        // in front of the block, on its aisle side
        pools.setMatrixAt(i, m4.compose(at.set(p.x, FLOOR + 0.006, p.z - p.side * (BLOCK / 2 + 0.75)), flat, one));
        pools.setColorAt(i, tint.setHex(glows[p.id]));
      });
      pools.instanceMatrix.needsUpdate = true; pools.instanceColor!.needsUpdate = true; pools.frustumCulled = false; pools.visible = false; pools.renderOrder = 1;
      this.pools = pools;
      this.group.add(pools);
    }
    this.sheet(true);
  }

  /** One name plate, drawn into its corner of the sheet of plates. */
  private label(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, name: string, s: Sign): void {
    const k = w / 512, text = name.toLocaleUpperCase();
    c.save(); c.translate(x, y);
    c.fillStyle = s.ground; c.beginPath(); c.roundRect(2 * k, 2 * k, w - 4 * k, h - 4 * k, 9 * k); c.fill();
    c.globalAlpha = 0.78; c.strokeStyle = s.ink; c.lineWidth = 2.5 * k; c.beginPath(); c.roundRect(9 * k, 9 * k, w - 18 * k, h - 18 * k, 5 * k); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = s.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fit = (line: string, size: number) => { c.font = `800 ${size * k}px ${this.o.display}`; return c.measureText(line).width <= w - 44 * k; };
    let size = 70;
    while (size > 46 && !fit(text, size)) size -= 2;
    if (fit(text, size)) c.fillText(text, w / 2, h / 2 + 3 * k);
    else {
      // too long for one line: break it at the space nearest the middle
      const words = text.split(' ');
      let best = 1;
      for (let i = 1; i < words.length; i++) if (Math.abs(words.slice(0, i).join(' ').length - text.length / 2) < Math.abs(words.slice(0, best).join(' ').length - text.length / 2)) best = i;
      const lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')].filter(Boolean);
      size = 44;
      while (size > 26 && !lines.every((l) => fit(l, size))) size -= 2;
      c.font = `800 ${size * k}px ${this.o.display}`;
      lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + 3 * k + (i - (lines.length - 1) / 2) * size * 0.95 * k));
    }
    c.restore();
  }

  private picture(url: string, done: (t: THREE.Texture | undefined) => void): void {
    this.loader.load(url, (t) => {
      if (this.gone) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      done(t);
    }, undefined, () => done(undefined));
  }

  /** Fetch the sheet of small pictures for day or for night. */
  private sheet(day: boolean): void {
    const key = day ? 'day' : 'night';
    this.picture(sheetOf(day), (t) => { if (!t) return; this.far[key] = t; for (const s of this.stands) this.dress(s); });
  }

  /**
   * Where the colour half of one side of a piece lies in a picture: in the piece's own file, or in the sheet of small ones.
   * The cover half lies beside it, one width to the right.
   */
  private corner(out: Cell, s: Stand, own: boolean, view: number): Cell {
    const n = VIEWS.length;
    return own
      ? out.set(0, 1 - (view + 1) / n, 0.5, 1 / n)
      : out.set((s.no % SHEET.cols) / SHEET.cols, 1 - (view * SHEET.rows + Math.floor(s.no / SHEET.cols) + 1) / (SHEET.rows * n), 0.5 / SHEET.cols, 1 / (SHEET.rows * n));
  }

  /** Show the side of a piece that someone standing `turn` round from straight in front of it would see. */
  private face(s: Stand, turn: number): void {
    const u = s.card.material.uniforms, by = Math.abs(turn), side = turn >= 0 ? 1 : 2;
    const k = THREE.MathUtils.smoothstep(by, TURNING[0], TURNING[1]);
    // one picture where one will do, so that the other is not even looked up
    const first = k >= 1 ? side : 0, second = k > 0 && k < 1 ? side : first;
    this.corner(u.cDay.value as Cell, s, s.own.day, first); this.corner(u.cNight.value as Cell, s, s.own.night, first);
    this.corner(u.cDay2.value as Cell, s, s.own.day, second); this.corner(u.cNight2.value as Cell, s, s.own.night, second);
    u.uMix.value = second === first ? 0 : k;
  }

  /** Give a stand the best pictures there are for it now. */
  private dress(s: Stand): void {
    const u = s.card.material.uniforms;
    const pick = (key: 'day' | 'night'): [THREE.Texture, boolean] | undefined => (s.near[key] ? [s.near[key]!, true] : this.far[key] ? [this.far[key]!, false] : undefined);
    const day = pick('day') ?? pick('night'), night = pick('night') ?? day;
    if (!day || !night) return;
    u.tDay.value = day[0]; s.own.day = day[1];
    u.tNight.value = night[0]; s.own.night = night[1];
    this.face(s, 0);
    // the shadow comes from whichever picture the light is nearer to, and from the piece seen straight on
    const [t, own] = this.lastDay ? day : night, c = this.corner(new THREE.Vector4(), s, own, 0);
    if (s.shade.material.alphaMap?.source !== t.source) {
      s.shade.material.alphaMap?.dispose();
      const matte = t.clone();
      matte.offset.set(c.x + c.z, c.y); matte.repeat.set(c.z, c.w); matte.needsUpdate = true;
      s.shade.material.alphaMap = matte; s.shade.material.needsUpdate = true;
      this.stale = true;
    }
    this.fresh = true;
  }

  /** Whether a piece has a picture to show while its model is away. */
  private pictured(s: Stand): boolean { return s.card.material.uniforms.tDay.value !== this.blank; }

  /** Start making the model of a piece. It joins the hall when it is ready to be drawn without a stall. */
  private async make(s: Stand): Promise<void> {
    this.busy = true; s.state = 'making';
    try {
      // one turn of the page first, so that two models are never made in the same frame
      await new Promise((r) => setTimeout(r, 0));
      if (this.gone) return;
      const b = builders[s.place.id]();
      seat(b);
      b.update?.({ t: 2.6, lights: this.uL.value, camera: this.camera });
      try { await this.renderer.compileAsync(b.root, this.camera, this.scene); } catch { /* the first frame builds the shaders instead */ }
      if (this.gone || s.state !== 'making') { shed(b.root); return; }
      s.built = b; s.state = 'live'; s.born = this.since - 2.6;
      s.anchor.add(b.root);
      if (!this.pictured(s)) s.fade = 0;
      this.stale = true; this.fresh = true;
    } catch (err) {
      console.error('the model did not start for', s.place.id, err);
      s.state = 'still';
    } finally { this.busy = false; }
  }

  private drop(s: Stand): void {
    if (s.built) { s.anchor.remove(s.built.root); shed(s.built.root); s.built = undefined; }
    s.state = 'still'; s.fade = 1;
    this.stale = true;
  }

  /** Which pieces should be models now: the nearest few. One that already runs is kept a little longer than its distance earns. */
  private choose(focus: { x: number; z: number }): void {
    const REACH = 17;
    for (const s of this.stands) s.dist = Math.hypot(s.place.x - focus.x, s.place.z - focus.z);
    const order = [...this.stands].sort((a, b) => (a.dist - (a.state === 'live' ? 2.5 : 0)) - (b.dist - (b.state === 'live' ? 2.5 : 0)));
    const wanted = new Set(order.slice(0, this.o.cap).filter((s) => s.dist < REACH + (s.state === 'live' ? 2.5 : 0)));
    for (const s of this.stands) {
      if (s.state === 'live' && !wanted.has(s)) s.state = 'leaving';
      else if (s.state === 'leaving' && wanted.has(s)) s.state = 'live';
      else if (s.state === 'making' && !wanted.has(s)) s.state = 'still';
    }
    const running = this.stands.filter((s) => s.state !== 'still').length;
    if (!this.busy && running < this.o.cap + 1) { const next = order.find((s) => wanted.has(s) && s.state === 'still'); if (next) void this.make(next); }

    // the full pictures of the pieces round about, and no others
    const NEAR = this.o.lite ? 20 : 30;
    for (const s of this.stands) {
      for (const key of ['day', 'night'] as const) {
        const want = s.dist < NEAR && (key === (this.lastDay ? 'day' : 'night') || this.settled < 2);
        if (want && !s.near.asked[key]) {
          s.near.asked[key] = true;
          this.picture(cutout(s.place.id, key === 'day'), (t) => { if (!t) return; if (!s.near.asked[key]) { t.dispose(); return; } s.near[key] = t; this.dress(s); });
        } else if (!want && s.near.asked[key] && (s.dist > NEAR + 12 || this.settled >= 2) && s.near[key]) {
          s.near[key]!.dispose(); s.near[key] = undefined; s.near.asked[key] = false;
          this.dress(s);
        }
      }
    }
  }

  private tick = 0;
  private toEye = new THREE.Vector3();
  private spot = new THREE.Vector3();

  /** Once a frame. Says whether anything is still on its way in or out, so the hall knows to keep drawing. */
  update(dt: number, v: Viewer): boolean {
    const e = v.L * v.L * (3 - 2 * v.L);
    this.uL.value = e; this.since = v.clock;
    // the other set of pictures is wanted from the moment the switch is thrown until the light has settled
    const moving = v.day !== v.L > 0.5 || (v.L > 0.004 && v.L < 0.996);
    this.settled = moving ? 0 : this.settled + dt;
    if (v.day !== this.lastDay) { this.lastDay = v.day; if (!this.far[v.day ? 'day' : 'night']) this.sheet(v.day); this.tick = 0; }
    if ((this.tick -= dt) <= 0) { this.tick = 0.25; this.choose(v.focus); }

    let busy = this.busy;
    for (const s of this.stands) {
      const has = this.pictured(s), to = s.state === 'live' ? 0 : 1;
      if (s.fade !== to) {
        s.fade = !has ? to : to > s.fade ? Math.min(1, s.fade + dt / 0.3) : Math.max(0, s.fade - dt / 0.4);
        busy = true;
        if (s.fade === to) this.stale = true;
      }
      if (s.state === 'leaving' && s.fade === 1) this.drop(s);
      const show = has && s.fade > 0;
      s.card.visible = show; s.shade.visible = show && !s.built;
      if (s.built) {
        s.built.root.visible = s.fade < 1;
        // a piece behind the visitor's back keeps its place in time but is not redrawn
        this.toEye.set(s.place.x - v.eye.x, 0, s.place.z - v.eye.z);
        s.built.update?.({ t: v.clock - s.born, lights: v.L, camera: v.camera });
      }
      if (!show) continue;
      const k = s.fade * s.fade * (3 - 2 * s.fade);
      s.card.material.uniforms.uShow.value = k;
      // upright, and turned to whoever is looking, with the side of the piece that they would see from there
      const c = s.card, p = s.place;
      c.rotation.y = Math.atan2(v.eye.x - p.x, v.eye.z - p.z);
      const turn = c.rotation.y - s.anchor.rotation.y;
      this.face(s, turn - Math.round(turn / (2 * Math.PI)) * 2 * Math.PI);
      if (s.built) {
        // while the two change places, the picture stands just in front of the model and is drawn that much smaller, so it covers it exactly
        this.spot.set(p.x, CARD.y0 + CARD.h / 2, p.z);
        const d = this.spot.distanceTo(v.eye), near = Math.max(0.5, (d - 1.5) / d);
        c.position.copy(v.eye).lerp(this.spot, near); c.scale.setScalar(near);
      } else { c.position.set(p.x, CARD.y0 + CARD.h / 2, p.z); c.scale.setScalar(1); }
    }

    // night: the pools on the floor come up as the daylight goes
    if (this.pools) { this.pools.material.opacity = (1 - e) * 0.55; this.pools.visible = e < 0.995; }
    return busy || this.stands.some((s) => s.state === 'making');
  }

  /** Whether any model is running: if so there is always something moving to draw. */
  get lively(): boolean { return this.stands.some((s) => s.built); }
  /** How many models are on their blocks now, and how many pictures stand in for the rest. */
  get count(): { live: number; making: number; pictured: number } {
    return { live: this.stands.filter((s) => s.built).length, making: this.stands.filter((s) => s.state === 'making').length, pictured: this.stands.filter((s) => this.pictured(s)).length };
  }

  dispose(): void {
    this.gone = true;
    for (const s of this.stands) {
      if (s.built) shed(s.built.root);
      s.near.day?.dispose(); s.near.night?.dispose();
      s.shade.material.alphaMap?.dispose(); s.shade.material.dispose(); s.card.material.dispose();
    }
    this.far.day?.dispose(); this.far.night?.dispose(); this.blank.dispose();
    this.group.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      for (const mat of (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) as THREE.Material[]) {
        for (const val of Object.values(mat)) if (val && (val as THREE.Texture).isTexture) (val as THREE.Texture).dispose();
        mat.dispose();
      }
    });
  }
}
