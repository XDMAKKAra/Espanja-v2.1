#!/usr/bin/env node
// L-V411 Vaihe A — BUILD-TIME item bank indexer.
//
// Walks data/courses/<lang>/**/lesson_*.json and produces a concept-indexed
// bank: data/item-bank/<lang>.json  →  { concept: [ {ref, item_type, difficulty,
// level, source} ] }. Runtime (Vaihe C/D) reads these as a pure O(1) selection
// index — zero OpenAI calls.
//
// Entries are REF-ONLY for authored items: the renderable payload stays in the
// lesson JSON (single source of truth, no staleness) and is resolved on demand
// via lib/curriculum.js readLessonFile(courseKey, lessonIndex, lang) only for
// the handful of items actually selected for a review session. This keeps the
// bank ~2 MB instead of ~19 MB and avoids duplicating every item payload under
// up to 3 concepts. Future `source:"generated"` items (none today) would carry
// an embedded `item` instead, since they have no lesson file to resolve from.
//
// Concept derivation is layered, strongest signal first:
//   (1) explicit item.concepts[]            → normalizeTopics
//   (2) lesson-title mapper (TITLE_RULES)    → lessons are single-concept, so
//       meta.title is the strongest signal and works across es/de/fr
//   (3) inferTopics() on item text           → same regex the capture layer uses,
//       so the bank speaks the SAME keys as user_mistakes (Phase C depends on this)
//   (4) coarse fallback by lesson_type        → so nothing is silently dropped
//
// Determinism: no Math.random, stable sort. Re-run by hand when course data
// changes (`node scripts/build-item-bank.mjs`); the output is committed.
//
// Usage:
//   node scripts/build-item-bank.mjs            # build all langs, write files
//   node scripts/build-item-bank.mjs --report   # build + print coverage, write
//   node scripts/build-item-bank.mjs --dry       # build + report, do NOT write

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeTopics, inferTopics, VALID_TOPICS } from "../lib/mistakeTaxonomy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const COURSES_DIR = path.join(ROOT, "data", "courses");
const OUT_DIR = path.join(ROOT, "data", "item-bank");
const LANGS = ["es", "de", "fr"];
const MIN_ITEMS_PER_CONCEPT = 3;

// Item types we can render + grade deterministically at runtime. Free-production
// (writing/essay) stays AI-graded and is excluded from the bank by design.
const RENDERABLE_TYPES = new Set(["mc", "typed", "gap_fill", "translate", "match"]);

// ── (2) Title → concept rules ───────────────────────────────────────────────
// Ordered, applied to lowercased meta.title. A title may match several rules;
// the union (capped at 3) is taken. Tuned to the actual es/de/fr lesson titles.
// Finnish grammar terms are shared across all three languages (teaching text is
// Finnish); native terms (Akkusativ, subjonctif, passé composé) are added per rule.
const TITLE_RULES = [
  // ── verb tenses / moods ──
  [/subjonctif|subjunktiiv|subjunctive/, ["subjunctive"]],
  [/ojal[áa]/, ["ojala_expression", "subjunctive"]],
  [/konjunktiv ii|conditionnel|konditionaali/, ["conditional"]],
  [/\bsi-|si-laus|si-hypotees|si-tyypp|epätodellinen ehto|wenn-sivulause|\bwenn\b/, ["conditional"]],
  [/pluskvamperfekt|plusquamperfekt|plus-que-parfait|plus que parfait/, ["preterite_imperfect", "past_tenses"]],
  [/preteriti|preterite|prétérit|passé composé|passe compose|perfekt|präteritum|prateritum|imperfekti|imparfait|menneet aikamuod|aikamuotojen kertaus|damals/, ["preterite_imperfect", "past_tenses"]],
  [/futuuri|futur\b|futur i|futur simple|futur proche|futuro próximo|futuro proximo|tuleva/, ["future"]],
  [/\bser vs estar|ser vs\.? estar|ser ja estar|être vs avoir|etre vs avoir|haben vs\.? sein|sein ja haben|sein und haben/, ["ser_estar"]],
  [/gustar/, ["gustar_verbs"]],
  [/stem-chang|epäsäännölliset.*verbi|vahvat verbit|vahvat täysmuod|epäsäännölliset partisiip|epäsäännölliset preesens|epäsäännölliset.*kann|irregular/, ["irregular_verbs"]],
  [/säännölliset.*verbit|-ar-verbit|-er-.*-ir-verbit|säännölliset -ar|präsens, säännöll|präsens säännöll|présent, säännöll|present, säännöll|heikot verbit|regular/, ["regular_verbs"]],
  [/preesens|präsens|présent|present/, ["regular_verbs"]],
  [/modaaliverbit|modal/, ["irregular_verbs"]],
  [/werden/, ["future"]],
  [/reflektiiv|refleksiiv|reflexive|reflexiiv/, ["reflexive_verbs"]],
  [/imperatiivi|käskymuoto|imperativ/, ["imperative"]],
  [/passiv|passive|passiiv/, ["passive_voice"]],
  [/indirekte rede|konjunktiv i\b/, ["word_order"]],
  // ── nominal system ──
  [/artikkel|akkusativ|dativ|genitiv|nominativ|der.*die.*das|määräiset artikkel|partitiiv|partitif|le\/la\/les|el.*la.*los/, ["articles"]],
  [/accord|genre.*nombre|kongruens|gender|suku ja luku|omistuspronomini|possessiv/, ["gender_agreement"]],
  [/adjektiiv|adjective|kuvail/, ["adjective_position"]],
  [/vertail|comparati|comparison/, ["comparatives"]],
  [/relatiivilause|relatiivipronomin|pronoms relatifs|relativsätz|relativsatz|relative/, ["relative_pronouns"]],
  [/pronomin|pronoms|pronoun|persoonapronomin/, ["pronouns"]],
  [/preposit|maille-prepositio|prepositiot|en\/au\/aux|mit\/von\/zu/, ["prepositions"]],
  [/por.*para|para.*por/, ["por_para"]],
  // ── syntax ──
  [/sanajärjest|word order|\bv2\b|v2-sääntö|svo|inversio|sivulaus|verbi loppu|v-loppu/, ["word_order"]],
  [/kielto|negaatio|negation|ne\.\.\.pas|ne…pas|nicht vs|kein\b/, ["negation"]],
  [/konnektor|konjunktio|connecteur|sidoste|deshalb|trotzdem|weil|dass|obwohl|damit/, ["connectors"]],
  // ── vocab themes ──
  [/ruoka|ateria|food|nourriture/, ["food"]],
  [/matka|matkust|matkail|kulkuväline|hotelli|majoitus|loma|nähtäv|voyage|hôtel|hotel\b|reise/, ["travel"]],
  [/työ|ammat|työhake|traumberuf|bewerbung|métier|travail/, ["work"]],
  [/koulu|koulut|opiskelu|education|école|schule/, ["education"]],
  [/ympärist|ilmasto|luonto|environ|écolog|ecolog|energie|énergie|klimawandel|energiewende|sää|vuodenaj/, ["environment"]],
  [/teknolog|internet|digitaal|media|kommunikaatio|littérature|kirjallisuus/, ["technology"]],
  [/terveys|health|santé/, ["health"]],
  [/yhteiskun|politi|société|societe|tasa-arvo|monikulttuur|pakolais|demokrati|sosiaaliset|historia|sota|gesellschaft|identit/, ["society"]],
  [/kulttuuri|taide|kirjallisuus|musiikki|elokuva|teatteri|culture|\barts\b|littérat|musique|cinéma|cinema|théâtre|theatre|kunst|musik/, ["culture"]],
  [/abstrakti|mielipide|argumentoin|opinion/, ["abstract_vocabulary"]],
  [/idiom/, ["idioms"]],
  [/koti|huonekal|asumin|huone|maison|wohn/, ["daily_life"]],
  [/perhe|kansallisuu|sukulais|famil/, ["daily_life"]],
  [/vapaa-aika|harrastu|urheilu|loisir|freizeit/, ["daily_life"]],
  [/lapsuus|muistot|nostalgi|enfance|kindheit|erinnerung/, ["daily_life"]],
  [/numerot|\bikä\b|kellonaj|viikonpäiv|värit|zahlen|ajan ilmau|temps qui passe|gestern/, ["daily_life"]],
  [/eläim|animau|tier/, ["daily_life"]],
  [/tervehdy|kohteliais|salut|présentez|esittely|stell/, ["daily_life"]],
];

// Reading-comprehension fallbacks (mc/typed items in reading lessons that match
// no grammar/vocab rule). Genuine taxonomy keys so they still resurface.
const READING_FALLBACK = ["vocabulary_in_context"];

function titleConcepts(title) {
  const t = String(title || "").toLowerCase();
  const out = [];
  for (const [re, concepts] of TITLE_RULES) {
    if (re.test(t)) {
      for (const c of concepts) if (!out.includes(c)) out.push(c);
    }
  }
  return out.slice(0, 3);
}

// ── (3) inferTopics on the renderable item's own text ───────────────────────
function itemText(item) {
  return [
    item.stem,
    item.prompt,
    item.sentence_template,
    item.source,
    item.explanation,
    Array.isArray(item.accept) ? item.accept.join(" ") : item.accept,
    Array.isArray(item.choices) ? item.choices.join(" ") : null,
  ].filter(Boolean).join(" ");
}

function inferItemConcepts(item) {
  return inferTopics({ question: itemText(item), explanation: item.explanation });
}

// ── difficulty / level ──────────────────────────────────────────────────────
function phaseDifficulty(phaseType) {
  const p = String(phaseType || "");
  if (/recognition/.test(p)) return "easy";
  if (/recall/.test(p)) return "medium";
  if (/synthesis|sentence_build/.test(p)) return "hard";
  if (/application/.test(p)) return "medium";
  return "medium";
}

function itemDifficulty(item, phaseType) {
  const d = String(item.distractor_difficulty || "").toLowerCase();
  if (d === "easy" || d === "medium" || d === "hard") return d;
  return phaseDifficulty(phaseType);
}

// ── concept derivation for one item ─────────────────────────────────────────
function deriveConcepts(item, lessonConcepts, lessonType) {
  const explicit = normalizeTopics(item.concepts || item.topics);
  if (explicit.length) return explicit;

  const out = [];
  for (const c of lessonConcepts) if (!out.includes(c)) out.push(c);
  for (const c of inferItemConcepts(item)) if (!out.includes(c)) out.push(c);
  if (out.length) return out.slice(0, 3);

  // (4) coarse fallback so nothing is dropped
  if (lessonType === "reading") return READING_FALLBACK.slice();
  return [];
}

// ── walk one language ───────────────────────────────────────────────────────
function buildLang(lang) {
  const langDir = path.join(COURSES_DIR, lang);
  const bank = {}; // concept -> items[]
  const untagged = []; // refs with no derivable concept (for the gap log)
  let totalItems = 0;
  let indexedItems = 0;

  const kurssit = fs.readdirSync(langDir)
    .filter((k) => fs.statSync(path.join(langDir, k)).isDirectory())
    .sort();

  for (const kurssi of kurssit) {
    const kurssiDir = path.join(langDir, kurssi);
    const files = fs.readdirSync(kurssiDir)
      .filter((f) => /^lesson_\d+\.json$/.test(f))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)[0], 10);
        const nb = parseInt(b.match(/\d+/)[0], 10);
        return na - nb;
      });

    for (const file of files) {
      const full = path.join(kurssiDir, file);
      let lesson;
      try {
        lesson = JSON.parse(fs.readFileSync(full, "utf8"));
      } catch (e) {
        console.error(`  ! parse error ${lang}/${kurssi}/${file}: ${e.message}`);
        continue;
      }
      const meta = lesson.meta || {};
      const lessonType = meta.lesson_type || "";
      const level = meta.level || null;
      const kurssiKey = `${lang}_${meta.course_key || kurssi}`;
      const lessonConcepts = titleConcepts(meta.title);

      for (const phase of lesson.phases || []) {
        const phaseId = phase.phase_id || "";
        const phaseType = phase.phase_type || "";
        const items = phase.items || [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item || !RENDERABLE_TYPES.has(item.item_type)) continue;
          totalItems++;
          const concepts = deriveConcepts(item, lessonConcepts, lessonType);
          const ref = { kurssiKey, lessonIndex: meta.lesson_index ?? null, phaseId, itemIndex: i };
          if (!concepts.length) {
            untagged.push({ ref, item_type: item.item_type, title: meta.title, lessonType });
            continue;
          }
          indexedItems++;
          // Ref-only: payload resolved at runtime via readLessonFile(ref).
          const entry = {
            ref,
            item_type: item.item_type,
            difficulty: itemDifficulty(item, phaseType),
            level,
            source: "authored",
          };
          for (const c of concepts) {
            if (!bank[c]) bank[c] = [];
            bank[c].push(entry);
          }
        }
      }
    }
  }

  // Prune singleton noise: a concept that can't muster MIN items across 90
  // lessons isn't a genuine, taught concept (it's a substring false-match, e.g.
  // por_para in French). The resurface loop needs a varied pool, so a 1-item
  // "concept" is useless and actively misleading. Drop and log.
  const pruned = {};
  for (const concept of Object.keys(bank)) {
    if (bank[concept].length < MIN_ITEMS_PER_CONCEPT) {
      pruned[concept] = bank[concept].length;
      delete bank[concept];
    }
  }

  // Stable order: concept keys alpha, items by ref for determinism.
  const ordered = {};
  for (const concept of Object.keys(bank).sort()) {
    ordered[concept] = bank[concept].sort((a, b) => {
      const ka = `${a.ref.kurssiKey}|${a.ref.lessonIndex}|${a.ref.phaseId}|${a.ref.itemIndex}`;
      const kb = `${b.ref.kurssiKey}|${b.ref.lessonIndex}|${b.ref.phaseId}|${b.ref.itemIndex}`;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });
  }

  return { bank: ordered, untagged, totalItems, indexedItems, pruned };
}

// ── main ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const report = args.includes("--report") || dry;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const coverage = {};
for (const lang of LANGS) {
  const { bank, untagged, totalItems, indexedItems, pruned } = buildLang(lang);
  const concepts = Object.keys(bank);

  // untagged histogram by lesson title (verify no whole concept is being lost)
  const untaggedByTitle = {};
  for (const u of untagged) {
    const key = `${u.lessonType}: ${u.title}`;
    untaggedByTitle[key] = (untaggedByTitle[key] || 0) + 1;
  }

  coverage[lang] = {
    concepts: concepts.length,
    totalRenderableItems: totalItems,
    indexedItems,
    untagged: untagged.length,
    untaggedByTitle,
    prunedNoiseConcepts: pruned,
    perConcept: Object.fromEntries(concepts.map((c) => [c, bank[c].length])),
    minItemsPerConcept: MIN_ITEMS_PER_CONCEPT,
  };

  if (!dry) {
    // Minified: generated artifact, not hand-edited. _coverage.json is the
    // human-readable summary. Halves the committed + runtime-loaded size.
    const outPath = path.join(OUT_DIR, `${lang}.json`);
    fs.writeFileSync(outPath, JSON.stringify(bank) + "\n", "utf8");
  }

  if (report) {
    console.log(`\n===== ${lang.toUpperCase()} =====`);
    console.log(`  concepts indexed : ${concepts.length}`);
    console.log(`  renderable items : ${totalItems}  (indexed ${indexedItems}, untagged ${untagged.length})`);
    const sorted = concepts.sort((a, b) => bank[b].length - bank[a].length);
    console.log("  coverage (concept: n):");
    for (const c of sorted) {
      console.log(`    ${c.padEnd(24)} ${String(bank[c].length).padStart(4)}`);
    }
    if (Object.keys(pruned).length) {
      console.log(`  pruned noise concepts (<${MIN_ITEMS_PER_CONCEPT} items, false matches): ${JSON.stringify(pruned)}`);
    }
    const topUntagged = Object.entries(untaggedByTitle).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (topUntagged.length) {
      console.log(`  untagged items by lesson (top): ${topUntagged.map(([t, n]) => `${n}× ${t}`).join(" | ")}`);
    }
  }
}

if (!dry) {
  fs.writeFileSync(
    path.join(OUT_DIR, "_coverage.json"),
    JSON.stringify(coverage, null, 2) + "\n",
    "utf8"
  );
  console.log(`\nWrote ${LANGS.map((l) => `${l}.json`).join(", ")} + _coverage.json to data/item-bank/`);
} else {
  console.log("\n(dry run — no files written)");
}
