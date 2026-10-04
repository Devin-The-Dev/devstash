import type { NextConfig } from "next";

// A full script-src CSP would need per-request nonces (see the Next.js CSP
// guide) and allowances for Monaco's CDN and Stripe. These directives are
// safe without that: no framing, no plugins, no <base> hijacking.
const contentSecurityPolicy = ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
