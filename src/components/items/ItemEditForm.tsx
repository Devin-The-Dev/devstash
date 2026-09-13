"use client";

import { ItemContentFields } from "@/components/items/ItemContentFields";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type EditForm = {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
};

export function toEditForm(item: {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
}): EditForm {
  return {
    title: item.title,
    description: item.description ?? "",
    content: item.content ?? "",
    url: item.url ?? "",
    language: item.language ?? "",
    tags: item.tags.join(", "),
  };
}

type ItemEditFormProps = {
  typeName: string;
  form: EditForm;
  onChange: (form: EditForm) => void;
};

export function ItemEditForm({ typeName, form, onChange }: ItemEditFormProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>

      <ItemContentFields
        idPrefix="edit"
        typeName={typeName}
        content={form.content}
        language={form.language}
        url={form.url}
        onContentChange={(content) => onChange({ ...form, content })}
        onLanguageChange={(language) => onChange({ ...form, language })}
        onUrlChange={(url) => onChange({ ...form, url })}
      />

      <div className="space-y-1.5">
        <Label htmlFor="edit-tags">Tags</Label>
        <Input
          id="edit-tags"
          placeholder="Comma-separated"
          value={form.tags}
          onChange={(e) => onChange({ ...form, tags: e.target.value })}
        />
      </div>
    </>
  );
}
