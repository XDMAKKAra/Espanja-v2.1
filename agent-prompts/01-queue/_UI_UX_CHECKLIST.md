# _UI_UX_CHECKLIST — pakollinen pre-delivery-tarkistus jokaiselle F-* -loopille

> **Lähde:** `.claude/skills/ui-ux-pro-max/SKILL.md` priority-luokat 1–7 + Pre-Delivery Checklist.
> Tämä tiedosto on referoitu jokaisesta `AGENT_PROMPT_F-*.md` -briefistä §-vaiheessa "Verifiointi".
> ÄLÄ päätä looppia ilman että kaikki alla olevat kohdat ovat OK tai eksplisiittisesti N/A.

---

## Priority 1 — Accessibility (CRITICAL)

- [ ] **Color-contrast 4.5:1 minimum** normal-textille — testaa axe-corella JA Chrome DevTools "contrast"-työkalulla **molemmissa** light- ja dark-modeissa (vaikka dark olisi out-of-scope, light pitää täyttää)
- [ ] **Focus-states näkyvät** kaikilla interaktiivisilla elementeillä — käytä `--focus-ring` -tokenia (`box-shadow: 0 0 0 2px var(--accent)`)
- [ ] **Aria-label icon-only-napeille** ("Sulje", "Edellinen", "Toista")
- [ ] **Keyboard-nav: Tab-järjestys = visuaalinen järjestys.** Jos käytät CSS Grid + `order:`/`grid-area:`-uudelleenjärjestystä, dokumentoi miksi DOM-järjestys eroaa
- [ ] **Form-labels:** jokaisella inputilla `<label for>` tai `aria-label`
- [ ] **Color ei ole AINOA indikaattori** — oikein/väärin ei pelkkä vihreä/punainen, vaan myös ikoni TAI teksti TAI aria-live
- [ ] **Linkit eivät näy pelkän värin perusteella** — `text-decoration: underline` tai erottuva hover-tila

## Priority 2 — Touch & Interaction (CRITICAL)

- [ ] **Touch target ≥ 44×44 px** kaikilla nappi/linkki/kortti-elementeillä mobiilissa
- [ ] **Cursor-pointer** kaikilla klikattavilla elementeillä (myös korteilla, ei pelkillä `<button>`-elementeillä)
- [ ] **Loading-state napeissa:** disable + spinner async-operaatioiden aikana, ei tuplaklikkauksia
- [ ] **Error-feedback near problem** — virheviesti inputin alla, ei ylhäällä-toasti
- [ ] **Hover ≠ tap** mobile-päätteille — ei pelkkä hover-pohjaisia featureja
- [ ] **Hover ei aiheuta layout-shiftiä** — käytä `transform: translateY()` tai `opacity`, ei `margin`/`padding`/`scale` joka siirtää muita elementtejä

## Priority 3 — Performance (HIGH)

- [ ] **Reduced-motion respektoitu:** `@media (prefers-reduced-motion: reduce)` → animaatiot pelkistyvät (skeleton-shimmer = solid placeholder, count-up = lopullinen arvo heti, confetti = ei mitään)
- [ ] **Content-jumping estetty:** skeleton/placeholder samalla korkeudella kuin oikea sisältö → ei layout-shift kun async-data tulee
- [ ] **Image-optimization:** WebP/AVIF + `srcset` + `loading="lazy"` mahdollisuuksien mukaan
- [ ] **Transform/opacity, ei width/height** animaatioissa (paitsi jos perusteltu syy)

## Priority 4 — Layout & Responsive (HIGH)

- [ ] **Viewport-meta-tag** olemassa
- [ ] **Mobiilin body-tekstin koko ≥ 16 px** (mieluiten 16–18 px)
- [ ] **Ei horizontal-scrollia** @ 320/375/768/1024/1440 px
- [ ] **Z-index-scale käytössä tokeneista:**
  - `--z-base: 1`
  - `--z-dropdown: 10`
  - `--z-sticky: 20`
  - `--z-drawer: 30`
  - `--z-modal: 40`
  - `--z-toast: 50`
  - `--z-confetti: 60` (pointer-events: none)
  Ei magic-numeroita CSS:ssä.

## Priority 5 — Typography & Color (MEDIUM)

- [ ] **Line-height 1.5–1.75** body-tekstille, 1.2 isoille otsikoille
- [ ] **Line-length 65–75 ch** lukuteksteille (käytä `max-width: 65ch` reading-konteksteissa)
- [ ] **Font-pairing yhtenäinen** — käytä `--font-display` ja `--font-body` tokeneja, ei hardcode-arvoja

## Priority 6 — Animation (MEDIUM)

- [ ] **Micro-interactions 150–300 ms** (hover-värin vaihto, button-tap-feedback, segmented-control-vaihto)
- [ ] **Content reveals 250–600 ms** (count-up, sparkline-piirto, reveal-stagger) — perusteltu ylitys 300 ms:lle
- [ ] **Transform/opacity, ei layout-property-animaatiot**
- [ ] **Skeleton-screens loading-tilaan** spinnerin sijaan kun mahdollista

## Priority 7 — Style Selection (MEDIUM)

- [ ] **EI emojeja ikoneina UI:ssa.** Käytä SVG-ikoni-settejä:
  - Ensisijainen: **Lucide** (https://lucide.dev) — Puheo on jo Linear-tier-estetiikka
  - Vaihtoehto: Heroicons (jos Lucide:sta ei löydy)
  - Brand-logot: Simple Icons (vain virallisista lähteistä)
  Emoji on sallittu **sisältönä** (esim. lesson-tehtävissä jos pedagogisesti perusteltu), ei UI-koristeena.
- [ ] **Ikonit yhtenäisellä koolla** (24×24 viewBox, render w-5/w-6 — ei sekoita)
- [ ] **Konsistentti style koko apissa** (ei mixaa glassmorphism + brutalism samassa näkymässä)

---

## Light/Dark mode -tarkistus (vaikka dark olisi placeholder)

- [ ] **Light-mode glass-kortti**: opacity ≥ 80 % (`bg-white/80` tai vastaava), EI 10 %
- [ ] **Light-mode text**: pää-teksti `slate-900` / `#0F172A`, muted `slate-600` / `#475569` minimum
- [ ] **Border näkyy molemmissa modeissa** (`--border` token reagoi `data-theme`-attribuuttiin)

---

## Pre-delivery-tarkistus loopin lopussa

1. Käy lista läpi yksi kohta kerrallaan
2. Merkitse [x] toteutettu, [N/A] perusteltu syy
3. Jokainen rasittamaton kohta = blokkeri, älä commit:aa
4. Liitä lista tai linkki täytettyyn checklistiin IMPROVEMENTS.md-riviin
