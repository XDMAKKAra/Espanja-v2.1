# BRIEF: L-V326 — Mobile hero killshot (kuvitus + countdown pois)

**Päivä:** 2026-05-27
**Triggeri:** Marcel huomasi 2026-05-27 että mobile-heron yläosa on pelkkä Humaaans-kuvitus → otsikko jää foldin alle. Lisäksi YO-countdown-pill ("SEURAAVA YO-KOE · 28.9.2026 · 123 PV 12 H 49 MIN") on AI-slop joka ei konvertoi.
**Status:** Pieni tarkka fix. ~15-30 min writer-työ.
**Council:** 4/5 advisoria + 5/5 reviewers äänesti B-vaihtoehdon (kuvituksen piilotus mobile:ssa). Decision-doc: tämä brief riittää, ei tarvita erillistä `docs/superpowers/specs/`-spec:ä.

---

## Mitä korjataan

### Bugi 1: Mobile-heron kuvitus dominoi foldin

`index.html:122-189` — `.hero__inner` on grid jossa `.hero__visual` (520×620 `student-reading.svg`) on `order: 1` ja `.hero__copy` `order: 2`. Mobile:ssa stack-järjestys → kuvitus on koko ensimmäisen foldin. Otsikko "Lyhyen kielen YO-koe on kirjoituskoe." ei näy ennen scroll:ia.

CSS-juurisyy: `css/landing-editorial.css:394-416`. Mobile-default on yksi sarake, kuvitus order:1. `@media (min-width: 980px)` tekee 7fr/5fr grid:n mutta järjestys säilyy.

### Bugi 2: AI-slop countdown-pill

`index.html:133-142` — `<p class="hero__eyebrow yo-countdown">` jolla on label + dot + live-laskuri (pv/h/min). JS-driveri `js/landing-countdown.js`. Mono-pill brick-on-cream-paletilla, ei lisää konversiota, lisää AI-slop-fiilistä. Poista kokonaan.

---

## Mitä writer tekee

### Step 1: Piilota kuvitus mobile:ssa

Lisää `css/landing-editorial.css`:hen (heron CSS-blokin perään, n. rivi 416):

```css
/* L-V326 — mobile hero: kuvitus piiloon <720px, copy ekana näkyväksi.
   Council-päätös 2026-05-27 (B-vaihtoehto): Humaaans-kuvitus on
   desktop-affordance, mobile-foldissa otsikko + CTA painavat enemmän. */
@media (max-width: 720px) {
  .landing .hero__visual { display: none; }
  .landing .hero__copy { order: 1; }
}
```

**Älä** muokkaa kuvituksen `width`/`height` -attribuutteja, **älä** poista SVG-tiedostoa, **älä** kosketa desktop-CSS:ää. Kuvitus säilyy ≥720px-viewport:eilla muuttumattomana.

### Step 2: Poista countdown-pill

`index.html:133-142` — poista koko `<p class="hero__eyebrow yo-countdown">…</p>` -blokki.

Jos `<script src="/js/landing-countdown.js">` -tag on `index.html`:ssä eikä mikään muu sivu käytä sitä (`grep -rn "landing-countdown\|yo-countdown" --include="*.html"` osoittaa että per-kieli-landingit (`public/landing/{espanja,saksa,ranska}.html`) käyttävät samaa pill-rakennetta + skriptiä):

**Päätös:** poista pill **vain `index.html`:stä**. Säilytä `js/landing-countdown.js` ja per-kieli-landingien pillit toistaiseksi — niiden konversio-vaikutus on eri kysymys joka kuuluu omaan loopiin (kandidaatti L-V327+ jos halutaan).

Jos `index.html` ei lataa `js/landing-countdown.js`-skriptiä (tarkista), älä poista skripti-tagia muualta.

### Step 3: Verify

```bash
# Visual: aja Playwright mobile-viewport (iPhone 13 = 390×844), goto index.html
npx playwright test tests/e2e-bug-scan.spec.js     # 38/38 PASS (ei regressioita)
npx playwright test tests/e2e-brand.spec.js        # 16/16 PASS
```

Lisäksi: ota screenshot mobile-koossa (`devices['iPhone 13']`) ja varmista että:
1. Foldissa näkyy: nav + otsikko "Lyhyen kielen YO-koe on kirjoituskoe." + sub + "Aloita ilmaiseksi" -nappi
2. Ei näy: Humaaans-kuvitusta, countdown-pilliä
3. Desktop ≥980px näkyy edelleen 7fr/5fr (kuvitus vasen, copy oikea)

`screenshots/landing/mobile-hero-after-V326.png` (tai vastaava polku) talletukseen.

### Step 4: Päivitä IMPROVEMENTS.md + SW

Bumppaa `sw.js` CACHE_VERSION (v321 → v322). `STATIC_ASSETS`-lista ei muutu (CSS-tiedosto-lista ei kasva). Lisää yksi rivi IMPROVEMENTS.md:hen (ledger-formaatti, ks. L-V31x-rivit).

---

## Acceptance criteria

1. Mobile <720px viewport: heron ekassa foldissa näkyy otsikko + sub + CTA, ei kuvitusta, ei countdown-pilliä
2. Desktop ≥980px: hero näkyy entiseen tapaan (7fr/5fr, kuvitus vasen, copy oikea, ei countdownia)
3. `npm run test:bug-scan` 38/38 PASS
4. `tests/e2e-brand.spec.js` 16/16 PASS
5. Per-kieli-landingit (`public/landing/{espanja,saksa,ranska}.html`) **muuttumattomat** tässä loopissa
6. SW v321 → v322

---

## Out-of-scope (TÄRKEÄ)

- **Otsikon copy** — "Lyhyen kielen YO-koe on kirjoituskoe." on insider-jargon, kielistä ei mainita; tämä korjataan **L-V327:ssa** (oma brief, COPY-kategoria + humanizer-skilli)
- **Per-kieli-landingien countdown-pillit** (`public/landing/{es,de,fr}.html`) — eri loop jos halutaan
- **Desktop-heron kuvituksen kohtalo** — Contrarian äänesti "kill mobile AND desktop", mutta tämä vaatii desktop-baselinea + erillistä päätöstä; älä koske desktop-CSS:ään
- **Live AI grader heroon** (Expansionist-ehdotus) — eri scope, eri budjetti, eri loop
- **Headline-otsikon kieli-signaalin lisäys** (ES/FR/DE) — L-V327
- **Parent-luettava trust-rivi** — L-V327
- **Mobile-CTA-click instrumentointi** — Executor ehdotti, mutta Plausible/GA-event vaatii oman lisäbriefin (kandidaatti L-V328 jos halutaan mitata konversio-deltaa)

---

## Skill-stack writerille

FRONTEND-S (yksi CSS-blokki + yhden HTML-blokin poisto):
- `frontend-design`

TESTING-S (regression-verifiointi):
- `webapp-testing`
- `superpowers:verification-before-completion`

Total: 3 skilliä.

---

## Päätös-rekap

Council 4/5 äänesti B. Executor varoitti A-vaihtoehdon ("pienennä kuvitus") regressio-riskistä → 3 päätöstä yhden sijaan. C-vaihtoehto (80×80 inline) on universaalisti "sticker, not brand". B on cleanest ship: 3 CSS-riviä + yksi HTML-blokin poisto.

Realistinen scope: 15-30 min kun browser-testaus tehty.

L-V327 (headline-reframe + kieli-signaali + parent-trust) seuraa erikseen, ei niputeta tähän.
