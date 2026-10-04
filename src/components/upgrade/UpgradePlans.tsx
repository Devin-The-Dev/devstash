"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { createCheckoutSession } from "@/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FREE_FEATURES, PRO_FEATURES, PRO_PLAN_COPY, PRO_PRICING, type PlanFeature } from "@/lib/plans";

type BillingInterval = "monthly" | "yearly";

const INTERVAL_OPTIONS: { value: BillingInterval; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function FeatureList({ features }: { features: PlanFeature[] }) {
  return (
    <ul className="space-y-2.5 text-sm">
      {features.map(({ label, included }) => (
        <li key={label} className={cn("flex items-start gap-2.5", !included && "text-muted-foreground")}>
          {included ? (
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <span>
            {label}
            {!included && <span className="sr-only"> (not included)</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

function IntervalPicker({ value, onChange }: { value: BillingInterval; onChange: (value: BillingInterval) => void }) {
  return (
    <fieldset className="grid grid-cols-2 gap-3">
      <legend className="sr-only">Billing interval</legend>
      {INTERVAL_OPTIONS.map((option) => (
        <label
          key={option.value}
          className="relative flex cursor-pointer flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring"
        >
          <input
            type="radio"
            name="interval"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm font-medium">
            {option.label}
            {option.value === "yearly" && <Badge variant="secondary">Save 25%</Badge>}
          </span>
          <span>
            <span className="text-xl font-semibold">{PRO_PRICING[option.value]}</span>
            <span className="text-sm text-muted-foreground">{PRO_PLAN_COPY[option.value].period}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function UpgradePlans() {
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [pending, startTransition] = useTransition();

  function startCheckout() {
    startTransition(async () => {
      const result = await createCheckoutSession(interval);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="flex flex-col gap-6 rounded-xl border p-6">
        <div className="space-y-1.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            Free <Badge variant="outline">Current plan</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">For getting your essentials in one place.</p>
        </div>
        <p className="flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight">$0</span>
          <span className="text-muted-foreground">/forever</span>
        </p>
        <FeatureList features={FREE_FEATURES} />
      </section>

      {/* Pro first on mobile so the upgrade button is above the fold. */}
      <section className="order-first flex flex-col gap-6 rounded-xl border border-primary/50 bg-primary/[0.03] p-6 md:order-none">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="text-sm text-muted-foreground">For developers who save everything.</p>
        </div>
        <div className="space-y-3">
          <IntervalPicker value={interval} onChange={setBillingInterval} />
          <p className="text-xs text-muted-foreground">{PRO_PLAN_COPY[interval].note}</p>
        </div>
        <Button size="lg" disabled={pending} onClick={startCheckout}>
          {pending
            ? "Redirecting..."
            : `Upgrade to Pro · ${PRO_PRICING[interval]}${PRO_PLAN_COPY[interval].period}`}
        </Button>
        <FeatureList features={PRO_FEATURES} />
      </section>
    </div>
  );
}
