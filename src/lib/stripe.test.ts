import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { StripeMock } = vi.hoisted(() => ({
  StripeMock: vi.fn(function (this: { key: string }, key: string) {
    this.key = key;
  }),
}));

vi.mock("stripe", () => ({
  default: StripeMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  // getStripe caches its client at module scope, so each test needs a fresh module.
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function loadStripeModule() {
  return import("@/lib/stripe");
}

describe("isProStatus", () => {
  it.each(["active", "trialing", "past_due"] as const)("grants Pro for %s", async (status) => {
    const { isProStatus } = await loadStripeModule();
    expect(isProStatus(status)).toBe(true);
  });

  it.each(["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"] as const)(
    "denies Pro for %s",
    async (status) => {
      const { isProStatus } = await loadStripeModule();
      expect(isProStatus(status)).toBe(false);
    },
  );
});

describe("getPriceId", () => {
  it("returns the monthly and yearly price IDs from env", async () => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");
    const { getPriceId } = await loadStripeModule();

    expect(getPriceId("monthly")).toBe("price_monthly");
    expect(getPriceId("yearly")).toBe("price_yearly");
  });

  it.each(["monthly", "yearly"] as const)("throws when the %s price ID is unset", async (interval) => {
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "");
    const { getPriceId } = await loadStripeModule();

    expect(() => getPriceId(interval)).toThrow(`Stripe price ID for ${interval} billing is not set`);
  });
});

describe("getStripe", () => {
  it("throws when STRIPE_SECRET_KEY is unset", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { getStripe } = await loadStripeModule();

    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY is not set");
    expect(StripeMock).not.toHaveBeenCalled();
  });

  it("creates the client once and returns the same instance on repeat calls", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    const { getStripe } = await loadStripeModule();

    const first = getStripe();
    const second = getStripe();

    expect(first).toBe(second);
    expect(StripeMock).toHaveBeenCalledTimes(1);
    expect(StripeMock).toHaveBeenCalledWith("sk_test_123");
  });
});
