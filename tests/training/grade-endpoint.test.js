/**
 * /api/grade now delegates to lib/grading.js → pointsToYoGrade. This asserts
 * the endpoint mirrors the same thresholds used by the full-exam grader and
 * the client-side grading module.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { pointsToYoGrade } from "../../lib/grading.js";
import { buildApp } from "../helpers/app.js";

let request, app;
beforeAll(async () => {
  request = (await import("supertest")).default;
  app = await buildApp();
});

async function grade(correct, total) {
  return request(app).post("/api/grade").send({ correct, total }).set("Authorization", "Bearer fake");
}

describe("POST /api/grade uses shared YTL thresholds", () => {
  it("80% → L (was E under the old vocab table)", async () => {
    const res = await grade(80, 100);
    expect(res.status).toBe(200);
    expect(res.body.grade).toBe("L");
    expect(res.body.grade).toBe(pointsToYoGrade(80, 100));
  });

  it("75% → E (was M under the old vocab table)", async () => {
    const res = await grade(75, 100);
    expect(res.body.grade).toBe("E");
    expect(res.body.grade).toBe(pointsToYoGrade(75, 100));
  });

  it("50% → M", async () => {
    const res = await grade(50, 100);
    expect(res.body.grade).toBe("M");
    expect(res.body.grade).toBe(pointsToYoGrade(50, 100));
  });

  it("0% → I", async () => {
    const res = await grade(0, 100);
    expect(res.body.grade).toBe("I");
    expect(res.body.pct).toBe(0);
  });

  it("rejects invalid payload", async () => {
    const res = await grade(null, 0);
    expect(res.status).toBe(400);
  });
});
