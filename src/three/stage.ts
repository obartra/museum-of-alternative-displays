import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Anaglyph } from './anaglyph';
import { THREE, type Built } from './kit';
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
  /** The piece's own time in seconds. It stands still while the stage is paused. */
  private clock = 0;
  private last = performance.now();
  private raf = 0;
  private running = false;
  /** Frames still owed while paused: nothing is drawn once the picture has stopped changing. */
  private owed = 3;
  private beat = 0;
  private home = { az: 28, el: 13, dist: 5.1 };
  private ro?: ResizeObserver;
  /** The room carried on past the frame: a small second picture for a canvas that lies behind the page. See beyond(). */
  private outer?: CanvasRenderingContext2D;
  private wide = new THREE.PerspectiveCamera();
  private outerBeat = 0;
  private dragged = false;
  private still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Motion that starts by itself can be stopped. A visitor who asked for less motion starts with it stopped. */
  private paused = this.still;
  private eyeAt?: THREE.Vector3;
  private eyeTo?: THREE.Vector3;
  private eyePlay = 0.1;
  private eyeT0 = 0;
  private viewId: string | null = null;
  private sway: { rate: number; reach: number; up?: number } | undefined;
  private walk: { period: number; round?: boolean; near?: number } | undefined;
  /** Set while the picture is drawn for red and cyan glasses. */
  private stereo?: Anaglyph;
  private drift = false;
  /** Where the visitor has put the camera, when the room has had to pull it in from there. */
  private free?: THREE.Vector3;
  /** Called the first time the visitor turns the piece. */
  onTouch?: () => void;
  /** Pixels of the picture to one of the page, and whether this is a phone or a tablet, where a costly piece gets fewer. */
  private ratio = 1;
  private sparing = false;

  constructor(private canvas: HTMLCanvasElement, interactive: boolean) {
    // the stencil buffer is what lets a reflection show only inside its pane, and a scene only through its lens
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, preserveDrawingBuffer: !interactive, powerPreference: 'high-performance' });
    this.ratio = interactive ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    this.sparing = interactive && matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(this.ratio);
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
    // the landscape arrives a moment after the room: a paused stage still has to draw it coming in
    void this.room.ready?.then(() => { this.owed = 70; });
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
  /** Whether the piece on the stand has a place to look from under this id. */
  hasView(id: string): boolean { return !!this.piece?.views?.[id]; }
  /** The id of the view that is on, or null for the ordinary turning view. */
  get inView(): string | null { return this.viewId; }
  /** The model on the stand, as it stands there: for handing to something that shows it elsewhere. */
  get pieceRoot(): THREE.Group | undefined { return this.piece?.root; }
  get isStereo(): boolean { return !!this.stereo; }
  /** Draw for red and cyan glasses, or go back to the plain picture. */
  setStereo(on: boolean): void {
    if (on && !this.stereo) this.stereo = new Anaglyph(this.renderer, !matchMedia('(pointer: coarse)').matches);
    if (!on) { this.stereo?.dispose(); this.stereo = undefined; }
    this.owed = 3;
  }
  get isPaused(): boolean { return this.paused; }
  setPaused(paused: boolean): void { this.paused = paused; this.owed = 3; }
  /** Have the shaders built off the main thread where the browser can, so the first frame does not stall the page. */
  async warm(): Promise<void> {
    try { await this.renderer.compileAsync(this.scene, this.camera); } catch { /* the first frame builds them instead */ }
  }
  /** Kept when the room has everything it shows. Still pictures wait for it. */
  get ready(): Promise<void> { return this.room.ready ?? Promise.resolve(); }
  settle(): void { this.room.settle?.(); }

  /** Put the camera back where the visitor left it, before working from its position. */
  private release(): void { if (this.free) { this.camera.position.copy(this.free); this.free = undefined; } }

  /** Keep the camera under the roof: past the room's headroom it slides in along its own line of sight. */
  private restrain(): void {
    const top = this.room.headroom, y0 = this.controls?.target.y ?? this.room.targetY;
    if (top === undefined || this.eyeAt || this.camera.position.y <= top) return;
    const centre = this.controls?.target ?? new THREE.Vector3(0, y0, 0);
    this.free = this.camera.position.clone();
    this.camera.position.sub(centre).multiplyScalar((top - y0) / (this.camera.position.y - y0)).add(centre);
  }

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
    this.release();
    // a new drawing buffer is costly: only ask for one when the size has changed
    const now = this.renderer.getSize(new THREE.Vector2());
    if (now.x !== W || now.y !== H) this.renderer.setSize(W, H, false);
    this.owed = 3;
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
    const ratio = this.sparing ? Math.max(1, this.ratio * (b.thrift ?? 1)) : this.ratio;
    if (this.renderer.getPixelRatio() !== ratio) { this.renderer.setPixelRatio(ratio); this.owed = 3; }
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
    // paused from the start, a piece is shown a few seconds into its cycle: at zero many have nothing lit yet
    this.clock = this.paused ? 2.6 : 0;
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
    this.eyeAt = this.eyeTo = undefined; this.free = undefined; this.viewId = null; this.owed = 3;
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

  /**
   * Look from one of the piece's own places. A person view holds the head nearly still and lets it drift a little,
   * which is how depth shows on a flat screen. A detail view lets the camera wander round the part.
   */
  goView(id: string, detail = false): void {
    const spot = this.piece?.views?.[id];
    if (!spot) return;
    this.free = undefined;
    const root = this.piece!.root;
    root.updateMatrixWorld(true);
    const at = spot.room ? new THREE.Vector3(...spot.at) : root.localToWorld(new THREE.Vector3(...spot.at));
    const to = root.localToWorld(new THREE.Vector3(...spot.to));
    this.eyeAt = at; this.eyeTo = to; this.eyePlay = spot.play ?? (detail ? 0.5 : 0.1); this.eyeT0 = this.clock;
    this.viewId = id; this.drift = !detail || !!spot.sway || !!spot.walk; this.sway = spot.sway; this.walk = spot.walk; this.owed = 3;
    this.dragged = false;
    this.camera.fov = spot.fov ?? (detail ? 32 : 38); this.camera.near = 0.004;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(at); this.camera.lookAt(to);
    const c = this.controls;
    if (c) {
      c.autoRotate = false;
      c.target.copy(to);
      const sph = new THREE.Spherical().setFromVector3(at.clone().sub(to));
      c.minDistance = sph.radius * (detail ? 0.6 : 0.94); c.maxDistance = sph.radius * (detail ? 1.5 : 1.04);
      c.minAzimuthAngle = sph.theta - this.eyePlay; c.maxAzimuthAngle = sph.theta + this.eyePlay;
      c.minPolarAngle = Math.max(0.02, sph.phi - this.eyePlay * 0.7); c.maxPolarAngle = Math.min(Math.PI - 0.02, sph.phi + this.eyePlay * 0.7);
      // a walk goes beyond where a visitor could turn the view: leave the way open for it
      if (spot.walk?.round) { c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity; }
      if (spot.walk?.near) c.minDistance = sph.radius * spot.walk.near * 0.9;
      c.update();
    }
  }

  /** Turn or tilt by degrees, zoom by a factor. For keys and buttons. */
  nudge(dAz: number, dEl: number, zoom = 1): void {
    const c = this.controls;
    if (!c) return;
    c.autoRotate = false;
    this.dragged = true;
    this.owed = 3;
    this.release();
    const k = this.eyeAt ? (this.drift ? 0.12 : 0.4) : 1;
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

  /**
   * Take over a press that began on the still picture, before the model was there to feel it. The controls are told
   * of it as of a press on the canvas, there where the pointer is now, and the drag goes on from that place.
   */
  grab(held: { pointerId: number; pointerType: string; clientX: number; clientY: number }): void {
    if (!this.controls) return;
    const c = this.canvas, doc = c.ownerDocument;
    // a finger that has left the glass since cannot be taken hold of: then there is no press to take over
    try { c.setPointerCapture(held.pointerId); } catch { return; }
    const at = (type: string, x: number, y: number) => {
      const e = new PointerEvent(type, { pointerId: held.pointerId, pointerType: held.pointerType, clientX: x, clientY: y, button: 0, buttons: type === 'pointerdown' ? 1 : 0, isPrimary: true, bubbles: true, cancelable: true });
      // the controls measure a finger from the top of the page, and a press made here does not know how far it is scrolled
      Object.defineProperties(e, { pageX: { value: x + window.scrollX }, pageY: { value: y + window.scrollY } });
      return e;
    };
    // A mouse always can be, even when its button came up where the page did not see it. The first time it then
    // moves with no button down, the drag is ended for it: the model must never be left following a free pointer.
    const watch = (m: PointerEvent) => {
      if (m.pointerId !== held.pointerId) return;
      if (m.type === 'pointermove' && (m.pointerType !== 'mouse' || m.buttons & 1)) return;
      for (const name of ['pointermove', 'pointerup', 'pointercancel']) doc.removeEventListener(name, watch as EventListener, true);
      if (m.type === 'pointermove') c.dispatchEvent(at('pointerup', m.clientX, m.clientY));
    };
    for (const name of ['pointermove', 'pointerup', 'pointercancel']) doc.addEventListener(name, watch as EventListener, true);
    c.dispatchEvent(at('pointerdown', held.clientX, held.clientY));
  }

  setLights(on: boolean, instant = false): void {
    this.lightsTarget = on ? 1 : 0;
    if (instant) this.lights = this.lightsTarget;
    this.owed = 3;
  }

  /**
   * Carry the room on past the frame. The canvas given lies behind the page, around the stage. Each frame it is
   * drawn the room as the same eye sees it through a wider lens, off its centre, whose middle is exactly the picture
   * in the frame: so the piece keeps its place and shape, and the hall goes on outside it. Pass nothing to stop.
   */
  beyond(canvas?: HTMLCanvasElement): void {
    this.outer = canvas?.getContext('2d') ?? undefined;
    this.owed = 3;
  }
  private drawBeyond(): void {
    const out = this.outer!, oc = out.canvas, box = this.canvas.getBoundingClientRect(), all = oc.getBoundingClientRect();
    if (box.width < 2 || all.width < 2 || !oc.isConnected) return;
    const cam = this.camera, wide = this.wide, near = cam.near;
    const top = near * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) / cam.zoom, right = top * cam.aspect;
    // how much of the near plane one pixel of the page covers: the frame fixes it, the outer canvas only adds pixels
    const perX = 2 * right / box.width, perY = 2 * top / box.height;
    cam.updateMatrixWorld();
    wide.position.copy(cam.position); wide.quaternion.copy(cam.quaternion); wide.near = near; wide.far = cam.far;
    wide.updateMatrixWorld();
    wide.projectionMatrix.makePerspective(-right - (box.left - all.left) * perX, right + (all.right - box.right) * perX, top + (box.top - all.top) * perY, -top - (all.bottom - box.bottom) * perY, near, cam.far);
    wide.projectionMatrixInverse.copy(wide.projectionMatrix).invert();
    // drawn small into a corner of the stage's own canvas, copied out, and then painted over by the frame itself:
    // one renderer, and the same light and tone as the picture in the frame
    const r = this.renderer, buf = r.getDrawingBufferSize(new THREE.Vector2()), pr = r.getPixelRatio();
    const w = Math.min(oc.width, buf.x), h = Math.min(oc.height, buf.y);
    r.setViewport(0, 0, w / pr, h / pr); r.setScissor(0, 0, w / pr, h / pr); r.setScissorTest(true);
    // only the room: the piece is in the frame, and out here, faint and out of focus, it would cost more than it
    // shows. The floor keeps the reflection it was given for the frame, and the shadows are not worked out again.
    const root = this.piece?.root, shown = root?.visible ?? false, auto = r.shadowMap.autoUpdate;
    if (root) root.visible = false;
    r.shadowMap.autoUpdate = false;
    r.render(this.scene, wide);
    r.shadowMap.autoUpdate = auto;
    if (root) root.visible = shown;
    out.drawImage(this.canvas, 0, buf.y - h, w, h, 0, 0, oc.width, oc.height);
    r.setScissorTest(false); r.setViewport(0, 0, buf.x / pr, buf.y / pr);
  }

  /** Advance and draw one frame. `at` pins the piece's clock, for still pictures. */
  step(at?: number): void {
    const now = performance.now(), live = at === undefined;
    if (live && !this.paused) this.clock += Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const d = this.lightsTarget - this.lights;
    this.lights = Math.abs(d) < 0.004 ? this.lightsTarget : this.lights + d * 0.1;
    const L = this.lights;
    const drifting = !!this.eyeAt && !!this.eyeTo && this.drift && !this.dragged && !this.paused && live;
    if (drifting) {
      // until the visitor takes over, the head drifts from side to side so that near things slide across far ones
      const w = this.walk, e = this.clock - this.eyeT0;
      if (w) {
        // a walk starts where the view starts: round the point at the same height, or up to it and back
        const off = this.eyeAt!.clone().sub(this.eyeTo!);
        if (w.round) off.applyAxisAngle(UP, (e / w.period) * Math.PI * 2);
        if (w.near) off.multiplyScalar(1 - (1 - w.near) * (0.5 - 0.5 * Math.cos((e / w.period) * Math.PI * 2)));
        this.camera.position.copy(this.eyeTo!).add(off);
        this.camera.lookAt(this.eyeTo!);
      }
      const dir = this.eyeTo!.clone().sub(this.eyeAt!), s = this.sway, reach = dir.length() * (s ? s.reach : Math.sin(this.eyePlay) * 0.6);
      const side = dir.clone().cross(UP).normalize(), lift = side.clone().cross(dir).normalize(), ph = e * (s ? s.rate : 1.2);
      if (!w) {
        this.camera.position.copy(this.eyeAt!).addScaledVector(side, Math.sin(ph) * reach);
        if (s?.up) this.camera.position.addScaledVector(lift, Math.sin(ph * 2) * reach * s.up);
        this.camera.lookAt(this.eyeTo!);
      }
    }
    this.release();
    const moved = this.controls?.update() ?? false;
    this.restrain();
    // paused, with the camera at rest and the light settled, there is nothing new to draw: spare the battery,
    // and look again a few times a second in case a texture has arrived since
    if (live && this.paused && !moved && d === 0 && --this.owed < 0 && ++this.beat % 20) return;
    this.room.light(L, this.scene);
    this.room.seenFrom?.(this.camera);
    this.glow.intensity = this.piece?.glow ? (1 - L) * 9 * (this.room.glow?.gain ?? 1) : 0;
    (this.scene.background as THREE.Color).set(OUTSIDE).multiplyScalar(0.02 + 0.98 * L);
    this.piece?.update?.({ t: at ?? this.clock, lights: L, camera: this.camera, view: this.viewId ?? undefined });
    if (this.stereo) {
      // whatever is being looked at sits on the glass of the screen: the room falls away behind it
      const focus = this.camera.position.distanceTo(this.controls?.target ?? new THREE.Vector3(0, this.room.targetY, 0));
      this.stereo.render(this.scene, this.camera, focus, (eye) => this.room.prepare?.(this.renderer, this.scene, eye));
      return;
    }
    // the room behind the page is drawn every other frame: it is out of focus, and nobody reads motion from it
    if (this.outer && live && ++this.outerBeat % 2 === 0) this.drawBeyond();
    this.room.prepare?.(this.renderer, this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now(); this.owed = 3;
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
    this.stereo?.dispose();
    this.ro?.disconnect();
    this.controls?.dispose();
    this.clear();
    this.room.dispose?.();
    this.around?.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}
