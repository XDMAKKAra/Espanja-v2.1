# L-V353 — Arviointi: per-kieli-kalibrointi (OFFLINE-rakennus + GATE)

**Päivä:** 2026-06-02
**Rooli:** WRITER. **Skill:** superpowers:verification-before-completion.
**Malli (data):** gpt-5.4-mini + few-shot-ankkurointi, V351:n tallennetut raakaennusteet.
**API-kutsut tässä loopissa:** 0. Koko VAIHE 0 ajettiin jo maksetusta V351-datasta (`scripts/calibrate-offline.mjs`).

## TL;DR

**GATE: FAIL.** Maksullista VAIHE 1 -ajoa EI ajettu. Per-kieli-affiini on oikea vipu (2/6 solua läpäisee held-out-vastaavan LOOCV:n puhtaasti, mukaan lukien molemmat laajat tehtävät), mutta neljä solua kaatuu jo olemassa olevalla datalla. Ratkaiseva este: **lukittu PASS = kaikki kolme kieltä molemmat tehtävätyypit, ja ranska ei voi yltää siihen tällä datalla** (n=6/solu, jokainen yksittäinen väärinluku heittää MAE:ta 4+ ja ρ:ta 0.13). Maksullinen ensemble-ajo ei voi tuottaa globaalia PASSia tällä otoskoolla → krediittejä ei poltettu.

---

## VAIHE 0 — projektio olemassa olevasta datasta

Per (kieli × tehtävätyyppi): sovita `corrected = a·pred + b` (pienin neliösumma) ja arvioi held-out-vastaavasti **LOOCV:llä** (jätä yksi pois, sovita muista, ennusta poisjätetty). ρ on invariantti positiivisen affiinin alla → raaka-ρ on rehellinen ranking-portti (kalibrointi EI korjaa rankingia).

| solu | n | raaka MAE / bias / ρ | affiini (a,b) R² | **LOOCV-korjattu** MAE / max / bias | projektio |
|---|---|---|---|---|---|
| es-short | 15 | 5.87 / −5.6 / 0.91 | 0.891·p+7.80 (R² 0.75) | **2.67** / 8 / −0.13 | ❌ max 8>6 |
| es-long  | 16 | 11.88 / −11.87 / 0.84 | 0.537·p+30.47 (R² 0.52) | **3.44** / 14 / −0.06 | ✅ PASS |
| de-short | 12 | 6.83 / −6.83 / 0.80 | 0.729·p+11.89 (R² 0.54) | **3.58** / 7 / −0.08 | ❌ MAE 3.58>3, max 7>6 |
| de-long  | 9  | 11.22 / −11.22 / 0.95 | 0.764·p+19.54 (R² 0.80) | **4.56** / 10 / +0.11 | ✅ PASS |
| fr-short | 6  | 3.17 / +0.17 / 0.77 | 0.903·p+1.83 (R² 0.61) | **4.83** / 9 / +0.17 | ❌ MAE 4.83>3, ρ 0.77<0.8, max 9>6 |
| fr-long  | 6  | 8.83 / −5.83 / 0.81 | 1.291·p−4.13 (R² 0.73) | **8.5** / 17 / −1.5 | ❌ MAE 8.5>6 |

Lukitut rajat: lyhyt MAE ≤ 3 / max ≤ 6 / ρ ≥ 0.8 · laaja MAE ≤ 6 / ρ ≥ 0.8.

**Mikä affiini korjasi:** bias menee per solu ~0:aan (rakenteellisesti — sovite poistaa systemaattisen vinouman). MAE romahtaa joka solussa: es-long 11.88→3.44, de-long 11.22→4.56, es-short 5.87→2.67. **Tämä on tasan se mitä V352:n universaali affiini ei pystynyt tekemään.** Per-kieli on oikea vipu.

**Mitä affiini EI korjaa, ja mikä kaataa solut:**
- **Jäännöshajonta** (yksittäisten caseiden heitto), ei vinouma. Affiini siirtää kaikkia samalla suoralla, joten yksittäinen väärinluettu essee jää (tai pahenee jos se oli jo väärään suuntaan).
- **Ranking** (fr-short ρ 0.77). Affiini on monotoninen → ei voi korjata.

### Herkkyys — onko kaatuminen yhden outlierin varassa? (0 API)

Pudota kunkin kaatuvan solun pahin LOOCV-jäännös, sovita uudelleen:

| solu | pudotettu case | n−1 LOOCV MAE / max / ρ | tulkinta |
|---|---|---|---|
| es-short | es-s4-3 (jäännös 8) | 2.5 / **6** / 0.91 | **yhden caseen varassa** — ensemble-pelastettavissa |
| de-short | de-s2-5 (jäännös 7) | **3.27** / 6 / 0.81 | laaja hajonta — MAE yhä yli rajan, ensemble epätodennäköisesti riitä |
| fr-short | fr-s1-2 (jäännös 9) | 3.2 / 6 / **0.90** | ρ-romahdus yhden inversion varassa, mutta n→5 ja MAE yhä 3.2 |
| fr-long | fr-l2-1 (jäännös 17) | 4.4 / 7 / 0.97 | yksi väärinluku (off 22 → ennuste 31) hallitsee koko solua |

**Luku:**
- **es-short** kaatuu täsmälleen yhteen caseen (es-s4-3: off 19 → ennuste 21 raa'asti, jonka affiinin ylössiirto pahentaa +8:aan). MAE ja ρ läpäisevät jo. Tämä on uskottavin ensemble-mediaanin pelastettava.
- **de-short** ei läpäise edes pahin pudotettuna (MAE 3.27 > 3). Hajonta on laaja, ei yhden outlierin syy.
- **fr-short** ja **fr-long** ovat kumpikin yhden väärinluvun varassa n=6:ssa. Casea ei voi laillisesti pudottaa tuotannossa; oikea korjaus on lisää FR-näytteitä, ei lisää laskentaa. fr-l2-1 (heikko puhe, off 22, malli antoi 31) on sisällön ylivedon, ei pelkkä stokastiikka.

---

## GATE-päätös

**ÄLÄ aja maksullista testiä.** Perustelu kolmessa kohdassa:

1. **Globaali PASS on saavuttamaton tällä datalla.** Lukittu PASS = kaikki kolme kieltä molemmat tehtävätyypit. Ranska kaatuu molemmissa soluissa ja on rakenteellisesti ohut (n=6). Vaikka ensemble-mediaani-of-3 vakauttaisi varianssia, se ei takaa ρ:n nostoa 0.8:aan aidossa inversiossa eikä korjaa sisällön ylilukua (fr-l2-1) — ja n=6 tarkoittaa että yksi case heittää MAE:ta 4+. Maksullinen ajo ei voi muuttaa lopputulosta FR:n osalta tällä otoskoolla.

2. **de-short kaatuu laajaan hajontaan, ei outlieriin.** MAE 3.27 yli rajan myös pahin pudotettuna → ensemble ei todennäköisesti riitä.

3. **Vain es-short on uskottavasti ensemble-pelastettavissa** (yhden caseen varassa, MAE+ρ jo kunnossa). Yksi solu kuudesta ei oikeuta 210 kutsun ajoa kun lopputulos on silti FAIL.

Krediittejä poltettu: **0**.

---

## Mikä lopulta toimi — ketju V349 → V353

| loop | yritys | tulos |
|---|---|---|
| V349 | sokkovalidointi YTL-näytteillä, perus-prompt + gpt-4o-mini | FAIL — systemaattinen ankaruus, MAE iso |
| V350 | kalibrointiyritys + held-out (saksa) | FAIL — bias yhä iso |
| V351 | few-shot (6 ES-ankkuria) + gpt-5.4-mini + natiiviasteikko | FAIL absoluutissa, mutta **ranking ratkesi** (ρ 0.84–0.95 hyvin otostetuissa soluissa). Bias paheni mutta tuli näkyvästi ~vakioksi per tehtävätyyppi. |
| V352 | **universaali** affiini (yksi (a,b) kaikille kielille) | FAIL held-out — bias EI kieliriippumaton vakio (ES −4.7 / DE −9.2 / FR +0.7), yksi sovite ei korjaa kolmea offsettia; laaja-sovite degeneroitui (R² 0.13, ρ 0.42). |
| **V353** | **per-kieli** affiini + LOOCV-deriskaus (OFFLINE) | **Per-kieli on oikea vipu:** 2/6 solua PASS held-out-LOOCV, molemmat laajat mukana, bias→0 joka solussa, MAE romahtaa. Este ei enää ole bias vaan (a) FR-otoskoko n=6, (b) lyhyt-tehtävien mallivarianssi. GATE FAIL koska globaali PASS vaatii FR:n, joka on liian ohut. |

**Lopputulos:** V353 ratkaisi briefin asettaman ongelman (per-kieli systemaattinen bias) — affiini poistaa sen ja MAE putoaa rajojen tasolle hyvin otostetuissa soluissa. Jäljelle jäänyt este on **eri ongelma**: mallin varianssi (lyhyt) ja FR:n datan ohuus, eivät bias.

---

## Suositus — seuraavat askeleet järjestyksessä

1. **FR-näytteiden keruu on todellinen pullonkaula.** n=6/solu ei riitä validointiin: yksi väärinluku swingaa MAE:ta 4+ ja ρ:ta 0.13. Ennen mitään FR-väitettä tarvitaan lisää pisteytettyjä FR-näytteitä (erillinen datankeruu, ei koodi- eikä laskenta-asia). Tämä myös tekisi tulevasta ensemble-ajosta merkityksellisen.

2. **Ensemble median-of-3 on perusteltu vasta kun FR-data on paksumpi.** Silloin yksi ajo (~$0.70) testaa sekä vakautuksen että lyhyt-solut kerralla. Nyt se ei tuottaisi PASSia.

3. **gpt-5.4-täysi ei todennäköisesti auta.** Esteet ovat varianssi + ohut data + satunnainen sisällön yliluku, eivät heikko perusmalli (ρ jo 0.84–0.95 hyvin otostetuissa soluissa). 3× hinta ei kannata.

4. **Harkitse band-reframe-tuotepäätöstä.** Jos tuote tarvitsee vain YTL-kirjainarvosanan (I/A/B/C/M/E/L) eikä tarkkaa pistettä, band-tason tarkkuus on paljon armollisempi kuin ±3p-MAE ja saattaa läpäistä jo nyt. Tämä on Marcelin päätös, ei tekninen este.

**Tuotanto pysyy gpt-4o-minissä.** `AFFINE_REMAP` jätetään identiteetiksi — per-kieli-(a,b)-vakiot ovat dokumentoituina yllä kandidaatteina, mutta niitä EI baketa ennen kuin held-out PASS (vaatii FR-datan + ensemble-ajon). Vain V351:n yhden vedon dataan sovitettujen vakioiden bakeaminen toistaisi V352:n virheen (sovite onnekkaaseen vetoon).

---

## Rehelliset reunaehdot

- **VAIHE 0 nojaa V351:n yhden vedon vakauteen.** Projektio voi olla joko optimistinen (jos V351 oli onnekas) tai pessimistinen (jos epäonninen). Lyhyt-solujen max-heitto-kaatumiset näyttävät pessimistisiltä: yksittäiset väärinluvut joita ensemble-mediaani voisi tasoittaa. Tätä EI voi todentaa ilman maksullista ensemble-ajoa — ja se ei muuta GATE-päätöstä, koska FR estää globaalin PASSin riippumatta ensemblestä.
- **LOOCV ei poista FR:n ohuutta**, vain pehmentää sitä. n=6:ssa LOOCV-fit on epävakaa (fr-long a=1.291 vahvistaa yhden outlierin 17p-heitoksi). FR:n luottamus on rakenteellisesti matalampi kuin ES/DE.
- **ρ-portti käyttää raaka-ρ:ta**, koska affiini on rank-invariantti. Tämä on rehellinen: kalibrointi ei voi korjata rankingia, joten fr-short ρ 0.77 on aito FAIL jonka vain parempi ranking (enemmän dataa / ensemble / parempi prompti) korjaa.
- es-long ja de-long PASS-projektiot perustuvat held-out-vastaavaan LOOCV:hen, mutta sovite on tehty yhden vedon ennusteisiin. Tuotantovakaus vahvistuu vasta ensemble-ajossa.
