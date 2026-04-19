/**
 * YTL lyhyt oppimäärä grammar scope (B1-ish). Anything listed in OUT_OF_SCOPE
 * must NOT appear in generated exercises. The scope whitelist corresponds
 * to `GRAMMAR_TOPIC_DESCS` keys in lib/openai.js plus a few adjacent B1
 * structures students actually meet.
 *
 * `checkGrammarItemScope(item)` inspects the exercise payload (sentence +
 * explanation) for out-of-scope markers and returns an array of violations.
 * An empty array means the item is in scope.
 */

export const IN_SCOPE_TOPICS = new Set([
  "mixed", "ser_estar", "hay_estar", "subjunctive", "conditional",
  "preterite_imperfect", "pronouns",
]);

// Heuristic regexes for out-of-scope constructions. Conservative by design —
// we only flag obvious markers. False negatives are acceptable; false
// positives are not (we'd regenerate for no reason).
export const OUT_OF_SCOPE_PATTERNS = [
  // Conditional perfect (habría + past participle)
  { key: "conditional-perfect", re: /\bhabr[íi]a(s|mos|is|n)?\s+[a-záéíóúñ]+(ado|ido|to|cho|so)\b/i },
  // Past subjunctive (imperfect subjunctive: -ara/-ase, -iera/-iese — the ASE/-IESE forms are very rare at B1)
  // Only flag obvious forms, not just any word ending in -ara which could be present indicative of -erar verbs.
  { key: "past-subjunctive-se", re: /\b(fuese|hubiese|tuviese|hiciese|dijese|estuviese|pudiese|viniese|diese|quisiese)\b/i },
  // Future subjunctive (-are, -iere — extremely rare, literary)
  { key: "future-subjunctive", re: /\b(fuere|hubiere|tuviere|hiciere|dijere|estuviere|pudiere|viniere)\b/i },
  // Passive voice with ser + participle + por. Covers regular (-ado/-ido/-ada/-ida)
  // and common irregular participles ending in -to, -cho, -so, -ta, -cha, -sa.
  { key: "passive-voice", re: /\b(fue|es|será|ha sido|fueron|son|serán|han sido)\s+[a-záéíóúñ]+(ad[oa]s?|id[oa]s?|t[oa]s?|ch[oa]s?|s[oa]s?)\s+por\b/i },
];

/** Returns an array of violation keys (empty = in scope). */
export function checkGrammarItemScope(item) {
  const violations = [];
  const text = String([item?.sentence, item?.question, item?.explanation]
    .filter(Boolean).join(" "));
  for (const { key, re } of OUT_OF_SCOPE_PATTERNS) {
    if (re.test(text)) violations.push(key);
  }
  return violations;
}

/** Validate a full batch of grammar exercises. Returns { ok, issues }. */
export function validateGrammarBatch(items, { topic } = {}) {
  const issues = [];
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, issues: ["empty-or-malformed-batch"] };
  }
  const topicsSeen = new Set();
  for (let i = 0; i < items.length; i++) {
    const v = checkGrammarItemScope(items[i]);
    if (v.length) issues.push(`item-${i}-out-of-scope:${v.join(",")}`);
    if (items[i]?.topic) topicsSeen.add(items[i].topic);
  }
  // For "mixed" topic the batch must touch ≥3 distinct grammar topics
  if (topic === "mixed" && topicsSeen.size < 3) {
    issues.push(`mixed-variety-insufficient:only-${topicsSeen.size}-topics`);
  }
  return { ok: issues.length === 0, issues };
}
