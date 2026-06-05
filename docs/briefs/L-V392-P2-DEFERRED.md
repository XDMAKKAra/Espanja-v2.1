# L-V392 — P2 decisions & deferrals

Päivitetty 2026-06-05 FIX-vaiheen aikana. Tämä kattaa P2-löydösten päätökset.

## P2-1 — Leaked-password-protection: EI KORJATTAVISSA (premium)
HaveIBeenPwned-tarkistus (Supabase Auth) vaatii **Supabase Pro -planin**. Nykyplanilla sitä ei voi ottaa käyttöön → ei ACTION-REQUIRED, ei korjattavissa nyt. Otetaan käyttöön jos/kun projekti siirtyy Pro-planiin. (Advisor näyttää tämän WARNina niin kauan — odotettu.)

## P2-2 — translation_accepted SELECT `qual=true`: PÄÄTÖS = PIDÄ (tarkoituksellinen)
`translation_accepted` on **jaettu käännösmuisti** (community + AI-grader -hyväksytyt käännökset). `read=true` kaikille authenticatedille on suunnittelun ydin: pointti on että hyväksytyt käännökset kierrätetään käyttäjien kesken (sama task → sama hyväksytty vastaus). `user_id` on UUID (ei PII, ei email/nimi). Ei muutosta. Jos myöhemmin halutaan piilottaa contributor-UUID, ratkaisu on `security_invoker`-view ilman user_id-saraketta — ei tarpeen nyt.

## P2-4 — ~18 käyttämätöntä indeksiä: PÄÄTÖS = PIDÄ (paitsi yksi legacy-kandidaatti)
Käytiin läpi per indeksi. **Valtaosa on skaalaa varten suunniteltuja `*_user_lang_created`-komposiitti-indeksejä** (exercise_logs, user_mistakes, exam_sessions, diagnostic_results jne.). Ne näkyvät "käyttämättöminä" vain koska tuotannossa on ~2 käyttäjää ja pikkutaulut ajetaan seq-scanilla. **Datan kasvaessa ne ovat juuri ne indeksit joita tarvitaan** — pudottaminen + uudelleenluonti olisi turhaa churnia ja regressioriski skaalassa. Kirjoitusamplifikaatio per indeksi on mitätön (~2 riviä/taulu nyt). → PIDÄ kaikki.

Ainoa selvä kuollut kandidaatti: `idx_subscriptions_ls_customer` (LemonSqueezy-legacy; LS poistettu projektista). Voidaan pudottaa turvallisesti, mutta arvo ~0 ja additiivinen kulu mitätön → jätetään seuraavaan DB-siivoukseen, ei kiirettä.

## P2-5 — Auth-rate-limitit: VALIDOINTI KESKEN
`middleware/rateLimit.js` (authLimiter login-brute-force, registerLimiter register-spam, forgotPasswordLimiter) on paikallaan ja kytketty reitteihin (routes/auth.js). L-V340-muisti varoittaa: Supabase-rate-limit ei laske burstia (upsert count=1) → ainoa todellinen portti on in-memory-katto. **Live-validointi (brute-force + spam todella estyvät) ajetaan P1-3:n yhteydessä** — ei vielä todistettu tässä vaiheessa.

---

## P1-3 — RLS-net: TEHTY 9 reitille, 3 jää (turvallinen jatko)
Toteutus `req.supabase || adminClient` -shadow-patternilla (RLS-net prodissa, fallback admin testeissä → 0 testimuutosta). Migraatio 041 lisäsi puuttuvan `diagnostic_results` UPDATE-policyn. Todistettu `tests/verify-rls-net.mjs` (RLS palauttaa vain kutsujan rivit ilman app-suodinta) + guardrail `tests/security/user-id-scoping.test.js`.
- **Tehty:** sr, progress, profile, personalization, exam, digikirja, push, onboarding, placement.
- **Jää (manuaalisuotimet = nykysuoja, ei rikki):** `dashboardV2.js` (read-only, helper-pohjainen — helperit ottavat userId:n, vaatii req-läpiviennin), `curriculum.js` + `exercises.js` (mixed: user-omisteinen + jaetut taulut samassa tiedostossa → per-call-site, jaetut taulut PIDETTÄVÄ adminClientissä koska RLS estäisi esim. teaching_pages-insertin). Mekaaninen jatko samalla patternilla.

## Legacy tasokoe-UI:n täysi poisto — DEFER omaan frontend-loopiin (syy: entanglement)
Backend on jo neutralisoitu (P1-1: ei phantom-kirjoituksia, getOrCreateProgress in-memory). **Löydös FIX-vaiheessa:** legacy `adaptive.js`-tasokoe JA kanoninen `learningPath.js`-mastery-testi **jakavat `screen-mastery-*`-HTML-markupin** (app.html). Ne erkanevat backendissä (`/api/adaptive/*` vs `/api/mastery-test/*`) mutta frontend-screenit menevät päällekkäin. Markupin/handlerien poisto ilman huolellista disentanglementtia + Playwright-verifikaatiota MOLEMMILLE flowille riskeeraa kanonisen mastery-testin rikkomisen (three-strikes: älä kiirehdi kilpailevien state-systeemien kirurgiaa). Tasokoe oli jo näkymätön käyttäjälle (taso ei koskaan saavuttanut "ready"-tilaa) → ei toimivan ominaisuuden menetystä, ei kiirettä. Tehdään FRONTEND-loopina.
