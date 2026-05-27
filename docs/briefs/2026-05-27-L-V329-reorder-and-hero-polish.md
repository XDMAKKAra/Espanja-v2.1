# BRIEF: L-V329 — Reorder (Proof → §2) + hero polish (top-5 audit-findings)

**Päivä:** 2026-05-27
**Triggeri:** Council 2026-05-27 (5 advisoria) totesi yksimielisesti että landingin section-järjestys hautaa proof-osan §4:ksi catalog-wallin (11 323 px, ~60 puhelinscrollia) alle. Lisäksi Marcelin laptop+mobile-screenshot-audit paljasti 5 polish-fixiä joiden pitäisi shipata samalla loop:illa.
**Status:** Useamman elementin polish, ei rakennetta uudelleen. ~60-90 min writer-työ.
**Edeltävä konteksti:** L-V326 (mobile-hero-killshot), L-V327 (hero-headline+trust), V326-aiheinen council-päätös 2026-05-27 (catalog on §3 tappaja, proof § 4 hautautunut).

---

## Mitä korjataan

### Päämuutos: Section-reorder (council Vaihe 1)

**Nykyinen:**
1. Hero
2. Grade-flow ("Yksi kirjoitustehtävä, kolme vaihetta") — 485 px
3. Catalog ("Kahdeksan kurssia") — **11 323 px**
4. Proof ("YTL:n rubriikki, ei yleinen mittari") — 506 px
5. Pricing
6. FAQ
7. CTA

**Uusi (tämä loop):**
1. Hero
2. **Proof** ← siirretty §4:stä §2:ksi
3. Grade-flow
4. Catalog (säilyy nykyisellään, leikkaus tulee erillisessä L-V330:ssä)
5. Pricing
6. FAQ
7. CTA

Council First Principles + Outsider olivat selkeitä: lukiolainen joka ei tunne tuotetta tarvitsee NÄHDÄ AI-arvioinnin oikealla esimerkillä ennen kuin uskoo että työkalu toimii. Catalog-listaus on logged-in-tuote-pinta joka ei kuulu konversiopolkuun.

### Audit-finding 1: Top-nav "Jatka harjoittelua" CTA on väärä uudelle kävijälle

Nyt brick-täytetty nappi top-oikealla, sama väri kuin hero "Aloita ilmaiseksi" → hierarkia rikki, kaksi yhtä tärkeää CTA:ta. Phone-näkymässä se on **ENSIMMÄINEN asia jonka käyttäjä näkee**, ennen H1:tä. Linkki vie `/app.html`:iin missä uudella käyttäjällä ei ole mitään "jatkettavaa".

**Fix:** muuta logiikka. Jos käyttäjä on kirjautunut (esim. `localStorage.getItem("puheo_user_email")` tai vastaava check joka on jo olemassa muualla koodikannassa) → näytä "Jatka harjoittelua" brick-tai-ghost-nappina. Jos ei kirjautunut → muuta nappia "Kirjaudu" ghost-link-tyyliin (ei brick-täytetty), tai piilota kokonaan ja anna heron primary CTA olla ainoa.

Etsi olemassaoleva auth-state-check pattern HTML:stä tai js/main.js:stä — älä keksi uutta. Jos täysin pelätty, default = piilota nappi mobile-näkymästä (<720px) jos ei tiedossa että käyttäjä on kirjautunut.

### Audit-finding 2: "Kielet"-label on mono-fontissa (AI-slop sama kuin chip oli)

`index.html:141` `.hero__lang-label` käyttää `font-family: var(--ed-mono)` -fonttia (JetBrains Mono). Sama AI-slop-pattern kuin äsken korjattu `.grade-step__chip`. Vaihda body/display-fonttiin.

CSS:ssä etsi `.hero__lang-label`-selektori, vaihda `font-family: var(--ed-mono)` → `font-family: var(--ed-display)` tai pelkkä `inherit`. Saatat tarvita pienen `letter-spacing`-säädön (nykyinen tracking-meta on mono-spaced).

### Audit-finding 3: Hero__teaser blockquote (sample sentence + YTL 24/33) duplikoituu Proof:in kanssa

`index.html:179-187` heron alaosa näyttää pikkukortin:
- "Espero que vienes con tu hermano", subjunktiivivirhe, selitys suomeksi.
- YTL 24/33 -merkki

Kun Proof siirtyy §2:ksi, sama sisältö näkyy isompana välittömästi heron jälkeen. Hero__teaser on nyt redundantti + leikkautuu phone-foldin kohdalla huonosti.

**Fix:** poista `<a class="hero__teaser">...</a>` -blokki kokonaan heron __copy-osasta. Tämä lyhentää heron pystysuuntaa mobiilissa → kaikki primary-elementit (H1, sub, lang-pills, CTA, trust) mahtuvat foldiin.

### Audit-finding 4: Secondary CTA "Katso miten kirjoitukset arvioidaan →" näyttää nappimaiselta

Nykyinen `.btn.btn--ghost.btn--lg` -tyyli on full-width laatikko alaviivalla → kilpailee primary brick-CTA:n kanssa. Ei tee selvää että se on toissijainen linkki.

**Fix:** kevennä secondary CTA:ta. Vaihtoehdot (writer valitsee):
- (a) Poista alaviivan rule. Pidä teksti + nuoli vasemmalle-tasattuna.
- (b) Sijoita primary CTA + secondary CTA samalle riville (`flex-direction: row`) → niiden suhde luetaan visuaalisesti
- (c) Muuta secondary linkiksi (text-only, brick-väri, ei laatikko)

Suositus: (c) → puhdas linkki "Näe esimerkkiarviointi →" brick-värillä, ei box-styliä. Tai jos halutaan säilyttää clickable target koko fold-kohdan tasalle, (a) ilman alaviivaa.

Linkin destination = `#nayte` joka nyt on §2 (Proof) reorderin jälkeen → linkki vie heti seuraavaan sektioon kuten ennenkin.

### Audit-finding 5: Sub-paragraph 4-line wall mobiilissa (vain mobile)

Mobile-näkymässä sub: "Espanja, ranska tai saksa. Kirjoituksesi arvioidaan samalla mittarilla kuin oikeassa YO-kokeessa, ja jokainen virhe selitetään suomeksi." renderöityy 4 rivinä. Scannability-osuma.

**Fix:** lisää tahallinen rivinvaihto `<br>` tai erota kahdeksi `<p>`-elementiksi. Esim:

```html
<p class="hero__sub">
  Espanja, ranska tai saksa. Kirjoituksesi arvioidaan samalla mittarilla
  kuin oikeassa YO-kokeessa.
</p>
<p class="hero__sub hero__sub--secondary">
  Jokainen virhe selitetään suomeksi.
</p>
```

Tai jätä yhdeksi `<p>`:ksi mutta ensimmäisen virkkeen `<br>` perään tuo paussin luku-rytmiin. Älä keksi uutta CSS-blokkia.

---

## Mitä writer tekee

### Step 1: Section-reorder (5 min)

`index.html`:ssä leikkaa `<section id="nayte" class="proof">...</section>` -blokki (`index.html:354-518` tai vastaava — etsi `<!-- ═══ PROOF` -kommentti) ja liimaa heti `</section>` -tagin jälkeen heron sulkemisen alle (`<!-- ═══ HERO ... -->` -lohkon jälkeen, ennen `<!-- ═══ GRADE-FLOW`).

Tarkista että anchor-linkit `#nayte` toimivat edelleen (linkki itse pysyy samana, vain sijainti DOM:ssa muuttuu).

### Step 2: Top-nav "Jatka harjoittelua" -logiikka

Etsi auth-state-check pattern projektista (grep `puheo_user_email`, `auth-token`, `isLoggedIn` tms.). Käytä sitä.

Jos logged in → näytä "Jatka harjoittelua" brick-täytettynä, kuten nyt.
Jos ei → vaihda joko (a) ghost-link "Kirjaudu" -tekstillä, (b) piilota mobile-näkymässä `<720px`.

Jos auth-check-pattern on epäselvä projektissa, default = piilota nappi mobiilissa CSS:llä `@media (max-width: 720px) { .nav__cta-jatka { display: none; } }` ja jätä desktop ennalleen — tämä on safe fallback joka korjaa puhelin-näkymän kriittisen ongelman ilman riskiä.

### Step 3: ".hero__lang-label" mono-fontti pois

Etsi CSS:stä `.hero__lang-label` (todennäköisesti `css/landing-editorial.css`). Vaihda `font-family: var(--ed-mono)` → `var(--ed-display)`. Säädä `letter-spacing` jos tarpeen (mono-tracking ei sovi sans-fontille).

### Step 4: Poista hero__teaser

`index.html:179-187` (`<a class="hero__teaser">...</a>` -blokki). Poista koko blokki. Säilytä `.hero__teaser`-luokan CSS toistaiseksi (helppo palauttaa jos myöhemmin palautetaan).

### Step 5: Secondary CTA kevennetään

Suositus: muuta `<a class="btn btn--ghost btn--lg">` → `<a class="hero__link-secondary">` ja lisää uusi CSS-luokka joka antaa pelkän linkki-stylen (brick-väri, alaviiva hover:ssa, ei box). Vaihtoehtoisesti vain poista box-styling olemassaolevasta `.btn--ghost`-luokasta jos se ei riko muualla.

Tarkista että koko sivu ei rikkoudu (`grep "btn--ghost"` osoittaa missä muualla luokkaa käytetään → jos vain heron sisällä, voit muokata sitä; jos muuallakin, lisää uusi luokka).

### Step 6: Sub-paragraph rivitys

`index.html:137-139` `<p class="hero__sub">`. Lisää `<br>` ensimmäisen virkkeen jälkeen tai jaa kahdeksi `<p>`-elementiksi.

### Step 7: Verify

```bash
npm run build
npx playwright test tests/e2e-brand.spec.js     # 16/16 PASS
npx playwright test tests/e2e-bug-scan.spec.js   # 38/38 PASS
```

Visual:
- Mobile iPhone 13 screenshot: hero + Proof näkyy heti scrollin jälkeen (ei catalog)
- Desktop 1280px screenshot: top-nav balanced, "Jatka harjoittelua" oikein tila (ghost tai piilotettu)
- "Kielet"-label ei enää mono-fontissa
- Hero__teaser pois, sub-paragraph rivitetty paremmin mobiilissa

`screenshots/landing/fullpage-after-V329.png` talletukseen.

### Step 8: SW + IMPROVEMENTS

Bumppaa `sw.js` CACHE_VERSION (v326 → v327). Yksi rivi IMPROVEMENTS.md:hen.

---

## Acceptance criteria

1. Section-järjestys: Hero → Proof → Grade-flow → Catalog → Pricing → FAQ → CTA
2. Anchor `#nayte` toimii (klikkaus secondary CTA:sta scrollaa Proof-sektioon)
3. Top-nav "Jatka harjoittelua" → ghost-tyyliin TAI piilotettu mobiilissa (ei brick-täytettynä kun käyttäjä ei ole kirjautunut)
4. `.hero__lang-label` ei käytä mono-fonttia
5. Hero__teaser blockquote poistettu
6. Secondary CTA ei näytä full-width-laatikolta (linkki-tyylillä tai ilman alaviivaa)
7. Sub-paragraph ei ole 4-rivinen wall mobiilissa
8. `npm run test:bug-scan` 38/38 PASS
9. `npm run build` ajettu, app.bundle.* committissa

---

## Out-of-scope

- **Catalog-leikkaus** (11 323 → ~1 500 px) — L-V330, oma loop
- **Grade-flow-korttien yhden-kielen-versio** (Outsider-flag että 3 eri kieltä 3 kortilla on cognitive cost) — kandidaatti L-V331 tai myöhempi
- **Pricing/FAQ/CTA-sektioiden polish** — eivät nyt prioriteetti
- **Interactive live grader hero:ssa** (Council Expansionist) — eri scope, eri loop, eri budjetti
- **Authn-järjestelmän muutokset** — Step 2 käyttää olemassaolevaa auth-state-checkia tai default-piilotuksen mobiilissa, ei refaktoroi auth-logiikkaa

---

## Skill-stack writerille

FRONTEND-M (useita komponentteja samaan loop:iin: section-reorder + nav-button-state + lang-label-CSS + teaser-removal + secondary-CTA-tyyli + sub-rivinvaihto):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`

TESTING-S (regression):
- `webapp-testing`
- `superpowers:verification-before-completion`

COPY (sub-rivinvaihto + mahdollinen "Kirjaudu" -teksti jos auth-state-check):
- `humanizer`

Total: 6 skilliä.

---

## Päätös-rekap

Council 5/5 sanoi: tappaja on catalog (§3 ennen reorderia, §4 jälkeen), ei järjestys per se. Proof:in nostaminen §2:ksi on quick win joka tekee §3:n Grade-flow:sta luonnollisen "now you've seen it work, here's how it works" -flow:n.

5 audit-findingiä ovat kaikki yhden tunnin sisällä korjattavissa. Yhteensä = ~60-90 min writer-työ + verify.

Realistinen scope: noin tunti. Tämä on viimeinen iso polish-loop ennen kuin catalog-cut (L-V330) tehdään erikseen.
