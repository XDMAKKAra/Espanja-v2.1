# L-V356 — Per-kieli abikurssi-SEO-sivut (espanja / saksa / ranska)

**Rooli:** WRITER. **Skill-stack:** FRONTEND-L (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + COPY (`humanizer`) + SEO (`marketing-skills:programmatic-seo`, `marketing-skills:seo-audit`, `marketing-skills:schema`) + TESTING-M (`webapp-testing`) + `superpowers:verification-before-completion`.

## Tausta & korjattava nykytila
Marcel haluaa WordDiven tapaan oman sivun jokaiselle kielelle (vrt. `worddive.com/fi/kielikurssit/englannin-abikurssi/`) — SEO + uskottavuus. **Olemassa olevat `public/landing/{espanja,saksa,ranska}.html` ovat vanhoja WAITLIST-sivuja** ("Liity waitlistille, avautuu syksyllä 2026", vanha pre-WordDive-brändi, `landing-waitlist-*.js`). Ne ovat ristiriidassa nykytilan kanssa (tuote lanseerataan, hinnoittelu live) → **korvaa ne, älä luo rinnakkaisia.**

## Avainoivallus SEO-datasta (`docs/seo-keywords.md`)
- **"abikurssi" on oikea sana**, ei "yo-koe valmennus". Lukiolaiset hakevat "abikurssi".
- **"espanjan/saksan/ranskan abikurssi" = avoin rako** (KD=0, ei kilpailijoita datassa). Halpa varma kaappaus.
- Tueksi pienemmät yo-prep-haut: "lyhyt espanja yo koe", "lyhyt saksa yo 2026", "lyhyt X pisterajat" jne.
- **Rehellinen odotus (kirjaa, älä lupaa liikoja):** yo-prep-volyymit ovat pieniä (~50–100/kk per kieli), SEO ~30 % growthista (TikTok 70 %). Näiden sivujen arvo on **(a) uskottavuus** (oikealla tuotteella on omat sivut), **(b) nollakilpailun "X abikurssi" -termien kaappaus**, **(c) laskeutumissivu TikTok/some/ads-CTA:lle** — ei iso orgaaninen liikennefirehose.

## Mitä rakennetaan
Kolme kieli-sivua samalla templatella, **nykyinen WordDive-brändi** (cream/brick/keltainen/vihreä, Fredoka+Mulish — EI vanhaa waitlist-brändiä, EI WordDive-turkoosia). Jokainen sivu:

1. **SEO-kerros** (per kieli, `marketing-skills:seo-audit`+`schema`):
   - Title: muotoa **"Espanjan abikurssi netissä – Puheo | Lyhyt YO-koe valmennus"** (sisältää abikurssi + yo-koe + kieli).
   - H1: **"Espanjan abikurssi YO-koetta varten"**.
   - meta description + keywords (abikurssi + "lyhyt X yo koe" -variantit docista), canonical, OG, Twitter.
   - JSON-LD **Course** + **SoftwareApplication** (päivitä vanha; poista waitlist-henki).
   - Puhdas URL **abikurssi-edellä:** esim. `/espanjan-abikurssi` (säilytä/301 vanha `/espanjan-yo-koe`). Reititys `vercel.json`:iin.
2. **Sisältö (humanizer-pass, suomi):**
   - Hero + intro: mikä kurssi on (8 kurssia A→E, YTL-rubriikki, kirjoitusten arviointi). **Linjaa arviointi-copy L-V354:n haarukka-reframen kanssa** — "pistehaarukka + perustelu", EI "tarkka piste / sama tarkkuus kuin sensoreilla".
   - **Demot kursseista ja tehtävistä:** oikea esimerkki-tehtävä + curriculum-katsaus (8 kurssia) + arviointinäyte (haarukka). Brändin flat-SVG:t. Ei fake-väitteitä, ei lukio-nimiä, ei keksittyjä %-lukuja.
   - **CTA-nappi (iso, heti alussa + toistettuna):** → onboarding/aloituskartoitus (`onboardingV4` / `routes/placement.js`) **`?lang=es|de|fr`-parametrilla** niin että kieli/kurssi esivalitaan portaalissa. Tämä on se "portaali jossa valitaan kurssi → aloituskartoitus alkaa".
   - **Sisäiset ristilinkit** muihin kahteen kielisivuun (SEO-doc kohta 7: yksi rankkaava kieli nostaa muiden auktoriteettia).
3. **Saavutettavuus navista:** lisää sivut desktop-naviin ja **L-V355:n mobiilivalikkoon** (esim. "Abikurssit" → 3 kieltä, tai suorat kielilinkit). Koordinoi L-V355:n kanssa.

## Acceptance criteria
- 3 sivua live, nykyinen WordDive-brändi, ei waitlist-jäänteitä, ei "avautuu syksyllä".
- SEO: title/H1/description/keywords abikurssi-painotuksella; validi JSON-LD (Course+SoftwareApplication); canonical + OG kunnossa; puhtaat URLit reititetty; vanhat URLit 301.
- CTA vie onboarding-kartoitukseen oikealla `?lang=`-esivalinnalla (todenna Playwrightilla että kieli periytyy).
- Sisäiset ristilinkit toimivat; sivut saavutettavissa navista + mobiilivalikosta.
- Desktop + 390px mobiili: ei vaakavieritystä, ei JS-virheitä, brändi-yhtenäinen, humanizer-pass kaikelle suomi-tekstille.
- `sitemap.xml` + `robots.txt` päivitetty (jos olemassa) uusilla URLeilla.

## Files (arvio)
`public/landing/{espanja,saksa,ranska}.html` (uudelleenrakenna), uusi jaettu CSS jos tarpeen (`css/landing-course.css`?) tai `css/landing.css`-laajennus, poista/arkistoi `js/landing-waitlist-{de,fr}.js`, `vercel.json` (reititys + 301), `index.html` + `js/landing-nav.js` + mobiilivalikko (navilinkit), `sitemap.xml`/`robots.txt`, `og-image` per kieli jos halutaan.

## Skooppi & overlap
- **Mukana:** 3 SEO-kielisivua + navi/valikko-linkit + CTA-reititys + SEO-meta/schema/sitemap.
- **EI mukana:** onboarding/kartoitus-flown itse muutos (käytä olemassa olevaa `onboardingV4`); blog-postaukset (SEO-docin kohdat 4–6 = oma myöhempi brief); landing-pääsivun mobiilikorjaus (= L-V348).
- **Riippuvuus:** L-V355 (mobiilivalikko) tarjoaa paikan kielilinkeille — aja L-V355 ensin tai samassa passissa.

## Push
Näkyy käyttäjälle → **push mainiin** verifyn jälkeen. `npm run build` + `sw.js` CACHE_VERSION -bump (uudet sivut + assetit STATIC_ASSETSiin jos lisätään).
