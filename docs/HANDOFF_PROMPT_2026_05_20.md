# Handoff prompt — Puheo App debug & polish

## Konteksti

Olet jatkamassa Puheo-projektia (Spanish/French/German YO-koe -valmennusalusta lukiolaisille, suomeksi). Edellinen agentti turhautti käyttäjän pahasti useilla kierroksilla. Tämä prompt summaa missä ollaan, mihin keskitytään, ja mitä virheitä EI saa toistaa.

## Tekninen ympäristö

- Stack: Node + Express, Supabase, OpenAI, Vanilla JS frontend
- Bundle: esbuild — kaikki frontti-muutokset vaativat `npm run build`
- Devserver: `npm run dev` (port 3000)
- Branch: `auto/no-slop-loading-and-nickname` — 13 paikallista committia v233–v244, EI vielä pushattu mainiin
- Testikäyttäjä: `testpro123@gmail.com` / `Testpro123`

## Mihin keskitymme

**APPLIKAATIO-PUOLI** (`/app.html` + sen alustuotanto), ei landing-sivu. Spesifisti:

1. **Asetukset-näyttö** — pitkä lomake jonka pitäisi toimia ilman scrollia + Muokkaa-painikkeet aukaisevat modaalin oikein
2. **Digikirja-näyttö** (oppituntien lukunäyttö) — vasen rail + sisältöalue + brick-topbar
3. **Aloitus-näyttö** (kotinäyttö) — Ohjaamo-grid + mode-tiilet + vasen sidebar
4. **Onboarding** — uusi nimi- ja monikielivalinta v236:ssä

## Käyttäjän valitukset (toistuvat)

Lue nämä memory-tiedostot ENNEN kuin teet mitään:

- `~/.claude/projects/.../memory/feedback_common_frustrations.md` — tyhjä tila, rikki napit, AI-slop fontit, fake placeholder copy, cache-syyttely-anti-pattern
- `~/.claude/projects/.../memory/feedback_three_strikes_redesign.md` — saman bugin 3× raportointi → restrukturoi, ei band-aid
- `~/.claude/projects/.../memory/feedback_skill_usage_honesty.md` — älä keksi "Skills invoked"-listoja, käyttäjä tarkkailee tool-historiaa
- `~/.claude/projects/.../memory/feedback_log_every_complaint.md` — kun käyttäjä valittaa, tallenna pattern muistiin samassa turn:ssä
- `~/.claude/projects/.../memory/feedback_ai_slop_check_every_frontend.md` — slop-checklist jokaiseen frontti-muutokseen
- `~/.claude/projects/.../memory/feedback_batch_pushes_no_auto_vercel.md` — älä auto-pushaa joka pikkukorjausta
- `~/.claude/projects/.../memory/feedback_vercel_push_threshold.md` — vain isot näkyvät muutokset → tuotantoon

## Mitä virheitä edellinen agentti teki (älä toista)

1. **Cache-syyttely:** "Tee hard refresh" -vastaus toistui 5 kierroksen ajan kun käyttäjä raportoi rikki Asetukset. Oikea ratkaisu olisi ollut ajaa Playwright-test joka klikkaa Muokkaa-nappia ensimmäisen valituksen jälkeen. Vasta v244:ssä se tehtiin oikeasti — paljasti että computed CSS `position: relative` vaikka source sanoi `position: fixed`. Korjaus: `!important` overlay-säännöille.

2. **Skill-stack-teatteri:** kirjoitti "Skills invoked: a, b, c, d, e" mutta lataa vain yhden Skill-toolilla. Käyttäjä huomasi tool-historiasta ja suuttui. Vaaditaan: joko lataa kaikki oikeasti TAI kirjoita rehellisesti "Skills loaded this turn: <real>; rest applied from prior session memory".

3. **Band-aid kierre:** käyttäjä raportoi sidebarin tyhjän tilan **3+ kertaa**. Edellinen agentti korjasi yksi CSS-sääntö kerrallaan ilman että ymmärsi miksi sama bug pomppasi takaisin. .app-sidebar käytöksen jakautuminen kolmen CSS-tiedoston välillä (style.css base + off-canvas-nav.css mobile + digikirja.css :has-hide) on shakkimaton geometria — pitäisi konsolidoida yhdeksi komponentiksi data-attribuutilla.

4. **Auto-push kiusaus:** Käyttäjä huusi "ÄLÄ pushaa joka kerta" mutta agentti pushasi jokaisen committin omana PR:nä #118–#136. Sen jälkeen 13 committia (v233–v245) on jätetty paikallisesti. ÄLÄ pushaa ilman lupaa. ÄLÄ tarjoa Vercel-promote-painalluksia ilman pyyntöä.

5. **AI-slop fontit:** italic Fraunces -display-serif pieneltä UI-elementeille (chip-painikkeet, gap-input, prev/next-labels, loading-tekstit) on banattu. Käyttäjä on listannut tämän kohta-kohdalta — pelkkä CSS-bundlen muutos riittää, mutta agentti unohti monta kohtaa.

6. **Fake placeholder copy:** "Kirjoitustehtävä, tulossa PR 7" -tyyppinen sisäinen jargon näkyi UI:ssä. Korjattu v240:ssä, mutta pattern on: ÄLÄ kirjoita PR-numeroita tai PR-aikatauluja käyttäjälle näkyviin.

7. **CSS-cascade-ongelmat selvittämättä:** v243:n yritti reparent overlay → body, mutta CSS-sääntö `.settings-modal-overlay { position: fixed }` ei tepsiinyt vaan computed-tila pysyi `position: relative; z-index: 1`. Vasta v244:n `!important` ratkaisi. Tästä opetus: kun computed-tila ei vastaa source-rule:a, älä oleta — aja Playwright joka tulostaa getComputedStyle ja katso minkä rule cascade voitti.

## Vielä avoinna (käyttäjän listalla)

- **Asetukset vaatii edelleen scrollin alas** vaikka v245 yritti tiivistää padding:n. Pitää verifioida käyttäjän viewport-koolla (todennäköisesti < 800px korkea laptop)
- **Vasen .app-sidebar tyhjä tila ylhäällä/alhaalla** — käyttäjä raportoi 3+ kertaa, vaatii rakenne-tason korjauksen ei band-aid. Pitäisi yhdistää SidebarShell-komponentiksi data-mode-attribuutilla
- **"YO-tason kirjotus" / "Lauseiden rakentelua" tehtävänimet** — renamed v240–v241, mutta käyttäjä haluaa OIKEAN sentence-build-tehtävän, ei pelkkä uudelleennimeämistä
- **Kirjoitus-mode-näyttö** puuttuu kokonaan (route `/kirjoitus` ei toimi)
- **Login-välähdys** v234:ssä korjattu (sidebar paljastuu screen-vaihdon jälkeen) — verifioi vielä
- **AI-slop fontit muillakin näytöillä** — käyttäjä mainitsee toistuvasti italic-Fraunces käytön pienissä UI-elementeissä

## Säännöt joita noudatetaan

- **Skill-honesty:** käytä Skill-toolia oikeasti tai sano rehellisesti "loaded this turn: X; rest from session memory"
- **Verify before claim:** ajakaa Playwright + tulosta computed CSS / actual DOM state ENNEN kuin sanot "korjattu"
- **Älä syytä cachea** kun käyttäjä raportoi 2. tai 3. kertaa saman bugin — debug uudelleen
- **Ei push ilman lupaa**, ei Vercel-promote ilman pyyntöä
- **Tallenna jokainen valitus muistiin** (Write-tool memory-tiedostoksi) samassa turn:ssä
- **Em-dash kielletty** suomen-kielisessä UI-tekstissä
- **Italic Fraunces kielletty** pieniltä UI-elementeiltä — vain hero-otsikoissa
- **Three strikes = restrukturoi** — jos sama bugi tulee 3× → komponentin geometria on väärä, älä jatka band-aid:tä

## Lähtötilanne

Branch: `auto/no-slop-loading-and-nickname`, 13 committia paikallisesti (v233–v245). Pyytää käyttäjältä luvan ennen kuin pushaat tai mergaat. Branch sisältää:

| v | Mitä |
|---|---|
| v233 | home-loading skeleton + Kutsumanimi-asetus + lang-filter |
| v234 | oppimispolun skeleton + YO-koe countdown + login-välähdys |
| v235 | topbar-ikonit valkoiseksi |
| v236 | topbar position:fixed + onboarding nimi & monikielen valinta |
| v237 | sidemenu täysin piiloon kun suljettu |
| v238 | exercise-layout korjattu (grid → block) |
| v239 | wordbank-chip + prevnext-label sans (italic pois) |
| v240 | phase-title rewrites + "tulossa PR N" -slop pois |
| v241 | .app-sidebar 100dvh + Lauseiden rakentelua → Käännä lauseet |
| v242 | .dk__sidemenu stretch + height: calc(100dvh - 60px) |
| v243 | settings top-align + Muokkaa-overlay reparent + try/catch |
| v244 | overlay !important position:fixed (Playwright-verifioitu) |
| v245 | settings-inner padding 32→8 (tiivistys) |

## Ensimmäinen task uudelle agentille

1. Lue kaikki memory/feedback_*.md -tiedostot
2. Vahvista että v245 on käyttäjän selaimessa (ohjaa F12 → Network → Disable cache → F5)
3. Kysy käyttäjältä: "Toimiiko Asetukset nyt ilman scrollia? Aukeaako Muokkaa-modaali oikein?"
4. Jos toimii → pushaa branch + squash-merge → kysy haluaako käyttäjä Vercel-promoten
5. Jos ei toimi → aja Playwright-test käyttäjän todennäköisellä viewport-koolla (esim. 1366x768) ja näytä todellinen DOM-tila

Älä luota mihinkään aiempaan korjaukseen — verifioi jokaisen Playwrightilla.
