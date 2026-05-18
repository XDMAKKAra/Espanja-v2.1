// One-off: insert themed inline-SVG icons into 8 catalog cards in index.html.
import fs from "node:fs";

const icons = {
  1: { title: "Saludos", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>' },
  2: { title: "Comida", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v8a3 3 0 0 0 3 3v9M9 2v6M6 2v6M15 9a3 3 0 0 1 3-3v15"/></svg>' },
  3: { title: "Viajes", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18"/></svg>' },
  4: { title: "Estudios", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M9 7h7M9 11h5"/></svg>' },
  5: { title: "Salud", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
  6: { title: "Ympäristö", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 4 13C4 7 11 2 20 2c0 9-5 16-11 18zM2 22c4-4 8-6 10-7"/></svg>' },
  7: { title: "Kulttuuri", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>' },
  8: { title: "YO-koe", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5a6 3 0 0 0 12 0v-5"/></svg>' },
};

const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
let html = fs.readFileSync("index.html", "utf8");

for (let i = 0; i < 8; i++) {
  const n = i + 1;
  const numStr = numerals[i] + ".";
  const icon = icons[n];
  // Regex: <li class="catalog-card"> ... <p class="catalog-card__num">N.</p>
  // Match across newlines, no other text between.
  const re = new RegExp(`<li class="catalog-card">(\\s*)<p class="catalog-card__num">${numStr.replace(".", "\\.")}</p>`);
  if (!re.test(html)) {
    console.error(`MISS for card ${n} (${numStr})`);
    continue;
  }
  html = html.replace(
    re,
    `<li class="catalog-card" data-icon="${n}">$1<span class="catalog-card__icon" aria-label="${icon.title}-aihe">${icon.svg}</span>$1<p class="catalog-card__num">${numStr}</p>`,
  );
  console.log(`card ${n} (${numStr}): inserted`);
}

fs.writeFileSync("index.html", html);
console.log("done");
