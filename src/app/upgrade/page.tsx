import Link from "next/link";
import { redirect } from "next/navigation";
import { UpgradePlans } from "@/components/upgrade/UpgradePlans";
import { getCurrentUser } from "@/lib/db/user";

export default async function UpgradePage() {
  const currentUser = await getCurrentUser();
  if (currentUser.isPro) {
    redirect("/settings#billing");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Upgrade to DevStash Pro</h1>
        <p className="text-muted-foreground">
          Unlimited items and collections, file and image uploads, and AI features. Cancel anytime.
        </p>
      </div>

      <UpgradePlans />

      <Link href="/dashboard" className="inline-block text-sm text-muted-foreground hover:text-foreground">
        Back to dashboard
      </Link>
    </div>
  );
}
