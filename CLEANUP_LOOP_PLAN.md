# Cleanup-loop — suunnitelma + perustelut

## Pitäisikö tehdä? Kyllä — mutta tietyin ehdoin.

Repossa on selkeitä siivouskohteita:
- LemonSqueezy-koodi 5:ssa tiedostossa, vaikka käyttäjä on päättänyt poistaa LemonSqueezyn
- 14 esiintymää LEGACY/TODO/FIXME/DEPRECATED 10 tiedostossa
- `app.js` 2431 riviä — vanha monoliitti
- Bundlauksen (P2 UPDATE 1+2) jälkeen tulee uusia legacyä: yksittäiset CSS- ja JS-tiedostot ovat enää lähde-tiedostoja, eivät tuotantokäytössä — siivous voi mennä siellä rajussa loppuun

## Milloin: vasta P2:n jälkeen, ei aikaisemmin

**Syy:** P0+P1+P2 muuttavat koodia merkittävästi. Jos siivoat ennen niitä:
- P2:n bundlaus saattaa jättää poistettuja moduleita orpoiksi → siivota ne uudestaan
- P0:n exam-fix lisää uutta koodia → joudut siivoamaan vanhan rinnalle uutta
- Refaktorointi on aina helpompi tehdä **shipatun** koodin päälle, ei "menossa olevaan" koodiin

**Lisäksi:** käyttäjä ei näe siivouksen hyötyjä suoraan (token-säästö on Claude Coden eduksi, ei loppukäyttäjän). Käyttäjälle näkyvät P0+P1+P2-fixit kannattaa shipata ensin että saadaan retentio-vaikutusta.

## Mitä siivota — kolme luokkaa

### Luokka A: Turvallinen (poista koska tiedetään ettei käytetä)

- **LemonSqueezy-koodi** — käyttäjä on päättänyt että tilauspoluksi tulee Stripe (joka on jo dormantissa)
  - `routes/stripe.js`-tiedostosta nimi vaihdettava (jos Stripe on tarkoitettu live:ksi) ja LemonSqueezy-haara pois
  - `js/screens/writing.js`, `routes/config.js`, `server.js`, `tests/routes-smoke.test.js` — tarkista ja poista
- **Mahdolliset orvot tiedostot** P2-bundlauksen jälkeen — ei applicable ennen P2:n shipausta
- **Käyttämättömät imports** — `unimport`-tyyppiset linterit löytävät automatisoidusti
- **Käyttämättömät CSS-luokat** — `purgecss` tai vastaava analysointi
- **Console.log-jämät** debuggauksesta

### Luokka B: Harkinnan vaativa (selvitä ennen poistoa)

- **`AGENT_PROMPT_LPLAN1.md` ... `LPLAN8.md`** — historiallinen aineisto. Voiko arkistoida `archive/`-kansioon? **Älä poista** — ne ovat audit-trailia mitä on tehty.
- **TODO-/FIXME-rivit** — osa voi olla yhä validia, osa unohtunut. Lue jokainen, päätä erikseen.
- **`app.js` 2431 riviä** — jos kaikki on käytössä, ei kannata refaktoroida vain siistimisen takia. Mutta jos osa on legacy-koodia jota ei kutsuta, poisto kannattaa.
- **Vanhat L-PLAN-loop-tehtävät**: esim. v1-onboarding kun v2 on default. Onko v1 yhä saatavilla feature-flagin takana? Voiko poistaa?

### Luokka C: Älä koske

- **Onboarding-flowt v1+v2** — molemmat saattavat olla yhä käytössä eri segmenteille
- **Legacy-screen-kommentit `<!-- LEGACY ... -->`** STANDARDS-säännön mukaan poistetaan vasta myöhemmissä loopeissa
- **Tests/-kansio** — älä poista testejä siivouksen nimissä
- **node_modules + lock-tiedostot** — eivät kuulu manuaaliseen siivoukseen
- **Migration-historia** Supabasessa — ÄLÄ kosketa
- **OpenAI-prompt-tiedostot** — vaikka ne näyttävät isoilta, ne ovat tuotantokriittisiä

## Token-säästö-näkökulma

Käyttäjä mainitsee "token-säästö". Realistinen vaikutus:
- Claude Coden context window: jos repo on 2 MB, koko reposlot luetaan ehkä kerran. Siivous säästää sen lukemisen.
- **Suurin token-säästö ei tule koodin pituudesta vaan koodin selkeydestä.** Jos `app.js` on monoliitti 2431-rivinen, agentit lukevat sen kokonaan vaikka tarvitsisivat 50 rivin osasta. Pilkkominen moduleiksi on iso voitto.
- Bundlaaminen (P2) ei vähennä Claude Coden context-kulutusta — bundle on tuotantotiedosto, ei lähde

→ **Suosittelen:** ÄLÄ optimoi tokeneja itsessään. Optimoi koodin **modulaarisuus**. Sivuvaikutuksena agentit pärjäävät paremmin.

## Loop-rakenne — ehdotus

### `L-CLEANUP-1` — Dead code + LemonSqueezy

Skoppi:
1. **LemonSqueezy-poisto:** kaikki 5 tiedostoa, koodi pois, kommentit ympärilleen jos jotain piti perua (ALWAYS arkistoi git-historiassa, ei rikko)
2. **Käyttämättömät imports:** lisää `eslint --rule no-unused-vars` jos ei vielä, korjaa kaikki
3. **Console.log-jämät:** grep + manuaalinen läpikäynti, poista debug-logit, säilytä legitiimit (`logger.info`, `logger.error`)
4. **TODO-/FIXME-rivit:** 14 esiintymää, lue jokainen, päätä:
   - Onko valmiina toteutettu? → poista TODO
   - Onko yhä validi? → muuta GitHub Issueksi
   - Onko unohtunut? → tee tai poista
5. **CSS-purge:** aja `purgecss` `app.html`:n + `index.html`:n kanssa, poista käyttämättömät selectorit (varovasti — jotkin ovat dynaamisesti lisättyjä JS:llä)

Verify:
- `npm test` 1067/1067 pass
- Lighthouse perf-numerot eivät huonone
- Manuaalitesti: kaikki sivut toimivat, kaikki tehtävätyypit avautuvat

### `L-CLEANUP-2` — `app.js`-pilkkominen (jos ja vain jos tarpeen)

**Tämä on iso loop, ei pieni siivous.** 2431-rivinen monoliitti pilkotaan moduleiksi. Vaarallinen — voi rikkoa kaiken.

Skoppi:
1. Lue `app.js` läpi, mappaa toiminnallisuus moduleiksi
2. Pilko se erillisiin tiedostoihin `js/features/`-kansion alle
3. P2:n bundlaus tekee niistä yhden bundlen — ei siis vaikuta käyttäjän kokemukseen
4. Verify, verify, verify — manuaalitesti **kaikilla** sivuilla, kaikilla tehtävätyypeillä, Pro+Free-tunnuksilla

**Päätös:** Tee tämä **vain** jos joku Claude Code -istunto kärsii merkittävästi siitä että `app.js` on niin iso. Jos ei, lykkää myöhempään.

### `L-CLEANUP-3` — Arkistoi historiallinen aineisto

Skoppi:
- Siirrä `AGENT_PROMPT_LPLAN1..8.md` → `archive/agent-prompts/`
- Siirrä `AGENT_PROMPT_HOTFIX_*.md` → `archive/hotfixes/`
- Siirrä `AGENT_PROMPT_SECURITY1.md` ja `SECURITY2.md` → `archive/security/`
- **Pidä paikallaan:** `AGENT_PROMPT_STANDARDS.md`, viimeisin live-audit-loop, `AGENT_PROMPT_LIVE_AUDIT_*.md`
- Pidä `AGENT_STATE.md` ja `IMPROVEMENTS.md` ennallaan — niiden historia on käyttöä
- Päivitä STANDARDS:n viittaukset jos joku rikkoutuu

Verify:
- `git log` toimii, ei rikku
- Claude Code löytää STANDARDS:n samasta paikasta kuin ennen
- Käyttäjä löytää historian arkistosta jos tarvitsee

## Ajoitus — suositus

```
NYT
 ├─ aja L-LIVE-AUDIT-P0 → testaa tuotannossa
 ├─ aja L-LIVE-AUDIT-P1 → testaa tuotannossa
 ├─ aja L-LIVE-AUDIT-P2 osissa → mittaa
 │
 └─ tämän jälkeen:
    ├─ L-CLEANUP-1 (dead code + LemonSqueezy) — pakollinen
    ├─ L-CLEANUP-3 (arkistoi vanhat promptit) — pieni, helppo
    └─ L-CLEANUP-2 (app.js-pilkkominen) — vain jos perustelu löytyy
```

## Mitä tämän jälkeen?

Jos siivous on tehty hyvin:
- Repon koko pienenee 10-30%
- Claude Code -istunnoissa on selkeämpi konteksti
- LemonSqueezy ei ole nipistämässä päätöksiä koodissa
- Pienempi todennäköisyys että vanhat bugit ilmestyvät uudelleen

Jos siivous tehdään huonosti:
- Joku poistettu funktio jota tarvittiin → tuotanto rikki
- Tärkeä TODO unohtui → bugi jäi
- L-PLAN-historia hävisi → ei tiedetä miksi joku päätös tehtiin
- Käyttäjälle näkymättömiä regressioita

Siksi: **siivous on aina riskinotto**, ei "ilmainen voitto". Tee se vasta kun koodi on stabiili (P0+P1+P2 valmiina ja tuotannossa toimivina).
