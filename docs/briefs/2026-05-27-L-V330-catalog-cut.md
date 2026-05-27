# BRIEF: L-V330 — Catalog-sektion leikkaus (11 323 → ~1 500 px)

**Päivä:** 2026-05-27
**Triggeri:** Council 2026-05-27 vahvisti että `<section id="kurssit" class="catalog">` on **11 323 px korkea** desktop-leveydellä — n. 60 puhelinscrollia. Outsider-advisor (lukiolainen-simulaatio): "i scroll. more cards. scroll. more. i'm like is this the whole page now... at some point i stop reading the card titles and just scroll to get past." Tämä hautaa Proof/Pricing/FAQ/CTA-sektiot näkymättömiin mobiilikäyttäjille.
**Status:** Sektion uudelleenrakenne. ~45-90 min writer-työ + variantti-päätös Marcelilta.
**Edellytys:** **L-V329 mainissa ensin.** L-V329 siirtää Proof:in §2:ksi; Catalog säilyy §4:nä mutta tämä loop sen leikkaa.

---

## Mitä korjataan

Nykyinen catalog-sektio (`index.html:245-353`) listaa 24 kurssikorttia (8 kurssia × 3 kieltä) vertikaalisesti. Desktop 11 323 px = liian iso konversiopinta. Mobile sama korkeus skaalautuu vielä pahempaan suuntaan.

**Council 3-vaihtoehtoa:**
- **(a) Tabbed by kieli (Executor):** Yksi kieli näkyvissä oletuksena (esim. Espanja), FR/DE tab-switch ei kasvata korkeutta. Target: <1 800 px.
- **(b) Accordion default-collapsed (Contrarian):** "8 kurssia × 3 kieltä, A → E -progressio" yhteen stat-laatikkoon, klikkaus avaa kortit. Target: ~400 px collapsed.
- **(c) /kurssit-sivulle siirto (Contrarian alt):** Catalog kokonaan pois landingilta, korvaa pelkällä stat-rivillä + "Katso kaikki kurssit" -linkki uudelle sivulle.

---

## Mitä writer tekee

### Step 1: Variantti-päätös (Marcel)

Tee kolmesta variantista nopea HTML-prototyyppi `screenshots/landing/catalog-variant-{a,b,c}.png`:

- **Variantti A:** olemassaolevasta `js/landing-catalog-lang.js`:stä laajennettu logiikka — yksi kieli sarakkeena, tab-row ylhäällä. Pidä DOM:ssa kaikki kortit, näytä vain aktiivisen kielen kortit `data-lang`-attribuutilla + CSS:llä.

- **Variantti B:** lisää `<details><summary>`-elementti tai oma `aria-expanded`-toggle joka tällä hetkellä `display: none` -tilassa pitää kortit. Summary näyttää "8 kurssia × 3 kieltä, A → E. Näytä kaikki →". Klikkaus expandoituu nykyiseen mittaan.

- **Variantti C:** lisää uusi `public/kurssit.html` -sivu joka sisältää nykyisen catalog-blokin. Landing:in catalog-sektio supistuu yhden rivin statiksi: "8 kurssia × 3 kieltä · A → E -progressio · 90 oppituntia / kieli" + linkki `/kurssit`-sivulle. Lisää myös rewrite `vercel.json`:iin jos tarvitaan.

Tallenna 3 screenshot:ia yhteen compare-strippiin: `screenshots/landing/catalog-variants-compare-2026-05-27.png`.

**Älä committaa muutoksia ennen Marcelin valintaa.**

### Step 2: Marcel valitsee

Kirjoita briefin loppuun:

```
### Päätös 2026-05-27
Variantti X valittu, koska <yhden virkkeen perustelu>.
```

### Step 3: Toteuta valittu variantti

Riippuu valinnasta. Yleiset periaatteet:

- **Älä riko olemassaolevia anchor-linkkejä.** `#kurssit` on linkki nav:ssa ja muualla. Säilytä id-attribuutti elementissä joka näkyy sivulla edes statiksena.
- **Älä poista kurssitietoa Supabase:sta tai exercise_bank:istä.** Tämä on pelkkä landing-näkymä-muutos.
- **Älä muuta `js/landing-catalog-lang.js`-tiedostoa** ellei variantti A:ta valita.
- **Variantti C tarkista:** uusi `kurssit.html`-sivu vaatii oman SW-asset-listauksen `sw.js`:iin sekä mahdollisesti `vercel.json` rewrite:n.

### Step 4: Verify

```bash
npm run build
npx playwright test tests/e2e-brand.spec.js     # 16/16 PASS
npx playwright test tests/e2e-bug-scan.spec.js   # 38/38 PASS
```

Visual:
- Mitataan `<section id="kurssit">` korkeus uudessa state:ssa. Acceptance: **<2 000 px desktop, <1 200 px mobile.**
- `screenshots/landing/fullpage-after-V330.png` koko sivun pituudesta.
- Tarkista että anchor-linkki `#kurssit` toimii (nav-linkistä klikkaus scrollaa oikealle sektion alkuun).
- Variantti A: tab-switch toimii FR/DE → vaihtaa näkyvät kortit ilman korkeuden hyppyä.
- Variantti B: accordion-toggle toimii klikatessa.
- Variantti C: `/kurssit`-linkki toimii Vercel-deploy:n jälkeen.

### Step 5: SW + IMPROVEMENTS

Bumppaa `sw.js` CACHE_VERSION (oletettavasti v327 → v328 jos L-V329 ehti edelle). Lisää yksi rivi IMPROVEMENTS.md:hen.

Variantti C lisäksi: päivitä `sw.js` `STATIC_ASSETS` `/kurssit.html`:lla + `sitemap.xml` uudella URL:llä.

---

## Acceptance criteria

1. Catalog-sektion korkeus: **<2 000 px desktop**, **<1 200 px mobile** (mittaa Playwright:llä)
2. Anchor-linkki `#kurssit` toimii nav:sta
3. Kaikki 24 kurssia (8 × 3 kieltä) säilyy käyttäjän saavutettavissa (joko sivulla, accordion-expandissa, tai erillisellä sivulla)
4. `npm run test:bug-scan` 38/38 PASS
5. `tests/e2e-brand.spec.js` 16/16 PASS
6. SW CACHE_VERSION bumpattu
7. Marcel hyväksyy variantti-vertailun ennen committia

---

## Out-of-scope

- **Catalog-kurssikorttien sisällön muokkaus** (otsikot, kuvaukset) — eri loop
- **Kurssimäärän muutos** (8 → muu N) — eri päätös
- **Kurssien sisältö (lessonit)** — eri kategoria (EXERCISE-L jos koskee)
- **Pricing/FAQ-sektioiden polish** — eivät tässä loopissa
- **`js/landing-catalog-lang.js`-refaktorointi** — vain variantti A koskee siihen, ja silloinkin minimimuutos

---

## Skill-stack writerille

FRONTEND-M (sektion uudelleenrakenne, mahdollisesti uusi sivu):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`

TESTING-S (regression + height-mittaus):
- `webapp-testing`
- `superpowers:verification-before-completion`

Jos variantti C valitaan (uusi sivu) lisää:
- `superpowers:writing-plans` (varmuuden vuoksi koska uusi sivu = pieni arkkitehti-päätös)

Total: 5-6 skilliä.

---

## Päätös-rekap

Council 5/5 totesi catalogin tappajaksi. Kolme variant-suuntaa:
- A = tabbed (Executor-suositus, mitattava, vähäriskinen)
- B = accordion (Contrarian-suositus, isoin korkeusvähennys)
- C = oma sivu (Contrarian-vaihtoehto, puhtain landing mutta uusi sivu = uusi maintenance-pinta)

Realistinen scope: 45-90 min kun varianttivertailu on tehty ja Marcel valinnut.
