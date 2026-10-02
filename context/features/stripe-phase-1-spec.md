# Stripe Integration Phase 1 - Core Infrastructure

## Overview

Lay the groundwork for DevStash Pro billing ($8/month or $72/year): install the Stripe SDK, add the Stripe client, the usage-limits module, the billing DB helpers, and the checkout/portal server actions. Everything in this phase is covered by unit tests. Nothing here needs the Stripe CLI or a live webhook, and no gate is enforced in the app yet (that happens in Phase 2).

Full reference: `docs/stripe-integration-plan.md`.

## Requirements

- `npm install stripe` (v23.x, API version `2026-09-30.endive` pinned by the SDK; don't pass `apiVersion`)
- Clean up `.env.example`: merge the two Stripe blocks into one
- Create `src/lib/stripe.ts` (lazy client, price IDs, Pro statuses)
- Create `src/lib/usage-limits.ts` (free-plan limits and gating helpers)
- Create `src/lib/db/billing.ts` (idempotent subscription sync)
- Create `src/actions/billing.ts` (checkout and portal sessions)
- Point `AppSidebar` at the shared `PRO_ITEM_TYPE_NAMES` constant
- Unit tests for `usage-limits`, `stripe`, and `billing` actions
- No Prisma migration. `isPro`, `stripeCustomerId`, and `stripeSubscriptionId` already exist on `User`

## Environment Variables

```
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_MONTHLY=""
STRIPE_PRICE_ID_YEARLY=""
BILLING_ENFORCED="false"
```

`STRIPE_PUBLISHABLE_KEY` is not needed (hosted Checkout uses no Stripe.js). Drop it.

## Files

### `src/lib/stripe.ts`

- `getStripe()`: lazy singleton. Throws `"STRIPE_SECRET_KEY is not set"` on first use if the key is missing, so `next build` works without it
- `type BillingInterval = "monthly" | "yearly"`
- `getPriceId(interval)`: reads `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`, throws if unset
- `isProStatus(status)`: `true` for `active`, `trialing`, `past_due`; `false` otherwise

### `src/lib/usage-limits.ts`

Named `plan.ts` in the plan doc. Same contents:

- Constants: `FREE_ITEM_LIMIT = 50`, `FREE_COLLECTION_LIMIT = 3`, `PRO_ITEM_TYPE_NAMES = new Set(["File", "Image"])`
- `PRO_PRICING = { monthly: "$8", yearly: "$72" }`, moved here from `PricingPlans.tsx` so homepage and settings share it
- `isBillingEnforced()`: `process.env.BILLING_ENFORCED === "true"`
- `getUserIsPro(userId)`: reads `isPro` from Prisma, defaults to `false`
- `type GateResult = { allowed: true } | { allowed: false; error: string }`
- `canCreateItem(userId, typeName)`: allowed if not enforced or Pro; blocks File/Image for free users; blocks at `count >= FREE_ITEM_LIMIT`
- `canCreateCollection(userId)`: same pattern with `FREE_COLLECTION_LIMIT`
- `canUseProFeature(userId, feature)`: allowed if not enforced or Pro; otherwise `"${feature} requires DevStash Pro"`

The count-then-create race is acceptable for a soft limit. No lock or transaction.

### `src/lib/db/billing.ts`

- `syncSubscription(subscription)`: resolves the customer ID (string or object), sets `isPro = isProStatus(status)` and `stripeSubscriptionId` (or `null` when not Pro) via `updateMany` on `stripeCustomerId`. Must be idempotent
- `clearSubscription(customerId)`: `isPro: false`, `stripeSubscriptionId: null`
- `getBillingUser(userId)`: selects `email`, `name`, `isPro`, `stripeCustomerId`, `stripeSubscriptionId`
- `syncCheckoutSession(userId, sessionId)`: retrieves the session with `expand: ["subscription"]`, returns early unless `client_reference_id === userId`, then calls `syncSubscription`. Written here, wired into the settings page in Phase 2

### `src/actions/billing.ts`

Standard action shape: local `ActionResult<T>`, auth check first, Zod `safeParse`, try/catch with `console.error` and a generic error message.

- `getOrCreateCustomerId(userId)` (internal): reuses `stripeCustomerId` if set; otherwise creates a customer with `idempotencyKey: customer-create-${userId}` and `metadata.userId`, then does a conditional `updateMany({ where: { id, stripeCustomerId: null } })`. If `count === 0`, re-reads and returns the existing ID
- `createCheckoutSession(interval)`: validates `z.enum(["monthly", "yearly"])`, rejects if already Pro, creates a `mode: "subscription"` session with `client_reference_id`, `allow_promotion_codes`, `subscription_data.metadata.userId`, and success/cancel URLs from `getBaseUrl()`:
  - success: `/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}#billing`
  - cancel: `/settings?checkout=canceled#billing`
- `createPortalSession()`: errors with `"No billing account found"` if no `stripeCustomerId`; return URL `/settings#billing`
- Both return `{ success: true, data: { url } }`. The client redirects with `window.location.assign`. Don't call `redirect()` in the action

### `src/components/dashboard/AppSidebar.tsx`

Replace the local `proItemTypeNames` set with `PRO_ITEM_TYPE_NAMES` from `@/lib/usage-limits`. No other change in this phase.

## Unit Tests

Vitest, colocated `*.test.ts`. Mock `@/auth`, `@/lib/prisma`, and `@/lib/stripe` / `stripe` with `vi.hoisted` + `vi.mock`, like the existing tests. Stub env vars with `vi.stubEnv` and reset in `afterEach`.

### `src/lib/usage-limits.test.ts`

`isBillingEnforced`
- `"true"` → enforced; unset, `"false"`, or any other value → not enforced

`getUserIsPro`
- Returns the row's `isPro`; returns `false` when the user row is missing

`canCreateItem`
- Enforcement off → allowed, and Prisma isn't queried
- Pro user → allowed for any type, at any count (no count query)
- Free user, `Snippet` at 49 items → allowed
- Free user, `Snippet` at 50 items → blocked with the item-limit message
- Free user, `File` and `Image` → blocked with `"<Type> items require DevStash Pro"` (no count query)
- `count` is scoped to `{ where: { userId } }`

`canCreateCollection`
- Enforcement off → allowed
- Pro user → allowed
- Free user at 2 collections → allowed; at 3 → blocked with the collection-limit message
- `count` is scoped to `{ where: { userId } }`

`canUseProFeature`
- Enforcement off → allowed
- Pro → allowed
- Free → blocked with `"<feature> requires DevStash Pro"`

### `src/lib/stripe.test.ts`

- `isProStatus` truth table: `active`, `trialing`, `past_due` → `true`; `canceled`, `unpaid`, `incomplete`, `incomplete_expired`, `paused` → `false`
- `getPriceId` returns the right env var per interval and throws when it's unset
- `getStripe` throws when `STRIPE_SECRET_KEY` is unset, and returns the same instance on repeat calls

### `src/actions/billing.test.ts`

- `createCheckoutSession`: unauthorized; invalid interval; already Pro; reuses an existing customer (no `customers.create`); creates a customer and runs the conditional write; conditional write loses the race (`count: 0`) → uses the stored ID; missing `checkout.url` → error; Stripe throws → generic error
- Correct price ID passed per interval, and `client_reference_id` set to the user ID
- `createPortalSession`: unauthorized; no customer → `"No billing account found"`; success returns the portal URL

## Stripe Dashboard (Test Mode)

Needed before Phase 2, but can be done now (plan §5, steps 1–4):

1. Product "DevStash Pro" with two recurring prices: $8/month and $72/year → copy IDs into `.env`
2. Secret key → `STRIPE_SECRET_KEY`
3. Configure and save the Customer portal (payment method, invoices, cancel at period end, switch between monthly and yearly)

## Testing

1. `npm run test`: all new and existing tests pass
2. `npm run lint` passes
3. `npm run build` passes **with `STRIPE_SECRET_KEY` unset** (proves lazy init)
4. Dashboard sidebar still shows PRO badges on File/Image for free users

## Notes

- Branch: `feature/stripe-phase-1`
- No UI calls the new actions yet. They're exercised only by tests until Phase 2
- No JWT/session changes. Every `isPro` check reads from the DB via `getCurrentUser()` (plan §1.5)
- Stripe SDK gotchas: `current_period_end` lives on subscription items, not the subscription; an invoice's subscription is at `invoice.parent?.subscription_details?.subscription`

## References

- `docs/stripe-integration-plan.md` §3.1–3.4, §4, §5
- Stripe Checkout subscriptions: https://docs.stripe.com/billing/subscriptions/build-subscriptions
- Customer portal: https://docs.stripe.com/customer-management
