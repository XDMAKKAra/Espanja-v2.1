# L-V414 Vaihe 1 — semanttinen vastausavain-pass (RAPORTTI)

Pvm: 2026-06-13. Ajettu täytenä es+fr+de (käyttäjän lupa). 27 Sonnet-subagenttia
(24 oppituntia kurssi×kieli + 3 pankkia), ekstraktiosheetit `tmp/review/`,
`scripts/extract-review-sheets.mjs`. Raakalöydökset: `l-v414-semantic-raw-{es,fr,de}.json`.

## Lopputila
- Validaattori: **P0 = 0** (pysyi), P1 = 41, P2 = 9.
- `npm test`: 1292/1292 läpi. Kaikki 44 muokattua tiedostoa validia JSONia.
- Tehdyt korjaukset committattu + pushattu (user-facing sisältö).

## Korjattu (≈80 muutosta, verifioitu sisällön perusteella)

**Saksa — umlaut-restaurointi (suurin yksittäinen ongelma):**
- `writing-tasks/de/long.json` (25 promptia) + `de/short.json` (43+ promptia): saksankielisistä
  kirjoitustehtäväprompteista puuttuivat umlautit ja ß systemaattisesti (fur→für, uber→über,
  konnen→können, grosse→große, Schuler→Schüler, Losung→Lösung jne.). Oikeasti rikkinäistä
  saksaa opiskelijalle. Korjattu kaikki.

**Saksa — kielioppi/oikeinkirjoitus:** Sie lernst→lernt, endet→enden (Sommerferien),
das Dachboden→der, keine Spinat→keinen, der Souvenirs→das Souvenir, des Mauerfall→Mauerfalls,
der erneuerbare Energien→die erneuerbaren, Sie sind Finninen→Finninnen, "Kaaduin avaimen"→
"Kadotin avaimen", koulukko→koululakko, Pakkaän→Pakkaan, mesteostoksensa→mestariteoksensa.

**Ranska — kielioppi/accept:** poistettu virheelliset accept-muodot (tu n'études, son amie est belle,
des petites maisons jolies, ne mange pas de la viande, le soleil brûlait, "sinä olla", a apparu);
beau→bel appartement, nouveau→nouvel, n'aurait pas parti→ne serait pas partie, fassent coopération→
coopèrent, À mon opinion→À mon avis, "Tu as combien d'années"→"quel âge"; suomi-typot varatasivat→
varasivat, alku sataa→alkoi, tavalinen→tavallinen, perhekulttuutiisi→perhekulttuuriisi, Alpeillailla→
Alpeilla, hint répoundr-→répondr-.

**Espanja — kielioppi/accept/suomi:** verdas→pois bankista, poderías→podrías, "mi hermana le gusta"→
"a mi hermana le gusta", sobrina accept "tytärpuoli"→pois, Lapiz→lápiz; odotatit→odotit,
"näytimme vanhaa linnaa"→"vierailimme vanhassa linnassa", astelisivat→eläisivät, postimiees→postimies
(9 kpl), mestarieos→mestariteos, tuomiokirkoon→tuomiokirkkoon, "horario on huono"→"työajat ovat huonot",
spanialaista→espanjalaista, "loimme akkoja"→"katsoimme ankkoja"; diagnostic es_a_006: "hable" pois
accepted_alternates-listalta.

## EI korjattu — Marcelin päätettäväksi

### A. Synonyymi-distraktori -patterni — RATKAISTU (valtaosa false alarm)
Marcelin päätös: vaihda synonyymi-distraktori selvästi vääräksi. Kielikohtaiset asiantuntija-subagentit
tarkistivat ~17 flägättyä itemiä. **Tulos: suurin osa oli vääriä hälytyksiä** — oppituntien tekijät
olivat jo niputtaneet molemmat merkitykset YHTEEN choiceen (esim. "setä / eno", "etu / hyöty",
"väitellä / keskustella", "Cependant / Néanmoins", "näkökulma / kanta"). Ekstraktorin `*`-merkintä
sai review-agentit lukemaan niputuksen erillisinä vaihtoehtoina.
- fr: kaikki 6 niputettuja → ei muutoksia.
- es: 2 aitoa korjattu (k4 l1 'de niño' distraktori→'joven'; k4 l8 oscuro-distraktori 'tumma'→'meluisa'),
  3 niputettua.
- de: 3 korjattu (k8 l1 Standpunkt-distraktori→'tunnetila'; k6 l3 Integration 'kotouttaminen'→'hajauttaminen';
  k7 l2 Herkunft: keyed 'alkuperä / kotipaikka'→'alkuperä / syntyperä', koska 'kotipaikka' ≠ Herkunft),
  2 niputettua.

### B. Hienovaraiset subjunktiivi/aikamuotovalinnat — VERIFIOITU 2. PASSILLA
Kolme verifiointi-subagenttia luki todelliset tiedostot (ei sheettiä) ja antoi verdiktin per kohta.
Erotteleva sääntö: **päälauseen aikamuoto** ratkaisee subjunktiivin.

**Korjattu (5, päälause preesens/epägrammaattinen → yksiselitteinen):**
- es k8 l9 gap: `hablara`→`hable` (päälause 'no logra' = preesens).
- es k8 l9 mc: `protestaran`→`protesten` (correct_index 1→0, päälause 'no mejora' = preesens) + selitys.
- es k8 l1 vocab: suomi `vierailisi`→`vieraisin` (yo-muoto, persoonavirhe).
- de k7 l4: `lebst`→`lebtest` (Konjunktiv II edellyttää konjunktiivia wenn-lauseessa).
- de k4 l9: `Als`→`Wenn` (correct_index 2→3; als+preesens on kategorisesti epägrammaattista) + selitys.

**Jätetty (verdikti KIISTANALAINEN tai pedagoginen intentio):**
- es k7 l5 `esté`/`estuviera` ('niega que...el día del robo'): molemmat esiintyvät natiivitekstissä.
- es k8 l4 `volviera`/`volvería` ('dijo que'): epäsuora kerronta hyväksyy molemmat; MC, ei voi merkitä kahta.
- es k8 l1 `fuera`/`sea` ('No creo que...posible'): 'fuera' puolustettavissa hypoteettisena ("ei olisi ollut mahdollista").
- es k8 l11 `intentara`: päälause 'eran mínimos' on mennyt → imperf. subj. johdonmukainen; vain P1 (indikatiivi-accept puuttuu), mutta lesson opettaa tarkoituksella imperf. subj. → ei lisätty.
- fr k8 l5 mixed conditional ('Si nous avions réagi...ne serait pas'): item merkitsee validin mixed
  conditionalin virheeksi, MUTTA choices on rakennettu "sekoitus=virhe" -premissin varaan → vaatii
  itemin uudelleenmuotoilun (design-päätös), ei arvon flippiä.
- fr k5 l5 futur `vendrons`/`allons vendre`: selitys myöntää molemmat, mutta MC merkitsee yhden → sama
  luokka kuin synonyymi-distraktorit (A).
- de k7 l4 accept 'wenn du im Lotto gewinnst' (indikatiivi): puhekielessä esiintyy; P1 yli-salliva accept,
  ei poistettu (Konjunktiv-muoto säilyy accept-listassa).

### C. Kaksoisaukko mc-formaatissa (muutama, de/es)
Pari mc-itemiä yrittää testata kahta aukkoa (esim. es era/estaba, de Plusquamperfekt-parit) yhdessä
valinnassa. Rakenteellinen uudelleenmuotoilu (jaa kahdeksi tai muuta gap_filliksi) = ei pikafix.

## Väärät hälytykset (ei toimenpiteitä)
- **reading-bank fr/de q3 "väite tyhjä / selitys tekstin ulkopuolista":** ekstraktioskriptin artefakti.
  true_false-itemeissä on `statement`-kenttä jota skripti ei tulostanut, ja `text` clipattiin 1200
  merkkiin → agentti luuli sisältöä puuttuvan. Pankkidata on kunnossa. (Sivuvaikutus: true_false-väitteet
  jäivät tosiasiassa tarkastamatta — kattavuusaukko, ei bugi.)
- **fr/de oppituntien `direction:"es_to_fi"`-tagi:** systemaattinen (kopioitu es-kurssista). Agentit
  flägäsivät P1:nä. Vaikuttaa vain jos frontti käyttää direction-kenttää UI-vihjeeseen — selvitettävä
  erikseen, ei korjattu tässä.

## Kustannus
27 review-agenttia + 4 fixer-agenttia, ~2,4M tokenia (review ~2,3M, fix ~0,15M).
