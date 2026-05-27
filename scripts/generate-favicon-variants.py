#!/usr/bin/env python3
"""
L-V325 — generate 3 favicon-variants for the legibility comparison.

The current master (`public/brand/favicon-master.svg`) renders Inter-700 "p"
at font-size 42 in a 56px viewBox. At 16px (browser tab) the bowl collapses
to ~3px and the glyph reads as a solid brick blob. This script produces
three competing variants so Marcel can pick one without committing to
master changes prematurely.

  A — bigger glyph (font-size 52, letter-spacing -2.0, text-based + embedded Inter)
  B — outline path (fontTools extract of Inter-700 'p', scaled ~75% of viewBox)
  C — inverted polarity (cream bg, brick 'p', same geometry as A)

Outputs:
  public/brand/variants/favicon-variant-A.svg
  public/brand/variants/favicon-variant-B.svg
  public/brand/variants/favicon-variant-C.svg
"""

from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import ControlBoundsPen
import base64

REPO = Path(__file__).resolve().parents[1]
FONT_PATH = REPO / "fonts" / "inter-latin-700-normal.woff2"
OUT_DIR = REPO / "public" / "brand" / "variants"
OUT_DIR.mkdir(parents=True, exist_ok=True)

BRICK = "#A0341F"
CREAM = "#F5EDE0"
VIEW = 56
RADIUS = 8


def embed_inter_b64() -> str:
    return base64.b64encode(FONT_PATH.read_bytes()).decode("ascii")


def text_svg(font_size: int, letter_spacing: float, y: int, bg: str, fg: str) -> str:
    b64 = embed_inter_b64()
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW} {VIEW}" role="img" aria-label="Puheo">\n'
        f"  <title>puheo</title>\n"
        f"  <defs>\n"
        f"    <style type=\"text/css\">\n"
        f"      @font-face {{\n"
        f"        font-family: 'Inter';\n"
        f"        font-weight: 700;\n"
        f"        src: url(data:font/woff2;base64,{b64}) format('woff2');\n"
        f"      }}\n"
        f"    </style>\n"
        f"  </defs>\n"
        f'  <rect width="{VIEW}" height="{VIEW}" rx="{RADIUS}" fill="{bg}"/>\n'
        f'  <text x="{VIEW//2}" y="{y}" font-family="Inter, -apple-system, sans-serif" '
        f'font-weight="700" font-size="{font_size}" letter-spacing="{letter_spacing}" '
        f'fill="{fg}" text-anchor="middle">p</text>\n'
        f"</svg>\n"
    )


def outline_svg() -> str:
    font = TTFont(str(FONT_PATH))
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    glyph = glyph_set[cmap[ord("p")]]

    pen = SVGPathPen(glyph_set)
    glyph.draw(pen)
    bounds_pen = ControlBoundsPen(glyph_set)
    glyph.draw(bounds_pen)
    xMin, yMin, xMax, yMax = bounds_pen.bounds

    # Target glyph height = 75% of viewBox (42 px in 56 px viewBox).
    target_h = 42.0
    glyph_h_font = yMax - yMin
    scale = target_h / glyph_h_font
    glyph_w_px = (xMax - xMin) * scale

    # Center horizontally + vertically. SVGPathPen y-axis points up in font
    # units; we mirror with negative y-scale and translate so the glyph
    # baseline sits where we want it. The vertical center of the bounding
    # box ends up at VIEW/2.
    tx = (VIEW - glyph_w_px) / 2 - xMin * scale
    ty = VIEW / 2 + (yMax + yMin) / 2 * scale
    transform = f"translate({tx:.3f} {ty:.3f}) scale({scale:.6f} {-scale:.6f})"

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW} {VIEW}" '
        f'role="img" aria-label="Puheo" fill-rule="evenodd">\n'
        f"  <title>puheo</title>\n"
        f'  <rect width="{VIEW}" height="{VIEW}" rx="{RADIUS}" fill="{BRICK}"/>\n'
        f'  <path d="{pen.getCommands()}" fill="{CREAM}" transform="{transform}"/>\n'
        f"</svg>\n"
    )


def main():
    # Variant A — bigger glyph, embedded Inter, same brick/cream polarity.
    # font-size 52 (+24%) pushes the bowl from ~3 px to ~4 px at 16 px render.
    a = text_svg(font_size=52, letter_spacing=-2.0, y=44, bg=BRICK, fg=CREAM)
    (OUT_DIR / "favicon-variant-A.svg").write_text(a, encoding="utf-8")

    # Variant B — fontTools outline of Inter-700 'p'. Browser does no font-
    # rendering at all; the geometry comes pre-rasterised. fill-rule=evenodd
    # so the counter (bowl) stays open (V318e learning).
    b = outline_svg()
    (OUT_DIR / "favicon-variant-B.svg").write_text(b, encoding="utf-8")

    # Variant C — inverted polarity (cream bg + brick 'p'). Hypothesis: a
    # tabstrip-on-cream brick mark catches the eye more than cream-on-brick
    # because dark-on-light has higher edge contrast at sub-pixel sizes.
    c = text_svg(font_size=52, letter_spacing=-2.0, y=44, bg=CREAM, fg=BRICK)
    (OUT_DIR / "favicon-variant-C.svg").write_text(c, encoding="utf-8")

    for name in ("favicon-variant-A.svg", "favicon-variant-B.svg", "favicon-variant-C.svg"):
        path = OUT_DIR / name
        print(f"wrote {path.relative_to(REPO)} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
