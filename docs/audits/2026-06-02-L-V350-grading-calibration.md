# L-V350 — Arviointimoottorin kalibrointi + held-out-validointi (espanja + saksa)

**Päivä:** 2026-06-02
**Kalibrointi:** `lib/writingGrading.js` → `buildGradingPrompt` sai `SCORING CALIBRATION` -lohkon: (a) eksplisiittinen E/L-yläpää-ankkuri, (b) `kielen_rakenteet`-5 ei vaadi virheettömyyttä, (c) laajan tehtävän syvyyspalkkio. **Lukittu ENNEN saksan ajoa** (anti-ylisovitus).
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin; `officialScore`/`officialRationale` stripattiin ennen kutsua.
**Skaala:** moottori 0–20 → YTL-pisteet ×33/20 (lyhyt), ×66/20 (laaja). Spearman raa'asta 0–20-summasta.
**Metodi:** espanja = in-sample (sama setti jolla L-V349 diagnosoi biaksen, "ennen" = L-V349:n pre-kalibrointiluvut). **Saksa = held-out** (uusi setti, EI käytetty promptin viritykseen) → yleistymistesti.
**Lukitut rajat:** lyhyt MAE ≤ 3, max ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8.

## Verdict

**EI vielä PASS ❌** — katso kieli/tehtävätyyppi-kohtaiset rivit alla. Älä laajenna ennen kuin molemmat PASS.


---

## Espanja (in-sample) — ES

Caset: parsittu 37, arvioitu 37, virheitä 0, parsimatta 0.

### Lyhyt (max 33 p)
- n 18 · MAE 5.25 p · ±2p 27.78% · ±4p 44.44% · max 11.5 p · ρ 0.85 · bias -4.18 p (ankara)
- **FAIL ❌** ❌MAE ≤ 3(5.25) · ✅ρ ≥ 0.8(0.85) · ❌max-heitto ≤ 6(11.5)

**Ennen vs. jälkeen (kalibroinnin vaikutus):**
| mittari | ennen (L-V349) | jälkeen (L-V350) | muutos |
|---|---|---|---|
| MAE | 5.61 | 5.25 | -0.36 |
| max-heitto | 11.5 | 11.5 | +0 |
| Spearman ρ | 0.88 | 0.85 | -0.03 |
| bias | -4.63 | -4.18 | +0.45 |

### Laaja (max 66 p)
- n 19 · MAE 10.06 p · ±2p 5.26% · ±4p 10.53% · max 19.8 p · ρ 0.74 · bias -9.31 p (ankara)
- **FAIL ❌** ❌MAE ≤ 6(10.06) · ❌ρ ≥ 0.8(0.74)

**Ennen vs. jälkeen:**
| mittari | ennen (L-V349) | jälkeen (L-V350) | muutos |
|---|---|---|---|
| MAE | 11.98 | 10.06 | -1.92 |
| max-heitto | 23.1 | 19.8 | -3.3 |
| Spearman ρ | 0.82 | 0.74 | -0.08 |
| bias | -11.74 | -9.31 | +2.43 |

#### Caset — lyhyt
| case-id | tehtävä | YTL | moottori 0–20 | ennuste-YTL | ero | V/R/S/K | band |
|---|---|---|---|---|---|---|---|
| es-s1-1 | En los probadores | 33 | 15 | 24.8 | -8.2 | 4/3/4/4 | E |
| es-s1-2 | En los probadores | 33 | 14 | 23.1 | -9.9 | 4/3/4/3 | E |
| es-s2-1 | Una nueva vecina | 33 | 13 | 21.5 | -11.5 | 4/3/3/3 | E |
| es-s4-1 | Mensaje a un amigo | 33 | 16 | 26.4 | -6.6 | 4/4/4/4 | L |
| es-s2-2 | Una nueva vecina | 31 | 14 | 23.1 | -7.9 | 4/3/3/4 | E |
| es-s2-3 | Una nueva vecina | 31 | 13 | 21.5 | -9.5 | 4/3/3/3 | E |
| es-s2-4 | Una nueva vecina | 29 | 13 | 21.5 | -7.5 | 4/3/3/3 | E |
| es-s4-2 | Mensaje a un amigo | 29 | 14 | 23.1 | -5.9 | 4/3/4/3 | E |
| es-s2-5 | Una nueva vecina | 27 | 13 | 21.5 | -5.6 | 4/3/3/3 | E |
| es-s1-3 | En los probadores | 27 | 13 | 21.5 | -5.6 | 4/3/3/3 | E |
| es-s2-6 | Una nueva vecina | 25 | 13 | 21.5 | -3.6 | 4/3/3/3 | E |
| es-s2-7 | Una nueva vecina | 25 | 14 | 23.1 | -1.9 | 4/3/4/3 | E |
| es-s2-8 | Una nueva vecina | 21 | 12 | 19.8 | -1.2 | 3/3/3/3 | M |
| es-s4-3 | Mensaje a un amigo | 19 | 12 | 19.8 | +0.8 | 3/3/3/3 | M |
| es-s3-1 | Un trabajador en prácticas | 17 | 11 | 18.2 | +1.2 | 3/2/3/3 | M |
| es-s4-4 | Mensaje a un amigo | 17 | 11 | 18.2 | +1.2 | 3/2/3/3 | M |
| es-s3-2 | Un trabajador en prácticas | 15 | 11 | 18.2 | +3.2 | 3/2/3/3 | M |
| es-s3-3 | Un trabajador en prácticas | 15 | 11 | 18.2 | +3.2 | 3/2/3/3 | M |

#### Caset — laaja
| case-id | tehtävä | YTL | moottori 0–20 | ennuste-YTL | ero | V/R/S/K | band |
|---|---|---|---|---|---|---|---|
| es-l1-1 | #pequeñosactos #grandescambios | 66 | 14 | 46.2 | -19.8 | 4/3/3/4 | E |
| es-l1-2 | #pequeñosactos #grandescambios | 62 | 13 | 42.9 | -19.1 | 4/3/3/3 | E |
| es-l3-1 | Maneras de vivir | 62 | 14 | 46.2 | -15.8 | 4/3/3/4 | E |
| es-l3-2 | Maneras de vivir | 58 | 13 | 42.9 | -15.1 | 4/3/3/3 | E |
| es-l3-3 | Maneras de vivir | 58 | 13 | 42.9 | -15.1 | 4/3/3/3 | E |
| es-l4-1 | Un buen sitio para visitar | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| es-l1-3 | #pequeñosactos #grandescambios | 54 | 14 | 46.2 | -7.8 | 4/3/3/4 | E |
| es-l3-4 | Maneras de vivir | 54 | 14 | 46.2 | -7.8 | 4/3/3/4 | E |
| es-l4-2 | Un buen sitio para visitar | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| es-l4-3 | Un buen sitio para visitar | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| es-l1-4 | #pequeñosactos #grandescambios | 50 | 13 | 42.9 | -7.1 | 4/3/3/3 | E |
| es-l2-1 | Un estudiante chileno | 50 | 13 | 42.9 | -7.1 | 4/3/3/3 | E |
| es-l3-5 | Maneras de vivir | 50 | 11 | 36.3 | -13.7 | 3/2/3/3 | M |
| es-l4-4 | Un buen sitio para visitar | 46 | 12 | 39.6 | -6.4 | 3/3/3/3 | M |
| es-l2-2 | Un estudiante chileno | 46 | 12 | 39.6 | -6.4 | 3/3/3/3 | M |
| es-l4-5 | Un buen sitio para visitar | 46 | 13 | 42.9 | -3.1 | 4/3/3/3 | E |
| es-l2-3 | Un estudiante chileno | 46 | 12 | 39.6 | -6.4 | 3/3/3/3 | M |
| es-l1-5 | #pequeñosactos #grandescambios | 38 | 12 | 39.6 | +1.6 | 3/3/3/3 | M |
| es-l2-4 | Un estudiante chileno | 34 | 12 | 39.6 | +5.6 | 3/3/3/3 | M |

---

## Saksa (held-out) — DE

Caset: parsittu 21, arvioitu 21, virheitä 0, parsimatta 0.

### Lyhyt (max 33 p)
- n 12 · MAE 4.72 p · ±2p 25% · ±4p 41.67% · max 11.5 p · ρ 0.9 · bias -4.72 p (ankara)
- **FAIL ❌** ❌MAE ≤ 3(4.72) · ✅ρ ≥ 0.8(0.9) · ❌max-heitto ≤ 6(11.5)

### Laaja (max 66 p)
- n 9 · MAE 6.77 p · ±2p 11.11% · ±4p 44.44% · max 14.4 p · ρ 0.84 · bias -5.01 p (ankara)
- **FAIL ❌** ❌MAE ≤ 6(6.77) · ✅ρ ≥ 0.8(0.84)

#### Caset — lyhyt
| case-id | tehtävä | YTL | moottori 0–20 | ennuste-YTL | ero | V/R/S/K | band |
|---|---|---|---|---|---|---|---|
| de-s2-1(#20) | Abschiedsparty (Einladung) | 33 | 13 | 21.5 | -11.5 | 4/3/3/3 | E |
| de-s1-1(#18) | Neues Hobby (Facebook) | 33 | 16 | 26.4 | -6.6 | 4/4/4/4 | L |
| de-s2-2(#53) | Abschiedsparty (Einladung) | 31 | 13 | 21.5 | -9.5 | 4/3/3/3 | E |
| de-s1-2(#27) | Neues Hobby (Facebook) | 29 | 15 | 24.8 | -4.2 | 4/3/4/4 | E |
| de-s2-3(#32) | Abschiedsparty (Einladung) | 27 | 13 | 21.5 | -5.6 | 4/3/3/3 | E |
| de-s1-3(#29) | Neues Hobby (Facebook) | 27 | 13 | 21.5 | -5.6 | 4/3/3/3 | E |
| de-s2-4(#24) | Abschiedsparty (Einladung) | 25 | 13 | 21.5 | -3.6 | 4/3/3/3 | E |
| de-s2-5(#57) | Abschiedsparty (Einladung) | 23 | 11 | 18.2 | -4.8 | 3/2/3/3 | M |
| de-s3-1(#55) | Wetter & Treffen (WhatsApp) | 23 | 12 | 19.8 | -3.2 | 3/3/3/3 | M |
| de-s1-4(#61) | Neues Hobby (Facebook) | 19 | 11 | 18.2 | -0.8 | 3/3/3/2 | M |
| de-s1-5(#63) | Neues Hobby (Facebook) | 19 | 11 | 18.2 | -0.8 | 3/3/3/3 | M |
| de-s3-2(#25) | Wetter & Treffen (WhatsApp) | 17 | 10 | 16.5 | -0.5 | 3/2/3/2 | M |

#### Caset — laaja
| case-id | tehtävä | YTL | moottori 0–20 | ennuste-YTL | ero | V/R/S/K | band |
|---|---|---|---|---|---|---|---|
| de-l2-1(#71) | Leserbrief: Urlaub mit Kindern | 62 | 15 | 49.5 | -12.5 | 4/3/4/4 | E |
| de-l3-1(#50) | Wie war dein Sommer (Bildergeschichte) | 58 | 14 | 46.2 | -11.8 | 4/3/3/4 | E |
| de-l2-2(#49) | Leserbrief: Urlaub mit Kindern | 54 | 12 | 39.6 | -14.4 | 3/3/3/3 | M |
| de-l3-2(#39) | Wie war dein Sommer (Bildergeschichte) | 46 | 12 | 39.6 | -6.4 | 3/3/3/3 | M |
| de-l1-1(#51) | Begegnung in der U-Bahn (Dialog) | 46 | 13 | 42.9 | -3.1 | 4/3/3/3 | E |
| de-l1-2(#64) | Begegnung in der U-Bahn (Dialog) | 42 | 12 | 39.6 | -2.4 | 3/3/3/3 | M |
| de-l3-3(#60) | Wie war dein Sommer (Bildergeschichte) | 42 | 12 | 39.6 | -2.4 | 3/3/3/3 | M |
| de-l3-4(#70) | Wie war dein Sommer (Bildergeschichte) | 38 | 12 | 39.6 | +1.6 | 3/3/3/3 | M |
| de-l3-5(#36) | Wie war dein Sommer (Bildergeschichte) | 30 | 11 | 36.3 | +6.3 | 3/2/3/3 | M |

---

## "Missä pettää" -analyysi ja johtopäätös

**Lyhyt sanoma: prompt-kalibrointi EI riittänyt. FAIL molemmilla kielillä. Älä laajenna scopea.** Tämä on rehellinen tulos — yläpää-ankkuri ei korjannut systemaattista ankaruutta.

### 1. Prompt-ankkuri liikutti tuskin lainkaan
| | bias ennen (L-V349) | bias jälkeen (L-V350) |
|---|---|---|
| ES lyhyt | −4.63 | −4.18 |
| ES laaja | −11.74 | −9.31 |

Laaja parani ~2.4 p mutta on yhä massiivisesti pielessä. Lyhyt ei käytännössä liikkunut. **Pahempaa:** ES laajan Spearman ρ putosi 0.82 → 0.74 — laajan syvyyspalkkio-ohje (kohta c) lisäsi ranking-kohinaa eikä tarkkuutta. Se on kandidaatti poistettavaksi.

### 2. Vika on mallitason keskittymisharha, ei ohje-puute
Moottorin raaka 0–20-jakauma kasaantuu tiukasti: ES 37 casesta **15 sai tasan 13/20**, koko jakauma 11–16. **Vain yksi case** koko aineistossa ylsi L-bandiin (16+). Täydellinen YTL 33/33 -essee saa yhä 13–16/20, ja YTL 66/62 -huiput saavat 13–14/20 — samat kuin keskitason laajat. Eksplisiittinen ohje *"täydellinen tehtävänannon täyttävä teksti ANSAITSEE L:n (16–20)"* **ei muuttanut tätä**. gpt-4o-mini ei yksinkertaisesti käytä asteikon yläpäätä, käskettiinpä sitä miten tahansa. Tämä on mallin keskittymistaipumus (central tendency), jota prompt-nudge ei ohita.

### 3. Held-out saksa vahvistaa: kyse ei ole ylisovituksesta vaan ali-korjauksesta
Saksa (jota EI käytetty viritykseen) failaa identtisesti: lyhyt MAE 4.72 / ρ 0.90 / max 11.5, laaja MAE 6.77 / ρ 0.84, bias −4.72 / −5.01. Sama ankaruus, sama max-heitto, sama kasaantuminen. Korjaus ei pettänyt yleistyäkseen — se ei toiminut kummallakaan kielellä. Metodologisesti tämä on puhdas tulos: held-out käyttäytyy kuin in-sample, joten johtopäätös on luotettava.

### 4. Mitä affiininen jälkikalibrointi (output-puoli) tekisi — ja miksei sekään riitä
Sovitin lineaarisen muunnoksen `official ≈ a·eng20 + b` **espanjalla** ja sovelsin saman saksaan (held-out):
| | ES MAE | ES max | DE MAE (held-out) | DE max |
|---|---|---|---|---|
| lyhyt | 2.50 ✅ | **7.2 ❌** | 3.14 | 7.2 |
| laaja | 4.59 ✅ | 12.2 | 5.11 ✅ | 9.8 |

Affiininen recal toisi laajan MAE:n rajoihin (ES 4.59, DE 5.11 ≤ 6) ja yleistyy saksaan. **Mutta lyhyen max-heitto pysyy ~7.2 (raja ≤ 6)** myös skaalattuna: koska moottori puristaa täydelliset esseet samaan 13–16/20:een kuin hyvät-mutta-ei-täydelliset, mikään lineaarinen skaalaus ei erota niitä. Yläpään erottelukyky on menetetty mallissa, ei mittakaavassa. Lisäksi affiininen recal on laastari joka ei korjaa **oppilaalle näkyvää bandia** (täysi työ näyttäisi yhä E:tä, ei L:ää) ellei myös bandirajoja remapata.

### 5. Suositus — todellinen korjauspolku (priorisoituna)
1. **Few-shot-ankkurointi:** upota promptiin 2–3 OIKEAA YTL-pisteytettyä esimerkkiä per tehtävätyyppi (esim. yksi 33/33 ja yksi 17/33, yksi 62/66 ja yksi 38/66). Malli kalibroituu konkreettisia ankkureita vasten — abstrakti ohje "ansaitsee L:n" ei riitä, mutta nähty 33/33-esimerkki saattaa. Tämä on todennäköisin yksittäinen korjaus.
2. **Vahvempi arviointimalli** (gpt-4o tai uudempi) — testaa onko keskittymisharha pienempi. Mittaa samalla harnessilla.
3. **Vasta jos 1–2 epäonnistuu:** affiininen jälkikalibrointi + bandiremap stopgapiksi laajalle (toimii MAE:lle, ei lyhyen max-heitolle).
4. Poista laajan "syvyyspalkkio"-ohje (kohta c) — se huononsi ρ:tä.

**Älä laajenna scopea (englanti/ruotsi/äidinkieli) ennen kuin moottori läpäisee lukitut rajat molemmilla kielillä.** Tämä eval on toistettava: `node scripts/validate-grading.mjs both`.

### Prompt-muutoksen kohtalo
`lib/writingGrading.js`:n SCORING CALIBRATION -lohko jää committiin paikallisesti (pienensi laajan biasta hieman, ei haitannut lyhyttä) mutta **EI pushata Verceliin** — se ei saavuttanut PASS:ia eikä paranna oppilaan kokemusta merkittävästi. Ship vasta kun todellinen korjaus (few-shot / vahvempi malli) läpäisee.

## Caveatit
- Saksan setissä ei ole 66 p -huippua (korkein 62 p), joten laajan yläpää-erottelu testautuu hieman heikommin kuin espanjassa.
- PDF→teksti-purku tuottaa OCR-artefakteja molemmissa kielissä. Saksan caset tarkistettu silmämääräisesti parsittaessa (Viesti-ankkuri erottaa vastauksen rationaalista).
- Tehtävänannot syötettiin tiivistettyinä (YTL antaa ne suomeksi). Ei vaikuta arvioitavaan tekstiin.
- Anti-ylisovitus: prompt-muutos tehtiin pelkästään L-V349:n espanja-diagnoosista ja lukittiin ennen saksan ajoa. Saksa ajettiin kerran. Jos saksa ei läpäise, sitä EI viritetä erikseen.
- temp 0.2 ei ole täysin deterministinen; "ennen"-luvut ovat L-V349:n erillisestä ajosta, joten pienet erot voivat johtua myös ajovariaatiosta, eivät pelkästä promptista. Suunta + suuruusluokka ovat silti todisteita.
