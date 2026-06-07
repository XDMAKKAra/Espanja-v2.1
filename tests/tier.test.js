// L-V377 follow-up — tier classification guards.
// Locks the substring bug: subscription_status "inactive" must NOT count as
// paid just because it contains "active". Also asserts there is no "pro" tier.

import { describe, it, expect } from "vitest";
import { isPaidTier, getTier, getTierLabel } from "../js/lib/tier.js";

describe("isPaidTier — exact status match", () => {
  it("treats 'inactive' as free (was a false substring match of 'active')", () => {
    expect(isPaidTier({ subscription_status: "inactive" })).toBe(false);
  });
  it("treats active and trialing as paid", () => {
    expect(isPaidTier({ subscription_status: "active" })).toBe(true);
    expect(isPaidTier({ subscription_status: "trialing" })).toBe(true);
    expect(isPaidTier({ subscription_status: "lifetime" })).toBe(true);
  });
  it("empty, canceled, and past_due are free", () => {
    expect(isPaidTier({ subscription_status: "" })).toBe(false);
    expect(isPaidTier({ subscription_status: "canceled" })).toBe(false);
    expect(isPaidTier({ subscription_status: "past_due" })).toBe(false);
  });
  it("trims and lowercases", () => {
    expect(isPaidTier({ subscription_status: "  ACTIVE " })).toBe(true);
  });
});

describe("getTier — free / treeni / kurssi (no 'pro')", () => {
  it("free when the status is not paid", () => {
    expect(getTier({ subscription_status: "inactive", subscription_tier: "free" })).toBe("free");
  });
  it("treeni for an active subscription", () => {
    expect(getTier({ subscription_status: "active", subscription_tier: "treeni" })).toBe("treeni");
  });
  it("kurssi for the mestari course package", () => {
    expect(getTier({ subscription_status: "active", subscription_tier: "mestari" })).toBe("kurssi");
  });
  it("never returns 'pro'", () => {
    const values = ["free", "treeni", "mestari"].map((t) =>
      getTier({ subscription_status: "active", subscription_tier: t }));
    expect(values).not.toContain("pro");
  });
});

describe("getTierLabel", () => {
  it("labels paid users Treeni and others Free", () => {
    expect(getTierLabel({ subscription_status: "active" })).toBe("Treeni");
    expect(getTierLabel({ subscription_status: "inactive" })).toBe("Free");
  });
});
