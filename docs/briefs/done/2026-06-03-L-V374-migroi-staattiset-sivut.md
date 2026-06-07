# L-V374 — Migroi staattiset sivut systeemiin (pricing, login, privacy, terms, refund, 404, per-kieli)

**Päivä:** 2026-06-03
**Prioriteetti:** P2 — yhtenäisyys, matala riski (staattinen HTML).
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer` (jos kosket näkyvään suomi-tekstiin)
**Riippuvuus:** **V371 + V372 ensin** (tokenit + komponentit). Voi ajaa rinnan V373:n kanssa tai sen jälkeen.

## Orkestraatio (token-budjetti)
Tämä on toistuvaa työtä monelle sivulle → ihanteellinen fan-out. Koordinaattori jakaa sivut subagenteille rinnakkain, kokoaa tiiviit tulokset. Älä lue kaikkia sivuja main-loopiin.
**Malli per tehtävä:** triviaali → Haiku, standardi → Sonnet, vaikea/maku → Opus.
**Tämä vaihe:** **fan-out yksi Sonnet-subagentti per sivu RINNAKKAIN** (pricing/privacy/terms/refund/per-kieli). Triviaalit sivut (404, offline, diagnose) → Haiku. Koordinaattori (Sonnet riittää) varmistaa johdonmukaisuuden lopuksi.

---

## 🛑 PYHÄ RAJA — älä koske app-puoleen
Muutat VAIN staattisia HTML-sivuja. ÄLÄ muokkaa `app.html`, `app.js`, `js/**`. HUOM: jos kirjautuminen/rekisteröinti elää `app.html`:n sisällä (ei omana staattisena sivuna) → JÄTÄ se rauhaan, älä siirrä sitä tähän. Jos muutos koskettaisi app-puolta → STOP ja kysy.

## Tavoite
Tuo KAIKKI staattiset sivut samaan Tailwind-systeemiin ja jaettuihin komponentteihin → johdonmukainen ilme, yksi muutos pätee kaikkialle (Marcelin vaatimus). Nämä ovat matalan riskin sivuja koska ne ovat staattista HTML:ää ilman monimutkaista app-logiikkaa.

## Sivut (KAIKKI näistä)
- `pricing.html` (hinnoittelu)
- kirjautuminen/rekisteröinti (login/register — etsi missä se elää: oma sivu vai app.html-näkymä; jos osa app.html:ää → siirtyy V375:een, mainitse)
- `privacy.html`, `terms.html`, `refund.html`
- `404.html`, `offline.html`, `diagnose.html`
- `public/landing/espanja.html`, `ranska.html`, `saksa.html` (per-kieli-sivut)

## Tehtävät
1. Vaihda jokainen sivu käyttämään jaettua nav + footer + nappi/kortti/pilli-komponentteja (V372). Sama yläpalkki ja footer kaikkialla.
2. Sovella tokenit (cream/brick/keltainen/vihreä, Fredoka/Mulish, johdonmukainen spacing/radius/shadow).
3. Poista per-sivu-bespoke-CSS jota komponentit nyt kattavat (vältä duplikaattia, DRY).
4. Korjaa samalla aiemmin raportoitu: per-kieli-sivut eivät auenneet desktopilla (jos yhä rikki) — varmista että ne renderöivät 1440px + 390px.
5. Näkyvä suomi-teksti jota muutat → humanizer.

## Acceptance
- Jokainen listattu sivu käyttää jaettua nav/footeria + tokeneita; ilme johdonmukainen landingin kanssa.
- Per-kieli-sivut aukeavat desktopilla.
- Ei vaakavieritystä 390px millään sivulla.
- `npm run build` PASS, sw.js CACHE_VERSION bump, ei rikkinäisiä linkkejä/lomakkeita.
- Screenshot-vertailu ennen/jälkeen jokaisesta sivusta.

## Ulkopuolella
App-shell + oppimispolku + kurssisivut + app.html-sisäiset näkymät → V375 (riskein, viimeisenä).
