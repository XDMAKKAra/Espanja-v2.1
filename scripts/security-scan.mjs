#!/usr/bin/env node
// Fails (exit 1) if hardcoded secrets are detected in any tracked file.
// Pattern set kept narrow so legitimate test fixtures + placeholders in
// .env.example don't trip it. Run via `npm run security:scan`.

import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const PATTERNS = [
  { name: "Stripe live secret", re: /sk_live_[A-Za-z0-9]{16,}/ },
  { name: "Stripe webhook secret", re: /whsec_[A-Za-z0-9]{16,}/ },
  { name: "OpenAI key", re: /sk-(?:proj-)?[A-Za-z0-9]{32,}/ },
  { name: "Resend key", re: /re_[A-Za-z0-9]{20,}/ },
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Supabase service role JWT", re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
];

// Files to skip even though they're tracked: lockfiles, binary assets,
// the prompt + scan script itself (they list these patterns as strings
// for documentation), and IMPROVEMENTS / AGENT_STATE which may quote
// historical findings.
const SKIP_FILE = (path) =>
  /(^|\/)(package-lock\.json|node_modules\/|\.git\/)/.test(path) ||
  /\.(png|jpg|jpeg|svg|gif|webp|ico|pdf|zip|woff2?)$/i.test(path) ||
  /^references\//.test(path) ||
  /^scripts\/security-scan\.mjs$/.test(path) ||
  /^AGENT_PROMPT_SECURITY1\.md$/.test(path);

function listTrackedFiles() {
  return execSync("git ls-files", { encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fileBytes(path) {
  try { return statSync(path).size; } catch { return 0; }
}

const files = listTrackedFiles().filter((f) => !SKIP_FILE(f));
const findings = [];

for (const f of files) {
  if (fileBytes(f) > 2 * 1024 * 1024) continue; // skip files > 2 MB
  let content;
  try { content = readFileSync(f, "utf8"); }
  catch { continue; } // unreadable / binary
  for (const { name, re } of PATTERNS) {
    const m = content.match(re);
    if (!m) continue;
    findings.push(`${f}: ${name} → ${m[0].slice(0, 14)}…`);
  }
}

if (findings.length) {
  console.error("❌ Hardcoded secrets detected:");
  for (const x of findings) console.error("  " + x);
  console.error("\nMove these values to environment variables and rotate the");
  console.error("originals via the provider dashboard.");
  process.exit(1);
}

console.log("✓ No hardcoded secrets detected.");
