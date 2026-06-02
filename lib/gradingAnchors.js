// L-V351 — Few-shot calibration anchors for YTL writing grading.
//
// SIX real, officially-scored Spanish YTL sample answers spanning the whole
// scale (short 15/25/33 of 33, long 34/50/66 of 66). They are injected into the
// grading prompt as concrete reference points so the model calibrates against
// real graded work instead of an abstract rubric (L-V350 proved the abstract
// instruction alone could not lift a perfect answer past M).
//
// SINGLE SOURCE OF TRUTH: the validation harness imports ANCHORS for BOTH the
// few-shot prompt AND for excluding these exact answers from the Spanish test
// set (you cannot test the model on examples it already saw in the prompt).
// The same Spanish anchors are reused for every language — the YTL band→quality
// mapping is language-independent (33/33 = the same quality level in any
// language), and German/French stay fully held-out because their cases never
// enter the prompt.
//
// Text is copied verbatim from docs/yo-espanja-naytevastaukset.txt (including a
// few OCR-glued words — left as-is so the anchors look like real exam scans).

export const ANCHORS = [
  {
    taskType: "short",
    pointsMax: 33,
    officialScore: 15,
    answer:
      "Querido Miguel: Creo, que tienes interesante y divertido mes con nosotras. estoy triste porque no estaba en tus fiesta de adios pero yoimportante tiempo con doctor. Quero tu tienes un vuelto buen, cuandote vetes a casa. Saludos, [Nimi]",
    why: "Message barely gets across; frequent basic-structure errors (verb conjugation, yo/me), meaning unclear in several places.",
  },
  {
    taskType: "short",
    pointsMax: 33,
    officialScore: 25,
    answer:
      "¡Hola! ¡Me llamo Meeri y soy tu vecina! Encantada. Hay muchos lugares cerca que pienso que están muy bonitos. Por ejemplo, un parque natural y una montaña alta. ¿Tienes tiempo para ir conmigo? Creo que sería buen para nuestros cuerpos. ¿Qué te parece?",
    why: "Communicates fairly naturally with mostly fitting vocabulary, but the closing is missing and one sentence does not resolve in meaning.",
  },
  {
    taskType: "short",
    pointsMax: 33,
    officialScore: 33,
    answer:
      "Estimada señora López, le escribo para informarle que encontré su diario en los probadores del Corte Inglés. Creo que lo ha olvidado allí. ¿Dónde quiere que lo dejo? ¿En el punto de información de la tienda? ¡Cualquier lugar que le parezca bien, me parece bien! Un cordial saludo, [Nimi]",
    why: "Message is clear, natural and fluent; varied vocabulary handled very well; only one or two minor errors that do not affect understanding.",
  },
  {
    taskType: "long",
    pointsMax: 66,
    officialScore: 34,
    answer:
      "Hola la niña o el niño de Chile. !Bienvenidos a Helsinki! Este es muchas cosas para hacer en Helsinki. Primero ir a en museo, Ateneum. Está muy barato. En entrada es solo 12€, pero suno tiene pagar sí eres menor de edad. Segundo visitas en la biblioteca, Oodi. Oodi es un nuevo biblioteca en Helsinki y está gratis por todo. En Oodi puedes hacer mucho. Último ir a restaurantes y cafés. Aquí está muchos restaurantes y cafés cómodos. Tienes pagar solo 10-20€ maximum. ¡Nos vemos pronto!",
    why: "Message gets across only unclearly; many basic-structure errors (ser/estar, missing/uninflected verbs); text hard to read in places.",
  },
  {
    taskType: "long",
    pointsMax: 66,
    officialScore: 50,
    answer:
      "Cómo puedo cambiar el mundo, pero con los maneras realisticos? Soy un joven muy preocupado por nuestro tierra, y por que eso soy vegetariana. Ser vegetariano es fácil aquí en Finlandia y a causa de eso es un acto pequeño. Los otros actos pequeños para la tierra son reciclaje y recolección de basura. Además, me quiero hacer el mundo una mejor lugar con mi sonrisa y ayuda. Siempre soy una persona amable y confiable, por que quizás puedo mejorar el día de alguien. Como puedes ver, cualquiera puede hacer los actos muy pequeños cada día!",
    why: "Communicates fairly naturally and the vocabulary is mostly under control, but several errors and inconsistent gender (masc./fem. about self) keep it from fluent.",
  },
  {
    taskType: "long",
    pointsMax: 66,
    officialScore: 66,
    answer:
      "Hola a todos! Últimamente me he dado cuenta de que mucha gente solo habla sobre cosas que le molestan en nuestra sociedad pero hace nada. Tengo un consejo para todos ellos: No tienes que hacer algo gigante para mejorar el mundo. Por ejemplo, si escuchas que alguien dice algo discriminante, puedes decir que no es bien porque lo que dijo puede hacer daño. Todos nosotros queremos cambiar el mundo, pero es importante que cambiemos las palabras y los tuites por las acciones. No es difícil. Besos, Alicia",
    why: "Clear, natural and fluent; linguistically accurate, treats the topic with real depth; only a couple of minor errors.",
  },
];

// Normalize for robust matching: lowercase + strip ALL whitespace, so wrapped
// newlines in the parsed source never break an equality check.
function norm(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, "");
}

// Fingerprint = first 40 normalized chars of each anchor answer. Unique enough
// to single out the exact source case even when several share the same score.
const FINGERPRINTS = ANCHORS.map((a) => norm(a.answer).slice(0, 40));

// True if `answer` is one of the anchor texts (used to drop anchors from the
// Spanish test set). Matches on the normalized opening fingerprint.
export function isAnchorAnswer(answer) {
  const n = norm(answer);
  return FINGERPRINTS.some((fp) => n.includes(fp));
}

// Build the few-shot reference block injected into the grading prompt.
export function buildFewShotBlock() {
  const fmt = (a) =>
    `• Scored ${a.officialScore}/${a.pointsMax}:\n"""${a.answer}"""\n  → Why ${a.officialScore}: ${a.why}`;
  const short = ANCHORS.filter((a) => a.taskType === "short").map(fmt).join("\n\n");
  const long = ANCHORS.filter((a) => a.taskType === "long").map(fmt).join("\n\n");
  return `CALIBRATED REFERENCE EXAMPLES — real YTL-scored answers. These are your scoring anchors: match the answer you are grading to the closest reference and assign a comparable native-scale score. (Quality bands are language-independent; the references are Spanish but the same standard applies to any language.)

[SHORT task — native scale 0–33]
${short}

[LONG task — native scale 0–66]
${long}`;
}
