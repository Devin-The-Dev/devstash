import { useState } from "react";

export function useCopyToClipboard(delay = 1500) {
  const [copied, setCopied] = useState(false);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), delay);
  }

  return { copied, copy };
}
