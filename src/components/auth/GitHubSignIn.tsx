import { Button } from "@/components/ui/button";
import { signInWithGitHub } from "@/actions/auth";

// "OR" divider + GitHub OAuth button, shared by the sign-in and register pages.
export function GitHubSignIn({ label, callbackUrl }: { label: string; callbackUrl?: string }) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        OR
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={signInWithGitHub}>
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
        <Button type="submit" variant="outline" className="w-full">
          {label}
        </Button>
      </form>
    </>
  );
}
