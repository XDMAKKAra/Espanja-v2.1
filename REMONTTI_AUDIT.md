# Remontti-audit — käyttäjäpolku-pohjainen bug-lista

**Päivämäärä:** 2026-05-13
**Tekijä:** audit-agentti (yksi sessio, ei korjauksia)
**Testimoodi:** Playwright, Chromium (desktop 1440×900) + WebKit / iPhone-13 -profiili (mobile 390×844)
**Spec:** `tests/e2e-remontti-audit.spec.js`
**Screenshotit:** `tests/screenshots/audit/`
**Raaka-data (JSONL):** `tests/screenshots/audit/_findings.jsonl`

---

## Yhteenveto

- P0 (rikki / estävä): **3 kpl**
- P1 (väärä signaali / hämmentää): **6 kpl**
- P2 (ruma / häiritsee): **5 kpl**
- Yhteensä: **14 kpl** + 6 esi-syötettyä vahvistusta

**Top-3 vakavinta:**
1. **F-01 vahvistettu** — countdown vie kaikilla 3 landingilla (es/fr/de) koko ensimmäisen fold:n; hero vaatii desktopilla 635–719 px scrollia, mobilella FR/DE-hero on **kokonaan fold:n alapuolella** (heroTop 881 px > viewport 844 px).
2. **A-01** — kaikki onboarding/tasotesti-hash-routet (`#onboarding`, `#tasotesti`, `#placement`, `#rekisteroidy`) renderöivät identtisen kirjautumisruudun: oikeaan tasotestiin ei ole julkista (esim. "kokeile ilman tiliä") -reittiä joka aukeaisi suoraan. Käyttäjä joutuu ensin rekisteröitymään ennen kuin tasotesti edes alkaa.
3. **C-01 / C-02** — pricing-sivun "suosituin"-merkki puuttuu DOM:sta (`recommended/popular/suosit` -luokkia ei löydy), ja kolmen tier-kortin lisäksi DOM:ssa on neljäs "kortti" jonka korkeus 52 px (desktop) / 74 px (mobile) — joko piilo-elementti, vertailutaulukon header tai puolikkaaksi jäänyt kortti joka väärin matchaa pricing-selektoria. Käyttäjälle näkyy vain 3 korttia, mutta "suosituin"-badge ei ole renderöitynyt (sen pitäisi olla MESTARI:lla, ks. screenshot — visuaalinen badge "ED" on siellä, mutta DOM-tasolla ei luokitusta).

---

## Esi-syötetyt löydökset (käyttäjältä — vahvistettu)

### F-01 [P1→P0 mobilella] Countdown vie ensimmäisen fold:in, hero painuu alas — VAHVISTETTU kaikilla 3 landingilla
**Status:** ✅ Toistuu kaikilla 3 (es/fr/de) ja molemmilla viewporteilla. Mobilella jopa pahempi kuin desktopilla — FR/DE hero on alle fold:n.

| Lang | Viewport | countdown.top | hero.h1 top | viewport.h | hero näkyy fold:lla? | scroll-pixelit ennen heroa |
|------|----------|--------------:|------------:|-----------:|:--------------------:|---------------------------:|
| es | desktop 1440×900 | 64 | 715 | 900 | kyllä (juuri & juuri) | 635 |
| fr | desktop 1440×900 | 64 | 719 | 900 | kyllä | 639 |
| de | desktop 1440×900 | 64 | 719 | 900 | kyllä | 639 |
| es | mobile 390×844  | (~25) | 826 | 844 | juuri-juuri (margi 18 px) | 746 |
| fr | mobile 390×844  | (~25) | 881 | 844 | **EI — heroa ei näy ilman scrollia** | 801 |
| de | mobile 390×844  | (~25) | 881 | 844 | **EI — heroa ei näy ilman scrollia** | 801 |

**Lupasi:** hero on landing-sivun päätähti (value-prop ensin).
**Toteutui:** countdown on päätähti; mobile FR/DE -käyttäjä ei näe heron H1:tä lainkaan avatessaan sivun.

**Screenshotit:** `F-es-top-desktop.png`, `F-fr-top-desktop.png`, `F-de-top-desktop.png`, `F-es-top-mobile.png`, `F-fr-top-mobile.png`, `F-de-top-mobile.png`.

**Lisähavainto (CTA-duplikaatio):**
- Espanja landing sisältää 7 kpl "Aloita ilmaiseksi" -CTA:ta (kaikki → `/app.html#rekisteroidy`). Sama label esiintyy peräkkäin countdown-sectionissa ja heron sisällä — kahden saman CTA:n välissä alle yksi fold.
- Ranska- ja saksa-landingit (waitlist-tilassa) sisältävät vain 1 CTA "Aloita espanjalla" — kun käyttäjä avaa **/ranskan-yo-koe** odottaa ranska-vaihtoehtoa, ainoa CTA vie espanjaan. Käyttäjälle epäselvä viesti.

**Korjaus (älä toteuta — fix-vaiheeseen):** suunnan B mukaisesti countdown → eyebrow-rivi heron sisälle: esim. ribbon "YO-koe 137 päivää · 15 t 57 min" pieni-fonttisena `<p class="hero-eyebrow">`-elementtinä ennen H1:tä. 720 px-kortti ja erilliset CTA:t pois.

---

## Polku A — Onboarding + tasotesti + kurssi-routing

### A-01 [P1] Tasotestiin ei pääse käsiksi ilman rekisteröitymistä
**Polku:** `addInitScript` → `puheo_gate_ok_v1=1` → goto `/app.html#tasotesti`
**Lupasi:** "60 sekunnin taitotaso-arvio" on landingin top-3 vakuuttelu (näkyy heron alla joka kielelle). Käyttäjä odottaa, että #tasotesti tai #onboarding -hash johtaa testiin.
**Toteutui:** Kaikki neljä hash-routea (`#onboarding`, `#tasotesti`, `#placement`, `#rekisteroidy`) renderöivät identtisesti samaa "Kirjaudu sisään / Rekisteröidy" -authilta-näyttöä. Tekstiote: "ESPANJAN YO-KOE · LYHYT · Adaptiivinen treeni 28.9.2026 saakka..." — kirjautuminen vaaditaan ennen kuin testi avautuu.
**Screenshot:** `A-onboarding-desktop.png`, `A-tasotesti-desktop.png`, `A-placement-desktop.png`.
**Toistettavuus:** 4/4 (kaikilla hash-arvoilla)
**Käyttäjäimpakti:** landingin lupauksen ("60 sekunnin taitotaso-arvio") ja toteutuksen välissä on rekisteröitymisseinä — vastoin "kokeile ilman tiliä → tasotesti → suositus" -flowta jota tämä audit-brief odotti.
**Arvio:** SPA:n hash-router todennäköisesti vaatii authentikoidun käyttäjän kaikilla muilla reiteillä paitsi `#rekisteroidy`/`#kotinakyma`. "Jatka ilman tiliä →" -nappi screenshotissa viittaa, että anon-flow on olemassa mutta sitä ei voi avata suoraan hashilla.

### A-02 [P2] Auth-näytön sivupalkki tarjoaa "Adaptiivinen treeni 28.9.2026 saakka" — onko se päivitetty?
**Polku:** Sama kuin A-01, sivupalkin teksti.
**Havainto:** Päiväys 28.9.2026 on hardcoded näkyvä. Today on 2026-05-13 → ~138 päivää YO-kokeeseen, mutta sivupalkki sanoo "saakka 28.9.2026" — josko tämä on seuraavan jakson koepäivä, käyttäjä lyhyt-saksaa/ranskaa lukeva voi hämmentyä, koska seuraava yo-koe espanjalle on muu päivä.
**Toistettavuus:** 4/4 hash-routejen päällä (yhteinen sivupalkki).

### A-03 [P1] 3-skenaarion tasotesti-vahvistus ei mahdollista tässä auditissa
**Selitys:** Brief pyysi testaamaan 3 erilaista vastauskuviota (aloittelija, keski, edistynyt). Tämä vaatii että tasotesti aukeaa, mikä taas vaatii rekisteröitymisen + sähköpostivahvistuksen koska A-01:n mukaan reitti on auth-takana. **Tämä on itsessään löydös:** auditoija ei pysty automatisoidusti vahvistamaan "lupasi kurssi X, toteutui kurssi Y" -bugia ilman jokaisen ajon yhteydessä luotavaa testikäyttäjää.
**Suositus** (älä toteuta — kuuluu fix-vaiheeseen, mutta merkitsen tähän koska tämä blokkaa auditointia): joko (a) tee #tasotesti-hashista anon-saatava (käyttäjäpolku "kokeile ilman tiliä → tasotesti"), tai (b) lisää e2e-fixturiin signup-helper joka luo kertakäyttöisen test-tilin.

---

## Polku B — Sanasto/tehtäväkortin maskautuminen

### B-01 [P1] Exercise-screen-routet eivät renderöidy ilman authia → maskautumisbugin testaus ei onnistu auditissa
**Polku:** `/app.html#vocab`, `/app.html#kielioppi`, `/app.html#luetunymmarrys`, `/app.html#kirjoittaminen` — kaikilla mobile + desktop.
**Havainto:** Kaikki neljä exercise-hashia johtavat samaan auth-näyttöön kuin A-01. DOM:ssa kuitenkin esiintyy useita `position: fixed`-elementtejä (`.app-waitlist-overlay hidden`, `.first-celebration hidden`, `.app-countdown hidden`, `.app-sidebar`, `.mobile-nav`, `.ob3-modal hidden`) — eli SPA:n täysi UI-puu on renderöity DOM:iin mutta piilotettu `hidden`-luokalla. Itse `.exercise-card` ei ole DOM:ssa (top:0, height:0) koska sitä ei ole vielä laitettu sisään.
**Lupasi (brief):** maskautuminen näkyy yläbaarin alla scrollatessa.
**Toteutui auditissa:** Maskautumisbugia ei voi auditoida unauthed-tilassa. Vaatii LIVE-pass:in toimivalla loginilla.
**Toistettavuus:** 4/4 mobile + 4/4 desktop (8 ajossa kaikki samaa).

### B-02 [P2] `.mobile-nav` ja `.app-sidebar` ovat DOM:ssa `position: fixed` z-index 100/10 — potentiaalinen maskaaja
**Havainto:** Mobile-navin z-index 100 on todella korkea. Jos exercise-card:in z on alle 100 ja yläreuna scrolla alle navin alareunan, peittäminen tapahtuu. Tämä on syy miksi käyttäjä on huomannut maskautumisbugin. Auditissa ei pysty mittaamaan tarkkaa overlap-pikseliä koska kortti ei renderöidy, mutta riskirakenne on todennettu.

### B-03 [P1] LIVE-passi rikki: login-flow ei navigoi
**Polku:** PW_LOGIN_EMAIL + PW_LOGIN_PASSWORD asetettu, fill email + password, klikkaa `button:has-text("Kirjaudu sisään")`, odota 4 s. Sivu jää auth-näyttöön. Test timeout 180 s. Selain crashaa kesken `waitForTimeout(4000)`:in (Target page, context or browser has been closed).
**Lupasi:** klikkaus → login API → redirect dashboardiin.
**Toteutui:** klikkaus ei laukaise login-pyyntöä DOM-näkyvästi, ja jossain vaiheessa context kuolee.
**Arvio:** joko (a) submit-button-locator ei osu oikeaan elementtiin (etunenässä mahdollinen, mutta `:has-text("Kirjaudu sisään")` ei pitäisi matchata muita kuin submitin), (b) auth-API hyökkää johonkin upgrade-insecure-requestsiin (ks. K-01), tai (c) test-tili `testpro123@gmail.com`/`Testpro123` ei oikeasti enää toimi tällä ympäristöllä. **Tämä on itsessään löydös.** Manuaalinen vahvistus kannattaa.

---

## Polku C — Pricing-sivu

### C-01 [P1] "Suosituin"-badge puuttuu DOM-luokituksesta vaikka MESTARI on visuaalisesti highlightattu
**Polku:** `/pricing.html`, mobile + desktop.
**Havainto:** DOM-haku `[class*="recommended"], [class*="popular"], [class*="suosit"]` palauttaa `false` molemmilla viewporteilla. Visuaalisesti screenshotissa (`C-pricing-desktop.png`) MESTARI-tier on highlightattuna eri värillä ja sen sisällä on "Valitse Mestari" -CTA cyan-värillä, mutta semanttista "tämä on suositeltu" -merkkiä ei ole.
**Lupasi (käyttäjäkertomus + tavanomainen pricing-UX):** "suosituin"-rosetti/badge ohjaa katsetta.
**Toteutui:** Pelkkä väri-ero; ei tekstuaalista label:ia eikä ARIA-merkintää.

### C-02 [P1] Pricing-cards: 4. korkeus-outlier — DOM:ssa neljäs "kortti" (52 px desktop / 74 px mobile)
**Havainto:** Selektori `[class*="tier"], [class*="plan"], [class*="price-card"], .card` löytää 4 elementtiä:
- desktop: korkeudet 639, 639, 52, 639
- mobile: korkeudet 549, 589, 74, 640
Korkeuksien outlier on todennäköisesti vertailutaulukon header tai badge-elementti, mutta jos pricing-cardi siellä todella on, se on visuaalisesti puuttuva.
**Arvio:** Selektori vetää väärän elementin mukaan — *ei välttämättä todellinen bugi*, mutta vaatii tarkistuksen koodissa. Ks. screenshot `C-pricing-desktop.png` ja `C-pricing-mobile.png`.

### C-03 [P2] Pricing FREE-tier listaa "(En SR-tracking)" — pieni Finglish/kielipoikkeama
**Havainto:** Desktop-screenshotin perusteella FREE-tierin viimeinen rivi on "Ei SR-tracking" tai vastaava — sanat SR ja tracking ovat englantia muun suomen seassa. Käyttäjä lukee yhtenä jonkin, mutta brand-äänelle tämä on inkonsistenttia.
**Arvio:** korvaa "kertauksen seuranta" tms. — fix-vaiheeseen.

### C-04 [P2] Pricing mobile: vertailutaulukko valuu — ✓/Rajoitettu/Rajaton-sarakkeet päällekkäin
**Havainto:** `C-pricing-mobile.png` — alimmainen "Vertailu"-osion taulukko on niin tiivis että 4 saraketta (Ominaisuus + FREE + TREENI + MESTARI) ovat ahtaita ja "Rajoitettu" katkeaa rivin yli.
**Lupasi:** Mobiililla taulukon pitää olla luettava.
**Toteutui:** Sarakeleveydet eivät ole optimoitu mobiililla.

---

## Polku D — Re-routing

### D-01 [P2] Hash-routing toimii odotetusti, mutta back-trail johtaa #kotinakyma:han eikä `index.html`-landingiin
**Polku:** goto `/app.html#kotinakyma` → goto `#oppimispolku` → `#vocab` → `#asetukset` → `#tilastot` → goBack ×4.
**Havainto:**
- visited-trail: `["#oppimispolku","#vocab","#asetukset","#tilastot"]` — kaikki landed odotetusti.
- backTrail: `["#asetukset","#vocab","#oppimispolku","#kotinakyma"]` — 4. back ei vie pois app.html:stä vaan jää `#kotinakyma`:an. Käyttäjä joka klikkaa back yhden ylimääräisen kerran odottaa palaavansa landingille, mutta jää SPA:han.
- deepLinkLanded: goto `/app.html#vocab` cold landed `#vocab` (hyvä, hash säilyy unauthed-tilassakin).

**Arvio:** ei välttämättä bugi vaan tietoinen suunnitteluvalinta — mutta brief mainitsi "turhia re-routing-juttuja" joten merkitään.

### D-02 [P2] `#asetukset` ja `#tilastot` hashilla landed samaan auth-näyttöön kuin muutkin — riippumatta hashista samaa sisältöä unauthed-tilassa
**Havainto:** Kaikki Polku G:n 10 hashia (`#kotinakyma`, `#oppimispolku`, `#asetukset`, `#tilastot`, `#vocab`, `#kielioppi`, `#luetunymmarrys`, `#kirjoittaminen`, `#tulokset`, `#rekisteroidy`) renderöivät identtisesti auth-näyttöä. URL:n hash säilyy mutta sisältö ei vaihdu. Käyttäjä joka jakaa linkin `/app.html#vocab` ystävälleen näkee saman näytön kuin hän, kun ystävä avaa.
**Arvio:** Tämä on toivottavasti tietoinen authilta-takana-piilo, mutta share-link UX:lle harmillinen.

---

## Polku E — Asetukset + tier-vaihto + Customer Portal CTA

### E-01 [P1] "Päivitä Pro" -CTA:t ovat `<button>`-elementtejä ilman `href`-attribuuttia → ei tiedetä mihin ne vievät
**Polku:** goto `/app.html#asetukset` (unauthed → auth-näyttö, mutta DOM-haku poimii myös piilotetuissa paneeleissa olevat elementit).
**Havainto:** 9 CTA:ta jotka match-aa `/pro|päivit|tilaa|portal/`:
- `[ Flip to Pro (dev) ]` — dev-only debug-button
- `Aapprobatur` — pre-render exercise-label (false positive)
- `07 ... Pronominit ... Que, quien, donde…` — sama (false positive)
- `Päivitä Pro` ×4
- `Päivitä Pro →`
- `Kokeile Pro 7 pv ilmaiseksi +`
- `Päivitä taso automaattisesti`
Kaikki on `BUTTON`-tageja, `href: null`. Eli paywall-CTA-target on click-handlerin sisällä JS-koodissa, ei seurattavissa staattisesti.
**Lupasi:** CTA vie checkoutiin tai Customer Portaliin riippuen tilasta.
**Toteutui:** Ei voi auditoida unauthed-tilassa mihin ne vievät.

### E-02 [P2] Dev-only `[ Flip to Pro (dev) ]` -button on tuotantonäkymässä
**Havainto:** Button `[ Flip to Pro (dev) ]` löytyy DOM:sta unauthed-asetusnäkymän kontekstista. Jos tämä päätyy production-buildiin, käyttäjä voi vaihtaa tieriä ilmaiseksi.
**Toistettavuus:** 1/1 — todennettu desktop + mobile.
**Arvio:** Pitäisi olla `__DEV__`-flagin takana. **Tarkistettava onko julki Vercel-buildissä** ennen kuin merkkaat P0:ksi.

### E-03 [P1] Customer Portal -linkkiä ei löydy unauthed-DOM:ista — testaamiseen tarvitaan toimiva login
**Havainto:** `/portal|hallinno/` ei match. Kuten E-01:ssä, tämä ei tarkoita että linkkiä ei olisi, vaan että se vaatii login-tilan. LIVE-passi blokattuna B-03:n vuoksi.

---

## Polku F — Landing-sivut (käsitelty F-01:ssä)

### F-02 [P2] Mobile-screenshotit landingilta epätarkat — styling ei lataudu testissä (vaarallinen viesti)
**Polku:** Playwright mobile-projekti käyttää iPhone-13-laitteen profiilia (WebKit-emulointi). Screenshot näyttää että CSS ei latautunut: SVG-kuvakkeet jättibolb-koossa, fontit default-sans, layout single-column ilman styleä.
**Console-fingerprint:** Kymmeniä `requestfailed` -tapahtumia: `GET https://localhost:3000/...woff2 - SSL connect error`, `https://localhost:3000/app.bundle.css - SSL connect error` jne. **Localhost-pyyntöjä yritetään lähettää HTTPS:llä, ja dev-server tarjoaa vain HTTP:tä.**

Tämä on ristikkäin kytketty löydökseen K-01 (alla). Mobiilikäyttäjälle production-ympäristössä **tämä ei laukaise**, koska prod on HTTPS, mutta:
- (1) audit-screenshotit eivät edusta oikeaa tilaa mobiililla → joudumme luottamaan desktopiin sisältötason käyttöliittymäanalyysissä
- (2) HSTS- ja `upgrade-insecure-requests`-headerien yhdistelmä saa Safari:n / WebKit:in **promoamaan localhost-osoitteet pakotetusti HTTPS:lle** myös dev-ympäristössä. Jos kehittäjä avaa `http://localhost:3000` ensin Chromessa ja sitten Safarissa, Safari yrittää HTTPS:ää koska HSTS-cache jää selaimeen kerran kerran ladatusta prod-vastauksesta.

### F-03 [P2] Ranska- ja saksa-landingien ainoa CTA "Aloita espanjalla" — sivulta odotetaan ranska/saksa-aloitusta
**Havainto:** Ks. F-01-listaa. Kun käyttäjä avaa `/ranskan-yo-koe` koska etsii ranskaa, ainoa CTA vie espanjaan. Tämä on tietoinen waitlist-strategia, mutta CTA-teksti on "Aloita espanjalla" — käyttäjä joka ei ole kiinnostunut espanjasta sulkee tabin.
**Suositus (älä toteuta):** CTA:n teksti "Liity ranskan waitlistille (espanja saatavilla nyt)" tms.

### F-04 [P2] Espanja-landingilla 7× "Aloita ilmaiseksi" -CTA — kaikki samaan paikkaan, sama label
**Havainto:** Liian monta toistoa samasta CTA:sta. Brand-äänestä tulee toistavaa.

---

## Polku G — Klikkaa kaikki + console

### G-01 [P0→P1] Kaikki SPA-hash-routet renderöivät auth-näyttöä unauthed-tilassa — yhtenäisesti, ei rikkoutumista
**Havainto:** 10/10 hashia renderöivät identtisesti `Kirjaudu sisään / Rekisteröidy` -näytön. Ei `[object Object]` / `NaN` / `undefined`-merkkejä missään (forbiddenMatches tyhjä). Console-errorit nolla desktopilla.

**Arvio:** Itse "kaikki menee samaan paikkaan" on by-design; bug-status riippuu siitä, halutaanko anon-vierailija pystyä esikatselemaan jotain. Tämän hetkinen kokemus: käyttäjä joka kuulee Puheosta ja kirjoittaa URL:iin `/app.html#vocab` ei näe sanastoesimerkkiä ennen kuin rekisteröityy. Konversio-implikaatio.

### G-02 [P2] Console: ei errorivirheitä desktopilla 21 testissä; mobiilipuolella SSL-spämmiä (ks. K-01)
**Havainto:** Desktopilla `consoleIssues: []` 21/21 testissä. Mobiilipuolella jokainen ajo paukuttaa 15+ requestfailed/error -lokia HTTPS-upgrade-bugin takia, mutta nämä ovat dev-only artefakteja. Mikään ei viittaa app-koodin pageerror-eihin.

---

## Kontekstilöydökset (K — ei polkukohtainen)

### K-01 [P1] Dev-server tarjoaa `Strict-Transport-Security: max-age=31536000; includeSubDomains` + CSP `upgrade-insecure-requests` myös `http://localhost:3000`:lle
**Polku:** `curl -I http://localhost:3000/public/landing/espanja.html`
**Headerit:**
```
Content-Security-Policy: ... upgrade-insecure-requests
Strict-Transport-Security: max-age=31536000; includeSubDomains
```
**Implikaatio:**
- Selain joka osuu prod-domainiin tallentaa HSTS-policyn 1 vuodeksi. Jos sama domain-perhe (mahdotonta localhostilla, mutta dev:llä tunneloitu URL voi olla sama prod:in kanssa) → kehittäjän selain kieltäytyy HTTP:stä.
- `upgrade-insecure-requests` saa sivun resurssit (kaikki sub-asset URL:t) menemään HTTPS:llä — dev-serverillä rikkoo kaiken sub-resource-lataamisen (vahvistettu F-02:ssa).
**Arvio:** prod-headerit pitäisi gateata `NODE_ENV === "production"` -ehdolla, tai vähintään `STRICT_TRANSPORT_SECURITY` jättää pois localhostilta. Localhost-HSTS on selailusessiossa kaikki-tai-ei-mitään.

### K-02 [P2] Service-worker / pre-launch-gate -ratta hyökkää myös laskelmoituun pikseli-suuntaa: 7× `Failed to load resource` per mobile-loadi
**Havainto:** SSL-error-tapahtumat ovat seurausta K-01:stä. Eivät käyttäjälle näkyvä bugi prod:ssä, mutta dev-iteraatiossa hidastuttavat ja sotkevat console-debug-flowta.

### K-03 [P1] Audit-spec rajoittuu unauthed-tilaan; LIVE-walk-through jää tästä auditista pois
**Havainto:** Brief pyysi useita auth-tiloja vaativia polkuja (B exercise card, E settings tier-vaihto, A 3-skenaarion tasotesti). Auditoitsija ei pystynyt tekemään LIVE-passia (ks. B-03). Seuraava audit-iteraatio tarvitsee:
- (a) joko luotettava test-credentials-pair joka oikeasti kirjautuu (testaa manuaalisesti että `testpro123@gmail.com`/`Testpro123` toimii)
- (b) tai e2e-fixture joka luo wegwerf-tilin kerran ennen ajoa

---

## Tilastot ajosta

- **Spec-tiedosto:** `tests/e2e-remontti-audit.spec.js` (uusi)
- **Testit yhteensä:** 21 testiä × 2 projektia = 42 ajoa (desktop) + 21 (mobile re-run) = 63 onnistunutta ajoa. LIVE-passi 1 fail.
- **Aika:** desktop 1.5 min, mobile 43 s.
- **Screenshotteja:** ~70 kpl `tests/screenshots/audit/`-kansiossa.
- **JSONL-rivit:** 21 löydös-objektia mobiili-re-runissa (desktop-rivit yliajoivat tiedoston — `_findings.jsonl` ladattu kahdesta ajosta on osa-data; täydet desktopin tulokset stdout-logitettu ja sieltä luettu auditiin).

---

## Mitä ei tehty (ja miksi)

- **Ei korjattu mitään koodia.** Briefin pyynnön mukaan tämä on löytö-vaihe.
- **Ei päivitetty BUGS.md, IMPROVEMENTS.md, AGENT_STATE.md:tä.** Käyttäjä päättää siirrot.
- **Ei commit:ia eikä deploy:ta.**
- **Ei pyydetty 3-skenaarion tasotesti-vahvistuksia** (aloittelija/keski/edistynyt) koska tasotesti-näyttö ei avaudu unauthed-tilassa (A-01).
- **Ei manuaalisia screenshotteja Pro-tilistä** koska LIVE-pass rikki (B-03).

---

## Suositukset seuraavalle vaiheelle (älä toteuta — vain inputtia plannerille)

1. **F-01 fix (suunnan B):** countdown → hero-eyebrow-rivi, yksi rivi tekstiä, ei omaa sectionia, ei omia CTA:ita.
2. **B-03 fix** ennen seuraavaa auditia: vahvista test-credentials toimivat tai lisää signup-fixture.
3. **K-01 fix:** gate STS+upgrade-insecure-requests-headerit `production`-only.
4. **A-01 / G-01 / D-02 design-keskustelu:** halutaanko anon-saatava esikatselu jollekin näytölle (esim. #vocab demo-eksä)?

---

**Loppu.** Käyttäjä + planner: käykää listä läpi yhdessä ennen fix-vaihetta.
