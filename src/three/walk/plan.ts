import { halls } from '../../data/halls';
import { inHall } from '../../data/pieces';

/**
 * The plan of the hall, in metres, with nothing drawn in it: where the walls stand, where each piece
 * stands, where a visitor may walk and how to get from one place to another.
 * The door is at x = 0 and the hall runs towards +x. The windows are at z = -HALF, on the left of
 * someone walking in, and the blind wall is at z = +HALF. The floor is the room's own, at y = FLOOR.
 */

export const FLOOR = -0.95;
/** A standing eye, measured from the floor. */
export const EYE = 1.6;
/** From one block to the next along the hall, and from one window to the next. */
export const PITCH = 4.4;
/** Half the width of the hall, and how far each row of blocks stands from its centre line. */
export const HALF = 6.3, ROW = 3.3;
export const BLOCK = 2.2;
/** A cross wall: how thick, and how wide and high the opening in it. */
export const WALL = 0.36, GATE = 5, GATE_H = 4.2;
/** A window: three panes between two piers. A pier stands behind every block and takes every cross wall. */
export const WINDOW = 3, PANES = 3;
/** How much room a visitor takes up. */
export const BODY = 0.42;

export interface Place {
  id: string;
  hall: number;
  /** Position in the whole collection, from 0. */
  no: number;
  x: number;
  z: number;
  /** -1 stands by the windows and faces north. +1 stands by the blind wall and faces south. Both face the aisle. */
  side: -1 | 1;
}
export interface Bay { hall: number; from: number; to: number }

/** One bay for each hall of the collection. Pieces go down it in pairs, left then right, as a visitor would look. */
export const bays: Bay[] = [];
export const places: Place[] = [];
{
  let x = 0, no = 0;
  for (const h of halls) {
    const list = inHall(h.id), cols = Math.ceil(list.length / 2);
    // the first bay has the door in it, and a column's worth of floor to arrive on
    const lead = bays.length ? 1 : 2, from = x, to = x + (cols + lead) * PITCH;
    list.forEach((p, i) => {
      const side = i % 2 ? 1 : -1;
      places.push({ id: p.id, hall: h.id, no: no++, x: from + (Math.floor(i / 2) + lead) * PITCH, z: side * ROW, side });
    });
    bays.push({ hall: h.id, from, to });
    x = to;
  }
}
export const LENGTH = bays[bays.length - 1].to;
/** Where the cross walls stand: between one bay and the next. */
export const walls: number[] = bays.slice(1).map((b) => b.from);
/** The windows of the long south wall: one between every two columns, the whole length of the hall. */
export const windows: { from: number; to: number; panes: number }[] = [];
for (let x = PITCH / 2; x < LENGTH; x += PITCH) windows.push({ from: x - WINDOW / 2, to: x + WINDOW / 2, panes: PANES });

export const placeOf = (id: string): Place | undefined => places.find((p) => p.id === id);
export const bayAt = (x: number): Bay => bays.find((b) => x < b.to) ?? bays[bays.length - 1];
export const bayOf = (hall: number): Bay => bays[hall - 1];

/** Where someone stands who has just come in at the door, and which way they face: down the hall. */
export const DOOR = { x: 1.7, z: 0, yaw: -Math.PI / 2 };
/** Where a visitor arrives in a bay: a little way in from its opening, on the centre line, looking down it. */
export const arrival = (hall: number): { x: number; z: number; yaw: number } =>
  hall === 1 ? DOOR : { x: bayOf(hall).from + 1.5, z: 0, yaw: -Math.PI / 2 };
/** The place to stand to look at a piece, `back` metres from the middle of its block, on the aisle side. */
export const standing = (p: Place, back: number): { x: number; z: number; yaw: number } =>
  ({ x: p.x, z: p.z - p.side * back, yaw: p.side < 0 ? 0 : Math.PI });

/** Whether a body of radius `r` standing here would be in a wall or a block. */
export function blocked(x: number, z: number, r = BODY): boolean {
  if (x < r || x > LENGTH - r || Math.abs(z) > HALF - r) return true;
  for (const w of walls) if (Math.abs(x - w) < WALL / 2 + r && Math.abs(z) > GATE / 2 - r) return true;
  const reach = BLOCK / 2 + r;
  for (const p of places) if (Math.abs(x - p.x) < reach && Math.abs(z - p.z) < reach) return true;
  return false;
}

/** One step of walking. What cannot be walked through is slid along. */
export function step(x: number, z: number, dx: number, dz: number): [number, number] {
  // short moves, so that a fast walker cannot jump a wall
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
  for (let i = 0; i < n; i++) {
    const sx = dx / n, sz = dz / n;
    if (!blocked(x + sx, z + sz)) { x += sx; z += sz; }
    else if (!blocked(x + sx, z)) x += sx;
    else if (!blocked(x, z + sz)) z += sz;
  }
  return [x, z];
}

// ---------- finding a way ----------

const CELL = 0.5, NX = Math.ceil(LENGTH / CELL), NZ = Math.ceil((2 * HALF) / CELL);
/** How far a glide keeps from walls and blocks: a little more than a walker has to. */
const CLEAR = BODY + 0.02;
let shut: Uint8Array | undefined;
/** The floor as squares of half a metre, each open or shut. Worked out once. */
function grid(): Uint8Array {
  if (shut) return shut;
  shut = new Uint8Array(NX * NZ);
  // a square is open when its middle is well clear, so that a straight line from one open square to the next is clear too
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) shut[j * NX + i] = blocked((i + 0.5) * CELL, (j + 0.5) * CELL - HALF, CLEAR + CELL / 2 + 0.01) ? 1 : 0;
  return shut;
}
const cellOf = (x: number, z: number): [number, number] => [Math.min(NX - 1, Math.max(0, Math.floor(x / CELL))), Math.min(NZ - 1, Math.max(0, Math.floor((z + HALF) / CELL)))];

/** Whether the straight line between two points crosses nothing. */
export function clear(ax: number, az: number, bx: number, bz: number): boolean {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.2));
  for (let i = 0; i <= n; i++) if (blocked(ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n, CLEAR)) return false;
  return true;
}

/** The nearest open square to a point, for a start or an end that is itself in a wall. */
function open(x: number, z: number): [number, number] {
  const g = grid(), [ci, cj] = cellOf(x, z);
  for (let r = 0; r < 12; r++) for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
    if (i < 0 || j < 0 || i >= NX || j >= NZ || Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r) continue;
    if (!g[j * NX + i]) return [i, j];
  }
  return [ci, cj];
}

/** The nearest place to a point where a visitor can stand. */
export function free(x: number, z: number): [number, number] {
  if (!blocked(x, z, CLEAR)) return [x, z];
  const [i, j] = open(x, z);
  return [(i + 0.5) * CELL, (j + 0.5) * CELL - HALF];
}

/**
 * A way from one point to another that goes round the blocks and through the openings: the corners of it,
 * start and end included. A* over the squares, then every corner that can be cut is cut.
 */
export function route(ax: number, az: number, bx: number, bz: number): [number, number][] {
  if (clear(ax, az, bx, bz)) return [[ax, az], [bx, bz]];
  const g = grid(), [si, sj] = open(ax, az), [ti, tj] = open(bx, bz);
  const start = sj * NX + si, goal = tj * NX + ti;
  const cost = new Float32Array(NX * NZ).fill(Infinity), from = new Int32Array(NX * NZ).fill(-1);
  // a small heap of squares to look at next, cheapest first
  const heap: number[] = [], rank = new Float32Array(NX * NZ);
  const push = (n: number) => { let i = heap.push(n) - 1; while (i > 0) { const p = (i - 1) >> 1; if (rank[heap[p]] <= rank[n]) break; heap[i] = heap[p]; i = p; } heap[i] = n; };
  const pop = (): number => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) { let i = 0; for (;;) { let c = 2 * i + 1; if (c >= heap.length) break; if (c + 1 < heap.length && rank[heap[c + 1]] < rank[heap[c]]) c++; if (rank[heap[c]] >= rank[last]) break; heap[i] = heap[c]; i = c; } heap[i] = last; }
    return top;
  };
  const guess = (n: number) => { const dx = Math.abs((n % NX) - ti), dz = Math.abs(Math.floor(n / NX) - tj); return Math.max(dx, dz) + 0.4142 * Math.min(dx, dz); };
  cost[start] = 0; rank[start] = guess(start); push(start);
  while (heap.length) {
    const n = pop();
    if (n === goal) break;
    const i = n % NX, j = Math.floor(n / NX);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= NX || b >= NZ || g[b * NX + a]) continue;
      // no squeezing between two corners
      if (di && dj && (g[j * NX + a] || g[b * NX + i])) continue;
      const m = b * NX + a, c = cost[n] + (di && dj ? 1.4142 : 1);
      if (c < cost[m]) { cost[m] = c; from[m] = n; rank[m] = c + guess(m); push(m); }
    }
  }
  if (from[goal] < 0 && goal !== start) return [[ax, az], [bx, bz]];
  const cells: [number, number][] = [[bx, bz]];
  for (let n = goal; n >= 0; n = from[n]) cells.push([((n % NX) + 0.5) * CELL, (Math.floor(n / NX) + 0.5) * CELL - HALF]);
  cells.push([ax, az]);
  cells.reverse();
  // pull the string tight: from each corner, go straight to the furthest one in sight
  const out: [number, number][] = [cells[0]];
  const sees = (i: number, j: number) => clear(cells[i][0], cells[i][1], cells[j][0], cells[j][1]);
  for (let i = 0; i < cells.length - 1;) {
    let near = i + 1, far = cells.length - 1;
    if (sees(i, far)) near = far;
    else while (far - near > 1) { const mid = (near + far) >> 1; if (sees(i, mid)) near = mid; else far = mid; }
    out.push(cells[near]);
    i = near;
  }
  return out;
}
