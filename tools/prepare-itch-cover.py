"""Resize existing title art and apply the established game title typography."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/realm-title.png'
OUTPUT = ROOT / 'art/marketing/game-off-2026'
OUTPUT.mkdir(parents=True, exist_ok=True)
source_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
source = Image.open(SOURCE).convert('RGB')
base = ImageOps.fit(source, (630, 500), Image.Resampling.LANCZOS, centering=(0.5, 0.5))
base.save(OUTPUT / 'cover-art-only-630x500.png', optimize=True)
cover = base.copy()
draw = ImageDraw.Draw(cover)
font_path = Path('C:/Windows/Fonts/segoeuib.ttf')
font = ImageFont.truetype(str(font_path), 70)
for text, y in [('Arrow', 164), ('Space Shift', 238)]:
    bounds = draw.textbbox((0, 0), text, font=font)
    x = (630-(bounds[2]-bounds[0]))/2-bounds[0]
    draw.text((x, y-bounds[1]), text, font=font, fill='#f3e5c8', stroke_width=0)
cover.save(OUTPUT / 'cover-630x500.png', optimize=True)
cover.resize((315, 250), Image.Resampling.LANCZOS).save(OUTPUT / 'cover-review-315x250.png', optimize=True)
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == source_hash
for name in ['cover-art-only-630x500.png', 'cover-630x500.png']:
    result = Image.open(OUTPUT/name)
    assert result.size == (630, 500) and result.mode == 'RGB'
record = {'source': 'assets/realm-title.png', 'source_sha256': source_hash, 'source_dimensions': list(source.size),
          'output_dimensions': [630, 500], 'mode': 'RGB', 'resize': 'Pillow ImageOps.fit, centered, Lanczos',
          'typography': {'text': ['Arrow', 'Space Shift'], 'font': 'Segoe UI Bold', 'font_file': str(font_path),
                         'font_sha256': hashlib.sha256(font_path.read_bytes()).hexdigest(),
                         'font_pixels': 70, 'color': '#f3e5c8', 'line_top_y': [164, 238]},
          'limits': 'Existing project art and the existing game title only. No generative image tool or new illustration was used.',
          'files': {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in OUTPUT.glob('cover*.png')}}
(OUTPUT/'cover-recipe.json').write_text(json.dumps(record, indent=2)+'\n', encoding='utf-8')
print(json.dumps(record, indent=2))
