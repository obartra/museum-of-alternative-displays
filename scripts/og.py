#!/usr/bin/env python3
"""Make public/og/<id>.jpg from the day poster of every piece.

A link to a piece's own page (piece/<id>/) is shown in a chat with this picture. It is a JPEG because not every
chat shows WebP. Run it again after the posters change:  python3 scripts/og.py   (needs Pillow)
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'public'
(root / 'og').mkdir(exist_ok=True)
made = 0
for poster in sorted((root / 'posters').glob('*-day-760.webp')):
    piece = poster.name[: -len('-day-760.webp')]
    Image.open(poster).convert('RGB').save(root / 'og' / f'{piece}.jpg', quality=80, optimize=True, progressive=True)
    made += 1
print(f'{made} pictures in public/og')

# A hall's own picture: its pieces side by side, on the dark of the room, 1200 by 630.
import re
halls: dict[int, list[str]] = {}
for f in sorted((root.parent / 'src' / 'data' / 'pieces').glob('h*.ts')):
    for m in re.finditer(r"id: '([a-z0-9-]+)', hall: (\d)", f.read_text()):
        halls.setdefault(int(m.group(2)), []).append(m.group(1))
for n, ids in halls.items():
    sheet = Image.new('RGB', (1200, 630), (22, 24, 27))
    # two rows that fill the card, each poster cut to its cell about its middle
    cols = (len(ids) + 1) // 2
    for i, piece in enumerate(ids):
        poster = root / 'posters' / f'{piece}-day-760.webp'
        if not poster.exists():
            continue
        r, c = divmod(i, cols)
        left, right = round(c * 1200 / cols), round((c + 1) * 1200 / cols)
        w, h = right - left, 315
        im = Image.open(poster).convert('RGB')
        k = max(w / im.width, h / im.height)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        x, y = (im.width - w) // 2, (im.height - h) // 2
        sheet.paste(im.crop((x, y, x + w, y + h)), (left, r * 315))
    sheet.save(root / 'og' / f'hall-{n}.jpg', quality=80, optimize=True, progressive=True)
print(f'{len(halls)} hall pictures in public/og')

# A person's own picture: their portrait drawing, at most 480 by 600, as a JPEG.
(root / 'og' / 'people').mkdir(exist_ok=True)
faces = 0
sizes: dict[str, list[int]] = {}
for face in sorted((root / 'people').glob('*.webp')):
    im = Image.open(face)
    # a portrait drawn only at the size of a label is too small to stand alone; the page then shows its piece instead
    if im.width < 300:
        continue
    size = (min(im.width, 480), min(im.height, 600))
    sizes[face.stem] = list(size)
    im.convert('RGB').resize(size, Image.LANCZOS).save(root / 'og' / 'people' / f'{face.stem}.jpg', quality=76, optimize=True, progressive=True)
    faces += 1
import json
(root / 'og' / 'people' / 'sizes.json').write_text(json.dumps(sizes, sort_keys=True))
print(f'{faces} portraits in public/og/people')
