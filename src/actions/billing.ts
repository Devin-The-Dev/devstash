"use server";

import type Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceId, isProStatus } from "@/lib/stripe";
import { getBillingUser, syncSubscription } from "@/lib/db/billing";
import { getBaseUrl } from "@/lib/url";
import { runUserAction, type ActionResult } from "@/lib/action-result";

const intervalSchema = z.enum(["monthly", "yearly"]);

async function getOrCreateCustomerId(userId: string): Promise<string> {
  const user = await getBillingUser(userId);
  if (!user) throw new Error("User not found");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create(
    {
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    },
    { idempotencyKey: `customer-create-${userId}` },
  );

  // Conditional write guards against a double-click creating two customers.
  const { count } = await prisma.user.updateMany({
    where: { id: userId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });
  if (count === 0) {
    const existing = await getBillingUser(userId);
    if (!existing?.stripeCustomerId) throw new Error("Stripe customer ID missing after conflict");
    return existing.stripeCustomerId;
  }
  return customer.id;
}

// Omitting `status` lists every subscription except canceled ones.
async function findProSubscription(customerId: string): Promise<Stripe.Subscription | undefined> {
  const { data } = await getStripe().subscriptions.list({ customer: customerId, limit: 100 });
  return data.find((subscription) => isProStatus(subscription.status));
}

const CHECKOUT_ERROR = "Could not start checkout";

export async function createCheckoutSession(interval: unknown): Promise<ActionResult<{ url: string }>> {
  return runUserAction(
    "createCheckoutSession",
    async (userId) => {
      const parsed = intervalSchema.safeParse(interval);
      if (!parsed.success) {
        return { success: false, error: "Invalid billing interval" };
      }

      const user = await getBillingUser(userId);
      if (user?.isPro) {
        return { success: false, error: "You already have DevStash Pro" };
      }

      const customerId = await getOrCreateCustomerId(userId);

      // isPro lags when webhooks are delayed or failing, so ask Stripe directly
      // before starting a second subscription for the same customer.
      const existing = await findProSubscription(customerId);
      if (existing) {
        await syncSubscription(existing);
        return { success: false, error: "You already have DevStash Pro" };
      }

      const baseUrl = getBaseUrl();

      const checkout = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: userId,
        line_items: [{ price: getPriceId(parsed.data), quantity: 1 }],
        allow_promotion_codes: true,
        subscription_data: { metadata: { userId } },
        success_url: `${baseUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}#billing`,
        cancel_url: `${baseUrl}/settings?checkout=canceled#billing`,
      });

      if (!checkout.url) {
        return { success: false, error: CHECKOUT_ERROR };
      }
      return { success: true, data: { url: checkout.url } };
    },
    CHECKOUT_ERROR,
  );
}

export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
  return runUserAction(
    "createPortalSession",
    async (userId) => {
      const user = await getBillingUser(userId);
      if (!user?.stripeCustomerId) {
        return { success: false, error: "No billing account found" };
      }

      const portal = await getStripe().billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${getBaseUrl()}/settings#billing`,
      });
      return { success: true, data: { url: portal.url } };
    },
    "Could not open billing portal",
  );
}
