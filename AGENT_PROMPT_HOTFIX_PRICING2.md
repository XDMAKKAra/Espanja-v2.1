# Agent Prompt — HOTFIX: Free-cardin missing-rivit ovat purppuroita link-spamia

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **hotfix**, ei looppi. Korjaa LPLAN8 UPDATE 4A:n virhetulkinta jossa tooltipien sijaan riveistä tehtiin alleviivattuja linkkejä joilla on browser-default purppura väri.

---

## Lue ensin

1. `index.html` `#hinnoittelu`-osio — Free-card `<li class="pricing-card__feature--no">`-rivit
2. `css/landing.css` `.pricing-card__feature--no` -selektorit + `a`-selektorit
3. `IMPROVEMENTS.md` viimeiset 30 riviä — tarkista mitä LPLAN8 UPDATE 4A oikeasti shippasi

---

## Konteksti

Production https://espanja-v2-1.vercel.app/index.html#hinnoittelu näyttää 2026-05-03:

> ✗ Ei sisälly: Adaptiivinen kertausjono virheidesi pohjalta 7 pv → (purppura, alleviivattu)
> ✗ Ei sisälly: Rajaton kirjoitusarviointi YTL-rubriikilla 7 pv → (purppura, alleviivattu)
> ✗ Ei sisälly: Henkilökohtainen YO-valmius-mittari 7 pv → (purppura, alleviivattu)

Kolme ongelmaa:

1. **Browser-default link-tyyli** — purppura + underline. Ei matchaa Linear-tier estetiikkaa miltä muu sivu näyttää. Joku stylebrand-token on jätetty soveltamatta.
2. **"Ei sisälly:" + "7 pv →"** sisältyy linkin tekstiin, mikä tekee koko rivistä yhden ison linkin sen sijaan että olisi feature-rivi + erillinen toiminto.
3. **Kolme rinnakkaista linkkiä** vaikuttaa siltä että jokainen rivi on oma erillinen 7-päivän kokeilu. LPLAN8 UPDATE 4A:n alkuperäinen idea oli **tooltip joka aukeaa hover/tap:llä**, jossa olisi *yksi* CTA per tooltip — ei kolme aina-näkyvää linkkiä.

Käyttäjän viesti suoraan: **"tää on aika buns"** — tarkoittaa: ei toimi visuaalisesti eikä konversiona.

---

## Tavoite

Palautetaan LPLAN8 UPDATE 4A:n alkuperäinen suunnitelma: rivit ovat staattisia teksteinä (ei linkkejä), ja tooltip aukeaa kun hiiri menee päälle TAI tap-pidolla mobiililla. Tooltipissa on selitys + yksi yhteinen Pro-CTA.

---

## Tehtävä

### Vaihe 1 — Selvitä miten rivit on nyt rakennettu

Aja:
```bash
grep -n "pricing-card__feature--no\|Ei sisälly\|7 pv" index.html css/landing.css
```

Tunnista:
- Ovatko rivit `<a>`-tageja vai `<li>`-tageja joiden sisällä on `<a>`?
- Mihin URL:iin linkki vie nyt?
- Onko CSS:ssä mitään `.pricing-card__feature--no a` -selektoria, vai onko purppura puhtaasti browser default?

Raportoi käyttäjälle yhdellä lauseella mitä löysit, mene sitten suoraan vaiheeseen 2.

### Vaihe 2 — Poista linkit kokonaan, palauta staattinen rivi

Jokainen Free-cardin missing-feature-`<li>` palautetaan tähän rakenteeseen:

```html
<li class="pricing-card__feature pricing-card__feature--no" aria-disabled="true">
  <svg class="pricing-card__icon pricing-card__icon--no" aria-hidden="true" viewBox="0 0 16 16">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>
  <span class="sr-only">Ei sisälly: </span>
  <span class="pricing-card__feature-text">Adaptiivinen kertausjono virheidesi pohjalta</span>
</li>
```

Huomioi:
- **Ei `<a>`** — ei linkkiä riviin
- **Ei "7 pv →"** -tekstiä rivillä — se siirtyy tooltipiin (vaihe 3)
- `sr-only`-span jää (screenreader lukee "Ei sisälly: …")
- Visuaalinen X-ikoni on SVG `aria-hidden`, ei tekstinä

### Vaihe 3 — Lisää tooltip per rivi

Tooltip aukeaa hoverilla (desktop) ja tap-pidolla 400 ms (touch). Käytä **yhtä tooltip-primitiviä** joka kierrätetään myös LPLAN8 UPDATE 6C:n lukittu-kurssikortti-tooltipissa (jos sellainen on jo olemassa, käytä SAMAA — älä luo toista).

Etsi ensin:
```bash
grep -rn "data-tooltip\|role=\"tooltip\"\|aria-describedby" js/ css/ index.html app.html
```

Jos löytyy olemassa oleva tooltip-komponentti (UPDATE 6C teki sellaisen — `data-tooltip="…"` -attribuutti), kierrätä se. Jos ei, sourcaa 21st.dev:stä:
1. Visit `21st.dev/s/tooltip` Playwrightilla
2. Screenshot 2 kandidaattia → `references/app/landing-polish-l8/21stdev/tooltip/`
3. Pick most restrained dark
4. Port vanilla CSS:nä, ei React

### Vaihe 4 — Tooltip-sisältö per rivi

Käytä näitä TASMÄLLEEN, älä keksi omia (LPLAN8 UPDATE 4A spec):

| Rivi | Tooltip-teksti |
|---|---|
| Adaptiivinen kertausjono virheidesi pohjalta | Vain virheesi joista oppinet eniten — Pro:ssa kertausjono kasvaa joka virheen jälkeen. **Kokeile 7 pv ilmaiseksi →** |
| Rajaton kirjoitusarviointi YTL-rubriikilla | Vapaassa 3 kirjoitusta/kk. YO-koetta varten suositus on 1–2 kirjoitusta/viikko. **Kokeile 7 pv ilmaiseksi →** |
| Henkilökohtainen YO-valmius-mittari | Päivittäin päivittyvä YO-valmius-prosentti 4 osa-alueen tarkkuudella. **Kokeile 7 pv ilmaiseksi →** |

**Bold-osa** on klikattava ainoa CTA tooltipissa. Linkki menee `/app.html#rekisteroidy?action=trial`. Tooltip itsessään EI ole linkki — vain viimeinen "Kokeile 7 pv ilmaiseksi →" -teksti tooltipin sisällä.

### Vaihe 5 — CSS-fix joka takaa ettei browser-default link-tyyli vuoda

Lisää `css/landing.css`:n loppuun:

```css
/* Estä browser-default linkki-tyyli vuotamasta hinnoittelu-cardiin */
.pricing-card__feature a {
  color: inherit;
  text-decoration: none;
}
.pricing-card__feature a:hover,
.pricing-card__feature a:focus {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.pricing-card__feature a:visited {
  color: inherit;
}

/* Tooltip — yhtenäinen primitiivi */
[data-tooltip] {
  position: relative;
  cursor: help;
}
[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: var(--surface-elevated, #1a1a1a);
  color: var(--text);
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.45;
  width: max-content;
  max-width: 280px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease, transform 150ms ease;
  z-index: 10;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
[data-tooltip]:hover::after,
[data-tooltip]:focus-visible::after,
[data-tooltip].is-tap-active::after {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Mobiilireunoissa flip vasemmalle/oikealle */
@media (max-width: 480px) {
  [data-tooltip]::after {
    left: 0;
    transform: translateY(4px);
    max-width: calc(100vw - 32px);
  }
  [data-tooltip]:hover::after,
  [data-tooltip].is-tap-active::after {
    transform: translateY(0);
  }
}
```

**Huom:** jos UPDATE 6C teki jo `data-tooltip`-pohjan, älä duplikoi sitä — käytä olemassa olevaa ja lisää vain `.pricing-card__feature a` -reset-säännöt.

### Vaihe 6 — Touch-tap-handler

Tooltip joka aukeaa vain hoverilla on saavuttamaton mobiililla. Lisää (`js/features/tooltip.js` tai mihin se nyt onkaan):

```js
// Tap-pito 400 ms aukaisee tooltipin mobiililla
document.querySelectorAll('[data-tooltip]').forEach((el) => {
  let pressTimer;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    pressTimer = setTimeout(() => el.classList.add('is-tap-active'), 400);
  });
  el.addEventListener('pointerup', () => clearTimeout(pressTimer));
  el.addEventListener('pointercancel', () => clearTimeout(pressTimer));
});

// Tap muualla sulkee
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('[data-tooltip].is-tap-active')) {
    document.querySelectorAll('[data-tooltip].is-tap-active')
      .forEach((el) => el.classList.remove('is-tap-active'));
  }
});
```

Jos UPDATE 6C teki tämän jo, kierrätä.

---

## Verifiointi

1. **Visuaalinen**: avaa http://localhost:3000/index.html#hinnoittelu — Free-cardin missing-rivit ovat **muted**, X-ikoni vasemmalla, EI purppuraa, EI underlinea, EI "7 pv →" -tekstiä rivillä
2. **Hover** missing-rivin päälle → tooltip aukeaa cardin yläpuolelle, sisältää selityksen + "Kokeile 7 pv ilmaiseksi →" linkin
3. **Klikkaa** tooltipin CTA → menee `/app.html#rekisteroidy?action=trial`
4. **Mobiili** (DevTools touch-emulation): tap-pito 400 ms aukaisee tooltipin, tap muualla sulkee
5. **Keyboard**: Tab missing-riviin → focus-ring näkyy → tooltip aukeaa focus:lla
6. **Screenreader**: VoiceOver/NVDA lukee "Ei sisälly: Adaptiivinen kertausjono…" — ei "Ei sisälly: Adaptiivinen kertausjono 7 pv link"
7. **axe-core** `#hinnoittelu` → 0 violations
8. `npm test` → kaikki vihreänä

---

## Dokumentointi

1. **IMPROVEMENTS.md** uusi rivi:
   `[2026-MM-DD HOTFIX-PRICING2] LPLAN8 UPDATE 4A korjattu — purppurat alleviivat linkit poistettu, palautettu staattiset rivit + hover/tap-tooltip "Kokeile 7 pv ilmaiseksi →" -CTA:lla. Tooltip-primitiivi yhtenäinen UPDATE 6C:n kanssa.`
2. **AGENT_STATE.md** EI päivity — hotfix ei ole loop.
3. **SW-bumppi** vain jos uusi `tooltip.js` lisättiin STATIC_ASSETSiin. Muuten ei.

---

## Mitä EI saa tehdä

- ÄLÄ palauta linkkejä mihinkään muotoon riveille — vain tooltipissa CTA
- ÄLÄ lisää 3 erillistä CTA-nappia cardin alle ("Kokeile A, Kokeile B, Kokeile C") — yksi CTA per tooltip riittää, alkuperäinen "Kokeile Pro 7 pv ilmaiseksi" -nappi cardin alaosassa pysyy ennallaan
- ÄLÄ koske Pro-cardiin
- ÄLÄ vaihda missing-rivien tekstiä — vain CSS + tooltip-rakenne muuttuu
- ÄLÄ käytä `<details>`-tagia tai accordionia — tooltip on tooltip, ei collapsible

---

## Lopputulos käyttäjälle

Yhdellä viestillä:
- Mitä LPLAN8 UPDATE 4A oikeasti shippasi (purppurat linkit) ja miksi se oli väärin
- Mitä tämä hotfix tekee (staattiset rivit + tooltip)
- Vercel preview-deploy URL kun pushattu
- Vahvistus että rakenne on nyt LPLAN8 UPDATE 4A:n alkuperäisen spec:in mukainen
