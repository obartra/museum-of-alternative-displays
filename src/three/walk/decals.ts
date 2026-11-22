import { people } from '../../data/people';
import { portraits } from '../../data/portraits';
import { THREE } from '../kit';
import { FLOOR, HALF, PITCH, places } from './plan';

/** One portrait on the wall: whose piece it belongs to, and the rectangle it fills, in metres along and up the wall. */
export interface Hung { piece: string; x: number; y: number; w: number; h: number }

export interface DecalOptions {
  /** A phone: the sheet of portraits is drawn at half the size. */
  lite: boolean;
  /** The name of each piece, in the language in use. */
  names: Record<string, string>;
  /** The face for running text, as the page names it. */
  text: string;
}

/**
 * The portraits, put straight on the blind wall as ink on plaster. Each person with a portrait hangs by the
 * piece they worked on, in the stretch of wall between its block and the next: far enough along it that the
 * model on the block does not stand in front of them for someone looking at the piece. The people of a piece by
 * that wall hang to one side of its block and the people of the piece across the aisle to the other. They read
 * from left to right in the order the piece credits them. Under each is the name, and under that the piece.
 *
 * Only the ink of each drawing is put on the wall: the sheet below holds how much ink there is at every point,
 * and the wall shows through where there is none. The ink is lit as the wall is, so it darkens with it at night.
 * Nothing hangs for a person without a portrait, nor a portrait that may only be shown at the size of a label.
 */
export function buildDecals(o: DecalOptions): { mesh?: THREE.Mesh; hung: Hung[] } {
  // a portrait is four wide to five tall, and its two lines of text take a third of its width more. Up to four hang
  // in the two metres of wall that a piece has, so three are a little smaller than one or two, and four smaller
  // again. Four with a stretch of wall to themselves spread over all of it that their own model leaves in view.
  // All stand on one line.
  const GAP = 0.1, FOOT = FLOOR + 1.32, TALL = 1.25 + 0.33, COLS = 8, CLEAR = 1.85;
  const list: { name: string; piece: string; x: number; w: number }[] = [];
  // the groups, by the stretch of wall each hangs in: a stretch is known by its middle, half way from one block to the next
  const groups = new Map<number, { piece: string; who: string[]; side: number }[]>();
  for (const p of places) {
    const who = [...new Set((people[p.id]?.people ?? []).flatMap((e) => e.who))].filter((n) => portraits[n] && !portraits[n].small).slice(0, 4);
    if (!who.length) continue;
    const mid = Math.round((p.x + (p.side > 0 ? -PITCH / 2 : PITCH / 2)) * 100) / 100;
    groups.set(mid, [...(groups.get(mid) ?? []), { piece: p.id, who, side: p.side }]);
  }
  for (const [mid, here] of groups) for (const g of here) {
    const n = g.who.length, room = here.length === 1 && n > 3 ? PITCH - CLEAR - GAP : 2.1;
    const w = Math.min(0.72, (room - (n - 1) * GAP) / n), span = n * w + (n - 1) * GAP;
    // which way its stretch lies from the piece's own block, and where along the hall that block stands
    const dir = g.side > 0 ? -1 : 1, own = mid - (dir * PITCH) / 2;
    // a group starts where the widest model no longer stands in front of it for someone looking at its piece. Two in
    // one stretch change sides at its middle, so that each is in plain view from its own piece
    const from = here.length === 1 ? CLEAR : PITCH / 2 + GAP / 2, top = dir > 0 ? own + from + span : own - from;
    // facing this wall, the hall runs from right to left: the first name hangs furthest along it, and so on the left
    g.who.forEach((name, i) => list.push({ name, piece: g.piece, w, x: top - w / 2 - i * (w + GAP) }));
  }
  if (!list.length) return { hung: [] };
  // one sheet for all of them: each cell is a portrait with two lines of text under it
  const CW = o.lite ? 128 : 256, PH = CW * 1.25, CH = Math.round(CW * TALL), ROWS = Math.ceil(list.length / COLS);
  const canvas = document.createElement('canvas'); canvas.width = COLS * CW; canvas.height = ROWS * CH;
  const c = canvas.getContext('2d', { willReadFrequently: true })!;
  c.fillStyle = '#000'; c.fillRect(0, 0, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 8;
  const fit = (text: string, font: (px: number) => string, px: number, least: number) => { do { c.font = font(px); px -= 1; } while (px > least && c.measureText(text).width > CW - 8); };
  const pos: number[] = [], uv: number[] = [], idx: number[] = [], hung: Hung[] = [];
  list.forEach((d, i) => {
    const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH, k = CW / 256;
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    fit(d.name, (px) => `700 ${px}px ${o.text}`, 31 * k, 13 * k); c.fillText(d.name, cx + CW / 2, cy + PH + 28 * k);
    c.fillStyle = '#b4b4b4';
    fit(o.names[d.piece] ?? d.piece, (px) => `500 ${px}px ${o.text}`, 22 * k, 11 * k); c.fillText(o.names[d.piece] ?? d.piece, cx + CW / 2, cy + PH + 60 * k);
    const img = new Image();
    img.onload = () => {
      c.drawImage(img, cx, cy, CW, PH);
      // the drawing's paper counts as no ink at all and its darkest line as full ink
      const px = c.getImageData(cx, cy, CW, PH), q = px.data;
      for (let j = 0; j < q.length; j += 4) { const v = 255 - Math.max(0, Math.min(255, ((q[j] - 16) * 255) / 216)); q[j] = q[j + 1] = q[j + 2] = v; }
      c.putImageData(px, cx, cy);
      tex.needsUpdate = true;
    };
    img.src = `./people/${portraits[d.name].file}`;
    // the wall faces the hall, so left and right are turned about for whoever stands in front of it
    const x0 = d.x + d.w / 2, x1 = d.x - d.w / 2, y0 = FOOT, y1 = FOOT + d.w * TALL, z = HALF - 0.012, n = pos.length / 3;
    pos.push(x0, y0, z, x1, y0, z, x1, y1, z, x0, y1, z);
    const u0 = cx / canvas.width, u1 = (cx + CW) / canvas.width, v1 = 1 - cy / canvas.height, v0 = 1 - (cy + CH) / canvas.height;
    uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    hung.push({ piece: d.piece, x: d.x - d.w / 2, y: y0, w: d.w, h: d.w * TALL });
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x14171a, alphaMap: tex, transparent: true, roughness: 0.9, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { mesh, hung };
}

/** The portrait that a ray from `o` along `d` lands on, if it reaches the blind wall inside one. */
export function decalAt(hung: Hung[], o: THREE.Vector3, d: THREE.Vector3): Hung | undefined {
  if (d.z <= 1e-4) return undefined;
  const t = (HALF - o.z) / d.z, x = o.x + d.x * t, y = o.y + d.y * t;
  return t > 0 ? hung.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) : undefined;
}
