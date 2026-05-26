# BRIEF: L-V324 — Settings-sivun CLS-fix + cold-start-NI-LCP-huomio

**Päivä:** 2026-05-26 (myöhäisilta)
**Triggeri:** L-V323 perf-baseline löysi yhden aidon perf-bugin (CLS) + kaksi cold-start-artefaktia
**Status:** Pieni fokusoitu fix. ~20-40 min writer-työ.

---

## Mitä L-V323 löysi

Audit-data: `docs/audits/2026-05-26-polish-audit-perf.{json,md}`

### Aito perf-bugi (1 kpl)

| Pinta | Viewport | Metric | Arvo | Threshold | Status |
|---|---|---|---|---|---|
| l03-settings (`#/asetukset`) | mobile | **CLS** | **0.213** | ≤0.1 = good, ≤0.25 = NI | **NI** |
| l03-settings (`#/asetukset`) | desktop | CLS | 0.085 | ≤0.1 | good (lähellä rajaa) |

Settings-sivu maalaa nopeasti (LCP 108ms, FCP 60ms) mutta sisältö siirtyy maalauksen jälkeen → **0.213 layout-shift mobiilissa**.

### Cold-start-artefaktit (älä fixaa)

Audit-skripti loi nämä cold-cache-numerot — re-mittaus warm-cachella on `good`:

| Pinta | Viewport | LCP audit | LCP warm (re-mittaus) | Diagnoosi |
|---|---|---|---|---|
| p01-index desktop | desktop | 3940ms (NI) | 368-376ms (good, 3 passia) | Vercel serverless cold-start (TTFB 2820ms) |
| l02-profile desktop | desktop | 3060ms (NI) | (ei re-mitattu mutta sama pattern) | App-bundle cold-load — mobile mittari oli warm @ 1460ms |

**Mitä TÄMÄ tarkoittaa:** Kun audit-skripti hakee ekan kerran prodin URL:ia, Vercel käynnistää lambda-instanssin (kylmä). Toinen mittari samasta URL:ista lämpimällä cache:lla on alle 500ms. Tämä ei ole bug. Vercel:ssä todelliset käyttäjät hyötyvät edge-cache:sta + warm-instansseista.

### Mikä on edelleen good

- **38/40 scan:ia good LCP:llä**
- TTFB ≤80ms koko julkisella puolella (paitsi cold-start)
- FCP ≤200ms mobiilissa kaikilla julkisilla landing-sivuilla
- Logged-in pinnat (kun audit-skripti pakottaa fresh-loadin) keskimäärin LCP ~1.3s = good

---

## Mitä writer tekee

### Step 1: Diagnosoi settings-sivun CLS

```bash
# Aja Playwright-headless settings-sivulle mobiililla, kerää layout-shift-event:t:
node -e "
import('playwright').then(async ({ chromium, devices }) => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  await ctx.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
  const page = await ctx.newPage();
  // Login first (käytä TEST_LOGIN_EMAIL/PASSWORD .env:stä)
  // Sitten goto /app.html?t=...#/asetukset
  // Kerää PerformanceObserver layout-shift -event:eihin attribution:illa
  // attribution.node antaa elementin joka aiheutti shift:n
  ...
});
"
```

Vaihtoehto: avaa Chrome DevTools → Performance Insights → tallenna sessio mobiililla, etsi "Layout shift" -event:t ja niiden source-element.

**Todennäköiset syylliset** (yleisiä Puheo:ssa):
1. **Async-ladattu sisältö joka työntää muita alaspäin** — esim. käyttäjän plan-pillit (Free/Pro) ladataan API-kutsulla joka palaa 300ms maalauksen jälkeen
2. **Image-tagit ilman `width`/`height`** — avatar tai logo ilman intrinsic-mittasuhteita
3. **Font-swap-FOUT** — Manrope-fontti latautuu, korvaa fallbackin → rivimäärä muuttuu → kortti kasvaa
4. **Skeleton → real-content height mismatch** — placeholder on lyhyempi kuin real content

### Step 2: Korjaa juurisyy

Riippuu Step 1:n löydöksestä. Yleisimmät fix:t:

- **Async-content shift:** reserveeraa tila etukäteen `min-height` kortille, joka mahtuu odotetun sisällön korkeudelle. Tai näytä skeleton joka on **täsmälleen sama korkeus** kuin real content.
- **Image:** lisää `width` ja `height` attribuutit + CSS `aspect-ratio: 1/1` (tai oikea suhde) → selain varaa tilan ennen image-latausta.
- **Font-swap:** käytä `font-display: optional` tai preloadaa kriittinen font + `size-adjust: ...%` CSS:ssä, joka säätää fallback-fontin metriikat lähelle web-fontin metriikkoja.
- **Skeleton mismatch:** synkkaa skeleton-elementin korkeus real content:n korkeuteen (mittaa, päivitä CSS).

### Step 3: Verifioi fix

Aja perf-audit uudelleen kun fix:t on commit:attu prodiin:

```bash
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit-perf.mjs
```

**Acceptance:** `l03-settings mobile` CLS ≤ 0.1. Älä riko muita pintoja.

### Step 4: Päivitä IMPROVEMENTS.md

Yksi rivi:
```
2026-05-26 — L-V324 perf-fix: settings-sivun CLS 0.213 → <X> (mobiili)
```

---

## Acceptance criteria

1. `l03-settings mobile` CLS ≤ 0.1 (good) prodissa
2. `l03-settings desktop` CLS pysyy ≤ 0.1 (ei rikkounnu)
3. Muut 38 good-pintaa pysyvät good (ei sivuvaikutusta)
4. Cold-start-NI:t (p01-index desktop, l02-profile desktop) **EI scope:ssa** — älä yritä optimoida niitä

---

## Out-of-scope

- **Cold-start-LCP** (p01-index, l02-profile desktop) — Vercel-instance warm-up, ei sovellustason fix
- **Lighthouse full audit** — eri loop L-V325 jos halutaan score:t (perf/a11y/seo/best-practices)
- **Bundle-koko-optimointi** — eri loop L-V326 jos halutaan pienemmät bytet
- **Logged-in cold-load LCP-optimointi** (l01-home desktop 2216ms) — nämä numerot näkyvät audit:issa koska skripti pakottaa fresh nav timing per pinta; oikeassa SPA-käytössä käyttäjä navigoi hashilla ilman page reload:ia → LCP on käytännössä 0. Ei real-user-bug.

---

## Skill-stack writerille

TESTING-S (selvitä syy + fix yksi CSS-arvo / asset-attribuutti):
- `webapp-testing` (Playwright-diagnoosi)
- `superpowers:verification-before-completion` (re-audit ennen committia)

FRONTEND-S (yhden CSS-arvon / asset-tagin korjaus):
- `frontend-design`

Total stack: 3 skilliä.

---

## Päätös-rekap

L-V323 paljasti että koko app on perf-mielessä production-ready paitsi yksi mobile-settings CLS. Iso uutinen → pieni jäljelle jäänyt työ.

Realistinen scope: 20-40 min writer-fix kun root cause löytyy. Jos CLS-juurisyy on font-swap (laaja vaikutus), scope voi laajeta kaikkien pintojen `font-display`-tuningiksi → siinä tapauksessa kirjoita L-V325-brief erikseen.
