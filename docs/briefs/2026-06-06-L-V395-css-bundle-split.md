# L-V395 — App-CSS:n koko: raskaat screen-tyylit pois aina-ladattavasta bundlesta

**Rooli:** WRITER. **Tyyppi:** FRONTEND-L (CSS-arkkitehtuuri) + TESTING-L (screenshot-diff regressio).

> **Gate:** ajetaan VASTA L-V394-frontend-auditin jälkeen. Audit kertoo onko CSS-splitti edes tekemisen arvoinen ja mitkä screenit oikeasti kannattaa irrottaa. Jos audit nostaa kiireellisempiä V0/V1-löydöksiä, tämä siirtyy taaemmas jonossa.

**Skill-stack (kutsu Skill-toolilla ENNEN ensimmäistä Write/Edit/Bash):**
`ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend` (FRONTEND-L), `webapp-testing` (screenshot-diff + verify). Ei suomi-tekstiä → ei humanizeria. Ei migraatioita → ei supabase-skillejä.

---

## Konteksti (mitattu L-V393:ssa, älä mittaa uudelleen)

`app.html` lataa yhden `app.bundle.css`:n joka on **420 KB raakana**. Faktat:
- **Gzip = 69 KB.** Vercel auto-pakkaa staattiset assetit → langalla kustannus on jo pieni. **Tämä ei ole byte-budjetti-ongelma.** Todellinen kohde on (1) **parse-aika** (selain jäsentää koko 420 KB ennen first paintia) ja (2) se että käyttäjälle lähetetään screen-CSS:ää jota hän ei ehkä koskaan avaa.
- **EI purgeable Tailwind:** `css/tailwind.css` on vain 16 KB ja jo purgattu. Loput on **käsinkirjoitettua KÄYTETTYÄ** komponentti-CSS:ää. PurgeCSS/uncss EI ole oikea työkalu — se yli-purgaisi dynaamiset luokat ja rikkoisi design-systeemin.
- **Bundle rakennetaan** `scripts/bundle-entry.css`:stä jonka esbuild konkatenoi (`@import`-graafi). Landing-CSS (`landing-editorial.css` 113 KB, `landing.css` 74 KB) EI ole app-bundlessa — älä koske niihin.
- **Painavimmat app-bundlen palaset:** `app-old-spain.css` 112 KB, `digikirja.css` 56 KB, `dashboard.css` 46 KB, `curriculum.css` 29 KB, `lesson-runner.css` 29 KB, `home.css` 24 KB, `profile.css` 21 KB.
- **Kriittinen cascade-rajoite:** `bundle-entry.css`:n järjestys = `app.html`-linkkijärjestys, ja `app-old-spain.css` on ladattava **VIIMEISENÄ** (sen var-silta + surface-overridet voittavat kaskadin koko appissa). Mikä tahansa siirto ei saa rikkoa tätä.
- **JS jo lazy-laataa screenit** (`chunks/app-digikirja-*.js`, `app-lessonRunner-*.js`, `app-curriculum-*.js` jne. ladataan dynaamisella importilla kun screen avataan). CSS voi peilata tämän.

**Rehellinen odotusarvo:** koska langalla ollaan jo 69 KB:ssa, voitto on **parse-aika + ei turhan screen-CSS:n lähetys**, ei dramaattinen byte-säästö. Tämä on "kiva, ei kriittinen" -optimointi. Jos parse-aika ei mittauksessa näytä first-paint-eroa, raportoi se ja lopeta — älä pakota muutosta jolla on cascade-riski mutta ei hyötyä.

---

## Tavoite (intent)

Pudota **aina ensilatauksessa jäsennettävän** app-CSS:n koko siirtämällä raskaimmat **screen-spesifit** tyylit (digikirja, lesson-runner, ja harkinnan mukaan curriculum/exercise) lazy-ladattaviksi silloin kun kyseinen screen oikeasti avataan, samaan tapaan kuin JS-chunkit jo toimivat. App-shell + usein nähdyt screenit (home, profile, oppimispolku) pysyvät kriittisessä bundlessa.

**Ei design-muutoksia.** Pikselit pysyvät identtisinä joka screenillä. Tämä on puhdas lataus-arkkitehtuuri.

---

## Lähestymistavat (suositus ensin)

**A (suositus) — Chunk-tason CSS-split, peilaa JS-lazy-loadia.**
Anna lazy-ladattavien screen-JS-moduulien tuoda oma CSS:nsä (esim. `digikirja.js` → `import "../../css/components/digikirja.css"`), jolloin esbuild emittoi CSS:n chunkin viereen ja se latautuu vasta kun screen avataan. Poista nämä tiedostot `bundle-entry.css`:stä. Kriittinen bundle kevenee ~85–110 KB raakana (digikirja 56 + lesson-runner 29 + harkinnan mukaan lisää). **Cascade-riski:** lazy-CSS latautuu ajonaikaisesti app-old-spainin JÄLKEEN → varmista että siirretyt tyylit eivät tarvitse app-old-spainin overrideja voittaakseen, TAI että ne toimivat oikein myöhemmin ladattuna. Tämä on koko homman ydinriski ja verifioinnin pääkohde.

**B — Erillinen toissijainen bundle, ei chunk-import.**
Rakenna `app-screens.css` (raskaat screenit) erikseen ja injektoi `<link>` lazyna ensimmäisellä screen-avauksella. Yksinkertaisempi esbuild-konfig kuin A, mutta vaatii käsin link-injektion + saman cascade-varmistuksen. Vähemmän automaattinen kuin A.

**C — Älä tee (dokumentoi).**
Jos POC-mittaus osoittaa ettei parse-aika muuta first-paintia mitattavasti (gzip jo 69 KB), tämä on validi lopputulos. Kirjaa luvut ja jätä CSS ennalleen.

Aloita **A:n pienimmästä siivusta** (vain digikirja.css lazyksi) ja MITTAA first-paint ennen/jälkeen + screenshot-diff digikirjasta. Jos hyöty näkyy ja diff on puhdas → laajenna lesson-runneriin. Jos cascade rikkoutuu tai hyöty on nolla → peräänny B:hen tai C:hen.

---

## Acceptance criteria (konkreettiset)

- [ ] **Pikselit identtiset:** screenshot-diff JOKAisesta siirretystä screenistä (digikirja, lesson-runner, +mahd. curriculum) ennen/jälkeen — 0 visuaalista eroa. Tämä on kova portti: cascade-järjestyksen muutos EI saa muuttaa mitään näkyvää.
- [ ] **Kriittinen `app.bundle.css` pienenee** mitattavasti (kirjaa ennen/jälkeen raaka + gzip KB).
- [ ] **First paint / FCP** mitattu app.html:lle ennen/jälkeen (Playwright `performance` tai Lighthouse `audit:lighthouse`); kirjaa ero. Jos ero ~0 → harkitse C:tä.
- [ ] **Siirretty screen-CSS ei lataudu ennen kuin screen avataan** (verkkoloki todistaa: digikirja.css latautuu vasta `#/oppitunti/...`-navigoinnissa, ei app-bootissa).
- [ ] **app-old-spain.css pysyy viimeisenä kriittisessä bundlessa**; sen cascade-voitto todennettu (esim. L-V388 MC-värit, oppimispolun brick-aktiivinen — varmista etteivät rikkoudu).
- [ ] **sw.js CACHE_VERSION bumpattu** jos STATIC_ASSETS-lista muuttuu (uusi CSS-chunk-nimi).
- [ ] `npm run build` ajettu, chunkit + CSS staged; `npm test` vihreä; muokatut js `node --check`.
- [ ] IMPROVEMENTS.md +1 rivi ennen/jälkeen-luvuin.

## Push-rajat
- Käyttäjälle näkyvä lopputulos = sama (nopeampi lataus, ei visuaalimuutosta) → **pushataan** kun valmis ja build ajettu + screenshot-diff puhdas. Jos lopputulos = C (ei muutosta), älä pushaa — kirjaa vain finding briefiin/IMPROVEMENTSiin.
- **AI-slop / design-riski:** tämän loopin SUURIN riski on cascade-järjestyksen rikkominen joka aiheuttaa hienovaraisia tyylivuotoja (väärät värit, väärä spacing) jotka eivät näy ilman screenshot-diffiä. Älä luota silmämääräiseen "näyttää ok" — aja diff joka siirretystä screenistä.

## Out of scope
- Landing-CSS (`landing-editorial.css`, `landing.css`) — ei app-bundlessa, älä koske.
- Tailwind-purge — jo tehty (16 KB).
- Design-muutokset — pikselit pysyvät identtisinä.
- P1 cold start (Vercel Pro -päätös, eri asia).
