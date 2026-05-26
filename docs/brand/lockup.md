# Puheo brand lockup

Two artifacts, two roles. Choose by context, not by taste.

## Wordmark — horizontal surfaces

**File:** `public/brand/logo.svg` (light), `logo-dark.svg`, `logo-mono.svg`
**Form:** `puheo` — lowercase, Inter-700, outline-path SVG. Brick `#A0341F` on cream `#F5EDE0`. No ornament.
**Use it when:** there is horizontal room and the wordmark can render at ≥80 px wide.

Surfaces:
- Landing header
- App-shell topbar
- Footer
- Marketing emails (in-body, not avatar)
- Sales decks, lukio procurement PDFs
- Print materials
- Social hero images (banner, not avatar)

## Sigil — square / small surfaces

**File:** `public/brand/favicon-master.svg` (master) → `public/favicon/*.png` + root `/favicon-32.png`, `/icon-192.png`, `/icon-512.png` + `/apple-touch-icon.png`
**Form:** brick-red square with rounded corners, cream lowercase `p` centered. Pre-rendered at 16 / 32 / 48 / 180 / 192 / 512 px.
**Use it when:** the surface is square or so small the wordmark would become unreadable mush.

Surfaces:
- Browser tab favicon
- iOS / Android home-screen icon
- PWA installed icon
- Social avatar (Twitter, LinkedIn, Instagram, Bluesky profile picture)
- OG image corner badge (top-left, 48 px)
- Stripe receipt header
- Email signature avatar (next to "puheo" wordmark)
- Push notification icon
- App Store / Play Store listing icon

## Rules

1. **Never put the sigil next to the wordmark on a horizontal surface.** Wordmark already contains the "p". Doubling looks like a corporate stutter.
2. **Never recolor the wordmark or sigil.** Brick `#A0341F` and cream `#F5EDE0` are the only legal pairings. Dark-mode uses cream-on-ink, never inverted hues.
3. **Never add ornament to the wordmark.** The dot died in L-V318. The sigil is the brand's ornamental layer — it carries the visual weight that wordmarks can't.
4. **Never animate the wordmark glyph shape.** Diacritics, accents, descenders, slashes — all rejected by council 2026-05-26. A language toggle on a multi-lang site does not mutate the wordmark.
5. **Wordmark falls back to sigil at <80 px width.** If a layout cannot give the wordmark 80 px horizontal room, switch to sigil. There is no in-between size.

## What this lockup deliberately does not have

- **No tagline lockup.** Taglines belong in the surrounding copy, not embedded in the mark.
- **No language-specific variants.** The wordmark is identical on `/espanja-yo-koe`, `/saksan-yo-koe`, `/ranskan-yo-koe`. The language differs in the page content, not the brand.
- **No animated reveal.** The mark is static everywhere except the favicon-rendered home-screen icon, which uses the OS-default install animation.
- **No alternate sigil shapes.** No circle version, no monogram-only, no wordmark-stacked. One sigil, one wordmark, period.

## Generator

Both wordmark and sigil are generated from `fonts/inter-latin-700-normal.woff2` via `scripts/generate-wordmark.py` (Python + fontTools + brotli). If the brand glyph specs change, edit the script and rerun — do not hand-edit SVGs.

Favicon PNGs are rendered from `favicon-master.svg` via `scripts/generate-favicons.mjs` (Node + sharp). After regen, root-level copies (`/favicon-32.png`, `/icon-192.png`, `/icon-512.png`) must be refreshed too — they live outside `public/` for legacy `<link>` paths.

## History

- 2026-05-25 L-V317: first wordmark + favicon shipped (`<text>` runtime font, hardcoded dot, rejected)
- 2026-05-26 L-V318: outline-path wordmark via fontTools, dot inside 'o' as ornament
- 2026-05-26 L-V318b: council 5/5 verdict — kill the dot, formalize wordmark + sigil pair (this document)
