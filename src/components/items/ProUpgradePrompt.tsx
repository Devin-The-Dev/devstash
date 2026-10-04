import Link from "next/link";
import { Box, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { itemTypeIconMap } from "@/lib/item-type-icons";
import { PRO_PRICING } from "@/lib/plans";
import type { ItemTypeSummary } from "@/lib/db/items";

const PRO_FEATURES = [
  "File and image uploads",
  "Unlimited items and collections",
  "AI features",
];

export function ProUpgradePrompt({ type }: { type: ItemTypeSummary }) {
  const Icon = itemTypeIconMap[type.icon] ?? Box;
  const typeLabel = `${type.name.toLowerCase()}s`;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border p-8 text-center">
        <div
          className="mx-auto flex size-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${type.color}1a` }}
        >
          <Icon className="size-6" style={{ color: type.color }} />
        </div>

        <div className="space-y-2">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-semibold">
            {type.name}s <Badge variant="secondary">PRO</Badge>
          </h1>
          <p className="text-muted-foreground">
            Storing {typeLabel} is a Pro feature. Upgrade to upload and manage {typeLabel} in
            DevStash.
          </p>
        </div>

        <ul className="space-y-2 text-left text-sm">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="size-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <Link href="/upgrade"className={buttonVariants({ className: "w-full" })}>
            Upgrade to Pro
          </Link>
          <p className="text-xs text-muted-foreground">
            {PRO_PRICING.monthly}/month or {PRO_PRICING.yearly}/year
          </p>
        </div>
      </div>
    </main>
  );
}
