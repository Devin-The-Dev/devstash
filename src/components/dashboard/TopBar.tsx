import { Search, Plus, FolderPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopBar() {
  return (
    <header className="flex items-center gap-4 border-b px-4 py-3">
      <SidebarTrigger />
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search items, collections, tags..." className="pl-8" />
      </div>
      <Button variant="outline">
        <FolderPlus className="size-4" />
        New collection
      </Button>
      <Button>
        <Plus className="size-4" />
        New item
      </Button>
    </header>
  );
}
