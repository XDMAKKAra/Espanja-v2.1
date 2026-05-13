# 13 — L-HERO-COUNTDOWN-AND-OFFCANVAS-1 — YO-countdown landing-heroon + slide-in off-canvas -valikko app-shelliin

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Ei edellytä muita queue-itemejä — voi ajaa milloin tahansa.
>
> **Strategia:** Tämä loop tuo *aitoa* urgenssia landing-sivuille (YO-koe on kiinteä päivämäärä, ei keinotekoinen launch) ja modernisoi app-shellin navigaation mobile-first off-canvas -valikoksi joka skaalautuu desktopiin. Brand-promise "Tämä YO-kokeessa" saa visuaalisen kotinsa heron yläpuolella.

---

## 1. Lähtötilanne

**Landing-hero nyt** (`public/landing/{espanja,saksa,ranska}.html`):
- `.hero` → `.hero__inner` → `.hero__copy` (eyebrow + h1 + sub + CTAs + trust) + `.hero__visual`
- Ei countdown-elementtiä, ei aikaperusteista urgenssia
- Käyttäjä lähetti referenssikuvan dark-card-countdownista (badge-pill + iso H2 + 4 numeronippua kaksoispisteillä eroteltuna + CTA-rivi) — visuaalinen tyyli kopioidaan, **sisältö korvataan kokonaan Puheon copyllä, ei "Launching Soon" / "Notify Me" -tekstejä**

**App-shell nyt** (`app.html`):
- `aside.app-sidebar#app-sidebar` (rivit ~91–128) on aina näkyvä vasen sidebar
- Sisältää: logo, 7 nav-itemiä (Oppimispolku, Sanasto, Puheoppi, Verbisprintti, Luetun ymmärt., Kirjoittaminen, Koeharjoitus), divider, user-painike, pro-slot, asetukset, logout
- **Ongelma:** mobiilissa sidebar on joko aina päällä tai vaatii erillisen mobile-toggle-logiikan. Käyttäjän pyyntö: muunna slide-in off-canvas -paneeliksi (backdrop blur, click-outside-close, staggered animaatio, chevron hoverissa, sign-out fixed-bottom)

---

## 2. Scope

### Worker A — Hero-countdown landing-sivuille (Sonnet, kaikki 3 landingia)

**Tiedostot:** `public/landing/espanja.html`, `public/landing/saksa.html`, `public/landing/ranska.html` + niiden inline-CSS (tai erillinen `public/landing/landing.css` jos käytössä) + uusi `public/landing/countdown.js`.

**Auto-detect-logiikka** (`countdown.js`):
- YTL:n YO-koe-päivämäärät hard-coded objektina (lyhyt kieli — espanja/saksa/ranska kaikki samana päivänä YTL-aikataulussa):
  ```js
  const YO_DATES = [
    { season: 'kevät 2027', date: '2027-03-15T09:00:00+02:00' },
    { season: 'syksy 2027', date: '2027-09-14T09:00:00+03:00' },
    // jne. – lisää 3 kpl eteenpäin
  ];
  ```
  **Lähde:** YTL:n virallinen aikataulu (https://www.ylioppilastutkinto.fi/) — käytä todellisia päivämääriä, älä keksi. Jos epävarma, jätä TODO-kommentti riville ja käytä lähintä järkevää arviota.
- Funktio `getNearestYoDate()` palauttaa lähimmän tulevan päivämäärän nykyhetkestä.
- `setInterval(1000)` päivittää 4 numeronippua: `Päivää | Tunteja | Minuutteja | Sekuntteja`.
- Kun countdown menee alle 0 → näytä "YO-koe on käynnissä – tsemppiä!" ja piilota numerot.

**HTML-rakenne** (lisätään hero-sectionin **yläpuolelle**, ennen `<section class="hero">` mutta saman `<main>`-sisällön sisällä — yläpuolelle eikä hero-blokin sisään koska user pyysi referenssin mukaisen erillisen "card"-näköisen alueen):

```html
<section class="yo-countdown" aria-labelledby="yo-countdown-title">
  <div class="yo-countdown__card">
    <span class="yo-countdown__badge">
      <svg aria-hidden="true">...kalenteri-ikoni...</svg>
      Seuraava YO-koe
    </span>
    <h2 id="yo-countdown-title" class="yo-countdown__title">Espanjan YO-koe alkaa pian</h2>
    <p class="yo-countdown__sub">Aloita valmistautuminen nyt — jokainen päivä lasketaan.</p>
    <ol class="yo-countdown__grid" role="list" aria-live="polite">
      <li><span class="yo-countdown__num" data-unit="days">--</span><span class="yo-countdown__label">Päivää</span></li>
      <li class="yo-countdown__sep" aria-hidden="true">:</li>
      <li><span class="yo-countdown__num" data-unit="hours">--</span><span class="yo-countdown__label">Tuntia</span></li>
      <li class="yo-countdown__sep" aria-hidden="true">:</li>
      <li><span class="yo-countdown__num" data-unit="minutes">--</span><span class="yo-countdown__label">Minuuttia</span></li>
      <li class="yo-countdown__sep" aria-hidden="true">:</li>
      <li><span class="yo-countdown__num" data-unit="seconds">--</span><span class="yo-countdown__label">Sekuntia</span></li>
    </ol>
    <div class="yo-countdown__ctas">
      <a href="/app" class="btn btn--primary">Aloita ilmaiseksi</a>
      <a href="#how-it-works" class="btn btn--ghost">Katso miten Puheo toimii</a>
    </div>
    <p class="yo-countdown__trust">Liity 500+ abiin, jotka treenaavat Puheolla</p>
  </div>
</section>
```

**Copy per kieli** (huom: `puheo-finnish-voice` skill — encouraging, ei ahdistava):
- **Espanja:** title "Espanjan YO-koe alkaa pian" / sub "Aloita valmistautuminen nyt — jokainen päivä lasketaan."
- **Saksa:** title "Saksan YO-koe alkaa pian" / sub sama
- **Ranska:** title "Ranskan YO-koe alkaa pian" / sub sama
- **CTA-tekstit:** "Aloita ilmaiseksi" (saksa/ranska → "Liity jonoon" jos `AI_LANGUAGES_ENABLED`-gate ei sisällä kieltä — ks. `lib/openai.js`-vakio)

**Visuaalinen tyyli** (kopioi referenssin rakenne, mutta Puheon palettiin):
- Tumma card, `border-radius: 24px`, `padding: 48px`, `max-width: 720px`, sentteröity
- Badge-pill ylhäällä Puheon brand-violetilla (älä copioi referenssin tarkkaa violettia — käytä nykyistä CSS-custom-propertyä `--brand-primary` tms. mitä landing-CSS:ssä on)
- Numerot: **iso, bold, tabular-nums** (`font-variant-numeric: tabular-nums` jotta leveys ei hypi), kaksoispisteet erillisinä `<li>`-elementteinä jotta gridissä on sama välistys joka kohdassa
- Reduced motion: jos `prefers-reduced-motion: reduce` → ei flip-animaatiota numeroiden vaihtuessa, vain tekstinvaihto
- Mobile: numeronippu wrappaa 2×2-gridiin alle 480px leveydellä

**Sijainti:** ENNEN `.hero`-sectionia, tai vaihtoehtoisesti hero-sectionin **sisällä** mutta `.hero__copy`:n yläpuolella. Käyttäjän kuvasta päätellen erillinen card on selvempi → mene erillisellä `<section>`-elementillä ennen heroa.

---

### Worker B — Off-canvas slide-in -valikko app-shelliin (Sonnet)

**Tiedostot:** `app.html` (sidebar-aside ~91–128), `css/app-shell.css` (tai missä `.app-sidebar`-säännöt ovat — etsi grep:llä), `js/screens/` tai `app.js` (etsi missä sidebar-event-handlerit ovat).

**Spec** (käyttäjän pyyntö 1:1):
1. **Full-height paneeli vasemmalta sliding-in** — `transform: translateX(-100%)` → `translateX(0)`, `transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1)`
2. **Semi-transparent backdrop + blur** — `position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px)`, fade-in 200ms
3. **Click outside → close** — backdrop click sulkee paneelin; ESC-näppäin sulkee; focus-trap paneelin sisällä auki ollessa
4. **User profile section ylhäällä** — nykyinen `.sidebar-user` siirretään ylös (logon alle), näyttää avatar + nimi + tier-chip (Free/Treeni/Mestari)
5. **Menu items ikoneilla + valinnaiset badge-merkit** — käytä nykyisiä SVG-ikoneita; lisää badge-tuki (`<span class="nav-item__badge">3</span>`) — aluksi badget piilotetaan kunnes backend tarjoaa (esim. "uusi" kurssi tai "ei luettu"-laskuri). Älä keksi badge-dataa, jätä DOM-paikka ja `hidden`-attribuutti.
6. **Staggered animation** — auki avautuessa nav-itemit fade-in + slide-up `transform: translateY(8px) → 0`, `transition-delay: calc(var(--i) * 35ms)`, eli HTML:ssä `style="--i:0"`, `--i:1` jne. tai JS asettaa indexin
7. **Sign-out fixed at bottom** — nykyinen `#sidebar-logout` jää alas, `position: sticky; bottom: 0` paneelin sisällä tai erillinen footer-flex-osa
8. **Chevron indicators on hover** — jokaiseen nav-itemiin `<svg class="nav-item__chevron">` joka näkyy hoverissa (`opacity: 0 → 1`, `translateX(-4px) → 0`)

**Hamburger-trigger:**
- Lisää `<button id="menu-toggle" aria-label="Avaa valikko" aria-controls="app-sidebar" aria-expanded="false">` app-headerin vasempaan reunaan (jos headeria ei ole, luo minimal sticky top bar joka näkyy vain `<=900px` leveydellä)
- Aukeaa: `aria-expanded="true"`, body `overflow: hidden`, focus paneelin ensimmäiseen interaktiiviseen elementtiin
- Sulkeutuu: trigger-klikki / backdrop-klikki / ESC / sign-out-klikki / nav-item-klikki (route-vaihto)

**Responsive-strategia:**
- **≥1024px:** sidebar pysyy nykyisenä, aina näkyvänä (älä riko desktop-kokemusta!) — off-canvas ei aktivoidu, hamburger piilotettu
- **<1024px:** sidebar oletuksena piilotettu (`transform: translateX(-100%)`), aukeaa off-canvas-paneelina
- Käytä **yhtä DOM-puuta** — sama `aside.app-sidebar` toimii molemmissa moodeissa, vain CSS-media-query muuttaa käyttäytymisen. ÄLÄ luo duplikaatti-DOM:ia.

**A11y:**
- `role="dialog"` + `aria-modal="true"` kun off-canvas auki mobiilissa (desktop-tilassa `role` ja `aria-modal` pois)
- Focus-trap: `Tab` / `Shift+Tab` kiertää vain paneelin sisällä
- Esc sulkee + palauttaa focuksen hamburgeriin
- `prefers-reduced-motion: reduce` → ei slide-animaatiota, vain `display: none` ↔ `display: flex`

**Mitä EI riko:**
- Nykyiset `data-nav`-attribuutit + screen-switching-logiikka (`js/screens/*.js`) — älä koske click-handlereihin, vain layout/animaatio
- `nav-path`, `nav-vocab` jne. id:t säilyvät — muut tiedostot saattavat referoida niitä

---

### Worker C — Brand-review + a11y-tarkistus (Sonnet, lyhyt)

1. **Brand-review:** countdown-copy vastaa `puheo-finnish-voice`:a — encouraging, ei panic-fueled ("Aika loppuu pian!" → EI; "Jokainen päivä lasketaan" → OK)
2. **Aksessoituvuus:**
   - Countdown `aria-live="polite"` (älä `assertive` — käyttäjä häiriintyy joka sekunti)
   - Off-canvas focus-trap toimii
   - axe-core 0 critical, 0 serious uusilla elementeillä
3. **Visuaalinen QA:** screenshot espanja/saksa/ranska-landing heroista + app-shell mobile-koossa (≤375px) ja desktop-koossa (≥1280px)

---

## 3. Acceptance criteria

- [ ] Countdown näkyy kaikilla 3 landingilla (es/fr/de), näyttää lähimmän tulevan YO-koe-päivän
- [ ] Numerot päivittyvät sekunneittain, ei layout-shiftiä (tabular-nums)
- [ ] Reduced-motion-respektointi countdownissa ja off-canvas-animaatiossa
- [ ] Off-canvas avautuu/sulkeutuu hamburger-klikistä, ESC:stä, backdrop-klikistä
- [ ] Focus-trap toimii off-canvas auki ollessa
- [ ] Desktop (≥1024px) säilyy nykyisellään — sidebar aina näkyvä, ei hamburger
- [ ] Staggered animaatio nav-itemeissä (`--i`-custom-property tai JS)
- [ ] Chevron-indicator näkyy hoverissa nav-itemeissä
- [ ] Sign-out pysyy paneelin pohjassa
- [ ] User profile + tier-chip näkyy paneelin yläosassa
- [ ] `npm run test:bug-scan` PASS — landingit + app
- [ ] axe-core 0 critical/serious uusilla elementeillä
- [ ] SW `CACHE_VERSION` bumpattu (memory: `feedback_sw_cache_bump.md`)
- [ ] `node --check` läpäisee jokaisen muokatun JS-tiedoston (memory: `feedback_node_check_before_commit.md`)

---

## 4. Pois scopesta

- ❌ Backend-muutokset (badge-data API:sta — DOM-paikka vain, ei dataa vielä)
- ❌ Email-capture / waitlist-laajennukset countdownin yhteyteen (CTA menee `/app`-signupiin, ei erilliseen lomakkeeseen)
- ❌ Heron muut osat (eyebrow/h1/sub/visual) — ÄLÄ koske, vain lisää countdown sen yläpuolelle
- ❌ Sidebarin nav-itemien sisällön muutos — vain layout + animaatio + off-canvas-käyttäytyminen
- ❌ Saksa/Ranska AI-feature-gating — `requireSupportedLanguage` pysyy nykyisellään (memory)
- ❌ Vanha sidebar-CSS:n täysrefaktoroitu uusiksi — minimaalinen muutos jotta off-canvas toimii

---

## 5. Skill-set

**Pakolliset (open with Skill-tool):**
- `superpowers:brainstorming` — Worker A:n alku, ennen koodia: scopen vahvistus
- `frontend-design` — countdown card + off-canvas-paneeli
- `design-taste-frontend` — visuaalinen polish, kontrastit, motion-curvet
- `ui-ux-pro-max` — off-canvas-patterni (referenssikoodi + esimerkit)
- `puheo-finnish-voice` — kaikki copy (countdown-otsikko, sub, CTAt)
- `puheo-screen-template` — varmista että landing-hero + app-shell noudattavat Puheon screen-receptiä
- `webapp-testing` — Playwright-validointi
- `superpowers:verification-before-completion` — close-out tarkistuslista

**Valinnaiset (ota käyttöön jos tarvitset):**
- `21st_magic_component_inspiration` — off-canvas-patterni-haku jos epävarmuus toteutuksesta
- `superpowers:systematic-debugging` — jos focus-trap tai animaatio bugaa

---

## 6. Pakollinen lukemistus ennen koodia (worker)

1. `CLAUDE.md`
2. `AGENT_PROMPT_STANDARDS.md`
3. `BUGS.md` (P0+P1)
4. `graphify-out/GRAPH_REPORT.md` — `app-sidebar`-community + `landing/`-community
5. `public/landing/espanja.html` — hero-rakenne (rivit ~133–175)
6. `app.html` — sidebar-rakenne (rivit ~91–128)
7. Käyttäjän muistiot:
   - `feedback_sw_cache_bump.md`
   - `feedback_node_check_before_commit.md`
   - `feedback_playwright_works_in_harness.md`

---

## 7. Guardrailit

- ÄLÄ committaa Gitiin (käyttäjä tekee sen)
- ÄLÄ deployaa Vercelliin
- ÄLÄ keksi YTL-päivämääriä — käytä oikeita tai jätä TODO
- ÄLÄ riko desktop-sidebar-kokemusta
- ÄLÄ koske screen-switching-handlereihin
- Bump `sw.js` `CACHE_VERSION` jos muutat STATIC_ASSETSiin kuuluvia tiedostoja

---

## Lopuksi
Tämä on **13** jonossa (`agent-prompts/02-queue/13_HERO_COUNTDOWN_AND_OFFCANVAS_MENU.md`).
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssä — älä manuaalisesti poista tätä tiedostoa workerina.
