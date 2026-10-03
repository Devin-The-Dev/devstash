import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, stripeMock, getPriceIdMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  stripeMock: {
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
  },
  getPriceIdMock: vi.fn((interval: string) => `price_${interval}`),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => stripeMock,
  getPriceId: getPriceIdMock,
}));

const { createCheckoutSession, createPortalSession } = await import("@/actions/billing");

const billingUser = {
  email: "dev@example.com",
  name: "Dev",
  isPro: false,
  stripeCustomerId: null as string | null,
  stripeSubscriptionId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_URL", "https://devstash.test");
  vi.spyOn(console, "error").mockImplementation(() => {});
  stripeMock.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.test/s" });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function signedIn() {
  authMock.mockResolvedValue({ user: { id: "user-1" } });
}

describe("createCheckoutSession", () => {
  it("returns Unauthorized when there is no session", async () => {
    authMock.mockResolvedValue(null);

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an invalid interval", async () => {
    signedIn();

    const result = await createCheckoutSession("weekly");

    expect(result).toEqual({ success: false, error: "Invalid billing interval" });
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejects users who are already Pro", async () => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue({ ...billingUser, isPro: true, stripeCustomerId: "cus_1" });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "You already have DevStash Pro" });
    expect(stripeMock.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("reuses an existing Stripe customer", async () => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue({ ...billingUser, stripeCustomerId: "cus_existing" });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: true, data: { url: "https://checkout.stripe.test/s" } });
    expect(stripeMock.customers.create).not.toHaveBeenCalled();
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" }),
    );
  });

  it("creates a customer and stores it with a conditional write", async () => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue(billingUser);
    stripeMock.customers.create.mockResolvedValue({ id: "cus_new" });
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await createCheckoutSession("monthly");

    expect(result.success).toBe(true);
    expect(stripeMock.customers.create).toHaveBeenCalledWith(
      { email: "dev@example.com", name: "Dev", metadata: { userId: "user-1" } },
      { idempotencyKey: "customer-create-user-1" },
    );
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", stripeCustomerId: null },
      data: { stripeCustomerId: "cus_new" },
    });
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new" }),
    );
  });

  it("uses the stored customer ID when the conditional write loses the race", async () => {
    signedIn();
    prismaMock.user.findUnique
      .mockResolvedValueOnce(billingUser) // isPro check
      .mockResolvedValueOnce(billingUser) // getOrCreateCustomerId
      .mockResolvedValueOnce({ ...billingUser, stripeCustomerId: "cus_winner" }); // re-read after conflict
    stripeMock.customers.create.mockResolvedValue({ id: "cus_loser" });
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    const result = await createCheckoutSession("monthly");

    expect(result.success).toBe(true);
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_winner" }),
    );
  });

  it("returns an error when Stripe returns no checkout URL", async () => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue({ ...billingUser, stripeCustomerId: "cus_1" });
    stripeMock.checkout.sessions.create.mockResolvedValue({ url: null });

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Could not start checkout" });
  });

  it("returns a generic error when Stripe throws", async () => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue({ ...billingUser, stripeCustomerId: "cus_1" });
    stripeMock.checkout.sessions.create.mockRejectedValue(new Error("card_declined: secret detail"));

    const result = await createCheckoutSession("monthly");

    expect(result).toEqual({ success: false, error: "Could not start checkout" });
    expect(console.error).toHaveBeenCalled();
  });

  it.each(["monthly", "yearly"] as const)("builds the %s session for the signed-in user", async (interval) => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue({ ...billingUser, stripeCustomerId: "cus_1" });

    await createCheckoutSession(interval);

    expect(getPriceIdMock).toHaveBeenCalledWith(interval);
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith({
      mode: "subscription",
      customer: "cus_1",
      client_reference_id: "user-1",
      line_items: [{ price: `price_${interval}`, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: "user-1" } },
      success_url: "https://devstash.test/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}#billing",
      cancel_url: "https://devstash.test/settings?checkout=canceled#billing",
    });
  });
});

describe("createPortalSession", () => {
  it("returns Unauthorized when there is no session", async () => {
    authMock.mockResolvedValue(null);

    const result = await createPortalSession();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(stripeMock.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("errors when the user has no Stripe customer", async () => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue(billingUser);

    const result = await createPortalSession();

    expect(result).toEqual({ success: false, error: "No billing account found" });
    expect(stripeMock.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it("returns the portal URL", async () => {
    signedIn();
    prismaMock.user.findUnique.mockResolvedValue({ ...billingUser, isPro: true, stripeCustomerId: "cus_1" });
    stripeMock.billingPortal.sessions.create.mockResolvedValue({ url: "https://billing.stripe.test/p" });

    const result = await createPortalSession();

    expect(result).toEqual({ success: true, data: { url: "https://billing.stripe.test/p" } });
    expect(stripeMock.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "https://devstash.test/settings#billing",
    });
  });
});
