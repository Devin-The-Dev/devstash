"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { signInSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { findResetEligibleUser } from "@/lib/db/user";
import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/db/verification";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";
import { getBaseUrl } from "@/lib/url";
import {
  checkRateLimit,
  forgotPasswordRateLimit,
  getClientIp,
  loginRateLimit,
  rateLimitMessage,
  resetPasswordRateLimit,
} from "@/lib/rate-limit";

export type SignInState = { error: string } | undefined;

export async function signInWithCredentials(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(loginRateLimit, `${ip}:${parsed.data.email}`);

  if (!rateLimit.success) {
    return { error: rateLimitMessage(rateLimit.reset) };
  }

  const callbackUrl = formData.get("callbackUrl")?.toString() || "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
}

export async function signInWithGitHub(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl")?.toString() || "/dashboard";
  await signIn("github", { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}

export type ForgotPasswordState = { error: string } | { success: true } | undefined;

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(forgotPasswordRateLimit, ip);

  if (!rateLimit.success) {
    return { error: rateLimitMessage(rateLimit.reset) };
  }

  const { email } = parsed.data;
  const user = await findResetEligibleUser(email);

  if (user) {
    try {
      const token = await createPasswordResetToken(email);
      const resetUrl = `${await getBaseUrl()}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, user.name, resetUrl);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  return { success: true };
}

export type ResetPasswordState = { error: string } | undefined;

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = formData.get("token")?.toString();

  if (!token) {
    return { error: "Invalid or missing reset token" };
  }

  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(resetPasswordRateLimit, ip);

  if (!rateLimit.success) {
    return { error: rateLimitMessage(rateLimit.reset) };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  const result = await consumePasswordResetToken(token, hashedPassword);

  if (result !== "success") {
    return {
      error:
        result === "expired"
          ? "This reset link has expired. Request a new one."
          : "This reset link is invalid or has already been used.",
    };
  }

  redirect("/sign-in?reset=success");
}
