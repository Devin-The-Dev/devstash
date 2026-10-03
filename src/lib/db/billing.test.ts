import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const { prismaMock, stripeMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { updateMany: vi.fn() },
  },
  stripeMock: {
    checkout: { sessions: { retrieve: vi.fn() } },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>();
  return { ...actual, getStripe: () => stripeMock };
});

const { syncSubscription, syncCheckoutSession } = await import("@/lib/db/billing");

function subscription(fields: Partial<{ id: string; status: string; customer: unknown }>): Stripe.Subscription {
  return { id: "sub_1", status: "active", customer: "cus_1", ...fields } as unknown as Stripe.Subscription;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncSubscription", () => {
  it.each(["active", "trialing", "past_due"])("grants Pro and stores the subscription for %s", async (status) => {
    await syncSubscription(subscription({ status }));

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_1" },
      data: { isPro: true, stripeSubscriptionId: "sub_1" },
    });
  });

  it("resolves an expanded customer object to its ID", async () => {
    await syncSubscription(subscription({ customer: { id: "cus_obj" } }));

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { stripeCustomerId: "cus_obj" } }),
    );
  });

  it.each(["canceled", "unpaid", "incomplete_expired"])(
    "clears Pro for %s only when it's the subscription on file",
    async (status) => {
      await syncSubscription(subscription({ status }));

      expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
        where: {
          stripeCustomerId: "cus_1",
          OR: [{ stripeSubscriptionId: "sub_1" }, { stripeSubscriptionId: null }],
        },
        data: { isPro: false, stripeSubscriptionId: null },
      });
    },
  );
});

describe("syncCheckoutSession", () => {
  it("syncs the expanded subscription when the session belongs to the user", async () => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      client_reference_id: "user-1",
      subscription: subscription({}),
    });

    await syncCheckoutSession("user-1", "cs_1");

    expect(stripeMock.checkout.sessions.retrieve).toHaveBeenCalledWith("cs_1", { expand: ["subscription"] });
    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: "cus_1" },
      data: { isPro: true, stripeSubscriptionId: "sub_1" },
    });
  });

  it("does nothing when the session belongs to another user", async () => {
    stripeMock.checkout.sessions.retrieve.mockResolvedValue({
      client_reference_id: "user-2",
      subscription: subscription({}),
    });

    await syncCheckoutSession("user-1", "cs_1");

    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });
});
