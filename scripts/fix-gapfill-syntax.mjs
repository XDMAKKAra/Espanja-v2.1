// L-V414 Vaihe 0 — gap_fill `___` → `{N}` konversio (tekstipohjainen, minimi-diff).
// Frontti (digikirja.js:707, lessonRunner.js:551) parsii VAIN `{N}`-aukkoja.
// `___`-templatet renderöityvät ilman input-kenttiä → 925 gap_fill rikki
// tuotannossa (lähes kaikki saksaa). Korjaa kaksi turvallista konetapausta:
//   caseA: runs == answers.length → korvaa kukin `___` peräkkäin `{1}`,`{2}`,…
//   caseB: 2 ajoa, answers == [[a,b]] (saksan Perfekt) → answers [[a],[b]] + {1}{2}
// Epäselvät (3+ aukkoa, monisanaiset/refleksiivivastaukset) jätetään koskematta
// → validaattori jättää ne P0:ksi = manuaalijono Vaihe 1:lle.
//
// Tekstipohjainen: tiedostojen muotoilu vaihtelee (yksi-item-rivi vs multi-line),
// joten EI JSON.parse+reserialize (reformatoisi koko tiedoston). Korvataan vain
// kunkin itemin template-literaali ja caseB:n answers-solu paikallaan.
import fs from "node:fs";
import path from "node:path";

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let caseA = 0, caseB = 0, skipped = 0, filesChanged = 0;

function classify(it) {
  const t = String(it.sentence_template || "");
  if (/\{\d+\}/.test(t)) return null;
  const runs = t.match(/_+/g) || [];
  const a = Array.isArray(it.answers) ? it.answers : [];
  if (runs.length > 0 && runs.length === a.length && a.every((c) => Array.isArray(c) && c.length)) {
    let i = 0;
    return { kind: "A", origTpl: t, newTpl: t.replace(/_+/g, () => `{${++i}}`) };
  }
  if (runs.length === 2 && a.length === 1 && Array.isArray(a[0]) && a[0].length === 2) {
    let i = 0;
    return { kind: "B", origTpl: t, newTpl: t.replace(/_+/g, () => `{${++i}}`), A: a[0][0], B: a[0][1] };
  }
  if (runs.length > 0) return { kind: "weird" };
  return null;
}

for (const lang of ["es", "fr", "de"]) {
  const root = `data/courses/${lang}`;
  for (const k of fs.readdirSync(root).filter((d) => d.startsWith("kurssi_"))) {
    for (const f of fs.readdirSync(path.join(root, k)).filter((x) => x.endsWith(".json"))) {
      const fp = path.join(root, k, f);
      let text = fs.readFileSync(fp, "utf8");
      const l = JSON.parse(text);
      const edits = [];
      for (const p of l.phases || []) for (const it of p.items || []) {
        if (it.item_type !== "gap_fill") continue;
        const c = classify(it);
        if (!c) continue;
        if (c.kind === "weird") { skipped++; continue; }
        edits.push(c);
      }
      if (!edits.length) continue;
      let changed = false;
      for (const e of edits) {
        const needleT = JSON.stringify(e.origTpl);
        const replT = JSON.stringify(e.newTpl);
        if (text.includes(needleT)) {
          text = text.replace(needleT, replT); // template-lauseet uniikkeja → 1. osuma riittää
          changed = true;
          if (e.kind === "A") caseA++;
        }
        if (e.kind === "B") {
          // answers-solu juuri muunnetun templaten JÄLKEEN: [["A", "B"]] → [["A"], ["B"]]
          const tIdx = text.indexOf(replT);
          const ansRe = new RegExp(`\\[\\[\\s*${reEsc(JSON.stringify(e.A))}\\s*,\\s*${reEsc(JSON.stringify(e.B))}\\s*\\]\\]`);
          const sub = text.slice(tIdx);
          if (ansRe.test(sub)) {
            text = text.slice(0, tIdx) + sub.replace(ansRe, `[[${JSON.stringify(e.A)}], [${JSON.stringify(e.B)}]]`);
            caseB++;
            changed = true;
          } else {
            console.warn(`  ! caseB answers ei löytynyt: ${lang}/${k}/${f} "${e.A}/${e.B}"`);
          }
        }
      }
      if (changed) { fs.writeFileSync(fp, text); filesChanged++; }
    }
  }
}

console.log(`caseA (___→{N}): ${caseA}`);
console.log(`caseB (Perfekt split): ${caseB}`);
console.log(`skipped (weird, jää manuaaliin): ${skipped}`);
console.log(`tiedostoja muutettu: ${filesChanged}`);
