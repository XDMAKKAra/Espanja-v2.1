# 03 · Alhambra

**"This direction feels like a candlelit archive for a student who actually cares about the culture."**

---

## Palette

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#1a1410` | Very dark warm brown-charcoal — wood, not void |
| `--surface` | `#231c15` | Slightly lighter for cards/panels |
| `--text` | `#f2e8d4` | Warm antique white |
| `--text-muted` | `#b8a080` | Warm sand — readable, not cold grey |
| `--brand` | `#d46040` | Muted coral-terracotta |
| `--brand-dark` | `#b04e30` | Darker coral for pressed states |
| `--error` | `#d83a3a` | Distinctly cooler red — clearly separate from brand coral |
| `--success` | `#4aaa6e` | Bright sage green |
| `--warn` | `#d4a040` | Warm gold (urgency count, streak) |

**Contrast checks (WCAG):**
- `--text` on `--bg`: ~16:1 ✓ AAA
- White on `--brand-dark` (#b04e30): ~5.8:1 ✓ AA
- `--brand` on `--bg`: ~4.6:1 ✓ AA (passes for normal body text on bg)
- `--error` vs `--brand`: hue separation of ~30° — visually distinct ✓

---

## Typography

**Headline — Cormorant Garamond 600 / Italic**
Rationale: The most dramatic of the three serif options. Old-world Garamond proportions with slightly condensed elegance. References Spanish Renaissance manuscript culture without being cliché. Beautiful at large headline sizes; less suited for body text (too thin, too much personality). Full Latin Extended. Free on Google Fonts.

**Body — DM Sans 400/500**
Rationale: Clean, modern geometric-humanist. The neutrality of DM Sans lets Cormorant Garamond be the personality voice, while body copy remains effortlessly readable. No competing energy. Full Latin Extended. Free on Google Fonts.

---

## Character

Warm dark mode with a left-aligned hero (unlike the centered layouts of the other two). This creates a more editorial, less generic feel — top-of-funnel it reads as premium and intentional. The coral accent is used with restraint: primarily on CTAs and earned grade badges. Muted text color is warm sand rather than cold grey, which makes long study sessions feel less clinical.

**Best fit if:** Marcel wants the sharpest visual differentiation from competitors and is willing to embrace a stronger brand personality. This is the most opinionated direction.

**Risk:** Cormorant Garamond is conspicuously elegant — some Finnish users may read it as "too fancy" for a study tool. Also the most fragile typographically: at sub-16px headline sizes the thin strokes disappear. Must be used only at display scale (h1/h2). The brand coral (`#d46040`) and error red (`#d83a3a`) are only ~30° apart in hue — color-blind users need the error state reinforced with an icon, not color alone.
