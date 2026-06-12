# L-V366 — App-bugit batch: Käännä lauseet kuollut, väärä routing, sidebar-active

**Päivä:** 2026-06-03
**Prioriteetti:** P0 (APP-01 = kokonainen tehtävätyyppi rikki) + P1 (kaksi muuta)
**Rooli:** writer (Claude Code)
**Skill-stack:** BACKEND + FRONTEND-M + TESTING-M → `supabase`, `supabase-postgres-best-practices`, `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`

> Kolme app-puolen bugia, kaikki "jokin on rikki" -tyyppiä → yksi sessio. Lähde: L-V365-audit + Marcelin oma testaus 2026-06-03.

---

## Tausta

L-V365-audit + Marcel löysivät kolme app-puolen vikaa. Kaikki ovat rakenteellisia (routing / render / state), eivät kosmeettisia. Korjaa juuri, älä band-aidia.

## Tehtävät

### BUG-1 (P0) · Käännä lauseet täysin rikki · `#/lauseet`
**Oire:** Tehtävä ei lataa yhtään lausetta. UI renderöi literaalin `[object Object]` punaisessa laatikossa, hyppää suoraan "VALMIS · 0 / 0 oikein", ja `POST /api/exercises/reorder` palauttaa **404** (konsoli-virhe joka latauksella, molemmat tilit + leveydet).
**Juuren etsintä:** `routes/exercises.js` — onko `/api/exercises/reorder`-endpoint olemassa vai onko polku väärä (esim. eri nimi tai puuttuva mount)? Client-puolella sentence-build-renderöijä tulostaa objektin `[object Object]`:na = se yrittää näyttää objektia stringinä. Korjaa molemmat: (1) toimiva endpoint joka palauttaa lauseet, (2) client renderöi lauseen tekstin oikein.
**Acceptance:** `#/lauseet` lataa ≥1 lauseen, ei `[object Object]`, ei 404-konsolissa, tehtävän voi suorittaa loppuun oikealla pistemäärällä (ei "0 / 0").

### BUG-2 (P1) · `#/sanasto` ja `#/puheoppi` renderöivät Asetukset-näkymän
**Oire:** Suora navigointi tai sivun uudelleenlataus näihin hasheihin näyttää Asetukset-näkymän (keltainen Asetukset-pill aktivoituu), ei sanasto-/kielioppinäkymää. Hash-router (`js/main.js`) ei käsittele näitä reittejä → fall-through Asetuksiin. Reitit ovat oppilaan tavoitettavissa: `js/screens/curriculum.js` + `js/screens/lessonResults.js` asettavat nämä hashit `history.replaceState`-kutsulla oppitunnin sisällä → jos oppilas päivittää sivun kesken tehtävän, hän putoaa Asetuksiin.
**Korjaus:** Lisää router-käsittely näille legacy-hasheille → ohjaa Tehtäviin/Oppimispolkuun (tai oikeaan mode-sivuun), ei Asetuksiin.
**Acceptance:** `#/sanasto` ja `#/puheoppi` (suora lataus) eivät enää näytä Asetuksia.

### BUG-3 (P1) · Sidebar active-state ei päivity navigoinnissa
**Oire:** Kun painaa sidebarista **Tehtävät**, näkymä vaihtuu oikein mutta sidebar korostaa yhä **Koti** (keltainen pill). Aktiivinen nav-tila ei seuraa todellista reittiä. (Marcel, kuvat 9 + 10.)
**Korjaus:** Sidebarin aktiivinen pill pitää johtaa nykyisestä reitistä, ei klikkauksesta. Päivitä active-luokka route-changen yhteydessä.
**Acceptance:** Mille tahansa nav-kohteelle navigoidessa (Koti/Tehtävät/Profiili) korostuu täsmälleen se kohde joka on auki, myös suoralla hash-latauksella.

## Verify (pakollinen ennen valmista)
- Playwright: aja `#/lauseet`, `#/sanasto`, `#/puheoppi` molemmilla tileillä → ei konsoli-virheitä, oikeat näkymät.
- Sidebar-active: navigoi Tehtäviin, assertoi että Tehtävät-pill on aktiivinen eikä Koti.
- `npm run build` + `node --check` muutetuille js-tiedostoille. Vitest vihreä.

## Ulkopuolella
Visuaalinen slop (kortit, tyhjä tila) → eri brief (V370). Tämä on pelkkä bugikorjaus.
