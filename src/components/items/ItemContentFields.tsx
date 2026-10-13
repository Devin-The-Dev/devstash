"use client";

import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languageOptionsFor, toLanguageSelectValue } from "@/lib/monaco-language";
import { CODE_TYPES, CONTENT_TYPES, LANGUAGE_TYPES, MARKDOWN_TYPES, URL_TYPES } from "@/lib/item-type-groups";

type ItemContentFieldsProps = {
  idPrefix: string;
  typeName: string;
  content: string;
  language: string;
  url: string;
  onContentChange: (content: string) => void;
  onLanguageChange: (language: string) => void;
  onUrlChange: (url: string) => void;
  contentPlaceholder?: string;
};

export function ItemContentFields({
  idPrefix,
  typeName,
  content,
  language,
  url,
  onContentChange,
  onLanguageChange,
  onUrlChange,
  contentPlaceholder,
}: ItemContentFieldsProps) {
  const languageOptions = languageOptionsFor(language);

  return (
    <>
      {LANGUAGE_TYPES.includes(typeName) && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-language`}>Language</Label>
          <Select
            items={languageOptions}
            value={toLanguageSelectValue(language)}
            onValueChange={(value) => onLanguageChange(value ?? "")}
          >
            <SelectTrigger id={`${idPrefix}-language`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value ?? "plaintext"} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {CODE_TYPES.includes(typeName) ? (
        <div className="space-y-1.5">
          <Label>Content</Label>
          <CodeEditor value={content} language={language} onChange={onContentChange} />
        </div>
      ) : MARKDOWN_TYPES.includes(typeName) ? (
        <div className="space-y-1.5">
          <Label>Content</Label>
          <MarkdownEditor value={content} onChange={onContentChange} />
        </div>
      ) : (
        CONTENT_TYPES.includes(typeName) && (
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-content`}>Content</Label>
            <Textarea
              id={`${idPrefix}-content`}
              className="min-h-32 font-mono text-xs"
              placeholder={contentPlaceholder}
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
            />
          </div>
        )
      )}

      {URL_TYPES.includes(typeName) && (
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-url`}>URL</Label>
          <Input
            id={`${idPrefix}-url`}
            placeholder="https://…"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>
      )}
    </>
  );
}
