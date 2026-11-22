// The museum's mark: MU over AD, four enamel plates of the same family as the hall numbers. Together they are one
// pixel of the museum with four sub-pixels, in red lead, cobalt, turquoise and chrome yellow (halls 2, 3, 6 and 4).
// The reasoning is in docs/brand. This file is the one drawing: the header draws it from here, and
// scripts/icons.ts writes the files in public/icons and the plate on public/og.jpg from it.
// The mark is never shown without its letters: four bare squares of colour belong to other houses. Where the
// letters would be too small to read, under 28 pixels, the mark is its first plate alone: the M on red lead.

const INK = '#14171a';
const WHITE = '#ffffff';

/** The four plates in reading order: letter, enamel, lettering. */
const PLATES: [letter: keyof typeof LETTER, enamel: string, ink: string][] = [
  ['M', '#d1481f', WHITE],
  ['U', '#1f3fa6', WHITE],
  ['A', '#13827a', WHITE],
  ['D', '#dba51a', INK],
];

// The letters are Sofia Sans Extra Condensed at weight 800, drawn as outlines on a plate of 100 by 100 (set at 78
// units, centred, the baseline 77.5 down), so the drawing needs no typeface.
const LETTER = {
  M: 'M31.7 77.5Q30.9 77.5 30.9 76.6L31.6 27.3Q31.6 26.4 32.4 26.4H42.1Q42.9 26.4 43.1 27.1L50 52.9L57 27.1Q57.1 26.4 57.9 26.4H67.6Q68.4 26.4 68.4 27.3L69.1 76.6Q69.1 77.5 68.3 77.5H60.4Q59.6 77.5 59.6 76.6L59.4 55Q59.3 51 59.5 47.7Q59.7 44.5 59.9 41.8H59.8Q59.1 44.2 58.4 46.7Q57.7 49.2 56.9 51.7L50.9 70.6Q50.7 71.3 50.2 71.3H49.8Q49.3 71.3 49.1 70.6L43.1 51.6Q42.3 49.2 41.6 46.7Q40.9 44.2 40.3 41.8H40.1Q40.4 44.5 40.5 47.7Q40.7 51 40.6 54.9L40.4 76.6Q40.4 77.5 39.7 77.5Z',
  U: 'M50 78Q42.6 78 38.9 73.6Q35.3 69.2 35.3 60.4V27.3Q35.3 26.4 36 26.4H44.2Q44.9 26.4 44.9 27.3V60.1Q44.9 65.1 46.1 67.2Q47.3 69.2 50 69.2Q52.7 69.2 53.9 67.2Q55.1 65.2 55.1 60.1V27.3Q55.1 26.4 55.9 26.4H64Q64.8 26.4 64.8 27.3V60.4Q64.8 69.2 61.1 73.6Q57.4 78 50 78Z',
  A: 'M34 77.5Q33.2 77.5 33.4 76.5L43.9 27.1Q44 26.4 44.8 26.4H55.2Q56 26.4 56.2 27.1L66.7 76.4Q66.9 77.5 66 77.5H57.1Q56.4 77.5 56.3 76.8L51.6 46.5Q51.2 43.8 50.8 41.1Q50.4 38.4 50.1 35.8H49.9Q49.6 38.4 49.2 41.1Q48.9 43.8 48.4 46.5L43.6 76.8Q43.5 77.5 42.7 77.5ZM43.7 66.9 45.1 59H54.7L56.2 66.9Z',
  D: 'M36.5 77.5Q35.6 77.5 35.6 76.6V27.3Q35.6 26.4 36.5 26.4H47.7Q56.5 26.4 60.9 31.8Q65.3 37.1 65.3 48V54.6Q65.3 66.1 61 71.8Q56.6 77.5 48 77.5ZM45.2 68.8H47.8Q52 68.8 53.8 65.4Q55.7 61.9 55.7 54.7V48Q55.7 41.4 53.8 38.3Q51.8 35.1 47.5 35.1H45.2Z'
};

const n = (v: number) => String(Math.round(v * 100) / 100);

/** The parts of one plate, its top left corner at x, y and its side s: the enamel, the thin line inside its edge, the letter. */
function plate(i: number, x: number, y: number, s: number, round = 0): { enamel: string; line: string; letter: string } {
  const [letter, enamel, ink] = PLATES[i];
  return {
    enamel: `<rect x="${n(x)}" y="${n(y)}" width="${n(s)}" height="${n(s)}"${round ? ` rx="${n(s * round)}"` : ''} fill="${enamel}"/>`,
    line: `<rect x="${n(x + s * 0.065)}" y="${n(y + s * 0.065)}" width="${n(s * 0.87)}" height="${n(s * 0.87)}" rx="${n(s * 0.05)}" fill="none" stroke="${ink}" stroke-opacity=".62" stroke-width="${n(s * 0.018)}"/>`,
    letter: `<path transform="translate(${n(x)} ${n(y)}) scale(${n(s / 100)})" fill="${ink}" d="${LETTER[letter]}"/>`,
  };
}

/** The mark on its own, for a page: four plates with a gap between them, on a grid of 100. */
export function markSvg(cls = 'mark'): string {
  const gap = 7, s = (100 - gap) / 2;
  const parts = [[0, 0], [s + gap, 0], [0, s + gap], [s + gap, s + gap]].map(([x, y], i) => plate(i, x, y, s, 0.09));
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${parts.map((p) => p.enamel + p.line + p.letter).join('')}</svg>`;
}

/** The first plate alone, for the tab of a browser, where four letters would not be read. On a grid of 32. */
export function faviconSvg(): string {
  const p = plate(0, 0, 0, 32, 0.14);
  // at this size the letter is drawn a third larger than on a plate of the mark, about the middle of the plate
  const letter = p.letter.replace(/transform="[^"]*"/, 'transform="translate(16 16.6) scale(0.43) translate(-50 -51.95)"');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${p.enamel}${p.line.replace('stroke-opacity=".62"', 'stroke-opacity=".8"').replace(/stroke-width="[^"]*"/, 'stroke-width="1.2"')}${letter}</svg>\n`;
}

/**
 * The mark as the icon of an app, on a grid of 512: the four enamels run to the edges, parted by a black line as
 * the sub-pixels of a screen are, and the plates carry no line of their own, since a phone cuts the corners to a
 * shape of its choosing. scripts/icons.ts finds the parts by their ids.
 */
export function iconSvg(): string {
  const s = 256;
  const parts = [[0, 0], [s, 0], [0, s], [s, s]].map(([x, y], i) => plate(i, x, y, s));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <title>Museum of Alternative Displays</title>
  <!--
    The icon of the museum as an app: MU over AD on four enamel plates, in the colours of halls 2, 3, 6 and 4.
    Written by scripts/icons.ts from src/mark.ts. Change the drawing there and run the script again.
  -->
  <defs>
    <clipPath id="shape"><rect id="plate" width="512" height="512" rx="104"/></clipPath>
    <!-- the light on the enamel, as the plates have it in the stylesheet: from the top, gone by two fifths of the way down -->
    <linearGradient id="light" gradientUnits="userSpaceOnUse" x1="216" y1="-30" x2="296" y2="542">
      <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
      <stop offset=".38" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#shape)">
    <g id="ground">${parts.map((p) => p.enamel).join('')}</g>
    <path id="matrix" d="M256 0V512M0 256H512" stroke="${INK}" stroke-width="12"/>
    <g id="letters">${parts.map((p) => p.letter).join('')}</g>
    <rect id="gloss" width="512" height="512" fill="url(#light)"/>
  </g>
</svg>
`;
}
