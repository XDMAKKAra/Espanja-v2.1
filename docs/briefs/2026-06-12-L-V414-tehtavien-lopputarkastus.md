# L-V414 — Tehtäväsisällön lopputarkastus (kaikki kielet, kaikki pankit)

Ajotapa: kopioi tämä KOKONAAN yhteen chattiin (Fable 5 tai Claude Code). Ajaja toimii
orkesteroijana: koneellinen osa skripteillä, semanttinen osa Sonnet-subagenteilla
(`Agent`-tool, `model: "sonnet"`). Tavoite: jokainen käyttäjälle näkyvä tehtävä on
(1) teknisesti ehjä, (2) vastausavaimeltaan oikein, (3) kieleltään virheetön ja
(4) pedagogisesti järkevä. Skill-stack: EXERCISE (tarkastusrubriikki upotettu tähän
promptiin tokenien säästämiseksi — subagentit EIVÄT lataa skillejä).

---

## Tausta: mitä tarkastetaan (inventaario tehty 2026-06-12)

| Pankki | Polku | Koko | Käyttö |
|---|---|---|---|
| Oppitunnit | `data/courses/{es,fr,de}/kurssi_1..8/lesson_*.json` | 270 tiedostoa, 7,4 MB, ~16 000 itemiä | digikirja + lessonRunner |
| Item-bank | `data/item-bank/{lang}.json` | 5,2 MB | **EI tarkasteta erikseen: pelkkiä ref-viittauksia oppituntien itemeihin** (`source:"authored"`). Oppituntien tarkastus kattaa tämän. |
| Koesimulaatio | `data/examPools/{reading,structure,shortWriting,longWriting}.json` | 84 K | routes/exam.js |
| Luetun pankki | `data/exam-pools/reading-bank/{lang}/{topic}.json` | 18 tiedostoa | luetun ymmärtäminen -moodi |
| Kirjoituspankki | `data/exam-pools/writing-tasks/{lang}/{short,long}.json` | 6 tiedostoa | kirjoitus-moodi |
| Kartoitus | `data/diagnostic/{lang}/part_{a,b,c}.json` | 9 tiedostoa | onboarding-kartoitus |
| Pikkupankit | `data/diagnose_questions.json`, `data/quick-reviews.json` | 28 K | landing-minidiagnostiikka, kertaus |

Oppitunnin item-tyypit: `mc` (stem/choices/correct_index/explanation), `match` (pairs),
`typed` (prompt/accept/direction/hint), `gap_fill` (sentence_template `{N}`/answers/word_bank),
`translate` (source/accept), `writing` (prompt/min_words/max_words). Lisäksi `vocab[]`
(es|fr|de + fi + example_*).

---

## Vaihe 0 — koneellinen validaattori (0 LLM-tokenia)

`scripts/validate-content.mjs` ON JO OLEMASSA ja ajettu kerran. Se tarkistaa:
correct_index rangessa, duplikaattivaihtoehdot, tyhjät kentät, gap-aukot vs answers,
word_bank sisältää vastauksen, mojibake, placeholderit, em-dashit.

**Ensimmäisen ajon tulos (307 tiedostoa, 16 326 itemiä): P0=2052, P1=483, P2=9 — mutta
suurin osa P0:ista on validaattorin skeemavarianssia, EI rikkinäistä sisältöä:**

1. ~925+937 gap_fill-hälytystä: osa oppitunneista käyttää eri aukkosyntaksia kuin `{N}`
   (todennäköisesti `___` tai `{verb}`-tyyppinen). SELVITÄ oikeat varianssit lukemalla
   2-3 esimerkkitiedostoa (esim. `fr/kurssi_3/lesson_7.json` p6-gap-fill-depuis-vaativa)
   ja PÄIVITÄ validaattori tukemaan kaikkia syntakseja. Tarkista myös miten frontti
   (`js/screens/digikirja.js` / `lessonRunner.js`) parsii aukot — frontin parseri on
   totuus siitä mikä syntaksi on validi.
2. 384 "reading-q: ei tunnistettua vastausmuotoa" + 56 "tuntematon item_type: reading_mc":
   reading-pankeissa on kenttänimivariantteja — lue 1 tiedosto per pankki ja täydennä.
3. 50 "diagnostic: correct undefined": kartoituksen kenttänimi on joku muu kuin
   `correct`/`correct_index` — tarkista `data/diagnostic/es/part_a_grammar.json`.

**Aidot, heti korjattavat löydökset ekasta ajosta** (täysi lista
`docs/audits/l-v414-validator-findings.json`):
- 44 × mc-duplikaattivaihtoehto (sama choice kahdesti, esim. es/kurssi_4/lesson_2 "cantaban")
- 33 × gap_fill jonka word_bank ei sisällä yhtään hyväksyttyä vastausta (ratkeamaton UI:ssa)
- 5 × match duplikaatti left-puoli + 12 × tyhjä match-pari (fr/kurssi_1/lesson_4 ym.)
- 43 × match duplikaatti right-puoli (monitulkintainen, P1)

Tehtävä: korjaa validaattorin skeemavarianssit → aja uudestaan → korjaa KAIKKI aidot
P0:t suoraan JSON-tiedostoihin (duplikaattivaihtoehto = korvaa toinen järkevällä
distraktorilla; puuttuva word_bank-vastaus = lisää vastaus bankiin; tyhjä pari = täytä
tai poista). Aja validaattori vielä kerran: P0 = 0 ennen Vaihetta 1.

---

## Vaihe 1 — semanttinen tarkastus (Sonnet-subagentit)

Koneellinen ei näe: onko merkitty vastaus OIKEASTI oikein, onko espanja/ranska/saksa
virheetöntä, onko suomennos oikein, onko tehtävä järkevä. Tämä tehdään subagenteilla.

### Token-säästöarkkitehtuuri (pakollinen)

1. **Ekstraktio ensin.** Kirjoita `scripts/extract-review-sheets.mjs` joka tuottaa
   per kurssi×kieli yhden kompaktin tekstitiedoston (`tmp/review/{lang}_kurssi_{n}.txt`)
   jossa on VAIN tarkastettavat kentät riveinä, ei teoria-markdownia, ei mastery-
   thresholdeja, ei metadataa. Formaatti per item, yksi rivi:
   `L3/p1-recognition#0 mc | el desayuno | lounas;aamiainen*;illallinen;välipala | exp: el desayuno = aamiainen...`
   (`*` = merkitty oikea). Vastaava kompakti muoto muille tyypeille. Tämä noin
   puolittaa subagentin inputin.
2. **Yksi subagentti per kurssi×kieli** = 24 agenttia oppitunneille, ja 3 agenttia
   lisää (yksi per kieli) joka kattaa reading-bankin + writing-tasksin + kartoituksen
   + sen kielen osuuden koesimulaatiopooleista (examPools on espanjaa → es-agentille).
   Yhteensä 27. Aja 6-8 rinnakkain, `model: "sonnet"`, `run_in_background` ok.
3. **Output = vain löydökset.** Subagentti EI toista sisältöä eikä kirjoita esseitä.
   Tyhjä lista on hyvä tulos.
4. Subagentit EIVÄT lataa skillejä eivätkä lue muita tiedostoja kuin oman sheettinsä.

### Subagentin prompt (käytä SANASTA SANAAN, täytä {PLACEHOLDERIT})

```
Olet espanjan/ranskan/saksan kielen ja YO-koevalmennuksen asiantuntija. Tarkastat
suomalaisille lukiolaisille ({KIELI}, lyhyt oppimäärä, YTL) tehtyjä harjoitustehtäviä.
Materiaali on tuotannossa — etsi virheitä, älä paranna tyyliä.

Lue tiedosto {SHEET_POLKU}. Jokainen rivi on yksi tehtävä muodossa:
{FORMAATTIKUVAUS — kopioi ekstraktioskriptin tuottama selite tähän}

Tarkasta jokaisesta tehtävästä TÄSSÄ JÄRJESTYKSESSÄ:
1. VASTAUSAVAIN: onko *-merkitty / accept-listattu vastaus kiistatta oikein?
   Onko jokin distraktori MYÖS oikea vastaus (monitulkintainen tehtävä)?
2. KOHDEKIELI: onko {KIELI}-teksti kieliopillisesti oikein ja luontevaa
   (aksentit, suku, taivutus, sanajärjestys)?
3. SUOMI: onko suomenkielinen ohje/käännös/selitys oikein ja yksiselitteinen?
   Vastaako explanation-kentän väite todellisuutta?
4. PEDAGOGIIKKA: onko tehtävä mielekäs (distraktorit samaa sanaluokkaa/aihetta,
   gap-lause antaa riittävän vihjeen oikeaan muotoon, käännöksen accept-lista
   kattaa ilmeisimmät oikeat muotoilut)?

Raportoi VAIN varmat ongelmat. Jos epäröit onko jokin virhe, jätä raportoimatta —
väärä hälytys maksaa enemmän kuin ohi mennyt tyylikysymys. ÄLÄ raportoi:
tyylimieltymyksiä, vaihtoehtoisia sanavalintoja jotka ovat yhtä oikein,
isoja alkukirjaimia accept-listoissa (vertailu on case-insensitive).

Palauta PELKKÄ JSON-array, ei muuta tekstiä. Jokainen löydös:
{"ref": "<rivin tunniste sheetistä>",
 "sev": "P0|P1",
 "luokka": "vastausavain|kohdekieli|suomi|pedagogiikka",
 "ongelma": "<yksi virke>",
 "korjaus": "<konkreettinen korjausehdotus, esim. uusi oikea arvo>"}

P0 = vastausavain väärin, distraktori myös oikein, kieliopillisesti rikkinäinen
     kohdekielen lause, väärä suomennos.
P1 = harhaanjohtava selitys, heikko distraktori, accept-lista josta puuttuu
     ilmeinen oikea vaihtoehto, epäluonteva muttei virheellinen kieli.

Jos ongelmia ei ole, palauta [].
```

### Aggregointi

Kerää 27 agentin JSON-outputit yhteen (`docs/audits/l-v414-semantic-findings.json`).
Dedupoi (sama ref + luokka). Tee jakauma: montako P0 per kieli per luokka.

---

## Vaihe 2 — korjaus ja raportti

1. **P0-vastausavainvirheet**: korjaa suoraan JSON-tiedostoihin agentin
   korjausehdotuksen mukaan, MUTTA verifioi jokainen itse ennen kirjoitusta
   (agentin ehdotus voi olla väärä — sinä olet toinen silmäpari). Jos olet eri
   mieltä agentin kanssa, älä korjaa vaan kirjaa kiistanalaiseksi.
2. **P0-kielivirheet kohdekielessä**: sama menettely.
3. **P1:t**: ÄLÄ korjaa massana. Listaa raporttiin määrät + 10 esimerkkiä,
   Marcel päättää korjataanko erässä.
4. Aja `node scripts/validate-content.mjs` uudestaan (korjaukset eivät saa rikkoa
   rakennetta) + `npm test` (vitest ei kosketa dataa mutta varmuus).
5. Muista: jos korjaat lesson-tiedostoja, item-bank-refit osoittavat niihin
   indeksillä — ÄLÄ poista tai siirrä itemejä listoissa, vain muokkaa kenttiä
   paikallaan. Jos itemin joutuu poistamaan, aja item-bankin regenerointi
   (etsi skripti: `grep -rn "item-bank" scripts/`).
6. Loppuraportti `docs/audits/l-v414-RAPORTTI.md`: tarkastettu määrä, korjattu
   määrä per luokka, kiistanalaiset, P1-jäännös, montako tokenia paloi.
7. Commit (sisältökorjaukset ovat user-facing → push). Yksi rivi IMPROVEMENTS.md:hen.

## Acceptance

- Validaattori: P0 = 0 koko sisällössä, skeemavarianssit dokumentoitu skriptin
  kommenteissa.
- Jokainen oppitunti, koepooli, moodipankki ja kartoitus käynyt semanttisen
  tarkastuksen läpi (27/27 agenttia palauttanut outputin; jos agentti kaatuu,
  aja uudelleen — ei aukkoja kattavuudessa).
- Kaikki P0-löydökset joko korjattu tai kirjattu kiistanalaisiksi perusteluineen.
- Ei yhtään massamuutosta jota ei voi perustella riviltä: git-diff on luettavissa.

## Budjettiarvio

~27 Sonnet-agenttia × (40-70 k input + 1-3 k output) ≈ 1,5-2 M input-tokenia.
Jos haluat halvemman ensikierroksen: aja ensin pelkkä es (8+1 agenttia, ~600 k),
katso löydöstiheys, ja päätä ajetaanko fr+de samalla tarkkuudella vai
otantana (joka 2. oppitunti). Otanta EI kelpaa vastausavain-luokkaan: jos
es-kierros löytää yhdenkin väärän avaimen, fr+de ajetaan täytenä.
