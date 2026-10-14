import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { CloseMobileSidebarOnNavigate } from "@/components/dashboard/SidebarNavLink";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { EditorPreferencesProvider } from "@/components/editor/EditorPreferencesProvider";
import { CommandPaletteProvider } from "@/components/search/CommandPaletteProvider";
import { getCollectionOptions } from "@/lib/db/collections";
import { getCurrentUser } from "@/lib/db/user";

// Shared shell for the signed-in app (dashboard, items, collections, favorites,
// recent, profile, settings, upgrade).
// The route group adds no URL segment.
export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const collections = await getCollectionOptions(currentUser.id);

  return (
    <EditorPreferencesProvider initialPreferences={currentUser.editorPreferences}>
      <ItemDrawerProvider
        collections={collections.map(({ id, name }) => ({ id, name }))}
        isPro={currentUser.isPro}
      >
        <CommandPaletteProvider collections={collections}>
          <SidebarProvider>
            {/* Not inside AppSidebar: on mobile the sidebar's children mount in
                the drawer, so the effect would close it as soon as it opens. */}
            <CloseMobileSidebarOnNavigate />
            <AppSidebar />
            <SidebarInset>
              <TopBar />
              <div className="flex flex-1">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </CommandPaletteProvider>
      </ItemDrawerProvider>
    </EditorPreferencesProvider>
  );
}
