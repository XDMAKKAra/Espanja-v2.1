# Agent Prompt — L-SECURITY-2
# Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on toinen turvallisuus-looppi. Tarkoitus: nostaa securityheaders.com-arvosana **D → A** lisäämällä 5 puuttuvaa security headeria Vercel-konfiguraatioon ja varmistamalla että sivusto edelleen toimii kaikkien rajoitusten kanssa.

---

## Lue ensin — EI muutoksia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins. Tämä looppi on backend/config-painotteinen, mutta jos jokin CSP-rule rikkoo frontendin, design-plugin-skillejä tarvitaan UI-fixiin.**
2. `AGENT_STATE.md` — koko tiedosto, varmista että L-SECURITY-1 on shipattu (grep IMPROVEMENTS.md `[L-SECURITY-1]`)
3. `vercel.json` jos olemassa — nykyinen Vercel-konfiguraatio. Jos ei ole, luot uuden.
4. `index.html` + `app.html` — `<script src=>`, `<link href=>`, inline `<script>`/`<style>`-tagit. Tarvitset listan ALL ulkoisista origineista jotta CSP ei riko sivua.
5. `server.js` + `api/index.js` — Express-konfiguraatio. Onko `helmet` tai vastaava middleware jo käytössä? Jos on, vältä duplikaatio.
6. IMPROVEMENTS.md viimeiset 60 riviä

Verify L-SECURITY-1 is shipped: grep IMPROVEMENTS.md for `[L-SECURITY-1]`. If missing, STOP.

---

## Konteksti

Käyttäjä ajoi securityheaders.com-scannin osoitteeseen `https://espanja-v2-1.vercel.app/` (2026-05-03) ja sai arvosanan **D**.

| Header | Status | Recommended value |
|---|---|---|
| Strict-Transport-Security | ✓ läsnä (Vercel default) | (pidä) |
| Content-Security-Policy | ✗ puuttuu | `default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com https://api.lemonsqueezy.com; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` (säädä origin-listaa) |
| X-Frame-Options | ✗ puuttuu | `DENY` |
| X-Content-Type-Options | ✗ puuttuu | `nosniff` |
| Referrer-Policy | ✗ puuttuu | `strict-origin-when-cross-origin` |
| Permissions-Policy | ✗ puuttuu | `camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")` |

Kaikki nämä headerit Vercel servaa **per request** kun ne määritellään `vercel.json`-tiedostossa. Tämä on yhden tiedoston muutos joka ei vaadi koodirefaktoria.

**Suurin riski:** liian tiukka CSP rikkoo sivun (esim. inline `<script>` lakkaa toimimasta, OpenAI-API-kutsut blokkautuvat). Siksi tämä loop on **iteratiivinen** — sourcaa kaikki origin-pyynnöt ennen kuin lukitset CSP:n, ja testaa staging-deployssa ennen tuotantoa.

---

## Tavoite

1. **securityheaders.com-arvosana D → A (vähintään A−)** kaikilla 6 headerilla läsnä oikealla arvolla
2. **Sivusto toimii edelleen** — landing, app, dashboard, OpenAI-kutsut, Stripe/LemonSqueezy-checkout, Supabase-yhteydet, sähköpostit kaikki toimivat
3. **CSP on enforced, ei vain Report-Only** lopputilassa — mutta Report-Only-vaihe on UPDATE 4:ssä ennen enforcing
4. **Mozilla Observatory -score paranee** (ei vaadita tiettyä numeroa, mutta paranna)

---

## UPDATE 1 — Sourcaa kaikki ulkoiset originit

**Ennen kuin kirjoitat CSP:tä, sinun pitää tietää tarkalleen mihin sivu kutsuu.**

Aja:

```bash
# Frontend: kaikki <script src=> ja <link href=> ja CSS url() tagit
grep -rEn "src=\"https?://[^\"]+\"|href=\"https?://[^\"]+\"|url\(['\"]?https?://" \
  index.html app.html css/ js/ \
  --exclude-dir=node_modules

# Frontend: kaikki fetch-kutsut ulkoisille originille
grep -rEn "fetch\(['\"]https?://" js/ app.js \
  --exclude-dir=node_modules

# Backend: kaikki ulkoiset HTTP-kutsut (axios, fetch, native http)
grep -rEn "(axios|fetch|got|undici)\.\w+\(['\"]https?://|new URL\(['\"]https?://" \
  server.js api/ routes/ lib/ middleware/ \
  --exclude-dir=node_modules

# package.json: tunnista kaikki SDK:t jotka tekevät verkko-pyyntöjä
cat package.json | grep -E "openai|stripe|lemonsqueezy|resend|supabase"
```

**Kerää lista** kaikista origineista joita sivu kutsuu, esim:
- `https://*.supabase.co` — Supabase REST + Realtime
- `https://api.openai.com` — OpenAI API
- `https://api.resend.com` — Resend transactional email
- `https://api.lemonsqueezy.com` — LemonSqueezy checkout API
- `https://app.lemonsqueezy.com` — LemonSqueezy checkout iframe (jos käytössä)
- `https://js.stripe.com` — vain jos Stripe.js on edelleen käytössä; tarkista
- `https://cdn.jsdelivr.net` tai vastaava CDN — jos käytössä

**HUOM:** lib/openai.js todennäköisesti käyttää OpenAI-SDK:n default base URLia. Tarkista että se on `https://api.openai.com` — se on default. Älä lisää CSP:hen mitä ei oikeasti kutsuta.

Raportoi listan käyttäjälle ennen kuin etenet UPDATE 2:een.

---

## UPDATE 2 — Tunnista inline-script + inline-style käyttö

CSP estää inline-skriptit ja -tyylit oletuksena. Sourcaa kaikki:

```bash
# Inline script-tagit
grep -rEn "<script(?!\s+src=)[^>]*>" index.html app.html
grep -rEn "<script>" index.html app.html

# Inline event-handlerit (onclick=, onload= jne.)
grep -rEn 'on[a-z]+=["'\''][^"'\'']*["'\'']' index.html app.html

# Inline style-tagit ja style="" attribuutit
grep -rEn '<style[^>]*>' index.html app.html
grep -rEn 'style="[^"]*"' index.html app.html | wc -l
```

**Kolme strategiaa per löydös**, valitse paras per kontekstista:

**A. Siirrä erilliseen .js / .css -tiedostoon** (paras vaihtoehto pitkän aikavälin kannalta)
- Inline `<script>` → `js/inline-bootstrap.js`, lisää `<script src="js/inline-bootstrap.js">`
- Inline `<style>` → uusi CSS-tiedosto tai olemassa olevaan
- Inline event-handler `onclick="foo()"` → `addEventListener('click', foo)` erillisestä JS:stä

**B. Salli `'unsafe-inline'` CSP:ssä** (helppo mutta heikentää CSP-suojaa)
- Käytä vain jos siirto ei ole järkevää (esim. critical-CSS hero-renderiin)
- Älä missään tapauksessa käytä `script-src 'unsafe-inline'` ilman erittäin hyvää syytä — se on suuri XSS-riski

**C. Käytä nonce'ia tai hashia** (paras turvallisuuden ja inline-tuen yhdistelmä, mutta vaatii server-side renderingiä)
- Vercel Edge Functions tukee tätä, mutta vaatii enemmän työtä
- Ohita tämä loopissa, käytä A:ta

**Suositus tähän looppiin:**
- Inline-skriptit → siirrä erilliseen tiedostoon (A)
- Inline-tyylit → salli `'unsafe-inline'` `style-src`:ssä (B) — moderni CSS-in-JS ja brand-token-väri-injektio vaatii sen, ja `style-src 'unsafe-inline'` on huomattavasti vähemmän vaarallinen kuin `script-src 'unsafe-inline'`

Raportoi käyttäjälle: monta inline-scriptiä siirrettiin, monta inline-style-blokkia jäi.

---

## UPDATE 3 — Kirjoita `vercel.json` headers-konfiguraatio

Jos `vercel.json` ei ole olemassa, luo se. Jos on, lisää `headers`-osio yhdistäen olemassa olevan kanssa.

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
        },
        {
          "key": "Content-Security-Policy-Report-Only",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.openai.com https://api.resend.com https://api.lemonsqueezy.com wss://*.supabase.co; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
        }
      ]
    }
  ]
}
```

**TÄRKEÄÄ — aloita CSP:llä `Content-Security-Policy-Report-Only`** -tilassa, EI `Content-Security-Policy`. Report-Only ei estä mitään, vain raportoi rikkomuksista. Tämä antaa sinulle 24–48 h aikaa tarkkailla onko mitään blokattua tuotannossa ennen kuin enforced-CSP käännetään päälle.

**Säädä `connect-src`-listaa** UPDATE 1:n löydösten mukaan. Lisää KAIKKI originit joita sivu kutsuu, älä yhtään ylimääräistä.

**Säädä `script-src`-listaa** UPDATE 2:n päätösten mukaan. Jos siirsit kaikki inline-skriptit erillisiin tiedostoihin, voit poistaa `'unsafe-inline'` `script-src`:stä — se on ihanne. Jos jätit inline-skriptejä, pidä `'unsafe-inline'`.

**Permissions-Policy:** jos käytät tulevaisuudessa kameraa (puheäänitehtävät?) tai mikrofonia, säädä silloin. Tällä hetkellä Puheo ei tarvitse mitään niistä → kaikki disabled.

---

## UPDATE 4 — Deploy + tarkkaile Report-Only -raportteja

1. Pushaa `vercel.json`-muutos branch-deployhin (älä mainiin vielä)
2. Avaa Vercelin preview-deployment
3. Avaa selaimen DevTools → Console-välilehti → Filter: "violation" tai "csp"
4. Käy läpi seuraavat user-flowt ja katso tuleeko CSP-violation-raportteja:
   - Landing-sivun lataus
   - Aloita ilmaiseksi → rekisteröityminen
   - Onboarding kokonaan läpi
   - Sanasto-harjoitus 5 itemiä
   - Kielioppi-harjoitus 5 itemiä
   - Kirjoitustehtävä → AI-arviointi (OpenAI-kutsu)
   - Pro-checkout flow LemonSqueezy:llä (testimoodissa)
   - Sähköposti-asetukset → testilähetys (Resend-kutsu)
5. Listaa kaikki violationit
6. Säädä CSP:tä niin että legitimit pyynnöt sallitaan
7. Toista kunnes 0 violationia legitimille flow:lle

**Raportoi käyttäjälle** mitä violationeja löytyi ja mitä CSP:hen lisättiin. Käyttäjä haluaa tietää että CSP on tiukka, ei pelkkä `*` joka sallisi kaiken.

---

## UPDATE 5 — Käännä CSP enforcing-tilaan

Kun UPDATE 4:n testit ovat puhtaat, vaihda `vercel.json`:ssa:
- `Content-Security-Policy-Report-Only` → `Content-Security-Policy`

Pushaa pääbranchiin, deploy tuotantoon.

Aja securityheaders.com uudestaan → tavoitearvosana **A**.

Aja Mozilla Observatory uudestaan → katso paranikoko score.

---

## UPDATE 6 — DNS: SPF + DKIM + DMARC ACTION REQUIRED

L-SECURITY-1 UPDATE 4 jätti tämän käyttäjän tehtäväksi. Tämä loop ei tee DNS-muutoksia, mutta tarkista että `IMPROVEMENTS.md`:ssä oleva ACTION REQUIRED -ohje on edelleen ajan tasalla. Jos käyttäjä on ilmoittanut että DNS-fix on tehty, merkitse rivi `[2026-MM-DD VERIFIED]`. Jos ei, jätä rivi näkyviin ja lisää muistutus seuraavaan loop-summaryyn.

Aja MX Toolbox -SPF-test käyttäjän puolesta jos he ilmoittivat että DNS on lisätty:
```
curl -s "https://mxtoolbox.com/api/v1/Lookup/spf/?argument=puheo.fi" 
```
(Tämä vaatii API-keyn jota ei ole — kerro vain käyttäjälle URL: https://mxtoolbox.com/spf.aspx?domain=<heidän-domaininsa>)

---

## UPDATE 7 — Dokumentointi

1. **IMPROVEMENTS.md** uusi blokki, prefix `[2026-MM-DD L-SECURITY-2]`:
   - Securityheaders.com ennen/jälkeen-arvosana
   - Mozilla Observatory ennen/jälkeen-score (jos ajettiin)
   - Lista CSP:hen lisätyistä origineista (kaikki perusteltu UPDATE 1:n lähteistä)
   - Lista inline-skripteistä jotka siirrettiin erillisiin tiedostoihin
   - Onko Report-Only → enforced käännetty
   - DNS-status (UPDATE 6)
2. **AGENT_STATE.md**:
   - `Last completed loop:` → `L-SECURITY-2 (security headers + CSP enforced + securityheaders.com D→A)`
   - `Next loop:` → todennäköisesti `L-SECURITY-3` (auth-middleware-audit + Supabase RLS-policyt + rate-limit-audit + webhook-signature-verifiointi)
3. **SW-bumppi**: jos siirsit inline-scriptejä uusiin tiedostoihin ja lisäsit ne STATIC_ASSETSiin → bumppaa SW. Jos vain `vercel.json` muuttui → ei.

---

## Verifiointi (loop ei pääty ennen näitä)

1. **securityheaders.com** uudelleen → arvosana A tai A−
2. **Mozilla Observatory** uudelleen → score on noussut
3. **Production smoke-test** kaikki user-flow:t toimivat (UPDATE 4 -lista)
4. **Selaimen DevTools** → 0 CSP-violationia legitimillä flowilla
5. **`npm test`** → kaikki vihreänä
6. **`npm run security:scan`** → exit 0 (regressio-este L-SECURITY-1:stä toimii edelleen)

---

## Mitä EI saa tehdä

- ÄLÄ kirjoita CSP:tä `default-src *` -löysänä — se kumoaa CSP:n koko pointin
- ÄLÄ lisää `script-src 'unsafe-eval'` ellei jokin SDK ehdottomasti vaadi sitä (OpenAI/Stripe/LemonSqueezy SDKt eivät vaadi)
- ÄLÄ käännä CSP:tä enforcing-tilaan ennen kuin Report-Only on ollut puhtaana 1 user-flow-passin verran
- ÄLÄ poista olemassa olevia turvaheadereita jotka Vercel servaa automaattisesti — varmista vain että uudet eivät override niitä
- ÄLÄ tee DNS-muutoksia itse — käyttäjä tekee
- ÄLÄ pushaa suoraan mainiin — käytä preview-deploymenttejä tarkkailuun

---

## Lopputulos käyttäjälle

Loopin lopussa raportoi yhdellä viestillä:
- Securityheaders.com ennen/jälkeen-arvosana ja screenshot-vertailu
- Mozilla Observatory ennen/jälkeen-score
- Lista origineista jotka CSP sallii ja perustelu jokaiselle
- Vahvistus että 0 CSP-violationia legitimillä user-flow:lla
- Linkki preview-deploymenttiin jossa Report-Only oli ajettu
- DNS-status (SPF/DKIM/DMARC) — käyttäjälle muistutus jos vielä tekemättä
- Ehdotus L-SECURITY-3:lle (auth-middleware-audit + Supabase RLS + rate-limit + webhook-sigit)
