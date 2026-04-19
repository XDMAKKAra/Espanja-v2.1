import { describe, it, expect } from 'vitest';
import { t, _STRINGS } from '../js/ui/strings.js';

describe('Finnish string table (SHARED.md §7)', () => {
  it('frozen — attempting to mutate throws in strict mode', () => {
    expect(Object.isFrozen(_STRINGS)).toBe(true);
  });

  it('all values are non-empty strings', () => {
    for (const [key, val] of Object.entries(_STRINGS)) {
      expect(typeof val, `${key} must be a string`).toBe('string');
      expect(val.length, `${key} must be non-empty`).toBeGreaterThan(0);
    }
  });

  it('contains every band key from SHARED.md §3', () => {
    expect(_STRINGS['band.taydellinen']).toBeTruthy();
    expect(_STRINGS['band.ymmarrettava']).toBeTruthy();
    expect(_STRINGS['band.lahella']).toBeTruthy();
    expect(_STRINGS['band.vaarin']).toBeTruthy();
  });

  it('contains the reading-grading progress string (override #5 requirement)', () => {
    expect(_STRINGS['luku.grading']).toBe('Tarkistetaan vastauksia…');
  });

  it('contains every type-instruction key referenced by Gate B–D DESIGNs', () => {
    expect(_STRINGS['aukko.instruction']).toBeTruthy();
    expect(_STRINGS['lauseen.instruction']).toBeTruthy();
    expect(_STRINGS['kaannos.instruction']).toBeTruthy();
    expect(_STRINGS['luku.instruction']).toBeTruthy();
    expect(_STRINGS['yhdista.instruction']).toBeTruthy();
  });
});

describe('t() — lookup + interpolation', () => {
  it('returns the raw string for a known key', () => {
    expect(t('band.taydellinen')).toBe('Täydellinen!');
  });

  it('interpolates {n} / {total} placeholders', () => {
    expect(t('luku.questionN', { n: 2, total: 4 })).toBe('Kysymys 2/4');
  });

  it('leaves unknown placeholders intact', () => {
    // luku.questionN has {n} and {total}; give only one.
    const out = t('luku.questionN', { n: 2 });
    expect(out).toContain('2');
    expect(out).toContain('{total}');
  });

  it('throws for an unknown key (fail loud, not silent empty)', () => {
    expect(() => t('does.not.exist')).toThrow(/no Finnish string/);
  });

  it('is a no-op when vars is omitted and the string has no placeholders', () => {
    expect(t('btn.retry')).toBe('Yritä uudelleen');
  });
});

describe('No English in user-facing values', () => {
  const ENGLISH_WORDS = [
    /\b(the|and|try|again|correct|wrong|submit|next|skip|hint|pair|error|missing|empty|language|long)\b/i,
  ];
  it('no obvious English word slips into any value', () => {
    const findings = [];
    for (const [key, val] of Object.entries(_STRINGS)) {
      for (const re of ENGLISH_WORDS) {
        if (re.test(val)) findings.push([key, val]);
      }
    }
    expect(findings).toEqual([]);
  });
});
