# Landing Design Spec — Puheo Pass 3

Design language inherits from the Cuaderno system (Crimson Pro display, Nunito body, DM Mono mono, parchment palette, ochre brand). No new tokens. All sections use existing component CSS.

---

## Page Architecture (new section order)

```
0. Urgency bar (corrected date + always show in sprint, not just summer)
1. Nav
2. Hero (headline + CTA + trust strip + countdown inline)
3. Mini-diagnostic inline (tightened to 5 questions)
4. Grading demo (moved up — strongest proof)
5. Problem / Solution (condensed to one section)
6. Features (3 cards)
7. Social proof / Authority
8. Comparison (vs Duolingo/Quizlet, not just Abitreenit)
9. Pricing
10. FAQ
11. CTA (final)
12. Footer
```

Rationale for reorder: Grading demo (currently section 17) is the most convincing visual proof — it must come early. Pricing moves from section 18 to section 9 to serve the "already convinced" cohort who scrolls looking for the price. The duplicate "how it works" sections are merged and removed.

---

## Section 0 — Urgency Bar

**Always visible** (not just summer) from now until exam date 28.9.2026. Dismissible per session.

**Content:**
```
⏱ Espanjan YO-kirjoitukset 28.9.2026 — [N] päivää jäljellä. Aloita nyt →
```

**Notes:**
- Date in JS: `new Date(2026, 8, 28)` — corrected from current wrong `8, 15`.
- Link goes to `#mini-diag`, not `#pricing`.
- On mobile: shorten to "YO-koe 28.9. — [N] pv" to fit one line.

---

## Section 1 — Nav

No structural change. One tweak: primary CTA "Aloita ilmaiseksi" → links to `#mini-diag` (anchor on same page) instead of `app.html`. Students should see the diagnostic first. The diagnostic result then pushes to `app.html`.

Nav links: `Testaa tasosi | Miten toimii | Hinnoittelu | UKK` — same.

---

## Section 2 — Hero

### Desktop layout (two-column above 768px)

Left column (text):
```
[tag: ESPANJA · LYHYT OPPIMÄÄRÄ · YO-KOE 28.9.2026]

Paranna espanjan YO-arvosanaa
ennen 28.9.2026.

Personoidut harjoitukset. YTL-rubriikin mukainen kirjoitelma-arviointi. 
Täyskoe-simulaatio. Tekoälyllä.

[CTA primary: Testaa tasosi — 60 sekuntia →]
[CTA secondary: Aloita ilmaiseksi]

• [N] päivää YO-kokeeseen 28.9.2026
• Ei luottokorttia vaadita
• 14 pv rahat takaisin -takuu
```

Right column (visual):
The essay annotation demo card (from current "grading" section) — a mini version showing the student essay + two error annotations + score grid showing "Arvosana M". This is the strongest visual proof. Make it static at hero size (≈320px wide).

### Mobile layout

Full-width, text only. Right column (essay card) hidden on mobile. Countdown merged into hero as a single line: "**[N] päivää** YO-kokeeseen 28.9.2026" in the trust strip (bolder than current).

### Changes from current hero

- Headline updated: adds "ennen 28.9.2026" for exam date framing.
- Primary CTA changed from "Aloita ilmaiseksi" to "Testaa tasosi — 60 sekuntia →" — value before commitment.
- Secondary CTA "Testaa tasosi" link to diagnose.html removed — diagnostic is inline below.
- Social proof `.hero-social-proof` element removed (dead DOM node, no data source).
- Separate exam countdown section (current section 6) eliminated — merged into hero trust strip.
- Essay annotation card added in right column (desktop only).

---

## Section 3 — Mini-Diagnostic (inline)

### Redesign spec

**Entry state:**
```
[kicker: ADAPTIIVINEN TAITOTASO-ARVIO]
Missä tasolla olet nyt?
Vastaa 5 kysymykseen — saat tuloksen heti.
[button: Aloita arvio →]
Ei kirjautumista vaadita.
```

**Question state:**
- Show progress: "Kysymys 2/5" with progress bar.
- Show question type tag: SANASTO / KIELIOPPI / LUETUN YMMÄRTÄMINEN.
- MCQ options: 2-column grid on desktop, 1-column on mobile.
- After answer: show brief explanation (1 sentence) + "Seuraava →".
- No "next" button if unanswered — require a selection.

**Changes from 3 → 5 questions:**
- Q1: Easy vocabulary (B1) — establishes baseline.
- Q2: Medium grammar (subjunctive / ser vs estar) — common YO trap.
- Q3: Hard grammar (condicional/preterito vs imperfecto) — differentiates B2 from C1.
- Q4: Medium reading comprehension (1 sentence, pick correct interpretation).
- Q5: Hard vocabulary (C1 level word not in basic curriculum).

5 questions gives enough signal to estimate grade bracket. Still < 90 seconds.

**Result state (AFTER showing grade, THEN email capture):**

```
[grade display: big letter, e.g. "C"]
Arviomme: arvosana C (Tyydyttävä)

Heikoin alue: Kielioppi — subjunktiivi
Lähimmät pisteet tavoitetasoon M: kieliopin oikeellisuus

[breakdown table:
  Sanasto      ●●●○○  Hyvä
  Kielioppi    ●●○○○  Kehitettävää
  Luetun ymm.  ●●●●○  Vahva
]

Haluatko henkilökohtaisen harjoittelusuunnitelman?
[input: email@esimerkki.fi]
[button: Saa suunnitelma →]
[link: Ei kiitos, jatka ilman →] → app.html
```

**Email-after-value:** Grade is shown unconditionally. Email is asked only after the student has already gotten value. "Ei kiitos" always works — no email wall.

**After email submit:**
- Send to Resend with tag `diagnostic_lead`.
- Show: "Kiitos! Olemme yhteydessä sähköpostitse. Aloita harjoittelu nyt →" → app.html.

**Grade scale explanation:** Add a one-line key below the grade display: "Arviointiasteikko: I A B C M E L (I = hylätty, L = laudatur)" — students and parents who don't know the scale are not left confused.

---

## Section 4 — Grading Demo (moved up)

This is currently section 17 but is the strongest proof of product. Move to section 4.

**Visual:** Side-by-side:
- Left: student essay with inline error annotations (numbered superscripts, color-coded).
- Right: score bars (Sisältö, Laajuus, Oikeellisuus) + total + grade letter.

**Content changes:**
- Keep Liisa's email example but make the task more recognizable exam-style: "Kirjoita lyhyt teksti lemmikkisi esittelystä espanjaksi. 50–70 sanaa." — this is a real lyhyt kirjoitelma format.
- The three annotations are already excellent (subjunctive error, tense inconsistency, register mismatch). Keep as-is.
- Add one sentence above the demo: "Näin Puheo arvioi kirjoitelmasi — YTL:n kolmen kriteerin mukaan."

**Heading:** `YTL-rubriikki, rivi riviltä.` (current h2 is good, keep it)

---

## Section 5 — Problem / Solution (merged)

Merge the current separate Problem (section 9) and Solution/Features (section 10) into one section. Two-column on desktop (problem bullets left, feature cards right), stacked on mobile.

**Problem bullets (left):**
Three specific YO-koe pain points — rewritten to be more precise:

1. **"Duolingo ei opeta YO-koerakennetta"**  
   Duolingo on hyvä sanaston kehittämiseen. Mutta YO-kokeessa on kuuntelua, luetun ymmärtämistä, kielioppia ja kaksi kirjoitelmaa — rakennetta, jota Duolingo ei harjoita.

2. **"Opettaja ehtii lukea kirjoitelmasi ehkä kerran kaudessa"**  
   YTL arvioi kirjoitelman kolmella kriteerillä. Tarvitset palautetta jokaisen harjoituskirjoituksen jälkeen — ei vain ennen koetta.

3. **"Tiedät mikä on vaikea, et tiedä miksi"**  
   Subjunktiivi menee pieleen, mutta miksi? Puheo tunnistaa tarkalleen missä virheit sattuu ja palauttaa ne kertaukseen ennen kuin unohdat ne.

**Solution (right column or below bullets):**
Replace the three feature cards with a benefit-first rewrite:

1. **YTL-rubriikin mukainen kirjoitelma-arviointi**  
   Sama kolme kriteeriä kuin oikeassa kokeessa. Pisteet, virheet, korjaukset — 30 sekunnissa.

2. **Adaptiiviset harjoitukset — ei toisteita**  
   2 000+ tehtävää sanastosta, kieliopista, luetun ymmärtämisestä ja kirjoittamisesta. Taso sopeutuu suoritukseesi. Virheet palautuvat kertaukseen automaattisesti.

3. **Täyskoe-simulaatio YTL:n rakenteella**  
   4-osainen koe aikarajalla. Tiedät tarkalleen missä olet ennen 28.9.2026.

---

## Section 6 — Features (3 cards)

Keep the 3-card grid format from current design. Rewrite copy to be sharper:

| # | Icon | Title | One-sentence benefit |
|---|------|-------|---------------------|
| 1 | ✎ (SVG pen) | YTL-arviointi jokaiselle kirjoitelmalle | 30 sekunnissa: pisteet, virheet, ehdotukset — sama rubriikki kuin kokeessa. |
| 2 | ↻ (SVG cycle) | Älykäs kertaus — ei turha päntääminen | Virheesi palautuvat juuri ennen kuin unohtaisit ne. Ei aikatauluttamista. |
| 3 | ▦ (SVG grid) | 2 000+ harjoitusta, kaikki osa-alueet | 500 sanaa · 480 aukkotehtävää · 240 kääntämistä · 60 luettua · 30 kirjoitelma-aihetta — YO-koepainottainen. |

Replace emoji icons with SVG from Heroicons.

---

## Section 7 — Social Proof / Authority

Single compact authority row — no teacher quote phase yet (skip until real endorsements exist; placeholder cards look amateurish and invite cynicism).

### Authority Strip (compact, inline)

A single horizontal row of 4 credibility signals with SVG icons:
```
[shield] YTL-rubriikin mukainen  ·  [book] 2 000+ harjoitustehtävää  ·  [graduation] Lukion OPS 2021  ·  [flag] Tehty Suomessa
```
One line, no cards. Replaces current 3-card authority grid AND credibility strip (merge both into one compact component).

When real teacher or student quotes exist in a future pass, add a `#quotes` section below this strip. Not now.

---

## Section 8 — Comparison

Replace current "vs. Abitreenit only" with a broader comparison that names the tools students are actually using.

**Pull quote (attributed — if unattributed, frame as explanation):**
> "Abitreenit on hyvä harjoituspankki. Duolingo sopii sanaston muistamiseen. Puheo on ainoa joka arvioi kirjoitelmasi YTL:n rubriikilla ja kertoo tarkalleen mistä pisteet puuttuvat."

**Comparison table:**

| Ominaisuus | Duolingo | Abitreenit | Puheo |
|-----------|---------|-----------|-------|
| Hinta | Ilmainen / 9,99/kk | Ilmainen | 0€ / 9,99€/kk |
| YO-koerakenne | ✗ | ✓ Arkisto | ✓ + simulaatio |
| Kirjoitelma-arviointi | ✗ | ✗ | ✓ YTL-rubriikki |
| Adaptiivinen taso | ✗ | ✗ | ✓ |
| Älykäs kertaus | ✗ | ✗ | ✓ |
| Suomeksi | Osittain | ✓ | ✓ |

Mobile: table collapses to card format (existing CSS handles this).

---

## Section 9 — Pricing

Moved up from section 18. Two pricing cards (Free and Kesäpaketti/Pro) on desktop, stacked on mobile.

**⚠️ Y-tunnus constraint:** "Osta" / "Hanki Pro" buttons MUST route to waitlist, not live payment. Implementation:
- Pro button → triggers waitlist modal (same modal as current summer package).
- Kesäpaketti button → triggers waitlist modal.
- Free button → `app.html` (unchanged).
- Waitlist modal copy: "Maksullinen tilaus avautuu pian. Jätä sähköpostisi niin ilmoitamme heti kun se on saatavilla."

**Card 1 — Free**
```
Free
0€
Riittää kokeilemiseen

✓ 5 harjoitusta / päivä
✓ 1 täyskoe yhteensä
✓ Perussanasto (B1)
✓ Kirjoitelman tarkistus kerran

[button: Aloita Free →] → app.html
```

**Card 2 — Pro / Kesäpaketti** (featured, ochre border)

Show summer package by default (April–August), switch to monthly pro September+.

```
Kesäpaketti 2026                          [badge: SUOSITUIN]
29€   ~~39,96€~~  Säästät 10,96€
Kertamaksu · 1.6.–30.9.2026 · 4 kuukautta

★ Kaikki mitä Pro:ssa
✓ Rajaton harjoitusmäärä
✓ Rajattomat täyskoesimulaatiot
✓ Kirjoitelmien AI-arviointi jokaiseen kirjoitelmaan
✓ Adaptiivinen taso + älykkäs kertaus
✓ Ei automaattista uusimista — 0 peruutushuolia

[button: Ilmoita kun saatavilla →] → waitlist modal
[footnote: Maksullinen tilaus avautuu kesäkuussa 2026. Rekisteröidy jonoon.]
```

No third "coming soon" card — keep it two cards only (Free + Pro/Kesäpaketti). A third card adds visual noise without value at this stage.

**Below pricing cards:**
```
14 päivän rahat takaisin -takuu. Ei kysymyksiä.
Tilauksen voi peruuttaa milloin tahansa.
```

---

## Section 10 — FAQ

Reorder FAQ to serve the full conversion funnel, not just the "about to buy" cohort.

**New FAQ order (8 items):**

1. **Onko tämä virallisesti YTL:n hyväksymä?**  
   Ei — Puheo on itsenäinen harjoittelutyökalu, joka on rakennettu YTL:n julkisen arviointirubriikin mukaan. YTL ei hyväksy tai hylkää harjoitteluohjelmia. Rubriikki on julkinen ja käytämme sitä täsmälleen samalla tavalla kuin opettajasi.

2. **Mitä jos YO-kokeen rakenne muuttuu?**  
   Päivitämme harjoituksia YTL:n julkaisemien ohjeiden mukaan. Espanjan lyhyen oppimäärän koerakenne on pysynyt vakaana usean vuoden ajan. Muutoksista ilmoitamme sähköpostitse.

3. **Onko tietoni turvassa?**  
   Tietosi käsitellään GDPR:n mukaisesti. Palvelimet sijaitsevat EU:ssa. Emme myy tietoja kolmansille osapuolille. Lue tietosuojaseloste →

4. **Toimiiko puhelimella?**  
   Kyllä. Mobile-first design. Toimii kaikissa selaimissa ilman asennusta. Voit lisätä Puheon kotinäytölle PWA:na.

5. **Miten AI-arviointi eroaa opettajan palautteesta?**  
   Puheo arvioi YTL:n kolmella kriteerillä: sisältö, kielellinen laajuus, kielellinen oikeellisuus. Saat pisteet ja tarkat korjausehdotukset 30 sekunnissa — käytettävissä 24/7, ei jonoa.

6. **Voinko peruuttaa tilauksen?**  
   Pro-kuukausitilaus peruuntuu milloin tahansa, vaikutus seuraavalta kaudelta. Kesäpaketista (kertamaksu) saat rahat takaisin 14 päivän sisällä ilman perusteluja.

7. **Sopiiko tämä pitkän oppimäärän opiskelijoille?**  
   Ei tällä hetkellä. Puheo on suunniteltu lyhyen oppimäärän YO-kokeeseen. Pitkän oppimäärän tuki on suunnitteilla.

8. **Kuinka kauan ennen koetta pitää aloittaa?**  
   Suosittelemme vähintään 6 viikkoa ennen koetta. Älykkäs kertausjärjestelmä tarvitsee aikaa rakentaa sinulle optimaalinen kertausaikataulu. Kesäkuussa aloittaminen ennen syksyn 28.9. koetta on ihanteellinen aikataulu.

---

## Section 11 — Final CTA

Simple, high-contrast section. No large heading needed.

```
Kirjoitukset 28.9.2026.
[N] päivää jäljellä.

[button primary: Testaa tasosi ilmaiseksi →] → #mini-diag
[link: Tai aloita harjoittelu suoraan →] → app.html
```

---

## Section 12 — Footer

Add Y-tunnus placeholder once registered:
```
Puheo — Tekoälypohjainen harjoitteluympäristö espanjan ylioppilaskirjoituksiin

Y-tunnus: [xxxxxx-x]  ·  tuki@puheo.fi

© 2026 Puheo

[Blogi] [Tietosuoja] [Käyttöehdot] [Palautukset] [Ota yhteyttä]
```

---

## Mobile Mocks (section-by-section)

| Section | Mobile behavior |
|---------|----------------|
| Urgency bar | 1 line: "YO-koe 28.9. — [N] pv jäljellä →" |
| Hero | Full-width, no essay card. CTA stacked vertically. |
| Mini-diag | Full-width card. 1-col option grid. |
| Grading demo | Stacked: task → essay → score → annotations. No side-by-side. |
| Problem/Solution | Bullets then feature cards, all 1-col. |
| Feature cards | Horizontal scroll carousel (existing CSS). |
| Authority strip | 2×2 grid or vertical stack. |
| Comparison table | Collapses to card format (existing CSS). |
| Pricing | Stacked cards. Kesäpaketti card first. |
| FAQ | Full-width `<details>` accordion, same as current. |
| Footer | Stacked, centered. |

---

## Desktop Mocks (section-by-section)

| Section | Desktop behavior |
|---------|----------------|
| Hero | 2-column: text left, essay annotation card right. |
| Mini-diag | Center-aligned, max-width 640px. |
| Grading demo | 2-column: essay left, score+annotations right. |
| Problem/Solution | 2-column: problems left, features right. |
| Feature cards | 3-column grid. |
| Authority strip | Single horizontal row. |
| Comparison | Full table, max-width 760px. |
| Pricing | 2-column (Free, Kesäpaketti). |
| FAQ | Left-aligned list, max-width 800px. |
