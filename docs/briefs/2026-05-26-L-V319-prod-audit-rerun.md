# BRIEF: L-V319 — Prod-audit-rerun (V312-spec-fixin jälkeen, L-V318b-shipin jälkeen)

**Päivä:** 2026-05-26
**Edellinen:** L-V312-AUDIT-RERUN-SPEC-1 (commit `fc9acbb` 2026-05-25) korjasi audit-spec:n login-flow + screenshot-timeout. L-V317 → L-V318 → L-V318b (commitit `61fff5b`, `95bfeb0`, `31728e4`) shippasivat uuden wordmark + sigili-systeemin.
**Status:** spec valmis, EI ajettu prod:ia vasten tuoreella deploy:lla. Tämä brief ajaa sen.

---

## Tavoite

Verifioi että L-V318/L-V318b prod-deploy ei rikkonut mitään mobile/desktop-audit-flowsia, ja kerää baseline-screenshotit uudella favicon/brand-systeemillä jotta voidaan vertailla seuraaviin auditeihin.

---

## Esivaatimukset

1. **Vercel-deploy valmis** — push `31728e4` lähti origin/main:iin 2026-05-26 ilta. Tarkista:
   ```bash
   curl -sI https://espanja-v2-1.vercel.app/ | grep -i "x-vercel-cache\|cache-control"
   ```
   Jos `x-vercel-cache: MISS` → deploy juuri valmistunut, paras hetki ajaa. Jos `HIT` → deploy on lukittu cacheen, ajaa silti.

2. **Service worker v311** — varmista että prod tarjoilee uuden `sw.js`:n:
   ```bash
   curl -s https://espanja-v2-1.vercel.app/sw.js | grep CACHE_VERSION
   # Expected: const CACHE_VERSION = "puheo-v311";
   ```

3. **Uudet brand-assetit live** — varmista että uudet faviconit ja brand-SVG:t resolvoituvat:
   ```bash
   for url in /favicon-32.png /icon-192.png /apple-touch-icon.png /public/brand/logo.svg /public/brand/favicon-master.svg; do
     curl -s -o /dev/null -w "%{http_code} ${url}\n" https://espanja-v2-1.vercel.app${url}
   done
   # Expected: all 200
   ```

---

## Audit-runit (kolme ajetaan rinnakkain)

### Aja kaikki ja kerää tulokset

```bash
# 1. Brand-spec prod:ia vasten — vahvistaa että uusi wordmark renderöityy
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app \
  npx playwright test tests/e2e-brand.spec.js --project=mobile --reporter=line

# 2. Bug-scan prod:ia vasten — varmistaa että ei mitään muuta rikkoutunut
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app \
  npm run test:bug-scan

# 3. Mobile-audit-flow prod:ia vasten — uudet baseline-screenshotit
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app \
  npx playwright test tests/e2e-mobile-audit-2026-05-24.spec.js --project=mobile --reporter=line
```

**Odotettu kesto:** brand 4s + bug-scan 40s + mobile-audit ~5 min = **~6 minuuttia kokonaan**.

---

## Acceptance criteria

1. **Brand-spec:** 8/8 PASS
2. **Bug-scan:** ≥38/40 PASS (2 skip OK jos `TEST_LOGIN_EMAIL` ei asetettu Vercel-envissä)
3. **Mobile-audit:** kaikki 13 testiä PASS, screenshot-arttejä `screenshots/mobile-audit/p*-mobile-full.png` päivittyvät
4. **Favicon-tarkistus selaimessa:**
   - Avaa `https://espanja-v2-1.vercel.app/` ja katso tab-stripin favicon
   - Pitäisi olla uusi `p`-brick-square (cream "p" brick-pyöristetyssä neliössä)
   - Jos vanha "P"-tyyppinen näkyy → hard-refresh (Ctrl+Shift+R), service worker voi tarvita uudelleenaktivoinnin
5. **Apple-touch-icon-tarkistus iPhone:**
   - Open Safari → puheo.fi → Share → "Add to Home Screen"
   - Icon pitäisi olla uusi brick-square `p`
6. **OG-image-tarkistus:**
   - Aja `curl -sI https://espanja-v2-1.vercel.app/icon-192.png` → 200 + uusi content-length

---

## Mahdolliset failure-modet

### "Faviconia ei näy uutena, vaikka serveri tarjoilee uutta versiota"
**Syy:** selaimen tai SW:n cache. SW v311 ottaa hetken aktivoitua kun käyttäjä avaa ensimmäisen kerran v311-deployin jälkeen.
**Fix:** hard-refresh (Ctrl+Shift+R), tai `chrome://serviceworker-internals` → unregister puheo SW → reload.

### "Mobile-audit-spec failaa screenshot-vertailussa"
**Syy:** prod-deployin uudet faviconit/brand-SVG:t aiheuttavat pikselin tarkkaa eroa screenshotissa.
**Fix:** päivitä baseline-screenshotit:
```bash
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app \
  npx playwright test tests/e2e-mobile-audit-2026-05-24.spec.js --update-snapshots
```
Sitten committaa `screenshots/mobile-audit/p*-mobile-full.png`-muutokset (jotka ovat olleet `M` tilassa pitkään — tämä on hyvä hetki resetoida baseline).

### "Brand-spec failaa `aria-label` tai `puheo` -tarkistuksessa"
**Syy:** SVG-tiedoston content rikkoutunut (esim. base64-encoding tai whitespace).
**Fix:** regen + push: `python scripts/generate-wordmark.py && git add public/brand && git commit -m "fix(brand): regen SVGs" && git push`

---

## Out-of-scope

- DE/FR-landingien sisältö-iteraatio (eri loop, L-V320-DE-FR-LANDING-PARITY tai vastaava)
- Logon vaihtaminen sivujen CSS-tekstistä SVG-img-elementeiksi (eri päätös, ks. `docs/brand/lockup.md`)
- General Sans -fontin lataaminen paikalliseksi (memory `feedback_typography_general_sans_manrope.md` kuvaa tämän — eri loop L-V321-LOAD-GENERAL-SANS jos halutaan tehdä)
- Memoryn päivitys (jo tehty 2026-05-26 ilta tämän brief:n kanssa)

---

## Skill-stack (lataa Skill-toolilla ENNEN ajoa)

TESTING-L (prod-audit, screenshot-vertailu, koko regression-suite):
- `webapp-testing`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`
- `superpowers:systematic-debugging`

---

## Output-vaatimukset

1. **IMPROVEMENTS.md-rivi:** `## L-V319-PROD-AUDIT-RERUN — ...` kertoo testitulokset + screenshot-baseline-päivityksen
2. **Jos kaikki PASS:** commit + push (small commit, ei vaadi vahvistusta erikseen koska on testidata-päivitys)
3. **Jos joku FAIL:** älä committaa rikkinäistä tilaa — diagnoosi ja kerro Marcelille mitä rikkoutui

---

## Päätös-rekap

L-V317 → L-V318 → L-V318b (brand-systeemi shipattu prod:iin 2026-05-26 ilta). Spec on ajamatta prod:ia vasten viimeisestä deployista. L-V319 ajaa ja vahvistaa, että uusi favicon/brand-asset live, eikä mitään muuta rikkoutunut. Tämä lukitsee brand-loopin sykli kokonaan.
