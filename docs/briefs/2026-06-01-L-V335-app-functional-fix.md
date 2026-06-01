# BRIEF: L-V335 — App functional fix (rikki ennen rumaa)

**Päivä:** 2026-06-01
**Status:** Ship-brief. Pelkät trust-rikkojat, ei design-loopia.
**Trigger:** Marcel kävi kirjautuneen appin läpi 2026-06-01 (14 screenshotia). Slop-sweepit V331/V334 koskivat vain landingia — app-shell jäi koskematta. Tämä brief korjaa toiminnalliset bugit; visuaalinen sweep on erillinen L-V336.
**Skill-stack:** FRONTEND-M + TESTING-M → `frontend-design`, `ui-ux-pro-max`, `webapp-testing`, `humanizer` (näkyvät tekstit), `superpowers:verification-before-completion`

---

## Mitä korjataan (5 bugia)

### 1. Koti-näkymän kategoriarivit pois kokonaan
Koti (kuva 6) listaa "Sanasto / Kielioppi / Luetun ymmärtäminen / Kirjoitustehtävä / Koeharjoitus" omina riveinään, jotka lupaavat "5 harjoitusta" jne. mutta klikkaus vie kaikki samaan `oppimispolku`-näkymään. Harhaanjohtava ja rikki.

**Marcel päätti 2026-06-01: poista rivit kokonaan.** Koti = tervehdys + "Avaa oppimispolku" -CTA + viimeisin kurssi. Ei kategoriarivejä. Tämä on mode-first-hierarkian mukainen (koti ei ole kategoriaselain, oppimispolku on).

Etsi koti-näkymän renderöinti (todennäköisesti `js/screens/home.js` tai vastaava) ja poista kategoriarivi-lohko. Jätä tervehdys + CTA + viimeisin-kurssi-kortti.

### 2. "Avautuu pian" -placeholder pois tuotannosta
Kuva 12: tehtävätyyppi "Yhdistä: pronomini ja muoto" näyttää kortin tekstillä "Tämä tehtävätyyppi avautuu pian. Voit jatkaa muista vaiheista sivuvalikosta." Tämä on CLAUDE.md:n kielletyllä listalla (coming-soon tuotannossa).

**Ratkaisu:** jos tehtävätyyppi (yhdistämistehtävä) ei ole toteutettu, **piilota se kokonaan sivuvalikosta ja navigaatiosta** — älä näytä kuollutta vaihetta. Jos se on helppo renderöidä olemassa olevalla datalla, toteuta. Writer päättää kumpi on pienempi diff, mutta tuotantoon ei jää "avautuu pian" -tekstiä missään tehtävätyypissä. Greppaa "avautuu pian" + "coming soon" + "tulossa" koko `js/`-puusta ja siivoa kaikki osumat.

### 3. Merkityksetön "0 / 0" -laskuri pois
Kuvat 13, 14: tehtävänäkymässä näkyy "0 / 0" oikeassa yläkulmassa. Jos pistemäärää ei ole vielä (tehtävä kesken / ei pisteytettävä), älä renderöi laskuria lainkaan — älä näytä "0 / 0". Näytä laskuri vain kun max > 0.

### 4. Stray-laatikot vasemmassa reunassa
Kuvat 6, 14: vaaleanpunainen/brick tyhjä laatikko leijuu vasemmassa reunassa (todennäköisesti sidebar-skeleton tai collapsed-rail -jäänne joka ei piiloudu oikein). Etsi ja korjaa: tyhjän elementin ei pidä näkyä. Tarkista sekä koti- että tehtävänäkymä.

### 5. Vanha logo lukija-shellissä
Kuva 9: lukija-näkymän header näyttää vanhan "Puheo"-wordmarkin punaisella o-pisteellä. Tämä on V318b-lockupissa tapettu ornamentti. Vaihda lukija-shellin logo nykyiseen `.brand-wordmark`-CSS-tekstiin (sama kuin V318e teki muille pinnoille). Greppaa kaikki paikat joissa renderöidään vanha `Puhe<span>o</span>` punaisella pisteellä ja yhdenmukaista.

---

## Acceptance criteria
1. Koti-näkymässä ei ole kategoriarivejä; vain tervehdys + Avaa oppimispolku + viimeisin kurssi
2. Missään tehtävätyypissä ei lue "avautuu pian" / "coming soon" / "tulossa" (grep-puhdas)
3. "0 / 0" -laskuri ei renderöidy kun max-pisteet = 0
4. Ei tyhjiä stray-laatikoita koti- eikä tehtävänäkymässä (mobile + desktop)
5. Lukija-shellin logo = nykyinen wordmark, ei vanhaa o-piste-versiota
6. `npm run test:bug-scan` PASS, brand-e2e PASS
7. Uusi/päivitetty Playwright-spec kattaa: koti ei näytä kategoriarivejä, navigaatiossa ei coming-soon-vaiheita
8. `npm run build` ajettu, `sw.js` CACHE_VERSION bumpattu jos JS/CSS muuttui

## Out-of-scope
- Font/eyebrow-slop (= L-V336)
- Empty-state-redesign, oppimispolku-listan elävöitys (= L-V336)
- Pricing-kortit (= L-V337)
- Uusi yhdistämistehtävä-toiminnallisuus jos se vaatii uuden tehtävämoottorin (piilota sen sijaan)
