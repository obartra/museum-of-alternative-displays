/**
 * Writes the concept sheets and phone mockups for the design canvas.
 * These are the artist's and designer's boards from before the build; the site itself is the source of truth now.
 * usage: tsx scripts/mock.ts <root>   (files land in <root>/project)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { planSvg } from '../src/art/plan';
import { axoSvg, elevationSvg } from '../src/art/building';

const root = process.argv[2] ?? '.shots/design';
mkdirSync(`${root}/project`, { recursive: true });

const T: Record<string, string> = {
  wash: '#e8e9e3', 'wash-2': '#dcdfd7', ink: '#14171a', 'ink-2': '#4c5356', line: '#b4b9af', plate: '#f7f6f0', signal: '#d1481f',
  h1: '#586067', h2: '#d1481f', h3: '#1f3fa6', h4: '#dba51a', h5: '#efe8d2', h6: '#14857c', h7: '#57409a',
  display: "'Sofia Sans Extra Condensed','Arial Narrow',sans-serif", text: "'Sofia Sans','Segoe UI',sans-serif", mono: "'PT Mono',monospace",
};
const HALLS = [['1', 'Strojovna', 'Mechanics', '7'], ['2', 'Sklárna', 'Glass and glow', '9'], ['3', 'Polovodiče', 'Solid light', '6'], ['4', 'Optika', 'Light valves', '6'], ['5', 'Tiskárna', 'Paper', '6'], ['6', 'Temná komora', 'Thin air', '8'], ['7', 'Věž', 'Depth', '8']];
const hallInk = (n: string) => (n === '4' || n === '5' ? T.ink : '#fff');

/** Make generated SVG safe for the canvas format: literal colours and fonts, no inner stylesheet, explicit closing tags. */
function lit(svg: string): string {
  return svg
    .replace(/<style>[\s\S]*?<\/style>/g, '')
    .replace(/class="plan__no plan__no--s"/g, `style="font:900 27px/1 ${T.display}"`)
    .replace(/class="plan__no"/g, `style="font:900 50px/1 ${T.display}"`)
    .replace(/class="plan__cz"/g, `style="font:700 13px/1 ${T.text}"`)
    .replace(/class="plan__en"/g, `style="font:500 11.5px/1 ${T.text}"`)
    .replace(/class="(plan|hit)"/g, '')
    .replace(/var\(--([a-z0-9-]+)\)/g, (_, k: string) => T[k] ?? '#000')
    .replace(/<(rect|circle|path|polygon|line|ellipse)([^>]*?)\/>/g, '<$1$2></$1>');
}

const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&amp;family=Sofia+Sans:wght@400;500;600;700&amp;family=Sofia+Sans+Extra+Condensed:wght@700;800;900&amp;display=swap">';

function board(title: string, w: number, h: number, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${FONTS}
<style>
body{margin:0}
a{color:${T.ink}}a:hover{color:${T.signal}}
</style>
</helmet>
<div style="width: ${w}px; height: ${h}px; box-sizing: border-box; background: ${T.wash}; color: ${T.ink}; font-family: ${T.text}; font-size: 17px; line-height: 1.45; overflow: hidden; position: relative">
${body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`;
}

const h2 = (t: string) => `<h2 style="margin: 0; font: 800 30px/1 ${T.display}; text-transform: uppercase; letter-spacing: .01em">${t}</h2>`;
const cap = (t: string) => `<p style="margin: 0; font-size: 14px; color: ${T['ink-2']}; max-width: 46ch">${t}</p>`;
const plate = (n: string, size: number) => `<div style="width: ${size}px; height: ${Math.round(size * 1.2)}px; border-radius: ${Math.round(size * 0.08)}px; background: ${T['h' + n]}; color: ${hallInk(n)}; display: flex; align-items: center; justify-content: center; font: 900 ${Math.round(size * 1.05)}px/1 ${T.display}; box-shadow: inset 0 0 0 ${Math.max(2, Math.round(size * 0.05))}px ${T['h' + n]}, inset 0 0 0 ${Math.max(3, Math.round(size * 0.07))}px ${hallInk(n) === '#fff' ? 'rgba(255,255,255,.8)' : 'rgba(20,23,26,.75)'}">${n}</div>`;

// ---------- stage sketch, shared by the plinth study and the piece mock ----------
const tube = (x: number, d: string) => `<g transform="translate(${x} 0)"><rect x="-21" y="96" width="42" height="96" rx="20" fill="#ffffff" fill-opacity=".16" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.5"></rect><rect x="-16" y="112" width="32" height="70" rx="3" fill="none" stroke="#2a2d30" stroke-opacity=".5" stroke-width=".8" stroke-dasharray="1.5 2.5"></rect><text x="0" y="168" text-anchor="middle" style="font:700 58px/1 ${T.display}" fill="#ff6a1a" fill-opacity=".55" filter="url(#glow)">${d}</text><text x="0" y="168" text-anchor="middle" style="font:700 58px/1 ${T.display}" fill="#ffb37a">${d}</text><rect x="-17" y="190" width="34" height="10" fill="#17191b"></rect></g>`;
const STAGE = `<svg viewBox="0 0 358 358" role="img" aria-label="Sketch of four nixie tubes on a steel turntable in front of a two-tone wall" style="display: block; width: 100%; height: auto; border-radius: 4px">
<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"></feGaussianBlur><feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter></defs>
<rect width="358" height="358" fill="#e3e4de"></rect><rect y="150" width="358" height="92" fill="${T.h2}"></rect><rect y="148" width="358" height="3" fill="#7d2a12"></rect><rect y="242" width="358" height="116" fill="#c9cbc3"></rect>
<ellipse cx="179" cy="268" rx="118" ry="22" fill="#000" fill-opacity=".18"></ellipse>
<path d="M69 236 v22 a110 20 0 0 0 220 0 v-22 Z" fill="#23262a"></path><ellipse cx="179" cy="236" rx="110" ry="20" fill="#34383d"></ellipse>
<g transform="translate(-40 -58) scale(1.22)">${tube(110, '1')}${tube(156, '6')}${tube(202, '2')}${tube(248, '4')}<rect x="79" y="198" width="200" height="30" rx="4" fill="#1b1d20"></rect></g>
</svg>`;

// ---------- 1. concept sheet ----------
const swatch = (c: string, name: string, note: string) => `<div style="display: flex; gap: 12px; align-items: center"><div style="width: 54px; height: 54px; border-radius: 4px; background: ${c}; box-shadow: inset 0 0 0 1.5px ${T.ink}"></div><div><div style="font-weight: 700">${name}</div><div style="font-size: 13px; color: ${T['ink-2']}">${note}</div></div></div>`;
const concept = board('Concept sheet: the works', 1280, 1140, `
<div style="padding: 44px 52px; display: flex; flex-direction: column; gap: 26px; height: 100%; box-sizing: border-box">
<div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 32px">
<h1 style="margin: 0; font: 900 76px/.86 ${T.display}; text-transform: uppercase">Muzeum alternativních displejů</h1>
<p style="margin: 0; max-width: 34ch; font-size: 16px; color: ${T['ink-2']}">Concept for a physical museum in a former picture-tube works. Five north-light bays, a windowless test block, a water tower.</p>
</div>
<div style="display: flex; gap: 48px; align-items: center">
<div style="width: 740px; flex: none">${lit(elevationSvg())}</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 12px">
${h2('Materials')}
${swatch(T.wash, 'Whitewash', 'Walls above shoulder height')}
${swatch(T.h1, 'Painted dado', 'Oil paint band, one colour per hall')}
${swatch('#c9cbc3', 'Terrazzo', 'Poured floor, brass joints')}
${swatch('#2a2d30', 'Blued steel', 'Turntable plinths, case frames')}
${swatch(T.plate, 'White enamel', 'Plates, labels, door numbers')}
</div>
</div>
<div style="display: flex; gap: 48px; align-items: flex-end">
<div style="width: 740px; flex: none">${lit(axoSvg())}</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 12px">
${h2('Plinth study')}
<div style="width: 340px">${STAGE}</div>
${cap('Every piece stands on a steel turntable in front of its hall colour. The visitor walks round it, or turns it.')}
</div>
</div>
</div>`);

// ---------- 2. wayfinding ----------
const way = board('Wayfinding: plan, plates and type', 1280, 800, `
<div style="padding: 44px 52px; display: flex; gap: 56px; height: 100%; box-sizing: border-box">
<div style="width: 440px; flex: none; display: flex; flex-direction: column; gap: 12px">
${h2('Půdorys')}
<div>${lit(planSvg(() => null, { 1: 7, 2: 9, 3: 6, 4: 6, 5: 6, 6: 8, 7: 8 }))}</div>
</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 26px; min-width: 0">
${h2('Door plates')}
<div style="display: flex; gap: 14px; flex-wrap: wrap">${HALLS.map(([n]) => plate(n, 82)).join('')}</div>
${cap('Vitreous enamel on steel, white keyline, two fixings. The hall colour appears on the plate, the dado and nowhere else.')}
${h2('Lettering')}
<div style="font: 900 104px/.84 ${T.display}; text-transform: uppercase">Sklárna 1955</div>
<div style="display: flex; gap: 40px; flex-wrap: wrap">
<div style="max-width: 30ch"><div style="font-weight: 700; margin-bottom: 4px">Plates and titles</div><div style="font: 800 34px/1 ${T.display}; text-transform: uppercase">Nixie tube</div><div style="font-size: 13px; color: ${T['ink-2']}; margin-top: 4px">Sofia Sans Extra Condensed, drawn for the signs of Sofia</div></div>
<div style="max-width: 34ch"><div style="font-weight: 700; margin-bottom: 4px">Reading text</div><div>A neon-filled tube with ten stacked cathodes, each bent into a numeral.</div><div style="font-size: 13px; color: ${T['ink-2']}; margin-top: 4px">Sofia Sans</div></div>
<div><div style="font-weight: 700; margin-bottom: 4px">Registry cards</div><div style="font: 400 14px/1.5 ${T.mono}">inv. č. 2.04<br>first shown 1955</div><div style="font-size: 13px; color: ${T['ink-2']}; margin-top: 4px">PT Mono, typed once per object</div></div>
</div>
</div>
</div>`);

// ---------- phone chrome ----------
const top = `<div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px"><a href="Entrance.dc.html" style="font: 800 24px/1 ${T.display}; text-transform: uppercase; text-decoration: none">Museum of Alternative Displays</a></div>
<div style="display: flex; gap: 6px; padding: 0 16px 14px">${HALLS.map(([n]) => `<a href="Piece.dc.html" aria-label="Hall ${n}" style="width: 44px; height: 44px; border-radius: 4px; background: ${T['h' + n]}; color: ${hallInk(n)}; display: flex; align-items: center; justify-content: center; font: 800 24px/1 ${T.display}; text-decoration: none; box-shadow: inset 0 0 0 2px ${T['h' + n]}, inset 0 0 0 3px ${hallInk(n) === '#fff' ? 'rgba(255,255,255,.7)' : 'rgba(20,23,26,.7)'}">${n}</a>`).join('')}</div>`;

// ---------- 3. entrance ----------
const flap = (ch: string, bg = '#1d1f20', fg = '#f1efe6') => `<span style="display: inline-flex; width: 17px; height: 26px; align-items: center; justify-content: center; background: ${bg}; color: ${fg}; border-radius: 2px; font: 700 19px/1 ${T.display}; text-transform: uppercase; background-image: linear-gradient(transparent 48%, #000 48%, #000 52%, transparent 52%)">${ch === ' ' ? '&nbsp;' : ch}</span>`;
const row = ([n, cz, , count]: string[]) => `<a href="Piece.dc.html" style="display: flex; gap: 3px; text-decoration: none; min-height: 44px; align-items: center">${flap(n, T['h' + n], hallInk(n))}<span style="width: 6px"></span>${cz.toUpperCase().padEnd(12, ' ').slice(0, 12).split('').map((c) => flap(c)).join('')}<span style="width: 6px"></span>${count.padStart(2, ' ').split('').map((c) => flap(c)).join('')}</a>`;
const entrance = board('Entrance on a phone', 390, 1290, `
${top}
<div style="padding: 0 16px; display: flex; flex-direction: column; gap: 22px">
<p style="margin: 0; font-size: 22px; line-height: 1.28; font-weight: 500">Fifty ways to make a picture that are not the screen you are holding. Turn each one around, switch the lights off, read how it works.</p>
<div style="background: #101112; color: #f1efe6; border-radius: 6px; padding: 12px 10px">
<div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #b9bbb3; padding: 0 2px 8px"><span>Hall</span><span>16:24</span><span>Pieces</span></div>
<div style="display: flex; flex-direction: column; gap: 0">${HALLS.map(row).join('')}</div>
</div>
${h2('Plan of the works')}
<div>${lit(planSvg(() => 'Piece.dc.html', { 1: 7, 2: 9, 3: 6, 4: 6, 5: 6, 6: 8, 7: 8 }))}</div>
</div>`);

// ---------- 4. piece ----------
const li = (t: string) => `<li style="padding: 8px 0; border-bottom: 1px solid ${T.line}">${t}</li>`;
const reg = (k: string, v: string) => `<div style="display: flex; gap: 10px; padding: 6px 0; border-bottom: 1px solid ${T.line}"><dt style="width: 9.5em; flex: none; color: ${T['ink-2']}">${k}</dt><dd style="margin: 0">${v}</dd></div>`;
const piece = board('Piece page on a phone', 390, 1560, `
${top}
<div style="padding: 0 16px; display: flex; flex-direction: column; gap: 20px">
<div style="position: relative">${STAGE}
<div style="position: absolute; left: 12px; top: 10px; font-size: 13px; font-weight: 600; color: ${T['ink-2']}">Drag to turn. Pinch to zoom.</div>
<div style="position: absolute; left: 10px; right: 10px; bottom: 10px; display: flex; gap: 8px; align-items: center">
<button type="button" role="switch" aria-checked="true" style="display: flex; align-items: center; gap: 8px; border: 0; background: none; font: 700 14px/1 ${T.text}; color: ${T.ink}; min-height: 44px; padding: 0"><span style="display: block; width: 52px; height: 28px; border-radius: 4px; background: ${T.ink}; position: relative"><span style="position: absolute; top: 3px; left: 27px; width: 22px; height: 22px; border-radius: 2px; background: ${T.signal}"></span></span>Hall lights</button>
<span style="flex: 1"></span>
<button type="button" style="border: 1.5px solid ${T.ink}; background: ${T.wash}; color: ${T.ink}; font: 700 14px/1 ${T.text}; padding: 0 12px; min-height: 44px; border-radius: 3px">Front</button>
<button type="button" style="border: 1.5px solid ${T.ink}; background: ${T.wash}; color: ${T.ink}; font: 700 14px/1 ${T.text}; padding: 0 12px; min-height: 44px; border-radius: 3px">Full view</button>
</div></div>
<div style="background: ${T.h2}; color: #fff; border-radius: 7px; padding: 18px 26px 16px; box-shadow: inset 0 0 0 5px ${T.h2}, inset 0 0 0 6.5px rgba(255,255,255,.8)"><h1 style="margin: 0; font: 800 58px/.9 ${T.display}; text-transform: uppercase">Nixie tube</h1><div style="font-weight: 600; font-size: 15px; margin-top: 6px">Hall 2, Sklárna</div></div>
<p style="margin: 0; font-size: 22px; line-height: 1.3; font-weight: 500">Ten bent wires in neon, and whichever one you energise glows as a numeral.</p>
<dl style="margin: 0; font: 400 13px/1.45 ${T.mono}; border-top: 2px solid ${T.ink}">${reg('inv. č.', '2.04')}${reg('First shown', '1955, Burroughs, USA')}${reg('Status', 'Niche. Old stock and small new runs')}${reg('Light', 'Makes its own')}</dl>
<div>${h2('How it makes an image')}<p style="margin: 8px 0 0">Each digit is its own cathode, stacked front to back inside a wire-mesh anode. About 170 volts ionises the neon around the chosen cathode and a thin orange sheath of glow follows the wire. Nothing is scanned and nothing is built from segments, which is why the numerals look drawn.</p></div>
<div><h3 style="margin: 0; font: 800 24px/1 ${T.display}; text-transform: uppercase; padding-bottom: 7px; border-bottom: 2px solid ${T.ink}">Good at</h3><ul style="margin: 0; padding: 0; list-style: none">${li('Fully formed numerals with real depth')}${li('Reading clearly in a dim room')}</ul></div>
<div><h3 style="margin: 0; font: 800 24px/1 ${T.display}; text-transform: uppercase; padding-bottom: 7px; border-bottom: 2px solid ${T.ink}">Fails at</h3><ul style="margin: 0; padding: 0; list-style: none">${li('Anything that is not on one of its ten wires')}${li('Low voltage electronics: it wants about 170 V')}${li('Digits at the back sit behind the ones in front')}</ul></div>
</div>`);

writeFileSync(`${root}/project/Main.dc.html`, concept);
writeFileSync(`${root}/project/Wayfinding.dc.html`, way);
writeFileSync(`${root}/project/Entrance.dc.html`, entrance);
writeFileSync(`${root}/project/Piece.dc.html`, piece);
writeFileSync(`${root}/project/canvas.json`, JSON.stringify({
  v: 3,
  createdOnFiles: { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') },
  title: 'Museum of Alternative Displays: concept and mockups',
  launch: { view: 'canvas' },
  pages: [],
  boards: {
    'Main.dc.html': { x: 0, y: 0, w: 1280, h: 1140, title: 'Concept: the works' },
    'Wayfinding.dc.html': { x: 1360, y: 0, w: 1280, h: 800, title: 'Concept: wayfinding' },
    'Entrance.dc.html': { x: 0, y: 1580, w: 390, h: 1290, title: 'Web: entrance' },
    'Piece.dc.html': { x: 470, y: 1580, w: 390, h: 1560, title: 'Web: piece' },
  },
  order: ['Main.dc.html', 'Wayfinding.dc.html', 'Entrance.dc.html', 'Piece.dc.html'],
  notes: {
    concept: { x: 0, y: -300, text: 'Concept artist: the physical museum', kind: 'title1', maxW: 2640 },
    web: { x: 0, y: 1280, text: 'Designer: the same building as a website', kind: 'title1', maxW: 860 },
  },
  designSystems: [],
}, null, 1));
console.log('boards written to', root);
