# PR #3 brief — kurssikoe-monipuolisuus + regenerointi

**Status:** ready to start in a fresh session. Branch from `main`. Vaatii PR #2:n
mergan ensin (sama `translation_accepted`-taulu hyödyllinen testin generoinnissa).

## Goal

Jokaisen kurssin viimeinen lesson (`type: "test"`, "Kertaustesti — Kurssi N")
sisältää oikeasti monipuolisia tehtäviä: vähintään 4 eri tehtävätyyppiä
sopivassa suhteessa (15 kysymystä yhteensä, paitsi kurssi 8 = 20).

Nykyinen prompt ei pakota tyyppi-jakaumaa, joten AI on usein generoinut 80%
monivalintaa + 20% käännöstä. Päivitys: parannettu prompt + regenerointiskripti
joka päivittää OLEMASSA OLEVAT test-itemit kaikille kursseille kaikilla kielillä.

## Skill-stack

EXERCISE + SUPABASE + PLANNING (ei pelkkä frontend). Kutsu:
- `practice-problem-sequence-designer`, `variation-theory-task-designer`, `retrieval-practice-generator`, `scaffolded-task-modifier`, `worked-example-fading-designer`, `cognitive-load-analyser`, `criterion-referenced-rubric-generator`, `adaptive-hint-sequence-designer`
- `supabase`, `supabase-postgres-best-practices`
- `superpowers:brainstorming`, `superpowers:writing-plans`

## Vaiheet

### 1. Päivitä `curriculumTestInstruction` prompt

Tiedosto: `lib/lessonContext.js`, funktio `curriculumTestInstruction`.

Lisää promptiin:

```
TÄRKEÄ — TEHTÄVÄTYYPPIEN MONIPUOLISUUS:
Generoi yhteensä N kysymystä jakauttuneena seuraavasti:
- monivalinta: 30 % (N * 0.3, alas pyöristettynä)
- aukkotehtava: 25 %
- kaannos (käännös FI→ES, FI→FR, tai FI→DE riippuen kielestä): 20 %
- yhdistaminen (sana-paritus): 15 %
- lauseen_muodostus (annetuilla sanoilla): 10 %

Älä koskaan generoi yli 50 % yhden tyypin tehtäviä. Jos pyöristyksen
takia yhteismäärä ei kohtaa, lisää puuttuvat aukkotehtäviin.

Jokaisessa kysymyksessä TÄYTYY olla "type"-kenttä joka on tarkasti yksi
yllämainituista avaimista.
```

### 2. Tarkennusta promptiin: tehtävien laatu

Jokainen tyyppi saa oman vaatimuslistansa:
- **monivalinta**: 4 vaihtoehtoa joista yksi oikein. Harhauttajat oltava
  uskottavia (samaa sanaluokkaa, sama aikamuoto, jne).
- **aukkotehtava**: lause jossa täsmälleen yksi aukko, hyväksytyt vastaukset
  pre-generoitu (PR #2:n logiikka käytössä).
- **kaannos**: FI-lause käännetään täysin opitulla tasolla. Lyhyt 4-8 sanaa.
- **yhdistaminen**: 4 sanaparia (espanja-suomi tai suomi-espanja).
- **lauseen_muodostus**: 3-4 sanaa annettu, käyttäjä muodostaa lauseen.

### 3. Validoi backend AI-vastaus

`lib/lessonContext.js` tai `lib/exerciseGenerate.js`: kun AI palauttaa
test-lessonin, validoi tyyppi-jakauma. Jos lopputulos ei tyydytä prosenttijakaumaa
(toleranssi ± 1 kysymys), retry kerran. Jos retry epäonnistuu, hyväksy mutta
kirjoita varoitus lokeihin.

### 4. Regenerointi-skripti olemassa olevien testien päivittämiseen

Tiedosto: `scripts/regenerate-course-exams.mjs`:

```js
// Lukee curriculum_lessons-taulun, suodattaa type='test', käy läpi
// jokaisen kielen × kurssin, generoi uudet tehtävät uudella promptilla,
// kirjoittaa lesson_items-taulua (delete + insert tai update).
//
// Argumentit: --lang=es|fr|de|all (default all), --kurssi=1..8|all,
// --dry-run (tulosta vain, älä kirjoita).
```

Aja kerran: `npm run regen:exams -- --lang=all --kurssi=all`. Aika: ~5 min,
~$5 OpenAI-kuluja koko kannan päivitykseen.

### 5. Verifiointi

Test:
- `tests/lesson-test-mix.test.js` — vitest: anna AI:n palauttaa N tehtävää,
  varmista että tyyppi-jakauma on toleranssin sisällä.
- `tests/e2e-course-exam-mix.spec.js` — Playwright: kirjaudu, mene kurssi 1
  kertaustestiin, varmista että näkyy vähintään 3 eri tehtävätyyppiä.

### 6. Sw + bundle

- Bump `sw.js`
- `npm run build`
- Commit, PR, merge

## Hyväksymiskriteerit

- [ ] Päivitetty prompt pakottaa tyyppi-jakauman
- [ ] Backend retryaa kerran jos jakauma ei kohtaa
- [ ] Regenerointi-skripti aja olemassa olevien testien päälle
- [ ] Vitest + e2e vihreät
- [ ] Toimii es/fr/de × kurssit 1-8

## Tiedostot

| Polku | Mitä |
|---|---|
| `lib/lessonContext.js` | Päivitä `curriculumTestInstruction` |
| `lib/exerciseGenerate.js` | Lisää tyyppi-jakauma-validointi + retry |
| `scripts/regenerate-course-exams.mjs` | Uusi yhden kerran skripti |
| `package.json` | Lisää `"regen:exams"` script |
| `tests/lesson-test-mix.test.js`, `tests/e2e-course-exam-mix.spec.js` | Testit |

## Riskit

- **AI:n kyvyttömyys jakaumaa kohden**: jos AI itsepäisesti generoi 80% MCQ,
  retry-logic ei auta. Toissijainen ratkaisu: serveri jakaa generoinnin
  TYYPPI per kerta (generoi 5 MCQ, sitten 4 aukkotehtävää, jne). Hitaampaa
  mutta varmaa.
- **Olemassa olevien testien rikkominen**: regenerointiskripti pitää voida
  rollback. Lisää `--snapshot`-flagi joka kirjoittaa current state JSONiin
  ennen päivitystä.
- **Kustannukset**: 32 testiä × 15 kysymystä × 200 tokeni = 96 000 tokenia ≈
  $2. Hyväksyttävä, mutta dry-run pakollinen ensin.

## Riippuvuus PR #2:sta

Käännös-itemit testissä tarvitsevat `accepted_translations`-listan jotta
PR #2:n hybridi-validointi toimii. Aja PR #3:n seed-skripti VASTA kun PR #2
on mergattu ja `translation_accepted`-taulu on olemassa.
