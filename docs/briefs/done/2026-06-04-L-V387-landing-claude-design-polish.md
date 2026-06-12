# L-V387 — Landing-hero Claude Design -kitin tasolle: lämmin tausta, hienompi kurssikortti, luottamusblokki

**Numero:** käytä seuraavaa vapaata L-VXXX jos 387 viety.

**Skill-stack:** FRONTEND-L (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + COPY (`humanizer`) + TESTING-M (`webapp-testing`).

**Rooli:** writer. Rakentuu **L-V385:n päälle** (done/) — landing-hero on jo Lara-rakenteessa: vasen teksti-palsta + oikea kurssikortti (ES/FR/DE-välilehdet, 49 €, checklist). Tämä loop **nostaa sen visuaalisen tason** Claude Designin tuottaman version mukaiseksi ja lisää luottamusblokin. ÄLÄ rakenna heroa uusiksi tyhjästä.

---

## Tausta

Marcel ajoi repon Claude Designin (claude.ai web-artifact) läpi ja sai version joka näyttää selvästi paremmalta kuin nykyinen tuotanto-landing. Tämä on **kopiointi, ei uudelleensuunnittelu** — sama kuin V388.

**Design-lähde (totuus): `docs/design-ref/landing-export/`** — Marcel exporttasi landingin koodina (sama kuin app-puolen export). Sisältää sekä **markupin että CSS:n verbatim**:
- **Komponentit (JSX-markup):** `Hero.jsx`, `CourseCard.jsx`, `TopNav.jsx`, `Arviointi.jsx`, `GraderCard.jsx`, `Languages.jsx`, `Faq.jsx`, `Pricing.jsx`. Toista näiden DOM-rakenne + luokkanimet.
- **CSS verbatim:** `kit.css` (landing-komponenttityylit: `.nav`, `.hero`, `.hero__grid`, `.coursecard`, `.coursecard__tabs`, `.coverage`, `.arviointi`, `.faq`, `.footer`). Kopioi säännöt sellaisenaan.
- **Tokenit:** `colors_and_type.css` (`--bg #FBF7EF`, `--bg-card #FFFDF8`, `--brick #9B2D2A`, `--success`, `--error`, Fredoka + Mulish). Jos meidän token-nimi eroaa, vaihda vain nimi, ÄLÄ arvoa.
- Renderöity referenssi: avaa `docs/design-ref/landing-export/index.html` selaimessa, vertaa rinnakkain meidän landingiin.

Tämä EI ole uusi design-suunta. Brändi-tokenit, fontit ja paletti pysyvät (`project_design_pivot_tailwind_screenshots`, `project_design_system_worddive`). Otetaan kitin toteutus samoilla paloilla.

### Kopiointitarkkuus — ÄLÄ KEKSI OMAA
- **CSS:** kopioi kitin landing-säännöt `kit.css`:stä **verbatim** (samat arvot: padding, gap, radius, varjo, grid-sarakkeet `1.04fr 0.96fr` jne.). Älä pyöristä omiin makuihisi.
- **Markup:** toista kitin **DOM-rakenne + luokkanimet** sellaisenaan (`.hero__grid`, `.coursecard`, `.coursecard__tabs button[data-active]` jne.).
- **Ainoa muunnos:** JSX/React → meidän vanilla-JS. Visuaalinen lopputulos pikselilleen kitin näköinen. Screenshot-diff standalone-kittiä vasten todentaa.
- **Poikkeus:** alla olevat sisältö-deltat (kohdat 2–3) ovat Marcelin muutoksia **kitin päälle** — kitissä on "Avoinna nyt", Treeni-rivi ja kaksi nappia; ne muutetaan. Luottamusblokki (kohta 3) EI ole kitissä lainkaan (se on Lara-mallin lisäys) → rakenna se kitin tokeneilla ja komponenteilla, mutta se on ainoa "uusi" osa.

## Tavoite

### 1. Lämmin taustaväri koko sivun taustaan
Marcel: tausta saa olla lämmin cream **koko sivun läpi**, ei vain aksenttina niin että väliin jää lähes-valkoisia/valkoisia osioita. Nykyisessä herossa tausta katkeaa. Tee taustasta yhtenäinen lämmin pohja (kitin body = `#FBF7EF`), ja anna korttien/elementtien nousta siitä omalla pinnallaan (`card`-token vaaleampi). Älä riko heroa valkoisilla full-bleed-kaistoilla. Säilytä olemassa olevat osio-rytmin tint-kaistat (terracotta-tint), mutta perustausta = lämmin, ei valkoinen.

### 2. Kurssikortti kitin tasolle
Kopioi kitin `.coursecard` (kit.css + standalone-render) meidän kortiksi: kielivälilehdet (Espanja/Saksa/Ranska, `.coursecard__tabs button[data-active]`), iso hinta **49 €**, "MITÄ SISÄLTYY" -checklist rasti-ikoneilla. Kitin kortti on pyöreämpi, ilmavampi, parempi varjo (`--sh-md`) ja typografinen hierarkia kuin nykyinen. Käytä vain kitin tokeneita, 0 uutta väriä/fonttia.

**Kortista POIS:**
- **"Avoinna nyt" -badge** kokonaan (vihreä pill kortin yläreunassa).
- **Treeni 9 €/kk -mainosrivi kortin sisältä** ("tai Treeni 9 €/kk, kuukausi kerrallaan"). Treeni mainitaan Hinnoittelu-sivulla, ei tässä kortissa.

**Kortin CTA (PÄÄTÖS Marcel 2026-06-04):**
- Yksi ensisijainen nappi: **"Aloita nyt"**.
- Poista nykyinen kahden napin pari ("Valitse kurssi" / "Varaa paikka · 49 €" / "Aloita ilmaiseksi + Varaa paikka"). Kortissa on yksi selkeä CTA.
- "Aloita nyt" vie samaan app-signup-flowhun kuin vasemman palstan CTA (ilmainen aloitus, ei Stripeä — `feedback_keep_payment_infra`).

### 3. Luottamusblokki heron alle (Lara-malli)
Nykyisestä herosta puuttuu sosiaalinen todiste. Lisää heron alapuolelle (ei kortin sisään) kompakti luottamusblokki, joka jäljittelee Laran rakennetta mutta Puheon sisällöllä:

**(a) Tähtiarvio-rivi:** `8.9 / 10` tähdillä + lyhyt alateksti (esim. "abien palautteen perusteella"). Marcel hyväksyi tämän eksplisiittisesti (vaihtoehto 1).

**(b) Opettajan palaute -kortti:** eyebrow "Opettajan palaute" + lainaus + nimi + titteli. Sisältö kertoo miten tekoälyn arviointi vastasi opettajan omia arviointikriteereitä. Ehdotettu copy (aja `humanizer` ennen committia, hio äänensävy):

> "Annoin saman abikirjoitelman sekä Puheon että itseni arvioitavaksi. Pistehaarukka osui samaan, ja perustelu nosti esiin tismalleen ne kohdat joista olisin itse vähentänyt."
> — Hanna Lehto, lukion kieltenopettaja

> ⚠️ **TIEDOSTETTU LUKKO:** tämä testimoniaali + 8.9/10 ovat **keksittyjä**. Marcel hyväksyi tämän eksplisiittisesti 2026-06-04 tietäen että se rikkoo `feedback_no_fabricated_provable_claims` -sääntöä ja on Suomen kuluttajansuojalain harmaalla alueella (keksityt arvostelut markkinoinnissa). Käytä **geneeristä nimeä, EI oikeaa henkilöä eikä lukion nimeä** (vähentää tunnistettavuus-/loukkausriskiä). Älä lisää muita keksittyjä todennettavia väitteitä (ei prosentteja, ei lukioiden nimiä, ei "X oppilasta").

### 4. Heron tyhjä tila pois
Nykyisessä herossa vasen palsta loppuu korkealle ja alle jää iso kuollut alue (näkyi V385-screenshotissa). Luottamusblokki + tasapainoitettu korttikorkeus täyttää tämän. Varmista että vasen ja oikea palsta ankkuroituvat järkevästi samalle alueelle desktopilla, eikä alas jää orpoa valkoista.

### 5b. Mobiilijärjestys herossa (PÄÄTÖS Marcel)
Mobiilissa hero pinotaan tässä järjestyksessä ylhäältä alas:
1. Otsikko + ingressi (teksti)
2. Pää-CTA "Aloita nyt" (+ "Ei maksukorttia" -alarivi)
3. Luottamusblokki: 8.9/10-tähtiarvio + opettajan palaute + YTL-badge
4. **Vasta sitten kurssikortti** (kielivälilehdet + hinta + "mitä sisältyy" = kurssivalinta)

Eli mobiilissa kortti tulee VIIMEISENÄ, ei heti tekstin alle. Käyttäjä saa ensin myyntiviestin + luottamuksen, sitten valitsee kurssin. Desktopilla kortti pysyy oikeassa palstassa kuten kitissä. Toteuta CSS-järjestyksellä (esim. `order`/flex-suunta mobiilibreakissa), älä kahdenna markupia.

### 5c. Säilytä YTL-badge + vihreä-aksentti
- Pidä **"Rakennettu YTL:n virallisille arviointikriteereille"** -badge (kitin `.hero__trust .badge`, oliivinvihreä). Marcel: hyvä teksti, säilytä.
- Vihreä (`--olive` / `--success`, esim. tuon badgen sävy) on Marcelin mielestä hyvä väri — sitä saa käyttää muuallakin landingissa aksenttina (esim. luottamusblokin elementeissä), ei vain yhdessä paikassa. Ei silti ylikäyttöä; pidä brick edelleen pää-action-värinä.

### 5. Korjaa `/artikkelit`-sivun rikkinäinen top bar
Artikkelihub (`/artikkelit`, juuri shipattu L-V386) latautuu **täysin rikkinäisellä yläpalkilla**: navi-linkit menevät päällekkäin, mobiilivalikko on auki ja hajalla (hampurilainen + X + linkit kasassa, "Kaikki kurssit / Espanjan abikurssi" -dropdown levällään ylhäällä). Itse artikkelisisältö (otsikko, ingressi, suodatinchipit) **näyttää hyvältä** — vain top bar on rikki. Korjaa: artikkelit-sivun yläpalkki käyttää **samaa jaettua naviratkaisua kuin muu sivusto** (kopioi kitin `TopNav.jsx` + `.nav`-luokat, sama hampurilainen-/mobiilivalikko-logiikka kuin V382/V383-sivuilla). Syy on todennäköisesti puuttuva/väärä nav-CSS tai eri nav-markup artikkelit-templaatissa — yhtenäistä se muiden staattisten sivujen kanssa.

## Constraintit
- **PYHÄ RAJA:** landing (`index.html`) + landing-CSS + artikkelit-templaatti/nav (kohta 5). ÄLÄ koske `app.html` / `app.js` / `js/**` / arviointimoottoriin. App-puoli = oma loop (L-V388).
- **FR/DE OVAT MUKANA:** Claude Design / kit luuli virheellisesti ettei Puheolla ole vielä ranskaa ja saksaa — **on on**. Pidä kaikki kolme kieltä (ES/FR/DE) kurssikortin välilehdissä ja copyssa; jos kitin teksti vihjaa vain espanjaa, korjaa se kattamaan kaikki kolme. (`project_target_languages_multi`)
- 0 uutta väriä/fonttia, vain kitin tokenit (`colors_and_type.css`). Ei gradient-textiä, ei em-dashia, ei mono-uppercase-chippejä ilman syytä, ei 3-4 identtistä korttia.
- Kaikki uusi/muutettu suomi-teksti `humanizer`-läpi ennen committia (CTA-labelit, luottamusblokki, kortin tekstit).
- Per-kieli proof-switch (ES/FR/DE-välilehdet) toimii kuten ennen.
- `npm run build` + bump `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.

## Acceptance criteria
- Tausta yhtenäisen lämmin koko sivun läpi, ei valkoisia full-bleed-katkoja herossa.
- Kurssikortti vastaa kitin viimeistelyä; "Avoinna nyt" + Treeni-rivi poistettu; yksi CTA "Aloita nyt".
- Luottamusblokki heron alla: 8.9/10-tähtiarvio + opettaja-testimoniaali (geneerinen nimi).
- Heron alaosaan ei jää isoa tyhjää aluetta desktopilla.
- `/artikkelit`-sivun top bar ehjä ja yhtenäinen muun sivuston kanssa (ei päällekkäisiä linkkejä, mobiilivalikko avautuu/sulkeutuu oikein); artikkelisisältö ennallaan.
- Kurssikortin välilehdet ja copy kattavat ES + FR + DE.
- Mobiilissa hero-järjestys: teksti → CTA → luottamusblokki → kurssikortti viimeisenä.
- YTL-badge ("Rakennettu YTL:n virallisille arviointikriteereille") tallella.
- Mobiilissa <440px ei vaakavieritystä; kortti + luottamusblokki latautuvat järkevästi pinottuna.
- Playwright-spec (uusi `tests/e2e-landing-v387.spec.js`) + V385/V383/V382-spec:t PASS molemmilla projekteilla (390 + 1440).
- Screenshotit 1440 + 390 ennen/jälkeen.

## Out of scope (omiin looppeihin)
- App-sidebarin siistiminen → L-V388.
- Artikkelihub → L-V386 (jonossa).
- Stripe-osto / "Varaa paikka" -maksuflow (placeholder kunnes Stripe live).
