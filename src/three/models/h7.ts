import { G, M, Swarm, beam, halo, opening, portal, screen, THREE, type Built, type Env, type P2, type V3 } from '../kit';
import { lens, post, screws, vents } from '../parts';
import { bigTime, now } from '../../sims/draw';

/** Where the visitor's eye is, as seen from the piece: azimuth and elevation in radians. */
function gaze(root: THREE.Object3D, env: Env, centreY = 0.9): [number, number] {
  const p = root.worldToLocal(env.camera.position.clone());
  p.y -= centreY;
  return [Math.atan2(p.x, p.z), Math.atan2(p.y, Math.hypot(p.x, p.z))];
}

/** A small scene with depth, drawn for an eye that has moved sideways by `dx` and up by `dy`. Far things move least. */
function depthScene(c: CanvasRenderingContext2D, W: number, H: number, dx: number, dy: number, ink: string, mono = false): void {
  const layers: [number, (x: number, y: number) => void][] = [
    [-0.55, (x, y) => { c.strokeStyle = mono ? ink : '#6f8cff'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x, y, 60 + i * 34, 0, 7); c.stroke(); } }],
    [-0.2, (x, y) => { c.strokeStyle = mono ? ink : '#ffd166'; c.lineWidth = 5; c.strokeRect(x - 70, y - 70, 140, 140); c.beginPath(); c.moveTo(x - 70, y - 70); c.lineTo(x + 70, y + 70); c.moveTo(x + 70, y - 70); c.lineTo(x - 70, y + 70); c.stroke(); }],
    [0.3, (x, y) => { c.fillStyle = mono ? ink : '#ff5d5d'; c.beginPath(); c.arc(x - 60, y + 30, 26, 0, 7); c.fill(); c.beginPath(); c.arc(x + 74, y - 44, 16, 0, 7); c.fill(); }],
  ];
  for (const [z, draw] of layers) draw(W / 2 + dx * z * W * 0.55, H / 2 - dy * z * H * 0.55);
}

// ---------- the view on the stereo card: the works, as cut-out layers at five distances ----------

/** How many times further than the card each layer lies. */
const DEPTH = [7, 3.2, 2.0, 1.55, 1.2];
const LAYER = 640, FRAME = 512, EDGE = (LAYER - FRAME) / 2;

function stereoLayers(): HTMLCanvasElement[] {
  const ink = ['#efe3c8', '#bfa27c', '#7a563c', '#553726', '#2c1b12'];
  return DEPTH.map((_, k) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = LAYER;
    const c = cv.getContext('2d')!;
    c.translate(EDGE, EDGE);
    if (k === 0) { // sky and sun
      const g = c.createLinearGradient(0, -EDGE, 0, FRAME); g.addColorStop(0, '#cdbb94'); g.addColorStop(1, '#f1e6cd');
      c.fillStyle = g; c.fillRect(-EDGE, -EDGE, LAYER, LAYER);
      c.fillStyle = '#fbf5e4'; c.beginPath(); c.arc(372, 118, 36, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,250,235,.55)'; for (const [x, y, w] of [[60, 90, 150], [250, 190, 210], [-20, 230, 120]]) { c.beginPath(); c.ellipse(x + w / 2, y, w / 2, 9, 0, 0, 7); c.fill(); }
    } else if (k === 1) { // far hills, a town on the horizon
      c.fillStyle = ink[1]; c.beginPath(); c.moveTo(-EDGE, 330);
      for (let x = -EDGE; x <= FRAME + EDGE; x += 16) c.lineTo(x, 318 - 16 * Math.sin(x / 90) - 9 * Math.sin(x / 37 + 1));
      c.lineTo(FRAME + EDGE, FRAME + EDGE); c.lineTo(-EDGE, FRAME + EDGE); c.fill();
      for (const [x, h] of [[90, 26], [118, 40], [300, 30], [430, 44]]) c.fillRect(x, 318 - h, 5, h);
    } else if (k === 2) { // the works: saw-tooth sheds and the tower
      c.fillStyle = ink[2];
      c.fillRect(40, 286, 360, 150);
      for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(40 + i * 60, 286); c.lineTo(40 + i * 60, 248); c.lineTo(100 + i * 60, 286); c.fill(); }
      c.fillRect(386, 176, 74, 260);
      c.fillStyle = '#d2bb92'; for (let i = 0; i < 9; i++) c.fillRect(58 + i * 38, 318, 20, 34);
      for (let j = 0; j < 5; j++) c.fillRect(402, 196 + j * 44, 42, 20);
      c.fillStyle = ink[1]; c.fillRect(-EDGE, 430, LAYER, 6);
    } else if (k === 3) { // the chimney, nearer, and the gatehouse
      c.fillStyle = ink[3];
      c.beginPath(); c.moveTo(196, 60); c.lineTo(224, 60); c.lineTo(234, 440); c.lineTo(186, 440); c.fill();
      c.fillRect(190, 54, 40, 12);
      c.fillRect(20, 356, 120, 86); c.beginPath(); c.moveTo(10, 356); c.lineTo(80, 318); c.lineTo(150, 356); c.fill();
      c.fillStyle = 'rgba(74,56,38,.34)'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(232 + i * 34, 44 - i * 9, 26 + i * 7, 13 + i * 2, -0.2, 0, 7); c.fill(); }
      c.fillStyle = '#c8b68e'; c.fillRect(62, 386, 34, 56);
    } else { // foreground: railings, a lamp, someone on the way to work
      c.fillStyle = ink[4];
      c.fillRect(-EDGE, 470, LAYER, 110);
      for (let x = -EDGE; x < FRAME + EDGE; x += 26) c.fillRect(x, 420, 5, 56);
      c.fillRect(-EDGE, 430, LAYER, 5);
      c.fillRect(436, 250, 7, 226); c.beginPath(); c.arc(439, 246, 13, 0, 7); c.fill();
      c.beginPath(); c.arc(128, 350, 14, 0, 7); c.fill(); c.fillRect(112, 340, 32, 6);
      c.beginPath(); c.moveTo(112, 366); c.lineTo(146, 366); c.lineTo(152, 476); c.lineTo(104, 476); c.fill();
    }
    return cv;
  });
}

const arch = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void => {
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w * 0.32); c.quadraticCurveTo(x, y, x + w / 2, y); c.quadraticCurveTo(x + w, y, x + w, y + w * 0.32); c.lineTo(x + w, y + h); c.closePath();
};

/** Stereoscope: two photographs taken a few centimetres apart, one for each eye, and a pair of lenses to fuse them. */
export function stereoscope(): Built {
  const root = G.group();
  const walnut = M.wood(0x5d3a20, 2), walnutX = M.wood(0x5d3a20, 0);
  const layers = stereoLayers();
  const CZ = -0.55, LZ = 0.5, PW = 0.52, PH = 0.5;
  // the card: one mount, two prints that differ only in how far each thing has shifted
  const card = screen(1024, 530), c = card.ctx;
  c.fillStyle = '#e6dcc4'; c.fillRect(0, 0, 1024, 530);
  const px = PW / 1.2 * 1024, py = PH / 0.62 * 530;
  for (const side of [-1, 1]) {
    const x0 = 512 + side * (0.3 / 1.2) * 1024 - px / 2, y0 = (530 - py) / 2;
    c.save(); arch(c, x0, y0, px, py); c.clip();
    layers.forEach((cv, k) => c.drawImage(cv, x0 + (-EDGE + side * 15 * (1 - 1 / DEPTH[k])) * (px / FRAME), y0 - EDGE * (py / FRAME), LAYER * (px / FRAME), LAYER * (py / FRAME)));
    c.restore();
    c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 2; arch(c, x0, y0, px, py); c.stroke();
  }
  c.fillStyle = '#6b573c'; c.font = '500 17px "PT Mono", monospace'; c.textAlign = 'center';
  c.fillText('The works from the east gate', 512, 520);
  card.tex.needsUpdate = true;

  const v = G.group();
  v.add(G.box(0.07, 0.045, 1.5, walnut, [0, -0.36, -0.08]));
  // lens board, and the hood that shuts the room out
  v.add(G.cut(0.9, 0.38, 0.05, [[-0.2, 0, 0.115], [0.2, 0, 0.115]], 0.045, walnutX, [0, 0, LZ]));
  const hood = new THREE.Shape();
  hood.moveTo(-0.46, -0.19); hood.lineTo(-0.46, 0.09); hood.absarc(-0.34, 0.09, 0.12, Math.PI, Math.PI / 2, true); hood.lineTo(0.34, 0.21); hood.absarc(0.34, 0.09, 0.12, Math.PI / 2, 0, true); hood.lineTo(0.46, -0.19);
  hood.lineTo(0.435, -0.19); hood.lineTo(0.435, 0.09); hood.absarc(0.34, 0.09, 0.095, 0, Math.PI / 2, false); hood.lineTo(-0.34, 0.185); hood.absarc(-0.34, 0.09, 0.095, Math.PI / 2, Math.PI, false); hood.lineTo(-0.435, -0.19);
  v.add(G.extruded(hood, 0.34, M.plastic(0x2a211b, 0.7), [0, 0, LZ + 0.19], 0.006), G.box(0.012, 0.3, 0.42, walnut, [0, 0, LZ - 0.23], 0.003));
  for (const x of [-0.2, 0.2]) v.add(lens(0.115, [x, 0, LZ], 0.26, M.brass()));
  // the card slides along the bar until the picture is sharp
  v.add(G.box(1.26, 0.04, 0.06, walnutX, [0, -0.325, CZ]), G.box(0.12, 0.07, 0.1, walnut, [0, -0.36, CZ]), G.box(1.2, 0.62, 0.008, M.printed(card, 0.85), [0, 0, CZ], 0));
  for (const x of [-0.5, 0.5]) v.add(G.wire([[x, -0.33, CZ + 0.02], [x, -0.24, CZ + 0.026], [x + 0.03, -0.2, CZ + 0.026], [x + 0.06, -0.24, CZ + 0.026], [x + 0.06, -0.33, CZ + 0.02]], 0.006, M.brass(), false, 6));
  const turned: P2[] = [[0, -0.47], [0.04, -0.465], [0.046, -0.43], [0.04, -0.4], [0.052, -0.3], [0.05, -0.16], [0.034, -0.06], [0.03, 0, 1], [0, 0]];
  const handle = G.lathe(turned, M.wood(0x5d3a20, 1), 32, true);
  handle.position.set(0, -0.385, 0.22);
  v.add(handle);
  v.position.set(0, 1.26, 0); v.rotation.set(-0.06, 0.78, 0);

  // through each lens: the same view with real depth, the way the two prints fuse in the head
  const mount = screen(1024, 1024), m = mount.ctx;
  const build = (side: number, ref: number) => {
    const E = new THREE.Vector3(side * 0.2, 0, LZ), C = new THREE.Vector3(side * 0.3, 0, CZ);
    const g = G.group();
    layers.forEach((cv, k) => {
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const pl = G.plane(PW * (LAYER / FRAME) * DEPTH[k], PH * (LAYER / FRAME) * DEPTH[k], new THREE.MeshStandardMaterial({ map: tex, color: 0xb9b2a8, alphaTest: k ? 0.5 : 0, roughness: 1 }));
      pl.position.copy(E).addScaledVector(C.clone().sub(E), DEPTH[k]);
      g.add(pl);
    });
    const mask = G.plane(2.4, 2.4, new THREE.MeshStandardMaterial({ map: mount.tex, color: 0xb9b2a8, alphaTest: 0.5, roughness: 1 }), [side * 0.3, 0, CZ + 0.002]);
    g.add(mask);
    const hole = opening(new THREE.CircleGeometry(0.11, 40), [side * 0.2, 0, LZ + 0.03]);
    v.add(hole, g);
    portal([hole], g, { ref });
  };
  m.fillStyle = '#0c0a08'; m.fillRect(0, 0, 1024, 1024);
  m.fillStyle = '#e6dcc4'; m.fillRect(512 - 256 - 20, 512 - 132, 552, 264);
  m.globalCompositeOperation = 'destination-out';
  arch(m, 512 - (PW / 2.4) * 512, 512 - (PH / 2.4) * 512, (PW / 2.4) * 1024, (PH / 2.4) * 1024); m.fill();
  mount.tex.needsUpdate = true;
  build(-1, 1); build(1, 2);

  // red and cyan spectacles: the same idea, with colour doing the job of the lenses
  const specs = G.group(G.cut(0.84, 0.28, 0.04, [[-0.2, 0, 0.1], [0.2, 0, 0.1]], 0.012, M.paper(), undefined, 0.002), G.box(0.24, 0.22, 0.004, M.glass(0xd62a1a, 0.6, 0.1), [-0.2, 0, -0.004], 0), G.box(0.24, 0.22, 0.004, M.glass(0x12b6c6, 0.6, 0.1), [0.2, 0, -0.004], 0));
  specs.position.set(-0.4, 0.075, 0.62); specs.rotation.set(-Math.PI / 2, 0, 0.3);
  root.add(v, specs, G.cyl(0.035, 0.84, M.brass(1), [0, 0.47, 0], 24), G.cyl(0.07, 0.1, M.brass(), [0, 0.86, 0], 24), G.cyl(0.9, 0.06, M.wood(0x3b2616), [0, 0.03, 0.1], 72), G.cyl(0.16, 0.05, M.brass(), [0, 0.085, 0], 40));
  v.updateMatrixWorld(true);
  const at = v.localToWorld(new THREE.Vector3(0.212, 0, LZ + 0.17)), to = v.localToWorld(new THREE.Vector3(0.3, 0, CZ));
  return { root, inDark: 'vanishes', view: [-8, 14], views: { eyepiece: { at: [at.x, at.y, at.z], to: [to.x, to.y, to.z], fov: 33, play: 0.045 } } };
}

/** Parallax barrier: a mask of slits in front of the pixels. Each eye sees through the slits to a different set of columns. */
export function parallaxBarrier(): Built {
  const root = G.group();
  const s = screen(512, 320);
  const c = s.ctx;
  // two pictures cut into strips and interleaved: an L for the left eye, an R for the right
  const strip = (letter: string, bg: string, fg: string, odd: number) => {
    const t = document.createElement('canvas'); t.width = 512; t.height = 320;
    const g = t.getContext('2d')!;
    g.fillStyle = bg; g.fillRect(0, 0, 512, 320);
    g.fillStyle = fg; g.font = '900 300px "Sofia Sans Extra Condensed Variable", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, 256, 172);
    for (let x = odd * 8; x < 512; x += 16) c.drawImage(t, x, 0, 8, 320, x, 0, 8, 320);
  };
  strip('L', '#3a0a06', '#ff5a44', 0); strip('R', '#04303a', '#4fe6f5', 1);
  s.tex.needsUpdate = true;
  const mask = screen(512, 4);
  for (let x = 0; x < 512; x += 16) { mask.ctx.fillStyle = '#050505'; mask.ctx.fillRect(x + 4, 0, 8, 4); }
  mask.tex.magFilter = THREE.NearestFilter; mask.tex.needsUpdate = true;
  const maskMat = new THREE.MeshStandardMaterial({ map: mask.tex, alphaTest: 0.5, transparent: false, roughness: 0.8, side: THREE.DoubleSide });
  const W = 1.8, H = 1.12, y = 0.9;
  root.add(G.rbox(W + 0.14, H + 0.14, 0.07, 0.02, M.dark(), [0, y, -0.04]), G.plane(W, H, M.lit(s, 1.3, 0.2), [0, y, 0]), G.plane(W, H, maskMat, [0, y, 0.085]), G.pane(W + 0.06, H + 0.06, 0.012, [0, y, 0.093]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) root.add(G.rod([sx * (W / 2 + 0.01), y + sy * (H / 2 + 0.01), -0.01], [sx * (W / 2 + 0.01), y + sy * (H / 2 + 0.01), 0.1], 0.014, M.steel(2), 10));
  root.add(G.rbox(W + 0.3, 0.05, 0.6, 0.02, M.dark(), [0, 0.025, 0]), G.box(0.06, 0.32, 0.06, M.steel(1), [-0.8, 0.19, -0.04]), G.box(0.06, 0.32, 0.06, M.steel(1), [0.8, 0.19, -0.04]));
  return { root, inDark: 'glows', glow: 0xff8fb0, view: [9, 4] };
}

/** Lenticular sheet: ribs of plastic lens over a striped print. Which stripe each rib shows depends on where you stand. */
export function lenticular(): Built {
  const root = G.group();
  const s = screen(512, 340);
  const W = 1.8, H = 1.2, y = 0.92, RIBS = 60;
  const ribs = new Swarm(new THREE.CylinderGeometry(W / RIBS / 2, W / RIBS / 2, H, 10, 1, false, -Math.PI / 2, Math.PI), M.bulb(0xb9c6c4, 0.22), RIBS);
  for (let i = 0; i < RIBS; i++) ribs.put(i, (i - (RIBS - 1) / 2) * (W / RIBS), y, 0.012);
  ribs.done();
  const tilt = G.group(G.box(W + 0.1, H + 0.1, 0.03, M.paper(0xf4f2ea), [0, y, -0.016], 0.006), G.plane(W, H, M.printed(s, 0.6), [0, y, 0.001]), ribs.mesh);
  tilt.rotation.x = -0.16;
  // a small easel, as a print would stand on a shop counter
  const easel = M.wood(0x8a5a30, 1);
  root.add(tilt, G.box(1.3, 0.04, 0.08, M.wood(0x8a5a30), [0, 0.3, 0.02]), G.box(0.05, 1.3, 0.05, easel, [-0.5, 0.66, -0.22]).rotateX(-0.2), G.box(0.05, 1.3, 0.05, easel, [0.5, 0.66, -0.22]).rotateX(-0.2), G.box(0.05, 1.2, 0.05, easel, [0, 0.58, -0.52]).rotateX(0.36), G.box(1.1, 0.04, 0.05, M.wood(0x8a5a30), [0, 1.0, -0.3]));
  let shown = -99;
  return {
    root, inDark: 'vanishes', view: [-20, 8], surface: s.canvas,
    update: (env) => {
      const [az] = gaze(root, env);
      const frame = Math.round(Math.max(-1, Math.min(1, az / 0.7)) * 4); // nine views behind every rib
      if (frame === shown) return; shown = frame;
      const c = s.ctx;
      c.fillStyle = '#f4f2ea'; c.fillRect(0, 0, 512, 340);
      // an eye that follows you round the room
      c.fillStyle = '#ffffff'; c.strokeStyle = '#14171a'; c.lineWidth = 8;
      c.beginPath(); c.ellipse(256, 170, 190, 112, 0, 0, 7); c.fill(); c.stroke();
      const px = 256 + frame * 26;
      c.fillStyle = '#1f3fa6'; c.beginPath(); c.arc(px, 170, 74, 0, 7); c.fill();
      c.fillStyle = '#0b0c0d'; c.beginPath(); c.arc(px + frame * 4, 170, 34, 0, 7); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px + frame * 4 - 14, 152, 10, 0, 7); c.fill();
      c.fillStyle = '#14171a'; c.font = '20px "PT Mono", monospace'; c.textAlign = 'center'; c.fillText(`view ${frame + 5} of 9`, 256, 322);
      s.tex.needsUpdate = true;
    },
  };
}

/** Integral imaging: a sheet of tiny round lenses, each showing a slightly different view. Depth works up and down as well as sideways. */
export function integral(): Built {
  const root = G.group();
  const s = screen(512, 384);
  const W = 1.7, H = 1.27, y = 0.9, NX = 26, NY = 19;
  const lenslets = new Swarm(new THREE.SphereGeometry(W / NX / 2, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.bulb(0xb9c6c4, 0.2), NX * NY);
  for (let i = 0; i < NX * NY; i++) lenslets.put(i, ((i % NX) - (NX - 1) / 2) * (W / NX), y + (Math.floor(i / NX) - (NY - 1) / 2) * (H / NY), 0.008);
  lenslets.done();
  root.add(G.rbox(W + 0.14, H + 0.14, 0.1, 0.025, M.dark(), [0, y, -0.055]), G.plane(W, H, M.lit(s, 1.3, 0), [0, y, 0]), lenslets.mesh, G.rbox(1.2, 0.05, 0.6, 0.02, M.dark(), [0, 0.025, 0]), G.cyl(0.045, 0.3, M.steel(1), [0, 0.17, -0.05], 20), vents(1.1, 0.6, 8, [0, y, -0.106]));
  let key = '';
  return {
    root, inDark: 'glows', glow: 0xffd9a0, view: [-16, 10], surface: s.canvas,
    update: (env) => {
      const [az, el] = gaze(root, env, y);
      // a lens array gives a limited number of views, so the picture moves in small steps
      const qa = Math.round(Math.max(-0.7, Math.min(0.7, az)) / 0.09), qe = Math.round(Math.max(-0.5, Math.min(0.5, el)) / 0.09);
      if (`${qa},${qe}` === key) return; key = `${qa},${qe}`;
      s.ctx.fillStyle = '#090a10'; s.ctx.fillRect(0, 0, 512, 384);
      depthScene(s.ctx, 512, 384, Math.tan(qa * 0.09), Math.tan(qe * 0.09), '#fff');
      s.tex.needsUpdate = true;
    },
  };
}

/** Something lit by one colour of laser light: a single hue, bright where it faces the beam, and grainy with speckle. */
function laserLit(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uGain: { value: 1 }, uTint: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */ `varying vec3 vN; void main() { vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uGain; uniform vec3 uTint; varying vec3 vN;
      float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main() {
        float d = max(dot(normalize(vN), normalize(vec3(-0.45, 0.6, 0.65))), 0.0);
        float speckle = 0.55 + 0.9 * h21(floor(gl_FragCoord.xy / 2.0));
        gl_FragColor = vec4(uTint * (0.14 + 0.86 * d) * speckle * uGain, 1.0);
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

/** Hologram: a glass plate that bends laser light back into the wavefront of the object, so the view changes smoothly as you move. */
export function hologram(): Built {
  const root = G.group();
  const y = 1.05, RED = 0xff2412;
  const plate = G.pane(1.3, 1.1, 0.02, [0, y, 0], 0x9aa89a, 0.1);
  const hole = opening(new THREE.PlaneGeometry(1.26, 1.06), [0, y, 0.012]);
  // plate holder on a rail
  root.add(plate, hole, G.box(1.5, 0.06, 0.14, M.dark(), [0, y - 0.6, 0]), G.box(0.05, 1.26, 0.1, M.dark(1), [-0.69, y, 0]), G.box(0.05, 1.26, 0.1, M.dark(1), [0.69, y, 0]), G.box(1.5, 0.04, 0.1, M.dark(), [0, y + 0.61, 0]));
  root.add(G.box(0.1, y - 0.66, 0.1, M.steel(1), [0, (y - 0.63) / 2 + 0.06, 0]), G.box(2.2, 0.06, 0.28, M.steel(2), [-0.3, 0.03, -0.55]).rotateY(-0.72), G.rbox(0.36, 0.08, 0.3, 0.02, M.dark(), [0, 0.1, 0]));
  // the scene the plate remembers: a toy engine, standing where it stood when the plate was exposed
  const mat = laserLit(RED);
  const train = G.group(
    G.cyl(0.13, 0.52, mat, [0.06, 0.2, 0], 32).rotateZ(Math.PI / 2), G.box(0.26, 0.34, 0.3, mat, [-0.32, 0.25, 0]), G.box(0.32, 0.03, 0.34, mat, [-0.32, 0.44, 0], 0.006),
    G.cyl(0.045, 0.2, mat, [0.22, 0.4, 0], 20, 0.06), G.sph(0.06, mat, [0.02, 0.33, 0], 20), G.box(0.86, 0.05, 0.26, mat, [-0.05, 0.06, 0]),
    G.profile([[-0.13, 0.03], [0.13, 0.03], [0, 0.16]], 0.14, mat, [0.44, 0, 0], 0.004).rotateY(Math.PI / 2),
  );
  for (const x of [-0.3, 0.0, 0.26]) for (const z of [-0.15, 0.15]) train.add(G.cyl(x < -0.2 ? 0.1 : 0.075, 0.03, mat, [x, x < -0.2 ? 0.1 : 0.075, z], 28).rotateX(Math.PI / 2));
  train.add(G.box(1.5, 0.012, 0.03, mat, [0, 0.006, 0.15], 0), G.box(1.5, 0.012, 0.03, mat, [0, 0.006, -0.15], 0));
  train.position.set(0.05, y - 0.42, -0.62); train.rotation.y = 0.55;
  const image = G.group(train);
  portal([hole], image, { additive: true, solid: true });
  root.add(image);
  // a transmission hologram is lit from behind, at the angle the reference beam came from
  const src: V3 = [-0.86, y + 0.12, -1.02];
  const tube = G.group(G.cyl(0.07, 0.7, M.steel(1), undefined, 28), G.cyl(0.075, 0.05, M.dark(), [0, 0.33, 0], 28), G.cyl(0.075, 0.05, M.dark(), [0, -0.33, 0], 28), G.cyl(0.03, 0.012, M.glow(RED, 2.6), [0, 0.357, 0], 16));
  tube.position.set(src[0] - 0.33, src[1] + 0.02, src[2] - 0.36); tube.lookAt(src[0], src[1], src[2]); tube.rotateX(Math.PI / 2);
  const spread = lens(0.06, src, 0.4); spread.lookAt(0, y, 0);
  root.add(tube, spread, post([src[0] - 0.33, src[1] - 0.06, src[2] - 0.36], 0.06), post([src[0], src[1] - 0.07, src[2]], 0.06), halo(RED, 0.2, src, 0.5));
  for (const [tx, ty] of [[-0.6, 0.5], [0.6, 0.5], [-0.6, -0.5], [0.6, -0.5]]) { const b = beam(RED, 0.2); b.aim(src, [tx, y + ty, -0.012]); root.add(b.line); }
  return {
    root, inDark: 'better', glow: 0x7a140c, view: [-18, 8],
    update: ({ lights }) => { mat.uniforms.uGain.value = 1 - 0.5 * lights; },
  };
}

/** Head-mounted display: one small screen and one lens for each eye, and nothing else in view. */
export function hmd(): Built {
  const root = G.group();
  const EY = 1.04;
  const head = G.lathe([[0.5, 0], [0.5, 0.05, 1], [0.36, 0.2], [0.2, 0.3], [0.17, 0.44], [0.21, 0.56], [0.36, 0.72], [0.425, 0.95], [0.4, 1.2], [0.28, 1.4], [0.1, 1.5], [0, 1.52]], M.ceramic(), 72, true);
  head.scale.z = 1.06;
  root.add(head);
  const shell = M.plastic(0x1b1d20, 0.4);
  const FZ = 0.44;
  // visor, face gasket and straps
  root.add(G.rbox(0.84, 0.4, 0.32, 0.1, shell, [0, EY, FZ + 0.2]), G.bezel(0.78, 0.36, 0.62, 0.24, 0.1, 0.1, M.rubber(), [0, EY, FZ + 0.02], 0.12, 0.02), G.rbox(0.6, 0.2, 0.012, 0.004, M.plastic(0x08090a, 0.15), [0, EY, FZ + 0.361]));
  for (const [x, yy] of [[-0.33, 0.13], [0.33, 0.13], [-0.33, -0.13], [0.33, -0.13]]) root.add(G.cyl(0.028, 0.012, M.plastic(0x050506, 0.1), [x, EY + yy, FZ + 0.362], 20).rotateX(Math.PI / 2));
  // the strap runs from one side of the visor round the back of the head to the other
  const band = G.torus(0.455, 0.03, M.rubber(), [0, EY + 0.02, 0.0], Math.PI * 2 - 1.5); band.rotation.set(Math.PI / 2, 0, Math.PI / 2 + 0.75); band.scale.set(0.98, 1.1, 1);
  const top = G.torus(0.47, 0.024, M.rubber(), [0, EY + 0.04, 0], Math.PI); top.rotation.y = Math.PI / 2;
  root.add(band, top, G.rbox(0.3, 0.14, 0.06, 0.03, shell, [0, EY, -0.5]));
  // the world inside: it exists only for an eye behind the lens
  const world = G.group();
  const flat = (c: number) => new THREE.MeshBasicMaterial({ color: c });
  const sky = screen(8, 256), sg = sky.ctx.createLinearGradient(0, 0, 0, 256);
  sg.addColorStop(0, '#070b24'); sg.addColorStop(0.5, '#2a1b5e'); sg.addColorStop(0.62, '#ff7a59'); sg.addColorStop(0.66, '#12142e'); sg.addColorStop(1, '#070818');
  sky.ctx.fillStyle = sg; sky.ctx.fillRect(0, 0, 8, 256); sky.tex.needsUpdate = true;
  world.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 24), new THREE.MeshBasicMaterial({ map: sky.tex, side: THREE.BackSide })));
  const grid = screen(256, 256), gc = grid.ctx;
  gc.fillStyle = '#0a0c22'; gc.fillRect(0, 0, 256, 256); gc.strokeStyle = '#49e0ff'; gc.lineWidth = 5; gc.strokeRect(0, 0, 256, 256);
  grid.tex.wrapS = grid.tex.wrapT = THREE.RepeatWrapping; grid.tex.repeat.set(60, 60); grid.tex.needsUpdate = true;
  const floor = G.plane(120, 120, new THREE.MeshBasicMaterial({ map: grid.tex }), [0, EY - 1.2, 0]); floor.rotation.x = -Math.PI / 2;
  const sign = screen(512, 160);
  const board = G.plane(3.2, 1.0, new THREE.MeshBasicMaterial({ map: sign.tex, transparent: true }), [0, EY + 0.25, 5.2]); board.rotation.y = Math.PI;
  world.add(floor, board);
  const things: THREE.Mesh[] = [];
  [[-1.3, 0.1, 3.2, 0xff5d5d], [1.5, -0.3, 4.2, 0xffd166], [0.5, 0.9, 7, 0x6f8cff], [-2.6, 0.6, 8, 0x7dffa2], [2.8, 0.4, 10, 0xff8fd0]].forEach(([x, dy, z, hue], i) => {
    const mesh = new THREE.Mesh(i % 2 ? new THREE.IcosahedronGeometry(0.42, 0) : new THREE.TorusKnotGeometry(0.3, 0.09, 80, 12), new THREE.MeshNormalMaterial());
    mesh.position.set(x, EY + dy, z); world.add(mesh, new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), flat(hue)).translateX(x).translateY(EY + dy - 1.5).translateZ(z));
    things.push(mesh);
  });
  const holes = [-1, 1].map((sx) => { const hole = opening(new THREE.CircleGeometry(0.1, 40), [sx * 0.09, EY, FZ + 0.03]); hole.rotation.y = Math.PI; return hole; });
  portal(holes, world, { ref: 3 });
  root.add(...holes, world);
  // beside it, the works of one eye taken out: a lens, and the little screen it looks at
  const s = screen(256, 256);
  const kit = G.group(lens(0.13, [0, 0, 0.16], 0.34), G.rbox(0.34, 0.34, 0.03, 0.02, shell, [0, 0, -0.07]), G.plane(0.29, 0.29, M.lit(s, 1.5, 0.6), [0, 0, -0.054]));
  for (const sx of [-1, 1]) kit.add(G.rod([sx * 0.15, -0.15, -0.06], [sx * 0.15, -0.15, 0.16], 0.008, M.steel(), 8), G.rod([sx * 0.15, 0.15, -0.06], [sx * 0.15, 0.15, 0.16], 0.008, M.steel(), 8));
  kit.position.set(0.86, 0.34, 0.5); kit.rotation.y = -0.5;
  root.add(kit, post([0.86, 0.16, 0.5], 0, 0.02));
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9fc0ff, view: [28, 8],
    views: { worn: { at: [0.09, EY, FZ - 0.09], to: [0.09, EY, FZ + 0.5], fov: 62, play: 0.1 } },
    update: ({ t }) => {
      things.forEach((mesh, i) => { mesh.rotation.set(t * 0.4 + i, t * 0.3, 0); });
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      sign.ctx.clearRect(0, 0, 512, 160); bigTime(sign.ctx, 512, 160, n.hhmmss, '#ffffff', 800, 0.8); sign.tex.needsUpdate = true;
      // the picture on the panel is drawn bulging, so that the lens, which pinches, shows it straight
      const c = s.ctx; c.fillStyle = '#070912'; c.fillRect(0, 0, 256, 256);
      c.strokeStyle = '#49e0ff'; c.lineWidth = 1.5;
      const warp = (x: number, yy: number): [number, number] => { const r2 = x * x + yy * yy, k = 1 - 0.2 * r2; return [128 + x * k * 122, 128 + yy * k * 122]; };
      for (let i = -4; i <= 4; i++) for (const flip of [0, 1]) { c.beginPath(); for (let j = -20; j <= 20; j++) { const a = i / 4, b = j / 20, [X, Y] = flip ? warp(a, b) : warp(b, a); if (j === -20) c.moveTo(X, Y); else c.lineTo(X, Y); } c.stroke(); }
      c.fillStyle = '#fff'; c.font = '700 34px "Sofia Sans Extra Condensed Variable", sans-serif'; c.textAlign = 'center'; c.fillText(n.hhmmss, 128, 140);
      s.tex.needsUpdate = true;
    },
  };
}

/** Retinal display: no screen at all. A scanned beam goes in through the pupil and paints the picture on the retina. */
export function retinal(): Built {
  const root = G.group();
  const y = 1.05, R = 0.72;
  const s = screen(256, 256);
  s.ctx.fillStyle = '#2a0c08'; s.ctx.fillRect(0, 0, 256, 256);
  // a classroom eye, with a quarter cut away
  const cut: [number, number] = [Math.PI * 1.25, Math.PI * 1.5];
  const white = M.ceramic(), inside = M.plastic(0x9c3a2a, 0.6); inside.side = THREE.BackSide;
  const eye = G.group(
    new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40, cut[0], cut[1], 0.42, Math.PI - 0.42).rotateX(Math.PI / 2), white),
    new THREE.Mesh(new THREE.SphereGeometry(R - 0.03, 64, 40, cut[0], cut[1], 0.42, Math.PI - 0.42).rotateX(Math.PI / 2), inside),
  );
  // cornea, iris and lens at the front
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.4, 40, 20, 0, Math.PI * 2, 0, 0.82).rotateX(Math.PI / 2), M.bulb(0x9fb1ae, 0.6));
  cornea.position.z = R - 0.3;
  const iris = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.285, 48), M.plastic(0x3d6f8f, 0.5)); iris.material.side = THREE.DoubleSide; iris.position.z = R - 0.08;
  const crystalline = G.sph(0.2, M.glass(0xcfc49a, 0.25, 0.6), [0, 0, R - 0.2], 28); crystalline.scale.z = 0.5;
  // the picture lands on the back wall, upside down, as every image in an eye does
  const retina = G.dish(0.42, -0.13, M.lit(s, 1.3, 0), [0, 0, -R + 0.17]); retina.rotation.z = Math.PI;
  const nerve = G.cyl(0.1, 0.36, M.plastic(0xd9c47a, 0.6), [0.22, -0.04, -R - 0.1], 24); nerve.rotation.x = Math.PI / 2 - 0.25;
  eye.add(cornea, iris, crystalline, retina, nerve);
  eye.position.y = y;
  root.add(eye, G.cyl(0.035, y - R + 0.06, M.brass(1), [0, (y - R + 0.06) / 2, 0], 20), G.cyl(0.42, 0.05, M.wood(0x3b2616), [0, 0.025, 0], 56), G.cyl(0.1, 0.04, M.brass(), [0, 0.07, 0], 32));
  // the projector: a laser and a mirror the size of a pinhead, worn at the temple
  const mod = G.group(G.rbox(0.42, 0.24, 0.3, 0.035, M.plastic(0x1d1f22, 0.5)), G.cyl(0.05, 0.02, M.chrome(), [-0.12, 0, -0.16], 20).rotateX(Math.PI / 2), screws([[0.16, 0.08, 0.151], [0.16, -0.08, 0.151]], 0.014));
  mod.position.set(-0.8, y - 0.12, 1.5); mod.rotation.y = 0.5; mod.scale.x = -1;
  root.add(mod, post([-0.8, y - 0.25, 1.5], 0, 0.022), G.rbox(0.5, 0.04, 0.4, 0.015, M.dark(), [-0.8, 0.02, 1.5]));
  const b1 = beam(0xff4030, 0.9), b2 = beam(0xff4030, 0.7);
  root.add(b1.line, b2.line);
  let lastRow = -1;
  return {
    root, inDark: 'glows', glow: 0xff5040, view: [38, 10], zoom: 1.05, surface: s.canvas,
    update: ({ t }) => {
      const n = now(), c = s.ctx;
      const row = Math.floor((t * 22) % 32), u = (t * 9) % 1;
      if (row !== lastRow) {
        lastRow = row;
        // one line of the raster at a time; what was drawn a moment ago is still fading
        c.fillStyle = 'rgba(42,12,8,.12)'; c.fillRect(0, 0, 256, 256);
        c.save(); c.beginPath(); c.rect(48, 48 + row * 5, 160, 5); c.clip();
        c.fillStyle = '#3a1410'; c.fillRect(48, 48, 160, 160);
        bigTime(c, 256, 256, n.hhmm, '#ffd9c8', 800, 0.3);
        c.restore();
      }
      s.tex.needsUpdate = true;
      const hit: V3 = [-(0.5 - u) * 0.52, y - (0.5 - row / 32) * 0.52, -R + 0.07];
      b1.aim([-0.74, y - 0.12, 1.37], [0, y, R - 0.08]); b2.aim([0, y, R - 0.08], hit);
    },
  };
}

/** Head-up display: symbols reflected in a sloping sheet of glass, focused far away so they sit on the world outside. */
export function hud(): Built {
  const root = G.group();
  const s = screen(512, 400);
  const dark = M.dark(), GY = 1.42, GZ = -0.05;
  // glareshield, and the projector let into the top of it
  root.add(G.rbox(2.0, 0.34, 1.0, 0.07, M.plastic(0x191a1c, 0.85), [0, 0.52, -0.2]), G.box(1.3, 0.36, 0.7, dark, [0, 0.18, -0.2]), G.rbox(0.56, 0.2, 0.46, 0.04, dark, [0, 0.77, -0.05]));
  const top = lens(0.17, [0, 0.875, -0.05], 0.22); top.rotation.x = Math.PI / 2;
  root.add(top, G.cyl(0.19, 0.03, M.dark(), [0, 0.86, -0.05], 40));
  // an instrument or two, for scale
  for (const x of [-0.62, 0.62]) root.add(G.cyl(0.14, 0.02, M.plastic(0x0c0d0e, 0.3), [x, 0.5, 0.305], 40).rotateX(Math.PI / 2), G.torus(0.14, 0.014, M.steel(), [x, 0.5, 0.31]));
  // the combiner: plain glass with a coating that mirrors only the green of the tube
  // it leans towards the pilot at the top, so that light coming up from below is turned back along the line of sight
  const slope = Math.PI / 4;
  const frame = G.group(G.pane(1.0, 1.1, 0.016, undefined, 0x86a892, 0.04));
  for (const sx of [-1, 1]) frame.add(G.box(0.02, 1.14, 0.03, M.steel(1), [sx * 0.51, 0, 0], 0.004));
  const hole = opening(new THREE.PlaneGeometry(0.98, 1.08), [0, 0, 0.01]);
  frame.add(hole);
  frame.position.set(0, GY, GZ); frame.rotation.x = slope;
  root.add(frame);
  for (const x of [-0.52, 0.52]) root.add(G.rod([x, 0.67, -0.52], [x, GY - 0.39, GZ - 0.39], 0.016, M.steel(1), 10), G.rod([x, 0.67, 0.2], [x, GY - 0.2, GZ - 0.2], 0.012, M.steel(1), 10));
  // the symbols are focused at infinity: they stay put against the far wall however the head moves, and vanish outside the glass
  const eyeAt = new THREE.Vector3(0, GY + 0.04, 2.4), centre = new THREE.Vector3(0, GY, GZ), far = 36;
  const dir = centre.clone().sub(eyeAt).normalize();
  const symMat = M.add(s, 0xffffff, 1);
  const sym = G.plane(far * 0.44, far * 0.345, symMat);
  sym.position.copy(centre).addScaledVector(dir, far); sym.lookAt(eyeAt);
  const image = G.group(sym);
  portal([hole], image, { additive: true });
  root.add(image);
  for (const [tx, tz] of [[-0.3, 0.2], [0.3, 0.2], [0, -0.05]]) { const b = beam(0x40ff70, 0.16); b.aim([0, 0.89, -0.05], [tx, GY + tz * 0.7, GZ + tz * 0.7]); root.add(b.line); }
  return {
    root, inDark: 'glows', glow: 0x40ff70, view: [7, 4], surface: s.canvas,
    views: { seat: { at: [eyeAt.x, eyeAt.y, eyeAt.z], to: [0, GY, GZ], fov: 30, play: 0.05 } },
    update: ({ t, lights }) => {
      const c = s.ctx, n = now();
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 400);
      c.strokeStyle = c.fillStyle = '#5dff86'; c.lineWidth = 3; c.shadowColor = '#30ff60'; c.shadowBlur = 8;
      const roll = Math.sin(t * 0.4) * 0.16, pitch = Math.sin(t * 0.27) * 26;
      c.save(); c.translate(256, 210); c.rotate(roll);
      c.beginPath(); c.moveTo(-230, pitch); c.lineTo(-50, pitch); c.moveTo(50, pitch); c.lineTo(230, pitch); c.stroke();
      for (const k of [-2, -1, 1, 2]) { c.beginPath(); c.moveTo(-70, pitch - k * 52); c.lineTo(-24, pitch - k * 52); c.moveTo(24, pitch - k * 52); c.lineTo(70, pitch - k * 52); c.stroke(); }
      c.restore();
      c.beginPath(); c.arc(256, 210, 12, 0, 7); c.moveTo(232, 210); c.lineTo(244, 210); c.moveTo(268, 210); c.lineTo(280, 210); c.moveTo(256, 198); c.lineTo(256, 188); c.stroke();
      c.strokeRect(22, 180, 86, 40); c.strokeRect(404, 180, 86, 40);
      c.font = '26px "PT Mono", monospace'; c.textAlign = 'center';
      c.fillText(String(240 + Math.round(Math.sin(t * 0.3) * 6)), 65, 209); c.fillText(String(9500 + Math.round(Math.sin(t * 0.2) * 40)), 447, 209);
      c.fillText(n.hhmmss, 256, 380);
      for (let i = 0; i < 9; i++) { const x = 96 + i * 40; c.beginPath(); c.moveTo(x, 34); c.lineTo(x, i % 2 ? 44 : 52); c.stroke(); }
      c.shadowBlur = 0;
      s.tex.needsUpdate = true;
      symMat.opacity = 1 - 0.35 * lights;
    },
  };
}
