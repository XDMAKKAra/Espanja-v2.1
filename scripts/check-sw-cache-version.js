#!/usr/bin/env node
// If any file listed in sw.js STATIC_ASSETS changed in this ref vs the base
// branch (origin/main by default), sw.js must also bump CACHE_VERSION.
//
// Runs as a CI check. Locally:
//   node scripts/check-sw-cache-version.js
//   CI_BASE_REF=main node scripts/check-sw-cache-version.js
//
// Exits 0 on pass, 1 on fail. Exits 0 (with a warning) if git isn't usable,
// so local developer machines never block on this check.

import { execSync } from "node:child_process";
import { readFileSync as fsReadFileSync } from "node:fs";

const BASE = process.env.CI_BASE_REF || "origin/main";

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
}

function main() {
  let changed;
  try {
    git("rev-parse --is-inside-work-tree");
    // Files changed vs base
    changed = git(`diff --name-only ${BASE}...HEAD`).split("\n").filter(Boolean);
  } catch (err) {
    console.warn("[check:sw] skipping — git not available or no base ref:", err.message);
    process.exit(0);
  }

  const sw = fsReadFileSync("sw.js", "utf8");
  const listMatch = sw.match(/STATIC_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  if (!listMatch) {
    console.error("[check:sw] could not locate STATIC_ASSETS array in sw.js");
    process.exit(2);
  }
  const assets = Array.from(listMatch[1].matchAll(/["']([^"']+)["']/g)).map(m => m[1].replace(/^\//, ""));

  const assetsChanged = changed.filter(f => assets.includes(f));
  if (assetsChanged.length === 0) {
    console.log("[check:sw] no STATIC_ASSETS changed — OK");
    return;
  }

  // sw.js itself must be in the changed list AND CACHE_VERSION must differ.
  if (!changed.includes("sw.js")) {
    console.error("[check:sw] FAIL — STATIC_ASSETS changed but sw.js was not modified:");
    for (const f of assetsChanged) console.error("  •", f);
    console.error("bump CACHE_VERSION in sw.js so returning users don't get stale JS.");
    process.exit(1);
  }

  const newVer = sw.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/)?.[1];
  let oldVer = "";
  try {
    const oldSw = git(`show ${BASE}:sw.js`);
    oldVer = oldSw.match(/CACHE_VERSION\s*=\s*["']([^"']+)["']/)?.[1] ?? "";
  } catch { /* base doesn't have sw.js — treat as bump */ }

  if (newVer && oldVer && newVer === oldVer) {
    console.error(`[check:sw] FAIL — STATIC_ASSETS changed but CACHE_VERSION stayed "${newVer}".`);
    console.error("Bump it so returning users' service workers drop the stale cache.");
    process.exit(1);
  }

  console.log(`[check:sw] OK — CACHE_VERSION bumped ${oldVer || "(unset)"} → ${newVer}`);
}

main();
