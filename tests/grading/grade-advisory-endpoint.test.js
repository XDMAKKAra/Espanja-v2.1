import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../helpers/app.js';

let request, app;
beforeAll(async () => {
  request = (await import('supertest')).default;
  app = await buildApp();
});

async function advise(body) {
  return request(app)
    .post('/api/grade/advisory')
    .set('Authorization', 'Bearer fake')
    .send(body);
}

describe('POST /api/grade/advisory — monivalinta', () => {
  it('returns correct=true on matching indices', async () => {
    const res = await advise({
      type: 'monivalinta',
      exerciseId: 'test-1',
      payload: { chosenIndex: 2, correctIndex: 2 },
    });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
    expect(res.body.band).toBe('taydellinen');
    expect(res.body.score).toBe(1);
    expect(res.body.maxScore).toBe(1);
  });

  it('returns correct=false on mismatched indices', async () => {
    const res = await advise({
      type: 'monivalinta',
      payload: { chosenIndex: 0, correctIndex: 1 },
    });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);
    expect(res.body.band).toBe('vaarin');
  });

  it('SERVER-TRUST: ignores `correct: true` submitted on a wrong answer', async () => {
    // Step 2 quality bar: "client sends correct:true on a known-wrong
    // answer; server response must override to correct:false."
    const res = await advise({
      type: 'monivalinta',
      correct: true,                        // tamper
      payload: {
        chosenIndex: 0,
        correctIndex: 3,
        correct: true,                      // tamper inside payload
        isCorrect: true,                    // tamper
        band: 'taydellinen',                // tamper
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);
    expect(res.body.band).toBe('vaarin');
    expect(res.body.score).toBe(0);
  });

  it('400 on missing type', async () => {
    const res = await advise({ payload: { chosenIndex: 0, correctIndex: 0 } });
    expect(res.status).toBe(400);
  });

  it('400 on unregistered type', async () => {
    const res = await advise({ type: 'does_not_exist', payload: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no grader registered/);
  });

  it('400 on malformed payload (non-integer chosenIndex)', async () => {
    const res = await advise({
      type: 'monivalinta',
      payload: { chosenIndex: 'A', correctIndex: 0 },
    });
    expect(res.status).toBe(400);
  });

  it('does not affect the existing /api/grade (session-aggregate) endpoint', async () => {
    // Regression guard: the new endpoint is additive, not a replacement.
    const res = await request(app)
      .post('/api/grade')
      .send({ correct: 80, total: 100 })
      .set('Authorization', 'Bearer fake');
    expect(res.status).toBe(200);
    expect(res.body.grade).toBe('L');
  });
});
