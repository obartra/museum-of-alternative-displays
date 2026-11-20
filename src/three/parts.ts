import { G, M, Swarm, screen, THREE, type V3 } from './kit';

/** The small hardware that makes a model read as a made thing: screws, feet, knobs, slots, lenses. */

type Face = 'x' | 'y' | 'z';
const turn = (o: THREE.Object3D, face: Face): void => { if (face === 'z') o.rotation.x = Math.PI / 2; else if (face === 'x') o.rotation.z = -Math.PI / 2; };

/** Pan-head screws, heads facing along `face`. */
export function screws(at: V3[], r: number, face: Face = 'z', mat: THREE.Material = M.steel()): THREE.InstancedMesh {
  const geo = new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.55, 1);
  if (face === 'z') geo.rotateX(Math.PI / 2); else if (face === 'x') geo.rotateZ(-Math.PI / 2);
  const s = new Swarm(geo, mat, at.length);
  at.forEach((p, i) => s.put(i, p[0], p[1], p[2]));
  s.done();
  return s.mesh;
}

/** A bank of slots let into a panel that faces +z. Turn the result for a side or a top. */
export function vents(w: number, h: number, n: number, p: V3, upright = false): THREE.InstancedMesh {
  const pitch = (upright ? w : h) / n;
  const geo = upright ? new THREE.BoxGeometry(pitch * 0.42, h, 0.012) : new THREE.BoxGeometry(w, pitch * 0.42, 0.012);
  const s = new Swarm(geo, M.black(), n);
  for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * pitch; s.put(i, upright ? o : 0, upright ? 0 : o, 0); }
  s.done();
  s.mesh.position.set(p[0], p[1], p[2]);
  return s.mesh;
}

/** A control knob with a skirt and a pointer line, shaft along `face`. */
export function knob(r: number, p: V3, face: Face = 'z', angle = 0, mat: THREE.Material = M.plastic(0x16181a, 0.35)): THREE.Group {
  const g = G.group(
    G.cyl(r * 1.25, r * 0.28, mat, [0, r * 0.14, 0], 36, r * 1.1),
    G.cyl(r, r * 0.9, mat, [0, r * 0.7, 0], 36, r * 0.86),
    G.cyl(r * 0.62, r * 0.06, M.steel(), [0, r * 1.17, 0], 28),
    G.box(r * 0.12, r * 0.05, r * 0.8, M.paper(), [0, r * 1.16, -r * 0.5], 0),
  );
  g.rotation.y = angle;
  const out = G.group(g);
  turn(out, face);
  out.position.set(p[0], p[1], p[2]);
  return out;
}

/** A toggle switch on a hex nut. The bat points up or down. */
export function toggle(p: V3, up = true, face: Face = 'z'): THREE.Group {
  const bat = G.cyl(0.014, 0.1, M.chrome(), [0, 0.07, 0], 12, 0.02);
  bat.rotation.x = up ? -0.45 : 0.45;
  const g = G.group(G.cyl(0.034, 0.02, M.steel(), [0, 0.01, 0], 6), G.cyl(0.02, 0.03, M.steel(), [0, 0.03, 0], 16), bat);
  const out = G.group(g);
  turn(out, face);
  out.position.set(p[0], p[1], p[2]);
  return out;
}

/** A pilot lamp behind a faceted jewel. */
export function jewel(color: number, r: number, p: V3, face: Face = 'z', lit = 1.6): THREE.Group {
  const g = G.group(G.cyl(r * 1.35, r * 0.5, M.chrome(), [0, r * 0.25, 0], 24), G.sph(r, M.glow(color, lit), [0, r * 0.5, 0], 16));
  const out = G.group(g);
  turn(out, face);
  out.position.set(p[0], p[1], p[2]);
  return out;
}

/** Four rubber feet under a base of width `w` and depth `d`. */
export function feet(w: number, d: number, r = 0.06, h = 0.05, y = 0): THREE.Group {
  const g = G.group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(G.cyl(r, h, M.rubber(), [sx * (w / 2 - r * 1.6), y + h / 2, sz * (d / 2 - r * 1.6)], 20, r * 0.85));
  return g;
}

/** An optical breadboard: a black anodised plate with a grid of tapped holes. Its top is at `y`. */
export function breadboard(w: number, d: number, y = 0.06, pitch = 0.1): THREE.Group {
  const s = screen(Math.round(w / pitch) * 16, Math.round(d / pitch) * 16), c = s.ctx;
  c.fillStyle = '#17191c'; c.fillRect(0, 0, s.canvas.width, s.canvas.height);
  for (let x = 8; x < s.canvas.width; x += 16) for (let z = 8; z < s.canvas.height; z += 16) {
    c.fillStyle = '#050506'; c.beginPath(); c.arc(x, z, 2.6, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 1; c.beginPath(); c.arc(x, z, 3.4, 0, 7); c.stroke();
  }
  s.tex.needsUpdate = true;
  const top = G.plane(w - 0.03, d - 0.03, new THREE.MeshStandardMaterial({ map: s.tex, roughness: 0.5, metalness: 0.5 }), [0, y + 0.0006, 0]);
  top.rotation.x = -Math.PI / 2;
  return G.group(G.box(w, y, d, M.dark(), [0, y / 2, 0], 0.012), top);
}

/** A lens in a ring mount, looking along z. */
export function lens(r: number, p: V3, bulge = 0.3, ring: THREE.Material = M.dark()): THREE.Group {
  const glass = G.sph(r, M.glass(0x9fb6b8, 0.07, 0.75), undefined, 36);
  glass.scale.z = bulge;
  const g = G.group(glass, G.torus(r, r * 0.11, ring));
  g.position.set(p[0], p[1], p[2]);
  return g;
}

/** A post on a base, the way things stand on an optical table. `top` is where the part sits. */
export function post(top: V3, floor = 0, r = 0.022): THREE.Group {
  return G.group(
    G.rod([top[0], floor, top[2]], top, r, M.steel(1)),
    G.cyl(r * 2.4, 0.03, M.dark(), [top[0], floor + 0.015, top[2]], 24),
    G.cyl(r * 1.5, r * 2.2, M.dark(), [top[0], floor + (top[1] - floor) * 0.55, top[2]], 20),
  );
}

/** Three legs meeting under a head. */
export function tripod(top: V3, spread: number, floor = 0, mat: THREE.Material = M.dark(1)): THREE.Group {
  const g = G.group(G.cyl(0.05, 0.07, mat, [top[0], top[1] - 0.035, top[2]], 20));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const foot: V3 = [top[0] + Math.cos(a) * spread, floor, top[2] + Math.sin(a) * spread];
    g.add(G.rod([top[0], top[1] - 0.05, top[2]], foot, 0.016, mat), G.sph(0.026, M.rubber(), foot, 12));
  }
  return g;
}

/** A row of leads or pins: thin rods from `a` to `b`, repeated `n` times along `step`. */
export function pins(a: V3, b: V3, n: number, step: V3, r = 0.008, mat: THREE.Material = M.steel(1)): THREE.InstancedMesh {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), len = A.distanceTo(B);
  const geo = new THREE.CylinderGeometry(r, r, len, 6);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  geo.applyQuaternion(q);
  const mid = A.clone().lerp(B, 0.5);
  const s = new Swarm(geo, mat, n);
  for (let i = 0; i < n; i++) s.put(i, mid.x + step[0] * i, mid.y + step[1] * i, mid.z + step[2] * i);
  s.done();
  return s.mesh;
}

/** A fine metal mesh, as a texture with holes in it. `cell` is how many openings across. */
export function meshTexture(cellsX: number, cellsY: number, hex = true): THREE.CanvasTexture {
  const s = screen(cellsX * 12, cellsY * 12), c = s.ctx;
  c.clearRect(0, 0, s.canvas.width, s.canvas.height);
  c.strokeStyle = '#c9ccd0'; c.lineWidth = 1.6;
  for (let y = 0; y <= cellsY; y++) for (let x = 0; x <= cellsX; x++) {
    const ox = hex && y % 2 ? 6 : 0;
    c.beginPath();
    if (hex) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; c.lineTo(x * 12 + ox + Math.cos(a) * 6.9, y * 12 * 0.87 + Math.sin(a) * 6.9); }
    else c.rect(x * 12, y * 12, 12, 12);
    c.closePath(); c.stroke();
  }
  s.tex.needsUpdate = true;
  return s.tex;
}

/** A material that wears a mesh texture: metal where the wires are, nothing in between. */
export function meshMat(tex: THREE.Texture, opacity = 0.75): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.4 });
}
