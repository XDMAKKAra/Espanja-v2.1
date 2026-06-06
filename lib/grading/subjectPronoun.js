/**
 * Spanish subject-pronoun normalisation for fill-in graders.
 *
 * Spanish subject pronouns are grammatically optional: "yo caminaba" and
 * "caminaba" are both correct, and a fill task that prompts "(caminar, yo)"
 * even invites the pronoun. The pedagogical unit in these drills is the VERB
 * FORM (imperfect vs preterite, the person ending) — never whether the
 * optional pronoun was typed. So before comparing a typed answer to the
 * expected one we strip a single leading subject pronoun from both sides.
 *
 * Conservative on purpose (see L-V397):
 *   - Only the FIRST token is ever removed, and only when at least one more
 *     token follows. A wrong verb form ("yo caminé" vs "caminaba") still fails
 *     because the remaining verb still differs.
 *   - "él" / "tú" are stripped only with their accent. Bare "el" / "tu" stay
 *     put so article ("el coche") and possessive ("tu casa") gap-fills are not
 *     loosened. The other subject pronouns carry no accent, so a plain
 *     lowercase compare is enough for them.
 *
 * This module is pure (no Node/browser deps) so it is shared by the server
 * gap-fill grader (lib/grading/aukkotehtava.js) and the client kartoitus
 * grader (js/features/miniYO.js, bundled by esbuild).
 */

// Accentless subject pronouns — matched case-insensitively.
const PRONOUNS_PLAIN = new Set([
  "yo", "ella", "usted", "nosotros", "nosotras",
  "vosotros", "vosotras", "ellos", "ellas", "ustedes",
]);

// Homographs of the article "el" and possessive "tu": only the accented
// pronoun forms are stripped.
const PRONOUNS_ACCENTED = new Set(["él", "tú"]);

/**
 * Strip a single leading Spanish subject pronoun (and its following space).
 * Returns the trimmed string unchanged when no leading pronoun is present.
 *
 * @param {string} s
 * @returns {string}
 */
export function stripLeadingSubjectPronoun(s) {
  const str = String(s ?? "").trim();
  const m = str.match(/^(\S+)\s+(\S.*)$/);
  if (!m) return str;
  const first = m[1].toLowerCase();
  if (PRONOUNS_PLAIN.has(first) || PRONOUNS_ACCENTED.has(first)) {
    return m[2].trim();
  }
  return str;
}
