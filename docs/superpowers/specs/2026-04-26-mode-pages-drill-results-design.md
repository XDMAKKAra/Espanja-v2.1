# Mode-Pages + Drill + Results — Spec 2: Editorial Migration

**Status:** Approved 2026-04-26
**Spec scope:** Editorial migration of all 5 mode-pages (vocab / grammar / verbsprint / reading / writing) + the universal drill view (vocab / grammar / reading share `screen-start`) + the universal results view.
**Out of scope (future specs):** Verbisprint drill mechanics, writing screen + AI feedback, exam screen, onboarding, settings, landing page.

---

## 1. Goal

Apply the editorial system established in Spec 1 to the most-traversed flow in the app: every exercise type's entry point → drill → results. Spec 1 only fixed the dashboard; the user's own complaint after Spec 1 was that exercise screens still feel "empty." This spec fills that gap.

**Personality direction:** unchanged from Spec 1 — editorial (confident type, mono numerals, almost no chrome). Reuses every primitive: `app-shell.css`, `typography.css`, `rail.css`, `.btn--cta`, the border-bracketed pattern, `.is-current` for active selection, and the propagation rules in `design-system/DESIGN.md` §11.

**Success criteria:**

- All 5 mode-pages share one editorial template; they read as the same family.
- Topic pickers use mono numerals (decision A locked during brainstorming).
- Each mode-page has a briefing card showing user's mode-scoped stats (decision B locked).
- Drill view does not read as empty during loading or between questions — eyebrow row + skeleton matches actual content shape.
- Results screen has clear hierarchy: eyebrow → big mono score → breakdown → next-action.
- All existing data IDs preserved; `routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js` untouched.
- `npm test` passes (1044+); `node --check` clean for every touched JS file.
- WCAG AA contrast on every text token.

---

## 2. Foundation reuse (no token changes)

This spec consumes Spec 1's primitives. No new design tokens are added. No legacy aliases need migrating (Spec 1 closed that out). Adds three new component CSS files (`mode-page.css`, `exercise.css`, `results.css`); does not modify `style.css :root`.

Confirmed-available tokens this spec depends on (all defined in Spec 1):

- Layout: `--app-sidebar`, `--app-main-min`, `--app-main-max`, `--app-rail`, `--app-gutter-x`, `--app-gutter-y`, `--bp-rail`
- Type: `--fs-display`, `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-body-sm`, `--fs-meta`, `--fs-mono-lg`, `--fs-mono-md`, `--fs-mono-sm`, `--ls-display`, `--ls-eyebrow`
- Colour: `--ink`, `--ink-soft`, `--ink-faint`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--accent`, `--accent-hover`, `--success`, `--error`, `--bg`
- Utilities: `.eyebrow`, `.display`, `.section-h`, `.mono-num`, `.mono-num--lg/md/sm`
- Components: `.btn--cta`, `.app-shell`, `.app-main`, `.app-main-inner`, `.app-rail`, `[data-rail="off"]`

If any of these are missing at implementation time, the implementation is blocked — Spec 1 is the prerequisite.

---

## 3. Mode-page template (shared across all 5)

Every mode-page (`#screen-mode-vocab`, `#screen-mode-grammar`, `#screen-mode-verbsprint`, `#screen-mode-reading`, `#screen-mode-writing`) collapses to a single editorial template. Per-mode bespoke pieces stay small and fit inside the template.

### 3.1 Shell mode

Mode-pages run under `data-rail="off"` on `.app-shell` — these are entry points and the briefing card already carries the mode-scoped stats. No persistent rail needed. The screen-switch logic in `js/ui/nav.js` already toggles `data-rail` based on screen ID; mode screens are added to the "off" set (i.e., everything except `screen-dashboard`).

### 3.2 Slot map (top-down reading order)

```
[ EYEBROW ]            "VIIMEKSI · ke 24.4. · 14:02"   (or "ENSIMMÄINEN KERTA" for empty state)
[ DISPLAY H1 ]         Mode name in Finnish (Sanasto / Puheoppi / Verbisprintti / Luetun ymm. / Kirjoittaminen)
[ Motivational sub ]   one short paragraph specific to the mode (kept from existing markup)
[ BRIEFING CARD ]      border-bracketed; 3 mono stats + 1 "suosittelemme" line  (see §3.3)
[ Topic picker ]       numbered rows (mono numeral + name + optional desc + chevron)  (see §3.4)
[ Optional config ]    duration / task-type / pro-note / "kertaus ensin" — small inline blocks  (see §3.6)
[ Start CTA ]          .btn--cta navy block, mono meta line ("Aloita N · ~M min · TOPIC")
```

### 3.3 Briefing card (the new piece)

A border-bracketed block with three mono stats and one "suosittelemme" line. Replaces today's `.mode-page-stats` (which is a placeholder div populated by JS — currently mostly empty for new users).

```html
<div class="mode-briefing">
  <p class="eyebrow"><time id="vocab-last-time">VIIMEKSI · ke 24.4. · 14:02</time></p>
  <div class="mode-briefing__stats">
    <div class="mode-briefing__stat">
      <span class="mono-num mono-num--lg" id="vocab-last-acc">78</span><small>%</small>
      <span class="mode-briefing__stat-l">Tarkkuus</span>
    </div>
    <div class="mode-briefing__stat">
      <span class="mono-num mono-num--lg" id="vocab-week-sessions">12</span>
      <span class="mode-briefing__stat-l">Sessiota viikossa</span>
    </div>
    <div class="mode-briefing__stat">
      <span class="mono-num mono-num--lg" id="vocab-streak">4</span><small>pv</small>
      <span class="mode-briefing__stat-l">Putki</span>
    </div>
  </div>
  <p class="mode-briefing__suggest">
    Suosittelemme: <strong id="vocab-suggest-topic">Subjunktiivi</strong>
    <span id="vocab-suggest-reason">— heikoin viime viikolla</span>
  </p>
</div>
```

CSS:

```css
.mode-briefing {
  padding: 22px 0 24px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
}
.mode-briefing__stats {
  display: flex;
  gap: 48px;
  margin: 14px 0 18px;
}
.mode-briefing__stat-l {
  display: block;
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-top: 6px;
}
.mode-briefing__suggest {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin: 0;
}
.mode-briefing__suggest strong {
  font-weight: 600;
  color: var(--ink);
}
```

**Empty state** (first-time visitor, no data yet): the card collapses to a single line:

```html
<div class="mode-briefing mode-briefing--empty">
  <p class="eyebrow">ENSIMMÄINEN KERTA</p>
  <p class="mode-briefing__intro">Aloita Sekaisin-aiheella nähdäksesi, mihin aiheeseen sinun kannattaa keskittyä.</p>
</div>
```

The `.mode-briefing--empty` modifier hides `.mode-briefing__stats` and `.mode-briefing__suggest`; pads the same `22px 0 24px` so visual rhythm is preserved.

**Data sources:** the dashboard already fetches per-mode aggregates via existing endpoints (`/api/dashboard` returns `state.modes` keyed by mode-id with `lastSession`, `accuracy7d`, `sessionsThisWeek`, `streak`, `weakestTopic`). The briefing card consumes this same shape — no new endpoint needed.

A small new helper `loadBriefing(modeId)` in `js/screens/mode-page.js` does:

1. Reads `window._dashboardState?.modes?.[modeId]` (cached from the dashboard mount). If absent, calls `fetchDashboardSummary()` (the existing helper used by `js/screens/dashboard.js`) to populate.
2. Writes results to the briefing element IDs (`vocab-last-acc`, `vocab-week-sessions`, `vocab-streak`, `vocab-suggest-topic`, etc.).
3. If `state.modes[modeId].sessionsTotal === 0` or the data is unavailable, replaces the briefing markup with the `.mode-briefing--empty` variant.

**Field mapping** (briefing → existing state keys):
- `vocab-last-acc` ← `modes.vocab.accuracy7d` (already 0–100)
- `vocab-week-sessions` ← `modes.vocab.sessionsThisWeek`
- `vocab-streak` ← `modes.vocab.streak`
- `vocab-suggest-topic` ← `modes.vocab.weakestTopic.label` (with `weakestTopic.reason` populating the trailing `— heikoin viime viikolla` text)

If any field is null/undefined in the response, the briefing card writes `—` and skips that stat row's label colon — never crashes.

### 3.4 Topic picker — numbered rows

Replaces today's `.topic-cards` button grid with vertical rows. Same pattern as the dashboard's weak-topics list — visual consistency.

```html
<div class="mode-topics" role="radiogroup" aria-labelledby="vocab-topics-label">
  <p class="eyebrow" id="vocab-topics-label">Aihe</p>
  <button class="mode-topic is-current" data-topic="general vocabulary" role="radio" aria-checked="true">
    <span class="mode-topic__n mono-num mono-num--md">01</span>
    <span class="mode-topic__name">Yleinen sanasto</span>
    <span class="mode-topic__chev" aria-hidden="true">→</span>
  </button>
  <button class="mode-topic" data-topic="society and politics" role="radio" aria-checked="false">
    <span class="mode-topic__n mono-num mono-num--md">02</span>
    <span class="mode-topic__name">Yhteiskunta</span>
    <span class="mode-topic__chev" aria-hidden="true">→</span>
  </button>
  ...
</div>
```

Grammar-style topics with disambiguation desc get a second line:

```html
<button class="mode-topic" data-topic="ser_estar" role="radio">
  <span class="mode-topic__n mono-num mono-num--md">02</span>
  <span class="mode-topic__body">
    <span class="mode-topic__name">Ser vs. Estar</span>
    <span class="mode-topic__desc">Pysyvä vs. tilapäinen</span>
  </span>
  <span class="mode-topic__chev" aria-hidden="true">→</span>
</button>
```

CSS:

```css
.mode-topics { margin-bottom: 32px; border-top: 1px solid var(--border); }

.mode-topic {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-display);
  transition: background 100ms var(--ease-out);
  border-left: 3px solid transparent;
  padding-left: 16px;
}
.mode-topic:hover { background: var(--surface-2); }
.mode-topic.is-current {
  border-left-color: var(--accent);
  background: var(--surface);
}
.mode-topic:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.mode-topic__n { flex: 0 0 36px; color: var(--ink); }
.mode-topic__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.mode-topic__name {
  flex: 1;
  font-size: var(--fs-h3);
  font-weight: 500;
  color: var(--ink);
}
.mode-topic__desc {
  font-size: var(--fs-body-sm);
  color: var(--ink-faint);
}
.mode-topic__chev {
  font-size: var(--fs-h3);
  color: var(--ink-faint);
}
.mode-topic.is-current .mode-topic__chev { color: var(--accent-hover); }
```

Active row's left border is 3 px mint (`--accent`); matches the existing sidebar-item active state. Click reassigns `.is-current` and `aria-checked`. Existing `data-topic` attribute drives the JS handlers — no logic change.

### 3.5 Start CTA

The page's primary action. Same `.btn--cta` block from Spec 1's dashboard (navy `--ink` background, mint arrow, mono meta line):

```html
<button class="btn--cta" id="btn-start-vocab" data-target="vocab">
  <div class="btn--cta__l">
    <div class="btn--cta__title">Aloita sanastoharjoittelu</div>
    <div class="btn--cta__meta">20 SANAA · 5 MIN · YLEINEN SANASTO</div>
  </div>
  <span class="btn--cta__arrow" aria-hidden="true">→</span>
</button>
```

The mono meta line dynamically reflects the current selection — when topic changes, JS updates `data-cta-meta` content. Use the same `data-cta-title` / `data-cta-meta` attributes the Spec 1 day-drill CTA uses, so the same pattern applies. (No need to reuse `dash-cta.js` selection logic — mode-page CTAs are simpler: meta = `${count} ${unit} · ~${minutes} MIN · ${TOPIC.toUpperCase()}`.)

### 3.6 Per-mode bespoke pieces (kept small)

Each of the 5 mode-pages is the same template plus one or two small per-mode blocks:

| Mode | Bespoke block | Where |
|---|---|---|
| **Vocab** | none | — |
| **Grammar** | "Näytä kertaus ensin" secondary button | next to start CTA, as `.btn--ghost` (ghost button — `border: 1px solid --border`, transparent fill) |
| **Verbsprint** | duration picker `[10] [20]` (taivutusta per sprintti) | small pill group between topic picker and start CTA |
| **Reading** | Pro-note (locked-state hint) | small inline `<p class="mode-page__pro-note">` between topic picker and start CTA |
| **Writing** | task-type picker (lyhyt 33p / laajempi 66p) replaces topic picker; topic select stays as `<select>` below | task-type picker uses same numbered-row pattern (`.mode-topic`) just with two rows |

Bespoke blocks live in `mode-page.css` under modifier selectors (`.mode-page--grammar .mode-page__quickreview`, etc.) so the shared template stays clean.

### 3.7 Markup file structure (`app.html`)

The five mode screens (`#screen-mode-vocab/grammar/verbsprint/reading/writing`) get rewritten in place. Each follows the slot map in §3.2. Existing IDs preserved (`btn-start-vocab`, `vocab-topic-cards`, etc. — though the latter is renamed to `vocab-topics` since it's no longer cards).

---

## 4. Drill view (universal — vocab / grammar / reading)

The drill view today is a sparse `.exercise-inner` container that JS populates with question + options + feedback + next-button. The user complained: "tehtävänäkymä on aika tyhjä" (the exercise view feels empty), specifically while content is loading. Editorial fix puts persistent context up front and makes the loading skeleton match the actual content shape.

### 4.1 Slot map

```
[ EYEBROW ROW ]      "1 / 6  ·  PRETÉRITO  ·  14:02"          [ ✕ ]
                     left side: counter / topic (mono small-caps); right side: exit button (icon only)
[ progress bar ]     1 px tall, mint fill, no chrome
[ DISPLAY ]          The question / sentence (Inter 700, max-width 32ch, --fs-h1 size)
[ context line ]     small italic line for example/translation when present
[ OPTIONS ]          numbered rows (A B C D — letterforms, not mono numerals):
                       A    option text
                       B    option text
                       C    option text
                       D    option text
[ feedback row ]     hairline above; mono "OIKEIN ✓" or "VÄÄRIN" + correct answer when wrong
[ next CTA ]         mini .btn--cta or `↵ Seuraava` keyboard hint, lower-emphasis
```

**Letterforms (A/B/C/D) for options** is a deliberate small distinction from mono numerals. Option letters mean "answer key"; numerals mean "ranking." Keeps the system readable and matches QA conventions.

### 4.2 Loading state

Current loading shows skeleton bars (per the user's screenshot 3). The fix:

- The eyebrow row is already populated with static context: `1 / 6 · PRETÉRITO · 14:02`. Even before the question lands, the user has anchoring data.
- Below the eyebrow, the progress bar is filled to position 1/6.
- The display + options skeleton matches actual content shape: a 60%-width Inter line for the display + four shorter skeleton rows for options. No spinner.
- A small mono caption `Ladataan tehtävää…` sits below the option skeletons — this is the only "loading" indicator and reinforces that the skeleton is shape, not content.

This addresses "feels empty" by removing the hollow waiting state — the surface always has structure and context.

### 4.3 Markup

Each drill screen (`#screen-vocab` if it has its own ID; otherwise the universal `#screen-start` + per-mode toggle) gets the new `.exercise` markup:

```html
<div class="exercise">
  <header class="exercise__top">
    <div class="exercise__meta">
      <span class="mono-num mono-num--sm" id="ex-counter">1 / 6</span>
      <span class="exercise__sep">·</span>
      <span class="eyebrow" id="ex-topic">PRETÉRITO</span>
      <span class="exercise__sep">·</span>
      <span class="mono-num mono-num--sm" id="ex-time">14:02</span>
    </div>
    <button class="exercise__exit" id="btn-exit-exercise" aria-label="Poistu harjoituksesta">×</button>
  </header>
  <div class="exercise__progress"><i id="ex-progress-fill"></i></div>

  <h1 class="display" id="ex-prompt"></h1>
  <p class="exercise__context" id="ex-context"></p>

  <div class="exercise__options" id="ex-options" role="radiogroup">
    <!-- JS-rendered: -->
    <button class="ex-option" data-i="0">
      <span class="ex-option__l">A</span>
      <span class="ex-option__t"></span>
    </button>
    <!-- ... -->
  </div>

  <div class="exercise__feedback hidden" id="ex-feedback">
    <div class="exercise__feedback-status mono-num mono-num--md" id="ex-feedback-status"></div>
    <div class="exercise__feedback-correct" id="ex-feedback-correct"></div>
  </div>

  <button class="exercise__next btn--cta btn--cta--mini" id="ex-next" hidden>
    <span class="btn--cta__title">Seuraava</span>
    <span class="btn--cta__arrow">→</span>
  </button>
</div>
```

`.btn--cta--mini` is a smaller variant of the navy CTA — same pattern but compact (12 px × 16 px padding instead of 18 px × 20 px). Add to `button.css`.

### 4.4 CSS

```css
.exercise {
  padding: 0;
}
.exercise__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.exercise__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.exercise__sep {
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
}
.exercise__exit {
  background: transparent;
  border: 0;
  color: var(--ink-faint);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
}
.exercise__exit:hover { color: var(--ink); }
.exercise__progress {
  height: 1px;
  background: var(--border);
  margin-bottom: 32px;
  overflow: hidden;
}
.exercise__progress i {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 200ms var(--ease-out);
}

#ex-prompt {
  max-width: 32ch;
  margin: 0 0 12px;
}
.exercise__context {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  font-style: italic;
  color: var(--ink-soft);
  margin: 0 0 28px;
  max-width: 50ch;
}

.exercise__options {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid var(--border);
  margin-bottom: 24px;
}
.ex-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-display);
  transition: background 100ms var(--ease-out);
  border-left: 3px solid transparent;
  padding-left: 16px;
  width: 100%;
}
.ex-option:hover { background: var(--surface-2); }
.ex-option__l {
  flex: 0 0 28px;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-md);
  font-weight: 600;
  color: var(--ink);
  line-height: 1;
  padding-top: 2px;
}
.ex-option__t {
  flex: 1;
  font-size: var(--fs-h3);
  color: var(--ink);
  line-height: 1.4;
}
.ex-option.is-correct {
  border-left-color: var(--success);
  background: color-mix(in srgb, var(--success) 8%, transparent);
}
.ex-option.is-wrong {
  border-left-color: var(--error);
  background: color-mix(in srgb, var(--error) 8%, transparent);
}
.ex-option.is-disabled {
  cursor: default;
  opacity: 0.6;
}

.exercise__feedback {
  border-top: 1px solid var(--border);
  padding: 14px 0;
  margin-bottom: 14px;
}
.exercise__feedback-status { color: var(--ink); }
.exercise__feedback-status.is-correct { color: var(--success); }
.exercise__feedback-status.is-wrong { color: var(--error); }
.exercise__feedback-correct {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin-top: 4px;
}
```

### 4.5 Skeleton for loading

```html
<div class="exercise exercise--loading">
  <header class="exercise__top">
    <div class="exercise__meta">
      <span class="mono-num mono-num--sm" id="ex-counter">1 / 6</span>
      <span class="exercise__sep">·</span>
      <span class="eyebrow" id="ex-topic">PRETÉRITO</span>
    </div>
  </header>
  <div class="exercise__progress"><i style="width:16.66%"></i></div>

  <div class="skeleton-row skeleton-row--display"></div>
  <div class="skeleton-row skeleton-row--option"></div>
  <div class="skeleton-row skeleton-row--option"></div>
  <div class="skeleton-row skeleton-row--option"></div>
  <div class="skeleton-row skeleton-row--option"></div>
  <p class="exercise__loading-caption">Ladataan tehtävää…</p>
</div>
```

CSS for skeleton rows uses `--surface-2` background with a subtle `--border` outline. No shimmer animation by default (respect Spec 1's no-motion-flash guideline). If `prefers-reduced-motion: no-preference` and the skeleton's been visible >800 ms, fade in a subtle 1.5 s shimmer — but ship without shimmer first; only add if testing reveals the skeleton feels static.

```css
.skeleton-row {
  background: var(--surface-2);
  border-radius: var(--r-sm);
  height: 18px;
  margin-bottom: 8px;
}
.skeleton-row--display { width: 60%; height: 28px; margin-bottom: 28px; margin-top: 8px; }
.skeleton-row--option { width: 80%; height: 20px; margin-bottom: 14px; }
.skeleton-row--option:nth-child(odd) { width: 70%; }
.exercise__loading-caption {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
  color: var(--ink-faint);
  margin-top: 24px;
}
```

---

## 5. Results view (universal — vocab / grammar / reading)

Replaces `#screen-results` and `#screen-grammar-results` and `#screen-reading-results` markup with one editorial template.

### 5.1 Slot map

```
[ EYEBROW ]          "VALMIS · SANASTO · 14:11"
[ DISPLAY score ]    8 / 10                                   (mono-lg, --ink)
                     80%   ·   PRETÉRITO                      (small mono row underneath)
[ Coaching sub ]     "Hyvä — paranna pretéritoa." short coaching line
[ BREAKDOWN list ]   border-bracketed numbered rows:
                       01   Hablé                            ✓
                       02   Tuvieron        ✗ (tuvieran)
                       03   Pude                             ✓
                       ...
[ TWO CTAs ]         primary navy + secondary text-link
                     [ Uusi sarja samalla aiheella ]   [ Takaisin valintaan → ]
```

### 5.2 Markup

```html
<div id="screen-results" class="screen">
  <div class="results">
    <p class="eyebrow"><span id="res-mode-label">VALMIS · SANASTO</span> · <span class="mono-num mono-num--sm" id="res-time">14:11</span></p>
    <h1 class="display results__score">
      <span class="mono-num" id="res-score-num">8</span> / <span class="mono-num" id="res-score-tot">10</span>
    </h1>
    <p class="results__sub">
      <span class="mono-num mono-num--md" id="res-pct">80</span><small>%</small>
      <span class="exercise__sep">·</span>
      <span class="eyebrow" id="res-topic-label">PRETÉRITO</span>
    </p>
    <p class="results__coach" id="res-coach"></p>

    <div class="results__breakdown">
      <p class="eyebrow">Yhteenveto</p>
      <div class="results__list" id="res-list">
        <!-- JS-rendered rows: -->
        <div class="results__row results__row--correct">
          <span class="mono-num mono-num--md results__row-n">01</span>
          <span class="results__row-q">Hablé</span>
          <span class="results__row-mark" aria-label="Oikein">✓</span>
        </div>
        <div class="results__row results__row--wrong">
          <span class="mono-num mono-num--md results__row-n">02</span>
          <span class="results__row-q">
            <span>Tuvieron</span>
            <span class="results__row-correct">tuvieran</span>
          </span>
          <span class="results__row-mark" aria-label="Väärin">✗</span>
        </div>
      </div>
    </div>

    <div class="results__actions">
      <button class="btn--cta" id="res-btn-again">
        <span class="btn--cta__l">
          <span class="btn--cta__title">Uusi sarja</span>
          <span class="btn--cta__meta" id="res-again-meta">SAMALLA AIHEELLA · 20 SANAA</span>
        </span>
        <span class="btn--cta__arrow">→</span>
      </button>
      <a class="results__back" id="res-btn-back" href="#mode-vocab">Takaisin valintaan</a>
    </div>
  </div>
</div>
```

### 5.3 CSS

```css
.results {
  padding: 0;
}
.results__score {
  margin: 12px 0 4px;
  font-family: var(--font-mono);
  font-weight: 600;
}
.results__sub {
  font-family: var(--font-display);
  margin: 0 0 18px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.results__coach {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin: 0 0 32px;
  max-width: 50ch;
}

.results__breakdown { margin-bottom: 32px; }
.results__breakdown .eyebrow { margin-bottom: 8px; }
.results__list {
  border-top: 1px solid var(--border);
}
.results__row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.results__row-n { flex: 0 0 36px; color: var(--ink); }
.results__row-q {
  flex: 1;
  font-size: var(--fs-h3);
  font-family: var(--font-display);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.results__row-correct {
  font-size: var(--fs-body-sm);
  color: var(--success);
  font-style: italic;
}
.results__row-mark {
  flex: 0 0 24px;
  text-align: right;
  font-family: var(--font-mono);
  font-weight: 600;
}
.results__row--correct .results__row-mark { color: var(--success); }
.results__row--wrong .results__row-mark { color: var(--error); }

.results__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
.results__back {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  text-decoration: underline;
  text-align: center;
}
.results__back:hover { color: var(--ink); }
```

### 5.4 Coaching line generation

The coaching line `res-coach` is short context based on the score and the topic with the most errors **in this session** (not user-overall — session-local for relevance):

- ≥ 90%: `"Loistavaa. Pidä vauhtia yllä."`
- 70–89%, has session-weakest: `"Hyvä. Paranna {sessionWeakestLabel}-aihetta."`
- 70–89%, no errors at all: `"Hyvä. Pidä taso yllä."`
- 50–69%, has session-weakest: `"Tasolla. {sessionWeakestLabel} kaipaa toistoa."`
- 50–69%, no clear weakest (errors evenly spread): `"Tasolla. Kertaa kaikki aiheet."`
- < 50%: `"Tämä jäi vielä. Yritä helpompaa tasoa tai lyhyempää sarjaa."`

Implemented in a small new helper `generateCoachLine({ scorePct, sessionWeakestLabel })` — pure function, unit-tested. `sessionWeakestLabel` is the topic name from the current results object, computed by counting wrong answers per topic in the session.

---

## 6. File changes summary

| File | Change | Estimated LOC delta |
|---|---|---|
| `app.html` | rewrite 5 mode-page markup blocks; rewrite drill markup (`#screen-vocab` / `#screen-grammar` / `#screen-reading` `.exercise-inner`); rewrite `#screen-results` (and `#screen-grammar-results`, `#screen-reading-results` if separate) | ±400 |
| `css/components/mode-page.css` | NEW — shared mode-page template + briefing card + topic picker | +200 |
| `css/components/exercise.css` | NEW — drill view rules (eyebrow row, options, feedback) + skeleton | +250 |
| `css/components/results.css` | NEW — results view rules | +120 |
| `css/components/button.css` | add `.btn--cta--mini` and `.btn--ghost` modifiers | +30 |
| `css/components/dashboard.css` | no change |  |
| `js/screens/mode-page.js` | NEW — shared briefing + topic-picker + start CTA wiring | +180 |
| `js/screens/vocab.js`, `grammar.js`, `reading.js` | edit per-module drill render fns to emit new option rows + feedback layout; preserve all data IDs | ±150 each |
| `js/screens/verbsprint.js`, `writing.js` | edit topic-picker rendering only (drill stays as-is — see §3.6 + Out of scope §1) | ±40 each |
| `tests/mode-page.test.js`, `tests/results.test.js` | NEW — unit tests for `loadBriefing`, `generateCoachLine`, topic-picker active toggling | +120 |
| `js/ui/nav.js` | add the 5 mode screens to the rail-off set | ±10 |
| `sw.js` | bump CACHE_VERSION; add new CSS + JS files | ±8 |
| `design-system/DESIGN.md` | append §12 documenting mode-page + drill + results patterns | +60 |

`app.js`, `routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js` are untouched.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Briefing card data isn't available as one tidy API call | Reuse existing aggregates that the dashboard already fetches; if any field is unavailable, fall back to `mode-briefing--empty` rendering. Implementation can ship without all four briefing fields; the missing ones are added in follow-up commits. |
| Drill render JS in `vocab.js`/`grammar.js`/`reading.js` is dense and varied — markup change risks breaking each | Each module's `render*` function is changed independently with manual smoke-test of one drill of each type. Existing data IDs (`ex-prompt`, `ex-options`, etc. — actual names verified at implementation time) preserved. Any per-module quirk that doesn't fit the universal markup gets noted in implementation report and addressed by adding a small per-mode CSS rule rather than diverging the markup. |
| Topic-picker rows don't fit on small viewports if topic names are long | Single-column layout already collapses fine; long names wrap to two lines via the existing `.mode-topic__name` text styling. Tested at 360 px. |
| Results screen breakdown list could be long for 20-question vocab sets | Accept it. The list is the value; truncating hurts the user. Use `overflow-y: auto` on `.app-main-inner` (existing). |
| Verbsprint mode-page reuses the new template but its drill stays as-is — visual mismatch between mode-page and drill | Acceptable for Spec 2. Verbsprint drill restyle is Spec 3. The mode-page itself fits the editorial template fine. |
| Skeleton without shimmer might feel static during slow generation | Ship without shimmer first; instrument time-to-first-question; if the median exceeds 1.5 s, add a 1.5 s subtle fade-in animation on the skeleton blocks. |
| Adding a new `js/screens/mode-page.js` module — service-worker cache must include it | Add to `STATIC_ASSETS` in `sw.js` in the same commit that introduces it; bump cache. |

---

## 8. Testing

**Unit (vitest):**

- `tests/mode-page.test.js` — `loadBriefing(modeId)` returns expected shape; falls back to empty state when API errors; renders correct stat fields. Mocked fetch.
- `tests/results.test.js` — `generateCoachLine(pct, weakest)` returns expected coaching strings across the four score bands and handles missing weakest topic.

**Functional:** dashboard `app.js` wiring untouched. All existing IDs used by `vocab.js` / `grammar.js` / `reading.js` preserved (verified via grep diff in implementation). `npm test` passes (target: 1044 + new tests). `node --check` passes for every JS file in `js/screens/`.

**Visual:** screenshot each of the 5 mode-pages, the drill view (in 3 states: loading / answering / feedback), and the results view at 390 / 768 / 1280 / 1440 / 1920. Compare against reference mockups (created during implementation if needed). No automated visual regression — manual eyeball.

**Accessibility:**

- Topic-picker uses `role="radiogroup"` + `role="radio"` + `aria-checked`.
- Options in drill use `role="radiogroup"` + `role="radio"` + `aria-checked`. Letter labels (A/B/C/D) are visible text, not aria-labels.
- Eyebrow date uses `<time datetime="...">`.
- Mono numerals retain `aria-label` for unit context (`aria-label="8 oikein 10:stä"` etc.).
- `:focus-visible` on every topic-row, option, CTA, exit button.
- `prefers-reduced-motion` respected — skeleton has no shimmer at first; if added later, gated.

**Manual QA list at end of implementation:**

- All 5 mode-pages render with the briefing card filled (or empty-state for first-time mode).
- Topic-picker active row shows the mint left border; clicking another row reassigns it.
- Start CTA's mono meta updates when topic changes.
- Drill view shows skeleton with eyebrow already populated during loading.
- Drill view options highlight correct/wrong with mint/red left border + tinted background.
- Results screen shows score, breakdown, and the two CTAs.
- All five mode pages route to the right drill (no broken handlers).
- "Uusi sarja samalla aiheella" actually re-runs the same topic.
- "Takaisin valintaan" routes back to the correct mode-page.
- Rail is hidden (collapsed shell) on every mode-page, drill, and results screen.
- `npm run dev` boots cleanly; no console errors on any of the new screens.

---

## 9. Sequencing for implementation plan

The implementation plan should follow this rough phase order so each commit ships verifiable progress:

1. **Foundation**: 3 new CSS files (`mode-page.css`, `exercise.css`, `results.css`) wired into `app.html`; bump SW; no DOM consumers yet — visual unchanged.
2. **Mode-page template** (one mode at a time): vocab → grammar → verbsprint → reading → writing. Each commit rewrites one mode-page markup + tests it manually.
3. **Briefing card wiring**: new `js/screens/mode-page.js` module with `loadBriefing` + tests; wire to all 5 mode-pages; gracefully fall back to empty state if data missing.
4. **Topic picker JS**: rewrite per-module topic-card → topic-row rendering in `vocab.js`/`grammar.js`/`reading.js`/`verbsprint.js`/`writing.js`. Preserve all `data-topic` handling.
5. **Drill view markup + CSS**: rewrite `#screen-vocab` (or universal) drill markup; restyle options/feedback. Test vocab drill end-to-end.
6. **Drill view rendering**: update `vocab.js` render functions to emit new option markup. Repeat for `grammar.js` and `reading.js`.
7. **Results view**: rewrite `#screen-results` markup; add `generateCoachLine` helper + tests; wire to render functions.
8. **Polish + propagation rules**: add §12 to `design-system/DESIGN.md`. Final QA.

Each phase is a discrete commit set. Implementation plan in `writing-plans` will break these into bite-sized tasks.
