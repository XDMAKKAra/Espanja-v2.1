# Yhdistämistehtävät — matching / connect

Four sub-types sharing one renderer and one deterministic grader.

- **a.** FI ↔ ES word pairs (classic)
- **b.** Sentence halves (alku ↔ loppu)
- **c.** Question ↔ answer
- **d.** Word ↔ definition (ES ↔ ES, advanced)

Click-to-pair is the primary interaction (keyboard-accessible); drag is a progressive enhancement. Server grades via set-equality on pair IDs. **Zero AI cost.**

---

## 2.1 Schema

One shape for all four sub-types:

```jsonc
{
  "id": "gen:e1a2b3c4",
  "type": "yhdistaminen",
  "cefr": "B1",
  "level": "C",
  "topic": "vocab",
  "skill_bucket": "vocab",
  "prompt": "Yhdistä suomi-espanja -parit",
  "instruction": "Yhdistä parit",
  "payload": {
    "yhdistaminen": {
      "subtype": "fi_es",                       // "fi_es" | "sentence_halves" | "q_and_a" | "es_definition"
      "leftLang": "fi",                         // BCP-47 for `lang=` attr
      "rightLang": "es",
      "leftItems":  [ { "id": "L1", "text": "talo" }, { "id": "L2", "text": "kissa" }, ... ],
      "rightItems": [ { "id": "R1", "text": "gato" }, { "id": "R2", "text": "casa" }, ... ],
      "correctPairs": [                         // **SERVER-ONLY** — NEVER sent to client
        { "left": "L1", "right": "R2" },
        { "left": "L2", "right": "R1" }
      ],
      "count": 4,                               // 4, 5, or 6 pairs
      "shufflePolicy": "per_side"               // "per_side" | "diagonal" | "none"
    }
  }
}
```

**Client sees** `leftItems` and `rightItems` (IDs + text, pre-shuffled server-side per `shufflePolicy`). Client **never** sees `correctPairs`.

Existing dormant `/api/matching` shape ([routes/exercises.js:624-670](../routes/exercises.js#L624)) uses `pairs: [{ spanish, finnish }]` — the new schema generalizes this. Migration: `pairs[]` rewritten to `leftItems` / `rightItems` + `correctPairs` at the composer boundary.

---

## 2.2 Grading rubric

Fully deterministic. Server-side algorithm:

```
POST /api/grade
{ type: "yhdistaminen", exerciseId, payload: { pairs: [{left: "L1", right: "R2"}, ...] } }

Algorithm (server):
  1. Fetch item from cache/bank by exerciseId.
  2. Normalize submitted pairs: Set of "L{i}::R{j}" strings.
  3. Normalize correct pairs: same.
  4. compare:
       matched = |submitted ∩ correct|
       total   = |correct|
  5. per-pair band:
       matched    → 3 (täydellinen)
       mismatched → 0 (väärin)
  6. overall band:
       matched === total                         → "täydellinen"
       matched ≥ ceil(total * 0.67)              → "ymmärrettävä"
       matched ≥ ceil(total * 0.33)              → "lähellä"
       else                                       → "väärin"
```

Response:
```jsonc
{
  "correct": true,
  "band": "taydellinen",
  "score": 4,
  "maxScore": 4,
  "items": [
    { "left": "L1", "right": "R2", "correct": true },
    { "left": "L2", "right": "R1", "correct": true }
  ],
  "expectedPairs": [                  // returned only AFTER submission
    { "left": "L1", "right": "R2" },
    { "left": "L2", "right": "R1" }
  ],
  "feedback": "Kaikki oikein!",
  "latency_ms": 28
}
```

### Validation
- `submitted` must be an array of objects with `left`/`right` as known IDs. Unknown ID → 400.
- Each left ID used at most once; each right ID used at most once — if not, 400.
- Unsubmitted items allowed (student may skip). Those count toward `total` but are `matched: false`.

---

## 2.3 Server-side validation

**Fully server-authoritative.** The new dispatcher replaces the existing client-trust path for matching. The dormant `/api/matching` endpoint is retired — its handler becomes a shim that forwards to `/api/grade` with `type: "yhdistaminen"`.

Client submits the pair set only. Server re-checks. No `correctPairs` sent before submission. Submission is rejected if `correctPairs` somehow appears in the request body (defensive).

---

## 2.4 UI spec

### Mobile (390×844) — sub-type (a), 4 pairs
```
┌──────────────────────────────┐
│ ← Yhdistä parit          ⋯   │
├──────────────────────────────┤
│  Yhdistä suomi–espanja       │
│                              │
│  SUOMI            ESPANJA    │   column labels, 13 px muted
│  ┌──────────┐  ┌──────────┐ │
│  │  talo    │  │  gato    │ │   48 px tall chips, 8 px radius
│  │ (valittu)│  │          │ │   active chip: blue ring
│  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐ │
│  │  kissa   │  │  casa    │ │
│  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐ │
│  │  koira   │  │  libro   │ │
│  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐ │
│  │  kirja   │  │  perro   │ │
│  └──────────┘  └──────────┘ │
│                              │
│  Yhdistetty: 0/4             │
│  [Tarkista] ← disabled       │
└──────────────────────────────┘
```

### Desktop (1440×900) — same layout, 640 px column; chips 56 px tall.

### Sub-type variations (same component, different data)
- (a) `fi_es`: 4-6 short words, two languages.
- (b) `sentence_halves`: 4-5 pairs, longer chips (auto-wrap to 2 lines), `leftLang=es` / `rightLang=es`.
- (c) `q_and_a`: 3-4 pairs, question mark iconography on left chips.
- (d) `es_definition`: 3-4 pairs, both sides ES; small `lang="es"` hint on header.

Same `.matching-chip` CSS class across all four. Only the `count`, chip-width, and line-height are per-subtype.

### Interaction model (primary: click-to-pair)
1. Tap left chip → marks active (blue ring, `aria-pressed="true"`).
2. Tap right chip → creates a pair (line drawn between, colored by pair index from a palette), both become `paired` state.
3. Tap an already-paired chip → un-pairs both sides, returns them to idle.
4. Keyboard: `Tab` cycles all chips (left column first, then right). `Enter`/`Space` acts as tap. `Esc` clears active selection.

### Drag (progressive enhancement)
- Pointer-down on left chip + drag → ghost chip follows pointer.
- Drop onto right chip → create pair.
- Spring-back animation on cancel (release outside valid target): `useSpring` duration 0.4 s bounce 0.15.
- `@media (pointer: coarse)` disables drag on touch (click-to-pair only); drag is mouse-only.

### Feedback states
- **Idle** — no pairs; submit disabled.
- **Active-selection** — one chip selected on left, pulsing ring.
- **Pair-success** — on pair creation: both chips scale `0.97 → 1.02 → 1` with 250 ms spring, line drawn with 200 ms `clip-path` reveal (left-to-right). Pair color from a 6-color palette.
- **Submit-ready** — all paired; submit button highlights.
- **Correct (täydellinen)** — all pair-lines turn green, band pill top, `"Kaikki oikein!"`.
- **Mixed (ymmärrettävä/lähellä)** — correct lines green, wrong lines red; tapping a wrong line shows the correct partner.
- **Väärin** — all lines red, "Näytä ratkaisu" button reveals correct pairing with 400 ms reshuffle animation.
- **Error** — `showFetchError`.

### New skeleton variant `matching`
[js/ui/loading.js:36](../js/ui/loading.js#L36) adds:
```
.skeleton-matching
  > two columns × (count) rows of .skeleton-chip
  > .skeleton-hint "Ladataan tehtävää…"
```

### Touch targets / a11y
- Chips ≥ 48 px tall × ≥ 120 px wide.
- `role="button"`, `aria-pressed` for selection state.
- Pair-success: `aria-live="polite"` announces `"talo – casa yhdistetty"`.
- `prefers-reduced-motion`: pair-success keeps the opacity crossfade but drops scale + spring; lines drawn instantly.

---

## 2.5 Adaptive / SR / mastery integration

| Concern | Behavior |
|---|---|
| Adaptive signal | Overall band → correct/partial/wrong per SHARED §3. Confidence = matched/total. |
| SR cards | **One card per pair, keyed on the Spanish side.** Wrong pairs → SM-2 grade 1; correct pairs → grade 4. |
| Mastery | `skill_bucket: "vocab"` for (a)/(d), `"grammar"` for (b)/(c). Weight 1.0 per pair. |
| Path XP | 0.5 XP per correctly-matched pair (so a 4-pair all-correct = 2 XP). Matches MC batch equivalent. |
| Cold-start | First exposure: `count=4` regardless of level; `shufflePolicy="diagonal"` (first and last pair visually aligned) to telegraph the mechanic. |

---

## 2.6 Cost model

N/A — deterministic. Zero AI cost. Only generation cost applies:

- Generation prompt: ~300 tokens, max 800 out, ~400 out typical.
- Cost per item: ~$0.0004.
- 50% bank reuse → effective ~$0.0002/item.

Latency: p50 < 50 ms (local compute), p95 < 120 ms (DB fetch).

---

## 2.7 Content sourcing

- Generated via extended composer case for `yhdistaminen` in [lib/exerciseComposer.js:89](../lib/exerciseComposer.js#L89). Existing `matching` template adopted.
- For (a) `fi_es`: draw pairs from level-appropriate vocab.
- For (b) `sentence_halves`: generator prompt asks for 4 complete Spanish sentences and splits them.
- For (c) `q_and_a`: generator emits 3 Spanish Q-A pairs.
- For (d) `es_definition`: generator produces 3 Spanish word+definition pairs (monolingual).
- Topic taxonomy: reuse vocab topics for (a)/(d); grammar topics for (b)/(c).
- Seed bank: ~100 items across all four subtypes.

---

## 2.8 Abuse / edge cases

1. **Unknown ID in submission** — 400 with `err.*` telemetry.
2. **Duplicate left or right ID** (submitting `L1` twice) — 400.
3. **Unpaired items submitted** — counted as `matched: false`, no error. Submit button is gated client-side on `paired === count` but API must still accept for resilience.
4. **`correctPairs` in request body** (defensive) — rejected 400 + security telemetry.
5. **Rapid spam-submit** — per-user cooldown 1 s on this endpoint.
6. **Drag-ghost stuck after pointer leaves viewport** — pointer-cancel and blur listeners reset drag state.
7. **Multi-touch during drag** — ignore extra pointers after first contact (SHARED drag rules).
8. **Client manipulates pair color palette** — irrelevant; server doesn't read styling.
9. **Language of `rightItems` mismatches declared** — generator responsibility; server does not validate linguistic content.

---

## 2.9 Test plan

### Unit (`tests/grading/yhdistaminen.test.js`)
- All correct → `täydellinen`.
- 1/4 wrong → `ymmärrettävä` (3 ≥ ceil(4*0.67) = 3).
- 2/4 wrong → `lähellä` (2 ≥ ceil(4*0.33) = 2).
- 3/4 wrong → `väärin` (1 < 2).
- Unknown ID → 400.
- Duplicate ID → 400.
- `correctPairs` in body → 400.
- Order-independent: `[{L1,R2},{L2,R1}]` == `[{L2,R1},{L1,R2}]`.

### Fixtures
None required (deterministic grader).

### E2e
- Sub-type (a) happy path: 4 pairs, click-to-pair, submit, täydellinen.
- Sub-type (b) + (c) + (d) — smoke tests rendering correctly with long chips.
- Keyboard-only flow: Tab + Enter to pair all 4, submit, green.
- Drag on desktop: pair one via drag, three via click, submit.
- Spring-back on invalid drop.
- Pair-success animation runs at 60fps (frame-perf check).
- Server-trust regression: client submits wrong pairs but tampers response → server truth wins.
- Screenshots × (idle, one-paired, all-paired, correct, mixed, wrong, error) × 2 viewports × 4 subtypes.
- Reduced-motion: pair-success keeps opacity only; no scale bounce.
