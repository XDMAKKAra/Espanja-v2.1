# L-V357 — Mobiilivalikon evoluutio: tilatietoinen ylänappi + kurssit-accordion

**Päivä:** 2026-06-02
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-M + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer`, `webapp-testing`, `superpowers:verification-before-completion`
**Lähtökohta:** L-V355 rakensi mobiilivalikon (`#nav-menu`-täysruutuoverlay, `js/landing-nav.js`, `#nav-chip`-tilalogiikka). Tämä brief muokkaa sitä, ei rakenna uudestaan.

---

## Tavoite

Mobiilivalikko (≤720px) saa kaksi muutosta WordDive-referenssin hengessä, mutta meidän brändillä (cream-tausta, brick-aksentti, Fredoka sentence-case, EI turkoosia/mono-UPPERCASE/emojia):

1. **Tilatietoinen ylänappi** — yksi prominentti primäärinappi valikon yläosassa.
2. **Kurssit-accordion** — "Kurssit" ei enää litteänä linkkinä; sen yhteyteen `+`-toiminto joka avaa per-kieli abikurssi-listan paikan päällä (kuten WordDiven "Opi kieli −" -accordion).

Nykyiset osiolinkit (Näyte, Hinnoittelu, FAQ) säilyvät.

---

## 1. Tilatietoinen ylänappi

Peilaa olemassa olevaa `#nav-chip`-tilalogiikkaa (sama lähde, älä duplikoi sessiontunnistusta).

- **Kirjautunut** → yksi nappi, teksti "Jatka harjoittelua", vie suoraan `/app.html`. (Säilyy L-V355:stä.)
- **Kirjautumaton** → yksi iso primäärinappi **"Aloita"** joka vie sign up -flow'n alkuun (kielivalinta → rekisteröinti; flow itse tulee briefissä L-V359, nyt riittää että nappi vie oikeaan aloituspisteeseen — käytä nykyistä "Aloita"-kohdetta jonne L-V355 jo vie). Sen alle/viereen **pieni, sekundäärinen "Kirjaudu"-linkki** (ei yhtä painava kuin Aloita) niille joilla on jo tili.
  - Päätös tehty: EI kahta yhtä isoa nappia. Yksi selkeä polku + pieni kirjautumislinkki.

**Constraintti:** ylänappi on visuaalisesti valikon tärkein elementti (kuten WordDiven "Harjoittele"). Sijoittelu/kompositio sinun valittavissasi — älä noudata pikselikarttaa.

---

## 2. Kurssit-accordion

Tällä hetkellä valikossa on litteät linkit: Kurssit, Näyte, Hinnoittelu, FAQ, ja erikseen Espanjan/Saksan/Ranskan abikurssi (ks. nykyinen `#nav-menu`).

Muutos:
- **"Kurssit"** saa `+`/`−`-toggle-affordanssin (kuten WordDiven "Opi kieli"). Suljettuna näkyy vain "Kurssit +".
- Avattuna paljastuu per-kieli-listana: **Espanjan abikurssi**, **Saksan abikurssi**, **Ranskan abikurssi** (samat kohteet kuin nykyiset abikurssi-linkit `/espanjan-abikurssi` jne.).
- Erilliset litteät abikurssi-rivit valikon alaosasta **poistuvat** — ne siirtyvät tämän accordionin alle (ei duplikaattia).
- "Kurssit"-rivin oma klikki voi joko (a) togglata accordionin tai (b) toimia myös linkkinä `#kurssit`-osioon — valitse selkein; jos klikki = toggle, varmista että `#kurssit`-ankkuriin pääsee silti jotenkin (esim. accordionin sisällä "Kaikki kurssit" -rivi). Älä jätä `#kurssit`-osiota saavuttamattomaksi.

**Toteutustapa:** suosi natiivia `<details>`/`<summary>`:ä jos se istuu olemassa olevaan overlay-rakenteeseen (L-V330-katalogi käyttää jo tätä patternia landingilla → konsistenssi). Jos JS-toggle on puhtaampi nykyisen `landing-nav.js`-focus-trapin kanssa, se on OK — älä riko focus-trappia tai Esc/backdrop-sulkua.

---

## Brändi-vartijat (automaattinen hylkäys jos rikotaan)

- EI turkoosia (WordDiven väri) — meidän cream + brick.
- EI mono-UPPERCASE-rivejä (WordDive käyttää, me emme) — Fredoka sentence-case.
- EI emojia, EI em-dashia copyssa.
- `+`/`−` saa olla merkki tai ikoni, ei iso koriste.
- Aja kaikki näkyvä suomi-teksti `humanizer`-skillin läpi ennen committia (napit, accordion-otsikot).

## Acceptance criteria

- ≤720px (testaa 390px): valikon yläosassa yksi primäärinappi; kirjautuneena "Jatka harjoittelua" → `/app.html`, kirjautumattomana "Aloita" → sign up -aloituspiste + erillinen pienempi "Kirjaudu".
- "Kurssit +" avaa accordionin jossa 3 abikurssi-linkkiä, jotka resolvoivat oikeisiin URLeihin; suljettuna piilossa.
- Erilliset litteät abikurssi-rivit eivät esiinny enää kahdesti.
- `#kurssit`-osio yhä saavutettavissa valikosta.
- Focus-trap, Esc, backdrop-sulku, body-scroll-lukko, `aria-expanded` toimivat (L-V355:n käytös ei regressoidu); accordion-toggle on `aria-expanded`-merkitty ja näppäimistöllä käytettävä.
- Ei vaakavieritystä 390px:ssä. Desktop (1440px) navi ennallaan.
- 1366px–1440px desktop ei näytä hampurilaista (≤720px-raja ennallaan).

## Verify (writer tekee, ei käyttäjä)

- Laajenna `e2e-landing-mobile-menu`-spec (L-V355): lisää accordion-avaus/-sulku, 3 abikurssi-linkkiä, tilanapin molemmat tilat (mockaa kirjautunut/kirjautumaton), näppäimistökäyttö.
- `npm run build`; bumppaa `sw.js` CACHE_VERSION (v356 → v357) jos STATIC_ASSETS koskee `landing-nav.js`/CSS:ää.
- Screenshot 390px collapsed + opened.
- Pushaa mainiin (näkyvä muutos).

## Skaala

Pieni-keskikokoinen. Yksi komponentti (valikko), ei uutta sivua, ei backendiä. Älä laajenna scopea sign up -flow'hun — se on L-V359.
