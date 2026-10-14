"use client";

import { Crown, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PRO_REQUIRED_MESSAGE = "AI features require Pro subscription";

/**
 * Sparkles icon button for an AI action in an editor header. Free users get a
 * Crown with a "requires Pro" tooltip instead.
 */
export function AiFeatureButton({
  label,
  pendingLabel,
  isPro,
  isPending,
  onClick,
}: {
  label: string;
  pendingLabel: string;
  isPro: boolean;
  isPending: boolean;
  onClick: () => void;
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
              aria-label={`${label}. ${PRO_REQUIRED_MESSAGE}`}
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
      aria-label={isPending ? pendingLabel : label}
      title={label}
      onClick={onClick}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
    </Button>
  );
}
