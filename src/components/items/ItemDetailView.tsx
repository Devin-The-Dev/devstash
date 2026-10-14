"use client";

import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { formatFileSize } from "@/lib/format";
import { CODE_TYPES, MARKDOWN_TYPES } from "@/lib/item-type-groups";
import type { DrawerItem } from "@/hooks/use-item-detail";

export function ItemDetailView({
  item,
  isPro,
  onReplaceContent,
}: {
  item: DrawerItem;
  isPro: boolean;
  onReplaceContent: (content: string) => Promise<boolean>;
}) {
  return (
    <>
      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}

      {item.content && CODE_TYPES.includes(item.type.name) && (
        <CodeEditor
          // Remount on item or content change so a stale explanation isn't shown.
          key={`${item.id}-${item.updatedAt}`}
          value={item.content}
          language={item.language}
          readOnly
          explain={{
            title: item.title,
            typeName: item.type.name as "Snippet" | "Command",
            isPro,
          }}
        />
      )}

      {item.content && MARKDOWN_TYPES.includes(item.type.name) && (
        <MarkdownEditor
          // Remount on item or content change so a stale optimization isn't shown.
          key={`${item.id}-${item.updatedAt}`}
          value={item.content}
          readOnly
          optimize={
            item.type.name === "Prompt"
              ? { title: item.title, isPro, onAccept: onReplaceContent }
              : undefined
          }
        />
      )}

      {item.content &&
        !CODE_TYPES.includes(item.type.name) &&
        !MARKDOWN_TYPES.includes(item.type.name) && (
          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
            {item.content}
          </pre>
        )}

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="truncate text-sm text-primary hover:underline"
        >
          {item.url}
        </a>
      )}

      {item.type.name === "Image" && item.fileUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.fileUrl}
          alt={item.title}
          className="max-h-64 w-full rounded-md object-contain"
        />
      )}

      {item.fileName && (
        <div className="flex items-center justify-between gap-2 rounded-md border p-3">
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {item.fileName}
            {item.fileSize ? ` · ${formatFileSize(item.fileSize)}` : ""}
          </p>
          {item.type.name === "File" && (
            <a
              href={`/api/items/${item.id}/download`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download className="size-4" />
              Download
            </a>
          )}
        </div>
      )}

      {item.language && !(item.content && CODE_TYPES.includes(item.type.name)) && (
        <Badge variant="secondary" className="w-fit text-xs">
          {item.language}
        </Badge>
      )}

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
