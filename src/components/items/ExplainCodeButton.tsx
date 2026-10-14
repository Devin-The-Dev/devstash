"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PRO_REQUIRED_MESSAGE = "AI features require Pro subscription";

export function ExplainCodeButton({
  isPro,
  isPending,
  onExplain,
}: {
  isPro: boolean;
  isPending: boolean;
  onExplain: () => void;
}) {
  if (!isPro) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Explain code. ${PRO_REQUIRED_MESSAGE}`}
              aria-disabled
              className="text-muted-foreground"
              onClick={() => toast.error(PRO_REQUIRED_MESSAGE)}
            />
          }
        >
          <Crown className="size-4" />
        </TooltipTrigger>
        <TooltipContent>{PRO_REQUIRED_MESSAGE}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      aria-busy={isPending}
      aria-label={isPending ? "Explaining code" : "Explain code"}
      title="Explain code"
      onClick={onExplain}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
    </Button>
  );
}
