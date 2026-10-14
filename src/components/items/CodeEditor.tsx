"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExplainCodeButton } from "@/components/items/ExplainCodeButton";
import { explainCode } from "@/actions/ai";
import { resolveMonacoLanguage } from "@/lib/monaco-language";
import { defineMonacoThemes, monacoThemeName } from "@/lib/monaco-themes";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useEditorPreferences } from "@/components/editor/EditorPreferencesProvider";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-card" />,
});

const MIN_HEIGHT = 128;
const MAX_HEIGHT = 400;

// Enables the AI "Explain" button. Only passed from the drawer's read view.
type ExplainOptions = {
  title: string;
  typeName: "Snippet" | "Command";
  isPro: boolean;
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  explain,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
  explain?: ExplainOptions;
}) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [tab, setTab] = useState<"code" | "explain">("code");
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, startExplaining] = useTransition();
  const { copied, copy } = useCopyToClipboard();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoLanguage = resolveMonacoLanguage(language);
  const { preferences } = useEditorPreferences();

  // Tab size is a model option, so editor.updateOptions() doesn't reach the existing model.
  useEffect(() => {
    editorRef.current?.getModel()?.updateOptions({ tabSize: preferences.tabSize });
  }, [preferences.tabSize]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.getModel()?.updateOptions({ tabSize: preferences.tabSize });

    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
    };
    updateHeight();
    editor.onDidContentSizeChange(updateHeight);
  };

  async function handleCopy() {
    await copy(value);
  }

  function handleExplain() {
    if (!explain) return;
    startExplaining(async () => {
      const result = await explainCode({
        title: explain.title,
        content: value,
        typeName: explain.typeName,
        language: language ?? null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setExplanation(result.data.explanation);
      setTab("explain");
    });
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => setTab(next as "code" | "explain")}
      className="gap-0 overflow-hidden rounded-md border border-border"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-3 py-2">
        {explanation ? (
          <TabsList variant="line" className="h-auto bg-transparent p-0">
            <TabsTrigger value="code" className="h-7 px-2 text-xs">
              Code
            </TabsTrigger>
            <TabsTrigger value="explain" className="h-7 px-2 text-xs">
              Explain
            </TabsTrigger>
          </TabsList>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="size-3 rounded-full bg-[#ff5f56]" />
            <span className="size-3 rounded-full bg-[#ffbd2e]" />
            <span className="size-3 rounded-full bg-[#27c93f]" />
          </div>
        )}
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-xs text-muted-foreground">{language}</span>
          )}
          {explain && (
            <ExplainCodeButton
              isPro={explain.isPro}
              isPending={isExplaining}
              onExplain={handleExplain}
            />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Copy code"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </div>
      {/* keepMounted so Monaco isn't torn down and re-created on every tab switch. */}
      <TabsContent
        value="code"
        keepMounted
        style={{ height }}
        className="flex-none transition-[height] duration-150"
      >
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          theme={monacoThemeName(preferences.theme)}
          onChange={(next) => onChange?.(next ?? "")}
          beforeMount={defineMonacoThemes}
          onMount={handleMount}
          options={{
            readOnly,
            domReadOnly: readOnly,
            minimap: { enabled: preferences.minimap },
            fontSize: preferences.fontSize,
            tabSize: preferences.tabSize,
            detectIndentation: false,
            wordWrap: preferences.wordWrap ? "on" : "off",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderLineHighlight: readOnly ? "none" : "all",
            contextmenu: !readOnly,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              useShadows: false,
            },
            padding: { top: 12, bottom: 12 },
          }}
        />
      </TabsContent>
      {explanation && (
        <TabsContent
          value="explain"
          className="overflow-auto p-3"
          style={{ minHeight: height, maxHeight: MAX_HEIGHT }}
        >
          <div className="markdown-preview">
            <Markdown remarkPlugins={[remarkGfm]}>{explanation}</Markdown>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
