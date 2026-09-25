"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      </div>
    </div>
  );
}
