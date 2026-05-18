# Non-Test Lesson Item-Type Mix Audit

**Date:** 2026-05-18  
**Scope:** All `lesson_*.json` files under `data/courses/{es,fr,de}/kurssi_*/` where `meta.lesson_type !== "test"`  
**Problems flagged:**
- Single item_type >= 70% of total items (MEDIUM) or >= 85% (HIGH)
- Total items >= 10 AND only 1–2 item_types used (LOW, if not already higher severity)
- 0 typed/translate/gap_fill items across all phases (mc-only, always >= HIGH)

---

## Summary by Language

| Language | Total lessons | Problematic | % problematic | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|---|
| ES (Spanish) | 81 | 18 | 22% | 16 | 2 | 0 |
| FR (French)  | 81 | 14 | 17% | 14 | 0 | 0 |
| DE (German)  | 81 | 13 | 16% | 11 | 0 | 2 |
| **TOTAL**    | **243** | **45** | **19%** | **41** | **2** | **2** |

---

## ES — Spanish (18 problematic / 81 total)

### HIGH (16 files)

| File | Lesson type | Total items | Type counts | Notes |
|---|---|---|---|---|
| data/courses/es/kurssi_1/lesson_8.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_1/lesson_9.json | writing | 3 | writing:3 | mc-only |
| data/courses/es/kurssi_2/lesson_8.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_2/lesson_9.json | writing | 3 | writing:3 | mc-only |
| data/courses/es/kurssi_3/lesson_9.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_4/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_5/lesson_9.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_5/lesson_10.json | writing | 1 | writing:1 | mc-only, very low item count |
| data/courses/es/kurssi_6/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_6/lesson_11.json | writing | 1 | writing:1 | mc-only, very low item count |
| data/courses/es/kurssi_7/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_7/lesson_11.json | writing | 3 | writing:3 | mc-only |
| data/courses/es/kurssi_8/lesson_6.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_8/lesson_7.json | writing | 3 | writing:3 | mc-only |
| data/courses/es/kurssi_8/lesson_8.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/es/kurssi_8/lesson_10.json | writing | 3 | writing:3 | mc-only |

### MEDIUM (2 files)

| File | Lesson type | Total items | Type counts | Dominant % | Notes |
|---|---|---|---|---|---|
| data/courses/es/kurssi_3/lesson_10.json | writing | 10 | typed:8, writing:2 | 80% typed | 2 types, typed dominates |
| data/courses/es/kurssi_4/lesson_11.json | writing | 10 | typed:8, writing:2 | 80% typed | 2 types, typed dominates |

### LOW

None.

---

## FR — French (14 problematic / 81 total)

### HIGH (14 files)

| File | Lesson type | Total items | Type counts | Notes |
|---|---|---|---|---|
| data/courses/fr/kurssi_1/lesson_8.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_1/lesson_9.json | writing | 1 | writing:1 | mc-only, very low item count |
| data/courses/fr/kurssi_2/lesson_8.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_2/lesson_9.json | writing | 3 | writing:3 | mc-only |
| data/courses/fr/kurssi_3/lesson_9.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_3/lesson_10.json | writing | 2 | writing:2 | mc-only |
| data/courses/fr/kurssi_4/lesson_10.json | writing | 2 | writing:2 | mc-only |
| data/courses/fr/kurssi_4/lesson_11.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_5/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_6/lesson_11.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_7/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_7/lesson_11.json | writing | 9 | mc:6, writing:3 | mc-only (no typed/translate/gap_fill), mc 67% |
| data/courses/fr/kurssi_8/lesson_6.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/fr/kurssi_8/lesson_7.json | reading | 2 | reading_mc:2 | mc-only |

### MEDIUM

None.

### LOW

None.

---

## DE — German (13 problematic / 81 total)

### HIGH (11 files)

| File | Lesson type | Total items | Type counts | Notes |
|---|---|---|---|---|
| data/courses/de/kurssi_1/lesson_9.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_2/lesson_9.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_3/lesson_9.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_3/lesson_10.json | writing | 5 | writing:5 | mc-only |
| data/courses/de/kurssi_4/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_5/lesson_9.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_5/lesson_10.json | writing | 3 | writing:3 | mc-only |
| data/courses/de/kurssi_6/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_7/lesson_10.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_7/lesson_11.json | writing | 8 | mc:5, writing:3 | mc-only (no typed/translate/gap_fill), mc 63% |
| data/courses/de/kurssi_8/lesson_6.json | reading | 2 | reading_mc:2 | mc-only |
| data/courses/de/kurssi_8/lesson_7.json | reading | 2 | reading_mc:2 | mc-only |

### MEDIUM

None.

### LOW (2 files)

| File | Lesson type | Total items | Type counts | Dominant % | Notes |
|---|---|---|---|---|---|
| data/courses/de/kurssi_6/lesson_5.json | grammar | 58 | gap_fill:38, mc:20 | 66% gap_fill | 2 types only, >=10 items; has gap_fill so not mc-only |

> Note: de/kurssi_8/lesson_7.json appears twice in raw output — counted once above (HIGH, mc-only).

---

## Patterns Observed

1. **All `reading` lesson-type files** use exclusively `reading_mc` items — consistently 2 items per file. These are thin stubs; none contain typed/translate/gap_fill.
2. **All `writing` lesson-type files** use exclusively `writing` items (or mc + writing with no productive types). Writing items are not counted as typed/translate/gap_fill, triggering mc-only flags throughout.
3. **The two ES MEDIUM files** (kurssi_3/lesson_10, kurssi_4/lesson_11) are writing lessons that mix `typed` + `writing` — functionally better than pure-writing files but still 2-type and typed-heavy.
4. **DE kurssi_6/lesson_5** is the only grammar lesson flagged — 58 items but only mc + gap_fill, missing typed/translate variety.
5. **FR kurssi_7/lesson_11 and DE kurssi_7/lesson_11** are notable: writing lessons that use `mc` items as scaffolding but still lack any typed/translate/gap_fill productive output.
