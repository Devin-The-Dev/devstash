import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const { stripeMock, syncSubscriptionMock } = vi.hoisted(() => ({
  stripeMock: {
    subscriptions: { retrieve: vi.fn() },
  },
  syncSubscriptionMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => stripeMock,
}));

vi.mock("@/lib/db/billing", () => ({
  syncSubscription: syncSubscriptionMock,
}));

const { handleStripeEvent } = await import("@/lib/stripe-webhook");

function event(type: string, object: Record<string, unknown>): Stripe.Event {
  return { id: "evt_1", type, data: { object } } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleStripeEvent", () => {
  it("retrieves and syncs the subscription on a completed subscription checkout", async () => {
    const subscription = { id: "sub_1", status: "active" };
    stripeMock.subscriptions.retrieve.mockResolvedValue(subscription);

    await handleStripeEvent(event("checkout.session.completed", { mode: "subscription", subscription: "sub_1" }));

    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
    expect(syncSubscriptionMock).toHaveBeenCalledWith(subscription);
  });

  it("ignores non-subscription checkouts", async () => {
    await handleStripeEvent(event("checkout.session.completed", { mode: "payment", subscription: null }));

    expect(stripeMock.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(syncSubscriptionMock).not.toHaveBeenCalled();
  });

  it.each(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"])(
    "syncs the subscription's current state on %s",
    async (type) => {
      const latest = { id: "sub_1", status: "active", customer: "cus_1" };
      stripeMock.subscriptions.retrieve.mockResolvedValue(latest);

      await handleStripeEvent(event(type, { id: "sub_1", status: "incomplete", customer: "cus_1" }));

      expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith("sub_1");
      expect(syncSubscriptionMock).toHaveBeenCalledWith(latest);
    },
  );

  it("ignores a stale payload: a late 'active' update for a canceled subscription syncs as canceled", async () => {
    const latest = { id: "sub_1", status: "canceled", customer: "cus_1" };
    stripeMock.subscriptions.retrieve.mockResolvedValue(latest);

    await handleStripeEvent(
      event("customer.subscription.updated", { id: "sub_1", status: "active", customer: "cus_1" }),
    );

    expect(syncSubscriptionMock).toHaveBeenCalledWith(latest);
  });

  it("logs failed invoice payments without changing state", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await handleStripeEvent(
      event("invoice.payment_failed", {
        id: "in_1",
        parent: { subscription_details: { subscription: "sub_1" } },
      }),
    );

    expect(warn).toHaveBeenCalledWith("Stripe invoice payment failed", { invoiceId: "in_1", subscription: "sub_1" });
    expect(syncSubscriptionMock).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("ignores unhandled event types", async () => {
    await handleStripeEvent(event("customer.created", { id: "cus_1" }));

    expect(syncSubscriptionMock).not.toHaveBeenCalled();
  });

  it("propagates Stripe retrieve errors so the route returns 500 and Stripe retries", async () => {
    stripeMock.subscriptions.retrieve.mockRejectedValueOnce(new Error("stripe down"));

    await expect(
      handleStripeEvent(event("customer.subscription.deleted", { id: "sub_1", status: "canceled" })),
    ).rejects.toThrow("stripe down");
    expect(syncSubscriptionMock).not.toHaveBeenCalled();
  });

  it("propagates sync errors so the route returns 500 and Stripe retries", async () => {
    stripeMock.subscriptions.retrieve.mockResolvedValue({ id: "sub_1", status: "active" });
    syncSubscriptionMock.mockRejectedValueOnce(new Error("db down"));

    await expect(
      handleStripeEvent(event("customer.subscription.updated", { id: "sub_1", status: "active" })),
    ).rejects.toThrow("db down");
  });
});
