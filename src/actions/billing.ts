"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getPriceId } from "@/lib/stripe";
import { getBillingUser } from "@/lib/db/billing";
import { getBaseUrl } from "@/lib/url";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

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

export async function createCheckoutSession(interval: unknown): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = intervalSchema.safeParse(interval);
  if (!parsed.success) {
    return { success: false, error: "Invalid billing interval" };
  }

  try {
    const user = await getBillingUser(session.user.id);
    if (user?.isPro) {
      return { success: false, error: "You already have DevStash Pro" };
    }

    const customerId = await getOrCreateCustomerId(session.user.id);
    const baseUrl = getBaseUrl();

    const checkout = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.user.id,
      line_items: [{ price: getPriceId(parsed.data), quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: session.user.id } },
      success_url: `${baseUrl}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}#billing`,
      cancel_url: `${baseUrl}/settings?checkout=canceled#billing`,
    });

    if (!checkout.url) {
      return { success: false, error: "Could not start checkout" };
    }
    return { success: true, data: { url: checkout.url } };
  } catch (error) {
    console.error("createCheckoutSession failed", error);
    return { success: false, error: "Could not start checkout" };
  }
}

export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await getBillingUser(session.user.id);
    if (!user?.stripeCustomerId) {
      return { success: false, error: "No billing account found" };
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getBaseUrl()}/settings#billing`,
    });
    return { success: true, data: { url: portal.url } };
  } catch (error) {
    console.error("createPortalSession failed", error);
    return { success: false, error: "Could not open billing portal" };
  }
}
