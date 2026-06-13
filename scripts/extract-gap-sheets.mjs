#!/usr/bin/env node
// L-V414 aukkojen sulku: reading-bankin KAIKKI kysymykset (ml. true_false statement +
// short_answer), TÄYDET lukutekstit (ei clippiä), examPools reading (es), + pikkupankit
// diagnose_questions.json & quick-reviews.json (es). Output: tmp/review/gap_{lang}.txt
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "tmp", "review");
fs.mkdirSync(OUT, { recursive: true });
const LANGS = ["es", "fr", "de"];
const oneline = (s) => (s == null ? "" : String(s).replace(/\s+/g, " ").trim());

function readingQ(prefix, arr) {
  const lines = [];
  for (const r of arr) {
    lines.push(`\n${prefix}/${r.id} reading "${oneline(r.title)}" [${r.level || ""}]`);
    lines.push(`  TEXT: ${oneline(r.text)}`); // EI clippiä
    for (const q of r.questions || []) {
      const t = q.type;
      if (t === "true_false") {
        lines.push(`  ${prefix}/${r.id}#q${q.id} true_false | väite: ${oneline(q.statement)} | *oikea: ${q.correct} | justification: ${oneline(q.justification)} | exp: ${oneline(q.explanation)}`);
      } else if (t === "short_answer") {
        lines.push(`  ${prefix}/${r.id}#q${q.id} short_answer | ${oneline(q.question)} | malli: ${oneline(q.model_answer || q.answer || q.sample_answer)} | exp: ${oneline(q.explanation)}`);
      } else {
        const opts = (q.options || []).join(" / ");
        lines.push(`  ${prefix}/${r.id}#q${q.id} ${t || "mc"} | ${oneline(q.question)} | ${opts} | *oikea: ${q.correct ?? q.answer ?? q.correct_index} | exp: ${oneline(q.explanation)}`);
      }
    }
  }
  return lines;
}

for (const lang of LANGS) {
  const lines = [];

  const rbDir = path.join("data", "exam-pools", "reading-bank", lang);
  if (fs.existsSync(rbDir)) {
    for (const f of fs.readdirSync(rbDir).filter((x) => x.endsWith(".json"))) {
      const arr = JSON.parse(fs.readFileSync(path.join(rbDir, f), "utf8"));
      lines.push(`## reading-bank/${lang}/${f}`);
      lines.push(...readingQ(`RB/${f.replace(".json", "")}`, Array.isArray(arr) ? arr : arr.items || []));
    }
  }

  // examPools reading: kieliriippumaton sisältö espanjaa → es-sheettiin
  if (lang === "es") {
    const epReading = path.join("data", "examPools", "reading.json");
    if (fs.existsSync(epReading)) {
      const arr = JSON.parse(fs.readFileSync(epReading, "utf8"));
      lines.push(`## examPools/reading.json`);
      lines.push(...readingQ("EP/reading", Array.isArray(arr) ? arr : []));
    }
    // diagnose_questions.json (landing-minidiagnostiikka, es)
    const dq = path.join("data", "diagnose_questions.json");
    if (fs.existsSync(dq)) {
      const arr = JSON.parse(fs.readFileSync(dq, "utf8"));
      lines.push(`\n## diagnose_questions.json`);
      for (const q of Array.isArray(arr) ? arr : []) {
        const ci = q.correct ?? q.answer;
        const opts = (q.options || []).map((o, i) => `${o}${i === ci ? "*" : ""}`).join(" / ");
        lines.push(`DQ/${q.id} ${q.type || "mc"} | ${oneline(q.question)} | ${opts} | exp: ${oneline(q.explanation)}`);
      }
    }
    // quick-reviews.json (kertaus, es)
    const qr = path.join("data", "quick-reviews.json");
    if (fs.existsSync(qr)) {
      const obj = JSON.parse(fs.readFileSync(qr, "utf8"));
      lines.push(`\n## quick-reviews.json`);
      for (const [key, r] of Object.entries(obj)) {
        lines.push(`QR/${key} "${oneline(r.title)}"`);
        lines.push(`  rule: ${oneline(r.rule)}`);
        (r.examples || []).forEach((e, i) => lines.push(`  ex${i}: ${oneline(e.es)} = ${oneline(e.fi)}`));
        if (r.common_mistake) lines.push(`  mistake: VÄÄRIN '${oneline(r.common_mistake.wrong)}' OIKEIN '${oneline(r.common_mistake.right)}' note: ${oneline(r.common_mistake.note)}`);
      }
    }
  }

  const out = path.join(OUT, `gap_${lang}.txt`);
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
  console.log(`${out}  (${lines.length} riviä)`);
}
console.log("Valmis.");
