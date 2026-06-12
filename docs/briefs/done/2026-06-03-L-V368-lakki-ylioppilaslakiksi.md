# L-V368 — Lakki → ylioppilaslakki kaikessa kuvituksessa

**Päivä:** 2026-06-03
**Prioriteetti:** P2 (brändi-johdonmukaisuus, nopea voitto)
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-M → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`

---

## Tausta

Marcel (2026-06-03): nykyinen kuvitus käyttää amerikkalaista mortarboard-lakkia (litteä neliölakki + tupsu). Tuote on **Suomen ylioppilastutkintoon**, joten ikonin pitää olla **valkoinen ylioppilaslakki** (musta lippa, valkoinen kupoli, musta nauha, kultainen lyyra-merkki). Mortarboard on väärä kulttuurinen symboli ja näyttää geneeriseltä.

Esiintyy ainakin kahdessa paikassa:
- **Landing-hero / onboarding-kuvitus:** lakki + puhekuplat ¡Hola! / Salut! / Hallo! (Marcel kuva 6)
- **Oppimispolun path-kuvitus:** sama mortarboard polun päässä (kuva 11, `path-journey.svg` tai vastaava)

## Tehtävät
1. Etsi kaikki esiintymät: grep SVG/kuvitustiedostoista mortarboard-muodot (todennäköisesti inline-SVG `app.html`/`index.html` + `path-journey.svg` tai `public/`-assetit).
2. Korvaa ylioppilaslakilla. Pidä Puheon paletti (cream/brick/keltainen/vihreä, flat, ei gradienttia). Kultainen lyyra saa olla pieni aksentti.
3. Varmista että vaihto on johdonmukainen joka paikassa, ei vain hero.

## Acceptance
- Yksikään näkyvä lakki ei ole enää mortarboard; kaikki ovat valkoinen ylioppilaslakki.
- Pysyy Puheon flat-värimaailmassa (ei realistista varjostusta, ei gradienttia).
- Screenshot-vertailu landing-hero + oppimispolku ennen/jälkeen.

## Ulkopuolella
Muu hero-copy ja layout → V369. Tämä koskee vain lakki-kuvitusta.
