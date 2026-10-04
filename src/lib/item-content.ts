export function getCopyableValue(item: {
  content: string | null;
  url: string | null;
  fileUrl: string | null;
}): string {
  return item.content ?? item.url ?? item.fileUrl ?? "";
}

/** Splits a comma-separated tag field into trimmed, lowercased, unique tags. */
export function parseTagInput(input: string): string[] {
  const tags = input
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(tags)];
}
