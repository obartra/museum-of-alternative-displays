import { G, M, THREE, type Built, type V3 } from '../kit';
import { screws, vents } from '../parts';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * The CAVE, the room of hall 7 whose walls and floor are screens. The picture on them is worked out, for every point
 * of every screen, from where the eyes of the one tracked person are: the screens show what that eye would see through
 * them. So from that eye the corners vanish and the scene stands in the room, and from anywhere else it breaks.
 */

/**
 * Bakes the still, solid parts of a model into one mesh for each kind of material, so that many small parts cost a
 * handful of draw calls. The same as the one in h7.ts. Anything that moves, glows or is seen through is left alone.
 */
function fuse(root: THREE.Object3D, keep: THREE.Object3D[] = []): void {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const lots = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; from: THREE.Mesh[]; quiet: boolean }>();
  const walk = (o: THREE.Object3D): void => {
    if (keep.includes(o) || o.userData.moves || o.userData.noFit) return;
    const m = o as THREE.Mesh, mat = m.material as THREE.MeshStandardMaterial;
    if (m.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(mat) && mat.isMeshStandardMaterial && !mat.transparent && !o.children.length && !o.renderOrder && mat.defines?.FINISH !== 2) {
      const at = inv.clone().multiply(m.matrixWorld), kind = mat.defines?.FINISH as number | undefined;
      const plain = kind !== undefined || (!mat.map && !mat.emissiveMap && mat.emissive.getHex() === 0);
      const quiet = !!o.userData.noShadow, key = (plain ? [mat.color.getHex(), mat.roughness, mat.metalness, kind, mat.defines?.GRAIN, mat.side].join() : mat.uuid) + (quiet ? 'q' : '');
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(g.attributes.position.count * 2, 2));
      g.applyMatrix4(at);
      let lot = lots.get(key);
      if (!lot) lots.set(key, lot = { mat, geos: [], from: [], quiet });
      lot.geos.push(g); lot.from.push(m);
    }
    for (const kid of [...o.children]) walk(kid);
  };
  walk(root);
  for (const lot of lots.values()) {
    if (lot.geos.length < 2) continue;
    const all = new THREE.Mesh(G.merge(lot.geos), lot.mat);
    all.userData.noShadow = lot.quiet;
    root.add(all);
    for (const m of lot.from) { m.removeFromParent(); m.geometry.dispose(); }
  }
}

/** Every mesh under a group as one shape, in the group's own coordinates. */
function weld(g: THREE.Object3D): THREE.BufferGeometry {
  g.updateMatrixWorld(true);
  const inv = g.matrixWorld.clone().invert(), geos: THREE.BufferGeometry[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') geo.deleteAttribute(name);
    geos.push(geo.applyMatrix4(inv.clone().multiply(m.matrixWorld)));
  });
  return G.merge(geos);
}

/** A plain cylinder for a small part. */
const stub = (r: number, h: number, mat: THREE.Material, p?: V3, seg = 12, rTop = r): THREE.Mesh => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat);
  if (p) m.position.set(p[0], p[1], p[2]);
  return m;
};
const ball = (r: number, mat: THREE.Material, p: V3, sx = 1, sy = 1, sz = 1): THREE.Mesh => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
  m.position.set(p[0], p[1], p[2]); m.scale.set(sx, sy, sz);
  return m;
};

// the room, in metres. Ten feet a side, as the room shown at conferences was
const S = 3.05, H = S / 2, Y0 = 0.1, TOP = Y0 + S;
/**
 * The kit behind the right wall. The projector stands PD in front of the point where its axis meets the mirror, and that
 * point is MD behind the screen. Their sum is the throw, long enough that the beam spreads to the whole screen at 30 degrees
 * either side of its axis. A shorter throw would need a mirror that no longer catches the edges of the beam.
 */
const PD = 0.95, MD = 1.69, MX = H + MD, MY = Y0 + H;

/**
 * The picture on the screens. For every point of a screen the shader follows the line from the tracked eye through
 * that point out into a small world, and paints what it meets there. That is what the computers of a CAVE draw.
 */
const PICTURE = /* glsl */ `
  uniform vec3 uEye, uFig, uProj; uniform mat3 uRot; uniform float uL, uFigOn;
  varying vec3 vObj;
  #define GY ${Y0.toFixed(3)}
  #define HS ${H.toFixed(4)}
  const vec3 SUN = vec3(-0.5263, 0.4211, -0.7388);
  const vec3 GLOW = vec3(0.0, 0.035, -0.9994);

  vec3 sky(vec3 d) {
    float h = d.y;
    vec3 c = mix(vec3(1.0, 0.56, 0.3), vec3(0.32, 0.22, 0.52), smoothstep(0.0, 0.16, h));
    c = mix(c, vec3(0.05, 0.08, 0.24), smoothstep(0.12, 0.6, h));
    float s = max(dot(d, GLOW), 0.0);
    return c + vec3(1.0, 0.78, 0.5) * (pow(s, 900.0) * 2.4 + pow(s, 60.0) * 0.35);
  }

  // the nearest hit of a ray with a box, kept if it is nearer than what was found before
  void box(vec3 ro, vec3 rd, vec3 c, vec3 h, int id, inout float tm, inout vec3 n, inout int hit) {
    vec3 m = 1.0 / rd, o = ro - c, a = (-h - o) * m, b = (h - o) * m, tn = min(a, b), tf = max(a, b);
    float t0 = max(max(tn.x, tn.y), tn.z), t1 = min(min(tf.x, tf.y), tf.z);
    if (t0 < t1 && t0 > 0.0 && t0 < tm) { tm = t0; n = -sign(rd) * step(tn.yzx, tn.xyz) * step(tn.zxy, tn.xyz); hit = id; }
  }

  vec3 lit(vec3 base, vec3 n) {
    float d = max(dot(n, SUN), 0.0), up = 0.5 + 0.5 * n.y;
    return base * (d * vec3(1.15, 0.92, 0.7) + up * vec3(0.22, 0.27, 0.46) + 0.06);
  }

  vec3 world(vec3 ro, vec3 rd, vec2 cell, vec2 fw) {
    float tm = 1e5; vec3 n = vec3(0.0); int hit = 0;
    // the ground, which in the room is the floor itself
    if (rd.y < 0.0) { float t = (GY - ro.y) / rd.y; if (t > 0.0) { tm = t; n = vec3(0.0, 1.0, 0.0); hit = 1; } }
    // two rows of pillars with a beam along each, running away from the room
    for (int k = 0; k < 6; k++) {
      float z = 0.6 - 2.0 * float(k);
      box(ro, rd, vec3(-2.4, GY + 1.2, z), vec3(0.16, 1.2, 0.16), 2, tm, n, hit);
      box(ro, rd, vec3(2.4, GY + 1.2, z), vec3(0.16, 1.2, 0.16), 2, tm, n, hit);
    }
    box(ro, rd, vec3(-2.4, GY + 2.52, -4.4), vec3(0.22, 0.12, 5.4), 2, tm, n, hit);
    box(ro, rd, vec3(2.4, GY + 2.52, -4.4), vec3(0.22, 0.12, 5.4), 2, tm, n, hit);
    // a slender block standing in the back right corner of the room
    box(ro, rd, vec3(1.02, GY + 0.62, -1.02), vec3(0.17, 0.62, 0.17), 3, tm, n, hit);
    // a cube turning in the air before the back wall
    vec3 cc = vec3(0.42, GY + 1.5, -0.8), lo = uRot * (ro - cc), ld = uRot * rd; float tc = tm; vec3 nc = vec3(0.0); int hc = 0;
    box(lo, ld, vec3(0.0), vec3(0.21), 4, tc, nc, hc);
    if (hc == 4) { tm = tc; n = nc * uRot; hit = 4; }
    // a ball resting on the floor in the back left corner
    vec3 bc = vec3(-1.04, GY + 0.42, -1.0), oc = ro - bc; float bb = dot(oc, rd), disc = bb * bb - dot(oc, oc) + 0.1764;
    if (disc > 0.0) { float t = -bb - sqrt(disc); if (t > 0.0 && t < tm) { tm = t; n = (oc + rd * t) / 0.42; hit = 5; } }
    // the gate at the end of the pillars, with the low sun in it
    float tg = (-11.0 - ro.z) / rd.z;
    if (tg > 0.0 && tg < tm) { vec2 q = (ro + rd * tg).xy - vec2(0.0, GY + 2.0); float r = length(q); if (r > 1.5 && r < 2.0) { tm = tg; n = vec3(0.0, 0.0, 1.0); hit = 6; } }

    vec3 p = ro + rd * tm, col;
    if (hit == 0) return sky(rd);
    if (hit == 1) {
      vec2 g = abs(fract(cell - 0.5) - 0.5) / max(fw, 1e-4), G4 = abs(fract(cell * 0.25 - 0.5) - 0.5) / max(fw * 0.25, 1e-4);
      float line = 1.0 - min(min(g.x, g.y), 1.0), major = 1.0 - min(min(G4.x, G4.y), 1.0);
      col = vec3(0.07, 0.08, 0.19) + vec3(0.18, 0.75, 1.0) * (line * 0.6 + major * 0.8) * exp(-tm * 0.06);
      // a straight road on the ground, which leaves the room under the back wall near its left corner
      float road = abs(p.x - p.z - 0.35) * 0.7071, aa = max(fw.x, fw.y) * 0.5 + 1e-3;
      col = mix(col, vec3(1.0, 0.5, 0.16) * (0.55 + 0.45 * exp(-tm * 0.05)), 1.0 - smoothstep(0.2 - aa, 0.2 + aa, road));
      // soft contact shadows under the things that stand on the ground
      float sh = exp(-dot(p.xz - bc.xz, p.xz - bc.xz) * 9.0) * 0.8 + exp(-dot(p.xz - vec2(1.02, -1.02), p.xz - vec2(1.02, -1.02)) * 22.0) * 0.6;
      col *= 1.0 - sh;
    } else if (hit == 2) col = lit(vec3(0.86, 0.8, 0.68), n);
    else if (hit == 3) col = lit(vec3(0.16, 0.62, 0.58), n);
    else if (hit == 4) { vec3 a = abs(nc); col = lit(a.x > 0.5 ? vec3(0.92, 0.3, 0.22) : a.y > 0.5 ? vec3(0.98, 0.78, 0.22) : vec3(0.22, 0.45, 0.95), n); }
    else if (hit == 5) {
      vec3 q = n; float seg = step(0.5, fract(atan(q.z, q.x) * 0.95493));
      vec3 base = abs(q.y) > 0.86 ? vec3(0.95, 0.92, 0.84) : mix(vec3(0.95, 0.92, 0.84), vec3(0.88, 0.2, 0.16), seg);
      col = lit(base, n) + vec3(1.0, 0.9, 0.8) * pow(max(dot(reflect(rd, n), SUN), 0.0), 40.0) * 0.6;
    } else col = vec3(1.0, 0.72, 0.32) * (0.9 + 0.4 * smoothstep(1.5, 1.75, length((ro + rd * tm).xy - vec2(0.0, GY + 2.0))));
    // far things fade into the sky at the horizon
    return mix(col, sky(rd), 1.0 - exp(-max(tm - 3.0, 0.0) * 0.045));
  }

  void main() {
    vec3 rd = normalize(vObj - uEye);
    // the ground under this point of the screen, worked out before any branching so that its lines can be smoothed
    float tg = (GY - uEye.y) / min(rd.y, -1e-4); vec2 cell = (uEye + rd * tg).xz / 0.5, fw = fwidth(cell);
    vec3 col = world(uEye, rd, cell, fw);
    // the floor is lit from the front, above: whoever stands in the room throws a shadow on it, mostly behind them
    if (vObj.y < GY + 0.01 && uFigOn > 0.5) {
      vec3 to = normalize(uProj - vObj); float t = (uFig.z - vObj.z) / to.z;
      vec3 at = vObj + to * max(t, 0.0); float y = clamp(at.y, GY + 0.05, GY + 1.6);
      float d = length(at.xz - uFig.xz), r = y > GY + 1.45 ? 0.1 : y < GY + 0.85 ? 0.14 : 0.2;
      col *= 1.0 - 0.88 * (1.0 - smoothstep(r - 0.04, r + 0.06, d)) * step(0.0, t) * step(at.y, GY + 1.76);
    }
    // where two screens meet there is a faint seam: the sheet turns round a steel cable at the back corners
    float e = min(min(length(vObj.xz - vec2(-HS, -HS)), length(vObj.xz - vec2(HS, -HS))), max(vObj.y - GY, min(HS - abs(vObj.x), vObj.z + HS)));
    float ew = length(fwidth(vObj)) + 0.004;
    col *= 1.0 - 0.3 * (1.0 - smoothstep(0.004, 0.008 + ew, e));
    // seen from behind, a rear projection screen shows the picture too, dimmer and mirrored. By day the hall light washes it
    col *= gl_FrontFacing ? 1.0 : 0.32;
    col = col * (1.0 - 0.18 * uL) + vec3(0.2, 0.21, 0.23) * uL * (gl_FrontFacing ? 0.55 : 0.85);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/** The lay figure: a jointed dummy of turned wood, with no face. Each limb is its own part, so that it can walk. */
function layFigure(wood: THREE.Material, glasses: THREE.Material, steel: THREE.Material) {
  const limb = (r0: number, r1: number, len: number) => stub(r0, len, wood, [0, -len / 2, 0], 14, r1);
  const body = G.group(
    ball(0.15, wood, [0, 0.95, 0], 1, 0.72, 0.7), ball(0.085, wood, [0, 1.08, 0]), ball(0.17, wood, [0, 1.3, 0], 1, 1.12, 0.66),
    stub(0.045, 0.1, wood, [0, 1.52, 0]), ball(0.1, wood, [0, 1.64, 0.005], 0.92, 1.2, 1.05),
    ball(0.055, wood, [-0.19, 1.42, 0]), ball(0.055, wood, [0.19, 1.42, 0]), ball(0.062, wood, [-0.09, 0.87, 0]), ball(0.062, wood, [0.09, 0.87, 0]),
  );
  // the shutter glasses, with the sensor that reports where the head is on the bridge, and its cable leaving at the back.
  // Frame, lenses and sensor are each one shape
  const pale = M.plastic(0xd9d6cf, 0.5), lens = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.1, metalness: 0.4 });
  const one = (mat: THREE.Material, quiet: boolean, ...parts: THREE.Object3D[]) => { const m = new THREE.Mesh(weld(G.group(...parts)), mat); m.userData.noShadow = quiet; return m; };
  const specs = G.group(
    one(glasses, false, G.rbox(0.2, 0.055, 0.03, 0.012, glasses, [0, 1.655, 0.1]), G.box(0.02, 0.025, 0.2, glasses, [-0.098, 1.66, 0.01], 0), G.box(0.02, 0.025, 0.2, glasses, [0.098, 1.66, 0.01], 0), G.box(0.012, 0.012, 0.1, glasses, [0, 1.71, 0.04], 0)),
    one(lens, true, ...[-1, 1].map((sx) => G.box(0.075, 0.04, 0.006, lens, [sx * 0.045, 1.655, 0.116], 0))),
    one(pale, true, G.box(0.05, 0.03, 0.04, pale, [0, 1.705, 0.1], 0.006)),
  );
  body.add(specs);
  /** A leg: the thigh turns at the hip, the shin at the knee. */
  const leg = (sx: number) => {
    const shin = G.group(limb(0.048, 0.036, 0.4), ball(0.04, wood, [0, -0.41, 0]), G.box(0.075, 0.05, 0.21, wood, [0, -0.425, 0.05], 0.02));
    shin.position.y = -0.42;
    const thigh = G.group(limb(0.07, 0.052, 0.42), ball(0.05, wood, [0, -0.42, 0]), shin);
    thigh.position.set(sx * 0.09, 0.87, 0);
    return { thigh, shin };
  };
  /** An arm: the upper arm turns at the shoulder, the forearm at the elbow. */
  const arm = (sx: number) => {
    const hand = ball(0.045, wood, [0, -0.3, 0.01], 0.7, 1.3, 1);
    const fore = G.group(limb(0.036, 0.028, 0.25), ball(0.03, wood, [0, -0.255, 0]), hand);
    fore.position.y = -0.29;
    const upper = G.group(limb(0.048, 0.04, 0.28), ball(0.04, wood, [0, -0.29, 0]), fore);
    upper.position.set(sx * 0.2, 1.42, 0);
    return { upper, fore };
  };
  const L = leg(-1), R = leg(1), LA = arm(-1), RA = arm(1);
  // the wand, held in the right hand along the line of the forearm: a grip with three buttons and a small stick on its upper face, and a sensor at its tip
  const grey = M.plastic(0x2a2c30, 0.45), buttons = [0, 1, 2].map((i) => stub(0.007, 0.01, grey, [0, -0.33 - i * 0.025, 0.026], 8).rotateX(Math.PI / 2));
  const wand = G.group(one(grey, false, G.rbox(0.042, 0.21, 0.05, 0.015, grey, [0, -0.37, 0]), stub(0.007, 0.022, grey, [0, -0.42, 0.03], 8).rotateX(Math.PI / 2), ...buttons), one(pale, true, G.box(0.03, 0.03, 0.03, pale, [0, -0.49, 0], 0.004)));
  RA.fore.add(wand);
  // each limb, like the body, becomes one shape, so the figure costs a few draw calls
  const solid = (g: THREE.Group, keep: THREE.Object3D[] = []) => {
    const kids = g.children.filter((k) => !keep.includes(k));
    const tmp = G.group(); for (const k of kids) tmp.add(k.clone());
    const one = new THREE.Mesh(weld(tmp), wood);
    for (const k of kids) g.remove(k);
    g.add(one);
    return g;
  };
  solid(L.shin); solid(R.shin); solid(L.thigh, [L.shin]); solid(R.thigh, [R.shin]);
  solid(LA.fore); solid(LA.upper, [LA.fore]); solid(RA.fore, [wand]); solid(RA.upper, [RA.fore]);
  const frame = body.children.filter((k) => k !== specs && (k as THREE.Mesh).material === wood);
  const torso = new THREE.Mesh(weld(G.group(...frame.map((k) => k.clone()))), wood);
  for (const k of frame) body.remove(k);
  body.add(torso, L.thigh, R.thigh, LA.upper, RA.upper);
  const fig = G.group(body);
  fig.traverse((o) => { o.userData.moves = true; });
  return { fig, body, L, R, LA, RA, wand };
}

/** A projector of the time: three picture tubes behind three lenses, red, green and blue, in one cabinet. Its lenses face -z. */
function projector(): THREE.Group {
  const shell = M.plastic(0x2b2e33, 0.5), dark = M.dark(), black = M.black();
  const g = G.group(G.rbox(0.76, 0.34, 0.92, 0.03, shell, [0, 0, 0.46]), G.box(0.7, 0.05, 0.08, black, [0, 0.12, 0.005], 0));
  // the three lenses and the pilot lamp on the back panel give light: one shape, each part in its own colour
  const lit: THREE.BufferGeometry[] = [], col = new THREE.Color();
  const tint = (geo: THREE.BufferGeometry, c: number) => { col.set(c); const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) col.toArray(a, i * 3); geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
  ([[-0.21, 0xff4a3a], [0, 0x4aff7a], [0.21, 0x5a8cff]] as [number, number][]).forEach(([x, c]) => {
    const barrel = stub(0.075, 0.1, dark, [x, -0.03, -0.04], 20, 0.068); barrel.rotation.x = Math.PI / 2;
    g.add(barrel);
    lit.push(tint(new THREE.CircleGeometry(0.058, 20).rotateY(Math.PI).translate(x, -0.03, -0.091), c));
  });
  lit.push(tint(new THREE.SphereGeometry(0.012, 10, 6).translate(0.3, 0.1, 0.922), 0x58ff8a));
  const lamps = new THREE.Mesh(mergeGeometries(lit.map((x) => x.toNonIndexed()))!, new THREE.MeshBasicMaterial({ vertexColors: true }));
  lamps.userData.noShadow = true;
  g.add(lamps);
  const top = vents(0.5, 0.5, 9, [0, 0.171, 0.52], false); top.rotation.x = -Math.PI / 2; top.userData.noShadow = true;
  g.add(top, screws([[-0.34, 0.12, -0.002], [0.34, 0.12, -0.002], [-0.34, -0.12, -0.002], [0.34, -0.12, -0.002]].map(([x, y, z]) => [x, y, z] as V3), 0.01, 'z'));
  return g;
}

/** A pyramid of faint light from one point to the four corners of a quad. */
function cone(apex: V3, quad: V3[], mat: THREE.Material): THREE.Mesh {
  const pos: number[] = [];
  for (let i = 0; i < 4; i++) pos.push(...apex, ...quad[i], ...quad[(i + 1) % 4]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(geo, mat);
  m.userData.noShadow = true;
  return m;
}

export function cave(): Built {
  const root = G.group();
  const frameMat = M.plastic(0x3a3d42, 0.6), deck = M.plastic(0x2a2c30, 0.75), steel = M.steel(), black = M.black();
  const wood = M.wood(0xd9b98c, 1), glasses = M.plastic(0x141518, 0.35);

  // the deck the room stands on, with a bevelled lip on the open side
  root.add(G.box(S + 0.3, Y0, S + 0.42, deck, [0, Y0 / 2, 0.06], 0.02));
  root.add(G.profile([[H + 0.27, 0], [H + 0.27, 0.025], [H + 0.42, 0]], S + 0.3, deck, [0, 0, 0], 0.004));

  // the screens: three walls and the floor, one surface and one material
  const u = {
    uEye: { value: new THREE.Vector3(0, Y0 + 1.6, 0.4) }, uFig: { value: new THREE.Vector3() }, uProj: { value: new THREE.Vector3(0, TOP + 0.3, H + 0.35) },
    uRot: { value: new THREE.Matrix3() }, uL: { value: 1 }, uFigOn: { value: 1 },
  };
  const picture = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide, fragmentShader: PICTURE,
    vertexShader: 'varying vec3 vObj; void main() { vObj = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  });
  const back = new THREE.PlaneGeometry(S, S).translate(0, Y0 + H, -H);
  const left = new THREE.PlaneGeometry(S, S).rotateY(Math.PI / 2).translate(-H, Y0 + H, 0);
  const right = new THREE.PlaneGeometry(S, S).rotateY(-Math.PI / 2).translate(H, Y0 + H, 0);
  const floor = new THREE.PlaneGeometry(S, S).rotateX(-Math.PI / 2).translate(0, Y0 + 0.002, 0);
  const screens = new THREE.Mesh(G.merge([back, left, right, floor]), picture);
  screens.userData.noShadow = true;
  root.add(screens);

  // the frame that carries the screens: a post at each outer corner, rails along the top and the foot of each wall,
  // and a header over the open side that carries the projector for the floor
  const B = 0.09, O = H + 0.07;
  for (const [x, z] of [[-O, -O], [O, -O], [-O, O], [O, O]]) root.add(G.box(B, TOP + 0.12 - Y0, B, frameMat, [x, (TOP + 0.12 + Y0) / 2, z], 0.008));
  root.add(G.box(2 * O + B, B, B, frameMat, [0, TOP + 0.075, -O], 0.008), G.box(2 * O + B, B, B, frameMat, [0, TOP + 0.075, O], 0.008));
  for (const sx of [-1, 1]) root.add(G.box(B, B, 2 * O - B, frameMat, [sx * O, TOP + 0.075, 0], 0.008), G.box(0.05, 0.06, 2 * O - B, frameMat, [sx * O, Y0 + 0.03, 0], 0.006));
  root.add(G.box(2 * O - B, 0.06, 0.05, frameMat, [0, Y0 + 0.03, -O], 0.006));
  // gussets at the top corners, bolted, and a mid rail behind each wall
  const plates: V3[] = [];
  for (const [x, z] of [[-O, -O], [O, -O], [-O, O], [O, O]]) {
    for (const [dx, dz] of [[-Math.sign(x), 0], [0, -Math.sign(z)]]) {
      const p = G.box(dx ? 0.26 : 0.012, 0.18, dz ? 0.26 : 0.012, frameMat, [x + dx * 0.16 + (dz ? Math.sign(x) * 0.051 : 0), TOP - 0.06, z + dz * 0.16 + (dx ? Math.sign(z) * 0.051 : 0)], 0);
      root.add(p);
    }
    plates.push([x - Math.sign(x) * 0.2, TOP - 0.05, z + Math.sign(z) * 0.058]);
  }
  root.add(G.box(2 * O - B, 0.05, 0.05, frameMat, [0, Y0 + H, -O], 0.006), G.box(0.05, 0.05, 2 * O - B, frameMat, [-O, Y0 + H, 0], 0.006));
  const bolts = screws(plates, 0.014, 'z', steel); bolts.userData.noShadow = true; root.add(bolts);
  // the screen is one long sheet for the three walls, stretched over steel cable that makes the two back corners
  for (const sx of [-1, 1]) root.add(G.rod([sx * (H + 0.012), Y0, -H - 0.012], [sx * (H + 0.012), TOP, -H - 0.012], 0.008, steel, 6));
  for (const [a, b] of [[[-H, TOP + 0.01, -H - 0.01], [H, TOP + 0.01, -H - 0.01]], [[-H - 0.01, TOP + 0.01, -H], [-H - 0.01, TOP + 0.01, H]], [[H + 0.01, TOP + 0.01, -H], [H + 0.01, TOP + 0.01, H]]] as [V3, V3][]) root.add(G.rod(a, b, 0.008, steel, 6));
  // the infrared emitters that keep the shutters of the glasses in step with the screens, at the top of the back wall
  const eyes: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) {
    root.add(G.box(0.12, 0.07, 0.07, black, [sx * 0.9, TOP + 0.155, -O + 0.01], 0.01));
    eyes.push(new THREE.PlaneGeometry(0.08, 0.035).rotateX(-0.3).translate(sx * 0.9, TOP + 0.155, -O + 0.046));
  }
  const ir = new THREE.Mesh(G.merge(eyes), M.glow(0x4a0808, 0.6)); ir.userData.noShadow = true; root.add(ir);

  // behind the right wall: the projector on its rack throws its picture at a mirror, which folds it onto the back of the screen
  const kit = G.group();
  const proj = projector(); proj.position.set(MX, MY, PD + 0.09); kit.add(proj);
  const RK = MY - 0.17, legs: [number, number][] = [[-0.36, PD + 0.12], [0.36, PD + 0.12], [-0.36, PD + 0.95], [0.36, PD + 0.95]];
  for (const [dx, z] of legs) kit.add(G.box(0.04, RK, 0.04, frameMat, [MX + dx, RK / 2, z], 0.005), stub(0.03, 0.03, M.rubber(), [MX + dx, 0.015, z], 10));
  kit.add(G.box(0.8, 0.03, 0.9, frameMat, [MX, RK - 0.015, PD + 0.535], 0.006), G.box(0.8, 0.025, 0.9, frameMat, [MX, 0.42, PD + 0.535], 0.006));
  // on the lower shelf, the workstation that draws this wall's picture. One drew each screen
  kit.add(G.rbox(0.42, 0.5, 0.62, 0.02, M.plastic(0x34313c, 0.45), [MX - 0.12, 0.69, PD + 0.55]), G.box(0.3, 0.02, 0.005, M.plastic(0x15161a, 0.4), [MX - 0.12, 0.86, PD + 0.236], 0));
  const gv = vents(0.3, 0.22, 8, [MX - 0.12, 0.6, PD + 0.238], false); gv.userData.noShadow = true; kit.add(gv);
  kit.add(G.wire([[MX - 0.12, 0.94, PD + 0.7], [MX + 0.05, 1.2, PD + 0.85], [MX + 0.2, RK + 0.05, PD + 0.9]], 0.012, black));
  // the mirror: a sheet of glass silvered on the front, in a frame on an upright stand, turned at 45 degrees. The far edge of
  // the beam meets it much further along than the near edge, so it is wide, tall, and set off to one side of the axis
  const MW = 2.15, MH = 2.62, MC = -0.56, mir = G.group();
  const silver = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.04, metalness: 1 });
  mir.add(G.plane(MW, MH, silver, [0, 0, 0.012]), G.box(MW + 0.06, MH + 0.06, 0.02, frameMat, [0, 0, 0], 0.006));
  for (const sx of [-1, 1]) mir.add(G.box(0.05, 0.05, 0.06, M.dark(), [sx * (MW / 2 + 0.045), 0, -0.01], 0.005));
  mir.position.set(MX + MC, MY, MC); mir.rotation.y = -Math.PI / 4;
  kit.add(mir);
  for (const sx of [-1, 1]) {
    const px = MX + MC + (sx * (MW / 2 + 0.08)) / Math.SQRT2, pz = MC + (sx * (MW / 2 + 0.08)) / Math.SQRT2;
    kit.add(G.box(0.05, MY + 0.9, 0.05, frameMat, [px, (MY + 0.9) / 2, pz], 0.006));
    const foot = G.box(0.5, 0.04, 0.07, frameMat, [px, 0.02, pz], 0.006); foot.rotation.y = Math.PI / 4; kit.add(foot);
  }
  root.add(kit);
  // its light: from the lenses to the mirror, and from the mirror, spread, to the whole back of the screen
  const beamMat = M.add(null, 0xd6dcff, 0), lensAt: V3 = [MX, MY - 0.03, PD], ghost = new THREE.Vector3(MX + PD, MY - 0.03, 0);
  const wallC: V3[] = [[H + 0.002, Y0, H], [H + 0.002, Y0, -H], [H + 0.002, TOP, -H], [H + 0.002, TOP, H]];
  // where each edge of the beam meets the mirror: on the line from the projector's image in the mirror to that corner of the screen
  const n = new THREE.Vector3(-1, 0, 1).normalize(), M0 = new THREE.Vector3(MX, MY, 0), on: V3[] = wallC.map((c) => {
    const C = new THREE.Vector3(...c), d = C.clone().sub(ghost), t = M0.clone().sub(ghost).dot(n) / d.dot(n);
    return ghost.clone().addScaledVector(d, t).toArray() as V3;
  });
  // on the mirror, the picture the beam carries, spread over the patch of glass it lights: each corner of that patch
  // shows what the matching corner of the screen shows, and seen in the glass it is the right way round
  const patch = new THREE.BufferGeometry();
  patch.setAttribute('position', new THREE.Float32BufferAttribute(on.flatMap((q) => [q[0] + n.x * 0.025, q[1], q[2] + n.z * 0.025]), 3));
  patch.setAttribute('src', new THREE.Float32BufferAttribute(wallC.flatMap((c) => [H, c[1], c[2]]), 3));
  patch.setIndex([0, 1, 2, 0, 2, 3]);
  const glassPicture = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide, fragmentShader: PICTURE,
    vertexShader: 'attribute vec3 src; varying vec3 vObj; void main() { vObj = src; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  });
  const reflected = new THREE.Mesh(patch, glassPicture); reflected.userData.noShadow = true;
  root.add(reflected);
  const beams = new THREE.Mesh(G.merge([cone(lensAt, on, beamMat), ...on.map((p, i) => cone(p, [on[(i + 1) % 4], wallC[(i + 1) % 4], wallC[i], wallC[i]], beamMat))].map((m) => m.geometry)), beamMat);
  beams.userData.noShadow = true;
  root.add(beams);

  // above the open side, the projector for the floor, aimed down and back so that a visitor's shadow falls behind them
  const fp = projector(), FP: V3 = [0, TOP + 0.3, H + 0.42];
  fp.position.set(...FP); fp.rotation.x = Math.atan2(Y0 - FP[1], FP[2] + 0.25);
  root.add(fp);
  // a yoke on the header holds it by two pivots at its sides
  fp.updateMatrix();
  const pivot = new THREE.Vector3();
  for (const sx of [-1, 1]) {
    pivot.set(sx * 0.41, 0, 0.35).applyMatrix4(fp.matrix);
    root.add(G.rod([sx * 0.41, TOP + 0.12, O], [pivot.x, pivot.y, pivot.z], 0.022, frameMat, 8), G.rod([sx * 0.41, TOP + 0.12, O - 0.3], [pivot.x, pivot.y, pivot.z], 0.018, frameMat, 8), stub(0.04, 0.05, M.dark(), [pivot.x, pivot.y, pivot.z], 14).rotateZ(Math.PI / 2));
  }
  const fLens = new THREE.Vector3(0, -0.03, -0.1).applyMatrix4(fp.matrix);
  u.uProj.value.copy(fLens);
  const floorBeam = cone(fLens.toArray() as V3, [[-H, Y0 + 0.004, H], [H, Y0 + 0.004, H], [H, Y0 + 0.004, -H], [-H, Y0 + 0.004, -H]], M.add(null, 0xd6dcff, 0));
  root.add(floorBeam);

  // the visitor inside: a lay figure in shutter glasses, with the wand
  const { fig, body, L, R, LA, RA, wand } = layFigure(wood, glasses, steel);
  root.add(fig);
  // the cables of the two sensors, thin and tethered: down the back of the figure, onto the floor, and out under the
  // back right corner of the screen to the electronics
  const exit = new THREE.Vector3(H - 0.04, Y0 + 0.006, -H + 0.04);
  const cables = [0, 1].map(() => {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6 * 3), 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x15161a })); line.frustumCulled = false; line.userData.noFit = true;
    root.add(line);
    return line;
  });

  fuse(root, [fig, screens, beams, floorBeam, reflected]);

  // the figure's walk: from one place to the next, a pause at each to look at one thing
  const stops: { x: number; z: number; look: V3; rest: number }[] = [
    { x: -0.72, z: 0.2, look: [0.42, Y0 + 1.5, -0.8], rest: 4.0 },
    { x: 0.35, z: 0.35, look: [-1.04, Y0 + 0.5, -1.0], rest: 3.0 },
    { x: 0.05, z: -0.3, look: [0.0, Y0 + 2.2, -11], rest: 3.4 },
  ];
  const V = 0.5, TURN = 0.9;
  const legsOf = stops.map((a, i) => { const b = stops[(i + 1) % stops.length]; return Math.hypot(b.x - a.x, b.z - a.z) / V; });
  const cycle = stops.reduce((s, st, i) => s + st.rest + TURN + legsOf[i], 0);
  const eye = new THREE.Vector3(), cam = new THREE.Vector3(), head = new THREE.Vector3(), wtip = new THREE.Vector3();
  const rot = new THREE.Matrix4(), rot3 = new THREE.Matrix3(), eu = new THREE.Euler();
  const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
  /** Where the figure is at a moment: position, which way it faces, and how far it has walked since the cycle began. */
  const now = { x: 0, z: 0, face: 0, walked: 0 };
  const pose = (t: number): typeof now => {
    let at = t % cycle, walked = 0;
    for (let i = 0; i < stops.length; i++) {
      const a = stops[i], b = stops[(i + 1) % stops.length], dir = Math.atan2(b.x - a.x, b.z - a.z);
      const face = Math.atan2(a.look[0] - a.x, a.look[2] - a.z);
      now.x = a.x; now.z = a.z; now.face = face; now.walked = walked;
      if (at < a.rest) return now;
      at -= a.rest;
      if (at < TURN) { const k = at / TURN; now.face = face + wrap(dir - face) * k * k * (3 - 2 * k); return now; }
      at -= TURN;
      if (at < legsOf[i]) { const k = at / legsOf[i]; now.x = a.x + (b.x - a.x) * k; now.z = a.z + (b.z - a.z) * k; now.face = dir; now.walked = walked + at * V; return now; }
      at -= legsOf[i]; walked += legsOf[i] * V;
    }
    return now;
  };
  const place = (t: number, lights: number, inside: boolean) => {
    const ahead = pose(t + 0.05).walked, { x, z, face: yaw, walked } = pose(t);
    // one stride, two steps, is 1.3 metres
    const ph = (walked / 1.3) * Math.PI * 2, moving = ahead !== walked ? 1 : 0;
    fig.position.set(x, Y0, z); fig.rotation.y = yaw;
    body.position.y = moving * 0.012 * Math.abs(Math.cos(ph));
    L.thigh.rotation.x = -0.34 * Math.sin(ph) * moving; R.thigh.rotation.x = 0.34 * Math.sin(ph) * moving;
    L.shin.rotation.x = Math.max(0, Math.sin(ph + 1.4)) * 0.6 * moving + 0.03; R.shin.rotation.x = Math.max(0, -Math.sin(ph + 1.4)) * 0.6 * moving + 0.03;
    LA.upper.rotation.x = 0.28 * Math.sin(ph) * moving + 0.06; LA.fore.rotation.x = -0.25;
    // the right arm holds the wand out in front
    RA.upper.rotation.set(-0.75 - 0.05 * Math.sin(t * 0.7), 0, 0.08); RA.fore.rotation.x = -0.55;
    // the eyes, behind the glasses, a little in front of the middle of the head
    head.set(x, Y0 + 1.65 + body.position.y, z);
    eye.set(Math.sin(yaw) * 0.08, 0, Math.cos(yaw) * 0.08).add(head);
    u.uFig.value.set(x, Y0, z);
    // inside, the visitor's own eye is the one that is tracked: the dummy steps aside and the picture is drawn for the camera
    fig.visible = !inside; u.uFigOn.value = inside ? 0 : 1;
    u.uEye.value.copy(inside ? cam : eye);
    u.uL.value = lights;
    for (const line of cables) line.visible = !inside;
    if (inside) return;
    // the tethers: from the sensor on the glasses down the back, and from the end of the wand to the hip. Both reach the
    // floor behind the heels and lie on it to the corner
    fig.updateMatrixWorld(true);
    wand.localToWorld(wtip.set(0, -0.27, -0.025)); root.worldToLocal(wtip);
    const sy = Math.sin(yaw), cy = Math.cos(yaw);
    for (let k = 0; k < 2; k++) {
      const arr = (cables[k].geometry.attributes.position as THREE.BufferAttribute).array as Float32Array, side = k ? 0.12 : 0.02;
      if (k) { arr[0] = wtip.x; arr[1] = wtip.y; arr[2] = wtip.z; arr[3] = x + cy * side - sy * 0.02; arr[4] = Y0 + 0.95; arr[5] = z - sy * side - cy * 0.02; }
      else { arr[0] = head.x - sy * 0.1; arr[1] = head.y + 0.05; arr[2] = head.z - cy * 0.1; arr[3] = x - sy * 0.13; arr[4] = Y0 + 1.35; arr[5] = z - cy * 0.13; }
      arr[6] = x + cy * side - sy * 0.14; arr[7] = Y0 + 0.9; arr[8] = z - sy * side - cy * 0.14;
      arr[9] = x + cy * side - sy * 0.3; arr[10] = Y0 + 0.006; arr[11] = z - sy * side - cy * 0.3;
      arr[12] = (arr[9] + exit.x) / 2 + 0.05 * k; arr[13] = Y0 + 0.006; arr[14] = (arr[11] + exit.z) / 2 + 0.08;
      arr[15] = exit.x; arr[16] = exit.y; arr[17] = exit.z;
      cables[k].geometry.attributes.position.needsUpdate = true;
    }
  };
  place(0, 1, false);

  return {
    root, inDark: 'glows', glow: 0xb0a8ff, view: [30, 16], zoom: 1.25,
    // every pixel of the four screens follows a ray through a small world: a phone draws half as many each way
    thrift: 0.5,
    views: {
      inside: { at: [0.05, Y0 + 1.62, 1.2], to: [0, Y0 + 1.3, -H], fov: 72, play: 0.1 },
      behind: { at: [MX + 1.9, Y0 + 4.6, 5.6], to: [MX - 0.75, MY - 0.2, -0.4], fov: 46, play: 0.25 },
    },
    update: ({ t, lights, camera }) => {
      root.updateWorldMatrix(true, false);
      root.worldToLocal(cam.copy(camera.position));
      const inside = Math.abs(cam.x) < H && Math.abs(cam.z) < H + 0.4 && cam.y > Y0 && cam.y < TOP;
      place(t, lights, inside);
      // the cube in the picture turns slowly in the air
      eu.set(0.5, t * 0.35, 0.25 + 0.2 * Math.sin(t * 0.2)); rot.makeRotationFromEuler(eu); rot3.setFromMatrix4(rot).transpose();
      u.uRot.value.copy(rot3);
      const dark = 1 - lights;
      beamMat.opacity = 0.012 + 0.05 * dark; (floorBeam.material as THREE.MeshBasicMaterial).opacity = inside ? 0 : 0.01 + 0.03 * dark;
    },
  };
}
