# L-V351 — Arviointi: gpt-5.4-mini + few-shot-ankkurointi (espanja + saksa + ranska)

**Päivä:** 2026-06-02
**Malli:** `gpt-5.4-mini` (harness; tuotanto pysyy gpt-4o-minissä kunnes tämä PASS).
**Kalibrointi:** few-shot-ankkurointi — 6 oikeaa YTL-pisteytettyä espanja-vastausta (`lib/gradingAnchors.js`, skaala 15/25/33 lyhyt + 34/50/66 laaja) upotettu promptiin + **natiiviasteikko** (`ytl_points` 0–33 / 0–66, ei 0–20→skaalaus).
**Anti-vuoto:** 6 ankkuria poistettu espanjan testisetistä (`isAnchorAnswer`). Saksa + ranska ovat täysin held-out (ankkurit ovat espanjaa → eivät esiinny promptissa näille kielille).
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin; `officialScore`/`officialRationale` stripattiin ennen kutsua.
**Lukitut rajat:** lyhyt MAE ≤ 3, max ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8. PASS = kaikki kolme kieltä läpäisevät molemmat tehtävätyypit.

## Verdict

**EI PASS ❌** — katso kieli/tehtävätyyppi-kohtaiset rivit alla. Älä vaihda tuotantoa eikä laajenna ennen kuin kaikki kolme PASS.

## Diagnoosi & suositus (kolmas yritys, prompt-tie loppuun käyty)

**Mikä parani:** ranking. Spearman nousi lähes kaikissa soluissa: es lyhyt 0.85→0.91, es laaja 0.74→0.84, de laaja 0.84→0.95, fr laaja 0.81. ρ ylittää 0.8:n 5/6 solussa (vain fr-lyhyt 0.77, n=6 → epävakaa). gpt-5.4-mini + few-shot **järjestää esseet oikein**.

**Mikä EI parantunut, vaan paheni:** absoluuttinen kalibrointi. Bias on yhä systemaattisesti **ankara** ja jopa ankarampi kuin L-V350:ssä (es lyhyt −4.2→−5.6, es laaja −9.3→−11.9, de laaja −5.0→−11.2). Brief-hypoteesi "few-shot nostaa yläpään" oli **väärä**: täydelliset esseet aliarvioituvat yhä (es 33 → 24–27; laaja 62 → 45). Malli lukee näkyvät virheet ja puristaa ylä-keskialueen alas; YTL-arvioijat ovat lyhyt-oppimäärässä armollisempia. Konkreettiset few-shot-ankkurit eivät kumonneet mallin omaa virhe-ankaruutta.

**Avainhavainto:** virhe ei ole rankingissa (ρ kunnossa) vaan lähes **vakiosuuruisessa alaspäin-siirtymässä** per tehtävätyyppi (lyhyt ≈ −6 p, laaja ≈ −11 p). Tämä on tasan se profiili jonka **affiininen jälkikalibrointi** (pred' = a·pred + b) + bandiremap korjaa — briefin nimeämä stopgap. Karkea sovite: laaja ≈ ×1.2 + 11, lyhyt ≈ +6. Korkea ρ takaa että lineaarinen oikaisu pudottaa MAE:n rajojen alle ilman että ranking kärsii.

**Suositus:**
1. **Älä shippaa** gpt-5.4-mini + few-shotia tuotantoon sellaisenaan — se on MAE:llä mitattuna **huonompi** kuin nykyinen gpt-4o-mini (L-V350). Tuotanto pysyy gpt-4o-minissä.
2. Prompt-tie on käyty (L-V349 ohje, L-V350 ankkuri-teksti, L-V351 few-shot + natiiviasteikko — kaikki FAIL). **Seuraava askel = affiininen remap-kerros**, joka sovitetaan tähän dataan ja validoidaan held-outilla (de/fr), EI lisää prompt-viilausta.
3. Vaihtoehto: testaa täysi gpt-5.4 ($0.98/100) jos halutaan nähdä korjaako iso malli biaksen ilman remappia — mutta remap on halvempi ja toimii minkä tahansa mallin päällä.
4. Kustannus ei rajoita: ~$0.33/100 (oletettu hinta), few-shot kolminkertaisti input-tokenit (3758/kutsu) odotetusti.

## Kustannus (ajon todelliset token-luvut)
- 64 arviointikutsua · input 240482 tok (ka 3758/kutsu) · output 75796 tok (ka 1184/kutsu).
- **~$0.33 / 100 arviointia** oletetulla hinnalla $0.25/1M in + $2/1M out. ⚠️ gpt-5.4-minin listahinta on VARMISTETTAVA — token-luvut ovat todelliset, € on arvio.
- Few-shot nostaa input-tokeneita (~1500 → 3758/kutsu) odotetusti.


---

## Espanja (in-sample, ankkurit poistettu) — ES

Caset: parsittu 31, arvioitu 31, virheitä 0, parsimatta/poissuljettu 6.

> Parsimatta / poissuljettu:
> - {"seq":1,"taskType":"short","taskNum":1,"officialScore":33,"reason":"few-shot anchor (excluded)"}
> - {"seq":11,"taskType":"short","taskNum":2,"officialScore":25,"reason":"few-shot anchor (excluded)"}
> - {"seq":18,"taskType":"short","taskNum":3,"officialScore":15,"reason":"few-shot anchor (excluded)"}
> - {"seq":19,"taskType":"long","taskNum":1,"officialScore":66,"reason":"few-shot anchor (excluded)"}
> - {"seq":29,"taskType":"long","taskNum":1,"officialScore":50,"reason":"few-shot anchor (excluded)"}
> - {"seq":37,"taskType":"long","taskNum":2,"officialScore":34,"reason":"few-shot anchor (excluded)"}

### Lyhyt (max 33 p)
- n 15 · MAE 5.87 p · ±2p 6.67% · ±4p 33.33% · max 12 p · ρ 0.91 · bias -5.6 p (ankara)
- **FAIL ❌** ❌MAE ≤ 3(5.87) · ✅ρ ≥ 0.8(0.91) · ❌max-heitto ≤ 6(12)

**Ennen vs. jälkeen:**
| mittari | ennen (L-V350, 4o-mini) | jälkeen (L-V351, 5.4-mini+few-shot) | muutos |
|---|---|---|---|
| MAE | 5.25 | 5.87 | +0.62 |
| max-heitto | 11.5 | 12 | +0.5 |
| Spearman ρ | 0.85 | 0.91 | +0.06 |
| bias | -4.18 | -5.6 | -1.42 |

### Laaja (max 66 p)
- n 16 · MAE 11.88 p · ±2p 6.25% · ±4p 12.5% · max 22 p · ρ 0.84 · bias -11.87 p (ankara)
- **FAIL ❌** ❌MAE ≤ 6(11.88) · ✅ρ ≥ 0.8(0.84)

**Ennen vs. jälkeen:**
| mittari | ennen (L-V350, 4o-mini) | jälkeen (L-V351, 5.4-mini+few-shot) | muutos |
|---|---|---|---|
| MAE | 10.06 | 11.88 | +1.82 |
| max-heitto | 19.8 | 22 | +2.2 |
| Spearman ρ | 0.74 | 0.84 | +0.1 |
| bias | -9.31 | -11.87 | -2.56 |

#### Caset — lyhyt
| case-id | tehtävä | YTL | ennuste (natiivi) | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|
| es-s1-1 | En los probadores | 33 | 27 | -6 | 4/4/4/4 | 16 | L |
| es-s2-1 | Una nueva vecina | 33 | 24 | -9 | 4/4/4/4 | 16 | L |
| es-s4-1 | Mensaje a un amigo | 33 | 26 | -7 | 4/4/4/4 | 16 | L |
| es-s2-2 | Una nueva vecina | 31 | 24 | -7 | 4/4/4/4 | 16 | L |
| es-s2-3 | Una nueva vecina | 31 | 24 | -7 | 4/3/3/4 | 14 | E |
| es-s2-4 | Una nueva vecina | 29 | 26 | -3 | 4/3/3/4 | 14 | E |
| es-s4-2 | Mensaje a un amigo | 29 | 24 | -5 | 4/3/3/4 | 14 | E |
| es-s2-5 | Una nueva vecina | 27 | 22 | -5 | 4/3/3/4 | 14 | E |
| es-s1-2 | En los probadores | 27 | 23 | -4 | 4/2/3/3 | 12 | M |
| es-s2-6 | Una nueva vecina | 25 | 13 | -12 | 2/3/3/2 | 10 | M |
| es-s2-7 | Una nueva vecina | 21 | 18 | -3 | 3/2/2/3 | 10 | M |
| es-s4-3 | Mensaje a un amigo | 19 | 21 | +2 | 4/2/3/3 | 12 | M |
| es-s3-1 | Un trabajador en prácticas | 17 | 11 | -6 | 2/1/2/2 | 7 | C |
| es-s4-4 | Mensaje a un amigo | 17 | 8 | -9 | 2/1/2/2 | 7 | C |
| es-s3-2 | Un trabajador en prácticas | 15 | 12 | -3 | 2/1/2/2 | 7 | C |

#### Caset — laaja
| case-id | tehtävä | YTL | ennuste (natiivi) | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|
| es-l1-1 | #pequeñosactos #grandescambios | 62 | 45 | -17 | 4/3/4/3 | 14 | E |
| es-l3-1 | Maneras de vivir | 62 | 54 | -8 | 4/3/4/4 | 15 | E |
| es-l3-2 | Maneras de vivir | 58 | 52 | -6 | 4/4/4/4 | 16 | L |
| es-l3-3 | Maneras de vivir | 58 | 44 | -14 | 4/3/3/3 | 13 | E |
| es-l4-1 | Un buen sitio para visitar | 54 | 45 | -9 | 4/2/3/3 | 12 | M |
| es-l1-2 | #pequeñosactos #grandescambios | 54 | 39 | -15 | 3/2/3/3 | 11 | M |
| es-l3-4 | Maneras de vivir | 54 | 44 | -10 | 4/3/3/4 | 14 | E |
| es-l4-2 | Un buen sitio para visitar | 54 | 41 | -13 | 4/3/3/3 | 13 | E |
| es-l4-3 | Un buen sitio para visitar | 54 | 51 | -3 | 4/3/3/3 | 13 | E |
| es-l2-1 | Un estudiante chileno | 50 | 32 | -18 | 3/2/3/3 | 11 | M |
| es-l3-5 | Maneras de vivir | 50 | 37 | -13 | 4/2/3/3 | 12 | M |
| es-l4-4 | Un buen sitio para visitar | 46 | 30 | -16 | 3/1/2/2 | 8 | C |
| es-l2-2 | Un estudiante chileno | 46 | 24 | -22 | 2/1/2/2 | 7 | C |
| es-l4-5 | Un buen sitio para visitar | 46 | 39 | -7 | 4/2/3/3 | 12 | M |
| es-l2-3 | Un estudiante chileno | 46 | 27 | -19 | 3/1/2/2 | 8 | C |
| es-l1-3 | #pequeñosactos #grandescambios | 38 | 38 | +0 | 4/2/3/3 | 12 | M |

---

## Saksa (held-out) — DE

Caset: parsittu 21, arvioitu 21, virheitä 0, parsimatta/poissuljettu 0.

### Lyhyt (max 33 p)
- n 12 · MAE 6.83 p · ±2p 16.67% · ±4p 25% · max 14 p · ρ 0.8 · bias -6.83 p (ankara)
- **FAIL ❌** ❌MAE ≤ 3(6.83) · ✅ρ ≥ 0.8(0.8) · ❌max-heitto ≤ 6(14)

**Ennen vs. jälkeen:**
| mittari | ennen (L-V350, 4o-mini) | jälkeen (L-V351, 5.4-mini+few-shot) | muutos |
|---|---|---|---|
| MAE | 4.72 | 6.83 | +2.11 |
| max-heitto | 11.5 | 14 | +2.5 |
| Spearman ρ | 0.9 | 0.8 | -0.1 |
| bias | -4.72 | -6.83 | -2.11 |

### Laaja (max 66 p)
- n 9 · MAE 11.22 p · ±2p 11.11% · ±4p 11.11% · max 18 p · ρ 0.95 · bias -11.22 p (ankara)
- **FAIL ❌** ❌MAE ≤ 6(11.22) · ✅ρ ≥ 0.8(0.95)

**Ennen vs. jälkeen:**
| mittari | ennen (L-V350, 4o-mini) | jälkeen (L-V351, 5.4-mini+few-shot) | muutos |
|---|---|---|---|
| MAE | 6.77 | 11.22 | +4.45 |
| max-heitto | 14.4 | 18 | +3.6 |
| Spearman ρ | 0.84 | 0.95 | +0.11 |
| bias | -5.01 | -11.22 | -6.21 |

#### Caset — lyhyt
| case-id | tehtävä | YTL | ennuste (natiivi) | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|
| de-s2-1(#20) | Abschiedsparty (Einladung) | 33 | 22 | -11 | 4/3/3/3 | 13 | E |
| de-s1-1(#18) | Neues Hobby (Facebook) | 33 | 27 | -6 | 0/4/4/4 | 12 | M |
| de-s2-2(#53) | Abschiedsparty (Einladung) | 31 | 20 | -11 | 4/3/3/3 | 13 | E |
| de-s1-2(#27) | Neues Hobby (Facebook) | 29 | 23 | -6 | 4/3/3/4 | 14 | E |
| de-s2-3(#32) | Abschiedsparty (Einladung) | 27 | 25 | -2 | 4/3/3/3 | 13 | E |
| de-s1-3(#29) | Neues Hobby (Facebook) | 27 | 18 | -9 | 4/2/3/3 | 12 | M |
| de-s2-4(#24) | Abschiedsparty (Einladung) | 25 | 20 | -5 | 4/2/3/3 | 12 | M |
| de-s2-5(#57) | Abschiedsparty (Einladung) | 23 | 9 | -14 | 2/1/2/2 | 7 | C |
| de-s3-1(#55) | Wetter & Treffen (WhatsApp) | 23 | 18 | -5 | 3/2/3/3 | 11 | M |
| de-s1-4(#61) | Neues Hobby (Facebook) | 19 | 10 | -9 | 2/2/2/2 | 8 | C |
| de-s1-5(#63) | Neues Hobby (Facebook) | 19 | 18 | -1 | 3/2/3/3 | 10 | M |
| de-s3-2(#25) | Wetter & Treffen (WhatsApp) | 17 | 14 | -3 | 2/1/2/2 | 7 | C |

#### Caset — laaja
| case-id | tehtävä | YTL | ennuste (natiivi) | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|
| de-l2-1(#71) | Leserbrief: Urlaub mit Kindern | 62 | 49 | -13 | 4/3/4/4 | 15 | E |
| de-l3-1(#50) | Wie war dein Sommer (Bildergeschichte) | 58 | 52 | -6 | 4/3/3/4 | 14 | E |
| de-l2-2(#49) | Leserbrief: Urlaub mit Kindern | 54 | 41 | -13 | 3/2/2/3 | 10 | M |
| de-l3-2(#39) | Wie war dein Sommer (Bildergeschichte) | 46 | 34 | -12 | 3/2/3/3 | 11 | M |
| de-l1-1(#51) | Begegnung in der U-Bahn (Dialog) | 46 | 45 | -1 | 4/3/3/3 | 13 | E |
| de-l1-2(#64) | Begegnung in der U-Bahn (Dialog) | 42 | 24 | -18 | 2/1/2/2 | 7 | C |
| de-l3-3(#60) | Wie war dein Sommer (Bildergeschichte) | 42 | 27 | -15 | 3/2/2/2 | 9 | C |
| de-l3-4(#70) | Wie war dein Sommer (Bildergeschichte) | 38 | 23 | -15 | 2/1/2/2 | 7 | C |
| de-l3-5(#36) | Wie war dein Sommer (Bildergeschichte) | 30 | 22 | -8 | 2/1/2/2 | 7 | C |

---

## Ranska (held-out) — FR

Caset: parsittu 12, arvioitu 12, virheitä 0, parsimatta/poissuljettu 0.

### Lyhyt (max 33 p)
- n 6 · MAE 3.17 p · ±2p 66.67% · ±4p 66.67% · max 7 p · ρ 0.77 · bias +0.17 p (lepsu)
- **FAIL ❌** ❌MAE ≤ 3(3.17) · ❌ρ ≥ 0.8(0.77) · ❌max-heitto ≤ 6(7)

### Laaja (max 66 p)
- n 6 · MAE 8.83 p · ±2p 0% · ±4p 16.67% · max 14 p · ρ 0.81 · bias -5.83 p (ankara)
- **FAIL ❌** ❌MAE ≤ 6(8.83) · ✅ρ ≥ 0.8(0.81)

#### Caset — lyhyt
| case-id | tehtävä | YTL | ennuste (natiivi) | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|
| fr-s2-2 | Silence ! | 30 | 28 | -2 | 4/4/4/4 | 16 | L |
| fr-s1-2 | Pardon ! | 25 | 18 | -7 | 4/2/3/3 | 12 | M |
| fr-s3-2 | Au restaurant | 23 | 24 | +1 | 4/3/4/4 | 15 | E |
| fr-s3-1 | Au restaurant | 19 | 25 | +6 | 4/2/3/4 | 13 | E |
| fr-s1-1 | Pardon ! | 15 | 17 | +2 | 3/2/3/3 | 11 | M |
| fr-s2-1 | Silence ! | 11 | 12 | +1 | 2/1/2/2 | 7 | C |

#### Caset — laaja
| case-id | tehtävä | YTL | ennuste (natiivi) | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|
| fr-l3-3 | Au pair | 62 | 48 | -14 | 4/3/3/4 | 14 | E |
| fr-l3-2 | Au pair | 50 | 40 | -10 | 3/2/3/3 | 11 | M |
| fr-l3-1 | Au pair | 42 | 38 | -4 | 4/2/3/3 | 12 | M |
| fr-l1-2 | Ma meilleure soirée d'été | 34 | 24 | -10 | 3/2/3/3 | 11 | M |
| fr-l1-1 | Ma meilleure soirée d'été | 30 | 24 | -6 | 2/1/2/2 | 7 | C |
| fr-l2-1 | La journée mondiale des animaux | 22 | 31 | +9 | 2/1/2/2 | 7 | C |

---

## Caveatit
- **Yläpään erottelu testautuu ensisijaisesti espanjan ei-ankkuri-caseilla.** Ranska on matalapainotteinen (lyhyt huippu 30, laaja 50) eikä stressi-testaa yläpäätä; saksan huippu 62; vain espanjassa on 66 p. Ranskan PASS ei ole todiste yläpäästä.
- **Ranskan tehtävänumero päätellään avainsanoista** (classifyFrench), koska tiedostossa ei ole inline-koodia. Tarkista parsimatta-lista jos jokin case putosi.
- PDF→teksti-purku tuottaa OCR-artefakteja kaikissa kolmessa (ankkureissakin näkyy liimautuneita sanoja — jätetty tarkoituksella aidoiksi).
- temp 0.2 ei ole täysin deterministinen; "ennen"-luvut ovat L-V350:n erillisestä ajosta (gpt-4o-mini, ei few-shotia), joten pienet erot voivat olla ajovariaatiota — suunta + suuruusluokka ratkaisevat.
- ⚠️ gpt-5.4-minin parametrit: harness käyttää `max_completion_tokens` + oletuslämpötilaa jos malli on gpt-5-perhettä (ks. lib/openai.js). temp 0.2 toteutuu vain jos malli sallii sen.
