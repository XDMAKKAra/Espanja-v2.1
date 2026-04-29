/**
 * Minimal kurssi → first-week lesson catalogue used by the L-PLAN-1
 * onboarding endpoint to generate a deterministic 5-day plan preview.
 *
 * Source: CURRICULUM_SPEC.md §3. Only the first ~5 lessons per kurssi are
 * encoded here because that's all the onboarding plan ever shows. The
 * full curriculum tables (curriculum_kurssit / curriculum_lessons) ship
 * in L-PLAN-2.
 *
 * `taskTitle` is intentionally outcome-shaped ("kuvaa perheesi" rather
 * than "Lesson 1") per backwards-design — the student should know what
 * they'll be able to do after each session.
 */

export const KURSSI_META = {
  kurssi_1: { name: "Kurssi 1 — Kuka olen", level: "A" },
  kurssi_2: { name: "Kurssi 2 — Arki ja elämä", level: "A" },
  kurssi_3: { name: "Kurssi 3 — Mitä tein", level: "B" },
  kurssi_4: { name: "Kurssi 4 — Ennen ja nyt", level: "B" },
  kurssi_5: { name: "Kurssi 5 — Tulevaisuus ja unelmat", level: "C" },
  kurssi_6: { name: "Kurssi 6 — Maailman ongelmat", level: "C" },
  kurssi_7: { name: "Kurssi 7 — Kulttuuri ja yhteiskunta", level: "M" },
  kurssi_8: { name: "Kurssi 8 — YO-koevalmiiksi", level: "E" },
};

const KURSSI_LESSONS = {
  kurssi_1: [
    { type: "vocab",   focus: "Perhe ja kansallisuudet" },
    { type: "grammar", focus: "-ar-verbit preesensissä" },
    { type: "grammar", focus: "-er- ja -ir-verbit preesensissä" },
    { type: "vocab",   focus: "Koulu ja värit" },
    { type: "grammar", focus: "Ser ja estar perusteet" },
    { type: "vocab",   focus: "Numerot ja ikä" },
    { type: "writing", focus: "Esittely itsestäsi (50–80 sanaa)" },
  ],
  kurssi_2: [
    { type: "vocab",   focus: "Koti ja huonekalut" },
    { type: "grammar", focus: "Epäsäännölliset preesens-verbit" },
    { type: "vocab",   focus: "Ruoka ja ateriat" },
    { type: "grammar", focus: "Gustar-rakenne ja pronominit" },
    { type: "vocab",   focus: "Vapaa-aika ja harrastukset" },
    { type: "writing", focus: "Sähköposti arjesta (80–120 sanaa)" },
  ],
  kurssi_3: [
    { type: "vocab",   focus: "Matkustaminen ja kulkuvälineet" },
    { type: "grammar", focus: "Preteriti — säännölliset -ar-verbit" },
    { type: "grammar", focus: "Preteriti — -er- ja -ir-verbit" },
    { type: "vocab",   focus: "Hotelli ja majoitus" },
    { type: "grammar", focus: "Preteriti — ser ja ir" },
    { type: "writing", focus: "Kertomus lomamatkasta (100–150 sanaa)" },
  ],
  kurssi_4: [
    { type: "vocab",   focus: "Lapsuus ja muistot" },
    { type: "grammar", focus: "Imperfekti — säännölliset" },
    { type: "grammar", focus: "Preteriti vs imperfekti — perusero" },
    { type: "vocab",   focus: "Eläimet ja luonto" },
    { type: "grammar", focus: "Aikamuotojen vaihto kertomuksessa" },
    { type: "writing", focus: "Lapsuuden kuvaus (120–160 sanaa)" },
  ],
  kurssi_5: [
    { type: "vocab",   focus: "Työ ja ammatit" },
    { type: "grammar", focus: "Futuuri — säännölliset" },
    { type: "grammar", focus: "Futuuri — epäsäännölliset" },
    { type: "vocab",   focus: "Teknologia ja internet" },
    { type: "grammar", focus: "Konditionaali — muodostus ja käyttö" },
    { type: "writing", focus: "Kirje tulevaisuudesta (140–180 sanaa)" },
  ],
  kurssi_6: [
    { type: "vocab",   focus: "Ympäristö ja ilmasto" },
    { type: "grammar", focus: "Subjunktiivin muodostus — säännölliset" },
    { type: "grammar", focus: "Subjunktiivin muodostus — epäsäännölliset" },
    { type: "vocab",   focus: "Yhteiskunta ja politiikka" },
    { type: "grammar", focus: "Ojalá + subjunktiivi" },
    { type: "writing", focus: "Mielipidekirjoitus (160–200 sanaa)" },
  ],
  kurssi_7: [
    { type: "vocab",   focus: "Kulttuuri ja taide" },
    { type: "grammar", focus: "Subjunktiivi konjunktioiden kanssa" },
    { type: "grammar", focus: "Subjunktiivi tarkoitusta ilmaistessa" },
    { type: "vocab",   focus: "Historia ja politiikka" },
    { type: "grammar", focus: "Pluskvamperfekti — muodostus" },
    { type: "writing", focus: "Argumentoiva teksti (180–220 sanaa)" },
  ],
  kurssi_8: [
    { type: "grammar", focus: "Subjunktiivi imperfekti — muodostus" },
    { type: "grammar", focus: "Si-lauseet (si tuviera, haría)" },
    { type: "vocab",   focus: "YO-koesanasto sekoitettuna" },
    { type: "grammar", focus: "Kaikkien aikamuotojen kertaus" },
    { type: "writing", focus: "Lyhyt YO-tehtävä (160–200 sanaa)" },
  ],
};

const DAY_LABELS = ["Ma", "Ti", "Ke", "To", "Pe"];

function estimateMinutes(type, dailyGoalMinutes) {
  // Light goal-shaped estimates so the preview sums roughly to the
  // daily target. Writing tasks always take longer than vocab.
  const cap = Math.max(8, Math.min(45, Number(dailyGoalMinutes) || 20));
  const base = type === "writing" ? Math.round(cap * 0.9)
             : type === "grammar" ? Math.round(cap * 0.6)
             : type === "review"  ? Math.round(cap * 0.4)
             :                      Math.round(cap * 0.5);
  return Math.max(5, Math.min(45, base));
}

/**
 * Generate a deterministic 5-day preview plan from a starting kurssi
 * and a daily-minute target. No AI involvement. Return shape matches
 * the L-PLAN-1 OB-4 screen contract.
 *
 * @param {string} kurssiKey - "kurssi_1" .. "kurssi_8"
 * @param {number} dailyGoalMinutes - 10 / 20 / 30 / 45
 * @returns {Array<{day: string, taskTitle: string, estimatedMinutes: number, type: string}>}
 */
export function generateFirstWeekPlan(kurssiKey, dailyGoalMinutes = 20) {
  const lessons = KURSSI_LESSONS[kurssiKey] || KURSSI_LESSONS.kurssi_1;
  const meta = KURSSI_META[kurssiKey] || KURSSI_META.kurssi_1;
  const plan = [];
  for (let i = 0; i < DAY_LABELS.length; i++) {
    const lesson = lessons[i] || lessons[lessons.length - 1];
    plan.push({
      day: DAY_LABELS[i],
      taskTitle: `${meta.name.split(" — ")[0]}: ${lesson.focus}`,
      estimatedMinutes: estimateMinutes(lesson.type, dailyGoalMinutes),
      type: lesson.type,
    });
  }
  // SR review as a second nudge from day 3 onward when the student
  // commits 30+ min per day. Embedded as a single combined card so
  // the preview stays a flat 5-row list.
  if (Number(dailyGoalMinutes) >= 30) {
    for (let i = 2; i < plan.length; i++) {
      plan[i].taskTitle += " · + SR-kertaus";
      plan[i].estimatedMinutes = Math.min(
        45,
        plan[i].estimatedMinutes + estimateMinutes("review", dailyGoalMinutes),
      );
    }
  }
  return plan;
}

/**
 * Hardcoded Finnish fallback assessment used when the OpenAI call fails.
 * Anchored to the chosen kurssi so the message is always concrete.
 *
 * @param {string} placementLevel
 * @param {string} kurssiKey
 * @param {"high"|"low"} confidence
 * @returns {string}
 */
export function fallbackTutorAssessment(placementLevel, kurssiKey, confidence = "high") {
  const meta = KURSSI_META[kurssiKey] || KURSSI_META.kurssi_1;
  const firstLesson = (KURSSI_LESSONS[kurssiKey] || [])[0]?.focus || "perussanasto";
  const calibration = confidence === "low"
    ? "Vastasit nopeasti — aloitetaan rauhassa, jotta saat varmuuden pohjasta."
    : "Hyvä lähtöpiste — jatkamme tästä rakentaen kerros kerrokselta.";
  return `Pohjasi näkyy ${placementLevel}-tasolla, ja aloitamme aiheesta "${firstLesson}" osana kokonaisuutta ${meta.name}. ${calibration}`;
}
