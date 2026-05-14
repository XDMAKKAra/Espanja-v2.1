# F-CURRICULUM-BENTO-1 — Curriculum-näkymän bento-grid + lesson-preview-kortit

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` ENNEN kaikkea muuta. Tämä on **FRONTEND**-loop.

---

## 1. Konteksti

Curriculum-näkymä (`js/screens/curriculum.js`) listaa kurssin 12 oppituntia kompaktina listana. Ongelma: lessonit näyttävät samanlaisilta, ei vihjeitä sisällöstä, ei thumbailia, ei "5 min" -merkkiä, ei vaikeusrampin näkymistä. Käyttäjä ei tiedä mihin on menossa eikä mikä on uutta.

**Mitä halutaan:** bento-grid jossa jokaisella oppitunnilla on:
- **SVG-ikoni** (Lucide-set, ei emoji — per `_UI_UX_CHECKLIST.md` priority 7). Mappäys lesson-tyyppi → Lucide-ikoni:
  - sanasto → `BookOpen`
  - kielioppi → `Pencil`
  - luetun ymmärtäminen → `FileText`
  - kirjoitus → `PenLine`
  - sekoitettu → `Layers`
  - Render w-5 h-5, viewBox 24×24, stroke 1.5 (Linear-tier-paino)
- Pieni preview-snippet (esim. 2 sanaa lessonin sanastosta, tai kysymyksen alku — luettu lesson-datasta)
- Kesto-merkki ("~6 min")
- Difficulty-piste (1-3 dot)
- Tila: lukittu / käynnissä / valmis (status-väri minimalistinen)

**Kohdetuntuma:** Linear-tier bento (epätasaiset koot, mutta hallittu — ei loud-glow). Yksi "feature-card" (next-lesson, suurempi), muut compact.

---

## 2. Mitä tämä loop EI tee

- ❌ ÄLÄ koske lesson-sisältöön eikä curriculum-dataan rakenteellisesti
- ❌ ÄLÄ rakenna uutta routing-logiikkaa — kortin klikkaus avaa sen mitä nytkin
- ❌ ÄLÄ lisää hover-pohjaisia featureita jotka ovat saavuttamattomia mobilella — kosketus-first
- ❌ ÄLÄ lisää uusia kirjastoja (ei `framer-motion`, ei `react-grid-layout`)
- ❌ ÄLÄ koske home-näkymän kortti-railiin tässä loopissa

---

## 3. Skill-set (PAKOLLINEN)

### FRONTEND-stack
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`
- `puheo-screen-template`
- `puheo-finnish-voice`

### 21st.dev-sourcing
1. **Bento-grid layout** — 21st.dev/s/bento, 21st.dev/s/grid-layout
2. **Course / lesson card** — 21st.dev/s/course-card, 21st.dev/s/lesson-card
3. **Status-badge** — 21st.dev/s/badge, 21st.dev/s/status
4. **Progress-strip** (kurssin kokonais-progressi top-rivinä) — 21st.dev/s/progress, 21st.dev/s/timeline

Linear, Vercel, Stripe — bento-tasoa. Screenshot 2+ per komponentti → `references/app/curriculum/21stdev/`. Cite URLs IMPROVEMENTS.md:ssä.

---

## 4. Layout

### Top-section
- Kurssin nimi + iso typografia (`Kurssi 3: Mitä ostit tänään?`)
- Sub: YTL-arvosanataso ("Taso B → C", **per memory: käytä YTL-arvosanoja I/A/B/C/M/E/L, EI CEFR**)
- Progress-strip: 12 stepin nauha ("5 / 12 valmis"), klikattava → scrollaa korttiin

### Bento-grid (12 lessonia)
- 12-kolumninen grid desktopilla, 2 mobile
- **Next-up** -kortti (=ensimmäinen ei-suoritettu, ei lukittu) = `grid-column: span 6` desktop, span 2 mobile — iso, oma layoutti, "Jatka tästä" CTA
- Muut kortit = `span 3` desktop, span 1 mobile
- Valmiit lessonit = `opacity: .65`, status-rasti
- Lukitut lessonit = `pointer-events: none`, lock-ikoni, vähemmän kontrasti

### Kortin sisältö
- Top-row: ikoni (lesson-tyyppi) + difficulty-dot-rivi (3 pistettä, 1-2-3)
- Otsikko: lessonin nimi
- Preview: 2-3 avainsana lessonin datasta (esim. `tienda · comprar · descuento`) — luetaan `lessons.json`:sta tai vastaavasta
- Bottom-row: kesto + status-merkki

**Ei näytä:** kuvauksia, paragraf-tekstiä, ei "click here to start" — kortti itse on klikattavissa.

---

## 5. Tekniset vaateet

### Frontend
- Muokkaa `js/screens/curriculum.js` — refaktoroi `render()` funktiota niin että lessonien listasta tehdään bento-grid
- Uusi CSS `css/curriculum-bento.css` (älä sotke vanhaa `css/curriculum.css`:ää — uusi tiedosto, vanhan voi poistaa jos ei käytetty)
- Käytä CSS Grid + `auto-fit`/`minmax` -kombinaatiota mobile-down. Ei JS-koolla-laskua.
- Preview-data: jos lesson-rakenteessa on jo `tags`/`vocab_preview`-kenttä, käytä sitä. Jos ei, lue ensimmäisten 3 vocab-itemin `front`-kenttä. Älä lisää uutta dataa lessoniin.

### Difficulty-dot
- Lessonien `difficulty: 1|2|3` -kenttä on jo olemassa (jos ei, lue `meta.difficulty` tai laske `lesson_index % 3 + 1` placeholderiksi)

### Kortti-anim
- Hover (desktop): `translateY(-2px)` + kevyt border-color-shift, `transition: 150ms`
- Mobile-tap: `:active` → `scale(.98)` 100 ms
- Next-up-kortti: kevyt pulse `box-shadow` 2 s loop, `prefers-reduced-motion: reduce` → pause

### A11y
- Korttien `role="link"` + `aria-label="Oppitunti 5: Mitä ostit tänään, kesto 6 minuuttia, tila käynnissä"`
- Lukitut kortit `aria-disabled="true"`
- Focus-state näkyvä: 2 px aksenttirengas
- Keyboard: Tab-järjestys ylhäältä-vasemmalta oikealle-alas. Enter = avaa lesson.

### SW-bumppi
Uusi `css/curriculum-bento.css` lisätään STATIC_ASSETSiin → SW CACHE_VERSION bumppi (per memory).

---

## 6. Verifiointi

> **Ennen committia: aja `_UI_UX_CHECKLIST.md` läpi.** Kaikki priority 1–7 OK tai N/A.

Erityishuomiot:
- **Mobile-fallback bento-gridille**: span 6 → mobiilissa `aspect-ratio: 4/3` (next-up), muut `1/1`, kaikki span 1
- **Pulse-anim next-up:lla**: kerran kun saapuu näytölle (Intersection Observer), EI ikuinen loop (battery + ärsytys)
- **Focus-järjestys**: DOM = lesson_index 1→12, CSS-gridi vain visuaalinen — dokumentoi tämä CSS-kommentilla
- **Lukitut kortit**: `aria-disabled="true"` + erottava ikoni (Lucide `Lock`), ei pelkkä opacity (color-only-violation)
- **Cursor: pointer** korteille, `cursor: not-allowed` lukituille

1. **Playwright screenshot** @ 1440 + 768 + 375, kaikilla 3 kielikurssilla (ES, DE, FR). Bypass gate `addInitScript`:llä.
2. **axe-core 0 violations**.
3. `design-taste-frontend` review screenshoteista (Linear-tier? bento ei meinaa loud?).
4. **Performance:** 12 kortin grid LCP <1s. Älä raskaa kuvilla.
5. Mobile-tap target ≥ 44×44 px jokaiselle kortille.
6. **E2E:** kirjautuminen → curriculum K3 → klikkaa "next-up" → lesson aukeaa. Klikkaa lukittua → ei mitään (eikä error-spammia).
7. SW-bumppi.
8. IMPROVEMENTS.md-rivi.

---

## 7. Lopputuotteen kriteeri

Käyttäjä saapuu curriculum-näkymään ja näkee yhdellä silmäyksellä:
- Missä menen (next-up iso)
- Mitä on tehty (himmeät kortit)
- Mitä on tulossa (lukitut kortit)
- Mistä lesson kertoo (preview-sanat, ikoni, kesto)

Ei "wall of text". Tuntuu app:lta jossa on **rakenne**, ei lista.
