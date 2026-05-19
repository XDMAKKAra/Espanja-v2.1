# Next session prompt — paste this verbatim

---

Olet jatkamassa Puheo-projektia (espanjan/ranskan/saksan lyhyt-oppimäärän
YO-koevalmennus). Edellinen istunto teki ison arkkitehtuuri-pivot:in
**mode-first**-hierarkiaan PRs #109–#114. Repo on puhdas mainissa.

## Lue ENSIN nämä kontekstit

1. `memory/MEMORY.md` — käy läpi feedback-* ja project-* tiedostot.
   Erityisen tärkeät:
   - `project_mode_first_hierarchy.md` — nykyinen flow HOME → mode-cards →
     oppimispolku-index → course-detail → lesson, plus deprecoidut
     screen-path + courseOverview
   - `feedback_design_direction_eduix_old_spain.md` — Eduix/Mafy/Otava
     functional patterns + Old-Spain palette. **Anti-AI-slop checklist on
     pakollinen ennen UI-shipa.**
   - `project_open_issues_2026_05_19.md` — P0+P1 lista; pick from here
   - `feedback_user_does_not_code.md`, `feedback_auto_push_workflow.md`,
     `feedback_skip_measurement_gates.md`, `feedback_humanizer_required.md`
2. `docs/superpowers/specs/2026-05-19-mode-first-hierarchy-design.md` —
   suunnittelu-spec joka ajoi PR #109–#114
3. CLAUDE.md (root + ~/.claude/) — skill-stack on PAKOLLINEN ennen
   Write/Edit/Bash-kutsuja. FRONTEND-stack vie kohti AI-slopia jos sitä ei
   lataa.

## Ohjelmasi (priority order)

### P0 — Bugit jotka pitää selvittää ENSIN

**1. Asetukset + Oma profiili eivät avaudu sidebar-klikkauksesta.**
Pyydä käyttäjältä browser devtools console -screenshot kun klikkaa
"Asetukset" tai sidebar-user-painiketta. Diagnosoi sieltä:
- Tuleeko `navigateTo("settings")`-haaraan?
- Failaako lazyScreen import (network-tab näyttää 404 chunkille)?
- Throwaako `initSettings({ loadDashboard })` ?
Korjaa juuri-syy ja shippiä.

**2. Vahvista että #screen-path -kill toimii live-Vercelillä.**
PR #113 + #114 hidetti tämän display:none-CSS:llä ja redirektoi
loadDashboard → loadHome. Käyttäjä saattaa vielä nähdä rikkonaisen
"SISÄLLYS Ladataan… / Aloita päivän treeni 20 SANAA · 5 MIN"
-näkymän jos cache on stale. Pyydä hard refresh + verify; jos vielä
toistuu, etsi mikä koodipolku ohittaa redirektin.

### P1 — Featureita, käyttäjän hyväksymät suunnaltaan

**3. Tehtävät-TOC + opetussivu integroituna** (screenshot 223336 —
Eduix Ruotsi-kirja). Tällä hetkellä lesson-screenin vasen TOC listaa
vain phases. Tavoite:

```
TEHTÄVÄT
─ opetussivu (klikattava → teaching page) ← uusi
─ kappalesanasto / karaoke (optional)     ← uusi
─ 1. Yhdistä — pronomini ja muoto
─ 2. Täydennä — ar-verbit
─ 3. Kuvaile — perhe
─ ...
```

`js/screens/lessonRunner.js renderLessonTOC` — lisää opetussivu-rivi
ENSIMMÄISEKSI item:iksi. Klikkaus → renderTeaching uudelleen. Phases
edelleen alla. ~150 LoC. CSS-luokat `.lr-toc__item--teaching` ja
mahdollisesti `.lr-toc__section` (kahta sektiota).

**4. Lisäaineisto-popup oikealla** (screenshot 223441 — enkun kirja).
Tällä hetkellä Apua-rail on lesson-laajuinen (näyttää intro + key
points). Tavoite: erillinen exercise-scoped right-popup joka avautuu
pyynnöstä ja näyttää tehtäväkohtaisia vihjeitä / esimerkkejä.
Vaatii sisältöä: jokaisella exercise-itemillä `lisaaineisto`-kenttä
(string tai markdown). UI: pieni "Apua tähän" -nappi jokaisen exercise
under-bar:ssa → klikkaus avaa side-panel:in. ~200 LoC + content-edit
joka eksisteviin lesson-jsoneihin.

**5. Sisältö-authoring** (screenshot 223027 — Espanjalainen kirja).
24 kurssia × 10 oppituntia × 3 kieltä = 240 oppituntia. Nykyiset
`LANG_CURRICULA.*` placeholdereit ("Kuka olen", "Tunnista — perhe")
ovat AI-slopia.

Plan:
- 3 paralleeli Sonnet-agenttia (yksi per kieli), DISPATCH yhteen
  viestiin
- Per kieli: 8 kurssia × 10 lesson-metadata + teaching + phase
  titles, ei lesson-itemejä (ne edelleen runtime-AI-generated)
- Output: `data/courses/{lang}/kurssi_N/lesson_M.json` päivitykset
- Otava/SanomaPro-tasoinen julkaisukvaliteetti: oikeat kontekstit
  ("Un chico de intercambio en Lima, Perú", "Mensajes de voz",
  "Festival Cruïlla — festival sostenible")
- Per-kurssi temaattinen yhtenäisyys: kurssi 1 perhe + perussanasto,
  kurssi 2 koulu + arki, kurssi 3 menneisyys, jne. Suunnittele
  pedagoginen progressio I→A→B→C→M→E→L
- Kustannus ~$5, wall ~30 min

Käytä parallel-sonnet-pattern muistettavissa olevista
feedback-tiedostoista (`feedback_lesson_canonical_prompts.md` ja
edellisistä reading-bank / writing-bank -shippauksista).

**6. Multi-language progress bleed.** `/api/curriculum`-vastauksen
`lessonsCompleted` ei filtteröi `lang`:in mukaan. Saksaa selatessa
näkyy "1/10" jos käyttäjä on tehnyt yhden espanja-lessonin. SQL-fix
backend:ssa: lisää `WHERE user_progress.language = $lang` aggregaatiin.

### Sääntöjä koko sessiolle

- **Anti-AI-slop checklist** ennen ekaa Write:ia: lue
  `feedback_design_direction_eduix_old_spain.md` ja käy lista läpi.
  Älä laita gradient-coveria, älä useampaa Fraunces-elementtiä per
  screen, älä koristelu-chip:iä.
- **Auto-push workflow**: feature-branch `auto/<slug>` → `gh pr
  create --fill --base main` → `gh pr merge --squash --delete-branch
  --admin`. Ei suoraa pushia mainiin.
- **Bump sw.js** kun mikä tahansa STATIC_ASSETS muuttuu. Älä unohda.
- **node --check** ennen committia.
- **Älä lisää uutta sidebar-nav-itemiä** — vain Aloitus + Asetukset +
  Kirjaudu ulos. Mode-pick tapahtuu HOME-näkymässä.
- **Älä lisää "Lopetetaanko"-modaalia takaisin.** Realtime-tallennus
  tekee siitä turhan.
- **Käyttäjä ei koodaa**: älä pyydä häntä ajamaan komentoja paitsi
  Vercel dashboard / GitHub settings -kytkimiä. Niitä en voi tehdä
  MCP:llä (Vercel dashboardin "PR Comments" -switch + GitHub
  Actions email -setting).
- **Skip per-step measurement gates**: ei "tee 1 ja katso, sitten 2"
  - ship koko queue chain:ina, käyttäjä lukee ledger:n lopussa.

Aloita lukemalla muistit. Sitten kysy käyttäjältä **P0 #1 console-
screenshot**, koska sitä ei pysty diagnosoimaan ilman browser-
konsoli-virheitä. Sen ratkettua, etene #3 → #4 → #6 → #5
(content-authoring viimeisenä koska se on kallein).

Sano lyhyesti aluksi mikä on plan ja kysy "go" jos joku osa epäselvä.
