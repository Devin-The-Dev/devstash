import type { LucideIcon } from "lucide-react";

// Shared row layout for the /favorites list: icon · title · type badge · date.
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
      <Icon className="size-3.5 shrink-0" style={color ? { color } : undefined} />
      <span className="min-w-0 flex-1 truncate text-foreground">{title}</span>
      {meta && <span className="hidden shrink-0 text-muted-foreground sm:inline">{meta}</span>}
      <span
        className="w-20 shrink-0 rounded-sm bg-muted px-1.5 text-center text-[11px] text-muted-foreground lowercase"
        style={
          color
            ? { color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }
            : undefined
        }
      >
        {typeLabel}
      </span>
      <span className="w-20 shrink-0 text-right tabular-nums text-muted-foreground">{date}</span>
    </>
  );
}

export const favoriteRowClassName =
  "flex w-full cursor-pointer items-center gap-3 px-2 py-1.5 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50";
