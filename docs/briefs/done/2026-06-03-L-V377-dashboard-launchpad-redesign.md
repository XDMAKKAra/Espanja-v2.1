# L-V377 — Dashboard (Koti) launchpad-redesign + tier-erot

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — eka näkymä app-puolella, council-vetoinen.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer`
**Malli:** **Opus** (design + tuotepäätökset). Streak/daily-goal-datalogiikka voi olla Sonnet-subagentti.
**Huom:** tämä on app-puolen muutos, ERILLÄÄN Tailwind-migraatiosta. Käytä app:n olemassa olevaa CSS:ää, ÄLÄ tuo Tailwindiä app.html:ään.

---

## Konteksti (council 2026-06-03)
Koti on eka näkymä kirjautumisen jälkeen. Nykyinen näyttää nollia ("0/10 · 0 % hallussa") ja 3 päällekkäistä korttia = lannistaa + valinnan halvaannus. Tavoite: launchpad joka vastaa 2 sekunnissa "mikä on yksi juttuni nyt" ja saa palaamaan päivittäin.

## Tehtävät
1. **Tapa nolla-tila.** Poista "0/10 · 0 % hallussa" -tervehdys. Uudelle käyttäjälle eteenpäin-kehys ("Päivä 1 / aloita tästä"), ei tyhjää mittaria. Nollia ei näytetä koskaan tervehdyksenä.
2. **Yksi dominoiva "Jatka"-nappi** joka vie SUORAAN seuraavaan adaptiiviseen tehtävään (yksi tap, ei valikkoa). Poista hero-kortin + action-korttien päällekkäisyys (jatka polkua näkyy nyt kahdesti). Toissijaiset toiminnot saavat jäädä pienemmiksi linkeiksi alle.
3. **Streak-laskuri** näkyviin (esim. oikea ylä): "X päivää putkeen". Datalogiikka: `last_active` + `streak_count` (Supabase), päivittyy session yhteydessä. Loss aversion = päivittäisen avaamisen ydin tälle ikäryhmälle.
4. **Päivätavoite** completable-muodossa: "Tänään: 3 tehtävää, ~8 min" + rengas joka täyttyy ja nollautuu päivittäin. Suoritettava = dopamiini, toisin kuin elinikäinen nollastatistiikka.
5. **Countdown henkilökohtaiseksi:** "117 päivää — tällä tahdilla: [arvio]". Käytä projisoitua YO-arvosanaa jos data riittää (YTL-moottori on uniikki etu); jos ei, sido tahtiin ("~4 aihetta/vko vie maaliin"). Ei irrallista ahdistuslukua.
6. **Tier-erot — YKSI elementti each, EI kolmea eri näkymää:**
   - **Free:** kun päivätavoite täyttyy → pehmeä seinä "Huominen aukeaa Prossa" + sumennettu arvosana-arvio ("arviomme M–E, avaa tarkka"). Konversio tyytyväisyyden huipulla.
   - **Pro:** streak + päivätavoite + countdown = retention, ei seinää.
   - **Kurssi:** päivätavoite-rengas → kurssietenemä ("Kurssi 3/8").
   Tunnista käyttäjän tier olemassa olevasta middlewarestä (isPro/softProGate).
7. **Poista ruma lakki** path-journey-kuvituksesta (oppimispolku-kortti + oppimispolku-näkymä). Lakki on hylätty 3x; design-pivot sanoo screenshotit > kuvitukset. ÄLÄ piirrä lakkia 4. kertaa — poista glyph tai korvaa neutraalilla (esim. lippu/maali-piste). Ks. muisti [[project_design_pivot_tailwind_screenshots]].

## COPY
Kaikki uusi suomi humanizer-clean (ei em-dashia, ei keksittyjä lukuja/arvosanoja jos data ei tue, ei rule-of-three).

## Acceptance
- Ei "0 / 0 %" -tervehdystä; uudelle käyttäjälle motivoiva eteenpäin-kehys.
- Yksi "Jatka" vie suoraan tehtävään; ei päällekkäisiä jatka-kortteja.
- Streak + päivätavoite näkyvät ja päivittyvät oikein (verifioi testitilillä).
- Tier-erot toimivat (Free näkee seinän+arvio-teaserin, Pro ei, Kurssi näkee kurssietenemän).
- Ruma lakki poistettu kaikkialta.
- Ei AI-slopia. `node --check` muutetuille js/screens/*. Playwright: Koti renderöi + Jatka-nappi vie tehtävään, molemmat tilit.
- ÄLÄ pushaa/committaa.

## Ulkopuolella
Push/email-muistutukset (erillinen retention-loop-työ, council mainitsi — ei tässä). Onboarding. Muut näkymät.
