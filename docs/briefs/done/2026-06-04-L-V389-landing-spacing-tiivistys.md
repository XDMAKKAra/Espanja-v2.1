# L-V389 — Landingin tiivistys: pois liika tyhjä ylhäältä, pienemmät välit, above-the-fold kertoo heti

**Numero:** käytä seuraavaa vapaata L-VXXX jos viety.

**Skill-stack:** FRONTEND-M (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + TESTING-S (`webapp-testing`). Ei COPY (vain spacing, ei tekstimuutoksia).

**Rooli:** writer. Rakentuu **L-V387:n päälle** (juuri shipattu). Vain välistys/tiheys, ei uutta sisältöä eikä uudelleenjärjestelyä.

---

## Ongelma

V387:n jälkeen mobiililanding on liian ilmava: **ylhäällä on liikaa tyhjää** (iso väli sticky-navin ja sisällön alun välissä), ja **elementtien väliset gapit ovat liian suuret** (eyebrow → otsikko → ingressi → CTA → luottamusblokki). Lopputulos: kun käyttäjä saapuu, above-the-fold näyttää vähemmän kuin pitäisi, eikä "kerro kaikki heti" -vaikutelma synny. Vertailukohta (Marcelin rinnakkaisvertailu): Lara saa heti yläosaan eyebrow + otsikko + alaotsikko + CTA + tähtiarvio; Puheolla sama tieto valuu alemmas turhan ilmavuuden takia.

## Tavoite

Tiivistä landingin pystysuora rytmi niin että **iPhone-kokoisella ruudulla (390 × 844) above-the-fold näkyy vähintään: otsikko + ingressi + pää-CTA + alku luottamusblokista** (tähtiarvio), ilman isoa kuollutta tilaa ylhäällä.

Konkreettiset säädöt (säädä arvoja, älä riko layoutia):
1. **Ylätyhjä pois:** pienennä heron yläpadding / ensimmäisen sisältölohkon `padding-top` mobiilissa. Sticky-navin alapuolelle ei jätetä isoa tyhjää — sisältö alkaa heti navin jälkeen kohtuullisella välillä.
2. **Pienemmät väli-gapit herossa:** eyebrow → h1 → ingressi → CTA → "ei maksukorttia" → luottamusblokki. Kiristä `margin`/`gap`-arvoja (esim. kitin `--s-*`-asteikolla yksi pykälä alemmas siellä missä väli ammottaa). Otsikon ja ingressin väli, ingressin ja CTA:n väli erityisesti.
3. **Otsikon koko/rivitys mobiilissa:** jos Fredoka-h1 vie kohtuuttomasti pystytilaa, harkitse pykälää pienempi `clamp` mobiilibreakissa (mutta pidä silti vahvana). Ei pakollinen jos kohdat 1–2 riittävät.
4. **Sama tiiviys sisarstaattisille sivuille** (`/nayte`, `/ukk`, `pricing`, `/artikkelit`) jos niillä on sama liian-iso ylätyhjä `page-head`-lohkossa — yhtenäistä. Älä tee jos ne ovat jo tiiviit.

## Constraintit
- **PYHÄ RAJA:** vain landing + sisarstaattiset sivut + niiden CSS. Ei app-puolta, ei sisältö-/copy-muutoksia, ei elementtien uudelleenjärjestelyä (V387:n mobiilijärjestys teksti→CTA→trust→kortti pysyy).
- Käytä kitin spacing-tokeneita (`--s-*`), älä keksi irrallisia px-arvoja. 0 uutta väriä/fonttia.
- Älä tiivistä niin että tulee ahdasta/klaustrofobista — tavoite on **ryhdikäs tiiviys**, ei tukkoisuus. Riittävä luettavuus säilyy.
- Desktop ei saa rikkoutua: tarkista että desktop-hero pysyy tasapainossa (V387:n kit-layout).
- `npm run build` + bump `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.

## Acceptance criteria
- 390 × 844: above-the-fold näyttää otsikon + ingressin + pää-CTA:n + tähtiarvion alun; ei isoa tyhjää navin ja sisällön välissä.
- Hero-elementtien väli-gapit pienemmät, rytmi tiiviimpi mutta luettava.
- Ei vaakavieritystä <440px; desktop ehjä.
- Sisarstaattiset sivut yhtenäisen tiiviit (jos koskettiin).
- Playwright: olemassa olevat landing-spec:t (V387 ym.) PASS; screenshotit 390 ennen/jälkeen, jotka osoittavat tiiviimmän yläosan.

## Out of scope
- Sisältö-/copy-muutokset, uudet lohkot.
- App-puolen spacing (jos sielläkin liikaa tyhjää → oma loop).
