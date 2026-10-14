import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";

// Shared frame for the sign-in, register and password pages: logo linking home
// above the card, and a back link below it.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link
        href="/"
        aria-label="DevStash home"
        className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-linear-135 from-home-brand to-home-brand-2 text-white">
          <Layers className="size-[18px]" aria-hidden="true" />
        </span>
        DevStash
      </Link>

      {children}

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to home
      </Link>
    </div>
  );
}
