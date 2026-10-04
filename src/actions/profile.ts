"use server";

import bcrypt from "bcryptjs";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { GENERIC_ACTION_ERROR } from "@/lib/action-result";
import { changePasswordRateLimit, checkRateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { changePasswordSchema, deleteAccountSchema } from "@/lib/validations/profile";

// No success state: a successful change signs out and redirects to sign-in.
export type ChangePasswordState = { error: string } | undefined;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You need to be signed in to change your password" };
  }
  const userId = session.user.id;

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Keyed on the user so a hijacked session can't guess the current password freely.
  const rateLimit = await checkRateLimit(changePasswordRateLimit, userId);
  if (!rateLimit.success) {
    return { error: rateLimitMessage(rateLimit.reset) };
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { password: true },
    });

    if (!user.password) {
      return { error: "This account signs in with GitHub and has no password to change" };
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!isValid) {
      return { error: "Current password is incorrect" };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
    // Bumping sessionVersion invalidates every existing session, this one included.
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, sessionVersion: { increment: 1 } },
    });
  } catch (error) {
    console.error("changePassword failed:", error);
    return { error: GENERIC_ACTION_ERROR };
  }

  await signOut({ redirectTo: "/sign-in?reset=changed" });
}

export type DeleteAccountState = { error: string } | undefined;

export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You need to be signed in to delete your account" };
  }
  const userId = session.user.id;

  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Type DELETE to confirm" };
  }

  try {
    const { stripeSubscriptionId } = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeSubscriptionId: true },
    });

    // Cancel before deleting so a Pro user isn't billed for a deleted account.
    // A Stripe failure shouldn't block deletion; log it for manual cleanup.
    if (stripeSubscriptionId) {
      try {
        await getStripe().subscriptions.cancel(stripeSubscriptionId);
      } catch (error) {
        console.error(`Failed to cancel Stripe subscription ${stripeSubscriptionId} on account deletion`, error);
      }
    }

    await prisma.user.delete({ where: { id: userId } });
  } catch (error) {
    console.error("deleteAccount failed:", error);
    return { error: GENERIC_ACTION_ERROR };
  }

  await signOut({ redirectTo: "/" });
}
