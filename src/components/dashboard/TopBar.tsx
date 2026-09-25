import Link from "next/link";
import { Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { NewCollectionDialog } from "@/components/collections/NewCollectionDialog";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { getCollectionsWithStats } from "@/lib/db/collections";
import { getSystemItemTypes } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

export async function TopBar() {
  const currentUser = await getCurrentUser();
  const [itemTypes, collections] = await Promise.all([
    getSystemItemTypes(),
    getCollectionsWithStats(currentUser.id),
  ]);

  return (
    <header className="flex items-center gap-4 border-b px-4 py-3">
      <SidebarTrigger />
      <div className="max-w-md flex-1">
        <SearchTrigger />
      </div>
      <Link
        href="/favorites"
        aria-label="Favorites"
        title="Favorites"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <Star />
      </Link>
      <NewCollectionDialog />
      <NewItemDialog
        itemTypes={itemTypes}
        collections={collections.map((c) => ({ id: c.id, name: c.name }))}
      />
    </header>
  );
}
