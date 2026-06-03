/**
 * Puheo Tailwind config — L-V371 (FOUNDATION, 0 visual change).
 *
 * Scope: STATIC marketing/info HTML only (landing, pricing, privacy, terms,
 * per-language pages). The app.html SPA is intentionally NOT a Tailwind target
 * yet — it works and is left alone until a natural rewrite trigger (council
 * 2026-06-03). The app.js/js globs below exist ONLY so the purge step can see
 * class usage if/when a static surface starts using utilities; nothing in the
 * app is restyled by this config.
 *
 * Token values are copied verbatim from css/landing-tokens.css (WordDive
 * palette, L-V344). Do not invent new hex values here — this file mirrors the
 * CSS custom properties so `bg-cream` / `text-ink` / `font-display` resolve to
 * the same brand colours the hand-written CSS already uses.
 *
 * Project is ESM ("type":"module"), so this config uses `export default`.
 * Build: the npm `build` script runs the Tailwind CLI (there is no PostCSS
 * pipeline in this repo) and emits css/tailwind.css. That output is NOT linked
 * into any page in this phase — later phases (V372+) wire it in.
 */
export default {
  content: [
    './*.html',            // index, app, pricing, privacy, terms, refund, 404, diagnose, offline, styleguide
    './public/**/*.html',  // landing/espanja|ranska|saksa, brand, status
    './blog/**/*.html',
    './app.js',
    './js/**/*.js',
  ],

  // CRITICAL — preflight OFF. Tailwind's preflight resets browser default
  // styles (margins, box-sizing, heading sizes, list styles). Enabling it
  // would silently restyle every existing hand-written landing/app surface.
  // Keep it off until the static pages are fully migrated; a future phase may
  // reconsider. This is the single line that guarantees "0 visual change".
  corePlugins: {
    preflight: false,
  },

  theme: {
    extend: {
      colors: {
        cream:  '#FBF7EF',
        paper:  '#FFFFFF',
        line:   '#E9DFCF',

        // brick = primary brand / CTA accent
        brick: {
          DEFAULT: '#9B2D2A',
          dark:    '#832421',
          pale:    '#F4DAD3',
        },

        // keltainen / mustard (same value, both names usable)
        keltainen: { DEFAULT: '#F4C84A', pale: '#FBEEC6' },
        mustard:   { DEFAULT: '#F4C84A', pale: '#FBEEC6' },

        // vihrea / green (same value, both names usable)
        vihrea: { DEFAULT: '#2E5E4E', pale: '#DCE8E0' },
        green:  { DEFAULT: '#2E5E4E', pale: '#DCE8E0' },

        // warm near-black ink — never pure #000
        ink: {
          DEFAULT: '#241C15',
          muted:   '#5C5145',
          subtle:  '#897C6A',
        },

        // surface tints used by the existing landing CSS
        skin: { DEFAULT: '#E7B58C', dark: '#D29E72' },
      },

      fontFamily: {
        display: ['Fredoka', 'system-ui', '-apple-system', 'sans-serif'],
        body:    ['Mulish', 'system-ui', '-apple-system', 'sans-serif'],
      },

      borderRadius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '24px',
        pill: '999px',
      },

      boxShadow: {
        // copied from landing-tokens.css — used sparingly, tinted dark
        card:  '0 24px 48px -24px rgba(0, 0, 0, 0.4)',
        frame: '0 40px 80px -20px rgba(0, 0, 0, 0.5)',
      },

      // Additive spacing tokens (do NOT override Tailwind's numeric 4px scale).
      // Mirrors the landing 8px section rhythm so section padding stays
      // consistent across static pages.
      spacing: {
        section:        '96px',
        'section-sm':   '64px',
      },

      maxWidth: {
        content: '1200px',
      },

      letterSpacing: {
        tightest: '-0.04em',
        snug:     '-0.02em',
        wider2:   '0.10em',
      },
    },
  },

  plugins: [],
}
