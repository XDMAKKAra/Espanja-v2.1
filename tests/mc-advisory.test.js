import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the api + analytics modules BEFORE importing the SUT.
const _trackCalls = [];
vi.mock('../js/api.js', () => ({
  API: '',
  authHeader: () => ({}),
  apiFetch: vi.fn(),
}));
vi.mock('../js/analytics.js', () => ({
  track: (event, props) => _trackCalls.push({ event, props }),
}));

const { reportMcAdvisory } = await import('../js/features/mcAdvisory.js');
const { apiFetch } = await import('../js/api.js');

function mockAdvisoryResponse({ ok = true, correct = true, json } = {}) {
  apiFetch.mockResolvedValueOnce({
    ok,
    json: async () => (json ?? { correct }),
  });
}

beforeEach(() => {
  _trackCalls.length = 0;
  apiFetch.mockReset();
});

describe('reportMcAdvisory — divergence detection', () => {
  it('does NOT emit telemetry when server and client agree (both correct)', async () => {
    mockAdvisoryResponse({ correct: true });
    await reportMcAdvisory({ exerciseId: 1, chosenIndex: 2, correctIndex: 2, clientIsCorrect: true });
    expect(_trackCalls.length).toBe(0);
  });

  it('does NOT emit telemetry when server and client agree (both wrong)', async () => {
    mockAdvisoryResponse({ correct: false });
    await reportMcAdvisory({ exerciseId: 1, chosenIndex: 0, correctIndex: 1, clientIsCorrect: false });
    expect(_trackCalls.length).toBe(0);
  });

  it('emits mc_grading_divergence when verdicts disagree', async () => {
    mockAdvisoryResponse({ correct: false });
    await reportMcAdvisory({ exerciseId: 1, chosenIndex: 0, correctIndex: 1, clientIsCorrect: true });
    expect(_trackCalls.length).toBe(1);
    expect(_trackCalls[0].event).toBe('mc_grading_divergence');
    expect(_trackCalls[0].props).toMatchObject({
      exerciseId: '1',
      chosenIndex: 0,
      correctIndex: 1,
      clientIsCorrect: true,
      serverIsCorrect: false,
    });
  });

  it('posts the correct body to /api/grade/advisory', async () => {
    mockAdvisoryResponse({ correct: true });
    await reportMcAdvisory({ exerciseId: 'abc', chosenIndex: 1, correctIndex: 1, clientIsCorrect: true });
    const [[url, opts]] = apiFetch.mock.calls;
    expect(url).toBe('/api/grade/advisory');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body).toEqual({
      type: 'monivalinta',
      exerciseId: 'abc',
      payload: { chosenIndex: 1, correctIndex: 1 },
    });
  });

  it('is silent on network failure (no throw, no telemetry)', async () => {
    apiFetch.mockRejectedValueOnce(new Error('boom'));
    await expect(
      reportMcAdvisory({ exerciseId: 1, chosenIndex: 0, correctIndex: 0, clientIsCorrect: true }),
    ).resolves.toBeUndefined();
    expect(_trackCalls.length).toBe(0);
  });

  it('is silent on non-200 response', async () => {
    mockAdvisoryResponse({ ok: false });
    await reportMcAdvisory({ exerciseId: 1, chosenIndex: 0, correctIndex: 0, clientIsCorrect: true });
    expect(_trackCalls.length).toBe(0);
  });

  it('is silent on malformed server JSON (no .correct field)', async () => {
    mockAdvisoryResponse({ json: { band: 'taydellinen' } });
    await reportMcAdvisory({ exerciseId: 1, chosenIndex: 0, correctIndex: 1, clientIsCorrect: true });
    expect(_trackCalls.length).toBe(0);
  });

  it('truncates very long exerciseId before sending to telemetry (privacy guard)', async () => {
    mockAdvisoryResponse({ correct: false });
    const longId = 'x'.repeat(200);
    await reportMcAdvisory({ exerciseId: longId, chosenIndex: 0, correctIndex: 1, clientIsCorrect: true });
    expect(_trackCalls[0].props.exerciseId.length).toBe(60);
  });

  it('omits exerciseId from POST body when undefined', async () => {
    mockAdvisoryResponse({ correct: true });
    await reportMcAdvisory({ chosenIndex: 0, correctIndex: 0, clientIsCorrect: true });
    const body = JSON.parse(apiFetch.mock.calls[0][1].body);
    expect(body.exerciseId).toBeUndefined();
  });
});
