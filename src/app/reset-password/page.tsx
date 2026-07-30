import Link from "next/link";
import { XCircle, MailWarning } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { checkPasswordResetToken } from "@/lib/db/verification";

const ERROR_CONTENT = {
  expired: {
    icon: MailWarning,
    title: "Link expired",
    description: "This password reset link has expired. Request a new one.",
  },
  invalid: {
    icon: XCircle,
    title: "Invalid link",
    description: "This password reset link is invalid or has already been used.",
  },
} as const;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const status = token ? await checkPasswordResetToken(token) : "invalid";

  if (status !== "valid") {
    const { icon: Icon, title, description } = ERROR_CONTENT[status];
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <Icon className="mb-2 size-10 text-muted-foreground" />
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password" className={buttonVariants({ className: "w-full" })}>
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token as string} />
        </CardContent>
      </Card>
    </div>
  );
}
