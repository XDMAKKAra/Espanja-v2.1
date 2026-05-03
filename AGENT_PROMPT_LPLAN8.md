# Agent Prompt — L-PLAN-8
# Landing-polish + dashboard empty-state + a11y-katto + "elävä" hero ilman generoituja kuvia

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **landing + dashboard polish-passi**, ei feature-loop. Tarkoitus: nostaa landing-sivun ja keskeisten näkymien viimeistely Linear/Vercel-tasolle ilman että lisätään AI-generoituja kuvia tai uusia featureita.

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, 21st.dev sourcing-säännöt. Standardilohko on PAKOLLINEN jokaiseen UPDATEen tässä loopissa.**
2. `AGENT_STATE.md` — koko tiedosto, varmista että L-PLAN-7 on shipattu (grep IMPROVEMENTS.md `[L-PLAN-7]`)
3. `index.html` + `css/landing.css` koko tiedosto — tunne nykyinen landing-rakenne
4. `app.html` `#screen-dashboard` -lohko + `js/screens/dashboard.js` + `css/components/dashboard.css`
5. `js/screens/curriculum.js` + `css/components/curriculum.css` — Oppimispolku-näkymä (yksi hover-fix tähän)
6. `js/features/meteors.js` — referenssi siitä miten teet "scroll-into-view → animate" -kuvioita; kierrätä sama tekniikka tämän loopin live-elementteihin
7. IMPROVEMENTS.md viimeiset 80 riviä

Verify L-PLAN-7 is shipped: grep IMPROVEMENTS.md for `[L-PLAN-7]`. If missing, STOP.

---

## Konteksti

Käyttäjä otti screenshotit landing-sivulta + dashboardista + Oppimispolusta (2026-05-03). Sivut näyttävät jo erinomaisilta — tämä on **viimeistelyloop, ei uudelleenrakennus**. Pidä Linear-tier estetiikka. Älä lisää AI-generoituja kuvia (käyttäjä kysyi nimenomaan tätä — vastaus on EI, koska tuoteruudut kommunikoivat tehokkaammin ja AI-art rikkoo kategorian uskottavuuden 17-vuotiaalle YO-kokeeseen valmistautujalle).

**Käyttäjän vahvistettu lopputavoite:**
> "Hero + dashboard tuntuvat eläviltä ilman että ne luistavat kohti stocky/AI-look. Ja a11y on AA jokaisella isolla pinnalla."

---

## Skills + design plugins käyttöön

**Aktivoi nämä, lue niiden SKILL.md ennen kunkin UPDATEn aloittamista** (STANDARDS-pohjan päälle):

- `puheo-screen-template` — KAIKKI muutetut näkymät
- `puheo-finnish-voice` — KAIKKI copy-muutokset (UPDATE 2 + 4 + 5)
- `ui-ux-pro-max` — KAIKKI UPDATEt — focus-ringit, motion, reduced-motion, touch targets ≥ 44 px

Education-skillit:
- `education/cognitive-load-analyser` — UPDATE 5 (dashboard empty-state lyhennys), UPDATE 2 (älä lisää infoa heroon — karsi)
- `education/self-efficacy-builder-sequence` — UPDATE 4 (Pro-cardin x-rivit eivät shameta vaan houkuttelevat — ei "et saa" vaan "kokeile")

Design plugins:
- `design:ux-copy` — JOKAISEN copy-muutoksen jälkeen UPDATEissa 2, 4, 5, 7
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen, viimeisenä UPDATE 8 vetää koko sivun läpi
- `design:design-critique` — Playwright-screenshotit kaikista muutetuista näkymistä @ 1440 + 375 → applya feedback ennen sulkua
- `design:design-system` — UPDATE 6 jos lisäät uusia tokeneita (varmista naming-konsistenssi)
- `design:taste-frontend` jos saatavilla — KAIKKEEN UPDATE 1–3 frontend-työhön

**21st.dev sourcing — pakollinen seuraaville uusille / refaktoroiduille komponenteille:**

| UPDATE | Komponentti | Hakusanat |
|---|---|---|
| 1 | Live "tickering" sana sanasto-cardissa (esim. typewriter / fade-cycle) | `21st.dev/s/typewriter`, `21st.dev/s/text-rotate`, `21st.dev/s/words-fade` |
| 1 | Hero-bokeh / radial-glow drift | `21st.dev/s/aurora`, `21st.dev/s/spotlight`, `21st.dev/s/background-gradient` |
| 3 | Toinen tuoteruutu scroll-trigger -reveal | `21st.dev/s/scroll-reveal`, `21st.dev/s/parallax`, `21st.dev/s/fade-in` |
| 4 | Pro/Free-cardin x-rivin tooltip / popover | `21st.dev/s/tooltip`, `21st.dev/s/hover-card` |
| 7 | Lock-locked-curriculum-card hover-tooltip | `21st.dev/s/tooltip`, `21st.dev/s/popover` |

Workflow joka kandidaattisetille (per STANDARDS §3):
1. Visit 21st.dev/s/<term> Playwrightilla
2. Screenshot 2–3 kandidaattia → `references/app/landing-polish-l8/21stdev/<feature>/`
3. Pick most restrained dark — ei loud-glow, ei rainbow-gradientti
4. Port React+Tailwind → vanilla CSS, käytä olemassa olevia tokeneita (`--accent`, `--surface`, `--text` jne.)
5. Cite EXACT 21st.dev URL IMPROVEMENTS.md-rivissä per UPDATE

Jos 21st.devistä ei löydy sopivaa: Magic UI → shadcn → Aceternity → HyperUI järjestyksessä, sama workflow.

---

## UPDATE 1 — Hero "elävyys" ilman generoituja kuvia

### Tavoite
Hero ei saa muutu staattisesta. Lisätään 2 hienovaraista live-elementtiä jotka kommunikoivat että tuote oikeasti elää ja tekee asioita.

### A. Vaihtuva esimerkki-sana sanasto-card-mockupissa (joka on osa "Kolme aluetta"-osiota — toinen ruutu)

Nykyinen kortti näyttää staattisesti: `¿Qué significa «el estrés»?` + 4 vastausvaihtoehtoa.

Tee siitä **rotaatio**: 5 sekunnin välein cardin kysymyssana vaihtuu, vastausvaihtoehdot vaihtuvat, oikea vastaus pysyy aina vihreällä reunalla. 4–6 esimerkkiparia kierrossa, B1-B2 tasoa, YO-aiheita.

Esimerkit (käytä näitä, älä keksi):
1. `«el estrés»` → stressi (väsymys / onnellisuus / rohkeus)
2. `«la huelga»` → lakko (loma / kokous / vapaapäivä)
3. `«el medio ambiente»` → ympäristö (sää / ilmasto / luonto)
4. `«ahorrar»` → säästää (ostaa / kuluttaa / lainata)
5. `«la jubilación»` → eläke (palkka / loma / työpaikka)
6. `«el desempleo»` → työttömyys (lakko / palkka / loma)

**Tekniikka:** käytä `IntersectionObserver`:ia kuten `js/features/meteors.js` — rotaatio käynnistyy vasta kun kortti on viewportissa, pysähtyy kun se poistuu. `prefers-reduced-motion: reduce` → ei rotaatiota, näkyy vain ensimmäinen pari staattisesti.

**Animaatio:** crossfade 250 ms (opacity vain — ei translate, ei scale). Vihreä reuna oikealle vastaukselle pysyy paikallaan, sisäinen sisältö vaihtuu.

**21st.dev:** sourcaa `text-rotate` / `words-fade` -patterni viiteenä. Älä käytä typewriter-efektiä — se lukkoaa Suomen lukijan katseen ja häiritsee scrollia.

### B. Hero-taustan radial-glow drift

Nykyinen vihreä bokeh on staattinen. Tee siitä erittäin hidas drift:

```css
@keyframes hero-bokeh-drift {
  0%   { transform: translate3d(0, 0, 0); }
  50%  { transform: translate3d(2%, -1%, 0); }
  100% { transform: translate3d(0, 0, 0); }
}
.hero-bokeh {
  animation: hero-bokeh-drift 60s ease-in-out infinite;
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .hero-bokeh { animation: none; }
}
```

60 sekunnin loop = lähes huomaamaton silmälle, mutta antaa "elävän" tunteen kun katsoo sivua 10 sekuntia. Älä mene yli 3% translatessa — muuten layout-pop on liian iso.

**21st.dev:** sourcaa `aurora` / `spotlight` -patterni viitteeksi miten muut sivut tekevät tämän — mutta ÄLÄ porttaa Aceternityn rainbow-aurora-komponenttia 1:1, se on liian loud. Hae rauhallisin versio.

### Verifiointi
- IntersectionObserver toimii sekä Chromessa että Safarissa
- Reduced-motion → 0 animaatiota
- Lighthouse Performance ei heikkene (animaatio on `transform` + `opacity` only — ei layout reflowta)
- Crossfade ei aiheuta CLSiä (cardin korkeus pysyy vakiona)

---

## UPDATE 2 — Hero copy + trust-row

### Tavoite
Vahvistaa hero-conversionia 3 pienellä copy-muutoksella, ilman että muutetaan H1:tä (käyttäjä piti siitä).

### Muutokset

**A. Toinen CTA-nappi:**
- Nykyinen: `Katso miten se toimii`
- Uusi: `Näe esimerkkiarviointi →`
- Anchor: `#kirjoitusarviointi` (nimeä `<section id="kirjoitusarviointi">` ympäröimään "Tekoäly, joka korjaa kuten YTL-arvioija"-osiota)
- Ihminen joka klikkaa "katso miten se toimii" odottaa tour-videota — ei ole sellaista, ja siksi nappi on heikko. Konkreettinen "näe esimerkkiarviointi" lupaa tuoteruudun jonka käyttäjä saa heti.

**B. Trust-rivi — lisää 4. ankkuri:**
- Nykyinen: `Ei luottokorttia · Suomen kielellä · Toimii selaimessa`
- Uusi: `Ei luottokorttia · Suomen kielellä · 8 kurssia, 90 oppituntia · Toimii selaimessa`
- **TARKISTA ENSIN** lukumäärät `lib/curriculumData.js`:stä — käytä todellisia lukuja, älä näitä jos ne ovat vanhentuneet
- "8 kurssia, 90 oppituntia" rauhoittaa "saanko rahoilleni vastinetta" -pelon

**C. Kirjoittaminen-cardin (osio 2) metric-rivi puuttuu:**
- Sanasto-card: `2 000+ SANAA · 8 AIHETTA`
- Kielioppi-card: `1 200+ AUKKOTEHTÄVÄÄ · ADAPTIIVINEN`
- Kirjoittaminen-card: `YTL-RUBRIIKIN MUKAINEN PALAUTE` ← liian löysä
- **Uusi:** `~30 S ARVIOINTI · 4 OSA-ALUETTA` (osa-alueet: viestinnällisyys, kielen rakenteet, sanasto, kokonaisuus per ruutu 4)
- **Tarkista** `routes/writing.js` ettei arviointi tosi kestä paljon kauemmin — jos kestää, säädä lukua. Jos arviointi on alle 60 s 95-prosentilla, "~30 s" on rehellinen.

**D. "Katso miten se toimii" -copy "Näin se etenee" -osiossa:**
- Step 01 kuvauksessa: `"…rakentaa kertausjonon, joka osuu tarkasti niihin kohtiin…"`
- Sana "kertausjono" ei ole vielä esitelty käyttäjälle hero-tasolla. Vaihda: `"…rakentaa harjoituslistan, joka osuu tarkasti niihin kohtiin…"`
- "Kertausjono" jää terminä Pro-cardin featurelistalle ja dashboardiin sisäänkirjautuneelle käyttäjälle, jossa se on jo opetettu

### Skillit
Aja `puheo-finnish-voice` JOKAISEEN copy-muutokseen + `design:ux-copy` -skill. Älä shippaa ennen kuin molemmat ovat hyväksyneet.

### Verifiointi
- Anchor-scroll `#kirjoitusarviointi` → toimii smooth-scrollilla
- Käytetyt numerot (8 kurssia, 90 oppituntia, 2000+ sanaa, 1200+ aukko) ovat **todellisia** — grep `lib/curriculumData.js` + manually count
- Trust-rivi mahtuu 1 riville desktopilla, 2 riville mobiililla — älä päästä 3 riviin

---

## UPDATE 3 — Toinen tuoteruutu scrollin alas (writing-arviointi)

### Tavoite
Hero-tuotekuva on yksi tuoteruutu (dashboard). Lisää toinen tuoteruutu kun käyttäjä scrollaa "Tekoäly, joka korjaa kuten YTL-arvioija"-osioon — tällä hetkellä siinä on "Sähköposti ystävälle"-mockup vasemmalla ja teksti+checklist oikealla. Mockup on hyvä, mutta se ei reagoi scrolliin.

### Muutos
Lisää scroll-trigger reveal-animaatio mockupille:
- Mockup aloittaa `opacity: 0; transform: translateY(20px)` -tilassa
- Kun se tulee 60 % viewportin korkeudesta → `opacity: 1; transform: translateY(0)`, transition 600 ms cubic-bezier(0.16, 1, 0.3, 1)
- Tekstiin oikealla sama efekti **+ 150 ms delay** → kaksiportainen reveal joka tuntuu suunnitelmalta, ei keinotekoiselta
- Reduced-motion → ei translate/opacity-transition, näkyy heti `opacity: 1`

### Tekniikka
```js
// js/features/scroll-reveal.js — uusi tiedosto
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('is-revealed');
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.4, rootMargin: "0px 0px -10% 0px" });

document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
```

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 600ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
[data-reveal].is-revealed { opacity: 1; transform: translateY(0); }
[data-reveal][data-reveal-delay="150"] { transition-delay: 150ms; }

@media (prefers-reduced-motion: reduce) {
  [data-reveal] { opacity: 1; transform: none; transition: none; }
}
```

Lisää data-attribuutit `index.html`:n kirjoitusarviointi-osioon. Käytä samaa primitiviä myös "Kolme aluetta"-osion 3 kortille (vasemmalta oikealle, 0/100/200 ms delay), jolloin landing tuntuu yhtenäiseltä.

**21st.dev:** sourcaa `scroll-reveal` / `fade-in` viiteenä. Pitää olla minimaalinen — ei spring-physicsiä, ei rotateXia.

### Verifiointi
- Toimii Safari (Webkit) IntersectionObserverilla — joillain vanhoilla iOSilla on quirkeja, testaa
- Reduced-motion → 0 transition-aikaa
- Eivät reveali tuplasti jos käyttäjä scrollaa edestakaisin (`io.unobserve(e.target)` hoitaa)
- Lighthouse CLS-score pysyy ≤ 0.05

---

## UPDATE 4 — Hinnoittelu-cardin Pro-houkutus

### Tavoite
Vapaa-cardin x-rivit (rastitut featuret) ovat tällä hetkellä passiivisia. Tehtävä houkutella, ei shamettaa.

### Muutos A — x-rivien tooltip
Jokainen x-rivi saa tooltipin / hover-cardin joka kertoo lyhyesti mitä menettää + 7 pv ilmainen Pro-kokeilu CTA.

| X-rivi | Tooltip-sisältö |
|---|---|
| Adaptiivinen kertausjono virheidesi pohjalta | "Vain virheesi joista oppinet eniten — Pro:ssa kertausjono kasvaa joka virheen jälkeen. **Kokeile 7 pv ilmaiseksi →**" |
| Rajaton kirjoitusarviointi YTL-rubriikilla | "Vapaassa 3 kirjoitusta/kk. YO-koetta varten suositus on 1–2 kirjoitusta/viikko. **Kokeile 7 pv ilmaiseksi →**" |
| Henkilökohtainen YO-valmius-mittari | "Päivittäin päivittyvä YO-valmius-prosentti 4 osa-alueen tarkkuudella. **Kokeile 7 pv ilmaiseksi →**" |

CTA tooltipissa on linkki → `#hinnat` anchor + sisäänkirjautumisen jälkeen `?action=trial` query-param joka triggeröi Pro-trial-flowin (sama flow kuin Pro-cardin "Kokeile Pro 7 pv ilmaiseksi" -nappi).

### Muutos B — "Suosituin"-badge → context-spesifinen
- Nykyinen: `SUOSITUIN`
- Uusi: `SUOSITELTU YO-KOETTA VARTEN`
- Pidempi mutta vie pois geneerisestä "kaikki ottaa tämän" -framingistä → spesifiseen "tämä on oikea tähän tarkoitukseen" -framingiin

Jos badge-leveys ei mahdu nykyiseen paikkaan, säädä cardin top-padding + badge-fontti pienemmäksi (ei alle 11px).

### Skillit
- `puheo-finnish-voice` jokaiseen tooltip-tekstiin
- `design:ux-copy` jokaiseen tooltipiin — älä päästä yli 110 merkkiä per tooltip
- `education/self-efficacy-builder-sequence` — varmista että copy ei lue "et saa" / "et voi" -framingissä, vaan "kokeile" / "saat"

### 21st.dev
Sourcaa `tooltip` + `hover-card` 2 kandidaattia → `references/app/landing-polish-l8/21stdev/tooltip/`. Pick most restrained — ei väripyöritystä, ei isoa border-radiusta. Touch-laitteille tooltip aukeaa tap-pidolla 400 ms (käytä `pointerdown` + setTimeout).

### Verifiointi
- Tooltip toimii hiiri- + näppäimistö- + touch-input:lla
- aria-describedby + role="tooltip" oikein per WAI-ARIA APG
- Mobiililla tap-pito aukaisee, toinen tap muualla sulkee
- Tooltip ei jää screenin ulkopuolelle reunoille (auto-flip)

---

## UPDATE 5 — Dashboard empty-state lyhennys + small fixes

### Tavoite
Dashboard #screen-dashboard tällä hetkellä näyttää tyhjälle käyttäjälle: "Tee vähintään 10 harjoitusta 3 eri osa-alueesta, jotta voimme arvioida YO-tasoasi." → 14 sanaa, 80 merkkiä, liian pitkä.

### Muutos A — empty-state copy
- Nykyinen: `Tee vähintään 10 harjoitusta 3 eri osa-alueesta, jotta voimme arvioida YO-tasoasi.`
- Uusi: `Tee 10 harjoitusta 3 osa-alueesta — sitten arvio.` (8 sanaa, 49 merkkiä)
- H1:n alapuolella: `10 minuuttia espanjaa — ja tilanne paranee.` — tämä on hyvä, älä kosketa
- Tarkista että copy on `js/screens/dashboard.js`:ssä eikä app.html:n staattisessa templatessa — sijainti riippuu siitä miten L-PLAN-3+ rakensi sen

### Muutos B — "Kertaa nyt — 20 korttia" -bannerin aluerivi
- Nykyisen bannerin alla rivi: `20 ODOTTAA · ~5 MIN`
- Tarkista vihreän + dark-bannerin **kontrasti axe-corella**. Jos < 4.5:1, vaihda `var(--accent)` → `var(--accent-bright)` tai vastaava lighter token. Älä lisää uutta tokenia jos olemassa oleva riittää.

### Muutos C — viewport-leveyden testi
Käyttäjän screenshot näyttää että dashboardin oikea reuna on hieman katkaistu (Aktiivisuus + Kehitys-grafiikat). Tarkista `#screen-dashboard` `max-width` + sivun overflow-x-handlaus. Älä lisää horizontal scrollia missään tapauksessa.

### Skillit
- `puheo-finnish-voice` empty-state-copyyn
- `education/cognitive-load-analyser` — varmista että uusi 8-sana copy ei jätä mitään olennaista pois (käyttäjän pitää silti ymmärtää mitä pitää tehdä)

### Verifiointi
- axe-core sweep #screen-dashboard @ 1440 + 375 → 0 violations
- Lighthouse mobile-score-katto

---

## UPDATE 6 — Oppimispolku-näkymän pikku fixit

### Tavoite
Käyttäjän screenshot ruuduista 7–8 paljasti kaksi pientä asiaa.

### Muutos A — "Opetussivu"-nappi piiloon Oppimispolku-näkymällä
Nykyinen: oikealla yläkulmassa nappi `Opetussivu` näkyy myös Oppimispolku-näkymällä, vaikka se on relevantti vain lesson-näkymällä (jossa on opetussivu).

Lisää `js/screens/curriculum.js`:n `loadCurriculum()`-funktioon:
```js
const opetussivuBtn = document.querySelector('[data-action="open-teaching-page"]');
if (opetussivuBtn) opetussivuBtn.style.display = 'none';
```

Ja `js/screens/lesson.js`:n init-koodiin (tai missä se nyt asetetaankaan):
```js
if (opetussivuBtn) opetussivuBtn.style.display = '';
```

Tarkista oikea selektori grep:llä — `Opetussivu` -nappi on todennäköisesti `app.html`:ssä.

### Muutos B — Lukittujen kurssikorttien kontrasti
Lukittujen `Kurssi 2…8` -korttien teksti on tällä hetkellä `opacity: 0.45` (per L-PLAN-2). Vaikka aria-disabled on oikein, AA-kontrasti voi olla rajalla.

1. Aja axe-core lukittujen korttien teksteille
2. Jos kontrasti < 4.5:1, säädä `opacity` → 0.55 TAI vaihda `--text-muted` → uusi token `--text-locked` joka on AA-yhteensopiva omalla värillään
3. Älä riko lukitun visual-affordancen — sen pitää näyttää lukitulta, mutta luettavalta

### Muutos C — Lukittujen korttien hover-tooltip
Tällä hetkellä klikatessa lukittua korttia ei tapahdu mitään (`cursor: not-allowed`). Lisää tooltip joka kertoo *miksi* se on lukittu:

> "Suorita ensin Kurssi N (kertaustestissä ≥ 80 %)."

(Numero N riippuu siitä mikä kurssi blokkaa.)

**21st.dev:** sourcaa `tooltip` / `popover` viite samasta `references/app/landing-polish-l8/21stdev/tooltip/`-kansiosta kuin UPDATE 4 (kierrätys). Käytä samaa komponenttia → design-system konsistenssi.

### Skillit
- `puheo-finnish-voice` tooltip-tekstiin
- `design:design-system` — uusi `--text-locked` token jos lisäät, dokumentoi
- `design:accessibility-review` UPDATE 6:n jälkeen

### Verifiointi
- axe-core Oppimispolku-näkymä @ 1440 + 375 → 0 violations
- Manuaali: avaa Oppimispolku → "Opetussivu"-nappi piilossa, klikkaa lukittu kortti → tooltip aukeaa, näppäimistöllä Tab → tooltip aukeaa focus:lla

---

## UPDATE 7 — Hero positiointi-kysymys (KÄYTTÄJÄN PÄÄTETTÄVÄ)

### Tavoite
Tämä on **päätös, ei toteutus**. Kysy käyttäjältä yhdellä viestillä ennen kuin koodaat — älä päätä itse.

### Kysy käyttäjältä:
> Hero-H1 nyt: **"Pärjää espanjan YO-kokeessa. Ilman kalliita kursseja."**
> Vaihtoehto: **"Pärjää espanjan YO-kokeessa. 10 minuuttia päivässä."**
>
> Ensimmäinen kilpailee identiteetillä "halpa vaihtoehto kursseille" → kategoria, jossa kilpailijat ovat muut halvat tuotteet.
> Toinen kilpailee identiteetillä "tehokas / aikatehokas" → kategoria jossa kilpailija on opiskelijan oma kalenteri. Yleensä myyvempi tuotekategoria.
>
> Pidetäänkö nykyinen, vaihdetaanko, vai testataanko A/B?

Jos käyttäjä vastaa "vaihda" → toteuta yhdellä rivillä. Jos käyttäjä vastaa "A/B" → kirjoita ACTION REQUIRED IMPROVEMENTS.md:hen GrowthBook/PostHog-flagien lisäämiseksi (ei toteuteta tässä loopissa, koska A/B vaatii analytiikka-pinon valinnan ja käyttäjä-volyymin arvioinnin). Jos käyttäjä vastaa "pidetään" → skip update.

---

## UPDATE 8 — Loppuverifiointi (a11y + critique sweep)

### Tehtävä
1. **axe-core**:
   - Landing (`index.html`) @ 1440 + 375
   - Dashboard (`#screen-dashboard`) @ 1440 + 375
   - Oppimispolku (`#screen-path` / `#screen-curriculum`) @ 1440 + 375
   - Hinnoittelu (#hinnat -anchor osa landingia, mutta tarkista interaktiot tooltipin kanssa)
   → 0 violations kaikilla. Korjaa kaikki ennen sulkua.

2. **`design:design-critique`** Playwright-screenshotit:
   - Landing yläosa (hero + sanasto-rotation kahdessa eri framessa screenshotinpa varten)
   - Landing "Kolme aluetta"
   - Landing "Näin se etenee"
   - Landing kirjoitusarviointi
   - Landing hinnoittelu (hover-tilassa yhden tooltipin auki)
   - Dashboard empty-state
   - Oppimispolku — lukittu kortti tooltipin auki
   → applya feedback ennen sulkua

3. **Lighthouse** (Chrome DevTools tai Playwright):
   - Performance ≥ 90 mobile
   - Accessibility = 100
   - Best Practices ≥ 95
   - SEO ≥ 95
   - CLS ≤ 0.05

4. **Manuaalinen sanity-check**:
   - Reduced-motion-asetus päällä → 0 animaatiota tai siirtymää
   - Tab-navigaatio läpi koko landingin → focus-ringit näkyvät, ei trap, looginen järjestys
   - 320 px viewport → mikään ei mene yli (häntä-mobiili)

### Skillit
`design:accessibility-review` + `design:design-critique` JOKAISEN UPDATEn 1–6 jälkeen ENSIN, ja UPDATE 8 on lopullinen kokonaiskatto.

---

## UPDATE 9 — Dokumentointi

### Tehtävä
1. **IMPROVEMENTS.md** uusi blokki, prefix `[2026-MM-DD L-PLAN-8]`:
   - UPDATE 1: live-elementit, mainitse 21st.dev URL kandidaateista + valitusta
   - UPDATE 2: copy-muutokset, mainitse `puheo-finnish-voice` + `design:ux-copy`
   - UPDATE 3: scroll-reveal-primitiivi, käyttöalue (kirjoitusarviointi-mockup + 3 alueen kortit)
   - UPDATE 4: tooltip-komponentti (uusi design-system primitiivi), 21st.dev URL
   - UPDATE 5: dashboard empty-state lyhennys + bannerin kontrasti-fix
   - UPDATE 6: Oppimispolku pikku-fixit
   - UPDATE 7: hero-positiointipäätös (mitä käyttäjä vastasi)
   - UPDATE 8: a11y + critique tulokset
   - Mainitse education-skillit per UPDATE jossa käytettiin

2. **AGENT_STATE.md**:
   - `Last completed loop:` → `L-PLAN-8 (landing-polish + dashboard empty-state + a11y-katto + live-hero ilman generoituja kuvia)`
   - `Next loop:` → mitä käyttäjä on seuraavaksi sanonut (todennäköisesti L-SECURITY-1 per `project_puheo_security_pass.md`)
   - **What I just did** -lohko: tarkka summary mitä shipattiin
   - **Working context** -lohko: päivitä jos mitään uutta npm-pakettia lisättiin (ei pitäisi olla — kaikki tämän loopin animaatiot ovat puhdas CSS + IntersectionObserver)

3. **SW-bumppi**: jos lisäsit uuden `js/features/scroll-reveal.js` + uusia css-tiedostoja, lisää STATIC_ASSETSiin ja bumppaa SW-versio. Jos kaikki lisättiin olemassa oleviin tiedostoihin, ÄLÄ bumppaa.

4. **References**: säilytä `references/app/landing-polish-l8/21stdev/` -kansiossa kaikki sourcing-screenshotit + LICENSE-merkinnät jokaiselle valitulle komponentille.

---

## Verifiointi (loop ei pääty ennen näitä)

1. **axe-core** kaikilla muutetuilla näkymillä @ 1440 + 375 → 0 violations
2. **Lighthouse** mobile + desktop kuten UPDATE 8:ssa kuvattu
3. **`npm test`** → kaikki vitest-testit edelleen vihreänä
4. **`node --check`** jokainen muutettu .js / .mjs -tiedosto
5. **Playwright e2e**: yksi happy-path joka avaa landingin, klikkaa "Näe esimerkkiarviointi →" anchor → scrollaa → klikkaa Pro-cardin x-rivin tooltipin → näkee CTA:n. Screenshot `scripts/agent-test/lplan8-landing-flow.mjs`.
6. **Reduced-motion test**: aja Playwright `emulateMedia({ reducedMotion: 'reduce' })` → varmista että hero-bokeh, sana-rotaatio ja scroll-reveal kaikki jäävät pois.
7. **Cross-browser**: Chrome + Safari + Firefox (vähintään uusin Chrome + uusin Safari)

---

## Mitä EI saa tehdä tässä loopissa

- ÄLÄ lisää AI-generoituja kuvia minnekään (käyttäjä kysyi nimenomaan tätä — vastaus on EI)
- ÄLÄ koske dashboard-tuoteruutuun heron oikealla puolella — se on jo täydellinen
- ÄLÄ vaihda H1:tä ilman käyttäjän vastausta UPDATE 7:ään
- ÄLÄ lisää uusia featureita — tämä on polish, ei feature-loop
- ÄLÄ poista "kertausjono"-termiä Pro-cardista tai dashboardista — se on opittu termi sisäänkirjautuneelle käyttäjälle, vain landing step 01 -kuvauksessa vaihdetaan "harjoituslistaksi"
- ÄLÄ lisää uusia npm-paketteja — kaikki tehdään puhtaalla CSS + IntersectionObserver + olemassa olevilla primitiiveillä
- ÄLÄ koske `routes/`-kansioon ellei UPDATE 5 / 6 vaadi (todennäköisesti ei)
- ÄLÄ bumppaa SW jos STATIC_ASSETS ei muuttunut
- ÄLÄ generoi tyhjästä mitään 21st.dev-sourcing-pakollista komponenttia (tooltip, scroll-reveal, text-rotate, aurora-glow) — sourcaa screenshot ennen koodausta

---

## Lopputulos käyttäjälle

Loopin lopussa raportoi käyttäjälle yhdellä viestillä:
- Mitä shipattiin per UPDATE
- Lighthouse-pisteet ennen/jälkeen
- 21st.dev-URLit joista komponentit portattiin
- Linkit `references/app/landing-polish-l8/21stdev/`-screenshoteihin
- UPDATE 7:n vastaus (mitä käyttäjä päätti H1:stä)
- Ehdotus seuraavasta loopista (todennäköisesti `AGENT_PROMPT_SECURITY1.md` per käyttäjän aiempi pyyntö)
