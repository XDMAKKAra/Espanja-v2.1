#!/usr/bin/env python3
"""
Generate Puheo wordmark variations as outline-path SVGs (no <text> element).

Variations supported via --variant flag:
  naked      — pure wordmark, no ornament
  accent     — small acute over the 'o' (puheó — Spanish-class hint)
  underline  — solid brick underline under the wordmark

Default: naked  (per the Finnish edu-brand sample research: SanomaPro,
Otava, Mafy, Wilma all ship wordmark-only — ornament is a child-segment tell).

Outputs 4 files under public/brand/ for the selected variant.
"""

import argparse
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
TARGET_CAP_HEIGHT_PX = 48


def extract_glyphs(font: TTFont):
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    glyphs = []
    for char in WORD:
        glyph_name = cmap[ord(char)]
        glyph = glyph_set[glyph_name]
        pen = SVGPathPen(glyph_set)
        glyph.draw(pen)
        bounds_pen = ControlBoundsPen(glyph_set)
        glyph.draw(bounds_pen)
        glyphs.append({
            "char": char,
            "path": pen.getCommands(),
            "advance": glyph.width,
            "bounds": bounds_pen.bounds,
        })
    return glyphs, font["hhea"].ascent


def compose(glyphs, hhea_ascent, fill_text, fill_ornament, variant, bg=None):
    scale = TARGET_CAP_HEIGHT_PX / hhea_ascent
    pad = 2
    paths = []
    cumulative_x = 0
    o_bounds_px = None

    for g in glyphs:
        tx = cumulative_x
        transform = (
            f"translate({tx * scale + pad:.3f} {hhea_ascent * scale:.3f}) "
            f"scale({scale:.6f} {-scale:.6f})"
        )
        paths.append(
            f'  <path d="{g["path"]}" fill="{fill_text}" transform="{transform}"/>'
        )
        if g["char"] == "o" and g["bounds"]:
            xMin, yMin, xMax, yMax = g["bounds"]
            o_bounds_px = (
                (xMin + tx) * scale + pad,
                (hhea_ascent - yMax) * scale,
                (xMax + tx) * scale + pad,
                (hhea_ascent - yMin) * scale,
            )
        cumulative_x += g["advance"]

    total_width = cumulative_x * scale + pad * 2
    descent_px = 16
    extra_top = 12 if variant == "accent" else 0  # accent floats above cap
    extra_bot = 8 if variant == "underline" else 0
    view_h = TARGET_CAP_HEIGHT_PX + descent_px + extra_top + extra_bot

    # All paths translated down by extra_top so accent has room
    if extra_top:
        new_paths = []
        for p in paths:
            new_paths.append(p.replace(
                f"translate(", f"translate(", 1
            ))
        # Re-emit with offset
        paths = []
        cumulative_x = 0
        for g in glyphs:
            tx = cumulative_x
            transform = (
                f"translate({tx * scale + pad:.3f} {hhea_ascent * scale + extra_top:.3f}) "
                f"scale({scale:.6f} {-scale:.6f})"
            )
            paths.append(
                f'  <path d="{g["path"]}" fill="{fill_text}" transform="{transform}"/>'
            )
            cumulative_x += g["advance"]
        # Recompute o_bounds for accent placement
        if o_bounds_px:
            ol, ot, orr, ob = o_bounds_px
            o_bounds_px = (ol, ot + extra_top, orr, ob + extra_top)

    ornament = ""
    if variant == "accent" and o_bounds_px:
        # Acute accent (´) above the 'o' — a single rotated rect, brick-colored.
        # Position: 4 px above the o-glyph top, rotated -25°, 8 px wide, 2.5 px tall.
        ol, ot, orr, ob = o_bounds_px
        cx = (ol + orr) / 2
        cy = ot - 5  # 5 px above the o-top
        w, h = 8, 2.5
        ornament = (
            f'  <rect x="{cx - w/2:.3f}" y="{cy - h/2:.3f}" '
            f'width="{w}" height="{h}" rx="1" fill="{fill_ornament}" '
            f'transform="rotate(-22 {cx:.3f} {cy:.3f})"/>'
        )
    elif variant == "underline":
        # Brick underline spanning the full wordmark, 3 px tall, sits below baseline.
        y = TARGET_CAP_HEIGHT_PX + 6 + extra_top
        ornament = (
            f'  <rect x="{pad}" y="{y:.3f}" '
            f'width="{total_width - pad * 2:.3f}" height="3" rx="1.5" fill="{fill_ornament}"/>'
        )
    # "naked" variant: ornament = ""

    bg_rect = (
        f'  <rect width="{total_width:.3f}" height="{view_h:.3f}" fill="{bg}"/>\n'
        if bg else ""
    )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {total_width:.3f} {view_h:.3f}" role="img" aria-label="Puheo" fill-rule="evenodd">\n'
        f"  <title>puheo</title>\n"
        f"{bg_rect}"
        + "\n".join(paths)
        + (f"\n{ornament}\n" if ornament else "\n")
        + "</svg>\n"
    )
    return svg, total_width, view_h


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--variant", choices=["naked", "accent", "underline"], default="naked")
    args = ap.parse_args()

    font = TTFont(str(FONT_PATH))
    glyphs, hhea_ascent = extract_glyphs(font)

    primary, _, _ = compose(glyphs, hhea_ascent, BRICK, BRICK, args.variant)
    (OUT_DIR / "logo.svg").write_text(primary, encoding="utf-8")

    mono, _, _ = compose(glyphs, hhea_ascent, INK, INK, args.variant)
    (OUT_DIR / "logo-mono.svg").write_text(mono, encoding="utf-8")

    dark, _, _ = compose(glyphs, hhea_ascent, CREAM, BRICK, args.variant, bg=INK)
    (OUT_DIR / "logo-dark.svg").write_text(dark, encoding="utf-8")

    # Favicon stays the same — single 'p' on brick tile, no ornament needed
    p_glyph = next(g for g in glyphs if g["char"] == "p")
    scale = TARGET_CAP_HEIGHT_PX / hhea_ascent
    p_width = p_glyph["advance"] * scale
    favicon_size = TARGET_CAP_HEIGHT_PX + 8
    pad_x = (favicon_size - p_width) / 2
    transform = (
        f"translate({pad_x:.3f} {hhea_ascent * scale:.3f}) "
        f"scale({scale:.6f} {-scale:.6f})"
    )
    favicon = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {favicon_size:.3f} {favicon_size:.3f}" role="img" aria-label="Puheo" fill-rule="evenodd">\n'
        f"  <title>puheo</title>\n"
        f'  <rect width="{favicon_size:.3f}" height="{favicon_size:.3f}" rx="8" fill="{BRICK}"/>\n'
        f'  <path d="{p_glyph["path"]}" fill="{CREAM}" transform="{transform}"/>\n'
        f"</svg>\n"
    )
    (OUT_DIR / "favicon-master.svg").write_text(favicon, encoding="utf-8")

    print(f"Variant: {args.variant}")
    print(f"  logo.svg, logo-mono.svg, logo-dark.svg, favicon-master.svg")


if __name__ == "__main__":
    main()
