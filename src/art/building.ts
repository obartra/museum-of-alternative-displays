/** Concept drawings of the imagined works: a west elevation and an axonometric. Line art in the page's ink. */

const HALL_INK: Record<number, string> = { 1: '#fff', 2: '#fff', 3: '#fff', 4: '#14171a', 5: '#14171a', 6: '#fff', 7: '#fff' };

export function elevationSvg(): string {
  const o: string[] = [];
  const g = 250; // ground line
  // tower with water tank, behind the shed
  o.push(`<rect x="404" y="70" width="36" height="${g - 70}" fill="var(--plate)" stroke="var(--ink)" stroke-width="2"/>`);
  o.push(`<rect x="394" y="38" width="56" height="34" fill="var(--h7)" stroke="var(--ink)" stroke-width="2"/>`);
  for (let y = 92; y < 160; y += 22) o.push(`<rect x="416" y="${y}" width="12" height="12" fill="none" stroke="var(--ink)" stroke-width="1.2"/>`);
  // darkroom block
  o.push(`<rect x="150" y="92" width="118" height="70" fill="var(--ink)" stroke="var(--ink)" stroke-width="2"/>`);
  o.push(`<rect x="160" y="100" width="20" height="24" rx="2" fill="var(--h6)"/><text x="170" y="119" text-anchor="middle" style="font:900 20px/1 var(--display)" fill="#fff">6</text>`);
  // chimney
  o.push(`<path d="M322 ${g} L327 14 H339 L344 ${g} Z" fill="var(--plate)" stroke="var(--ink)" stroke-width="2"/>`);
  for (const y of [22, 30, 96, 104]) o.push(`<path d="M${327 - (y - 14) * 0.021} ${y} H${339 + (y - 14) * 0.021}" stroke="var(--signal)" stroke-width="3"/>`);
  // shed: five north-light bays
  for (let i = 0; i < 5; i++) {
    const x = 60 + i * 96;
    const no = 5 - i;
    o.push(`<path d="M${x} ${g} V160 L${x + 96} 122 V${g} Z" fill="var(--wash-2)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/>`);
    for (let w = 0; w < 3; w++) o.push(`<rect x="${x + 12 + w * 26}" y="186" width="18" height="30" fill="var(--plate)" stroke="var(--ink)" stroke-width="1.2"/><path d="M${x + 21 + w * 26} 186 v30 M${x + 12 + w * 26} 201 h18" stroke="var(--ink)" stroke-width=".8"/>`);
    o.push(`<rect x="${x + 68}" y="168" width="20" height="24" rx="2" fill="var(--h${no})" stroke="var(--ink)" stroke-width="1"/><text x="${x + 78}" y="187" text-anchor="middle" style="font:900 20px/1 var(--display)" fill="${HALL_INK[no]}">${no}</text>`);
  }
  // dado line along the shed
  o.push(`<path d="M60 228 H540" stroke="var(--ink)" stroke-width="1"/>`);
  // gatehouse with its flap board
  o.push(`<rect x="584" y="206" width="78" height="44" fill="var(--plate)" stroke="var(--ink)" stroke-width="2"/><path d="M574 206 H672" stroke="var(--ink)" stroke-width="4"/>`);
  o.push(`<rect x="592" y="214" width="40" height="13" fill="var(--ink)"/><rect x="640" y="216" width="14" height="34" fill="var(--wash-2)" stroke="var(--ink)" stroke-width="1.2"/>`);
  o.push(`<text x="623" y="200" text-anchor="middle" style="font:700 10px/1 var(--text)" fill="var(--ink-2)">Vrátnice</text>`);
  // ground
  o.push(`<path d="M20 ${g} H700" stroke="var(--ink)" stroke-width="3"/>`);
  for (let x = 24; x < 700; x += 14) o.push(`<path d="M${x} ${g + 2} l-7 9" stroke="var(--ink-2)" stroke-width=".8"/>`);
  // sign
  o.push(`<text x="60" y="${g + 34}" style="font:800 22px/1 var(--display);letter-spacing:.04em" fill="var(--ink)">MUZEUM ALTERNATIVNÍCH DISPLEJŮ</text>`);
  o.push(`<text x="60" y="${g + 50}" style="font:500 11px/1 var(--text)" fill="var(--ink-2)">West elevation. Former picture-tube works, five north-light bays, darkroom block, water tower and stack.</text>`);
  return `<svg viewBox="0 0 720 310" role="img" aria-label="Elevation drawing of the imagined museum building: a sawtooth-roofed factory shed with a tower and a chimney." xmlns="http://www.w3.org/2000/svg">${o.join('')}</svg>`;
}

type P3 = [number, number, number];
const iso = ([x, y, z]: P3): [number, number] => [(x - y) * 0.866, -(x + y) * 0.5 - z];

export function axoSvg(): string {
  interface Face { pts: P3[]; fill: string; depth: number; extra?: string }
  const faces: Face[] = [];
  const poly = (pts: P3[], fill: string, bias = 0) => {
    const d = pts.reduce((s, p) => s + p[0] + p[1], 0) / pts.length - pts.reduce((s, p) => s + p[2], 0) / pts.length * 0.01 + bias;
    faces.push({ pts, fill, depth: d });
  };
  const box = (x0: number, y0: number, x1: number, y1: number, z1: number, top = 'var(--plate)', south = 'var(--wash-2)', west = 'var(--line)') => {
    poly([[x0, y0, 0], [x1, y0, 0], [x1, y0, z1], [x0, y0, z1]], south, -0.5);
    poly([[x0, y0, 0], [x0, y1, 0], [x0, y1, z1], [x0, y0, z1]], west, -0.5);
    poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], top, -1);
  };
  // shed bays, hall 1 at the south end
  for (let i = 0; i < 5; i++) {
    const y0 = i * 20, y1 = y0 + 20;
    poly([[0, y0, 0], [52, y0, 0], [52, y0, 9], [0, y0, 9]], 'var(--wash-2)', -0.5);
    poly([[0, y0, 0], [0, y1, 0], [0, y1, 15], [0, y0, 9]], 'var(--line)', -0.5);
    poly([[0, y0, 9], [52, y0, 9], [52, y1, 15], [0, y1, 15]], `var(--h${i + 1})`, -1);
  }
  box(60, 66, 84, 98, 18, 'var(--h6)', 'var(--ink)', 'var(--ink)'); // darkroom
  box(62, 42, 74, 54, 30); // tower shaft
  box(59, 39, 77, 57, 0.01);
  faces.push({ pts: [[59, 39, 30], [77, 39, 30], [77, 39, 38], [59, 39, 38]], fill: 'var(--h7)', depth: 59 + 39 + 9 - 0.6 });
  faces.push({ pts: [[59, 39, 30], [59, 57, 30], [59, 57, 38], [59, 39, 38]], fill: 'var(--h7)', depth: 59 + 48 - 0.6 });
  faces.push({ pts: [[59, 39, 38], [77, 39, 38], [77, 57, 38], [59, 57, 38]], fill: 'var(--plate)', depth: 59 + 39 - 1 });
  box(60, 2, 84, 24, 5, 'var(--wash-2)'); // depot
  box(18, -22, 34, -10, 5); // gatehouse
  // chimney as a tapered prism
  const cx = 71, cy = 31;
  poly([[cx - 3, cy - 3, 0], [cx + 3, cy - 3, 0], [cx + 2, cy - 2, 46], [cx - 2, cy - 2, 46]], 'var(--plate)', -0.5);
  poly([[cx - 3, cy - 3, 0], [cx - 3, cy + 3, 0], [cx - 2, cy + 2, 46], [cx - 2, cy - 2, 46]], 'var(--line)', -0.5);

  faces.sort((a, b) => b.depth - a.depth);
  const s = 3.1, ox = 318, oy = 372;
  const d = (pts: P3[]) => pts.map((p) => { const [x, y] = iso(p); return `${(ox + x * s).toFixed(1)},${(oy + y * s).toFixed(1)}`; }).join(' ');
  const body = faces.map((f) => `<polygon points="${d(f.pts)}" fill="${f.fill}" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/>`).join('');
  // hall numbers on the roofs
  let labels = '';
  for (let i = 0; i < 5; i++) {
    const [x, y] = iso([26, i * 20 + 10, 12]);
    labels += `<text x="${(ox + x * s).toFixed(1)}" y="${(oy + y * s + 9).toFixed(1)}" text-anchor="middle" style="font:900 26px/1 var(--display)" fill="${HALL_INK[i + 1]}">${i + 1}</text>`;
  }
  const lab = (p: P3, t: string, dx = 0, dy = 0) => { const [x, y] = iso(p); return `<text x="${(ox + x * s + dx).toFixed(1)}" y="${(oy + y * s + dy).toFixed(1)}" style="font:700 12px/1 var(--text)" fill="var(--ink)">${t}</text>`; };
  labels += lab([84, 82, 18], '6 Temná komora', 8, 4) + lab([77, 48, 38], '7 Věž', 10, 0) + lab([84, 13, 5], 'Depozitář', 8, 6) + lab([34, -22, 0], 'Vrátnice', 14, 16);
  const ground = `<polygon points="${d([[-14, -34, 0], [100, -34, 0], [100, 112, 0], [-14, 112, 0]])}" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 5"/>`;
  return `<svg viewBox="0 0 640 480" role="img" aria-label="Axonometric drawing of the imagined museum: five sawtooth-roofed halls in a row, a dark block, a tower and a chimney." xmlns="http://www.w3.org/2000/svg">${ground}${body}${labels}</svg>`;
}
