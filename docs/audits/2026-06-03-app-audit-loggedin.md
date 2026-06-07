# L-V365 — App-puolen audit (kirjautunut) · 2026-06-03

**Base:** http://localhost:3000 (lokaali dev-server)
**Tilit:** `testpro123@gmail.com` (Pro) + `Testfree@gmail.com` (Free)
**Leveydet:** desktop 1440×900 + mobile 390×844 (iPhone 13 UA)
**Näkymiä skannattu:** 11 reittiä × 2 tiliä × 2 leveyttä = 44 sivulatausta
**Screenshotit:** `screenshots/app-audit-2026-06-03/` (nimeämismalli `<slug>-<tili>-<leveys>.png`)
**Raakadata:** `docs/audits/2026-06-03-app-audit-loggedin.json`
**Harness:** `scripts/app-audit-2026-06-03.mjs` (console/network-keräys + DOM-slop-heuristiikat + full-page-shotit)

> **Tämä on löydösraportti, ei korjaus.** Ei koodimuutoksia. Prioriteetit: **P0** = rikki tai väärä info käyttäjälle · **P1** = toimii mutta huono/harhaanjohtava · **P2** = kosmeettinen slop. Korjaukset tulevat erillisinä briefeinä.

---

## Yhteenveto

| Vakavuus | Määrä | Löydökset |
|---|---|---|
| P0 | 1 | APP-01 |
| P1 | 3 | APP-02, APP-03, APP-04 |
| P2 | 5 | APP-05, APP-06, APP-07, APP-08, APP-09 |

**Console/network:** 0 virhettä kaikilla reiteillä **paitsi** `#/lauseet` (POST 404 `/api/exercises/reorder` + 404-konsoli, joka latauksella, molemmat tilit + leveydet). Muut 10 reittiä: puhtaat.

**Toimii oikein (ei uudelleenauditoitava):** Koti (`#/aloitus`+`#/koti`), Oppimispolku, Profiili (renderöinti), Asetukset, Luetun ymmärtäminen -mode, Kirjoittaminen -mode, YO-koe (sekä Free-tilin live-koe että Pro-tilin resume-modaali toimivat). Ei vaakavieritystä mobiilissa millään näkymällä.

---

## Löydökset

### APP-01 · Käännä lauseet täysin rikki · `#/lauseet` · **bugi · P0**
**Näkymä:** Käännä lauseet (sentence-build) · molemmat tilit · molemmat leveydet
**Kuvaus:** Tehtävä ei lataa yhtään lausetta. UI renderöi näkyviin literaalin **`[object Object]`** punaisessa laatikossa, hyppää suoraan loppunäkymään **"VALMIS · 0 / 0 oikein"**, ja verkkopyyntö **`POST /api/exercises/reorder` palauttaa 404**. Koko tehtävätyyppi on kuollut.
**Toistoaskeleet:** Kirjaudu (kumpi tahansa tili) → avaa `http://localhost:3000/app.html#/lauseet`. Heti latauksessa: konsoli 404, `[object Object]` näkyvissä, "0 / 0 oikein".
**Screenshot:** `sentences-pro-desktop.png` (myös `sentences-free-desktop.png`, `-mobile`-variantit)
**Ehdotettu korjaus:** Selvitä puuttuva reitti `/api/exercises/reorder` (routes/exercises.js) — joko endpoint puuttuu tai polku on väärä; korjaa myös client-renderöinti joka tulostaa objektin `[object Object]`:na.

### APP-02 · Sanasto/Kielioppi-reitti renderöi Asetukset-näkymän · `#/sanasto`, `#/puheoppi` · **bugi · P1**
**Näkymä:** Sanasto + Kielioppi · molemmat tilit · molemmat leveydet
**Kuvaus:** Suora navigointi tai **sivun uudelleenlataus** osoitteeseen `#/sanasto` tai `#/puheoppi` ei näytä sanasto-/kielioppinäkymää vaan **Asetukset-näkymän** (sivupalkin keltainen "Asetukset"-pill aktivoituu). Reitit ovat käyttäjän tavoitettavissa: `js/screens/curriculum.js` (rivit 890/898/925) ja `js/screens/lessonResults.js` (264/273) asettavat nämä hashit `history.replaceState`-kutsulla kun oppilas tekee sanasto-/kielioppitehtävää oppitunnin sisällä. Jos oppilas päivittää sivun kesken tehtävän, hän putoaa Asetuksiin. Hash-router (`js/main.js`) ei käsittele näitä reittejä → fall-through Asetuksiin.
**Toistoaskeleet:** Kirjaudu → avaa `http://localhost:3000/app.html#/sanasto`. Näkyviin tulee "Asetukset · Profiili ja kurssin asetukset". Sama `#/puheoppi`:lla.
**Screenshot:** `vocab-pro-desktop.png`, `grammar-pro-desktop.png`
**Ehdotettu korjaus:** Lisää näille legacy-hasheille router-käsittely joka ohjaa Tehtävät/Oppimispolkuun (tai oikeaan mode-sivuun), ei Asetuksiin.

### APP-03 · "YO-valmius 0 %" vaikka 17 harjoitusta tehty · Profiili · **harhaanjohtava data · P1**
**Näkymä:** Profiili (Pro-tili) · molemmat leveydet
**Kuvaus:** Profiili näyttää suuren **"YO-valmius 0 %"** + tekstin *"Tee oppitunteja, niin täytät tätä mittaria"*, vaikka samalla sivulla lukee **17 Harjoituksia** ja Osa-alueet **Sanasto 6 / Kielioppi 1 / Lukeminen 2 / Kirjoittaminen 7**. Koti-näkymä toistaa saman: "0 / 10 aihetta · 0 % hallussa" aktiivisesta käytöstä huolimatta. Käyttäjälle viesti on ristiriitainen: "et ole tehnyt mitään" vaikka mittarit osoittavat 17 suoritusta. Mittari ilmeisesti laskee vain oppitunti-completionia, ei harjoituksia, mutta se ei välity käyttäjälle.
**Toistoaskeleet:** Kirjaudu Pro-tilillä → `#/oma-sivu`. Vertaa "YO-valmius 0 %" vs "17 Harjoituksia".
**Screenshot:** `profile-pro-desktop.png`, `profile-pro-mobile.png`, `home-pro-desktop.png`
**Ehdotettu korjaus:** Joko sisällytä harjoitukset valmius-mittariin, tai muuta copy selittämään että mittari seuraa oppituntien suoritusta (ei irrallisia harjoituksia).

### APP-04 · Tasomerkintä "Sanasto · B" yksittäisellä harjoitusrivillä · Profiili · **harhaanjohtava data · P1**
**Näkymä:** Profiili → Viimeisimmät (Pro-tili) · molemmat leveydet
**Kuvaus:** Viimeisimmät-listan rivi näyttää **"Sanasto · B"** (5/10). Taso-/arvosanamerkintä yksittäisen sanastosession kohdalla on ristiriidassa lukitun säännön kanssa (V362: tasoa ei näytetä ennen kartoitusta + riittävää dataa, **ei koskaan yhdestä tehtävästä**). Kirjoittaminen-rivin "E" (10/20) on todennäköisesti legitiimi YTL-arvosana kirjotelmalle, mutta sanaston "· B" pitää varmistaa: onko se kurssi-tunniste vai johdettu taso.
**Toistoaskeleet:** Kirjaudu Pro-tilillä → `#/oma-sivu` → Viimeisimmät-lista.
**Screenshot:** `profile-pro-mobile.png` (rivi "Sanasto · B")
**Ehdotettu korjaus:** Jos "B" on johdettu taso → poista yksittäisriviltä. Jos kurssi-tunniste → merkitse selvemmin (esim. "Kurssi 2") jottei sekoitu tasoon.

### APP-05 · Dash-placeholder mittarissa "YO-koe — pv" · Profiili (Free) · **slop · P2**
**Näkymä:** Profiili (Free-tili, koepäivä asettamatta) · molemmat leveydet
**Kuvaus:** Oikean yläkulman pill näyttää **"YO-koe — pv"** jossa "—" on tyhjä placeholder. CLAUDE.md kieltää eksplisiittisesti tyhjän viivan placeholderina mittareissa.
**Toistoaskeleet:** Kirjaudu Free-tilillä → `#/oma-sivu`. Yläkulman pill = "— pv".
**Screenshot:** `profile-free-desktop.png`, `profile-free-mobile.png`
**Ehdotettu korjaus:** Piilota pill kunnes koepäivä asetettu, tai näytä toiminto-CTA "Aseta koepäivä".

### APP-06 · 4 identtistä Osa-alueet-korttia rivissä · Profiili · **slop · P2**
**Näkymä:** Profiili (molemmat tilit) · molemmat leveydet
**Kuvaus:** "Osa-alueet" on neljä samankokoista samanmuotoista korttia rivissä (ikoni + luku + otsikko: Sanasto / Kielioppi / Lukeminen / Kirjoittaminen) — juuri se identtisen korttiruudukon kuvio jota CLAUDE.md varoittaa. Mobiilissa lisäksi ahdas.
**Toistoaskeleet:** `#/oma-sivu` → Osa-alueet-osio.
**Screenshot:** `profile-pro-desktop.png`, `profile-free-mobile.png`
**Ehdotettu korjaus:** Eriytä visuaalisesti (eri painotus/koko/asettelu) tai vaihda kompaktiin listanäkymään.

### APP-07 · Koti: 3 samanmuotoista navigaatiokorttia · `#/aloitus` · **slop (lievä) · P2**
**Näkymä:** Koti (molemmat tilit) · molemmat leveydet
**Kuvaus:** Hero-kortin alla kolme samankokoista korttia (Jatka oppimispolkua / Harjoittele YO-koetta / Kirjoita ja saa arvio), kukin ikoni + otsikko + body. Erottuvat väreillä (vihreä/keltainen/punainen) ja sisällöltä, joten rajatapaus — mutta muoto/koko ovat identtiset.
**Toistoaskeleet:** `#/aloitus` → hero-kortin alapuoli.
**Screenshot:** `home-pro-desktop.png`
**Ehdotettu korjaus:** Matala prioriteetti. Jos koskettaa, riko symmetria (esim. ensisijainen kortti isompi).

### APP-08 · Brändi-wordmark epäjohdonmukainen: mobiili "puheo" vs desktop "Puheo" · **slop · P2**
**Näkymä:** Mobiilin yläpalkki vs desktop-sivupalkki · kaikki näkymät
**Kuvaus:** Mobiilin yläpalkin wordmark on pienaakkosin **"puheo"**, kun taas desktop-sivupalkki näyttää **"Puheo"** logo+isolla alkukirjaimella. Epäjohdonmukainen brändiesitys leveyksien välillä.
**Toistoaskeleet:** Avaa mikä tahansa näkymä mobiilissa vs desktopilla, vertaa logoa.
**Screenshot:** `home-pro-mobile.png` (puheo) vs `home-pro-desktop.png` (Puheo)
**Ehdotettu korjaus:** Yhtenäistä wordmark (sama kirjainkoko/asu molemmilla leveyksillä).

### APP-09 · Mobiili "YO-koe 104 … pv" -pillin sisäväli rikki · Profiili (Pro, mobile) · **slop · P2**
**Näkymä:** Profiili (Pro-tili, mobile)
**Kuvaus:** Koepäivä-pillissä luku "104" ja yksikkö "pv" lentävät pillin vastakkaisiin reunoihin iso tyhjä väli keskellä (space-between -asettelu liian leveälle elementille). Näyttää rikkinäiseltä.
**Toistoaskeleet:** Kirjaudu Pro-tilillä mobiilissa → `#/oma-sivu` → yläkulman pill.
**Screenshot:** `profile-pro-mobile.png`
**Ehdotettu korjaus:** Ryhmitä "104 pv" yhteen (ei space-between), tai kavenna pilliä.

---

## Kattavuus & rajaukset (ei hiljaista ohitusta)

**Käyty läpi täysin** (renderöinti + console/network + screenshot, molemmat tilit + leveydet):
Koti `#/aloitus`, Koti-alias `#/koti`, Oppimispolku, Profiili, Asetukset, Sanasto, Kielioppi, Luetun ymmärtäminen (mode-sivu), Kirjoittaminen (mode-sivu), Käännä lauseet, YO-koe.

**Osittain / ei täysin ajettu** (sisäänkäynti todennettu, koko interaktio ei):
- **Kirjoitustehtävän arviointiflow** (avaus → kirjoitus → AI-arviointi → tulos): vain mode-sivun sisäänkäynti todennettu, ei lähetetty kirjotelmaa arviointiin.
- **YO-koe-simulaation täysi suoritus loppuun:** sisäänkäynti + Free-tilin live-koe + Pro-tilin resume-modaali todennettu, ei suoritettu koetta loppuun asti.
- **Käännä lauseet -interaktio:** ei testattavissa — rikki latauksessa (APP-01).
- **Onboarding / kartoitus (V4-flow):** ei tavoitettavissa kirjautuneena (ohitetaan designilla); ei auditoitu tässä kierroksessa.
- **Kielen/kurssin vaihto + navigaatio-edge-caset:** ei eksplisiittisesti ajettu.
- **a11y (axe):** ei ajettu tällä kierroksella (edellinen `2026-05-26`-audit kattoi; tämä kierros keskittyi bugeihin + slopiin briefin mukaisesti).

Nämä kannattaa kattaa erillisellä interaktio-/flow-auditilla jos halutaan varmistaa arviointi- ja koesuoritus päästä päähän.
