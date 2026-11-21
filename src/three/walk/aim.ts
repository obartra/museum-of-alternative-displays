import { THREE } from '../kit';
import { TALL, TOP } from '../room';
import * as plan from './plan';

/** Where a ray first meets a box, as a distance along it, or Infinity. */
function hitBox(o: THREE.Vector3, d: THREE.Vector3, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): number {
  let near = 0, far = Infinity;
  for (const [p, v, a, b] of [[o.x, d.x, x0, x1], [o.y, d.y, y0, y1], [o.z, d.z, z0, z1]]) {
    if (Math.abs(v) < 1e-9) { if (p < a || p > b) return Infinity; continue; }
    const t0 = (a - p) / v, t1 = (b - p) / v;
    near = Math.max(near, Math.min(t0, t1)); far = Math.min(far, Math.max(t0, t1));
    if (near > far) return Infinity;
  }
  return near;
}

/** What a ray from the visitor's eye, or from a hand, lands on: a piece, a place on the floor to walk to, or nothing of use. */
export function landing(o: THREE.Vector3, d: THREE.Vector3): { piece?: plan.Place; floor?: [number, number] } {
  const top = plan.FLOOR + TALL;
  let wall = Infinity;
  for (const x of plan.walls) {
    for (const s of [-1, 1]) wall = Math.min(wall, hitBox(o, d, x - plan.WALL / 2, x + plan.WALL / 2, plan.FLOOR, top, s > 0 ? plan.GATE / 2 : -plan.HALF, s > 0 ? plan.HALF : -plan.GATE / 2));
    wall = Math.min(wall, hitBox(o, d, x - plan.WALL / 2, x + plan.WALL / 2, plan.FLOOR + plan.GATE_H, top, -plan.GATE / 2, plan.GATE / 2));
  }
  let best: plan.Place | undefined, t = wall;
  for (const p of plan.places) {
    const h = hitBox(o, d, p.x - plan.BLOCK / 2, p.x + plan.BLOCK / 2, plan.FLOOR, TOP + 1.6, p.z - plan.BLOCK / 2, p.z + plan.BLOCK / 2);
    if (h < t) { t = h; best = p; }
  }
  if (best) return { piece: best };
  if (d.y >= -1e-4) return {};
  const f = (plan.FLOOR - o.y) / d.y, x = o.x + d.x * f, z = o.z + d.z * f;
  if (f > wall || x < 0 || x > plan.LENGTH || Math.abs(z) > plan.HALF) return {};
  return { floor: plan.free(x, z) };
}
