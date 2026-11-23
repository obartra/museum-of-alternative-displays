"""Small copies of the portraits, 168 by 210, for the phone walk and the rows of faces.

Run after adding a portrait: python3 scripts/small-portraits.py
The full portraits stay for the person pages; validate.ts checks every portrait has its small copy."""
import os
from PIL import Image

here = os.path.join(os.path.dirname(__file__), '..', 'public', 'people')
out = os.path.join(here, 'small')
os.makedirs(out, exist_ok=True)
made = 0
for name in sorted(os.listdir(here)):
    if not name.endswith('.webp'):
        continue
    src, dst = os.path.join(here, name), os.path.join(out, name)
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        continue
    im = Image.open(src)
    if im.size[0] <= 168:
        im.save(dst, 'WEBP', quality=82, method=6)
    else:
        im.convert('RGB').resize((168, 210), Image.LANCZOS).save(dst, 'WEBP', quality=82, method=6)
    made += 1
print(f'{made} small portraits made')
