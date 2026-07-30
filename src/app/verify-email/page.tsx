import Link from "next/link";
import { CheckCircle2, XCircle, MailWarning } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { consumeVerificationToken } from "@/lib/db/verification";

const CONTENT = {
  success: {
    icon: CheckCircle2,
    title: "Email verified",
    description: "Your email address has been confirmed. You're all set.",
  },
  expired: {
    icon: MailWarning,
    title: "Link expired",
    description: "This verification link has expired. Register again to get a new one.",
  },
  invalid: {
    icon: XCircle,
    title: "Invalid link",
    description: "This verification link is invalid or has already been used.",
  },
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await consumeVerificationToken(token) : "invalid";
  const { icon: Icon, title, description } = CONTENT[result];

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Icon className="mb-2 size-10 text-muted-foreground" />
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/sign-in" className={buttonVariants({ className: "w-full" })}>
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
