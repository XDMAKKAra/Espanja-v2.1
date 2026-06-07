# L-V379 — Oppituntien kirjoitustehtävät: max-pisteet, merkkimitta, ei YO-arvosanaa (paitsi YO-tehtävät)

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — väärä/harhaanjohtava arviointi oppitunneissa.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-M + grading → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer`, `superpowers:verification-before-completion`. (Jos kosket arviointilogiikkaan → harkitse `criterion-referenced-rubric-generator`.)
**Malli:** **Opus** (arviointilogiikka + UI). Lue `lib/writingGrading.js` + kirjoitusnäkymä ensin.
**Huom:** app-puolen muutos, erillään Tailwind-migraatiosta.

---

## Konteksti (Marcel 2026-06-03)
Oppituntien sisällä on kirjoitustehtäviä jotka EIVÄT ole YO-tason kirjoitustehtäviä, mutta ne esitetään YO-tehtävinä (YO-arvosana, sanamitta). Tämä on harhaanjohtavaa. Erottele tavalliset oppitunti-kirjoitustehtävät YO-tehtävistä.

## Tehtävät (oppitunti-kirjoitustehtäville, EI varsinaisille YO-tehtäville)
1. **Näytä maksimipistemäärä etukäteen** (ennen kirjoittamista), esim. "0 / 20". Oppilas tietää mihin pyrkii.
2. **Sanamitta → merkkimitta.** Vaihda "X sanaa" -mittari merkkimääräksi (kuten oikeassa kirjoitustehtävässä; YTL laskee merkkejä). Lue nykyinen mittari kirjoitusnäkymästä ja vaihda merkkilaskuriin.
3. **Poista YO-arvosana** (I/A/B/C/M/E/L) näistä tavallisista oppitunti-tehtävistä. Näytä pelkkä pistemäärä (esim. 14/20). **POIKKEUS:** jos tehtävä on käytännössä oikea YO-tehtävä (esim. kurssin YO-tyyppinen lopputehtävä), arvosana saa jäädä.
4. **Arviointi silti YO-kriteereillä:** vaikka arvosanaa ei näytetä, AI arvioi YTL-rubriikin osa-alueilla (viestinnällisyys, kielen rakenteet, sanasto, kokonaisuus), mutta ei kerro niitä eli arvio tapahtuu niiden mukaan sitten antaa antaa pisteet esim tehtävä on 20 p nii pisteet vain 0-20p Ei erikseen viestinnällisyys, rakenteet yms + sanallisen palautteen. Palaute-flow säilyy (nimellä, positiivinen ensin — ks. `lib/writingGrading.js` humaani-palaute).

## Erottelu
Selvitä miten tehtävä-data merkitsee "YO-tehtävä" vs "tavallinen oppitunti-kirjoitustehtävä" (data/courses/ tai tehtävä-tyyppi). Jos lippua ei ole, lisää selkeä tyyppi-kenttä. Pisteytys/UI haarautuu tämän mukaan.

## Acceptance
- Tavallinen oppitunti-kirjoitustehtävä: max-pisteet näkyvät etukäteen, merkkilaskuri (ei sanalaskuri), EI YO-arvosanaa, mutta YO-kriteeri-pisteet + sanallinen palaute näkyvät tuloksessa.
- YO-tyyppinen tehtävä: arvosana saa jäädä.
- Arviointi käyttää YTL-rubriikkia molemmissa.
- `node --check`, vitest vihreä (arviointi-testit), Playwright kirjoitustehtävän flow.
- ÄLÄ pushaa/committaa.

## Ulkopuolella
Itse YO-koe-simulaatio. Arviointimoottorin tarkkuus (lukittu pistehaarukka-reframe, ks. muisti).
