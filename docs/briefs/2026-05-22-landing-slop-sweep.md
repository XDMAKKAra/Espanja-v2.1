# BRIEF: Landing slop sweep v274 — anti-AI-slop pass

**Päivä:** 2026-05-22
**Versio:** v274
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v270 (Koeharjoitus 400) — voi mennä rinnan, ei overlappia
**Lähde:** kokonaisaudit Agent A -raportti (2026-05-22)
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng). Kutsu Skill-toolia aidosti, älä keksi listoja.

---

## Tavoite

Poista landing-sivulta loput AI-slop-merkit jotka audit löysi. 4 P0:ta + 2 P1:tä. Lopputulos: landing läpäisee absolute-ban-listan (Emil + impeccable + frontend-design + design-taste).

EI uudelleenkirjoitusta. Vain täsmäkorjauksia tiedossa oleviin patterneihin.

---

## Konteksti

Landing-sivun design-suunta on hyväksytty 2026-05-18 (Old Spain palette, Fraunces+Manrope, Humaaans, 70/30 asymmetric hero — `memory/feedback_landing_direction_2026_05_18.md`). Tämä brief EI muuta sitä — vain pyyhkii pois 4 spesifiä slop-patternia jotka jäivät:

1. Italic Fraunces on levinnyt 17 paikkaan editorial-tyylissä → pitää rajata hero-accent-otsikkoon
2. Side-stripe borderit kurssi- ja curriculum-korteilla — Emil + impeccable absolute-ban
3. Testimonialit nimillä + arvosanasiirtymillä — rikkoo `memory/feedback_no_fabricated_provable_claims.md`
4. 8 identtistä kurssikorttia 4-col gridissä — design-taste absolute-ban

App-puoli (`app.html` + näytöt) on ERI brief (v275 myöhemmin). Tämä koskee VAIN landingia.

---

## Fixet

### V1 — Testimonialit nimillä + arvosanasiirtymillä

**Tiedosto:** `index.html:600-648`

**Ongelma:** Kolme nimettyä oppilasta (Eemil, Helmi, Otso) + ikä + tarkat arvosanasiirtymät (C→M, M→E, B→M) + "keväällä 2026" -päivät + "sensori antoi M ja Puheo ennusti M". Tämä on tarkka todennettavissa oleva väite jonka ei voi varmuudella sanoa toteutuvan → rikkoo memory-säännön.

**Korjaus:** kaksi vaihtoehtoa, valitse toinen:
- **A (suositus, anonymisoi):** poista etunimet kokonaan. Korvaa "Eemil" / "Helmi" / "Otso" → "Lukiolainen Tampereelta" / "Lyhyt espanja, 3 kk" / "Abiturientti, syksyn 2025 koe" — geneerinen, ei nimettävissä. Poista myös tarkat arvosanasiirtymät → korvaa kuvauksella ("Sanoo että rakenteet alkoivat istua viimeisen kuukauden aikana"). Ei numerollisia ennuste-vs-sensori -väitteitä.
- **B (poista koko sektio):** Jos testimoniaali-osio tuntuu pakotetulta, poista se kokonaan tästä versiosta. Lisätään myöhemmin oikeiden, opt-in-suostumuksen antaneiden käyttäjien sitaateilla.

**Älä:** Älä keksi "Sanna L." / "Mikko K." -tyyppisiä nimiä — memory `feedback_no_fabricated_provable_claims.md` kieltää lukio-spesifiset väitteet eikä lievenny anonymisoituihin sukunimi-alkukirjaimiin.

### V5 — Italic Fraunces 17 paikassa editorial-tyylissä

**Tiedosto:** `landing-editorial.css` rivit 94-95, 200, 368, 477-478, 694, 743, 1012, 1043, 1151, 1217, 1422, 1537, 1579, 1606, 1733-1734, 1940, 1992

**Ongelma:** `font-style: italic` + `--ed-fvs-display-italic` -kombinaatio toistuu pitkin tyylitiedostoa. Frontend-design + design-taste-frontend + Emil + impeccable kaikki sanovat: italic-Fraunces VAIN hero-otsikossa (yksi sana max).

**Korjaus:**
1. Grep `landing-editorial.css` → `font-style: italic` ja `--ed-fvs-display-italic`
2. Säilytä VAIN `.hero__title-accent` -selektorin sisällä
3. Kaikki muut käyttöpaikat: vaihda regular Fraunces (poista `font-style: italic` ja vaihda `--ed-fvs-display-italic` → `--ed-fvs-display` jos se on määritelty, tai poista koko variable)

Jos jokin paikka näyttää ilman italicia "tyhjältä", **älä korvaa toisella tehosteella** (gradient, decoration, drop-shadow) — anna olla. Sivun pitää hengittää.

### V8 — Side-stripe borderit korteilla

**Tiedostot:**
- `landing.css:739` (".finale card gets subtle accent left-border")
- `app-old-spain.css:470, 886, 896` (`border-left: 2-3px solid`)
- `curriculum.css:110-792` (omat kommentit: "replace the 4px side-stripe... typographic anti-pattern")

**Ongelma:** Side-stripe borderit ovat **absolute ban** Emil + impeccable + frontend-design -skillien mukaan. Edes oma kommenttisi `curriculum.css`:ssä myöntää tämän.

**Korjaus per paikka:**
- **`landing.css:739` finale-kortti:** poista `border-left`. Erottele finale-kortti muusta:
  - Vaihtoehto 1: hieman isompi padding + paksumpi koko-border (1px → 2px)
  - Vaihtoehto 2: pieni "FINALE" -eyebrow ennen otsikkoa (Manrope 11px tracking-wide, NOT mono)
  - Vaihtoehto 3: tausta-sävytys (`background: var(--ed-bg-warm)` jos sellainen on)
- **`app-old-spain.css:470, 886, 896`:** poista border-left. Jos kortit tarvitsevat erottuvuutta, käytä top-borderia (`border-top: 1px solid var(--border-soft)`) joka on harmiton.
- **`curriculum.css:110-792`:** käy kommentit läpi, toteuta se mitä omat TODO-kommentit jo ehdottavat.

### V10 — 8 identtistä kurssikorttia 4-col gridissä

**Tiedosto:** `public/landing/espanja.html:387-493`

**Ongelma:** 8 kurssikorttia, jokaisessa täsmälleen sama rakenne (`.course-card__head` + `.course-card__title` + `.course-card__body` + `.course-card__meta`), sama mitta, sama eyebrow-muoto. Tämä on "identical card grid" -patternin oppikirjaesimerkki.

**Korjaus — bento-asymmetria:**
- K1 (johdantokurssi) ja K8 (finaali) → **isommat kortit** (2x leveys, käyttäjäpolun alku ja loppu erottuvat)
- K4 ("Ennen ja nyt") → **keskikoko-kortti** (puolet leveyttä, narratiivinen taitekohta)
- K2, K3, K5, K6, K7 → **kompaktit kortit** (pienemmät kortit pienemmissä riveissä)
- Layout: CSS Grid `grid-template-columns: 2fr 1fr 1fr 2fr` joillain riveillä, `1fr 2fr 1fr 1fr` toisilla — vältä symmetriaa
- Mobile (<768px): yksisarakkeinen pino, kaikki samaan kokoon — bento-rakenne katoaa pieneltä viewportilta

Jos tämä tuntuu liian isolta — minimivariantti:
- Vain K8 isompi (2x leveys, jää viimeiseksi riviksi omana täysikokoisena korttina). Muut 7 standard-koossa. Tämä riittää rikkomaan "8 identtistä" -patternin.

### V11 (P1) — `--ed-ink-muted` kontrasti rajoilla

**Tiedosto:** `landing-editorial-tokens.css:27`

**Ongelma:** `--ed-ink-muted: oklch(38% 0.012 30)` cream-taustalla `--ed-bg` antaa noin 5.5:1 contrastin (WCAG AA = 4.5:1). Pienemmillä kuin 14px se voi feilata.

**Korjaus:** tummenna varovasti:
```css
--ed-ink-muted: oklch(33% 0.012 30);
```

Verifioi sitten Chrome DevToolsin contrast-tarkistuksella että hero-sub, section-copy ja "Kielet"-label kaikki ovat ≥4.5:1 kaikilla pikselikooilla joissa niitä käytetään.

### V12 (P1) — Heading-hierarkia espanja.html

**Tiedosto:** `public/landing/espanja.html`

**Ongelma:** h1 → h2 → h2 → h3 → h2 hyppii edestakaisin. Hakukoneet ja screen reader-käyttäjät hämmentyvät.

**Korjaus:** käy h-tagit läpi järjestyksessä:
- Hero → `<h1>`
- Jokainen päätason sektio (`#problem`, `#pillars`, `#courses`, `#grader`, `#pricing`, `#faq`, `#cta`) → `<h2>`
- Sektion sisällä alaotsikot → `<h3>`
- ÄLÄ palaa h3:sta h2:een ja takaisin h3:een samalla loogisella tasolla

---

## Toteutus

1. **Baseline-snapshot:**
   - Screenshot Playwrightilla: `/`, `/public/landing/espanja.html`, `/public/landing/ranska.html`, `/public/landing/saksa.html` desktop + mobile (375px)
   - Tallenna `docs/briefs/landing-v274-baseline/`
2. **Fixet järjestyksessä:** V1 → V5 → V8 → V10 → V11 → V12
3. **Per-fix verifiointi:** screenshot uudestaan, vertaa baseline-kuvaan, ei muuta saa muuttua
4. **`npm run build`** — esbuild-bundlet stagattu
5. **Bumppaa `sw.js` `CACHE_VERSION`** koska landing-CSS muuttuu (`STATIC_ASSETS`-lista todennäköisesti koskee niitä)
6. **AI-slop-checklist** (memory `feedback_ai_slop_check_every_frontend.md`):
   - [ ] Ei italic-Fraunces missään muualla kuin hero-accentilla
   - [ ] Ei side-stripe-bordereita
   - [ ] Ei nimellisiä testimonialeja
   - [ ] Ei identtisiä kortteja samassa rivissä
   - [ ] Ei em-dashia suomi-tekstissä
   - [ ] Ei "Ladataan…" italicilla
   - [ ] Heading-hierarkia kunnossa
7. **Humanizer-säännöt** (memory `feedback_humanizer_required.md`): jos kirjoitat uutta suomi-microcopya (V1:n korvaavat testimoniaalit), aja humanizer-tarkistus läpi

---

## Commit + PR

- Jos teet kaikki 6 fixiä: **1 PR, 6 commitia** (V1, V5, V8, V10, V11, V12 erikseen)
- Otsikko: `chore(landing): anti-AI-slop sweep v274`
- IMPROVEMENTS.md-rivi: `v274 — chore: landing slop sweep (testimonialit anonymisoitu, italic-Fraunces rajattu, side-stripes pois, 8-kortti-grid asymmetriseksi)`

**Ei pushia ilman Marcelin lupaa.**

---

## Don't

- ÄLÄ koske app-puoleen (`app.html`, `js/screens/*`) — se on v275
- ÄLÄ koske brand-paletteja muuten kuin V11:n yhden token-arvon säätöön
- ÄLÄ lisää uusia visuaalisia tehosteita (glow, gradient, shadow, animation) korvaamaan poistettavia patterneja
- ÄLÄ keksi uusia nimellisiä testimonialeja "Anna H." -muodossa
- ÄLÄ käytä em-dashia uudessa suomi-tekstissä
- ÄLÄ tee Vercel-promote-pyyntöä — chore ei kuulu tuotantoon ennen muiden v270-v273 mergeä
- ÄLÄ kopioi mafy/nova-violetteja tai sinisiä — säilytä brick-aksentti

## Onnistuminen

- [ ] Baseline-screenshotit otettu ennen
- [ ] V1 + V5 + V8 + V10 toteutettu (P0:t pakollisia)
- [ ] V11 + V12 toteutettu jos aika riittää (P1:t)
- [ ] After-screenshotit otettu, visuaalinen vertailu OK
- [ ] AI-slop-checklist ajettu
- [ ] `npm run build` PASS, bundlet stagattu
- [ ] sw.js CACHE_VERSION bumpattu jos tarpeen
- [ ] 6 commitia, IMPROVEMENTS.md-rivi
- [ ] PR avattu, EI mergattu — odottaa Marcelin lupaa
