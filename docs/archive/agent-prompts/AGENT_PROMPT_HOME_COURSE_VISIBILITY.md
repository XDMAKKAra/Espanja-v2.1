# L-HOME-COURSE-VISIBILITY — Etusivulle näkyväksi: 8 kurssia × 90 oppituntia

> **Aja Claude Codessa.** Lue `AGENT_PROMPT_STANDARDS.md` ennen kaikkea muuta — kaikki sen säännöt pätevät tähänkin looppiin (skill-set, 21st.dev-sourcing, verify-checklist, kokorajoitukset).

---

## 1. Konteksti

Sisältö-vaihe on valmis: `data/courses/kurssi_{1..8}/lesson_{1..N}.json` sisältää 90 generoitua, validoitua oppituntia (K1=10, K2=10, K3=11, K4=12, K5=11, K6=12, K7=12, K8=12). Kurssirakenne on määritelty `lib/curriculumData.js`:ssä (otsikot, kuvaukset, YO-tasot A→E).

**Ongelma:** Etusivulla (`index.html`, kirjautumaton näkymä) ei mainita kurssien sisältöä mitenkään. Hero-rivillä on vain "8 kurssia, 90 oppituntia" — se ei kerro mitä kursseissa on. Kävijä ei näe että K1 = perheet ja preesens, K6 = ympäristö subjunktiivilla, K8 = YO-koevalmiiksi.

**Tavoite:** Tehdä etusivulle näkyväksi se, mitä Puheossa nyt todella on. Muoto, sijoitus ja konkretiataso on agentin päätös — ei mitään ennalta määritettyä komponenttia.

---

## 2. Mitä tämä loop EI tee

- ❌ Älä koske `app.html`:ään tai sisäänkirjautuneen näkymään
- ❌ Älä keksi sisältöä mitä `lib/curriculumData.js` ei kerro — kurssit, otsikot, kuvaukset ja tasot ovat kanonisia siellä
- ❌ Älä lisää käyttäjäarvioita, kouluja, "5 000 opiskelijaa" -tyyppisiä keksittyjä numeroita
- ❌ Älä koske `data/courses/`-tiedostoihin — ne ovat valmiita
- ❌ Älä aja BUGS.md:n korjauksia — niillä on oma loop (`AGENT_PROMPT_RUFLO_LOOP.md`)

---

## 3. Skill-set (pakollinen luettavaksi ennen koodaamista)

Per `AGENT_PROMPT_STANDARDS.md` §1–3, lue ja sovella:

**Puheo-spesifiset (PAKOLLISET):**
- `.claude/skills/puheo-finnish-voice/SKILL.md` — KAIKKI copy
- `.claude/skills/puheo-screen-template/SKILL.md` — layout/spacing
- `.claude/skills/ui-ux-pro-max/SKILL.md` — **PAKOLLINEN tämän loopin koko ajan** — a11y, focus, motion, kontrastit, touch targets, font-pairings. Avaa SKILL.md ennen koodia ja pidä auki.

**Frontend-makua (PAKOLLINEN ennen mitään uutta UI:ta):**
- `design:taste-frontend` — **ENSISIJAINEN** jos asennettu. Käytä KAIKKEEN frontend-uudistukseen tässä loopissa: hierarkia, spacing-skaala, palette-restraint, typography-pairings, "näyttääkö tämä Linear/Vercel-tasolta vai geneeriseltä AI-pohjalta". Aja sourcing-passin jälkeen ja uudelleen ennen committia.
- Jos `design:taste-frontend` EI ole saatavilla → fallback `design:design-critique` + `ui-ux-pro-max`-yhdistelmä (per STANDARDS §2 "Käyttäjän erityispyyntö"). Kerro IMPROVEMENTS.md-rivissä kumpaa käytit ja miksi.

**Design-plugin (kutsu nimellä):**
- `design:design-critique` — pakollinen sourcing-passin jälkeen + valmiille muutokselle (vaikka taste-frontend olisi käytössä — toinen silmäpari)
- `design:ux-copy` — kaikkiin uusiin teksteihin, otsikoihin, CTA-labeleihin
- `design:accessibility-review` — pakollinen ennen loop:n päättämistä
- `design:design-system` — jos lisäät uuden tokenin tai komponentin

**Marketing-plugin:**
- `marketing:brand-review` — kun copy on valmis, ennen committia
- `marketing:draft-content` — jos kirjoitat pidempää copya (esim. kurssikohtaista lyhyttä kuvausta)

**Anthropic:**
- `anthropic-skills:brand-guidelines` — jos teet uutta kuvitusta tai grafiikkaa

**Education-skillit:** Eivät relevantteja tähän loopiin (ei tehtäväsuunnittelua eikä pedagogiikkaa). Älä avaa.

---

## 4. 21st.dev-sourcing (PAKOLLINEN — TARKISTA AINA ENNEN KOODIA)

**Sääntö:** Ennen kuin kirjoitat ensimmäistäkään HTML-tagia tai CSS-luokkaa uudelle komponentille, **käy 21st.devissä ja katso onko siellä jotain sopivaa**. Tämä ei ole valinnainen vaihe.

Per STANDARDS §3:

1. **Aja Playwrightilla** `21st.dev/s/<term>` — relevantit termit tähän loopiin: `course-card`, `program-grid`, `curriculum`, `lesson-list`, `roadmap`, `feature-grid`, `learning-path`, `syllabus`, `module-card`. Kokeile 3–5 termiä, älä yhtä.
2. **Screenshot 2–3 kandidaattia** → `references/landing/courses-21stdev/` (uusi alikansio)
3. **Pick the most restrained dark option** joka matchaa Puheon Linear-tier-estetiikan (säästeliäs accent, ohut viiva, ei loud-glow, ei neon)
4. **Port React+Tailwind → vanilla CSS**, käyttäen olemassa olevia tokeneita (`--accent`, `--surface`, `--text`, `--r-lg`, `--sp-*`)
5. **Cite EXACT 21st.dev component URL** IMPROVEMENTS.md-rivissä — ei sitä että "katsoin 21st.dev:tä", vaan tarkka URL siitä mistä portattiin

**Jos 21st.devistä ei löydy sopivaa**, fallback järjestyksessä per STANDARDS §3:
1. Magic UI (`magicui.design`)
2. shadcn (`ui.shadcn.com`)
3. Aceternity UI
4. HyperUI / Tailwind UI free

Sama workflow joka tasolla: screenshot → port → cite. **Älä keksi tyhjästä. Älä päädy "tein oman variantin" ilman lähdettä.**

**Olemassa oleva pattern jota voi laajentaa ilman uutta sourcing-passia:** `.pillars__grid` (3-card → 8-card responsiivisesti). Mutta jos haluat segmented-control taso-filtteröintiin, accordion-näkymää tai vastaavaa _uutta_ patternia, sourcing-passi vaaditaan.

**Jos taste-frontend-skilli on käytössä**, aja se 21st.dev-kandidaattien yli ja anna sen valita restrainedinen vaihtoehto — se on koulutettu juuri tähän valintaan.

---

## 5. Datan lähde (älä keksi mitään)

Kaikki kurssitiedot ovat `lib/curriculumData.js`:n `CURRICULUM_KURSSIT`-arrayssa. Lue se ja käytä sitä kanonisena lähteenä:

```js
[
  { key: "kurssi_1", title: "...", description: "...", level: "A|B|C|M|E", lesson_count: N },
  ...
]
```

Levelit ovat YO-arvosanoja (I/A/B/C/M/E/L), EI CEFR-tasoja. Per käyttäjän periaate: "YO-arvosanat (I/A/B/C/M/E/L), EI CEFR".

Jos haluat näyttää lyhyemmän/pidemmän kuvauksen kuin `description`-kentässä on, kirjoita uusi yhteenveto suoraan `index.html`:ään tai uuteen JSON-tiedostoon — älä mutatoi `lib/curriculumData.js`:ää (siinä on backend-yhteys).

---

## 6. Brand-rajat (`puheo-finnish-voice` muistutus)

- Ei käännöskonemaista suomea
- Ei "valmistaudu unelmien YO-arvosanaan" -tyyppistä myynti-Englishiä suomennettuna
- Numerot konkreettisina: "10 oppituntia, 12 oppituntia" — ei "kymmeniä harjoituksia"
- "Tämä YO-kokeessa" / "YO-kokeessa kysytään" -kytkös on Puheon brand-promise — käytä jos sopii kurssikuvaukseen

---

## 7. Verify-checklist (per STANDARDS §4)

Loop päättyy nämä tehden:

1. **21st.dev-sourcing-passi tehty** — exact URL kirjattu IMPROVEMENTS.md-riville (jos uusi UI-komponentti)
2. **`ui-ux-pro-max`-skilli avattu ja sovellettu** koko loopin ajan
3. **`design:taste-frontend` ajettu** 21st.dev-kandidaattien yli + valmiille toteutukselle (tai dokumentoitu fallback `design:design-critique` + `ui-ux-pro-max`)
4. **axe-core sweep** `index.html`:llä @ 1440 + 768 + 375 → 0 violations
5. **Playwright screenshot + design:design-critique** etusivun uudella osiolla @ 1440 + 375 → applya feedback
6. **design:accessibility-review** pakollinen ennen "valmista"
7. **marketing:brand-review** uudelle copylle ennen committia
8. **`marketing:draft-content`** jos uusia kappaleita / kurssikuvauksia
9. **IMPROVEMENTS.md** — 1 rivi, prefix `[2026-MM-DD L-HOME-COURSE-VISIBILITY]`, mainitsee skillit (ml. ui-ux-pro-max, taste-frontend tai fallback) + 21st.dev-URLit
10. **AGENT_STATE.md** — päivitä `Last completed loop` + `Next loop`
11. **SW-bumppi** jos `index.html` tai `css/landing.css` muuttuivat (STATIC_ASSETS)
12. **Tests:** `npm test` → 1064/1064 ✓ (ei pitäisi koskea testejä, mutta varmista)

---

## 8. Mitä EI saa tehdä

Per STANDARDS §5 + tämän briefin §2:

- ÄLÄ committaa Gitiin — käyttäjä tekee sen
- ÄLÄ deployaa — käyttäjä tekee sen
- ÄLÄ koske `app.html`:ään, `js/screens/curriculum.js`:ään tai sisäänkirjautuneen näkymään
- ÄLÄ keksi user-arvosteluja, koulupartnereita, "5000 opiskelijaa" -lukuja
- ÄLÄ lisää uutta JS-bundlia ilman tarvetta — staattinen HTML+CSS riittää tähän

---

## 9. Loop-tunniste

`L-HOME-COURSE-VISIBILITY` — yhden ajon loop, ei jatko-osia.
