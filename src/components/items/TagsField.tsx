"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateAutoTags } from "@/actions/ai";
import { parseTagInput } from "@/lib/item-content";

type TagsFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isPro: boolean;
  // Item context the AI tags from.
  title: string;
  content: string;
  typeName: string;
};

export function TagsField({
  id,
  value,
  onChange,
  placeholder,
  isPro,
  title,
  content,
  typeName,
}: TagsFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const hasContext = title.trim().length > 0 || content.trim().length > 0;

  function handleSuggest() {
    startTransition(async () => {
      const result = await generateAutoTags({
        title,
        content: content || null,
        typeName,
        existingTags: parseTagInput(value),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSuggestions(result.data.tags);
    });
  }

  function handleAccept(tag: string) {
    onChange([...new Set([...parseTagInput(value), tag])].join(", "));
    setSuggestions((current) => current.filter((t) => t !== tag));
  }

  function handleReject(tag: string) {
    setSuggestions((current) => current.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Tags</Label>
        {isPro && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={isPending || !hasContext}
            aria-busy={isPending}
            title={hasContext ? undefined : "Add a title or content first"}
            onClick={handleSuggest}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {isPending ? "Suggesting…" : "Suggest Tags"}
          </Button>
        )}
      </div>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {suggestions.length > 0 && (
        <div aria-live="polite" className="flex flex-wrap gap-1.5 pt-1">
          {suggestions.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1 border-dashed pr-0.5">
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Add tag ${tag}`}
                onClick={() => handleAccept(tag)}
              >
                <Check />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Dismiss tag ${tag}`}
                onClick={() => handleReject(tag)}
              >
                <X />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
