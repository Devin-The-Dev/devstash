"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiFeatureButton } from "@/components/items/AiFeatureButton";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { optimizePrompt } from "@/actions/ai";
import type { PromptOptimization } from "@/lib/ai";

const MIN_HEIGHT = 128;
const MAX_HEIGHT = 400;

function Preview({ value }: { value: string }) {
  if (!value) {
    return <p className="text-xs text-muted-foreground">Nothing to preview</p>;
  }
  return (
    <div className="markdown-preview">
      <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
    </div>
  );
}

// Enables the AI "Optimize" button. Only passed from the drawer's read view.
type OptimizeOptions = {
  title: string;
  isPro: boolean;
  // Saves the accepted prompt; resolves to whether the save succeeded.
  onAccept: (prompt: string) => Promise<boolean>;
};

function OptimizedPrompt({
  optimization,
  isSaving,
  onAccept,
  onDiscard,
}: {
  optimization: PromptOptimization;
  isSaving: boolean;
  onAccept: () => void;
  onDiscard: () => void;
}) {
  return (
    <>
      <div className="overflow-auto p-3" style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}>
        <Preview value={optimization.optimizedPrompt} />
      </div>
      <div className="space-y-3 border-t border-border bg-[#2d2d2d] p-3">
        {optimization.changes.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">What changed</p>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-foreground">
              {optimization.changes.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs whitespace-nowrap text-muted-foreground">Use the optimized prompt?</p>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={onDiscard}
            >
              Discard
            </Button>
            <Button type="button" size="sm" disabled={isSaving} onClick={onAccept}>
              Use optimized prompt
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  optimize,
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  optimize?: OptimizeOptions;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const { copied, copy } = useCopyToClipboard();
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [viewTab, setViewTab] = useState<"original" | "optimized">("original");
  const [optimization, setOptimization] = useState<PromptOptimization | null>(null);
  const [isOptimizing, startOptimizing] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (readOnly || tab !== "write") return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight)));
  }, [value, tab, readOnly]);

  async function handleCopy() {
    await copy(value);
  }

  function handleOptimize() {
    if (!optimize) return;
    startOptimizing(async () => {
      const result = await optimizePrompt({ title: optimize.title, content: value });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (result.data.unchanged) {
        toast.success("This prompt already looks good. No changes suggested.");
        return;
      }
      setOptimization(result.data);
      setViewTab("optimized");
    });
  }

  function handleDiscard() {
    setOptimization(null);
    setViewTab("original");
  }

  function handleAccept() {
    if (!optimize || !optimization) return;
    startSaving(async () => {
      const saved = await optimize.onAccept(optimization.optimizedPrompt);
      if (saved) handleDiscard();
    });
  }

  const copyButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Copy"
      onClick={handleCopy}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </Button>
  );

  if (readOnly) {
    return (
      <div className="overflow-hidden rounded-md border border-border bg-[#1e1e1e]">
        <Tabs
          value={viewTab}
          onValueChange={(next) => setViewTab(next as "original" | "optimized")}
          className="gap-0"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-[#2d2d2d] px-3 py-2">
            {optimization ? (
              <TabsList variant="line" className="h-auto bg-transparent p-0">
                <TabsTrigger value="original" className="h-7 px-2 text-xs">
                  Original
                </TabsTrigger>
                <TabsTrigger value="optimized" className="h-7 px-2 text-xs">
                  Optimized
                </TabsTrigger>
              </TabsList>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
            )}
            <div className="flex items-center gap-1">
              {optimize && (
                <AiFeatureButton
                  label="Optimize prompt"
                  pendingLabel="Optimizing prompt"
                  isPro={optimize.isPro}
                  // Also blocked while an accepted prompt saves; a new result would be discarded.
                  isPending={isOptimizing || isSaving}
                  onClick={handleOptimize}
                />
              )}
              {copyButton}
            </div>
          </div>
          <TabsContent value="original" className="m-0 overflow-auto p-3" style={{ maxHeight: MAX_HEIGHT }}>
            <Preview value={value} />
          </TabsContent>
          {optimization && (
            <TabsContent value="optimized" className="m-0">
              <OptimizedPrompt
                optimization={optimization}
                isSaving={isSaving}
                onAccept={handleAccept}
                onDiscard={handleDiscard}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-[#1e1e1e]">
      <Tabs value={tab} onValueChange={(next) => setTab(next as "write" | "preview")}>
        <div className="flex items-center justify-between border-b border-border bg-[#2d2d2d] px-3 py-2">
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger value="write" className="h-7 px-2 text-xs">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-7 px-2 text-xs">
              Preview
            </TabsTrigger>
          </TabsList>
          {copyButton}
        </div>

        <TabsContent value="write" className="m-0">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Write markdown…"
            style={{ height, maxHeight: MAX_HEIGHT }}
            className="w-full resize-none overflow-y-auto bg-transparent p-3 font-mono text-xs text-foreground outline-none"
          />
        </TabsContent>

        <TabsContent
          value="preview"
          className="m-0 overflow-auto p-3"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        >
          <Preview value={value} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
