# Puheo design-audit — 2026-06-01

**Menetelmä:** Playwright-screenshotit localhostia vasten, landing (kirjautumaton) + 12 app-pintaa × desktop/mobiili. Login testpro123.
**Screenshotit:** `screenshots/landing-audit-2026-06-01/`, `screenshots/polish-audit-loggedin-2026-05-26/`
**Toiminnallinen tila:** 0 a11y-virhettä, 0 konsoli-/verkkovirhettä kaikilla pinnoilla → **ongelma on puhtaasti esteettinen, ei toiminnallinen.**

## Reitti-löydös (ei design)
`#/sanasto`, `#/kielioppi`, `#/kirjoittaminen`, `#/lukeminen` renderöivät Asetukset- tai Oppimispolku-sivun. Ne ovat vanhentuneita hash-reittejä (mode-first-hierarkia poisti erilliset screenit; sisältö elää lessonin/digikirjan sisällä). Todelliset pinnat: landing, koti (Aloitus), oppimispolku, lesson-runner/digikirja, asetukset, tulokset.

## Miksi tämä näyttää AI-slopilta ja tylsältä — 6 juurisyytä

1. **Monokromaattinen yhden-aksentin litteys.** Yksi brick-punainen joka ainoassa CTA:ssa, numerossa, badgessa, aksentissa. Tausta cream/valkoinen kaikkialla. Ei toissijaista väriä, ei syvyyttä, ei kuvastoa (vain puhelin-screenshotit + geneerinen Humaaans-hahmo). Nollavisuaalinen rytmi.

2. **Ylisuuret mustat geometric-sans-otsikot.** "Hei. Jatka oppimispolulla.", "Oppimispolku" jättimäisenä bold-mustana sansina. Tämä on kirjaimellisesti design-skillin "NO Oversized H1s" + geneerinen-sans-tell. Ei typografista persoonaa, ei editorial-kontrastia. Hierarkia tehdään pelkällä koolla, ei painolla/värillä/fontti-valinnalla.

3. **Barren dashboard (pahin).** Koti (Aloitus) on ~60 % tyhjää valkoista: yksi otsikko, yksi nappi, "1 päivän putki", sitten valtava tyhjä alue. Ei edistymis-visualisointia, ei seuraava-oppitunti-korttia, ei koepäivä-countdownia, ei heikkoustopikkeja, ei dataa. Näyttää keskeneräiseltä/rikkinäiseltä.

4. **Keskitetty, symmetrinen, tasavälinen kaikki.** Landing = pystypino keskitettyjä sektioita. Hero = symmetrinen kaksi-puhelinta-tekstin-ympärillä -template. Ei asymmetriaa, ei ankkuria, ei yllätystä. Tämä on "tylsä" konkreettisesti.

5. **Kortti-ähky + ohuet harmaat reunat.** Asetukset, hinnoittelu, proof = valkoisia bordattuja kortteja creamilla. Geneerinen SaaS-look.

6. **Vanhentunut sisältö landingilla:** hinnoittelu näyttää yhä Free / Mestari 19€ / Treeni 9€ — ristiriidassa lukitun **kurssi 49€ kertaostos** -päätöksen kanssa (2026-06-01).

## Per-pinta

| Pinta | Tila | Pääongelma |
|---|---|---|
| Landing hero | symmetrinen, keskitetty | kaksi-puhelinta-template, monokromi, ei ankkuria |
| Landing full | pitkä keskitetty pino | nollarytmi, stale-hinnoittelu, Humaaans-slop |
| Koti (Aloitus) | ~60 % tyhjä | ei dashboardia, näyttää rikkinäiseltä |
| Oppimispolku | toimii, litteä | "Avautuu vuorollaan" ×8 fragmenttina, ei progress-visualia |
| Asetukset | toimii | kortti-ähky, geneerinen |
| Lesson/digikirja | (V336 siivous tehty) | tarkistettava erikseen |

## Johtopäätös
Nykyinen design-systeemi (cream + yksi brick-aksentti + General Sans/Manrope -tyyppinen geometric sans + ylisuuret otsikot + keskitetyt kortit) on koherentti mutta yksitoikkoinen ja matalaenerginen. Inkrementaalifix ei riitä — Marcel pyytää ISO MUUTOS. Tarvitaan uusi visuaalinen suunta: distinktiivinen typografia, rikkaampi paletti (toinen aksentti + syvyys), asymmetria, ja oikea data-dashboard tyhjän kodin tilalle.
