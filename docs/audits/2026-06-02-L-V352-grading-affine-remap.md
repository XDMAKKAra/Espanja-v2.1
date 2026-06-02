# L-V352 — Arviointi: affiininen jälkikalibrointi (espanja + saksa + ranska)

**Päivä:** 2026-06-02
**Malli:** `gpt-5.4-mini` (harness; tuotanto pysyy gpt-4o-minissä kunnes tämä PASS).
**Kerrokset:** few-shot-ankkurointi (6 ES-vastausta, `lib/gradingAnchors.js`) + **natiiviasteikko** (`ytl_points` 0–33 / 0–66) + **affiininen remap** (`korjattu = a·raaka + b`, sovitettu ES-trainilla, sovellettu kaikkiin kieliin).
**Sovitus puhtaasti:** `(a,b)` sovitettu VAIN espanjan ei-ankkuri-caseilla (pienin neliösumma, erikseen lyhyt/laaja). **Saksa + ranska held-out** — niitä ei käytetty sovitukseen, joten ne mittaavat yleistymistä. ρ on invariantti positiivisen affiinin alla → ranking säilyy.
**Anti-vuoto:** 6 ankkuria poistettu espanjan testisetistä (`isAnchorAnswer`); DE+FR eivät esiinny promptissa (ankkurit espanjaa).
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin; `officialScore`/`officialRationale` stripattiin.
**Lukitut rajat (korjatuista pisteistä):** lyhyt MAE ≤ 3, max ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8. PASS = kaikki kolme kieltä läpäisevät molemmat tehtävätyypit; **päämittari = held-out DE+FR**.

## Verdict

**EI PASS ❌** — held-out (DE+FR) EI läpäissyt ❌ (tämä on päämittari; ES on in-sample ja näyttää aina paremmalta). Älä vaihda tuotantoa ennen kuin kaikki kolme PASS; katso rivit alla + reunaehto-osio.

## Affiininen sovitus (ES-train, pienin neliösumma)
- **Lyhyt:** `korjattu = 1.03767·raaka + 3.93979` → a=1.03767, b=+3.93979, R²=0.90904 (n=15, max=33)
- **Laaja:** `korjattu = 0.34552·raaka + 37.963080000000005` → a=0.34552, b=+37.963080000000005, R²=0.13388999999999998 (n=16, max=66)

_R² on sovitussuoran selitysaste espanjan train-pisteillä. Lyhyt R² 0.91 = lähes lineaarinen vinouma, jonka suora poistaa. **Laaja R² 0.13 = sovitus ei kalibroi vaan regressoi keskiarvoon** (kun ennuste ei korreloi totuuden kanssa, pienin neliösumma litistää kulmakertoimen → kaikki ~50 p). `(a,b)` EI ole bakettu `lib/writingGrading.js`:ään — held-out FAIL → AFFINE_REMAP pysyy identiteettinä, remap pois päältä tuotannossa._

## Tulkinta (writer) — miksi FAIL ja mitä briefin oletus jätti huomiotta

**Päätulos: affiininen remap ei pelasta moottoria, koska briefin keskeinen oletus on väärä.** Brief: "vinouma on lähes vakiosiirtymä per tehtävätyyppi, sovita ES:llä, sovella kaikkiin". Held-out data kumoaa tämän kahdesta suunnasta:

1. **Vinouma EI ole kieliriippumaton vakio.** Raaka-bias lyhyessä: **ES −4.7 p, DE −9.2 p, FR +0.7 p**. Kolme kieltä, kolme eri siirtymää, eikä FR ole edes ankara vaan lepsu. Yksi ES-sovitettu `(a,b)` ei voi korjata kolmea eri offsetia: ES:n +4 p siirtymä jättää DE:n yhä −4.6 p ankaraksi ja **ylikorjaa FR:n** +5.7 p lepsuksi (FR lyhyt MAE huononi 4.0 → 5.7). Tämä on sovitustavan kuolinisku, ei viritettävä yksityiskohta.

2. **Laaja: ranking itse romahti, ei vain absoluuttinen piste.** ES laaja raaka ρ = **0.42** (ei briefin olettamaa ≥0.8). R² 0.13. Kun ennustin ei erottele, pienin neliösumma sovittaa lähes vaakasuoran (kulmakerroin 0.35, leikkaus 38) → kaikki laajat → ~50 p. ES:n laaja MAE "paranee" 12.4 → 4.1, mutta se on **keskiarvoon regressoituminen, ei kalibrointi**: held-out FR laajassa sama litteä kuvaus työntää 22 p vastauksen 46 p:hen (+24), MAE 13. ρ ei liiku (0.42 → 0.42), koska affiininen muunnos ei voi korjata rankingia.

**Lyhyt yhden kielen sisällä toimii** (ES lyhyt: MAE 4.7 → 1.4, max 9 → 5, PASS). Se todistaa että *per-kieli*-affiini lyhyessä on tarkka. Mutta se vaatii kalibrointidataa per kieli (YTL-näytteet erikseen es/de/fr), mikä tappaa "fit once on ES" -idean.

**ρ:n epävakaus on oma löytö.** ES laaja ρ heilui L-V351:n ~0.8:sta tämän ajon 0.42:een (temp 0.2). Arviointimoottorille tämä on diskvalifioiva riippumatta remapista: jos laaja-ranking ei ole vakaa ajojen välillä, oppilas saa eri arvosanan samasta tekstistä eri kerralla.

### Suositus seuraavaksi (Marcel päättää)
- **Älä deployaa.** Tuotanto pysyy gpt-4o-minissä. Remap-koodi on repossa mutta identiteettinä (inertti).
- **Universaali ES→kaikki -remap on kuollut.** Älä yritä virittää `(a,b)`:tä saksaan/ranskaan — se on testin pilaamista.
- **Lyhyt on lähimpänä ratkaisua per-kieli-affiinilla**, jos hyväksytään per-kieli-kalibrointidata + held-out per kieli. Tämä on iso scope-muutos.
- **Laaja vaatii ranking-korjauksen ENNEN mitään kalibrointia.** Diagnosoi ensin laaja-ρ:n vakaus: aja ES laaja 3× ja katso heiluuko ρ. Jos heiluu → ongelma on mallin/promptin laaja-erottelussa (few-shot-ankkurit voivat sekoittaa laajaa), ei jälkikäsittelyssä. Bar-keskustelu / gpt-5.4-täysi / parempi laaja-few-shot ovat oikeampia vipuja kuin remap.
- **Lukittu `max-heitto ≤ 6` lyhyessä (33-skaala):** ES korjattu max 5 alittaa rajan; held-out DE:ssä yksittäiset case-romahdukset (de-s2-2: YTL 31 → raaka 12) ovat malli­virheitä, eivät kalibrointia. Raja ei ole tässä ongelma — sovitustavan yleistymättömyys on.
## Kustannus (ajon todelliset token-luvut)
- 64 arviointikutsua · input 240482 tok (ka 3758/kutsu) · output 74861 tok (ka 1170/kutsu).
- **~$0.33 / 100 arviointia** oletetulla hinnalla $0.25/1M in + $2/1M out. ⚠️ gpt-5.4-minin listahinta on VARMISTETTAVA — token-luvut todelliset, € on arvio.
- Remap on ilmainen (matematiikka). Few-shot pitää input-tokenit ~3758/kutsu.


---

## Espanja (in-sample, ankkurit poistettu) — ES · in-sample (sovitusdata)

Caset: parsittu 31, arvioitu 31, virheitä 0, parsimatta/poissuljettu 6.

> Parsimatta / poissuljettu:
> - {"seq":1,"taskType":"short","taskNum":1,"officialScore":33,"reason":"few-shot anchor (excluded)"}
> - {"seq":11,"taskType":"short","taskNum":2,"officialScore":25,"reason":"few-shot anchor (excluded)"}
> - {"seq":18,"taskType":"short","taskNum":3,"officialScore":15,"reason":"few-shot anchor (excluded)"}
> - {"seq":19,"taskType":"long","taskNum":1,"officialScore":66,"reason":"few-shot anchor (excluded)"}
> - {"seq":29,"taskType":"long","taskNum":1,"officialScore":50,"reason":"few-shot anchor (excluded)"}
> - {"seq":37,"taskType":"long","taskNum":2,"officialScore":34,"reason":"few-shot anchor (excluded)"}

### Lyhyt (max 33 p)
- raaka (ennen remapia): n 15 · MAE 4.73 p · ±2p 6.67% · ±4p 46.67% · max 9 p · ρ 0.99 · bias -4.73 p (ankara)
- **korjattu (affiininen remap)**: n 15 · MAE 1.4 p · ±2p 86.67% · ±4p 93.33% · max 5 p · ρ 0.99 · bias +0.07 p (lepsu)
- **PASS ✅** ✅MAE ≤ 3(1.4) · ✅ρ ≥ 0.8(0.99) · ✅max-heitto ≤ 6(5)

**Ketju L-V350 → raaka → korjattu:**
| mittari | L-V350 (4o-mini) | raaka (5.4+few-shot) | korjattu (+remap) |
| --- | --- | --- | --- |
| MAE | 5.25 | 4.73 | 1.4 |
| max-heitto | 11.5 | 9 | 5 |
| Spearman ρ | 0.85 | 0.99 | 0.99 |
| bias | -4.18 | -4.73 | +0.07 |

### Laaja (max 66 p)
- raaka (ennen remapia): n 16 · MAE 12.38 p · ±2p 0% · ±4p 0% · max 28 p · ρ 0.42 · bias -11.37 p (ankara)
- **korjattu (affiininen remap)**: n 16 · MAE 4.13 p · ±2p 43.75% · ±4p 62.5% · max 16 p · ρ 0.42 · bias -0.12 p (ankara)
- **FAIL ❌** ✅MAE ≤ 6(4.13) · ❌ρ ≥ 0.8(0.42)

**Ketju L-V350 → raaka → korjattu:**
| mittari | L-V350 (4o-mini) | raaka (5.4+few-shot) | korjattu (+remap) |
| --- | --- | --- | --- |
| MAE | 10.06 | 12.38 | 4.13 |
| max-heitto | 19.8 | 28 | 16 |
| Spearman ρ | 0.74 | 0.42 | 0.42 |
| bias | -9.31 | -11.37 | -0.12 |

#### Caset — lyhyt
| case-id | tehtävä | YTL | raaka | korjattu | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|---|
| es-s1-1 | En los probadores | 33 | 27 | 32 | -1 | 4/3/4/4 | 15 | L |
| es-s2-1 | Una nueva vecina | 33 | 27 | 32 | -1 | 4/4/4/4 | 16 | L |
| es-s4-1 | Mensaje a un amigo | 33 | 27 | 32 | -1 | 4/4/4/4 | 16 | L |
| es-s2-2 | Una nueva vecina | 31 | 26 | 31 | +0 | 4/4/4/4 | 16 | L |
| es-s2-3 | Una nueva vecina | 31 | 24 | 29 | -2 | 4/3/3/3 | 13 | L |
| es-s2-4 | Una nueva vecina | 29 | 24 | 29 | +0 | 4/3/3/3 | 13 | L |
| es-s4-2 | Mensaje a un amigo | 29 | 24 | 29 | +0 | 4/3/3/4 | 14 | L |
| es-s2-5 | Una nueva vecina | 27 | 23 | 28 | +1 | 4/3/3/4 | 14 | L |
| es-s1-2 | En los probadores | 27 | 23 | 28 | +1 | 4/3/3/3 | 13 | L |
| es-s2-6 | Una nueva vecina | 25 | 21 | 26 | +1 | 3/3/3/3 | 12 | E |
| es-s2-7 | Una nueva vecina | 21 | 18 | 23 | +2 | 3/2/2/3 | 10 | E |
| es-s4-3 | Mensaje a un amigo | 19 | 18 | 23 | +4 | 3/2/3/3 | 11 | E |
| es-s3-1 | Un trabajador en prácticas | 17 | 8 | 12 | -5 | 2/1/2/3 | 8 | C |
| es-s4-4 | Mensaje a un amigo | 17 | 14 | 18 | +1 | 2/1/2/2 | 7 | M |
| es-s3-2 | Un trabajador en prácticas | 15 | 12 | 16 | +1 | 2/1/2/2 | 7 | C |

#### Caset — laaja
| case-id | tehtävä | YTL | raaka | korjattu | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|---|
| es-l1-1 | #pequeñosactos #grandescambios | 62 | 34 | 50 | -12 | 2/3/3/2 | 10 | E |
| es-l3-1 | Maneras de vivir | 62 | 53 | 56 | -6 | 4/4/4/4 | 16 | L |
| es-l3-2 | Maneras de vivir | 58 | 50 | 55 | -3 | 4/4/4/4 | 16 | L |
| es-l3-3 | Maneras de vivir | 58 | 41 | 52 | -6 | 4/3/3/4 | 14 | E |
| es-l4-1 | Un buen sitio para visitar | 54 | 39 | 51 | -3 | 3/2/3/3 | 11 | E |
| es-l1-2 | #pequeñosactos #grandescambios | 54 | 44 | 53 | -1 | 3/2/3/3 | 11 | L |
| es-l3-4 | Maneras de vivir | 54 | 48 | 55 | +1 | 4/3/4/4 | 15 | L |
| es-l4-2 | Un buen sitio para visitar | 54 | 44 | 53 | -1 | 3/2/3/2 | 10 | L |
| es-l4-3 | Un buen sitio para visitar | 54 | 42 | 52 | -2 | 4/3/3/3 | 13 | E |
| es-l2-1 | Un estudiante chileno | 50 | 39 | 51 | +1 | 3/2/3/3 | 11 | E |
| es-l3-5 | Maneras de vivir | 50 | 35 | 50 | +0 | 3/2/2/2 | 9 | E |
| es-l4-4 | Un buen sitio para visitar | 46 | 38 | 51 | +5 | 3/2/3/3 | 11 | E |
| es-l2-2 | Un estudiante chileno | 46 | 31 | 49 | +3 | 3/2/3/3 | 11 | E |
| es-l4-5 | Un buen sitio para visitar | 46 | 39 | 51 | +5 | 4/2/3/3 | 12 | E |
| es-l2-3 | Un estudiante chileno | 46 | 27 | 47 | +1 | 2/1/2/2 | 7 | E |
| es-l1-3 | #pequeñosactos #grandescambios | 38 | 46 | 54 | +16 | 4/3/3/4 | 14 | L |

---

## Saksa (held-out) — DE · **held-out**

Caset: parsittu 21, arvioitu 21, virheitä 0, parsimatta/poissuljettu 0.

### Lyhyt (max 33 p)
- raaka (ennen remapia): n 12 · MAE 9.17 p · ±2p 0% · ±4p 0% · max 19 p · ρ 0.78 · bias -9.17 p (ankara)
- **korjattu (affiininen remap)**: n 12 · MAE 4.58 p · ±2p 41.67% · ±4p 58.33% · max 15 p · ρ 0.78 · bias -4.58 p (ankara)
- **FAIL ❌** ❌MAE ≤ 3(4.58) · ❌ρ ≥ 0.8(0.78) · ❌max-heitto ≤ 6(15)

**Ketju L-V350 → raaka → korjattu:**
| mittari | L-V350 (4o-mini) | raaka (5.4+few-shot) | korjattu (+remap) |
| --- | --- | --- | --- |
| MAE | 4.72 | 9.17 | 4.58 |
| max-heitto | 11.5 | 19 | 15 |
| Spearman ρ | 0.9 | 0.78 | 0.78 |
| bias | -4.72 | -9.17 | -4.58 |

### Laaja (max 66 p)
- raaka (ennen remapia): n 9 · MAE 12 p · ±2p 11.11% · ±4p 22.22% · max 28 p · ρ 0.8 · bias -12 p (ankara)
- **korjattu (affiininen remap)**: n 9 · MAE 6.67 p · ±2p 22.22% · ±4p 22.22% · max 15 p · ρ 0.8 · bias +3.56 p (lepsu)
- **FAIL ❌** ❌MAE ≤ 6(6.67) · ✅ρ ≥ 0.8(0.8)

**Ketju L-V350 → raaka → korjattu:**
| mittari | L-V350 (4o-mini) | raaka (5.4+few-shot) | korjattu (+remap) |
| --- | --- | --- | --- |
| MAE | 6.77 | 12 | 6.67 |
| max-heitto | 14.4 | 28 | 15 |
| Spearman ρ | 0.84 | 0.8 | 0.8 |
| bias | -5.01 | -12 | +3.56 |

#### Caset — lyhyt
| case-id | tehtävä | YTL | raaka | korjattu | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|---|
| de-s2-1(#20) | Abschiedsparty (Einladung) | 33 | 20 | 25 | -8 | 4/4/3/3 | 14 | E |
| de-s1-1(#18) | Neues Hobby (Facebook) | 33 | 26 | 31 | -2 | 4/4/4/4 | 16 | L |
| de-s2-2(#53) | Abschiedsparty (Einladung) | 31 | 12 | 16 | -15 | 3/2/3/2 | 10 | C |
| de-s1-2(#27) | Neues Hobby (Facebook) | 29 | 24 | 29 | +0 | 4/3/4/4 | 15 | L |
| de-s2-3(#32) | Abschiedsparty (Einladung) | 27 | 20 | 25 | -2 | 4/2/3/3 | 12 | E |
| de-s1-3(#29) | Neues Hobby (Facebook) | 27 | 18 | 23 | -4 | 4/2/3/3 | 12 | E |
| de-s2-4(#24) | Abschiedsparty (Einladung) | 25 | 20 | 25 | +0 | 4/2/3/3 | 12 | E |
| de-s2-5(#57) | Abschiedsparty (Einladung) | 23 | 14 | 18 | -5 | 2/1/2/2 | 7 | M |
| de-s3-1(#55) | Wetter & Treffen (WhatsApp) | 23 | 17 | 22 | -1 | 3/2/3/3 | 11 | E |
| de-s1-4(#61) | Neues Hobby (Facebook) | 19 | 7 | 11 | -8 | 2/1/2/1 | 6 | B |
| de-s1-5(#63) | Neues Hobby (Facebook) | 19 | 11 | 15 | -4 | 3/1/2/2 | 7 | C |
| de-s3-2(#25) | Wetter & Treffen (WhatsApp) | 17 | 7 | 11 | -6 | 1/1/1/1 | 4 | B |

#### Caset — laaja
| case-id | tehtävä | YTL | raaka | korjattu | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|---|
| de-l2-1(#71) | Leserbrief: Urlaub mit Kindern | 62 | 47 | 54 | -8 | 0/3/3/3 | 9 | L |
| de-l3-1(#50) | Wie war dein Sommer (Bildergeschichte) | 58 | 54 | 57 | -1 | 4/3/4/4 | 15 | L |
| de-l2-2(#49) | Leserbrief: Urlaub mit Kindern | 54 | 31 | 49 | -5 | 3/2/3/3 | 11 | E |
| de-l3-2(#39) | Wie war dein Sommer (Bildergeschichte) | 46 | 38 | 51 | +5 | 3/2/3/3 | 11 | E |
| de-l1-1(#51) | Begegnung in der U-Bahn (Dialog) | 46 | 44 | 53 | +7 | 4/3/3/3 | 13 | L |
| de-l1-2(#64) | Begegnung in der U-Bahn (Dialog) | 42 | 14 | 43 | +1 | 1/1/2/1 | 5 | E |
| de-l3-3(#60) | Wie war dein Sommer (Bildergeschichte) | 42 | 34 | 50 | +8 | 3/2/3/2 | 10 | E |
| de-l3-4(#70) | Wie war dein Sommer (Bildergeschichte) | 38 | 28 | 48 | +10 | 3/2/2/2 | 9 | E |
| de-l3-5(#36) | Wie war dein Sommer (Bildergeschichte) | 30 | 20 | 45 | +15 | 2/1/2/2 | 7 | E |

---

## Ranska (held-out) — FR · **held-out**

Caset: parsittu 12, arvioitu 12, virheitä 0, parsimatta/poissuljettu 0.

### Lyhyt (max 33 p)
- raaka (ennen remapia): n 6 · MAE 4 p · ±2p 0% · ±4p 66.67% · max 5 p · ρ 0.71 · bias +0.67 p (lepsu)
- **korjattu (affiininen remap)**: n 6 · MAE 5.67 p · ±2p 33.33% · ±4p 33.33% · max 9 p · ρ 0.71 · bias +5.67 p (lepsu)
- **FAIL ❌** ❌MAE ≤ 3(5.67) · ❌ρ ≥ 0.8(0.71) · ❌max-heitto ≤ 6(9)

**Ketju L-V350 → raaka → korjattu:**
| mittari | raaka (5.4+few-shot) | korjattu (+remap) |
| --- | --- | --- |
| MAE | 4 | 5.67 |
| max-heitto | 5 | 9 |
| Spearman ρ | 0.71 | 0.71 |
| bias | +0.67 | +5.67 |

### Laaja (max 66 p)
- raaka (ennen remapia): n 6 · MAE 5.5 p · ±2p 33.33% · ±4p 50% · max 13 p · ρ 0.94 · bias -3.17 p (ankara)
- **korjattu (affiininen remap)**: n 6 · MAE 13 p · ±2p 0% · ±4p 16.67% · max 24 p · ρ 0.94 · bias +10.67 p (lepsu)
- **FAIL ❌** ❌MAE ≤ 6(13) · ✅ρ ≥ 0.8(0.94)

**Ketju L-V350 → raaka → korjattu:**
| mittari | raaka (5.4+few-shot) | korjattu (+remap) |
| --- | --- | --- |
| MAE | 5.5 | 13 |
| max-heitto | 13 | 24 |
| Spearman ρ | 0.94 | 0.94 |
| bias | -3.17 | +10.67 |

#### Caset — lyhyt
| case-id | tehtävä | YTL | raaka | korjattu | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|---|
| fr-s2-2 | Silence ! | 30 | 25 | 30 | +0 | 4/3/4/3 | 14 | L |
| fr-s1-2 | Pardon ! | 25 | 20 | 25 | +0 | 4/2/3/3 | 12 | E |
| fr-s3-2 | Au restaurant | 23 | 26 | 31 | +8 | 4/3/4/4 | 15 | L |
| fr-s3-1 | Au restaurant | 19 | 23 | 28 | +9 | 4/3/3/4 | 14 | L |
| fr-s1-1 | Pardon ! | 15 | 18 | 23 | +8 | 3/2/2/3 | 10 | E |
| fr-s2-1 | Silence ! | 11 | 15 | 20 | +9 | 3/2/2/2 | 9 | M |

#### Caset — laaja
| case-id | tehtävä | YTL | raaka | korjattu | ero | V/R/S/K | 0–20 | band |
|---|---|---|---|---|---|---|---|---|
| fr-l3-3 | Au pair | 62 | 49 | 55 | -7 | 4/3/4/4 | 15 | L |
| fr-l3-2 | Au pair | 50 | 46 | 54 | +4 | 4/3/3/4 | 14 | L |
| fr-l3-1 | Au pair | 42 | 35 | 50 | +8 | 4/2/3/3 | 12 | E |
| fr-l1-2 | Ma meilleure soirée d'été | 34 | 39 | 51 | +17 | 3/2/3/3 | 11 | E |
| fr-l1-1 | Ma meilleure soirée d'été | 30 | 28 | 48 | +18 | 2/1/2/2 | 7 | E |
| fr-l2-1 | La journée mondiale des animaux | 22 | 24 | 46 | +24 | 3/2/2/2 | 9 | E |

---

## Caveatit
- **Affiininen remap korjaa keskiarvon ja laajan, muttei yksittäisten caseiden jäännöshajontaa.** Jos lyhyt failaa `max-heitto ≤ 6` remapin jälkeen, syy on case-kohtainen (ei systemaattinen vinouma) — katso lyhyt-taulukon suurimmat `ero`-arvot. Niitä ei viritetä paramilla pois.
- **Held-out DE+FR on päämittari.** Jos ES PASS mutta DE/FR FAIL, ES-trainin `(a,b)` ei yleisty → vinouma ei ole kieliriippumaton vakio (oletus pettää). Tämä näkyy DE/FR-biasissa korjauksen jälkeen.
- **Yläpään erottelu** testautuu lähinnä espanjalla (ainoa 66 p); ranska matalapainotteinen (lyhyt huippu 30, laaja 50). Ranskan PASS ei todista yläpäätä.
- Ranskan tehtävänumero päätellään avainsanoista (classifyFrench); tarkista parsimatta-lista.
- PDF→teksti-purku tuottaa OCR-artefakteja; alkuperäisiä YTL-PDF:iä ei ole repossa, joten OCR-pohjaista uudelleentranskriptiota ei voitu tehdä — silppuuntuneet caset jäävät aidoiksi jäännösheitoiksi.
- temp 0.2 ei ole täysin deterministinen; "L-V350"-luvut ovat erillisestä 4o-mini-ajosta. Suunta + suuruusluokka ratkaisevat.
