"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { signInSchema } from "@/lib/validations/auth";

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
