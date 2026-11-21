import { THREE } from '../kit';
import { OUTSIDE, TOP } from '../room';
import { buildHall, type Hall, type Sign } from './hall';
import * as plan from './plan';
import { Stands } from './stands';
import { landing } from './aim';
import { enterVR, type VR } from './vr';

/**
 * The hall and a visitor in it. One renderer, one loop, and a visitor who walks, turns, looks about and can be
 * carried quickly to any piece. Everything about the page round the picture is left to whoever opens it.
 */
export interface Where { hall: number; piece?: string }
export interface GalleryOptions {
  /** Day or night to begin with. */
  lights: boolean;
  /** Piece to begin in front of. Without one, the door. */
  start?: string;
  /** A phone or a small tablet: fewer models, no mirror in the floor. */
  lite: boolean;
  /** The visitor asked for less motion: every glide is a cut. */
  calm: boolean;
  /** Draw at full sharpness whatever it costs, for making pictures of the hall. */
  fixed: boolean;
  signs: Sign[];
  names: Record<string, string>;
  display: string;
  /** The visitor is somewhere new: another hall, or in front of another piece, or of none. */
  onWhere: (w: Where) => void;
  /** Enter was pressed in front of a piece. */
  onOpen: (id: string) => void;
  /** Escape was pressed: the keyboard should leave the picture. */
  onRelease: () => void;
  /** The first time the visitor moves or looks. */
  onTouch: () => void;
}

const WALK = 1.6, RUN = 4.3, TURN = 1.25;
const wrap = (a: number) => a - Math.round(a / (2 * Math.PI)) * 2 * Math.PI;
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const KEYS: Record<string, [number, number]> = { ArrowUp: [1, 0], w: [1, 0], ArrowDown: [-1, 0], s: [-1, 0], ArrowLeft: [0, 1], a: [0, 1], ArrowRight: [0, -1], d: [0, -1] };

interface Glide { pts: [number, number][]; at: number[]; len: number; t: number; T: number; yaw0: number; yaw1: number; pitch0: number; pitch1: number }

export class Gallery {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  /** What moves when the visitor moves. Its origin is on the floor, under their feet. */
  readonly rig = new THREE.Group();
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 900);
  /** The eye as the models are told of it: a camera with no parent, so its position is its place in the hall. */
  private witness = new THREE.PerspectiveCamera();
  readonly hall: Hall;
  readonly stands: Stands;
  private pmrem: THREE.PMREMGenerator;
  private around: THREE.WebGLRenderTarget;
  private ro: ResizeObserver;

  // the visitor
  x = plan.DOOR.x; z = plan.DOOR.z; yaw = plan.DOOR.yaw; pitch = 0;
  private speed = 0;
  private spin = 0;
  private keys = new Set<string>();
  private held = { go: 0, turn: 0 };
  /** Metres still to walk for a turn of the wheel. */
  private coast = 0;
  private glide?: Glide;
  /** How far back from the middle of a block to stand, for this shape of window. */
  private back = 3.3;
  private here: Where = { hall: 0 };
  /** The piece a glide is heading for, by its number in the collection. */
  private aimed = -1;
  private touched = false;

  private lights: number;
  private lightsTarget: number;
  private clock = 0;
  private paused: boolean;
  private last = performance.now();
  private running = false;
  /** Frames still owed when nothing is moving: after that, nothing is drawn until something changes. */
  private owed = 4;
  private beat = 0;
  private free = false;
  private drag?: { id: number; x: number; y: number; x0: number; y0: number; t0: number; moved: boolean };
  /** How much smaller than asked the picture is drawn, when the device cannot keep up. */
  private thrift = 1;
  private slow = 0;
  private quick = 0;
  private raised = 0;
  private drew = false;
  private frames = 0;
  private eye = new THREE.Vector3();
  private aim = new THREE.Raycaster();
  vr?: VR;
  /** Milliseconds the last picture took, for those who measure. */
  cost = 0;

  constructor(readonly canvas: HTMLCanvasElement, private o: GalleryOptions) {
    // the stencil buffer is what lets a reflection show only inside its pane, and a scene only through its lens
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.lights = this.lightsTarget = o.lights ? 1 : 0;
    this.paused = o.calm;

    this.scene.background = new THREE.Color(OUTSIDE);
    this.hall = buildHall({ lite: o.lite, signs: o.signs, display: o.display });
    this.scene.add(this.hall.group);
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.around = this.pmrem.fromScene(this.hall.surroundings, 0.035);
    this.scene.environment = this.around.texture;

    this.rig.add(this.camera);
    this.scene.add(this.rig);
    // a laptop with little memory runs fewer models than a desk machine
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    this.stands = new Stands(this.renderer, this.scene, this.witness, { lite: o.lite, cap: o.lite ? 3 : memory <= 4 ? 6 : 8, names: o.names, signs: o.signs, display: o.display, sunward: this.hall.sunward });
    this.scene.add(this.stands.group, this.stands.models);

    const start = o.start ? plan.placeOf(o.start) : undefined;
    this.resize();
    if (start) this.put(plan.standing(start, this.back), this.tilt());
    this.pose();
    this.locate();

    canvas.style.touchAction = 'pan-y';
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onCancel);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('keydown', this.onKey);
    canvas.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('blur', this.onBlur);
    canvas.addEventListener('webglcontextlost', this.onLost);
    this.ro = new ResizeObserver(() => this.resize());
    if (canvas.parentElement) this.ro.observe(canvas.parentElement);
    // the land outside arrives a moment after the walls: draw it coming in
    void this.hall.ready.then(() => { this.owed = 70; });
  }

  // ---------- where the visitor is ----------

  /** How far to look up to take in a piece from where one stands to see it. */
  private tilt(): number { return Math.atan2(TOP + 0.62 - (plan.FLOOR + plan.EYE), this.back); }

  private put(to: { x: number; z: number; yaw: number }, pitch = 0): void {
    this.x = to.x; this.z = to.z; this.yaw = to.yaw; this.pitch = pitch;
    this.glide = undefined; this.speed = this.spin = this.coast = 0;
  }

  /** Set the rig and the camera from the visitor's place and gaze. In a headset the head is the headset's to move. */
  private pose(): void {
    if (this.vr?.active) return;
    this.rig.position.set(this.x, plan.FLOOR, this.z);
    this.rig.rotation.set(0, this.yaw, 0);
    this.camera.position.set(0, plan.EYE, 0);
    this.camera.rotation.set(this.pitch, 0, 0);
  }

  /** Work out which hall the visitor is in and which piece, if any, they are standing in front of. */
  private locate(): void {
    const hall = plan.bayAt(this.x).hall, fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    let piece: plan.Place | undefined, best = 0;
    for (const p of plan.places) {
      if (p.hall !== hall && Math.abs(p.x - this.x) > 3) continue;
      const dx = p.x - this.x, dz = p.z - this.z, d = Math.hypot(dx, dz);
      // in front of it means on its aisle side, near enough, and looking its way. Once there, a little more is forgiven
      const held = this.here.piece === p.id ? 1 : 0;
      if (d < 1.4 || d > 5.6 + held * 0.6 || Math.abs(dx) > 1.7 + held * 0.5 || dz * p.side < 1.3) continue;
      const facing = (dx * fx + dz * fz) / d;
      if (facing < 0.62 - held * 0.2) continue;
      const score = facing - d * 0.02 + held * 0.1;
      if (score > best) { best = score; piece = p; }
    }
    if (hall !== this.here.hall || piece?.id !== this.here.piece) { this.here = { hall, piece: piece?.id }; this.o.onWhere(this.here); }
  }

  get where(): Where { return this.here; }

  // ---------- going somewhere ----------

  /** Carry the visitor to a place: a quick eased glide round whatever is in the way, or a cut. */
  goTo(to: { x: number; z: number; yaw: number }, pitch = 0, cut = false): void {
    this.owed = 4; this.aimed = -1;
    if (this.vr?.active) { this.vr.land(to.x, to.z, to.yaw); return; }
    const pts = soften(plan.route(this.x, this.z, to.x, to.z)), at = [0];
    for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = at[at.length - 1], turn = wrap(to.yaw - this.yaw);
    if (cut || this.o.calm || (len < 0.02 && Math.abs(turn) < 0.01 && Math.abs(pitch - this.pitch) < 0.01)) { this.put(to, pitch); this.pose(); this.locate(); return; }
    this.speed = this.spin = this.coast = 0;
    this.glide = { pts, at, len, t: 0, T: Math.min(2.6, Math.max(0.55, 0.5 + len * 0.085, Math.abs(turn) * 0.45)), yaw0: this.yaw, yaw1: this.yaw + turn, pitch0: this.pitch, pitch1: pitch };
  }

  goPiece(id: string, cut = false): void {
    const p = plan.placeOf(id);
    if (p) { this.goTo(plan.standing(p, this.back), this.tilt(), cut); this.aimed = p.no; }
  }
  goHall(n: number, cut = false): void { if (plan.bayOf(n)) this.goTo(plan.arrival(n), 0, cut); }
  /** The next piece of the collection, or the one before. From nowhere in particular, the nearest. */
  next(by: 1 | -1): void {
    let no: number;
    if (this.glide && this.aimed >= 0) no = this.aimed + by;                      // on the way to a piece already: go on from that one
    else if (this.here.piece) no = plan.placeOf(this.here.piece)!.no + by;
    else {
      const far = (p: plan.Place) => { const at = plan.standing(p, this.back); return Math.hypot(at.x - this.x, at.z - this.z); };
      no = plan.places.reduce((a, p) => (far(p) < far(a) ? p : a)).no;
    }
    this.goPiece(plan.places[Math.min(plan.places.length - 1, Math.max(0, no))].id);
  }

  /** Buttons held down on the page: forward or back, left or right, each from -1 to 1. */
  hold(go: number, turn: number): void { this.held.go = go; this.held.turn = turn; this.owed = 4; if (go || turn) this.stir(); }
  /** One press of such a button from a keyboard: a step, or a part of a turn. */
  nudge(go: number, turn: number): void {
    this.stir();
    const yaw = this.yaw + turn * (Math.PI / 6), [x, z] = plan.step(this.x, this.z, -Math.sin(this.yaw) * go * 1.5, -Math.cos(this.yaw) * go * 1.5);
    this.goTo({ x, z, yaw }, this.pitch);
  }

  private stir(): void { if (!this.touched) { this.touched = true; this.o.onTouch(); } }

  // ---------- keys and pointers ----------

  private onKey = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (KEYS[k] || k === 'Shift') { this.keys.add(k); this.owed = 4; if (KEYS[k]) { e.preventDefault(); this.stir(); } return; }
    if (e.repeat) { if (k === 'PageDown' || k === 'PageUp') e.preventDefault(); return; }
    if (k === 'n' || k === 'PageDown') this.next(1);
    else if (k === 'p' || k === 'PageUp') this.next(-1);
    else if (k >= '1' && k <= String(plan.bays.length)) this.goHall(Number(k));
    else if (k === 'Enter') { if (this.here.piece) this.o.onOpen(this.here.piece); }
    else if (k === 'Escape') { this.keys.clear(); this.o.onRelease(); }
    else return;
    e.preventDefault(); this.stir();
  };
  private onKeyUp = (e: KeyboardEvent): void => { this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); };
  private onBlur = (): void => { this.keys.clear(); };
  private onLost = (e: Event): void => { e.preventDefault(); this.stop(); };

  private onDown = (e: PointerEvent): void => {
    if (this.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false };
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* the pointer has already gone */ }
  };
  private onMove = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
    if (!d.moved) { d.moved = true; this.glide = undefined; this.stir(); }
    // the hall is dragged like a picture: what was under the pointer stays under it
    const per = THREE.MathUtils.degToRad(this.camera.fov) / Math.max(1, this.canvas.clientHeight);
    this.yaw = wrap(this.yaw + (e.clientX - d.x) * per);
    // inline, an up and down swipe belongs to the page
    if (this.free || e.pointerType === 'mouse') this.pitch = THREE.MathUtils.clamp(this.pitch + (e.clientY - d.y) * per, -0.9, 0.9);
    d.x = e.clientX; d.y = e.clientY; this.owed = 4;
  };
  private onUp = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    this.drag = undefined;
    if (d.moved || performance.now() - d.t0 > 600) return;
    // a click or a tap: go to the piece under it, or walk to that place on the floor
    const r = this.canvas.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    this.aim.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2), this.camera);
    const hit = landing(this.aim.ray.origin, this.aim.ray.direction);
    this.stir();
    if (hit.piece) this.goPiece(hit.piece.id);
    else if (hit.floor) {
      const [x, z] = hit.floor, far = Math.hypot(x - this.x, z - this.z);
      // arrive looking the way one came, unless it was only a step
      this.goTo({ x, z, yaw: far > 1.5 ? Math.atan2(this.x - x, this.z - z) : this.yaw }, 0);
    }
  };
  private onCancel = (e: PointerEvent): void => { if (this.drag?.id === e.pointerId) this.drag = undefined; };
  /** In full view the wheel walks: forward as it turns away. Inline, the wheel belongs to the page. */
  private onWheel = (e: WheelEvent): void => {
    if (!this.free || e.ctrlKey || this.vr?.active) return;
    e.preventDefault();
    const lines = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * 600 : e.deltaY;
    this.coast = Math.max(-7, Math.min(7, this.coast - lines * 0.006));
    this.glide = undefined; this.owed = 4; this.stir();
  };

  // ---------- the loop ----------

  /** Move the visitor on by `dt` seconds. Says whether they moved. */
  advance(dt: number): boolean {
    let go = this.held.go, turn = this.held.turn;
    for (const k of this.keys) if (KEYS[k]) { go += KEYS[k][0]; turn += KEYS[k][1]; }
    go = Math.max(-1, Math.min(1, go)); turn = Math.max(-1, Math.min(1, turn));
    const fast = this.keys.has('Shift');
    if (this.vr?.active) {
      // in a headset the head is where the visitor is: the page behind it is told the same
      const moved = this.vr.update(dt), at = this.vr.head();
      this.x = at.x; this.z = at.z; this.yaw = at.yaw;
      this.locate();
      return moved;
    }
    if ((go || turn) && this.glide) this.glide = undefined;
    const g = this.glide, x0 = this.x, z0 = this.z, yaw0 = this.yaw, pitch0 = this.pitch;
    if (g) {
      g.t = Math.min(g.T, g.t + dt);
      const k = ease(g.t / g.T), s = k * g.len;
      let i = 1;
      while (i < g.at.length - 1 && g.at[i] < s) i++;
      const span = g.at[i] - g.at[i - 1], f = span > 0 ? (s - g.at[i - 1]) / span : 1;
      this.x = g.pts[i - 1][0] + (g.pts[i][0] - g.pts[i - 1][0]) * f; this.z = g.pts[i - 1][1] + (g.pts[i][1] - g.pts[i - 1][1]) * f;
      this.yaw = g.yaw0 + (g.yaw1 - g.yaw0) * k; this.pitch = g.pitch0 + (g.pitch1 - g.pitch0) * k;
      if (g.t >= g.T) { this.glide = undefined; this.yaw = wrap(this.yaw); }
    } else {
      // walking is unhurried, and neither starts nor stops with a jolt
      this.speed += (go * (fast ? RUN : WALK) * (go < 0 ? 0.7 : 1) - this.speed) * (1 - Math.exp(-dt * 9));
      this.spin += (turn * TURN * (fast ? 1.5 : 1) - this.spin) * (1 - Math.exp(-dt * 11));
      if (Math.abs(this.speed) < 0.004 && !go) this.speed = 0;
      if (Math.abs(this.spin) < 0.004 && !turn) this.spin = 0;
      this.yaw = wrap(this.yaw + this.spin * dt);
      // what the wheel asked for is walked off quickly at first and then more slowly
      const roll = this.coast * (1 - Math.exp(-dt * 6));
      this.coast = Math.abs(this.coast - roll) < 0.004 ? 0 : this.coast - roll;
      const by = this.speed * dt + roll;
      if (by) [this.x, this.z] = plan.step(this.x, this.z, -Math.sin(this.yaw) * by, -Math.cos(this.yaw) * by);
      // walking levels the gaze again, slowly
      if (by && !this.drag) this.pitch += (0 - this.pitch) * (1 - Math.exp(-dt * 1.2));
    }
    const moved = this.x !== x0 || this.z !== z0 || this.yaw !== yaw0 || this.pitch !== pitch0;
    if (moved) { this.pose(); this.locate(); }
    return moved;
  }

  private frame = (): void => {
    const now = performance.now(), gap = now - this.last;
    this.last = now;
    if (!this.o.fixed && !this.vr?.active && this.drew) this.economise(gap);
    this.drew = false;
    this.step(Math.min(0.1, gap / 1000));
  };

  /** One turn of the loop: move, then draw if anything has changed. */
  step(dt: number, force = false): void {
    const moved = this.advance(dt);
    if (!this.paused) this.clock += dt;
    const d = this.lightsTarget - this.lights;
    this.lights = Math.abs(d) < 0.004 ? this.lightsTarget : this.lights + d * (1 - Math.exp(-dt * 6.3));
    const xr = !!this.vr?.active;
    this.camera.updateMatrixWorld();
    this.eye.setFromMatrixPosition(this.camera.matrixWorld);
    this.witness.position.copy(this.eye); this.witness.quaternion.setFromRotationMatrix(this.camera.matrixWorld); this.witness.updateMatrixWorld();
    const focus = this.glide ? { x: this.glide.pts[this.glide.pts.length - 1][0], z: this.glide.pts[this.glide.pts.length - 1][1] } : { x: this.eye.x, z: this.eye.z };
    const busy = this.stands.update(dt, { eye: this.eye, focus, L: this.lights, day: this.lightsTarget > 0.5, clock: this.clock, camera: this.witness });
    const alive = !this.paused && this.stands.lively;
    if (moved || busy || d !== 0 || this.stands.fresh || this.glide || xr) this.owed = 4;
    // at rest, with nothing running and the light settled, there is nothing new to draw: spare the battery,
    // and look again a few times a second in case a picture has arrived since
    if (!force && !alive && --this.owed < 0 && ++this.beat % 20) return;
    this.stands.fresh = false;
    this.draw(alive);
  }

  private draw(alive: boolean): void {
    const t0 = performance.now(), L = this.lights, xr = !!this.vr?.active;
    this.hall.light(L, this.scene);
    this.hall.follow(this.eye);
    (this.scene.background as THREE.Color).set(OUTSIDE).multiplyScalar(0.02 + 0.98 * L);
    // shadows: when something has come or gone, and now and then for whatever is moving on a block
    const every = this.o.lite || xr ? 9 : 2;
    if (this.stands.stale || (alive && ++this.frames % every === 0)) { this.renderer.shadowMap.needsUpdate = true; this.stands.stale = false; }
    if (!xr) this.hall.prepare?.(this.renderer, this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.cost = performance.now() - t0; this.drew = true;
  }

  /**
   * Pictures that come too slowly are drawn smaller. `gap` is the time since the frame before, in milliseconds.
   * It is tried larger again once, in case the slowness was a model being made, and never after that.
   */
  private economise(gap: number): void {
    this.slow = gap > 36 ? this.slow + 1 : 0; this.quick = gap < 19 ? this.quick + 1 : 0;
    if (this.slow > 24 && this.thrift > 0.5) { this.thrift = Math.max(0.5, this.thrift * 0.82); this.slow = 0; this.quick = 0; this.resize(); }
    else if (this.quick > 600 && this.thrift < 1 && this.raised < 1) { this.raised++; this.thrift = Math.min(1, this.thrift / 0.82); this.quick = 0; this.resize(); }
  }

  resize(): void {
    if (this.vr?.active) return;
    const el = this.canvas.parentElement ?? this.canvas;
    const W = Math.max(1, el.clientWidth), H = Math.max(1, el.clientHeight), aspect = W / H;
    const ratio = Math.min(window.devicePixelRatio || 1, this.o.lite ? 1.5 : 2) * this.thrift;
    const now = this.renderer.getSize(new THREE.Vector2());
    if (now.x !== W || now.y !== H || this.renderer.getPixelRatio() !== ratio) { this.renderer.setPixelRatio(ratio); this.renderer.setSize(W, H, false); }
    // a tall window is a narrow view: widen the lens, and stand further back from a piece
    // and a very wide window is not a wider lens, which would stretch what is at its edges: it shows less above and below
    const fov = Math.min(THREE.MathUtils.clamp(2 * THREE.MathUtils.radToDeg(Math.atan(0.5 / aspect)), 50, 74), 2 * THREE.MathUtils.radToDeg(Math.atan(1.11 / aspect)));
    this.camera.fov = fov; this.camera.aspect = aspect; this.camera.updateProjectionMatrix();
    const was = this.back;
    // far enough for the piece to fit across the window, and for the name plate on its block to be in the picture under it
    const half = THREE.MathUtils.degToRad(fov / 2);
    this.back = THREE.MathUtils.clamp(Math.max(0.4 + 1.25 / (Math.tan(half) * aspect), 1.1 + 0.85 / Math.tan(Math.max(0.1, half - 0.05))), 3.3, 4.9);
    // someone standing in front of a piece stays in front of it
    const p = this.here.piece ? plan.placeOf(this.here.piece) : undefined;
    if (p && !this.glide && Math.abs(was - this.back) > 0.05 && Math.abs(this.x - p.x) < 0.3 && Math.abs(Math.abs(this.z - p.z) - was) < 0.3) { this.put(plan.standing(p, this.back), this.tilt()); this.pose(); }
    this.owed = 4;
  }

  /** Full view hands every gesture to the hall. Inline, vertical swipes belong to the page. */
  setFree(free: boolean): void { this.free = free; this.canvas.style.touchAction = free ? 'none' : 'pan-y'; }
  setLights(on: boolean, instant = false): void { this.lightsTarget = on ? 1 : 0; if (instant) this.lights = this.lightsTarget; this.owed = 4; }
  get isPaused(): boolean { return this.paused; }
  setPaused(paused: boolean): void { this.paused = paused; this.owed = 4; }

  start(): void {
    if (this.running) return;
    this.running = true; this.last = performance.now(); this.owed = 4;
    this.renderer.setAnimationLoop(this.frame);
  }
  stop(): void {
    // a headset goes on drawing whatever the page behind it is doing
    if (this.vr?.active) return;
    this.running = false; this.keys.clear();
    this.renderer.setAnimationLoop(null);
  }

  /** Put the visitor in a headset, standing where they stand now. Resolves when they are in. */
  async enterVR(onEnd: () => void): Promise<void> {
    if (this.vr?.active) return;
    this.vr = await enterVR(this, () => {
      // back at the screen, where the headset left off
      const at = this.vr!.head();
      this.vr = undefined;
      this.hall.reflect(true);
      this.put({ x: at.x, z: at.z, yaw: at.yaw }, 0); [this.x, this.z] = plan.free(this.x, this.z);
      this.pose(); this.resize(); this.stands.stale = true;
      onEnd();
    });
    this.hall.reflect(false);
    this.stands.stale = true;
    if (!this.running) this.start();
  }

  dispose(): void {
    this.vr?.end();
    this.running = false;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onDown); c.removeEventListener('pointermove', this.onMove); c.removeEventListener('pointerup', this.onUp); c.removeEventListener('pointercancel', this.onCancel);
    c.removeEventListener('wheel', this.onWheel);
    c.removeEventListener('keydown', this.onKey); c.removeEventListener('keyup', this.onKeyUp); c.removeEventListener('blur', this.onBlur); c.removeEventListener('webglcontextlost', this.onLost);
    this.stands.dispose();
    this.hall.dispose();
    this.around.dispose();
    this.pmrem.dispose();
    this.renderer.dispose();
  }
}

/** Round the corners of a way, so that a glide swings through them and does not jerk. */
function soften(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts;
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i], [cx, cz] = pts[i + 1];
    const la = Math.hypot(bx - ax, bz - az), lc = Math.hypot(cx - bx, cz - bz), r = Math.min(0.6, la / 2, lc / 2);
    if (r < 0.05) { out.push(pts[i]); continue; }
    const p: [number, number] = [bx + ((ax - bx) / la) * r, bz + ((az - bz) / la) * r], q: [number, number] = [bx + ((cx - bx) / lc) * r, bz + ((cz - bz) / lc) * r];
    for (let k = 0; k <= 5; k++) { const t = k / 5, u = 1 - t; out.push([u * u * p[0] + 2 * u * t * bx + t * t * q[0], u * u * p[1] + 2 * u * t * bz + t * t * q[1]]); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
