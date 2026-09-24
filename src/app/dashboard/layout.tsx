import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { CommandPaletteProvider } from "@/components/search/CommandPaletteProvider";
import { getCollectionsWithStats } from "@/lib/db/collections";
import { getSearchableItems } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const [collections, items] = await Promise.all([
    getCollectionsWithStats(currentUser.id),
    getSearchableItems(currentUser.id),
  ]);

  return (
    <ItemDrawerProvider collections={collections.map((c) => ({ id: c.id, name: c.name }))}>
      <CommandPaletteProvider
        items={items}
        collections={collections.map((c) => ({ id: c.id, name: c.name, itemCount: c.itemCount }))}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <TopBar />
            <div className="flex flex-1">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </CommandPaletteProvider>
    </ItemDrawerProvider>
  );
}
