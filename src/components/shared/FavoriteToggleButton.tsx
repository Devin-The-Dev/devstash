"use client";

import type { MouseEvent } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { cn } from "@/lib/utils";

type ToggleAction = Parameters<typeof useFavoriteToggle>[1];

// Star toggle for use inside clickable cards: stops click propagation so
// toggling never also opens the drawer or navigates. (Keyboard activation is
// handled by the card's own onKeyDown ignoring events from nested controls.)
export function FavoriteToggleButton({
  isFavorite: serverIsFavorite,
  toggleAction,
  className,
}: {
  isFavorite: boolean;
  toggleAction: ToggleAction;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavoriteToggle(serverIsFavorite, toggleAction);

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    toggle();
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Favorite"
      aria-pressed={isFavorite}
      className={cn("-m-1 text-muted-foreground hover:text-foreground", className)}
      onClick={handleClick}
    >
      <Star className={cn("size-3.5", isFavorite && "fill-yellow-400 text-yellow-400")} />
    </Button>
  );
}
