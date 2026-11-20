import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { planSvg } from '../src/art/plan';
import { axoSvg, elevationSvg } from '../src/art/building';

const out = process.argv[2] ?? '.shots';
mkdirSync(out, { recursive: true });
const plan = planSvg(() => null, { 1: 7, 2: 9, 3: 6, 4: 6, 5: 6, 6: 8, 7: 8 });
writeFileSync(`${out}/plan.svg`, plan);
writeFileSync(`${out}/elevation.svg`, elevationSvg());
writeFileSync(`${out}/axo.svg`, axoSvg());
const nm = process.cwd() + '/node_modules';
const fonts = `@font-face{font-family:"Sofia Sans Variable";src:url("file://${nm}/@fontsource-variable/sofia-sans/files/sofia-sans-latin-wght-normal.woff2");font-weight:1 1000;unicode-range:U+0000-00FF}
@font-face{font-family:"Sofia Sans Variable";src:url("file://${nm}/@fontsource-variable/sofia-sans/files/sofia-sans-latin-ext-wght-normal.woff2");font-weight:1 1000;unicode-range:U+0100-02FF}
@font-face{font-family:"Sofia Sans Extra Condensed Variable";src:url("file://${nm}/@fontsource-variable/sofia-sans-extra-condensed/files/sofia-sans-extra-condensed-latin-wght-normal.woff2");font-weight:1 1000;unicode-range:U+0000-00FF}
@font-face{font-family:"Sofia Sans Extra Condensed Variable";src:url("file://${nm}/@fontsource-variable/sofia-sans-extra-condensed/files/sofia-sans-extra-condensed-latin-ext-wght-normal.woff2");font-weight:1 1000;unicode-range:U+0100-02FF}
@font-face{font-family:"PT Mono";src:url("file://${nm}/@fontsource/pt-mono/files/pt-mono-latin-400-normal.woff2")}`;
const css = readFileSync('src/styles/tokens.css', 'utf8') + readFileSync('src/styles/base.css', 'utf8');
writeFileSync(`${out}/local-fonts.css`, fonts);
writeFileSync(`${out}/art.html`, `<!doctype html><meta charset="utf-8"><style>${fonts}${css}
body{display:grid;grid-template-columns:360px 1fr;gap:20px;padding:20px;width:1160px}svg{width:100%;height:auto}</style>
<div>${plan}</div><div>${elevationSvg()}${axoSvg()}</div>`);
console.log('art written to', out);
