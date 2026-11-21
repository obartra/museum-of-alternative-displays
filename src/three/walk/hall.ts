import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { THREE } from '../kit';
import { HEAD, SILL, TALL, crease, glazed, mirror, once, polished, sheet, wear } from '../room';
import { SUN, vista } from '../vista';
import { FLOOR, GATE, GATE_H, HALF, LENGTH, WALL, WINDOW, bays, plateAt, walls, windows } from './plan';

/**
 * The museum as a building: seven halls in a row, one for each hall of the collection, with a wall and a
 * doorway between each and the next. White walls, a polished floor, tall windows down one side. Over every
 * doorway hangs the plate of the hall it leads to, and each hall carries its own name on its blind wall.
 * Nothing lights the building but the windows.
 */
export interface Hall {
  group: THREE.Group;
  /** Daylight, 0 to 1. */
  light: (L: number, scene: THREE.Scene) => void;
  /** Told where the visitor's eye is, so that the land outside stays as far away as it looks. */
  follow: (eye: THREE.Vector3) => void;
  /** What the polished floor mirrors, drawn before each picture. Only where the device can afford it. */
  prepare?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => void;
  /** Whether the floor mirrors at all. Not in a headset, where the mirror is not redrawn for each eye. */
  reflect: (on: boolean) => void;
  /** What shiny things in the hall see around them. */
  surroundings: THREE.Scene;
  /** Which way the sun stands, as seen from inside the hall. */
  sunward: THREE.Vector3;
  sun: THREE.DirectionalLight;
  /** Everything of the building itself, to put away when one piece is photographed alone. */
  shell: THREE.Group;
  ready: Promise<void>;
  settle: () => void;
  dispose: () => void;
}

/** What a sign needs to know of a hall: its number, its name and its enamel colour. */
export interface Sign { no: number; name: string; ground: string; ink: string }
export interface HallOptions {
  /** A phone: no mirror in the floor, smaller pictures on the surfaces, a coarser shadow. */
  lite: boolean;
  signs: Sign[];
  /** The typeface of the signs, as the page names it. */
  display: string;
}

/**
 * The building is turned on its plot. Its windows face south-east, so the low morning sun comes in through
 * the same wall that looks at the mountain, and crosses the floor of every bay. Turned square to the south,
 * that wall would get no sun at all.
 */
const TURN = THREE.MathUtils.degToRad(-33);
const UP = new THREE.Vector3(0, 1, 0);

/** Many small meshes of one material become one mesh, so that a long wall costs one drawing call and not hundreds. */
function fuse(root: THREE.Object3D): THREE.Group {
  const out = new THREE.Group(), lots = new Map<string, { like: THREE.Mesh; geos: THREE.BufferGeometry[] }>();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    const key = `${m.material.uuid}|${m.castShadow}|${m.receiveShadow}|${m.renderOrder}`;
    let lot = lots.get(key);
    if (!lot) lots.set(key, lot = { like: m, geos: [] });
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld);
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    lot.geos.push(g);
  });
  for (const { like, geos } of lots.values()) {
    const m = new THREE.Mesh(mergeGeometries(geos, false), like.material);
    m.castShadow = like.castShadow; m.receiveShadow = like.receiveShadow; m.renderOrder = like.renderOrder;
    out.add(m);
  }
  return out;
}

/** The plate over an opening: the number and name of the hall beyond, in white on that hall's enamel. */
function plate(s: Sign, display: string): THREE.CanvasTexture {
  const W = 1152, H = 320, [cv, c] = sheet(W, H);
  const round = (x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  c.fillStyle = s.ground; round(0, 0, W, H, 22); c.fill();
  const shine = c.createLinearGradient(0, 0, 0, H); shine.addColorStop(0, 'rgba(255,255,255,.14)'); shine.addColorStop(0.4, 'rgba(255,255,255,0)');
  c.fillStyle = shine; round(0, 0, W, H, 22); c.fill();
  c.globalAlpha = 0.78; c.strokeStyle = s.ink; c.lineWidth = 5; round(17, 17, W - 34, H - 34, 10); c.stroke(); c.globalAlpha = 1;
  c.fillStyle = s.ink; c.textBaseline = 'alphabetic';
  c.font = `900 330px ${display}`;
  const no = String(s.no), nw = c.measureText(no).width;
  c.fillText(no, 74, 276);
  // the name is set as large as the plate allows, and no larger than the number is tall
  const name = s.name.toLocaleUpperCase(), room = W - 74 - nw - 60 - 70;
  let size = 150;
  c.font = `800 ${size}px ${display}`;
  const w = c.measureText(name).width;
  if (w > room) { size = Math.floor((size * room) / w); c.font = `800 ${size}px ${display}`; }
  c.fillText(name, 74 + nw + 60, 160 + size * 0.36);
  for (const x of [40, W - 40]) { const g = c.createRadialGradient(x - 2, H / 2 - 2, 1, x, H / 2, 10); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g; c.beginPath(); c.arc(x, H / 2, 9, 0, 7); c.fill(); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildHall(o: HallOptions): Hall {
  const g = new THREE.Group(), raw = new THREE.Group();
  const plaster = new THREE.MeshStandardMaterial({ color: 0xf1f1ef, roughness: 0.95 });
  const frame = new THREE.MeshStandardMaterial({ color: 0x1d2023, roughness: 0.45, metalness: 0.4 });
  const pane = new THREE.MeshStandardMaterial({ color: 0xdfeaec, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.07, depthWrite: false });
  const y0 = FLOOR - 0.2, y1 = FLOOR + TALL, mid = (y0 + y1) / 2;
  const wall = (w: number, h: number, mat: THREE.Material = plaster) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.castShadow = m.receiveShadow = true; return m; };

  // the long walls: windows the whole length of the south one, the north one blind
  const south = glazed(-0.2, LENGTH + 0.2, windows, plaster, frame, pane);
  south.wall.position.z = -HALF;
  const north = wall(LENGTH + 0.4, y1 - y0); north.position.set(LENGTH / 2, mid, HALF); north.rotation.y = Math.PI;
  // the ends: the door behind the visitor, and one more window at the far end of the centre line
  const door = wall(2 * HALF + 0.4, y1 - y0); door.position.set(0, mid, 0); door.rotation.y = Math.PI / 2;
  const far = glazed(-(HALF + 0.2), HALF + 0.2, [{ from: -2.1, to: 2.1, panes: 4 }], plaster, frame, pane);
  far.wall.position.x = LENGTH; far.wall.rotation.y = -Math.PI / 2;
  const lid = wall(LENGTH + 1.4, 2 * HALF + 1.4, new THREE.MeshStandardMaterial({ color: 0xf3f2ee, roughness: 0.96 }));
  lid.rotation.x = Math.PI / 2; lid.position.set(LENGTH / 2, y1, 0);
  raw.add(south.wall, north, door, far.wall, lid);

  // the door itself: two dark leaves in a dark frame, shut
  const leaf = new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.5, metalness: 0.35 });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; raw.add(m); return m; };
  const DW = 2.3, DH = 3.1;
  box(0.05, DH, DW - 0.04, 0.03, FLOOR + DH / 2, 0, leaf);
  for (const z of [-DW / 2 - 0.035, DW / 2 + 0.035]) box(0.1, DH + 0.07, 0.07, 0.05, FLOOR + (DH + 0.07) / 2, z, frame);
  box(0.1, 0.07, DW + 0.14, 0.05, FLOOR + DH + 0.035, 0, frame);
  box(0.062, DH - 0.04, 0.012, 0.03, FLOOR + DH / 2, 0, frame);
  for (const z of [-0.09, 0.09]) box(0.05, 0.9, 0.028, 0.085, FLOOR + 1.25, z, new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.9 }));

  // cross walls: a panel either side of the opening and a deep beam over it
  const side = HALF - GATE / 2;
  for (const x of walls) {
    for (const s of [-1, 1]) box(WALL, y1 - y0, side + 0.2, x, mid, s * (GATE / 2 + (side + 0.2) / 2), plaster);
    box(WALL, y1 - (FLOOR + GATE_H), GATE, x, (y1 + FLOOR + GATE_H) / 2, 0, plaster);
  }

  // the soft shadow where two surfaces meet, along every wall, top and foot, and up every corner
  const tops = crease(1, 0.7, 0.2), feet = crease(1, 0.3, 0.26), ups = crease(1, 0.6, 0.16);
  const strip = (like: THREE.Mesh, len: number, wide: number, x: number, y: number, z: number, ry: number, rz = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(len, wide), like.material); m.position.set(x, y, z); m.rotation.set(0, ry, rz, 'YXZ'); raw.add(m);
  };
  /** One face of a wall: `ry` turns it to look into the room, `len` is how far it runs, `at` its middle. */
  const edges = (len: number, x: number, z: number, ry: number, corners = true, foot = true) => {
    const out = new THREE.Vector3(0, 0, 0.004).applyAxisAngle(UP, ry), along = new THREE.Vector3(1, 0, 0).applyAxisAngle(UP, ry);
    strip(tops, len, 0.7, x + out.x, y1 - 0.35, z + out.z, ry);
    if (foot) strip(feet, len, 0.3, x + out.x, FLOOR + 0.15, z + out.z, ry, Math.PI);
    if (corners) for (const end of [-1, 1]) strip(ups, TALL, 0.6, x + out.x + along.x * end * (len / 2 - 0.3), FLOOR + TALL / 2, z + out.z + along.z * end * (len / 2 - 0.3), ry, (end * Math.PI) / 2);
  };
  edges(2 * HALF, 0, 0, Math.PI / 2); edges(2 * HALF, LENGTH, 0, -Math.PI / 2);
  bays.forEach((b) => {
    const a = b.from + (b.from ? WALL / 2 : 0), z = b.to - (b.to < LENGTH ? WALL / 2 : 0);
    edges(z - a, (a + z) / 2, -HALF, 0); edges(z - a, (a + z) / 2, HALF, Math.PI);
  });
  for (const x of walls) for (const [f, ry] of [[-1, -Math.PI / 2], [1, Math.PI / 2]] as const) {
    edges(2 * HALF, x + (f * WALL) / 2, 0, ry, true, false);
    for (const s of [-1, 1]) strip(feet, side, 0.3, x + f * (WALL / 2 + 0.004), FLOOR + 0.15, s * (GATE / 2 + side / 2), ry, Math.PI);
  }

  const shell = fuse(raw);
  g.add(shell);

  // over each opening, on both faces of the wall: the hall you are about to walk into
  const signs: THREE.Mesh[] = [];
  walls.forEach((x, i) => {
    for (const [f, hall] of [[-1, i + 2], [1, i + 1]] as const) {
      const s = o.signs[hall - 1];
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1), new THREE.MeshStandardMaterial({ map: plate(s, o.display), roughness: 0.34, alphaTest: 0.5 }));
      m.position.set(x + f * (WALL / 2 + 0.012), FLOOR + (GATE_H + TALL) / 2, 0); m.rotation.y = (f * Math.PI) / 2; m.receiveShadow = true;
      signs.push(m); shell.add(m);
    }
  });

  // on the blind wall just inside each doorway: the name of the hall you are standing in, large
  bays.forEach((b) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1), new THREE.MeshStandardMaterial({ map: plate(o.signs[b.hall - 1], o.display), roughness: 0.34, alphaTest: 0.5 }));
    m.position.set(plateAt(b.hall), FLOOR + 3.1, HALF - 0.014); m.rotation.y = Math.PI; m.receiveShadow = true;
    signs.push(m); shell.add(m);
  });

  // the floor: one slab, polished, the whole length
  const ground = once('polished', () => polished(o.lite ? 1024 : 2048, 13));
  const fw = LENGTH + 0.3, fd = 2 * HALF + 0.3;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), wear(ground, [fw, fd], [6.5, 6.5], { bump: 0, rough: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(LENGTH / 2, FLOOR, 0); floor.receiveShadow = true;
  shell.add(floor);
  const mirrored = o.lite ? undefined : mirror(floor, [floor]);

  // outside: the same land and sky, turned with the plot, and big enough to stand beyond the far end of the hall
  const out = vista();
  out.group.rotation.y = TURN; out.group.scale.setScalar(2.6);
  g.add(out.group);
  const sunward = SUN.clone().applyAxisAngle(UP, TURN);

  // light: the sun through the south windows, and the sky. One shadow map for the whole building, laid along it.
  const sun = new THREE.DirectionalLight(0xffffff, 0);
  const centre = new THREE.Vector3(LENGTH / 2, FLOOR + TALL / 2, 0);
  sun.position.copy(sunward).multiplyScalar(120).add(centre); sun.target.position.copy(centre);
  sun.castShadow = true;
  const cam = sun.shadow.camera;
  cam.up.set(1, 0, 0);
  cam.position.copy(sun.position); cam.lookAt(centre); cam.updateMatrixWorld();
  const seen = new THREE.Box3(), corner = new THREE.Vector3(), inv = cam.matrixWorld.clone().invert();
  for (const x of [-1, LENGTH + 1]) for (const y of [FLOOR - 0.4, y1 + 0.4]) for (const z of [-HALF - 0.6, HALF + 0.4]) seen.expandByPoint(corner.set(x, y, z).applyMatrix4(inv));
  cam.left = seen.min.x; cam.right = seen.max.x; cam.bottom = seen.min.y; cam.top = seen.max.y; cam.near = -seen.max.z - 2; cam.far = -seen.min.z + 2;
  cam.updateProjectionMatrix();
  const long = o.lite ? 2048 : 4096, across = Math.ceil((long * (seen.max.x - seen.min.x)) / (seen.max.y - seen.min.y) / 64) * 64;
  sun.shadow.mapSize.set(across, long);
  sun.shadow.radius = o.lite ? 1.2 : 1.6;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = o.lite ? 0.09 : 0.05;
  const sky = new THREE.HemisphereLight(0xffffff, 0xffffff, 0);
  const fill = new THREE.DirectionalLight(0xeef2f8, 0); fill.position.set(3, 3, 8);                          // what the blind wall returns
  g.add(sun, sun.target, sky, fill);
  const DAY = { sun: new THREE.Color(1, 0.93, 0.82), sky: new THREE.Color(0.9, 0.95, 1), ground: new THREE.Color(0.76, 0.74, 0.7) };
  const NIGHT = { sun: new THREE.Color(0.58, 0.72, 1), sky: new THREE.Color(0.11, 0.16, 0.3), ground: new THREE.Color(0.03, 0.04, 0.06) };

  // what polished things on a block see around them: a row of bright windows to the south, pale walls, a grey floor
  const around = new THREE.Scene();
  const flat = (c: number, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(22, TALL, 2 * HALF), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc9c8c3).multiplyScalar(0.62), side: THREE.BackSide }));
  room.position.y = FLOOR + TALL / 2;
  const underfoot = new THREE.Mesh(new THREE.PlaneGeometry(22, 2 * HALF), flat(0x8e918c, 0.4)); underfoot.rotation.x = -Math.PI / 2; underfoot.position.y = FLOOR + 0.01;
  around.add(room, underfoot);
  for (let x = -8.8; x < 9; x += 4.4) { const m = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW, HEAD - SILL), flat(0xe6edf2, 2.6)); m.position.set(x, FLOOR + (SILL + HEAD) / 2, -HALF + 0.02); around.add(m); }
  // the sun itself, where it stands in one of those windows
  const glare = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), flat(0xffe6c0, 26));
  glare.position.copy(sunward).multiplyScalar((-HALF + 0.04) / sunward.z); around.add(glare);

  return {
    group: g, shell, surroundings: around, sunward, sun, ready: out.ready, settle: out.settle,
    prepare: mirrored?.prepare,
    reflect: (on) => mirrored?.show(on),
    follow: (eye) => { out.group.position.set(eye.x, 0, eye.z); },
    light: (L, scene) => {
      const e = L * L * (3 - 2 * L);
      // by night the moon and the sky are a little brighter than in the room of one piece: a hall this long has to be read to its far end
      sun.color.copy(NIGHT.sun).lerp(DAY.sun, e); sun.intensity = 0.85 + 2.55 * e;
      sky.color.copy(NIGHT.sky).lerp(DAY.sky, e); sky.groundColor.copy(NIGHT.ground).lerp(DAY.ground, e); sky.intensity = 0.9 + 1.02 * e;
      fill.intensity = 0.2 * e;
      scene.environmentIntensity = 0.035 + 0.5 * e;
      out.set(e);
    },
    dispose: () => {
      mirrored?.dispose();
      sun.shadow.dispose();
      g.traverse((obj) => {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose?.();
        for (const mat of (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) as THREE.Material[]) {
          for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
          // the land and the sky keep their pictures in uniforms
          for (const u of Object.values((mat as THREE.ShaderMaterial).uniforms ?? {})) if ((u.value as THREE.Texture | null)?.isTexture) (u.value as THREE.Texture).dispose();
          mat.dispose();
        }
      });
      around.traverse((obj) => { const m = obj as THREE.Mesh; m.geometry?.dispose?.(); (m.material as THREE.Material | undefined)?.dispose?.(); });
    },
  };
}
