"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Reveal } from "@/components/homepage/Reveal";
import { homeButton } from "@/components/homepage/home-button";
import { cn } from "@/lib/utils";

const PRO_PRICING = {
  monthly: { price: "$8", period: "/month", note: "Billed monthly, cancel anytime" },
  yearly: { price: "$72", period: "/year", note: "Just $6/month, billed annually" },
};

interface PlanFeature {
  label: string;
  included: boolean;
}

const FREE_FEATURES: PlanFeature[] = [
  { label: "50 items", included: true },
  { label: "3 collections", included: true },
  { label: "Snippets, prompts, commands, notes & links", included: true },
  { label: "Instant search", included: true },
  { label: "File & image uploads", included: false },
  { label: "AI features", included: false },
];

const PRO_FEATURES: PlanFeature[] = [
  { label: "Unlimited items & collections", included: true },
  { label: "File & image uploads", included: true },
  { label: "AI tagging, summaries & explanations", included: true },
  { label: "Export as JSON or ZIP", included: true },
  { label: "Priority support", included: true },
];

function FeatureList({ features }: { features: PlanFeature[] }) {
  return (
    <ul className="mt-7 grid gap-3 text-[15px]">
      {features.map(({ label, included }) => (
        <li key={label} className={cn("flex items-start gap-2.5", !included && "text-home-faint")}>
          {included ? (
            <Check className="mt-1 size-4 shrink-0 text-home-note [stroke-width:2.6]" aria-hidden="true" />
          ) : (
            <X className="mt-1 size-4 shrink-0 [stroke-width:2.6]" aria-hidden="true" />
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

interface PlanCardProps {
  name: string;
  description: string;
  price: string;
  period: string;
  note: string;
  cta: string;
  features: PlanFeature[];
  featured?: boolean;
}

function PlanCard({ name, description, price, period, note, cta, features, featured }: PlanCardProps) {
  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-[18px] border border-home-border bg-home-surface p-6 md:p-8",
        featured &&
          "border-home-brand/40 bg-[radial-gradient(400px_200px_at_50%_0%,rgb(63_114_198/0.08),transparent_70%)] shadow-[0_30px_80px_-40px_rgb(63_114_198/0.3)]",
      )}
    >
      {featured && (
        <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 rounded-full bg-linear-90 from-home-brand to-home-brand-2 px-3.5 py-1 text-xs font-bold whitespace-nowrap text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-xl leading-[1.15] font-bold tracking-tight">{name}</h3>
      <p className="mt-1.5 text-sm text-home-muted">{description}</p>
      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-5xl leading-none font-extrabold tracking-[-0.03em]">{price}</span>
        <span className="text-home-muted">{period}</span>
      </p>
      <p className="mt-2 mb-6 min-h-[1.6em] text-[13px] text-home-faint">{note}</p>
      <Link
        href="/register"
        className={homeButton({ variant: featured ? "primary" : "outline", className: "w-full" })}
      >
        {cta}
      </Link>
      <FeatureList features={features} />
    </article>
  );
}

function BillingToggle({ yearly, onChange }: { yearly: boolean; onChange: (yearly: boolean) => void }) {
  const label = "cursor-pointer text-home-faint transition-colors data-[active=true]:text-zinc-100";

  return (
    <div className="mb-10 flex items-center justify-center gap-3.5 text-[15px]">
      <span className={label} data-active={!yearly} onClick={() => onChange(false)}>
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={yearly}
        aria-label="Bill yearly"
        onClick={() => onChange(!yearly)}
        className="relative h-[26px] w-12 cursor-pointer rounded-full border border-home-border-strong bg-home-surface-2 transition-colors aria-checked:border-home-brand aria-checked:bg-home-brand"
      >
        <span
          className={cn(
            "absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white transition-transform",
            yearly && "translate-x-[22px]",
          )}
        />
      </button>
      <span className={label} data-active={yearly} onClick={() => onChange(true)}>
        Yearly{" "}
        <span className="ml-1 rounded-full bg-home-note/14 px-2 py-0.5 text-xs font-semibold text-green-400">
          Save 25%
        </span>
      </span>
    </div>
  );
}

export function PricingPlans() {
  const [yearly, setYearly] = useState(false);
  const pro = yearly ? PRO_PRICING.yearly : PRO_PRICING.monthly;

  return (
    <>
      <Reveal>
        <BillingToggle yearly={yearly} onChange={setYearly} />
      </Reveal>
      <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-6 md:grid-cols-2">
        <Reveal>
          <PlanCard
            name="Free"
            description="For getting your essentials in one place."
            price="$0"
            period="/forever"
            note="No credit card required"
            cta="Get started"
            features={FREE_FEATURES}
          />
        </Reveal>
        <Reveal delay={1}>
          <PlanCard
            name="Pro"
            description="For developers who save everything."
            price={pro.price}
            period={pro.period}
            note={pro.note}
            cta="Upgrade to Pro"
            features={PRO_FEATURES}
            featured
          />
        </Reveal>
      </div>
    </>
  );
}
