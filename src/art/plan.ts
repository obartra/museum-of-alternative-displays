import { halls } from '../data/halls';

/** Bay rectangles of the floor plan, in plan units (1 unit is roughly 25 cm on a phone-width drawing). */
const BAY: Record<number, [number, number, number, number]> = {
  1: [20, 352, 208, 80],
  2: [20, 272, 208, 80],
  3: [20, 192, 208, 80],
  4: [20, 112, 208, 80],
  5: [20, 32, 208, 80],
  6: [244, 32, 100, 128],
  7: [262, 188, 68, 68],
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * Floor plan of the works, drawn the way a building office would draw it:
 * thick walls, a column grid, the visitor route in red lead.
 * `link` turns a hall number into an href, or returns null for a static drawing.
 */
export function planSvg(link: (target: string) => string | null, counts: Record<number, number> = {}): string {
  const out: string[] = [];
  const a = (target: string, label: string, inner: string) => {
    const href = link(target);
    return href ? `<a href="${href}" aria-label="${esc(label)}">${inner}</a>` : `<g>${inner}</g>`;
  };

  // yard
  out.push(`<rect x="4" y="12" width="352" height="516" fill="none" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 5"/>`);

  // shed bays and the two towers
  for (const h of halls) {
    const [x, y, w, hgt] = BAY[h.id];
    const dark = h.id === 6;
    const big = h.id <= 5;
    const n = counts[h.id];
    let inner = `<rect class="hit" x="${x}" y="${y}" width="${w}" height="${hgt}" fill="${dark ? 'var(--ink)' : 'var(--plate)'}" stroke="var(--ink)" stroke-width="3"/>`;
    if (big) {
      // column grid
      for (let cx = x + 104; cx < x + w; cx += 52) inner += `<circle cx="${cx}" cy="${y + hgt / 2}" r="1.6" fill="var(--ink-2)"/>`;
      inner += `<rect x="${x + 10}" y="${y + 12}" width="46" height="56" rx="3" fill="var(--h${h.id})"/>`;
      inner += `<text x="${x + 33}" y="${y + 59}" text-anchor="middle" class="plan__no" fill="${h.id === 4 || h.id === 5 ? '#14171a' : '#fff'}">${h.id}</text>`;
      inner += `<text x="${x + 68}" y="${y + 38}" class="plan__name" fill="var(--ink)">${esc(h.name)}</text>`;
      if (n) inner += `<text x="${x + 68}" y="${y + 56}" class="plan__en" fill="var(--ink-2)">${n} pieces</text>`;
    } else {
      const fg = dark ? 'var(--wash)' : 'var(--ink)';
      if (h.id === 7) inner += `<circle cx="${x + w / 2}" cy="${y + hgt / 2}" r="24" fill="none" stroke="var(--ink-2)" stroke-width="1"/><path d="M${x + w / 2} ${y + hgt / 2} l17 -17 M${x + w / 2} ${y + hgt / 2} l24 0 M${x + w / 2} ${y + hgt / 2} l17 17 M${x + w / 2} ${y + hgt / 2} l0 24" stroke="var(--ink-2)" stroke-width="1"/>`;
      inner += `<rect x="${x + 8}" y="${y + 8}" width="26" height="30" rx="2" fill="var(--h${h.id})"/>`;
      inner += `<text x="${x + 21}" y="${y + 32}" text-anchor="middle" class="plan__no plan__no--s" fill="#fff">${h.id}</text>`;
      const ty = h.id === 6 ? y + 62 : y + hgt + 14;
      const tx = h.id === 6 ? x + 8 : x;
      inner += `<text x="${tx}" y="${ty}" class="plan__name" fill="${h.id === 6 ? fg : 'var(--ink)'}">${esc(h.name)}</text>`;
      if (n && h.id === 6) inner += `<text x="${tx}" y="${ty + 15}" class="plan__en" fill="var(--line)">${n} pieces</text>`;
    }
    out.push(a(`hall/${h.id}`, `Hall ${h.id}, ${h.name}`, inner));
  }

  // door openings between bays
  for (const y of [352, 272, 192, 112]) out.push(`<rect x="178" y="${y - 2}" width="36" height="4" fill="var(--plate)"/>`);
  out.push(`<rect x="178" y="430" width="36" height="4" fill="var(--plate)"/>`);
  out.push(`<rect x="226" y="60" width="4" height="26" fill="var(--plate)"/><rect x="242" y="60" width="4" height="26" fill="var(--ink)"/>`);

  // chimney
  out.push(`<circle cx="296" cy="306" r="13" fill="var(--plate)" stroke="var(--ink)" stroke-width="3"/><circle cx="296" cy="306" r="5" fill="var(--ink)"/>`);
  out.push(`<text x="316" y="310" class="plan__en" fill="var(--ink-2)">Chimney</text>`);

  // depot
  out.push(a('depot', 'The depot, an index of every piece',
    `<rect class="hit" x="252" y="344" width="88" height="88" fill="var(--wash-2)" stroke="var(--ink)" stroke-width="2" stroke-dasharray="7 4"/>` +
    `<text x="260" y="372" class="plan__name" fill="var(--ink)">Depot</text>` +
    `<text x="260" y="396" class="plan__en" fill="var(--ink-2)">Every piece,</text><text x="260" y="409" class="plan__en" fill="var(--ink-2)">sortable</text>`));

  // gatehouse
  out.push(a('about', 'The gatehouse, about the museum',
    `<rect class="hit" x="164" y="462" width="64" height="40" fill="var(--plate)" stroke="var(--ink)" stroke-width="3"/>` +
    `<text x="196" y="479" text-anchor="middle" class="plan__name" fill="var(--ink)">Gatehouse</text><text x="196" y="493" text-anchor="middle" class="plan__en" fill="var(--ink-2)">About</text>`));

  // visitor route
  out.push(`<path d="M196 462 V72 H296 V222 M296 256 V293 M296 319 V344 M296 432 V448 H236" fill="none" stroke="var(--signal)" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round"/>`);
  for (const [x, y, r] of [[196, 330, 0], [196, 170, 0], [236, 72, 90], [296, 180, 180], [262, 448, 270]] as const) {
    out.push(`<path d="M-5 4 L0 -5 L5 4 Z" fill="var(--signal)" transform="translate(${x} ${y}) rotate(${r})"/>`);
  }

  // north arrow and scale
  out.push(`<g transform="translate(322 486)"><circle r="13" fill="none" stroke="var(--ink)" stroke-width="1.2"/><path d="M0 -17 L5 6 L0 2 L-5 6 Z" fill="var(--ink)"/><text y="-21" text-anchor="middle" class="plan__en" fill="var(--ink)">N</text></g>`);
  out.push(`<g transform="translate(20 512)"><path d="M0 0 H80 M0 -4 V4 M40 -4 V4 M80 -4 V4" stroke="var(--ink)" stroke-width="1.2" fill="none"/><text x="0" y="16" class="plan__en" fill="var(--ink-2)">0</text><text x="34" y="16" class="plan__en" fill="var(--ink-2)">10</text><text x="72" y="16" class="plan__en" fill="var(--ink-2)">20 m</text></g>`);

  return `<svg class="plan" viewBox="0 0 360 540" role="group" aria-label="Floor plan of the museum. Seven halls, a depot and a gatehouse." xmlns="http://www.w3.org/2000/svg">
<style>.plan__no{font:900 50px/1 var(--display)}.plan__no--s{font-size:27px}.plan__name{font:700 13px/1 var(--text)}.plan__en{font:500 11.5px/1 var(--text)}</style>
${out.join('\n')}
</svg>`;
}
