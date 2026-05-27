// Landing full-page audit. Spins up an embedded static HTTP server because
// loading via file:// breaks absolute /css/* and /js/* paths (Windows resolves
// them against drive root, so no CSS loads and every section measures wrong).
// If you see catalog == 11 000+ px on a 1280 viewport, you're using a broken
// file:// audit somewhere.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.AUDIT_PORT || 4329);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function startServer(rootDir, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      const fp = path.join(rootDir, urlPath);
      if (!fp.startsWith(rootDir)) { res.writeHead(403); res.end(); return; }
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404, { "content-type": "text/plain" }); res.end("404 " + urlPath); return; }
        const type = MIME[path.extname(fp).toLowerCase()] || "application/octet-stream";
        res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
        res.end(data);
      });
    });
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

const server = await startServer(ROOT, PORT);
const base = `http://127.0.0.1:${PORT}/index.html`;

try {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
  const page = await ctx.newPage();

  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const out = process.env.AUDIT_OUT || "screenshots/landing/fullpage-2026-05-27.png";
  await mkdir(dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });

  const sections = await page.$$eval("main > section", (els) =>
    els.map((e) => ({
      id: e.id || null,
      className: e.className.split(" ").slice(0, 3).join(" "),
      heading: e.querySelector("h1,h2,h3")?.textContent?.trim()?.slice(0, 80) || null,
      height_px: Math.round(e.getBoundingClientRect().height),
    })),
  );
  console.log("SECTIONS_IN_ORDER:");
  console.log(JSON.stringify(sections, null, 2));
  console.log("SCREENSHOT:", out);
  console.log("SERVED_FROM:", base);

  await browser.close();
} finally {
  server.close();
}
