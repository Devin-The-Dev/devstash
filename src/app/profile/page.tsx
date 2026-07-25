import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { getCurrentUser } from "@/lib/db/user";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Profile</CardTitle>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={currentUser.name} image={currentUser.image} size="lg" />
            <div>
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
            {currentUser.isPro && <Badge variant="secondary" className="ml-auto">PRO</Badge>}
          </div>

          <Link href="/dashboard" className="text-sm text-foreground underline underline-offset-4">
            Back to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
