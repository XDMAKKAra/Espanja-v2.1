# L-V360 — P0: Appi rikki (HTTP 405) — YO-koe-simulaatio + kirjoitustehtävä eivät lataa

**Päivä:** 2026-06-03
**Prioriteetti:** P0 — kirjautuneen appi ei toimi lainkaan. Tämä ennen kaikkea muuta.
**Rooli:** writer (Claude Code)
**Skill-stack:** TESTING-M (toisto + bug-scan) + BACKEND → `webapp-testing`, `supabase`, `supabase-postgres-best-practices`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`. (Jos korjaus koskee myös virhetilan UI:ta → lisää `design-taste-frontend`.)

---

## Oireet (havaittu espanja-v2-1.vercel.app, käyttäjä kirjautuneena "TE")

1. **YO-koe-simulaatio:** "Jokin meni pieleen — Lataus epäonnistui. **Resume tarkistus epäonnistui (HTTP 405)**" + "Yritä uudelleen".
2. **Kirjoitustehtävä:** "Lataus epäonnistui. Yritä hetken päästä uudelleen." (sama perhe, todennäköisesti sama juurisyy.)
3. Käyttäjä on kirjautunut (avatar näkyy), joten kyse ei ole 401:stä vaan **405 Method Not Allowed**.

## Vahva hypoteesi (vahvista, älä luota sokeasti)

405 = polku löytyy mutta metodi on väärä. `routes/exam.js`:ssä on **vain** `POST /resume` (`router.post("/resume", requireAuth, …)`, rivi ~309). Jos frontendin "resume tarkistus" tekee **GET**-kutsun `/api/exam/resume`-polkuun, Express palauttaa 405 (polku on, GET ei sallittu). Sama logiikka voi koskea kirjoitustehtävän latausta (`POST /api/writing/writing-task`, rivi ~119).

Toinen tarkistettava: `vercel.json` rewrite `{ "source": "/api/(.*)", "destination": "/api" }` ja `api/index.js`-reititys — varmista että alipolku (`/exam/resume`) säilyy funktiolle eikä litisty `/api`:ksi. (L-V356 lisäsi abikurssi-rewritejä samaan tiedostoon — tarkista ettei järjestys riko `/api`-reititystä, vaikka `/api/(.*)` onkin listan ensimmäinen.)

## Tehtävä (systematic-debugging)

1. **Toista bugi** (webapp-testing / Playwright tai suora curl) kirjautuneena: YO-koe-simulaation avaus + kirjoitustehtävän avaus.
2. **Kaappaa tarkka tieto** epäonnistuvista kutsuista: HTTP-metodi, täysi polku, status, response body. Älä arvaa — lue Network/serverlog.
3. **Paikanna juurisyy:** metodi-mismatch (FE GET vs BE POST), reititys (vercel.json/api/index.js), vai jokin muu. Vahvista hypoteesi datalla.
4. **Korjaa juurisyy**, ei oiretta. Jos FE kutsuu väärää metodia → korjaa FE-kutsu TAI lisää BE:hen oikea metodi sen mukaan kumpi on oikea kontrakti. Jos reititys → korjaa vercel.json/api-entry.
5. **Three-strikes-tarkistus:** jos tämä on saman bugin toistuva ilmentymä (resume/lataus on hajonnut ennenkin), älä laita band-aidia — katso onko exam/writing-latauksen rakenne kunnossa.

## Liittyvät tiedostot

- `routes/exam.js` (POST /resume ~309), `routes/writing.js` (POST /writing-task ~119, POST /grade-writing ~219)
- `api/index.js` (serverless-entry), `vercel.json` (rewrites)
- Frontend-kutsujat: YO-koe-simulaation screen + kirjoitustehtävä-screen (etsi `exam/resume` ja `writing-task` fetch-kutsut), `js/features/miniYO.js`
- `middleware/auth.js` (requireAuth — varmista ettei tämä palauta 405:tä)

## Acceptance criteria

- Kirjautuneena YO-koe-simulaatio avautuu ja resume-tarkistus onnistuu (ei 405).
- Kirjoitustehtävä latautuu ja on tehtävissä (ei "Lataus epäonnistui").
- Juurisyy dokumentoitu commit-viestiin (mikä metodi/polku oli väärä).
- Ei regressiota muihin /api-reitteihin (testaa pari muuta POST-reittiä).

## Verify (writer tekee, EI käyttäjä)

- Playwright e2e kirjautuneella testitunnuksella (.env): avaa YO-koe-simulaatio → resume OK; avaa kirjoitustehtävä → latautuu. 390px + desktop.
- Curl/log-todiste että aiemmin 405:n palauttanut kutsu palauttaa nyt 2xx.
- Pushaa mainiin (näkyvä korjaus).

## Huom

Tämä on testideployn (espanja-v2-1.vercel.app) oire — varmista korjautuuko myös tuotannossa vai onko kyse vain preview-ympäristön reitityksestä/env:stä. Jos tuotanto on eri tilassa, kerro kummassa bugi on.
