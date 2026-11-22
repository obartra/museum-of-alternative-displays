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
