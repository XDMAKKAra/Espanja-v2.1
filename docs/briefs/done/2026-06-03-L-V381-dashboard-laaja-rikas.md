# L-V381 — Dashboard LAAJA + rikas (peru V377:n yli-minimalismi)

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — eka kirjautunut näkymä, nyt liian tyhjä/tylsä.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer`
**Malli:** **Opus** (sommittelu + tuotepäätökset). Data-logiikka (plan/pace/streak) → Sonnet-subagentti.
**Huom:** app-puoli, erillään Tailwind-migraatiosta. PYHÄ RAJA: ei `js/**`-logiikan rikkomista paitsi mitä dashboard-data vaatii.

---

## Konteksti
V377 typisti dashboardin liikaa (council "tapa nollat, yksi Jatka" vietiin minimalismiin). Lopputulos on **liian tyhjä ja tylsä**. Marcel: tämä on ~toka eka asia uusi käyttäjä näkee → **sen pitää olla LAAJA ja pistää silmään**, ei barren yhden napin sivu. Tavoite: rikas, henkilökohtainen, motivoiva "komentokeskus" oman YO-valmistautumisen ympärille.

## Suunta (EI minimalismi)
Säilytä V377:n hyvät palaset:
- Ei lannistavia nollia (eteenpäin-kehys).
- Yksi selvä ensisijainen "Jatka" (seuraava tehtävä valmiina).
- Streak, projisoitu arvosana ("tällä tahdilla: E").

Mutta **lisää substanssia** niin että sivu on täysi ja elävä. Alla KANDIDAATTI-elementtejä — **nämä ovat illustraatioita suunnasta, EIVÄT pakollinen checklist.** Valitse + sommittele itse rikas, eheä layout (ei tyhjää ammottavaa, ei toisaalta slop-täytettä):
- **Opiskelusuunnitelma + tahti:** "Tavoite M · tällä tahdilla E · ota ~X aihetta/vko kiriäksesi." Näytä **kuinka myöhässä/edellä** käyttäjä on suunnitelmasta (Marcelin esimerkki — laajenna tästä koko plan/pace-näkymäksi).
- **Päivän tavoite** (rengas joka täyttyy): tehtävät/min tänään + onko tehty.
- **Kolme moodia OIKEALLA painolla:** oppimispolku, YO-koeharjoitus, JA **kirjoittaminen** — kirjoitus EI saa olla mitätön tekstilinkki (Marcel valitti). Anna sille oikea kortti, esim. "Päivän kirjoitustehtävä" -teaser.
- **Kertaa tänään / heikot kohdat:** spaced-repetition due-aiheet ("kertaa: 3 sanaa, 1 kielioppi").
- **Aktiivisuus:** streak näkyvästi + mahd. viikkokalenteri/heatmap.
- **Viimeisin tulos / palaute-snippetti.**
- **YO-countdown** henkilökohtaisena (on jo).
- **Profiili-tyyppistä dataa dashboardille** (Marcel: osa "oma profiili" -sisällöstä sopisi tähän) — taso/edistymä/tavoite glanceable.
- **Kurssietenemä** rikkaampana visuaalina (Kurssi 1/8) Kurssi-käyttäjille.

## Tier-erot (substantiaaliset, ei yksi rivi)
- **Kurssi** (Marcelin tila): kurssietenemä + suunnitelma painottuen, mutta kirjoitus + muut moodit silti näkyvissä.
- **Pro:** koko paketti (streak, plan/pace, kaikki moodit, trajectory).
- **Free:** rikas mutta konversio-nudget (esim. lukitut elementit teaserina).

## Periaate
Rikas = MERKITYKSELLISTÄ, motivoivaa, glanceable sisältöä joka tekee sivusta elävän ja henkilökohtaisen. EI tyhjä, EI demotivoivat nollat, EI slop-täyte (ei 4 identtistä korttia, ei keksittyjä lukuja). Ajattele "oman valmistautumisen komentokeskus" jonka avaa mielellään joka päivä.

## COPY
Suomi humanizer-clean.

## Acceptance
- Dashboard on selvästi LAAJEMPI ja täydempi kuin V377; ei ammottavaa tyhjää desktopilla.
- Kirjoittaminen näkyy oikealla painolla (ei tekstilinkkinä).
- Plan/pace ("kuinka myöhässä") + päivän tavoite näkyvät ja päivittyvät oikein.
- Ei lannistavia nollia; yksi selvä Jatka säilyy.
- Tier-erot toimivat (Kurssi/Pro/Free).
- Ei vaakavieritystä 390px; `node --check`; Playwright Koti renderöi + Jatka toimii. Screenshot 1440px+390px → `screenshots/`.
- ÄLÄ pushaa/committaa.

## Ulkopuolella
Tailwind-migraatio. Landing (V380).
