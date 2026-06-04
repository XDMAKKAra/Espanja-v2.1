/* Lukee workflow-tuloksen (task output -tiedosto), dekoodaa section-HTML:n,
   validoi, järjestää ja kirjoittaa data/articles.json. Ei pushata. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const src = process.argv[2];
if (!src) { console.error("Anna output-tiedoston polku argumenttina"); process.exit(1); }
let raw = readFileSync(src, "utf8");
const i = raw.indexOf("{");
const j = raw.lastIndexOf("}");
if (i < 0 || j < 0) { console.error("Ei JSON-objektia tiedostossa"); process.exit(1); }
const parsed = JSON.parse(raw.slice(i, j + 1));
function findArticles(o, depth = 0) {
  if (!o || typeof o !== "object" || depth > 6) return null;
  if (Array.isArray(o.articles) && o.articles.length && o.articles[0]?.slug) return o.articles;
  for (const v of Object.values(o)) {
    const r = findArticles(v, depth + 1);
    if (r) return r;
  }
  return null;
}
let articles = Array.isArray(parsed) && parsed[0]?.slug ? parsed : findArticles(parsed);
if (!Array.isArray(articles)) { console.error("articles ei ole taulukko"); process.exit(1); }

// Dekoodaa rakennetagit (agentit enkoodasivat <p> -> &lt;p&gt;). &amp; viimeisenä.
function decode(s = "") {
  if (typeof s !== "string") return s;
  if (/&lt;|&gt;|&quot;|&#39;|&nbsp;|&rarr;|&ndash;|&amp;/.test(s)) {
    s = s
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, " ").replace(/&rarr;/g, "→")
      .replace(/&ndash;/g, "–").replace(/&hellip;/g, "…")
      .replace(/&amp;/g, "&");
  }
  // Humanizer: em-dash kielletty suomi-tekstissä. Välilyönnein eroteltu → kaksoispiste, muu → pilkku.
  s = s.replace(/\s+—\s+/g, ": ").replace(/—/g, ", ");
  return s;
}

let emdash = 0, fixedSlugs = new Set();
for (const a of articles) {
  if (Array.isArray(a.sections)) {
    for (const s of a.sections) {
      s.h2 = decode(s.h2);
      s.html = decode(s.html);
      if ((s.html || "").includes("—")) emdash++;
    }
  }
  if (Array.isArray(a.faq)) for (const f of a.faq) { f.q = decode(f.q); f.a = decode(f.a); if ((f.a||"").includes("—")) emdash++; }
  for (const k of ["title","lead","metaTitle","metaDescription","ogDescription"]) {
    a[k] = decode(a[k]);
    if ((a[k] || "").includes("—")) emdash++;
  }
  if (fixedSlugs.has(a.slug)) console.warn("DUPLIKAATTISLUG:", a.slug);
  fixedSlugs.add(a.slug);
}

// Karsi related-viittaukset jotka eivät osoita olemassa olevaan slugiin.
const slugs = new Set(articles.map(a => a.slug));
for (const a of articles) a.related = (a.related || []).filter(r => slugs.has(r) && r !== a.slug).slice(0, 4);

// Featured ensin: espanjan YO-koe -yleiskatsaus, sitten muu workflow-järjestys.
const FEATURED = "espanja-yo-koe-2026-lyhyt-oppimaara";
articles.sort((a, b) => (a.slug === FEATURED ? -1 : b.slug === FEATURED ? 1 : 0));

writeFileSync(join(ROOT, "data", "articles.json"), JSON.stringify(articles, null, 2), "utf8");
console.log(`✓ ${articles.length} artikkelia kirjoitettu data/articles.json`);
console.log(`  uniikkeja slugeja: ${slugs.size}`);
if (emdash) console.warn(`  ⚠ em-dash-osumia: ${emdash} (tarkista)`);
else console.log(`  ✓ ei em-dasheja`);
