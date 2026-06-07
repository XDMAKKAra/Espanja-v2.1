# L-V372 — Jaettu komponenttikerros (nav, footer, napit, kortit, pillit)

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — yhtenäisyys koko sivustolle.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`
**Riippuvuus:** **V371 ensin** (tarvitsee Tailwind-infran + tokenit).

## Orkestraatio (token-budjetti)
Koordinaattori-malli: delegoi komponenttien toteutus subagenteille, jotka palauttavat tiiviin diff-yhteenvedon. Älä lue koko CSS-tiedostoja main-loopiin.
**Malli per tehtävä:** triviaali → Haiku, standardi → Sonnet, vaikea/maku → Opus.
**Tämä vaihe:** komponenttien tyylittely on standardia → **Sonnet** per komponenttiryhmä (napit / nav / footer / kortit), voi fan-outata rinnakkain. Lopuksi yksi **Opus** maku-review-passi johdonmukaisuudesta + styleguide.html-kokoonpano.

---

## 🛑 PYHÄ RAJA — älä koske app-puoleen
ÄLÄ muokkaa `app.html`, `app.js`, `js/**`, tai kirjautuneen app-puolen koodia. Komponentit ovat staattisia HTML-sivuja varten. Jos muutos koskettaisi app-puolta → STOP ja kysy.

## Tavoite
Rakenna uudelleenkäytettävä komponenttikerros Tailwindilla, jota KAIKKI sivut käyttävät → yksi muutos pätee kaikkialle. Tämä on se mikä tekee Marcelin "muutokset pätee kaikkeen" -vaatimuksesta totta.

## Tehtävät
Määritä Tailwind-komponenttiluokat (`@layer components` tai utility-yhdistelmät) näille jaetuille elementeille. Pidä Puheon brändi (cream/brick/keltainen/vihreä flat, Fredoka/Mulish):
1. **Napit:** `btn`, `btn-primary` (brick fill), `btn-secondary` (ghost/outline), `btn-lg`. Tactile `:active` -palaute (-1px/scale 0.97), ei neon-glowta.
2. **Navigaatio:** jaettu yläpalkki (desktop + mobile-hampurilainen). Yksi lähde, kaikki sivut käyttävät.
3. **Footer:** jaettu footer (linkit privacy/terms/refund/pricing).
4. **Kortit:** `card` — pyöristys, pehmeä cream-tintattu varjo, ei mustaa hard-shadowia. Käytä vain kun elevaatio palvelee hierarkiaa.
5. **Pillit/badget:** `pill` (esim. YO-countdown, YTL-rubriikki) — ei mono-UPPERCASE ilman syytä.
6. **Lomake-elementit:** input/label/error johdonmukaisesti (label yllä, error alla).

Dokumentoi komponentit lyhyesti `styleguide.html`:ään (on jo olemassa) niin että niitä voi katsoa yhdessä paikassa.

## Acceptance
- Komponenttiluokat toimivat ja näyttävät johdonmukaisilta.
- `styleguide.html` näyttää napit/kortit/pillit/nav/footer yhdessä.
- Ei vielä pakko vaihtaa kaikkia sivuja näihin — se tapahtuu V373-V375. Mutta luokat ovat valmiit käyttöön.
- `npm run build` PASS, ei regressiota olemassa olevilla sivuilla.

## Ulkopuolella
Sivujen varsinainen migraatio (V373-V375). Tämä luo palikat, ei vielä asenna niitä joka sivulle.
