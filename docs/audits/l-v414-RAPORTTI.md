# L-V414 — Tehtäväsisällön lopputarkastus, Vaihe 0 + rakenne-P0:t (raportti)

Päivä: 2026-06-13 · Ajaja: Claude Code (Opus, orkesteroija) · Scope-päätös: korjaa 96
rakenne-P0:aa nyt, semanttinen vastausavain-pass (Vaihe 1) erikseen.

## Tulos lyhyesti

| | Ennen | Jälkeen |
|---|---|---|
| Validaattori P0 | 2052 | **0** |
| Validaattori P1 | 483 | 41 |
| Validaattori P2 | 9 | 9 (em-dashit, ennestään) |
| Tarkistettu | 307 tiedostoa, 16 326 itemiä | sama |
| gap_fill: aukot == answer-solut | ei | **4201 / 4201** |

Tokeneja paloi: ~0 LLM-tokenia (kaikki koneellista + Opus-päättelyä; ei subagentteja).

## Iso löytö: briefin oletus oli väärä

Briefi piti 925 gap_fill `___`-hälytystä "validaattorin skeemavarianssina, siedä se".
Todellisuus: **frontti (digikirja.js:707 + lessonRunner.js:551) parsii vain `{N}`-aukkoja**
(`replace(/\{(\d+)\}/g)`). `___`-templatet renderöityivät ilman yhtään input-kenttää →
889 saksan/ranskan gap-fill oli **rikki tuotannossa** (oppilas näki alaviivat, ei voinut
vastata). Ei kohinaa vaan aito P0-pankki.

## Korjattu (kaikki mekaanista tai Opus-päättelyä, todennettu)

**Frontissa rikki olleet (broken-in-prod):**
- **889 gap_fill `___` → `{N}`** — 780 suora konversio + 109 saksan Perfekt jossa
  `[[a,b]]` → `[[a],[b]]` (apuverbi + partisiippi eri aukkoihin).
- **38 saksan weird-gap** uudelleenjäsennetty (Konjunktiv II / Plusquamperfekt /
  refleksiiviverbit): aukot = answer-solut, klusterit ("begonnen hätte") yhteen aukkoon,
  vaihtoehtoiset partisiipit samaan soluun. de/kurssi_3,4,5,6,8.
- **3 match-itemiä** (`{fr/de,fi}` → `{left,right}`, 12 paria) — frontti luki `p.left`=undefined
  → tyhjä renderöinti. fr/kurssi_6/l12, fr/kurssi_8/l10, de/kurssi_8/l10.

**Aidot sisältödefektit (kielitajulla):**
- **41 mc-duplikaattivaihtoehtoa** — sama valinta toistui (mm. de/kurssi_4/l4 jossa KAIKKI
  neljä oli "arbeitete"). Korvattu selvästi-väärällä distraktorilla; oikea vastaus ei muuttunut.
- **12 gap `{N}`-answer-count-mismatch** — 11 modaali+infinitiivi split `[[a,b]]`→`[[a],[b]]`,
  1 template `{1}…{1}`→`{1}…{2}`.
- **2 match-duplikaatti-left** — es: toinen "Me gustan"→"Me encantan"; fr-artikkeli: swap
  substantiivi vasemmalle (uniikit), artikkeli oikealle.
- **1 vastausavainvirhe** — de/kurssi_6/l5 von-Dativ-phase: "durch" (ei edes sanapankissa)
  → "von der" (feminiini Regierung, kuten muut itemit).

**Tahalliset, EI korjattu (validaattori opetettu sietämään):**
- 3 mc "case-only" -distraktoria (française/Française, finlandaise/Finlandaise, Sie/sie) —
  testaavat isoa/pientä kirjainta → mc-dup-tarkistus tehty case-sensitiiviseksi.

## Validaattori kovetettu (skeemavarianssit dokumentoitu kommenteissa)

P0 2052→0 ei johtunut pelkästä sisällöstä; ~1900 oli validaattorin valehälytystä. Korjattu:
- gap_fill: `{N}` on kanoninen (frontin totuus); `___` konvertoitu pois.
- diagnostic: `answer`-kenttä (ei vain `correct`/`correct_index`).
- reading: `true_false` (statement+bool), `short_answer` (acceptedAnswers), lesson-item `reading_mc`.
- structure.json: kirjain-`correct` (A–D) ei enää "?"-hälytystä.
- sentence-build: monisanainen vastaus + sanapankki-palaset ei laukaise "bank ei sisällä".
- mc-dup + match: case-sensitiivinen vertailu.

## Lykätty semanttiseen passiin (Vaihe 1)

- **Suositeltu korjaus, korkea varmuus:** fr/kurssi_6/lesson_7 `p1-recognition-mc-laukaisijat2#11`
  ("J'ai peur que les glaciers ne ___ trop vite"): avain osoittaa `fonde` (yks.), mutta
  *les glaciers* (mon.) → oikea on `fondent`. Itemin oma selitys myöntää tämän ("fondent est
  aussi le subjonctif"). Avaimen muutos = semanttisen passin scope, ei korjattu tässä.
- **Latentti datahaju:** ranskan oppituntien `vocab[]` käyttää paikoin `es`-kieliavainta
  (`{"es":"la COP21","fi":…}` fr-lessonissa). Ei renderöinti-P0, mutta selvitettävä erikseen.

## P1-jäännös (41, ei massakorjattu — Marcel päättää)

Pääosin "match: duplikaatti right-puoli (monitulkintainen)" + "phase ilman itemejä
(flashcards)" + "mc: explanation puuttuu". Lista: `docs/audits/l-v414-validator-findings.json`.

## Verifiointi

- `node scripts/validate-content.mjs` → P0=0.
- Kaikki 4201 gap_fill: aukot == answer-solut, ei tyhjiä soluja.
- git-diff täysin tasapainoinen (1008+/1008−, ei reformatointia; max 80 riviä/tiedosto).
- `npm test`: tests/item-bank.test.js läpäisee yksin 10/10. Täyden suiten ajossa se flakaa
  (42 s, timeout-raja kuormassa) — lukee vain muuttumatonta `item-bank.json`:ää, ei minun.
