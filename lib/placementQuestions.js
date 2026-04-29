/**
 * Hardcoded diagnostic/placement test questions.
 *
 * Distractor policy (per L-PLAN-1 / CURRICULUM_SPEC.md §6):
 *   - For every B/C/M question, all four options must be plausible to
 *     someone guessing — no obvious joke distractors, no off-category words.
 *   - `plausible_wrong_options: true` flags items whose distractors have
 *     been audited under this rule.
 *   - Questions tagged `level: "M_hard"` are anchor questions only shown
 *     to students who answer every A/B/C item correctly. They probe
 *     pluskvamperfekti and subjunktiivi imperfekti — content beyond what
 *     standard M-tier covers — to decide whether to start at Kurssi 7.
 */

export const PLACEMENT_QUESTIONS = [
  // ─── A-taso (approbatur) — perus sanasto ja rakenteet ────────────────────
  {
    id: "A1",
    level: "A",
    type: "meaning",
    question: "¿Qué significa 'la casa'?",
    options: ["A) talo", "B) tie", "C) auto", "D) koulu"],
    correct: "A",
    explanation: "La casa = talo (house). Yksi espanjan perussanoista.",
    plausible_wrong_options: true,
  },
  {
    id: "A2",
    level: "A",
    type: "meaning",
    question: "¿Qué significa 'comer'?",
    options: ["A) juoda", "B) nukkua", "C) syödä", "D) kävellä"],
    correct: "C",
    explanation: "Comer = syödä (to eat). Beber = juoda, dormir = nukkua.",
    plausible_wrong_options: true,
  },
  {
    id: "A3",
    level: "A",
    type: "gap",
    question: "Yo ___ estudiante. (Olen opiskelija.)",
    options: ["A) soy", "B) estoy", "C) tengo", "D) hay"],
    correct: "A",
    explanation: "Soy = olen (pysyvä ominaisuus). Estoy = olen (tilapäinen tila). Ammatti/identiteetti → ser.",
    plausible_wrong_options: true,
  },
  {
    id: "A4",
    level: "A",
    type: "meaning",
    question: "¿Qué significa 'el libro'?",
    options: ["A) pöytä", "B) kirja", "C) tuoli", "D) kynä"],
    correct: "B",
    explanation: "El libro = kirja (book). La mesa = pöytä, la silla = tuoli.",
    plausible_wrong_options: true,
  },
  {
    id: "A5",
    level: "A",
    type: "gap",
    question: "Mi hermana ___ quince años. (Siskoni on 15-vuotias.)",
    options: ["A) es", "B) está", "C) tiene", "D) hay"],
    correct: "C",
    explanation: "Tener años = olla ... vuotias. Espanjassa 'on ikää' ilmaistaan tener-verbillä.",
    plausible_wrong_options: true,
  },

  // ─── B-taso (lubenter approbatur) — arkisanasto ja peruskielioppi ────────
  {
    id: "B1",
    level: "B",
    type: "context",
    question: "Lauseessa 'Necesito comprar ropa nueva para el viaje' — mitä tarkoittaa 'ropa'?",
    options: ["A) ruoka", "B) vaatteet", "C) matkalaukku", "D) lahja"],
    correct: "B",
    explanation: "Ropa = vaatteet (clothes). Comprar = ostaa, viaje = matka.",
    plausible_wrong_options: true,
  },
  {
    id: "B2",
    level: "B",
    type: "gap",
    question: "¿Dónde ___ el hospital? (Missä sairaala on?)",
    options: ["A) es", "B) está", "C) hay", "D) tiene"],
    correct: "B",
    explanation: "Estar = sijainti. 'Missä jokin tunnettu paikka on' → estar. Hay = 'on olemassa' (epämääräinen).",
    plausible_wrong_options: true,
  },
  {
    id: "B3",
    level: "B",
    type: "context",
    question: "'El fin de semana vamos a la playa' — mitä tarkoittaa 'la playa'?",
    options: ["A) vuori", "B) kaupunki", "C) ranta", "D) järvi"],
    correct: "C",
    explanation: "La playa = ranta (beach). Fin de semana = viikonloppu.",
    plausible_wrong_options: true,
  },
  {
    id: "B4",
    level: "B",
    type: "gap",
    question: "Ayer ___ al cine con mis amigos. (Eilen menin elokuviin.)",
    options: ["A) voy", "B) fui", "C) iba", "D) iré"],
    correct: "B",
    explanation: "Fui = menin (preteriti, yksittäinen menneisyys). Ayer = eilen → preteriti.",
    plausible_wrong_options: true,
  },
  {
    id: "B5",
    level: "B",
    type: "meaning",
    question: "¿Qué significa 'el trabajo'?",
    options: ["A) koulu", "B) kauppa", "C) työ", "D) loma"],
    correct: "C",
    explanation: "El trabajo = työ (work/job). Trabajar = tehdä työtä.",
    plausible_wrong_options: true,
  },

  // ─── C-taso (cum laude) — keskitason sanasto ja kielioppi ────────────────
  {
    id: "C1",
    level: "C",
    type: "context",
    question: "'El ayuntamiento aprobó nuevas medidas contra la contaminación' — mitä tarkoittaa 'el ayuntamiento'?",
    options: ["A) yliopisto", "B) kaupungintalo", "C) sairaala", "D) oikeus"],
    correct: "B",
    explanation: "El ayuntamiento = kaupungintalo / kunnanvaltuusto. Aprobar = hyväksyä, medidas = toimenpiteet.",
    plausible_wrong_options: true,
  },
  {
    id: "C2",
    level: "C",
    type: "gap",
    question: "Cuando era pequeño, siempre ___ al parque. (Pienenä menin aina puistoon.)",
    options: ["A) fui", "B) iba", "C) voy", "D) iré"],
    correct: "B",
    explanation: "Iba = menin toistuvasti (imperfekti). Siempre + toistuva menneisyys → imperfekti. Fui = yksittäinen kerta.",
    plausible_wrong_options: true,
  },
  {
    id: "C3",
    level: "C",
    type: "context",
    question: "'Los ciudadanos exigen más transparencia del gobierno' — mitä tarkoittaa 'exigen'?",
    options: ["A) pelkäävät", "B) vaativat", "C) luottavat", "D) ehdottavat"],
    correct: "B",
    explanation: "Exigir = vaatia (to demand). Ciudadanos = kansalaiset, transparencia = läpinäkyvyys.",
    plausible_wrong_options: true,
  },
  {
    id: "C4",
    level: "C",
    type: "gap",
    question: "___ muchas personas en la plaza. (Aukiolla on paljon ihmisiä.)",
    options: ["A) Están", "B) Son", "C) Hay", "D) Tienen"],
    correct: "C",
    explanation: "Hay = on olemassa (impersoonallinen). Hay EI koskaan ota määräistä artikkelia. Estar = tunnetun asian sijainti.",
    plausible_wrong_options: true,
  },
  {
    id: "C5",
    level: "C",
    type: "meaning",
    question: "¿Qué significa 'sin embargo'?",
    options: ["A) sen vuoksi", "B) kuitenkin", "C) samalla", "D) lisäksi"],
    correct: "B",
    explanation: "Sin embargo = kuitenkin / siitä huolimatta (however). Tärkeä konjunktio yo-koeteksteissä.",
    plausible_wrong_options: true,
  },

  // ─── M-taso (magna cum laude) — vaativa sanasto ja kielioppi ─────────────
  {
    id: "M1",
    level: "M",
    type: "gap",
    question: "Ojalá te ___ mi regalo. (Kunpa pitäisit lahjastani.)",
    options: ["A) gusta", "B) gustará", "C) guste", "D) gustaría"],
    correct: "C",
    explanation: "Ojalá vaatii AINA subjunktiivin: ojalá te guste. Gustará (futuuri) ja gustaría (konditionaali) ovat virheitä tässä.",
    plausible_wrong_options: true,
  },
  {
    id: "M2",
    level: "M",
    type: "context",
    question: "'A pesar de las dificultades, la empresa logró aumentar sus beneficios' — mitä tarkoittaa 'a pesar de'?",
    options: ["A) ansiosta", "B) huolimatta", "C) sen jälkeen kun", "D) ennen kuin"],
    correct: "B",
    explanation: "A pesar de = huolimatta (despite). Lograr = onnistua, beneficios = voitot/hyödyt.",
    plausible_wrong_options: true,
  },
  {
    id: "M3",
    level: "M",
    type: "gap",
    question: "Me ___ vivir en España algún día. (Haluaisin asua Espanjassa jonain päivänä.)",
    options: ["A) gustaba", "B) gustaría", "C) gusta", "D) gustará"],
    correct: "B",
    explanation: "Gustaría = haluaisin (konditionaali, kohtelias toive). Gustaba = tykkäsin (imperfekti). Gustará = tulen tykkäämään (futuuri).",
    plausible_wrong_options: true,
  },
  {
    id: "M4",
    level: "M",
    type: "context",
    question: "'El desarrollo sostenible requiere la colaboración de todos los sectores' — mitä tarkoittaa 'el desarrollo sostenible'?",
    options: ["A) taloudellinen kasvu", "B) kestävä kehitys", "C) sosiaalinen vastuu", "D) ympäristönsuojelu"],
    correct: "B",
    explanation: "El desarrollo sostenible = kestävä kehitys (sustainable development). Requiere = vaatii, colaboración = yhteistyö.",
    plausible_wrong_options: true,
  },
  {
    id: "M5",
    level: "M",
    type: "gap",
    question: "Es importante que todos ___ sus derechos. (On tärkeää, että kaikki tuntevat oikeutensa.)",
    options: ["A) conocen", "B) conozcan", "C) conocían", "D) conocerán"],
    correct: "B",
    explanation: "Es importante que + subjunktiivi: conozcan. 'Es importante que' laukaisee aina subjunktiivin. Conocen = indikatiivi.",
    plausible_wrong_options: true,
  },

  // ─── M_hard (anchor) — only shown when student is perfect on A/B/C ───────
  // Used to decide whether to skip from C-tier (Kurssi 5) up to Kurssi 7.
  {
    id: "MH1",
    level: "M_hard",
    type: "gap",
    question: "Cuando llegué a la fiesta, mis amigos ya ___ . (Kun saavuin juhliin, ystäväni olivat jo lähteneet.)",
    options: ["A) se fueron", "B) se habían ido", "C) se iban", "D) se irían"],
    correct: "B",
    explanation: "Pluskvamperfekti (había + partisiippi) ilmaisee tekoa joka tapahtui ennen toista mennyttä tekoa. Llegué = saavuin (preteriti), se habían ido = olivat jo lähteneet — tapahtui ennen saapumista.",
    plausible_wrong_options: true,
  },
  {
    id: "MH2",
    level: "M_hard",
    type: "gap",
    question: "Si ___ más tiempo, viajaría por toda España. (Jos minulla olisi enemmän aikaa, matkustaisin koko Espanjan.)",
    options: ["A) tengo", "B) tenía", "C) tuviera", "D) tendría"],
    correct: "C",
    explanation: "Si + subjunktiivi imperfekti = epätodellinen ehto. 'Tuviera' johtaa konditionaaliin 'viajaría'. Si tengo (jos minulla on, todennäköinen) ja si tenía (kun minulla oli) eivät sovi epätodellisuuteen.",
    plausible_wrong_options: true,
  },
];

const LEVELS = ["A", "B", "C", "M"];

const GRADE_TO_FOCUS = {
  I: { A: 3, B: 3, C: 1, M: 1 },
  A: { A: 3, B: 3, C: 1, M: 1 },
  B: { A: 2, B: 3, C: 2, M: 1 },
  C: { A: 1, B: 2, C: 3, M: 2 },
  M: { A: 1, B: 1, C: 3, M: 3 },
  E: { A: 1, B: 1, C: 3, M: 3 },
  L: { A: 1, B: 1, C: 3, M: 3 },
};

function shuffleInPlace(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Select questions for a diagnostic test (legacy flat-array shape).
 * Used by the existing /api/placement/submit route. M_hard items are
 * never returned here.
 *
 * @param {string|null} reportedGrade - User's self-reported school grade I..L
 * @param {number} total - Total questions to pick (default 8)
 * @returns {Array}
 */
export function selectDiagnosticQuestions(reportedGrade = null, total = 8) {
  const byLevel = {};
  for (const l of LEVELS) {
    byLevel[l] = PLACEMENT_QUESTIONS.filter((q) => q.level === l);
  }
  const distribution = (reportedGrade && GRADE_TO_FOCUS[reportedGrade])
    ? GRADE_TO_FOCUS[reportedGrade]
    : { A: 2, B: 2, C: 2, M: 2 };

  const selected = [];
  for (const level of LEVELS) {
    const count = distribution[level] || 2;
    const shuffled = shuffleInPlace(byLevel[level]);
    selected.push(...shuffled.slice(0, count));
  }
  return selected.slice(0, total);
}

/**
 * Select questions for the L-PLAN-1 onboarding flow.
 *
 * Returns the core 8 plus 2 M_hard anchor candidates separately, so the
 * client can adaptively append them only when the student has answered
 * every A/B/C item correctly (signal of potential Kurssi 7 placement).
 *
 * @param {string|null} reportedGrade - User's self-reported school grade I..L
 * @param {number} total - Total core questions (default 8)
 * @returns {{ core: Array, mHardCandidates: Array }}
 */
export function selectOnboardingQuestions(reportedGrade = null, total = 8) {
  const core = selectDiagnosticQuestions(reportedGrade, total);
  const mHardPool = PLACEMENT_QUESTIONS.filter((q) => q.level === "M_hard");
  return {
    core,
    mHardCandidates: shuffleInPlace(mHardPool).slice(0, 2),
  };
}
