let _cache = null;
let _loading = null;

export async function loadVerbs() {
  if (_cache) return _cache;
  if (_loading) return _loading;
  _loading = fetch("/data/verbs.json", { cache: "force-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(`verbs fetch ${r.status}`);
      return r.json();
    })
    .then((data) => {
      _cache = data;
      return data;
    })
    .catch((err) => {
      _loading = null;
      throw err;
    });
  return _loading;
}

export const PERSON_LABELS = {
  yo: "yo",
  tu: "tú",
  el: "él",
  nosotros: "nosotros",
  vosotros: "vosotros",
  ellos: "ellos",
};

export const TENSE_LABELS = {
  present: "Preesens",
  preterite: "Preteriti",
  imperfect: "Imperfekti",
  subjunctive_present: "Subj. preesens",
  conditional: "Konditionaali",
  imperative: "Imperatiivi",
};

export const IMPERATIVE_PERSONS = ["tu", "usted", "nosotros", "vosotros", "ustedes"];

export const IMPERATIVE_PERSON_LABELS = {
  tu: "tú",
  usted: "usted",
  nosotros: "nosotros",
  vosotros: "vosotros",
  ustedes: "ustedes",
};

// Strip accents/diacritics + lowercase for lenient matching in drills.
// Diacritic correctness is still shown in feedback (`correct` form is preserved),
// but we don't penalize a missing accent — the core taivutus is what we're testing.
export function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
