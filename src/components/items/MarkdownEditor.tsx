"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (readOnly || tab !== "write") return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, el.scrollHeight)));
  }, [value, tab, readOnly]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        <div className="flex items-center justify-between border-b border-border bg-[#2d2d2d] px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">Preview</span>
          {copyButton}
        </div>
        <div className="overflow-auto p-3" style={{ maxHeight: MAX_HEIGHT }}>
          <Preview value={value} />
        </div>
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
