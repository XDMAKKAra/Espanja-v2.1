import { describe, it, expect } from "vitest";
import { tryRepairTruncatedJson } from "../lib/openai.js";

describe("tryRepairTruncatedJson", () => {
  it("parses clean JSON after stripping trailing commas", () => {
    expect(tryRepairTruncatedJson('[{"a":1},]')).toEqual([{ a: 1 }]);
    expect(tryRepairTruncatedJson('{"a":1,"b":2,}')).toEqual({ a: 1, b: 2 });
  });

  it("recovers a truncated array by trimming to the last complete item", () => {
    const text = '[{"id":1,"q":"foo"},{"id":2,"q":"bar"},{"id":3,"q":';
    expect(tryRepairTruncatedJson(text)).toEqual([
      { id: 1, q: "foo" },
      { id: 2, q: "bar" },
    ]);
  });

  it("recovers an object missing its closing brace", () => {
    expect(tryRepairTruncatedJson('{"a":1,"b":2,')).toEqual({ a: 1, b: 2 });
    expect(tryRepairTruncatedJson('{"id":1,"q":"hello')).toEqual({ id: 1 });
  });

  it("returns null when the payload is beyond repair", () => {
    expect(tryRepairTruncatedJson("")).toBeNull();
    expect(tryRepairTruncatedJson(null)).toBeNull();
    expect(tryRepairTruncatedJson("not json at all")).toBeNull();
  });

  it("returns already-valid JSON untouched", () => {
    expect(tryRepairTruncatedJson('[1,2,3]')).toEqual([1, 2, 3]);
    expect(tryRepairTruncatedJson('{"ok":true}')).toEqual({ ok: true });
  });
});
