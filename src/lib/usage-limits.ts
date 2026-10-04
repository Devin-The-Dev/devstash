import { prisma } from "@/lib/prisma";
import { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT, PRO_ITEM_TYPE_NAMES } from "@/lib/plans";

export { FREE_COLLECTION_LIMIT, FREE_ITEM_LIMIT, PRO_ITEM_TYPE_NAMES, PRO_PRICING } from "@/lib/plans";

// The item and collection count limits aren't enforced until launch; flip by
// setting BILLING_ENFORCED="true" in the environment. Pro-only item types and
// features are always gated, since free users can't see Pro items anyway
// (see getVisibleItemsFilter).
export function isBillingEnforced(): boolean {
  return process.env.BILLING_ENFORCED === "true";
}

export async function getUserIsPro(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  return user?.isPro ?? false;
}

export type GateResult = { allowed: true } | { allowed: false; error: string };

// Count-then-create can race past the limit by a request or two; acceptable for a soft limit.
export async function canCreateItem(userId: string, typeName: string): Promise<GateResult> {
  const isProType = PRO_ITEM_TYPE_NAMES.has(typeName);
  if (!isProType && !isBillingEnforced()) return { allowed: true };
  if (await getUserIsPro(userId)) return { allowed: true };

  if (isProType) {
    return { allowed: false, error: `${typeName} items require DevStash Pro` };
  }

  const count = await prisma.item.count({ where: { userId } });
  if (count >= FREE_ITEM_LIMIT) {
    return {
      allowed: false,
      error: `Free plan is limited to ${FREE_ITEM_LIMIT} items. Upgrade to Pro for unlimited items.`,
    };
  }
  return { allowed: true };
}

export async function canCreateCollection(userId: string): Promise<GateResult> {
  if (!isBillingEnforced()) return { allowed: true };
  if (await getUserIsPro(userId)) return { allowed: true };

  const count = await prisma.collection.count({ where: { userId } });
  if (count >= FREE_COLLECTION_LIMIT) {
    return {
      allowed: false,
      error: `Free plan is limited to ${FREE_COLLECTION_LIMIT} collections. Upgrade to Pro for unlimited collections.`,
    };
  }
  return { allowed: true };
}

export async function canUseProFeature(userId: string, feature: string): Promise<GateResult> {
  if (await getUserIsPro(userId)) return { allowed: true };
  return { allowed: false, error: `${feature} requires DevStash Pro` };
}
