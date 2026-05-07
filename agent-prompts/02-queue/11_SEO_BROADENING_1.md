# 07 / 8 — L-SEO-BROADENING-1 — Abikurssi-keyword-strategia + vertailusisältö

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Edellyttää: 04_LANG_LANDINGS_1 shipped (per-language-landingit olemassa).
>
> **Strategia:** Ahrefs-data 2026-05-07 osoitti että lukiolaiset hakevat "abikurssi", ei "yo-koe valmennus", ja että "espanjan/saksan/ranskan abikurssi" on KD=0 ilman kilpailijoita. Tämä loop kaappaa rakopaikan + lisää vertailusisältöä joka kaappaa Worddive-branded-haut.

---

## 1. Lähtötilanne

`docs/seo-keywords.md` (luotu 2026-05-07) sisältää täyden Ahrefs-datan. TL;DR:

- "abikurssit" 150/kk, "abikurssi" 100/kk, KD=0
- "X abikurssi" (matikka, ruotsi, englanti, äidinkieli, fysiikka, kemia, biologia, yhteiskuntaoppi, terveystieto, psykologia) — kaikki kategoriat ovat täytetyt **paitsi kielet**
- Espanja/saksa/ranska abikurssi-haut eivät vielä tuota volyymiä koska ei ole sisältöä — mutta KD=0 ja kilpailija-tyhjiö = nopea kaappaus
- Worddive on lähin kilpailija (60/kk branded haku, 50/kk "kokemuksia" haku) — vertailusisältö kaappaa intentin

LANG_LANDINGS_1 toi `/espanja-yo-koe`, `/saksa-yo-koe`, `/ranska-yo-koe`. Tämä loop:
1. Lisää title/meta/H2-tageihin "abikurssi"-termiä luonnollisesti
2. Luo 3 vertailu-blog-postausta (Worddive vs Puheo per kieli)
3. Lisää recurring-yearly-blog-templaten "Lyhyt espanja YO-koe 2026 — pisterajat"
4. Lisää sisäisiä linkejä kielten välillä (auktoriteetti-jako)

---

## 2. Scope

### Worker A — On-page SEO landing-sivuilla (Sonnet)

Tiedostot: `public/landing/{espanja,saksa,ranska}.html` (tai mitä LANG_LANDINGS-1 nimikkenä shippasi)

1. **Title-tag:** "Espanjan abikurssi netissä — YO-koetta varten | Puheo" (ja vastaavat saksa/ranska)
2. **H1:** pidä ennallaan jos sopiva, tai lisää H2 alle: "Espanjan abikurssi yo-koetta varten — adaptiivinen, AI-arvioitu"
3. **Meta description:** sisällytä "abikurssi" + "lyhyt yo" + "valmennus" — esim. "Suomen ainoa AI-pohjainen espanjan abikurssi YO-koetta varten. Lyhyt oppimäärä, adaptiivinen vaikeus, 8 kurssia alkeista huipulle."
4. **Schema.org Course-markup:** lisää tai päivitä, `name`-kenttään "Espanjan abikurssi yo-koetta varten"
5. **Sisäiset linkit:** jokainen landing linkkaa kahteen muuhun kieleen footer-linkillä "Tutustu myös: Saksan abikurssi · Ranskan abikurssi"

### Worker B — Vertailu-blog-postaukset (Sonnet)

Luo `public/blogi/vertailu/{worddive-vs-puheo-espanja,worddive-vs-puheo-saksa,worddive-vs-puheo-ranska}.html` tai jos blogi-rakenne ei ole olemassa → `blog/`-juuren alle.

Per kieli (~800 sanaa, suomeksi):

- H1: "Worddive vs Puheo — kumpi paremmin espanjan/saksan/ranskan YO-kokeeseen?"
- Sisältö-runko (rehellinen, ei panettelu):
  - Lyhyt yhteenveto kummastakin
  - **Vertailutaulukko:** YO-koe-spesifinen sisältö, AI-arviointi, hinta, oppituntimäärä, lähestymistapa
  - **Puheon vahvuudet:** YO-rubriikkiin perustuva arviointi, 8 valmista kurssia, lyhyt oppimäärä, adaptiivinen vaikeus
  - **Worddiven vahvuudet:** isompi brändi, monikielinen, gamification
  - Lopuksi CTA: "Kokeile Puheoa ilmaiseksi → 1 demo-oppitunti"
- **Älä keksi yksityiskohtia Worddivesta jos et ole varma** — käytä julkista markkinointi-tietoa, älä ai-hallusinoituja faktoja
- Schema.org Article-markup
- Linkit takaisin pää-landingiin

### Worker C — Recurring "lyhyt X YO-koe 2026" -blogit (Sonnet)

Luo `public/blogi/yo-koe/{lyhyt-espanja-yo-2026,lyhyt-saksa-yo-2026,lyhyt-ranska-yo-2026}.html`.

Per kieli (~600 sanaa):

- H1: "Lyhyt espanja YO-koe 2026 — pisterajat, rakenne ja valmistautuminen"
- Sisältö:
  - Mitä lyhyt oppimäärä YO:ssa tarkoittaa
  - 2025 pisterajat (käytä julkista YTL-dataa, esim. ylioppilastutkinto.fi → linkki ja attribuution)
  - Kokeen rakenne (tehtävätyypit, painotus)
  - Aikataulu: kevään 2026 ja syksyn 2026 päivämäärät
  - 5 vinkkiä valmistautumiseen
  - CTA: "Aloita Puheon abikurssi ilmaiseksi"
- **Tällaisten on tarkoitus uudistua vuosittain** — lisää HTML-kommentti `<!-- Päivitä joka kevät YTL:n julkaistuista pisterajoista -->`-merkintä
- Lisää frontmatter-tyyppinen rakenne (`<meta>`-tageihin) joka ilmoittaa `last_updated`

### Worker D — Sitemap + robots + sisäinen-linkitys (Sonnet, lyhyt)

1. Päivitä `public/sitemap.xml` sisältämään uudet blog-sivut
2. Tarkista `public/robots.txt` ei estä blogia
3. Lisää nav-tasolla "Blogi"-linkki landing-sivuille → `/blogi/`-hub-sivu joka listaa kaikki postaukset
4. Lisää JSON-LD `BreadcrumbList` jokaiseen blog-postaukseen

---

## 3. Acceptance criteria

- [ ] Jokaisen landing-sivun title sisältää "abikurssi"
- [ ] Meta-descriptionissa "abikurssi" + "yo-koe" + "valmennus"
- [ ] 3 vertailu-postausta + 3 yo-koe-2026-postausta luotu (yhteensä 6)
- [ ] Sitemap.xml päivitetty
- [ ] Schema.org-markup validoituu Schema.org Validatorissa (visuaalinen tarkistus)
- [ ] Sisäiset linkit kielten välillä (footer)
- [ ] `npm run test:bug-scan` PASS — uusilla blog-URLeilla
- [ ] axe-core 0 critical/serious uusilla blog-sivuilla

---

## 4. Pois scopesta

- ❌ Google Ads -kampanjat (CAC ei paybackaa tällä volyymillä)
- ❌ Backlink-rakentaminen (= guest-post + outreach, oma loop myöhemmin)
- ❌ TikTok/Reels-sisältö (= 08_SOCIAL_CONTENT_PLAYBOOK)
- ❌ Vanhojen Worddive-pricing/feature-faktojen tarkistus webissä — käytä vain mitä on heidän etusivullaan; vältä spekulaatiota

---

## 5. Skill-set

- `puheo-finnish-voice` (kaikki copy)
- `frontend-design`, `design-taste-frontend` (blog-postausten visuaalit)
- `marketing/seo-page-architecture` jos olemassa
- `webapp-testing` ei skillinä — `npm run test:bug-scan`

---

## Lopuksi
Tämä on **11 / 12** jonossa (`agent-prompts/02-queue/11_SEO_BROADENING_1.md`). Edellyttää 04 shipped.
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
