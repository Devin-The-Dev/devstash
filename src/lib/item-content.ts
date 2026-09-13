export function getCopyableValue(item: {
  content: string | null;
  url: string | null;
  fileUrl: string | null;
}): string {
  return item.content ?? item.url ?? item.fileUrl ?? "";
}
