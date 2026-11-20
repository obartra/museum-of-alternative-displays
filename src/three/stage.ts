import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { THREE, type Built } from './kit';

const PLINTH_TOP = 0.22;
const TARGET_Y = PLINTH_TOP + 0.54;
const WASH = '#e4e5df';

/**
 * One plinth in one hall: a steel turntable in front of a two-tone wall.
 * The hall lights are real lights. Switch them off and only what emits stays visible.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  private scene = new THREE.Scene();
  private controls?: OrbitControls;
  private hemi = new THREE.HemisphereLight(0xffffff, 0x8d8f89, 0.6);
  private key = new THREE.DirectionalLight(0xfff3e2, 2.4);
  private fill = new THREE.DirectionalLight(0xdfe8ff, 0.55);
  private glow = new THREE.PointLight(0xffffff, 0, 7, 1.6);
  private wallCanvas = document.createElement('canvas');
  private wallTex: THREE.CanvasTexture;
  private piece?: Built;
  private lights = 1;
  private lightsTarget = 1;
  private t0 = performance.now();
  private raf = 0;
  private running = false;
  private home = { az: 28, el: 13, dist: 5.1 };
  private ro?: ResizeObserver;
  private dragged = false;
  /** Called the first time the visitor turns the piece. */
  onTouch?: () => void;

  constructor(private canvas: HTMLCanvasElement, interactive: boolean) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !interactive, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(interactive ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // the hall: a drum of wall with a painted dado, and a terrazzo floor
    this.wallCanvas.width = 4; this.wallCanvas.height = 512;
    this.wallTex = new THREE.CanvasTexture(this.wallCanvas);
    this.wallTex.colorSpace = THREE.SRGBColorSpace;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 10, 72, 1, true), new THREE.MeshStandardMaterial({ map: this.wallTex, side: THREE.BackSide, roughness: 0.95 }));
    wall.position.y = 5;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 72), new THREE.MeshStandardMaterial({ color: 0xc4c6be, roughness: 0.82 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.16, PLINTH_TOP, 72), new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: 0.42, metalness: 0.6 }));
    plinth.position.y = PLINTH_TOP / 2;
    plinth.castShadow = plinth.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.012, 8, 96), new THREE.MeshStandardMaterial({ color: 0xb08d4a, roughness: 0.3, metalness: 0.9 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = PLINTH_TOP;
    this.scene.add(wall, floor, plinth, ring);
    this.paintWall('#586067');

    this.key.position.set(3.4, 6, 4);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(1024, 1024);
    const sc = this.key.shadow.camera;
    sc.left = -2.4; sc.right = 2.4; sc.top = 2.6; sc.bottom = -2.2; sc.near = 1; sc.far = 16;
    this.key.shadow.bias = -0.0006; this.key.shadow.normalBias = 0.025;
    this.fill.position.set(-4.5, 2.6, 2.5);
    this.glow.position.set(0, 1.1, 0.5);
    this.scene.add(this.hemi, this.key, this.fill, this.glow);
    this.scene.background = new THREE.Color(WASH);

    if (interactive) {
      const c = new OrbitControls(this.camera, canvas);
      c.enablePan = false; c.enableDamping = true; c.dampingFactor = 0.08;
      c.minPolarAngle = 0.2; c.maxPolarAngle = Math.PI / 2 - 0.03;
      c.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
      c.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      c.autoRotateSpeed = 0.7;
      c.target.set(0, TARGET_Y, 0);
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

  private paintWall(hall: string): void {
    const g = this.wallCanvas.getContext('2d')!;
    // whitewash, a little greyer towards the roof, over a painted dado
    const grad = g.createLinearGradient(0, 0, 0, 470);
    grad.addColorStop(0, '#b9bbb4'); grad.addColorStop(0.55, '#d6d8d1'); grad.addColorStop(1, WASH);
    g.fillStyle = grad; g.fillRect(0, 0, 4, 512);
    // kept low, so the colour sits behind the plinth and the piece stands against whitewash
    g.fillStyle = hall; g.fillRect(0, 470, 4, 42);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 468, 4, 3);
    this.wallTex.needsUpdate = true;
  }

  resize(w?: number, h?: number): void {
    const el = this.canvas.parentElement ?? this.canvas;
    const W = w ?? Math.max(1, el.clientWidth), H = h ?? Math.max(1, el.clientHeight);
    this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
  }

  /** Put a piece on the plinth, scaled to fit, in front of its hall colour. */
  setPiece(b: Built, hallColour: string): void {
    this.clear();
    const root = b.root;
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const s = Math.min(1.95 / Math.max(size.x, size.z, 0.001), 1.5 / Math.max(size.y, 0.001));
    root.scale.setScalar(s);
    root.position.set(-c.x * s, -box.min.y * s + PLINTH_TOP, -c.z * s);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.Material;
      const solid = !mat.transparent && mat.blending === THREE.NormalBlending;
      m.castShadow = solid; m.receiveShadow = solid;
    });
    this.scene.add(root);
    this.piece = b;
    this.paintWall(hallColour);
    this.glow.color.set(b.glow ?? 0x000000);
    this.home = { az: b.view?.[0] ?? 28, el: b.view?.[1] ?? 13, dist: 5.1 / (b.zoom ?? 1) };
    this.t0 = performance.now();
    this.dragged = false;
    if (this.controls) this.controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
    const d = dist * Math.max(1, 1.02 / this.camera.aspect);
    this.camera.position.set(Math.sin(a) * Math.cos(e) * d, TARGET_Y + Math.sin(e) * d, Math.cos(a) * Math.cos(e) * d);
    this.camera.lookAt(0, TARGET_Y, 0);
    if (this.controls) {
      this.controls.minDistance = d * 0.4; this.controls.maxDistance = d * 1.45;
      this.controls.update();
    }
  }

  goHome(): void { this.place(this.home.az, this.home.el, this.home.dist); }
  /** Straight on and closer, to read the lit surface. */
  goFront(): void { if (this.controls) this.controls.autoRotate = false; this.place(0, 4, this.home.dist * 0.78); }

  /** Turn or tilt by degrees, zoom by a factor. For keys and buttons. */
  nudge(dAz: number, dEl: number, zoom = 1): void {
    const c = this.controls;
    if (!c) return;
    c.autoRotate = false;
    const off = this.camera.position.clone().sub(c.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta += THREE.MathUtils.degToRad(dAz);
    sph.phi = THREE.MathUtils.clamp(sph.phi - THREE.MathUtils.degToRad(dEl), c.minPolarAngle, c.maxPolarAngle);
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
    this.hemi.intensity = 0.025 + 0.6 * L;
    this.key.intensity = 2.4 * L;
    this.fill.intensity = 0.55 * L;
    this.scene.environmentIntensity = 0.035 + 0.5 * L;
    this.glow.intensity = this.piece?.glow ? (1 - L) * 4.5 : 0;
    (this.scene.background as THREE.Color).set(WASH).multiplyScalar(0.02 + 0.98 * L);
    this.piece?.update?.({ t: at ?? (performance.now() - this.t0) / 1000, lights: L, camera: this.camera });
    this.controls?.update();
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
    this.renderer.dispose();
  }
}
