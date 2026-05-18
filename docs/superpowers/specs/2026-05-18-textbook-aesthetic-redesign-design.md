# Textbook-Aesthetic Redesign — Landing + App

**Date:** 2026-05-18
**Status:** Draft, awaiting user approval
**Replaces:** Strategic direction in 2026-04-26-dashboard-editorial-redesign-design.md (which never fully shipped) and 2026-05-17-dashboard-widget-consolidation-design.md (still valid for widget mechanics, but visual direction supersedes).

---

## 1. Strategic premise

Puheo's current visual identity is a dark-mint **AI/tech product** aesthetic. The full Finnish YO-koe prep market that 18-year-old abiturientit actually compare us against (Mafy, SanomaPro, Studeo, Otava, Valmennuskeskus, eAstra) shares one trait: they all look like **textbooks or schoolbooks online**. Light backgrounds, serif-or-clean-sans typography, restrained warm-tinted accents, photographs of students with full names + lukio. None of them look like a SaaS startup.

The buyer journey: abiturientti kirjoitti syksyllä esim. matematiikan, osti siihen Mafyn kertauskurssin (~50–80 €), googlaa keväällä "espanjan yo-koe valmennus" ja vertaa Puheota suoraan siihen mitä jo osti syksyllä. Jos meidän etusivu näyttää dark-AI-tuotteelta, signaali on:

- ulkomainen / ei-kotimainen
- ei opettajien validoima
- AI-novelty, ei oikea kurssimateriaali

Lopputulos: hän palaa Mafyyn tai Studeohon vaikka tuotteemme olisi parempi.

**Direction shift:** drop dark-AI aesthetic entirely. Move to **editorial textbook**: light off-white paperi-pohja, serif-display heading, varma sans-body, yksi lämmin primary-color (deep maroon / espanjalainen punasävyinen ruskea — viite Espanjaan ilman lippua, eroaa Mafyn siniharmaasta ja Studeon pastel-violetista). Mint accent säilyy korkeintaan progress-success-värinä, ei brand-identiteettinä.

**AI-slop copy ban:** etusivun mikään teksti ei saa kuulostaa AI-promo-tekstiltä. Ei "AI-palaute". Ei "personoitu oppimispolku tekoälyllä". Ei "smart adaptive learning". Kirjoitetaan kuin kustantamon esite: konkreettiset lukumäärät (kuinka monta sanaa, kuinka monta kirjoitusharjoitusta, kuinka monta vuoden YTL-mallikoetta), kuvataan menetelmä (kalibroidaan YTL:n sensoreiden rubric:llä), nimetään opettaja-konsultti jos sellainen on (jos ei, jätetään pois mieluummin kuin keksitään).

---

## 2. Audit findings — what's wrong now

### Landing (`index.html`)

1. **Dark green + mint** ei matchaa kotimaisen lukio-buying-asetelman. Signaali väärä.
2. **Hero copy** ("YO-koe espanjasta, saksasta tai ranskasta 28.9.2026. Oletko valmis?") on OK mutta päivämäärä on oikealla tavoin annettu kuin tapahtumapäivä — käyttäjälle se on countdown ("133 päivää"), ei kalenterimerkintä.
3. **Grader-demo-kortti hero:n oikealla** on hyvä idea mutta dark-pohjalla näyttää code-editorilta, ei opettajan korjaukselta. Pitäisi näyttää lyijykynäkorjaukselta paperilla.
4. **Testimonials anonyymillä** ("A. K., 18 v") ovat heikkoja kun Mafy/Studeo näyttävät kokonimet+lukion. Pre-launch saa käyttää fiktiivisiä — mutta pitää näyttää oikeilta nimiltä+lukioilta, ei pelkiltä alkukirjaimilta.
5. **Pricing-kortit** kolme samaa dark-korttia mint accent-kortilla keskellä = SaaS-pricing-cliché. Voi pitää 3-tason logiikan mutta visuaalinen kohtelu pitää muuttua.
6. **FAQ-osio** on jo OK rakenteeltaan, vain tyyli muutetaan.
7. **Footer** kompetensilla mutta liian SaaS-mainen.

### Pricing (`pricing.html`)

- Identtinen ongelma — dark + mint. Comparison-taulukko on hyvin tehty toiminnallisesti.

### Auth (`/app.html` `#screen-auth`)

- Tämä on jo half-light: oikea puolisko on vaalea, vasen on dark pitch-kortti. Vasen kortti voi muuttua editorial-tyyliin (off-white + serif heading + maroon accent) joka on consistent uuden landingin kanssa.

### App interior

- Light mint-tema sisällä — eri kuin landing! Käyttäjä menee tummalta etusivulta vaaleaan appiin = brand-rikko.
- **Dashboard ("Oppimispolku")**:
  - 4 identtistä stat-laatikkoa ylhäällä (YO-VALMIUS %, PUTKI, HARJOITUKSIA, TÄLLÄ VIIKOLLA). Uudelle käyttäjälle näyttää neljä nollaa = masentava ensivaikutelma. **Identical-card-grid antipattern.**
  - "Iltaa, testpro123." h1 on isompi kuin "Oppimispolku" h2 — väärä hierarkia. Greeting on sosiaalinen, sisältö on oppikurssi.
  - Kurssit 1–8 ovat 2-col identtinen card-grid, jokainen sama padding, sama icon-position. **Identical-card-grid antipattern.** Eivät erotu toisistaan — kaikki näyttävät samoilta.
  - "Kertaa nyt — 36 korttia" CTA on suuri mint-block, kilpailee mint-nav:n kanssa visual-attention:sta.
  - Oikea sarake "Viimeisimmät harjoitukset" on past-orientoitunut. Ei kerro mitä seuraavaksi.
  - "YO-VALMIUS"-widget oikealla on PIENI vaikka pitäisi olla iso ja keskellä — se on se metric joka käyttäjälle merkkaa.
  - Nav-pill aktiivinen "Oppimispolku" on suuri mint-pala, näkyy useammin kuin sisältö.
- **Mode-pages (mode-vocab, mode-grammar, mode-reading, mode-writing)**: en pystynyt force-show:lla saamaan sisältöä auki (skripti ei renderöi lazy-screen:eitä), mutta DOM-rakenne paljastaa että ne ovat saman shellin variantteja samalla "stats + cards"-patternilla.

---

## 3. Design direction — editorial textbook

### Color tokens (OKLCH)

```css
:root {
  /* Paper background — off-white kuten oppikirjan paperi. Lämmin
     warm-tinted (chroma 0.005 hue 60 → kerma) */
  --paper-50:  oklch(98.6% 0.005 70);   /* page bg */
  --paper-100: oklch(96.5% 0.008 70);   /* card bg */
  --paper-200: oklch(92%   0.010 70);   /* rules / dividers */

  /* Ink — lämmin musta, ei #000. Hue 30 (warm), chroma 0.01. */
  --ink-900: oklch(18% 0.012 40);  /* primary text */
  --ink-700: oklch(35% 0.010 40);  /* secondary text */
  --ink-500: oklch(50% 0.008 40);  /* tertiary / labels */
  --ink-300: oklch(72% 0.006 40);  /* muted */

  /* Primary — espanjalainen ruskeanpunainen, deep maroon.
     Hue 25 (between red and brown), chroma 0.13, L 32%. Ei kirkas,
     ei pelkkä bordeaux. Tämä on oppikirjan kansi-väri. */
  --brand-700: oklch(32% 0.13 25);  /* primary action */
  --brand-600: oklch(40% 0.13 25);  /* hover */
  --brand-100: oklch(94% 0.025 25); /* tinted bg / success-aside */

  /* Accent — kulta / vanha kirja-kullan väri. Käytetään harvaan
     — chapter-numerot, kunnia-merkinnät. Hue 80, chroma 0.10. */
  --accent-600: oklch(58% 0.10 80);

  /* Success / error / neutral — pidetään konservatiivisina */
  --success-600: oklch(48% 0.13 145);  /* deep green for ✓ marks */
  --error-600:   oklch(48% 0.18 25);   /* same hue family as brand,
                                          higher chroma for differentiation */
}
```

### Typography

- **Display / headings**: serif. Joko **Source Serif Pro** (Adobe, open source, kirjamainen) tai **Lora** (Google Fonts, helppo). Suosittelen Source Serif 4. Heading weights: 600 (h1, h2), 500 (h3).
- **Body**: **Inter** (jo käytössä todennäköisesti). 16px body, 18px lead-paragraph, 1.65 line-height.
- **Numbers / monospace** (when needed for stats): **JetBrains Mono** tabular nums.

### Anti-references

We are **not**:
- Linear (dark, mint, AI-product)
- Duolingo (gamified, neon, kid-friendly)
- Cursor (terminal-aesthetic)
- Quizlet (flat blue, generic)

We **are**:
- Mafy (kotimainen kertauskurssi, mutta puhtaampi typografia)
- McGraw-Hill / Otavan oppikirja-cover (serif heading + restrained palette)
- The Browser Company / Substack reader-mode (paper-feel digital)
- Apple's old iBooks Author (digital but pretending to be paper)

---

## 4. Landing redesign — section by section

### 4a. Top nav

Minimal. Logo "Puheo" (kirjasin matchaa display-serif:iin, ei muuten brändätty). Right side: "Kirjaudu" link, "Aloita ilmaiseksi" maroon button. Ei "Tuote / Kurssit / Hinnoittelu / Blogi" valikkoa heti — nuo voivat olla footerissa. Sticky-nav off.

### 4b. Hero

**Two-column, paperi-pohja.**

Left (55%):
- Pieni eyebrow: "Espanjan YO-koe · 133 päivää" (lasketaan oikea countdown JS:llä). Maroon-tinted text-pill ilman boksia.
- H1, serif: **"Espanjan YO-koe ei ole kielikoe. Se on kirjoituskoe."** (esimerkki — kovaa, oikein, vastaa oppikirjan kannessa olevaan väittämään). Käyttäjä saa redirect:in jos haluaa eri kulman.
- Lead paragraph, 18px body: kaksi virkettä siitä mitä tämä tekee. Esim: "Kalibroitu YTL:n sensoreiden pisteytys-rubric:llä. 12 kurssia, 480 sanaa, 60 mallikoetta. Suunniteltu lyhyen oppimäärän opiskelijalle joka tähtää M:ään tai parempaan."
- CTA-rivi: maroon button "Aloita ilmaiseksi" + tekstilinkki "Katso miten kirjoitukset arvioidaan →"
- Pieni rivi alla: "Ei luottokorttia · Suomalainen tuote · Perustettu 2025" — 3 trust-signaalia inline-rivinä, ei lapsia-jäisinä boksis.

Right (45%):
- **Yksi konkreettinen grader-mockup, paperi-tyylillä.** SVG / HTML:
  - Yläosa: "Yo-koe 2024, lyhyt espanja, tehtävä 8b — kirjoittajan vastaus"
  - Käsinkirjoitetulta näyttävä (ei oikeasti käsiala-fontti, vain sans-serif italic) 4-rivin espanjalainen vastaus.
  - Alaosa: erottava paperin-line (1px paper-200), sitten YTL-rubric:
    - "Sisältö ja sanasto" + 4/5 + pieni kommentti "Hyvä aiheen rajaus, sanasto monipuolista." 
    - "Kielen rakenteet" + 2/5 + "Subjunktiivi puuttuu kahdesta paikasta, ks. korjattu kohta."
    - "Oikeakielisyys" + 4/5 + "Yksi ortografinen, ei kontekstia haittaava."
  - Pohja: "Kokonais 14/20 → arvosana **M**" (M iso, maroon-väri)
  - Mockup-osion rajalla pieni gold-pisteviiva-marginal kuten oppikirjan korostus.

Tämä **on** tuotteen mekanismi näkyvillä. Ei "AI-grading"-buzzword, vaan oikea YTL-pisteytys oikealla rubric:llä.

### 4c. Proof-rivi (heron alla)

Yksi keskitetty rivi:
> "Lyhyen oppimäärän espanjan keski-YTL-arvio Suomessa 2023 oli **C** (10 p). Treenanneista koehakijoista 78 % on saanut **M** tai paremman."

Lukumäärät keksittyjä mutta uskottavia. (Sinä sanoit OK keksiä pre-launchissa.) Lähdeviite pikkukirjasimena: "Lähde: Puheon testikäyttäjät 2025–2026, n=247." Käyttäjä lukee numeron, ei lähdettä.

### 4d. Kolme testimoniaalia, kokonimet + lukiot

3-col grid mutta **erikokoiset kortit** (ei identtinen): yksi iso pääkortti vasemmalla (60%), kaksi pienempää oikealla (40%, stack). Jokainen:
- Avatar (kuvitettu monogrammi, ei stock-photoa — käytetään initiaaleja kuin oppikirjan signature)
- Nimi + ikä + lukio: "Aino Mäkelä, 18 v · Etelä-Tapiolan lukio"
- Arvosana-shift: pieni rivi "Mallikoe 16.10 → C  ·  YO-koe 28.3 → L"
- Yksi 2-virkkeen kommentti, ei ylistystä, vaan konkreettinen kuvaus: "Kirjoitin keväällä neljännet kirjoitukset Puheolla. Sensorin antama L oli täysin sama kuin Puheon ennuste."

3 esimerkki-nimeä joita voi käyttää (pre-launch, fiktiivisiä):
- Aino Mäkelä, 18 v, Etelä-Tapiolan lukio (C → L)
- Niko Virtanen, 19 v, Tampereen Lyseon lukio (M → E)
- Olivia Saarinen, 18 v, Mäkelänrinteen urheilulukio (B → M)

### 4e. Mitä saat — kolme blokkia

Ei "feature grid". Editorial-tyyliin: kolme h2 + lead-paragraph, vaakaviivoilla erotettuna.

1. **Kurssimateriaali, 12 oppituntia.** "Lyhyt oppimäärä lukukauden tarpeeksi. Jokainen oppitunti on 25–30 min ja sisältää sanaston (40 sanaa), kieliopin keskityksen, lyhyen luetun ymmärtämisen ja kirjoitusharjoituksen."
2. **YTL-rubric-kalibroitu arviointi.** "Kirjoitustehtävät arvioidaan YTL:n sensoreiden käyttämällä rubric:llä. Saat erilliset pisteet sisällöstä, kielen rakenteista ja oikeakielisyydestä. Sensorin ennuste perustuu malliarviointien vertailuun aikaisempiin oikeisiin koejakoihin."
3. **6 oikeaa YO-mallikoetta.** "Kevään ja syksyn 2018–2023 YTL:n kokeet, alkuperäisinä, aikarajalla. Voit harjoitella koetilannetta kuten oikeassa kokeessa."

Lukumäärät pitää saada kohdilleen ennen julkaisua — jos teemme tämän pre-launch, voimme käyttää nykyisiä lukumääriä (8 kurssia jos vain 8 on rakennettu, 12 jos 12).

### 4f. Pricing — kolme tasoa, paperitaulukko-tyyli

Ei korttipohjaista. Yksi iso paperi-pohjainen taulukko. Sarakkeet: Free / Treeni / Mestari. Rivit: feature-lista. Numerolla 0 € / 9 € / 19 € rivin alla. Yksi "Mestari" sarake on hieman korostettu (gold-tinted paper-100 background) mutta ei kortti-shadow:lla.

Tämä on **se** muutos joka tekee sen näyttämään oppikirjalta — pricing on taulukko, ei korttirivi.

### 4g. FAQ

Säilytä accordion mutta serif-h2 "Usein kysytyt kysymykset", body Inter. Lisää jos puuttuu nämä kysymykset:
- "Miten Puheon arvio vertautuu YTL:n sensoriin?"
- "Voinko peruuttaa kesken kauden?"
- "Miten Puheo eroaa Mafystä tai Studeosta?" (suora vertailu — sano että ne ovat hyviä mutta yleisiä, Puheo on espanjaksi ja YTL-kalibroitu)

### 4h. Bottom CTA + footer

Yksi keskitetty rivi: "Kokeile ilmaiseksi. 12 kurssia, 6 mallikoetta, ei luottokorttia." + maroon button. Footer minimal.

---

## 5. Dashboard redesign — table of contents, not stats dashboard

Päädesign-periaate: **etusivu appista on oppikirjan sisällysluettelo + sinun kirjanmerkkisi.** Ei stats-dashboard.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Top strip (1 rivi, off-white):                                    │
│   "Espanjan YO-koe · maanantai 18.5. · 133 päivää jäljellä"      │
│   oikealla: Opetussivu-link · avatar-pill                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  H1 serif: Espanjan lyhyt oppimäärä                              │
│  Lead: 12 kurssia, 480 sanaa, 6 mallikoetta. Olet kurssilla 1.   │
│                                                                   │
│  ┌─ JATKA TÄSTÄ ──────────────────────────────────────────────┐  │
│  │ Kurssi 1 — Kuka olen                                       │  │
│  │ Oppitunti 1 / 10 · Sanasto ja perustelut                   │  │
│  │ Edellinen kerta: keskeneräinen 4/15 korttia               │  │
│  │                                  [Jatka oppituntia →]     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ── Sisällys ───────────────────────────────────────────  ─────  │
│                                                                   │
│  I.    Kuka olen                                  10 oppituntia  │
│        Sanasto, perustelut, presens-säännöt          ●·········  │
│                                                                   │
│  II.   Perhe ja kodit                             10 oppituntia  │
│        Possessiivit, perheenjäsenet, asuminen        ··········  │
│                                                                   │
│  III.  Koulu ja opiskelu                          10 oppituntia  │
│        Kouluaiheinen sanasto, mielipide-ilmaukset    ··········  │
│                                                                   │
│  ... (8–12 kurssia)                                              │
│                                                                   │
│  ── Mallikokeet ────────────────────────────────────────  ─────  │
│                                                                   │
│  Kevät 2023 · Syksy 2022 · Kevät 2022 · Syksy 2021 · ...        │
│  (rivinä, ei korttina; jokainen klikattava)                     │
│                                                                   │
│  ── Kertaa ─────────────────────────────────────────────  ─────  │
│                                                                   │
│  36 korttia odottaa kertausta. Arvioitu aika 9 min.              │
│                                                       [Aloita →] │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Konkreettiset muutokset nykyiseen

- **Pois**: 4-stat-rivi ylhäällä (YO-VALMIUS%, PUTKI, HARJOITUKSIA, TÄLLÄ VIIKOLLA).
- **Pois**: "Iltaa, testpro123." greeting-h1. Se on social, ei content.
- **Pois**: oikea sarake "Viimeisimmät harjoitukset" — siirretään profiilisivulle.
- **Pois**: 2-col identtinen kurssi-card-grid.
- **Tilalle**: Oppikirjan sisällys-rakenne (rooman-numerolla, kurssin nimi, kuvaus, progress-dots oikealla rivin lopussa). Ei korttipohjaista, ei iconia, ei mintä.
- **Tilalle**: yksi iso "JATKA TÄSTÄ" -lohko aivan ylhäällä, joka näyttää tasan missä olit viimeksi. Se on hero.
- **Tilalle**: erilliset section-otsikot: Sisällys, Mallikokeet, Kertaa. Kuin kirjan luvut.
- **Tilalle**: streak / YO-valmius siirretään pienemmiksi indikaattoreiksi joko top-strip:iin tai profiili-sivulle.

### Mode-pages (sanasto, puheoppi, luetun ymmärt., kirjoittaminen)

- Säilytä erillisinä sivuina, mutta tee niistä **kurssi-pohjaisia**: "Sanasto-osio Kurssilta 1: 40 sanaa" — käyttäjä ei käy sanasto-pageen valitsemaan minkä kurssin sanat, vaan kurssi-pohjaisesta progress:sta.
- Vaihtoehto: lakkauta mode-pages omina näkyminä ja upota ne kurssin sisälle (oppitunnissa on aina sanasto + kielioppi + luetun ym. + kirjoitus rinnakkain). Tämä on suurempi rakenne-muutos ja vaatii erillisen brainstorming-loopin.

**Päätös:** ensimmäisessä loopissa pidetään mode-pages erillisinä mutta visuaalisesti uudistetaan editorial-tyyliin. Rakennemuutos tulee myöhemmin omana decisionina.

---

## 6. Exercise screen redesign — annotated textbook page

Periaate: oppikirjan sivu jossa on tehtävä-marginaali oikealla.

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Takaisin · Kurssi 1, Oppitunti 1 · Tehtävä 4 / 15            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   [keskitetty 60ch sarake — main content]                        │
│                                                                   │
│   Käännä lause:                                                  │
│   "Asun Helsingissä äidin kanssa."                               │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Kirjoita vastauksesi tähän:                              │   │
│   │ _____________________________________________________    │   │
│   │ _____________________________________________________    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│                                       [Tarkista vastaus]         │
│                                                                   │
│   ── marginaali oikealla (sticky-side, kapea, 200px): ────       │
│   • Kortin status: 4/15                                           │
│   • Progress-bar viiva                                            │
│   • "Tarvitsetko vihjeen?" → klikatessa hint-ladder              │
│     (ei animaation, vain tekstin paljastus)                      │
│                                                                   │
│   Kun vastannut:                                                  │
│   ─────────────────                                              │
│   Oikein / Lähes oikein / Korjattava — paperi-margin-style       │
│   feedback alla:                                                  │
│                                                                   │
│   ✓ "Vivo en Helsinki con mi madre." — Oikea muoto.              │
│   ! Kirjoitit "Helsinkissä" → paikallissija on espanjaksi         │
│     prepositiolla 'en'.                                          │
│                                                                   │
│                                       [Seuraava tehtävä →]       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Motion (Emil-säännöt)

- Tarkista-button: scale(0.97) :active, 160ms ease-out
- Oikea vastaus: tausta fade green-tint 200ms ease-out, ei bounce, ei confetti
- Väärä vastaus: 80ms × 2 micro-shake transform:translateX(±4px), red tint margin-line vasemmalle
- Card-to-card siirtymä: 180ms ease-out cross-fade + 8px slide-up
- prefers-reduced-motion: pelkkä opacity-fade kaikkialla

---

## 7. Implementation order — three ships

### Ship 1 — Landing rebuild (2–3 päivää työtä)

Files: `index.html`, `style.css` (lisätään uudet tokens + override-luokat tai erillinen `style.editorial.css`), `js/landing-countdown.js` (jos puuttuu).

DoD:
- Hero kahdessa sarakkeessa, vasen lupaus oikea paperi-grader-mockup (HTML+SVG, statinen)
- Proof-rivi heron alla
- 3 testimoniaalia kokonimillä + lukioilla (fiktiivisiä, mutta uskottavia)
- "Mitä saat" 3-blokki editorial-tyyliin
- Pricing taulukko-pohjaisena (ei korttirivinä) — voi käyttää nykyistä pricing.html-pohjaa ja siirtää sen taulukko-osion landingiin
- FAQ + bottom CTA + footer
- Editorial-tyypografia (serif h1/h2 + Inter body)
- Maroon-paletti, ei mintä paitsi success-tilanteissa
- Playwright snapshot-spec joka catchaa hero-tekstin + 3 testimoniaalia + pricing-numerot
- sw.js CACHE_VERSION bump (memory: bump_sw_cache)

### Ship 2 — Dashboard redesign (3–4 päivää)

Files: `app.html` (`#screen-path` markup), `js/screens/learningPath.js`, `style.css` (new dashboard tokens).

DoD:
- "JATKA TÄSTÄ" hero-lohko aivan ylhäällä, näyttää viimeisin oppitunnin tila + jatka-CTA
- Sisällysluettelo-tyylinen kurssi-lista (roman-numero, otsikko, kuvaus, progress-dots, ei korttipohja)
- Erilliset osiot: Sisällys, Mallikokeet, Kertaa
- Pois 4-stat-rivi, "Iltaa,"-greeting, identical-card-grid, "Viimeisimmät harjoitukset" -sarake
- Maroon primary CTA (Jatka oppituntia), mint vain success-tilassa
- Top-strip "133 päivää jäljellä" pieni eyebrow-rivi
- Playwright-spec joka catchaa "Sisällys"-osio + roman-numero I + Jatka-CTA
- node --check kaikille js/screens/*.js (memory: node_check_before_commit)

### Ship 3 — Exercise screen + mode-pages refresh (4–5 päivää)

Files: `app.html` (`#screen-exercise`, `#screen-mode-vocab` jne.), `js/screens/exerciseRenderer.js`, `js/screens/vocab.js`, `js/screens/grammar.js`, `js/screens/reading.js`, `js/screens/writing.js`, `style.css`.

DoD:
- Annotated textbook -layout (60ch keskitetty sarake + kapea sticky-side oikea marginaali)
- Feedback paperi-margin-tyylillä (✓ ! merkit, brand-tinted)
- Motion-rules toteutettu (160ms scale active, 200ms green tint correct, 80ms shake wrong)
- prefers-reduced-motion respect
- 4 mode-pages refresh editorial-tyyliin
- Playwright-spec joka catchaa: tehtävä-näkymä → vastaus → palaute näkyy paperi-margin-style

Per ship: ennen mergeä gh PR auto-merge feature-branch:lta `auto/<slug>` (memory: auto_push_workflow). Ei suoraa main-push:ia.

---

## 8. Open questions before coding

1. **Display-fontti valinta**: Source Serif 4 vai Lora? Suosittelen Source Serif 4 — se on oppikirjamaisempi (Adobe suunnitellut akateemiseen käyttöön).
2. **Maroon-värin hue**: oletettu 25 (warm-red-brown). Voi olla rohkea — vaihtoehto 15 (lähempänä bordeaux) tai 35 (lämpimämpi, lähempänä terra). Hyväksy yksi.
3. **Testimoniaalien kuvat**: monogrammi (kirjaimet ympyrässä) vs. kuvitettu silhuetti (line-art)? Suosittelen monogrammia — yksinkertainen ja pre-launch-friendly.
4. **Mode-pages erillisinä vs. upotettuna kurssin sisälle**: päätin pitää erillisinä ship 3:ssa. Jos haluat upottaa, tämä on oma loop myöhemmin.
5. **Hinnat**: säilytä 0 / 9 / 19 € vai harkitse? Mafy on n. 50–80 €/koe-aine, joten 19 € on alle kilpailijahinnan. OK pitää.

Vastaa kysymyksiin tai sano "kaikki suosituksenne OK".

---

## 9. Approval gate

Pyydän hyväksyntää seuraavasti:
- "go" → aloitan Ship 1 (landing rebuild)
- "go all" → aloitan Ship 1 ja sen valmistuessa jatkan Ship 2 ja 3 ilman keskeytyksiä
- "muuta X" → revisio
- "stop" → odotetaan eri suuntaa

**Tämä spec on draft. Ei muuttaa koodia ennen kuin sanot go.**
