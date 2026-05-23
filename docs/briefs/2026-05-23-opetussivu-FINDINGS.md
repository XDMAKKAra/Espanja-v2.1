# FINDINGS — Opetussivu double-sidebar (L-V288-LESSON-SHELL-1)

**Päivä:** 2026-05-23
**Investigointi:** ennen koodimuutoksia, brief edellyttää.

## TL;DR

Kaksoissidebar on **suunniteltu** mutta sen toteutus on hauras. Lessonsivulla (`#screen-digikirja`) on v277:n jälkeen kaksi kerrosta:

1. **Global `.app-sidebar`** (position:fixed, left:0), oletuksena 220px. Book-modessa CSS pakottaisi 56px railiksi `@media (min-width: 1024px)`.
2. **`.dk__sidemenu`** (288px), lessonin oma TOC, elää `.dk__body`:n grid-sarakkeessa 1.

Molemmat alkavat **x=0**. Lessonin TOC ei jätä railille tilaa. Sekä `.app-sidebar` että `.dk__sidemenu` renderöivät oman Puheo-logon, oman "Aloitus"-toiminnon ja omat alavalikot. Päällekkäisyys on rakenteellinen, ei pikseli-bug.

## Investigoidut tiedostot

- `app.html` (shell-markkupin lähde, rivit 104–156, 897–899)
- `js/screens/digikirja.js` (lesson-render, rivit 400, 2076, 2095, 2220–2304)
- `js/components/sidebarShell.js` (setSidebarMode, rivit 22–40)
- `css/components/sidebar-shell.css` (book-mode rail, rivit 49, 143–171)
- `css/components/digikirja.css` (dk-layout + body:has override, rivit 51–80, 247–290, 306–340)
- `css/components/app-shell.css` (perus 2-col grid, rivit 5–18, 43–62)
- `style.css` (perus `.app-sidebar` position:fixed, rivit 300–319)

## Miten kaksoissidebar konkreettisesti syntyy

### Layer 1 — `.app-sidebar` (style.css:300)
```
position: fixed; left: 0; top: 0;
width: 220px; height: 100dvh;
```
Fixed-positio sitoo sen viewportin vasempaan reunaan **riippumatta `.app-shell`:n grid-saraketta**. Grid varaa vain visuaalisen tilan, mutta sidebar ei "elä" gridissä.

### Layer 2 — book-mode rail (sidebar-shell.css:149–166)
```css
@media (min-width: 1024px) {
  .app-sidebar[data-mode="book"] { width: 56px; }
  ... .sidebar-logo span:not(:first-child),
      .sidebar-item:not(.sidebar-item-icon-only) > *:not(.sidebar-item-icon),
      .sidebar-mode-title, .sidebar-pro-slot, .sidebar-user { display: none; }
}
```
Selector-virheet:
- `.sidebar-logo span:not(:first-child)` — markup on `Puhe<span>o</span>`, ja tämä `<span>` on ainoa lapsi → `:not(:first-child)` ei matchaa → "o" jää näkyviin.
- `.sidebar-item-icon-only` -luokkaa ei käytetä missään markupissa. Selector luettiin kvalifioiduksi ehkä-säännöksi mutta sitä ei oikeasti laukea.
- Tekstin sidebar-item-otsikot piilotetaan, mutta `padding: 10px 12px` jättää napit edelleen 36+ pikseliä korkeiksi → 56px-rail tuntuu täydeltä rivinä.

### Layer 3 — `.dk__body` grid (digikirja.css:247–264)
```
display: grid;
grid-template-columns: var(--dk-sidemenu-width) minmax(0, 1fr);
```
`--dk-sidemenu-width: 288px`. Grid alkaa x=0, koska `.app-main { padding: 0 !important }` book-modessa (digikirja.css:63–66). Lessonin TOC:n vasen reuna on **identtinen** position-fixed shell-sidebarin vasemman reunan kanssa → ne ovat tarkalleen päällekkäin.

### Layer 4 — kahden Puheo-logon kollisio
- `.app-sidebar .sidebar-logo` (app.html:122): "Puhe<span>o</span>", väri `--ink` + accent-dark "o":lle.
- `.dk__sidemenu .dk__sidemenu-logo` (digikirja.css:315): "Puhe<span>o</span>", väri `--ed-ink` + brick italic "o":lle.

Molemmat sijaitsevat x≈0–24px alueella ja molempien y on lähellä topbarin alapuolta. Käyttäjän raportoima "Puhe + neo" -overlap on kahden eri komponentin Puheo-logon literal-päällekkäisyys.

### Layer 5 — race-ehto
`setSidebarMode("book")` kutsutaan dynaamisella importilla **kun screen-digikirja on jo aktivoitu**:
```js
host.innerHTML = renderLoadingShell();     // digikirja.js:2239
show("screen-digikirja");                  // 2240
import("../components/sidebarShell.js")    // 2244 (async)
  .then((m) => m.setSidebarMode("book"));
```
Ennen `then`-callbackin laukeamista `data-mode` on edelleen "home" tai "mode" (riippuen mistä käyttäjä navigoi). Jos käyttäjä saapuu suoraan deep-linkistä, default-arvo "home" pitää shell-sidebarin täysikokoisena 220px:nä. Käyttäjän screenshot näyttää **täydet sidebar-tekstit** (Puheo, Aloitus, Asetukset) → joko race on aktiivinen, tai 56px-rail-CSS ei vain matchaa (yllä mainitut selector-virheet).

### Layer 6 — book-mode mode-only on tyhjä
sidebar-shell.css:49 paljastaa `[data-mode-only="book"]` -slotin. Ripgrep koko repoa: **`data-mode-only="book"` ei esiinny missään HTML:ssä**. Eli vaikka book-mode aktivoituisi, sen sisältö on tyhjä — railiin jää pelkkä logo + footer + tyhjä keskialue.

## Sisäkkäisyys ei ole "vahinko" vaan suunniteltu kerros

CSS-kommentit ovat ristiriidassa:
- `digikirja.css:306` sanoo: *".dk__sidemenu top-slot replaces the standalone global .app-sidebar on this screen"*
- `sidebar-shell.css:143–149` sanoo: *"replaces the old `body:has(...) .app-sidebar { display: none }` band-aid. The book screen now owns its own internal sidemenu; we collapse the global sidebar to a compact 56px rail"*

Yhdessä: shell kuoritaan 56px-railiksi JA lessonin sidemenu hoitaa täyden Puheo+Aloitus+TOC -tarjonnan. Mutta:
- Rail itse ei toimi luotettavasti (Layer 2-virheet)
- Tarjonta on tuplattu (kahdesti Puheo, kahdesti Aloitus, kahdesti käyttäjä-affordanssi)
- `dk__body` ei varaa railille tilaa → vaikka rail toimisi, se peittäisi dk__sidemenun ensimmäiset 56px

**Tämä on three-strikes-arkkitehtuuriongelma:**
- Strike 1: PR-sarja #118–#128 — Otava-rebuild
- Strike 2: v277 sidebar-shell — "collapse to rail" -lähestymistapa
- Strike 3: 2026-05-23 raportti — sama ongelma uudelleen

Band-aid-korjauksen (esim. lisää `padding-left: 56px` `.dk__body`:lle) johtaisi neljänteen striikkiin: jokin uusi käyttötapa rikkoo sen.

## Päätös: Suunta A

**Opetussivu omistaa shellin kokonaan. `.app-sidebar` piilotetaan book-modessa (`display: none`).**

Perustelut painekokeen jälkeen:
1. **Tarjonta on jo tuplattu.** `.dk__sidemenu`:llä on Puheo-logo, Aloitus-action, kurssi-konteksti, käyttäjäaffordanssi via topbar-tools. Rail ei tarjoa mitään mitä dk__sidemenu ei jo tarjoa.
2. **Rail-koodi on kuollut.** `.sidebar-item-icon-only` ei matchaa missään; `:not(:first-child)` ei matchaa Puheo-logoa; `[data-mode-only="book"]` -slot on tyhjä. Tämän koodin korjaaminen oikein toimivaksi railiksi vaatisi enemmän muutoksia kuin sen poistaminen.
3. **Three-strikes = rakenne, ei band-aid.** Restrukturointi tarkoittaa kerrosten vähentämistä, ei niiden taklauttamista CSS-overrideilla. Yksi sidebar lessonilla = yksi totuuden lähde.
4. **`body:has(#screen-digikirja.active) .app-sidebar { display: none }` -band-aid oli juuri se mikä v277:ssä yritettiin korjata.** Mutta v277:n korjaus tuotti tämän bugin. Palaamme alkuperäiseen, mutta puhtaalla tavalla: ei `body:has`-nuotalla vaan `[data-mode="book"]`-attribuuttipohjaisella säännöllä, joka on JS:n kontrolloitavissa.
5. **Riski (käyttäjä menettää pääsyn Aloitukseen) on jo katettu.** dk__sidemenu:llä on "Aloitus"-action (digikirja.css:334 `.dk__sidemenu-action`) JA dk__topbar:llä on "Aloitus"-home-nappi (digikirja.css:131 `.dk__home`). Käyttäjä saa joka tapauksessa **kaksi** Aloitus-affordanssia opetussivulla.

Suunta B (säilytä shell + piilota mode-itemit) hylätään: se on jo nykyinen suunta ja tuotti tämän bugin. Lisää CSS-state-koordinointia ei korjaa rakenteellista tuplaa.

## Implementointi-suunnitelma

1. **sidebar-shell.css:** korvaa `@media (min-width: 1024px) { .app-sidebar[data-mode="book"] { width: 56px; ... } }` säännöllä `.app-sidebar[data-mode="book"] { display: none; }`. Mobile @media (max-width: 1023px) jätä ennalleen — off-canvas pärjää, mutta jos book-mode aktiivinen, älä salli swipe-revealia kun shell-itemit eivät ole relevantteja.
2. **digikirja.css:** poista `body:has(#screen-digikirja.active) .app-shell { grid-template-columns: 1fr }` ja siihen liittyvät override-säännöt **vain jos** sidebar-shell.css:n display:none vie tilan oikein. Yksinkertaisempi: pidä body:has-säännöt mutta poista `!important`-spämmi koska gridiä ei tarvitse enää overridea (sidebar on jo display:none).
3. **digikirja.js:** ei muutoksia tarpeen. `setSidebarMode("book")` jatkaa data-mode-attribuutin asettamista.
4. **app.html:** ei muutoksia.
5. **Cleanup:** poista kuollut `data-mode-only="book"` -slot reveal-rule (`sidebar-shell.css:49`).

## Off-scope

- dk__sidemenu:n leveys, sticky-positio, topbar-rakenne — ne toimivat.
- Lesson-sisältö (espanja-esimerkit, suomi-selitykset) — ei muutu.
- Mobile off-canvas-flow — testaa että ei regressio mutta ei rakennemuutoksia.

## Verify-protokolla

1. Playwright spec briefin mukaan: 3 testiä, kaikki PASS
2. Manuaalinen Playwright-tarkistus 3 lessonille: `es/kurssi_1/1/teoria`, `es/kurssi_1/2/teoria`, `es/kurssi_2/1/teoria`
3. `npm run build` läpi
4. `node --check` kaikki muutetut JS-tiedostot (vaikka muutos on CSS-pääosin)
5. `npm test` ei regressioita
6. Screenshot 1440×900 → täsmälleen yksi sidebar näkyvissä
