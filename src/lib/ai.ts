import { DESCRIPTION_MAX, TAG_MAX } from "@/lib/validations/items";

// Content is cut to this before it's sent to the model, to bound cost and latency.
export const AI_CONTENT_MAX = 2000;
export const MAX_SUGGESTED_TAGS = 5;

export const AI_UNAVAILABLE_ERROR = "AI features are not available right now.";
export const AI_BUSY_ERROR = "The AI service is busy. Please try again in a minute.";
export const AI_SERVICE_ERROR = "The AI service had a problem. Please try again.";
export const NO_TAGS_ERROR = "Couldn't come up with tags for this item. Try adding more content.";
export const NO_SUMMARY_ERROR = "Couldn't write a description for this item. Try adding more content.";
export const NO_EXPLANATION_ERROR = "Couldn't explain this code. Please try again.";

export function truncateForAi(text: string, max = AI_CONTENT_MAX): string {
  return text.length > max ? text.slice(0, max) : text;
}

/**
 * Cleans the model's summary for the description field: collapses whitespace,
 * strips wrapping quotes, and clamps to DESCRIPTION_MAX.
 */
export function cleanSummary(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  const unquoted = collapsed.replace(/^["'“”]+|["'“”]+$/g, "").trim();
  return unquoted.slice(0, DESCRIPTION_MAX).trim();
}

/**
 * Parses the model's JSON reply into clean tags. The model may answer with
 * `{"tags": [...]}` or a bare array, so both are accepted. Tags are trimmed,
 * lowercased, de-duplicated, and any the item already has are dropped.
 */
export function parseTagSuggestions(text: string, existingTags: string[] = []): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }

  const raw = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { tags?: unknown }).tags)
      ? (parsed as { tags: unknown[] }).tags
      : [];

  const existing = new Set(existingTags.map((tag) => tag.trim().toLowerCase()));
  const tags = raw
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= TAG_MAX && !tag.includes(","))
    .filter((tag) => !existing.has(tag));

  return [...new Set(tags)].slice(0, MAX_SUGGESTED_TAGS);
}
