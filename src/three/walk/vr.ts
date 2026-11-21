import { THREE } from '../kit';
import { landing } from './aim';
import * as plan from './plan';

/**
 * The hall in a headset. Experimental: written to the usual three.js WebXR pattern and never tried on a
 * device. Nothing here runs unless a session has been asked for, so it cannot disturb the hall on a screen.
 *
 * The visitor stands at their real height on the hall's floor. They point a controller at the floor or at
 * a piece and press its trigger to be put there, and turn in steps with the thumbstick.
 */
export interface VR {
  active: boolean;
  /** Once a frame. Says whether the picture has to be drawn again, which in a headset it always has. */
  update: (dt: number) => boolean;
  /** Put the visitor's head over a place on the floor and, if asked, face them a given way. */
  land: (x: number, z: number, yaw?: number) => void;
  /** Where the head is in the hall, and which way it faces. */
  head: () => { x: number; z: number; yaw: number };
  end: () => void;
}

/** What the headset needs of the hall. */
export interface Body {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  rig: THREE.Group;
  camera: THREE.PerspectiveCamera;
  /** Where the visitor stood on the screen when they put the headset on. */
  x: number; z: number; yaw: number;
}

const SNAP = Math.PI / 6;

export async function enterVR(b: Body, onEnd: () => void): Promise<VR> {
  const xr = b.renderer.xr, system = (navigator as Navigator & { xr?: XRSystem }).xr;
  if (!system) throw new Error('no WebXR');
  const session = await system.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
  xr.enabled = true;
  // the floor of the room the visitor is really in becomes the floor of the hall
  xr.setReferenceSpaceType('local-floor');
  // a headset that cannot give a floor to stand on is let go of again, so that it is not left in a session that shows nothing
  try { await xr.setSession(session); } catch (err) { xr.enabled = false; await session.end().catch(() => undefined); throw err; }

  const fwd = new THREE.Vector3(), at = new THREE.Vector3(), origin = new THREE.Vector3(), dir = new THREE.Vector3(), turn = new THREE.Matrix4();
  const head = () => {
    b.camera.updateMatrixWorld();
    at.setFromMatrixPosition(b.camera.matrixWorld);
    fwd.set(0, 0, -1).transformDirection(b.camera.matrixWorld);
    return { x: at.x, z: at.z, yaw: Math.atan2(-fwd.x, -fwd.z) };
  };
  /** Turn the rig about the head, then slide it until the head is over the place asked for. */
  const land = (x: number, z: number, yaw?: number) => {
    if (yaw !== undefined) b.rig.rotation.y += yaw - head().yaw;
    b.rig.updateMatrixWorld(true);
    const h = head();
    b.rig.position.x += x - h.x; b.rig.position.z += z - h.z; b.rig.position.y = plan.FLOOR;
    b.rig.updateMatrixWorld(true);
  };
  b.rig.rotation.set(0, b.yaw, 0); b.rig.position.set(b.x, plan.FLOOR, b.z);

  // each hand: a thin ray to point with, and a ring on the floor where it would put the visitor
  const beam = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
  const ringGeo = new THREE.RingGeometry(0.2, 0.26, 40).rotateX(-Math.PI / 2);
  const hands = [0, 1].map((i) => {
    const hand = xr.getController(i), grip = xr.getControllerGrip(i);
    const ray = new THREE.Line(beam, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    ray.scale.z = 4; ray.visible = false; hand.add(ray);
    const stub = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.12), new THREE.MeshStandardMaterial({ color: 0x24282c, roughness: 0.5 }));
    grip.add(stub);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xd1481f, transparent: true, opacity: 0.9, depthTest: false }));
    ring.visible = false; ring.renderOrder = 50;
    const state = { hand, grip, ray, stub, ring, to: undefined as { x: number; z: number; yaw?: number } | undefined };
    const onSelect = () => { if (state.to) land(state.to.x, state.to.z, state.to.yaw); };
    const onConnect = () => { ray.visible = true; };
    const onDisconnect = () => { ray.visible = false; ring.visible = false; state.to = undefined; };
    hand.addEventListener('select', onSelect); hand.addEventListener('connected', onConnect); hand.addEventListener('disconnected', onDisconnect);
    b.rig.add(hand, grip); b.scene.add(ring);
    return { ...state, state, off: () => { hand.removeEventListener('select', onSelect); hand.removeEventListener('connected', onConnect); hand.removeEventListener('disconnected', onDisconnect); } };
  });

  let armed = true, live = true;
  const vr: VR = {
    active: true, land, head,
    end: () => { if (live) void session.end().catch(() => undefined); },
    update: () => {
      for (const h of hands) {
        if (!h.ray.visible) continue;
        h.hand.updateMatrixWorld();
        origin.setFromMatrixPosition(h.hand.matrixWorld);
        dir.set(0, 0, -1).applyMatrix4(turn.extractRotation(h.hand.matrixWorld)).normalize();
        const hit = landing(origin, dir), s = h.state;
        // a piece: the place in front of it, facing it. The floor: that spot, facing as now
        if (hit.piece) { const p = plan.standing(hit.piece, 3.3); s.to = { x: p.x, z: p.z, yaw: p.yaw }; }
        else s.to = hit.floor ? { x: hit.floor[0], z: hit.floor[1] } : undefined;
        h.ring.visible = !!s.to;
        if (s.to) { h.ring.position.set(s.to.x, plan.FLOOR + 0.02, s.to.z); h.ray.scale.z = Math.max(0.5, origin.distanceTo(at.set(s.to.x, plan.FLOOR, s.to.z))); }
        else h.ray.scale.z = 4;
      }
      // the thumbstick: left and right turn the visitor a twelfth of the way round, and have to come back to the middle between turns
      let side = 0;
      for (const src of session.inputSources) {
        const axes = src.gamepad?.axes;
        if (!axes) continue;
        const v = axes.length >= 4 ? axes[2] : axes[0] ?? 0;
        if (Math.abs(v) > Math.abs(side)) side = v;
      }
      if (armed && Math.abs(side) > 0.6) { armed = false; const h = head(); land(h.x, h.z, h.yaw - Math.sign(side) * SNAP); }
      else if (Math.abs(side) < 0.3) armed = true;
      return true;
    },
  };

  session.addEventListener('end', () => {
    live = false; vr.active = false;
    for (const h of hands) {
      h.off();
      b.rig.remove(h.hand, h.grip); b.scene.remove(h.ring);
      (h.ray.material as THREE.Material).dispose(); h.stub.geometry.dispose(); (h.stub.material as THREE.Material).dispose(); (h.ring.material as THREE.Material).dispose();
    }
    beam.dispose(); ringGeo.dispose();
    xr.enabled = false;
    onEnd();
  }, { once: true });
  return vr;
}
