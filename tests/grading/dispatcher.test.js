import { describe, it, expect, vi } from 'vitest';
import { dispatchGrade, registerGrader, graders } from '../../lib/grading/dispatcher.js';
import { gradeMonivalinta } from '../../lib/grading/monivalinta.js';

describe('gradeMonivalinta — pure grader', () => {
  it('returns correct=true when indices match', () => {
    const r = gradeMonivalinta({ chosenIndex: 2, correctIndex: 2 });
    expect(r.ok).toBe(true);
    expect(r.correct).toBe(true);
    expect(r.band).toBe('taydellinen');
    expect(r.score).toBe(1);
    expect(r.maxScore).toBe(1);
  });

  it('returns correct=false when indices differ', () => {
    const r = gradeMonivalinta({ chosenIndex: 0, correctIndex: 1 });
    expect(r.correct).toBe(false);
    expect(r.band).toBe('vaarin');
    expect(r.score).toBe(0);
  });

  it('IGNORES a client-supplied `correct: true` on a wrong answer', () => {
    // Server-trust regression: the override-#1 invariant.
    const r = gradeMonivalinta({ chosenIndex: 0, correctIndex: 1, correct: true });
    expect(r.correct).toBe(false);
  });

  it('rejects non-integer chosenIndex', () => {
    expect(gradeMonivalinta({ chosenIndex: 'A', correctIndex: 0 }).ok).toBe(false);
    expect(gradeMonivalinta({ chosenIndex: 1.5, correctIndex: 0 }).ok).toBe(false);
    expect(gradeMonivalinta({ chosenIndex: -1, correctIndex: 0 }).ok).toBe(false);
  });

  it('rejects non-integer correctIndex', () => {
    expect(gradeMonivalinta({ chosenIndex: 0, correctIndex: 'B' }).ok).toBe(false);
    expect(gradeMonivalinta({ chosenIndex: 0, correctIndex: -1 }).ok).toBe(false);
    expect(gradeMonivalinta({ chosenIndex: 0 }).ok).toBe(false);
  });

  it('accepts numeric strings (coerced via Number)', () => {
    const r = gradeMonivalinta({ chosenIndex: '2', correctIndex: '2' });
    expect(r.ok).toBe(true);
    expect(r.correct).toBe(true);
  });
});

describe('dispatchGrade — routing', () => {
  it('routes monivalinta submissions to gradeMonivalinta', () => {
    const r = dispatchGrade({
      type: 'monivalinta',
      exerciseId: 'test-1',
      payload: { chosenIndex: 2, correctIndex: 2 },
    });
    expect(r.ok).toBe(true);
    expect(r.correct).toBe(true);
  });

  it('returns structured error for unregistered type (no throw)', () => {
    const r = dispatchGrade({ type: 'does_not_exist', payload: {} });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/no grader registered/);
  });

  it('rejects null / non-object submission', () => {
    expect(dispatchGrade(null).ok).toBe(false);
    expect(dispatchGrade('string').ok).toBe(false);
  });

  it('forwards only `payload`, not the whole submission, to the grader', () => {
    const fake = vi.fn(() => ({ ok: true, correct: true }));
    registerGrader('__fake_type__', fake);
    dispatchGrade({ type: '__fake_type__', exerciseId: 'x', payload: { foo: 1 } });
    expect(fake).toHaveBeenCalledWith({ foo: 1 });
    delete graders.__fake_type__;
  });

  it('SERVER-TRUST: dispatcher does not echo `correct` from submission.type-level', () => {
    // Covers the override-#1 invariant at the dispatcher boundary:
    // even if a client sneaks `correct: true` into the top-level submission,
    // the dispatcher only forwards `payload` to the grader, and the grader
    // re-derives correctness.
    const r = dispatchGrade({
      type: 'monivalinta',
      correct: true,               // attacker-controlled field, must be ignored
      payload: { chosenIndex: 0, correctIndex: 1 },
    });
    expect(r.correct).toBe(false);
  });

  it('registerGrader rejects non-function values', () => {
    expect(() => registerGrader('bad', 'not-a-function')).toThrow();
    expect(() => registerGrader('bad', null)).toThrow();
  });
});
