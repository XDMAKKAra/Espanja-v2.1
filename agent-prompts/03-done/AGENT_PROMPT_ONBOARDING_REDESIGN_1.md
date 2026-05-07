# L-ONBOARDING-REDESIGN-1 — Mind-blowing onboarding ennen Pro-ostoa

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` ja `ROADMAP.md` ennen kaikkea muuta.

---

## 1. Konteksti

Käyttäjän strategia: markkinointi sosiaalisessa mediassa → onboarding ON suostuttelukomponentti, ei vain rekisteröinti. Suuri osa käyttäjistä saapuu somesta, eivät ole ostaneet Prota, ja päättävät 60 sekunnissa kannattaako pysyä. Onboardingin pitää tehdä WAU-vaikutelma ja aidosti henkilökohtaistaa kokemus ennen maksumuuria.

**Mitä on nyt:** placement-test, perussäätelevä rekisteröinti. Ei kysy juuri mitään. Tunne: "yet another language app".

**Mitä halutaan:** tunne että alusta tutustuu sinuun ja räätälöi polun. Käyttäjä lähtee kokemuksesta tunteella "tämä on tehty MINULLE", ei "tämä on geneerinen kieliappi joka kysyi kolme kysymystä".

---

## 2. Mitä tämä loop EI tee

- ❌ Älä rakenna runtime-AI-lessongenerointia — sisältö pysyy käsin tehtynä, AI on grading-puolella
- ❌ Älä koske maksusivuun / Stripe-integraatioon — `L-PRICING-REVAMP-1` hoitaa sen
- ❌ Älä rakenna saksan/ranskan kursseja — niiden sisältö tulee myöhemmin. Saksa & Ranska näkyvät onboardingissa "tulossa pian" -tilassa, valittavissa, mutta uudelleenohjaa wait-list-näkymään (kerää sähköpostit)
- ❌ Älä lisää uusia ulkopuolisia kirjastoja (animation libs, form libs)
- ❌ Älä keksi statistiikkaa ("85% käyttäjistä paransi tasoaan") — käytä konkretiaa: oppituntien määrä, YO-rubriikkikytkös, koe-päivän laskuri

---

## 3. Skill-set (PAKOLLINEN)

### Puheo-spesifiset
- `.claude/skills/puheo-finnish-voice/SKILL.md`
- `.claude/skills/puheo-screen-template/SKILL.md`
- `.claude/skills/ui-ux-pro-max/SKILL.md`

### Frontend-taste (kaikki näistä, käyttäjän pyyntö)
- `frontend-design`
- `design-taste-frontend` (Senior UI/UX, metric-based)
- `emil-design-eng` (motion polish, invisible details)
- `high-end-visual-design`
- `redesign-existing-projects`

### Education-skillit
- `education/agency-scaffold-generator` — käyttäjälle annetaan valintoja, ei vain kysytä
- `education/goal-setting-protocol-designer` — tavoitearvosana → räätälöity polku
- `education/self-efficacy-builder-sequence` — onboardin viimeinen ruutu rakentaa luottamusta, ei stressaa
- `education/cognitive-load-analyser` — älä kysy 17 asiaa peräkkäin, jaa rytmiin
- `education/goal-setting-protocol-designer` — koepäivän → lukusuunnitelman muunnos
- `education/motivation-diagnostic-task-redesign` — itsemääräämisteoria (autonomy/competence/relatedness) onboardingissa

### 21st.dev-sourcing
Hae 2+ referenssiä per komponentti:
1. Multi-step wizard / onboarding-flow joka tuntuu "delightfulta" (Linear-, Cal-, Stripe-tasolta)
2. Animated progress-indicator (steps + current)
3. Big choice-card (kielinvalinta — 3 isoa korttia hover-effekteillä, EI radio-button)
4. Goal-asetus-input (slider tai chip-valinta, EI numero-input)
5. Date-picker yo-koepäivälle (kalenteri tai kk-vaihtoehdot)
6. "Personalized result" -näkymä lopuksi (Spotify Wrapped -tyylinen reveal)

Fallback: Linear.app onboarding, Notion onboarding, Cal.com signup, Stripe atlas.

---

## 4. Onboarding-flow rakenne (ehdotus, agentti voi muotoilla)

**Tavoiteaika:** 90-120 s. Saa olla pitempi jos jokainen vaihe on mielenkiintoinen.

### Vaihe 0 — Tervetuloa (pre-form)
- Massiivinen typografia: "Tehdään tästä SINUN polkusi YO-kokeeseen."
- Yksi rivi sub: "8 kysymystä, ~2 minuuttia."
- 1 CTA: "Aloita".
- Visuaali: kalibroitu hero (ei stock-kuvaa) — esim. animoitu tasokäyrä I→L joka piirtyy vasemmalta oikealle

### Vaihe 1 — Kieli (3 isoa korttia)
- Espanja [VALMIS, label "Avoinna nyt"]
- Saksa [BETA, label "Pian saatavilla"] → klikkaus avaa wait-list-modaalin
- Ranska [BETA] → sama
- Korttien päällä: lippuja EI, vaan kielinimi + lyhyt tunnistettava sana ("¡Hola!" / "Hallo!" / "Bonjour!")

### Vaihe 2 — Mitä kirjoitat?
- Lyhyt oppimäärä (default-valinta)
- Pitkä oppimäärä → näytä "Pitkät oppimäärät tulossa myöhemmin", linkki wait-listiin
- Tämä vaihe voi olla tarpeeton vaiheessa 1 jos vain lyhyet ovat valittavissa — agentin päätös: yhdistä vai pidä erillään

### Vaihe 3 — Mihin asti olet jo päässyt? (ei taso-arvio, vaan opiskeluhistoria)
- Chip-rivi: "1 kurssi", "2-3 kurssia", "4-5 kurssia", "6+ kurssia"
- Mappaus → current_level (1k=I, 2-3=A, 4-5=B, 6+=C/M)
- Ei painostavaa "miten hyvä olet", vaan neutraali fakta

### Vaihe 4 — Mihin haluat?
- Tavoitearvosana isona valikkona: A / B / C / M / E / L
- Hover/focus näyttää vieressä mitä tarkoittaa: "M = magna cum laude approbatur, ~70-80% pisteistä"
- Default = nykytaso + 2 askelta ylös

### Vaihe 5 — Milloin koe?
- Date-picker, mutta yksinkertaistettu: "Kevät 2027" / "Syksy 2026" / "Kevät 2026" -nopeavalinnat + "tarkka päivä" -linkki
- Tallennetaan exam_date-kenttään

### Vaihe 6 — Paljonko aikaa viikossa?
- Slider 30-300 min/vk, tickit 60/120/180/240
- Default 120
- Live-preview alapuolella: "Tällä tahdilla saavutat M-tason 14 viikossa" (laskettu lessons_per_week-kaavasta)

### Vaihe 7 — Mitä haluat painottaa? (multi-select)
- Sanasto · Kielioppi · Kirjoittaminen · Luetun ymmärtäminen · Koe-simulaatiot
- Default: kaikki valittu
- Tallennetaan focus_areas-kenttään → vaikuttaa lesson-tilaajalogiikkaan myöhemmin

### Vaihe 8 — Personoitu reveal (KRIITTINEN — myynnillinen koukku)
- Iso ruutu joka kokoaa kaiken kerätyn datan visuaalisesti:
  - "Hei Marce."
  - "Polkusi: B → M"
  - "12 viikkoa kokeeseen 14.3.2027"
  - "8 oppituntia/vk · ~60 min"
  - "Painopiste: kielioppi & kirjoittaminen"
  - Visuaali: kurssitkortit (8 kpl) joista 3 ensimmäistä korostettu + "lukitut Tähtäimen jälkeen" -overlay loppupäässä
- 2 CTA:
  - **Pää:** "Aloita ilmaiseksi" (registers + dropaa appin etusivulle, EI maksumuuria)
  - **Sec:** "Avaa kaikki Mestarilla alkaen €19/kk" (linkki /pricing-pageen, EI pakota)
- Pieni teksti alle: "Ei luottokorttia · 1 oppitunti vapaa · Treeni alkaen €9/kk"
- **ÄLÄ pakota tier-valintaa onboardingissa** — käyttäjä rekisteröi free-tasolle, paywall-promptit hoitavat upgradauksen myöhemmin (per L-PRICING-REVAMP-1)

### Vaihe 9 — Sähköposti + salasana
- Vasta nyt. Loppukäyttäjä on jo investoinut 6 vaiheeseen, dropoff-todennäköisyys minimoituu.
- Yksi näkymä: email + password + Google-kirjautuminen (jos ei ole, älä lisää sitä tähän looppiin — ehdota seuraavaan)
- "Saat heti kurssin auki" -mikrocopy

---

## 5. Tekniset vaateet

### Datamalli (Supabase)
ACTION REQUIRED: ihmisen ajettava SQL-editorissa (älä aja agentista):

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS target_language     TEXT,
  ADD COLUMN IF NOT EXISTS target_level        TEXT,
  ADD COLUMN IF NOT EXISTS current_level       TEXT,
  ADD COLUMN IF NOT EXISTS target_grade        TEXT,
  ADD COLUMN IF NOT EXISTS exam_date           DATE,
  ADD COLUMN IF NOT EXISTS weekly_minutes      INT,
  ADD COLUMN IF NOT EXISTS focus_areas         TEXT[],
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS onboarding_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  language   TEXT NOT NULL,
  level      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Kirjoita SQL-snippetti `IMPROVEMENTS.md`:hen ACTION REQUIRED -merkillä.

### Frontend
- Onboarding-flow on uudet screenit: `screen-ob-language`, `screen-ob-level`, `screen-ob-current`, `screen-ob-target`, `screen-ob-exam-date`, `screen-ob-time`, `screen-ob-focus`, `screen-ob-reveal`, `screen-ob-signup`
- Flow-state hallinnoidaan `js/screens/onboarding.js`-modulissa, ei jaeta dataa screen-koneeseen ennen kuin `screen-ob-signup` lähetetään (kerätään lokaaliin objektiin)
- `data-reveal`-systeemi reuse:lle stagger-animaatioon
- `prefers-reduced-motion`: kaikki micro-animaatiot pause:lla, vain opacity
- Mobile-first: jokainen vaihe yksi sivu, ei multi-column

### Backend
- `POST /api/onboarding/complete` — ottaa flow-staten, tallettaa `users`-tauluun, asettaa `onboarding_complete=true`
- `POST /api/onboarding/waitlist` — saksa/ranska email-kerääjä
- Ei muita uusia endpointteja tähän looppiin

### Lukusuunnitelma-kaava
```javascript
const today = new Date();
const exam = new Date(user.exam_date);
const weeksUntilExam = Math.max(4, Math.ceil((exam - today) / (1000 * 60 * 60 * 24 * 7)));
const gradeIdx = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };
const coursesNeeded = Math.max(1, gradeIdx[user.target_grade] - gradeIdx[user.current_level]);
const totalLessons = coursesNeeded * 12;
const lessonsPerWeek = Math.ceil(totalLessons / weeksUntilExam);
const minutesPerWeek = lessonsPerWeek * 8;
```

Lisää `lib/studyPlan.js`-moduliin, käytä reveal-vaiheessa.

---

## 6. Verifiointi (per STANDARDS §4)

1. `graphify update .` koodi-muutosten jälkeen
2. Playwright screenshot kaikilla 9 onboarding-vaiheella @ 1440 + 375
3. axe-core 0 violations kaikilla vaiheilla
4. End-to-end testi: simuloi koko flow → tarkista users-rivi sisältää oikeat kentät
5. `design-taste-frontend` review screenshoteista — käyttäjän iso vaade: ei saa tuntua "AI-template"-onboardingilta
6. SW-bumppi (uusia HTML-screen-divsejä app.html:ään)
7. IMPROVEMENTS.md-rivi
8. SQL ACTION REQUIRED -merkintä IMPROVEMENTS.md:hen
9. Vanha placement-test säilytetään `<!-- LEGACY -->` -merkinnällä — sitä voidaan käyttää vaiheessa 3 jos chip-valinta tuntuu liian karkealta (agentin päätös)

---

## 7. Guardrailit

- **ÄLÄ committaa, älä deployaa**
- **ÄLÄ keksi numeroita** — kaikki on totta tai pois
- **ÄLÄ rakenna saksan/ranskan kurssisisältöä** — vain wait-list-mekanismi
- **ÄLÄ lisää uusia kirjastoja** — vanilla CSS + olemassa oleva `data-reveal`-systeemi
- **ÄLÄ tee maksumuuria onboardingiin** — käyttäjä saa pitkälle ilman korttia, suostuttelu tehdään reveal-vaiheessa hienovaraisesti
- Yksi ainoa muutos kerrallaan committi-ehdokkaaksi käyttäjän reviewiin

---

## 8. Lopputuotteen kriteeri

Käyttäjä klikkaa onboardingin läpi ja sanoo: "Tämä tuntuu siltä että alusta välittää siitä että pärjään YO-kokeessa, ei siltä että minulle myydään tuotetta." Reveal-vaihe on koko loopin tärkein ruutu — sen pitää olla myynnillisesti vakuuttava ilman olla manipulatiivinen.
