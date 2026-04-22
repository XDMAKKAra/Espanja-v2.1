# Blog Audit + Plan — Puheo Pass 3

---

## Current Blog Audit (5 posts)

All 5 posts published 2026-04-18. Blog index at `blog/index.html`.

### Post 1: `espanja-yo-koe-2026-lyhyt-oppimaara.html`
**Title:** Espanjan YO-koe 2026 — lyhyt oppimäärä, rakenne ja valmistautuminen  
**Target keyword:** `espanja yo-koe 2026 lyhyt oppimäärä`  
**Assessment:**
- Strong SEO target. This is the highest-value keyword for our audience.
- Title includes year (2026) — good for freshness, bad after September.
- Needs internal CTAs: at end of post, link to specific exercises in-app (e.g., "Harjoittele luetun ymmärtämistä →").
- No structured data (Article schema) — add `datePublished`, `author`, `description`.
- After design refresh: update visual style to match Cuaderno design system if post has custom CSS.

**Action:** Keep, add Article schema, add internal CTA to app → "Kokeile täyskoesimulaatiota →".

---

### Post 2: `ojala-subjunktiivi-yleisimmat-virheet.html`
**Title:** Ojalá ja subjunktiivi — 5 yleisintä virhettä YO-kokeessa  
**Target keyword:** `ojalá subjunktiivi`, `espanja subjunktiivi virheet`  
**Assessment:**
- Excellent topic — subjunctive is the #1 grammar difficulty for Finnish students.
- "5 yleisintä virhettä" format is highly shareable and search-friendly.
- Missing: interactive exercise link. After reading about subjunctive errors, the student should be able to practice immediately.
- Title should also include "yo-koe" for exam-intent searchers.

**Action:** Keep, add CTA → "Harjoittele subjunktiivia →" linking to grammar exercise in app.

---

### Post 3: `preteriti-vs-imperfekti-opas.html`
**Title:** Preteriti vs imperfekti — selkeä opas esimerkeillä  
**Target keyword:** `preteriti vai imperfekti`, `preterito indefinido imperfecto`  
**Assessment:**
- Second most common YO-koe grammar difficulty. Good topic choice.
- "selkeä opas" + "esimerkeillä" is exactly what students google.
- Should include a decision flowchart or table: "Koska preterit? Koska imperfekti?" — visual aids rank better.

**Action:** Keep, add decision table if not already present, add CTA → relevant grammar exercise.

---

### Post 4: `ser-vs-estar-milloin-kumpaakin.html`
**Title:** Ser vs estar — milloin kumpaakin käytetään?  
**Target keyword:** `ser vs estar`, `ser estar ero`  
**Assessment:**
- Classic topic, high search volume. Well-known difficulty.
- Risk: lots of competition for this keyword from Duolingo, SpanishDict, etc. — need depth and Finnish-language angle to rank.
- The Finnish-language angle is the moat: all English/Spanish resources don't help Finnish students think in Finnish grammar terms.

**Action:** Keep, ensure examples use Finnish explanations (not Spanish → English).

---

### Post 5: `por-vs-para-selkea-ero.html`
**Title:** Por vs para — selkeä ero ja säännöt  
**Target keyword:** `por vs para`, `por para ero espanja`  
**Assessment:**
- Good topic. Lower YO-koe frequency than subjunctive/tenses, but still appears.
- "selkeä ero" is a good Finnish search intent match.

**Action:** Keep. Add CTA → "Harjoittele por vs para →".

---

## Design System Alignment (all 5 posts)

Each post likely has its own inline CSS (inferred from diagnose.html pattern). After Pass 3:
- All posts should import `landing.css` (already done for blog/index.html).
- Remove any inline CSS that duplicates landing.css tokens.
- Add consistent nav (same component as index.html nav, or a simplified version).
- Add consistent footer with links to Privacy, Terms, Refund.
- Add Article JSON-LD schema to each post (missing from all 5).
- Add internal CTA block at end of every post: card component linking to relevant app exercise.

---

## 10 New Blog Posts

Ordered by SEO priority (search volume × conversion intent × production effort).

---

### New Post 1
**Title:** Espanjan kirjoitelma YO-kokeessa — näin se arvioidaan  
**Target keyword:** `espanja kirjoitelma yo-koe`, `espanjankielinen kirjoitelma arviointi`  
**Intent:** Student preparing writing section — directly in-product funnel  
**Word count:** 900–1100  
**Structure:**
- YTL:n kolme kriteeriä selitettynä (content, scope, accuracy)
- Pisteytystaulukko: mitä "erinomainen" vs "tyydyttävä" tarkoittaa käytännössä
- Esimerkki kirjoitelmasta ennen ja jälkeen Puheo-palautteen (lyhyt kirjoitelma, ~60 sanaa)
- CTA: "Kirjoita oma kirjoitelmasi ja saa AI-palaute →"  

**App exercise link:** Writing exercise — lyhyt kirjoitelma

---

### New Post 2
**Title:** Espanjan YO-kokeen rakenne 2026 — mitä kokeessa tulee vastaan?  
**Target keyword:** `espanja yo-kokeen rakenne`, `yo-koe espanja osat`  
**Intent:** High-level exam structure overview — entry-level funnel  
**Word count:** 700–900  
**Structure:**
- Kokeen 4 osaa: kuullun ymmärtäminen, luetun ymmärtäminen, rakenteet/sanasto, kirjoitelmat
- Aikarajat ja pistemäärät
- Mihin panostaa viimeisinä viikkoina
- CTA: "Kokeile täyskoesimulaatiota →"

**App exercise link:** Full exam simulation

---

### New Post 3
**Title:** Subjunktiivi espanjassa — täydellinen opas YO-koetta varten  
**Target keyword:** `subjunktiivi espanja`, `presente de subjuntivo`  
**Intent:** Deep grammar reference — high search volume  
**Word count:** 1200–1500  
**Structure:**
- Mikä subjunktiivi on (suomeksi selitettynä, ei "opiskele kuin espanjalainen")
- Koska subjunktiivia käytetään: halutessa, epäillessä, tunteessa, toiveessa
- 8 yleisintä lauserakennetta YO-kokeessa (ojalá, es importante que, quiero que...)
- Harjoitustehtävä: 5 lausetta täytettäväksi
- CTA: "Harjoittele subjunktiivia tekoälyn kanssa →"

**App exercise link:** Grammar drill — subjunctive

---

### New Post 4
**Title:** Espanjan sanasto YO-kokeeseen — 50 tärkeintä sanaa lyhyelle oppimäärälle  
**Target keyword:** `espanja sanasto yo-koe`, `lyhyt oppimäärä espanja sanasto`  
**Intent:** Targeted vocabulary prep — high conversion intent  
**Word count:** 600–800  
**Structure:**
- 50 sanaa temaattisesti: arki, koulu, ympäristö, terveys, yhteiskunta (YO-aihepiirit)
- Jokainen sana suomeksi + espanjaksi + esimerkkilause
- "Nämä aihepiirit toistuvat YO-kokeessa useimmin" — authority signal
- CTA: "Harjoittele sanastoa adaptiivisesti →"

**App exercise link:** Vocabulary exercise — thematic sets

---

### New Post 5
**Title:** Condicional espanjassa — ehdollinen muoto ja milloin sitä käytetään  
**Target keyword:** `condicional espanja`, `ehdollinen espanja yo-koe`  
**Intent:** Grammar reference — medium search volume  
**Word count:** 700–900  
**Structure:**
- Mitä condicional on ja milloin sitä käytetään (hypoteettiset lauseet, kohteliaisuus)
- Säännölliset vs. epäsäännölliset muodot
- YO-kokeessa esiintyvät rakenteet: "si + imperfecto, condicional"
- CTA: "Testaa condicionalia harjoitustehtävillä →"

**App exercise link:** Grammar drill — condicional

---

### New Post 6
**Title:** Miten saada M tai E espanjan YO-kokeessa — tarkat pisteytysstrategiat  
**Target keyword:** `espanja yo-koe M arvosana`, `espanja ylioppilaskirjoitukset arvosana`  
**Intent:** Grade-improvement intent — high conversion, audience already knows Puheo exists  
**Word count:** 1000–1200  
**Structure:**
- Pisteiden jakautuminen: miten 35p lyhyessä kirjoitelmassa menee B→M→E
- "Sisältö ja ymmärrettävyys" -kriteeri: mitkä pienet asiat nostavat pisteytyksen
- "Kielellinen laajuus": mitä tarkoittaa "rikas sanasto" ja miten sen näyttää
- Kirjoitelmaesimerkki: "tämä sai C:n, näin nostetaan M:ksi" — side by side
- CTA: "Kirjoita kirjoitelma ja saa YTL-pisteytys →"

**App exercise link:** Writing + AI grading

---

### New Post 7
**Title:** Espanjan kuullun ymmärtäminen YO-kokeessa — vinkit ja strategiat  
**Target keyword:** `espanja kuullun ymmärtäminen yo-koe`  
**Intent:** Specific skill prep — underserved topic  
**Word count:** 700–900  
**Structure:**
- Miten kuullu ymmärtämisosat toimivat: tehtävätyypit, aikarajat
- Strategiat: mitä kuunnella, mitä jättää huomiotta
- Harjoittelu ennen koetta: podcastit, Puheo, YLE Abitreenit-äänitiedostot
- CTA: "Harjoittele kuuntelua Puheolla →"

**App exercise link:** Listening comprehension exercise

---

### New Post 8
**Title:** Luetun ymmärtäminen espanjassa — miten vastata oikein YO-kokeessa  
**Target keyword:** `espanja luetun ymmärtäminen yo-koe`  
**Intent:** Reading comprehension skill prep  
**Word count:** 700–900  
**Structure:**
- Luetun ymmärtämistehtävien tyypit YO-kokeessa
- Lukustrategia: skim → scan → tarkat vastaukset
- Yleisimmät ansat (false cognates, distractor options)
- Harjoitustehtävä: lyhyt espanjankielinen teksti + kysymykset
- CTA: "Harjoittele luetun ymmärtämistä →"

**App exercise link:** Reading comprehension exercise

---

### New Post 9
**Title:** Viikkosuunnitelma espanjan YO-kokeeseen — 8 viikkoa ennen kirjoituksia  
**Target keyword:** `espanja yo-koe valmistautuminen`, `espanja yo-koe aikataulu`  
**Intent:** Planning intent — captures students who are serious and systematic  
**Word count:** 900–1100  
**Structure:**
- Viikko 1–2: Taitotason arvio + heikkojen alueiden tunnistus (Puheo diagnose)
- Viikko 3–4: Kieliopin fokus (subjunktiivi, preteriti/imperfekti)
- Viikko 5–6: Kirjoitelmien harjoittelu + palaute
- Viikko 7: Täyskoesimulaatio
- Viikko 8: Kertaus + henkinen valmistautuminen
- CTA: "Aloita adaptiivinen harjoittelu →"

**App exercise link:** Dashboard / study plan

---

### New Post 10
**Title:** Espanjan kieliopin 7 vaikeinta kohtaa YO-kokeessa  
**Target keyword:** `espanja kielioppi yo-koe vaikea`  
**Intent:** Broad grammar overview — entry-level funnel  
**Word count:** 800–1000  
**Structure:**
- Rankitus: subjunktiivi, preteriti/imperfekti, ser/estar, por/para, konjunktioviivi, refleksiiviset verbit, aikamuotojen sekvenssi
- Jokaisesta: 1 lauseesimerkki oikein/väärin
- "Missä kohtaa useimmat menettävät pisteitä" — data-backed (YO archives)
- CTA: "Testaa osaamisesi →" → diagnose

**App exercise link:** Grammar diagnostic / adaptive drill

---

## Blog SEO Infrastructure (all posts)

Missing from all current posts — must add in Pass 3:

1. **Article JSON-LD schema** on every post with `datePublished`, `author`, `description`, `keywords`.
2. **Breadcrumb schema**: Puheo → Blogi → [Post title].
3. **Internal linking**: Every post links to at least 2 other posts + 1 app exercise.
4. **CTA block component**: Standard "Harjoittele [aihe] Puheolla →" card at bottom of every post — uses landing.css component styles.
5. **Reading time estimate**: "Lukuaika: n. 5 minuuttia" in header. Finnish students use this.
6. **Related posts**: 2–3 suggested posts at end of article (manual links for now, no JS).
7. **Canonical URLs**: Leave as `espanja-v2-1.vercel.app` for now — domain purchase pending. Update in a separate pass once `puheo.fi` is live.
