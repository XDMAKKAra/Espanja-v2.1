# Agent Prompt — HOTFIX: Pricing-cardin Free/Pro-rajat vuotavat

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **hotfix**, ei looppi. Tarkoitus: korjaa yksi monetisaatio-kriittinen regressio production-landingissa nopeasti, ilman koko L-PLAN-8:n odotusta. Tee → committaa → deploy → palaa L-PLAN-8 / muu työ.

---

## Lue ensin

1. `index.html` hinnoittelu-osio (`<section id="hinnoittelu">` tai vastaava — grep "Ilmainen" ja "Pro")
2. `css/landing.css` `.pricing-*` -selektorit
3. `IMPROVEMENTS.md` viimeiset 60 riviä — tarkista milloin pricing-cardit viimeksi rakennettiin uudestaan ja löytyykö selitystä siitä mitä piti tapahtua

---

## Konteksti

Production landing https://espanja-v2-1.vercel.app/index.html#hinnoittelu näyttää 2026-05-03 tilanteessa **Ilmainen-cardin featurelistana KAIKKI Pro-featuret ilman x-merkkejä** — eli Ilmainen ja Pro näyttävät tarjoavan saman.

Käyttäjä otti screenshotin aiemmin (sama keskustelu) jossa Ilmainen-cardissa oli **3 ✗-merkittyä riviä**:
- ✗ Adaptiivinen kertausjono virheidesi pohjalta
- ✗ Rajaton kirjoitusarviointi YTL-rubriikilla
- ✗ Henkilökohtainen YO-valmius-mittari

Nykyisessä DOM-puussa ne ovat listitemeinä ilman x-merkkiä saman `list "Ilmaisen ominaisuudet"` alla. Joko (a) Pro/Free-rajat oikeasti sulautuivat jossain commitissa, tai (b) renderöinti bugaa ja x-merkit tiputettiin pois CSS-refaktorissa.

**Tämä rikkoo monetisaation:** Ilmainen-käyttäjällä ei ole enää syytä päivittää Pro:hon koska kortti lupaa kaikki Pro-featuret jo ilmaiseksi. Backend-rajat (Pro-gating, `requirePro` middleware, kirjoitusarvioinnin 3/kk-katto Free:lle) **eivät ole muuttuneet** — eli käyttäjä rekisteröityy Free:hen, kohtaa rajat tuotteessa, kokee että landing valehteli, ja churnaa.

---

## Tehtävä

### Vaihe 1 — Selvitä juurisyy

`grep -n "Adaptiivinen kertausjono\|Rajaton kirjoitusarviointi\|Henkilökohtainen YO-valmius" index.html` → kerro käyttäjälle mitä löytyy ja miltä rivit näyttävät. Selvitä git-historiasta milloin x-merkit poistettiin: `git log -p -S "✗" -- index.html` tai `git log -p -S 'plan-x' -- index.html`.

Jos juurisyy on:
- **Tahallinen muutos** ("yhdistettiin pricing-cardit yhdeksi listiksi") → kerro käyttäjälle ja KYSY ennen kuin korjaat
- **Tahaton refaktorin sivuvaikutus** → korjaa suoraan vaiheen 2 mukaan

### Vaihe 2 — Korjaa Ilmainen-cardin featurelista

Ilmainen-cardin `<ul>`/`<list>` pitää sisältää **vain** Free-tason featuret + erikseen merkityt **3 missing-riviä**.

**Free-featuret** (✓):
1. Päivittäinen sanasto- ja kielioppiharjoitus
2. Kolme kirjoitustehtävän AI-arviointia kuukaudessa
3. Päivän haaste ja sana päivässä

**Missing Pro-featuret Free-cardissa** (✗ tai vastaava muted-tila):
4. Adaptiivinen kertausjono virheidesi pohjalta
5. Rajaton kirjoitusarviointi YTL-rubriikilla
6. Henkilökohtainen YO-valmius-mittari

**Visual-treatment missing-riveille** — käytä yhtä näistä, mikä matchaa olemassa olevan design-system tokenit (tarkista `css/landing.css`):

Vaihtoehto A — `<li class="pricing-li pricing-li--missing">` jossa:
```css
.pricing-li--missing {
  color: var(--text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--text-muted);
  text-decoration-thickness: 1px;
}
.pricing-li--missing::before {
  content: "✗";
  color: var(--text-muted);
  margin-right: 0.5em;
  text-decoration: none;
  display: inline-block;
}
```

Vaihtoehto B — kirjoita `aria-disabled="true"` + screenreader-friendly span:
```html
<li class="pricing-li pricing-li--missing" aria-disabled="true">
  <span class="sr-only">Ei sisälly: </span>
  Adaptiivinen kertausjono virheidesi pohjalta
</li>
```

Käytä **vaihtoehtoa B** — semanttisesti oikeampi, axe-core ei valita, screenreader lukee "Ei sisälly: Adaptiivinen kertausjono…" mikä on selvempi kuin pelkän line-through:n välittäminen.

Jos `pricing-li--missing` -luokkaa ei vielä ole `css/landing.css`:ssä, lisää se sinne:
```css
.pricing-li[aria-disabled="true"] {
  color: var(--text-muted);
  opacity: 0.65;
}
.pricing-li[aria-disabled="true"]::before {
  content: "✗";
  color: var(--text-muted);
  margin-right: 0.5em;
}
.pricing-li[aria-disabled="true"] .sr-only {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap;
}
```

Tarkista ettei `.pricing-li::before { content: "✓" }` jo aja yli — jos ajaa, käytä spesifisempää selektoria järjestyksessä viimeiseksi.

### Vaihe 3 — Pro-cardin lista pysyy

Pro-cardin lista on jo oikein (per DOM-puu): "Kaikki Ilmaisen ominaisuudet" + 5 Pro-spesifistä. Älä koske.

---

## Verifiointi

1. `grep -c "pricing-li--missing\|aria-disabled" index.html` → vähintään 3 (yksi per missing-feature)
2. Avaa http://localhost:3000/index.html#hinnoittelu paikallisesti — silmin tarkista että Ilmainen-card näyttää 3 ✓ + 3 ✗
3. axe-core sweep `#hinnoittelu`-osiolla → 0 violations
4. Screenreader-test (VoiceOver tai NVDA jos saatavilla, muuten manuaalisesti tab+enter):
   - Ilmainen-cardin missing-rivien pitää lukea "Ei sisälly: Adaptiivinen kertausjono…" — ei pelkkää "Adaptiivinen kertausjono"
5. `npm test` — Lighthouse a11y ei pudonnut

---

## Dokumentointi

1. **IMPROVEMENTS.md** uusi rivi:
   `[2026-MM-DD HOTFIX-PRICING] Pro-featuret vuotivat Ilmainen-cardiin (regressio commitistä <sha>) → palautettu 3 missing-riviä aria-disabled-treatmentillä. Backend-rajat eivät muuttuneet. Cite: aiempi screenshot vs nykyinen DOM.`
2. **AGENT_STATE.md** EI päivity — tämä on hotfix, ei loop. Seuraava loop on edelleen mikä se oli ennen tätä.
3. **SW-bumppi:** ei tarvita jos vain index.html + landing.css muuttui (eivät ole STATIC_ASSETSissa). Tarkista kuitenkin, jos landing.css on listattu, bumppaa.

---

## Mitä EI saa tehdä

- ÄLÄ vaihda Free/Pro-tasojen oikeita featurerajoja koodissa — vain landing-listaa
- ÄLÄ poista featuretia Pro-cardista
- ÄLÄ lisää tooltipia tähän hotfixiin (se on UPDATE 4 L-PLAN-8:ssa — pidetään polish-loopissa)
- ÄLÄ muuta hintaa, "Suosituin"-badgea tai CTA-painikkeita
- ÄLÄ tee tästä koko pricing-cardin uudelleenrakennusta — vain listan korjaus

---

## Lopputulos käyttäjälle

Yhdellä viestillä:
- Mikä commit aiheutti regressio (sha + päivämäärä)
- Mitä korjattiin (Free-cardin lista 6-rivisenä: 3 ✓ + 3 ✗)
- Linkki paikalliseen previewiin / vercel preview-deployment
- Vahvistus että Pro/Free backend-rajat ovat ennallaan
- Muistutus että L-PLAN-8 UPDATE 4 lisää tooltipit näille missing-riveille seuraavassa loopissa
