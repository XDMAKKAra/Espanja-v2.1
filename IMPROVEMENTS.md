# Puheo Improvements, aktiivinen ledger

Vain viimeisten ~10 loopin tiivistelmät, **uusin ylimpänä**. Yksi rivi per loop (`- YYYY-MM-DD L-VXXX: <yksi virke>`).
Vanhempi bracket-historia: `IMPROVEMENTS-archive.md`. Pre-audit-historia: `docs/archive/IMPROVEMENTS_PRE_AUDIT.md`. Tarkka muutoshistoria: `git log`.

- 2026-06-13 L-V414: tehtäväsisällön lopputarkastus Vaihe 0 — 889 saksan/ranskan gap_fill oli rikki tuotannossa (`___`-syntaksi, frontti parsii vain `{N}`), konvertoitu; 38 saksan Konjunktiv-gap uudelleenjäsennetty, 41 mc-duplikaattia + 12 gap-mismatchia + 3 match-skeemaa + 1 vastausavain korjattu; validaattori kovetettu (P0 2052→0). Semanttinen vastausavain-pass lykätty.
- 2026-06-12 L-V413: appi-redesign neljässä lohkossa: register-first auth (nimi-kenttä korjasi rikkinäisen register-tabin), digikirja-lukijan viimeistely (keskitetty palsta, zebra-taulukot, vihreä valmis-tila), kirjoitusvalitsin radio-korteiksi + chipeiksi ja sivupalkista kurssirunko pois (writing+exam), koesimulaation warm-paper-restyle.
- 2026-06-10 L-V412: landing v2 demoista tuotantoon (etusivu + es/fr/de abikurssisivut + /nayte) warm-paper-designilla; Caveat self-hostattu, pistehaarukat korjattu YTL-skaalalle (lyhyt 0–33), demo-grade-widget pudotettu etusivulta (päätös auki).
- 2026-06-09 L-V411: kertaussessio surface (b) + Vaihe D focus-session pankki-haku; adaptiivinen capture/resurface porttaus live-polkuun (digikirja); arkkitehtuurilöytö: capture meni väärään lesson-systeemiin (legacy lessonRunner, ei digikirja).
- 2026-06-08 L-V410: adaptiivinen Vaihe 1 CAPTURE (lessonRunner-virheet → sr_cards + user_mistakes), korjasi myös completion-kielen (leimattiin aina es).
- 2026-06-08 L-V409: oppimispolun kurssilukko / ostolukko shipattu.
- 2026-06-08 L-V408: kartoitus muutettiin fullscreen-portaaliksi (kartoitus-active CSS-luokka piilottaa topbar/sidebar/mobile-nav/profiilivalikko), flow intro+kielivalinta → taustakysymykset → tiertarjous → tili, taso-arvio irrotettu flowsta (koodi säilytetty), vaihenumerointi 1-3/3.
