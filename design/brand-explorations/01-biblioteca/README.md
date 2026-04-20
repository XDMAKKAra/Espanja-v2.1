# 01 · Biblioteca

**"This direction feels like a university press for wandering students."**

---

## Palette

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#16202e` | Deep blue-navy — ink, not void |
| `--surface` | `#1e2d40` | Slightly lighter navy for cards/panels |
| `--text` | `#f0e8dc` | Warm cream — paper, not screen white |
| `--text-muted` | `#8fa8bf` | Desaturated blue-grey |
| `--brand` | `#c76042` | Terracotta — earthy, Mediterranean, restrained |
| `--brand-dark` | `#a84e33` | Darker terracotta for pressed/hover states |
| `--error` | `#d94040` | Distinctly red — reserved for wrong answers only |
| `--success` | `#3c9e62` | Forest green |
| `--warn` | `#d4a84a` | Warm amber (urgency count, streak) |

**Contrast checks (WCAG):**
- `--text` on `--bg`: ~13:1 ✓ AAA
- White on `--brand-dark` (#a84e33): ~6.6:1 ✓ AA
- `--brand` on `--bg`: ~3.2:1 ✓ AA (large text / decorative)

---

## Typography

**Headline — Playfair Display 700/800**
Rationale: The gold standard for editorial academic serif. Used by The Guardian, Princeton Review, numerous university presses. Dramatic contrast between thick and thin strokes reads as "serious knowledge." Supports Finnish (ä, ö) and full Spanish (á é í ó ú ñ ¿ ¡) via Latin Extended subset. Free on Google Fonts.

**Body — Source Sans 3 400/500/600**
Rationale: Adobe's humanist sans — warm, open apertures, designed for long-read interfaces. Significantly friendlier than Inter or Roboto without being casual. Full Latin Extended support. Free on Google Fonts.

---

## Character

Dark mode. The navy reads serious but not oppressive — there's warmth in the blue undertones. Terracotta provides the single warm punctuation: CTA buttons, active states, streaks, earned grades. The serif headline is the loudest signal that this isn't another AI flashcard app.

**Best fit if:** Marcel wants the app to feel like a premium study tool that a parent trusts and a student doesn't feel embarrassed to use.

**Risk:** Playfair Display at small sizes can feel decorative. Needs the body copy to stay in Source Sans 3; don't let the serif bleed into exercise card text.
