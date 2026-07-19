import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEMO_USER_ID } from "@/lib/constants";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: DEMO_USER_ID },
    select: { id: true, name: true, email: true, isPro: true },
  });

  return { ...user, name: user.name ?? user.email };
});
