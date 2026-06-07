# L-V388 — App-designin osittainen kopiointi Claude Design -exportista: sidebar (karsittu navi) + oppimispolku/kurssi + MC-palaute

**Numero:** käytä seuraavaa vapaata L-VXXX jos viety.

**Skill-stack:** FRONTEND-L (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + TESTING-M (`webapp-testing`). COPY (`humanizer`) vain jos uutta suomi-microcopya syntyy (labelit pysyvät pääosin ennallaan).

**Rooli:** writer. App-puoli (kirjautunut). EI koske landingia (= L-V387).

---

## EI OLE: täysreconstruction

**Tämä ei ole koko app-puolen uudelleenrakennus.** Kopioidaan TASAN kolme designia exportista, ei muuta. Marcel oli tästä eksplisiittinen. Älä koske dashboardin sisältöön, arviointimoottoriin, datakerrokseen, reititykseen muuten kuin alla mainitut kolme näkymää vaativat. **Itse oppituntinäkymä (oppitunnin sisältö) pysyy meidän omana — se on tällä hetkellä ok, älä koske siihen.**

## Design-lähde (totuus)

`docs/design-ref/app-export/` (kopioitu Claude Designin exportista, Claude-internal, ei pushata). Avaa `index.html` selaimessa nähdäksesi renderöitynä. Se on React+Babel-rekonstruktio meidän **omilla brändi-tokeneilla** (`colors_and_type.css`: `--bg #FBF7EF`, `--brick #9B2D2A`, `--success #3C7A4E`, `--error #B23B2E`, Fredoka + Mulish). **Älä tuo Babel/CDN-Reactia tuotantoon** — käännä design meidän vanilla-JS-rakenteeseen (`app.html` / `app.js` / `js/**`), kopioi visuaalinen design + luokat + CSS, wiraa olemassa olevaan dataan. Jos meidän token-nimet eroavat exportista, mäppää arvot (ne ovat identtiset brändin kanssa); varmista että `--success` ja `--error` ovat olemassa palautetiloja varten.

Relevantit lähdetiedostot: `Icons.jsx` (Lucide-polut), `Dashboard.jsx` (sisältää `Sidebar`-komponentin), `Oppimispolku.jsx`, `Kurssi.jsx`, `Exercise.jsx`, `kit.css` (komponenttityylit), `colors_and_type.css` (tokenit).

### Kopiointitarkkuus — ÄLÄ KEKSI OMAA

Tämä on **kopiointi, ei uudelleensuunnittelu**. Älä tuota promptiin perustuvaa "omaa tulkintaa" designista — ota se exportin koodista:
- **CSS:** kopioi `kit.css`:n relevantit säännöt **verbatim** (samat arvot: padding, gap, radius, border, värit, transitio-ajat). Älä pyöristä arvoja omiin makuihisi. Jos token-nimi eroaa meidän puolella, vaihda vain nimi, ÄLÄ arvoa.
- **Markup:** toista exportin **DOM-rakenne ja luokkanimet sellaisenaan** (`.lp-row`, `.option`, `.snav`, `data-state="correct"` jne.). Sama elementtihierarkia.
- **Ikonit:** kopioi Lucide-SVG-polut `Icons.jsx`:n `LUCIDE_PATHS`:sta **verbatim** (sama path-data, sama viewBox/stroke).
- **Ainoa sallittu muunnos:** JSX → meidän vanilla-JS-renderöinti (esim. `React.useState`-tila → meidän olemassa oleva tila/handlerit). Visuaalinen lopputulos on pikselilleen exportin näköinen. Jos jokin ei käänny suoraan, kysy / merkitse, älä improvisoi designia.
- **Vertaa lopuksi:** avaa export `index.html` ja meidän näkymä rinnakkain — niiden pitää näyttää samalta. Screenshot-diff todentaa.

---

## KOPIO 1 — Sidebar-design + karsittu navi

Kopioi sidebarin visuaalinen design exportista (`.sidebar`, `.snav`, `.sidebar__brand`, `.sidebar__foot`, `.avatar` kit.css:ssä; markup `Dashboard.jsx`:n `Sidebar`). Käytä **samoja Lucide-ikoneita** kuin export (`Icons.jsx`:n `LUCIDE_PATHS`).

**Navi karsitaan neljään kohtaan** (export listaa 7 — pudota Sanasto, Kielioppi, Lukeminen):
1. **Etusivu** — ikoni `home`
2. **Oppimispolku** — ikoni `route`
3. **Kirjoittaminen** — ikoni `pencil`
4. **Koesimulaatio** — ikoni `clock`

Aktiivinen item: `--brick-soft`-tausta + brick-teksti/ikoni (kuten export `.snav[data-active]`).

**Alaosan käyttäjäblokki:** avatar + nimi. **EI "Mestari"-titteliä** (export-screenshotissa luki "Mona · Mestari · espanja" — `Mestari` on bannattu, `project_product_naming_and_level`). Näytä nimi + kieli, tai taso vasta kun kartoitus + riittävä data sallii (V362-sääntö). Epävarmassa: vain nimi + kieli.

**Säilytä** nykyinen reititys näiden neljän taakse + Profiili-pääsy avatarista (`project_profile_via_avatar`, älä riko `#sidebar-user`/`data-nav="profile"`-koukkua). Sanasto/Kielioppi/Lukeminen-moodit pysyvät saavutettavissa muualta (esim. Etusivun moodikortit) — vain sidebar-navista ne karsitaan.

## KOPIO 2 — Monivalintatehtävän design + oikein/väärin värit & animaatiot

Kopioi MC-harjoituksen design exportista (`Exercise.jsx` + `.drill`, `.option`, `.fb`-luokat kit.css:ssä). Tämä **korjaa nykyisen bugin** jossa oikea vastaus näkyy punaisella laatikolla (näyttää virheeltä). Oikea semantiikka exportista:

```css
.option[data-state="correct"] { border-color: var(--success); background: rgba(60,122,78,0.08); }
.option[data-state="correct"] .option__l { background: var(--success); color: #fff; border-color: var(--success); }
.option[data-state="wrong"]   { border-color: var(--error);   background: rgba(178,59,46,0.07); }
.option[data-state="wrong"] .option__l { background: var(--error); color: #fff; border-color: var(--error); }
.option[data-state="dim"]     { opacity: 0.5; }
.fb__line.ok { color: var(--success); }   /* check-check-ikoni + "Oikein" */
.fb__line.no { color: var(--error); }     /* x-ikoni + "Väärin" */
```

Käytös: vastattaessa **oikea optio aina vihreäksi** (myös kun käyttäjä valitsi väärin → näytetään mikä oli oikein), valittu väärä optio punaiseksi, muut himmeiksi. Palautepalkki: vihreä `check-check` + "Oikein" TAI punainen `x` + "Väärin" + selitys, sitten brick "Seuraava →". **Animaatiot:** export käyttää `--t-fast/--t-mid`-transitioneja (border/background-väri pehmeästi), `prefers-reduced-motion`-turva on tokeneissa — säilytä. Pidä nykyiset oikeat kysymys-/selitystekstit (data tulee meidän puolelta, ei exportin esimerkeistä).

## KOPIO 3 — Oppimispolku + kurssinäkymä (sidebar → polku → kurssi → avaa oppitunti)

Kopioi kaksi näkymää exportista:
- **Oppimispolku** (`Oppimispolku.jsx` + `.lp-head`, `.lp-illu`, `.lp-row`, `.lp-list`): breadcrumb, eyebrow + h1 + alaotsikko, pieni polku-SVG oikealla, 8 kurssiriviä. Aktiivinen kurssi = brick-reunus + tint + pistepilli `N / 10 oppituntia` + chevron; lukitut = katkoviivareunus, himmeä, `lock` + "Avautuu vuorollaan".
- **Kurssinäkymä** (`Kurssi.jsx` + `.cd-head`, `.cd-progress`, `.lesson-row`, `.lesson-list`): breadcrumb, eyebrow + h1 + kuvaus + edistymispalkki, oppituntilista (numero, tyyppi-eyebrow, otsikko, ~aika, `Suoritettu`-vihreä TAI `Aloita →`-nappi; aktiivinen rivi tintattu + brick-reunus).

**Data meidän puolelta:** kurssien/oppituntien otsikot, tyypit, edistyminen ja lukitustila luetaan oikeasta datasta (`data/courses/`, käyttäjän progress) — exportin sisältö on placeholder. Flow: sidebar **Oppimispolku** → rivi avaa kurssin → oppitunnin **Aloita →** käynnistää oppitunnin. **Oppitunnin sisältö = meidän nykyinen, ei muuteta.**

---

## Läpileikkaava periaate: täytä näyttö

Toistuva valitus: meidän app-näkymät eivät täytä näyttöä, sisältö jää kapeaan sarakkeeseen. Export käyttää tilan oikein: `.appmain { padding: 36px 44px; max-width: 1080px; }`, listat (`.lp-list`, `.lesson-list`) vievät koko `appmain`-leveyden, drill keskitetty `max-width: 680px`. **Noudata tätä** — ei kapeaa ~600px-saraketta keskellä tyhjää. Sisältöalue käyttää leveyttä exportin tavoin.

## Constraintit
- **PYHÄ RAJA:** vain sidebar + oppimispolku + kurssinäkymä + MC-harjoitus. EI dashboard-sisältöä, EI arviointimoottoria, EI oppitunnin sisältöä, EI landingia.
- 0 uutta väriä/fonttia exportin tokenien ulkopuolelta. Ei gradientteja, ei mono-uppercasea ilman syytä, ei em-dashia.
- Mobiili: export romahtaa sidebarin <900px (`.sidebar { display:none }`) ja kytkee nykyisen mobiilinavin — säilytä meidän nykyinen mobiili-drawer-logiikka, älä riko sitä.
- `npm run build` + bump `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.

## Acceptance criteria
- Sidebar = exportin design, navi tasan 4 kohtaa (Etusivu/Oppimispolku/Kirjoittaminen/Koesimulaatio) Claude-ikoneilla; ei "Mestari".
- MC-harjoitus: oikein = vihreä, väärin = punainen, oikea optio korostuu aina vihreänä; palautepalkki + animaatiot exportin mukaan; nykyinen punainen-"Oikein"-bugi poissa.
- Oppimispolku + kurssinäkymä vastaavat exportia ja lukevat oikeaa dataa; flow sidebar→polku→kurssi→oppitunti toimii; oppitunnin sisältö ennallaan.
- Sisältö täyttää näytön (≤1080px appmain, ei kapeaa saraketta).
- Mobiilissa <440px ei vaakavieritystä; sidebar-drawer toimii kuten ennen.
- Playwright: uusi `tests/e2e-app-v388.spec.js` (sidebar-navi 4 kohtaa, MC oikein/väärin -tilat, polku→kurssi-navigointi) + olemassa olevat app-smoke-spec:t PASS.
- Screenshotit desktop + mobiili, ennen/jälkeen.

## Out of scope (omiin looppeihin / ei nyt)
- Landing → L-V387.
- Dashboard-etusivun sisällön redesign (vain sidebar tässä).
- Oppitunnin sisältönäkymä (pysyy meidän omana).
- Sanasto/Kielioppi/Lukeminen omina sivuinaan (vain sidebar-navista karsittu, moodit yhä saavutettavissa).

---

## DISCOVERY (tehty L-V387-session, 2026-06-04) — aloita tästä, älä re-exploraa

Koko discovery on jo tehty. Export-designit luettu (Exercise/Oppimispolku/Kurssi/Dashboard/Icons.jsx) + nykyinen app-koodi paikallistettu. Avainlöydökset:

### Export-CSS = jo repossa
`docs/design-ref/landing-export/kit.css` (sama brand-kit) sisältää JO `.app`, `.sidebar`, `.snav`, `.sidebar__brand`, `.sidebar__foot`, `.avatar`, `.drill`, `.option`, `.option__l`, `.fb`, `.lp-row`, `.lp-list`, `.lp-head`, `.lp-illu`, `.lesson-row`, `.lesson-list`, `.cd-head`, `.cd-progress`, `.crumbs`, `.appmain` -säännöt (rivit ~177-321). Kopioi nämä verbatim app-CSS:ään (esim. uusi `css/components/app-export.css` tai laajenna olemassa olevia). `app-export/kit.css` = identtinen lähde.

### Lucide-polut (Icons.jsx LUCIDE_PATHS) — sidebarin 4 + harjoitus/polku tarvitsemat
home, route, pencil, clock (sidebar-navi 4); lisäksi check-check, x, arrow-right, chevron-right, lock, circle-check. Path-data brief-lähteessä `docs/design-ref/app-export/Icons.jsx`, kopioi verbatim (viewBox 0 0 24 24, stroke-width 2).

### KOPIO 1 — Sidebar
Nykyinen sidebar-markup: **`app.html` rivit ~130-185** (`.sidebar-item`, `.sidebar-user#sidebar-user data-nav="profile"`, `.mobile-nav-item`). EI export-luokkia (`.snav`). Säilytä `data-nav`-koukut + `#sidebar-user`-avatar (profiili). Karsi navi 4:ään: Etusivu(home)/Oppimispolku(route)/Kirjoittaminen(pencil)/Koesimulaatio(clock). Pudota Sanasto/Kielioppi/Lukeminen sidebar-navista (pidä saavutettavissa Etusivun moodikorteista). Alaosa: avatar + nimi + kieli, EI "Mestari". Sidebar-render/logiikka myös `js/components/sidebarShell.js` + `js/features/profileMenu.js`.

### KOPIO 2 — MC-bugi (oikea näkyy punaisena) = CASCADE-TANGLE, ei yksi rivi
Juurisyy on **kaksi kilpailevaa state-systeemiä + epäyhtenäiset luokkanimet**:
- `css/components/exercise.css` (rivit 239-265): `.ex-option.is-correct` = `--success` (vihreä), `.is-wrong` = `--error` (punainen). OK-semantiikka.
- `css/app-old-spain.css` (rivit 935-952, `body.app`-scope, **voittaa cascaden appissa**): `.is-correct` = `--ed-olive` (oliivi), `.is-wrong` = `--ed-accent` (= brick/terrakotta-PUNAINEN).
- Näytöt eri mieltä luokista: `js/screens/adaptive.js` (220-221) + `js/demo.js` (110-112) lisäävät `.correct`/`.wrong` (EI `is-`-prefiksiä → **ei mitään CSS-sääntöä → tyylittömät**); `js/screens/grammar.js` (168-174) + `js/main.js` (772-787) käyttävät `.is-correct`/`.is-wrong`.
- MC-renderöijä `js/renderers/monivalinta.js` luo `.ex-option`/`.ex-option__l`/`.ex-option__t`, EI aseta state-luokkia (caller asettaa). correctIndex tulee `ex.payload.monivalinta.correctIndex`.
- **Oikea fix (brief Copy 2):** korvaa sotku exportin yhdellä puhtaalla systeemillä: `.option[data-state="correct|wrong|dim"]` + `--success`/`--error`. Vaatii: (a) monivalinta.js luokka `ex-option`→`option` (tai mäppää), (b) callerit asettamaan `data-state` yhtenäisesti (oikea AINA vihreä, valittu väärä punainen, muut dim), (c) `.fb__line.ok/.no` + check-check/x-ikoni, (d) poista/yhtenäistä molemmat vanhat is-correct/is-wrong -lohkot ettei cascade riitele. HUOM: `.ex-option` esiintyy monessa näytössä (vocab/grammar/adaptive/reading short-answer) — varmista ettei muiden tyyppien tyyli rikkoudu (esim. pidä alias tai migroi kaikki).
- **REPRO ENNEN FIXIÄ:** kirjaudu test-tunnuksella (`.env` TEST_PRO_EMAILS/TEST_FREE_EMAILS), navigoi sanasto/kielioppi-MC:hen, ota screenshot väärästä JA oikeasta vastauksesta → todenna bugi → fix → todenna vihreä/punainen. Älä fixaa sokkona.

### KOPIO 3 — Oppimispolku + Kurssi
Nykyiset näytöt: **`js/screens/learningPath.js`** (oppimispolku) + **`js/screens/courseDetail.js`** (kurssi). Markup myös `app.html` ~rivi 1202+ (Oppimispolku-screen). Data: `data/courses/` (es/de/fr, 8 kurssia × ~90-10 oppituntia) + käyttäjän progress. Wiraa exportin `.lp-row`(active/locked) + `.lesson-row`(done/active/upcoming) oikeaan dataan. `.appmain { max-width:1080px }` täyttää näytön (toistuva "kapea sarake" -valitus).

### Verifiointi
- Test-tunnukset `.env`:ssä. Playwright toimii harnessissa (`feedback_playwright_works_in_harness`). Gate-bypass: `addInitScript` set `puheo_gate_ok_v1=1` ENNEN gotoa.
- Uusi spec `tests/e2e-app-v388.spec.js` + olemassa olevat app-smoke:t.
- `npm run build` (app on bundlattu: `/app.bundle.js`+`.css` + `chunks/*`) ENNEN committia. Bump `sw.js` CACHE_VERSION (nyt `puheo-v387`) jos STATIC_ASSETS-sisältö muuttuu (app.html + css/* ovat STATIC_ASSETS:issa).
- Mobiili: sidebar `display:none` <900px, nykyinen mobiili-drawer säilytetään (`css/components/off-canvas-nav.css`, `mobile-nav-item`).
