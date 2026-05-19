# Next session prompt — paste this verbatim into a fresh session

---

Olet jatkamassa Puheo-projektia. Edellisen istunnon aikana 2026-05-19
shippattiin PR #118–#128 (Otava Fokus 7 -rebuild PR1–PR8, Supabase-sync,
multi-lang bleed-fix + layout/wordbank fix). Toimii teknisesti — 12/12
e2e läpi — mutta **näyttää edelleen paskalta visuaalisesti**.

Tämä prompt kuvaa mitä on auki ja mikä on prioriteetti.

## Lue ENSIN nämä

1. `memory/MEMORY.md` — käy läpi feedback-* + project-* tiedostot.
   Erityisen tärkeät:
   - `project_digikirja_layout_open` (uusi, tästä istunnosta)
   - `project_mode_first_hierarchy`
   - `feedback_design_direction_eduix_old_spain`
   - `feedback_user_does_not_code`, `feedback_auto_push_workflow`,
     `feedback_skip_measurement_gates`
2. CLAUDE.md — skill-stack pakollinen
3. Tämän tiedoston P0/P1-listat

---

## P0 — Näkyvät bugit jotka pitää korjata HETI

### 1. Double-sidebar visuaalinen ongelma

Kun käyttäjä on lesson-näytössä (`#/oppitunti/{lang}/{kurssi}/{n}/{sivu}`),
vasemmalla näkyy YHTÄAIKAA kaksi sivupalkkia:

- Vanha `.app-sidebar` (Puheo-logo + Aloitus + Asetukset + Kirjaudu ulos)
  vie ~220px viewportin vasemmasta reunasta
- Digikirjan oma SideMenu (Sisällys + numeroidut sivut) vie ~290px sen
  oikealla puolella

Yhteensä ~510px sivupalkkia ennen kuin pääsisältö alkaa. Otava-mallin
tarkoitus oli että lesson-näyttö on **full-bleed**: TopBar yläreunassa
spans 100% leveys, vasemmalla VAIN digikirja-SideMenu, oikealla sisältö.

**Päätös tarvitaan:**

- **A)** Piilota `.app-sidebar` kun `screen-digikirja` on aktiivi
  (`body:has(#screen-digikirja.active) .app-sidebar { display: none }`
  tai JS-toggle screenchange-eventissä). Suosittelen tätä.
- **B)** Siirrä digikirja TAKAISIN `.app-main`:n ulkopuolelle, anna
  sille `position: fixed; inset: 0; z-index: ...` joka peittää kaiken
- **C)** Hybridi: jätä `.app-sidebar` mutta digikirjan SideMenu siirtyy
  yläosaan kollapsoituvaksi mobile-style -valikoksi

### 2. Pääsisältö liian kapea

`.dk__exercise` ja `.dk__content` ovat `max-width: 68ch` (~720px). Kun
viewport on 1920px ja sidebarit syövät 510px, oikealle jää massiivinen
~700px tyhjä cream-alue. Otava käyttää 60ch:tä koska heidän kirjapaperin
leveys on ~14cm fyysisesti — meidän tarvii laajempi koska screen on
useimmiten laajempi kuin kirja.

**Korjaus:**

- `.dk__content max-width` → `clamp(720px, 60vw, 1080px)`
- `.dk__exercise max-width` → samoin
- `.dk__bilingual max-width` → samoin
- `.dk__teoria-p max-width` → pidetään 65ch luettavuuden takia

### 3. TopBar otsikko kropattu

Otsikko "Perhe ja kansallisuudet" leikkautuu "Perhe ja kansallisu..."
kun breadcrumb + tools vievät tilaa. `.dk__topbar` on
`grid-template-columns: auto 1fr auto` ja otsikko on keskimmäisessä
sarakkeessa, mutta breadcrumb venyy ja syö tilaa.

**Korjaus:**

- Joko: vähennä breadcrumb fonttikokoa (12px → 11px) + tighter spacing
- Tai: vie otsikko OMAlle riville TopBarin alle (kaksi-rivinen TopBar
  jossa breadcrumb yhdellä rivillä + otsikko + tools toisella)
- Tai: tee otsikosta ellipsis + tooltip jos overflow

### 4. Prev/Next yläreunassa näyttää irralliselta

Yläreunan Prev/Next-laatikko (`.dk__prevnext--top`) renderöityy ENNEN
sivun otsikkoa. Näyttää leijuvalta ohuelta laatikolta joka EI yhdistä
visuaalisesti TopBariin eikä sisältöön.

**Suositukseni:** Poista yläreunan PrevNext kokonaan. Bottom riittää
opiskelijan navigaatioon, ja säästät vertikaalista tilaa otsikolle.

---

## P1 — Pienempiä parannuksia

### 5. Aloitus-näyttö renderöi tyhjää localhostissa

Kun käyttäjä klikkaa Aloitus localhostissa (auth-token paikallaan),
näkyy vain cream-ruutu. Scrollaamalla alas näkyy digikirja jos URL
oli aiemmin lesson-hashissa. Syy: `home.js loadHome()` epäonnistuu
hiljaa kun `/api/dashboard/v2` palauttaa 400.

**Korjaus:** `loadHome()` catch-haara renderöi virhetilan
("Etusivun lataus epäonnistui — yritä uudelleen") sen sijaan että
jättää `#home-root` tyhjäksi.

### 6. Vercel-tuotanto edelleen vanhalla buildillä

`espanja-v2-1.vercel.app` näyttää viime kuun buildia. Promote-prompttiin
tuli "api-deployments-free-per-day" -kiintiövirhe 2026-05-19 illalla.

**Käyttäjän klikattava:** Avaa
https://vercel.com/xdmakkaras-projects/espanja-v2-1/deployments → ylin
`main`-deploy → ⋯-valikko → "Promote to Production". Kiintiö palautuu
24h kuluessa joten tämä voidaan tehdä huomenna 2026-05-20.

**Pysyvämpi korjaus:** Kytke Vercel-asetuksissa auto-deploy
`main`-haaralle tuotantoon päälle:
https://vercel.com/xdmakkaras-projects/espanja-v2-1/settings/git

### 7. Sisältöä ei vielä kirjoiteta uudelleen

`LANG_CURRICULA.*` placeholder-otsikot ("Kuka olen", generic phase
names) odottavat 3 rinnakkaisen sonnet-sub-agentin -kirjoitusta
(es/fr/de) joka tuottaa Otava-tyylisiä otsikoita ja oppituntien runkoa.
Ei tehty vielä. ~$5 OpenAI-budjetti, wall ~30 min. Käyttäjä on
hyväksynyt suunnan mutta ei ole pyytänyt ajamaan.

### 8. Itsearvio + progress sync hiljaisesti epäonnistuu localhostissa

PR7b/8b backend lähettää localStorage-pohjalta `/api/digikirja/*`
-routeille, mutta routet vaativat Supabase JWT:n. Localhostin
testikäyttäjälle saattaa tulla 401 hiljaa (catch swallow), joten
UI toimii edelleen mutta server ei näe muutoksia. Voit varmistaa
ajalleen Network-tabista: pitääkö nähdä `200 OK` POST-vasteet.

---

## Säännöt koko sessiolle

- **Anti-AI-slop checklist** ennen ekaa Write:ia
- **Auto-push workflow**: `auto/<slug>` branch → `gh pr create --fill` →
  `gh pr merge --squash --delete-branch --admin`
- **Bump sw.js cache** kaikilla STATIC_ASSETS-muutoksilla
- **node --check** ennen committia
- **Skill-stack pakollinen** ennen Write/Edit/Bash kutsuja (CLAUDE.md
  + hook injektoi tämän jokaiseen viestiin)
- **Käyttäjä ei koodaa** — älä pyydä lue/kirjoita-komentoja
- **Skip per-step measurement gates** — chain queue, käyttäjä lukee
  ledgerin lopussa
- **Humanizer** kaikkeen suomenkieliseen UI-tekstiin

## Suositeltu järjestys istunnolle

1. Lue muistit + tämä prompt
2. **Yksi PR kaikkiin P0-asioihin** (#1 double-sidebar, #2 max-width,
   #3 title cropping, #4 poista yläreunan PrevNext). Pidä scope yhdessä
   koska kaikki ovat saman lesson-näytön visuaalia.
3. Screenshot vertaa ennen/jälkeen → SendUserFile, näytä käyttäjälle
4. Kysy käyttäjältä haluaako jatkaa P1:een vai tarkistaa P0:n erikseen
5. P1-listalta käsitellään yksi kerrallaan käyttäjän priorisoinnin
   mukaan

---

## Ledgeri — mitä shippiin 2026-05-19

| PR  | Mitä           |
|-----|----------------|
| #118 | P0 fixes (Asetukset race + sidebar hairline + flicker) |
| #119 | Digikirja PR1 (3-paneelinen pohjarakenne) |
| #120 | PR2 (real lesson JSON + Teoriasivu/BilingualTable/Obs!) |
| #121 | PR3 (sivu-tyyppi-SVG-glyphit + scroll-to-active) |
| #122 | PR4 (ExerciseCard mc/typed/gap_fill/translate) |
| #123 | PR5 (Flashcard pack + localStorage state) |
| #124 | PR6 (summative Testi sivut) |
| #125 | PR7 (Itsearviointi lomake) |
| #126 | PR8 (progress chip + legacy redirect) |
| #127 | Supabase sync (migr 038-040) + multi-lang bleed |
| #128 | Full-bleed layout + wordbank chips clickable |

12 e2e-testiä `tests/e2e-digikirja-smoke.spec.js`:ssä — kaikki läpi.
SW cache `puheo-v215 → puheo-v226`.

Supabase-migraatiot ajettu MCP:llä:
- `038_create_user_self_assessments`
- `039_create_user_lesson_progress`
- `040_add_lang_to_user_curriculum_progress`

RLS päällä kaikilla, omistaja-vain -policyt.

---

**Käyttäjän viimeinen kommentti 2026-05-20 00:42:** "kuten nyt kuvasta
näät ei näytä yhtään hyvältä". Eli vaikka tekniikka toimii, visuaalinen
viimeistely on auki. P0-lista yllä on minimi siisteen ilmeen
saamiseksi.
