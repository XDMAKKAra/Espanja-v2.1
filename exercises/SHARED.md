# Shared concerns across new exercise types

Cross-cutting decisions that every DESIGN.md assumes. Read this first.

---

## 1. Unified schema base

Every exercise — monivalinta and all five new types — is described by the same base. Types extend but never rename base fields.

```js
/**
 * @typedef {Object} ExerciseBase
 * @property {string}   id              UUID or "bank:{row_id}" or "gen:{sha8}"
 * @property {string}   type            "monivalinta" | "aukkotehtava" | "lauseen_muodostus"
 *                                      | "kaannos" | "tekstinymmarrys" | "yhdistaminen"
 * @property {"A2"|"B1"|"B2"} cefr      CEFR tag for content
 * @property {"I"|"A"|"B"|"C"|"M"|"E"|"L"} level  Puheo letter level (maps roughly to CEFR)
 * @property {string}   topic           Topic key — matches keys in TYPE_TOPIC_AFFINITY
 * @property {string[]} [topics]        Multi-topic (mixed review / exam)
 * @property {"vocab"|"grammar"|"comprehension"|"production"} skill_bucket
 * @property {string}   prompt          The main stem shown to the student (Finnish or Spanish per type)
 * @property {string}   [instruction]   Finnish instruction banner ("Täydennä aukko", "Yhdistä parit")
 * @property {string}   [context]       Short context sentence (required on vocab "context" subtype)
 * @property {string}   [explanation]   Post-submit teaching copy (Finnish)
 * @property {string}   [source]        "bank" | "generated" | "seed"
 */
```

Per-type payloads live on a single discriminated field `payload` keyed by `type`, so the renderer can do `dispatch[ex.type](ex.payload)`. Existing monivalinta items are migrated lazily: if `payload` missing, synthesize it from `options`/`correct` at read time.

Rationale: adding a sixth type later is one payload definition + one renderer + one grader case. Nothing else.

---

## 2. Unified server grading endpoint

**Decision: one endpoint, one dispatcher. Not per-type endpoints.**

```
POST /api/grade
{
  "exerciseId": "gen:abc12345",
  "type": "aukkotehtava",
  "payload": { ... type-specific student submission ... },
  "context": { "topic": "ser_estar", "mode": "adaptive" }
}
→ {
  "correct": false,
  "partial": true,          // partial-credit band
  "band": "lähellä",        // "täydellinen" | "ymmärrettävä" | "lähellä" | "väärin"
  "score": 1,               // 0-3 per lib/grading.js band
  "maxScore": 3,
  "feedback": "...",        // Finnish
  "corrections": [...],     // type-dependent
  "latency_ms": 412
}
```

Why one endpoint:
- **Kills the server-trust audit flag in one place.** The dispatcher is the authoritative grader; clients submit raw input, the server recomputes correctness. The existing `/api/grade` for MC (which trusts client `{correct,total}`) is retired as the dispatcher grows — the route handler becomes a thin deprecation shim that just calls the dispatcher.
- **Single cache-key scheme.** SHA-256 of `(type + normalizedInput + graderVersion)`.
- **Single latency + error budget** to monitor.
- **Adding a 6th type is one file** under `lib/grading/<type>.js`.

File layout for Step 2:
```
lib/grading.js                  (existing — YTL thresholds only)
lib/grading/dispatcher.js       (new — switch on type, calls per-type grader)
lib/grading/monivalinta.js      (new — server-side MC grader; retires client trust)
lib/grading/aukkotehtava.js     (new — Levenshtein + synonym list + diacritic fold)
lib/grading/yhdistaminen.js     (new — pair-set equality, deterministic)
lib/grading/ai.js               (new — AI-graded shared infra: retry, JSON-schema coerce, fallback)
lib/grading/lauseenMuodostus.js (new — wraps ai.js with type-specific prompt)
lib/grading/kaannos.js          (new — wraps ai.js)
lib/grading/tekstinymmarrys.js  (new — wraps ai.js, N-question rubric)
```

### Client renderer dispatcher
Parallel structure on the client:
```
js/screens/exerciseRenderer.js  (new — dispatches on ex.type)
js/renderers/monivalinta.js     (new — extracted from vocab.js/grammar.js)
js/renderers/aukkotehtava.js    (new)
js/renderers/yhdistaminen.js    (new — reused by matching sub-types a-d)
js/renderers/lauseenMuodostus.js (new)
js/renderers/kaannos.js         (new)
js/renderers/tekstinymmarrys.js (new)
```

Existing screens (`vocab.js`, `grammar.js`, `adaptive.js`, `reading.js`) call `renderExercise(ex, container, opts)` from the dispatcher instead of sniffing shapes.

---

## 3. Partial-credit bands (reused)

Single source: extends the bands landed in the last pass.

| Band | Score (0-3) | YO meaning | Streak? | XP? |
|---|---|---|---|---|
| `täydellinen` | 3 | full credit | ✓ | ✓ |
| `ymmärrettävä` | 2 | accepted, full credit | ✓ | ✓ |
| `lähellä` | 1 | understood, not accepted | ✗ | ✓ (half) |
| `väärin` | 0 | not credited | ✗ | ✗ |

All five new types emit one of these four bands. UI copy is identical across types (Finnish labels above).

---

## 4. Skeleton + loading reuse

From [js/ui/loading.js:36-86](../js/ui/loading.js#L36):

| New type | Skeleton kind | New CSS? |
|---|---|---|
| Aukkotehtävä | `"exercise"` | no |
| Lauseen muodostus | `"writing-task"` | no |
| Käännös FI→ES | `"writing-task"` | no |
| Tekstinymmärrys | new `"reading-passage"` variant (passage bars + N question bars) | yes — one `.skeleton-passage` class |
| Yhdistäminen | new `"matching"` variant (2 columns × 4 rows of chips) | yes — `.skeleton-matching` |

Every type uses `showFetchError(container, { title, retryFn })` on network/model failure. Copy: `title="Yhteys katkesi"`, `subtext="Tarkista verkko ja yritä uudelleen"`, button `"Yritä uudelleen"`.

---

## 5. Latency budget per type

| Type | Grader | p50 target | p95 target | Notes |
|---|---|---|---|---|
| Monivalinta | deterministic | 30 ms | 120 ms | Server-side round-trip only. |
| Aukkotehtävä | deterministic + AI fallback | 50 ms / 900 ms (fallback) | 200 ms / 1800 ms | Fallback only when deterministic checks all miss. |
| Yhdistäminen | deterministic | 30 ms | 120 ms | Set equality on pair IDs. |
| Lauseen muodostus | AI | 1.4 s | 2.8 s | Under writing-grader ceiling (~2 s p50 last pass). |
| Käännös FI→ES | AI | 900 ms | 2.0 s | Already exists server-side — baseline. |
| Tekstinymmärrys | AI, N answers / call | 2.0 s | 4.0 s | **FLAG:** exceeds writing ceiling. Mitigation: single call graded all N answers at once. See DESIGN. |

---

## 6. Telemetry (PostHog)

One event per exercise submission, one event per load failure.

```js
posthog.capture('exercise_submitted', {
  type,          // "aukkotehtava" | ...
  topic,         // "ser_estar"
  level,         // "B"
  correct,       // bool (server-authoritative)
  band,          // "täydellinen" | ...
  partial,       // bool
  latency_ms,    // grader latency (AI types) or 0 (deterministic)
  cache_hit,     // bool (for AI types)
  retry_count,   // 0 if first attempt, 1+ if user clicked "Yritä uudelleen"
  mode,          // "vocab" | "grammar" | "adaptive" | "exam" | "mastery_test"
});

posthog.capture('exercise_fetch_failed', {
  type, topic, reason, retry_count
});
```

Naming convention: `exercise_*` for per-item events, `session_*` for aggregates. No PII.

---

## 7. Finnish UI string table

Every user-facing string. No English in UI code. This table lives here so new types pull from one place.

### Feedback bands
| Key | Finnish |
|---|---|
| `band.taydellinen` | "Täydellinen!" |
| `band.ymmarrettava` | "Ymmärrettävä" |
| `band.lahella` | "Lähellä!" |
| `band.vaarin` | "Vielä harjoittelua" |

### Buttons
| Key | Finnish |
|---|---|
| `btn.submit` | "Tarkista" |
| `btn.next` | "Seuraava" |
| `btn.skip` | "Ohita" |
| `btn.retry` | "Yritä uudelleen" |
| `btn.hint` | "Vihje" |
| `btn.showAnswer` | "Näytä oikea vastaus" |
| `btn.pair` | "Yhdistä" |

### Instructions (per type)
| Key | Finnish |
|---|---|
| `aukko.instruction` | "Täydennä aukko" |
| `aukko.placeholder` | "Kirjoita vastaus…" |
| `lauseen.instruction` | "Muodosta lause, joka sisältää annetut sanat" |
| `lauseen.wordChip` | "Vaadittu sana" |
| `kaannos.instruction` | "Käännä espanjaksi" |
| `luku.instruction` | "Lue teksti ja vastaa suomeksi" |
| `luku.questionN` | "Kysymys {n}/{total}" |
| `yhdista.instruction` | "Yhdistä parit" |

### Error copy
| Key | Finnish |
|---|---|
| `err.network.title` | "Yhteys katkesi" |
| `err.network.sub` | "Tarkista verkko ja yritä uudelleen" |
| `err.model.title` | "Arvioija ei vastannut" |
| `err.model.sub` | "Yritä hetken päästä uudelleen" |
| `err.empty` | "Kirjoita vastaus ensin" |
| `err.wrongLang` | "Kirjoita vastaus espanjaksi" |
| `err.tooLong` | "Vastaus on liian pitkä" |

### Hints
| Key | Finnish |
|---|---|
| `hint.spelling` | "Kirjoitusvirhe — melkein oikein" |
| `hint.accent` | "Aksentti puuttuu tai on väärin" |
| `hint.wordOrder` | "Tarkista sanajärjestys" |
| `hint.meaning` | "Merkitys hieman sivussa" |

All strings live in `js/ui/strings.js` (new file in Step 2) and are imported by renderers. Keys use dot notation. No inline Finnish strings in new renderer code.

---

## 8. Server-trust rollout impact

The existing gap-fill / matching / reorder endpoints (listed in ENGINE §1 as "partially implemented, not rendered") do not currently expose the server-trust flaw in production **because the UI never calls them**. They're dormant.

| Scenario | Flaw status |
|---|---|
| Ship new types via new dispatcher + legacy endpoints untouched | **Unchanged** (old endpoints still dormant). |
| Ship new types + legacy `/api/grade` stays trusting for monivalinta | **Partially unfixed** — monivalinta still exploitable. |
| Ship new types + retire legacy `/api/grade` behind dispatcher shim | **Fully fixed** (recommended). |

**Recommendation:** Step 2 retires `/api/grade` as a shim that forwards to the dispatcher. Client-side monivalinta grading is removed — the renderer submits `{chosenOptionIndex}` and the dispatcher authoritatively grades. Matching sub-type (a): the new deterministic grader replaces the dormant `/api/matching` endpoint at the same time, so shipping the new matching backports a fix to the old UI if it ever gets revived.

Shipping these five types therefore **improves** the flaw rather than replicating it, provided the dispatcher-shim retirement lands in the same pass.
