# Lifecycle Email Drip — Puheo (Pass 4)

> Transport: Resend via `email.js` (already wired, `RESEND_API_KEY` env, `EMAIL_FROM` = `Puheo <noreply@puheo.fi>`).
> Existing scheduled job infra: `routes/email.js` — cron-signed `POST /api/email/streak-reminders` already runs, same pattern reused for new jobs.
> Finnish. Mobile-first HTML (single-column, 480 px content width).

## Drip overview

| Trigger             | Subject                                          | Fires when                                                     | Gate             |
|---------------------|--------------------------------------------------|----------------------------------------------------------------|------------------|
| D0 Welcome          | `Tervetuloa Puheoon — näin pääset alkuun.`       | Immediately after register (sync)                              | Always           |
| D1 Weakness         | `Yksi asia, jonka voit korjata tällä viikolla.`  | Cron, 24 h after register, only if placement_completed         | Free or Pro      |
| D3 Streak at risk   | `Streaksi on vaarassa — 5 min riittää.`          | Cron daily, if last session > 48 h ago and streak ≥ 2          | Free or Pro      |
| D7 Upgrade (Free)   | `Ensimmäinen viikko takana — Pro vie maaliin.`   | Cron, 7 days after register, if still on free                  | Free only        |
| D7 Keep going (Pro) | `Viikko mennyt. Näin jatketaan.`                 | Cron, 7 days after register, if Pro                            | Pro only         |
| Weekly progress     | `Viikkosi Puheossa · {n} harjoitusta, {x}% oikein` | Existing cron, Sundays 18:00 Helsinki                        | Free or Pro (opt-out) |
| Exam -30            | `Kuukausi YO-kokeeseen — vaihdetaan simulaatioihin.` | Cron, hits 30 days before exam date per user                | Always (opt-out) |
| Exam -7             | `Viikko YO-kokeeseen — viimeinen suunnitelmasi.` | Cron, hits 7 days before exam date per user                    | Always (opt-out) |

Opt-out is per-category in `email_preferences` (already modelled: `weekly_progress`, `streak_reminders`; new categories add columns). Unsubscribe links land on `/settings?tab=emails` which maps to `PUT /api/email/preferences`.

All emails inherit the existing layout from `email.js:12–46` — header with Puheo wordmark, single-column body, footer with tuki@puheo.fi + unsubscribe + postal address (add once legal entity is registered).

---

## D0 — Welcome (sync on register)

### Subject
`Tervetuloa Puheoon — näin pääset alkuun.`

### Preheader
`Espanjan yo-koe on {n} päivän päässä. Laaditaan suunnitelma.`

### Body (mock)

```
────────────────────────────
     PUHEO
────────────────────────────

Moi{etunimi ? ', ' + etunimi : ''},

Tervetuloa. Espanjan lyhyen oppimäärän
yo-koe on {n} päivän päässä — ehdit
vielä hyvin.

Puheo tekee sinulle:

● mittaa tasosi 2 minuutissa
● valitsee sinulle sopivat harjoitukset
● arvioi kirjoitelmasi YTL-rubriikilla
● pitää edistymisesi näkyvillä

Ensimmäinen askel:

   [ Tee tasotesti → ]

Kysymyksiä? Vastaa tähän viestiin —
lukee ihminen (Marcel).

Terveisin,
Puheo-tiimi
────────────────────────────
tuki@puheo.fi · Peruuta viestit
────────────────────────────
```

### Mobile render
Single column, 480 px content. Button renders full-width on ≤ 480 px, auto width on desktop.

### Variables
- `{etunimi}` from signup (optional — many students skip name).
- `{n}` = days to 28.9.2026 09:00 EEST, computed server-side at send.
- CTA URL: `https://puheo.fi/app.html?ref=email-d0` — deep-links to onboarding S2 if incomplete.

### Trigger wiring
Already fires — `sendWelcomeEmail(email, name)` in `routes/auth.js:22–68`. Rewrite the template body to the above; no new cron needed.

---

## D1 — Your weakness (personalised)

### Subject
`Yksi asia, jonka voit korjata tällä viikolla.`

### Preheader
`Tasotestisi paljasti: {weakness_short}. Kolmen harjoituksen kuuri auttaa.`

### Body

```
Moi,

Kävin tasotestisi läpi. Heikoin kohtasi
oli:

   {weakness_sentence}

Esimerkki:

   El año pasado _____ en España
   tres meses.
   (A) vivo  (B) viví  (C) vivía

Oikea vastaus: B — viví.
Preterit, täsmällinen ajanjakso.

Puheossa odottaa kolmen harjoituksen
sarja, joka iskee tähän suoraan:

   [ Avaa harjoitukset → ]

~8 minuutia. Sen jälkeen olet
käsitellyt heikoimman kohtasi kerran.

– Puheo
────────────────────────────
tuki@puheo.fi · Peruuta
────────────────────────────
```

### Variables
- `{weakness_sentence}` — from placement data, mapped via the FLOW.md weakness table.
- `{weakness_short}` — one-word version for the preheader (`preterit`, `subjunktiivi`, `sanasto: matkustaminen`).
- **Example question and answer are real** — the specific `exercise_logs` row from the student's last session where they answered wrong. Query: the most recent wrong answer in the weakness category. If the student has never attempted an item in that category (rare — placement should cover it), fall back to the best matching seed-bank example for that category.
- CTA URL: `/app.html?start=drill&category={weakness_category}&ref=email-d1`.

### Trigger wiring
New cron: `POST /api/email/d1-weakness` (cron-signed, runs hourly). Query: users where `register_at > now() - 25h` AND `register_at < now() - 23h` AND `placement_completed = true` AND `email_preferences.d1_weakness != false`. For each user, one extra query to `exercise_logs` to find the most recent wrong answer in the weakness category (join + order by `created_at desc limit 1`).

### States
- **No placement yet:** don't send. Log `d1_weakness_skipped { reason: 'no_placement' }`.
- **Placement done but no weakness category (100% correct):** substitute copy `Tasotestisi tulos oli kattava — nyt kannattaa suunnata seuraavaan askeleeseen.` and CTA → dashboard.
- **No wrong answer on record in the weakness category:** fall back to the best seed-bank example for that category (pre-curated, one per category). Log `d1_weakness_fallback`.

---

## D3 — Streak at risk

### Subject
`Streaksi on vaarassa — 5 min riittää.`

### Preheader
`{streak} päivää putkeen. Älä katkaise nyt.`

### Body

```
Moi,

Streaksi:

         {streak}
        päivää

Huomenna se nollaantuu, jos et
harjoittele tänään.

Vähimmäistavoite riittää:

   [ 5 min harjoitus → ]

Yhden sarjan ehdit tehdä bussissa.

– Puheo
────────────────────────────
tuki@puheo.fi · Peruuta
────────────────────────────
```

### Variables
- `{streak}` — count from `exercise_logs`.
- CTA URL: `/app.html?ref=email-d3`.

### Trigger wiring
Extension of existing `streak-reminders` cron (`routes/email.js:56–129`) — the job already checks `email_preferences.streak_reminders`. Rewrite the template to the above; add push-first fallback (already in place at `:108–123`).

### States
- **Already practiced today:** suppress. Already handled by the existing job.
- **Streak = 1:** do not send. A one-day streak lost isn't interesting to the user and this email would be spammy at day 2. Send only if `streak >= 2`.

---

## D7 — Upgrade offer (free users)

### Subject
`Ensimmäinen viikko takana — Pro vie maaliin.`

### Preheader
`{exercises_completed} harjoitusta tehty. Pro avaa YTL-kirjoitusarvion ja lukutekstit.`

### Body

```
Moi,

Viikko Puheon kanssa — hienoa
aloitusta. Koonti:

● {exercises_completed} harjoitusta
● {correct_pct} % oikein
● {topics_touched} aihetta käsitelty

Seuraavaksi YO-kokeen tärkein osa:
kirjoitus. Se on Pro-ominaisuus —
syy siihen on yksinkertainen: AI-
palaute YTL-rubriikin mukaan ei ole
halpaa tuottaa.

{seasonal_block}

   [ Tutustu Pro-tilaukseen → ]

Ei kiinnosta? Kaikki sanastotyökalut
säilyvät Free-tilillä rajattomasti.

– Puheo
────────────────────────────
tuki@puheo.fi · Peruuta
────────────────────────────
```

### `{seasonal_block}`
- **June–August:** `Juuri nyt Kesäpaketti 29 € kattaa kesä–syyskuun (säästät 27 % vs. kuukausimaksu).`
- **September:** `Syyskuun kesäpaketti loppuu 30.9. — Pro kuukausimaksulla 9,99 € jatkaa siitä.`
- **Rest of year:** `Pro 9,99 € / kk. Peruuta milloin tahansa.`

### Variables
- Stats from `exercise_logs` (7-day window).
- CTA URL: `/app.html?upsell=d7&ref=email-d7`.

### Trigger wiring
New cron: `POST /api/email/d7-offer` (cron-signed, hourly). Query: users where `register_at > now() - 169h` AND `register_at < now() - 167h` AND `is_pro = false`.

### Y-tunnus constraint
CTA lands on the in-app Pro upsell, which itself shows the waitlist modal (not live checkout). Consistency with PAYWALL.md Rule 5 placeholder flow.

---

## D7 — Keep going (Pro users)

### Subject
`Viikko mennyt. Näin jatketaan.`

### Preheader
`Kiitos, että valitsit Puheon. Tässä viikon plan.`

### Body
Short, four bullets:
```
Moi,

Kiitos Pro-tilauksesta. Viikko mennyt.

Ehdotuksemme seuraavalle viikolle:

● 3x kirjoitusharjoitus (YTL-aiheita)
● 2x lukuteksti tasoltasi {level}
● päivittäinen sanastokertaus

   [ Avaa viikkosuunnitelma → ]

– Puheo
```

### Trigger wiring
Same cron as D7-upgrade, branched on `is_pro`. One endpoint, two templates.

---

## Weekly progress (existing — keep + tune)

### Subject
`Viikkosi Puheossa · {n} harjoitusta, {x}% oikein`

### Preheader
`Vahvistit: {top_topics}. Harjoittele vielä: {weak_topic}.`

### Template changes from current
- Current body (reference: `email.js:122–150+`) is generic. Tune to surface the same `Vahvistit / Harjoittele vielä` structure as the Pass 0.7 result screen — students already recognise this format.
- Add countdown line at the top: `📅 {n} pv YO-kokeeseen.`
- Footer link to `/app.html?tab=weekly&ref=email-weekly`.

### Trigger wiring
Keep existing cron + template file; rewrite the body portion. No new endpoints.

### States
- **No exercises that week:** suppress (don't send a "0 exercises" email — it's dispiriting).
- **< 3 exercises:** send a shorter "gentle nudge" variant: `Hiljainen viikko — aloita uudelleen kevyesti?` single CTA.

---

## Exam −30 — Switch to simulation mode

### Subject
`Kuukausi YO-kokeeseen — vaihdetaan simulaatioihin.`

### Preheader
`Paras tapa kuukauden aikana: täyskoe-simulaatiot + virhelistasi.`

### Body

```
Moi,

YO-koe on tasan 30 päivän päässä
(28.9.2026).

Tästä eteenpäin paras valmistautumis-
tapa vaihtuu:

● ennen: sekalaiset harjoitukset
● nyt:   täyskoe-simulaatiot

Vaihdoimme sovelluksen etusivun
asetukset valmiiksi — näet ne ensi
kirjautumisella.

   [ Avaa simulaatio → ]

Kaksi simulaatiota viikossa riittää.
Rauhallista loppusuoraa.

– Puheo
```

### Side effects
- At send time, backend writes `user_profile.study_phase = 'simulation'` so the app dashboard can reorder its tiles (simulation first). This is **not a paywall change** — simulation is already Pro — but it updates what the free-tier dashboard emphasises.
- For Pro users: CTA deep-links to `/app.html?mode=exam-simulation&ref=email-t30`.
- For free users: CTA lands on the Pro upsell modal (same placeholder waitlist — y-tunnus constraint).

### Trigger wiring
New cron: `POST /api/email/exam-countdown`, runs daily at 08:00 Helsinki. Sends to users whose `user_profile.exam_date - now() = 30d ± 12h`. Same endpoint handles -7 too, branched on days-out.

---

## Exam −7 — Final week plan

### Subject
`Viikko YO-kokeeseen — viimeinen suunnitelmasi.`

### Preheader
`Ei uutta materiaalia. Virhelistasi läpi, yksi simulaatio, lepoa.`

### Body

```
Moi,

Viikko kokeeseen.

Tästä eteenpäin:

● ÄLÄ opettele uutta. Ei yllätyksiä.
● Käy virhelistasi läpi (20 min/pv).
● Yksi simulaatio viikon alkupuolella.
● Levossa. Nukkuminen parantaa
  kielen hakua enemmän kuin yksi
  drilli lisää.

Virhelistasi odottaa:

   [ Avaa virhelista → ]

Tsemppiä. Näet koetuloksen lokakuussa.

– Puheo
```

### Trigger wiring
Same cron as −30, branched on days-out. `POST /api/email/exam-countdown` handles both −30 and −7 windows.

---

## Email preferences UI

Exists already at `GET/PUT /api/email/preferences`. New categories to add to the preferences object:

```
{
  weekly_progress: true,       // existing
  streak_reminders: true,      // existing
  d1_weakness: true,           // NEW
  d7_offer: true,              // NEW
  exam_countdown: true         // NEW (controls both -30 and -7)
}
```

All default to `true` on register. Settings page lets users toggle per category.

Unsubscribe links in emails hit `/app.html?unsubscribe={category}&token={signed_token}` — verifies the token, calls `PUT /api/email/preferences` with the single-category flag flipped, confirms on a lightweight page.

---

## Implementation notes

### What's new
- Three new cron jobs: `d1-weakness`, `d7-offer`, `exam-countdown`. All follow the existing `streak-reminders` pattern (cron-signed `POST`, query users, batch-send, rate-limit Resend to ≤ 10 req/s).
- New `email_preferences` columns: `d1_weakness`, `d7_offer`, `exam_countdown` — Supabase migration.
- `email.js` gains: `sendD1WeaknessEmail(email, { weakness_category, weakness_sentence, example })`, `sendD7OfferEmail(email, { stats, is_pro, seasonal_block })`, `sendExamCountdownEmail(email, { days_out, exam_date, study_phase })`.

### What's unchanged
- Welcome, verification, password-reset emails — body text gets tuned but send path is existing.
- Weekly progress — same cron, same endpoint, body update only.
- Streak reminders — same cron, body tune.
- Resend API key, FROM address, layout wrapper.

### Deliverability
- All sends go via existing Resend account, DKIM + SPF already configured on `puheo.fi`.
- Subject lines kept ≤ 50 chars, preheaders ≤ 90 chars — both fit iOS Mail and Gmail preview.
- No attachments, no external images (keeps spam score low). All content inline HTML with a small base64 logo or a single CDN-hosted logo from vercel-alias.

### Observability
- Each send logs `email_sent { template, user_id, preview_sha }` to PostHog so we can measure delivery vs open rates once Resend's webhooks are wired (Pass 7 marketing). For now: delivery inferred from send success + lack of bounce.

## Acceptance

- [ ] D0 send replaces current welcome body on register. Verified by sending to a test address.
- [ ] D1 fires ~24 h after register only if placement done. Verified by creating a fresh account, waiting, checking Resend dashboard.
- [ ] D3 fires when last_session > 48 h and streak ≥ 2. Existing streak cron extended; test by manually setting last_session timestamp.
- [ ] D7 upgrade email fires for free, D7 keep-going for Pro. Branch verified.
- [ ] Weekly progress body shows `Vahvistit / Harjoittele vielä` format.
- [ ] Exam −30 / −7 fire from the same cron, correct body for each window.
- [ ] Unsubscribe links for each new category flip the right preference column.
- [ ] All emails render on iOS Mail, Gmail (web + Android), Outlook desktop — screenshots in `onboarding/email-renders/`.
