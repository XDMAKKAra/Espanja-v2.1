# BRIEF: SidebarShell-restrukturointi v277

**Päivä:** 2026-05-22
**Versio:** v277
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v275 (app shell -kovettaminen), v276 (brand-värin palautus) — molemmat hyvä olla mainissa ennen kuin tämä alkaa, koska SidebarShell käyttää uusia brand-tokeneita
**Lähde:** Marcelin omat raportoinnit (3+ kertaa) + mode-first-hierarkia (memory: `project_mode_first_hierarchy.md`) + Audit Agent B
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + TESTING (webapp-testing, superpowers:verification-before-completion). Kutsu Skill-toolia aidosti.

---

## Three-strikes-syyperuste

Memory `feedback_three_strikes_redesign.md`: sama bugi 3× raportoitu → restrukturoi rakenne, älä band-aid. Sidebar on raportoitu:
1. Tyhjä tila ylhäällä/alhaalla
2. "Vain Aloitus näkyy" (mode-linkit puuttuvat tai pomppivat)
3. Reparent-yritykset Asetukset-modaalille tönäisseet sidebar-layoutia

Memory `project_mode_first_hierarchy.md` (2026-05-19): nav flow on HOME → modes → courses → lessons. Vanha `#screen-path` deprekoitu mutta sidebar yhä elää tämän vanhan hierarkian alla. Pitää konsolidoida.

EI enää CSS-band-aidia. Tehdään yksi komponentti joka tietää tilansa.

---

## Tavoite

Yksi `SidebarShell`-komponentti (data-attribuutein, ei kolmea CSS-tiedostoa). Toimii kolmessa moodissa:
1. **HOME-mode** — käyttäjä on Aloituksessa. Sidebar näyttää: logo, "Aloitus" (aktiivinen), nimi/asetukset alhaalla. Ei mode-linkkejä.
2. **MODE-mode** — käyttäjä on yhdessä modessa (Sanasto/Kielioppi/Lukeminen/Kirjoitus/Koeharjoitus). Sidebar näyttää: logo, paluu-Aloitukseen, MODE-otsikko, mode-spesifit linkit (kurssit/lessonit). Pro-badge ja asetukset alhaalla.
3. **BOOK-mode** — digikirja-näkymä. Sidebar voi piiloutua tai pienentyä (:has-hide pattern joka tällä hetkellä on `digikirja.css`:ssä).

State-vaihto: `data-mode="home" | "mode" | "book"` `.app-sidebar`:lla. CSS reagoi tähän, JS asettaa.

EI näkyviä päällekkäisiä CSS-tiedostoja jotka taistelevat keskenään.

---

## Konteksti & nykyongelmat

Tällä hetkellä sidebarin geometria tulee 3 paikasta:
- `style.css` (base layout, position, padding)
- `off-canvas-nav.css` (mobile slide-in)
- `digikirja.css` (`:has(.book-view) .app-sidebar { ... }` -hide-tricks)

Plus app.html itse renderöi nav-itemit. Mode-linkit poistettiin PR `auto/silence-ci 2026-05-19`-kommentilla, mutta navigateToMode() yhä olemassa → orphaned code-path. Käyttäjä päätyy "vain Aloitus näkyy"-tilaan.

Tämä brief KONSOLIDOI nämä.

---

## Toteutus

### Step 1: SidebarShell HTML-rakenne

**Tiedosto:** `app.html` (etsi `<aside class="app-sidebar">` ja korvaa)

```html
<aside class="app-sidebar" data-mode="home" aria-label="Päänavigaatio">
  <!-- TOP: brand -->
  <div class="sidebar-shell__top">
    <a href="#/" class="sidebar-brand" data-action="go-home">
      <span class="sidebar-brand__mark">Puhe<span class="sidebar-brand__o">o</span></span>
    </a>
  </div>

  <!-- BODY: navigaatio (vaihtuu data-mode-mukaan) -->
  <nav class="sidebar-shell__body" aria-label="Navigaatio">
    <!-- HOME-mode nav -->
    <ul class="sidebar-nav sidebar-nav--home" data-mode-only="home">
      <li><button class="sidebar-item active" data-nav="home">
        <svg class="sidebar-item__icon" aria-hidden="true">...</svg>
        Aloitus
      </button></li>
    </ul>

    <!-- MODE-mode nav (lessonit injektoidaan dynaamisesti) -->
    <ul class="sidebar-nav sidebar-nav--mode" data-mode-only="mode">
      <li><button class="sidebar-item" data-nav="back-home">
        <svg class="sidebar-item__icon" aria-hidden="true">←</svg>
        Aloitus
      </button></li>
      <li class="sidebar-mode-title" id="sidebar-mode-title">Sanasto</li>
      <!-- JS täyttää loput tästä alas — kurssi/lesson-linkit -->
      <li class="sidebar-nav__items" id="sidebar-mode-items"></li>
    </ul>

    <!-- BOOK-mode: sidebar joko piilossa tai kompakti -->
  </nav>

  <!-- BOTTOM: user/settings (aina näkyvissä) -->
  <div class="sidebar-shell__bottom">
    <div class="sidebar-user">
      <button data-action="profile" class="sidebar-user__btn">
        <span class="sidebar-user__name" id="sidebar-user-name">…</span>
        <span class="sidebar-pro-badge" id="sidebar-pro-badge" hidden>PRO</span>
      </button>
    </div>
    <button class="sidebar-item" data-action="settings">
      <svg class="sidebar-item__icon" aria-hidden="true">⚙</svg>
      Asetukset
    </button>
    <button class="sidebar-item" data-action="logout">
      <svg class="sidebar-item__icon" aria-hidden="true">⇥</svg>
      Kirjaudu ulos
    </button>
  </div>
</aside>
```

### Step 2: SidebarShell CSS (konsolidoitu)

**Uusi tiedosto:** `css/sidebar-shell.css`
- Importoi se app.html:n `<head>`:iin oikeassa kohdassa (style.css:n jälkeen)
- Poista vanha sidebarin CSS `style.css`:stä, `off-canvas-nav.css`:stä, `digikirja.css`:stä

```css
/* SidebarShell — single source of truth for sidebar layout.
   Replaces fragmented rules in style.css, off-canvas-nav.css, digikirja.css.
   State is driven by data-mode on the aside itself. */

.app-sidebar {
  position: sticky;
  top: 0;
  left: 0;
  height: 100dvh;
  width: var(--sidebar-w, 240px);
  display: grid;
  grid-template-rows: auto 1fr auto;    /* top / body / bottom */
  gap: 0;
  padding: 24px 16px;
  background: var(--bg-sidebar, #FFFFFF);
  border-right: 1px solid var(--border-soft, #E8E5E0);
  z-index: 10;
}

.sidebar-shell__top { padding-block-end: 24px; }
.sidebar-shell__body { overflow-y: auto; min-height: 0; }
.sidebar-shell__bottom { padding-block-start: 16px; border-top: 1px solid var(--border-soft); }

/* Mode-specific reveal */
[data-mode-only] { display: none; }
.app-sidebar[data-mode="home"] [data-mode-only="home"],
.app-sidebar[data-mode="mode"] [data-mode-only="mode"] { display: block; }

/* BOOK-mode: collapse sidebar to icon-only (or hide on mobile) */
.app-sidebar[data-mode="book"] {
  width: 56px;
  padding: 16px 8px;
}
.app-sidebar[data-mode="book"] .sidebar-item__label,
.app-sidebar[data-mode="book"] .sidebar-brand__mark span:not(.sidebar-brand__o),
.app-sidebar[data-mode="book"] .sidebar-mode-title {
  display: none;
}

/* Items — brick-active state (uses v276 tokens) */
.sidebar-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  min-height: 44px;       /* touch target */
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  border: 0;
}
.sidebar-item:hover { background: var(--brand-brick-soft, oklch(94% 0.04 30)); }
.sidebar-item.active {
  background: var(--brand-brick-soft);
  color: var(--brand-brick);
  font-weight: 500;
}
.sidebar-item:focus-visible {
  outline: 2px solid var(--brand-brick);
  outline-offset: 2px;
}

/* Mobile: off-canvas */
@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 0 0 0 rgba(0,0,0,0);
  }
  .app-sidebar[data-open="true"] {
    transform: translateX(0);
    box-shadow: 0 20px 60px -20px rgba(0,0,0,0.25);
  }
}
```

### Step 3: SidebarShell JS-controller

**Uusi tiedosto:** `js/components/sidebarShell.js`

```js
// SidebarShell — controls data-mode + renders mode-specific nav items.
// Single source of truth: every screen change calls setSidebarMode(mode, ctx).

let currentMode = "home";

export function setSidebarMode(mode, ctx = {}) {
  const sb = document.querySelector(".app-sidebar");
  if (!sb) return;
  sb.dataset.mode = mode;
  currentMode = mode;
  if (mode === "mode") renderModeNav(ctx);
}

function renderModeNav({ modeKey, modeLabel, items = [] }) {
  const titleEl = document.getElementById("sidebar-mode-title");
  const itemsEl = document.getElementById("sidebar-mode-items");
  if (titleEl) titleEl.textContent = modeLabel || "";
  if (!itemsEl) return;
  itemsEl.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "sidebar-item";
    if (item.active) btn.classList.add("active");
    btn.dataset.action = "open-lesson";
    btn.dataset.lessonKey = item.key;
    btn.textContent = item.label;
    li.appendChild(btn);
    itemsEl.appendChild(li);
  }
}

export function getSidebarMode() { return currentMode; }

// Event delegation — single listener handles all sidebar clicks.
document.addEventListener("click", (e) => {
  const sb = e.target.closest(".app-sidebar");
  if (!sb) return;
  const navBtn = e.target.closest("[data-nav]");
  if (navBtn) {
    const nav = navBtn.dataset.nav;
    if (nav === "home" || nav === "back-home") {
      window.location.hash = "#/";
      setSidebarMode("home");
    }
  }
  const actionBtn = e.target.closest("[data-action]");
  if (actionBtn) {
    const action = actionBtn.dataset.action;
    if (action === "go-home") {
      window.location.hash = "#/";
      setSidebarMode("home");
    }
    // settings/logout/profile dispatch handled elsewhere
  }
});
```

### Step 4: Migrointi muista näytöistä

**Etsi koko `js/`:stä** kaikki nykyiset paikat joissa sidebaria muokataan:
- `navigateToMode()` funktion kutsut
- Manuaaliset `document.querySelector(".sidebar-...")` -muokkaukset
- Vanha mode-linkkien render-koodi

Korvaa kaikki näistä `setSidebarMode("home" | "mode" | "book", ctx)` -kutsuilla.

Esim. dashboard.js:n lopussa: `setSidebarMode("home")`
Sanasto-mode-näytön openLessonissa: `setSidebarMode("mode", { modeKey: "vocab", modeLabel: "Sanasto", items: lessons })`

### Step 5: Poistot

Kun toiminta on todennettu Playwrightilla:
- Poista vanhat sidebar-CSS-säännöt `style.css`:stä (etsi `.app-sidebar`, `.sidebar-nav`, `.sidebar-item`)
- Poista `off-canvas-nav.css` kokonaan jos kaikki sisältö siirtyi `sidebar-shell.css`:ään
- Poista `digikirja.css`:stä `:has`-sidebar-säännöt (BOOK-mode hoituu `data-mode="book"`:lla)

---

## Verifiointi

1. **Baseline-screenshotit** Playwrightilla ENNEN:
   - HOME-näkymä desktop + mobile (375px)
   - Jokainen MODE (Sanasto/Kielioppi/Lukeminen/Kirjoitus/Koeharjoitus) — sidebar pitäisi näyttää mode-spesifit linkit
   - BOOK-näkymä (digikirja) — sidebar piilossa tai kompakti
   - Asetukset-modaali auki — ei pomppivaa sidebar-layoutia

2. **After-screenshotit** ja vertaa:
   - Sidebar EI saa hypätä leveydessä kun mode vaihtuu
   - Mobile slide-in toimii
   - Logo aina ylhäällä, asetukset aina alhaalla, NAV välissä
   - Ei tyhjää tilaa ylhäällä eikä alhaalla

3. **Playwright regression-spec** `tests/e2e/sidebar-shell.spec.js`:
   - Kirjaudu testpro123
   - Avaa Aloitus → `data-mode === "home"`
   - Avaa Sanasto → `data-mode === "mode"` ja mode-otsikko on "Sanasto"
   - Klikkaa "Aloitus"-paluu-linkki → `data-mode === "home"`
   - Mobile (375px): klikkaa hampurilainen → sidebar liukuu auki

4. **Tab-test** keyboardilla: focus näkyy jokaisessa sidebar-itemissä, ei katkea väärään paikkaan

5. **`node --check`** ja **`npm run build`** ja **`npm test`** PASS

6. **Bumppaa `sw.js` CACHE_VERSION** (sidebar-shell.css on uusi STATIC_ASSET)

---

## Commit + PR

- **2-3 commitia, 1 PR:**
  - `feat(sidebar): SidebarShell component with data-mode states (v277)` — kaikki uudet tiedostot + HTML
  - `refactor(sidebar): migrate screens to setSidebarMode()` — call-site päivitykset
  - `chore(sidebar): remove fragmented CSS (style.css/off-canvas-nav.css/digikirja.css)` — siivous
- IMPROVEMENTS.md-rivi: `v277 — feat: SidebarShell-komponentti, konsolidoi 3 CSS-tiedoston geometria + mode-first-hierarkia data-attribuutein`

**Ei pushia ilman Marcelin lupaa** — tämä on iso refactor joka pitää tarkistaa visuaalisesti.

---

## Don't

- ÄLÄ pidä vanhoja sidebar-CSS-sääntöjä rinnakkain — jos säilytät ne, restrukturointi ei ratkaise three-strikes-ongelmaa
- ÄLÄ käytä side-stripe-borderia active-tilaan — käytä taustaa + tekstinväriä (kuten v276:ssa)
- ÄLÄ rikota mobile-off-canvasia — sen pitää toimia samalla tavalla kuin ennen
- ÄLÄ unohda Pro-badgea — se renderöi `#sidebar-pro-badge`:iin, `hidden`-attribuutilla kun käyttäjä on Free
- ÄLÄ tee Vercel-promotea ennen Marcelin OK:tä — iso visuaalinen refactor
- ÄLÄ riko BOOK-modea — digikirja-näkymä pitää edelleen toimia, kompaktimpana mutta toimivana
- ÄLÄ syytä cachea jos jokin näyttää väärältä — testaa incognitossa, bumppaa CACHE_VERSION

## Onnistuminen

- [ ] `sidebar-shell.css` luotu, importoitu app.html:ään
- [ ] `js/components/sidebarShell.js` luotu, eksportit toimii
- [ ] Vanhat sidebar-säännöt poistettu style/off-canvas/digikirja-CSS:istä
- [ ] HOME / MODE / BOOK -tilat toimii data-attribuutilla
- [ ] Mode-linkit näkyvät kun käyttäjä avaa moden
- [ ] Mobile slide-in toimii
- [ ] Asetukset-modaalin avaaminen EI siirrä sidebar-rakennetta
- [ ] Playwright regression-spec PASS
- [ ] Baseline vs after -vertailu OK
- [ ] Tab-test PASS
- [ ] `npm run build` + `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu
- [ ] PR avattu, EI mergattu
