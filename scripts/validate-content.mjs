// L-V414 — Taso 1: koneellinen sisältövalidaattori (0 LLM-tokenia).
// Tarkistaa kaikki elävät tehtäväpankit rakenteellisesti:
//   data/courses/{es,fr,de}/kurssi_N/lesson_N.json  (270 oppituntia; item-bank
//   on pelkkiä ref-viittauksia näihin, joten se kattautuu samalla)
//   data/examPools/*.json                            (koesimulaatio)
//   data/exam-pools/reading-bank/{lang}/*.json       (luetun moodi)
//   data/exam-pools/writing-tasks/{lang}/*.json      (kirjoitus moodi)
//   data/diagnostic/{lang}/part_*.json               (kartoitus)
// Output: docs/audits/l-v414-validator-findings.json + konsoli-summary.
import fs from "node:fs";
import path from "node:path";

const findings = [];
const stats = { files: 0, items: 0 };
const add = (sev, file, ref, msg) => findings.push({ sev, file, ref, msg });

const MOJIBAKE = /Ã[¤¶©¡­³ºÃ]|â€|Â·|�/;
// HUOM: TODO/FIXME case-SENSITIVE — espanjan "todo" ei saa osua.
const PLACEHOLDER = /\b(TODO|FIXME)\b|lorem ipsum|\bplaceholder\b|tähän tulee/;
const EMDASH = /—/;

function checkText(file, ref, field, s, { allowEmdash = false } = {}) {
  if (typeof s !== "string") return;
  if (MOJIBAKE.test(s)) add("P0", file, ref, `${field}: mojibake/rikkinäinen merkistö: "${s.slice(0, 60)}"`);
  if (PLACEHOLDER.test(s)) add("P0", file, ref, `${field}: placeholder-teksti: "${s.slice(0, 60)}"`);
  if (!allowEmdash && EMDASH.test(s)) add("P2", file, ref, `${field}: em-dash (—) tekstissä`);
}

function normalize(s) { return String(s).trim().toLowerCase(); }

function checkMcLike(file, ref, it, { stemKey = "stem", choicesKey = "choices", correctKey = "correct_index" }) {
  const stem = it[stemKey];
  const choices = it[choicesKey];
  const ci = it[correctKey];
  if (!stem || !String(stem).trim()) add("P0", file, ref, "mc: tyhjä stem");
  if (!Array.isArray(choices) || choices.length < 2) { add("P0", file, ref, "mc: alle 2 vaihtoehtoa"); return; }
  if (typeof ci !== "number" || ci < 0 || ci >= choices.length) add("P0", file, ref, `mc: correct_index ${ci} ei osu vaihtoehtoihin (${choices.length})`);
  // Case-SENSITIIVINEN: kielitehtävissä iso/pieni kirjain on laillinen distraktori-
  // ulottuvuus (ranskan kansallisuudet pienellä, saksan muodollinen Sie vs sie).
  // Vain täysi merkkijonoduplikaatti on defekti.
  const exact = choices.map((c) => String(c).trim());
  const dupes = exact.filter((c, i) => exact.indexOf(c) !== i);
  if (dupes.length) add("P0", file, ref, `mc: duplikaattivaihtoehdot: ${[...new Set(dupes)].join(", ")}`);
  choices.forEach((c, i) => { if (!String(c).trim()) add("P0", file, ref, `mc: tyhjä vaihtoehto #${i}`); checkText(file, ref, `choice#${i}`, c); });
  checkText(file, ref, "stem", stem);
}

// ── Lessons ──────────────────────────────────────────────────────────
function checkLesson(file) {
  const l = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!l.meta?.title) add("P1", file, "meta", "title puuttuu");
  const seenStems = new Map();
  for (const p of l.phases || []) {
    const pref = p.phase_id || p.title || "?";
    if (!Array.isArray(p.items) || p.items.length === 0) {
      if (p.phase_type !== "flashcards") add("P1", file, pref, `phase ilman itemejä (type=${p.phase_type})`);
    }
    (p.items || []).forEach((it, idx) => {
      stats.items++;
      const ref = `${pref}#${idx}`;
      switch (it.item_type) {
        case "mc": {
          checkMcLike(file, ref, it, {});
          if (!it.explanation || !String(it.explanation).trim()) add("P2", file, ref, "mc: explanation puuttuu");
          else checkText(file, ref, "explanation", it.explanation);
          const key = normalize(it.stem || "");
          if (key) {
            if (seenStems.has(key) && seenStems.get(key) !== pref) add("P2", file, ref, `sama stem kahdessa phasessa ("${it.stem}")`);
            seenStems.set(key, pref);
          }
          break;
        }
        case "match": {
          const pairs = it.pairs || [];
          if (pairs.length < 2) add("P0", file, ref, "match: alle 2 paria");
          const lefts = pairs.map((x) => normalize(x.left));
          const rights = pairs.map((x) => normalize(x.right));
          if (new Set(lefts).size !== lefts.length) add("P0", file, ref, "match: duplikaatti left-puoli");
          if (new Set(rights).size !== rights.length) add("P1", file, ref, "match: duplikaatti right-puoli (monitulkintainen)");
          pairs.forEach((x, i) => {
            if (!String(x.left || "").trim() || !String(x.right || "").trim()) add("P0", file, ref, `match: tyhjä puoli parissa #${i}`);
            checkText(file, ref, `pair#${i}`, `${x.left} ${x.right}`);
          });
          break;
        }
        case "typed": {
          if (!String(it.prompt || "").trim()) add("P0", file, ref, "typed: tyhjä prompt");
          if (!Array.isArray(it.accept) || !it.accept.length || it.accept.some((a) => !String(a).trim())) add("P0", file, ref, "typed: accept puuttuu/tyhjä");
          checkText(file, ref, "prompt", it.prompt);
          break;
        }
        case "gap_fill": {
          const tpl = String(it.sentence_template || "");
          // Sama {1} voi toistua templatessa — lasketaan UNIIKIT aukkonumerot.
          const slots = [...new Set([...tpl.matchAll(/\{(\d+)\}/g)].map((m) => +m[1]))];
          if (!slots.length) add("P0", file, ref, "gap_fill: templatessa ei {N}-aukkoja");
          if (!Array.isArray(it.answers) || it.answers.length !== slots.length) add("P0", file, ref, `gap_fill: answers (${it.answers?.length}) ≠ aukot (${slots.length})`);
          (it.answers || []).forEach((alts, i) => {
            if (!Array.isArray(alts) || !alts.length || alts.some((a) => !String(a).trim())) add("P0", file, ref, `gap_fill: answers[${i}] tyhjä`);
          });
          if (Array.isArray(it.word_bank) && it.word_bank.length) {
            const bank = it.word_bank.map(normalize);
            (it.answers || []).forEach((alts, i) => {
              if (!Array.isArray(alts) || !alts.length) return;
              // sentence-build ("järjestä sanat"): yksi {1}-aukko, vastaus monisanainen
              // koko lause, word_bank = sen sanapalaset → bank ei voi "sisältää" vastausta.
              if (alts.some((a) => /\s/.test(String(a).trim()))) return;
              if (!alts.some((a) => bank.includes(normalize(a)))) {
                add("P0", file, ref, `gap_fill: word_bank ei sisällä yhtään hyväksyttyä vastausta aukolle ${i + 1} (${alts[0]})`);
              }
            });
          }
          checkText(file, ref, "template", tpl);
          break;
        }
        case "translate": {
          if (!String(it.source || "").trim()) add("P0", file, ref, "translate: tyhjä source");
          if (!Array.isArray(it.accept) || !it.accept.length || it.accept.some((a) => !String(a).trim())) add("P0", file, ref, "translate: accept puuttuu/tyhjä");
          checkText(file, ref, "source", it.source);
          break;
        }
        case "writing": {
          if (!String(it.prompt || "").trim()) add("P0", file, ref, "writing: tyhjä prompt");
          if (it.min_words != null && it.max_words != null && it.min_words >= it.max_words) add("P0", file, ref, `writing: min_words ${it.min_words} >= max_words ${it.max_words}`);
          checkText(file, ref, "prompt", it.prompt);
          break;
        }
        case "reading_mc": {
          // saksan oppituntien luetunymmärrys: passage + questions[{question_fi,choices,correct_index}]
          if (!String(it.passage || "").trim()) add("P0", file, ref, "reading_mc: tyhjä passage");
          (it.questions || []).forEach((q, qi) => {
            checkMcLike(file, `${ref}/q${qi}`, { stem: q.question_fi || q.question, choices: q.choices, correct_index: q.correct_index }, {});
          });
          break;
        }
        default:
          add("P1", file, ref, `tuntematon item_type: ${it.item_type}`);
      }
    });
  }
  (l.vocab || []).forEach((v, i) => {
    const langKey = ["es", "fr", "de"].find((k) => k in v);
    if (!langKey || !String(v[langKey] || "").trim() || !String(v.fi || "").trim()) add("P0", file, `vocab#${i}`, "vocab: kieli- tai fi-puoli tyhjä");
    checkText(file, `vocab#${i}`, "vocab", `${v[langKey] || ""} ${v.fi || ""} ${v.example_fi || ""}`);
  });
}

// ── Reading banks (mode + exam) ──────────────────────────────────────
function checkReadingEntry(file, entry, ref) {
  if (!String(entry.text || "").trim()) add("P0", file, ref, "reading: tyhjä teksti");
  checkText(file, ref, "text", entry.text, { allowEmdash: true });
  (entry.questions || []).forEach((q, i) => {
    stats.items++;
    const qref = `${ref}/q${i}`;
    // reading-pankeissa kolme kysymystyyppiä: multiple_choice (options + letter/index
    // correct), true_false (statement + boolean correct + justification), short_answer
    // (acceptedAnswers[]). examPools/reading käyttää "A"-kirjaimia, lesson-banket indeksiä.
    if (q.options || q.choices) {
      const choices = q.options || q.choices;
      const correctRaw = q.correct ?? q.correct_index ?? q.answer;
      if (!Array.isArray(choices) || choices.length < 2) { add("P0", file, qref, "reading-q: alle 2 vaihtoehtoa"); return; }
      let ok = false;
      if (typeof correctRaw === "number") ok = correctRaw >= 0 && correctRaw < choices.length;
      else if (typeof correctRaw === "string") ok = /^[A-D]$/i.test(correctRaw.trim()) ? correctRaw.toUpperCase().charCodeAt(0) - 65 < choices.length : choices.map(normalize).includes(normalize(correctRaw));
      if (!ok) add("P0", file, qref, `reading-q: correct (${JSON.stringify(correctRaw)}) ei osu vaihtoehtoihin`);
      const norm = choices.map(normalize);
      if (new Set(norm).size !== norm.length) add("P0", file, qref, "reading-q: duplikaattivaihtoehdot");
    } else if (q.type === "true_false" || typeof q.statement === "string") {
      if (!String(q.statement || "").trim()) add("P0", file, qref, "reading-q: tyhjä statement (true_false)");
      const c = q.correct;
      if (typeof c !== "boolean" && !/^(true|false|tosi|epätosi)$/i.test(String(c))) add("P0", file, qref, `reading-q: true_false correct ei boolean (${JSON.stringify(c)})`);
    } else if (q.accept || q.acceptedAnswers || q.expected_answer || q.answer) {
      const acc = q.accept || q.acceptedAnswers || [q.expected_answer ?? q.answer];
      if (!acc.length || acc.some((a) => !String(a).trim())) add("P0", file, qref, "reading-q: avoin vastaus tyhjä");
    } else {
      add("P1", file, qref, `reading-q: ei tunnistettua vastausmuotoa (kentät: ${Object.keys(q).join(",")})`);
    }
    checkText(file, qref, "question", q.question || q.q || q.statement || "");
  });
}

// ── Walk everything ──────────────────────────────────────────────────
for (const lang of ["es", "fr", "de"]) {
  const root = `data/courses/${lang}`;
  for (const kurssi of fs.readdirSync(root).filter((d) => d.startsWith("kurssi_"))) {
    for (const f of fs.readdirSync(path.join(root, kurssi)).filter((x) => x.endsWith(".json"))) {
      stats.files++;
      try { checkLesson(path.join(root, kurssi, f)); }
      catch (e) { add("P0", path.join(root, kurssi, f), "-", `JSON ei parsiudu: ${e.message}`); }
    }
  }
}

for (const lang of ["es", "fr", "de"]) {
  const dir = `data/exam-pools/reading-bank/${lang}`;
  for (const f of fs.readdirSync(dir)) {
    stats.files++;
    const file = path.join(dir, f);
    try {
      const d = JSON.parse(fs.readFileSync(file, "utf8"));
      const list = Array.isArray(d) ? d : d.texts || d.entries || [];
      list.forEach((e, i) => checkReadingEntry(file, e, e.id || `#${i}`));
    } catch (e) { add("P0", file, "-", `JSON ei parsiudu: ${e.message}`); }
  }
  const wdir = `data/exam-pools/writing-tasks/${lang}`;
  for (const f of fs.readdirSync(wdir)) {
    stats.files++;
    const file = path.join(wdir, f);
    const d = JSON.parse(fs.readFileSync(file, "utf8"));
    const list = Array.isArray(d) ? d : d.tasks || [];
    list.forEach((t, i) => {
      stats.items++;
      if (!String(t.prompt || t.situation || "").trim()) add("P0", file, t.id || `#${i}`, "writing-task: tyhjä prompt/situation");
      if (t.charMin != null && t.charMax != null && t.charMin >= t.charMax) add("P0", file, t.id || `#${i}`, "writing-task: charMin >= charMax");
      checkText(file, t.id || `#${i}`, "task", `${t.situation || ""} ${t.prompt || ""} ${(t.requirements || []).join(" ")}`);
    });
  }
}

for (const f of fs.readdirSync("data/examPools")) {
  stats.files++;
  const file = `data/examPools/${f}`;
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  if (f === "reading.json") d.forEach((e) => checkReadingEntry(file, e, e.id || "?"));
  else if (f === "structure.json") d.forEach((q, i) => {
    stats.items++;
    const ref = q.id || `#${i}`;
    // structure.json: correct on kirjain "A"–"D", optiot "A) ..." -etuliitteellä.
    const ci = typeof q.correct === "number" ? q.correct
      : (typeof q.correct === "string" && /^[A-D]$/i.test(q.correct.trim()) ? q.correct.trim().toUpperCase().charCodeAt(0) - 65 : "?");
    if (q.options) checkMcLike(file, ref, { stem: q.sentence || q.instruction, choices: q.options.map((o) => String(o)), correct_index: ci }, {});
    if (typeof q.correct === "string" && q.options) {
      const letter = q.correct.trim().toUpperCase();
      const idx = letter.charCodeAt(0) - 65;
      const found = q.options.some((o) => String(o).trim().toUpperCase().startsWith(letter + ")")) || (idx >= 0 && idx < q.options.length);
      if (!found) add("P0", file, ref, `structure: correct "${q.correct}" ei mätsää optioihin`);
    }
  });
  else d.forEach((t, i) => {
    stats.items++;
    if (!String(t.prompt || "").trim()) add("P0", file, t.id || `#${i}`, "exam-writing: tyhjä prompt");
    checkText(file, t.id || `#${i}`, "task", `${t.situation || ""} ${t.prompt || ""}`);
  });
}

for (const lang of ["es", "fr", "de"]) {
  for (const f of fs.readdirSync(`data/diagnostic/${lang}`)) {
    stats.files++;
    const file = `data/diagnostic/${lang}/${f}`;
    const d = JSON.parse(fs.readFileSync(file, "utf8"));
    (d.questions || []).forEach((q, i) => {
      stats.items++;
      const ref = q.id || `#${i}`;
      if (Array.isArray(q.options)) {
        const correctRaw = q.correct ?? q.correct_index ?? q.answer;
        let ok = typeof correctRaw === "number" ? correctRaw >= 0 && correctRaw < q.options.length : q.options.map(normalize).includes(normalize(String(correctRaw)));
        if (!ok) add("P0", file, ref, `diagnostic: correct ${JSON.stringify(correctRaw)} ei osu optioihin`);
        const norm = q.options.map(normalize);
        if (new Set(norm).size !== norm.length) add("P0", file, ref, "diagnostic: duplikaattioptiot");
      }
      checkText(file, ref, "question", `${q.question || q.stem || ""} ${(q.options || []).join(" ")}`);
    });
  }
}

// ── Report ───────────────────────────────────────────────────────────
const bySev = { P0: 0, P1: 0, P2: 0 };
findings.forEach((f) => bySev[f.sev]++);
console.log(`Tarkistettu: ${stats.files} tiedostoa, ${stats.items} tehtävää/itemiä`);
console.log(`Löydökset: P0=${bySev.P0} P1=${bySev.P1} P2=${bySev.P2}`);
fs.writeFileSync("docs/audits/l-v414-validator-findings.json", JSON.stringify(findings, null, 1));
console.log("→ docs/audits/l-v414-validator-findings.json");
for (const f of findings.filter((x) => x.sev === "P0").slice(0, 30)) console.log(`P0 ${f.file} ${f.ref}: ${f.msg}`);
