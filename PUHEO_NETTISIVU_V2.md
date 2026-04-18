# Puheo — Nettisivun parannusehdotukset v2

Analysoin sivusi (index.html + diagnose.html + app.html) ja teen 10 **konkreettista parannusta** jotka perustuvat nykyiseen sivuun — ei enää yleisiä ehdotuksia. Priorisoitu konversiovaikutuksen mukaan ennen 1.6.2026 launchia.

---

## TILANNEKATSAUS — mitä on jo

Olet tehnyt hyvää työtä:
- Landing 9 osiolla (urgency bar, hero, problem, solution, how, screenshots, testimonials, pricing, FAQ)
- 3-korttinen hinnoittelu conditional renderilla (summer season -logiikka toimii)
- diagnose.html on olemassa
- PWA manifest + offline.html
- Open Graph -tagit
- FAQ 9 kysymystä (hyvä, mukana Abitreenit-vertailu)

**Missä mättää — nämä tappavat konversion:**

1. Screenshot-carouselissa on **emoji-placeholderit** (📊 📚 ✍️ 🎓) — ei oikeita kuvakaappauksia
2. Testimonials = **tyhjä placeholder**
3. Landingilla **ei ole oikeaa demoa** (vain staattinen "kortti" hero-alueella)
4. **Ei about-sivua** — "1 henkilökohtainen kirjoitelmapalaute minulta" viittaa perustajaan, mutta kuka se on?
5. **Ei email-capturea** — lähtijät ovat menetetty ikuisesti
6. **3 Google Fonts** (Syne + DM Mono + Lora) — tappaa LCP
7. **Ei analytiikkaa** — et tiedä mitä kannattaa parantaa
8. **Ei cookie consentia** — GDPR-rikkomus
9. **Ei Abitreenit-vertailutaulukkoa** (mainitaan FAQ:ssa tekstinä, mutta ei visualista)
10. **Ei exit-intent popupia** — viimeinen mahdollisuus kiinni

---

# 10 PARANNUSEHDOTUSTA (priorisoitu)

## #1 Oikeat kuvakaappaukset (KRIITTINEN)

```
Puheon index.html screenshot-carousel (rivit 182-215) sisältää emoji-placeholderit
(📊 Dashboard, 📚 Sanastoharjoitus, ✍️ Kirjoitelma, 🎓 Täyskoe). Tämä tappaa konversion —
kukaan ei luota tuotteeseen jota ei näytetä.

Tehtävä:

1) Generoi oikeat kuvakaappaukset app.html:n eri näytöistä:
   - Kirjaudu sisään testitunnuksilla (TEST_PRO_EMAILS)
   - Screenshot 4 näkymää: dashboard, sanasto-harjoitus, kirjoitelman palaute, täyskoe
   - Tallenna 1600x1200px PNG:inä kansioon public/screenshots/
   - Optimoi WebP-versiot: screenshots/dashboard.webp, vocab.webp, writing.webp, exam.webp
   - Käytä `sharp` tai `squoosh-cli` optimointiin (pakettikoko max 150KB per kuva)

2) Korvaa index.html rivit 183-208:
   <div class="screenshot-slide active" data-idx="0">
     <picture>
       <source srcset="/screenshots/dashboard.webp" type="image/webp" />
       <img src="/screenshots/dashboard.png" alt="Puheo dashboard -näkymä"
            loading="lazy" width="1600" height="1200" />
     </picture>
     <div class="screenshot-caption">Dashboard — edistyminen ja suositukset</div>
   </div>
   [sama rakenne 4 slidelle]

3) Päivitä landing.css:
   - .screenshot-slide img { width: 100%; border-radius: 12px; }
   - Poista .screenshot-placeholder -tyylit (kuollut koodi)
   - Lisää subtle shadow + border kuvien ympärille
   - Mobile: maksimi leveys 92vw, säilytä suhde

4) Lisää 1-2 sekunnin highlight-animaatio kun carousel vaihtaa kuvaa
   (esim. fade + scale 0.98 → 1.0)

5) Lisää alt-tekstit saavutettavuutta varten — suomeksi

Commit: "feat(landing): replace placeholder emojis with real product screenshots"
```

---

## #2 Interaktiivinen mikro-demo heroon

```
Puheon landing-sivun hero näyttää pelkän staattisen "Qué significa el ayuntamiento" -kortin
(index.html rivit 75-89). Muuta se toimivaksi demoksi — käyttäjä voi klikata vastauksia
ja nähdä Puheon heti toimivan ilman kirjautumista.

Tehtävä:

1) Muuta hero-kortti interaktiiviseksi JavaScriptillä:
   - 5 sanaston monivalintaa, eteneminen seuraavaan kun vastaus valittu
   - Oikein vihreä check + microcopy ("Nyt osaat!"), väärin punainen + "Oikea vastaus: X"
   - Progress bar: 1/5, 2/5 jne.
   - Kysymykset data/demo-vocab.json -tiedostosta:
     [{ word: "el ayuntamiento", correct: "kaupungintalo",
        options: ["kaupungintalo","sairaala","koulu","yliopisto"] }, ...]

2) 5. kysymyksen jälkeen näytetään "mini-tulosikkuna":
   - "Sait 4/5 oikein — arviomme tasosta: B"
   - Kaksi CTA-nappia:
     Primary: "Jatka harjoittelua ilmaiseksi →" (app.html)
     Secondary: "Tee täysi tasotesti (15 kys) →" (diagnose.html)

3) Demo ei tallenna tuloksia backend:iin (pelkkää marketingia)
   - Tallenna localStorage:en "puheo_demo_completed": true
   - Jos käyttäjä palaa sivulle, näytä "Tervetuloa takaisin! Haluaisitko aloittaa tilin?"

4) Tekniset vaatimukset:
   - Ei rikkoisi nykyistä hero-layoutia
   - Toimii ilman internetiä (kaikki staattista)
   - < 5KB lisäkoodia minified
   - Mobile-first — 1 napin per rivi mobilessa

5) Analytiikkaevent: demo_started, demo_completed, demo_cta_clicked

Commit: "feat(hero): interactive 5-question demo replacing static card"
```

---

## #3 "Kuka tämän teki" -sivu + luottamus hero:ssa

```
Puheon pricing-kortti sanoo "BONUS: 1 henkilökohtainen kirjoitelmapalaute MINULTA"
(index.html rivi 283) — mutta kuka "minä" olen? Ostaja näkee kylmän tuntemattoman
joka pyytää 29€. Luottamus rakentuu perustajan tarinalla.

Tehtävä:

1) Luo /about.html:
   - Sama nav + footer kuin index.html
   - Hero: "Tein Puheon koska..." + sinun kuvasi (oikea kuva, ei stock)
   - 4 kappaletta: miksi tämä ongelma on sinulle tärkeä, oma kokemus espanjasta,
     mitä yritit ja mikä ei toiminut, miksi AI on ratkaisu
   - "Tavoitteeni": 1000 lukiolaista parempi arvosana vuonna 2026
   - Yhteystiedot: email (tuki@puheo.fi) + vastaan itse 24h sisällä
   - Y-tunnus 3516174-4 korostettu

2) Lisää "Kuka tämän teki?" -rivi landingin hero:n alle (index.html):
   - Pieni kuva + teksti: "Tervehdys, olen Marcel. Olen yksi ihminen Suomessa
     rakentamassa tätä espanjan YO-kokelaille."
   - Linkki about.html:ään
   - Aseta hero-social-proof:in viereen tai tilalle

3) Pricing-kortissa (rivi 283) muuta:
   "BONUS: 1 henkilökohtainen kirjoitelmapalaute minulta"
   →
   "BONUS: 1 henkilökohtainen kirjoitelmapalaute perustajalta"
   + linkki about.html:ään ("lue kuka")

4) Lisää navigaatioon: "Minusta" (about.html)

5) Footer: lisää "Yhteystiedot: Marcel, tuki@puheo.fi"

6) About-sivun lopussa: CTA "Kokeile Puheoa ilmaiseksi" + linkki

7) Schema.org Person + Organization structured data

Commit: "feat(about): founder story page + trust signal on landing"
```

---

## #4 Email capture: "Ilmainen YO-espanja kertausopas"

```
Puheon landingilla ei ole email-capturea. Visitor joka ei rekisteröidy on menetetty.
Rakenna lead magnet — ilmainen 15-sivuinen kertausopas PDF:nä.

Tehtävä:

1) Luo data/ebook/puheo-yo-espanja-opas.pdf (15 sivua):
   - Kansi + sisällysluettelo
   - YTL lyhyt espanja -rakenteen selitys (osat, pisteytys, aikaraja)
   - 3 sivua: ser vs estar taulukot + 10 esimerkkiä
   - 3 sivua: preteriti vs imperfekti
   - 2 sivua: subjunktiivi-triggerit
   - 2 sivua: YO-kirjoitelman rakenne + malliesimerkit
   - 2 sivua: 50 tärkeintä sanaa / aihealue
   - Viimeinen sivu: "Valmis jatkamaan? Kokeile Puheoa ilmaiseksi → puheo.fi"

2) Lisää landing-sivulle uusi osio (pricingin ja FAQ:n välissä):
   Otsikko: "Lataa ilmainen YO-espanja kertausopas"
   Alaotsikko: "15 sivua tärkeintä sisältöä — taulukot, säännöt, mallit. PDF."
   Form: email-input + "Lähetä minulle" -nappi
   Disclaimer: "Lähetämme ehkä 1-2 vinkkisähköpostia. Voit perua milloin vain."

3) Uusi endpoint routes/email.js:
   POST /api/lead-magnet { email }
   - Validoi email
   - Tallenna leads-tauluun (migrations/017_leads.sql):
     leads(id, email, source, lead_magnet, created_at, converted_to_user_at)
   - Resend: lähetä PDF liitteenä + welcome-viesti
   - Palauta { success: true }

4) Onboarding-sarja automaattisesti 5 päivän kuluessa:
   - Päivä 0: kiitos + PDF linkki
   - Päivä 1: "Tiesitkö että 70% YO-espanjan epäonnistumisista johtuu..."
   - Päivä 3: "3 vinkkiä kirjoitelmaan" + linkki Puheon demoon
   - Päivä 5: "Viimeinen offeri: kokeile Pro 7 päivää ilmaiseksi"

5) Sovi Resend-domeeni + DMARC/SPF -record

6) Tracktaa: lead_magnet_downloaded, lead_converted_to_user

7) GDPR: lisää unsubscribe-linkki jokaiseen sähköpostiin

Commit: "feat(marketing): lead magnet PDF + 5-day email onboarding"
```

---

## #5 Vertailutaulukko: Puheo vs. Abitreenit vs. kurssikirja

```
Puheon FAQ mainitsee Abitreenit-vertailun tekstinä (rivi 338-339), mutta visuaalista
vertailua ei ole. Opiskelijat valitsevat tuotteen usein taulukon perusteella.

Tehtävä:

1) Lisää uusi osio index.html solution-osion ja how-osion väliin:
   Section tag: "Vertailu"
   Otsikko: "Miksi Puheo, ei Abitreenit?"

2) Taulukko (responsiivinen, mobilessa korttimuoto):

   | Ominaisuus                     | Kurssikirja | Abitreenit | Puheo  |
   |--------------------------------|:-----------:|:----------:|:------:|
   | Harjoituksia aiheesta          |     5-10    |     50+    |  ∞     |
   | Adaptiivinen vaikeustaso       |     ❌      |     ❌     |  ✅    |
   | AI-palaute kirjoitelmasta      |     ❌      |     ❌     |  ✅    |
   | YTL-rubriikin mukainen arvos.  |     ❌      |     ⚠️     |  ✅    |
   | Täyskoe-simulaatio + timer     |     ❌      |     ❌     |  ✅    |
   | Spaced repetition              |     ❌      |     ❌     |  ✅    |
   | Mobile-first                   |     ❌      |     ⚠️     |  ✅    |
   | Hinta / kuukausi               |     ~20€    |     ilm.   | 9,99€  |
   | Tekee kokeen uudestaan         |     ❌      |     ⚠️     |  ✅    |

3) Alateksti taulukon alla:
   "Abitreenit on hyvä harjoituspankki (ja ilmainen!) — mutta Puheo vie asiat pidemmälle
   personoinnilla, AI-palautteella ja mestaruustestauksella. Käytä molempia yhdessä."

4) Tekninen:
   - CSS Grid/Flexbox taulukolle
   - Mobile: taulukko → swipeable columns tai 3 korttia
   - ✅ vihreällä, ❌ punaharmaa, ⚠️ oranssi (osittain)
   - Rivien hover-tila

5) Rehellisyys on tärkeää:
   - Älä valehtele Abitreenit on huonompi — se on ilmainen ja hyvä
   - Positioi täydentäväksi työkaluksi

6) Schema.org ComparisonTable (SEO)

Commit: "feat(landing): comparison table Puheo vs. Abitreenit vs. textbook"
```

---

## #6 Analytiikka: PostHog + Microsoft Clarity

```
Puheon indexissä ei ole mitään analytiikkaa. Et tiedä mitä osioita luetaan, missä
ihmiset poistuvat, mitkä CTA:t toimivat. Ilman dataa et voi parantaa.

Valinta:
- PostHog (EU cloud) — event tracking, funnelit, feature flagit — 1M events/kk ilmaiseksi
- Microsoft Clarity — heatmapit, session recordings — täysin ilmainen, rajaton
- EI Google Analytics 4 (liian monimutkainen, epätarkka)

Tehtävä:

1) PostHog (async, ei estä latausta):
   - Rekisteröidy posthog.com (EU region)
   - Luo .env: POSTHOG_KEY, POSTHOG_HOST=https://eu.posthog.com
   - Lisää index.html, diagnose.html, app.html <head>-tagin loppuun:
     <script>
       !function(t,e){...}(...) // PostHog snippet
     </script>

2) Event-tracking:
   - landing_viewed (automaattinen)
   - hero_cta_clicked (Aloita ilmaiseksi / Testaa tasosi)
   - demo_started, demo_question_answered, demo_completed
   - pricing_viewed (scroll-based, >80% osiosta näkyvissä)
   - pricing_card_clicked (free/pro/summer)
   - urgency_bar_clicked, urgency_bar_dismissed
   - faq_opened (kysymys index)
   - comparison_table_viewed
   - lead_magnet_submitted
   - signup_started, signup_completed
   - first_exercise_completed
   - pro_upgrade_clicked, pro_upgrade_completed

3) Microsoft Clarity (synk, <2KB):
   - Rekisteröidy clarity.microsoft.com
   - Hanki project ID
   - Lisää snippet <head>-tagin jälkeen
   - Ota käyttöön heatmaps + session recordings

4) Varoitus: GDPR — molempien pitää olla pois päältä kunnes cookie-consent annettu
   (katso prompt #7)
   - PostHog: posthog.opt_out_capturing() alussa
   - Clarity: clarity("stop") alussa
   - Cookie-consent hyväksyttäessä: posthog.opt_in_capturing(); clarity("start");

5) Dashboardit valmiiksi PostHog:iin:
   - "Conversion funnel": landing → demo → signup → first_exercise → pro_upgrade
   - "Pricing card clicks": vertaa free vs pro vs summer
   - "FAQ engagement": mitkä kysymykset avataan
   - "Drop-off pages": mistä poistutaan eniten

6) Viikkoraportti itselle emailiin (PostHog → email integration)

Commit: "feat(analytics): PostHog + Microsoft Clarity with GDPR gating"
```

---

## #7 GDPR cookie consent (lain vaatima)

```
Puheon indexissä ei ole cookie-consent bannearia. Suomessa GDPR on pakollinen.
Analytiikka ei saa käynnistyä ennen suostumusta (prompt #6 riippuu tästä).

Tehtävä:

1) Luo js/consent.js (vanilla, <3KB minified):
   - Banner alhaalla kun !localStorage.getItem('puheo_consent')
   - 3 nappia:
     - "Hyväksy kaikki" → analytics=true, marketing=true
     - "Vain välttämättömät" → analytics=false, marketing=false
     - "Hallinnoi" → avaa modal jossa yksittäiset toggles
   - Tallenna: localStorage['puheo_consent'] = JSON.stringify({
       essential: true,
       analytics: false,
       marketing: false,
       timestamp: Date.now()
     })
   - 13 kk voimassa, sitten näytä uudelleen

2) Banner-muotoilu (ei peitä sisältöä kokonaan):
   - Fixed bottom, max-height 30vh
   - Backdrop blur
   - Punainen (--brand) accent
   - Linkki /privacy.html "Tietosuojaseloste"
   - Mobile: stackataan napit

3) Lisää index.html, diagnose.html, app.html -footeriin:
   <script type="module" src="js/consent.js"></script>

4) Consent API muille scripteille:
   window.puheoConsent = {
     get: () => JSON.parse(localStorage.getItem('puheo_consent') || '{}'),
     has: (key) => {...},
     onChange: (cb) => {...}
   }

5) Yhdistä PostHog + Clarity:
   window.puheoConsent.onChange(consent => {
     if (consent.analytics) {
       posthog.opt_in_capturing();
       clarity('start');
     } else {
       posthog.opt_out_capturing();
       clarity('stop');
     }
   })

6) Päivitä privacy.html:
   - Lisää cookie-taulukko:
     | Cookie | Tyyppi | Kesto | Tarkoitus |
     | puheo_session | Välttämätön | Session | Kirjautuminen |
     | puheo_consent | Välttämätön | 13kk | Cookie-valinta |
     | ph_* | Analytiikka | 1v | PostHog |
     | _clck, _clsk | Analytiikka | 1v | Clarity |
   - Lisää oikeudet: tarkastus, poisto, siirto (GDPR art. 15-20)
   - Linkki tietosuojavaltuutettuun

7) "Peruuta suostumus" -linkki footeriin → avaa consent-modalin uudelleen

Commit: "feat(gdpr): cookie consent banner + privacy policy update"
```

---

## #8 Performance: critical CSS + font loading

```
Puheon indexissä on 3 Google Fonts (Syne, DM Mono, Lora) ladattuna render-blocking
tavalla. Lighthouse LCP todennäköisesti >3s. Optimoi nopeaksi.

Tehtävä:

1) Font loading:
   - Poista preconnect-linkit <head>istä (rivi 22-24)
   - Lisää font-display: swap suoraan CSS:ään (ei Google Fontsin @import)
   - Hostaa fontit itse public/fonts/ (lataa .woff2 fontsource-kirjastosta)
   - VAIN 3 varianttia per fontti (ei kaikkia painoja):
     - Syne: 400, 700
     - Lora: 400 (italic + regular)
     - DM Mono: Poista kokonaan — käytä system monospace ("Menlo", "Courier New")
   - Preload kriittisimmät:
     <link rel="preload" href="/fonts/syne-700.woff2" as="font" type="font/woff2" crossorigin>

2) Critical CSS inline:
   - Eristä landing.css:stä above-the-fold CSS (nav + hero + urgency bar)
   - Inline <style> <head>:ssä, max 10KB
   - Loput landing.css lataa async:
     <link rel="preload" href="/landing.css" as="style" onload="this.rel='stylesheet'">
   - Käytä `critical` npm-pakettia automatisointiin

3) Kuvat:
   - Kaikki <img> tagit: loading="lazy" + width + height (estää CLS)
   - WebP + fallback (<picture>-elementti)
   - Hero-kortti: SVG mockup tai CSS-pohjainen (ei kuvaa)

4) JavaScript:
   - index.html inline-script: minify + defer
   - <script type="module" src="js/demo.js"></script> → lisää defer
   - PostHog + Clarity: async load

5) Service Worker:
   - Päivitä sw.js:
     - Cache v2: puheo-v2
     - Precache: index.html, landing.css, fonts, screenshots
     - Runtime cache: stale-while-revalidate
   - Bump version (käyttäjät saavat päivityksen)

6) Resource hints:
   <link rel="dns-prefetch" href="https://eu.posthog.com">
   <link rel="preconnect" href="https://eu.posthog.com">

7) Target:
   - Lighthouse Performance >90
   - LCP <2.0s (mobiili 4G)
   - CLS <0.05
   - TBT <100ms

8) Aja ennen/jälkeen Lighthouse ja kirjaa tulokset commit-viestiin

Commit: "perf(landing): critical CSS + self-hosted fonts + image optimization"
```

---

## #9 Exit-intent popup

```
Käyttäjä on hero:ssa, scrollaa alas, lukee FAQ:n — mutta ei klikkaa CTA:ta ja lähtee.
Exit-intent popup on viimeinen tilaisuus saada jotain ylös.

Tehtävä:

1) Luo js/exit-intent.js:
   - Kuuntele mouseleave-event joka triggeröityy kun kursori lähtee yläreunasta
   - Mobiilissa: scroll-up-nopeus > 1200px/s tai back-button
   - Trigger vain KERRAN per session (sessionStorage)
   - Ei näytä jos käyttäjä on alle 20s sivulla (turhautumissa)
   - Ei näytä jos käyttäjä on jo täyttänyt demon tai lead-magnetin

2) Popup-sisältö (kaksi variaatiota A/B testiin):

   VARIANT A — Lead magnet
   Otsikko: "Odota! Ota ilmainen YO-espanja kertausopas mukaasi"
   Alaotsikko: "15 sivua tärkeintä. PDF sähköpostiisi."
   Email input + nappi "Lähetä PDF"
   "Ei kiitos" -linkki pienenä alhaalla

   VARIANT B — Discount urgency
   (vain kesä-syyskuussa)
   Otsikko: "Hetkinen — kesäpaketti loppuu 31.8."
   Alaotsikko: "29€ koko kesä-syyskuu. Säästät 10,96€."
   "Katso tarjous →" (scroll pricingiin)
   "Ei kiitos" -linkki alhaalla

3) Tekninen:
   - Modal overlay (rgba backdrop)
   - Sulkeminen: X, Escape, backdrop click
   - Focus trap modaalissa (saavutettavuus)
   - ARIA dialog
   - CSS transition fade-in 0.3s

4) A/B testaus PostHogissa:
   - Feature flag: exit_intent_variant = "a" | "b"
   - Trackaa: exit_intent_shown, exit_intent_dismissed, exit_intent_converted

5) Ei näytä uudelleen 7 päivään jos dismiss
   (localStorage timestamp)

6) Ei näytä kirjautuneille käyttäjille (check auth cookie)

Commit: "feat(conversion): exit-intent popup with A/B variants"
```

---

## #10 Mobile polish + saavutettavuus

```
70%+ lukiolaisista käyttää mobilea. Pieninkin mobile-haitta tappaa konversion.
Myös saavutettavuus on lain vaatima (EU Accessibility Act 2025).

Tehtävä:

1) Mobile audit:
   - Aja Lighthouse mobile-moodissa, korjaa kaikki warnings
   - Testaa: iPhone SE (375px), iPhone 15 (390px), Galaxy S22 (360px), iPad (768px)
   - Hampurilaisvalikko navissa (nyt rivi 44-49) kun viewport <768px
   - Sticky urgency bar ei saa peittää sisältöä (padding-top)

2) Touch targets:
   - Kaikki napit ja linkit minimissään 44x44px (Apple HIG)
   - CTA-napit hero:ssa stackataan mobilessa (jo OK?)
   - Pricing-kortit: swipeable carousel mobilessa (>600px 3-kolumninen)

3) Tekstit:
   - Otsikot: clamp(1.75rem, 5vw, 3.5rem) responsiivinen
   - Leipäteksti vähintään 16px mobilessa (ei zoomia)
   - Kontrasti 4.5:1 (WCAG AA) — tarkista --text-muted (#9e7a7a) bg:ssä
     #9e7a7a / #0c0808 = contrast 4.88 ✅
     Mutta varmista kaikki tekstit

4) Saavutettavuus:
   - Skip-linkki (on jo app.html:ssä, lisää index.html:ään)
   - Kaikki <img> alt-tekstit (myös ikonit aria-hidden="true")
   - Form labels (email input lead-magnetissa)
   - Focus-tilat näkyvät (outline tai box-shadow)
   - Screen reader -testi (VoiceOver tai NVDA)
   - Navigaatio toimii pelkillä näppäimillä (Tab)

5) Reduced motion:
   @media (prefers-reduced-motion: reduce) {
     * { animation: none !important; transition: none !important; }
   }

6) Color contrast -lint:
   - axe-core CLI: npx @axe-core/cli http://localhost:3000
   - Korjaa kaikki errors

7) Mobile-specific:
   - Bottom nav mobilessa (on jo app.html:ssä)
   - Swipeable FAQ-items (onnellisuuskerroin)
   - Tap-to-call: <a href="mailto:tuki@puheo.fi"> footerissa

8) Testaus oikeilla laitteilla:
   - BrowserStack free trial TAI ngrok + oma puhelin
   - Testaa: Safari iOS, Chrome Android

9) Lighthouse tavoitteet mobilessa:
   - Performance >90
   - Accessibility >95
   - Best Practices >95
   - SEO >95

Commit: "fix(mobile): responsive polish + WCAG AA accessibility"
```

---

# PRIORISOITU JÄRJESTYS ENNEN LAUNCHIA (1.6.2026)

**Vko 1 — Kriittinen**
1. #1 Oikeat screenshotit (1 päivä)
2. #7 GDPR cookie consent (½ päivää)
3. #6 Analytiikka PostHog + Clarity (½ päivää)
4. #8 Performance optimointi (1 päivä)

**Vko 2 — Konversio**
5. #2 Interaktiivinen demo (1 päivä)
6. #3 About-sivu + trust (½ päivää)
7. #5 Vertailutaulukko (½ päivää)
8. #10 Mobile + saavutettavuus (1 päivä)

**Vko 3-4 — Lead gen**
9. #4 Lead magnet PDF + email (2 päivää)
10. #9 Exit-intent popup (½ päivää)

Yhteensä ~10 työpäivää → valmis 10.5. → 3 viikkoa testausta ennen launchia.

---

Jos haluat että kaivan syvemmin johonkin (esim. teen valmiin demo-JSON:in tai kirjoitan about.html-luonnoksen), sano mihin.
