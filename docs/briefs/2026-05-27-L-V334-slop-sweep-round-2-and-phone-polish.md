# BRIEF: L-V334 — Slop-sweep round 2 + phone-mockup polish

**Päivä:** 2026-05-27 ilta-myöhä
**Triggeri:** Marcel huomasi V333:n shipin jälkeen että V331 slop-sweep missasi useita kohtia. Lisäksi V333:n phone-mockupit kaipaavat oikean device-feel:n viimeistelyn (Apple-tyylinen swipe-bar + status bar), ja niiden täytyy näkyä myös mobiili-näkymässä (V326:n `display:none` hidasi illustraation, mutta phone-mockupit ovat eri tarkoitus).
**Status:** FRONTEND-M, ~60-90 min writer-työ. Pure polish, ei uusia featureja.
**Edeltävät loop:t:** V326, V327, V329, V330, V331, V333 kaikki mainissa. Tämä jatkaa siitä.

---

## Mitä V331 missasi (slop round 2)

### Findings (Marcelin screenshot:eista)

**1. Section-eyebrow "— Teksti —"-pattern em-dash-separatorilla**

Useassa sektiossa on eyebrow joka näyttää:
```
—— Näyte arvioinnista ——
```
tai
```
—— Kurssipolku
```

Em-dash + mono-font + tekstin ympärillä rivi-elementit = klassinen AI-slop. V331:n "Luku-eyebrow"-sweep pyyhki Roman-numeraaliset eyebrowt mutta tämä on **eri muotoinen** (ilman "Luku X · Y" -muotoa).

**Korjaus:** etsi kaikki `<span class="*-eyebrow">`, `<p class="*-kicker">`, `.section-eyebrow`, `.proof__eyebrow` -luokat. Joka kohdassa missä on em-dash + mono-font + kapeloitu otsikko:
- Poista em-dash-viivat (`—` ympäriltä)
- Vaihda font `var(--ed-mono)` → `var(--ed-display)` tai `inherit`
- Säilytä semanttinen rooli (sektion eyebrow) mutta poista typewriter-tyyli

Esim:
```html
<!-- ENNEN -->
<p class="section-eyebrow">—— Näyte arvioinnista ——</p>

<!-- JÄLKEEN -->
<p class="section-eyebrow">Näyte arvioinnista</p>
```

CSS:ssä:
```css
.section-eyebrow {
  font-family: var(--ed-display);  /* oli var(--ed-mono) */
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ed-accent);  /* brick, sub-otsikko-väri */
  letter-spacing: 0.005em;  /* oli mono-tracking */
  text-transform: none;
  margin-bottom: 12px;
}
```

**2. Stat-row mono-fontti grade-flow:n alaosassa**

`.stat-subrow` (`index.html:235-241`) renderöi:
```
3 kieltä  90 oppituntia / kieli  270 yhteensä  6 mallikoetta / kieli  4 rubriikin osa-aluetta
```

Nykyinen CSS (`css/landing-editorial.css` `.stat-subrow`) käyttää `var(--ed-mono)`-fonttia + uppercase + wide letter-spacing → AI-slop pattern.

**Korjaus:** vaihda `font-family` mono → display, säilytä numeroiden korostus (b-tag), pehmenne letter-spacing.

```css
.landing .stat-subrow {
  font-family: var(--ed-display);  /* oli var(--ed-mono) */
  font-size: 0.875rem;
  letter-spacing: 0.005em;
  text-transform: none;
  /* säilytä spacing, gap, color */
}
.landing .stat-subrow b {
  font-weight: 700;
  color: var(--ed-accent);
}
```

**3. Audit-passi muiden mono-font-kohtien varalta**

Aja `grep`:

```bash
grep -rn "var(--ed-mono)" css/landing-editorial.css css/landing.css
grep -rn "font-family.*JetBrains\|font-family.*mono" css/landing*.css
```

Lista kaikki kohdat. Jokainen mono-font-käyttö landing-sivulla on **kysenalainen** ellei se ole oikeasti koodi tai data (esim. mock-write text grade-step-kortissa = OK, mutta eyebrowit / labelit / chipsit = ei).

Säilytä mono vain:
- `.mock-write` (käyttäjän koodinäyte mockupissa, semantically code-like)
- `.cursor` (cursor-animaatio)
- Mahdolliset muut "koodi-näköiset" elementit jotka tarkoituksellisesti näyttävät tyypiltä

Kaikki muu mono → display.

---

## Phone-mockup polish (V333 follow-up)

### Finding 4: Phone-mockupit kaipaavat device-feeliä

Vertailu WordDiveen (Marcelin screenshot): heidän phone-mockupissa on:
- Status bar ylhäällä: kellonaika "22.49", signaali, 5G, batteri
- Swipe-bar alhaalla: pieni horizontal line ohjaamassa pyyhkäisyä

Meidän nykyiset mockupit ovat **device-frame:ssä** mutta puuttuvat status bar ja swipe-bar → näyttävät tyhjältä.

**Korjaus phone-mockup-frame:lle (CSS `.hero-phone__frame` tai vastaava):**

A) **Status bar ylhäällä (44px tall):**
```html
<div class="hero-phone">
  <div class="hero-phone__statusbar">
    <span class="hero-phone__time">22.49</span>
    <div class="hero-phone__statusbar-right">
      <span class="hero-phone__signal" aria-hidden="true"><!-- 3 bars SVG --></span>
      <span class="hero-phone__network">5G</span>
      <span class="hero-phone__battery" aria-hidden="true"><!-- battery SVG --></span>
    </div>
  </div>
  <div class="hero-phone__screen">
    <img src="/img/product/lesson-writing.png" alt="..." />
  </div>
  <div class="hero-phone__swipebar" aria-hidden="true"></div>
</div>
```

CSS:
```css
.hero-phone__statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px 8px;
  font-family: var(--ed-display);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ed-ink);
}
.hero-phone__statusbar-right {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 0.75rem;
}
.hero-phone__swipebar {
  margin: 8px auto 6px;
  width: 134px;
  height: 5px;
  background: var(--ed-ink);
  border-radius: 999px;
  opacity: 0.85;
}
```

Säilytä phone-frame ulkoreuna (radius, shadow). Tämä lisää vain top/bottom-elementit.

B) **Status bar kellonaika:** kovakoodaa "22.49" tai vastaava staattinen aika. Älä yritä päivittää real-time (turha JS-paino, ei lisää arvoa).

C) **Swipe-bar väri** ja paksuus matchaa iPhone-laitteen tyyliä (134px leveä, 5px korkea, taustaväri sama kuin laitteen frame-väri / ink-paletti).

### Finding 5: Phone-mockupit pitää näkyä mobiili-näkymässä

V326 päätti `.hero__visual { display: none; }` mobiililla. Tämä päätös tehtiin kun visual oli Humaaans-illustraatio (joka EI näytä tuotetta). Nyt visual on phone-mockup (joka NÄYTTÄÄ tuotteen) → eri tarkoitus → mobiilin pitäisi näyttää.

**Korjaus:** muuta V326:n media query niin että:
- Mobile <720px: näytä **vain yksi** phone-mockup (vasen, lesson-writing). Pienennetty kokoa, esim. max-width 280px.
- Sijoita H1:n yläpuolelle tai vieressä, ei sen alapuolelle (älä riko reorderia).
- Säilytä H1 + sub + CTA näkyvyys foldissa.

CSS:
```css
@media (max-width: 720px) {
  .landing .hero__visual--right {
    display: none;  /* säilytä piilo: oikeanpuoleinen mockup */
  }
  .landing .hero__visual--left {
    display: block;
    max-width: 280px;
    margin: 0 auto 24px;
    /* sijoitus: ennen H1:tä mobiili-stackissa */
    order: 0;  /* tai sopiva grid-order */
  }
  .landing .hero__copy { order: 1; }
}
```

Kompromissi: mobile-foldissa ehkä H1+CTA tai pieni mockup+H1+CTA. Writer testaa kumpi mahtuu paremmin iPhone 13 (390×844) -kokoon.

---

## Mitä writer tekee

### Step 1: Grep-pass slop-jäljelle

```bash
grep -rn "var(--ed-mono)" css/landing-editorial.css css/landing.css
grep -rn "section-eyebrow\|.*-kicker" css/landing-editorial.css index.html
grep -n "——\|<em>—" index.html
```

Lista kaikki löydökset.

### Step 2: Eyebrow + stat-row CSS-fix

Vaihda `var(--ed-mono)` → `var(--ed-display)` kaikissa eyebrow- ja stat-row-luokissa.

Poista em-dash-viivat (`—`) HTML:stä jos niitä on tekstin ympärillä.

### Step 3: Phone-mockup status bar + swipe bar

Lisää HTML-elementit + CSS uuteen tai olemassaolevaan `.hero-phone__*`-luokkajärjestelmään.

### Step 4: Mobiili-näkyvyys

Päivitä V326:n media-query niin että vasen phone-mockup näkyy mobile <720px:llä pienennettynä.

### Step 5: Verify

```bash
npm run build
npx playwright test tests/e2e-brand.spec.js     # 16/16 PASS
npx playwright test tests/e2e-bug-scan.spec.js   # 38/38 PASS
node scripts/landing-fullpage-audit.mjs
```

Screenshot ennen + jälkeen:
- Desktop 1920px: section-eyebrow ja stat-row eivät mono-fontissa, phone-mockupissa status bar + swipe bar näkyvät
- Mobile 390px: vasen phone-mockup näkyy pienennettynä ennen H1:tä TAI sen alapuolella, EI estä H1+CTA-foldia

### Step 6: SW + IMPROVEMENTS

Bumppaa CACHE_VERSION (esim. v333 → v334). STATIC_ASSETS-listalle ei tarvitse muutoksia (CSS-muutoksia, ei uusia assetteja).

---

## Acceptance criteria

1. `grep -rn "var(--ed-mono)" css/landing*.css` palauttaa max 2-3 osumaa (vain `.mock-write` / `.cursor` / koodi-näköiset elementit, ei eyebrowt eikä statit)
2. `grep "——" index.html` palauttaa 0 osumaa (em-dash-viivat eyebrow:eista pois)
3. Phone-mockupissa näkyy status bar ylhäällä (kellonaika "22.49" + signal + 5G + battery) ja swipe-bar alhaalla
4. Mobile <720px viewport: vasen phone-mockup näkyy pienennettynä (max-width 280px), oikeanpuoleinen mockup edelleen piilossa
5. Mobile-foldissa näkyy edelleen H1 + sub + CTA (mockup ei estä konversio-elementtejä)
6. `npm run test:bug-scan` 38/38 PASS
7. `tests/e2e-brand.spec.js` 16/16 PASS

---

## Out-of-scope

- **In-mockup screenshot-sisällön AI-slop** (lesson-runner pillit, mono-fontit, listat) — Marcel: "sehän on applicaatiopuolen ongelma". App-side sweep on iso erillinen brief (kandidaatti L-V335-APP-SLOP-SWEEP), ei tähän loop:iin
- **Status bar real-time-päivitys** — kovakoodattu aika riittää, ei JS-paino
- **Phone-mockup pyörintä / animaatio** — staattisia mockupeja, ei motion
- **Uudet phone-mockup-screenshotit** — käytä olemassaolevia (lesson-writing.png, lesson-grade.png), jos jokin näistä tarvitsee uudelleen-capturen, se on eri loop
- **Catalog-sektion muutokset** — V330 jo accordion-collapsed, ei tähän
- **Pricing → oma sivu** — ei tehdä, competitor-research suosittelee landingilla pysymistä

---

## Skill-stack writerille (uusi minimal-stack)

FRONTEND-M (CSS-eyebrow + stat-row + phone-mockup status/swipe + mobile-visibility):
- `frontend-design`
- `ui-ux-pro-max`

TESTING-S (regression):
- `webapp-testing`

Total: 3 skilliä.

---

## Päätös-rekap

V331:n slop-sweep oli osa-toiminen — se hoiti "Luku X · Y"-eyebrowt mutta missasi "— Teksti —"-pattern:n ja stat-rivin. Tämä viimeistelee sen.

V333:n phone-mockupit ovat hyviä mutta puuttuu device-feel (status bar + swipe bar). WordDive-vertailu paljasti puutoksen.

V326:n mobile-illustration-piilotus päätös oli oikea SILLOIN (illustraatio = piiloon mobiililla) mutta ei skaalaudu uuteen mockup-rakenteeseen — vasen mockup on tuote-näyttö, ei dekoraatio → mobiili-näkyvyys tarpeen.

In-app slop (lesson-runner mono-pillit) on aito ongelma mutta eri scope → L-V335 ehdolla.

Realistinen scope: 60-90 min writer.
