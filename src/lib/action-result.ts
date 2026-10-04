import { unstable_rethrow } from "next/navigation";

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
): Promise<ActionResult<T>> {
  try {
    return await body();
  } catch (error) {
    unstable_rethrow(error);
    console.error(`${name} failed:`, error);
    return { success: false, error: GENERIC_ACTION_ERROR };
  }
}
