import { G, M, Swarm, beam, screen, THREE, type Built, type V3 } from '../kit';
import { bigTime, clockStrokes, dots, hsl, now, segClock } from '../../sims/draw';

/** Liquid crystal display, pulled apart: lamp, polariser, the crystal between glass, colour filter, second polariser. */
export function lcd(): Built {
  const root = G.group();
  const W = 1.8, H = 1.15;
  const film = (draw: (c: CanvasRenderingContext2D) => void, opacity: number) => {
    const s = screen(256, 160); draw(s.ctx); s.tex.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: s.tex, transparent: true, opacity, roughness: 0.4, side: THREE.DoubleSide, depthWrite: false });
  };
  const lines = (vertical: boolean, col: string) => (c: CanvasRenderingContext2D) => {
    c.fillStyle = '#7d8590'; c.fillRect(0, 0, 256, 160); c.fillStyle = col;
    if (vertical) for (let x = 0; x < 256; x += 7) c.fillRect(x, 0, 1.5, 160);
    else for (let yy = 0; yy < 160; yy += 7) c.fillRect(0, yy, 256, 1.5);
  };
  const stripes = (c: CanvasRenderingContext2D) => { ['#ff3b30', '#34d058', '#2f6bff'].forEach((col, k) => { c.fillStyle = col; for (let x = k * 4; x < 256; x += 12) c.fillRect(x, 0, 3.4, 160); }); };
  const cell = screen(384, 240), final = screen(384, 240);
  const cellMat = new THREE.MeshStandardMaterial({ map: cell.tex, transparent: true, opacity: 0.75, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
  const finalMat = M.lit(final, 1.3); finalMat.transparent = true; finalMat.opacity = 0.94; finalMat.side = THREE.DoubleSide;
  const y = 0.78;
  root.add(G.box(W + 0.1, H + 0.1, 0.07, M.dark(), [0, y, -0.86]), G.plane(W, H, M.glow(0xf4f8ff, 1.0), [0, y, -0.82]));
  root.add(G.plane(W, H, film(lines(true, '#565d66'), 0.5), [0, y, -0.45]));
  root.add(G.box(W, H, 0.05, M.glass(0xeef6ff, 0.16), [0, y, -0.08]), G.plane(W, H, cellMat, [0, y, -0.05]));
  root.add(G.plane(W, H, film(stripes, 0.5), [0, y, 0.3]));
  root.add(G.plane(W, H, film(lines(false, '#565d66'), 0.35), [0, y, 0.62]), G.plane(W, H, finalMat, [0, y, 0.9]));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) root.add(G.rod([sx * (W / 2 + 0.04), y + sy * (H / 2 + 0.04), -0.9], [sx * (W / 2 + 0.04), y + sy * (H / 2 + 0.04), 0.92], 0.012, M.steel(), 6));
  root.add(G.box(W + 0.3, 0.05, 2.0, M.dark(), [0, 0.025, 0]), G.box(0.06, 0.2, 0.06, M.steel(), [-0.94, 0.1, -0.86]), G.box(0.06, 0.2, 0.06, M.steel(), [0.94, 0.1, -0.86]), G.box(0.06, 0.2, 0.06, M.steel(), [-0.94, 0.1, 0.9]), G.box(0.06, 0.2, 0.06, M.steel(), [0.94, 0.1, 0.9]));
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

/** Digital micromirror device: the chip, and a few of its mirrors enlarged. Each tips one way for light, the other for dark. */
export function dmd(): Built {
  const root = G.group();
  root.add(G.rbox(1.6, 0.12, 1.15, 0.02, M.ceramic(), [0, 0.06, 0]), G.box(1.12, 0.05, 0.78, M.black(), [0, 0.14, 0]), G.box(0.86, 0.012, 0.52, M.chrome(), [0, 0.17, 0]), G.box(1.0, 0.02, 0.66, M.glass(0xffffff, 0.18), [0, 0.19, 0]));
  for (let i = 0; i < 26; i++) for (const z of [-0.52, 0.52]) root.add(G.box(0.03, 0.03, 0.06, M.brass(), [(i - 12.5) * 0.058, 0.03, z]));
  const COLS = 13, ROWS = 7, P = 0.13;
  const mirrors = new Swarm(new THREE.BoxGeometry(0.118, 0.008, 0.118), M.chrome(), COLS * ROWS);
  const tilt = new Float32Array(COLS * ROWS);
  const lifted = G.group(mirrors.mesh, G.box(COLS * P + 0.06, 0.02, ROWS * P + 0.06, M.dark(), [0, -0.06, 0]));
  lifted.position.set(0, 1.05, 0.05); lifted.rotation.x = 0.62;
  root.add(lifted);
  const a = COLS * P / 2, b = ROWS * P / 2;
  lifted.updateMatrixWorld(true);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const top = new THREE.Vector3(sx * a, -0.07, sz * b).applyMatrix4(lifted.matrixWorld);
    root.add(G.rod([sx * 0.43, 0.18, sz * 0.26], [top.x, top.y, top.z], 0.005, M.steel(), 4));
  }
  const put = (i: number) => mirrors.put(i, ((i % COLS) - (COLS - 1) / 2) * P, 0, (Math.floor(i / COLS) - (ROWS - 1) / 2) * P, tilt[i] * 0.7, 0, -tilt[i] * 0.7);
  for (let i = 0; i < COLS * ROWS; i++) { put(i); mirrors.tint(i, 1, 1, 1); }
  mirrors.done();
  return {
    root, inDark: 'vanishes', view: [24, 16],
    update: () => {
      const d = dots(now().hhmmss.slice(6));
      for (let i = 0; i < COLS * ROWS; i++) {
        const on = d.on((i % COLS) - 1, Math.floor(i / COLS));
        tilt[i] += ((on ? 0.3 : -0.3) - tilt[i]) * 0.3;
        put(i);
        const v = on ? 1 : 0.3;
        mirrors.tint(i, v, v, v * 1.08);
      }
      mirrors.mesh.instanceMatrix.needsUpdate = true;
      if (mirrors.mesh.instanceColor) mirrors.mesh.instanceColor.needsUpdate = true;
    },
  };
}

/** Liquid crystal on silicon: a mirror-backed liquid crystal chip, a splitter cube above it and a lens. */
export function lcos(): Built {
  const root = G.group();
  const s = screen(320, 240);
  root.add(G.box(1.5, 0.04, 1.0, M.pcb(), [0, 0.02, 0]), G.box(0.66, 0.06, 0.5, M.dark(), [0, 0.07, 0]));
  const face = G.plane(0.58, 0.43, M.lit(s, 1.2), [0, 0.102, 0]); face.rotation.x = -Math.PI / 2;
  const cube = G.box(0.56, 0.56, 0.56, M.glass(0xeaf8ff, 0.16), [0, 0.52, 0]);
  const split = G.plane(0.79, 0.56, M.glass(0xbfe4ff, 0.3), [0, 0.52, 0]); split.rotation.order = 'ZXY'; split.rotation.x = Math.PI / 2; split.rotation.z = Math.PI / 4;
  const lamp = G.group(G.box(0.3, 0.34, 0.34, M.dark()), G.plane(0.2, 0.2, M.glow(0xffffff, 2), [0.151, 0, 0]));
  (lamp.children[1] as THREE.Mesh).rotation.y = Math.PI / 2; lamp.position.set(-0.95, 0.52, 0);
  for (let i = 0; i < 5; i++) root.add(G.box(0.02, 0.4, 0.4, M.steel(), [-1.14 - i * 0.05, 0.52, 0]));
  const barrel = G.cyl(0.2, 0.55, M.dark(), [0.82, 0.52, 0], 32); barrel.rotation.z = Math.PI / 2;
  const front = G.cyl(0.17, 0.03, M.glass(0xcfe8ff, 0.35), [1.11, 0.52, 0], 32); front.rotation.z = Math.PI / 2;
  root.add(face, cube, split, lamp, barrel, front, G.box(0.1, 0.3, 0.1, M.dark(), [0.82, 0.19, 0]), G.box(0.1, 0.3, 0.1, M.dark(), [-0.95, 0.19, 0]), G.box(0.5, 0.01, 0.3, M.plastic(0xc87b2a, 0.5), [0, 0.045, -0.62]));
  const rays: [V3, V3, number][] = [[[-0.8, 0.52, 0], [0, 0.52, 0], 0xffffff], [[0, 0.52, 0], [0, 0.11, 0], 0xffffff], [[0.02, 0.11, 0], [0.02, 0.52, 0], 0xffd27a], [[0.02, 0.52, 0], [1.12, 0.52, 0], 0xffd27a], [[1.12, 0.52, 0], [1.9, 0.78, 0.2], 0xffd27a], [[1.12, 0.52, 0], [1.9, 0.26, -0.2], 0xffd27a]];
  for (const [a, b, col] of rays) { const r = beam(col, 0.8); r.aim(a, b); root.add(r.line); }
  return {
    root, inDark: 'glows', glow: 0xffe2b0, view: [26, 18], zoom: 1.25, surface: s.canvas,
    update: () => {
      s.ctx.fillStyle = '#10131a'; s.ctx.fillRect(0, 0, 320, 240);
      bigTime(s.ctx, 320, 240, now().hhmm, '#ffd27a', 800, 0.6);
      s.tex.needsUpdate = true;
    },
  };
}

/** Eidophor: an electron beam dimples a film of oil on a mirror, and a grille of bars turns the dimples into light. */
export function eidophor(): Built {
  const root = G.group();
  const dark = M.dark();
  root.add(G.box(3.4, 0.08, 1.2, dark, [0, 0.04, 0]));
  // arc lamp house and condenser
  root.add(G.box(0.62, 0.72, 0.62, dark, [-1.3, 0.94, 0]), G.box(0.1, 0.5, 0.1, dark, [-1.3, 0.33, 0]));
  const win = G.plane(0.3, 0.3, M.glow(0xeaf2ff, 2.2), [-0.985, 0.94, 0]); win.rotation.y = Math.PI / 2;
  const cond = G.cyl(0.2, 0.04, M.glass(0xdff0ff, 0.3), [-0.78, 0.94, 0], 32); cond.rotation.z = Math.PI / 2;
  root.add(win, cond, G.box(0.04, 0.84, 0.04, M.steel(), [-0.78, 0.5, 0]));
  // bar mirror: light bounces down to the oil, and only disturbed light gets back up between the bars
  const bars = G.group();
  for (let i = 0; i < 6; i++) bars.add(G.box(0.018, 0.085, 0.5, M.chrome(), [0, (i - 2.5) * 0.14, 0]));
  bars.position.set(0, 0.94, 0); bars.rotation.z = Math.PI / 4;
  root.add(bars);
  // the oil-coated mirror, slowly turning under its vacuum bell, and the electron gun that writes on it
  const oil = new THREE.MeshPhysicalMaterial({ color: 0xcfd8e2, metalness: 1, roughness: 0.08, iridescence: 1, iridescenceIOR: 1.6, side: THREE.DoubleSide });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.9, 48, 16, 0, Math.PI * 2, Math.PI - 0.42, 0.42), oil);
  dish.position.set(0, 1.12, 0);
  const gun = G.cyl(0.07, 0.6, M.steel(), [0.42, 0.62, 0], 20); gun.rotation.z = -0.8;
  root.add(dish, gun, G.cyl(0.42, 0.06, dark, [0, 0.19, 0], 40), G.cyl(0.1, 0.1, M.brass(), [0.64, 0.79, 0], 16));
  root.add(G.lathe([[0.5, 0.12], [0.5, 0.62], [0.4, 0.72]], M.glass(0xffffff, 0.1), 40));
  // projection lens, fold mirror and a small screen
  root.add(G.cyl(0.18, 0.4, dark, [0, 1.5, 0], 32), G.cyl(0.16, 0.02, M.glass(0xcfe8ff, 0.35), [0, 1.71, 0], 32));
  const fold = G.box(0.4, 0.02, 0.4, M.chrome(), [0, 2.02, 0]); fold.rotation.z = -Math.PI / 4;
  const s = screen(320, 240);
  const scr = G.plane(0.9, 0.68, M.lit(s, 1.2), [1.55, 2.02, 0]); scr.rotation.y = -Math.PI / 2 + 0.95;
  root.add(fold, scr, G.box(0.06, 1.7, 0.06, M.steel(), [1.6, 0.85, 0]), G.box(0.05, 0.6, 0.05, M.steel(), [0.25, 1.75, 0.3]), G.box(0.05, 1.9, 0.05, M.steel(), [0.25, 0.95, 0.42]));
  const rays: [V3, V3, number][] = [[[-0.98, 0.94, 0], [0, 0.94, 0], 0xffffff], [[0, 0.94, 0], [0, 0.24, 0], 0xffffff], [[0.04, 0.24, 0], [0.04, 2.0, 0], 0xcfe0ff], [[0.04, 2.0, 0], [1.54, 2.0, 0], 0xcfe0ff]];
  for (const [a, b, col] of rays) { const r = beam(col, 0.7); r.aim(a, b); root.add(r.line); }
  return {
    root, inDark: 'glows', glow: 0xdde8ff, view: [22, 8], zoom: 1.1, surface: s.canvas,
    update: ({ t }) => {
      dish.rotation.y = t * 0.25;
      s.ctx.fillStyle = '#0b0d10'; s.ctx.fillRect(0, 0, 320, 240);
      bigTime(s.ctx, 320, 240, now().hhmmss, '#e9eef7', 800, 0.44);
      s.ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let y = 0; y < 240; y += 3) s.ctx.fillRect(0, y, 320, 1);
      s.tex.needsUpdate = true;
    },
  };
}

/** Scanned laser: two small mirrors on fast motors steer one beam. The eye sees the path, not the dot. */
export function laserScan(): Built {
  const root = G.group();
  const y = 0.34;
  root.add(G.box(2.3, 0.06, 1.5, M.black(), [0, 0.03, 0.3]));
  const cols = [0xff2a1a, 0x2aff5a, 0x2a6bff];
  cols.forEach((col, i) => {
    const z = 0.55 + (i - 1) * 0.3;
    const m = G.cyl(0.07, 0.5, M.steel(), [-0.75, y, z], 20); m.rotation.z = Math.PI / 2;
    const d = G.box(0.02, 0.2, 0.2, M.glass(col, 0.35), [-0.25, y, z]); d.rotation.y = Math.PI / 4;
    root.add(m, d, G.box(0.14, y - 0.06, 0.14, M.dark(), [-0.75, (y - 0.06) / 2 + 0.06, z]));
    const r = beam(col, 0.9); r.aim([-0.5, y, z], [-0.25, y, z]); root.add(r.line);
  });
  const merged = beam(0xffffff, 0.9); merged.aim([-0.25, y, 0.85], [-0.25, y, 0.12]); root.add(merged.line);
  const turn = G.box(0.02, 0.2, 0.2, M.chrome(), [-0.25, y, 0.1]); turn.rotation.y = -Math.PI / 4;
  const toGalvo = beam(0xffffff, 0.9); toGalvo.aim([-0.25, y, 0.1], [0.6, y, 0.1]); root.add(turn, toGalvo.line);
  const gx = G.group(G.cyl(0.09, 0.3, M.dark(), [0, -0.16, 0], 20), G.box(0.14, 0.16, 0.012, M.chrome(), [0, 0.07, 0]));
  gx.position.set(0.6, y, 0.1);
  const gy = G.group(G.cyl(0.09, 0.3, M.dark(), [0, 0, 0.2], 20), G.box(0.16, 0.012, 0.14, M.chrome(), [0, 0, 0]));
  (gy.children[0] as THREE.Mesh).rotation.x = Math.PI / 2;
  gy.position.set(0.6, y + 0.3, 0.02);
  const up = beam(0xffffff, 0.9); up.aim([0.6, y, 0.1], [0.6, y + 0.3, 0.02]);
  root.add(gx, gy, up.line, G.box(0.1, y + 0.2, 0.1, M.dark(), [0.82, (y + 0.2) / 2, 0.25]));
  // the wall the figure lands on
  const s = screen(512, 384);
  s.ctx.fillStyle = '#000'; s.ctx.fillRect(0, 0, 512, 384);
  root.add(G.box(2.3, 1.6, 0.04, M.plastic(0x2b2d30, 0.95), [0, 1.0, -0.62]), G.plane(2.2, 1.5, M.add(s), [0, 1.0, -0.595]));
  const out = beam(0x9dffb0, 0.85); root.add(out.line);
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
      out.aim([0.6, y + 0.3, 0.02], [px, py, -0.59]);
      gx.rotation.y = px * 0.4; gy.rotation.z = (py - 1) * 0.4;
    },
  };
}

/** Projection mapping: an ordinary projector, and a picture cut to fit the object it lands on. */
export function projectionMapping(): Built {
  const root = G.group();
  const s = screen(256, 256);
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.92, emissive: 0xffffff, emissiveMap: s.tex, emissiveIntensity: 0.4 });
  root.add(G.box(2.5, 0.05, 2.9, M.dark(), [0, 0.025, 0.35]));
  const head = G.sph(0.24, skin, [-0.5, 1.26, -0.5], 32); head.scale.set(0.9, 1.15, 1);
  root.add(G.box(0.62, 0.95, 0.62, skin, [-0.5, 0.525, -0.5]), head, G.box(0.5, 0.5, 0.5, skin, [0.18, 0.3, -0.3]), G.cyl(0.26, 1.3, skin, [0.72, 0.7, -0.65], 40), G.box(0.9, 0.2, 0.4, skin, [0.3, 0.15, 0.25]));
  const proj = G.group(G.rbox(0.56, 0.2, 0.42, 0.03, M.plastic(0x232528, 0.5)), G.cyl(0.08, 0.1, M.dark(), [0, 0, -0.25], 20), G.plane(0.1, 0.1, M.glow(0xffffff, 2.5), [0, 0, -0.305]));
  (proj.children[1] as THREE.Mesh).rotation.x = Math.PI / 2; (proj.children[2] as THREE.Mesh).rotation.y = Math.PI;
  proj.position.set(0.1, 0.95, 1.55); proj.rotation.x = 0.13;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.2, 32, 1, true), M.add(null, 0xffffff, 0.05));
  cone.rotation.x = Math.PI / 2 + 0.13; cone.position.set(0.1, 0.78, 0.2);
  root.add(proj, cone);
  for (const [dx, dz] of [[-0.25, 0.2], [0.25, 0.2], [0, -0.22]]) root.add(G.rod([0.1, 0.86, 1.55], [0.1 + dx, 0.05, 1.55 + dz], 0.015, M.steel(), 6));
  return {
    root, inDark: 'better', glow: 0xfff0e0, view: [-28, 14], surface: s.canvas,
    update: ({ t, lights }) => {
      const c = s.ctx;
      c.fillStyle = '#05060a'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 6; i++) { c.fillStyle = hsl(i * 60 + t * 40, 90, 55); c.fillRect(0, ((t * 40 + i * 43) % 300) - 22, 256, 16); }
      c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.strokeRect(3, 3, 250, 250);
      c.save(); c.translate(0, 0); segClock(c, 256, 256, now(), '#ffffff', null, false, 6); c.restore();
      s.tex.needsUpdate = true;
      // a projected image is only as strong as the room is dark
      skin.emissiveIntensity = 1.5 - 1.25 * lights;
      (cone.material as THREE.MeshBasicMaterial).opacity = 0.07 - 0.05 * lights;
    },
  };
}
