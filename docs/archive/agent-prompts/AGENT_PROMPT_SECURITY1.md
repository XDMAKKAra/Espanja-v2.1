# Agent Prompt — L-SECURITY-1
# Hardcoded secrets sweep + .env-eristys + helpot HIGH-fixit

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Ensimmäinen turvallisuus-looppi L-PLAN-7:n jälkeen. Tarkoitus: poistaa kaikki kovakoodatut salaisuudet repostosta ja kiinni saada matalat hedelmät.

---

## Lue ensin — EI muutoksia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, sourcing-säännöt. Standardilohko on pakollinen.** (Tämä looppi nojaa enemmän shell-grep + koodi-auditointi -puoleen kuin uuteen UI:hin, mutta jos kirjoitat MITÄ TAHANSA käyttäjälle näkyvää copyä, `puheo-finnish-voice` + `design:ux-copy` ovat silti pakollisia.)
2. `AGENT_STATE.md` — koko tiedosto, varmista että **L-PLAN-7 on shipattu** (grep IMPROVEMENTS.md `[YYYY-MM-DD L-PLAN-7]`). Jos puuttuu, STOP ja palaa L-PLAN-7:ään.
3. `CLAUDE.md` — projektirakenne ja env-muuttujien sopimus
4. `.env.example` — virallinen lista env-muuttujista joiden PITÄÄ olla olemassa
5. `IMPROVEMENTS.md` viimeiset 80 riviä — varmista ettei sieltä löydy jo aiempia "ACTION REQUIRED: rotate key" -merkintöjä jotka pitää huomioida tässä loopissa

Verify L-PLAN-7 is shipped: grep IMPROVEMENTS.md for `[L-PLAN-7]`. If missing, STOP.

---

## Konteksti

Käyttäjä ajoi Checkvibe-ilmaisscannauksen `espanja-v2-1.vercel.app`-domainille (2026-05-03) ja sai **28 löydöstä**: 1 CRITICAL, 5 HIGH, 16 MEDIUM, 6 LOW. Vain yksi löydös oli näkyvissä maksamatta:

> **HIGH — No SPF record found.** Add a TXT record with an SPF policy. Basic starting point: `v=spf1 include:_spf.google.com ~all` (säädä email-providerille).

Loput 27 löydöstä ovat paywallin takana. Käyttäjä **EI** maksa raporttia. Joten audit pitää tehdä repon puolelta.

Tämä looppi keskittyy **kaikkein kriittisimpiin asioihin** joita voi tehdä ilman maksettua raporttia: kovakoodatut salaisuudet, .env-hygienia, ja se yksi nähty HIGH-finding (SPF). Myöhemmät L-SECURITY-loopit ottavat laajemman OWASP-pinnan.

---

## Tavoite

1. Repossa **ei ole yhtään kovakoodattua salaisuutta**. Kaikki avaimet ja secretit luetaan `process.env.X` kautta, ja `.env.example` listaa ne kaikki ilman arvoja.
2. `.gitignore` blokkaa `.env`, `.env.local`, `.env.*.local` ja muut variantit.
3. Jos historian commiteissa on koskaan ollut paljas avain, **kyseinen avain on rotatoitava** — kirjoita `ACTION REQUIRED`-rivi IMPROVEMENTS.md:hen (älä yritä rotatoida itse).
4. SPF-flagi: kirjoita `ACTION REQUIRED`-rivi käyttäjälle DNS-puolen fixistä Resendin ohjeiden mukaisesti (käyttäjä lisää itse domain-rekisteröijällä).
5. Lisätä `npm run security:scan` -skripti joka ajaa grepin keskeisille avain-patterneille ja failaa CI:n jos jotain löytyy → estää regression.

---

## UPDATE 1: Hardcoded-secrets sweep (grep-passi)

**Tee nämä grepit repon juuressa. Listaa KAIKKI osumat, älä muuta vielä mitään:**

```bash
# Stripe / LemonSqueezy
grep -rn "sk_live_" --exclude-dir=node_modules --exclude-dir=.git .
grep -rn "sk_test_" --exclude-dir=node_modules --exclude-dir=.git .
grep -rn "pk_live_" --exclude-dir=node_modules --exclude-dir=.git .
grep -rn "whsec_"   --exclude-dir=node_modules --exclude-dir=.git .

# OpenAI
grep -rEn "sk-[A-Za-z0-9]{20,}" --exclude-dir=node_modules --exclude-dir=.git .
grep -rEn "sk-proj-[A-Za-z0-9]{20,}" --exclude-dir=node_modules --exclude-dir=.git .

# Resend
grep -rEn "re_[A-Za-z0-9]{20,}" --exclude-dir=node_modules --exclude-dir=.git .

# Supabase
grep -rEn "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}" --exclude-dir=node_modules --exclude-dir=.git .
grep -rn "service_role" --exclude-dir=node_modules --exclude-dir=.git .
grep -rEn "https://[a-z0-9]+\.supabase\.co" --exclude-dir=node_modules --exclude-dir=.git .

# AWS / generics
grep -rEn "AKIA[0-9A-Z]{16}" --exclude-dir=node_modules --exclude-dir=.git .
grep -rEn "Bearer [A-Za-z0-9._-]{20,}" --exclude-dir=node_modules --exclude-dir=.git .

# Yleinen ympäristömuuttujien kovakoodaus
grep -rEn "process\.env\.[A-Z_]+\s*=\s*[\"']" --exclude-dir=node_modules --exclude-dir=.git .
grep -rEn "(api[_-]?key|secret|password|token)\s*[:=]\s*[\"'][A-Za-z0-9_-]{16,}" --include="*.js" --include="*.mjs" --include="*.ts" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git .
```

**Varmista lisäksi git-historia:**

```bash
# Onko historiassa koskaan ollut .env committoituna?
git log --all --full-history -- .env .env.local .env.production

# Onko committeja jotka lisäsivät secret-näköisiä stringejä?
git log --all -p -S "sk_live_" --source --remotes
git log --all -p -S "re_" --source --remotes -- "*.js" "*.mjs"
git log --all -p -S "service_role" --source --remotes
```

Kirjaa tulokset tähän formaattiin → IMPROVEMENTS.md:hen `[2026-MM-DD L-SECURITY-1] grep:` -rivinä:

| Tiedosto:rivi | Pattern | Onko oikea avain vai placeholder/test? | Toimenpide |
|---|---|---|---|
| esim. `routes/stripe.js:42` | `whsec_***` | OIKEA prod webhook-secret | siirrä `process.env.STRIPE_WEBHOOK_SECRET`:iin + ROTATE |

Jos pattern on placeholder ("YOUR_KEY_HERE", "xxx", commenteissa esimerkkinä), merkitse rivi mutta älä rotatoi.

---

## UPDATE 2: Refactor — kaikki avaimet env-muuttujiin

Jokaiselle UPDATE 1:n löydökselle joka on **oikea avain**:

1. Korvaa kovakoodattu arvo `process.env.<NAME>`-viittauksella. Käytä **tasan sitä nimeä** joka on jo `.env.example`:ssa, jos sopiva muuttuja on olemassa. Muuten lisää uusi rivi `.env.example`:en (tyhjällä arvolla) ja käytä sitä.
2. Lisää tiedoston yläosaan (jos puuttuu) startup-validaatio yhdellä pakollisella kentällä:
   ```js
   if (!process.env.STRIPE_WEBHOOK_SECRET) {
     throw new Error("Missing STRIPE_WEBHOOK_SECRET in environment");
   }
   ```
   Älä lisää validaatiota optionaalisille debug-flageille. Pakolliset on listattu `.env.example`:ssa ilman `# optional`-kommenttia.
3. Jos avain oli oikeasti repossa (ei pelkästään testiarvona), **lisää IMPROVEMENTS.md:hen `ACTION REQUIRED: rotate <SERVICE> key — was committed in history at <commit-sha>`**. Älä yritä itse käydä provideri-dashboardissa.

**Erityishuomio Supabase:** `supabase.js` käyttää `SUPABASE_URL` + `SUPABASE_ANON_KEY` clientille (turvallinen julkaista) ja **`SUPABASE_SERVICE_ROLE_KEY`** server-only-operaatioihin. Jos service-role-avain on koskaan vuotanut clientille (esim. `app.js`, `index.html`, mikä tahansa staattinen tiedosto), se on KRIITTINEN — rotatoitava heti ja kirjattava IMPROVEMENTS.md:hen punaisella.

---

## UPDATE 3: .gitignore + .env.example -hygienia

1. Varmista `.gitignore` sisältää:
   ```
   .env
   .env.local
   .env.*.local
   .env.production
   .env.development
   *.pem
   *.key
   ```
2. `.env.example` pitää sisältää **jokainen** muuttuja jota koodi lukee `process.env`:llä. Aja:
   ```bash
   grep -rEho "process\.env\.[A-Z_][A-Z0-9_]+" --exclude-dir=node_modules --exclude-dir=.git . | sort -u
   ```
   Vertaa listaa `.env.example`:n riveihin. Lisää puuttuvat (tyhjällä arvolla + lyhyt kommentti).
3. Jos jokin `.env.example`-rivi viittaa muuttujaan jota mikään tiedosto ei enää lue, poista rivi (legacy puhdistus).
4. `.env.example` pitää sisältää SELKEÄ kommentti yläosassa:
   ```
   # Copy this file to .env and fill in real values.
   # NEVER commit .env. Service-role keys grant full DB access — keep them server-side only.
   ```

---

## UPDATE 4: SPF DNS -finding — ACTION REQUIRED

Tämä on koodin ulkopuolinen fix. Tehtäväsi:

1. Tarkista `email.js` ja `routes/email.js` — mikä provider on oikeasti käytössä (Resend per CLAUDE.md). Tarkista mitä Resendin oma SPF-include on (Resend vaatii nykyään oman record-setupin jossa on `_dmarc` + custom domain verification, EI google-includea).
2. Kirjoita IMPROVEMENTS.md:hen tarkka ACTION REQUIRED -lohko:
   ```
   ## ACTION REQUIRED — DNS (SPF) — käyttäjä tekee itse domain-rekisteröijällä

   Checkvibe-ilmaisscan flaggasi: domainilla espanja-v2-1.vercel.app ei ole SPF-recordia.
   Koska sähköposti lähtee Resendin kautta, oikea SPF-record EI ole Googlen include.

   Lisää domain-rekisteröijällä TXT-record:
     Name:  @ (tai puheon root-domain)
     Type:  TXT
     Value: v=spf1 include:amazonses.com ~all

   Lisäksi lisää Resendin vaatimat:
     - DKIM CNAME -recordit (Resend dashboard antaa tarkat arvot)
     - _dmarc TXT-record:
       v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@<sinun-domain>; pct=100
   Verifioi 24h kuluttua: https://mxtoolbox.com/spf.aspx
   ```
3. Älä yritä deployata DNS-muutoksia itse. Vercelin DNS-paneeli on saatavilla mutta käyttäjä haluaa nähdä mitä tapahtuu.

**Huom:** jos käyttäjä käyttää oikeasti Vercel-domainia (`*.vercel.app`) eikä custom-domainia, SPF ei ole säädettävissä — silloin email-from-osoitteen pitää olla customilla domainilla, ja se on suositus käyttäjälle. Kirjaa tämä myös ACTION REQUIRED:in alle.

---

## UPDATE 5: `npm run security:scan` — regressio-este

Lisää `package.json`:iin uusi script joka ajaa kovakoodattujen salaisuuksien grepin ja exitoi != 0 jos osumia löytyy:

```json
"scripts": {
  "security:scan": "node scripts/security-scan.mjs"
}
```

Luo `scripts/security-scan.mjs`:

```js
#!/usr/bin/env node
// Fails (exit 1) if hardcoded secrets are detected in tracked source.
// Patterns kept narrow to avoid noise on legitimate test fixtures.

import { execSync } from "node:child_process";

const PATTERNS = [
  { name: "Stripe live secret", re: /sk_live_[A-Za-z0-9]{16,}/ },
  { name: "Stripe webhook secret", re: /whsec_[A-Za-z0-9]{16,}/ },
  { name: "OpenAI key", re: /sk-(proj-)?[A-Za-z0-9]{20,}/ },
  { name: "Resend key", re: /re_[A-Za-z0-9]{20,}/ },
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Supabase service role JWT", re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ },
];

const files = execSync(
  "git ls-files | grep -Ev '^(node_modules/|\\.git/|package-lock\\.json|references/|.*\\.png$|.*\\.jpg$|.*\\.svg$)'",
  { encoding: "utf8" }
).trim().split("\n").filter(Boolean);

const findings = [];
for (const f of files) {
  let content;
  try { content = execSync(`git show HEAD:${f}`, { encoding: "utf8" }); }
  catch { continue; }
  for (const { name, re } of PATTERNS) {
    const m = content.match(re);
    if (m) findings.push(`${f}: ${name} → ${m[0].slice(0, 12)}…`);
  }
}

if (findings.length) {
  console.error("❌ Hardcoded secrets detected:");
  for (const x of findings) console.error("  " + x);
  process.exit(1);
}
console.log("✓ No hardcoded secrets detected.");
```

Aja `npm run security:scan` lopuksi paikallisesti — sen pitää exitoida 0:lla. Jos exit on 1, palaa UPDATE 1:een ja siivoa loputkin osumat.

---

## UPDATE 6: AGENT_STATE.md + IMPROVEMENTS.md päivitys

1. **IMPROVEMENTS.md** uusi blokki, prefix `[2026-MM-DD L-SECURITY-1]`, sisältäen:
   - Yhteenveto: monta kovakoodattua avainta löytyi, monta env-muuttujaa lisättiin .env.example:iin
   - Lista rotatoitavista avaimista (jos yhtään)
   - SPF ACTION REQUIRED -linkki
   - npm-script `security:scan` lisätty
2. **AGENT_STATE.md**:
   - `Last completed loop:` → `L-SECURITY-1 (hardcoded-secrets sweep + .env hygienia + npm run security:scan + SPF ACTION REQUIRED)`
   - `Next loop:` → `L-SECURITY-2` (jonka käyttäjä määrittelee seuraavaksi — ehdota lyhyesti: auth/middleware-audit, Supabase RLS-audit, rate-limit-katto, webhook-allekirjoitusten verifiointi)
3. **ÄLÄ bumppaa SW** — tämän loopin muutokset eivät koske STATIC_ASSETSia (vain server-side koodia + .env + scripts/).

---

## Verifiointi (loop ei pääty ennen näitä)

1. `npm run security:scan` → exit 0
2. `npm test` → kaikki vitest-testit edelleen vihreänä (auth/route-testien pitäisi yhä toimia kun avaimet ovat env-muuttujia — testien `beforeAll` saattaa joutua asettamaan placeholder-arvot `process.env`:iin)
3. `node --check` jokainen muutettu .js / .mjs -tiedosto
4. `git status` — varmista ettei `.env` ole stagattuna
5. Tarkista että `npm start` käynnistyy puhtaasti placeholder-`.env`:llä (eli kaikki uudet `throw new Error`-validaatiot kiinnioavat oikeasti)

---

## Mitä EI saa tehdä tässä loopissa

- ÄLÄ rotatoi avaimia itse — käyttäjä tekee sen provider-dashboardeissa
- ÄLÄ koske DNS:ään — käyttäjä tekee SPF/DKIM/DMARC-recordit itse
- ÄLÄ poista `.env`-tiedostoa käyttäjän koneelta (vain `.gitignore`-rivi)
- ÄLÄ kirjoita uusia OpenAI-kutsuja tai UI:ta — tämä on puhtaasti turvallisuuskierros
- ÄLÄ koske landing-pageen
- ÄLÄ bumppaa SW
- ÄLÄ yritä korjata Checkvibe:n 27 paywallattua finding:iä — ne tulevat seuraavissa L-SECURITY-loopeissa systemaattisesti (auth, RLS, rate limit, headers, CSP, webhook-sigit, jne.)

---

## Lopputulos käyttäjälle

Loopin lopussa raportoi käyttäjälle yhdellä viestillä:
- Montako kovakoodattua avainta löytyi ja korjattiin
- Lista avaimista jotka pitää rotatoida (jos yhtään), kopioitava muoto kirjattava-ystävällisesti
- SPF/DKIM/DMARC-toimenpiteet listana, kopioitavissa suoraan domain-rekisteröijän paneeliin
- `npm run security:scan` -käyttöohje
- Ehdotus seuraavasta L-SECURITY-loopista
