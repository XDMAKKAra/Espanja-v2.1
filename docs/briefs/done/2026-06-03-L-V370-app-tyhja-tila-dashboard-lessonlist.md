# L-V370 — App-puolen tyhjä tila: Koti-dashboard desktop + lesson-lista + eväste-banneri

**Päivä:** 2026-06-03
**Prioriteetti:** P2 (kosmeettinen, mutta näyttää keskeneräiseltä)
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`. (Jos kosket microcopyyn → lisää `humanizer`.)

---

## Tausta

Marcel (2026-06-03): app-puoli näyttää tyhjältä ja keskeneräiseltä desktopilla. Vertailukohta on WordDiven tiheys (ei sen turkoosi paletti, vaan se että ruutu on täynnä eikä ammota tyhjää). L-V364 siivosi profiilin kortit + chipit + loaderin, mutta nämä jäivät:

1. **Koti-dashboard desktop puoliksi tyhjä** (kuva 8): sisältö on ylävasemmalla ahtaana pylväänä, oikea + alaosa täysin tyhjää cream-aluetta. Layout ei käytä desktop-leveyttä.
2. **Eväste-banneri vaatii skrollin** (kuva 1): "jatka harjoittelua" avaa ensin lähes tyhjän näytön, ja eväste-ilmoitus on niin alhaalla oikealla että se pitää skrollata näkyviin. Huono ensivaikutelma.
3. **Kurssi 1 lesson-lista geneerinen/ruma** (kuva 2): pitkä identtinen rivilista (numero + tag + otsikko + min + "Aloita"), tuntuu slopilta.

## Tehtävät (INTENT, ei pikseleitä — valitse komposition itse)
1. **Koti-dashboard:** käytä desktop-leveys. Tyhjä oikea/alaosa pitää joko täyttää mielekkäällä sisällöllä (esim. viimeisin aktiivisuus, seuraava oppitunti, streak-konteksti) tai layout pitää keskittää/rajata niin ettei ammota tyhjää. Älä lisää slop-täytettä (ei 4 identtistä korttia, ei placeholder-mittareita).
2. **Eväste-banneri:** näytä se heti above-the-fold tai siirrä niin ettei vaadi skrollia. "Jatka harjoittelua" -näkymä ei saa olla tyhjä lataushetkellä.
3. **Lesson-lista:** riko monotonia. Ei tarvitse 10 identtistä riviä; ryhmittele, korosta seuraava/aktiivinen, anna suoritetuille eri kohtelu. Pidä luettavuus.

## Acceptance
- Desktop Koti (1440px) ei jätä >40% ruudusta tyhjäksi creamiksi.
- "Jatka harjoittelua" / eväste-banneri näkyy ilman skrollia.
- Lesson-lista ei ole 10 identtistä riviä; aktiivinen + suoritettu erottuvat selvästi.
- Ei uutta AI-slopia (CLAUDE.md-checklist: ei identtisiä korttiruudukkoja, ei tyhjää `—`-placeholderia, ei mono-UPPERCASE-chipejä ilman syytä).
- `npm run build`, screenshot ennen/jälkeen desktop + mobile.

## Ulkopuolella
Landing (eri pinta) → V369. Profiilin kortit → jo tehty V364.
