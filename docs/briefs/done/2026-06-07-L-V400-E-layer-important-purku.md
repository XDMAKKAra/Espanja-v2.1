# L-V400 — E: @layer-sub-layerit + !important-purku (per-flip, EI blanket)

> **Rooli:** WRITER. Tämä on L-V399:n E-vaiheen jatkobrief. Lue ENSIN:
> `scripts/bundle-entry.css` (nykyinen single-`base`-rakenne) + `CONVENTIONS.md` CSS-osio +
> `docs/briefs/L-V399-CLEANUP-MAP.md` §4 (CSS-cascade-riskit). Rauta-säännöt: `CLAUDE.md`.
> **ÄLÄ toista blanket-reorderia — se on jo kokeiltu ja kumottu (todiste alla).**

---

## TL;DR

Tavoite: poistaa CSS-`!important`-sotien hauraus (toistuva bugilähde: L-V388 MC-väribugi,
L-V390 [hidden]-no-op, L-V394 sidebar-!important-sota) antamalla `@layer`-järjestyksen
hoitaa cascade oikein. **Blanket sub-layer-reorder EI toimi** (kokeiltu L-V399:ssä, flippasi
11 pintaa). Oikea tapa = **per-flip**: pura yksi `!important`-rypäs kerrallaan, todista
0-pikselidiffi jokaisen jälkeen 29-pinnan harnessilla, committaa, toista.

---

## TILA (mistä lähdetään)

- **A2 (tehty):** koko legacy-bundle on yhdessä `@layer base`:ssa (`scripts/bundle-entry.css`).
  Yksi layer = sama cascade kuin layeroimaton (specificity + source-order) → behavior-preserving.
  `@layer base, components, utilities;` deklaroitu; `components`/`utilities` varattu uudelle koodille.
- **E blanket-reorder (KOKEILTU + REVERTATTU L-V399:ssä):** jaoin `base`:n ali-layereihin
  `tokens < appbase < components < app < shell` lähde-järjestyksessä → 29-pinnan harness
  paljasti **11 flippiä**. Revertattu, mitään ei shipattu.
- **`!important`-inventaario (grep-luvut, ennen-tila):** `style.css` 21, `app-old-spain.css` 12,
  `landing-editorial.css` 10, `off-canvas-nav.css` 10, `digikirja.css` 9, `landing.css` 5,
  `app-shell.css` 1, `sidebar-shell.css` 2 (kommentteja). Iso osa on `prefers-reduced-motion`-
  lohkoissa = LEGIT, EI pureta.

## MIKSI BLANKET-REORDER EI TOIMI (empiirinen todiste)

Yhdessä layerissa specificity voittaa koko layerin sisällä. Ali-layereissa **layer-järjestys
voittaa ENSIN** (myöhempi ali-layer voittaa aiemman specificityn OHI), sitten specificity layerin
sisällä. Siksi jokainen cross-sub-layer-specificity-inversio (myöhäisempi lähdesääntö, jolla on
matalampi specificity, joka tällä hetkellä HÄVIÄÄ aiemmalle korkeamman specificityn säännölle)
**flippaa** kun se siirretään myöhempään ali-layeriin.

**11 flippaavaa pintaa (L-V399-mittaus, mobile+desktop):**
`oppimispolku` (authed shell), `koti-sidebar`, `kurssidetalji`, `mode-reading`, `koeharjoitus`,
`sidebar-hover` (desktop). **Kaikki samaa cascade-sota-aluetta:** off-canvas-nav.css vs
app-shell.css vs sidebar-shell.css vs app-old-spain.css (= L-V399-kartan dokumentoidut konfliktit
#1 ja #2: `.app-sidebar` display/transform breakpointeilla + `.dk-shell` vs `.app-main`).

→ Työ EI ole "vaihda layerit ja poista !important". Työ on: **tunnista mikä !important on
load-bearing missä cascade-konfliktissa, ja korvaa se joko (a) layer-järjestyksellä TAI
(b) nostetulla specificityllä — yksi konflikti kerrallaan, pikselidiffi gateina.**

---

## TYÖKALUT (valmiina, L-V399:ssä rakennettu + todistettu)

### Pikseli-harness `tests/e2e-visual-layer.spec.js` (lokaali, untracked)
- **29 pintaa** × mobile(390)/desktop(1440): 5 alkuperäistä staattista + 6 stabiilia reittiä
  (kurssidetalji, mode-reading, mode-writing, profiili, asetukset, koeharjoitus) + 4 interaktiotilaa
  (sidebar-hover [desktop], primary-button-focus, settings-modaali-auki, auth-login-virhe).
- `maxDiffPixels: 0`, animaatiot tapettu, consent suppressed (`puheo_analytics_consent_v1="denied"`).
- **Todistettu 0-diff-deterministiseksi** (capture→re-run ilman muutosta = 29 passed).
- Snapshotit gitignoressa (`tests/*-snapshots/`) — koneisaiset, regeneroidaan per loop.

**Workflow (PAKOLLINEN per muutos):**
```bash
# 1. Kaappaa before-baseline NYKYTILASTA (ennen mitään CSS-muutosta):
TEST_PRO_EMAILS=testpro123@gmail.com TEST_PRO_PASSWORD=Testpro123 \
  npx playwright test e2e-visual-layer --update-snapshots
# 2. Tee YKSI !important-purku (yksi konflikti).
npm run build
# 3. Verifioi 0-diff:
TEST_PRO_EMAILS=testpro123@gmail.com TEST_PRO_PASSWORD=Testpro123 \
  npx playwright test e2e-visual-layer
#    → 0 diff = turvallinen, committaa. Diff = analysoi/revert se yksi muutos.
```
- Serveri portissa 3000 pitää olla pystyssä (`node server.js`, odota /health). Test-creds .env:ssä.
- **Dynaamiset ruudut (vocab/dashboard/digikirja-lesson) EIVÄT ole harnessissa** (sisältökohina)
  → niille `tests/verify-clickthrough.mjs` (0 JS-erroria, 12 reittiä).

---

## STRATEGIA — kaksi vaihtoehtoa (writer valitsee, suositus alla)

### Vaihtoehto A (SUOSITUS): per-konflikti, EI globaalia ali-layer-jakoa
Pidä `@layer base` yhtenä. Pura `!important` **konflikti kerrallaan** nostamalla voittavan
säännön specificityä TAI siirtämällä VAIN se yksi komponentti `@layer components`:iin (joka on
jo deklaroitu base:n yläpuolelle). Näin et flippaa mitään muuta — vain kohdesääntö liikkuu.
- Esim. jos `off-canvas-nav.css` käyttää `!important`ia voittaakseen `app-shell.css`:n
  `.app-sidebar`-säännön, siirrä off-canvas-nav `@layer components`:iin (voittaa base:n ilman
  !importantia) JA poista sen !importantit. Aja harness. 0-diff → committaa.
- **Etu:** jokainen muutos on atominen + todistettava. Ei big-bang-flippiä.
- **Riski:** matala (yksi komponentti kerrallaan, harness gate).

### Vaihtoehto B: globaali ali-layer-jako + per-flip-korjaus
Tee L-V399:n kokeilema jako (`tokens<appbase<components<app<shell`), AJA harness, ja korjaa
11 flippiä yksi kerrallaan (lisää specificity flippaavaan voittajaan TAI siirrä layer-rajaa).
- **Etu:** lopputulos on "puhdas" layer-arkkitehtuuri.
- **Riski:** korkea — 11 flippiä pitää korjata ENNEN kuin mikään on committable (iso epästabiili
  välitila). EI suositella ellei A osoittaudu riittämättömäksi.

**Suositus: Vaihtoehto A.** Se saavuttaa saman hyödyn (vähemmän !importantia, ennustettava
cascade) ilman big-bang-riskiä, ja jokainen commit on itsenäisesti todistettu 0-diffiksi.

---

## VAIHEET (Vaihtoehto A, bite-sized — kukin oma commit + 0-diff)

> Aja `TESTING-S/M` skill-stack (`webapp-testing`) + `FRONTEND-M` (`ui-ux-pro-max`,
> `emil-design-eng`, `design-taste-frontend`) ENNEN CSS-muutoksia.

1. **Baseline:** kaappaa harness-baseline nykytilasta (`--update-snapshots`). Varmista 29 passed.
2. **Konflikti 1 — off-canvas-nav vs app-shell/sidebar-shell (`.app-sidebar`):**
   lue kartan §4 konflikti #1; tunnista mitkä off-canvas-nav.css:n 10 !importantista ovat
   load-bearing `.app-sidebar`-display/transform-säännöissä. Siirrä off-canvas-nav `layer(components)`:iin,
   poista ne !importantit. `npm run build` + harness. 0-diff → committaa. Diff → analysoi yksi sääntö
   kerrallaan, älä niputa.
3. **Konflikti 2 — digikirja vs app-shell (`.dk-shell` vs `.app-main`):** kartan konflikti #2
   (digikirja.css:62 selittää). Sama kaava: siirrä digikirja `layer(components)`:iin TAI nosta
   specificity, poista vain ne !importantit jotka taistelivat app-mainia vastaan. Build + harness.
   HUOM: digikirja-lesson-body EI ole harnessissa → lisää clickthrough digikirja-reitille + manuaalinen
   screenshot 1440/390 ennen-jälkeen.
4. **Konflikti 3 — `.brand-wordmark` font/color !important (2 tiedostossa):** Inter vs Mulish-perintö.
   Ratkaise yhdellä voittavalla säännöllä oikeassa layerissa, poista molemmat !importantit. Build + harness.
5. **Konflikti 4 — `[hidden]` no-op (3 tiedostoa lisää `display:none!important` itsenäisesti):**
   lisää app-shelliin yksi globaali `[hidden]{display:none}` oikeaan layeriin (base), poista 3
   hajautettua !important-kopiota. Build + harness + verify-clickthrough (testaa modaali-auki/kiinni).
6. **Loput tapauskohtaiset !importantit** (style.css 21, app-old-spain 12): käy yksitellen,
   jätä `prefers-reduced-motion`-lohkot RAUHAAN (legit). Jokainen poisto = build + harness + commit.
7. **Päivitä CONVENTIONS.md** CSS-osio: dokumentoi lopullinen layer-malli + "!important vain
   reduced-motionissa" -sääntö vahvistettuna.

---

## ACCEPTANCE
- [ ] Harness 29/29 0-diff JOKAISEN commitin jälkeen (ei koskaan flippaavaa välitilaa committiin).
- [ ] verify-clickthrough 12 reittiä 0 JS-erroria + digikirja-lesson manuaalisesti todennettu.
- [ ] `!important`-kokonaismäärä laskenut mitattavasti (grep ennen/jälkeen briefin commitiin),
      `prefers-reduced-motion`-!importantit koskemattomia.
- [ ] 0 käyttäytymis/visuaalimuutosta (pikselidiffi todistaa).
- [ ] `npm run build` + sw `CACHE_VERSION` bump (app.bundle.css muuttuu).
- [ ] CONVENTIONS.md päivitetty + IMPROVEMENTS.md +1 rivi.

## SUDENKUOPAT (opittu L-V399:ssä)
- Sub-layer-järjestys voittaa specificityn OHI → ÄLÄ siirrä komponenttia ylempään layeriin
  tutkimatta voittaako se nyt jotain mitä ennen hävisi. Harness on ainoa totuus.
- `app.bundle.css` muuttuu jokaisesta CSS-muutoksesta → sw CACHE_VERSION bump joka shippaavasta loopista.
- Test-creds inline test-prosessille (dotenv-cli EI asennettu): `TEST_PRO_EMAILS=... TEST_PRO_PASSWORD=...`.
- Harness vaatii consent-suppressionin (consent.js = ainoa layeroimaton runtime-`<style>`).
- Älä committaa harness-snapshotteja (gitignoressa) — kaappaa before-baseline aina paikallisesti.

## Skill-stack
FRONTEND-M (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + TESTING-M (`webapp-testing`).
