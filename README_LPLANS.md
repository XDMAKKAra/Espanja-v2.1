# L-PLAN-loopit 4–7 — käyttöohje

> Marcelille. Lue tämä kerran ja sitten unohda. Sen jälkeen käytät vain copy-paste -komentoja alla.

---

## Mitä nämä ovat

Olet kuvannut neljä iso ongelmaa Puheo-projektissasi:

1. **UI-bugit** — oikea paneeli liian täynnä, profiilinappi puuttuu, Puheoppi-otsikko clippaa, scroll-jumps-to-top, "Ladataan oppitunteja..." stuck loading, vanhempi onboarding käytössä
2. **Oppituntinäkymä ei oikeasti opeta** — ei opetuslappua, "Aloita harjoittelu" heittää sekalaisten tehtävien Puheoppiin
3. **Tavoitearvosana ei ohjaa oppimispolkua** — L-tavoite tekisi enemmän ja vaikeampia, A-tavoite vähemmän ja helpompia
4. **Kumulatiivista kertausta ei ole** — Oppitunti 5 ei kertaa Oppitunti 4:ää, kurssi 2 ei kertaa kurssi 1:tä

Olen kirjoittanut sinulle neljä prompt-tiedostoa Claude Codea varten:

| Tiedosto | Mitä korjaa |
|----------|-------------|
| `AGENT_PROMPT_LPLAN4.md` | Kaikki UI-bugit + DB-migration + V2-onboarding default + streak-silta + fast-leveling UI |
| `AGENT_PROMPT_LPLAN5.md` | Oppituntinäkymä joka oikeasti opettaa + topic-locked tehtävät + "Opetussivu"-nappi |
| `AGENT_PROMPT_LPLAN6.md` | Tavoitepohjainen vaikeustaso (A/B/C/M/E/L → eri määrä + vaikeus tehtävää) |
| `AGENT_PROMPT_LPLAN7.md` | Kumulatiivinen kertaus (oppitunti N kertaa 1..N-1, kurssi N kertaa kurssi N-1) |

Lisäksi:
- `AGENT_PROMPT_STANDARDS.md` — pakollinen luettava jokaisen loopin alussa. Listaa kaikki skillit, design plugins, ja 21st.dev-sourcing-säännöt.

---

## Miten käytät

### 1. Yksi looppi kerrallaan, järjestyksessä

Aja **L-PLAN-4 ensin**, sitten L-PLAN-5, sitten L-PLAN-6, sitten L-PLAN-7. Älä hyppää järjestyksessä — myöhemmät loopit oletavat että edelliset on shipattu.

### 2. Käynnistä Claude Code

Avaa terminaali projektikansiossa (`C:\Users\marce\OneDrive\Documents\espanja paska`) ja käynnistä Claude Code. Älä laita mitään muuta promptia ensin.

### 3. Anna prompt

Kun Claude Code on auki ja odottaa, copy-paste **tarkalleen tämä yksi rivi** (vaihda numero N looppia per kerta):

```
Aja AGENT_PROMPT_LPLAN4.md alusta loppuun. Lue ensin AGENT_PROMPT_STANDARDS.md ja AGENT_STATE.md kokonaisuudessaan. Älä kysy lupaa, älä kysy tarkennuksia — tee koko looppi loppuun. Pidä TÄSMÄLLEEN kiinni promptin "Ei tehdä tässä loopissa" -osiosta.
```

Vaihda `LPLAN4` → `LPLAN5` → `LPLAN6` → `LPLAN7` per looppi.

### 4. Looppi ajaa itse

Claude Code tekee KAIKEN itse:
- Lukee skillit
- Lukee koodin
- Kirjoittaa muutokset
- Ajaa testit (Playwright + axe)
- Käy 21st.devissä etsimässä komponentteja
- Ottaa screenshotit
- Päivittää IMPROVEMENTS.md ja AGENT_STATE.md
- Bumppaa SW:n jos tarpeen

Sinun ei tarvitse vastata kysymyksiin tai tehdä mitään — paitsi yksi pakollinen toimenpide:

### 5. Pakollinen toimenpide L-PLAN-4:n aikana — Supabase-migraatio

L-PLAN-4 UPDATE 1 vaatii että ajat yhden SQL-tiedoston Supabase-dashboardissa. Claude Code tulostaa terminaaliin näkyvän viestin "ACTION REQUIRED — SUPABASE MIGRATION" ja antaa sinulle URL:n. Tee tämä:

1. Avaa selaimessa: `https://supabase.com/dashboard/project/_/sql` (oma Puheo-projektisi)
2. Avaa `supabase/migrations/20260429_curriculum.sql` editorissa, kopioi sisältö
3. Liitä Supabase SQL editoriin
4. Klikkaa "Run"
5. Palaa Claude Codeen, kirjoita: "migration ajettu, jatka"

Tämän jälkeen Claude Code jatkaa loppuun.

### 6. Loopin loputtua: `/clear`

Kun L-PLAN-4 on valmis (Claude Code kirjoittaa "Loop done" tai vastaava), kirjoita `/clear`. Sitten ajat seuraavan loopin samalla tavalla.

---

## Mitä jokainen loop tekee yhdellä silmäyksellä

### L-PLAN-4 (UI-fix + perustyö)

**Korjaa:**
- "Ladataan oppitunteja..." (ajaa Supabase-migraation)
- Scroll-jumps-to-top -bugi koko sovelluksessa
- Puheoppi-otsikon clippaaminen
- Oikea paneeli pois, profiilinappi tilalle (Astra-tyylinen dropdown: Oma sivu / Asetukset / Tilastot / Päivitä Pro / Kirjaudu ulos)
- Streak ei nouse curriculum-suorituksesta → korjaus
- Fast-leveling callout (>90 % ensimmäisellä → "Tehdäänkö suoraan kertaustesti?")
- V2-onboarding (4 uutta screen-iä) tulee defaultiksi vanhan tilalle

**Kesto:** ~1–3 tuntia Claude Codella

### L-PLAN-5 (oppitunti opettaa)

**Korjaa:**
- Avaat "Numerot ja ikä" → näet täyden opetussivun (otsikko + tärkeimmät sanat -taulukko + esimerkit + YO-vinkki)
- Klikkaat "Aloita harjoittelu" → tehtävät pysyvät TÄSMÄLLEEN siinä aiheessa, ei sekoitettuja Puheoppi-tehtäviä
- Tehtävämäärä näkyy CTA:ssa ("8 tehtävää, ~12 min")
- Exercise-screenissä top-right: "📖 Opetussivu" -nappi joka avaa side-panelin → voit kerrata aiheen kesken harjoittelun
- Topic-lock bullet-proof: jos navigoit pois, confirm-dialogi varmistaa ("Sinulla on käynnissä oppitunti...")

**Kesto:** ~2–4 tuntia

### L-PLAN-6 (tavoitepohjainen vaikeus)

**Korjaa:**
- Tavoite L-oppilas saa 1.5× tehtäviä per oppitunti, vaikeammilla rakenteilla
- Tavoite A-oppilas saa 0.85× tehtäviä, lievemmillä distraktoreilla
- Asetuksissa toimiva "Muuta tavoitetta" — suoritetut oppitunnit säilyvät, tuleva polku adaptoituu
- L-tavoite + >85% → post-results "Syvennä taitoasi" -callout, 4 lisätehtävää
- Kertaustesti-pisteraja vaihtelee tavoitteen mukaan (A=70%, B=80%, M=85%, L=90%)
- Tutori-äänen sävy mukautuu (A = lämmin & kärsivällinen, L = vaativa)
- OB-1:ssä dynaaminen kuvaus tavoitevalinnan alla ("Tavoite L: erittäin nopea tahti, syventäviä lisätehtäviä")

**Kesto:** ~2–4 tuntia

### L-PLAN-7 (kumulatiivinen kertaus)

**Korjaa:**
- Kurssi 1 → Oppitunti 5 (ser/estar): viimeiset 2 tehtävää sisältävät myös Oppitunti 4:n (koulu+värit) sanaston
- Kurssi 2 → Oppitunti 1: yksi tehtävä on kertausta Kurssi 1:n grammar_focusista
- Joka 3. oppitunti: +1 SR-tehtävä heikoimmasta vanhasta aiheesta
- Tehtävässä näkyy "Kertaus: ..." -badge kun se on review-tehtävä
- Post-results: "Kertasit myös tätä" -osio (mitä aihetta kertasit + montako oikein)

**Kesto:** ~2–4 tuntia

---

## Kun kaikki neljä on ajettu

Sinulla pitäisi olla:
- Toimiva sovellus jossa kaikki bugraportoimasi asiat on korjattu
- Oikeasti opettavat oppitunnit
- Tavoitepohjainen polku
- Kumulatiivinen kertaus
- Profiilinappi + dropdown
- Eheä onboarding flow

**Sen jälkeen:** kerro minulle (tai Claude Codelle) mitä haluat seuraavaksi. Mahdollisia jatkoaiheita:
- Streak-laajennus (badges, celebrations)
- Dark theme polish
- Maksujärjestelmän viilaus
- Suunnittelija-toiminto: opettaja voi luoda kustom-kursseja oppilailleen
- Mobile app (Capacitor / React Native wrapper)

---

## Jos jokin menee pieleen

### "Loop ei pysähdy, koodaa loputtomasti"

Tämä shouldn't happen koska promptit on rajattu UPDATE-listoilla. Mutta jos näin käy: paina Ctrl-C, kirjoita `/clear`, ja anna sama prompt uudestaan + lisää loppuun: "Tee VAIN ne UPDATEt jotka eivät vielä näy IMPROVEMENTS.md:ssä."

### "Loop kysyy lupaa tai tarkennuksia"

Vastaa: "Käytä parasta arvauksesi promptin mukaan, älä kysy lisää."

### "Loop epäonnistuu Supabase-migraatiossa"

Joko:
- Migraatio on jo ajettu aiemmin (idempotent, mutta tarkista IMPROVEMENTS.md)
- Joku taulu konfliktoi (lisää `IF NOT EXISTS` jokaiseen lauseeseen migraatiossa)

### "axe-core valittaa color-contrast"

Useimmiten `--text-subtle` käyttö liian tummalla taustalla. Korjaus: vaihda `--text-muted` (kontrastilukee 9.7:1 vs `--bg`).

### "Playwright ei käynnisty"

Käytetään `playwright-core` joka on yleensä jo asennettu. Jos ei, `npx playwright install chromium` ja yritä uudestaan.

---

## Tärkeä huomio Supabase-migraatiosta

L-PLAN-4 ON ENSIMMÄINEN paikka jossa migraatio ajetaan. Aikaisempien L-PLAN 1–3 -loopien koodi on shipattu mutta migraatio jäi ajamatta — siksi näit "Ladataan oppitunteja..." -bugin alussa.

Kun ajat L-PLAN-4:n migraation, samalla aktivoit:
- Curriculum-taulut (8 kurssia, 90 oppituntia, teaching pages, user progress)
- 9 user_profile-saraketta (target_grade, weak_areas, placement_kurssi, jne.)
- Tutor greeting -caching

Eli yksi SQL-ajatus avaa kaiken edellisten loopien työn käyttäjille näkyväksi.

---

## Yhteenveto käyttäjän toimenpiteistä

1. Avaa Claude Code projektikansiossa
2. Kirjoita: `Aja AGENT_PROMPT_LPLAN4.md alusta loppuun. Lue ensin AGENT_PROMPT_STANDARDS.md ja AGENT_STATE.md kokonaisuudessaan. Älä kysy lupaa, älä kysy tarkennuksia — tee koko looppi loppuun. Pidä TÄSMÄLLEEN kiinni promptin "Ei tehdä tässä loopissa" -osiosta.`
3. Odota. Kun "ACTION REQUIRED — SUPABASE MIGRATION" tulostuu, kopioi SQL Supabase-dashboardiin ja aja, kirjoita "migration ajettu, jatka"
4. Odota loop loppuun
5. `/clear`
6. Toista vaiheet 2–5 muuttaen `LPLAN4` → `LPLAN5`, sitten `LPLAN6`, sitten `LPLAN7`

That's it. Yhteensä 4 prompttia (yksi per looppi) + 1 SQL-migraatio Supabaseen. Loppu hoituu itsestään.
