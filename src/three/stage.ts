import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { THREE, type Built, type Eye } from './kit';
import { OUTSIDE, TOP as PLINTH_TOP, buildRoom, type Room } from './room';

const FOV = 30;
const UP = new THREE.Vector3(0, 1, 0);

/**
 * One stand in one room: see room.ts.
 * The light is the room's own daylight. Switch it off and it is night: only the moon, the town and what the piece emits.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 700);
  private scene = new THREE.Scene();
  private controls?: OrbitControls;
  private glow = new THREE.PointLight(0xffffff, 0, 9, 1.4);
  private room!: Room;
  private pmrem: THREE.PMREMGenerator;
  private around?: THREE.WebGLRenderTarget;
  private hallOf: [string, number?] = ['#586067'];
  private piece?: Built;
  private lights = 1;
  private lightsTarget = 1;
  private t0 = performance.now();
  private raf = 0;
  private running = false;
  private home = { az: 28, el: 13, dist: 5.1 };
  private ro?: ResizeObserver;
  private dragged = false;
  private still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private eyeAt?: THREE.Vector3;
  private eyeTo?: THREE.Vector3;
  private eyePlay = 0.1;
  private eyeT0 = 0;
  /** Called the first time the visitor turns the piece. */
  onTouch?: () => void;

  constructor(private canvas: HTMLCanvasElement, interactive: boolean) {
    // the stencil buffer is what lets a reflection show only inside its pane, and a scene only through its lens
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, preserveDrawingBuffer: !interactive, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(interactive ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.pmrem = new THREE.PMREMGenerator(this.renderer);

    this.scene.add(this.glow);
    this.scene.background = new THREE.Color(OUTSIDE);
    this.room = buildRoom();
    this.scene.add(this.room.group);
    this.room.hall(...this.hallOf);
    this.surround();

    if (interactive) {
      const c = new OrbitControls(this.camera, canvas);
      c.enablePan = false; c.enableDamping = true; c.dampingFactor = 0.08;
      c.minPolarAngle = 0.2; c.maxPolarAngle = Math.PI / 2 - 0.03;
      c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
      c.autoRotate = !this.still && !this.room.walled;
      c.autoRotateSpeed = 0.7;
      c.target.set(0, this.room.targetY, 0);
      c.addEventListener('start', () => { c.autoRotate = false; if (!this.dragged) { this.dragged = true; this.onTouch?.(); } });
      this.controls = c;
      // a sideways drag turns the piece, a vertical swipe still scrolls the page
      canvas.style.touchAction = 'pan-y';
      this.ro = new ResizeObserver(() => this.resize());
    }
    this.attach();
  }

  /** Call after the canvas has been moved into a new parent. */
  attach(): void {
    this.ro?.disconnect();
    if (this.canvas.parentElement) this.ro?.observe(this.canvas.parentElement);
    this.resize();
  }

  get inDark(): Built['inDark'] | undefined { return this.piece?.inDark; }
  get surface(): HTMLCanvasElement | undefined { return this.piece?.surface; }
  get eye(): Eye | undefined { return this.piece?.eye; }
  get inEye(): boolean { return !!this.eyeAt; }

  /** What glass and metal on the stand reflect: the room itself where it can say, a plain studio where it cannot. */
  private surround(): void {
    // above and in front by default, so that its mirror image never lands in a screen someone is looking at
    this.glow.position.set(...(this.room.glow?.at ?? [0, 2.5, 1.0]));
    this.around?.dispose();
    this.around = this.pmrem.fromScene(this.room.surroundings ?? new RoomEnvironment(), 0.035);
    this.scene.environment = this.around.texture;
  }

  resize(w?: number, h?: number): void {
    const el = this.canvas.parentElement ?? this.canvas;
    const W = w ?? Math.max(1, el.clientWidth), H = h ?? Math.max(1, el.clientHeight);
    const back = (aspect: number) => Math.max(1, 1.02 / aspect), k = back(W / H) / back(this.camera.aspect);
    this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    // a taller frame is a narrower view: step back far enough to keep the whole piece in it
    const c = this.controls;
    if (c && !this.eyeAt && Math.abs(k - 1) > 0.01) {
      this.camera.position.sub(c.target).multiplyScalar(k).add(c.target);
      c.minDistance *= k; c.maxDistance *= k;
      c.update();
    }
  }

  /** Put a piece on the plinth, scaled to fit, in front of its hall colour. */
  setPiece(b: Built, hallColour: string, hallNo?: number): void {
    this.clear();
    const root = b.root;
    // what is only seen through a window (a reflection, a scene behind a lens) takes up no room on the plinth
    const aside: [THREE.Object3D, THREE.Object3D][] = [];
    root.traverse((o) => { if (o.userData.noFit && o.parent) aside.push([o, o.parent]); });
    for (const [o] of aside) o.removeFromParent();
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    for (const [o, parent] of aside) parent.add(o);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const s = Math.min(1.95 / Math.max(size.x, size.z, 0.001), 1.5 / Math.max(size.y, 0.001));
    root.scale.setScalar(s);
    root.position.set(-c.x * s, -box.min.y * s + PLINTH_TOP, -c.z * s);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
      const solid = !mat.transparent && mat.blending === THREE.NormalBlending && mat.colorWrite && !m.userData.noShadow;
      m.castShadow = solid; m.receiveShadow = solid;
    });
    this.scene.add(root);
    this.piece = b;
    this.hallOf = [hallColour, hallNo];
    this.room.hall(hallColour, hallNo);
    this.glow.color.set(b.glow ?? 0x000000);
    this.home = { az: b.view?.[0] ?? 28, el: b.view?.[1] ?? 13, dist: 5.1 / (b.zoom ?? 1) };
    this.t0 = performance.now();
    this.dragged = false;
    if (this.controls) this.controls.autoRotate = !this.still && !this.room.walled;
    this.goHome();
  }

  private clear(): void {
    const p = this.piece;
    if (!p) return;
    this.scene.remove(p.root);
    p.root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats as THREE.Material[]) {
        for (const v of Object.values(mat)) if (v && (v as THREE.Texture).isTexture) (v as THREE.Texture).dispose();
        mat.dispose();
      }
    });
    this.piece = undefined;
  }

  private place(az: number, el: number, dist: number): void {
    this.eyeAt = this.eyeTo = undefined;
    this.camera.fov = FOV; this.camera.near = 0.05;
    this.camera.updateProjectionMatrix();
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
    const d = dist * this.room.reach * Math.max(1, 1.02 / this.camera.aspect), ty = this.room.targetY;
    this.camera.position.set(Math.sin(a) * Math.cos(e) * d, ty + Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d);
    this.camera.lookAt(0, ty, 0);
    const c = this.controls;
    if (c) {
      c.target.set(0, ty, 0);
      c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity;
      c.minPolarAngle = 0.2; c.maxPolarAngle = Math.PI / 2 - 0.03;
      c.minDistance = d * 0.4; c.maxDistance = d * 1.45;
      c.update();
    }
  }

  goHome(): void { this.place(this.home.az, this.home.el, this.home.dist); }
  /** Straight on and closer, to read the lit surface. */
  goFront(): void { if (this.controls) this.controls.autoRotate = false; this.place(0, 4, this.home.dist * 0.78); }
  /** Any angle, for checking a model from behind or above. */
  goTo(az: number, el: number, zoom = 1): void { if (this.controls) this.controls.autoRotate = false; this.place(az, el, this.home.dist / zoom); }

  /** Put the visitor's eye where the piece expects one. Dragging then moves the head a little, which is how depth shows on a flat screen. */
  goEye(): void {
    const eye = this.piece?.eye;
    if (!eye) return;
    const root = this.piece!.root;
    root.updateMatrixWorld(true);
    const at = root.localToWorld(new THREE.Vector3(...eye.at)), to = root.localToWorld(new THREE.Vector3(...eye.to));
    this.eyeAt = at; this.eyeTo = to; this.eyePlay = eye.play ?? 0.1; this.eyeT0 = performance.now();
    this.dragged = false;
    this.camera.fov = eye.fov ?? 38; this.camera.near = 0.004;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(at); this.camera.lookAt(to);
    const c = this.controls;
    if (c) {
      c.autoRotate = false;
      c.target.copy(to);
      const sph = new THREE.Spherical().setFromVector3(at.clone().sub(to));
      c.minDistance = sph.radius * 0.94; c.maxDistance = sph.radius * 1.04;
      c.minAzimuthAngle = sph.theta - this.eyePlay; c.maxAzimuthAngle = sph.theta + this.eyePlay;
      c.minPolarAngle = Math.max(0.02, sph.phi - this.eyePlay * 0.7); c.maxPolarAngle = Math.min(Math.PI - 0.02, sph.phi + this.eyePlay * 0.7);
      c.update();
    }
  }

  /** Turn or tilt by degrees, zoom by a factor. For keys and buttons. */
  nudge(dAz: number, dEl: number, zoom = 1): void {
    const c = this.controls;
    if (!c) return;
    c.autoRotate = false;
    this.dragged = true;
    const k = this.eyeAt ? 0.12 : 1;
    const off = this.camera.position.clone().sub(c.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta = THREE.MathUtils.clamp(sph.theta + THREE.MathUtils.degToRad(dAz * k), c.minAzimuthAngle, c.maxAzimuthAngle);
    sph.phi = THREE.MathUtils.clamp(sph.phi - THREE.MathUtils.degToRad(dEl * k), c.minPolarAngle, c.maxPolarAngle);
    sph.radius = THREE.MathUtils.clamp(sph.radius * zoom, c.minDistance, c.maxDistance);
    this.camera.position.copy(c.target).add(new THREE.Vector3().setFromSpherical(sph));
    c.update();
  }

  /** Full view hands every gesture to the stage. Inline, vertical swipes belong to the page. */
  setFree(free: boolean): void { this.canvas.style.touchAction = free ? 'none' : 'pan-y'; }

  setLights(on: boolean, instant = false): void {
    this.lightsTarget = on ? 1 : 0;
    if (instant) this.lights = this.lightsTarget;
  }

  /** Advance and draw one frame. `at` pins the piece's clock, for still pictures. */
  step(at?: number): void {
    const d = this.lightsTarget - this.lights;
    this.lights = Math.abs(d) < 0.004 ? this.lightsTarget : this.lights + d * 0.1;
    const L = this.lights;
    this.room.light(L, this.scene);
    this.room.seenFrom?.(this.camera);
    this.glow.intensity = this.piece?.glow ? (1 - L) * 9 * (this.room.glow?.gain ?? 1) : 0;
    (this.scene.background as THREE.Color).set(OUTSIDE).multiplyScalar(0.02 + 0.98 * L);
    if (this.eyeAt && this.eyeTo && !this.dragged && !this.still && at === undefined) {
      // until the visitor takes over, the head drifts from side to side so that near things slide across far ones
      const dir = this.eyeTo.clone().sub(this.eyeAt), reach = dir.length() * Math.sin(this.eyePlay) * 0.6;
      const side = dir.cross(UP).normalize();
      this.camera.position.copy(this.eyeAt).addScaledVector(side, Math.sin((performance.now() - this.eyeT0) / 1000 * 1.2) * reach);
      this.camera.lookAt(this.eyeTo);
    }
    this.piece?.update?.({ t: at ?? (performance.now() - this.t0) / 1000, lights: L, camera: this.camera });
    this.controls?.update();
    this.room.prepare?.(this.renderer, this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => { if (!this.running) return; this.raf = requestAnimationFrame(loop); this.step(); };
    loop();
  }
  stop(): void { this.running = false; cancelAnimationFrame(this.raf); }

  /** A still picture of what is on the plinth. */
  snapshot(): string {
    this.step(2.6); this.step(2.8);
    return this.canvas.toDataURL('image/webp', 0.86);
  }

  dispose(): void {
    this.stop();
    this.ro?.disconnect();
    this.controls?.dispose();
    this.clear();
    this.room.dispose?.();
    this.around?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}
