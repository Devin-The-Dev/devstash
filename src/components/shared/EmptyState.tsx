import type { LucideIcon } from "lucide-react";

// Placeholder for list pages with nothing to show: icon, one line of text and a CTA.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-16 text-center text-muted-foreground">
      <Icon className="size-8" aria-hidden="true" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
