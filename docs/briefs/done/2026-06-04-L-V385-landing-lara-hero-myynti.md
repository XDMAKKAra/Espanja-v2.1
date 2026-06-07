# L-V385 — Landing Lara-rakenteeseen: myy heti, luota sisältöön, demo pois herosta

**Numero:** käytä seuraavaa vapaata L-VXXX jos 385 on viety. HUOM: aiempi L-V383 oli pricing.html-siivous (eri asia) — sen numeron alle merkattu brief `done/2026-06-04-L-V383-landing-lara-rakenne.md` EI ole ajettu, tämä korvaa sen.

**Skill-stack:** FRONTEND-L (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + COPY (`humanizer`) + TESTING-M (`webapp-testing`).

**Rooli:** writer. Rakentuu V380–V383:n päälle (landing jo typistetty, /nayte + /ukk olemassa). Älä rakenna noita uudestaan.

---

## Tausta

Marcel vertasi laralearn.ai:ta ja Puheota vierekkäin desktopilla. Lara vakuuttaa enemmän vaikka on halvemmalla tehty. Laran tuoteoverlap Puheoon = 0 (Lara myy EN/SE, Puheo ES/FR/DE), joten Lara on **kopioitava rakennemalli**, ei asiakaskilpailija. Ks. muisti `project_lara_competitor_playbook`.

Laran desktop-hero: vasen palsta = eyebrow + iso serif-otsikko + alaotsikko + 2 CTA + tähtiarvio + 1 testimoniaali; oikea palsta = **ostokortti** (kieli-välilehdet, hinta, CTA, "mitä sisältyy" -checklist). Koko sivulla EI yhtään tuotedemoa, silti se kertoo heti mistä on kyse, luo heti luottamuksen ja CTA on heti näkyvissä. Kaikki syvyys on "Lue lisää" → omia sivuja + paljon blokkeja.

## Tavoite

1. **Demo POIS landingilta kokonaan** (ei vain mobiililta). Marcel: "EI mitään demot." Iso kirjoitusnäkymä-screenshot herosta pois. Demo elää `/nayte`-sivulla; herosta sekundaarilinkki "Katso miten arviointi toimii → /nayte". (Demoa EI poisteta sivustolta — se on Puheon ainoa oikea-tuote-etu Laraan; se pidetään yhden klikin päässä.)

2. **Hinnoittelu-/kurssikortti heroon, Laran desktop-layoutilla.** Oikea palsta = Puheon kortti: ES/FR/DE-välilehdet, hinta, "mitä sisältyy" -checklist. Tämä toteuttaa "myydään heti tuote" + "kurssivalinta+hinnasto heti" suoraan herossa.

3. **Luottamus SISÄLLÖSTÄ kertomalla, ei demolla.** Kuvaile mitä sisältö kattaa (8 kurssin polku, YTL-mukaiset tehtävät, kaikki koeosiot: luetun/kuullun ymmärtäminen, sanasto+kielioppi, kirjoittaminen) + arviointilupaus sanoin. **Arviointi kerrotaan toisin kuin Lara:** Lara sanoo "selittävä palaute" (piilottaa ettei ole AI). Puheo tekee päinvastoin — kone-arviointi on etu: "Kirjoitat oikean YO-tyylisen tehtävän, me arvioimme tekstisi YTL:n kriteereillä ja annamme palautteen: missä menetit pisteitä ja miksi." Aja `humanizer`.

4. **Freemium-vivahde — älä kopioi Laran "Osta nyt" -kitkaa.** Lara = puhdas maksumuuri. Puheo = freemium: "Aloita ilmaiseksi, ei korttia" toimii JO (app-signup, ei Stripeä). Pää-CTA herossa = **"Aloita ilmaiseksi"** (matalampi kitka kuin Laralla = Puheon etu). "Kurssi 49 €" -osto = toissijainen + lead-capture kunnes Stripe live.

5. **Lyhyt landing + lue-lisää-rakenne.** Blokit lyhyinä, syvyys omille sivuille (/nayte, /ukk, per-kieli-sivut, tulevat artikkelit L-V386). Ei "turhaa paskaa".

## Hero-rakenne (intent, writer valitsee compositionin)
- Vasen: eyebrow + iso otsikko (nyk. "Varmuutta ylioppilaskokeeseen. Stressitöntä kertausta." OK) + alaotsikko (sisältö + arviointilupaus sanoin) + pää-CTA "Aloita ilmaiseksi" + sekundaari "Katso miten arviointi toimii →" + kevyt luottamusrivi.
- Oikea: ES/FR/DE-kortti + hinta + "mitä sisältyy" -checklist + toissijainen osto-CTA (lead-capture).
- Ei isoa demo-screenshottia.

## AVOIMET PÄÄTÖKSET (rikkovat Marcelin omia lukittuja sääntöjä — default = turvallinen, Marcel voi yliajaa)

**1. Keksitty nimekäs testimoniaali.** Marcel pyysi aiemmin "keksi nimi + lukion opettaja" (Lara: "Susan Villa, lukion kieltenopettaja"). Rikkoo vituttaa-listan "fake testimoniaalit nimillä" + `feedback_no_fabricated_provable_claims`. **DEFAULT:** ei valehenkilöä; korvaa "Rakennettu YTL:n virallisille arviointikriteereille" -merkillä / osa-aluekattavuudella. Jos Marcel vahvistaa: etunimi + geneerinen rooli, ei sukunimeä/lukiota.

**2. "AI arvioi kuin oikea koe / kuin minä".** Rikkoo L-V354:n (`project_grading_engine_validation`). **Saa luvata:** "YTL:n kriteereillä", "pisteytysarvio (haarukka) + perustelu". **EI:** "sama tarkkuus kuin sensori", tarkka piste.

**3. Sticky/osto-CTA vs. Stripe ei live** (503/410, `feedback_keep_payment_infra`; Stripe vaatii luvan `feedback_no_stripe_actions_until_authorized`). Hinnoittelu = Treeni 9 €/kk + Kurssi 49 € (`project_product_naming_and_level`), EI Laran one-time. **DEFAULT:** osto-CTA = lead-capture / "varaa paikka"; pää-konversio = ilmainen aloitus joka toimii jo. Älä koske Stripeen.

## Acceptance criteria
- Mobiili <440px: ei vaakavieritystä; ei demo-screenshottia; otsikko+alaotsikko+CTA+kortti järkevästi pinottuna above-fold-painotuksella.
- Desktop: kaksipalstainen hero (teksti vasen, kurssi/hinta-kortti oikea), ei demoa.
- Kurssivalitsin ES/FR/DE vaihtaa hinnan/kontekstin.
- Kaikki suomi-copy läpäisee `humanizer`.
- Ei valehenkilö-testimoniaalia (default) eikä "sama tarkkuus" -lupausta.
- `npm run build`; `sw.js` CACHE_VERSION bump jos STATIC_ASSETS muuttuu; Playwright 390px + 1440px screenshotit. Verify omilla tooleilla.

## Out of scope
- Toimiva Stripe-checkout (L-STRIPE-1, vaatii luvan).
- Artikkelihub → L-V386.
- App-puoli.
