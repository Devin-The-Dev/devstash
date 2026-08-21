import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";

export default function ItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ItemDrawerProvider>
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
