# AGENT_STATE.md + IMPROVEMENTS.md siivous-strategia

## Ongelma

Olet täysin oikeassa. Nämä tiedostot on suunniteltu auditin tueksi mutta ovat kasvaneet niin isoiksi että **syövät koko Claude Coden contextin** joka istunnossa.

Nykytila:
- **`IMPROVEMENTS.md`: 494 riviä** — kaikki shipatut fixit L-PLAN-1:stä L-LIVE-AUDIT-P2:een (8 isoa loopia + ~20 hotfixiä)
- **`AGENT_STATE.md`: 30+ riviä mutta jokainen rivi on 800-1500 sanaa** — kuvataan jokaisen edellisen loopin koko sisältö
- STANDARDS-tiedosto sanoo: "uudessa istunnossa tämä STANDARDS + AGENT_STATE.md riittää contextiksi"
- = Claude Code lukee KOKO HISTORIAN joka kerta

Karkea token-arvio:
- AGENT_STATE.md: ~12 000 tokenia
- IMPROVEMENTS.md: ~25 000 tokenia
- STANDARDS.md: ~3 000 tokenia
- **= 40 000 tokenia ennen kuin Claude Code on edes lukenut yhtä koodi-tiedostoa**

Tämä on tärkein yksittäinen token-syöjä koko repossa, ja sitä ei korjata bundlauksella tai dead code -poistolla.

## Oikea ratkaisu — kahdessa osassa

### Osa 1: Jakaa tiedostot AKTIIVISIIN ja ARKISTOITUIHIN

```
docs/
  AGENT_STATE.md            ← VAIN viimeisin shipattu loop + seuraava loop. Max 50 riviä.
  IMPROVEMENTS.md           ← VAIN viimeisten ~5 loopin tiivistelmät. Max 100 riviä.
  archive/
    AGENT_STATE_2026-Q2.md  ← vanhempi historia
    IMPROVEMENTS_LPLAN1-7.md
    IMPROVEMENTS_LPLAN8.md
    IMPROVEMENTS_SECURITY.md
```

Claude Code joka istunnossa:
- Lukee `AGENT_STATE.md` (50 riviä, ~1 000 tokenia)
- Voi lukea `IMPROVEMENTS.md` jos tarvitsee viimeaikaista tilaa (100 riviä, ~3 000 tokenia)
- Lukee `archive/`:n VAIN jos eksplisiittisesti pyydetään (esim. "miksi tämä päätös tehtiin L-PLAN-3:ssa?")

**Säästö:** ~36 000 tokenia per istunto. Tämä on suuri.

### Osa 2: Tiivistä formaatit

Nykyinen `AGENT_STATE.md` -merkintä L-LIVE-AUDIT-P2:lle on **yksi paragraph 800+ sanaa**. Sen voi tiivistää:

```markdown
## L-LIVE-AUDIT-P2 — shipped 2026-05-03 ✓

8 UPDATEa, 3 commitia. CSS+JS-bundle (esbuild), /api/dashboard/v2 batch, profile-cache 5min,
adaptive/status LRU 30s, vocab pre-gen 2/3-merkillä, theme-toggle View Transitions,
self-host Inter+DM Mono. SW v112→v115. Tests 1067/1067 ✓.

**Pending:** Lighthouse-mittaus tuotannossa, Supabase indexien ajaminen
(ACTION REQUIRED `user_progress(user_id, mode)` + `attempts(user_id, created_at DESC)`).

**Files changed:** 14. **Tokens:** 318KB JS + 232KB CSS bundle.
```

5 riviä, ~80 sanaa. Sama tieto, **10× pienempi**.

### Mitä SUMMARYissa pitää säilyä

Kun pakkaa loopin:
- ✅ Mitä shipattiin (lyhyt lista)
- ✅ Mitkä tiedostot muuttuivat
- ✅ Mikä jäi pending (käyttäjän actionit)
- ✅ Tests-status (X/Y pass)
- ✅ SW-versiobumppi
- ❌ Yksityiskohtaiset funktioiden nimet ja sisäinen logiikka — ne ovat git logissa
- ❌ Sisäisten korjausten "miksi" — ne ovat commit-viesteissä
- ❌ Toteutus-CSS-pseudokoodi — se on koodissa
- ❌ Selitys siitä, mitä juurta L-PLAN-6 yhdellä päivällä korjasi — se ei ole nykyisen loopin asia

## Loop-rakenne

### `L-CLEANUP-STATE` — pieni, kriittinen, tee NYT

Ei vaadi P0/P1/P2 valmiiksi — voi tehdä rinnan. Itse asiassa **kannattaa tehdä ennen P2:tä**, koska P2 on iso (8 UPDATEa) ja lisää lisää riviä AGENT_STATE.md:hen.

Skoppi:
1. **Luo `docs/archive/`** ja siirrä:
   - `AGENT_STATE.md`:n vanha historia (kaikki paitsi viimeisin "shipped" + "next") → `archive/AGENT_STATE_HISTORY.md`
   - `IMPROVEMENTS.md` rivit ennen L-LIVE-AUDIT-P0:aa → `archive/IMPROVEMENTS_PRE_AUDIT.md` (~480 riviä)
2. **Tiivistä uudelleen** AGENT_STATE.md:n viimeisin merkintä 800-sanasta 5 riviin
3. **Päivitä STANDARDS.md** — selitä uusi rakenne. Lisää sääntö: "AGENT_STATE.md max 50 riviä. Loop:n päättyessä, jos rivimäärä ylittyy, vanhin merkintä siirretään archive/-kansioon."
4. **Päivitä jokainen `AGENT_PROMPT_LIVE_AUDIT_*.md`** "Lue ensin"-osio: lisätään huom. että `archive/`:a ei tarvitse lukea oletuksena

Verify:
- `AGENT_STATE.md` < 50 riviä
- `IMPROVEMENTS.md` < 100 riviä (lähinnä viimeisten 3-5 loopin tiivistelmät)
- `archive/`-kansion tiedostot avaa selkeästi mitä missäkin on
- Claude Code -istunto P1-promptilla kuluttaa selvästi vähemmän tokenia (mittaa vertaamalla ennen/jälkeen)

Aikaa: ~30 min. Ei vaadi koodimuutoksia, vain dokumentaation uudelleenjärjestelyä.

### Jälkivaikutukset

Kun tämä on tehty, jokainen tuleva loop:
- Käyttää vähemmän tokenia → Claude Code voi ajatella isompia muutoksia per istunto
- AGENT_STATE.md ei kasva räjähtäen → STANDARDS:n "yksi paragraph per loop" -sääntö pakottaa tiivistämään

Voi olla että Claude Code yhä pyrkii kirjoittamaan pitkiä paragrafeja loopin lopuksi — silloin sinun pitää manuaalisesti tiivistää tai lisätä sääntö "max 80 sanaa per loop-merkintä".

## Mitä EI saa unohtaa

- **`git log` on aina paras kommentaari muutoksille** — älä yritä laittaa kaikkea AGENT_STATE.md:hen mitä git jo tietää
- **Commit-viestit pitää kirjoittaa hyvin** — "fix: dashboard heatmap" ei riitä, "fix(dashboard): empty-state heatmap with subtle dashed cells [L-LIVE-AUDIT-P0 UPDATE 2]" auttaa myöhemmin
- **`archive/`-tiedostot ovat luettavissa kun tarvitset niitä** — älä poista mitään, vain siirrä

## Esimerkki: tiivistetty AGENT_STATE.md jälkeen siivouksen

```markdown
# Puheo Agent State

**Last updated:** 2026-05-03
**Status:** L-LIVE-AUDIT-P2 shipped (pending Vercel measurements + Supabase indexes)

---

## Currently shipped (last 3 loops)

### L-LIVE-AUDIT-P2 — 2026-05-03 ✓
Performance: bundling, batch APIs, vocab pre-gen, theme-toggle VT, self-host fonts.
SW v115. Tests 1067/1067. **Pending:** Lighthouse, Supabase indexes.

### L-LIVE-AUDIT-P1 — 2026-05-03 ✓
Visual polish: dash-tutor card, level-progress, skill bars, fonts (Inter not mono),
SR-rating buttons, Konteksti badge mint. SW v112. **Pending:** category color decision.

### L-LIVE-AUDIT-P0 — 2026-05-03 ✓
Critical bugs: exam confirm modal + discard endpoint, heatmap empty-state,
quick-review contrast, exit-active-exercise nav, /api/config/public 404. SW v111.

---

## Next loop

**Recommended:** L-CLEANUP-1 — dead code + LemonSqueezy removal (5 files).
Wait for Vercel manual verification on P2 first.

**Pending decisions:**
- L-LIVE-AUDIT-P1 UPDATE 8 — category color strategy (token / mint / neutral)

**Recurring blockers:**
- Playwright E2E gated since d3f5ca5 (workflow_dispatch + secrets)
- Manual prod verify after every Vercel deploy

---

For older loops (L-PLAN-1 through L-SECURITY-2), see `archive/AGENT_STATE_HISTORY.md`.
```

**Tämä on noin 35 riviä.** Sama informaatio jota Claude Code TARVITSEE seuraavaan looppiin. Kaikki muu on archivessa, available pyynnöstä.
