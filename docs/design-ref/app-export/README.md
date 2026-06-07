# Puheo — app-puolen koodi (kirjautumisen jälkeen)

Tämä on Puheo-sovelluksen sisäänkirjautumisen jälkeinen osa, irrotettuna
omaksi ajettavaksi paketiksi. Avaa `index.html` selaimessa: sovellus
käynnistyy suoraan dashboardiin (ei laskeutumissivua eikä kirjautumista).

## Näkymät

- **Dashboard** (`Dashboard.jsx`) — sivupalkki + etusivu: arvioitu taso,
  moodikortit, heikoimmat aiheet. (Sisältää myös `Sidebar`-komponentin.)
- **Oppimispolku** (`Oppimispolku.jsx`) — 8 kurssin polku, kurssi 1 aktiivinen,
  2–8 lukittuina.
- **Kurssi** (`Kurssi.jsx`) — kurssin 1 oppituntilista (10 oppituntia).
- **Harjoitus / drill** (`Exercise.jsx`) — sanaston monivalintaharjoitus,
  skeleton-lataus + suomenkielinen palaute.
- **App** (`App.jsx`) — sovelluksen reititin näiden välillä.
- **Icons** (`Icons.jsx`) — React-natiivit Lucide-SVG:t (`Icon`-komponentti).

Navigointi: sivupalkki vaihtaa näkymää; **Oppimispolku** → aktiivinen kurssirivi
avaa kurssin → oppitunnin **Aloita →** käynnistää harjoituksen.

## Tyylit ja fontit

- `colors_and_type.css` — design-tokenit (värit, typografia, välistys, varjot, liike).
- `kit.css` — komponenttityylit (rakentuu tokenien päälle).
- `fonts.css` + `fonts/` — itse hostatut Fredoka (otsikot) + Mulish (leipä/UI).

## Huomiot

- Tämä on **korkean tarkkuuden UI-rekonstruktio**, ei tuotantokoodia: ei oikeaa
  dataa, ei tallennusta. Harjoitus kiertää muutamaa esimerkkikysymystä.
- React, ReactDOM ja Babel ladataan CDN:stä, joten ensimmäinen avaus vaatii
  verkkoyhteyden. JSX käännetään selaimessa (Babel standalone). Tuotannossa
  JSX kannattaa esikääntää.
- `Icon` renderöi Lucide-SVG:t suoraan Reactissa. Älä tuo takaisin
  `lucide.createIcons()`-kutsua: se muokkaa DOMia ja kaataa Reactin
  uudelleenrenderöinnissä.
