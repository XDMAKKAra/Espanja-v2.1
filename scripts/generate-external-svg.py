#!/usr/bin/env python3
"""
Generate a portable wordmark SVG with Inter-700 embedded inline as Base64.

The resulting SVG renders identically in every viewer (browser, Slack,
Figma, Keynote, Word) because the font is part of the file. Use for
external surfaces: social posts, presentations, email signatures, print.

The HTML site uses CSS-styled text instead (style.css `.brand-wordmark`),
so this output is just for off-app use.

Run: python scripts/generate-external-svg.py
Output: public/brand/logo.svg, logo-mono.svg, logo-dark.svg, favicon-master.svg
"""

import base64
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
FONT = REPO / "fonts" / "inter-latin-700-normal.woff2"
OUT = REPO / "public" / "brand"

BRICK = "#A0341F"
INK = "#2A1F1A"
CREAM = "#F5EDE0"

font_b64 = base64.b64encode(FONT.read_bytes()).decode("ascii")

# Wordmark SVG template — <text> rendered via embedded Inter-700, no
# external font dependency. Letter-spacing tightens to match the look.
def wordmark(fill_text, fill_bg=None):
    bg = (
        f'<rect width="240" height="64" fill="{fill_bg}"/>\n  '
        if fill_bg else ""
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 64" role="img" aria-label="Puheo">
  <title>puheo</title>
  <defs>
    <style type="text/css">
      @font-face {{
        font-family: 'Inter';
        font-weight: 700;
        src: url(data:font/woff2;base64,{font_b64}) format('woff2');
      }}
    </style>
  </defs>
  {bg}<text x="0" y="46" font-family="Inter, -apple-system, sans-serif" font-weight="700" font-size="48" letter-spacing="-1.2" fill="{fill_text}">puheo</text>
</svg>
'''

def favicon():
    """Square sigil — brick rounded square with cream lowercase 'p'."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" role="img" aria-label="Puheo">
  <title>puheo</title>
  <defs>
    <style type="text/css">
      @font-face {{
        font-family: 'Inter';
        font-weight: 700;
        src: url(data:font/woff2;base64,{font_b64}) format('woff2');
      }}
    </style>
  </defs>
  <rect width="56" height="56" rx="8" fill="{BRICK}"/>
  <text x="28" y="42" font-family="Inter, -apple-system, sans-serif" font-weight="700" font-size="42" letter-spacing="-1.0" fill="{CREAM}" text-anchor="middle">p</text>
</svg>
'''

(OUT / "logo.svg").write_text(wordmark(BRICK), encoding="utf-8")
(OUT / "logo-mono.svg").write_text(wordmark(INK), encoding="utf-8")
(OUT / "logo-dark.svg").write_text(wordmark(CREAM, fill_bg=INK), encoding="utf-8")
(OUT / "favicon-master.svg").write_text(favicon(), encoding="utf-8")

print(f"Wrote 4 SVGs to {OUT}")
print(f"Inter-700 woff2 embedded as base64 ({len(font_b64) // 1024} KB each)")
