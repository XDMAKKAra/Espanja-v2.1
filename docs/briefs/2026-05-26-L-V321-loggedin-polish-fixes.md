# BRIEF: L-V321 — Logged-in polish audit + fix-cycle

**Päivä:** 2026-05-26 ilta
**Edellinen:** L-V320 polish-audit pass 1 (julkiset pinnat) — commit `91130b5` shipped fix-cycle, `69bcda6` re-audit ledger
**Triggeri:** logged-in audit kattaa loput 95 % käyttäjäajasta — appin sisäpinta
**Status:** pohja-audit ajettu (24 scan:ia, 12 sivua × desktop + mobile), kahdesta moodeerate/minor a11y-bugia + ~380 touch-target-rikkomusta. Skripti `scripts/polish-audit-loggedin.mjs` toimii uudelleen-ajettavasti.

---

## Pohja-audit-tulokset

`docs/audits/2026-05-26-polish-audit-loggedin.{json,md}` + `screenshots/polish-audit-loggedin-2026-05-26/`.

**Headlines vs V320 (public):**

| Mittari | V320 public | V321 logged-in |
|---|---|---|
| Critical / serious / moderate / minor | 0 / 0 / 0 / 0 (axe ei latautunut) | 0 / 0 / **8** / **24** |
| Console errors total | 34 | **0** |
| Network errors total | 0 | **0** |
| Touch targets <44 px | 192 (cap 10) | **380** (cap 50) |

**Insight:** logged-in koodi on **dramaattisesti puhtaampi** kuin landingit (0 console-virhettä, 0 network-virhettä) — mutta touch-target-pinta on huonompi koska napit ovat enemmän tiheässä.

---

## Konkreettiset löydökset

### P0 — Axe: aria-allowed-role (24 osumaa)

`#app-sidebar`-elementti on `<aside role="navigation">`. **ARIA-spec rikkomus:** `<aside>`-elementillä on implisit role `complementary`, role-override `navigation` ei ole sallittu siinä. Tämä esiintyy KAIKILLA logged-in sivuilla.

**Fix:** Etsi `app-sidebar`-määrittely (luultavasti `app.html`):
```html
<!-- before -->
<aside class="app-sidebar" id="app-sidebar" role="navigation" aria-label="Päävalikko">

<!-- after -->
<nav class="app-sidebar" id="app-sidebar" aria-label="Päävalikko">
```

`<nav>`-elementti on semanttisesti oikein, ja sen implisiittinen role on `navigation` — explicit `role`-attribuutti ei tarvitse.

Tarkista että `.app-sidebar`-CSS ei rikoudu (CSS-selektori toimii sekä `<aside>`-että `<nav>`-elementissä). Tarkista myös JS-koodi (`document.getElementById("app-sidebar")` toimii joka tapauksessa).

### P0 — Axe: heading-order (8 osumaa)

`<h3 class="op-row__title">` esiintyy ennen `<h2>`:ta opastuspoluilla `l09-l12`. WCAG 2.4.6 vaatii että otsikkohierarkia ei hyppää tasoja.

**Fix:** etsi `.op-row__title` CSS-luokka (luultavasti `js/screens/curriculum.js` tai `js/screens/learningPath.js`), tarkista että edeltävä otsikko on `<h2>`, ei `<h1>`. Vaihtoehto: muuta `<h3>` → `<h2>` jos rakenne sallii, tai lisää välitaso `<h2>`.

### P0 — Touch targets: settings-sivu (32× toistuva ongelma)

`.settings-row-edit` (84×**34** px) — "Muokkaa"-nappi joka esiintyy 8× per settings-sivu × 4 scan:ia = 32 osumaa. Kaikki ≤34 px korkeita.

**Fix:** `.settings-row-edit { min-height: 44px; padding-block: 10px; }` (etsi mikä CSS-tiedosto määrittelee — todennäköisesti `css/components/settings.css` tai `css/components/profile.css`).

### P0 — Touch targets: muut kriittiset

| Selector | Tod. koko | Käyttö |
|---|---|---|
| `#btn-manage-sub` | 108×**13** | Stripe-portaali (Settings → Tilaus). 13 px korkea! |
| `#settings-nickname-save` | 80×**34** | Nimimerkin tallennusnappi |
| `#settings-lang-edit` | 96×**34** | Kielimuutos-nappi |
| `.settings-theme-btn` | 55-70×**32** | Teema-valitsin (light/dark/auto) |
| `#settings-signout` | 107×**34** | Kirjaudu ulos |
| `#profile-menu-btn` | **40×40** | Profile-menun avain (avatar topbar:ssa) |
| `#nav-home`, `#nav-settings`, `#sidebar-logout` | 179×**22** (desktop) / 179×**40** (mobile) | Sidebar-linkit |
| `#sidebar-user` | 179×**22** | Käyttäjäavatar-linkki sidebar:n yläosassa |

**Fix-resepti:**
```css
.settings-row-edit,
#btn-manage-sub,
#settings-nickname-save,
#settings-lang-edit,
#settings-signout {
  min-height: 44px;
  padding-block: 10px;
}

.settings-theme-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 10px 14px;
}

#profile-menu-btn {
  min-width: 44px;
  min-height: 44px; /* nyt 40×40 */
}

.app-sidebar #nav-home,
.app-sidebar #nav-settings,
.app-sidebar #sidebar-logout,
.app-sidebar #sidebar-user {
  min-height: 44px;
  display: flex;
  align-items: center;
}
```

Etsi mikä CSS-tiedosto määrittää nämä (`grep -l "settings-row-edit\|btn-manage-sub\|settings-theme-btn" css/`).

### P1 — Sidebar-logo 219×28 px

`.sidebar-logo` (`<a>`-link) on **28 px korkea**. Brand-link, vähemmän kriittinen mutta WCAG-rikkomus.

**Fix:** `.sidebar-logo { min-height: 44px; display: inline-flex; align-items: center; }` — todennäköisesti `css/app-old-spain.css` riviltä ~723.

### P1 — `#settings-nickname-input` 280×39

Input-kenttä joka on 1 px alle 44 px korkea. Marginaali — Apple HIG sallii 39, mutta WCAG 2.5.5 ehdoton 44.

**Fix:** `min-height: 44px` input:lle.

---

## Mitä writer tekee

### Step 1: Re-pull origin/main

Tämä brief + audit-data ovat valmiina origin/main:issa kun käyttäjä committaa tämän loop:n.

### Step 2: Lue audit-tulokset

```bash
cat docs/audits/2026-05-26-polish-audit-loggedin.md
```

### Step 3: Korjaa axe-rikkomukset (2 sääntöä, 32 osumaa)

1. **`aria-allowed-role`:** muuta `<aside id="app-sidebar">` → `<nav id="app-sidebar">` `app.html`:ssä, poista `role="navigation"`-attribuutti
2. **`heading-order`:** etsi `.op-row__title` CSS-luokka, korjaa h-tasojen hierarkia (h1 → h2 → h3, ei skippejä)

### Step 4: Korjaa P0 touch-targetit

CSS-fix `.settings-row-edit`, `#btn-manage-sub`, `#settings-nickname-save`, `#settings-lang-edit`, `.settings-theme-btn`, `#settings-signout`, `#profile-menu-btn`, `#nav-home`, `#nav-settings`, `#sidebar-logout`, `#sidebar-user` — kaikille `min-height: 44px`.

Tiedostot (grep ensin):
```bash
grep -l "settings-row-edit\|btn-manage-sub\|settings-theme-btn\|profile-menu-btn" css/
```

Todennäköiset tiedostot: `css/components/settings.css`, `css/components/profile-menu.css`, `css/app-old-spain.css`, `css/components/sidebar-shell.css`.

### Step 5: Korjaa P1 sidebar-logo + nickname-input

`.sidebar-logo`, `#settings-nickname-input` → `min-height: 44px`.

### Step 6: Re-run audit

```bash
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit-loggedin.mjs
```

Verifioi:
- Touch-target rikkomukset 380 → tavoite **<80** (sisäpintapuoli on tiheämpi kuin landingit, ei pääse <30 helposti)
- aria-allowed-role 24 → **0**
- heading-order 8 → **0**

### Step 7: Commit + push

```
feat(a11y): L-V321 logged-in polish-audit pass 1

- <aside id="app-sidebar"> → <nav id="app-sidebar"> (aria-allowed-role)
- .op-row__title heading hierarchy fixed (heading-order)
- Settings-row buttons + sidebar links + profile-menu-btn ≥ 44 px
  (WCAG 2.5.5)
- #btn-manage-sub fixed (was 108×13, now ≥44 vertical)

Before: 24 aria-allowed-role + 8 heading-order + 380 touch-targets
After:  [run audit, fill in]
```

### Step 8: Ledger + IMPROVEMENTS

`## L-V321-LOGGEDIN-POLISH-AUDIT-PASS-1` -rivi IMPROVEMENTS.md:hen.

---

## Acceptance criteria

1. Re-run audit ajaa loppuun ilman login-failurea
2. **`aria-allowed-role`-rikkomukset 24 → 0** (kaikki app-sidebar-elementit)
3. **`heading-order`-rikkomukset 8 → 0** (curriculum/learningPath)
4. **Touch-target-rikkomukset 380 → <80** (settings-pinnat dominoivat ennen, ei sen jälkeen)
5. **Console-virheet pysyy 0** (älä rikko mitään uutta)
6. **Network-virheet pysyy 0**
7. **Visual regression ok** — uudet screenshotit eivät paljasta yllättävää layout-rikkoutumista (touch-target-fix voi venyttää settings-row-elementtejä — odotettu)
8. **Bug-scan-spec PASS edelleen** (`npm run test:bug-scan`)
9. **Brand-spec PASS edelleen** (`npx playwright test tests/e2e-brand.spec.js`)

---

## Out-of-scope

- **Lesson-runner-flow audit** — eri brief L-V322 (vaatii lesson-context simuloinnin)
- **Exam-flow audit** — eri brief L-V322
- **Performance audit (Lighthouse)** — eri brief L-V323
- **LCP/CLS-baseline-korjaukset** — vaikka audit kerää numerot, fix on eri loop
- **Lesson-content audit (LLM-pohjainen)** — eri loop L-V324, isoin scope

---

## Skill-stack writerille

TESTING-L (audit re-run + a11y-fix-cycle):
- `webapp-testing`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`
- `superpowers:systematic-debugging`

FRONTEND-M (CSS-fix sekä HTML-semantiikka):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max` (käytä accessibility-rules)

Total stack: 7 skilliä.

---

## Päätös-rekap

L-V320 (julkiset pinnat) + L-V321 (logged-in pinnat) yhdessä antavat ensimmäisen täyden polish-baselinen kattaen kaikki publik:set ja Pro-tilin-logged-in pinnat. L-V322 jatkaa lesson-runner-flowsiin + exam-flowsiin. L-V323 Lighthouse-baseline.
