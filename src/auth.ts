import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { signInSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp, loginEmailRateLimit, loginRateLimit } from "@/lib/rate-limit";

export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
  reset: number;

  constructor(reset: number) {
    super();
    this.reset = reset;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" && user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true },
        });
        if (dbUser && !dbUser.emailVerified) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          });
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  ...authConfig,
  // Overrides the auth.config.ts Credentials placeholder — bcrypt/Prisma
  // aren't Edge-compatible, so the real authorize logic only lives here.
  providers: [
    GitHub,
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);

          // Enforced here rather than in the sign-in action so that
          // POST /api/auth/callback/credentials can't skip it.
          const ip = await getClientIp();
          const [byIp, byEmail] = await Promise.all([
            checkRateLimit(loginRateLimit, `${ip}:${email}`),
            checkRateLimit(loginEmailRateLimit, email),
          ]);
          if (!byIp.success || !byEmail.success) {
            throw new RateLimitedError(Math.max(byIp.reset, byEmail.reset));
          }

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              password: true,
              emailVerified: true,
            },
          });

          if (!user?.password) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return null;
          }

          if (!user.emailVerified) {
            throw new EmailNotVerifiedError();
          }

          return { id: user.id, name: user.name, email: user.email, image: user.image };
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
});
