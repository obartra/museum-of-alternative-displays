import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { THREE } from './kit';
import { SUN, vista } from './vista';

/**
 * The room a piece is shown in: walls, floor, the stand it sits on and the light that falls on it.
 * A polished concrete floor, white walls, tall windows onto Montserrat, and no light but what
 * comes through them: the sun by day, the moon and the town by night.
 */
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
  /** Whatever the room has to draw for itself before each picture: here, what a polished floor mirrors. */
  prepare?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
  /** What shiny things in this room reflect, where the stock studio would be wrong. */
  surroundings?: THREE.Scene;
  /** Where the light a piece gives off in the dark seems to come from, and how much of it this room shows. */
  glow?: { at: [number, number, number]; gain: number };
  dispose?: () => void;
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

/** Wear the surface with the skin. `across` and `up` are how many metres of wall one copy of the picture covers. */
function wear(skin: Skin, size: [number, number], covers: [number, number], o: { bump?: number; rough?: number; metal?: number; tint?: number; fromFloor?: boolean } = {}): THREE.MeshStandardMaterial {
  const rep: [number, number] = [size[0] / covers[0], size[1] / covers[1]];
  const fit = (canvas: HTMLCanvasElement, colour: boolean) => { const t = tex(canvas, colour); t.repeat.set(rep[0], rep[1]); t.offset.set(0.5 * (1 - rep[0]), o.fromFloor ? 0 : 0.5 * (1 - rep[1])); return t; };
  return new THREE.MeshStandardMaterial({
    map: fit(skin.map, true), bumpMap: fit(skin.bump, false), bumpScale: o.bump ?? 2.4, roughness: o.rough ?? 0.93, metalness: o.metal ?? 0,
    roughnessMap: skin.rough ? fit(skin.rough, false) : null, color: o.tint ?? 0xffffff,
  });
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

const solid = (m: THREE.Mesh): THREE.Mesh => { m.castShadow = m.receiveShadow = true; return m; };

// ---------- the house ----------

const XL = -5.4, XR = 8.2, ZF = 8.5, TALL = 4.6;   // the east, west and north walls, and the height of the room
const SILL = 0.34, HEAD = 4.2, REVEAL = 0.16;      // the windows: how high they start and stop, how deep they sit

const kept = new Map<string, Skin>();
/** A surface is drawn once, however many stages show the room. */
const once = (key: string, make: () => Skin): Skin => { let k = kept.get(key); if (!k) { k = make(); kept.set(key, k); } return k; };

/** A concrete floor ground and sealed until it shines: fine cloud, the ghost of the trowel, stone showing as specks. */
function polished(w: number, seed: number): Skin {
  const r = rng(seed), h = w / 2;
  const [map, c] = sheet(w, w), [bump, b] = sheet(8, 8), [rough, q] = sheet(h, h);
  c.fillStyle = 'rgb(134,137,131)'; c.fillRect(0, 0, w, w);
  b.fillStyle = grey(128); b.fillRect(0, 0, 8, 8);
  mottle(c, w, w, r, [3, 6], 0.5, 9); mottle(c, w, w, r, [13, 29, 64], 0.5, 11); mottle(c, w, w, r, [150, 400, w / 2], 0.5, 12);
  for (let i = 0; i < 70; i++) { c.strokeStyle = r() > 0.5 ? `rgba(255,255,255,${0.012 + r() * 0.02})` : `rgba(0,0,0,${0.012 + r() * 0.024})`; c.lineWidth = (0.03 + r() * 0.14) * w; c.beginPath(); c.arc(r() * w, r() * w, (0.1 + r() * 0.3) * w, r() * 6, r() * 6 + 0.8 + r() * 1.4); c.stroke(); }
  for (let i = 0; i < (w * w) / 240; i++) { const v = r(); c.fillStyle = v > 0.62 ? `rgba(236,236,228,${0.18 + r() * 0.3})` : v > 0.2 ? `rgba(62,66,66,${0.16 + r() * 0.3})` : `rgba(150,132,110,${0.2 + r() * 0.25})`; const d = 0.6 + r() * r() * 1.9; c.fillRect(r() * w, r() * w, d, d * (0.6 + r() * 0.8)); }
  for (let i = 0; i < 2; i++) { let x = r() * w, y = r() * w; c.strokeStyle = 'rgba(40,42,42,.22)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); for (let n = 0; n < 50; n++) { x += (r() - 0.35) * 22; y += (r() - 0.5) * 20; c.lineTo(x, y); } c.stroke(); }
  // how well each part took the polish: dark is glassy
  q.fillStyle = grey(66); q.fillRect(0, 0, h, h);
  mottle(q, h, h, r, [4, 9, 21], 0.6, 20); mottle(q, h, h, r, [60, 200], 0.4, 12);
  for (let i = 0; i < 16; i++) { q.strokeStyle = grey(140, 0.05 + r() * 0.08); q.lineWidth = 2 + r() * 12; const x = r() * h, y = r() * h; q.beginPath(); q.moveTo(x, y); q.lineTo(x + (r() - 0.5) * h * 0.3, y + (r() - 0.5) * h * 0.3); q.stroke(); }
  return { map, bump, rough };
}

/** One face of a block cast in a smooth shutter: the joint between two panels, cone holes where the ties went, and little else. */
function fairFaced(seed: number, wide: number, tall: number): Skin {
  const r = rng(seed), w = 1024, h = Math.round((1024 * tall) / wide), ppm = w / wide;
  const [map, c] = sheet(w, h), [bump, b] = sheet(w, h);
  c.fillStyle = 'rgb(176,178,174)'; c.fillRect(0, 0, w, h);
  b.fillStyle = grey(128); b.fillRect(0, 0, w, h);
  mottle(c, w, h, r, [2, 5], 0.5, 9); mottle(c, w, h, r, [14, 40, 110], 0.5, 10); mottle(c, w, h, r, [300, 800], 0.45, 11);
  mottle(b, w, h, r, [60, 240, 700], 0.5, 34);
  // two lifts: the second pour sat a shade lighter on the first
  const lift = h * (0.52 + r() * 0.06);
  c.fillStyle = 'rgba(255,255,255,.045)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); for (let x = w; x >= 0; x -= 16) c.lineTo(x, lift + Math.sin(x * 0.013 + seed) * 5 + (r() - 0.5) * 5); c.closePath(); c.fill();
  // the seam between panels, with the fines that bled out of it
  for (const x of [w / 2]) {
    c.fillStyle = 'rgba(30,32,32,.2)'; c.fillRect(x - 0.7, 0, 1.4, h); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x + 0.8, 0, 1.2, h);
    b.fillStyle = grey(70, 0.8); b.fillRect(x - 1, 0, 2, h);
    for (let i = 0; i < 26; i++) { const y = r() * h, l = 6 + r() * 40; c.fillStyle = `rgba(60,62,62,${0.03 + r() * 0.05})`; c.fillRect(x - 2 - r() * 3, y, 3 + r() * 5, l); }
  }
  // cone holes, plugged a little short of the face
  const hr = 0.0125 * ppm;
  for (const fy of [0.26, 0.76]) for (const fx of [0.125, 0.375, 0.625, 0.875]) {
    const x = fx * w, y = fy * h;
    const g = c.createRadialGradient(x - hr * 0.25, y - hr * 0.3, hr * 0.1, x, y, hr);
    g.addColorStop(0, 'rgba(52,54,54,.95)'); g.addColorStop(0.7, 'rgba(84,86,84,.95)'); g.addColorStop(1, 'rgba(120,122,120,.9)');
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(x, y, hr * 1.22, 0, 7); c.fill();
    c.fillStyle = g; c.beginPath(); c.arc(x, y, hr, 0, 7); c.fill();
    b.fillStyle = grey(12); b.beginPath(); b.arc(x, y, hr, 0, 7); b.fill();
    const drip = c.createLinearGradient(0, y, 0, y + hr * 9); drip.addColorStop(0, 'rgba(50,54,54,.06)'); drip.addColorStop(1, 'rgba(50,54,54,0)'); c.fillStyle = drip; c.fillRect(x - hr * 0.9, y, hr * 1.8, hr * 9);
  }
  // blowholes: air that never found its way up the shutter, thicker under the top of each lift
  for (let i = 0; i < 260; i++) {
    const top = r() > 0.5 ? 0 : lift, x = r() * w, y = top + Math.pow(r(), 2.2) * (top ? h - lift : lift), pr = 0.5 + r() * r() * 2.4;
    c.fillStyle = `rgba(56,58,58,${0.3 + r() * 0.45})`; c.beginPath(); c.ellipse(x, y, pr * (1 + r() * 0.6), pr, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x - pr, y + pr * 0.7, pr * 2, 0.8);
    b.fillStyle = grey(24, 0.9); b.beginPath(); b.arc(x, y, pr, 0, 7); b.fill();
  }
  return { map, bump };
}

/**
 * Lets a floor mirror the room. The scene is drawn once more from below the floor, into a small
 * picture, and the floor's own shading lays that picture over itself: sharper and stronger the
 * flatter you look across it and the better that part of the slab took its polish.
 */
function mirror(floor: THREE.Mesh, hide: THREE.Object3D[]): { prepare: NonNullable<Room['prepare']>; dispose: () => void } {
  const mat = floor.material as THREE.MeshStandardMaterial;
  let target: THREE.WebGLRenderTarget | undefined;
  const eye = new THREE.PerspectiveCamera(), toPicture = new THREE.Matrix4();
  const u = { tMirror: { value: null as THREE.Texture | null }, uMirror: { value: toPicture }, uTexel: { value: 1 / 512 } };
  mat.envMapIntensity = 0;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uMirror;\nvarying vec4 vMirror;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvMirror = uMirror * modelMatrix * vec4(transformed, 1.0);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D tMirror;\nuniform float uTexel;\nvarying vec4 vMirror;')
      .replace('#include <opaque_fragment>', /* glsl */ `
        vec2 mUv = vMirror.xy / vMirror.w;
        float mGraze = 1.0 - saturate(dot(normalize(vViewPosition), normal));
        float mFresnel = 0.06 + 0.94 * pow(mGraze, 5.0);
        float mLod = 0.3 + 4.4 * roughnessFactor;
        vec2 mStep = vec2(uTexel) * exp2(mLod);
        // a polished slab smears what it mirrors towards you more than across
        vec3 mSeen = textureLod(tMirror, mUv, mLod).rgb * 0.34
          + (textureLod(tMirror, mUv + vec2(0.0, mStep.y * 1.5), mLod + 0.5).rgb + textureLod(tMirror, mUv - vec2(0.0, mStep.y * 1.5), mLod + 0.5).rgb) * 0.21
          + (textureLod(tMirror, mUv + vec2(mStep.x * 0.8, 0.0), mLod + 0.2).rgb + textureLod(tMirror, mUv - vec2(mStep.x * 0.8, 0.0), mLod + 0.2).rgb) * 0.12;
        float mShine = mFresnel * (1.0 - 0.5 * roughnessFactor);
        outgoingLight = outgoingLight * (1.0 - mShine * 0.7) + min(mSeen, vec3(6.0)) * mShine;
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'mirror';
  const size = new THREE.Vector2(), at = new THREE.Vector3(), to = new THREE.Vector3(), turn = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0);
  let primed = false;
  return {
    prepare: (renderer, scene, camera) => {
      const y = floor.position.y;
      camera.updateMatrixWorld();
      at.setFromMatrixPosition(camera.matrixWorld);
      if (at.y <= y + 0.01) return;
      renderer.getDrawingBufferSize(size);
      const want = Math.min(1024, Math.max(256, 2 ** Math.round(Math.log2(Math.max(size.x, size.y) * 0.62))));
      if (!target || target.width !== want) {
        target?.dispose();
        const float = renderer.capabilities.isWebGL2 !== false && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
        target = new THREE.WebGLRenderTarget(want, want, { type: float ? THREE.HalfFloatType : THREE.UnsignedByteType, stencilBuffer: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
        u.tMirror.value = target.texture; u.uTexel.value = 1 / want;
      }
      // the same eye, as far below the floor as it is above, looking at the same things upside down
      turn.extractRotation(camera.matrixWorld);
      to.set(0, 0, -1).applyMatrix4(turn).add(at);
      eye.position.set(at.x, 2 * y - at.y, at.z);
      eye.up.set(0, 1, 0).applyMatrix4(turn).reflect(UP);
      eye.lookAt(to.x, 2 * y - to.y, to.z);
      eye.near = camera.near; eye.far = camera.far;
      eye.updateMatrixWorld();
      eye.projectionMatrix.copy(camera.projectionMatrix); eye.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
      toPicture.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(eye.projectionMatrix).multiply(eye.matrixWorldInverse);
      const was = hide.map((o) => o.visible), before = renderer.getRenderTarget(), auto = renderer.shadowMap.autoUpdate;
      hide.forEach((o) => { o.visible = false; });
      // the shadows are already worked out for this moment: no need to do them twice
      if (primed) renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(target);
      renderer.render(scene, eye);
      renderer.setRenderTarget(before);
      renderer.shadowMap.autoUpdate = auto; primed = true;
      hide.forEach((o, i) => { o.visible = was[i]; });
    },
    dispose: () => { target?.dispose(); },
  };
}

interface Opening { from: number; to: number; panes: number }

/**
 * A wall seen from inside, standing in the plane z = 0 and facing +z, with tall windows let into it.
 * `face` is the plaster. `fit` is everything that only makes sense from indoors (reveals, frames, glass)
 * and is put away when the wall is looked through from behind.
 */
function glazed(from: number, to: number, openings: Opening[], plaster: THREE.Material, frame: THREE.Material, pane: THREE.Material): { wall: THREE.Group; fit: THREE.Group } {
  const wall = new THREE.Group(), fit = new THREE.Group();
  const y0 = FLOOR - 0.2, y1 = FLOOR + TALL, sill = FLOOR + SILL, head = FLOOR + HEAD;
  const rect = (a: number, b: number, lo: number, hi: number, mat = plaster) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(b - a, hi - lo), mat); m.position.set((a + b) / 2, (lo + hi) / 2, 0); m.castShadow = m.receiveShadow = true; wall.add(m); return m; };
  let x = from;
  for (const o of [...openings].sort((p, q) => p.from - q.from)) {
    if (o.from > x) rect(x, o.from, y0, y1);
    rect(o.from, o.to, y0, sill); rect(o.from, o.to, head, y1);
    x = o.to;
    const w = o.to - o.from, h = head - sill, mid = (o.from + o.to) / 2, ym = (sill + head) / 2;
    // the thickness of the wall, plastered round into the opening
    const side = (px: number, ry: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(REVEAL, h), plaster); m.position.set(px, ym, -REVEAL / 2); m.rotation.y = ry; m.receiveShadow = m.castShadow = true; fit.add(m); };
    side(o.from, Math.PI / 2); side(o.to, -Math.PI / 2);
    const ledge = (py: number, rx: number) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, REVEAL), plaster); m.position.set(mid, py, -REVEAL / 2); m.rotation.x = rx; m.receiveShadow = m.castShadow = true; fit.add(m); };
    ledge(sill, -Math.PI / 2); ledge(head, Math.PI / 2);
    // slim dark frames, one mullion between every two panes
    const bar = (bw: number, bh: number, px: number, py: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.07), frame); m.position.set(px, py, -REVEAL + 0.02); m.castShadow = m.receiveShadow = true; fit.add(m); };
    bar(w, 0.05, mid, sill + 0.025); bar(w, 0.05, mid, head - 0.025);
    for (let i = 0; i <= o.panes; i++) bar(i === 0 || i === o.panes ? 0.05 : 0.044, h, o.from + (w * i) / o.panes + (i === 0 ? 0.025 : i === o.panes ? -0.025 : 0), ym);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), pane); glass.position.set(mid, ym, -REVEAL - 0.005); glass.renderOrder = -5; fit.add(glass);
  }
  if (x < to) rect(x, to, y0, y1);
  wall.add(fit);
  return { wall, fit };
}

/** A flush double socket, the earthed round kind used from Catalonia to Sweden. */
function socket(plastic: THREE.Material): THREE.Group {
  const g = new THREE.Group(), dark = new THREE.MeshStandardMaterial({ color: 0x8e9090, roughness: 0.6 });
  for (const dx of [-0.043, 0.043]) {
    const plate = new THREE.Mesh(new RoundedBoxGeometry(0.084, 0.084, 0.012, 2, 0.005), plastic); plate.position.set(dx, 0, 0.006); plate.castShadow = plate.receiveShadow = true;
    const well = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.002, 28), new THREE.MeshStandardMaterial({ color: 0xdedfdc, roughness: 0.5 })); well.rotation.x = Math.PI / 2; well.position.set(dx, 0, 0.0125);
    g.add(plate, well);
    for (const px of [-0.0095, 0.0095]) { const pin = new THREE.Mesh(new THREE.CircleGeometry(0.0026, 10), dark); pin.position.set(dx + px, 0, 0.0138); g.add(pin); }
  }
  return g;
}

/** A soft shadow along the line where two surfaces meet. Dark at one edge of the strip, gone at the other. */
function crease(len: number, wide: number, strength: number): THREE.Mesh {
  const [cv, c] = sheet(4, 64), g = c.createLinearGradient(0, 0, 0, 64);
  g.addColorStop(0, 'rgba(22,24,28,1)'); g.addColorStop(0.35, 'rgba(22,24,28,.36)'); g.addColorStop(1, 'rgba(22,24,28,0)');
  c.fillStyle = g; c.fillRect(0, 0, 4, 64);
  return new THREE.Mesh(new THREE.PlaneGeometry(len, wide), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, opacity: strength, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
}

/**
 * A sealed concrete floor that mirrors the room, smooth white walls, tall windows with dark slim
 * frames. South, behind the stand, they look across a town to Montserrat. East they let in a low
 * sun that crosses the floor and climbs the wall, and at night the moon does the same.
 */
function house(): Room {
  const g = new THREE.Group();
  const plaster = new THREE.MeshStandardMaterial({ color: 0xf1f1ef, roughness: 0.95 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x1d2023, roughness: 0.45, metalness: 0.4 });
  const pane = new THREE.MeshStandardMaterial({ color: 0xdfeaec, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.07, depthWrite: false });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f1, roughness: 0.38 });

  // walls: south behind the stand, east for the sun, the other two blind
  const south = glazed(XL - 0.2, XR + 0.2, [{ from: XL + 0.42, to: -1.95, panes: 3 }, { from: 2.35, to: 6.55, panes: 4 }], plaster, frame, pane);
  south.wall.position.z = BACK;
  const east = glazed(-(ZF + 0.2), -(BACK - 0.2), [{ from: -4.05, to: 0.15, panes: 4 }], plaster, frame, pane);
  east.wall.position.x = XL; east.wall.rotation.y = Math.PI / 2;
  const west = glazed(BACK - 0.2, ZF + 0.2, [], plaster, frame, pane);
  west.wall.position.x = XR; west.wall.rotation.y = -Math.PI / 2;
  const north = glazed(-(XR + 0.2), -(XL - 0.2), [], plaster, frame, pane);
  north.wall.position.z = ZF; north.wall.rotation.y = Math.PI;
  const walls = [south, east, west, north];
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(XR - XL + 1.4, ZF - BACK + 1.4), new THREE.MeshStandardMaterial({ color: 0xf3f2ee, roughness: 0.96 }));
  lid.rotation.x = Math.PI / 2; lid.position.set((XL + XR) / 2, FLOOR + TALL, (BACK + ZF) / 2); lid.castShadow = lid.receiveShadow = true;
  g.add(...walls.map((w) => w.wall), lid);

  // sockets where a builder would put them, and the soft shadow in every corner
  const s1 = socket(white); s1.position.set(1.42, FLOOR + 0.2, 0.001); south.fit.add(s1);
  const s2 = socket(white); s2.position.set(-3.5, FLOOR + 0.17, 0.001); south.fit.add(s2);
  const s3 = socket(white); s3.position.set(4.3, FLOOR + 0.17, 0.001); south.fit.add(s3);
  for (const [w, len] of [[south, XR - XL], [east, ZF - BACK], [west, ZF - BACK], [north, XR - XL]] as const) {
    const mid = w === south ? (XL + XR) / 2 : w === north ? -(XL + XR) / 2 : w === east ? -(BACK + ZF) / 2 : (BACK + ZF) / 2;
    const top = crease(len, 0.7, 0.2); top.position.set(mid, FLOOR + TALL - 0.35, 0.003); w.fit.add(top);
    const foot = crease(len, 0.3, 0.26); foot.rotation.z = Math.PI; foot.position.set(mid, FLOOR + 0.15, 0.003); w.fit.add(foot);
    for (const end of [-1, 1]) { const up = crease(TALL, 0.6, 0.16); up.rotation.z = (end * Math.PI) / 2; up.position.set(mid + end * (len / 2 - 0.3), FLOOR + TALL / 2, 0.003); w.fit.add(up); }
  }

  // the floor, and the storeys under it for when the house is seen from outside
  const ground = once('polished', () => polished(2048, 13));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(XR - XL + 0.3, ZF - BACK + 0.3), wear(ground, [XR - XL + 0.3, ZF - BACK + 0.3], [6.5, 6.5], { bump: 0, rough: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((XL + XR) / 2, FLOOR, (BACK + ZF) / 2); floor.receiveShadow = true;
  const below = new THREE.Mesh(new THREE.BoxGeometry(XR - XL + 0.7, 14, ZF - BACK + 0.7), new THREE.MeshStandardMaterial({ color: 0xe9e8e3, roughness: 0.95 }));
  below.position.set((XL + XR) / 2, FLOOR - 7.03, (BACK + ZF) / 2);
  g.add(floor, below, contact(XR - XL, 1.6, (XL + XR) / 2, BACK + 0.8, 0.2, 0.5));
  const mirrored = mirror(floor, [floor, below]);

  // the stand: one cast block, a steel plate floating a finger's width above it
  const cast = once('fair', () => fairFaced(21, 2.2, TOP - 0.03 - FLOOR));
  const block = solid(new THREE.Mesh(new RoundedBoxGeometry(2.2, TOP - 0.03 - FLOOR, 2.2, 3, 0.014), wear(cast, [1, 1], [1, 1], { bump: 0.9, rough: 0.82 })));
  block.position.y = (TOP - 0.03 + FLOOR) / 2;
  const spacer = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.014, 2.0), new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 1 })); spacer.position.y = TOP - 0.023;
  const plate = solid(new THREE.Mesh(new RoundedBoxGeometry(2.1, 0.016, 2.1, 1, 0.004), new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.4, metalness: 0.55 }))); plate.position.y = TOP - 0.008;
  // the hall number, cast into the block: a form liner fixed to the shutter before the pour
  const [nc, nx] = sheet(256, 320), cut = new THREE.CanvasTexture(nc); cut.colorSpace = THREE.SRGBColorSpace;
  const cutMat = new THREE.MeshStandardMaterial({ map: cut, transparent: true, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const [x, z, ry] of [[-0.55, 1.1004, 0], [0.55, -1.1004, Math.PI]] as const) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.45), cutMat); n.position.set(x, TOP - 0.03 - 0.51 * (TOP - 0.03 - FLOOR), z); n.rotation.y = ry; n.receiveShadow = true; g.add(n);
  }
  g.add(block, spacer, plate, contact(3.2, 3.2, 0, 0, 0.42));

  // outside
  const out = vista();
  g.add(out.group);

  // light: the sun, low in the east-north-east, through the east windows. Nothing else but the sky.
  const sun = new THREE.DirectionalLight(0xffffff, 0);
  sun.position.copy(SUN).multiplyScalar(40).add(new THREE.Vector3(1.4, 0.5, 3.4)); sun.target.position.set(1.4, 0.5, 3.4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 2.2; sun.shadow.blurSamples = 12;
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.035;
  const sc = sun.shadow.camera; sc.left = -9.6; sc.right = 9.6; sc.top = 6.4; sc.bottom = -5.6; sc.near = 8; sc.far = 72;
  const sky = new THREE.HemisphereLight(0xffffff, 0xffffff, 0);
  const fill = new THREE.DirectionalLight(0xeef2f8, 0); fill.position.set(4, 3, 8);                          // what the north of the room returns
  g.add(sun, sun.target, sky, fill);
  const DAY = { sun: new THREE.Color(1, 0.93, 0.82), sky: new THREE.Color(0.9, 0.95, 1), ground: new THREE.Color(0.76, 0.74, 0.7) };
  const NIGHT = { sun: new THREE.Color(0.58, 0.72, 1), sky: new THREE.Color(0.11, 0.16, 0.3), ground: new THREE.Color(0.03, 0.04, 0.06) };

  // what polished things on the stand see around them: bright openings south and east, pale walls, a grey floor
  const around = new THREE.Scene();
  const flat = (c: number, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide });
  const shellBox = new THREE.Mesh(new THREE.BoxGeometry(XR - XL, TALL, ZF - BACK), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc9c8c3).multiplyScalar(0.62), side: THREE.BackSide }));
  shellBox.position.set((XL + XR) / 2, FLOOR + TALL / 2, (BACK + ZF) / 2);
  const underfoot = new THREE.Mesh(new THREE.PlaneGeometry(XR - XL, ZF - BACK), flat(0x8e918c, 0.4)); underfoot.rotation.x = -Math.PI / 2; underfoot.position.set((XL + XR) / 2, FLOOR + 0.01, (BACK + ZF) / 2);
  around.add(shellBox, underfoot);
  const bright = (w: number, h: number, x: number, y: number, z: number, ry: number, k: number, c = 0xe6edf2) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat(c, k)); m.position.set(x, y, z); m.rotation.y = ry; around.add(m); };
  const wy = FLOOR + (SILL + HEAD) / 2, wh = HEAD - SILL;
  bright(3.03, wh, (XL + 0.42 - 1.95) / 2, wy, BACK + 0.02, 0, 2.6); bright(4.2, wh, 4.45, wy, BACK + 0.02, 0, 2.6);
  bright(4.2, wh, XL + 0.02, wy, 1.95, Math.PI / 2, 3.4, 0xfff0dc);
  bright(0.7, 0.7, XL + 0.04, FLOOR + 2.9, 1.2, Math.PI / 2, 26, 0xffe6c0);

  const local = new THREE.Vector3();
  return {
    group: g, targetY: 0.42, reach: 1.3, walled: true, surroundings: around, glow: { at: [0, 2.2, 1.5], gain: 0.16 },
    prepare: mirrored.prepare, dispose: mirrored.dispose,
    seenFrom: (camera) => { for (const w of walls) { w.wall.updateMatrixWorld(); w.fit.visible = w.wall.worldToLocal(local.copy(camera.position)).z > 0.02; } },
    light: (L, scene) => {
      const e = L * L * (3 - 2 * L);
      sun.color.copy(NIGHT.sun).lerp(DAY.sun, e); sun.intensity = 0.3 + 3.1 * e;
      sky.color.copy(NIGHT.sky).lerp(DAY.sky, e); sky.groundColor.copy(NIGHT.ground).lerp(DAY.ground, e); sky.intensity = 0.6 + 1.32 * e;
      fill.intensity = 0.2 * e;
      scene.environmentIntensity = 0.035 + 0.5 * e;
      out.set(e);
    },
    hall: (_colour, no) => {
      nx.clearRect(0, 0, 256, 320);
      if (no) {
        nx.font = '700 300px "Sofia Sans Extra Condensed Variable", "Arial Narrow", sans-serif'; nx.textAlign = 'center'; nx.textBaseline = 'alphabetic';
        // the sun is to the left: the left wall of the cut is in shade, the right one catches the light
        nx.fillStyle = 'rgba(255,255,255,.5)'; nx.fillText(String(no), 130.5, 262);
        nx.fillStyle = 'rgba(40,42,44,.62)'; nx.fillText(String(no), 126, 260);
        nx.fillStyle = 'rgba(118,120,118,.9)'; nx.fillText(String(no), 128, 261);
      }
      cut.needsUpdate = true;
    },
  };
}

export function buildRoom(): Room {
  return house();
}

/** The colour past everything, should a gap ever show it. */
export const OUTSIDE = '#c9d2da';
