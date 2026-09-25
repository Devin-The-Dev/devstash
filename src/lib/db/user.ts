import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { resolveEditorPreferences, type EditorPreferences } from "@/lib/editor-preferences";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
  hasPassword: boolean;
  createdAt: Date;
  editorPreferences: EditorPreferences;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isPro: true,
      password: true,
      createdAt: true,
      editorPreferences: true,
    },
  });

  // Session (JWT) can outlive the DB row, e.g. after a dev DB reset — treat as unauthenticated.
  if (!dbUser) {
    redirect("/sign-in");
  }

  const { password, editorPreferences, ...user } = dbUser;
  return {
    ...user,
    name: user.name ?? user.email,
    hasPassword: password !== null,
    editorPreferences: resolveEditorPreferences(editorPreferences),
  };
});

export async function findResetEligibleUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true, email: true, password: true },
  });

  if (!user?.password) {
    return null;
  }

  return { name: user.name ?? user.email };
}
