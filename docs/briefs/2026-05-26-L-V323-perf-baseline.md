# BRIEF: L-V323 — Performance baseline (Web Vitals)

**Päivä:** 2026-05-26 ilta
**Triggeri:** Polish-fokuksen kolmas mittauspilari — LCP/CLS/FCP/TTFB baseline per sivu, ranking, fix-targetit jos joku huono.
**Status:** Julkiset pinnat mitattu. Logged-in pinnat vaativat audit-skripti-fix:n (SPA hash-route ei tuota Playwright-goto-eventiä).

---

## Mitä audit löysi

`docs/audits/2026-05-26-polish-audit-perf.{json,md}`.

### Julkiset pinnat — 22/22 GOOD

| Slug | LCP (ms) | CLS | FCP (ms) | TTFB (ms) |
|---|---|---|---|---|
| p01-index desktop | ~300 | 0 | ~300 | ~70 |
| p02-landing-es desktop+mobile | <240 | <0.05 | <240 | <80 |
| p03-landing-de | <300 | <0.01 | <300 | <100 |
| p04-landing-fr | <400 | <0.01 | <400 | <80 |
| p05-diagnose | <200 | <0.01 | <200 | <80 |
| p06-pricing | <200 | <0.02 | <200 | <80 |
| p07-terms / p08-privacy / p09-refund / p10-blog / p11-app-unauth | <300 | <0.1 | <300 | <80 |

**Yhteenveto:** Kaikki 22 julkisen pinnan scan:ia ovat **WCAG Web Vitals -tasolla "Good"** (LCP ≤2.5s, CLS ≤0.1, FCP ≤1.8s, TTFB ≤0.8s). Ei fix-vaatimuksia julkisille pinnoille.

### CLS ainoat huomionarvoiset

- **p09-refund mobile** CLS 0.085 (alle 0.1 = good mutta lähellä rajaa)
- **p02-landing-es mobile** CLS 0.043
- **p06-pricing mobile** CLS 0.019

Kaikki "good" tasolla, mutta refund-sivun mobiili lähestyy NI-rajaa. Tarkkaile jos säätää sisältöä.

### Logged-in pinnat — EI MITATTU

18 scan:ia (9 hash-routea × 2 viewport) palautti `goto-no-response`. SPA-hash-navigaatio `/app.html#/koti` ei laukaise Playwright-navigaatio-event:ä koska URL host+pathname on sama kuin login-flow:n jäljiltä — vain `location.hash` muuttuu.

**Korjaus audit-skriptiin** (writer toteuttaa):

```js
// In measure(), use page.evaluate to force full reload via location.href
await page.evaluate((url) => {
  window.location.href = url; // forces full document load even for hash changes
}, BASE + "/app.html" + hash);
await page.waitForLoadState("networkidle", { timeout: 20000 });
```

Tai vaihtoehtoisesti: poista BASE+url-prefiksin yhtenäisyys — käytä query-paramia `?t=${Date.now()}` joka pakottaa Vercel:n palaamaan uutena navigationina:

```js
const url = `${BASE}/app.html?t=${Date.now()}${hash}`;
await page.goto(url, { waitUntil: "networkidle" });
```

---

## Mitä writer tekee

### Step 1: Korjaa audit-skripti logged-in flow:lle

`scripts/polish-audit-perf.mjs` rivi ~165 (logged-in for-loop, sisällä measure-call):
- Joko force-reload `page.evaluate(window.location.href = ...)`-tekniikalla
- Tai lisää query-param `?t=${Date.now()}` URL:iin

### Step 2: Re-run audit

```bash
AUDIT_BASE_URL=https://espanja-v2-1.vercel.app node scripts/polish-audit-perf.mjs
```

Verifioi:
- 22 julkista pintaa edelleen `good` (älä rikkounnu)
- 18 logged-in pintaa nyt mitataan (ei `goto-no-response`)
- Per logged-in pinta: LCP-targetit ≤2.5s (good), ≤4s (NI), >4s (poor)

### Step 3: Analysoi logged-in tulokset

Jos joku logged-in pinta on:
- **LCP > 4s (poor):** isoa fix-työtä. Tyypilliset syyt: iso JS-bundle (lazy-load mode-page-componentit), iso hero-image (next-gen formaatti), render-blocking external resource.
- **LCP 2.5-4s (NI):** keskitason fix. Tyypilliset syyt: preload critical CSS/fontit, defer non-critical scripts.
- **CLS > 0.1:** layout-shift. Tyypilliset syyt: image-tagit ilman width/height, async-injected ads/embeds, font-swap-FOUT.

### Step 4: Jos kaikki good

Lopullinen tila on **brand polish + a11y baseline + perf baseline = complete**. Lukio-piloitiin valmis tuote. Brief writeria varten: päivitä IMPROVEMENTS.md "L-V323 perf-baseline" -rivillä joka kertoo kaikki numerot.

### Step 5: Jos huonoja löytyy

Kirjoita uusi brief L-V324-PERF-FIX joka spesifioi tarkkaan mitkä sivut ja mitkä metric:t ovat huonoja, mikä on suositeltu fix per pinta. Kerää suunnitelma ennen koodin koskemista.

---

## Acceptance criteria

1. Audit-skripti ajaa logged-in osion onnistuneesti (status != "goto-no-response")
2. 22 julkista pintaa edelleen kaikki "good"
3. 18 logged-in pintaa mitataan, numerot baseline-tiedostoon
4. Markdown-raportti listaa worst-LCP top 5 (jos huonoja löytyy)
5. Brief L-V324 perf-fix kirjoitetaan jos joku >2.5s LCP

---

## Out-of-scope

- **Lighthouse full audit** (perf/a11y/seo/best-practices scores) — eri loop L-V325 jos halutaan. Vaatii Lighthouse-CLI:n Puppeteer-flow:n
- **Bundle-koko-optimointi** — eri loop L-V326 jos tämä mittari paljastaa pullonkaulat
- **CDN / Vercel-tuning** — eri loop jos TTFB > 800ms (nyt ~70ms = ei tarvetta)

---

## Skill-stack writerille

TESTING-M (audit-skripti fix + re-run):
- `webapp-testing`
- `superpowers:verification-before-completion`

PLANNING (analyysin perusteella mahd. L-V324-brief):
- `superpowers:writing-plans`

Total stack: 3 skilliä (pienin V-loop kokonaisuudessaan, jos ei fix-cycle:a tule).

---

## Päätös-rekap

**Iso uutinen:** Puheo:n julkiset pinnat ovat performance-näkökulmasta **production-ready**. Ei latency-, ei layout-shift-, ei TTFB-bugia näkyvissä.

**Avoin kysymys:** Logged-in puolen suoritus ei mitattu — audit-skripti tarvitsee 1 rivin fix:n SPA-hash-navigaatiolle. Sitten saadaan koko app performance-baseline.

Realistinen scope: 30 min writer-fix audit-skriptiin → re-run → analyysi. Jos kaikki good, V323 sulkeutuu samana päivänä.
