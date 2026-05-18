# PR #2 brief — hybrid käännösvalidointi

**Status:** ready to start in a fresh session. Branch from `main`.

## Goal

Käännös- ja lauseen-muodostus-tehtävät validoidaan ensin paikallisesti
`accepted_translations`-listalla (instant, ei API-kutsua), sitten AI-graderin
kautta varakeinona (`/api/grade-translate`). Käyttäjä voi promotata oman
vastauksensa hyväksyttyjen listalle ("Mielestäni oikein") — promotaatio
tallennetaan Supabaseen ja palaa kaikille käyttäjille tulevaisuudessa.

Päämääränä: vähentää AI-kutsut ~80%, säilyttää välitön käyttäjäkokemus, ja
laittaa lista oppimaan ajan myötä yhteisön panoksesta.

## Skill-stack

EXERCISE + SUPABASE + FRONTEND. Kutsu kaikki ennen koodimuutoksia:
- `practice-problem-sequence-designer`, `variation-theory-task-designer`, `retrieval-practice-generator`, `scaffolded-task-modifier`, `worked-example-fading-designer`, `cognitive-load-analyser`, `criterion-referenced-rubric-generator`, `adaptive-hint-sequence-designer`
- `supabase`, `supabase-postgres-best-practices`
- `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`

## Vaiheet

### 1. Supabase-migraatio

Uusi taulu: `translation_accepted`. Sarakkeet:
- `id uuid primary key default gen_random_uuid()`
- `lesson_item_id text not null` — viittaa olemassa olevaan lesson-item-seediin
- `accepted_answer text not null` — normalisoitu (lowercase, trim, NFC)
- `source text not null check (source in ('seed', 'ai_grader', 'user'))`
- `user_id uuid` — jos source='user', kuka promotti
- `created_at timestamptz default now()`
- `unique (lesson_item_id, accepted_answer)`

RLS: SELECT public (kaikki voivat lukea), INSERT vain `source='user'` ja oman
user_id:llä; muut sourcet INSERT vain service_role:lle (seeder + AI-grader).

Migration: `npx supabase migration new add_translation_accepted` → kirjoita SQL,
sitten `mcp__claude_ai_Supabase__apply_migration` käyttäjän puolesta.

### 2. Seedaa hyväksytyt käännökset

Skripti `scripts/seed-accepted-translations.mjs`:
- Lukee kaikki `kaannos`- ja `lauseenMuodostus`-tyypin lesson-itemit kaikilta
  kursseilta + kielitä (es/fr/de).
- AI-promptaa OpenAI:lle: "Anna 5 hyväksyttävää käännöstä lauseelle X. Lauseet
  saavat eroavat toisistaan sanajärjestyksessä, synonyymeissa, idiomeissa. Älä
  generoi rikkinäisiä lauseita."
- Tallentaa kaikki INSERT-paketteina `translation_accepted`:iin `source='seed'`.
- Suosittu: aja kerran kehityksessä, älä CI:ssä (yksi run ~2 min, ~$2 OpenAI-kuluja
  koko tietokannalle).

### 3. Käännösvalidointi-API

Päivitä `routes/exercises.js` (tai luo `routes/grade-translate.js` jos selkeämpi):
- Vastaanottaa `{ lessonItemId, userAnswer }`.
- Hakee `translation_accepted`-rivit kyseiselle item-id:lle.
- Käyttää `js/lib/accentTolerance.js`:n `matchesAnyAccepted`:tä (siirrä `lib/`:iin
  jos client+server pitää jakaa).
- Jos match → palauta `{ score: 3, source: 'list' }` (ei AI-call).
- Jos ei match → kutsu olemassa olevaa AI-grader-prompttia, palauta tulos +
  `source: 'ai_grader'`.
- Jos AI-grader sanoo score >= 2 → kirjoita käännös myös `translation_accepted`:iin
  `source='ai_grader'` (oppiva lista).

### 4. Käyttäjähyväksyntä-UI

Päivitä `js/renderers/kaannos.js` + `lauseenMuodostus.js`:
- Kun AI palauttaa score < 2 ja käyttäjän vastaus ei matchaa listaa → näytä
  feedback + kaksi nappia: "Mielestäni oikein →" ja "Yritä uudelleen".
- "Mielestäni oikein" → POST `/api/translate-promote` `{ lessonItemId, answer }`.
  Server tallentaa `source='user'` + user_id. Käyttäjä saa pisteet, kuten
  oikeasta vastauksesta.
- "Yritä uudelleen" → palauttaa input-state, käyttäjä saa kokeilla uudelleen.

### 5. Anti-abuse-suoja

Käyttäjä ei voi promotata kuin niitä vastauksia jotka AI antoi vähintään
score=1 ("lähellä"). Score=0:sta promotaatiosta tulee 403.

Lisäksi: max 50 promotaatiota per user per päivä (estää scriptaajia).

### 6. Testit

- vitest: `js/lib/accentTolerance.test.js` — covers compareAnswer, matchesAnyAccepted, isAcceptable
- e2e: `tests/e2e-translation-validation.spec.js` — käännös-flow alusta loppuun
  (matchaava listalla, AI-fallback, käyttäjäpromotaatio)

### 7. Sw + bundle

- Bump `sw.js` CACHE_VERSION (next free)
- `npm run build`
- Commit, PR, merge

## Hyväksymiskriteerit

- [ ] Käännös joka osuu listaan validoituu < 50 ms (network latency only)
- [ ] AI-fallback käytetään vain ei-listattuihin vastauksiin
- [ ] Käyttäjäpromotaatio toimii ja palaa kaikille käyttäjille
- [ ] Aksenttitolerantti vertailu (samalla logiikalla kuin PR #1)
- [ ] Toimii es/fr/de
- [ ] vitest + SPA a11y vihreät
- [ ] Anti-abuse: score=0-vastauksen promotaatio palautuu 403

## Tiedostot

| Polku | Mitä |
|---|---|
| `supabase/migrations/<ts>_add_translation_accepted.sql` | Uusi taulu + RLS |
| `scripts/seed-accepted-translations.mjs` | Yhden kerran seed-skripti |
| `routes/exercises.js` tai `routes/grade-translate.js` | Hybridi-validointi |
| `routes/translate-promote.js` | Käyttäjäpromotaatio-endpoint |
| `js/lib/accentTolerance.js` | Lisää `lib/` jos jaetaan server-puolen kanssa |
| `js/renderers/kaannos.js` | "Mielestäni oikein"-flow |
| `js/renderers/lauseenMuodostus.js` | Sama |
| `tests/accentTolerance.test.js`, `tests/e2e-translation-validation.spec.js` | Testit |

## Riskit

- **AI-promptin laatu seedissä**: yksi huono prompt → tuhansia huonoja
  hyväksyttyjä käännöksiä. Vahvista pieni otos manuaalisesti ennen täyttä
  seediä.
- **Supabase write-volyymi**: jos käyttäjäpromotaatioita tulee tuhansia per
  päivä, tarkista että taulu skaalautuu (lessonItemId-indeksi pakollinen).
- **Aksentit + listamatch**: varmista että listaversion vertailu käyttää
  samaa `accentTolerance`-logiikkaa kuin PR #1, muutoin saadaan epäjohdonmukaista
  käyttäytymistä.
