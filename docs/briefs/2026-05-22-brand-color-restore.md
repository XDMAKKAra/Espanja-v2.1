# BRIEF: Brand-värin palautus v276 — brick #A0341F app-puolelle

**Päivä:** 2026-05-22
**Versio:** v276
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v275 (app shell -kovettaminen) — tämä jatkaa siitä mistä v275 lopetti (V13 Pro-badge contrast)
**Lähde:** kokonaisaudit (2026-05-22), erityisesti löydös: "brand-väri brick #A0341F ei ole käytössä missään"
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng). Kutsu Skill-toolia aidosti.

---

## Tavoite

Palauta Puheon brand-väri brick `#A0341F` näkyväksi app-puolen avain-elementteihin: sidebar-active, primary-CTA-napit, Pro-badge, link-aksentit. Tällä hetkellä app-tokens.css käyttää mint-vihreää joka ei vastaa brändiä — landing on Old Spain (cream + brick + warm-black), app on irrallaan.

EI uudelleenmaalata koko sovellusta. Vain ne ~6 paikkaa joissa "korostusväri" esiintyy.

---

## Konteksti

Memory `feedback_landing_direction_2026_05_18.md`: hyväksytty palette on Old-Spain (cream `oklch(99% 0.002 75)` + brick `#A0341F` + warm-black). Landing käyttää tätä oikein. App-puoli puolestaan käyttää mint-gradienttia (`--grad-pro` ≈ `linear-gradient(130deg, var(--accent), var(--accent-hover))` jossa `--accent` on mint).

Kun käyttäjä siirtyy landingilta appiin, brand-yhtenäisyys katkeaa. Aiotaan yhtenäistää.

Tämä ei ole täydellinen brand-pass — vain primaarit korostuspaikat. Jos jotain unohtuu, se voidaan ottaa myöhemmässä passissa.

---

## Käytettävät värit

Lisää tokens.css:ään (tai App-shell-scopeen jos jaetussa tiedostossa):

```css
:root {
  /* Brand — Old Spain palette */
  --brand-brick: #A0341F;
  --brand-brick-hover: oklch(40% 0.13 30);    /* hieman tummempi, tarkista DevToolsissa */
  --brand-brick-soft: oklch(94% 0.04 30);      /* hyvin vaalea brick — sidebar-active-bg */
  --brand-brick-on-light: #fff;                /* teksti briickin päällä */
}
```

Jos `:root`-scope on jo landing-CSS:ssä ja appilla on oma scope (`body.app-shell` tai vastaava), lisää sinne. **ÄLÄ muuta landing-CSS:n värejä** — niiden pitää pysyä Old-Spain-paletteissa entisellään.

---

## Fixet (per käyttöpaikka)

### 1. Sidebar active -tila

**Tiedosto:** `style.css` `.sidebar-item.active` (tai `.sidebar-item[aria-current]`, etsi grepillä)

**Korjaus:**
```css
.sidebar-item.active {
  background: var(--brand-brick-soft);
  color: var(--brand-brick);
  /* Säilytä muut ominaisuudet jotka jo ovat */
}
.sidebar-item.active::before {
  /* Jos käytetään ::before-indikaattoria, käytä brickiä mutta EI side-stripe-borderia
     (Emil + impeccable absolute ban). Käytä esim. pyöreää dotia. */
  content: "";
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--brand-brick);
  margin-right: 8px;
}
```

**Varmista:** ei `border-left: 3px solid var(--brand-brick)` — se on side-stripe-ban.

### 2. Primary CTA -napit

**Tiedosto:** `style.css` `.btn.btn--primary` (tai vastaava — etsi grepillä `--primary` ja `.btn`)

**Korjaus:**
```css
.btn.btn--primary,
.btn-primary {
  background: var(--brand-brick);
  color: var(--brand-brick-on-light);
  border: 1px solid var(--brand-brick);
  /* Säilytä border-radius, padding, etc. */
}
.btn.btn--primary:hover,
.btn-primary:hover {
  background: var(--brand-brick-hover);
  border-color: var(--brand-brick-hover);
}
.btn.btn--primary:active,
.btn-primary:active {
  transform: scale(0.97);    /* Emil-skill: tactile feedback */
  transition: transform 100ms ease-out;
}
.btn.btn--primary:focus-visible,
.btn-primary:focus-visible {
  outline: 2px solid var(--brand-brick);
  outline-offset: 3px;
}
```

### 3. Pro-badge

**Tiedosto:** `style.css:371-382` `.sidebar-pro-badge` (osoitettiin V13:ssa, v275 jätti todon)

**Nyt** (v275 jälkeen):
```css
.sidebar-pro-badge { background: var(--grad-pro); color: #fff; }
/* TODO(v276): replace --grad-pro with --brand-brick #A0341F to align with brand identity */
```

**Korjaus:**
```css
.sidebar-pro-badge {
  background: var(--brand-brick);
  color: var(--brand-brick-on-light);
  /* Säilytä muu */
}
```

Verifioi DevTools-contrast-checkerillä: `#A0341F` + `#fff` = noin 8.2:1 → ylittää WCAG AA reilusti. 

Poista `--grad-pro` -määritelmä tokens.css:stä jos se ei ole käytössä muualla (grep ensin).

### 4. Linkit ja text-aksentit

**Tiedosto:** `style.css` — etsi `a {` ja `a:hover`, ja mahdollisia `.link`, `.text-accent` -luokkia

**Korjaus:**
```css
a {
  color: var(--brand-brick);
  text-decoration: underline;
  text-decoration-color: oklch(90% 0.05 30);    /* light brick, alleviivaus näkyy mutta ei kireä */
  text-underline-offset: 3px;
}
a:hover {
  color: var(--brand-brick-hover);
  text-decoration-color: var(--brand-brick);     /* tummenee hoverilla */
}
```

**Varmista** ei katkaise mitään jolla on jo oma värisääntö (esim. nav-linkit, sidebar-itemit).

### 5. Progress-bar / täyttöväri

**Tiedosto:** etsi grepillä `progress` ja `progress-bar`, `progress-fill`, `progress__fill`

**Korjaus:** Käytä brickiä täyttöön mint-vihreän sijaan:
```css
.progress-bar__fill,
.progress__fill,
.progress-fill {
  background: var(--brand-brick);
  /* Säilytä transition, width-animation, etc. */
}
```

Tausta (tyhjä osa) pysyy neutraalina: `var(--border-soft)` tai vastaava.

### 6. Old `--accent` ja `--accent-hover` migrointi

**Tutkimusvaihe ensin:**
```bash
grep -rn "var(--accent" style.css off-canvas-nav.css digikirja.css app-old-spain.css tokens.css js/
```

**Päätös per käyttöpaikka:**
- **Jos `--accent` viittaa brand-korostukseen** (CTA, link, badge, active-state) → vaihda `var(--brand-brick)`
- **Jos `--accent` viittaa neutraaliin sävyyn** (border, divider, muted bg) → säilytä mutta nimeä uudelleen selkeämmäksi (`--neutral`, `--surface-muted`) jos diff pysyy hallinnassa
- **Jos epävarma** → säilytä `--accent` mutta vaihda sen arvoa tokens.css:ssä mintistä brickiin:
  ```css
  --accent: var(--brand-brick);
  --accent-hover: var(--brand-brick-hover);
  ```
  Tämä on minimi-invasiivinen muutos.

**Käytä jälkimmäistä** jos `--accent`-käyttö on laajaa (kymmeniä paikkoja) — se päivittää kaiken kerralla ilman että pitää käydä joka selektoria läpi.

---

## Toteutus

1. **Baseline-snapshot:**
   - Kirjaudu testpro123
   - Playwright-screenshot Aloitus + jokainen mode-screen + Asetukset + Pro-upgrade-modaali
   - Tallenna `docs/briefs/v276-baseline/`
2. **Tokens ensin:**
   - Lisää `--brand-brick`, `--brand-brick-hover`, `--brand-brick-soft`, `--brand-brick-on-light`
   - Verifioi `npm run build` PASS
3. **Fixet järjestyksessä:** Sidebar → CTA → Pro-badge → Linkit → Progress → `--accent` -migrointi
4. **Per-fix screenshot + vertailu** — tarkista että muutos näkyy oikeassa paikassa, ei muualla
5. **DevTools Contrast-checker** jokaiselle muuttuneelle väriparille:
   - `var(--brand-brick)` + `#fff` (CTA, badge) — minimi 4.5:1
   - `var(--brand-brick-soft)` + `var(--brand-brick)` (sidebar active) — minimi 4.5:1
   - `var(--brand-brick)` + cream bg (linkit) — minimi 4.5:1
6. **Mobile-vierailu Playwrightilla** — 375px-leveys, varmista että napit eivät hyökkää reunoja
7. **AI-slop-checklist:**
   - [ ] Ei side-stripe-bordereita brick-värillä (Emil + impeccable ban)
   - [ ] Ei gradient-textiä brickillä (impeccable ban)
   - [ ] Ei pure-black-aksentteja (käytä warm-blackia)
   - [ ] CTA-napit tuntuvat painettavilta (scale-on-active)
   - [ ] Focus-statet näkyvät brickillä
8. **`npm run build`** + **`npm test`** PASS
9. **Bumppaa `sw.js` CACHE_VERSION** koska tokens.css todennäköisesti STATIC_ASSETS-listalla
10. **Manuaalinen läpikäynti**: kirjaudu, navigoi koko sovellus, varmista että brand tuntuu yhtenäiseltä landingin kanssa

---

## Commit + PR

- **Suositus: 1 PR, 5-6 commitia** (tokens / sidebar / CTA / Pro-badge / linkit / progress)
- Otsikko: `feat(app): brand color restore — brick #A0341F (v276)`
- IMPROVEMENTS.md-rivi: `v276 — feat: brand-väri brick #A0341F palautettu app-puolelle (sidebar-active, CTA, Pro-badge, linkit, progress)`

**Ei pushia ilman lupaa.**

---

## Don't

- ÄLÄ koske landingia — sen palette on jo oikein
- ÄLÄ vaihda kaikki värit kerralla `replace_all`-Editillä — silloin yksittäinen virhe rikkoo kaiken
- ÄLÄ käytä brickiä side-stripe-borderina (`border-left: 3px solid brick`) — Emil + impeccable ban
- ÄLÄ käytä brickiä gradient-textinä — impeccable ban
- ÄLÄ käytä pure-black `#000` -aksenttia minkään brick-elementin parina (warm-black `oklch(18% 0.012 30)`)
- ÄLÄ syytä cachea — testaa incognitossa, bumppaa CACHE_VERSION
- ÄLÄ tee Vercel-promotea automaattisesti — tämä on näkyvä muutos joka tarvitsee Marcelin OK:n
- ÄLÄ tee dashboard-redesignia — v271 ottaa sen erikseen
- ÄLÄ poista `--grad-pro` -tokenia ennen kuin grep vahvistaa ettei se ole käytössä muualla

## Onnistuminen

- [ ] Baseline-screenshotit otettu
- [ ] Tokens lisätty (`--brand-brick` × 4)
- [ ] Sidebar active käyttää brickiä
- [ ] Primary CTA käyttää brickiä + scale-on-active
- [ ] Pro-badge käyttää brickiä, TODO-kommentti v275:stä poistettu
- [ ] Linkit käyttävät brickiä (underlinella, ei pelkkä väri)
- [ ] Progress-bar fill on brick
- [ ] `--accent` -migrointi tehty (joko per-selektori tai tokens.css:n yhden rivin muutos)
- [ ] DevTools contrast-checker: kaikki väriparit ≥4.5:1
- [ ] Playwright mobile-screenshot 375px → ei hyökkää reunoja
- [ ] `npm run build` PASS, `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu
- [ ] 5-6 commitia, IMPROVEMENTS.md-rivi
- [ ] PR avattu, EI mergattu — Marcel tarkistaa visuaalisen muutoksen ennen lupaa
