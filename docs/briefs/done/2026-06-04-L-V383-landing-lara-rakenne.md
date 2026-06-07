# L-V383 — Landing Lara-rakenteeseen: teksti-first hero + kurssivalinta-hinnasto + sticky buy-bar

**Skill-stack:** FRONTEND-L (`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`) + COPY (`humanizer`) + TESTING-M (`webapp-testing`). Frontti + suomi-copy + Playwright-verify.

**Rooli:** writer. Tämä on landingin seuraava inkrementti V380–V382:n päälle (jotka jo: typistivät landingin, siirsivät arviointidemon heron alle, loivat /nayte + /ukk -sivut). Älä rakenna noita uudestaan — rakenna päälle.

---

## Tausta (intent, ei pikseleitä)

Marcel kävi läpi pää-kilpailija **laralearn.ai**:n (myy EN/SE, ei tuoteoverlapia Puheon ES/FR/DE kanssa → kilpailee vain huomiosta). Laran sivu on tehty halvalla mutta **toimii sivuna**: kertoo heti mistä on kyse, luo heti luottamuksen, CTA heti näkyvissä, eikä koko sivulla ole yhtään tuotedemoa — kaikki muu on "Lue lisää" → omia sivuja + paljon blokkeja. Marcel haluaa Puheon landingin samaan rakenteeseen, omalla brändillä ja **oikealla tuotteella** (Laran heikkous = geneerinen stock-look; meidän etu = aito app-UI).

Laran sivurakenne referenssiksi (ÄLÄ kopioi copyä, kopioi rakenne): sticky promo-bar → teksti-first hero (serif-otsikko + alaotsikko + 2 CTA + tähtiarvio) → luottamuselementti → hinnoittelukortit välilehdillä → arvoblokki → "miten toimii" → osa-alueet → kurssivalinta → testimoniaalit → FAQ → "3 askelta alkuun" → footer + sticky bottom buy-bar.

## Tavoite

1. **Mobiilissa: poista iso tuote-screenshot-kortti herosta kokonaan.** Se syö koko ensiruudun ja työntää arvolupauksen + CTA:n foldin alle. Hero = teksti-first: otsikko, alaotsikko, 1–2 CTA, kevyt luottamuselementti (tähtiarvio / "X abia harjoittelee"). Demo elää jo /nayte-sivulla → hero-CTA tai "Lue lisää → Katso miten arviointi toimii" linkkaa sinne. (Desktopilla screenshotin saa pitää jos se ei tönäise CTA:ta foldin alle — writer arvioi.)
2. **Arviointi-arvolupaus heroon tekstinä** (ei isoa demokuvaa): hero viestii heti että Puheo antaa tekoälyarvion kirjoitelmasta. Sanamuoto-rajoite alla (AVOIN PÄÄTÖS 2).
3. **Heti heron jälkeen: kurssivalinta + hinnasto** — käyttäjä valitsee kielen (Espanja/Ranska/Saksa) ja näkee hinnan heti, ei tarvitse etsiä myöhemmin. Välilehti- tai segmenttivalitsin kuten Laralla (englanti/ruotsi/pakettidiili).
4. **Sticky bottom buy-bar**: kun kieli on valittu, alapalkki näyttää koko ajan valitun kielen + hinnan + CTA:n (kuten Laran "49,99 € · Englanti · Osta englannin kurssi"). Valinta seuraa scrollissa.
5. **Brändiblokit + "lue lisää" -rakenne**: arvoblokit, "miten toimii", osa-alueet jne. lyhyinä blokkeina, syvyys omille sivuille (/nayte, /ukk, per-kieli-sivut). Landing pysyy lyhyenä, ei "turhaa paskaa".

## AVOIMET PÄÄTÖKSET — älä toteuta sokkona, nämä rikkovat Marcelin omia lukittuja sääntöjä. Default = turvallinen versio; Marcel voi yliajaa.

**1. Keksitty opettaja-testimoniaali.** Marcel pyysi "keksi oma nimi + lukion opettaja" (Lara: "Susan Villa, lukion kieltenopettaja"). Tämä rikkoo Marcelin omaa sääntöä: vituttaa-lista "fake testimoniaalit nimillä" + muisti `feedback_no_fabricated_provable_claims` (fiktiivinen OK vain jos ei oikeudellisesti haastettavissa — ei nimettyjä henkilöitä esitettynä todellisina).
   - **DEFAULT (toteuta tämä):** EI keksittyä nimettyä henkilöä. Korvaa luottamus todenmukaisella: "Rakennettu YTL:n virallisille arviointikriteereille" -merkki, osa-aluekattavuus, tai nimetön metodikuvaus. Ei valehenkilöä takaamassa.
   - Jos Marcel vahvistaa eksplisiittisesti haluavansa nimetyn persoonan: käytä etunimi + geneerinen rooli ("kieltenopettaja"), EI sukunimeä eikä nimettyä lukiota → vähemmän haastettavissa. Mutta default = ei.

**2. "AI arvioi kuin oikea koe / kuin minä".** Marcel pyysi copyn jossa tekoäly arvioi "samalla tavalla kuin minä, tai paremmin". Tämä on TASAN se valelupaus jonka L-V354 ([[project_grading_engine_validation]]) korjasi: per-kieli-bias + ohut FR-data → tarkkaa pistettä EI voi luvata, vain pistehaarukka + perustelu.
   - **Saa luvata:** "Arvioi YTL:n virallisilla kriteereillä", "antaa pisteytysarvion (haarukka) ja perustelun jokaisesta kirjoitelmasta", "näet missä menetit pisteitä ja miksi".
   - **EI saa luvata:** "sama tarkkuus kuin sensori", "sama arvosana kuin oikeassa kokeessa", tarkka pistemäärä. Aja copy `humanizer`-läpi (ei em-dashia, ei "kalibroitu/monipuolinen").

**3. Sticky "Osta kurssi" -CTA vs. Stripe ei ole live.** Lara linkkaa suoraan buy.stripe.com:iin. Puheon maksureitit ovat placeholder (503/410, `feedback_keep_payment_infra`) ja Stripe-toimet vaativat eksplisiittisen luvan (`feedback_no_stripe_actions_until_authorized`). Hinnoittelu = Treeni 9 €/kk + Kurssi 49 € (lukitut nimet, `project_product_naming_and_level`), EI Laran one-time-malli.
   - **DEFAULT (toteuta tämä):** sticky-bar + CTA rakennetaan visuaalisesti valmiiksi, mutta CTA = **lead-capture / sähköpostilista / "varaa paikka syksyn 2026 kurssille"**, EI toimivaa checkoutia. Tämä tukee samalla Lara-tyylistä lead-magnet-suppiloa (ks. some-playbook). Älä koske Stripeen.
   - Jos Marcel haluaa toimivan checkoutin → erillinen Stripe-lupa + oma loop (L-STRIPE-1), ei tässä.

## Acceptance criteria

- Mobiili <440px: ei vaakavieritystä; herossa EI isoa screenshot-korttia; otsikko + alaotsikko + CTA + luottamuselementti mahtuvat above-fold (testaa 390×844).
- Heron jälkeen kurssivalitsin ES/FR/DE näkyy ja vaihtaa hinnan/kontekstin; valinta heijastuu sticky bottom-bariin ja seuraa scrollia.
- Kaikki user-facing suomi-copy läpäisee `humanizer` (ei em-dash, ei AI-brand-sanoja, ei rule-of-three, ei fake-väitteitä).
- Ei valehenkilö-testimoniaalia (default) eikä "sama tarkkuus kuin koe" -lupausta.
- Landing pysyy lyhyenä: syvyys "lue lisää" → /nayte, /ukk, per-kieli-sivut.
- `npm run build` ajettu; `sw.js` CACHE_VERSION bumpattu jos STATIC_ASSETS muuttuu; Playwright-render 390px + 1440px screenshotteina.
- Verify omilla tooleilla ennen valmis-julistusta.

## Out of scope (omiin loopeihin)
- Toimiva Stripe-checkout (L-STRIPE-1, vaatii luvan).
- TikTok/IG-sisältö + lead-magnet-suppilo (oma some-loop; ks. muisti `project_lara_competitor_playbook`).
- App-puolen (kirjautuneen) muutokset.
