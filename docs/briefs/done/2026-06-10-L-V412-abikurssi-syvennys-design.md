# L-V412 jatko: abikurssi-sivut syviksi (Fable-design)

**Päivä:** 2026-06-10
**Päätös:** Marcel valitsi "abikurssit syviksi" (eriytetään abikurssisivut etusivusta). Etusivu pysyy tiiviinä konversiosivuna; abikurssisivut = syvät kielikohtaiset SEO-sisältösivut.
**Suunnittelija:** Fable-subagentti. Toteutus: impeccable-Sonnet, espanja ensin → hyväksyntä → fr/de.

**Transition-sääntö:** abikurssi.css on jaettu es/fr/de kesken. Kun espanja rakennetaan uuteen rakenteeseen, LISÄÄ uudet komponentit abikurssi.css:ään mutta ÄLÄ poista vanhoja luokkia (.stats/.why/.social/.tier* yms) joita fr/de yhä käyttävät. Vanha CSS poistetaan vasta kun fr/de on migratoitu.

---

## A. Uusi osiorakenne (järjestys)

1. **Hero (kevennetty)** — H1 hakusanalla. Paper-stack SIIRTYY osioon 6. Oikealle TOC-kortti ("Tällä sivulla", ankkurit osioihin). Hinta yhdeksi riviksi. CTA: Osta + "Katso näyte" (/nayte).
2. **YO-kokeen rakenne** (`#yo-koe`) UUSI — H2 "Espanjan YO-kokeen rakenne (lyhyt oppimäärä)". Kolme osaa (kuullun/luetun ymmärtäminen, kirjoittaminen) `.exam-map`-pystyrivinä. Vain varmat faktat: digitaalinen, yksi koepäivä, kirjoittaminen max 33 p. EI keksittyjä per-osio-pisteitä/minuutteja. Linkki koerakenne-oppaaseen.
3. **Kurssipolku (syvennetty)** (`#sisalto`) — nykyinen 8 kurssin polku + jokaiseen lisärivi `.path-exam-note` (mitä YO-taitoa palvelee) + 2-3 kpl leipätekstiä (miten edetä).
4. **Kielioppifokus** (`#kielioppi`) UUSI KIELIKOHTAINEN — H2 "Espanjan kielioppi joka YO-kokeessa oikeasti ratkaisee". `.pitfall-list` 5 kompastuskiveä + opaslinkit + kurssiviite.
5. **Yleisimmät virheet** (`#virheet`) UUSI KIELIKOHTAINEN — `.error-strip` Kalam-irtolauseet (yliviivaus + korjaus + selite) + linkki pääoppaaseen.
6. **Miten kirjoitelma arvioidaan** (`#arviointi`) SÄILYTETTY+SIIRRETTY — grading-steps + rubric-card + paper-artefakti (kielikohtainen kirjoitelma) tänne.
7. **Sopiiko sinulle** (`#kenelle`) UUSI — `.fit-split`: "Sopii jos…" / "Et tarvitse jos…" (rehellinen).
8. **Hinta (tiivis)** (`#hinta`) KARSITTU — tier-grid pois, yksi `.price-strip`: 49 €, 4 bullettia, nappi, Treeni-rivi → /pricing.html.
9. **Oppaat** (`#oppaat`) UUSI KIELIKOHTAINEN — `.guide-rail` 5-6 opaslinkkiä otsikko+kuvaus.
10. **FAQ** SÄILYTETTY+SYVENNETTY — 7-8 kysymystä, ≥3 kielikohtaista. FAQPage-JSON-LD.
11. **Cross-language + CTA + footer** SÄILYTETTY — CTA-otsikko kielikohtaiseksi.

KARSITAAN: stats-nauha (90/6/8/4 → upota leipätekstiin), "Miksi Puheo" (hajauta osioihin 6/7), social-sitaatti (jää etusivulle).

## E. Uudet CSS-komponentit (abikurssi.css, warm-paper-tokenit, ei uusia värejä/fontteja)
- `.toc-card` — heron sisällysluettelo-kortti (paper-tyyli, numeroidut ankkurit).
- `.exam-map` / `.exam-part` — kolmen koeosan pystyrivi, pisteviiva + numeropallot.
- `.path-exam-note` — polun lisärivi (terra, pieni).
- `.pitfall-list` / `.pitfall` — numeroitu lista, gold-soft-alleviivaus, dashed-erottimet, opaslinkki nuolella.
- `.error-strip` — Kalam-irtolause cream-deep-pohjalla, yliviivaus brick + korjaus green + selite.
- `.fit-split` — kaksi palstaa (sopii: green-tint ✓ / et tarvitse: neutraali).
- `.price-strip` — yksi leveä paper-kaista, hinta stamp-henkisenä, bulletit + nappi.
- `.guide-rail` / `.guide-link` — linkkilista dashed-erottimin, otsikko+kuvaus+nuoli.

## F. Ennalleen: nav+overlay, footer, fontit, gate, metat (description päivitetään), Course-JSON-LD (+FAQPage +BreadcrumbList), xlang, skip-link, .hl, btn-järjestelmä.

---

## C. Per-kieli-erot

| | Espanja | Ranska | Saksa |
|---|---|---|---|
| Curriculum-teemat | nykyiset es | nykyiset fr | nykyiset de |
| Kielioppifokus | preteriti/imperfekti, ser/estar, por/para, subjunktiivi, gerundi/infinitiivi | passé composé/imparfait, artikkelit+partitiivi, subjonctif, adjektiivin paikka/taivutus, mielipidetekstin rakenteet | sanajärjestys (V2+sivulause), akkusatiivi/datiivi, Perfekt haben/sein, adjektiivin taivutus, modaaliverbit |
| Yleisimmät virheet | preesens menneen tilalla; estar ammatin kanssa; kesken perustelu; aksentit | passé composé imparfaitin tilalla; partitiivi väärin; adjektiivi taipumatta | verbi väärässä paikassa sivulauseessa; datiivi/akkusatiivi; sein/haben Perfektissä |
| Paper-aihe | kesäloma Barcelona (pret/imp) | viikonloppu Pariisi (`il a fait`→`faisait`) | kesätyö (`habe gefahren`→`bin gefahren` + sanajärjestys) |
| Oppaat (slugit) | espanja-yo-koe-2026-lyhyt-oppimaara, espanja-yo-yleisimmat-kirjoitusvirheet, espanja-yo-sanasto-teemat, preteriti-vs-imperfekti-opas, ser-vs-estar-milloin-kumpaakin, por-vs-para-selkea-ero, espanja-subjuntiivi-kaytto, ojala-subjunktiivi-yleisimmat-virheet, espanja-gerundio-vs-infinitivo, espanja-aksentit-painosaannot | ranska-yo-koe-rakenne, ranska-passe-compose-vs-imparfait, ranska-artikkelit-partitiivi, ranska-subjonctif-kaytto, ranska-adjektiivi-sijainti-taipuminen, ranska-mielipidekirjoitus | saksa-yo-koe-rakenne, saksa-sanajarjestys, saksa-akkusativ-vs-dativ, saksa-perfekt-haben-vai-sein, saksa-adjektiivin-taivutus, saksa-modaaliverbit |
| Koerakenne-opas (osio 2) | espanja-yo-koe-2026-lyhyt-oppimaara | ranska-yo-koe-rakenne | saksa-yo-koe-rakenne |

Yhteiset oppaat: lyhyt-kieli-essee-kirjoittaminen, lukukokeen-vastaustekniikka, kielen-sanaston-opettelu-tehokkaasti.
Ranska/saksa: sama runko kuin espanja, mutta osiot 2/4/5/6 + FAQ:n kielikohtaiset kirjoitetaan uudelleen (EI etsi-korvaa-kieliversiointi).

## B. Copy-luonnos: ESPANJA (toteuta tämä; humanizer-puhdas, ei em-dashia)

### 1. Hero
- H1: `Espanjan abikurssi lyhyelle oppimäärälle.` (.hl-korostus sanalle "abikurssi")
- Sub: `Tällä sivulla käydään läpi mitä lyhyen espanjan YO-koe vaatii, mitä Puheon abikurssi sisältää ja miten kirjoitelmasi arvioidaan. Lue ensin, osta vasta sitten.`
- Hintarivi (yksi rivi): `49 € kertaostos, käyttö koepäivään asti · tai kokeile ensin ilmaiseksi`
- CTA: `Osta kurssi 49 €` (primary) + `Katso näyte` (linkki /nayte)
- TOC-kortti "Tällä sivulla": YO-kokeen rakenne · Kurssin sisältö · Kielioppi joka ratkaisee · Yleisimmät virheet · Miten kirjoitelma arvioidaan · Kenelle kurssi sopii · Hinta · Oppaat · UKK (ankkurit #yo-koe,#sisalto,#kielioppi,#virheet,#arviointi,#kenelle,#hinta,#oppaat,#ukk)

### 2. YO-kokeen rakenne
- H2: `Espanjan YO-kokeen rakenne (lyhyt oppimäärä)`
- Intro: `Lyhyen espanjan ylioppilaskoe on digitaalinen ja tehdään yhden koepäivän aikana. Kokeessa on kolme osaa, ja jokainen mittaa eri taitoa. Kurssin 90 oppituntia ja 6 mallikoetta on rakennettu näiden kolmen osan ympärille.`
- Osa 1 Kuullun ymmärtäminen: `Kuulet espanjankielisiä äänitteitä ja vastaat kysymyksiin. Nauhoja ei voi pysäyttää, joten tärkein treenattava taito on sietää sitä ettet ymmärrä joka sanaa. Vastaus löytyy yleensä kokonaisuudesta, ei yksittäisestä sanasta.`
- Osa 2 Luetun ymmärtäminen: `Tekstit ovat arkisia: uutisia, ilmoituksia, blogitekstejä. Pisteet menetetään useimmin huolimattomalla kysymyksen luvulla, ei sanaston puutteella. Vastaustekniikka kannattaa opetella erikseen:` linkki /artikkelit/lukukokeen-vastaustekniikka.
- Osa 3 Kirjoittaminen: `Kirjoitustehtävistä saa enimmillään 33 pistettä, ja tämä osio ratkaisee arvosanan useammin kuin moni uskoo. YTL arvioi neljää asiaa: viestinnällisyyttä, rakenteita, sanastoa ja kokonaisuutta. Miten arviointi käytännössä toimii, käydään läpi alempana tällä sivulla.` (ankkuri #arviointi)
- Lopussa: `Koko kokeen läpikäynti tehtävätyypeittäin:` linkki /artikkelit/espanja-yo-koe-2026-lyhyt-oppimaara.

### 3. Kurssipolku (säilytä nykyiset 8 es-teemaa+kuvaukset, lisää .path-exam-note-rivit)
- H2: `Mitä espanjan abikurssi sisältää: 8 kurssia, 90 oppituntia`
- Esim exam-note: kurssi 3 `Kantaa kirjoitelman menneen ajan kerrontaan.`, kurssi 4 `Preteriti vai imperfekti on YO-kirjoitelman yleisin valintatilanne.`, kurssi 6 `Mielipideteksti on toistuva YO-tehtävätyyppi.`
- Polun jälkeen leipä: `Polkua ei tarvitse kulkea alusta. Jos abivuosi on jo käynnissä, aloita kurssista 4 tai 5 ja palaa taaksepäin vain jos mallikoe paljastaa aukon. Viimeinen kurssi on puhdasta koevalmennusta: kuusi mallikoetta aikarajalla, jokainen kirjoitelma arvioituna. Moni huomaa vasta mallikokeessa, että ymmärtää lukutekstit hyvin mutta kirjoittaminen laahaa. Juuri sitä varten polku päättyy kokeisiin.`

### 4. Kielioppifokus
- H2: `Espanjan kielioppi, joka YO-kokeessa oikeasti ratkaisee`
- Intro: `Lyhyen oppimäärän kokeessa ei tarvita koko kielioppia. Viisi rakennetta toistuu arvioinnissa niin usein, että niiden hallinta näkyy suoraan pisteissä.`
- Pitfall-lista (nimi + 1-2 virkettä + opaslinkki + kurssiviite):
  1. Preteriti vai imperfekti. `Kerrotko mitä tapahtui, vai kuvailetko millaista oli? Tämä valinta tulee vastaan lähes jokaisessa kirjoitelmassa.` → /artikkelit/preteriti-vs-imperfekti-opas · kurssit 3-4
  2. Ser vai estar. `Suomessa on yksi olla-verbi, espanjassa kaksi. Väärä valinta ei kaada lausetta, mutta toistuvana se syö rakenteiden pisteitä.` → /artikkelit/ser-vs-estar-milloin-kumpaakin · kurssit 1-2
  3. Por vai para. `Kaksi prepositiota jotka molemmat kääntyvät usein samalla suomen sanalla. Erottelu on opittavissa parilla nyrkkisäännöllä.` → /artikkelit/por-vs-para-selkea-ero
  4. Subjunktiivi. `Mielipideteksteissä subjunktiivi erottaa C:n ja M:n kirjoittajan. Ojalá- ja espero que -rakenteet kannattaa osata.` → /artikkelit/espanja-subjuntiivi-kaytto · kurssit 6-7
  5. Gerundi vai infinitiivi. `Me gusta viajar, ei me gusta viajando. Pieni asia joka toistuu usein.` → /artikkelit/espanja-gerundio-vs-infinitivo

### 5. Yleisimmät virheet (.error-strip Kalam-irtolauseet)
- H2: `Yleisimmät virheet espanjan YO-kokeessa`
- Intro: `Nämä ovat virhetyyppejä joita arvioiduissa harjoituskirjoitelmissa näkyy eniten. Yksikään ei vaadi lisää lahjakkuutta, vain oikein suunnattua toistoa.`
- Stripit (virhe yliviivattu → korjaus + selite):
  - `comemos → comimos` `Kerroit menneestä, mutta verbi jäi preesensiin. Yleisin yksittäinen virhe menneen ajan kerronnassa.`
  - `Estoy estudiante → Soy estudiante` `Ammatti ja rooli ovat ser-verbin aluetta.`
  - `el problema es importante para mí porque… (kesken)` `Aloitit hyvin mutta perustelu puuttui. Tehtävänannon jokainen kohta pitää käsitellä, muuten sisältöpisteet jäävät saamatta.`
- Lopussa: linkit /artikkelit/espanja-yo-yleisimmat-kirjoitusvirheet ja /artikkelit/espanja-aksentit-painosaannot.

### 6. Miten kirjoitelma arvioidaan (paper-stack tänne)
- H2: `Miten espanjan kirjoitelma arvioidaan`
- Intro: `YTL arvioi lyhyen oppimäärän kirjoitelman neljällä osa-alueella: sisältö ja tehtävänanto, rakenne ja sidosteisuus, kielen laajuus sekä tarkkuus. Puheon arviointi käyttää samaa jakoa. Saat pistehaarukan ja perustelun, et luvattua yksittäispistettä, koska tarkkaa pistettä ei voi luvata kukaan.`
- Säilytä nykyiset 3 stepiä + rubric-card + paper-artefakti (Barcelona-kirjoitelma, pistehaarukka 21-27 / 33 p).

### 7. Sopiiko sinulle (.fit-split)
- H2: `Kenelle espanjan abikurssi sopii?`
- Sopii jos: `Kirjoitat lyhyen espanjan keväällä tai syksyllä ja haluat treenata samoja tehtävätyyppejä jotka tulevat kokeessa vastaan.` / `Kielioppi on hajanainen: osaat asioita, mutta et tiedä mitä puuttuu.` / `Haluat kirjoitelmistasi arvion samana iltana, et ensi viikolla.`
- Et tarvitse jos: `Kirjoitat pitkää oppimäärää. Tehtävät ja arviointi on mitoitettu lyhyelle.` / `Haluat vain kirjoitelmien arvioinnin ilman kurssia. Silloin Treeni 9 €/kk riittää.` / `Etsit puhekurssia. YO-kokeessa ei ole suullista osaa, eikä tämä kurssi treenaa puhumista.`

### 8. Hinta (.price-strip)
- H2: `Mitä espanjan abikurssi maksaa?`
- `Kurssi on 49 euron kertaostos. Ei tilausta, ei kuukausimaksua, käyttöoikeus ylioppilaskokeeseesi asti. Hintaan kuuluu koko 8 kurssin polku, 6 mallikoetta, kirjoitelmien arviointi ja kaikki kolme kieltä.` + 4 bullettia + nappi `Osta kurssi 49 €` + rivi `Pelkkä arviointi ilman kurssia: Treeni 9 €/kk.` linkki /pricing.html + reassure (14 päivän rahat takaisin).

### 9. Oppaat (.guide-rail)
- H2: `Ilmaiset oppaat lyhyen espanjan kirjoittajalle`
- Intro: `Näitä ei tarvitse ostaa. Oppaat käsittelevät samoja asioita joita kurssilla treenataan, ja niistä näkee millaisella otteella Puheo opettaa.`
- 6 linkkiä (otsikko + 1 rivin kuvaus): espanja-yo-koe-2026-lyhyt-oppimaara, espanja-yo-yleisimmat-kirjoitusvirheet, preteriti-vs-imperfekti-opas, ser-vs-estar-milloin-kumpaakin, espanja-yo-sanasto-teemat, lukukokeen-vastaustekniikka.

### 10. FAQ (säilytä nykyiset 5 + lisää nämä 3 kielikohtaista)
- `Kuinka vaikea lyhyen espanjan YO-koe on?` → `Koe on tehtävissä lukion lyhyen oppimäärän opeilla, mutta kirjoitelma erottelee eniten. Hyvä uutinen: kirjoittaminen on myös se osa-alue jota voi treenata tehokkaimmin, koska jokaisesta harjoituksesta saa arvion.`
- `Pitääkö subjunktiivi osata?` → `Kokonaan ei, mutta yleisimmät rakenteet kannattaa. Mielipidetekstissä oikein käytetty subjunktiivi nostaa kielen laajuuden arviota. Kurssit 6 ja 7 keskittyvät tähän.`
- `Riittääkö Duolingo espanjan YO-kokeeseen?` → `Duolingo pitää sanaston hengissä, mutta se ei treenaa YO-kokeen tehtävätyyppejä eikä arvioi kirjoitelmia YTL:n kriteereillä. Ne ovat juuri ne kohdat joissa koepisteet ratkeavat.`

### 11. CTA
- H2: `Lyhyt espanja kirjoitetaan kerran. Treenaa niin että se riittää.` (muu CTA-osio ennallaan)

## Pakolliset tarkistukset
- Humanizer kaikelle uudelle suomelle.
- EI keksittyjä pistemääriä/kestoja osioon 2 (vain: digitaalinen, yksi koepäivä, kirjoittaminen max 33 p).
- Mobiili <440px ilman vaakavieritystä (erit. .exam-map, .fit-split, .price-strip → 1 palsta).
- Sisäiset oppaslinkit oikeilla slugeilla (/artikkelit/<slug>).
