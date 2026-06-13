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

### A. Synonyymi-distraktori -patterni (~12 kpl, kaikki kielet)
Vocab-MC-tehtävissä toistuva ilmiö: oikeaksi merkitty suomennos OK, mutta jokin distraktori on
*myös* oikea synonyymi. Esim. es apreciar (arvostaa/arvioida), representar (kuvata/edustaa);
fr l'oncle (eno/setä), le neveu (veljenpoika/sisarenpoika), à tout à l'heure (pian/nähdään kohta),
débattre (väitellä/keskustella); de der Vorteil (etu/hyöty), der Standpunkt (näkökulma/kanta),
die Integration (kotoutuminen/kotouttaminen), die Herkunft (alkuperä/kotipaikka), darstellen (esittää/kuvata).
**Korjaus = joko merkitä molemmat oikeiksi (vaatii MC-logiikan tuen monelle oikealle) tai vaihtaa
distraktori.** Arkkitehtuuripäätös → en tehnyt yksin. Lista raw-tiedostoissa luokka="vastausavain".

### B. Hienovaraiset subjunktiivi/aikamuotovalinnat (~10 kpl, es/fr/de)
Agentit flägäsivät epäluotettavin ref-indeksein subjunktiivin aikamuotoja (es estuviera/esté,
fuera/sea, hablara/hable, protestaran/protesten, volvería/volviera; fr/de mixed conditional).
Spot-tarkistuksessa osa osoittautui jo oikeiksi (esim. accept hyväksyi molemmat muodot) ja
agentin ref osoitti väärään itemiin. **Vaativat itemikohtaisen sisältöhaun + kielioppipäätöksen
ennen muutosta — en korjannut sokkona.** Jos haluat, ajan kohdistetun toisen passin näihin.

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
