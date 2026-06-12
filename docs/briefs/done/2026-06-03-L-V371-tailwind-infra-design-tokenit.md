# L-V371 — Tailwind-infra + Puheo design-tokenit (FOUNDATION, 0 visuaalimuutosta)

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — perusta koko visuaali-uudistukselle. Aja ENSIN.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + build → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`. (Ei copy-muutoksia → ei humanizer.)
**Riippuvuus:** ei. Vaihe 1/4 (V371→V374). **V375 app-shell lykätty** (council 2026-06-03: älä koske toimivaan 2300-rivin SPA:han).

> **Council-korjaus 2026-06-03:** framing on **"tokenit + screenshotit"**, EI "migratoi kaikki Tailwindiin". Tailwind koskee VAIN staattisia HTML-sivuja (landing, pricing, privacy, terms, per-kieli). `app.html`-SPA jätetään rauhaan kunnes tulee luonnollinen rewrite-trigger. Tokenit poistavat "halvan"; Tailwind on vain niiden toimitustapa staattisille pinnoille (oikeutus: AI-tuotettu koodi → deterministinen, grep-attava diff).

## Orkestraatio (token-budjetti)
Toimi koordinaattorina, pidä main-loop kevyenä. Delegoi raskas luku/editointi subagenteille jotka palauttavat TIIVIIN tuloksen (ei tiedostodumppeja, ei koko configeja). Älä pidä koko tiedostosisältöjä omassa kontekstissasi.
**Malli per tehtävä:** triviaali mekaaninen (paketin asennus, build-ajo, screenshot, yhden luokan find/replace) → Haiku. Standardi-toteutus → Sonnet. Vaikea/riskialtis/maku-kriittinen → Opus.
**Tämä vaihe:** koordinaattori **Opus** (infra-virheet kaskadoivat koko migraatioon). Paketin asennus + config-skeleton voi olla Sonnet-subagentti, mutta preflight/coexistence- ja content-glob-päätökset Opus.

---

## 🛑 PYHÄ RAJA — älä koske app-puoleen
ÄLÄ muokkaa `app.html`, `app.js`, `js/**`, tai mitään kirjautuneen app-puolen koodia (oppitunnit, tehtävät, oppimispolku app-näkyminä). Ne TOIMIVAT ja näyttävät OK. Jos jokin muutos koskettaisi niitä → STOP ja kysy. Tämä vaihe koskee VAIN staattisia HTML-markkinointi/info-sivuja. Regressio-tarkistus: app.html näyttää identtiseltä ennen/jälkeen.

## Tavoite
Asenna Tailwind ja määritä Puheon brändi-tokenit niin että kaikki STAATTISET HTML-sivut voivat käyttää yhtä johdonmukaista design-systeemiä + valmiita komponentteja. **Tämä vaihe ei muuta yhdenkään sivun ulkonäköä** — se on pelkkä infra. Jos jokin sivu näyttää erilaiselta tämän jälkeen, se on bugi.

## Konteksti / päätös
Marcel: johdonmukainen ilme + valmiit komponentit niin että muutos pätee kaikkialle staattisilla pinnoilla. Stack-päätös: **Tailwind suoraan vanilla-HTML:ään, EI React-rewritea.** Vaiheittain (V371 infra → V372 komponentit → V373 landing → V374 staattiset sivut), ei big-bangina. App-shell (app.html) EI kuulu tähän — lykätty.

## Tehtävät
1. **Asenna Tailwind v3** (vakaa, toimii olemassa olevan PostCSS/build-ketjun kanssa; design-taste-frontend varoittaa v4-config-sudenkuopista — älä käytä v4:ää tässä projektissa ilman erityistä syytä).
2. **`tailwind.config.js` content-globit VAIN staattisiin HTML-sivuihin:** `index.html`, `*.html` (pricing/privacy/terms/refund/404/diagnose), `public/landing/*.html`. **ÄLÄ** sisällytä `app.html`, `app.js` tai `js/**/*.js` — app-SPA ei kuulu tähän (council: lykätty). Varmista että purge/content löytää staattisten sivujen luokat.
3. **Brändi-tokenit `theme.extend`:iin** (lue oikeat hex-arvot `css/tokens.css` + `css/landing-tokens.css`:stä, älä keksi):
   - colors: `cream` (tausta), `brick` (aksentti), `keltainen`/`mustard`, `vihrea`/`green`, `ink` (warm-black). Käytä projektin olemassa olevia arvoja.
   - fontFamily: `display` → Fredoka, `body` → Mulish.
   - borderRadius, boxShadow, spacing-skaala johdonmukaiseksi (tämä on se mikä poistaa "halvan" epäjohdonmukaisuuden).
4. **KRIITTINEN — preflight pois:** `corePlugins: { preflight: false }`. Tailwindin preflight nollaa selaimen oletustyylit ja rikkoisi olemassa olevan landing-CSS:n. Pidä se pois. Perustele kommentilla configissa.
5. **Build-integraatio:** lisää Tailwind-käännös `npm run build`-ketjuun. Output esim. `css/tailwind.css` (käännetty). ÄLÄ vielä linkitä sitä sivuihin laajasti — riittää että build tuottaa sen ja yksi testisivu (tai pelkkä olemassaolo) todistaa että ketju toimii. Seuraavat vaiheet linkittävät sen.
6. **sw.js:** kun lisäät käännetyn tailwind-CSS:n STATIC_ASSETS-listaan (myöhemmissä vaiheissa tai nyt), bump CACHE_VERSION.

## Acceptance
- `npm run build` tuottaa Tailwind-CSS:n ilman virheitä.
- **Kaikki olemassa olevat sivut näyttävät TÄSMÄLLEEN samalta kuin ennen** (preflight pois → ei reset-vuotoa). Verifioi screenshot-vertailulla index.html + app.html + pricing.html ennen/jälkeen.
- Tokenit käytettävissä (esim. `bg-cream`, `text-ink`, `font-display` toimivat testielementissä).
- Ei rikkinäisiä olemassa olevia tyylejä.

## Ulkopuolella
Mikään visuaalinen redesign. Komponentit (V372), landing-screenshotit (V373). Tämä on pelkkä putki + tokenit.
