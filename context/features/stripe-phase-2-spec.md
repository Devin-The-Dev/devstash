# Stripe Integration Phase 2 - Webhooks, Feature Gating & UI

## Overview

Connect the Phase 1 infrastructure to the app: a signed Stripe webhook that keeps `isPro` in sync, a return-from-checkout sync, server-side enforcement of free-plan limits, subscription cancellation on account deletion, and the billing UI (settings Billing card, sidebar and homepage CTAs). Testing this phase needs the Stripe CLI (`stripe listen` / `stripe trigger`) and test-mode checkout in the browser.

Full reference: `docs/stripe-integration-plan.md`. Requires Phase 1 to be merged (`src/lib/stripe.ts`, `src/lib/usage-limits.ts`, `src/lib/db/billing.ts`, `src/actions/billing.ts`).

## Requirements

- Create webhook route `POST /api/webhooks/stripe`
- Sync subscription state on the checkout success redirect
- Enforce limits in `createItem`, `POST /api/collections`, and `POST /api/upload`, behind `BILLING_ENFORCED`
- Cancel the Stripe subscription in `deleteAccount`
- Create `BillingCard` and wire it into the settings page
- Turn the sidebar "Upgrade to Pro" button and homepage pricing CTAs into real links
- Update tests for `items`, `collections`, and `profile` actions

## Webhook Route

`src/app/api/webhooks/stripe/route.ts`

- Read the raw body with `await request.text()` (no bodyParser config in Next 16)
- Missing `stripe-signature` header or `STRIPE_WEBHOOK_SECRET` → 400
- `stripe.webhooks.constructEvent(body, signature, secret)` fails → 400
- Handler throws → 500 so Stripe retries; success → `{ received: true }`
- `/api/*` is outside the proxy matcher, so no proxy change is needed. Security comes from the signature check

| Event | Handling |
|---|---|
| `checkout.session.completed` | If `mode === "subscription"`, retrieve the subscription and call `syncSubscription` |
| `customer.subscription.created` | `syncSubscription(event.data.object)` |
| `customer.subscription.updated` | `syncSubscription(event.data.object)` |
| `customer.subscription.deleted` | `clearSubscription(customerId)` |
| `invoice.payment_failed` | `console.warn` with invoice ID and `invoice.parent?.subscription_details?.subscription`. Status changes arrive via `subscription.updated` |
| anything else | ignore, return 200 |

All handlers go through the idempotent `syncSubscription`, so replayed or out-of-order events converge on the same state.

## Return-from-Checkout Sync

`src/app/settings/page.tsx`

- Accept `searchParams` (a `Promise` in Next 16, so await it)
- If `checkout === "success"` and `session_id` is present, call `syncCheckoutSession(user.id, sessionId)` **before** `getCurrentUser()` reads `isPro`. Wrap it in try/catch and fall back to the webhook on failure
- Covers webhook lag, and local dev when `stripe listen` isn't running
- Get the user ID via `auth()` for the sync, since `getCurrentUser()` is `cache()`d and would return the stale row

## Feature Gating

All gates are no-ops unless `BILLING_ENFORCED="true"`. Only **creation** is blocked; downgraded users keep reading, editing, and deleting existing content.

| Gate | Change | Response |
|---|---|---|
| `createItem` (`src/actions/items.ts`) | After resolving the item type, call `canCreateItem(userId, type.name)`. Covers both the item limit and File/Image types (a `fileUrl` could be sent without going through `/api/upload`) | `{ success: false, error }` |
| `POST /api/collections` | Call `canCreateCollection(userId)` before creating | **403** `{ success: false, error }` |
| `POST /api/upload` | After the auth check, call `canUseProFeature(userId, "File uploads")` | **403** `{ success: false, error }` |

`NewItemDialog` and `NewCollectionDialog` already show `result.error` via `toast.error`. Optional: add an "Upgrade" action to the toast that links to `/settings#billing`. Check that `FileUpload.tsx` surfaces a 403 message from the XHR response.

## Account Deletion

`src/actions/profile.ts` → `deleteAccount`

- **Before** `prisma.user.delete`, if the user has a `stripeSubscriptionId`, call `getStripe().subscriptions.cancel(id)` in try/catch. Log the error and continue deleting
- Update the `DeleteAccountDialog` copy: an active Pro subscription is canceled immediately

## UI Components

### `src/components/settings/BillingCard.tsx` (client)

Props: `isPro: boolean`, `hasBillingAccount: boolean`, `checkoutStatus?: "success" | "canceled"`

- **Free:** plan limits ("50 items · 3 collections"), a Monthly/Yearly toggle using `PRO_PRICING` ("$8/month" vs "$72/year — save 25%"), and an "Upgrade to Pro" button → `createCheckoutSession(interval)` → `window.location.assign(url)`
- **Pro:** "DevStash Pro" badge and a "Manage subscription" button → `createPortalSession()` → redirect. Show it only when `hasBillingAccount`
- `useTransition` for pending state; `toast.error` on failure
- `checkoutStatus === "success"` → `toast.success("Welcome to Pro!")` once on mount; `"canceled"` → neutral info toast. Strip the query params afterwards (`router.replace("/settings#billing")`) so a refresh doesn't re-toast
- shadcn `Card` matching the other settings cards

### Settings page

`src/app/settings/page.tsx`

- Render `<BillingCard>` in a wrapper with `id="billing"` between the Editor preferences and Account cards
- Update the page subtitle to mention billing

### `src/lib/db/user.ts`

Add `hasBillingAccount: boolean` (`stripeCustomerId !== null`) to `CurrentUser`, so settings doesn't need a second query.

### `src/components/dashboard/AppSidebar.tsx`

The "Upgrade to Pro" button becomes a `Link` to `/settings#billing` (`Button asChild`). AppSidebar stays a server component.

### `src/components/homepage/PricingPlans.tsx`

- Import `PRO_PRICING` from `@/lib/usage-limits` instead of the local constant
- Pro CTA → `/register?plan=pro` when signed out, `/settings#billing` when signed in
- Free CTA → `/register`

## Optional: Period-End Migration

Only if the Billing card should show "Renews on Nov 1" / "Pro until Nov 1 (canceled)". Add `stripeCurrentPeriodEnd DateTime?` and `stripeCancelAtPeriodEnd Boolean @default(false)` to `User` via `npx prisma migrate dev --name add_stripe_period_fields` (never `db push`). Populate them in `syncSubscription` from `subscription.items.data[0]?.current_period_end` and `subscription.cancel_at_period_end`. Skip for v1 unless requested.

## Unit Tests

- `src/actions/items.test.ts`: `createItem` returns the gate error and doesn't create when `canCreateItem` disallows (item limit, File/Image type); creates normally when allowed
- `src/actions/profile.test.ts`: `deleteAccount` cancels the subscription before deleting; still deletes when the cancel throws; doesn't call Stripe when there's no subscription
- Collections and upload gates live in API routes (not covered by the test setup). Verify manually

## Local Setup

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Put the printed `whsec_…` into `.env` as `STRIPE_WEBHOOK_SECRET`. It's different from the Dashboard endpoint's secret.

## Testing

Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0341` (fails on charge), `4000 0025 0000 3155` (3DS). Check DB state via Neon MCP on the **development** branch.

**Checkout**
1. Free user → Settings → Billing → Monthly → Upgrade → Checkout shows $8/month; Yearly shows $72/year
2. Complete payment → `/settings?checkout=success`, success toast, card shows Pro without a manual reload
3. DB: `isPro = true`, `stripeCustomerId` and `stripeSubscriptionId` set
4. Sidebar shows "Pro plan"; Upgrade button and File/Image PRO badges gone; profile shows the PRO badge
5. Cancel on Checkout → `?checkout=canceled`, user stays Free
6. Clicking Upgrade twice quickly creates only one Stripe customer
7. Pro user can't start a second checkout

**Webhooks**
1. `stripe trigger checkout.session.completed` → route returns 200 in the `stripe listen` output
2. With `stripe listen` stopped, checkout still flips Pro via the return-URL sync
3. Cancel the subscription in the Dashboard (or `stripe trigger customer.subscription.deleted`) → `isPro = false`, `stripeSubscriptionId = null`
4. `curl -X POST localhost:3000/api/webhooks/stripe` with no signature → 400
5. Resend the same event from the Dashboard → 200, state unchanged

**Portal**
1. Pro user → Manage subscription → portal opens; Return goes back to `/settings#billing`
2. Switch monthly → yearly → still Pro
3. Cancel at period end → still Pro; advance a test clock past period end → Free
4. Card `4000 0000 0000 0341` + test clock → `past_due` (still Pro) → after retries, canceled → Free

**Feature gating** (`BILLING_ENFORCED=true`)
1. Free user with 50 items → creating another shows the limit toast; nothing created
2. Free user with 3 collections → 403 + toast
3. Free user → File/Image creation blocked; `POST /api/upload` returns 403
4. Pro user → no limits
5. Downgraded user with 60 items can view, edit, and delete but not create
6. `BILLING_ENFORCED` unset → everything unlocked

**Account deletion**
1. Pro user deletes account → subscription shows canceled in the Dashboard; user row deleted

**Build**
1. `npm run test`, `npm run lint`, `npm run build` all pass

## Notes

- Branch: `feature/stripe-phase-2`
- Before launch: repeat the Dashboard setup in Live mode (product, prices, portal, revenue recovery set to cancel after failed retries), add the prod webhook endpoint with the five events above, set prod env vars, and set `BILLING_ENFORCED=true` in production
- Open questions (plan §8): keep Pro during `past_due`? Trial period? Homepage CTA: link to settings, or start checkout directly?

## References

- `docs/stripe-integration-plan.md` §2, §3.5–3.9, §4, §5, §6
- Next 16 route handler webhooks: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md#webhooks`
- Stripe webhooks: https://docs.stripe.com/webhooks
- Stripe CLI: https://docs.stripe.com/stripe-cli
- Test clocks: https://docs.stripe.com/billing/testing/test-clocks
