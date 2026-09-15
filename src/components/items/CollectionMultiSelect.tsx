"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CollectionOption } from "@/lib/db/collections";

type CollectionMultiSelectProps = {
  collections: CollectionOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function CollectionMultiSelect({
  collections,
  selectedIds,
  onChange,
}: CollectionMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = collections.filter((collection) => selectedIds.includes(collection.id));

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((existing) => existing !== id));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" className="w-full justify-between font-normal" />}
      >
        <span className={`truncate text-left ${selected.length === 0 ? "text-muted-foreground" : ""}`}>
          {selected.length === 0 ? "None" : selected.map((collection) => collection.name).join(", ")}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {collections.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">No collections yet</p>
        ) : (
          <div className="max-h-56 overflow-y-auto">
            {collections.map((collection) => {
              const checked = selectedIds.includes(collection.id);
              return (
                <label
                  key={collection.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => toggle(collection.id, value === true)}
                  />
                  <span className="truncate">{collection.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
