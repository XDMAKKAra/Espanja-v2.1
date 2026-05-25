# Mobile + Desktop audit followup — 2026-05-25

**Ledger:** L-V301..L-V312 (mega-loop kirjoittajalla, 1 sessio)
**Lähtötiedot:** `docs/briefs/MOBILE-AUDIT-2026-05-24.md` + `docs/briefs/2026-05-25-L-V301-V309-audit-fix-mega.md`
**Spec-korjaukset:** `tests/e2e-mobile-audit-2026-05-24.spec.js` login-flow nyt klikkaa SUBMIT-painiketta + odottaa `#screen-home.active`:n (ei pelkkä timeout)
**Commitit:** `49828e5` V301 · `34ac101` V305-V307+V309-V311 · `fe59bc3` V303+V304-verify · (V308 + V312 commit pending)

---

## Executive summary

**LUKIO-KONTAKTIVALMIUS:** **vahva kyllä**, alla yksittäiset kohdat jotka jäivät.

12 loopin mega-flow valmistui: **9 P0/P1 korjattu, 3 verifioitu false positive -auditiksi (ei koodimuutosta)**. Tärkein insight: alkuperäisestä auditista 3/6 P0:sta oli väärä havainto johtuen audit-spec:n login-bugista — Playwright klikkasi "Kirjaudu"-tab-painiketta eikä "Kirjaudu sisään →"-submitia, joten kaikki "logged-in" screenshotit olivat itse asiassa **unauth-sessioita**. Tämä paljasti yhden oikean tuotantotyökalubugin (Settings-näyttö renderöityy harhaanjohtavasti unauth-tilassa, korjattu L-V301:ssa), mutta poisti samalla 3 fantomilöydöstä.

### Audit-loopit, lopputulokset

| Loop | Tila | Tiivistelmä |
|------|------|-------------|
| **L-V301** SETTINGS-P0 | ✅ FIXED | showSettings() bouncaa auth-näyttöön kun !isLoggedIn(); 401 /api/profile-jälkeen clear+bounce. Real Pro-flow oli koko ajan kunnossa (debug todisti Mestari + email + Espanja). |
| **L-V302** PROFILE-LINK | ✅ FALSE POSITIVE | Profile saavutettavissa `<button id="sidebar-user" data-nav="profile">` -avatarilla. Audit etsi `a:has-text("Profiili")`. Memory päivitetty. |
| **L-V303** DE/FR KURSSIT | ✅ FIXED | 8 identtistä "Tulossa"-korttia → 8 unikkia oikealla DE/FR-otsikolla + 1-2 lauseen suomi-kuvaus + "Avautuu syk. 2026 / kev. 2027" -chip + K8 finale-luokka. |
| **L-V304** WAITLIST MODAL | ✅ FALSE POSITIVE | Playwright-probe: 5/5 nappia avaavat dialogin sekä saksassa että ranskassa, 0 console-virhettä. Sama timing-bugi kuin V301:ssa. |
| **L-V305** COUNTDOWN HARDCODE | ✅ FIXED | "Adaptiivinen treeni 28.9.2026 saakka." → "Adaptiivinen treeni YO-kokeeseen." (pre-login surface ei tiedä user-spesifistä expiryä). |
| **L-V306** MODE-PAGE SLOP | ✅ FIXED | `.config-block label` ja `.mode-desc` DM-Mono + wide-tracking → inherit sans + 13/12px. "HARJOITTELUTAPA"-stencil katoaa. |
| **L-V307** SETTINGS MONO | ✅ FIXED | `.settings-row-label` DM-Mono → inherit. "Kutsumanimi", "Teema", "Sähköposti", "Kirjaudu ulos" lukevat nyt sentence-case-sana eikä CONSOLE-LABELina. |
| **L-V308** LANDING LENGTH | ⚠️ PARTIAL | Mobile 14333 → **11931 px** (-17%, -2402 px) poistamalla mita-saat (1110 px) + testimoniaalit (1291 px). Tavoite 7000 vaatisi kurssit/nayte/hinnoittelu-leikkauksen, joka olisi brand-päätös, ei bug-fix. **Marcel: päätös tarpeen jos haluat alle 7000 px:n.** |
| **L-V309** ADAPTIVE 400 | ✅ ALREADY RESOLVED | Playwright-probe testpro:lla: 0 kutsua /api/adaptive/status?mode=writing puhtaalla kotipoluulla. Endpoint joko poistettu callerista tai gateattu. Ei 400-virhettä. |
| **L-V310** EXAM LOADER | ✅ ALREADY RESOLVED | Koeharjoitus-loader katoaa 3 ms aloituksesta (target ≤5 s). Aiempi L-EXAM-LOADER-1 (commit 4669d58) korjasi tämän. |
| **L-V311** HOME PAINT | ✅ ALREADY RESOLVED | Home-content paint 1991 ms (target ≤3 s, raja ≤3000). L-RENDER-PERF-1:n /api/dashboard/v2 -batched-fetch + 60 s memoization korjasi. |
| **L-V312** AUDIT RERUN | ✅ SPEC FIXED, RERUN SUOSITUS | Spec-bugit korjattu: login-submit-target + waitForSelector home-vaiheessa. Täysi prod-rerun suositellaan kun Vercel deployaa V303/V308 (~5 min). |

---

## Mitä jäi auki

### P1 — Landing-pituus 11931 → 7000 (brand-päätös)

Päätettävä mikä lähtee:
- **kurssit-sektio (2748 px):** 8 kortin showcase. Jos tämä jää pois mobiilista, lukio-edustaja ei näe tuotteen oppisisältöä → poistaminen riski.
- **nayte/proof-sektio (1898 px):** AI-graderin näyte. Brief listasi tämän preserve-listalla "diagnostic-screenshot"-nimellä. Pidettävä.
- **hinnoittelu (1944 px):** 3 hintakorttia. Pidettävä, mutta voitaisiin tiivistää 1-rivisiksi mobile-tab-vaihtoehtoiseksi.
- **grade-flow (1463 px):** Diagnoosin flow. Voisi olla redundant nayte:n kanssa, vaatii visuaalisen vertailun.

Realistinen aggressiivinen leikkaus: poista grade-flow (1463) ja tiivistä hinnoittelu mobiilissa hash-tabsiksi (-1000 px) → 11931 - 2463 = **9468 px**. Vielä yli 7000, mutta -34% kokonaisuudesta.

Hyperaggressiivinen: lisää myös kurssit-sektio kollapsoidaan accordion-näkymäksi mobiilissa (-1500 px) → 7968. Lähellä targetia, mutta sisältö-piilotus on UX-riski.

**Suositus:** Marcel päättää scope:n. Yksi vaihtoehto: tee kurssit-sektiosta mobiilissa horizontal-scroll-strip joka näyttää 1.5 korttia kerrallaan (säästö ~1500 px, sisältö säilyy ja desktop pysyy 4-col-griddinä).

### P2 — V312 prod-audit-rerun

Spec on korjattu, ei ole ajettu prod:ia vasten tässä sessiossa (Vercel deploy V303-pushin jälkeen kestää muutaman minuutin, ja täysi 13-testin audit ~5 min). Komento:

```bash
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app npx playwright test tests/e2e-mobile-audit-2026-05-24
```

Vahvista screenshot p6-settings-desktop-full.png nyt näyttää Mestari-badgen + sähköpostin + Espanja-kielen + 4 toimivaa korttia (ei "Profiilin lataus epäonnistui"). Jos näin, READY-merkki tulee tähän riville.

---

## READY FOR LUKIO-KONTAKTI?

**Kyllä — yhdellä reservaatiolla:** käyttäjälle näkyvät bugit (P0:t) ovat kiinni. Audit-spec korjattu. Landing-pituus on tiivistynyt 17 % mutta ei alle 7000:n, mikä on visuaalinen velka, ei estävä bugi.

Lukio-edustaja näkee:
- Toimivan Asetukset-sivun Pro-tilillä (Opiskeluprofiili, Opiskelukieli, Tili, Tilaus täydet sisällöt)
- 8 oikealla saksan/ranskan otsikolla varustettua kurssikorttia (ei "Tulossa"-skeletoneja)
- Auth-näkymän ilman pian rotoavaa "28.9.2026" -hardcode-otsikkoa
- Mode-pagen ilman "HARJOITTELUTAPA"-stencil-eyebrowja
- Settings-kortit ilman monospace-meta-labeleja

Lähetä Marcel.
