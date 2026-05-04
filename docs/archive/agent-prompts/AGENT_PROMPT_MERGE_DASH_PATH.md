# L-MERGE-DASH-PATH — yhdistä Oma sivu + Oppimispolku yhdeksi etusivuksi

> Lue ENSIN: `AGENT_PROMPT_STANDARDS.md` (juuressa) ja `AGENT_STATE.md`. Loop-merkintä `AGENT_STATE.md`:hen on max 7 riviä (STANDARDS §7).

---

## 1. Konteksti — mikä on rikki

Käyttäjän testi tuotannossa (4.5.2026) paljasti:

**Oma sivu** (`screen-dashboard`) on **18 erillistä komponenttia** samalla sivulla — visuaalinen kaaos. Käyttäjä ei saa selvää mihin pitäisi klikata.

**Oppimispolku** (`screen-path` — joka itse asiassa renderöi `js/screens/curriculum.js`:n kautta `screen-curriculum`-sisältöä; `learningPath.js` on legacy-tiedosto vanhasta Duolingo-polusta) on **lähes tyhjä** — 8 kurssikorttia ja paljon tyhjää tilaa.

**Päätös:** yhdistetään nämä yhdeksi etusivuksi. **"Oma sivu" -navi-item poistuu kokonaan.** Uusi etusivu = "Oppimispolku" + yhdistetty osio joka kertoo missä menen, mitä teen seuraavaksi, ja YO-valmiuden tila.

**Säilyttämisen kriteeri:** edistääkö komponentti YO-valmistautumista, ja näkeekö käyttäjä sen 80 % käynneistä?

---

## 2. Mitä SÄILYTETÄÄN uudessa yhdistetyssä etusivussa

Lähde: nykyinen `screen-dashboard` (`app.html` rivit 643–800-ish) + nykyinen `screen-path` (`app.html` rivit 565–602) + curriculum-renderöinti (`js/screens/curriculum.js`).

**Pidä nämä komponentit, järjestyksessä ylhäältä alas:**

1. **Tervehdys-headeri** — `dash-greeting`
   - Otsikko ("Iltaa, testpro123.")
   - Päivämäärä-eyebrow
   - **Päivän putki** (`dash-greeting__streak`) — säilytä, näkyy headerissa
   - Älä tuo `dash-motivation`-tekstiä mukaan (geneerinen)

2. **Jatka tästä -CTA** (yksi iso, ei kaksi) — uudelleenkäytä `dash-day-cta` -nappia
   - Logiikka prioriteettijärjestyksessä:
     1. Jos käyttäjällä on kesken oleva oppitunti kurssipolusta → "Jatka oppituntia: K1L2 — Esittäytyminen" → vie suoraan `screen-lesson`iin
     2. Muuten jos `repetitions_due > 0` → "Kertaa nyt — N korttia" → vie `screen-quick-review`iin
     3. Muuten jos kurssia ei aloitettu → "Aloita kurssi 1 — Kuka olen" → vie `screen-lesson`iin K1L1
     4. Muuten (kaikki tehty) → "Tee tämän päivän kertaus" → vie kertaukseen
   - **Vain YKSI nappi näkyvissä kerrallaan.** Ei kahta CTA:ta.

3. **Oppimispolku — kurssikortit (8 kpl)** — tämän pitää **dominoida visuaalisesti**, koska se on tuotteen ydin
   - Käytä nykyistä `js/screens/curriculum.js`-renderöijää
   - Aktiivinen kurssikortti: 1.5–2× suurempi kuin lukitut (kuten hotfix-promptissa todettiin)
   - Header: "Oppimispolku" + sub: "8 kurssia · YO-koevalmiiksi · X / 8 suoritettu"
   - Tämä osio on visuaalisesti suurin sivulla

4. **YO-valmius -kortti** — `dash-mastery-strip` (jos olemassa) tai luo uusi
   - Iso prosentti (esim. "0 % valmiina YO-kokeeseen")
   - 10 osa-aluetta neliöinä (mastered / in progress / not started)
   - Heikot kohdat: 2–3 riviä (esim. "Artikkelit · 100 % virhe", "Relatiivipronominit · 50 % virhe")
   - Kompakti — ei kahta erillistä laatikkoa "Heikot kohtasi" + "YO-valmius" kuten nyt

5. **(Alaosa, vähemmän tärkeä) Viimeisimmät harjoitukset + Kehitys ajan mittaan**
   - Nämä saavat olla pienempinä alarivissä, kahden palstan layoutissa desktop ja stack mobile
   - Otsikot: "Viimeisimmät harjoitukset" (lista 3 viimeistä) + "Kehitys" (mini-graafi)

**Siinä se. 5 osiota, ei 18.**

---

## 3. Mitä LEIKATAAN POIS kokonaan

Älä siirrä Asetuksiin, älä piilota — **poista koodista** (kommentoi `<!-- LEGACY ... -->` STANDARDS §5:n mukaisesti, varsinainen poisto myöhemmin):

- `dash-tutor` (AI-tutor-laatikko) — geneerinen teksti
- `dash-hero-grade` (iso E Eximia -badge) — duplikoi YO-valmius-tietoa
- `daily-challenge` (Tänään · Haaste — Ympäristösanasto) — käyttäjä päätti: pois. Kurssipolku on päämekaniikka, adaptiivinen päivän haaste ei sovi sen rinnalle.
- `dash-mastery-progress` (Matka tasolle C, kysymyksiä/sessioita/päiviä/keskiarvo) — duplikoi YO-valmius-osion
- `dash-ai-quota` (AI-kutsuja tässä kuussa: 3) — debug-info
- `dash-domain-strip` / Osa-alueet (Sanasto/Kielioppi/Luetun ymm./Kirjoittaminen) — duplikaattia YO-valmiuden 10 osa-alueen kanssa
- `dash-suggestions` / Suositukset (3 korttia "Kokeile: Sanasto" jne.) — duplikoi kurssipolkua + heatmapia
- `dash-activity-heatmap` (Aktiivisuus · 30 päivää) — koristelu
- `dash-upcoming-reviews` (Tulevat kertaukset · 30 päivää -palkkikaavio) — kertaa-CTA kertoo jo määrän
- Etusivun "Yo-koesimulaatio + Aiemmat kokeet" -osio — siirry navin Koeharjoitus-itemiin (on jo siellä, tarkista)
- Iso vihreä "Aloita harjoittelu →" -nappi alaosassa — duplikoi Jatka-CTA:n
- "Tee tasokartoitus uudelleen" -linkki — siirrä Asetuksiin (jos ei jo siellä, lisää sinne)

---

## 4. Navi-muutokset

**Desktop sidebar** (`app.html` rivit 86–115):
- POISTA `<button class="sidebar-item" data-nav="dashboard" id="nav-dashboard">...Oma sivu</button>` kokonaan
- Muuta `data-nav="path"` -nappi (Oppimispolku) **defaultiksi/aktiiviseksi** ja siirrä se ensimmäiseksi sidebarissa
- Muuta sen ikoni: nykyinen "polku"-ikoni on hyvä, mutta otsikko voi olla joko "Oppimispolku" tai "Etusivu" — käyttäjä päättää (kysy tarvittaessa, oletuksena "Oppimispolku")

**Mobile bottom nav** (`app.html` rivit 129–141):
- "Koti" (`data-nav="dashboard"`) → muuta `data-nav="path"` ja säilytä label "Koti" tai vaihda "Polku"
- Muut nelikko (Sanasto/Puheoppi/Lukeminen/Kirjoitus) säilyy

**Router** (`js/main.js`):
- `nav === "dashboard"` → poista käsittely tai redirectaa `path`:iin
- `nav === "path"` → kutsuu jo `loadCurriculum()`. Tämä funktio pitää nyt renderöidä YHDISTETTY näkymä (kurssikortit + uusi yhteenveto-osio yläpuolella).
- Default route kun käyttäjä kirjautuu sisään → `path` (eikä enää `dashboard`)

**Älä riko deep-linkkejä:** jos joku URL on `#dashboard` tai `?screen=dashboard`, redirectaa `path`:iin. Lisää siirtymä-koodi `js/main.js`:n alkuun.

---

## 5. Layout — desktop vs mobile

**Desktop (≥1024px):**
- Sivun max-width: 1280–1400px (sama kuin curriculum nyt, tarkista hotfix #18:n säätö)
- Sisältö keskitettynä
- Alarivi (Viimeisimmät + Kehitys): 2 palstaa side-by-side

**Mobile (<768px):**
- Kaikki stack pystyssä
- Kurssikortit: full-width
- YO-valmius-kortti: full-width, neliöt rivissä responsively
- Alarivi stackaa pystyyn

**Spacing:** seuraa `puheo-screen-template/SKILL.md`-skilliä. Älä keksi omia paddingeja.

---

## 6. Pakolliset skillit ja workflow

Ennen koodaamista lue:

**Puheon omat:**
- `.claude/skills/puheo-screen-template/SKILL.md`
- `.claude/skills/puheo-finnish-voice/SKILL.md` — KAIKKI uusi/muutettu copy
- `.claude/skills/ui-ux-pro-max/SKILL.md`

**Education-skillit (matchaavat):**
- `education/cognitive-load-analyser/SKILL.md` — koko tämän loopin pointti on KOGNITIIVISEN KUORMAN VÄHENTÄMINEN. Aja tämä ensin ja sovella sen ohjeita.
- `education/flow-state-condition-designer/SKILL.md` — yksi selkeä CTA, ei valintaparalysiaa
- `education/self-efficacy-builder-sequence/SKILL.md` — "0 % valmius" ei saa lannistaa, kehystä eteenpäin

**Design-pluginit (kutsu nimellä):**
- `design:ux-copy` — uudet otsikot, CTA-tekstit, empty-statet
- `design:design-critique` — Playwright-screenshotit @ 1440 + 375, applya feedback
- `design:accessibility-review` — axe-core sweep loop:n päättyessä

**21st.dev-sourcing** (STANDARDS §3): jos lisäät uudentyyppistä komponenttia (esim. uudistettu YO-valmius-kortti jossa 10 neliötä), sourcaa 21st.devistä. Jos vain järjestät olemassa olevia komponentteja → ei tarvita.

---

## 7. Toteutusjärjestys (UPDATEt)

**UPDATE 1 — leikkaa ensin, lisää sitten**
Kommentoi `<!-- LEGACY -->` -tagilla kaikki §3:n elementit `app.html`:ssä. Älä poista, jotta diff pysyy luettavana ja palautus on helppo. JS-tiedostoissa kommentoi vastaavat init/render-kutsut.

Verify: `npm run build` clean, dashboardilla näkyy enää §2:n elementit.

**UPDATE 2 — yhdistä screen-dashboard ja screen-path**
- Poista `<div id="screen-dashboard">` div ja sen wrapper kokonaan TAI uudelleennimeä `screen-path`-sisällön osaksi. Suositeltu: säilytä `screen-path` kontaminaattorina, siirrä §2:n säilytettävät komponentit sen sisään ENNEN `path-nodes`-elementtiä.
- Uusi rakenne `screen-path`:n sisällä:
  ```html
  <div id="screen-path" class="screen">
    <div class="path-inner">
      <header class="dash-greeting"> ... </header>           <!-- §2 osio 1 -->
      <button class="btn--cta" id="dash-day-cta"> ... </button>  <!-- §2 osio 2 -->
      <section class="path-courses">                          <!-- §2 osio 3 -->
        <div class="path-header"> ... </div>
        <div class="path-nodes" id="path-nodes"></div>        <!-- curriculum.js renderöi -->
      </section>
      <section class="yo-readiness"> ... </section>           <!-- §2 osio 4 -->
      <div class="path-footer-grid">                          <!-- §2 osio 5 -->
        <section class="recent-exercises"> ... </section>
        <section class="progress-mini-chart"> ... </section>
      </div>
    </div>
  </div>
  ```
- Poista `screen-dashboard` div kokonaan tai jätä `<div id="screen-dashboard" hidden></div>` -placeholderiksi route-redirectin varalta

Verify: visuaalinen Playwright-screenshot 1440 + 375.

**UPDATE 3 — navi-muutokset**
§4 mukaisesti. Sidebar + bottom nav + router + default route.

Verify: `e2e-landing-smoke.spec.js` ei riko, lisää uusi smoke-testi joka klikkaa "Oppimispolku" sidebarista ja varmistaa että §2:n osiot 1, 3 ja 4 ovat näkyvissä.

**UPDATE 4 — YO-valmius-kortin uusi muotoilu**
Tämä on UI-osa joka tarvitsee 21st.dev-sourcing-passin (uusi komponentti):
- Hae `21st.dev/s/progress-card`, `21st.dev/s/score-card`, `21st.dev/s/skill-tracker`
- Screenshot 2–3 kandidaattia → `references/yo-readiness/21stdev/`
- Pick restrained dark, port React+Tailwind → vanilla CSS Puheon tokeneilla
- Cite component URL `IMPROVEMENTS.md`-rivissä

Komponentin sisältö:
- Iso prosentti (mono-num font), label "valmiina YO-kokeeseen"
- 10 neliötä rivissä, värikoodi: harmaa (not started) / turkoosi-outline (in progress) / täysi turkoosi (mastered)
- Pieni teksti "Heikot kohdat:" + 2–3 chip-tyylistä riviä
- Älä toista YO-pisterajoja-tietoa joka oppitunnissa on jo

Verify: axe-core sweep, design:design-critique screenshot, design:accessibility-review.

**UPDATE 5 — alarivi (Viimeisimmät + Kehitys mini-chart)**
Pidä yksinkertaisena. Jos mini-chart on liian iso operaatio, tee placeholder "Tulossa pian" -teksti ja merkitse pending-listaan. Älä viivästytä koko looppia tämän vuoksi.

Verify: kuten yllä.

**UPDATE 6 — copy-tarkistus + final sweep**
- Aja `design:ux-copy` jokaisen näkyvän tekstin yli
- Aja `puheo-finnish-voice/SKILL.md` (tee sitä mitä skilli sanoo)
- axe-core sweep @ 1440 + 375 → 0 violations
- design:design-critique molemmissa kokoissa
- E2E: kirjautuminen → default route on path → kurssikortit näkyvät → Jatka-CTA klikkaa → menee oppituntiin

---

## 8. Verifiointi-checklist (loop ei ole valmis ennen kuin kaikki ✓)

- [ ] `npm test` 1064/1064 ✓ (uusia testejä saa lisätä, vanhoja ei rikkoa)
- [ ] `npm run build` clean
- [ ] axe-core 0 violations @ 1440 + 375 yhdistetyssä etusivussa
- [ ] Playwright screenshot 1440 + 375 → design:design-critique applattu
- [ ] Sidebar: Oma sivu poistunut, Oppimispolku ensimmäisenä ja oletus-aktiivinen
- [ ] Bottom nav: "Koti" / "Polku" -ikoni vie polkuun, ei vanhaan dashiin
- [ ] Default route kirjautumisen jälkeen = path
- [ ] Deep-link `#dashboard` redirectaa `#path`iin
- [ ] §3:n LEGACY-kommentoidut elementit eivät näy DOMissa eivätkä init-kutsuissa
- [ ] Yksi CTA Jatka-osiossa, ei kahta
- [ ] Kurssikortit dominoivat visuaalisesti (suurin osio sivulla)
- [ ] YO-valmius-kortti citettu 21st.dev-URL `IMPROVEMENTS.md`-rivissä
- [ ] `AGENT_STATE.md` päivitetty (max 7 riviä uudelle loop:lle, vanhin siirretty arkistoon jos ylittyi)
- [ ] `IMPROVEMENTS.md` päivitetty (max 3 riviä per UPDATE)
- [ ] SW-bumppi (uusi v117 → v118) jos STATIC_ASSETS muuttui
- [ ] PR-otsikko: `feat(home): merge dashboard + learning path into single home [L-MERGE-DASH-PATH]`

---

## 9. Mitä EI saa tehdä tässä loopissa

- ÄLÄ koske kurssin sisältöön (`data/courses/**/*.json`) — Batch 2 -generointi on erillinen työ
- ÄLÄ koske kurssikortti-renderöijän logiikkaan jos voit välttää (vain layout/grid muuttuu)
- ÄLÄ tee uutta `loadDashboard()`-funktiota — uudelleenkäytä olemassa olevia data-fetchejä, vain UI-osa yhdistyy
- ÄLÄ poista `dashboard.js`-tiedostoa kokonaan — sieltä saatetaan tarvita data-funktioita (esim. weak topics fetch). Kommentoi vain ne osiot jotka eivät ole enää käytössä.
- ÄLÄ koske `screen-lesson`, `screen-mode-*` tai harjoitusscreeneihin
- ÄLÄ aja Supabase-migraatioita — ei pitäisi tarvita, kaikki muutos on frontendissä
- ÄLÄ bumppaa SW jos STATIC_ASSETS ei muuttunut (tarkista `sw.js`)

---

## 10. Pending / käyttäjälle ACTION REQUIRED

Loopin lopuksi listaa `IMPROVEMENTS.md`:hen:
- Onko Aiemmat kokeet -lista nyt löydettävissä Koeharjoitus-näkymästä? Jos ei, tarvitaan erillinen pieni loop sen siirtoon
- Mini-chart placeholder vai oikea graafi? (käyttäjä päättää seuraavassa loopissa)

Jos jokin §2:n säilytettävä komponentti vaatii uutta backend-endpointia (esim. "kesken oleva oppitunti" -tieto Jatka-CTA:lle), älä keksi omaa tietoa — kysy käyttäjältä commit-messagessa pending-blockerina ja tee Jatka-CTA:lle väliaikainen fallback (näytä aina K1L1 jos kurssi ei aloitettu, muuten viimeisin avattu kurssi).
