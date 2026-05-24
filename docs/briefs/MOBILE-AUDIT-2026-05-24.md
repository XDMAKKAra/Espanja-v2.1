# Mobile + Desktop full audit — Puheo production (2026-05-24)

**Ledger:** L-V300-FULL-AUDIT-1
**Production base:** `https://espanja-v2-1.vercel.app`
**Commit at audit time:** `fdeb40c` (autoAlias removal) → `15e854e` (short-URL redirects) → `30328b9` (ledger backfill)
**Method:** Playwright 1.x against production, two viewports (iPhone 14 393×852, desktop 1440×900), 13 tests, full-page screenshots + console + network capture.
**Evidence:** `screenshots/mobile-audit/*.png` (18), `screenshots/desktop-audit/*.png` (8), `docs/briefs/MOBILE-AUDIT-2026-05-24-evidence.json`.

---

## Executive summary

Puheo on tällä hetkellä **lähetettävissä ystäville / pienelle testiryhmälle**, mutta **ei vielä lukio-yhteydenottoon**. Suurin osa visuaalisesta perustasta on kunnossa (Old-Spain-paletti johdonmukainen, typografia rauhallinen, onboarding-flow on toimiva ja luettava), mutta tuotantosivulla on **6 P0-tason estävää bugia** ja **~8 visuaalista P1-velkaa**, jotka opettajan tai opinto-ohjaajan silmissä signaloivat "tämä on vielä keskeneräinen".

Tärkein yksittäinen löydös: **production-deploy oli 53 h vanhentunut** auditin alussa (`Age: 191079`) koska `vercel.json` sisälsi `github.autoAlias: false` joka esti main-pushien auto-promotion. Korjattu L-V300-PROMOTE-FIX-1:ssä (commit `fdeb40c`). Tämä selittää myös miksi viime viikon "shippasin" -kommitit eivät näkyneet käyttäjille.

### Top 5 P0 (estävät lukio-kontaktin)

1. **`/app` settings: Profiilin lataus epäonnistui Pro-käyttäjällä** — `app.html#/asetukset` näyttää virheilmoituksen Opiskeluprofiili-kortissa testpro123-tilillä. Settings on käyttäjän ensimmäinen "tämä on oikea tuote" -näkymä. (`screenshots/desktop-audit/p6-settings-desktop-full.png`)
2. **`/app` settings: "Ei sähköpostia" vaikka olen kirjautunut** — Tili-kortti näyttää tyhjän emailin sisäänkirjautuneelle Pro-käyttäjälle. Sähköposti puuttuu UI-statesta tai render-bug. Samassa näkymässä.
3. **`/app` settings: Tilaus-osio on tyhjä Pro-käyttäjällä** — "Tilaus"-otsikon alla EI ole sisältöä eikä Pro-badgea. Lukio-edustaja näkee tyhjän sektion ja olettaa että tilausjärjestelmä ei toimi.
4. **Profile-näkymä puuttuu sidebaristä kokonaan** — Marcelin avoin issue (memory `project_open_issues_2026_05_19`). Sidebar: Aloitus / Asetukset / Kirjaudu ulos. Profile pitää olla saavutettavissa.
5. **Saksa-landing: 8 EMPTY skeleton-korttia näkyy production "8 kurssia"-sektiossa** — placeholder cards ilman sisältöä = "Lorem ipsum / Coming soon" -AI-slop joka on CLAUDE.md:ssä eksplisiittisesti kielletty. Lukio-yhteydenottoon ehdoton blokkeri.
6. **Hero-otsikko `Adaptiivinen treeni 28.9.2026 saakka.` on hard-coded päivämäärällä** — /app-login-näkymä. Päivämäärä rotaa 4 kk:n päästä → "saakka."-väite muuttuu virheelliseksi. Pitää olla dynaaminen (käyttäjän ostotilauksen voimassaolopäivä) tai poistettava kokonaan.

### Top 5 P1 (visuaalinen velka, ei estävä)

1. **Mode-page (`/app` modes): mono-UPPERCASE eyebrowit `HARJOITTELUTAPA` + `AIHE`** ilman semanttista syytä — CLAUDE.md/memory L-V290 ja `feedback_design_direction_eduix_old_spain` patternit
2. **Mode-page body-copy monospace** ("Teksti + kysymykset", "Tehtävä + AI-palaute · 99 p") — fontti vaihtelu kortin sisällä ilman syytä luo AI-slop-tunnelman
3. **Settings-kortit: meta-labelit monospace** ("Mitä sovellus saa kutsua sinua?", "Teema", "Sähköposti", "Kirjaudu ulos") — sama anti-pattern
4. **Saksa + Ranska -landingit: massiiviset section-välit desktopilla** jättävät sivun puolityhjäksi 1440px-leveydellä — rytmi ei mukaudu viewporttiin
5. **Espanja-landingin mobile-pituus 14333 px = 36 viewport-korkeutta** — käyttäjä joutuu scrollaamaan kohtuuttomasti. Sisältö pitäisi tiivistää tai jakaa lisäsivuille.

---

## Audit method + scope

### Mitä mitattiin
- **Polku 1:** `/` (Espanja-landing) — mobile + desktop screenshot ✅
- **Polku 2-3:** `/saksan-yo-koe` + `/ranskan-yo-koe` — landing + waitlist-click attempt ✅
- **Polku 4:** Lyhyet redirect-URLit `/saksa`, `/saksan`, `/ranska`, `/ranskan`, `/espanja` — ✅ (evidence kerätty mutta JSON-bug:n takia ei säilynyt, manuaalisesti vahvistettu `/saksa → 308 → /saksan-yo-koe`)
- **Polku 5:** Onboarding V4 full flow — 13 mobile-screenshotia ✅ (intro → 3 Part A vastausta + feedback → 3 osa-skip → courses-step → grades-step / mode-page)
- **Polku 6:** `/app` dashboard kirjautuneena — desktop home + settings ✅, mobile FAILED (spec timeout, SPA-polling)
- **Polku 7:** K1 lesson smoke — FAILED (SPA-login timeout molemmissa viewporteissa)
- **Polku 8:** Settings + Tilaus + paywall — desktop ✅, mobile FAILED (sama login-timeout)

### Mitä JÄI puuttumaan (loop L-V302+)
- Mobile dashboard /app -screenshot
- Mobile settings + Tilaus-osio
- K1 lesson interaktiot + exercise-renderer
- Console error -lokit + LCP/CLS-metriikat kaikilta paitsi P8 desktop (spec-bug korjattava ennen seuraavaa ajoa)

### Spec-bug omasta auditistani
1. `waitUntil: 'networkidle'` ei sovi SPA:lle joka pollaa jatkuvasti — vaihdoin `domcontentloaded`:iin mutta silti P6+P7+P8 hang:asivat login-flow:ssa. Syy todennäköisesti login-vastaus + SPA-rendering memorian läpi → vaatii eksplisiittistä selector-waitia eikä blanket-timeout:ia.
2. `evidence`-objekti afterAll:ssa kirjoittaa per-project — toinen project ylikirjoittaa edellisen → JSON-file sisältää vain viimeisen testin datan. Korjaus: per-test fs.writeFileSync `{viewName}-{viewport}.json` tai merge-pattern (jo lisätty mutta re-run vahvisti edelleen jäljen vain yhdeltä projektilta).

---

## Per-näkymä arvio

### Näkymä 1: `/` Espanja-landing
**Tila:** WARN (toimii, mutta turhan pitkä + tunnistettavaa AI-slop-jälkeä)
**Mobile:** 393 × 14333 px (36 viewport-korkeutta) · Desktop: 1440 × ~11400 px

**Toimii:**
- Old-Spain paletti (cream + brick) johdonmukainen koko sivulla
- Hero-illustration (Humaaans-tyyppinen istuva hahmo + horseshoe arches) on tunnistettava brändi-elementti
- "Lyhyen kielen YO-koe on käpityskorjattava" -headline asettaa odotuksen heti (joskin "käpityskorjattava" on outo sana — ehkä typo "käsityskorjattava" / "käsiteltävissä"?)
- Pricing-osio (Free / 19€ / Trial) selkeä rakenne
- Kohelle ilmoittelut -CTA pohjalla, brick-vahva

**Mitä näyttää huonolta:**
- Sivu on KAKSI kertaa liian pitkä — mobile-käyttäjän peukalo ei jaksa scrollata 36 viewporttia
- Useat sektiot toistavat saman viestin eri sanoin → fluff-velka
- Diagnostic-screenshot kortin sisällä on hyvä idea mutta liian iso ja vie tilaa muulta
- Top-bar logo "Puheo" mutta värimissä, alaviivassa "o" punaisena ilman selitystä (toimii ilmeisesti brand-marker:ina mutta korjaaja huomaa puuttuvan systeemi-kuvauksen)

**AI-slop havainnot:**
- Ei em-dashejä — ✅
- Ei "Elevate/Seamless"-spammia — ✅
- "Kohelle ilmoittelut" -CTA on luettavissa, ei sycophantic
- Pituus + osioiden samankaltaisuus signaloi AI-tuotettua jos lukee tarkkaan

**Korjaukset:**
- P2: tiivistä mobile-pituutta puoleen (target: ≤7000 px) — yhdistä samaa viestiä toistavat sektiot. Eka loop: poista 2 redundanttia sektiota.

---

### Näkymä 2: `/saksan-yo-koe` (saksa-waitlist landing)
**Tila:** FAIL (P0 kursseja-skeleton näkyy, "Liity waitlistille"-flow ei toimi)
**Mobile:** 393 × 9137 px · Desktop: 1440 × ~9300 px

**Toimii:**
- Ribbon ylhäällä "Saksa avautuu kev. 2026..." asettaa odotuksen
- Hero "Pärjää saksan YO-kokeessa. Hallo!" toimii, phone mockup -kuva oikealla
- Pricing-osio Free/Mestari toimii (19€ on plausible)
- Waitlist CTA brick-vahva

**Mitä näyttää huonolta:**
- **8 EMPTY GREY SKELETON-KORTTIA** "8 kurssia"-sektiossa = production-näkyvä placeholder
- Kolme askelta 01/02/03 -sektion body-teksti vaikuttaa cropattua / liian kapeaa desktopilla
- Massiivinen section-välistys desktop-leveydellä
- "Liity waitlistille" -CTA ei avannut formia tai modaalia kun Playwright klikkasi sitä (sama screenshot ennen + jälkeen klikin)

**AI-slop havainnot:**
- **Skeleton-kortit on suora "Lorem ipsum / TBD" -kategorian rikkomus** CLAUDE.md:n vastaisesti
- Section-tyhjyys + identical card placeholderit luovat "AI generoi tämän" -kuvan välittömästi

**Korjaukset:**
- P0: täytä 8 kurssia -sektion kortit oikealla sisällöllä (kurssin nimi + 1-2 lauseen kuvaus), tai poista koko sektio kunnes sisältö on valmis
- P0: korjaa "Liity waitlistille" -klikin handler — modaalin pitää avautua + email-input renderöityä
- P1: leikkaa section-välejä desktopilla ~30% (esim. `padding-block: 7rem` → `5rem`)

---

### Näkymä 3: `/ranskan-yo-koe` (ranska-waitlist landing)
**Tila:** FAIL (sama saksa-pattern, oletettavasti samat bugit)
**Note:** Saksa-template on monistettu, joten korjaukset koskevat tätäkin. Ei erillistä audittia.

---

### Näkymä 4: short-URL redirects `/saksa`, `/saksan`, `/ranska`, `/ranskan`, `/espanja`
**Tila:** PASS (kaikki 5 → 308 → täysslug)

**Vahvistus:** manual curl `https://espanja-v2-1.vercel.app/saksa?cb=...` → `HTTP/1.1 308 Permanent Redirect / Location: /saksan-yo-koe?cb=...` — toimii myös query-string:in kanssa, Vercel kuljettaa cb-parametrin destination:iin.

**Korjaus:** ei tarvita.

---

### Näkymä 5: `/onboarding` (V4 diagnostic-first)
**Tila:** PASS (paras visuaalinen kokonaisuus koko tuotteessa)
**Viewport:** mobile (393)

**Toimii:**
- **Intro-screen:** "Vaihe 1 / 5" progress-indikaattori + selkeä otsikko + 2 lauseen value-prop + brick "Aloita taso-arvio" + tekstilinkki "Ohita kokonaan" — käyttäjälle annetaan oikea valinta
- **Diagnostic-q1:** "Osa A — Rakenne" + "1 / 15" + sentence-with-blank renderöity rauhallisesti, 4 vaihtoehtoa täyssliveinä klikkaus-kohteina (~44 px minimi), "Tarkista" brick CTA
- **Feedback-state (q1 correct):** vihreä "Oikein" -box + selitys "Ammatti ja pysyvä identiteetti vaativat ser-verbin..." — pedagogisesti oikea metakatto-tieto, ei pelkkä piste
- **Skip-flow:** "Ohita tämä osa / Ohita koko taso-arvio" -linkit pohjalla, käyttäjä ei jää jumiin

**Mitä näyttää huonolta:**
- Intro-screen on vertikaalisesti center-aligned scroll-position:ssa joka leikkaa otsikon "Mita lukio-kursseja olet käynyt?" pois kun seuraava step latautuu (screenshot p5-onboarding-05) — saattaa olla screenshot-artefakti (scroll-position oli väärä klikkauksen jälkeen), mutta voi olla myös todellinen header-z-index-bug
- Top-sticky header ottaa ~70 px joka tila — onboarding-flow:ssa olisi voinut piilottaa logo + hamburger ja antaa koko viewportin

**AI-slop havainnot:**
- Onboarding-q1 sentence "Mi madre _____ profesora de matemáticas." renderöitynyt cream-tinted boxiin → tyylikäs, ei tylsä input
- Ei mono-UPPERCASE chipejä
- Ei em-dashejä

**Korjaukset:**
- P2: tarkista step-transition scroll-reset (kun klikkaa "Aloita taso-arvio" tai "Seuraava kysymys" → window.scrollTo(0,0) jos ei ole jo)
- P3: harkitse onboarding-flow:ssa minimal-shell (vain progress-bar yläbarissa) joka antaa enemmän tilaa kysymyksille

---

### Näkymä 6: `/app` dashboard (kirjautuneena testpro123, desktop)
**Tila:** FAIL (P0: Profiili-virhe + Tilaus tyhjä + Email puuttuu)

**Login-näkymä (ennen kirjautumista):**
- **Kaunis 50/50-asetelma:** vasen kolumni brand-pitch (Puheo-logo + "Espanjan yo-koe · lyhyt" eyebrow + massiivinen Fraunces-headline "Adaptiivinen treeni 28.9.2026 saakka.") + 3-pisteen checkmark-lista + trust-microcopy. Oikealla form (Kirjaudu/Rekisteröidy-tabit, brick CTA, "Jatka ilman tiliä →" guest-option)
- Tämä on tuotteen siisteimpiä näkymiä — Eduix/Old-Spain-direction toteutuu hyvin
- Sidebar (vasen pieni) on tyhjä paitsi Aloitus + Asetukset + Kirjaudu ulos — Profile-linkki PUUTTUU

**Kirjautuneen home-näkymä (ei screenshotia tästä auditista — kts. P5 step-08 joka päätyi mode-pageen):**
- Mode-page "Espanja Yo-koe" hero — koko viewport, massiivinen Fraunces-headline + sub
- "HARJOITTELUTAPA" eyebrow mono-UPPERCASE (AI-slop)
- 3 mode-korttia: Luetun ymmärtäminen (aktiivinen, mint-green tint + brick border), Kirjoittaminen (inaktiivinen, valkoinen), Koeharjoitus (inaktiivinen, lavender tint)
- Body-copy "Teksti + kysymykset", "Tehtävä + AI-palaute · 99 p", "Luettu + kirjoitus · ajastettu" — **monospace** ilman semanttista syytä
- "AIHE" eyebrow + dropdown "Yleinen sanasto"
- Brick CTA "Aloita harjoittelu →"

**Mitä näyttää huonolta:**
- Hero ylätyhjyys liian iso desktopilla
- Mono-UPPERCASE eyebrowit + monospace bodyt = ehdoton AI-slop
- "99 p" -pistemerkintä on outo body-kontekstissa — pitäisi olla pieni badge/chip oikealla

**Korjaukset:**
- P0: korjaa Profiilin lataus -virhe (`api/profile` / `getProfile()` -kutsu Pro-tilille)
- P0: korjaa "Ei sähköpostia" — Tili-kortti pitää lukea email kirjautuneesta sessionista
- P0: täytä Tilaus-kortti Pro-tilauksen tiedoilla (status, voimassaolo, hallintalinkki)
- P0: lisää Profile-linkki sidebariin tai poista Profile-konsepti kokonaan jos ei ole oma näkymä
- P1: poista mono-UPPERCASE eyebrowit (`HARJOITTELUTAPA`, `AIHE`) — käytä semanttista h3 + capitalize
- P1: vaihda body-monospace standard sans-fontiksi mode-korteilla

---

### Näkymä 7: K1 lesson smoke
**Tila:** UNKNOWN (Playwright failasi login-timeout:iin molemmissa viewporteissa, ei screenshotia)
**Seuraavalla auditilla:** vaihdettava login-strategiaan eksplisiittinen selector-wait + erillinen autologin-helper.

---

### Näkymä 8: `/app#/asetukset` (Settings, desktop)
**Tila:** FAIL (kts. P6 — 3 P0-bugia)

**Toimii:**
- Asetukset-linkki sidebarista AVAUTUU (vastoin Marcelin memory P0:aa joka väitti "Asetukset/Profile don't open") — joko ei koskaan ollut bugia, tai korjattu välissä
- Asetukset-sivun rakenne on selkeä: Kutsumanimi, Opiskeluprofiili, Opiskelukieli, Ulkoasu, Tilaus, Tili (sectionit otsikoilla)
- "Tallenna"-painike per kortti, ei tartte palauttaa formia
- Ulkoasu-theme-toggle Auto/Vaalea/Tumma toimii visuaalisesti

**Mitä näyttää huonolta:**
- Opiskeluprofiili: "Profiilin lataus epäonnistui. Kokeile myöhemmin uudelleen." — P0
- Opiskelukieli: tyhjä skeleton ladataan loputtomasti (ei renderöi mitään) — P0
- Tilaus: tyhjä otsikko ilman sisältöä — P0
- Tili: "Ei sähköpostia" Pro-tilillä — P0
- Kortti-meta-labelit kaikki monospace — AI-slop

**Korjaukset:**
- P0: korjaa kaikki 4 yllä lueteltua bugia (oletettavasti yhteinen syy: `/api/profile` tai `/api/settings` -kutsu palauttaa virheen tai tyhjän responsen Pro-tilille)
- P1: poista monospace meta-labeleilta

---

## AI-slop sweep — tiivistetyt havainnot

**Asetukset-näkymä:**
- ❌ Mono-UPPERCASE puuttuu (sectiot ovat standard Caps), MUTTA kortti-meta-labelit ovat monospace = ekvivalentti rikkomus

**Mode-page (Espanja Yo-koe):**
- ❌ `HARJOITTELUTAPA` mono-UPPERCASE eyebrow ilman syytä
- ❌ `AIHE` mono-UPPERCASE eyebrow ilman syytä
- ❌ Body-copy monospace mode-korteilla

**Saksa-landing:**
- ❌ 8 empty skeleton-kortit production-näkyvä = "Lorem ipsum / Coming soon"

**Yleisesti:**
- ✅ Ei em-dashejä missään katsotussa screenshotissa
- ✅ Ei italic Fraunces "Ladataan…"-placeholdereitä
- ✅ Ei gradient-text otsikoissa
- ✅ Ei side-stripe border-left -kortteja
- ✅ Ei glassmorphism-paneeleja
- ✅ Ei pure #000 / #fff
- ✅ Ei sycophantic openers / generic conclusions copy:ssä
- ✅ Ei lukio-nimiä / tarkkoja %-lukuja tarkistetussa copy:ssä
- ⚠️ Hardcoded päivämäärä "28.9.2026" hero-otsikossa rotaa pian
- ⚠️ Espanja-landingin "käpityskorjattava" -sana on outo (ehkä typo)

---

## Korjaus-loop-jono (L-V301+)

| Loop | Scope | File:line | ETA |
|------|-------|-----------|-----|
| **L-V301-SETTINGS-P0-1** | Korjaa `/api/profile` Pro-tilille — Opiskeluprofiili lataus, Tili-email, Tilaus-sisältö | `routes/profile.js`, `js/screens/settings.js` | 45 min |
| **L-V302-PROFILE-LINK-1** | Lisää Profile-linkki sidebariin TAI poista Profile-konsepti dokumentaatiosta | `js/components/sidebar.js` / `app.html` | 20 min |
| **L-V303-SAKSA-KURSSIT-1** | Täytä 8 kurssia -sektion kortit oikealla sisällöllä saksa+ranska landingeille (tai poista sektio) | `public/landing/saksa.html`, `ranska.html` | 60 min |
| **L-V304-SAKSA-WAITLIST-1** | Korjaa "Liity waitlistille" -modaali / form-renderöinti saksa + ranska landingeillä | `public/landing/*.html` + JS handler | 40 min |
| **L-V305-COUNTDOWN-DYNAMIC-1** | Vaihda hero-otsikon "28.9.2026" dynaamiseksi (käyttäjä-spesifinen tilauksen voimassaolo tai poista) | `js/screens/auth.js` tai `app.html` template | 30 min |
| **L-V306-MODE-PAGE-SLOP-1** | Poista `HARJOITTELUTAPA` + `AIHE` mono-UPPERCASE eyebrowit, vaihda body-monospace → sans | `js/screens/mode-page.js`, `css/components/mode-page.css` | 25 min |
| **L-V307-SETTINGS-MONO-1** | Poista monospace kortti-meta-labelit settings-näkymässä | `css/components/settings.css` | 15 min |
| **L-V308-LANDING-LENGTH-1** | Tiivistä Espanja-landingin mobile-pituus 14333 → ≤7000 px | `public/landing/espanja.html` (poista 2-3 redundanttia sektiota) | 60 min |
| **L-V309-AUDIT-RERUN-1** | Re-run mobile P6/P7/P8 + console-error capture korjatulla login-strategialla | `tests/e2e-mobile-audit-2026-05-24.spec.js` | 30 min |

**Total ETA L-V301..L-V309:** ~5 h 5 min (yksi täysipäivä työtä).

**Jonon priorisointi-perustelu:** L-V301..L-V305 ovat lukio-kontakti-estäjiä (P0). L-V306..L-V308 ovat visuaalisen tason velkaa (P1). L-V309 sulkee tämän auditin (kerää puuttuvat metriikat).

---

## Liite: spec-bug joka esti täyden auditin

`tests/e2e-mobile-audit-2026-05-24.spec.js` (P6, P7, P8):
- `await page.goto('/app.html', { waitUntil: 'networkidle' })` jämähti SPA:n jatkuvaan pollingiin
- Vaihto `domcontentloaded`:iin ei korjannut — testi-timeoutti tapahtuu login-vastauksen ja screen-vaihdon välissä
- Korjaus seuraavalle auditille: `await page.waitForSelector('#screen-home.active', { timeout: 15000 })` tai vastaava eksplisiittinen target-selector
- Evidence-JSON afterAll-hook ylikirjoittaa per-project — `record()` pitäisi kirjoittaa per-test-tiedosto, ei mutate shared object

---

**Audit-aika:** ~2 h 30 min (sis. cache-promote-fix L-V300-PROMOTE-FIX-1, spec-kirjoitus, 2 ajoa, 26 screenshotin analyysi, raportin kirjoitus).
