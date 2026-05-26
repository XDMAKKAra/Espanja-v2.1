#!/usr/bin/env python3
"""
Generate the Puheo wordmark SVG with outline paths (no <text> element).

Pulls glyph outlines from Inter-700.woff2 (already in /fonts/) and composes
the lowercase wordmark `puheo` with an ornamental brick-red square replacing
the dot center of the 'o' glyph.

Run: python scripts/generate-wordmark.py
Outputs three SVGs under public/brand/.
"""

from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import ControlBoundsPen

REPO = Path(__file__).resolve().parents[1]
FONT_PATH = REPO / "fonts" / "inter-latin-700-normal.woff2"
OUT_DIR = REPO / "public" / "brand"

WORD = "puheo"
BRICK = "#A0341F"
INK = "#2A1F1A"
CREAM = "#F5EDE0"

# Visual target: cap-height ~48 px in the rendered SVG (matches the 64-unit viewBox of L-V317)
TARGET_CAP_HEIGHT_PX = 48


def extract_glyphs(font: TTFont):
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    units_per_em = font["head"].unitsPerEm
    hhea_ascent = font["hhea"].ascent

    glyphs = []
    for char in WORD:
        glyph_name = cmap[ord(char)]
        glyph = glyph_set[glyph_name]
        pen = SVGPathPen(glyph_set)
        glyph.draw(pen)
        bounds_pen = ControlBoundsPen(glyph_set)
        glyph.draw(bounds_pen)
        glyphs.append(
            {
                "char": char,
                "path": pen.getCommands(),
                "advance": glyph.width,
                "bounds": bounds_pen.bounds,  # (xMin, yMin, xMax, yMax) in font units
            }
        )
    return glyphs, units_per_em, hhea_ascent


def compose_svg(glyphs, units_per_em, hhea_ascent, fill_text, fill_dot, bg=None):
    """
    Compose SVG with cumulative x-translation per glyph.
    Y axis: Inter uses font-units with Y up; SVG uses Y down. We flip via outer
    transform `scale(1 -1)` and translate the baseline.
    """
    # Scale to target cap-height. Inter cap-height ≈ 1490 in 2048 units → ratio 0.728.
    # For wordmark visual: pick scale so x-height fits 48-unit display.
    # Simpler: use unitsPerEm as the natural canvas, then let CSS resize.
    scale = TARGET_CAP_HEIGHT_PX / hhea_ascent  # so ascent maps to TARGET px
    cumulative_x_units = 0
    paths = []
    o_bounds_px = None

    for g in glyphs:
        tx = cumulative_x_units
        # Path needs to be flipped: SVG Y-down, font Y-up.
        # Build inner group with translate + scale(1, -1) + translate baseline.
        transform = (
            f"translate({tx * scale:.3f} {hhea_ascent * scale:.3f}) "
            f"scale({scale:.6f} {-scale:.6f})"
        )
        paths.append(
            f'  <path d="{g["path"]}" fill="{fill_text}" transform="{transform}"/>'
        )

        if g["char"] == "o" and g["bounds"]:
            xMin, yMin, xMax, yMax = g["bounds"]
            # Convert to pixel space (apply translate + scale + Y-flip)
            o_left_px = (xMin + tx) * scale
            o_right_px = (xMax + tx) * scale
            o_top_px = (hhea_ascent - yMax) * scale  # flipped
            o_bottom_px = (hhea_ascent - yMin) * scale
            o_bounds_px = (o_left_px, o_top_px, o_right_px, o_bottom_px)

        cumulative_x_units += g["advance"]

    total_width_px = cumulative_x_units * scale
    # Add small left/right padding so the brick stroke doesn't clip
    pad = 2
    view_width = total_width_px + pad * 2
    # Visual viewBox height: a little more than cap-height so descender of 'p' fits
    descent_px = abs(font_descent) * scale if False else 16
    view_height = TARGET_CAP_HEIGHT_PX + descent_px

    # Translate all paths right by `pad` for the padding
    inner = "\n".join(p.replace("translate(", f"translate({pad}+") for p in paths)
    # Simpler: re-emit with pad added
    paths = []
    cumulative_x_units = 0
    for g in glyphs:
        tx = cumulative_x_units
        transform = (
            f"translate({tx * scale + pad:.3f} {hhea_ascent * scale:.3f}) "
            f"scale({scale:.6f} {-scale:.6f})"
        )
        paths.append(
            f'  <path d="{g["path"]}" fill="{fill_text}" transform="{transform}"/>'
        )
        cumulative_x_units += g["advance"]

    # Ornamental gesture: 4 px brick-red square at the geometric center of 'o',
    # offset 1 px to the upper-right.
    dot = ""
    if o_bounds_px:
        ol, ot, orr, ob = o_bounds_px
        cx = (ol + orr) / 2 + pad
        cy = (ot + ob) / 2
        size = 4
        x = cx - size / 2 + 1  # offset 1 px right
        y = cy - size / 2 - 1  # offset 1 px up
        dot = (
            f'  <rect x="{x:.3f}" y="{y:.3f}" width="{size}" height="{size}" '
            f'rx="0.5" fill="{fill_dot}"/>'
        )

    bg_rect = (
        f'  <rect width="{view_width:.3f}" height="{view_height:.3f}" fill="{bg}"/>\n'
        if bg
        else ""
    )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {view_width:.3f} {view_height:.3f}" role="img" aria-label="Puheo">\n'
        f"  <title>puheo</title>\n"
        f"{bg_rect}"
        + "\n".join(paths)
        + (f"\n{dot}\n" if dot else "\n")
        + "</svg>\n"
    )
    return svg


def main():
    assert FONT_PATH.exists(), f"Font not found: {FONT_PATH}"
    font = TTFont(str(FONT_PATH))
    global font_descent
    font_descent = font["hhea"].descent

    glyphs, units_per_em, hhea_ascent = extract_glyphs(font)

    # Primary: brick on cream (no bg, transparent — cream applied by surrounding container)
    primary = compose_svg(glyphs, units_per_em, hhea_ascent, BRICK, BRICK)
    (OUT_DIR / "logo.svg").write_text(primary, encoding="utf-8")

    # Mono: ink on cream, the dot stays ink too
    mono = compose_svg(glyphs, units_per_em, hhea_ascent, INK, INK)
    (OUT_DIR / "logo-mono.svg").write_text(mono, encoding="utf-8")

    # Dark: cream on ink — note this version includes the ink background so it
    # renders correctly on neutral surfaces like Slack previews.
    dark = compose_svg(glyphs, units_per_em, hhea_ascent, CREAM, BRICK, bg=INK)
    (OUT_DIR / "logo-dark.svg").write_text(dark, encoding="utf-8")

    print(f"Wrote: {OUT_DIR / 'logo.svg'}")
    print(f"Wrote: {OUT_DIR / 'logo-mono.svg'}")
    print(f"Wrote: {OUT_DIR / 'logo-dark.svg'}")

    # Favicon master: isolated lowercase "p" + ornamental dot (recognizable at 16px)
    p_glyph = next(g for g in glyphs if g["char"] == "p")
    o_glyph = next(g for g in glyphs if g["char"] == "o")
    scale = TARGET_CAP_HEIGHT_PX / hhea_ascent
    p_width = p_glyph["advance"] * scale
    # Use ornamental dot adjacent to 'p' (so the favicon still has the brand gesture)
    o_left, o_top, o_right, o_bottom = (
        o_glyph["bounds"][0] * scale,
        (hhea_ascent - o_glyph["bounds"][3]) * scale,
        o_glyph["bounds"][2] * scale,
        (hhea_ascent - o_glyph["bounds"][1]) * scale,
    )
    o_w = o_right - o_left
    o_h = o_bottom - o_top
    favicon_size = TARGET_CAP_HEIGHT_PX + 8
    # Center 'p' in the favicon, large enough to read at 16px (bold + tight)
    p_scale = scale * 1.0
    pad_x = (favicon_size - p_width) / 2
    transform = (
        f"translate({pad_x:.3f} {hhea_ascent * p_scale:.3f}) "
        f"scale({p_scale:.6f} {-p_scale:.6f})"
    )
    favicon = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {favicon_size:.3f} {favicon_size:.3f}" role="img" aria-label="Puheo">\n'
        f"  <title>puheo</title>\n"
        f'  <rect width="{favicon_size:.3f}" height="{favicon_size:.3f}" rx="8" fill="{BRICK}"/>\n'
        f'  <path d="{p_glyph["path"]}" fill="{CREAM}" transform="{transform}"/>\n'
        f"</svg>\n"
    )
    (OUT_DIR / "favicon-master.svg").write_text(favicon, encoding="utf-8")
    print(f"Wrote: {OUT_DIR / 'favicon-master.svg'}")


if __name__ == "__main__":
    main()
