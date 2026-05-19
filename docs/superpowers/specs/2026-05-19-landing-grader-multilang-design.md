# Landing — `grader-card` + `grade-flow` multilingual redesign

**Status:** approved (brainstorm 2026-05-19) — pending user spec review
**Surfaces:** `index.html` sections `#nayte` (Näyte arvioinnista) + `.grade-flow` (Yksi kirjoitustehtävä, kolme vaihetta)
**Languages:** es, fr, de (all three target languages of Puheo)

---

## Problem

Both landing sections currently show Spanish-only content. The grader card claims `13 / 20 → Arvosana E`, which is wrong on two counts:

1. YTL lyhyt oppimäärä B-kieli writing tasks are scored **0–33 p** (A-tehtävä, lyhyt) and **0–66 p** (B-tehtävä, pitkä). There is no 20-point task.
2. A single writing task's score does not determine the koe-arvosana. The final grade depends on the **combined total** of kuullun, luetun and writing, against pisterajat published per session.

The "Arvosana E" leima next to one writing sample is misleading. The "Espanjan ylioppilaskirjoituksia" claim across all three languages reads as if Puheo only handles Spanish.

## Goal

Replace both surfaces so they:

- Present all three target languages with equal weight
- Show both lyhyt (33 p) and pitkä (66 p) YTL task formats
- Score using real YTL scoring (no fake 20-point scale)
- Avoid claiming a single-task arvosana; report points + sanallinen kontribuutio
- Use everyday, relatable lukiolais-aiheita

## Solution overview

### 1. `#nayte` — triptyykki, three cards in a row

| Slot | Kieli | Tehtävätyyppi | Max | Aihe |
|---|---|---|---|---|
| 1 | **ES** | Lyhyt — sähköposti | 33 p | Synttärikutsu kaverille (rewrite of current sample) |
| 2 | **FR** | Pitkä — mielipidekirjoitus | 66 p | Puhelinten käyttö oppitunnilla — onko järkevää? |
| 3 | **DE** | Lyhyt — blogikommentti | 33 p | Vastaus blogiin välivuodesta ulkomailla |

Mix of task types covers both YTL skaalat without needing six cards. Each language gets one first-class example.

### 2. `.grade-flow` — rotate languages across the three steps

| Step | Heading | Preview content | Kieli |
|---|---|---|---|
| 1 · Kirjoita | "Aito YO-tehtävä, aikarajalla." | Sähköposti-preview (sama teksti kuin ES-näytekortti) | ES |
| 2 · Tekoäly arvioi | "Sama rubriikki kuin YTL:n sensoreilla." | Mini-pistejakauma (sub-scores summing to 43 / 66, mielipide-essee) | FR |
| 3 · Opit virheen | "Suomeksi, sillä termillä jota lukiossa käytetään." | Yksittäinen virhe-selitys (saksan sivulauseen sanajärjestys, blogikommentista) | DE |

Tämä rotaatio esittää 3 kieltä × 3 vaihetta luonnollisesti, ilman päällekkäisyyttä näytekorttien kanssa.

## Content — full source texts per card

### ES — lyhyt, 33 p — synttärikutsu

**Tehtävänanto (näkyy badge:ssa):** *Sähköposti ystävälle · 160–240 merkkiä · espanja*

```
Hola Marta,

¡Te escribo para invitarte a mi cumpleaños el sábado que viene!
La fiesta empieza a las siete en mi casa. Mi madre va a cocinar
mucha comida y [tendrémos] también música. [Espero que vienes]
con tu hermano. La semana pasada [estaba en Madrid] con la clase
y [era muy divertido]. Dime antes del miércoles si puedes venir.

¡Hasta pronto!
Aino
```

**Virheannotaatiot** (4):

1. `tendrémos` → **tendremos** · *oikeinkirjoitus* — painollinen tavu on toiseksi viimeinen, ei tarvita aksenttia
2. `Espero que vienes` → **Espero que vengas** · *rakenne* — subjunktiivi `esperar que` -rakenteen jälkeen kun toivot jonkun tekevän jotakin
3. `estaba en Madrid` → **estuve en Madrid** · *rakenne* — loppuun saatettu, ajallisesti rajattu matka → preteriti (`estuve`), ei imperfekti
4. `era muy divertido` → **fue muy divertido** · *rakenne* — kokonaisarvio päättyneestä tapahtumasta → preteriti

**Positiivinen** (1):
- `Te escribo para invitarte` — selkeä syy-rakenne (`para` + infinitiivi)

**Osa-aluepisteet (33 p):**
- Viestinnällisyys: 8 / 9 — kaikki tehtävänannon kohdat (aika, paikka, ruoka, vastauspyyntö)
- Kielen rakenteet: 4 / 9 — toistuvia preteriti/imperfekti- ja subjunktiivivirheitä
- Sanasto: 7 / 9 — sopiva rekisteri, lukio-taso
- Kokonaisuus: 5 / 6 — tervehdys ja lopetus paikallaan, sidos vähäinen
- **Yhteensä: 24 / 33**
- Sanallinen: *Vastaa tyypillisesti C–M-tason kirjoittajan suoritusta. Loput pisteet tulisivat aikamuotojen hallinnasta.*

### FR — pitkä, 66 p — mielipidekirjoitus

**Tehtävänanto:** *Mielipidekirjoitus · 240–400 merkkiä · ranska · "Faut-il interdire les téléphones portables au lycée?"*

```
Aujourd'hui, beaucoup de lycées en France et en Finlande interdisent
les téléphones portables pendant les cours. Je trouve que cette règle
est raisonnable mais difficile à appliquer.

D'un côté, le téléphone distrait l'attention pendant le cours. Mes
camarades regardent souvent leurs notifications et ils [oubliaient]
de noter ce que le prof dit. De l'autre côté, le téléphone est utile
pour chercher un mot dans un dictionnaire ou pour traduire une phrase
rapidement.

À mon avis, [il faut que les profs trouvent] un équilibre: le téléphone
peut rester dans le sac, mais on peut le sortir [quand il y a besoin].
Si on [avait des règles claires], on [respecterait] mieux la règle.
```

**Virheannotaatiot** (2):

1. `oubliaient` → **oublient** · *rakenne (aikamuoto)* — kuvaa nykyhetken toistuvaa tilannetta → présent, ei imparfait
2. `quand il y a besoin` → **quand c'est nécessaire** / **au besoin** · *idiomi* — kömpelö suora käännös; ranskassa `avoir besoin` vaatii subjektin (`j'ai besoin de…`), ei persoonatonta `il y a besoin` -rakennetta

**Positiiviset** (3):
- `il faut que les profs trouvent` — subjunktiivi oikein `il faut que` -rakenteen jälkeen
- `Si on avait… on respecterait` — Si-hypoteesi täydellisesti: imparfait + conditionnel
- `D'un côté… De l'autre côté… À mon avis` — vahvat argumentaation sidossanat

**Osa-aluepisteet (66 p):**
- Viestinnällisyys: 16 / 18 — selkeä mielipide, perustelut puolesta ja vastaan, tehtävänanto täytetty
- Kielen rakenteet: 11 / 18 — yksi aikamuotovirhe, Si-hypoteesi täydellinen
- Sanasto: 12 / 18 — selkeä, mutta yksi suomenkielinen idiomi-käännös (`quand il y a besoin`)
- Kokonaisuus: 4 / 6 — sidos hyvä, kappalejako selvä
- **Yhteensä: 43 / 66**
- Sanallinen: *Vastaa tyypillisesti C–M-tason kirjoittajan suoritusta. Mielipiderakenne ja sidossanat ovat M-tasoa, mutta yksittäinen aikamuotovirhe ja idiomi vetävät C-puolelle.*

### DE — lyhyt, 33 p — blogikommentti

**Tehtävänanto:** *Blogikommentti · 160–240 merkkiä · saksa · "Auslandsjahr — lohnt es sich?"*

```
Hallo Lena,

dein Blogeintrag über das Auslandsjahr hat mich richtig inspiriert.
Ich [bin] drei Monate in Berlin [gewohnt] und es war die beste Zeit
meines Lebens. Am Anfang konnte ich nur wenig Deutsch, aber nach
zwei Wochen [habe ich verstanden fast alles] im Alltag.

Mein Tipp: nimm einen Sprachkurs, bevor du fährst — im Ausland ist
es viel einfacher, neue Freunde zu finden, wenn man schon ein
bisschen sprechen kann.

Liebe Grüße,
Anna
```

**Virheannotaatiot** (2):

1. `bin … gewohnt` → **habe … gewohnt** · *rakenne (apuverbi)* — `wohnen` ottaa Perfektissä `haben`-apuverbin, ei `sein`. `sein` vain liike- tai tilan-muutosverbeillä (`gehen`, `werden`)
2. `habe ich verstanden fast alles` → **habe ich fast alles verstanden** · *rakenne (sanajärjestys)* — partisiippi viimeiseksi pääosalauseessa, kun apuverbi on käytössä

**Positiiviset** (2):
- `die beste Zeit meines Lebens` — Genitiv-rakenne oikein, edistynyttä
- `bevor du fährst` — sivulauseen sanajärjestys oikein (verbi loppuun)

**Osa-aluepisteet (33 p):**
- Viestinnällisyys: 8 / 9 — kommentti, oma kokemus, konkreettinen vinkki
- Kielen rakenteet: 5 / 9 — apuverbi-virhe + sanajärjestysvirhe pääosalauseessa
- Sanasto: 7 / 9 — sopiva rekisteri
- Kokonaisuus: 5 / 6 — tervehdys, lopetus, perusteltu vinkki
- **Yhteensä: 25 / 33**
- Sanallinen: *Vastaa tyypillisesti C–M-tason kirjoittajan suoritusta. Genitiv on M-tasoa, mutta Perfekt-apuverbi ja sanajärjestys vetävät C-puolelle.*

## Card UI structure (HTML + CSS)

Each kortti uses the existing `.grader-card` shell with these adjustments:

```html
<div class="grader-card" data-lang="es">
  <div class="grader-card__head">
    <p class="grader-card__title">Sähköposti ystävälle · 160–240 merkkiä · espanja</p>
    <span class="grader-card__badge">YTL · 24 / 33</span>
  </div>

  <p class="grader-prose">…(text with .ge spans)…</p>

  <div class="rubric">
    <div class="rubric-row">…Viestinnällisyys · 8 / 9 · …</div>
    <div class="rubric-row">…Kielen rakenteet · 4 / 9 · …</div>
    <div class="rubric-row">…Sanasto · 7 / 9 · …</div>
    <div class="rubric-row">…Kokonaisuus · 5 / 6 · …</div>
    <div class="rubric-total">
      <span class="rubric-total__label">Kirjoitustehtävän pisteet</span>
      <span class="rubric-total__score">24 / 33</span>
      <span class="rubric-total__note">Vastaa tyypillisesti C–M-tason kirjoittajan suoritusta</span>
    </div>
  </div>
</div>
```

Triptyykki-grid:
```css
.proof__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ed-sp-4);
}
@media (max-width: 1080px) {
  .proof__grid { grid-template-columns: 1fr; }   /* stack on tablet/mobile */
}
```

`.rubric-total__grade` (the legacy "Arvosana E" line) is **removed** and replaced by `.rubric-total__note` (sanallinen kontribuutio). No single-task arvosana letter is shown.

## Tooltip arrow fix (bug from screenshots 165729 + 165739)

Current `.ge-tip` uses `left: 50%; transform: translateX(-50%)` and an arrow `::before` at `left: 50%`. When `.ge` is an inline span that wraps across line boundaries, `position: relative` on an inline doesn't establish a clean positioning context — the absolute child anchors to a fragment box that may not match the visible trigger. Result: tooltip + arrow drift away from the highlighted word.

Fix (JS-light):

1. On `.ge` mouseenter/focus, read `.getBoundingClientRect()` of the **first** client rect (`.ge.getClientRects()[0]`).
2. Position the tooltip with `position: fixed` at `(rect.left + rect.width / 2, rect.bottom + 8)`.
3. Set a CSS custom property `--arrow-x` = `rect.left + rect.width / 2 - tooltip.left` on the tooltip.
4. Arrow CSS: `left: var(--arrow-x, 50%); transform: translateX(-50%) rotate(45deg);`
5. On viewport overflow (`rect.left - tooltip.width / 2 < 8`), clamp tooltip x and adjust `--arrow-x` accordingly.

This keeps the arrow on the actual trigger word regardless of line wrap and tooltip clamping. Pure CSS alternative (`anchor-name` / `position-anchor`) is rejected for now — Firefox/Safari support is incomplete in May 2026.

Touch behaviour: tap-to-open, tap outside or `Esc` to close. Hover behaviour: open on `mouseenter`, close on `mouseleave` after 200 ms grace period (so the user can move cursor onto the tooltip if they want — though tooltip is currently `pointer-events: none`, this can stay).

## Out of scope

- Translation of any other landing section (catalog, testimonials, footer — already trilingual via `data-*` attributes or stay Finnish)
- Real YTL pisterajat lookup per session — we report a fuzzy C–M band based on rubric profile, not a precise arvosana
- Mobile stack ordering (default DOM order: ES → FR → DE is fine alphabetically)
- A11y `aria-live` announcements when tooltip opens (current `tabindex="0"` + `aria-label` on `.ge` is sufficient for keyboard users)

## Files touched

- `index.html` — replace `<section class="grade-flow">` step previews + replace `<section id="nayte">` `.grader-card` with triptyykki of three cards
- `css/landing-editorial.css` — add `.proof__grid` triptyykki layout, `.rubric-total__note`, polish for new 33 p / 66 p denominators
- `js/landing-init.js` — new tooltip positioning logic for `.ge` triggers
- `sw.js` — bump CACHE_VERSION

## Acceptance criteria

- [ ] All three languages visible on landing without user interaction
- [ ] No `/20` denominators anywhere; pisteet ovat `/33` tai `/66`
- [ ] No `Arvosana E` (tai vastaava yksittäinen kirjain) viereinen yhden kirjoituksen pisteille; sanallinen kontribuutio sallittu
- [ ] Tooltip nuoli osoittaa highlight-sanan keskelle myös kun teksti rivittyy
- [ ] Mobile: 3 korttia stackaa pystyyn alle 1080 px leveydellä
- [ ] sw.js cache version bumped
