# BRIEF: L-V327 — Heron headline + kieli-signaali + parent-trust

**Päivä:** 2026-05-27
**Triggeri:** Council 2026-05-27 paljasti että L-V326:n jälkeen mobile-foldissa näkyvä otsikko "Lyhyen kielen YO-koe on kirjoituskoe." on insider-jargon: ei mainitse kieliä (ES/FR/DE), ei kerro audienssille "tämä on minulle", ei puhuttele vanhempia (= maksava segmentti).
**Status:** Copy-heavy fix + pieni HTML-rakenteen siisti. ~45-90 min writer-työ.
**Edellytys:** **L-V326 on shipattu ja mainissa** ennen tämän aloitusta. Tämä loop muokkaa heron tekstisisältöä joka näkyy mobile-foldissa vasta L-V326:n jälkeen.

---

## Mitä korjataan

### Bugi 1: Otsikko ei nimeä kieliä

Nykyinen `index.html:144-146`:
```html
<h1 class="hero__title" id="hero-title">
  Lyhyen kielen YO-koe on <span class="hero__title-accent">kirjoituskoe</span>.
</h1>
```

Council Outsider: "Nothing here says 'Spanish, French, German.' Nothing says 'exam prep.'" Ranskan YO-kokeeseen valmistautuva 17-vuotias bouncee koska ei näe että ranska on tarjolla. Tämä on iso konversioauko.

### Bugi 2: "YO-koe" oletetaan tunnettavaksi, audienssi-signaali puuttuu

Sub-line `index.html:148-152` ja trust-rivi `:171-177` selittävät YO-rubriikkia mutta eivät vastaa kysymykseen "onko tämä lukiolaiselle vai aikuiselle vai keille?". Vanhempi joka selaa ei näe että tuote on lukiolaiselle lyhyen oppimäärän YO-kokeeseen.

### Bugi 3: Parent-trust puuttuu

Vanhempi joka harkitsee maksaa Pro-tilauksen: ei näe yhtään uskottavuus-signaalia heron foldissa. "Ei luottokorttia" + "Suomen kielellä" eivät vakuuta että tuote toimii. YTL-rubriikki mainitaan vain sub-tekstissä missä se hukkuu.

---

## Mitä writer tekee

### Step 1: Kirjoita 3-5 headline-vaihtoehtoa

**Constraint-lista** (kaikki täytyttävä):
- Mainitse kielet (espanja, ranska, saksa) tai vähintään "lyhyen kielen YO-koe" + kielet näkyvissä jossain heron foldissa
- Säilytä `text-transform: lowercase` -estetiikka **EI**, säilytä natural-case suomi (ei All Caps)
- Italic-accent yhdellä avainsanalla on jo olemassa (`.hero__title-accent` + `--ed-italic-accent` token); käytä jos sopii, mutta vain yhdessä avainsanassa per otsikko (ei dekoraatiota)
- Suomi-äidinkielinen, ei käännös, ei "elevate/seamless/kalibroitu" -slop
- **Pakollinen humanizer-skill-tarkistus** ennen committia (em-dash, AI-brand-sanat, rule-of-three, sycophantic openers, generic conclusions)

**Esimerkki-suunnat** (älä kopioi suoraan — kirjoita 3-5 omaa ja vertaa):
- Kieli-eksplisiittinen: "Espanjan, ranskan ja saksan YO-koe on kirjoituskoe."
- Action-painotteinen: "Kirjoita läpi lyhyen kielen YO-koe."
- Audienssi-eksplisiittinen: "Lukiolaiselle: lyhyen kielen YO-kirjoituskoe ilman kalliita kursseja."
- Concrete + lyhyt: "Lyhyen kielen YO-koe: espanja, ranska, saksa."
- (kirjoita 1-2 lisää omaa varianttia)

### Step 2: Marcel valitsee

Tallenna 3-5 varianttia briefiin tämän loopin lopussa:

```
### Päätös 2026-05-27 (loopin lopuksi)
Variantti X valittu, koska <yhden virkkeen perustelu>.
```

**Älä committaa headline-muutosta ennen Marcelin hyväksyntää.** Copy-päätös = brand-päätös.

### Step 3: Päivitä otsikko, sub, ja trust-rivi yhdessä

Headline-muutoksen yhteydessä päivitä myös:

**Sub-line** (`index.html:148-152`) — säilytä rakenne, päivitä että lukee yhteen otsikon kanssa. Esim. jos headline mainitsee kielet, sub voi keskittyä YTL-rubriikkiin ja "kymmenen minuuttia päivässä" -lupaukseen. Yksi pakollinen kohta: **mainitse YTL-rubriikki tässä**, ei vain trust-rivissä.

**Trust-rivi** (`index.html:171-177`) — säilytä eyebrow-rakenne (3-4 itemiä erotettu `·`-pisteellä). Päivitä että yksi rivi puhuttelee maksavaa vanhempaa konkreettisesti. Esim:
- "Lukion lyhyt oppimäärä · YTL:n rubriikilla pisteytetty · 90 oppituntia, 8 kurssia"
- Pakollinen kahdessa kohdassa: lukio-konteksti (= "kenelle") + kvantitatiivinen kuvio (= "kuinka paljon sisältöä")

**Älä lisää uusia DOM-elementtejä** (ei uusia korttia, ei badgeja, ei "trusted by X students" -mock-laatikkoa). Vain otsikon + sub:n + trust-rivin tekstin muutos olemassaolevassa rakenteessa.

### Step 4: Tarkista että `.hero__lang-row` näkyy mobiilissa

`index.html:154-161`:
```html
<div class="hero__lang-row" aria-label="Tarjotut kielet">
  <span class="hero__lang-label">Kielet</span>
  <span class="hero__lang-pills">
    <span class="hero__lang-pill" lang="es">Español</span>
    <span class="hero__lang-pill" lang="fr">Français</span>
    <span class="hero__lang-pill" lang="de">Deutsch</span>
  </span>
</div>
```

Tämä rivi pitäisi nyt näkyä mobile-foldissa (L-V326:n jälkeen). Tarkista visuaalisesti (Playwright screenshot iPhone 13 -koossa) että se renderöityy:
- Foldissa (ei scrollin alla)
- Yhdellä rivillä (ei rivinvaihtoa per pill) — jos rivinvaihtoa tulee, säädä `flex-wrap` tai pienennä padding

Jos lang-row on jo riittävän hyvä, älä koske CSS:ään. Jos näkyy mutta visuaali on heikko, lisää korjauksen mukaan **vain minimimuutos** `css/landing-editorial.css`:ään.

### Step 5: Aja humanizer-tarkistus uudelle copy:lle

Pakollista CLAUDE.md:n mukaan. Käy läpi headline + sub + trust-rivi sääntöjen kanssa:
- Ei em-dashia
- Ei AI-brand-sanoja ("seamless", "elevate", "kalibroitu", "intuitiivinen", "monipuolinen")
- Ei rule-of-three -listoja jokaisessa virkkeessä
- Ei sycophantic openers
- Ei generic conclusions
- Ei fake provable claims (lukio-nimet, %-luvut)
- Ei italic Fraunces "Ladataan…" -kuvioita

Jos joku copy-rivi failaa, kirjoita uudelleen.

### Step 6: Verify

```bash
npx playwright test tests/e2e-bug-scan.spec.js     # 38/38 PASS
npx playwright test tests/e2e-brand.spec.js        # 16/16 PASS
npm run build                                      # frontti-bundle päivittyy
```

Lisäksi visual:
- Mobile iPhone 13 screenshot: foldissa otsikko + sub + kieli-signaali + CTA (ja ei kuvitusta, ei countdownia L-V326:n jäljiltä)
- Desktop 1280px screenshot: hero näkyy entiseen tapaan paitsi uusilla teksteillä

### Step 7: Päivitä IMPROVEMENTS.md + SW

Bumppaa `sw.js` CACHE_VERSION (oletettavasti v322 → v323 jos L-V326 oli v322). Lisää yksi rivi IMPROVEMENTS.md:hen.

---

## Acceptance criteria

1. Headline mainitsee joko kielet eksplisiittisesti TAI "lyhyen kielen YO-koe" + `.hero__lang-row` näkyy mobile-foldissa
2. Sub-line mainitsee YTL-rubriikin
3. Trust-rivi sisältää lukio-kontekstin + kvantitatiivisen kuvion
4. **Kaikki copy-rivit ovat humanizer-säännöt täyttäviä** (ei em-dashia, ei AI-brand-sanoja, jne.)
5. Mobile <720px viewport: kaikki hero-elementit foldissa (otsikko, sub, kieli-rivi, CTA, trust)
6. Desktop ≥980px: hero näyttää muuttumattomalta paitsi uusilla teksteillä
7. `npm run test:bug-scan` 38/38 PASS
8. `tests/e2e-brand.spec.js` 16/16 PASS
9. Marcel hyväksyy headline-variantin ennen committia

---

## Out-of-scope

- **Per-kieli-landingit** (`public/landing/{es,de,fr}.html`) — niiden headline-copy on jo kohdistettu kieleen, ei tarvitse muokata tässä loopissa
- **Desktop-heron kuvitus** — säilyy nykyisellään L-V326:n päätöksen mukaan
- **Live AI grader heroon** (Council Expansionist-ehdotus) — eri scope, eri loop
- **Plausible/GA-instrumentointi CTA-clickille** — eri loop L-V328 jos halutaan
- **Hero__teaser-blokki** (`index.html:179-187` mockuppi YTL-arvioinnista) — säilytä nykyisellään, ei muokata tässä loopissa

---

## Skill-stack writerille

**Pakollinen päällekkäisyys**: tämä loop kirjoittaa käyttäjälle näkyvää suomi-tekstiä → COPY pätee aina päälle. Stack on FRONTEND-M + COPY:

FRONTEND-M (hero-komponentin tekstisisällön + mahdollisesti CSS:n säätö):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`

COPY (suomi-tekstin tarkistus):
- `humanizer` (PAKOLLINEN — ks. CLAUDE.md memory `feedback_humanizer_required`)

Total: 4 skilliä.

---

## Päätös-rekap

L-V326 ratkaisi "kuvitus dominoi foldia". Tämä loop ratkaisee "otsikko ei kerro audienssille kenelle/mistä kielistä on kyse" + "vanhempi-konversio-signaali puuttuu". Council 5/5 peer-reviewerit nostivat headline-jargon + multi-language-signal + parent-segment puuttumisen kolmena samansuuruisena puutoksena.

Ei muokkaa rakennetta, lisää uusia elementtejä, eikä koske desktop-CSS:ään. Pelkkä copy + olemassaolevan rakenteen säätö.

Realistinen scope: 45-90 min kun headline-variantit on kirjoitettu ja Marcelin valinta tehty.
