import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { getCollectionsWithStats } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";

export default async function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const collections = await getCollectionsWithStats(currentUser.id);

  return (
    <ItemDrawerProvider collections={collections.map((c) => ({ id: c.id, name: c.name }))}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
          <div className="flex flex-1">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ItemDrawerProvider>
  );
}
