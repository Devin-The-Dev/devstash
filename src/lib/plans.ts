// Plain constants with no server imports, so client components can use them.
// Gating logic that reads the DB lives in usage-limits.ts.
export const FREE_ITEM_LIMIT = 50;
export const FREE_COLLECTION_LIMIT = 3;
export const PRO_ITEM_TYPE_NAMES: ReadonlySet<string> = new Set(["File", "Image"]);

export const PRO_PRICING = { monthly: "$8", yearly: "$72" } as const;
