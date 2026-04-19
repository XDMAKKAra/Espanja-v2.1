# Deferred — tracked against specific gates

Work that is *known* but deliberately not done in the gate where it might be expected. Each item names the gate that will close it so nothing floats as a free-standing TODO.

---

## D1. Five screens keep inline render paths — until Gate D

**Screens:** `js/screens/reading.js`, `js/screens/exam.js`, `js/screens/fullExam.js`
**Status:** Continue to render exercises inline (sniffing on `q.type === "multiple_choice"` etc.). Do **not** route through `js/screens/exerciseRenderer.js` yet.
**Gate that closes this:** **Gate D (tekstinymmärrys + käännös)** — when server-authoritative reading-comprehension grading lands, these three screens migrate to the dispatcher as part of that work. Rewiring them now and again in Gate D would be double work.
**Why OK to defer:** their existing renderers remain correct and tested (`tests/training/e2e-*.spec.js` stays green). No new-type wiring blocks on them.

**Screens:** `js/screens/placement.js`, `js/screens/learningPath.js`, `js/screens/dashboard.js`
**Status:** Not "exercise renderers" in the dispatcher sense — they are composite screens whose exercise-like interactions (level test, path progress, weekly summary) don't share the MC/gap-fill/matching lifecycle.
**Gate that closes this:** **Never in this pass.** Future work, not tracked against Pass 0 gates at all. If a later pass extends the dispatcher with a "composite screen" entry-point it may pull these in; until then they live on their own.
**Why OK to defer:** forcing them through an exercise dispatcher either over-extends the dispatcher API or introduces wrapper shims that someone rips out later. Both are worse than leaving the three alone.

---

## D2. A.2 split into 2a / 2b

**Status:** Commit 2a landed `js/screens/exerciseRenderer.js` + `js/renderers/monivalinta.js` as pure module additions with zero call sites.
**Gate that closes this:** **Gate A commit 2b** — wires `vocab.js`, `grammar.js`, `adaptive.js` to the dispatcher. Three highest-traffic screens only; D1 covers the other eight.
**Why split:** module creation and call-site rewiring are genuinely two concerns. Ship 2a without tests (nothing exercises the modules yet); tests land in 2b alongside actual wiring.
