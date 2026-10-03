import Stripe from "stripe";

let stripeClient: Stripe | null = null;

// Lazy so `next build` doesn't require STRIPE_SECRET_KEY at import time.
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export type BillingInterval = "monthly" | "yearly";

export function getPriceId(interval: BillingInterval): string {
  const priceId =
    interval === "monthly" ? process.env.STRIPE_PRICE_ID_MONTHLY : process.env.STRIPE_PRICE_ID_YEARLY;
  if (!priceId) {
    throw new Error(`Stripe price ID for ${interval} billing is not set`);
  }
  return priceId;
}

// Statuses that grant Pro access. `past_due` keeps access during Stripe's
// smart-retry window; access ends when Stripe moves the sub to
// `unpaid`/`canceled` (configure in Dashboard → Billing → Revenue recovery).
const PRO_STATUSES: ReadonlySet<Stripe.Subscription.Status> = new Set(["active", "trialing", "past_due"]);

export function isProStatus(status: Stripe.Subscription.Status): boolean {
  return PRO_STATUSES.has(status);
}
