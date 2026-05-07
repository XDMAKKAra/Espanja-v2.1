# 04 / 6 — L-LANG-LANDINGS-1 — Per-language landing-sivut + post-login oletuskielisivu

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Tämä loop **edellyttää että 03_LANG_INFRA_1 on shipped** — landing-sivut käyttävät INFRA:n routausta + `state.language`-state-koneistoa.
>
> **Strategia:** sivut tehdään **valmiiksi nyt** vaikka saksa/ranska eivät ole sisällöllä valmiina. SEO-indeksoituminen kestää 2-3 viikkoa, joten kun sisältö myöhemmin kirjoitetaan, sivut ovat jo Googlessa. DE/FR-landingit näyttävät "Tulossa pian — liity wait-listille" -tilaa kunnes sisältö julkaistaan.

---

## 1. Konteksti

Strategia (ROADMAP.md): SEO + sosiaalinen media on go-to-market. Tämä loop tekee:

1. **Per-language landing-sivut SEO-haulle:**
   - `puheo.fi/espanja-yo-koe` (nykyinen `index.html` muotoutuu tähän)
   - `puheo.fi/saksan-yo-koe` (uusi)
   - `puheo.fi/ranskan-yo-koe` (uusi)
   - URLien semanttinen muoto on tärkein SEO-signaali tässä markkinassa
2. **Generic landing `puheo.fi/`:** lyhyt hub joka esittelee kolme kieltä → klikkaus per-kielisivulle
3. **Post-login oletuskielisivu:** kun kirjautunut käyttäjä, jolla on `target_language` asetettu, avaa appin, hänen ei tarvitse valita kieltä — ohjautuu suoraan oman kielensä SPA-tilaan

**Käyttäjän eksplisiittinen pyyntö:** "kun käyttäjä valitsee jonkun kielen aina kun hän kirjautuu hän on sen kielen sivulla eikä tarvitse valita."

---

## 2. Mitä tämä loop EI tee

- ❌ Älä rakenna saksan/ranskan kurssisisältöä — landing-sivuilla on "Tulossa pian — liity wait-listille" -tila niille
- ❌ Älä koske onboardingiin (oma loop)
- ❌ Älä vaihda nykyistä `puheo.fi/`-domainia tai SEO-rakennetta lopullisesti — luo uudet routet, älä riko vanhoja
- ❌ Älä luo erillisiä Vercel-deploymenttejä per kieli — sama deployment, eri reittejä
- ❌ Älä rakenna sisäänkirjautuneen näkymän kielinvalintaa erikseen — onboarding tallentaa sen, app käyttää sitä
- ❌ Älä keksi sisältöä saksan/ranskan landing-sivuille — käytä samaa rakennetta kuin espanjalla, mutta sisältö "Tulossa N kk:ssa" -tilassa konkreettisesti

---

## 3. Skill-set

### Puheo-spesifiset
- `puheo-finnish-voice`, `puheo-screen-template`, `ui-ux-pro-max`

### Frontend
- `frontend-design`, `design-taste-frontend`, `redesign-existing-projects` — kun replikoidaan espanja-landing kahdelle uudelle kielelle, tee niin että EI ole copy-paste, vaan visuaalisesti erotettavissa (eri accent-väri per kieli, eri kuvitus / hero-element)
- `high-end-visual-design`

### SEO
- `marketing/seo-page-architecture` jos olemassa, muuten käytä omaa harkintaa: title, h1, meta-description, schema.org Course-markup, sitemap.xml-päivitys, robots.txt-tarkistus

### 21st.dev-sourcing
- Multi-language hub-sivu (3 isoa korttia per kieli) — Vercel docs language-switcher, Notion templates index
- "Tulossa pian" -waitlist-modal — Linear waitlist, Read.cv coming soon

---

## 4. Routing-rakenne

Vercel-projektin reitit (vercel.json + filesystem):

```
/                       → public/index.html (uusi geneerinen hub)
/espanja-yo-koe         → public/landing/espanja.html
/saksan-yo-koe          → public/landing/saksa.html
/ranskan-yo-koe         → public/landing/ranska.html
/app                    → app.html (SPA, vaatii kirjautumisen)
/api/*                  → routes/* (ennallaan)
```

Vanha `index.html` siirtyy → `public/landing/espanja.html` mahdollisin pienin muutoksin. Uusi `index.html` on geneerinen hub.

**Login-jälkeen oletusreitti:**
- `app.html` lataus → tarkistaa `users.target_language`-kentän
- Jos asetettu → asettaa appin language-stateen, lataa kurssidatan oikealta kieleltä, ohittaa kielinvalintaruudun
- Jos puuttuu (vanha käyttäjä ennen onboarding-redesignia) → ohjaa onboardingin vaiheeseen 1 (kielinvalinta)

`js/main.js`:n alkuun:
```javascript
const userLang = await fetchUserLanguage(); // GET /api/user/me
if (!userLang) {
  redirectTo('/onboarding');
} else {
  setActiveLanguage(userLang);
  loadCurriculum(userLang);
}
```

---

## 5. Sivurakenne per kieli (replikoitavissa)

Käytä Espanjan landingia pohjana, mutta säädä:

| Asia | Espanja | Saksa | Ranska |
|---|---|---|---|
| Status | "Avoinna nyt" CTA aktiivinen | "Tulossa syksyllä 2026" + waitlist | "Tulossa kevät 2027" + waitlist |
| Accent-väri | nykyinen mint | esim. lämmin sininen | esim. burgundi/syvä punainen |
| Hero-tagline | "Pärjää espanjan YO-kokeessa." | "Pärjää saksan YO-kokeessa." | "Pärjää ranskan YO-kokeessa." |
| Pricing | aktiivinen | "Saatat lukita ennakkohinnan €19/lukukausi liittyessäsi waitlistille" | sama |
| Kurssit-osio | 8 kurssia näkyvissä | 8 placeholder-korttia "Tulossa" | sama |
| Tervehdys-mock (hero) | "¡Hola!" | "Hallo!" | "Bonjour!" |

Kaikki kolme käyttävät **samaa CSS-tokenia** (`css/landing-tokens.css`) + jaettu `css/landing.css` + per-kieli CSS-overrides (esim. accent-värit) `css/landing-de.css`, `css/landing-fr.css`.

Älä duplikoi koko landing.css:n sisältöä — ekstraktoi jaettu osa, lisää vain delta per kieli.

---

## 6. Geneerinen hub `puheo.fi/`

Uusi `index.html` joka korvaa nykyisen Espanja-keskeisen.

Sisältö (lyhyt, hub-tason):
- Nav (sama kuin per-kieli-sivuilla)
- Hero: "Tehoa espanjan, saksan ja ranskan YO-kokeisiin." + 1 sub-rivi
- 3 isoa kielikorttia (sama design kuin onboardingin vaiheessa 1):
  - Espanja → /espanja-yo-koe
  - Saksa → /saksan-yo-koe (badge "Tulossa")
  - Ranska → /ranskan-yo-koe (badge "Tulossa")
- "Miten Puheo toimii" -lyhyt 3-step-osio (kysy kielikohtaisilta sivuilta yksityiskohdat)
- Footer

~150-200 riviä HTML max. Älä lisää pricing-osiota tähän — se on per-kielisivulla.

---

## 7. SEO-tekniset

- `<title>` per sivu: "Espanjan YO-koe valmennus | Puheo" (vastaava saksalle/ranskalle)
- Meta description: 150-160 merkkiä, sisältää kielen + "YO-koe valmennus" + "AI-arviointi" + "lyhyt oppimäärä"
- `<h1>` per sivu sisältää kielen + "YO-koe"
- Schema.org `Course` JSON-LD per kieli-sivu
- `public/sitemap.xml` listaa kaikki neljä HTML-sivua (`/`, `/espanja-yo-koe`, `/saksan-yo-koe`, `/ranskan-yo-koe`)
- `public/robots.txt` sallii kaikki paitsi `/app`, `/api`, `/onboarding`
- Open Graph -tagit per kieli (kuva, otsikko, kuvaus) — käytä olemassa olevaa hero-mockup-screenshotia tai luo per-kieli-versio

---

## 8. Wait-list-mekanismi (saksa + ranska)

Onboarding-loop on jo perustanut `onboarding_waitlist`-taulun. Tämä loop lisää:

- Saksa/ranska-landing-sivuilla "Liity waitlistille" -nappi → modaali joka kysyy email
- `POST /api/waitlist` (uusi) → tallentaa rivin (email, language, source = "landing")
- Email-kuittaus käyttäjälle: "Saat ilmoituksen kun X-kielinen Puheo avautuu" — Resend-templatella, älä riko olemassa olevaa email-järjestelmää

Mukana näkyvä laskuri: "X opiskelijaa odottaa saksan kurssia" — laskettu real-timeissa `onboarding_waitlist`-taulusta. **Vain jos rivit ovat aitoja**, älä keksi numeroita.

---

## 9. Verifiointi

1. `graphify update .`
2. Playwright screenshot kaikilta 4 sivulta (geneerinen hub + 3 kielisivua) @ 1440 + 768 + 375
3. axe-core 0 violations
4. Lighthouse SEO-score ≥95 per sivu
5. Tarkista kaikki sisäiset linkit (`/`, `/espanja-yo-koe`, `/saksan-yo-koe`, `/ranskan-yo-koe`, `/app`, `/onboarding`) eivät 404:aa
6. End-to-end: rekisteröidy onboardingin kautta espanja-target-languagella → kirjaudu ulos → kirjaudu sisään → varmista että app avautuu suoraan espanja-tilassa
7. End-to-end: vieraile saksa-landingilla → liity waitlistille → varmista `onboarding_waitlist`-rivi syntyy
8. SW-bumppi (uusia HTML-tiedostoja → STATIC_ASSETS päivitys)
9. `sitemap.xml` validoituu (W3C / Google Search Console paste)
10. IMPROVEMENTS.md-rivi mainitsee SEO-tilan + Lighthouse-skoorit

---

## 10. Guardrailit

- **ÄLÄ committaa, älä deployaa**
- **ÄLÄ riko Espanjan landing-sivun nykyisiä anchor-linkkejä** (vanhat #-anchorit pitää säilyä uudessa /espanja-yo-koe-sivussa)
- **ÄLÄ kirjoita saksan/ranskan kurssisisältöä** — placeholder-tila kaikkialla
- **ÄLÄ keksi waitlist-laskuria** — show real count tai älä näytä lainkaan
- **ÄLÄ luo uutta deployment-konfiguraatiota** Vercelliin — käytä olemassa olevaa, lisää vain reittejä `vercel.json`:iin

---

## 11. Cleanup-passi: Tähtäin → Mestari + €29 → €19 (shipattuihin tiedostoihin)

Onboarding-loop shippasi nimen "Tähtäin" ja hinnan €29/kk ennen kuin nimi/hinta päivitettiin. Tämä passi siivoaa jäljet **ennen** pricing-loopia.

### 12.1 Pakollinen scan
Aja repossa (ei docs/archive/):

```bash
grep -rn -i "Tähtäin\|tähtäim\|29 €\|€29\|49 €\|€49\|kesäpaketti\|pro 9,99\|9.99" \
  --include="*.md" --include="*.js" --include="*.html" --include="*.css" \
  --exclude-dir=docs/archive --exclude-dir=node_modules .
```

### 12.2 Tunnistetut esiintymät (käyttäjä tarkistanut 2026-05-07)

**A. Suorat siivottavat tässä loopissa:**
| Tiedosto | Sijainti | Korjaus |
|---|---|---|
| `app.html` | rivi ~614 (`<a class="ob3-link"...>Avaa kaikki Tähtäimellä alkaen 29 €/kk`) | → `Avaa kaikki Mestarilla alkaen 19 €/kk` |
| `js/screens/onboardingV3.js` | rivi 7 (kommentti `"open all with Tähtäin" links to /pricing`) | → `"open all with Mestari" links to /pricing` |

**B. ÄLÄ KOSKE — legitimaatti sanasto:**
| Tiedosto | Sijainti | Selitys |
|---|---|---|
| `data/courses/kurssi_6/lesson_9.json` | "lyhyen tähtäimen taloudelliset edut" | Espanjan idiomin "a corto plazo" suomenkielinen vastine — opetussisältö |
| `data/courses/kurssi_6/lesson_11.json` | "pitkällä/lyhyellä tähtäimellä" | "a largo/corto plazo" -idiomi — opetussisältö |
| Mahdolliset muut `data/courses/**` osumat | sanaston `fi`-kentät | EI muuteta — opetussisältö |

**C. Siirtyy L-PRICING-REVAMP-1:n vastuulle (älä kosketse tässä):**
| Tiedosto | Tila |
|---|---|
| `pricing.html` | Sisältää VANHAN "kesäpaketti €29 / Pro €9,99" -mallin. Ei 3-tier-yhteensopiva. Pricing-loop kirjoittaa kokonaan uudelleen. |
| `routes/email.js:300` | "Kesäpaketti 29 €" -email-template. Pricing-loop päivittää (tai poistaa). |
| `onboarding/PAYWALL.md` | Vanha dokumentaatio kesäpaketti-mallista. Pricing-loop arkistoi `docs/archive/`:een. |
| `onboarding/EMAILS.md` | Sama, vanha email-dokumentaatio. |

### 12.3 Yleinen rename-säännöstö (jos scan löytää lisää)
Sovella vain jos esiintymä viittaa selvästi tier-nimiin / hintoihin (ei yleisidiomiin):
- `Tähtäin` → `Mestari`
- `Tähtäimellä` → `Mestarilla`
- `Tähtäimen` → `Mestarin`
- `Tähtäimeen` → `Mestariin`
- `tahtain` (slug/key) → `mestari`
- `29 €/kk` (Mestarin hinta) → `19 €/kk`
- `49 €` (Mestari-paketti) → `39 €`

### 12.3 SW-bumppi
`app.html` on STATIC_ASSETS-listalla → `npm run bump:sw -- --fix` cleanup-commitin jälkeen.

### 12.4 Verifiointi
- `grep -rn "Tähtäin\|tähtäim" --exclude-dir=docs/archive --exclude-dir=node_modules .` → 0 hits
- `grep -rn "29 €/kk\|€29/kk" --exclude-dir=docs/archive --exclude-dir=node_modules .` → 0 hits onboarding-yhteydessä
- Onboardingin reveal-vaihe näyttää "Avaa kaikki Mestarilla alkaen 19 €/kk" oikein
- Pricing-link toimii (vie #hinnoittelu-anchoriin tai /pricing-routeen)

### 12.5 Cleanup-commit erillisenä
Tee tämä erillisenä committina ENNEN per-language landing-sivu -työtä, jotta diff on selkeä käyttäjän reviewille:
- Commit 1: "Tähtäin → Mestari + 29€ → 19€ rename"
- Commit 2-N: per-language landing -työ

---

## 12. Lopputuotteen kriteeri

Käyttäjä:
1. Avaa puheo.fi/saksan-yo-koe → kokee aitoa "saksan YO-prep -sivua", ei kopiota espanjan sivusta
2. Liittyy waitlistille → saa email-vahvistuksen
3. Kirjautuu sisään → laskeutuu suoraan oman kielensä SPA-tilaan, ei kysytä kieltä uudelleen
4. Google-haku "saksan yo-koe valmennus" → Lighthouse SEO 95+, structured data validoituu, sivun pitäisi indeksöityä 2 viikossa


---
## Lopuksi
Tämä on **04 / 6** jonossa (`agent-prompts/02-queue/04_LANG_LANDINGS_1.md`). Edellyttää: 03_LANG_INFRA_1 shipped.
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
