import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/db/verification";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
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

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    try {
      const token = await createVerificationToken(email);
      const verifyUrl = `${await getBaseUrl()}/verify-email?token=${token}`;
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to register user" },
      { status: 500 },
    );
  }
}
