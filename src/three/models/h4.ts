import { G, M, Swarm, beam, halo, screen, THREE, type Built, type V3 } from '../kit';
import { breadboard, feet, lens, post, tripod, vents } from '../parts';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { bigTime, clockStrokes, dots, hsl, now, segClock } from '../../sims/draw';

/** Liquid crystal display, pulled apart on a rail: lamp, polariser, the crystal between glass, colour filter, second polariser. */
export function lcd(): Built {
  const root = G.group();
  const W = 1.8, H = 1.15, y = 0.86;
  const film = (draw: (c: CanvasRenderingContext2D) => void, opacity: number) => {
    const s = screen(256, 160); draw(s.ctx); s.tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: s.tex, transparent: true, opacity, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false });
  };
  const lines = (vertical: boolean, col: string) => (c: CanvasRenderingContext2D) => {
    c.fillStyle = '#6f7782'; c.fillRect(0, 0, 256, 160); c.fillStyle = col;
    if (vertical) for (let x = 0; x < 256; x += 7) c.fillRect(x, 0, 1.5, 160);
    else for (let yy = 0; yy < 160; yy += 7) c.fillRect(0, yy, 256, 1.5);
  };
  const stripes = (c: CanvasRenderingContext2D) => { c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, 256, 160); ['#ff3b30', '#34d058', '#2f6bff'].forEach((col, k) => { c.fillStyle = col; for (let x = k * 4; x < 256; x += 12) c.fillRect(x, 0, 3.4, 160); }); };
  const cell = screen(384, 240), final = screen(384, 240);
  const cellMat = new THREE.MeshStandardMaterial({ map: cell.tex, transparent: true, opacity: 0.7, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const finalMat = M.lit(final, 1.3, 0.6); finalMat.transparent = true; finalMat.opacity = 0.95; finalMat.side = THREE.DoubleSide;
  // every layer rides in its own carrier on two rails, in the order the light meets them
  const carrier = (z: number) => root.add(G.bezel(W + 0.12, H + 0.12, W, H, 0.01, 0.03, M.steel(), [0, y, z], 0.02, 0.006), G.box(0.1, 0.16, 0.08, M.dark(), [-0.7, y - H / 2 - 0.12, z]), G.box(0.1, 0.16, 0.08, M.dark(), [0.7, y - H / 2 - 0.12, z]));
  const Z = [-0.86, -0.44, -0.04, 0.4, 0.84];
  Z.forEach(carrier);
  root.add(G.rbox(W + 0.12, H + 0.12, 0.08, 0.02, M.dark(), [0, y, Z[0] - 0.05]), G.plane(W, H, M.glow(0xf4f8ff, 1.0), [0, y, Z[0] + 0.004]));
  root.add(G.plane(W, H, film(lines(true, '#4d545d'), 0.5), [0, y, Z[1]]));
  root.add(G.pane(W, H, 0.04, [0, y, Z[2]]), G.plane(W, H, cellMat, [0, y, Z[2] + 0.022]));
  root.add(G.pane(W, H, 0.02, [0, y, Z[3] - 0.012]), G.plane(W, H, film(stripes, 0.55), [0, y, Z[3]]));
  root.add(G.plane(W, H, finalMat, [0, y, Z[4]]));
  for (const x of [-0.7, 0.7]) root.add(G.rod([x, y - H / 2 - 0.16, -1.0], [x, y - H / 2 - 0.16, 0.98], 0.022, M.steel(2), 14));
  root.add(G.rbox(W + 0.3, 0.05, 2.2, 0.02, M.dark(), [0, 0.025, 0]));
  for (const x of [-0.7, 0.7]) for (const z of [-0.95, 0.93]) root.add(G.box(0.1, y - H / 2 - 0.2, 0.1, M.dark(1), [x, (y - H / 2 - 0.2) / 2 + 0.03, z]));
  let stamp = -1;
  return {
    root, inDark: 'glows', glow: 0xdde8ff, view: [38, 12], surface: final.canvas,
    update: ({ t }) => {
      const n = now();
      if (n.s === stamp) return; stamp = n.s;
      // the crystal layer only sets how much each cell twists the light: a grey map with no colour in it
      cell.ctx.fillStyle = '#c9ced6'; cell.ctx.fillRect(0, 0, 384, 240);
      bigTime(cell.ctx, 384, 240, n.hhmmss, '#3b4048', 800, 0.5);
      cell.tex.needsUpdate = true;
      const c = final.ctx;
      const g = c.createLinearGradient(0, 0, 384, 240); g.addColorStop(0, hsl(205 + t, 60, 30)); g.addColorStop(1, hsl(260 + t, 55, 22));
      c.fillStyle = g; c.fillRect(0, 0, 384, 240);
      bigTime(c, 384, 240, n.hhmmss, '#ffe9a8', 800, 0.5);
      final.tex.needsUpdate = true;
    },
  };
}

/** Digital micromirror device: the chip, and a corner of its mirror field enlarged. Each mirror tips one way for light, the other for dark. */
export function dmd(): Built {
  const root = G.group();
  // the chip in its ceramic carrier, the mirror field under a window
  root.add(G.rbox(1.7, 0.13, 1.2, 0.02, M.ceramic(), [0, 0.065, 0]), G.box(1.16, 0.05, 0.8, M.black(), [0, 0.15, 0]), G.box(0.86, 0.012, 0.52, M.chrome(), [0, 0.18, 0], 0));
  const win = G.pane(1.0, 0.66, 0.03, [0, 0.21, 0]); win.rotation.x = -Math.PI / 2;
  root.add(win, G.bezel(1.2, 0.84, 0.98, 0.64, 0.01, 0.02, M.brass(), [0, 0.2, 0], 0.02, 0.005).rotateX(-Math.PI / 2));
  const lands = new Swarm(new THREE.BoxGeometry(0.032, 0.012, 0.07), M.brass(), 52);
  for (let i = 0; i < 26; i++) { lands.put(i, (i - 12.5) * 0.058, 0.132, -0.55); lands.put(26 + i, (i - 12.5) * 0.058, 0.132, 0.55); }
  lands.done(); root.add(lands.mesh);
  // a few mirrors enlarged several thousand times: each sits on a post over a pair of electrodes and rocks on its diagonal
  const COLS = 13, ROWS = 7, P = 0.13, N = COLS * ROWS;
  const mirrors = new Swarm(new RoundedBoxGeometry(0.12, 0.008, 0.12, 1, 0.003), M.chrome(), N);
  const posts = new Swarm(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), M.steel(), N);
  const pads = new Swarm(new THREE.BoxGeometry(0.1, 0.004, 0.04), M.brass(), N * 2);
  const DIAG = new THREE.Vector3(1, 0, 1).normalize();
  const tilt = new Float32Array(N);
  const at = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * P, (Math.floor(i / COLS) - (ROWS - 1) / 2) * P];
  for (let i = 0; i < N; i++) { const [x, z] = at(i); posts.put(i, x, -0.027, z); pads.put(i * 2, x, -0.05, z - 0.035); pads.put(i * 2 + 1, x, -0.05, z + 0.035); mirrors.spin(i, x, 0, z, DIAG, 0); mirrors.tint(i, 1, 1, 1); }
  posts.done(); pads.done(); mirrors.done();
  const lifted = G.group(mirrors.mesh, posts.mesh, pads.mesh, G.box(COLS * P + 0.08, 0.03, ROWS * P + 0.08, M.plastic(0x23262b, 0.4), [0, -0.068, 0], 0.006));
  lifted.position.set(0, 1.08, 0.05); lifted.rotation.x = 0.62;
  root.add(lifted);
  const a = COLS * P / 2, b = ROWS * P / 2;
  lifted.updateMatrixWorld(true);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const top = new THREE.Vector3(sx * a, -0.085, sz * b).applyMatrix4(lifted.matrixWorld);
    root.add(G.rod([sx * 0.43, 0.2, sz * 0.26], [top.x, top.y, top.z], 0.005, M.steel(), 6));
  }
  let first = true;
  return {
    root, inDark: 'vanishes', view: [24, 16],
    update: () => {
      const d = dots(now().hhmmss.slice(6));
      for (let i = 0; i < N; i++) {
        const on = d.on((i % COLS) - 1, Math.floor(i / COLS));
        tilt[i] += ((on ? 0.21 : -0.21) - tilt[i]) * (first ? 1 : 0.3);
        const [x, z] = at(i);
        mirrors.spin(i, x, 0, z, DIAG, tilt[i]);
        const v = on ? 1 : 0.3;
        mirrors.tint(i, v, v, v * 1.08);
      }
      first = false;
      mirrors.mesh.instanceMatrix.needsUpdate = true;
      if (mirrors.mesh.instanceColor) mirrors.mesh.instanceColor.needsUpdate = true;
    },
  };
}

/** Liquid crystal on silicon: a mirror-backed liquid crystal chip under a splitter cube, a lamp on one side and a lens on the other. */
export function lcos(): Built {
  const root = G.group();
  const s = screen(320, 240);
  const B = 0.08, AX = 0.62;
  root.add(breadboard(2.6, 1.3, B), feet(2.6, 1.3, 0.06, 0.06, -0.06));
  // the chip: a silicon die whose top is both the mirror and the pixel electrodes, in a carrier on a board
  root.add(G.box(0.9, 0.03, 0.7, M.pcb(), [-0.1, B + 0.015, 0], 0.004), G.rbox(0.62, 0.06, 0.48, 0.012, M.ceramic(), [-0.1, B + 0.06, 0]), G.box(0.4, 0.012, 0.3, M.plastic(0xc87b2a, 0.5), [-0.1, B + 0.02, 0.5], 0));
  const face = G.plane(0.54, 0.4, M.lit(s, 1.3, 0.9), [-0.1, B + 0.092, 0]); face.rotation.x = -Math.PI / 2;
  // polarising beam splitter: two prisms cemented on the diagonal
  const cube = G.box(0.5, 0.5, 0.5, M.glass(0x9fb6b8, 0.07, 0.5), [-0.1, AX, 0], 0.008);
  const coat = G.plane(0.7, 0.49, new THREE.MeshPhysicalMaterial({ color: 0x9fd0e8, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), [-0.1, AX, 0]);
  coat.rotation.order = 'ZXY'; coat.rotation.x = Math.PI / 2; coat.rotation.z = Math.PI / 4;
  for (const sx of [-1, 1]) root.add(G.box(0.03, AX - B - 0.26, 0.03, M.steel(1), [-0.1 + sx * 0.22, B + (AX - B - 0.26) / 2, 0.27], 0.004));
  root.add(G.box(0.56, 0.02, 0.1, M.dark(), [-0.1, AX - 0.26, 0.27]));
  // lamp with its heat sink
  const lamp = G.group(G.rbox(0.34, 0.36, 0.36, 0.03, M.dark()), G.cyl(0.1, 0.02, M.glow(0xffffff, 2.2), [0.171, 0, 0], 28).rotateZ(-Math.PI / 2));
  const fins = vents(0.32, 0.3, 9, [-0.171, 0, 0], true); fins.rotation.y = -Math.PI / 2; lamp.add(fins);
  lamp.position.set(-1.0, AX, 0);
  // projection lens and the little screen it throws on
  const barrel = G.group(G.cyl(0.19, 0.5, M.dark(), undefined, 40), G.cyl(0.2, 0.08, M.plastic(0x15171a, 0.35), [0, 0.2, 0], 40), lens(0.15, [0, 0.262, 0], 0.3).rotateX(Math.PI / 2));
  barrel.rotation.z = -Math.PI / 2; barrel.position.set(0.56, AX, 0);
  const shot = screen(320, 240);
  const scr = G.group(G.box(0.74, 0.58, 0.02, M.paper(0xe9e6dc), undefined, 0.004), G.plane(0.7, 0.54, M.add(shot), [0, 0, 0.012]));
  scr.position.set(1.12, AX + 0.02, -0.3); scr.rotation.y = -0.95;
  root.add(face, cube, coat, lamp, barrel, scr, post([-1.0, AX - 0.18, 0], B), post([0.56, AX - 0.19, 0], B), post([1.12, AX - 0.27, -0.3], B));
  const rays: [V3, V3, number][] = [[[-0.82, AX, 0], [-0.1, AX, 0], 0xffffff], [[-0.1, AX, 0], [-0.1, B + 0.1, 0], 0xffffff], [[-0.08, B + 0.1, 0], [-0.08, AX, 0], 0xffd27a], [[-0.08, AX, 0], [0.82, AX, 0], 0xffd27a], [[0.82, AX, 0], [1.02, AX + 0.2, -0.2], 0xffd27a], [[0.82, AX, 0], [1.2, AX - 0.16, -0.4], 0xffd27a]];
  for (const [a, b, col] of rays) { const r = beam(col, 0.7); r.aim(a, b); root.add(r.line); }
  return {
    root, inDark: 'glows', glow: 0xffe2b0, view: [28, 16], zoom: 1.08, surface: s.canvas,
    update: ({ lights }) => {
      for (const sc of [s, shot]) { sc.ctx.fillStyle = sc === s ? '#10131a' : '#000'; sc.ctx.fillRect(0, 0, 320, 240); bigTime(sc.ctx, 320, 240, now().hhmm, '#ffd27a', 800, 0.6); sc.tex.needsUpdate = true; }
      ((scr.children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1 - 0.6 * lights;
    },
  };
}

/** Eidophor: an electron beam dimples a film of oil on a mirror, and a grille of bars turns the dimples into light. The machine with its panels off. */
export function eidophor(): Built {
  const root = G.group();
  const dark = M.dark(), grey = M.enamel(0x6f777c);
  // frame and what is left of the cabinet: back and one side
  root.add(G.rbox(1.9, 0.1, 1.3, 0.03, dark, [0, 0.05, 0]), feet(1.9, 1.3, 0.07, 0.04, -0.04));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) root.add(G.box(0.06, 2.3, 0.06, M.steel(1), [sx * 0.6, 1.25, sz * 0.52]));
  root.add(G.box(1.26, 2.3, 0.03, grey, [0, 1.25, -0.56], 0.008), G.box(0.03, 2.3, 1.1, grey, [-0.63, 1.25, 0], 0.008), G.box(1.3, 0.05, 1.14, grey, [0, 2.42, 0]));
  for (const yy of [0.82, 1.6]) root.add(G.box(1.2, 0.03, 1.04, dark, [0, yy, 0], 0.006));
  root.add(vents(0.7, 0.5, 9, [0, 2.0, -0.576]).rotateY(Math.PI));
  // lower deck: the oil-coated mirror turning slowly in its vacuum bell, and the electron gun that writes on it
  const oil = new THREE.MeshPhysicalMaterial({ color: 0xcfd8e2, metalness: 1, roughness: 0.08, iridescence: 1, iridescenceIOR: 1.6, side: THREE.DoubleSide });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.9, 56, 20, 0, Math.PI * 2, Math.PI - 0.36, 0.36), oil);
  dish.position.set(0, 1.12, 0);
  const gun = G.group(G.cyl(0.06, 0.5, M.steel(1), undefined, 24), G.cyl(0.085, 0.1, M.brass(), [0, 0.24, 0], 24), G.cyl(0.045, 0.12, M.plastic(0x15171a, 0.5), [0, 0.34, 0], 16));
  gun.rotation.z = -0.82; gun.position.set(0.38, 0.52, 0);
  root.add(dish, gun, G.cyl(0.4, 0.08, dark, [0, 0.17, 0], 48), G.lathe([[0.46, 0.12], [0.46, 0.5], [0.42, 0.66], [0.3, 0.76], [0.12, 0.8]], M.bulb(0x9fb1ae, 0.6), 64, true));
  // middle deck: the bar mirror. Light comes in from the lamp house, drops to the oil, and only what a dimple has bent gets back up between the bars
  const bars = G.group();
  for (let i = 0; i < 7; i++) bars.add(G.box(0.016, 0.07, 0.46, M.chrome(), [0, (i - 3) * 0.12, 0], 0));
  bars.position.set(0, 1.2, 0); bars.rotation.z = Math.PI / 4;
  root.add(bars, G.bezel(0.74, 0.03, 0.5, 0.01, 0.004, 0.5, M.steel(), [0, 1.2, 0], 0.01, 0.004).rotateX(Math.PI / 2).rotateZ(0));
  const house = G.group(G.rbox(0.5, 0.6, 0.5, 0.04, grey), G.cyl(0.1, 0.02, M.glow(0xeaf2ff, 2.4), [0.251, 0, 0], 28).rotateZ(-Math.PI / 2), lens(0.14, [0.36, 0, 0], 0.3).rotateY(Math.PI / 2));
  const hv = vents(0.3, 0.3, 6, [0, 0.301, 0], true); hv.rotation.x = -Math.PI / 2; house.add(hv);
  house.position.set(-1.15, 1.2, 0);
  root.add(house, G.box(0.14, 1.16, 0.14, M.steel(1), [-1.15, 0.52, 0]), G.rbox(0.5, 0.08, 0.5, 0.02, dark, [-1.15, 0.04, 0]), halo(0xeaf2ff, 0.4, [-0.88, 1.2, 0], 0.5));
  // top deck: projection lens, a fold mirror, and the picture on a screen across the room
  const pl = G.group(G.cyl(0.16, 0.36, dark, undefined, 36), lens(0.13, [0, 0.19, 0], 0.3).rotateX(Math.PI / 2));
  pl.position.set(0, 1.8, 0);
  const fold = G.box(0.34, 0.02, 0.34, M.chrome(), [0, 2.16, 0], 0.004); fold.rotation.z = -Math.PI / 4;
  const s = screen(320, 240);
  const scr = G.group(G.box(0.86, 0.66, 0.02, M.paper(0xe9e6dc), undefined, 0.004), G.plane(0.8, 0.6, M.add(s), [0, 0, 0.012]));
  scr.position.set(1.12, 2.16, 0.12); scr.rotation.y = -Math.PI / 2 + 0.85;
  root.add(pl, fold, scr, G.cyl(0.03, 1.84, M.steel(1), [1.16, 0.92, 0.1], 16), G.cyl(0.24, 0.04, dark, [1.16, 0.02, 0.1], 32));
  const rays: [V3, V3, number][] = [[[-0.78, 1.2, 0], [0, 1.2, 0], 0xffffff], [[0, 1.2, 0], [0, 0.26, 0], 0xffffff], [[0.04, 0.26, 0], [0.04, 2.16, 0], 0xcfe0ff], [[0.04, 2.16, 0], [1.08, 2.16, 0.12], 0xcfe0ff]];
  for (const [a, b, col] of rays) { const r = beam(col, 0.6); r.aim(a, b); root.add(r.line); }
  const eb = beam(0x7fb0ff, 0.5); eb.aim([0.2, 0.34, 0], [0.0, 0.25, 0]); root.add(eb.line);
  return {
    root, inDark: 'glows', glow: 0xdde8ff, view: [30, 8], surface: s.canvas,
    update: ({ t, lights }) => {
      dish.rotation.y = t * 0.25;
      s.ctx.fillStyle = '#000'; s.ctx.fillRect(0, 0, 320, 240);
      bigTime(s.ctx, 320, 240, now().hhmmss, '#e9eef7', 800, 0.44);
      s.ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let yy = 0; yy < 240; yy += 3) s.ctx.fillRect(0, yy, 320, 1);
      s.tex.needsUpdate = true;
      ((scr.children[1] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 1 - 0.6 * lights;
      eb.aim([0.2, 0.34, 0], [0.12 * Math.sin(t * 9), 0.25, 0.1 * Math.sin(t * 2.3)]);
    },
  };
}

/** Scanned laser: two small mirrors on fast motors steer one beam. The eye sees the path, not the dot. */
export function laserScan(): Built {
  const root = G.group();
  const B = 0.08, y = 0.4;
  const base = breadboard(2.3, 1.5, B); base.position.z = 0.3;
  root.add(base, feet(2.3, 1.5, 0.06, 0.06, -0.06).translateZ(0.3));
  const cols = [0xff2a1a, 0x2aff5a, 0x2a6bff];
  cols.forEach((col, i) => {
    const z = 0.55 + (i - 1) * 0.3;
    // laser head: a finned barrel in a clamp
    const head = G.group(G.cyl(0.07, 0.5, M.steel(1), undefined, 28), G.cyl(0.03, 0.01, M.glow(col, 2), [0, 0.256, 0], 16));
    for (let k = 0; k < 5; k++) head.add(G.cyl(0.095, 0.014, M.dark(), [0, -0.18 + k * 0.05, 0], 28));
    head.rotation.z = -Math.PI / 2; head.position.set(-0.78, y, z);
    // a dichroic plate lets the colours behind it through and turns this one into the common path
    const plate = G.group(G.box(0.012, 0.18, 0.18, M.glass(col, 0.3, 0.3), undefined, 0), G.box(0.03, 0.03, 0.2, M.dark(), [0, -0.105, 0]));
    plate.rotation.y = Math.PI / 4; plate.position.set(-0.25, y, z);
    root.add(head, plate, post([-0.78, y - 0.07, z], B), post([-0.25, y - 0.12, z], B));
    const r = beam(col, 0.9); r.aim([-0.52, y, z], [-0.25, y, z]); root.add(r.line);
  });
  const merged = beam(0xffffff, 0.9); merged.aim([-0.25, y, 0.85], [-0.25, y, 0.12]); root.add(merged.line);
  const turn = G.box(0.012, 0.18, 0.18, M.chrome(), [-0.25, y, 0.1], 0); turn.rotation.y = -Math.PI / 4;
  const toGalvo = beam(0xffffff, 0.9); toGalvo.aim([-0.25, y, 0.1], [0.6, y, 0.1]); root.add(turn, toGalvo.line, post([-0.25, y - 0.1, 0.1], B));
  // galvanometers: one mirror swings the beam left and right, the next up and down
  const gx = G.group(G.cyl(0.085, 0.3, M.dark(), [0, -0.17, 0], 28), G.cyl(0.02, 0.06, M.steel(), [0, 0.01, 0], 12), G.box(0.13, 0.15, 0.008, M.chrome(), [0, 0.1, 0], 0));
  gx.position.set(0.6, y, 0.1);
  const gy = G.group(G.cyl(0.085, 0.3, M.dark(), [0, 0, 0.2], 28).rotateX(Math.PI / 2), G.box(0.15, 0.008, 0.13, M.chrome(), undefined, 0));
  gy.position.set(0.6, y + 0.3, 0.02);
  const up = beam(0xffffff, 0.9); up.aim([0.6, y, 0.1], [0.6, y + 0.3, 0.02]);
  root.add(gx, gy, up.line, G.rbox(0.2, y + 0.32, 0.16, 0.02, M.plastic(0x1d1f22, 0.5), [0.6, (y + 0.32) / 2 + B / 2, 0.36]));
  // the wall the figure lands on
  const s = screen(512, 384);
  s.ctx.fillStyle = '#000'; s.ctx.fillRect(0, 0, 512, 384);
  root.add(G.rbox(2.3, 1.6, 0.05, 0.02, M.plastic(0x2b2d30, 0.95), [0, 1.0, -0.62]), G.plane(2.2, 1.5, M.add(s), [0, 1.0, -0.59]), G.box(0.08, 0.3, 0.3, M.dark(), [-1.0, 0.15, -0.5]), G.box(0.08, 0.3, 0.3, M.dark(), [1.0, 0.15, -0.5]));
  const out = beam(0x9dffb0, 0.85); root.add(out.line);
  const spot = halo(0xffffff, 0.12);
  root.add(spot);
  return {
    root, inDark: 'better', glow: 0x40ff70, view: [24, 12], surface: s.canvas,
    update: ({ t }) => {
      const strokes = clockStrokes(now());
      const c = s.ctx;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, 512, 384);
      c.lineWidth = 3; c.lineCap = 'round'; c.shadowBlur = 9;
      strokes.forEach(([x0, y0, x1, y1], i) => {
        const col = i < 12 ? '#3dff6e' : i === 12 ? '#ff4a3a' : i === 13 ? '#5a8bff' : '#ffffff';
        c.strokeStyle = c.shadowColor = col;
        c.beginPath(); c.moveTo(256 + x0 * 165, 192 - y0 * 165); c.lineTo(256 + x1 * 165, 192 - y1 * 165); c.stroke();
      });
      c.shadowBlur = 0;
      s.tex.needsUpdate = true;
      // where the beam happens to be this instant
      const k = Math.floor(t * 47) % strokes.length, u = (t * 13) % 1;
      const [x0, y0, x1, y1] = strokes[k];
      const px = (x0 + (x1 - x0) * u) * 0.71, py = 1.0 + (y0 + (y1 - y0) * u) * 0.71;
      out.aim([0.6, y + 0.3, 0.02], [px, py, -0.585]);
      spot.position.set(px, py, -0.58);
      gx.rotation.y = px * 0.4; gy.rotation.z = (py - 1) * 0.4;
    },
  };
}

/** Projection mapping: an ordinary projector, and a picture cut to fit the plaster shapes it lands on. */
export function projectionMapping(): Built {
  const root = G.group();
  const FW = 512, FH = 384;
  const frame = screen(FW, FH);
  const plaster = () => M.plastic(0xd9d6cd, 0.95);
  root.add(G.rbox(2.6, 0.06, 3.0, 0.02, M.dark(), [0, 0.03, 0.35]));
  // a still life in white plaster: block and ball, cube, column, step
  const bust = G.sph(0.25, plaster(), [-0.52, 1.3, -0.5], 48); bust.scale.set(0.9, 1.15, 1);
  const solids: THREE.Mesh[] = [
    G.box(0.62, 1.0, 0.62, plaster(), [-0.52, 0.56, -0.5], 0.02), bust,
    G.box(0.5, 0.5, 0.5, plaster(), [0.18, 0.31, -0.3], 0.02), G.cyl(0.26, 1.3, plaster(), [0.74, 0.71, -0.65], 56), G.box(0.9, 0.2, 0.4, plaster(), [0.3, 0.16, 0.25], 0.016),
  ];
  solids[2].rotation.y = 0.5;
  root.add(...solids);
  // the projector, and where it stands
  const eye = new THREE.Vector3(0.1, 1.0, 1.75);
  const proj = G.group(G.rbox(0.56, 0.2, 0.44, 0.035, M.plastic(0x232528, 0.5)), G.cyl(0.085, 0.12, M.dark(), [0.1, 0, -0.26], 32).rotateX(Math.PI / 2), G.cyl(0.07, 0.01, M.glow(0xffffff, 2.6), [0.1, 0, -0.325], 28).rotateX(Math.PI / 2), halo(0xfff6e6, 0.4, [0.1, 0, -0.34], 0.5));
  const pv = vents(0.3, 0.12, 6, [-0.281, 0, 0]); pv.rotation.y = -Math.PI / 2; proj.add(pv);
  proj.position.set(eye.x - 0.1, eye.y, eye.z + 0.3); proj.rotation.x = 0.1;
  root.add(proj, tripod([eye.x - 0.1, eye.y - 0.1, eye.z + 0.3], 0.36, 0.06));
  // work out, for every point on the plaster, which part of the projector's picture lands there
  const cam = new THREE.PerspectiveCamera(36, FW / FH, 0.1, 10);
  cam.position.copy(eye); cam.lookAt(0.08, 0.72, -0.4); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
  const light = M.add(frame, 0xffffff, 1); light.vertexColors = true; light.side = THREE.FrontSide; light.polygonOffset = true; light.polygonOffsetFactor = -2; light.polygonOffsetUnits = -4;
  const rects: [number, number, number, number][] = [];
  root.updateMatrixWorld(true);
  const p = new THREE.Vector3(), nrm = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const m of solids) {
    const geo = m.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal;
    const uv = new Float32Array(pos.count * 2), col = new Float32Array(pos.count * 3);
    nm.getNormalMatrix(m.matrixWorld);
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      nrm.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      const facing = Math.max(0, nrm.dot(eye.clone().sub(p).normalize()));
      p.project(cam);
      const u = p.x * 0.5 + 0.5, v = p.y * 0.5 + 0.5;
      uv.set([u, v], i * 2);
      const k = Math.pow(facing, 0.7); col.set([k, k, k], i * 3);
      if (facing > 0.05) { x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const lit = new THREE.Mesh(geo, light);
    lit.position.copy(m.position); lit.rotation.copy(m.rotation); lit.scale.copy(m.scale);
    root.add(lit);
    rects.push([x0 * FW, (1 - y1) * FH, (x1 - x0) * FW, (y1 - y0) * FH]);
  }
  const throwGeo = new THREE.BufferGeometry();
  const far = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, yy]) => new THREE.Vector3(x, yy, 0.93).unproject(cam));
  throwGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 1, 2, 3].flatMap((i) => [eye.x, eye.y, eye.z, far[i].x, far[i].y, far[i].z, far[(i + 1) % 4].x, far[(i + 1) % 4].y, far[(i + 1) % 4].z]), 3));
  const throwMat = M.add(null, 0xffffff, 0.04);
  root.add(new THREE.Mesh(throwGeo, throwMat));
  return {
    root, inDark: 'better', glow: 0x6a5f55, view: [-24, 14], surface: frame.canvas,
    update: ({ t, lights }) => {
      const c = frame.ctx;
      // black wherever there is nothing to hit: the picture is cut to the outline of each solid
      c.fillStyle = '#000'; c.fillRect(0, 0, FW, FH);
      rects.forEach(([x, yy, w, h], i) => {
        c.save(); c.beginPath(); c.rect(x, yy, w, h); c.clip();
        if (i === 0) { for (let k = 0; k < 9; k++) { c.fillStyle = hsl(k * 40 + t * 40, 90, 55); c.fillRect(x, yy + ((t * 30 + k * 30) % (h + 30)) - 30, w, 16); } }
        else if (i === 1) { c.fillStyle = hsl(t * 50, 80, 60); c.fillRect(x, yy, w, h); c.fillStyle = '#111'; c.beginPath(); c.arc(x + w * 0.36, yy + h * 0.42, w * 0.08, 0, 7); c.arc(x + w * 0.64, yy + h * 0.42, w * 0.08, 0, 7); c.fill(); c.fillRect(x + w * 0.34, yy + h * 0.66, w * 0.32, h * 0.05); }
        else if (i === 2) { c.fillStyle = '#10204a'; c.fillRect(x, yy, w, h); c.save(); c.translate(x, yy); segClock(c, w, h, now(), '#ffffff', null, false, 4); c.restore(); }
        else if (i === 3) { for (let k = 0; k < 14; k++) { c.fillStyle = k % 2 ? '#ff5d5d' : '#ffd166'; c.fillRect(x, yy + ((k * 22 + t * 26) % (h + 22)) - 22, w, 11); } }
        else { c.fillStyle = '#19e0b0'; for (let k = 0; k < 12; k++) c.fillRect(x + ((k * 24 + t * 30) % (w + 24)) - 24, yy, 12, h); }
        c.restore();
      });
      frame.tex.needsUpdate = true;
      // a projected image is only as strong as the room is dark
      light.opacity = 1 - 0.7 * lights;
      throwMat.opacity = 0.05 - 0.04 * lights;
    },
  };
}
