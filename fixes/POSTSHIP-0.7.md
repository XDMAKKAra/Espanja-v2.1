# Pass 0.7 — Post-ship notes

## What changed

The per-exercise result screen no longer shows a YO-arvosana. A single 11-answer vocab drill cannot produce a valid YTL grade — showing "L" after one exercise was dishonest and eroded trust in the adaptive claims. The screen now answers three questions in order: how did it go (raw score + time), what did you learn (per-item ✓ Vahvistit / ✗ Harjoittele vielä), and what's next (three buttons: primary "Uusi samanlainen harjoitus →", secondary "Jaa tulos", tertiary "Takaisin etusivulle" text link).

The YO-arvosana prediction moved to the dashboard only, gated behind a data-coverage ladder implemented in `lib/gradeThreshold.js`: <10 exercises → placeholder copy, 10–29 → "Alustava taso", 30–99 or ≥100-without-full-coverage → "Arvioitu yo-taso" with a 0–5 confidence bar, ≥100 with ≥10 in each of vocab/grammar/reading/writing → "Arvioitu yo-arvosana" + confidence bar + "päivitetty {date}" caption. The widget is a button that opens an explainer modal listing per-section coverage and the caveat `Tämä on arvio nykyisen harjoitteludatan perusteella, ei virallinen YTL-arvio.`

## Deferred TODOs

- **Concept grouping is item-level for now.** The "Harjoittele vielä" list shows the raw Spanish word/phrase for each missed item (deduped) rather than a higher-level concept like "saber vs conocer" or "epäsäännöllinen tener". Concept tagging needs a taxonomy pass over exercise generation (`routes/exercises.js` + bank) before we can group meaningfully. Until then, students see the items they missed, not the pattern behind them.
- **"Jatka: {weakest-concept}-drilli →"** primary CTA is deferred with concept grouping — currently the primary is a generic "Uusi samanlainen harjoitus". A targeted-drill CTA requires both concept tagging and a backend endpoint that generates a drill constrained to a concept.
- **Other modes (grammar, reading, writing, exam)** still use their own result screens with their own grade displays. The `/api/grade` endpoint is still present but unused by the vocab flow — leave it for now since grammar/reading legacy screens may still import it indirectly. Sweep it out in a follow-up when those modes get the same treatment.
