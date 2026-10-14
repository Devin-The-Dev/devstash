import { unstable_rethrow } from "next/navigation";
import type * as z from "zod";
import { auth } from "@/auth";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export const GENERIC_ACTION_ERROR = "Something went wrong. Please try again.";

/**
 * Runs a Server Action body and turns unexpected throws (Prisma, R2, network)
 * into `{ success: false }` so the client can show a toast instead of
 * receiving a thrown error. Next.js control-flow errors (redirect, notFound)
 * are rethrown untouched.
 */
export async function runAction<T>(
  name: string,
  body: () => Promise<ActionResult<T>>,
  fallbackError: string = GENERIC_ACTION_ERROR,
): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (error) {
    unstable_rethrow(error);
    console.error(`${name} failed:`, error);
    return { success: false, error: fallbackError };
  }
}

/** `runAction` for signed-in users: returns "Unauthorized" without a session. */
export async function runUserAction<T>(
  name: string,
  body: (userId: string) => Promise<ActionResult<T>>,
  fallbackError?: string,
): Promise<ActionResult<T>> {
  return runAction(
    name,
    async () => {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
      }
      return body(session.user.id);
    },
    fallbackError,
  );
}

/** The first Zod issue's message, for showing a failed `safeParse` to the user. */
export function firstIssue(error: z.ZodError, fallback = "Invalid input"): string {
  return error.issues[0]?.message ?? fallback;
}
