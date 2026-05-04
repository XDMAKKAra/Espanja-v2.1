#!/usr/bin/env node
// Verify (or auto-fix) sw.js CACHE_VERSION whenever a STATIC_ASSETS file changed.
//
// Modes:
//   default                — verify only; exit 1 on stale CACHE_VERSION
//   --fix                  — bump CACHE_VERSION in place if stale, then exit 0
//
// Diff base resolution (in priority order):
//   1. $CI_BASE_REF (set by CI for PRs: "origin/main" etc)
//   2. GITHUB_EVENT_NAME=push                → "HEAD~1"  (compare vs prev commit)
//   3. fallback                              → "origin/main"
//
// Locally: exits 0 (with a warning) if git isn't usable, so dev machines never block.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const FIX = process.argv.includes("--fix");

let BASE = process.env.CI_BASE_REF;
if (!BASE) {
  BASE = process.env.GITHUB_EVENT_NAME === "push" ? "HEAD~1" : "origin/main";
}

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
}

function bumpVersion(ver) {
  const m = ver.match(/^(.*?)(\d+)$/);
  if (!m) throw new Error(`cannot bump non-numeric CACHE_VERSION "${ver}"`);
  return `${m[1]}${Number(m[2]) + 1}`;
}

function main() {
  let changed;
  try {
    git("rev-parse --is-inside-work-tree");
    changed = git(`diff --name-only ${BASE}...HEAD`).split("\n").filter(Boolean);
  } catch (err) {
    console.warn("[check:sw] skipping — git not available or no base ref:", err.message);
    process.exit(0);
  }

  const swPath = "sw.js";
  const sw = readFileSync(swPath, "utf8");
  const listMatch = sw.match(/STATIC_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  if (!listMatch) {
    console.error("[check:sw] could not locate STATIC_ASSETS array in sw.js");
    process.exit(2);
  }
  const assets = Array.from(listMatch[1].matchAll(/["']([^"']+)["']/g)).map(m => m[1].replace(/^\//, ""));

  const assetsChanged = changed.filter(f => assets.includes(f));
  if (assetsChanged.length === 0) {
    console.log(`[check:sw] no STATIC_ASSETS changed vs ${BASE} — OK`);
    return;
  }

  const newVer = sw.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/)?.[1];
  let oldVer = "";
  try {
    const oldSw = git(`show ${BASE}:sw.js`);
    oldVer = oldSw.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/)?.[1] ?? "";
  } catch { /* base doesn't have sw.js — treat as bump */ }

  const stale = newVer && oldVer && newVer === oldVer;
  const swMissing = !changed.includes("sw.js");

  if (!stale && !swMissing) {
    console.log(`[check:sw] OK — CACHE_VERSION bumped ${oldVer || "(unset)"} → ${newVer}`);
    return;
  }

  if (FIX) {
    const bumped = bumpVersion(newVer);
    const next = sw.replace(
      /CACHE_VERSION\s*=\s*["'][^"']+["']/,
      `CACHE_VERSION = "${bumped}"`,
    );
    writeFileSync(swPath, next);
    console.log(`[check:sw] FIXED — bumped CACHE_VERSION ${newVer} → ${bumped} (${assetsChanged.length} assets changed)`);
    return;
  }

  if (swMissing) {
    console.error("[check:sw] FAIL — STATIC_ASSETS changed but sw.js was not modified:");
    for (const f of assetsChanged) console.error("  •", f);
    console.error("Run `npm run bump:sw` (or edit sw.js) so returning users don't get stale JS.");
    process.exit(1);
  }

  console.error(`[check:sw] FAIL — STATIC_ASSETS changed but CACHE_VERSION stayed "${newVer}".`);
  console.error("Run `npm run bump:sw` so returning users' service workers drop the stale cache.");
  process.exit(1);
}

main();
