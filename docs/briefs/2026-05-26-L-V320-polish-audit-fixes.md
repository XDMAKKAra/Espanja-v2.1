# BRIEF: L-V320 — Polish Audit + Fix-loop kick-off

**Päivä:** 2026-05-26 ilta
**Edellinen:** L-V319 prod-audit-rerun PASS (commit `db09426`). Brand-loop suljettu (L-V317 → L-V319).
**Triggeri:** Marcel pyysi seuraavaksi: hiota frontend, etsi kaikki bugit, tarkista tehtävät, tee niistä parhaita. Tämä on **acquisition-fokuksen sijaan polish-fokus** 30-60 päivän tavoitteena.
**Status:** pohja-audit ajettu, datat lokitettu, top-prioriteetit listattu alla.

---

## Mitä prompter ajoi

`scripts/polish-audit.mjs` ajoi 22 scan:ia (11 julkista pintaa × desktop + mobile) prod-Vercelia vasten. Output:

- **`docs/audits/2026-05-26-polish-audit.json`** — täysi raakadata (axe-violationsit, console-virheet, network-virheet, touch-targetit, LCP/CLS)
- **`docs/audits/2026-05-26-polish-audit.md`** — luettava tiivistelmä
- **`screenshots/polish-audit-2026-05-26/`** — 22 PNG-screenshotia desktop + mobile per sivu

**Ensimmäisen ajon paljastettu bugi audit-skriptissä:**

1. `axe-core` ladattiin unpkg.com:sta, mutta sivun **CSP** sallii vain `cdn.jsdelivr.net` ja `browser.sentry-cdn.com` — axe ei latautunut → 0 axe-violationia raportoitu (false negative). **Korjattu samassa committissa** (`unpkg → jsdelivr`).
2. Touch target -cap 10/page liian alhainen → todellinen luku 500+, näytti 192. **Korjattu** (cap 50).
3. LCP/CLS Promise-timeout 800ms → mittarit eivät ehtineet kertyä. **Korjattu** (3000ms).
4. Gate-bypass vain `app.html`:lle → landingissa mobiilissa heittää "UNCAUGHT: gate". **Korjattu** (kaikilla sivuilla addInitScript).

Skripti on nyt valmis re-runiin. Writer ajaa sen ensimmäisenä step:nä.

---

## Top findings (ensimmäisen ajon manuaalisesta analyysistä)

Vaikka axe ei latautunut, audit löysi konkreettisia P0-bugeja muista mittareista.

### P0 — Touch-target a11y-rikkomukset (WCAG 2.5.5)

Jokainen julkinen sivu rikkoo touch-target-säännön. Mobiili 44×44 px minimi:

| Selector | Tod. koko | Sivut | Käyttö |
|---|---|---|---|
| `.nav__link` desktop | 49×24 px | kaikki | Top-nav linkit |
| `.nav__link` mobile | 38-46×17 px | kaikki | Top-nav linkit (off-canvas) |
| `.catalog__lang-btn` | 90×**39** px | landingit | "Español/Français/Deutsch"-language-toggle |
| `#proof-tab-es/de/fr` | 90×**35** px | landingit | "Proof"-sektiossa kielikohtaiset tabbit |
| `.nav__brand` | 40×17 px | kaikki | Logo-linkki (jo dokumentoitu V300:ssa, vahvista korjaus pitää) |
| `.skip-link` | 97×17 px | kaikki | Skip-to-content (accessibility-only, voidaan jättää kapeammaksi) |

**Fix-suositus:** lisää `min-height: 44px` ja vertical padding `.nav__link`, `.catalog__lang-btn`, `#proof-tab-*`-selektoreille. Tiedostot (löytyvät grep:llä `nav__link|catalog__lang-btn|proof-tab-`):
- `css/landing-editorial.css`
- `css/landing.css`
- `css/components/top-nav.css`

`.skip-link` voi jäädä — se on sr-only-visible-on-focus, ei tap-target normikäytössä.

### P0 — CSP-rikkomus joillakin sivuilla

Audit löysi: `"Executing inline script violates the following Content Security Policy directive"` saksa- ja ranska-landingissa (8 osumaa). Eli `public/landing/saksa.html` ja `ranska.html` sisältävät `<script>...</script>` inline-koodia joka rikkoo CSP:n.

**Fix-suositus:** etsi inline-skriptit (`grep -n "<script>" public/landing/saksa.html ranska.html`) ja siirrä external-tiedostoon TAI lisää `nonce`-attribuutti + matching CSP-header. Tämä on jo aiemmin esiintynyt landing-countdown.js:n yhteydessä — todennäköisesti siellä on residual inline-laskuri.

### P0 — Gate-prompt heittää exception landingilla

`"UNCAUGHT: gate"` näkyy `p01-index-hub mobile`, `p02-landing-es mobile`, `p03-landing-de mobile`, `p04-landing-fr mobile`. Tämä on memory `feedback_playwright_gate.md`-ongelman tuotanto-version. Pre-launch-gate-prompt heittää virheen ennen kuin se ehtii tarkistaa localStoragesta `puheo_gate_ok_v1=1`.

**Fix-suositus:** etsi gate-prompt-koodi (todennäköisesti `js/main.js` tai `js/screens/landing.js` tai vastaava), tarkista että localStorage-check tapahtuu **ennen** prompt():ia, ja että prompt() ei heitä jos käyttäjä on jo läpäissyt gateä.

### P1 — LCP/CLS-baseline puuttuu

Ensimmäinen audit-ajo ei kerännyt LCP/CLS (Promise timeout). Korjattu. Re-runin jälkeen pitää saada baseline-luvut per sivu.

Tavoitearvot:
- LCP <2.5s (hyvä), <4.0s (parannusvaraa), >4s (huono)
- CLS <0.1 (hyvä), <0.25 (parannus), >0.25 (huono)

Jos joku sivu rikkoo nämä, brief writerille jatkokorjauksiin.

### P2 — Touch-target audit lisätyö

Cap 50 voi yhä jäädä alle todellisesta lukumäärästä joillakin sivuilla. Re-runin jälkeen tarkista per-sivu-luvut. Jos joku sivu näyttää 50/50, todellinen luku voi olla 80+.

---

## Mitä writer tekee

### Step 1: Re-run audit korjatulla skriptillä

```bash
cd "/c/Users/marce/OneDrive/Documents/espanja paska"
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit.mjs
```

Kesto ~5-7 min. Output:
- Re-write `docs/audits/2026-05-26-polish-audit.{json,md}` (overwrite)
- Re-screenshot `screenshots/polish-audit-2026-05-26/` (overwrite)

**Verify:** Headline-luvut nyt sisältävät axe-violationsia. Jos edelleen 0 axe-violations, debug erikseen — joko axe-CDN ei latautunut tai sivut ovat oikeasti puhtaita.

### Step 2: Korjaa P0-listan touch-target-rikkomukset

CSS-fix `.nav__link`, `.catalog__lang-btn`, `#proof-tab-es/de/fr` -selektoreille:

```css
.nav__link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  /* säilytä olemassa-oleva styling */
}

.catalog__lang-btn,
[id^="proof-tab-"] {
  min-height: 44px;
  padding-block: 10px; /* säädä niin että teksti pysyy centered */
}
```

Tarkista `css/landing-editorial.css`, `css/landing.css`, `css/components/top-nav.css` joissa nuo selektorit määritellään. Älä lisää duplikaattia — muokkaa olemassa olevaa rule:a jos sellainen on.

### Step 3: Korjaa inline-script CSP-rikkomus

```bash
grep -n "<script>" public/landing/saksa.html public/landing/ranska.html
```

Jos inline-skripti löytyy, siirrä `public/landing/<lang>-init.js` -tiedostoon ja lataa `<script src=...>`-tagilla.

### Step 4: Korjaa gate-prompt-exception

Etsi gate-prompt-koodi (`grep -rn "puheo_gate_ok_v1" js/`). Varmista että:
1. localStorage-check tapahtuu ennen prompt():ia
2. prompt() ei heitä exception:ia jos käyttäjä jo läpäissyt
3. Mobiilissa myös toimii (joissain mobile-browsereissa prompt() heittää jos kutsuttu page-load-vaiheessa)

### Step 5: Re-run audit verifioidaksesi fix:t

Sama komento kuin Step 1. Vertaa headline-numeroita:
- Touch target -rikkomukset 192 → tavoite <30
- Console-virheet 34 → tavoite <15 (jätä axe-CDN-loggit jos jäljellä, ne ovat hyväksyttäviä)
- Network errors pysyy 0

### Step 6: Commit + push

```
feat(a11y): L-V320 polish-audit pass 1 — touch targets, CSP, gate fix

- .nav__link / .catalog__lang-btn / #proof-tab-* ≥ 44 px (WCAG 2.5.5)
- Landings inline scripts moved to external (CSP compliance)
- Gate prompt exception fixed on landings mobile
- Audit script CSP-safe (jsdelivr instead of unpkg)

Before: 192 touch-target failures, 34 console errors
After:  [run audit, fill in]

SW v311 → v312 if any STATIC_ASSETS changed.
```

### Step 7: Ledger + IMPROVEMENTS

Lisää `## L-V320-POLISH-AUDIT-PASS-1` -rivi IMPROVEMENTS.md:hen tiivistelmällä before/after-luvuista.

---

## Acceptance criteria

1. **Re-run audit ajaa loppuun** ja kirjaa axe-data (>0 violationia tai validi 0-vahvistus että sivut puhtaita)
2. **Touch-target-rikkomukset <30** per audit-run (vs 192 alkuperäisesti)
3. **`"UNCAUGHT: gate"`-virhettä ei näy** missään console-loggi-listalla
4. **CSP inline-script-virhe ei näy** saksa/ranska-landingissa
5. **LCP <2.5s** kaikilla julkisilla sivuilla (jos rikkoo, raportoi mutta älä korjaa tässä loop:issa — eri scope)
6. **CLS <0.1** kaikilla julkisilla sivuilla
7. **Visual regression OK** — vanhat screenshotit `screenshots/polish-audit-2026-05-26/` vs uudet eivät paljasta odottamatonta layout-rikkoutumista (touch-target-fix voi venyttää nav-elementtejä — odotettu)
8. **Brand-spec PASS edelleen** — touch-target-fix ei saa rikkoa olemassa olevia e2e-testejä

---

## Out-of-scope (älä laita tähän looppiin)

- **Logged-in app-screenien audit** — eri brief L-V321 jos halutaan. Vaatii TEST_LOGIN_EMAIL env-conf
- **Lighthouse-pohjainen performance-audit** — pitkä-keston, eri brief L-V322 jos halutaan
- **Lessonien sisältö-audit** (LLM-pohjainen pedagoginen tarkistus) — iso erillinen loop L-V323
- **DE/FR-landing-redesign** — eri päätös, käyttäjä ei vielä päättänyt suuntaa
- **Stripe-aktivointi** — käyttäjä ei pyytänyt

---

## Skill-stack writerille

TESTING-L (audit re-run + a11y-fix-cycle):
- `webapp-testing`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`
- `superpowers:systematic-debugging`

FRONTEND-S/M (CSS-fix touch-targeteille, ei uusi komponentti):
- `frontend-design`
- `ui-ux-pro-max` (käytä accessibility-rules-osiota)

Total stack: 6 skilliä.

---

## Päätös-rekap

Polish-audit:n pohjalta tämän iltapäivän työ:
- Pohja-audit ajettu, korjattu, valmis re-runiin
- 3 P0-categoria tunnistettu (touch-target, CSP-inline, gate-exception)
- Brief writerille — ajaa fix-cycle:n ~4-6 tunnissa
- Re-audit verifioi fix:n + tuottaa baseline-numerot seuraavaan iteraatioon

L-V320 on **ensimmäinen pass** polish-loop:issa. L-V321/V322/V323 jatkavat samaa fokuusta eri kategorioissa.
