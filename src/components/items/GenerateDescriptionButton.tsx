"use client";

import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateSummary } from "@/actions/ai";

type GenerateDescriptionButtonProps = {
  onGenerate: (description: string) => void;
  // Current, unsaved form values the AI describes.
  title: string;
  content: string;
  typeName: string;
  language?: string;
  url?: string;
  fileName?: string | null;
};

export function GenerateDescriptionButton({
  onGenerate,
  title,
  content,
  typeName,
  language,
  url,
  fileName,
}: GenerateDescriptionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const hasContext = [title, content, url, fileName].some((value) => value?.trim());
  const label = hasContext ? "Generate description" : "Add a title or content first";

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateSummary({
        title,
        content: content || null,
        typeName,
        language: language || null,
        url: url || null,
        fileName: fileName || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onGenerate(result.data.summary);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      disabled={isPending || !hasContext}
      aria-busy={isPending}
      aria-label={isPending ? "Generating description" : label}
      title={label}
      onClick={handleGenerate}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
    </Button>
  );
}
