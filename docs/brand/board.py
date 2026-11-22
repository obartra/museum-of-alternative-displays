"""Writes the two boards of the logo study as HTML: python3 docs/brand/board.py <folder> (default /tmp), then photograph them at 1080 wide and twice the size."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from marks import grid, segments, emm, H, INK, PLATE, WASH, NIGHT
F = 'file://' + os.path.normpath(os.path.join(HERE, '../../node_modules/@fontsource-variable')) + '/'
Q = [2, 3, 6, 4]     # red lead, cobalt, turquoise, chrome yellow
CSS = f'''
@font-face {{ font-family: "Sofia Sans Variable"; src: url("{F}sofia-sans/files/sofia-sans-latin-wght-normal.woff2") format("woff2"); font-weight: 1 1000; }}
@font-face {{ font-family: "Sofia Sans Extra Condensed Variable"; src: url("{F}sofia-sans-extra-condensed/files/sofia-sans-extra-condensed-latin-wght-normal.woff2") format("woff2"); font-weight: 1 1000; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; width: 1080px; background: {WASH}; color: {INK}; font: 500 19px/1.42 "Sofia Sans Variable", sans-serif; }}
.pad {{ padding: 44px 48px; }}
h1 {{ font: 800 58px/.98 "Sofia Sans Extra Condensed Variable", sans-serif; margin: 0 0 12px; letter-spacing: .005em; }}
h2 {{ font: 800 32px/1 "Sofia Sans Extra Condensed Variable", sans-serif; margin: 0 0 10px; }}
p {{ margin: 0 0 12px; max-width: 60ch; }}
.small {{ font-size: 16px; color: #3d4448; }}
.mark {{ display: block; }}
.name {{ font: 800 1em/.92 "Sofia Sans Extra Condensed Variable", sans-serif; text-transform: uppercase; letter-spacing: .012em; }}
.rule {{ border-top: 2px solid {INK}; margin-top: 30px; padding-top: 26px; }}
.row {{ display: flex; gap: 28px; align-items: flex-end; flex-wrap: wrap; }}
.cap {{ font-size: 15px; color: #3d4448; margin-top: 8px; }}
.night {{ background: {NIGHT}; color: #dde3ea; }} .night .cap, .night .small {{ color: #97a3b3; }}
.lock {{ display: flex; align-items: center; gap: 16px; }}
.bar {{ display: flex; align-items: center; gap: 12px; background: {WASH}; padding: 12px 16px; box-shadow: 0 0 0 1.5px {INK}; border-radius: 6px; }}
.tab {{ width: 34px; height: 34px; border-radius: 4px; display: grid; place-items: center; font: 800 20px/1 "Sofia Sans Extra Condensed Variable", sans-serif; }}
.icon {{ border-radius: 22%; overflow: hidden; }}
.two {{ display: grid; grid-template-columns: 1fr 1fr; gap: 0; }}
.card {{ padding: 34px 40px 36px; border-top: 2px solid {INK}; }} .card:nth-child(odd) {{ border-right: 2px solid {INK}; }}
ul {{ margin: 6px 0 0; padding-left: 20px; }} li {{ margin-bottom: 5px; }}
.pick {{ background: {INK}; color: {WASH}; }} .pick p {{ max-width: 64ch; }}
'''
def sized(svg, px): return svg.replace('class="mark"', f'class="mark" width="{px}" height="{px}"')
def name(px, two=True, colour='inherit'): return f'<div class="name" style="font-size:{px}px;color:{colour}">Museum of{"<br>" if two else " "}Alternative Displays</div>'
def tabs(): return ''.join(f'<span class="tab" style="background:{H[n]};color:{INK if n in (4, 5) else PLATE}">{n}</span>' for n in range(1, 8))
def page(body): return f'<!doctype html><meta charset="utf-8"><style>{CSS}</style>{body}'

admu = lambda px, letters=True, mono=None, word='ADMU': sized(grid(word, Q, letters=letters, mono=mono), px)
sizes = ''.join(f'<div>{admu(px, px >= 28)}<div class="cap">{px} px</div></div>' for px in (128, 64, 40, 28, 20, 16))

one = page(f'''
<div class="pad">
  <h1>Four plates: AD over MU</h1>
  <p>Your idea, drawn the way the museum already draws things. Each letter stands on the enamel plate that carries a hall's number, with the thin line inside its edge, in the display face of the plates.</p>
  <div class="row" style="align-items:center; gap:44px; margin-top:26px">
    {admu(430)}
    <div style="flex:1; min-width:300px">
      <h2>Why these four colours</h2>
      <p>Red lead, cobalt, turquoise and chrome yellow are halls 2, 3, 6 and 4. They are also what a screen is made of: red, blue, green, and the yellow some panels add. So the mark is one pixel of the museum, with four sub-pixels.</p>
      <p class="small">Machine grey, ivory and violet stay where they are: on their halls.</p>
    </div>
  </div>
  <div class="rule"><h2>Small</h2><p class="small">Under 28 pixels the letters go and the four colours stay. That is still the mark, the way a pixel is still a pixel.</p><div class="row">{sizes}</div></div>
  <div class="rule"><h2>With the name</h2>
    <div class="row" style="align-items:center; gap:56px">
      <div class="lock">{admu(92)}{name(46)}</div>
      <div style="text-align:left">{admu(120)}<div style="margin-top:14px">{name(33)}</div></div>
    </div>
  </div>
</div>
<div class="pad night">
  <h2>At night</h2>
  <div class="row" style="align-items:center; gap:56px">{admu(170)}<div class="lock">{admu(72)}{name(36)}</div></div>
</div>
<div class="pad">
  <h2>In one ink</h2>
  <div class="row" style="gap:36px">
    <div>{admu(130, mono=(INK, PLATE))}<div class="cap">Black enamel, for a stamp or a print</div></div>
    <div style="background:{INK}; padding:18px; border-radius:6px">{admu(130, mono=(PLATE, INK))}</div>
  </div>
  <div class="rule"><h2>In use</h2>
    <div class="row" style="align-items:center; gap:34px">
      <div class="icon">{sized(grid('ADMU', Q, gap=.0).replace('rx="4.50"', 'rx="0"').replace('rx="4.19"', 'rx="0"'), 150)}</div>
      <div style="flex:1; min-width:420px"><div class="bar">{admu(40)}{name(21)}<span style="flex:1"></span>{tabs()}</div><div class="cap">The app's icon, and the top of a page. Beside the seven hall numbers the mark is one more plate of the same family.</div></div>
    </div>
  </div>
</div>''')
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
open(os.path.join(OUT, 'one.html'), 'w', encoding='utf-8').write(one)

def card(title, mark, small, lines, lock=True):
    s = ''.join(f'<div>{sized(m, px)}<div class="cap">{px} px</div></div>' for m, px in small)
    return f'<div class="card"><h2>{title}</h2><div class="row" style="align-items:flex-end; gap:22px; margin:14px 0 16px">{sized(mark, 190)}{s}</div><ul class="small">{"".join(f"<li>{l}</li>" for l in lines)}</ul></div>'
A = lambda letters=True: grid('ADMU', Q, letters=letters)
B = lambda letters=True: grid('MUAD', Q, letters=letters)
two = page(f'''
<div class="pad" style="padding-bottom:30px">
  <h1>Which mark? A designer's pass</h1>
  <p>Four candidates, each at 190, 32 and 16 pixels. All four use only what the museum already has: the plates, the hall colours, the display face.</p>
</div>
<div class="two">
  {card('1. AD over MU', A(), [(A(), 32), (A(False), 16)], ['Bold, simple, and of one family with the hall numbers.', 'Reads ADMU, which is not the order of the name: Museum of Alternative Displays.', 'ADMU is the initialism of Ateneo de Manila University. A search for it leads there.', 'Uses four hall colours of seven.'])}
  {card('2. MU over AD', B(), [(B(), 32), (B(False), 16)], ['The same plates and colours, in the order of the name: MUseum of Alternative Displays.', 'The top row says museum, the bottom row says what kind.', 'A search for MUAD finds no museum of that name. The nearest are MAD in New York and MUAC in Mexico City.', 'Still four colours of seven. The pixel explains why.'])}
  {card('3. Seven segments', segments(), [(segments(), 32), (segments(), 16)], ['Seven segments for seven halls, each in its colour. The mark is itself an alternative display.', 'It can light one segment for the hall a visitor is in.', 'At a glance it is the figure 8 in a rainbow: a clock, a toy. It does not say museum.', 'Muddy at 16 pixels.'])}
  {card('4. The M of today', emm(), [(emm(), 32), (emm(), 16)], ['Already the app icon. All seven halls are on it.', 'An M on a dark plate is what many apps have. The seven squares vanish at 16 pixels.'])}
</div>
<div class="pad pick">
  <h2>What I would do</h2>
  <p>Take your idea, in the order of the name: MU over AD, on the four pixel colours. It keeps everything that is good about the four plates and loses the two things that work against ADMU.</p>
  <div class="row" style="align-items:center; gap:30px; margin:20px 0 18px"><div style="background:{WASH}; padding:14px; border-radius:6px">{sized(B(), 150)}</div><div class="lock"><div style="background:{WASH}; padding:8px; border-radius:5px">{sized(B(), 64)}</div>{name(38, colour=WASH)}</div></div>
  <p class="small" style="color:#b9c0c4">Keep the seven hall colours for the halls: the tabs, the board, the lines on the floor. The seven segments are worth keeping as a figure inside the museum, a loading sign or the number on a ticket, and not as the logo.</p>
</div>''')
open(os.path.join(OUT, 'two.html'), 'w', encoding='utf-8').write(two)
print('written')
