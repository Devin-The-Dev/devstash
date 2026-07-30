import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("getCurrentUser() requires an authenticated session");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, isPro: true },
  });

  return { ...user, name: user.name ?? user.email };
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
