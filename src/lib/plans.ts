// Plain constants with no server imports, so client components can use them.
// Gating logic that reads the DB lives in usage-limits.ts.
export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
export const PRO_ITEM_TYPE_NAMES: ReadonlySet<string> = new Set(["File", "Image"]);

export const PRO_PRICING = { monthly: "$8", yearly: "$72" } as const;

export const PRO_PLAN_COPY = {
  monthly: { period: "/month", note: "Billed monthly, cancel anytime" },
  yearly: { period: "/year", note: "Just $6/month, billed annually" },
} as const;

export interface PlanFeature {
  label: string;
  included: boolean;
}

export const FREE_FEATURES: PlanFeature[] = [
  { label: `${FREE_ITEM_LIMIT} items`, included: true },
  { label: `${FREE_COLLECTION_LIMIT} collections`, included: true },
  { label: "Snippets, prompts, commands, notes & links", included: true },
  { label: "Instant search", included: true },
  { label: "File & image uploads", included: false },
  { label: "AI features", included: false },
];

export const PRO_FEATURES: PlanFeature[] = [
  { label: "Unlimited items & collections", included: true },
  { label: "File & image uploads", included: true },
  { label: "AI tagging, summaries & explanations", included: true },
  { label: "Export as JSON or ZIP", included: true },
  { label: "Priority support", included: true },
];
