/**
 * Hardcoded diagnostic/placement test questions.
 * 20 questions total (5 per level: A, B, C, M).
 * The test picks 2 per level by default, or adapts based on user's reported grade.
 */

export const PLACEMENT_QUESTIONS = [
  // ─── A-taso (approbatur) — perus sanasto ja rakenteet ────────────────────
  {
    id: "A1",
    level: "A",
    type: "meaning",
    question: "¿Qué significa 'la casa'?",
    options: ["A) talo", "B) kissa", "C) auto", "D) koulu"],
    correct: "A",
    explanation: "La casa = talo (house). Yksi espanjan perussanoista.",
  },
  {
    id: "A2",
    level: "A",
    type: "meaning",
    question: "¿Qué significa 'comer'?",
    options: ["A) juoda", "B) nukkua", "C) syödä", "D) kävellä"],
    correct: "C",
    explanation: "Comer = syödä (to eat). Beber = juoda, dormir = nukkua.",
  },
  {
    id: "A3",
    level: "A",
    type: "gap",
    question: "Yo ___ estudiante. (Olen opiskelija.)",
    options: ["A) soy", "B) estoy", "C) tengo", "D) hay"],
    correct: "A",
    explanation: "Soy = olen (pysyvä ominaisuus). Estoy = olen (tilapäinen tila). Ammatti/identiteetti → ser.",
  },
  {
    id: "A4",
    level: "A",
    type: "meaning",
    question: "¿Qué significa 'el libro'?",
    options: ["A) pöytä", "B) kirja", "C) tuoli", "D) kynä"],
    correct: "B",
    explanation: "El libro = kirja (book). La mesa = pöytä, la silla = tuoli.",
  },
  {
    id: "A5",
    level: "A",
    type: "gap",
    question: "Mi hermana ___ quince años. (Siskoni on 15-vuotias.)",
    options: ["A) es", "B) está", "C) tiene", "D) hay"],
    correct: "C",
    explanation: "Tener años = olla ... vuotias. Espanjassa 'on ikää' ilmaistaan tener-verbillä.",
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
  },
  {
    id: "B2",
    level: "B",
    type: "gap",
    question: "¿Dónde ___ el hospital? (Missä sairaala on?)",
    options: ["A) es", "B) está", "C) hay", "D) tiene"],
    correct: "B",
    explanation: "Estar = sijainti. 'Missä jokin tunnettu paikka on' → estar. Hay = 'on olemassa' (epämääräinen).",
  },
  {
    id: "B3",
    level: "B",
    type: "context",
    question: "'El fin de semana vamos a la playa' — mitä tarkoittaa 'la playa'?",
    options: ["A) vuori", "B) kaupunki", "C) ranta", "D) järvi"],
    correct: "C",
    explanation: "La playa = ranta (beach). Fin de semana = viikonloppu.",
  },
  {
    id: "B4",
    level: "B",
    type: "gap",
    question: "Ayer ___ al cine con mis amigos. (Eilen menin elokuviin.)",
    options: ["A) voy", "B) fui", "C) iba", "D) iré"],
    correct: "B",
    explanation: "Fui = menin (preteriti, yksittäinen menneisyys). Ayer = eilen → preteriti.",
  },
  {
    id: "B5",
    level: "B",
    type: "meaning",
    question: "¿Qué significa 'el trabajo'?",
    options: ["A) koulu", "B) matka", "C) työ", "D) sää"],
    correct: "C",
    explanation: "El trabajo = työ (work/job). Trabajar = tehdä työtä.",
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
  },
  {
    id: "C2",
    level: "C",
    type: "gap",
    question: "Cuando era pequeño, siempre ___ al parque. (Pienenä menin aina puistoon.)",
    options: ["A) fui", "B) iba", "C) voy", "D) iré"],
    correct: "B",
    explanation: "Iba = menin toistuvasti (imperfekti). Siempre + toistuva menneisyys → imperfekti. Fui = yksittäinen kerta.",
  },
  {
    id: "C3",
    level: "C",
    type: "context",
    question: "'Los ciudadanos exigen más transparencia del gobierno' — mitä tarkoittaa 'exigen'?",
    options: ["A) pelkäävät", "B) vaativat", "C) luottavat", "D) ehdottavat"],
    correct: "B",
    explanation: "Exigir = vaatia (to demand). Ciudadanos = kansalaiset, transparencia = läpinäkyvyys.",
  },
  {
    id: "C4",
    level: "C",
    type: "gap",
    question: "___ muchas personas en la plaza. (Aukiolla on paljon ihmisiä.)",
    options: ["A) Están", "B) Son", "C) Hay", "D) Tienen"],
    correct: "C",
    explanation: "Hay = on olemassa (impersoonallinen). Hay EI koskaan ota määräistä artikkelia. Estar = tunnetun asian sijainti.",
  },
  {
    id: "C5",
    level: "C",
    type: "meaning",
    question: "¿Qué significa 'sin embargo'?",
    options: ["A) sen vuoksi", "B) kuitenkin", "C) samalla", "D) lisäksi"],
    correct: "B",
    explanation: "Sin embargo = kuitenkin / siitä huolimatta (however). Tärkeä konjunktio yo-koeteksteissä.",
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
  },
  {
    id: "M2",
    level: "M",
    type: "context",
    question: "'A pesar de las dificultades, la empresa logró aumentar sus beneficios' — mitä tarkoittaa 'a pesar de'?",
    options: ["A) ansiosta", "B) huolimatta", "C) sen jälkeen kun", "D) ennen kuin"],
    correct: "B",
    explanation: "A pesar de = huolimatta (despite). Lograr = onnistua, beneficios = voitot/hyödyt.",
  },
  {
    id: "M3",
    level: "M",
    type: "gap",
    question: "Me ___ vivir en España algún día. (Haluaisin asua Espanjassa jonain päivänä.)",
    options: ["A) gustaba", "B) gustaría", "C) gusta", "D) gustará"],
    correct: "B",
    explanation: "Gustaría = haluaisin (konditionaali, kohtelias toive). Gustaba = tykkäsin (imperfekti). Gustará = tulen tykkäämään (futuuri).",
  },
  {
    id: "M4",
    level: "M",
    type: "context",
    question: "'El desarrollo sostenible requiere la colaboración de todos los sectores' — mitä tarkoittaa 'el desarrollo sostenible'?",
    options: ["A) taloudellinen kasvu", "B) kestävä kehitys", "C) sosiaalinen vastuu", "D) ympäristönsuojelu"],
    correct: "B",
    explanation: "El desarrollo sostenible = kestävä kehitys (sustainable development). Requiere = vaatii, colaboración = yhteistyö.",
  },
  {
    id: "M5",
    level: "M",
    type: "gap",
    question: "Es importante que todos ___ sus derechos. (On tärkeää, että kaikki tuntevat oikeutensa.)",
    options: ["A) conocen", "B) conozcan", "C) conocían", "D) conocerán"],
    correct: "B",
    explanation: "Es importante que + subjunktiivi: conozcan. 'Es importante que' laukaisee aina subjunktiivin. Conocen = indikatiivi.",
  },
];

/**
 * Select questions for a diagnostic test.
 * @param {string|null} reportedGrade - User's self-reported YTL grade from onboarding
 * @param {number} total - Total questions to pick (default 8)
 * @returns {Array} Selected questions in order
 */
export function selectDiagnosticQuestions(reportedGrade = null, total = 8) {
  const LEVELS = ["A", "B", "C", "M"];
  const byLevel = {};
  for (const l of LEVELS) {
    byLevel[l] = PLACEMENT_QUESTIONS.filter(q => q.level === l);
  }

  // Shuffle helper
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Determine distribution
  let distribution;
  const GRADE_TO_FOCUS = {
    "I": { A: 3, B: 3, C: 1, M: 1 },
    "A": { A: 3, B: 3, C: 1, M: 1 },
    "B": { A: 2, B: 3, C: 2, M: 1 },
    "C": { A: 1, B: 2, C: 3, M: 2 },
    "M": { A: 1, B: 1, C: 3, M: 3 },
    "E": { A: 1, B: 1, C: 3, M: 3 },
    "L": { A: 1, B: 1, C: 3, M: 3 },
  };

  if (reportedGrade && GRADE_TO_FOCUS[reportedGrade]) {
    distribution = GRADE_TO_FOCUS[reportedGrade];
  } else {
    // Default: 2 per level
    distribution = { A: 2, B: 2, C: 2, M: 2 };
  }

  const selected = [];
  for (const level of LEVELS) {
    const count = distribution[level] || 2;
    const shuffled = shuffle(byLevel[level]);
    selected.push(...shuffled.slice(0, count));
  }

  return selected;
}
