# BRIEF: Onboarding — diagnostic-first + multi-select + biografia (L-V293-ONBOARDING-DIAGNOSTIC-1)

**Päivä:** 2026-05-23
**Loop:** L-V293-ONBOARDING-DIAGNOSTIC-1
**Prioriteetti:** P0 (L-V292 mainissa ensin)
**Koko:** iso (jaettava 2 committiin: UI + mini-YO-sisältö)
**Skill-stack:** `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`, `cognitive-load-analyser`, `criterion-referenced-rubric-generator`, `practice-problem-sequence-designer`

---

## Tausta ja päätös

Puheo-onboarding lisää **personalisaatio-vaiheen** jonka tulos räätälöi käyttäjän kurssipolun. Council-päätös (2026-05-23):
- **EI 5–12 kysymyksen mini-mc-testiä** — ei kerro tarpeeksi
- **EI täyttä YO-koetta** (~3,5 h) — kukaan teini ei tee
- **Mini-YO ~15 min**, skippattava mut hyvällä motivoinnilla
- **Multi-select kurssit + arvosanat** (mikä tahansa kombo, ei pakko peräkkäin)
- **Biografia** (heritage / asunut / käyttötiheys)
- **Oppikirja-disambiguator** vain jos signaali jää epäselväksi (kuvakannet, ei tekstinimet)

Käyttäjän direktiivi: *"Marcel puhuu espanjaa kotona ja kävi nuo kurssit, ei ehkä kuitenkaan osaa oikeinkirjoitusta. Hänelle tulee taitotason arvio, parannusehdotuksia, suunnitelma ja kurssi räätälöidään hänen mukaan."*

## Onboarding-flow

**Ennen tätä loopia on:** kielivalinta (jo olemassa onboardingV3:ssa).

Uusi flow tämän jälkeen, järjestyksessä:

### Step 1: Mini-YO -taso-arvio (skippattava + pause-resume)

**Intro-näkymä:**
- Otsikko (General Sans semibold, ei italic): "Räätälöidään sinun polkusi"
- Sub: "~30 min taso-arvio kattaa kielioppi, luetun ymmärtäminen ja kirjoittaminen. Saat henkilökohtaisen 3 viikon suunnitelman ja säästät tunteja koska et harjoittele sitä mitä jo osaat. Voit jatkaa myöhemmin missä jäit."
- CTA primary (brick #A0341F): "Aloita taso-arvio"
- Sekundaariset infot pienemmällä:
  - "Voit pilkkoa testin useaan istuntoon"
  - "Kirjoitelma-osan voi skipata jos kiire"
- Skip-link, pienempi, alaosassa: "Skippaa kokonaan, palataan myöhemmin"
- (Jos skippaa: jatka Step 2:een, merkitse `mini_yo_status = 'skipped'`, palautetaan kutsuva CTA 3 päivän käytön jälkeen)
- (Jos pauseaa: tallentaa progressin Supabaseen, palautuu samalle stepille kun avaa appin seuraavaksi)

**Testi-sisältö** (kolme osaa, kaikki samalla istunnolla mut pause+resume sallittu — UI tallentaa per-kysymys progressin että käyttäjä voi palata):

**Osa A — Rakenne + sanasto (~15 min, kattaa KAIKKI kielioppi-aiheet)**

Pakko testata kaikki YO-koe-relevantit kielioppi-aiheet, ei pelkkä osajoukko. Per kieli oma kattava lista:

**Espanja (n. 25 kysymystä):**
- ser vs estar (2 kpl)
- gustar-rakenne ja indirekti pronominit (2 kpl)
- preesensin epäsäännölliset (1 kpl)
- preteriti säänn + epäsäänn (3 kpl)
- imperfekti (2 kpl)
- preteriti vs imperfekti — YO-klassikko (3 kpl, eri konteksteja)
- futuuri (2 kpl)
- konditionaali (1 kpl)
- pluskvamperfekti (pluscuamperfecto) (1 kpl)
- subjunktiivin preesens (3 kpl, eri laukaisijoita: ojalá, es importante que, dudo que)
- subjunktiivin imperfekti (1 kpl)
- si-lauseet (kaikki kolme tyyppiä: presente + futuro / imperfecto subj + condicional / pluscuamp subj + condicional perfecto) (2 kpl)
- direct + indirect object pronouns (1 kpl)
- relatiivipronominit (que, quien, donde, lo que) (1 kpl)

**Saksa (n. 25 kysymystä):**
- artikkelit ja sijat (Nom/Akk/Dat/Gen) (3 kpl)
- Präsens säänn + epäsäänn (2 kpl)
- Perfekt haben/sein-jako (3 kpl)
- Präteritum (2 kpl)
- V2-sananjärjestys + sivulauseet weil/dass/wenn (3 kpl)
- modaaliverbit (1 kpl)
- Futur I (1 kpl)
- Passiv (werden + Partizip II) (2 kpl)
- Konjunktiv II kohteliaisuusmuodot (2 kpl)
- Konjunktiv II wenn-Satz (1 kpl)
- Plusquamperfekt + indirekte Rede (2 kpl)
- Genitiv perustasolla (1 kpl)
- prepositioiden + sijojen yhdistelmät (1 kpl)
- adjektiivitaivutus (1 kpl)

**Ranska (n. 25 kysymystä):**
- définite/indéfinite/partitive articles (du/de la/des) (2 kpl)
- accord genre/nombre (2 kpl)
- présent säänn + epäsäänn (être/avoir/aller/faire) (2 kpl)
- passé composé avoir/être-jako (3 kpl)
- partisiipin accord (1 kpl)
- imparfait (2 kpl)
- passé composé vs imparfait (3 kpl)
- futur simple + futur proche (2 kpl)
- conditionnel présent + passé (2 kpl)
- subjonctif présent (laukaisijat: il faut que, je veux que, bien que) (3 kpl)
- plus-que-parfait (1 kpl)
- si-hypoteesilauseet (kaikki kolme tyyppiä) (2 kpl)
- pronoms relatifs (qui, que, dont, où) (1 kpl)
- subjonctif advanced (1 kpl)

Sekoitus mc + täydennys: ~70 % monivalintaa (nopea), ~30 % verbimuoto-täydennys (testaa tuotantoa). Vaikeustaso jakautuu A→L: alkuosa A-tason, keskiosa B/C-tason, loppuosa M/E/L-tason → näkee missä oppilas on.

Tehtävät otetaan: jos kieli=es, käytä `data/diagnostic/es/part_a_grammar.json` jne. **Tämä sisältö PITÄÄ GENEROIDA tämän loopin commit 2:ssa** käyttäen `pedagogy/{kieli}-RUBRIC.md`:n virhetypologiaa distractor-vaihtoehtoihin.

**Osa B — Luetun ymmärtäminen (~10 min, voi olla pidempi teksti)**

Käyttäjän direktiivi: ei tarvitse olla pari lausetta, voi olla pidempi.

Per kieli 1 teksti, ~250–400 sanaa (lähempänä YO-kokeen tyypillistä reading-task-pituutta). Aihe: yleinen ajankohtainen tai kulttuurinen aihe (ei liian tekninen, ei liian helppo). 6–8 ymmärtämiskysymystä:
- 3–4 sisällön ymmärrys (mitä tekstissä sanottiin)
- 1–2 päättely (mitä tekstistä voi päätellä)
- 1–2 sanaston päättely kontekstista (sanan merkitys lauseyhteydestä)
- 1 päätelmä koko tekstistä (pääajatus)

Mittaa: passiivinen sanasto, lukunopeus, ymmärtämissyvyys (ei vain pintamerkityksiä).

**Osa C — Kirjoitelma (~7 min)**

1 prompt suomeksi, joka houkuttelee käyttämään useita kielioppi-aiheita:
- Espanja: "Kirjoita 60–100 sanaa: kuvaile mitä teit viime viikonloppuna ja mitä aiot tehdä ensi viikonloppuna." → testaa preteriti + futuuri + arjen sanasto
- Saksa: "Kirjoita 60–100 sanaa: kerro miten vietit lomasi ja mitä haluaisit tehdä tulevaisuudessa." → testaa Perfekt + Konjunktiv II
- Ranska: "Écrivez 60–100 mots: décrivez votre weekend dernier et vos projets pour l'avenir." → testaa passé composé + futur

Käyttää olemassa olevaa `routes/writing.js` POST `/grade-writing` -reittiä mutta uudella diagnostic-rubric:lla:
- AI-arvio palauttaa **per dimensio**: oikeinkirjoitus (0–1), kielioppi-vakautus per aihe (mitä rakenteita käytti ja oikein), aktiivinen sanasto (0–1), kohdistettujen rakenteiden hallinta (käyttikö preteritia + futuuria oikein?)
- Skippattava jos käyttäjä ei jaksa kirjoittaa: arvio tehdään silloin pelkän A+B-datan perusteella, varoituksella "kirjoitustaitosi arvio epävarma — kannattaa palata tähän myöhemmin"

**Yhteensä mini-YO-aika: ~32 min jos kaikki tehdään kerralla.** Tämä on enemmän kuin alkuperäinen 15 min ehdotus, mutta vastaa käyttäjän vaatimusta "kaikki kielioppi pitää testata + luetun voi olla pidempi". Tasapainotetaan pause+resume-mekanismilla:
- Joka kysymyksen jälkeen progress tallentuu Supabaseen (`mini_yo_progress`-taulu)
- Käyttäjä voi sulkea välilehden ja palata — testi jatkuu missä jäi
- UI näyttää "Osa A: 12/25 valmis · Voit jatkaa myöhemmin"
- Sessio voi pilkkoutua 3–4 osaan käyttäjän tahdissa

**Kuullun ymmärtäminen (Osa D) — EI tähän loopiin.** YO-kokeen kuullun ymmärtäminen on iso osa (~30 % kokonaispisteistä), mutta vaatii audio-tiedostot ja audio-player-UI:n. Tehdään myöhemmin omana loopina **L-V295-MINI-YO-KUULLUN-1**. Sen ajaksi: skill-profile merkitsee `oral_comprehension = unknown_audio` ja reasoner käyttää biografista signaalia (heritage speaker → korkea, ei kokemusta → matala oletus).

### Step 2: Multi-select kurssit + arvosanat

**Näkymä:** 8 korttia (K1–K8), checkbox kullekin. Oletus: kaikki rastitettu pois. Käyttäjä rastii ne joita on käynyt, missä tahansa kombossa (esim. [3,4,6,7]).

Per rastittu kurssi: drop-down arvosana 4–10 + "en muista" -optio. Pakollinen jos rastittu.

Korteissa näkyy: kurssi-numero, kurssi-otsikko ("Kurssi 3 — Mitä tein, preteriti"), 1-rivinen kielioppi-tiivistelmä.

### Step 3: Biografia

3 kysymystä, radio-buttonit:

1. **Puhutko kieltä kotona?** Kyllä / Ei / Vähän
2. **Oletko asunut maassa jossa kieltä puhutaan?** Yli vuoden / 1–12 kk / Lyhyitä lomamatkoja / En
3. **Kuinka usein käytät kieltä viimeisen vuoden aikana?** Päivittäin / Viikoittain / Kuukausittain / Hyvin harvoin

### Step 4: Oppikirja-disambiguator (vain jos tarvitaan)

**Logic:** Näytä tämä step **vain jos** kurssi-data + diagnostinen testi jättää signaalin epäselväksi. Esim:
- Käyttäjä kävi K6:n, sai 8 → diagnostinen testi näytti subjunktiivi-aukon → epäselvyys: opettiko opettaja subjunktiivin K6:ssa vai ei
- Yhdistetty kysely tarkentaa: mikä oppikirja → grammar-mapping kertoo todennäköisesti

**Näkymä jos näytetään:**
- 3 kuvakanteta per kieli (top-3 suosituinta — ES: Mi mundo, ¡Acción!, Otavan vastaavat)
- "Muu" ja "En muista" equal-weight optioina, ei piilossa
- Yhden lauseen apuviesti: "Ei haittaa jos et muista, taso-arvio jo kertoo paljon"
- Jos käyttäjä valitsee "Muu": pieni vapaa-tekstikenttä (lokitetaan analytiikkaan)

**Jos signaali on jo selvä step 1–3:n jälkeen:** ohita tämä step kokonaan.

### Step 5: Yhteenveto + suunnitelma-preview

Käyttäjälle näytetään (ENNEN kuin appiin pääsee):
- "Sinun vahvuutesi: [lista 2–4 aiheesta]"
- "Sinun kehittämiskohteesi: [lista 2–4 aiheesta]"
- "Ehdotettu 3 viikon polku: [3 lyhyttä lausetta]"
- CTA: "Aloita oppimispolku" → pääsee appiin, polku tallennettu

(Tämän tuottaa L-V294-reasoner — tässä loopissa rakennetaan vain UI-rakenne joka näyttää reasonerin output:n.)

## Tietomallin päivitykset

Uudet Supabase-taulut:

```sql
-- Pää-taulu: lopullinen diagnostic-tulos
CREATE TABLE user_onboarding_diagnostic (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  language text not null check (language in ('es', 'de', 'fr')),
  mini_yo_status text not null check (mini_yo_status in ('completed', 'partial', 'skipped')),
  mini_yo_part_a_scores jsonb,  -- per topic: { preterite: 0.8, subjunctive: 0.2, ... }
  mini_yo_part_b_score numeric,
  mini_yo_part_c_writing jsonb,  -- {orthography, grammar, vocab, used_grammar_topics}
  courses_completed integer[] not null default '{}',
  course_grades jsonb not null default '{}',  -- {3: 8, 4: 9, 6: 7, 7: 8}
  biography jsonb not null default '{}',  -- {home_usage, lived_abroad, frequency}
  textbook_key text,  -- nullable, vain jos disambiguator näytettiin
  inferred_skill_profile jsonb,  -- L-V294 täyttää tämän
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Resume-taulu: per-kysymys progress jotta pause-resume toimii
CREATE TABLE mini_yo_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  language text not null,
  part text not null check (part in ('a_grammar', 'b_reading', 'c_writing')),
  question_index integer not null,
  question_id text not null,
  user_answer jsonb,  -- vastaus, riippuu kysymystyypistä
  is_correct boolean,  -- null jos AI:n arvioitavissa (kirjoitelma)
  answered_at timestamptz default now(),
  unique(user_id, language, part, question_index)
);

ALTER TABLE user_onboarding_diagnostic ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_yo_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own diagnostic" ON user_onboarding_diagnostic FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own diagnostic" ON user_onboarding_diagnostic FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own diagnostic" ON user_onboarding_diagnostic FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users manage own progress" ON mini_yo_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX mini_yo_progress_user_lang_idx ON mini_yo_progress (user_id, language, part);
```

**Aja migraatio `mcp__claude_ai_Supabase__apply_migration` -työkalulla** — älä jätä SQL-editori-toimia käyttäjälle (per `feedback_migrations_via_mcp`).

## Mini-YO -sisältö (Step 1 testi-tiedostot)

Kirjoita testin sisältö 3 tiedostoon per kieli:
- `data/diagnostic/{lang}/part_a_grammar.json` (~25 mc + täydennys, kattaa KAIKKI yllä listatut kielioppi-aiheet kielen mukaan)
- `data/diagnostic/{lang}/part_b_reading.json` (1 pidempi teksti 250–400 sanaa + 6–8 kysymystä)
- `data/diagnostic/{lang}/part_c_writing.json` (1 prompt + diagnostic-rubric joka ohjaa AI-arviota)

**Tämä on EXERCISE/LESSON-työtä** — käytä `practice-problem-sequence-designer` + `variation-theory-task-designer` -skillejä. Espanjan osalta käytä `pedagogy/RUBRIC.md`:n YTL-tyyppistä lähestymistä. Saksalle + ranskalle käytä `pedagogy/saksa-RUBRIC.md` + `pedagogy/ranska-RUBRIC.md`.

**Part A -kriteerit:**
- Jokainen kielioppi-aihe (lista yllä per kieli) testataan vähintään 1 kpl, useimmat 2–3 kpl
- Jokainen mc-tehtävä testaa **yhden** kielioppi-aiheen — ei sekoituksia (yksi aihe per tehtävä jotta voidaan attribuoida virhe oikein)
- Distractor-vaihtoehdot heijastavat tyypillisiä virheitä (per `pedagogy/{kieli}-RUBRIC.md` top-virhetypologia)
- Vaikeustaso jakaantuu A→L-asteikolla: helpoimmat ensin, vaikeimmat lopussa (välttää early-frustration)
- Sisältö **ei ole** generoituja AI-lauseita — käytä YTL:n julkisia esimerkki-koetehtäviä, oppikirjojen julkisia esimerkkejä, tai opettaja-tason mallia
- JSON-rakenne sallii kysymyksen tunnistaa per topic: `{ id, topic, level, type: 'mc'|'fill', question, options?, answer, distractor_rationale? }`

**Part B -kriteerit:**
- Teksti 250–400 sanaa (lähempänä YO-koe-tyyppistä pituutta)
- Aihe ajankohtainen mut ei poliittinen tai kontroversaalinen (ympäristö, teknologia, kulttuuri, ruoka, matkailu)
- Sisältää sanoja eri vaikeustasoilta (varmistaa että passiivinen sanasto-arvio toimii)
- 6–8 kysymystä: 3–4 sisältö, 1–2 päättely, 1–2 sanaston päättely kontekstista, 1 pääajatus
- Kysymys-tyypit: mc 4 vaihtoehdolla TAI lyhyt suomenkielinen vastaus (~5–15 sanaa) jonka AI arvioi

**Part C -kriteerit:**
- Prompt **suomeksi** (helpompi käsittää) mutta käyttäjä vastaa kohdekielellä
- Prompt-suunnittelu pakottaa luonnollisesti käyttämään 2–3 testattavaa rakennetta (preteriti+futuuri, tai Perfekt+Konjunktiv II, tai passé composé+futur)
- Rubric ohjaa AI:ta arvioimaan **per dimensio** (ei kokonaisarviota): orthography_score, grammar_score, vocab_score, completeness_score, plus boolean-flagit per kohdistettu kielioppi-rakenne ("käyttikö preteritia ja oliko se oikein")
- AI-vastauksen pyyntö palauttaa JSON: `{ orthography: 0.7, grammar: 0.5, vocab: 0.8, completeness: 1.0, used_topics: { preterite: { used: true, correct: true }, future: { used: false } }, errors: [...] }`

## Vältä nämä (anti-slop + UX-virheet)

| Älä | Miksi |
|---|---|
| Em-dash `—` suomi-tekstissä | `humanizer` |
| Italic Fraunces missään | L-V291 poisti Fraunces:n |
| Mono UPPERCASE eyebrows | Sentence-case |
| "Ladataan…" italicilla | Skeleton |
| Identical 4-card grid | Multi-select-kurssit asymmetrisesti |
| Pakollinen kirjoitelma | Skippattava jos käyttäjä ei jaksa |
| Pelottava framing "TESTI" | Lämmin "räätälöinti" / "taso-arvio" |
| Liian pitkä progress-bar | Jaa selkeisiin osiin (1/4, 2/4, 3/4, 4/4) |
| Kysymyksiä ilman kontekstia "miksi kysytään" | Jokainen step kertoo lyhyesti miksi se on tärkeä |
| Stat-walls "olet tasolla B1.2" | Sentence-case "olet noin C-arvosanan tasolla" |

## Mitä EI muuteta tässä loopissa

- Kielivalinta (jo onboardingV3:ssa)
- Tilin luonti (email/password tai oauth)
- Maksuvaihe (Stripe — eri loop kokonaan)
- App-shell topbar, sidebar, jne (L-V287 hoiti)
- Reasoner-logiikka (L-V294)
- Exercise-painotuslogiikka (L-V294)

## Testit

```js
// tests/e2e-onboarding-diagnostic.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
  await page.setViewportSize({ width: 1440, height: 900 });
});

test('user can skip mini-YO and reach Step 2', async ({ page }) => {
  await page.goto('http://localhost:3000/onboarding');
  // ohita kielivalinta
  await page.click('[data-lang="es"]');
  // mini-YO intro
  await expect(page.locator('h1')).toContainText(/Räätälöidään/);
  await page.click('text=Skippaa nyt');
  await expect(page.locator('h1')).toContainText(/Mitä kursseja/);
});

test('user can multi-select non-consecutive courses', async ({ page }) => {
  await page.goto('http://localhost:3000/onboarding/courses');
  await page.click('[data-course="3"] input');
  await page.click('[data-course="4"] input');
  await page.click('[data-course="6"] input');
  await page.click('[data-course="7"] input');
  await page.selectOption('[data-course-grade="3"]', '8');
  await page.selectOption('[data-course-grade="4"]', '9');
  await page.selectOption('[data-course-grade="6"]', '7');
  await page.selectOption('[data-course-grade="7"]', '8');
  await page.click('text=Jatka');
  await expect(page.locator('h1')).toContainText(/biografia/i);
});

test('mini-YO completion saves data to Supabase', async ({ page, request }) => {
  // täytä mini-YO
  await page.goto('http://localhost:3000/onboarding');
  await page.click('[data-lang="es"]');
  await page.click('text=Aloita taso-arvio');
  // simuloi vastaukset...
  // varmista että user_onboarding_diagnostic-taulussa on rivi
});

test('no Fraunces in onboarding (L-V291 verify)', async ({ page }) => {
  await page.goto('http://localhost:3000/onboarding');
  const fraunces = await page.evaluate(() =>
    [...document.querySelectorAll('*')].filter(el =>
      window.getComputedStyle(el).fontFamily.toLowerCase().includes('fraunces')
    ).length
  );
  expect(fraunces).toBe(0);
});

test('no italic in onboarding chrome', async ({ page }) => {
  await page.goto('http://localhost:3000/onboarding');
  const italics = await page.evaluate(() =>
    [...document.querySelectorAll('h1, h2, h3, p, button, label, span')].filter(el =>
      window.getComputedStyle(el).fontStyle === 'italic'
    ).length
  );
  expect(italics).toBe(0);
});
```

## Tiedostot joita todennäköisesti muutat / luot

- `js/screens/onboardingV4.js` (UUSI — älä korvaa V3 ennen kuin tämä testattu)
- `js/features/miniYO.js` (UUSI — testi-engine)
- `css/screens/onboarding.css` (laajennus)
- `routes/onboarding.js` (uudet POST-reitit: `/diagnostic`, `/courses`, `/biography`)
- `routes/writing.js` (uusi route `/grade-diagnostic-writing` joka käyttää diagnostic-rubric:a)
- `data/diagnostic/{es,de,fr}/part_a_grammar.json` (UUSI)
- `data/diagnostic/{es,de,fr}/part_b_reading.json` (UUSI)
- `data/diagnostic/{es,de,fr}/part_c_writing.json` (UUSI)
- `supabase/migrations/YYYYMMDD_user_onboarding_diagnostic.sql` (UUSI, aja MCP:llä)
- `sw.js` CACHE_VERSION bump

## Verify-protokolla

1. Supabase-migraatio ajettu (`mcp__claude_ai_Supabase__apply_migration`) — verifioi `list_tables`:lla
2. `npm run build` läpi
3. `node --check` läpi kaikille muokatuille JS-tiedostoille
4. `npm test` (vitest) läpi
5. Playwright-spec yllä PASS 5/5
6. **Manuaalinen end-to-end-testi mobile-viewport:lla (375 px):** uuden käyttäjän koko onboarding loppuun (kielivalinta → mini-YO → kurssit → biografia → yhteenveto-mockup), aika alle 20 min
7. Skippaus-polku testattu (ohita mini-YO, läpi loppuun)
8. Kirjoitelma-skippaus testattu (osa A+B, ei C)
9. AI-slop check: ei em-dash, ei italic, ei mono UPPERCASE, ei Fraunces

## Commit-strategia (jaettu kolmeen — sisältö-loopit ovat isoja)

**Commit 1 (L-V293-ONBOARDING-DIAGNOSTIC-1a):** UI-rakenne + Supabase-schema (molemmat taulut) + routes-stubit + pause-resume-logiikka (mini-YO sisältö placeholderia kaikilla kielillä)

**Commit 2 (L-V293-ONBOARDING-DIAGNOSTIC-1b):** Mini-YO sisältö Part A (kaikki kielioppi-aiheet) per kieli (es/de/fr)

**Commit 3 (L-V293-ONBOARDING-DIAGNOSTIC-1c):** Part B (pidempi reading-teksti + 6–8 kys) + Part C (kirjoitelma-prompt + diagnostic-rubric AI-graderille) per kieli

## Commit-viestit

```
feat(onboarding): diagnostic-first flow + Supabase tables + pause-resume (L-V293-ONBOARDING-DIAGNOSTIC-1a, v293)
feat(diagnostic): Part A grammar content for ES/DE/FR (~25 q each, all topics) (L-V293-ONBOARDING-DIAGNOSTIC-1b, v294)
feat(diagnostic): Part B reading (250–400w) + Part C writing rubric for ES/DE/FR (L-V293-ONBOARDING-DIAGNOSTIC-1c, v295)
```

## SW

CACHE_VERSION bump kahdessa committissa. STATIC_ASSETS: lisää uudet JS-tiedostot.

## Pending caller

- Päivitä `memory/project_open_issues_2026_05_19.md` — onko Asetukset/Profile-avaus vielä rikki vai korjattu jossain v283+ -loopissa
- Kirjoita `IMPROVEMENTS.md`-rivit molemmille committeille
- L-V294 starttaa heti kun tämä on mainissa — se täydentää `inferred_skill_profile`-kentän reasoner-logiikalla
