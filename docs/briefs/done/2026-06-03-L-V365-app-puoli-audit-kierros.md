# L-V365 — App-puolen audit-kierros (kirjautunut): bugit + AI-slop, raportti ei korjaukset

**Päivä:** 2026-06-03
**Prioriteetti:** ajetaan V360–V364 JÄLKEEN (kun tunnetut bugit korjattu, jottei audit toista niitä).
**Rooli:** writer (Claude Code)
**Skill-stack:** TESTING-L → `webapp-testing`, `superpowers:verification-before-completion`. (Löydösten luokitteluun riittää nämä; ÄLÄ lataa frontend/backend-stackeja — tämä ei korjaa, vain löytää.)

---

## Miksi

App-puoli (kirjautunut) on jäänyt V344-redesignin jalkoihin ja bugeja/slopia on löytynyt palasina (V360 405-virheet, V362 väärä taso + phantom-Mestari + vahinko-unlock, V364 dashboard-slop). Piecemeal-löytäminen on tehotonta. Tämä on **yksi systemaattinen läpikäynti** joka tuottaa **priorisoidun löydöslistan** — ei korjauksia. Prompter muuttaa löydökset korjausbriefeiksi.

**Tärkein rajaus: tämä brief EI korjaa mitään.** Se kävelee koko kirjautuneen app-puolen läpi, dokumentoi, luokittelee. Korjaukset tulevat erillisinä briefeinä löydösten perusteella. Älä lipsu "korjaan tän samalla" -moodiin — se räjäyttää scopen.

## Laajuus: kirjautunut app-puoli

Käy läpi KAIKKI kirjautuneen näkymät (≤720px / 390px JA desktop 1440px), molemmilla testitileillä (free + pro, .env):

- Koti / dashboard (mittaristo, viimeisimmät, CTA:t)
- Tehtävät-listaus + jokainen tehtävätyyppi: sanasto, kielioppi, luetunymmärtäminen, kirjoittaminen, käännä lauseet, YO-koe-simulaatio
- Kirjoitustehtävä: avaus → kirjoitus → arviointi → tulos/palaute
- YO-koe-simulaatio: avaus → resume → suoritus
- Oppimispolku
- Profiili (Opiskelukieli, Tilaus, Tili, asetukset)
- Onboarding/kartoitus (V4-flow, jos V359 ajettu)
- Navigaatio: sivuvalikko, alapalkki (Koti/Tehtävät/Profiili), kielen/kurssin vaihto

## Mitä etsitään (kaksi akselia)

### A. Toiminnalliset bugit
- Konsolivirheet ja epäonnistuneet verkkopyynnöt (4xx/5xx) per näkymä — kirjaa metodi+polku+status.
- Rikkinäiset napit / kuolleet linkit / "Lataus epäonnistui" -tilat.
- Väärä/harhaanjohtava data: tasot, %-luvut, pistemäärät, streakit jotka eivät vastaa tehtyä (vrt. V362 "Taso E").
- Tyhjät näkymät / tyhjä-ylä-skrollausbugit.
- Entitlement-vuodot: pääseekö free-tili Pro-sisältöön, avaako jokin nappi kurssin/kielen vahingossa (vrt. V362).
- Free-tier-kiintiön käyttäytyminen: laukeaako paywall oikeassa kohdassa.

### B. AI-slop / brändi (CLAUDE.md-säännöt)
- Identtiset korttiruudukot (3-4+ samankokoista samanmuotoista korttia).
- Lähes-mustat laatikot/napit (ei brändi cream/brick).
- Mono-UPPERCASE-chipit/eyebrowt ilman syytä.
- Em-dash, italic-"Ladataan…", "..."-placeholderit, tyhjä "—" mittareissa.
- Italic-Fraunces väärässä paikassa, gradient-text, side-stripe-border, glassmorphism.
- Pure black/white pehmeiden brändivärien sijaan.
- "Coming soon"/"TBD"/lorem tuotannossa.
- Keksityt todennettavat väitteet (lukio-nimet, tarkat %-luvut).

## Output (tämä on deliverable)

Yksi tiedosto: `docs/audits/2026-06-03-app-audit-loggedin.md` (+ `.json` jos haluat koneluettavan). Käytä aiemman `docs/audits/2026-05-26-polish-audit-loggedin.*`:n formaattia jos sopii.

Per löydös:
- **ID** (esim. APP-01), **näkymä**, **tyyppi** (bugi / slop), **vakavuus P0/P1/P2**, **kuvaus**, **toistoaskeleet**, **screenshot-polku**, **ehdotettu korjaus 1 lauseella**.
- Vakavuus: **P0** = rikki tai väärä info käyttäjälle; **P1** = toimii mutta huono/konversiota haittaava; **P2** = kosmeettinen slop.

Liitä screenshotit `screenshots/app-audit-2026-06-03/` per näkymä (390px + desktop).

## Acceptance criteria

- Jokainen yllä listattu näkymä käyty läpi molemmilla tileillä ja molemmilla leveyksillä.
- Löydösraportti olemassa, jokaisella löydöksellä ID + vakavuus + toistoaskeleet + screenshot.
- Konsoli-/verkkovirheet kirjattu tarkasti (ei "jotain virheitä").
- **Ei koodimuutoksia** — pelkkä raportti + screenshotit. (Tämä saa jäädä lokaaliin, EI pushata Verceliin; audit on Claude-internal.)

## Verify (writer tekee)

- Raportti kattaa kaikki näkymät (tarkista checklist).
- Screenshotit olemassa ja linkitetty.
- Jos jokin näkymä ei auennut testitilillä, merkitse se erikseen (ei hiljaista ohitusta).

## Skaala

Iso mutta rajattu: läpikäynti + dokumentointi, ei korjauksia. Kun raportti valmis, palauta se promterille → priorisoidaan korjausbriefit.
