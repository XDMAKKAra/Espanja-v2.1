# SCREENS — re-mocks at mobile + desktop

ASCII mocks using the new tokens from DESIGN.md. Every layout below must hit the container widths in DESIGN §6. Divergences from current implementation marked **[NEW]**.

Viewports: mobile = 390×844, desktop = 1440×900.

---

## 1. Landing (`index.html`)

### Mobile (390)
```
┌──────────────────────────────────────────┐
│ 🔴 URGENCY BAR — "YO 28.9.2026 · 163 pv" │  56px, --grad-urgency
├──────────────────────────────────────────┤
│ Puheo            [Kirjaudu] [Aloita]    │  nav 64px
├──────────────────────────────────────────┤
│                                          │
│   [ESPANJA · LYHYT · YO-KOE 2026]       │  chip, --fs-caption
│                                          │
│   Paranna espanjan                      │  h1, --fs-h1
│   YO-arvosanaa tekoälyllä.              │  (clamp: 2rem–3rem)
│                                          │
│   YTL-rubriikin mukainen arviointi      │  body
│   ja personoidut harjoitukset.          │  --text-muted
│                                          │
│   [  Aloita ilmaiseksi · 2 min  ]       │  btn-primary lg
│   ▸ Testaa tasosi 2 min                 │  btn-ghost sm
│                                          │
│   ·────·────·────·────                  │  trust strip
│   8 lukiota · 1240 oppilasta            │  --fs-caption
│                                          │
└──────────────────────────────────────────┘
```

### Desktop (1440) **[NEW]** — current caps content at 960, should use up to 1080
```
┌──────────────────────────────────────────────────────────────────────────┐
│ URGENCY BAR                                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ Puheo    [Testaa] [Miten] [Hinnoittelu] [UKK]  [Kirjaudu]  [Aloita →]   │  nav
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                    [ESPANJA · LYHYT · YO-KOE 2026]                       │
│                                                                          │
│                  Paranna espanjan YO-arvosanaa                           │  h1 clamp
│                        teko­älyllä.                                      │  maxes at 3rem
│                                                                          │
│             YTL-rubriikin mukainen arviointi, personoidut                │
│             harjoitukset, täysi koesimulaatio.                           │
│                                                                          │
│                [  Aloita ilmaiseksi · 2 min  ]                           │
│                    ▸ Testaa tasosi 2 min                                 │
│                                                                          │
│       ·─── 8 lukiota · 1240 oppilasta · 14 pv palautus ────·             │
│                                                                          │
│                  ← — content area max 1080px — →                         │
│      ← — ample margins but not empty-plain (body gradient bg) — →        │
└──────────────────────────────────────────────────────────────────────────┘
```

Features grid and pricing section keep 3-up layout on desktop (`grid-template-columns: repeat(3, 1fr)`), collapse to 2-up at tablet, 1-up at mobile. FAQ list widens from 640px cap to 800px.

---

## 2. Auth (`app.html#screen-auth`)

### Mobile
```
┌──────────────────────────────────────────┐
│                                          │
│           Puhe[o]                        │  logo
│                                          │
│        Kirjaudu sisään                   │  h2
│   Seuraa edistymistäsi ja jatka.        │  body-sm, muted
│                                          │
│      [ Kirjaudu ] [ Rekisteröidy ]      │  tabs, 44px
│                                          │
│   Sähköposti                            │  label fs-caption
│   ┌─────────────────────────┐          │  input md
│   │ sinä@esimerkki.fi       │          │
│   └─────────────────────────┘          │
│                                          │
│   Salasana                              │
│   ┌─────────────────────────┐          │
│   │ ••••••••                │          │
│   └─────────────────────────┘          │
│                                          │
│   [     Kirjaudu sisään →      ]        │  btn-primary lg
│                                          │
│   Unohditko salasanan?                  │  btn-ghost sm
│                                          │
└──────────────────────────────────────────┘
```

### Desktop **[NEW]** — auth card centered, 480px max, otherwise empty padded background
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Puhe[o]                                                                  │  logo top-left
│                                                                          │
│                                                                          │
│                   ┌────────────────────────────────┐                     │
│                   │  Kirjaudu sisään               │                     │
│                   │  ...                           │                     │ 480px card
│                   │  [ form fields as mobile ]     │                     │
│                   │                                │                     │
│                   └────────────────────────────────┘                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

Unchanged from current intent; tokens just cleaner.

---

## 3. Dashboard (`app.html#screen-dashboard`)

### Mobile
```
┌──────────────────────────────────────────┐
│ ☰ Puheo            Marcel [avatar]       │  top bar 56px
├──────────────────────────────────────────┤
│ Hei, Marcel! Päivä 23 🔥                │  h2
│ 163 päivää kokeeseen                    │  body-sm muted
│                                          │
│ ┌──────────────────────────────────┐   │  card
│ │ Tason edistys      C → M         │   │
│ │ ●●●●●○○○ 62%                     │   │  progress --brand-light
│ └──────────────────────────────────┘   │
│                                          │
│ ┌────────────┐  ┌────────────┐         │  2-col grid
│ │ Sanastot    │  │ Kielioppi   │         │  cards
│ │ C · 142 sn  │  │ C · 38 hrj  │         │
│ └────────────┘  └────────────┘         │
│                                          │
│ [Jatka treeniä →]                       │  btn-primary md
├──────────────────────────────────────────┤
│ [🏠] [📚] [✍️] [⚙️]                      │  bottom nav
└──────────────────────────────────────────┘
```

### Desktop **[NEW]** — fixes the narrow-content bug
```
┌────────────┬─────────────────────────────────────────────────────────────┐
│            │ Hei, Marcel · Päivä 23 🔥 · 163 pv kokeeseen                │
│ Puheo      ├─────────────────────────────────────────────────────────────┤
│            │ ┌────────────────────────┐ ┌──────────────────────────┐     │
│ 🏠 Etu     │ │ Tason edistys  C → M   │ │ Viimeaikainen aktiv.     │     │
│ 📚 Sanasto │ │ ●●●●●○○○ 62%           │ │ · Sanasto C  oikein 18/20│     │
│ 📝 Kieliop.│ │ +3 tasoa kuukaudessa   │ │ · Kirjoitus E6, 4/6      │     │
│ ✍️ Kirjoit.│ └────────────────────────┘ │ · Kartoitus  C           │     │
│ 📖 Lukem.  │                            └──────────────────────────┘     │
│ 🏆 Koe     │ ┌────────────────────────┐ ┌──────────────────────────┐     │
│            │ │ Sanasto  C · 142 sanaa │ │ Kielioppi  C · 38 harj.  │     │
│ Marcel     │ │ [ Jatka →     ]        │ │ [ Jatka →     ]          │     │
│ Pro        │ └────────────────────────┘ └──────────────────────────┘     │
│            │                                                             │
│            │  ← content max 1080px, sidebar 220px fixed left →           │
└────────────┴─────────────────────────────────────────────────────────────┘
```

Two-column main grid unlocks at ≥1024px. Stats + activity side-by-side, mode cards below as a 2-up grid. Below 1024: single column (as mobile but wider).

---

## 4. Vocab exercise (`app.html#screen-vocab`)

### Mobile
```
┌──────────────────────────────────────────┐
│ ← Takaisin         Sanasto · C   3 / 20  │  top nav w/ counter
│ ████████████░░░░░░░░░░░  60%            │  progress bar 4px
├──────────────────────────────────────────┤
│                                          │
│ [SUOMI → ESPANJA]                       │  chip --ex-monivalinta
│                                          │
│  Miten sanot:                           │  body-sm muted
│                                          │
│  "jälkiruoka"                           │  h2, --font-body
│                                          │
│  ┌────────────────────────────────┐    │
│  │ a) postre                      │    │  option btn
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │ b) almuerzo                    │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │ c) desayuno                    │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │ d) cena                        │    │
│  └────────────────────────────────┘    │
│                                          │
└──────────────────────────────────────────┘
```

### Desktop **[NEW]** — side-by-side exercise + post-answer feedback
```
┌────────────┬─────────────────────────────────────────────────────────────┐
│ (sidebar)  │ ← Takaisin         Sanasto · C   3 / 20                     │
│            │ ████████████░░░░░░░░░░░  60%                                │
│            ├────────────────────────────────┬────────────────────────────┤
│            │                                │ (feedback panel appears    │
│            │ [SUOMI → ESPANJA]              │  after answer; empty until)│
│            │                                │                            │
│            │  Miten sanot:                  │  ┌──────────────────────┐ │
│            │                                │  │ ✓ Oikein · postre    │ │
│            │  "jälkiruoka"                  │  │ ────────────────────  │ │
│            │                                │  │ "postre" on           │ │
│            │  [ a) postre    ]              │  │ standardinen ruoka-   │ │
│            │  [ b) almuerzo  ]              │  │ lajitermi C-tasolla.  │ │
│            │  [ c) desayuno  ]              │  │                       │ │
│            │  [ d) cena      ]              │  │ [ Seuraava →  ]       │ │
│            │                                │  └──────────────────────┘ │
│            │  content 640px left col        │  feedback 380px right col  │
└────────────┴────────────────────────────────┴────────────────────────────┘
```

Two-column only when viewport ≥1200px. Below that, feedback appears below options (mobile layout).

---

## 5. Writing exercise (`app.html#screen-writing`)

### Mobile
```
┌──────────────────────────────────────────┐
│ ← Takaisin    Kirjoittaminen · E6        │
├──────────────────────────────────────────┤
│                                          │
│ Tehtävänanto:                           │
│ Kirjoita kaverillesi espanjaksi noin    │
│ 80 sanan viesti lomamatkastasi.         │
│                                          │
│ ┌──────────────────────────────────┐   │  textarea
│ │                                  │   │  min-h 240
│ │                                  │   │
│ │                                  │   │
│ └──────────────────────────────────┘   │
│ 0 / 80 sanaa                            │  --fs-caption muted
│                                          │
│ [ Lähetä arvioitavaksi → ]              │  btn-primary lg
└──────────────────────────────────────────┘
```

### Desktop **[NEW]** — prompt + textarea left, rubric reference right
```
┌────────────┬─────────────────────────────────────────────────────────────┐
│            │ ← Takaisin   Kirjoittaminen · E6                            │
│            ├────────────────────────────────┬────────────────────────────┤
│            │ Tehtävänanto                   │ YTL-rubriikki (E6)         │
│            │ Kirjoita kaverillesi ~80 san.. │ ┌─ Sisältö ──────────────┐ │
│            │                                │ │ Tehtävänanto käsitelty │ │
│            │ ┌────────────────────────────┐ │ │ ja viestittely sujuu   │ │
│            │ │                            │ │ └────────────────────────┘ │
│            │ │                            │ │ ┌─ Kielen laatu ─────────┐ │
│            │ │                            │ │ │ Rakenteet monipuolisia │ │
│            │ │                            │ │ └────────────────────────┘ │
│            │ └────────────────────────────┘ │ ┌─ Sanasto ──────────────┐ │
│            │ 0 / 80 sanaa                   │ │ Tarkoituksenmukaista   │ │
│            │ [ Lähetä arvioitavaksi → ]     │ └────────────────────────┘ │
└────────────┴────────────────────────────────┴────────────────────────────┘
```

Rubric panel only appears at ≥1200px. Below, it's a collapsible `<details>` above the textarea.

---

## 6. Exam (`app.html#screen-exam`)

### Mobile
```
┌──────────────────────────────────────────┐
│ Täysi YO-koe · 3 h          ⏱ 02:43:12  │  mono timer
│ ████░░░░░░░░░░░░░░░░░░░  14%            │
├──────────────────────────────────────────┤
│                                          │
│ Tehtävä 2 / 6                           │
│ Luetun ymmärtäminen                     │  h3
│                                          │
│ [ teksti: 400 sanaa, Lora serif ]       │  scrollable body
│ ...                                      │
│                                          │
│ 1. Mitä Maria ajattelee?                │  h4
│ ( ) a) ...                              │
│ (●) b) ...                              │
│ ( ) c) ...                              │
│                                          │
│ [ Seuraava tehtävä → ]                  │
└──────────────────────────────────────────┘
```

### Desktop **[NEW]** — text + question side-by-side
```
┌────────────┬─────────────────────────────────────────────────────────────┐
│            │ Täysi YO-koe · 3 h                            ⏱ 02:43:12    │
│            │ ████░░░░░░░░░░░░░░░░░░░  14%                                 │
│            ├──────────────────────────────┬──────────────────────────────┤
│            │ Teksti (Lora serif)          │ Kysymykset 1–4               │
│            │                              │                              │
│            │ Lorem ipsum dolor sit amet.. │ 1. Mitä Maria ajattelee?    │
│            │ (scroll within this column)  │   ( ) a  (●) b  ( ) c        │
│            │                              │ 2. Miksi hän lähti?          │
│            │                              │   ( ) a  ( ) b  (●) c        │
│            │                              │ 3. ...                       │
│            │                              │                              │
│            │  content left 600px          │  questions right 440px       │
└────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## 7. Onboarding (`app.html#screen-onboarding`)

Keep current single-column structure — onboarding is inherently linear. Widen card to 520px on desktop. No desktop-specific layout; just tokenised.

---

## Summary of divergences (**[NEW]**)

| Screen | Change | Reason |
|---|---|---|
| Landing | content up to 1080px | desktop-width bug |
| Dashboard | two-column grid ≥1024 | desktop-width bug + density |
| Vocab | right feedback panel ≥1200 | reuses empty space, reduces scroll |
| Writing | right rubric panel ≥1200 | teaches the rubric in-task |
| Exam | two-column text+question ≥1200 | standard reading-comprehension UX |
| Auth | card centred in padded bg | unchanged |
| Onboarding | widen card to 520px | readability |
