# Auth Security Review
_Last audited: 2026-08-17_
_Scope: `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts`, `src/app/api/auth/register/route.ts`, `src/actions/auth.ts`, `src/actions/profile.ts`, `src/lib/db/verification.ts`, `src/lib/db/user.ts`, `src/lib/db/profile.ts`, `src/lib/url.ts`, `src/lib/email/send-verification-email.ts`, `src/lib/email/send-password-reset-email.ts`, `src/lib/validations/auth.ts`, `src/lib/validations/profile.ts`, `src/components/auth/*`, `src/components/profile/*`, `src/app/register/page.tsx`, `src/app/verify-email/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`, `src/app/profile/page.tsx`, `prisma/schema.prisma`_

## Summary
- Critical: 2
- High: 1
- Medium: 2
- Low: 2
- Total: 7

---

## 🔴 Critical

### 1. Password reset & verification links are built from unvalidated Host headers (Host Header Injection → Password Reset Poisoning)
**File**: `src/lib/url.ts` (line 3–8), consumed by `src/actions/auth.ts` (line 73), `src/app/api/auth/register/route.ts` (line 29)
**Flow**: Password Reset, Email Verification
**Description**: `getBaseUrl()` builds the absolute origin used in emailed reset/verify links directly from the incoming request's `x-forwarded-host` or `host` header, with no allow-list check against the app's real domain(s). Both headers are attacker-controllable on any request that isn't stripped/normalized by the edge/proxy in front of the app. Since `/forgot-password` (`requestPasswordReset`) is a public, unauthenticated action that accepts an arbitrary target email, an attacker can submit a request for the **victim's** email while spoofing `Host: attacker.evil` (or `X-Forwarded-Host: attacker.evil`). The server will then email the real victim a link like `http://attacker.evil/reset-password?token=<realtoken>`. If the victim clicks it (e.g. because the attacker mirrors the reset UI), the raw, valid, single-use reset token is delivered to a server the attacker controls. The attacker can then replay that token against the real app's `resetPassword` action within the 1-hour TTL and take over the account — without ever touching the victim's mailbox or password. This is a well-documented vulnerability class ("password reset poisoning") with precedent in real-world CVEs.
**Evidence**:
```ts
// src/lib/url.ts
export async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

// src/actions/auth.ts
const resetUrl = `${await getBaseUrl()}/reset-password?token=${token}`;
await sendPasswordResetEmail(email, user.name, resetUrl);
```
**Fix**: Never derive the link origin from request headers. Use a fixed, server-configured base URL instead:
```ts
export function getBaseUrl() {
  return process.env.APP_URL ?? "http://localhost:3000"; // set APP_URL in prod env, not derived from headers
}
```
If multi-tenant/multi-domain support genuinely requires deriving the host from the request, validate it against an explicit allow-list of known production hostnames before using it, and reject/fall back to the canonical domain otherwise.

---

### 2. Pre-account takeover via unverified Credentials signup + `allowDangerousEmailAccountLinking` on GitHub
**File**: `src/auth.ts` (line 15–29, 45), `src/app/api/auth/register/route.ts` (line 10–49)
**Flow**: Email Verification, Password Hashing / Provider Config (account linking)
**Description**: Two facts combine into a full account-takeover primitive:
1. `emailVerified` is **never checked** at credentials login time (`authorize()` only checks the password; the `signIn` callback only auto-verifies for the `github` provider). This means anyone can register an account using **any email address they don't own** (e.g. `victim@company.com`) and immediately get full, functional access to the app under that identity — the unread verification email is the only signal to the real owner.
2. The GitHub provider is configured with `allowDangerousEmailAccountLinking: true`. Per Auth.js docs, this tells NextAuth to automatically link a new OAuth identity to an *existing* `User` row purely by email match, with no re-authentication of the existing account.

Chained together: an attacker registers a credentials account for `victim@company.com` with a password only they know (step 1 succeeds immediately — no verification required to use the account). Later, when the real victim signs in with "Sign in with GitHub" using their real GitHub account (which does have a verified `victim@company.com` email), NextAuth silently links the GitHub identity to the **attacker's pre-created `User` row** (step 2). The victim is now using an account the attacker still holds the password for and can log back into at any time — a textbook "pre-hijacking" attack.
**Evidence**:
```ts
// src/auth.ts — no emailVerified gate on credentials login
const isValid = await bcrypt.compare(password, user.password);
if (!isValid) return null;
return { id: user.id, name: user.name, email: user.email, image: user.image };
// (emailVerified is never read/enforced here)

providers: [
  GitHub({ allowDangerousEmailAccountLinking: true }), // links to existing user by email match
  ...
```
**Fix**: Do at least one of the following (ideally both):
- Enforce email verification before a credentials account is usable: check `emailVerified` in `authorize()` (or in the `signIn` callback for the `credentials` provider) and reject sign-in / show a "please verify your email" state until verified.
- Remove `allowDangerousEmailAccountLinking` from the GitHub provider, or only allow linking when the existing `User` row's `emailVerified` is already set (i.e. never auto-link into an unverified, attacker-controlled account).

---

## 🟠 High

### No rate limiting on any auth-sensitive action
**File**: `src/actions/auth.ts` (`signInWithCredentials` line 15, `requestPasswordReset` line 55), `src/app/api/auth/register/route.ts` (line 10), `src/actions/profile.ts` (`changePassword` line 10)
**Flow**: Rate Limiting
**Description**: No throttling, lockout, or CAPTCHA exists anywhere in the codebase (confirmed via search — no rate-limit library, no Upstash/Redis, no in-memory limiter, nothing in `src/proxy.ts`). NextAuth v5 does not provide this by default for the Credentials provider. Concretely:
- `signInWithCredentials` allows unlimited password-guessing attempts against any known email (online brute force).
- `POST /api/auth/register` allows unlimited account creation (spam/abuse, and enables mass-triggering of the Critical #2 pre-hijack scenario against many target emails at once).
- `requestPasswordReset` allows unlimited reset emails to be sent to any address (spam/harassment vector, and abuse of the third-party Resend quota).
- `changePassword` allows unlimited guesses at a logged-in user's current password (an attacker with a stolen/idle session token could brute-force the current password to fully take over credentials, e.g. to lock the real owner out by then changing the email... though email isn't user-changeable here, they could still learn the password for reuse elsewhere).
**Fix**: Add rate limiting (e.g. Upstash Ratelimit, or a simple IP+identifier sliding-window limiter backed by Redis/Neon) at minimum to: login, register, forgot-password, and change-password. Consider account lockout/backoff after N failed login attempts per email, and a cooldown between repeated forgot-password requests for the same email/IP.

---

## 🟡 Medium

### Forgot-password response has a timing side-channel that reveals account existence
**File**: `src/actions/auth.ts` (line 55–81)
**Flow**: Password Reset
**Description**: The response body/message returned to the client is identical regardless of whether the email exists (`{ success: true }` in both cases — good). However, the code only performs the token creation + outbound `sendPasswordResetEmail` (an external network call to Resend) when a matching user is found:
```ts
const user = await findResetEligibleUser(email);
if (user) {
  const token = await createPasswordResetToken(email);
  const resetUrl = `${await getBaseUrl()}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, user.name, resetUrl); // extra network round-trip only when user exists
}
return { success: true };
```
This creates a measurable response-time difference between "email exists" (DB write + external API call) and "email doesn't exist" (single DB read only), letting an attacker enumerate registered emails by timing the response.
**Fix**: Make the timing uniform — e.g. always perform a constant-cost operation regardless of branch (such as awaiting a fixed-delay no-op, or restructuring to always do a dummy async operation of similar cost in the "no user" branch), or move the email send off the request path entirely (fire-and-forget / background job) so the response returns immediately in both branches.

### Credentials accounts are fully usable without email verification
**File**: `src/auth.ts` (`authorize()`, line 46–74)
**Flow**: Email Verification
**Description**: The verification token/expiry/single-use mechanics are implemented correctly (see Passed Checks), but nothing in the login path actually checks `emailVerified` before granting a session for the `credentials` provider. This makes the verification email a notification rather than a security control — it doesn't gate access at all, undermining its purpose and directly enabling Critical Finding #2. Independent of the account-linking chain, it also means anyone can register and fully use the app under an email address they don't control (subject only to whatever the real owner notices/does with the unsolicited verification email).
**Fix**: Check `emailVerified` in `authorize()` (or a `signIn` callback scoped to the credentials provider) and reject sign-in with a clear "please verify your email" error until the user completes verification — or, if the product intentionally allows unverified use, restrict verification-gated behavior explicitly and document the tradeoff. See fix for Critical Finding #2.

---

## 🔵 Low

### Sessions are not invalidated on password change or reset
**File**: `src/auth.ts` (line 13, `session: { strategy: "jwt" }`), `src/actions/profile.ts` (`changePassword`), `src/lib/db/verification.ts` (`consumePasswordResetToken`)
**Flow**: Password Reset, Profile Page
**Description**: The app uses JWT sessions (not database sessions), so existing signed-in sessions/JWTs for a user remain valid after a password change or a password reset — there is no server-side session store to revoke. If an attacker had already obtained a valid session (e.g. via a stolen cookie) before the legitimate user reset their password, that session continues to work until natural JWT expiry.
**Fix**: Low priority defense-in-depth. Consider embedding a `passwordChangedAt`/session-version claim in the JWT and checking it against the DB value on each request (adds a DB read per request, tradeoff to weigh), or switch to database-backed sessions for this specific invalidation guarantee if the threat model warrants it.

### Email verification token is consumed on a plain GET page render
**File**: `src/app/verify-email/page.tsx` (line 25–31)
**Flow**: Email Verification
**Description**: `consumeVerificationToken(token)` (which deletes the token and marks the account verified) runs directly inside the server component during rendering of a GET request. Automated link-scanners/prefetchers (common in corporate email security gateways, some mail clients, and browser link previews) that visit the URL before the real user clicks it would silently consume and invalidate the token, and there is no "resend verification email" action in the codebase for the user to recover — they'd see "invalid or already used" with no self-service path other than re-registering (which is blocked, since the email already exists in the `User` table). Note: because of the Medium finding above, this currently has limited practical impact since verification doesn't gate login — but it is a correctness gap that would matter once verification is enforced.
**Fix**: Consider a two-step flow (a confirmation button/POST on the verify page instead of consuming on GET), and add a "resend verification email" action for users whose link was consumed/expired.

---

## Passed Checks
- ✅ Passwords hashed with bcrypt at cost factor 12 consistently across `src/app/api/auth/register/route.ts`, `src/actions/auth.ts` (`resetPassword`), and `src/actions/profile.ts` (`changePassword`)
- ✅ Password comparison uses `bcrypt.compare` (constant-time), not raw/hash equality, in both login (`src/auth.ts`) and change-password (`src/actions/profile.ts`)
- ✅ `authorize()` in `src/auth.ts` returns only `{ id, name, email, image }` — the password hash is never exposed on the user/session object
- ✅ Verification and password-reset tokens generated with `crypto.randomBytes(32).toString("hex")` (256 bits of entropy) in `src/lib/db/verification.ts` — not `Math.random()` or sequential
- ✅ Both token types have server-enforced expiration checked at redemption time (`consumeVerificationToken`, `consumePasswordResetToken`, `checkPasswordResetToken`) — 24h for verification, 1h for password reset (both reasonable windows)
- ✅ Both token types are deleted transactionally on successful use (`prisma.$transaction([...update, ...delete])`), enforcing single-use; a second use of the same token correctly returns `"invalid"`
- ✅ Reset tokens are namespaced with a `reset:` identifier prefix distinct from verification tokens sharing the same `VerificationToken` table, preventing a verification token from being reinterpreted as a reset token or vice versa
- ✅ `changePassword` and `deleteAccount` (`src/actions/profile.ts`) call `auth()` server-side and throw if no session exists, before touching the database
- ✅ All profile mutations scope Prisma writes to `session.user.id` (`where: { id: session.user.id }`) — no client-supplied user ID is ever trusted for these operations, preventing IDOR
- ✅ `changePassword` requires and verifies the current password via `bcrypt.compare` before accepting a new one
- ✅ `deleteAccount` requires a typed `"DELETE"` confirmation (Zod `z.literal`) and only ever deletes the authenticated session's own user row
- ✅ Zod schemas (`src/lib/validations/auth.ts`, `src/lib/validations/profile.ts`) validate all auth and profile inputs server-side before they reach Prisma, independent of client-side validation
- ✅ Forgot-password response content is identical (`{ success: true }`) regardless of whether the email exists, correctly avoiding content-based user enumeration (see Medium finding for the separate timing-based leak)

## Notes
- **`allowDangerousEmailAccountLinking` research**: confirmed via web search that this NextAuth v5/Auth.js flag is explicitly documented as safe only when every provider it's applied to has independently verified the email server-side. GitHub does verify emails on its end — the risk here is not GitHub's verification, but that the *credentials* provider in this app can create a `User` row with an unverified email that later becomes the link target. This is why the finding is scored Critical: it's a concrete, chainable exploit in this specific codebase, not a generic warning about the flag.
- **Registration endpoint enumeration**: `src/app/api/auth/register/route.ts` returns an explicit `"A user with this email already exists"` 409 for duplicate emails. This does reveal account existence, but this is standard, widely-accepted UX for signup forms (as opposed to login/forgot-password, where hiding existence is the norm) and was not scored as a finding — flagging it would likely be treated as a false positive by most teams. Noted here for awareness only.
- **Deployment-dependent severity of Critical #1**: the exploitability of the Host header issue depends on how the app is deployed (e.g. whether a reverse proxy/CDN in front of it strips or rewrites client-supplied `Host`/`X-Forwarded-Host` headers before they reach Next.js). Since this could not be verified from the codebase alone (no deployment/proxy config found in-repo), it is reported as a code-level finding regardless of current hosting, per the "don't derive trust from headers" best practice — the fix is cheap and removes the dependency on infrastructure-level mitigation.
- Did not find a "resend verification email" server action anywhere in `src/actions/` — flagged as a Low finding rather than assumed missing-by-design, since its absence compounds the GET-consumption issue.
