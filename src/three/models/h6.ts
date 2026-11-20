import { G, M, NOISE, Swarm, beam, glows, halo, mirror, opening, portal, screen, voxels, THREE, type Built, type V3 } from '../kit';
import { breadboard, feet, lens, post, screws, vents } from '../parts';
import { bigTime, dotMatrix, now } from '../../sims/draw';

/** A draped figure one unit tall with its feet at the origin, facing +z. A single mesh, so that it can be mirrored whole. */
function shroud(): THREE.BufferGeometry {
  const NU = 60, NV = 64;
  const key = (v: number, pts: [number, number][]): number => {
    for (let i = 1; i < pts.length; i++) if (v <= pts[i][0]) { const [v0, a] = pts[i - 1], [v1, b] = pts[i], t = (v - v0) / (v1 - v0); return a + (b - a) * t * t * (3 - 2 * t); }
    return pts[pts.length - 1][1];
  };
  const R: [number, number][] = [[0, 0.3], [0.12, 0.27], [0.34, 0.2], [0.55, 0.17], [0.68, 0.19], [0.75, 0.2], [0.81, 0.15], [0.86, 0.135], [0.92, 0.125], [0.97, 0.08], [1, 0]];
  const SX: [number, number][] = [[0, 1], [0.5, 1.05], [0.72, 1.32], [0.8, 1.05], [1, 1]];
  const SZ: [number, number][] = [[0, 1.08], [0.5, 0.9], [0.72, 0.72], [0.82, 0.95], [1, 1]];
  const pos: number[] = [], shade: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * Math.PI * 2 - Math.PI / 2; // the seam runs down the back
      const fold = v < 0.62 ? 0.17 * Math.pow(1 - v / 0.62, 1.4) * Math.cos(9 * u + 2.2 * Math.sin(3 * u + 1)) : 0;
      const r = key(v, R) * (1 + fold);
      const x = Math.cos(u) * r * key(v, SX);
      let z = Math.sin(u) * r * key(v, SZ) + 0.03 * Math.sin(v * Math.PI);
      // the open front of the hood, with nothing in it
      const du = Math.atan2(Math.sin(u - Math.PI / 2), Math.cos(u - Math.PI / 2)) / 0.8, dv = (v - 0.885) / 0.06, f = du * du + dv * dv;
      let sh = 1;
      if (f < 1) { z -= 0.07 * (1 - f); sh = 1 - 0.97 * Math.min(1, (1 - f) * 2.4); }
      pos.push(x, v + (j === 0 ? 0.012 * Math.sin(7 * u) : 0), z); shade.push(sh);
    }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1; idx.push(a, c, b, b, c, c + 1); }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  body.setAttribute('shade', new THREE.Float32BufferAttribute(shade, 1));
  body.setIndex(idx); body.computeVertexNormals();
  const plain = (g: THREE.BufferGeometry) => { g.deleteAttribute('uv'); g.setAttribute('shade', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(1), 1)); return g; };
  // a sleeve that widens to the cuff, and a hand
  const sleeve = (a: V3, b: V3, c: V3) => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b), new THREE.Vector3(...c)), T = 22, RS = 16;
    const g = new THREE.TubeGeometry(curve, T, 1, RS, false), p = g.attributes.position, at = new THREE.Vector3();
    for (let i = 0; i <= T; i++) {
      curve.getPointAt(i / T, at);
      const rr = 0.07 + 0.045 * Math.pow(i / T, 1.6);
      for (let k = 0; k <= RS; k++) { const n = i * (RS + 1) + k; p.setXYZ(n, at.x + (p.getX(n) - at.x) * rr, at.y + (p.getY(n) - at.y) * rr - 0.03 * Math.pow(i / T, 2), at.z + (p.getZ(n) - at.z) * rr); }
    }
    g.computeVertexNormals();
    curve.getPointAt(0.93, at);
    const hand = new THREE.SphereGeometry(0.052, 16, 12).scale(0.8, 1.15, 0.7).translate(at.x, at.y - 0.03, at.z);
    return [plain(g), plain(hand)];
  };
  return G.merge([body, ...sleeve([0.21, 0.73, 0.02], [0.36, 0.6, 0.18], [0.3, 0.74, 0.5]), ...sleeve([-0.21, 0.73, 0.02], [-0.35, 0.52, 0.06], [-0.3, 0.36, 0.2])]);
}

/** A figure in limelight. It does not care about the hall lights: in the pit it has a lamp of its own. */
function limelit(additive: boolean): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uGain: { value: 1 }, uTint: { value: new THREE.Color(0xd4e6ff) } },
    vertexShader: /* glsl */ `attribute float shade; varying vec3 vN; varying float vS;
      void main() { vN = normal; vS = shade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uGain; uniform vec3 uTint; varying vec3 vN; varying float vS;
      void main() {
        float d = max(dot(normalize(vN), normalize(vec3(0.45, 0.55, 1.0))), 0.0);
        gl_FragColor = vec4(uTint * (0.08 + 0.92 * pow(d, 0.85)) * vS * uGain, 1.0);
        #include <colorspace_fragment>
      }`,
    ...(additive ? { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false } : {}),
  });
}

/** Cloth hung in folds. */
function drape(w: number, h: number, folds: number, depth: number, scallop = 0): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h, folds * 10, scallop ? 8 : 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), a = (x / w) * folds * Math.PI * 2;
    p.setZ(i, depth * Math.sin(a + 0.6 * Math.sin(a * 0.37)));
    if (scallop) { const low = 0.5 - p.getY(i) / h; p.setY(i, p.getY(i) - scallop * low * Math.abs(Math.sin(a * 0.25))); }
  }
  g.computeVertexNormals();
  return g;
}

/** Pepper's ghost: a sheet of glass leans out over a pit in front of the stage and mirrors a lit figure lying hidden in it. */
export function peppersGhost(): Built {
  const root = G.group();
  const FLOOR = 0.6, FRONT = 0.1, BACK = -1.0, APRON = 1.3;
  const black = M.black(), pitch = M.cloth(0x0b0b0d), timber = M.wood(0x3a2a1c);
  // the stage: boards running up and down stage, black drops behind and at the sides
  root.add(G.box(2.44, FLOOR - 0.03, 1.1, timber, [0, (FLOOR - 0.03) / 2, -0.45], 0.01), G.box(2.4, 0.03, 1.1, M.wood(0x7a5632, 2), [0, FLOOR - 0.015, -0.45], 0.004));
  root.add(G.box(2.44, 1.5, 0.03, pitch, [0, FLOOR + 0.75, BACK], 0), G.box(0.03, 1.5, 1.1, pitch, [-1.205, FLOOR + 0.75, -0.45], 0), G.box(0.03, 1.5, 1.1, pitch, [1.205, FLOOR + 0.75, -0.45], 0));
  // real furniture, so the ghost has a room to walk into
  const oak = M.wood(0x8a5a30), oakY = M.wood(0x8a5a30, 1);
  const table = G.group(G.rbox(0.52, 0.035, 0.36, 0.012, oak, [0, 0.42, 0]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) table.add(G.cyl(0.02, 0.4, oakY, [sx * 0.22, 0.2, sz * 0.14], 16, 0.014));
  table.add(G.cyl(0.05, 0.012, M.brass(), [0.1, 0.444, 0], 20), G.cyl(0.016, 0.16, M.ceramic(), [0.1, 0.53, 0], 14), G.sph(0.018, M.glow(0xffc070, 2.4), [0.1, 0.63, 0], 10).rotateX(0), halo(0xffb060, 0.3, [0.1, 0.63, 0], 0.7));
  table.position.set(0.7, FLOOR, -0.62);
  const chair = G.group(G.rbox(0.26, 0.03, 0.26, 0.01, oak, [0, 0.25, 0]));
  for (const sx of [-1, 1]) { chair.add(G.cyl(0.016, 0.25, oakY, [sx * 0.11, 0.125, 0.11], 12), G.cyl(0.016, 0.62, oakY, [sx * 0.11, 0.31, -0.11], 12)); }
  chair.add(G.rbox(0.26, 0.07, 0.022, 0.008, oak, [0, 0.56, -0.11]), G.rbox(0.26, 0.04, 0.02, 0.008, oak, [0, 0.43, -0.11]));
  chair.position.set(0.5, FLOOR, -0.25); chair.rotation.y = 2.5;
  root.add(table, chair);
  // the pit: lined in black, open to the glass above, hidden from the house by the front wall
  root.add(G.box(2.44, 0.03, APRON - FRONT, black, [0, 0.015, (APRON + FRONT) / 2], 0), G.box(2.4, FLOOR - 0.04, 0.01, pitch, [0, FLOOR / 2, FRONT + 0.006], 0));
  // masking flats at the sides: from the house you must not see past the glass into the wings
  for (const sx of [-1, 1]) root.add(G.box(0.04, 1.92, APRON - FRONT + 0.1, black, [sx * 1.2, 0.96, (APRON + FRONT) / 2 + 0.05], 0));
  root.add(G.box(2.44, 0.78, 0.06, timber, [0, 0.39, APRON + 0.03]), G.box(0.66, 0.025, 1.14, black, [0, 0.045, 0.68], 0));
  // the limelight that makes the hidden figure bright enough to show in the glass
  root.add(G.rbox(0.3, 0.2, 0.16, 0.02, M.dark(), [0.82, 0.5, APRON - 0.1]), G.cyl(0.07, 0.03, M.glow(0xfff2d0, 2.2), [0.82, 0.5, APRON - 0.19], 24).rotateX(Math.PI / 2), halo(0xfff2d0, 0.5, [0.82, 0.5, APRON - 0.22], 0.6));
  const geo = shroud();
  const actor = new THREE.Mesh(geo, limelit(false));
  const LIE = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
  root.add(actor);
  // the glass: bottom edge on the stage front, top edge leaning out towards the house
  const L = Math.hypot(APRON - FRONT, APRON - FRONT);
  const glass = G.pane(2.36, L, 0.014, [0, FLOOR + (APRON - FRONT) / 2, (APRON + FRONT) / 2], 0xb9c9c6, 0.05); glass.rotation.x = Math.PI / 4;
  const win = opening(new THREE.PlaneGeometry(2.36, L), [0, FLOOR + (APRON - FRONT) / 2 - 0.006, (APRON + FRONT) / 2 + 0.006]); win.rotation.x = Math.PI / 4;
  // what the house sees: the same figure, mirrored in the plane of the glass, and only where the glass is
  const MIRROR = mirror([0, FLOOR, FRONT], [0, -1, 1]);
  const ghostMat = limelit(true);
  const ghost = new THREE.Mesh(geo, ghostMat); ghost.matrixAutoUpdate = false; ghost.frustumCulled = false;
  const image = G.group(ghost);
  portal([win], image, { additive: true, solid: true });
  root.add(glass, win, image);
  // proscenium, curtains and float
  const plaster = M.enamel(0xd8d2c0), velvet = M.cloth(0x6e1616);
  for (const sx of [-1, 1]) {
    root.add(G.box(0.22, 2.12, 0.22, plaster, [sx * 1.33, 1.06, APRON + 0.14]), G.box(0.28, 0.08, 0.28, plaster, [sx * 1.33, 1.86, APRON + 0.14]));
    const c = new THREE.Mesh(drape(0.34, 1.12, 3, 0.03), velvet); c.position.set(sx * 1.04, 1.34, APRON + 0.07); root.add(c);
  }
  const valance = new THREE.Mesh(drape(2.44, 0.2, 14, 0.022, 0.09), velvet); valance.position.set(0, 1.84, APRON + 0.09);
  root.add(valance, G.box(2.9, 0.22, 0.24, plaster, [0, 2.03, APRON + 0.14]), G.box(3.0, 0.05, 0.3, plaster, [0, 2.16, APRON + 0.14]));
  root.add(G.box(2.2, 0.05, 0.07, M.brass(), [0, 0.805, APRON + 0.02], 0.01), G.box(2.1, 0.02, 0.006, M.glow(0xffd9a0, 1.4), [0, 0.81, APRON - 0.018], 0));
  // border lights: the room on stage is lit whether or not the hall is
  // hung behind the glass: a lamp in front of it would show as a bright spot in the pane
  const foot = new THREE.PointLight(0xffe2b8, 1.5, 4.5, 1.5); foot.position.set(0, 1.85, -0.1);
  root.add(foot);
  const turn = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  return {
    root, inDark: 'better', view: [16, 11], eye: { at: [0, 1.22, 5.4], to: [0, 1.16, -0.3], label: 'Sit down', fov: 26, play: 0.11 },
    update: ({ t, lights }) => {
      actor.position.set(-0.22 + Math.sin(t * 0.45) * 0.36, 0.2, FRONT + 0.025 + 0.012 * Math.sin(t * 1.3));
      actor.quaternion.copy(LIE).multiply(turn.setFromAxisAngle(UP, Math.sin(t * 0.6) * 0.45));
      actor.updateMatrix();
      ghost.matrix.multiplyMatrices(MIRROR, actor.matrix); ghost.matrixWorldNeedsUpdate = true;
      ghostMat.uniforms.uGain.value = 0.95 - 0.45 * lights; // a reflection shows best against a dark stage
    },
  };
}

/** Fog screen: a thin sheet of fog falls between two curtains of air and a projector lights it from behind. You can walk through it. */
export function fogScreen(): Built {
  const root = G.group();
  const W = 2.0, H = 1.86, TOP = 2.02, cy = TOP - H / 2 - 0.01;
  root.add(G.rbox(2.42, 0.32, 0.52, 0.07, M.plastic(0x1d1f22, 0.5), [0, TOP + 0.16, 0]), G.box(2.12, 0.02, 0.06, M.black(), [0, TOP - 0.006, 0], 0));
  const grille = vents(1.9, 0.34, 16, [0, TOP + 0.321, 0], true); grille.rotation.x = -Math.PI / 2;
  root.add(grille);
  for (const sx of [-1, 1]) root.add(G.cyl(0.04, TOP, M.steel(1), [sx * 1.15, TOP / 2, 0], 24), G.cyl(0.3, 0.04, M.dark(), [sx * 1.15, 0.02, 0], 40));
  const uT = { value: 0 };
  const fogMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.62, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  fogMat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uT;\nvarying vec3 vObj;\n${NOISE}`).replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
      float fn = vnoise(vec3(vObj.x * 2.6, vObj.y * 1.5 + uT * 0.9, uT * 0.2)) * 0.6 + vnoise(vec3(vObj.x * 9.0, vObj.y * 3.6 + uT * 1.8, 3.0)) * 0.4;
      float fall = (vObj.y + ${(H / 2).toFixed(3)}) / ${H.toFixed(3)};
      // even at the slot, ragged by the time it reaches the floor
      diffuseColor.a *= mix(0.25 + 0.95 * fn, 0.75, fall * fall) * smoothstep(0.0, 0.14, ${(W / 2).toFixed(3)} - abs(vObj.x)) * (0.5 + 0.5 * fall);`);
  };
  fogMat.customProgramCacheKey = () => 'fog';
  const img = screen(512, 448);
  const imgMat = M.add(img, 0xffffff, 0.9);
  root.add(G.plane(W, H, fogMat, [0, cy, 0]), G.plane(W, H, imgMat, [0, cy, 0.004]));
  // the projector stands behind and shines through
  const pz = -1.7, py = 0.95;
  const proj = G.group(G.rbox(0.56, 0.24, 0.46, 0.035, M.plastic(0x25272b, 0.5)), G.cyl(0.085, 0.14, M.dark(), [0.12, 0, 0.28], 32).rotateX(Math.PI / 2), G.cyl(0.07, 0.01, M.glow(0xffffff, 2.6), [0.12, 0, 0.352], 28).rotateX(Math.PI / 2), halo(0xdfeeff, 0.5, [0.12, 0, 0.36], 0.6));
  const side = vents(0.3, 0.14, 6, [0.281, 0, 0]); side.rotation.y = Math.PI / 2; proj.add(side);
  proj.position.set(-0.12, py, pz);
  const cone = new THREE.BufferGeometry();
  const a: V3 = [0, py, pz + 0.36], c: V3[] = [[-W / 2, cy - H / 2, 0], [W / 2, cy - H / 2, 0], [W / 2, cy + H / 2, 0], [-W / 2, cy + H / 2, 0]];
  cone.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 2, 3].flatMap((i) => [...a, ...c[i], ...c[(i + 1) % 4]]), 3));
  const throwMat = M.add(null, 0xffffff, 0.04);
  root.add(proj, new THREE.Mesh(cone, throwMat), post([-0.12, py - 0.12, pz], 0, 0.03), G.cyl(0.24, 0.03, M.dark(), [-0.12, 0.015, pz], 32));
  return {
    root, inDark: 'better', glow: 0xcfe8ff, view: [22, 10], surface: img.canvas,
    update: ({ t, lights, camera }) => {
      uT.value = t;
      const c2 = img.ctx;
      c2.fillStyle = '#000'; c2.fillRect(0, 0, 512, 448);
      bigTime(c2, 512, 448, now().hhmmss, '#dff1ff', 800, 0.36);
      // turbulence smears the picture more the further the fog has fallen
      c2.fillStyle = 'rgba(0,0,0,.5)';
      for (let x = 0; x < 512; x += 9) { const h = 40 + 30 * Math.sin(x * 0.2 + t * 3); c2.fillRect(x + 4 * Math.sin(t * 2 + x), 448 - h * 3, 3, h * 3); }
      img.tex.needsUpdate = true;
      // fog throws light forward, so the picture is brightest when you face the projector through it
      const p = root.worldToLocal(camera.position.clone()), facing = Math.max(0, p.z / Math.hypot(p.x, p.z, 0.001));
      imgMat.opacity = (1 - 0.78 * lights) * (0.4 + 0.6 * facing);
      throwMat.opacity = 0.06 - 0.045 * lights;
    },
  };
}

/** Persistence of vision: one bar of LEDs, spun fast enough that the eye fills in the disc. */
export function pov(): Built {
  const root = G.group();
  root.add(G.cyl(0.62, 0.06, M.dark(), [0, 0.03, -0.25], 56), G.cyl(0.05, 1.2, M.steel(1), [0, 0.65, -0.25], 24), G.rbox(0.3, 0.3, 0.34, 0.05, M.plastic(0x1d1f22, 0.5), [0, 1.25, -0.22]));
  const side = vents(0.2, 0.18, 5, [0.151, 1.25, -0.22]); side.rotation.y = Math.PI / 2;
  root.add(side, G.cyl(0.035, 0.12, M.steel(), [0, 1.25, -0.02], 20).rotateX(Math.PI / 2));
  const rotor = G.group(); rotor.position.set(0, 1.25, 0.05);
  const armMat = M.plastic(0x1a1b1d, 0.5); armMat.transparent = true;
  const ledMat = M.glow(0x9fe0ff, 2);
  rotor.add(G.cyl(0.09, 0.04, M.dark(), undefined, 32).rotateX(Math.PI / 2));
  for (const s of [1, -1]) {
    rotor.add(G.rbox(0.075, 0.98, 0.016, 0.006, armMat, [0, s * 0.5, 0]));
    for (let i = 0; i < 18; i++) rotor.add(G.sph(0.016, ledMat, [0, s * (0.08 + i * 0.051), 0.012], 10));
  }
  const s = screen(512, 512);
  const imgMat = M.add(s, 0xffffff, 0);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 72), imgMat); disc.position.set(0, 1.25, 0.062);
  root.add(rotor, disc);
  const c = s.ctx;
  let angle = 0, last = 0;
  return {
    root, inDark: 'glows', glow: 0x7fd0ff, view: [16, 6], surface: s.canvas,
    update: ({ t }) => {
      const dt = Math.min(0.1, t - last); last = t;
      // spin up, hold, spin down: at low speed you can see it is only a bar
      const u = (t + 3.2) % 14;
      const speed = u < 2 ? 0.12 : u < 4 ? 0.12 + ((u - 2) / 2) * 0.88 : u < 12 ? 1 : 1 - ((u - 12) / 2) * 0.88;
      angle += dt * speed * 42; rotor.rotation.z = angle;
      const k = Math.max(0, (speed - 0.35) / 0.65);
      imgMat.opacity = k; armMat.opacity = 1 - 0.8 * k;
      c.fillStyle = '#000'; c.fillRect(0, 0, 512, 512);
      c.strokeStyle = '#59c8ff'; c.lineWidth = 6;
      for (const r of [236, 150]) { c.beginPath(); c.arc(256, 256, r, t * 0.5, t * 0.5 + 5.2); c.stroke(); }
      c.save(); c.translate(0, 176); dotMatrix(c, 512, 160, now().hhmm, '#e4f7ff', null, true, 0.8, 0); c.restore();
      // the picture is made of concentric tracks, one per LED
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 3;
      for (let r = 14; r < 256; r += 13) { c.beginPath(); c.arc(256, 256, r, 0, 7); c.stroke(); }
      s.tex.needsUpdate = true;
    },
  };
}

const helix: V3[] = [];
for (let i = 0; i < 900; i++) {
  const u = i / 900, a = u * Math.PI * 7, y = 0.46 + u * 0.8;
  if (i % 45 < 13) { const k = (i % 45) / 12; helix.push([Math.cos(a) * 0.34 * (1 - 2 * k), y, Math.sin(a) * 0.34 * (1 - 2 * k)]); }
  else helix.push(i % 2 ? [Math.cos(a) * 0.34, y, Math.sin(a) * 0.34] : [-Math.cos(a) * 0.34, y, -Math.sin(a) * 0.34]);
}

/** Swept volume: a screen spins inside a dome and a fast projector lights each point as the screen passes through it. */
export function sweptVolume(): Built {
  const root = G.group();
  const vox = voxels(helix, 0.05);
  const scr = new THREE.Mesh(new THREE.CircleGeometry(0.62, 56), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, roughness: 1, side: THREE.DoubleSide, depthWrite: false }));
  scr.position.y = 0.86;
  const dome = G.lathe([[0.9, 0.34], [0.9, 0.7], [0.86, 1.0], [0.7, 1.28], [0.4, 1.46], [0, 1.52]], M.bulb(0x9fb1ae, 0.6), 80, true);
  root.add(G.cyl(1.0, 0.34, M.plastic(0x1d1f22, 0.45), [0, 0.17, 0], 72), G.cyl(1.01, 0.03, M.steel(), [0, 0.3, 0], 72), G.cyl(0.9, 0.012, M.black(), [0, 0.346, 0], 72), scr, vox.points, dome, G.cyl(0.05, 0.08, M.steel(), [0, 0.38, 0], 20));
  for (let i = 0; i < 6; i++) { const v = vents(0.3, 0.14, 5, [Math.sin(i * 1.047) * 1.001, 0.15, Math.cos(i * 1.047) * 1.001]); v.rotation.y = i * 1.047; root.add(v); }
  const col = new THREE.Color();
  return {
    root, inDark: 'glows', glow: 0x8fd0ff, view: [24, 14],
    update: ({ t }) => {
      const th = t * 3.2;
      scr.rotation.y = -th;
      helix.forEach((p, i) => {
        const d = Math.abs(Math.sin(Math.atan2(p[2], p[0]) - th)); // 0 when the screen is passing this point
        const k = 0.2 + 0.8 * Math.exp(-d * 5);
        col.setHSL(0.52 + ((p[1] - 0.4) / 0.85) * 0.3, 0.9, 0.6);
        vox.col.set([col.r * k, col.g * k, col.b * k], i * 3);
      });
      vox.flush();
    },
  };
}

/** Static volume: a stack of liquid crystal sheets. One at a time turns milky and catches its slice of the picture. */
export function staticVolume(): Built {
  const root = G.group();
  const LAYERS = 12, S = 1.3, cy = 1.0;
  const pts: V3[] = [], layerOf: number[] = [];
  for (let i = 0; i < 1300; i++) {
    const a = (i / 1300) * Math.PI * 2 * 3, b = (i / 1300) * Math.PI * 2 * 2;
    const r = 0.36 + 0.14 * Math.cos(a);
    const z = 0.14 * Math.sin(a) * 3.2;
    const k = Math.max(0, Math.min(LAYERS - 1, Math.round((z / (S * 0.9) + 0.5) * (LAYERS - 1))));
    pts.push([r * Math.cos(b), cy + r * Math.sin(b), (k / (LAYERS - 1) - 0.5) * S * 0.9]); layerOf.push(k);
  }
  const vox = voxels(pts, 0.045);
  const sheets = Array.from({ length: LAYERS }, (_, k) => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.03, roughness: 1, side: THREE.DoubleSide, depthWrite: false });
    root.add(G.plane(S, S, m, [0, cy, (k / (LAYERS - 1) - 0.5) * S * 0.9]));
    return m;
  });
  // the cabinet: a frame round the stack, the projector in a box behind
  const fr = M.dark(1), h = S / 2 + 0.03;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.box(0.05, S + 0.12, 0.05, fr, [sx * h, cy, sz * h]));
  for (const sy of [-1, 1]) root.add(G.box(S + 0.11, 0.05, S + 0.11, M.plastic(0x1d1f22, 0.5), [0, cy + sy * (h + 0.025), 0]));
  root.add(vox.points, G.rbox(S + 0.11, S + 0.16, 0.9, 0.04, M.plastic(0x1d1f22, 0.5), [0, cy, -h - 0.47]), vents(0.9, 0.5, 9, [0, cy, -h - 0.921]), feet(S + 0.11, S + 1.0, 0.07, 0.3, 0).translateZ(-0.45));
  root.add(G.cyl(0.11, 0.05, M.dark(), [0, cy, -h - 0.02], 32).rotateX(Math.PI / 2), G.cyl(0.09, 0.006, M.glow(0xfff2e0, 1.6), [0, cy, -h + 0.008], 28).rotateX(Math.PI / 2));
  const col = new THREE.Color();
  return {
    root, inDark: 'glows', glow: 0xffb070, view: [32, 12],
    update: ({ t }) => {
      const live = Math.floor(t * 7) % LAYERS; // slowed far down: the real stack cycles every sheet about fifty times a second
      sheets.forEach((m, k) => { m.opacity = k === live ? 0.3 : 0.025; });
      pts.forEach((_, i) => { const k = layerOf[i] === live ? 1 : 0.3; col.setHSL(0.06 + (layerOf[i] / LAYERS) * 0.12, 1, 0.6); vox.col.set([col.r * k, col.g * k, col.b * k], i * 3); });
      vox.flush();
    },
  };
}

const knot = (cx: number, cy: number, cz: number, s: number) => (u: number): V3 => {
  const a = u * Math.PI * 2;
  return [cx + s * (Math.sin(a) + 2 * Math.sin(2 * a)) / 3, cy + s * (Math.cos(a) - 2 * Math.cos(2 * a)) / 3, cz + s * -Math.sin(3 * a) / 2.4];
};
const rainbow = (u: number): V3 => { const c = new THREE.Color().setHSL(u, 1, 0.6); return [c.r, c.g, c.b]; };

/** A figure drawn in the air by one moving point: every place it has just been is still fading in the eye. */
function airTrail(n: number, size: number, path: (u: number) => V3, colour: (u: number) => V3) {
  const g = glows(n, size);
  const trace = (phase: number) => {
    for (let i = 0; i < n; i++) {
      const u = i / n, age = (((phase - u) % 1) + 1) % 1, k = 0.14 + 0.86 * Math.pow(1 - age, 3), c = colour(u);
      g.pos.set(path(u), i * 3); g.col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
    }
    g.flush(true);
  };
  trace(0); g.points.geometry.computeBoundingBox();
  return { points: g.points, trace };
}

/** Optical trap display: one speck of cellulose held in a laser beam, dragged around and lit in colour as it goes. */
export function opticalTrap(): Built {
  const root = G.group();
  root.add(breadboard(2.3, 1.4, 0.08), feet(2.3, 1.4, 0.06, 0.06, -0.06));
  const Y = 0.46;
  // the trapping laser: violet and nearly invisible, folded up through a lens by a mirror
  const laser = G.group(G.cyl(0.09, 0.74, M.steel(1), undefined, 32), G.cyl(0.095, 0.06, M.dark(), [0, 0.36, 0], 32), G.cyl(0.095, 0.06, M.dark(), [0, -0.36, 0], 32));
  laser.rotation.z = Math.PI / 2; laser.position.set(-0.68, Y, 0);
  const fold = G.group(G.cyl(0.11, 0.016, M.chrome(), undefined, 32), G.cyl(0.12, 0.03, M.dark(), [0, -0.022, 0], 32)); fold.rotation.z = -Math.PI / 4; fold.position.set(0.25, Y, 0);
  const objective = lens(0.14, [0.25, 0.78, 0], 0.32); objective.rotation.x = Math.PI / 2;
  root.add(laser, fold, objective, post([-0.9, Y - 0.09, 0], 0.08), post([-0.46, Y - 0.09, 0], 0.08), post([0.25, Y - 0.09, 0], 0.08), post([0.44, 0.78, 0], 0.08), G.rod([0.44, 0.78, 0], [0.39, 0.78, 0], 0.02, M.steel(), 10));
  // three small lasers colour the speck as it passes
  root.add(G.rbox(0.34, 0.2, 0.3, 0.03, M.plastic(0x1d1f22, 0.5), [-0.3, 0.62, -0.48]), post([-0.3, 0.52, -0.48], 0.08));
  [0xff3020, 0x30ff50, 0x3060ff].forEach((hue, i) => root.add(G.cyl(0.03, 0.03, M.glow(hue, 2.2), [-0.38 + i * 0.08, 0.63, -0.32], 16).rotateX(Math.PI / 2), halo(hue, 0.16, [-0.38 + i * 0.08, 0.63, -0.3], 0.5)));
  const path = knot(0.25, 1.36, 0, 0.42);
  const trail = airTrail(520, 0.07, path, rainbow);
  const speck = halo(0xffffff, 0.2);
  const b0 = beam(0xa070ff, 0.5), b1 = beam(0xa070ff, 0.5);
  b0.aim([-0.3, Y, 0], [0.25, Y, 0]);
  root.add(trail.points, speck, b0.line, b1.line);
  return {
    root, inDark: 'better', glow: 0xb090ff, view: [26, 12],
    update: ({ t }) => {
      const ph = (t * 0.35) % 1;
      trail.trace(ph);
      const p = path(ph);
      speck.position.set(p[0], p[1], p[2]);
      b1.aim([0.25, Y, 0], p);
    },
  };
}

/** Acoustic levitation display: ultrasound from two arrays holds a bead in the air and throws it around a figure. */
export function acousticLev(): Built {
  const root = G.group();
  const K = 12, N = K * K, P = 0.105;
  for (const [y, flip] of [[0.22, 1], [1.76, -1]] as const) {
    const can = new Swarm(new THREE.CylinderGeometry(0.046, 0.046, 0.09, 20), M.steel(1), N);
    const tops = new Swarm(new THREE.CylinderGeometry(0.036, 0.036, 0.008, 20), M.plastic(0x0d0e0f, 0.7), N);
    for (let i = 0; i < N; i++) { const x = ((i % K) - (K - 1) / 2) * P, z = (Math.floor(i / K) - (K - 1) / 2) * P; can.put(i, x, y + flip * 0.075, z); tops.put(i, x, y + flip * 0.122, z); }
    can.done(); tops.done();
    root.add(can.mesh, tops.mesh, G.box(K * P + 0.12, 0.03, K * P + 0.12, M.pcb(), [0, y + flip * 0.015, 0], 0.004), G.box(K * P + 0.18, 0.06, K * P + 0.18, M.dark(), [0, y - flip * 0.03, 0]));
  }
  const half = (K * P) / 2 + 0.04;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.cyl(0.024, 1.6, M.steel(1), [sx * half, 0.99, sz * half], 16));
  root.add(feet(K * P + 0.18, K * P + 0.18, 0.06, 0.16, 0));
  // the figure the bead draws: a butterfly, flown fast enough that the whole outline is seen at once
  const path = (u: number): V3 => { const a = u * Math.PI * 2, r = 0.36 * (0.55 + 0.45 * Math.cos(4 * a)) * (1 - 0.35 * Math.sin(a) ** 2); return [r * Math.sin(a) * 1.25, 0.99 + r * Math.cos(a) * 0.9, 0.16 * Math.sin(2 * a)]; };
  const trail = airTrail(480, 0.065, path, rainbow);
  const bead = G.sph(0.022, M.plastic(0xffffff, 0.6), undefined, 14);
  const spark = halo(0xffffff, 0.16);
  root.add(trail.points, bead, spark);
  return {
    root, inDark: 'better', glow: 0xff9ad0, view: [28, 10],
    update: ({ t }) => {
      const ph = (t * 0.45) % 1;
      trail.trace(ph);
      const p = path(ph); bead.position.set(p[0], p[1], p[2]); spark.position.copy(bead.position);
      (spark.material as THREE.SpriteMaterial).color.setHSL(ph, 1, 0.65);
    },
  };
}

/** Laser plasma: a pulsed laser focused so tightly that the air itself flashes at the focal point. */
export function laserPlasma(): Built {
  const root = G.group();
  root.add(breadboard(2.3, 1.2, 0.08), feet(2.3, 1.2, 0.06, 0.06, -0.06));
  // the laser head, with fins: nearly all of the power ends up as heat
  root.add(G.rbox(1.05, 0.3, 0.42, 0.04, M.plastic(0x2a2c30, 0.5), [-0.52, 0.27, 0]), G.cyl(0.05, 0.08, M.dark(), [0.04, 0.27, 0], 20).rotateZ(Math.PI / 2));
  const fins = vents(0.9, 0.34, 14, [-0.52, 0.421, 0], true); fins.rotation.x = -Math.PI / 2; root.add(fins);
  // scanner: two mirrors steer the beam, a lens that changes focus sets the height
  root.add(G.rbox(0.38, 0.38, 0.38, 0.04, M.dark(), [0.48, 0.31, 0]), screws([[0.34, 0.44, 0.191], [0.62, 0.44, 0.191], [0.34, 0.18, 0.191], [0.62, 0.18, 0.191]], 0.016));
  const obj = lens(0.2, [0.48, 0.64, 0], 0.3); obj.rotation.x = Math.PI / 2;
  root.add(obj, G.cyl(0.22, 0.1, M.dark(), [0.48, 0.55, 0], 40));
  const b = beam(0xff5050, 0.3); b.aim([0.08, 0.27, 0], [0.29, 0.27, 0]); root.add(b.line);
  // the figure: a small cube drawn corner to corner in points of plasma
  const pts: V3[] = [];
  const corners: V3[] = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) for (let k = 0; k <= 12; k++) {
    const u = k / 12; pts.push([0.48 + (corners[i][0] + (corners[j][0] - corners[i][0]) * u) * 0.24, 1.32 + (corners[i][1] + (corners[j][1] - corners[i][1]) * u) * 0.24, (corners[i][2] + (corners[j][2] - corners[i][2]) * u) * 0.24]);
  }
  const vox = voxels(pts, 0.075);
  const c1 = beam(0xa8c8ff, 0.4), c2 = beam(0xa8c8ff, 0.4);
  const flash = halo(0xcfe0ff, 0.26);
  root.add(vox.points, c1.line, c2.line, flash);
  const spin = new THREE.Matrix4(), p = new THREE.Vector3();
  return {
    root, inDark: 'better', glow: 0xa8c8ff, view: [24, 10],
    update: ({ t }) => {
      vox.points.rotation.y = t * 0.4; vox.points.position.set(0.48 - 0.48 * Math.cos(t * 0.4), 0, 0.48 * Math.sin(t * 0.4));
      // one point of plasma exists at a time; the rest is afterimage
      const hot = Math.floor(t * 240) % pts.length;
      for (let i = 0; i < pts.length; i++) { const age = (hot - i + pts.length) % pts.length, k = 0.26 + 0.74 * Math.exp(-age / 14); vox.col.set([0.62 * k, 0.78 * k, k], i * 3); }
      vox.flush();
      spin.makeRotationY(t * 0.4);
      p.set(pts[hot][0] - 0.48, pts[hot][1], pts[hot][2]).applyMatrix4(spin);
      flash.position.set(p.x + 0.48, p.y, p.z);
      c1.aim([0.32, 0.66, 0], [p.x + 0.48, p.y, p.z]); c2.aim([0.64, 0.66, 0], [p.x + 0.48, p.y, p.z]);
    },
  };
}
