// L-LIVE-AUDIT-P2 UPDATE 1+2 — bundle CSS + JS into single artifacts.
// Replaces 16 CSS <link> tags + 1 JS module entry (which transitively pulls 28 files)
// with /app.bundle.css + /app.bundle.js served from repo root.
import { build } from "esbuild";

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
