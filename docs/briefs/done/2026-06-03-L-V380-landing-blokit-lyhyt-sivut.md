# L-V380 — Landing uusiksi valmiista blokeista: LYHYT sivu + dedikoidut sivut + arviointidemo

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — korvaa bespoke-landing-suunnan (V373/V376). Council-vetoinen.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + TESTING-M + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`, `humanizer`
**Malli:** koordinaattori **Opus** (sommittelu/maku). Blokkien kokoonpano + reskin per sivu → Sonnet-subagentit rinnakkain. Screenshot/demo-mekaniikka → Sonnet/Haiku.
**Huom:** staattinen puoli (Tailwind sallittu). PYHÄ RAJA: ÄLÄ koske `app.html`/`app.js`/`js/**` — arviointidemo saa LUKEA app-arviointia, mutta app-koodia ei muuteta.

## 🛑 PYHÄ RAJA — älä koske app-puoleen
Muutat vain landingia + staattisia sivuja + landing-CSS:ää. Ei `app.html`/`app.js`/`js/**`.

---

## Konteksti (council 2026-06-03)
Bespoke-landing on epäonnistunut toistuvasti: näyttää halvalta + menee tylsäksi skrollatessa + on LIIAN ISO (kaikki ängetty yhdelle sivulle). Council-päätös:
- **Adoptoi valmiit Tailwind-blokit** (rakenne), reskinnaa brändi-tokeneilla (väri/fontti/radius), **nolla layout-muutosta**. Bespoke on missä AI ajautuu slopiin.
- **Landing = yksi LYHYT konversiosivu.** Tapa screenshot-seinä-zig-zag.
- **AI-arviointi demona keskiössä** (ei screenshot) = uniikki todiste.
- **Muu sisältö omille sivuille.**

## Tehtävä 1 — Blokki-rakenne + brändi-tokenit
- Kokoa landing + sivut valmiista Tailwind-blokeista. **Default: ilmainen laadukas kirjasto** (HyperUI / Preline / Flowbite blocks). Jos Marcel ostaa Tailwind Plus -setin, käytä sitä (premium) — mutta ÄLÄ blokkaa sen varaan, ilmainen riittää aloitukseen.
- Reskinnaa blokit Puheon tokeneilla (V371). **Korvaa blokin oletusvärit JA -fontit Puheon OMILLA: paletti = cream/brick/keltainen/vihreä/ink (V371-tokenit), fontit = Fredoka (display) + Mulish (body). Käännä copy suomeksi. Älä koske blokin layoutiin/välistykseen/radiukseen.** Se on koko pointti (oikea rytmi tulee blokista).
- **EI UUSIA VÄREJÄ EIKÄ FONTTEJA — brändi pysyy TÄSMÄLLEEN ennallaan.** Kun puhutaan "värien/fonttien vaihdosta", se tarkoittaa AINA: ota blokin oletusarvo (esim. Inter-fontti, sininen/harmaa SaaS-paletti) ja **korvaa se MEIDÄN olemassa olevalla brändillä** (cream/brick/keltainen/vihreä + Fredoka/Mulish). Et keksi, lisää etkä valitse mitään uutta väriä tai fonttia. Vain blokin RAKENNE on uusi, brändi-identiteetti on sama kuin nyt.

## Tehtävä 1b — Spark (ei flat, mutta brändi EI muutu)
Marcel: valmiit blokit ovat tylsiä ja flatteja, ne tarvitsevat sparkkia ILMAN että brändi muuttuu. **Spark EI saa tulla uusista fonteista eikä off-brand-väreistä.** Se tulee elävyydestä brändin sisällä:
- **Liike/mikrointeraktiot** (emil-design-eng): hover-tilat, scroll-reveal-staggerit, napin `:active`-palaute, lukujen/streakin animaatio. Hillittyä, 150–250ms, vain transform/opacity.
- **Syvyys + lämpö:** pehmeät kerrosvarjot taustaan tintattuna (ei flat-on-flat, EI musta hard-shadow). Kortit nousevat creamista.
- **Tekstuuri hienovaraisesti:** esim. footerin brick-kuvio jonka Marcel JO hyväksyi — sama henki sopiviin osioihin.
- **Brändin leikkisät aksentit säästeliäästi:** pyöristetyt muodot, puhekupla-motiivi, brick-alleviivaus/highlight avainsanan alla, pieni pisteaksentti. Keltainen/vihreä/brick elävinä aksentteina, ei harmaana flattina.
- **Osio-rytmi vaihtelee:** vuorottele taustoja (cream / hento brick / vaalea) ettei skrollaus ole tasaista flattia.
- **Demo = sparkin keskiö:** interaktiivinen arviointidemo elävällä animaatiolla (kirjoita → pisteet ilmestyvät) on sivun delight-hetki.

Tavoite: tuntuu **eloisalta ja brändätyltä**, EI geneeriseltä flat-SaaS-templateilta — mutta paletti ja fontit pysyvät TÄSMÄLLEEN ennallaan.

## Tehtävä 2 — LYHYT landing (typistä radikaalisti)
Landing on nyt liian pitkä. Tee siitä lyhyt, fokusoitu konversiosivu. Suositeltu rakenne (yksi näyttö per osio, ei enempää):
1. **Hero:** otsikko ("Varmuutta ylioppilaskokeeseen...") + yksi CTA "Aloita ilmaiseksi" + tuotekuva/visuaali.
2. **Arviointidemo (keskiö):** interaktiivinen "kokeile" — kirjoita lause(et) → näe YTL-tyylinen arvio + pistehaarukka. Tämä on sivun tärkein elementti. Hyödynnä olemassa olevaa "Kokeile itse"/"Näyte arvioinnista" -logiikkaa.
3. **Lyhyt luottamus:** 3 kieltä (ES/FR/DE), lyhyt oppimäärä, rehellinen rivi arvioinnista (pistehaarukka, ei valeprecisiota — ks. muisti pistehaarukka-reframe).
4. **Hinnoittelu-teaser** (Treeni 9€/kk, Kurssi 49€) → linkki /hinnoittelu.
5. **Footer-CTA.**
Kaikki muu (rikas feature-selitys, koko hinnoittelu, arviointi-syvyys) → omille sivuille. **Poista screenshot-seinä-zig-zag.**

## Tehtävä 3 — Dedikoidut sivut (footer listaa ne jo)
Varmista että nämä ovat OLEMASSA ja linkit toimivat (footerin linkit eivät saa 404:ata):
- **/näyte tai /arviointi** — arviointiominaisuuden syväsivu + interaktiivinen demo (rubriikki, kielet, esimerkkipalaute). Tämä ansaitsee oman sivun.
- **/hinnoittelu** (pricing.html on jo)
- **Per-kieli:** Espanjan/Ranskan/Saksan abikurssi. **KORJAA B4: `/espanjan-abikurssi` → 404.** Selvitä oikeat reitit (public/landing/espanja.html?) ja korjaa kaikki per-kieli-linkit (hero-kytkin + Kurssit-dropdown + footer) osoittamaan oikeisiin sivuihin. Ei yhtään 404:ää.
- **/ukk** (FAQ), **/kirjaudu**, **/tietosuoja**, **/käyttöehdot**, **/palautukset**, **/blogi**, **/ota-yhteyttä** — vähintään stub joka ei 404:ää; tee blokeista johdonmukaisesti.

## Tehtävä 4 — Korjaa konkreettiset bugit
- **B1:** "Tekoäly arvioi kirjotelmat" näyttää väärää (dashboard) screenshotia → näytä AI-ARVIOINTINÄKYMÄ.
- **B2:** screenshotit liian pieniä desktopilla → isommat / oikea mittasuhde.
- **B3:** selain-frame-overlay ("puheo.fi") näyttää rumalta → joko hillitympi kehys tai pois (demo > staattinen kuva).
- **B5:** tylsä skrollatessa → ratkeaa typistämällä + demolla + blokkien rytmillä.

## COPY
Kaikki suomi humanizer-clean.

## Acceptance
- Landing on selvästi LYHYEMPI (mittari sovitaan, mutta ei loputon pylväs); yksi fokusoitu konversiopolku.
- Rakenne valmiista blokeista + Puheon brändi-tokenit (näyttää brändiltä, ei geneeriseltä SaaS:lta).
- Arviointidemo toimii landingilla + /näyte-sivulla.
- **Ei yhtään 404:ää** footerin/navin linkeistä; per-kieli-linkit aukeavat.
- B1–B3 korjattu.
- Ei vaakavieritystä 390px, `npm run build` PASS, sw.js bump.
- Playwright: landing + jokainen footer-linkki latautuu (ei 404), demo toimii. Screenshotit 1440px+390px → `screenshots/`.
- ÄLÄ pushaa/committaa.

## Tuleva mahdollisuus (EI nyt — kirjattu ettei katoa)
Expansionist-idea: **ilmainen YO-arvosana-ennustin** (liitä kirjotelma → arvio, ei rekisteröintiä) + **programmaattiset SEO-sivut** (per-kieli × per-taso, "espanjan YO-koe lyhyt", vertailusivut). Avainsana-kultakaivos lähes ilman kilpailua. Tämä on hankinta-projekti MYÖHEMMIN kun landing konvertoi — ei tässä briefissä.

## Ulkopuolella
App-puoli. SEO-sivukoneisto (yllä, myöhemmin).
