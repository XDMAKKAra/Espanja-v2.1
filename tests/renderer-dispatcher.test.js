import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderExercise, registerRenderer, renderers } from '../js/screens/exerciseRenderer.js';
import { renderMonivalinta } from '../js/renderers/monivalinta.js';
import { toUnified } from '../lib/exerciseTypes.js';

function makeContainer() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

describe('renderExercise dispatcher', () => {
  it('routes by ex.type to the registered renderer', () => {
    const fake = vi.fn();
    registerRenderer('fake_type', fake);
    const container = makeContainer();
    renderExercise({ type: 'fake_type', payload: {} }, container, { foo: 1 });
    expect(fake).toHaveBeenCalledOnce();
    expect(fake).toHaveBeenCalledWith({ type: 'fake_type', payload: {} }, container, { foo: 1 });
    delete renderers.fake_type;
  });

  it('throws when no renderer is registered for the type', () => {
    expect(() =>
      renderExercise({ type: 'does_not_exist', payload: {} }, makeContainer()),
    ).toThrow(/no renderer registered/);
  });

  it('throws when ex is missing or malformed', () => {
    expect(() => renderExercise(null, makeContainer())).toThrow();
    expect(() => renderExercise({}, makeContainer())).toThrow();
  });

  it('has monivalinta registered by default', () => {
    expect(typeof renderers.monivalinta).toBe('function');
  });
});

describe('renderMonivalinta — paint', () => {
  let container;
  beforeEach(() => {
    container = makeContainer();
    container.innerHTML = '<div class="stale">should be cleared</div>';
  });

  const legacy = {
    id: 1,
    type: 'context',
    question: 'Maria ___ feliz.',
    options: ['A) ser', 'B) estar', 'C) haber', 'D) tener'],
    correct: 'B',
    explanation: 'Tilaa kuvaava adjektiivi → estar.',
  };

  it('clears existing children before painting', () => {
    renderMonivalinta(toUnified(legacy), container, { onAnswer: () => {} });
    expect(container.querySelector('.stale')).toBeNull();
  });

  it('paints one .option-btn per option', () => {
    renderMonivalinta(toUnified(legacy), container, { onAnswer: () => {} });
    const buttons = container.querySelectorAll('.option-btn');
    expect(buttons.length).toBe(4);
  });

  it('prefixes each option with A) / B) / C) / D)', () => {
    renderMonivalinta(toUnified(legacy), container, { onAnswer: () => {} });
    const texts = [...container.querySelectorAll('.option-btn')].map((b) => b.textContent);
    expect(texts).toEqual(['A) ser', 'B) estar', 'C) haber', 'D) tener']);
  });

  it('sets data-idx to zero-based index', () => {
    renderMonivalinta(toUnified(legacy), container, { onAnswer: () => {} });
    const indices = [...container.querySelectorAll('.option-btn')].map((b) => b.dataset.idx);
    expect(indices).toEqual(['0', '1', '2', '3']);
  });
});

describe('renderMonivalinta — click behavior', () => {
  let container;
  beforeEach(() => {
    container = makeContainer();
  });

  const legacy = {
    id: 1, type: 'context', question: 'q',
    options: ['A) a', 'B) b', 'C) c', 'D) d'],
    correct: 'B',
    explanation: 'exp',
  };

  it('invokes onAnswer with {chosenIndex, correctIndex, isCorrect, button} on click', () => {
    const onAnswer = vi.fn();
    renderMonivalinta(toUnified(legacy), container, { onAnswer });
    const btns = container.querySelectorAll('.option-btn');
    btns[2].click(); // "C) c" — wrong
    expect(onAnswer).toHaveBeenCalledOnce();
    const arg = onAnswer.mock.calls[0][0];
    expect(arg.chosenIndex).toBe(2);
    expect(arg.correctIndex).toBe(1);
    expect(arg.isCorrect).toBe(false);
    expect(arg.button).toBe(btns[2]);
  });

  it('reports isCorrect=true when the correct option is clicked', () => {
    const onAnswer = vi.fn();
    renderMonivalinta(toUnified(legacy), container, { onAnswer });
    container.querySelectorAll('.option-btn')[1].click(); // "B) b" — correct
    expect(onAnswer.mock.calls[0][0].isCorrect).toBe(true);
  });

  it('does not apply .correct / .wrong classes — caller owns visual state', () => {
    renderMonivalinta(toUnified(legacy), container, { onAnswer: () => {} });
    const btns = container.querySelectorAll('.option-btn');
    btns[2].click();
    btns.forEach((b) => {
      expect(b.classList.contains('correct')).toBe(false);
      expect(b.classList.contains('wrong')).toBe(false);
    });
  });

  it('does not disable buttons after click — caller owns that', () => {
    renderMonivalinta(toUnified(legacy), container, { onAnswer: () => {} });
    const btns = container.querySelectorAll('.option-btn');
    btns[0].click();
    btns.forEach((b) => expect(b.disabled).toBe(false));
  });

  it('survives multiple clicks without crashing (caller is responsible for guarding)', () => {
    const onAnswer = vi.fn();
    renderMonivalinta(toUnified(legacy), container, { onAnswer });
    const btn = container.querySelectorAll('.option-btn')[0];
    btn.click();
    btn.click();
    btn.click();
    expect(onAnswer).toHaveBeenCalledTimes(3);
  });
});

describe('renderMonivalinta — contract violations', () => {
  it('throws when given a non-monivalinta type', () => {
    expect(() =>
      renderMonivalinta({ type: 'aukkotehtava', payload: {} }, makeContainer()),
    ).toThrow(/expected type "monivalinta"/);
  });

  it('throws when payload.monivalinta.options is missing', () => {
    expect(() =>
      renderMonivalinta({ type: 'monivalinta', payload: { monivalinta: {} } }, makeContainer()),
    ).toThrow(/missing payload/);
  });

  it('throws when given a legacy-shaped item (call toUnified first)', () => {
    const legacy = { type: 'context', options: ['A) a'], correct: 'A' };
    expect(() => renderMonivalinta(legacy, makeContainer())).toThrow();
  });
});
