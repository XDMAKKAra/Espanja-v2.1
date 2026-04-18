export const DEMO_EXERCISES = [
  {
    id: 1,
    mode: "vocab",
    modeLabel: "Sanasto",
    modeIcon: "📚",
    level: "C",
    type: "context",
    question: "Lauseessa 'El alcalde anunció nuevas medidas para reducir la contaminación' — mitä tarkoittaa 'el alcalde'?",
    context: "El alcalde anunció nuevas medidas para reducir la contaminación en la ciudad.",
    options: ["A) pormestari", "B) opettaja", "C) lääkäri", "D) tuomari"],
    correct: "A",
    explanation: "El alcalde = pormestari (mayor). Anunciar = ilmoittaa, medidas = toimenpiteet, contaminación = saastuminen. Tämä on tyypillinen yo-koetekstien sanastoa yhteiskunta-aiheista."
  },
  {
    id: 2,
    mode: "grammar",
    modeLabel: "Kielioppi",
    modeIcon: "🔧",
    level: "M",
    type: "correction",
    question: "Lauseessa on virhe. Mikä on oikea muoto?",
    context: "Ojalá te gustará mi regalo.",
    options: ["A) guste", "B) gustará", "C) gustaba", "D) gustaría"],
    correct: "A",
    explanation: "Ojalá vaatii AINA subjunktiivin: \"ojalá te guste\". Gustará (futuuri) on yleinen virhe yo-kokeessa. Muista: ojalá + subjunktiivi, ei koskaan indikatiivi."
  },
  {
    id: 3,
    mode: "grammar",
    modeLabel: "Täydennä",
    modeIcon: "✏️",
    level: "C",
    type: "gap",
    question: "Täydennä: \"Cuando era pequeño, siempre ___ al parque con mis amigos.\"",
    context: null,
    options: ["A) iba", "B) fui", "C) voy", "D) iré"],
    correct: "A",
    explanation: "Iba = imperfekti (menin toistuvasti). Siempre + toistuva menneisyys → imperfekti. Fui = preteriti (yksittäinen kerta). Tämä preteriti vs. imperfekti -ero on yksi YO-kokeen yleisimmistä virheistä."
  }
];
