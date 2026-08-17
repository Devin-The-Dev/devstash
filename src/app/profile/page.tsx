import Link from "next/link";
import { Boxes, FolderKanban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { ItemTypeBreakdown } from "@/components/profile/ItemTypeBreakdown";
import { getCurrentUser } from "@/lib/db/user";
import { getProfileStats } from "@/lib/db/profile";
import { formatDate } from "@/lib/format";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  const stats = await getProfileStats(currentUser.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Manage your account details and data.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <UserAvatar name={currentUser.name} image={currentUser.image} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{currentUser.name}</p>
              {currentUser.isPro && <Badge variant="secondary">PRO</Badge>}
            </div>
            <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
            <p className="text-xs text-muted-foreground">
              Joined {formatDate(currentUser.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-normal text-muted-foreground">Items</CardTitle>
            <Boxes className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{stats.totalItems}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-sm font-normal text-muted-foreground">
              Collections
            </CardTitle>
            <FolderKanban className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">{stats.totalCollections}</span>
          </CardContent>
        </Card>
      </div>

      <ItemTypeBreakdown breakdown={stats.breakdown} />

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
