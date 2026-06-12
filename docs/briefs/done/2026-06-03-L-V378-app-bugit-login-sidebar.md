# L-V378 — App-bugit: kirjautumisnäkymä app-shellin sisällä + sidebar-active (3. strike)

**Päivä:** 2026-06-03
**Prioriteetti:** P0 (login rikki) + P1 (sidebar, 3. strike)
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-M + TESTING-M → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`
**Malli:** **Opus** (sidebar = 3. strike → rakenteellinen korjaus, ei band-aid).
**Huom:** app-puolen bugikorjaus, erillään Tailwind-migraatiosta.

---

## BUG-1 (P0) · Kirjautumisnäkymä renderöi app-shellin sisällä
**Oire:** Kirjautumissivu näyttää KIRJAUTUNEEN app-sidebarin (Koti/Tehtävät/Profiili korostuksineen + "Kirjaudu ulos" + "Asetukset") samalla kun esittää login-lomaketta. Kirjautumaton näkymä ei saa näyttää app-shellia eikä "Kirjaudu ulos"-linkkiä. (Marcel, kuva.)
**Korjaus:** Login/rekisteröinti-näkymä omaan puhtaaseen layoutiinsa ILMAN app-sidebaria. Selvitä miksi shell renderöityy (näkymänvaihto-logiikka näyttää sidebarin ennen auth-tilan tarkistusta?). Korjaa niin että kirjautumaton näkee vain login-pinnan (markkinointi-split + lomake), kirjautunut näkee app-shellin.
**Acceptance:** kirjautumissivulla ei sidebaria, ei "Kirjaudu ulos". Kirjautumisen jälkeen shell ilmestyy normaalisti.

## BUG-2 (P1, 3. STRIKE) · Sidebar active-state ei seuraa reittiä
**Oire:** Paina Tehtävät → mene takaisin Kotiin → **Tehtävät jää keltaiseksi** (sekä Koti että Tehtävät korostettuna). Aktiivinen pill ei seuraa todellista näkymää. Tämä raportoitiin jo (piti korjata V366 BUG-3) → **3. strike → ÄLÄ band-aidaa, korjaa rakenne.**
**Rakenteellinen korjaus:** aktiivinen tila pitää johtaa YHDESTÄ totuuslähteestä (nykyinen reitti/näkymä), ei klikkaus-eventistä joka lisää luokan. Jokaisella näkymänvaihdolla: nollaa kaikki active-luokat, aseta active vain nykyiselle. Tarkista että kaikki reitit (myös ohjelmalliset `replaceState`-vaihdot) kulkevat saman active-päivityksen kautta.
**Acceptance:** mille tahansa navigoidessa korostuu TÄSMÄLLEEN yksi kohde = nykyinen näkymä. Testaa: Koti→Tehtävät→Koti→Profiili, joka vaiheessa vain yksi pill aktiivinen. Playwright-assertio.

## Verify
- `node --check` muutetuille js/screens/*. Playwright molemmille bugeille (login ilman sidebaria; sidebar-active joka vaiheessa).
- ÄLÄ pushaa/committaa.

## Ulkopuolella
Dashboard-sisältö (V377). Tailwind. Tämä on pelkkä bugikorjaus.
