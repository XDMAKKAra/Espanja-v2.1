// Brand tokens copied from /css/landing-tokens.css
export const brand = {
  bg: '#0a0a0a',
  bgElevated: '#141414',
  bgGradient:
    'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 60%)',
  accent: '#2DD4BF',
  accentHover: '#14B8A6',
  accentSoft: 'rgba(45,212,191,0.12)',
  accentGlow: 'rgba(45,212,191,0.20)',
  text: '#fafafa',
  textMuted: '#a1a1aa',
  border: 'rgba(255,255,255,0.08)',
  // Spanish flag
  flagRed: '#C60B1E',
  flagYellow: '#FFC400',
  // Fonts (Geist via Google Fonts loaded by Remotion when available)
  fontDisplay: '"Geist", "Inter", system-ui, -apple-system, sans-serif',
  fontBody: '"Geist", "Inter", system-ui, -apple-system, sans-serif',
  fontMono: '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
  domain: 'espanja-v2-1.vercel.app',
  tagline: 'Pärjää espanjan YO-kokeessa. Ilman kalliita kursseja.',
  cta: 'Aloita ilmaiseksi',
} as const;

export type Brand = typeof brand;
