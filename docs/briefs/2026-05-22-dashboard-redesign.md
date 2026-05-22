# BRIEF: Dashboard-redesign + valkoinen tausta app-puolelle

**Päivä:** 2026-05-22
**Versio:** v271
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävä:** v270 — "Jatka harjoittelua" -bugi (eri brief, voi mennä rinnan)

---

## Konteksti

Käyttäjä vertasi Puheon Aloitus-näyttöä Mafynetin ja Otavan Novan dashboardeihin. Puheon nykyinen näyttö häviää 5–0:

- **Mafynetti**: valkoinen tausta + tumma sidebar, kuvalliset kortit (kirja-stack, läppäri-mockup), selkeät siniset "Avaa" / "Jatka opiskelua" -napit, ei filosofisia eyebrow-otsikoita.
- **Nova**: valkoinen + kerma-aksentit, personointi heti (`Hei Marcel! 👋`), päivä-pilleri, "Jatka tästä?" -kortti konkreettisilla materiaaleilla kuvineen, "Suosikkisi"-laatikko empty-statella + CTA, oikealla "Ajankohtaista" + "Käyttövinkit". Dashboard vastaa kysymykseen *"mitä mä teen seuraavaksi"*.
- **Puheo nyt**: kermatausta, "Päivää." italic-Fraunces, 5 mittariruutua joissa "YO-VALMIUS —" tyhjänä viivana, 4 identtistä korttia mono-UPPERCASE eyebrowilla ("8 KURSSIA · 80 OPPITUNTIA"). Portfolio-page-AI-slop, ei työkalu.

Käyttäjän päätös: **dropataan beige app-puolelta, siirrytään valkoiseen.** Landing pysyy Old-Spain -teemassa (brändi); app menee valkoiseksi (työkalu).

---

## Scope

Vain `/app.html` ja sen lapset. **Landing (`index.html`) jää beige Old-Spain -teemaan.** Erottelu on tarkoituksellinen: landing = brändi, app = työkalu.

Tämä brief koskee:
1. Color tokenien override app-shellille
2. Dashboard-näytön rakenteen uudelleenkirjoitus
3. AI-slop-checkin läpivienti

Tämä brief EI koske:
- Sidebaria (tulee erikseen SidebarShell-briefissä)
- Landing-sivua
- Stripe-koodia
- Muita screenejä (settings, kirjoitus, jne.)

---

## Tehtävä

### 1. Color tokens (app-only)

Lisää `:root`-overridet `app.html`:n `<head>`:iin tai `style.css`:n `body.app-shell`-scopeen. Älä koske landing-CSS:ään. Jos `style.css` on jaettu, tee `app-shell.css` joka overrideaa.

```css
body.app-shell {
  --bg-app: #FBFBFA;          /* near-white, ei steriili */
  --bg-card: #FFFFFF;
  --bg-sidebar: #FFFFFF;       /* tai säilytä brick, päätä A/B */
  --border-soft: #E8E5E0;
  --text-primary: #1A1714;
  --text-muted: #6B665F;
  --brand: #A0341F;            /* säilytä — Puheon DNA */
  --brand-soft: #F4E8E3;       /* sidebar active bg */
}
```

Verifiointi:
- Avaa app.html → `getComputedStyle(document.body).backgroundColor` palauttaa `rgb(251, 251, 250)` (EI beige `#F5EFE6`)
- Landing avautuu vielä beige-taustalla

### 2. Dashboard-rakenne

Tiedostot: `js/screens/dashboard.js` + tarvittavat HTML/template-osat `app.html`:ssä.

Korvaa nykyinen rakenne (5-mittariruutu + 4-mode-kortti -grid) seuraavalla:

**Yläosa**
- `Hei {nickname}!` — Fraunces 40px, **ei italic** (vrt. Novan tervehdys)
- Päivä-pilleri vierellä: `Perjantai 22. toukokuuta` (Manrope)
- Poista: nykyinen "Päivää."-italic-otsikko

**"Jatka tästä?" -kortti (PRIMARY, iso)**
- Valkoinen kortti, 1px border `--border-soft`, 24px padding
- Eyebrow (Manrope 12px uppercase letter-spacing): `KURSSI 3 · LECCIÓN 4` (TODO: dynamic data — käytä user_curriculum_progress -taulua)
- Otsikko: konkreettinen tehtävä, esim. `Sanaston harjoittelu — 12 sanaa kesken` (Fraunces 24px, ei italic)
- Mini progress-bar (8/20 esim.)
- CTA brick-värinen nappi `Jatka →` koko leveydeltä mobiilissa, max-content desktopilla
- **Empty-state** kun ei mitään keskeneräistä: "Aloita ensimmäinen kurssi" + CTA kurssipolulle. EI tyhjää ruutua.

**"Päivän tavoite" -palkki (vaakasuora kortti)**
- Vasemmalla: päivän putki -numero + flame-ikoni **vain jos > 0**; muuten teksti "Aloita putki tänään"
- Oikealla: minuutti-tavoite progressbar `10 / 15 min`
- Korvaa nykyiset `PÄIVÄN PUTKI 0 pv` ja `HARJOITUKSIA 15` -mittarit

**"Kurssipolku" -snapshot (4 mini-korttia vaakarivissä)**
- Sanasto / Kielioppi / Luetun ymmärtäminen / Kirjoitus
- Jokaisessa: nimi (Fraunces 18px), mini-progressbar, `X/Y kurssia` (Manrope)
- Klikkaus → mode-screen (kunnes SidebarShell tehty, sen jälkeen sidebar avaa moden)

**Poista kokonaan**
- "Ohjaamo"-otsikko
- "YO-kokeeseen 116pv" → siirrä erilliseen tilasto-näkymään (ei Aloitukseen)
- "Tasosi E" + "YO-valmius —" tyhjä viiva on slop
- Iso 4-mode-korttigrid (kuuluu sidebariin)

### 3. AI-slop-checklist (PAKOLLINEN ennen committia)

- [ ] EI italic-Fraunces missään pikku-UI-elementissä (vain hero-tervehdys, eikä siinäkään italic)
- [ ] EI mono-UPPERCASE eyebrowia ilman semanttista syytä (`8 KURSSIA · 80 OPPITUNTIA` poistuu; `KURSSI 3 · LECCIÓN 4` säilyy koska kertoo lokaation)
- [ ] EI tyhjää viivaa `—` placeholderina — joko empty-state CTA tai piilota koko mittari
- [ ] EI em-dashia suomi-tekstissä — käytä tavuviivaa tai pilkkua
- [ ] EI "Ladataan…" italicilla — skeleton-loader
- [ ] EI identtisiä kortteja samalla mitalla (vaihtelu: primary kortti iso 100% leveys, secondary kortit 50/50 tai 4 mini-korttia)
- [ ] Personointi: nickname käytössä (v248:n jälkeen `user_profile.nickname` toimii)
- [ ] EI gradient-taustoja tai glassmorphism-efektejä — flat = luettava
- [ ] EI emoji-ikoneita random-paikkoihin (Novan 👋 on harkittu; vain hero-tervehdyksessä jos haluat)
- [ ] EI kopioida Novan violettia tai Mafyn sinistä — brick-punainen säilyy aksenttina

### 4. Verifiointi

- **Playwright-spec** `tests/e2e/dashboard-redesign.spec.js`:
  - Kirjaudu testpro123@gmail.com / Testpro123
  - Odota Aloitus-näyttö
  - `expect(page.locator('body')).toHaveCSS('background-color', 'rgb(251, 251, 250)')`
  - `expect(page.locator('h1')).toContainText('Hei')`
  - Ota screenshot
- `npm run build` → bundlet stagattu (esbuild output `app.bundle.js` + `chunks/`)
- `node --check js/screens/dashboard.js`
- Bumpaa `sw.js` `CACHE_VERSION` jos `STATIC_ASSETS`-lista koskettaa muutettuja tiedostoja
- Verifioi incognitossa että cache ei valehtele (memory: `feedback_common_frustrations.md` — älä syytä cachea kun bugi raportoidaan 2x)

### 5. Säännöt

- **Skill-stack pakollinen**: FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + TESTING (webapp-testing, superpowers:test-driven-development, superpowers:verification-before-completion, superpowers:systematic-debugging). Kutsu Skill-toolia aidosti.
- Yksi commit, message: `feat(app): white app shell + actionable dashboard (v271)`
- Lisää rivi `IMPROVEMENTS.md`:hen: `v271 — feat: dashboard-redesign + valkoinen app-shell (poistettu beige + 5-mittariruutu-slop)`
- **Ei pushia ilman lupaa.**
- Ei landingia koske.
- Stripe-koodi koskemattomana.

### 6. Don't

- ÄLÄ tee gradient-taustoja tai glassmorphism-efektejä
- ÄLÄ lisää emoji-ikoneita random-paikkoihin
- ÄLÄ käytä Fraunces:ia mittauksissa tai numeroissa — vain hero-tervehdys
- ÄLÄ rakenna 4×1 grid identtisistä korteista — se on AI-slopin ydin
- ÄLÄ kopioi Novan violettia tai keltaista — säilytä brick punainen aksenttina
- ÄLÄ syytä cachea — verifioi clean-buildillä incognitossa

---

## Onnistuminen

Kun käyttäjä avaa Aloituksen, hän näkee 3 sekunnissa:
- **mitä tehdä seuraavaksi** (yksi konkreettinen "Jatka tästä?" -kortti)
- **yhden ison napin** (Jatka →)
- ei viittä numeroa eikä neljää identtistä korttia

Tausta on valkoinen, ei beige. Sidebar pysyy nykyisessä muodossaan (SidebarShell tulee erikseen).
