# L-V390 — KRIITTINEN: "Päivitä Pro" Pro-tilille + Oppimispolku väärä kieli & valehteleva progress

**Numero:** käytä seuraavaa vapaata L-VXXX jos viety. **PRIORITEETTI: jonon kärki.** Kaksi tuotantobugia: toinen rikkoo monetisaation luottamuksen, toinen on data-integriteetti + cross-kieli-vuoto.

**Skill-stack:** `superpowers:systematic-debugging` (juurisyy ensin, ei band-aid) + BACKEND (`supabase`, `supabase-postgres-best-practices`) bugille A + FRONTEND-M (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) profiilivalikolle + TESTING-M (`webapp-testing`).

**Rooli:** writer. Molemmat näyttävät **L-V388-regressioilta** (app-design-kopiointi exportista). Käytä graphify-grafia cross-module-jäljitykseen ennen raakaa grep-luuppia.

---

## Toistotapa (Marcel, 2026-06-04, puhelin, tili `testpro123@gmail.com` = TEST_PRO)

1. Kirjautuneena test-pro-tilillä → avaa profiilivalikko (avatar oikealla ylhäällä) → valikossa lukee **"Päivitä Pro"**, vaikka tili ON jo Pro.
2. Paina **Oppimispolku** → app heittää **SAKSAN** oppimispolulle (ei espanjan), ja näyttää saksan kurssit/oppitunnit **suoritettuna** (esim. 1.1 "Suoritettu"), vaikka käyttäjä on suorittanut vain **espanjan Kurssi 1**:n.

## Bug A — "Päivitä Pro" näkyy Pro-käyttäjälle

**Hypoteesi:** V388:ssa rakennettu uusi profiilivalikko ei lue käyttäjän Pro-statusta — "Päivitä Pro" -rivi renderöidään ehdoitta. Pro-käyttäjälle upgrade-CTA on väärin ja nakertaa luottamusta (maksoi jo).

**Korjaus:**
- Lue Pro-status oikeasta lähteestä (sama jota `middleware/auth.js` `isPro`/`requirePro` käyttää; TEST_PRO_EMAILS-env kattaa `testpro123` — varmista että frontend saa tämän esim. `/me`/session-datasta).
- **Pro-käyttäjälle:** piilota "Päivitä Pro" kokonaan (tai korvaa neutraalilla "Pro aktiivinen" -merkinnällä, ei klikattava upsell). Free-käyttäjälle CTA jää.
- Tarkista ettei muita Pro-gate-kohtia rikkoutunut samasta syystä (esim. ominaisuuslukot näyttävät väärin).
- Älä syytä cachea (`feedback_common_frustrations`) — debuggaa oikea isPro-polku.

## Bug B — Oppimispolku: väärä kieli + valehteleva suoritustila

**Hypoteesi 1 (todennäköisin, data):** V388 kopioi exportin (`docs/design-ref/app-export/Kurssi.jsx`, `Oppimispolku.jsx`) **kovakoodatut placeholder-tilat** (`Kurssi.jsx`: oppitunti 1.1 `state:'done'`, 1.2 `'active'`; `Oppimispolku.jsx`: kurssi 1 `active`, 2–8 lukittu) sen sijaan että wiraisi oikean per-kieli-progressin. Tulos: mikä tahansa kieli näyttää 1.1 suoritettuna ja kurssi 1 aktiivisena riippumatta todellisesta datasta → "saksan kurssit suoritettu" vaikkei ole. **V388-brief sanoi eksplisiittisesti "data meidän puolelta, exportin sisältö on placeholder" — tämä kohta on toteuttamatta.**

**Hypoteesi 2 (kieli):** Oppimispolku avautuu saksaan eikä käyttäjän aktiiviseen kieleen (espanja). Aktiivisen kielen luku/oletus on väärä — joko kova oletus, väärä state-lähde, tai kielen normalisointi pettää (`normalizeLang` es↔spanish, `project_progress_language_scoping`).

**Korjaus:**
- **Suoritustilat oikeasta datasta per kieli:** kurssin/oppitunnin `done`/`active`/`upcoming`/`locked` luetaan käyttäjän todellisesta progressista valitulle kielelle (`exercise_logs`/`user_level_progress`/vastaava, kielellä skoupattuna — ks. L-V339 `project_progress_language_scoping`). EI kovakoodattuja exportin esimerkkitiloja. Käyttäjä joka on tehnyt vain espanjan kurssi 1: saksan polun pitää näyttää 0 suoritettua.
- **Oikea kieli:** Oppimispolku avautuu käyttäjän aktiiviseen/valittuun kieleen, ei saksaan. Selvitä mistä aktiivinen kieli tulee ja korjaa oletus/luenta. Varmista kaikki kolme kieltä (ES/FR/DE, `project_target_languages_multi`) toimivat — vaihtaminen näyttää oikean polun + oikean per-kieli-progressin.
- **Ei cross-kieli-vuotoa:** espanjan suoritukset eivät saa näkyä saksan/ranskan polulla eivätkä päinvastoin. Tämä on toinen kerta kun kieli-progress-vuoto raportoidaan (L-V339 oli ensimmäinen) — jos juurisyy on rakenteellinen, korjaa rakenne älä band-aid (`feedback_three_strikes_redesign`).

## Constraintit
- Juurisyy ensin (`systematic-debugging`), ei oirelaastaria. Todenna korjaus OMILLA TOOLEILLA (Playwright/Bash) ennen "valmis" (`verification-before-completion`, `feedback_user_does_not_code`).
- Supabase-muutokset MCP:n kautta jos tarvitaan (`apply_migration`), ei SQL käyttäjälle.
- `npm run build` + sw CACHE_VERSION jos STATIC_ASSETS muuttuu.

## Acceptance criteria
- Test-pro-tilillä profiilivalikossa EI "Päivitä Pro" -upsellia (Pro tunnistetaan oikein); free-tilillä CTA näkyy.
- Oppimispolku avautuu käyttäjän aktiiviseen kieleen (espanja kun espanja valittu), ei saksaan.
- Suoritustilat vastaavat todellista per-kieli-progressia: vain espanjan kurssi 1 tehnyt → saksan/ranskan polku näyttää 0 suoritettua, espanja näyttää oikean.
- Ei cross-kieli-progress-vuotoa kumpaankaan suuntaan.
- Playwright-spec todentaa: (a) Pro-tilin valikko ilman upsellia, (b) kielenvaihto näyttää oikean polun + progressin, (c) ei kovakoodattua "1.1 suoritettu".
- Toistettu Marcelin polku puhelinkoolla (390) — bugit poissa.

## Out of scope
- Oppimispolku/kurssinäkymän visuaalinen design (V388, pysyy) — tämä korjaa vain datan + kielen + Pro-statuksen, ei ulkoasua.
