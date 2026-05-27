# BRIEF: L-V332 — Live writing demo landingilla (Council Expansionist + Marcel "iha kova")

**Päivä:** 2026-05-27
**Triggeri:** Council 2026-05-27 Expansionist-advisor ehdotti: "What if the mobile hero IS the product, not an ad for it? Drop a 15-second writing task right in the hero. Input field. They type. AI grades it instantly with one specific YTL-style feedback line." Marcel reagoi "iha kova".
**Status:** **Design-spec ensin, ei ship-brief.** Tämä on uusi feature jolla on abuse-vector, API-kustannus, ja UX-vaikutus. Vaatii arkkitehti-päätökset ennen koodausta.
**Edellytys:** L-V329 (reorder + hero polish) ja L-V331 (slop sweep) mielellään ensin → puhdas pohja. Ei pakollinen.

---

## Mitä rakennetaan, korkealla tasolla

Landing-sivulle Proof-sektion **jälkeen** (uusi sektio §3 V329-reorderin jälkeen) tai Proof:in **sisään** integroituna:

1. Kieli-valitsin (es/fr/de tab tai pill-row)
2. Pikku-prompt: "Kirjoita yksi lause espanjaksi siitä, mitä teit kesälomalla."
3. Tekstikenttä 80-200 merkkiä, char-counter
4. "Arvostele kirjoitukseni" -nappi
5. Klikkaus → spinner ~2-4s → AI-arviointi inline:
   - 1-3 spesifistä virhe-mainintaa YTL-tyyliin
   - Pikku-pistemäärä (esim. "12/18 viestinnällisyys")
   - "Tämä on yksi näyte. Saat täyden arvioinnin Free-tilillä."
6. Result-tila gate:taa CTA:n "Aloita ilmaiseksi" + optional email-capture

Tämä on **demo, ei full Free-tier-replacement.** Yksi arvio per IP / per päivä, rate-limited. Free-tilillä saa rajattomasti.

---

## Kriittiset päätökset

### Päätös 1: Mihin sijoitetaan?

**Vaihtoehto A:** Oma sektio §2 (heti heron jälkeen, ennen Proofia)
- Pro: maksimi konversio-vaikutus, käyttäjä kokee tuotteen heti
- Con: jos demo-API epäonnistuu (timeout/error), kriittinen flow rikki

**Vaihtoehto B:** Proof-sektion sisällä, polished essay -näytteen alapuolella
- Pro: kontekstuaalinen (käyttäjä juuri näki esimerkin, nyt kokeile itse)
- Con: lisää Proof:n korkeutta

**Vaihtoehto C:** Oma sektio §3 (Proof:in jälkeen)
- Pro: arvo-rakentaminen ensin (Proof näyttää että toimii), sitten "kokeile itse"
- Con: alempana foldissa, vähemmän klikkauksia

Suositus: **C.** Council First Principles + Outsider sanoivat että Proof on tärkein selling moment. Säilytä Proof-fokus, lisää demo sen jatkoksi.

### Päätös 2: Auth-malli (= abuse-vector)

OpenAI gpt-4o-mini per pyyntö = ~$0.001-0.005. Jos joku ajaa 10 000 demoa = $10-50. Pieni mutta ei mitätön.

**Vaihtoehdot:**

A) **IP-pohjainen rate-limit:** 1 demo / IP / 24h, ei kirjautumista. Helpoin, mutta IP:t huijataan helposti.

B) **localStorage-flag:** "olen jo kokeillut" pidetään selaimessa, ei serverside-tarkistusta. Triviaa kiertää (incognito), mutta poistaa rehelliset toistot.

C) **CAPTCHA gate:** hCaptcha tai Cloudflare Turnstile ennen API-kutsua. Lisää friktiona, mutta pysäyttää botit.

D) **Email gate:** käyttäjä antaa emailin → saa demo-näytteen → email kerätään marketing-listalle. Tämä yhdistää Marcelin alkuperäinen "lead-magnet" -idea.

Suositus: **A + B combined.** IP-rate-limit `routes/writing.js`:ään (käytä `middleware/rateLimit.js`-pattern joka on jo olemassa), localStorage UI:ssa. Yksi demo per laite per päivä. Jos käyttäjä haluaa lisää → "Aloita ilmaiseksi" -CTA.

**Älä toteuta D ensimmäisessä versiossa.** Email-gate ennen demoa muuttaa pseudo-trial:in lead-magneetiksi (Mafy-suunta), mikä menee vastaan competitor-research:n suositukseen. Kokeile A+B ensin, jos abuse osoittautuu ongelmaksi → siirry D:hen.

### Päätös 3: API-endpoint

Käytetäänkö olemassaolevaa `routes/writing.js POST /grade` vai uusi endpoint?

- **Re-use:** olemassaoleva endpoint vaatii auth-middlewaren (`requireAuth`). Demo on anonyymi → ei toimi suoraan.
- **Uusi `POST /api/writing/demo-grade`:** anonyymi, rate-limited, käyttää samaa OpenAI-promptia kuin grade-endpoint mutta palauttaa supistetun result-payloadin (ei kaikkia YTL-pisteitä, vain 1 viestinnällisyys + 1-3 spesifistä virhettä).

Suositus: **Uusi endpoint** `POST /api/writing/demo-grade` `routes/writing.js`-tiedoston sisällä, ennen `requireAuth`-middlewarea. Rate-limit `demoGradeLimiter` middleware.

### Päätös 4: Prompt-suunnitelma

Demo on käyttäjän ensikosketus. Promptin pitää olla:
- Riittävän vaikea että AI:n arviointi on uskottava (vältä "Mitä kuuluu?" tason kysymyksiä)
- Riittävän helppo että lukiolainen saa kirjoitettua jotain 60 sekunnissa
- Sama prompt per kieli ESPANJAKSI/RANSKAKSI/SAKSAKSI

Ehdotus per kieli:

- **es:** "Kirjoita 1-3 lausetta espanjaksi: kerro mitä teit viime kesälomalla."
- **fr:** "Kirjoita 1-3 lausetta ranskaksi: kerro mitä teit viime kesälomalla."
- **de:** "Kirjoita 1-3 lausetta saksaksi: kerro mitä teit viime kesälomalla."

Yksinkertainen, sama kaikilla, mahdollistaa varianssia preteriti/imperfekti -aiheessa joka on YO-tyypillinen.

### Päätös 5: Result-UX

Kun käyttäjä on saanut arvion, mitä CTA seuraa?

- (a) "Aloita ilmaiseksi täydellä arvioinnilla" → /app.html#rekisteroidy
- (b) "Saat lisää tällaisia harjoituksia Free-tilillä" → /app.html#rekisteroidy
- (c) "Sähköposti ja saat YO-vinkit + täysarvioinnin" → email + redirect → /app.html

Suositus: **(a).** Suora, ei email-gate, sama CTA-teksti kuin heron primary. Käyttäjä ei tunne että hänet ohjataan ovela:n.

---

## Mitä writer tekee (Phase 1: design-spec → toteutus tulee Phase 2:ssa)

### Phase 1 — Spec & decision

1. Lue tämä brief
2. Tutki olemassaolevat assetit:
   - `routes/writing.js` (grade-endpoint olemassa olevassa muodossa)
   - `middleware/rateLimit.js` (rate-limit-pattern)
   - `lib/openai.js` (OpenAI-wrapper)
   - Olemassaoleva writing-grade-prompt
3. Päätä Päätökset 1-5 yhdessä Marcelin kanssa (kirjoita suositukset ja perustelut briefin loppuun)
4. Kirjoita implementation plan: tiedostot, endpoint-rakenne, UI-komponentti, CSS-tarpeet
5. Estimoi: tunnit + API-budjetti (esim. "100 demoa/päivä × $0.003 = $0.30/päivä = $9/kk")

Tallenna design-spec `docs/superpowers/specs/2026-05-27-live-writing-demo-design.md`. Marcel hyväksyy → siirry Phase 2:hen.

### Phase 2 — Toteutus (vasta kun design-spec hyväksytty)

Backend:
- `routes/writing.js`: lisää `POST /api/writing/demo-grade` endpoint (anonyymi, rate-limited)
- `middleware/rateLimit.js`: lisää `demoGradeLimiter` jos ei jo olemassa (esim. 1 req / IP / 24h)
- OpenAI-prompt: demo-versio joka palauttaa supistetun arvion (1 spesifinen virhe + 1 pistemäärä)

Frontend:
- HTML: uusi sektio (sijoituspäätös A/B/C) tekstikentällä + napilla + result-tilalla
- CSS: `css/landing-editorial.css` -tiedostoon stylet (matchaa nykyinen brand)
- JS: uusi tiedosto `js/landing-writing-demo.js` joka:
   - Hoitaa lang-switch:n
   - localStorage-flag (already-tried)
   - fetch `POST /api/writing/demo-grade`
   - Renderöi result inline ilman page-reloadia
   - Click "Aloita ilmaiseksi" → `/app.html#rekisteroidy`

Verify:
- Playwright-spec testaa demo-flow:n end-to-end (input → result → CTA)
- Rate-limit testaus: 2. yritys per IP samana päivänä → 429
- API-budjetti monitoring: lisää loki-rivi `routes/writing.js`:ään demo-pyyntöjen lukumäärälle / päivä

---

## Acceptance criteria (lopullinen Phase 2:n jälkeen)

1. Landing-sivulla on demo-sektio joka kerää tekstin ja palauttaa AI-arvioinnin
2. Anonyymi käyttäjä (ei kirjautunut) voi käyttää sen
3. Rate-limit: 1 demo / IP / 24h (palauta selkeä virheilmoitus jos rajoitettu)
4. Result-näkymässä CTA "Aloita ilmaiseksi" johtaa app:in rekisteröitymis-näkymään
5. localStorage-flag estää saman selaimen toistot
6. API-kustannus monitoroidaan logissa
7. `npm run test:bug-scan` 38/38 PASS
8. Uusi e2e-spec `tests/e2e-demo-flow.spec.js` testaa happy-path:in
9. Mobile + desktop versiot toimivat

---

## Out-of-scope

- **Full AI-tutoring landingilla** — vain yksi demo per käyttäjä, ei opetussessio
- **Save user's writing samples** — anonyymi data ei talletu DB:hen (vain logi-rivi rate-limittiä varten)
- **Email-capture demo-flow:n osana** — eri päätös, eri loop jos myöhemmin halutaan
- **Multi-prompt** demot — yksi sama prompt per kieli, ei valikoimaa
- **GPT-4o (full)** — käytä gpt-4o-mini kustannussyistä
- **Re-tries / "Yritä uudelleen"** — yksi yritys per käyttäjä per päivä, ei retry-loop

---

## Skill-stack writerille

Phase 1 (design-spec):
- `superpowers:brainstorming`
- `superpowers:writing-plans`

Phase 2 (toteutus = FRONTEND-M + BACKEND):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`
- `claude-api` tai vastaava (jos OpenAI-prompt-suunnittelua)
- `supabase` (jos rate-limit Supabase-pohjainen)
- `webapp-testing`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`
- `humanizer` (käyttäjälle näkyvät tekstit: prompt, result-viestit, virheet)

Total: 2-3 skilliä Phase 1:ssä, 7-8 Phase 2:ssa.

---

## Päätös-rekap

Council Expansionist-advisor näki tämän strategisena ace:na: "this works on demand" -hetki ennen mitä-tahansa-pyyntöä konvertoi paremmin kuin staattinen brand-promise. Marcel reagoi "iha kova".

Riskit (mietittävät Phase 1:ssä):
1. Abuse-vector (rate-limit ratkaisee)
2. API-cost (rate-limit + monitoring)
3. Slow API → bad first impression (timeout-fallback)
4. False positive: AI ei aina löydä virhettä jossa selvä virhe on (prompt-tuning)

Realistinen scope: Phase 1 = 1-2h spec. Phase 2 = 4-8h toteutus + verify.

Tämä ei ole tämän iltapäivän ship. Tämä on viikon investointi.
