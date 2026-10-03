import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/db/billing";

// Stripe doesn't guarantee delivery order and retries for days, so an event's
// payload can be stale. Sync from the subscription's current state instead.
async function syncLatestSubscription(subscriptionId: string): Promise<void> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription);
}

// All subscription events funnel into the idempotent syncSubscription, so
// replayed or out-of-order deliveries converge on the same state.
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) return;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      await syncLatestSubscription(subscriptionId);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // Canceled subscriptions stay retrievable, and their "canceled" status clears Pro.
      await syncLatestSubscription(event.data.object.id);
      return;
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      // Status changes (past_due, unpaid, canceled) arrive via subscription.updated.
      console.warn("Stripe invoice payment failed", {
        invoiceId: invoice.id,
        subscription: invoice.parent?.subscription_details?.subscription,
      });
      return;
    }
    default:
      return;
  }
}
