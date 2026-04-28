// Loop 42 Section A(e) — capture a REAL /api/grade-writing JSON response into
// references/puheo-screens/grading-response.json for L45's hybrid AI-grading
// showcase to render against.
//
// REQUIRES: a Pro test account in .env. Drop these values temporarily:
//   TEST_PRO_EMAIL=...
//   TEST_PRO_PASSWORD=...
// Run once: node scripts/agent-test/loop42-capture-grading.mjs
// Then REMOVE the two vars from .env. Capture is done; the fixture lives
// in the repo and L45+ never need creds again.
//
// What it does:
//   1. POST /api/auth/login → captures bearer token
//   2. POST /api/writing-task → fetches a real lyhyt YO-koe writing prompt
//   3. POSTs a deliberately-flawed Finnish-student-style Spanish answer to
//      /api/grade-writing → captures the AI's annotated rubric output
//   4. Saves both task + result to references/puheo-screens/grading-response.json

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_PRO_EMAIL;
const PASSWORD = process.env.TEST_PRO_PASSWORD;
const OUT = path.resolve("references/puheo-screens/grading-response.json");

if (!EMAIL || !PASSWORD) {
  console.error("Missing TEST_PRO_EMAIL or TEST_PRO_PASSWORD in .env.");
  console.error("Add them, run this script once, then remove them.");
  process.exit(1);
}

// A deliberately-flawed B1/B2-level Spanish answer that touches the most-
// graded YO-koe error categories: subjunctive, ser/estar, pret/imperf, accents.
// Aimed at producing a "C" or "B" band so the showcase has substance to render.
const STUDENT_TEXT = `Hola Marta,

Estoy escribiendo para invitarte a mi cumpleaños. Va a ser el viernes próximo en mi casa. Mi madre cocina mucha comida y tendrémos también música. Espero que vienes con tu hermano. La fiesta empieza a las siete. La semana pasada estaba en Madrid con mi clase y era muy divertido. Vimos el museo del Prado y comimos en un restaurante muy bueno. Si tienes preguntas, llámame. Es importante que me dices si puedes venir antes del miércoles.

¡Hasta pronto!
Saludos,
Aino`;

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} → ${res.status}: ${text}`);
  }
  return res.json();
}

console.log("1/3 logging in...");
const auth = await postJson(`${BASE}/api/auth/login`, { email: EMAIL, password: PASSWORD });
const token = auth.token;
if (!token) throw new Error("No token in login response");
console.log("    OK");

console.log("2/3 fetching writing task (lyhyt)...");
const taskRes = await postJson(
  `${BASE}/api/writing-task`,
  { taskType: "short" },
  { Authorization: `Bearer ${token}` }
);
const task = taskRes.task || taskRes;
console.log(`    OK — "${task.title || task.prompt_fi?.slice(0, 60)}"`);

console.log("3/3 grading the deliberately-flawed answer...");
const gradeRes = await postJson(
  `${BASE}/api/grade-writing`,
  { task, studentText: STUDENT_TEXT },
  { Authorization: `Bearer ${token}` }
);
console.log(`    OK — band ${gradeRes.result?.ytlGrade}, score ${gradeRes.result?.finalScore}/${gradeRes.result?.maxScore}`);

const fixture = {
  capturedAt: new Date().toISOString(),
  task,
  studentText: STUDENT_TEXT,
  result: gradeRes.result,
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(fixture, null, 2));
console.log(`Saved fixture → ${OUT}`);
console.log("REMOVE TEST_PRO_EMAIL + TEST_PRO_PASSWORD from .env now.");
