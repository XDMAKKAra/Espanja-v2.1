# L-V369 — Landing: hajauta osioihin + hero-slop pois + nav-dropdownit

**Päivä:** 2026-06-03
**Prioriteetti:** P2 (iso) — **VAHVISTA SCOPE ENNEN AJOA.** FRONTEND-L, koskee konversiopintaa.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer`

> Tämä on jonon isoin yksittäinen muutos. Marcel-sääntö: isot muutokset vahvistetaan ennen aloitusta. Writer: kysy Marcelilta scope-vahvistus (tai prompter tarkentaa) ennen kuin koskee landing-rakenteeseen.

---

## Tausta

Marcel (2026-06-03) kolme erillistä mutta saman pinnan ongelmaa landingilla:

1. **Hero-copy = AI-slop** (kuva 3): otsikko "Treenaa lyhyiden kielten **ylppäreihin**" vaihtaa värin kesken lauseen (brick-punainen viimeinen sana) = klassinen AI-slop-kuvio. Yläpuolella "Espanja · ranska · saksa" -pilli tuntuu myös slopilta (geneerinen eyebrow-chip).
2. **Landing liian iso** — koko sivu on yksi pitkä vieritys. Pitäisi hajauttaa selkeisiin osioihin / ali-sivuihin, ettei kaikki ole yhdessä loputtomassa pylväässä.
3. **Nav ilman rakennetta** — Marcel haluaa WordDive-tyyliset dropdown-valikot (kuva 7: ABIKURSSIT → Englannin abikurssi / Ruotsin abikurssi). Meidän per-kieli-sivut (es/de/fr) pitäisi olla nav-dropdownin takana, ei piilossa.

## Tehtävät (INTENT — älä yli-prescriboi, valitse komposition itse)

### A · Hero-slop pois
- Poista värinvaihto kesken lauseen. Yksi väri otsikolle (tai paljon hillitympi aksentti, ei "viimeinen sana punaisella").
- "Espanja · ranska · saksa" -pilli: joko poista tai tee siitä merkityksellinen (esim. oikeat kielivalinta-napit jotka vievät per-kieli-sivulle), ei koriste-chip.
- Humanizer hero-copylle: ei em-dashia, ei AI-brand-sanoja, ei rule-of-three.

### B · Hajauta landing
- Pilko pitkä sivu loogisiin osioihin selkein erottimin / ankkureihin, tai siirrä osa sisällöstä ali-sivuille (esim. "Miten arviointi toimii", "Hinnoittelu", per-kieli). Tavoite: pää-landing on lyhyempi ja jokainen osio on skannattava, ei loputon pylväs.
- Älä riko olemassa olevia per-kieli-sivuja (L-V356/V358) — linkitä ne nav-dropdownista (kohta C).

### C · Nav-dropdownit
- Lisää WordDive-tyyliset dropdownit pää-navigaatioon. Per-kieli abikurssi-sivut (es/de/fr) dropdownin takana.
- Pidä Puheon paletti + fontit (ei WordDiven turkoosia). Kyse on rakenteesta, ei väristä.

## Acceptance
- Hero ei vaihda väriä kesken lauseen; copy läpäisee humanizer-säännöt.
- Pää-landing on lyhyempi / osioitu (mittari: pää-sivun korkeus tai osio-määrä sovitaan scope-vahvistuksessa).
- Nav-dropdown toimii desktop + mobile, per-kieli-sivut tavoitettavissa sieltä.
- Ei vaakavieritystä <440px. Ei uutta AI-slopia (CLAUDE.md-checklist).
- `npm run build` + Playwright nav-smoke + screenshot ennen/jälkeen.

## Ulkopuolella
App-puoli (V366/V370). Per-kieli-sivujen desktop-aukeamis-bugi → V367 ensin (älä rakenna nav-dropdownia rikkinäisten sivujen päälle).

## Riippuvuus
**Aja V367 ENNEN tätä** — turha linkittää nav-dropdownista sivuihin jotka eivät aukea desktopilla.
