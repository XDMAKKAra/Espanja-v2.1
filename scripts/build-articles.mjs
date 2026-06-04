#!/usr/bin/env node
/* ============================================================
   build-articles.mjs — generoi /artikkelit/ hubin + artikkelit
   datasta (data/articles.json) yhden templaten päälle.

   Aja:  node scripts/build-articles.mjs
   Erä 2+: lisää objekteja data/articles.json:iin ja aja uudelleen.

   Tuottaa:
     artikkelit/index.html          (hub)
     artikkelit/<slug>.html         (per artikkeli)
     sitemap.xml                    (staattiset sivut + kaikki artikkelit)
   ============================================================ */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "artikkelit");
const BASE = "https://puheo.fi";

const CAT_LABEL = {
  "kielioppi": "Kielioppi",
  "kirjoittaminen": "Kirjoittaminen",
  "yo-koe": "YO-koe",
  "sanasto": "Sanasto",
  "opiskelu": "Opiskelu",
};
const LANG_LABEL = { es: "Espanja", fr: "Ranska", de: "Saksa", yleinen: "Yleinen" };

// ─── apurit ──────────────────────────────────────────────────
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugifyAnchor = (s = "") =>
  String(s).toLowerCase().trim()
    .replace(/[äå]/g, "a").replace(/ö/g, "o").replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

const stripTags = (s = "") => String(s).replace(/<[^>]+>/g, "");
const excerpt = (a) => {
  const base = a.metaDescription || a.lead || stripTags((a.sections?.[0]?.html) || "");
  const t = stripTags(base).trim();
  return t.length > 165 ? t.slice(0, 162).replace(/\s+\S*$/, "") + "…" : t;
};

const readingLabel = (a) => `n. ${a.readingMin || Math.max(4, Math.round(stripTags(a.sections.map(s=>s.html).join(" ")).split(/\s+/).length / 180))} min`;
const fiDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${+m[3]}.${+m[2]}.${m[1]}` : iso;
};

// ─── jaettu kuori (nav + footer), nykyinen landing-design ────
const HEAD_LINKS = `
  <script src="/js/pre-launch-gate.js"></script>
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" type="image/svg+xml" href="/public/brand/favicon-master.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/public/favicon/apple-touch-icon.png" />
  <meta name="theme-color" content="#9B2D2A" />
  <link rel="preload" href="/fonts/fredoka-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/mulish-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/css/fonts.css" />
  <link rel="stylesheet" href="/css/landing-tokens.css" />
  <link rel="stylesheet" href="/css/landing.css" />
  <link rel="stylesheet" href="/css/artikkeli.css" />`;

const NAV = `
  <header class="nav" id="nav" data-scrolled="false">
    <div class="nav__inner">
      <a class="nav__brand" href="/" aria-label="Puheo etusivu"><span class="brand-wordmark">puheo</span></a>
      <nav class="nav__links" aria-label="Sivun osiot">
        <div class="nav__dropdown" id="nav-kurssit-dd">
          <button class="nav__link nav__dropdown-trigger" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="nav-kurssit-menu">
            Kurssit
            <svg class="nav__dropdown-chevron" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="nav__dropdown-menu" id="nav-kurssit-menu" role="menu" aria-label="Kurssit">
            <a class="nav__dropdown-item" role="menuitem" href="/#kurssit">Kaikki kurssit</a>
            <a class="nav__dropdown-item" role="menuitem" href="/espanjan-abikurssi">Espanjan abikurssi</a>
            <a class="nav__dropdown-item" role="menuitem" href="/saksan-abikurssi">Saksan abikurssi</a>
            <a class="nav__dropdown-item" role="menuitem" href="/ranskan-abikurssi">Ranskan abikurssi</a>
          </div>
        </div>
        <a class="nav__link" href="/nayte">Näyte</a>
        <a class="nav__link" href="/artikkelit/">Oppaat</a>
        <a class="nav__link" href="/#hinnoittelu">Hinnoittelu</a>
        <a class="nav__link" href="/ukk">FAQ</a>
      </nav>
      <div class="nav__cta" id="nav-cta">
        <a class="btn btn--quiet" id="nav-login" href="/app.html#kirjaudu">Kirjaudu</a>
        <a class="btn btn--primary" id="nav-signup" href="/app.html#rekisteroidy">Aloita ilmaiseksi</a>
        <a class="btn btn--primary nav__chip" id="nav-chip" href="/app.html" hidden>Jatka harjoittelua</a>
      </div>
      <button class="nav__hamburger" id="nav-hamburger" type="button" aria-label="Valikko" aria-expanded="false" aria-controls="nav-menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" />
        </svg>
      </button>
    </div>
  </header>

  <div class="nav-menu" id="nav-menu" hidden>
    <div class="nav-menu__panel" role="dialog" aria-modal="true" aria-label="Valikko">
      <div class="nav-menu__head">
        <span class="nav-menu__brand brand-wordmark">puheo</span>
        <button class="nav-menu__close" id="nav-menu-close" type="button" aria-label="Sulje valikko">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
        </button>
      </div>
      <div class="nav-menu__cta">
        <a class="btn btn--primary nav-menu__primary" id="nav-menu-signup" href="/app.html#rekisteroidy">Aloita ilmaiseksi</a>
        <a class="btn btn--primary nav-menu__primary" id="nav-menu-chip" href="/app.html" hidden>Jatka harjoittelua</a>
        <a class="nav-menu__login" id="nav-menu-login" href="/app.html#kirjaudu">Kirjaudu</a>
      </div>
      <nav class="nav-menu__links" aria-label="Sivun osiot">
        <details class="nav-menu__group" id="nav-menu-kurssit">
          <summary class="nav-menu__link nav-menu__summary" aria-expanded="false" aria-controls="nav-menu-kurssit-list">
            Kurssit
            <span class="nav-menu__pm" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12" /><line class="nav-menu__pm-v" x1="12" y1="5" x2="12" y2="19" /></svg></span>
          </summary>
          <div class="nav-menu__sub" id="nav-menu-kurssit-list">
            <a class="nav-menu__sublink" href="/#kurssit">Kaikki kurssit</a>
            <a class="nav-menu__sublink" href="/espanjan-abikurssi">Espanjan abikurssi</a>
            <a class="nav-menu__sublink" href="/saksan-abikurssi">Saksan abikurssi</a>
            <a class="nav-menu__sublink" href="/ranskan-abikurssi">Ranskan abikurssi</a>
          </div>
        </details>
        <a class="nav-menu__link" href="/nayte">Näyte</a>
        <a class="nav-menu__link" href="/artikkelit/">Oppaat</a>
        <a class="nav-menu__link" href="/#hinnoittelu">Hinnoittelu</a>
        <a class="nav-menu__link" href="/ukk">FAQ</a>
      </nav>
    </div>
  </div>`;

const FOOTER = `
  <footer class="landing-footer" role="contentinfo">
    <div class="landing-footer__inner">
      <div class="landing-footer__brand">
        <a class="landing-footer__brandmark" href="/" aria-label="Puheo etusivu"><span class="landing-footer__brand-dot" aria-hidden="true"></span>Puheo</a>
        <p class="landing-footer__tagline">Lyhyen oppimäärän YO-koe valmennus espanjaan, ranskaan ja saksaan. Rakennettu YTL:n rubriikin päälle.</p>
      </div>
      <div class="landing-footer__cols">
        <nav class="landing-footer__col" aria-label="Tuote">
          <h3 class="landing-footer__col-title">Tuote</h3>
          <ul class="landing-footer__links">
            <li><a href="/#kurssit">Kurssit</a></li>
            <li><a href="/nayte">Näyte</a></li>
            <li><a href="/artikkelit/">Oppaat</a></li>
            <li><a href="/#hinnoittelu">Hinnoittelu</a></li>
          </ul>
        </nav>
        <nav class="landing-footer__col" aria-label="Abikurssit">
          <h3 class="landing-footer__col-title">Abikurssit</h3>
          <ul class="landing-footer__links">
            <li><a href="/espanjan-abikurssi">Espanjan abikurssi</a></li>
            <li><a href="/saksan-abikurssi">Saksan abikurssi</a></li>
            <li><a href="/ranskan-abikurssi">Ranskan abikurssi</a></li>
          </ul>
        </nav>
        <nav class="landing-footer__col" aria-label="Tili">
          <h3 class="landing-footer__col-title">Tili</h3>
          <ul class="landing-footer__links">
            <li><a href="/app.html#kirjaudu">Kirjaudu</a></li>
            <li><a href="/app.html#rekisteroidy">Aloita ilmaiseksi</a></li>
            <li><a href="/pricing.html">Hinnoittelu</a></li>
          </ul>
        </nav>
        <nav class="landing-footer__col" aria-label="Tieto">
          <h3 class="landing-footer__col-title">Tieto</h3>
          <ul class="landing-footer__links">
            <li><a href="/privacy.html">Tietosuoja</a></li>
            <li><a href="/terms.html">Käyttöehdot</a></li>
            <li><a href="/refund.html">Palautukset</a></li>
            <li><a href="/artikkelit/">Oppaat</a></li>
            <li><a href="mailto:tuki@puheo.fi">Ota yhteyttä</a></li>
          </ul>
        </nav>
      </div>
      <div class="landing-footer__bottom"><p class="landing-footer__copy">© 2026 Puheo · Tehty Suomessa</p></div>
    </div>
  </footer>`;

const NAV_SCRIPT = `  <script src="/js/landing-nav.js"></script>`;

// ─── artikkelin renderöinti ──────────────────────────────────
function renderArticle(a, bySlug) {
  const url = `${BASE}/artikkelit/${a.slug}`;
  const catLabel = CAT_LABEL[a.category] || a.category;
  const langLabel = LANG_LABEL[a.lang] || a.lang;
  const showToc = a.sections.length > 4;

  const wrapTables = (html) =>
    String(html).replace(/<table>/g, '<div class="art-table"><table>').replace(/<\/table>/g, "</table></div>");
  const sectionsHtml = a.sections.map((s) => {
    const id = slugifyAnchor(s.h2);
    return `        <section id="${id}">\n          <h2>${esc(s.h2)}</h2>\n          ${wrapTables(s.html)}\n        </section>`;
  }).join("\n");

  const toc = showToc ? `
      <nav class="art-toc" aria-label="Sisällys">
        <p class="art-toc__title">Tässä oppaassa</p>
        <ol>
${a.sections.map((s) => `          <li><a href="#${slugifyAnchor(s.h2)}">${esc(s.h2)}</a></li>`).join("\n")}
        </ol>
      </nav>` : "";

  const faqHtml = (a.faq && a.faq.length) ? `
      <section class="art-faq" aria-labelledby="faq-title">
        <h2 id="faq-title">Usein kysyttyä</h2>
${a.faq.map((f) => `        <div class="art-faq__item">
          <p class="art-faq__q">${esc(f.q)}</p>
          <p class="art-faq__a">${esc(f.a)}</p>
        </div>`).join("\n")}
      </section>` : "";

  const related = (a.related || []).map((slug) => bySlug[slug]).filter(Boolean).slice(0, 4);
  const relatedHtml = related.length ? `
      <aside class="art-related" aria-labelledby="related-title">
        <p class="art-related__title" id="related-title">Lue myös</p>
        <ul class="art-related__list">
${related.map((r) => `          <li><a href="/artikkelit/${r.slug}"><span>${esc(r.title)}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg></a></li>`).join("\n")}
        </ul>
      </aside>` : "";

  // ─── JSON-LD @graph ───
  const graph = [
    {
      "@type": "Article",
      headline: a.title,
      description: a.metaDescription,
      datePublished: a.datePublished,
      dateModified: a.dateModified || a.datePublished,
      inLanguage: "fi",
      author: { "@type": "Organization", name: "Puheo", url: BASE },
      publisher: { "@type": "Organization", name: "Puheo", logo: { "@type": "ImageObject", url: `${BASE}/og-image.png` } },
      mainEntityOfPage: url,
      url,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Etusivu", item: BASE + "/" },
        { "@type": "ListItem", position: 2, name: "Oppaat", item: BASE + "/artikkelit/" },
        { "@type": "ListItem", position: 3, name: a.title, item: url },
      ],
    },
  ];
  if (a.faq && a.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  const jsonld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);

  return `<!DOCTYPE html>
<html lang="fi" class="landing">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(a.metaTitle)}</title>
  <meta name="description" content="${esc(a.metaDescription)}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:site_name" content="Puheo" />
  <meta property="og:title" content="${esc(a.title)}" />
  <meta property="og:description" content="${esc(a.ogDescription || a.metaDescription)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE}/og-image.png" />
  <meta property="og:locale" content="fi_FI" />
  <script type="application/ld+json">
${jsonld}
  </script>
${HEAD_LINKS}
</head>
<body class="landing artikkeli">
  <a href="#art-main" class="skip-link">Siirry sisältöön</a>
${NAV}
  <main id="art-main">
    <article class="art-wrap">
      <nav class="art-crumb" aria-label="Murupolku">
        <a href="/">Etusivu</a><span aria-hidden="true">›</span>
        <a href="/artikkelit/">Oppaat</a><span aria-hidden="true">›</span>
        <span>${esc(catLabel)}</span>
      </nav>

      <header class="art-head">
        <p class="art-kicker"><span class="art-lang art-lang--${a.lang}">${esc(langLabel)}</span> ${esc(catLabel)}</p>
        <h1>${esc(a.title)}</h1>
        <p class="art-lead">${esc(a.lead)}</p>
        <p class="art-meta">Päivitetty ${fiDate(a.dateModified || a.datePublished)} · ${readingLabel(a)}</p>
      </header>
${toc}
      <div class="art-body">
${sectionsHtml}
      </div>
${faqHtml}
      <section class="art-cta" aria-labelledby="art-cta-title">
        <h2 id="art-cta-title">Harjoittele tätä Puheossa</h2>
        <p>Tee ilmainen tili ja harjoittele oikeissa lauseyhteyksissä. Kirjoitelmasi saa YTL:n rubriikin mukaisen palautteen, joka kertoo mikä nostaa pisteitä ja mikä vetää alas.</p>
        <a class="btn btn--primary btn--lg" href="/app.html#rekisteroidy">Aloita ilmaiseksi</a>
        <p class="art-cta__fine">Ilmainen aloitus, ei korttia.</p>
      </section>
${relatedHtml}
    </article>
  </main>
${FOOTER}
${NAV_SCRIPT}
</body>
</html>
`;
}

// ─── hubin renderöinti ───────────────────────────────────────
function renderHub(articles) {
  const url = `${BASE}/artikkelit/`;
  const cats = [...new Set(articles.map((a) => a.category))];
  const langs = [...new Set(articles.map((a) => a.lang))];

  const filterChips = [
    `<button class="hub-filter__chip" type="button" data-filter="all" aria-pressed="true">Kaikki</button>`,
    ...["es", "fr", "de", "yleinen"].filter((l) => langs.includes(l)).map((l) =>
      `<button class="hub-filter__chip" type="button" data-filter="lang:${l}" aria-pressed="false">${LANG_LABEL[l]}</button>`),
    ...["yo-koe", "kielioppi", "kirjoittaminen", "sanasto", "opiskelu"].filter((c) => cats.includes(c)).map((c) =>
      `<button class="hub-filter__chip" type="button" data-filter="cat:${c}" aria-pressed="false">${CAT_LABEL[c]}</button>`),
  ].join("\n          ");

  const cards = articles.map((a, i) => {
    const featured = i === 0 ? " is-featured" : "";
    return `        <li class="hub-item${featured}" data-lang="${a.lang}" data-cat="${a.category}">
          <article class="hub-card">
            <p class="hub-card__meta"><span class="art-lang art-lang--${a.lang}">${LANG_LABEL[a.lang]}</span><span class="hub-card__cat">${CAT_LABEL[a.category]}</span><span>${readingLabel(a)}</span></p>
            <h2 class="hub-card__title"><a href="/artikkelit/${a.slug}">${esc(a.title)}</a></h2>
            <p class="hub-card__excerpt">${esc(excerpt(a))}</p>
            <a class="hub-card__cta" href="/artikkelit/${a.slug}">Lue opas →</a>
          </article>
        </li>`;
  }).join("\n");

  const itemList = {
    "@type": "ItemList",
    itemListElement: articles.map((a, i) => ({
      "@type": "ListItem", position: i + 1, url: `${BASE}/artikkelit/${a.slug}`, name: a.title,
    })),
  };
  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Oppaat lyhyen kielen YO-kokeeseen", description: "Kielioppi, kirjoittaminen ja koerakenne espanjan, ranskan ja saksan YO-kokeeseen.", url, inLanguage: "fi", isPartOf: { "@type": "WebSite", name: "Puheo", url: BASE } },
      itemList,
    ],
  }, null, 2);

  return `<!DOCTYPE html>
<html lang="fi" class="landing">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Oppaat lyhyen kielen YO-kokeeseen (espanja, ranska, saksa) | Puheo</title>
  <meta name="description" content="Selkeät oppaat lyhyen oppimäärän YO-kokeeseen: kielioppi, kirjoittaminen ja koerakenne espanjaksi, ranskaksi ja saksaksi. Kaikki suomeksi, YTL:n rubriikin mukaan." />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:site_name" content="Puheo" />
  <meta property="og:title" content="Oppaat lyhyen kielen YO-kokeeseen" />
  <meta property="og:description" content="Kielioppi, kirjoittaminen ja koerakenne espanjan, ranskan ja saksan YO-kokeeseen. Kaikki suomeksi." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${BASE}/og-image.png" />
  <meta property="og:locale" content="fi_FI" />
  <script type="application/ld+json">
${jsonld}
  </script>
${HEAD_LINKS}
</head>
<body class="landing artikkeli">
  <a href="#hub-main" class="skip-link">Siirry sisältöön</a>
${NAV}
  <main id="hub-main">
    <div class="hub-wrap">
      <header class="hub-head">
        <span class="eyebrow">Oppaat</span>
        <h1>Lyhyen kielen YO-koe, selitettynä.</h1>
        <p>Kielioppi, kirjoittaminen ja koerakenne espanjaksi, ranskaksi ja saksaksi. Aiheet on poimittu siitä, mistä YTL eniten pisteitä leikkaa. Suodata kielen tai aiheen mukaan.</p>
      </header>

      <div class="hub-filter" role="group" aria-label="Suodata oppaat">
          ${filterChips}
      </div>

      <ul class="hub-list" id="hub-list">
${cards}
      </ul>
      <p class="hub-empty" id="hub-empty">Ei oppaita tällä suodattimella.</p>

      <section class="hub-cta">
        <h2>Valmiina harjoittelemaan?</h2>
        <p>Puheo rakentaa adaptiivisen harjoitusohjelman, joka tunnistaa mitä et vielä osaa ja korjaa sen kohti YO-koetta.</p>
        <a class="btn btn--primary btn--lg" href="/app.html#rekisteroidy">Aloita ilmaiseksi</a>
      </section>
    </div>
  </main>
${FOOTER}
${NAV_SCRIPT}
  <script src="/js/artikkelit-hub.js"></script>
</body>
</html>
`;
}

// ─── sitemap ─────────────────────────────────────────────────
function renderSitemap(articles) {
  const staticUrls = [
    { loc: "/", pr: "1.0", cf: "weekly" },
    { loc: "/espanjan-abikurssi", pr: "1.0", cf: "weekly" },
    { loc: "/saksan-abikurssi", pr: "0.9", cf: "weekly" },
    { loc: "/ranskan-abikurssi", pr: "0.9", cf: "weekly" },
    { loc: "/nayte", pr: "0.9", cf: "monthly" },
    { loc: "/ukk", pr: "0.7", cf: "monthly" },
    { loc: "/artikkelit/", pr: "0.9", cf: "weekly" },
    { loc: "/pricing.html", pr: "0.7", cf: "monthly" },
    { loc: "/privacy.html", pr: "0.3", cf: "yearly" },
    { loc: "/terms.html", pr: "0.3", cf: "yearly" },
    { loc: "/refund.html", pr: "0.3", cf: "yearly" },
  ];
  const rows = [];
  for (const u of staticUrls) {
    rows.push(`  <url>\n    <loc>${BASE}${u.loc}</loc>\n    <changefreq>${u.cf}</changefreq>\n    <priority>${u.pr}</priority>\n  </url>`);
  }
  for (const a of articles) {
    rows.push(`  <url>\n    <loc>${BASE}/artikkelit/${a.slug}</loc>\n    <lastmod>${(a.dateModified || a.datePublished || "").slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

// ─── aja ─────────────────────────────────────────────────────
const data = JSON.parse(readFileSync(join(ROOT, "data", "articles.json"), "utf8"));
const articles = Array.isArray(data) ? data : data.articles;
if (!articles || !articles.length) { console.error("Ei artikkeleita data/articles.json:ssa"); process.exit(1); }

const bySlug = Object.fromEntries(articles.map((a) => [a.slug, a]));
mkdirSync(OUT, { recursive: true });

// poista vanhat generoidut artikkelit (paitsi assetit) ennen uudelleenkirjoitusta
for (const f of readdirSync(OUT)) {
  if (f.endsWith(".html")) unlinkSync(join(OUT, f));
}

let n = 0;
for (const a of articles) {
  writeFileSync(join(OUT, `${a.slug}.html`), renderArticle(a, bySlug), "utf8");
  n++;
}
writeFileSync(join(OUT, "index.html"), renderHub(articles), "utf8");
writeFileSync(join(ROOT, "sitemap.xml"), renderSitemap(articles), "utf8");

console.log(`✓ ${n} artikkelia + hub + sitemap generoitu (/artikkelit/, ${BASE})`);
