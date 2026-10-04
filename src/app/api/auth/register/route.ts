import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/db/verification";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { sendAccountExistsEmail } from "@/lib/email/send-account-exists-email";
import { getBaseUrl } from "@/lib/url";
import {
  checkRateLimit,
  getClientIp,
  rateLimitMessage,
  registerRateLimit,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(registerRateLimit, ip);

  if (!rateLimit.success) {
    return NextResponse.json(
      { success: false, error: rateLimitMessage(rateLimit.reset) },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rateLimit.reset)) } },
    );
  }

  try {
    const body = await request.json();
    const { name, email, password } = await registerSchema.parseAsync(body);

    // Hash up front so both branches take similar time.
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { name: true },
    });

    // Same response as a new registration, so the form doesn't reveal which
    // emails have accounts. The owner gets an email pointing to sign-in and
    // reset. The existing account is left untouched: overwriting an
    // unverified account's password would let a second registrant take it
    // over once the owner clicks a verification link. Reset is how the real
    // owner reclaims an email someone else registered.
    if (existingUser) {
      try {
        const baseUrl = getBaseUrl();
        await sendAccountExistsEmail(
          email,
          existingUser.name ?? email,
          `${baseUrl}/sign-in`,
          `${baseUrl}/forgot-password`,
        );
      } catch (error) {
        console.error("Failed to send account exists email:", error);
      }
      return NextResponse.json({ success: true }, { status: 201 });
    }

    try {
      const token = await createVerificationToken(email);
      const verifyUrl = `${getBaseUrl()}/verify-email?token=${token}`;
      await sendVerificationEmail(email, name, verifyUrl);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't send a verification email. Please try again.",
        },
        { status: 502 },
      );
    }

    try {
      await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });
    } catch (error) {
      // A concurrent registration for the same email won the race.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) {
        throw error;
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register user" },
      { status: 500 },
    );
  }
}
