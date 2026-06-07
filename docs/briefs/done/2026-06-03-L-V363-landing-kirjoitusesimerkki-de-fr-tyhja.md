# L-V363 — Landingin kirjoitusesimerkit: saksa/ranska avaa tyhjää

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — rikki konversiopinnalla (landing-näyte).
**Rooli:** writer (Claude Code)
**Skill-stack:** TESTING-S/M + FRONTEND-S → `webapp-testing`, `design-taste-frontend`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`. (Jos puuttuu de/fr-sisältö ja kirjoitat sitä → `humanizer`.)

---

## Oire

Landingilla on kirjoitusesimerkki-osio jossa voi valita espanja / saksa / ranska. **Espanja toimii, saksa ja ranska avaavat tyhjää.** Todennäköisesti regressio L-V358:sta (kielisivut) tai esimerkkidatan kielikohtainen puute.

## Tutki ja korjaa (systematic-debugging)

1. Paikanna kirjoitusesimerkki-komponentti landingilla (etsi näyte/esimerkki + kielivalitsin; liittyy todennäköisesti `js/landing-proof-lang.js` tai vastaavaan).
2. Selvitä miksi de/fr → tyhjä: puuttuuko esimerkkidata näille kielille, vai hajoaako kielivalitsimen kytkentä (es kovakoodattu, de/fr ei mäpätä)?
3. Korjaa juurisyy:
   - Jos **data puuttuu**: lisää saksan ja ranskan kirjoitusesimerkit (opiskelijan kirjoitelma + pistehaarukka + perustelu, L-V354-malli). Suomi/kohdekieli-teksti humanizerin läpi. Älä keksi tarkkoja pisteitä — käytä haarukkamallia.
   - Jos **kytkentä rikki**: korjaa kielivalitsin mäppäämään de/fr oikeaan dataan.

## Acceptance criteria

- Kaikki kolme kieltä (es/de/fr) näyttävät kirjoitusesimerkin, ei tyhjää.
- Esimerkit käyttävät L-V354-haarukkamallia (pistehaarukka + perustelu, ei tarkkaa yksittäislukua, ei "sama tarkkuus" -väitettä).
- Ei konsolivirheitä kielivalintaa vaihtaessa.

## Verify (writer tekee)

- Playwright: lataa landing, vaihda näyte es → de → fr, varmista että sisältö renderöityy kullekin. 390px + desktop.
- Pushaa mainiin (näkyvä korjaus).

## Skaala

Pieni-keski: joko data-lisäys tai kytkentäkorjaus. Älä laajenna koko näyte-osion redesigniksi.
