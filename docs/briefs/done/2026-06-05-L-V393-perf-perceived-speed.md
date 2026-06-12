# L-V393 — Koettu nopeus: mittaus → skeletonit + caching + optimistinen rendering + memory

**Rooli:** WRITER. **Riippuvuus: aja V392 (data-eheys) ensin tai rinnan, mutta optimistinen rendering vasta KUN V392 on todistanut että kirjoitukset tallentuvat oikein.** Älä renderöi optimistisesti dataa joka sitten kaatuu tallennuksessa.

**Skill-stack (kutsu Skill-toolilla ENNEN ensimmäistä Write/Edit/Bash):**
`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend` (FRONTEND-L), `webapp-testing` (mittaus + verifiointi). Jos koskee palvelinpuolen caching-reittejä (Express/Supabase) → lisää `supabase`, `supabase-postgres-best-practices`. Jos muutat suomi-microcopya (esim. skeleton-saatetekstit) → `humanizer`.

---

## Konteksti

Marcel alkaa itse käyttää sivustoa espanjan lukemiseen ~kk:n päästä, 2 kuukautta. Hän kokee sivun **hitaaksi** ja haluaa parhaan kokemuksen itselleen testikanina. Neljä toivetta: (1) ei loading-spinnerei → skeletonit kaikkialle, (2) enemmän cachingia, (3) optimistinen rendering, (4) memory kuntoon + nopeampi sivu.

**DIAGNOOSI LUKITTU (Marcel tarkensi 2026-06-05):** pullonkaula on **navigaatio, ei OpenAI.** Tehtävägenerointi (OpenAI-kutsut) on "yllättävän hyvä" — älä koske siihen. Hitaus tulee siitä että **kirjautumisen jälkeen jokainen screen-avaus (aloitusruutu app-puolella, ja muut sivut) hakee datan uudelleen joka kerta.** SPA on screen-switch vanilla JS; jos jokainen screen fetchaa oman datansa joka avauksella ilman client-cachea, kymmenen sivun availu = kymmenen edestakaista palvelinhakua. **Tämä on THE ongelma ja caching + instant-render-from-cache on THE lääke.**

**Mittauksen rooli on siis kapea:** ÄLÄ etsi onko ongelma olemassa (tiedämme että on) — **vahvista mitkä screenit re-fetchaavat joka avauksella ja kauanko kukin kestää**, jotta osaat priorisoida ja todistaa parannuksen. Aloita app-puolen **aloitusruudusta** — se on Marcelin konkreettinen esimerkki ja ensimmäinen kohde.

---

## Vaihe 1 — MITTAUS (tuottaa `docs/briefs/L-V393-PERF-BASELINE.md`, pysäytä ja näytä Marcelille)

Mittaa kovilla luvuilla, ei fiiliksellä. **Pääfokus: screen-navigaatio kirjautuneena.**
- **Screen-avausaika joka screenille:** kirjaudu, avaa jokainen app-screen (aloitusruutu, tehtävät, oppimispolku, kurssidetalji, profiili, digikirja) ja mittaa avaus → interaktiivinen. **Avaa sama screen toisen kerran ja mittaa uudestaan** — jos toinen avaus on yhtä hidas, screen re-fetchaa ilman cachea (= juuri tämä bugi). Merkitse jokaiselle: fetchaako joka avauksella vai onko cache.
- **Mikä fetch blokkaa kunkin screenin:** verkkoloki per screen-avaus — montako pyyntöä, mille reiteille, kauanko. Aloitusruutu ensin.
- **Palvelin-TTFB + DB-kyselyaika** noille screen-fetcheille: Supabase `get_logs` / `execute_sql` + `EXPLAIN ANALYZE`. Etsi N+1.
- **Bundle-koko:** `app.bundle.js` + chunkit (toissijainen jos navigaatio on pääsyy).
- **Memory:** heap-snapshotit 15–20 min session yli (login → useita screen-vaihtoja → tehtäviä). Monotoninen kasvu = vuoto. Screen-switch-SPA:n tyyppisyy: event-listenerit / timerit joita ei siivota screen-teardownissa.

**Output:** taulukko "screen → 1. avaus → 2. avaus → fetchaako joka kerta → pullonkaula → lääke". Tämä todistaa re-fetch-ongelman ja ohjaa Vaihe 2:n.

---

## Vaihe 2 — KORJAUKSET (impaktin mukaan, mittaus edellä)

### 0. Screen-cache + instant render + prefetch — PÄÄKORJAUS (tähän hitaus oikeasti tiivistyy)
- **Client-side data-cache**, avaimena screen + user + kieli. Kun screen avataan uudelleen, **renderöi heti cachesta** ja revalidoi taustalla (stale-while-revalidate). Ensimmäinen avaus saa hakea; toinen avaus on välitön.
- **Älä re-fetchaa muuttumatonta dataa screen-vaihdossa.** Esim. aloitusruudun dashboard-data, taso, kurssilista, oppimispolku — pidä muistissa session ajan, mitätöi vain kun data oikeasti muuttuu (käyttäjä teki tehtävän → invalidoi dashboard-cache).
- **Prefetch:** kun käyttäjä on kirjautunut / aloitusruudulla, hae taustalla todennäköiset seuraavat screenit (tehtävät, oppimispolku) valmiiksi cacheen, jotta niiden avaus on välitön.
- **Älä riko per-kieli-skooppausta:** cache-avaimessa on kieli, jottei espanjan dashboard näytä ranskan dataa (vrt. V392 progress-language-scoping).
- Aloita **aloitusruudusta** (Marcelin esimerkki), laajenna sitten muihin screeneihin.

### A. Skeletonit (saa alkaa heti, ei riipu mittauksesta)
- Ensimmäisellä avauksella (ennen kuin cachea on) näytä **skeleton**, ei spinneri. Cachesta renderöinti on välitön → skeleton näkyy vain aidosti tuoreella haulla.
- Inventoi JOKAINEN loading-tila appissa. Marcelin lukittu sääntö: **ei "Ladataan…" italicilla, ei spinnerei, ei em-dash-placeholdereita** → skeleton joka matchaa lopullisen sisällön layoutin.
- Skeleton = sisällön muotoinen harmaa hahmo (kortit, rivit, tekstilohkot), ei pyörivä spinneri. Reduce layout shift: skeletonin koko = oikean sisällön koko.
- Kata: dashboard-lataus, tehtävän lataus, kurssilista, oppimispolku, profiili, digikirja-sivut.

### B. Caching (vain mittauksen osoittamiin pullonkauloihin)
- **Staattinen / harvoin muuttuva data → cachea kovaa:** curriculum (`curriculum_kurssit` 8 riviä, `curriculum_lessons` 90), teaching_pages, translation_accepted. Nämä eivät muutu session aikana → client-side in-memory + HTTP-cache-headerit.
- **Käyttäjäkohtainen mutta luettu usein:** dashboard-aggregaatit, taso. Harkitse SWR-tyyppinen (näytä cache heti, revalidoi taustalla).
- **Palvelin:** `ai_cache`-taulu on jo olemassa AI-vastauksille — varmista että sitä oikeasti hyödynnetään generate-reitillä. HTTP cache-control staattisille asseteille.
- **`sw.js`:** jos muutat cachetusta / STATIC_ASSETS-listaa → **BUMP CACHE_VERSION** (Marcelin lukittu sääntö, muuten SW ei päivity).

### C. Optimistinen rendering (VASTA V392-oikeellisuuden jälkeen)
- Käyttäjän kirjoitustoimet (merkitse lesson tehdyksi, vastaa tehtävään, tallenna edistyminen): renderöi muutos heti UI:hin, lähetä DB-kirjoitus taustalla, **reconcile vastauksella, rollback + näkyvä virhe jos epäonnistuu.**
- EI optimistista renderöintiä asioille joiden oikeellisuutta V392 ei ole vahvistanut — muuten näytät dataa joka katoaa.

### D. Memory / nopeus
- Korjaa Vaihe 1:n löytämät vuodot: siivoa event-listenerit + timerit screen-vaihdossa, vapauta isot objektit, varmistettu cleanup SPA-screen-teardownissa.
- Poista turha re-render / turha DB-haku navigaatiossa (jos screen hakee saman datan joka vaihdossa → cache B:stä).

---

## Acceptance criteria (konkreettiset, ennen/jälkeen-luvuin)

- [ ] `L-V393-PERF-BASELINE.md`: mitatut nykyluvut + pullonkaula per polku.
- [ ] **Yksikään loading-spinneri tai "Ladataan…" ei jää appiin** — skeleton kaikkialla (Playwright-inventaario todistaa).
- [ ] **Screenin toinen avaus on käytännössä välitön** (renderöi cachesta, ei uutta blokkaavaa fetchiä) — Playwright + verkkoloki todistaa: 1. avaus hakee, 2. avaus ei. Aloitusruutu + vähintään 3 muuta screeniä.
- [ ] Aloitusruudun avausaika parani mitattavasti vs baseline; kirjaa ennen/jälkeen-luku.
- [ ] Curriculum/staattinen data ei hae DB:tä uudelleen samassa sessiossa (verkkoloki todistaa cache-osuman).
- [ ] Prefetch: aloitusruudulta todennäköiset seuraavat screenit latautuvat välittömästi ensiavauksellakin (cache valmiina).
- [ ] Cache-invalidointi toimii: tehtävän teon jälkeen dashboard näyttää päivittyneen edistymisen (ei vanhaa cachea).
- [ ] Optimistinen rendering ainakin kirjoitus-toimille (lesson-done, exercise-answer); rollback toimii kun pakotat 500-virheen.
- [ ] Memory: 20 min session yli heap ei kasva monotonisesti (snapshot-todiste); ennen/jälkeen luvut.
- [ ] `npm run build` ajettu, chunkit staged; `sw.js` CACHE_VERSION bumpattu jos STATIC_ASSETS muuttui.
- [ ] `npm test` vihreä, muokatut js-tiedostot `node --check` läpi.
- [ ] IMPROVEMENTS.md +1 rivi.

## Push-rajat
- Tämä on käyttäjälle näkyvää (skeletonit, nopeus) → **pushataan Verceliin** kun valmis ja `npm run build` ajettu. Baseline-/audit-tiedostot eivät yksinään pushia laukaise.
- AI-slop-check: skeletonit eivät saa olla geneerisiä pulssikortteja jotka rikkovat Marcelin tyylin — matchaa lopullinen layout, lämmin paletti, ei mono-uppercase-placeholdereita.
- Älä koske V392:n korjaamiin RLS/data-asioihin; jos osut DB-oikeellisuusbugiin → kirjaa V392-AUDIT-FINDINGS:iin, älä korjaa täällä.
