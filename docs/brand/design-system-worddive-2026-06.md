# Puheo design-system (WordDive-suunta) — 2026-06-01

Lähde-totuus koko sivun uudelleenrakennukselle. Lukittu Marcelin kanssa 2026-06-01 (4 iteraation jälkeen). Inspiraatio: WordDive + Studeo. Visuaalinen baseline: `docs/audits/redesign-hero-v3.html` (toimiva SVG-hero, screenshot `screenshots/redesign-hero-v3-2026-06-01/`).

## Periaate
Custom-**kuvitusvetoinen**, ystävällinen suomalainen opiskelijatuote. EI laatikko-/template-veto, EI monokromi, EI gradientteja, EI valokuvia. Jokaista isoa sektiota kantaa oma flat-vektorikuvitus. Itsevarma tila, pyöreät muodot, lämmin paletti.

## Typografia
- **Display = Fredoka** (paino 600/700). Otsikot (h1/h2/h3), nav-logo, pill-napit, isot numerot. Pyöreä chunky sans = WordDive-energia.
- **Body/UI = Mulish** (400-700). Leipäteksti, labelit, lomakkeet.
- **Self-host molemmat woff2:na** (`/fonts/`), älä CDN tuotannossa. POISTA vanhat General Sans / Manrope -viittaukset.
- KIELLETTY: Inter, serif (Instrument/Fraunces), ylisuuret ohuet otsikot. Hierarkia = paino + koko + väri, ei pelkkä jättikoko.

## Paletti (vain tasaiset värit, EI gradientteja, EI glow-varjoja)
```
--cream:#FBF7EF   sivun tausta
--paper:#FFFFFF   kortit
--ink:#241C15     teksti (lämmin lähes-musta, EI #000)
--ink-soft:#5C5145 toissijainen teksti
--brick:#9B2D2A   primääri brändi + CTA
--yellow:#F4C84A  aksentti (countdown, korostus)
--green:#2E5E4E   aksentti (edistyminen, onnistuminen)
--yellow-pale:#FBEEC6  --green-pale:#DCE8E0  --brick-pale:#F4DAD3   (pehmeät paneelitaustat)
--skin:#E7B58C   --skin-dk:#D29E72   (kuvituksen iho)
--line:#E9DFCF   reunat
```
Säännöt: yksi aksentti per blokki. Varjot pehmeät + lämpimäksi sävytetyt (`0 18px 40px -22px rgba(60,38,20,.35)`), ei neon/glow. Ei pure black/white.

## Muoto
- Radius: kortit 22-36px, pillit 999px, inputit 16px.
- Pill-napit kaikkialla (Fredoka 700). `:active{transform:scale(.97)}`.
- Värilliset pyöristetyt paneelit kuvitusten taustalla (yellow-pale/green-pale/brick-pale).
- Antele tilaa. Mobiili <860px: yksi sarake, ei vaakavieritystä.

## Kuvituskieli (KRIITTINEN)
- Flat 2D vektori-SVG, ei gradientteja, paksut pyöreät muodot, rajattu paletti (tokenit + skin).
- Motiivit: kädet pitelevät puhelinta, **kolmen kielen** puhekuplat (¡Hola! / Salut! / Hallo!), aksenttitiilet (ñ/é, ç/à, ä/ö/ß), kirjat, ylioppilaslakki, sparkle, check-badge, orgaaniset blob-taustat.
- **AINA ES + FR + DE**, ei koskaan pelkkä espanja.
- Jokaiselle isolle sektiolle yksi oma kuvitus (feature-rivi = 3 eri kuvitusta, kuten WordDive).
- Siisti, tasapainoinen, hengittävä. Ei sekavaa kasaa elementtejä.
- Tehdään käsin SVG:nä, committaa `/img/illustrations/*.svg`. Baseline-tyyli = hero-v3:n SVG. **Laatua saa ja pitää hioa** (käsi vielä hieman lapasmainen — lisää sormiviiva, paranna sommittelua). Älä regressoi tyyliä.

## Komponentit
- **Nav:** Fredoka-brick-logo + tekstilinkit + ghost-pill "Kirjaudu" + brick-pill "Aloita". Mobiili: hamburger.
- **Hero:** asymmetrinen split, copy vasemmalla + kuvituspaneeli oikealla. Iso Fredoka-otsikko, eyebrow-pill, 2 CTA:ta, chip-rivi.
- **Feature-rivi:** 3 ominaisuutta, KUKIN oma kuvitus + Fredoka-otsikko + body. Kuvitus erottaa kortit (ei 3 identtistä geneeristä korttia).
- **Pricing (MEIDÄN malli, EI WordDiven tilaustasoja):** hero-kortti **"Kurssi 49€ kertaostos"** (Suosituin-starburst, iso Fredoka-numero, koepäivään asti) + toissijainen **"Treeni 9€/kk"** (pelkkä AI-arvio). POISTA vanha Free/Mestari/19€-pricing. Rahat-takaisin-maininta.
- **Footer:** brick-wall-pattern-blokki **brick-värissä** (pun: "kielimuuri", meidän brändiväri on kirjaimellisesti tiili) + linkit + some + uutiskirje.
- **App shell:** sivupalkki (cream, Fredoka-logo, nav-itemit), topbar avatar-pill.
- **Dashboard (koti):** EI tyhjä. Värikkäät tasaiset blokit: koepäivä-countdown (keltainen blokki, iso Fredoka "84 päivää"), kurssiedistyminen (vihreä blokki, X/8 + bar), seuraava oppitunti (paperi-kortti, Fredoka-otsikko + brick-CTA + heikkous-chipit + putki).
- **Lesson/digikirja-lukija:** tokenit päälle (Fredoka-otsikot, pyöreä, paletti), toiminnallinen rakenne ennallaan.

## Anti-lista (automaattinen hylkäys)
Gradientit, glow-varjot, pure black/white, em-dash, AI-slop-sanat (elevate/seamless/kalibroitu), serif/Inter, ylisuuret ohuet otsikot, vinot kelluvat fake-data-kortit koristeena, 3 identtistä korttia ilman kuvituseroa, mono-UPPERCASE-labelit ilman syytä, fake-testimoniaalit/lukio-nimet/%-luvut.
