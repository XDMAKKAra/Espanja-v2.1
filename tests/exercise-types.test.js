import { describe, it, expect } from 'vitest';
import { toUnified, isUnified, EXERCISE_TYPES } from '../lib/exerciseTypes.js';

describe('toUnified — legacy vocab MC', () => {
  const legacy = {
    id: 42,
    type: 'context',
    question: 'Maria ___ feliz hoy.',
    options: ['A) ser', 'B) estar', 'C) haber', 'D) tener'],
    correct: 'B',
    context: 'Emotion + hoy → temporary state.',
    explanation: 'Hetkellinen tila → estar.',
  };

  it('discriminator is "monivalinta"', () => {
    expect(toUnified(legacy).type).toBe('monivalinta');
  });

  it('question → prompt', () => {
    expect(toUnified(legacy).prompt).toBe('Maria ___ feliz hoy.');
  });

  it('strips "A) "/"B) " prefixes from options', () => {
    expect(toUnified(legacy).payload.monivalinta.options).toEqual([
      'ser', 'estar', 'haber', 'tener',
    ]);
  });

  it('translates correct letter to zero-based index', () => {
    expect(toUnified(legacy).payload.monivalinta.correctIndex).toBe(1);
  });

  it('preserves subtype for renderer hints', () => {
    expect(toUnified(legacy).payload.monivalinta.subtype).toBe('context');
  });

  it('carries context and explanation through unchanged', () => {
    const u = toUnified(legacy);
    expect(u.context).toBe(legacy.context);
    expect(u.explanation).toBe(legacy.explanation);
  });

  it('preserves id as-is (numeric legacy stays numeric)', () => {
    expect(toUnified(legacy).id).toBe(42);
  });

  it('uses meta.topic / skill_bucket / level / cefr when provided', () => {
    const u = toUnified(legacy, {
      topic: 'ser_estar', skill_bucket: 'grammar', level: 'C', cefr: 'B2',
    });
    expect(u.topic).toBe('ser_estar');
    expect(u.skill_bucket).toBe('grammar');
    expect(u.level).toBe('C');
    expect(u.cefr).toBe('B2');
  });

  it('falls back to sensible defaults when meta is empty', () => {
    const u = toUnified(legacy);
    expect(u.topic).toBe('vocab');
    expect(u.skill_bucket).toBe('vocab');
    expect(u.level).toBe('B');
    expect(u.cefr).toBe('B1');
  });
});

describe('toUnified — legacy grammar MC', () => {
  const legacy = {
    id: 1,
    type: 'gap',
    sentence: 'Ella ___ profesora.',
    options: ['A) es', 'B) está'],
    correct: 'A',
    rule: 'ser/estar',
    instruction: 'Täydennä aukko',
    explanation: 'Ammatti on pysyvä piirre.',
  };

  it('reads `sentence` as prompt when `question` is absent', () => {
    expect(toUnified(legacy).prompt).toBe('Ella ___ profesora.');
  });

  it('preserves grammar-specific rule inside payload', () => {
    expect(toUnified(legacy).payload.monivalinta.rule).toBe('ser/estar');
  });

  it('preserves instruction at top level', () => {
    expect(toUnified(legacy).instruction).toBe('Täydennä aukko');
  });
});

describe('toUnified — edge cases', () => {
  it('is a no-op (identity) for already-unified items', () => {
    const already = {
      id: 'gen:abc', type: 'monivalinta',
      payload: { monivalinta: { options: [], correctIndex: 0 } },
    };
    expect(toUnified(already)).toBe(already);
  });

  it('maps an unknown correct-letter to -1 rather than throwing', () => {
    const u = toUnified({
      id: 1, type: 'context', question: 'q',
      options: ['A) a', 'B) b'], correct: 'Z',
    });
    expect(u.payload.monivalinta.correctIndex).toBe(-1);
  });

  it('tolerates options without "A)" prefix (pass-through)', () => {
    const u = toUnified({
      id: 1, type: 'context', question: 'q',
      options: ['ser', 'estar'], correct: 'A',
    });
    expect(u.payload.monivalinta.options).toEqual(['ser', 'estar']);
  });
});

describe('isUnified', () => {
  it('accepts unified shape', () => {
    expect(isUnified({ type: 'monivalinta', payload: { monivalinta: {} } })).toBe(true);
  });

  it('rejects legacy shape', () => {
    expect(isUnified({ type: 'context', options: [], correct: 'A' })).toBe(false);
  });

  it('rejects null / undefined / non-objects', () => {
    expect(isUnified(null)).toBe(false);
    expect(isUnified(undefined)).toBe(false);
    expect(isUnified('string')).toBe(false);
  });
});

describe('EXERCISE_TYPES enum', () => {
  it('includes all six types from SHARED.md §1', () => {
    expect(EXERCISE_TYPES).toContain('monivalinta');
    expect(EXERCISE_TYPES).toContain('aukkotehtava');
    expect(EXERCISE_TYPES).toContain('lauseen_muodostus');
    expect(EXERCISE_TYPES).toContain('kaannos');
    expect(EXERCISE_TYPES).toContain('tekstinymmarrys');
    expect(EXERCISE_TYPES).toContain('yhdistaminen');
  });
});
