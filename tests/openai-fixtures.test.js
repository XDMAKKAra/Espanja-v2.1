// Feeds the committed tests/fixtures/openai/*.json payloads through the real
// exercise routes via the shared test harness. Previously these fixture files
// existed but were never imported; this test wires them in so that fixture
// drift breaks the build.

import { describe, it, expect, beforeAll } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildApp, setOpenAIResponse } from "./helpers/app.js";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = resolve(here, "fixtures", "openai");

async function loadFixture(name) {
  return JSON.parse(await readFile(resolve(FIXTURE_DIR, `${name}.json`), "utf8"));
}

let app, request;
beforeAll(async () => {
  app = await buildApp();
  request = (await import("supertest")).default;
});

describe("fixtures/openai/vocab.json", () => {
  it("is a non-empty array of MC items", async () => {
    const items = await loadFixture("vocab");
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.question).toBeTruthy();
      expect(item.options).toHaveLength(4);
      expect(item.correct).toMatch(/^[A-D]$/);
      expect(item.explanation).toBeTruthy();
    }
  });

  it("round-trips through POST /api/generate", async () => {
    const fixture = await loadFixture("vocab");
    setOpenAIResponse(fixture);
    const res = await request(app)
      .post("/api/generate")
      .set("Authorization", "Bearer fake")
      .send({ level: "B", topic: "general vocabulary", count: fixture.length });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exercises)).toBe(true);
    expect(res.body.exercises).toHaveLength(fixture.length);
    expect(res.body.exercises[0].question).toBe(fixture[0].question);
  });
});

describe("fixtures/openai/grammar.json", () => {
  it("is a well-formed grammar MC item", async () => {
    const items = await loadFixture("grammar");
    expect(Array.isArray(items)).toBe(true);
    for (const item of items) {
      expect(item.sentence || item.question).toBeTruthy();
      expect(item.correct).toMatch(/^[A-D]$/);
    }
  });

  it("round-trips through POST /api/grammar-drill", async () => {
    const fixture = await loadFixture("grammar");
    setOpenAIResponse(fixture);
    const res = await request(app)
      .post("/api/grammar-drill")
      .set("Authorization", "Bearer fake")
      .send({ topic: "mixed", level: "C", count: fixture.length });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.exercises)).toBe(true);
    expect(res.body.exercises.length).toBeGreaterThan(0);
  });
});

describe("fixtures/openai/reading.json", () => {
  it("has a title, passage, and at least one question", async () => {
    const task = await loadFixture("reading");
    expect(task.title).toBeTruthy();
    expect(task.passage).toBeTruthy();
    expect(Array.isArray(task.questions)).toBe(true);
    expect(task.questions.length).toBeGreaterThan(0);
    for (const q of task.questions) {
      expect(q.question).toBeTruthy();
      expect(q.choices).toHaveLength(4);
      expect(q.correct).toMatch(/^[A-D]$/);
    }
  });
});
