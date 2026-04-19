/**
 * Unified exercise type system — single source of truth for the shape
 * the dispatcher + renderer + grader all consume. Legacy monivalinta
 * items (returned today from OpenAI with top-level `options`/`correct`)
 * are lazily translated via `toUnified()` at the dispatcher boundary;
 * no database migration required.
 *
 * See exercises/SHARED.md §1 for the authoritative spec.
 */

/** @typedef {"monivalinta"|"aukkotehtava"|"lauseen_muodostus"|"kaannos"|"tekstinymmarrys"|"yhdistaminen"} ExerciseType */

/** @typedef {"I"|"A"|"B"|"C"|"M"|"E"|"L"} PuheoLevel */
/** @typedef {"A2"|"B1"|"B2"} Cefr */
/** @typedef {"vocab"|"grammar"|"comprehension"|"production"} SkillBucket */

/**
 * @typedef {Object} ExerciseBase
 * @property {string|number}  id
 * @property {ExerciseType}   type            Render-dispatch discriminator.
 * @property {Cefr}           cefr
 * @property {PuheoLevel}     level
 * @property {string}         topic
 * @property {string[]}       [topics]
 * @property {SkillBucket}    skill_bucket
 * @property {string}         prompt          Main stem (lang depends on type).
 * @property {string}         [instruction]   Finnish instruction banner.
 * @property {string}         [context]
 * @property {string}         [explanation]
 * @property {string}         [source]        "bank" | "generated" | "seed" | "legacy"
 * @property {Object}         payload         Discriminated payload, keyed by `type`.
 */

/**
 * @typedef {Object} MonivalintaPayload
 * @property {string[]} options
 * @property {number}   correctIndex    0-based. -1 if unknown.
 * @property {string}   [subtype]       Legacy vocab subtype: "context" | "translate" | "gap" | "meaning".
 *                                      Legacy grammar subtype: "gap" | "correction" | "transform" | "pick_rule".
 * @property {string}   [rule]          Grammar rule label (ser/estar, preterite_imperfect, …).
 */

/** Canonical list — matches exercises/SHARED.md §1. */
export const EXERCISE_TYPES = Object.freeze([
  'monivalinta',
  'aukkotehtava',
  'lauseen_muodostus',
  'kaannos',
  'tekstinymmarrys',
  'yhdistaminen',
]);

const DEFAULTS = Object.freeze({
  cefr: 'B1',
  level: 'B',
  topic: 'vocab',
  skill_bucket: 'vocab',
});

const LETTER_TO_INDEX = Object.freeze({ A: 0, B: 1, C: 2, D: 3 });

/**
 * Is `ex` already in the unified shape?
 * Cheap structural check — does not validate every field.
 * @param {*} ex
 * @returns {boolean}
 */
export function isUnified(ex) {
  return !!(ex && typeof ex === 'object' && ex.payload && typeof ex.payload === 'object');
}

/**
 * Translate a legacy exercise item (top-level `options`/`correct`/`question`)
 * to the unified shape. Identity function for already-unified items.
 *
 * @param {*} legacy
 * @param {{topic?: string, skill_bucket?: SkillBucket, level?: PuheoLevel, cefr?: Cefr, source?: string}} [meta]
 * @returns {ExerciseBase}
 */
export function toUnified(legacy, meta = {}) {
  if (isUnified(legacy)) return legacy;

  const subtype = legacy.type;
  const options = Array.isArray(legacy.options) ? legacy.options.map(stripOptionPrefix) : [];
  const correctIndex = LETTER_TO_INDEX[legacy.correct] ?? -1;

  return {
    id: legacy.id,
    type: 'monivalinta',
    cefr: meta.cefr || DEFAULTS.cefr,
    level: meta.level || DEFAULTS.level,
    topic: meta.topic || DEFAULTS.topic,
    skill_bucket: meta.skill_bucket || DEFAULTS.skill_bucket,
    prompt: legacy.question || legacy.sentence || '',
    instruction: legacy.instruction,
    context: legacy.context,
    explanation: legacy.explanation,
    source: meta.source || 'legacy',
    payload: {
      monivalinta: {
        options,
        correctIndex,
        subtype,
        rule: legacy.rule,
      },
    },
  };
}

function stripOptionPrefix(opt) {
  return typeof opt === 'string' ? opt.replace(/^[A-D]\)\s*/, '') : opt;
}
