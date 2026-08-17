import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getItemTypeIcon } from "@/lib/item-type-icons";
import type { ItemTypeBreakdown as ItemTypeBreakdownEntry } from "@/lib/db/profile";

export function ItemTypeBreakdown({ breakdown }: { breakdown: ItemTypeBreakdownEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items by type</CardTitle>
        <CardDescription>How your items break down by type.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {breakdown.map(({ type, count }) => {
            const Icon = getItemTypeIcon(type.icon);
            return (
              <li
                key={type.id}
                className="flex items-center gap-2 rounded-lg border border-border p-3"
              >
                <Icon className="size-4 shrink-0" style={{ color: type.color }} />
                <span className="flex-1 truncate text-sm">{type.name}</span>
                <span className="text-sm font-medium text-muted-foreground">{count}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
