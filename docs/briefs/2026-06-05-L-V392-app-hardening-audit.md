# L-V392 — App-puolen kovennus: auth + DB + RLS + monikäyttäjä-eristys (audit-first)

**Rooli:** WRITER. Tämä on iso, monivaiheinen kovennus-loop. Lue koko brief ennen kuin koskeet koodiin.

**Skill-stack (kutsu Skill-toolilla ENNEN ensimmäistä Write/Edit/Bash):**
`supabase`, `supabase-postgres-best-practices`, `webapp-testing`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`. Jos korjaat käyttäjälle näkyvää suomi-virheviestiä → lisää `humanizer`.

---

## Konteksti & miksi nyt

Marcelin Claude Max -tilaus loppuu **~10 päivän päästä** (tänään 2026-06-05). Strategiamuutos: kevät on rahasesonki (YTL-data: ~70 % kirjoittaa keväällä kaikissa kolmessa kielessä), joten varsinainen tuotekehitys keskittyy talveen. **Nämä 10 päivää = compute-ikkuna jolloin app-puolen perusta lyödään kuntoon.**

**Kriittinen ajoitusfakta:** Marcel alkaa itse lukea sivustolla espanjaa **vasta noin kuukauden päästä** — eli sen jälkeen kun Max on jo loppunut. Hänen dogfood-palautteensa saapuu siis siihen aikaan kun korjaaminen on kallista ja hidasta. **Johtopäätös: tämän auditin on löydettävä bugit proaktiivisesti NYT. Emme voi nojata "korjataan kun käyttäjä törmää".** Ole perusteellinen, ei pintapuolinen.

**Scope-päätös (Marcel valitsi eksplisiittisesti):** TÄYSI kovennus — auth, database-eheys, RLS, **monikäyttäjä-eristys ja skaala** mukaan lukien. Ei pelkkä yhden käyttäjän lukupolku.

**Stripe = OUT OF SCOPE** tässä loopissa. `subscriptions` ja `stripe_events` ovat tyhjät (0 riviä), Stripe ei ole livenä, eikä Stripe-toimiin ole lupaa. Älä koske maksupolkuun ellei Marcel erikseen pyydä. Pro/Free-middleware saa jäädä ennalleen.

---

## Tavoite (intent, ei pikselit)

Kolmivaiheinen audit-first -kovennus:

1. **AUDIT** — enumeroi kaikki auth-, RLS-, data-eheys- ja monikäyttäjä-bugit. EI korjauksia tässä vaiheessa. Output = priorisoitu löydöslista.
2. **TRIAGE** — luokittele jokainen löydös: **P0** (rikkoo / vuotaa dataa / estää käytön), **P1** (eheys- tai turva-riski joka puraisee myöhemmin), **P2** (perf/siivous, ei kiire).
3. **FIX** — korjaa P0 + P1 tässä ikkunassa, TDD missä järkevää. Dokumentoi P2 talvea varten (`docs/briefs/L-V392-P2-DEFERRED.md`), älä jätä puolivalmiita kovennuksia.

**Periaate:** ehjä kapeampi > puolivalmis laaja. Jos aika loppuu, jätä P2 koskemattomaksi ja dokumentoituna ennemmin kuin puoliksi migratoitu RLS.

---

## Mitä jo TIEDETÄÄN — seed-löydökset (älä rediscoveroi näitä, verifioi ja korjaa)

### Supabase advisorit (ajoin 2026-06-05, projekti `teovmfkoebnghqmbtycj`, Postgres 17.6)

**SECURITY:**
- `auth_leaked_password_protection` **DISABLED** (WARN). Ota käyttöön HaveIBeenPwned-tarkistus Supabase Auth -asetuksista. → https://supabase.com/docs/guides/auth/password-security

**PERFORMANCE / RLS:**
- `auth_rls_initplan` (WARN) — RLS-policyt re-evaluoivat `auth.<fn>()` per rivi → korvaa `(select auth.<fn>())`. Osuu: `free_usage` (3 policya: `_owner_select`, `_owner_upsert`, `_owner_update`), `translation_accepted` (`_user_insert`). Skaala-bugi, kuuluu P1:een koska scope = skaala.
- `unindexed_foreign_keys` (INFO) — `translation_accepted.user_id`, `user_curriculum_progress.kurssi_key` ilman kattavaa indeksiä. P2.
- `unused_index` (INFO) — ~18 käyttämätöntä indeksiä (idx_exercise_logs_user, idx_subscriptions_ls_customer, jne.). P2-siivous, ÄLÄ poista sokkona — osa voi olla uusia/odottaa käyttöä.

**Taulut:** 34 kpl `public`-skeemassa, **RLS päällä jokaisessa** (hyvä lähtökohta). Rivimäärät pienet (testidataa: user_profile 2, exercise_logs 17, translation_accepted 740).

### Historialliset bugit muistista (verifioi ettei regressoitunut)
- **L-V339 cross-user data-vuoto:** jaetun service-role-clientin session-kaappaus. Sääntö: `signInWithPassword` VAIN `authClient`illa, ei `adminClient`illa. Live-guard `tests/verify-isolation.mjs` olemassa — **aja se ja varmista vihreä.** Tämä on monikäyttäjä-eristyksen ydin → P0 jos rikki.
- **Progress-language-scoping:** `exercise_logs/user_mistakes/exam_sessions/diagnostic_results` skoupattu kielellä (`normalizeLang` es↔spanish). Varmista ettei kieli vuoda progressiin (esim. espanja-data näkyy ranskassa).
- **`user_level_progress` puuttui skeemasta** → adaptiivinen inertti. HUOM: taulussa on nyt `user_level` (2 riviä) ja `user_mastery` (2 riviä). Verifioi onko adaptiivinen kytketty oikein vai yhä kuollut.

---

## Audit-kattavuus (vähintään nämä polut)

**Auth:**
- Rekisteröinti → email-verify → login → logout → uudelleenkirjautuminen. Sessio säilyy reloadissa, ei droppaa.
- Salasanan reset -flow end-to-end (`password_resets`-taulu, 1 rivi).
- `user_metadata` EI käytössä auktorisointipäätöksissä (Supabase-ansa: user-editable). Tarkista RLS-policyt ja middleware — auktorisointi `app_metadata`/palvelinpuolelta, ei JWT-user-metasta.
- Rate-limitit auth-reiteille (rekisteröinti-spam, login-brute-force) — `middleware/rateLimit.js` + `rate_limit_buckets`-taulu.

**RLS / monikäyttäjä-eristys (scope-ydin):**
- Käy LÄPI jokaisen 34 taulun RLS-policy. Jokaisella user-omisteisella taululla pitää olla policy joka rajaa `auth.uid()`:iin — EI pelkkä "RLS enabled" vaan oikea owner-rajaus.
- **UPDATE vaatii SELECT-policyn** (Postgres-ansa: ilman SELECT-policya update palauttaa 0 riviä hiljaa). Tarkista upsert-poluilla (free_usage, user_curriculum_progress, user_session_state).
- Kahden eri käyttäjän testi: luo 2 testitiliä, varmista ettei A näe B:n exercise_logs / mistakes / progress / sessioita. Tämä on se mitä n=1-dogfood EI löydä.
- View-tarkistus: jos exposed-skeemassa on vieweja, `security_invoker = true` (muuten bypassaa RLS).

**Data-eheys (Marcelin 2kk lukudata riippuu tästä):**

> **SELKÄRANKA-TESTI — tämä on se polku jonka Marcel itse ajaa kk:n päästä. Aja se end-to-end Playwrightilla ja todista että JOKAINEN kirjoitus säilyy reloadin JA uudelleenkirjautumisen yli:**
> 1. Uusi käyttäjä rekisteröityy (uusi email) → email-verify → login.
> 2. Kartoitus (onboarding-diagnostic) → vastaukset tallentuvat `user_onboarding_diagnostic` / `diagnostic_results`.
> 3. Taso määräytyy → `user_level` saa rivin (ei tyhjä, ei väärä kieli).
> 4. Kurssin valinta → `user_curriculum_progress` saa rivin oikealla `kurssi_key`illä + kielellä.
> 5. Tehtävien teko (vocab/grammar/reading) → `exercise_logs`, virheet `user_mistakes`, SR-kortit `sr_cards`, nähdyt `seen_exercises` tallentuvat.
> 6. Lesson/sivu-eteneminen digikirjassa → `user_lesson_progress`, itsearviot `user_self_assessments`.
> 7. **Reload + logout + uudelleenlogin → kaikki yllä oleva on yhä paikallaan ja oikein.** Tämä on hyväksymisen kova ydin: jos jokin katoaa tai sekoaa kieleen, se on P0.

- Progress tallentuu oikein per kieli, ei sekoitu. Reload säilyttää.
- Onboarding-diagnostic → taso → adaptiivinen: ketju toimii vai onko `user_level`/`user_mastery` kytketty löysästi.
- Lesson/sivu-progress (`user_lesson_progress` 10 riviä, `user_self_assessments`) tallentuu digikirjassa.

**Skaala (kevyt, koska scope sanoo niin):**
- RLS initplan -korjaukset (yllä).
- Indeksoimattomat FK:t.
- Ilmeiset N+1 / sekventiaaliset DB-kutsut kuumilla reiteillä (dashboard-lataus, exercise-generate).

---

## Työtapa

1. **Vaihe 1 (audit) tuottaa tiedoston** `docs/briefs/L-V392-AUDIT-FINDINGS.md`: numeroitu lista, jokaisessa: polku/taulu, oire, vakavuus (P0/P1/P2), toistoaskeleet. **Pysähdy ja näytä tämä Marcelille ennen kuin alat korjata** — hän voi uudelleenpriorisoida.
2. Käytä `mcp__claude_ai_Supabase__execute_sql` (read-only kyselyt audit-vaiheessa) ja `get_advisors` uudelleen muutosten jälkeen.
3. RLS/schema-muutokset: `execute_sql`illa iteroi, sitten **migraatio MCP:n kautta** (`apply_migration`) kun valmis. ÄLÄ jätä SQL:ää Marcelille editoriin.
4. Auth-asetukset (leaked password protection) jotka eivät ole SQL:ää: jos vaativat dashboard-toimen jota et voi tehdä MCP:llä, kirjaa se erilliseen `ACTION-REQUIRED`-lohkoon briefin loppuun tarkkoine ohjeineen — älä teeskentele tehneesi.
5. Monikäyttäjä-eristys verifioidaan **Playwrightilla + 2 testitilillä** (testitunnukset `.env`:ssä), ei silmämääräisesti.

## Acceptance criteria (konkreettiset)

- [ ] `docs/briefs/L-V392-AUDIT-FINDINGS.md` olemassa, jokainen löydös P0/P1/P2-luokiteltu + toistoaskeleet.
- [ ] Kaikki P0 korjattu ja verifioitu (Playwright/SQL-todiste, ei "pitäisi toimia").
- [ ] Kaikki P1 korjattu TAI eksplisiittisesti deferrattu Marcelin luvalla.
- [ ] `tests/verify-isolation.mjs` vihreä (cross-user-eristys todistettu).
- [ ] 2 testitiliä: A ei näe B:n dataa millään user-omisteisella taululla (Playwright-todiste).
- [ ] `auth_rls_initplan`-WARNit pois advisorista (free_usage + translation_accepted policyt korjattu).
- [ ] Leaked-password-protection päällä TAI ACTION-REQUIRED-ohje jos vaatii dashboard-toimen.
- [ ] `get_advisors` ajettu uudelleen lopuksi, jäljelle jäävät WARN/ERROR dokumentoitu P2-tiedostoon syineen.
- [ ] `npm test` (vitest) vihreä, `node --check` läpäisee muokatut js-tiedostot.
- [ ] P2-löydökset dokumentoitu `docs/briefs/L-V392-P2-DEFERRED.md`:hen.
- [ ] IMPROVEMENTS.md +1 rivi.

## Push-rajat
- Tämä on enimmäkseen Claude-internal (RLS, migraatiot, testit) — **migraatiot menevät tuotanto-DB:hen MCP:n kautta** mutta koodi-commitit pushataan vain jos muuttavat käyttäjälle näkyvää käyttäytymistä. Audit-tiedostot, testit = ei Vercel-pushia.
- Stripe: ei mitään ilman erillistä lupaa.
- Jos osut 3. kertaa samaan bugiin → restrukturoi, älä band-aidaa.
