import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { createVerificationToken } from "@/lib/db/verification";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";
import { getBaseUrl } from "@/lib/url";

export async function POST(request: Request) {
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true },
    });

    let emailSent = true;
    try {
      const token = await createVerificationToken(email);
      const verifyUrl = `${await getBaseUrl()}/verify-email?token=${token}`;
      await sendVerificationEmail(email, name, verifyUrl);
    } catch (error) {
      emailSent = false;
      console.error("Failed to send verification email:", error);
    }

    return NextResponse.json({ success: true, data: { ...user, emailSent } }, { status: 201 });
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
