import { G, M, Swarm, beam, halo, screen, THREE, type Built } from '../kit';
import { lens, screws } from '../parts';
import { landscape, type Land } from '../vista';

/** The two oldest pieces of hall 4: a picture made with a hole and a sheet of paper, and one made with a flame, a cloth and flat figures. */

const rad = (d: number) => (d * Math.PI) / 180;
/** 0 below 0, 1 above 1, and an eased step between. */
const ease = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };

/**
 * The land outside the windows, once it has been painted. It is asked for as soon as this file is loaded in a
 * browser, so that a still picture taken the moment the room is ready already has it.
 */
let land: Land | undefined;
if (typeof document !== 'undefined') void landscape().then((l) => { land = l; });
/**
 * How that land lies in its painted picture: bearings 112 to 262 across the western four fifths of the width,
 * and heights from 19 degrees below the level to 7.5 above, spaced by their tangent. Keep in step with vista.ts.
 */
const LAND = { from: 112, to: 262, left: 0.2, top: Math.tan(rad(7.5)), foot: Math.tan(rad(-19)) };
/** The bearing straight out of the windows of the hall: the middle of the massif. The hole looks that way. */
const AXIS = 147;
/** The hall stands above the town, so the land hangs a little below the level of the eye: this much, as a tangent. */
const DIP = 0.08;

/**
 * Camera obscura: a dark chamber with a hole in the wall that faces the windows. The view outside lands on the
 * opposite wall, upside down. That wall is a sheet of thin paper, so the picture shows on both of its faces.
 */
export function cameraObscura(): Built {
  const root = G.group();
  const W = 1.5, DEEP = 1.78, T = 0.05, Y0 = 0.07, Y1 = 1.13, HY = 0.6;
  const ZB = -DEEP / 2, ZF = DEEP / 2;                               // the outer faces of the wall with the hole and of the wall with the paper
  const PW = 1.32, PB = HY - 0.25, PT = HY + 0.45, PH = PT - PB, ZP = ZF - T + 0.002;   // the sheet of paper, flush with the inside of its wall
  const D = ZP - (ZB + T / 2);                                       // from the hole to the paper
  const pine = M.wood(0xc39a63, 1), rail = M.wood(0xb98f58, 0), dark = M.wood(0x74502f, 0), soot = M.black(), brass = M.brass();
  /** A board with one face blackened: +x, -x, +y, -y, +z or -z, counted from 0. The other five are drawn in one go. */
  const board = (w: number, h: number, d: number, black: number, x: number, y: number, z: number, wood = pine) => {
    const geo = new THREE.BoxGeometry(w, h, d), order = geo.index!.array, face = Array.from(order.subarray(black * 6, black * 6 + 6));
    order.copyWithin(black * 6, black * 6 + 6); order.set(face, 30);
    geo.clearGroups(); geo.addGroup(0, 30, 0); geo.addGroup(30, 6, 1);
    const m = new THREE.Mesh(geo, [wood, soot]);
    m.position.set(x, y, z);
    return m;
  };

  // the chamber: boards on a plinth, blackened inside. The paper is the whole of the wall opposite the hole, above a low panel
  const mid = (Y0 + Y1) / 2, tall = Y1 - Y0;
  root.add(G.box(W + 0.1, Y0, DEEP + 0.1, dark, [0, Y0 / 2, 0], 0.012), board(W, 0.04, DEEP, 2, 0, Y0 + 0.02, 0, rail));
  root.add(G.cut(W, tall, 0.003, [[0, HY - mid, 0.047]], T, pine, [0, mid, ZB + T / 2], 0.003), G.cut(W - 2 * T, tall - 0.04, 0.002, [[0, HY - mid - 0.02, 0.047]], 0.006, soot, [0, mid + 0.02, ZB + T + 0.003], 0.001));
  root.add(board(W, PB - Y0, T, 5, 0, (Y0 + PB) / 2, ZF - T / 2, rail), board(W, Y1 - PT, T, 5, 0, (PT + Y1) / 2, ZF - T / 2, rail));
  for (const sx of [-1, 1]) root.add(board((W - PW) / 2, PH, T, 5, sx * (W + PW) / 4, (PB + PT) / 2, ZF - T / 2));
  root.add(G.bezel(PW + 0.07, PH + 0.07, PW - 0.012, PH - 0.012, 0.004, 0.016, dark, [0, (PB + PT) / 2, ZF + 0.006], 0.01, 0.004));
  const battens = new Swarm(new THREE.BoxGeometry(0.036, tall, 0.012), rail, 4);
  [-0.73, -0.37, 0.37, 0.73].forEach((x, i) => battens.put(i, x, mid, ZB - 0.006));
  battens.done(); root.add(battens.mesh);
  // what a closed chamber has and a model to look into has not: its roof and its side walls. They are put back when the eye is inside
  const roof = board(W + 0.08, 0.04, DEEP + 0.08, 3, 0, Y1 + 0.02, 0, rail);
  const sides = [-1, 1].map((sx) => {
    const strips = new Swarm(new THREE.BoxGeometry(0.012, tall, 0.036), rail, 5);
    for (let i = 0; i < 5; i++) strips.put(i, sx * (W / 2 + 0.006), mid, (i - 2) * 0.3);
    strips.done();
    return G.group(board(T, tall, DEEP - 2 * T, sx < 0 ? 0 : 1, sx * (W - T) / 2, mid, 0), strips.mesh);
  });
  root.add(roof, ...sides);

  // on the outside of the hole: a brass disc on a pivot, with a small hole at one end and a spectacle lens over a wider opening at the other
  const turret = G.group(G.cut(0.42, 0.46, 0.03, [[0, 0.11, 0.047]], 0.008, M.dark(), [0, -0.02, 0.004], 0.002), screws([[-0.18, -0.22, 0.008], [0.18, -0.22, 0.008], [-0.18, 0.18, 0.008], [0.18, 0.18, 0.008]], 0.012, 'z', brass));
  turret.position.set(0, HY - 0.09, ZB); turret.rotation.y = Math.PI;
  const day = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const spot = (r: number, y: number) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), day); m.position.set(0, y, 0.014); m.rotation.y = Math.PI; return m; };
  const shade = new THREE.MeshBasicMaterial({ color: 0x020202 });
  const disc = G.group(
    G.cut(0.32, 0.32, 0.16, [[0, 0.09, 0.007], [0, -0.09, 0.037]], 0.012, brass, [0, 0, 0.014], 0.003),
    // a blackened recess round the small hole, and the lens in its ring over the wide one
    new THREE.Mesh(new THREE.RingGeometry(0.007, 0.022, 24), M.plastic(0x0c0c0d, 0.8)).translateY(0.09).translateZ(0.0206), lens(0.04, [0, -0.09, 0.02], 0.3, brass),
    G.cyl(0.024, 0.012, M.steel(), [0, 0, 0.026], 20).rotateX(Math.PI / 2), G.box(0.034, 0.005, 0.004, M.dark(), [0, 0, 0.032], 0),
    G.cyl(0.013, 0.034, brass, [0.125, 0, 0.037], 16).rotateX(Math.PI / 2),
    // the daylight in each opening, as it is seen from inside the chamber, and the dark of the chamber, as each shows it to the outside
    spot(0.007, 0.09), spot(0.037, -0.09),
    new THREE.Mesh(new THREE.CircleGeometry(0.0072, 16), shade).translateY(0.09).translateZ(0.0144), new THREE.Mesh(new THREE.CircleGeometry(0.0372, 28), shade).translateY(-0.09).translateZ(0.0144),
  );
  // the face of the disc that looks into the chamber is blackened, like everything else in there
  const inner = new THREE.Shape().absarc(0, 0, 0.155, 0, Math.PI * 2);
  for (const [y, r] of [[0.09, 0.0075], [-0.09, 0.037]]) inner.holes.push(new THREE.Path().absarc(0, y, r, 0, Math.PI * 2, true));
  disc.add(new THREE.Mesh(new THREE.ShapeGeometry(inner, 32), soot).rotateY(Math.PI).translateZ(-0.0078));
  turret.add(disc);
  root.add(turret);

  // the picture: the land outside as straight lines through the hole lay it on the paper, and the lamps of the town for the night
  const CW = 1024, CH = 544, pic = screen(CW, CH), lamps = screen(CW / 2, CH / 2);
  let painted = false;
  const paint = () => {
    const c = pic.ctx, l = lamps.ctx, row = (y: number) => ((PT - y) / PH) * CH;
    c.setTransform(1, 0, 0, 1, 0, 0); l.setTransform(1, 0, 0, 1, 0, 0);
    // the sky: white at the level, bluer above, which on the paper is below
    const sky = c.createLinearGradient(0, row(HY), 0, CH);
    sky.addColorStop(0, '#ebeded'); sky.addColorStop(1, '#d6e0ec');
    c.fillStyle = sky; c.fillRect(0, 0, CW, CH);
    l.fillStyle = '#000'; l.fillRect(0, 0, CW / 2, CH / 2);
    if (land) {
      // one upright strip of paper at a time: its bearing, and how far it is from the hole, which is what stretches the land up it
      const N = 256, col = (x: number) => { const az = AXIS - Math.atan(x / D) * (180 / Math.PI); return LAND.left + ((az - LAND.from) / (LAND.to - LAND.from)) * (1 - LAND.left); };
      for (const [g, from, k] of [[c, land.land, 1], [l, land.lights, 0.5]] as const) {
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
        for (let i = 0; i < N; i++) {
          const x0 = (i / N - 0.5) * PW, x1 = ((i + 1) / N - 0.5) * PW, far = Math.hypot((x0 + x1) / 2, D);
          const sx = col(x1) * from.width, sw = col(x0) * from.width - sx;
          const low = row(HY - far * (LAND.top - DIP)) * k, high = row(HY - far * (LAND.foot - DIP)) * k;
          // turned about the hole: the east of the land goes to the west of the paper, and its top to the bottom
          g.setTransform(-1, 0, 0, -1, ((i + 1) / N) * CW * k + 0.3, low);
          g.drawImage(from, sx, 0, sw, from.height, 0, 0, (CW / N) * k + 0.6, low - high);
        }
        g.setTransform(1, 0, 0, 1, 0, 0);
      }
      painted = true;
    }
    pic.tex.needsUpdate = lamps.tex.needsUpdate = true;
  };
  paint();
  const u = { tPic: { value: pic.tex }, tLamps: { value: lamps.tex }, uL: { value: 1 }, uGain: { value: 0.62 }, uNight: { value: 0.04 }, uBlur: { value: 2.3 }, uSize: { value: new THREE.Vector2(CW, CH) }, uHole: { value: new THREE.Vector3(PW / D, PH / D, (HY - PB) / PH) } };
  const sheet = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D tPic, tLamps; uniform float uL, uGain, uNight, uBlur; uniform vec2 uSize; uniform vec3 uHole; varying vec2 vUv;
      void main() {
        // never sharper than the opening allows, and never finer than the eye can tell from where it is
        vec2 px = vUv * uSize, ax = dFdx(px), ay = dFdy(px);
        float lod = max(uBlur, 0.5 * log2(max(dot(ax, ax), dot(ay, ay))));
        vec3 pic = textureLod(tPic, vUv, lod).rgb, lamp = textureLod(tLamps, vUv, max(0.0, lod - 1.0)).rgb;
        // by night the land outside is a few blues and the lamps people leave on: the mixture of the windows, with the blues too faint to pass a hole
        vec3 seen = mix((pic * vec3(0.004, 0.006, 0.016) + lamp * 1.2) * uNight, pic * 1.22 * uGain, uL);
        // light that lands far from the axis arrives at a slant and from further off
        vec2 off = (vUv - vec2(0.5, uHole.z)) * uHole.xy;
        seen /= pow(1.0 + dot(off, off), 2.0);
        // the paper is thin. On the side away from the hole the picture shows through, over what the room throws on the sheet
        vec3 col = gl_FrontFacing ? seen * 0.86 + vec3(0.1, 0.097, 0.09) * (0.04 + 0.96 * uL) : seen;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  // kept on the material as well, so that whoever clears the stand lets go of the two pictures with it
  Object.assign(sheet, { picture: pic.tex, night: lamps.tex });
  root.add(new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), sheet).translateY((PB + PT) / 2).translateZ(ZP));

  // the light on its way: the bundle from the hole to the paper, and two lines that cross in the hole, one from the sky and one from the town
  const A = [0, HY, ZB + T], corners = [[-PW / 2, PB], [PW / 2, PB], [PW / 2, PT], [-PW / 2, PT]];
  const cone = new THREE.BufferGeometry();
  cone.setAttribute('position', new THREE.Float32BufferAttribute(corners.flatMap(([x, y], i) => [...A, x, y, ZP, corners[(i + 1) % 4][0], corners[(i + 1) % 4][1], ZP]), 3));
  const bundle = new THREE.Mesh(cone, M.add(null, 0xe4ecf4, 0));
  const rays = [[PB + 0.07, 0xbcd6ff], [PT - 0.07, 0xffc48a]].map(([y, colour]) => {
    const ray = beam(colour, 0), out = 0.5, slope = (y - HY) / D;
    ray.aim([0, HY - slope * (out + T / 2), ZB - out], [0, y, ZP - 0.002]);
    // the part of a line that is outside the chamber takes up no room on the stand
    ray.line.userData.noFit = true;
    root.add(ray.line);
    return ray.line.material as THREE.LineBasicMaterial;
  });
  const flare = halo(0xeaf2ff, 0.2, [0, HY, ZB + T + 0.012], 0);
  root.add(bundle, flare);

  const eye = new THREE.Vector3();
  let near = 1;
  return {
    root, inDark: 'vanishes', view: [34, 21],
    views: { inside: { at: [0, HY + 0.02, ZB + 0.3], to: [0, (PB + PT) / 2, ZP], fov: 50, play: 0.08 }, hole: { at: [0.46, HY + 0.2, ZB - 0.3], to: [0, HY - 0.05, ZB], play: 0.3 } },
    update: ({ t, lights, camera }) => {
      if (!painted && land) paint();
      // the disc rests with the small hole over the opening, turns the lens into its place, rests there, and turns back
      const at = t % 18, k = ease((at - 9) / 1.4) - ease((at - 16.6) / 1.4);
      disc.rotation.z = k * Math.PI;
      // the small hole leaves the opening early in the turn, and the lens comes over it late: between the two the chamber is shut.
      // By day the eye makes up for much of the difference between the two openings. By night it can not: the small hole passes a few hundredths of what the lens does
      const hole = 1 - ease((k - 0.1) / 0.06), glass = ease((k - 0.72) / 0.28), e = lights * lights * (3 - 2 * lights);
      u.uL.value = e; u.uGain.value = 0.62 * hole + 1.02 * glass; u.uNight.value = 0.04 * hole + glass; u.uBlur.value = glass > 0 ? 2.3 * (1 - glass) * (1 - glass) : 2.3;
      day.color.setRGB(2.6 * e, 2.7 * e, 2.9 * e);
      // from outside, the roof and the nearer side wall are away. Inside, the chamber is whole and the bundle of light is not drawn across the view
      root.updateWorldMatrix(true, false);
      root.worldToLocal(eye.copy(camera.position));
      const inside = Math.abs(eye.x) < W / 2 && eye.z > ZB && eye.z < ZF && eye.y > Y0 && eye.y < Y1 + 0.04;
      if (Math.abs(eye.x) > 0.03) near = Math.sign(eye.x);
      roof.visible = inside; sides[0].visible = inside || near > 0; sides[1].visible = inside || near < 0;
      const lit = e * (hole + glass);
      (bundle.material as THREE.MeshBasicMaterial).opacity = inside ? 0 : 0.05 * lit;
      for (const ray of rays) ray.opacity = inside ? 0 : 0.75 * lit;
      // the opening itself, as a point of daylight in the dark wall: larger and brighter with the lens in it
      flare.material.opacity = e * (0.5 * hole + 0.9 * glass); flare.scale.setScalar(0.16 + 0.14 * glass);
    },
  };
}

type Ctx = CanvasRenderingContext2D;
/** Cut holes through what has been drawn: the piercing through which the lamp draws bright lines inside a shadow. */
const pierce = (c: Ctx, cut: () => void) => { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.strokeStyle = '#000'; cut(); c.restore(); };
/** Paint on the hide and nowhere else. */
const onHide = (c: Ctx, paint: () => void) => { c.save(); c.globalCompositeOperation = 'source-atop'; paint(); c.restore(); };
const dot = (c: Ctx, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
/** A pointed oval, as a punch leaves it: at (x, y), `l` long and `w` wide, lying along angle `a`. */
const slit = (c: Ctx, x: number, y: number, l: number, w: number, a: number) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-l / 2, 0); c.quadraticCurveTo(0, -w, l / 2, 0); c.quadraticCurveTo(0, w, -l / 2, 0); c.fill(); c.restore(); };

/** A tree, 400 by 736: trunk, three boughs and a crown of leaves. Its foot is at the middle of the lower edge. */
function drawTree(c: Ctx): void {
  c.fillStyle = c.strokeStyle = '#573720'; c.lineCap = 'round';
  c.beginPath(); c.moveTo(183, 736); c.bezierCurveTo(189, 610, 176, 520, 189, 410); c.lineTo(213, 410); c.bezierCurveTo(205, 520, 217, 610, 219, 736); c.closePath(); c.fill();
  c.lineWidth = 15; for (const [x, y] of [[112, 300], [200, 236], [290, 308]]) { c.beginPath(); c.moveTo(200, 430); c.quadraticCurveTo(200, 356, x, y); c.stroke(); }
  const lobes = [[200, 150, 92], [112, 215, 78], [290, 222, 80], [150, 300, 70], [252, 305, 72], [200, 250, 88], [72, 298, 46], [330, 304, 46]];
  c.fillStyle = '#2c5a34'; for (const [x, y, r] of lobes) dot(c, x, y, r);
  onHide(c, () => {
    c.strokeStyle = '#173c22'; c.lineWidth = 5; for (const [x, y, r] of lobes) { c.beginPath(); c.arc(x, y, r - 4, 0, 7); c.stroke(); }
    c.fillStyle = '#d6a428'; for (const [x, y, r] of lobes) for (let k = 0; k < 9; k++) dot(c, x + Math.cos(k * 0.7 + x) * r * 0.78, y + Math.sin(k * 0.7 + x) * r * 0.78, 4);
    c.fillStyle = '#a3261d'; for (const [x, y] of [[150, 170], [246, 176], [200, 300], [104, 250], [300, 262]]) dot(c, x, y, 9);
    c.strokeStyle = '#d6a428'; c.lineWidth = 3; c.beginPath(); c.moveTo(200, 720); c.lineTo(200, 430); c.stroke();
  });
  pierce(c, () => { for (const [x, y, r] of lobes) for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + y; slit(c, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.34, r * 0.1, a); } for (const [x, y] of lobes) dot(c, x, y, 7); });
}

/** A deer without its head, 400 by 352, looking left. It is held by a rod under the belly, at (212, 214). */
function drawDeer(c: Ctx): void {
  c.fillStyle = c.strokeStyle = '#8f4f26'; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.ellipse(212, 150, 108, 50, -0.04, 0, 7); c.fill(); dot(c, 128, 138, 46); dot(c, 296, 142, 56); dot(c, 108, 104, 30);
  c.lineWidth = 15; for (const [x0, x1, x2] of [[136, 128, 120], [164, 170, 178], [286, 304, 292], [314, 334, 326]]) { c.beginPath(); c.moveTo(x0, 176); c.lineTo(x1, 262); c.lineTo(x2, 322); c.stroke(); }
  c.fillStyle = '#2a1a10'; for (const x of [120, 178, 292, 326]) { c.beginPath(); c.ellipse(x - 3, 326, 12, 7, 0, 0, 7); c.fill(); }
  c.fillStyle = '#8f4f26'; c.beginPath(); c.moveTo(338, 118); c.quadraticCurveTo(372, 92, 362, 62); c.quadraticCurveTo(344, 84, 322, 104); c.closePath(); c.fill();
  onHide(c, () => {
    c.fillStyle = '#c98b46'; c.beginPath(); c.ellipse(214, 186, 96, 22, 0, 0, 7); c.fill();
    c.strokeStyle = '#3a1f10'; c.lineWidth = 4; c.beginPath(); c.ellipse(212, 150, 100, 43, -0.04, 0, 7); c.stroke();
    c.fillStyle = '#e2b53c'; for (let k = 0; k < 9; k++) dot(c, 150 + k * 17, 132 + Math.sin(k * 0.9) * 9, 5);
    c.strokeStyle = '#e2b53c'; c.lineWidth = 4; c.beginPath(); c.arc(296, 142, 34, 0, 7); c.stroke();
  });
  pierce(c, () => { for (let k = 0; k < 10; k++) dot(c, 132 + k * 17, 112 + Math.sin(k * 0.5) * 5, 3.6); for (let k = 0; k < 8; k++) slit(c, 296 + Math.cos(k * 0.785) * 20, 142 + Math.sin(k * 0.785) * 20, 17, 5, k * 0.785); dot(c, 296, 142, 5); for (let k = 0; k < 4; k++) slit(c, 160 + k * 24, 160, 22, 5, 1.1); });
}

/** Its head, neck and antlers, 240 by 288. The neck is pinned to the shoulder at (188, 248) and the head is worked by a rod at the jaw. */
function drawHead(c: Ctx): void {
  c.fillStyle = c.strokeStyle = '#8f4f26'; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(214, 250); c.quadraticCurveTo(170, 150, 118, 96); c.lineTo(84, 130); c.quadraticCurveTo(132, 190, 150, 268); c.closePath(); c.fill(); dot(c, 186, 250, 30);
  c.beginPath(); c.ellipse(86, 104, 46, 28, -0.35, 0, 7); c.fill(); c.beginPath(); c.ellipse(48, 124, 24, 15, -0.2, 0, 7); c.fill();
  c.beginPath(); c.moveTo(112, 84); c.quadraticCurveTo(150, 60, 156, 96); c.quadraticCurveTo(134, 100, 112, 84); c.fill();
  c.strokeStyle = '#3a2414'; c.lineWidth = 9;
  for (const [dx, lean] of [[0, 1], [-26, -0.5]]) {
    c.beginPath(); c.moveTo(104 + dx, 80); c.quadraticCurveTo(110 + dx + lean * 12, 44, 126 + dx + lean * 30, 22); c.stroke();
    c.lineWidth = 7; for (const [u, l] of [[0.35, 26], [0.7, 20]]) { const x = 104 + dx + lean * 24 * u + 6 * u, y = 80 - 58 * u; c.beginPath(); c.moveTo(x, y); c.lineTo(x - l * 0.8, y - l * 0.7); c.stroke(); }
    c.lineWidth = 9;
  }
  onHide(c, () => { c.strokeStyle = '#e2b53c'; c.lineWidth = 4; c.beginPath(); c.moveTo(196, 236); c.quadraticCurveTo(160, 156, 112, 110); c.stroke(); c.fillStyle = '#2a1a10'; dot(c, 30, 124, 6); });
  pierce(c, () => { slit(c, 84, 98, 20, 7, -0.3); dot(c, 84, 98, 3); for (let k = 0; k < 4; k++) dot(c, 136 + k * 14, 150 + k * 22, 3.6); slit(c, 46, 132, 22, 3, -0.15); });
}

/** A bird without its wing, 288 by 160, flying to the right. Its rod is at (150, 88). */
function drawBird(c: Ctx): void {
  c.fillStyle = '#7d2a22';
  for (const [x, y] of [[22, 52], [14, 90], [26, 126]]) { c.beginPath(); c.moveTo(104, 76); c.quadraticCurveTo(60, y - 12, x, y); c.quadraticCurveTo(64, y + 14, 106, 98); c.closePath(); c.fill(); }
  c.fillStyle = '#1f4f6b'; c.beginPath(); c.ellipse(150, 88, 60, 29, -0.06, 0, 7); c.fill(); dot(c, 212, 70, 23);
  c.fillStyle = '#d6a428'; c.beginPath(); c.moveTo(230, 60); c.lineTo(266, 74); c.lineTo(230, 84); c.closePath(); c.fill();
  onHide(c, () => { c.strokeStyle = '#d6a428'; c.lineWidth = 4; c.beginPath(); c.ellipse(150, 88, 52, 22, -0.06, 0, 7); c.stroke(); c.fillStyle = '#e9d7a0'; c.beginPath(); c.ellipse(152, 104, 44, 9, -0.06, 0, 7); c.fill(); });
  pierce(c, () => { dot(c, 216, 66, 4.5); for (let k = 0; k < 5; k++) slit(c, 118 + k * 17, 84, 15, 5, -0.9); for (const y of [56, 90, 122]) slit(c, 58, y + (y - 90) * 0.1, 44, 4, (y - 90) * 0.012); });
}

/** Its wing, 160 by 160, hinged at the root, (80, 140), and worked by a rod half way up. */
function drawWing(c: Ctx): void {
  c.fillStyle = '#1f4f6b'; c.beginPath(); c.moveTo(62, 140); c.quadraticCurveTo(20, 96, 24, 34); c.quadraticCurveTo(52, 44, 60, 22); c.quadraticCurveTo(82, 40, 96, 20); c.quadraticCurveTo(110, 44, 134, 36); c.quadraticCurveTo(140, 100, 98, 140); c.closePath(); c.fill();
  onHide(c, () => { c.fillStyle = '#7d2a22'; c.beginPath(); c.ellipse(80, 122, 26, 14, 0, 0, 7); c.fill(); c.strokeStyle = '#d6a428'; c.lineWidth = 3; for (const x of [40, 62, 96, 118]) { c.beginPath(); c.moveTo(80, 126); c.lineTo(x, 50); c.stroke(); } });
  pierce(c, () => { for (const [x, a] of [[51, 1.36], [79, 1.57], [107, 1.78]]) slit(c, x, 70, 52, 5, a); dot(c, 80, 122, 4); });
}

// ---------- the second act: black card, cut the way Lotte Reiniger cut her figures ----------
// Her figures were black cardboard and thin lead, every limb cut separately and joined with wire hinges, laid on
// glass and lit from below (BFI, Sight and Sound 1936). These are new figures in that manner, made to fit the same
// joints as the first act's: none of them is taken from a film of hers.
const CARD = '#121010';
/** A curl that winds in to its centre: the ends of her branches, horns, tails and borders. */
const curl = (c: Ctx, x: number, y: number, r: number, turns: number, start: number, dir = 1) => {
  c.beginPath();
  for (let k = 0; k <= 48; k++) { const u = k / 48, a = start + dir * u * turns * Math.PI * 2, rr = r * (1 - 0.85 * u); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (k) c.lineTo(px, py); else c.moveTo(px, py); }
  c.stroke();
};
/** A leaf as her scissors leave it: a teardrop on a stalk. */
const leaf = (c: Ctx, x: number, y: number, l: number, a: number) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(l * 0.3, -l * 0.32, l * 0.85, -l * 0.18, l, 0); c.bezierCurveTo(l * 0.85, l * 0.18, l * 0.3, l * 0.32, 0, 0); c.fill(); c.restore(); };

/** The tree, as a lace of curling boughs, 400 by 736. */
function laceTree(c: Ctx): void {
  c.fillStyle = c.strokeStyle = CARD; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(178, 736); c.bezierCurveTo(196, 640, 160, 560, 186, 440); c.lineTo(214, 440); c.bezierCurveTo(196, 560, 232, 640, 224, 736); c.closePath(); c.fill();
  const boughs: [number, number, number, number, number][] = [[200, 452, 70, 250, -1], [200, 452, 330, 240, 1], [200, 440, 120, 120, -1], [200, 440, 290, 110, 1], [200, 430, 205, 70, 1], [196, 520, 40, 400, -1], [204, 520, 360, 392, 1]];
  for (const [x0, y0, x1, y1, d] of boughs) {
    c.lineWidth = 11; c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + (x1 - x0) * 0.2, y0 - 90, x1 - d * 60, y1 + 60, x1, y1); c.stroke();
    c.lineWidth = 7; curl(c, x1 + d * 18, y1 - 4, 22, 1.25, d > 0 ? Math.PI : 0, d);
    for (let k = 0; k < 9; k++) { const u = 0.3 + k * 0.08, bx = x0 + (x1 - x0) * u, by = y0 + (y1 - y0) * u - 70 * Math.sin(Math.PI * u); leaf(c, bx, by, 30, -Math.PI / 2 + d * (0.5 + 0.25 * Math.sin(k * 1.7)) + (k % 2 ? 0.9 : -0.9)); }
  }
  c.lineWidth = 6; for (const [x, y, r, d] of [[120, 60, 26, 1], [280, 54, 26, -1], [200, 26, 20, 1], [56, 170, 22, -1], [344, 160, 22, 1]]) curl(c, x, y, r, 1.1, 0, d);
  c.lineWidth = 9; c.beginPath(); c.moveTo(150, 736); c.quadraticCurveTo(110, 700, 60, 720); c.moveTo(250, 736); c.quadraticCurveTo(300, 704, 350, 724); c.stroke();
  pierce(c, () => { for (let k = 0; k < 7; k++) slit(c, 200 + Math.sin(k) * 4, 690 - k * 34, 18, 5, Math.PI / 2); });
}

/** The deer's body on fine legs, 400 by 352, its rod at (212, 214). */
function laceDeer(c: Ctx): void {
  c.fillStyle = c.strokeStyle = CARD; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(100, 120); c.bezierCurveTo(150, 92, 270, 96, 318, 118); c.bezierCurveTo(352, 134, 346, 186, 308, 190); c.bezierCurveTo(250, 196, 170, 196, 120, 186); c.bezierCurveTo(84, 176, 78, 134, 100, 120); c.fill();
  c.lineWidth = 9; for (const [x0, k, x2] of [[128, -1, 112], [158, 1, 170], [292, -1, 280], [318, 1, 334]]) { c.beginPath(); c.moveTo(x0, 178); c.quadraticCurveTo(x0 + k * 10, 250, x2, 290); c.lineTo(x2 + k * 2, 330); c.stroke(); c.beginPath(); c.moveTo(x2 - 7, 336); c.lineTo(x2 + 9, 336); c.lineTo(x2 + 2, 322); c.closePath(); c.fill(); }
  c.lineWidth = 6; curl(c, 352, 108, 18, 1.2, Math.PI, -1);
  pierce(c, () => { for (let k = 0; k < 11; k++) dot(c, 132 + k * 17, 130 + Math.sin(k * 0.6) * 6, 4); for (let k = 0; k < 6; k++) slit(c, 160 + k * 26, 164, 20, 5, 0.4); c.lineWidth = 3; curl(c, 300, 150, 18, 1.4, 0, 1); });
}

/** The neck, head and branching curled antlers, 240 by 288, pinned at (188, 248). */
function laceHead(c: Ctx): void {
  c.fillStyle = c.strokeStyle = CARD; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(212, 252); c.quadraticCurveTo(168, 160, 116, 104); c.lineTo(92, 128); c.quadraticCurveTo(136, 196, 152, 270); c.closePath(); c.fill(); dot(c, 186, 250, 28);
  c.beginPath(); c.moveTo(120, 92); c.bezierCurveTo(100, 84, 60, 104, 30, 126); c.quadraticCurveTo(52, 138, 92, 130); c.quadraticCurveTo(118, 122, 124, 106); c.fill();
  c.beginPath(); c.moveTo(118, 88); c.quadraticCurveTo(150, 66, 160, 94); c.quadraticCurveTo(138, 98, 118, 88); c.fill();
  for (const [dx, lean] of [[0, 1], [-24, -0.6]]) {
    c.lineWidth = 7; c.beginPath(); c.moveTo(108 + dx, 84); c.bezierCurveTo(108 + dx, 50, 120 + dx + lean * 30, 34, 132 + dx + lean * 44, 14); c.stroke();
    c.lineWidth = 5; for (const u of [0.3, 0.6]) { const x = 110 + dx + lean * 30 * u, y = 82 - 60 * u; curl(c, x - 14, y - 12, 12, 1.1, 0, -1); }
    curl(c, 132 + dx + lean * 44 + 8, 16, 10, 1, Math.PI, 1);
  }
  pierce(c, () => { dot(c, 80, 106, 5); c.lineWidth = 2.5; c.beginPath(); c.arc(80, 106, 9, -2.4, 0.6); c.stroke(); for (let k = 0; k < 5; k++) dot(c, 142 + k * 11, 150 + k * 22, 3.4); });
}

/** A bird with three curling tail plumes, 288 by 160, its rod at (150, 88). */
function laceBird(c: Ctx): void {
  c.fillStyle = c.strokeStyle = CARD; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = 6; for (const [y, d] of [[48, -1], [90, 1], [130, 1]]) { c.beginPath(); c.moveTo(106, 86); c.bezierCurveTo(70, y - 20, 50, y + 10, 26, y); c.stroke(); curl(c, 26 + 4, y - d * 12, 12, 1.2, d > 0 ? -Math.PI / 2 : Math.PI / 2, d); }
  c.beginPath(); c.moveTo(96, 92); c.bezierCurveTo(118, 58, 186, 54, 210, 74); c.bezierCurveTo(222, 86, 210, 112, 176, 114); c.bezierCurveTo(140, 116, 108, 108, 96, 92); c.fill(); dot(c, 214, 66, 20);
  c.beginPath(); c.moveTo(230, 58); c.quadraticCurveTo(254, 62, 272, 76); c.quadraticCurveTo(250, 74, 230, 74); c.closePath(); c.fill();
  c.lineWidth = 3; c.beginPath(); c.moveTo(208, 48); c.quadraticCurveTo(214, 26, 230, 22); c.stroke(); curl(c, 236, 26, 7, 1, Math.PI, 1);
  pierce(c, () => { dot(c, 218, 62, 4); for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(124 + k * 14, 92, 6, 0, Math.PI); c.fill(); } });
}

/** The wing, scalloped and slit like feathers, 160 by 160, hinged at (80, 140). */
function laceWing(c: Ctx): void {
  c.fillStyle = CARD;
  c.beginPath(); c.moveTo(64, 142); c.quadraticCurveTo(22, 100, 20, 30);
  for (let k = 0; k < 5; k++) { const x0 = 20 + k * 24; c.quadraticCurveTo(x0 + 12, 12 + (k % 2) * 6, x0 + 24, 30 - k * 0.5); }
  c.quadraticCurveTo(142, 100, 96, 142); c.closePath(); c.fill();
  pierce(c, () => { for (const [x, a] of [[44, 1.3], [62, 1.45], [80, 1.57], [98, 1.69], [116, 1.84]]) slit(c, x, 70, 50, 4, a); dot(c, 80, 124, 4); });
}

/** The title card the second act opens on, as the films of the 1920s did: a border of curls, her name and the year. */
function titleCard(c: Ctx, w: number, h: number): void {
  c.clearRect(0, 0, w, h); c.fillStyle = c.strokeStyle = '#000'; c.lineCap = 'round';
  // the frame: everything outside a rounded window is card, and curls grow in from its corners
  c.beginPath(); c.rect(0, 0, w, h); c.roundRect(70, 50, w - 140, h - 100, 60); c.fill('evenodd');
  c.lineWidth = 7; for (const [x, y, d] of [[110, 92, 1], [w - 110, 92, -1], [110, h - 92, -1], [w - 110, h - 92, 1]]) { curl(c, x, y, 34, 1.3, 0, d); curl(c, x + d * 70, y, 18, 1.1, Math.PI, -d); }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '700 96px "Sofia Sans Variable", "Sofia Sans", Georgia, serif'; c.fillText('Lotte Reiniger', w / 2, h / 2 - 22);
  c.font = '400 58px "Sofia Sans Variable", "Sofia Sans", Georgia, serif'; c.fillText('1926', w / 2, h / 2 + 70);
  c.lineWidth = 4; c.beginPath(); c.moveTo(w / 2 - 230, h / 2 + 22); c.lineTo(w / 2 - 70, h / 2 + 22); c.moveTo(w / 2 + 70, h / 2 + 22); c.lineTo(w / 2 + 230, h / 2 + 22); c.stroke();
  curl(c, w / 2 - 248, h / 2 + 10, 12, 1, 0, -1); curl(c, w / 2 + 248, h / 2 + 10, 12, 1, Math.PI, 1);
}

/**
 * Shadow play: a cloth in a frame, an oil lamp behind it, and flat figures on rods between the two. The cloth works
 * its shadows out from where the flame and the figures are, so they grow, soften and tremble as real ones do.
 */
export function shadowPlay(): Built {
  const root = G.group();
  const SW = 1.7, SH = 1.0, SY = 0.9, HEM = 0.045, CH = SH - 2 * HEM;   // the cloth: wide, high, the height of its middle, and the lit part between its hems
  const L = 0.62, FY = 1.0, DECK = 0.3, FLAME = 0.036;                 // the flame: how far behind the cloth, how high, and how wide it is. The top of the box the rods come out of
  const teak = M.wood(0x6d4a2b, 1), rail = M.wood(0x6d4a2b, 0), sill = M.wood(0x6d4a2b, 2), horn = M.plastic(0x2a2018, 0.45), bronze = M.brass();

  // the frame: two posts on feet, two rails, and the arm the lamp hangs from, strapped to the top rail
  for (const sx of [-1, 1]) root.add(G.box(0.055, 1.47, 0.055, teak, [sx * (SW / 2 + 0.045), 0.735, 0]), G.box(0.075, 0.05, 0.88, sill, [sx * (SW / 2 + 0.045), 0.025, -0.14]));
  root.add(G.box(SW + 0.2, 0.05, 0.055, rail, [0, SY + SH / 2 + 0.025, 0]), G.box(SW + 0.04, 0.045, 0.05, rail, [0, SY - SH / 2 - 0.0225, 0]));
  root.add(G.box(0.05, 0.05, 0.74, sill, [0, SY + SH / 2 + 0.075, -0.33]), G.box(0.066, 0.058, 0.03, M.dark(), [0, SY + SH / 2 + 0.05, 0.0], 0.004));
  // each joint of the frame is held by a peg, so that it can be knocked apart and carried
  root.add(screws([-1, 1].flatMap((sx) => [SY + SH / 2 + 0.025, SY - SH / 2 - 0.0225].map((y): [number, number, number] => [sx * (SW / 2 + 0.045), y, 0.0275])), 0.011, 'z', M.wood(0x3f2a18, 0)));
  // under the play, a box with the works in it. The figures held against the cloth stand in holes in its lid, and the bird's rod runs in a slot
  root.add(G.box(SW - 0.04, DECK - 0.1, 0.52, rail, [0, (DECK + 0.1) / 2, -0.285], 0.008), G.box(SW + 0.09, 0.05, 0.05, rail, [0, 0.075, -0.5]));

  // the figures: one hide for all of them, cut, pierced and painted, and beside it the plain strip that stands for a rod
  const SIDE = 1024, DENS = 900, N = 9, art = screen(SIDE, SIDE);
  art.ctx.clearRect(0, 0, SIDE, SIDE); art.ctx.fillStyle = '#2a2018'; art.ctx.fillRect(917, 896, 22, 64);
  const uAt = Array.from({ length: N }, () => new THREE.Vector4()), uBox = Array.from({ length: N }, () => new THREE.Vector4()), uCell = Array.from({ length: N }, () => new THREE.Vector4());
  const hide = new THREE.MeshStandardMaterial({ map: art.tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, emissive: 0xffa658, emissiveMap: art.tex, emissiveIntensity: 0.4 });
  const made: THREE.Mesh[] = [], boxes: number[][] = [];
  const keep = (mesh: THREE.Mesh, box: number[], cell: number[]) => { const i = made.push(mesh) - 1; boxes.push(box); uCell[i].set(cell[0] / SIDE, 1 - (cell[1] + cell[3]) / SIDE, cell[2] / SIDE, cell[3] / SIDE); root.add(mesh); return i; };
  /** A flat figure or one jointed part of one: its corner of the hide, where in that corner it is held, and what is drawn there. */
  const figure = (x: number, y: number, w: number, h: number, px: number, py: number, draw: (c: Ctx) => void) => {
    art.ctx.save(); art.ctx.translate(x, y); draw(art.ctx); art.ctx.restore();
    const mw = w / DENS, mh = h / DENS, geo = new THREE.PlaneGeometry(mw, mh).translate((0.5 - px / w) * mw, (py / h - 0.5) * mh, 0), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * w) / SIDE, 1 - (y + (1 - uv.getY(i)) * h) / SIDE);
    return keep(new THREE.Mesh(geo, hide), [-px / DENS, -(h - py) / DENS, mw, mh], [x, y, w, h]);
  };
  /** A rod that hangs from where it is fixed. Its shadow is worked out over three times its width, which is how a thin rod fades as it leaves the cloth. */
  const stick = (len: number) => keep(new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, len, 6).translate(0, -len / 2, 0), horn), [-0.012, -len, 0.024, len], [896, 896, 64, 64]);
  const TREE = figure(0, 0, 400, 736, 200, 736, drawTree), DEER = figure(400, 0, 400, 352, 212, 214, drawDeer), HEAD = figure(400, 352, 240, 288, 188, 248, drawHead);
  const BIRD = figure(640, 352, 288, 160, 150, 88, drawBird), WING = figure(640, 512, 160, 160, 80, 140, drawWing);
  const DEER_ROD = stick(0.42), HEAD_ROD = stick(0.62), BIRD_ROD = stick(0.96), WING_ROD = stick(0.96);
  art.tex.needsUpdate = true;
  // the second act's card figures, each in the same corner of a second sheet, so that they take the first act's joints
  const card = screen(SIDE, SIDE), cut = card.ctx;
  cut.clearRect(0, 0, SIDE, SIDE); cut.fillStyle = '#2a2018'; cut.fillRect(917, 896, 22, 64);
  for (const [x, y, draw] of [[0, 0, laceTree], [400, 0, laceDeer], [400, 352, laceHead], [640, 352, laceBird], [640, 512, laceWing]] as [number, number, (c: Ctx) => void][]) { cut.save(); cut.translate(x, y); draw(cut); cut.restore(); }
  card.tex.needsUpdate = true;
  const title = screen(1024, 560); titleCard(title.ctx, 1024, 560); title.tex.needsUpdate = true;
  let drawn = false;
  /** Put a part where it belongs, on the stand and in the reckoning of the shadows: where it is held, how it is turned, how far it is from the cloth, and whether it is seen from its other side. */
  const put = (i: number, x: number, y: number, angle: number, gap: number, turn = 1) => {
    const m = made[i], b = boxes[i], f = Math.sign(turn || 1) * Math.max(0.05, Math.abs(turn));
    m.position.set(x, y, -gap); m.rotation.z = angle; m.scale.x = f;
    uAt[i].set(x, y - SY, angle, gap); uBox[i].set(b[0] * f, b[1], b[2] * f, b[3]);
  };
  // the tree and the body of the deer are set down once and stay. So does the rod up the back of the tree, which keeps the hide flat
  put(TREE, -0.52, DECK, 0, 0.03); put(DEER, 0.3, 0.632, 0, 0.05); put(DEER_ROD, 0.3, 0.632, 0, 0.055);
  root.add(G.rod([-0.52, DECK - 0.06, -0.035], [-0.52, 0.8, -0.035], 0.005, horn, 6));
  const slot = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 64), M.black()); slot.rotation.x = Math.PI / 2; slot.scale.set(0.52, 0.15, 0.4); slot.position.set(0.02, DECK - 0.002, -0.22);
  root.add(slot);

  // the cloth: unbleached cotton between two red hems. What the lamp throws on it is added to what the room does
  const GLOW = new THREE.Color(1, 0.6, 0.27), u = { tHide: { value: art.tex }, uAt: { value: uAt }, uBox: { value: uBox }, uCell: { value: uCell }, uLamp: { value: new THREE.Vector3(0, FY - SY, L) }, uGlow: { value: GLOW.clone() }, uFlame: { value: FLAME }, tCard: { value: title.tex }, uCard: { value: 0 }, uIris: { value: 2 }, uSize: { value: new THREE.Vector2(SW, CH) } };
  const cotton = new THREE.MeshStandardMaterial({ color: 0xc9bea8, roughness: 1, side: THREE.DoubleSide });
  cotton.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vAt;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAt = position.xy;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', /* glsl */ `#include <common>
      uniform sampler2D tHide, tCard; uniform vec4 uAt[${N}], uBox[${N}], uCell[${N}]; uniform vec3 uLamp, uGlow; uniform float uFlame, uCard, uIris; uniform vec2 uSize; varying vec2 vAt;`)
      .replace('#include <emissivemap_fragment>', /* glsl */ `#include <emissivemap_fragment>
      {
        // how much of the cloth one dot of the screen covers: no shadow is drawn finer than that
        float grain = max(length(dFdx(vAt)), length(dFdy(vAt))), lit = 1.0;
        for (int i = 0; i < ${N}; i++) {
          // the straight line from the flame to this point of the cloth, and where it crosses the plane the part is held in
          float gap = uAt[i].w, ca = cos(uAt[i].z), sa = sin(uAt[i].z);
          vec2 p = uLamp.xy + (vAt - uLamp.xy) * (uLamp.z - gap) / uLamp.z - uAt[i].xy;
          vec2 q = (vec2(ca * p.x + sa * p.y, ca * p.y - sa * p.x) - uBox[i].xy) / uBox[i].zw;
          if (q.x > 0.0 && q.x < 1.0 && q.y > 0.0 && q.y < 1.0) {
            // a flame is not a point: the further a part is from the cloth, the wider the band where only some of the flame is hidden
            float dots = uCell[i].z * ${SIDE}.0 / abs(uBox[i].z);
            float lod = log2(max(1.0, max(uFlame * gap / uLamp.z, grain * (uLamp.z - gap) / uLamp.z) * dots));
            lit *= 1.0 - textureLod(tHide, uCell[i].xy + q * uCell[i].zw, lod).a;
          }
        }
        // the title card between the acts, and the iris that opens and closes on each, as in a film of the 1920s
        lit = mix(lit, 1.0 - texture2D(tCard, vAt / uSize + 0.5).a, uCard);
        lit *= smoothstep(uIris, uIris - 0.04, length(vAt) / (0.5 * uSize.x));
        // the light falls off with the distance from the flame and with the slant it arrives at. Where the flame itself is behind the weave, it shows
        vec2 from = vAt - uLamp.xy; float far = dot(from, from) + uLamp.z * uLamp.z;
        totalEmissiveRadiance += uGlow * lit * (pow(uLamp.z * uLamp.z / far, 1.5) + 1.6 * exp(-dot(from, from) / 0.0035));
      }`);
  };
  cotton.customProgramCacheKey = () => 'shadow-play';
  root.add(new THREE.Mesh(new THREE.PlaneGeometry(SW, CH), cotton).translateY(SY));
  for (const sy of [-1, 1]) root.add(G.plane(SW, HEM, M.cloth(0x7a211c), [0, SY + sy * (SH - HEM) / 2, 0]));

  // the lamp: a bronze dish of oil on three chains, with its wick in a spout towards the cloth
  const lamp = G.group(
    G.lathe([[0, -0.085], [0.05, -0.083], [0.085, -0.066], [0.094, -0.045], [0.086, -0.036, 1], [0.078, -0.044], [0, -0.05]], bronze, 40, true).translateZ(-0.075),
    G.cyl(0.03, 0.012, bronze, [0, -0.09, -0.075], 20), G.cyl(0.0045, 0.03, M.black(), [0, -0.034, 0.004], 8),
    G.torus(0.013, 0.003, M.dark(), [0, 0.428, -0.075]), G.rod([0, 0.438, -0.075], [0, 0.452, -0.075], 0.003, M.dark(), 6),
  );
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + Math.PI / 2; lamp.add(G.rod([Math.cos(a) * 0.088, -0.04, -0.075 + Math.sin(a) * 0.088], [0, 0.416, -0.075], 0.0022, M.dark(), 5)); }
  const fire = G.group(G.lathe([[0, -0.028], [0.011, -0.02], [0.016, -0.004], [0.012, 0.022], [0.005, 0.046], [0, 0.062]], M.glow(0xff9a3c, 2.2), 16, true), G.lathe([[0, -0.024], [0.006, -0.016], [0.008, -0.002], [0.004, 0.018], [0, 0.03]], M.glow(0xfff2c8, 3), 12, true));
  const aura = halo(0xffb060, 0.5, [0, 0, 0], 0.5);
  lamp.add(fire, aura);
  lamp.position.set(0, FY, -L);
  root.add(lamp);

  // Sixty-four seconds: the first act, the iris closes, her title card, and a second act in black card, its light
  // tinted blue as the night scenes of tinted prints were. Then the iris closes and the first act comes back.
  const ACT2 = new THREE.Color(0.42, 0.72, 1), iris = (t: number) => Math.min(1, Math.abs(t)) * 1.2;
  const act = (t: number) => {
    const at = t % 64, second = at >= 32 && at < 63;
    if (second !== drawn) {
      drawn = second;
      const sheet = second ? card.tex : art.tex;
      u.tHide.value = sheet; hide.map = sheet; hide.emissiveMap = sheet; hide.emissive.setHex(second ? 0x000000 : 0xffa658); hide.needsUpdate = true;
    }
    // the iris: shut at 31, 33, 38 and 63, wide open in between
    const shut = [30.5, 32, 37.5, 63].reduce((m, c) => Math.min(m, Math.abs(at - c - 0.5) / 0.5), 9);
    u.uIris.value = iris(shut);
    u.uCard.value = at >= 32 && at < 38 ? 1 : 0;
    return second;
  };

  /** One moment of the play, and of the flame that lights it. */
  const play = (t: number, lights: number) => {
    const second = act(t);
    // the flame leans, stretches and gutters. The light on the cloth goes with it, and so does every shadow, the far ones most
    const a = Math.sin(t * 13.1) * 0.5 + Math.sin(t * 7.3 + 1.3) * 0.3 + Math.sin(t * 23.7 + 0.7) * 0.2, b = Math.sin(t * 9.7 + 2.1) * 0.6 + Math.sin(t * 17.3) * 0.4;
    fire.scale.set(1 + 0.08 * b, 1 + 0.16 * a, 1 + 0.08 * b); fire.rotation.z = 0.14 * b;
    u.uLamp.value.set(0.005 * b, FY - SY + 0.004 * a, L); u.uGlow.value.copy(second ? ACT2 : GLOW).multiplyScalar(1 + 0.07 * a);
    aura.material.opacity = 0.42 + 0.05 * a; hide.emissiveIntensity = (0.62 - 0.4 * lights) * (1 + 0.07 * a);
    // twenty seconds: the bird passes close to the cloth from left to right, turns, and comes back out by the lamp
    const w = ((t / 20 + 0.55) % 1) * Math.PI * 2, x = 0.02 - 0.52 * Math.cos(w), y = 1.05 + 0.03 * Math.sin(2 * w), gap = 0.22 - 0.145 * Math.sin(w);
    const turn = Math.max(-1, Math.min(1, Math.sin(w) * 9)), beat = 0.55 * Math.sin(t * 7.5) * turn, wx = x - 0.011 * turn, wy = y + 0.02;
    const tx = wx - 0.089 * Math.sin(beat), ty = wy + 0.089 * Math.cos(beat);
    put(BIRD, x, y, 0.06 * Math.sin(t * 3.1), gap, turn); put(BIRD_ROD, x, y, 0, gap + 0.005);
    put(WING, wx, wy, beat, gap - 0.003, turn); put(WING_ROD, tx, ty, Math.atan2(x + 0.02 * turn - tx, ty - DECK), gap + 0.007);
    // the deer grazes, and lifts its head while the great shadow of the bird goes over
    const part = w / (Math.PI * 2), up = ease((part - 0.5) / 0.07) - ease((part - 0.93) / 0.07), nod = 1.75 * (1 - up) + 0.05 * Math.sin(t * 1.7);
    const hx = 0.3 - 0.116, hy = 0.632 + 0.122, jx = hx - 0.131 * Math.cos(nod) - 0.133 * Math.sin(nod), jy = hy - 0.131 * Math.sin(nod) + 0.133 * Math.cos(nod);
    put(HEAD, hx, hy, nod, 0.046); put(HEAD_ROD, jx, jy, Math.atan2(0.04 - jx, jy - DECK), 0.058);
  };
  // everything stands in its place before the stand measures the piece
  play(2.6, 1);

  return {
    root, inDark: 'better', glow: 0xffb469, view: [-26, 9],
    views: { audience: { at: [0, 0.3, 3.3], to: [0, SY, 0], room: true, fov: 34, play: 0.2 }, behind: { at: [0.72, 1.12, -1.3], to: [0.02, 0.84, -0.1], fov: 46, play: 0.4 } },
    update: ({ t, lights }) => play(t, lights),
  };
}
