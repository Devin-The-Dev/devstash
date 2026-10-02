# Stripe Integration Plan — DevStash Pro

> Subscription billing for DevStash Pro: **$8/month** or **$72/year**.
> Generated from codebase research on 2026-10-01. Source prompt: `context/research/stripe-integration-research.md`.

---

## 1. Current State Analysis

### 1.1 User model — billing fields already exist

`prisma/schema.prisma` already has everything needed for a minimal integration:

```prisma
model User {
  ...
  isPro                Boolean @default(false)
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique
  ...
}
```

**No migration is required.** One optional migration is covered in [§3.9](#39-optional-migration--subscription-period-end), but nothing depends on it.

### 1.2 NextAuth configuration

| File | Role |
|---|---|
| `src/auth.config.ts` | Edge-safe config: `pages.signIn`, GitHub plus a placeholder Credentials provider. **No callbacks.** |
| `src/auth.ts` | Full Node config: Prisma adapter, `session: { strategy: "jwt" }`, `signIn`/`jwt`/`session` callbacks, real bcrypt Credentials provider |
| `src/proxy.ts` | Next 16 proxy (formerly middleware). Builds its **own** `NextAuth(authConfig)` instance, so the `auth.ts` callbacks never run at the Edge. Matcher: `/dashboard/:path*`, `/profile`, `/settings`, `/items/:path*`, `/collections/:path*`, `/favorites`. **`/api/*` is not matched.** |
| `src/types/next-auth.d.ts` | Augments `Session.user` with `id: string` only |

The current JWT callback stores the user ID in **`token.id`**, not `token.sub`:

```ts
jwt({ token, user }) {
  if (user) token.id = user.id;
  return token;
},
session({ session, token }) {
  session.user.id = token.id as string;
  return session;
},
```

### 1.3 How user data is accessed

- **Server components** call `getCurrentUser()` (`src/lib/db/user.ts`). It is wrapped in React `cache()`, calls `auth()`, then **reads the user row fresh from Prisma, including `isPro`**, and redirects to `/sign-in` if the user has no session or no row.
- **Server actions** (`src/actions/*.ts`) call `auth()` directly, check `session?.user?.id`, and query Prisma with that ID.
- **API routes** (`src/app/api/*`) follow the same `auth()` pattern and return `NextResponse.json({ success, data | error }, { status })`.
- **No client component uses `useSession()` or `SessionProvider`.** Client components receive data as props from server components, or call server actions / API routes.

`isPro` already appears in the UI:

| Location | Usage |
|---|---|
| `src/components/dashboard/AppSidebar.tsx:59` | "Pro plan" / "Free plan" label |
| `src/components/dashboard/AppSidebar.tsx:33,87` | `proItemTypeNames = new Set(["File", "Image"])` → PRO badge on those types for free users |
| `src/components/dashboard/AppSidebar.tsx:160` | **"Upgrade to Pro" `<Button>` with no handler**, shown when `!isPro` |
| `src/app/profile/page.tsx:28` | PRO badge next to the user's name |
| `src/components/homepage/PricingPlans.tsx` | Client component with monthly/yearly toggle. `PRO_PRICING = { monthly: "$8", yearly: "$72" }`. "Upgrade to Pro" CTA (marketing page) |

### 1.4 Existing payment code

**None.** `stripe` is not installed. The only references are in `.env.example`, which has **two** Stripe blocks (a duplicate to clean up):

```env
# ─── Stripe ───
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
...
# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
```

### 1.5 About the JWT `isPro` sync workaround in the research notes

The research prompt suggests syncing `isPro` into the JWT on every validation. **Recommendation: don't add it for now.** It isn't needed, for these reasons:

1. **Nothing reads `isPro` from the session.** Every `isPro` check goes through `getCurrentUser()`, which already reads from the DB on each request. After a webhook flips `isPro`, a page load or `router.refresh()` shows the new value.
2. The callback would add a DB query to **every** `auth()` call, and every server action and API route calls `auth()`.
3. The proxy (`src/proxy.ts`) uses a separate NextAuth instance without these callbacks, so `req.auth` would never carry `isPro` anyway.

**If** a client component later needs `session.user.isPro` via `useSession()`, adapt the workaround to this codebase's `token.id` (not `token.sub`):

```ts
// src/auth.ts — only if session.user.isPro becomes necessary
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
  }
  // Always sync isPro from DB so Stripe webhook updates are picked up.
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { isPro: true },
    });
    token.isPro = dbUser?.isPro ?? false;
  }
  return token;
},
session({ session, token }) {
  session.user.id = token.id as string;
  session.user.isPro = (token.isPro as boolean | undefined) ?? false;
  return session;
},
```

…and add `isPro: boolean` to `Session.user` in `src/types/next-auth.d.ts`.

---

## 2. Feature Gating Analysis

### 2.1 Free vs Pro (from `context/project-overview.md`)

| Feature | Free | Pro |
|---|---|---|
| Items | 50 total | Unlimited |
| Collections | 3 | Unlimited |
| File & Image types / uploads | ❌ | ✅ |
| Custom types | ❌ | ✅ (not built yet) |
| AI features | ❌ | ✅ (not built yet) |
| Export JSON/ZIP | ❌ | ✅ (not built yet) |

> Spec note: *"All features are unlocked for all users during development. The pro gate is wired up but not enforced until launch."* The plan below therefore includes a single enforcement switch.

### 2.2 Enforcement points (server-side, authoritative)

| Gate | Where it is enforced | Current code |
|---|---|---|
| 50-item limit | `createItem` in `src/actions/items.ts` | No count check. Called from `NewItemDialog.tsx` |
| 3-collection limit | `POST` in `src/app/api/collections/route.ts` | No count check. Called from `NewCollectionDialog.tsx` via `fetch` |
| File/Image uploads | `POST` in `src/app/api/upload/route.ts` | Only `validateUpload` (size/type). Called from `FileUpload.tsx` via XHR |
| File/Image item creation | `createItem` in `src/actions/items.ts` (`isFileType` branch) | Requires `fileUrl` but no Pro check. Needs a gate too, because a `fileUrl` could be supplied without going through `/api/upload` |
| AI / export / custom types | Future actions | Use the same `requirePro` helper when built |

`updateItem` doesn't change an item's type, so it needs no gate. Items or collections already over the limit after a downgrade stay readable and editable. Only **creation** is blocked.

### 2.3 UI touchpoints (UX only, never trusted)

- `AppSidebar` "Upgrade to Pro" button → link to `/settings#billing` (or start checkout directly).
- `PricingPlans` Pro CTA → `/register` for signed-out users, `/settings#billing` for signed-in users. It's a marketing page, so a simple link is fine.
- `NewItemDialog` / `NewCollectionDialog` already surface `result.error` via `toast.error`, so limit errors show with no extra work. Optionally, add an "Upgrade" action to the toast.
- Settings page: new **Billing** card (see §3.7).

### 2.4 Settings page structure (`src/app/settings/page.tsx`)

This is a server component. It calls `getCurrentUser()` and renders shadcn `Card`s in a `max-w-3xl` column:

1. **Editor preferences**: `EditorPreferencesProvider` + `EditorPreferencesForm`
2. **Account actions**: `ChangePasswordForm` (if `hasPassword`) and `DeleteAccountDialog`

The **Billing** card goes between them.

---

## 3. API & Webhook Patterns → Files to Create

### Conventions observed

- **Server actions** declare a local `type ActionResult<T> = { success: true; data: T } | { success: false; error: string }`, check auth first, `safeParse` with Zod, return the first issue message, and `revalidatePath` after mutations.
- **API routes** return `NextResponse.json({ success, ... }, { status })`, with 401 for no session and 400 for invalid input.
- **Env vars** are read directly from `process.env`. The base URL comes from `getBaseUrl()` in `src/lib/url.ts` (`APP_URL`, never request headers). External clients are singletons (`src/lib/prisma.ts`, `src/lib/r2.ts`, `src/lib/resend.ts`).
- **Webhooks** must be API routes (per `context/coding-standards.md`). The Next 16 docs (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md#webhooks`) say to read the raw body with `await request.text()`; no bodyParser config is needed.
- **Tests**: Vitest, colocated `*.test.ts`, only for `src/actions` and `src/lib`. Mock `@/auth`, `@/lib/prisma`, and external SDKs with `vi.hoisted` + `vi.mock`.

### Stripe SDK notes (verified against `stripe@23.0.0`, latest on npm)

- Pinned API version: **`2026-09-30.endive`**. Don't pass `apiVersion` explicitly; the SDK pins it.
- **`current_period_end` is on subscription items** (`subscription.items.data[0].current_period_end`), **not** on `Subscription`.
- An invoice's subscription is at **`invoice.parent?.subscription_details?.subscription`** (there is no `invoice.subscription`).
- Webhook verification: `stripe.webhooks.constructEvent(rawBody, signature, secret)`.
- Node ≥ 20 required.
- The SDK README recommends lazy initialization so `next build` doesn't fail when `STRIPE_SECRET_KEY` is missing at build time.

---

### 3.1 `src/lib/stripe.ts` — client singleton plus price config

```ts
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
    interval === "monthly"
      ? process.env.STRIPE_PRICE_ID_MONTHLY
      : process.env.STRIPE_PRICE_ID_YEARLY;
  if (!priceId) {
    throw new Error(`Stripe price ID for ${interval} billing is not set`);
  }
  return priceId;
}

// Statuses that grant Pro access. `past_due` keeps access during Stripe's
// smart-retry window; access ends when Stripe moves the sub to
// `unpaid`/`canceled` (configure in Dashboard → Billing → Revenue recovery).
const PRO_STATUSES: ReadonlySet<Stripe.Subscription.Status> = new Set([
  "active",
  "trialing",
  "past_due",
]);

export function isProStatus(status: Stripe.Subscription.Status): boolean {
  return PRO_STATUSES.has(status);
}
```

### 3.2 `src/lib/plan.ts` — limits and gating helpers

```ts
import { prisma } from "@/lib/prisma";

export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
export const PRO_ITEM_TYPE_NAMES: ReadonlySet<string> = new Set(["File", "Image"]);

// Spec: gates are wired but not enforced until launch.
// Flip by setting BILLING_ENFORCED="true" in the environment.
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

export async function canCreateItem(userId: string, typeName: string): Promise<GateResult> {
  if (!isBillingEnforced()) return { allowed: true };
  if (await getUserIsPro(userId)) return { allowed: true };

  if (PRO_ITEM_TYPE_NAMES.has(typeName)) {
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
  if (!isBillingEnforced()) return { allowed: true };
  if (await getUserIsPro(userId)) return { allowed: true };
  return { allowed: false, error: `${feature} requires DevStash Pro` };
}
```

> The count-then-create check can race: two parallel requests could both pass at 49 items. That's acceptable for a soft product limit and doesn't need a transaction or lock.

Also update `AppSidebar.tsx` to import `PRO_ITEM_TYPE_NAMES` instead of its local `proItemTypeNames` set.

### 3.3 `src/lib/db/billing.ts` — DB sync (single source of truth)

All webhook handlers funnel into one **idempotent** function that derives state from the subscription object. Replayed or out-of-order events then converge on the correct state.

```ts
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { isProStatus } from "@/lib/stripe";

export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const isPro = isProStatus(subscription.status);

  // Match on customer ID, which is set before checkout (see createCheckoutSession).
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      isPro,
      stripeSubscriptionId: isPro ? subscription.id : null,
    },
  });
}

export async function clearSubscription(customerId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { isPro: false, stripeSubscriptionId: null },
  });
}

export async function getBillingUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, isPro: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
}
```

### 3.4 `src/actions/billing.ts` — checkout and portal

```ts
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
    return existing!.stripeCustomerId!;
  }
  return customer.id;
}

export async function createCheckoutSession(
  interval: unknown,
): Promise<ActionResult<{ url: string }>> {
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
```

The client does `window.location.assign(result.data.url)`. That keeps the `{ success, data, error }` contract and the toast-on-error pattern, instead of calling `redirect()` inside the action.

### 3.5 `src/app/api/webhooks/stripe/route.ts` — webhook handler

`/api/*` is outside the proxy matcher, so no auth redirect interferes. Security comes from the signature check.

```ts
import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { clearSubscription, syncSubscription } from "@/lib/db/billing";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    // Raw body is required for signature verification.
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkout = event.data.object;
        if (checkout.mode === "subscription" && typeof checkout.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(checkout.subscription);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object);
        break;
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await clearSubscription(customerId);
        break;
      }
      case "invoice.payment_failed": {
        // Status transitions arrive via customer.subscription.updated; log for visibility.
        const invoice = event.data.object;
        console.warn(
          "Stripe invoice payment failed",
          invoice.id,
          invoice.parent?.subscription_details?.subscription,
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handler failed for ${event.type}`, error);
    // 500 → Stripe retries with backoff.
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

**Why `checkout.session.completed` re-fetches the subscription:** the checkout session only carries the subscription ID. Retrieving the subscription gives the authoritative `status`. Because `syncSubscription` is idempotent, it doesn't matter if `customer.subscription.created` arrives first or twice.

### 3.6 Return-from-checkout sync (covers webhook lag)

The webhook can land a second or two after Stripe redirects back. In local dev, it never lands if `stripe listen` isn't running. On the success URL, sync directly from the session:

```ts
// src/lib/db/billing.ts — add
import { getStripe } from "@/lib/stripe";

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
```

Call it at the top of `SettingsPage` when `searchParams.checkout === "success"` and a `session_id` is present, **before** `getCurrentUser()` reads `isPro`. Wrap it in try/catch and fall through to the webhook on failure. In Next 16, `searchParams` is a `Promise` and must be awaited.

### 3.7 `src/components/settings/BillingCard.tsx` (client)

Props: `isPro: boolean`, `hasBillingAccount: boolean`, `checkoutStatus?: "success" | "canceled"`.

- **Free:** show plan limits ("50 items · 3 collections"), a Monthly/Yearly toggle (reuse the `PRO_PRICING` copy: "$8/month" vs "$72/year — save 25%"), and an "Upgrade to Pro" button → `createCheckoutSession(interval)` → `window.location.assign(url)`. Use `useTransition` for the pending state and `toast.error` on failure.
- **Pro:** "DevStash Pro" badge plus a "Manage subscription" button → `createPortalSession()` → redirect. The portal handles plan switching, card updates, cancellation, and invoices.
- `checkoutStatus === "success"` → `toast.success("Welcome to Pro!")` once on mount. `"canceled"` → a neutral info toast.

Consider exporting `PRO_PRICING` from a shared module, e.g. `src/lib/plan.ts`, so the homepage and settings share the same values.

### 3.8 `src/components/dashboard/UpgradeButton.tsx` (optional)

This replaces the no-op sidebar button. The simplest version is a `Link` to `/settings#billing`. AppSidebar is a server component, so no client code is needed for that.

### 3.9 Optional migration — subscription period end

To show "Renews on Nov 1" or "Pro until Nov 1 (canceled)" in the Billing card without calling Stripe on every settings render:

```prisma
model User {
  ...
  stripeCurrentPeriodEnd DateTime?
  stripeCancelAtPeriodEnd Boolean @default(false)
}
```

Create it with `npx prisma migrate dev --name add_stripe_period_fields` (never `db push`). Populate it in `syncSubscription`:

```ts
const periodEnd = subscription.items.data[0]?.current_period_end; // on the item, not the sub
stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
stripeCancelAtPeriodEnd: subscription.cancel_at_period_end,
```

This is optional for v1. Without it, the Billing card simply says "Manage subscription", and the portal shows the dates.

---

## 4. Files to Modify

| File | Change |
|---|---|
| `package.json` | `npm install stripe` (v23.x) |
| `.env.example` | Merge the two Stripe blocks into one: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`, and `BILLING_ENFORCED` (default `"false"`). `STRIPE_PUBLISHABLE_KEY` is **not needed** because hosted Checkout uses no Stripe.js; drop it or leave it commented |
| `src/actions/items.ts` | In `createItem`, after resolving `type`, call `canCreateItem(session.user.id, type.name)` and return `{ success: false, error }` if it isn't allowed |
| `src/app/api/collections/route.ts` | Before `createCollection`, call `canCreateCollection(session.user.id)` and return **403** with the error if it isn't allowed |
| `src/app/api/upload/route.ts` | After the auth check, call `canUseProFeature(session.user.id, "File uploads")` and return **403** if it isn't allowed |
| `src/actions/profile.ts` → `deleteAccount` | **Before** `prisma.user.delete`, if the user has a `stripeSubscriptionId`, call `getStripe().subscriptions.cancel(id)` in try/catch (log and continue). Otherwise a deleted user keeps getting billed. Optionally also delete the Stripe customer. Update the `DeleteAccountDialog` copy to say the subscription is canceled immediately |
| `src/app/settings/page.tsx` | Accept `searchParams`, run `syncCheckoutSession` on success, read the billing fields, render `<BillingCard>` between the Editor and Account cards with `id="billing"`. Update the subtitle to mention billing |
| `src/lib/db/user.ts` | Add `hasBillingAccount: boolean` (from `stripeCustomerId !== null`) to `CurrentUser`, so the settings page doesn't need a second query |
| `src/components/dashboard/AppSidebar.tsx` | Make "Upgrade to Pro" a link to `/settings#billing`; import `PRO_ITEM_TYPE_NAMES` from `@/lib/plan` |
| `src/components/homepage/PricingPlans.tsx` | Pro CTA → `/register?plan=pro` (signed out) or `/settings#billing`. Free CTA → `/register` |
| `src/proxy.ts` | **No change.** `/api/webhooks/stripe` is already outside the matcher |
| `src/auth.ts` / `next-auth.d.ts` | **No change** (see §1.5) |
| `prisma/schema.prisma` | **No change** unless you adopt §3.9 |

### Tests to add (per coding standards)

- `src/lib/plan.test.ts`: enforcement off → always allowed; Pro → allowed; free at 49/50 items; File/Image blocked for free; 2/3 collections.
- `src/lib/stripe.test.ts`: `isProStatus` truth table; `getPriceId` throws when the env var is missing.
- `src/actions/billing.test.ts`: mock `@/auth`, `@/lib/prisma`, `@/lib/stripe`. Cover unauthorized; invalid interval; already Pro; reusing an existing customer; creating a customer + conditional write; portal with no customer → error.
- `src/actions/items.test.ts`: add cases for the item limit and Pro-only types.
- `src/actions/profile.test.ts`: `deleteAccount` cancels the subscription before deleting, and still deletes if the cancel throws.

---

## 5. Stripe Dashboard Setup

Do everything in **Test mode** first. Repeat it in Live mode before launch; products, prices, webhooks, and portal config are per-mode.

1. **Product:** Product catalog → Add product → Name "DevStash Pro", description "Unlimited items & collections, file uploads, AI features, export".
2. **Prices** on that product:
   - Recurring, **$8.00 USD / month** → copy the ID into `STRIPE_PRICE_ID_MONTHLY`
   - Recurring, **$72.00 USD / year** → copy the ID into `STRIPE_PRICE_ID_YEARLY`
3. **API key:** Developers → API keys → Secret key → `STRIPE_SECRET_KEY` (`sk_test_…`). A restricted key works too if scoped to Customers, Checkout Sessions, Subscriptions, and Billing Portal write.
4. **Customer portal:** Settings → Billing → Customer portal:
   - Allow: update payment method, view invoice history, cancel subscription (at **end of period**)
   - Allow switching plans between the monthly and yearly prices of DevStash Pro
   - Set the default return URL to `{APP_URL}/settings`
   - **Save.** `billingPortal.sessions.create` errors until the portal is configured.
5. **Revenue recovery:** Settings → Billing → Subscriptions and emails → smart retries. Set the outcome after all retries fail to **cancel the subscription**, so `customer.subscription.deleted` fires and Pro is revoked.
6. **Webhook endpoint (prod/preview):** Developers → Webhooks → Add endpoint → `https://<APP_URL>/api/webhooks/stripe`. Events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

   Copy the signing secret into `STRIPE_WEBHOOK_SECRET` for that environment.
7. **Local dev:** install the Stripe CLI, then:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Put the printed `whsec_…` into `.env` as `STRIPE_WEBHOOK_SECRET`. It differs from the Dashboard endpoint's secret.
8. **Branding (optional):** Settings → Branding: logo and colors for Checkout and the portal.

---

## 6. Testing Checklist

Use test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0341` (attaches, then fails on charge), `4000 0025 0000 3155` (3DS). Use any future expiry and any CVC.

**Checkout**
- [ ] Free user → Settings → Billing → Monthly → Upgrade → Stripe Checkout shows $8/month
- [ ] Yearly toggle → Checkout shows $72/year
- [ ] Complete payment → redirected to `/settings?checkout=success`, the success toast shows, and the card shows Pro **without a manual reload**
- [ ] DB: `isPro = true`, `stripeCustomerId` and `stripeSubscriptionId` set (check via Neon MCP on the **development** branch)
- [ ] Sidebar shows "Pro plan"; the "Upgrade" button and the File/Image PRO badges are gone
- [ ] Profile shows the PRO badge
- [ ] Cancel on the Checkout page → `?checkout=canceled`, user stays Free
- [ ] Clicking Upgrade twice quickly creates only one Stripe customer
- [ ] Pro user can't start a second checkout ("already have Pro")

**Webhooks**
- [ ] With `stripe listen` stopped, checkout still flips Pro via the return-URL sync
- [ ] `stripe trigger customer.subscription.deleted` (or cancel in Dashboard) → `isPro = false`, `stripeSubscriptionId = null`
- [ ] A bad signature (e.g. `curl -X POST` with no header) → 400
- [ ] Resending the same event from the Dashboard → no error, state unchanged (idempotent)

**Portal**
- [ ] Pro user → Manage subscription → portal opens; Return goes back to `/settings`
- [ ] Switching monthly → yearly in the portal → `subscription.updated`, still Pro
- [ ] Cancel at period end → still Pro (status `active`, `cancel_at_period_end`); advance a **test clock** past the period end → becomes Free
- [ ] Update the card to `4000 0000 0000 0341` and advance the test clock → `past_due` (still Pro) → after retries, canceled → Free

**Feature gating** (with `BILLING_ENFORCED=true`)
- [ ] Free user with 50 items → creating one more shows the limit toast; nothing created
- [ ] Free user with 3 collections → creating one more shows a 403 + toast
- [ ] Free user → File/Image item creation is blocked, and `POST /api/upload` returns 403
- [ ] Pro user → no limits
- [ ] Downgraded user with 60 items can view, edit, and delete existing items but can't create new ones
- [ ] With `BILLING_ENFORCED` unset → everything unlocked (current dev behavior)

**Account deletion**
- [ ] Pro user deletes account → the Stripe subscription is canceled (Dashboard shows canceled), and the user row is deleted

**Build / quality**
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes **with `STRIPE_SECRET_KEY` unset** (proves lazy init)

---

## 7. Implementation Order

1. **Setup:** branch `feature/stripe-billing`, `npm install stripe`, clean up `.env.example`, Stripe Dashboard test-mode steps 1–4 and 7.
2. **Core libs:** `src/lib/stripe.ts`, `src/lib/plan.ts` (+ tests). Point `AppSidebar` at `PRO_ITEM_TYPE_NAMES`.
3. **DB sync:** `src/lib/db/billing.ts` (`syncSubscription`, `clearSubscription`, `getBillingUser`, `syncCheckoutSession`).
4. **Webhook route:** `src/app/api/webhooks/stripe/route.ts`. Verify with `stripe listen` + `stripe trigger checkout.session.completed`.
5. **Actions:** `src/actions/billing.ts` (+ tests).
6. **UI:** `BillingCard`, settings page wiring (`searchParams`, return sync, `#billing` anchor), `getCurrentUser` `hasBillingAccount`, sidebar and homepage CTAs.
7. **End-to-end test** of checkout → Pro → portal → cancel in the browser.
8. **Feature gates:** `createItem`, `/api/collections`, `/api/upload` (+ test updates). Verify with `BILLING_ENFORCED=true`.
9. **Account deletion:** cancel the subscription in `deleteAccount` (+ test).
10. **(Optional)** §3.9 migration for period-end display.
11. **Verify:** test, lint, `npm run build`, then commit with user approval.
12. **Launch:** repeat Dashboard steps 1–6 in Live mode, set prod env vars, add the prod webhook endpoint, set `BILLING_ENFORCED=true` in production.

---

## 8. Open Questions

- **`past_due` access:** the plan keeps Pro during payment retries. Revoke immediately instead? (Change `PRO_STATUSES`.)
- **Trial period:** add `subscription_data.trial_period_days` to checkout? Not in the spec.
- **Homepage CTA for signed-in users:** link to settings, or start checkout directly from the pricing card?
- **Enforcement flag:** an env var (`BILLING_ENFORCED`) versus a code constant. The env var lets prod enforce while dev stays open.
