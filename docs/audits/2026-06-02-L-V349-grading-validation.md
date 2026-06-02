# L-V349 — Arviointimoottorin sokkovalidointi (espanja, lyhyt oppimäärä)

**Päivä:** 2026-06-02
**Lähde:** `docs/yo-espanja-naytevastaukset.txt` (YTL:n viralliset näytevastaukset + pisteet)
**Moottori:** tuotannon `lib/writingGrading.js` + `callOpenAI(gpt-4o-mini, temp 0.2, json_object)` — sama polku jota `/grade-writing` ja landing-demo käyttävät.
**Sokkous:** moottori sai vain oppilaan tekstin + tehtäväkontekstin. `officialScore` ja `officialRationale` stripattiin ennen kutsua (ks. `scripts/validate-grading.mjs` → `gradeCase`, ei välitä niitä `buildGradingPrompt`:lle).
**Skaala:** moottori antaa 0–20. Vertailua varten skaalattu YTL-pisteiksi lineaarisesti (lyhyt ×33/20, laaja ×66/20). Spearman laskettu raa'asta 0–20-summasta (järjestysinvariantti).

**Caset:** parsittu 37, arvioitu 37, virheitä 0, parsimatta 0.

---

## Yhteenveto

### Lyhyt kirjoitustehtävä (max 33 p)
- **n:** 18
- **MAE:** 5.61 p
- **±2 p osuvuus:** 16.67 %
- **±4 p osuvuus:** 44.44 %
- **Max-heitto:** 11.5 p
- **Spearman ρ:** 0.88
- **Bias (ennuste − YTL):** -4.63 p (moottori ankara)

**Verdict: FAIL ❌**
  - ❌ MAE ≤ 3 (toteutui: 5.61)
  - ✅ Spearman ρ ≥ 0.8 (toteutui: 0.88)
  - ❌ max-heitto ≤ 6 (toteutui: 11.5)

### Laaja kirjoitustehtävä (max 66 p)
- **n:** 19
- **MAE:** 11.98 p
- **±2 p osuvuus:** 5.26 %
- **±4 p osuvuus:** 10.53 %
- **Max-heitto:** 23.1 p
- **Spearman ρ:** 0.82
- **Bias (ennuste − YTL):** -11.74 p (moottori ankara)

**Verdict: FAIL ❌**
  - ❌ MAE ≤ 6 (toteutui: 11.98)
  - ✅ Spearman ρ ≥ 0.8 (toteutui: 0.82)

**Läpäisyrajat (lukitut):** lyhyt MAE ≤ 3, max-heitto ≤ 6, ρ ≥ 0.8 · laaja MAE ≤ 6, ρ ≥ 0.8.

---

## Caset — lyhyt (laskeva YTL)
| case-id | tehtävä | YTL | moottori (0–20) | ennuste-YTL | ero | dims V/R/S/K | band |
|---|---|---|---|---|---|---|---|
| short-1-1 | En los probadores | 33 | 15 | 24.8 | -8.2 | 4/3/4/4 | E |
| short-1-2 | En los probadores | 33 | 14 | 23.1 | -9.9 | 4/3/4/3 | E |
| short-2-1 | Una nueva vecina | 33 | 13 | 21.5 | -11.5 | 4/3/3/3 | E |
| short-4-1 | Mensaje a un amigo | 33 | 15 | 24.8 | -8.2 | 4/3/4/4 | E |
| short-2-2 | Una nueva vecina | 31 | 13 | 21.5 | -9.5 | 4/3/3/3 | E |
| short-2-3 | Una nueva vecina | 31 | 13 | 21.5 | -9.5 | 4/3/3/3 | E |
| short-2-4 | Una nueva vecina | 29 | 13 | 21.5 | -7.5 | 4/3/3/3 | E |
| short-4-2 | Mensaje a un amigo | 29 | 14 | 23.1 | -5.9 | 4/3/4/3 | E |
| short-2-5 | Una nueva vecina | 27 | 13 | 21.5 | -5.6 | 4/3/3/3 | E |
| short-1-3 | En los probadores | 27 | 13 | 21.5 | -5.6 | 4/3/3/3 | E |
| short-2-6 | Una nueva vecina | 25 | 13 | 21.5 | -3.6 | 4/3/3/3 | E |
| short-2-7 | Una nueva vecina | 25 | 13 | 21.5 | -3.6 | 4/3/3/3 | E |
| short-2-8 | Una nueva vecina | 21 | 11 | 18.2 | -2.8 | 3/2/3/3 | M |
| short-4-3 | Mensaje a un amigo | 19 | 11 | 18.2 | -0.8 | 3/2/3/3 | M |
| short-3-1 | Un trabajador en prácticas | 17 | 11 | 18.2 | +1.2 | 3/2/3/3 | M |
| short-4-4 | Mensaje a un amigo | 17 | 11 | 18.2 | +1.2 | 3/2/3/3 | M |
| short-3-2 | Un trabajador en prácticas | 15 | 11 | 18.2 | +3.2 | 3/2/3/3 | M |
| short-3-3 | Un trabajador en prácticas | 15 | 11 | 18.2 | +3.2 | 3/2/3/3 | M |

## Caset — laaja (laskeva YTL)
| case-id | tehtävä | YTL | moottori (0–20) | ennuste-YTL | ero | dims V/R/S/K | band |
|---|---|---|---|---|---|---|---|
| long-1-1 | #pequeñosactos #grandescambios | 66 | 13 | 42.9 | -23.1 | 4/3/3/3 | E |
| long-1-2 | #pequeñosactos #grandescambios | 62 | 13 | 42.9 | -19.1 | 4/3/3/3 | E |
| long-3-1 | Maneras de vivir | 62 | 13 | 42.9 | -19.1 | 4/3/3/3 | E |
| long-3-2 | Maneras de vivir | 58 | 13 | 42.9 | -15.1 | 4/3/3/3 | E |
| long-3-3 | Maneras de vivir | 58 | 13 | 42.9 | -15.1 | 4/3/3/3 | E |
| long-4-1 | Un buen sitio para visitar | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| long-1-3 | #pequeñosactos #grandescambios | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| long-3-4 | Maneras de vivir | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| long-4-2 | Un buen sitio para visitar | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| long-4-3 | Un buen sitio para visitar | 54 | 13 | 42.9 | -11.1 | 4/3/3/3 | E |
| long-1-4 | #pequeñosactos #grandescambios | 50 | 13 | 42.9 | -7.1 | 4/3/3/3 | E |
| long-2-1 | Un estudiante chileno | 50 | 12 | 39.6 | -10.4 | 3/3/3/3 | M |
| long-3-5 | Maneras de vivir | 50 | 10 | 33 | -17 | 3/2/3/2 | M |
| long-4-4 | Un buen sitio para visitar | 46 | 10 | 33 | -13 | 3/2/3/2 | M |
| long-2-2 | Un estudiante chileno | 46 | 11 | 36.3 | -9.7 | 3/2/3/3 | M |
| long-4-5 | Un buen sitio para visitar | 46 | 11 | 36.3 | -9.7 | 3/2/3/3 | M |
| long-2-3 | Un estudiante chileno | 46 | 11 | 36.3 | -9.7 | 3/2/3/3 | M |
| long-1-5 | #pequeñosactos #grandescambios | 38 | 11 | 36.3 | -1.7 | 3/2/3/3 | M |
| long-2-4 | Un estudiante chileno | 34 | 11 | 36.3 | +2.3 | 3/2/3/3 | M |

---

## Suurimmat heitot (top 5 |ero|)

### long-1-1 — YTL 66 vs moottori 42.9 (ero -23.1)
**YTL:n perustelu:**  Kirjoittaja välittää viestin selkeästi, luontevasti ja sujuvasti. 
 Teksti on kielellisesti tarkkaa ja kirjoittaja hallitsee käyttämänsä ilmaisuvaraston 
erittäin hyvin. 
 Kirjoittaja käsittelee aihetta monipuolisesti ja tekstin erityinen ansio on sen syvyys. 
 Tekstissä on joitakin pieniä virheitä. Esim. pero no hace nada – pero hace nada; no 
está bien – no es bien 
 Espanjassa kaksoispisteen jälkeen seuraava sana kirjoitetaan pienellä alkukirjaimella. 
Esim. Tengo un consejo para todos ellos: no tienes que...

**Moottorin palaute:** Olet hyvin tuonut esiin, että pienet teot voivat muuttaa maailmaa. Seuraavaksi voit keskittyä menneiden aikamuotojen käyttöön ja konnektoreiden monipuolistamiseen. Tämä auttaa tekemään tekstistä sujuvampaa ja monipuolisempaa.

**Dims V/R/S/K:** 4/3/3/3

### long-1-2 — YTL 62 vs moottori 42.9 (ero -19.1)
**YTL:n perustelu:**  Kirjoittaja pystyy välittämään viestin selkeästi, luontevasti ja sujuvasti. Tekstissä on 
syvyyttä. 
 Hän käsittelee aihetta monipuolisesti tuoden esiin uusia näkökulmia koko tekstin 
ajan. 
 Kirjoittaja käyttää monipuolista, tilanteeseen sopivaa ilmaisuvarastoa ja hallitsee sen 
hyvin. 

 Tekstissä on pieniä epäjohdonmukaisuuksia, jotka hankaloittavat ymmärtämistä 
jonkin verran. Esim. Como separar la basura fue fácil, decidí hacer más cosas/tomar 
más acciones, como renunciar a... - Separar la basura fue fácil, así que decidí 
renunciar a comprarme un coche.

**Moottorin palaute:** On hienoa, että olet maininnut konkreettisia tekoja, kuten kierrätyksen ja julkisen liikenteen käytön. Seuraavaksi kannattaa keskittyä menneisyyden aikamuotojen tarkkuuteen ja konnektoreiden monipuoliseen käyttöön, jotta tekstisi virta olisi sujuvampaa.

**Dims V/R/S/K:** 4/3/3/3

### long-3-1 — YTL 62 vs moottori 42.9 (ero -19.1)
**YTL:n perustelu:**  Kirjoittaja pystyy välittämään viestin selkeästi ja luontevasti. Hänen tekstiään on 
helppo lukea. 
 Tekstissä on joitakin virheitä. Esim. Si viviera con mis amigos, me gustaría 
(konditionaali) tener/ que fuera un piso grande - Sí viviera con amigos, me quería... 
 Tekstin viimeinen virke vaatii pohtimista, jotta sen merkitys avautuu: para tener 
mucho/suficiente espacio (para todos).

**Moottorin palaute:** Kirjoituksessa on hyviä ajatuksia asumismuodoista ja käytät selkeää kieltä. Seuraavaksi kannattaa harjoitella menneitä aikamuotoja ja niiden käyttöä. Myös konnektoreiden monipuolisuus voisi parantaa tekstin sujuvuutta.

**Dims V/R/S/K:** 4/3/3/3

### long-3-5 — YTL 50 vs moottori 33 (ero -17)
**YTL:n perustelu:**  Kirjoittajan teksti vastaa hyvin tehtävänantoa, mutta hän käsittelee aihetta osittain 
toistaen itseään. 
 Kirjoittaja pystyy välittämään viestin kohtalaisen selkeästi ja hänen tekstiään on 
kohtalaisen helppo lukea. Lukeminen ja ymmärtäminen hankaloituvat esimerkiksi 
kohdassa “Nunca he visto con una compañera”, jossa kirjoittaa sekoittaa nähdä-
verbin (ver) asua-verbiin (vivir). 
 Kirjoittaja käyttää riittävää, pääosin tilanteeseen sopivaa ilmaisuvarastoa ja hallitsee 
sen suhteellisen hyvin, mutta tekee joitakin virheitä, esim. gustar-rakenteessa (”lo 
me gustaría”) ja suvussa ja oikein

**Moottorin palaute:** Olet hyvin tuonut esiin mielipiteesi asumismuodoista. Seuraavaksi kannattaa keskittyä aikamuotojen tarkkuuteen ja liittää enemmän yhteyksiä lauseiden välille. Harjoittele myös aiheeseen liittyvää sanastoa, jotta tekstisi olisi monipuolisempaa.

**Dims V/R/S/K:** 3/2/3/2

### long-3-2 — YTL 58 vs moottori 42.9 (ero -15.1)
**YTL:n perustelu:**  Kirjoittaja pystyy välittämään viestin selkeästi, luontevasti ja sujuvasti. Hänen 
tekstiään on helppo lukea. Kuitenkin tekstin toinen lause on hieman irrallinen, eikä 
lukijalle käy ilmi, mikä tai miksi oli hauskaa lukea. 
 Kirjoittajan teksti vastaa hyvin tehtävänantoa, mutta hän ei käsittele aihetta 
monipuolisesti vaan toistaa samaa ajatusta läpi tekstin lisäämättä juurikaan mitään 
uutta jo aiemmin sanomaansa. 
 Tekstissä on vain vähän kielioppivirheitä. Esim. Creo que (yo) disfrutaría mucho 
viviendo(/vivir) solo - Creo que me disfrutaría. 
 Painomerkkien perussäännöt on syytä halli

**Moottorin palaute:** Olet käyttänyt hyviä konnektoreita, mikä tekee tekstistä sujuvampaa. Seuraavaksi voit harjoitella menneitä aikamuotoja ja niiden käyttöä. Myös aiheeseen liittyvän sanaston laajentaminen auttaisi viestin selkeydessä.

**Dims V/R/S/K:** 4/3/3/3


---

## "Missä pettää" -analyysi

**Lyhyt sanoma: moottori EI läpäise lukittuja rajoja. Älä julista laajennusta. Mutta vika on "hyvää laatua" — korjattavissa.**

### 1. Moottori ymmärtää laadun, mutta ei kalibroi sitä oikein
Spearman ρ on vahva molemmissa (0.88 lyhyt, 0.82 laaja). Moottori asettaa esseet **lähes oikeaan paremmuusjärjestykseen** — se siis "tajuaa" mikä teksti on parempi. Pudotus tulee absoluuttisesta tasosta: moottori on **systemaattisesti ankara**. Bias on −4.63 p (−14 %) lyhyessä ja −11.74 p (−18 %) laajassa. Ei satunnaista hajontaa vaan tasainen alaspäin-vinouma.

### 2. Vika keskittyy asteikon yläpäähän — moottori ei anna huippupisteitä
Pahimmat heitot ovat täydet/lähes-täydet YTL-suoritukset:
- YTL **33/33** (täydellinen lyhyt) → moottori antaa raa'asti **13–15/20** → ennuste 21.5–24.8 → ero −8…−11.5.
- YTL **66/62** (huiput laaja) → moottori antaa **13/20** → ennuste 42.9 → ero −19…−23.

Moottori ei käytännössä **koskaan** anna L-bandia (16+/20) edes virheettömälle, tehtävänannon täysin täyttävälle tekstille. Koko jakauma on jumissa M-bandissa (10–12/20).

### 3. Syy on prompt-filosofia, joka ankkuroi kaiken M:ään
`lib/writingGrading.js`:n "GRADING PHILOSOPHY" toistaa kolmesti "M on legitiimi", "virheitä on odotettavissa", "älä arvioi natiivi-/pitkä-kattoa vasten". Tarkoitus on hyvä (estää yliarviointi) mutta se **ylikorjaa**: malli ankkuroi keskiarvon M:ään eikä uskalla nousta E/L:ään. Dimensiokeskiarvot todistavat: **kielen_rakenteet 2.63–2.67** on ankarin — malli lukee "5 = few errors, none block meaning" -kriteerin "lähes virheettömänä" ja antaa siksi vahvallekin B1-tekstille vain 3/5.

### 4. Laaja on ankarampi kuin lyhyt (−18 % vs −14 %)
Sama 0–5-dimensiorubriikki jaetaan short/long-tehtävien kesken, eikä se palkitse pitkän esseen **syvyyttä ja laajuutta**. Laajan huiput (jotka YTL antaa 62–66) jäävät samaan 13/20:een kuin keskitason laajat — moottori ei erottele yläpäätä laajassa lainkaan.

### 5. Korjattavuus — todiste numeroin
| Skenaario | Lyhyt MAE | Laaja MAE |
|---|---|---|
| Raaka | 5.61 | 11.98 |
| Additiivinen kalibrointi (poista bias) | 3.90 (max 7.8) | **4.14** ✅ |
| Multiplikatiivinen kalibrointi (k≈1.22 / 1.29) | 3.52 | **4.11** ✅ |

Pelkkä systemaattisen vinouman poisto **vie laajan rajan sisään** (MAE 4.14 ≤ 6) ja tuo lyhyen lähelle (3.5–3.9 vs raja 3). Tämä vahvistaa: kyse on kalibroinnista, ei laadun ymmärryksen puutteesta.

## Prompt-korjausehdotukset (priorisoituna)

1. **Lisää eksplisiittinen yläpää-ankkuri** `buildGradingPrompt`:iin. Nyt prompt anchoroi vain M:n ("3 = M anchor"). Lisää E/L-ankkuri: *"Lyhyt-oppimäärän suoritus, joka täyttää tehtävänannon kokonaan ja jossa on vain pieniä, merkitystä estämättömiä virheitä, ANSAITSEE E:n tai L:n (16–20). 4–5 dimensiopisteet ovat normaaleja vahvalle B1-tekstille, eivät vain natiivitasolle."* Tämä on yksittäinen tärkein muutos.

2. **Pehmennä kielen_rakenteet-5:n kynnystä.** "5 = range of B1 structures accurate, few errors, none block meaning" luetaan liian tiukasti. Selvennä: *"5 ei tarkoita virheettömyyttä — B1-lyhyttasolla satunnainen virhe, joka ei estä merkitystä, on yhä 5:n arvoinen."*

3. **Eriytä laajan tehtävän pisteytys.** Lisää laajaan tehtävään ohje palkita syvyys/laajuus/näkökulmien määrä, jotta huiput erottuvat keskitasosta (nyt ei eroa).

4. **Stopgap ennen prompt-viritystä:** voit kertoimella k≈1.25 skaalata `processGradingResult`:n `finalScore`:n output-puolella, mutta tämä on laastari. Elegantimpi on prompt-ankkuri (kohta 1), koska se korjaa myös bandien jakauman, ei pelkkää lukua.

## Seuraava askel
Tee prompt-korjaus (kohdat 1–3), aja `node scripts/validate-grading.mjs` uudelleen ja tarkista rajat. **Vasta PASS:n jälkeen** scope-laajennus (englanti/ruotsi/äidinkieli) on perusteltu. Tämä eval on toistettava: sama txt + sama moottori → sama mittari.

## Caveatit
- Lähde on PDF→teksti-purettu. Osa caseista sisältää OCR-yhdistymiä (esim. "amigos eintroducir", "lugarleer", "haypuestos"), jotka EIVÄT ole oppilaan virheitä vaan purkuartefakteja. Nämä voivat hieman rankaista moottoria epäreilusti sanasto/rakenne-pisteissä.
- Tehtävänannot syötettiin tiivistettyinä (YTL antaa ne suomeksi; moottorin `task.prompt` on lyhyt espanjankielinen tiivistelmä). Tämä ei vaikuta arvioitavaan tekstiin, vain kehystykseen.
