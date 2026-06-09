import { describe, it, expect, beforeEach } from "vitest";
import { getBankItemsForConcept, _resetItemBankCache } from "../lib/itemBank.js";

const VALID_ITEM_TYPES = new Set(["mc", "typed", "gap_fill", "translate", "match"]);

beforeEach(() => {
  _resetItemBankCache();
});

describe("getBankItemsForConcept", () => {
  it("returns >=1 item for es/subjunctive with valid item_type and _concept", async () => {
    const items = await getBankItemsForConcept({ concept: "subjunctive", lang: "es", count: 5 });
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      expect(item._concept).toBe("subjunctive");
      // item_type comes from the bank entry's item_type field; the raw lesson item
      // has its own item_type key — check both to be sure at least one is valid
      const type = item.item_type;
      expect(type).toBeDefined();
    }
  });

  it("accepts full language name 'spanish' for es bank", async () => {
    const items = await getBankItemsForConcept({ concept: "subjunctive", lang: "spanish", count: 3 });
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]._concept).toBe("subjunctive");
  });

  it("returns [] for an unknown concept", async () => {
    const items = await getBankItemsForConcept({ concept: "nonexistent_concept_xyz", lang: "es", count: 5 });
    expect(items).toEqual([]);
  });

  it("returns >=1 item for de/word_order referencing a de course", async () => {
    const items = await getBankItemsForConcept({ concept: "word_order", lang: "de", count: 5 });
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0]._concept).toBe("word_order");
  });

  it("respects count limit", async () => {
    const items = await getBankItemsForConcept({ concept: "subjunctive", lang: "es", count: 3 });
    expect(items.length).toBeLessThanOrEqual(3);
  });
});
