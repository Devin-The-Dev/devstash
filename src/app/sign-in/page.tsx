import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { GitHubSignIn } from "@/components/auth/GitHubSignIn";

const RESET_NOTICES: Record<string, string> = {
  success: "Your password has been reset. Sign in below.",
  changed: "Your password has been changed. Sign in again with your new password.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reset?: string }>;
}) {
  const { callbackUrl, reset } = await searchParams;

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign in to DevStash</CardTitle>
          <CardDescription>Welcome back. Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInForm callbackUrl={callbackUrl} notice={reset ? RESET_NOTICES[reset] : undefined} />

          <GitHubSignIn label="Sign in with GitHub" callbackUrl={callbackUrl} />

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
