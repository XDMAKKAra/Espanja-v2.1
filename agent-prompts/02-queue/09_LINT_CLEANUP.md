# L-LINT-CLEANUP — korjaa CI:tä rikkovat 10 ESLint-erroria

> Lue ENSIN: `AGENT_PROMPT_STANDARDS.md` ja `AGENT_STATE.md`. Loop-merkintä `AGENT_STATE.md`:hen on max 7 riviä (STANDARDS §7).
>
> **Tausta:** CI on ollut rikki ainakin PR #21:stä lähtien. Käyttäjä saa sähköposti-spämmiä jokaisesta CI failista. Tuotanto toimii (Vercel ei aja ESLintiä), mutta CI workflow runs failaa joka pushilla. Tämä loop **ei tee UI-muutoksia eikä koske featureihin** — vain korjaa lint-errorit jotta CI menee vihreäksi.

---

## 1. Tarkka virhelista ja juurisyyt

Aja `npm run lint` paikallisesti ja saat tämän:

```
js/features/teachingPanel.js
  223:4  error  Parsing error: Unexpected token

js/main.js
  748:36  error  Parsing error: Unexpected token

js/screens/curriculum.js
  568:7  error  Parsing error: Unexpected token

js/screens/dashboard.js
  1462:66   error  'escapeHtmlAttr' is not defined        no-undef
  1462:110  error  'escapeHtmlAttr' is not defined        no-undef
  1465:16   error  'readinessQualitative' is not defined  no-undef

js/screens/lessonRunner.js
  118:17  error  'renderSimpleMd' is not defined  no-undef
  249:18  error  'shuffle' is not defined         no-undef
  629:9   error  'renderSimpleMd' is not defined  no-undef

tests/desktop-widths.test.js
  80:5  error  Parsing error: Unexpected token

✖ 10 errors
```

### Parsing errorit (4 kpl)

Nämä eivät ole aitoja syntaksivirheitä — `node --check <tiedosto>` menee läpi. Syy on todennäköisesti ESLint-config (`eslint.config.js`) joka ei käsittele optional chaining / await-ilmaisuja oikein joissain konteksteissa, TAI tiedostossa on näkymätön merkki (BOM, NBSP) parsing-virheen lähellä.

**Toimenpide:**
1. Käytä `node --check <tiedosto>` jokaiselle 4 tiedostolle — varmista että ne todella ovat valideja JS-tiedostoja
2. Jos node parseaa ne ok mutta ESLint ei → tarkista parsing-error-rivin **ympäriltä** näkymättömät merkit (`hexdump -C` tai `cat -v`). NBSP, ZWSP, BOM ja vastaavat tunnetusti rikkovat ESLintin
3. Jos ei näkymättömiä merkkejä → tarkista `eslint.config.js` `languageOptions.parserOptions` — tarvitaanko `allowAwaitOutsideFunction: true` tai vastaava
4. Korjaa minimaalisesti — älä refaktoroi koodia, vain poista merkki tai lisää parser-flagi

### no-undef errorit (6 kpl)

Kolme funktiota on poistettu jossain aiemmassa loopissa, mutta niiden kutsut jäi koodiin:

**`js/screens/dashboard.js`:**
- r1462: `escapeHtmlAttr(c.tooltip)` × 2
- r1465: `readinessQualitative(map.readinessPct, map.totalCells)` (tai vastaava)

→ Etsi nämä funktiot. Ovatko ne jo määritelty samassa tiedostossa muualla? Jos ovat, niiden import/declaration on rikkoutunut. Jos eivät, määrittele ne paikallisesti tai importaa oikeasta paikasta.

**`js/screens/lessonRunner.js`:**
- r118: `renderSimpleMd(...)` 
- r249: `shuffle(...)`
- r629: `renderSimpleMd(...)`

→ Sama analyysi: missä funktiot on määritelty? Lisää puuttuva `import` -lause tiedoston yläosaan. Todennäköisin sijainti:
- `renderSimpleMd` — `lib/markdown.js` tai `js/lib/markdown.js`
- `shuffle` — `lib/utils.js` tai `js/lib/utils.js`

Jos funktiota ei löydy mistään → tarkista git log siitä mistä funktio poistettiin (`git log -S "function shuffle"`) ja palauta se tai korvaa inline-toteutuksella.

---

## 2. Mitä EI tehdä

- ÄLÄ skippaa errorita lisäämällä `// eslint-disable-next-line` -kommentteja paitsi viimeisenä keinona ja vain jos perustelet IMPROVEMENTS.md:ssä miksi
- ÄLÄ refaktoroi yhtäkään funktiota tai komponenttia
- ÄLÄ koske UI:hin, CSS:ään, tai HTML:ään
- ÄLÄ koske dependencyihin (`package.json`)
- ÄLÄ päivitä ESLintin versiota
- ÄLÄ koske CI-workflow-tiedostoon (`.github/workflows/ci.yml`) — ongelma on koodissa, ei CI:n configissa
- ÄLÄ käsittele warningit (101 kpl) — vain errorit (10 kpl) kaatavat CI:n. Warningit voi siivota erillisessä loopissa.

---

## 3. Toteutusjärjestys

### UPDATE 1 — Aja `npm run lint` ja kirjaa tarkka virhelista
Vahvista että lokaali näyttää saman tilan kuin CI. Jos errori-määrä eroaa, raportoi ja pysähdy.

### UPDATE 2 — Korjaa parsing errorit (4 tiedostoa)
Käsittele yksi kerrallaan: teachingPanel.js, main.js, curriculum.js, desktop-widths.test.js.

Workflow per tiedosto:
1. `node --check <tiedosto>` — onko aito syntaksivirhe?
2. Jos ei, tarkista parsing-error-rivin ympäristö näkymättömiltä merkeiltä
3. Jos ei mitään → harkitse ESLint-config-korjausta (`allowAwaitOutsideFunction`, `ecmaFeatures.globalReturn` tms)
4. Aja `npm run lint <tiedosto>` jokaisen korjauksen jälkeen — varmista että tämä error katosi

### UPDATE 3 — Korjaa no-undef errorit
Käsittele yksi tiedosto kerrallaan: dashboard.js (3 erroria), lessonRunner.js (3 erroria).

Per puuttuva funktio:
1. `grep -rn "function <funktioNimi>\|export.*<funktioNimi>\|<funktioNimi> =" js/ lib/` — löytyykö
2. Jos löytyy → lisää `import { <funktioNimi> } from "<polku>";` käyttävän tiedoston yläosaan
3. Jos ei löydy → `git log --all -S "<funktioNimi>" --oneline | head -10` selvittää milloin poistettiin
4. Päätös: palauta funktio (jos vielä tarpeellinen) tai poista kutsu (jos koodi ei enää tarvitse sitä)

### UPDATE 4 — Verifioi täydellisesti
1. `npm run lint` → 0 errors (warningit ok jättää, mutta kirjaa määrä)
2. `npm test` → 1064/1064 ✓ (varmista että korjaukset eivät rikkoneet testejä)
3. `npm run build` clean
4. Aja paikallisesti palvelinta (`npm run dev`), avaa selaimessa, klikkaa läpi:
   - Etusivu (screen-path) renderöityy, kurssikortit näkyvät, "Miten Puheo toimii" nappi toimii, YO-valmius näyttää lukeman
   - Avaa oppitunti — lessonRunner ei kaadu (koska siellä korjattiin renderSimpleMd + shuffle)
   - Avaa dashboard tutoriaalin kautta jos mahdollista
5. Jos jokin breikkaa runtime:ssa → palauta korjaus ja keksi parempi tapa

### UPDATE 5 — Loop-päättäminen
- AGENT_STATE.md +1 rivi (max 7) loop-merkintä
- IMPROVEMENTS.md +1 rivi
- Ei SW-bumppia (STATIC_ASSETS ei muutu)
- Commit-viesti: `chore(lint): fix 10 errors blocking CI [L-LINT-CLEANUP]`
- PR-otsikko: sama

---

## 4. Verifiointi-checklist

- [ ] `npm run lint` 0 errors (warningit ok, mutta kirjaa määrä commit-viestiin)
- [ ] `npm test` 1064/1064 ✓
- [ ] `npm run build` clean
- [ ] Manuaalinen smoke-testi paikallisesti: etusivu, oppitunti, dashboard-tutoriaali
- [ ] Ei `eslint-disable` -kommentteja paitsi perusteltuina IMPROVEMENTS.md-rivissä
- [ ] AGENT_STATE.md päivitetty (max 7 riviä)
- [ ] IMPROVEMENTS.md päivitetty
- [ ] Ei SW-bumppia
- [ ] Ei UI-, CSS-, HTML-muutoksia
- [ ] Ei dependency-muutoksia

---

## 5. Pending / käyttäjälle

`IMPROVEMENTS.md`-rivissä mainitse:
- Warningit (101 kpl) jäävät — voidaan siivota erillisessä loopissa kun aikataulu sallii. Eivät kaada CI:tä, mutta peittävät uusia errorita "noisen" alle.
- Jos parsing erroreilla oli juurisyynä näkymätön merkki → kannattaa lisätä editorin .editorconfig-sääntö joka estää NBSP/ZWSP-merkit jatkossa.


---
## Lopuksi
Tämä on **09 / 12** jonossa (`agent-prompts/02-queue/09_LINT_CLEANUP.md`).
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
