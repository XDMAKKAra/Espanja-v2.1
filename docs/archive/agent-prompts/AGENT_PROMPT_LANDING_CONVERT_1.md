# L-LANDING-CONVERT-1 — Etusivun convert-redesign

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` kokonaan ennen kaikkea muuta — sen säännöt pätevät tähänkin (skill-set, 21st.dev-sourcing, verify-checklist, kokorajoitukset).

---

## 1. Konteksti

Käyttäjän raportti (2026-05-07): etusivu (`index.html`) ei näytä kauhean hyvältä, kurssit-osio renderöityy raa'asti. Vaade: "oikeasti hullun hyvä", convertible, "että kaikki ostaa palvelun".

**Mikä toimii nyt:**
- Hero-typografia (Geist + Inter), kontrasti, CTA-paritus
- Tokenit kunnossa (`css/landing-tokens.css` 156 riviä)
- Sektioiden rakenne: nav → hero → ongelma → tuote (pillars) → kurssit → miten (steps) → arviointi (grader) → hinnoittelu → faq → cta → footer

**Mikä on rikki / heikkoa:**
- **P0 — kurssit-osio renderöityy unstyled `<ol>`-listana.** Juurisyy: `index.html:91` `<body>`-tagilla EI ole `class="landing"`-attribuuttia, mutta `css/landing.css`:ssä on **246 sääntöä** prefiksillä `.landing ...` (mm. kaikki `.landing .courses__grid`, `.landing .course-card`, `.landing .course-card__head` jne.). Hero/nav/pillars toimivat koska niillä on prefiksittömät säännöt — kurssit-osio kirjoitettiin L-RUFLO-LOOP-3:ssa myöhemmin `.landing`-prefiksillä eikä matchaa.
  - **Korjausvaihtoehto A (suositus, 1 sanan muutos):** lisää `class="landing"` `<body>`-tagiin → kaikki 246 sääntöä aktivoituvat kerralla.
  - Vaihtoehto B (riskialttiimpi): poista `.landing`-prefiksi kurssit-osion CSS:stä — mutta silloin scoping menee muiden sääntöjen kanssa epäsymmetriseksi.
  - **Tarkista jälkikäteen** että vaihtoehto A ei riko muita säännöksiä (muut `.landing`-prefiksit tulevat samalla aktiivisiksi — pillars, steps, grader, pricing, faq, cta voivat saada uutta tyyliä jos ne ovat aiemmin osuneet vain yleiseen sääntöön). Jos rikkoo → siivoa konflikti, älä peruuta fixiä.
- Ronja-mockup hero-puolella tuntuu "AI design template" -kliseeltä. Käyttäjä haluaa siihen lopulta animoidun tuotevideon mutta video lykätään (L-LANDING-VIDEO-2 myöhemmin). **Tässä loopissa:** paranna staattista mockup-näkymää niin että se tuntuu elävältä — esim. CSS-driven mikroanimaatio (typing-effect, kursori, sykkivä accent-pilkku, tai 2-3 frame slide-loop), EI video.
- Hero-copy lupaa hyvin mutta alle-fold ei tuo tarpeeksi konkretiaa siitä mitä klikkaamalla tapahtuu
- Ei sosiaalista todistetta — käyttäjillä ei ole vielä, **älä keksi numeroita tai testimonialeja**. Käytä korvaajina: konkreettinen sisältölupaus (90 oppituntia, 8 kurssia, kaikki YO-rubriikkiin sidottu), läpinäkyvyys hinnoista (vapaa kokeilu, ei luottokorttia), tekninen lupaus ("YTL-arvosanat I/A/B/C/M/E/L, ei CEFR")
- Sektioiden visuaalinen vaihtelu vähäinen — kaikki tumma, sama spacing, ei rytmiä
- Kurssit-osion `<ol>`-rakenne ei ole convert-optimoitu vaikka se renderöityisi oikein: 8 korttia × pieni kuvaus on tylsä. Tarvitsee hierarkiaa (suositeltu polku, A→E gradient, "tästä alkaa" → "tämä on YO-koevalmiiksi")

---

## 2. Mitä tämä loop EI tee

- ❌ Älä koske `app.html`:ään tai sisäänkirjautuneeseen näkymään — tämä on PURE landing-loop
- ❌ Älä lisää Remotion-videota tai mp4/webm-videoita — käyttäjä haluaa lykätä videon kunnes app on ship-ready
- ❌ Älä keksi käyttäjäarvioita, koulujen logoja, "5 000 opiskelijaa" -numeroita, testimonialeja, NPS-lukuja — KAIKKI on keksittyä jos sitä ei ole
- ❌ Älä koske `data/courses/`-tiedostoihin — ne ovat valmiita
- ❌ Älä lisää uusia ulkopuolisia kirjastoja (GSAP, Framer Motion, AOS) — vanilla CSS + tinyt JS riittää. Olemassa oleva `data-reveal`-attribuutti viittaa että reveal-systeemi on jo paikalla — laajenna sitä, älä korvaa.
- ❌ Älä riko olemassa olevia anchor-linkkejä (#hero, #ongelma, #tuote, #kurssit, #miten, #arviointi, #hinnoittelu, #faq, #rekisteroidy-cta) — nav navigoi näillä
- ❌ Älä tee uutta routeria tai siirrä landingia muualle — index.html pysyy juuressa
- ❌ Älä lisää PostHog-trackingiä uusiin elementteihin tähän looppiin — analytics-pass erikseen

---

## 3. Skill-set (PAKOLLINEN luettavaksi ennen koodaamista)

Tämä on landing-redesign joka pyrkii Linear/Vercel/Stripe-luokan visuaaliseen tasoon. Käyttäjä on eksplisiittisesti pyytänyt että skillit ladataan ja käytetään.

### Puheo-spesifiset (PAKOLLISET, koko loopin ajan auki)
- `.claude/skills/puheo-finnish-voice/SKILL.md` — KAIKKI copy
- `.claude/skills/puheo-screen-template/SKILL.md` — spacing, motion, dark/light token-käyttö
- `.claude/skills/ui-ux-pro-max/SKILL.md` — a11y, typografia (font-pairings), 96 palettea, focus, reduced-motion, touch targets

### Frontend-taste (LATAA NÄMÄ KAIKKI ENNEN MITÄÄN UI:TA — käyttäjän pyyntö)
Käytä useaa rinnakkain — ei valita yhtä, vaan ristiinarvioi.
- `redesign-existing-projects` — **ENSISIJAINEN tähän looppiin** (auditoi nykyinen + nostaa premium-tasolle ilman että rikkoo toiminnallisuutta)
- `frontend-design` — distinctive, production-grade UI; anti-AI-aesthetic
- `design-taste-frontend` (alias `design:taste-frontend`) — Senior UI/UX Engineer, metric-based rules, hardware acceleration, balanced design eng
- `emil-design-eng` — Emil Kowalskin filosofia: invisible details, motion timing, polish
- `high-end-visual-design` — high-end agency-look, blokkaa cheap-AI-defaultit
- `gpt-taste` — editorial typography, AIDA-rakenne, ScrollTriggers (huom: ei uusia kirjastoja, sovella periaatteita CSS:llä), inline micro-images, massive section spacing
- `stitch-design-taste` — anti-generic UI, asymmetric layouts, perpetual micro-motion

**Sourcing-passin jälkeen** aja vielä `design-taste-frontend` ENNEN committia kriittisenä reviewinä.

### Education-skillit (kun tehdään promise + kurssipolun visualisaatio)
- `education/curriculum-knowledge-architecture-designer` — kurssirakenteen koherenssi näkyväksi (A→B→C→M→E porrastus)
- `education/cognitive-load-analyser` — älä ylikuormita, max 4 keskeistä elementtiä per sektio
- `education/self-efficacy-builder-sequence` — copy ei saa shame-tä eikä luvata kohtuuttomia ("Pärjää" on hyvä, "Saat L:n" olisi liikaa)

### 21st.dev-sourcing (PAKOLLINEN, per STANDARDS §3)
Hae ja screenshotta 21st.dev:stä **vähintään 2 referenssiä** näille:
1. Hero-osa SaaS-tuotteille jossa product-mockup oikealla puolella (Linear/Vercel-tasolta)
2. Pricing-vertailutaulukko 2-3 plania (vapaa vs. Pro)
3. FAQ-accordion premium-tasoa
4. Course/curriculum-list -komponentti (8 korttia, gradient-progression)
5. Step-by-step "how it works" -sektio numeroidulla aikajanalla

Lisää löydökset `IMPROVEMENTS.md`-riviin URLeineen. Jos 21st.dev ei ole saatavilla → sourcing-fallback Linear.app, Vercel.com, Stripe.com, Cal.com, Resend.com -etusivuilta (screenshotit + linkit).

---

## 4. UPDATE-lista (toteutusjärjestys)

Aja näistä mahdollisimman moni yhdessä loopissa. Jos joku UPDATE alkaa kasvaa yli 200 LOC, splittaa erilliseen looppiin (L-LANDING-CONVERT-2).

### UPDATE 1 — P0 fix: kurssit-osio renderöityy
- Lisää `class="landing"` `<body>`-tagiin (`index.html:91`).
- Aja `npm run build` ja avaa `index.html` selaimessa → tarkista että kurssit-osio näyttää grid-kortit, EI numeroitua listaa.
- Tarkista myös muut sektiot (pillars, steps, grader, pricing, faq, cta) — ole valmis korjaamaan jos `.landing`-säännöt nyt aktivoituvat ja jokin menee rikki.

### UPDATE 2 — Hero-redesign (kestää kävijän silmissä)
- **Vasen palsta:** vahvista hierarkia. Kokeile yhtä konkreettista numeroa päälle (esim. "8 kurssia · 90 oppituntia · YO-rubriikki" alaspatentina IS faktinen) — pidä vain kuitenkin maksimi 4 elementtiä per fold.
- **Oikea palsta:** Ronja-mockup elävämmäksi:
  - CSS-driven mikroanimaatio: typing-effect chat-kuplassa, blinking caret, sykkivä accent-piste, tai 3-frame slide-cycle joka kiertää (kirjoitustehtävä → arviointi → seuraava ehdotus). Kaikki @prefers-reduced-motion: pause.
  - Mockup-frame näyttää selkeästi "puheo.fi/oma-sivu" → harkitse vaihtoa "puheo.fi/kirjoitus" tai oikean SPA-screenin matkimiseen
  - **EI uusi kuvitus tähän looppiin** — pidä olemassa oleva mockup-rakenne, paranna sitä
- **Trust-strip alla CTA:n** ("Ei luottokorttia · Suomen kielellä · 8 kurssia, 90 oppituntia · Toimii selaimessa") — tarkista että kaikki neljä ovat true ja konkreettisia, älä lisää keksittyjä trust-signaaleja
- **Visuaalinen rytmi:** harkitse hienovaraista gradient-blur tai noise-overlay hero-pohjalle — vältä geneeristä radial-glow kliseeä

### UPDATE 3 — Kurssit-osio (entinen `<ol>`)
- Korvaa numeroitu lista visuaalisesti porrastetulla polulla:
  - Vaihtoehto A: 8 korttia 4-col grid, jokaisella YO-tason badge (A/B/C/M/E) joka kasvaa kokoluokassa kurssin mukana
  - Vaihtoehto B: aikajana / staircase joka näyttää "tästä aloitat → tähän pääset" -progression A:sta E:hen
  - Suositus: **B**, koska se vastaa kysymykseen "mitä saan?" eikä vain luettele
- Käytä `lib/curriculumData.js`:n kanonisia tietoja (otsikot, kuvaukset, lesson_count, target_grade) — ÄLÄ keksi sisältöä
- Korosta K8 ("YO-koevalmiiksi") visuaalisesti — se on lupaus jonka käyttäjä ostaa

### UPDATE 4 — Sektioiden rytmi (problem, pillars, steps, grader, pricing, faq, cta)
- Auditoi spacing-skaalaus: nykyinen padding voi olla joko liian väljä tai liian tiukka — käytä token-systeemiä (`--space-12`/`--space-16`/`--space-24`).
- Pinta-vaihtelu: vuorottele `--surface-1` (oletus dark) ja `--surface-2` (hieman vaaleampi tinted) sektioiden välillä → sivu ei tunnu yhdeltä isolta tummalta lakanalta
- Pillars-osio (`#tuote`): tarkista että kortit eivät ole pelkkä emoji + tekstipari — jokaisessa pitäisi olla konkretia (esim. "AI tarkistaa sanaston" + lyhyt esimerkki: "*hablás* → *hablas*, perustelu suomeksi")
- Steps-osio: numeroitu visuaalinen aikajana (1→2→3→4) connectorilla, ei pelkkä pystylista
- Pricing: korosta vapaa CTA samanlaisena kuin Pro CTA — älä piilota free-tier
- FAQ: accordion 4-6 kysymystä (mitä YO-rubriikki tarkoittaa, eroaako CEFR:stä, mitä tekoäly tekee, paljonko aikaa pitää käyttää, voinko peruuttaa, toimiiko mobiilissa) — kysymykset oikeita
- CTA-osio (#rekisteroidy-cta): viimeinen koukku — pidä yksi selkeä toiminta, ei kahta

### UPDATE 5 — Polish-passi
- `prefers-reduced-motion`: kaikki uudet animaatiot pause:lla
- `prefers-color-scheme: light` — TÄMÄN LOOPIN VOI SKIPATA jos light-version on rikki, mutta merkitse IMPROVEMENTS.md:hen seuraavaan looppiin
- Mobile (375): testa että kurssit-osio + steps-osio eivät murru. Mobile-rytmi voi tarvita oman spacing-säädön
- Lighthouse / axe-sweep — tavoite 0 violations

---

## 5. Verifiointi (per STANDARDS §4)

1. **`graphify update .`** koodi-muutosten jälkeen
2. **axe-core** index.html @ 1440 + 768 + 375 → 0 violations
3. **Playwright screenshot** kaikilla 3 viewportilla → liitä IMPROVEMENTS.md-riviin tiedostonimet
4. **`design-taste-frontend` review** screenshoteista — listaa löydökset, korjaa kaikki "AI-generic" -merkit
5. **`npm run lint`** ja **`npm test`** — 0 uutta erroria/regressiota
6. **SW-bumppi** koska `index.html` + `css/landing.css` ovat STATIC_ASSETS:ssa
7. **IMPROVEMENTS.md** — yksi rivi per UPDATE prefiksillä `[YYYY-MM-DD L-LANDING-CONVERT-1]`, mainitse skillit + 21st.dev-URLit
8. **AGENT_STATE.md** — päivitä `Last completed loop` ja `Next loop`
9. **BUGS.md siivous** — tämän loopin yhteydessä: poista BUGS.md:stä P1-1 (dashboard partial done), P1-3 (results partial done), P1-5 (results contrast partial done) -merkinnät jos ne ovat enää `partial`-tilassa eikä uusia ongelmia. Lisää AUDIT-3 ✓-merkintä (jo shipattu PR #30:ssa).

---

## 6. Guardrailit

- **ÄLÄ committaa Gitiin** — käyttäjä commitoi ja deployaa itse
- **ÄLÄ deployaa** Vercelliin — käyttäjä deployaa
- **ÄLÄ kirjoita brand-asiakaskeksintöjä** — vain konkreettiset, todennettavissa olevat lupaukset
- **ÄLÄ kasvata `index.html`:ää yli 1300 riviin** — jos uhkaa kasvaa, ehdota komponentointia (esim. siirrä faq:n datat erilliseen JSON:iin) erilliseen looppiin
- **ÄLÄ kasvata `css/landing.css`:ää yli 2400 riviin** — sama logiikka, splittaa `css/landing-courses.css` jne. erilliseen looppiin jos tarvitsee
- **Pakollinen lukemistus istunnon alussa** (per PLANNER §1): CLAUDE.md, AGENT_PROMPT_STANDARDS.md, AGENT_STATE.md, BUGS.md, IMPROVEMENTS.md, graphify-out/GRAPH_REPORT.md
- **Yksi muutos kerrallaan committaa-ehdokkaaksi** — käyttäjä review:ää ennen pushia. Tee yksi diff per UPDATE.

---

## 7. Lopputuotteen kriteeri

Kun loop on valmis, käyttäjän pitää pystyä avaamaan landing-sivu paikallisesti ja sanoa: "Tämä näyttää siltä kuin Linear tai Stripe olisi tehnyt, ei kuin AI-template." Jos vasta puolitiehen — splittaa L-LANDING-CONVERT-2 jatkamaan.
