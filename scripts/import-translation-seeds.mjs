#!/usr/bin/env node
// One-shot import of reviewed translation seeds into Supabase.
//
// Reads data/translations/{es,fr,de}/reviewed.json, deduplicates accepted
// translations within each task, and bulk-inserts into translation_tasks +
// translation_accepted via the service-role client (bypasses RLS).
//
// Usage:
//   node scripts/import-translation-seeds.mjs [--dry-run] [--lang=es|fr|de|all]

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const LANG_ARG = (args.find((a) => a.startsWith("--lang=")) || "--lang=all").slice(7);
const LANGS = LANG_ARG === "all" ? ["es", "fr", "de"] : [LANG_ARG];

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var.");
  process.exit(1);
}
const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ALL_LESSONS_CONTEXT = await loadCurriculumContext();

async function loadCurriculumContext() {
  // Pulled inline to avoid pulling lib/openai.js worth of imports just to
  // resolve kurssi metadata. The script only needs grammar_focus + vocab_theme
  // per kurssi key, and those live in lib/curriculumData.js.
  const mod = await import("../lib/curriculumData.js");
  const out = {};
  for (const [lang, list] of Object.entries(mod.LANG_CURRICULA)) {
    out[lang] = {};
    for (const k of list) {
      out[lang][k.key] = {
        grammar_focus: (k.grammar_focus || [])[0] || "",
        vocab_theme:   k.vocab_theme || "",
        difficulty:    k.level || "A",
      };
    }
  }
  return out;
}

async function loadReviewed(lang) {
  const reviewed = path.join(ROOT, "data", "translations", lang, "reviewed.json");
  const worker   = path.join(ROOT, "data", "translations", lang, "worker.json");
  for (const p of [reviewed, worker]) {
    try {
      const raw = await fs.readFile(p, "utf8");
      return { tasks: JSON.parse(raw).tasks || [], source: path.basename(p) };
    } catch { /* try next */ }
  }
  return { tasks: [], source: null };
}

let totalTasks = 0, totalAccepted = 0;

for (const lang of LANGS) {
  const { tasks, source } = await loadReviewed(lang);
  if (!tasks.length) {
    console.warn(`[${lang}] no tasks loaded — skipping`);
    continue;
  }
  console.log(`[${lang}] loaded ${tasks.length} tasks from ${source}`);

  // Build task rows.
  const taskRows = tasks.map((t) => {
    const ctx = ALL_LESSONS_CONTEXT[lang]?.[t.kurssi] || {};
    return {
      id:            t.id,
      kurssi_key:    t.kurssi,
      lang,
      prompt_fi:     t.prompt_fi,
      grammar_focus: ctx.grammar_focus || null,
      vocab_theme:   ctx.vocab_theme || null,
      difficulty:    ctx.difficulty || "A",
      source:        "seed",
    };
  });

  // Build accepted rows, deduping within each task.
  const acceptedRows = [];
  for (const t of tasks) {
    const seen = new Set();
    for (const ans of t.accepted_translations || []) {
      const norm = String(ans || "").trim().toLowerCase().replace(/\s+/g, " ");
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      acceptedRows.push({
        task_id:         t.id,
        accepted_answer: String(ans).trim(),
        source:          "seed",
        user_id:         null,
      });
    }
  }

  totalTasks    += taskRows.length;
  totalAccepted += acceptedRows.length;
  console.log(`[${lang}] task rows: ${taskRows.length}, accepted rows: ${acceptedRows.length}`);

  if (DRY_RUN) continue;

  // Upsert tasks first (referenced by accepted_translations FK).
  const { error: tErr } = await supa
    .from("translation_tasks")
    .upsert(taskRows, { onConflict: "id" });
  if (tErr) {
    console.error(`[${lang}] translation_tasks upsert error:`, tErr.message);
    process.exit(1);
  }

  // Insert accepted in batches of 500. Conflicts (task_id, normalized) are
  // expected if the script runs twice; ignore them.
  for (let i = 0; i < acceptedRows.length; i += 500) {
    const batch = acceptedRows.slice(i, i + 500);
    const { error: aErr } = await supa
      .from("translation_accepted")
      .upsert(batch, { onConflict: "task_id,normalized", ignoreDuplicates: true });
    if (aErr) {
      console.warn(`[${lang}] accepted batch ${i}-${i + batch.length} warning:`, aErr.message);
    }
  }
  console.log(`[${lang}] done`);
}

console.log(`\nSummary: ${totalTasks} tasks, ${totalAccepted} accepted translations across ${LANGS.join(", ")}`);
if (DRY_RUN) console.log("(dry-run — no inserts)");
