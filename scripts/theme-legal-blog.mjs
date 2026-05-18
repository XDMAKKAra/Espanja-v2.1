// Theme-switch legal + blog pages to Old-Spain palette by:
//   1. Replacing the Geist/Inter Google Fonts <link> with Fraunces/Manrope
//   2. Replacing landing-tokens.css + landing.css with landing-editorial-*
//   3. Updating <meta name="theme-color"> dark → cream
//   4. Tagging <body> with class="legal" or class="blog"
//
// Inline <style> blocks keep working because body.legal / body.blog
// re-export the old token names as aliases (see landing-editorial.css).
import fs from "node:fs";
import path from "node:path";

const FONT_LINK_OLD = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Geist[^"]*" rel="stylesheet"[^>]*\/>/;
const FONT_LINK_NEW = `<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,400..700,0..100,0..1;1,9..144,400..700,0..100,0..1&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap&subset=latin,latin-ext" rel="stylesheet" />`;

const CSS_LINK_OLD = /<link rel="stylesheet" href="\/css\/landing-tokens\.css"[^>]*\/>\s*<link rel="stylesheet" href="\/css\/landing\.css"[^>]*\/>/;
const CSS_LINK_NEW = `<link rel="stylesheet" href="/css/landing-editorial-tokens.css" />
  <link rel="stylesheet" href="/css/landing-editorial.css" />`;

const THEME_COLOR_OLD = /<meta name="theme-color" content="#0[Bb]0[Ee]0[Dd]"\s*\/>/;
const THEME_COLOR_NEW = `<meta name="theme-color" content="#f5efe2" />`;

function patch(file, bodyClass) {
  if (!fs.existsSync(file)) {
    console.log(`SKIP missing: ${file}`);
    return;
  }
  let html = fs.readFileSync(file, "utf8");
  const orig = html;

  if (FONT_LINK_OLD.test(html)) {
    html = html.replace(FONT_LINK_OLD, FONT_LINK_NEW);
  }
  if (CSS_LINK_OLD.test(html)) {
    html = html.replace(CSS_LINK_OLD, CSS_LINK_NEW);
  }
  if (THEME_COLOR_OLD.test(html)) {
    html = html.replace(THEME_COLOR_OLD, THEME_COLOR_NEW);
  }
  // <body> class injection
  if (/<body\s*>/.test(html)) {
    html = html.replace(/<body\s*>/, `<body class="${bodyClass}">`);
  } else if (/<body class="[^"]*"\s*>/.test(html)) {
    html = html.replace(/<body class="([^"]*)"\s*>/, (m, c) => {
      const classes = c.split(/\s+/).filter(Boolean);
      if (!classes.includes(bodyClass)) classes.unshift(bodyClass);
      return `<body class="${classes.join(" ")}">`;
    });
  }

  if (html === orig) {
    console.log(`UNCHANGED ${file}`);
  } else {
    fs.writeFileSync(file, html);
    console.log(`PATCHED  ${file}`);
  }
}

// Legal pages
patch("privacy.html", "legal");
patch("terms.html", "legal");
patch("refund.html", "legal");

// Blog index + posts
patch("blog/index.html", "blog");
for (const f of fs.readdirSync("blog")) {
  if (f === "index.html") continue;
  if (f.endsWith(".html")) patch(path.join("blog", f), "blog");
}
