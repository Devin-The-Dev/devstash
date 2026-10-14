import type { LucideIcon } from "lucide-react";

// Shared row layout for the /favorites list: icon · title · type badge · date.
// The badge and meta drop out below `sm` so titles get the full row on mobile.
export function FavoriteRowContent({
  icon: Icon,
  color,
  title,
  typeLabel,
  meta,
  date,
}: {
  icon: LucideIcon;
  color?: string;
  title: string;
  typeLabel: string;
  meta?: string;
  date: string;
}) {
  return (
    <>
      <Icon className="size-4 shrink-0" style={color ? { color } : undefined} />
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{title}</span>
      {meta && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{meta}</span>}
      <span
        className="hidden w-20 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-center text-xs text-muted-foreground sm:inline"
        style={
          color
            ? { color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }
            : undefined
        }
      >
        {typeLabel}
      </span>
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">{date}</span>
    </>
  );
}

export const favoriteRowClassName =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50";
