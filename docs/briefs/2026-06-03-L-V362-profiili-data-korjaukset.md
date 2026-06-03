# L-V362 — Profiili & data-korjaukset: väärä taso, phantom-Mestari, vahinko-unlock

**Päivä:** 2026-06-03
**Prioriteetti:** P0 — näyttää käyttäjälle VÄÄRÄÄ infoa (Marcelin automaattinen-hylkäys). Ennen visuaalista polishia.
**Rooli:** writer (Claude Code)
**Skill-stack:** BACKEND + FRONTEND-M → `supabase`, `supabase-postgres-best-practices`, `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`. Jos kosket käyttäjälle näkyvään suomi-tekstiin → lisää `humanizer`.

---

## 1. "Taso E" on väärin → piilota kunnes luotettava (PÄÄTETTY)

Yksi kirjoitustehtävä antoi käyttäjälle "Taso E" (E = YTL-asteikon korkeita arvosanoja I/A/B/C/M/E/L). Tämä on sama yliväite-ongelma jonka korjasimme V354:ssä: kalibrointi ei riitä tarkkaan tasoon, eikä tasoa voi johtaa yhdestä suorituksesta.

**Korjaus:** älä näytä Taso-merkkiä ennen kuin (a) kartoitus on tehty JA (b) dataa on tarpeeksi luotettavaan arvioon. **Ei koskaan yksittäisestä harjoituksesta.** Kunnes kynnys täyttyy, jätä taso-chip pois TAI näytä neutraali "ei vielä arvioitu" -tila (ei numeroa/kirjainta).

- Paikanna mistä "Taso E" johdetaan (dashboard + profiili-chip; etsi `level`/`taso`/`YTL`-johtaminen progress-logiikasta). Muistio: `user_level_progress` puuttuu skeemasta, adaptiivinen inertti — varmista ettei taso tule jostain placeholder/default-arvosta.
- Määrittele "tarpeeksi dataa" -kynnys konkreettisesti (esim. kartoitus valmis + N suoritusta per osa-alue). Jos epävarma kynnyksestä, ehdota luku ja perustele — älä jätä auki.
- Tarkista YO-valmius 0% -luvun johdonmukaisuus samalla: jos taso on piilossa koska dataa ei riitä, YO-valmius ei saa väittää tarkkaa lukua harhaanjohtavasti. Linjaa samaan "ei vielä luotettava" -logiikkaan.

## 2. "Mestari" ei ole olemassa → Treeni + Kurssi (PÄÄTETTY)

Profiilin Tilaus-kortti näyttää "Avaa Treeni" + "Avaa Mestari". **Mestari ei ole tuote.** Tuotteet ovat:
- **Treeni** — 9 €/kk
- **Kurssi** — 49 €

Poista "Mestari" kaikkialta (profiili, mahdolliset muut näkymät — greppaa "Mestari"). Korvaa "Avaa Mestari" → "Avaa Kurssi" (tai vastaava brändinmukainen). Varmista hinnat näkyvät oikein.

## 3. Vahinko-unlock: "painoin nappia → aukesi saksan kurssi"

Käyttäjä painoi jotain ja saksan kurssi aukesi yllättäen. Tutki (systematic-debugging):
- Mikä nappi muutti entitlementin/kielen? Epäillyt: "Avaa Treeni"/"Avaa Mestari" (Tilaus-kortti) tai "Vaihda kieli" (Opiskelukieli-kortti).
- **Mikään nappi ei saa myöntää maksullista oikeutta eikä vaihtaa kurssia/kieltä ilman selkeää, tarkoituksellista toimintoa + vahvistusta.** Jos "Vaihda kieli" vaihtaa opiskelukielen, se on OK mutta sen pitää olla selkeä eikä "avata kurssia". Jos jokin nappi flippasi Pro/entitlement-tilan client-side, se on bugi.
- Huom: testitili (testpro123) on Pro — varmista ettei sekoita testitilin laajoja oikeuksia oikeaan entitlement-bugiin. Toista mieluiten free-testitilillä.

## 4. Profiili tyhjä ylhäällä, pitää skrollata

Profiiliin mennessä yläosa on tyhjä ja sisältö (Opiskelukieli/Tilaus/Tili) alkaa vasta alempaa → pitää skrollata. Korjaa niin että profiilin sisältö alkaa heti ylhäältä (scroll-position/empty-top-layout-bugi). Tarkista myös ettei sama tyhjä-ylä-bugi ole muissa app-näkymissä (kuva 2 näytti pelkän tyhjän ruudun hetken).

## Brändi/copy-vartijat

- Treeni/Kurssi-napit ja taso-tila brändinmukaisia (cream/brick), ei lähes-mustia (vrt. L-V361).
- Näkyvä suomi-teksti humanizerin läpi (esim. "ei vielä arvioitu" -tila, "Avaa Kurssi").
- Ei keksittyjä lukuja/tasoja — koko tämän briefin ydin on EI näyttää väärää dataa.

## Acceptance criteria

- Yksittäinen harjoitus EI tuota taso-merkkiä; taso näkyy vasta kartoitus + kynnys täynnä, muuten neutraali/pois.
- "Mestari" ei esiinny missään; profiilissa Treeni (9€/kk) + Kurssi (49€) oikein.
- Mikään nappi ei avaa kurssia/kieltä/Pro-oikeutta ilman tarkoituksellista vahvistettua toimintoa; vahinko-unlock ei toistu.
- Profiili alkaa ylhäältä, ei pakota skrollaamaan tyhjän yli.

## Verify (writer tekee)

- Playwright free-testitilillä: tee yksi kirjoitustehtävä → varmista ettei taso-merkkiä ilmesty. Tee kartoitus → tarkista taso-logiikka.
- Greppaa "Mestari" → 0 osumaa UI:ssa.
- Toista unlock-skenaario: paina profiilin napit → varmista ettei kurssi/kieli vaihdu vahingossa.
- Profiili 390px: sisältö heti ylhäällä.
- `npm run build`; sw CACHE_VERSION bump jos tarpeen.
- Pushaa mainiin.
