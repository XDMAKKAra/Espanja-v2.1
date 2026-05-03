# Live audit — espanja-v2-1.vercel.app/app.html

**Päivä:** 2026-05-03
**Skanneri:** Chrome MCP, testpro123@gmail.com (Pro)
**Konteksti:** Käyttäjän palaute "Oma sivu on ruma, sivut/tehtävät aukeavat hitaasti."

---

## TL;DR — neljä asiaa joita pitää korjata heti

1. **Koeharjoitus käyttää natiivia `window.confirm()`-dialogia** keskeneräisen kokeen jatkamiseen ja "Cancel" jättää käyttäjän umpikujaan ("Sinulla on jo aktiivinen koe" → "Yritä uudelleen" → sama virhe ikuisesti). (P0)
2. **Dashboardin Aktiivisuus-heatmap renderöityy 5 mustana laatikkona** kun käyttäjällä ei ole vielä aktiviteettia — näyttää rikkinäiseltä, ei tyhjältä. (P0)
3. **Sanastoharjoituksen ensimmäisen kysymyksen lataus 4.2 sekuntia, palautteen lataus 3.1 sekuntia.** OpenAI-vastausaika dominoi. (P0)
4. **Hash-routing ei toimi kun harjoitus on auki** — `#/grammar`-URL muuttuu mutta sivu ei vaihdu, ja x-painike vie dashboardiin eikä Puheoppi-sivulle vaikka URL sanoi `#/grammar`. (P1)

---

## Suorituskykymittaukset (cold load)

| Sivu | Aika (ms) | Komm. |
|------|-----------|-------|
| `/app.html` (dashboard, koko shell) | 1339 | TTFB 164ms, DOM ready 1187ms |
| Sanasto-välilehti | 1191 | OK |
| Puheoppi-välilehti | 2189 | hidas |
| Verbisprintti-välilehti | 2203 | hidas |
| Luetun ymmärt.-välilehti | 2162 | hidas |
| Kirjoittaminen-välilehti | 2201 | hidas |
| Oppimispolku | 3158 | erittäin hidas |
| Sanastoharjoituksen Q1 (klik → kysymys ruudulla) | **4164** | KRIITTINEN |
| SR-arviointi → palaute näkyy | **3125** | KRIITTINEN |

### API-kutsujen kestot dashboardilla (initial load)

| Endpoint | Aika (ms) |
|----------|-----------|
| `/api/adaptive/status?mode=vocab` | 1094 |
| `/api/profile` | 902 |
| `/api/dashboard` | 875 |
| `/api/learning-path` | 707 |
| `/api/exam/history` | 489 |
| `/api/sr/count?language=spanish` | 475 |
| `/api/placement/status` | 450 |
| `/api/weak-topics?days=7` | 447 |
| `/api/sr/forecast?days=30` | 421 |
| `/api/config/public` | 349 (404 — turha pyyntö!) |
| `/api/push/vapid-key` | 347 |

**Yhteensä 11 sarjapyyntöä, joista 1 epäonnistuu 404:llä.** Kokonaisaika kun viimeinen API on takaisin: **~3.7s**.

### Resurssien kuormitus

- **18 erillistä CSS-tiedostoa** (style.css + 17 komponenttitiedostoa) ladataan jokaisella kylmällä latauksella
- **28 erillistä JS-tiedostoa** (main.js + screens/* + features/*)
- **2 Google Fonts -fonttiperhe** (Inter + DM Mono)
- Yhteensä 110+ resurssia, kokonaiskesto kunnes kaikki on ladattu: **~3.7s**

---

## P0-bugit (rikkinäistä, ei vain rumaa)

### 0. Koeharjoitus käyttää natiivia confirm()-dialogia + Cancel jättää umpikujaan

**Mitä näkyy:** Kun käyttäjällä on keskeneräinen koe ja hän menee Koeharjoitus-välilehdelle:

- **Vaihe 1:** Selaimen natiivi `window.confirm()` ponnahtaa: "espanja-v2-1.vercel.app says — Sinulla on keskeneräinen koe. Haluatko jatkaa sitä? [OK] [Cancel]". Vaaleansininen Chrome-default-tyyli, ei brändätty miltään puolen, näyttää phishing-popupilta. Käyttäjä joutuu tekemään yhden ylimääräisen klikkauksen ennen kuin pääsee mihinkään.

- **Vaihe 2 (jos painaa Cancel):** Tyhjä musta sivu, jossa keskellä lukee "Jokin meni pieleen — Kokeen luonti epäonnistui: Sinulla on jo aktiivinen koe." ja iso mintunvihreä "Yritä uudelleen →" -painike. Klikkaus → sama virhe palaa. **Käyttäjä on jumissa silmukassa**, koska "Yritä uudelleen" yrittää luoda uutta koetta, mutta backend palauttaa "sinulla on jo aktiivinen koe" -virheen.

**Miksi rikki — kaksi eri ongelmaa:**

- (a) **`window.confirm()` ei kuulu tuotteeseen joka maksaa Pro-tilauksesta.** Se rikkoo brändin, on saavutettavuusongelma (eri kontrasti, eri näppäinkäsittely), ja tyypillinen merkki teknisesta velasta jonka käyttäjät huomaavat heti. Pitäisi olla brändätty modaali, jossa on selkeä otsikko, selitys ("Sinulla on viime kerralta kesken Yo-koe — jatka siitä, mihin jäit") ja kaksi painiketta: "Jatka kesken olevaa" (primary) ja "Aloita uusi koe" (secondary, joka käytännössä hylkää vanhan).

- (b) **Cancel-haaran umpikuja on regressio:** "Yritä uudelleen" pitäisi joko (i) jatkaa olemassa olevaa koetta automaattisesti, (ii) tarjota käyttäjälle "Hylkää vanha ja aloita uusi" -nappi, tai (iii) viedä takaisin dashboardiin selkeällä viestillä "Sinulla on aktiivinen koe — jatka tästä" + linkki kokeeseen. Nykyinen tila kieltäytyy molempien toimintojen tekemisestä.

**Korjaus:**

`js/screens/exam.js` (tai mistä tämä logiikka tuleekin):

```js
// Korvaa tämä:
if (confirm('Sinulla on keskeneräinen koe. Haluatko jatkaa sitä?')) {
  resumeExam();
} else {
  startNewExam();  // <-- mutta backend torjuu tämän = umpikuja
}

// Tällä:
showModal({
  title: 'Sinulla on keskeneräinen Yo-koe',
  body: 'Voit jatkaa siitä, mihin jäit, tai aloittaa uuden kokeen alusta. Vanhan kokeen edistyminen ei tallennu, jos aloitat uuden.',
  primary: { label: 'Jatka kesken olevaa', action: () => resumeExam() },
  secondary: { label: 'Aloita uusi koe', action: () => discardOldAndStartNew() },
});
```

Backend (`routes/exam.js` tai vastaava): lisää endpoint `POST /api/exam/discard-active` joka merkkaa käyttäjän aktiivisen kokeen abandonediksi ja sallii uuden luomisen.

**Tämä on isoin yksittäinen "tuotetta-näyttää-keskenenäiseltä" -löydös koko auditissa** — natiivi confirm + umpikuja-error on suoraan käyttäjäluottamuksen tappaja Pro-maksaville käyttäjille.

---

### 1. Heatmap renderöityy mustina laatikkoina

**Mitä näkyy:** Dashboardilla "Aktiivisuus · 30 päivää" -section näyttää 35 cellin gridin, jossa kaikki cellit ovat täysin samanvärisiä (`rgb(26,26,26)` = `--surface`). Ainoastaan rivin alaosassa on harmaa "Tee ensimmäinen harjoitus, niin sytytät tästä päivän."

**Miksi rikki:** Tyhjä state näyttää virheeltä. Käyttäjälle se näyttää siltä että app on rikki, ei siltä että hän ei ole vielä harjoitellut. Pitäisi näyttää joko (a) vain "tyhjä state" -teksti ilman cellejä, tai (b) celleille subtileja gradient-fadeja jotka kommunikoivat "ruudukko on olemassa, ei vielä dataa".

**Korjaus:** `css/components/dashboard.css` — `.heatmap-cell` ilman level-luokkaa pitäisi saada vaikka `border: 1px dashed rgba(255,255,255,0.04)` tai `background: linear-gradient(...)` joka vihjaa että ne ovat ruudukon paikat. Tai vaihtoehtoisesti: piilota heatmap kokonaan ja näytä vain motivoiva CTA "Aloita ensimmäinen harjoitus → tästä alkaa streakisi" kunnes käyttäjällä on >0 päivää aktiviteettia.

### 2. dash-tutor-osio uimassa ilman containeria

**Mitä näkyy:** Heti H1:n ("Iltaa, testpro123.") ja "10 minuuttia espanjaa..." -alaotsikon jälkeen tulee leveä leipäteksti ("Aloitetaan vahvalla pohjalla, joten tänään...") joka renderöityy yhdenä leveänä rivinä **ilman containeria, korttia, tai padaceaa**. Sitten tulee horisontaalinen viiva ja heti perään "Tee 10 harjoitusta 3 osa-alueesta — sitten arvio." — tämä on iso H1-kokoinen otsikko. Hierarkia rikki: ensimmäinen rivi näyttää leipätekstiltä, toinen rivi näyttää H1:ltä.

**Miksi rikki:** `<section class="dash-tutor">` ei ole boxed/elevated kortti vaan paljas teksti. Pitäisi olla joko:
- (a) Pieni eyebrow + lyhyt yhden lauseen tutor-viesti, **kortin sisällä** muiden korttien tapaan, TAI
- (b) Tutor-viesti integroitu hero-osioon "Iltaa, testpro123" alle (greeting + tutor-viesti samana hero-blockina, ei erillisinä).

**Korjaus:** `css/components/dashboard.css` — `.dash-tutor` tarvitsee:
```css
.dash-tutor {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 24px;
  margin: 16px 0;
}
.dash-tutor__msg {
  font-size: 15px;
  line-height: 1.6;        /* nyt "normal" = ~1.2, liian tiukka */
  color: var(--text-muted);
  margin: 0;
}
```

### 3. "Kertaa nyt — 20 korttia" -kortin alateksti lukukelvoton

**Mitä näkyy:** Suuri kortti otsikolla "Kertaa nyt — 20 korttia →". Alaviivassa pitäisi lukea "28 odottaa · ~5 min" mutta värit ovat **mintunvihreä versaalit mustalla taustalla** niin matalalla kontrastilla että teksti on lähes näkymätön. Ruutukaappauksessa näkyy `28 ODOTTAA` ja `~5 MIN` mutta vain juuri ja juuri.

**Korjaus:** `--accent` on liian tumma versaaleille pieneen kokoon. Joko nosta sen lightnessia tämän kontekstin alateksteille, tai vaihda `color: var(--text-muted)` (vaalea harmaa) ja säilytä versaalit + letter-spacing. Tee a11y-pass: kontrastin pitäisi olla AA-tasoinen (4.5:1).

### 4. Hash-routing rikki kun harjoitus on auki

**Toistettavasti:** Avaa Sanasto → "Aloita sanastoharjoittelu" → kysymys näkyy. Klikkaa sivupalkista "Puheoppi". URL muuttuu `#/grammar`-osoitteeksi mutta **harjoitus pysyy ruudulla**. Klikkaa x-painiketta — vie sinut **dashboardiin**, ei Puheoppi-sivulle vaikka URL sanoi `#/grammar`.

**Mitä pitäisi tapahtua:** Joko (a) navigaatio sulkee harjoituksen ja vie kohteeseen, tai (b) navigaatio kysyy "Lopetetaanko harjoitus?" varoituksen kanssa. Nykyinen tila — hiljainen URL-muutos ilman näkyviä vaikutuksia — on hämmentävää ja rikki.

**Korjaus:** `js/screens/vocab.js` (ja muut harjoitusscreenit) — kun harjoitus on aktiivinen, joko (a) blokkaa navigaatiotapahtumat ja näytä confirm-modal, tai (b) sulje harjoitus ja navigoi normaalisti.

### 5. /api/config/public palauttaa 404

**Mitä näkyy:** Network-tabilla joka kylmällä latauksella `GET /api/config/public` palaa **404 Not Found** ja kestää 349ms.

**Korjaus:** Joko luo endpoint `routes/`-kansioon, tai poista pyyntö frontendistä. Yksinkertaisempi: poista frontend-kutsu jos se ei ole oleellinen.

---

## P1-bugit (rumaa, ei rikki)

### 6. Dashboardin osa-alueet renderöityvät paljaana raakatekstinä

**Mitä näkyy:** Kun scrollaa dashboardilla alas, näkyy:
```
YO-valmiuskartta
3 / 14 osa-aluetta hallinnassa · 20% valmius · alkuvaiheessa
vähän hyvin
Kirjoittamisen osa-alueet — viim. 5 kertaa
Viestinnällisyys→ 3.5 / 5
Kielen rakenteet→ 2.5 / 5
Sanasto→ 3.5 / 5
Kokonaisuus→ 3.0 / 5
```

Tämä on **paljasta tekstiä, ei kortteja, ei progress-palkkeja, ei datavisualisaatiota**. Numerot nuolen kanssa (`→ 3.5 / 5`) näyttävät kuin keskeneräiseltä markdownilta. "vähän hyvin" lukee ilman kontekstia.

**Korjaus:** Tämä koko sectio pitäisi olla joko:
- horizontal bar -kaavioina (Recharts/oma SVG)
- pieninä "stat-cards" -korteina pisteellä, etiketillä, ja edistyspalkilla
- pelkkänä raakatekstinä se ei kommunikoi mitään

### 7. "B → C" -laatikko ilman otsikkoa

**Mitä näkyy:** Dashboardin keskellä iso laatikko, jossa lukee vain `B → C` ja sen alla:
```
Kysymyksiä: 0/50
Sessioita: 0/5
Päiviä tasolla: 0/7
Keskiarvo: 0%/78%
```

Käyttäjä ei tiedä mitä tämä on. Onko se goal-tracker? Level-up-progress?

**Korjaus:** Lisää eyebrow-otsikko (esim. "TASOSI EDISTYMINEN" tai "Seuraava taso"). Lisää kuvaava lause. Kontekstualisoi numerot — esim. "kun täytät kaikki, nouset C-tasolle".

### 8. Vastausvaihtoehtojen selitys konsolifontilla

**Mitä näkyy:** Kun vastaat sanastokysymykseen, näkyy harmaa tekstilaatikko jossa on selitys: `el alcalde = pormestari (mayor). Anunciar = ilmoittaa, medidas = toimenpiteet.`

Teksti renderöityy **DM Mono -fontilla** (terminal-fontti), tummanharmaalla, pienellä fontilla, hyvin tiukalla rivivälillä.

**Miksi väärin:** Selitys on opetussisältö — sen pitäisi olla helppolukuista (Inter, normaali fonttikoko, line-height 1.5+, riittävä kontrasti). Mono on OK koodille, ei sanaselityksille.

**Korjaus:** `css/components/exercise.css` — etsi explanation/feedback-luokka ja vaihda `font-family: var(--font-sans)`, `font-size: 15px`, `line-height: 1.6`, `color: var(--text)`. Pidä korttirajan harmaana mutta tee teksti luettavaksi.

### 9. SR-arviointipainikkeiden visuaalinen ristiriita

**Mitä näkyy:** "Kuinka hyvin muistit?" -kysymyksen alla 4 painiketta: Uudelleen (oranssi outline), Vaikea (keltainen outline), Hyvä (vihreä outline), Helppo (sininen outline). Kaikilla on **väri-outline mutta tausta on tumma** — näyttää siltä että jokainen on disabled-tilassa.

**Korjaus:** Joko täytä taustat värillä (selkeät CTA:t), tai pidä outline-tyyli mutta tee tekstistä saman värinen kuin outlinesta — silloin painikkeet näyttävät interaktiivisilta. Nykyisellään on epäselvää, mikä on aktiivinen valinta tai onko valittu mitään.

### 10. "Konteksti"-badge violetti

**Mitä näkyy:** Sanasto-tehtävän yläosassa ennen kysymystä on pieni violetti badge "Konteksti" joka erottuu rajusti muusta UI:sta. Koko app käyttää muuten mintunvihreää aksenttiväriä, eikä violetilla ole semanttista merkitystä — se on vain "hei, tässä on konteksti" -merkki.

**Korjaus:** Vaihda violetti `var(--accent)` (mintunvihreä) tai `var(--surface-light)` (neutraali harmaa). Säilytä badge-muoto.

### 11. Kategoriavärit klashaavat brand-värin kanssa

Joka pääsivulla on oma kategoriaväri (eyebrow + viiva + accentteja):

| Sivu | Väri |
|------|------|
| Sanasto | mintunvihreä (`--accent`) ✓ brand |
| Puheoppi | violetti |
| Verbisprintti | pinkki |
| Luetun ymmärt. | oranssi |
| Kirjoittaminen | sininen |
| Oppimispolku | mintunvihreä ✓ brand |
| Koeharjoitus | mintunvihreä ✓ brand |

**Päätös tehtävänä:** Onko tämä tarkoituksellinen kategorisointi? Jos kyllä, dokumentoi se design-systemiin. Jos ei, harmonisoi neutraaleihin (kaikki harmaalla) tai brand-aksenttiin (kaikki mintunvihreällä). Nykyisellään näyttää siltä, että joku on lisännyt eri värin joka sivulle ilman strategiaa.

### 12. Koeharjoituksen leipäteksti on monospace

**Mitä näkyy:** Koeharjoitus → Luetun ymmärtäminen → ekassa tehtävässä koko espanjankielinen lukuteksti renderöityy DM Mono -fontilla. 200+ sanaa monospaceå luettavaksi.

**Korjaus:** `css/components/exercise.css` — etsi reading passage selectorit, vaihda `font-family: var(--font-sans)`. Mono kuuluu vain koodiblokeille.

---

## P2-suosituksia (suorituskyky)

### 13. Bundlaa CSS yhteen tiedostoon

**Nykyinen:** 18 erillistä CSS-tiedostoa = 18 HTTP-pyyntöä cold loadissa. Vaikka HTTP/2 multipleksaa nämä, jokaisessa on pienet overheadit ja ne kaikki lukitsevat renderointia.

**Korjaus:** Käytä build-stepiä (esim. PostCSS tai esbuild) joka yhdistää `style.css` + kaikki `css/components/*.css` yhdeksi `app.bundle.css`:ksi. Vain yksi pyyntö.

**Vaikutus:** ~200-400ms säästöä cold loadissa.

### 14. Bundlaa JS-screenit yhteen tiedostoon

**Nykyinen:** 28 erillistä JS-tiedostoa (`screens/auth.js`, `screens/dashboard.js`, jne.) ladataan kaikki etukäteen vaikka käyttäjä menee vain dashboardiin.

**Korjaus:** Joko:
- (a) Bundlaa kaikki yhdeksi `app.bundle.js`:ksi (yksi pyyntö, koko app heti käytössä)
- (b) Lazy-loadaa screenit dynaamisesti (`import()` kun käyttäjä klikkaa sivupalkista) — esim. Sanasto-screeniä ei ladata ennen kuin käyttäjä menee Sanasto-sivulle

(a) on yksinkertaisempi, (b) säästää ensimmäisellä latauksella mutta hidastaa sivunvaihtoa. Lyhyt app → suosittelen (a).

**Vaikutus:** 28 → 1 pyyntö, ~500-1000ms säästöä.

### 15. Rinnakkaista tai yhdistä API-pyynnöt dashboardilla

**Nykyinen:** Dashboardilla tehdään 11 erillistä API-kutsua, joista hitain (`adaptive/status`) on 1.1s. Vaikka ne tehdään rinnakkain (todennäköisesti), kestot lasketaan korkeimman mukaan.

**Korjaus:**
- Yhdistä `/api/dashboard` palauttamaan kaiken mitä dashboard tarvitsee (yksi roundtrip)
- Tai vähintään: yhdistä `weak-topics`, `sr/count`, `sr/forecast`, `learning-path` yhdeksi `/api/dashboard/v2`-kutsuksi
- `/api/profile` voidaan cachata pidemmäksi (käyttäjäprofiili ei muutu joka sivulla)

**Vaikutus:** 875ms (dashboard) → ~1100ms (kun joku muu hidas API ei holdaa).

### 16. /api/adaptive/status?mode=vocab on hitain — optimoi

**Nykyinen:** 1094ms kestäneenä, 1.1s on vakavasti hidas API-kutsu. Tämä todennäköisesti tekee monimutkaisen Supabase-kyselyn user_progressiin tai openai-provisioningiin.

**Korjaus:** Tarkista `routes/exercises.js` ja näe mitä tämä endpoint tekee. Mahdollisuuksia:
- Lisää indeksi Supabase-tauluun
- Cachet 60 sekunniksi (Redis tai in-memory)
- Yksinkertaista logiikkaa — ehkä tehdään useita kyselyitä peräkkäin sen sijaan että yhdistettäisiin

### 17. Sanastoharjoituksen 4.2s lataus = OpenAI vs. cache

**Mistä se tulee:** Klikkaus → user-level → adaptive/status → OpenAI-pyyntö generoimaan 12 kysymystä. OpenAI:n vastausaika on tyypillisesti 2-4s gpt-4o-minillä isoille promptille.

**Korjaus-vaihtoehdot:**
- **Pre-generate next batch:** Kun käyttäjä on kysymyksessä 8/12, alkaa generoida seuraavaa 12-kysymyksen settiä taustalla. Kun hän klikkaa "aloita uusi", se on jo valmiina.
- **Cache hot topics:** Yleisin sanastoaihe ("Yleinen sanasto" B-tasolla) — generoi 100+ kysymystä etukäteen ja serve ne ensin, generoi uusia vain kun cache tyhjenee.
- **Streaming:** Streamaa kysymyksiä OpenAI:lta yksi kerrallaan, näytä Q1 heti kun se on valmis (älä odota kaikkia 12).

**Vaikutus:** 4.2s → potentiaalisesti <500ms (pre-generated) tai 1-1.5s (streaming Q1).

### 18. Grade-vastauksen 3.1s = sama syy

Sama logiikka kuin 17 — OpenAI grading kestää. Streamaus + cache ovat samat ratkaisut.

---

## Yhteenveto prioriteetilla

**Tee ensin (käyttäjäkokemus rikki):**
- **P0-0: Koeharjoituksen natiivi `confirm()` + Cancel-umpikuja → brändätty modaali + "hylkää vanha" -nappi** (kriittisin koko listasta)
- P0-1: heatmap mustana ruutuna → tyhjä-state
- P0-2 / P2-17: Sanastoharjoituksen 4s lataus → pre-gen tai streaming
- P0-3: Kertaa-kortin lukukelvoton alateksti → kontrasti
- P0-4: Hash-routing rikki harjoituksen aikana → confirm-modal tai automaattinen sulkeminen
- P0-5: /api/config/public 404 → poista pyyntö

**Tee seuraavaksi (Oma sivu rumaa):**
- P1-6: dash-tutor box → lisää kortti-design
- P1-7: B → C -laatikko → lisää otsikko ja konteksti
- P1-8: paljastekstit ("vähän hyvin", "Viestinnällisyys → 3.5/5") → datavisualisaatio
- P1-12: Koeharjoituksen lukuteksti monospacesta sansiin

**Tee viimeisenä (suorituskyky bundleilla):**
- P2-13/14: CSS+JS-bundlaaminen → ~1s säästö cold loadissa
- P2-15/16: API-kutsujen yhdistäminen + adaptive/status:in cachetus

---

## Liitteet — komentoja diagnostiikkaan

```bash
# Mittaa cold load Lighthousella (suosittelen kotikoneelta, ei Vercelin sandboxista)
npx lighthouse https://espanja-v2-1.vercel.app/app.html --view

# Tsekkaa CSS-bundlaaminen — kuinka iso yhdistetty olisi
cat css/components/*.css | wc -c

# Tsekkaa missä /api/config/public-pyyntö syntyy
grep -r "config/public" js/ public/ src/ 2>/dev/null

# Tsekkaa adaptive/status -reittilogiikka
grep -A 20 "adaptive/status" routes/exercises.js
```
