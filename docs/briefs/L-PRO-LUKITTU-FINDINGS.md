# L-PRO-LUKITTU-1 — Findings

**Status:** investigated 2026-05-22, **not a Pro bug** — UI-text problem.

## Question

v283 audit P2 reported: "Pro user sees Lukittu on courses 2-7 (= design intent)".
Marcel questioned: Pro pays, why does he see Lukittu?

## What I found

**Content state:** all 8 Espanja courses have lesson files
(`data/courses/es/kurssi_{1..8}/` each contains 10-12 lesson JSONs).
Not a content gap — `kurssit 2-7 Lukittu` is real UI behaviour, not a stub.

**Lock logic:** `routes/curriculum.js:179` computes
`isUnlocked = req.user ? prevPassed : (k.sort_order === 1)`. The gate
is **sequential progression**, not Pro tier. Every user (Pro or Free)
must pass course N's kertaustesti to unlock course N+1.

**Pro vs Free is enforced elsewhere** (Pro unlocks all *lessons* inside
an open course; Free hits the paywall on the second lesson). The
course-level lock is independent of Pro.

So the audit's framing was off:

- (a) NOT a bug — Pro is not supposed to skip the kertaus gate.
- (b) NOT a content gap — courses exist.
- (c) IS a UI-language problem — the chip text "Lukittu" + the dim
  styling reads exactly like a paywall, which is why both Marcel and
  the audit pattern-matched it as a Pro bug.

## Recommendation

Rename the chip state from "Lukittu" to **"Avautuu vuorollaan"**
(opens in turn) so the gate reads as progression, not paywall. Keep
the dim styling — it still signals not-yet-reachable. Also update
the `aria-label` so screen readers announce the progression reason
instead of "lukittu" (locked, which has the same paywall connotation
in Finnish UI).

Out of scope for this loop: any visual lock icon (none exists in the
current `op-row` styling — just colour-dim). If a glyph is added
later, prefer a step-counter chip ("3 →") over a padlock.

## Applied

- `js/screens/oppimispolkuIndex.js renderRow`: `"Lukittu"` →
  `"Avautuu vuorollaan"`. Aria-label re-uses the same status text so
  the announcement matches what sighted users read.

This makes the audit P2 line "Pro sees Lukittu" no longer a question.
