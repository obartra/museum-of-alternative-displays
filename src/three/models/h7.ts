import { G, M, Swarm, beam, screen, THREE, type Built, type Env, type V3 } from '../kit';
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

/** Stereoscope: two photographs taken a few centimetres apart, one for each eye, and a pair of lenses to fuse them. */
export function stereoscope(): Built {
  const root = G.group();
  const wood = M.wood(0x6b4426);
  const card = screen(512, 256);
  const c = card.ctx;
  c.fillStyle = '#e9e2cf'; c.fillRect(0, 0, 512, 256);
  for (const [ox, shift] of [[0, -1], [256, 1]] as const) {
    c.save(); c.beginPath(); c.rect(ox + 12, 14, 232, 228); c.clip();
    c.fillStyle = '#b7c7cf'; c.fillRect(ox, 0, 256, 256);
    c.fillStyle = '#8fa3ad'; c.beginPath(); c.arc(ox + 190, 70, 24, 0, 7); c.fill();
    c.fillStyle = '#6d7f73'; c.fillRect(ox, 170, 256, 86);
    c.fillStyle = '#3d4a4f'; // the works: chimney near, shed further back
    c.fillRect(ox + 60 + shift * 2, 120, 130, 60); c.fillRect(ox + 150 + shift * 7, 40, 16, 140); c.fillRect(ox + 30 + shift * 12, 150, 40, 90);
    c.restore();
  }
  card.tex.needsUpdate = true;
  const v = G.group();
  v.add(G.rbox(0.9, 0.42, 0.34, 0.06, wood, [0, 0, 0.75]), G.box(0.06, 0.05, 1.5, wood, [0, -0.2, 0]), G.box(1.2, 0.04, 0.06, wood, [0, -0.17, -0.55]), G.plane(1.12, 0.56, M.printed(card, 0.85), [0, 0.12, -0.52]));
  for (const x of [-0.2, 0.2]) { const l = G.cyl(0.13, 0.04, M.glass(0xe6f4ff, 0.3), [x, 0, 0.58], 24); l.rotation.x = Math.PI / 2; v.add(l); }
  v.add(G.box(0.03, 0.12, 0.02, M.brass(), [-0.57, -0.1, -0.53]), G.box(0.03, 0.12, 0.02, M.brass(), [0.57, -0.1, -0.53]));
  v.position.set(0, 1.05, 0); v.rotation.y = 0.8;
  // red and cyan spectacles: the same idea, with colour doing the job of the lenses
  const specs = G.group(G.box(0.34, 0.2, 0.01, M.glass(0xff2a1a, 0.6), [-0.2, 0, 0]), G.box(0.34, 0.2, 0.01, M.glass(0x12d6e6, 0.6), [0.2, 0, 0]), G.box(0.8, 0.26, 0.012, M.paper(), [0, 0, -0.008]));
  specs.position.set(-0.35, 0.09, 0.62); specs.rotation.set(-1.45, 0, 0.3);
  root.add(v, specs, G.cyl(0.05, 0.8, M.steel(), [0, 0.45, 0], 16), G.cyl(0.9, 0.05, M.dark(), [0, 0.025, 0.1], 48));
  return { root, inDark: 'vanishes', view: [-8, 14] };
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
  const W = 1.8, H = 1.12, y = 0.86;
  root.add(G.box(W + 0.1, H + 0.1, 0.05, M.dark(), [0, y, -0.03]), G.plane(W, H, M.lit(s, 1.3), [0, y, 0]), G.plane(W, H, maskMat, [0, y, 0.085]), G.box(W, H, 0.01, M.glass(0xffffff, 0.08), [0, y, 0.09]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) root.add(G.rod([sx * (W / 2 + 0.02), y + sy * (H / 2 + 0.02), -0.03], [sx * (W / 2 + 0.02), y + sy * (H / 2 + 0.02), 0.1], 0.012, M.steel(), 6));
  root.add(G.box(W + 0.3, 0.05, 0.6, M.dark(), [0, 0.025, 0]), G.box(0.06, 0.3, 0.06, M.steel(), [-0.8, 0.17, -0.03]), G.box(0.06, 0.3, 0.06, M.steel(), [0.8, 0.17, -0.03]));
  return { root, inDark: 'glows', glow: 0xff8fb0, view: [9, 4] };
}

/** Lenticular sheet: ribs of plastic lens over a striped print. Which stripe each rib shows depends on where you stand. */
export function lenticular(): Built {
  const root = G.group();
  const s = screen(512, 340);
  const W = 1.8, H = 1.2, y = 0.9, RIBS = 60;
  const ribs = new Swarm(new THREE.CylinderGeometry(W / RIBS / 2, W / RIBS / 2, H, 8, 1, false, -Math.PI / 2, Math.PI), M.bulb(0xffffff), RIBS);
  for (let i = 0; i < RIBS; i++) ribs.put(i, (i - (RIBS - 1) / 2) * (W / RIBS), y, 0.012);
  ribs.done();
  const tilt = G.group(G.box(W + 0.08, H + 0.08, 0.03, M.paper(0xf4f2ea), [0, y, -0.016]), G.plane(W, H, M.printed(s, 0.6), [0, y, 0.001]), ribs.mesh);
  tilt.rotation.x = -0.14;
  root.add(tilt, G.box(1.2, 0.05, 0.7, M.dark(), [0, 0.025, -0.1]), G.box(0.7, 0.9, 0.04, M.dark(), [0, 0.5, -0.3]));
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
  const W = 1.7, H = 1.27, y = 0.88, NX = 26, NY = 19;
  const lens = new Swarm(new THREE.SphereGeometry(W / NX / 2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), M.bulb(0xffffff), NX * NY);
  for (let i = 0; i < NX * NY; i++) lens.put(i, ((i % NX) - (NX - 1) / 2) * (W / NX), y + (Math.floor(i / NX) - (NY - 1) / 2) * (H / NY), 0.008);
  lens.done();
  root.add(G.box(W + 0.12, H + 0.12, 0.08, M.dark(), [0, y, -0.045]), G.plane(W, H, M.lit(s, 1.3), [0, y, 0]), lens.mesh, G.box(1.2, 0.05, 0.6, M.dark(), [0, 0.025, 0]), G.box(0.08, 0.3, 0.08, M.steel(), [0, 0.15, -0.04]));
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

/** Hologram: a glass plate that bends laser light back into the wavefront of the object, so the view changes smoothly as you move. */
export function hologram(): Built {
  const root = G.group();
  const s = screen(512, 640);
  const y = 1.05;
  const img = M.add(s, 0xffffff, 1);
  root.add(G.box(1.2, 1.5, 0.02, M.glass(0xcdf5dc, 0.12), [0, y, 0]), G.plane(1.16, 1.46, img, [0, y, 0.012]));
  root.add(G.box(1.4, 0.08, 0.3, M.dark(), [0, 0.24, 0]), G.box(0.06, 0.12, 0.1, M.steel(), [-0.5, 0.33, 0]), G.box(0.06, 0.12, 0.1, M.steel(), [0.5, 0.33, 0]), G.box(0.3, 0.2, 0.3, M.dark(), [0, 0.1, 0]));
  const laser = G.group(G.cyl(0.05, 0.4, M.steel(), [0, 0, 0], 16), G.cyl(0.03, 0.02, M.glow(0x30ff60, 2.5), [0, 0.21, 0], 12));
  laser.position.set(-1.0, 1.5, 1.0); laser.lookAt(0, y, 0); laser.rotateX(Math.PI / 2);
  root.add(laser);
  for (const [dx, dz] of [[-0.2, 0.15], [0.2, 0.15], [0, -0.22]]) root.add(G.rod([-1.0, 1.42, 1.0], [-1.0 + dx, 0, 1.0 + dz], 0.014, M.steel(), 6));
  for (const [tx, ty] of [[-0.55, 0.7], [0.55, 0.7], [-0.55, -0.7], [0.55, -0.7]]) { const b = beam(0x30ff60, 0.22); b.aim([-0.93, 1.47, 0.93], [tx, y + ty, 0.02]); root.add(b.line); }
  return {
    root, inDark: 'better', glow: 0x30ff60, view: [-22, 8], surface: s.canvas,
    update: (env) => {
      const [az, el] = gaze(root, env, y);
      const c = s.ctx;
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 640);
      c.shadowColor = '#30ff60'; c.shadowBlur = 10;
      depthScene(c, 512, 640, Math.tan(Math.max(-1, Math.min(1, az))), Math.tan(Math.max(-0.7, Math.min(0.7, el))), '#5dff86', true);
      c.shadowBlur = 0;
      // laser speckle
      c.fillStyle = 'rgba(0,0,0,.35)';
      for (let i = 0; i < 500; i++) c.fillRect((i * 97.3 + az * 4000) % 512, (i * 61.7 + el * 4000 + 4000) % 640, 3, 3);
      s.tex.needsUpdate = true;
      img.opacity = 1 - 0.55 * env.lights;
    },
  };
}

/** Head-mounted display, front cover off: one small screen and one lens for each eye. */
export function hmd(): Built {
  const root = G.group();
  const skin = M.ceramic();
  const head = G.sph(0.5, skin, [0, 1.05, 0], 40); head.scale.set(0.84, 1.08, 0.96);
  root.add(head, G.cyl(0.2, 0.4, skin, [0, 0.42, -0.04], 28), G.cyl(0.55, 0.26, skin, [0, 0.13, -0.04], 40, 0.3));
  const shell = M.plastic(0x232528, 0.45);
  const L = screen(256, 224), R = screen(256, 224);
  const set = G.group();
  set.add(G.box(0.78, 0.36, 0.03, shell, [0, 0, -0.14]), G.box(0.78, 0.03, 0.3, shell, [0, 0.165, 0]), G.box(0.78, 0.03, 0.3, shell, [0, -0.165, 0]), G.box(0.03, 0.36, 0.3, shell, [-0.375, 0, 0]), G.box(0.03, 0.36, 0.3, shell, [0.375, 0, 0]), G.box(0.02, 0.3, 0.26, shell, [0, 0, 0]));
  set.add(G.plane(0.33, 0.29, M.lit(L, 1.4), [-0.185, 0, 0.1]), G.plane(0.33, 0.29, M.lit(R, 1.4), [0.185, 0, 0.1]), G.box(0.74, 0.32, 0.008, M.glass(0xffffff, 0.08), [0, 0, 0.15]));
  for (const x of [-0.185, 0.185]) { const l = G.cyl(0.12, 0.03, M.glass(0xd8ecff, 0.3), [x, 0, -0.07], 24); l.rotation.x = Math.PI / 2; set.add(l); }
  set.position.set(0, 1.1, 0.58);
  const band = G.torus(0.47, 0.03, M.rubber(), [0, 1.1, 0.02]); band.rotation.x = Math.PI / 2; band.scale.set(0.9, 1.12, 1);
  const top = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 10, 32, Math.PI), M.rubber()); top.position.set(0, 1.12, 0.02); top.rotation.y = Math.PI / 2;
  root.add(set, band, top);
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0x9fc0ff, view: [26, 8],
    update: () => {
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      [L, R].forEach((sc, k) => {
        const c = sc.ctx;
        c.fillStyle = '#070912'; c.fillRect(0, 0, 256, 224);
        depthScene(c, 256, 224, k ? 0.12 : -0.12, 0, '#fff');
        c.save(); c.translate(0, 78); bigTime(c, 256, 224, n.hhmmss, '#ffffff', 700, 0.16); c.restore();
        sc.tex.needsUpdate = true;
      });
    },
  };
}

/** Retinal display: no screen at all. A scanned beam goes in through the pupil and paints the picture on the retina. */
export function retinal(): Built {
  const root = G.group();
  const y = 1.0;
  const s = screen(256, 256);
  s.ctx.fillStyle = '#2a0c08'; s.ctx.fillRect(0, 0, 256, 256);
  const iris = G.torus(0.22, 0.09, M.plastic(0x3d6f8f, 0.4), [0, y, 0.6]); iris.scale.z = 0.3;
  const lensBody = G.sph(0.2, M.glass(0xfff6dc, 0.35), [0, y, 0.48], 24); lensBody.scale.z = 0.5;
  const retina = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), M.lit(s, 1.3)); retina.position.set(0, y, -0.48);
  const nerve = G.cyl(0.09, 0.4, M.plastic(0xd9c47a, 0.6), [0.2, y - 0.05, -0.86], 16); nerve.rotation.x = Math.PI / 2 - 0.2;
  root.add(G.sph(0.72, M.glass(0xffffff, 0.2), [0, y, 0], 48), G.sph(0.34, M.bulb(0xdff3ff), [0, y, 0.47], 32), iris, lensBody, retina, nerve);
  root.add(G.cyl(0.05, 0.3, M.steel(), [0, 0.16, 0], 12), G.cyl(0.4, 0.04, M.dark(), [0, 0.02, 0], 40));
  const mod = G.group(G.rbox(0.4, 0.24, 0.3, 0.03, M.plastic(0x232528, 0.5)), G.box(0.1, 0.1, 0.01, M.chrome(), [-0.12, 0, -0.16]));
  mod.position.set(0.85, y + 0.05, 1.55); mod.rotation.y = -0.5;
  root.add(mod, G.box(0.06, y - 0.05, 0.06, M.steel(), [0.85, (y - 0.05) / 2, 1.55]), G.box(1.4, 0.04, 2.2, M.dark(), [0.35, 0.02, 0.6]));
  const b1 = beam(0xff4030, 0.9), b2 = beam(0xff4030, 0.7);
  root.add(b1.line, b2.line);
  let lastRow = -1;
  return {
    root, inDark: 'glows', glow: 0xff5040, view: [34, 10], zoom: 1.05, surface: s.canvas,
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
      const hit: V3 = [(0.5 - u) * 0.62, y + (0.5 - row / 32) * 0.62, -0.47];
      b1.aim([0.79, y + 0.05, 1.42], [0, y, 0.62]); b2.aim([0, y, 0.62], hit);
    },
  };
}

/** Head-up display: symbols reflected in a sloping sheet of glass, focused far away so they sit on the world outside. */
export function hud(): Built {
  const root = G.group();
  const s = screen(512, 400);
  const dark = M.dark();
  root.add(G.rbox(1.9, 0.3, 1.0, 0.05, M.plastic(0x1b1c1e, 0.8), [0, 0.5, -0.2]), G.box(1.2, 0.35, 0.7, dark, [0, 0.175, -0.2]), G.rbox(0.5, 0.16, 0.42, 0.03, dark, [0, 0.73, -0.05]));
  const lensTop = G.cyl(0.14, 0.02, M.glass(0xb8ffd0, 0.35), [0, 0.82, -0.05], 28);
  const glass = G.group(G.box(1.0, 0.78, 0.014, M.glass(0xeaffee, 0.12)), G.plane(0.96, 0.74, M.add(s, 0xffffff, 1), [0, 0, 0.012]));
  glass.position.set(0, 1.25, 0.1); glass.rotation.x = -0.6;
  root.add(lensTop, glass);
  for (const x of [-0.52, 0.52]) root.add(G.rod([x, 0.65, -0.3], [x, 0.98, -0.1], 0.016, M.steel(), 8), G.rod([x, 0.98, -0.1], [x, 1.55, 0.31], 0.012, M.steel(), 8));
  for (const [tx, tz] of [[-0.3, 0.2], [0.3, 0.2], [0, -0.05]]) { const b = beam(0x40ff70, 0.2); b.aim([0, 0.83, -0.05], [tx, 1.25 + tz * 0.8, 0.1 + tz * 0.5]); root.add(b.line); }
  return {
    root, inDark: 'glows', glow: 0x40ff70, view: [18, 10], surface: s.canvas,
    update: ({ t }) => {
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
    },
  };
}
