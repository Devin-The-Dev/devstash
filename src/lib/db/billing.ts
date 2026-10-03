import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isProStatus } from "@/lib/stripe";

// Derives all state from the subscription object, so replayed or out-of-order
// webhook events converge on the same result.
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  if (!isProStatus(subscription.status)) {
    await clearSubscription(customerId, subscription.id);
    return;
  }

  // Match on customer ID, which is set before checkout (see createCheckoutSession).
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { isPro: true, stripeSubscriptionId: subscription.id },
  });
}

// Only clears when the ended subscription is the one on file (or none is), so a
// late event for an old subscription can't downgrade a user who resubscribed.
export async function clearSubscription(customerId: string, subscriptionId: string): Promise<void> {
  await prisma.user.updateMany({
    where: {
      stripeCustomerId: customerId,
      OR: [{ stripeSubscriptionId: subscriptionId }, { stripeSubscriptionId: null }],
    },
    data: { isPro: false, stripeSubscriptionId: null },
  });
}

export async function getBillingUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, isPro: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
}

// Covers webhook lag on the checkout success redirect.
export async function syncCheckoutSession(userId: string, sessionId: string): Promise<void> {
  const checkout = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });
  // Never trust the query param: the session must belong to this user.
  if (checkout.client_reference_id !== userId) return;
  if (checkout.subscription && typeof checkout.subscription !== "string") {
    await syncSubscription(checkout.subscription);
  }
}
