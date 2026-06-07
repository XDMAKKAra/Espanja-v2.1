# L-V399 — Koko koodikannan siivous ylläpidettävyyttä varten (behavior-preserving)

**Rooli:** WRITER. Iso, monivaiheinen refaktori. Marcel valitsi eksplisiittisesti **täyden lakaisun** (ei audit-first, ei pelkät kipupisteet) tietäen regressioriskin. Tehtäväsi: tee se **niin turvallisesti kuin täysi refaktori voi olla.**

**Skill-stack (kutsu ENNEN ensimmäistä Write/Edit/Bash):** `webapp-testing`,`. CSS/komponenttirakenteen refaktoriin → `ui-ux-pro-max `design-taste-frontend`. Backend/RLS-rakenteeseen → `supabase`, `.

---

## RAUTA-SÄÄNNÖT (älä riko näitä kertaakaan)

1. **Käyttäytyminen EI muutu. Vain rakenne, nimet, dedup, organisointi.** Jos havaitset bugin, älä korjaa sitä tässä — kirjaa erilliseen listaan. Refaktori ja bugikorjaus eivät sekoitu (muuten et tiedä kumpi rikkoi mitä).
2. **Et refaktoroi koodia jolla ei ole testikatetta.** Ennen kuin koskeet moduuliin: varmista että regressioverkko kattaa sen. Jos ei → kirjoita characterization-testi (lukitsee nykykäyttäytymisen) ENNEN refaktoria. Jos testin kirjoittaminen on liian kallista/riskialtista → **kirjaa DEFERRED, älä refaktoroi sokkona.**
3. **Pieni, verifioitu, peruutettava askel.** Per alue oma commit. Regressioverkko vihreänä JOKAISEN commitin jälkeen. Punainen testi = peru commit, älä jatka päälle.
4. **Regressioverkko = `verify-backbone.mjs` + `verify-isolation.mjs` + `npm test` (vitest) + `verify-clickthrough.mjs`.** Aja koko setti vaiheiden välissä. Lisää screenshot-vertailu avainnäytöille (landing, aloitusruutu, tehtävä, oppimispolku, kartoitus, pricing) → pikselidiffi todistaa ettei visuaali muuttunut.
5. **Jos compute loppuu kesken:** valmiit vaiheet ovat jo merkattu + vihreät = turvallisia. Jätä keskeneräinen vaihe committaamatta. Koodikanta saa olla parempi, EI koskaan huonompi/puolivalmis.

---

## Vaihe 0 — KARTOITA (ei muutoksia, tuottaa `docs/briefs/L-V399-CLEANUP-MAP.md`)

Käytä **graphify**ä (`graphify-out/GRAPH_REPORT.md`, `graphify query/explain`) + tiedostokokoskannaus. Tunnista evidenssipohjaisesti:
- **God-tiedostot** (suurimmat js/css — esim. app.js-perilliset, app-old-spain.css) ja mitä ne tekevät.
- **Duplikoitu logiikka** (esim. `normalizeLang`, grading-normalisointi, fetch-patternit toistuvat).
- **Kilpailevat patternit** (useampi tapa tehdä sama: state-hallinta, screen-switch, data-fetch, RLS-client-käyttö).
- **CSS-cascade-riskit** (`app-old-spain.css`-remapit, `!important`-sodat, kilpailevat stylesheetit — dokumentoitu menneiden bugien lähde, L-V388).
- **Testikate-aukot** (mitkä moduulit eivät ole minkään testin alla → näille characterization-testi ennen refaktoria).
- **Epäjohdonmukaiset konventiot** (nimeäminen, tiedostorakenne, virhekäsittely).

**Pysähdy ja näytä kartta Marcelille** ennen Vaihe 1:tä — hän voi uudelleenpriorisoida.

---

## Vaihe 1+ — REFAKTOROI (prioriteettijärjestys, kukin oma commit-sarja + regressio)

Järjestys impaktin mukaan (suurin ylläpito-friktio ensin):

1. **CSS-cascade-konsolidointi** (korkein arvo — toistuva bugilähde). Yhtenäistä `app-old-spain.css`-remapit ja kilpailevat stylesheetit yhdeksi token/layer-systeemiksi. Poista `!important`-sodat oikealla spesifisyys-/layer-rakenteella (CSS `@layer`). **Pikselidiffi todistaa: visuaali identtinen.**
2. **State / screen-switch -hallinta.** Yksi pattern screen-vaihdolle ja tilalle (ei kolmea kilpailevaa). Säilytä toiminta, yhdistä mekanismi.
3. **JS-moduulien organisointi.** Pilko god-tiedostot vastuun mukaan (yksi tiedosto = yksi vastuu). Yhtenäistä nimeäminen/konventiot. (Kuollut koodi siivottu jo V396 — verifioi.)
4. **Backend-reitit.** Yhtenäistä patternit: RLS-client-käyttö (`req.supabase` V392:sta uniformiksi), virhekäsittely, vastausmuodot. Dedup toistuva logiikka.
5. **Jaetut utilit / vakiot.** Yksi totuuslähde toistuvalle logiikalle (normalizeLang, grading-normalisointi, kielilistat).
6. **Konventiot-dokumentti** (tämä tekee tulevaisuudesta ylläpidettävän): kirjoita lyhyt `CONVENTIONS.md` (tai päivitä CLAUDE.md-osio): tiedostorakenne, nimeäminen, miten lisätään uusi screen/reitti/tehtävä, CSS-layer-säännöt. Tämä on se mikä estää uusien kilpailevien patternien synnyn.

---

## Acceptance criteria
- [ ] `L-V399-CLEANUP-MAP.md`: evidenssipohjainen kartta (god-tiedostot, duplikaatit, kilpailevat patternit, testikate-aukot).
- [ ] Jokainen refaktoroitu moduuli oli testikatteen alla ENNEN muutosta (tai sai characterization-testin); kattamattomat = DEFERRED-listalla, ei sokkorefaktoroitu.
- [ ] Regressioverkko (backbone + isolation + vitest + clickthrough) **vihreä jokaisen vaiheen jälkeen**, ei vain lopuksi.
- [ ] Pikselidiffi avainnäytöille: ei tahatonta visuaalista muutosta (CSS-konsolidointi näkymätön käyttäjälle).
- [ ] 0 käyttäytymismuutosta: löydetyt bugit kirjattu erilliseen listaan, EI korjattu tässä.
- [ ] `CONVENTIONS.md` (tai CLAUDE.md-osio) kirjoitettu → uusi screen/reitti/tehtävä lisätään yhdellä dokumentoidulla tavalla.
- [ ] `!important`-sotien määrä laskenut mitattavasti (grep ennen/jälkeen); CSS-layer-rakenne käytössä.
- [ ] `npm run build` + `sw.js` CACHE_VERSION bump; `node --check` muokatuille.
- [ ] IMPROVEMENTS.md +1 rivi; DEFERRED-lista (kattamattomat moduulit + löydetyt bugit) kirjattu.

## Push-rajat
- Behavior-preserving refaktori on käytännössä Claude-internal (käyttäjä ei näe muutosta) — MUTTA build-output (bundle) muuttuu, joten **push OK** kun koko regressio + pikselidiffi vihreä. CSS-konsolidointi koskee tuotantoa → varmista pikselidiffi ennen pushia.
- Ei uusia featureita, ei bugikorjauksia (paitsi jos refaktori paljastaa että nykyinen "toiminta" oli jo rikki → kirjaa, kysy).
- 3. strike samasta cascade-bugista → rakenne uusiksi (juuri tätä tämä loop tekee).
```
SCOPE-REALISMI: tämä on iso ja deadline tiukka (Max ~9 pv). Vaiheet ovat itsenäisiä — tee niin monta kuin ehdit prioriteettijärjestyksessä, jätä loput kartoitettuna DEFERRED-listalle. CSS-konsolidointi (1) ja konventiot (6) ovat suurin pitkän aikavälin hyöty jos joudut valitsemaan.
```
