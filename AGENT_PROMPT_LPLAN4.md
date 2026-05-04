# Agent Prompt — L-PLAN-4
# Streak-silta + fast-leveling UI + Kurssi 1 end-to-end testi

## Lue ensin — EI koodia ennen kuin olet lukenut
1. `AGENT_STATE.md` — erityisesti "Next loop" -kuvaus L-PLAN-4:sta
2. `CURRICULUM_SPEC.md` §4 (fast-track-säännöt) + §7 (tutor-äänen ohjeet)
3. `IMPROVEMENTS.md` viimeiset 30 riviä — deferred-itemit L-PLAN-1/2/3-blokeista
4. `.claude/skills/puheo-screen-template/SKILL.md`
5. `.claude/skills/puheo-finnish-voice/SKILL.md`
6. `.claude/skills/puheo-ai-prompt/SKILL.md`

---

## Konteksti

L-PLAN-1, -2 ja -3 on shipattu. Nyt on kolme konkreettista puuttuvaa palasta:

1. **SQL-migraatio ei ole ajettu Supabasessa** — kaikki curriculum-taulut (`curriculum_kurssit`, `curriculum_lessons`, `teaching_pages`, `user_curriculum_progress`) + 9 uutta `user_profile`-saraketta puuttuvat oikeasta tuotantotietokannasta. Koodi degradoi JS-dataan (`tablesMissing()`-helper), mutta mikään ei tallennu.
2. **Streak ei nouse curriculum-suorituksesta** — `POST /api/curriculum/:kurssiKey/lesson/:lessonIndex/complete` ei kutsu streak-logiikkaa; `/api/dashboard`-streak lukee `user_sessions`-taulusta, johon curriculum-suoritus ei tällä hetkellä kirjoita.
3. **Fast-leveling UI puuttuu** — CURRICULUM_SPEC §4 määrittelee: jos oppilas saa >90 % kurssin ensimmäisellä oppitunnilla, näytetään callout "Tämä vaikuttaa tutulta — tehdäänkö suoraan kertaustesti?" Skip-nappi hyppää suoraan viimeiseen (kertaustesti-)oppituntiin.

Lisäksi: **onboarding V2 ei ole vielä default boot path** — se on kiinnitetty `#/aloitus`-hashiin, ei `checkOnboarding()`-funktioon.

---

## Tehtävä 1 — Supabase-migraatio (TÄRKEIN, tee ensin)

Migraatiotiedosto on jo olemassa: `supabase/migrations/20260429_curriculum.sql`.


1. Lue `supabase/migrations/20260429_curriculum.sql` kokonaan.
2. Tarkista että tiedosto sisältää kaikki nämä taulut: `curriculum_kurssit`, `curriculum_lessons`, `teaching_pages`, `user_curriculum_progress`, ja `user_profile`-ALTER TABLE -lauseet (ml. `tutor_greeting` + `tutor_greeting_at` L-PLAN-3:sta).
3. Jos jokin puuttuu tai on rikki, korjaa SQL-tiedosto.
4. Tulosta terminaaliin selkeä viesti:

```
=== SUPABASE MIGRATION REQUIRED ===
Aja tämä SQL Supabase-dashboardin SQL-editorissa:
  supabase/migrations/20260429_curriculum.sql

Taulut joita luodaan: curriculum_kurssit, curriculum_lessons,
teaching_pages, user_curriculum_progress
user_profile-sarakkeet: self_reported_grade, target_grade,
weak_areas, daily_goal_minutes, placement_confidence,
placement_kurssi, tutor_assessment, current_grade,
tutor_greeting, tutor_greeting_at

Aja KERRAN. Idempotent (CREATE TABLE IF NOT EXISTS).
===
```

5. Jatka muihin tehtäviin — koodi toimii JS-fallbackilla kunnes käyttäjä ajaa migraation.

---

## Tehtävä 2 — Streak-silta curriculum-suorituksesta

**Ongelma:** `POST /api/curriculum/:kurssiKey/lesson/:lessonIndex/complete` upsertaa `user_curriculum_progress`-tauluun mutta ei kirjoita `user_sessions`-tauluun → streak ei nouse.

**Korjaus `routes/curriculum.js`:ssä**, `/complete`-endpointissa, heti onnistuneen upsert-kutsun jälkeen:

```js
// Kirjaa curriculum-suoritus myös user_sessions-tauluun streak-laskuria varten
await supabase.from('user_sessions').insert({
  user_id: req.user.id,
  mode: 'curriculum',
  score_pct: Math.round((score / total) * 100),
  duration_seconds: durationSeconds ?? null,  // frontend voi lähettää, optional
  created_at: new Date().toISOString()
});
```

Huomio: `user_sessions`-taulun rakenne — tarkista `supabase.js` tai `routes/progress.js` miten muut moodit kirjoittavat sinne. Käytä täsmälleen samaa rakennetta. Jos taulu käyttää eri kenttänimiä (`score` vs `score_pct`, `session_mode` vs `mode`), sovita sen mukaan.

Frontend (`js/screens/lessonResults.js`) voi lähettää `durationSeconds` POST-bodyssa — lisää tämä jos helppo, muuten jätä null.

**Testi:** Kirjoita `scripts/agent-test/lplan4-streak-bridge.mjs`. Mock `/api/curriculum/kurssi_1/lesson/1/complete` ja varmista että responseBody sisältää `tutorMessage` (string) eikä ole tyhjä.

---

## Tehtävä 3 — Fast-leveling callout UI

**Spec (CURRICULUM_SPEC §4):** Jos oppilas saa >90 % kurssin ensimmäisellä oppitunnilla (`lessonIndex === 0` ja `score/total > 0.9`), POST `/complete` palauttaa nyt `fastTrack: true` (jo implementoitu L-PLAN-3:ssa). Frontend pitää reagoida tähän.

**`js/screens/lessonResults.js`:ssä**, kun `fastTrack === true`:

Näytä callout-kortti tuloskortin alapuolella ennen "Aloita next kurssi" -nappia:

```html
<div class="lesson-results__fast-track" role="alert">
  <span class="lesson-results__fast-track-icon">⚡</span>
  <p class="lesson-results__fast-track-text">
    Tämä vaikuttaa tutulta — tehdäänkö suoraan kertaustesti?
  </p>
  <div class="lesson-results__fast-track-actions">
    <button class="btn btn--accent" id="btn-fast-track-yes">
      Siirry kertaustestiin →
    </button>
    <button class="btn btn--ghost" id="btn-fast-track-no">
      Jatka järjestyksessä
    </button>
  </div>
</div>
```

Napin `btn-fast-track-yes` logiikka:
- Hae kurssin oppituntien määrä (`/api/curriculum/:kurssiKey` → `lessons.length`)
- Navigoi suoraan viimeiselle oppitunnille (kertaustesti): `loadLesson(kurssiKey, lessonsCount - 1)`

Napin `btn-fast-track-no` logiikka:
- Navigoi normaalisti seuraavalle oppitunnille (index 1): `loadLesson(kurssiKey, 1)`

**CSS** (`css/components/curriculum.css`) fast-track calloutille:
- `--accent-soft` tausta, `--accent` vasemmalla border 3px, 16px padding
- Ikoni 24px, teksti 16px `--text`, napit rinnakkain (flex gap-8px), pienemmällä viewportilla stack
- `prefers-reduced-motion`: ei animaatiota, näkyy suoraan

---

## Tehtävä 4 — Onboarding V2 default boot pathiksi

**Tiedosto:** `js/main.js` (tai missä `checkOnboarding()` on määritelty)

**Nykyinen tila:** V2-onboarding käynnistyy vain `#/aloitus`-hashilla. `checkOnboarding()` ohjaa vanhaan V1-onboardingiin.

**Muutos:** Vaihda `checkOnboarding()` niin että se käynnistää `showOnboardingV2()` V1:n sijasta:

```js
// Ennen:
// showOnboarding()  tai loadScreen('screen-ob-1') tms.

// Jälkeen:
import { showOnboardingV2 } from './screens/onboardingV2.js';
// ...
checkOnboarding() {
  if (!onboardingCompleted) {
    showOnboardingV2();
  }
}
```

Varmista että vanha `#/aloitus`-hash-entry voi jäädä (ei haittaa) tai poista se jos se aiheuttaisi duplikaatin.

**Testi:** `scripts/agent-test/lplan4-onboarding-boot.mjs` — lataa `/app.html` ilman `localStorage.puheo_onboarding_completed`, varmista että `#screen-ob1-profile` on näkyvissä (tai mikä onkin V2:n ensimmäinen screen id).

---

## Tehtävä 5 — Kurssi 1 end-to-end Playwright-testi

Kirjoita `scripts/agent-test/lplan4-kurssi1-e2e.mjs`.

Testi mock-autentikoituu (tai käyttää olemassa olevaa mock-rakennetta kuten muissa loop-testeissä — `serviceWorkers: "block"` + `/api/*` route-stubeja).

Testaa järjestyksessä:
1. Lataa `/app.html`, varmista onboarding-screen näkyy (V2)
2. Simuloi onboarding läpi (täytä OB-1 kentät, klikkaa eteenpäin) tai skipattuna mock-sessioilla — riittää että pääset dashboardille
3. Navigoi Oppimispolku-screenille (`data-nav="path"`)
4. Varmista että Kurssi 1 on auki (ei `aria-disabled`)
5. Klikkaa Kurssi 1 → lesson 1 → varmista `#screen-lesson` on näkyvissä ja teaching page latautuu (mock `/api/curriculum/kurssi_1/lesson/0` → palauta fixture)
6. Klikkaa "Aloita harjoittelu" → varmista oikea exercise-screen avautuu
7. Mock `POST /api/curriculum/kurssi_1/lesson/0/complete` → palauta `{ tutorMessage: "Hyvin menee!", fastTrack: false, kurssiComplete: false }`
8. Varmista `#screen-lesson-results` näkyy, `tutorMessage` renderöityy

Tallenna screenshotit: `loop-lplan4-{onboarding,path,lesson,results}.png`.

---

## Tehtävä 6 — axe-sweep uusille screeneille

Aja axe-core kaikilla L-PLAN-1/2/3/4-loopissa lisätyillä screeneillä:
- `#screen-ob1-profile`, `#screen-ob2-test`, `#screen-ob3-assessment`, `#screen-ob4-plan`
- `#screen-path` (Oppimispolku)
- `#screen-lesson`
- `#screen-lesson-results`

Viewportit: 1440×900 + 375×812. Tavoite: **0 violations**. Korjaa kaikki löytämäsi.

---

## Ei tehdä tässä loopissa
- Uusia kurssimateriaaleja tai AI-generoitua sisältöä
- Landing-page muutoksia
- Dark theme -polish (L52–L55)
- Maksujärjestelmän muutoksia

---

## Valmis kun
- [ ] `supabase/migrations/20260429_curriculum.sql` tarkistettu + ohjeet tulostettu
- [ ] Streak-silta lisätty `routes/curriculum.js`:ään + testi
- [ ] Fast-leveling callout renderöityy kun `fastTrack === true`
- [ ] Onboarding V2 on default boot path
- [ ] Kurssi 1 e2e-testi ajaa läpi ilman page-erroreita
- [ ] axe 0 violations kaikilla uusilla screeneillä
- [ ] `AGENT_STATE.md` päivitetty: `Last completed loop: L-PLAN-4`, `Next loop: L-PLAN-5`
- [ ] Yksi `IMPROVEMENTS.md`-rivi formaatilla `[2026-04-29 L-PLAN-4]`
