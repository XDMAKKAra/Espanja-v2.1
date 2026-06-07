# Puheo — landing-sivun koodi

Puheon markkinointisivu (landing) irrotettuna omaksi ajettavaksi paketiksi.
Avaa `index.html` selaimessa.

## Rakenne (ylhäältä alas)

- **TopNav** (`TopNav.jsx`) — sticky-navigaatio, lasiefekti vieritettäessä.
- **Hero** (`Hero.jsx`) — kaksipalstainen: teksti + ilmais-CTA vasemmalla,
  **kurssikortti** (`CourseCard.jsx`) oikealla (ES/FR/DE-välilehdet, hinta,
  "mitä sisältyy" -lista). Ei demoa herossa.
- **Arviointi** (`Arviointi.jsx`) — "Näin arviointi toimii" + **grader-kortti**
  (`GraderCard.jsx`, suomenkieliset virhemerkinnät + YTL-rubriikki) yhden
  vierityksen päässä. Sama tiedosto sisältää **Coverage**-osion (mitä polku kattaa).
- **Languages** (`Languages.jsx`) — espanja/saksa/ranska -lista.
- **Pricing** (`Pricing.jsx`) — ilmainen aloitus · Treeni 9 €/kk · Kurssi 49 €.
- **Faq** (`Faq.jsx`) — usein kysytyt + **Footer**.
- **App** (`App.jsx`) — kokoaa landingin. Koska tässä paketissa ei ole
  sovellus-/kirjautumispuolta, CTA:t vierittävät hinnoitteluun ja
  "Katso miten arviointi toimii" arviointiosioon.
- **Icons** (`Icons.jsx`) — React-natiivit Lucide-SVG:t.

## Tyylit ja fontit

- `colors_and_type.css` — design-tokenit. `kit.css` — komponenttityylit.
- `fonts.css` + `fonts/` — Fredoka (otsikot) + Mulish (leipä/UI).

## Huomiot

- Korkean tarkkuuden UI-rekonstruktio, ei tuotantokoodia. Maksu-CTA:t ovat
  lead-capture-tyyppisiä; ilmainen aloitus on pääkonversio.
- React/ReactDOM/Babel CDN:stä → ensimmäinen avaus vaatii verkkoyhteyden, JSX
  käännetään selaimessa. Tuotannossa esikäännä JSX.
- Älä tuo takaisin `lucide.createIcons()`-kutsua (kaataa Reactin
  uudelleenrenderöinnissä); `Icon` renderöi SVG:t natiivisti.
