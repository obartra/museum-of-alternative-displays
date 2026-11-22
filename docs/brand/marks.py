"""The marks of the logo study, as SVG strings. Colours and letterforms are the museum's own."""
H = {1: '#586067', 2: '#d1481f', 3: '#1f3fa6', 4: '#dba51a', 5: '#efe8d2', 6: '#13827a', 7: '#57409a'}
INK, PLATE, WASH, NIGHT = '#14171a', '#f7f6f0', '#e8e9e3', '#08101a'
DARK_ON = {4, 5}   # the halls whose numeral is black: chrome yellow and ivory

def tile(x, y, s, hall, ch, letters=True, ink=None, fill=None, line=True):
    fill = fill or H[hall]; ink = ink or (INK if hall in DARK_ON else PLATE)
    out = f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="{s * .09:.2f}" fill="{fill}"/>'
    if line and letters: out += f'<rect x="{x + s * .065:.2f}" y="{y + s * .065:.2f}" width="{s * .87:.2f}" height="{s * .87:.2f}" rx="{s * .05:.2f}" fill="none" stroke="{ink}" stroke-opacity=".62" stroke-width="{s * .018:.2f}"/>'
    if letters: out += f'<text x="{x + s / 2:.2f}" y="{y + s * .775:.2f}" font-size="{s * .78:.2f}" text-anchor="middle" fill="{ink}">{ch}</text>'
    return out

def grid(word, halls, size=100, letters=True, mono=None, gap=.07):
    """Four letters on four plates, two to a row."""
    g = size * gap; s = (size - g) / 2
    cells = [(0, 0), (s + g, 0), (0, s + g), (s + g, s + g)]
    body = ''.join(tile(x, y, s, h, c, letters, **({'fill': mono[0], 'ink': mono[1]} if mono else {})) for (x, y), h, c in zip(cells, halls, word))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" class="mark" font-family="Sofia Sans Extra Condensed Variable" font-weight="800">{body}</svg>'

def segments(size=100, lit=None, plate=True):
    """A seven-segment figure, one segment for each hall. `lit` names the halls that are on; the rest are dim."""
    lit = lit or {1, 2, 3, 4, 5, 6, 7}
    t, L, x0, y0 = 9.5, 30, 30.5, 17      # thickness and length of a segment, and where the figure starts
    def seg(cx, cy, horiz, hall):
        h = t / 2; l = L / 2
        pts = [(-l, 0), (-l + h, -h), (l - h, -h), (l, 0), (l - h, h), (-l + h, h)]
        if not horiz: pts = [(y, x) for x, y in pts]
        d = ' '.join(f'{cx + x:.2f},{cy + y:.2f}' for x, y in pts)
        dim = '' if hall in lit else ' fill-opacity=".16"'
        return f'<polygon points="{d}" fill="{H[hall]}"{dim}/>'
    xl, xr, yt, ym, yb = x0, x0 + L + 2.4, y0, y0 + L + 2.4, y0 + 2 * (L + 2.4)
    xc = (xl + xr) / 2
    body = seg(xc, yt, True, 1) + seg(xr, (yt + ym) / 2, False, 2) + seg(xr, (ym + yb) / 2, False, 3) + seg(xc, yb, True, 4) + seg(xl, (ym + yb) / 2, False, 5) + seg(xl, (yt + ym) / 2, False, 6) + seg(xc, ym, True, 7)
    back = f'<rect width="100" height="100" rx="9" fill="{INK}"/><rect x="5" y="5" width="90" height="90" rx="6" fill="none" stroke="{WASH}" stroke-opacity=".7" stroke-width="1.1"/>' if plate else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="mark">{back}{body}</svg>'

def emm(size=100):
    """The icon the app has today: the black plate, the M and the seven halls in a column."""
    sq = ''.join(f'<rect x="19.1" y="{18 + i * 9.4:.2f}" width="7.8" height="7.8" rx=".8" fill="{H[i + 1]}"/>' for i in range(7))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="mark" font-family="Sofia Sans Extra Condensed Variable" font-weight="800"><rect width="100" height="100" rx="20" fill="{INK}"/><rect x="4.7" y="4.7" width="90.6" height="90.6" rx="15.6" fill="none" stroke="{WASH}" stroke-opacity=".78" stroke-width="1.2"/>{sq}<text x="56.5" y="82" font-size="88" text-anchor="middle" fill="{WASH}">M</text></svg>'
