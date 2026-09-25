import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { getCurrentUser } from "@/lib/db/user";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your password and account.</p>
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
