#!/usr/bin/env node
// L-V414 Vaihe 1: tuottaa kompaktit tarkastussheetit Sonnet-subagenteille.
// Vain tarkastettavat kentät riveinä — ei teoria-md:tä, ei mastery-thresholdeja, ei metaa.
// Output: tmp/review/{lang}_kurssi_{n}.txt (24) + tmp/review/{lang}_banks.txt (3)
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "tmp", "review");
fs.mkdirSync(OUT, { recursive: true });
const LANGS = ["es", "fr", "de"];

const clip = (s, n = 600) => {
  if (s == null) return "";
  s = String(s).replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
};
const targetWord = (v) => v.es ?? v.fr ?? v.de ?? "";
const targetEx = (v) => v.example_es ?? v.example_fr ?? v.example_de ?? "";

// ---- lesson item → yksi rivi ----
function lessonItem(ref, it) {
  const t = it.item_type;
  if (t === "mc") {
    const ch = (it.choices || []).map((c, i) => `${c}${i === it.correct_index ? "*" : ""}`).join(" / ");
    return `${ref} mc | ${clip(it.stem, 300)} | ${ch} | exp: ${clip(it.explanation, 300)}`;
  }
  if (t === "match") {
    const pairs = (it.pairs || []).map((p) => `${p.left}=>${p.right}`).join(" ; ");
    return `${ref} match | ${clip(pairs, 600)}`;
  }
  if (t === "typed") {
    return `${ref} typed(${it.direction || "?"}) | ${clip(it.prompt, 300)} | accept: ${(it.accept || []).join(" | ")} | hint: ${clip(it.hint, 120)}`;
  }
  if (t === "gap_fill") {
    const ans = (it.answers || []).map((g, i) => `[g${i + 1}: ${(Array.isArray(g) ? g : [g]).join(",")}]`).join(" ");
    const bank = it.word_bank ? ` | bank: ${(it.word_bank || []).join(", ")}` : "";
    return `${ref} gap | ${clip(it.sentence_template, 300)} | ${ans}${bank}`;
  }
  if (t === "translate") {
    return `${ref} translate(${it.direction || "?"}) | ${clip(it.source, 300)} | accept: ${(it.accept || []).join(" | ")}`;
  }
  if (t === "writing") {
    return `${ref} writing | ${clip(it.prompt, 300)} | words ${it.min_words ?? "?"}-${it.max_words ?? "?"}`;
  }
  return `${ref} ${t || "?"} | ${clip(JSON.stringify(it), 400)}`;
}

// ---- oppituntisheetit per kurssi×kieli ----
function buildLessonSheets() {
  for (const lang of LANGS) {
    const base = path.join("data", "courses", lang);
    for (const kdir of fs.readdirSync(base).filter((d) => d.startsWith("kurssi_"))) {
      const lines = [];
      const lessonFiles = fs
        .readdirSync(path.join(base, kdir))
        .filter((f) => f.endsWith(".json"))
        .sort((a, b) => (JSON.parse(a.match(/\d+/)?.[0] || 0)) - (JSON.parse(b.match(/\d+/)?.[0] || 0)));
      for (const lf of lessonFiles) {
        const l = JSON.parse(fs.readFileSync(path.join(base, kdir, lf), "utf8"));
        const li = l.meta?.lesson_index ?? lf.match(/\d+/)?.[0] ?? "?";
        lines.push(`### ${lf}  (L${li}: ${clip(l.meta?.title, 120)})`);
        for (const ph of l.phases || []) {
          (ph.items || []).forEach((it, i) => {
            lines.push(lessonItem(`L${li}/${ph.phase_id}#${i}`, it));
          });
        }
        (l.vocab || []).forEach((v, i) => {
          lines.push(`L${li}/vocab#${i} | ${targetWord(v)} = ${clip(v.fi, 200)} | ex: ${clip(targetEx(v), 200)} / ${clip(v.example_fi, 200)}`);
        });
      }
      const out = path.join(OUT, `${lang}_${kdir}.txt`);
      fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
      console.log(`${out}  (${lines.length} riviä)`);
    }
  }
}

// ---- pankkisheetit per kieli ----
function readingItems(prefix, arr) {
  const lines = [];
  for (const r of arr) {
    lines.push(`${prefix}/${r.id} reading "${clip(r.title, 100)}" [${r.level || ""}]`);
    lines.push(`  TEXT: ${clip(r.text, 1200)}`);
    for (const q of r.questions || []) {
      const opts = (q.options || []).join(" / ");
      const corr = q.correct ?? q.answer ?? q.correct_index;
      lines.push(`  ${prefix}/${r.id}#q${q.id} ${q.type || "q"} | ${clip(q.question, 250)} | ${opts} | *correct: ${corr} | exp: ${clip(q.explanation, 250)}`);
    }
  }
  return lines;
}

function buildBankSheets() {
  for (const lang of LANGS) {
    const lines = [];

    // reading-bank
    const rbDir = path.join("data", "exam-pools", "reading-bank", lang);
    if (fs.existsSync(rbDir)) {
      for (const f of fs.readdirSync(rbDir).filter((x) => x.endsWith(".json"))) {
        const arr = JSON.parse(fs.readFileSync(path.join(rbDir, f), "utf8"));
        lines.push(`## reading-bank/${lang}/${f}`);
        lines.push(...readingItems(`RB/${f.replace(".json", "")}`, Array.isArray(arr) ? arr : arr.items || []));
      }
    }

    // writing-tasks
    const wtDir = path.join("data", "exam-pools", "writing-tasks", lang);
    if (fs.existsSync(wtDir)) {
      for (const f of fs.readdirSync(wtDir).filter((x) => x.endsWith(".json"))) {
        const arr = JSON.parse(fs.readFileSync(path.join(wtDir, f), "utf8"));
        lines.push(`## writing-tasks/${lang}/${f}`);
        for (const w of Array.isArray(arr) ? arr : []) {
          lines.push(`WT/${f.replace(".json", "")}/${w.id} writing | situation: ${clip(w.situation, 300)} | prompt: ${clip(w.prompt, 300)} | req: ${(w.requirements || []).join(" ; ")}`);
        }
      }
    }

    // diagnostic
    const dgDir = path.join("data", "diagnostic", lang);
    if (fs.existsSync(dgDir)) {
      for (const f of fs.readdirSync(dgDir).filter((x) => x.endsWith(".json"))) {
        const obj = JSON.parse(fs.readFileSync(path.join(dgDir, f), "utf8"));
        lines.push(`## diagnostic/${lang}/${f}`);
        for (const q of obj.questions || []) {
          if (q.options && (q.answer != null || q.correct != null)) {
            const ci = q.answer ?? q.correct;
            const opts = q.options.map((o, i) => `${o}${i === ci ? "*" : ""}`).join(" / ");
            const sent = [q.sentence_prefix, q.sentence_blank || "___", q.sentence_suffix].filter(Boolean).join(" ");
            lines.push(`DG/${f.replace(".json", "")}/${q.id} mc | ${clip(q.question, 200)} | ${clip(sent, 200)} | ${opts}`);
          } else {
            // reading-tyyppinen diagnostic
            lines.push(`DG/${f.replace(".json", "")}/${q.id || "?"} | ${clip(JSON.stringify(q), 500)}`);
          }
        }
      }
    }

    // examPools — kieliriippumaton sisältö on espanjaa → vain es-agentille
    if (lang === "es") {
      const epDir = path.join("data", "examPools");
      if (fs.existsSync(epDir)) {
        for (const f of fs.readdirSync(epDir).filter((x) => x.endsWith(".json"))) {
          const arr = JSON.parse(fs.readFileSync(path.join(epDir, f), "utf8"));
          lines.push(`## examPools/${f}`);
          const name = f.replace(".json", "");
          for (const it of Array.isArray(arr) ? arr : []) {
            if (it.questions) {
              lines.push(...readingItems(`EP/${name}`, [it]));
            } else if (it.sentence || it.options) {
              const opts = (it.options || []).join(" / ");
              lines.push(`EP/${name}/${it.id} ${it.type || "gap"} | ${clip(it.instruction, 120)} ${clip(it.sentence, 200)} | ${opts} | *correct: ${it.correct} | exp: ${clip(it.explanation, 200)}`);
            } else {
              lines.push(`EP/${name}/${it.id || "?"} | ${clip(JSON.stringify(it), 500)}`);
            }
          }
        }
      }
    }

    const out = path.join(OUT, `${lang}_banks.txt`);
    fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
    console.log(`${out}  (${lines.length} riviä)`);
  }
}

buildLessonSheets();
buildBankSheets();
console.log("Valmis.");
