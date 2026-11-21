import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { THREE } from './kit';
import { builders } from './models';

/**
 * A piece in the visitor's own room, through the camera of a phone or the cameras of a headset.
 * The piece is built again, small enough for a table, and runs there as it runs on its stand. The browser's own
 * room view (WebXR) finds a table or the floor. A ring shows where the piece would stand, and a tap puts it there.
 * Where no surface is found, the piece is put a metre in front of the visitor.
 *
 * Tried in an emulated headset, not yet on a phone. iPhones do not have this room view and are not offered it.
 */
export interface RoomWords { hint: string; placed: string; close: string }

type XR = { isSessionSupported(mode: string): Promise<boolean>; requestSession(mode: string, init?: object): Promise<XRSession> };
const system = (): XR | undefined => (navigator as Navigator & { xr?: XR }).xr;

/** Whether this browser can show a piece in the room it is in. */
export async function roomViewOffered(): Promise<boolean> {
  try { return !!(await system()?.isSessionSupported('immersive-ar')); } catch { return false; }
}

/** How wide and how tall the piece may stand in the room, in metres: it should fit on a table. */
const WIDE = 0.5, TALL = 0.6;

/** Resolves when the visitor has closed the room view. Rejects when it could not be opened. */
export async function showInRoom(id: string, words: RoomWords): Promise<void> {
  const xr = system(), make = builders[id];
  if (!xr || !make) throw new Error('no room view here');

  // the words over the camera's picture: what to do, and the way out
  const overlay = document.createElement('div');
  overlay.className = 'roomview';
  const bar = document.createElement('div'), hint = document.createElement('p'), close = document.createElement('button');
  bar.className = 'roomview__bar'; hint.className = 'roomview__hint'; hint.setAttribute('role', 'status'); hint.textContent = words.hint;
  close.type = 'button'; close.className = 'btn'; close.textContent = words.close;
  bar.append(hint, close); overlay.append(bar); document.body.append(overlay);
  // a tap on the words or the button is not a tap on the room
  bar.addEventListener('beforexrselect', (e) => e.preventDefault());

  let session: XRSession;
  try {
    session = await xr.requestSession('immersive-ar', { optionalFeatures: ['hit-test', 'dom-overlay', 'local-floor'], domOverlay: { root: overlay } });
  } catch (err) { overlay.remove(); throw err; }

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, stencil: true });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local');
  try { await renderer.xr.setSession(session); } catch (err) { overlay.remove(); renderer.dispose(); await session.end().catch(() => undefined); throw err; }

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(60, 1, 0.02, 30);
  const pmrem = new THREE.PMREMGenerator(renderer), around = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = around.texture; scene.environmentIntensity = 0.55;
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(1.5, 3, 2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a84, 1.5), sun);

  // the piece, standing on y = 0 of its holder and scaled for a table. What is only seen through a window takes up no room
  const b = make(), root = b.root, holder = new THREE.Group();
  const aside: [THREE.Object3D, THREE.Object3D][] = [];
  root.traverse((o) => { if (o.userData.noFit && o.parent) aside.push([o, o.parent]); });
  for (const [o] of aside) o.removeFromParent();
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  for (const [o, parent] of aside) parent.add(o);
  const size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const s = Math.min(WIDE / Math.max(size.x, size.z, 1e-3), TALL / Math.max(size.y, 1e-3));
  root.scale.setScalar(s);
  root.position.set(-mid.x * s, -box.min.y * s, -mid.z * s);
  // a soft shadow under it, so that it stands on the table and does not float over it
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const g2 = sc.getContext('2d')!, fade = g2.createRadialGradient(64, 64, 8, 64, 64, 64);
  fade.addColorStop(0, 'rgba(0,0,0,.5)'); fade.addColorStop(0.6, 'rgba(0,0,0,.2)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  g2.fillStyle = fade; g2.fillRect(0, 0, 128, 128);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(size.x * s * 1.7, size.z * s * 1.7 + 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  under.rotation.x = -Math.PI / 2; under.position.y = 0.002;
  holder.add(under, root); holder.visible = false;
  // the ring that shows where the piece would stand
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.11, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd1481f }));
  ring.matrixAutoUpdate = false; ring.visible = false;
  scene.add(holder, ring);

  const eye = new THREE.Vector3(), ahead = new THREE.Vector3(), spot = new THREE.Vector3();
  let placed = false;
  const put = (at: THREE.Vector3) => {
    camera.getWorldPosition(eye);
    holder.position.copy(at);
    // its front to whoever put it there
    holder.rotation.y = Math.atan2(eye.x - at.x, eye.z - at.z);
    holder.visible = true;
    if (!placed) { placed = true; hint.textContent = words.placed; }
  };
  const hand = renderer.xr.getController(0);
  hand.addEventListener('select', () => { if (ring.visible) put(spot.setFromMatrixPosition(ring.matrix)); });
  scene.add(hand);

  // surfaces, where the device can find them
  let source: XRHitTestSource | undefined;
  try {
    const viewer = await session.requestReferenceSpace('viewer');
    source = (await session.requestHitTestSource?.({ space: viewer })) ?? undefined;
  } catch { source = undefined; }

  const t0 = performance.now();
  let waited = 0, last = t0;
  renderer.setAnimationLoop((_time: number, frame?: XRFrame) => {
    const now = performance.now(), dt = (now - last) / 1000;
    last = now;
    const space = renderer.xr.getReferenceSpace();
    let found = false;
    if (frame && source && space) {
      const pose = frame.getHitTestResults(source)[0]?.getPose(space);
      if (pose) { ring.matrix.fromArray(pose.transform.matrix); found = true; }
    }
    ring.visible = found;
    // no surface after a few seconds, or a device that finds none: a metre in front of the visitor, a little below the eye
    if (!placed && frame && !found && (waited += dt) > (source ? 6 : 0.4)) {
      camera.getWorldPosition(eye); camera.getWorldDirection(ahead);
      ahead.y = 0;
      if (ahead.lengthSq() < 1e-4) ahead.set(0, 0, -1);
      put(spot.copy(eye).addScaledVector(ahead.normalize(), 1).setY(eye.y - 0.45));
    }
    b.update?.({ t: (now - t0) / 1000 + 2.6, lights: 1, camera });
    renderer.render(scene, camera);
  });

  return new Promise<void>((resolve) => {
    close.addEventListener('click', () => { void session.end().catch(() => undefined); });
    session.addEventListener('end', () => {
      renderer.setAnimationLoop(null);
      overlay.remove();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        for (const mat of (Array.isArray(m.material) ? m.material : m.material ? [m.material] : []) as THREE.Material[]) {
          for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
          mat.dispose();
        }
      });
      around.dispose(); pmrem.dispose(); renderer.dispose();
      resolve();
    }, { once: true });
  });
}
