"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveMonacoLanguage } from "@/lib/monaco-language";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse bg-card" />,
});

const MIN_HEIGHT = 128;
const MAX_HEIGHT = 400;

const THEME_NAME = "devstash-dark";

function defineDevstashTheme(monaco: Parameters<OnMount>[1]) {
  monaco.editor.defineTheme(THEME_NAME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#171717",
      "editor.lineHighlightBackground": "#26262680",
      "editorLineNumber.foreground": "#525252",
      "editorLineNumber.activeForeground": "#a3a3a3",
      "editorIndentGuide.background": "#262626",
      "editorGutter.background": "#171717",
      "editorWidget.background": "#171717",
      "editorWidget.border": "#ffffff1a",
      "scrollbarSlider.background": "#40404066",
      "scrollbarSlider.hoverBackground": "#52525280",
      "scrollbarSlider.activeBackground": "#737373",
    },
  });
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: string | null;
  readOnly?: boolean;
}) {
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoLanguage = resolveMonacoLanguage(language);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    defineDevstashTheme(monaco);
    monaco.editor.setTheme(THEME_NAME);

    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight)));
    };
    updateHeight();
    editor.onDidContentSizeChange(updateHeight);
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f56]" />
          <span className="size-3 rounded-full bg-[#ffbd2e]" />
          <span className="size-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-xs text-muted-foreground">{language}</span>
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
      <div style={{ height }} className="transition-[height] duration-150">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          theme={THEME_NAME}
          onChange={(next) => onChange?.(next ?? "")}
          onMount={handleMount}
          options={{
            readOnly,
            domReadOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
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
      </div>
    </div>
  );
}
