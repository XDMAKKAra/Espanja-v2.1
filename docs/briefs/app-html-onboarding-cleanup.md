# Brief: app.html onboarding-kuonan siivous

## Konteksti
`app.html` on 2851 riviä, kaikki puhdasta HTML-markupia (CSS ja JS ovat erillisissä bundleissa, ei inline-koodia). Tiedostossa on 58 erillistä screeniä. Rivimäärä itsessään ei ole ongelma yhden tiedoston SPA:lle, mutta iso osa siitä on päällekkäisiä onboarding-versioita.

## Havainto
Tiedostossa elää neljä eri onboarding-toteutusta samaan aikaan:

- `js/screens/onboarding.js` (v1: screen-ob-welcome, -ob-goal, -ob-personalize, -ob-path) markup ~rivit 242-439
- `js/screens/onboardingV2.js` (screen-ob1-profile ... ob4-plan) markup ~rivit 919-1083
- `js/screens/onboardingV3.js` (screen-ob-v3-*) markup ~rivit 439-705
- `js/screens/onboardingV4.js` (screen-ob-v4-*) markup ~rivit 705-919 **tämä on aktiivinen**

`js/main.js` rivillä 24 on oma kommentti: "L-V399 F V2/V3 onboarding are reachable only via fallback hashes". V2 ja V3 ladataan lazyna vain fallback-hashien kautta. V4 on ainoa normaalikäytössä ajettava. v1:n moduuli (`onboarding.js`) sisältää myös jaettuja apufunktioita (`checkOnboarding`, `hideAppCountdown`, `maybeShowFirstCelebration`, `showPathFromPlacement`), joita muut screenit importtaavat eli sitä EI voi poistaa kokonaan, vaikka sen omat onboarding-ruudut olisivatkin kuolleita.

Yhteensä noin 430-840 riviä markupia on käytännössä kuollutta tai fallback-only-koodia.

## Tehtävä
1. Selvitä mitkä fallback-hashit (`#...`) oikeasti reitittävät V1/V2/V3 onboardingiin. Tarkista `js/main.js` lazy-screen -määrittelyt (rivit ~182-195) ja hash-routing.
2. Arvioi voiko V2- ja V3-onboardingin markupin + moduulit (`onboardingV2.js`, `onboardingV3.js`) poistaa turvallisesti ilman että mikään reachable-polku hajoaa.
3. Tarkista V1:n osalta: poista vain kuolleet onboarding-RUUDUT (ob-welcome/goal/personalize/path), mutta SÄILYTÄ `onboarding.js`:n jaetut apufunktiot joita auth.js, dashboard.js, placement.js ja vocab.js importtaavat.
4. Jos turvallista, poista kuollut markup app.html:stä ja vastaavat dead-code-moduulit.

## Acceptance criteria
- V4-onboarding toimii edelleen täysin (uusi käyttäjä pääsee läpi alusta loppuun).
- Mikään `onboarding.js`:stä importattu apufunktio ei jää määrittelemättömäksi (auth/dashboard/placement/vocab eivät hajoa).
- Jos jokin fallback-hash oikeasti johtaa V2/V3:een ja sitä halutaan pitää, älä poista sitä raportoi sen sijaan.
- `npm run build` ajettu, ei console-virheitä latauksessa.
- Älä poista mitään ilman että olet ensin todentanut sen olevan unreachable.

## Skill-stack
FRONTEND-M + TESTING-M (jos lisäät smoke-spec:n onboarding-flowlle)

## Riski
Keskisuuri. Jaetut importit V1:stä ovat sudenkuoppa älä poista koko `onboarding.js`-moduulia. Verifioi reachability ennen poistoa, älä luota pelkkään grep-osumamäärään.
