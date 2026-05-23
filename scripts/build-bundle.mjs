// L-LIVE-AUDIT-P2 UPDATE 1+2 — bundle CSS + JS into single artifacts.
// Replaces 16 CSS <link> tags + 1 JS module entry (which transitively pulls 28 files)
// with /app.bundle.css + /app.bundle.js served from repo root.
import { build } from "esbuild";
import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

// L-V290-CLEANUP — esbuild splitting emits content-hashed chunk filenames
// under /chunks/. Without a sweep between runs, old hashed chunks linger
// in the repo and accumulate (the v294 cleanup found 424 orphans out of
// 479 tracked). Sweep chunks/ before each splitting build so the working
// tree only ever holds files the current entry-graph actually imports.
try {
  for (const f of readdirSync("chunks")) {
    if (f.endsWith(".js") || f.endsWith(".js.map")) {
      rmSync(join("chunks", f), { force: true });
    }
  }
} catch (e) {
  if (e?.code !== "ENOENT") throw e;
}

const sharedCommon = {
  bundle: true,
  minify: true,
  sourcemap: true,
  logLevel: "info",
};

await build({
  ...sharedCommon,
  entryPoints: ["scripts/bundle-entry.css"],
  outfile: "app.bundle.css",
  loader: { ".css": "css" },
  // L-LIVE-AUDIT-P2 UPDATE 8 — leave /fonts/*.woff2 url() references alone;
  // they are absolute URLs served by Vercel from /fonts/, not bundleable.
  external: ["/fonts/*"],
});

// F-ARCH-1 §A — code-splitting. Dynamic `import("./screens/...")` calls in
// main.js produce separate chunks under /chunks/, fetched on demand. The
// entry stays at /app.bundle.js so app.html doesn't change.
await build({
  ...sharedCommon,
  entryPoints: ["js/main.js"],
  outdir: ".",
  entryNames: "app.bundle",
  chunkNames: "chunks/app-[name]-[hash]",
  format: "esm",
  splitting: true,
  target: "es2020",
  // posthog is loaded via absolute https URL in analytics.js — keep external.
  external: ["https://*"],
});

console.log("✓ bundles built: /app.bundle.css + /app.bundle.js + /chunks/*");
