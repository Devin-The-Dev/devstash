import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import { EditorPreferencesProvider } from "@/components/editor/EditorPreferencesProvider";
import { BillingCard } from "@/components/settings/BillingCard";
import { auth } from "@/auth";
import { syncCheckoutSession } from "@/lib/db/billing";
import { getCurrentUser } from "@/lib/db/user";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const { checkout, session_id: sessionId } = await searchParams;

  // Sync from the checkout session before getCurrentUser() reads isPro, so the
  // page shows Pro even if the webhook hasn't landed yet (or stripe listen isn't
  // running locally). getCurrentUser() is cache()d, so the ID comes from auth().
  if (checkout === "success" && sessionId) {
    const session = await auth();
    if (session?.user?.id) {
      try {
        await syncCheckoutSession(session.user.id, sessionId);
      } catch (error) {
        console.error("Checkout return sync failed; relying on the webhook", error);
      }
    }
  }

  const currentUser = await getCurrentUser();
  const checkoutStatus = checkout === "success" || checkout === "canceled" ? checkout : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your editor preferences, billing, password, and account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor preferences</CardTitle>
          <CardDescription>Changes save automatically and apply to all code editors.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditorPreferencesProvider initialPreferences={currentUser.editorPreferences}>
            <EditorPreferencesForm />
          </EditorPreferencesProvider>
        </CardContent>
      </Card>

      <div id="billing" className="scroll-mt-6">
        <BillingCard
          isPro={currentUser.isPro}
          hasBillingAccount={currentUser.hasBillingAccount}
          checkoutStatus={checkoutStatus}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account actions</CardTitle>
          <CardDescription>Manage your password and account data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentUser.hasPassword && (
            <>
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Change password</h3>
                <ChangePasswordForm />
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Delete account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all of your data. This cannot be undone.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>

      <Link href="/dashboard" className="text-sm text-foreground underline underline-offset-4">
        Back to dashboard
      </Link>
    </div>
  );
}
