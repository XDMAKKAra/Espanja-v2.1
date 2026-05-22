# BRIEF: Sidebar mode-list plumbing v278

**Päivä:** 2026-05-22
**Versio:** v278
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v277 (SidebarShell-restrukturointi) PAKOLLINEN — tämä jatkaa v277:n jättämästä gapista
**Lähde:** v277-toteutuksen oma deviation note: "*#sidebar-mode-items ships empty for now; renderer takes a list but call-sites pass items: []. Wiring real lesson lists into MODE-state needs curriculum-state plumbing — left for a follow-up loop.*"
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + TESTING (webapp-testing, superpowers:verification-before-completion). Kutsu Skill-toolia aidosti.

---

## Tavoite

Sidebar näyttää konkreettiset kurssi/lesson-linkit kun käyttäjä on MODE-tilassa. Tällä hetkellä `data-mode="mode"` aktivoituu mutta `#sidebar-mode-items` on tyhjä — sidebar näyttää vain mode-otsikon ("Sanasto") ja paluu-linkin.

Lopputulos: kun käyttäjä avaa Sanasto-moden, sidebariin renderöityy kurssit (K1–K8) ja kunkin alle lessonit, klikattavina. Aktiivinen lesson korostuu brick-värillä (v276-tokens).

EI redesign — vain data-plumbing v277:n valmiiseen renderöinti-rakenteeseen.

---

## Konteksti

v277 loi `setSidebarMode("mode", { modeKey, modeLabel, items })` -API:n. `items`-array määrittelee mitä `#sidebar-mode-items` -listaan renderöityy. Mutta kaikki nykyiset call-sitet välittävät `items: []`.

Curriculum-data on jo olemassa: `LANG_CURRICULA.*` -objekti (memory: `feedback_curriculum_uses_ytl_grades.md`), `lib/learningPath.js`, ja `routes/curriculum.js`. Front-päässä tieto kulkee usein `app.js`:n state-objektin tai dashboard.js:n payloadin kautta.

Tämä brief:
1. Etsii oikean data-lähteen (curriculum-state)
2. Muokkaa sen sidebar-items-muotoon
3. Kutsuu `setSidebarMode` oikealla items-arraylla jokaisesta mode-screen-avaajasta

---

## Toteutus

### Step 1: Tunnista data-lähde

**Tutkimusvaihe** ennen kuin koskee koodiin:

1. Grep `LANG_CURRICULA` koko frontin koodista — missä se ladataan, missä se on saatavilla
2. Grep `lessons` ja `kurssit` `js/screens/*` — missä mode-screenit lataavat oman lesson-listan
3. Lue `routes/curriculum.js` — mitä API palauttaa, mihin frontend kutsuu
4. Tarkista käytetäänkö `state.curriculum` -patternia app.js:ssä

Lopputulos: tunnista 1–2 funktiota / endpointia joka palauttaa nykyisen kielen kurssit + lessonit jo valmiina rakenteena. **ÄLÄ rakenna uutta lataajaa** jos data on jo siellä.

### Step 2: Sidebar-items-muoto

`#sidebar-mode-items` renderöi listan v277:n shape mukaan:
```js
items = [
  { key: "k1-l1", label: "Kurssi 1 · Lecciñn 1", active: false },
  { key: "k1-l2", label: "Kurssi 1 · Lecciñn 2", active: true },
  // ...
]
```

Jos haluat kurssi-otsikot ryhmittäin (suositus), laajenna v277:n renderöintiä tukemaan otsikkoa:
```js
items = [
  { type: "heading", label: "Kurssi 1 — Tervetuloa" },
  { type: "lesson", key: "k1-l1", label: "Tervehdykset", active: false },
  { type: "lesson", key: "k1-l2", label: "Itsestään kertominen", active: true },
  { type: "heading", label: "Kurssi 2 — Arki" },
  { type: "lesson", key: "k2-l1", label: "Arjen rutiinit", active: false },
  // ...
]
```

Päivitä `js/components/sidebarShell.js` renderToomaan tämän shape:n:
```js
function renderModeNav({ modeKey, modeLabel, items = [] }) {
  // ... title rendering same as v277 ...
  itemsEl.innerHTML = "";
  for (const item of items) {
    if (item.type === "heading") {
      const li = document.createElement("li");
      li.className = "sidebar-section-heading";
      li.textContent = item.label;
      itemsEl.appendChild(li);
    } else {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.className = "sidebar-item sidebar-item--lesson";
      if (item.active) btn.classList.add("active");
      btn.dataset.action = "open-lesson";
      btn.dataset.lessonKey = item.key;
      btn.textContent = item.label;
      li.appendChild(btn);
      itemsEl.appendChild(li);
    }
  }
}
```

### Step 3: Heading-styling CSS

**Tiedosto:** `css/sidebar-shell.css`

Lisää:
```css
.sidebar-section-heading {
  padding: 16px 12px 6px;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}
.sidebar-section-heading + .sidebar-item--lesson { /* ensimmäinen lesson otsikon alla */ }
```

Heading on Manrope (peritty), 11px, light, EI mono — vältä mono-UPPERCASE-slop. Letter-spacing tekee pienelle tekstille luettavan.

### Step 4: Call-site päivitykset

**Etsi** kaikki paikat joissa kutsutaan `setSidebarMode("mode", ...)` tai `setSidebarMode("mode", { items: [] })`.

Korvaa per mode-screen:

```js
// js/screens/sanasto.js (tai vastaava)
import { setSidebarMode } from "../components/sidebarShell.js";
import { buildSidebarItemsForMode } from "../lib/sidebarItems.js";

async function openSanastoScreen() {
  // ... existing render logic ...
  const items = await buildSidebarItemsForMode("vocab", currentLessonKey);
  setSidebarMode("mode", { modeKey: "vocab", modeLabel: "Sanasto", items });
}
```

### Step 5: Uusi util — `lib/sidebarItems.js`

**Uusi tiedosto:** `js/lib/sidebarItems.js`

```js
// Builds sidebar items[] for MODE-state. Reads from the in-memory
// curriculum state (loaded once per session) and tags the user's
// current lesson as active.

import { getCurriculum } from "./curriculumState.js"; // tai mistä se on saatavilla

export async function buildSidebarItemsForMode(modeKey, activeLessonKey = null) {
  const curriculum = await getCurriculum();   // { kurssit: [{ key, label, lessons: [...] }] }
  if (!curriculum?.kurssit) return [];

  const items = [];
  for (const k of curriculum.kurssit) {
    items.push({ type: "heading", label: `${k.label}` });
    for (const lesson of (k.lessons || [])) {
      // Filter lessons by mode (only show lessons relevant to this mode)
      if (!lessonAppliesToMode(lesson, modeKey)) continue;
      items.push({
        type: "lesson",
        key: `${k.key}:${lesson.key}`,
        label: lesson.label,
        active: `${k.key}:${lesson.key}` === activeLessonKey,
      });
    }
  }
  return items;
}

function lessonAppliesToMode(lesson, modeKey) {
  // E.g. lesson.modes = ["vocab", "grammar"] — only show in those modes.
  // Fallback: show in all modes if lesson.modes is absent.
  if (!lesson.modes) return true;
  return lesson.modes.includes(modeKey);
}
```

**Sovita** funktion sisäinen logiikka oikeaan curriculum-state-rakenteeseen. Jos `lessonAppliesToMode` ei ole järkevä (esim. kaikki lessonit toimivat kaikissa modeissa), poista filter — näytä kaikki.

### Step 6: Click-handler "open-lesson"

**Tiedosto:** `js/components/sidebarShell.js` (v277:n event-delegation-listener)

Lisää click-routerille `open-lesson` -käsittely:
```js
if (actionBtn?.dataset.action === "open-lesson") {
  const lessonKey = actionBtn.dataset.lessonKey;
  // dispatch lesson-open event tai navigoi suoraan
  document.dispatchEvent(new CustomEvent("puheo:open-lesson", {
    detail: { lessonKey }
  }));
  return;
}
```

Mode-screen kuuntelee `puheo:open-lesson` ja avaa lessonin omassa tilassaan. Tämä pitää sidebar-komponentin agnostisena lesson-logiikasta.

---

## Verifiointi

1. **Baseline-screenshot:** kirjaudu testpro123, avaa Sanasto → sidebar näyttää vain otsikon "Sanasto" + paluu-linkin (tämä on v277-tila)
2. **After-screenshot:** sama flow → sidebar näyttää 8 kurssi-otsikkoa + kunkin alla lessonit
3. **Aktiivisen lessonin korostus:** klikkaa K2:L3 → se saa `.active`-luokan, brick-tausta
4. **Klikkaa lesson sidebarista:** mode-screen vaihtuu siihen lessoniin
5. **Mobile (375px):** sidebar slide-in, lessonit klikattavina, 44px touch target
6. **Tab-navigaatio:** Tab kulkee headingit ohi, vain `.sidebar-item--lesson` -elementit ovat focusable
7. **Playwright regression:** `tests/e2e/sidebar-mode-plumbing.spec.js`:
   - Kirjaudu, avaa Sanasto, odota että `#sidebar-mode-items > li` -elementtejä on ≥ 1
   - Klikkaa ensimmäistä lessonia, odota että mode-screen vaihtuu

8. **`npm run build`** + **`npm test`** PASS
9. **Bumppaa `sw.js` CACHE_VERSION** (uusi tiedosto `lib/sidebarItems.js` + päivitetty `sidebarShell.js`)

---

## Commit + PR

- **2 commitia 1 PR:**
  - `feat(sidebar): heading + lesson items in MODE-state (v278)` — renderer-päivitys + CSS-heading + sidebarItems-util
  - `refactor(screens): pass real items to setSidebarMode call-sites` — call-site-päivitykset
- Otsikko: `feat(sidebar): mode-list plumbing v278`
- IMPROVEMENTS.md-rivi: `v278 — feat: sidebar näyttää kurssit + lessonit MODE-tilassa (v277 follow-up)`

**Ei pushia ilman lupaa.**

---

## Don't

- ÄLÄ tee uutta API-reittiä — käytä olemassa olevaa curriculum-dataa
- ÄLÄ rakenna curriculum-lataajaa uudestaan — sidebar lukee jo-ladatusta state-objektista
- ÄLÄ tee headingiä mono-UPPERCASE-isolla — letter-spacing + normaali tracking riittää
- ÄLÄ unohda `lessonAppliesToMode` -filteriä — Sanasto-modessa ei pitäisi näkyä luetun-ymmärtäminen-lessoneita (jos curriculum tekee tämän eron)
- ÄLÄ käytä side-stripe-borderia aktiivisen lessonin korostukseen — käytä taustaa (brand-brick-soft) + tekstinväriä (brand-brick), kuten v276:n sidebar-active
- ÄLÄ tee Vercel-promotea automaattisesti — odota Marcelin OK:tä

## Onnistuminen

- [ ] `lib/sidebarItems.js` luotu, käyttää olemassa olevaa curriculum-statea
- [ ] `sidebarShell.js` renderToi headingit + lessonit
- [ ] CSS `.sidebar-section-heading` styled, ei mono-uppercase-slop
- [ ] Click-handler dispatchaa `puheo:open-lesson` -eventin
- [ ] Kaikki mode-screenit kutsuvat `setSidebarMode("mode", { items })` oikealla datalla
- [ ] Aktiivinen lesson korostuu brick-värillä
- [ ] Playwright regression PASS
- [ ] Mobile slide-in toimii, 44px touch target lessonissa
- [ ] Tab-navigaatio skippaa headingit
- [ ] `npm run build` + `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu
- [ ] 2 commitia, IMPROVEMENTS.md-rivi
- [ ] PR avattu, EI mergattu
