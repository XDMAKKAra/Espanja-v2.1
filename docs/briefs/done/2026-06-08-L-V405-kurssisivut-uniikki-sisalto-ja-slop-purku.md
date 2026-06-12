# L-V405 — Kurssisivut: AI-slop pois + uniikki, kurssikohtainen sisältö

**Skill-stack:** FRONTEND-L (frontend-design, ui-ux-pro-max) + COPY (humanizer) + TESTING-M (webapp-testing)
**Push:** kyllä (julkiset markkinointisivut)
**Sivut:** `public/landing/espanja.html`, `ranska.html`, `saksa.html` (jaettu `css/landing-langpage.css`; reititys `vercel.json` → `/espanjan-abikurssi`, `/ranskan-abikurssi`, `/saksan-abikurssi`)

## Ongelma

Kurssisivut tuntuvat AI-slopilta ja landingin kopiolta. Marcel: "nää kurssisivut on iha ai slop", "tää on nyt täys kopio", "pitää olla tekstei siit mist täst on kyse. Eikä vaan näit samoi juttui mitä landing pages on." Konkreettiset viat (todennettu koodista):

1. **Two-tone-otsikko** — H1 vaihtaa väriä kesken otsikon (`<em>` brick-värillä). `saksa.html:180`, `espanja.html:181`, `ranska.html:180`; CSS `css/landing-langpage.css:72-75`. Marcel: "muuttuu väri keske otsikkoo ai slop."
2. **Eyebrow-pilli otsikon päällä** — `lp-eyebrow` "Saksan abikurssi · lyhyt oppimäärä" (`saksa.html:179` ym.; CSS `landing-langpage.css:26-35`). Marcel: "Toi tekstiboxi tuol otikon pääl ai slop."
3. **Vanhentunut oppimispolku-visuaali** — staattinen screenshot `/img/app-demo/oppimispolku-de.png` (`saksa.html:250`), ei elävä komponentti; kuvat vanhenevat appin ulkonäön muuttuessa (V400-redesign). Marcel: "tääl on viel vanha versio meiä oppimispolun ulkonäöst."
4. **Sisältö geneeristä** — samoja myyntilauseita kuin landingilla, ei kurssikohtaista substanssia. Marcel haluaa oikeaa tekstiä siitä mistä kurssissa on kyse, "miks valita meiät ja YMS MITÄ MUUTA SIEL VOIS OLLA."

## Tavoite

Jokainen kielisivu on itsenäinen, kurssikohtainen infosivu joka vastaa: mistä tämän kielen YO-koe ja kurssi on kyse, mitä opit, miksi Puheo eikä muu, kenelle sopii. Ei landing-kopiota, ei AI-slop-kuvioita. SEO-hyöty: kurssikohtainen sisältö rankkaa "saksan abikurssi" / "espanjan yo-koe" -hauissa.

## Korjaa AI-slop (kaikki 3 sivua)

- Poista two-tone-otsikko: yksi väri koko H1:lle (warm-black). Ei `<em>`-brick-väritystä otsikossa.
- Poista eyebrow-pilli otsikon päältä TAI korvaa se semanttisesti perustellulla, hillityllä elementillä (ei mono-UPPERCASE ilman syytä). Otsikon pitää seistä omillaan.
- Korvaa vanhentunut oppimispolku-screenshot: joko tuore kaappaus nykyisestä oppimispolusta (`scripts/capture-langpage-demo.mjs` jos yhä toimii) tai elävä/ajantasainen visuaali. Intent: visuaali EI saa olla vanhentunut versio. Jos tuore kaappaus ei onnistu luotettavasti, harkitse visuaalin korvaamista kuvauksella mitä oppimispolku tekee.
- Yleinen anti-slop: ei identtisiä korttirivejä, ei gradient-tekstiä, ei em-dashia, ei italic-Frauncesia, warm-paletti.

## Uniikki sisältö (laajennettu — komposition + lopullisen copyn saa viilata workeri)

Ehdotettu sektiorakenne per sivu (kieli = saksa/espanja/ranska kunkin tiedoston mukaan):

1. **Hero** — slop korjattu, selkeä yhden lauseen lupaus tästä kielikurssista + CTA (CTA-reititys hoidetaan L-V403:ssa, tämä brief ei koske reititystä).
2. **"Mitä lyhyen oppimäärän [saksan] YO-koe vaatii"** — UUSI, kurssikohtainen substanssi: koeosat (kuullun ymmärtäminen, luetun ymmärtäminen, sanasto ja rakenteet, kirjoitelma), pisteytyksen perusperiaate, koe kevät/syksy. Tämä vastaa "mistä tässä on kyse" ja erottuu landingista. ÄLÄ keksi tarkkoja todennettavia lukuja joita et voi varmistaa (esim. pistemääriä) — pidä faktat YTL:n julkisen rakenteen tasolla.
3. **Kahdeksan kurssin polku** — säilytä tikapuut, mutta kirjoita per-kurssi-kuvaukset kielikohtaisiksi (A-tasolta E-tasolle): mitä juuri tämän kielen kurssilla harjoitellaan, ei geneeristä.
4. **"Näin Puheo valmentaa [saksan] kokeeseen"** — miten appi toimii tälle kielelle: ajantasainen oppimispolku-visuaali + kirjoitelma-arviointi oikealla kyseisen kielen näytteellä (pistehaarukka + perustelu, ei tarkkaa lukua eikä AI-disclaimeria — linjassa arviointi-reframen kanssa).
5. **"Miksi Puheo"** — miksi valita meidät: kohdennettu juuri YO-kokeeseen (ei yleinen kielikurssi), YTL:n kriteereille rakennettu arviointi, pistehaarukka-palaute joka kertoo missä menetit pisteitä, adaptiivinen polku. Erottelu vaihtoehtoihin (perinteinen kertaus / yleiset kieliappit) ilman kilpailijoiden nimeämistä.
6. **Kenelle sopii** — abiturientti, korotusta hakeva, kevään tai syksyn kirjoittaja.
7. **Usein kysyttyä [saksan] YO-kokeesta** — lyhyt FAQ (3-5 kysymystä), SEO-arvoa: koerakenne, pituusvaatimus, miten arviointi toimii, voiko kokeilla ilmaiseksi.
8. **Loppu-CTA.**

Sektiot 2, 5, 6, 7 ovat pääosin uutta, kurssikohtaista sisältöä — ne nostavat sivun landing-kopiosta omaksi asiakseen. Workeri saa yhdistää/karsia jos jokin tuntuu täytteeltä (YAGNI), mutta "mistä on kyse" + "miksi meidät" + kurssikohtainen substanssi ovat pakollisia.

## Copy

KAIKKI kolme sivua ovat suomenkielistä myyntikopiota → humanizer PAKOLLINEN ennen jokaista Editiä. Ei em-dashia, ei "kalibroitu/intuitiivinen/monipuolinen", ei rule-of-three-listoja joka virkkeessä, ei sycophantic/generic-fraaseja, ei keksittyjä lukio-nimiä tai todennettavia %-lukuja.

## Constraintit

- Jaettu `css/landing-langpage.css` — pidä kolme sivua rakenteellisesti yhtenäisinä, vain teksti + kielikohtaiset näytteet eroavat.
- Mobiili <440px: ei vaakavieritystä.
- Älä tee tästä big-bangia kaikille kielille kerralla jos riski kasvaa: voit toteuttaa yhden kielen mallina (esim. saksa), verifioida, sitten peilata es/fr. Mutta lopputulos = kaikki kolme valmiina samassa loopissa.

## Acceptance criteria

- Ei two-tone-otsikkoa, ei eyebrow-pilliä otsikon päällä, ei vanhentunutta oppimispolku-screenshotia millään 3 sivulla.
- Jokaisella sivulla vähintään sektiot "mitä koe vaatii", "miksi Puheo", "usein kysyttyä" kurssikohtaisella sisällöllä — ei copy-paste landingista.
- Per-kurssi-kuvaukset ovat kielikohtaisia (saksa ≠ espanja ≠ ranska tekstiltään).
- Humanizer-pass kaikelle copylle (all-text-pass).
- 375px: ei vaakavieritystä; 0 console-erroria.
- `scripts/verify-langpages.mjs` vihreänä (tai päivitä jos rakenne muuttuu perustellusti).

## Verify

- Playwright screenshot 375px + 1280px kaikille 3 sivulle, visuaalinen anti-slop-tarkistus.
- `scripts/verify-langpages.mjs`.
- `npm run build` jos koskee bundlattua CSS:ää (landing-langpage.css on erillinen — tarkista latautuuko); bumpaa `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.
- Tarkista horizontal-scroll (clientWidth === scrollWidth) mobiilissa.
