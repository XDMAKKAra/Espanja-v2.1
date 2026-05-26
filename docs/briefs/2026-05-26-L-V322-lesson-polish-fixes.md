# BRIEF: L-V322 — Lesson + course-detail polish (color-contrast + ARIA list)

**Päivä:** 2026-05-26 ilta
**Edellinen:** L-V321 (commit `70198cc` fix + `dc20e30` re-audit) — logged-in entry-pinnat 0 touch-target-rikkomusta. V321:n jälkeen Aloitus + Oppimispolku rendöityvät puhtaina.
**Triggeri:** Lesson-runner + course-detail-pinnat lasten:
- Aloitus (`#/koti`): 0 axe ✅
- Oppimispolku (`Avaa oppimispolku`-click): 0 axe ✅
- **Lesson-runner aktiivinen + vocab/exam-pinnat: 12 axe-rikkomusta jokainen** ← P0

**Status:** pohja-audit ajettu, 92 axe-violationia tunnistettu jotka jakautuvat 2 sääntöön. Skripti `scripts/polish-audit-lesson.mjs` toimii uudelleen-ajettavasti.

---

## Pohja-audit-tulokset

`docs/audits/2026-05-26-polish-audit-lesson.{json,md}` + `screenshots/polish-audit-lesson-2026-05-26/`.

**Headlines:**

| Mittari | Lukema |
|---|---|
| Critical axe-violations | **8** |
| Serious axe-violations | **84** |
| Moderate / minor | 0 / 0 |
| Console errors | 0 |
| Network errors | 0 |
| Touch targets <44 | 0 (V321-fix piti) |

**Per-pinta:**

| Pinta | Desktop axe | Mobile axe |
|---|---|---|
| x01-aloitus | 0 | 0 |
| x02-oppimispolku | 0 | 0 |
| x03-lesson-runner-active | 12 | 11 |
| x04-vocab-mode | 12 | 11 |
| x05-exam-start | 12 | 11 |
| x06-exam-running | 12 | 11 |

8 pinnan-renderöintiä joissa course-detail-rakenne näkyy → 12 axe-osumaa per pinta.

---

## Konkreettiset löydökset (vain 2 rule:a, 92 osumaa)

### P0 — `color-contrast` (serious, 84 nodes)

`.op-progress-text` (`<span class="op-progress-text mono-num">1 / 10 oppituntia · 10 %</span>`) renderöityy värillä `#928a89` cream-taustalla `#fcfcfa`. **Kontrasti 3.28:1** — WCAG vaatii **≥4.5:1** normal-text:lle.

**Fix:** muuta `.op-progress-text`-värin tummemmaksi.

CSS-tiedosto: `css/components/library-shelf.css` (grep tunnisti).

Suositus: vaihda väri brick-color tokeniin tai darken-arvoon:
```css
.op-progress-text {
  color: var(--ed-ink-2, #4a4341); /* 7.5:1 cream:lla */
  /* tai */
  color: #6b6361; /* 4.62:1 — minimi */
}
```

Sample-näppi: `#6b6361` saavuttaa 4.62:1 (WCAG AA pass). `#4a4341` saavuttaa 7.5:1 (AAA-pass). Valitse jälkimmäinen jos halut polish-tason.

### P0 — `aria-required-children` (critical, 8 nodes)

`<ol class="op-list" role="list">` -elementin sisällä on `<a tabindex="...">` -lapsia jotka eivät ole sallittuja `role="list"`-elementissä. Lisäksi `aria-busy="true"` näkyy loader-tilassa.

**Failure-summary:**
```
Element has children which are not allowed: a[tabindex]
Element uses aria-busy="true" while showing a loader
```

**Fix:** wrap each `<a>`-child `<li>`-elementtiin, tai poista `role="list"` (ol on jo native list).

Tiedostot (grep tunnisti):
- `js/screens/courseDetail.js`
- `js/screens/oppimispolkuIndex.js`

Etsi `op-list`-rendöinti, korjaa rakenne:

```js
// before
`<ol class="op-list" role="list">
  ${lessons.map(l => `<a class="op-row is-clickable" href="...">...</a>`).join("")}
</ol>`

// after — wrap in <li>
`<ol class="op-list">
  ${lessons.map(l => `<li><a class="op-row is-clickable" href="...">...</a></li>`).join("")}
</ol>`
```

Poistettava `role="list"` ja lisätty `<li>`-wrap on yksinkertaisin korjaus.

Jos `aria-busy="true"` on tarkoituksellinen loader-tilaa varten, säilytä se mutta varmista että rakenne on validi muutoin. axe-rule sallii aria-busy:n kun children ovat valideja.

---

## Mitä writer tekee

### Step 1: Re-pull origin/main

### Step 2: Korjaa color-contrast

`css/components/library-shelf.css` → `.op-progress-text { color: #4a4341; }` (tai vastaava tokenisoitu darken).

Jos `.op-progress-text` on jaettu mode-page:lla pickin kanssa joka käyttää eri väritystä, varmista että sample-text:in nykyiset käyttöpaikat eivät rikkoudu.

### Step 3: Korjaa aria-required-children

`js/screens/courseDetail.js` ja `js/screens/oppimispolkuIndex.js` → etsi `<ol class="op-list">`-templaatti, wrappaa `<a>`-lapset `<li>`-elementteihin. Poista `role="list"` (ol:lla on implisiittinen role).

Tarkista että:
- Wrap ei riko CSS:ää (`.op-list > li > .op-row` voi vaatia CSS-säätöä jos selektorit ovat olleet `.op-list > a.op-row`)
- Click-handlerit toimivat edelleen (delegaatio kohdistuu ehkä `op-row`-elementtiin, jolloin `<li>`-wrap ei riko mitään)

### Step 4: Re-run audit

```bash
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit-lesson.mjs
```

Verifioi:
- color-contrast 84 → **0**
- aria-required-children 8 → **0**
- Console + network pysyy 0

### Step 5: Commit + push

```
feat(a11y): L-V322 lesson + course-detail polish — contrast + ARIA list

- .op-progress-text color #928a89 → #4a4341 (3.28:1 → 7.5:1 contrast)
- <ol class="op-list" role="list"> children wrapped in <li> elements,
  role="list" removed (ol is implicit list)

Before: 8 critical + 84 serious axe-violations on lesson/vocab/exam
After:  [run audit, fill in]
```

### Step 6: Ledger

`## L-V322-LESSON-POLISH-PASS-1` -rivi IMPROVEMENTS.md:hen.

---

## Acceptance criteria

1. Re-run audit ajaa loppuun
2. **color-contrast-rikkomukset 84 → 0**
3. **aria-required-children-rikkomukset 8 → 0**
4. Console + network pysyy 0
5. Touch-target pysyy 0 (V321:n fix:t eivät rikkoudu)
6. Bug-scan-spec PASS (ajetaan ennen committia, koska JS-rendöinti-rakenne muuttuu)
7. Brand-spec PASS

---

## Out-of-scope

- **Lesson-runner mid-flow:n syvempi audit** (exercise-tyypit MC/fill/audio/writing) — eri brief L-V324
- **Performance audit Lighthouse:lla** — L-V323
- **Lesson-content audit (LLM-pohjainen)** — L-V325, isoin

---

## Skill-stack writerille

TESTING-S/M (audit re-run + 2 axe-rule:n korjaus):
- `webapp-testing`
- `superpowers:verification-before-completion`

FRONTEND-S (CSS-väri + JS-template-rakenne, ei uusi komponentti):
- `frontend-design`
- `ui-ux-pro-max` (a11y-kontrasti-säännöt)

Total stack: 4 skilliä (pienin V-loop tähän mennessä).

---

## Päätös-rekap

L-V322 on **pieni mutta tärkeä** polish-loop:
- 92 axe-rikkomusta, joista 2 rule:a
- Color-contrast on yksittäinen CSS-arvon vaihto
- ARIA-list on yksittäinen JSX/template-template-rakenteen siisteinen
- Arvioitu työ writerille: **1-2 tuntia**

V321 → V322 yhdessä → logged-in koko app on a11y-clean.
