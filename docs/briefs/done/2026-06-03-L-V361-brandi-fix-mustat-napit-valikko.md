# L-V361 — Brändi-fix: appin mustat napit + valikon ylänapin välistys

**Päivä:** 2026-06-03
**Prioriteetti:** P2 (P0-405 ja P1-flow ensin)
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-M → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`. (Ei tekstimuutosta → ei humanizeria, ellet kosketa copyä.)

---

## 1. Appin mustat napit eivät sovi brändiin

Appin kotinäkymässä "**Aloita kirjoittaminen** (LYHYT · SEKALAISET)" ja "**Käännä lauseet**" -napit ovat tumma(nruskea/musta) — ei istu cream/brick-brändiin. Muuta brändinmukaisiksi.

- Käytä brändipalettia (cream-tausta + brick-aksentti / vihreä/keltainen kuten muu app), EI lähes-mustaa täyttöä.
- Säilytä napin hierarkia ja luettavuus (kontrasti AA).
- Tarkista samalla ettei muualla appissa ole sama tumma-nappi-pattern toistumassa (etsi sama luokka) — korjaa kaikki esiintymät, ei vain näitä kahta.
- Pikku-eyebrow "LYHYT · SEKALAISET" on mono-UPPERCASE → tarkista istuuko brändiin vai vaihdetaanko sentence-caseen (vrt. CLAUDE.md mono-UPPERCASE-kielto ilman syytä).

## 2. Valikon ylänappi + Kirjaudu -välistys

Mobiilivalikossa "Aloita ilmaiseksi" (iso brick-nappi) ja sen alla "Kirjaudu" istuvat liian lähekkäin / näyttävät yhdessä kömpelöiltä. Säädä välistys ja "Kirjaudu"-linkin tyyli niin että ne erottuvat selkeästi toisistaan (Kirjaudu selvästi sekundäärinen, ei kilpaile primäärin kanssa). Älä riko L-V355/L-V357-valikon focus-trappia tms.

## Acceptance criteria

- Appin "Aloita kirjoittaminen" / "Käännä lauseet" (ja samalla luokalla olevat) ovat brändivärisiä, ei lähes-mustia; kontrasti AA.
- Valikon "Aloita ilmaiseksi" + "Kirjaudu" -ryhmä näyttää siistiltä 390px:ssä, selkeä hierarkia.
- Ei vaakavieritystä; desktop ennallaan.

## Verify (writer tekee)

- Screenshot before/after molemmista (app-koti + valikko) 390px.
- `npm run build`; bumppaa `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.
- Pushaa mainiin.

## Skaala

Pieni. CSS + mahdollinen luokan uudelleenkäyttötarkistus. Älä laajenna koko app-kodin redesigniksi.
