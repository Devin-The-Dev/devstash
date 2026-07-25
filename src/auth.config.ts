import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    GitHub,
    Credentials({
      credentials: { email: {}, password: {} },
      // Placeholder only — never reached at runtime. auth.ts overrides this
      // provider with the real bcrypt-backed implementation, since bcrypt
      // and Prisma aren't Edge-compatible and this config is imported by
      // the Edge proxy (src/proxy.ts).
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;
