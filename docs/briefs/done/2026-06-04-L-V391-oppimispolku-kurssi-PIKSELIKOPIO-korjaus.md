# L-V391 — KORJAUS: Oppimispolku + Kurssi näytöt pikselilleen exportin mukaan (V388 kopioi väärin)

**Numero:** käytä seuraavaa vapaata L-VXXX jos viety. **Korjaa L-V388:n huonon kopion.**

**Skill-stack:** FRONTEND-L (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + TESTING-M (`webapp-testing`).

**Rooli:** writer. Tämä EI ole uusi näkymä — V388 toteutti oppimispolku- ja kurssinäytöt, mutta ei kopioinut designia uskollisesti vaan **keksi omaa**. Korjaa niin että lopputulos on **pikselilleen** sama kuin export.

---

## Sääntö: PIKSELIKOPIO, ei tulkinta

Lähde (totuus): **`docs/design-ref/app-export/`** — `Oppimispolku.jsx`, `Kurssi.jsx`, `Icons.jsx`, `kit.css` (`.lp-*`, `.lesson-*`, `.cd-*`, `.lp-illu`), `colors_and_type.css`. **Avaa `docs/design-ref/app-export/index.html` selaimessa ja pidä se vieressä koko ajan.** Lopputuloksen pitää näyttää siltä. Verifiointi = **screenshot-diff exportin index.html:ää vasten** (oppimispolku + kurssi, desktop). Jos eroaa, ei ole valmis.

Kopioi `kit.css`:n säännöt **verbatim** (samat padding/gap/border/radius/väri-arvot), toista DOM + luokkanimet, kopioi SVG-polut verbatim. Ainoa muunnos = JSX → meidän vanilla-renderöinti + oikea data (per-kieli-progress, ks. L-V390).

## Nimetyt poikkeamat jotka KORJATAAN (nykyinen vs export)

### 1. Polku-kuvitus — writer keksi täysin oman, KORVAA exportin SVG:llä
**Nykyinen (väärin):** iso keltainen pyöreä laatikko, paksu punainen katkoviiva-"tie", keltainen pallo, é/ñ-chipit, sparkle-tähti. **Tätä ei ole exportissa.**
**Export (oikein):** hento, pieni, läpinäkyvätaustainen ohut katkoviiva-SVG (`.lp-illu`, 186×92), väri `--border-strong`, alussa pieni **vihreä** check-ympyrä, lopussa **brick**-lippu. Kopioi `Oppimispolku.jsx`:n `PathIllu` **sellaisenaan**:

```html
<svg class="lp-illu" width="186" height="92" viewBox="0 0 186 92" fill="none" aria-hidden="true">
  <path d="M8 76 C 44 76, 40 30, 78 30 S 130 64, 158 26" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="2 9"/>
  <circle cx="8" cy="76" r="9" fill="var(--bg-card)" stroke="var(--success)" stroke-width="2.5" class="done"/>
  <path d="M4.5 76 L7 78.5 L11.5 73.5" stroke="var(--success)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="78" cy="30" r="6" fill="var(--bg-card)" stroke="currentColor" stroke-width="2.5"/>
  <circle cx="120" cy="48" r="5" fill="var(--bg-card)" stroke="currentColor" stroke-width="2.5"/>
  <g class="flag">
    <path d="M158 26 V 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M158 9 h 16 l -4 6 l 4 6 h -16 z" fill="currentColor"/>
  </g>
</svg>
```
CSS: `.lp-illu { color: var(--border-strong); margin-top: 4px; flex: none; } .lp-illu .flag { color: var(--brick); } .lp-illu .done { color: var(--success); }`. **Poista keksitty kuvitus kokonaan.**

### 2. Lukitut kurssirivit — palauta lock-ikoni + poista irralliset viivat
**Nykyinen (väärin):** lukitun rivin oikealla on irrallinen vaakaviiva, EI lock-ikonia.
**Export (oikein):** `.lp-row--locked` = katkoviivareunus (`border-style: dashed`), `opacity: 0.72`, oikealla `.lp-row__lock` = **lukko-ikoni** (`Icons.jsx` `lock`) + teksti "Avautuu vuorollaan" (`--ink-subtle`, 13px). Ei mitään irrallista viivaa.

### 3. Aktiivinen kurssirivi — ei irrallista viivaa pillin yllä
**Export:** `.lp-row--active` = brick-reunus + `--bg-tint`-tausta, vasen numero brick (`--brick`), oikealla brick-pilli "1 / 10 oppituntia" + chevron-ikoni. **Ei** viivaa pillin päällä.

### 4. Kurssinäkymän header — kopioi exportin sommittelu, ei rikkovaa kolmisaraketta
**Nykyinen (väärin):** leveällä ruudulla header hajoaa (otsikko vasemmalla, kuvaus keskellä, progress oikealla ahtaana, "oppituntia · 10 %" katkeaa rumasti).
**Export (oikein, `.cd-head`):** breadcrumb → eyebrow (`ESPANJA · KURSSI 1 · TASO A`) → iso h1 → kuvaus (`--ink-muted`, max 60ch) → `.cd-progress` = teksti `1 / 10 oppituntia · 10 %` + **vihreä** palkki (`.cd-progress .bar > span` = `--success`), max-width 320px. Toista tämä sommittelu sellaisenaan; älä keksi kolmisaraketta joka katkeaa.

### 5. Oppituntirivit — exportin `.lesson-row` sellaisenaan
Numero (`1.1`, `--ink-faint`, aktiivinen brick) + tyyppi-eyebrow (`Sanasto`/`Kielioppi`/`Yhdistelmä`, 11px) + otsikko (Fredoka 15.5px) | oikealla `~14 min` + `Suoritettu` (vihreä `circle-check`) TAI `Aloita →` (aktiivinen = brick-nappi, muut = ghost). Aktiivinen rivi `.lesson-row--active` = `--bg-tint` + brick-reunus + radius. Hairline-erottimet rivien välissä. Ei poikkeamia.

## Constraintit
- **PYHÄ RAJA:** vain oppimispolku- + kurssinäkymä + niiden CSS (+ `.lp-illu`-SVG). Ei muuta. Data/kieli/Pro-bugit = L-V390 (eri loop).
- 0 uutta väriä/fonttia exportin tokenien ulkopuolelta. Ei keksittyjä kuvituksia, chipejä, sparkleja.
- Mobiili: exportin `@media (max-width:620px)` -säännöt (`.lp-illu { display:none }`, rivien sarakkeet kapenevat) — kopioi nekin.
- `npm run build` + sw CACHE_VERSION jos STATIC_ASSETS muuttuu.

## Acceptance criteria
- **Screenshot-diff:** meidän oppimispolku + kurssi näyttävät pikselilleen samalta kuin `docs/design-ref/app-export/index.html` (desktop). Poikkeamat 1–5 korjattu.
- Polku-kuvitus = exportin hento katkoviiva-SVG, EI keksittyä keltaista laatikkoa.
- Lukitut rivit: lock-ikoni + "Avautuu vuorollaan", katkoviivareunus, ei irrallisia viivoja.
- Kurssi-header ei hajoa leveällä ruudulla; vihreä progress-palkki.
- Playwright: oppimispolku + kurssi renderöityvät, navigointi polku→kurssi toimii; spec tarkistaa että `.lp-illu` on SVG (ei kuvalaatikko) ja `.lp-row--locked` sisältää lock-ikonin.
- Screenshotit desktop + mobiili ennen/jälkeen, rinnakkain exportin kanssa.

## Out of scope
- Pro-status + kieli/progress-data → L-V390.
- MC-harjoitus + sidebar (jos ne ovat ok; jos eivät, erikseen).
